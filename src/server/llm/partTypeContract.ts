/**
 * Comprehensive Part-Type Quality Contract Map for Minnese HSK 1–6
 *
 * Defines structural, linguistic, and validation rules tailored to each
 * official HSK exam & practice question format.
 */

export type QuestionCategory =
  | 'fill_blank'
  | 'reading_comprehension'
  | 'picture_matching'
  | 'dialogue_matching'
  | 'listening_dialogue'
  | 'listening_monologue'
  | 'writing_make_sentence'
  | 'writing_open_ended'
  | 'true_false'
  | 'generic_mcq';

export interface PartTypeContract {
  partType: string;
  category: QuestionCategory;
  name: string;
  expectedOptions: number;
  requiresPlaceholder: boolean;
  prohibitsPlaceholder?: boolean;
  requiresCompletedStem: boolean;
  requiresQuestionMarkStar?: boolean;
  requiresAudioText?: boolean;
  requiresSpokenTurns?: boolean;
  requiresVisual?: boolean;
  descriptionVi: string;
}

const PART_TYPE_REGISTRY: Record<string, PartTypeContract> = {
  // --- Fill in the Blank Formats ---
  read_fill_blank_4opt: {
    partType: 'read_fill_blank_4opt',
    category: 'fill_blank',
    name: 'Đọc: Điền từ vào chỗ trống (4 phương án)',
    expectedOptions: 4,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Câu chứa đúng 1 chỗ trống (____). 4 phương án cùng từ loại. Backend tự động thế từ vào chỗ trống để tạo completed_stem chuẩn xác.',
  },
  read_fill_blank_word_bank_5opt: {
    partType: 'read_fill_blank_word_bank_5opt',
    category: 'fill_blank',
    name: 'Đọc: Điền từ vào chỗ trống từ ngân hàng từ (5 phương án: A–E)',
    expectedOptions: 5,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Câu chứa chỗ trống và ngân hàng 5 từ vựng A–E để chọn từ phù hợp.',
  },
  read_fill_blank_word_bank_3opt: {
    partType: 'read_fill_blank_word_bank_3opt',
    category: 'fill_blank',
    name: 'Đọc: Điền từ vào chỗ trống từ ngân hàng từ (3 phương án: A–C)',
    expectedOptions: 3,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Câu chứa chỗ trống và ngân hàng 3 từ vựng A–C để chọn từ phù hợp.',
  },
  read_fill_blank_word_bank_4opt: {
    partType: 'read_fill_blank_word_bank_4opt',
    category: 'fill_blank',
    name: 'Đọc: Điền từ vào chỗ trống từ ngân hàng từ (4 phương án: A–D)',
    expectedOptions: 4,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Câu chứa chỗ trống và ngân hàng 4 từ vựng A–D để chọn từ phù hợp.',
  },
  read_fill_blank_word_bank_6opt: {
    partType: 'read_fill_blank_word_bank_6opt',
    category: 'fill_blank',
    name: 'Đọc: Điền từ vào chỗ trống từ ngân hàng từ (6 phương án)',
    expectedOptions: 6,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Câu chứa chỗ trống và ngân hàng 6 từ vựng để chọn từ phù hợp.',
  },

  // --- Reading Comprehension Formats ---
  read_comprehension_short_3opt: {
    partType: 'read_comprehension_short_3opt',
    category: 'reading_comprehension',
    name: 'Đọc hiểu ngắn: Đọc đoạn văn ngắn chọn đáp án (3 phương án)',
    expectedOptions: 3,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresQuestionMarkStar: true,
    descriptionVi: 'Gồm đoạn văn/câu khẳng định ngắn (>= 6 chữ Hán) kèm câu hỏi đánh dấu sao (★). 3 phương án là câu trả lời cho câu hỏi. KHÔNG chứa chỗ trống điền từ.',
  },
  read_comprehension_4opt: {
    partType: 'read_comprehension_4opt',
    category: 'reading_comprehension',
    name: 'Đọc hiểu: Đoạn văn đọc hiểu tiêu chuẩn (4 phương án)',
    expectedOptions: 4,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresQuestionMarkStar: true,
    descriptionVi: 'Đoạn văn hoàn chỉnh kèm câu hỏi hoặc đánh dấu ★. 4 phương án lựa chọn.',
  },

  // --- Picture Matching Formats ---
  read_sentence_picture_match_6opt: {
    partType: 'read_sentence_picture_match_6opt',
    category: 'picture_matching',
    name: 'Đọc: Nối câu với tranh minh họa (6 phương án tranh)',
    expectedOptions: 6,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresVisual: true,
    descriptionVi: 'Câu văn đọc hiểu khớp với một trong 6 hình ảnh SVG trong ngân hàng tranh.',
  },
  listen_picture_match_3opt: {
    partType: 'listen_picture_match_3opt',
    category: 'picture_matching',
    name: 'Nghe: Nghe câu chọn tranh phù hợp (3 phương án tranh)',
    expectedOptions: 3,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    requiresAudioText: true,
    requiresVisual: true,
    descriptionVi: 'Nghe audio (hoặc transcript) và chọn bức tranh đúng trong 3 tranh.',
  },
  listen_dialogue_picture_match_6opt: {
    partType: 'listen_dialogue_picture_match_6opt',
    category: 'picture_matching',
    name: 'Nghe: Nghe hội thoại chọn tranh (6 phương án tranh)',
    expectedOptions: 6,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    requiresAudioText: true,
    requiresSpokenTurns: true,
    requiresVisual: true,
    descriptionVi: 'Hội thoại có lượt lời (Nam/Nữ) và chọn tranh phù hợp.',
  },

  // --- Dialogue & Q&A Formats ---
  read_dialogue_matching_2opt: {
    partType: 'read_dialogue_matching_2opt',
    category: 'dialogue_matching',
    name: 'Đọc: Ghép câu hỏi - đáp hội thoại (2 phương án: A–B)',
    expectedOptions: 2,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Câu hỏi hoặc câu ngữ cảnh cần ghép với câu đáp hợp lý từ bảng 2 phương án A–B.',
  },
  read_dialogue_matching_3opt: {
    partType: 'read_dialogue_matching_3opt',
    category: 'dialogue_matching',
    name: 'Đọc: Ghép câu hỏi - đáp hội thoại (3 phương án: A–C)',
    expectedOptions: 3,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Câu hỏi hoặc câu ngữ cảnh cần ghép với câu đáp hợp lý từ bảng 3 phương án A–C.',
  },
  read_dialogue_matching_4opt: {
    partType: 'read_dialogue_matching_4opt',
    category: 'dialogue_matching',
    name: 'Đọc: Ghép câu hỏi - đáp hội thoại (4 phương án: A–D)',
    expectedOptions: 4,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Câu hỏi hoặc câu ngữ cảnh cần ghép với câu đáp hợp lý từ bảng 4 phương án A–D.',
  },
  read_dialogue_matching_5opt: {
    partType: 'read_dialogue_matching_5opt',
    category: 'dialogue_matching',
    name: 'Đọc: Ghép câu hỏi - đáp hội thoại (5 phương án: A–E)',
    expectedOptions: 5,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Câu hỏi hoặc câu ngữ cảnh cần ghép với câu đáp hợp lý từ bảng 5 phương án A–E.',
  },
  read_dialogue_matching_6opt: {
    partType: 'read_dialogue_matching_6opt',
    category: 'dialogue_matching',
    name: 'Đọc: Ghép câu hỏi - đáp hội thoại (6 phương án)',
    expectedOptions: 6,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Câu hỏi hoặc câu dẫn hội thoại cần ghép với câu đáp hợp lý.',
  },
  listen_dialogue_qa_4opt: {
    partType: 'listen_dialogue_qa_4opt',
    category: 'listening_dialogue',
    name: 'Nghe: Hội thoại hỏi đáp 4 phương án',
    expectedOptions: 4,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresAudioText: true,
    requiresSpokenTurns: true,
    descriptionVi: 'Nghe đoạn hội thoại có lượt lời (男：... 女：...) và trả lời câu hỏi.',
  },
  listen_monologue_qa_3opt: {
    partType: 'listen_monologue_qa_3opt',
    category: 'listening_monologue',
    name: 'Nghe: Nghe đoạn độc thoại/thông báo chọn đáp án (3 phương án)',
    expectedOptions: 3,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresAudioText: true,
    descriptionVi: 'Đoạn nói đơn thoại kèm câu hỏi nghe hiểu.',
  },

  // --- True / False Practice Formats ---
  read_true_false_2opt: {
    partType: 'read_true_false_2opt',
    category: 'true_false',
    name: 'Đọc: Đúng/Sai (2 phương án: 对 / 错)',
    expectedOptions: 2,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Câu nhận định đúng hoặc sai so với hình ảnh/ngữ nghĩa. Dùng trong luyện tập.',
  },
  listen_true_false_2opt: {
    partType: 'listen_true_false_2opt',
    category: 'true_false',
    name: 'Nghe: Đúng/Sai (2 phương án: 对 / 错)',
    expectedOptions: 2,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    requiresAudioText: true,
    descriptionVi: 'Nghe từ/câu và xác định đúng hay sai.',
  },

  // --- HSK 4-6 Advanced Formats ---
  listen_talks_qa_4opt: {
    partType: 'listen_talks_qa_4opt',
    category: 'listening_monologue',
    name: 'Nghe: Bài nói / Diễn thuyết chọn đáp án (4 phương án)',
    expectedOptions: 4,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresAudioText: true,
    descriptionVi: 'Nghe bài phát biểu, độc thoại hoặc phỏng vấn và trả lời câu hỏi.',
  },
  read_find_faulty_sentence_4opt: {
    partType: 'read_find_faulty_sentence_4opt',
    category: 'generic_mcq',
    name: 'Đọc: Bệnh cú — Tìm câu có lỗi ngữ pháp (HSK 6)',
    expectedOptions: 4,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    descriptionVi: 'Chọn câu mắc lỗi ngữ pháp trong 4 câu tiếng Trung.',
  },
  read_cloze_passages_4opt: {
    partType: 'read_cloze_passages_4opt',
    category: 'fill_blank',
    name: 'Đọc: Điền từ vào đoạn văn dài (HSK 5-6)',
    expectedOptions: 4,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Đoạn văn có nhiều chỗ trống, chọn nhóm từ kết hợp chuẩn xác.',
  },

  // --- Official Writing Formats ---
  write_sentence_from_picture_word: {
    partType: 'write_sentence_from_picture_word',
    category: 'writing_open_ended',
    name: 'Viết: Đặt câu theo tranh và từ khóa',
    expectedOptions: 0,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Nhìn tranh và từ khóa cho trước để đặt một câu hoàn chỉnh (0 phương án).',
  },
  write_short_essay_80chars: {
    partType: 'write_short_essay_80chars',
    category: 'writing_open_ended',
    name: 'Viết: Đoạn văn ngắn 80 chữ từ 5 từ cho trước',
    expectedOptions: 0,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Viết đoạn văn ngắn khoảng 80 chữ kết hợp 5 từ vựng cho trước (0 phương án).',
  },
  write_tianzige_from_pinyin: {
    partType: 'write_tianzige_from_pinyin',
    category: 'writing_open_ended',
    name: 'Viết: Nhìn pinyin viết chữ Hán vào điền từ',
    expectedOptions: 0,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Viết chữ Hán tương ứng với phiên âm pinyin vào chỗ trống.',
  },
  write_story_from_4pictures_100chars: {
    partType: 'write_story_from_4pictures_100chars',
    category: 'writing_open_ended',
    name: 'Viết: Kể chuyện theo 4 tranh (100 chữ)',
    expectedOptions: 0,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Quan sát 4 tranh liên hoàn và viết bài văn ngắn khoảng 100 chữ (0 phương án).',
  },
  write_topic_essay_200chars: {
    partType: 'write_topic_essay_200chars',
    category: 'writing_open_ended',
    name: 'Viết: Bài văn theo chủ đề (200 chữ)',
    expectedOptions: 0,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Viết bài văn nghị luận hoặc tự sự khoảng 200 chữ theo chủ đề (0 phương án).',
  },
  write_summary_shortening_400chars: {
    partType: 'write_summary_shortening_400chars',
    category: 'writing_open_ended',
    name: 'Viết: Tóm tắt bài văn 1000 chữ thành 400 chữ',
    expectedOptions: 0,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Đọc bài văn 1000 chữ và viết bài tóm tắt khoảng 400 chữ (0 phương án).',
  },
  write_topic_essay_300chars: {
    partType: 'write_topic_essay_300chars',
    category: 'writing_open_ended',
    name: 'Viết: Bài luận nghị luận xã hội (300 chữ)',
    expectedOptions: 0,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Viết bài văn nghị luận xã hội khoảng 300 chữ (0 phương án).',
  },
  write_component_assembly_6opt: {
    partType: 'write_component_assembly_6opt',
    category: 'generic_mcq',
    name: 'Viết: Ghép bộ thủ thành chữ Hán (6 phương án)',
    expectedOptions: 6,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Dạng bài ghép các nét/bộ thủ cho trước thành chữ Hán đúng (6 phương án).',
  },

  // --- Official Split & 3-opt Blueprint Formats ---
  listen_dialogue_qa_3opt: {
    partType: 'listen_dialogue_qa_3opt',
    category: 'listening_dialogue',
    name: 'Nghe: Hội thoại hỏi đáp 3 phương án (HSK 2)',
    expectedOptions: 3,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresAudioText: true,
    requiresSpokenTurns: true,
    descriptionVi: 'Nghe đoạn hội thoại ngắn 2 lượt lời và chọn đáp án trong 3 phương án.',
  },
  listen_dialogue_picture_match_split: {
    partType: 'listen_dialogue_picture_match_split',
    category: 'picture_matching',
    name: 'Nghe: Hội thoại ghép tranh (6 phương án tranh - HSK 2/3)',
    expectedOptions: 6,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresAudioText: true,
    requiresSpokenTurns: true,
    requiresVisual: true,
    descriptionVi: 'Nghe hội thoại và chọn tranh tương ứng từ ngân hàng 6 tranh A–F.',
  },
  read_sentence_matching_split: {
    partType: 'read_sentence_matching_split',
    category: 'dialogue_matching',
    name: 'Đọc: Ghép câu hỏi - đáp hội thoại chia phần (6 phương án - HSK 2)',
    expectedOptions: 6,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Ghép câu hoặc câu hỏi với câu đối ứng từ bảng 6 phương án A–F.',
  },
  read_dialogue_matching_split: {
    partType: 'read_dialogue_matching_split',
    category: 'dialogue_matching',
    name: 'Đọc: Ghép nối hội thoại chia phần (6 phương án - HSK 2)',
    expectedOptions: 6,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Ghép câu hoặc câu hỏi với câu đối ứng từ bảng 6 phương án A–F.',
  },
  read_paragraph_sentence_ordering: {
    partType: 'read_paragraph_sentence_ordering',
    category: 'generic_mcq',
    name: 'Đọc: Sắp xếp thứ tự câu thành đoạn văn (5 phương án - HSK 5)',
    expectedOptions: 5,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Sắp xếp các câu cho trước (A, B, C, D, E) theo thứ tự logic thành đoạn văn hoàn chỉnh.',
  },
  read_comprehension_passages_4opt: {
    partType: 'read_comprehension_passages_4opt',
    category: 'reading_comprehension',
    name: 'Đọc hiểu: Đoạn văn ngắn và vừa (4 phương án - HSK 4)',
    expectedOptions: 4,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresQuestionMarkStar: true,
    descriptionVi: 'Đoạn văn đọc hiểu HSK 4 kèm câu hỏi chọn đáp án đúng trong 4 phương án.',
  },
  read_comprehension_long_articles_4opt: {
    partType: 'read_comprehension_long_articles_4opt',
    category: 'reading_comprehension',
    name: 'Đọc hiểu: Bài đọc dài (4 phương án - HSK 5-6)',
    expectedOptions: 4,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresQuestionMarkStar: true,
    descriptionVi: 'Bài đọc dài học thuật/xã hội HSK 5-6 kèm câu hỏi 4 phương án.',
  },
  read_cloze_passage_sentence_insertion: {
    partType: 'read_cloze_passage_sentence_insertion',
    category: 'fill_blank',
    name: 'Đọc: Điền câu/cụm từ vào đoạn văn (4 phương án - HSK 4)',
    expectedOptions: 4,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Chọn câu hoặc nhóm từ điền vào vị trí thích hợp trong đoạn văn.',
  },
  read_fill_blank_word_bank_split: {
    partType: 'read_fill_blank_word_bank_split',
    category: 'fill_blank',
    name: 'Đọc: Điền từ vào chỗ trống từ ngân hàng từ chia phần (6 phương án - HSK 2)',
    expectedOptions: 6,
    requiresPlaceholder: true,
    requiresCompletedStem: true,
    descriptionVi: 'Điền từ thích hợp vào chỗ trống từ ngân hàng 6 từ A–F.',
  },
  read_comprehension_short_and_medium_3opt: {
    partType: 'read_comprehension_short_and_medium_3opt',
    category: 'reading_comprehension',
    name: 'Đọc hiểu ngắn và vừa (3 phương án - HSK 2/3)',
    expectedOptions: 3,
    requiresPlaceholder: false,
    prohibitsPlaceholder: true,
    requiresCompletedStem: false,
    requiresQuestionMarkStar: true,
    descriptionVi: 'Đọc đoạn văn ngắn hoặc vừa kèm câu hỏi ★ (3 phương án).',
  },
};

/**
 * Resolves the quality contract for a given part_type.
 * If not registered, falls back to intelligent category detection.
 */
export function getPartTypeContract(partType?: string): PartTypeContract {
  const normalized = String(partType || '').trim().toLowerCase();
  if (PART_TYPE_REGISTRY[normalized]) {
    return PART_TYPE_REGISTRY[normalized];
  }

  // Fallback heuristics:
  const isComprehension = /comprehension/i.test(normalized);
  const isFillBlank = /fill_blank|cloze/i.test(normalized);
  const isPicture = /picture_match/i.test(normalized);
  const isListening = /^listen_/i.test(normalized);
  const isTrueFalse = /2opt|true_false/i.test(normalized);
  const isWriting = /^write_/i.test(normalized);

  const optionMatch = normalized.match(/_(\d+)opt/i);
  const expectedOpts = optionMatch ? Number(optionMatch[1]) : (isTrueFalse ? 2 : 4);

  if (isWriting && !normalized.includes('6opt') && !normalized.includes('4opt') && !normalized.includes('3opt')) {
    return {
      partType: normalized,
      category: 'writing_open_ended',
      name: 'Viết tự luận (0 phương án)',
      expectedOptions: 0,
      requiresPlaceholder: false,
      requiresCompletedStem: false,
      descriptionVi: 'Dạng bài thi viết tự luận, không có phương án trắc nghiệm.',
    };
  }

  if (isComprehension) {
    return {
      partType: normalized || 'read_comprehension_short_3opt',
      category: 'reading_comprehension',
      name: `Đọc hiểu (${expectedOpts} phương án)`,
      expectedOptions: expectedOpts,
      requiresPlaceholder: false,
      prohibitsPlaceholder: true,
      requiresCompletedStem: false,
      requiresQuestionMarkStar: true,
      descriptionVi: 'Bài đọc hiểu đoạn văn kèm câu hỏi ★. Không có chỗ trống.',
    };
  }

  if (isFillBlank) {
    return {
      partType: normalized || 'read_fill_blank_4opt',
      category: 'fill_blank',
      name: `Điền từ (${expectedOpts} phương án)`,
      expectedOptions: expectedOpts,
      requiresPlaceholder: true,
      requiresCompletedStem: true,
      descriptionVi: 'Điền từ vào chỗ trống (____). Bắt buộc có completed_stem.',
    };
  }

  if (isTrueFalse) {
    return {
      partType: normalized || 'read_true_false_2opt',
      category: 'true_false',
      name: `Đúng/Sai (${expectedOpts} phương án)`,
      expectedOptions: 2,
      requiresPlaceholder: false,
      requiresCompletedStem: false,
      descriptionVi: 'Dạng câu hỏi Đúng/Sai (2 phương án).',
    };
  }

  return {
    partType: normalized || 'generic_mcq',
    category: 'generic_mcq',
    name: `Trắc nghiệm (${expectedOpts} phương án)`,
    expectedOptions: expectedOpts,
    requiresPlaceholder: false,
    requiresCompletedStem: false,
    descriptionVi: 'Dạng câu hỏi trắc nghiệm thông thường.',
  };
}

/**
 * Returns true if the part_type is a fill-in-the-blank type that requires placeholder substitution.
 */
export function isFillBlankPartType(partType?: string): boolean {
  return getPartTypeContract(partType).category === 'fill_blank';
}

/**
 * Returns true if the part_type is a reading comprehension type (passage + question).
 */
export function isReadingComprehensionPartType(partType?: string): boolean {
  return getPartTypeContract(partType).category === 'reading_comprehension';
}

/**
 * Returns true if the part_type is an open-ended writing task expecting 0 options.
 */
export function isOpenEndedWritingPartType(partType?: string): boolean {
  const cat = getPartTypeContract(partType).category;
  return cat === 'writing_open_ended' || cat === 'writing_make_sentence';
}
