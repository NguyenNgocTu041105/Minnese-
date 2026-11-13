/**
 * src/utils/pronunciationEval.ts
 *
 * Multilevel Chinese Speech Pronunciation Evaluator
 * Requirements R3 & R7 Implementation
 *
 * Hierarchical Evaluation Cascade:
 * 1. hanzi_exact (Score: 100) — Exact character-by-character match (whitespace & punctuation normalized)
 * 2. hanzi_contains (Score: 95) — Substring match (handles conversational carrier phrases & padding)
 * 3. pinyin_exact (Score: 90) — Exact Pinyin with tone match (resolves homophones like 是 vs 事/视)
 * 4. pinyin_tone_insensitive (Score: 80) — Base Pinyin tone-insensitive match (tone slip / tone omission)
 * 5. none (Score: 0, isCorrect: false) — Fallback / no phonetic or character match
 */

import { pinyin } from 'pinyin-pro';
import type { WordItem } from '../types';

export type PronunciationMatchLevel =
  | 'hanzi_exact'
  | 'hanzi_contains'
  | 'pinyin_exact'
  | 'pinyin_tone_insensitive'
  | 'none';

export type EvalMatchingLevel = PronunciationMatchLevel;

export interface PronunciationResult {
  isCorrect: boolean;
  score: number;
  matchLevel: PronunciationMatchLevel;
  matchedBy: PronunciationMatchLevel;
  recognizedText: string;
  userTranscript: string;
  expectedText: string;
  targetHanzi: string;
  recognizedPinyin: string;
  expectedPinyin: string;
  targetPinyin: string;
  feedback: string;
}

export type EvalResult = PronunciationResult;

/**
 * Normalizes Chinese text by removing whitespace, Western punctuation,
 * and full-width Chinese punctuation while converting to lowercase.
 */
export function normalizeChineseText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/[\s\-_'"`.,!?;:，。！？；：“”‘’（）()《》【】…—~～·@#$%^&*()[\]{}|\\/、\u300c\u300d]/gu, '')
    .toLowerCase();
}

/**
 * Cleans punctuation and non-speech symbols from Hanzi or transcript strings.
 */
export function sanitizeTranscriptPunctuation(str: string): string {
  return normalizeChineseText(str);
}

/**
 * Extracts pinyin representation using `pinyin-pro` with tone diacritics.
 */
export function extractPinyin(text: string): string {
  const clean = normalizeChineseText(text);
  if (!clean) return '';
  return pinyin(clean, { toneType: 'symbol' });
}

/**
 * Strips tone diacritics using Unicode NFD decomposition, leaving base ASCII pinyin syllables.
 */
export function stripTones(pinyinStr: string): string {
  if (!pinyinStr) return '';
  return pinyinStr
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0-9]/g, '')
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/[\s\-_'"`.,!?;:，。！？；：“”‘’（）()《》【】…—~～·@#$%^&*()[\]{}|\\/、\u300c\u300d]/gu, '')
    .toLowerCase();
}

/**
 * Alias for stripTones for compatibility with explorer specifications.
 */
export function stripPinyinTones(str: string): string {
  return stripTones(str);
}

/**
 * Normalizes pinyin string for exact tone comparison.
 * Strips punctuation and symbols while preserving tone diacritics and letters.
 */
export function sanitizePinyinForComparison(p: string): string {
  if (!p) return '';
  return p
    .toLowerCase()
    .replace(/[\-_'"`.,!?;:，。！？；：“”‘’（）()《》【】…—~@#$%^&*()[\]{}|\\/、]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Evaluates learner speech recognition transcript against a target vocabulary word.
 *
 * @param recognized Raw speech recognition transcript (or user-entered text/pinyin)
 * @param expected Target word object (WordItem or { hanzi, pinyin }) or target Hanzi string
 * @returns PronunciationResult containing accuracy, score, match tier, and feedback
 */
export function evaluateSpeechPronunciation(
  recognized: string,
  expected: string | { hanzi: string; pinyin?: string; id?: string } | WordItem
): PronunciationResult {
  const rawTranscript = (recognized || '').trim();

  let targetHanzi = '';
  let targetPinyin = '';

  if (typeof expected === 'string') {
    targetHanzi = (expected || '').trim();
    targetPinyin = targetHanzi ? extractPinyin(targetHanzi) : '';
  } else if (expected && typeof expected === 'object') {
    targetHanzi = (expected.hanzi || '').trim();
    targetPinyin = (
      expected.pinyin || (targetHanzi ? extractPinyin(targetHanzi) : '')
    )
      .trim()
      .toLowerCase();
  }

  // Guard: Empty transcript or missing target word
  if (!rawTranscript || !targetHanzi) {
    return {
      isCorrect: false,
      score: 0,
      matchLevel: 'none',
      matchedBy: 'none',
      recognizedText: rawTranscript,
      userTranscript: rawTranscript,
      expectedText: targetHanzi,
      targetHanzi,
      recognizedPinyin: '',
      expectedPinyin: targetPinyin,
      targetPinyin,
      feedback: 'Chưa nhận diện được phát âm chính xác. Hãy thử lại!',
    };
  }

  const cleanTranscript = normalizeChineseText(rawTranscript);
  const cleanTargetHanzi = normalizeChineseText(targetHanzi);

  // If transcript was entirely punctuation or empty after normalization
  if (!cleanTranscript || !cleanTargetHanzi) {
    return {
      isCorrect: false,
      score: 0,
      matchLevel: 'none',
      matchedBy: 'none',
      recognizedText: rawTranscript,
      userTranscript: rawTranscript,
      expectedText: targetHanzi,
      targetHanzi,
      recognizedPinyin: '',
      expectedPinyin: targetPinyin,
      targetPinyin,
      feedback: 'Chưa nhận diện được phát âm chính xác. Hãy thử lại!',
    };
  }

  // Calculate recognized Pinyin for feedback & phonetic matching
  const hasChineseChars = /[\u4e00-\u9fa5]/.test(cleanTranscript);
  const recognizedPinyin = hasChineseChars
    ? extractPinyin(cleanTranscript)
    : sanitizePinyinForComparison(rawTranscript);

  // 1. Tier 1: Exact Hanzi match (Score: 100)
  if (cleanTranscript === cleanTargetHanzi) {
    return {
      isCorrect: true,
      score: 100,
      matchLevel: 'hanzi_exact',
      matchedBy: 'hanzi_exact',
      recognizedText: rawTranscript,
      userTranscript: rawTranscript,
      expectedText: targetHanzi,
      targetHanzi,
      recognizedPinyin,
      expectedPinyin: targetPinyin,
      targetPinyin,
      feedback: 'Phát âm hoàn hảo! (Chính xác 100%)',
    };
  }

  // 2. Tier 2: Substring Hanzi match (Score: 95)
  // Handles conversational padding (e.g. "我觉得你好", "你说谢谢")
  if (cleanTranscript.includes(cleanTargetHanzi)) {
    return {
      isCorrect: true,
      score: 95,
      matchLevel: 'hanzi_contains',
      matchedBy: 'hanzi_contains',
      recognizedText: rawTranscript,
      userTranscript: rawTranscript,
      expectedText: targetHanzi,
      targetHanzi,
      recognizedPinyin,
      expectedPinyin: targetPinyin,
      targetPinyin,
      feedback: 'Phát âm rất tốt! (Nhận diện chính xác từ khóa)',
    };
  }

  // 3. Tier 3: Exact Pinyin with tone match (Score: 90)
  // Resolves homophones: e.g. target "是" (shì), user says "shì", ASR transcribes "事" or "视"
  const targetPinyinNorm = sanitizePinyinForComparison(targetPinyin).replace(/\s+/g, '');
  const transcriptPinyinNorm = sanitizePinyinForComparison(recognizedPinyin).replace(/\s+/g, '');

  if (
    transcriptPinyinNorm.length > 0 &&
    targetPinyinNorm.length > 0 &&
    transcriptPinyinNorm === targetPinyinNorm
  ) {
    return {
      isCorrect: true,
      score: 90,
      matchLevel: 'pinyin_exact',
      matchedBy: 'pinyin_exact',
      recognizedText: rawTranscript,
      userTranscript: rawTranscript,
      expectedText: targetHanzi,
      targetHanzi,
      recognizedPinyin,
      expectedPinyin: targetPinyin,
      targetPinyin,
      feedback: 'Phát âm đúng phiên âm! (Chuẩn âm điệu)',
    };
  }

  // 4. Tier 4: Base Pinyin tone-insensitive match (Score: 80)
  // Handles tone omissions, neutral tones, and minor learner tone slips (e.g. "ni hao" vs "nǐ hǎo")
  const targetPinyinNoTone = stripTones(targetPinyin);
  const transcriptPinyinNoTone = hasChineseChars
    ? stripTones(pinyin(cleanTranscript, { toneType: 'none' }) || recognizedPinyin)
    : stripTones(rawTranscript);

  if (
    transcriptPinyinNoTone.length > 0 &&
    targetPinyinNoTone.length > 0 &&
    transcriptPinyinNoTone === targetPinyinNoTone
  ) {
    return {
      isCorrect: true,
      score: 80,
      matchLevel: 'pinyin_tone_insensitive',
      matchedBy: 'pinyin_tone_insensitive',
      recognizedText: rawTranscript,
      userTranscript: rawTranscript,
      expectedText: targetHanzi,
      targetHanzi,
      recognizedPinyin,
      expectedPinyin: targetPinyin,
      targetPinyin,
      feedback: 'Phát âm chấp nhận được (Cần chú ý thanh điệu)',
    };
  }

  // Substring tone-insensitive match for conversational carrier phrase with tone drop.
  // Single-character words (targetHanzi.length === 1) strictly require word boundaries
  // against Latin transcripts to prevent English noise word leaks (e.g. "meeting" vs "听", "length" vs "冷").
  const cleanSpacedTranscript = rawTranscript
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0-9]/g, '')
    .replace(/[\u200B\uFEFF]/g, '')
    .toLowerCase()
    .replace(/[\-_'"`.,!?;:，。！？；：“”‘’（）()《》【】…—~～·@#$%^&*()[\]{}|\\/、\u300c\u300d]/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  const isWordBoundaryMatch = new RegExp(`(^|\\s|\\b)${targetPinyinNoTone}(\\b|\\s|$)`, 'i').test(cleanSpacedTranscript);

  if (
    targetPinyinNoTone.length >= 2 &&
    transcriptPinyinNoTone.includes(targetPinyinNoTone) &&
    (hasChineseChars ||
      (targetHanzi.length >= 2 && targetPinyinNoTone.length >= 4) ||
      isWordBoundaryMatch)
  ) {
    return {
      isCorrect: true,
      score: 80,
      matchLevel: 'pinyin_tone_insensitive',
      matchedBy: 'pinyin_tone_insensitive',
      recognizedText: rawTranscript,
      userTranscript: rawTranscript,
      expectedText: targetHanzi,
      targetHanzi,
      recognizedPinyin,
      expectedPinyin: targetPinyin,
      targetPinyin,
      feedback: 'Phát âm chấp nhận được (Cần chú ý thanh điệu)',
    };
  }

  // 5. Tier 5: Fallback / No match (Score: 0, isCorrect: false)
  return {
    isCorrect: false,
    score: 0,
    matchLevel: 'none',
    matchedBy: 'none',
    recognizedText: rawTranscript,
    userTranscript: rawTranscript,
    expectedText: targetHanzi,
    targetHanzi,
    recognizedPinyin,
    expectedPinyin: targetPinyin,
    targetPinyin,
    feedback: 'Chưa nhận diện được phát âm chính xác. Hãy thử lại!',
  };
}

/**
 * Returns true if the recognized speech meets or exceeds acceptable pronunciation thresholds.
 */
export function isPronunciationAcceptable(
  recognized: string,
  expected: string | { hanzi: string; pinyin?: string; id?: string } | WordItem
): boolean {
  return evaluateSpeechPronunciation(recognized, expected).isCorrect;
}
