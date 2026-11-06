import { describe, it, expect } from 'vitest';
import { normalizeQuestionAliases } from '../src/server/llm/jsonParser.js';
import {
  validateCandidate,
  validateQuestionLanguageQuality,
  validateClassifierNounCollocation,
  validateSemanticPragmaticCollocation,
  evaluateCandidateSixGates,
  HSK_CLASSIFIER_NOUN_MAP,
} from '../src/server/llm/questionValidator.js';

describe('Adversarial Challenger: Stress-Testing completed_stem & Classifier/Semantic Validation', () => {

  // =========================================================================
  // 1. Malformed and Unusual Placeholders in Stem
  // =========================================================================
  describe('1. Malformed & Unusual Placeholders in Stem', () => {
    it('1.1 Multiple blanks in a single stem: canonical replaces first, remainder flagged as error', () => {
      const raw = {
        stem: '我有____，他有____。',
        options: ['一本书', '两个苹果', '三支笔', '四件衣服'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
      expect(parsed).not.toBeNull();
      // Replace only substitutes the first placeholder because pattern lacks /g
      expect(parsed!.canonical_completed_stem).toBe('我有一本书，他有____。');
      
      // Validator must flag the remaining placeholder
      const val = validateCandidate(parsed!);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes('completed_stem contains unreplaced blank placeholder'))).toBe(true);
    });

    it('1.2 Single underscore placeholder: blankPattern requires _{2,}, so single underscore is unreplaced and unflagged', () => {
      const raw = {
        stem: '我有_支笔。',
        options: ['一', '二', '三', '四'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
      expect(parsed).not.toBeNull();
      // Empirical observation: String.replace(blankPattern, ...) leaves single '_' intact
      expect(parsed!.canonical_completed_stem).toBe('我有_支笔。');

      // Furthermore, completedBlankPattern also uses _{2,}, so single '_' is NOT flagged as an unreplaced blank!
      const errors = validateQuestionLanguageQuality(parsed!);
      expect(errors.some((e) => e.includes('completed_stem contains unreplaced blank placeholder'))).toBe(false);
    });

    it('1.3 Bracketed placeholders: handles full-width parens, half-width parens, brackets', () => {
      const brackets = [
        '（____）',
        '（   ）',
        '（）',
        '(____)',
        '(   )',
        '()',
        '【____】',
        '【   】',
        '【】',
        '[____]',
        '[   ]',
        '[]',
      ];

      for (const bracket of brackets) {
        const raw = {
          stem: `我想买一${bracket}书。`,
          options: ['本', '个', '只', '张'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        };
        const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
        expect(parsed).not.toBeNull();
        expect(parsed!.canonical_completed_stem).toBe('我想买一本书。');
        expect(parsed!.completed_stem).toBe('我想买一本书。');
      }
    });

    it('1.4 Placeholder at start and end of stem: correctly replaced', () => {
      const rawStart = {
        stem: '____是一本书。',
        options: ['这', '那', '哪', '谁'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const parsedStart = normalizeQuestionAliases(rawStart, 1, 'reading', false);
      expect(parsedStart!.canonical_completed_stem).toBe('这是一本书。');

      const rawEnd = {
        stem: '我的老师是____',
        options: ['李老师', '王医生', '学生', '朋友'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const parsedEnd = normalizeQuestionAliases(rawEnd, 1, 'reading', false);
      expect(parsedEnd!.canonical_completed_stem).toBe('我的老师是李老师');
    });

    it('1.5 Fifty consecutive underscores: cleanly matched and replaced without regex DoS or memory issues', () => {
      const longBlank = '_'.repeat(50);
      const raw = {
        stem: `这${longBlank}茶很好喝。`,
        options: ['杯', '本', '只', '张'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
      expect(parsed!.canonical_completed_stem).toBe('这杯茶很好喝。');
    });

    it('1.6 No placeholder in fill-in-blank stem: String.replace returns original stem, completed_stem equals stem', () => {
      const raw = {
        stem: '我想喝茶。',
        options: ['茶', '水', '咖啡', '牛奶'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
      expect(parsed).not.toBeNull();
      // Because isFillBlankPartType is true, replace runs, doesn't match, and returns stem unchanged
      expect(parsed!.canonical_completed_stem).toBe('我想喝茶。');
      expect(parsed!.completed_stem).toBe('我想喝茶。');
    });
  });

  // =========================================================================
  // 2. Option Index Boundaries & Malformed Options
  // =========================================================================
  describe('2. Option Index Boundaries & Malformed Options', () => {
    it('2.1 Negative answer_idx (-1): safe fallback, no crash', () => {
      const raw = {
        stem: '我有三____笔。',
        options: ['支', '本', '只', '张'],
        answer_idx: -1,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
      expect(parsed).not.toBeNull();
      // Out of bounds -> canonical_completed_stem is undefined
      expect(parsed!.canonical_completed_stem).toBeUndefined();

      const errors: string[] = [];
      const warnings: string[] = [];
      expect(() => validateClassifierNounCollocation(parsed!, errors, warnings)).not.toThrow();

      const val = validateCandidate(parsed!);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => /answer_idx/i.test(e))).toBe(true);
    });

    it('2.2 answer_idx out of bounds (options.length and 999): safe fallback, no crash', () => {
      for (const badIdx of [4, 999]) {
        const raw = {
          stem: '我有三____笔。',
          options: ['支', '本', '只', '张'],
          answer_idx: badIdx,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        };
        const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
        expect(parsed!.canonical_completed_stem).toBeUndefined();

        const errors: string[] = [];
        const warnings: string[] = [];
        expect(() => validateClassifierNounCollocation(parsed!, errors, warnings)).not.toThrow();

        const val = validateCandidate(parsed!);
        expect(val.valid).toBe(false);
        expect(val.errors.some((e) => /answer_idx/i.test(e))).toBe(true);
      }
    });

    it('2.3 Non-integer or non-numeric answer_idx: safe handling without crashing', () => {
      const nonInts = [1.5, NaN, null, undefined, '0' as any];
      for (const badIdx of nonInts) {
        const raw = {
          stem: '我有三____笔。',
          options: ['支', '本', '只', '张'],
          answer_idx: badIdx,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        };
        const parsed = normalizeQuestionAliases(raw, 1, 'reading', false);
        expect(parsed).not.toBeNull();
        const errors: string[] = [];
        expect(() => validateClassifierNounCollocation(parsed!, errors, [])).not.toThrow();
        expect(() => validateSemanticPragmaticCollocation(parsed!, errors, [])).not.toThrow();
        expect(() => validateCandidate(parsed!)).not.toThrow();
      }
    });

    it('2.4 Defensive Guard: validateClassifierNounCollocation safely handles non-string option without TypeError', () => {
      const candidateWithNumericOption = {
        stem: '我有三____笔。',
        options: ['支', 123 as any, '只', '张'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      const errors: string[] = [];

      expect(() => validateClassifierNounCollocation(candidateWithNumericOption, errors, [])).not.toThrow();

      const val = validateCandidate(candidateWithNumericOption);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => /option/i.test(e))).toBe(true);
    });
  });

  // =========================================================================
  // 3. Multiple Classifiers and Nouns in a Single Sentence
  // =========================================================================
  describe('3. Multiple Classifiers & Nouns in a Single Sentence', () => {
    it('3.1 Blank before filled classifier: 桌子上有两____书和三支笔 (Target is 书)', () => {
      // Slot 1: 两____书 (Target noun is 书, valid: 本, 部, 套)
      // Slot 2: 三支笔 (Already filled with standard classifier 支)
      const qValid = {
        stem: '桌子上有两____书和三支笔。',
        options: ['本', '个', '只', '张'],
        answer_idx: 0, // '本' is valid for '书'
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là 本 dùng cho sách.',
      };
      const errorsValid: string[] = [];
      validateClassifierNounCollocation(qValid, errorsValid, []);
      expect(errorsValid).toHaveLength(0);

      // What if option selected is '支' (which is valid for 笔, but invalid for 书)?
      const qInvalid = {
        stem: '桌子上有两____书和三支笔。',
        options: ['支', '个', '只', '张'],
        answer_idx: 0, // '支' selected for '两____书'
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là 支.',
      };
      const errorsInvalid: string[] = [];
      validateClassifierNounCollocation(qInvalid, errorsInvalid, []);
      expect(
        errorsInvalid.some((e) =>
          e.includes("Invalid classifier collocation: '支' is not a standard classifier for '书'")
        )
      ).toBe(true);
    });

    it('3.2 Filled classifier before blank: 桌子上有三支笔和两____书 (Target is 书)', () => {
      // Slot 1: 三支笔 (Filled)
      // Slot 2: 两____书 (Blank target)
      // The regex skips 三支笔 because there is no blank between 三 and 笔
      const q = {
        stem: '桌子上有三支笔和两____书。',
        options: ['本', '张', '只', '个'],
        answer_idx: 0, // '本'
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là 本 dùng cho sách.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      // Should match 书, not 笔, and succeed with 本
      expect(errors).toHaveLength(0);

      // If wrong classifier chosen for 书:
      const qWrong = {
        ...q,
        options: ['只', '张', '条', '架'],
        answer_idx: 0, // '只'
      };
      const errorsWrong: string[] = [];
      validateClassifierNounCollocation(qWrong, errorsWrong, []);
      expect(
        errorsWrong.some((e) =>
          e.includes("Invalid classifier collocation: '只' is not a standard classifier for '书'")
        )
      ).toBe(true);
      expect(
        errorsWrong.some((e) =>
          e.includes("No valid classifier option exists for noun '书' in options pool")
        )
      ).toBe(true);
    });

    it('3.3 Complex sentence with three nouns: 这位老师买了一辆车和三____书 (Target is 书)', () => {
      // 1. 这位老师 (Filled)
      // 2. 一辆车 (Filled)
      // 3. 三____书 (Blank)
      const q = {
        stem: '这位老师买了一辆车和三____书。',
        options: ['本', '个', '只', '张'],
        answer_idx: 0, // '本'
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là 本.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      expect(errors).toHaveLength(0);
    });
  });

  // =========================================================================
  // 4. Nouns in HSK_CLASSIFIER_NOUN_MAP vs Unknown Nouns & Prefix Collisions
  // =========================================================================
  describe('4. Nouns in Map vs Unknown Nouns & Prefix Collisions', () => {
    it('4.1 Known noun coverage across all entries in HSK_CLASSIFIER_NOUN_MAP', () => {
      // Verify every single noun in the map has non-empty array of classifiers
      for (const [noun, classifiers] of Object.entries(HSK_CLASSIFIER_NOUN_MAP)) {
        expect(noun.length).toBeGreaterThan(0);
        expect(Array.isArray(classifiers)).toBe(true);
        expect(classifiers.length).toBeGreaterThan(0);

        // Synthetic test question for every noun
        const validClassifier = classifiers[0];
        const q = {
          stem: `我有三____${noun}。`,
          options: [validClassifier, '台', '座', '棵'],
          answer_idx: 0,
          level: 2,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_4opt',
          explanation_vi: `Đáp án đúng là ${validClassifier}.`,
        };
        const errors: string[] = [];
        validateClassifierNounCollocation(q, errors, []);
        expect(errors).toHaveLength(0);
      }
    });

    it('4.2 Longest-prefix matching: 铅笔 vs 笔, 出租车 vs 车, 书本 vs 书', () => {
      // '铅笔' -> ['支', '枝'] (length 2)
      // '笔' -> ['支', '枝'] (length 1)
      const qQianbi = {
        stem: '我买了一____铅笔。',
        options: ['支', '本', '只', '张'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      const errorsQianbi: string[] = [];
      validateClassifierNounCollocation(qQianbi, errorsQianbi, []);
      expect(errorsQianbi).toHaveLength(0);

      // '出租车' -> ['辆'] (length 3)
      const qTaxi = {
        stem: '路上有一____出租车。',
        options: ['辆', '个', '只', '张'],
        answer_idx: 0,
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      const errorsTaxi: string[] = [];
      validateClassifierNounCollocation(qTaxi, errorsTaxi, []);
      expect(errorsTaxi).toHaveLength(0);
    });

    it('4.3 Unknown nouns (not in HSK_CLASSIFIER_NOUN_MAP): safely ignored without crashing', () => {
      const unknownNouns = ['电脑', '房子', '手机', '医院', '银行'];
      for (const noun of unknownNouns) {
        const q = {
          stem: `我有两____${noun}。`,
          options: ['台', '座', '部', '棵'],
          answer_idx: 0,
          level: 2,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_4opt',
        };
        const errors: string[] = [];
        const warnings: string[] = [];
        expect(() => validateClassifierNounCollocation(q, errors, warnings)).not.toThrow();
        // Since noun is not in map, no classifier error is emitted
        expect(errors).toHaveLength(0);
      }
    });

    it('4.4 Compound noun handling: 苹果树 correctly uses 棵 without prefix collision to 苹果', () => {
      const qAppleTree = {
        stem: '院子里有一____苹果树。',
        options: ['棵', '张', '本', '只'],
        answer_idx: 0, // '棵' is correct Mandarin for 树
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(qAppleTree, errors, []);
      // With compound noun mapping and prefix disambiguation, '苹果树' correctly uses '棵'
      expect(errors).toHaveLength(0);
    });
  });

  // =========================================================================
  // 5. Explanation Entity Check Behavior & Diverse Explanation Formats
  // =========================================================================
  describe('5. Explanation Entity Check Behavior & Formatting', () => {
    it('5.1 Standard pilot defect: explanation refers to 书 when stem has 笔', () => {
      const q = {
        stem: '我有三____笔。',
        options: ['支', '本', '只', '张'],
        answer_idx: 0, // correct '支'
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: "Trong câu này, đối tượng là 'sách' (书), do đó bản là lựa chọn đúng ngữ pháp.",
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      expect(errors.some((e) => e.includes("Explanation entity mismatch: explanation refers to '书' which is not in the stem (stem noun is '笔')"))).toBe(true);
    });

    it('5.2 Various Vietnamese explanation patterns triggering entity check', () => {
      const mismatchPatterns = [
        "Đối tượng là 'sách' (书), nên chọn...",
        "Dùng cho sách (书) trong câu này.",
        "Áp dụng cho sách (书) của học sinh.",
        "Đây là lượng từ dùng cho (书).",
      ];

      for (const expl of mismatchPatterns) {
        const q = {
          stem: '我有三____笔。',
          options: ['支', '本', '只', '张'],
          answer_idx: 0,
          level: 2,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_4opt',
          explanation_vi: expl,
        };
        const errors: string[] = [];
        validateClassifierNounCollocation(q, errors, []);
        expect(
          errors.some((e) => e.includes("Explanation entity mismatch")),
          `Expected explanation mismatch for: "${expl}"`
        ).toBe(true);
      }
    });

    it('5.3 Distractor analysis containing other noun: scoped correctly to avoid false positives', () => {
      // In high-quality distractor analysis, explaining why option B ('本') is wrong
      // naturally mentions that '本' is used for books ('书').
      const qWithDistractorRationale = {
        stem: '我有三____笔。',
        options: ['支', '本', '只', '张'],
        answer_idx: 0,
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là A (支) dùng cho bút. Phân tích phương án nhiễu: Phương án B (本) dùng cho sách (书), không dùng cho bút.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(qWithDistractorRationale, errors, []);
      // Scoped check ignores the distractor analysis section, preventing false alarms
      expect(errors).toHaveLength(0);

      // Negative control: hallucination in the correct-answer section is still caught
      const qHallucination = {
        ...qWithDistractorRationale,
        explanation_vi: 'Đáp án đúng là A (支): Trong câu này, đối tượng là sách (书)...',
      };
      const errorsHallucination: string[] = [];
      validateClassifierNounCollocation(qHallucination, errorsHallucination, []);
      expect(
        errorsHallucination.some((e) => e.includes("Explanation entity mismatch: explanation refers to '书'"))
      ).toBe(true);
    });

    it('5.4 Clean explanation without entity confusion: PASSES without false alarm', () => {
      const qClean = {
        stem: '我有三____笔。',
        options: ['支', '本', '只', '张'],
        answer_idx: 0,
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        pinyin: 'wǒ yǒu sān zhī bǐ.',
        explanation_vi: 'Dịch nghĩa: Tôi có ba cây bút. - Đáp án đúng: 支: Lượng từ tiêu chuẩn cho bút viết (笔). - Phân tích phương án nhiễu: Phương án B (本): Lượng từ cho tài liệu in ấn. Phương án C (只): Lượng từ cho động vật. Phương án D (张): Lượng từ cho vật phẳng.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(qClean, errors, []);
      expect(errors).toHaveLength(0);
    });
  });

  // =========================================================================
  // 6. Semantic & Pragmatic Collocation (Beverages & Liquids)
  // =========================================================================
  describe('6. Semantic Collocation (validateSemanticPragmaticCollocation)', () => {
    it('6.1 Catches beverage/liquid nouns paired with 好吃 (including 水)', () => {
      const liquids = ['茶', '咖啡', '牛奶', '酒', '汤'];
      for (const item of liquids) {
        const q = {
          stem: `这杯${item}很____。`,
          canonical_completed_stem: `这杯${item}很好吃。`,
          options: ['好喝', '好看', '好吃', '好玩'],
          answer_idx: 2, // '好吃'
        };
        const errors: string[] = [];
        validateSemanticPragmaticCollocation(q, errors, []);
        expect(
          errors.some((e) => e.includes("Semantic collocation mismatch: '好吃' is used with beverage/liquid")),
          `Expected semantic error for beverage ${item}`
        ).toBe(true);
      }

      // Verified: '水' is included in liquid context
      const qWater = {
        stem: '这杯水很____。',
        canonical_completed_stem: '这杯水很好吃。',
        options: ['好喝', '好看', '好吃', '好玩'],
        answer_idx: 2, // '好吃'
      };
      const errorsWater: string[] = [];
      validateSemanticPragmaticCollocation(qWater, errorsWater, []);
      expect(
        errorsWater.some((e) => e.includes("Semantic collocation mismatch: '好吃' is used with beverage/liquid"))
      ).toBe(true);
    });

    it('6.2 Catches verb 喝 paired with 好吃 even without explicit beverage noun in stem', () => {
      const q = {
        stem: '我想喝____。',
        canonical_completed_stem: '我想喝好吃。',
        options: ['好喝', '好看', '好吃', '好玩'],
        answer_idx: 2, // '好吃'
      };
      const errors: string[] = [];
      validateSemanticPragmaticCollocation(q, errors, []);
      expect(
        errors.some((e) => e.includes("Semantic collocation mismatch: '好吃' is used with beverage/liquid context ('茶'/'喝')"))
      ).toBe(true);
    });

    it('6.3 Allows 好吃 for solid food items (苹果, 包子, 米饭, 面条)', () => {
      const solidFoods = ['苹果', '包子', '米饭', '面条', '蛋糕'];
      for (const food of solidFoods) {
        const q = {
          stem: `这个${food}很____。`,
          canonical_completed_stem: `这个${food}很好吃。`,
          options: ['好喝', '好看', '好吃', '好玩'],
          answer_idx: 2, // '好吃'
        };
        const errors: string[] = [];
        validateSemanticPragmaticCollocation(q, errors, []);
        expect(errors).toHaveLength(0);
      }
    });
  });

  // =========================================================================
  // 7. Robustness & Crash Immunity (Fuzz & Extreme Inputs)
  // =========================================================================
  describe('7. Robustness & Crash Immunity (Fuzz / Extreme Inputs)', () => {
    it('7.1 Defensive Guard: validateClassifierNounCollocation and validateCandidate safely handle non-string stem without TypeError', () => {
      const c = { stem: 12345 as any };
      const errors: string[] = [];
      expect(() => validateClassifierNounCollocation(c, errors, [])).not.toThrow();

      let val: any;
      expect(() => {
        val = validateCandidate(c);
      }).not.toThrow();
      expect(val.valid).toBe(false);
      expect(val.errors.some((e: string) => /stem/i.test(e))).toBe(true);
    });

    it('7.2 Gracefully handles valid string-typed boundary objects without crashing', () => {
      const benignCandidates = [
        {},
        { stem: '' },
        { stem: '   ' },
        { stem: 'abc' },
        { stem: '我有三____笔。', options: [] },
        { stem: '我有三____笔。', options: ['支', '本', '只', '张'], answer_idx: 0, explanation_vi: '' },
      ];

      for (const c of benignCandidates) {
        const errors: string[] = [];
        const warnings: string[] = [];
        expect(() => validateClassifierNounCollocation(c, errors, warnings)).not.toThrow();
        expect(() => validateSemanticPragmaticCollocation(c, errors, warnings)).not.toThrow();
        expect(() => validateCandidate(c)).not.toThrow();
        expect(() => evaluateCandidateSixGates(c)).not.toThrow();
      }
    });
  });
});
