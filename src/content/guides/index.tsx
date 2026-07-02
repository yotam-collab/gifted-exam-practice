import type { ReactNode } from 'react';
import { AboutExamGuide } from './about-exam';
import { HowKitWorksGuide } from './how-kit-works';
import { PracticeRoutineGuide } from './practice-routine';
import { ParentFaqGuide } from './parent-faq';
import { ShapesStrategyGuide } from './shapes-strategy';

export interface GuideEntry {
  titleHe: string;
  subtitleHe?: string;
  body: () => ReactNode;
}

/**
 * Guide registry. Content is authored as TSX (not markdown) so a guide can
 * embed live shapeRenderer diagrams and reuse the app's RTL Tailwind styling.
 * All content is original.
 */
export const GUIDES: Record<string, GuideEntry> = {
  'about-exam': {
    titleHe: 'מה זה מבחן שלב ב׳?',
    subtitleHe: 'מבנה המבחן והתחומים הנבדקים',
    body: AboutExamGuide,
  },
  'how-kit-works': {
    titleHe: 'איך עובדת הערכה',
    subtitleHe: 'סיור מודרך בכל מה שכלול',
    body: HowKitWorksGuide,
  },
  'practice-routine': {
    titleHe: 'בונים שגרת תרגול נכונה',
    subtitleHe: 'כמה, מתי, ואיך שומרים על מוטיבציה',
    body: PracticeRoutineGuide,
  },
  'parent-faq': {
    titleHe: 'שאלות נפוצות של הורים',
    body: ParentFaqGuide,
  },
  // Section strategy guides (keyed by sectionType).
  shapes: {
    titleHe: 'מדריך אסטרטגיה: צורות',
    subtitleHe: 'איך חושבים על שאלות צורניות',
    body: ShapesStrategyGuide,
  },
};

export function getGuide(id: string): GuideEntry | undefined {
  return GUIDES[id];
}
