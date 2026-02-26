/**
 * Word relations generator — large banks of Hebrew word pairs organized by
 * relationship type. Randomly selects stem pair and matching/non-matching options.
 */
import type { Question, Difficulty, WordRelationSkill } from '../types';

let _c = 0;
const uid = () => `gw_${Date.now()}_${++_c}_${Math.random().toString(36).slice(2, 6)}`;
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ── Word pair type ──────────────────────────────────────────────────────

type Pair = [string, string]; // [word1, word2]

interface RelationBank {
  skill: WordRelationSkill;
  label: string; // Hebrew description of the relation
  pairs: Pair[];
}

// ── Relation banks ──────────────────────────────────────────────────────

const banks: RelationBank[] = [
  {
    skill: 'synonyms_antonyms',
    label: 'מילים נרדפות או הפכים',
    pairs: [
      ['חָם', 'קַר'], ['גָּבוֹהַּ', 'נָמוּךְ'], ['גָּדוֹל', 'קָטָן'], ['מָהִיר', 'אִטִּי'],
      ['חָזָק', 'חָלָשׁ'], ['יָפֶה', 'מְכוֹעָר'], ['רָחוֹק', 'קָרוֹב'], ['עָשִׁיר', 'עָנִי'],
      ['בָּהִיר', 'כָּהֶה'], ['שָׁמֵן', 'רָזֶה'], ['עָמֹק', 'רָדוּד'], ['קָשֶׁה', 'רַךְ'],
      ['אָרֹךְ', 'קָצָר'], ['רָחָב', 'צַר'], ['שָׁקֵט', 'רוֹעֵשׁ'], ['אַמִּיץ', 'פַּחְדָן'],
      ['שָׂמֵחַ', 'עָצוּב'], ['צָעִיר', 'זָקֵן'], ['חָדָשׁ', 'יָשָׁן'], ['מָלֵא', 'רֵיק'],
      ['בָּרִיא', 'חוֹלֶה'], ['חָכָם', 'טִפְּשִׁי'], ['אָמִיץ', 'בַּיְשָׁן'],
    ],
  },
  {
    skill: 'part_whole',
    label: 'חלק מתוך שלם',
    pairs: [
      ['עָלֶה', 'עֵץ'], ['גַּלְגַּל', 'מְכוֹנִית'], ['דַּף', 'סֵפֶר'], ['אֶצְבַּע', 'יָד'],
      ['חַלּוֹן', 'בַּיִת'], ['כְּנָף', 'צִפּוֹר'], ['מַקְלֶדֶת', 'מַחְשֵׁב'], ['עַיִן', 'פָּנִים'],
      ['שֵׁן', 'פֶּה'], ['פֶּרַח', 'גִּנָּה'], ['שַׁעַר', 'מִגְרָשׁ'], ['כַּפְתּוֹר', 'חוּלְצָה'],
      ['מָסָךְ', 'טֵלֵפוֹן'], ['מַפְתֵּחַ', 'פְּסַנְתֵּר'], ['סוֹלָם', 'מַדְרֵגָה'],
      ['מְנוֹרָה', 'תִּקְרָה'], ['שׁוֹלֶחָן', 'כִּתָּה'], ['עַמּוּד', 'בִּנְיָן'],
    ],
  },
  {
    skill: 'tool_use',
    label: 'כלי ושימושו',
    pairs: [
      ['מַסְפָּרַיִם', 'לִגְזֹר'], ['עֵט', 'לִכְתֹּב'], ['מַזְלֵג', 'לֶאֱכֹל'],
      ['מַפְתֵּחַ', 'לִפְתֹּחַ'], ['מַסּוֹר', 'לַחֲתֹךְ'], ['מִטְרִיָּה', 'לְהָגֵן מִגֶּשֶׁם'],
      ['מְחַק', 'לִמְחֹק'], ['סַרְגֵּל', 'לִמְדֹּד'], ['מַחַט', 'לִתְפֹּר'],
      ['מַחְבֵּת', 'לְבַשֵׁל'], ['מַגְנֵט', 'לִמְשֹׁךְ'], ['מִשְׁקֶפֶת', 'לִרְאוֹת'],
      ['שׁוֹפָר', 'לִתְקֹעַ'], ['מִכְחוֹל', 'לְצַיֵּר'], ['אִזְמֵל', 'לְפַסֵּל'],
      ['פַּטִּישׁ', 'לִדְפֹּק'], ['מַקְדֵּחָה', 'לִקְדֹּחַ'],
    ],
  },
  {
    skill: 'material_product',
    label: 'חומר ומוצר',
    pairs: [
      ['עֵץ', 'שֻׁלְחָן'], ['צֶמֶר', 'סְוֶדֶר'], ['חוֹל', 'זְכוּכִית'],
      ['קֶמַח', 'לֶחֶם'], ['בַּרְזֶל', 'מַסְמֵר'], ['כּוֹתְנָה', 'חוּלְצָה'],
      ['חָלָב', 'גְּבִינָה'], ['עֲנָבִים', 'יַיִן'], ['עוֹר', 'נַעַל'],
      ['חֵמָר', 'כַּד'], ['גּוּמִי', 'צְמִיג'], ['נְיָר', 'סֵפֶר'],
      ['שַׁיִשׁ', 'פֶּסֶל'], ['זֶרַע', 'צֶמַח'], ['בֵּיצָה', 'עוּגָה'],
      ['חוּט', 'בֶּגֶד'], ['חָלָב', 'שׁוֹקוֹ'],
    ],
  },
  {
    skill: 'category_item',
    label: 'קטגוריה ופריט',
    pairs: [
      ['כֶּלֶב', 'חַיָּה'], ['תַּפּוּחַ', 'פְּרִי'], ['וֶרֶד', 'פֶּרַח'],
      ['כִּסֵּא', 'רָהִיט'], ['פְּסַנְתֵּר', 'כְּלִי נְגִינָה'], ['כַּדּוּרֶגֶל', 'סְפּוֹרְט'],
      ['אַרְיֵה', 'חַיַּת טֶרֶף'], ['נֶשֶׁר', 'צִפּוֹר'], ['סַלְמוֹן', 'דָּג'],
      ['אֲפוּנָה', 'יָרָק'], ['אוּבוֹאָה', 'כְּלִי נְגִינָה'], ['טְרַקְטוֹר', 'כְּלִי רֶכֶב'],
      ['יַהֲלוֹם', 'אֶבֶן יְקָרָה'], ['אֶרֶז', 'עֵץ'], ['חִטָּה', 'דָּגָן'],
      ['עִבְרִית', 'שָׂפָה'], ['אַרְגֶּנְטִינָה', 'מְדִינָה'],
    ],
  },
  {
    skill: 'cause_effect',
    label: 'סיבה ותוצאה',
    pairs: [
      ['אֵשׁ', 'עָשָׁן'], ['גֶּשֶׁם', 'שְׁלוּלִית'], ['שֶׁמֶשׁ', 'צֵל'],
      ['קֹר', 'רְעִידָה'], ['חֹם', 'זֵעָה'], ['רַעַשׁ', 'הֵד'],
      ['לִמּוּד', 'יֶדַע'], ['אִמּוּן', 'כֹּשֶׁר'], ['שִׂמְחָה', 'חִיּוּךְ'],
      ['עֲצַבְנוּת', 'כַּעַס'], ['בְּדִידוּת', 'עֶצֶב'], ['הַצְלָחָה', 'גַּאֲוָה'],
      ['עֲיֵפוּת', 'שֵׁנָה'], ['רָעָב', 'אֲכִילָה'], ['צָמָא', 'שְׁתִיָּה'],
      ['פַּחַד', 'בְּרִיחָה'], ['חֹסֶר שֵׁנָה', 'עֲיֵפוּת'],
    ],
  },
  {
    skill: 'verbal_analogy',
    label: 'אנלוגיה מילולית',
    pairs: [
      // profession : workplace
      ['מוֹרֶה', 'בֵּית סֵפֶר'], ['רוֹפֵא', 'בֵּית חוֹלִים'], ['שֵׁף', 'מִסְעָדָה'],
      ['טַיָּס', 'מָטוֹס'], ['סַפָּר', 'מִסְפָּרָה'],
      // tool : profession
      ['סְטֶטוֹסְקוֹפּ', 'רוֹפֵא'], ['גִּיר', 'מוֹרֶה'], ['מַזְלֵג', 'שֵׁף'],
      // animal : habitat
      ['דָּג', 'מַיִם'], ['צִפּוֹר', 'קֵן'], ['דֹּב', 'מְעָרָה'],
      // baby : parent
      ['גּוּר', 'כֶּלֶב'], ['אֶפְרוֹחַ', 'תַּרְנְגֹלֶת'], ['עֶגְלָה', 'פָּרָה'],
      // country : capital
      ['יִשְׂרָאֵל', 'יְרוּשָׁלַיִם'], ['צָרְפַת', 'פָּרִיז'], ['אַנְגְּלְיָה', 'לוֹנְדוֹן'],
      // singular : plural feel
      ['יוֹם', 'שָׁבוּעַ'], ['טִפָּה', 'נָהָר'], ['אוֹת', 'מִלָּה'],
    ],
  },
];

// ── Generator logic ─────────────────────────────────────────────────────

function generateOneRelation(skill: WordRelationSkill, difficulty: Difficulty): Question | null {
  const bank = banks.find(b => b.skill === skill);
  if (!bank || bank.pairs.length < 4) return null;

  // Shuffle pairs and pick stem + correct option from same bank
  const shuffledPairs = shuffle(bank.pairs);
  const stemPair = shuffledPairs[0];
  const correctPair = shuffledPairs[1]; // same relationship type

  // Pick 3 distractors from OTHER relationship banks
  const otherBanks = banks.filter(b => b.skill !== skill);
  const distractorPairs: Pair[] = [];
  const usedDistractors = shuffle(otherBanks);
  for (const ob of usedDistractors) {
    if (distractorPairs.length >= 3) break;
    distractorPairs.push(pick(ob.pairs));
  }

  // Ensure we have 3 distractors
  while (distractorPairs.length < 3) {
    const extraBank = pick(otherBanks);
    distractorPairs.push(pick(extraBank.pairs));
  }

  const fmtPair = (p: Pair) => `${p[0]} : ${p[1]}`;
  const allOptions = shuffle([
    fmtPair(correctPair),
    ...distractorPairs.slice(0, 3).map(fmtPair),
  ]);

  const effectiveDiff = difficulty === 'adaptive' ? pick(['easy', 'medium', 'hard'] as Difficulty[]) : difficulty;

  return {
    id: uid(),
    sectionType: 'word_relations',
    skillTag: skill,
    difficulty: effectiveDiff,
    questionType: 'text',
    stem: fmtPair(stemPair),
    options: allOptions,
    correctOption: allOptions.indexOf(fmtPair(correctPair)),
    explanation: `הקשר: ${bank.label}.\n${stemPair[0]} ← → ${stemPair[1]}.\nאותו קשר: ${correctPair[0]} ← → ${correctPair[1]}.`,
    recommendedTimeSec: effectiveDiff === 'easy' ? 40 : effectiveDiff === 'hard' ? 60 : 50,
    generatorSource: 'generated',
    qualityScore: 89,
    isActive: true,
  };
}

// ── Public API ──────────────────────────────────────────────────────────

export function generateWordRelQuestions(difficulty: Difficulty, count: number): Question[] {
  const result: Question[] = [];
  const skills = banks.map(b => b.skill);

  // Distribute evenly across skills
  const perSkill = Math.max(1, Math.floor(count / skills.length));
  const pool: WordRelationSkill[] = [];

  for (const skill of skills) {
    for (let i = 0; i < perSkill; i++) pool.push(skill);
  }
  while (pool.length < count) pool.push(pick(skills));

  for (const skill of shuffle(pool).slice(0, count)) {
    const q = generateOneRelation(skill, difficulty);
    if (q) result.push(q);
  }

  return result;
}
