/**
 * Shape question generator — algorithmically generates shape analogy,
 * transformation, series, and odd-one-out questions with visual configs.
 */
import type { Question, Difficulty, ShapeSkill } from '../types';
import type { RenderShape } from '../utils/shapeRenderer';
import type { VisualConfig } from '../data/shapeVisuals';

let _c = 0;
const uid = () => `gsh_${Date.now()}_${++_c}_${Math.random().toString(36).slice(2, 6)}`;
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ── Shape building blocks ───────────────────────────────────────────────

const SHAPE_TYPES: RenderShape['type'][] = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'];
const FILL_TYPES: RenderShape['fill'][] = ['none', 'solid', 'striped'];
function s(
  type: RenderShape['type'],
  fill: RenderShape['fill'] = 'none',
  extra?: Partial<Omit<RenderShape, 'type' | 'fill' | 'color'>>
): RenderShape {
  return { type, fill, color: '#334155', ...extra };
}

function sameTypeDiffFill(from: RenderShape): RenderShape {
  const fills = FILL_TYPES.filter(f => f !== from.fill);
  return s(from.type, pick(fills));
}

// ── Hebrew shape names ──────────────────────────────────────────────────

const shapeNameHe: Record<string, string> = {
  circle: 'עיגול', square: 'ריבוע', triangle: 'משולש',
  diamond: 'מעוין', star: 'כוכב', hexagon: 'משושה',
};
const fillNameHe: Record<string, string> = {
  none: 'ריק', solid: 'מלא', striped: 'מפוספס',
};
const scaleNameHe = (sc?: number) => !sc || sc > 0.9 ? '' : sc < 0.7 ? 'קטן ' : '';

function describeShape(shape: RenderShape): string {
  const scale = scaleNameHe(shape.scale);
  return `${scale}${shapeNameHe[shape.type] || shape.type} ${fillNameHe[shape.fill] || ''}`.trim();
}

/** Shuffle + dedup option list. If two shapes describe identically (e.g. same
 *  type+fill but different scale below the "small" threshold), the duplicate
 *  is replaced with a fresh distractor to keep all 4 visible options unique.
 *  Returns { options, optionShapes } in matching order. */
function dedupShapeOptions(options: RenderShape[]): RenderShape[] {
  const seen = new Set<string>();
  const out: RenderShape[] = [];
  for (const opt of options) {
    const key = describeShape(opt);
    if (seen.has(key)) {
      // try a tweak that always changes the description: swap fill
      const altFills = FILL_TYPES.filter(f => f !== opt.fill);
      let tweak: RenderShape = opt;
      for (const f of altFills) {
        const candidate = { ...opt, fill: f };
        if (!seen.has(describeShape(candidate))) { tweak = candidate; break; }
      }
      // still a dup? swap type
      if (seen.has(describeShape(tweak))) {
        const altTypes = SHAPE_TYPES.filter(t => t !== tweak.type);
        for (const t of altTypes) {
          const candidate = { ...tweak, type: t };
          if (!seen.has(describeShape(candidate))) { tweak = candidate; break; }
        }
      }
      seen.add(describeShape(tweak));
      out.push(tweak);
    } else {
      seen.add(key);
      out.push(opt);
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// GENERATORS
// ═══════════════════════════════════════════════════════════════════════

interface ShapeGenResult {
  visualConfig: VisualConfig;
  stem: string;
  options: string[];
  correctOption: number;
  explanation: string;
  skill: ShapeSkill;
}

// ── Shape Analogy: A:B = C:? ────────────────────────────────────────────

function genAnalogy(): ShapeGenResult {
  // Rule: change fill (solid→empty, etc.)
  const type1 = pick(SHAPE_TYPES);
  const type2 = pick(SHAPE_TYPES.filter(t => t !== type1));
  const fill1 = pick(FILL_TYPES);
  const fill2 = pick(FILL_TYPES.filter(f => f !== fill1));

  // A = type1/fill1, B = type1/fill2, C = type2/fill1, ? = type2/fill2
  const A = s(type1, fill1);
  const B = s(type1, fill2);
  const C = s(type2, fill1);
  const correct = s(type2, fill2);

  // Generate 3 wrong options
  const wrongs = [
    s(type2, fill1),        // Same as C (no change applied)
    s(type1, fill2),        // Same as B
    s(pick(SHAPE_TYPES.filter(t => t !== type2)), fill2), // Wrong type
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]));
  const correctIdx = allOptions.indexOf(correct);

  return {
    skill: 'shape_analogy',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: correctIdx,
    explanation: `הכלל: ${shapeNameHe[type1]} ${fillNameHe[fill1]} → ${shapeNameHe[type1]} ${fillNameHe[fill2]}.\nלכן ${shapeNameHe[type2]} ${fillNameHe[fill1]} → ${shapeNameHe[type2]} ${fillNameHe[fill2]}.`,
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Scale Analogy: small→big ────────────────────────────────────────────

function genScaleAnalogy(): ShapeGenResult {
  const type1 = pick(SHAPE_TYPES);
  const type2 = pick(SHAPE_TYPES.filter(t => t !== type1));
  const fill = pick(FILL_TYPES);

  const A = s(type1, fill, { scale: 0.55 });
  const B = s(type1, fill, { scale: 1.15 });
  const C = s(type2, fill, { scale: 0.55 });
  const correct = s(type2, fill, { scale: 1.15 });

  const wrongs = [
    s(type2, fill, { scale: 0.55 }), // Small (same as C)
    s(pick(SHAPE_TYPES.filter(t => t !== type2)), fill, { scale: 1.15 }), // Wrong type big
    s(type1, fill, { scale: 1.15 }), // Same as B
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]));

  return {
    skill: 'shape_analogy',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `הכלל: קטן → גדול.\n${shapeNameHe[type1]} קטן → גדול. לכן ${shapeNameHe[type2]} קטן → גדול.`,
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Transformation: what rule was applied ───────────────────────────────

function genTransformation(): ShapeGenResult {
  const type = pick(SHAPE_TYPES);
  const beforeFill = pick(FILL_TYPES);
  const afterFill = pick(FILL_TYPES.filter(f => f !== beforeFill));

  const before = s(type, beforeFill);
  const after = s(type, afterFill);

  const ruleText = `${fillNameHe[beforeFill]} → ${fillNameHe[afterFill]}`;
  const options = shuffle([
    `הצורה השתנתה מ${fillNameHe[beforeFill]} ל${fillNameHe[afterFill]}`,
    `הצורה השתנתה מ${fillNameHe[afterFill]} ל${fillNameHe[beforeFill]}`,
    `הצורה הוקטנה`,
    `הצורה הסתובבה`,
  ]);

  return {
    skill: 'transformation',
    stem: 'מה הכלל שחל על הצורות?',
    options,
    correctOption: options.indexOf(`הצורה השתנתה מ${fillNameHe[beforeFill]} ל${fillNameHe[afterFill]}`),
    explanation: `הצורה נשארה ${shapeNameHe[type]}, אבל המילוי השתנה: ${ruleText}.`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: [before, after],
      optionShapes: undefined,
    },
  };
}

// ── Series: what comes next ─────────────────────────────────────────────

function genSeries(): ShapeGenResult {
  // Alternating pattern: A B A B A ?
  const typeA = pick(SHAPE_TYPES);
  const typeB = pick(SHAPE_TYPES.filter(t => t !== typeA));
  const fill = pick(FILL_TYPES);

  const series = [s(typeA, fill), s(typeB, fill), s(typeA, fill), s(typeB, fill), s(typeA, fill)];
  const correct = s(typeB, fill);

  const wrongs = [
    s(typeA, fill),
    s(pick(SHAPE_TYPES.filter(t => t !== typeA && t !== typeB)), fill),
    sameTypeDiffFill(correct),
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]));

  return {
    skill: 'shape_sequence',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `הסדרה מתחלפת: ${shapeNameHe[typeA]}, ${shapeNameHe[typeB]}, ${shapeNameHe[typeA]}, ${shapeNameHe[typeB]}...\nהבא: ${shapeNameHe[typeB]}.`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Fill progression series ─────────────────────────────────────────────

function genFillSeries(): ShapeGenResult {
  const type = pick(SHAPE_TYPES);
  const fills: RenderShape['fill'][] = ['none', 'striped', 'solid'];
  const series = [s(type, fills[0]), s(type, fills[1]), s(type, fills[2]), s(type, fills[0]), s(type, fills[1])];
  const correct = s(type, fills[2]);

  const wrongs = [
    s(type, fills[0]),
    s(type, fills[1]),
    s(pick(SHAPE_TYPES.filter(t => t !== type)), fills[2]),
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]));

  return {
    skill: 'graphic_rule',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `הכלל: ריק → מפוספס → מלא, חוזר.\nהבא בסדרה: ${shapeNameHe[type]} מלא.`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Odd One Out ─────────────────────────────────────────────────────────

function genOddOneOut(): ShapeGenResult {
  const commonType = pick(SHAPE_TYPES);
  const oddType = pick(SHAPE_TYPES.filter(t => t !== commonType));
  const fill = pick(FILL_TYPES);

  // 3 same + 1 different — which is different?
  const oddIdx = Math.floor(Math.random() * 4);
  const stemShapes: RenderShape[] = [];
  for (let i = 0; i < 4; i++) {
    stemShapes.push(i === oddIdx ? s(oddType, fill) : s(commonType, fill));
  }

  const labels = ['א', 'ב', 'ג', 'ד'];

  return {
    skill: 'odd_one_out',
    stem: 'איזו צורה שונה מהאחרות?',
    options: labels,
    correctOption: oddIdx,
    explanation: `3 צורות הן ${shapeNameHe[commonType]}, אבל צורה ${labels[oddIdx]} היא ${shapeNameHe[oddType]} — והיא השונה.`,
    visualConfig: {
      stemLayout: 'odd_one_out',
      stemShapes,
      optionShapes: undefined,
    },
  };
}

// ── Fill-based Odd One Out ──────────────────────────────────────────────

function genFillOddOneOut(): ShapeGenResult {
  const type = pick(SHAPE_TYPES);
  const commonFill = pick(FILL_TYPES);
  const oddFill = pick(FILL_TYPES.filter(f => f !== commonFill));

  const oddIdx = Math.floor(Math.random() * 4);
  const stemShapes: RenderShape[] = [];
  for (let i = 0; i < 4; i++) {
    stemShapes.push(i === oddIdx ? s(type, oddFill) : s(type, commonFill));
  }

  const labels = ['א', 'ב', 'ג', 'ד'];

  return {
    skill: 'odd_one_out',
    stem: 'איזו צורה שונה מהאחרות?',
    options: labels,
    correctOption: oddIdx,
    explanation: `3 צורות הן ${fillNameHe[commonFill]}, אבל צורה ${labels[oddIdx]} היא ${fillNameHe[oddFill]} — והיא השונה.`,
    visualConfig: {
      stemLayout: 'odd_one_out',
      stemShapes,
      optionShapes: undefined,
    },
  };
}

// ── Grid pattern (2x2 with missing cell) ────────────────────────────────

function genGridPattern(): ShapeGenResult {
  // Rule: each row has same type, columns have same fill
  const type1 = pick(SHAPE_TYPES);
  const type2 = pick(SHAPE_TYPES.filter(t => t !== type1));
  const fill1 = pick(FILL_TYPES);
  const fill2 = pick(FILL_TYPES.filter(f => f !== fill1));

  // Grid: [[type1/fill1, type1/fill2], [type2/fill1, type2/?]]
  const grid: (RenderShape | null)[][] = [
    [s(type1, fill1), s(type1, fill2)],
    [s(type2, fill1), null], // missing
  ];
  const correct = s(type2, fill2);

  const wrongs = [
    s(type1, fill2), // Wrong row type
    s(type2, fill1), // Wrong column fill
    s(pick(SHAPE_TYPES.filter(t => t !== type1 && t !== type2)), fill2), // Random
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]));

  return {
    skill: 'fill_frame',
    stem: 'מהי הצורה החסרה בטבלה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `שורה 1: ${shapeNameHe[type1]}. שורה 2: ${shapeNameHe[type2]}.\nעמודה 1: ${fillNameHe[fill1]}. עמודה 2: ${fillNameHe[fill2]}.\nחסר: ${shapeNameHe[type2]} ${fillNameHe[fill2]}.`,
    visualConfig: {
      stemLayout: 'grid',
      gridCells: grid,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── 3×3 multi-rule matrix ───────────────────────────────────────────────
// Hard items on the real Stage B exam combine TWO rules across rows and
// columns. We pick three types for rows + three fills for columns. Cell
// (r,c) = (type[r], fill[c]). The bottom-right cell is hidden.
//
// Distractors are constructed to be plausible:
//   • correct row but wrong column fill
//   • correct column fill but wrong row type
//   • a totally unrelated shape (rare-template trap)
function genGrid3x3(): ShapeGenResult {
  const types = shuffle([...SHAPE_TYPES]).slice(0, 3);
  const fills = shuffle([...FILL_TYPES]).slice(0, 3);

  const grid: (RenderShape | null)[][] = types.map((t, r) =>
    fills.map((f, c) => (r === 2 && c === 2 ? null : s(t, f))),
  );

  const correct = s(types[2], fills[2]);
  const distractors = [
    s(types[2], fills[0]), // right row, wrong fill
    s(types[0], fills[2]), // right fill, wrong row
    s(pick(SHAPE_TYPES.filter(t => !types.includes(t))), fills[2]), // unrelated type
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]));

  return {
    skill: 'graphic_pattern',
    stem: 'מהי הצורה החסרה במשבצת הריקה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `כל שורה היא צורה אחרת: ${shapeNameHe[types[0]]}, ${shapeNameHe[types[1]]}, ${shapeNameHe[types[2]]}.\nכל עמודה היא מילוי אחר: ${fillNameHe[fills[0]]}, ${fillNameHe[fills[1]]}, ${fillNameHe[fills[2]]}.\nהשורה האחרונה היא ${shapeNameHe[types[2]]}, העמודה האחרונה ${fillNameHe[fills[2]]}.\nלכן הצורה החסרה: ${shapeNameHe[types[2]]} ${fillNameHe[fills[2]]}.`,
    visualConfig: {
      stemLayout: 'grid',
      gridCells: grid,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Mirror-symmetry odd-one-out ─────────────────────────────────────────
// Three shapes are rotated identically; one is mirrored. Trains the
// "rotation vs reflection" trap that's classic on Stage B figural items.
function genMirrorOddOneOut(): ShapeGenResult {
  // Use arrows (clearly directional) — mirrored arrow = pointing opposite side.
  const baseRot = pick([0, 45, 90, 135]); // base direction
  const same: RenderShape = s('arrow', 'solid', { rotation: baseRot });
  const mirrored: RenderShape = s('arrow', 'solid', { rotation: (360 - baseRot) % 360 });
  const oddIdx = Math.floor(Math.random() * 4);
  const stemShapes: RenderShape[] = [];
  for (let i = 0; i < 4; i++) stemShapes.push(i === oddIdx ? mirrored : same);
  const labels = ['א', 'ב', 'ג', 'ד'];

  return {
    skill: 'odd_one_out',
    stem: 'איזו צורה שונה מהאחרות?',
    options: labels,
    correctOption: oddIdx,
    explanation: `שלושה חצים מצביעים לאותו כיוון. צורה ${labels[oddIdx]} משוקפת — היא מצביעה לכיוון הפוך. זהו השוני.`,
    visualConfig: {
      stemLayout: 'odd_one_out',
      stemShapes,
      optionShapes: undefined,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════

type GenFn = () => ShapeGenResult;

const generators: GenFn[] = [
  genAnalogy, genScaleAnalogy, genTransformation, genSeries,
  genFillSeries, genOddOneOut, genFillOddOneOut, genGridPattern,
  // Hard generators (multi-rule + mirror) added to the rotation. Real Stage B
  // routinely uses 3×3 multi-rule matrices; these were absent before.
  genGrid3x3, genMirrorOddOneOut,
];

export interface ShapeQuestionWithVisual {
  question: Question;
  visualConfig: VisualConfig;
}

export function generateShapeQuestions(difficulty: Difficulty, count: number): ShapeQuestionWithVisual[] {
  const result: ShapeQuestionWithVisual[] = [];
  const effectiveDiff: Difficulty = difficulty === 'adaptive' ? 'medium' : difficulty;

  for (let i = 0; i < count; i++) {
    const gen = pick(generators);
    const r = gen();

    // Assign difficulty based on question type
    let d = effectiveDiff;
    if (difficulty === 'adaptive') {
      d = pick(['easy', 'medium', 'hard']);
    }

    const question: Question = {
      id: uid(),
      sectionType: 'shapes',
      skillTag: r.skill,
      difficulty: d,
      questionType: 'shape_svg',
      stem: r.stem,
      options: r.options,
      correctOption: r.correctOption,
      explanation: r.explanation,
      recommendedTimeSec: d === 'easy' ? 50 : d === 'hard' ? 75 : 60,
      generatorSource: 'generated',
      qualityScore: 87,
      isActive: true,
    };

    result.push({ question, visualConfig: r.visualConfig });
  }

  return result;
}
