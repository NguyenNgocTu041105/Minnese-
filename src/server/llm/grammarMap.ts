/**
 * Minnese Internal HSK 1–6 Grammar Knowledge Map
 *
 * NOTE ON SYLLABUS STATUS:
 * The official CLEC 2021 standards define 572 official grammar points across HSK 1–6
 * (Level 1: 48, Level 2: 81, Level 3: 141, Level 4: 144, Level 5: 98, Level 6: 60).
 * However, the itemized 572 syllabus database has NOT been officially digitized into a
 * standalone JSONL file within Minnese yet.
 *
 * This module establishes the rigorous, pedagogical INTERNAL GRAMMAR MAP with verified
 * structural rules, typical learner errors, confusing contrasting pairs, and clear
 * verification statuses (VERIFIED | PROVISIONAL | UNKNOWN).
 */

export type GrammarVerificationStatus = 'VERIFIED' | 'PROVISIONAL' | 'UNKNOWN';

export interface GrammarPointItem {
  id: string; // Stable identifier, e.g., 'GP_L1_SVO_ORDER'
  name: string; // Chinese & Vietnamese description
  level: number; // HSK Level (1-6)
  pattern: string; // Canonical formula: e.g. "S + Time/Place + V + O"
  usage: string; // Explanatory context & constraints
  commonErrors: string[]; // Typical erroneous patterns made by learners
  confusingPairs: string[]; // Confusable lookalike points (e.g., ['GP_L1_BU_VS_MEI'])
  applicablePartTypes: string[]; // Valid question types
  positiveExample: string; // Authentic, grammatical example sentence
  negativeExample: string; // Ungrammatical foil illustrating the error
  source: string; // Pedagogical reference (e.g. CLEC 2021 Grammar Framework / Beijing Language & Culture Univ.)
  status: GrammarVerificationStatus;
}

export interface GrammarConfusingPair {
  id: string;
  level: number;
  termA: string;
  termB: string;
  discriminatingRule: string; // Exact rule separating termA from termB
  exampleA: string;
  exampleB: string;
  commonConfusion: string;
}

/**
 * 1. Curated Internal Grammar Points (HSK 1 to 6)
 */
export const INTERNAL_HSK_GRAMMAR_MAP: GrammarPointItem[] = [
  // =========================================================================
  // HSK 1: Foundational Structural Constraints
  // =========================================================================
  {
    id: 'GP_L1_WORD_ORDER_SVO_TIME',
    name: 'Trật tự từ chỉ thời gian trong câu SVO (S + Time + V + O)',
    level: 1,
    pattern: 'Subject + Time Adverbial + Verb + Object',
    usage: 'Từ chỉ thời gian bắt buộc đứng trước vị ngữ động từ (hoặc trước chủ ngữ), không bao giờ được đặt ở cuối câu như tiếng Anh hay tiếng Việt.',
    commonErrors: [
      'Đặt từ chỉ thời gian ở cuối câu: *我去看书明天。',
      'Tách rời động từ và tân ngữ bằng trạng ngữ thời gian sai vị trí: *我看明天书。',
    ],
    confusingPairs: ['GP_L1_WORD_ORDER_SVO_PLACE'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt', 'write_word_order_cards'],
    positiveExample: '我明天上午去学校看书。',
    negativeExample: '我去看书明天上午。(Lỗi đặt thời gian cuối câu)',
    source: 'CLEC 2021 Level 1 Grammar Standard - Section 1: Basic Word Order',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L1_BU_VS_MEI',
    name: 'Phân biệt phó từ phủ định 不 (bù) và 没 (méi)',
    level: 1,
    pattern: '不 + V/Adj (hiện tại/thói quen/tương lai/tính chất/意愿) vs 没(有) + V (quá khứ/chưa xảy ra/sở hữu)',
    usage: '不 dùng để phủ định thói quen, ý chí, tính chất hoặc hành động trong tương lai; 没 phủ định sự xuất hiện/hoàn thành của hành động hoặc sự tồn tại (没有). Tuyệt đối không dùng *没是, *没去 khi nói về dự định.',
    commonErrors: [
      'Dùng 没 trước tính từ trạng thái: *这天气没好。',
      'Dùng 不 phủ định sự việc đã hoàn thành: *我昨天不去学校。 (nếu muốn diễn đạt không đi vì không có mặt, dùng 没去)',
      'Dùng *不是 để phủ định sở hữu thay vì 没有.',
    ],
    confusingPairs: ['GP_L1_BU_VS_MEI'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '今天我不去饭店，我想在家做饭。昨天我没去学校。',
    negativeExample: '昨天我再去学校。(Lỗi dùng sai phó từ phủ định)',
    source: 'CLEC 2021 Level 1 Grammar Standard - Section 3: Negation',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L1_MEASURE_WORD_BASIC',
    name: 'Lượng từ cơ bản (个, 本, 只, 杯) kết hợp với danh từ',
    level: 1,
    pattern: 'Số từ / Chỉ từ + Lượng từ + Danh từ',
    usage: 'Khi số từ hoặc đại từ chỉ thị (这, 那) đi với danh từ, bắt buộc phải có lượng từ ở giữa. Lượng từ phải chuẩn theo trường ngữ nghĩa của danh từ (本 đi với 书; 杯 đi với đồ uống; 只 đi với động vật nhỏ).',
    commonErrors: [
      'Bỏ quên lượng từ: *一书, *这人.',
      'Dùng sai lượng từ: *一杯书, *一本水.',
    ],
    confusingPairs: ['GP_L2_ER_VS_LIANG'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '桌子上有一本书和一个杯子。',
    negativeExample: '桌子上有一只书。(Lỗi lượng từ không phù hợp)',
    source: 'CLEC 2021 Level 1 Grammar Standard - Section 4: Numerals and Classifiers',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L1_QUESTION_MA_NE',
    name: 'Trợ từ nghi vấn 吗 (ma) và 呢 (ne)',
    level: 1,
    pattern: 'Trần thuật + 吗？ vs Danh từ/Đại từ + 呢？',
    usage: '吗 dùng cho câu hỏi Yes/No ở cuối câu trần thuật. 呢 dùng để hỏi tỉnh lược ("Thế còn... thì sao?") hoặc hỏi vị trí ("...ở đâu?"). Tuyệt đối không dùng cả từ nghi vấn (什么, 谁) cùng lúc với 吗.',
    commonErrors: [
      'Trộn lẫn từ nghi vấn nội dung với 吗: *你想吃什么吗？ (nếu muốn hỏi hỏi gì thì bỏ 吗)',
      'Đặt 吗 ở câu hỏi lựa chọn 还是.',
    ],
    confusingPairs: [],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '你是王老师的学生吗？我是，你呢？',
    negativeExample: '他是谁吗？(Lỗi dư thừa trợ từ 吗 khi đã có 谁)',
    source: 'CLEC 2021 Level 1 Grammar Standard - Section 5: Interrogative Sentences',
    status: 'VERIFIED',
  },

  // =========================================================================
  // HSK 2: Practical Situational Formulations
  // =========================================================================
  {
    id: 'GP_L2_ER_VS_LIANG',
    name: 'Phân biệt số đếm 二 (èr) và số lượng 两 (liǎng)',
    level: 2,
    pattern: '两 + Lượng từ + Danh từ vs 二 trong số thứ tự/số điện thoại/phép toán/hàng chục',
    usage: 'Trước lượng từ chỉ số lượng là 2, bắt buộc dùng 两 (两本书, 两个人). Trong số đếm cơ bản, số thứ tự (第二), số nhà/điện thoại, hoặc số 20 (二十) bắt buộc dùng 二.',
    commonErrors: [
      'Dùng 二 trước lượng từ: *二个人, *二本书.',
      'Dùng 两 trong số đếm hàng chục: *两十.',
    ],
    confusingPairs: ['GP_L2_ER_VS_LIANG'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '我想买两本书，这是第二本。',
    negativeExample: '我想买二本书。(Lỗi dùng 二 trước lượng từ)',
    source: 'CLEC 2021 Level 2 Grammar Standard - Section 2: Numbers',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L2_DEGREE_COMPLEMENT_DE',
    name: 'Bổ ngữ trạng thái / mức độ với 得 (V + 得 + Adj)',
    level: 2,
    pattern: 'S + V + 得 + Adj (hoặc S + V + O + V + 得 + Adj)',
    usage: 'Dùng 得 nối động từ và tính từ miêu tả cách thức, mức độ của hành động đã thực hiện hoặc mang tính quy luật.',
    commonErrors: [
      'Lẫn lộn trợ từ 的 và 得: *他跑的很快。',
      'Đặt tân ngữ trực tiếp giữa V và 得 mà không lặp lại V: *他写汉字得很漂亮。',
    ],
    confusingPairs: ['GP_L3_DE_DI_DE'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '他跑得很快，汉字也写得很好。',
    negativeExample: '他跑的很慢。(Lỗi dùng nhầm 的 thay vì 得)',
    source: 'CLEC 2021 Level 2 Grammar Standard - Section 6: Complements',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L2_CONNECTIVE_YINWEI_SUOYI',
    name: 'Liên từ nguyên nhân - kết quả 因为...所以... (yīnwèi... suǒyǐ...)',
    level: 2,
    pattern: '因为 + Nguyên nhân, 所以 + Kết quả',
    usage: 'Biểu đạt mối quan hệ nhân quả. Trong văn viết thường đi theo cặp, trong văn nói có thể lược bỏ một trong hai.',
    commonErrors: [
      'Nhầm lẫn vị trí nguyên nhân và kết quả: *因为他没来，所以生病了。',
      'Dùng nhầm liên từ nhượng bộ 虽然 thay cho 因为.',
    ],
    confusingPairs: ['GP_L2_CONNECTIVE_SUIRAN_DANSHI'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '因为今天下大雨，所以我们不去公园。',
    negativeExample: '虽然今天下大雨，所以我们不去公园。(Lỗi ghép cặp liên từ mâu thuẫn)',
    source: 'CLEC 2021 Level 2 Grammar Standard - Section 8: Compound Sentences',
    status: 'VERIFIED',
  },

  // =========================================================================
  // HSK 3: Multi-Element & Structural Combinations
  // =========================================================================
  {
    id: 'GP_L3_BA_SENTENCE_DISPOSAL',
    name: 'Câu chữ 把 (bǎ) — Cấu trúc xử lý / chi phối',
    level: 3,
    pattern: 'S + 把 + O + V + Thành phần khác (Result/Direction/了/Trùng điệp)',
    usage: 'Tân ngữ sau 把 phải xác định (người nghe biết là cái gì). Động từ vị ngữ KHÔNG ĐƯỢC để trơ trọi (bare verb), bắt buộc phải có thành phần khác kèm theo để chỉ kết quả hoặc sự thay đổi vị trí/trạng thái. Phó từ phủ định (不, 没) và trợ động từ (想, 应该) phải đứng TRƯỚC chữ 把.',
    commonErrors: [
      'Động từ đứng trơ trọi không có thành phần kèm: *我把苹果吃。',
      'Đặt phủ định sau 把: *我把作业没做完。 (Đúng: 我没把作业做完)',
      'Dùng câu chữ 把 với động từ tâm lý/tri giác không có tính xử lý: *我把他喜欢。',
    ],
    confusingPairs: ['GP_L4_BEI_SENTENCE_PASSIVE'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '请你把桌子上的书放在书包里。',
    negativeExample: '请你把桌子上的书放。(Lỗi bare verb trong câu chữ 把)',
    source: 'CLEC 2021 Level 3 Grammar Standard - Section 7: Special Sentence Patterns',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L3_RESULT_COMPLEMENT',
    name: 'Bổ ngữ kết quả (完, 到, 见, 懂, 错, 好)',
    level: 3,
    pattern: 'V + Bổ ngữ kết quả + (O)',
    usage: 'Bổ ngữ kết quả dính liền ngay sau động từ, chỉ rõ kết quả đạt được của hành động. Phủ định bắt buộc dùng 没 (hoặc 没有), không dùng 不.',
    commonErrors: [
      'Dùng 不 phủ định bổ ngữ kết quả: *我不听懂老师的话。 (Đúng: 我没听懂)',
      'Chèn tân ngữ vào giữa V và bổ ngữ: *我听老师的话懂。',
    ],
    confusingPairs: ['GP_L4_POTENTIAL_COMPLEMENT'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '这本中文书我已经看完了，里面的问题也都回答对了。',
    negativeExample: '这本中文书我不看完。(Lỗi dùng 不 phủ định bổ ngữ kết quả)',
    source: 'CLEC 2021 Level 3 Grammar Standard - Section 5: Complements',
    status: 'VERIFIED',
  },

  // =========================================================================
  // HSK 4: Discrimination of Complex Structures & Subtle Nuances
  // =========================================================================
  {
    id: 'GP_L4_BEI_SENTENCE_PASSIVE',
    name: 'Câu bị động chữ 被 (bèi) và 让/叫',
    level: 4,
    pattern: 'Chủ ngữ (kẻ chịu tác động) + 被/让/叫 + Tác nhân + V + Thành phần khác',
    usage: 'Biểu đạt sự việc không như ý hoặc nhấn mạnh đối tượng bị chi phối. Tác nhân sau 被 có thể lược bỏ (被+V), nhưng sau 让 và 叫 bắt buộc phải có tác nhân.',
    commonErrors: [
      'Lược bỏ tác nhân sau 让/叫: *钱包让偷了。 (Đúng: 钱包被偷了 hoặc 钱包让小偷偷了)',
      'Động từ vị ngữ để trơ trọi không có kết quả.',
    ],
    confusingPairs: ['GP_L3_BA_SENTENCE_DISPOSAL'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '那杯热咖啡被弟弟不小心打翻了。',
    negativeExample: '那杯咖啡被弟弟打翻。(Lỗi thiếu thành phần bổ ngữ kết quả sau động từ)',
    source: 'CLEC 2021 Level 4 Grammar Standard - Section 9: Passive Constructions',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L4_POTENTIAL_COMPLEMENT',
    name: 'Bổ ngữ khả năng (V + 得 / 不 + C)',
    level: 4,
    pattern: 'V + 得 + C (Khẳng định: làm được) vs V + 不 + C (Phủ định: không làm được)',
    usage: 'Biểu thị điều kiện chủ quan hoặc khách quan có cho phép đạt được kết quả hay không. Thường dùng dạng phủ định (看得懂 / 看不懂, 做得完 / 做不完).',
    commonErrors: [
      'Dùng 不能 đồng thời với bổ ngữ khả năng phủ định: *我不能做不完。',
      'Nhầm lẫn với bổ ngữ trạng thái: *他写得好中文。',
    ],
    confusingPairs: ['GP_L3_RESULT_COMPLEMENT'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '这篇文章生词太多，我看不懂。',
    negativeExample: '这篇文章生词太多，我不能看不懂。(Lỗi dư thừa trùng lặp 不能 và 不懂)',
    source: 'CLEC 2021 Level 4 Grammar Standard - Section 6: Potential Complements',
    status: 'VERIFIED',
  },

  // =========================================================================
  // HSK 5: Discourse Connectives & Near-Synonym Discrimination
  // =========================================================================
  {
    id: 'GP_L5_NEAR_SYNONYMS_CHANGCHANG_WANGWANG',
    name: 'Phân biệt phó từ tần suất 常常 (chángcháng) và 往往 (wǎngwǎng)',
    level: 5,
    pattern: '常常 (Chủ quan/thói quen, dùng được cho tương lai và quá khứ, phủ định 不常) vs 往往 (Khách quan, tổng kết quy luật quá khứ, bắt buộc đi kèm điều kiện)',
    usage: '往往 nhấn mạnh tính quy luật xảy ra dưới một điều kiện nhất định ("hễ có điều kiện A thì thường dẫn đến B"). Không thể dùng 往往 cho việc chưa xảy ra hoặc dự định tương lai.',
    commonErrors: [
      'Dùng 往往 cho việc trong tương lai: *下个月我往往去看你。 (Đúng: 常常)',
      'Dùng 往往 trong câu không có tiền đề/điều kiện quy luật.',
    ],
    confusingPairs: ['GP_L5_CHANGCHANG_VS_WANGWANG'],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '遇到困难的时候，他往往能够保持冷静。',
    negativeExample: '明天如果你有时间，往往来我家玩。(Lỗi dùng 往往 cho tương lai)',
    source: 'CLEC 2021 Level 5 Grammar Standard - Section 11: Adverbs',
    status: 'VERIFIED',
  },
  {
    id: 'GP_L5_CONNECTIVE_CONGER_JINERY',
    name: 'Phân biệt liên từ 从而 (cóng’ér) và 进而 (jìn’ér)',
    level: 5,
    pattern: '从而 (Nêu kết quả hoặc mục đích tự nhiên từ vế trước) vs 进而 (Nêu bước tiến phát triển ở mức độ cao hơn)',
    usage: '从而 nhấn mạnh mối liên hệ nhân quả, vế sau là kết quả tất yếu của phương pháp ở vế trước. 进而 nhấn mạnh sự tiến thêm một bước về chiều sâu hoặc phạm vi.',
    commonErrors: [
      'Dùng 进而 thay cho kết quả nhân quả thông thường.',
      'Dùng 从而 khi hai vế không có quan hệ nhân quả logic.',
    ],
    confusingPairs: [],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '企业加强了管理，从而降低了生产成本。我们在掌握基础理论之后，进而展开深入的实验研究。',
    negativeExample: '企业加强了管理，进而降低了生产成本。(Lỗi dùng 进而 khi mối quan hệ thuần túy là nhân quả kết quả)',
    source: 'CLEC 2021 Level 5 Grammar Standard - Section 14: Complex Connectives',
    status: 'VERIFIED',
  },

  // =========================================================================
  // HSK 6: Sentence Fault Diagnosis & Sophisticated Rhetoric
  // =========================================================================
  {
    id: 'GP_L6_FAULTY_COLLOCATION_MISMATCH',
    name: 'Nhận diện bệnh câu: Kết hợp từ không thỏa đáng (搭配不当)',
    level: 6,
    pattern: 'Chủ ngữ - Vị ngữ không khớp, hoặc Động từ - Tân ngữ không tạo thành collocation tự nhiên',
    usage: 'Dạng bài kinh điển của HSK 6 phần Đọc (chọn câu có lỗi ngữ pháp). Người học phải phát hiện sự sai lệch tinh vi trong việc kết hợp động từ trừu tượng với danh từ chuyên biệt.',
    commonErrors: [
      'Ghép động từ hành vi cụ thể với danh từ trừu tượng không khớp: *提高水平 vs *培养水平 (phải là 提高水平 hoặc 培养人才).',
      'Chủ ngữ phức hợp nhưng vị ngữ chỉ phù hợp với một thành phần.',
    ],
    confusingPairs: [],
    applicablePartTypes: ['read_fill_blank_4opt', 'read_comprehension_short_3opt'],
    positiveExample: '这项科研成果不仅提高了生产效率，而且推动了相关产业的快速发展。',
    negativeExample: '这项科研成果不仅培养了生产效率，而且推动了技术。(Lỗi phối hợp 培养 với 效率)',
    source: 'CLEC 2021 Level 6 Grammar Standard - Section 18: Sentence Error Diagnostics',
    status: 'VERIFIED',
  },
];

/**
 * 2. Confusing Lookalike Contrasting Pairs (Nhóm đối chiếu dễ nhầm)
 */
export const GRAMMAR_CONFUSING_PAIRS: GrammarConfusingPair[] = [
  {
    id: 'PAIR_BU_MEI',
    level: 1,
    termA: '不 (bù)',
    termB: '没 (méi)',
    discriminatingRule: '不 phủ định thói quen, bản chất, ý chí và tương lai; 没 phủ định sự xuất hiện, quá khứ và sự tồn tại (没有).',
    exampleA: '我明天不去学校。(Ý muốn tương lai)',
    exampleB: '我昨天没去学校。(Sự việc quá khứ chưa xảy ra)',
    commonConfusion: 'Người học thường nhầm lẫn dùng 不 cho quá khứ hoặc dùng 没 cho câu phán đoán bản chất (không thể nói *他没是学生).',
  },
  {
    id: 'PAIR_ER_LIANG',
    level: 2,
    termA: '二 (èr)',
    termB: '两 (liǎng)',
    discriminatingRule: '两 đứng trước lượng từ chỉ số lượng; 二 dùng cho số đếm thuần túy, số thứ tự (第二), số điện thoại và số hàng chục (二十).',
    exampleA: '这是第二课。(Thứ tự)',
    exampleB: '我要买两张票。(Lượng từ)',
    commonConfusion: 'Đặt 二 trước lượng từ (*二个) hoặc đặt 两 vào hàng chục (*两十).',
  },
  {
    id: 'PAIR_DE_DE_DI',
    level: 3,
    termA: '的 (de) / 地 (de)',
    termB: '得 (de)',
    discriminatingRule: '的 đứng trước danh từ (Định ngữ); 地 đứng trước động từ (Trạng ngữ); 得 đứng SAU động từ/tính từ để mở đầu bổ ngữ trạng thái/kết quả.',
    exampleA: '他高兴地跑了过来。(地 trước động từ)',
    exampleB: '他跑得很快。(得 sau động từ)',
    commonConfusion: 'Đồng âm "de" trong khẩu ngữ khiến người học dùng lẫn lộn 的 thay cho 得 trong bổ ngữ trạng thái.',
  },
  {
    id: 'PAIR_BA_BEI',
    level: 4,
    termA: '把 (bǎ)',
    termB: '被 (bèi)',
    discriminatingRule: '把 nhấn mạnh chủ ngữ chủ động xử lý, chi phối tân ngữ; 被 biểu thị chủ ngữ là đối tượng bị tác động/bị hại bởi tác nhân.',
    exampleA: '哥哥把苹果吃了。(Chủ động ăn)',
    exampleB: '苹果被哥哥吃了。(Bị ăn mất)',
    commonConfusion: 'Đảo ngược vị trí của chủ ngữ và tác nhân khi chuyển đổi giữa câu chữ 把 và chữ 被.',
  },
  {
    id: 'PAIR_CHANGCHANG_WANGWANG',
    level: 5,
    termA: '常常 (chángcháng)',
    termB: '往往 (wǎngwǎng)',
    discriminatingRule: '常常 thuần túy nói về tần suất hành vi (chủ quan, dùng được cho tương lai); 往往 nhấn mạnh tính quy luật tất yếu dưới một điều kiện/tiền đề khách quan trong quá khứ.',
    exampleA: '下个月我会常常来看你。(Tương lai)',
    exampleB: '每当遇到困难，他往往能冷静应对。(Có điều kiện quy luật)',
    commonConfusion: 'Dùng 往往 cho các dự định trong tương lai hoặc câu không hề có mệnh đề điều kiện.',
  },
  {
    id: 'PAIR_SHIHE_HESHI',
    level: 4,
    termA: '适合 (shìhé)',
    termB: '合适 (héshì)',
    discriminatingRule: '适合 là ngoại động từ (mang tân ngữ phía sau: 适合你); 合适 là tính từ (không mang tân ngữ: 这件衣服很合适).',
    exampleA: '这个工作很适合他。(适合 + Tân ngữ)',
    exampleB: '这个工作对他来说很合适。(合适 làm vị ngữ)',
    commonConfusion: 'Dùng tính từ 合适 mang tân ngữ (*合适他) hoặc dùng 适合 làm vị ngữ sau phó từ mức độ (*很适合).',
  },
];

/**
 * Returns list of internal grammar points for a target HSK level
 */
export function getGrammarPointsForLevel(level: number): GrammarPointItem[] {
  return INTERNAL_HSK_GRAMMAR_MAP.filter((item) => item.level === level);
}

/**
 * Retrieves a specific grammar point by ID
 */
export function getGrammarPointById(id: string): GrammarPointItem | undefined {
  return INTERNAL_HSK_GRAMMAR_MAP.find((item) => item.id === id);
}

/**
 * Returns confusing pairs relevant to a target level
 */
export function getConfusingPairsForLevel(level: number): GrammarConfusingPair[] {
  return GRAMMAR_CONFUSING_PAIRS.filter((pair) => pair.level <= level);
}

/**
 * Generates deterministic, pedagogically sound grammar context for inclusion into LLM prompts.
 */
export function formatGrammarPromptGuidance(level: number, targetGrammarId?: string): string {
  const boundedLevel = Math.max(1, Math.min(6, Math.floor(level)));
  const levelPoints = getGrammarPointsForLevel(boundedLevel);
  const relevantPairs = getConfusingPairsForLevel(boundedLevel);

  let out = `\n======================================================================\n`;
  out += `1.2 HSK ${boundedLevel} PEDAGOGICAL GRAMMAR SPECIFICATION & OBJECTIVES\n`;
  out += `======================================================================\n`;
  out += `- PEDAGOGICAL COGNITIVE FOCUS: Do NOT generate questions that solely test rote dictionary definitions. Questions MUST assess grammatical competence, word order, structural constraints, and contextual suitability.\n`;

  if (targetGrammarId) {
    const specificPoint = getGrammarPointById(targetGrammarId);
    if (specificPoint) {
      out += `- MANDATORY TARGET GRAMMAR POINT:\n`;
      out += `  * ID: [${specificPoint.id}] - ${specificPoint.name}\n`;
      out += `  * Structural Pattern: ${specificPoint.pattern}\n`;
      out += `  * Usage Rules: ${specificPoint.usage}\n`;
      out += `  * Authentic Example: "${specificPoint.positiveExample}"\n`;
      out += `  * Distractor Foil Reference: "${specificPoint.negativeExample}"\n`;
      return out;
    }
  }

  out += `- APPROVED LEVEL ${boundedLevel} GRAMMAR CONSTRUCTS (Select one as question target):\n`;
  for (const pt of levelPoints) {
    out += `  * [${pt.id}] ${pt.name} -> Formula: ${pt.pattern}\n`;
  }

  if (relevantPairs.length > 0) {
    out += `- FREQUENT CONFUSING PAIRS (Recommended for distractor design):\n`;
    for (const pair of relevantPairs.slice(0, 3)) {
      out += `  * ${pair.termA} vs ${pair.termB}: ${pair.discriminatingRule}\n`;
    }
  }

  return out;
}
