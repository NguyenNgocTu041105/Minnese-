/**
 * Pinyin and Tone Color Utilities using pinyin-pro
 * Tone 1 (High Level): Red / Rose (#f43f5e)
 * Tone 2 (Rising): Green / Emerald (#10b981)
 * Tone 3 (Dipping/Falling-Rising): Sky / Blue (#0284c7)
 * Tone 4 (Falling): Purple / Violet (#8b5cf6)
 * Tone 5 (Neutral): Neutral Slate / Gray (#64748b)
 */
import { pinyin as getPinyinPro } from 'pinyin-pro';

export const TONE_COLORS = {
  1: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900',
  2: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900',
  3: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900',
  4: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900',
  5: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800',
};

export const TONE_BADGE_COLORS = {
  1: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  2: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  3: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  4: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  5: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

const TONE_MAP: Record<string, number> = {
  // 1st Tone
  ā: 1, ē: 1, ī: 1, ō: 1, ū: 1, ǖ: 1,
  // 2nd Tone
  á: 2, é: 2, í: 2, ó: 2, ú: 2, ǘ: 2,
  // 3rd Tone
  ǎ: 3, ě: 3, ǐ: 3, ǒ: 3, ǔ: 3, ǚ: 3,
  // 4th Tone
  à: 4, è: 4, ì: 4, ò: 4, ù: 4, ǜ: 4,
};

export function detectTone(syllable: string): 1 | 2 | 3 | 4 | 5 {
  if (!syllable) return 5;
  for (const char of syllable) {
    if (TONE_MAP[char]) {
      return TONE_MAP[char] as 1 | 2 | 3 | 4;
    }
  }
  return 5;
}

/**
 * Get accurate pinyin array for any Chinese word or sentence.
 * Returns an array where array[i] matches hanzi[i] perfectly.
 */
export function getCharPinyinList(hanzi: string, existingPinyin?: string): string[] {
  if (!hanzi) return [];
  const chars = Array.from(hanzi);

  // If existing pinyin has spaces matching character count, use it directly
  if (existingPinyin && existingPinyin.trim().includes(' ')) {
    const parts = existingPinyin.trim().split(/\s+/);
    if (parts.length === chars.length) {
      return parts;
    }
  }

  // Use pinyin-pro for 100% accurate per-character pinyin
  try {
    const list = getPinyinPro(hanzi, {
      toneType: 'symbol',
      type: 'array',
      v: true,
    });
    if (Array.isArray(list) && list.length === chars.length) {
      return list;
    }
  } catch (err) {
    console.warn('getPinyinPro error', err);
  }

  // Fallback: lookup each character individually
  return chars.map((char) => {
    try {
      const charP = getPinyinPro(char, { toneType: 'symbol', type: 'string', v: true });
      if (charP) return charP;
    } catch {
      // ignore
    }
    return '';
  });
}

/**
 * Get accurate pinyin for a single character in context
 */
export function getSingleCharPinyin(char: string, wordHanzi?: string, charIndex = 0): string {
  if (!char) return '';
  if (wordHanzi && wordHanzi.length > 1) {
    const list = getCharPinyinList(wordHanzi);
    if (list[charIndex]) {
      return list[charIndex];
    }
  }

  try {
    const p = getPinyinPro(char, { toneType: 'symbol', type: 'string', v: true });
    if (p) return p;
  } catch {
    // fallback
  }

  return char;
}

export function splitPinyinSyllables(pinyin: string): string[] {
  if (!pinyin) return [];
  if (pinyin.includes(' ')) {
    return pinyin.trim().split(/\s+/);
  }
  // Try using pinyin-pro conversion if it's Chinese, otherwise fallback
  return [pinyin];
}

/**
 * Converts a Chinese sentence or phrase into standard Pinyin with tone marks
 */
export function getSentencePinyin(text: string): string {
  if (!text) return '';
  try {
    return getPinyinPro(text, { toneType: 'symbol' }) || '';
  } catch (err) {
    console.warn('getSentencePinyin error:', err);
    return '';
  }
}
