/**
 * Numbers-in-shapes generator — algorithmic generation of divided circles,
 * number pyramids, grids, flows, and triangles with visual configs.
 */
import type { Question, Difficulty, NumbersInShapesSkill } from '../types';
import type { NSVisualConfig } from '../data/numberShapeVisuals';

let _c = 0;
const uid = () => `gns_${Date.now()}_${++_c}_${Math.random().toString(36).slice(2, 6)}`;
const rand = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function makeNumOptions(correct: number, partials: number[] = []): { options: string[]; correctOption: number } {
  const set = new Set<number>([correct]);
  for (const p of partials) {
    if (p > 0 && p !== correct) set.add(p);
  }
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4, -4, 5]);
  for (const off of offsets) {
    if (set.size >= 4) break;
    const v = correct + off;
    if (v > 0 && !set.has(v)) set.add(v);
  }
  while (set.size < 4) set.add(correct + rand(1, 15));
  const arr = shuffle(Array.from(set).slice(0, 4));
  return { options: arr.map(String), correctOption: arr.indexOf(correct) };
}

// ═══════════════════════════════════════════════════════════════════════
// GENERATORS
// ═══════════════════════════════════════════════════════════════════════

interface NSGenResult {
  visualConfig: NSVisualConfig;
  stem: string;
  options: string[];
  correctOption: number;
  explanation: string;
  skill: NumbersInShapesSkill;
}

// ── Divided Circle: two circles with same operation ─────────────────────

function genDividedCircle(d: Difficulty): NSGenResult {
  const opType = pick(['multiply', 'add', 'divide'] as const);
  let circle1: number[];
  let circle2: number[];
  let answer: number;
  let ruleText: string;

  if (opType === 'multiply') {
    // a × b = c in each circle
    const a1 = rand(2, d === 'hard' ? 12 : 8);
    const b1 = rand(2, d === 'hard' ? 10 : 6);
    const c1 = a1 * b1;
    const a2 = rand(2, d === 'hard' ? 12 : 8);
    const b2 = rand(2, d === 'hard' ? 10 : 6);
    answer = a2 * b2;
    circle1 = [a1, b1, c1];
    circle2 = [a2, b2];
    ruleText = `הכלל: המספר הראשון × המספר השני = המספר השלישי.\n${a2} × ${b2} = ${answer}.`;
  } else if (opType === 'add') {
    // a + b = c
    const a1 = rand(3, d === 'hard' ? 20 : 12);
    const b1 = rand(3, d === 'hard' ? 20 : 12);
    const c1 = a1 + b1;
    const a2 = rand(3, d === 'hard' ? 20 : 12);
    const b2 = rand(3, d === 'hard' ? 20 : 12);
    answer = a2 + b2;
    circle1 = [a1, b1, c1];
    circle2 = [a2, b2];
    ruleText = `הכלל: המספר הראשון + המספר השני = המספר השלישי.\n${a2} + ${b2} = ${answer}.`;
  } else {
    // a ÷ b = c
    const c1 = rand(2, d === 'hard' ? 10 : 6);
    const b1 = rand(2, d === 'hard' ? 8 : 5);
    const a1 = c1 * b1;
    const c2base = rand(2, d === 'hard' ? 10 : 6);
    const b2 = rand(2, d === 'hard' ? 8 : 5);
    const a2 = c2base * b2;
    answer = c2base;
    circle1 = [a1, b1, c1];
    circle2 = [a2, b2];
    ruleText = `הכלל: המספר הראשון ÷ המספר השני = המספר השלישי.\n${a2} ÷ ${b2} = ${answer}.`;
  }

  const { options, correctOption } = makeNumOptions(answer, [circle2[0], circle2[1]]);

  return {
    skill: 'divided_circle',
    stem: `בעיגול מחולק ל-3 חלקים רשומים המספרים: ${circle1.join(', ')}. בעיגול נוסף: ${circle2.join(', ')}, ?. מהו המספר החסר?`,
    options,
    correctOption,
    explanation: ruleText,
    visualConfig: {
      type: 'divided_circle_pair',
      circle1,
      circle2: [...circle2, '?'],
      missingCircle: 2,
      missingIndex: 2,
    },
  };
}

// ── Number Pyramid: each cell = sum of two below ────────────────────────

function genPyramid(d: Difficulty): NSGenResult {
  const baseLen = d === 'easy' ? 3 : 4;
  const base = Array.from({ length: baseLen }, () => rand(1, d === 'hard' ? 12 : 8));

  // Build pyramid bottom-up
  const rows: number[][] = [base];
  for (let len = baseLen - 1; len >= 1; len--) {
    const prev = rows[rows.length - 1];
    const row: number[] = [];
    for (let i = 0; i < len; i++) {
      row.push(prev[i] + prev[i + 1]);
    }
    rows.push(row);
  }
  rows.reverse(); // top to bottom

  // Pick a cell to hide
  const hideRow = rand(0, rows.length - 1);
  const hideCol = rand(0, rows[hideRow].length - 1);
  const answer = rows[hideRow][hideCol];

  const displayRows: (number | string)[][] = rows.map((row, ri) =>
    row.map((v, ci) => (ri === hideRow && ci === hideCol ? '?' : v))
  );

  const { options, correctOption } = makeNumOptions(answer);

  return {
    skill: 'number_pyramid',
    stem: 'בפירמידת המספרים, כל מספר הוא סכום שני המספרים שמתחתיו. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `כל מספר = סכום שני המספרים מתחתיו.\nהמספר החסר: ${answer}.`,
    visualConfig: {
      type: 'number_pyramid',
      rows: displayRows,
      missingRow: hideRow,
      missingCol: hideCol,
    },
  };
}

// (genFlow removed: it labeled operations explicitly which gave the answer
// away. Replaced by genFunctionMachine + genBidirectionalFlow + genArrowChain
// — all of which require the kid to INFER the rule from numbers, like the
// real Stage B exam.)

// ── Number Grid: rows/columns follow a rule ─────────────────────────────

function genGrid(d: Difficulty): NSGenResult {
  const size = d === 'easy' ? 3 : 4;
  const ruleType = pick(['row_sum', 'col_pattern'] as const);

  let grid: number[][];

  if (ruleType === 'row_sum') {
    // Each row sums to the same value
    const targetSum = rand(10, d === 'hard' ? 30 : 20);
    grid = [];
    for (let r = 0; r < size; r++) {
      const row: number[] = [];
      let remaining = targetSum;
      for (let c = 0; c < size - 1; c++) {
        const maxVal = Math.max(1, remaining - (size - 1 - c));
        const val = rand(1, Math.min(maxVal, d === 'hard' ? 12 : 8));
        row.push(val);
        remaining -= val;
      }
      row.push(Math.max(1, remaining));
      grid.push(row);
    }
  } else {
    // Each column increases by a constant
    const colIncrements = Array.from({ length: size }, () => rand(1, 5));
    const firstRow = Array.from({ length: size }, () => rand(1, 8));
    grid = [firstRow];
    for (let r = 1; r < size; r++) {
      grid.push(grid[r - 1].map((v, c) => v + colIncrements[c]));
    }
  }

  // Hide one cell
  const hideRow = rand(0, size - 1);
  const hideCol = rand(0, size - 1);
  const answer = grid[hideRow][hideCol];

  const displayGrid: (number | string)[][] = grid.map((row, ri) =>
    row.map((v, ci) => (ri === hideRow && ci === hideCol ? '?' : v))
  );

  const { options, correctOption } = makeNumOptions(answer);
  const ruleExplain = ruleType === 'row_sum'
    ? `כל שורה מסתכמת באותו מספר.`
    : `כל עמודה עולה בקפיצות קבועות.`;

  return {
    skill: 'number_grid',
    stem: 'בטבלת המספרים יש כלל נסתר. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `${ruleExplain}\nהמספר החסר: ${answer}.`,
    visualConfig: {
      type: 'number_grid',
      rows: displayGrid,
      missingRow: hideRow,
      missingCol: hideCol,
    },
  };
}

// ── Number Triangle: 3 corners + center with a rule ─────────────────────

function genTriangle(d: Difficulty): NSGenResult {
  const ruleType = pick(['sum_center', 'product'] as const);
  let top: number, bl: number, br: number, center: number;
  let hidePos: 'top' | 'bottomLeft' | 'bottomRight' | 'center';

  if (ruleType === 'sum_center') {
    top = rand(2, d === 'hard' ? 12 : 8);
    bl = rand(2, d === 'hard' ? 12 : 8);
    br = rand(2, d === 'hard' ? 12 : 8);
    center = top + bl + br;
    // Any of the 4 positions can be hidden — they're all derivable from the rule.
    hidePos = pick(['top', 'bottomLeft', 'bottomRight', 'center'] as const);
  } else {
    // Product rule: top × bottomLeft = bottomRight. The center is decorative
    // and has NO derivable rule, so we never hide it (previous bug: hiding
    // center under product rule produced an unsolvable item).
    top = rand(2, 6);
    bl = rand(2, 6);
    br = top * bl;
    center = top * bl; // also = product (transparent — no decorative randomness)
    hidePos = pick(['top', 'bottomLeft', 'bottomRight'] as const);
  }

  const values: Record<string, number> = { top, bottomLeft: bl, bottomRight: br, center };
  const answer = values[hidePos];

  const display: Record<string, number | string> = {
    top: hidePos === 'top' ? '?' : top,
    bottomLeft: hidePos === 'bottomLeft' ? '?' : bl,
    bottomRight: hidePos === 'bottomRight' ? '?' : br,
    center: hidePos === 'center' ? '?' : center,
  };

  const { options, correctOption } = makeNumOptions(answer, [top, bl, br, center].filter(v => v !== answer));

  // Build explanation that puts the MISSING value at the end of the equation,
  // not the known total. Previous version always wrote "top + bl + br = center",
  // so when the kid hid e.g. `top`, the explanation's last `=` was the known
  // center — kids would pick that as the answer and get marked wrong.
  let ruleExplain: string;
  if (ruleType === 'sum_center') {
    if (hidePos === 'center') {
      ruleExplain = `הכלל: סכום שלושת הפינות = המספר במרכז.\n${top} + ${bl} + ${br} = ${center}.`;
    } else if (hidePos === 'top') {
      ruleExplain = `הכלל: סכום שלושת הפינות = המספר במרכז (${center}).\nלמצוא את העליון: ${center} − ${bl} − ${br} = ${top}.`;
    } else if (hidePos === 'bottomLeft') {
      ruleExplain = `הכלל: סכום שלושת הפינות = המספר במרכז (${center}).\nלמצוא את שמאל-תחתון: ${center} − ${top} − ${br} = ${bl}.`;
    } else {
      ruleExplain = `הכלל: סכום שלושת הפינות = המספר במרכז (${center}).\nלמצוא את ימין-תחתון: ${center} − ${top} − ${bl} = ${br}.`;
    }
  } else {
    // product: top × bl = br. Center isn't hidden in this branch (filtered above).
    if (hidePos === 'top') {
      ruleExplain = `הכלל: עליון × שמאל-תחתון = ימין-תחתון.\nלמצוא את העליון: ${br} ÷ ${bl} = ${top}.`;
    } else if (hidePos === 'bottomLeft') {
      ruleExplain = `הכלל: עליון × שמאל-תחתון = ימין-תחתון.\nלמצוא את שמאל-תחתון: ${br} ÷ ${top} = ${bl}.`;
    } else {
      ruleExplain = `הכלל: עליון × שמאל-תחתון = ימין-תחתון.\n${top} × ${bl} = ${br}.`;
    }
  }

  return {
    skill: 'number_pattern',
    stem: 'במשולש המספרים יש כלל מתמטי. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `${ruleExplain}\nהמספר החסר הוא ${answer}.`,
    visualConfig: {
      type: 'number_triangle',
      top: display.top as number | string,
      bottomLeft: display.bottomLeft as number | string,
      bottomRight: display.bottomRight as number | string,
      center: display.center as number | string,
      missingPosition: hidePos,
    },
  };
}

// ── Arrow chain (real Stage B): N arrows = N units of operation ────────
function genArrowChain(d: Difficulty): NSGenResult {
  // Two flavors: subtractive (1 arrow = −1) and additive (1 arrow = +k).
  // Hard difficulty allows multiplicative (1 arrow = ×2 → 2 arrows = ×2 again).
  const flavor = d === 'hard' ? pick(['sub', 'add', 'mult'] as const) : pick(['sub', 'add'] as const);
  const steps: { value: number; arrowsToNext?: number }[] = [];
  if (flavor === 'sub') {
    let cur = rand(15, 25);
    steps.push({ value: cur, arrowsToNext: 1 });
    cur = cur - 1;
    steps.push({ value: cur, arrowsToNext: 2 });
    cur = cur - 2;
    steps.push({ value: cur, arrowsToNext: 3 });
    cur = cur - 3;
    steps.push({ value: cur });
  } else if (flavor === 'add') {
    const k = rand(2, 5);
    let cur = rand(2, 6);
    steps.push({ value: cur, arrowsToNext: 1 });
    cur = cur + k;
    steps.push({ value: cur, arrowsToNext: 2 });
    cur = cur + 2 * k;
    steps.push({ value: cur, arrowsToNext: 3 });
    cur = cur + 3 * k;
    steps.push({ value: cur });
  } else {
    // multiplicative: 1 arrow = ×2; chain doubles each time
    let cur = rand(2, 4);
    steps.push({ value: cur, arrowsToNext: 1 });
    cur *= 2;
    steps.push({ value: cur, arrowsToNext: 2 });
    cur *= 4; // 2^2
    steps.push({ value: cur });
  }

  // Hide last step
  const hideIdx = steps.length - 1;
  const answer = steps[hideIdx].value;
  const displaySteps = steps.map((s, i) => ({
    value: i === hideIdx ? ('?' as const) : s.value,
    arrowsToNext: s.arrowsToNext,
  }));

  const stem = 'בשרשרת המספרים, כל חץ מסמל פעולה אחת. מהו המספר החסר?';
  const { options, correctOption } = makeNumOptions(answer, [steps[hideIdx - 1].value]);
  const explanation = flavor === 'sub'
    ? `כל חץ = להחסיר 1. בין המספר האחרון יש 3 חצים → להחסיר 3.\n${steps[hideIdx - 1].value} − 3 = ${answer}.`
    : flavor === 'add'
      ? `כל חץ = להוסיף ${(steps[1].value as number) - (steps[0].value as number)}. בין המספר האחרון יש 3 חצים → להוסיף ${3 * ((steps[1].value as number) - (steps[0].value as number))}.\nהתשובה: ${answer}.`
      : `כל חץ = לכפול ב-2. בין המספר האחרון יש 2 חצים → לכפול ב-4.\nהתשובה: ${answer}.`;

  return {
    skill: 'number_flow',
    stem,
    options,
    correctOption,
    explanation,
    visualConfig: {
      type: 'arrow_chain',
      steps: displaySteps,
      missingIndex: hideIdx,
    },
  };
}

// ── Bidirectional flow (A → [op] → B with two rows; box's role is
//    consistent across rows) ────────────────────────────────────────────
function genBidirectionalFlow(d: Difficulty): NSGenResult {
  // Pick a "box rule": the box performs (right − left = box) or (left + box = right) or (left × right = box).
  // We use simple subtraction in this version: box = left + right is the rule.
  const ruleType = pick(['sum_box', 'diff_right', 'product_box'] as const);
  let row1: { left: number; box: number; right: number };
  let row2: { left: number; box: number; right: number };
  // Note: in the current rule set we only hide 'box' or 'right' — `left` is
  // always shown so the kid can apply the rule. Type intentionally widened to
  // make future rule types easier to add.
  let missingSide: 'left' | 'right' | 'box' = 'box';
  let answer: number;
  let explanation: string;

  if (ruleType === 'sum_box') {
    // box = left + right
    const l1 = rand(3, 12), r1 = rand(3, 12);
    row1 = { left: l1, box: l1 + r1, right: r1 };
    const l2 = rand(3, 12), r2 = rand(3, 12);
    row2 = { left: l2, box: l2 + r2, right: r2 };
    missingSide = 'box';
    answer = row2.box;
    explanation = `הכלל בקופסה: שמאל + ימין = קופסה.\nשורה 1: ${l1} + ${r1} = ${row1.box} ✓\nשורה 2: ${l2} + ${r2} = ${answer}.`;
  } else if (ruleType === 'diff_right') {
    // right = left − box (the box subtracts)
    const l1 = rand(15, 30), b1 = rand(2, d === 'hard' ? 12 : 8);
    row1 = { left: l1, box: b1, right: l1 - b1 };
    const l2 = rand(15, 30), b2 = rand(2, d === 'hard' ? 12 : 8);
    row2 = { left: l2, box: b2, right: l2 - b2 };
    missingSide = 'right';
    answer = row2.right;
    explanation = `הכלל: הקופסה מורידה מהמספר השמאלי.\nשורה 1: ${l1} − ${b1} = ${row1.right} ✓\nשורה 2: ${l2} − ${b2} = ${answer}.`;
  } else {
    // box = left × right (small numbers)
    const l1 = rand(2, 6), r1 = rand(2, 6);
    row1 = { left: l1, box: l1 * r1, right: r1 };
    const l2 = rand(2, 6), r2 = rand(2, 6);
    row2 = { left: l2, box: l2 * r2, right: r2 };
    missingSide = 'box';
    answer = row2.box;
    explanation = `הכלל בקופסה: שמאל × ימין = קופסה.\nשורה 1: ${l1} × ${r1} = ${row1.box} ✓\nשורה 2: ${l2} × ${r2} = ${answer}.`;
  }

  const { options, correctOption } = makeNumOptions(answer, [row1.box, row2.left, row2.right].filter(v => v !== answer));

  return {
    skill: 'number_flow',
    stem: 'הקופסה מבצעת פעולה חשבונית קבועה. מהו המספר החסר?',
    options,
    correctOption,
    explanation,
    visualConfig: {
      type: 'bidirectional_flow',
      rows: [row1, row2 as unknown as typeof row1].map((r, i) => {
        if (i === 1) {
          const ms = missingSide as string;
          return {
            left: ms === 'left' ? '?' : r.left,
            box: ms === 'box' ? '?' : r.box,
            right: ms === 'right' ? '?' : r.right,
          };
        }
        return r;
      }),
      missing: { row: 1, side: missingSide },
    },
  };
}

// ── Function machine (real Stage B sim 1 Q5 / sim 2 Q7 pattern) ────────
// 3 rows of input → output with the SAME hidden rule. Kid infers the rule
// from rows 1 & 2, applies to row 3. CRITICAL: the rule is NEVER shown
// as a label — that's exactly what made the previous genFlow give the
// answer away. Kid figures out the operation from the visible pairs.
function genFunctionMachine(d: Difficulty): NSGenResult {
  // Rule families: +k, -k, ×k, ÷k. Pick one; same k across all 3 rows.
  const rule = pick(['add', 'sub', 'mul', 'div'] as const);
  let k: number;
  let inputs: number[];
  let outputs: number[];

  if (rule === 'add') {
    k = rand(d === 'hard' ? 4 : 2, d === 'hard' ? 15 : 9);
    inputs = [rand(2, 12), rand(2, 12), rand(2, 12)];
    outputs = inputs.map(v => v + k);
  } else if (rule === 'sub') {
    k = rand(2, d === 'hard' ? 9 : 5);
    inputs = [rand(k + 5, 25), rand(k + 5, 25), rand(k + 5, 25)];
    outputs = inputs.map(v => v - k);
  } else if (rule === 'mul') {
    k = rand(2, d === 'hard' ? 5 : 3);
    inputs = [rand(2, 9), rand(2, 9), rand(2, 9)];
    outputs = inputs.map(v => v * k);
  } else {
    k = rand(2, d === 'hard' ? 5 : 3);
    inputs = [rand(2, 9) * k, rand(2, 9) * k, rand(2, 9) * k];
    outputs = inputs.map(v => v / k);
  }

  const answer = outputs[2];
  // Build display rows: rows 1 & 2 fully visible, row 3 right-side hidden.
  const rows = [
    { left: inputs[0], box: '?', right: outputs[0] },
    { left: inputs[1], box: '?', right: outputs[1] },
    { left: inputs[2], box: '?', right: '?' },
  ] as { left: number | string; box: number | string; right: number | string }[];
  // Mark only the LAST right-side as the answer slot (the empty box in each
  // row is just decorative — it's the "rule machine" placeholder).

  const opSymbol = rule === 'add' ? '+' : rule === 'sub' ? '−' : rule === 'mul' ? '×' : '÷';

  const ruleText = rule === 'add' ? `הקלט + ${k} = הפלט`
    : rule === 'sub' ? `הקלט − ${k} = הפלט`
    : rule === 'mul' ? `הקלט × ${k} = הפלט`
    : `הקלט ÷ ${k} = הפלט`;

  const stem = 'בכל שורה נכנס מספר משמאל למכונה, ויוצא מספר מימין. המכונה עושה את אותה פעולה בכל שורה. מהו המספר החסר בשורה האחרונה?';
  const { options, correctOption } = makeNumOptions(answer, [
    rule === 'add' ? inputs[2] : inputs[2] + 1,
    inputs[2],
    answer + k,
  ]);

  return {
    skill: 'number_flow',
    stem,
    options,
    correctOption,
    explanation: `מהשורה הראשונה: ${inputs[0]} ${opSymbol} ? = ${outputs[0]} → המכונה מבצעת ${opSymbol}${k}.\nמהשורה השנייה: ${inputs[1]} ${opSymbol} ${k} = ${outputs[1]} ✓ (אותו כלל).\nשורה אחרונה: ${inputs[2]} ${opSymbol} ${k} = ${answer}.\nהכלל: ${ruleText}.`,
    visualConfig: {
      type: 'bidirectional_flow',
      rows,
      missing: { row: 2, side: 'right' },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════

export interface NSQuestionWithVisual {
  question: Question;
  nsVisualConfig: NSVisualConfig;
}

type NSGenFn = (d: Difficulty) => NSGenResult;

const allGenerators: Array<{ skill: NumbersInShapesSkill; gen: NSGenFn }> = [
  { skill: 'divided_circle', gen: genDividedCircle },
  { skill: 'number_pyramid', gen: genPyramid },
  { skill: 'number_grid', gen: genGrid },
  { skill: 'number_pattern', gen: genTriangle },
  // Real Stage B patterns: arrow-count encodes operation strength;
  // bidirectional flow infers the operation from the visible numbers.
  // (genFlow was removed — it labeled the operation explicitly which
  // gave the answer away; real-exam questions REQUIRE the kid to infer.)
  { skill: 'number_flow', gen: genArrowChain },
  { skill: 'number_flow', gen: genBidirectionalFlow },
  { skill: 'number_flow', gen: genFunctionMachine },
];

export function generateNSQuestions(difficulty: Difficulty, count: number): NSQuestionWithVisual[] {
  const result: NSQuestionWithVisual[] = [];

  // Distribute across skills
  const perSkill = Math.max(1, Math.floor(count / allGenerators.length));
  const pool: Array<{ skill: NumbersInShapesSkill; gen: NSGenFn }> = [];

  for (const entry of allGenerators) {
    for (let i = 0; i < perSkill; i++) pool.push(entry);
  }
  while (pool.length < count) pool.push(pick(allGenerators));

  for (const { gen } of shuffle(pool).slice(0, count)) {
    const d: Difficulty = difficulty === 'adaptive'
      ? pick(['easy', 'medium', 'hard'])
      : difficulty;

    const r = gen(d);
    const question: Question = {
      id: uid(),
      sectionType: 'numbers_in_shapes',
      skillTag: r.skill,
      difficulty: d,
      questionType: 'text',
      stem: r.stem,
      options: r.options,
      correctOption: r.correctOption,
      explanation: r.explanation,
      recommendedTimeSec: d === 'easy' ? 60 : d === 'hard' ? 85 : 70,
      generatorSource: 'generated',
      qualityScore: 88,
      isActive: true,
    };

    result.push({ question, nsVisualConfig: r.visualConfig });
  }

  return result;
}
