import { NEW_HSK1_FULL_LESSONS, DetailedTextbookLesson } from './newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from './newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from './newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from './newHsk4BookData';
import { NEW_HSK5_FULL_LESSONS } from './newHsk5BookData';
import { NEW_HSK6_FULL_LESSONS } from './newHsk6BookData';

import { HSK1_WORKBOOK_LESSONS, WorkbookLesson } from './hsk1WorkbookData';
import { HSK2_WORKBOOK_LESSONS, HSK2WorkbookLesson } from './hsk2WorkbookData';
import { HSK3_WORKBOOK_LESSONS, HSK3WorkbookLesson } from './hsk3WorkbookData';
import { HSK4_WORKBOOK_LESSONS, HSK4WorkbookLesson } from './hsk4WorkbookData';
import { HSK5_WORKBOOK_LESSONS } from './hsk5WorkbookData';
import { HSK6_WORKBOOK_LESSONS } from './hsk6WorkbookData';
import { WordItem } from '../types';

export interface EnrichedListeningExercise {
  id: string;
  part: 1 | 2 | 3 | 4;
  questionNumber: number;
  promptText: string;
  audioScript: string;
  options: {
    key: string;
    textChinese?: string;
    textPinyin?: string;
    textVietnamese?: string;
    imageEmoji?: string;
  }[];
  correctKey: string;
  explanation: string;
}

export interface EnrichedReadingExercise {
  id: string;
  part: 1 | 2 | 3 | 4;
  questionNumber: number;
  promptChinese: string;
  promptPinyin: string;
  promptVietnamese?: string;
  subPrompt?: string;
  options: {
    key: string;
    textChinese?: string;
    textPinyin?: string;
    textVietnamese?: string;
    imageEmoji?: string;
  }[];
  correctKey: string;
  explanation: string;
}

export interface EnrichedListenReadDrill {
  title: string;
  instruction: string;
  type: 'tone' | 'initial' | 'final' | 'dialogue_match' | 'discrimination';
  items: {
    id: string;
    audioText: string;
    options: string[];
    correctAnswer: string;
    pinyinPrompt?: string;
    vietnamesePrompt?: string;
  }[];
}

export interface EnrichedWordExpansionItem {
  id: string;
  sentenceWithBlank: string;
  pinyinSentence: string;
  options: string[];
  correctAnswer: string;
  vietnameseTranslation: string;
  explanation?: string;
}

export interface EnrichedWordExpansion {
  baseWords: { hanzi: string; pinyin: string; meaning: string }[];
  compounds: {
    part1: string;
    part2: string;
    combinedHanzi: string;
    pinyin: string;
    meaning: string;
  }[];
  combinations: {
    baseChar: string;
    combinedWords: string[];
    explanation: string;
    part1?: string;
    part2?: string;
    combinedHanzi?: string;
    pinyin?: string;
    meaning?: string;
  }[];
  structures: {
    baseChar: string;
    combinedWords: string[];
    explanation: string;
  }[];
  discussion: { question: string; answer: string };
  wordBank: string[];
  fillInBlanks: EnrichedWordExpansionItem[];
  exercises: EnrichedWordExpansionItem[];
}

export interface EnrichedWritingExercise {
  id: string;
  hanzi: string;
  word: string;
  pinyin: string;
  vietnamese: string;
  meaning: string;
  promptText?: string;
  sentenceContext?: string;
  correctAnswer?: string;
  explanation?: string;
}

export interface EnrichedWorkbookLesson {
  lessonNumber: number;
  titleChinese: string;
  titlePinyin: string;
  titleVietnamese: string;
  pageNumber: string;
  phonetics?: any[];
  hanziSection?: any;
  listenAndReadDrills: EnrichedListenReadDrill[];
  listeningExercises: EnrichedListeningExercise[];
  readingExercises: EnrichedReadingExercise[];
  hskMockListening: EnrichedListeningExercise[];
  hskMockReading: EnrichedReadingExercise[];
  wordExpansion: EnrichedWordExpansion;
  writingExercises: EnrichedWritingExercise[];
}

export function getTextbookLessons(level: number): DetailedTextbookLesson[] {
  switch (level) {
    case 2:
      return NEW_HSK2_FULL_LESSONS;
    case 3:
      return NEW_HSK3_FULL_LESSONS;
    case 4:
      return NEW_HSK4_FULL_LESSONS;
    case 5:
      return NEW_HSK5_FULL_LESSONS;
    case 6:
      return NEW_HSK6_FULL_LESSONS;
    case 1:
    default:
      return NEW_HSK1_FULL_LESSONS;
  }
}

export function getRawWorkbookLessons(level: number): any[] {
  switch (level) {
    case 2:
      return HSK2_WORKBOOK_LESSONS;
    case 3:
      return HSK3_WORKBOOK_LESSONS;
    case 4:
      return HSK4_WORKBOOK_LESSONS;
    case 5:
      return HSK5_WORKBOOK_LESSONS;
    case 6:
      return HSK6_WORKBOOK_LESSONS;
    case 1:
    default:
      return HSK1_WORKBOOK_LESSONS;
  }
}

// Fallback pool of common words for distractors per level
const LEVEL_FALLBACK_WORDS: Record<number, { hanzi: string; pinyin: string; vi: string }[]> = {
  1: [
    { hanzi: '好', pinyin: 'hǎo', vi: 'tốt' },
    { hanzi: '看', pinyin: 'kàn', vi: 'xem' },
    { hanzi: '去', pinyin: 'qù', vi: 'đi' },
    { hanzi: '喝', pinyin: 'hē', vi: 'uống' },
    { hanzi: '吃', pinyin: 'chī', vi: 'ăn' },
  ],
  2: [
    { hanzi: '准备', pinyin: 'zhǔnbèi', vi: 'chuẩn bị' },
    { hanzi: '帮助', pinyin: 'bāngzhù', vi: 'giúp đỡ' },
    { hanzi: '介绍', pinyin: 'jièshào', vi: 'giới thiệu' },
    { hanzi: '希望', pinyin: 'xīwàng', vi: 'hy vọng' },
  ],
  3: [
    { hanzi: '参加', pinyin: 'cānjiā', vi: 'tham gia' },
    { hanzi: '解决', pinyin: 'jiějué', vi: 'giải quyết' },
    { hanzi: '相信', pinyin: 'xiāngxìn', vi: 'tin tưởng' },
    { hanzi: '习惯', pinyin: 'xíguàn', vi: 'thói quen' },
  ],
  4: [
    { hanzi: '坚持', pinyin: 'jiānchí', vi: 'kiên trì' },
    { hanzi: '经验', pinyin: 'jīngyàn', vi: 'kinh nghiệm' },
    { hanzi: '丰富', pinyin: 'fēngfù', vi: 'phong phú' },
    { hanzi: '积累', pinyin: 'jīlěi', vi: 'tích lũy' },
  ],
  5: [
    { hanzi: '措施', pinyin: 'cuòshī', vi: 'biện pháp' },
    { hanzi: '挑战', pinyin: 'tiǎozhàn', vi: 'thách thức' },
    { hanzi: '独特', pinyin: 'dútè', vi: 'độc đáo' },
    { hanzi: '把握', pinyin: 'bǎwò', vi: 'nắm bắt' },
  ],
  6: [
    { hanzi: '启示', pinyin: 'qǐshì', vi: 'bài học gợi mở' },
    { hanzi: '衡量', pinyin: 'héngliáng', vi: 'đong đếm' },
    { hanzi: '凝聚', pinyin: 'níngjù', vi: 'ngưng tụ' },
    { hanzi: '趋势', pinyin: 'qūshì', vi: 'xu thế' },
  ],
};

function getDistractors(level: number, correctHanzi: string, lessonVocab: WordItem[], count: number = 2): { hanzi: string; pinyin: string; vi: string }[] {
  const result: { hanzi: string; pinyin: string; vi: string }[] = [];
  // First try other words in the same lesson
  for (const v of lessonVocab) {
    if (v.hanzi !== correctHanzi && !result.some((r) => r.hanzi === v.hanzi)) {
      result.push({ hanzi: v.hanzi, pinyin: v.pinyin, vi: v.vietnamese });
      if (result.length >= count) return result;
    }
  }
  // Fallback words
  const fallback = LEVEL_FALLBACK_WORDS[level] || LEVEL_FALLBACK_WORDS[1];
  for (const f of fallback) {
    if (f.hanzi !== correctHanzi && !result.some((r) => r.hanzi === f.hanzi)) {
      result.push(f);
      if (result.length >= count) return result;
    }
  }
  return result;
}

/**
 * Enriches a single workbook lesson by merging existing workbook data with textbook lesson content.
 * Guarantees that:
 * - lessonNumber, titleChinese, titleVietnamese match textbook exactly
 * - listeningExercises.length >= 3
 * - readingExercises.length >= 3
 * - listenAndReadDrills.length >= 2
 * - wordExpansion.fillInBlanks.length >= 3 (and combinations, wordBank present)
 * - writingExercises.length >= 2
 * - phonetics and hanziSection present
 */
export function enrichWorkbookLesson(
  level: number,
  tbLesson: DetailedTextbookLesson,
  rawWbLesson?: any
): EnrichedWorkbookLesson {
  const lessonNumber = tbLesson.lessonNumber;
  const titleChinese = tbLesson.titleHanzi;
  const titlePinyin = tbLesson.titlePinyin;
  const titleVietnamese = tbLesson.titleVietnamese;
  const pageNumber = rawWbLesson?.pageNumber || String(tbLesson.pageStart || lessonNumber * 7).padStart(3, '0');

  const vocab = tbLesson.vocabulary || [];
  const texts = tbLesson.texts || [];
  const grammarPoints = tbLesson.grammarPoints || [];

  // ==========================================
  // 1. LISTENING EXERCISES (THRESHOLD >= 3)
  // ==========================================
  const rawListening: any[] = [
    ...(rawWbLesson?.listeningExercises || []),
    ...(rawWbLesson?.hskMockListening || []),
  ];
  // Deduplicate by id if both existed
  const existingListening: EnrichedListeningExercise[] = [];
  const seenListeningIds = new Set<string>();
  for (const q of rawListening) {
    if (q && q.id && !seenListeningIds.has(q.id)) {
      seenListeningIds.add(q.id);
      existingListening.push({
        id: q.id,
        part: q.part || 1,
        questionNumber: q.questionNumber || existingListening.length + 1,
        promptText: q.promptText || q.promptChinese || 'Nghe đoạn âm thanh và chọn câu trả lời đúng:',
        audioScript: q.audioScript || q.promptChinese || titleChinese,
        options: (q.options || []).map((opt: any) => ({
          key: opt.key,
          textChinese: opt.textChinese,
          textPinyin: opt.textPinyin,
          textVietnamese: opt.textVietnamese,
          imageEmoji: opt.imageEmoji,
        })),
        correctKey: q.correctKey || (q.options?.[0]?.key ?? 'A'),
        explanation: q.explanation || 'Đáp án chính xác theo nội dung bài nghe.',
      });
    }
  }

  const enrichedListening = [...existingListening];
  while (enrichedListening.length < 3 && existingListening.length < 3) {
    const idx = enrichedListening.length;
      const targetWord = vocab[idx % (vocab.length || 1)] || {
        hanzi: titleChinese,
        pinyin: titlePinyin,
        vietnamese: titleVietnamese,
        example: `${titleChinese}。`,
        exampleTranslation: titleVietnamese,
      };
      const distractors = getDistractors(level, targetWord.hanzi, vocab, 2);

      const dialogLine = texts[0]?.lines?.[idx % (texts[0]?.lines?.length || 1)];
      const rawSpeaker = dialogLine?.speaker || '说话人';
      const cleanSpeaker = rawSpeaker.replace(/\s*[\(（][^()（）]+[\)）]/g, '').trim() || '说话人';
      const audioScript = dialogLine
        ? `${cleanSpeaker}: ${dialogLine.hanzi}`
        : targetWord.example || `${targetWord.hanzi}。`;

      enrichedListening.push({
        id: `enrich_l${level}_n${lessonNumber}_listen_${idx + 1}`,
        part: 1,
        questionNumber: idx + 1,
        promptText: 'Nghe đoạn âm thanh chuẩn và chọn đáp án chính xác nhất:',
        audioScript,
        options: [
          {
            key: 'A',
            textChinese: targetWord.hanzi,
            textPinyin: targetWord.pinyin,
            textVietnamese: targetWord.vietnamese,
          },
          {
            key: 'B',
            textChinese: distractors[0]?.hanzi || '没有',
            textPinyin: distractors[0]?.pinyin || 'méiyǒu',
            textVietnamese: distractors[0]?.vi || 'không có',
          },
          {
            key: 'C',
            textChinese: distractors[1]?.hanzi || '可以',
            textPinyin: distractors[1]?.pinyin || 'kěyǐ',
            textVietnamese: distractors[1]?.vi || 'có thể',
          },
        ],
        correctKey: 'A',
        explanation: `Nội dung nghe có từ then chốt "${targetWord.hanzi}" (${targetWord.pinyin}): ${targetWord.vietnamese}.`,
      });
    }

  // ==========================================
  // 2. READING EXERCISES (THRESHOLD >= 3)
  // ==========================================
  const rawReading: any[] = [
    ...(rawWbLesson?.readingExercises || []),
    ...(rawWbLesson?.hskMockReading || []),
  ];
  const existingReading: EnrichedReadingExercise[] = [];
  const seenReadingIds = new Set<string>();
  for (const q of rawReading) {
    if (q && q.id && !seenReadingIds.has(q.id)) {
      seenReadingIds.add(q.id);
      existingReading.push({
        id: q.id,
        part: q.part || 1,
        questionNumber: q.questionNumber || existingReading.length + 1,
        promptChinese: q.promptChinese || q.promptText || '',
        promptPinyin: q.promptPinyin || '',
        promptVietnamese: q.promptVietnamese,
        subPrompt: q.subPrompt,
        options: (q.options || []).map((opt: any) => ({
          key: opt.key,
          textChinese: opt.textChinese || opt.text,
          textPinyin: opt.textPinyin,
          textVietnamese: opt.textVietnamese,
          imageEmoji: opt.imageEmoji,
        })),
        correctKey: q.correctKey || (q.options?.[0]?.key ?? 'A'),
        explanation: q.explanation || 'Đáp án phù hợp nhất về ngữ nghĩa và ngữ pháp.',
      });
    }
  }

  const enrichedReading = [...existingReading];
  while (enrichedReading.length < 3 && existingReading.length < 3) {
    const idx = enrichedReading.length;
    const targetWord = vocab[idx % (vocab.length || 1)] || {
      hanzi: titleChinese,
      pinyin: titlePinyin,
      vietnamese: titleVietnamese,
      example: `${titleChinese}。`,
      exampleTranslation: titleVietnamese,
    };
    const distractors = getDistractors(level, targetWord.hanzi, vocab, 2);

    let promptChinese = targetWord.example
      ? targetWord.example.replace(new RegExp(targetWord.hanzi, 'g'), '（    ）')
      : `请选出正确的词语：（    ）`;
    if (!promptChinese.includes('（    ）')) {
      promptChinese = `${promptChinese} （    ）`;
    }

    enrichedReading.push({
      id: `enrich_l${level}_n${lessonNumber}_read_${idx + 1}`,
      part: 2,
      questionNumber: idx + 1,
      promptChinese,
      promptPinyin: targetWord.pinyin,
      promptVietnamese: targetWord.exampleTranslation || `Điền từ thích hợp vào chỗ trống: ${targetWord.vietnamese}`,
      subPrompt: 'Chọn từ vựng đúng để hoàn thành câu trên:',
      options: [
        {
          key: 'A',
          textChinese: targetWord.hanzi,
          textPinyin: targetWord.pinyin,
          textVietnamese: targetWord.vietnamese,
        },
        {
          key: 'B',
          textChinese: distractors[0]?.hanzi || '已经',
          textPinyin: distractors[0]?.pinyin || 'yǐjīng',
          textVietnamese: distractors[0]?.vi || 'đã',
        },
        {
          key: 'C',
          textChinese: distractors[1]?.hanzi || '非常',
          textPinyin: distractors[1]?.pinyin || 'fēicháng',
          textVietnamese: distractors[1]?.vi || 'vô cùng',
        },
      ],
      correctKey: 'A',
      explanation: `Từ cần điền là "${targetWord.hanzi}" (${targetWord.pinyin}): ${targetWord.vietnamese}, hoàn toàn phù hợp ngữ cảnh câu.`,
    });
  }

  // ==========================================
  // 3. LISTEN & READ DRILLS (THRESHOLD >= 2)
  // ==========================================
  const existingDrills: EnrichedListenReadDrill[] = (rawWbLesson?.listenAndReadDrills || []).map((d: any) => ({
    title: d.title || 'Luyện Nghe Đọc',
    instruction: d.instruction || 'Nghe âm thanh và chọn đáp án chính xác:',
    type: d.type || 'dialogue_match',
    items: (d.items || []).map((it: any) => ({
      id: it.id,
      audioText: it.audioText || it.correctAnswer,
      options: it.options || [it.correctAnswer],
      correctAnswer: it.correctAnswer,
      pinyinPrompt: it.pinyinPrompt,
      vietnamesePrompt: it.vietnamesePrompt,
    })),
  }));

  const enrichedDrills = [...existingDrills];

  // Drill 1: Key vocabulary listening & pronunciation
  if (enrichedDrills.length < 1) {
    const drill1Items = vocab.slice(0, 3).map((v, i) => {
      const distractors = getDistractors(level, v.hanzi, vocab, 2);
      return {
        id: `enrich_lrd_l${level}_n${lessonNumber}_d1_${i + 1}`,
        audioText: v.hanzi,
        options: [v.hanzi, distractors[0]?.hanzi || '好的', distractors[1]?.hanzi || '谢谢'],
        correctAnswer: v.hanzi,
        pinyinPrompt: v.pinyin,
        vietnamesePrompt: v.vietnamese,
      };
    });
    if (drill1Items.length === 0) {
      drill1Items.push({
        id: `enrich_lrd_l${level}_n${lessonNumber}_d1_1`,
        audioText: titleChinese,
        options: [titleChinese, '你好', '再见'],
        correctAnswer: titleChinese,
        pinyinPrompt: titlePinyin,
        vietnamesePrompt: titleVietnamese,
      });
    }
    enrichedDrills.push({
      title: `Nhóm 1: Luyện phát âm & phân biệt từ vựng trọng tâm Bài ${lessonNumber}`,
      instruction: 'Nghe phát âm chuẩn của từ và chọn chữ Hán chính xác:',
      type: 'tone',
      items: drill1Items,
    });
  }

  // Drill 2: Sentence reflex & dialogue
  if (enrichedDrills.length < 2) {
    const drill2Items: any[] = [];
    const sampleLines = texts[0]?.lines?.slice(0, 3) || [];
    if (sampleLines.length > 0) {
      sampleLines.forEach((l, idx) => {
        drill2Items.push({
          id: `enrich_lrd_l${level}_n${lessonNumber}_d2_${idx + 1}`,
          audioText: l.hanzi,
          options: [
            l.hanzi,
            vocab[idx % (vocab.length || 1)]?.hanzi || '是的',
            '不是',
          ],
          correctAnswer: l.hanzi,
          pinyinPrompt: l.pinyin,
          vietnamesePrompt: l.vietnamese,
        });
      });
    } else {
      drill2Items.push({
        id: `enrich_lrd_l${level}_n${lessonNumber}_d2_1`,
        audioText: titleChinese,
        options: [titleChinese, '我想去', '好的'],
        correctAnswer: titleChinese,
        pinyinPrompt: titlePinyin,
        vietnamesePrompt: titleVietnamese,
      });
    }

    enrichedDrills.push({
      title: `Nhóm 2: Luyện nghe & phản xạ câu trọng tâm Bài ${lessonNumber}`,
      instruction: 'Nghe phát âm câu hoàn chỉnh và chọn câu tương ứng:',
      type: 'dialogue_match',
      items: drill2Items,
    });
  }

  // ==========================================
  // 4. WORD EXPANSION (FILL IN BLANKS >= 3)
  // ==========================================
  const rawWe = rawWbLesson?.wordExpansion;
  const rawFib: any[] = (rawWe?.fillInBlanks || rawWe?.exercises || []).filter(Boolean);

  const existingFib: EnrichedWordExpansionItem[] = rawFib.map((f: any, idx: number) => ({
    id: f?.id || `fib_${lessonNumber}_${idx + 1}`,
    sentenceWithBlank: f?.sentenceWithBlank || `${f?.sentence || ''}（    ）`,
    pinyinSentence: f?.pinyinSentence || '',
    options: f?.options || [f?.correctAnswer || '正确'],
    correctAnswer: f?.correctAnswer || f?.options?.[0] || '',
    vietnameseTranslation: f?.vietnameseTranslation || '',
    explanation: f?.explanation || 'Điền từ vựng chuẩn xác theo nghĩa câu.',
  }));

  const enrichedFib = [...existingFib];
  while (enrichedFib.length < 3 && existingFib.length < 3) {
    const idx = enrichedFib.length;
    const target = vocab[idx % (vocab.length || 1)] || {
      hanzi: titleChinese,
      pinyin: titlePinyin,
      vietnamese: titleVietnamese,
      example: `${titleChinese}。`,
      exampleTranslation: titleVietnamese,
    };
    const distractors = getDistractors(level, target.hanzi, vocab, 2);

    let sentenceWithBlank = target.example
      ? target.example.replace(new RegExp(target.hanzi, 'g'), '（    ）')
      : `请用正确的生词填空：（    ）`;
    if (!sentenceWithBlank.includes('（    ）')) {
      sentenceWithBlank = `${sentenceWithBlank} （    ）`;
    }

    enrichedFib.push({
      id: `enrich_fib_l${level}_n${lessonNumber}_${idx + 1}`,
      sentenceWithBlank,
      pinyinSentence: target.pinyin,
      options: [target.hanzi, distractors[0]?.hanzi || '高兴', distractors[1]?.hanzi || '现在'],
      correctAnswer: target.hanzi,
      vietnameseTranslation: target.exampleTranslation || target.vietnamese,
      explanation: `Điền "${target.hanzi}" (${target.pinyin}): ${target.vietnamese}.`,
    });
  }

  // Build compounds / combinations / structures
  let compounds: any[] = rawWe?.compounds || [];
  if (compounds.length === 0) {
    // Generate combinations from multi-char words or pairs
    const multiCharWords = vocab.filter((w) => w.hanzi.length >= 2);
    if (multiCharWords.length > 0) {
      compounds = multiCharWords.slice(0, 3).map((w) => ({
        part1: w.hanzi[0],
        part2: w.hanzi.slice(1),
        combinedHanzi: w.hanzi,
        pinyin: w.pinyin,
        meaning: w.vietnamese,
      }));
    } else {
      compounds = [
        {
          part1: titleChinese[0] || '学',
          part2: titleChinese.slice(1) || '习',
          combinedHanzi: titleChinese,
          pinyin: titlePinyin,
          meaning: titleVietnamese,
        },
      ];
    }
  }

  const combinations = compounds.map((c: any) => ({
    baseChar: c.part1 || c.baseChar || c.combinedHanzi?.[0] || '词',
    combinedWords: [c.combinedHanzi || c.meaning],
    explanation: `Cấu tạo từ: ${c.part1 || ''} + ${c.part2 || ''} = ${c.combinedHanzi || ''} (${c.meaning || ''})`,
    part1: c.part1,
    part2: c.part2,
    combinedHanzi: c.combinedHanzi,
    pinyin: c.pinyin,
    meaning: c.meaning,
  }));

  const structures = rawWe?.structures || combinations.map((c) => ({
    baseChar: c.baseChar,
    combinedWords: c.combinedWords,
    explanation: c.explanation,
  }));

  const baseWords = rawWe?.baseWords || vocab.slice(0, 4).map((v) => ({
    hanzi: v.hanzi,
    pinyin: v.pinyin,
    meaning: v.vietnamese,
  }));

  const wordBank = Array.from(
    new Set([
      ...enrichedFib.filter((f) => f && f.correctAnswer).map((f) => f.correctAnswer),
      ...vocab.slice(0, 4).map((v) => v.hanzi),
    ])
  );

  const wordExpansion: EnrichedWordExpansion = {
    baseWords,
    compounds,
    combinations,
    structures,
    discussion: rawWe?.discussion || {
      question: `Ý nghĩa và cách dùng từ mở rộng trong Bài ${lessonNumber}?`,
      answer: `Các từ ghép được cấu tạo bằng cách kết hợp các yếu tố ngữ nghĩa liên quan, giúp người học ghi nhớ từ vựng có hệ thống và hiểu sâu sắc ngữ cảnh sử dụng.`,
    },
    wordBank,
    fillInBlanks: enrichedFib,
    exercises: enrichedFib,
  };

  // ==========================================
  // 5. WRITING EXERCISES (THRESHOLD >= 2)
  // ==========================================
  const rawWriting: any[] = rawWbLesson?.writingExercises || [];
  const existingWriting: EnrichedWritingExercise[] = rawWriting.map((w: any, idx: number) => ({
    id: w.id || `wr_${lessonNumber}_${idx + 1}`,
    hanzi: w.hanzi || w.word || w.correctAnswer || '字',
    word: w.word || w.hanzi || w.correctAnswer || '字',
    pinyin: w.pinyin || '',
    vietnamese: w.vietnamese || w.meaning || w.promptText || '',
    meaning: w.meaning || w.vietnamese || '',
    promptText: w.promptText || (w.sentenceContext ? 'Sắp xếp các từ thành câu hoàn chỉnh:' : `Luyện viết chữ Hán "${w.hanzi || w.word}"`),
    sentenceContext: w.sentenceContext,
    correctAnswer: w.correctAnswer || w.hanzi || w.word,
    explanation: w.explanation || (w.sentenceContext ? 'Sắp xếp các thành phần câu theo đúng ngữ pháp.' : 'Luyện tập nét và quy tắc bút thuận.'),
  }));

  const enrichedWriting = [...existingWriting];
  while (enrichedWriting.length < 2 && existingWriting.length < 2) {
    const idx = enrichedWriting.length;
    const target = vocab[idx % (vocab.length || 1)] || {
      hanzi: titleChinese,
      pinyin: titlePinyin,
      vietnamese: titleVietnamese,
    };
    if (level >= 4) {
      // For intermediate/advanced HSK, synthesize sentence reordering exercises
      const sampleTextLine = texts[0]?.lines?.[idx % (texts[0]?.lines?.length || 1)];
      const sentence = sampleTextLine?.hanzi || `${(target as any).example || target.hanzi + '是很有意义的。'}`;
      const cleanSentence = sentence.replace(/[。？！]/g, '').trim();
      const parts = cleanSentence.length > 6 
        ? [cleanSentence.slice(0, 2), cleanSentence.slice(2, 5), cleanSentence.slice(5)]
        : [cleanSentence.slice(0, 2), cleanSentence.slice(2)];
      const scrambled = [...parts].reverse().join(' / ');

      enrichedWriting.push({
        id: `enrich_wr_l${level}_n${lessonNumber}_${idx + 1}`,
        hanzi: target.hanzi,
        word: target.hanzi,
        pinyin: target.pinyin,
        vietnamese: target.vietnamese,
        meaning: target.vietnamese,
        promptText: 'Sắp xếp các cụm từ sau thành câu hoàn chỉnh (排列顺序):',
        sentenceContext: scrambled,
        correctAnswer: cleanSentence + '。',
        explanation: `Sắp xếp đúng theo ngữ pháp và ngữ nghĩa bài học: "${cleanSentence}。"`,
      });
    } else {
      enrichedWriting.push({
        id: `enrich_wr_l${level}_n${lessonNumber}_${idx + 1}`,
        hanzi: target.hanzi,
        word: target.hanzi,
        pinyin: target.pinyin,
        vietnamese: target.vietnamese,
        meaning: target.vietnamese,
        promptText: `Luyện viết chữ Hán "${target.hanzi}" (${target.pinyin}: ${target.vietnamese})`,
        correctAnswer: target.hanzi,
        explanation: `Luyện viết chuẩn quy tắc bút thuận chữ Hán "${target.hanzi}".`,
      });
    }
  }

  // ==========================================
  // 6. PHONETICS & HANZI SECTION (XIAOYU)
  // ==========================================
  const phonetics =
    rawWbLesson?.phonetics && rawWbLesson.phonetics.length > 0
      ? rawWbLesson.phonetics
      : [
          {
            title: `Trọng điểm ngữ âm & thanh điệu Bài ${lessonNumber}`,
            vietnameseTitle: `Luyện âm và ngữ điệu Bài ${lessonNumber}`,
            rules: [
              'Phát âm chuẩn xác thanh mẫu, vận mẫu và 4 thanh điệu cơ bản.',
              'Chú ý ngữ điệu tự nhiên và quy tắc biến điệu trong câu khẩu ngữ.',
            ],
            audioDrillList: vocab.slice(0, 4).map((v) => ({
              label: v.hanzi,
              hanzi: v.hanzi,
              pinyin: v.pinyin,
              vietnamese: v.vietnamese,
              audioText: v.hanzi,
            })),
            explanation: `Nắm chắc ngữ âm chuẩn giúp phát âm tự nhiên và nghe hiểu tốt trong kỳ thi HSK.`,
          },
        ];

  const hanziSection =
    rawWbLesson?.hanziSection || {
      title: `HSK ${level} 核心词汇与汉字书写`,
      vietnameseTitle: `Chữ Hán & Từ vựng then chốt Bài ${lessonNumber}`,
      copyWords: vocab.slice(0, 5).map((v) => ({
        word: v.hanzi,
        pinyin: v.pinyin,
        vietnamese: v.vietnamese,
      })),
    };

  return {
    lessonNumber,
    titleChinese,
    titlePinyin,
    titleVietnamese,
    pageNumber,
    phonetics,
    hanziSection,
    listenAndReadDrills: enrichedDrills,
    listeningExercises: enrichedListening,
    readingExercises: enrichedReading,
    hskMockListening: enrichedListening,
    hskMockReading: enrichedReading,
    wordExpansion,
    writingExercises: enrichedWriting,
  };
}

/**
 * Returns all enriched workbook lessons for a given HSK level (1..6).
 * Merges curriculum lessons (NEW_HSK{level}_FULL_LESSONS) with raw workbook lessons,
 * guaranteeing 100% of lessons are enriched and none are omitted.
 */
export function getEnrichedWorkbookLessons(level: number): EnrichedWorkbookLesson[] {
  const tbLessons = getTextbookLessons(level);
  const rawWbLessons = getRawWorkbookLessons(level);

  const lessonNumberMap = new Map<number, { tb?: DetailedTextbookLesson; raw?: any }>();

  for (const tb of tbLessons) {
    lessonNumberMap.set(tb.lessonNumber, { tb });
  }
  for (const raw of rawWbLessons) {
    const existing = lessonNumberMap.get(raw.lessonNumber);
    if (existing) {
      existing.raw = raw;
    } else {
      lessonNumberMap.set(raw.lessonNumber, { raw });
    }
  }

  const sortedLessonNumbers = Array.from(lessonNumberMap.keys()).sort((a, b) => a - b);

  return sortedLessonNumbers.map((num) => {
    const entry = lessonNumberMap.get(num)!;
    if (entry.tb) {
      return enrichWorkbookLesson(level, entry.tb, entry.raw);
    }
    const raw = entry.raw;
    const synthTb: DetailedTextbookLesson = {
      lessonNumber: num,
      titleHanzi: raw.titleChinese || `第${num}课`,
      titlePinyin: raw.titlePinyin || '',
      titleVietnamese: raw.titleVietnamese || `Bài ${num}`,
      pageStart: Number(raw.pageNumber) || num * 10,
      objectives: [],
      texts: [],
      vocabulary: (raw.hanziSection?.copyWords || []).map((cw: any, idx: number) => ({
        id: `synth_vocab_l${level}_n${num}_${idx + 1}`,
        hanzi: cw.word || cw.hanzi,
        pinyin: cw.pinyin || '',
        hanViet: '',
        vietnamese: cw.vietnamese || '',
        hskLevel: ((level >= 1 && level <= 6 ? level : 1) as 1 | 2 | 3 | 4 | 5 | 6),
        partOfSpeech: 'dt.',
        strokeCount: 10,
        radical: '一',
        example: `${cw.word || cw.hanzi}。`,
        exampleTranslation: cw.vietnamese || '',
        tags: [`Bài ${num}`],
      })),
      grammarPoints: [],
      exercises: [],
    };
    return enrichWorkbookLesson(level, synthTb, raw);
  });
}

/**
 * Returns a specific enriched workbook lesson by level and lesson number.
 * Never falls back to Lesson 1 when an arbitrary or missing lesson is requested.
 */
export function getEnrichedWorkbookLesson(
  level: number,
  lessonNumber: number,
  customLesson?: DetailedTextbookLesson
): EnrichedWorkbookLesson {
  const tbLessons = getTextbookLessons(level);
  const rawWbLessons = getRawWorkbookLessons(level);

  let tbLesson =
    customLesson ||
    tbLessons.find((t) => t.lessonNumber === lessonNumber);

  const matchingRaw = rawWbLessons.find((w: any) => w.lessonNumber === lessonNumber);

  if (!tbLesson) {
    if (matchingRaw) {
      tbLesson = {
        lessonNumber,
        titleHanzi: matchingRaw.titleChinese || `第${lessonNumber}课`,
        titlePinyin: matchingRaw.titlePinyin || '',
        titleVietnamese: matchingRaw.titleVietnamese || `Bài ${lessonNumber}`,
        pageStart: Number(matchingRaw.pageNumber) || lessonNumber * 10,
        objectives: [],
        texts: [],
        vocabulary: (matchingRaw.hanziSection?.copyWords || []).map((cw: any, idx: number) => ({
          id: `synth_vocab_l${level}_n${lessonNumber}_${idx + 1}`,
          hanzi: cw.word || cw.hanzi,
          pinyin: cw.pinyin || '',
          hanViet: '',
          vietnamese: cw.vietnamese || '',
          hskLevel: ((level >= 1 && level <= 6 ? level : 1) as 1 | 2 | 3 | 4 | 5 | 6),
          partOfSpeech: 'dt.',
          strokeCount: 10,
          radical: '一',
          example: `${cw.word || cw.hanzi}。`,
          exampleTranslation: cw.vietnamese || '',
          tags: [`Bài ${lessonNumber}`],
        })),
        grammarPoints: [],
        exercises: [],
      };
    } else {
      tbLesson = {
        lessonNumber,
        titleHanzi: `第${lessonNumber}课`,
        titlePinyin: `Dì ${lessonNumber} kè`,
        titleVietnamese: `Bài học ${lessonNumber}`,
        pageStart: lessonNumber * 10,
        objectives: [],
        texts: [],
        vocabulary: (LEVEL_FALLBACK_WORDS[level] || LEVEL_FALLBACK_WORDS[1]).map((w, idx) => ({
          id: `synth_vocab_l${level}_n${lessonNumber}_${idx + 1}`,
          hanzi: w.hanzi,
          pinyin: w.pinyin,
          hanViet: '',
          vietnamese: w.vi,
          hskLevel: ((level >= 1 && level <= 6 ? level : 1) as 1 | 2 | 3 | 4 | 5 | 6),
          partOfSpeech: 'dt.',
          strokeCount: 10,
          radical: '一',
          example: `${w.hanzi}。`,
          exampleTranslation: w.vi,
          tags: [`Bài ${lessonNumber}`],
        })),
        grammarPoints: [],
        exercises: [],
      };
    }
  }

  return enrichWorkbookLesson(level, tbLesson, matchingRaw);
}
