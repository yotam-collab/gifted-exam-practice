/**
 * Question Pool — unified runtime registry for all questions (static + generated).
 * Replaces direct questionBank access throughout the app.
 *
 * On first access, seeds with the static question bank.
 * generateFresh() produces new questions on demand and registers them.
 * getById() looks up any question by ID (static or generated).
 *
 * selectForSection() — the new "smart picker" — blends manual bank questions
 * with freshly generated ones and avoids ids the child has seen recently.
 */
import type { Question, SectionType, Difficulty, SkillTag, MathSkill, SentenceSkill, WordRelationSkill } from '../types';
import { questionBank } from '../data/questions';
import { questionVisuals, type VisualConfig } from '../data/shapeVisuals';
import { numberShapeVisuals, type NSVisualConfig } from '../data/numberShapeVisuals';

import { generateMathQuestions } from '../generators/mathGen';
import { generateSentenceQuestions } from '../generators/sentenceGen';
import { generateWordRelQuestions } from '../generators/wordRelGen';
import { generateShapeQuestions } from '../generators/shapeGen';
import { generateNSQuestions } from '../generators/numberShapeGen';

// ── Runtime registries ──────────────────────────────────────────────────

const questionMap = new Map<string, Question>();
const visualConfigMap = new Map<string, VisualConfig>();
const nsVisualConfigMap = new Map<string, NSVisualConfig>();

// Recently-shown IDs from the manual bank — used to avoid the child seeing
// the same hand-crafted item twice in close succession across sessions.
const recentManualIds: string[] = [];
const RECENT_LIMIT = 60;
function rememberManualId(id: string) {
  recentManualIds.push(id);
  while (recentManualIds.length > RECENT_LIMIT) recentManualIds.shift();
}

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  for (const q of questionBank) {
    questionMap.set(q.id, q);
  }
  for (const [id, vc] of Object.entries(questionVisuals)) {
    visualConfigMap.set(id, vc);
  }
  for (const [id, nvc] of Object.entries(numberShapeVisuals)) {
    nsVisualConfigMap.set(id, nvc);
  }
}

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ── Public API ──────────────────────────────────────────────────────────

export function getQuestionById(id: string): Question | undefined {
  ensureInitialized();
  return questionMap.get(id);
}

export function getVisualConfig(id: string): VisualConfig | undefined {
  ensureInitialized();
  return visualConfigMap.get(id);
}

export function getNSVisualConfig(id: string): NSVisualConfig | undefined {
  ensureInitialized();
  return nsVisualConfigMap.get(id);
}

/**
 * Generate fresh questions for a section and register them.
 * (Existing API — preserved for adaptive/legacy callers.)
 */
export function generateFresh(
  sectionType: SectionType,
  difficulty: Difficulty,
  count: number,
  options?: { skill?: SkillTag },
): Question[] {
  ensureInitialized();

  switch (sectionType) {
    case 'math': {
      const questions = generateMathQuestions(difficulty, count, {
        skill: options?.skill as MathSkill | undefined,
      });
      for (const q of questions) questionMap.set(q.id, q);
      return questions;
    }

    case 'sentence_completion': {
      const questions = generateSentenceQuestions(difficulty, count, {
        skill: options?.skill as SentenceSkill | undefined,
      });
      for (const q of questions) questionMap.set(q.id, q);
      return questions;
    }

    case 'word_relations': {
      const questions = generateWordRelQuestions(difficulty, count, {
        skill: options?.skill as WordRelationSkill | undefined,
      });
      for (const q of questions) questionMap.set(q.id, q);
      return questions;
    }

    case 'shapes': {
      const items = generateShapeQuestions(difficulty, count);
      const questions: Question[] = [];
      for (const item of items) {
        questionMap.set(item.question.id, item.question);
        visualConfigMap.set(item.question.id, item.visualConfig);
        questions.push(item.question);
      }
      return questions;
    }

    case 'numbers_in_shapes': {
      const items = generateNSQuestions(difficulty, count);
      const questions: Question[] = [];
      for (const item of items) {
        questionMap.set(item.question.id, item.question);
        nsVisualConfigMap.set(item.question.id, item.nsVisualConfig);
        questions.push(item.question);
      }
      return questions;
    }

    default:
      return [];
  }
}

/**
 * Smart picker: blends carefully-authored manual questions with generators.
 *
 * Real Stage B prep benefits from a mix:
 *   - manual bank items have polished distractors and explanations
 *   - generators give infinite variety and difficulty calibration
 *
 * We aim for ~50% manual when available, and never repeat IDs the child saw
 * in their last few sessions.
 */
export function selectForSection(
  sectionType: SectionType,
  difficulty: Difficulty,
  count: number,
  options?: { skill?: SkillTag; manualShare?: number },
): Question[] {
  ensureInitialized();

  const recentSet = new Set(recentManualIds);

  // Collect manual candidates from the static bank that match the request.
  const manualPool = questionBank.filter(q => {
    if (q.sectionType !== sectionType) return false;
    if (!q.isActive) return false;
    if (options?.skill && q.skillTag !== options.skill) return false;
    if (difficulty !== 'adaptive' && q.difficulty !== difficulty) return false;
    // In adaptive mode (the default practice mode), lift the floor: don't dilute
    // with easy authored items. A gifted-exam prep session should stretch, and
    // the generators produce genuinely exam-level content at medium/hard.
    if (difficulty === 'adaptive' && q.difficulty === 'easy') return false;
    return true;
  });

  // Prefer manual items the child hasn't seen recently. If the recent buffer
  // shadows the entire pool, allow recents back in (better than starving).
  const fresh = manualPool.filter(q => !recentSet.has(q.id));
  const manualOrdered = shuffle(fresh.length > 0 ? fresh : manualPool);

  const manualShare = options?.manualShare ?? 0.5;
  const desiredManual = Math.min(manualOrdered.length, Math.round(count * manualShare));
  const manualPicked = manualOrdered.slice(0, desiredManual);
  for (const q of manualPicked) rememberManualId(q.id);

  const remaining = count - manualPicked.length;
  const generated = remaining > 0
    ? generateFresh(sectionType, difficulty, remaining, options)
    : [];

  return shuffle([...manualPicked, ...generated]);
}

export function getAllForSection(sectionType: SectionType): Question[] {
  ensureInitialized();
  const result: Question[] = [];
  for (const q of questionMap.values()) {
    if (q.sectionType === sectionType && q.isActive) {
      result.push(q);
    }
  }
  return result;
}

export function getPoolSize(): number {
  ensureInitialized();
  return questionMap.size;
}

/** Reset the recent-ids buffer — used by tests / "start fresh" flows. */
export function resetRecentBuffer() {
  recentManualIds.length = 0;
}
