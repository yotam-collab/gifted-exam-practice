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
  // Guard: non-finite `correct` would spin the while-loop forever (a Set
  // dedups NaN against NaN). Fail loudly instead of hanging.
  if (!Number.isFinite(correct)) {
    throw new Error(`makeNumOptions: non-finite correct value (${correct}) — check the calling generator`);
  }
  const set = new Set<number>([correct]);
  for (const p of partials) {
    if (Number.isFinite(p) && p > 0 && p !== correct) set.add(p);
  }
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4, -4, 5]);
  for (const off of offsets) {
    if (set.size >= 4) break;
    const v = correct + off;
    if (v > 0 && !set.has(v)) set.add(v);
  }
  let guard = 0;
  while (set.size < 4 && guard++ < 100) set.add(correct + rand(1, 15));
  for (let i = 1; set.size < 4; i++) set.add(correct + 15 + i);
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
  // 'offset' is a within-circle relation (bottom-left = top − k, bottom-right
  // = top + k) — a harder rule family because the kid must compare BOTH
  // circles to extract k, then apply it internally. Reserved for medium+.
  const opType = d === 'easy'
    ? pick(['multiply', 'add', 'divide'] as const)
    : pick(['multiply', 'add', 'divide', 'offset', 'offset'] as const);
  let circle1: number[];
  let circle2: number[];
  let answer: number;
  let ruleText: string;

  if (opType === 'offset') {
    const k = rand(2, d === 'hard' ? 9 : 5);
    const top1 = rand(k + 10, d === 'hard' ? 80 : 40);
    const top2 = rand(k + 10, d === 'hard' ? 80 : 40);
    circle1 = [top1, top1 - k, top1 + k];
    circle2 = [top2, top2 - k];
    answer = top2 + k;
    ruleText = `🔍 השיטה: בעיגול השלם משווים כל מספר תחתון למספר העליון ומגלים את הקפיצה.\nבעיגול הראשון: ${top1} − ${k} = ${top1 - k} וגם ${top1} + ${k} = ${top1 + k} ✓ — שמאל קטן ב-${k}, ימין גדול ב-${k}.\nבעיגול השני חסר הימני: ${top2} + ${k} = ${answer}.\n⚠️ המלכודת: מי שמחסיר במקום להוסיף מקבל ${top2 - k} — אבל הוא כבר רשום בעיגול!\nלכן התשובה: ${answer} ✔`;
  } else if (opType === 'multiply') {
    // a × b = c in each circle
    const a1 = rand(2, d === 'hard' ? 12 : 8);
    const b1 = rand(2, d === 'hard' ? 10 : 6);
    const c1 = a1 * b1;
    const a2 = rand(2, d === 'hard' ? 12 : 8);
    const b2 = rand(2, d === 'hard' ? 10 : 6);
    answer = a2 * b2;
    circle1 = [a1, b1, c1];
    circle2 = [a2, b2];
    const contrast = a1 + b1 !== c1
      ? `\n✓ בדיקה: חיבור לא מסתדר (${a1} + ${b1} = ${a1 + b1}, לא ${c1}) — הכלל הוא באמת כפל.`
      : '';
    ruleText = `🔍 השיטה: מתחילים מהעיגול השלם — איך שני המספרים הראשונים נותנים את השלישי?\nבעיגול הראשון: ${a1} × ${b1} = ${c1} — מצאנו: כפל!${contrast}\nבאותו כלל בעיגול השני: ${a2} × ${b2} = ${answer}.\n⚠️ המלכודת: ${a2} ו-${b2} מופיעים גם בתשובות — הם כבר בעיגול, מחשבים ולא מעתיקים.\nלכן התשובה: ${answer} ✔`;
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
    const contrast = a1 * b1 !== c1
      ? `\n✓ בדיקה: כפל לא מסתדר (${a1} × ${b1} = ${a1 * b1}, לא ${c1}) — הכלל הוא באמת חיבור.`
      : '';
    ruleText = `🔍 השיטה: מתחילים מהעיגול השלם — איך שני המספרים הראשונים נותנים את השלישי?\nבעיגול הראשון: ${a1} + ${b1} = ${c1} — מצאנו: חיבור!${contrast}\nבאותו כלל בעיגול השני: ${a2} + ${b2} = ${answer}.\n⚠️ המלכודת: ${a2} ו-${b2} מופיעים גם בתשובות — הם כבר בעיגול, מחשבים ולא מעתיקים.\nלכן התשובה: ${answer} ✔`;
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
    const contrast = a1 - b1 !== c1
      ? `\n✓ בדיקה: חיסור לא מסתדר (${a1} − ${b1} = ${a1 - b1}, לא ${c1}) — הכלל הוא באמת חילוק.`
      : '';
    ruleText = `🔍 השיטה: מתחילים מהעיגול השלם — איך שני המספרים הראשונים נותנים את השלישי?\nבעיגול הראשון: ${a1} ÷ ${b1} = ${c1} — מצאנו: חילוק!${contrast}\nבאותו כלל בעיגול השני: ${a2} ÷ ${b2} = ${answer}.\n⚠️ המלכודת: ${a2} ו-${b2} מופיעים גם בתשובות — הם כבר בעיגול, מחשבים ולא מעתיקים.\nלכן התשובה: ${answer} ✔`;
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

  // Explanation only — find a fully visible parent+children triple to verify
  // the rule on before solving the hidden cell.
  const lastRow = rows.length - 1;
  let demoRow = -1;
  let demoCol = -1;
  for (let ri = 0; ri < lastRow && demoRow < 0; ri++) {
    for (let ci = 0; ci < rows[ri].length; ci++) {
      const touchesHidden = (ri === hideRow && ci === hideCol)
        || (ri + 1 === hideRow && (ci === hideCol || ci + 1 === hideCol));
      if (!touchesHidden) {
        demoRow = ri;
        demoCol = ci;
        break;
      }
    }
  }
  const checkLine = demoRow >= 0
    ? `✓ בדיקה: ${rows[demoRow + 1][demoCol]} + ${rows[demoRow + 1][demoCol + 1]} = ${rows[demoRow][demoCol]} — הכלל באמת עובד!`
    : `✓ בדיקה: כל מספר גלוי הוא סכום השניים שמתחתיו.`;
  let solveLine: string;
  if (hideRow < lastRow) {
    const l = rows[hideRow + 1][hideCol];
    const r = rows[hideRow + 1][hideCol + 1];
    solveLine = `מתחת לסימן השאלה יושבים ${l} ו-${r}: ${l} + ${r} = ${answer}.`;
  } else {
    const useLeftParent = hideCol === rows[lastRow].length - 1;
    const pCol = useLeftParent ? hideCol - 1 : hideCol;
    const parent = rows[lastRow - 1][pCol];
    const sibling = useLeftParent ? rows[lastRow][hideCol - 1] : rows[lastRow][hideCol + 1];
    solveLine = `סימן השאלה בשורה התחתונה, אז הופכים לתרגיל חסר: ${sibling} + ? = ${parent} ⇐ ? = ${parent} − ${sibling} = ${answer}.`;
  }

  return {
    skill: 'number_pyramid',
    stem: 'בפירמידת המספרים, כל מספר הוא סכום שני המספרים שמתחתיו. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `🔍 השיטה: בפירמידה כל מספר = סכום שני המספרים שמתחתיו — קודם בודקים את הכלל על תא שלם.\n${checkLine}\n${solveLine}\nלכן התשובה: ${answer} ✔`,
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

  // Explanation only — discover the rule on complete rows/columns, verify,
  // then solve the incomplete one as a missing-value exercise.
  let explanation: string;
  if (ruleType === 'row_sum') {
    const others = grid.map((_, i) => i).filter(i => i !== hideRow);
    const rA = others[0];
    const rB = others[1];
    const sumA = grid[rA].reduce((s, v) => s + v, 0);
    const sumB = grid[rB].reduce((s, v) => s + v, 0);
    const visibleSum = grid[hideRow].reduce((s, v, i) => (i === hideCol ? s : s + v), 0);
    const rowWithQ = grid[hideRow].map((v, i) => (i === hideCol ? '?' : String(v))).join(' + ');
    explanation = `🔍 השיטה: בטבלה כזו בודקים קודם כמה נותנת כל שורה שלמה.\nשורה ${rA + 1}: ${grid[rA].join(' + ')} = ${sumA} — מצאנו סכום!\n✓ בדיקה: שורה ${rB + 1}: ${grid[rB].join(' + ')} = ${sumB} — שוב אותו סכום! הכלל: כל שורה = ${sumA}.\nבשורה של סימן השאלה: ${rowWithQ} = ${sumA} ⇐ ? = ${sumA} − ${visibleSum} = ${answer}.\nלכן התשובה: ${answer} ✔`;
  } else {
    const inc = grid[1][hideCol] - grid[0][hideCol];
    const demoC = hideCol === 0 ? 1 : 0;
    const dInc = grid[1][demoC] - grid[0][demoC];
    let adj = -1;
    for (let r = 0; r < size - 1; r++) {
      if (r !== hideRow && r + 1 !== hideRow) {
        adj = r;
        break;
      }
    }
    const hiddenColLine = adj >= 0
      ? `בעמודה של סימן השאלה: מ-${grid[adj][hideCol]} ל-${grid[adj + 1][hideCol]} הקפיצה היא ${inc}.`
      : `בעמודה של סימן השאלה: מ-${grid[0][hideCol]} עד ${grid[2][hideCol]} יש 2 קפיצות ביחד (${grid[2][hideCol] - grid[0][hideCol]}), אז כל קפיצה = ${inc}.`;
    const applyLine = hideRow > 0
      ? `סימן השאלה בא אחרי ${grid[hideRow - 1][hideCol]}: ${grid[hideRow - 1][hideCol]} + ${inc} = ${answer}.`
      : `סימן השאלה בא לפני ${grid[1][hideCol]}: ${grid[1][hideCol]} − ${inc} = ${answer}.`;
    explanation = `🔍 השיטה: בטבלה כזו יורדים בכל עמודה ובודקים בכמה קופצים בכל צעד.\nנתבונן בעמודה שלמה: מ-${grid[0][demoC]} ל-${grid[1][demoC]} קפצנו ${dInc}.\n✓ בדיקה: מ-${grid[1][demoC]} ל-${grid[2][demoC]} שוב ${dInc} — לכל עמודה קפיצה קבועה משלה!\n${hiddenColLine}\n${applyLine}\nלכן התשובה: ${answer} ✔`;
  }

  return {
    skill: 'number_grid',
    stem: 'בטבלת המספרים יש כלל נסתר. מהו המספר החסר?',
    options,
    correctOption,
    explanation,
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
  const trapLine = `⚠️ המלכודת: מספרים שכבר רשומים במשולש מופיעים גם בתשובות — מחשבים, לא מעתיקים.`;
  let explanation: string;
  if (ruleType === 'sum_center') {
    if (hidePos === 'center') {
      explanation = `🔍 השיטה: במשולש כזה בודקים איך שלוש הפינות מתחברות למספר במרכז.\nמחברים את הפינות: ${top} + ${bl} + ${br} = ${center} — זה בדיוק המספר שבמרכז.\n${trapLine}\nלכן התשובה: ${answer} ✔`;
    } else {
      const solve = hidePos === 'top'
        ? `? + ${bl} + ${br} = ${center} ⇐ ? = ${center} − ${bl} − ${br} = ${top}`
        : hidePos === 'bottomLeft'
          ? `${top} + ? + ${br} = ${center} ⇐ ? = ${center} − ${top} − ${br} = ${bl}`
          : `${top} + ${bl} + ? = ${center} ⇐ ? = ${center} − ${top} − ${bl} = ${br}`;
      explanation = `🔍 השיטה: במשולש כזה סכום שלוש הפינות = המספר במרכז.\nהופכים לתרגיל חסר: ${solve}.\n✓ בדיקה: ${top} + ${bl} + ${br} = ${center} — מסתדר בול עם המרכז!\n${trapLine}\nלכן התשובה: ${answer} ✔`;
    }
  } else {
    // product: top × bl = br. Center isn't hidden in this branch (filtered above).
    if (hidePos === 'top') {
      explanation = `🔍 השיטה: במשולש כזה עליון × שמאל-תחתון = ימין-תחתון.\nהופכים לתרגיל חסר: ? × ${bl} = ${br} ⇐ ? = ${br} ÷ ${bl} = ${top}.\n✓ בדיקה: ${top} × ${bl} = ${br} — הכלל עובד!\n${trapLine}\nלכן התשובה: ${answer} ✔`;
    } else if (hidePos === 'bottomLeft') {
      explanation = `🔍 השיטה: במשולש כזה עליון × שמאל-תחתון = ימין-תחתון.\nהופכים לתרגיל חסר: ${top} × ? = ${br} ⇐ ? = ${br} ÷ ${top} = ${bl}.\n✓ בדיקה: ${top} × ${bl} = ${br} — הכלל עובד!\n${trapLine}\nלכן התשובה: ${answer} ✔`;
    } else {
      explanation = `🔍 השיטה: מחפשים פעולה שמקשרת בין העליון לשמאל-תחתון.\nננסה כפל: ${top} × ${bl} = ${top * bl} — מצאנו את הכלל!\n${trapLine}\nלכן התשובה: ${answer} ✔`;
    }
  }

  return {
    skill: 'number_pattern',
    stem: 'במשולש המספרים יש כלל מתמטי. מהו המספר החסר?',
    options,
    correctOption,
    explanation,
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
  const s0 = steps[0].value;
  const s1 = steps[1].value;
  const prev = steps[hideIdx - 1].value;
  const kAdd = s1 - s0;
  const explanation = flavor === 'sub'
    ? `🔍 השיטה: קודם מגלים כמה שווה חץ אחד — מהמעבר הראשון.\nמ-${s0} ל-${s1} יש חץ אחד, וירדנו ב-1. מצאנו: כל חץ = פחות 1.\n✓ בדיקה: במעבר הבא יש 2 חצים: ${s1} − 2 = ${steps[2].value} — מסתדר!\nלפני סימן השאלה יש 3 חצים: ${prev} − 3 = ${answer}.\n⚠️ המלכודת: ${prev} כבר כתוב בשרשרת — מי שלא סופר חצים בוחר בו בטעות.\nלכן התשובה: ${answer} ✔`
    : flavor === 'add'
      ? `🔍 השיטה: קודם מגלים כמה שווה חץ אחד — מהמעבר הראשון.\nמ-${s0} ל-${s1} יש חץ אחד, ועלינו ב-${kAdd}. מצאנו: כל חץ = ועוד ${kAdd}.\n✓ בדיקה: במעבר הבא יש 2 חצים: ${s1} + ${2 * kAdd} = ${steps[2].value} — מסתדר!\nלפני סימן השאלה יש 3 חצים: ${prev} + ${3 * kAdd} = ${answer}.\n⚠️ המלכודת: ${prev} כבר כתוב בשרשרת — מי שלא סופר חצים בוחר בו בטעות.\nלכן התשובה: ${answer} ✔`
      : `🔍 השיטה: קודם מגלים כמה שווה חץ אחד — מהמעבר הראשון.\nמ-${s0} ל-${s1} יש חץ אחד, והמספר הוכפל: ${s0} × 2 = ${s1}. מצאנו: כל חץ = כפול 2.\nלפני סימן השאלה יש 2 חצים — מכפילים פעמיים: ${prev} × 2 × 2 = ${answer}.\n⚠️ המלכודת: ${prev} כבר כתוב בשרשרת, והוא לא המספר החסר.\nלכן התשובה: ${answer} ✔`;

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
    explanation = `🔍 השיטה: מהשורה השלמה מגלים מה הקופסה עושה לשני המספרים.\nשורה 1: ${l1} + ${r1} = ${row1.box} ✓ — הקופסה מחברת את שמאל וימין.\nשורה 2 באותו כלל: ${l2} + ${r2} = ${answer}.\n⚠️ המלכודת: מספרים שכבר רשומים בציור מופיעים בתשובות — מחשבים, לא מעתיקים.\nלכן התשובה: ${answer} ✔`;
  } else if (ruleType === 'diff_right') {
    // right = left − box (the box subtracts)
    const l1 = rand(15, 30), b1 = rand(2, d === 'hard' ? 12 : 8);
    row1 = { left: l1, box: b1, right: l1 - b1 };
    const l2 = rand(15, 30), b2 = rand(2, d === 'hard' ? 12 : 8);
    row2 = { left: l2, box: b2, right: l2 - b2 };
    missingSide = 'right';
    answer = row2.right;
    explanation = `🔍 השיטה: מהשורה השלמה מגלים מה הקופסה עושה לשני המספרים.\nשורה 1: ${l1} − ${b1} = ${row1.right} ✓ — הקופסה מחסירה את המספר שבתוכה.\nשורה 2 באותו כלל: ${l2} − ${b2} = ${answer}.\n⚠️ המלכודת: מספרים שכבר רשומים בציור מופיעים בתשובות — מחשבים, לא מעתיקים.\nלכן התשובה: ${answer} ✔`;
  } else {
    // box = left × right (small numbers)
    const l1 = rand(2, 6), r1 = rand(2, 6);
    row1 = { left: l1, box: l1 * r1, right: r1 };
    const l2 = rand(2, 6), r2 = rand(2, 6);
    row2 = { left: l2, box: l2 * r2, right: r2 };
    missingSide = 'box';
    answer = row2.box;
    explanation = `🔍 השיטה: מהשורה השלמה מגלים מה הקופסה עושה לשני המספרים.\nשורה 1: ${l1} × ${r1} = ${row1.box} ✓ — הקופסה מכפילה את שמאל בימין.\nשורה 2 באותו כלל: ${l2} × ${r2} = ${answer}.\n⚠️ המלכודת: מספרים שכבר רשומים בציור מופיעים בתשובות — מחשבים, לא מעתיקים.\nלכן התשובה: ${answer} ✔`;
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
    explanation: `🔍 השיטה: מגלים את הפעולה מהשורה הראשונה, בודקים בשנייה — ורק אז פותרים.\nשורה 1: ${inputs[0]} הפך ל-${outputs[0]}. מה קרה? ${inputs[0]} ${opSymbol} ${k} = ${outputs[0]} — המכונה עושה ${opSymbol}${k}.\n✓ בדיקה: שורה 2: ${inputs[1]} ${opSymbol} ${k} = ${outputs[1]} — אותו כלל בדיוק!\nשורה 3: ${inputs[2]} ${opSymbol} ${k} = ${answer}.\n⚠️ המלכודת: ${inputs[2]} מופיע בתשובות — זה מה שנכנס למכונה, לא מה שיצא.\nלכן התשובה: ${answer} ✔`,
    visualConfig: {
      type: 'bidirectional_flow',
      rows,
      missing: { row: 2, side: 'right' },
    },
  };
}

// ── Sector wheel: outer number = sum of the two adjacent inner sectors ──
// Hard figure: the kid must first DISCOVER which two inner numbers each
// outer number relates to (spatial adjacency), then apply the sum rule to
// the hidden boundary.
function genWheelSums(d: Difficulty): NSGenResult {
  const n = 6; // six sectors — six boundaries, rich enough without clutter
  const lo = d === 'easy' ? 1 : d === 'hard' ? 4 : 2;
  const hi = d === 'easy' ? 9 : d === 'hard' ? 15 : 12;
  const inner = Array.from({ length: n }, () => rand(lo, hi));
  // Boundary i sits between sector (i-1+n)%n and sector i.
  const outerFull = Array.from({ length: n }, (_, i) => inner[(i - 1 + n) % n] + inner[i]);
  const missingOuterIndex = rand(0, n - 1);
  const answer = outerFull[missingOuterIndex];
  const a = inner[(missingOuterIndex - 1 + n) % n];
  const b = inner[missingOuterIndex];

  const outer: (number | string)[] = outerFull.map((v, i) => (i === missingOuterIndex ? '?' : v));
  // Distractors: sum with a NON-adjacent sector (the classic wrong-pairing
  // trap), off-by-one, and the difference instead of the sum.
  const nonAdjacent = inner[(missingOuterIndex + 2) % n];
  const { options, correctOption } = makeNumOptions(answer, [
    a + nonAdjacent,
    answer + 1,
    Math.abs(a - b) > 0 ? Math.abs(a - b) : answer - 1,
  ]);

  return {
    skill: 'wheel_sums',
    stem: 'בגלגל: כל מספר חיצוני שווה לסכום שני המספרים הפנימיים שנוגעים בקו שלו. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `🔍 השיטה: כל מספר חיצוני יושב על קו — קודם מזהים אילו שני חלקים פנימיים נוגעים באותו קו.\n✓ בדיקה: על קו אחר נוגעים ${inner[(missingOuterIndex + 2) % n]} ו-${inner[(missingOuterIndex + 3) % n]}, ובאמת ${inner[(missingOuterIndex + 2) % n]} + ${inner[(missingOuterIndex + 3) % n]} = ${outerFull[(missingOuterIndex + 3) % n]} — הכלל עובד!\nליד סימן השאלה נוגעים ${a} ו-${b}: ${a} + ${b} = ${answer}.\n⚠️ המלכודת: לחבר חלקים שלא נוגעים באותו קו (למשל ${a} + ${nonAdjacent} = ${a + nonAdjacent}) — או להחסיר במקום לחבר.\nלכן התשובה: ${answer} ✔`,
    visualConfig: {
      type: 'number_wheel',
      inner,
      outer,
      missingOuterIndex,
    },
  };
}

// ── Wheel, missing-center variant: one INNER sector hidden ──────────────
// The hidden sector touches TWO spokes, so the kid extracts it from one
// spoke and VERIFIES by substitution on the other (הצבה ובדיקה).
function genWheelMissingCenter(d: Difficulty): NSGenResult {
  // The missing-center wheel is the HARD face of the wheel skill — on easy
  // sessions we fall back to the classic missing-outer variant.
  if (d === 'easy') return genWheelSums(d);

  const n = 6;
  const lo = d === 'hard' ? 4 : 2;
  const hi = d === 'hard' ? 15 : 12;
  const inner = Array.from({ length: n }, () => rand(lo, hi));
  const outerFull = Array.from({ length: n }, (_, i) => inner[(i - 1 + n) % n] + inner[i]);

  const hideIdx = rand(0, n - 1);
  const answer = inner[hideIdx];
  const prevInner = inner[(hideIdx - 1 + n) % n]; // shares spoke hideIdx
  const nextInner = inner[(hideIdx + 1) % n];     // shares spoke hideIdx+1
  const outerA = outerFull[hideIdx];              // = prevInner + answer
  const outerB = outerFull[(hideIdx + 1) % n];    // = answer + nextInner

  // The classic wrong-pairing candidate: subtracting the WRONG neighbour.
  let wrongCand = outerA - nextInner;
  if (wrongCand <= 0 || wrongCand === answer) wrongCand = answer + 2;

  const displayInner: (number | string)[] = inner.map((v, i) => (i === hideIdx ? '?' : v));
  const { options, correctOption } = makeNumOptions(answer, [
    wrongCand,
    answer + 1,
    outerB - prevInner > 0 && outerB - prevInner !== answer ? outerB - prevInner : answer - 1,
  ]);

  return {
    skill: 'wheel_sums',
    stem: 'בגלגל: כל מספר חיצוני שווה לסכום שני החלקים הפנימיים שנוגעים בקו שלו. הפעם חסר דווקא מספר פנימי. מהו המספר החסר?',
    options,
    correctOption,
    explanation: `🔍 השיטה: כשחסר חלק פנימי — מחלצים אותו מקו אחד, ואז מציבים ובודקים בקו השני.\nהחלק החסר נוגע בשני קווים: הקו של ${outerA} והקו של ${outerB}.\nמהקו הראשון: ${prevInner} + ? = ${outerA} ⇐ ? = ${outerA} − ${prevInner} = ${answer}.\n✓ הצבה ובדיקה: בקו השני ${answer} + ${nextInner} = ${outerB} ✓ — התשובה מסתדרת בשני הקווים!\n⚠️ המלכודת: מועמד כמו ${wrongCand} נראה סביר, אבל בהצבה: ${wrongCand} + ${nextInner} = ${wrongCand + nextInner} ✗ — לא שווה ל-${outerB}. תשובה נכונה חייבת לעבוד בכל הקווים.\nלכן התשובה: ${answer} ✔`,
    visualConfig: {
      type: 'number_wheel',
      inner: displayInner,
      outer: outerFull,
      missingInnerIndex: hideIdx,
    },
  };
}

// ── Butterfly: body relates to EACH wing pair (both sides agree) ────────
// Shown as a PAIR: a complete butterfly (discover + verify the rule across
// both wing pairs) next to an incomplete one. Hard: the unknown is in a
// WING, not the body — forcing the inverse operation.
function genButterfly(d: Difficulty): NSGenResult {
  const rule = d === 'easy' ? 'sum' : pick(['sum', 'diff'] as const);
  const hideWing = d === 'hard';

  // Butterfly 1 — complete. Both wing pairs obey the same rule.
  let ul1: number, ll1: number, ur1: number, lr1: number, body1: number;
  let ul2: number, ll2: number, ur2: number, lr2: number, body2: number;

  if (rule === 'sum') {
    body1 = rand(8, d === 'easy' ? 12 : 16);
    ul1 = rand(2, body1 - 2);
    ll1 = body1 - ul1;
    ur1 = rand(2, body1 - 2);
    lr1 = body1 - ur1;
    body2 = rand(8, d === 'easy' ? 12 : 16);
    if (body2 === body1) body2 = body1 + (body1 > 9 ? -1 : 1);
    ul2 = rand(2, body2 - 2);
    ll2 = body2 - ul2;
    ur2 = rand(2, body2 - 2);
    lr2 = body2 - ur2;
  } else {
    // body = upper − lower on each side
    body1 = rand(2, 6);
    ll1 = rand(3, 9);
    ul1 = ll1 + body1;
    lr1 = rand(3, 9);
    ur1 = lr1 + body1;
    body2 = rand(2, 7);
    if (body2 === body1) body2 = body1 + (body1 > 4 ? -1 : 1);
    ll2 = rand(3, 9);
    ul2 = ll2 + body2;
    lr2 = rand(3, 9);
    ur2 = lr2 + body2;
  }

  let answer: number;
  let explanation: string;
  const b2: { upperLeft: number | string; lowerLeft: number | string; upperRight: number | string; lowerRight: number | string; body: number | string } =
    { upperLeft: ul2, lowerLeft: ll2, upperRight: ur2, lowerRight: lr2, body: body2 };
  let partials: number[];

  const opWord = rule === 'sum' ? 'עליונה + תחתונה' : 'עליונה − תחתונה';
  const disc = rule === 'sum'
    ? `בפרפר השלם, בצד שמאל: ${ul1} + ${ll1} = ${body1} — בדיוק המספר שבגוף!\n✓ בדיקה בצד ימין: ${ur1} + ${lr1} = ${body1} — שני הצדדים מסכימים. הכלל: ${opWord} = גוף.`
    : `בפרפר השלם, בצד שמאל: ${ul1} − ${ll1} = ${body1} — בדיוק המספר שבגוף!\n✓ בדיקה בצד ימין: ${ur1} − ${lr1} = ${body1} — שני הצדדים מסכימים. הכלל: ${opWord} = גוף.`;

  if (!hideWing) {
    // Missing BODY of butterfly 2 — apply the rule directly.
    answer = body2;
    b2.body = '?';
    if (rule === 'sum') {
      const wrongOp = Math.abs(ul2 - ll2);
      partials = [wrongOp, ul2, ur2];
      explanation = `🔍 השיטה: בפרפר בודקים איך זוג כנפיים (עליונה ותחתונה) מתחבר לגוף — ומאמתים שהכלל עובד בשני הצדדים.\n${disc}\nבפרפר השני: ${ul2} + ${ll2} = ${answer}, וגם ${ur2} + ${lr2} = ${answer} — אותה תוצאה משני הצדדים!\n⚠️ המלכודת: מי שמחסיר במקום לחבר מקבל ${wrongOp} — פעולה הפוכה.\nלכן התשובה: ${answer} ✔`;
    } else {
      const wrongOp = ul2 + ll2;
      partials = [wrongOp, ll2, ur2];
      explanation = `🔍 השיטה: בפרפר בודקים איך זוג כנפיים (עליונה ותחתונה) מתחבר לגוף — ומאמתים שהכלל עובד בשני הצדדים.\n${disc}\nבפרפר השני: ${ul2} − ${ll2} = ${answer}, וגם ${ur2} − ${lr2} = ${answer} — אותה תוצאה משני הצדדים!\n⚠️ המלכודת: מי שמחבר במקום להחסיר מקבל ${wrongOp} — פעולה הפוכה.\nלכן התשובה: ${answer} ✔`;
    }
  } else {
    // HARD: the unknown is in a WING (lower-right) — inverse operation.
    if (rule === 'sum') {
      answer = lr2; // ur2 + ? = body2
      b2.lowerRight = '?';
      const wrongDir = body2 + ur2;
      const wrongPair = body2 - ul2 > 0 ? body2 - ul2 : answer + 3;
      partials = [wrongDir, wrongPair, ur2];
      explanation = `🔍 השיטה: מגלים את הכלל בפרפר השלם — ואז הופכים לתרגיל חסר.\n${disc}\nבפרפר השני חסרה כנף, לא הגוף! ${ur2} + ? = ${body2} ⇐ ? = ${body2} − ${ur2} = ${answer}.\n✓ בדיקה: ${ur2} + ${answer} = ${body2}, בדיוק כמו בצד שמאל: ${ul2} + ${ll2} = ${body2}.\n⚠️ המלכודת: ${wrongDir} יוצא למי שמחבר את הגוף במקום להחסיר ממנו — כיוון הפוך.\nלכן התשובה: ${answer} ✔`;
    } else {
      answer = lr2; // ur2 − ? = body2
      b2.lowerRight = '?';
      const wrongDir = ur2 + body2;
      partials = [wrongDir, ll2, body2];
      explanation = `🔍 השיטה: מגלים את הכלל בפרפר השלם — ואז הופכים לתרגיל חסר.\n${disc}\nבפרפר השני חסרה כנף, לא הגוף! ${ur2} − ? = ${body2} ⇐ ? = ${ur2} − ${body2} = ${answer}.\n✓ בדיקה: ${ur2} − ${answer} = ${body2}, בדיוק כמו בצד שמאל: ${ul2} − ${ll2} = ${body2}.\n⚠️ המלכודת: ${wrongDir} יוצא למי שמחבר במקום להחסיר — כיוון הפוך.\nלכן התשובה: ${answer} ✔`;
    }
  }

  const { options, correctOption } = makeNumOptions(answer, partials.filter(v => v !== answer));

  return {
    skill: 'butterfly',
    stem: 'בשני הפרפרים פועל אותו כלל, הקושר כל זוג כנפיים (עליונה ותחתונה) לגוף. מהו המספר החסר?',
    options,
    correctOption,
    explanation,
    visualConfig: {
      type: 'butterfly_pair',
      butterfly1: { upperLeft: ul1, lowerLeft: ll1, upperRight: ur1, lowerRight: lr1, body: body1 },
      butterfly2: b2,
    },
  };
}

// ── Star series: 5-point star, sequence around the points ───────────────
// The child must find the START, the DIRECTION, and the rule. Points are
// indexed 0..4 clockwise from the top tip (renderer uses the same order).
function genStarSeries(d: Difficulty): NSGenResult {
  const kind = d === 'hard' ? pick(['geo', 'arith'] as const) : 'arith';
  const dir = d === 'easy' ? 1 : pick([1, -1]);
  const dirName = dir === 1 ? 'עם כיוון השעון' : 'נגד כיוון השעון';

  let seq: number[];
  let k = 0;
  if (kind === 'arith') {
    k = d === 'easy' ? rand(2, 5) : rand(3, 9);
    const start = rand(2, d === 'easy' ? 9 : 15);
    seq = Array.from({ length: 5 }, (_, j) => start + j * k);
  } else {
    const start = pick([2, 3]);
    seq = Array.from({ length: 5 }, (_, j) => start * 2 ** j);
  }

  const startIdx = rand(0, 4);
  const jHide = rand(2, 4); // never hide the first two — the discovery pair stays visible
  const answer = seq[jHide];
  const prev = seq[jHide - 1];

  // Map sequence order → star point index.
  const pointOf = (j: number) => (((startIdx + dir * j) % 5) + 5) % 5;
  const points: (number | string)[] = Array(5).fill(0);
  for (let j = 0; j < 5; j++) points[pointOf(j)] = j === jHide ? '?' : seq[j];
  const missingIndex = pointOf(jHide);

  // A verify pair (m, m+1) that is fully visible and different from (0,1).
  const m = jHide === 2 ? 3 : jHide === 3 ? 1 : pick([1, 2]);

  let explanation: string;
  let partials: number[];
  if (kind === 'arith') {
    const wrongDir = prev - k;
    partials = [prev, wrongDir, answer + k];
    const trapLine = wrongDir > 0
      ? `⚠️ המלכודת: ${wrongDir} יוצא למי שהולך נגד הכיוון ומחסיר במקום להוסיף — כיוון הפוך.`
      : `⚠️ המלכודת: ${prev} כבר רשום על הכוכב — שכן מפתה, אבל לא המספר החסר.`;
    explanation = `🔍 השיטה: בכוכב מחפשים שני שכנים שקל לראות מה קרה ביניהם — כך מגלים גם את הכיוון וגם את הכלל.\nמ-${seq[0]} ל-${seq[1]} (${dirName}): הוספנו ${k}. מצאנו כיוון וכלל!\n✓ בדיקה בהמשך המסלול: ${seq[m]} + ${k} = ${seq[m + 1]} — הכלל ממשיך באותו כיוון.\nלפני סימן השאלה נמצא ${prev}: ${prev} + ${k} = ${answer}.\n${trapLine}\nלכן התשובה: ${answer} ✔`;
  } else {
    const addTrap = prev + 2;
    partials = [prev, addTrap, answer + 2];
    explanation = `🔍 השיטה: בכוכב מחפשים שני שכנים שקל לראות מה קרה ביניהם — כך מגלים גם את הכיוון וגם את הכלל.\nמ-${seq[0]} ל-${seq[1]} (${dirName}): אולי ועוד ${seq[1] - seq[0]}? נבדוק: ${seq[1]} + ${seq[1] - seq[0]} = ${seq[1] + seq[1] - seq[0]}, אבל אחרי ${seq[1]} בא ${seq[2]} ✗.\nננסה כפל: ${seq[0]} × 2 = ${seq[1]} וגם ${seq[m]} × 2 = ${seq[m + 1]} ✓ — הכלל: כל צעד מכפילים ב-2!\nלפני סימן השאלה נמצא ${prev}: ${prev} × 2 = ${answer}.\n⚠️ המלכודת: ${addTrap} יוצא למי שמוסיף 2 במקום להכפיל ב-2 — פעולה שגויה.\nלכן התשובה: ${answer} ✔`;
  }

  const { options, correctOption } = makeNumOptions(answer, partials.filter(v => v > 0 && v !== answer));

  return {
    skill: 'star_series',
    stem: 'בכל קודקוד של הכוכב רשום מספר. המספרים מסתדרים לפי חוקיות, בכיוון קבוע סביב הכוכב. מהו המספר החסר?',
    options,
    correctOption,
    explanation,
    visualConfig: {
      type: 'star_points',
      points,
      missingIndex,
    },
  };
}

// ── Multi-arrow machine: arrow COUNT scales the base operation ──────────
// META-RULE figure: each arrow = one application of a base operation
// (arrow = +k → m arrows = +m·k), or m arrows = ×m (hard). The rule lives
// in a GRAPHIC feature — the most sophisticated figure in the section.
function genMultiArrowMachine(d: Difficulty): NSGenResult {
  const flavor = d === 'easy' ? 'add' : d === 'medium' ? pick(['add', 'sub'] as const) : 'mult';

  let pairs: { from: number; to: number; arrows: number }[];
  let answer: number;
  let missing: { pair: number; side: 'from' | 'to' };
  let explanation: string;
  let partials: number[];

  if (flavor === 'add' || flavor === 'sub') {
    const k = flavor === 'add' ? rand(2, 5) : rand(2, 4);
    const counts = shuffle(d === 'easy' ? [1, 2, 3] : pick([[1, 2, 3], [1, 2, 4], [1, 3, 4]]));
    // The single-arrow pair anchors discovery — keep it visible (not last).
    if (counts[2] === 1) [counts[0], counts[2]] = [counts[2], counts[0]];
    const mkFrom = () => (flavor === 'add' ? rand(3, 12) : rand(18, 30));
    pairs = counts.map(c => {
      const from = mkFrom();
      return { from, to: flavor === 'add' ? from + c * k : from - c * k, arrows: c };
    });
    const one = pairs.find(p => p.arrows === 1)!;
    const verify = pairs.find(p => p.arrows !== 1 && p !== pairs[2])!;
    const last = pairs[2];
    answer = last.to;
    missing = { pair: 2, side: 'to' };
    const sign = flavor === 'add' ? '+' : '−';
    const singleApply = flavor === 'add' ? last.from + k : last.from - k;
    partials = [singleApply, flavor === 'add' ? answer - k : answer + k, last.from];
    explanation = `🔍 השיטה: כשמספר החצים משתנה בין השורות — החצים הם הרמז: כל חץ = פעולה אחת.\nבשורה עם חץ אחד: ${one.from} הפך ל-${one.to}, כלומר חץ אחד = ${sign}${k}.\n✓ בדיקה בשורה עם ${verify.arrows} חצים: ${verify.from} ${sign} ${verify.arrows * k} = ${verify.to} — ${verify.arrows} חצים הם ${verify.arrows} פעמים ${sign}${k}. מסתדר!\nבשורה של סימן השאלה יש ${last.arrows} חצים: ${last.from} ${sign} ${last.arrows * k} = ${answer}.\n⚠️ המלכודת: ${singleApply} יוצא למי שמפעיל את הפעולה פעם אחת בלבד ומתעלם ממספר החצים.\nלכן התשובה: ${answer} ✔`;
  } else {
    // HARD meta-rule: m arrows = ×m. Discovered by hypothesis testing.
    const counts = shuffle([2, 3, 4]);
    pairs = counts.map(c => {
      const from = rand(2, 6);
      return { from, to: from * c, arrows: c };
    });
    // The +diff hypothesis must FAIL on the second pair — nudge if it happens
    // to hold by coincidence.
    const diffA = pairs[0].to - pairs[0].from;
    if (pairs[1].from + diffA === pairs[1].to) {
      pairs[1].from += 1;
      pairs[1].to = pairs[1].from * pairs[1].arrows;
    }
    const [A, B, C] = pairs;
    const side: 'from' | 'to' = pick(['to', 'to', 'from']);
    missing = { pair: 2, side };
    if (side === 'to') {
      answer = C.to;
      const wrongCount = C.from * (C.arrows - 1);
      partials = [C.from + C.arrows, wrongCount, C.from];
      explanation = `🔍 השיטה: כשמספר החצים משתנה — בודקים אם החצים עצמם חלק מהכלל, ומנסים כלל אחד בכל פעם.\nננסה חיבור קבוע: ${A.from} + ${diffA} = ${A.to}, אבל בשורה השנייה ${B.from} + ${diffA} = ${B.from + diffA} ולא ${B.to} ✗ — נפסל.\nננסה כפל במספר החצים: ${A.from} × ${A.arrows} = ${A.to} ✓ וגם ${B.from} × ${B.arrows} = ${B.to} ✓ — הכלל: מכפילים במספר החצים!\nבשורה של סימן השאלה יש ${C.arrows} חצים: ${C.from} × ${C.arrows} = ${answer}.\n⚠️ המלכודת: ${wrongCount} יוצא למי שסופר חץ אחד פחות — סופרים חצים בזהירות!\nלכן התשובה: ${answer} ✔`;
    } else {
      answer = C.from;
      partials = [C.to - C.arrows, answer + 1, C.to];
      explanation = `🔍 השיטה: כשמספר החצים משתנה — בודקים אם החצים עצמם חלק מהכלל, ומנסים כלל אחד בכל פעם.\nננסה חיבור קבוע: ${A.from} + ${diffA} = ${A.to}, אבל בשורה השנייה ${B.from} + ${diffA} = ${B.from + diffA} ולא ${B.to} ✗ — נפסל.\nננסה כפל במספר החצים: ${A.from} × ${A.arrows} = ${A.to} ✓ וגם ${B.from} × ${B.arrows} = ${B.to} ✓ — הכלל: מכפילים במספר החצים!\nהפעם חסר המספר שנכנס: ? × ${C.arrows} = ${C.to} ⇐ ? = ${C.to} ÷ ${C.arrows} = ${answer}.\n⚠️ המלכודת: ${C.to - C.arrows} יוצא למי שמחסיר את מספר החצים במקום לחלק בו — פעולה שגויה.\nלכן התשובה: ${answer} ✔`;
    }
  }

  const { options, correctOption } = makeNumOptions(answer, partials.filter(v => v > 0 && v !== answer));

  const displayPairs = pairs.map((p, i) => ({
    from: missing.pair === i && missing.side === 'from' ? ('?' as const) : p.from,
    to: missing.pair === i && missing.side === 'to' ? ('?' as const) : p.to,
    arrows: p.arrows,
  }));

  return {
    skill: 'multi_arrow_machine',
    stem: 'בכל שורה, החצים שבין הקופסאות מבצעים את אותה פעולה — וכל חץ נחשב פעם אחת. מהו המספר החסר?',
    options,
    correctOption,
    explanation,
    visualConfig: {
      type: 'multi_arrow_machine',
      pairs: displayPairs,
      missing,
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
  // Sector wheel: spatial-adjacency sum rule (hard exam figure).
  { skill: 'wheel_sums', gen: genWheelSums },
  // Missing-center wheel: hard variant of the wheel skill — the hidden value
  // is an INNER sector, solved by substitution/consistency (הצבה ובדיקה).
  { skill: 'wheel_sums', gen: genWheelMissingCenter },
  // Reference-level figures: butterfly (rule agrees across both wing pairs),
  // star series (find start + direction + rule), multi-arrow machine
  // (meta-rule: the arrow COUNT scales the base operation).
  { skill: 'butterfly', gen: genButterfly },
  { skill: 'star_series', gen: genStarSeries },
  { skill: 'multi_arrow_machine', gen: genMultiArrowMachine },
];

export function generateNSQuestions(
  difficulty: Difficulty,
  count: number,
  options?: { skill?: NumbersInShapesSkill },
): NSQuestionWithVisual[] {
  const result: NSQuestionWithVisual[] = [];

  // Sub-skill focus (practice sub-type picker): registry entries carry their
  // skill tag, so we can filter directly. Fall back to all if none match.
  const registry = options?.skill
    ? allGenerators.filter(g => g.skill === options.skill)
    : allGenerators;
  const activeGenerators = registry.length > 0 ? registry : allGenerators;

  // Distribute across skills
  const perSkill = Math.max(1, Math.floor(count / activeGenerators.length));
  const pool: Array<{ skill: NumbersInShapesSkill; gen: NSGenFn }> = [];

  for (const entry of activeGenerators) {
    for (let i = 0; i < perSkill; i++) pool.push(entry);
  }
  while (pool.length < count) pool.push(pick(activeGenerators));

  for (const { gen } of shuffle(pool).slice(0, count)) {
    // Adaptive stretches toward exam level — no pure-easy in the default mode.
    const d: Difficulty = difficulty === 'adaptive'
      ? pick(['medium', 'medium', 'hard', 'hard'])
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
