/**
 * Custom Exam Sets ("Kho Đề Của Tôi") & Instant CBT Converter (R5)
 *
 * Converts imported/parsed questions (from raw text, Gemini/DeepSeek/Claude/Grok chat output,
 * or .xlsx/.csv/.docx/.pdf files) into interactive Computer-Based Test (CBT) sessions
 * compatible with HSKMockExam.tsx.
 *
 * Also manages persistent Custom Exam Sets in localStorage (`minnese_custom_exam_sets_v1`)
 * and optional backend API (`/api/custom-exams`) without ever touching operational SQLite DBs.
 */

import { HSKExamQuestion } from '../data/hskMockExamFixtures';
import { getExamDurationMinutes } from '../components/HSKMockExam';
import { splitHanziAndPinyin, getSentencePinyin } from './pinyinUtils';

export const STORAGE_KEY_CUSTOM_EXAM_SETS = 'minnese_custom_exam_sets_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CustomExamSet {
  id: string;
  title: string;
  level: number;
  source: string;
  sourceLabel: string;
  timeLimitMinutes: number;
  questionCount: number;
  createdAt: string;
  questions: HSKExamQuestion[];
}

/**
 * Converts a single imported/parsed question object into a playable HSKExamQuestion
 * for the Computer-Based Test (CBT) studio.
 */
export function convertImportedToCbtQuestion(
  raw: any,
  index: number,
  defaultLevel: number = 1
): HSKExamQuestion {
  const level = Number(raw.level) >= 1 && Number(raw.level) <= 6 ? Number(raw.level) : defaultLevel;
  const rawStem = String(raw.stem || '').trim();
  const { hanzi: cleanStemHanzi, pinyin: inlineStemPinyin } = splitHanziAndPinyin(rawStem);
  const stem = cleanStemHanzi || rawStem;
  const pinyinStem =
    String(raw.pinyin || raw.pinyin_stem || inlineStemPinyin || '').trim() ||
    getSentencePinyin(stem);

  const rawOptions: string[] = Array.isArray(raw.options)
    ? raw.options.map((o: any) => String(o ?? '').trim())
    : ['✓ 对 (Đúng)', '✗ 错 (Sai)'];

  const options: string[] = [];
  const optionsPinyin: string[] = [];

  const isTrueFalsePair =
    rawOptions.length === 2 &&
    rawOptions.some((o) => /Đúng|对|√|True/i.test(o)) &&
    rawOptions.some((o) => /Sai|错|×|False/i.test(o));

  if (isTrueFalsePair) {
    options.push('✓ 对 (Đúng)', '✗ 错 (Sai)');
    optionsPinyin.push('duì', 'cuò');
  } else {
    for (let i = 0; i < rawOptions.length; i++) {
      const opt = rawOptions[i].replace(/^[A-F][.、)\s]+/, '').trim();
      const { hanzi, pinyin } = splitHanziAndPinyin(opt);
      const letter = String.fromCharCode(65 + i);
      const cleanChoice = hanzi || opt;
      const formattedChoice =
        rawOptions.length >= 5 && !/^[A-F]\.\s/.test(cleanChoice)
          ? `${letter}. ${cleanChoice}`
          : cleanChoice;
      options.push(formattedChoice);
      optionsPinyin.push(pinyin || getSentencePinyin(cleanChoice));
    }
  }

  const answerIndex =
    typeof raw.answer_idx === 'number'
      ? raw.answer_idx
      : typeof raw.answer_index === 'number'
      ? raw.answer_index
      : 0;

  const hasDialogueMarkers = /(?:^|\s|\n)(男|女|A|B)\s*[:：]/.test(stem);
  const rawSkill = String(raw.skill || raw.section || '').toLowerCase();
  const section: 'listening' | 'reading' | 'writing' =
    rawSkill === 'listening' || raw.part_type?.startsWith('listen_') || hasDialogueMarkers
      ? 'listening'
      : rawSkill === 'writing' || raw.part_type?.startsWith('write_')
      ? 'writing'
      : 'reading';

  let partType = String(raw.part_type || '').trim();
  if (!partType) {
    if (options.length === 2) {
      partType = section === 'listening' ? 'listen_true_false_2opt' : 'read_true_false_2opt';
    } else if (options.length === 5) {
      partType = stem.includes('____') ? 'read_word_bank_5opt' : 'read_sentence_match_5opt';
    } else {
      partType = section === 'listening' ? 'listen_dialogue_4opt' : 'read_fill_blank_4opt';
    }
  }

  // Ensure listening questions have audio_text so the multi-voice AI player speaks them
  const audioText =
    section === 'listening'
      ? String(raw.audio_text || stem).trim()
      : raw.audio_text
      ? String(raw.audio_text).trim()
      : undefined;

  return {
    id: String(raw.id || `cbt_q_${Date.now()}_${index + 1}`),
    level,
    section,
    part_type: partType,
    item_number: index + 1,
    stem,
    pinyin_stem: pinyinStem,
    options,
    options_pinyin: optionsPinyin,
    answer_index: Math.max(0, Math.min(options.length - 1, answerIndex)),
    explanation_vi:
      String(raw.explanation_vi || raw.answer_rationale_vi || '').trim() ||
      `Đáp án đúng là ${options[answerIndex] || options[0]}.`,
    audio_text: audioText,
    illustration: raw.illustration || raw.illustration_theme || undefined,
    options_images: Array.isArray(raw.options_images) ? raw.options_images : undefined,
  };
}

/**
 * Converts an array of imported items or candidate questions into a CustomExamSet.
 */
export function createCustomExamSet(params: {
  title: string;
  level: number;
  source?: string;
  sourceLabel?: string;
  timeLimitMinutes?: number;
  rawQuestions: any[];
}): CustomExamSet {
  const level = Math.min(6, Math.max(1, Number(params.level) || 1));
  const questions = (params.rawQuestions || []).map((item, idx) => {
    const qObj = item?.question ? item.question : item;
    return convertImportedToCbtQuestion(qObj, idx, level);
  });

  const timeLimitMinutes =
    params.timeLimitMinutes && params.timeLimitMinutes > 0
      ? params.timeLimitMinutes
      : getExamDurationMinutes(level);

  const resolvedSource = (params.sourceLabel || params.source || 'Multi-Source Import').trim();

  return {
    id: `custom_exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: params.title?.trim() || `Đề thi HSK ${level} (${questions.length} câu)`,
    level,
    source: resolvedSource,
    sourceLabel: resolvedSource,
    timeLimitMinutes,
    questionCount: questions.length,
    createdAt: new Date().toISOString(),
    questions,
  };
}

function resolveStorage(customStorage?: StorageLike): StorageLike | null {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

/**
 * Loads all saved Custom Exam Sets from localStorage.
 */
export function loadCustomExamSets(customStorage?: StorageLike): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY_CUSTOM_EXAM_SETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a Custom Exam Set to localStorage and returns the updated list.
 */
export function saveCustomExamSetToStorage(
  examSet: CustomExamSet,
  customStorage?: StorageLike
): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  const existing = loadCustomExamSets(customStorage).filter((item) => item.id !== examSet.id);
  const updated = [examSet, ...existing];
  if (store) {
    try {
      store.setItem(STORAGE_KEY_CUSTOM_EXAM_SETS, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  }
  return updated;
}

/**
 * Deletes a Custom Exam Set by ID from localStorage and returns the updated list.
 */
export function deleteCustomExamSetFromStorage(
  examId: string,
  customStorage?: StorageLike
): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  const updated = loadCustomExamSets(customStorage).filter((item) => item.id !== examId);
  if (store) {
    try {
      store.setItem(STORAGE_KEY_CUSTOM_EXAM_SETS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}
