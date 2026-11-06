import { describe, it, expect } from 'vitest';
import {
  validateCandidate,
  validateClassifierNounCollocation,
  validateSemanticPragmaticCollocation,
  evaluateCandidateSixGates,
  HSK_CLASSIFIER_NOUN_MAP,
} from '../src/server/llm/questionValidator.js';

describe('Empirical Challenger Iteration 2: Malformed Inputs & Compound Noun Stress', () => {

  // =========================================================================
  // 1. Extreme Malformed Inputs to validateCandidate & validateClassifierNounCollocation
  // =========================================================================
  describe('1. Malformed Inputs: Zero Unhandled TypeErrors', () => {
    const jsonMalformedStems: any[] = [
      null,
      undefined,
      12345,
      0,
      -1,
      true,
      false,
      {},
      { stem: 'foo' },
      [],
      ['stem'],
    ];

    it('1.1 validateClassifierNounCollocation safely ignores or handles non-string stems without throwing', () => {
      for (const badStem of [...jsonMalformedStems, Symbol('stem'), () => 'stem']) {
        const q = {
          stem: badStem,
          options: ['个', '只', '本', '张'],
          answer_idx: 0,
        };
        const errors: string[] = [];
        const warnings: string[] = [];
        expect(
          () => validateClassifierNounCollocation(q, errors, warnings)
        ).not.toThrow();
      }
    });

    it('1.2 validateCandidate safely rejects all JSON malformed non-string stems without throwing', () => {
      for (const badStem of jsonMalformedStems) {
        const q = {
          stem: badStem,
          options: ['个', '只', '本', '张'],
          answer_idx: 0,
          level: 1,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_4opt',
        };
        let res: any;
        expect(() => {
          res = validateCandidate(q);
        }).not.toThrow();
        expect(res.valid).toBe(false);
        expect(res.errors.some((e: string) => /stem/i.test(e))).toBe(true);
      }
    });

    it('1.2b Edge case: validateCandidate on Symbol or Object.create(null) stem reveals unchecked regex in line 1433', () => {
      const qSymbol = {
        stem: Symbol('stem') as any,
        options: ['个', '只', '本', '张'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      // Symbol coercion at line 1433 latinVietnameseRegex.test(q.stem) throws TypeError
      expect(() => validateCandidate(qSymbol)).toThrow(/Cannot convert a Symbol/);

      const qNullProto = {
        stem: Object.create(null),
        options: ['个', '只', '本', '张'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      // Null-prototype object coercion at line 1433 throws TypeError
      expect(() => validateCandidate(qNullProto)).toThrow(/Cannot convert object to primitive value/);
    });

    const malformedOptions: any[] = [
      null,
      undefined,
      12345,
      'not an array',
      {},
      [],
      ['only one option'],
      ['one', 'two'], // < 4 options for read_fill_blank_4opt
      [1, 2, 3, 4],
      [null, undefined, {}, []],
      ['个', null, '本', '张'],
      ['个', undefined, '本', '张'],
      ['个', 12345, '本', '张'],
      ['个', {}, '本', '张'],
      ['个', [], '本', '张'],
      ['个', true, '本', '张'],
      ['个', () => {}, '本', '张'],
      ['个', Symbol('opt'), '本', '张'],
      ['个', '个', '本', '张'], // duplicate options
      ['', '  ', '本', '张'], // empty string options
    ];

    it('1.3 validateClassifierNounCollocation safely handles malformed options without throwing', () => {
      for (const badOptions of malformedOptions) {
        const q = {
          stem: '我有三____笔。',
          options: badOptions,
          answer_idx: 0,
        };
        const errors: string[] = [];
        const warnings: string[] = [];
        expect(
          () => validateClassifierNounCollocation(q, errors, warnings)
        ).not.toThrow();
      }
    });

    it('1.4 validateCandidate safely rejects malformed options without throwing', () => {
      for (const badOptions of malformedOptions) {
        const q = {
          stem: '我有三____笔。',
          options: badOptions,
          answer_idx: 0,
          level: 1,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_4opt',
        };
        let res: any;
        expect(
          () => {
            res = validateCandidate(q);
          }
        ).not.toThrow();
        expect(res.valid).toBe(false);
      }
    });

    const malformedAnswerIdxs: any[] = [
      null,
      undefined,
      '0',
      '1',
      NaN,
      Infinity,
      -Infinity,
      -1,
      -100,
      4,
      100,
      1.5,
      3.14159,
      {},
      [],
      true,
      false,
      () => 0,
    ];

    it('1.5 validateClassifierNounCollocation and validateCandidate safely handle malformed answer_idx', () => {
      for (const badIdx of malformedAnswerIdxs) {
        const q = {
          stem: '我有三____笔。',
          options: ['支', '本', '只', '张'],
          answer_idx: badIdx,
          level: 2,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_4opt',
        };
        const errors: string[] = [];
        expect(
          () => validateClassifierNounCollocation(q, errors, []),
          `Failed validateClassifierNounCollocation on answer_idx: ${String(badIdx)}`
        ).not.toThrow();

        let res: any;
        expect(
          () => {
            res = validateCandidate(q);
          },
          `Failed validateCandidate on answer_idx: ${String(badIdx)}`
        ).not.toThrow();
        expect(res.valid).toBe(false);
        expect(res.errors.some((e: string) => /answer_idx/i.test(e))).toBe(true);
      }
    });

    it('1.6 Entirely malformed objects: null, undefined, empty object, primitive values', () => {
      const weirdPayloads: any[] = [
        null,
        undefined,
        {},
        12345,
        'string payload',
        true,
        [],
        [1, 2, 3],
        new Date(),
      ];

      for (const payload of weirdPayloads) {
        const errors: string[] = [];
        const warnings: string[] = [];
        expect(
          () => validateClassifierNounCollocation(payload || {}, errors, warnings),
          `Failed on payload: ${String(payload)}`
        ).not.toThrow();

        expect(
          () => validateSemanticPragmaticCollocation(payload || {}, errors, warnings),
          `Failed on payload: ${String(payload)}`
        ).not.toThrow();

        let res: any;
        expect(
          () => {
            res = validateCandidate(payload || {});
          },
          `Failed on validateCandidate for: ${String(payload)}`
        ).not.toThrow();
        expect(res.valid).toBe(false);

        expect(
          () => evaluateCandidateSixGates(payload || {}),
          `Failed on evaluateCandidateSixGates for: ${String(payload)}`
        ).not.toThrow();
      }
    });

    it('1.7 Malformed explanation_vi and other fields: zero crashes', () => {
      const badExplanations: any[] = [
        null,
        undefined,
        12345,
        true,
        {},
        [],
        { text: 'explanation' },
      ];

      for (const badExp of badExplanations) {
        const q = {
          stem: '我有三____笔。',
          options: ['支', '本', '只', '张'],
          answer_idx: 0,
          explanation_vi: badExp,
          canonical_completed_stem: 12345 as any,
          completed_stem: null as any,
          level: 2,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_4opt',
        };
        const errors: string[] = [];
        expect(
          () => validateClassifierNounCollocation(q, errors, []),
          `Failed on explanation_vi: ${String(badExp)}`
        ).not.toThrow();

        expect(
          () => validateCandidate(q),
          `Failed on validateCandidate for explanation_vi: ${String(badExp)}`
        ).not.toThrow();
      }
    });
  });

  // =========================================================================
  // 2. Compound Noun Pairing & Disambiguation: "院子里有一____苹果树。"
  // =========================================================================
  describe('2. Compound Noun Pairing: 苹果树 vs 苹果', () => {
    it('2.1 "院子里有一____苹果树。" with key "棵" PASSES classifier validation without prefix collision', () => {
      const q = {
        stem: '院子里有一____苹果树。',
        raw_completed_stem: '院子里有一棵苹果树。',
        completed_stem: '院子里有一棵苹果树。',
        canonical_completed_stem: '院子里有一棵苹果树。',
        options: ['棵', '个', '只', '张'],
        answer_idx: 0, // '棵' is correct for 苹果树
        level: 4,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là A (棵) dùng cho cây cối (苹果树). Phân tích phương án nhiễu: Phương án B (个) dùng cho hoa quả (苹果), không dùng cho cây.',
      };
      const errors: string[] = [];
      const warnings: string[] = [];
      validateClassifierNounCollocation(q, errors, warnings);
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);

      // Verify full validateCandidate
      const val = validateCandidate(q);
      console.log('Test 2.1 val.errors:', val.errors);
      console.log('Test 2.1 val.warnings:', val.warnings);
      expect(val.valid).toBe(true);
      expect(val.errors).toHaveLength(0);
    });

    it('2.2 "院子里有一____苹果树。" with key "个" FAILS (rejects fruit classifier for tree)', () => {
      // If prefix collision occurred, '苹果树' would falsely match '苹果' and accept '个'.
      // With proper disambiguation, '苹果树' requires '棵' and rejects '个'.
      const q = {
        stem: '院子里有一____苹果树。',
        options: ['个', '张', '本', '只'],
        answer_idx: 0, // '个' is invalid for 苹果树
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là 个.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      expect(errors.some((e) => e.includes("Invalid classifier collocation: '个' is not a standard classifier for '苹果树'"))).toBe(true);
      expect(errors.some((e) => e.includes("No valid classifier option exists for noun '苹果树' in options pool"))).toBe(true);

      const val = validateCandidate(q);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes("Invalid classifier collocation: '个' is not a standard classifier for '苹果树'"))).toBe(true);
    });

    it('2.3 "桌子上有一____苹果。" with key "个" PASSES (standard fruit classifier)', () => {
      const q = {
        stem: '桌子上有一____苹果。',
        raw_completed_stem: '桌子上有一个苹果。',
        completed_stem: '桌子上有一个苹果。',
        canonical_completed_stem: '桌子上有一个苹果。',
        options: ['个', '张', '本', '只'],
        answer_idx: 0, // '个' is valid for 苹果
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        pinyin: 'zhuōzi shang yǒu yí gè píngguǒ.',
        explanation_vi: 'Đáp án đúng là A (个) dùng cho quả táo (苹果). Phân tích phương án nhiễu: Phương án B (张) dùng cho vật phẳng.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      expect(errors).toHaveLength(0);

      const val = validateCandidate(q);
      console.log('Test 2.3 val.errors:', val.errors);
      expect(val.valid).toBe(true);
    });

    it('2.4 "院子里有一____苹果。" with key "棵" FAILS (rejects tree classifier for fruit)', () => {
      const q = {
        stem: '院子里有一____苹果。',
        options: ['棵', '张', '本', '只'],
        answer_idx: 0, // '棵' is invalid for 苹果
        level: 4,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là 棵.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      expect(errors.some((e) => e.includes("Invalid classifier collocation: '棵' is not a standard classifier for '苹果'"))).toBe(true);

      const val = validateCandidate(q);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes("Invalid classifier collocation: '棵' is not a standard classifier for '苹果'"))).toBe(true);
    });

    it('2.5 Dual noun sentence: "院子里有一____苹果树，上面结了许多苹果。" with key "棵" PASSES', () => {
      const q = {
        stem: '院子里有一____苹果树，上面结了许多苹果。',
        raw_completed_stem: '院子里有一棵苹果树，上面结了许多苹果。',
        completed_stem: '院子里有一棵苹果树，上面结了许多苹果。',
        canonical_completed_stem: '院子里有一棵苹果树，上面结了许多苹果。',
        options: ['棵', '只', '张', '本'],
        answer_idx: 0,
        level: 4,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là A (棵): lượng từ cho cây cối (苹果树). Phân tích phương án nhiễu: Phương án B (只) dùng cho động vật.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      expect(errors).toHaveLength(0);

      const val = validateCandidate(q);
      expect(val.valid).toBe(true);
    });

    it('2.6 Non-mapped compound noun starting with "苹果": "我想买一____苹果手机。" does not falsely collide with "苹果"', () => {
      // '苹果手机' is not in HSK_CLASSIFIER_NOUN_MAP.
      // Because '手' is not in validContinuationPattern, '苹果手机' does NOT match '苹果'.
      // Therefore, it safely passes classifier validation without wrongly demanding '个' or '块' from '苹果'.
      const q = {
        stem: '我想买一____苹果手机。',
        options: ['部', '台', '支', '个'],
        answer_idx: 0, // '部'
        level: 4,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
      };
      const errors: string[] = [];
      expect(() => validateClassifierNounCollocation(q, errors, [])).not.toThrow();
      expect(errors).toHaveLength(0);
    });

    it('2.7 Single noun "树" in "路边有一____树。" correctly uses "棵"', () => {
      const q = {
        stem: '路边有一____树。',
        raw_completed_stem: '路边有一棵树。',
        completed_stem: '路边有一棵树。',
        canonical_completed_stem: '路边有一棵树。',
        options: ['棵', '个', '只', '张'],
        answer_idx: 0,
        level: 4,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là A (棵) dùng cho cây (树). Phân tích phương án nhiễu: Phương án B (个) dùng cho vật thể thông thường.',
      };
      const errors: string[] = [];
      validateClassifierNounCollocation(q, errors, []);
      expect(errors).toHaveLength(0);

      const val = validateCandidate(q);
      expect(val.valid).toBe(true);
    });
  });

  // =========================================================================
  // 3. Liquid Regex & Food Boundary Stress
  // =========================================================================
  describe('3. Liquid & Beverage Collocation Boundaries', () => {
    it('3.1 Water (水) with 好吃 correctly rejected', () => {
      const q = {
        stem: '这杯水很____。',
        canonical_completed_stem: '这杯水很好吃。',
        options: ['好喝', '好看', '好吃', '好玩'],
        answer_idx: 2,
      };
      const errors: string[] = [];
      validateSemanticPragmaticCollocation(q, errors, []);
      expect(errors.some((e) => e.includes("Semantic collocation mismatch: '好吃' is used with beverage/liquid"))).toBe(true);
    });

    it('3.2 Edible compounds containing 水 (水果, 水饺) with 好吃 correctly ACCEPTED', () => {
      const foods = [
        { noun: '水果', stem: '这个水果很____。', completed: '这个水果很好吃。' },
        { noun: '水饺', stem: '这盘水饺很____。', completed: '这盘水饺很好吃。' },
      ];

      for (const item of foods) {
        const q = {
          stem: item.stem,
          canonical_completed_stem: item.completed,
          options: ['好喝', '好看', '好吃', '好玩'],
          answer_idx: 2,
        };
        const errors: string[] = [];
        validateSemanticPragmaticCollocation(q, errors, []);
        expect(errors, `Expected edible item ${item.noun} to pass`).toHaveLength(0);
      }
    });

    it('3.3 Non-drink compounds containing 水 (水平, 墨水, 香水) do not trigger beverage 好吃 rule', () => {
      const nonDrinks = [
        { stem: '他的汉语水平很____。', completed: '他的汉语水平很好。' },
        { stem: '这瓶香水很____。', completed: '这瓶香水很好看。' },
      ];

      for (const item of nonDrinks) {
        const q = {
          stem: item.stem,
          canonical_completed_stem: item.completed,
          options: ['好', '高', '多', '少'],
          answer_idx: 0,
        };
        const errors: string[] = [];
        validateSemanticPragmaticCollocation(q, errors, []);
        expect(errors).toHaveLength(0);
      }
    });

    it('3.4 Contrast sentence with beverage and food: "苹果很好吃，茶很____。" with key "好喝" PASSES', () => {
      const q = {
        stem: '苹果很好吃，茶很____。',
        canonical_completed_stem: '苹果很好吃，茶很好喝。',
        options: ['好喝', '好看', '好吃', '好玩'],
        answer_idx: 0, // '好喝'
      };
      const errors: string[] = [];
      validateSemanticPragmaticCollocation(q, errors, []);
      expect(errors).toHaveLength(0);
    });
  });
});
