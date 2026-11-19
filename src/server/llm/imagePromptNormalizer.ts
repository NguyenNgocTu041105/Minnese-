/**
 * Step 0 Image Prompt Normalization & Anti-Leakage Filtering
 *
 * Converts raw question image requirements, [IMG: ...] tags, and Chinese vocabulary
 * into normalized English image prompts, concise stock photo queries, and guaranteed
 * 27-theme SVG fallbacks while strictly forbidding Chinese text/characters inside
 * generated images to prevent answer leakage.
 */

import {
  VALID_ILLUSTRATION_THEMES,
  IllustrationTheme,
  isValidIllustrationTheme,
  THEME_KEYWORD_MAP,
  inferThemeFromText,
} from './promptTemplates.js';

export interface NormalizedImagePrompt {
  /** The original un-normalized input string */
  rawPrompt: string;
  /** High-quality English generation prompt with anti-leak text prohibition */
  imagePromptEn: string;
  /** Concise 1-4 word English search query for stock photo engines */
  stockQueryEn: string;
  /** Guaranteed fallback vector SVG theme from the 27 VALID_ILLUSTRATION_THEMES */
  fallbackSvgTheme: IllustrationTheme;
  /** Anti-leak negative prompt strictly excluding text, letters, and Hanzi */
  negativePrompt: string;
}

/**
 * Strict anti-leak negative prompt to prevent generated images from containing
 * characters, words, letters, subtitles, or labels that reveal exam answers.
 */
export const ANTI_LEAK_NEGATIVE_PROMPT =
  'text, watermark, logo, Chinese characters, hanzi, letters, words, subtitles, signs, writing, typography, label, signature, low quality, blurry, deformed, distorted, extra limbs, banner text';

/**
 * Common Chinese vocabulary mapping to English descriptions and fallback SVG themes.
 */
interface TermMapping {
  chinese: string;
  english: string;
  stockQuery: string;
  theme: IllustrationTheme;
}

export const CHINESE_TERM_MAPPINGS: TermMapping[] = [
  // Vehicles & Transportation
  { chinese: '出租车', english: 'yellow city taxi car', stockQuery: 'yellow taxi', theme: 'taxi' },
  { chinese: '打车', english: 'hailing a taxi on city street', stockQuery: 'taxi street', theme: 'taxi' },
  { chinese: '飞机', english: 'passenger airplane flying in clear sky', stockQuery: 'airplane flight', theme: 'airplane' },
  { chinese: '机场', english: 'modern airport terminal runway', stockQuery: 'airport', theme: 'airplane' },
  { chinese: '火车', english: 'modern high-speed passenger train', stockQuery: 'train railway', theme: 'train' },
  { chinese: '火车站', english: 'railway train station platform', stockQuery: 'train station', theme: 'train' },
  { chinese: '自行车', english: 'bicycle parked by city park', stockQuery: 'bicycle', theme: 'running' },
  { chinese: '公共汽车', english: 'city passenger bus', stockQuery: 'city bus', theme: 'taxi' },
  { chinese: '公交车', english: 'city passenger bus', stockQuery: 'city bus', theme: 'taxi' },
  { chinese: '地铁', english: 'subway metro train', stockQuery: 'subway train', theme: 'train' },
  { chinese: '船', english: 'boat sailing on lake water', stockQuery: 'boat water', theme: 'water' },

  // Food & Beverage
  { chinese: '苹果', english: 'fresh red apple fruit on a wooden table', stockQuery: 'red apple', theme: 'apple' },
  { chinese: '香蕉', english: 'fresh yellow banana fruit on a wooden table', stockQuery: 'yellow banana', theme: 'banana' },
  { chinese: '西瓜', english: 'fresh red watermelon slice on a wooden table', stockQuery: 'watermelon slice', theme: 'watermelon' },
  { chinese: '米饭', english: 'steaming bowl of white cooked rice', stockQuery: 'bowl of rice', theme: 'rice' },
  { chinese: '做饭', english: 'cooking a delicious meal in kitchen', stockQuery: 'cooking food', theme: 'rice' },
  { chinese: '面条', english: 'bowl of traditional noodle soup', stockQuery: 'noodles bowl', theme: 'rice' },
  { chinese: '饺子', english: 'plate of Chinese steamed dumplings', stockQuery: 'dumplings', theme: 'rice' },
  { chinese: '茶', english: 'traditional ceramic cup of warm green tea', stockQuery: 'cup of tea', theme: 'tea' },
  { chinese: '喝茶', english: 'drinking hot tea from ceramic teacup', stockQuery: 'hot tea cup', theme: 'tea' },
  { chinese: '咖啡', english: 'steaming mug of black coffee with crema', stockQuery: 'coffee mug', theme: 'coffee' },
  { chinese: '喝水', english: 'glass of fresh clear drinking water', stockQuery: 'glass of water', theme: 'water' },
  { chinese: '水', english: 'glass of clean pure water', stockQuery: 'glass of water', theme: 'water' },
  { chinese: '牛奶', english: 'glass of fresh white milk', stockQuery: 'glass of milk', theme: 'water' },
  { chinese: '蛋糕', english: 'sweet birthday cake slice', stockQuery: 'cake slice', theme: 'apple' },
  { chinese: '面包', english: 'fresh loaf of baked bread', stockQuery: 'fresh bread', theme: 'rice' },

  // Animals
  { chinese: '猫', english: 'cute domestic cat resting peacefully', stockQuery: 'domestic cat', theme: 'cat' },
  { chinese: '小猫', english: 'cute little kitten sitting', stockQuery: 'kitten cute', theme: 'cat' },
  { chinese: '狗', english: 'friendly happy pet dog sitting', stockQuery: 'friendly dog', theme: 'cat' },
  { chinese: '小狗', english: 'playful puppy on grass', stockQuery: 'puppy grass', theme: 'cat' },
  { chinese: '鸟', english: 'small colorful songbird perched on tree branch', stockQuery: 'bird branch', theme: 'wind' },
  { chinese: '鱼', english: 'goldfish swimming in clear water', stockQuery: 'fish swimming', theme: 'swimming' },
  { chinese: '熊猫', english: 'giant panda eating green bamboo', stockQuery: 'giant panda', theme: 'cat' },

  // Actions & Sports
  { chinese: '看书', english: 'student reading an open book at desk', stockQuery: 'reading book', theme: 'reading' },
  { chinese: '读书', english: 'person quietly reading book', stockQuery: 'reading book', theme: 'reading' },
  { chinese: '写字', english: 'hand writing carefully with pen on paper', stockQuery: 'writing pen paper', theme: 'writing' },
  { chinese: '写', english: 'notebook and pen writing study', stockQuery: 'notebook writing', theme: 'writing' },
  { chinese: '睡觉', english: 'peaceful night sleep scene with crescent moon, stars, and soft pillow', stockQuery: 'sleeping pillow moon', theme: 'sleeping' },
  { chinese: '跑步', english: 'young athlete running outdoors in park track', stockQuery: 'running runner park', theme: 'running' },
  { chinese: '游泳', english: 'swimmer swimming in clean blue swimming pool', stockQuery: 'swimming pool', theme: 'swimming' },
  { chinese: '足球', english: 'soccer ball on outdoor green grass pitch', stockQuery: 'soccer ball pitch', theme: 'soccer' },
  { chinese: '踢足球', english: 'young player playing soccer on field', stockQuery: 'playing soccer', theme: 'soccer' },
  { chinese: '唱歌', english: 'singer singing with microphone on stage', stockQuery: 'singing microphone', theme: 'singing' },
  { chinese: '跳舞', english: 'graceful dancer performing dance routine', stockQuery: 'dance performer', theme: 'dance' },
  { chinese: '握手', english: 'two business partners professional handshake greeting', stockQuery: 'business handshake', theme: 'handshake' },
  { chinese: '打电话', english: 'person talking on mobile telephone', stockQuery: 'talking phone', theme: 'phone' },
  { chinese: '听音乐', english: 'person wearing headphones listening to music', stockQuery: 'headphones music', theme: 'singing' },
  { chinese: '买东西', english: 'shopper holding grocery shopping bag', stockQuery: 'grocery shopping', theme: 'apple' },
  { chinese: '购物', english: 'shopping in supermarket aisle', stockQuery: 'supermarket shopping', theme: 'apple' },

  // Places & Objects
  { chinese: '医院', english: 'modern clean hospital clinic building', stockQuery: 'hospital clinic', theme: 'hospital' },
  { chinese: '医生', english: 'friendly medical doctor with stethoscope in clinic', stockQuery: 'doctor medical clinic', theme: 'hospital' },
  { chinese: '看病', english: 'doctor examining patient in clinic consultation room', stockQuery: 'doctor patient clinic', theme: 'hospital' },
  { chinese: '护士', english: 'caring healthcare nurse in medical facility', stockQuery: 'nurse clinic', theme: 'hospital' },
  { chinese: '学校', english: 'sunny exterior of school educational campus', stockQuery: 'school building campus', theme: 'reading' },
  { chinese: '图书馆', english: 'quiet library room with tall wooden bookshelves', stockQuery: 'library bookshelves', theme: 'bookshelf' },
  { chinese: '书架', english: 'wooden bookshelf neatly filled with hardcover books', stockQuery: 'bookshelf books', theme: 'bookshelf' },
  { chinese: '电影院', english: 'cinema auditorium with red seats and movie screen', stockQuery: 'cinema movie theater', theme: 'movie' },
  { chinese: '电影', english: 'film reel and cinema auditorium screen', stockQuery: 'cinema movie screen', theme: 'movie' },
  { chinese: '电话', english: 'smartphone on wooden office desk', stockQuery: 'smartphone desk', theme: 'phone' },
  { chinese: '手机', english: 'modern touchscreen smartphone on desk', stockQuery: 'smartphone mobile', theme: 'phone' },
  { chinese: '电脑', english: 'laptop computer open on clean study desk', stockQuery: 'laptop desk', theme: 'writing' },
  { chinese: '桌子', english: 'wooden study table with chair in bright room', stockQuery: 'wooden study desk', theme: 'reading' },
  { chinese: '雨伞', english: 'open umbrella protecting against raindrops', stockQuery: 'umbrella rain', theme: 'rain' },
  { chinese: '衣服', english: 'clean casual clothes hanging on rack', stockQuery: 'clean clothes wardrobe', theme: 'dance' },

  // Weather & Environment
  { chinese: '下雨', english: 'gentle rain falling on city street with puddles', stockQuery: 'rain city street', theme: 'rain' },
  { chinese: '雨天', english: 'rainy weather outdoors with rain drops', stockQuery: 'rainy weather', theme: 'rain' },
  { chinese: '雨', english: 'rain falling on window glass', stockQuery: 'rain window', theme: 'rain' },
  { chinese: '晴天', english: 'bright sunny sky with pleasant sunshine and green park', stockQuery: 'sunny day park', theme: 'sunny' },
  { chinese: '太阳', english: 'warm glowing sun shining in clear blue sky', stockQuery: 'bright sun sky', theme: 'sunny' },
  { chinese: '刮风', english: 'windy autumn breeze swaying green tree branches', stockQuery: 'wind tree breeze', theme: 'wind' },
  { chinese: '大风', english: 'strong wind outdoors with leaves blowing', stockQuery: 'strong wind outdoors', theme: 'wind' },
  { chinese: '风', english: 'breeze blowing through open nature field', stockQuery: 'wind nature breeze', theme: 'wind' },
];

/**
 * English keyword mapping to the 27 SVG themes
 */
const ENGLISH_KEYWORD_THEME_MAP: Array<{ regex: RegExp; theme: IllustrationTheme }> = [
  { regex: /\b(?:taxi|cab|uber)\b/i, theme: 'taxi' },
  { regex: /\b(?:apple|apples|fruit)\b/i, theme: 'apple' },
  { regex: /\b(?:banana|bananas)\b/i, theme: 'banana' },
  { regex: /\b(?:watermelon|melon)\b/i, theme: 'watermelon' },
  { regex: /\b(?:read|reading|book|novel|studying)\b/i, theme: 'reading' },
  { regex: /\b(?:write|writing|pen|pencil|notes|letter)\b/i, theme: 'writing' },
  { regex: /\b(?:airplane|aeroplane|flight|airport|plane)\b/i, theme: 'airplane' },
  { regex: /\b(?:train|railway|subway|metro|station)\b/i, theme: 'train' },
  { regex: /\b(?:sleep|sleeping|nap|bed|asleep)\b/i, theme: 'sleeping' },
  { regex: /\b(?:coffee|latte|cappuccino|cafe|espresso)\b/i, theme: 'coffee' },
  { regex: /\b(?:tea|teapot|teacup)\b/i, theme: 'tea' },
  { regex: /\b(?:water|drink|drinking|glass)\b/i, theme: 'water' },
  { regex: /\b(?:sun|sunny|sunshine|daylight|summer)\b/i, theme: 'sunny' },
  { regex: /\b(?:wind|windy|breeze|storm|blow)\b/i, theme: 'wind' },
  { regex: /\b(?:rain|raining|rainy|umbrella|puddle)\b/i, theme: 'rain' },
  { regex: /\b(?:sing|singing|song|singer|microphone)\b/i, theme: 'singing' },
  { regex: /\b(?:dance|dancing|dancer)\b/i, theme: 'dance' },
  { regex: /\b(?:movie|cinema|film|theater)\b/i, theme: 'movie' },
  { regex: /\b(?:phone|telephone|call|calling|cellphone|smartphone)\b/i, theme: 'phone' },
  { regex: /\b(?:cat|kitten|feline|kitty)\b/i, theme: 'cat' },
  { regex: /\b(?:hospital|doctor|nurse|clinic|patient|medicine)\b/i, theme: 'hospital' },
  { regex: /\b(?:rice|cooking|cook|meal|food|dinner|lunch|breakfast|dumpling|noodle)\b/i, theme: 'rice' },
  { regex: /\b(?:bookshelf|bookcase|library|shelf)\b/i, theme: 'bookshelf' },
  { regex: /\b(?:run|running|runner|jog|jogging)\b/i, theme: 'running' },
  { regex: /\b(?:swim|swimming|pool|swimmer)\b/i, theme: 'swimming' },
  { regex: /\b(?:soccer|football|pitch)\b/i, theme: 'soccer' },
  { regex: /\b(?:handshake|shake hands|greeting|deal|agreement|partner)\b/i, theme: 'handshake' },
];

/**
 * Maps any prompt or keyword text to one of the 27 guaranteed VALID_ILLUSTRATION_THEMES.
 */
export function mapToSvgTheme(input: string): IllustrationTheme {
  if (!input || typeof input !== 'string') return 'reading';

  const clean = input.trim().toLowerCase();

  // 1. Direct match with valid theme keys
  if (isValidIllustrationTheme(clean)) {
    return clean;
  }

  // 2. Check Chinese keyword dictionary
  for (const mapping of CHINESE_TERM_MAPPINGS) {
    if (input.includes(mapping.chinese)) {
      return mapping.theme;
    }
  }

  // 3. Built-in inferThemeFromText helper from promptTemplates
  const inferred = inferThemeFromText(input);
  if (inferred && isValidIllustrationTheme(inferred)) {
    return inferred;
  }

  // 4. English keyword regex patterns
  for (const entry of ENGLISH_KEYWORD_THEME_MAP) {
    if (entry.regex.test(clean)) {
      return entry.theme;
    }
  }

  // 5. Deterministic modulo hash across 27 VALID_ILLUSTRATION_THEMES
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % VALID_ILLUSTRATION_THEMES.length;
  return VALID_ILLUSTRATION_THEMES[idx];
}

/**
 * Extracts a concise 1-4 word stock search query from an arbitrary prompt.
 */
export function extractStockQuery(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'education study';

  // Strip tags like [IMG: ...], [IMAGE: ...]
  let cleaned = raw
    .replace(/\[(?:IMG|IMAGE)[:：\s]+([^\]]+)\]/gi, '$1')
    .replace(/【(?:IMG|IMAGE)[:：\s]+([^】]+)】/gi, '$1')
    .replace(/^[#\*\s\-_'"]+|[#\*\s\-_'"]+$/g, '')
    .trim();

  // If Chinese present, check Chinese mapping table first
  for (const mapping of CHINESE_TERM_MAPPINGS) {
    if (cleaned.includes(mapping.chinese)) {
      return mapping.stockQuery;
    }
  }

  // If English, simplify to key nouns and descriptors
  // Remove boilerplate like "minimalist educational photograph of...", "a clean clear..."
  cleaned = cleaned
    .replace(/^(?:a\s+|an\s+|the\s+)?(?:clean|clear|minimalist|educational|photograph\s+of|illustration\s+of|picture\s+of|photo\s+of|image\s+of)\s*/gi, '')
    .replace(/,\s*(?:textbook|neutral|centered|realistic|high quality|no text).*$/gi, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'by', 'with', 'near', 'beside', 'of', 'to', 'and',
    'young', 'old', 'east', 'asian', 'chinese', 'friendly', 'modern', 'bright', 'sunny',
    'clean', 'fresh', 'wearing', 'sitting', 'standing', 'holding', 'looking', 'talking', 'waiting',
  ]);
  const meaningful = words.filter((w) => !stopWords.has(w.toLowerCase()));
  if (meaningful.length > 0) {
    return meaningful.slice(0, 3).join(' ').toLowerCase();
  }
  if (words.length > 0) {
    return words.slice(0, 3).join(' ').toLowerCase();
  }

  return 'education study';
}

/**
 * Step 0 Prompt Normalizer:
 * Translates Chinese terms, extracts concise stock query, applies anti-leakage negative prompt,
 * and maps to one of the 27 guaranteed SVG themes.
 */
export function normalizeImagePrompt(raw: string, _context?: any): NormalizedImagePrompt {
  const rawClean = String(raw || '').trim();

  // 1. Strip outer tags: [IMG: ...], [IMAGE: ...], 【IMG: ...】
  let stripped = rawClean
    .replace(/\[(?:IMG|IMAGE)[:：\s]+([^\]]+)\]/gi, '$1')
    .replace(/【(?:IMG|IMAGE)[:：\s]+([^】]+)】/gi, '$1')
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .trim();

  if (!stripped) {
    stripped = 'educational study illustration';
  }

  // 2. Check if raw contains Chinese characters
  const hasHanzi = /[\u4e00-\u9fa5]/.test(stripped);

  let englishSubject = stripped;
  let matchedTheme: IllustrationTheme | null = null;
  let stockQuery = 'education study';

  if (hasHanzi) {
    // Translate Chinese vocabulary through mapping table
    for (const mapping of CHINESE_TERM_MAPPINGS) {
      if (stripped.includes(mapping.chinese)) {
        englishSubject = mapping.english;
        matchedTheme = mapping.theme;
        stockQuery = mapping.stockQuery;
        break;
      }
    }

    // If still contains Hanzi (unmapped rare term), strip Hanzi to prevent answer leakage in prompt
    if (/[\u4e00-\u9fa5]/.test(englishSubject)) {
      matchedTheme = mapToSvgTheme(stripped);
      englishSubject = `${matchedTheme} illustration`;
      stockQuery = matchedTheme;
    }
  } else {
    // Already in English/Latin
    matchedTheme = mapToSvgTheme(stripped);
    stockQuery = extractStockQuery(stripped);
    // Clean up excessive punctuation and avoid Cloudflare safety false-positive keywords ("in bed", "bedroom", "ripe")
    englishSubject = stripped
      .replace(/[^\w\s,.-]/g, ' ')
      .replace(/\b(?:sleeping\s+in\s+bed|in\s+bed|on\s+a\s+bed|bedroom|bed)\b/gi, 'resting pillow and crescent moon')
      .replace(/\b(?:ripe\s+yellow\s+bananas\s+bunch|ripe\s+yellow\s+bananas|ripe)\b/gi, 'fresh yellow banana fruit')
      .replace(/\s+/g, ' ')
      .trim();
    if (englishSubject.toLowerCase() === 'sleeping') {
      englishSubject = 'peaceful night sleep scene with crescent moon, stars, and soft pillow';
    }
  }

  const finalTheme = matchedTheme || mapToSvgTheme(stripped);

  // 3. Formulate the high-quality educational prompt (full-frame colorful scene, avoiding stark white empty space)
  const imagePromptEn = `Close-up full-frame educational textbook illustration of ${englishSubject}, large centered subject filling the frame, warm soft colorful background setting, vibrant colors, clean modern 2D vector art style, textless`;

  return {
    rawPrompt: rawClean,
    imagePromptEn,
    stockQueryEn: stockQuery,
    fallbackSvgTheme: finalTheme,
    negativePrompt: ANTI_LEAK_NEGATIVE_PROMPT,
  };
}
