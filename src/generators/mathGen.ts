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
  // Guard: a non-finite `correct` (NaN/Infinity from a buggy template) used to
  // spin the while-loop below forever, because a Set dedups NaN against NaN.
  // Fail loudly instead of hanging the whole session build.
  if (!Number.isFinite(correct)) {
    throw new Error(`makeOptions: non-finite correct value (${correct}) — check the calling template`);
  }
  const set = new Set<number>([correct]);
  // Add partial/common-mistake values first (skip non-finite partials quietly)
  for (const p of partials) {
    if (Number.isFinite(p) && p > 0 && p !== correct) set.add(p);
  }
  // Add close distractors
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4, 5, -4, 6, -5, 7]);
  for (const off of offsets) {
    if (set.size >= 4) break;
    const v = correct + off;
    if (v > 0 && !set.has(v)) set.add(v);
  }
  let guard = 0;
  while (set.size < 4 && guard++ < 100) set.add(correct + rand(1, 20));
  // Deterministic top-up if randomness somehow starved (paranoia-level safety).
  for (let i = 1; set.size < 4; i++) set.add(correct + 20 + i);

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
  const explanation = `🔍 השיטה: קודם מסמנים מה באמת שואלים — כמה ${item.p}, לא כמה ${distractorCont.p}.\nשלב 1 — ל${name} ${nCont} ${cont.p} ובכל אחת ${perCont} ${item.p}: ${nCont} × ${perCont} = ${answer}. מצאנו את סך ה${item.p}!\n⚠️ המלכודת: המידע על ${distractor} ${distractorCont.p} הוא מידע שלא קשור לשאלה. וגם ${nCont} + ${perCont} = ${nCont + perCont} מפתה — חיבור במקום כפל.\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: קודם מוצאים כמה היו בהתחלה, ורק אז מחסירים מה שניתן.\nשלב 1 — ${bags} × ${perBag} = ${total}. מצאנו שבהתחלה היו ${total} ${item.p}.\nשלב 2 — נתנה ${gave}: ${total} − ${gave} = ${answer}.\n⚠️ המלכודת: ${total} מופיע בתשובות — זו רק תוצאת ביניים, לפני שנתנה לחברות!\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: מתקדמים תחנה-תחנה — בכל תחנה מחסירים את היורדים ומוסיפים את העולים.\n` + steps.join('\n') + `\nלכן התשובה: ${current} ✔ (ולא ${start} — זה רק מספר ההתחלה, מסיח!)`;
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
  const explanation = `🔍 השיטה: כשיש שתי קבוצות — מחשבים כל קבוצה בנפרד, ובסוף מחברים.\nשלב 1 — ${type1}: ${n1} × ${per1} = ${total1}.\nשלב 2 — ${type2}: ${n2} × ${per2} = ${total2}.\nשלב 3 — יחד: ${total1} + ${total2} = ${answer}.\n⚠️ המלכודת: ${total1} ו-${total2} מופיעים בתשובות — אלו תוצאות ביניים של קבוצה אחת בלבד!\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: בחלוקה עם שארית בודקים כמה קיבל כל חבר, וכמה נשאר "בחוץ".\nשלב 1 — כל חבר קיבל ${perGroup} ${item.p}, כי ${groups} × ${perGroup} = ${total}. מצאנו כמה חולק בסך הכול!\nשלב 2 — נשאר ל${name}: ${had} − ${total} = ${itemSingularPhrase}.\n⚠️ המלכודת: ${perGroup} (כמה קיבל כל חבר) מופיע בתשובות — אבל שאלו כמה נשאר ל${name}!\nלכן התשובה: ${leftover} ✔`;
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
  const explanation = `🔍 השיטה: "כפול מהיום הקודם" — מחשבים יום-יום, ובסוף מחברים את כל הימים.\n` + steps.join('\n') + `\nמחברים את כל הימים: ${answer}.\n⚠️ המלכודת: ${current} (היום האחרון בלבד) מופיע בתשובות — אבל שאלו כמה אסף בכל הימים יחד!\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: הולכים לפי סדר האירועים — קודם כמה היו, ואז כל שינוי בתורו.\nשלב 1 — בהתחלה: ${shelves} × ${perShelf} = ${startAmount} ${item.p}.\nשלב 2 — לקחו ${removed}: ${startAmount} − ${removed} = ${startAmount - removed}.\nשלב 3 — הוסיפו ${added}: ${startAmount - removed} + ${added} = ${answer}.\n⚠️ המלכודת: ${startAmount - removed} היא רק תוצאת ביניים — לפני שהוסיפו את החדשים!\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: כדי לדעת כמה היו בהתחלה — מחברים את מה שחולק עם מה שנשאר.\nשלב 1 — חולקו: ${children} × ${perChild} = ${children * perChild} ${item.p}. מצאנו כמה הילדים קיבלו!\nשלב 2 — מוסיפים את מה שנשאר: ${children * perChild} + ${leftover} = ${answer}.\n⚠️ המלכודת: ${children * perChild} מופיע בתשובות — מי ששוכח את ${leftover} שנשארו עוצר בתוצאת ביניים!\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: בסדרה בודקים קודם מה קורה בין כל שני שכנים.\nשלב 1 — ${seq[0]}→${seq[1]}: +${diff}. ${seq[1]}→${seq[2]}: שוב +${diff}. מצאנו שהכלל קבוע — כל פעם מוסיפים ${diff}!\n✓ בדיקה: ${seq[2]} + ${diff} = ${seq[3]}, מתאים בדיוק להמשך הסדרה.\nשלב 2 — ${seq[len - 1]} + ${diff} = ${answer}.\n⚠️ המלכודת: ${seq[len - 1]} מופיע בתשובות — אבל הוא כבר כתוב בסדרה! וגם ${answer + diff} מדלג צעד אחד יותר מדי.\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: אם ההפרש בין השכנים לא קבוע — בודקים כפל!\nשלב 1 — ${seq[0]}→${seq[1]}: ×${ratio}. ${seq[1]}→${seq[2]}: שוב ×${ratio}. מצאנו את הכלל — כל מספר מוכפל ב-${ratio}!\nשלב 2 — ${seq[len - 1]} × ${ratio} = ${answer}.\n⚠️ המלכודת: ${seq[len - 1] + ratio} מופיע בתשובות — חיבור של ${ratio} במקום כפל ב-${ratio}.\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: בודקים את ההפרשים בין כל שני שכנים — ואם הם לא קבועים, בודקים איך הם משתנים.\nשלב 1 — ההפרשים: ${diffs.join(', ')}. מצאנו שההפרשים עצמם גדלים ב-${inc} כל פעם!\nשלב 2 — ההפרש הבא: ${diffs[diffs.length - 1]} + ${inc} = ${diff}.\nשלב 3 — ${seq[len - 1]} + ${diff} = ${answer}.\n⚠️ המלכודת: ${seq[len - 1] + diffs[diffs.length - 1]} מפתה — הוא חוזר על ההפרש הקודם במקום להגדיל אותו.\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: כשההפרשים לא קבועים — בודקים אם כל מספר קשור לשני הקודמים לו.\nשלב 1 — ${seq[0]} + ${seq[1]} = ${seq[2]}. ${seq[1]} + ${seq[2]} = ${seq[3]}. מצאנו את הכלל — כל מספר הוא סכום שני הקודמים!\nשלב 2 — ${seq[len - 2]} + ${seq[len - 1]} = ${answer}.\n⚠️ המלכודת: ${seq[len - 1] * 2} מופיע בתשובות — הכפלת המספר האחרון במקום חיבור שני הקודמים.\nלכן התשובה: ${answer} ✔`;
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
  const pairIdx = missingIdx >= 2 ? 0 : len - 2; // a visible neighbor pair to learn the rule from
  const explanation = `🔍 השיטה: מגלים את הכלל מזוג שכנים שרואים, ורק אז ממלאים את החסר.\nשלב 1 — ${seq[pairIdx]}→${seq[pairIdx + 1]}: +${diff}. מצאנו שההפרש הקבוע הוא ${diff}!\nשלב 2 — המספר החסר: ${seq[missingIdx - 1]} + ${diff} = ${answer}.\n✓ בדיקה: ${answer} + ${diff} = ${seq[missingIdx + 1]} — מתאים בדיוק למספר הבא בסדרה.\n⚠️ המלכודת: ${answer + diff} ו-${answer - diff} הם השכנים שכבר כתובים בסדרה — לא המספר החסר!\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: כשיש שני סימנים — מציבים את הקשר ביניהם כדי להישאר עם סימן אחד בלבד.\nשלב 1 — נציב △ = ○ + ${k}: ○ + ○ + ○ + ${k} = ${total}, כלומר 3 × ○ + ${k} = ${total}.\nשלב 2 — 3 × ○ = ${total} − ${k} = ${total - k}, לכן ○ = ${total - k} ÷ 3 = ${answer}.\n✓ בדיקה: ${answer} + ${answer} + ${triangle} = ${total} — מסתדר בדיוק!\n⚠️ המלכודת: ${triangle} הוא הערך של △, לא של ○ — קוראים שוב מה בדיוק שאלו.\nלכן התשובה: ○ = ${answer} ✔`;
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
  const explanation = `🔍 השיטה: עובדים אחורה — מבטלים כל פעולה בסדר הפוך, עם הפעולה ההפוכה.\nשלב 1 — מבטלים את ההוספה: ${result} − ${add} = ${result - add}. מצאנו את המספר לפני ההוספה!\nשלב 2 — מבטלים את הכפל: ${result - add} ÷ ${mult} = ${answer}.\n✓ בדיקה: ${answer} × ${mult} + ${add} = ${result} — בדיוק מה שכתוב בשאלה!\nלכן התשובה: ${answer} ✔`;
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
  const explanation = `🔍 השיטה: קודם מורידים את מה שידוע, ואז מסמנים את הלא-ידוע באות.\nשלב 1 — ל${names[1]} ${knownAmount}, לכן ל${names[0]} ו${names[2]} ביחד: ${total} − ${knownAmount} = ${total - knownAmount}.\nשלב 2 — נסמן את ${names[2]} כ-X, אז ${names[0]} = ${multiplier}X. יחד: ${multiplier + 1}X = ${total - knownAmount}, לכן X = ${x}.\nשלב 3 — ${names[0]} = ${multiplier} × ${x} = ${answer}.\n⚠️ המלכודת: ${x} הוא של ${names[2]} — אבל שאלו על ${names[0]}!\nלכן התשובה: ${answer} ✔`;
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
  const bigSym = a >= b ? '□' : '○';
  const smallSym = a >= b ? '○' : '□';
  const explanation = `🔍 השיטה: מחברים את שתי השורות — כך ה-${smallSym} מתבטל ונשאר רק סימן אחד.\nשלב 1 — נחבר: ${sum} + ${diff} = ${sum + diff}, וזה שווה ל-2 × ${bigSym}.\nשלב 2 — ${bigSym} = ${sum + diff} ÷ 2 = ${bigger}.\n✓ בדיקה: ${bigger} + ${Math.min(a, b)} = ${sum} וגם ${bigger} − ${Math.min(a, b)} = ${diff} — מסתדר!\n⚠️ המלכודת: ${sum} ו-${diff} עצמם מופיעים בתשובות — הם הנתונים, לא הפתרון.\nלכן התשובה: ${bigger} ✔`;
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

  const toHour = (60 - m) % 60;
  const rest = durationMin - toHour;
  const explanation = m > 0 && rest > 0
    ? `🔍 השיטה: קודם משלימים לשעה עגולה, ואז מוסיפים את השאר.\nשלב 1 — מ-${fmtTime(h, m)} עד ${fmtTime(h + 1, 0)} יש ${toHour} דקות.\nשלב 2 — נשארו ${durationMin} − ${toHour} = ${rest} דקות. ${fmtTime(h + 1, 0)} + ${rest} דקות = ${correctStr}.\nשימו לב: שעה = 60 דקות.\n⚠️ המלכודת: התשובות האחרות רחוקות רק ברבע שעה או חצי שעה מהנכונה — בודקים את החישוב לפני שבוחרים!\nלכן התשובה: ${correctStr} ✔`
    : `🔍 השיטה: מוסיפים את הדקות לשעת ההתחלה — וכל 60 דקות שמצטברות הן שעה שלמה.\nשלב 1 — ${fmtTime(h, m)} + ${durationMin} דקות = ${correctStr}.\nשימו לב: שעה = 60 דקות.\n⚠️ המלכודת: התשובות האחרות רחוקות רק ברבע שעה או חצי שעה מהנכונה — בודקים את החישוב לפני שבוחרים!\nלכן התשובה: ${correctStr} ✔`;

  return {
    stem,
    options: allOpts,
    correctOption: allOpts.indexOf(correctStr),
    explanation,
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
  // Deduped top-up — the naive random push used to emit duplicate options.
  for (let extra = 15; allOpts.length < 4; extra += 5) {
    const cand = fmtTime(...addMin(h, m, totalAdd + extra));
    if (!allOpts.includes(cand)) allOpts.push(cand);
  }

  const explanation = wait > 0
    ? `🔍 השיטה: קודם מחברים את כל הדקות של הדרך, ורק אז מוסיפים לשעון.\nשלב 1 — סך הדקות: ${walk} + ${wait} = ${totalAdd}. מצאנו כמה זמן לקחה כל הדרך!\nשלב 2 — ${fmtTime(h, m)} + ${totalAdd} דקות = ${correctStr}.\nשימו לב: כשעוברים 60 דקות — מתחלפת השעה.\n⚠️ המלכודת: מי ששוכח את ${wait} דקות ההמתנה מקבל ${wrong1} — תוצאת ביניים שמופיעה בתשובות!\nלכן התשובה: ${correctStr} ✔`
    : `🔍 השיטה: מוסיפים את דקות ההליכה לשעת היציאה.\nשלב 1 — ${fmtTime(h, m)} + ${walk} דקות = ${correctStr}.\nשימו לב: כשעוברים 60 דקות — מתחלפת השעה (שעה = 60 דקות).\n⚠️ המלכודת: התשובות האחרות קרובות רק ב-10 דקות — בודקים את החישוב לפני שבוחרים!\nלכן התשובה: ${correctStr} ✔`;

  return {
    stem,
    options: allOpts.slice(0, 4),
    correctOption: allOpts.indexOf(correctStr),
    explanation,
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
  // Deduped top-up — the naive random push used to emit duplicate options.
  for (let extra = 5; allOpts.length < 4; extra += 5) {
    const cand = fmtTime(...addMin(h, m, totalMin + extra));
    if (!allOpts.includes(cand)) allOpts.push(cand);
  }

  return {
    stem,
    options: allOpts.slice(0, 4),
    correctOption: allOpts.indexOf(correctStr),
    explanation: `🔍 השיטה: קודם מחברים את כל הזמנים, ואז מוסיפים לשעת ההתחלה.\nשלב 1 — סך הדקות: ${durations.join(' + ')} = ${totalMin}. מצאנו כמה זמן למדה בסך הכול!\nשלב 2 — ${fmtTime(h, m)} + ${totalMin} דקות = ${correctStr}.\nשימו לב: כל 60 דקות שמצטברות הן שעה שלמה.\n⚠️ המלכודת: מי שמחשב רק את המקצוע הראשון (${durations[0]} דקות) מקבל ${wrong3} — אבל היא למדה ${numSubjects} מקצועות!\nלכן התשובה: ${correctStr} ✔`,
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
  // BUG FIX: at hard difficulty `total` can exceed 100, which used to leave the
  // filter empty → pick(undefined) → answer = NaN → makeOptions' Set-based
  // while-loop spun forever (Set dedups NaN against NaN). This latent hang was
  // the cause of all the mysteriously stuck audit runs.
  const billCandidates = [20, 50, 100, 200].filter(b => b > total);
  const bill = billCandidates.length > 0
    ? pick(billCandidates)
    : Math.ceil((total + 10) / 50) * 50;
  const answer = bill - total;

  const stem = `${name} קנה ${qty1} ${item1.plural} ב-${price1} שקלים כל אחת, ו${item2.name} ב-${price2} שקלים. שילם עם שטר של ${bill} שקלים. כמה עודף קיבל?`;
  const { options, correctOption } = makeOptions(answer, [total, bill - qty1 * price1, qty1 * price1]);
  const explanation = `🔍 השיטה: קודם מחשבים כמה עלתה כל הקנייה, ורק אז מחסירים מהשטר.\nשלב 1 — ${item1.plural}: ${qty1} × ${price1} = ${qty1 * price1} ₪.\nשלב 2 — סך הקנייה: ${qty1 * price1} + ${price2} = ${total} ₪. מצאנו כמה שילם!\nשלב 3 — עודף: ${bill} − ${total} = ${answer} ₪.\n⚠️ המלכודת: ${total} (מחיר הקנייה) מופיע בתשובות — אבל שאלו על העודף! וגם מי ששוכח את ה${item2.name} טועה.\nלכן התשובה: ${answer} ₪ ✔`;
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
  const explanation = `🔍 השיטה: מחשבים כל מוצר בנפרד, מחברים לסך הקנייה, ומחסירים ממה שהיה.\n${stepLines.join('\n')}\nסך הקנייה: ${costs.join(' + ')} = ${totalSpent} ₪. נשאר: ${actualStart} − ${totalSpent} = ${answer} ₪.\n⚠️ המלכודת: ${totalSpent} (כמה הוציאה) מופיע בתשובות — אבל שאלו כמה נשאר!\nלכן התשובה: ${answer} ₪ ✔`;
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
  const explanation = `🔍 השיטה: קודם מחשבים את המחיר המלא, ורק בסוף מורידים את ההנחה.\nשלב 1 — מחיר מלא: ${qty} × ${price} = ${fullPrice} ₪.\nשלב 2 — מורידים את ההנחה: ${fullPrice} − ${discount} = ${answer} ₪.\n⚠️ המלכודת: ${fullPrice} (המחיר לפני ההנחה) מופיע בתשובות — תוצאת ביניים!\nלכן התשובה: ${answer} ₪ ✔`;
  return { stem, options, correctOption, explanation };
};

// ═══════════════════════════════════════════════════════════════════════
// REAL-EXAM-STYLE TEMPLATES (added after auditing the Michonan booklet)
// ═══════════════════════════════════════════════════════════════════════

// ── Digit puzzle: ones digit is double / triple / etc. of tens digit ───
const dp1: TemplateGen = (d) => {
  // Real-exam pattern: "I'm a 2-digit number. My ones digit is double my tens digit. Who am I?"
  // For grade 2 we keep tens ≤ 4 (so ones ≤ 8). At hard, allow 3-digit "and hundreds digit equal to tens twice".
  const useThreeDigit = d === 'hard';
  if (useThreeDigit) {
    // 3-digit puzzle: tens = hundreds + 1, ones = 2 × tens
    const h = rand(1, 3);
    const t = h + 1;
    const o = 2 * t;
    if (o > 9) return dp1('medium'); // re-roll into easier bucket
    const answer = h * 100 + t * 10 + o;
    const stem = `אני מספר תלת-ספרתי. ספרת העשרות שלי גדולה באחת מספרת המאות, וספרת האחדות שלי גדולה בשתיים מספרת העשרות. מי אני?`;
    const wrongs = [answer + 1, answer + 11, answer - 110];
    const allOpts = shuffle([answer, ...wrongs.filter(w => w > 0)]).map(String).slice(0, 4);
    while (allOpts.length < 4) allOpts.push(String(answer + rand(10, 50)));
    const correctOption = allOpts.indexOf(String(answer));
    return {
      stem,
      options: allOpts,
      correctOption,
      explanation: `🔍 השיטה: כשיש שני תנאים על ספרות — בודקים כל תשובה מול שני התנאים.\nשלב 1 — ב-${answer}: ספרת המאות ${h} וספרת העשרות ${t}. ${h} + 1 = ${t} — התנאי הראשון מתקיים!\nשלב 2 — ספרת האחדות ${o}. ${t} + 2 = ${o} — גם התנאי השני מתקיים!\n⚠️ המלכודת: תשובות אחרות מקיימות רק תנאי אחד מהשניים — חובה לבדוק את שניהם.\nלכן התשובה: ${answer} ✔`,
    };
  }
  const t = rand(1, 4);
  const o = 2 * t;
  const answer = t * 10 + o;
  const stem = `אני מספר דו-ספרתי. ספרת האחדות שלי כפולה מספרת העשרות שלי. מי אני?`;
  // Distractors: each must be UNIQUE and ≠ answer. We deduplicate before
  // returning so the kid never sees two identical options.
  const candidates = [
    (t + 1) * 10 + o,           // tens digit too high
    t * 10 + (o + 1),            // ones digit not double (off by 1)
    (t + 2) * 10 + (o - 1),      // both wrong
    Math.max(11, answer - 11),   // way different
    answer + 11,                 // way different
    Math.max(11, t * 10 + (o - 2)), // ones digit too low
  ];
  const uniqueWrongs: number[] = [];
  for (const c of candidates) {
    if (c !== answer && !uniqueWrongs.includes(c) && c >= 10 && c <= 99) {
      uniqueWrongs.push(c);
      if (uniqueWrongs.length === 3) break;
    }
  }
  while (uniqueWrongs.length < 3) {
    const fallback = answer + rand(3, 25);
    if (!uniqueWrongs.includes(fallback) && fallback !== answer) uniqueWrongs.push(fallback);
  }
  const allOpts = shuffle([answer, ...uniqueWrongs]).map(String);
  const correctOption = allOpts.indexOf(String(answer));
  return {
    stem,
    options: allOpts,
    correctOption,
    explanation: `🔍 השיטה: "כפולה מ..." — מנסים ערך לספרת העשרות ובונים ממנו את ספרת האחדות.\nשלב 1 — אם ספרת העשרות היא ${t}, ספרת האחדות היא ${t} × 2 = ${o}. קיבלנו את ${answer}!\n✓ בדיקה: ב-${answer} האחדות (${o}) באמת כפולה בדיוק מהעשרות (${t}).\n⚠️ המלכודת: בתשובות האחרות האחדות לא בדיוק כפולה מהעשרות — בודקים כל אפשרות, לא בוחרים "בערך".\nלכן התשובה: ${answer} ✔`,
  };
};

// ── Age problem with multiplier ────────────────────────────────────────
const ag1: TemplateGen = (d) => {
  // "Avigail is 10, brother is 4. When she's 24, how old will brother be?"
  // The trick: ages grow at the same rate; difference stays constant.
  const childA = rand(8, 12);
  const childB = rand(2, 6);
  const futureA = rand(20, d === 'hard' ? 35 : 28);
  const answer = futureA - (childA - childB);
  const names = shuffle([...girls]).slice(0, 2);
  const stem = `${names[0]} בת ${childA}, ו${names[1]} בן ${childB}. כש${names[0]} תהיה בת ${futureA}, בן כמה יהיה ${names[1]}?`;
  const { options, correctOption } = makeOptions(answer, [futureA, futureA - childA, childA + childB]);
  const explanation = `🔍 השיטה: בשאלות גיל בודקים את ההפרש — כולם מתבגרים יחד, אז ההפרש לא משתנה לעולם.\nשלב 1 — ההפרש היום: ${childA} − ${childB} = ${childA - childB} שנים. מצאנו את מה שנשאר קבוע!\nשלב 2 — כש${names[0]} בת ${futureA}: ${futureA} − ${childA - childB} = ${answer}.\n⚠️ המלכודת: ${futureA} מופיע בתשובות — אבל הם אף פעם לא באותו גיל! ההפרש נשמר תמיד.\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Items × rows (orchard layout, parking lot, etc.) ───────────────────
const ir1: TemplateGen = (d) => {
  const items = [
    { p: 'עצים', container: 'שורה', containers: 'שורות' },
    { p: 'מכוניות', container: 'שורה', containers: 'שורות' },
    { p: 'תלמידים', container: 'שורה', containers: 'שורות' },
    { p: 'משבצות', container: 'טור', containers: 'טורים' },
  ];
  const it = pick(items);
  const rows = rand(d === 'easy' ? 3 : 4, d === 'hard' ? 9 : 7);
  const cols = rand(d === 'easy' ? 3 : 4, d === 'hard' ? 9 : 7);
  const total = rows * cols;
  const stem = `במטע ${it.p} מסודרים ב-${cols} ${it.containers}. בכל ${it.container} ${rows} ${it.p}. כמה ${it.p} יש סך הכול?`;
  const { options, correctOption } = makeOptions(total, [rows + cols, rows * 2, cols * 2]);
  const explanation = `🔍 השיטה: כשבכל ${it.container} יש אותו מספר — זה תרגיל כפל.\nשלב 1 — ${cols} ${it.containers}, בכל ${it.container} ${rows} ${it.p}: ${cols} × ${rows} = ${total}.\n⚠️ המלכודת: ${rows} + ${cols} = ${rows + cols} מופיע בתשובות — חיבור במקום כפל!\nלכן התשובה: ${total} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Multi-week shopping comparison ─────────────────────────────────────
const mw1: TemplateGen = (d) => {
  const week1 = rand(d === 'easy' ? 30 : 50, d === 'hard' ? 200 : 100);
  const diff = rand(3, 15);
  const week2 = week1 - diff;
  const total = week1 + week2;
  const stem = `בשבוע הראשון של החופש הוצא שקד ${week1} ש"ח. בשבוע השני הוציא ${diff} ש"ח פחות. כמה הוציא בשני השבועות יחד?`;
  const { options, correctOption } = makeOptions(total, [week1 + diff, week1, week2]);
  const explanation = `🔍 השיטה: "פחות" אומר שקודם מוצאים את השבוע השני, ורק אז מחברים.\nשלב 1 — שבוע 2: ${week1} − ${diff} = ${week2} ₪. מצאנו כמה הוציא בשבוע השני!\nשלב 2 — יחד: ${week1} + ${week2} = ${total} ₪.\n⚠️ המלכודת: מי שמוסיף ${diff} במקום להחסיר טועה בכיוון — כיוון הפוך!\nלכן התשובה: ${total} ₪ ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Speed/rate extrapolation ────────────────────────────────────────────
const sp1: TemplateGen = (d) => {
  // "X moves Y meters per Z minutes. How far in 1 hour?"
  const meters = pick([100, 200, 250, 500]);
  const minutes = pick([5, 10, 15, 20]);
  const hours = d === 'hard' ? pick([1, 2, 3]) : 1;
  const totalMin = hours * 60;
  if (totalMin % minutes !== 0) return sp1(d); // re-roll for clean answer
  const factor = totalMin / minutes;
  const totalMeters = meters * factor;
  const km = Math.floor(totalMeters / 1000);
  const isWholeKm = totalMeters % 1000 === 0;
  if (!isWholeKm || km === 0) return sp1(d);
  const subjects = [
    { n: 'מכונית', verb: 'נוסעת' },
    { n: 'אופניים', verb: 'נוסעות' },
    { n: 'רץ', verb: 'רץ' },
  ];
  const sub = pick(subjects);
  const stem = `${sub.n} ${sub.verb} ${meters} מטר כל ${minutes} דקות. איזה מרחק יעבור ב${hours === 1 ? 'שעה' : `${hours} שעות`}?`;
  const { options, correctOption } = makeOptions(km, [km + 1, km - 1, hours * meters / 100]);
  const explanation = `🔍 השיטה: מגלים פי כמה גדל הזמן — והמרחק גדל בדיוק באותו יחס.\nשלב 1 — ${hours === 1 ? 'שעה' : `${hours} שעות`} = ${totalMin} דקות. ${totalMin} ÷ ${minutes} = ${factor}, כלומר פי ${factor} זמן. מצאנו את היחס!\nשלב 2 — המרחק: ${meters} × ${factor} = ${totalMeters} מטר = ${km} ק"מ.\nשימו לב: שעה = 60 דקות, ו-1 ק"מ = 1,000 מטר.\nלכן התשובה: ${km} ק"מ ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Group division with leftover (real exam pattern) ────────────────────
const gd1: TemplateGen = (d) => {
  const total = rand(d === 'easy' ? 12 : 17, d === 'hard' ? 30 : 23);
  const groupSize = rand(d === 'easy' ? 3 : 4, d === 'hard' ? 6 : 5);
  const groups = Math.floor(total / groupSize);
  const leftover = total % groupSize;
  if (leftover === 0 || groups < 2) return gd1(d); // re-roll for non-trivial
  const answer = groups + (leftover > 0 ? 1 : 0); // total groups including the leftover
  const stem = `המדריכה חילקה ${total} ילדים לקבוצות. בכל קבוצה היו ${groupSize} ילדים, אבל בקבוצה האחרונה היו רק ${leftover} ילדים. כמה קבוצות יצאו?`;
  const { options, correctOption } = makeOptions(answer, [groups, total - groups, leftover]);
  const explanation = `🔍 השיטה: מחלקים לקבוצות מלאות, ולא שוכחים את קבוצת ה"שארית" בסוף.\nשלב 1 — קבוצות מלאות: ${groups} × ${groupSize} = ${groups * groupSize} ילדים, כלומר ${groups} קבוצות. מצאנו את הקבוצות המלאות!\nשלב 2 — נשארו ${leftover} ילדים — גם הם קבוצה! ${groups} + 1 = ${answer}.\n⚠️ המלכודת: ${groups} מופיע בתשובות — מי ששוכח את הקבוצה הקטנה האחרונה עוצר צעד אחד מוקדם.\nלכן התשובה: ${answer} קבוצות ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Birth-year / current-year reasoning ────────────────────────────────
// Real Stage B: "Born in 2008, what age in 2016?" or reverse.
const by1: TemplateGen = (d) => {
  const currentYear = 2026;
  const ageNow = rand(d === 'easy' ? 5 : 6, d === 'hard' ? 12 : 10);
  const birthYear = currentYear - ageNow;
  const direction = pick(['forward', 'backward'] as const);
  const names = pick([...girls, ...boys]);
  if (direction === 'forward') {
    const targetYear = currentYear + rand(2, 8);
    const targetAge = targetYear - birthYear;
    const stem = `${names} נולדה בשנת ${birthYear}. בת כמה תהיה בשנת ${targetYear}?`;
    const { options, correctOption } = makeOptions(targetAge, [targetAge - 1, targetAge + 1, targetYear - currentYear]);
    return {
      stem,
      options,
      correctOption,
      explanation: `🔍 השיטה: גיל = שנת היעד פחות שנת הלידה.\nשלב 1 — ${targetYear} − ${birthYear} = ${targetAge}.\n✓ בדיקה: ${birthYear} + ${targetAge} = ${targetYear} — מסתדר בדיוק.\n⚠️ המלכודת: ${targetAge - 1} ו-${targetAge + 1} קרובים בכוונה — עושים חיסור מדויק, לא הערכה!\nלכן התשובה: ${targetAge} ✔`,
    };
  }
  const targetAge = rand(2, ageNow - 1);
  const targetYear = birthYear + targetAge;
  const stem = `${names} נולדה בשנת ${birthYear}. באיזו שנה הייתה בת ${targetAge}?`;
  const correctStr = String(targetYear);
  const allOpts = shuffle([targetYear, targetYear + 1, targetYear - 1, birthYear].filter((v, i, a) => a.indexOf(v) === i)).map(String).slice(0, 4);
  while (allOpts.length < 4) allOpts.push(String(targetYear + rand(2, 5)));
  return {
    stem,
    options: allOpts,
    correctOption: allOpts.indexOf(correctStr),
    explanation: `🔍 השיטה: כדי למצוא שנה לפי גיל — מוסיפים את הגיל לשנת הלידה.\nשלב 1 — ${birthYear} + ${targetAge} = ${targetYear}.\n✓ בדיקה: מ-${birthYear} עד ${targetYear} עברו בדיוק ${targetAge} שנים — הגיל שחיפשנו.\n⚠️ המלכודת: ${targetYear + 1} ו-${targetYear - 1} רחוקים רק בשנה — טעות "צעד אחד" נפוצה מאוד.\nלכן התשובה: ${targetYear} ✔`,
  };
};

// ── Multi-step inventory: how many [items] are needed/missing ───────────
// Real Stage B: "Mom prepared 22 surprises, needs to give 24 friends + 3 extra
// each = 27 total. How many missing?" — multi-step counting under constraint.
const inv1: TemplateGen = (d) => {
  const friends = rand(d === 'easy' ? 8 : 12, d === 'hard' ? 30 : 22);
  const extras = rand(d === 'easy' ? 1 : 2, d === 'hard' ? 5 : 3);
  const totalNeeded = friends + extras;
  const have = totalNeeded - rand(2, d === 'hard' ? 8 : 6);
  const missing = totalNeeded - have;
  const item = pick([
    { p: 'הפתעות', sing: 'הפתעה' },
    { p: 'בלונים', sing: 'בלון' },
    { p: 'כובעי מסיבה', sing: 'כובע' },
    { p: 'שקיות ממתקים', sing: 'שקית' },
  ]);
  const name = pick([...girls]);
  const stem = `${name} הזמינה ${friends} חברים למסיבת יום ההולדת שלה, והכינה ${item.p} — אחת לכל חבר ועוד ${extras} ${item.p} ביתר לבטחון. הצליחה להכין רק ${have} ${item.p}. כמה ${item.p} נותרו לשני?`;
  const { options, correctOption } = makeOptions(missing, [extras, friends - have, totalNeeded]);
  const explanation = `🔍 השיטה: קודם מחשבים כמה צריך בסך הכול, ורק אז משווים למה שיש.\nשלב 1 — צריך: ${friends} חברים + ${extras} ביתר = ${totalNeeded} ${item.p}. מצאנו כמה צריך!\nשלב 2 — יש רק ${have}, לכן חסר: ${totalNeeded} − ${have} = ${missing}.\n⚠️ המלכודת: לא לשכוח את ${extras} ה${item.p} שביתר — מי שסופר רק את החברים מפספס חלק מהצורך.\nלכן התשובה: ${missing} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Stairs/floor compound counting ──────────────────────────────────────
// Real Stage B: "12 stairs per floor, 4 floors, how many stairs total?"
const sf1: TemplateGen = (d) => {
  const stairsPerFloor = rand(d === 'easy' ? 6 : 10, d === 'hard' ? 18 : 14);
  const floors = rand(d === 'easy' ? 2 : 3, d === 'hard' ? 6 : 5);
  // Real exam quirk: floor count typically excludes ground floor in calculation.
  // For grade 2 we keep it simple — N floors = N flights of stairs.
  const total = stairsPerFloor * floors;
  const stem = `בבניין יש ${floors} קומות. בין כל שתי קומות יש ${stairsPerFloor} מדרגות. כמה מדרגות יש בסך הכול בבניין מהקומה הראשונה לעליונה?`;
  const answer = stairsPerFloor * (floors - 1);
  const { options, correctOption } = makeOptions(answer, [total, stairsPerFloor + floors, stairsPerFloor * floors / 2]);
  const explanation = `🔍 השיטה: סופרים את המעברים בין הקומות — תמיד אחד פחות ממספר הקומות.\nשלב 1 — בין ${floors} קומות יש ${floors - 1} מערכות מדרגות (קומה 1→2, 2→3 וכן הלאה). מצאנו כמה מעברים!\nשלב 2 — ${floors - 1} × ${stairsPerFloor} = ${answer} מדרגות.\n⚠️ המלכודת: ${total} (${floors} × ${stairsPerFloor}) מופיע בתשובות — מי שכופל במספר הקומות במקום במספר המעברים נופל שם.\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Bus arrival: start time + duration → arrival ────────────────────────
const ba1: TemplateGen = (d) => {
  const startH = rand(8, 17);
  const startM = pick([0, 10, 15, 20, 30, 40, 45]);
  const durationMin = rand(d === 'easy' ? 25 : 35, d === 'hard' ? 95 : 70);
  const totalMin = startH * 60 + startM + durationMin;
  const endH = Math.floor(totalMin / 60);
  const endM = totalMin % 60;
  const fmt = (h: number, m: number) => `${h}:${m.toString().padStart(2, '0')}`;
  const correct = fmt(endH, endM);
  const wrong1 = fmt(endH + 1, endM);
  const wrong2 = fmt(endH, (endM + 30) % 60);
  const wrong3 = fmt(endH, Math.max(0, endM - 10));
  // Dedup: wrong3 (endM−10 clamped to 0) can collide with the correct answer,
  // and the naive top-up used to push duplicates like a second "17:00".
  const allOpts = shuffle(Array.from(new Set([correct, wrong1, wrong2, wrong3])));
  for (let extra = 1; allOpts.length < 4; extra++) {
    const cand = fmt(endH + extra, (endM + 20 * extra) % 60);
    if (!allOpts.includes(cand)) allOpts.push(cand);
  }
  const name = pick([...girls, ...boys]);
  const stem = `${name} עלה לאוטובוס בשעה ${fmt(startH, startM)}. הנסיעה אורכת ${durationMin} דקות. באיזו שעה יגיע ליעד?`;
  const toHour = (60 - startM) % 60;
  const rest = durationMin - toHour;
  const explanation = startM > 0 && rest > 0
    ? `🔍 השיטה: קודם משלימים לשעה עגולה, ואז מוסיפים את השאר.\nשלב 1 — מ-${fmt(startH, startM)} עד ${fmt(startH + 1, 0)} יש ${toHour} דקות.\nשלב 2 — נשארו ${durationMin} − ${toHour} = ${rest} דקות. ${fmt(startH + 1, 0)} + ${rest} דקות = ${correct}.\nשימו לב: שעה = 60 דקות.\n⚠️ המלכודת: יש תשובה שרחוקה בדיוק שעה (${wrong1}) — קל להתבלבל בספירת השעות!\nלכן התשובה: ${correct} ✔`
    : `🔍 השיטה: יוצאים משעה עגולה — מוסיפים את הדקות, וכל 60 דקות הן שעה שלמה.\nשלב 1 — ${fmt(startH, startM)} + ${durationMin} דקות = ${correct}.\nשימו לב: שעה = 60 דקות.\n⚠️ המלכודת: יש תשובה שרחוקה בדיוק שעה (${wrong1}) — קל להתבלבל בספירת השעות!\nלכן התשובה: ${correct} ✔`;
  return {
    stem,
    options: allOpts.slice(0, 4),
    correctOption: allOpts.indexOf(correct),
    explanation,
  };
};

// ── Reading speed: pages/day → days needed (sim 1 Q8 pattern) ─────────
const rs1: TemplateGen = (d) => {
  const perDay = pick([10, 15, 20, 25, 30, 40, 50]);
  const days = rand(d === 'easy' ? 3 : 5, d === 'hard' ? 12 : 8);
  const total = perDay * days;
  const name = pick([...girls]);
  const stem = `${name} קוראת ${perDay} עמודים ביום. תוך כמה ימים תגמור ספר בעל ${total} עמודים?`;
  const { options, correctOption } = makeOptions(days, [days + 2, days - 1, perDay]);
  const explanation = `🔍 השיטה: כשקוראים אותו מספר עמודים בכל יום — זה תרגיל חילוק.\nשלב 1 — ${total} עמודים ÷ ${perDay} עמודים ביום = ${days} ימים.\n✓ בדיקה: ${days} × ${perDay} = ${total} — בדיוק כל הספר.\n⚠️ המלכודת: ${perDay} מופיע בתשובות — זה כמה עמודים ביום, לא כמה ימים!\nלכן התשובה: ${days} ימים ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Hourly wage (sim 1 Q13 pattern) ────────────────────────────────────
const hw1: TemplateGen = (d) => {
  const startHour = rand(15, 18);
  const hours = rand(d === 'easy' ? 2 : 2, d === 'hard' ? 5 : 4);
  const endHour = startHour + hours;
  const ratePerHour = pick([15, 20, 25, 30, 40]);
  const total = ratePerHour * hours;
  const name = pick([...boys, ...girls]);
  const stem = `${name} עובדת בשמרטפות ומקבלת ${ratePerHour} ש"ח לשעה. אם שמרה על הילדים מ-${startHour}:00 ועד ${endHour}:00, כמה הרוויחה?`;
  const { options, correctOption } = makeOptions(total, [ratePerHour, total + ratePerHour, total - ratePerHour]);
  const explanation = `🔍 השיטה: קודם מחשבים כמה שעות עבדה, ורק אז כופלים בשכר לשעה.\nשלב 1 — שעות: ${endHour} − ${startHour} = ${hours}. מצאנו כמה זמן שמרה!\nשלב 2 — שכר: ${hours} × ${ratePerHour} = ${total} ש"ח.\n⚠️ המלכודת: ${total - ratePerHour} ו-${total + ratePerHour} רחוקים בדיוק בשעת עבודה אחת — סופרים שעות בזהירות!\nלכן התשובה: ${total} ש"ח ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Reverse equation: number = N × X − K (sim 1 Q11 pattern) ───────────
const re1: TemplateGen = (d) => {
  // "I'm a number equal to 7 × 5 − 14" → 21. Frame as: "what is the number?"
  const factor = rand(2, d === 'hard' ? 9 : 7);
  const multiplier = rand(d === 'easy' ? 3 : 4, d === 'hard' ? 9 : 7);
  const subtract = rand(2, d === 'hard' ? 14 : 8);
  const product = factor * multiplier;
  if (product < subtract + 5) return re1(d);
  const answer = product - subtract;
  const stem = `מספר שווה ל-${factor} פעמים ${multiplier}, פחות ${subtract}. מהו המספר?`;
  const { options, correctOption } = makeOptions(answer, [product, answer + 1, factor + multiplier]);
  const explanation = `🔍 השיטה: קוראים את המשפט לפי הסדר — קודם הכפל, ואז החיסור.\nשלב 1 — ${factor} × ${multiplier} = ${product}. מצאנו את המכפלה!\nשלב 2 — ${product} − ${subtract} = ${answer}.\n⚠️ המלכודת: ${product} מופיע בתשובות — מי ששוכח את ה"פחות ${subtract}" עוצר בתוצאת ביניים!\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Weight comparison: A weighs X, B weighs Y more, total? (sim 1 Q15) ──
const wt1: TemplateGen = (d) => {
  const itemA = pick([
    { name: 'שוקו', plural: 'שוקואים' },
    { name: 'בורקס', plural: 'בורקסים' },
    { name: 'חבילת קמח', plural: 'חבילות קמח' },
  ]);
  const itemB = pick([
    { name: 'חבילת אורז', plural: 'חבילות אורז' },
    { name: 'בקבוק שתייה', plural: 'בקבוקי שתייה' },
  ].filter(x => x.name !== itemA.name));
  // Use halves to match real exam style
  const baseHalf = rand(1, d === 'hard' ? 5 : 3); // 1.5, 2.5, etc.
  const aWeight = baseHalf + 0.5;
  const diffHalf = rand(0, 2);
  const bWeight = aWeight + (diffHalf + 0.5);
  const total = aWeight + bWeight;
  const fmt = (n: number) => n === Math.floor(n) ? `${n} ק"ג` : `${Math.floor(n)} וחצי ק"ג`;
  const stem = `${itemA.name} שוקל ${fmt(aWeight)}, ו${itemB.name} שוקל ${fmt(bWeight - aWeight)} יותר. כמה ישקלו ${itemA.name} ו${itemB.name} יחד?`;
  const correctStr = fmt(total);
  const wrongs = [
    fmt(total + 1),
    fmt(aWeight),
    fmt(total - 0.5),
  ];
  const allOpts = shuffle([correctStr, ...wrongs]);
  return {
    stem,
    options: allOpts,
    correctOption: allOpts.indexOf(correctStr),
    explanation: `🔍 השיטה: קודם מוצאים את המשקל של כל פריט בנפרד, ורק אז מחברים.\nשלב 1 — ${itemA.name}: ${fmt(aWeight)}.\nשלב 2 — ${itemB.name}: ${fmt(aWeight)} + ${fmt(bWeight - aWeight)} = ${fmt(bWeight)}. מצאנו את המשקל השני!\nשלב 3 — יחד: ${fmt(aWeight)} + ${fmt(bWeight)} = ${fmt(total)}.\n⚠️ המלכודת: ${itemB.name} שוקל ${fmt(bWeight - aWeight)} יותר — זה לא המשקל שלו עצמו, קודם צריך לחבר!\n💡 טיפ: חצי ועוד חצי = קילוגרם שלם.\nלכן התשובה: ${fmt(total)} ✔`,
  };
};

// ── Twins + sibling sum-relation (two-step: sum, then offset) ───────────
const tw1: TemplateGen = (d) => {
  const twinAge = rand(d === 'easy' ? 5 : 6, d === 'hard' ? 10 : 9);
  const k = rand(2, d === 'hard' ? 7 : 5);
  const sum = twinAge * 2;
  const sisterAge = sum - k;
  if (sisterAge <= twinAge) return tw1(d); // sibling should be older than each twin
  const [n1, n2] = shuffle([...girls]).slice(0, 2);
  const sister = pick(girls.filter(g => g !== n1 && g !== n2));
  const stem = `${n1} ו${n2} תאומות בנות ${twinAge}. גילה של אחותן הגדולה ${sister} שווה לסכום הגילים של שתיהן, פחות ${k}. בת כמה ${sister}?`;
  const { options, correctOption } = makeOptions(sisterAge, [sum, twinAge + k, sum + k]);
  const explanation = `🔍 השיטה: הולכים לפי סדר המשפט — קודם סכום הגילים, ואז ה"פחות".\nשלב 1 — סכום התאומות: ${twinAge} + ${twinAge} = ${sum}. מצאנו את הסכום!\nשלב 2 — גיל האחות: ${sum} − ${k} = ${sisterAge}.\n⚠️ המלכודת: ${sum} מופיע בתשובות — מי ששוכח את ה"פחות ${k}" עוצר בתוצאת ביניים!\nלכן התשובה: ${sisterAge} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Sleep/awake hours across multiple days (24-hour reasoning) ──────────
const sl1: TemplateGen = (d) => {
  const sleep = rand(8, 16);
  const days = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;
  const awakePerDay = 24 - sleep;
  const answer = awakePerDay * days;
  const name = pick([...boys, ...girls]);
  const dayWord = days === 2 ? 'יומיים' : `${days} ימים`;
  const stem = `${name} ישן ${sleep} שעות בכל יממה. כמה שעות הוא ער במהלך ${dayWord} שלמים?`;
  const { options, correctOption } = makeOptions(answer, [awakePerDay, sleep * days, 24 * days - sleep]);
  const explanation = `🔍 השיטה: קודם מוצאים כמה שעות ער ביממה אחת, ואז כופלים במספר הימים.\nשימו לב: ביממה יש 24 שעות.\nשלב 1 — ער בכל יממה: 24 − ${sleep} = ${awakePerDay} שעות. מצאנו את היממה האחת!\nשלב 2 — במהלך ${dayWord}: ${awakePerDay} × ${days} = ${answer} שעות.\n⚠️ המלכודת: מי שמחשב כמה הוא ישן מקבל ${sleep * days} — אבל שאלו כמה הוא ער! כיוון הפוך.\nלכן התשובה: ${answer} שעות ✔`;
  return { stem, options, correctOption, explanation };
};

// ── Two-constraint digit puzzle: check every option against BOTH rules ──
const dp2: TemplateGen = (d) => {
  // "I'm a two-digit EVEN number and my digit-sum is S. Who am I?"
  // The kid must verify two independent constraints per option — a real
  // exam skill (elimination by checking), not a single computation.
  const digitSum = d === 'hard' ? pick([9, 11, 13]) : pick([7, 9]);
  // Collect all 2-digit even numbers with that digit sum.
  const evens: number[] = [];
  const odds: number[] = [];
  const wrongSumEvens: number[] = [];
  for (let n = 10; n <= 98; n++) {
    const s = Math.floor(n / 10) + (n % 10);
    if (s === digitSum) (n % 2 === 0 ? evens : odds).push(n);
    else if (n % 2 === 0 && Math.abs(s - digitSum) === 1) wrongSumEvens.push(n);
  }
  if (evens.length === 0 || odds.length < 2 || wrongSumEvens.length === 0) return dp2('medium');
  const answer = pick(evens);
  const distractors = shuffle([
    ...shuffle(odds).slice(0, 2),          // right sum, but odd
    pick(wrongSumEvens),                    // even, but sum off by one
  ]).slice(0, 3);
  const allOpts = shuffle([answer, ...distractors]).map(String);
  const stem = `אני מספר דו־ספרתי זוגי, וסכום הספרות שלי הוא ${digitSum}. מי אני?`;
  return {
    stem,
    options: allOpts,
    correctOption: allOpts.indexOf(String(answer)),
    explanation: `🔍 השיטה: כשיש שני תנאים — בודקים כל תשובה מול שניהם, אחד-אחד.\nתנאי 1: המספר זוגי (ספרת האחדות: 0, 2, 4, 6 או 8). תנאי 2: סכום הספרות = ${digitSum}.\n✓ בדיקה על ${answer}: ${Math.floor(answer / 10)} + ${answer % 10} = ${digitSum}, וספרת האחדות ${answer % 10} זוגית — שני התנאים מתקיימים!\n⚠️ המלכודת: יש תשובות עם הסכום הנכון אבל אי-זוגיות — כמעט נכון, קיים רק תנאי אחד מהשניים!\nלכן התשובה: ${answer} ✔`,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// ARCHETYPE-GAP TEMPLATES (added after auditing against the reference
// archetype list of top-tier prep materials). Each covers a pattern the
// bank lacked: union-then-multiply, fraction-of-quantity, ratio in both
// directions, symbolic missing-number equations, m/cm conversion with
// borrowing, savings-over-a-year, chain division, round-DOWN remainder,
// place value (digit vs count), transitive age differences, state-tracking
// transfers, and price proportion. Difficulty stays structural-logical —
// numbers are always "friendly" and results always whole.
// ═══════════════════════════════════════════════════════════════════════

// ── #1 Union then multiply: (a+b) × N ───────────────────────────────────
const um1: TemplateGen = (d) => {
  const a = rand(2, d === 'hard' ? 7 : 5);
  const b = rand(2, d === 'hard' ? 7 : 5);
  const boxes = rand(3, d === 'hard' ? 6 : 5);
  const perBox = a + b;
  const answer = perBox * boxes;
  const name = girlName();
  const stem = `בכל קופסת צבעים יש ${a} עפרונות אדומים ו-${b} עפרונות כחולים. ${name} קנתה ${boxes} קופסאות. כמה עפרונות יש לה בסך הכול?`;
  const { options, correctOption } = makeOptions(answer, [a * boxes, perBox, a + b + boxes]);
  const explanation = `🔍 השיטה: קודם מאחדים כמה יש בקופסה אחת, ורק אז כופלים במספר הקופסאות.\nשלב 1 — בקופסה אחת: ${a} + ${b} = ${perBox} עפרונות. מצאנו כמה יש בכל קופסה!\nשלב 2 — ${boxes} קופסאות: ${perBox} × ${boxes} = ${answer}.\n💡 טיפ: אפשר גם לחשב כל צבע בנפרד — ${a} × ${boxes} ועוד ${b} × ${boxes} — ולקבל בדיוק אותו דבר.\n⚠️ המלכודת: ${a * boxes} מופיע בתשובות — מי שסופר רק את האדומים שוכח חצי מהקופסה!\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #2 Fraction of a quantity: half / third / quarter of N ──────────────
const fr1: TemplateGen = (d) => {
  const fracs = [
    { k: 2, w: 'מחצית' },
    { k: 3, w: 'שליש' },
    { k: 4, w: 'רבע' },
  ];
  const f = d === 'easy' ? fracs[0] : pick(fracs);
  const part = rand(3, d === 'hard' ? 9 : 7);
  const total = f.k * part;
  const rest = total - part;
  const askRest = d === 'hard' && rand(0, 1) === 1; // hard may ask the complement
  const answer = askRest ? rest : part;
  const stem = askRest
    ? `בכיתה ${total} תלמידים. ${f.w} מהם הגיעו היום עם כובע. כמה תלמידים הגיעו בלי כובע?`
    : `בכיתה ${total} תלמידים. ${f.w} מהם הגיעו היום עם כובע. כמה תלמידים הגיעו עם כובע?`;
  const { options, correctOption } = makeOptions(answer, [askRest ? part : rest, f.k, total]);
  const explanation = askRest
    ? `🔍 השיטה: קודם מוצאים כמה זה ${f.w}, ורק אז מחסירים מהכיתה כולה.\nשלב 1 — ${f.w} מ-${total}: ${total} ÷ ${f.k} = ${part}. מצאנו כמה הגיעו עם כובע!\nשלב 2 — בלי כובע: ${total} − ${part} = ${answer}.\n⚠️ המלכודת: ${part} מופיע בתשובות — אלו דווקא התלמידים עם הכובע, שאלו על ההפך!\nלכן התשובה: ${answer} ✔`
    : `🔍 השיטה: "${f.w}" פירושו לחלק ל-${f.k} חלקים שווים.\nשלב 1 — ${total} ÷ ${f.k} = ${answer}. מצאנו כמה זה ${f.w} מהכיתה!\n✓ בדיקה: ${answer} × ${f.k} = ${total} — בדיוק כל הכיתה.\n⚠️ המלכודת: ${rest} מופיע בתשובות — זה כל השאר, מי שמחסיר במקום לחלק טועה בכיוון!\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #3 Ratio in BOTH directions: פי 2 / חצי מ- ──────────────────────────
const rb1: TemplateGen = (d) => {
  const factor = pick(d === 'easy' ? [2] : [2, 3]);
  const small = factor * rand(2, d === 'hard' ? 5 : 4); // divisible → inverse-op trap stays whole
  const big = small * factor;
  const item = pick(countableItems);
  const [nA, nB] = shuffle([...girls]).slice(0, 2);
  const lessWord = factor === 2 ? 'חצי' : 'שליש';
  const direction = pick(['more', 'less'] as const);
  if (direction === 'more') {
    const answer = big;
    const stem = `ל${nA} יש ${small} ${item.p}. ל${nB} יש פי ${factor === 2 ? 'שניים' : 'שלושה'} ממה שיש ל${nA}. כמה ${item.p} יש ל${nB}?`;
    const { options, correctOption } = makeOptions(answer, [small / factor, small, small + factor]);
    const explanation = `🔍 השיטה: "פי ${factor}" אומר להכפיל ב-${factor} — קוראים למי יש יותר לפני שמחשבים.\nשלב 1 — ל${nB} יש יותר: ${small} × ${factor} = ${answer}.\n✓ בדיקה: ${answer} זה באמת פי ${factor} מ-${small} — מסתדר.\n⚠️ המלכודת: ${small / factor} מופיע בתשובות — מי שמחלק במקום להכפיל הופך את הכיוון!\nלכן התשובה: ${answer} ✔`;
    return { stem, options, correctOption, explanation };
  }
  const answer = small;
  const stem = `ל${nA} יש ${big} ${item.p}. ל${nB} יש ${lessWord} ממה שיש ל${nA}. כמה ${item.p} יש ל${nB}?`;
  const { options, correctOption } = makeOptions(answer, [big * factor, big, big - factor]);
  const explanation = `🔍 השיטה: "${lessWord} מ..." אומר לחלק ב-${factor} — קוראים למי יש פחות לפני שמחשבים.\nשלב 1 — ל${nB} יש פחות: ${big} ÷ ${factor} = ${answer}.\n✓ בדיקה: ${answer} × ${factor} = ${big} — מסתדר בדיוק.\n⚠️ המלכודת: ${big * factor} מופיע בתשובות — מי שמכפיל במקום לחלק הופך את הכיוון!\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #5 Missing number in equation with order of operations ──────────────
const eq1: TemplateGen = (d) => {
  const b = pick(d === 'hard' ? [2, 3, 4] : [2, 3]);
  const c = rand(3, d === 'hard' ? 9 : 7);
  const a = rand(2, 8);
  const plus = rand(0, 1) === 1;
  const inner = c * b; // value inside the parentheses
  const answer = plus ? inner - a : inner + a;
  if (answer < 1) return eq1(d); // re-roll degenerate case
  const sign = plus ? '+' : '−';
  const stem = `בתרגיל שלפניכם: (☐ ${sign} ${a}) : ${b} = ${c}. איזה מספר מסתתר בריבוע?`;
  const inverseTrap = plus ? inner + a : inner - a;
  const { options, correctOption } = makeOptions(answer, [inner, inverseTrap, c]);
  const undoLine = plus
    ? `שלב 2 — מבטלים את ה"${sign} ${a}": ☐ = ${inner} − ${a} = ${answer}.`
    : `שלב 2 — מבטלים את ה"${sign} ${a}": ☐ = ${inner} + ${a} = ${answer}.`;
  const explanation = `🔍 השיטה: עובדים אחורה מהתוצאה — קודם מבטלים את החילוק, ואז את מה שבסוגריים.\nשלב 1 — משהו : ${b} = ${c}, לכן בתוך הסוגריים יש ${c} × ${b} = ${inner}. מצאנו את מה שבסוגריים!\n${undoLine}\n✓ בדיקה: (${answer} ${sign} ${a}) : ${b} = ${inner} : ${b} = ${c} — בדיוק כמו בתרגיל.\n⚠️ המלכודת: ${inner} מופיע בתשובות — זו רק תוצאת ביניים, לפני שביטלנו את הסוגריים!\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #7 Unit conversion m/cm + subtraction with borrowing ────────────────
const uc1: TemplateGen = (d) => {
  const m = rand(2, d === 'hard' ? 5 : 4);
  const cm = pick([15, 20, 25, 30, 35, 40, 45]);
  // cut > cm forces borrowing; delta ≠ cm so the no-borrow distractor never
  // collides with the original length shown in the stem.
  const delta = pick((d === 'hard' ? [25, 35, 45, 50] : [15, 20, 30]).filter(x => x !== cm));
  const cut = cm + delta;
  const rm = m - 1;
  const rc = cm + 100 - cut;
  const fmtLen = (M: number, C: number) => C === 0 ? `${M} מטר` : `${M} מטר ו-${C} ס"מ`;
  const correctStr = fmtLen(rm, rc);
  const wrongs = [
    fmtLen(m, cut - cm),       // no-borrow trap: subtracted the smaller from the larger
    fmtLen(rm, rc + 10),
    fmtLen(rm, Math.max(5, rc - 10)),
  ];
  const allOpts = shuffle(Array.from(new Set([correctStr, ...wrongs])));
  while (allOpts.length < 4) allOpts.push(fmtLen(rm, rc + allOpts.length * 5 + 5));
  const stem = `לחוט אורך ${m} מטר ו-${cm} ס"מ. גזרו ממנו חתיכה באורך ${cut} ס"מ. מה אורך החוט שנשאר?`;
  const explanation = `🔍 השיטה: כשאין מספיק ס"מ להחסיר — פורטים מטר אחד ל-100 ס"מ.\nשימו לב: מטר = 100 ס"מ.\nשלב 1 — יש רק ${cm} ס"מ וצריך להחסיר ${cut}. פורטים מטר: ${cm} + 100 = ${cm + 100} ס"מ, ונשארים ${rm} מטרים.\nשלב 2 — ${cm + 100} − ${cut} = ${rc} ס"מ.\n⚠️ המלכודת: "${fmtLen(m, cut - cm)}" מופיע בתשובות — מי שמחסיר הפוך (${cut} − ${cm}) בלי לפרוט מטר מקבל אותו!\nלכן התשובה: ${correctStr} ✔`;
  return {
    stem,
    options: allOpts.slice(0, 4),
    correctOption: allOpts.indexOf(correctStr),
    explanation,
  };
};

// ── #8 Savings over time (hidden knowledge: year = 12 months) ───────────
const sv1: TemplateGen = (d) => {
  const perMonth = pick(d === 'hard' ? [4, 6, 7, 8] : [3, 5, 10]);
  const initial = d === 'easy' ? 0 : pick([10, 15, 20, 25, 30]);
  const saved = 12 * perMonth;
  const answer = initial + saved;
  const name = boyName();
  const stem = initial > 0
    ? `בקופת החיסכון של ${name} יש ${initial} שקלים. בכל חודש הוא מכניס לקופה עוד ${perMonth} שקלים. כמה כסף יהיה בקופה בעוד שנה בדיוק?`
    : `${name} חוסך ${perMonth} שקלים בכל חודש. כמה שקלים יחסוך בשנה שלמה?`;
  const { options, correctOption } = makeOptions(answer, [initial + 10 * perMonth, saved, initial + perMonth]);
  const explanation = initial > 0
    ? `🔍 השיטה: קודם מגלים כמה חודשים יש בשנה, ואז כופלים ומוסיפים למה שכבר יש.\nשימו לב: שנה = 12 חודשים.\nשלב 1 — חיסכון של שנה: ${perMonth} × 12 = ${saved} ₪. מצאנו כמה יתווסף!\nשלב 2 — יחד עם מה שכבר בקופה: ${initial} + ${saved} = ${answer} ₪.\n⚠️ המלכודת: ${initial + 10 * perMonth} מופיע בתשובות — מי שסופר 10 חודשים בשנה נופל שם. וגם ${saved} בלי ה-${initial} שכבר בקופה!\nלכן התשובה: ${answer} ₪ ✔`
    : `🔍 השיטה: "שנה" היא מילה מסתירה — קודם הופכים אותה למספר חודשים.\nשימו לב: שנה = 12 חודשים.\nשלב 1 — ${perMonth} × 12 = ${answer} ₪.\n⚠️ המלכודת: ${10 * perMonth} מופיע בתשובות — מי שסופר 10 חודשים בשנה נופל שם!\nלכן התשובה: ${answer} ₪ ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #9 Chain divisions: loaf → slices → sandwiches ──────────────────────
const cd1: TemplateGen = (d) => {
  const slicesPerLoaf = pick([10, 12, 16, 20]);
  const loaves = d === 'easy' ? 2 : rand(2, d === 'hard' ? 4 : 3);
  const perLoaf = slicesPerLoaf / 2; // sandwiches from one loaf (2 slices each)
  const answer = perLoaf * loaves;
  const stem = `בכיכר לחם יש ${slicesPerLoaf} פרוסות, ולכל כריך צריך 2 פרוסות. כמה כריכים אפשר להכין מ-${loaves} כיכרות?`;
  const { options, correctOption } = makeOptions(answer, [perLoaf, slicesPerLoaf * loaves, answer + loaves]);
  const explanation = `🔍 השיטה: הולכים בשרשרת — קודם כמה כריכים מכיכר אחת, ואז כופלים במספר הכיכרות.\nשלב 1 — מכיכר אחת: ${slicesPerLoaf} ÷ 2 = ${perLoaf} כריכים. מצאנו כמה נותנת כיכר אחת!\nשלב 2 — מ-${loaves} כיכרות: ${perLoaf} × ${loaves} = ${answer}.\n⚠️ המלכודת: ${perLoaf} מופיע בתשובות — זו רק כיכר אחת! וגם ${slicesPerLoaf * loaves} — זה מספר הפרוסות, שכחו לחלק לכריכים.\nלכן התשובה: ${answer} כריכים ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #10 Division with remainder — round DOWN (full bottles only) ────────
// The round-UP twin (boxes needed → add the partial group) is covered by gd1.
const rd1: TemplateGen = (d) => {
  const bottle = pick(d === 'hard' ? [3, 4] : [2, 3]);
  const q = rand(4, d === 'hard' ? 9 : 7);
  const r = rand(1, bottle - 1);
  const total = bottle * q + r;
  const answer = q;
  const stem = `במיכל יש ${total} ליטר מיץ. ממלאים ממנו בקבוקים, ובכל בקבוק נכנסים בדיוק ${bottle} ליטר. כמה בקבוקים מלאים אפשר למלא?`;
  const { options, correctOption } = makeOptions(answer, [q + 1, r, total - bottle]);
  const explanation = `🔍 השיטה: מחלקים — ואז עוצרים לחשוב מה עושים עם השארית.\nשלב 1 — ${total} ÷ ${bottle} = ${q} ושארית ${r}, כי ${bottle} × ${q} = ${bottle * q}. מצאנו ${q} בקבוקים מלאים!\nשלב 2 — ${r === 1 ? 'נשאר ליטר אחד' : `נשארו ${r} ליטר`} — פחות מבקבוק שלם, אז זה לא נספר.\n⚠️ המלכודת: ${q + 1} מפתה — אבל הבקבוק האחרון לא מלא! שאלו על בקבוקים מלאים, אז מעגלים למטה. (בשאלות "כמה קופסאות צריך" דווקא מעגלים למעלה — קוראים בדיוק מה שאלו!)\nלכן התשובה: ${answer} בקבוקים ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #12 Place value: digit vs count ("כמה מאות במספר") ──────────────────
const pv1: TemplateGen = (d) => {
  const a = rand(1, d === 'hard' ? 9 : 5); // thousands
  const b = rand(1, 9);                    // hundreds digit
  const num = a * 1000 + b * 100;
  const display = `${a},${b}00`;
  const answer = a * 10 + b; // total hundreds in the number
  const stem = `כמה מאות יש במספר ${display}?`;
  const { options, correctOption } = makeOptions(answer, [b, a, a * 10]);
  const explanation = `🔍 השיטה: מפרקים את המספר — כמה מאות מסתתרות בכל חלק שלו.\nשימו לב: באלף אחד יש 10 מאות.\nשלב 1 — ${a === 1 ? 'אלף אחד' : `${a} אלפים`}: ${a} × 10 = ${a * 10} מאות. מצאנו את המאות שבאלפים!\nשלב 2 — ועוד ${b === 1 ? 'מאה אחת גלויה' : `${b} מאות גלויות`}: ${a * 10} + ${b} = ${answer}.\n✓ בדיקה: ${answer} × 100 = ${num.toLocaleString('en-US')} — בדיוק המספר שלנו.\n⚠️ המלכודת: ${b} מופיע בתשובות — זו רק ספרת המאות, אבל שאלו כמה מאות יש בכל המספר!\nלכן התשובה: ${answer} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #14 Transitive age logic: difference of differences ─────────────────
const tr1: TemplateGen = (d) => {
  const d1 = rand(4, d === 'hard' ? 9 : 7);
  const d2 = rand(1, d1 - 2);
  const answer = d1 - d2;
  const [nA, nB, nC] = shuffle([...boys]).slice(0, 3);
  const stem = `${nA} גדול מ${nB} ב-${d1} שנים. ${nC} גדול מ${nB} ב-${d2} שנים. בכמה שנים ${nA} גדול מ${nC}?`;
  const { options, correctOption } = makeOptions(answer, [d1 + d2, d1, d2]);
  const baseAge = 10;
  const explanation = `🔍 השיטה: כששני הפרשים נמדדים מאותו ילד — נותנים לו גיל לדוגמה ובודקים.\nשלב 1 — נגיד ש${nB} בן ${baseAge}: אז ${nA} בן ${baseAge} + ${d1} = ${baseAge + d1}, ו${nC} בן ${baseAge} + ${d2} = ${baseAge + d2}.\nשלב 2 — ההפרש ביניהם: ${baseAge + d1} − ${baseAge + d2} = ${answer}.\n⚠️ המלכודת: ${d1 + d2} מופיע בתשובות — מי שמחבר את ההפרשים טועה: שניהם גדולים מ${nB}, אז מחסירים, לא מחברים!\nלכן התשובה: ${answer} שנים ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #16 State tracking with transfers (solved with a state table) ───────
const st1: TemplateGen = (d) => {
  const g = rand(2, d === 'hard' ? 6 : 4);          // first gift A → B
  const h = rand(3, d === 'hard' ? 9 : 7);          // half B returns
  const b1 = 2 * h;                                  // B after receiving (even by construction)
  const b0 = b1 - g;
  if (b0 < 2) return st1(d);                         // re-roll degenerate case
  const a0 = rand(g + 4, g + (d === 'hard' ? 14 : 10));
  const a1 = a0 - g;
  const a2 = a1 + h;
  const [nA, nB] = shuffle([...boys]).slice(0, 2);
  const stem = `ל${nA} יש ${a0} גולות ול${nB} יש ${b0} גולות. ${nA} נתן ל${nB} ${g} גולות, ואז ${nB} החזיר ל${nA} חצי מהגולות שהיו לו באותו רגע. כמה גולות יש ל${nA} עכשיו?`;
  const halfOfOriginal = a1 + Math.floor(b0 / 2); // the "half of what he HAD" trap
  const { options, correctOption } = makeOptions(a2, [a1, halfOfOriginal, h]);
  const explanation = `🔍 השיטה: כשגולות עוברות הלוך ושוב — עוקבים אחרי המצב של שניהם אחרי כל צעד.\nבהתחלה: ${nA}=${a0}, ${nB}=${b0} → אחרי המתנה: ${nA}=${a1}, ${nB}=${b1} → ${nB} מחזיר חצי (${b1} ÷ 2 = ${h}): ${nA}=${a2}, ${nB}=${h}.\n✓ בדיקה: ${a2} + ${h} = ${a2 + h} — בדיוק כמו בהתחלה (${a0} + ${b0}), אף גולה לא נעלמה!\n⚠️ המלכודת: "חצי ממה שהיה לו באותו רגע" — כלומר חצי מ-${b1}, לא חצי מ-${b0} שהיו לו בהתחלה!\nלכן התשובה: ${a2} ✔`;
  return { stem, options, correctOption, explanation };
};

// ── #17 Price proportion: 100g costs P → how much for k×100g ────────────
const pp1: TemplateGen = (d) => {
  const price = rand(2, d === 'hard' ? 9 : 6);
  const factor = d === 'easy' ? 2 : pick([2, 3, 4]);
  const grams = 100 * factor;
  const answer = price * factor;
  const item = pick(['גבינה צהובה', 'זיתים', 'חמוציות', 'שקדים', 'בוטנים']);
  const stem = `בחנות, 100 גרם ${item} עולים ${price} שקלים. כמה יעלו ${grams} גרם?`;
  const { options, correctOption } = makeOptions(answer, [price + factor, price * (factor + 1), price]);
  const explanation = `🔍 השיטה: בודקים פי כמה גדלה הכמות — המחיר גדל בדיוק באותו יחס.\nשלב 1 — ${grams} ÷ 100 = ${factor}, כלומר פי ${factor} יותר ${item}. מצאנו את היחס!\nשלב 2 — גם המחיר פי ${factor}: ${price} × ${factor} = ${answer} ₪.\n⚠️ המלכודת: ${price + factor} מופיע בתשובות — מי שמוסיף ${factor} במקום להכפיל פי ${factor} נופל שם!\nלכן התשובה: ${answer} ₪ ✔`;
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
//
// Real-Stage-B templates (dp1, ag1, ir1, mw1, sp1, gd1) added after auditing
// the Michonan booklet. They cover patterns the previous bank lacked:
// digit puzzles, age-with-multiplier, items×rows layouts, multi-week shopping,
// rate extrapolation, group division with leftover.
// Archetype-gap templates (um1, fr1, rb1, eq1, uc1, sv1, cd1, rd1, pv1,
// tr1, st1, pp1) added after auditing against the reference archetype list —
// see the section header above their definitions.
const allTemplates: SkillTemplates[] = [
  { skill: 'word_problems', templates: [wp1, wp2, wp3, wp4, wp5, wp7, wp8, ir1, mw1, gd1, inv1, sf1, rs1, wt1, sl1, um1, fr1, cd1, rd1, uc1, st1] },
  { skill: 'number_sequences', templates: [seq1, seq2, seq4, seq5] },
  { skill: 'math_logic', templates: [ml2, ml4, dp1, ag1, by1, re1, tw1, dp2, eq1, pv1, tr1, rb1] },
  { skill: 'time_clock', templates: [tc1, tc2, tc3, sp1, ba1] },
  { skill: 'money_change', templates: [mc1, mc2, mc3, hw1, sv1, pp1] },
];

// Hard-only templates: pre-algebra patterns only surfaced when the adaptive
// engine flags the child as ready for stretch material.
const hardOnlyTemplates: SkillTemplates[] = [
  { skill: 'word_problems', templates: [wp6] },
  { skill: 'number_sequences', templates: [seq3] },
  { skill: 'math_logic', templates: [ml1, ml3] },
];

// Test-only export: lets the smoke script drive each archetype-gap template
// directly and re-verify its arithmetic independently. Not used by app code.
export const __archetypeTemplatesForTest: Record<string, TemplateGen> = {
  um1, fr1, rb1, eq1, uc1, sv1, cd1, rd1, pv1, tr1, st1, pp1,
};

// ── Public API ──────────────────────────────────────────────────────────

export function generateMathQuestions(
  difficulty: Difficulty,
  count: number,
  options?: { skill?: MathSkill; recentTemplates?: Set<TemplateGen> },
): Question[] {
  const result: Question[] = [];
  // Adaptive is the default practice mode of a gifted-exam prep tool, so it
  // must stretch toward exam level — no pure-easy, majority medium/hard.
  const effectiveDiff: Difficulty = difficulty === 'adaptive' ? pick(['medium', 'medium', 'hard', 'hard']) : difficulty;

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
    const d = difficulty === 'adaptive' ? pick(['medium', 'medium', 'hard', 'hard']) as Difficulty : effectiveDiff;
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
