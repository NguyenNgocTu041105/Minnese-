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

export type ExternalAiModelTarget = 'gemini' | 'deepseek' | 'claude' | 'grok' | 'chatgpt' | 'glm';

export type ExternalPromptFormatType =
  | 'full_cbt_mock_exam'
  | 'multi_part_20q'
  | 'random_mixed_variety'
  | 'listen_mixed_all_parts'
  | 'listen_true_false_statement'
  | 'listen_picture_match_4opt'
  | 'listen_dialogue_picture_match_6opt'
  | 'ielts_listening_traps'
  | 'listen_long_dialogue_4turns'
  | 'listen_talks_qa_4opt'
  | 'read_mixed_all_parts'
  | 'shared_word_bank_cloze'
  | 'read_dialogue_matching_5opt'
  | 'reading_passage_multi_qa'
  | 'read_paragraph_sentence_ordering'
  | 'read_find_faulty_sentence_4opt'
  | 'write_mixed_all_parts'
  | 'write_tianzige_from_pinyin'
  | 'write_sentence_reorder_4opt'
  | 'write_short_essay_80chars'
  | 'write_topic_essay_200chars'
  | 'write_summary_shortening_400chars'
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
    vocabCount: 500,
    cefr: 'A1',
    grammarSummary: 'Câu đơn cơ bản (是, 有, 在), đại từ nghi vấn (什么, 谁, 哪儿, 多少, 怎么), trợ từ (的, 了, 吗, 呢), động từ năng nguyện (想, 会, 能).',
    forbiddenWordsSample: ['因为', '所以', '虽然', '但是', '已经', '游泳', '咖啡', '自行车', '爷爷', '奶奶', '如果'],
  },
  2: {
    level: 2,
    vocabCount: 1272,
    cefr: 'A2',
    grammarSummary: 'Câu so sánh (比), bổ ngữ kết quả/thời lượng đơn giản, cặp liên từ (因为…所以…, 虽然…但是…), trạng ngữ chỉ thời gian/nơi chốn, trợ từ (着, 过).',
    forbiddenWordsSample: ['尽管', '不仅', '而且', '既然', '哪怕', '竟然', '否则', '似乎'],
  },
  3: {
    level: 3,
    vocabCount: 2245,
    cefr: 'B1',
    grammarSummary: 'Câu chữ 把, câu bị động chữ 被, bổ ngữ xu hướng kép, bổ ngữ khả năng, cấu trúc 越…越…, 一边…一边…, 只要…就….',
    forbiddenWordsSample: ['固然', '尚且', '何况', '未免', '姑且', '索性'],
  },
  4: {
    level: 4,
    vocabCount: 3245,
    cefr: 'B2',
    grammarSummary: 'Liên từ phức hợp (无论…都…, 即使…也…, 既然…就…, 哪怕…也…), phân biệt từ cận nghĩa, ngôn ngữ viết trang trọng và hội thoại công sở.',
    forbiddenWordsSample: ['诚然', '动辄', '姑且', '未免'],
  },
  5: {
    level: 5,
    vocabCount: 4316,
    cefr: 'C1',
    grammarSummary: 'Thành ngữ (成语) thông dụng, cấu trúc nghị luận, suy luận hàm ý, thái độ ẩn ý của người nói và văn phong báo chí - học thuật.',
    forbiddenWordsSample: [],
  },
  6: {
    level: 6,
    vocabCount: 5456,
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
  glm: {
    name: 'Zhipu AI (GLM-4 / GLM-4-Flash)',
    tip: 'Chuẩn ngữ liệu Bộ Giáo dục Trung Quốc, văn phong hiện đại đời sống bản xứ, bám sát HSK 3.0 GF 0025-2021.',
  },
};

export const EXTERNAL_MODEL_DIRECTIVES: Record<ExternalAiModelTarget, string> = {
  gemini: '- Tối ưu định dạng Markdown chuẩn, các phương án A, B, C, D nằm trên từng dòng riêng biệt; lời giải tiếng Việt tự nhiên, lưu loát.',
  deepseek: '- Bắt đầu trực tiếp từ nội dung đề thi, không viết lời dẫn mở đầu hay kết thúc. Nếu là mô hình Reasoning (R1), tập trung suy luận vào bẫy logic sâu sắc nhưng tuyệt đối không in thẻ suy nghĩ <think> vào khối nội dung đề thi.',
  claude: '- Kịch bản hội thoại tự nhiên, có chiều sâu tâm lý và bẫy suy luận phong phú kiểu IELTS; cấu trúc logic mạch lạc, bám sát mẫu.',
  grok: '- Tốc độ ra đề nhanh, bối cảnh thực tế hiện đại, ngắn gọn, tuân thủ chính xác từng mục định dạng đầu ra.',
  chatgpt: '- Đảm bảo tính đơn nhất của đáp án: Mỗi câu chỉ có duy nhất 1 đáp án đúng hoàn toàn; các phương án nhiễu phải cùng từ loại (POS) nhưng sai rõ rệt về ngữ cảnh logic.',
  glm: '- Tuân thủ nghiêm ngặt Tiêu chuẩn Giáo dục Hán ngữ Quốc tế HSK 3.0 (GF 0025-2021). Sử dụng văn phong bản xứ chuẩn xác, tích hợp ngữ cảnh đời sống hiện đại Trung Quốc (thanh toán di động, giao đồ ăn, du lịch xanh, xe điện, công nghệ số). Trả về trực tiếp nội dung đề thi, tuyệt đối không viết lời dẫn mở đầu hay kết thúc giao tiếp.',
};

export const EXTERNAL_PROMPT_FORMAT_LABELS: Record<
  ExternalPromptFormatType,
  {
    title: string;
    subtitle: string;
    badge: string;
    defaultCount: number;
    skillGroup: 'all' | 'listening' | 'reading' | 'writing';
    supportedLevels: number[];
  }
> = {
  full_cbt_mock_exam: {
    title: '🔥 Trọn Đề Thi Thử HSK (Đủ Nghe + Đọc + Viết đan xen)',
    subtitle: 'Tự động phân bổ đủ tỷ lệ Nghe hiểu – Đọc hiểu – Viết đúng chuẩn đề thi máy HSK theo cấp độ đã chọn',
    badge: 'Trọn Đề Thi Máy CBT',
    defaultCount: 40,
    skillGroup: 'all',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  multi_part_20q: {
    title: '📋 Đề Tổng Hợp 4 Phần (Đúng/Sai + Ghép + Điền từ)',
    subtitle: 'Chuẩn cấu trúc đề thi thực tế 4 phần đan xen (tự động chia theo số lượng câu đã chọn) kèm bảng Đáp án & Giải thích',
    badge: 'Đề 4 Phần Chuẩn HSK',
    defaultCount: 20,
    skillGroup: 'all',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  random_mixed_variety: {
    title: '🎲 Đề Trộn Đa Dạng Tùy Hứng (Xoay vòng 5–6 dạng câu)',
    subtitle: 'Tự động đan xen liên tục Hội thoại, Điền từ, Phán đoán Đúng/Sai, Sắp xếp câu và Đọc hiểu để không bị lặp lại 1 kiểu',
    badge: 'Đề Đan Xen Đa Dạng',
    defaultCount: 20,
    skillGroup: 'all',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  listen_mixed_all_parts: {
    title: '🎧 Nghe: Đề Nghe Tổng Hợp Đan Xen (Chuẩn theo cấp HSK)',
    subtitle: 'Tự động chia các phần Nghe khớp chính xác với cấp độ HSK đang chọn (đồng bộ 4 đáp án A, B, C, D)',
    badge: 'Đề Nghe Chuẩn Cấp HSK',
    defaultCount: 20,
    skillGroup: 'listening',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  listen_true_false_statement: {
    title: '🎧 Nghe Phần 1: Phán đoán Đúng / Sai câu nói (对 / 错)',
    subtitle: 'Nghe câu mô tả hoặc đoạn độc thoại ngắn (kèm [IMG: ...] minh họa ở HSK 1–2) và phán đoán Đúng (A. 对) hay Sai (B. 错)',
    badge: 'Nghe: Đúng / Sai (对/错)',
    defaultCount: 10,
    skillGroup: 'listening',
    supportedLevels: [1, 2, 3, 4],
  },
  listen_picture_match_4opt: {
    title: '🎧 Nghe: Nghe câu chọn 1 trong 4 tranh [IMG: ...] (A, B, C, D)',
    subtitle: 'Nghe lời thoại ngắn và chọn đúng 1 trong 4 phương án hình ảnh A, B, C, D gắn thẻ [IMG: ...] tiếng Anh sạch',
    badge: 'Nghe: Chọn Tranh (4 lựa chọn)',
    defaultCount: 10,
    skillGroup: 'listening',
    supportedLevels: [1, 2],
  },
  listen_dialogue_picture_match_6opt: {
    title: '🎧 Nghe: Nghe hội thoại ghép bảng 6 tranh [IMG: ...] (A–F)',
    subtitle: 'Nghe hội thoại ngắn Nam–Nữ và ghép với kho 6 hình ảnh A–F mô tả bằng thẻ [IMG: ...] tiếng Anh sạch',
    badge: 'Nghe: Ghép Tranh (A–F)',
    defaultCount: 10,
    skillGroup: 'listening',
    supportedLevels: [1, 2, 3],
  },
  ielts_listening_traps: {
    title: '🎧 Nghe Phần 2: Hội thoại ngắn 2 lượt (Nam – Nữ)',
    subtitle: 'Hội thoại ngắn 2 lượt giữa Nam và Nữ kèm câu hỏi kiểm tra thông tin / suy luận đúng trình độ HSK',
    badge: 'Nghe: Hội Thoại Ngắn',
    defaultCount: 10,
    skillGroup: 'listening',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  listen_long_dialogue_4turns: {
    title: '🎧 Nghe Phần 3: Hội thoại nhiều lượt qua lại (Nam – Nữ)',
    subtitle: 'Hội thoại 3–6 lượt qua lại giữa Nam và Nữ kèm câu hỏi suy luận về địa điểm, quan hệ, nguyên nhân hoặc hành động',
    badge: 'Nghe: Hội Thoại Nhiều Lượt',
    defaultCount: 10,
    skillGroup: 'listening',
    supportedLevels: [2, 3, 4, 5, 6],
  },
  listen_talks_qa_4opt: {
    title: '🎧 Nghe Phần 4: Bài nói / Độc thoại / Tin tức dài (HSK 4–6)',
    subtitle: 'Bài nói / diễn thuyết dài kèm câu hỏi trắc nghiệm A, B, C, D kiểm tra chi tiết và suy luận',
    badge: 'Nghe: Bài Nói / Diễn Thuyết',
    defaultCount: 10,
    skillGroup: 'listening',
    supportedLevels: [4, 5, 6],
  },
  read_mixed_all_parts: {
    title: '📖 Đọc: Đề Đọc Tổng Hợp Đan Xen (Chuẩn theo cấp HSK)',
    subtitle: 'Tự động đan xen các phần Đọc hiểu đúng cấu trúc chuẩn của cấp HSK đang chọn',
    badge: 'Đề Đọc Chuẩn Cấp HSK',
    defaultCount: 20,
    skillGroup: 'reading',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  shared_word_bank_cloze: {
    title: '📖 Đọc Phần 1: Điền từ bảng từ chung (A–E)',
    subtitle: 'Các nhóm 5 câu điền khuyết dùng chung 1 ngân hàng từ vựng A–E kiểm tra ngữ pháp',
    badge: 'Đọc: Bảng Từ Vựng A–E',
    defaultCount: 10,
    skillGroup: 'reading',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  read_dialogue_matching_5opt: {
    title: '📖 Đọc Phần 2: Ghép nối cặp câu hội thoại (A–E)',
    subtitle: 'Ghép câu hỏi / lời nói ở vế trên với câu phản hồi tự nhiên tương ứng trong bảng A–E',
    badge: 'Đọc: Ghép Cặp Hội Thoại',
    defaultCount: 10,
    skillGroup: 'reading',
    supportedLevels: [1, 2, 3],
  },
  reading_passage_multi_qa: {
    title: '📖 Đọc Phần 3: Đoạn văn ngắn & Suy luận',
    subtitle: 'Đoạn văn kèm câu hỏi kiểm tra thông tin chi tiết, suy luận và ý chính đúng cấp độ HSK',
    badge: 'Đọc Hiểu Đoạn Văn',
    defaultCount: 10,
    skillGroup: 'reading',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
  read_paragraph_sentence_ordering: {
    title: '📖 Đọc Phần 4: Sắp xếp trật tự đoạn văn (HSK 4–5)',
    subtitle: 'Các câu văn A, B, C, D bị đảo lộn thứ tự, ghép nối thành đoạn văn hoàn chỉnh theo mạch logic',
    badge: 'Đọc: Sắp Xếp Đoạn Văn',
    defaultCount: 10,
    skillGroup: 'reading',
    supportedLevels: [4, 5],
  },
  read_find_faulty_sentence_4opt: {
    title: '📖 Đọc Phần 5: Tìm câu sai ngữ pháp 病句 (HSK 6)',
    subtitle: 'Mỗi câu gồm 4 câu độc lập A, B, C, D, tìm duy nhất 1 câu có lỗi ngữ pháp điển hình',
    badge: 'Đọc: Bắt Lỗi Câu (病句)',
    defaultCount: 10,
    skillGroup: 'reading',
    supportedLevels: [6],
  },
  write_mixed_all_parts: {
    title: '✍️ Viết: Đề Viết Tổng Hợp Đan Xen (Chuẩn theo cấp HSK)',
    subtitle: 'Đan xen các phần thi Viết trên máy đúng cấu trúc của cấp HSK đang chọn',
    badge: 'Đề Viết Chuẩn Cấp HSK',
    defaultCount: 10,
    skillGroup: 'writing',
    supportedLevels: [2, 3, 4, 5, 6],
  },
  write_tianzige_from_pinyin: {
    title: '✍️ Viết Phần 1: Nhìn Pinyin gõ chữ Hán chuẩn IME',
    subtitle: 'Câu ngữ cảnh có từ để trống kèm Pinyin trong ngoặc đơn, thí sinh gõ chữ Hán chuẩn qua IME',
    badge: 'Viết: Pinyin Sang Chữ Hán',
    defaultCount: 10,
    skillGroup: 'writing',
    supportedLevels: [2, 3],
  },
  write_sentence_reorder_4opt: {
    title: '✍️ Viết Phần 2: Sắp xếp từ thành câu 连词成句',
    subtitle: '4–5 cụm từ / ngữ khối bị xáo trộn, yêu cầu sắp xếp lại thành câu hoàn chỉnh đúng ngữ pháp',
    badge: 'Viết: Sắp Xếp Câu',
    defaultCount: 10,
    skillGroup: 'writing',
    supportedLevels: [2, 3, 4, 5],
  },
  write_short_essay_80chars: {
    title: '✍️ Viết Phần 3: Đoạn văn ngắn ~80 chữ từ từ khóa (HSK 4–5)',
    subtitle: 'Viết đoạn văn ngắn khoảng 80 chữ dựa trên 5 từ khóa gợi ý hoặc tình huống',
    badge: 'Viết: Đoạn Văn 80 Chữ',
    defaultCount: 10,
    skillGroup: 'writing',
    supportedLevels: [4, 5],
  },
  write_topic_essay_200chars: {
    title: '✍️ Viết Phần 4: Nghị luận chủ đề ~200 chữ (HSK 5–6)',
    subtitle: 'Viết bài văn nghị luận xã hội / quan điểm cá nhân khoảng 200 chữ theo chủ đề cho sẵn',
    badge: 'Viết: Nghị Luận 200 Chữ',
    defaultCount: 10,
    skillGroup: 'writing',
    supportedLevels: [5, 6],
  },
  write_summary_shortening_400chars: {
    title: '✍️ Viết Phần 5: Rút gọn văn bản ~400 chữ 缩写 (HSK 6)',
    subtitle: 'Đọc văn bản tự sự 1000 chữ trong 10 phút, tóm tắt thành bài văn ~400 chữ kèm tiêu đề tự đặt',
    badge: 'Viết: Rút Gọn 400 Chữ (HSK 6)',
    defaultCount: 10,
    skillGroup: 'writing',
    supportedLevels: [6],
  },
  json_strict: {
    title: '💻 Xuất Mã JSON Chuẩn QBank (Đan xen đa dạng)',
    subtitle: 'Xuất trực tiếp mảng JSON có đủ stem, options, answer_idx, pinyin, explanation_vi',
    badge: 'JSON Chuẩn Hệ Thống',
    defaultCount: 20,
    skillGroup: 'all',
    supportedLevels: [1, 2, 3, 4, 5, 6],
  },
};

export function getFormatsForLevelAndSkill(
  level: number,
  skillFilter: 'all' | 'listening' | 'reading' | 'writing'
): ExternalPromptFormatType[] {
  const safeLevel = Math.min(6, Math.max(1, Math.round(level || 1)));
  return (Object.keys(EXTERNAL_PROMPT_FORMAT_LABELS) as ExternalPromptFormatType[]).filter((fKey) => {
    const meta = EXTERNAL_PROMPT_FORMAT_LABELS[fKey];
    if (safeLevel === 1 && (meta.skillGroup === 'writing' || fKey.startsWith('write_'))) {
      return false;
    }
    const matchesSkill = skillFilter === 'all' || meta.skillGroup === skillFilter;
    const matchesLevel = meta.supportedLevels.includes(safeLevel);
    return matchesSkill && matchesLevel;
  });
}

export function getDynamicFormatDisplay(
  formatType: ExternalPromptFormatType,
  level: number
): { title: string; subtitle: string; badge: string } {
  const safeLevel = Math.min(6, Math.max(1, Math.round(level || 1)));
  const base = EXTERNAL_PROMPT_FORMAT_LABELS[formatType];
  if (!base) {
    return { title: String(formatType), subtitle: '', badge: '' };
  }

  if (formatType === 'listen_mixed_all_parts') {
    if (safeLevel === 1) {
      return {
        title: '🎧 Nghe HSK 1: Đề Nghe Đan Xen 4 Phần Chuẩn HSK 1',
        subtitle: 'Chuẩn Nghe HSK 1 (500 từ): Phần 1 Tranh Đúng/Sai [IMG: ...] (对/错) + Phần 2 Chọn 1 trong 4 tranh [IMG: ...] (A/B/C/D) + Phần 3 Hội thoại ghép tranh (A–F) + Phần 4 Hỏi đáp ngắn (A/B/C/D)',
        badge: 'Đề Nghe Chuẩn HSK 1',
      };
    }
    if (safeLevel === 2) {
      return {
        title: '🎧 Nghe HSK 2: Đề Nghe Đan Xen 4 Phần Chuẩn HSK 2',
        subtitle: 'Chuẩn Nghe HSK 2: Phần 1 Tranh Đúng/Sai [IMG: ...] (对/错) + Phần 2 Nghe chọn tranh [IMG: ...] + Phần 3 Hội thoại ngắn 2 lượt (A/B/C/D) + Phần 4 Hội thoại 3–4 lượt (A/B/C/D)',
        badge: 'Đề Nghe Chuẩn HSK 2',
      };
    }
    if (safeLevel === 3) {
      return {
        title: '🎧 Nghe HSK 3: Đề Nghe Đan Xen 4 Phần Chuẩn HSK 3',
        subtitle: 'Chuẩn Nghe HSK 3: Phần 1 & 2 Độc thoại ngắn Đúng/Sai (对/错) + Phần 3 Hội thoại ngắn 2 lượt bẫy suy luận (A/B/C/D) + Phần 4 Hội thoại dài 4 lượt (A/B/C/D)',
        badge: 'Đề Nghe Chuẩn HSK 3',
      };
    }
    if (safeLevel === 4) {
      return {
        title: '🎧 Nghe HSK 4: Đề Nghe Đan Xen 3 Phần Chuẩn HSK 4',
        subtitle: 'Chuẩn Nghe HSK 4: Phần 1 Độc thoại phán đoán Đúng/Sai (对/错) + Phần 2 Hội thoại ngắn 2 lượt (A/B/C/D) + Phần 3 Hội thoại dài & Đoạn văn ngắn (A/B/C/D)',
        badge: 'Đề Nghe Chuẩn HSK 4',
      };
    }
    if (safeLevel === 5) {
      return {
        title: '🎧 Nghe HSK 5: Đề Nghe Đan Xen Chuẩn HSK 5',
        subtitle: 'Chuẩn Nghe HSK 5 (4 đáp án A/B/C/D): Phần 1 Hội thoại ngắn suy luận hàm ý + Phần 2A Hội thoại dài 5–6 lượt + Phần 2B Đoạn văn / Tin tức dài',
        badge: 'Đề Nghe Chuẩn HSK 5',
      };
    }
    return {
      title: '🎧 Nghe HSK 6: Đề Nghe Đan Xen 3 Phần Chuẩn HSK 6',
      subtitle: 'Chuẩn Nghe HSK 6 (4 đáp án A/B/C/D): Phần 1 Độc thoại văn hóa/khoa học + Phần 2 Phỏng vấn chuyên sâu Nam–Nữ + Phần 3 Bài diễn thuyết học thuật',
      badge: 'Đề Nghe Chuẩn HSK 6',
    };
  }

  if (formatType === 'ielts_listening_traps') {
    return {
      title:
        safeLevel === 1
          ? '🎧 Nghe HSK 1 - Phần 2 & 3: Hội thoại ngắn 2 câu cơ bản (4 đáp án A/B/C/D)'
          : `🎧 Nghe HSK ${safeLevel} - Phần 2: Hội thoại ngắn 2 lượt Nam – Nữ (4 đáp án A/B/C/D)`,
      subtitle:
        safeLevel === 1
          ? 'Hội thoại giao tiếp cơ bản 2 câu ngắn gọn (chào hỏi, thời gian, mua sắm, gia đình) với 4 phương án A, B, C, D'
          : `Hội thoại 2 lượt Nam – Nữ tích hợp bẫy tự sửa lời, paraphrase và suy luận phù hợp trình độ HSK ${safeLevel} (4 phương án A, B, C, D)`,
      badge: `Nghe Hội Thoại Ngắn HSK ${safeLevel}`,
    };
  }

  if (formatType === 'listen_long_dialogue_4turns') {
    return {
      title:
        safeLevel === 2
          ? '🎧 Nghe HSK 2 - Phần 4: Hội thoại 3–4 lượt tình huống (4 đáp án A/B/C/D)'
          : safeLevel === 6
          ? '🎧 Nghe HSK 6 - Phần 2: Phỏng vấn chuyên sâu nhiều lượt (4 đáp án A/B/C/D)'
          : `🎧 Nghe HSK ${safeLevel} - Phần 3: Hội thoại dài 4–5 lượt (4 đáp án A/B/C/D)`,
      subtitle: `Hội thoại nhiều lượt qua lại giữa Nam và Nữ chuẩn độ khó HSK ${safeLevel} (4 phương án A, B, C, D)`,
      badge: `Nghe Hội Thoại Dài HSK ${safeLevel}`,
    };
  }

  if (formatType === 'listen_true_false_statement') {
    return {
      title: `🎧 Nghe HSK ${safeLevel} - Phần 1: Phán đoán Đúng / Sai (对 / 错)`,
      subtitle:
        safeLevel === 1
          ? 'Nghe 1 câu đơn ngắn gọn trong phạm vi 500 từ HSK 1 và phán đoán nhận định Đúng (A. 对) hay Sai (B. 错)'
          : `Nghe câu nói / đoạn độc thoại ngắn HSK ${safeLevel} và phán đoán nhận định kết luận là Đúng (A. 对) hay Sai (B. 错)`,
      badge: `Nghe Đúng/Sai HSK ${safeLevel}`,
    };
  }

  if (formatType === 'read_mixed_all_parts') {
    return {
      title: `📖 Đọc HSK ${safeLevel}: Đề Đọc Tổng Hợp Đan Xen Chuẩn HSK ${safeLevel}`,
      subtitle:
        safeLevel <= 2
          ? `Đan xen chuẩn Đọc HSK ${safeLevel}: Phán đoán Đúng/Sai từ-câu + Ghép cặp câu hội thoại A–E + Điền từ vào chỗ trống (A/B/C/D)`
          : safeLevel === 3
          ? 'Đan xen chuẩn Đọc HSK 3: Ghép cặp câu hội thoại A–E + Điền từ vào chỗ trống + Đọc đoạn văn ngắn trả lời câu hỏi (A/B/C/D)'
          : safeLevel <= 5
          ? `Đan xen chuẩn Đọc HSK ${safeLevel}: Điền từ vào chỗ trống + Sắp xếp trật tự đoạn văn (段落排序) + Đọc đoạn văn suy luận (A/B/C/D)`
          : 'Đan xen chuẩn Đọc HSK 6: Tìm câu sai ngữ pháp (病句) + Điền cụm từ liên kết vào đoạn văn + Đọc hiểu bài văn dài (A/B/C/D)',
      badge: `Đề Đọc Chuẩn HSK ${safeLevel}`,
    };
  }

  if (formatType === 'write_mixed_all_parts') {
    return {
      title: `✍️ Viết HSK ${safeLevel}: Đề Viết Tổng Hợp Chuẩn HSK ${safeLevel}`,
      subtitle:
        safeLevel <= 2
          ? 'Chuẩn Viết HSK 2: Nhìn Pinyin gõ chữ Hán chuẩn IME + Sắp xếp từ thành câu đơn cơ bản'
          : safeLevel === 3
          ? 'Chuẩn Viết HSK 3 (10 câu): Phần 1 Sắp xếp các cụm từ thành câu hoàn chỉnh (连词成句) + Phần 2 Nhìn Pinyin gõ chữ Hán trong câu ngữ cảnh'
          : safeLevel <= 5
          ? `Chuẩn Viết HSK ${safeLevel}: Phần 1 Sắp xếp từ thành câu phức (连词成句) + Phần 2 Viết đoạn văn ngắn ~80 chữ từ từ khóa`
          : 'Chuẩn Viết HSK 6: Rút gọn tóm tắt văn bản tự sự 1000 chữ thành bài văn ~400 chữ (缩写)',
      badge: `Đề Viết Chuẩn HSK ${safeLevel}`,
    };
  }

  return base;
}

export interface LevelQuestionCountOption {
  value: number;
  label: string;
}

export function getQuestionCountOptionsForLevel(level: number): LevelQuestionCountOption[] {
  const safeLevel = Math.min(6, Math.max(1, Math.round(level || 1)));
  switch (safeLevel) {
    case 1:
      return [
        { value: 10, label: '10 câu (Luyện nhanh)' },
        { value: 20, label: '20 câu (Chuẩn 1 kỹ năng Nghe / Đọc HSK 1)' },
        { value: 30, label: '30 câu' },
        { value: 40, label: '40 câu (Tiêu chuẩn đề HSK 1)' },
      ];
    case 2:
      return [
        { value: 10, label: '10 câu (Luyện nhanh)' },
        { value: 20, label: '20 câu' },
        { value: 30, label: '30 câu (Chuẩn 1 kỹ năng Nghe / Đọc HSK 2)' },
        { value: 40, label: '40 câu' },
        { value: 60, label: '60 câu (Tiêu chuẩn đề HSK 2)' },
      ];
    case 3:
      return [
        { value: 10, label: '10 câu (Chuẩn phần Viết HSK 3)' },
        { value: 20, label: '20 câu' },
        { value: 30, label: '30 câu (Chuẩn phần Đọc HSK 3)' },
        { value: 40, label: '40 câu (Chuẩn phần Nghe HSK 3)' },
        { value: 60, label: '60 câu' },
        { value: 80, label: '80 câu (Tiêu chuẩn đề HSK 3)' },
      ];
    case 4:
      return [
        { value: 10, label: '10 câu (Luyện nhanh / Viết)' },
        { value: 20, label: '20 câu' },
        { value: 30, label: '30 câu' },
        { value: 40, label: '40 câu (Chuẩn phần Đọc HSK 4)' },
        { value: 50, label: '50 câu (Chuẩn phần Nghe HSK 4)' },
        { value: 80, label: '80 câu' },
        { value: 100, label: '100 câu (Tiêu chuẩn đề HSK 4)' },
      ];
    case 5:
      return [
        { value: 10, label: '10 câu (Chuẩn phần Viết HSK 5)' },
        { value: 20, label: '20 câu' },
        { value: 30, label: '30 câu' },
        { value: 40, label: '40 câu' },
        { value: 50, label: '50 câu (Chuẩn phần Nghe / Đọc HSK 5)' },
        { value: 80, label: '80 câu' },
        { value: 100, label: '100 câu (Tiêu chuẩn đề HSK 5)' },
      ];
    case 6:
    default:
      return [
        { value: 10, label: '10 câu (Luyện nhanh / Viết)' },
        { value: 20, label: '20 câu' },
        { value: 30, label: '30 câu' },
        { value: 40, label: '40 câu' },
        { value: 50, label: '50 câu (Chuẩn phần Nghe / Đọc HSK 6)' },
        { value: 80, label: '80 câu' },
        { value: 100, label: '100 câu (Tiêu chuẩn đề HSK 6)' },
      ];
  }
}

export function getRecommendedQuestionCount(
  level: number,
  formatType: ExternalPromptFormatType,
  skillFilter?: 'all' | 'listening' | 'reading' | 'writing'
): number {
  const safeLevel = Math.min(6, Math.max(1, Math.round(level || 1)));
  if (formatType === 'full_cbt_mock_exam') {
    if (safeLevel === 1) return 40;
    if (safeLevel === 2) return 60;
    if (safeLevel === 3) return 80;
    return 100;
  }
  if (formatType === 'multi_part_20q' || formatType === 'json_strict') {
    return 20;
  }
  const effectiveSkill = skillFilter && skillFilter !== 'all'
    ? skillFilter
    : EXTERNAL_PROMPT_FORMAT_LABELS[formatType]?.skillGroup || 'all';
  if (effectiveSkill === 'writing') {
    return 10;
  }
  if (effectiveSkill === 'listening') {
    if (safeLevel === 1) return 20;
    if (safeLevel === 2) return 30;
    if (safeLevel === 3) return 40;
    return 50;
  }
  if (effectiveSkill === 'reading') {
    if (safeLevel === 1) return 20;
    if (safeLevel <= 3) return 30;
    if (safeLevel === 4) return 40;
    return 50;
  }
  return 20;
}

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

  const modelDirectiveLine = EXTERNAL_MODEL_DIRECTIVES[targetModel]
    ? `\n- Hướng dẫn riêng cho mô hình ${modelMeta.name}: ${EXTERNAL_MODEL_DIRECTIVES[targetModel]}`
    : '';

  const cleanVisualImgRule =
    'Mỗi mục có hình ảnh bắt buộc dùng thẻ `[IMG: <english scene description without Chinese characters or answer words>]` viết hoàn toàn bằng tiếng Anh tự nhiên mô tả bối cảnh/sự vật, TUYỆT ĐỐI KHÔNG chứa chữ Hán, Pinyin hay từ khóa đáp án.';

  const copySafeDirective =
    formatType === 'json_strict'
      ? `\n\n### QUY TẮC XUẤT KHỐI MÃ CHỐNG LỖI SAO CHÉP (BẮT BUỘC):\n- ĐẶT TOÀN BỘ MẢNG JSON VÀO ĐÚNG 1 KHỐI MÃ \`\`\`json ... \`\`\` DUY NHẤT, không viết lời dẫn mở đầu hay kết thúc ngoài khối mã.`
      : `\n\n### QUY TẮC CHỐNG DÍNH DÒNG KHI SAO CHÉP TỪ GEMINI / CHATGPT / DEEPSEEK (BẮT BUỘC):\n- ĐẶT TOÀN BỘ NỘI DUNG ĐỀ THI VÀ PHẦN ĐÁP ÁN VÀO **ĐÚNG 1 KHỐI MÃ MARKDOWN DUY NHẤT** (mở đầu bằng \`\`\`text và kết thúc bằng \`\`\`) để người dùng bấm nút Sao chép (Copy) giữ nguyên 100% xuống dòng, TUYỆT ĐỐI không bị dính hàng.\n- Mỗi tiêu đề phần, mỗi \`Câu 1:\`, \`Câu 2:\`, từng thẻ \`[IMG: ...]\`, từng đáp án \`A.\`, \`B.\`, \`C.\`, \`D.\`, và từng dòng trong phần đáp án (\`Câu 1: A. Giải thích: ...\`) BẮT BUỘC xuống dòng riêng biệt; để 1 dòng trống giữa các câu.\n- KHÔNG dùng bảng Markdown (|---|) và không viết lời chào mở đầu/kết thúc bên ngoài khối \`\`\`text.`;

  const headerBlock = `[Hệ thống Khảo thí HSK 3.0 Minnese — Prompt tối ưu cho ${modelMeta.name}]
Bạn là Chuyên gia Ra đề Khảo thí Tiếng Trung Quốc tế chuẩn HSK 3.0 (CLEC / CTI).
Hãy biên soạn bộ đề thi **HSK ${level}** (${spec.cefr} — phạm vi ${spec.vocabCount} từ vựng chuẩn).
${topicText}

### GIỚI HẠN TỪ VỰNG BẮT BUỘC & CHẤT LƯỢNG SƯ PHẠM:
- Phạm vi từ vựng & ngữ pháp: Bám sát khung HSK ${level} (${spec.grammarSummary}).${forbiddenLine}
${pinyinInstruction}
- Tính đơn nhất đáp án: Mỗi câu hỏi chỉ có DUY NHẤT 1 đáp án đúng hoàn toàn về cả ngữ pháp lẫn ngữ nghĩa; các phương án nhiễu phải cùng từ loại (POS) nhưng sai rõ ràng về ngữ cảnh hoặc logic.
- Mọi lời giải thích đều phải viết bằng **tiếng Việt** chi tiết, dịch nghĩa câu và giải thích vì sao đáp án đó đúng.${modelDirectiveLine}${copySafeDirective}`;

  if (formatType === 'full_cbt_mock_exam') {
    const total = Math.max(4, count);
    const hasWriting = level >= 2;
    const listenCount = hasWriting ? Math.max(2, Math.round(total * 0.45)) : Math.max(2, Math.floor(total / 2));
    const writeCount = hasWriting ? Math.max(1, Math.round(total * 0.15)) : 0;
    const readCount = Math.max(2, total - listenCount - writeCount);

    const listenEnd = listenCount;
    const listenPart4Start = Math.min(listenEnd, Math.round(listenCount * 0.75) + 1);
    const listenPart1End = level === 1 ? Math.max(1, Math.round(listenCount * 0.25)) : Math.max(1, Math.round(listenCount * 0.35));
    const listenPart2Start = listenPart1End + 1;
    const listenPart2End = level === 1 ? Math.max(listenPart2Start, Math.round(listenCount * 0.5)) : Math.max(listenPart2Start, Math.round(listenCount * 0.75));
    const listenPart3Start = listenPart2End + 1;
    const listenPart3End = level === 1 ? Math.max(listenPart3Start, Math.round(listenCount * 0.75)) : listenEnd;

    const readStart = listenEnd + 1;
    const readPart1End = readStart + (level === 1 ? Math.max(1, Math.round(readCount * 0.25)) : Math.max(1, Math.round(readCount * 0.4))) - 1;
    const readPart2Start = readPart1End + 1;
    const readPart2End = readStart + (level === 1 ? Math.max(2, Math.round(readCount * 0.5)) : Math.max(2, Math.round(readCount * 0.7))) - 1;
    const readPart3Start = readPart2End + 1;
    const readPart3End = level === 1 ? readStart + Math.max(3, Math.round(readCount * 0.75)) - 1 : listenEnd + readCount;
    const readPart4Start = readPart3End + 1;
    const readEnd = listenEnd + readCount;

    const writeStart = readEnd + 1;
    const writeEnd = total;
    const listenOptRule = '4 phương án lựa chọn A, B, C, D';

    const writingSectionBlock = hasWriting
      ? `\n### III. 书写 / PHẦN 3: THI VIẾT TRÊN MÁY (Câu ${writeStart} – Câu ${writeEnd}, tổng ${writeCount} câu)
- Cấp độ HSK ${level}: ${
          level === 2
            ? 'Nhìn Pinyin gõ chữ Hán chuẩn (看拼音写字/词) hoặc Sắp xếp từ thành câu (连词成句).'
            : level <= 5
            ? 'Sắp xếp các cụm từ xáo trộn thành câu hoàn chỉnh (连词成句, 4 lựa chọn thứ tự A, B, C, D). TUYỆT ĐỐI KHÔNG viết lời dẫn tiếng Việt ở dòng đề bài — chỉ dùng các cụm chữ Hán cách nhau bằng dấu `/` (hoặc nếu đặt câu theo từ khóa thì viết lời dẫn 100% tiếng Trung: `请用“【Từ khóa】”选择正确的句子：`).'
            : 'Tóm tắt rút gọn văn bản (缩写 ~400 chữ) hoặc Sắp xếp câu phức học thuật.'
        }
- Định dạng mỗi câu (HSK ${level}):
Câu ${writeStart}: [Cụm A] / [Cụm B] / [Cụm C] / [Cụm D]
A. [Thứ tự ghép 1]
B. [Thứ tự ghép 2]
C. [Thứ tự ghép 3]
D. [Thứ tự ghép 4]
(Tạo đủ từ Câu ${writeStart} đến Câu ${writeEnd})`
      : '';

    const listenPart1Block =
      level <= 3
        ? `- **Nghe 1A (Câu 1 – Câu ${listenPart1End}): Nghe câu nói/hội thoại kết hợp tranh \`[IMG: ...]\` & Phán đoán Đúng / Sai (对 / 错)**
*Quy tắc hình ảnh:* ${cleanVisualImgRule}
Câu 1:
[IMG: <english scene description without Chinese characters or answer words>]
男：[1–2 câu nói tình huống chuẩn HSK ${level}]
★ [Nhận định tóm tắt ý để đối chiếu Đúng hay Sai]
A. 对
B. 错`
        : level === 4
        ? `- **Nghe 1A (Câu 1 – Câu ${listenPart1End}): Nghe câu nói & Phán đoán Đúng / Sai (对 / 错)**
Câu 1:
男：[1–2 câu nói tình huống chuẩn HSK ${level}]
★ [Nhận định tóm tắt ý để đối chiếu Đúng hay Sai]
A. 对
B. 错`
        : `- **Nghe 1A (Câu 1 – Câu ${listenPart1End}): Nghe hội thoại ngắn 2 lượt suy luận hàm ý (${listenOptRule})**
Câu 1:
男：[Lời thoại Nam]
女：[Lời thoại Nữ]
问：[Câu hỏi suy luận hàm ý/thái độ]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]`;

    const listenPart3Block =
      listenPart3Start <= listenEnd
        ? `\n- **Nghe 1C (Câu ${listenPart3Start} – Câu ${Math.min(listenPart3End, listenEnd)}): ${
            level <= 2
              ? 'Nghe hội thoại chọn tranh [IMG: ...] phù hợp (4 tranh A, B, C, D)'
              : 'Nghe hội thoại dài 4 lượt hoặc đoạn độc thoại ngắn'
          } (${listenOptRule})**
Câu ${listenPart3Start}:
${
  level <= 2
    ? `男：[Lời thoại Nam chuẩn HSK ${level}]
女：[Lời thoại Nữ chuẩn HSK ${level}]
问：[Câu hỏi về nội dung vừa nghe]
A. [IMG: <english scene description without Chinese characters or answer words>]
B. [IMG: <english scene description without Chinese characters or answer words>]
C. [IMG: <english scene description without Chinese characters or answer words>]
D. [IMG: <english scene description without Chinese characters or answer words>]`
    : `男：[Lượt 1 Nam]
女：[Lượt 1 Nữ]
男：[Lượt 2 Nam]
女：[Lượt 2 Nữ]
问：[Câu hỏi về nội dung vừa nghe]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]`
}${
            level === 1 && listenPart4Start <= listenEnd && listenPart4Start > listenPart3End
              ? `\n\n- **Nghe 1D (Câu ${listenPart4Start} – Câu ${listenEnd}): Nghe đoạn tình huống / câu chuyện ngắn & Trả lời câu hỏi \`问：\` (${listenOptRule})**
Câu ${listenPart4Start}:
男：[Đoạn nói 2–3 câu tình huống chuẩn HSK 1]
问：[Câu hỏi ngắn về nội dung vừa nghe]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]`
              : ''
          }`
        : '';

    return `${headerBlock}

### CẤU TRÚC ĐỀ THI THỬ HSK ${level} TOÀN DIỆN CHUẨN THI MÁY (${total} CÂU — ĐAN XEN ĐỦ DẠNG BÀI):
Hãy biên soạn trọn vẹn **${total} câu hỏi** chia làm ${hasWriting ? '3 kỹ năng (Nghe – Đọc – Viết)' : '2 kỹ năng (Nghe – Đọc)'} theo đúng thứ tự đánh số liên tục từ Câu 1 đến Câu ${total} (TUYỆT ĐỐI KHÔNG viết dấu "..." hay lược bỏ câu giữa chừng):

### I. 听力 / PHẦN 1: NGHE HIỂU (Câu 1 – Câu ${listenEnd}, tổng ${listenCount} câu)
*Lưu ý bắt buộc: Không ghi dòng giới thiệu nhân vật/bối cảnh. Mỗi câu bắt đầu trực tiếp bằng lời thoại \`男：\` / \`女：\` kèm \`问：\` để hệ thống tự động tạo giọng đọc Neural TTS:*
${listenPart1Block}

- **Nghe 1B (Câu ${listenPart2Start} – Câu ${Math.min(listenPart2End, listenEnd)}): Nghe hội thoại ngắn 2 lượt Nam – Nữ (${listenOptRule})**
Câu ${listenPart2Start}:
男：[Lời thoại nhân vật Nam]
女：[Lời thoại nhân vật Nữ]
问：[Câu hỏi về hội thoại]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]${listenPart3Block}

### II. 阅读 / PHẦN 2: ĐỌC HIỂU (Câu ${readStart} – Câu ${readEnd}, tổng ${readCount} câu)
- **Đọc 2A (Câu ${readStart} – Câu ${Math.min(readPart1End, readEnd)}): Điền từ vào chỗ trống \`____\` (4 phương án A, B, C, D)**
Câu ${readStart}: [Câu tiếng Trung chuẩn HSK ${level} có 1 chỗ trống ____]
A. [Từ A]
B. [Từ B]
C. [Từ C]
D. [Từ D]
${
  readPart2Start <= readEnd
    ? `\n- **Đọc 2B (Câu ${readPart2Start} – Câu ${Math.min(readPart2End, readEnd)}): ${
        level <= 2
          ? 'Đọc câu đối chiếu với tranh `[IMG: ...]` & Phán đoán Đúng / Sai (对 / 错)'
          : level === 6
          ? 'Tìm câu sai ngữ pháp 病句 (A, B, C, D)'
          : 'Chọn câu phản hồi / Sắp xếp logic câu (A, B, C, D)'
      }**
Câu ${readPart2Start}: ${
        level <= 2
          ? '\n[IMG: <english scene description without Chinese characters or answer words>]\n[1–2 câu chữ Hán mô tả hành động/sự vật để đối chiếu Đúng hay Sai với bức tranh]\nA. 对\nB. 错'
          : '[Nội dung câu hỏi Đọc 2B chuẩn HSK ' + level + ']\nA. [Phương án A]\nB. [Phương án B]\nC. [Phương án C]\nD. [Phương án D]'
      }`
    : ''
}${
      readPart3Start <= readEnd
        ? `\n\n- **Đọc 2C (Câu ${readPart3Start} – Câu ${Math.min(readPart3End, readEnd)}): ${
            level === 1
              ? 'Đọc câu chọn tranh `[IMG: ...]` phù hợp (4 tranh A, B, C, D)'
              : 'Đọc hiểu đoạn văn ngắn & Trả lời câu hỏi `★` (4 phương án A, B, C, D)'
          }**
Câu ${readPart3Start}: ${
            level === 1
              ? '[Câu chữ Hán chuẩn HSK 1 mô tả hành động/tình huống]\nA. [IMG: <english scene description without Chinese characters or answer words>]\nB. [IMG: <english scene description without Chinese characters or answer words>]\nC. [IMG: <english scene description without Chinese characters or answer words>]\nD. [IMG: <english scene description without Chinese characters or answer words>]'
              : '[Đoạn văn ngắn 2–4 câu tiếng Trung chuẩn HSK ' + level + ']\n★ [Câu hỏi suy luận / tìm thông tin trong đoạn văn]\nA. [Phương án A]\nB. [Phương án B]\nC. [Phương án C]\nD. [Phương án D]'
          }`
        : ''
    }${
      level === 1 && readPart4Start <= readEnd && readPart4Start > readPart3End
        ? `\n\n- **Đọc 2D (Câu ${readPart4Start} – Câu ${readEnd}): Đọc hiểu đoạn văn ngắn & Trả lời câu hỏi \`★\` (4 phương án A, B, C, D)**
Câu ${readPart4Start}: [Đoạn văn ngắn 2–3 câu tiếng Trung chuẩn HSK 1]
★ [Câu hỏi tìm thông tin trong đoạn văn]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]`
        : ''
    }${writingSectionBlock}

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa và giải thích chi tiết bằng tiếng Việt]
... (Ghi đầy đủ từ Câu 1 đến Câu ${total}, mỗi câu gồm Đáp án + Giải thích tiếng Việt rõ ràng)`;
  }

  if (formatType === 'random_mixed_variety') {
    const total = Math.max(5, count);
    const p1End = Math.max(1, Math.round(total * 0.25));
    const p2Start = p1End + 1;
    const p2End = Math.max(p2Start, Math.round(total * 0.5));
    const p3Start = p2End + 1;
    const p3End = Math.max(p3Start, Math.round(total * 0.75));
    const p4Start = p3End + 1;

    return `${headerBlock}

### ĐỀ TRỘN ĐA DẠNG TÙY HỨNG — XOAY VÒNG 4 DẠNG BÀI KHÁC NHAU (${total} CÂU):
Để đề luyện tập sinh động và không bị lặp lại 1 kiểu nhàm chán, hãy biên soạn đầy đủ **${total} câu hỏi** chia làm 4 dạng bài đan xen liên tiếp từ Câu 1 đến Câu ${total}:

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${p1End}): Nghe hội thoại ngắn & suy luận tình huống
Câu 1:
男：[Lời thoại nhân vật Nam]
女：[Lời thoại nhân vật Nữ]
问：[Câu hỏi về hội thoại]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]

#### 第二部分 / PHẦN 2 (Câu ${p2Start} – Câu ${p2End}): Điền từ vựng / ngữ pháp trọng điểm vào chỗ trống \`____\`
Câu ${p2Start}: [Câu tiếng Trung chuẩn HSK ${level} có chỗ trống ____]
A. [Từ vựng A]
B. [Từ vựng B]
C. [Từ vựng C]
D. [Từ vựng D]

#### 第三部分 / PHẦN 3 (Câu ${p3Start} – Câu ${p3End}): Phán đoán Đúng / Sai logic ngữ nghĩa (对 / 错)
Câu ${p3Start}: [Đoạn thông tin ngắn 1–2 câu kèm kết luận kiểm tra logic]
A. 对
B. 错

#### 第四部分 / PHẦN 4 (Câu ${p4Start} – Câu ${total}): Đọc hiểu đoạn văn ngắn & Sắp xếp câu hoàn chỉnh
Câu ${p4Start}: [Đoạn văn ngắn hoặc câu xáo trộn các cụm từ kèm câu hỏi]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa và giải thích chi tiết bằng tiếng Việt]
... (Ghi đầy đủ đáp án và giải thích từ Câu 1 đến Câu ${total})`;
  }

  if (formatType === 'listen_mixed_all_parts') {
    const total = Math.max(4, count);
    const quarter = Math.max(1, Math.floor(total / 4));
    const p1End = quarter;
    const p2Start = p1End + 1;
    const p2End = p1End + quarter;
    const p3Start = p2End + 1;
    const p3End = p2End + quarter;
    const p4Start = p3End + 1;

    if (level === 1) {
      return `${headerBlock}

### ĐỀ NGHE HIỂU TỔNG HỢP ĐAN XEN 4 PHẦN CHUẨN HSK 1 (${total} CÂU — ĐỒNG BỘ 4 PHƯƠNG ÁN A, B, C, D & HÌNH ẢNH [IMG: ...]):
Hãy biên soạn đầy đủ **${total} câu hỏi Nghe hiểu HSK 1** chia đúng 4 phần chuẩn đề thi HSK 1 (chỉ dùng câu đơn ngắn gọn trong khung 500 từ, đồng bộ 4 phương án A, B, C, D cho các phần trắc nghiệm).
*Quy tắc hình ảnh bắt buộc:* ${cleanVisualImgRule}

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${p1End}): Nghe câu đơn ngắn kết hợp tranh \`[IMG: ...]\` & Phán đoán Đúng / Sai (对 / 错)
Câu 1:
[IMG: <english scene description without Chinese characters or answer words>]
男：[1 câu đơn ngắn gọn chuẩn HSK 1, ví dụ về đồ vật, hành động, thời gian]
问：[Câu nhận định ngắn gọn bằng chữ Hán để phán đoán Đúng hay Sai]
A. 对
B. 错
(Tạo đầy đủ từ Câu 1 đến Câu ${p1End})

#### 第二部分 / PHẦN 2 (Câu ${p2Start} – Câu ${p2End}): Nghe câu đơn chọn 1 trong 4 tranh \`[IMG: ...]\` phù hợp (4 phương án A, B, C, D)
Câu ${p2Start}:
女：[1 câu nói đơn giản trong đời sống hàng ngày]
问：[Câu hỏi ngắn về nội dung câu vừa nghe]
A. [IMG: <english scene description without Chinese characters or answer words>]
B. [IMG: <english scene description without Chinese characters or answer words>]
C. [IMG: <english scene description without Chinese characters or answer words>]
D. [IMG: <english scene description without Chinese characters or answer words>]
(Tạo đầy đủ từ Câu ${p2Start} đến Câu ${p2End})

#### 第三部分 / PHẦN 3 (Câu ${p3Start} – Câu ${p3End}): Nghe hội thoại ngắn 2 câu ghép bảng 6 tranh \`[IMG: ...]\` (A–F) hoặc 4 đáp án A, B, C, D
Câu ${p3Start}:
男：[1 câu hỏi hoặc lời nói ngắn của Nam]
女：[1 câu trả lời ngắn của Nữ]
问：[Câu hỏi về thông tin trong hội thoại]
A. [IMG: <english scene description without Chinese characters or answer words>]
B. [IMG: <english scene description without Chinese characters or answer words>]
C. [IMG: <english scene description without Chinese characters or answer words>]
D. [IMG: <english scene description without Chinese characters or answer words>]
E. [IMG: <english scene description without Chinese characters or answer words>]
F. [IMG: <english scene description without Chinese characters or answer words>]
(Tạo đầy đủ từ Câu ${p3Start} đến Câu ${p3End})

#### 第四部分 / PHẦN 4 (Câu ${p4Start} – Câu ${total}): Nghe câu giới thiệu / hội thoại ngắn & Trả lời câu hỏi 问 (4 phương án chữ Hán A, B, C, D)
Câu ${p4Start}:
男：[1–2 câu giới thiệu ngắn về bản thân, gia đình, thời gian, sở thích]
问：[Câu hỏi kiểm tra thông tin vừa nghe]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p4Start} đến Câu ${total})

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa câu nghe và giải thích chi tiết bằng tiếng Việt]`;
    }

    if (level === 2) {
      return `${headerBlock}

### ĐỀ NGHE HIỂU TỔNG HỢP ĐAN XEN 4 PHẦN CHUẨN HSK 2 (${total} CÂU — ĐỒNG BỘ 4 PHƯƠNG ÁN A, B, C, D & HÌNH ẢNH [IMG: ...]):
Hãy biên soạn đầy đủ **${total} câu hỏi Nghe hiểu HSK 2** chia đúng 4 phần chuẩn đề thi HSK 2 (đồng bộ 4 phương án A, B, C, D cho trắc nghiệm).
*Quy tắc hình ảnh bắt buộc:* ${cleanVisualImgRule}

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${p1End}): Nghe câu nói tình huống kết hợp tranh \`[IMG: ...]\` & Phán đoán Đúng / Sai (对 / 错)
Câu 1:
[IMG: <english scene description without Chinese characters or answer words>]
男：[1–2 câu mô tả tình huống đời sống chuẩn HSK 2]
问：[Câu nhận định tóm tắt bằng chữ Hán để phán đoán Đúng hay Sai]
A. 对
B. 错
(Tạo đầy đủ từ Câu 1 đến Câu ${p1End})

#### 第二部分 / PHẦN 2 (Câu ${p2Start} – Câu ${p2End}): Nghe hội thoại ngắn 2 lượt chọn 1 trong 4 tranh \`[IMG: ...]\` hoặc ghép bảng tranh (A–F)
Câu ${p2Start}:
男：[Lời thoại Nam]
女：[Lời thoại Nữ]
问：[Câu hỏi về hội thoại]
A. [IMG: <english scene description without Chinese characters or answer words>]
B. [IMG: <english scene description without Chinese characters or answer words>]
C. [IMG: <english scene description without Chinese characters or answer words>]
D. [IMG: <english scene description without Chinese characters or answer words>]
(Tạo đầy đủ từ Câu ${p2Start} đến Câu ${p2End})

#### 第三部分 / PHẦN 3 (Câu ${p3Start} – Câu ${p3End}): Nghe hội thoại ngắn 2 lượt có so sánh / thời gian / nguyên nhân (4 phương án chữ Hán A, B, C, D)
Câu ${p3Start}:
女：[Lời thoại Nữ]
男：[Lời thoại Nam]
问：[Câu hỏi về thời gian, địa điểm, nguyên nhân]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p3Start} đến Câu ${p3End})

#### 第四部分 / PHẦN 4 (Câu ${p4Start} – Câu ${total}): Nghe hội thoại 3–4 lượt ngắn gọn giữa Nam và Nữ (4 phương án chữ Hán A, B, C, D)
Câu ${p4Start}:
男：[Lượt 1 của Nam]
女：[Lượt 1 của Nữ]
男：[Lượt 2 của Nam]
女：[Lượt 2 của Nữ]
问：[Câu hỏi về quyết định hoặc thông tin cuối cùng]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p4Start} đến Câu ${total})

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa hội thoại và giải thích chi tiết bằng tiếng Việt]`;
    }

    if (level === 3) {
      return `${headerBlock}

### ĐỀ NGHE HIỂU TỔNG HỢP ĐAN XEN 4 PHẦN CHUẨN HSK 3 (${total} CÂU — ĐỒNG BỘ 4 PHƯƠNG ÁN A, B, C, D):
Hãy biên soạn đầy đủ **${total} câu hỏi Nghe hiểu HSK 3** chia đúng 4 phần chuẩn đề thi HSK 3 (đồng bộ 4 phương án A, B, C, D).
*Quy tắc hình ảnh cho phần chọn/ghép tranh:* ${cleanVisualImgRule}

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${p1End}): Nghe hội thoại ngắn 2 lượt ghép bảng tranh \`[IMG: ...]\` (A–F) hoặc 4 phương án A, B, C, D
Câu 1:
男：[Lời thoại Nam]
女：[Lời thoại Nữ]
问：[Câu hỏi xác định đồ vật / hành động / địa điểm đang nhắc tới]
A. [IMG: <english scene description without Chinese characters or answer words>] (hoặc [Phương án A])
B. [IMG: <english scene description without Chinese characters or answer words>] (hoặc [Phương án B])
C. [IMG: <english scene description without Chinese characters or answer words>] (hoặc [Phương án C])
D. [IMG: <english scene description without Chinese characters or answer words>] (hoặc [Phương án D])
(Tạo đầy đủ từ Câu 1 đến Câu ${p1End})

#### 第二部分 / PHẦN 2 (Câu ${p2Start} – Câu ${p2End}): Nghe đoạn độc thoại 2–3 câu & Phán đoán Đúng / Sai (对 / 错)
Câu ${p2Start}:
女：[Đoạn độc thoại ngắn 2–3 câu chuẩn ngữ pháp HSK 3]
问：[Nhận định kết luận để thí sinh phán đoán Đúng hay Sai]
A. 对
B. 错
(Tạo đầy đủ từ Câu ${p2Start} đến Câu ${p2End})

#### 第三部分 / PHẦN 3 (Câu ${p3Start} – Câu ${p3End}): Nghe hội thoại ngắn 2 lượt bẫy suy luận (4 phương án A, B, C, D)
Câu ${p3Start}:
男：[Lời thoại Nam]
女：[Lời thoại Nữ]
问：[Câu hỏi suy luận về hội thoại]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p3Start} đến Câu ${p3End})

#### 第四部分 / PHẦN 4 (Câu ${p4Start} – Câu ${total}): Nghe hội thoại dài 4 lượt qua lại & Bẫy đổi ý (4 phương án A, B, C, D)
Câu ${p4Start}:
男：[Lượt 1 của Nam]
女：[Lượt 1 của Nữ]
男：[Lượt 2 của Nam]
女：[Lượt 2 của Nữ]
问：[Câu hỏi về hội thoại]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p4Start} đến Câu ${total})

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa hội thoại và giải thích chi tiết bằng tiếng Việt]`;
    }

    if (level >= 5) {
      const third = Math.max(1, Math.floor(total / 3));
      const s1End = third;
      const s2Start = s1End + 1;
      const s2End = s1End + third;
      const s3Start = s2End + 1;
      return `${headerBlock}

### ĐỀ NGHE HIỂU TỔNG HỢP ĐAN XEN 3 PHẦN CHUẨN HSK ${level} (${total} CÂU — 4 PHƯƠNG ÁN A, B, C, D):
Hãy biên soạn đầy đủ **${total} câu hỏi Nghe hiểu HSK ${level}** chia làm 3 phần chuẩn đề thi HSK ${level} (tất cả đều có 4 phương án A, B, C, D):

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${s1End}): ${
        level === 5
          ? 'Nghe hội thoại ngắn 2 lượt suy luận hàm ý & thái độ người nói'
          : 'Nghe đoạn độc thoại văn hóa / xã hội / khoa học & chọn câu khớp nội dung'
      }
Câu 1:
男：[Nội dung Phần 1 chuẩn HSK ${level}]
女：[Lời đáp hoặc câu tiếp nối]
问：[Câu hỏi suy luận]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu 1 đến Câu ${s1End})

#### 第二部分 / PHẦN 2 (Câu ${s2Start} – Câu ${s2End}): ${
        level === 5
          ? 'Nghe hội thoại dài 4–6 lượt công sở / đời sống xã hội'
          : 'Nghe đoạn phỏng vấn chuyên sâu nhiều lượt giữa Người dẫn chương trình và Khách mời'
      }
Câu ${s2Start}:
男：[Lượt 1 của Nam]
女：[Lượt 1 của Nữ]
男：[Lượt 2 của Nam]
女：[Lượt 2 của Nữ]
问：[Câu hỏi suy luận chuyên sâu]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${s2Start} đến Câu ${s2End})

#### 第三部分 / PHẦN 3 (Câu ${s3Start} – Câu ${total}): Nghe đoạn bài nói / tin tức / diễn thuyết dài (Talks QA)
Câu ${s3Start}:
女：[Đoạn bài nói / câu chuyện / bình luận dài 4–6 câu chuẩn HSK ${level}]
问：[Câu hỏi về ý chính, quan điểm tác giả hoặc chi tiết suy luận]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${s3Start} đến Câu ${total})

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa và giải thích chi tiết bằng tiếng Việt]`;
    }

    // HSK 4 default (Part 1 True/False + Part 2 Short Dialogue 4-opt + Part 3A Long Dialogue 4-opt + Part 3B Short Passage 4-opt)
    return `${headerBlock}

### ĐỀ NGHE HIỂU TỔNG HỢP ĐAN XEN CHUẨN HSK 4 (${total} CÂU):
Hãy biên soạn đầy đủ **${total} câu hỏi Nghe hiểu HSK 4** đan xen đúng cấu trúc đề thi Nghe HSK 4 thực tế:

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${p1End}): Nghe đoạn độc thoại ngắn & Phán đoán Đúng / Sai (对 / 错)
Câu 1:
男：[2–3 câu độc thoại tình huống đời sống / công việc chuẩn HSK 4]
问：[Câu nhận định kết luận để thí sinh phán đoán Đúng hay Sai]
A. 对
B. 错
(Tạo đầy đủ từ Câu 1 đến Câu ${p1End})

#### 第二部分 / PHẦN 2 (Câu ${p2Start} – Câu ${p2End}): Nghe hội thoại ngắn 2 lượt Nam – Nữ (4 phương án A, B, C, D)
Câu ${p2Start}:
男：[Lời thoại Nam]
女：[Lời thoại Nữ]
问：[Câu hỏi về hội thoại]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p2Start} đến Câu ${p2End})

#### 第三部分 A / PHẦN 3A (Câu ${p3Start} – Câu ${p3End}): Nghe hội thoại dài 4 lượt nhiều thông tin (4 phương án A, B, C, D)
Câu ${p3Start}:
男：[Lượt 1 của Nam]
女：[Lượt 1 của Nữ]
男：[Lượt 2 của Nam]
女：[Lượt 2 của Nữ]
问：[Câu hỏi suy luận địa điểm / quan hệ / quyết định cuối cùng]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p3Start} đến Câu ${p3End})

#### 第三部分 B / PHẦN 3B (Câu ${p4Start} – Câu ${total}): Nghe đoạn độc thoại / câu chuyện ngắn (4 phương án A, B, C, D)
Câu ${p4Start}:
女：[Đoạn độc thoại / câu chuyện ngắn 3–4 câu chuẩn HSK 4]
问：[Câu hỏi về nội dung chính hoặc bài học rút ra]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p4Start} đến Câu ${total})

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa hội thoại và giải thích chi tiết bằng tiếng Việt]`;
  }

  if (formatType === 'listen_true_false_statement') {
    const visualRule =
      level <= 2
        ? `\n*Quy tắc hình ảnh (HSK ${level}):* ${cleanVisualImgRule}`
        : '';
    const imgPrefix =
      level <= 2
        ? `[IMG: <english scene description without Chinese characters or answer words>]\n`
        : '';
    return `${headerBlock}

### PHẦN NGHE 1: PHÁN ĐOÁN ĐÚNG / SAI THEO CÂU NÓI HOẶC ĐỘC THOẠI NGẮN (${count} CÂU):
Hãy biên soạn **${count} câu hỏi Nghe hiểu Phán đoán Đúng / Sai (对 / 错)** chuẩn HSK ${level}. Mỗi câu gồm lời nói/độc thoại ngắn (1–2 câu) của nhân vật và 1 câu nhận định (\`问：\`) để thí sinh chọn \`A. 对\` (Đúng với nội dung nghe) hoặc \`B. 错\` (Sai / trái ngược / đánh tráo thông tin):${visualRule}

Câu 1:
${imgPrefix}男：[Lời độc thoại 1–2 câu tiếng Trung chuẩn HSK ${level}]
问：[Nhận định tóm tắt để phán đoán Đúng hay Sai]
A. 对
B. 错

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${count}):
Câu 1: [A/B]. Giải thích: [Dịch nghĩa câu nói và giải thích vì sao nhận định Đúng (对) hoặc Sai (错)]`;
  }

  if (formatType === 'listen_long_dialogue_4turns') {
    const optRule = '4 phương án A, B, C, D';
    return `${headerBlock}

### PHẦN NGHE 3: HỘI THOẠI DÀI 4–6 LƯỢT QUA LẠI GIỮA NAM VÀ NỮ (${count} CÂU):
Hãy biên soạn **${count} câu hỏi Nghe hiểu hội thoại dài (4–6 lượt thoại)** chuẩn HSK ${level} với ${optRule}. Mỗi hội thoại phải có sự phát triển tình huống (hỏi thông tin -> bàn bạc / đổi ý -> chốt quyết định):

Câu 1:
男：[Lượt thoại 1 của Nam]
女：[Lượt thoại 1 của Nữ]
男：[Lượt thoại 2 của Nam]
女：[Lượt thoại 2 của Nữ]
问：[Câu hỏi suy luận về địa điểm, mối quan hệ, nguyên nhân hoặc hành động tiếp theo]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${count}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa hội thoại và giải thích chi tiết bằng tiếng Việt]`;
  }

  if (formatType === 'read_mixed_all_parts') {
    const total = Math.max(4, count);
    const p1End = Math.max(1, Math.round(total * 0.35));
    const p2Start = p1End + 1;
    const p2End = Math.max(p2Start, Math.round(total * 0.65));
    const p3Start = p2End + 1;

    return `${headerBlock}

### ĐỀ ĐỌC HIỂU TỔNG HỢP ĐAN XEN 3 PHẦN CHUẨN HSK ${level} (${total} CÂU):
Hãy biên soạn đầy đủ **${total} câu hỏi Đọc hiểu** đan xen 3 phần khác nhau theo đúng cấu trúc đề thi Đọc HSK thực tế (không làm đơn điệu 1 kiểu câu hỏi):

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${p1End}): Điền từ vựng / cấu trúc ngữ pháp vào chỗ trống \`____\`
Câu 1: [Câu hoặc hội thoại ngắn có chỗ trống ____ kiểm tra từ vựng/ngữ pháp HSK ${level}]
A. [Từ A]
B. [Từ B]
C. [Từ C]
D. [Từ D]
(Tạo đầy đủ từ Câu 1 đến Câu ${p1End})

#### 第二部分 / PHẦN 2 (Câu ${p2Start} – Câu ${p2End}): ${
      level <= 2
        ? 'Phán đoán Đúng / Sai logic câu (A. 对 / B. 错) hoặc Chọn câu phản hồi hội thoại phù hợp'
        : 'Sắp xếp trật tự câu hoàn chỉnh hoặc Chọn câu tiếp nối phù hợp với ngữ cảnh'
    }
Câu ${p2Start}: [Nội dung câu hỏi Phần 2 chuẩn HSK ${level}]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p2Start} đến Câu ${p2End})

#### 第三部分 / PHẦN 3 (Câu ${p3Start} – Câu ${total}): Đọc hiểu đoạn văn ngắn & Suy luận thông tin
Câu ${p3Start}: [Đoạn văn ngắn 3–5 câu tiếng Trung chuẩn HSK ${level}]
问：[Câu hỏi suy luận ý chính hoặc chi tiết trong đoạn văn]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
(Tạo đầy đủ từ Câu ${p3Start} đến Câu ${total})

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa và giải thích chi tiết bằng tiếng Việt]`;
  }

  if (formatType === 'read_dialogue_matching_5opt') {
    const groupsCount = Math.max(1, Math.ceil(count / 5));
    return `${headerBlock}

### ĐỌC HIỂU GHÉP NỐI CẶP CÂU HỘI THOẠI A–E (${groupsCount} NHÓM, TỔNG ${groupsCount * 5} CÂU):
Mỗi nhóm 5 câu sử dụng chung 1 bảng 5 câu phản hồi A–E (mỗi phương án chỉ dùng 1 lần trong nhóm):

第二部分: 第 1 - 5 题
Quy tắc: Chọn một phương án phù hợp nhất từ A đến E để ghép thành cặp hội thoại tự nhiên.
A. [Câu lựa chọn A]
B. [Câu lựa chọn B]
C. [Câu lựa chọn C]
D. [Câu lựa chọn D]
E. [Câu lựa chọn E]
1. [Câu ngữ cảnh 1] → [ ]
2. [Câu ngữ cảnh 2] → [ ]
3. [Câu ngữ cảnh 3] → [ ]
4. [Câu ngữ cảnh 4] → [ ]
5. [Câu ngữ cảnh 5] → [ ]

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D/E]. Giải thích: [Dịch nghĩa cặp câu và giải thích bằng tiếng Việt]`;
  }

  if (formatType === 'write_mixed_all_parts') {
    const total = Math.max(4, count);
    const p1End = Math.max(1, Math.floor(total / 2));
    const p2Start = p1End + 1;

    return `${headerBlock}

### ĐỀ THI VIẾT TỔNG HỢP ĐAN XEN CHUẨN THI MÁY CBT HSK ${level} (${total} CÂU):
Hãy biên soạn đầy đủ **${total} câu hỏi phần thi Viết (书写)** chia làm 2 phần đan xen chuẩn đề thi máy HSK ${level}:

#### 第一部分 / PHẦN 1 (Câu 1 – Câu ${p1End}): Sắp xếp các cụm từ xáo trộn thành câu hoàn chỉnh (连词成句)
Câu 1: [Cụm 1] / [Cụm 2] / [Cụm 3] / [Cụm 4] / [Cụm 5]
A. [Phương án trật tự A]
B. [Phương án trật tự B]
C. [Phương án trật tự C]
D. [Phương án trật tự D]
(Tạo đầy đủ từ Câu 1 đến Câu ${p1End})

#### 第二部分 / PHẦN 2 (Câu ${p2Start} – Câu ${total}): Điền chữ Hán chuẩn theo phiên âm Pinyin & Ngữ cảnh câu (看拼音选汉字/词)
Câu ${p2Start}: [Câu tiếng Trung có từ để trống kèm phiên âm Pinyin chuẩn trong ngoặc đơn, ví dụ: 他每天都去图书馆____(kànshū)。]
A. [Chữ Hán đúng]
B. [Chữ Hán đồng âm gây nhiễu 1]
C. [Chữ Hán gần âm gây nhiễu 2]
D. [Chữ Hán khác nghĩa gây nhiễu 3]
(Tạo đầy đủ từ Câu ${p2Start} đến Câu ${total})

### ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT (TỪ CÂU 1 ĐẾN CÂU ${total}):
Câu 1: [A/B/C/D]. Giải thích: [Câu hoàn chỉnh, dịch nghĩa và phân tích cấu trúc ngữ pháp chi tiết bằng tiếng Việt]`;
  }

  if (formatType === 'multi_part_20q') {
    const total = Math.max(4, count);
    const perPart = Math.max(1, Math.floor(total / 4));
    const p1Start = 1;
    const p1End = perPart;
    const p2Start = p1End + 1;
    const p2End = p1End + perPart;
    const p3Start = p2End + 1;
    const p3End = p2End + perPart;
    const p4Start = p3End + 1;
    const p4End = total;

    const renderRangeLines = (start: number, end: number, prefixLabel: string) => {
      const lines: string[] = [];
      const maxPreview = Math.min(end, start + 4);
      for (let i = start; i <= maxPreview; i++) {
        lines.push(`${i}. [${prefixLabel} ${i}] ([Pinyin]) → [ ]`);
      }
      if (end > maxPreview) {
        lines.push(`... (Tạo liên tục đầy đủ đến câu ${end}, tuyệt đối không bỏ sót câu nào)`);
        lines.push(`${end}. [${prefixLabel} ${end}] ([Pinyin]) → [ ]`);
      }
      return lines.join('\n');
    };

    return `${headerBlock}

### CẤU TRÚC ĐỀ THI TỔNG HỢP 4 PHẦN (${total} CÂU — ĐỊNH DẠNG CHUẨN MINNESE):
Hãy trình bày đúng 4 phần sau (tổng cộng ${total} câu, không lược bỏ câu nào):

第一部分: 第 ${p1Start} - ${p1End} 题 (Phần 1: Câu ${p1Start} - ${p1End})
Quy tắc: Đọc từ vựng và câu tương ứng, xác định xem nội dung hai bên có đồng nhất ý nghĩa hay không. Điền đúng (√) hoặc sai (×).
1. [Từ vựng chữ Hán] ([Pinyin])
[Câu tiếng Trung hoàn chỉnh] ([Pinyin câu]) → [ ]
(Tạo đủ từ câu ${p1Start} đến câu ${p1End}, xen kẽ cả câu Đúng √ và câu Sai × có bẫy phủ định 没/不 hoặc khác phạm trù ngữ nghĩa)

第二部分: 第 ${p2Start} - ${p2End} 题 (Phần 2: Câu ${p2Start} - ${p2End})
Quy tắc: Chọn một phương án phù hợp nhất từ A đến E để ghép với từng câu ngữ cảnh (mỗi nhóm 5 câu dùng một bảng A–E).
A. [Câu lựa chọn A] ([Pinyin])
B. [Câu lựa chọn B] ([Pinyin])
C. [Câu lựa chọn C] ([Pinyin])
D. [Câu lựa chọn D] ([Pinyin])
E. [Câu lựa chọn E] ([Pinyin])
${renderRangeLines(p2Start, p2End, 'Câu ngữ cảnh')}

第三部分: 第 ${p3Start} - ${p3End} 题 (Phần 3: Câu ${p3Start} - ${p3End})
Quy tắc: Chọn chữ cái từ A đến E tương ứng với câu trả lời đúng cho từng câu hỏi.
A. [Câu phản hồi A] ([Pinyin])
B. [Câu phản hồi B] ([Pinyin])
C. [Câu phản hồi C] ([Pinyin])
D. [Câu phản hồi D] ([Pinyin])
E. [Câu phản hồi E] ([Pinyin])
${renderRangeLines(p3Start, p3End, 'Câu hỏi')}

第四部分: 第 ${p4Start} - ${p4End} 题 (Phần 4: Câu ${p4Start} - ${p4End})
Quy tắc: Chọn từ thích hợp trong bảng A–E để điền vào chỗ trống ______ trong mỗi câu (mỗi từ chỉ dùng một lần trong nhóm).
A. [Từ A] ([Pinyin])
B. [Từ B] ([Pinyin])
C. [Từ C] ([Pinyin])
D. [Từ D] ([Pinyin])
E. [Từ E] ([Pinyin])
${renderRangeLines(p4Start, p4End, 'Câu có chỗ trống ______ số')}

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT
1. [√ hoặc ×] - Giải thích: [Giải thích tiếng Việt chi tiết]
... (Ghi đầy đủ đáp án và lời giải từ câu 1 đến câu ${total})`;
  }

  if (formatType === 'ielts_listening_traps') {
    const optCountLabel = '4 phương án A, B, C, D';
    return `${headerBlock}

### KỸ THUẬT RA ĐỀ NGHE HỘI THOẠI NGẮN NAM – NỮ CHUẨN HSK ${level} (${count} CÂU — 4 PHƯƠNG ÁN A, B, C, D):
Hãy thiết kế ${count} câu hỏi Nghe hiểu hội thoại Nam (男) – Nữ (女) đúng phạm vi độ khó HSK ${level}:
${
  level === 1
    ? '- Cấp độ HSK 1: Hội thoại 2 câu đơn ngắn gọn về giao tiếp cơ bản (thời gian, gia đình, đồ ăn, mua sắm, trường học), câu hỏi trực tiếp dễ hiểu.'
    : `- Áp dụng kỹ thuật bẫy tư duy phù hợp trình độ HSK ${level}: diễn đạt lại từ khóa (Paraphrase), tự sửa lời / đổi ý (Self-Correction Twist) và bẫy thời gian/số liệu.`
}

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC CHO MỖI CÂU (TỪ CÂU 1 ĐẾN CÂU ${count}):
*LƯU Ý: TUYỆT ĐỐI KHÔNG viết các dòng chú thích bối cảnh/nhân vật như "Nhân vật tham gia:", "Bối cảnh:" trước câu thoại. Mỗi câu hỏi chỉ viết trực tiếp lời thoại bắt đầu bằng 男： và 女： kèm ${optCountLabel}.*
Câu 1:
男：[Lời thoại nhân vật Nam]
女：[Lời thoại nhân vật Nữ]
问：[Câu hỏi về hội thoại]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
Đáp án: [A/B/C/D]
Giải thích: [Dịch nghĩa hội thoại và phân tích rõ lý do chọn đáp án bằng tiếng Việt]`;
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

  if (formatType === 'write_sentence_reorder_4opt') {
    return `${headerBlock}

### PHẦN THI VIẾT HSK ${level}: SẮP XẾP CÂU HOÀN CHỈNH (连词成句 — ${count} CÂU):
Bạn hãy biên soạn ${count} câu bài tập phần thi Viết: Sắp xếp các cụm từ xáo trộn thành câu hoàn chỉnh theo chuẩn CBT HSK 3.0 (HSK ${level}):

### QUY TẮC SƯ PHẠM & THI MÁY (CBT):
1. Mỗi câu gồm 4 đến 5 ngữ khối (chunks) đã bị xáo trộn thứ tự, ngăn cách rõ ràng bởi dấu gạch chéo \`/\`.
2. Toàn bộ từ vựng phải nằm trong phạm vi HSK ${level} (${spec.vocabCount} từ chuẩn GF 0025-2021).
3. Đảm bảo câu hoàn chỉnh chỉ có DUY NHẤT 1 trật tự ngữ pháp đúng, tự nhiên, không thể chấp nhận cách sắp xếp tùy tiện khác.
4. Trọng tâm kiểm tra các kết cấu ngữ pháp cốt lõi HSK ${level} (ví dụ: câu chữ 把/被, liên từ phức, bổ ngữ kết quả/xu hướng, trạng ngữ thời gian/nơi chốn).

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (TỪ CÂU 1 ĐẾN CÂU ${count}):
Câu 1: [Ngữ khối 1] / [Ngữ khối 2] / [Ngữ khối 3] / [Ngữ khối 4] / [Ngữ khối 5]
A. [Phương án trật tự A]
B. [Phương án trật tự B]
C. [Phương án trật tự C]
D. [Phương án trật tự D]

Câu 2: ...

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]
- Câu hoàn chỉnh: [Câu tiếng Trung hoàn chỉnh sau khi sắp xếp đúng] ([Pinyin])
- Dịch nghĩa: [Dịch nghĩa câu sang tiếng Việt]
- Cấu trúc ngữ pháp: [Phân tích công thức ngữ pháp áp dụng, ví dụ: S + 把 + O + V + Bổ ngữ]
- Phân tích bẫy trật tự từ: [Giải thích cụ thể vì sao các phương án nhiễu còn lại là sai trật tự cú pháp tiếng Trung]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "Ngữ khối 1 / Ngữ khối 2 / Ngữ khối 3 / Ngữ khối 4",
    "options": ["Trật tự A", "Trật tự B", "Trật tự C", "Trật tự D"],
    "answer_idx": 0,
    "pinyin": "Phiên âm Pinyin chuẩn của câu hoàn chỉnh",
    "explanation_vi": "Dịch nghĩa và phân tích cấu trúc ngữ pháp chi tiết bằng tiếng Việt.",
    "distractor_rationales": [
      { "option_idx": 1, "option_text": "Trật tự B", "rationale_vi": "Sai vì trật tự ngữ pháp không đúng..." },
      { "option_idx": 2, "option_text": "Trật tự C", "rationale_vi": "Sai vì đặt phó từ sai vị trí..." },
      { "option_idx": 3, "option_text": "Trật tự D", "rationale_vi": "Sai vì đảo lộn vị ngữ..." }
    ],
    "level": ${level},
    "skill": "writing",
    "part_type": "write_sentence_reorder_4opt"
  }
]
\`\`\``;
  }

  if (formatType === 'write_tianzige_from_pinyin') {
    return `${headerBlock}

### PHẦN THI VIẾT HSK ${level}: NHÌN PINYIN GÕ CHỮ HÁN (看拼音写汉字/词 — ${count} CÂU):
Bạn hãy biên soạn ${count} câu bài tập phần thi Viết: Nhìn phiên âm điền chữ Hán vào ô trống theo chuẩn CBT HSK 3.0 (HSK ${level}):

### QUY TẮC THI MÁY (CBT):
1. Mỗi câu là một ngữ cảnh giao tiếp hoàn chỉnh, trong đó có một từ/chữ Hán trọng tâm để trống kèm phiên âm Pinyin có thanh điệu đặt trong ngoặc đơn, ví dụ: （píngguǒ） hoặc （bān）.
2. Từ cần điền là từ vựng cốt lõi HSK ${level} (${spec.vocabCount} từ chuẩn GF 0025-2021).
3. Ngữ cảnh câu văn phải đủ chặt chẽ và tự nhiên để từ đó là lựa chọn chuẩn xác duy nhất.
4. Đây là dạng bài viết tự luận/gõ chữ: trong hệ thống JSON Minnese, bắt buộc \`options: []\`, \`answer_idx: 0\`, và \`distractor_rationales: []\`.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Câu 1: 今天早上妈妈去超市买了一些（píngguǒ）。
Câu 2: ...

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: 苹果
- Dịch nghĩa: [Dịch nghĩa câu sang tiếng Việt]
- Phân tích từ vựng: [Giải thích từ loại, âm Hán Việt và cách dùng trong câu]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "今天早上妈妈去超市买了一些（píngguǒ）。",
    "options": [],
    "answer_idx": 0,
    "pinyin": "Jīntiān zǎoshang māma qù chāoshì mǎi le yìxiē píngguǒ.",
    "explanation_vi": "Từ cần điền: 苹果 (quả táo). Dịch nghĩa: Sáng nay mẹ đi siêu thị mua một ít táo.",
    "distractor_rationales": [],
    "level": ${level},
    "skill": "writing",
    "part_type": "write_tianzige_from_pinyin"
  }
]
\`\`\``;
  }

  if (formatType === 'write_short_essay_80chars') {
    return `${headerBlock}

### PHẦN THI VIẾT HSK ${level}: VIẾT ĐOẠN VĂN NGẮN ~80 CHỮ (HSK 4–5 — ${count} ĐỀ):
Bạn hãy biên soạn ${count} đề bài phần thi Viết: Viết đoạn văn ngắn khoảng 80 chữ dựa trên 5 từ khóa cho sẵn hoặc mô tả hình ảnh tình huống theo chuẩn CBT HSK 3.0:

### QUY TẮC SƯ PHẠM KHẢO THÍ:
1. Mỗi đề bài cung cấp 5 từ vựng gợi ý thuộc khung HSK ${level} (${spec.vocabCount} từ chuẩn, ví dụ: 坚持, 成功, 克服, 困难, 经验) hoặc một tình huống miêu tả tranh kèm thẻ \`[IMG: ...]\`.
2. ${cleanVisualImgRule} (Nếu chọn dạng miêu tả tranh, đặt thẻ \`[IMG: ...]\` ngay trước nội dung đề bài hoặc điền trường \`"illustration_theme"\` bằng mô tả tiếng Anh thuần túy).
3. Thí sinh phải viết một đoạn văn ngắn khoảng 80 chữ Hán (dung lượng chuẩn 70–90 chữ), kết nối chặt chẽ và sử dụng toàn bộ các từ gợi ý hoặc bám sát tình huống tranh một cách tự nhiên.
4. Trong hệ thống JSON thi máy tự luận mở: bắt buộc \`options: []\`, \`answer_idx: 0\`, và \`distractor_rationales: []\`.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Đề bài 1 (Từ khóa): 请结合以下5个词语写一篇80字左右的短文：[Từ 1]、[Từ 2]、[Từ 3]、[Từ 4]、[Từ 5]
Đề bài 2 (Miêu tả tranh tùy chọn):
[IMG: <english scene description without Chinese characters or answer words>]
请根据图片写一篇80字左右的短文。

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Đề bài 1:
- Bài văn mẫu chuẩn (~80 chữ): [Đoạn văn tiếng Trung mẫu mực, khoảng 80 chữ Hán, hành văn tự nhiên]
- Dịch nghĩa tiếng Việt: [Dịch nghĩa toàn bộ đoạn văn sang tiếng Việt]
- Phân tích điểm nhấn sư phạm: [Chỉ rõ cách liên kết 5 từ khóa và cấu trúc câu đắt giá]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "请结合以下5个词语写一篇80字左右的短文：坚持、成功、克服、困难、经验",
    "illustration_theme": null,
    "options": [],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Bài viết mẫu (~80 chữ), bản dịch tiếng Việt và phân tích cấu trúc diễn đạt.",
    "distractor_rationales": [],
    "level": ${level},
    "skill": "writing",
    "part_type": "write_short_essay_80chars"
  }
]
\`\`\``;
  }

  if (formatType === 'write_topic_essay_200chars') {
    return `${headerBlock}

### PHẦN THI VIẾT HSK ${level}: NGHỊ LUẬN THEO CHỦ ĐỀ ~200 CHỮ (HSK 5 — ${count} ĐỀ):
Bạn hãy biên soạn ${count} đề bài phần thi Viết: Viết bài văn nghị luận xã hội / quan điểm cá nhân khoảng 200 chữ theo chuẩn CBT HSK 5:

### QUY TẮC KHẢO THÍ HSK 5:
1. Đề tài xoay quanh các vấn đề xã hội đương đại, lối sống hiện đại, công sở, giáo dục hoặc môi trường (ví dụ: mua sắm qua mạng, làm việc từ xa, bảo vệ môi trường, văn hóa đọc).
2. Thí sinh phải trình bày rõ ràng: Luận điểm (观点), Luận cứ & Dẫn chứng (论据), và Kết luận (结论) trong khoảng 200 chữ Hán (dung lượng chuẩn 180–220 chữ).
3. Trong hệ thống JSON thi máy tự luận mở: bắt buộc \`options: []\`, \`answer_idx: 0\`, và \`distractor_rationales: []\`.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Đề bài 1: 题目：谈谈你对[Chủ đề nghị luận]的看法，写一篇200字左右的议论文。

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Đề bài 1:
- Bài văn mẫu chuẩn (~200 chữ): [Bài văn tiếng Trung mẫu mực, khoảng 200 chữ Hán, lập luận sắc bén]
- Dịch nghĩa tiếng Việt: [Dịch toàn bộ bài văn sang tiếng Việt]
- Phân tích kết cấu nghị luận: [Phân tích luận điểm, các liên từ chuyển ý và từ vựng đắt giá]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "题目：谈谈你对网络购物（网购）的看法，写一篇200字左右的议论文。",
    "options": [],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Bài văn nghị luận mẫu 200 chữ, bản dịch tiếng Việt và phân tích kết cấu lập luận.",
    "distractor_rationales": [],
    "level": ${level},
    "skill": "writing",
    "part_type": "write_topic_essay_200chars"
  }
]
\`\`\``;
  }

  if (formatType === 'write_summary_shortening_400chars') {
    return `${headerBlock}

### PHẦN THI VIẾT HSK 6: RÚT GỌN VĂN BẢN 1000 CHỮ THÀNH 400 CHỮ (HSK 6 缩写 — ${count} ĐỀ):
Bạn hãy biên soạn ${count} đề bài phần thi Viết HSK 6: Đọc một câu chuyện tự sự 1000 chữ và rút gọn thành bài văn khoảng 400 chữ kèm tiêu đề tự đặt theo đúng chuẩn khảo thí HSK 6:

### QUY TẮC KHẢO THÍ CHUẨN CTI HSK 6:
1. Cung cấp một câu chuyện tự sự hoàn chỉnh dung lượng khoảng 1000 chữ Hán (có mở đầu, diễn biến, cao trào và kết cục giàu ý nghĩa nhân văn/bài học cuộc sống).
2. Quy tắc thi máy CBT: Thí sinh đọc văn bản trong 10 phút (màn hình hiển thị); sau 10 phút bài đọc tự động đóng lại, thí sinh có 35 phút để nhập bài rút gọn khoảng 400 chữ (khoảng 350–450 chữ) và tự đặt tiêu đề.
3. Tuyệt đối KHÔNG đưa quan điểm cá nhân hoặc bình luận chủ quan vào bài rút gọn; giữ nguyên ngôi kể và mạch truyện chính.
4. Trong hệ thống JSON: \`passage\` chứa toàn bộ 1000 chữ bài đọc gốc, \`options: []\`, \`answer_idx: 0\`, và \`distractor_rationales: []\`.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Đề bài 1:
阅读下面1000字左右的文章，在35分钟内将其缩写成一篇400字左右的短文，并自拟标题：
[Toàn bộ câu chuyện tự sự 1000 chữ tiếng Trung]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Đề bài 1:
- Tiêu đề gợi ý: [Tiêu đề tiếng Trung súc tích]
- Bài rút gọn mẫu (~400 chữ): [Bài rút gọn mẫu mực khoảng 400 chữ Hán, cô đọng tinh hoa cốt truyện]
- Dịch nghĩa tiếng Việt: [Bản dịch tóm tắt tiếng Việt]
- Phân tích kỹ thuật rút gọn: [Chỉ rõ các tình tiết rườm rà đã được tỉnh lược và cách giữ vững mạch truyện]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "阅读下面1000字的文章，在35分钟内将其缩写成一篇400字左右的短文，并自拟标题。",
    "passage": "[Toàn bộ bài đọc tự sự 1000 chữ]",
    "options": [],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Tiêu đề, bài rút gọn mẫu 400 chữ, bản dịch tiếng Việt và phân tích phương pháp tóm tắt.",
    "distractor_rationales": [],
    "level": 6,
    "skill": "writing",
    "part_type": "write_summary_shortening_400chars"
  }
]
\`\`\``;
  }

  if (formatType === 'read_find_faulty_sentence_4opt') {
    return `${headerBlock}

### PHẦN THI ĐỌC HIỂU HSK 6: BẮT LỖI CÂU NGỮ PHÁP (病句辨析 — ${count} CÂU):
Bạn hãy biên soạn ${count} câu hỏi Đọc hiểu Phần 1: Phát hiện câu có lỗi ngữ pháp (病句辨析) trình độ HSK 6 chuẩn khảo thí quốc tế:

### QUY TẮC HỌC THUẬT & KHẢO THÍ CHUẨN XÁC:
1. Mỗi câu hỏi gồm đúng 4 câu độc lập A, B, C, D (văn phong trang trọng 书面语, đề tài văn hóa, khoa học, xã hội, giáo dục).
2. Trong 4 câu, DUY NHẤT 1 câu có lỗi ngữ pháp điển hình thuộc một trong 5 nhóm lỗi kinh điển:
   - 成分残缺 (Thiếu thành phần câu: thiếu chủ ngữ do lạm dụng giới từ 在/通过, thiếu vị ngữ hoặc tân ngữ).
   - 搭配不当 (Kết hợp từ không chuẩn: động từ - tân ngữ không khớp, chủ vị lệch nghĩa).
   - 语序不当 (Trật tự từ sai: đảo lộn phó từ, định ngữ hoặc trạng ngữ đa tầng).
   - 句式杂糅 (Trộn lẫn hai kết cấu câu khác nhau).
   - 不合逻辑 (Mâu thuẫn logic, phủ định kép thành sai nghĩa).
3. 3 câu còn lại phải hoàn toàn chuẩn xác, tự nhiên, mẫu mực về mặt ngữ pháp tiếng Trung hiện đại.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC CHO MỖI CÂU (TỪ CÂU 1 ĐẾN CÂU ${count}):
Câu 1: 下列句子中，有语病的一项是：
A. [Câu tiếng Trung A]
B. [Câu tiếng Trung B]
C. [Câu tiếng Trung C]
D. [Câu tiếng Trung D]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]
- Phân tích lỗi sai: [Chỉ rõ từ ngữ hoặc kết cấu bị sai và thuộc dạng lỗi ngữ pháp gì]
- Cách sửa chuẩn: [Đưa ra câu đúng hoàn chỉnh sau khi sửa lỗi]
- Dịch nghĩa & Phân tích các câu đúng: [Dịch nghĩa câu bệnh và phân tích vì sao 3 câu còn lại đúng ngữ pháp]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "下列句子中，有语病的一项是：",
    "options": ["Câu A", "Câu B", "Câu C", "Câu D"],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Phân tích cụ thể lỗi ngữ pháp và cách sửa chuẩn thành câu đúng.",
    "distractor_rationales": [
      { "option_idx": 1, "option_text": "Câu B", "rationale_vi": "Câu B hoàn toàn đúng ngữ pháp vì kết cấu chủ vị và định ngữ chuẩn mực." },
      { "option_idx": 2, "option_text": "Câu C", "rationale_vi": "Câu C đúng ngữ pháp và dùng từ chính xác." },
      { "option_idx": 3, "option_text": "Câu D", "rationale_vi": "Câu D đúng ngữ pháp, diễn đạt tự nhiên." }
    ],
    "level": ${level},
    "skill": "reading",
    "part_type": "read_find_faulty_sentence_4opt"
  }
]
\`\`\``;
  }

  if (formatType === 'read_paragraph_sentence_ordering') {
    return `${headerBlock}

### PHẦN THI ĐỌC HIỂU HSK 5: SẮP XẾP TRẬT TỰ ĐOẠN VĂN (段落排序 — ${count} BỘ):
Bạn hãy biên soạn ${count} bộ bài tập Đọc hiểu Phần 2: Sắp xếp các câu văn thành đoạn văn hoàn chỉnh trình độ HSK 5:

### QUY TẮC CẤU TRÚC ĐOẠN VĂN:
1. Mỗi bài tập gồm 5 câu văn độc lập (gán nhãn A, B, C, D, E) bị đảo lộn trật tự logic.
2. Khi ghép lại theo thứ tự đúng, 5 câu tạo thành một đoạn văn hoàn chỉnh (nghị luận, thuyết minh hoặc tự sự) mạch lạc, có tính liên kết cao.
3. Sử dụng các liên từ và từ nối logic rõ ràng (ví dụ: 首先, 其次, 不仅如此, 结果, 从而, 事实上, 另一方面) để thí sinh có căn cứ suy luận vững chắc.
4. Cung cấp 5 phương án trật tự lựa chọn A, B, C, D, E cho câu hỏi thi máy.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC CHO MỖI CÂU (TỪ CÂU 1 ĐẾN CÂU ${count}):
Câu 1:
A. [Câu A]
B. [Câu B]
C. [Câu C]
D. [Câu D]
E. [Câu E]
Phương án lựa chọn trật tự:
A. [Trật tự 1, ví dụ: B-D-A-C-E]
B. [Trật tự 2, ví dụ: B-A-D-C-E]
C. [Trật tự 3, ví dụ: D-B-A-C-E]
D. [Trật tự 4, ví dụ: B-D-C-A-E]
E. [Trật tự 5, ví dụ: D-B-C-A-E]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D/E] (Thứ tự đúng: [Ví dụ: B-D-A-C-E])
- Dịch nghĩa toàn đoạn văn: [Dịch toàn bộ đoạn văn hoàn chỉnh sang tiếng Việt]
- Phân tích mạch liên kết logic: [Chỉ rõ câu mở đoạn, các liên từ chuyển tiếp và câu kết luận]
- Phân tích phương án nhiễu: [Giải thích vì sao các trật tự khác làm đứt gãy mạch lập luận]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "请将下列5个句子排列成一段连贯通顺的话：\\nA. [Câu A]\\nB. [Câu B]\\nC. [Câu C]\\nD. [Câu D]\\nE. [Câu E]",
    "options": ["B-D-A-C-E", "B-A-D-C-E", "D-B-A-C-E", "B-D-C-A-E", "D-B-C-A-E"],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Dịch toàn bộ đoạn văn và phân tích mạch logic dẫn chứng.",
    "distractor_rationales": [
      { "option_idx": 1, "option_text": "B-A-D-C-E", "rationale_vi": "Sai vì câu A không thể đứng trước câu D..." },
      { "option_idx": 2, "option_text": "D-B-A-C-E", "rationale_vi": "Sai vì câu D chứa đại từ thay thế chưa rõ nghĩa..." },
      { "option_idx": 3, "option_text": "B-D-C-A-E", "rationale_vi": "Sai vì liên từ kết đoạn bị đảo lên trước..." },
      { "option_idx": 4, "option_text": "D-B-C-A-E", "rationale_vi": "Sai vì câu D không thể mở đầu đoạn văn khi đại từ chưa có tiền ngữ..." }
    ],
    "level": ${level},
    "skill": "reading",
    "part_type": "read_paragraph_sentence_ordering"
  }
]
\`\`\``;
  }

  if (formatType === 'listen_talks_qa_4opt') {
    return `${headerBlock}

### PHẦN THI NGHE HIỂU HSK ${level}: BÀI NÓI / DIỄN THUYẾT / PHỎNG VẤN (Talks QA — ${count} CÂU):
Bạn hãy biên soạn bài nghe hiểu dạng độc thoại, bài nói chuyện, phỏng vấn hoặc thuyết trình ngắn (Talks & Lectures) kèm ${count} câu hỏi trắc nghiệm A, B, C, D theo chuẩn CBT HSK ${level}:

### QUY TẮC KỸ THUẬT & SƯ PHẠM:
1. Nội dung âm thanh là một đoạn độc thoại hoặc phỏng vấn chuyên đề (độ dài 150–300 chữ Hán tùy cấp độ, chủ đề văn hóa, khoa học đời sống, nghề nghiệp, tâm lý).
2. Kèm 2 đến 3 câu hỏi trắc nghiệm liên tiếp về nội dung bài nói; mỗi câu hỏi có đúng 4 phương án lựa chọn A, B, C, D (đối với HSK 4–6).
3. Áp dụng bẫy suy luận: chống bắt từ khóa nguyên văn (anti-verbatim paraphrase), hỏi về thông tin chi tiết hoặc thái độ/kết luận của người nói.
4. Ghi rõ nhãn \`独白/讲话录音内容：\` để hệ thống MinNese bóc tách audio phát âm Neural TTS.

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
独白/讲话录音内容：
[Toàn bộ bài nói / độc thoại tiếng Trung chuẩn HSK ${level}]

Câu 1: [Câu hỏi 1 về bài nói]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]

Câu 2: [Câu hỏi 2 về bài nói]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa và đối chiếu thông tin với bài nói bằng tiếng Việt, chỉ rõ bẫy nhiễu]
Câu 2: [A/B/C/D]. Giải thích: ...

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "关于这段讲话，下列哪项正确？",
    "passage": "[Toàn bộ bài nói tiếng Trung]",
    "audio_text": "[Toàn bộ bài nói tiếng Trung cho giọng đọc TTS]",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Dịch nghĩa và phân tích lý do chọn đáp án.",
    "distractor_rationales": [
      { "option_idx": 1, "option_text": "Phương án B", "rationale_vi": "Phương án B sai vì bài nói khẳng định ngược lại..." },
      { "option_idx": 2, "option_text": "Phương án C", "rationale_vi": "Phương án C không được đề cập trong bài nói..." },
      { "option_idx": 3, "option_text": "Phương án D", "rationale_vi": "Phương án D là thông tin gây nhiễu..." }
    ],
    "level": ${level},
    "skill": "listening",
    "part_type": "listen_talks_qa_4opt"
  }
]
\`\`\``;
  }

  if (formatType === 'listen_picture_match_4opt') {
    return `${headerBlock}

### PHẦN THI NGHE HIỂU HSK ${level}: NGHE CÂU CHỌN 1 TRONG 4 TRANH [IMG: ...] (${count} CÂU):
Bạn hãy biên soạn ${count} câu hỏi Nghe hiểu nhìn tranh chọn đáp án đúng (4 lựa chọn A, B, C, D) chuẩn HSK ${level}:
- ${cleanVisualImgRule}
- Mỗi câu bắt buộc có đủ 4 phương án hình ảnh A, B, C, D (tuyệt đối không tạo thiếu phương án D).

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (TỪ CÂU 1 ĐẾN CÂU ${count}):
Câu 1:
男：[Lời thoại Nam ngắn gọn chuẩn HSK ${level}]
女：[Lời thoại Nữ đối đáp tự nhiên (hoặc bỏ trống nếu là câu đơn)]
问：[Câu hỏi ngắn về nội dung vừa nghe]
A. [IMG: <english scene description without Chinese characters or answer words>]
B. [IMG: <english scene description without Chinese characters or answer words>]
C. [IMG: <english scene description without Chinese characters or answer words>]
D. [IMG: <english scene description without Chinese characters or answer words>]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa hội thoại và đối chiếu chi tiết từng bức tranh bằng tiếng Việt]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "男：...\\n女：...\\n问：...",
    "options": ["A", "B", "C", "D"],
    "options_images": [
      "a realistic photo of ...",
      "a realistic photo of ...",
      "a realistic photo of ...",
      "a realistic photo of ..."
    ],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Dịch nghĩa và giải thích chi tiết bằng tiếng Việt.",
    "level": ${level},
    "skill": "listening",
    "part_type": "listen_picture_match_4opt"
  }
]
\`\`\``;
  }

  if (formatType === 'listen_dialogue_picture_match_6opt') {
    const groupsCount = Math.max(1, Math.ceil(count / 5));
    return `${headerBlock}

### PHẦN THI NGHE HIỂU HSK ${level}: NGHE HỘI THOẠI GHÉP BẢNG 6 TRANH [IMG: ...] (A–F) (${groupsCount} NHÓM):
Bạn hãy biên soạn ${count} câu hỏi Nghe hội thoại ngắn ghép với kho 6 hình ảnh A–F chuẩn HSK ${level}:
- ${cleanVisualImgRule}

### ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
A. [IMG: <english scene description without Chinese characters or answer words>]
B. [IMG: <english scene description without Chinese characters or answer words>]
C. [IMG: <english scene description without Chinese characters or answer words>]
D. [IMG: <english scene description without Chinese characters or answer words>]
E. [IMG: <english scene description without Chinese characters or answer words>]
F. [IMG: <english scene description without Chinese characters or answer words>]

Câu 1:
男：[Lời thoại Nam chuẩn HSK ${level}]
女：[Lời thoại Nữ chuẩn HSK ${level}]
问：[Câu hỏi ngắn nếu cần]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D/E/F]. Giải thích: [Dịch nghĩa hội thoại và đối chiếu hình ảnh tương ứng bằng tiếng Việt]

HOẶC ĐỊNH DẠNG JSON SCHEMA MINNESE:
\`\`\`json
[
  {
    "stem": "男：...\\n女：...",
    "options": ["A", "B", "C", "D", "E", "F"],
    "options_images": [
      "a realistic scene of ...",
      "a realistic scene of ...",
      "a realistic scene of ...",
      "a realistic scene of ...",
      "a realistic scene of ...",
      "a realistic scene of ..."
    ],
    "answer_idx": 0,
    "pinyin": "",
    "explanation_vi": "Dịch nghĩa hội thoại và giải thích đáp án bằng tiếng Việt.",
    "level": ${level},
    "skill": "listening",
    "part_type": "listen_dialogue_picture_match_6opt"
  }
]
\`\`\``;
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
    "distractor_rationales": [
      { "option_idx": 1, "option_text": "Phương án B", "rationale_vi": "Phương án B sai vì..." },
      { "option_idx": 2, "option_text": "Phương án C", "rationale_vi": "Phương án C sai vì..." },
      { "option_idx": 3, "option_text": "Phương án D", "rationale_vi": "Phương án D sai vì..." }
    ],
    "level": ${level},
    "skill": "reading",
    "part_type": "read_fill_blank_4opt"
  }
]
\`\`\`
*Lưu ý bắt buộc:*
- Mọi câu trắc nghiệm MCQ phải có đủ **4 phương án A, B, C, D** (tuyệt đối không tạo câu chỉ có A, B, C).
- Đối với câu Nghe có hình ảnh (\`listen_true_false_2opt\`, \`listen_picture_match_4opt\`, \`listen_dialogue_picture_match_6opt\`), điền trường \`"illustration_theme"\` hoặc mảng \`"options_images"\` bằng mô tả cảnh tiếng Anh tự nhiên (tuyệt đối KHÔNG chứa chữ Hán, Pinyin hay từ khóa đáp án).${level >= 2 ? '\n- Đối với bài thi Viết tự luận (viết câu, nhìn pinyin gõ chữ, viết đoạn văn `write_short_essay_80chars`): Đặt `options: []`, `answer_idx: 0`, và `distractor_rationales: []`.' : ''}`;
}
