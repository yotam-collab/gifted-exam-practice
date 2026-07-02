/**
 * Content library registry — the 4-level hierarchy behind the desktop site:
 *
 *   Kit (ערכה) → Category (קטגוריה) → Subtopic (תת-נושא) → Item (פריט)
 *
 * Level-3 truth stays in SECTION_CONFIGS (44 skills) — the practice-domain
 * categories are DERIVED from it programmatically, never duplicated. Only
 * the non-practice categories (guides, simulations, printables, games,
 * progress) are authored here by hand.
 *
 * `access` drives the free/paid gate (enforced by useEntitlement + <Gated>
 * from build step 6 — until then everything renders unlocked).
 */
import { SECTION_CONFIGS } from './sections';
import type { SectionType, SkillTag } from '../types';

export type ItemKind = 'practice' | 'exam' | 'guide' | 'printable' | 'game' | 'report';
export type ItemAccess = 'free' | 'paid';

export interface LibraryItem {
  id: string;
  kind: ItemKind;
  access: ItemAccess;
  titleHe: string;
  descHe?: string;
  /** practice/printable items */
  sectionType?: SectionType;
  skillTag?: SkillTag;
  /** guide items */
  guideId?: string;
  /** exam items */
  examKind?: 'full' | 'mini' | 'single_section';
  /** report/game items that map to an existing route */
  route?: string;
}

export interface LibrarySubtopic {
  id: string;
  titleHe: string;
  sectionType?: SectionType;
  skillTag?: SkillTag;
  items: LibraryItem[];
}

export interface LibraryCategory {
  id: string;
  titleHe: string;
  icon: string;
  descHe: string;
  /** Category-level items (e.g. a section strategy guide) shown above subtopics. */
  items?: LibraryItem[];
  subtopics: LibrarySubtopic[];
}

export interface Kit {
  id: string;
  titleHe: string;
  categories: LibraryCategory[];
}

// ── Free-tier map ────────────────────────────────────────────────────────
// One fully-open skill per practice section (the "taste the engine" tier).
// Everything else in the practice domains is paid.
const FREE_SKILLS: SkillTag[] = [
  'basic_arithmetic',    // חשבון
  'vocabulary',          // השלמת משפטים
  'synonyms_antonyms',   // יחסי מילים
  'shape_analogy',       // צורות
  'number_pattern',      // מספרים בצורות
];

// ── Practice-domain categories (derived) ────────────────────────────────

/** section → its subtopics with a practice item + printable item each */
function sectionSubtopics(sectionType: SectionType): LibrarySubtopic[] {
  const section = SECTION_CONFIGS.find(s => s.type === sectionType)!;
  return section.skills.map(skill => {
    const access: ItemAccess = FREE_SKILLS.includes(skill.tag) ? 'free' : 'paid';
    return {
      id: skill.tag,
      titleHe: skill.nameHe,
      sectionType,
      skillTag: skill.tag,
      items: [
        {
          id: `${sectionType}.${skill.tag}.practice`,
          kind: 'practice',
          access,
          titleHe: `תרגול: ${skill.nameHe}`,
          descHe: 'סט שאלות מתחדש ברמת המבחן, עם רמזים והסברים.',
          sectionType,
          skillTag: skill.tag,
        },
        {
          id: `${sectionType}.${skill.tag}.printable`,
          kind: 'printable',
          access: 'paid',
          titleHe: `דף עבודה: ${skill.nameHe}`,
          descHe: 'דף עבודה להדפסה עם דף תשובות נפרד.',
          sectionType,
          skillTag: skill.tag,
        },
      ],
    };
  });
}

function sectionGuideItem(sectionType: SectionType, titleHe: string): LibraryItem {
  return {
    id: `guide.${sectionType}`,
    kind: 'guide',
    access: 'paid',
    titleHe,
    descHe: 'איך ניגשים לסוג השאלות הזה: שיטה, מלכודות נפוצות ודוגמאות פתורות.',
    guideId: sectionType,
  };
}

// ── The kit ──────────────────────────────────────────────────────────────

export const STAGE_B_KIT: Kit = {
  id: 'stage-b-grade2',
  titleHe: 'ערכת הכנה למבחן שלב ב׳ — כיתה ב׳',
  categories: [
    {
      id: 'start-here',
      titleHe: 'מתחילים כאן',
      icon: '🚀',
      descHe: 'כל מה שהורים צריכים לדעת לפני שמתחילים לתרגל.',
      items: [
        { id: 'guide.about-exam', kind: 'guide', access: 'free', titleHe: 'מה זה מבחן שלב ב׳?', descHe: 'מבנה המבחן, התחומים הנבדקים ומה מצפה לילד ביום המבחן.', guideId: 'about-exam' },
        { id: 'guide.how-kit-works', kind: 'guide', access: 'free', titleHe: 'איך עובדת הערכה', descHe: 'סיור מודרך: תרגול, סימולציות, דפי עבודה והתוכנית האישית.', guideId: 'how-kit-works' },
        { id: 'guide.practice-routine', kind: 'guide', access: 'free', titleHe: 'בונים שגרת תרגול נכונה', descHe: 'כמה זמן ביום, איך שומרים על מוטיבציה, ומה עושים כשקשה.', guideId: 'practice-routine' },
        { id: 'guide.parent-faq', kind: 'guide', access: 'free', titleHe: 'שאלות נפוצות של הורים', descHe: 'התשובות לשאלות שכל הורה שואל בדרך למבחן.', guideId: 'parent-faq' },
      ],
      subtopics: [],
    },
    {
      id: 'verbal',
      titleHe: 'חשיבה מילולית',
      icon: '🍊',
      descHe: 'השלמת משפטים ויחסי מילים — התחום המילולי של המבחן.',
      items: [
        sectionGuideItem('sentence_completion', 'מדריך אסטרטגיה: השלמת משפטים'),
        sectionGuideItem('word_relations', 'מדריך אסטרטגיה: יחסי מילים'),
      ],
      subtopics: [
        ...sectionSubtopics('sentence_completion'),
        ...sectionSubtopics('word_relations'),
      ],
    },
    {
      id: 'quantitative',
      titleHe: 'חשיבה כמותית',
      icon: '🍎',
      descHe: 'חשבון ומספרים בצורות — התחום הכמותי של המבחן.',
      items: [
        sectionGuideItem('math', 'מדריך אסטרטגיה: חשבון'),
        sectionGuideItem('numbers_in_shapes', 'מדריך אסטרטגיה: מספרים בצורות'),
      ],
      subtopics: [
        ...sectionSubtopics('math'),
        ...sectionSubtopics('numbers_in_shapes'),
      ],
    },
    {
      id: 'figural',
      titleHe: 'חשיבה צורנית',
      icon: '🍇',
      descHe: 'צורות — התחום הלא-מילולי של המבחן.',
      items: [sectionGuideItem('shapes', 'מדריך אסטרטגיה: צורות')],
      subtopics: sectionSubtopics('shapes'),
    },
    {
      id: 'simulations',
      titleHe: 'סימולציות מבחן',
      icon: '⏱️',
      descHe: 'מבחני דמה בתנאי אמת — טיימרים, מעבר פרקים וציון בסוף.',
      items: [
        { id: 'sim.full', kind: 'exam', access: 'paid', titleHe: 'מבחן מלא', descHe: 'כל 5 הפרקים ברצף עם זמן אמיתי לכל פרק (~70 דקות).', examKind: 'full' },
        { id: 'sim.mini', kind: 'exam', access: 'paid', titleHe: 'מבחן מקוצר', descHe: 'בוחרים פרקים ואורך — סימולציה קצרה וממוקדת.', examKind: 'mini' },
        { id: 'sim.single', kind: 'exam', access: 'free', titleHe: 'סימולציית פרק בודד', descHe: 'פרק אחד בתנאי מבחן מלאים — טעימה אמיתית מהמבחן.', examKind: 'single_section' },
      ],
      subtopics: [],
    },
    {
      id: 'printables',
      titleHe: 'דפי עבודה להדפסה',
      icon: '🖨️',
      descHe: 'מחולל דפי עבודה אינסופי — תרגול על הנייר, בלי מסך.',
      items: [
        { id: 'print.sample', kind: 'printable', access: 'free', titleHe: 'דף עבודה לדוגמה', descHe: 'טעימה חינמית מפורמט דפי העבודה שלנו.', sectionType: 'math', skillTag: 'basic_arithmetic' },
        { id: 'print.math', kind: 'printable', access: 'paid', titleHe: 'דפי עבודה: חשבון', descHe: 'בחרו מיומנות, רמה וכמות — וקבלו דף מוכן להדפסה.', sectionType: 'math' },
        { id: 'print.sentence', kind: 'printable', access: 'paid', titleHe: 'דפי עבודה: השלמת משפטים', sectionType: 'sentence_completion' },
        { id: 'print.wordrel', kind: 'printable', access: 'paid', titleHe: 'דפי עבודה: יחסי מילים', sectionType: 'word_relations' },
        { id: 'print.shapes', kind: 'printable', access: 'paid', titleHe: 'דפי עבודה: צורות', sectionType: 'shapes' },
        { id: 'print.nshapes', kind: 'printable', access: 'paid', titleHe: 'דפי עבודה: מספרים בצורות', sectionType: 'numbers_in_shapes' },
      ],
      subtopics: [],
    },
    {
      id: 'games',
      titleHe: 'משחקים וחיזוק חכם',
      icon: '🎮',
      descHe: 'תרגול שמרגיש כמו משחק — והמנוע החכם שמכוון בדיוק למה שצריך חיזוק.',
      items: [
        { id: 'game.adaptive', kind: 'game', access: 'paid', titleHe: 'חיזוק חכם', descHe: 'המערכת מזהה מה צריך חיזוק ובונה סט מותאם אישית.', route: 'adaptive' },
        { id: 'game.daily', kind: 'game', access: 'free', titleHe: 'אתגר יומי', descHe: 'סט קצר ומתחלף — כיף יומי של 5 שאלות.', route: 'daily' },
        { id: 'game.achievements', kind: 'report', access: 'free', titleHe: 'ההצלחות שלי', descHe: 'תגים, רצפים והתקדמות במיומנויות.', route: '/achievements' },
      ],
      subtopics: [],
    },
    {
      id: 'progress',
      titleHe: 'ההתקדמות שלנו',
      icon: '📈',
      descHe: 'תוכנית ההכנה האישית והמעקב המלא להורים.',
      items: [
        { id: 'progress.plan', kind: 'report', access: 'paid', titleHe: 'תוכנית ההכנה האישית', descHe: 'משימות שבועיות שנבנות אוטומטית לפי ההתקדמות ותאריך המבחן.', route: '/parent' },
        { id: 'progress.dashboard', kind: 'report', access: 'free', titleHe: 'לוח הבקרה להורים', descHe: 'תמונת מצב, מגמות והמלצות (תצוגה מלאה — בערכה).', route: '/parent' },
      ],
      subtopics: [],
    },
  ],
};

// ── Lookups ──────────────────────────────────────────────────────────────

export function getCategory(categoryId: string): LibraryCategory | undefined {
  return STAGE_B_KIT.categories.find(c => c.id === categoryId);
}

export function getSubtopic(categoryId: string, subtopicId: string): LibrarySubtopic | undefined {
  return getCategory(categoryId)?.subtopics.find(s => s.id === subtopicId);
}

/** Count of level-3 subtopics in a category (for the library cards). */
export function subtopicCount(category: LibraryCategory): number {
  return category.subtopics.length || category.items?.length || 0;
}
