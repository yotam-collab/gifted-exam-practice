import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { selectForSection, getVisualConfig, getNSVisualConfig } from '../services/questionPool';
import { QuestionVisual } from '../components/QuestionVisual';
import { ShapeBox } from '../utils/shapeRenderer';
import { getSectionConfig, SECTION_CONFIGS } from '../config/sections';
import { storage } from '../services/storage';
import type { Question, SectionType, SkillTag, Difficulty } from '../types';
import '../styles/print.css';

const HE_LETTERS = ['א', 'ב', 'ג', 'ד'];

/** Parse "math.number_sequences" | "math" → { sectionType, skillTag? }. */
function parseSpec(spec: string): { sectionType: SectionType; skillTag?: SkillTag } | null {
  const known = SECTION_CONFIGS.map(s => s.type);
  for (const sectionType of known) {
    if (spec === sectionType) return { sectionType: sectionType as SectionType };
    if (spec.startsWith(sectionType + '.')) {
      return { sectionType: sectionType as SectionType, skillTag: spec.slice(sectionType.length + 1) as SkillTag };
    }
  }
  return null;
}

function QuestionRow({ q, index }: { q: Question; index: number }) {
  const visual = getVisualConfig(q.id);
  const nsVisual = getNSVisualConfig(q.id);
  const hasShapeOptions = !!visual?.optionShapes;

  return (
    <div className="question-block">
      <div className="question-stem">
        <span className="question-num">{index + 1}</span>
        {q.stem}
      </div>
      {(visual || nsVisual) && (
        <div className="question-visual">
          <QuestionVisual visual={visual} nsVisual={nsVisual} />
        </div>
      )}
      {hasShapeOptions ? (
        <div className="options-row">
          {visual!.optionShapes!.map((shapes, i) => (
            <div key={i} className="option">
              <span className="label">{HE_LETTERS[i]}.</span>
              {shapes.map((s, si) => <ShapeBox key={si} shape={s} size={38} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="options-row">
          {q.options.map((opt, i) => (
            <div key={i} className="option">
              <span className="bubble" />
              <span className="label">{HE_LETTERS[i]}.</span>
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * On-demand printable worksheet. Generates a fresh set on each visit — the
 * infinite-worksheet differentiator. Renders questions in exam-paper layout
 * (reusing shapeRenderer via QuestionVisual) plus a separate answer-key page.
 */
export default function PrintRoute() {
  const { worksheetSpec } = useParams();
  const [params] = useSearchParams();
  const count = Math.min(30, Math.max(5, parseInt(params.get('count') ?? '12', 10)));
  const difficulty = (params.get('difficulty') as Difficulty) || 'adaptive';

  const parsed = worksheetSpec ? parseSpec(worksheetSpec) : null;

  const questions = useMemo(() => {
    if (!parsed) return [];
    // Worksheets are pure generated content (no manual-bank blend) so the
    // answer key is always derivable and the set is unlimited.
    return selectForSection(parsed.sectionType, difficulty, count, {
      skill: parsed.skillTag,
      manualShare: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetSpec, count, difficulty]);

  // Print once fonts + SVGs have settled (avoids blank first render on print).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const mark = () => { if (!done) { done = true; setReady(true); } };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      fonts.ready.then(() => setTimeout(mark, 150));
    } else {
      setTimeout(mark, 400);
    }
  }, []);

  if (!parsed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center gap-3">
        <div className="text-4xl">🖨️</div>
        <div className="text-text">לא הצלחנו לזהות את סוג דף העבודה.</div>
        <Link to="/library" className="btn-game px-6 py-3 no-underline">חזרה לספרייה</Link>
      </div>
    );
  }

  const section = getSectionConfig(parsed.sectionType);
  const skillName = parsed.skillTag
    ? section.skills.find(s => s.tag === parsed.skillTag)?.nameHe ?? section.nameHe
    : section.nameHe;
  const childName = storage.getSettings().childName;

  return (
    <div className="print-root">
      {/* Toolbar (screen only) */}
      <div className="print-toolbar no-print">
        <button
          onClick={() => window.print()}
          disabled={!ready}
          className="btn-game px-6 py-2 disabled:opacity-50 cursor-pointer"
        >
          {ready ? '🖨️ הדפסה' : 'מכין...'}
        </button>
        <Link to="/library" className="px-6 py-2 rounded-xl bg-card border border-border text-sm no-underline" style={{ color: '#374151' }}>
          חזרה
        </Link>
      </div>

      {/* Worksheet header */}
      <div className="worksheet-header">
        <div>
          <h1>דף עבודה — {skillName}</h1>
          <div className="name-line">שם: ________________&nbsp;&nbsp;&nbsp;תאריך: ____________</div>
        </div>
        <div className="meta">
          זינוק מחוננים · {section.nameHe}
          {childName ? ` · ${childName}` : ''}
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, i) => <QuestionRow key={q.id} q={q} index={i} />)}

      {/* Answer key (own page) */}
      <div className="answer-key">
        <h2>דף תשובות</h2>
        <div className="answer-grid">
          {questions.map((q, i) => (
            <div key={q.id} className="a-cell">
              <span className="a-q">{i + 1}.</span>
              <span>{HE_LETTERS[q.correctOption]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
