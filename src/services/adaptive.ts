import type {
  Question,
  SkillStats,
  SectionType,
  SkillTag,
  Difficulty,
  Recommendation,
} from '../types';
import { storage } from './storage';
import { questionBank } from '../data/questions';
import { SECTION_CONFIGS } from '../config/sections';

// ── Mastery Update ─────────────────────────────────────────────────

/**
 * Update mastery score after answering a question.
 *
 * Correct answer: +5 to +15 (more if fast, less if slow)
 * Wrong answer:   -8 to -15 (less penalty if slow = thoughtful, more if fast = careless)
 * Clamp to 0-100. Tracks last 10 results.
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

  // Calculate time ratio (< 1 means faster than recommended)
  const timeRatio = recommendedTimeSec > 0 ? timeSec / recommendedTimeSec : 1;

  let delta: number;

  if (isCorrect) {
    // Fast & correct -> bigger reward, slow & correct -> smaller reward
    // Range: +5 (very slow) to +15 (very fast)
    const speedBonus = Math.max(0, Math.min(1, 1.5 - timeRatio)); // 0..1
    delta = 5 + speedBonus * 10; // 5..15
  } else {
    // Fast & wrong -> bigger penalty (careless), slow & wrong -> smaller penalty (thoughtful)
    // Range: -8 (slow) to -15 (fast)
    const carelessFactor = Math.max(0, Math.min(1, 1 - timeRatio * 0.5)); // 0..1
    delta = -(8 + carelessFactor * 7); // -8..-15
  }

  // Update mastery score
  stats.masteryScore = Math.max(0, Math.min(100, stats.masteryScore + delta));

  // Update counters
  stats.attempts += 1;
  if (isCorrect) stats.correctCount += 1;

  // Update average time
  stats.avgTimeSec =
    (stats.avgTimeSec * (stats.attempts - 1) + timeSec) / stats.attempts;

  // Track recent results (keep last 10)
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
 * Distribution: 60% weak areas, 25% mixed reinforcement, 15% strong areas (confidence).
 */
export function selectAdaptiveQuestions(
  userId: string,
  count: number
): Question[] {
  const weakSkills = getWeakSkills(userId);
  const strongSkills = getStrongSkills(userId);
  const allStats = storage.getSkillStats(userId);

  const weakCount = Math.round(count * 0.6);
  const mixedCount = Math.round(count * 0.25);
  const strongCount = count - weakCount - mixedCount;

  const selected: Question[] = [];
  const usedIds = new Set<string>();

  // Helper: pick random questions matching criteria
  const pickQuestions = (
    filter: (q: Question) => boolean,
    needed: number
  ): void => {
    const candidates = questionBank.filter(
      (q) => q.isActive && !usedIds.has(q.id) && filter(q)
    );
    shuffleArray(candidates);
    for (const q of candidates) {
      if (selected.length >= count || needed <= 0) break;
      selected.push(q);
      usedIds.add(q.id);
      needed--;
    }
  };

  // 1. Weak area questions (60%)
  if (weakSkills.length > 0) {
    const weakTags = new Set(weakSkills.map((s) => s.skillTag));
    pickQuestions((q) => weakTags.has(q.skillTag), weakCount);
  }

  // 2. Mixed reinforcement (25%) — pick from skills with medium mastery
  const mediumTags = new Set(
    allStats
      .filter((s) => s.masteryScore >= 40 && s.masteryScore <= 70)
      .map((s) => s.skillTag)
  );
  pickQuestions((q) => mediumTags.has(q.skillTag), mixedCount);

  // 3. Strong area questions (15%) — confidence building
  if (strongSkills.length > 0) {
    const strongTags = new Set(strongSkills.map((s) => s.skillTag));
    pickQuestions((q) => strongTags.has(q.skillTag), strongCount);
  }

  // Fill remaining spots with any available questions
  if (selected.length < count) {
    pickQuestions(() => true, count - selected.length);
  }

  return selected;
}

// ── Skill Classification ───────────────────────────────────────────

/** Get weak skills — mastery below 40, or 3+ wrong in a row recently. */
export function getWeakSkills(userId: string): SkillStats[] {
  const allStats = storage.getSkillStats(userId);
  return allStats.filter((s) => {
    if (s.masteryScore < 40) return true;
    // Check for 3 wrong in a row at the end of recentResults
    const recent = s.recentResults;
    if (recent.length >= 3) {
      const lastThree = recent.slice(-3);
      if (lastThree.every((r) => !r)) return true;
    }
    return false;
  });
}

/** Get strong skills — mastery above 75. */
export function getStrongSkills(userId: string): SkillStats[] {
  const allStats = storage.getSkillStats(userId);
  return allStats.filter((s) => s.masteryScore > 75);
}

// ── Weekly Plan Generation ─────────────────────────────────────────

/** Generate weekly practice plan recommendations based on weak/strong skills. */
export function generateWeeklyPlan(userId: string): Recommendation[] {
  const weakSkills = getWeakSkills(userId);
  const allStats = storage.getSkillStats(userId);
  const recommendations: Recommendation[] = [];

  // Find section-level config for Hebrew names
  const skillNameMap = new Map<string, string>();
  for (const sec of SECTION_CONFIGS) {
    for (const skill of sec.skills) {
      skillNameMap.set(skill.tag, skill.nameHe);
    }
  }

  // Recommendation for each weak skill
  for (const stat of weakSkills) {
    const skillName = skillNameMap.get(stat.skillTag) ?? stat.skillTag;
    const sectionConfig = SECTION_CONFIGS.find(
      (s) => s.type === stat.sectionType
    );
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

  // If there are no weak skills, encourage maintenance
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

  // Generate a general practice plan recommendation
  recommendations.push({
    id: `rec_${Date.now()}_weekly`,
    userId,
    createdAt: new Date().toISOString(),
    type: 'practice_plan',
    payload: {
      message: `תוכנית שבועית: ${weakSkills.length > 0 ? `יש ${weakSkills.length} נושאים לחיזוק` : 'תרגול שמירה על רמה'}`,
      suggestedQuestions: weakSkills.length > 0 ? weakSkills.length * 10 : 20,
      suggestedMinutes: weakSkills.length > 0 ? weakSkills.length * 15 : 30,
    },
    status: 'active',
  });

  // Save all recommendations
  for (const rec of recommendations) {
    storage.saveRecommendation(rec);
  }

  return recommendations;
}

// ── Adaptive Difficulty ────────────────────────────────────────────

/**
 * Determine appropriate difficulty based on mastery score.
 * Low mastery -> easy, medium -> medium, high -> hard.
 */
export function getAdaptiveDifficulty(masteryScore: number): Difficulty {
  if (masteryScore < 35) return 'easy';
  if (masteryScore < 65) return 'medium';
  return 'hard';
}

// ── Utilities ──────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
