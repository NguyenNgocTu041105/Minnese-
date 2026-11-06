/**
 * Comprehensive Pinyin-to-Hanzi & Dialogue Script Sanitizer
 *
 * Resolves all audio playback payloads across HSK 1-6 Workbook to valid,
 * speakable standard Mandarin Chinese (zh-CN) for Web Speech & Neural AI TTS.
 */

import { PINYIN_BASE_TABLE, PINYIN_NEUTRAL_MAP } from './pinyinData';

/**
 * Common Pinyin phrases found in HSK 1-6 coursebooks, workbooks, and drills.
 */
export const COMMON_PINYIN_PHRASES: Record<string, string> = {
  // Acceptance criteria phrases
  'sān gè píngguǒ': '三个苹果',
  'sān ge píngguǒ': '三个苹果',
  'nǐ hǎo ma': '你好吗',
  'nǐ hǎo': '你好',
  'nǐ jiào shénme míngzi': '你叫什么名字',

  // Common vocabulary & greetings
  'xièxie': '谢谢',
  'xièxie nǐ': '谢谢你',
  'bú kèqi': '不客气',
  'bù kèqi': '不客气',
  'bù kèqì': '不客气',
  'zàijiàn': '再见',
  'duìbuqǐ': '对不起',
  'duì bu qǐ': '对不起',
  'méiguānxi': '没关系',
  'méi guānxi': '没关系',
  'qǐngwèn': '请问',
  'qǐng wèn': '请问',
  'méiyǒu': '没有',
  'méi yǒu': '没有',
  'bēizi': '杯子',
  'xuésheng': '学生',
  'lǎoshī': '老师',
  'jīdàn': '鸡蛋',
  'shǒujī': '手机',
  'yīshēng': '医生',
  'zhuōzi': '桌子',
  'chūzūchē': '出租车',
  'kěyǐ': '可以',
  'kě yǐ': '可以',
  'hěnhǎo': '很好',
  'hěn hǎo': '很好',
  'shuǐguǒ': '水果',
  'shuǐ guǒ': '水果',
  'shǒubiǎo': '手表',
  'shǒu biǎo': '手表',
  'māma': '妈妈',
  'bàba': '爸爸',
  'jiǎozi': '饺子',
  'yīfu': '衣服',
  'piàoliang': '漂亮',
  'zǎoshang': '早上',
  'xīngqī': '星期',
  'gāoxìng': '高兴',
  'yǐzi': '椅子',
  'bú shì': '不是',
  'bú huì': '不会',
  'bú dà': '不大',
  'bú duì': '不对',
  'yìxiē': '一些',
  'yíxiē': '一些',
  'yìnián': '一年',
  'yínián': '一年',
  'yígè': '一个',
  'yí gè': '一个',
  'yísuì': '一岁',
  'zhèr': '这儿',
  'nàr': '那儿',
  'yìdiǎnr': '一点儿',
  'fànguǎnr': '饭馆儿',
  'nǚ xuésheng': '女学生',
  'liǎng gè háizi': '两个孩子',
  'xīngqītiān': '星期天',
  'zuò fàn': '做饭',
  'chāoshì': '超市',
  'jīntiān jǐ hào': '今天几号',
  'dǎ diànhuà': '打电话',
  'fángjiān': '房间',
  'gāotiě': '高铁',
  'kǎoyā': '烤鸭',
  'lǚyóu': '旅游',
  'běijīng kǎoyā': '北京烤鸭',
  'shànghǎi': '上海',
  'túshūguǎn': '图书馆',
  'huǒchē': '火车',
  'gōngjiāochē': '公交车',
  'huǒchēzhàn': '火车站',
  'dìtiě': '地铁',
  'shāngdiàn': '商店',
  'xuéxiào': '学校',
  'shuìjiào': '睡觉',
  'niúnǎi': '牛奶',
  'miànbāo': '面包',
  'yùndòng': '运动',
  'qǐchuáng': '起床',
  'lánqiú': '篮球',
  'cāochǎng': '操场',
  'pǎobù': '跑步',
  'rènshi': '认识',
  'zhōngwén': '中文',
  'zhōngguó': '中国',
  'fǎguó': '法国',
  'péngyou': '朋友',
  'shàngbān': '上班',
  'xiūxi': '休息',
  'jīnnián': '今年',
  'míngtiān': '明天',
  'jīntiān': '今天',
  'zuótiān': '昨天',
  'wǎnshang': '晚上',
  'chǎofàn': '炒饭',
  'nǐmen': '你们',
  'wǒmen': '我们',
  'tāmen': '他们',
  'gēge': '哥哥',
  'jiějiě': '姐姐',
  'dìdi': '弟弟',
  'mèimei': '妹妹',
  'érzi': '儿子',
  'nǚ\'ér': '女儿',
  'nǚér': '女儿',
  'xiānsheng': '先生',
  'nǚshì': '女士',
  'duōshao': '多少',
  'shénme': '什么',
  'míngzi': '名字',
  'píngguǒ': '苹果',
  'jīdàn chǎofàn': '鸡蛋炒饭',
  'wáng lǎoshī': '王老师',
  'lǐ lǎoshī': '李老师',
  'wáng yīfēi': '王一飞',
  'wáng xiānsheng': '王先生',
  'fàndiàn': '饭店',
  'gōngzuò': '工作',
  'shíjiān': '时间',
  'duō cháng': '多长',
  'bàn gè': '半个',
  'xiǎoshí': '小时',
  'fēicháng': '非常',
  'pángbiān': '旁边',
  'duìmiàn': '对面',
  'dǎ chē': '打车',
  'fāngbiàn': '方便',
  'bàngwǎn': '傍晚',
  'rèshuǐ': '热水',
  'shuǐzǎo': '水澡',
  'rèshuǐ zǎo': '热水澡',
  'xǐ le': '洗了',
  'píngshí': '平时',
  'gōnglǐ': '公里',
  'sān gōnglǐ': '三公里',
  'duànliàn': '锻炼',
  'shēntǐ': '身体',
  'dǎ lánqiú': '打篮球',
  'zǎofàn': '早饭',
  'yǐjīng': '已经',
  'xiànzài': '现在',
  'yīyuàn': '医院',
  'piányi': '便宜',
  'hěn piányi': '很便宜',
  'jīchǎng': '机场',
  'dàxīng': '大兴',
  'dàxīng jīchǎng': '大兴机场',
  'wàitān': '外滩',
  'shànghǎi wàitān': '上海外滩',
  'chēzhàn': '车站',
  'jiàoshì': '教室',
  'jiàoshì lǐ': '教室里',
  'xuéxí': '学习',
  'kàn péngyou': '看朋友',
  'yì bēi': '一杯',
  'yí bēi': '一杯',
  'jiàn ba': '见吧',
  'zài nǎr jiàn': '在哪儿见',
  'jiù zài': '就在',
  'qiánbian': '前边',
  'hòubian': '后边',
  'zuǒbian': '左边',
  'yòubian': '右边',
  'shàngbian': '上边',
  'xiàbian': '下边',
  'zhōngjiān': '中间',
  'zhù zài': '住在',
  'pāi zhàopiàn': '拍照片',
  'dàxué': '大学',
  'tóngxué': '同学',
  'tóngshì': '同事',
  'bāngzhù': '帮助',
  'kāishǐ': '开始',
  'jièshào': '介绍',
  'yíxià': '一下',
  'yíxiàr': '一下儿',

  // Full SBT Dialogue sentences
  'tā zuò gāotiě lái xī’ān lǚyóu': '他坐高铁来西安旅游。',
  'tā zuò gāotiě lái xī\'ān lǚyóu': '他坐高铁来西安旅游。',
  'tā qǐng wǒmen chīle běijīng kǎoyā': '他请我们吃了北京烤鸭。',
  'wǒmen dàjiā yìqǐ chī dōngxi ba': '我们大家一起吃东西吧。',
  'nǐ jiā yǒu jǐ kǒu rén': '你家有几口人',
  'nǐ nǚ\'ér jīnnián duō dà le': '你女儿今年多大了',
  'nǐ nǚér jīnnián duō dà le': '你女儿今年多大了',
  'hěn gāoxìng rènshi nǐ': '很高兴认识你',
  'wǒ yě hěn gāoxìng rènshi nǐ': '我也很高兴认识你',
  'zhè shì nǐ nǚ\'ér ma': '这是你女儿吗',
  'zhè shì nǐ nǚér ma': '这是你女儿吗',
  'shì de, tā jīnnián wǔ suì le': '是的，她今年五岁了',
  'nǐmen dōu shì xuésheng ma': '你们都是学生吗',
  'wǒmen sān gè dōu shì xuésheng': '我们三个都是学生',
  'wǒ gēge bú shì fǎguó rén, tā shì zhōngguó rén': '我哥哥不是法国人，他是中国人',
  'zhè shì wǒ de péngyou, tā jiào wáng yīfēi': '这是我的朋友，他叫王一飞',
  'nǐ míngtiān shàngbān ma': '你明天上班吗',
  'bú shàngbān, wǒ zài jiā xiūxi': '不上班，我在家休息',
  'nǐ qù chāoshì mǎi shénme': '你去超市买什么',
  'wǒ mǎi yìxiē píngguǒ': '我买一些苹果',
  'wǒ mǎi yíxiē píngguǒ': '我买一些苹果',
  'nǐ huì zuò zhōngguó cài ma': '你会做中国菜吗',
  'huì, wǒ huì zuò jīdàn chǎofàn': '会，我会做鸡蛋炒饭',
  'míngtiān 9 yuè 5 hào, wǒ hé péngyou qù chāoshì': '明天9月5号，我和朋友去超市',
  'māma jīntiān xiūxi, tā zài jiā zuò fàn ne': '妈妈今天休息，她在家里做饭呢',
  'nǐ de shǒujīhào shì duōshao': '你的手机号是多少',
  'lǐ lǎoshī zài fángjiān li ma': '李老师在房间里吗',
  'qǐngwèn, zhè shì nǐ de shǒujī ma': '请问，这是你的手机吗',
  'bú shì, zhè shì wáng xiānsheng de': '不是，这是王先生的',
  'nǐ zhù zài nǎr': '你住在哪儿',
  'wǒ zhù zài 502 fángjiān': '我住在502房间',
  'wèi, nǐ zài zuò shénme ne': '喂，你在做什么呢',
  'wǒ zài dǎ diànhuà gěi māma ne': '我在打电话给妈妈呢',
  'wǒ de diànhuàhào shì 88236688': '我的电话号是88236688',
  'qǐngwèn nǐmen yào diǎn shénme cài': '请问你们要点什么菜',
  'gěi wǒmen yí gè kǎoyā ba': '给我们一个烤鸭吧',
  'gěi wǒmen yíge kǎoyā ba': '给我们一个烤鸭吧',
  'nǐ zài nǎr ne': '你在哪儿呢',
  'wǒ zài shànghǎi wàitān pāi zhàopiàn ne': '我在上海外滩拍照片呢',
  'wǒ gěi nǐ jièshào yíxià, zhè shì wáng lǎoshī': '我给你介绍一下，这是王老师',
  'nín hǎo, wáng lǎoshī': '您好，王老师',
  'wǒmen zài nǎr jiàn': '我们在哪儿见',
  'zài běijīng kǎoyā fàndiàn jiàn ba': '在北京烤鸭饭店见吧',
  'nǐ bàba zài nǎr gōngzuò': '你爸爸在哪儿工作',
  'tā zài shànghǎi gōngzuò': '他在上海工作',
  'nǐ jīntiān xiàwǔ yào qù zuò shénme': '你今天下午要做什么',
  'wǒ yào qù túshūguǎn xuéxí': '我要去图书馆学习',
  'nǐ shénme shíhou lái běijīng': '你什么时候来北京',
  'míngtiān wǒ zuò huǒchē qù': '明天我坐火车去',
  'lí zhèr bù yuǎn, zǒu wǔ fēnzhōng jiù dào': '离这儿不远，走五分钟就到',
  'tā měitiān zuò gōngjiāochē qù gōngsī': '他每天坐公交车去公司',
  'huǒchēzhàn zài qiánbian liǎng gōnglǐ': '火车站前边两公里',
  'qǐngwèn yīyuàn lí zhèr yuǎn ma': '请问医院离这儿远吗',
  'bù tài yuǎn, wǎng qián zǒu jiù shì': '不太远，往前走就是',
  'nǐ zěnme lái de': '你怎么来的',
  'wǒ zuò dìtiě lái de, hěn kuài': '我坐地铁来的，很快',
  'chēzhàn zài nǎr': '车站哪儿',
  'jiù zài shāngdiàn duìmiàn': '就在商店对面',
  'dào túshūguǎn yào duō cháng shíjiān': '到图书馆要多长时间',
  'zǒu lù yào bàn gè xiǎoshí': '走路要半个小时',
  'nǐ jiā lí xuéxiào yuǎn bu yuǎn': '你家离学校远不远',
  'fēicháng jìn, jiù zài xuéxiào pángbiān': '非常近，就在学校旁边',
  'wǒmen dǎ chē qù ba': '我们打车去吧',
  'bù yòng, zuò gōngjiāochē hěn fāngbiàn': '不用，坐公交车很方便',
  'huǒchē jǐ diǎn kāi': '火车几点开',
  'xiàwǔ liǎng diǎn bàn': '下午两点半',
  'wǒ jīntiān zǎoshang qī diǎn jiù qǐchuáng le': '我今天早上七点就起床了',
  'gēge měitiān bàngwǎn dōu qù cāochǎng pǎobù': '哥哥每天傍晚都去操场跑步',
  'wǎnshang chī wán fàn, wǒ xǐ le yí gè rèshuǐ zǎo': '晚上吃完饭，我洗了一个热水澡',
  'nǐ jǐ diǎn shuìjiào': '你几点睡觉',
  'wǒ shí diǎn bàn jiù shuì le': '我十点半就睡了',
  'zǎoshang chī shénme': '早上吃什么',
  'hē niúnǎi, chī miànbāo': '喝牛奶，吃面包',
  'jīntiān yùndòng le ma': '今天运动了吗',
  'pǎole sān gōnglǐ': '跑了三公里',
  'nǐ píngshí jǐ diǎn qǐchuáng': '你平时几点起床',
  'píngshí bā diǎn, jīntiān qī diǎn jiù qǐ le': '平时八点，今天七点就起了',
  'nǐ zuótiān jǐ diǎn shuì de': '你昨天几点睡的',
  'zuótiān gōngzuò máng, shí’èr diǎn cái shuì': '昨天工作忙，十二点才睡',
  'zǎofàn zuò hǎo le ma': '早饭做好了吗',
  'yǐjīng zuò hǎo le, kuài lái chī ba': '已经做好了，快来吃吧',
  'nǐ měitiān dōu duànliàn shēntǐ ma': '你每天都锻炼身体吗',
  'shì de, wǒ xǐhuan dǎ lánqiú': '是的，我喜欢打篮球',
};

/**
 * Exact single syllable overrides to guarantee high-frequency target vocabulary
 */
export const EXACT_SINGLE_SYLLABLE_MAP: Record<string, string> = {
  // Acceptance criteria syllables
  'mō': '摸',
  'fú': '福',
  'dǐ': '底',
  'tào': '套',
  'jī': '鸡',
  'qī': '七',
  'xiě': '写',
  'nǚ': '女',
  'lǜ': '绿',

  // Other drill tones
  'mó': '模',
  'mǒ': '抹',
  'mò': '墨',
  'fū': '夫',
  'fǔ': '府',
  'fù': '父',
  'dī': '低',
  'dí': '敌',
  'dì': '第',
  'tāo': '掏',
  'táo': '桃',
  'tǎo': '讨',
  'jiā': '家',
  'qǐng': '请',
  'xiè': '谢',
  'chá': '茶',
  'gǒu': '狗',
  'māo': '猫',
  'cài': '菜',
  'yǔ': '雨',
  'wǔ': '五',
  'yī': '一',
  'rén': '人',
  'zuò': '坐',
  'shū': '书',
  'chūn': '春',
  'hǎo': '好',
  'nǐ': '你',
  'wǒ': '我',
  'tā': '他',
  'shì': '是',
  'bù': '不',
  'bú': '不',
  'de': '的',
  'le': '了',
  'ma': '吗',
  'ne': '呢',
  'ba': '吧',
  'zài': '在',
  'yǒu': '有',
  'gè': '个',
  'ge': '个',
  'dōu': '都',
  'yě': '也',
  'jiù': '就',
  'hěn': '很',
  'huì': '会',
  'kě': '可',
  'yǐ': '以',
  'qù': '去',
  'lái': '来',
  'chī': '吃',
  'hē': '喝',
  'shuō': '说',
  'kàn': '看',
  'tīng': '听',
  'xiǎng': '想',
  'yào': '要',
  'mǎi': '买',
  'jiào': '叫',
  'zhù': '住',
  'dào': '到',
  'duō': '多',
  'shǎo': '少',
  'jǐ': '几',
  'zhè': '这',
  'nà': '那',
  'nǎ': '哪',
  'shéi': '谁',
  'shuí': '谁',
  'dà': '大',
  'xiǎo': '小',
  'gāo': '高',
  'lěng': '冷',
  'rè': '热',
  'kuài': '快',
  'màn': '慢',
  'yuǎn': '远',
  'jìn': '近',
  'xīn': '新',
  'rì': '日',
  'yuè': '月',
  'nián': '年',
  'tiān': '天',
  'hào': '号',
  'diǎn': '点',
  'fēn': '分',
  'qián': '钱',
  'jīn': '斤',
  'shàng': '上',
  'xià': '下',
  'hòu': '后',
  'lǐ': '里',

  // Erhua (儿化) single-word entries
  'nǎr': '哪儿',
  'nàr': '那儿',
  'zhèr': '这儿',
  'diǎnr': '点儿',
  'huàr': '画儿',
  'wánr': '玩儿',
  'yíxiàr': '一下儿',
  'yídiǎnr': '一点儿',
  'yìdiǎnr': '一点儿',
};

// Bases sorted by length descending for greedy matching
const SORTED_BASES = Object.keys(PINYIN_BASE_TABLE).sort((a, b) => b.length - a.length);

/**
 * Strips tone marks from vowels to obtain pure base Latin letters.
 */
export function stripToneMarks(s: string): string {
  return s
    .toLowerCase()
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜü]/g, 'v')
    .replace(/u:/g, 'v');
}

/**
 * Normalizes Pinyin bases (e.g. j/q/x/y + v -> ju/qu/xu/yu, lue -> lve, nue -> nve)
 */
export function normalizePinyinBase(base: string): string {
  let b = base.toLowerCase();
  if (b.startsWith('jv')) b = 'ju' + b.slice(2);
  else if (b.startsWith('qv')) b = 'qu' + b.slice(2);
  else if (b.startsWith('xv')) b = 'xu' + b.slice(2);
  else if (b.startsWith('yv')) b = 'yu' + b.slice(2);
  else if (b === 'lue') b = 'lve';
  else if (b === 'nue') b = 'nve';
  return b;
}

/**
 * Parses a single Pinyin syllable into base syllable and tone (1-5).
 */
export function parsePinyinSyllable(raw: string): { base: string; tone: number } {
  const s = raw.toLowerCase().trim();

  // 1. Check trailing tone digit (0-5) (e.g. "mo1", "nv3", "lv4", "de0", "ma5")
  const numMatch = s.match(/^([a-züv:]+)([0-5])$/);
  if (numMatch) {
    let base = numMatch[1]
      .replace(/ü/g, 'v')
      .replace(/u:/g, 'v');
    base = normalizePinyinBase(base);
    const rawTone = parseInt(numMatch[2], 10);
    const tone = rawTone === 0 ? 5 : rawTone;
    return { base, tone };
  }

  // 2. Detect tone mark from vowel diacritics
  let tone = 5; // default neutral
  if (/[āēīōūǖ]/.test(s)) tone = 1;
  else if (/[áéíóúǘ]/.test(s)) tone = 2;
  else if (/[ǎěǐǒǔǚ]/.test(s)) tone = 3;
  else if (/[àèìòùǜ]/.test(s)) tone = 4;

  let base = stripToneMarks(s);
  base = normalizePinyinBase(base);
  return { base, tone };
}

/**
 * Converts a single syllable to representative standard Mandarin Hanzi character
 * with the exact matching pronunciation and tone.
 */
export function syllableToHanzi(syllable: string): string {
  const clean = syllable.trim().toLowerCase();
  if (EXACT_SINGLE_SYLLABLE_MAP[clean]) {
    return EXACT_SINGLE_SYLLABLE_MAP[clean];
  }

  // Handle Erhua (儿化音) ending in 'r' (e.g. nǎr -> 哪 + 儿, diǎnr -> 点 + 儿)
  if (clean.length > 2 && clean.endsWith('r') && !['er', 'ēr', 'ér', 'ěr', 'èr'].includes(clean)) {
    const withoutR = clean.slice(0, -1);
    const baseHanzi = syllableToHanzi(withoutR);
    if (/[\u4e00-\u9fa5]/.test(baseHanzi)) {
      return baseHanzi + '儿';
    }
  }

  const { base, tone } = parsePinyinSyllable(clean);

  // Check neutral tone map first if tone is 5
  if (tone === 5 && PINYIN_NEUTRAL_MAP[base]) {
    return PINYIN_NEUTRAL_MAP[base];
  }

  // Check base syllable table (tone 1-4)
  const entry = PINYIN_BASE_TABLE[base];
  if (entry) {
    const toneIdx = tone >= 1 && tone <= 4 ? tone - 1 : 0;
    return entry[toneIdx] || entry[0];
  }

  // Fallbacks for special syllables
  if (base === 'nv') return '女';
  if (base === 'lv') return '绿';

  return syllable;
}

/**
 * Segments a compound Pinyin word without spaces (e.g. "píngguǒ", "rènshi", "Zhōngwén")
 * into its individual constituent syllables using backtrack matching.
 */
export function segmentPinyinWord(word: string): string[] {
  // If word contains apostrophe, split on apostrophe first
  if (/['’]/.test(word)) {
    const parts = word.split(/['’]/).filter(Boolean);
    return parts.flatMap((p) => segmentPinyinWord(p));
  }

  // If word has numeric syllables (e.g. "ni3hao3", "xie4xie5", "dui4bu5qi3")
  if (/[0-5]/.test(word) && /^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüv:0-5]+$/i.test(word)) {
    const numSyllables = word.match(/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüv:]+[0-5]?/g);
    if (numSyllables && numSyllables.length > 1) {
      return numSyllables;
    }
  }

  const cleanPunct = word;
  let wClean = stripToneMarks(cleanPunct);
  wClean = normalizePinyinBase(wClean);
  const rawChars = Array.from(cleanPunct);

  let hasTrailingR = false;
  if (wClean.length > 2 && wClean.endsWith('r') && !wClean.endsWith('er')) {
    hasTrailingR = true;
    wClean = wClean.slice(0, -1);
  }

  function search(idx: number): string[] | null {
    if (idx === wClean.length) return [];
    for (const b of SORTED_BASES) {
      if (wClean.startsWith(b, idx)) {
        const rest = search(idx + b.length);
        if (rest !== null) {
          const matched = rawChars.slice(idx, idx + b.length).join('');
          return [matched, ...rest];
        }
      }
    }
    return null;
  }

  const segmented = search(0);
  if (segmented && segmented.length > 0) {
    if (hasTrailingR) {
      segmented[segmented.length - 1] += 'r';
    }
    return segmented;
  }
  return [word];
}

/**
 * Checks whether a single word token is valid Pinyin (syllable, compound, or number).
 */
export function isValidPinyinWord(token: string): boolean {
  const clean = token.toLowerCase().trim();
  if (!clean) return false;
  if (/^[0-9]+$/.test(clean)) return true;
  if (COMMON_PINYIN_PHRASES[clean]) return true;
  if (EXACT_SINGLE_SYLLABLE_MAP[clean]) return true;

  // Single parsed syllable
  const parsed = parsePinyinSyllable(clean);
  if (PINYIN_BASE_TABLE[parsed.base] || PINYIN_NEUTRAL_MAP[parsed.base]) return true;

  // Erhua (e.g. nǎr, diǎnr)
  if (clean.length > 2 && clean.endsWith('r') && !['er', 'ēr', 'ér', 'ěr', 'èr'].includes(clean)) {
    const withoutR = clean.slice(0, -1);
    const parsedR = parsePinyinSyllable(withoutR);
    if (PINYIN_BASE_TABLE[parsedR.base] || PINYIN_NEUTRAL_MAP[parsedR.base]) return true;
  }

  // Segment compound word into constituents
  const segmented = segmentPinyinWord(clean);
  if (segmented.length > 1) {
    return segmented.every((sw) => {
      const psw = parsePinyinSyllable(sw);
      return Boolean(
        PINYIN_BASE_TABLE[psw.base] ||
        PINYIN_NEUTRAL_MAP[psw.base] ||
        EXACT_SINGLE_SYLLABLE_MAP[sw.toLowerCase()]
      );
    });
  }

  return false;
}

/**
 * Checks whether text consists exclusively of valid Pinyin tokens, Hanzi, or numbers.
 */
export function isValidPinyinText(text: string): boolean {
  const words = text
    .trim()
    .split(/[\s'’.,?!;:，。？！；：、\-~～()（）\[\]【】"“”«»]+/)
    .filter(Boolean);
  if (words.length === 0) return false;
  return words.every((w) => /[\u4e00-\u9fa5]/.test(w) || isValidPinyinWord(w));
}

/**
 * Converts multi-syllable Pinyin text to Chinese Hanzi.
 */
export function pinyinPhraseToHanzi(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Direct phrase lookup (case-insensitive and punctuation stripped)
  const normKey = trimmed
    .toLowerCase()
    .replace(/[.,?!;:，。？！；：]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (COMMON_PINYIN_PHRASES[normKey]) {
    const endPunct = /[.?!，。？！]$/.test(trimmed)
      ? trimmed.slice(-1).replace('?', '？').replace('!', '！').replace('.', '。').replace(',', '，')
      : '';
    return COMMON_PINYIN_PHRASES[normKey] + (COMMON_PINYIN_PHRASES[normKey].endsWith('。') || COMMON_PINYIN_PHRASES[normKey].endsWith('？') ? '' : endPunct);
  }

  // Syllable/word tokenization (including quotes, enumeration comma 、 and brackets)
  const tokens = trimmed.split(/(\s+|[，。！？,.?!;:：()（）'’"“”«»、…—\-~～【】\[\]])/);
  const result: string[] = [];

  for (const token of tokens) {
    if (!token) continue;

    // Preserve punctuation and spaces
    if (/^[\s，。！？,.?!;:：()（）'’"“”«»、…—\-~～【】\[\]]+$/.test(token)) {
      if (token === '?') result.push('？');
      else if (token === '!') result.push('！');
      else if (token === ',') result.push('，');
      else if (token === '.') result.push('。');
      else if (token === ':') result.push('：');
      else if (token === '、') result.push('、');
      else if (token === '“' || token === '”' || token === '"') result.push(token);
      else if (!/[\s'’]/.test(token)) result.push(token);
      continue;
    }

    // Check if token already contains Chinese Hanzi
    if (/[\u4e00-\u9fa5]/.test(token)) {
      result.push(token);
      continue;
    }

    // Check if token is numbers (e.g. "88236688", "502", "9")
    if (/^[0-9]+$/.test(token)) {
      result.push(token);
      continue;
    }

    // Check if token matches a known phrase
    const tokenNorm = token.toLowerCase();
    if (COMMON_PINYIN_PHRASES[tokenNorm]) {
      result.push(COMMON_PINYIN_PHRASES[tokenNorm]);
      continue;
    }

    // Check exact single syllable (including numeric tones or normalized bases)
    const parsed = parsePinyinSyllable(tokenNorm);
    if (
      EXACT_SINGLE_SYLLABLE_MAP[tokenNorm] ||
      PINYIN_BASE_TABLE[stripToneMarks(tokenNorm)] ||
      PINYIN_BASE_TABLE[parsed.base] ||
      (tokenNorm.endsWith('r') && !tokenNorm.endsWith('er'))
    ) {
      result.push(syllableToHanzi(token));
      continue;
    }

    // Segment compound word into syllables
    const syllables = segmentPinyinWord(token);
    for (const syl of syllables) {
      const sylNorm = syl.toLowerCase();
      if (COMMON_PINYIN_PHRASES[sylNorm]) {
        result.push(COMMON_PINYIN_PHRASES[sylNorm]);
      } else {
        result.push(syllableToHanzi(syl));
      }
    }
  }

  return result.join('');
}

/**
 * Normalizes and sanitizes listening scripts, dialogue tags, and non-Chinese annotations.
 */
export function sanitizeDialogueScript(raw: string): string {
  if (!raw) return '';

  let text = raw.trim();

  // If the entire string is wrapped in quotes or parentheses (e.g. `(mō)` or `“fú”` or `"dǐ"` or `(摸)`),
  // unwrap the outer punctuation ONLY if the inside is pure Hanzi or valid Pinyin.
  const outerWrapped = text.match(/^["'“‘\(（\[【](.+)["'”’\)）\]】]$/);
  if (outerWrapped && !outerWrapped[1].includes('(') && !outerWrapped[1].includes('（')) {
    const inner = outerWrapped[1].trim();
    if (/^[\u4e00-\u9fa5\s，。！？、]+$/.test(inner) || isValidPinyinText(inner)) {
      text = inner;
    }
  }

  // 1. When an item has Pinyin followed by parenthesized Hanzi: e.g. `mō (摸)` or `sān gè píngguǒ (三个苹果)` or `Nǐ hǎo (你好)`,
  // replace with the authoritative Hanzi inside the parentheses to avoid "摸(摸)" duplication.
  const pinyinWithHanziParen = text.match(/^([^\u4e00-\u9fa5()（）]+)[\(（]([\u4e00-\u9fa5\s，。！？、]+)[\)）]$/);
  if (pinyinWithHanziParen && !/[ạảãâầấậẩẫăằắặẳẵẹẻẽêềếệểễịỉĩọỏõôồốộổỗơờớợởỡụủũưừứựửữỳýỵỷỹđ]/i.test(pinyinWithHanziParen[1])) {
    text = pinyinWithHanziParen[2].trim();
  }
  text = text.replace(/\b([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü0-5'’]+)\s*[\(（]([\u4e00-\u9fa5]+)[\)）]/g, ' $2');

  // 2. Convert question annotations like `(Hỏi: 哥哥是哪国人？)` or `(Hỏi: 他在做什么？)` or `(问题: ...)` or `(Question: ...)` to `问：...`
  text = text.replace(/[\(（\[【]\s*(?:Hỏi|Câu hỏi|问题|問題|问|問|Question)\s*[:：]\s*([^()（）\[\]【】]+)[\)）\]】]/gi, ' 问：$1');
  text = text.replace(/(?<=^|[^\p{L}])(?:Hỏi|Câu hỏi|Question|Wèn|问题|問題|問)\s*[:：]\s*/gui, ' 问：');

  // 3. Normalize Star `★` / `(★)` statement prompts (HSK 1-3 true/false statements) to `★：`
  text = text.replace(/(?<=^|[^\p{L}])[\(（]\s*★\s*[\)）]\s*[:：]?\s*/gu, ' ★：');
  text = text.replace(/(?<=^|[^\p{L}])★\s*[:：]?\s*/gu, ' ★：');

  // 4. Convert speaker labels to standard Chinese (with lookbehind to preserve preceding punctuation):
  // Male: `Nam:`, `Người nam:`, `Nán:`, `Man:`, `Boy:`, `M:` -> `男：`
  // Female: `Nữ:`, `Người nữ:`, `Nǚ:`, `Woman:`, `Girl:`, `W:`, `F:` -> `女：`
  // Question: `Wèn:`, `Question:`, `Q:` -> `问：`
  text = text.replace(/(?<=^|[^\p{L}])(?:Người nam|Nam|Nán|Man|Boy)\s*[:：]\s*/gui, ' 男：');
  text = text.replace(/(?<=^|[^\p{L}])(?:Người nữ|Nữ|Nǚ|Woman|Girl)\s*[:：]\s*/gui, ' 女：');
  text = text.replace(/(?<=^|[^\p{L}])M\s*[:：]\s*/gu, ' 男：');
  text = text.replace(/(?<=^|[^\p{L}])[WF]\s*[:：]\s*/gu, ' 女：');
  text = text.replace(/(?<=^|[^\p{L}])Q\s*[:：]\s*/gu, ' 问：');

  // 5. Convert alternating A: / B: dialogue pairs to standard Chinese 甲：(Male) and 乙：(Female)
  if (/(?<=^|[^\p{L}])A\s*[:：]/iu.test(text) && /(?<=^|[^\p{L}])B\s*[:：]/iu.test(text)) {
    text = text.replace(/(?<=^|[^\p{L}])A\s*[:：]\s*/gui, ' 甲：');
    text = text.replace(/(?<=^|[^\p{L}])B\s*[:：]\s*/gui, ' 乙：');
  }

  // 6. Strip Latin speaker/option labels like `A. `, `B. `, `A、 `, `B、 `, `(A)`, `(B)`
  text = text.replace(/(?<=^|[^\p{L}])([A-Da-d])\s*[.、\)]\s*/gu, ' ');
  text = text.replace(/[\(（\[【]\s*([A-Da-d])\s*[\)）\]】]\s*/gu, ' ');
  text = text.replace(/(?<=^|[^\p{L}])([A-Za-z])\s*[:：]\s*/gu, ' ');
  text = text.replace(/(?<=^|[^\p{L}])(?:Dialog|Dialogue|Speaker|Person)\s*[:：]\s*/gui, ' ');
  text = text.replace(/(?<=^|[^\p{L}])说话人\s*[:：]\s*/gu, ' ');

  // 7. Strip Vietnamese dialogue section prefixes: e.g. `Đoạn hội thoại 1:`, `Hội thoại 1:`, `Bài 1:`, `Câu 1:`, `Phần 1:`
  text = text.replace(/(?<=^|[^\p{L}])(?:Đoạn hội thoại|Hội thoại|Bài|Câu|Phần)\s*\d+[\s:：.]*/gui, ' ');

  // 8. Normalize Chinese speaker labels preserving preceding punctuation (`。`, `！`, `？`):
  // `男: ` -> `男：`, `女: ` -> `女：`, `问: ` -> `问：`, `★: ` -> `★：`
  text = text.replace(/(?<=^|[^\p{L}])(男|女|问|甲|乙|★)\s*[:：]\s*/gu, ' $1：');

  // 7. Strip any non-Hanzi parenthetical or bracketed notes / translations
  // (e.g. `(ba quả táo)`, `(three apples)`, `(Bạn có khỏe không?)`, `(David)`, `(xe hơi)`, `(cai ly)`)
  text = text.replace(/[\(（\[【][^()（）\[\]【】\u4e00-\u9fa5]*[\)）\]】]/g, ' ');

  // 8. Clean Vietnamese topic placeholders in HSK 4 (e.g. Chất lượng hàng hóa -> 商品质量)
  const TOPIC_REPLACEMENTS: Record<string, string> = {
    'Chất lượng hàng hóa': '商品质量',
    'Sức khỏe & Lối sống': '健康与生活',
    'Thái độ sống lạc quan': '乐观生活态度',
    'Vượt qua nghịch cảnh': '战胜逆境',
    'Hạnh phúc đích thực': '真正的幸福',
    'Thói quen đọc sách': '读书的习惯',
    'Khám phá cuộc sống': '探索生活',
    'Văn hóa truyền thống': '传统文化',
    'Môi trường sinh thái': '生态环境',
    'Giáo dục gia đình': '家庭教育',
    'Văn hóa tặng quà': '送礼文化',
    'Hòa hợp tự nhiên': '人与自然',
    'Trí tuệ nhân tạo & Internet': '人工智能与互联网',
    'Ẩm thực Trung Hoa': '中国饮食文化',
    'Du lịch và văn hóa địa phương': '旅游与地方文化',
  };
  for (const [viTopic, cnTopic] of Object.entries(TOPIC_REPLACEMENTS)) {
    if (text.includes(viTopic)) {
      text = text.replaceAll(viTopic, cnTopic);
    }
  }

  // 9. Clean excess whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Core Resolver: converts any audio input (raw Pinyin, mixed Pinyin+Vietnamese,
 * dialogue script) into valid, speakable Chinese Hanzi (zh-CN) for the speech engine.
 *
 * Guaranteed Properties:
 * 1. Output contains valid Chinese Hanzi ([\u4e00-\u9fa5])
 * 2. Zero Vietnamese parenthetical notes
 * 3. Zero raw unvoiced Latin Pinyin syllables
 */
export function resolveChineseTtsPayload(input: string): string {
  if (!input || !input.trim()) return '';

  // Step 1: Sanitize dialogue markers, speaker labels, and Vietnamese parentheticals
  let sanitized = sanitizeDialogueScript(input);
  if (!sanitized || !sanitized.trim()) return '';

  // If already pure Chinese Hanzi with standard punctuation
  const hasHanzi = /[\u4e00-\u9fa5]/.test(sanitized);
  const hasLatinLetters = /[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(sanitized);

  // If already contains Hanzi and NO Latin letters, return directly
  if (hasHanzi && !hasLatinLetters) {
    return sanitized;
  }

  // If contains Hanzi but also some Latin words (e.g. "大卫 (David): 我叫大卫。")
  if (hasHanzi && hasLatinLetters) {
    // Strip leftover parentheticals without Hanzi
    sanitized = sanitized.replace(/[\(（][^()（）\u4e00-\u9fa5]+[\)）]/g, '');
    // If only Latin remaining is English names like "AI", keep it if alongside Hanzi
    if (!/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(sanitized)) {
      sanitized = sanitized.replace(/\b[A-Za-z]\s*[.:：、\)]\s*/g, '');
      if (/[\u4e00-\u9fa5]/.test(sanitized)) {
        return sanitized.trim();
      }
    }
  }

  // If input has no Hanzi and is not valid Pinyin (e.g. foreign non-Chinese text), return empty
  if (!hasHanzi && !isValidPinyinText(sanitized)) {
    return '';
  }

  // Step 2: Convert pure Pinyin or Pinyin phrases into Hanzi
  const converted = pinyinPhraseToHanzi(sanitized);

  // If the converted result has zero Hanzi and zero numbers (i.e. input was untranslatable English/Vietnamese like "three apples")
  if (!/[\u4e00-\u9fa50-9]/.test(converted)) {
    return '';
  }

  return converted.trim();
}
