/**
 * Math question generator — produces infinite variations of word problems,
 * number sequences, math logic, time/clock, and money/change questions.
 */
import type { Question, Difficulty, MathSkill } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────

let _c = 0;
const uid = () => `gm_${Date.now()}_${++_c}_${Math.random().toString(36).slice(2, 6)}`;
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

// ── Name / object pools ─────────────────────────────────────────────────

const boys = ['יוסי', 'דני', 'אורי', 'נועם', 'עומר', 'איתי', 'רועי', 'גיל', 'ערן', 'תומר', 'אביב', 'שגיא', 'נדב', 'עידו', 'אלון', 'עמית', 'ליאם', 'אריאל'];
const girls = ['נועה', 'מיכל', 'דנה', 'שרה', 'מאיה', 'יעל', 'רותם', 'הילה', 'אביגיל', 'שירה', 'טלי', 'רוני', 'נופר', 'תמר', 'אגם', 'ליהי'];
const boyName = () => pick(boys);
const girlName = () => pick(girls);

// Items that work with Hebrew counting (plural forms)
const countableItems = [
  { s: 'ספר', p: 'ספרים' }, { s: 'עפרון', p: 'עפרונות' }, { s: 'כדור', p: 'כדורים' },
  { s: 'בול', p: 'בולים' }, { s: 'דף', p: 'דפים' }, { s: 'מדבקה', p: 'מדבקות' },
  { s: 'גולה', p: 'גולות' }, { s: 'עוגייה', p: 'עוגיות' }, { s: 'ממתק', p: 'ממתקים' },
  { s: 'תפוח', p: 'תפוחים' }, { s: 'בלון', p: 'בלונים' }, { s: 'צבע', p: 'צבעים' },
  { s: 'מחברת', p: 'מחברות' }, { s: 'שקית', p: 'שקיות' }, { s: 'קופסה', p: 'קופסאות' },
  { s: 'פרח', p: 'פרחים' }, { s: 'כוכב', p: 'כוכבים' }, { s: 'אבן', p: 'אבנים' },
];

const containers = [
  { s: 'מדף', p: 'מדפים' }, { s: 'שקית', p: 'שקיות' }, { s: 'קופסה', p: 'קופסאות' },
  { s: 'ארגז', p: 'ארגזים' }, { s: 'מגש', p: 'מגשים' }, { s: 'סל', p: 'סלים' },
];

const places = ['בחנות', 'בספרייה', 'בבית הספר', 'בגן', 'במחסן', 'בסופר', 'בכיתה', 'במטבח'];

// ── Option generation ───────────────────────────────────────────────────

function makeOptions(correct: number, partials: number[] = []): { options: string[]; correctOption: number } {
  const set = new Set<number>([correct]);
  // Add partial/common-mistake values first
  for (const p of partials) {
    if (p > 0 && p !== correct) set.add(p);
  }
  // Add close distractors
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4, 5, -4, 6, -5, 7]);
  for (const off of offsets) {
    if (set.size >= 4) break;
    const v = correct + off;
    if (v > 0 && !set.has(v)) set.add(v);
  }
  while (set.size < 4) set.add(correct + rand(1, 20));

  const arr = shuffle(Array.from(set).slice(0, 4));
  return { options: arr.map(String), correctOption: arr.indexOf(correct) };
}

// ── Difficulty params ───────────────────────────────────────────────────

function diffRange(d: Difficulty): { lo: number; hi: number; steps: number } {
  if (d === 'easy') return { lo: 2, hi: 9, steps: 2 };
  if (d === 'hard') return { lo: 5, hi: 30, steps: 4 };
  return { lo: 3, hi: 15, steps: 3 }; // medium + adaptive
}

function timeSec(d: Difficulty): number {
  if (d === 'easy') return 65;
  if (d === 'hard') return 85;
  return 75;
}

// ── Template base ───────────────────────────────────────────────────────

interface GenResult {
  stem: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

type TemplateGen = (d: Difficulty) => GenResult;

// ═══════════════════════════════════════════════════════════════════════
// WORD PROBLEMS
// ═══════════════════════════════════════════════════════════════════════

const wp1: TemplateGen = (d) => {
  // Pattern: N containers × M items each, distractor count of irrelevant containers.
  const { lo, hi } = diffRange(d);
  const name = boyName();
  const cont = pick(containers);
  const item = pick(countableItems);
  const distractorCont = pick(containers.filter(c => c.p !== cont.p)); // cache once — reused in stem & explanation
  const nCont = rand(lo, Math.min(hi, 8));
  const perCont = rand(lo, hi);
  const total = nCont * perCont;
  const place = pick(places);
  const distractor = rand(2, 6); // irrelevant info

  const stem = `${place} יש ${distractor} ${distractorCont.p}. ל${name} יש ${nCont} ${cont.p} ובכל ${cont.s} ${perCont} ${item.p}. כמה ${item.p} יש ל${name} סך הכול?`;
  const answer = total;
  const { options, correctOption } = makeOptions(answer, [nCont + perCont, distractor * nCont]);
  const explanation = `ל${name} ${nCont} ${cont.p}, בכל אחת ${perCont} ${item.p}.\n${nCont} × ${perCont} = ${answer}.\nהמידע על ${distractor} ${distractorCont.p} הוא מסיח!`;
  return { stem, options, correctOption, explanation };
};

const wp2: TemplateGen = (d) => {
  // Pattern: Had X, gave away Y, how many left
  const { lo, hi } = diffRange(d);
  const name = girlName();
  const item = pick(countableItems);
  const bags = rand(lo, Math.min(hi, 6));
  const perBag = rand(lo, hi);
  const total = bags * perBag;
  const gave = rand(Math.floor(total * 0.2), Math.floor(total * 0.6));
  const answer = total - gave;

  const stem = `ל${name} יש ${bags} ${pick(containers).p} של ${item.p}. בכל אחת ${perBag} ${item.p}. היא נתנה ${gave} ${item.p} לחברותיה. כמה ${item.p} נשארו ל${name}?`;
  const { options, correctOption } = makeOptions(answer, [total, gave, bags * perBag + gave]);
  const explanation = `סך ${item.p}: ${bags} × ${perBag} = ${total}.\nנתנה ${gave}, לכן ${total} - ${gave} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const wp3: TemplateGen = (d) => {
  // Pattern: Bus passengers - people get on/off at stops
  const { hi } = diffRange(d);
  const start = rand(15, 40);
  const stops = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;
  let current = start;
  const events: string[] = [];
  const stepNames = ['הראשונה', 'השנייה', 'השלישית', 'הרביעית'];
  const steps: string[] = [`התחלה: ${start}`];

  for (let i = 0; i < stops; i++) {
    const off = rand(2, Math.min(current - 1, hi));
    const on = rand(1, hi);
    current = current - off + on;
    events.push(`בתחנה ה${stepNames[i]} ירדו ${off} ועלו ${on}`);
    steps.push(`תחנה ${stepNames[i]}: ${current + off - on} - ${off} + ${on} = ${current}`);
  }

  const stem = `באוטובוס היו ${start} נוסעים. ${events.join('. ')}. כמה נוסעים באוטובוס עכשיו?`;
  const { options, correctOption } = makeOptions(current, [start, current + 2, current - 2]);
  const explanation = steps.join('\n') + `\nהתשובה היא ${current}.`;
  return { stem, options, correctOption, explanation };
};

const wp4: TemplateGen = (d) => {
  // Pattern: Groups of animals/items - add totals
  const { lo, hi } = diffRange(d);
  const place = pick(['בגן חיות', 'בחווה', 'במשק', 'בפארק']);
  const type1 = pick(['ציפורים', 'דגים', 'ארנבות', 'כלבים', 'חתולים', 'תוכים']);
  const type2 = pick(['דגים', 'צבים', 'ציפורים', 'תוכים', 'ברווזים', 'ארנבות'].filter(t => t !== type1));
  const cont1 = pick(['כלובים', 'בריכות', 'לולים', 'חדרים']);
  const cont2 = pick(['בריכות', 'לולים', 'כלובים', 'חדרים'].filter(c => c !== cont1));
  const n1 = rand(lo, Math.min(hi, 8));
  const per1 = rand(lo, hi);
  const n2 = rand(lo, Math.min(hi, 8));
  const per2 = rand(lo, hi);
  const total1 = n1 * per1;
  const total2 = n2 * per2;
  const answer = total1 + total2;

  const stem = `${place} יש ${n1} ${cont1} של ${type1}. בכל אחד ${per1} ${type1}. יש גם ${n2} ${cont2} של ${type2} ובכל אחת ${per2}. כמה חיות יש סך הכול?`;
  const { options, correctOption } = makeOptions(answer, [total1, total2, n1 * per2]);
  const explanation = `${type1}: ${n1} × ${per1} = ${total1}.\n${type2}: ${n2} × ${per2} = ${total2}.\nסך הכול: ${total1} + ${total2} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const wp5: TemplateGen = (d) => {
  // Pattern: Division with remainder. Bug fix: previous version constructed
  // `had = total + leftover` where leftover could exceed groups, so the
  // narrative claimed "had ÷ groups = perGroup ושארית leftover" but real
  // long division would give a higher quotient. Now we re-derive perGroup
  // and leftover from the chosen `had` so the math always matches.
  const { lo, hi } = diffRange(d);
  const name = pick([...boys, ...girls]);
  const item = pick(countableItems);
  const groups = rand(Math.max(2, lo), Math.min(hi, 6));
  // Pick `had` that gives a clean problem: perGroup ∈ [lo, hi], leftover ∈ [1, groups-1].
  const seedPerGroup = rand(lo, hi);
  const seedLeftover = rand(1, groups - 1);
  const had = groups * seedPerGroup + seedLeftover;
  const perGroup = Math.floor(had / groups);
  const leftover = had % groups;
  const total = had - leftover;

  const stem = `ל${name} היו ${had} ${item.p}. הוא חילק אותם שווה בשווה ל-${groups} חברים. כמה ${item.p} נשארו ל${name} אחרי החלוקה?`;
  const answer = leftover;
  const { options, correctOption } = makeOptions(answer, [perGroup, groups, total]);
  // Hebrew gender: singular form for "1 of X", plural for the rest. Avoids "1 צבעים".
  const itemSingularPhrase = leftover === 1 ? `${item.s} אחד` : `${leftover} ${item.p}`;
  const explanation = `כל חבר קיבל ${perGroup} ${item.p} (כי ${groups} × ${perGroup} = ${total}).\nאחרי החלוקה השוויונית נשאר/ו ל${name}: ${had} − ${total} = ${itemSingularPhrase}.`;
  return { stem, options, correctOption, explanation };
};

const wp6: TemplateGen = (d) => {
  // Pattern: Doubling each day — kept ONLY at hard difficulty (3 days max).
  // Real Stage B doesn't use geometric-doubling sums for 2nd grade; we cap depth
  // so the answer stays mentally tractable.
  const { lo } = diffRange(d);
  const name = boyName();
  const item = pick(countableItems);
  const start = rand(lo, 4);
  const days = d === 'hard' ? 3 : 2;
  const dayNames = ['ראשון', 'שני', 'שלישי'];
  let current = start;
  let sum = start;
  const steps: string[] = [`יום ${dayNames[0]}: ${start}`];

  for (let i = 1; i < days; i++) {
    current *= 2;
    sum += current;
    steps.push(`יום ${dayNames[i]}: ${current}`);
  }

  const stem = `${name} אסף ${item.p} במשך ${days} ימים. ביום הראשון אסף ${start}, ובכל יום אסף כפול מהיום הקודם. כמה ${item.p} אסף סך הכול?`;
  const answer = sum;
  const { options, correctOption } = makeOptions(answer, [current, sum - start, start * days]);
  const explanation = steps.join('\n') + `\nסך הכול: ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const wp7: TemplateGen = (d) => {
  // Pattern: Start with X, add/remove through events, ask how many at start (reverse)
  const { lo, hi } = diffRange(d);
  const item = pick(countableItems);
  const place = pick(['בספרייה', 'בחנות', 'בכיתה', 'בגן']);
  const perShelf = rand(lo, hi);
  const shelves = rand(lo, Math.min(hi, 7));
  const startAmount = shelves * perShelf;
  const removed = rand(5, Math.floor(startAmount * 0.5));
  const added = rand(5, 25);
  const answer = startAmount - removed + added;

  const stem = `${place} יש ${shelves} ${pick(containers).p}. בכל אחד ${perShelf} ${item.p}. לקחו ${removed} ${item.p}, ואז הוסיפו ${added} ${item.p} חדשים. כמה ${item.p} יש עכשיו?`;
  const { options, correctOption } = makeOptions(answer, [startAmount, startAmount + added, startAmount - removed]);
  const explanation = `בהתחלה: ${shelves} × ${perShelf} = ${startAmount} ${item.p}.\nאחרי הוצאה: ${startAmount} - ${removed} = ${startAmount - removed}.\nאחרי הוספה: ${startAmount - removed} + ${added} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const wp8: TemplateGen = (d) => {
  // Pattern: Mom distributes cookies, how many at start
  const { lo, hi } = diffRange(d);
  const parent = pick(['אמא', 'אבא', 'סבתא', 'סבא']);
  const item = pick(countableItems);
  const children = rand(lo, Math.min(hi, 5));
  const perChild = rand(lo, hi);
  const leftover = rand(2, 8);
  const answer = children * perChild + leftover;

  const stem = `${parent} חילק/ה ${item.p} ל-${children} ילדים. כל ילד קיבל ${perChild} ${item.p}. אחרי החלוקה נשארו ${leftover} ${item.p}. כמה ${item.p} היו בהתחלה?`;
  const { options, correctOption } = makeOptions(answer, [children * perChild, leftover * children, children + perChild + leftover]);
  const explanation = `חולקו: ${children} × ${perChild} = ${children * perChild} ${item.p}.\nבהתחלה: ${children * perChild} + ${leftover} = ${answer} ${item.p}.`;
  return { stem, options, correctOption, explanation };
};

// ═══════════════════════════════════════════════════════════════════════
// NUMBER SEQUENCES
// ═══════════════════════════════════════════════════════════════════════

const seq1: TemplateGen = (d) => {
  // Arithmetic sequence: +d
  const { lo, hi } = diffRange(d);
  const diff = rand(lo, Math.min(hi, 12));
  const start = rand(1, 20);
  const len = d === 'easy' ? 4 : 5;
  const seq = Array.from({ length: len }, (_, i) => start + i * diff);
  const answer = start + len * diff;

  const stem = `מהו המספר הבא בסדרה? ${seq.join(', ')}, ?`;
  const { options, correctOption } = makeOptions(answer, [answer + diff, answer - diff, seq[len - 1] * 2]);
  const explanation = `ההפרש בין כל שני מספרים: ${diff}.\n${seq[len - 1]} + ${diff} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const seq2: TemplateGen = (d) => {
  // Geometric sequence ×r — kept simple for grade 2: only ratio 2 or (rare) 3,
  // and short sequences so the final number stays under 100.
  const ratio = d === 'hard' ? pick([2, 3]) : 2;
  const start = ratio === 3 ? rand(1, 2) : rand(1, 4);
  const len = d === 'easy' ? 3 : 4;
  const seq = Array.from({ length: len }, (_, i) => start * Math.pow(ratio, i));
  const answer = start * Math.pow(ratio, len);

  const stem = `מהו המספר הבא בסדרה? ${seq.join(', ')}, ?`;
  const { options, correctOption } = makeOptions(answer, [answer + ratio, seq[len - 1] + ratio, Math.floor(answer / 2)]);
  const explanation = `כל מספר מוכפל ב-${ratio}.\n${seq[len - 1]} × ${ratio} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const seq3: TemplateGen = (d) => {
  // Quadratic: differences increase by d
  const inc = d === 'easy' ? 1 : d === 'hard' ? pick([2, 3]) : pick([1, 2]);
  const firstDiff = rand(1, 4);
  const start = rand(1, 10);
  const len = d === 'easy' ? 5 : 6;
  const seq: number[] = [start];
  let diff = firstDiff;
  for (let i = 1; i < len; i++) {
    seq.push(seq[i - 1] + diff);
    diff += inc;
  }
  const answer = seq[len - 1] + diff;
  const diffs = [];
  for (let i = 1; i < seq.length; i++) diffs.push(seq[i] - seq[i - 1]);

  const stem = `מהו המספר הבא בסדרה? ${seq.join(', ')}, ?`;
  const { options, correctOption } = makeOptions(answer, [answer + 1, answer - 1, seq[len - 1] + diffs[diffs.length - 1]]);
  const explanation = `ההפרשים: ${diffs.join(', ')}.\nההפרשים גדלים ב-${inc} כל פעם. ההפרש הבא: ${diff}.\n${seq[len - 1]} + ${diff} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const seq4: TemplateGen = (d) => {
  // Fibonacci-like: each = sum of prev two
  const a = rand(1, 5);
  const b = rand(1, 5);
  const seq = [a, b];
  const len = d === 'easy' ? 4 : 5;
  for (let i = 2; i < len; i++) seq.push(seq[i - 1] + seq[i - 2]);
  const answer = seq[len - 1] + seq[len - 2];

  const stem = `מהו המספר הבא בסדרה? ${seq.join(', ')}, ?`;
  const { options, correctOption } = makeOptions(answer, [answer + 1, seq[len - 1] * 2, answer - seq[0]]);
  const explanation = `כל מספר הוא סכום שני המספרים שלפניו.\n${seq[len - 2]} + ${seq[len - 1]} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const seq5: TemplateGen = (d) => {
  // Missing number in middle of sequence
  const diff = rand(2, d === 'easy' ? 5 : d === 'hard' ? 12 : 8);
  const start = rand(1, 20);
  const len = 5;
  const seq = Array.from({ length: len }, (_, i) => start + i * diff);
  const missingIdx = rand(1, len - 2);
  const answer = seq[missingIdx];
  const display = seq.map((v, i) => i === missingIdx ? '?' : String(v)).join(', ');

  const stem = `מהו המספר החסר בסדרה? ${display}`;
  const { options, correctOption } = makeOptions(answer, [answer + diff, answer - diff, answer + 1]);
  const explanation = `ההפרש בין כל שני מספרים: ${diff}.\nהמספר החסר: ${seq[missingIdx - 1]} + ${diff} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

// ═══════════════════════════════════════════════════════════════════════
// MATH LOGIC
// ═══════════════════════════════════════════════════════════════════════

const ml1: TemplateGen = (d) => {
  // Symbol equations: ○ + ○ + △ = N, △ = ○ + K
  const { lo, hi } = diffRange(d);
  const circle = rand(lo, hi);
  const k = rand(1, 6);
  const triangle = circle + k;
  const total = circle * 2 + triangle;

  const stem = `אם ○ + ○ + △ = ${total}, וגם △ = ○ + ${k}, כמה שווה ○?`;
  const answer = circle;
  const { options, correctOption } = makeOptions(answer, [triangle, total - circle, k]);
  const explanation = `נציב △ = ○ + ${k}:\n○ + ○ + (○ + ${k}) = ${total}\n3 × ○ + ${k} = ${total}\n3 × ○ = ${total - k}\n○ = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const ml2: TemplateGen = (d) => {
  // Reverse operations: at most 2 ops for grade 2 (×then+, or +then×).
  // The previous version chained 3 ops and re-overwrote `result` causing answer/explanation drift.
  const answer = rand(3, d === 'hard' ? 12 : 8);
  const mult = rand(2, d === 'hard' ? 4 : 3);
  const add = rand(2, 8);
  const result = answer * mult + add;
  const stem = `יש לי מספר. הכפלתי אותו ב-${mult} ואז הוספתי ${add}. קיבלתי ${result}. מה המספר המקורי?`;
  const { options, correctOption } = makeOptions(answer, [answer + 1, answer - 1, mult + add]);
  const explanation = `נעבוד אחורה:\nלפני ההוספה של ${add}: ${result} − ${add} = ${result - add}.\nלפני ההכפלה ב-${mult}: ${result - add} ÷ ${mult} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const ml3: TemplateGen = (d) => {
  // Three friends, distribution problem
  const names = shuffle([...boys, ...girls]).slice(0, 3);
  const item = pick(countableItems);
  const x = rand(3, d === 'hard' ? 12 : 8);
  const knownAmount = rand(4, 10);
  const multiplier = rand(2, 3);
  // names[0] has multiplier * x, names[1] has knownAmount, names[2] has x
  const total = multiplier * x + knownAmount + x;

  const stem = `שלושה חברים — ${names[0]}, ${names[1]} ו${names[2]} — אספו ביחד ${total} ${item.p}. ל${names[1]} יש ${knownAmount}. ל${names[0]} יש ${multiplier === 2 ? 'כפול' : 'פי שלושה'} מ${names[2]}. כמה ${item.p} יש ל${names[0]}?`;
  const answer = multiplier * x;
  const { options, correctOption } = makeOptions(answer, [x, total - knownAmount, knownAmount * multiplier]);
  const explanation = `ל${names[1]} ${knownAmount}, לכן ל${names[0]} ו${names[2]} ביחד: ${total} - ${knownAmount} = ${total - knownAmount}.\nנסמן את ${names[2]} כ-X. ${names[0]} = ${multiplier}X.\nX + ${multiplier}X = ${total - knownAmount} → ${multiplier + 1}X = ${total - knownAmount} → X = ${x}.\n${names[0]} = ${multiplier} × ${x} = ${answer}.`;
  return { stem, options, correctOption, explanation };
};

const ml4: TemplateGen = (d) => {
  // Two equations with two symbols
  const a = rand(2, d === 'hard' ? 10 : 7);
  const b = rand(2, d === 'hard' ? 10 : 7);
  const sum = a + b;
  const diff = Math.abs(a - b);
  const bigger = Math.max(a, b);

  const stem = `□ + ○ = ${sum}, □ - ○ = ${diff}. כמה שווה ${a >= b ? '□' : '○'}?`;
  const answer = bigger;
  const { options, correctOption } = makeOptions(answer, [sum, diff, Math.min(a, b)]);
  const explanation = `${a >= b ? '□' : '○'} + ${a >= b ? '○' : '□'} = ${sum}\n${a >= b ? '□' : '○'} - ${a >= b ? '○' : '□'} = ${diff}\nנחבר: 2 × ${a >= b ? '□' : '○'} = ${sum + diff} → ${a >= b ? '□' : '○'} = ${bigger}.`;
  return { stem, options, correctOption, explanation };
};

// ═══════════════════════════════════════════════════════════════════════
// TIME / CLOCK
// ═══════════════════════════════════════════════════════════════════════

function fmtTime(h: number, m: number): string {
  const mm = m % 60;
  const hh = h + Math.floor(m / 60);
  return `${hh}:${mm.toString().padStart(2, '0')}`;
}

function addMin(h: number, m: number, add: number): [number, number] {
  const total = h * 60 + m + add;
  return [Math.floor(total / 60), total % 60];
}

const tc1: TemplateGen = (d) => {
  // Activity starts at time, lasts duration, when does it end
  const activities = ['הסרט', 'ההצגה', 'השיעור', 'האימון', 'המשחק', 'הטיול'];
  const activity = pick(activities);
  const h = rand(7, 17);
  const m = pick([0, 10, 15, 20, 30, 40, 45, 50]);
  const durationMin = d === 'easy' ? pick([30, 45, 60]) : d === 'hard' ? rand(55, 95) : pick([35, 45, 50, 75]);
  const [eh, em] = addMin(h, m, durationMin);

  const durText = durationMin >= 60
    ? `${durationMin === 60 ? 'שעה' : `שעה ו-${durationMin - 60} דקות`}`
    : `${durationMin} דקות`;

  const stem = `${activity} מתחיל ב-${fmtTime(h, m)} ונמשך ${durText}. באיזו שעה ${activity} מסתיים?`;
  const correctStr = fmtTime(eh, em);
  const wrong1 = fmtTime(...addMin(h, m, durationMin + 15));
  const wrong2 = fmtTime(...addMin(h, m, durationMin - 15));
  const wrong3 = fmtTime(...addMin(h, m, durationMin + 30));
  const allOpts = shuffle([correctStr, wrong1, wrong2, wrong3]);

  return {
    stem,
    options: allOpts,
    correctOption: allOpts.indexOf(correctStr),
    explanation: `${fmtTime(h, m)} + ${durationMin} דקות = ${correctStr}.`,
  };
};

const tc2: TemplateGen = (d) => {
  // Multi-leg journey: leave at X, walk Y min, wait Z min, activity W min
  const name = boyName();
  const h = rand(7, 16);
  const m = pick([0, 5, 10, 15, 20, 30, 40, 45, 50]);
  const walk = rand(10, 30);
  const wait = d !== 'easy' ? rand(5, 15) : 0;
  const totalAdd = walk + wait;
  const [eh, em] = addMin(h, m, totalAdd);
  const correctStr = fmtTime(eh, em);

  let stem: string;
  if (wait > 0) {
    stem = `${name} יצא מהבית בשעה ${fmtTime(h, m)}. ההליכה לקחה ${walk} דקות. הוא חיכה ${wait} דקות. באיזו שעה הגיע?`;
  } else {
    stem = `${name} יצא מהבית בשעה ${fmtTime(h, m)}. ההליכה לבית הספר לקחה ${walk} דקות. באיזו שעה הגיע?`;
  }

  const wrong1 = fmtTime(...addMin(h, m, walk));
  const wrong2 = fmtTime(...addMin(h, m, totalAdd + 10));
  const wrong3 = fmtTime(...addMin(h, m, totalAdd - 10 > 0 ? totalAdd - 10 : totalAdd + 20));
  const allOpts = shuffle(Array.from(new Set([correctStr, wrong1, wrong2, wrong3])).slice(0, 4));
  while (allOpts.length < 4) allOpts.push(fmtTime(...addMin(h, m, totalAdd + rand(15, 30))));

  return {
    stem,
    options: allOpts.slice(0, 4),
    correctOption: allOpts.indexOf(correctStr),
    explanation: `${fmtTime(h, m)} + ${walk} דקות${wait > 0 ? ` + ${wait} דקות` : ''} = ${correctStr}.`,
  };
};

const tc3: TemplateGen = (d) => {
  // Homework: multiple subjects, how long total or when finished
  const name = girlName();
  const h = rand(14, 17);
  const m = pick([0, 10, 15, 20, 30]);
  const subjects = shuffle(['חשבון', 'עברית', 'אנגלית', 'מדעים', 'היסטוריה']);
  const numSubjects = d === 'easy' ? 2 : 3;
  const durations = Array.from({ length: numSubjects }, () => rand(15, 40));
  const totalMin = durations.reduce((s, v) => s + v, 0);
  const [eh, em] = addMin(h, m, totalMin);
  const correctStr = fmtTime(eh, em);

  const parts = subjects.slice(0, numSubjects).map((s, i) => `${s} במשך ${durations[i]} דקות`);
  const stem = `${name} התחילה שיעורי בית ב-${fmtTime(h, m)}. היא למדה ${parts.join(' ואז ')}. באיזו שעה סיימה?`;

  const wrong1 = fmtTime(...addMin(h, m, totalMin + 10));
  const wrong2 = fmtTime(...addMin(h, m, totalMin - 10));
  const wrong3 = fmtTime(...addMin(h, m, durations[0]));
  const allOpts = shuffle(Array.from(new Set([correctStr, wrong1, wrong2, wrong3])));
  while (allOpts.length < 4) allOpts.push(fmtTime(...addMin(h, m, totalMin + rand(5, 25))));

  return {
    stem,
    options: allOpts.slice(0, 4),
    correctOption: allOpts.indexOf(correctStr),
    explanation: `סך זמן: ${durations.join(' + ')} = ${totalMin} דקות.\n${fmtTime(h, m)} + ${totalMin} דקות = ${correctStr}.`,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// MONEY / CHANGE
// ═══════════════════════════════════════════════════════════════════════

const shopItems = [
  { name: 'מדבקה', plural: 'מדבקות' }, { name: 'ספר', plural: 'ספרים' },
  { name: 'עט', plural: 'עטים' }, { name: 'מחברת', plural: 'מחברות' },
  { name: 'שוקולד', plural: 'שוקולדים' }, { name: 'ארטיק', plural: 'ארטיקים' },
  { name: 'צעצוע', plural: 'צעצועים' }, { name: 'כדור', plural: 'כדורים' },
];

const mc1: TemplateGen = (d) => {
  // Buy items, pay with bill, get change
  const { lo, hi } = diffRange(d);
  const name = pick([...boys, ...girls]);
  const item1 = pick(shopItems);
  const item2 = pick(shopItems.filter(i => i.name !== item1.name));
  const qty1 = rand(2, Math.min(hi, 6));
  const price1 = rand(lo, hi);
  const price2 = rand(lo, hi);
  const total = qty1 * price1 + price2;
  const bill = pick([20, 50, 100].filter(b => b > total));
  const answer = bill - total;

  const stem = `${name} קנה ${qty1} ${item1.plural} ב-${price1} שקלים כל אחת, ו${item2.name} ב-${price2} שקלים. שילם עם שטר של ${bill} שקלים. כמה עודף קיבל?`;
  const { options, correctOption } = makeOptions(answer, [total, bill - qty1 * price1, qty1 * price1]);
  const explanation = `${item1.plural}: ${qty1} × ${price1} = ${qty1 * price1} ₪.\nסך הכול: ${qty1 * price1} + ${price2} = ${total} ₪.\nעודף: ${bill} - ${total} = ${answer} ₪.`;
  return { stem, options, correctOption, explanation };
};

const mc2: TemplateGen = (d) => {
  // Started with X, bought multiple things, how much left
  const { lo, hi } = diffRange(d);
  const name = girlName();
  const start = pick([50, 100, 200]);
  const items = shuffle(shopItems).slice(0, d === 'easy' ? 2 : 3);
  const qtys = items.map(() => rand(1, Math.min(hi, 4)));
  const prices = items.map(() => rand(lo, Math.min(hi, 15)));
  const costs = qtys.map((q, i) => q * prices[i]);
  const totalSpent = costs.reduce((s, v) => s + v, 0);
  // Make sure we don't go negative
  const actualStart = Math.max(start, totalSpent + rand(5, 20));
  const answer = actualStart - totalSpent;

  const parts = items.map((item, i) => `${qtys[i]} ${item.plural} ב-${prices[i]} שקלים כל אחד`);
  const stem = `ל${name} יש ${actualStart} שקלים. היא קנתה ${parts.join(' ו')}. כמה כסף נשאר ל${name}?`;
  const { options, correctOption } = makeOptions(answer, [totalSpent, actualStart, costs[0]]);
  const stepLines = items.map((item, i) => `${item.plural}: ${qtys[i]} × ${prices[i]} = ${costs[i]} ₪`);
  const explanation = `${stepLines.join('\n')}\nסך קנייה: ${costs.join(' + ')} = ${totalSpent} ₪.\nנשאר: ${actualStart} - ${totalSpent} = ${answer} ₪.`;
  return { stem, options, correctOption, explanation };
};

const mc3: TemplateGen = (_d) => {
  // Discount problem
  const item = pick(shopItems);
  const qty = rand(2, 5);
  const price = rand(3, 15);
  const fullPrice = qty * price;
  const discount = rand(2, Math.min(fullPrice - 1, 10));
  const answer = fullPrice - discount;

  const stem = `חנות מוכרת ${item.name} ב-${price} שקלים. אם קונים ${qty} ${item.plural}, מקבלים הנחה של ${discount} שקלים. כמה עולים ${qty} ${item.plural} אחרי ההנחה?`;
  const { options, correctOption } = makeOptions(answer, [fullPrice, discount, price * (qty - 1)]);
  const explanation = `מחיר ללא הנחה: ${qty} × ${price} = ${fullPrice} ₪.\nאחרי הנחה: ${fullPrice} - ${discount} = ${answer} ₪.`;
  return { stem, options, correctOption, explanation };
};

// ═══════════════════════════════════════════════════════════════════════
// Template Registry
// ═══════════════════════════════════════════════════════════════════════

interface SkillTemplates {
  skill: MathSkill;
  templates: TemplateGen[];
}

// Templates marked "*" are reserved for hard difficulty only — they reach
// pre-algebra / multi-step territory above grade-2 norm.
const allTemplates: SkillTemplates[] = [
  { skill: 'word_problems', templates: [wp1, wp2, wp3, wp4, wp5, wp7, wp8] },
  { skill: 'number_sequences', templates: [seq1, seq2, seq4, seq5] },
  { skill: 'math_logic', templates: [ml2, ml4] },
  { skill: 'time_clock', templates: [tc1, tc2, tc3] },
  { skill: 'money_change', templates: [mc1, mc2, mc3] },
];

// Hard-only templates: pre-algebra patterns only surfaced when the adaptive
// engine flags the child as ready for stretch material.
const hardOnlyTemplates: SkillTemplates[] = [
  { skill: 'word_problems', templates: [wp6] },
  { skill: 'number_sequences', templates: [seq3] },
  { skill: 'math_logic', templates: [ml1, ml3] },
];

// ── Public API ──────────────────────────────────────────────────────────

export function generateMathQuestions(
  difficulty: Difficulty,
  count: number,
  options?: { skill?: MathSkill; recentTemplates?: Set<TemplateGen> },
): Question[] {
  const result: Question[] = [];
  const effectiveDiff: Difficulty = difficulty === 'adaptive' ? pick(['easy', 'medium', 'hard']) : difficulty;

  // Build the working template list: filter by skill if requested, and only
  // surface hard-only templates when the difficulty is actually hard.
  const baseTemplates = options?.skill
    ? allTemplates.filter(t => t.skill === options.skill)
    : allTemplates;
  const hardExtras = effectiveDiff === 'hard'
    ? (options?.skill
        ? hardOnlyTemplates.filter(t => t.skill === options.skill)
        : hardOnlyTemplates)
    : [];
  const workingSets: SkillTemplates[] = [...baseTemplates];
  for (const extra of hardExtras) {
    const existing = workingSets.find(s => s.skill === extra.skill);
    if (existing) existing.templates = [...existing.templates, ...extra.templates];
    else workingSets.push(extra);
  }
  if (workingSets.length === 0) workingSets.push(...allTemplates); // safety fallback

  const recent = options?.recentTemplates ?? new Set<TemplateGen>();
  const pickFresh = (templates: TemplateGen[]): TemplateGen => {
    const fresh = templates.filter(t => !recent.has(t));
    return pick(fresh.length > 0 ? fresh : templates);
  };

  // Distribute evenly across skills, then fill randomly
  const perSkill = Math.max(1, Math.floor(count / workingSets.length));
  const pool: Array<{ skill: MathSkill; gen: TemplateGen }> = [];

  for (const { skill, templates } of workingSets) {
    for (let i = 0; i < perSkill; i++) {
      const gen = pickFresh(templates);
      pool.push({ skill, gen });
      recent.add(gen);
    }
  }

  // Fill remaining
  while (pool.length < count) {
    const st = pick(workingSets);
    const gen = pickFresh(st.templates);
    pool.push({ skill: st.skill, gen });
    recent.add(gen);
  }

  for (const { skill, gen } of shuffle(pool).slice(0, count)) {
    const d = difficulty === 'adaptive' ? pick(['easy', 'medium', 'hard']) as Difficulty : effectiveDiff;
    const r = gen(d);
    result.push({
      id: uid(),
      sectionType: 'math',
      skillTag: skill,
      difficulty: d,
      questionType: 'text',
      stem: r.stem,
      options: r.options,
      correctOption: r.correctOption,
      explanation: r.explanation,
      recommendedTimeSec: timeSec(d),
      generatorSource: 'generated',
      qualityScore: 88,
      isActive: true,
    });
  }

  return result;
}
