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
  pacman: 'עיגול חסר רבע', semicircle: 'חצי עיגול',
  square_corner_cut: 'ריבוע חסר פינה',
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

// ── Cut-shape analogy (square-with-corner-cut → circle-with-quarter-cut) ──
// Real Stage B uses these often. The "rule" is "remove a quadrant from the
// shape" — kid recognizes that a notched-square → quarter-cut-circle is the
// same operation applied to a different base shape.
function genCutShapeAnalogy(): ShapeGenResult {
  // Base pair: square + cut-corner-square. Then ask: "circle is to ? as base
  // square is to cut-corner-square". The correct answer is pacman (3/4-disc).
  // Distractors: full circle (no cut), semicircle (over-cut), triangle (wrong shape).
  const A = s('square', 'none');
  const B = s('square_corner_cut', 'none');
  const C = s('circle', 'none');
  const correct = s('pacman', 'none');
  const wrongs = [
    s('semicircle', 'none'),  // over-cut (half instead of quarter)
    s('circle', 'none'),       // no cut applied (same as C)
    s('triangle', 'none'),     // wrong base shape
  ];
  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]));
  return {
    skill: 'transformation',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: 'הכלל: מסירים רבע מהצורה (פינה אחת).\nריבוע ⟶ ריבוע ללא פינה.\nאותו הכלל על עיגול ⟶ עיגול ללא רבע (כמו פקמן).',
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Dot counting on hexagon perimeter (Stage B "count the dots") ────────
// Real Stage B has hexagons with increasing dots on perimeter. The kid spots
// the +1 progression and picks the next member.
function genDotCountSeries(): ShapeGenResult {
  // Series: 0 dots, 1 dot, 2 dots, 3 dots → next: 4 dots.
  // Skill emphasizes counting under time pressure.
  const startDots = Math.floor(Math.random() * 3); // 0, 1, or 2
  const series: RenderShape[] = Array.from({ length: 4 }).map((_, i) => ({
    type: 'hexagon',
    fill: 'none',
    color: '#1f2937',
    perimeterDots: startDots + i,
  }));
  const correct: RenderShape = { type: 'hexagon', fill: 'none', color: '#1f2937', perimeterDots: startDots + 4 };
  const wrongs: RenderShape[] = [
    { type: 'hexagon', fill: 'none', color: '#1f2937', perimeterDots: startDots + 3 }, // off by one
    { type: 'hexagon', fill: 'none', color: '#1f2937', perimeterDots: startDots + 5 }, // over
    { type: 'hexagon', fill: 'none', color: '#1f2937', perimeterDots: startDots + 2 }, // way under
  ];
  const allOptions = [correct, ...wrongs];
  shuffle(allOptions);
  return {
    skill: 'shape_sequence',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(o => `משושה עם ${o.perimeterDots} נקודות`),
    correctOption: allOptions.indexOf(correct),
    explanation: `מספר הנקודות גדל ב-1 בכל שלב: ${startDots}, ${startDots + 1}, ${startDots + 2}, ${startDots + 3}.\nהבא: ${startDots + 4}.`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Multi-rule analogy — TWO rules change at once ──────────────────
// Real Stage B "hard" analogies vary fill AND shape AND rotation simultaneously.
// Distractors are designed as "right rule applied wrong" or "applied only one
// of the two rules" so a kid who spots one rule but misses the other still
// gets it wrong.
function genMultiRuleAnalogy(): ShapeGenResult {
  // Rule = fill change + scale change (small→big with fill flip)
  const type1 = pick(SHAPE_TYPES);
  const type2 = pick(SHAPE_TYPES.filter(t => t !== type1));
  const fillStart = pick(FILL_TYPES);
  const fillEnd = pick(FILL_TYPES.filter(f => f !== fillStart));

  const A = s(type1, fillStart, { scale: 0.55 });
  const B = s(type1, fillEnd, { scale: 1.15 });
  const C = s(type2, fillStart, { scale: 0.55 });
  const correct = s(type2, fillEnd, { scale: 1.15 });

  // Distractors hit common traps: only-fill-change, only-size-change, both-but-wrong-direction.
  const distractors = [
    s(type2, fillEnd, { scale: 0.55 }),    // applied fill but not size (small + new fill)
    s(type2, fillStart, { scale: 1.15 }),  // applied size but not fill (big + old fill)
    s(type1, fillEnd, { scale: 1.15 }),    // wrong shape (= B itself)
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]));
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `שני שינויים בו-זמנית:\n1) הצורה גדלה (קטן → גדול).\n2) המילוי השתנה (${fillNameHe[fillStart]} → ${fillNameHe[fillEnd]}).\n${shapeNameHe[type1]} ${fillNameHe[fillStart]} קטן ⟶ ${shapeNameHe[type1]} ${fillNameHe[fillEnd]} גדול.\nאותם שינויים על ${shapeNameHe[type2]}: התשובה היא ${shapeNameHe[type2]} ${fillNameHe[fillEnd]} גדול.`,
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Multi-rule series — 5 visible steps with TWO progressions ──────
// Shape rotates AND fill morphs as we walk the series. Kid must apply both
// rules at once. Real Stage B uses 5-6 step series at this difficulty.
function genMultiRuleSeries(): ShapeGenResult {
  // Use arrows so rotation is unambiguous.
  // Rule: rotate +90° per step AND fill cycles none → striped → solid → none.
  const fills: RenderShape['fill'][] = ['none', 'striped', 'solid'];
  const baseRot = 0;
  const series: RenderShape[] = [];
  for (let i = 0; i < 5; i++) {
    series.push(s('arrow', fills[i % 3], { rotation: (baseRot + 90 * i) % 360 }));
  }
  const correctIdx = 5;
  const correct = s('arrow', fills[correctIdx % 3], { rotation: (baseRot + 90 * correctIdx) % 360 });

  // Smart distractors: each gets ONE rule right and ONE wrong.
  const distractors = [
    s('arrow', fills[(correctIdx + 1) % 3], { rotation: (baseRot + 90 * correctIdx) % 360 }), // wrong fill
    s('arrow', fills[correctIdx % 3], { rotation: (baseRot + 90 * (correctIdx - 1)) % 360 }), // wrong rotation (didn't advance)
    s('arrow', fills[(correctIdx - 1) % 3], { rotation: (baseRot + 90 * (correctIdx + 1)) % 360 }), // both wrong
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]));
  const rotName = (r: number) => ({ 0: 'למעלה', 90: 'ימינה', 180: 'למטה', 270: 'שמאלה' }[r % 360] || `${r}°`);
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(o => `חץ ${fillNameHe[o.fill] || ''} מצביע ${rotName(o.rotation || 0)}`),
    correctOption: allOptions.indexOf(correct),
    explanation: `יש שני כללים פועלים בו-זמנית:\n1) החץ מסתובב ב-90° בכיוון השעון בכל שלב.\n2) המילוי מתחלף במחזור: ריק → מפוספס → מלא → ריק...\nהשלב הבא: סיבוב ${90 * correctIdx % 360}°, מילוי ${fillNameHe[fills[correctIdx % 3]]}.`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Compound transformation — outer shape AND inner shape both change ─
// Tests whether the kid applies the same rule to both layers, not just the outer.
function genCompoundTransformation(): ShapeGenResult {
  const outer1 = pick(SHAPE_TYPES);
  const outer2 = pick(SHAPE_TYPES.filter(t => t !== outer1));
  const inner1 = pick(SHAPE_TYPES.filter(t => t !== outer1 && t !== outer2));
  const inner2 = pick(SHAPE_TYPES.filter(t => t !== outer1 && t !== outer2 && t !== inner1));

  const A: RenderShape = { type: outer1, fill: 'none', color: '#1f2937', innerShape: { type: inner1, fill: 'solid', color: '#1f2937' } };
  const B: RenderShape = { type: outer2, fill: 'none', color: '#1f2937', innerShape: { type: inner2, fill: 'solid', color: '#1f2937' } };
  const C: RenderShape = { type: outer1, fill: 'none', color: '#1f2937', innerShape: { type: inner2, fill: 'solid', color: '#1f2937' } };
  // Correct: outer changes outer1→outer2, inner changes inner2→inner1 (mirror swap)
  const correct: RenderShape = { type: outer2, fill: 'none', color: '#1f2937', innerShape: { type: inner1, fill: 'solid', color: '#1f2937' } };

  const distractors: RenderShape[] = [
    // only outer changed
    { type: outer2, fill: 'none', color: '#1f2937', innerShape: { type: inner2, fill: 'solid', color: '#1f2937' } },
    // only inner changed
    { type: outer1, fill: 'none', color: '#1f2937', innerShape: { type: inner1, fill: 'solid', color: '#1f2937' } },
    // wrong combination
    { type: outer1, fill: 'solid', color: '#1f2937', innerShape: { type: inner2, fill: 'none', color: '#1f2937' } },
  ];

  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה החסרה? שים לב לצורה החיצונית וגם לצורה הפנימית.',
    options: allOptions.map(o => `${shapeNameHe[o.type] || o.type} עם ${shapeNameHe[(o.innerShape?.type) || ''] || 'צורה'} בפנים`),
    correctOption: allOptions.indexOf(correct),
    explanation: `שני שינויים שמתחלפים:\n• הצורה החיצונית מתחלפת בין ${shapeNameHe[outer1]} ל-${shapeNameHe[outer2]}.\n• הצורה הפנימית מתחלפת בין ${shapeNameHe[inner1]} ל-${shapeNameHe[inner2]}.\nהזוג הזה ($A→B$) ⟶ הזוג הבא ($C→?$) צריך לקיים את אותם שני חילופים. התשובה: ${shapeNameHe[outer2]} עם ${shapeNameHe[inner1]} בפנים.`,
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Long arithmetic-like series (count + position changes) ─────────
function genLongSeries(): ShapeGenResult {
  // Series of 6 shapes: shape stays same; each step adds 1 perimeter dot AND
  // toggles fill between none/striped.
  const type = pick(['hexagon', 'square', 'triangle'] as const);
  const series: RenderShape[] = [];
  for (let i = 0; i < 6; i++) {
    series.push({
      type,
      fill: i % 2 === 0 ? 'none' : 'striped',
      color: '#1f2937',
      perimeterDots: i + 1,
    });
  }
  const correct: RenderShape = { type, fill: 'none', color: '#1f2937', perimeterDots: 7 };
  const distractors: RenderShape[] = [
    { type, fill: 'striped', color: '#1f2937', perimeterDots: 7 },   // wrong fill
    { type, fill: 'none', color: '#1f2937', perimeterDots: 6 },      // wrong dot count
    { type, fill: 'striped', color: '#1f2937', perimeterDots: 8 },   // both wrong
  ];

  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(o => `${shapeNameHe[o.type]} ${fillNameHe[o.fill]} עם ${o.perimeterDots} נקודות`),
    correctOption: allOptions.indexOf(correct),
    explanation: `שני כללים פועלים יחד:\n• מספר הנקודות עולה ב-1 בכל שלב.\n• המילוי מתחלף: ריק/מפוספס לסירוגין.\nאחרי 6 שלבים, השלב הבא: 7 נקודות, מילוי ריק.`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
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

// Tiered generator pools. Real Stage B difficulty calibration:
//   • Easy = single-rule (just shape OR just fill changes).
//   • Medium = two related dimensions or 2×2 grids.
//   • Hard = multi-rule (≥2 rules apply simultaneously), 3×3 matrices,
//     long series (5+ steps), compound shapes, mirror traps.
const easyGenerators: GenFn[] = [
  genAnalogy, genTransformation, genSeries, genFillSeries,
  genOddOneOut, genFillOddOneOut,
];
const mediumGenerators: GenFn[] = [
  genAnalogy, genScaleAnalogy, genTransformation, genSeries,
  genFillSeries, genGridPattern, genCutShapeAnalogy, genDotCountSeries,
  genMirrorOddOneOut,
];
const hardGenerators: GenFn[] = [
  genScaleAnalogy, genGridPattern, genGrid3x3, genMirrorOddOneOut,
  genCutShapeAnalogy, genDotCountSeries,
  // Genuinely hard generators added when audit showed the previous "hard"
  // pool was indistinguishable from "medium" — multi-rule combinations,
  // long-step series, compound transformations.
  genMultiRuleAnalogy, genMultiRuleSeries, genCompoundTransformation, genLongSeries,
];


export interface ShapeQuestionWithVisual {
  question: Question;
  visualConfig: VisualConfig;
}

export function generateShapeQuestions(difficulty: Difficulty, count: number): ShapeQuestionWithVisual[] {
  const result: ShapeQuestionWithVisual[] = [];
  const effectiveDiff: Difficulty = difficulty === 'adaptive' ? 'medium' : difficulty;

  // Pick the right pool by difficulty so "hard" actually surfaces multi-rule
  // generators, "easy" stays single-rule. (Previously every difficulty drew
  // from the same pool, which is why hard felt indistinguishable from easy.)
  const poolFor = (d: Difficulty): GenFn[] => {
    if (d === 'easy') return easyGenerators;
    if (d === 'hard') return hardGenerators;
    return mediumGenerators;
  };

  for (let i = 0; i < count; i++) {
    let d = effectiveDiff;
    if (difficulty === 'adaptive') {
      // Adaptive sweeps all difficulty levels — biased slightly toward medium.
      d = pick(['easy', 'medium', 'medium', 'hard']);
    }
    const gen = pick(poolFor(d));
    const r = gen();

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
