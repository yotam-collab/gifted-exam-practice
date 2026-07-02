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
const rand = (lo: number, hi: number): number => lo + Math.floor(Math.random() * (hi - lo + 1));
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
 *
 *  CRITICAL: when `protectedShape` is provided (the correct answer), we never
 *  replace it — duplicates clash with the protected shape get replaced
 *  themselves instead. This preserves reference equality so callers can use
 *  `result.indexOf(correct)` to locate the answer. Without this, dedup could
 *  silently swap out the correct option and produce correctOption: -1.
 */
function dedupShapeOptions(options: RenderShape[], protectedShape?: RenderShape): RenderShape[] {
  const seen = new Set<string>();
  const protectedKey = protectedShape ? describeShape(protectedShape) : null;
  // Pre-seed with the protected key so any other shape colliding with it is the
  // one that gets tweaked.
  if (protectedKey != null) seen.add(protectedKey);

  const out: RenderShape[] = [];
  for (const opt of options) {
    const key = describeShape(opt);

    // Always keep the protected shape as-is.
    if (protectedShape && opt === protectedShape) {
      out.push(opt);
      continue;
    }

    if (seen.has(key)) {
      // Try a tweak that always changes the description: swap fill, then type.
      let tweak: RenderShape = opt;
      const altFills = FILL_TYPES.filter(f => f !== opt.fill);
      for (const f of altFills) {
        const candidate = { ...opt, fill: f };
        if (!seen.has(describeShape(candidate))) { tweak = candidate; break; }
      }
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]), correct);
  const correctIdx = allOptions.indexOf(correct);

  return {
    skill: 'shape_analogy',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: correctIdx,
    explanation: `🔍 השיטה: באנלוגיה בודקים מה קרה בין הצורה הראשונה לשנייה — ואז עושים בדיוק אותו דבר לצורה השלישית.\nהכלל: הצורה נשארה ${shapeNameHe[type1]}, רק המילוי השתנה (${fillNameHe[fill1]} → ${fillNameHe[fill2]}).\nמיישמים על ${shapeNameHe[type2]} ${fillNameHe[fill1]}: משנים רק את המילוי.\n⚠️ המלכודת: ${shapeNameHe[type2]} ${fillNameHe[fill1]} נראה מוכר — אבל בו לא השתנה כלום.\nלכן התשובה: ${shapeNameHe[type2]} ${fillNameHe[fill2]} ✔`,
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]), correct);

  return {
    skill: 'shape_analogy',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בודקים מה השתנה בין הצורה הראשונה לשנייה — ואז עושים אותו שינוי לשלישית.\nהכלל: ${shapeNameHe[type1]} קטן → ${shapeNameHe[type1]} גדול. רק הגודל השתנה, הצורה נשמרה.\nמיישמים: ${shapeNameHe[type2]} קטן צריך להפוך ל${shapeNameHe[type2]} גדול.\n⚠️ המלכודת: ${shapeNameHe[type1]} גדול — הגודל נכון אבל זו הצורה מהזוג הראשון, לא שלנו.\nלכן התשובה: ${shapeNameHe[type2]} גדול ✔`,
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
    explanation: `🔍 השיטה: משווים את שתי הצורות — מה נשאר אותו דבר, ומה השתנה?\nהצורה נשארה ${shapeNameHe[type]} — לא הסתובבה ולא הוקטנה.\nרק המילוי השתנה: ${ruleText}.\n⚠️ המלכודת: "מ${fillNameHe[afterFill]} ל${fillNameHe[beforeFill]}" — כיוון הפוך! בודקים תמיד מה היה קודם ומה אחר כך.\nלכן התשובה: הצורה השתנתה מ${fillNameHe[beforeFill]} ל${fillNameHe[afterFill]} ✔`,
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]), correct);

  return {
    skill: 'shape_sequence',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: משווים כל צורה לזו שלפניה — מה השתנה? ומה חוזר על עצמו?\nמצאנו: ${shapeNameHe[typeA]}, ${shapeNameHe[typeB]}, ${shapeNameHe[typeA]}, ${shapeNameHe[typeB]}... — הצורות מתחלפות לסירוגין.\nהאחרונה היא ${shapeNameHe[typeA]}, אז עכשיו תור ${shapeNameHe[typeB]}.\n⚠️ המלכודת: עוד ${shapeNameHe[typeA]} — אבל הכלל אומר להתחלף, לא לחזור על אותה צורה פעמיים.\nלכן התשובה: ${shapeNameHe[typeB]} ${fillNameHe[fill]} ✔`,
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]), correct);

  return {
    skill: 'graphic_rule',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: משווים כל צורה לזו שלפניה — מה השתנה? ומה חוזר על עצמו?\nהצורה תמיד ${shapeNameHe[type]}; המילוי נע במחזור: ריק → מפוספס → מלא, וחוזר חלילה.\nעצרנו אחרי ריק ומפוספס — עכשיו תור המלא.\n⚠️ המלכודת: ${shapeNameHe[type]} ריק מתחיל מחזור חדש — אבל קודם חייבים לסיים את המחזור במלא.\nלכן התשובה: ${shapeNameHe[type]} מלא ✔`,
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
    explanation: `🔍 השיטה: מחפשים מה משותף לרוב הצורות — ואז מי ששוברת את הכלל.\nמצאנו: שלוש צורות הן ${shapeNameHe[commonType]} — זה המשותף.\nצורה ${labels[oddIdx]} היא ${shapeNameHe[oddType]} — היא לא שייכת לקבוצה.\nלכן התשובה: ${labels[oddIdx]} ✔`,
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
    explanation: `🔍 השיטה: כשכל הצורות זהות בצורתן — בודקים את המילוי של כל אחת.\nמצאנו: שלוש צורות הן ${fillNameHe[commonFill]} — זה המשותף.\nצורה ${labels[oddIdx]} היא ${fillNameHe[oddFill]} — היא שוברת את הכלל.\nלכן התשובה: ${labels[oddIdx]} ✔`,
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]), correct);

  return {
    skill: 'fill_frame',
    stem: 'מהי הצורה החסרה בטבלה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בטבלה בודקים שני כיוונים — מה משותף לכל שורה, ומה משותף לכל עמודה.\nכלל 1 — שורות: שורה 1 כולה ${shapeNameHe[type1]}, שורה 2 כולה ${shapeNameHe[type2]}.\nכלל 2 — עמודות: עמודה 1 ${fillNameHe[fill1]}, עמודה 2 ${fillNameHe[fill2]}.\nהמשבצת החסרה בשורה 2 ובעמודה 2 — חייבת לקיים את שני הכללים.\n⚠️ המלכודת: ${shapeNameHe[type2]} ${fillNameHe[fill1]} כמעט נכון — קיים רק כלל אחד מהשניים (השורה בלי העמודה).\nלכן התשובה: ${shapeNameHe[type2]} ${fillNameHe[fill2]} ✔`,
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]), correct);

  return {
    skill: 'graphic_pattern',
    stem: 'מהי הצורה החסרה במשבצת הריקה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בטבלה בודקים שני כיוונים — מה משותף לכל שורה, ומה משותף לכל עמודה.\nכלל 1 — כל שורה היא צורה אחרת: ${shapeNameHe[types[0]]}, ${shapeNameHe[types[1]]}, ${shapeNameHe[types[2]]}.\nכלל 2 — כל עמודה היא מילוי אחר: ${fillNameHe[fills[0]]}, ${fillNameHe[fills[1]]}, ${fillNameHe[fills[2]]}.\nהמשבצת החסרה: שורת ה${shapeNameHe[types[2]]} ועמודת ה${fillNameHe[fills[2]]}.\n⚠️ המלכודת: ${shapeNameHe[types[2]]} ${fillNameHe[fills[0]]} כמעט נכון — השורה נכונה, אבל המילוי נלקח מעמודה אחרת.\nלכן התשובה: ${shapeNameHe[types[2]]} ${fillNameHe[fills[2]]} ✔`,
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
  const allOptions = dedupShapeOptions(shuffle([correct, ...wrongs]), correct);
  return {
    skill: 'transformation',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: '🔍 השיטה: בודקים מה קרה לצורה הראשונה — ואז עושים בדיוק אותו דבר לצורה השלישית.\nהכלל: מסירים רבע מהצורה (פינה אחת). ריבוע ⟶ ריבוע חסר פינה.\nאותו כלל על עיגול: מסירים רבע ⟶ עיגול חסר רבע.\n⚠️ המלכודת: חצי עיגול מפתה — אבל שם הסירו חצי, לא רבע. ועיגול שלם? בו לא הסירו כלום.\nלכן התשובה: עיגול חסר רבע ✔',
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
    explanation: `🔍 השיטה: כשהצורה לא משתנה — סופרים! משווים את מספר הנקודות בין שכנים.\n${startDots}→${startDots + 1}: נוספה נקודה. ${startDots + 1}→${startDots + 2}: שוב אחת. מצאנו את הכלל — עוד נקודה אחת בכל שלב.\n✓ בדיקה: ${startDots + 2}+1=${startDots + 3}, מתאים לצורה האחרונה.\n⚠️ המלכודת: ${startDots + 3} נקודות — בדיוק כמו האחרונה בסדרה, שכחנו להוסיף 1!\nלכן התשובה: משושה עם ${startDots + 4} נקודות ✔`,
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]), correct);
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בודקים את כל מה שהשתנה בין הצורה הראשונה לשנייה — לפעמים זה יותר מדבר אחד!\nכלל 1: הגודל — קטן → גדול.\nכלל 2: המילוי — ${fillNameHe[fillStart]} → ${fillNameHe[fillEnd]}.\nמיישמים את שני הכללים על ${shapeNameHe[type2]} ${fillNameHe[fillStart]} הקטן.\n⚠️ המלכודת: ${shapeNameHe[type2]} ${fillNameHe[fillEnd]} קטן כמעט נכון — קיים רק כלל אחד מהשניים (המילוי בלי הגודל).\nלכן התשובה: ${shapeNameHe[type2]} ${fillNameHe[fillEnd]} גדול ✔`,
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

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]), correct);
  const rotName = (r: number) => ({ 0: 'למעלה', 90: 'ימינה', 180: 'למטה', 270: 'שמאלה' }[r % 360] || `${r}°`);
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map(o => `חץ ${fillNameHe[o.fill] || ''} מצביע ${rotName(o.rotation || 0)}`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: משווים כל חץ לזה שלפניו — בודקים גם את הכיוון וגם את המילוי.\nכלל 1: החץ מסתובב 90° עם כיוון השעון בכל שלב.\nכלל 2: המילוי נע במחזור — ריק → מפוספס → מלא, וחוזר חלילה.\nהשלב הבא: חץ שמצביע ${rotName(90 * correctIdx % 360)}, מילוי ${fillNameHe[fills[correctIdx % 3]]}.\n⚠️ המלכודת: חץ שנשאר בכיוון של האחרון — כמעט נכון, קיים רק כלל המילוי בלי הסיבוב.\nלכן התשובה: חץ ${fillNameHe[fills[correctIdx % 3]]} שמצביע ${rotName(90 * correctIdx % 360)} ✔`,
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
    explanation: `🔍 השיטה: בודקים שתי שכבות בנפרד — הצורה החיצונית וגם הצורה הפנימית.\nכלל 1: החיצונית מתחלפת בין ${shapeNameHe[outer1]} ל-${shapeNameHe[outer2]}.\nכלל 2: הפנימית מתחלפת בין ${shapeNameHe[inner1]} ל-${shapeNameHe[inner2]}.\nמיישמים את שני החילופים על הצורה השלישית.\n⚠️ המלכודת: ${shapeNameHe[outer2]} עם ${shapeNameHe[inner2]} בפנים — כמעט נכון, רק החיצונית התחלפה והפנימית נשכחה.\nלכן התשובה: ${shapeNameHe[outer2]} עם ${shapeNameHe[inner1]} בפנים ✔`,
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
    explanation: `🔍 השיטה: משווים כל צורה לזו שלפניה — מה השתנה? ומה חוזר על עצמו?\nכלל 1: מספר הנקודות עולה ב-1 בכל שלב (1, 2, 3...).\nכלל 2: המילוי מתחלף לסירוגין — ריק, מפוספס, ריק, מפוספס...\nהאחרונה: 6 נקודות מפוספס. הבאה: 7 נקודות, ריק.\n⚠️ המלכודת: 7 נקודות מפוספס — כמעט נכון, קיים רק כלל הנקודות בלי חילוף המילוי.\nלכן התשובה: ${shapeNameHe[type]} ריק עם 7 נקודות ✔`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Composite shape analogy (sim3 Q1 pattern) ──────────────────────────
// Figure: a base shape with a smaller shape attached to one side. Real Stage
// B uses these like "[small black circle + tiny circle on top] : [bigger
// black circle + smaller circle on top] = [black square + small square on top] : ?"
// The kid sees both the size growth AND the structure preservation.
function genCompositeShapeAnalogy(): ShapeGenResult {
  const types = shuffle([...SHAPE_TYPES]).slice(0, 2);
  const fillType = pick(['solid', 'none'] as const);

  const A: RenderShape = {
    type: types[0],
    fill: fillType,
    color: '#1f2937',
    scale: 0.55,
    attachedShape: { shape: { type: types[0], fill: fillType, color: '#1f2937' }, side: 'top', relSize: 0.5 },
  };
  const B: RenderShape = {
    type: types[0],
    fill: fillType,
    color: '#1f2937',
    scale: 1.05,
    attachedShape: { shape: { type: types[0], fill: fillType, color: '#1f2937' }, side: 'top', relSize: 0.5 },
  };
  const C: RenderShape = {
    type: types[1],
    fill: fillType,
    color: '#1f2937',
    scale: 0.55,
    attachedShape: { shape: { type: types[1], fill: fillType, color: '#1f2937' }, side: 'top', relSize: 0.5 },
  };
  const correct: RenderShape = {
    type: types[1],
    fill: fillType,
    color: '#1f2937',
    scale: 1.05,
    attachedShape: { shape: { type: types[1], fill: fillType, color: '#1f2937' }, side: 'top', relSize: 0.5 },
  };

  // Distractors test partial-rule traps
  const distractors: RenderShape[] = [
    // Big base BUT no attachment (lost the structure)
    { type: types[1], fill: fillType, color: '#1f2937', scale: 1.05 },
    // Same as C (didn't grow)
    { ...C },
    // Wrong shape entirely
    {
      type: pick(SHAPE_TYPES.filter(t => !types.includes(t))),
      fill: fillType,
      color: '#1f2937',
      scale: 1.05,
      attachedShape: { shape: { type: types[1], fill: fillType, color: '#1f2937' }, side: 'top', relSize: 0.5 },
    },
  ];

  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'shape_analogy',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map((_, i) => `אפשרות ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בודקים מה השתנה בין הצורה הראשונה לשנייה — ומה נשמר בדיוק כמו שהיה.\nהכלל: הצורה הגדולה גדלה, והצורה הזעירה הצמודה נשארת עליה באותו מקום.\n${shapeNameHe[types[0]]} קטן עם ${shapeNameHe[types[0]]} זעיר ⟶ ${shapeNameHe[types[0]]} גדול עם ${shapeNameHe[types[0]]} זעיר.\nאותו כלל: ${shapeNameHe[types[1]]} קטן ⟶ ${shapeNameHe[types[1]]} גדול, והזעיר נשאר.\n⚠️ המלכודת: ${shapeNameHe[types[1]]} גדול לבד — הגודל נכון אבל הצורה הזעירה נעלמה. זה רק חצי מהכלל.\nלכן התשובה: ${shapeNameHe[types[1]]} גדול עם ${shapeNameHe[types[1]]} זעיר עליו ✔`,
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── 3×3 grid-coloring matrix (sim3 Q10 pattern) ─────────────────────────
// Each cell of the outer 3×3 is a small grid (3×2 or 2×2) with some cells
// blackened. The pattern progresses by row (e.g., one more black cell per
// step) and by column (cells shift position).
function genGridColoringMatrix(): ShapeGenResult {
  // Rule we'll use: each row's cells have N black cells (N = row index + 1).
  // Each column's cells share the same black-cell column position.
  // So a kid spots the rule and predicts the missing cell at (row 2, col 2).
  const innerCols = 3;
  const innerRows = 2;

  // Build grid for cell at outer(r, c): blackCount = r+1, blackCol = c
  const buildCellGrid = (r: number, c: number): boolean[][] => {
    const grid: boolean[][] = Array.from({ length: innerRows }, () =>
      Array.from({ length: innerCols }, () => false),
    );
    for (let i = 0; i <= r; i++) grid[i % innerRows][c] = true;
    return grid;
  };

  const outerCells: (RenderShape | null)[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: (RenderShape | null)[] = [];
    for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) row.push(null);
      else row.push({
        type: 'square',
        fill: 'none',
        color: '#1f2937',
        gridFill: { rows: innerRows, cols: innerCols, cells: buildCellGrid(r, c) },
      });
    }
    outerCells.push(row);
  }

  const correct: RenderShape = {
    type: 'square',
    fill: 'none',
    color: '#1f2937',
    gridFill: { rows: innerRows, cols: innerCols, cells: buildCellGrid(2, 2) },
  };
  // Distractors: wrong column position, wrong count, or both
  const distractors: RenderShape[] = [
    { type: 'square', fill: 'none', color: '#1f2937', gridFill: { rows: innerRows, cols: innerCols, cells: buildCellGrid(2, 1) } },
    { type: 'square', fill: 'none', color: '#1f2937', gridFill: { rows: innerRows, cols: innerCols, cells: buildCellGrid(1, 2) } },
    { type: 'square', fill: 'none', color: '#1f2937', gridFill: { rows: innerRows, cols: innerCols, cells: buildCellGrid(0, 2) } },
  ];
  const allOptions = [correct, ...distractors];
  shuffle(allOptions);

  return {
    skill: 'graphic_pattern',
    stem: 'מהי המשבצת החסרה? שים לב: בכל משבצת יש רשת קטנה עם תאים שחורים.',
    options: allOptions.map((_, i) => `משבצת ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: '🔍 השיטה: בטבלה בודקים שני כיוונים — מה קורה לאורך שורה, ומה לאורך עמודה.\nכלל 1 — שורות: מספר התאים השחורים גדל ב-1 (שורה 1: תא אחד, שורה 2: שניים, שורה 3: שלושה).\nכלל 2 — עמודות: מקום התאים השחורים זז לפי מספר העמודה.\nהמשבצת החסרה: 3 תאים שחורים, בעמודה האחרונה של המשבצת.\n⚠️ המלכודת: משבצת עם 2 תאים בלבד — כמעט נכון, קיים רק כלל המקום בלי כלל הכמות.\nלכן התשובה: המשבצת עם 3 תאים שחורים בעמודה האחרונה ✔',
    visualConfig: {
      stemLayout: 'grid',
      gridCells: outerCells,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Pattern-transfer analogy (sim3 Q2 pattern) ─────────────────────────
// Striped square : single diagonal line = grid square : ?
// The "fill pattern" of the first shape transfers to the analogous role of
// the second. The kid sees how diagonals → single line, and grid → cross.
function genPatternTransferAnalogy(): ShapeGenResult {
  // Two parallel transformations:
  //   striped (diagonal lines) → single diagonal line
  //   grid pattern → single horizontal line
  const A: RenderShape = { type: 'square', fill: 'striped', color: '#1f2937' };
  const B: RenderShape = { type: 'square', fill: 'none', color: '#1f2937' }; // representing single line
  const C: RenderShape = { type: 'square', fill: 'dotted', color: '#1f2937' };
  const correct: RenderShape = { type: 'square', fill: 'none', color: '#1f2937', innerShape: { type: 'circle', fill: 'solid', color: '#1f2937', scale: 0.4 } };

  const distractors: RenderShape[] = [
    { type: 'square', fill: 'striped', color: '#1f2937' },  // applied wrong rule
    { type: 'circle', fill: 'dotted', color: '#1f2937' },   // wrong base shape
    { type: 'square', fill: 'solid', color: '#1f2937' },    // over-application
  ];
  const allOptions = [correct, ...distractors];
  shuffle(allOptions);

  return {
    skill: 'transformation',
    stem: 'מהי הצורה החסרה? שים לב לדפוס המילוי שמשתנה.',
    options: allOptions.map((_, i) => `אפשרות ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: '🔍 השיטה: בודקים מה קרה לדפוס המילוי בין הצורה הראשונה לשנייה — ומעבירים לצורה השלישית.\nהכלל: דפוס שלם (הרבה פסים או נקודות) מצטמצם לסימן אחד בודד באמצע.\nריבוע מפוספס ⟶ ריבוע עם קו יחיד. אותו כלל: ריבוע מנוקד ⟶ ריבוע עם נקודה יחידה.\n⚠️ המלכודת: ריבוע שנשאר עם הדפוס המלא — לא הופעל עליו שום כלל.\nלכן התשובה: הריבוע עם הנקודה היחידה באמצע ✔',
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── 3×3 dot-density matrix (sim3 Q7 pattern) ───────────────────────────
// Each cell is a small frame containing N dots. Row / column rules govern
// dot count. Real Stage B "3×3 dot patterns" matrix.
function genDotMatrix3x3(): ShapeGenResult {
  // Rule: dots[r][c] = (r + 1) * (c + 1). Missing cell is bottom-right (3*3=9).
  const buildDotShape = (n: number): RenderShape => ({
    type: 'square',
    fill: 'none',
    color: '#1f2937',
    perimeterDots: n,
  });

  const cells: (RenderShape | null)[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: (RenderShape | null)[] = [];
    for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) row.push(null);
      else row.push(buildDotShape((r + 1) * (c + 1)));
    }
    cells.push(row);
  }
  const correctCount = 9;
  const correct = buildDotShape(correctCount);
  const distractors: RenderShape[] = [
    buildDotShape(correctCount - 1),
    buildDotShape(correctCount + 1),
    buildDotShape(correctCount - 3),
  ];
  const allOptions = [correct, ...distractors];
  shuffle(allOptions);

  return {
    skill: 'graphic_pattern',
    stem: 'כמה נקודות צריכות להיות במשבצת החסרה?',
    options: allOptions.map(o => `${o.perimeterDots} נקודות`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בטבלת נקודות סופרים — ומחפשים קשר בין מספר השורה, מספר העמודה והנקודות.\nהכלל: מספר הנקודות = (מספר השורה) × (מספר העמודה).\n✓ בדיקה: שורה 2, עמודה 3 → 2×3 = 6 — בדיוק מה שמצויר!\nהמשבצת החסרה: שורה 3 × עמודה 3 = 9.\n⚠️ המלכודת: 8 נקודות — טעות של נקודה אחת בספירה. סופרים לאט ובודקים שוב.\nלכן התשובה: 9 נקודות ✔`,
    visualConfig: {
      stemLayout: 'grid',
      gridCells: cells,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Heart with progressive internal lines (sim 3 Q5 pattern) ───────────
// 4 hearts visible, each with one more internal line than the previous.
// Real Stage B uses this with circles divided into 1, 2, 3 wedges, then ?
function genProgressiveLinesSeries(): ShapeGenResult {
  // Use circles with `gridFill` to show a progressive line pattern.
  // Step i has (i+1) horizontal lines drawn through the shape.
  const baseShape: RenderShape['type'] = pick(['circle', 'square', 'diamond'] as const);
  const buildShape = (lines: number): RenderShape => {
    const cells: boolean[][] = Array.from({ length: lines * 2 + 1 }, (_, r) =>
      Array.from({ length: 1 }, () => r % 2 === 0),
    );
    return {
      type: baseShape,
      fill: 'none',
      color: '#1f2937',
      gridFill: { rows: lines * 2 + 1, cols: 1, cells },
    };
  };

  const series = [buildShape(1), buildShape(2), buildShape(3), buildShape(4)];
  const correct = buildShape(5);
  const distractors = [buildShape(4), buildShape(6), buildShape(3)];

  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'graphic_pattern',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map((o) => `${shapeNameHe[o.type]} עם ${(o.gridFill?.rows || 0) - 1} קווים פנימיים`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: משווים כל צורה לזו שלפניה — מה השתנה? ומה חוזר על עצמו?\nסופרים קווים: 1, 2, 3, 4 — בכל שלב נוסף קו אחד.\n✓ בדיקה: 4+1=5, ממשיך בדיוק את הכלל.\n⚠️ המלכודת: 4 קווים — בדיוק כמו הצורה האחרונה, שכחנו להוסיף 1.\nלכן התשובה: ${shapeNameHe[baseShape]} עם 5 קווים פנימיים ✔`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Black/white pair series (sim 3 Q6 pattern) ─────────────────────────
// Pairs of stacked circles where the black/white assignment flips and
// scales position in a cycle. The kid spots the alternating pattern.
function genBlackWhitePairSeries(): ShapeGenResult {
  // Pattern: each step is a circle with an attached smaller circle.
  // Color of base alternates, position of attachment alternates.
  const buildPair = (mainSolid: boolean, smallSolid: boolean, side: 'top' | 'bottom'): RenderShape => ({
    type: 'circle',
    fill: mainSolid ? 'solid' : 'none',
    color: '#1f2937',
    scale: 0.85,
    attachedShape: {
      shape: { type: 'circle', fill: smallSolid ? 'solid' : 'none', color: '#1f2937' },
      side,
      relSize: 0.55,
    },
  });

  // Pattern: alternates main solid/empty, small solid/empty inverted, side cycles.
  const series: RenderShape[] = [
    buildPair(false, true, 'bottom'),
    buildPair(true, false, 'bottom'),
    buildPair(false, true, 'bottom'),
    buildPair(true, false, 'bottom'),
  ];
  const correct = buildPair(false, true, 'bottom');
  const distractors: RenderShape[] = [
    buildPair(true, true, 'bottom'),
    buildPair(false, false, 'bottom'),
    buildPair(true, false, 'top'),
  ];

  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'graphic_pattern',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map((_, i) => `אפשרות ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: '🔍 השיטה: משווים כל זוג לזה שלפניו — מה השתנה? ומה חוזר על עצמו?\nהכלל: הזוגות מתחלפים לסירוגין — עיגול ריק עם קטן מלא, ואז עיגול מלא עם קטן ריק, וחוזר חלילה.\nהזוג האחרון היה מלא עם קטן ריק — עכשיו תור ההפך.\n⚠️ המלכודת: שני עיגולים מלאים (או שניהם ריקים) — בכלל הזה הצבעים תמיד הפוכים זה מזה, אף פעם לא זהים.\nלכן התשובה: עיגול ריק עם עיגול קטן מלא ✔',
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── 3×3 rotation matrix (sim 3 Q8 pattern) ─────────────────────────────
// Each cell is the same triangle/arrow rotated by a fixed amount per row
// and per column. Real Stage B routinely uses this.
function genRotationMatrix3x3(): ShapeGenResult {
  // Rule: rotation = (row * 90 + col * 45) % 360
  // Last cell hidden — kid figures out the row + col rotation rules.
  const buildShape = (rot: number): RenderShape => ({
    type: 'arrow',
    fill: 'solid',
    color: '#1f2937',
    rotation: rot,
  });

  const cells: (RenderShape | null)[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: (RenderShape | null)[] = [];
    for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) row.push(null);
      else row.push(buildShape((r * 90 + c * 45) % 360));
    }
    cells.push(row);
  }

  const correctRot = (2 * 90 + 2 * 45) % 360;
  const correct = buildShape(correctRot);
  const distractors: RenderShape[] = [
    buildShape((correctRot + 45) % 360),  // off by one column step
    buildShape((correctRot + 90) % 360),  // off by one row step
    buildShape((correctRot + 180) % 360), // opposite direction
  ];

  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'graphic_rule',
    stem: 'איזו צורה צריכה להיות במשבצת החסרה?',
    options: allOptions.map((_, i) => `אפשרות ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בטבלה בודקים שני כיוונים — כמה החץ מסתובב לאורך שורה, וכמה לאורך עמודה.\nכלל 1: כל צעד ימינה בשורה — סיבוב 45° עם כיוון השעון.\nכלל 2: כל צעד למטה בעמודה — סיבוב 90° עם כיוון השעון.\nהמשבצת החסרה: שורה אחרונה ועמודה אחרונה → 2×90° + 2×45° = 270°.\n⚠️ המלכודת: כיוון הפוך — חץ שסובב נגד כיוון השעון נראה דומה, אבל מצביע לצד הלא נכון.\nלכן התשובה: החץ בסיבוב של 270° ✔`,
    visualConfig: {
      stemLayout: 'grid',
      gridCells: cells,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── State-change analogy (sim 3 Q4 pattern: open/closed, up/down) ──────
// "Open umbrella : closed umbrella = arrow up : arrow down"
// Tests "state opposite" recognition across different objects.
function genStateChangeAnalogy(): ShapeGenResult {
  // Use rotation 0→180 (up→down) for arrows, plus a paired transformation.
  const A: RenderShape = { type: 'arrow', fill: 'solid', color: '#1f2937', rotation: 0 };       // up
  const B: RenderShape = { type: 'arrow', fill: 'solid', color: '#1f2937', rotation: 180 };     // down
  const baseC: RenderShape['type'] = pick(['triangle', 'pacman', 'square_corner_cut'] as const);
  const C: RenderShape = { type: baseC, fill: 'solid', color: '#1f2937', rotation: 0 };
  const correct: RenderShape = { type: baseC, fill: 'solid', color: '#1f2937', rotation: 180 };

  const distractors: RenderShape[] = [
    { type: baseC, fill: 'solid', color: '#1f2937', rotation: 0 },    // didn't flip (= C)
    { type: baseC, fill: 'solid', color: '#1f2937', rotation: 90 },   // wrong rotation (90 instead of 180)
    { type: baseC, fill: 'none', color: '#1f2937', rotation: 180 },   // flipped + wrong fill
  ];
  const allOptions = [correct, ...distractors];
  shuffle(allOptions);

  return {
    skill: 'transformation',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map((_, i) => `אפשרות ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בודקים מה קרה לחץ — ואז עושים בדיוק אותו דבר לצורה השלישית.\nהכלל: הצורה מתהפכת — מסתובבת חצי סיבוב (180°).\nחץ למעלה ⟶ חץ למטה. אותו כלל על ${shapeNameHe[baseC] || baseC}: גם הוא מתהפך.\n⚠️ המלכודת: סיבוב של 90° בלבד — הצורה שוכבת על הצד, לא הפוכה. חצי סיבוב זה 180°.\nלכן התשובה: ${shapeNameHe[baseC] || baseC} הפוך ✔`,
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Triple-rule analogy — shape + fill + scale change at once ────
// Real Stage B's hardest analogies vary three independent dimensions.
// Distractors test "got 2 of 3 rules right" — kid who ignores any one
// dimension still fails.
function genTripleRuleAnalogy(): ShapeGenResult {
  const types = shuffle([...SHAPE_TYPES]).slice(0, 2);
  const fills = shuffle([...FILL_TYPES]).slice(0, 2);

  // A: type[0] / fills[0] / small
  // B: type[0] / fills[1] / big
  // C: type[1] / fills[0] / small
  // ?: type[1] / fills[1] / big   (same 3 transformations applied)
  const A = s(types[0], fills[0], { scale: 0.55 });
  const B = s(types[0], fills[1], { scale: 1.15 });
  const C = s(types[1], fills[0], { scale: 0.55 });
  const correct = s(types[1], fills[1], { scale: 1.15 });

  // Distractors each match exactly 2 of 3 rules:
  const distractors = [
    s(types[1], fills[0], { scale: 1.15 }),  // wrong fill (kept fills[0])
    s(types[1], fills[1], { scale: 0.55 }),  // wrong size (stayed small)
    s(types[0], fills[1], { scale: 1.15 }),  // wrong shape (= B)
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]), correct);
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה החסרה?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בודקים את כל מה שהשתנה בין הצורה הראשונה לשנייה — כאן זה יותר מדבר אחד!\nכלל 1: המילוי השתנה (${fillNameHe[fills[0]]} → ${fillNameHe[fills[1]]}).\nכלל 2: הגודל גדל (קטן → גדול).\nמיישמים את שני הכללים על ${shapeNameHe[types[1]]} ${fillNameHe[fills[0]]} הקטן.\n⚠️ המלכודת: ${shapeNameHe[types[1]]} ${fillNameHe[fills[1]]} קטן — כמעט נכון, קיים רק כלל המילוי בלי הגודל. ו-${shapeNameHe[types[0]]} ${fillNameHe[fills[1]]} גדול? זו בכלל הצורה השנייה!\nלכן התשובה: ${shapeNameHe[types[1]]} ${fillNameHe[fills[1]]} גדול ✔`,
    visualConfig: {
      stemLayout: 'analogy',
      stemShapes: [A, B, C],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Compound odd-one-out — 3 share TWO features, 1 breaks ONE ────
// 4 shapes; three of them share both shape AND fill (or shape AND scale).
// One breaks ONE of those features. Kid can't just spot a single visual
// difference — they must check multiple dimensions.
function genCompoundOddOneOut(): ShapeGenResult {
  const sharedType = pick(SHAPE_TYPES);
  const sharedFill = pick(FILL_TYPES);
  const sharedScale = pick([0.7, 1.0]);
  const oddDimension = pick(['type', 'fill', 'scale'] as const);

  const sameShape: RenderShape = s(sharedType, sharedFill, { scale: sharedScale });
  let oddShape: RenderShape;
  if (oddDimension === 'type') {
    const altType = pick(SHAPE_TYPES.filter(t => t !== sharedType));
    oddShape = s(altType, sharedFill, { scale: sharedScale });
  } else if (oddDimension === 'fill') {
    const altFill = pick(FILL_TYPES.filter(f => f !== sharedFill));
    oddShape = s(sharedType, altFill, { scale: sharedScale });
  } else {
    const altScale = sharedScale === 0.7 ? 1.15 : 0.55;
    oddShape = s(sharedType, sharedFill, { scale: altScale });
  }

  const oddIdx = Math.floor(Math.random() * 4);
  const stemShapes: RenderShape[] = [];
  for (let i = 0; i < 4; i++) stemShapes.push(i === oddIdx ? oddShape : { ...sameShape });
  const labels = ['א', 'ב', 'ג', 'ד'];

  const dimensionHe = oddDimension === 'type' ? 'בצורה' : oddDimension === 'fill' ? 'במילוי' : 'בגודל';
  return {
    skill: 'odd_one_out',
    stem: 'איזו צורה שונה מהאחרות? שים לב — שלוש מהן זהות בכל המאפיינים, ואחת שונה רק במאפיין אחד.',
    options: labels,
    correctOption: oddIdx,
    explanation: `🔍 השיטה: בודקים כל מאפיין בנפרד — צורה, מילוי וגודל — ומחפשים מי ששובר אחד מהם.\nשלוש צורות זהות בהכול: ${shapeNameHe[sharedType]} ${fillNameHe[sharedFill]}, באותו גודל.\nצורה ${labels[oddIdx]} שונה ${dimensionHe} בלבד — בשאר המאפיינים היא זהה.\n⚠️ המלכודת: מי שבודק רק מאפיין אחד עלול לפספס — חייבים לעבור על שלושתם.\nלכן התשובה: ${labels[oddIdx]} ✔`,
    visualConfig: {
      stemLayout: 'odd_one_out',
      stemShapes,
      optionShapes: undefined,
    },
  };
}

// ── HARD: Hidden-rule 6-step series ────────────────────────────────────
// Series of 6 visible shapes with the rule rotation +60° per step AND
// scale alternates small/big. Kid must spot both patterns simultaneously
// over a long sequence — much harder than 3-step series.
function genHiddenRuleLongSeries(): ShapeGenResult {
  const baseType = pick(['arrow', 'triangle', 'diamond'] as const);
  const fills: RenderShape['fill'][] = ['none', 'solid'];
  const series: RenderShape[] = [];
  for (let i = 0; i < 6; i++) {
    series.push({
      type: baseType,
      fill: fills[i % 2],
      color: '#1f2937',
      rotation: (i * 60) % 360,
      scale: i % 2 === 0 ? 0.7 : 1.0,
    });
  }
  const correctIdx = 6;
  const correct: RenderShape = {
    type: baseType,
    fill: fills[correctIdx % 2],
    color: '#1f2937',
    rotation: (correctIdx * 60) % 360,
    scale: correctIdx % 2 === 0 ? 0.7 : 1.0,
  };
  const distractors: RenderShape[] = [
    // wrong rotation (didn't advance)
    { ...correct, rotation: (5 * 60) % 360 },
    // wrong fill (kept previous)
    { ...correct, fill: fills[(correctIdx - 1) % 2] },
    // wrong scale (didn't alternate)
    { ...correct, scale: correctIdx % 2 === 0 ? 1.0 : 0.7 },
  ];

  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]), correct);
  return {
    skill: 'multi_rule_jump',
    stem: 'מהי הצורה הבאה בסדרה?',
    options: allOptions.map((_, i) => `אפשרות ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: משווים כל צורה לזו שלפניה — מה השתנה? ומה חוזר על עצמו?\nכלל 1: הצורה מסתובבת 60° בכל שלב.\nכלל 2: הגודל והמילוי מתחלפים לסירוגין — קטן ריק, גדול מלא, וחוזר חלילה.\nהשלב הבא: הסיבוב חוזר להתחלה (360° = 0°), קטן וריק.\n⚠️ המלכודת: צורה שנשארה בזווית של הקודמת — כמעט נכון, קיים רק כלל הגודל בלי הסיבוב.\nלכן התשובה: הצורה הקטנה הריקה שחזרה לזווית ההתחלה ✔`,
    visualConfig: {
      stemLayout: 'series',
      stemShapes: series,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Overlay / superimposition (classic Raven-matrix type) ─────────
// Two frames each carry some black cells on a 3×3 grid. The answer is the
// UNION — every cell black in EITHER input is black in the result. This is
// one of the most iconic hard figural types and requires the child to hold
// two patterns in mind and merge them. Distractors: intersection (only cells
// black in BOTH), one of the inputs unchanged, and union-minus-one.
function genOverlayCombination(): ShapeGenResult {
  const R = 3, C = 3;
  const randGrid = (count: number): boolean[][] => {
    const flat = Array.from({ length: R * C }, (_, i) => i);
    shuffle(flat);
    const chosen = new Set(flat.slice(0, count));
    return Array.from({ length: R }, (_, r) =>
      Array.from({ length: C }, (_, c) => chosen.has(r * C + c)),
    );
  };
  const gridA = randGrid(rand(2, 3));
  const gridB = randGrid(rand(2, 3));
  const mkShape = (cells: boolean[][]): RenderShape => ({
    type: 'square', fill: 'none', color: '#1f2937',
    gridFill: { rows: R, cols: C, cells },
  });
  const union = Array.from({ length: R }, (_, r) =>
    Array.from({ length: C }, (_, c) => gridA[r][c] || gridB[r][c]),
  );
  const intersection = Array.from({ length: R }, (_, r) =>
    Array.from({ length: C }, (_, c) => gridA[r][c] && gridB[r][c]),
  );
  // union-minus-one: turn off one black cell in the union
  const unionMinus = union.map(row => [...row]);
  outer: for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (unionMinus[r][c]) { unionMinus[r][c] = false; break outer; }
  }
  const correct = mkShape(union);
  const distractors = [mkShape(intersection), mkShape(gridA), mkShape(unionMinus)];
  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'graphic_rule',
    stem: 'שתי המשבצות הראשונות מונחות זו על זו. משבצת שחורה נשארת שחורה. מהי התוצאה?',
    options: allOptions.map((_, i) => `אפשרות ${'אבגד'[i]}`),
    correctOption: allOptions.indexOf(correct),
    explanation: '🔍 השיטה: מניחים בדמיון את שתי הרשתות זו על זו, ועוברים תא-תא.\nהכלל: תא שחור ברשת הראשונה או בשנייה (או בשתיהן) → שחור בתוצאה.\nרק תא שריק בשתי הרשתות נשאר ריק.\n⚠️ המלכודת: לצבוע רק תאים ששחורים בשתי הרשתות יחד — כך יוצאים תאים חסרים.\nלכן התשובה: הרשת שמאחדת את כל התאים השחורים משתי המשבצות ✔',
    visualConfig: {
      stemLayout: 'row',
      stemShapes: [mkShape(gridA), mkShape(gridB)],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Complete the shape (spatial part-whole) ───────────────────────
// A square with a corner bitten out is shown; the child picks the piece that
// exactly fills the bite. Requires mental fitting of parts into a whole.
function genCompleteTheShape(): ShapeGenResult {
  // The stem shows the bitten square (square_corner_cut). The missing piece is
  // a small square. Distractors: a triangle (wrong shape), a too-big square,
  // and a circle (clearly wrong).
  const stemShape: RenderShape = { type: 'square_corner_cut', fill: 'none', color: '#1f2937', scale: 1.15 };
  const correct: RenderShape = { type: 'square', fill: 'solid', color: '#1f2937', scale: 0.45 };
  const distractors: RenderShape[] = [
    { type: 'triangle', fill: 'solid', color: '#1f2937', scale: 0.5 },
    { type: 'square', fill: 'solid', color: '#1f2937', scale: 0.85 },
    { type: 'circle', fill: 'solid', color: '#1f2937', scale: 0.45 },
  ];
  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'fill_frame',
    stem: 'לצורה חסרה פינה. איזו חתיכה תשלים אותה בדיוק לריבוע שלם?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: '🔍 השיטה: מסתכלים על החור ומדמיינים את החתיכה נכנסת פנימה — מה בדיוק חסר שם?\nהפינה שנחתכה היא ריבוע קטן עם זוויות ישרות.\n✓ בדיקה: ריבוע קטן נכנס בול בפינה ומשלים לריבוע שלם.\n⚠️ המלכודת: ריבוע גדול מדי — הצורה נכונה אבל הגודל לא, והוא יבלוט החוצה. משולש ועיגול לא מתאימים לפינה ישרה.\nלכן התשובה: הריבוע הקטן ✔',
    visualConfig: {
      stemLayout: 'row',
      stemShapes: [stemShape],
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── HARD: Accumulation matrix (3×3, cells fill progressively) ───────────
// Each cell's mini-grid fills up by (row + col + 1) cells in reading order.
// The bottom-right accumulates the most. Distinct from dot-matrix: this is
// additive accumulation, not multiplication, and shows a "filling bar".
function genAccumulationMatrix(): ShapeGenResult {
  const IR = 3, IC = 3; // inner grid 3×3 = up to 9 fill steps
  const buildFill = (n: number): boolean[][] => {
    const cells = Array.from({ length: IR }, () => Array.from({ length: IC }, () => false));
    for (let k = 0; k < n && k < IR * IC; k++) cells[Math.floor(k / IC)][k % IC] = true;
    return cells;
  };
  const fillCount = (r: number, c: number) => r + c + 1; // 1..5
  const mk = (n: number): RenderShape => ({
    type: 'square', fill: 'none', color: '#1f2937',
    gridFill: { rows: IR, cols: IC, cells: buildFill(n) },
  });
  const cells: (RenderShape | null)[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: (RenderShape | null)[] = [];
    for (let c = 0; c < 3; c++) row.push(r === 2 && c === 2 ? null : mk(fillCount(r, c)));
    cells.push(row);
  }
  const correctN = fillCount(2, 2); // 5
  const correct = mk(correctN);
  const distractors = [mk(correctN - 1), mk(correctN + 1), mk(correctN - 2)];
  const allOptions = [correct, ...distractors];
  shuffle(allOptions);
  return {
    skill: 'graphic_pattern',
    stem: 'כמה תאים מלאים צריכים להיות במשבצת החסרה?',
    options: allOptions.map(o => `${o.gridFill?.cells.flat().filter(Boolean).length} תאים מלאים`),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בטבלה בודקים שני כיוונים — מה קורה בצעד ימינה, ומה בצעד למטה.\nכלל 1: כל צעד ימינה — עוד תא מלא אחד.\nכלל 2: כל צעד למטה — עוד תא מלא אחד.\nהמשבצת החסרה בפינה — הכי רחוקה והכי מלאה: ${correctN} תאים.\n⚠️ המלכודת: ${correctN - 1} תאים — כמעט נכון, חסר תא אחד. סופרים שוב לפני שעונים.\nלכן התשובה: ${correctN} תאים מלאים ✔`,
    visualConfig: {
      stemLayout: 'grid',
      gridCells: cells,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Tessellation patch: repeating pattern with a hole ───────────────────
// A 4×4 field tiled by a period-2 checkerboard of two figures. One inner
// cell is missing; the kid picks the tile that continues the pattern. The
// key skill is PHASE tracking — the strongest distractor is the other tile
// (right pattern, wrong phase).
function genPatternPatch(): ShapeGenResult {
  const typeA = pick(SHAPE_TYPES);
  const typeB = pick(SHAPE_TYPES.filter(t => t !== typeA));
  const fillA = pick(['solid', 'striped'] as const);
  const fillB = pick((['none', 'solid', 'striped'] as const).filter(f => f !== fillA));

  const tileA = () => s(typeA, fillA);
  const tileB = () => s(typeB, fillB);

  // Hide an inner cell so the pattern surrounds the hole on all sides.
  const holeR = rand(1, 2);
  const holeC = rand(1, 2);
  const cells: (RenderShape | null)[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: (RenderShape | null)[] = [];
    for (let c = 0; c < 4; c++) {
      if (r === holeR && c === holeC) row.push(null);
      else row.push((r + c) % 2 === 0 ? tileA() : tileB());
    }
    cells.push(row);
  }

  const holeIsA = (holeR + holeC) % 2 === 0;
  const correct = holeIsA ? tileA() : tileB();
  const distractors: RenderShape[] = [
    holeIsA ? tileB() : tileA(),                       // wrong phase — the classic trap
    s(holeIsA ? typeA : typeB, holeIsA ? fillB : fillA), // right shape, wrong fill
    s(pick(SHAPE_TYPES.filter(t => t !== typeA && t !== typeB)), fillA), // foreign tile
  ];
  const allOptions = dedupShapeOptions(shuffle([correct, ...distractors]), correct);

  return {
    skill: 'pattern_completion',
    stem: 'התבנית חוזרת על עצמה. איזו משבצת חסרה בחור?',
    options: allOptions.map(describeShape),
    correctOption: allOptions.indexOf(correct),
    explanation: `🔍 השיטה: בתבנית שחוזרת בודקים את השכנים של החור — מה מקיף אותו?\nהכלל: לוח שחמט של שתי צורות לסירוגין — ${shapeNameHe[typeA]} ${fillNameHe[fillA]} ו-${shapeNameHe[typeB]} ${fillNameHe[fillB]}.\nבודקים: מעל החור, מתחתיו ומצדדיו נמצאת תמיד הצורה השנייה.\nלכן בחור עצמו חייבת להיות הצורה האחרת.\n⚠️ המלכודת: לבחור את הצורה השכנה — פאזה הפוכה, בדיוק ההפך מהנכון.\nלכן התשובה: ${shapeNameHe[holeIsA ? typeA : typeB]} ${fillNameHe[holeIsA ? fillA : fillB]} ✔`,
    visualConfig: {
      stemLayout: 'grid',
      gridCells: cells,
      optionShapes: allOptions.map(o => [o]),
    },
  };
}

// ── Mirror-symmetry odd-one-out ─────────────────────────────────────────
// Three shapes are rotated identically; one is mirrored. Trains the
// "rotation vs reflection" trap that's classic on Stage B figural items.
function genMirrorOddOneOut(): ShapeGenResult {
  // Use arrows (clearly directional) — mirrored arrow points opposite side.
  // CRITICAL: only use base angles where mirroring actually changes the visual.
  // 0° (up) and 180° (down) are vertical-axis-symmetric — their mirror is
  // identical to themselves, which produced 4-identical-arrows bug. We allow
  // only diagonal angles where reflection clearly flips left↔right.
  const baseRot = pick([45, 60, 120, 135]); // diagonal angles only
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
    explanation: `🔍 השיטה: כשכל הצורות דומות — בודקים את הכיוון המדויק של כל אחת.\nמצאנו: שלושה חצים מצביעים לאותו אלכסון בדיוק.\nצורה ${labels[oddIdx]} הפוכה כמו במראה — מצביעה לאלכסון הנגדי.\n⚠️ המלכודת: שיקוף נראה כמעט כמו סיבוב — אבל במראה ימין ושמאל מתחלפים, וזה שוני אמיתי.\nלכן התשובה: ${labels[oddIdx]} ✔`,
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
// EASY pool — single-rule questions (one attribute changes). Appropriate as a
// warm-up / confidence-builder, but NOT representative of real Stage B.
const easyGenerators: GenFn[] = [
  genAnalogy, genTransformation, genSeries, genFillSeries,
  genOddOneOut, genFillOddOneOut,
  // Single-rule real-exam TYPES live here too — they match exam formats but
  // are individually simple (one thing changes).
  genPatternTransferAnalogy, genProgressiveLinesSeries, genStateChangeAnalogy,
  genCutShapeAnalogy, genDotCountSeries,
];
// MEDIUM pool — every generator here requires tracking at least TWO attributes
// simultaneously, or navigating a 2×2 grid. This matches the mid-band of the
// real exam. Single-rule generators were demoted to easy after repeated user
// feedback that medium felt trivial.
const mediumGenerators: GenFn[] = [
  genScaleAnalogy,            // shape + size
  genGridPattern,             // 2×2 row/column rules
  genMirrorOddOneOut,         // rotation-vs-reflection
  genMultiRuleAnalogy,        // fill + size
  genMultiRuleSeries,         // rotation + fill
  genCompoundTransformation,  // outer + inner change
  genBlackWhitePairSeries,    // two alternating attributes
  genCompoundOddOneOut,       // must check 3 dimensions to find the odd one
  genOverlayCombination,      // union of two frames (2 grids merged)
  genPatternPatch,            // tessellation hole — phase tracking
];
// HARD pool — three simultaneous rules, 3×3 matrices with two-axis rules, long
// (6-step) series, or spatial completion. This is genuine gifted-exam level.
const hardGenerators: GenFn[] = [
  genGrid3x3, genGridColoringMatrix, genDotMatrix3x3, genRotationMatrix3x3,
  genTripleRuleAnalogy, genHiddenRuleLongSeries, genLongSeries,
  genCompositeShapeAnalogy,
  // New spatial-reasoning generators added to lift the ceiling further.
  genOverlayCombination, genCompleteTheShape, genAccumulationMatrix,
  genPatternPatch,
];

// Combined pool (deduped) — used by the sub-skill picker, which needs to
// search ALL generators regardless of the session's difficulty pool.
const generators: GenFn[] = [...new Set([...easyGenerators, ...mediumGenerators, ...hardGenerators])];


export interface ShapeQuestionWithVisual {
  question: Question;
  visualConfig: VisualConfig;
}

export function generateShapeQuestions(
  difficulty: Difficulty,
  count: number,
  options?: { skill?: ShapeSkill },
): ShapeQuestionWithVisual[] {
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
      // Adaptive is the DEFAULT practice mode for a gifted-exam prep tool, so
      // it must stretch toward exam level: no pure-easy, majority hard.
      // (Previous 1×easy / 2×medium / 1×hard skewed far too soft — kids saw
      // mostly warm-up questions and never met exam-level items.)
      d = pick(['medium', 'medium', 'hard', 'hard', 'hard']);
    }
    // Sub-skill focus (practice sub-type picker): every generator returns a
    // constant skill tag, so we discover each generator's skill with one probe
    // call and then sample only from the matching ones — exact, no rejection
    // sampling. Falls back to the difficulty pool if no generator matches.
    const wanted = options?.skill;
    let samplingPool = poolFor(d);
    if (wanted) {
      const matching = generators.filter(g => g().skill === wanted);
      if (matching.length > 0) samplingPool = matching;
    }
    const r = pick(samplingPool)();

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
      // Harder figural items need more thinking time, matching real exam pacing.
      recommendedTimeSec: d === 'easy' ? 45 : d === 'hard' ? 90 : 65,
      generatorSource: 'generated',
      qualityScore: 87,
      isActive: true,
    };

    result.push({ question, visualConfig: r.visualConfig });
  }

  return result;
}
