// === Section & Skill Types ===
export type SectionType = 'math' | 'sentence_completion' | 'word_relations' | 'shapes' | 'numbers_in_shapes';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export type QuestionType = 'text' | 'shape_svg';

export type SessionMode = 'practice' | 'adaptive' | 'mini_exam' | 'full_exam';

export type UserRole = 'child' | 'parent';

export type TimerMode = 'none' | 'per_question' | 'per_section';

// === Skill Tags ===
export type MathSkill =
  | 'basic_arithmetic'
  | 'word_problems'
  | 'time_clock'
  | 'money_change'
  | 'multiplication_division'
  | 'number_sequences'
  | 'math_logic';

export type SentenceSkill =
  | 'vocabulary'
  | 'logical_connection'
  | 'semantic_context'
  | 'contrast_completion'
  | 'general_knowledge'
  | 'idioms_proverbs';

export type WordRelationSkill =
  | 'synonyms_antonyms'
  | 'part_whole'
  | 'tool_use'
  | 'material_product'
  | 'category_item'
  | 'cause_effect'
  | 'verbal_analogy';

export type ShapeSkill =
  | 'shape_analogy'
  | 'transformation'
  | 'graphic_pattern'
  | 'odd_one_out'
  | 'fill_frame'
  | 'shape_sequence'
  | 'graphic_rule'
  | 'rotation_position_count'
  | 'fill_frame_direction'
  | 'multi_rule_jump';

export type NumbersInShapesSkill =
  | 'divided_circle'
  | 'number_pyramid'
  | 'number_flow'
  | 'number_grid'
  | 'number_pattern';

export type SkillTag = MathSkill | SentenceSkill | WordRelationSkill | ShapeSkill | NumbersInShapesSkill;

// === Question ===
export interface Question {
  id: string;
  sectionType: SectionType;
  skillTag: SkillTag;
  difficulty: Difficulty;
  questionType: QuestionType;
  stem: string;
  options: string[];
  correctOption: number; // 0-3
  explanation: string;
  recommendedTimeSec: number;
  generatorSource: 'manual' | 'generated';
  qualityScore: number;
  isActive: boolean;
  // For shape questions
  shapeSvg?: ShapeQuestionSvg;
}

export interface ShapeQuestionSvg {
  stemShapes: ShapeDefinition[];
  optionShapes: ShapeDefinition[][];
  layout: 'analogy' | 'series' | 'odd_one_out';
}

export interface ShapeDefinition {
  type: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'rectangle' | 'arrow' | 'plus';
  fill: 'none' | 'solid' | 'striped' | 'dotted' | 'half';
  fillColor: string;
  strokeColor: string;
  rotation: number;
  scale: number;
  x: number;
  y: number;
  border: 'thin' | 'thick' | 'dashed' | 'none';
  innerShape?: ShapeDefinition;
}

// === Session ===
export interface Session {
  id: string;
  userId: string;
  mode: SessionMode;
  startedAt: string;
  endedAt?: string;
  config: SessionConfig;
  totalScore?: number;
  totalTimeSec?: number;
  sections: SessionSection[];
}

export interface SessionConfig {
  sections: SectionType[];
  questionsPerSection: number;
  difficulty: Difficulty;
  timerMode: TimerMode;
  timeLimitSec?: number;
}

export interface SessionSection {
  sectionType: SectionType;
  questions: SessionQuestion[];
  timeLimitSec: number;
  startedAt?: string;
  endedAt?: string;
}

export interface SessionQuestion {
  id: string;
  questionId: string;
  shownAt?: string;
  answeredAt?: string;
  selectedOption?: number;
  isCorrect?: boolean;
  timeSpentSec?: number;
  hintsUsed: number;
}

// === Skill Stats ===
export interface SkillStats {
  id: string;
  userId: string;
  sectionType: SectionType;
  skillTag: SkillTag;
  masteryScore: number; // 0-100
  attempts: number;
  correctCount: number;
  avgTimeSec: number;
  lastUpdated: string;
  recentResults: boolean[]; // last 10 results
}

// === Recommendations ===
export interface Recommendation {
  id: string;
  userId: string;
  createdAt: string;
  type: 'practice_plan' | 'focus_area' | 'encouragement';
  payload: {
    message: string;
    sectionType?: SectionType;
    skillTag?: SkillTag;
    suggestedQuestions?: number;
    suggestedMinutes?: number;
  };
  status: 'active' | 'completed' | 'dismissed';
}

// === User ===
export interface User {
  id: string;
  name: string;
  role: UserRole;
  linkedChildId?: string;
}

// === Section Config ===
export interface SectionConfig {
  type: SectionType;
  nameHe: string;
  icon: string;
  defaultTimeSec: number;
  defaultQuestionCount: number;
  skills: { tag: SkillTag; nameHe: string }[];
  color: string;
}

// === App State ===
export interface AppState {
  currentUser: User;
  currentView: AppView;
  activeSession?: Session;
}

export type AppView =
  | 'home'
  | 'practice_setup'
  | 'adaptive'
  | 'mini_exam_setup'
  | 'full_exam'
  | 'session_active'
  | 'results'
  | 'parent_dashboard'
  | 'achievements'
  | 'parent_login';
