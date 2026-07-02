import type { SectionConfig } from '../types';

export const SECTION_CONFIGS: SectionConfig[] = [
  {
    type: 'math',
    nameHe: 'חשבון',
    icon: '🍎',
    defaultTimeSec: 16 * 60,
    defaultQuestionCount: 15,
    color: '#E74C3C',
    skills: [
      { tag: 'basic_arithmetic', nameHe: 'פעולות חשבון בסיסיות' },
      { tag: 'word_problems', nameHe: 'בעיות מילוליות' },
      { tag: 'time_clock', nameHe: 'זמן ושעון' },
      { tag: 'money_change', nameHe: 'כסף ועודף' },
      { tag: 'multiplication_division', nameHe: 'כפל וחילוק' },
      { tag: 'number_sequences', nameHe: 'רצפים מספריים' },
      { tag: 'math_logic', nameHe: 'היגיון חשבוני' },
    ],
  },
  {
    type: 'sentence_completion',
    nameHe: 'השלמת משפטים',
    icon: '🍊',
    defaultTimeSec: 14 * 60,
    defaultQuestionCount: 15,
    color: '#E67E22',
    skills: [
      { tag: 'vocabulary', nameHe: 'אוצר מילים' },
      { tag: 'logical_connection', nameHe: 'קשר לוגי במשפט' },
      { tag: 'semantic_context', nameHe: 'הקשר סמנטי' },
      { tag: 'contrast_completion', nameHe: 'ניגוד והשלמה' },
      { tag: 'general_knowledge', nameHe: 'ידע כללי בשפה' },
      { tag: 'idioms_proverbs', nameHe: 'ביטויים ופתגמים' },
    ],
  },
  {
    type: 'word_relations',
    nameHe: 'יחסי מילים',
    icon: '🍋',
    defaultTimeSec: 10 * 60,
    defaultQuestionCount: 12,
    color: '#F1C40F',
    skills: [
      { tag: 'synonyms_antonyms', nameHe: 'נרדפות והפכים' },
      { tag: 'part_whole', nameHe: 'חלק-שלם' },
      { tag: 'tool_use', nameHe: 'כלי-שימוש' },
      { tag: 'material_product', nameHe: 'חומר-תוצר' },
      { tag: 'category_item', nameHe: 'קטגוריה-פריט' },
      { tag: 'cause_effect', nameHe: 'סיבה-תוצאה' },
      { tag: 'verbal_analogy', nameHe: 'אנלוגיות מילוליות' },
      { tag: 'synonyms', nameHe: 'נרדפות' },
      { tag: 'action_object', nameHe: 'פעולה-חפץ' },
      { tag: 'disease_cure', nameHe: 'בעיה-פתרון' },
      { tag: 'animal_baby', nameHe: 'בעל חיים-צאצא מיוחד' },
      { tag: 'animal_trait', nameHe: 'בעל חיים-תכונה' },
      { tag: 'animal_habitat', nameHe: 'בעל חיים-בית גידול' },
      { tag: 'liquid_container', nameHe: 'נוזל-כלי קיבול' },
      { tag: 'tool_domain', nameHe: 'כלי מדידה-תחום' },
      { tag: 'work_part', nameHe: 'יצירה-חלק' },
      { tag: 'intensity', nameHe: 'דרגות עוצמה' },
    ],
  },
  {
    type: 'shapes',
    nameHe: 'צורות',
    icon: '🍇',
    defaultTimeSec: 14 * 60,
    defaultQuestionCount: 15,
    color: '#8E44AD',
    skills: [
      { tag: 'shape_analogy', nameHe: 'אנלוגיות צורניות' },
      { tag: 'transformation', nameHe: 'טרנספורמציות' },
      { tag: 'graphic_pattern', nameHe: 'דפוסים גרפיים' },
      { tag: 'odd_one_out', nameHe: 'צורה יוצאת דופן' },
      { tag: 'fill_frame', nameHe: 'הצללות ומסגרות' },
      { tag: 'shape_sequence', nameHe: 'רצף שינוי צורני' },
      { tag: 'graphic_rule', nameHe: 'חוקיות גרפית' },
      { tag: 'rotation_position_count', nameHe: 'סיבוב / מיקום / כמות' },
      { tag: 'fill_frame_direction', nameHe: 'שינוי מילוי וכיוון' },
      { tag: 'multi_rule_jump', nameHe: 'קפיצות חוקיות מרובות' },
      { tag: 'pattern_completion', nameHe: 'השלמת תבנית' },
    ],
  },
  {
    type: 'numbers_in_shapes',
    nameHe: 'מספרים בצורות',
    icon: '🥝',
    defaultTimeSec: 15 * 60,
    defaultQuestionCount: 12,
    color: '#27AE60',
    skills: [
      { tag: 'divided_circle', nameHe: 'עיגול מחולק' },
      { tag: 'number_pyramid', nameHe: 'פירמידת מספרים' },
      { tag: 'number_flow', nameHe: 'תרשים זרימה' },
      { tag: 'number_grid', nameHe: 'טבלת מספרים' },
      { tag: 'number_pattern', nameHe: 'חוקיות מספרית' },
      { tag: 'wheel_sums', nameHe: 'גלגל סכומים' },
    ],
  },
];

export const getSectionConfig = (type: string): SectionConfig => {
  const config = SECTION_CONFIGS.find((s) => s.type === type);
  if (!config) throw new Error(`Unknown section type: ${type}`);
  return config;
};

export const EXAM_RULES = {
  optionsPerQuestion: 4,
  warningTimeSec: 60,
  criticalTimeSec: 30,
  noReturnToPreviousSection: true,
  encourageGuessing: true,
};
