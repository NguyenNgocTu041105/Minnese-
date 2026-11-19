import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  BookOpen,
  Headphones,
  HelpCircle,
  Edit3,
  Code,
  ArrowRightLeft,
  Copy,
  Check,
  X,
  Sliders,
  FileText,
  CheckCircle2,
  ListOrdered,
  AlertCircle,
} from 'lucide-react';
import { getQuestionCountOptionsForLevel } from '../../utils/externalAiPromptBuilder';

export type GoldenPromptFormatKey =
  | 'reading_mcq'
  | 'listening_dialogue'
  | 'dialogue_matching'
  | 'fill_in_blank'
  | 'true_false'
  | 'json_strict'
  | 'write_sentence_reorder_4opt'
  | 'write_tianzige_from_pinyin'
  | 'write_short_essay_80chars'
  | 'write_topic_essay_200chars'
  | 'write_summary_shortening_400chars'
  | 'read_find_faulty_sentence_4opt'
  | 'read_paragraph_sentence_ordering'
  | 'listen_talks_qa_4opt';

export interface GoldenPromptFormatMeta {
  key: GoldenPromptFormatKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  supportedLevels: number[];
  skill: 'reading' | 'listening' | 'writing';
}

export const GOLDEN_PROMPT_FORMATS: GoldenPromptFormatMeta[] = [
  {
    key: 'reading_mcq',
    label: 'Trắc nghiệm Đọc hiểu (Reading MCQ)',
    shortLabel: 'Đọc hiểu',
    icon: BookOpen,
    description: 'Đoạn văn ngắn hoặc câu đơn tiếng Trung kèm câu hỏi kiểm tra chi tiết & 4 lựa chọn A, B, C, D',
    supportedLevels: [1, 2, 3, 4, 5, 6],
    skill: 'reading',
  },
  {
    key: 'listening_dialogue',
    label: 'Trắc nghiệm Nghe hiểu (Listening Dialogue)',
    shortLabel: 'Nghe hiểu',
    icon: Headphones,
    description: 'Đối thoại 2 nhân vật Nam (男) & Nữ (女) kèm câu hỏi 问：..., tự động hỗ trợ bóc tách audio TTS',
    supportedLevels: [1, 2, 3, 4, 5, 6],
    skill: 'listening',
  },
  {
    key: 'dialogue_matching',
    label: 'Nối câu / Hội thoại (Dialogue Matching)',
    shortLabel: 'Ghép câu',
    icon: ArrowRightLeft,
    description: 'Bài tập nối câu đối thoại chuẩn HSK với kho phương án chung (4 đến 5 lựa chọn)',
    supportedLevels: [1, 2, 3, 4, 5, 6],
    skill: 'reading',
  },
  {
    key: 'fill_in_blank',
    label: 'Điền từ vào chỗ trống (Fill-in-the-blank)',
    shortLabel: 'Điền từ',
    icon: Edit3,
    description: 'Câu đơn chứa ký hiệu chỗ trống canonical ____ với 4 phương án cùng từ loại',
    supportedLevels: [1, 2, 3, 4, 5, 6],
    skill: 'reading',
  },
  {
    key: 'true_false',
    label: 'Đọc hiểu Đúng / Sai (True / False)',
    shortLabel: 'Đúng / Sai',
    icon: HelpCircle,
    description: 'Nhận định tiếng Trung với 2 phương án lựa chọn A. 对 (Đúng) và B. 错 (Sai)',
    supportedLevels: [1, 2, 3, 4, 5, 6],
    skill: 'reading',
  },
  {
    key: 'json_strict',
    label: 'JSON Chuẩn HSK Exam v2.0',
    shortLabel: 'JSON Chuẩn',
    icon: Code,
    description: 'Mã JSON nghiêm ngặt tuân thủ CandidateQuestion schema bóc tách trực tiếp 100%',
    supportedLevels: [1, 2, 3, 4, 5, 6],
    skill: 'reading',
  },
  {
    key: 'write_sentence_reorder_4opt',
    label: 'Sắp xếp câu hoàn chỉnh (连词成句 - HSK 3–5)',
    shortLabel: 'Sắp xếp câu',
    icon: ListOrdered,
    description: '4–5 cụm từ / ngữ khối bị xáo trộn, yêu cầu sắp xếp lại thành câu hoàn chỉnh đúng ngữ pháp',
    supportedLevels: [3, 4, 5],
    skill: 'writing',
  },
  {
    key: 'write_tianzige_from_pinyin',
    label: 'Nhìn Pinyin gõ chữ Hán (看拼音写字/词 - HSK 2–3)',
    shortLabel: 'Pinyin gõ Hanzi',
    icon: Edit3,
    description: 'Câu ngữ cảnh có từ để trống kèm Pinyin trong ngoặc đơn, thí sinh gõ chữ Hán chuẩn qua IME',
    supportedLevels: [2, 3],
    skill: 'writing',
  },
  {
    key: 'write_short_essay_80chars',
    label: 'Viết đoạn văn ngắn ~80 chữ (HSK 4–5)',
    shortLabel: 'Viết ~80 chữ',
    icon: FileText,
    description: 'Viết đoạn văn ngắn khoảng 80 chữ dựa trên 5 từ khóa gợi ý hoặc hình ảnh miêu tả tình huống',
    supportedLevels: [4, 5],
    skill: 'writing',
  },
  {
    key: 'write_topic_essay_200chars',
    label: 'Nghị luận theo chủ đề ~200 chữ (HSK 5)',
    shortLabel: 'Nghị luận 200 chữ',
    icon: FileText,
    description: 'Viết bài văn nghị luận xã hội / quan điểm cá nhân khoảng 200 chữ theo chủ đề cho sẵn',
    supportedLevels: [5],
    skill: 'writing',
  },
  {
    key: 'write_summary_shortening_400chars',
    label: 'Rút gọn văn bản 1000 chữ thành 400 chữ (HSK 6 缩写)',
    shortLabel: 'Rút gọn 400 chữ',
    icon: FileText,
    description: 'Đọc văn bản tự sự 1000 chữ trong 10 phút, tóm tắt lại thành bài văn ~400 chữ kèm tiêu đề tự đặt',
    supportedLevels: [6],
    skill: 'writing',
  },
  {
    key: 'read_find_faulty_sentence_4opt',
    label: 'Tìm câu sai ngữ pháp (病句辨析 - HSK 6)',
    shortLabel: 'Bắt lỗi câu (病句)',
    icon: AlertCircle,
    description: 'Mỗi câu gồm 4 câu độc lập A, B, C, D, tìm duy nhất 1 câu có lỗi ngữ pháp điển hình',
    supportedLevels: [6],
    skill: 'reading',
  },
  {
    key: 'read_paragraph_sentence_ordering',
    label: 'Sắp xếp trật tự đoạn văn (段落排序 - HSK 5)',
    shortLabel: 'Sắp xếp đoạn văn',
    icon: ListOrdered,
    description: '5 câu văn A, B, C, D, E bị đảo lộn thứ tự, ghép nối thành đoạn văn hoàn chỉnh theo mạch logic',
    supportedLevels: [5],
    skill: 'reading',
  },
  {
    key: 'listen_talks_qa_4opt',
    label: 'Bài nói / Phỏng vấn / Diễn thuyết (HSK 4–6 Talks QA)',
    shortLabel: 'Nghe bài nói',
    icon: Headphones,
    description: 'Bài nói / diễn thuyết dài kèm 2–4 câu hỏi trắc nghiệm A, B, C, D kiểm tra chi tiết và suy luận',
    supportedLevels: [4, 5, 6],
    skill: 'listening',
  },
];

export const HSK_LEVEL_META: Record<
  number,
  { label: string; vocabTarget: string; grammarFocus: string }
> = {
  1: {
    label: 'HSK 1',
    vocabTarget: '500 từ chuẩn GF 0025-2021 (sinh hoạt hàng ngày, xưng hô, ăn uống, số đếm)',
    grammarFocus: 'Câu đơn giản S + V + O, câu hỏi 是...吗, câu vị ngữ tính từ, 在 + địa điểm',
  },
  2: {
    label: 'HSK 2',
    vocabTarget: '1.272 từ tích lũy GF 0025-2021 (mua sắm, du lịch, hỏi đường, thời tiết, sức khỏe)',
    grammarFocus: 'Câu so sánh 比, trợ từ động thái 了/过/着, kết cấu 是...的, liên từ 因为...所以...',
  },
  3: {
    label: 'HSK 3',
    vocabTarget: '2.245 từ tích lũy GF 0025-2021 (công việc, học tập, giải trí, sở thích, mô tả chi tiết)',
    grammarFocus: 'Bổ ngữ kết quả/xu hướng, câu chữ 把/被, liên từ 虽然...但是..., 除了...以外',
  },
  4: {
    label: 'HSK 4',
    vocabTarget: '3.245 từ tích lũy GF 0025-2021 (giao tiếp xã hội, cảm xúc, thảo luận chủ đề đa dạng)',
    grammarFocus: 'Phức câu điều kiện/nhượng bộ (无论/即使/只要), bổ ngữ khả năng, thành ngữ thông dụng',
  },
  5: {
    label: 'HSK 5',
    vocabTarget: '4.316 từ tích lũy GF 0025-2021 (đọc báo, xem phim, bình luận chuyên sâu, bài viết nghị luận)',
    grammarFocus: 'Cấu trúc thư tịch, văn ngôn hóa, hư từ cao cấp, phân tích logic trừu tượng',
  },
  6: {
    label: 'HSK 6',
    vocabTarget: '5.456 từ tích lũy GF 0025-2021 (thông thạo như người bản ngữ, văn học, chuyên ngành hàn lâm)',
    grammarFocus: 'Ngữ pháp biểu cảm cao, thành ngữ 4 chữ cổ điển, liên kết văn bản phức hợp',
  },
};

export const QUICK_TOPIC_SUGGESTIONS = [
  'Đời sống hàng ngày & Gia đình',
  'Trường học & Thi cử HSK',
  'Công việc & Phỏng vấn tuyển dụng',
  'Du lịch & Giao thông công cộng',
  'Mua sắm, Ẩm thực & Thời tiết',
  'Sức khỏe, Thể thao & Giải trí',
];

export interface LessonScopePromptContext {
  lessonNumber: number;
  titleHanzi: string;
  titleVietnamese: string;
  vocabText: string;
  grammarText: string;
  scopeDescription?: string;
  teacherNote?: string;
}

export interface GoldenPromptBuilderParams {
  level: number;
  format: GoldenPromptFormatKey | string;
  questionCount?: number;
  topic?: string;
  includePinyin?: boolean;
  lessonContext?: LessonScopePromptContext;
}

/**
 * Builds a standardized, canonical Golden Standard Prompt for external LLMs
 * (ChatGPT, Claude, Gemini, DeepSeek, etc.) guaranteed to parse 100% cleanly
 * into MinNese's universal question parser without requiring manual formatting fixes.
 */
export function buildGoldenPrompt(params: GoldenPromptBuilderParams): string {
  const level = Math.min(Math.max(params.level || 1, 1), 6);
  const rawFormat = (params.format || 'reading_mcq').toLowerCase().trim();

  // Normalize format aliases if needed
  let formatKey: GoldenPromptFormatKey = 'reading_mcq';
  if (rawFormat.includes('reorder') || rawFormat.includes('sentence_reorder')) {
    formatKey = 'write_sentence_reorder_4opt';
  } else if (rawFormat.includes('tianzige') || rawFormat.includes('pinyin_to_hanzi') || rawFormat.includes('pinyin')) {
    formatKey = 'write_tianzige_from_pinyin';
  } else if (rawFormat.includes('short_essay') || rawFormat.includes('essay_80') || rawFormat.includes('80char')) {
    formatKey = 'write_short_essay_80chars';
  } else if (rawFormat.includes('topic_essay') || rawFormat.includes('essay_200') || rawFormat.includes('200char')) {
    formatKey = 'write_topic_essay_200chars';
  } else if (rawFormat.includes('summary') || rawFormat.includes('shortening') || rawFormat.includes('400char')) {
    formatKey = 'write_summary_shortening_400chars';
  } else if (rawFormat.includes('faulty') || rawFormat.includes('error') || rawFormat.includes('bingju')) {
    formatKey = 'read_find_faulty_sentence_4opt';
  } else if (rawFormat.includes('paragraph') || rawFormat.includes('sentence_order') || rawFormat.includes('ordering')) {
    formatKey = 'read_paragraph_sentence_ordering';
  } else if (rawFormat.includes('talk') || rawFormat.includes('monologue') || rawFormat.includes('lecture')) {
    formatKey = 'listen_talks_qa_4opt';
  } else if (rawFormat.includes('listen')) {
    formatKey = 'listening_dialogue';
  } else if (rawFormat.includes('match') || rawFormat.includes('dialogue_match')) {
    formatKey = 'dialogue_matching';
  } else if (rawFormat.includes('blank') || rawFormat.includes('fill')) {
    formatKey = 'fill_in_blank';
  } else if (rawFormat.includes('true') || rawFormat.includes('false') || rawFormat.includes('tf')) {
    formatKey = 'true_false';
  } else if (rawFormat.includes('json')) {
    formatKey = 'json_strict';
  } else {
    const matched = GOLDEN_PROMPT_FORMATS.find((f) => f.key === rawFormat);
    formatKey = matched ? matched.key : 'reading_mcq';
  }

  const questionCount = Math.max(params.questionCount || 5, 1);
  const topic =
    params.topic && params.topic.trim()
      ? params.topic.trim()
      : 'Đời sống hàng ngày, gia đình, bạn bè, học tập, du lịch, công việc';
  const includePinyin = params.includePinyin !== undefined ? params.includePinyin : level <= 3;

  const levelMeta = HSK_LEVEL_META[level] || HSK_LEVEL_META[1];
  const lc = params.lessonContext;

  const vocabTargetLine = lc && lc.vocabText.trim()
    ? `${lc.vocabText.trim()} (CHỈ sử dụng từ vựng bài học giáo viên đã dạy, KHÔNG lấy tràn lan toàn bộ từ vựng HSK ${level} chưa học)`
    : levelMeta.vocabTarget;

  const grammarFocusLine = lc && lc.grammarText.trim()
    ? `${lc.grammarText.trim()} (Bám sát cấu trúc ngữ pháp giáo viên chỉ định)`
    : levelMeta.grammarFocus;

  const lessonHeaderLine = lc
    ? `\n- Bài học đang dạy: Bài ${lc.lessonNumber}: ${lc.titleHanzi} (${lc.titleVietnamese})${lc.scopeDescription ? `\n- Phạm vi giới hạn kiến thức: ${lc.scopeDescription}` : ''}${lc.teacherNote ? `\n- Yêu cầu riêng của giáo viên: ${lc.teacherNote}` : ''}`
    : '';

  const pinyinInstruction = includePinyin
    ? 'Yêu cầu phiên âm: BẮT BUỘC có phiên âm Pinyin chuẩn thanh điệu kèm trong dấu ngoặc đơn sau câu chữ Hán.'
    : 'Yêu cầu phiên âm: Chỉ dùng chữ Hán chuẩn, KHÔNG cần viết phiên âm Pinyin.';

  const pinyinExample = includePinyin ? ' ([Phiên âm Pinyin có thanh điệu])' : '';

  switch (formatKey) {
    case 'reading_mcq': {
      return `Bạn là Chuyên gia Khảo thí Hán ngữ Quốc tế chuẩn HSK 3.0.
Hãy biên soạn ${questionCount} câu hỏi trắc nghiệm Đọc hiểu tiếng Trung trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

YÊU CẦU ĐỊNH DẠNG NGHIÊM NGẶT (TUÂN THỦ 100% ĐỂ HỆ THỐNG MINNESE TỰ ĐỘNG BÓC TÁCH KHÔNG CẦN CHỈNH SỬA):
1. Mỗi câu hỏi gồm:
   Câu [STT]: [Đoạn văn ngắn hoặc câu văn tiếng Trung kèm câu hỏi kiểm tra chi tiết hoặc ý chính]${pinyinExample}
   A. [Lựa chọn A]
   B. [Lựa chọn B]
   C. [Lựa chọn C]
   D. [Lựa chọn D]
2. BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa câu sang tiếng Việt, giải thích điểm ngữ pháp và lý do vì sao chọn đáp án này].
Câu 2: [A/B/C/D]. Giải thích: ...`;
    }

    case 'listening_dialogue': {
      return `Bạn là Chuyên gia Biên soạn Đề thi Nghe hiểu HSK 3.0.
Hãy tạo ${questionCount} câu hỏi Nghe hiểu hội thoại đa dạng nhân vật và ngữ cảnh trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

YÊU CẦU KỸ THUẬT VÀ ĐỊNH DẠNG BẮT BUỘC (TUÂN THỦ 100% ĐỂ HỆ THỐNG TỰ ĐỘNG BÓC TÁCH VÀ PHÂN VAI GIỌNG ĐỌC NEURAL TTS THEO NHÂN VẬT):
1. Đa dạng hóa tình huống và tuyến nhân vật sát hợp với bài học (ví dụ: thầy/cô giáo 王老师/李老师 với học sinh 学生/同学, AI小语 với bạn học, bố mẹ 爸爸/妈妈 với con cái, đồng nghiệp/bạn bè 大卫/玛丽, nhân viên 服务员 với khách 客人, hoặc cặp nhân vật 男/女).
2. Mỗi câu hỏi gồm lời thoại đối đáp của 2 nhân vật, sau đó là câu hỏi 问： và BẮT BUỘC đủ 4 phương án A, B, C, D (chuẩn đề thi nghe HSK 1–6):
   Câu [STT]:
   男：[Lời thoại nhân vật 1 bằng chữ Hán (có thể dùng 男： hoặc tên nhân vật phù hợp bài học như 王老师：, 学生：, 爸爸：)]${pinyinExample}
   女：[Lời thoại nhân vật 2 bằng chữ Hán (có thể dùng 女： hoặc tên nhân vật đối đáp như 学生：, AI小语：, 妈妈：)]${pinyinExample}
   问：[Câu hỏi về nội dung hội thoại]?
   A. [Phương án A]
   B. [Phương án B]
   C. [Phương án C]
   D. [Phương án D]
3. LƯU Ý PHÁT ÂM: TUYỆT ĐỐI KHÔNG thêm dòng chú thích như "Nhân vật tham gia:", "Tuyến nhân vật:", "Bối cảnh:", "Tình huống:", "人物：", "角色：" trước câu thoại. Mỗi câu hỏi chỉ viết trực tiếp lời thoại bắt đầu bằng 男： và 女： để hệ thống tự động đọc đúng hội thoại.
4. Bẫy tư duy: Cài cắm chi tiết đổi ý hoặc thông tin gây nhiễu tự nhiên giữa hai nhân vật để kiểm tra năng lực nghe hiểu thực chất.
5. QUY TẮC HÌNH ẢNH (nếu là câu nghe có tranh như listen_true_false_2opt, listen_picture_match_4opt, listen_dialogue_picture_match_6opt): Bắt buộc dùng thẻ [IMG: <english scene description without Chinese characters or answer words>] viết hoàn toàn bằng tiếng Anh mô tả bối cảnh tự nhiên (TUYỆT ĐỐI KHÔNG chứa chữ Hán, Pinyin hay từ khóa đáp án) đặt trước dòng 男： cho tranh ở câu hỏi, hoặc đặt ngay sau A./B./C./D. (hoặc A.–F. cho bảng ghép 6 tranh).
6. BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Dịch toàn bộ lời thoại sang tiếng Việt, giải thích chi tiết vì sao đáp án này đúng và phân tích bẫy nghe].
Câu 2: [A/B/C/D]. Giải thích: ...`;
    }

    case 'dialogue_matching': {
      const optionLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, Math.min(Math.max(questionCount, 4), 5));
      const poolCount = optionLetters.length;
      return `Bạn là Giáo viên Khảo thí Tiếng Trung HSK.
Hãy biên soạn bài tập ghép nối hội thoại chuẩn HSK ${level} gồm ${poolCount} câu ngữ cảnh và ${poolCount} phương án đối đáp lựa chọn A đến ${optionLetters[optionLetters.length - 1]} (mỗi phương án chỉ dùng một lần).${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

ĐỊNH DẠNG BẮT BUỘC (TUÂN THỦ 100% ĐỂ HỆ THỐNG BÓC TÁCH TỰ ĐỘNG):
第二部分: 第 1 - ${poolCount} 题
Quy tắc: Chọn một phương án phù hợp nhất từ A đến ${optionLetters[optionLetters.length - 1]} để ghép với từng câu ngữ cảnh (mỗi phương án chỉ dùng một lần).
Ký hiệu Câu lựa chọn
${optionLetters.map((l) => `${l}. [Câu lựa chọn đối đáp ${l}]${pinyinExample}`).join('\n')}

${Array.from({ length: poolCount }, (_, i) => `${i + 1}. [Câu ngữ cảnh ${i + 1}]${pinyinExample} → [ ]`).join('\n')}

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
${Array.from({ length: poolCount }, (_, i) => `Câu ${i + 1}: [${optionLetters.join('/')}]. Giải thích: [Dịch nghĩa cặp câu và giải thích logic ghép nối bằng tiếng Việt].`).join('\n')}`;
    }

    case 'fill_in_blank': {
      return `Bạn là Chuyên gia Ngữ pháp Hán ngữ HSK 3.0.
Hãy tạo ${questionCount} câu hỏi bài tập điền từ vào chỗ trống cho trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

YÊU CẦU ĐỊNH DẠNG NGHIÊM NGẶT (TUÂN THỦ 100% ĐỂ HỆ THỐNG BÓC TÁCH TỰ ĐỘNG):
1. Ký hiệu vị trí chỗ trống BẮT BUỘC là 4 dấu gạch dưới liên tiếp: ____
2. Cung cấp 4 phương án lựa chọn A, B, C, D có cùng từ loại (POS) nhưng khác biệt rõ về ngữ nghĩa/ngữ cảnh.
3. Cấu trúc mỗi câu:
   Câu [STT]: [Câu tiếng Trung có chỗ trống ____]${pinyinExample}
   A. [Từ vựng A]
   B. [Từ vựng B]
   C. [Từ vựng C]
   D. [Từ vựng D]
4. BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Dịch toàn bộ câu hoàn chỉnh sang tiếng Việt, giải thích nghĩa và từ loại của từ được chọn].
Câu 2: [A/B/C/D]. Giải thích: ...`;
    }

    case 'true_false': {
      return `Bạn là Chuyên gia Khảo thí Hán ngữ Quốc tế HSK 3.0.
Hãy biên soạn ${questionCount} câu bài tập Đọc hiểu Đúng / Sai trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

YÊU CẦU ĐỊNH DẠNG NGHIÊM NGẶT (TUÂN THỦ 100% ĐỂ HỆ THỐNG BÓC TÁCH TỰ ĐỘNG):
1. Cấu trúc mỗi câu:
   Câu [STT]: [Câu nhận định hoặc ngữ cảnh tiếng Trung]${pinyinExample}
   A. 对
   B. 错
2. BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A hoặc B]. Giải thích: [Dịch nghĩa câu sang tiếng Việt và nêu rõ căn cứ xác định đúng/sai].
Câu 2: [A hoặc B]. Giải thích: ...`;
    }

    case 'json_strict': {
      return `Bạn là API tạo dữ liệu đề thi HSK 3.0 cho nền tảng MinNese.
Hãy tạo ${questionCount} câu hỏi HSK ${level} chất lượng cao và trả về DUY NHẤT một khối mã JSON hợp lệ (không kèm lời chào hay giải thích ngoài mã JSON):${lessonHeaderLine}
- Khung từ vựng: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

ĐỊNH DẠNG JSON SCHEMA BẮT BUỘC:
\`\`\`json
[
  {
    "stem": "Câu tiếng Trung (có ____ nếu là bài điền từ, hoặc 男：...\\n女：...\\n问：... nếu là bài nghe)",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "answer_idx": 0,
    "pinyin": "Pinyin có dấu thanh điệu chuẩn",
    "explanation_vi": "Dịch nghĩa câu và giải thích chi tiết bằng tiếng Việt",
    "level": ${level},
    "skill": "reading",
    "part_type": "read_fill_blank_4opt"
  }
]
\`\`\`
LƯU Ý BẮT BUỘC:
- Mọi câu trắc nghiệm MCQ phải có đủ 4 phương án A, B, C, D (tuyệt đối không tạo câu chỉ có A, B, C).
- Đối với câu Nghe có hình ảnh (listen_true_false_2opt, listen_picture_match_4opt, listen_dialogue_picture_match_6opt) hoặc bài Viết miêu tả tranh (write_short_essay_80chars), điền trường "illustration_theme" hoặc mảng "options_images" bằng mô tả cảnh tiếng Anh tự nhiên (tuyệt đối không chứa chữ Hán, Pinyin hay từ khóa đáp án).`;
    }

    case 'write_sentence_reorder_4opt': {
      return `Bạn là Chuyên gia Khảo thí Tiếng Trung Quốc tế chuẩn HSK 3.0.
Hãy biên soạn ${questionCount} câu hỏi phần thi Viết: Sắp xếp câu hoàn chỉnh (连词成句) trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC SƯ PHẠM & THI MÁY (CBT):
1. Mỗi câu gồm 4 đến 5 ngữ khối (chunks) đã bị xáo trộn thứ tự, ngăn cách rõ ràng bởi dấu gạch chéo /.
2. Toàn bộ từ vựng phải nằm trong khung HSK ${level}.
3. Đảm bảo câu hoàn chỉnh chỉ có DUY NHẤT 1 trật tự ngữ pháp đúng, tự nhiên, không thể đảo ngữ tùy tiện.
4. Cung cấp 4 phương án trật tự lựa chọn A, B, C, D cho câu hỏi thi máy.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1: [Ngữ khối 1] / [Ngữ khối 2] / [Ngữ khối 3] / [Ngữ khối 4] / [Ngữ khối 5]
A. [Trật tự A]
B. [Trật tự B]
C. [Trật tự C]
D. [Trật tự D]
Câu 2: ...

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Câu hoàn chỉnh: ... Dịch nghĩa tiếng Việt, phân tích công thức ngữ pháp áp dụng và giải thích vì sao các trật tự khác sai].
Câu 2: [A/B/C/D]. Giải thích: ...`;
    }

    case 'write_tianzige_from_pinyin': {
      return `Bạn là Chuyên gia Khảo thí Tiếng Trung HSK 3.0.
Hãy biên soạn ${questionCount} câu hỏi phần thi Viết: Nhìn phiên âm gõ chữ Hán trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC THI MÁY (CBT):
1. Mỗi câu là một ngữ cảnh giao tiếp thực tế hoàn chỉnh, trong đó có một từ/chữ Hán để trống kèm phiên âm Pinyin có thanh điệu đặt trong ngoặc đơn: （píngguǒ） hoặc （bān）.
2. Từ cần điền là từ vựng cốt lõi HSK ${level}. Ngữ cảnh câu văn phải đủ chặt chẽ để từ đó là lựa chọn chuẩn xác duy nhất.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1: 今天早上妈妈去超市买了一些（píngguǒ）。
Câu 2: ...

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: 苹果. Giải thích: [Dịch nghĩa câu sang tiếng Việt, phân tích từ loại và ý nghĩa của từ trong câu].
Câu 2: ...`;
    }

    case 'write_short_essay_80chars': {
      return `Bạn là Chuyên gia Khảo thí Tiếng Trung HSK 3.0.
Hãy biên soạn ${questionCount} đề bài phần thi Viết: Viết đoạn văn ngắn ~80 chữ trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC SƯ PHẠM:
1. Mỗi đề bài cung cấp 5 từ vựng gợi ý thuộc khung HSK ${level} hoặc tình huống miêu tả tranh kèm thẻ [IMG: <english scene description without Chinese characters or answer words>].
2. Nếu là đề miêu tả tranh, đặt thẻ [IMG: ...] viết hoàn toàn bằng tiếng Anh tự nhiên ở dòng đầu của đề bài (tuyệt đối không chứa chữ Hán, Pinyin hay từ khóa đáp án).
3. Thí sinh phải viết một đoạn văn ngắn khoảng 80 chữ Hán (70–90 chữ) liên kết mạch lạc 5 từ khóa hoặc bám sát tình huống hình ảnh.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1 (Từ khóa): 请结合以下5个词语写一篇80字左右的短文：[Từ 1]、[Từ 2]、[Từ 3]、[Từ 4]、[Từ 5]
Câu 2 (Miêu tả tranh tùy chọn):
[IMG: <english scene description without Chinese characters or answer words>]
请根据图片写一篇80字左右的短文。

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: Bài văn mẫu (~80 chữ). Giải thích: [Đoạn văn tiếng Trung mẫu mực, dịch nghĩa tiếng Việt và phân tích cách liên kết từ khóa].
Câu 2: ...`;
    }

    case 'write_topic_essay_200chars': {
      return `Bạn là Chuyên gia Khảo thí Tiếng Trung HSK ${level}.
Hãy biên soạn ${questionCount} đề bài phần thi Viết: Nghị luận theo chủ đề ~200 chữ trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC SƯ PHẠM:
1. Đề tài thảo luận vấn đề xã hội đương đại hoặc quan điểm sống.
2. Thí sinh viết bài văn nghị luận khoảng 200 chữ Hán (180–220 chữ) có luận điểm, dẫn chứng và kết luận.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1: 题目：谈谈你对[Chủ đề nghị luận]的看法，写一篇200字左右的议论文。

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: Bài văn mẫu (~200 chữ). Giải thích: [Bài văn nghị luận mẫu mực, dịch nghĩa tiếng Việt và phân tích cấu trúc lập luận].
Câu 2: ...`;
    }

    case 'write_summary_shortening_400chars': {
      return `Bạn là Chuyên gia Khảo thí Tiếng Trung HSK ${level}.
Hãy biên soạn ${questionCount} đề bài phần thi Viết: Rút gọn văn bản 1000 chữ thành 400 chữ (缩写) trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC KHẢO THÍ HSK ${level}:
1. Cung cấp câu chuyện tự sự 1000 chữ Hán hoàn chỉnh.
2. Thí sinh tóm tắt thành đoạn văn ~400 chữ (350–450 chữ) kèm tiêu đề tự đặt, không đưa quan điểm cá nhân.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1: 阅读下面1000字左右的文章，在35分钟内将其缩写成一篇400字左右的短文，并自拟标题：
[Toàn bộ bài đọc tự sự 1000 chữ]

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: Tiêu đề & Bài rút gọn mẫu (~400 chữ). Giải thích: [Bản rút gọn mẫu mực, dịch nghĩa tiếng Việt và phân tích kỹ thuật tóm tắt].
Câu 2: ...`;
    }

    case 'read_find_faulty_sentence_4opt': {
      return `Bạn là Chuyên gia Khảo thí HSK ${level} chuẩn HSK 3.0.
Hãy biên soạn ${questionCount} câu hỏi Đọc hiểu: Phát hiện câu có lỗi ngữ pháp (病句辨析) trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC HỌC THUẬT:
1. Mỗi câu hỏi gồm đúng 4 câu độc lập A, B, C, D (văn phong trang trọng).
2. DUY NHẤT 1 câu có lỗi ngữ pháp điển hình (thiếu thành phần, kết hợp sai, trật tự sai, trộn lẫn cấu trúc, mâu thuẫn logic). 3 câu còn lại hoàn toàn chuẩn xác.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1: 下列句子中，有语病的一项是：
A. [Câu tiếng Trung A]
B. [Câu tiếng Trung B]
C. [Câu tiếng Trung C]
D. [Câu tiếng Trung D]

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Chỉ rõ từ ngữ hoặc kết cấu bị sai, dạng lỗi ngữ pháp, cách sửa chuẩn và dịch nghĩa câu].
Câu 2: [A/B/C/D]. Giải thích: ...`;
    }

    case 'read_paragraph_sentence_ordering': {
      return `Bạn là Chuyên gia Khảo thí HSK 3.0.
Hãy biên soạn ${questionCount} bộ bài tập Đọc hiểu: Sắp xếp thứ tự đoạn văn (段落排序) trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC CẤU TRÚC:
1. Mỗi bài tập gồm 5 câu văn độc lập (A, B, C, D, E) bị đảo lộn trật tự logic.
2. Ghép lại thành đoạn văn nghị luận hoặc thuyết minh hoàn chỉnh có liên từ rõ ràng. Cung cấp 4 phương án trật tự A, B, C, D.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1:
A. [Câu A]
B. [Câu B]
C. [Câu C]
D. [Câu D]
E. [Câu E]
Trật tự lựa chọn:
A. [Trật tự 1, ví dụ: B-D-A-C-E]
B. [Trật tự 2, ví dụ: B-A-D-C-E]
C. [Trật tự 3, ví dụ: D-B-A-C-E]
D. [Trật tự 4, ví dụ: B-D-C-A-E]

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Thứ tự đúng: B-D-A-C-E. Dịch toàn bộ đoạn văn sang tiếng Việt và phân tích mạch logic liên kết].
Câu 2: [A/B/C/D]. Giải thích: ...`;
    }

    case 'listen_talks_qa_4opt': {
      return `Bạn là Chuyên gia Khảo thí Nghe hiểu HSK 3.0.
Hãy biên soạn bài nghe hiểu dạng độc thoại / bài nói chuyện / diễn thuyết (Talks QA) kèm ${questionCount} câu hỏi trắc nghiệm trình độ HSK ${level}.${lessonHeaderLine}
- Khung từ vựng mục tiêu: ${vocabTargetLine}
- Điểm ngữ pháp trọng tâm: ${grammarFocusLine}
- Chủ đề: ${topic}
- ${pinyinInstruction}

QUY TẮC KỸ THUẬT:
1. Ghi rõ bài nói kèm nhãn 独白/讲话录音内容： để hệ thống bóc tách audio phát âm Neural TTS.
2. Kèm các câu hỏi trắc nghiệm với 4 phương án lựa chọn A, B, C, D.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
独白/讲话录音内容：
[Toàn bộ nội dung bài nói tiếng Trung chuẩn HSK ${level}]

Câu 1: [Câu hỏi 1 về bài nói]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc sau:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa câu hỏi và bài nói, chỉ rõ lý do chọn đáp án và phân tích bẫy nghe].
Câu 2: [A/B/C/D]. Giải thích: ...`;
    }
  }
}

export interface GoldenPromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLevel?: number;
  initialFormat?: GoldenPromptFormatKey | string;
  lessonContext?: LessonScopePromptContext;
  onApplyToEditor?: (promptText: string) => void;
}

export const GoldenPromptLibraryModal: React.FC<GoldenPromptLibraryModalProps> = ({
  isOpen,
  onClose,
  initialLevel = 1,
  initialFormat = 'reading_mcq',
  lessonContext,
  onApplyToEditor,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(initialLevel);
  const [selectedFormat, setSelectedFormat] = useState<GoldenPromptFormatKey>(() => {
    const raw = (initialFormat || 'reading_mcq').toLowerCase();
    if (raw.includes('reorder')) return 'write_sentence_reorder_4opt';
    if (raw.includes('tianzige') || raw.includes('pinyin')) return 'write_tianzige_from_pinyin';
    if (raw.includes('short_essay') || raw.includes('80char')) return 'write_short_essay_80chars';
    if (raw.includes('topic_essay') || raw.includes('200char')) return 'write_topic_essay_200chars';
    if (raw.includes('summary') || raw.includes('400char')) return 'write_summary_shortening_400chars';
    if (raw.includes('faulty') || raw.includes('bingju')) return 'read_find_faulty_sentence_4opt';
    if (raw.includes('paragraph') || raw.includes('ordering')) return 'read_paragraph_sentence_ordering';
    if (raw.includes('talk') || raw.includes('lecture')) return 'listen_talks_qa_4opt';
    if (raw.includes('listen')) return 'listening_dialogue';
    if (raw.includes('match')) return 'dialogue_matching';
    if (raw.includes('blank') || raw.includes('fill')) return 'fill_in_blank';
    if (raw.includes('true') || raw.includes('false')) return 'true_false';
    if (raw.includes('json')) return 'json_strict';
    const matched = GOLDEN_PROMPT_FORMATS.find((f) => f.key === raw);
    return matched ? matched.key : 'reading_mcq';
  });
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [topic, setTopic] = useState<string>(() =>
    lessonContext
      ? `Bài ${lessonContext.lessonNumber}: ${lessonContext.titleHanzi} (${lessonContext.titleVietnamese})`
      : 'Đời sống hàng ngày, gia đình, công việc, du lịch'
  );
  const [customVocabText, setCustomVocabText] = useState<string>(() => lessonContext?.vocabText || '');
  const [customGrammarText, setCustomGrammarText] = useState<string>(() => lessonContext?.grammarText || '');
  const [includePinyin, setIncludePinyin] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync initial level when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialLevel && initialLevel >= 1 && initialLevel <= 6) {
        setSelectedLevel(initialLevel);
      }
      if (lessonContext) {
        setTopic(`Bài ${lessonContext.lessonNumber}: ${lessonContext.titleHanzi} (${lessonContext.titleVietnamese})`);
        setCustomVocabText(lessonContext.vocabText || '');
        setCustomGrammarText(lessonContext.grammarText || '');
      }
      setCopied(false);
    }
  }, [isOpen, initialLevel, lessonContext]);

  // Adjust pinyin default and clamp question count when level changes
  const handleLevelChange = useCallback((level: number) => {
    setSelectedLevel(level);
    setIncludePinyin(level <= 3);
    const validOpts = getQuestionCountOptionsForLevel(level).map((o) => o.value);
    setQuestionCount((prev) => (validOpts.includes(prev) ? prev : validOpts[0] || 10));
  }, []);

  // Compute the live generated prompt text
  const fullPromptText = useMemo(() => {
    return buildGoldenPrompt({
      level: selectedLevel,
      format: selectedFormat,
      questionCount,
      topic,
      includePinyin,
      lessonContext: lessonContext
        ? {
            ...lessonContext,
            vocabText: customVocabText,
            grammarText: customGrammarText,
          }
        : undefined,
    });
  }, [selectedLevel, selectedFormat, questionCount, topic, includePinyin, lessonContext, customVocabText, customGrammarText]);

  // Handle clipboard copy
  const handleCopyPrompt = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullPromptText);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = fullPromptText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy prompt to clipboard:', err);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentLevelMeta = HSK_LEVEL_META[selectedLevel] || HSK_LEVEL_META[1];
  const activeFormatMeta =
    GOLDEN_PROMPT_FORMATS.find((f) => f.key === selectedFormat) || GOLDEN_PROMPT_FORMATS[0];
  const ActiveFormatIcon = activeFormatMeta.icon;

  return (
    <div
      data-testid="golden-prompts-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        data-testid="golden-prompts-modal"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                  Thư Viện Prompt Chuẩn Vàng (Golden Prompt Library)
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                  HSK 1–6 100% Parser Clean
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Bộ prompt mẫu chuẩn hóa HSK 1-6 giúp AI sinh câu hỏi bóc tách tự động 100% không cần sửa lỗi
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-close-golden-prompts"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Đóng thư viện prompt (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Section 1: HSK Level Selection (Pill Buttons) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                1. Chọn Cấp Độ HSK (HSK Level):
              </label>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {currentLevelMeta.vocabTarget}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((lvl) => {
                const isSelected = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    data-testid={`btn-filter-hsk-${lvl}`}
                    onClick={() => handleLevelChange(lvl)}
                    className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                        : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    HSK {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Question Format Selection Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              2. Chọn Định Dạng Đề Thi (Diverse Question Formats):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {GOLDEN_PROMPT_FORMATS.map((fmt) => {
                const IconComponent = fmt.icon;
                const isSelected = selectedFormat === fmt.key;
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    data-testid={`btn-filter-format-${fmt.key}`}
                    onClick={() => setSelectedFormat(fmt.key)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 font-bold'
                        : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconComponent
                        className={`w-4 h-4 ${
                          isSelected ? 'text-amber-500' : 'text-[var(--color-text-secondary)]'
                        }`}
                      />
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold leading-tight">{fmt.shortLabel}</div>
                    <div className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{fmt.skill}</div>
                  </button>
                );
              })}
            </div>
            {/* Format Description Banner */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
              <ActiveFormatIcon className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <strong className="text-[var(--color-text-primary)]">{activeFormatMeta.label}: </strong>
                {activeFormatMeta.description}
              </div>
            </div>
          </div>

          {/* Section 3: Prompt Parameters Customizer */}
          <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <Sliders className="w-4 h-4 text-[var(--color-primary)]" />
              <span>3. Tùy Biến Tham Số Prompt (Prompt Parameter Customizer):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Question Count Selector */}
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  Số lượng câu hỏi (theo HSK {selectedLevel}):
                </label>
                <select
                  data-testid="select-question-count"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                >
                  {getQuestionCountOptionsForLevel(selectedLevel).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pinyin Toggle */}
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  Yêu cầu Pinyin:
                </label>
                <button
                  type="button"
                  data-testid="toggle-include-pinyin"
                  role="switch"
                  aria-checked={includePinyin}
                  onClick={() => setIncludePinyin((prev) => !prev)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                    includePinyin
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span>{includePinyin ? '✓ Kèm Pinyin' : '✕ Không Pinyin'}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      includePinyin ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                </button>
              </div>

              {/* Topic Input */}
              <div className="sm:col-span-6 space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  Chủ đề đề thi ([CHỦ ĐỀ]):
                </label>
                <input
                  type="text"
                  data-testid="input-prompt-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Trường học, gia đình, công việc, du lịch..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/60 focus:outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-[var(--color-text-secondary)] mr-1">Chủ đề gợi ý:</span>
              {QUICK_TOPIC_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTopic(sug)}
                  className="text-[10px] font-medium px-2 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all cursor-pointer"
                >
                  + {sug}
                </button>
              ))}
            </div>

            {lessonContext && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--color-primary)]">
                    Từ vựng bài học muốn kiểm tra (Giáo viên tự chọn / sửa):
                  </label>
                  <textarea
                    rows={2}
                    value={customVocabText}
                    onChange={(e) => setCustomVocabText(e.target.value)}
                    placeholder="Nhập các từ vựng bài học muốn đưa vào đề..."
                    className="w-full p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--color-primary)]">
                    Cấu trúc ngữ pháp bài học muốn kiểm tra (Giáo viên tự chọn / sửa):
                  </label>
                  <textarea
                    rows={2}
                    value={customGrammarText}
                    onChange={(e) => setCustomGrammarText(e.target.value)}
                    placeholder="Nhập các cấu trúc ngữ pháp bài học muốn xoáy sâu..."
                    className="w-full p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Live Prompt Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Nội Dung Prompt Mẫu Sẵn Sàng (Live Preview):
                </label>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {fullPromptText.length} ký tự
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)]">
              <textarea
                data-testid="textarea-prompt-preview"
                readOnly
                rows={11}
                value={fullPromptText}
                className="w-full p-4 font-mono text-xs text-[var(--color-text-primary)] bg-transparent resize-y leading-relaxed focus:outline-hidden"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  data-testid="btn-copy-golden-prompt-floating"
                  onClick={handleCopyPrompt}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            {/* Canonical Output Guarantee Callout */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Bảo chứng bóc tách tự động 100% (Canonical Output Guarantee):</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                  Tất cả prompt chuẩn vàng đều yêu cầu AI xuất bảng footer{' '}
                  <code className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 font-mono text-[10px]">
                    ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
                  </code>
                  . Khi dán phản hồi của ChatGPT, Claude, Gemini hoặc DeepSeek vào MinNese, hệ thống sẽ bóc tách chính xác 100% không để lộ đáp án và tự động phân loại đúng kỹ năng!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {copied && (
              <span
                data-testid="badge-copied-toast"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs animate-in fade-in flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>✓ Đã sao chép vào bộ nhớ tạm!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {onApplyToEditor && (
              <button
                type="button"
                data-testid="btn-apply-golden-prompt"
                onClick={() => {
                  onApplyToEditor(fullPromptText);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text-primary)] font-bold text-xs transition-all cursor-pointer"
              >
                Nhập vào bộ soạn đề
              </button>
            )}

            <button
              type="button"
              data-testid="btn-copy-golden-prompt"
              onClick={handleCopyPrompt}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Prompt 1-Click</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldenPromptLibraryModal;
