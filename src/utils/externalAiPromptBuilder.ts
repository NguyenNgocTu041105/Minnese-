/**
 * 1-Click External AI Prompt Builder for Minnese HSK 3.0 Studio (R4)
 *
 * Generates specialized, zero-correction prompts tailored for external AI chat interfaces:
 * - Gemini (Google)
 * - DeepSeek (R1 / V3)
 * - Claude (Anthropic)
 * - Grok (xAI)
 * - ChatGPT (OpenAI)
 *
 * Enforces:
 * 1. HSK 3.0 (2021) vocabulary boundaries and forbidden over-level lookalikes.
 * 2. IELTS-style cognitive traps (anti-verbatim paraphrase, self-correction, rhetorical attitude, numerical twists).
 * 3. 100% compatibility with Minnese's Universal Question Parser (multi-part 20-question papers, dialogue scripts, word banks, or strict JSON).
 */

export type ExternalAiModelTarget = 'gemini' | 'deepseek' | 'claude' | 'grok' | 'chatgpt';

export type ExternalPromptFormatType =
  | 'multi_part_20q'
  | 'ielts_listening_traps'
  | 'shared_word_bank_cloze'
  | 'reading_passage_multi_qa'
  | 'json_strict';

export interface ExternalPromptConfig {
  level: number;
  formatType: ExternalPromptFormatType;
  targetModel?: ExternalAiModelTarget;
  modelTarget?: ExternalAiModelTarget;
  topic?: string;
  questionCount?: number;
  includePinyinInPrompt?: boolean;
  includePinyin?: boolean;
}

export interface HskLevelConstraintSpec {
  level: number;
  vocabCount: number;
  cefr: string;
  grammarSummary: string;
  forbiddenWordsSample: string[];
}

export const HSK_PROMPT_LEVEL_SPECS: Record<number, HskLevelConstraintSpec> = {
  1: {
    level: 1,
    vocabCount: 300,
    cefr: 'A1',
    grammarSummary: 'Câu đơn cơ bản (是, 有, 在), đại từ nghi vấn (什么, 谁, 哪儿, 多少, 怎么), trợ từ (的, 了, 吗, 呢), động từ năng nguyện (想, 会, 能).',
    forbiddenWordsSample: ['因为', '所以', '虽然', '但是', '已经', '游泳', '咖啡', '自行车', '爷爷', '奶奶', '虽然', '如果'],
  },
  2: {
    level: 2,
    vocabCount: 500,
    cefr: 'A2',
    grammarSummary: 'Câu so sánh (比), bổ ngữ kết quả/thời lượng đơn giản, cặp liên từ (因为…所以…, 虽然…但是…), trạng ngữ chỉ thời gian/nơi chốn, trợ từ (着, 过).',
    forbiddenWordsSample: ['尽管', '不仅', '而且', '既然', '哪怕', '竟然', '否则', '似乎'],
  },
  3: {
    level: 3,
    vocabCount: 1000,
    cefr: 'B1',
    grammarSummary: 'Câu chữ 把, câu bị động chữ 被, bổ ngữ xu hướng kép, bổ ngữ khả năng, cấu trúc 越…越…, 一边…一边…, 只要…就….',
    forbiddenWordsSample: ['固然', '尚且', '何况', '未免', '姑且', '索性'],
  },
  4: {
    level: 4,
    vocabCount: 2000,
    cefr: 'B2',
    grammarSummary: 'Liên từ phức hợp (无论…都…, 即使…也…, 既然…就…, 哪怕…也…), phân biệt từ cận nghĩa, ngôn ngữ viết trang trọng và hội thoại công sở.',
    forbiddenWordsSample: ['诚然', '动辄', '姑且', '未免'],
  },
  5: {
    level: 5,
    vocabCount: 3600,
    cefr: 'C1',
    grammarSummary: 'Thành ngữ (成语) thông dụng, cấu trúc nghị luận, suy luận hàm ý, thái độ ẩn ý của người nói và văn phong báo chí - học thuật.',
    forbiddenWordsSample: [],
  },
  6: {
    level: 6,
    vocabCount: 5400,
    cefr: 'C2',
    grammarSummary: 'Thành ngữ cao cấp, tu từ học, phân tích sắc thái từ vựng tinh tế, đọc hiểu bình luận xã hội/khoa học và phát hiện lỗi câu (病句).',
    forbiddenWordsSample: [],
  },
};

export const EXTERNAL_MODEL_LABELS: Record<ExternalAiModelTarget, { name: string; tip: string }> = {
  gemini: {
    name: 'Google Gemini',
    tip: 'Tối ưu khả năng tạo bảng biểu 4 phần và giải thích tiếng Việt tự nhiên.',
  },
  deepseek: {
    name: 'DeepSeek (V3 / R1)',
    tip: 'Thế mạnh vượt trội về ngữ pháp tiếng Trung chuẩn xác và tạo bẫy logic tự nhiên.',
  },
  claude: {
    name: 'Anthropic Claude',
    tip: 'Mạnh về kịch bản hội thoại nhiều lượt có chiều sâu tâm lý và bẫy suy luận kiểu IELTS.',
  },
  grok: {
    name: 'xAI Grok',
    tip: 'Tốc độ nhanh, bối cảnh thực tế hiện đại, bám sát định dạng đầu ra.',
  },
  chatgpt: {
    name: 'OpenAI ChatGPT',
    tip: 'Cân bằng tốt giữa cấu trúc JSON nghiêm ngặt và đề thi chuẩn khảo thí.',
  },
};

export const EXTERNAL_PROMPT_FORMAT_LABELS: Record<
  ExternalPromptFormatType,
  { title: string; subtitle: string; badge: string; defaultCount: number }
> = {
  multi_part_20q: {
    title: 'Đề thi HSK Tổng Hợp 4 Phần (Đúng/Sai, Ghép câu A–E, Phản hồi A–E, Điền từ A–E)',
    subtitle: 'Chuẩn cấu trúc đề thi thực tế 20 câu kèm bảng Đáp án & Giải thích ở cuối',
    badge: 'Đề 4 Phần Chuẩn HSK',
    defaultCount: 20,
  },
  ielts_listening_traps: {
    title: 'Đề Nghe Hội Thoại Bẫy Thông Minh Kiểu IELTS (Nam – Nữ)',
    subtitle: 'Tích hợp bẫy tự sửa lời (self-correction), paraphrase chống lặp từ và bẫy số liệu',
    badge: 'Nghe Hiểu Bẫy IELTS',
    defaultCount: 10,
  },
  shared_word_bank_cloze: {
    title: 'Điền Từ Vào Chỗ Trống Dùng Chung Bảng Từ Vựng (A–E)',
    subtitle: '5–10 câu điền khuyết dùng chung 1 ngân hàng từ vựng A–E kiểm tra ngữ pháp',
    badge: 'Bảng Từ Vựng A–E',
    defaultCount: 10,
  },
  reading_passage_multi_qa: {
    title: 'Đọc Hiểu Đoạn Văn / Suy Luận Ngữ Cảnh (A–D)',
    subtitle: 'Đoạn văn kèm câu hỏi kiểm tra thông tin chi tiết, suy luận và ý chính',
    badge: 'Đọc Hiểu Chuyên Sâu',
    defaultCount: 10,
  },
  json_strict: {
    title: 'Mảng JSON Chuẩn Minnese QBank (100% Zero-Error Import)',
    subtitle: 'Xuất trực tiếp mảng JSON có đủ stem, options, answer_idx, pinyin, explanation_vi',
    badge: 'JSON Chuẩn Hệ Thống',
    defaultCount: 10,
  },
};

/**
 * Builds a complete, ready-to-copy prompt string for external AI models.
 */
export function buildExternalAiPrompt(config: ExternalPromptConfig): string {
  const level = Math.min(6, Math.max(1, Math.round(config.level || 1)));
  const spec = HSK_PROMPT_LEVEL_SPECS[level] || HSK_PROMPT_LEVEL_SPECS[1];
  const formatType = config.formatType || 'multi_part_20q';
  const targetModel = config.targetModel || config.modelTarget || 'gemini';
  const modelMeta = EXTERNAL_MODEL_LABELS[targetModel] || EXTERNAL_MODEL_LABELS.gemini;
  const topicText = config.topic?.trim()
    ? `Chủ đề trọng tâm: "${config.topic.trim()}".`
    : 'Chủ đề đa dạng: Đời sống hàng ngày, học tập, công việc, mua sắm, giao thông, du lịch.';
  const count = config.questionCount && config.questionCount > 0
    ? config.questionCount
    : EXTERNAL_PROMPT_FORMAT_LABELS[formatType]?.defaultCount || 10;
  const includePinyin = config.includePinyin ?? config.includePinyinInPrompt ?? (level <= 2);

  const forbiddenLine =
    spec.forbiddenWordsSample.length > 0
      ? `\n- TUYỆT ĐỐI KHÔNG dùng từ vựng vượt cấp (ví dụ cấm dùng ở HSK ${level}: ${spec.forbiddenWordsSample.join(', ')}).`
      : '';

  const pinyinInstruction = includePinyin
    ? '- Kèm phiên âm Pinyin chuẩn thanh điệu trong ngoặc đơn ngay sau chữ Hán, ví dụ: 苹果 (píngguǒ).'
    : '- Chỉ viết chữ Hán chuẩn ở phần câu hỏi/lựa chọn (không chèn Pinyin vào giữa câu chữ Hán để rèn nhận diện mặt chữ), nhưng ghi rõ Pinyin trong phần giải thích.';

  const headerBlock = `[Hệ thống Khảo thí HSK 3.0 Minnese — Prompt tối ưu cho ${modelMeta.name}]
Bạn là Chuyên gia Ra đề Khảo thí Tiếng Trung Quốc tế chuẩn HSK 3.0 (CLEC / CTI).
Hãy biên soạn bộ đề thi **HSK ${level}** (${spec.cefr} — phạm vi ${spec.vocabCount} từ vựng chuẩn).
${topicText}

### GIỚI HẠN TỪ VỰNG BẮT BUỘC & CHẤT LƯỢNG SƯ PHẠM:
- Phạm vi từ vựng & ngữ pháp: Bám sát khung HSK ${level} (${spec.grammarSummary}).${forbiddenLine}
${pinyinInstruction}
- Tính đơn nhất đáp án: Mỗi câu hỏi chỉ có DUY NHẤT 1 đáp án đúng hoàn toàn về cả ngữ pháp lẫn ngữ nghĩa; các phương án nhiễu phải cùng từ loại (POS) nhưng sai rõ ràng về ngữ cảnh hoặc logic.
- Mọi lời giải thích đều phải viết bằng **tiếng Việt** chi tiết, dịch nghĩa câu và giải thích vì sao đáp án đó đúng.`;

  if (formatType === 'multi_part_20q') {
    return `${headerBlock}

### CẤU TRÚC ĐỀ THI TỔNG HỢP 4 PHẦN (20 CÂU — ĐỊNH DẠNG CHUẨN MINNESE):
Hãy trình bày đúng 4 phần sau (không lược bỏ câu nào):

第一部分: 第 1 - 5 题 (Phần 1: Câu 1 - 5)
Quy tắc: Đọc từ vựng và câu tương ứng, xác định xem nội dung hai bên có đồng nhất ý nghĩa hay không. Điền đúng (√) hoặc sai (×).
1. [Từ vựng chữ Hán] ([Pinyin])
[Câu tiếng Trung hoàn chỉnh] ([Pinyin câu]) → [ ]
(Tạo đủ từ câu 1 đến câu 5, xen kẽ cả câu Đúng √ và câu Sai × có bẫy phủ định 没/不 hoặc khác phạm trù ngữ nghĩa)

第二部分: 第 6 - 10 题 (Phần 2: Câu 6 - 10)
Quy tắc: Chọn một phương án phù hợp nhất từ A đến E để ghép với từng câu ngữ cảnh (mỗi phương án chỉ dùng một lần).
A. [Câu lựa chọn A] ([Pinyin])
B. [Câu lựa chọn B] ([Pinyin])
C. [Câu lựa chọn C] ([Pinyin])
D. [Câu lựa chọn D] ([Pinyin])
E. [Câu lựa chọn E] ([Pinyin])
6. [Câu ngữ cảnh 6] ([Pinyin]) → [ ]
7. [Câu ngữ cảnh 7] ([Pinyin]) → [ ]
8. [Câu ngữ cảnh 8] ([Pinyin]) → [ ]
9. [Câu ngữ cảnh 9] ([Pinyin]) → [ ]
10. [Câu ngữ cảnh 10] ([Pinyin]) → [ ]

第三部分: 第 11 - 15 题 (Phần 3: Câu 11 - 15)
Quy tắc: Chọn chữ cái từ A đến E tương ứng với câu trả lời đúng cho từng câu hỏi.
A. [Câu phản hồi A] ([Pinyin])
B. [Câu phản hồi B] ([Pinyin])
C. [Câu phản hồi C] ([Pinyin])
D. [Câu phản hồi D] ([Pinyin])
E. [Câu phản hồi E] ([Pinyin])
11. [Câu hỏi 11] ([Pinyin]) → [ ]
12. [Câu hỏi 12] ([Pinyin]) → [ ]
13. [Câu hỏi 13] ([Pinyin]) → [ ]
14. [Câu hỏi 14] ([Pinyin]) → [ ]
15. [Câu hỏi 15] ([Pinyin]) → [ ]

第四部分: 第 16 - 20 题 (Phần 4: Câu 16 - 20)
Quy tắc: Chọn từ thích hợp trong bảng A–E để điền vào chỗ trống ______ trong mỗi câu (mỗi từ chỉ dùng một lần).
A. [Từ A] ([Pinyin])
B. [Từ B] ([Pinyin])
C. [Từ C] ([Pinyin])
D. [Từ D] ([Pinyin])
E. [Từ E] ([Pinyin])
16. [Câu có chỗ trống ______ số 16] ([Pinyin]) → [ ]
17. [Câu có chỗ trống ______ số 17] ([Pinyin]) → [ ]
18. [Câu có chỗ trống ______ số 18] ([Pinyin]) → [ ]
19. [Câu có chỗ trống ______ số 19] ([Pinyin]) → [ ]
20. [Câu có chỗ trống ______ số 20] ([Pinyin]) → [ ]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT
1. [√ hoặc ×] - Giải thích: [Giải thích tiếng Việt chi tiết]
... (Ghi đầy đủ đáp án và lời giải từ câu 1 đến câu 20)`;
  }

  if (formatType === 'ielts_listening_traps') {
    return `${headerBlock}

### KỸ THUẬT RA ĐỀ NGHE HỘI THOẠI BẪY THÔNG MINH KIỂU IELTS (${count} CÂU):
Hãy thiết kế ${count} câu hỏi Nghe hiểu hội thoại Nam (男) – Nữ (女) (HSK ${level}) áp dụng 4 kỹ thuật bẫy tư duy kiểu IELTS:
1. **Chống bắt từ khóa nguyên văn (Anti-Verbatim Paraphrase):** Đáp án đúng phải diễn đạt lại bằng từ đồng nghĩa/cấu trúc tương đương; các từ xuất hiện nguyên văn trong hội thoại được đưa vào phương án nhiễu (distractors).
2. **Bẫy tự sửa lời / Đổi ý phút chót (Self-Correction Twist):** Nhân vật nêu ý định A trước (ví dụ: đi tàu hỏa / hẹn 8 giờ), nhưng sau đó sửa lại thành B (ví dụ: hết vé nên đi máy bay / dời sang 9 giờ rưỡi).
3. **Bẫy câu hỏi tu từ & Thái độ ẩn ý (Rhetorical Attitude):** Sử dụng câu phản vấn hoặc ngữ khí từ chối khéo.
4. **Bẫy tính toán số liệu / thời gian (Numerical Twist):** Yêu cầu cộng/trừ đơn giản về giá tiền, thời gian hoặc số lượng.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC CHO MỖI CÂU (TỪ CÂU 1 ĐẾN CÂU ${count}):
Câu 1:
男：[Lời thoại nhân vật Nam]
女：[Lời thoại nhân vật Nữ]
问：[Câu hỏi về hội thoại]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
Đáp án: [A/B/C/D]
Giải thích: [Dịch nghĩa hội thoại và phân tích rõ bẫy nhiễu bằng tiếng Việt]`;
  }

  if (formatType === 'shared_word_bank_cloze') {
    const groupsCount = Math.max(1, Math.ceil(count / 5));
    return `${headerBlock}

### ĐỊNH DẠNG ĐIỀN TỪ VÀO CHỖ TRỐNG DÙNG CHUNG BẢNG TỪ A–E (${groupsCount} PHẦN, TỔNG ${groupsCount * 5} CÂU):
Mỗi phần gồm 1 bảng từ vựng A–E (5 từ thuộc các từ loại/ngữ cảnh dễ nhầm lẫn trong HSK ${level}) và 5 câu có chỗ trống \`______\`:

第四部分: 第 1 - 5 题
Quy tắc: Chọn từ thích hợp trong bảng để điền vào chỗ trống trong mỗi câu.
A. [Từ A] ([Pinyin])
B. [Từ B] ([Pinyin])
C. [Từ C] ([Pinyin])
D. [Từ D] ([Pinyin])
E. [Từ E] ([Pinyin])
1. [Câu tiếng Trung có chỗ trống ______] → [ ]
2. [Câu tiếng Trung có chỗ trống ______] → [ ]
3. [Câu tiếng Trung có chỗ trống ______] → [ ]
4. [Câu tiếng Trung có chỗ trống ______] → [ ]
5. [Câu tiếng Trung có chỗ trống ______] → [ ]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT
1. [A/B/C/D/E] - Giải thích: [Giải thích ngữ pháp & nghĩa tiếng Việt]
... (Liệt kê đủ đáp án và giải thích cho toàn bộ các câu)`;
  }

  if (formatType === 'reading_passage_multi_qa') {
    return `${headerBlock}

### ĐỊNH DẠNG ĐỌC HIỂU ĐOẠN VĂN & SUY LUẬN (${count} CÂU):
Hãy tạo ${count} câu hỏi Đọc hiểu HSK ${level}. Mỗi câu gồm một đoạn văn ngắn (2–5 câu) và câu hỏi suy luận (không trùng lặp nguyên văn câu chữ của đoạn văn):

Câu 1:
[Đoạn văn tiếng Trung HSK ${level}]
问：[Câu hỏi suy luận / tìm ý chính / tìm thông tin đúng]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
Đáp án: [A/B/C/D]
Giải thích: [Dịch đoạn văn và giải thích chi tiết lý do chọn đáp án bằng tiếng Việt]`;
  }

  // Default: json_strict
  return `${headerBlock}

### ĐỊNH DẠNG ĐẦU RA JSON NGHIÊM NGẶT (${count} CÂU):
Chỉ trả về một mảng JSON hợp lệ đặt trong khối \`\`\`json ... \`\`\` theo đúng schema sau:
\`\`\`json
[
  {
    "stem": "Câu hỏi tiếng Trung (có ____ nếu là điền từ, hoặc 男：...\\n女：...\\n问：... nếu là bài nghe)",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "answer_idx": 0,
    "pinyin": "Phiên âm Pinyin có dấu thanh điệu đầy đủ của câu hỏi",
    "explanation_vi": "Dịch nghĩa câu hỏi và giải thích chi tiết bằng tiếng Việt vì sao đáp án đúng và vì sao các phương án khác sai.",
    "level": ${level},
    "skill": "${level <= 2 ? 'reading' : 'reading'}",
    "part_type": "read_fill_blank_4opt"
  }
]
\`\`\``;
}
