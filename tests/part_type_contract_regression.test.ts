import { describe, it, expect } from 'vitest';
import { pinyin as getPinyinPro } from 'pinyin-pro';
import { generateAccuratePinyin } from '../src/utils/pinyinEngine.js';
import {
  validateCandidate,
  validateQuestionLanguageQuality,
  evaluateBlindSolveHeuristic,
} from '../src/server/llm/questionValidator.js';
import {
  getPartTypeContract,
  isFillBlankPartType,
  isReadingComprehensionPartType,
} from '../src/server/llm/partTypeContract.js';

describe('Part-Type Contract & Quality Gates Regression Matrix', () => {
  describe('Fill-in-the-Blank (read_fill_blank_4opt)', () => {
    const validFillBlank = {
      stem: '我想喝____。',
      completed_stem: '我想喝水。',
      options: ['水', '苹果', '飞机', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'wǒ xiǎng hē shuǐ .',
      explanation_vi: 'Đáp án đúng: 水 (nước). Uống nước là kết hợp chuẩn xác trong tiếng Hán.\n- Phân tích phương án nhiễu: 苹果 (táo) là đồ ăn, không dùng với 喝. 飞机 (máy bay) là phương tiện. 医生 (bác sĩ) là nghề nghiệp.',
      naturalness_review: {
        status: 'natural' as const,
        rationale_vi: 'Câu hoàn chỉnh tự nhiên, đúng ngữ pháp tiếng Hán HSK 1.',
      },
    };

    it('passes language quality with canonical completed stem', () => {
      const errors = validateQuestionLanguageQuality(validFillBlank);
      expect(errors).toEqual([]);
    });

    it('rejects candidate when model keeps placeholder in completed_stem', () => {
      const invalid = {
        ...validFillBlank,
        completed_stem: '我想喝____。',
      };
      const errors = validateQuestionLanguageQuality(invalid);
      expect(errors.some((e) => e.includes('unreplaced blank placeholder'))).toBe(true);
    });

    it('rejects candidate when model hallucinates extra words into completed_stem', () => {
      const invalid = {
        ...validFillBlank,
        completed_stem: '我想喝很多热茶水。',
      };
      const errors = validateQuestionLanguageQuality(invalid);
      expect(errors.some((e) => e.includes('adds content beyond the exact answer_idx option substitution'))).toBe(true);
    });

    it('rejects candidate when fill-blank stem is missing placeholder', () => {
      const invalid = {
        ...validFillBlank,
        stem: '我想喝水。',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('requires exactly one blank placeholder'))).toBe(true);
    });
  });

  describe('Reading Comprehension (read_comprehension_short_3opt)', () => {
    const compStem = '今天天气很好，我和朋友一起去公园。★ 我们去哪里？';
    const validComprehension = {
      stem: compStem,
      options: ['学校', '公园', '医院'],
      answer_idx: 1,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_comprehension_short_3opt',
      pinyin: generateAccuratePinyin(compStem),
      explanation_vi: 'Đáp án đúng: 公园 (công viên). Đoạn văn nêu rõ "我和朋友一起去公园".\n- Phân tích phương án nhiễu: 学校 (trường học) không được nhắc đến. 医院 (bệnh viện) là nơi khám bệnh, không có trong ngữ cảnh.',
      naturalness_review: {
        status: 'natural' as const,
        rationale_vi: 'Câu hỏi đọc hiểu tự nhiên, rõ ràng, phù hợp trình độ HSK 1.',
      },
    };

    it('passes language quality without requiring blank placeholder or completed_stem substitution', () => {
      const errors = validateQuestionLanguageQuality(validComprehension);
      expect(errors).toEqual([]);
    });

    it('rejects reading comprehension if placeholder is present in stem', () => {
      const invalid = {
        ...validComprehension,
        stem: '今天天气很好，我和朋友一起去____。★ 我们去哪里？',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must not contain blank placeholders'))).toBe(true);
    });

    it('rejects reading comprehension if question star ★ is missing', () => {
      const invalid = {
        ...validComprehension,
        stem: '今天天气很好，我和朋友一起去公园。我们去哪里？',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('requires a question marked with ★'))).toBe(true);
    });

    it('rejects reading comprehension if statement is shorter than 6 Hanzi', () => {
      const invalid = {
        ...validComprehension,
        stem: '去公园。★ 去哪儿？',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('statement must contain at least 6 Hanzi'))).toBe(true);
    });
  });

  describe('Context Sufficiency & Single-Answer Unambiguity', () => {
    it('accepts short stem with decisive collocation constraint (e.g. 喝/水 or classifier 只/猫)', () => {
      const strongCollocation = {
        stem: '我想喝____。',
        options: ['水', '苹果', '飞机', '桌子'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      const evalResult = evaluateBlindSolveHeuristic(strongCollocation);
      expect(evalResult.hasAmbiguity).toBe(false);
    });

    it('rejects underspecified stem that allows multiple natural answers (e.g. 我看____)', () => {
      const ambiguousQuestion = {
        stem: '我看____。',
        options: ['书', '电影', '电视', '报纸'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      const evalResult = evaluateBlindSolveHeuristic(ambiguousQuestion);
      expect(evalResult.hasAmbiguity).toBe(true);
      expect(evalResult.reason).toContain('Underspecified');
    });

    it('rejects reading comprehension question when statement does not provide enough context', () => {
      const insufficientPassage = {
        stem: '他走了。★ 他去哪儿？',
        options: ['学校', '商店', '医院'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_comprehension_short_3opt',
      };
      const evalResult = evaluateBlindSolveHeuristic(insufficientPassage);
      expect(evalResult.hasAmbiguity).toBe(true);
    });
  });

  describe('Distractor Rationales Standardization & Cross-Contamination Guard', () => {
    const validMCQ = {
      stem: '桌子上有三____书。',
      completed_stem: '桌子上有三本书。',
      options: ['本', '个', '只', '块'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Đáp án đúng: 本 (quyển). Lượng từ dùng cho sách vở là 本.\n- Phân tích phương án nhiễu: 个 (cái) là lượng từ chung, không đi với 书. 只 (con) dùng cho động vật. 块 (miếng) dùng cho đồng hồ, bánh, không đi với 书.',
      distractor_rationales: [
        {
          option_idx: 1,
          option_text: '个',
          rationale_vi: '个 là lượng từ chung, không dùng đi kèm danh từ 书 trong chuẩn mực ngữ pháp.',
        },
        {
          option_idx: 2,
          option_text: '只',
          rationale_vi: '只 là lượng từ chuyên dùng cho động vật nhỏ, không thể đi cùng với 书.',
        },
        {
          option_idx: 3,
          option_text: '块',
          rationale_vi: '块 là lượng từ dùng cho vật dạng miếng hoặc tiền bạc, không thích hợp với 书.',
        },
      ],
    };

    it('passes validation when distractor rationales are strictly 1:1, non-empty, and unmixed', () => {
      const res = validateCandidate(validMCQ, [], { requireDistractorRationales: true });
      expect(res.errors).toEqual([]);
    });

    it('rejects distractor rationale referencing the correct answer index', () => {
      const invalid = {
        ...validMCQ,
        distractor_rationales: [
          {
            option_idx: 0, // CORRECT ANSWER INDEX!
            option_text: '本',
            rationale_vi: '本 là lượng từ đúng nhưng bị ghi nhầm vào danh sách nhiễu.',
          },
          {
            option_idx: 1,
            option_text: '个',
            rationale_vi: '个 là lượng từ chung, không dùng đi kèm danh từ 书 trong ngữ pháp.',
          },
          {
            option_idx: 2,
            option_text: '只',
            rationale_vi: '只 là lượng từ chuyên dùng cho động vật nhỏ, không thể dùng cho 书.',
          },
        ],
      };
      const res = validateCandidate(invalid, [], { requireDistractorRationales: true });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must not reference the correct answer'))).toBe(true);
    });

    it('rejects distractor rationale when option_text mismatches option at option_idx', () => {
      const invalid = {
        ...validMCQ,
        distractor_rationales: [
          {
            option_idx: 1,
            option_text: '只', // Options[1] is '个', not '只'
            rationale_vi: '只 là lượng từ động vật, không thể đi cùng với danh từ sách vở.',
          },
          {
            option_idx: 2,
            option_text: '只',
            rationale_vi: '只 là lượng từ chuyên dùng cho động vật nhỏ, không dùng cho sách.',
          },
          {
            option_idx: 3,
            option_text: '块',
            rationale_vi: '块 là lượng từ dùng cho vật dạng miếng hoặc tiền bạc, không hợp với sách.',
          },
        ],
      };
      const res = validateCandidate(invalid, [], { requireDistractorRationales: true });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must exactly match options[option_idx]'))).toBe(true);
    });

    it('rejects cross-contamination when a rationale mentions a different distractor option', () => {
      const contaminated = {
        ...validMCQ,
        distractor_rationales: [
          {
            option_idx: 1,
            option_text: '个',
            rationale_vi: '个 không đúng vì đây phải dùng 只 hoặc từ khác cho động vật.', // Mentions '只' which is option 2!
          },
          {
            option_idx: 2,
            option_text: '只',
            rationale_vi: '只 là lượng từ chuyên dùng cho động vật nhỏ, không thể dùng cho 书.',
          },
          {
            option_idx: 3,
            option_text: '块',
            rationale_vi: '块 là lượng từ dùng cho vật dạng miếng hoặc tiền bạc, hoàn toàn không thích hợp.',
          },
        ],
      };
      const res = validateCandidate(contaminated, [], { requireDistractorRationales: true });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('mentions a different option text'))).toBe(true);
    });
  });

  describe('HSK 2/3 Listening & Anti-Hallucination Quality Gates', () => {
    it('rejects listening question with fill-in-the-blank placeholder (____)', () => {
      const invalid = {
        stem: '他们正在____呢。',
        options: ['吃饭', '看书', '睡觉'],
        answer_idx: 0,
        level: 2,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_picture_match_split',
        explanation_vi: 'Đáp án đúng: 吃饭.\n- Phân tích phương án nhiễu: 看书, 睡觉.',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must not contain fill-in-the-blank placeholders'))).toBe(true);
    });

    it('rejects dialogue listening question missing speaker turns', () => {
      const invalid = {
        stem: '今天天气真好，我们一起去公园散步吧。★ 他们要去哪里？',
        options: ['公园', '学校', '医院'],
        answer_idx: 0,
        level: 2,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_picture_match_split',
        explanation_vi: 'Đáp án đúng: 公园.\n- Phân tích phương án nhiễu: 学校, 医院.',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('requires speaker turns'))).toBe(true);
    });

    it('rejects hallucinated duplicate stutter words in options', () => {
      const invalid = {
        stem: '男：你想做什么？\n女：我想去踢足球。★ 女的想做什么？',
        options: ['足球足球', '看电影', '去商店'],
        answer_idx: 0,
        level: 2,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_short_3opt',
        explanation_vi: 'Đáp án đúng: 踢足球.\n- Phân tích phương án nhiễu: 看电影, 去商店.',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('unnatural duplicate stuttering'))).toBe(true);
    });

    it('rejects stacked/duplicated measure words like 两部部 or 两件件', () => {
      const invalid = {
        stem: '男：你买了什么？\n女：我买了两部手机。★ 女的买了什么？',
        options: ['两部部', '两本书', '衣服'],
        answer_idx: 0,
        level: 2,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_short_3opt',
        explanation_vi: 'Đáp án đúng: 两部手机.\n- Phân tích phương án nhiễu: 两本书, 衣服.',
      };
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('stacked/duplicated measure words'))).toBe(true);
    });

    it('rejects listen_talks_qa_4opt with blanks and short elementary stem at HSK 6 (user reported bug)', () => {
      const invalidH6Listening = {
        stem: '这家餐厅的服务态度非常好，____我们点了那么多菜。',
        options: ['然而', '但是', '因此', '不过'],
        answer_idx: 2,
        level: 6,
        skill: 'listening' as const,
        part_type: 'listen_talks_qa_4opt',
        explanation_vi: 'Đáp án đúng là 因此. Phù hợp quan hệ nhân quả.',
      };
      const res = validateCandidate(invalidH6Listening);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must not contain blank placeholders'))).toBe(true);
      expect(res.errors.some((e) => e.includes('Monologue listening task'))).toBe(true);
      expect(res.errors.some((e) => e.includes('minimum level difficulty'))).toBe(true);
    });

    it('correctly generates accurate Pinyin for Chinese sentences avoiding LLM hallucinations', async () => {
      const { generateAccuratePinyin } = await import('../src/utils/pinyinEngine.js');
      const sentence = '这家餐厅的服务态度非常好，我们点了那么多菜。';
      const pinyin = generateAccuratePinyin(sentence);
      expect(pinyin).toContain('zhè jiā cān tīng de fú wù tài dù fēi cháng hǎo');
      expect(pinyin).not.toContain('dù tǐ');
      expect(pinyin).not.toContain('hěn hǎo kān');
    });
  });
});
