/**
 * Question Pool — unified runtime registry for all questions (static + generated).
 * Replaces direct questionBank access throughout the app.
 *
 * On first access, seeds with the static question bank.
 * generateFresh() produces new questions on demand and registers them.
 * getById() looks up any question by ID (static or generated).
 */
import type { Question, SectionType, Difficulty } from '../types';
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

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  // Seed with static question bank
  for (const q of questionBank) {
    questionMap.set(q.id, q);
  }

  // Seed with static visual configs
  for (const [id, vc] of Object.entries(questionVisuals)) {
    visualConfigMap.set(id, vc);
  }
  for (const [id, nvc] of Object.entries(numberShapeVisuals)) {
    nsVisualConfigMap.set(id, nvc);
  }
}

// ── Public API ──────────────────────────────────────────────────────────

/** Get a question by ID (works for both static and generated). */
export function getQuestionById(id: string): Question | undefined {
  ensureInitialized();
  return questionMap.get(id);
}

/** Get visual config for a shape question. */
export function getVisualConfig(id: string): VisualConfig | undefined {
  ensureInitialized();
  return visualConfigMap.get(id);
}

/** Get NS visual config for a numbers-in-shapes question. */
export function getNSVisualConfig(id: string): NSVisualConfig | undefined {
  ensureInitialized();
  return nsVisualConfigMap.get(id);
}

/**
 * Generate fresh questions for a section and register them.
 * Returns newly generated Question objects ready for session use.
 * Questions are unique — never duplicates from previous calls.
 */
export function generateFresh(
  sectionType: SectionType,
  difficulty: Difficulty,
  count: number,
): Question[] {
  ensureInitialized();

  switch (sectionType) {
    case 'math': {
      const questions = generateMathQuestions(difficulty, count);
      for (const q of questions) questionMap.set(q.id, q);
      return questions;
    }

    case 'sentence_completion': {
      const questions = generateSentenceQuestions(difficulty, count);
      for (const q of questions) questionMap.set(q.id, q);
      return questions;
    }

    case 'word_relations': {
      const questions = generateWordRelQuestions(difficulty, count);
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
 * Get all registered questions for a section type (static + generated).
 * Useful for adaptive mode which needs to query across all available questions.
 */
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

/**
 * Get total count of registered questions.
 */
export function getPoolSize(): number {
  ensureInitialized();
  return questionMap.size;
}
