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
  // verbal_analogy was previously a kitchen-sink "any analogy" bank that mixed
  // profession-workplace, animal-habitat, parent-offspring, country-capital,
  // and singular-plural — meaning the "correct" pair often had a totally different
  // semantic relation than the stem pair. Split into 4 coherent sub-banks.
  {
    skill: 'verbal_analogy',
    label: 'אנלוגיה: בעל מקצוע ומקום עבודה',
    pairs: [
      ['מוֹרֶה', 'בֵּית סֵפֶר'], ['רוֹפֵא', 'בֵּית חוֹלִים'], ['שֵׁף', 'מִסְעָדָה'],
      ['טַיָּס', 'מָטוֹס'], ['סַפָּר', 'מִסְפָּרָה'], ['חַקְלַאי', 'שָׂדֶה'],
      ['שׁוֹפֵט', 'בֵּית מִשְׁפָּט'], ['שָׂחְקָן', 'בָּמָה'], ['פַּסְיוֹן', 'גַּן יְלָדִים'],
    ],
  },
  {
    skill: 'verbal_analogy',
    label: 'אנלוגיה: בעל חיים וצאצא',
    pairs: [
      ['פָּרָה', 'עֵגֶל'], ['כֶּלֶב', 'גּוּר'], ['תַּרְנְגֹלֶת', 'אֶפְרוֹחַ'],
      ['חֲתוּלָה', 'גּוֹרָה'], ['כִּבְשָׂה', 'טָלֶה'], ['חֲזִירָה', 'חֲזַרְזִיר'],
      ['סוּסָה', 'סְיָח'], ['ארנבת', 'שָׁפָן'],
    ],
  },
  {
    skill: 'verbal_analogy',
    label: 'אנלוגיה: בעל חיים ומקום מחיה',
    pairs: [
      ['דָּג', 'מַיִם'], ['צִפּוֹר', 'קֵן'], ['דֹּב', 'מְעָרָה'],
      ['דְּבוֹרָה', 'כַּוֶּרֶת'], ['נְמָלָה', 'קֵן נְמָלִים'], ['חַפַרְפֶּרֶת', 'מַחִלָּה'],
      ['גָּמָל', 'מִדְבָּר'], ['דֻּבּוֹן', 'יַעַר'],
    ],
  },
  {
    skill: 'verbal_analogy',
    label: 'אנלוגיה: מדינה ובירה',
    pairs: [
      ['יִשְׂרָאֵל', 'יְרוּשָׁלַיִם'], ['צָרְפַת', 'פָּרִיז'], ['אַנְגְּלִיָּה', 'לוֹנְדוֹן'],
      ['אִיטַלְיָה', 'רוֹמָא'], ['יָוָן', 'אָתוּנָה'], ['רוּסְיָה', 'מוֹסְקְבָה'],
      ['גֶּרְמַנְיָה', 'בֶּרְלִין'],
    ],
  },

  // ── New banks added after auditing the real Stage B booklet ─────────
  // These relation types appear repeatedly in the real exam but were missing.

  {
    skill: 'synonyms',
    label: 'מילים נרדפות (אותה משמעות, מילה אחרת)',
    pairs: [
      ['שֶׁמֶשׁ', 'חַמָּה'], ['יָרֵחַ', 'לְבָנָה'], ['עָנָן', 'עָב'],
      ['סוֹד', 'כָּמוּס'], ['אִישׁוֹן', 'בָּבָה'], ['פַּחַד', 'אֵימָה'],
      ['שִׂמְחָה', 'גִּיל'], ['עָצוּב', 'נוּגֶה'], ['חָכָם', 'נָבוֹן'],
      ['מַתָּנָה', 'שַׁי'], ['בַּת מֶלֶךְ', 'נְסִיכָה'], ['גָּדוֹל', 'אַדִּיר'],
      ['קָטָן', 'זָעִיר'], ['מָהִיר', 'זָרִיז'],
    ],
  },

  {
    skill: 'action_object',
    label: 'פעולה ועצם נחוץ לה',
    pairs: [
      ['שְׁכִיבָה', 'מִזְרָן'], ['יְשִׁיבָה', 'כִּסֵּא'], ['אֲכִילָה', 'צַלַּחַת'],
      ['שְׁתִיָּה', 'כּוֹס'], ['כְּתִיבָה', 'עֵט'], ['קְרִיאָה', 'סֵפֶר'],
      ['רְחִיצָה', 'מַיִם'], ['חֲתִירָה', 'מָשׁוֹט'], ['גְּזִירָה', 'מִסְפָּרַיִם'],
      ['פְּתִיחָה', 'מַפְתֵּחַ'], ['צְבִיעָה', 'מִכְחוֹל'], ['צִיּוּר', 'דַּף'],
    ],
  },

  {
    skill: 'disease_cure',
    label: 'בעיה ופתרונה',
    pairs: [
      ['רָעָב', 'אֹכֶל'], ['צָמָא', 'שְׁתִיָּה'], ['עֲיֵפוּת', 'שֵׁנָה'],
      ['קֹר', 'מְעִיל'], ['חֹם', 'מָגֵן הַשֶּׁמֶשׁ'], ['גֶּשֶׁם', 'מִטְרִיָּה'],
      ['חֹשֶׁךְ', 'פָּנָס'], ['פְּצָעִים', 'תַּחְבּוֹשֶׁת'], ['מַחֲלָה', 'תְּרוּפָה'],
      ['בְּדִידוּת', 'חֲבֵרִים'], ['בּוּרוּת', 'לִמּוּד'], ['לִכְלוּךְ', 'נִקָּיוֹן'],
    ],
  },

  {
    skill: 'animal_baby',
    label: 'בעל חיים והצאצא המיוחד שלו',
    pairs: [
      ['צְפַרְדֵּעַ', 'רֹאשָׁן'], ['פַּרְפַּר', 'זַחַל'], ['פָּרָה', 'עֵגֶל'],
      ['כִּבְשָׂה', 'טָלֶה'], ['חֲזִירָה', 'חֲזַרְזִיר'], ['גָּמָל', 'בַּכְרָה'],
      ['סוּסָה', 'סְיָח'], ['תַּרְנְגֹלֶת', 'אֶפְרוֹחַ'], ['בַּרְוָז', 'אֶפְרוֹחַ'],
      ['כֶּלֶב', 'גּוּר'], ['חֲתוּלָה', 'גּוֹרָה'], ['אַיָּלָה', 'עֹפֶר'],
    ],
  },

  {
    skill: 'animal_trait',
    label: 'בעל חיים ותכונה בולטת שלו',
    pairs: [
      ['צָב', 'אִטִּיּוּת'], ['נְמָלָה', 'חָרִיצוּת'], ['אַרְיֵה', 'גְּבוּרָה'],
      ['שׁוּעָל', 'עָרְמָה'], ['פִּיל', 'זִכָּרוֹן'], ['חַרְגוֹל', 'קְפִיצָה'],
      ['חֲמוֹר', 'עַקְשָׁנוּת'], ['טַוָּס', 'יֹפִי'], ['יָנְשׁוּף', 'חָכְמָה'],
      ['דֹּב', 'כֹּחַ'], ['גֶּפֶן', 'פוֹרִיּוּת'], ['בָּרְבּוּר', 'חֵן'],
    ],
  },

  // Real Stage B sim 3 patterns: animal habitat (formal name), liquid:container,
  // tool:domain (watch:time), and work:part (book:chapters, song:stanzas).

  {
    skill: 'animal_habitat',
    label: 'בעל חיים ושם הבית שלו',
    pairs: [
      ['יוֹנָה', 'שׁוֹבָךְ'], ['פָּרָה', 'רֶפֶת'], ['סוּס', 'אֻרְוָה'],
      ['כֶּלֶב', 'מְלוּנָה'], ['עוֹף', 'לוּל'], ['דְּבוֹרָה', 'כַּוֶּרֶת'],
      ['נְמָלָה', 'קֵן'], ['צִפּוֹר', 'קֵן'], ['דָּג', 'אַקְוַרְיוּם'],
      ['אֲרִי', 'מְעָרָה'], ['שָׁפָן', 'מַחִלָּה'], ['אֲרִיָּה', 'גוּב'],
    ],
  },

  {
    skill: 'liquid_container',
    label: 'נוזל וכלי הקיבול הרגיל שלו',
    pairs: [
      ['מַיִם', 'כּוֹס'], ['חָלָב', 'בַּקְבּוּק'], ['יַיִן', 'גָּבִיעַ'],
      ['קָפֶה', 'סֵפֶל'], ['תֵּה', 'סֵפֶל'], ['מִיץ', 'קַרְטוֹן'],
      ['שֶׁמֶן', 'בַּקְבּוּק'], ['מָרָק', 'קְעָרָה'], ['דְּבַשׁ', 'צִנְצֶנֶת'],
      ['גְּלִידָה', 'גָּבִיעַ'], ['רֵיבָה', 'צִנְצֶנֶת'],
    ],
  },

  {
    skill: 'tool_domain',
    label: 'כלי מדידה והגודל שהוא מודד',
    pairs: [
      ['שָׁעוֹן', 'זְמַן'], ['סַרְגֵּל', 'אֹרֶךְ'], ['מֹאזְנַיִם', 'מִשְׁקָל'],
      ['מַדְחֹם', 'חֹם'], ['קִילוֹמֶטֶר', 'מֶרְחָק'], ['אַמַּת מַיִם', 'נֶפַח'],
      ['יוֹמָן', 'יָמִים'], ['מִקְרוֹסְקוֹפּ', 'גֹּדֶל זָעִיר'],
      ['טֶלֶסְקוֹפּ', 'מֶרְחָק רָחוֹק'], ['בָּרוֹמֶטֶר', 'לַחַץ אֲוִיר'],
    ],
  },

  {
    skill: 'work_part',
    label: 'יצירה והחלק שלה (חלק-שלם תוך יצירה)',
    pairs: [
      ['סֵפֶר', 'פֶּרֶק'], ['שִׁיר', 'בַּיִת'], ['סִפּוּר', 'פִּסְקָה'],
      ['פֶּסֶל', 'חֵלֶק'], ['סֵרֶט', 'תְּמוּנָה'], ['נְאוּם', 'מִשְׁפָּט'],
      ['סִדְרָה', 'פֶּרֶק'], ['סִמְפוֹנְיָה', 'תֵּבָה'], ['מַחֲזֶה', 'תְּמוּנָה'],
      ['מַנְגִּינָה', 'תָּו'], ['רוֹמָן', 'פֶּרֶק'], ['פֹּעַל', 'מִשְׁפָּט'],
    ],
  },
];

// ── Generator logic ─────────────────────────────────────────────────────

/** Build a "plausible-looking but wrong" distractor by reversing the pair order
 *  (e.g. "father:son" ↔ "son:father") — same words, opposite direction.
 *  This is the single most common trap on the real Stage B exam. */
function reversedPairDistractor(bank: RelationBank, stemPair: Pair): Pair | null {
  const candidates = bank.pairs.filter(
    p => !(p[0] === stemPair[0] && p[1] === stemPair[1])
  );
  if (candidates.length === 0) return null;
  const p = pick(candidates);
  return [p[1], p[0]];
}

function generateOneRelation(
  skill: WordRelationSkill,
  difficulty: Difficulty,
  recentStems?: Set<string>,
): Question | null {
  // Pick a SUB-bank that matches the skill — there may be more than one
  // (verbal_analogy now has 4 sub-banks). The chosen sub-bank defines BOTH
  // stem and correct answer, so they always share the precise relation.
  const matchingBanks = banks.filter(b => b.skill === skill);
  if (matchingBanks.length === 0) return null;
  const bank = pick(matchingBanks);
  if (bank.pairs.length < 4) return null;

  // Shuffle pairs and pick stem + correct option from same sub-bank
  const shuffledPairs = shuffle(bank.pairs);
  let stemPair = shuffledPairs[0];
  // Avoid stems we just showed
  if (recentStems && recentStems.size > 0) {
    const fresh = shuffledPairs.find(p => !recentStems.has(`${p[0]}:${p[1]}`));
    if (fresh) stemPair = fresh;
  }
  const correctPair = shuffledPairs.find(p => p !== stemPair) ?? shuffledPairs[1];

  // Distractor strategy:
  //   • slot 1: a REVERSED pair from the same bank — same words, wrong direction.
  //     This is the canonical Stage B trap (kid sees the right relation but
  //     in the wrong order).
  //   • slots 2–3: pairs from OTHER banks (clearly different relation) so the
  //     question stays solvable for a 7-year-old who's grasped the concept.
  const distractorPairs: Pair[] = [];
  const reversed = reversedPairDistractor(bank, stemPair);
  if (reversed) distractorPairs.push(reversed);

  const otherBanks = banks.filter(b => b.skill !== skill);
  for (const ob of shuffle(otherBanks)) {
    if (distractorPairs.length >= 3) break;
    distractorPairs.push(pick(ob.pairs));
  }
  while (distractorPairs.length < 3) {
    distractorPairs.push(pick(pick(otherBanks).pairs));
  }

  const fmtPair = (p: Pair) => `${p[0]} : ${p[1]}`;
  const allOptions = shuffle([
    fmtPair(correctPair),
    ...distractorPairs.slice(0, 3).map(fmtPair),
  ]);

  const effectiveDiff = difficulty === 'adaptive' ? pick(['easy', 'medium', 'hard'] as Difficulty[]) : difficulty;

  if (recentStems) recentStems.add(`${stemPair[0]}:${stemPair[1]}`);

  return {
    id: uid(),
    sectionType: 'word_relations',
    skillTag: skill,
    difficulty: effectiveDiff,
    questionType: 'text',
    stem: fmtPair(stemPair),
    options: allOptions,
    correctOption: allOptions.indexOf(fmtPair(correctPair)),
    explanation: `הקשר: ${bank.label}.\n${stemPair[0]} ⟵⟶ ${stemPair[1]}.\nאותו קשר ובאותו כיוון: ${correctPair[0]} ⟵⟶ ${correctPair[1]}.\nשים לב: זוג שהמילים בו בכיוון ההפוך — אינו אותו קשר!`,
    recommendedTimeSec: effectiveDiff === 'easy' ? 40 : effectiveDiff === 'hard' ? 60 : 50,
    generatorSource: 'generated',
    qualityScore: 89,
    isActive: true,
  };
}

// ── Public API ──────────────────────────────────────────────────────────

export function generateWordRelQuestions(
  difficulty: Difficulty,
  count: number,
  options?: { skill?: WordRelationSkill },
): Question[] {
  const result: Question[] = [];
  const recentStems = new Set<string>();
  const uniqueSkills = Array.from(new Set(banks.map(b => b.skill)));
  const skills = options?.skill ? [options.skill] : uniqueSkills;

  // Distribute evenly across skills
  const perSkill = Math.max(1, Math.floor(count / skills.length));
  const pool: WordRelationSkill[] = [];

  for (const skill of skills) {
    for (let i = 0; i < perSkill; i++) pool.push(skill);
  }
  while (pool.length < count) pool.push(pick(skills));

  for (const skill of shuffle(pool).slice(0, count)) {
    const q = generateOneRelation(skill, difficulty, recentStems);
    if (q) result.push(q);
  }

  return result;
}
