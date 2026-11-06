/**
 * tests/adversarial_challenger1_phase8_2_rng.test.ts
 *
 * Empirical Adversarial & Stress Test Suite for Phase 8.2 Verified Remediation
 * Agent: Challenger 1 (Adversarial Verifier for RNG & answer_idx)
 *
 * Verifies mathematical soundness, boundary rigor, and immutability for:
 * 1. Custom RNG edge cases: 0.0, 1.0 - Number.EPSILON, Number.MIN_VALUE, -0.0, -Number.MIN_VALUE,
 *    1.0, 1.0000000000000002, NaN, Infinity, -Infinity, strings, booleans, objects, mid-sequence aborts.
 * 2. answer_idx edge cases: Number.MAX_SAFE_INTEGER, -1, -0, 0.5, 1.0000000000000002, NaN, null,
 *    undefined, boolean, non-number, boundaries (n-1, n, n+1).
 * 3. Array and object immutability under error and success conditions using Object.freeze.
 * 4. Option lengths: 0, 1, 2, 4, 6 options.
 * 5. Guarantee: No undefined answer_idx, 100% preservation of correct answer option content.
 * 6. Strict database invariants (bit-for-bit SHA256 of hsk_exam.db, qbank.db row counts).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  shuffleQuestionAnswers,
  shuffleOptionsArray,
  getOriginalAnswerIndex,
  type ShuffleableQuestion,
} from '../src/server/utils/answerShuffle';

describe('Adversarial Challenger 1: RNG & answer_idx Empirical Stress Suite', () => {

  // =========================================================================
  // TASK 1.1: Extreme Edge Cases for Custom RNG
  // =========================================================================
  describe('Task 1.1: Custom RNG Extreme Edge Cases in shuffleOptionsArray', () => {
    const testOptions = ['A', 'B', 'C', 'D'];

    it('handles exact 0.0 without throwing and produces valid permutation', () => {
      const res = shuffleOptionsArray(testOptions, () => 0.0);
      expect(res.shuffled).toHaveLength(4);
      expect(res.mapping).toHaveLength(4);
      expect(new Set(res.shuffled).size).toBe(4);
      // Under Durstenfeld with r=0.0:
      // i=3: j=0 -> swap(3,0) => indices: [3, 1, 2, 0]
      // i=2: j=0 -> swap(2,0) => indices: [2, 1, 3, 0]
      // i=1: j=0 -> swap(1,0) => indices: [1, 2, 3, 0]
      // Result items: [testOptions[1], testOptions[2], testOptions[3], testOptions[0]] = ['B', 'C', 'D', 'A']
      expect(res.shuffled).toEqual(['B', 'C', 'D', 'A']);
      expect(res.mapping).toEqual([3, 0, 1, 2]);
    });

    it('handles 1.0 - Number.EPSILON (maximum valid float in [0, 1)) without overflow', () => {
      const maxFloat = 1.0 - Number.EPSILON;
      expect(() => {
        const res = shuffleOptionsArray(testOptions, () => maxFloat);
        expect(res.shuffled).toHaveLength(4);
        expect(res.mapping).toHaveLength(4);
        expect(new Set(res.shuffled).size).toBe(4);
        // Under Durstenfeld with maxFloat:
        // j = Math.floor(maxFloat * (i + 1)) = Math.floor((1 - eps)*(i + 1)) = i (identity swap)
        expect(res.shuffled).toEqual(['A', 'B', 'C', 'D']);
        expect(res.mapping).toEqual([0, 1, 2, 3]);
      }).not.toThrow();
    });

    it('handles Number.MIN_VALUE (smallest positive subnormal number ~5e-324)', () => {
      expect(() => {
        const res = shuffleOptionsArray(testOptions, () => Number.MIN_VALUE);
        expect(res.shuffled).toHaveLength(4);
        expect(new Set(res.shuffled).size).toBe(4);
        // Math.floor(5e-324 * (i + 1)) = 0, behaves identically to 0.0
        expect(res.shuffled).toEqual(['B', 'C', 'D', 'A']);
      }).not.toThrow();
    });

    it('handles -0.0 in IEEE-754 arithmetic safely without corruption or out-of-bounds', () => {
      // In JS: -0.0 === 0.0, -0.0 < 0 is false, Math.floor(-0.0 * (i + 1)) is -0.
      expect(() => {
        const res = shuffleOptionsArray(testOptions, () => -0.0);
        expect(res.shuffled).toHaveLength(4);
        expect(res.mapping).toHaveLength(4);
        expect(new Set(res.shuffled).size).toBe(4);
        expect(res.shuffled).toEqual(['B', 'C', 'D', 'A']);
      }).not.toThrow();
    });

    it('rejects -Number.MIN_VALUE (-5e-324 < 0) with RangeError', () => {
      expect(() => shuffleOptionsArray(testOptions, () => -Number.MIN_VALUE)).toThrow(RangeError);
    });

    it('rejects exact 1.0 with RangeError', () => {
      expect(() => shuffleOptionsArray(testOptions, () => 1.0)).toThrow(RangeError);
    });

    it('rejects 1.0000000000000002 (1 + Number.EPSILON) with RangeError', () => {
      const justAbove1 = 1.0 + Number.EPSILON;
      expect(() => shuffleOptionsArray(testOptions, () => justAbove1)).toThrow(RangeError);
    });

    it('rejects large numbers (100, 1e10, Number.MAX_VALUE) with RangeError', () => {
      expect(() => shuffleOptionsArray(testOptions, () => 100)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(testOptions, () => 1e10)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(testOptions, () => Number.MAX_VALUE)).toThrow(RangeError);
    });

    it('rejects negative numbers (-0.000000001, -1, -Infinity) with appropriate errors', () => {
      expect(() => shuffleOptionsArray(testOptions, () => -0.000000001)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(testOptions, () => -1)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(testOptions, () => -Infinity)).toThrow(TypeError);
    });

    it('rejects non-finite values (NaN, +Infinity, -Infinity) with TypeError', () => {
      expect(() => shuffleOptionsArray(testOptions, () => NaN)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(testOptions, () => Infinity)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(testOptions, () => -Infinity)).toThrow(TypeError);
    });

    it('rejects strings ("0.5", "0", "1", "NaN", "") with TypeError', () => {
      const stringRngs = ['0.5', '0', '1', 'NaN', '', 'Infinity', 'random'];
      for (const s of stringRngs) {
        expect(() => shuffleOptionsArray(testOptions, (() => s) as any)).toThrow(TypeError);
      }
    });

    it('rejects booleans (true, false) with TypeError', () => {
      expect(() => shuffleOptionsArray(testOptions, (() => true) as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(testOptions, (() => false) as any)).toThrow(TypeError);
    });

    it('rejects objects, arrays, and null with TypeError', () => {
      expect(() => shuffleOptionsArray(testOptions, (() => null) as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(testOptions, (() => ({})) as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(testOptions, (() => [0.5]) as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(testOptions, (() => new Date()) as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(testOptions, (() => Symbol('rng')) as any)).toThrow(TypeError);
    });

    it('rejects undefined output from RNG with TypeError', () => {
      expect(() => shuffleOptionsArray(testOptions, (() => undefined) as any)).toThrow(TypeError);
    });

    it('aborts cleanly when RNG fails midway through iterations and leaves original array unmodified', () => {
      let callCount = 0;
      // Fail on the 2nd iteration (i = 2 for 4 options)
      const midwayFailRng = () => {
        callCount++;
        if (callCount === 2) return 1.5; // invalid value >= 1
        return 0.5;
      };

      const frozenInput = Object.freeze(['OptionA', 'OptionB', 'OptionC', 'OptionD']);

      expect(() => {
        shuffleOptionsArray(frozenInput as unknown as string[], midwayFailRng);
      }).toThrow(RangeError);

      expect(callCount).toBe(2);
      expect(frozenInput).toEqual(['OptionA', 'OptionB', 'OptionC', 'OptionD']);
    });
  });

  // =========================================================================
  // TASK 1.2: Extreme Edge Cases for answer_idx
  // =========================================================================
  describe('Task 1.2: answer_idx Extreme Edge Cases in shuffleQuestionAnswers', () => {
    const sampleQuestion: ShuffleableQuestion = {
      stem: '北京是中国的______。',
      options: ['首都', '省会', '城市', '国家'],
      answer_idx: 0,
      explanation_vi: 'Đáp án đúng là A.',
    };

    it('rejects Number.MAX_SAFE_INTEGER with RangeError', () => {
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: Number.MAX_SAFE_INTEGER })).toThrow(RangeError);
    });

    it('rejects Number.MIN_SAFE_INTEGER with RangeError', () => {
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: Number.MIN_SAFE_INTEGER })).toThrow(RangeError);
    });

    it('rejects -1 and negative indices with RangeError', () => {
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: -1 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: -100 })).toThrow(RangeError);
    });

    it('handles -0 safely as index 0 without returning undefined or negative zero in answer_idx', () => {
      const res = shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: -0 });
      expect(res.shuffled).toBe(true);
      expect(Number.isInteger(res.new_answer_idx)).toBe(true);
      expect(res.new_answer_idx).toBeGreaterThanOrEqual(0);
      expect(res.new_answer_idx).toBeLessThan(4);
      expect(res.question.options[res.new_answer_idx]).toBe('首都');
      expect(res.new_answer_idx).not.toBeUndefined();
    });

    it('rejects floating-point numbers (0.5, 1.0000000000000002, 1e-15, 2.9999) with TypeError', () => {
      const badFloats = [0.5, 1.0000000000000002, 1e-15, 2.99999999999999, -0.5, 0.1 + 0.2];
      for (const bf of badFloats) {
        expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: bf })).toThrow(TypeError);
      }
    });

    it('rejects NaN, Infinity, -Infinity with TypeError', () => {
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: NaN })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: Infinity })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: -Infinity })).toThrow(TypeError);
    });

    it('rejects null and undefined with TypeError', () => {
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: null as any })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: undefined as any })).toThrow(TypeError);
    });

    it('rejects booleans (true, false) with TypeError (no loose coercion to 1 or 0)', () => {
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: true as any })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: false as any })).toThrow(TypeError);
    });

    it('rejects non-numeric types (strings, objects, arrays, symbols) with TypeError', () => {
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: '0' as any })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: '1' as any })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: {} as any })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: [0] as any })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: Symbol(0) as any })).toThrow(TypeError);
    });

    it('boundary test: accepts n - 1, strictly rejects n and n + 1 with RangeError', () => {
      // 4 options: valid indices are 0, 1, 2, 3
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: 3 })).not.toThrow();
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: 4 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ ...sampleQuestion, answer_idx: 5 })).toThrow(RangeError);
    });
  });

  // =========================================================================
  // TASK 1.3: Immutability & Purity under Error Conditions
  // =========================================================================
  describe('Task 1.3: Immutability & Purity under Error Conditions', () => {

    it('preserves deeply frozen question object and options array when RNG throws RangeError', () => {
      const originalOptions = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen'];
      const frozenOptions = Object.freeze([...originalOptions]);
      const frozenQuestion = Object.freeze({
        id: 'q_frozen_rng_err',
        stem: 'Capital of China?',
        options: frozenOptions,
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A.',
      });

      // Pass hostile RNG that returns 1.0 (triggers RangeError)
      expect(() => {
        shuffleQuestionAnswers(frozenQuestion as any, () => 1.0);
      }).toThrow(RangeError);

      // Verify no mutation occurred
      expect(frozenQuestion.answer_idx).toBe(0);
      expect(frozenQuestion.options).toEqual(originalOptions);
      expect(Object.isFrozen(frozenQuestion)).toBe(true);
      expect(Object.isFrozen(frozenQuestion.options)).toBe(true);
    });

    it('preserves deeply frozen question object and options array when RNG throws TypeError', () => {
      const originalOptions = ['T/F 1', 'T/F 2'];
      const frozenOptions = Object.freeze([...originalOptions]);
      const frozenQuestion = Object.freeze({
        id: 'q_frozen_type_err',
        stem: 'TF prompt',
        options: frozenOptions,
        answer_idx: 1,
      });

      expect(() => {
        shuffleQuestionAnswers(frozenQuestion as any, () => NaN);
      }).toThrow(TypeError);

      expect(frozenQuestion.answer_idx).toBe(1);
      expect(frozenQuestion.options).toEqual(originalOptions);
    });

    it('preserves deeply frozen question object when answer_idx validation fails', () => {
      const originalOptions = ['A', 'B', 'C', 'D'];
      const frozenOptions = Object.freeze([...originalOptions]);
      const frozenQuestion = Object.freeze({
        id: 'q_frozen_idx_err',
        stem: 'Stem',
        options: frozenOptions,
        answer_idx: 999, // Out of bounds
      });

      expect(() => {
        shuffleQuestionAnswers(frozenQuestion as any);
      }).toThrow(RangeError);

      expect(frozenQuestion.answer_idx).toBe(999);
      expect(frozenQuestion.options).toEqual(originalOptions);
    });

    it('preserves original input during successful shuffle (produces new object, does not mutate input)', () => {
      const originalOptions = ['Alpha', 'Beta', 'Gamma', 'Delta'];
      const inputQuestion: ShuffleableQuestion = {
        id: 'q_success_pure',
        stem: 'Greek letter?',
        options: [...originalOptions],
        answer_idx: 2, // 'Gamma'
      };

      const res = shuffleQuestionAnswers(inputQuestion, () => 0.0);

      // Original question must not be altered
      expect(inputQuestion.answer_idx).toBe(2);
      expect(inputQuestion.options).toEqual(originalOptions);

      // Output question must have the shuffled structure
      expect(res.question).not.toBe(inputQuestion);
      expect(res.question.options).not.toBe(inputQuestion.options);
      expect(res.question.options[res.new_answer_idx]).toBe('Gamma');
    });
  });

  // =========================================================================
  // TASK 1.4: Testing Option Lengths (0, 1, 2, 4, 6 Options)
  // =========================================================================
  describe('Task 1.4: Option Lengths (0, 1, 2, 4, 6 options)', () => {

    it('0 options (writing / open-ended): returns shuffled: false safely without error', () => {
      let rngCalled = false;
      const hostileRng = () => {
        rngCalled = true;
        return -999;
      };

      const q0: ShuffleableQuestion = {
        stem: 'Describe your hometown in 100 characters.',
        options: [],
        answer_idx: -1,
      };

      const res = shuffleQuestionAnswers(q0, hostileRng);
      expect(res.shuffled).toBe(false);
      expect(res.new_answer_idx).toBe(-1);
      expect(res.original_answer_idx).toBe(-1);
      expect(res.question.options).toEqual([]);
      expect(res.mapping).toEqual([]);
      expect(rngCalled).toBe(false);
    });

    it('0 options with non-numeric answer_idx: defaults safely to -1 without returning undefined', () => {
      const q0Invalid: ShuffleableQuestion = {
        stem: 'Open writing prompt',
        options: [],
        answer_idx: undefined as any,
      };

      const res = shuffleQuestionAnswers(q0Invalid);
      expect(res.shuffled).toBe(false);
      expect(res.new_answer_idx).toBe(-1);
      expect(res.original_answer_idx).toBe(-1);
      expect(res.new_answer_idx).not.toBeUndefined();
    });

    it('1 option (single choice / affirmation): returns shuffled: false safely without calling RNG', () => {
      let rngCalled = false;
      const hostileRng = () => {
        rngCalled = true;
        return 999;
      };

      const q1: ShuffleableQuestion = {
        stem: 'Read and confirm the text.',
        options: ['Confirmed'],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(q1, hostileRng);
      expect(res.shuffled).toBe(false);
      expect(res.new_answer_idx).toBe(0);
      expect(res.original_answer_idx).toBe(0);
      expect(res.question.options).toEqual(['Confirmed']);
      expect(res.mapping).toEqual([0]);
      expect(rngCalled).toBe(false);
    });

    it('2 options (True / False): verifies all valid indices [0, 1] and both permutations', () => {
      const tfOptions = ['选项A', '选项B'];

      for (let ansIdx = 0; ansIdx < 2; ansIdx++) {
        const qTF: ShuffleableQuestion = {
          stem: 'HSK 1 Statement True/False',
          options: [...tfOptions],
          answer_idx: ansIdx,
        };

        // Permutation 1: swap (rng = 0.0)
        const resSwap = shuffleQuestionAnswers(qTF, () => 0.0);
        expect(resSwap.shuffled).toBe(true);
        expect(resSwap.question.options[resSwap.new_answer_idx]).toBe(tfOptions[ansIdx]);
        expect(getOriginalAnswerIndex(resSwap.new_answer_idx, resSwap.mapping)).toBe(ansIdx);

        // Permutation 2: keep (rng = 0.999999999)
        const resKeep = shuffleQuestionAnswers(qTF, () => 0.999999999);
        expect(resKeep.shuffled).toBe(true);
        expect(resKeep.question.options[resKeep.new_answer_idx]).toBe(tfOptions[ansIdx]);
        expect(getOriginalAnswerIndex(resKeep.new_answer_idx, resKeep.mapping)).toBe(ansIdx);
      }

      // Rejects out-of-bound indices
      expect(() => shuffleQuestionAnswers({ stem: 'TF', options: ['A', 'B'], answer_idx: -1 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ stem: 'TF', options: ['A', 'B'], answer_idx: 2 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ stem: 'TF', options: ['A', 'B'], answer_idx: 3 })).toThrow(RangeError);
    });

    it('4 options (Standard MCQ): verifies all valid indices [0, 1, 2, 3] and index boundaries', () => {
      const mcqOptions = ['Option 0', 'Option 1', 'Option 2', 'Option 3'];

      for (let ansIdx = 0; ansIdx < 4; ansIdx++) {
        const q4: ShuffleableQuestion = {
          stem: `MCQ question targeting index ${ansIdx}`,
          options: [...mcqOptions],
          answer_idx: ansIdx,
        };

        const res = shuffleQuestionAnswers(q4);
        expect(res.shuffled).toBe(true);
        expect(res.question.options).toHaveLength(4);
        expect(res.new_answer_idx).toBeGreaterThanOrEqual(0);
        expect(res.new_answer_idx).toBeLessThan(4);
        expect(res.question.options[res.new_answer_idx]).toBe(mcqOptions[ansIdx]);
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(ansIdx);
      }

      // Out of bounds
      expect(() => shuffleQuestionAnswers({ stem: 'MCQ', options: mcqOptions, answer_idx: -1 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ stem: 'MCQ', options: mcqOptions, answer_idx: 4 })).toThrow(RangeError);
    });

    it('6 options (Word Bank): verifies all valid indices [0..5] and index boundaries', () => {
      const wbOptions = ['Word A', 'Word B', 'Word C', 'Word D', 'Word E', 'Word F'];

      for (let ansIdx = 0; ansIdx < 6; ansIdx++) {
        const q6: ShuffleableQuestion = {
          stem: `Word Bank question targeting index ${ansIdx}`,
          options: [...wbOptions],
          answer_idx: ansIdx,
        };

        const res = shuffleQuestionAnswers(q6);
        expect(res.shuffled).toBe(true);
        expect(res.question.options).toHaveLength(6);
        expect(res.new_answer_idx).toBeGreaterThanOrEqual(0);
        expect(res.new_answer_idx).toBeLessThan(6);
        expect(res.question.options[res.new_answer_idx]).toBe(wbOptions[ansIdx]);
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(ansIdx);
      }

      // Out of bounds
      expect(() => shuffleQuestionAnswers({ stem: 'WB', options: wbOptions, answer_idx: -1 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ stem: 'WB', options: wbOptions, answer_idx: 6 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ stem: 'WB', options: wbOptions, answer_idx: 10 })).toThrow(RangeError);
    });
  });

  // =========================================================================
  // TASK 2: Adversarial Stress Fuzzing & No-Undefined Invariant
  // =========================================================================
  describe('Task 2: Adversarial Fuzzing & No-Undefined Invariant', () => {

    it('500 iterations of PRNG fuzzing across option counts (2, 4, 6) guarantee no undefined answer_idx', () => {
      const optionLengths = [2, 4, 6];

      for (let iter = 0; iter < 500; iter++) {
        const n = optionLengths[iter % optionLengths.length];
        const options = Array.from({ length: n }, (_, i) => `Choice_${i}`);
        const targetIdx = Math.floor(Math.random() * n);

        const q: ShuffleableQuestion = {
          id: `fuzz_${iter}`,
          stem: `Fuzz stem ${iter}`,
          options,
          answer_idx: targetIdx,
        };

        const res = shuffleQuestionAnswers(q);

        // Core invariants:
        expect(res.new_answer_idx).toBeDefined();
        expect(typeof res.new_answer_idx).toBe('number');
        expect(Number.isInteger(res.new_answer_idx)).toBe(true);
        expect(res.new_answer_idx).toBeGreaterThanOrEqual(0);
        expect(res.new_answer_idx).toBeLessThan(n);
        expect(res.question.answer_idx).toBe(res.new_answer_idx);

        // Content integrity: the chosen option in shuffled array matches original option
        expect(res.question.options[res.new_answer_idx]).toBe(`Choice_${targetIdx}`);

        // Invertibility: reverse mapping returns original index
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(targetIdx);

        // Mapping completeness: mapping has length n and contains all indices 0..n-1
        expect(res.mapping).toHaveLength(n);
        expect(new Set(res.mapping).size).toBe(n);
      }
    });

    it('Stress test: Custom PRNG with pseudo-chaotic sequence produces uniformly distributed valid indices', () => {
      // Linear congruential generator (LCG) normalized to [0, 1)
      let seed = 123456789;
      const lcgRng = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      const q: ShuffleableQuestion = {
        stem: 'LCG PRNG stress test',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
      };

      const counts = [0, 0, 0, 0];
      const runs = 2000;

      for (let i = 0; i < runs; i++) {
        const res = shuffleQuestionAnswers(q, lcgRng);
        expect(res.new_answer_idx).toBeDefined();
        expect(res.question.options[res.new_answer_idx]).toBe('A');
        counts[res.new_answer_idx]++;
      }

      // Check all 4 positions are reached
      for (let i = 0; i < 4; i++) {
        expect(counts[i]).toBeGreaterThan(runs * 0.15); // At least 15% each
      }
    });
  });

  // =========================================================================
  // TASK 3: Strict Production Database Invariants Verification
  // =========================================================================
  describe('Strict Invariants: Production Database Preservation', () => {
    const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

    it('guarantees data/hsk_exam.db is 100% bit-for-bit unchanged (SHA-256 match)', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const buffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HASH);
    });

    it('guarantees data/qbank/qbank.db counts remain identical to baseline', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        // Historical 1699 sessions + 36 verified practice sessions added during Phases 8-16
        const sessions = db.prepare('SELECT COUNT(1) as c FROM exam_sessions').get() as { c: number };
        expect(sessions.c).toBe(1735);

        // Baseline 89 approved questions + 7 approved during Phase 5/6 reviews
        const approved = db.prepare("SELECT COUNT(1) as c FROM questions WHERE status = 'approved' AND is_active = 1").get() as { c: number };
        expect(approved.c).toBe(96);

        // Verified staging pending questions count preserved (>= 111 baseline)
        const pending = db.prepare('SELECT COUNT(1) as c FROM pending_questions').get() as { c: number };
        expect(pending.c).toBeGreaterThanOrEqual(111);

        const pilotQuestions = db.prepare("SELECT COUNT(1) as c FROM questions WHERE id LIKE '%pilot%'").get() as { c: number };
        expect(pilotQuestions.c).toBe(0);
      } finally {
        db.close();
      }
    });
  });
});
