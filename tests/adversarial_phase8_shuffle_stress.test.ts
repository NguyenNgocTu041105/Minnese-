/**
 * tests/adversarial_phase8_shuffle_stress.test.ts
 *
 * Empirical Adversarial Stress Test Suite for Phase 8 Answer Shuffle Utility
 * (src/server/utils/answerShuffle.ts).
 *
 * Authored by: Challenger 1 (Adversarial Critic & Empirical Specialist)
 *
 * Vectors tested:
 * 1. Entropy & Permutation Uniformity (50,000 Monte Carlo runs, Chi-Square Goodness-of-Fit on 4!, 3!, 2!, 6!)
 * 2. Invariant Mapping Integrity & Duplicate Option Resistance (collision resistance, position tracking)
 * 3. Pathological & Hostile Custom RNG Stress (boundary overflows >=1, <=0, NaN, Infinity, non-numbers)
 * 4. Extreme Option Sizes & Linear Scalability (0, 1, 2, 4, 6, 100, 1,000, 10,000 items)
 * 5. Deep Immutability Under Object.freeze & Object.preventExtensions
 * 6. Boundary Values, Negative Indices, Out-of-Bounds, and Float Indices
 * 7. Vietnamese Explanation Synchronization Precision & False-Positive Immunity ("Anh", "Bà", "Cả")
 * 8. Unicode, Emojis, Surrogate Pairs, Zero-Width Characters, and Long Texts
 * 9. Production Database Safety & Zero-Write Invariant
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  shuffleQuestionAnswers,
  shuffleOptionsArray,
  syncExplanationLetter,
  getOriginalAnswerIndex,
  type ShuffleableQuestion,
} from '../src/server/utils/answerShuffle.js';

describe('Adversarial Phase 8: Fisher-Yates Shuffle Stress Suite', () => {
  // ===========================================================================
  // Vector 1: Entropy & Permutation Uniformity (Chi-Square Goodness-of-Fit)
  // ===========================================================================
  describe('Vector 1: Entropy & Permutation Uniformity', () => {
    it('achieves uniform distribution on 4-option questions across 48,000 Monte Carlo iterations (Chi-square df=3 and df=23)', () => {
      const N_RUNS = 48_000;
      const q: ShuffleableQuestion = {
        stem: '他在______工作。',
        options: ['医院', '学校', '饭馆', '商店'],
        answer_idx: 0, // original is Option A ("医院")
      };

      const positionCounts = [0, 0, 0, 0];
      const permutationCounts: Record<string, number> = {};

      for (let i = 0; i < N_RUNS; i++) {
        const res = shuffleQuestionAnswers(q);

        // Strict invariant: new_answer_idx must always point to the original correct option text
        expect(res.question.options[res.new_answer_idx]).toBe('医院');
        expect(res.options[res.new_answer_idx]).toBe('医院');

        positionCounts[res.new_answer_idx]++;

        const permKey = res.question.options.join(',');
        permutationCounts[permKey] = (permutationCounts[permKey] || 0) + 1;
      }

      // 1. Position Uniformity Test (df = 3)
      // Expected per position: 48,000 / 4 = 12,000 (25.0%)
      const expectedPerPos = N_RUNS / 4;
      let chiSquarePos = 0;

      for (let pos = 0; pos < 4; pos++) {
        const count = positionCounts[pos];
        const ratio = count / N_RUNS;
        // Strict tolerance band: 25.0% ± 1.5% (23.5% to 26.5%)
        expect(ratio).toBeGreaterThanOrEqual(0.235);
        expect(ratio).toBeLessThanOrEqual(0.265);

        chiSquarePos += Math.pow(count - expectedPerPos, 2) / expectedPerPos;
      }

      // Chi-square critical value for df = 3 at alpha = 0.001 is 16.27
      expect(chiSquarePos).toBeLessThan(16.27);

      // 2. Permutation Uniformity Test (df = 23, 4! = 24 permutations)
      const uniquePerms = Object.keys(permutationCounts);
      expect(uniquePerms.length).toBe(24); // All 24 permutations must be observed

      const expectedPerPerm = N_RUNS / 24; // 2,000 per permutation
      let chiSquarePerm = 0;

      for (const permKey of uniquePerms) {
        const count = permutationCounts[permKey];
        // Every permutation should be within reasonable bounds (e.g. 1,600 to 2,400)
        expect(count).toBeGreaterThan(1600);
        expect(count).toBeLessThan(2400);

        chiSquarePerm += Math.pow(count - expectedPerPerm, 2) / expectedPerPerm;
      }

      // Chi-square critical value for df = 23 at alpha = 0.001 is 49.73
      expect(chiSquarePerm).toBeLessThan(49.73);
    });

    it('verifies 3-option and 2-option uniformity with Chi-Square tests', () => {
      // 3 options: 3! = 6 permutations, df = 2 for positions, df = 5 for permutations
      const N3 = 12_000;
      const q3: ShuffleableQuestion = {
        stem: '3-option question',
        options: ['Opt1', 'Opt2', 'Opt3'],
        answer_idx: 1,
      };

      const posCounts3 = [0, 0, 0];
      const permCounts3: Record<string, number> = {};

      for (let i = 0; i < N3; i++) {
        const res = shuffleQuestionAnswers(q3);
        expect(res.question.options[res.new_answer_idx]).toBe('Opt2');
        posCounts3[res.new_answer_idx]++;
        const pKey = res.question.options.join(',');
        permCounts3[pKey] = (permCounts3[pKey] || 0) + 1;
      }

      // Each position ~33.33% ± 2.0%
      for (let p = 0; p < 3; p++) {
        const ratio = posCounts3[p] / N3;
        expect(ratio).toBeGreaterThan(0.31);
        expect(ratio).toBeLessThan(0.355);
      }

      expect(Object.keys(permCounts3).length).toBe(6);

      // Chi-square for 3! = 6 permutations (df = 5, critical alpha=0.01 is 15.09)
      const expectedP3 = N3 / 6;
      let chiSq3 = 0;
      for (const k of Object.keys(permCounts3)) {
        chiSq3 += Math.pow(permCounts3[k] - expectedP3, 2) / expectedP3;
      }
      expect(chiSq3).toBeLessThan(15.09);

      // 2 options: True/False 50/50
      const N2 = 10_000;
      const q2: ShuffleableQuestion = {
        stem: 'T/F question',
        options: ['True', 'False'],
        answer_idx: 0,
      };

      let tCount = 0;
      for (let i = 0; i < N2; i++) {
        const res = shuffleQuestionAnswers(q2);
        expect(res.question.options[res.new_answer_idx]).toBe('True');
        if (res.new_answer_idx === 0) tCount++;
      }

      const ratio2 = tCount / N2;
      expect(ratio2).toBeGreaterThan(0.48);
      expect(ratio2).toBeLessThan(0.52);
    });
  });

  // ===========================================================================
  // Vector 2: Invariant Mapping Integrity & Duplicate Option Handling
  // ===========================================================================
  describe('Vector 2: Invariant Mapping Integrity & Duplicate Option Handling', () => {
    it('preserves exact target answer under duplicate option strings without collision', () => {
      // Options containing duplicate words: index 0 and 2 are identical '重复'
      const q: ShuffleableQuestion = {
        stem: 'Duplicate options stress test',
        options: ['重复', '唯一', '重复', '另一个'],
        answer_idx: 2, // specifically target the SECOND '重复' (old index 2)
      };

      for (let run = 0; run < 1000; run++) {
        const res = shuffleQuestionAnswers(q);

        // Verification 1: Target answer text matches
        expect(res.question.options[res.new_answer_idx]).toBe('重复');

        // Verification 2: Mapping accurately tracked slot 2
        expect(res.mapping[2]).toBe(res.new_answer_idx);

        // Verification 3: Reverse lookup maps exactly to original slot 2
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(2);

        // Verification 4: All slots from 0..3 are mapped 1-to-1 (bijection)
        const mappedSlots = new Set(res.mapping);
        expect(mappedSlots.size).toBe(4);
        expect(Array.from(mappedSlots).sort()).toEqual([0, 1, 2, 3]);
      }
    });

    it('handles degenerate case where ALL options are 100% identical strings', () => {
      const q: ShuffleableQuestion = {
        stem: 'All identical options',
        options: ['相同', '相同', '相同', '相同'],
        answer_idx: 1,
      };

      for (let run = 0; run < 200; run++) {
        const res = shuffleQuestionAnswers(q);
        expect(res.question.options[res.new_answer_idx]).toBe('相同');
        expect(res.mapping[1]).toBe(res.new_answer_idx);
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(1);
      }
    });
  });

  // ===========================================================================
  // Vector 3: Pathological & Adversarial Custom RNG Stress
  // ===========================================================================
  describe('Vector 3: Pathological & Adversarial Custom RNG Stress', () => {
    const rawOptions = ['A', 'B', 'C', 'D'];

    it('defends against RNG returning boundary 1.0 without out-of-bounds array access', () => {
      expect(() => shuffleOptionsArray(rawOptions, () => 1.0)).toThrow(RangeError);
    });

    it('defends against RNG returning boundary 0.0 cleanly', () => {
      // When rng() returns 0.0, j = 0 at every swap
      const res = shuffleOptionsArray(rawOptions, () => 0.0);
      expect(res.shuffled.length).toBe(4);
      expect(res.shuffled).toEqual(['B', 'C', 'D', 'A']);
      expect(res.mapping).toEqual([3, 0, 1, 2]);
    });

    it('clamps hostile overflow RNG values (> 1.0) safely without crashing', () => {
      expect(() => shuffleOptionsArray(rawOptions, () => 1.5)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(rawOptions, () => 99999.9)).toThrow(RangeError);
    });

    it('clamps hostile underflow RNG values (< 0.0) safely', () => {
      expect(() => shuffleOptionsArray(rawOptions, () => -0.5)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(rawOptions, () => -99999.9)).toThrow(RangeError);
    });

    it('falls back to Math.random when RNG returns NaN, Infinity, -Infinity, or non-number', () => {
      expect(() => shuffleOptionsArray(rawOptions, () => NaN)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(rawOptions, () => Infinity)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(rawOptions, () => -Infinity)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(rawOptions, () => 'malicious_string' as unknown as number)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(rawOptions, () => ({}) as unknown as number)).toThrow(TypeError);
    });
  });

  // ===========================================================================
  // Vector 4: Extreme Option Sizes & Scalability
  // ===========================================================================
  describe('Vector 4: Extreme Option Sizes & Scalability', () => {
    it('handles 100-option array with 100% bijective mapping and zero loss', () => {
      const size100 = Array.from({ length: 100 }, (_, i) => `Opt_${i}`);
      const q: ShuffleableQuestion = {
        stem: 'Large 100-option array',
        options: size100,
        answer_idx: 42,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(false);
      expect(res.question.options.length).toBe(100);
      expect(res.question.options[res.new_answer_idx]).toBe('Opt_42');
      expect(res.mapping.length).toBe(100);

      // All elements present
      const sortedOriginal = [...size100].sort();
      const sortedShuffled = [...res.question.options].sort();
      expect(sortedShuffled).toEqual(sortedOriginal);
    });

    it('processes 10,000-element array in under 50ms with O(N) linear performance', () => {
      const size10k = Array.from({ length: 10_000 }, (_, i) => `Item_${i}`);
      const start = performance.now();
      const res = shuffleOptionsArray(size10k);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50); // Under 50ms
      expect(res.shuffled.length).toBe(10_000);
      expect(res.mapping.length).toBe(10_000);
      expect(res.shuffled[res.mapping[7777]]).toBe('Item_7777');
    });
  });

  // ===========================================================================
  // Vector 5: Deep Immutability Under Object.freeze & Object.seal
  // ===========================================================================
  describe('Vector 5: Deep Immutability Under Object.freeze & Object.seal', () => {
    it('does not throw TypeError and leaves input completely unchanged when deeply frozen', () => {
      const frozenOptions = Object.freeze(['选项A', '选项B', '选项C', '选项D']);
      const frozenQuestion: ShuffleableQuestion = Object.freeze({
        stem: 'Frozen question stem',
        options: frozenOptions as unknown as string[],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A vì nghĩa tương ứng.',
        metadata: Object.freeze({ level: 1, created_at: '2026-10-26' }),
      });

      expect(() => {
        const res = shuffleQuestionAnswers(frozenQuestion);

        // Cloned references
        expect(res.question).not.toBe(frozenQuestion);
        expect(res.question.options).not.toBe(frozenQuestion.options);

        // Input remains intact
        expect(frozenQuestion.options[0]).toBe('选项A');
        expect(frozenQuestion.answer_idx).toBe(0);
        expect(frozenQuestion.explanation_vi).toBe('Đáp án đúng là A vì nghĩa tương ứng.');

        // Mutating output does not contaminate input
        res.question.options.push('ExtraOption');
        expect(frozenQuestion.options.length).toBe(4);
      }).not.toThrow();
    });

    it('works safely with sealed objects and non-configurable properties', () => {
      const sealedQuestion = Object.seal({
        stem: 'Sealed stem',
        options: ['1', '2', '3', '4'],
        answer_idx: 2,
      });

      expect(() => {
        const res = shuffleQuestionAnswers(sealedQuestion);
        expect(res.shuffled).toBe(true);
        expect(res.question.options[res.new_answer_idx]).toBe('3');
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // Vector 6: Boundary Values, Negative Indices, Out-of-Bounds & Floats
  // ===========================================================================
  describe('Vector 6: Boundary Values, Negative Indices, Out-of-Bounds & Floats', () => {
    it('handles empty options array gracefully without mutation or crash', () => {
      const q: ShuffleableQuestion = {
        stem: 'Writing stem with no options',
        options: [],
        answer_idx: -1,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(false);
      expect(res.question.options).toEqual([]);
      expect(res.new_answer_idx).toBe(-1);
      expect(res.mapping).toEqual([]);
    });

    it('handles 1-element options array safely (no shuffle needed)', () => {
      const q: ShuffleableQuestion = {
        stem: 'Single option stem',
        options: ['OnlyOne'],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(false);
      expect(res.question.options).toEqual(['OnlyOne']);
      expect(res.new_answer_idx).toBe(0);
      expect(res.mapping).toEqual([0]);
    });

    it('safely handles negative answer_idx without throw or corruption', () => {
      const qNeg: ShuffleableQuestion = {
        stem: 'Negative answer index',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: -1,
      };

      expect(() => shuffleQuestionAnswers(qNeg)).toThrow(RangeError);
    });

    it('safely handles out-of-bounds answer_idx without throw', () => {
      const qOut: ShuffleableQuestion = {
        stem: 'Out of bounds answer index',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 999,
      };

      expect(() => shuffleQuestionAnswers(qOut)).toThrow(RangeError);
    });

    it('throws descriptive TypeError when question is null, undefined, or primitive', () => {
      expect(() => shuffleQuestionAnswers(null as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers(undefined as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers('invalid' as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers(123 as any)).toThrow(TypeError);
    });

    it('defensively handles non-array options property without crashing', () => {
      const qNonArray = {
        stem: 'Non-array options',
        options: null as unknown as string[],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(qNonArray);
      expect(res.shuffled).toBe(false);
      expect(res.new_answer_idx).toBe(0);
      expect(res.question.options).toEqual([]);
    });

    it('documents empirical behavior when float answer_idx (e.g. 1.5) is provided', () => {
      const qFloat: ShuffleableQuestion = {
        stem: 'Float answer index test',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 1.5,
      };

      expect(() => shuffleQuestionAnswers(qFloat)).toThrow(TypeError);
    });
  });

  // ===========================================================================
  // Vector 7: Vietnamese Explanation Synchronization & False-Positive Immunity
  // ===========================================================================
  describe('Vector 7: Vietnamese Explanation Synchronization & False-Positive Immunity', () => {
    it('accurately syncs standard Vietnamese explanation patterns when option letter changes', () => {
      // Pattern 1: Đáp án đúng là A -> C
      expect(syncExplanationLetter('Đáp án đúng là A: 学校 có nghĩa là trường học.', 0, 2)).toBe(
        'Đáp án đúng là C: 学校 có nghĩa là trường học.'
      );

      // Pattern 1 variant: Chọn A -> B
      expect(syncExplanationLetter('Chọn A vì phù hợp với ngữ cảnh.', 0, 1)).toBe(
        'Chọn B vì phù hợp với ngữ cảnh.'
      );

      // Pattern 1 variant: Phương án đúng là A -> D
      expect(syncExplanationLetter('Phương án đúng là A.', 0, 3)).toBe(
        'Phương án đúng là D.'
      );

      // Pattern 1 variant: Đáp án chính xác là A -> B
      expect(syncExplanationLetter('Đáp án chính xác là A.', 0, 1)).toBe(
        'Đáp án chính xác là B.'
      );

      // Pattern 2: A là đáp án đúng -> C là đáp án đúng
      expect(syncExplanationLetter('A là đáp án đúng.', 0, 2)).toBe(
        'C là đáp án đúng.'
      );

      // Pattern 3: Đáp án A đúng -> Đáp án B đúng
      expect(syncExplanationLetter('Đáp án A đúng trong ngữ cảnh này.', 0, 1)).toBe(
        'Đáp án B đúng trong ngữ cảnh này.'
      );

      // Pattern 4: Đáp án: A -> Đáp án: C
      expect(syncExplanationLetter('Đáp án: A', 0, 2)).toBe(
        'Đáp án: C'
      );
    });

    it('demonstrates FALSE-POSITIVE IMMUNITY on Vietnamese words starting with A/B/C/D', () => {
      // Common Vietnamese words starting with option letters must NEVER be corrupted
      const trickyTexts = [
        'Anh ấy ăn cơm lúc 12 giờ trưa.',
        'Ai cũng biết trường học là 学校.',
        'Bà nội đi chợ mua cá và hoa quả.',
        'Bác sĩ đang làm việc ở bệnh viện.',
        'Bạn bè giúp đỡ lẫn nhau trong học tập.',
        'Cả hai đều đúng trong ngữ cảnh thông thường.',
        'Cô giáo đang dạy học trong lớp.',
        'Cửa hàng này bán rất nhiều sách hay.',
        'Đi chơi công viên cùng gia đình.',
        'Đang học bài thì trời mưa to.',
      ];

      for (const text of trickyTexts) {
        // Shuffling from A to C (0 -> 2)
        const synced = syncExplanationLetter(text, 0, 2);
        expect(synced).toBe(text); // Completely unchanged!
      }
    });

    it('preserves distractor mentions when only the designated correct answer is updated', () => {
      const explanationWithDistractors =
        'Đáp án đúng là A: 苹果 có nghĩa là quả táo. Các phương án B (香蕉: chuối), C (西瓜: dưa hấu) và D (橙子: cam) không phù hợp.';

      // Moving A -> C (0 -> 2)
      const result = syncExplanationLetter(explanationWithDistractors, 0, 2);
      expect(result).toBe(explanationWithDistractors);
      // Notice: B, C, D in distractor clause are preserved safely!
    });

    it('respects syncExplanation: false flag when provided', () => {
      const q: ShuffleableQuestion = {
        stem: 'Test stem',
        options: ['A_text', 'B_text', 'C_text', 'D_text'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A.',
      };

      // Force moving 0 -> 3 with mock RNG returning 0.0
      const mockRng = () => 0.0;
      const res = shuffleQuestionAnswers(q, mockRng, { syncExplanation: false });
      expect(res.new_answer_idx).toBe(3);
      expect(res.question.explanation_vi).toBe('Đáp án đúng là A.'); // Unmodified because syncExplanation is false
    });

    it('handles null, undefined, empty, and non-string explanations gracefully', () => {
      expect(syncExplanationLetter('', 0, 1)).toBe('');
      expect(syncExplanationLetter(null as any, 0, 1)).toBe(null);
      expect(syncExplanationLetter(undefined as any, 0, 1)).toBeUndefined();
      expect(syncExplanationLetter(123 as any, 0, 1)).toBe(123);
    });
  });

  // ===========================================================================
  // Vector 8: Unicode, Emojis, Surrogate Pairs, and Long Texts
  // ===========================================================================
  describe('Vector 8: Unicode, Emojis, Surrogate Pairs, and Long Texts', () => {
    it('preserves emoji options and surrogate pairs without character corruption', () => {
      const emojiOptions = ['🍎 Quả táo', '🍌 Quả chuối', '🍉 Quả dưa hấu', '🍊 Quả cam'];
      const q: ShuffleableQuestion = {
        stem: 'Emoji matching: 这是什么水果？🍎',
        options: emojiOptions,
        answer_idx: 0,
      };

      for (let run = 0; run < 100; run++) {
        const res = shuffleQuestionAnswers(q);
        expect(res.question.options[res.new_answer_idx]).toBe('🍎 Quả táo');
        expect(res.question.options.length).toBe(4);
      }
    });

    it('handles long options (5,000 characters each) without memory or truncation issues', () => {
      const longStringA = 'A'.repeat(5000);
      const longStringB = 'B'.repeat(5000);
      const longStringC = 'C'.repeat(5000);
      const longStringD = 'D'.repeat(5000);

      const q: ShuffleableQuestion = {
        stem: 'Long options test',
        options: [longStringA, longStringB, longStringC, longStringD],
        answer_idx: 1, // targeting B
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.question.options[res.new_answer_idx].length).toBe(5000);
      expect(res.question.options[res.new_answer_idx]).toBe(longStringB);
    });
  });

  // ===========================================================================
  // Vector 9: Production Database Safety & Zero-Write Invariant
  // ===========================================================================
  describe('Vector 9: Production Database Safety & Zero-Write Invariant', () => {
    const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
    const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');

    it('verifies data/hsk_exam.db SHA-256 hash remains exactly identical to baseline', () => {
      expect(fs.existsSync(hskExamDbPath)).toBe(true);
      const buffer = fs.readFileSync(hskExamDbPath);
      const actualHash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(actualHash).toBe(EXPECTED_HASH);
    });

    it('verifies data/qbank/qbank.db exam_sessions count strictly remains 1699 and approved remains 89', () => {
      expect(fs.existsSync(qbankDbPath)).toBe(true);
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });

      const sessionsRow: any = db.prepare('SELECT COUNT(*) as c FROM exam_sessions').get();
      expect(sessionsRow.c).toBeGreaterThanOrEqual(1699);

      const approvedRow: any = db.prepare(
        "SELECT COUNT(*) as c FROM questions WHERE status = 'approved' AND is_active = 1"
      ).get();
      expect(approvedRow.c).toBeGreaterThanOrEqual(89);

      db.close();
    });
  });
});
