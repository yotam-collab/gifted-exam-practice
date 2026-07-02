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
  /** Bridge-sentence template (משפט-גשר): turns a pair into an explicit
   *  sentence a 2nd-grader can test answers against. Placeholders {a}/{b}. */
  bridge: string;
  /** Short relation name used when naming a trap's REAL relation. */
  relShort: string;
  /** Minimum difficulty this bank surfaces at. Undefined = all difficulties.
   *  Used for relations that need more abstraction (units, generations). */
  minDiff?: 'medium' | 'hard';
  pairs: Pair[];
}

const DIFF_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
const bankAllowedAt = (bank: RelationBank, diff: Difficulty): boolean =>
  !bank.minDiff || (DIFF_RANK[diff] ?? 1) >= DIFF_RANK[bank.minDiff];

// ── Relation banks ──────────────────────────────────────────────────────

const banks: RelationBank[] = [
  {
    skill: 'synonyms_antonyms',
    label: 'מילים נרדפות או הפכים',
    bridge: '{a} הוא בדיוק ההפך מ{b}',
    relShort: 'הפכים',
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
    bridge: '{a} הוא חלק מ{b}',
    relShort: 'חלק מתוך שלם',
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
    bridge: 'עם {a} אפשר {b}',
    relShort: 'כלי והפעולה שעושים איתו',
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
    bridge: 'מ{a} מכינים {b}',
    relShort: 'חומר והמוצר שמכינים ממנו',
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
    bridge: '{a} הוא סוג של {b}',
    relShort: 'פריט והקבוצה שלו',
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
    bridge: 'בגלל {a} יש {b}',
    relShort: 'סיבה ותוצאה',
    pairs: [
      ['אֵשׁ', 'עָשָׁן'], ['גֶּשֶׁם', 'שְׁלוּלִית'], ['שֶׁמֶשׁ', 'צֵל'],
      ['קֹר', 'רְעִידָה'], ['חֹם', 'זֵעָה'], ['רַעַשׁ', 'הֵד'],
      ['לִמּוּד', 'יֶדַע'], ['אִמּוּן', 'כֹּשֶׁר'], ['שִׂמְחָה', 'חִיּוּךְ'],
      ['עֲצַבְנוּת', 'כַּעַס'], ['בְּדִידוּת', 'עֶצֶב'], ['הַצְלָחָה', 'גַּאֲוָה'],
      // NOTE: עייפות–שינה וצמא–שתייה live in disease_cure (a cluster sibling)
      // — keeping them here too would make cross-cluster distractors valid.
      ['רָעָב', 'אֲכִילָה'],
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
    bridge: '{a} עובד ב{b}',
    relShort: 'בעל מקצוע ומקום העבודה שלו',
    pairs: [
      ['מוֹרֶה', 'בֵּית סֵפֶר'], ['רוֹפֵא', 'בֵּית חוֹלִים'], ['שֵׁף', 'מִסְעָדָה'],
      ['טַיָּס', 'מָטוֹס'], ['סַפָּר', 'מִסְפָּרָה'], ['חַקְלַאי', 'שָׂדֶה'],
      ['שׁוֹפֵט', 'בֵּית מִשְׁפָּט'], ['שָׂחְקָן', 'בָּמָה'], ['פַּסְיוֹן', 'גַּן יְלָדִים'],
    ],
  },
  // NOTE: the former "בעל חיים וצאצא" verbal_analogy sub-bank was removed —
  // it duplicated animal_baby pair-for-pair with the same bridge, so its pairs
  // could appear as VALID distractors for animal_baby stems (and vice versa).
  // animal_baby fully covers that relation.
  {
    skill: 'verbal_analogy',
    label: 'אנלוגיה: בעל חיים ומקום מחיה',
    bridge: '{a} גר ב{b}',
    relShort: 'בעל חיים והמקום שבו הוא גר',
    pairs: [
      // דבורה–כוורת וצפור–קן moved out: they already live in animal_habitat.
      ['דָּג', 'מַיִם'], ['דֹּב', 'מְעָרָה'],
      ['נְמָלָה', 'קֵן נְמָלִים'], ['חַפַרְפֶּרֶת', 'מַחִלָּה'],
      ['גָּמָל', 'מִדְבָּר'], ['דֻּבּוֹן', 'יַעַר'],
    ],
  },
  {
    skill: 'verbal_analogy',
    label: 'אנלוגיה: מדינה ובירה',
    bridge: '{b} היא עיר הבירה של {a}',
    relShort: 'מדינה ועיר הבירה שלה',
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
    bridge: '{a} זה בדיוק כמו {b} — אותה משמעות במילה אחרת',
    relShort: 'מילים נרדפות',
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
    bridge: 'בשביל {a} צריך {b}',
    relShort: 'פעולה והחפץ שצריך בשבילה',
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
    bridge: 'נגד {a} עוזר {b}',
    relShort: 'בעיה והפתרון שלה',
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
    bridge: 'התינוק של {a} נקרא {b}',
    relShort: 'בעל חיים והתינוק שלו',
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
    bridge: '{a} מפורסם ב{b} שלו',
    relShort: 'בעל חיים והתכונה המפורסמת שלו',
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
    bridge: 'הבית של {a} נקרא {b}',
    relShort: 'בעל חיים ושם הבית שלו',
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
    bridge: 'שמים {a} בתוך {b}',
    relShort: 'נוזל והכלי שמחזיק אותו',
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
    bridge: 'עם {a} מודדים {b}',
    relShort: 'כלי מדידה ומה שהוא מודד',
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
    bridge: '{b} הוא חלק מ{a}',
    relShort: 'יצירה והחלק שבתוכה',
    pairs: [
      ['סֵפֶר', 'פֶּרֶק'], ['שִׁיר', 'בַּיִת'], ['סִפּוּר', 'פִּסְקָה'],
      ['פֶּסֶל', 'חֵלֶק'], ['סֵרֶט', 'תְּמוּנָה'], ['נְאוּם', 'מִשְׁפָּט'],
      ['סִדְרָה', 'פֶּרֶק'], ['סִמְפוֹנְיָה', 'תֵּבָה'], ['מַחֲזֶה', 'תְּמוּנָה'],
      ['מַנְגִּינָה', 'תָּו'], ['רוֹמָן', 'פֶּרֶק'], ['פֹּעַל', 'מִשְׁפָּט'],
    ],
  },

  {
    skill: 'intensity',
    label: 'דרגות עוצמה: אותה תופעה, מהחלש אל החזק',
    bridge: '{b} הוא כמו {a}, רק הרבה יותר חזק',
    relShort: 'אותו דבר — מהחלש אל החזק',
    pairs: [
      // NOTE: גבעה–הר ושלולית–אגם moved to size_same_kind (they are objects,
      // not degrees of the same phenomenon) so no pair lives in two banks.
      ['טִפְטוּף', 'מַבּוּל'], ['מַשָּׁב', 'סְעָרָה'], ['לְחִישָׁה', 'צְעָקָה'],
      ['חִיּוּךְ', 'צְחוֹק'], ['הֲלִיכָה', 'רִיצָה'],
      ['חֲשָׁשׁ', 'אֵימָה'], ['טְעִימָה', 'זְלִילָה'],
      ['עֲיֵפוּת', 'תְּשִׁישׁוּת'], ['נִצְנוּץ', 'זֹהַר'], ['רוּחַ', 'סוּפָה'],
    ],
  },

  // ── Batch 3: relation types still missing after the Stage B audit ────
  // Every pair below is original (invented for this project, never copied).
  // Bridges are phrased gender-neutrally (plural "we" forms / nominal
  // sentences) so they read naturally for every pair in the bank.

  {
    skill: 'unit_of_measure',
    label: 'יחידת מידה גדולה והיחידה הקטנה שבתוכה',
    // Neutral phrasing: "אוספים X ועוד X" sidesteps gender agreement
    // (שעה מורכבת / מטר מורכב) and works for every unit pair.
    bridge: 'אוספים {b} ועוד {b} — עד שיש {a}',
    relShort: 'יחידה גדולה והיחידה הקטנה שבתוכה',
    minDiff: 'medium',
    pairs: [
      ['מֶטֶר', 'סֶנְטִימֶטֶר'], ['קִילוֹמֶטֶר', 'מֶטֶר'], ['קִילוֹגְרָם', 'גְּרָם'],
      ['לִיטֶר', 'מִילִילִיטֶר'], ['שָׁעָה', 'דַּקָּה'], ['דַּקָּה', 'שְׁנִיָּה'],
      ['שָׁבוּעַ', 'יוֹם'], ['חֹדֶשׁ', 'שָׁבוּעַ'], ['שָׁנָה', 'חֹדֶשׁ'],
      ['שֶׁקֶל', 'אֲגוֹרָה'],
    ],
  },

  {
    skill: 'size_same_kind',
    label: 'גרסה קטנה וגרסה גדולה של אותו הדבר',
    // Nominal sentence — no verb, so no gender agreement to break.
    bridge: '{a} — בדיוק כמו {b}, רק בקטן',
    relShort: 'אותו סוג של דבר — הקטן מול הגדול',
    minDiff: 'medium',
    pairs: [
      ['גִּבְעָה', 'הַר'], ['שְׁלוּלִית', 'אֲגַם'], ['שְׁבִיל', 'כְּבִישׁ'],
      ['סִירָה', 'אֳנִיָּה'], ['נַחַל', 'נָהָר'], ['כְּפָר', 'עִיר'],
      ['חֶדֶר', 'אוּלָם'], ['שַׂקִּית', 'שַׂק'], ['סִמְטָה', 'רְחוֹב'],
      ['בַּיִת', 'אַרְמוֹן'],
    ],
  },

  {
    skill: 'emitter_emission',
    label: 'דבר ומה שיוצא ממנו',
    // All second words are masculine, so "מגיע" agrees everywhere.
    bridge: 'מ{a} מגיע {b}',
    relShort: 'דבר ומה שהוא מפיץ',
    pairs: [
      ['מְנוֹרָה', 'אוֹר'], ['פָּנָס', 'אוֹר'], ['רַמְקוֹל', 'צְלִיל'],
      ['רַדְיוֹ', 'קוֹל'], ['תַּנּוּר', 'חֹם'], ['מַזְגָן', 'קֹר'],
      ['פֶּרַח', 'רֵיחַ'], ['בֹּשֶׂם', 'רֵיחַ'], ['פַּעֲמוֹן', 'צִלְצוּל'],
      ['כּוֹכָב', 'נִצְנוּץ'],
    ],
  },

  {
    skill: 'protection_threat',
    label: 'דבר שמגן ומפני מה הוא מגן',
    // "מוגנים" (plural we) keeps the sentence gender-neutral for every item.
    bridge: 'עם {a} מוגנים מפני {b}',
    relShort: 'דבר שמגן ומפני מה הוא מגן',
    pairs: [
      ['מִטְרִיָּה', 'גֶּשֶׁם'], ['קַסְדָּה', 'מַכָּה'], ['כְּפָפוֹת', 'קֹר'],
      ['קְרֶם הֲגַנָּה', 'שֶׁמֶשׁ'], ['כּוֹבַע', 'שֶׁמֶשׁ'], ['מָגֵן', 'חֵץ'],
      ['שִׁרְיוֹן', 'חֶרֶב'], ['חוֹמָה', 'אוֹיֵב'], ['אַטְמֵי אָזְנַיִם', 'רַעַשׁ'],
    ],
  },

  {
    skill: 'care_product_target',
    label: 'חפץ טיפוח ומה שמטפלים בו',
    bridge: 'עם {a} מטפלים ב{b}',
    relShort: 'חפץ טיפוח ומה שמטפלים בו',
    pairs: [
      ['מִבְרֶשֶׁת שִׁנַּיִם', 'שִׁנַּיִם'], ['מִשְׁחַת שִׁנַּיִם', 'שִׁנַּיִם'],
      ['מַסְרֵק', 'שֵׂעָר'], ['שַׁמְפּוֹ', 'שֵׂעָר'], ['סַבּוֹן', 'יָדַיִם'],
      ['קְרֶם', 'עוֹר'], ['פְּלַסְטֶר', 'פֶּצַע'], ['מִשְׁחָה', 'פֶּצַע'],
    ],
  },

  {
    skill: 'profession_tool',
    label: 'בעל מקצוע והכלי המיוחד שלו',
    // "הכלי של X הוא Y" — copula agrees with הכלי, so profession gender
    // never breaks the sentence (רופאה/רופא both read fine).
    bridge: 'הכלי המיוחד של {a} הוא {b}',
    relShort: 'בעל מקצוע והכלי המיוחד שלו',
    pairs: [
      ['נַגָּר', 'מַסּוֹר'], ['צַיָּר', 'מִכְחוֹל'], ['גַּנָּן', 'מַגְרֵפָה'],
      ['רוֹפֵא', 'סְטֵטוֹסְקוֹפּ'], ['טַבָּח', 'סִיר'], ['סַפָּר', 'מִסְפָּרַיִם'],
      ['צַלָּם', 'מַצְלֵמָה'], ['חַיָּט', 'מַחַט'], ['דַּיָּג', 'חַכָּה'],
      ['מְנַצֵּחַ', 'שַׁרְבִיט'],
    ],
  },

  // Generation steps run child→parent ("האמא של אמא היא סבתא") ON PURPOSE:
  // in the parent→child direction an animal_baby pair like פרה–עגל would
  // ALSO satisfy the bridge ("פרה היא האמא של עגל") and create ambiguous
  // options. Child→parent keeps the family relation unambiguous.
  // Split into בנות/בנים sub-banks so היא/הוא always agrees.
  {
    skill: 'generation',
    label: 'דורות במשפחה (בנות)',
    bridge: 'האמא של {a} היא {b}',
    relShort: 'דור במשפחה — מי האמא של מי',
    minDiff: 'medium',
    pairs: [
      ['יַלְדָּה', 'אִמָּא'], ['תִּינֹקֶת', 'אִמָּא'], ['אִמָּא', 'סָבְתָא'],
      ['סָבְתָא', 'סָבְתָא רַבְּתָא'], ['נְסִיכָה', 'מַלְכָּה'],
    ],
  },
  {
    skill: 'generation',
    label: 'דורות במשפחה (בנים)',
    bridge: 'האבא של {a} הוא {b}',
    relShort: 'דור במשפחה — מי האבא של מי',
    minDiff: 'medium',
    pairs: [
      ['יֶלֶד', 'אַבָּא'], ['תִּינוֹק', 'אַבָּא'], ['אַבָּא', 'סַבָּא'],
      ['סַבָּא', 'סַבָּא רַבָּא'], ['נָסִיךְ', 'מֶלֶךְ'],
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

// Confusable clusters: relation types that FEEL similar to a 7-year-old.
// At medium/hard, distractors are drawn from the same cluster as the stem's
// relation — so eliminating them requires understanding the PRECISE relation,
// not just "this pair feels unrelated". This is what separates exam-level
// items from warm-ups.
const CONFUSABLE_CLUSTERS: WordRelationSkill[][] = [
  ['tool_use', 'action_object', 'tool_domain', 'material_product',
    'care_product_target', 'profession_tool', 'emitter_emission'],
  ['part_whole', 'work_part', 'category_item', 'liquid_container'],
  // Units and size-pairs run in the OPPOSITE direction from part-whole
  // (big→small vs part→whole), so cross-cluster distractors become pure
  // direction traps — never valid answers. unit_of_measure is deliberately
  // NOT clustered with work_part: "חודש הוא חלק משנה" would read as a
  // valid work_part sentence and make the item ambiguous.
  ['part_whole', 'unit_of_measure', 'size_same_kind'],
  // intensity pairs feel like synonyms ("both mean rain") — the kid must spot
  // that the relation is weak→strong of the SAME thing, not sameness.
  // size_same_kind is NOT here: "לחישה — כמו צעקה, רק בקטן" reads valid,
  // so intensity pairs would be arguable answers for size stems.
  ['synonyms', 'synonyms_antonyms', 'intensity'],
  // generation is safe here because its pairs run child→parent — an
  // animal_baby pair never satisfies "האמא של {a} היא {b}" in that order.
  ['animal_baby', 'animal_habitat', 'animal_trait', 'generation'],
  // protection is the mirror of problem-solution (item→threat vs
  // problem→item), so cross distractors are direction traps, not answers.
  ['cause_effect', 'disease_cure', 'protection_threat'],
  ['verbal_analogy', 'category_item', 'animal_habitat'],
];

function clusterSiblings(skill: WordRelationSkill): WordRelationSkill[] {
  const out = new Set<WordRelationSkill>();
  for (const cluster of CONFUSABLE_CLUSTERS) {
    if (cluster.includes(skill)) {
      for (const s of cluster) if (s !== skill) out.add(s);
    }
  }
  return [...out];
}

// ── Explanation builder (house style: bridge-sentence method) ───────────

function fillBridge(tpl: string, p: Pair): string {
  return tpl.replace(/\{a\}/g, p[0]).replace(/\{b\}/g, p[1]);
}

/** The tempting distractor the generator deliberately built, threaded to the
 *  explanation so המלכודת names the ACTUAL pair on screen. */
interface TrapInfo {
  /** Cluster-sibling pair — feels related, but its real relation differs. */
  sibling: { pair: Pair; bank: RelationBank } | null;
  /** Reversed-direction pair — right relation, wrong order. */
  reversed: Pair | null;
}

function buildExplanation(
  bank: RelationBank,
  stemPair: Pair,
  correctPair: Pair,
  trap: TrapInfo,
): string {
  const lines: string[] = [
    '🔍 השיטה: הופכים את הזוג למשפט — ורק אז בודקים את התשובות.',
    `המשפט שלנו: "${fillBridge(bank.bridge, stemPair)}".`,
    `נציב את התשובה: "${fillBridge(bank.bridge, correctPair)}" — מתאים בדיוק!`,
  ];
  // Symmetric relations (synonyms/opposites): the reversed sentence still
  // reads fine, so we teach the same-order convention instead of claiming
  // the sentence "doesn't work".
  const symmetric = bank.skill === 'synonyms' || bank.skill === 'synonyms_antonyms';
  if (trap.sibling) {
    const { pair, bank: sibBank } = trap.sibling;
    lines.push(
      `⚠️ המלכודת: הזוג ${pair[0]}–${pair[1]} גם מרגיש קשור, אבל הקשר שם הוא ${sibBank.relShort} — לא אותו קשר כמו שלנו.`,
    );
  } else if (trap.reversed) {
    lines.push(
      symmetric
        ? `⚠️ המלכודת: כיוון הפוך! בזוג ${trap.reversed[0]}–${trap.reversed[1]} המילים דומות, אבל הסדר הפוך מהזוג שלנו — ובשאלות כאלה בוחרים זוג שכתוב באותו סדר בדיוק.`
        : `⚠️ המלכודת: כיוון הפוך! בזוג ${trap.reversed[0]}–${trap.reversed[1]} המילים מתאימות אבל הסדר הפוך. נציב: "${fillBridge(bank.bridge, trap.reversed)}" — לא מסתדר.`,
    );
  }
  // When BOTH traps were built (medium/hard), המלכודת goes to the sibling
  // (the harder rejection) and the direction trap gets a short שימו-לב line.
  if (trap.sibling && trap.reversed) {
    lines.push(
      symmetric
        ? `שימו לב: יש גם זוג בכיוון הפוך (${trap.reversed[0]}–${trap.reversed[1]}) — שומרים תמיד על אותו סדר כמו בזוג שלנו!`
        : `שימו לב: יש גם זוג בכיוון הפוך (${trap.reversed[0]}–${trap.reversed[1]}) — במשפט יוצא "${fillBridge(bank.bridge, trap.reversed)}", והסדר חשוב!`,
    );
  }
  lines.push(`לכן התשובה: ${correctPair[0]} : ${correctPair[1]} ✔`);
  return lines.join('\n');
}

function generateOneRelation(
  skill: WordRelationSkill,
  difficulty: Difficulty,
  recentStems?: Set<string>,
): Question | null {
  // Difficulty first — bank eligibility and distractor strategy depend on it.
  // Adaptive (default practice) stretches toward exam level: no pure-easy.
  const effectiveDiff = difficulty === 'adaptive' ? pick(['medium', 'medium', 'hard', 'hard'] as Difficulty[]) : difficulty;

  // Pick a SUB-bank that matches the skill — there may be more than one
  // (verbal_analogy has 4 sub-banks, generation has 2). The chosen sub-bank
  // defines BOTH stem and correct answer, so they always share the precise
  // relation. Banks gated by minDiff only surface at medium/hard — unless the
  // caller explicitly requested this skill and no ungated bank exists.
  const matchingBanks = banks.filter(b => b.skill === skill);
  if (matchingBanks.length === 0) return null;
  const eligibleBanks = matchingBanks.filter(b => bankAllowedAt(b, effectiveDiff));
  const bank = pick(eligibleBanks.length > 0 ? eligibleBanks : matchingBanks);
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
  //   • slots 2–3, by difficulty:
  //       easy   → pairs from clearly-different banks (solvable by concept).
  //       medium → one cluster-sibling pair (confusable relation) + one far bank.
  //       hard   → both from cluster-sibling banks. The kid must articulate the
  //                exact relation to reject "close but different" pairs.
  const distractorPairs: Pair[] = [];
  const usedKeys = new Set<string>([
    `${stemPair[0]}:${stemPair[1]}`,
    `${correctPair[0]}:${correctPair[1]}`,
  ]);
  const tryPush = (p: Pair): boolean => {
    const key = `${p[0]}:${p[1]}`;
    if (usedKeys.has(key)) return false;
    usedKeys.add(key);
    distractorPairs.push(p);
    return true;
  };

  // Track WHICH deliberate traps actually landed in the options, so the
  // explanation can call them out by name (bridge-sentence המלכודת lines).
  const trap: TrapInfo = { sibling: null, reversed: null };

  const reversed = reversedPairDistractor(bank, stemPair);
  if (reversed && tryPush(reversed)) trap.reversed = reversed;

  const siblings = clusterSiblings(skill);
  const siblingBanks = shuffle(banks.filter(b => siblings.includes(b.skill)));
  const farBanks = shuffle(banks.filter(b => b.skill !== skill && !siblings.includes(b.skill)));

  const wantedSiblingCount =
    effectiveDiff === 'hard' ? 2 : effectiveDiff === 'medium' ? 1 : 0;
  for (const sb of siblingBanks) {
    if (distractorPairs.length >= 1 + wantedSiblingCount) break;
    const sibPair = pick(sb.pairs);
    if (tryPush(sibPair) && !trap.sibling) {
      trap.sibling = { pair: sibPair, bank: sb };
    }
  }
  for (const fb of farBanks) {
    if (distractorPairs.length >= 3) break;
    tryPush(pick(fb.pairs));
  }
  // Safety net: top up from any non-stem bank if clusters/far pools ran short.
  const anyOther = banks.filter(b => b.skill !== skill);
  let guard = 0;
  while (distractorPairs.length < 3 && anyOther.length > 0 && guard++ < 40) {
    tryPush(pick(pick(anyOther).pairs));
  }

  const fmtPair = (p: Pair) => `${p[0]} : ${p[1]}`;
  const allOptions = shuffle([
    fmtPair(correctPair),
    ...distractorPairs.slice(0, 3).map(fmtPair),
  ]);

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
    explanation: buildExplanation(bank, stemPair, correctPair, trap),
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
  // At easy, skip skills whose banks are all gated to medium/hard
  // (adaptive resolves to medium/hard per question, so it sees every bank).
  const uniqueSkills = Array.from(new Set(
    banks
      .filter(b => difficulty !== 'easy' || bankAllowedAt(b, 'easy'))
      .map(b => b.skill),
  ));
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
