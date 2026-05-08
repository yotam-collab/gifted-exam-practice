import type {
  Question,
  SkillStats,
  SectionType,
  SkillTag,
  Difficulty,
  Recommendation,
} from '../types';
import { storage } from './storage';
import { selectForSection, generateFresh } from './questionPool';
import { SECTION_CONFIGS } from '../config/sections';

// ── Mastery Update ─────────────────────────────────────────────────

/**
 * Update mastery score after answering a question.
 *
 * Cognitive-training research on 7-year-olds suggests staying in the 70–85%
 * success band, so the deltas are tuned to be gentler than before:
 *   correct: +3 to +10
 *   wrong:  -5 to -10
 * (Previous +5..+15 / -8..-15 swings were too volatile and ping-ponged the
 * "weak skill" flag after a single bad day.)
 */
export function updateMastery(
  userId: string,
  sectionType: SectionType,
  skillTag: SkillTag,
  isCorrect: boolean,
  timeSec: number,
  recommendedTimeSec: number
): SkillStats {
  let stats = storage.getSkillStat(userId, sectionType, skillTag);

  if (!stats) {
    stats = {
      id: `${userId}_${sectionType}_${skillTag}`,
      userId,
      sectionType,
      skillTag,
      masteryScore: 50,
      attempts: 0,
      correctCount: 0,
      avgTimeSec: 0,
      lastUpdated: new Date().toISOString(),
      recentResults: [],
    };
  }

  const timeRatio = recommendedTimeSec > 0 ? timeSec / recommendedTimeSec : 1;
  let delta: number;
  if (isCorrect) {
    const speedBonus = Math.max(0, Math.min(1, 1.5 - timeRatio));
    delta = 3 + speedBonus * 7; // +3 .. +10
  } else {
    const carelessFactor = Math.max(0, Math.min(1, 1 - timeRatio * 0.5));
    delta = -(5 + carelessFactor * 5); // -5 .. -10
  }

  stats.masteryScore = Math.max(0, Math.min(100, stats.masteryScore + delta));
  stats.attempts += 1;
  if (isCorrect) stats.correctCount += 1;
  stats.avgTimeSec =
    (stats.avgTimeSec * (stats.attempts - 1) + timeSec) / stats.attempts;

  stats.recentResults.push(isCorrect);
  if (stats.recentResults.length > 10) {
    stats.recentResults = stats.recentResults.slice(-10);
  }

  stats.lastUpdated = new Date().toISOString();
  storage.saveSkillStats(stats);
  return stats;
}

// ── Adaptive Question Selection ────────────────────────────────────

/**
 * Select next questions for adaptive mode.
 *
 * Key changes from the previous implementation:
 *   • Targets specific weak SKILLS, not just sections — so a child weak in
 *     `time_clock` actually gets time-clock practice (the old engine averaged
 *     all skills in a section and missed the specific gap).
 *   • Pulls from the manual bank first (carefully-authored items with good
 *     distractors), tops up with generated content.
 *   • Aims for the Vygotsky 70–85% productive band: easy-skewed for weak
 *     skills (build confidence), medium for unknown skills, hard only on
 *     skills the child has actually mastered.
 */
export function selectAdaptiveQuestions(
  userId: string,
  count: number
): Question[] {
  const allStats = storage.getSkillStats(userId);
  const weakStats = getWeakSkills(userId);
  const strongStats = getStrongSkills(userId);

  const allSections: SectionType[] = ['math', 'sentence_completion', 'word_relations', 'shapes', 'numbers_in_shapes'];

  // Allocation: 60% weak-skill targeting, 25% mixed reinforcement, 15% stretch.
  const weakBudget = Math.round(count * 0.6);
  const mixedBudget = Math.round(count * 0.25);
  const stretchBudget = Math.max(0, count - weakBudget - mixedBudget);

  const selected: Question[] = [];

  // 1) Weak SKILLS — easy-leaning to rebuild confidence.
  if (weakStats.length > 0 && weakBudget > 0) {
    const weakSorted = [...weakStats].sort((a, b) => a.masteryScore - b.masteryScore);
    const perSkill = Math.max(1, Math.ceil(weakBudget / Math.min(weakStats.length, 4)));
    for (const s of weakSorted.slice(0, 4)) {
      if (selected.length >= weakBudget) break;
      const need = Math.min(perSkill, weakBudget - selected.length);
      // Easy if mastery <30, otherwise medium.
      const diff: Difficulty = s.masteryScore < 30 ? 'easy' : 'medium';
      selected.push(...selectForSection(s.sectionType, diff, need, { skill: s.skillTag }));
    }
  }

  // 2) Mixed reinforcement across all sections, medium difficulty.
  if (selected.length < weakBudget + mixedBudget) {
    const need = weakBudget + mixedBudget - selected.length;
    const perSection = Math.max(1, Math.ceil(need / allSections.length));
    for (const sType of shuffle(allSections)) {
      if (selected.length >= weakBudget + mixedBudget) break;
      const slice = Math.min(perSection, weakBudget + mixedBudget - selected.length);
      selected.push(...selectForSection(sType, 'medium', slice));
    }
  }

  // 3) Stretch on strong skills only — hard items where mastery >75.
  if (stretchBudget > 0 && strongStats.length > 0) {
    const strongSorted = [...strongStats].sort((a, b) => b.masteryScore - a.masteryScore);
    const perSkill = Math.max(1, Math.ceil(stretchBudget / Math.min(strongStats.length, 3)));
    for (const s of strongSorted.slice(0, 3)) {
      if (selected.length >= count) break;
      const need = Math.min(perSkill, count - selected.length);
      selected.push(...selectForSection(s.sectionType, 'hard', need, { skill: s.skillTag }));
    }
  }

  // Top up if nothing's been seen yet (cold start)
  if (selected.length < count) {
    const fallbackSections = allStats.length === 0 ? shuffle(allSections) : allSections;
    for (const sType of fallbackSections) {
      if (selected.length >= count) break;
      const slice = Math.min(2, count - selected.length);
      selected.push(...selectForSection(sType, 'medium', slice));
    }
  }

  // Drop accidental duplicates (manual bank reuse) and trim to exact count.
  const seen = new Set<string>();
  const deduped: Question[] = [];
  for (const q of shuffle(selected)) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    deduped.push(q);
    if (deduped.length === count) break;
  }
  // Pad if dedup left us short
  while (deduped.length < count) {
    const sType = pick(allSections);
    const extra = generateFresh(sType, 'medium', 1);
    if (extra[0] && !seen.has(extra[0].id)) {
      seen.add(extra[0].id);
      deduped.push(extra[0]);
    } else {
      break;
    }
  }
  return deduped;
}

// ── Skill Classification ───────────────────────────────────────────

/** Get weak skills — mastery below 40, or 3 wrong in a row recently. */
export function getWeakSkills(userId: string): SkillStats[] {
  const allStats = storage.getSkillStats(userId);
  return allStats.filter((s) => {
    if (s.masteryScore < 40) return true;
    const recent = s.recentResults;
    if (recent.length >= 3) {
      const lastThree = recent.slice(-3);
      if (lastThree.every((r) => !r)) return true;
    }
    return false;
  });
}

export function getStrongSkills(userId: string): SkillStats[] {
  const allStats = storage.getSkillStats(userId);
  return allStats.filter((s) => s.masteryScore > 75);
}

// ── Weekly Plan Generation ─────────────────────────────────────────

export function generateWeeklyPlan(userId: string): Recommendation[] {
  const weakSkills = getWeakSkills(userId);
  const allStats = storage.getSkillStats(userId);
  const recommendations: Recommendation[] = [];

  const skillNameMap = new Map<string, string>();
  for (const sec of SECTION_CONFIGS) {
    for (const skill of sec.skills) {
      skillNameMap.set(skill.tag, skill.nameHe);
    }
  }

  for (const stat of weakSkills) {
    const skillName = skillNameMap.get(stat.skillTag) ?? stat.skillTag;
    const sectionConfig = SECTION_CONFIGS.find((s) => s.type === stat.sectionType);
    const sectionName = sectionConfig?.nameHe ?? stat.sectionType;

    recommendations.push({
      id: `rec_${Date.now()}_${stat.skillTag}`,
      userId,
      createdAt: new Date().toISOString(),
      type: 'focus_area',
      payload: {
        message: `מומלץ לתרגל ${skillName} (${sectionName}) — הציון הנוכחי: ${Math.round(stat.masteryScore)}`,
        sectionType: stat.sectionType,
        skillTag: stat.skillTag,
        suggestedQuestions: 10,
        suggestedMinutes: 15,
      },
      status: 'active',
    });
  }

  if (weakSkills.length === 0 && allStats.length > 0) {
    recommendations.push({
      id: `rec_${Date.now()}_encouragement`,
      userId,
      createdAt: new Date().toISOString(),
      type: 'encouragement',
      payload: {
        message: 'כל הכבוד! כל הנושאים ברמה טובה. המשך לתרגל כדי לשמור על הרמה!',
        suggestedQuestions: 5,
        suggestedMinutes: 10,
      },
      status: 'active',
    });
  }

  recommendations.push({
    id: `rec_${Date.now()}_weekly`,
    userId,
    createdAt: new Date().toISOString(),
    type: 'practice_plan',
    payload: {
      message: `תוכנית שבועית: ${weakSkills.length > 0 ? `יש ${weakSkills.length} נושאים לחיזוק` : 'תרגול שמירה על רמה'}`,
      // Research-backed: 15–20 min/day for grade 2 attention span. Daily over weekly.
      suggestedQuestions: weakSkills.length > 0 ? 15 : 10,
      suggestedMinutes: 18,
    },
    status: 'active',
  });

  for (const rec of recommendations) {
    storage.saveRecommendation(rec);
  }

  return recommendations;
}

// ── Adaptive Difficulty ────────────────────────────────────────────

export function getAdaptiveDifficulty(masteryScore: number): Difficulty {
  if (masteryScore < 35) return 'easy';
  if (masteryScore < 70) return 'medium';
  return 'hard';
}

// ── Utilities ──────────────────────────────────────────────────────

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
