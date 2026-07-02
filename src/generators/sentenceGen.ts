/**
 * Sentence completion generator — large bank of Hebrew sentence templates
 * with fill-in-the-blank pairs. Randomizes template selection and option order.
 */
import type { Question, Difficulty, SentenceSkill } from '../types';

let _c = 0;
const uid = () => `gs_${Date.now()}_${++_c}_${Math.random().toString(36).slice(2, 6)}`;
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ── Template structure ──────────────────────────────────────────────────

interface SentenceTemplate {
  skill: SentenceSkill;
  difficulty: Difficulty;
  stem: string;
  correct: string;     // correct fill (word or pair)
  wrongs: string[];    // 3+ wrong options
  explanation: string;
}

// ── Template banks ──────────────────────────────────────────────────────
// Each template has a stem with ______ blanks, one correct fill, and 3+ distractors.

const templates: SentenceTemplate[] = [
  // ═══════════════ LOGICAL CONNECTION ═══════════════
  {
    skill: 'logical_connection', difficulty: 'easy',
    stem: 'הַיֶּלֶד ______ מְאוֹד לִקְרַאת יוֹם הַהֻלֶּדֶת שֶׁלּוֹ, כִּי הוּא ______ לְקַבֵּל מַתָּנוֹת.',
    correct: 'הִתְרַגֵּשׁ, צִפָּה', wrongs: ['בָּכָה, פָּחַד', 'כָּעַס, שָׁכַח', 'נִרְדַּם, רָצָה'],
    explanation: 'יום הולדת הוא אירוע שמח — הילד התרגש וציפה למתנות.',
  },
  {
    skill: 'logical_connection', difficulty: 'easy',
    stem: 'הַכֶּלֶב ______ בְּשִׂמְחָה כְּשֶׁבַּעֲלָיו ______ הַבַּיְתָה.',
    correct: 'קָפַץ, חָזַר', wrongs: ['בָּרַח, יָצָא', 'נָבַח, עָזַב', 'יָשַׁן, הָלַךְ'],
    explanation: 'כלבים שמחים כשבעליהם חוזרים — לכן הכלב קפץ בשמחה.',
  },
  {
    skill: 'logical_connection', difficulty: 'easy',
    stem: 'הַתִּינוֹק ______ כָּל הַלַּיְלָה, כִּי הַשֵּׁן הָרִאשׁוֹנָה שֶׁלּוֹ ______.',
    correct: 'בָּכָה, צָמְחָה', wrongs: ['צָחַק, נָפְלָה', 'יָשַׁן, הוֹפִיעָה', 'שִׂחֵק, כָּאֲבָה'],
    explanation: 'צמיחת שן גורמת כאב — התינוק בכה בגלל השן שצמחה.',
  },
  {
    skill: 'logical_connection', difficulty: 'medium',
    stem: 'הַסּוֹפֵר ______ אֶת הַסִּפּוּר בִּמְהִירוּת, כִּי הָיָה לוֹ ______ רַב לִכְתֹּב אוֹתוֹ.',
    correct: 'סִיֵּם, מוֹטִיבַצְיָה', wrongs: ['הִתְחִיל, קֹשִׁי', 'מָחַק, זְמַן', 'קָרָא, עֲצַלְנוּת'],
    explanation: 'מוטיבציה רבה גורמת לעבוד מהר — הסופר סיים במהירות.',
  },
  {
    skill: 'logical_connection', difficulty: 'medium',
    stem: 'הַמּוֹרָה ______ אֶת הַתַּלְמִידִים עַל הַהִתְנַהֲגוּת הַטּוֹבָה, וּלְכֵן הֵם הִרְגִּישׁוּ ______ מְאוֹד.',
    correct: 'שִׁבְּחָה, גֵּאִים', wrongs: ['הֶעֱנִישָׁה, גֵּאִים', 'שִׁבְּחָה, מְבוּיָשִׁים', 'נָזְפָה, שְׂמֵחִים'],
    explanation: 'שבח על התנהגות טובה → תחושת גאווה.',
  },
  {
    skill: 'logical_connection', difficulty: 'medium',
    stem: 'כְּשֶׁהָעֲנָנִים ______ אֶת הַשָּׁמַיִם, הַיְלָדִים ______ לַבַּיִת, כִּי ______ שֶׁיֵּרֵד גֶּשֶׁם.',
    correct: 'כִּסּוּ, רָצוּ, חָשְׁשׁוּ', wrongs: ['עָזְבוּ, רָצוּ, רָצוּ', 'כִּסּוּ, שִׂחֲקוּ, שָׂמְחוּ', 'פִּנּוּ, יָשְׁבוּ, קִוּוּ'],
    explanation: 'עננים מכסים את השמיים → חשש מגשם → רצו הביתה.',
  },
  {
    skill: 'logical_connection', difficulty: 'hard',
    stem: 'הַמַּדְעָן ______ שָׁנִים רַבּוֹת, וּלְבַסּוֹף ______ תְּגָלִית חֲשׁוּבָה שֶׁ______ אֶת עוֹלַם הַמַּדָּע.',
    correct: 'חָקַר, גִּלָּה, שִׁנְּתָה', wrongs: ['לָמַד, שָׁכַח, הֶחֱרִיבָה', 'חָקַר, הֶחְבִּיא, עָזְרָה', 'עָבַד, אִבֵּד, פָּגְעָה'],
    explanation: 'מדען חוקר שנים ומגלה תגלית שמשנה את המדע — הגיון סיפורי.',
  },
  {
    skill: 'logical_connection', difficulty: 'easy',
    stem: 'הַגַּנֶּנֶת ______ לַיְלָדִים סִפּוּר, וְהֵם ______ בְּרֹב קֶשֶׁב.',
    correct: 'סִפְּרָה, הִקְשִׁיבוּ', wrongs: ['שָׁרָה, רָקְדוּ', 'צִיְּרָה, יָשְׁנוּ', 'קָרְאָה, דִּבְּרוּ'],
    explanation: 'כשמספרים סיפור — מקשיבים. זה הקשר ההגיוני.',
  },
  {
    skill: 'logical_connection', difficulty: 'medium',
    stem: 'הָאָמָּן ______ בְּסַבְלָנוּת עַד שֶׁהַתְּמוּנָה ______ בְּדִיּוּק כְּמוֹ שֶׁדִּמְיֵן.',
    correct: 'צִיֵּר, נִרְאֲתָה', wrongs: ['מָחַק, נֶעֶלְמָה', 'קָרַע, הִשְׁתַּנְּתָה', 'צִיֵּר, נִשְׁבְּרָה'],
    explanation: 'אמן מצייר בסבלנות עד שהתמונה נראית כמו שדמיין.',
  },
  {
    skill: 'logical_connection', difficulty: 'hard',
    stem: 'הַסְּפִינָה ______ בַּסְּעָרָה, אַךְ הַקַּפְּטָן ______ וְהִצְלִיחַ ______ אוֹתָהּ לְנָמָל בְּשָׁלוֹם.',
    correct: 'הִתְנַדְנְדָה, לֹא נִבְהַל, לְנַוֵּט', wrongs: ['טָבְעָה, פָּחַד, לְהַטְבִּיעַ', 'הִתְנַדְנְדָה, נִרְדַּם, לְתַקֵּן', 'עָצְרָה, צָעַק, לְמַהֵר'],
    explanation: 'הספינה התנדנדה (סערה), הקפטן לא נבהל (אומץ), ניווט לנמל (הצלחה).',
  },

  // ═══════════════ SEMANTIC CONTEXT ═══════════════
  {
    skill: 'semantic_context', difficulty: 'easy',
    stem: 'הָרוֹפֵא ______ אֶת הַחוֹלֶה וְנָתַן לוֹ ______ כְּדֵי שֶׁיַּרְגִּישׁ יוֹתֵר טוֹב.',
    correct: 'בָּדַק, תְּרוּפָה', wrongs: ['בָּדַק, עוּגָה', 'הִלְבִּישׁ, תְּרוּפָה', 'לִימֵּד, מַתָּנָה'],
    explanation: 'רופא בודק חולים ונותן תרופה — פעולות מקצועיות של רופא.',
  },
  {
    skill: 'semantic_context', difficulty: 'easy',
    stem: 'הַכַּבָּאִי ______ אֶת הַשְּׂרֵפָה בְּעֶזְרַת ______ חָזָק.',
    correct: 'כִּבָּה, זֶרֶם מַיִם', wrongs: ['הִצִּית, אֵשׁ', 'כִּבָּה, רוּחַ', 'בָּנָה, חוֹל'],
    explanation: 'כבאי מכבה שרפה עם זרם מים — זו הפעולה המקצועית.',
  },
  {
    skill: 'semantic_context', difficulty: 'medium',
    stem: 'הַטַּבָּח הוֹסִיף ______ לַתַּבְשִׁיל כְּדֵי שֶׁיִּהְיֶה יוֹתֵר ______, כִּי הָאוֹרְחִים אוֹהֲבִים אֹכֶל עָשִׁיר בְּטַעַם.',
    correct: 'תַּבְלִינִים, טָעִים', wrongs: ['מַיִם, חַם', 'תַּבְלִינִים, קַר', 'סֻכָּר, מָלוּחַ'],
    explanation: 'תבלינים מוסיפים טעם — מתחבר ל"אוכל עשיר בטעם".',
  },
  {
    skill: 'semantic_context', difficulty: 'medium',
    stem: 'הַנַּגָּר ______ אֶת הָעֵץ בְּעֶזְרַת מַסּוֹר, וְאַחַר כָּךְ ______ אוֹתוֹ בִּנְיַר זְכוּכִית.',
    correct: 'חָתַךְ, לִטֵּשׁ', wrongs: ['צָבַע, חָתַךְ', 'חָתַךְ, שָׁבַר', 'מָדַד, צָבַע'],
    explanation: 'מסור → חתיכה. נייר זכוכית → ליטוש. סדר הגיוני.',
  },
  {
    skill: 'semantic_context', difficulty: 'medium',
    stem: 'הַחַקְלַאי ______ אֶת הַשָּׂדֶה וְאַחַר כָּךְ ______ זְרָעִים בָּאֲדָמָה.',
    correct: 'חָרַשׁ, שָׁתַל', wrongs: ['קָצַר, אָפָה', 'חָרַשׁ, בָּנָה', 'שָׁטַף, שָׁתַל'],
    explanation: 'חקלאי חורש שדה ואז שותל זרעים — סדר עבודה חקלאי.',
  },
  {
    skill: 'semantic_context', difficulty: 'hard',
    stem: 'הַצַּיָּד ______ בְּשֶׁקֶט בֵּין הָעֵצִים כְּדֵי לֹא ______ אֶת הַחַיּוֹת.',
    correct: 'הִתְגַּנֵּב, לְהַבְרִיחַ', wrongs: ['רָץ, לְהַבְרִיחַ', 'הִתְגַּנֵּב, לִמְשֹׁךְ', 'הָלַךְ, לְהַזְמִין'],
    explanation: '"בשקט" → התגנב. המטרה: לא להבריח = לא לגרום לבריחה.',
  },
  {
    skill: 'semantic_context', difficulty: 'easy',
    stem: 'הַשּׁוֹטֵר ______ אֶת הַתְּנוּעָה בַּצֹּמֶת, כְּדֵי שֶׁלֹּא תִּהְיֶה ______.',
    correct: 'הִסְדִּיר, תְּאוּנָה', wrongs: ['חָסַם, חֲגִיגָה', 'הִסְדִּיר, שִׂמְחָה', 'עָצַר, מוּזִיקָה'],
    explanation: 'שוטר מסדיר תנועה בצומת כדי למנוע תאונות.',
  },
  {
    skill: 'semantic_context', difficulty: 'hard',
    stem: 'הָאַסְטְרוֹנָאוּט ______ אֶת חֲלִיפַת הַחָלָל וְ______ לַיְּצִיאָה מֵהַחַלָּלִית.',
    correct: 'לָבַשׁ, הִתְכּוֹנֵן', wrongs: ['פָּשַׁט, נִרְדַּם', 'לָבַשׁ, סֵרֵב', 'קִפֵּל, חָזַר'],
    explanation: 'אסטרונאוט לובש חליפת חלל ומתכונן ליציאה — סדר פעולות הגיוני.',
  },

  // ═══════════════ CONTRAST COMPLETION ═══════════════
  {
    skill: 'contrast_completion', difficulty: 'easy',
    stem: 'לַמְרוֹת שֶׁהַמִּבְחָן הָיָה ______, דָּנָה הִצְלִיחָה לְסַיֵּם אוֹתוֹ ______, כִּי הִתְכּוֹנְנָה הֵיטֵב.',
    correct: 'קָשֶׁה, בְּקַלּוּת', wrongs: ['קַל, בְּקַלּוּת', 'קָשֶׁה, בְּקֹשִׁי', 'מְעַנְיֵן, בִּמְהִירוּת'],
    explanation: '"למרות" דורשת ניגוד: קשה ↔ בקלות.',
  },
  {
    skill: 'contrast_completion', difficulty: 'easy',
    stem: 'בַּזְּמַן שֶׁאָחִיו ______ מִגֹּבַהּ, נֹעַם דַּוְקָא ______ לְטַפֵּס עַל עֵצִים.',
    correct: 'פָּחַד, אָהַב', wrongs: ['פָּחַד, פָּחַד', 'נֶהֱנָה, שָׂנֵא', 'אָהַב, אָהַב'],
    explanation: '"דווקא" מסמן ניגוד: האח פחד, נועם אהב.',
  },
  {
    skill: 'contrast_completion', difficulty: 'medium',
    stem: 'הַגְּשָׁמִים הָיוּ ______, אַךְ הַיְּלָדִים ______ לְשַׂחֵק בַּחוּץ בְּכָל זֹאת.',
    correct: 'עֲזִים, הִמְשִׁיכוּ', wrongs: ['חֲלָשִׁים, הִפְסִיקוּ', 'עֲזִים, הִפְסִיקוּ', 'נְעִימִים, סֵרְבוּ'],
    explanation: '"אך" + "בכל זאת" = ניגוד. גשמים עזים אך המשיכו לשחק.',
  },
  {
    skill: 'contrast_completion', difficulty: 'medium',
    stem: 'אַף עַל פִּי שֶׁכֻּלָּם ______ שֶׁהַקְּבוּצָה תַּפְסִיד, הַשַּׂחְקָנִים ______ וְהִצְלִיחוּ לְנַצֵּחַ.',
    correct: 'חָשְׁבוּ, לֹא וִתְּרוּ', wrongs: ['קִוּוּ, הִפְסִידוּ', 'חָשְׁבוּ, וִתְּרוּ', 'רָצוּ, לֹא וִתְּרוּ'],
    explanation: '"אף על פי" = ניגוד. חשבו שתפסיד → אבל לא ויתרו → ניצחו.',
  },
  {
    skill: 'contrast_completion', difficulty: 'hard',
    stem: 'עַל אַף שֶׁהַדֶּרֶךְ הָיְתָה ______ וּמְסֻכֶּנֶת, הַמְּטַיְּלִים ______ וְהִגִּיעוּ לַפִּסְגָּה.',
    correct: 'אֲרֻכָּה, הִתְמִידוּ', wrongs: ['קְצָרָה, נֶהֶנוּ', 'אֲרֻכָּה, חָזְרוּ', 'קַלָּה, הִתְיַאֲשׁוּ'],
    explanation: '"על אף" = ניגוד. דרך ארוכה ומסוכנת אבל התמידו והגיעו.',
  },
  {
    skill: 'contrast_completion', difficulty: 'hard',
    stem: 'הַתַּרְגִּיל נִרְאָה ______ בַּהַתְחָלָה, אֲבָל כְּשֶׁהִתְעַמַּקְתִּי בּוֹ, גִּלִּיתִי שֶׁהוּא ______ מִמַּה שֶׁחָשַׁבְתִּי.',
    correct: 'פָּשׁוּט, מוּרְכָּב יוֹתֵר', wrongs: ['קָשֶׁה, קָשֶׁה יוֹתֵר', 'פָּשׁוּט, קַל יוֹתֵר', 'מְשַׁעֲמֵם, מְשַׁעֲמֵם יוֹתֵר'],
    explanation: '"אבל" = ניגוד. נראה פשוט → התגלה כמורכב.',
  },
  {
    skill: 'contrast_completion', difficulty: 'medium',
    stem: 'הַמִּזְג אֲוִיר הָיָה ______, אַךְ ______ שֶׁלָּבְשׁוּ שָׁמַר עֲלֵיהֶם מֵהַקֹּר.',
    correct: 'קַר מְאוֹד, הַמְּעִיל', wrongs: ['חַם, הַכּוֹבַע', 'קַר מְאוֹד, הַתִּיק', 'נָעִים, הַמִּטְרִיָּה'],
    explanation: 'מזג אוויר קר → מעיל שומר מהקור. ניגוד בין הבעיה לפתרון.',
  },

  // ═══════════════ VOCABULARY ═══════════════
  {
    skill: 'vocabulary', difficulty: 'easy',
    stem: 'הַגַּנָּן ______ אֶת הַפְּרָחִים כָּל בֹּקֶר, כְּדֵי שֶׁלֹּא ______ בַּחֹם.',
    correct: 'הִשְׁקָה, יִתְיַבְּשׁוּ', wrongs: ['קָטַף, יִצְמְחוּ', 'הִשְׁקָה, יִפְרְחוּ', 'שָׁתַל, יִתְיַבְּשׁוּ'],
    explanation: 'גנן משקה פרחים כדי שלא יתייבשו בחום.',
  },
  {
    skill: 'vocabulary', difficulty: 'medium',
    stem: 'הַסְּפִינָה ______ בְּתוֹךְ הַעֲרָפֶל הַכָּבֵד, וְהַיַּמָּאִים ______ לִרְאוֹת אֶת הַחוֹף.',
    correct: 'שָׁטָה, הִתְקַשּׁוּ', wrongs: ['טָסָה, הִצְלִיחוּ', 'שָׁטָה, הִצְלִיחוּ', 'עָצְרָה, רָצוּ'],
    explanation: 'ספינה שטה (לא טסה). ערפל כבד → התקשו לראות.',
  },
  {
    skill: 'vocabulary', difficulty: 'medium',
    stem: 'הַצַּיָּר ______ אֶת הַנּוֹף הַיָּפֶה עַל הַ______ בְּצִבְעֵי מַיִם.',
    correct: 'צִיֵּר, בַּד', wrongs: ['צִלֵּם, נְיָר', 'צִיֵּר, רִצְפָּה', 'כָּתַב, בַּד'],
    explanation: 'צייר מצייר על בד עם צבעי מים — אוצר מילים של אמנות.',
  },
  {
    skill: 'vocabulary', difficulty: 'hard',
    stem: 'הָעֵדוּת שֶׁל הָעֵד הָיְתָה ______, וּלְכֵן הַשּׁוֹפֵט ______ לְקַבֵּל אוֹתָהּ כִּרְאָיָה.',
    correct: 'מְהֵימְנָה, הִחְלִיט', wrongs: ['שִׁקְרִית, הִחְלִיט', 'מְהֵימְנָה, סֵרֵב', 'מְשַׁעְמֶמֶת, הִסְכִּים'],
    explanation: 'עדות מהימנה (=אמינה) → השופט החליט לקבלה.',
  },
  {
    skill: 'vocabulary', difficulty: 'easy',
    stem: 'הַטַּיָּס ______ אֶת הַמָּטוֹס בִּ______ לִנְתִיב הַטִּיסָה.',
    correct: 'טָס, בְּהַתְאָם', wrongs: ['נָהַג, בְּנִגּוּד', 'טָס, בַּמָּקוֹם', 'רָץ, בְּהַתְאָם'],
    explanation: 'טייס טס (לא נוהג) מטוס בהתאם לנתיב — אוצר מילים מקצועי.',
  },
  {
    skill: 'vocabulary', difficulty: 'medium',
    stem: 'הַפַּסָּל ______ אֶת הָאֶבֶן בְּאִזְמֵל עַד שֶׁ______ צוּרָה שֶׁל פָּנִים.',
    correct: 'פִּסֵּל, קִבְּלָה', wrongs: ['שָׁבַר, אִבְּדָה', 'פִּסֵּל, מָחֲקָה', 'חָתַךְ, הֶחְזִירָה'],
    explanation: 'פסל מפסל אבן עד שמקבלת צורה — תהליך יצירה.',
  },

  // ═══════════════ GENERAL KNOWLEDGE ═══════════════
  {
    skill: 'general_knowledge', difficulty: 'easy',
    stem: 'הַדְּבוֹרִים ______ צוּף מֵהַפְּרָחִים וּמְכִינוֹת מִמֶּנּוּ ______ מָתוֹק.',
    correct: 'אוֹסְפוֹת, דְּבַשׁ', wrongs: ['אוֹכְלוֹת, חָלָב', 'אוֹסְפוֹת, גְּלִידָה', 'שׁוֹתוֹת, מִיץ'],
    explanation: 'דבורים אוספות צוף ומייצרות דבש — ידע כללי.',
  },
  {
    skill: 'general_knowledge', difficulty: 'easy',
    stem: 'כַּדּוּר הָאָרֶץ ______ סְבִיב עַצְמוֹ פַּעַם אַחַת בְּ______.',
    correct: 'מִסְתּוֹבֵב, יוֹם', wrongs: ['נָע, שָׁבוּעַ', 'מִסְתּוֹבֵב, חֹדֶשׁ', 'עוֹצֵר, שָׁנָה'],
    explanation: 'כדור הארץ מסתובב סביב עצמו פעם ביום (24 שעות).',
  },
  {
    skill: 'general_knowledge', difficulty: 'medium',
    stem: 'הַלֵּב ______ דָּם לְכָל חֶלְקֵי הַגּוּף דֶּרֶךְ ______ הַדָּם.',
    correct: 'שׁוֹאֵב, כְּלֵי', wrongs: ['מְחַמֵּם, צִנּוֹרוֹת', 'שׁוֹאֵב, עוֹרְקֵי', 'מְסַנֵּן, כְּלֵי'],
    explanation: 'הלב שואב דם דרך כלי הדם — ידע כללי בביולוגיה.',
  },
  {
    skill: 'general_knowledge', difficulty: 'medium',
    stem: 'הַשֶּׁמֶשׁ הִיא ______ הַכִּי קָרוֹב לְכַדּוּר הָאָרֶץ, וְהִיא מְסַפֶּקֶת לָנוּ ______ וְחֹם.',
    correct: 'הַכּוֹכָב, אוֹר', wrongs: ['הַיָּרֵחַ, צֵל', 'הַכּוֹכָב, מַיִם', 'הַכּוֹכָב, קֹר'],
    explanation: 'השמש היא הכוכב הקרוב ביותר ומספקת אור וחום.',
  },
  {
    skill: 'general_knowledge', difficulty: 'hard',
    stem: 'הַצְּמָחִים ______ פֶּחְמָן דּוּ-חַמְצָנִי וּ______ חַמְצָן בַּתַּהֲלִיךְ שֶׁנִּקְרָא פוֹטוֹסִינְתֶּזָה.',
    correct: 'סוֹפְגִים, פּוֹלְטִים', wrongs: ['פּוֹלְטִים, סוֹפְגִים', 'סוֹפְגִים, סוֹפְגִים', 'שׁוֹתִים, אוֹכְלִים'],
    explanation: 'בפוטוסינתזה: צמחים סופגים CO₂ ופולטים O₂.',
  },
  {
    skill: 'general_knowledge', difficulty: 'easy',
    stem: 'הַמַּיִם ______ בְּטֶמְפֶּרָטוּרָה שֶׁל אֶפֶס מַעֲלוֹת וְ______ לְקֶרַח.',
    correct: 'קוֹפְאִים, הוֹפְכִים', wrongs: ['רוֹתְחִים, הוֹפְכִים', 'קוֹפְאִים, נִשְׁאָרִים', 'מִתְחַמְּמִים, הוֹפְכִים'],
    explanation: 'מים קופאים ב-0 מעלות והופכים לקרח — ידע מדעי בסיסי.',
  },

  // ═══════════════ IDIOMS / PROVERBS ═══════════════
  {
    skill: 'idioms_proverbs', difficulty: 'medium',
    stem: 'מִי שֶׁ______ בָּאֵשׁ, ______ מֵהָאֵשׁ.',
    correct: 'נִכְוָה, מְפַחֵד', wrongs: ['שִׂחֵק, נֶהֱנָה', 'נָפַל, קָפַץ', 'יָשַׁן, הִתְעוֹרֵר'],
    explanation: 'פתגם: מי שנכווה באש — מפחד ממנה. כלומר: מי שחווה דבר רע — נזהר.',
  },
  {
    skill: 'idioms_proverbs', difficulty: 'medium',
    stem: 'סוֹף ______ לָבוֹא, גַּם אִם ______ נִדְמֶה שֶׁהוּא רָחוֹק.',
    correct: 'מַעֲשֶׂה, לִפְעָמִים', wrongs: ['סִפּוּר, תָּמִיד', 'מַעֲשֶׂה, אַף פַּעַם', 'חֲלוֹם, הַכֹּל'],
    explanation: 'פתגם: "סוף מעשה לבוא" — כל מעשה בסוף מתגלה, גם אם נדמה שרחוק.',
  },
  {
    skill: 'idioms_proverbs', difficulty: 'hard',
    stem: 'כְּשֶׁאָמְרוּ לְדָוִד שֶׁהוּא לֹא יַצְלִיחַ, הוּא הוֹכִיחַ שֶׁ"אַל תִּסְתַּכֵּל ______, כִּי אִם ______ שֶׁבּוֹ".',
    correct: 'בַּקַּנְקַן, בְּמַה שֶּׁיֵּשׁ', wrongs: ['בַּחוּץ, בַּפְּנִים', 'בַּקַּנְקַן, בַּגֹּדֶל', 'בַּצּוּרָה, בָּעוֹבִי'],
    explanation: 'הפתגם: "אל תסתכל בקנקן אלא במה שיש בו" — אל תשפוט לפי מראה חיצוני.',
  },
  {
    skill: 'idioms_proverbs', difficulty: 'easy',
    stem: 'אַחֲרֵי שֶׁהַשָּׁכֵן עָזַר לָנוּ, אָמְרָה אִמָּא: "______ טוֹב ______ קָרוֹב".',
    correct: 'שָׁכֵן, מֵאָח', wrongs: ['חָבֵר, מֵאָב', 'כֶּלֶב, מֵחָתוּל', 'שָׁכֵן, מֵחָבֵר'],
    explanation: 'הפתגם: "שכן טוב מאח קרוב" — שכן עוזר לפעמים יותר ממשפחה רחוקה.',
  },
  {
    skill: 'idioms_proverbs', difficulty: 'medium',
    stem: 'אָבִיב תָּמִיד מְזַלְזֵל בַּתַּרְגִּילִים הַקְּטַנִּים, אֲבָל הַמּוֹרָה אָמְרָה לוֹ: "______ הַגְּדוֹלוֹת מִתְחִילוֹת ______ קְטַנִּים".',
    correct: 'הַהֲצָלָחוֹת, מִצְּעָדִים', wrongs: ['הַבְּעָיוֹת, מִמַּעֲשִׂים', 'הַהֲצָלָחוֹת, מִטְּעוּיוֹת', 'הַמַּתָּנוֹת, מִחֲנוּיוֹת'],
    explanation: 'ההצלחות הגדולות מתחילות מצעדים קטנים — כל דבר גדול מתחיל בקטן.',
  },

  // ═══════════════ ADDITIONAL TEMPLATES (variety expansion) ═══════════════
  // Real Stage B sentence-completion sees ~10 distinct items per kid; with only
  // ~30 templates, repeat rate hits >30% per session. These extras lift the
  // working set so a child can do 4-5 sessions before seeing a repeat.

  {
    skill: 'logical_connection', difficulty: 'easy',
    stem: 'הַשֶּׁמֶשׁ ______, וּלְכֵן הַחוֹל בְּחוֹף הַיָּם הִתְ______ מְאוֹד.',
    correct: 'זָרְחָה, חַמֵּם', wrongs: ['שָׁקְעָה, קָרֵר', 'נֶעֶלְמָה, חַמֵּם', 'זָרְחָה, רְטַב'],
    explanation: 'שמש זורחת → חום → החול מתחמם.',
  },
  {
    skill: 'logical_connection', difficulty: 'easy',
    stem: 'הַתִּינוֹקֶת ______ מְאוֹד וּלְכֵן אִמָּא הָלְכָה לְהָכִין לָהּ ______.',
    correct: 'בָּכְתָה, אֹכֶל', wrongs: ['צָחֲקָה, אֹכֶל', 'בָּכְתָה, מַתָּנָה', 'יָשְׁנָה, חָלָב'],
    explanation: 'תינוקת בוכה לרוב כי היא רעבה — לכן אמא מכינה אוכל.',
  },
  {
    skill: 'logical_connection', difficulty: 'medium',
    stem: 'נִיר רָץ מַהֵר מְאוֹד לְבֵית הַסֵּפֶר, כִּי ______ אוֹתוֹ שֶׁכְּבָר ______.',
    correct: 'הִזְהִירוּ, אִחֵר', wrongs: ['חִכּוּ, סִיֵּם', 'בִּקְשׁוּ, יָשַׁן', 'שָׁאֲלוּ, הִתְעוֹרֵר'],
    explanation: 'מי שמאחר רץ מהר. הוזהר שהוא מאחר → רץ.',
  },
  {
    skill: 'vocabulary', difficulty: 'easy',
    stem: 'הָעוֹף שֶׁ______ בַּשָּׁמַיִם נִקְרָא נֶשֶׁר.',
    correct: 'מַמְרִיא', wrongs: ['שׂוֹחֶה', 'זוֹחֵל', 'הוֹלֵךְ'],
    explanation: 'נשרים עפים גבוה — "ממריא" = ממריא לאוויר ועף.',
  },
  {
    skill: 'vocabulary', difficulty: 'medium',
    stem: 'הַמְּלוֹנָאִי הוּא הָאִישׁ שֶׁ______ אֶת הַמָּלוֹן.',
    correct: 'מְנַהֵל', wrongs: ['קוֹנֶה', 'בּוֹנֶה', 'נוֹקֶה'],
    explanation: '"מְלוֹנַאי" הוא בעל המקצוע שמנהל מלון, כמו "סַפָּר" שמספר.',
  },
  {
    skill: 'vocabulary', difficulty: 'easy',
    stem: 'אֶמְצָעִי שֶׁמְּשַׁמֵּשׁ לִשְׁמֹעַ מוּזִיקָה בְּלִי לְהַפְרִיעַ לַאֲחֵרִים נִקְרָא ______.',
    correct: 'אֹזְנִיּוֹת', wrongs: ['רַמְקוֹלִים', 'מִקְרוֹפוֹן', 'מַחְשֵׁב'],
    explanation: 'אוזניות = מכשיר אישי לאוזן. רמקולים משמיעים לכולם — מפריעים.',
  },
  {
    skill: 'semantic_context', difficulty: 'easy',
    stem: 'בַּחֹרֶף יֵרֵד הַרְבֵּה ______, וְלָכֵן צָרִיךְ לִלְבֹּשׁ ______.',
    correct: 'גֶּשֶׁם, מְעִיל', wrongs: ['גֶּשֶׁם, סַנְדָּלִים', 'שֶׁמֶשׁ, מְעִיל', 'שֶׁלֶג, בֶּגֶד יָם'],
    explanation: 'גשם בחורף → לבישת מעיל כדי להישאר יבש וחם.',
  },
  {
    skill: 'semantic_context', difficulty: 'medium',
    stem: 'בַּסּוּפֶּרְמַרְקֶט הַחָלָב נִמְצָא בַּ______, וְהַלֶּחֶם בַּ______.',
    correct: 'מְקָרֵר, מַדָּף', wrongs: ['מַדָּף, מְקָרֵר', 'מַקְפִּיא, תַּנּוּר', 'אַרוֹן, מְכוֹנִית'],
    explanation: 'חלב שומרים קר במקרר. לחם נשמר טרי על מדף בטמפרטורת חדר.',
  },
  {
    skill: 'contrast_completion', difficulty: 'easy',
    stem: 'דַּנִּי ______ קָטָן וְצָנוּעַ, אֲבָל אֵיתָן ______ גָּבוֹהַּ וּבִטּוּחַ בְּעַצְמוֹ.',
    correct: 'נִרְאָה, נִרְאָה', wrongs: ['חָשַׁב, רָץ', 'דִּבֵּר, יָשַׁן', 'נִרְאָה, חָתַךְ'],
    explanation: 'הניגוד דורש שני בני אדם המתוארים בצורה שונה — שניהם "נראים" בצורה שונה.',
  },
  {
    skill: 'contrast_completion', difficulty: 'medium',
    stem: 'הַסְּפָרִים הַחֲדָשִׁים ______ וְ______, אֲבָל הַסְּפָרִים הַיְשָׁנִים ______ וִמְצֻמְצָמִים.',
    correct: 'גְּדוֹלִים, מְלֵאִים, קְטַנִּים', wrongs: ['קְטַנִּים, רֵיקִים, גְּדוֹלִים', 'יָפִים, מְעַנְיְנִים, מְשַׁעֲמְמִים', 'בְּהִירִים, חַדִּים, כֵּהִים'],
    explanation: 'ניגוד גודל: גדולים ומלאים מול קטנים ומצומצמים — שניהם נכונים יחד.',
  },
  {
    skill: 'general_knowledge', difficulty: 'easy',
    stem: 'יִשְׂרָאֵל נִמְצֵאת בַּיַּבֶּשֶׁת ______.',
    correct: 'אַסְיָה', wrongs: ['אֵירוֹפָּה', 'אַפְרִיקָה', 'אֲמֵרִיקָה'],
    explanation: 'ישראל היא חלק מיבשת אסיה (במזרח התיכון).',
  },
  {
    skill: 'general_knowledge', difficulty: 'medium',
    stem: 'בַּהֲלִיכַת הַחוֹף הַחוֹלִית, רוּת רָאֲתָה ______ שֶׁשּׂוֹחָה בַּיָּם.',
    correct: 'דֹּלְפִין', wrongs: ['גָּמָל', 'נָמֵר', 'אֲרִי'],
    explanation: 'דולפין הוא היונק היחיד מבין הארבעה שחי במים.',
  },
  {
    skill: 'general_knowledge', difficulty: 'easy',
    stem: 'הַ______ נוֹתֶנֶת לָנוּ אוֹר בַּיּוֹם, וְהַ______ מְאִירָה אוֹתָנוּ בַּלַּיְלָה.',
    correct: 'שֶׁמֶשׁ, לְבָנָה', wrongs: ['לְבָנָה, שֶׁמֶשׁ', 'שֶׁמֶשׁ, כּוֹכָב', 'נוּרָה, פָּנָס'],
    explanation: 'בשעות היום השמש מאירה את העולם. בלילה הירח (לבנה) משקף אור ומאיר אותנו.',
  },

  // ═══════════ HARD-TIER EXPANSION (exam-level reasoning templates) ═══════════
  // Original templates targeting the reasoning families the real exam tests:
  // reciprocal family relations, left/right identity, calendar facts, senses,
  // day/night inversion, contrast connectives, conditional connectives.

  {
    skill: 'logical_connection', difficulty: 'hard',
    stem: 'אִם דָּנִי הוּא הַדּוֹד שֶׁל רוֹנִי, אָז רוֹנִי הוּא הָ______ שֶׁל דָּנִי, וַאֲבִיו שֶׁל רוֹנִי הוּא ______ שֶׁל דָּנִי.',
    correct: 'אַחְיָן, אָח (אוֹ גִּיס)', wrongs: ['סַבָּא, בֵּן', 'אַחְיָן, בֵּן דּוֹד', 'נֶכֶד, אָח'],
    explanation: 'יחסי משפחה הם הדדיים: אם דני דוד של רוני, רוני הוא האחיין שלו. דוד הוא אח (או גיס) של אחד ההורים — לכן אביו של רוני הוא אח או גיס של דני.',
  },
  {
    skill: 'general_knowledge', difficulty: 'hard',
    stem: 'מִי שֶׁכּוֹתֵב בְּיָד שְׂמֹאל נִקְרָא ______, וּמִי שֶׁכּוֹתֵב בְּיָד יָמִין נִקְרָא ______.',
    correct: 'שְׂמָאלִי, יְמָנִי', wrongs: ['יְמָנִי, שְׂמָאלִי', 'שְׂמָאלִי, חָזָק', 'אִטִּי, מָהִיר'],
    explanation: 'שמאלי = כותב ביד שמאל, ימני = כותב ביד ימין. המסיח המרכזי הוא הזוג ההפוך — חובה לשים לב לסדר במשפט.',
  },
  {
    skill: 'general_knowledge', difficulty: 'hard',
    stem: 'בְּשָׁנָה יֵשׁ ______ חֳדָשִׁים, וּבְכָל שָׁבוּעַ יֵשׁ ______ יָמִים.',
    correct: '12, 7', wrongs: ['7, 12', '12, 6', '10, 7'],
    explanation: 'בשנה 12 חודשים ובשבוע 7 ימים. המסיח "7, 12" הפוך — סדר המספרים חייב להתאים לסדר במשפט.',
  },
  {
    skill: 'semantic_context', difficulty: 'hard',
    stem: 'אֶת הַמּוּזִיקָה אֲנַחְנוּ קוֹלְטִים בְּחוּשׁ הַ______, וְאֶת הַבֹּשֶׂם — בְּחוּשׁ הָ______.',
    correct: 'שְׁמִיעָה, רֵיחַ', wrongs: ['רְאִיָּה, שְׁמִיעָה', 'שְׁמִיעָה, טַעַם', 'רֵיחַ, שְׁמִיעָה'],
    explanation: 'מוזיקה נקלטת באוזניים — חוש השמיעה. בושם נקלט באף — חוש הריח.',
  },
  {
    skill: 'general_knowledge', difficulty: 'hard',
    stem: 'כַּאֲשֶׁר אֶצְלֵנוּ צָהֳרַיִם, בַּצַּד הַשֵּׁנִי שֶׁל כַּדּוּר הָאָרֶץ עַכְשָׁו ______, מִפְּנֵי שֶׁכַּדּוּר הָאָרֶץ ______.',
    correct: 'לַיְלָה, מִסְתּוֹבֵב', wrongs: ['בֹּקֶר, עוֹמֵד בְּמָקוֹם', 'צָהֳרַיִם, מִסְתּוֹבֵב', 'לַיְלָה, מִתְחַמֵּם'],
    explanation: 'כדור הארץ מסתובב סביב עצמו, ולכן כשצד אחד פונה לשמש (יום) — הצד השני חשוך (לילה).',
  },
  {
    skill: 'logical_connection', difficulty: 'hard',
    stem: 'לַמְרוֹת שֶׁיָּרַד גֶּשֶׁם חָזָק, הַמִּשְׂחָק ______, וְהַקְּבוּצָה שֶׁלָּנוּ אֲפִלּוּ ______.',
    correct: 'לֹא בֻּטַּל, נִצְּחָה', wrongs: ['בֻּטַּל, נִצְּחָה', 'לֹא בֻּטַּל, נֶעֶלְמָה', 'הִתְחַזֵּק, הִפְסִידָה'],
    explanation: '"למרות" מציין ניגוד לציפייה: ציפינו שהגשם יבטל את המשחק — אבל הוא לא בוטל. "אפילו" מוסיף הפתעה חיובית: גם ניצחה.',
  },
  {
    skill: 'contrast_completion', difficulty: 'hard',
    stem: 'הַצָּב מִתְקַדֵּם בְּ______, וְאִלּוּ הָאַרְנָב ______ קָדִימָה בִּמְהִירוּת.',
    correct: 'אִטִּיּוּת, מְזַנֵּק', wrongs: ['מְהִירוּת, זוֹחֵל', 'אִטִּיּוּת, נִרְדָּם', 'שִׂמְחָה, הוֹלֵךְ'],
    explanation: '"ואילו" מציין ניגוד: הצב אטי, הארנב מהיר. "מזנק" מתאים למהירות; "נרדם" לא מתאר התקדמות מהירה.',
  },
  {
    skill: 'logical_connection', difficulty: 'hard',
    stem: 'לֹא נֵצֵא מָחָר לַטִּיּוּל, אֶלָּא אִם מֶזֶג הָאֲוִיר ______; בְּמִקְרֶה כָּזֶה — נֵצֵא ______.',
    correct: 'יִשְׁתַּפֵּר, בְּשִׂמְחָה', wrongs: ['יַחְמִיר, בְּשִׂמְחָה', 'יִשְׁתַּפֵּר, לְעוֹלָם לֹא', 'יִשָּׁאֵר סוֹעֵר, מִיָּד'],
    explanation: '"אלא אם" = התנאי היחיד שישנה את ההחלטה. רק שיפור במזג האוויר יאפשר לצאת — ואז נצא בשמחה.',
  },
  {
    skill: 'vocabulary', difficulty: 'medium',
    stem: 'מִי שֶׁמְּתַקֵּן נַעֲלַיִם נִקְרָא ______, וּמִי שֶׁאוֹפֶה לֶחֶם נִקְרָא ______.',
    correct: 'סַנְדְּלָר, אוֹפֶה', wrongs: ['נַגָּר, טַבָּח', 'סַנְדְּלָר, שֶׁף', 'חַיָּט, אוֹפֶה'],
    explanation: 'סנדלר מתקן נעליים; אופה אופה לחם. שף מבשל אוכל במסעדה אבל אינו בהכרח אופה לחם — הדיוק חשוב.',
  },
  {
    skill: 'vocabulary', difficulty: 'hard',
    stem: 'אֶת הַגֹּבַהּ מוֹדְדִים בְּ______, וְאֶת הַמִּשְׁקָל בְּ______.',
    correct: 'סֶנְטִימֶטְרִים, קִילוֹגְרָמִים', wrongs: ['קִילוֹגְרָמִים, סֶנְטִימֶטְרִים', 'לִיטְרִים, קִילוֹגְרָמִים', 'סֶנְטִימֶטְרִים, לִיטְרִים'],
    explanation: 'גובה = אורך → סנטימטרים (או מטרים). משקל → קילוגרמים. ליטרים מודדים נפח של נוזלים.',
  },
  {
    skill: 'semantic_context', difficulty: 'hard',
    stem: 'בַּחֹרֶף הַלַּיְלָה ______ מִן הַיּוֹם, וְאִלּוּ בַּקַּיִץ הַמַּצָּב ______.',
    correct: 'אָרֹךְ יוֹתֵר, הָפוּךְ', wrongs: ['קָצָר יוֹתֵר, הָפוּךְ', 'אָרֹךְ יוֹתֵר, זֵהֶה', 'חָשׁוּךְ יוֹתֵר, בָּהִיר'],
    explanation: 'בחורף הלילות ארוכים מהימים; בקיץ המצב הפוך — הימים ארוכים מהלילות.',
  },
];

// ── Public API ──────────────────────────────────────────────────────────

export function generateSentenceQuestions(
  difficulty: Difficulty,
  count: number,
  options?: { skill?: SentenceSkill },
): Question[] {
  // Hide proverbs by default — real Stage B doesn't use idioms.
  // (They remain available only when explicitly requested via skill targeting.)
  let candidates = options?.skill
    ? templates.filter(t => t.skill === options.skill)
    : templates.filter(t => t.skill !== 'idioms_proverbs');

  // Filter by difficulty if not adaptive — prefer exact match, fall back to
  // matching adjacent difficulty rather than mixing all (audit found the old
  // fall-back silently surfaced hard items inside an "easy" set).
  if (difficulty !== 'adaptive') {
    const filtered = candidates.filter(t => t.difficulty === difficulty);
    if (filtered.length >= count) {
      candidates = filtered;
    } else if (difficulty === 'easy') {
      candidates = candidates.filter(t => t.difficulty === 'easy' || t.difficulty === 'medium');
    } else if (difficulty === 'hard') {
      candidates = candidates.filter(t => t.difficulty === 'hard' || t.difficulty === 'medium');
    }
  } else {
    // Adaptive (default practice mode): stretch toward exam level — drop the
    // easy warm-up templates whenever medium+hard alone can fill the request.
    const stretch = candidates.filter(t => t.difficulty !== 'easy');
    if (stretch.length >= count) candidates = stretch;
  }

  // Pick random templates
  const selected = shuffle(candidates).slice(0, count);

  return selected.map(t => {
    // Randomize option order
    const allOpts = [t.correct, ...t.wrongs.slice(0, 3)];
    const shuffled = shuffle(allOpts);

    return {
      id: uid(),
      sectionType: 'sentence_completion' as const,
      skillTag: t.skill,
      difficulty: t.difficulty === 'adaptive' ? 'medium' : t.difficulty,
      questionType: 'text' as const,
      stem: t.stem,
      options: shuffled,
      correctOption: shuffled.indexOf(t.correct),
      explanation: t.explanation,
      recommendedTimeSec: t.difficulty === 'easy' ? 55 : t.difficulty === 'hard' ? 70 : 60,
      generatorSource: 'generated' as const,
      qualityScore: 90,
      isActive: true,
    };
  });
}
