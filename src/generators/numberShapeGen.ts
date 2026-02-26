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

// ── Number Flow: chain of operations ────────────────────────────────────

function genFlow(d: Difficulty): NSGenResult {
  const steps = d === 'easy' ? 3 : d === 'hard' ? 5 : 4;
  const nodes: number[] = [rand(2, 10)];
  const operations: string[] = [];

  for (let i = 1; i < steps; i++) {
    const prev = nodes[i - 1];
    const op = pick(['add', 'multiply', 'subtract'] as const);
    let val: number;

    if (op === 'add') {
      const addVal = rand(2, d === 'hard' ? 15 : 8);
      val = prev + addVal;
      operations.push(`+${addVal}`);
    } else if (op === 'multiply') {
      const multVal = rand(2, d === 'hard' ? 4 : 3);
      val = prev * multVal;
      operations.push(`×${multVal}`);
    } else {
      const subVal = rand(1, Math.max(1, prev - 1));
      val = prev - subVal;
      operations.push(`-${subVal}`);
    }
    nodes.push(val);
  }

  // Hide one node (not first)
  const hideIdx = rand(1, nodes.length - 1);
  const answer = nodes[hideIdx];
  const displayNodes: (number | string)[] = nodes.map((v, i) => (i === hideIdx ? '?' : v));

  const { options, correctOption } = makeNumOptions(answer, [nodes[hideIdx - 1]]);

  return {
    skill: 'number_flow',
    stem: 'בשרשרת המספרים, כל מספר מתקבל מהקודם על ידי פעולה חשבונית. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `${nodes[hideIdx - 1]} ${operations[hideIdx - 1]} = ${answer}.`,
    visualConfig: {
      type: 'number_flow',
      nodes: displayNodes,
      operations,
      missingIndex: hideIdx,
    },
  };
}

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

  if (ruleType === 'sum_center') {
    top = rand(2, d === 'hard' ? 12 : 8);
    bl = rand(2, d === 'hard' ? 12 : 8);
    br = rand(2, d === 'hard' ? 12 : 8);
    center = top + bl + br;
  } else {
    top = rand(2, 5);
    bl = rand(2, 5);
    br = top * bl;
    center = rand(1, 5); // decorative
  }

  // Pick which position to hide
  const positions: ('top' | 'bottomLeft' | 'bottomRight' | 'center')[] = ['top', 'bottomLeft', 'bottomRight', 'center'];
  const hidePos = pick(positions);
  const values: Record<string, number> = { top, bottomLeft: bl, bottomRight: br, center };
  const answer = values[hidePos as string];

  const display: Record<string, number | string> = {
    top: hidePos === 'top' ? '?' : top,
    bottomLeft: hidePos === 'bottomLeft' ? '?' : bl,
    bottomRight: hidePos === 'bottomRight' ? '?' : br,
    center: hidePos === 'center' ? '?' : center,
  };

  const { options, correctOption } = makeNumOptions(answer, [top, bl, br, center].filter(v => v !== answer));

  const ruleExplain = ruleType === 'sum_center'
    ? `הכלל: סכום שלושת הפינות = המספר במרכז.\n${top} + ${bl} + ${br} = ${center}.`
    : `הכלל: ${top} × ${bl} = ${br}.`;

  return {
    skill: 'number_pattern',
    stem: 'במשולש המספרים יש כלל מתמטי. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `${ruleExplain}\nהמספר החסר: ${answer}.`,
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
  { skill: 'number_flow', gen: genFlow },
  { skill: 'number_grid', gen: genGrid },
  { skill: 'number_pattern', gen: genTriangle },
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
