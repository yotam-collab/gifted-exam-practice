/**
 * Session launch builders — pure functions that turn user choices into a
 * {mode, config} pair for SessionScreen. Extracted from App.tsx so route
 * adapters can build the state and pass it via router `location.state`.
 */
import type { SessionMode, SessionConfig, SectionType, Difficulty, TimerMode, SkillTag } from '../types';
import { SECTION_CONFIGS } from '../config/sections';

export interface SessionLaunch {
  mode: SessionMode;
  config: SessionConfig;
}

const ALL_SECTIONS: SectionType[] = ['math', 'sentence_completion', 'word_relations', 'shapes', 'numbers_in_shapes'];

export function buildPractice(
  sectionType: SectionType,
  difficulty: Difficulty,
  questionCount: number,
  timerMode: TimerMode,
  skillTag?: SkillTag,
): SessionLaunch {
  const section = SECTION_CONFIGS.find(s => s.type === sectionType)!;
  return {
    mode: 'practice',
    config: {
      sections: [sectionType],
      questionsPerSection: questionCount,
      difficulty,
      timerMode,
      timeLimitSec: timerMode === 'per_section' ? section.defaultTimeSec : undefined,
      skillTag,
    },
  };
}

export function buildAdaptive(): SessionLaunch {
  return {
    mode: 'adaptive',
    config: {
      sections: ALL_SECTIONS,
      questionsPerSection: 5,
      difficulty: 'adaptive',
      timerMode: 'per_question',
    },
  };
}

export function buildMiniExam(
  sections: SectionType[],
  questionsPerSection: number,
  useTimer: boolean,
): SessionLaunch {
  return {
    mode: 'mini_exam',
    config: {
      sections,
      questionsPerSection,
      difficulty: 'medium',
      timerMode: useTimer ? 'per_section' : 'none',
    },
  };
}

export function buildFullExam(): SessionLaunch {
  return {
    mode: 'full_exam',
    config: {
      sections: ALL_SECTIONS,
      questionsPerSection: 0, // 0 = use section defaults
      difficulty: 'medium',
      timerMode: 'per_section',
    },
  };
}

/** Type guard for state arriving via router navigation. */
export function isSessionLaunch(v: unknown): v is SessionLaunch {
  return (
    typeof v === 'object' && v !== null &&
    'mode' in v && 'config' in v &&
    typeof (v as SessionLaunch).config === 'object'
  );
}
