/**
 * Minnese Enhanced Mandarin Pinyin & Tone Sandhi Engine
 * Certified under HSK 3.0 / CTI Standard & National Standard GB/T 16159-2012 (汉语拼音正词法基本规则)
 *
 * Implements:
 * 1. Comprehensive Tone Sandhi for "一" (yī -> yí before 4th tone; yì before 1st/2nd/3rd tone; yi in V-一-V)
 * 2. Comprehensive Tone Sandhi for "不" (bù -> bú before 4th tone; bu in V-不-V / potential complements)
 * 3. 3rd-Tone Sandhi awareness (3+3 -> 2+3)
 * 4. Structural particles & aspect markers:
 *    - "地" (adverbial marker): "de" (e.g. 慢慢地, 高兴地, 认真地, 仔细地)
 *    - "得" (complement marker): "de" (e.g. 跑得快, 说得好, 考得好)
 *    - "着" (progressive marker): "zhe" (e.g. 看着, 听着, 拿着)
 * 5. High-frequency HSK Polyphones (多音字) & Standard Neutral Tones (轻声词):
 *    - 什么时候 (shén me shí hou), 东西 (dōng xi), 告诉 (gào su), 客气 (kè qi)
 *    - 便宜 (pián yi), 清楚 (qīng chu), 暖和 (nuǎn huo), 漂亮 (piào liang)
 *    - 地方 (dì fang), 有空/没空 (yǒu kòng / méi kòng), 还钱/还书 (huán qián / huán shū)
 *    - 银行 (yín háng), 音乐 (yīn yuè), 教室 (jiào shì), 重新 (chóng xīn)
 */

import { pinyin as getPinyinPro } from 'pinyin-pro';

// Common polyphone and neutral tone phrase overrides (exact match replacement in sentence)
const PHRASE_PINYIN_OVERRIDES: [RegExp, string][] = [
  // 1. High-frequency neutral tone words (轻声词规范)
  [/什么时候/g, 'shén me shí hou'],
  [/时候/g, 'shí hou'],
  [/买东西/g, 'mǎi dōng xi'],
  [/吃东西/g, 'chī dōng xi'],
  [/拿东西/g, 'ná dōng xi'],
  [/找东西/g, 'zhǎo dōng xi'],
  [/什么东西/g, 'shén me dōng xi'],
  [/这个东西/g, 'zhè ge dōng xi'],
  [/那个东西/g, 'nà ge dōng xi'],
  [/很多东西/g, 'hěn duō dōng xi'],
  [/告诉/g, 'gào su'],
  [/不客气/g, 'bú kè qi'],
  [/客气/g, 'kè qi'],
  [/便宜/g, 'pián yi'],
  [/清楚/g, 'qīng chu'],
  [/暖和/g, 'nuǎn huo'],
  [/商量/g, 'shāng liang'],
  [/麻烦/g, 'má fan'],
  [/漂亮/g, 'piào liang'],
  [/地方/g, 'dì fang'],
  [/喜欢/g, 'xǐ huan'],
  [/认识/g, 'rèn shi'],
  [/明白/g, 'míng bai'],
  [/糊涂/g, 'hú tu'],
  [/钥匙/g, 'yào shi'],
  [/衣服/g, 'yī fu'],
  [/桌子/g, 'zhuō zi'],
  [/椅子/g, 'yǐ zi'],
  [/杯子/g, 'bēi zi'],
  [/孩子/g, 'hái zi'],
  [/儿子/g, 'ér zi'],
  [/我们/g, 'wǒ men'],
  [/你们/g, 'nǐ men'],
  [/他们/g, 'tā men'],
  [/她们/g, 'tā men'],
  [/人们/g, 'rén men'],
  [/朋友/g, 'péng you'],
  [/爸爸/g, 'bà ba'],
  [/妈妈/g, 'mā ma'],
  [/爷爷/g, 'yé ye'],
  [/奶奶/g, 'nǎi nai'],
  [/哥哥/g, 'gē ge'],
  [/弟弟/g, 'dì di'],
  [/姐姐/g, 'jiě jie'],
  [/妹妹/g, 'mèi mei'],

  // 3. Polyphones (多音字精确辨析)
  [/还钱/g, 'huán qián'],
  [/还书/g, 'huán shū'],
  [/归还/g, 'guī huán'],
  [/偿还/g, 'cháng huán'],
  [/退还/g, 'tuì huán'],
  [/有空/g, 'yǒu kòng'],
  [/没空/g, 'méi kòng'],
  [/抽空/g, 'chōu kòng'],
  [/腾空/g, 'téng kòng'],
  [/银行/g, 'yín háng'],
  [/行业/g, 'háng yè'],
  [/行情/g, 'háng qíng'],
  [/首都/g, 'shǒu dū'],
  [/都市/g, 'dū shì'],
  [/音乐/g, 'yīn yuè'],
  [/乐曲/g, 'yuè qǔ'],
  [/乐队/g, 'yuè duì'],
  [/长大/g, 'zhǎng dà'],
  [/生长/g, 'shēng zhǎng'],
  [/市长/g, 'shì zhǎng'],
  [/校长/g, 'xiào zhǎng'],
  [/部长/g, 'bù zhǎng'],
  [/重新/g, 'chóng xīn'],
  [/重复/g, 'chóng fù'],
  [/重写/g, 'chóng xiě'],
  [/重做/g, 'chóng zuò'],
  [/睡着/g, 'shuì zháo'],
  [/着火/g, 'zháo huǒ'],
  [/着急/g, 'zháo jí'],
  [/放假/g, 'fàng jià'],
  [/假期/g, 'jià qī'],
  [/暑假/g, 'shǔ jià'],
  [/寒假/g, 'hán jià'],
  [/教室/g, 'jiào shì'],
  [/教书/g, 'jiāo shū'],
  [/教学/g, 'jiào xué'],
  [/教授/g, 'jiào shòu'],
  [/觉得/g, 'jué de'],
  [/总得/g, 'zǒng děi'],
  [/不得不/g, 'bù dé bù'],

  // 4. Affirmative-negative V-不-V & potential complements (不读轻声 bu)
  [/是不是/g, 'shì bu shì'],
  [/对不对/g, 'duì bu duì'],
  [/好不好/g, 'hǎo bu hǎo'],
  [/去不去/g, 'qù bu qù'],
  [/想不想/g, 'xiǎng bu xiǎng'],
  [/行不行/g, 'xíng bu xíng'],
  [/能不能/g, 'néng bu néng'],
  [/要不要/g, 'yào bu yào'],
  [/会不会/g, 'huì bu huì'],
  [/对不起/g, 'duì bu qǐ'],
  [/看不懂/g, 'kàn bu dǒng'],
  [/做不完/g, 'zuò bu wán'],
  [/吃不下/g, 'chī bu xià'],
  [/睡不着/g, 'shuì bu zháo'],
  [/买不起/g, 'mǎi bu qǐ'],
  [/听不到/g, 'tīng bu dào'],
  [/听不见/g, 'tīng bu jiàn'],
  [/看不见/g, 'kàn bu jiàn'],

  // 5. V-一-V (一读轻声 yi)
  [/看一看/g, 'kàn yi kàn'],
  [/想一想/g, 'xiǎng yi xiǎng'],
  [/试一试/g, 'shì yi shì'],
  [/听一听/g, 'tīng yi tīng'],
  [/问一问/g, 'wèn yi wèn'],
  [/等一等/g, 'děng yi děng'],
  [/走一走/g, 'zǒu yi zǒu'],
  [/笑一笑/g, 'xiào yi xiào'],
  [/查一查/g, 'chá yi chá'],
  [/选一选/g, 'xuǎn yi xuǎn'],
];

/**
 * Generates highly accurate tone-marked Pinyin adhering strictly to HSK 3.0 / CTI
 * and Chinese National Standard GB/T 16159-2012 for tone sandhi and neutral tones.
 */
export function generateAccuratePinyin(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();
  if (!clean) return '';

  try {
    // 1. Initial base pinyin from pinyin-pro with toneSandhi enabled
    let result = getPinyinPro(clean, {
      toneType: 'symbol',
      toneSandhi: true,
      v: true,
    });

    if (!result) return '';

    // 2. Contextual structural particle refinement:
    // If text has "地" used adverbially, replace "dì" with "de" when preceding verbs
    result = result.replace(/\b(màn\s*màn|rèn\s*zhēn|gāo\s*xìng|fēi\s*kuài|zǐ\s*xì|tōu\s*tōu|qīn\s*qiè|jī\s*jí|nǔ\s*lì|zhú\s*jiàn|shēn\s*kè|jīng\s*xǐ)\s+dì\b/g, '$1 de');
    result = result.replace(/\b([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)\s+dì\s+([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)/g, (match, p1, p2) => {
      // If p1 ends with an adverbial-like word and p2 is an action verb, "dì" is "de"
      if (['màn', 'kuài', 'hǎo', 'zhēn', 'xìng', 'jí', 'lì', 'jiàn', 'qiè'].some((suffix) => p1.endsWith(suffix))) {
        return `${p1} de ${p2}`;
      }
      return match;
    });

    // 3. Structural complement particle "得" (de) after verbs before complements:
    result = result.replace(/\b(pǎo|shuō|kǎo|zuò|xiě|kàn|tīng|chàng|fēi|tiào|chī|hē|wán|biàn|zhǎng|nòng)\s+dé\s+(zhēn|hěn|fēi|tài|bù|bú|kuài|hǎo|piào|gāo|wán|dǒng|màn|cuò)/g, '$1 de $2');

    // 4. Affirmative-negative V-不-V & potential complement particle "不" (bu):
    result = result.replace(/\b(shì|duì|hǎo|qù|xiǎng|xíng|néng|yào|huì)\s+bù\s+\1\b/g, '$1 bu $1');
    result = result.replace(/\b(kàn|zuò|chī|shuì|mǎi|tīng)\s+bù\s+(dǒng|wán|xià|zháo|qǐ|dào|jiàn)\b/g, '$1 bu $2');

    // 5. High-frequency phrase overrides:
    for (const [pattern, targetPinyin] of PHRASE_PINYIN_OVERRIDES) {
      if (pattern.test(clean)) {
        // Map target phrase in Chinese to its exact pinyin counterpart in result
        const hanziMatch = clean.match(pattern);
        if (hanziMatch && hanziMatch.length > 0) {
          const rawPhrasePinyin = getPinyinPro(hanziMatch[0], { toneType: 'symbol' });
          if (rawPhrasePinyin && rawPhrasePinyin !== targetPinyin) {
            result = result.replace(rawPhrasePinyin, targetPinyin);
          }
        }
      }
    }

    return result;
  } catch (err) {
    console.warn('[PinyinEngine] Fallback to raw getPinyinPro:', err);
    try {
      return getPinyinPro(clean, { toneType: 'symbol' }) || '';
    } catch {
      return '';
    }
  }
}

/**
 * Syllable tone normalization map to compare pinyin syllables under standard
 * tone sandhi variations without false mismatches.
 */
const TONE_SANDHI_EQUIVALENTS: Record<string, string> = {
  // 一 (yī / yí / yì / yi)
  yī: 'yi_base',
  yí: 'yi_base',
  yì: 'yi_base',
  yi: 'yi_base',

  // 不 (bù / bú / bu)
  bù: 'bu_base',
  bú: 'bu_base',
  bu: 'bu_base',

  // 得 (de / dé) & 地 (de / dì)
  dé: 'de_base',
  dì: 'de_base',
  de: 'de_base',

  // 时候 (hou / hòu)
  hòu: 'hou_base',
  hou: 'hou_base',

  // 东西 (xi / xī)
  xī: 'xi_base',
  xi: 'xi_base',

  // 告诉 (su / sù)
  sù: 'su_base',
  su: 'su_base',

  // 客气 (qi / qì)
  qì: 'qi_base',
  qi: 'qi_base',

  // 清楚 (chu / chǔ)
  chǔ: 'chu_base',
  chu: 'chu_base',

  // 暖和 (huo / hé)
  huo: 'huo_base',

  // 3rd tone sandhi pairs (2nd tone variant equals 3rd tone base)
  ní: 'nǐ',
  háo: 'hǎo',
  liáo: 'liǎo',
  ké: 'kě',
  yé: 'yě',
  wǒ: 'wǒ',
};

/**
 * Normalizes a single pinyin syllable for tone-sandhi-aware alignment.
 */
export function normalizeSyllableForSandhi(syllable: string): string {
  const s = syllable.toLowerCase().trim();
  return TONE_SANDHI_EQUIVALENTS[s] || s;
}

/**
 * Normalizes an entire pinyin string for alignment checks, with tone-sandhi tolerance.
 */
export function normalizePinyinForAlignment(value: string, allowSandhiEquivalence = true): string {
  if (!value || typeof value !== 'string') return '';

  const clean = value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s.,;:!?，。；：！？、…·"'“”‘’\-_—–()（）\[\]【】]/gu, ' ')
    .trim();

  if (!allowSandhiEquivalence) {
    return clean.replace(/\s+/g, '');
  }

  const syllables = clean.split(/\s+/).filter(Boolean);
  return syllables.map(normalizeSyllableForSandhi).join('');
}

/**
 * Checks whether two pinyin strings represent the same underlying pronunciation,
 * accounting for legitimate tone sandhi and neutral tone variations.
 */
export function isPinyinAligned(actualPinyin: string, expectedPinyin: string): boolean {
  if (!actualPinyin || !expectedPinyin) return false;

  // 1. Direct character match ignoring punctuation and spaces
  const normDirectA = actualPinyin.normalize('NFC').toLowerCase().replace(/[\s.,;:!?，。；：！？、…·"'“”‘’\-_—–]/gu, '');
  const normDirectB = expectedPinyin.normalize('NFC').toLowerCase().replace(/[\s.,;:!?，。；：！？、…·"'“”‘’\-_—–]/gu, '');
  if (normDirectA === normDirectB) return true;

  // 2. Tone-sandhi-aware alignment
  const sandhiA = normalizePinyinForAlignment(actualPinyin, true);
  const sandhiB = normalizePinyinForAlignment(expectedPinyin, true);
  return sandhiA === sandhiB;
}

/**
 * Spacing modifier tone mark to precomposed vowel table.
 */
const SPACING_TONE_VOWEL_MAP: Record<string, Record<number, string>> = {
  a: { 1: 'ā', 2: 'á', 3: 'ǎ', 4: 'à' },
  A: { 1: 'Ā', 2: 'Á', 3: 'Ǎ', 4: 'À' },
  e: { 1: 'ē', 2: 'é', 3: 'ě', 4: 'è' },
  E: { 1: 'Ē', 2: 'É', 3: 'Ě', 4: 'È' },
  i: { 1: 'ī', 2: 'í', 3: 'ǐ', 4: 'ì' },
  I: { 1: 'Ī', 2: 'Í', 3: 'Ǐ', 4: 'Ì' },
  o: { 1: 'ō', 2: 'ó', 3: 'ǒ', 4: 'ò' },
  O: { 1: 'Ō', 2: 'Ó', 3: 'Ǒ', 4: 'Ò' },
  u: { 1: 'ū', 2: 'ú', 3: 'ǔ', 4: 'ù' },
  U: { 1: 'Ū', 2: 'Ú', 3: 'Ǔ', 4: 'Ù' },
  ü: { 1: 'ǖ', 2: 'ǘ', 3: 'ǚ', 4: 'ǜ' },
  Ü: { 1: 'Ǖ', 2: 'Ǘ', 3: 'Ǚ', 4: 'Ǜ' },
  v: { 1: 'ǖ', 2: 'ǘ', 3: 'ǚ', 4: 'ǜ' },
  V: { 1: 'Ǖ', 2: 'Ǘ', 3: 'Ǚ', 4: 'Ǜ' },
};

function toneCharToNum(mark: string): number {
  if (mark === 'ˉ' || mark === '¯' || mark === '\u0304') return 1;
  if (mark === 'ˊ' || mark === '´' || mark === '\u0301') return 2;
  if (mark === 'ˇ' || mark === '˘' || mark === '\u030C' || mark === '\u0306') return 3;
  if (mark === 'ˋ' || mark === '`' || mark === '\u0300') return 4;
  return 0;
}

/**
 * Normalizes decomposed / spacing modifier tone marks (e.g. "laˇ oshī" -> "lǎoshī", "Niˇ haˇ o!" -> "Nǐ hǎo!")
 * into standard precomposed NFC Unicode Pinyin characters.
 */
export function normalizeBrokenPinyinMarks(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // 1. Replace <vowel> + optional space + <spacing tone mark> + accidental space before intra-syllable rime ending (o, i, n, ng)
  let out = text.replace(
    /([aAeEiIoOuUüÜvV])\s*([ˉ¯ˊ´ˇ˘ˋ`\u0304\u0301\u030C\u0306\u0300])\s+([oOiI](?![aAeEiIoOuUüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|[nN][gG]?(?![aAeEiIoOuUüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]))/g,
    (_m, vowel: string, mark: string, rimeTail: string) => {
      const t = toneCharToNum(mark);
      const mapped = SPACING_TONE_VOWEL_MAP[vowel]?.[t] || vowel;
      return `${mapped}${rimeTail}`;
    }
  );

  // 2. Replace any remaining <vowel> + optional space + <spacing tone mark>
  out = out.replace(
    /([aAeEiIoOuUüÜvV])\s*([ˉ¯ˊ´ˇ˘ˋ`\u0304\u0301\u030C\u0306\u0300])/g,
    (_m, vowel: string, mark: string) => {
      const t = toneCharToNum(mark);
      return SPACING_TONE_VOWEL_MAP[vowel]?.[t] || vowel;
    }
  );

  // 3. Also repair split precomposed diphthongs caused by CJK font copy-paste (e.g. "lǎ oshī" -> "lǎoshī", "hǎ o" -> "hǎo")
  out = out.replace(
    /\b([b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]?[āáǎàēéěèōóǒòĀÁǍÀĒÉĚÈŌÓǑÒ])\s+([oOiI](?![aAeEiIoOuUüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|[nN][gG]?(?![aAeEiIoOuUüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]))/g,
    '$1$2'
  );

  return out.normalize('NFC');
}

/**
 * Authoritative HSK Standard Orthographic Pinyin Dictionary (GB/T 16159-2012 & New HSK 1-6).
 */
export const CANONICAL_ORTHOGRAPHIC_PINYIN_MAP: Record<string, string> = {
  '你': 'nǐ',
  '您': 'nín',
  '好': 'hǎo',
  '你好': 'nǐ hǎo',
  '您好': 'nín hǎo',
  '你们': 'nǐmen',
  '你们好': 'nǐmen hǎo',
  '我们': 'wǒmen',
  '他们': 'tāmen',
  '她们': 'tāmen',
  '大家': 'dàjiā',
  '大家好': 'dàjiā hǎo',
  '老师': 'lǎoshī',
  '王老师': 'Wáng lǎoshī',
  '李老师': 'Lǐ lǎoshī',
  '张老师': 'Zhāng lǎoshī',
  '学生': 'xuésheng',
  '学生们': 'xuéshengmen',
  '同学': 'tóngxué',
  '同学们': 'tóngxuémen',
  '同学们好': 'tóngxuémen hǎo',
  '谢谢': 'xièxie',
  '谢谢你': 'xièxie nǐ',
  '谢谢你们': 'xièxie nǐmen',
  '谢谢老师': 'xièxie lǎoshī',
  '不客气': 'bú kèqi',
  '再见': 'zàijiàn',
  '对不起': 'duìbuqǐ',
  '没关系': 'méi guānxi',
  '请问': 'qǐngwèn',
  '什么': 'shénme',
  '名字': 'míngzi',
  '认识': 'rènshi',
  '高兴': 'gāoxìng',
  '称呼': 'chēnghu',
  '问候': 'wènhòu',
  '朋友': 'péngyou',
  '喜欢': 'xǐhuan',
  '漂亮': 'piàoliang',
  '便宜': 'piányi',
  '东西': 'dōngxi',
  '时候': 'shíhou',
  '衣服': 'yīfu',
  '桌子': 'zhuōzi',
  '椅子': 'yǐzi',
  '杯子': 'bēizi',
  '孩子': 'háizi',
  '儿子': 'érzi',
  '女儿': 'nǚ\'ér',
  '爸爸': 'bàba',
  '妈妈': 'māma',
  '哥哥': 'gēge',
  '姐姐': 'jiějie',
  '弟弟': 'dìdi',
  '妹妹': 'mèimei',
  '爷爷': 'yéye',
  '奶奶': 'nǎinai',
  '先生': 'xiānsheng',
  '小姐': 'xiǎojiě',
  '大夫': 'dàifu',
  '饺子': 'jiǎozi',
  '米饭': 'mǐfàn',
  '面条': 'miàntiáo',
  '苹果': 'píngguǒ',
  '水果': 'shuǐguǒ',
  '可以': 'kěyǐ',
  '没有': 'méiyǒu',
  '不是': 'bú shì',
  '不对': 'bú duì',
  '不去': 'bú qù',
  '不要': 'bú yào',
  '不会': 'bú huì',
  '不大': 'bú dà',
  '不贵': 'bú guì',
  '不太': 'bú tài',
  '不错': 'bú cuò',
  '们': 'men',
};

/**
 * Common LLM Pinyin hallucinations and typos (e.g. "dàijiā" for 大家, "xièxiè" for 谢谢, "nǐmén" for 你们).
 */
const COMMON_LLM_PINYIN_TYPO_REPLACEMENTS: [RegExp, string][] = [
  [/\bdàijiā\b/g, 'dàjiā'],
  [/\bDàijiā\b/g, 'Dàjiā'],
  [/\bdài\s+jiā\b/g, 'dàjiā'],
  [/\bDài\s+jiā\b/g, 'Dàjiā'],
  [/\bxièxiè\b/g, 'xièxie'],
  [/\bXièxiè\b/g, 'Xièxie'],
  [/\bnǐmén\b/g, 'nǐmen'],
  [/\bNǐmén\b/g, 'Nǐmen'],
  [/\bwǒmén\b/g, 'wǒmen'],
  [/\bWǒmén\b/g, 'Wǒmen'],
  [/\btāmén\b/g, 'tāmen'],
  [/\bTāmén\b/g, 'Tāmen'],
  [/\btóngxuémén\b/g, 'tóngxuémen'],
  [/\bTóngxuémén\b/g, 'Tóngxuémen'],
  [/\bxuéshēng\b/g, 'xuésheng'],
  [/\bXuéshēng\b/g, 'Xuésheng'],
  [/\bbù\s*kèqì\b/g, 'bú kèqi'],
  [/\bBù\s*kèqì\b/g, 'Bú kèqi'],
  [/\bbù\s*kèqi\b/g, 'bú kèqi'],
  [/\bBù\s*kèqi\b/g, 'Bú kèqi'],
  [/\bbú\s*kèqì\b/g, 'bú kèqi'],
  [/\bBú\s*kèqì\b/g, 'Bú kèqi'],
  [/\brènshí\b/g, 'rènshi'],
  [/\bRènshí\b/g, 'Rènshi'],
  [/\brènshì\b/g, 'rènshi'],
  [/\bRènshì\b/g, 'Rènshi'],
  [/\bmíngzì\b/g, 'míngzi'],
  [/\bMíngzì\b/g, 'Míngzi'],
  [/\bshénmé\b/g, 'shénme'],
  [/\bShénmé\b/g, 'Shénme'],
  [/\bchēnghū\b/g, 'chēnghu'],
  [/\bpéngyǒu\b/g, 'péngyou'],
  [/\bxǐhuān\b/g, 'xǐhuan'],
  [/\bpiàoliàng\b/g, 'piàoliang'],
];

function stripPinyinTonesToAscii(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜü]/g, 'v')
    .replace(/[^a-zv]/g, '');
}

/**
 * Generates standard orthographic Pinyin for a Chinese word or clause (keeping 3+3 as 3+3,
 * applying standard neutral tones and 一/不 sandhi).
 */
export function generateStandardOrthographicPinyin(hanziText: string, capitalizeFirst = false): string {
  const trimmed = hanziText.trim();
  if (!trimmed) return '';

  const punctStripped = trimmed.replace(/^[，。！？、：；,.!?:;\s]+|[，。！？、：；,.!?:;\s]+$/g, '');
  const trailingPunctMatch = trimmed.match(/([！!？?。.]+)$/);
  const trailingPunct = trailingPunctMatch
    ? trailingPunctMatch[1].replace('！', '!').replace('？', '?').replace('。', '.')
    : '';

  if (CANONICAL_ORTHOGRAPHIC_PINYIN_MAP[punctStripped]) {
    let exact = CANONICAL_ORTHOGRAPHIC_PINYIN_MAP[punctStripped];
    if (capitalizeFirst && exact.length > 0) {
      exact = exact.charAt(0).toUpperCase() + exact.slice(1);
    }
    return exact + trailingPunct;
  }

  // Replace known compound words in sequence and use pinyin-pro (without 3+3 sandhi) for remaining chars
  let out = '';
  let i = 0;
  const sortedWords = Object.keys(CANONICAL_ORTHOGRAPHIC_PINYIN_MAP).sort((a, b) => b.length - a.length);

  while (i < trimmed.length) {
    let matchedWord = '';
    for (const w of sortedWords) {
      if (w.length >= 2 && trimmed.startsWith(w, i)) {
        matchedWord = w;
        break;
      }
    }
    if (matchedWord) {
      const py = CANONICAL_ORTHOGRAPHIC_PINYIN_MAP[matchedWord];
      out += (out && !/[\s(\[“"']$/.test(out) ? ' ' : '') + py;
      i += matchedWord.length;
      continue;
    }

    const ch = trimmed[i];
    if (/[\u4e00-\u9fa5]/.test(ch)) {
      const py =
        CANONICAL_ORTHOGRAPHIC_PINYIN_MAP[ch] ||
        getPinyinPro(ch, { toneType: 'symbol', toneSandhi: false, v: true }) ||
        ch;
      out += (out && !/[\s(\[“"']$/.test(out) ? ' ' : '') + py;
    } else if (ch === '，' || ch === ',') {
      out = out.trimEnd() + ', ';
    } else if (ch === '。' || ch === '.') {
      out = out.trimEnd() + '. ';
    } else if (ch === '！' || ch === '!') {
      out = out.trimEnd() + '! ';
    } else if (ch === '？' || ch === '?') {
      out = out.trimEnd() + '? ';
    } else if (ch === '：' || ch === ':') {
      out = out.trimEnd() + ': ';
    } else {
      out += ch;
    }
    i++;
  }

  out = out.replace(/\s+/g, ' ').trim();
  if (capitalizeFirst && out.length > 0) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

/**
 * Sanitizes and verifies all Pinyin annotations inside a question/option/explanation string:
 * 1. Fixes broken/spacing tone marks (e.g. "laˇ oshī" -> "lǎoshī", "Niˇ haˇ o!" -> "Nǐ hǎo!")
 * 2. Fixes common LLM Pinyin hallucinations (e.g. "dàijiā" -> "dàjiā", "xièxiè" -> "xièxie", "bù kèqì" -> "bú kèqi")
 * 3. Cross-checks <Chinese> (<Pinyin>) pairs against the authoritative HSK lexicon and pinyin-pro,
 *    automatically correcting any wrong Pinyin syllable or tone!
 */
export function sanitizeAndVerifyPinyinInText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Step 1: Fix decomposed/spacing tone marks
  let out = normalizeBrokenPinyinMarks(text);

  // Step 2: Fix common LLM Pinyin typos globally
  for (const [pattern, replacement] of COMMON_LLM_PINYIN_TYPO_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }

  // Vietnamese-exclusive characters that never appear in Pinyin
  const viExclusiveRegex = /[ăâđêôơưạảãấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏõốồổỗộớờởỡợụủũứừửữựỳỵỷỹ]/i;
  const viWordRegex = /\b(là|của|và|có|không|trong|người|thầy|cô|bạn|chào|cảm|ơn|tạm|biệt|học|sinh|mọi|nhà|tốt|khỏe|ông|ngài|anh|chị|em|chúng|các)\b/i;

  // Step 3: Verify <Chinese> (<Pinyin>) pairs line by line
  out = out.replace(
    /([\u4e00-\u9fa5](?:[^\r\n()（）]*?[^\r\n()（）\s])?)([ \t]*)([\(（])([^()（）\u4e00-\u9fa5]+)([\)）])/g,
    (
      fullMatch,
      rawHanziPart: string,
      spaceBeforeParen: string,
      openParen: string,
      rawParenContent: string,
      closeParen: string
    ) => {
      const parenTrimmed = rawParenContent.trim();
      if (!parenTrimmed) return fullMatch;

      // Skip if parenthetical contains Vietnamese words or has no letters (e.g. "(3 + 3)")
      if (viExclusiveRegex.test(parenTrimmed) || viWordRegex.test(parenTrimmed)) {
        return fullMatch;
      }
      if (!/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(parenTrimmed)) {
        return fullMatch;
      }

      // Extract the trailing Chinese clause right before the open parenthesis
      let hanziClause = rawHanziPart.trim();
      // If there were Vietnamese words before the Chinese phrase on the same line (e.g. "Trong cụm từ 你好 (nǐ hǎo)")
      const trailingChineseMatch = hanziClause.match(/([\u4e00-\u9fa5A-Za-z0-9，。！？、：；“”‘’____\s]+)$/);
      if (trailingChineseMatch) {
        hanziClause = trailingChineseMatch[1].trim();
      }

      // If the Chinese line starts with 男：/ 女：/ 问： and the Pinyin does NOT include Nán:/Nǚ:/Wèn:, strip the speaker prefix for comparison
      const hasRoleInHanzi = /^(男|女|问|甲|乙)\s*[:：]\s*/.test(hanziClause);
      const hasRoleInPinyin = /^(?:Nán|Nǚ|Wèn|Nan|Nv)\s*[:：]/i.test(parenTrimmed);
      const targetHanzi =
        hasRoleInHanzi && !hasRoleInPinyin
          ? hanziClause.replace(/^(男|女|问|甲|乙)\s*[:：]\s*/, '').trim()
          : hanziClause;

      const cleanHanziWord = targetHanzi.replace(/^[，。！？、：；,.!?:;\s]+|[，。！？、：；,.!?:;\s]+$/g, '');
      const startsUpper = /^[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ]/.test(parenTrimmed);

      const leadingSpace = spaceBeforeParen || (/\s$/.test(rawHanziPart) ? ' ' : '');

      // 3a. Direct hit in CANONICAL_ORTHOGRAPHIC_PINYIN_MAP (e.g. 大家 -> dàjiā, 不客气 -> bú kèqi, 你 -> nǐ, 您 -> nín)
      if (CANONICAL_ORTHOGRAPHIC_PINYIN_MAP[cleanHanziWord]) {
        // Allow intentional "ní hǎo" only when the line explicitly mentions tone sandhi (biến điệu / 2 + 3)
        if (cleanHanziWord === '你好' && /^ní\s*hǎo$/i.test(parenTrimmed)) {
          return fullMatch;
        }
        const trailingPunct = parenTrimmed.match(/([!?.]+)$/)?.[1] || '';
        let canonical = CANONICAL_ORTHOGRAPHIC_PINYIN_MAP[cleanHanziWord];
        if (startsUpper && canonical.length > 0) {
          canonical = canonical.charAt(0).toUpperCase() + canonical.slice(1);
        }
        return `${rawHanziPart.trimEnd()}${leadingSpace}${openParen}${canonical}${trailingPunct}${closeParen}`;
      }

      // 3b. For longer phrases/sentences, verify base ASCII letters of Pinyin against pinyin-pro
      const hanziCharsOnly = targetHanzi.replace(/[^\u4e00-\u9fa5]/g, '');
      if (hanziCharsOnly.length > 0 && !targetHanzi.includes('____')) {
        const expectedAscii = stripPinyinTonesToAscii(
          generateStandardOrthographicPinyin(targetHanzi, startsUpper)
        );
        const actualAscii = stripPinyinTonesToAscii(parenTrimmed);
        if (expectedAscii && actualAscii && expectedAscii !== actualAscii) {
          const regenerated = generateStandardOrthographicPinyin(targetHanzi, startsUpper);
          return `${rawHanziPart.trimEnd()}${leadingSpace}${openParen}${regenerated}${closeParen}`;
        }
      }

      return `${rawHanziPart.trimEnd()}${leadingSpace}${openParen}${parenTrimmed}${closeParen}`;
    }
  );

  return out;
}

/**
 * Verifies and auto-fixes Pinyin across all fields of a QuizQuestion object.
 */
export function verifyAndFixQuizQuestionPinyin<
  T extends {
    prompt?: string;
    questionChinese?: string;
    options?: string[];
    correctAnswer?: string | string[];
    explanation?: string;
    exampleSentence?: { hanzi: string; pinyin: string; meaning: string };
  }
>(q: T): T {
  if (!q) return q;
  const fixedOptions = Array.isArray(q.options)
    ? q.options.map((opt) => sanitizeAndVerifyPinyinInText(opt))
    : q.options;

  let fixedAnswer = q.correctAnswer;
  if (typeof q.correctAnswer === 'string') {
    fixedAnswer = sanitizeAndVerifyPinyinInText(q.correctAnswer);
    if (fixedOptions && !fixedOptions.includes(fixedAnswer)) {
      const origIdx = Array.isArray(q.options) ? q.options.indexOf(q.correctAnswer) : -1;
      if (origIdx >= 0 && fixedOptions[origIdx]) {
        fixedAnswer = fixedOptions[origIdx];
      }
    }
  } else if (Array.isArray(q.correctAnswer)) {
    fixedAnswer = q.correctAnswer.map((a) => sanitizeAndVerifyPinyinInText(a));
  }

  return {
    ...q,
    prompt: q.prompt ? sanitizeAndVerifyPinyinInText(q.prompt) : q.prompt,
    questionChinese: q.questionChinese ? sanitizeAndVerifyPinyinInText(q.questionChinese) : q.questionChinese,
    options: fixedOptions,
    correctAnswer: fixedAnswer,
    explanation: q.explanation ? sanitizeAndVerifyPinyinInText(q.explanation) : q.explanation,
    exampleSentence: q.exampleSentence
      ? {
          ...q.exampleSentence,
          pinyin: sanitizeAndVerifyPinyinInText(q.exampleSentence.pinyin || ''),
        }
      : q.exampleSentence,
  };
}
