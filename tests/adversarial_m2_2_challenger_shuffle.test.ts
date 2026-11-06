/**
 * tests/adversarial_m2_2_challenger_shuffle.test.ts
 *
 * Empirical Adversarial & Statistical Verification Suite for Milestone M2.2:
 * Fisher-Yates Answer Shuffle Uniformity, Answer Preservation, Immutability & Fallback.
 *
 * Agent: o38_challenger_m2_2 (Empirical Challenger: critic & specialist)
 * Parent: Orchestrator 38 (7d3696b8-a969-4b09-b42f-70f8403fc08a)
 *
 * Verifications Covered:
 * 1. Answer preservation across 11,000+ total permutations (2, 4, 6 options, duplicate strings, dual-field).
 *    Strict checks: shuffled.question.options[shuffled.question.answer_index] === original_correct_option,
 *    shuffled.question.answer_idx === shuffled.question.answer_index,
 *    shuffled.new_answer_idx === shuffled.question.answer_index.
 * 2. PRNG Statistical Uniformity:
 *    - 2-option binomial/uniformity check (10,000 runs, df=1).
 *    - 4-option Chi-Square goodness-of-fit for positions (df=3, 24,000 runs) and permutations (df=23, 24,000 runs).
 *    - 6-option Chi-Square goodness-of-fit for positions (df=5, 60,000 runs).
 *    - Deterministic PRNG permutation mapping contract.
 * 3. Deep Immutability & Purity:
 *    - Object.freeze on question and options.
 *    - Error-path immutability when PRNG throws RangeError/TypeError.
 *    - Post-shuffle output mutation isolation.
 *    - Object.seal and Object.preventExtensions.
 * 4. Fallback Behavior when canShuffle() is false:
 *    - 0, 1, 3, 5 options, True/False fixed, Sentence reorder, Shared word bank, Shared passage,
 *      Multi-distractor Category 3, Negation Category 4, Mismatched Category 5, Ambiguous Category 5.
 *    - Strict identity mapping, shuffled: false, and reasons.
 * 5. Production Database Safety & Baseline Invariants:
 *    - SHA-256 of data/hsk_exam.db === DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1.
 *    - data/qbank/qbank.db: exam_sessions = 1699, approved active questions = 89.
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
  canShuffle,
  type ShuffleableQuestion,
} from '../src/server/utils/answerShuffle';

describe('Milestone M2.2 Challenger: Answer Preservation & PRNG Uniformity Verification', () => {

  // =========================================================================
  // 1. Answer Preservation across 1,000+ Permutations
  // =========================================================================
  describe('1. Empirical Answer Preservation across 1,000+ Permutations', () => {
    it('preserves correct answer across 5,000 random permutations for 4-option questions', () => {
      const N_RUNS = 5000;
      const originalOptions = ['北京', '上海', '广州', '深圳'];
      const targetAnswerIdx = 2; // '广州'
      const originalCorrectOption = originalOptions[targetAnswerIdx];

      const q: ShuffleableQuestion = {
        id: 'preservation_test_4opt',
        stem: '中国南方的重要港口城市是______。',
        options: [...originalOptions],
        answer_idx: targetAnswerIdx,
        answer_index: targetAnswerIdx,
      };

      for (let run = 0; run < N_RUNS; run++) {
        const res = shuffleQuestionAnswers(q);

        expect(res.shuffled).toBe(true);
        expect(res.original_answer_idx).toBe(targetAnswerIdx);

        // Core verification 1: options[answer_index] === original_correct_option
        expect(res.question.options[res.question.answer_index!]).toBe(originalCorrectOption);

        // Core verification 2: answer_idx === answer_index
        expect(res.question.answer_idx).toBe(res.question.answer_index);

        // Core verification 3: new_answer_idx === answer_index
        expect(res.new_answer_idx).toBe(res.question.answer_index);

        // Core verification 4: mapping bijection
        expect(res.mapping[targetAnswerIdx]).toBe(res.new_answer_idx);
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(targetAnswerIdx);
      }
    });

    it('preserves correct answer across 2,000 permutations for 2-option questions', () => {
      const N_RUNS = 2000;
      const originalOptions = ['夏天', '冬天'];
      const targetAnswerIdx = 1; // '冬天'
      const originalCorrectOption = originalOptions[targetAnswerIdx];

      const q: ShuffleableQuestion = {
        stem: '一年中最冷的季节通常是______。',
        options: [...originalOptions],
        answer_idx: targetAnswerIdx,
      };

      for (let run = 0; run < N_RUNS; run++) {
        const res = shuffleQuestionAnswers(q);

        expect(res.shuffled).toBe(true);
        expect(res.question.options[res.question.answer_index!]).toBe(originalCorrectOption);
        expect(res.question.answer_idx).toBe(res.question.answer_index);
        expect(res.new_answer_idx).toBe(res.question.answer_index);
        expect(res.mapping[targetAnswerIdx]).toBe(res.new_answer_idx);
      }
    });

    it('preserves correct answer across 3,000 permutations for 6-option questions', () => {
      const N_RUNS = 3000;
      const originalOptions = ['苹果', '香蕉', '西瓜', '橙子', '草莓', '葡萄'];
      const targetAnswerIdx = 4; // '草莓'
      const originalCorrectOption = originalOptions[targetAnswerIdx];

      const q: ShuffleableQuestion = {
        stem: '下面哪种水果通常是红色的？',
        options: [...originalOptions],
        answer_idx: targetAnswerIdx,
        answer_index: targetAnswerIdx,
      };

      for (let run = 0; run < N_RUNS; run++) {
        const res = shuffleQuestionAnswers(q);

        expect(res.shuffled).toBe(true);
        expect(res.question.options[res.question.answer_index!]).toBe(originalCorrectOption);
        expect(res.question.answer_idx).toBe(res.question.answer_index);
        expect(res.new_answer_idx).toBe(res.question.answer_index);
        expect(res.mapping[targetAnswerIdx]).toBe(res.new_answer_idx);
      }
    });

    it('preserves answer correctly with answer_idx only, answer_index only, and both', () => {
      const opts = ['Option A', 'Option B', 'Option C', 'Option D'];

      // Sub-case A: answer_idx only (1,000 runs)
      for (let i = 0; i < 1000; i++) {
        const qIdxOnly: ShuffleableQuestion = {
          stem: 'answer_idx only test',
          options: [...opts],
          answer_idx: 1, // 'Option B'
        };
        const res = shuffleQuestionAnswers(qIdxOnly);
        expect(res.question.options[res.question.answer_index!]).toBe('Option B');
        expect(res.question.answer_idx).toBe(res.question.answer_index);
      }

      // Sub-case B: answer_index only (1,000 runs)
      for (let i = 0; i < 1000; i++) {
        const qIndexOnly: ShuffleableQuestion = {
          stem: 'answer_index only test',
          options: [...opts],
          answer_index: 3, // 'Option D'
        };
        const res = shuffleQuestionAnswers(qIndexOnly);
        expect(res.question.options[res.question.answer_index!]).toBe('Option D');
        expect(res.question.answer_idx).toBe(res.question.answer_index);
      }
    });

    it('preserves answer slot tracking under duplicate option strings across 1,000 runs', () => {
      // Options containing duplicate words: indices 0 and 2 are identical '重复'
      const qDup: ShuffleableQuestion = {
        stem: 'Duplicate options tracking test',
        options: ['重复', '唯一', '重复', '不同'],
        answer_idx: 2, // specifically target the SECOND '重复' (original index 2)
      };

      for (let run = 0; run < 1000; run++) {
        const res = shuffleQuestionAnswers(qDup);
        expect(res.question.options[res.new_answer_idx]).toBe('重复');
        expect(res.mapping[2]).toBe(res.new_answer_idx);
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(2);

        // Bijection invariant: exactly 4 unique target slots
        const mappedSet = new Set(res.mapping);
        expect(mappedSet.size).toBe(4);
      }
    });
  });

  // =========================================================================
  // 2. PRNG Statistical Uniformity (Chi-Square Goodness-of-Fit)
  // =========================================================================
  describe('2. PRNG Statistical Uniformity & Chi-Square Tests', () => {
    it('verifies 2-option uniform distribution (df=1, 10,000 iterations, p > 0.01)', () => {
      const N = 10000;
      const q: ShuffleableQuestion = {
        stem: '2-option binary test',
        options: ['Yes', 'No'],
        answer_idx: 0,
      };

      const counts = [0, 0];
      for (let i = 0; i < N; i++) {
        const res = shuffleQuestionAnswers(q);
        counts[res.new_answer_idx]++;
      }

      const expected = N / 2; // 5000
      const chiSquare = Math.pow(counts[0] - expected, 2) / expected +
                        Math.pow(counts[1] - expected, 2) / expected;

      // Chi-square critical value for df = 1 at alpha = 0.01 is 6.635
      expect(chiSquare).toBeLessThan(6.635);

      // Percentage within 50% ± 2.5%
      expect(counts[0] / N).toBeGreaterThanOrEqual(0.475);
      expect(counts[0] / N).toBeLessThanOrEqual(0.525);
    });

    it('verifies 4-option position and permutation uniformity (df=3 & df=23, 24,000 iterations)', () => {
      const N = 24000;
      const q: ShuffleableQuestion = {
        stem: '4-option chi-square test',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
      };

      const posCounts = [0, 0, 0, 0];
      const permCounts: Record<string, number> = {};

      for (let i = 0; i < N; i++) {
        const res = shuffleQuestionAnswers(q);
        posCounts[res.new_answer_idx]++;
        const pKey = res.question.options.join(',');
        permCounts[pKey] = (permCounts[pKey] || 0) + 1;
      }

      // 1. Position Uniformity (df = 3, critical alpha=0.001 is 16.27)
      const expectedPos = N / 4; // 6000
      let chiSquarePos = 0;
      for (let p = 0; p < 4; p++) {
        chiSquarePos += Math.pow(posCounts[p] - expectedPos, 2) / expectedPos;
        // Each position within 25.0% ± 1.5% (23.5% to 26.5%)
        expect(posCounts[p] / N).toBeGreaterThanOrEqual(0.235);
        expect(posCounts[p] / N).toBeLessThanOrEqual(0.265);
      }
      expect(chiSquarePos).toBeLessThan(16.27);

      // 2. Permutation Uniformity (4! = 24 permutations, df = 23, critical alpha=0.001 is 49.73)
      const uniquePerms = Object.keys(permCounts);
      expect(uniquePerms.length).toBe(24); // All 24 observed

      const expectedPerm = N / 24; // 1000 per permutation
      let chiSquarePerm = 0;
      for (const k of uniquePerms) {
        chiSquarePerm += Math.pow(permCounts[k] - expectedPerm, 2) / expectedPerm;
        // Every permutation should be reasonably populated (e.g. 750 to 1250)
        expect(permCounts[k]).toBeGreaterThan(750);
        expect(permCounts[k]).toBeLessThan(1250);
      }
      expect(chiSquarePerm).toBeLessThan(49.73);
    });

    it('verifies 6-option position uniformity (df=5, 60,000 iterations, critical alpha=0.001 is 20.52)', () => {
      const N = 60000;
      const q: ShuffleableQuestion = {
        stem: '6-option position uniformity test',
        options: ['1', '2', '3', '4', '5', '6'],
        answer_idx: 0,
      };

      const posCounts = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < N; i++) {
        const res = shuffleQuestionAnswers(q);
        posCounts[res.new_answer_idx]++;
      }

      const expectedPos = N / 6; // 10,000
      let chiSquarePos = 0;
      for (let p = 0; p < 6; p++) {
        chiSquarePos += Math.pow(posCounts[p] - expectedPos, 2) / expectedPos;
        // Each position within 16.67% ± 1.2% (15.47% to 17.87%)
        const ratio = posCounts[p] / N;
        expect(ratio).toBeGreaterThanOrEqual(0.154);
        expect(ratio).toBeLessThanOrEqual(0.179);
      }

      // Chi-square critical value for df = 5 at alpha = 0.001 is 20.52
      expect(chiSquarePos).toBeLessThan(20.52);
    });

    it('strictly enforces PRNG contract with custom deterministic generator', () => {
      const options = ['A', 'B', 'C', 'D'];

      // Deterministic PRNG cycling [0.25, 0.5, 0.75]
      const seq = [0.25, 0.5, 0.75];
      let callCount = 0;
      const deterministicRng = () => {
        const val = seq[callCount % seq.length];
        callCount++;
        return val;
      };

      const res = shuffleOptionsArray(options, deterministicRng);
      expect(res.shuffled).toHaveLength(4);
      expect(new Set(res.shuffled).size).toBe(4);
      expect(callCount).toBe(3); // n - 1 = 3 swaps
    });

    it('rejects invalid PRNG values with strict TypeErrors and RangeErrors', () => {
      const opts = ['A', 'B', 'C', 'D'];

      // RangeError on values out of [0, 1)
      expect(() => shuffleOptionsArray(opts, () => 1.0)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(opts, () => 1.000000000001)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(opts, () => -0.00000000001)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(opts, () => -1)).toThrow(RangeError);

      // TypeError on non-finite or non-numbers
      expect(() => shuffleOptionsArray(opts, () => NaN)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(opts, () => Infinity)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(opts, () => -Infinity)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(opts, () => '0.5' as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(opts, () => null as any)).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 3. Absolute Immutability & Purity
  // =========================================================================
  describe('3. Absolute Immutability & Input Protection', () => {
    it('guarantees deep immutability when input question and options are Object.freeze()d', () => {
      const frozenOptions = Object.freeze(['Opt0', 'Opt1', 'Opt2', 'Opt3']);
      const frozenMetadata = Object.freeze({ level: 3, skill: 'reading' });
      const q: ShuffleableQuestion = Object.freeze({
        id: 'frozen_q_01',
        stem: 'Frozen question stem',
        options: frozenOptions as unknown as string[],
        answer_idx: 1,
        explanation_vi: 'Đáp án đúng là B: giải thích.',
        metadata: frozenMetadata,
      });

      expect(() => {
        const res = shuffleQuestionAnswers(q);

        // Verification of clones
        expect(res.question).not.toBe(q);
        expect(res.question.options).not.toBe(frozenOptions);

        // Verification that original values are completely intact
        expect(q.options[1]).toBe('Opt1');
        expect(q.answer_idx).toBe(1);
        expect(q.explanation_vi).toBe('Đáp án đúng là B: giải thích.');
      }).not.toThrow();
    });

    it('guarantees immutability when an error occurs during shuffle', () => {
      const rawOptions = ['A', 'B', 'C', 'D'];
      const frozenInput = Object.freeze([...rawOptions]);

      expect(() => {
        shuffleOptionsArray(frozenInput as unknown as string[], () => 1.5);
      }).toThrow(RangeError);

      expect(frozenInput).toEqual(rawOptions);
    });

    it('isolates mutations made to returned question object from affecting original question', () => {
      const originalOptions = ['One', 'Two', 'Three', 'Four'];
      const q: ShuffleableQuestion = {
        stem: 'Isolation test',
        options: [...originalOptions],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(q);

      // Mutate returned output aggressively
      res.question.options.push('InjectedOption');
      (res.question as any).answer_idx = 999;
      (res.question as any).stem = 'Modified stem';

      // Original must be completely unaffected
      expect(q.options).toEqual(originalOptions);
      expect(q.options.length).toBe(4);
      expect(q.answer_idx).toBe(0);
      expect(q.stem).toBe('Isolation test');
    });

    it('works safely on Object.seal() and Object.preventExtensions() inputs', () => {
      const sealedQ = Object.seal({
        stem: 'Sealed test',
        options: ['1', '2', '3', '4'],
        answer_idx: 2,
      });

      expect(() => {
        const res = shuffleQuestionAnswers(sealedQ);
        expect(res.shuffled).toBe(true);
        expect(res.question.options[res.new_answer_idx]).toBe('3');
      }).not.toThrow();

      const nonExtensibleQ = Object.preventExtensions({
        stem: 'Non-extensible test',
        options: ['X', 'Y', 'Z', 'W'],
        answer_idx: 1,
      });

      expect(() => {
        const res = shuffleQuestionAnswers(nonExtensibleQ);
        expect(res.shuffled).toBe(true);
        expect(res.question.options[res.new_answer_idx]).toBe('Y');
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 4. Fallback Behavior when canShuffle() is false
  // =========================================================================
  describe('4. Comprehensive Fallback Behavior when canShuffle is false', () => {
    // Helper to verify standard fallback contract
    function verifyFallbackContract(
      inputQ: ShuffleableQuestion,
      expectedCategory: number,
      expectedReasonSubstring?: string
    ) {
      const originalOptionsCopy = Array.isArray(inputQ.options) ? [...inputQ.options] : [];
      const rawExpectedAnswerIdx =
        typeof inputQ.answer_index === 'number'
          ? inputQ.answer_index
          : typeof inputQ.answer_idx === 'number'
            ? inputQ.answer_idx
            : -1;

      const guard = canShuffle(inputQ);
      expect(guard.canShuffle).toBe(false);
      expect(guard.category).toBe(expectedCategory);
      if (expectedReasonSubstring) {
        expect(guard.reason).toContain(expectedReasonSubstring);
      }

      const res = shuffleQuestionAnswers(inputQ);
      expect(res.shuffled).toBe(false);
      expect(res.shuffle_reason).toBe(guard.reason);
      expect(res.question.options).toEqual(originalOptionsCopy);
      expect(res.mapping).toEqual(originalOptionsCopy.map((_, i) => i)); // Identity mapping!
      expect(res.original_answer_idx).toBe(rawExpectedAnswerIdx);
      expect(res.new_answer_idx).toBe(rawExpectedAnswerIdx);
      expect(res.question.answer_idx).toBe(rawExpectedAnswerIdx);
      expect(res.question.answer_index).toBe(rawExpectedAnswerIdx);
      expect(res.question.explanation_vi).toBe(inputQ.explanation_vi);
    }

    it('falls back safely on 0 options (writing/open-ended)', () => {
      const q0: ShuffleableQuestion = {
        stem: 'HSK Writing task',
        options: [],
        answer_idx: -1,
      };
      const res0 = shuffleQuestionAnswers(q0);
      expect(res0.shuffled).toBe(false);
      expect(res0.question.options).toEqual([]);
      expect(res0.new_answer_idx).toBe(-1);
      expect(res0.mapping).toEqual([]);
    });

    it('falls back safely on 1 option', () => {
      const q1: ShuffleableQuestion = {
        stem: 'Single option prompt',
        options: ['Only'],
        answer_idx: 0,
      };
      const res1 = shuffleQuestionAnswers(q1);
      expect(res1.shuffled).toBe(false);
      expect(res1.question.options).toEqual(['Only']);
      expect(res1.new_answer_idx).toBe(0);
      expect(res1.mapping).toEqual([0]);
    });

    it('shuffles 3-option questions successfully and falls back safely on 5-option and 7-option questions', () => {
      const q3: ShuffleableQuestion = {
        stem: '3-option question',
        options: ['A', 'B', 'C'],
        answer_idx: 1,
        explanation_vi: 'Giải thích ngữ nghĩa không chứa chữ cái.',
      };
      const res3 = shuffleQuestionAnswers(q3, () => 0.5);
      expect(res3.shuffled).toBe(true);
      expect(res3.question.options.length).toBe(3);

      const q5: ShuffleableQuestion = {
        stem: '5-option question',
        options: ['A', 'B', 'C', 'D', 'E'],
        answer_idx: 2,
      };
      verifyFallbackContract(q5, 5, 'Unsupported option count');

      const q7: ShuffleableQuestion = {
        stem: '7-option question',
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        answer_idx: 3,
      };
      verifyFallbackContract(q7, 5, 'Unsupported option count');
    });

    it('falls back safely on fixed-order True/False ["对", "错"] and ["正确", "错误"]', () => {
      const qTF1: ShuffleableQuestion = {
        stem: '飞机比火车快。',
        options: ['对', '错'],
        answer_idx: 0,
      };
      verifyFallbackContract(qTF1, 5, 'Fixed order True/False question');

      const qTF2: ShuffleableQuestion = {
        stem: '今天天气很好。',
        options: ['正确', '错误'],
        answer_idx: 1,
      };
      verifyFallbackContract(qTF2, 5, 'Fixed order True/False question');
    });

    it('falls back safely on fixed-order sentence reordering question types', () => {
      const qReorder: ShuffleableQuestion = {
        stem: 'Sắp xếp câu:',
        options: ['去', '我想', '北京', '明天'],
        answer_idx: 0,
        part_type: 'read_reorder_sentence',
      };
      verifyFallbackContract(qReorder, 5, 'Fixed order question type');
    });

    it('falls back safely on shared word bank A-F groups', () => {
      const qWordBank: ShuffleableQuestion = {
        stem: 'Fill in blank with word bank',
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 0,
        part_type: 'read_fill_blank_word_bank',
      };
      verifyFallbackContract(qWordBank, 5, 'Shared word bank A-F group');
    });

    it('falls back safely on shared passage groups', () => {
      const qPassage: ShuffleableQuestion = {
        stem: 'Passage sub-question',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 1,
        is_shared_passage_group: true,
      };
      verifyFallbackContract(qPassage, 5, 'Shared group restriction');
    });

    it('falls back safely on Category 3 multi-distractor explanation breakdowns', () => {
      const qMultiDistractor: ShuffleableQuestion = {
        stem: 'Multi-distractor test',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A. B sai vì là danh từ. C sai vì là tính từ.',
      };
      verifyFallbackContract(qMultiDistractor, 3, 'Group 3: Multi-distractor explanation');
    });

    it('falls back safely on Category 4 negation and elimination phrasing', () => {
      const qNegation: ShuffleableQuestion = {
        stem: 'Negation test',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        explanation_vi: 'Không nên chọn A vì ngữ cảnh yêu cầu địa điểm.',
      };
      verifyFallbackContract(qNegation, 4, 'Group 4: Explanation contains negation/elimination');
    });

    it('falls back safely on Category 5 mismatched letter designations', () => {
      const qMismatch: ShuffleableQuestion = {
        stem: 'Mismatch test',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0, // Option A
        explanation_vi: 'Đáp án đúng là B vì đây là động từ.', // Mentions B
      };
      verifyFallbackContract(qMismatch, 5, 'does not match correct answer');
    });

    it('falls back safely on Category 5 ambiguous explanation structures', () => {
      const qAmbiguous: ShuffleableQuestion = {
        stem: 'Ambiguous test',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        explanation_vi: 'Phương án A có thể cần chú ý trong văn cảnh lịch sử.',
      };
      verifyFallbackContract(qAmbiguous, 5, 'Ambiguous explanation structure');
    });
  });

  // =========================================================================
  // 5. Database Safety & Invariant Verification
  // =========================================================================
  describe('5. Production Database Safety & Baseline Invariants', () => {
    const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

    it('verifies data/hsk_exam.db SHA-256 remains strictly DC299C49... (0 mutations)', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const buffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const actualHash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(actualHash).toBe(EXPECTED_HASH);
    });

    it('verifies data/qbank/qbank.db preserves baseline counts (sessions>=1699, approved>=89)', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        const sessions = db.prepare('SELECT COUNT(1) as c FROM exam_sessions').get() as { c: number };
        expect(sessions.c).toBeGreaterThanOrEqual(1699);

        const approved = db.prepare(
          "SELECT COUNT(1) as c FROM questions WHERE status = 'approved' AND is_active = 1"
        ).get() as { c: number };
        expect(approved.c).toBeGreaterThanOrEqual(89);
      } finally {
        db.close();
      }
    });
  });
});
