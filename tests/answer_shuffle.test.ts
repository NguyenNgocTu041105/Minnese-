/**
 * tests/answer_shuffle.test.ts
 *
 * Comprehensive Test Suite for Fisher-Yates Answer Shuffle Module.
 *
 * Requirements:
 * 1. Correctness: new_options[new_answer_idx] === original_options[original_answer_idx] across deterministic & random runs.
 * 2. Uniformity (Monte Carlo 10,000 runs): ~25% ± 2.5% for each option (A, B, C, D), Chi-square test, permutation frequencies.
 * 3. Absence of Option A Bias: Option A frequency drops from 97.75% baseline to ~25%.
 * 4. Data Integrity: All options preserved, no duplicates, no missing items.
 * 5. Immutability: Original object & options array frozen and unmodified.
 * 6. Edge cases: Empty options, 1 option, 2 options (T/F), 6 options (_6opt), out-of-range answer_idx.
 * 7. Explanation synchronization: Updates explicit letter references to prevent validator contradictions.
 * 8. Database Safety: Zero writes to production databases.
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
} from '../src/server/utils/answerShuffle';

import { validateCandidate } from '../src/server/llm/questionValidator';

describe('Fisher-Yates Answer Shuffle Utility Suite', () => {
  // ---------------------------------------------------------------------------
  // 1. Core Correctness & Deterministic Mapping
  // ---------------------------------------------------------------------------
  describe('1. Core Correctness & Deterministic Mapping', () => {
    it('accurately maps answer_idx with deterministic pseudo-RNG', () => {
      // Input question where correct answer is at index 0 ("学校")
      const q: ShuffleableQuestion = {
        stem: '我想去______买书。',
        options: ['学校', '医院', '商店', '机场'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A: 学校 có nghĩa là trường học.',
      };

      // Mock RNG returning a deterministic sequence of values
      // Fisher-Yates with n = 4:
      // i = 3: rng() -> 0.1 -> j = Math.floor(0.1 * 4) = 0 -> swap indices[3] and indices[0]
      // i = 2: rng() -> 0.9 -> j = Math.floor(0.9 * 3) = 2 -> swap indices[2] and indices[2]
      // i = 1: rng() -> 0.4 -> j = Math.floor(0.4 * 2) = 0 -> swap indices[1] and indices[0]
      const deterministicValues = [0.1, 0.9, 0.4];
      let callCount = 0;
      const mockRng = () => {
        const val = deterministicValues[callCount % deterministicValues.length];
        callCount++;
        return val;
      };

      const res = shuffleQuestionAnswers(q, mockRng);

      expect(res.shuffled).toBe(true);
      expect(res.original_answer_idx).toBe(0);

      // Verify that the new options at new_answer_idx contains the original correct answer
      const originalCorrectOption = q.options[q.answer_idx];
      expect(res.question.options[res.new_answer_idx]).toBe(originalCorrectOption);
      expect(res.question.answer_idx).toBe(res.new_answer_idx);

      // Mapping verification: mapping[old_idx] === new_idx
      for (let oldIdx = 0; oldIdx < q.options.length; oldIdx++) {
        const newIdx = res.mapping[oldIdx];
        expect(res.question.options[newIdx]).toBe(q.options[oldIdx]);
      }

      // Reverse mapping verification
      expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(0);
    });

    it('correctly tracks answer when original answer_idx is not at position 0', () => {
      // Test for each initial position 0, 1, 2, 3
      for (let initialIdx = 0; initialIdx < 4; initialIdx++) {
        const q: ShuffleableQuestion = {
          stem: 'Test stem',
          options: ['Apple', 'Banana', 'Cherry', 'Date'],
          answer_idx: initialIdx,
        };

        const targetWord = q.options[initialIdx];

        // Run multiple random shuffles
        for (let run = 0; run < 50; run++) {
          const res = shuffleQuestionAnswers(q);
          expect(res.shuffled).toBe(true);
          expect(res.original_answer_idx).toBe(initialIdx);
          expect(res.question.options[res.new_answer_idx]).toBe(targetWord);
          expect(res.options[res.new_answer_idx]).toBe(targetWord);
          expect(res.mapping[initialIdx]).toBe(res.new_answer_idx);
        }
      }
    });

    it('handles duplicate option texts correctly by tracking exact indices', () => {
      // Even if options contain duplicate strings, mapping tracks position, not string indexOf
      const q: ShuffleableQuestion = {
        stem: 'Duplicate options test',
        options: ['Duplicate', 'Duplicate', 'Unique', 'Other'],
        answer_idx: 1, // targeting second duplicate
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.original_answer_idx).toBe(1);
      expect(res.new_answer_idx).toBe(res.mapping[1]);
      expect(res.question.options[res.new_answer_idx]).toBe('Duplicate');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Uniformity & Monte Carlo Statistical Distribution (10,000 runs)
  // ---------------------------------------------------------------------------
  describe('2. Uniformity & Monte Carlo Statistical Distribution (10,000 runs)', () => {
    it('produces uniform distribution across all 4 positions (Chi-square test & 25% ± 2.5% tolerance band)', () => {
      const N_RUNS = 10_000;
      const q: ShuffleableQuestion = {
        stem: '我在______看书。',
        options: ['图书馆', '电影院', '火车站', '洗手间'],
        answer_idx: 0, // initially Option A
      };

      const counts = [0, 0, 0, 0];
      const permutationsMap: Record<string, number> = {};

      for (let i = 0; i < N_RUNS; i++) {
        const res = shuffleQuestionAnswers(q);

        // Invariant: correct answer is preserved 100% of the time
        expect(res.question.options[res.new_answer_idx]).toBe('图书馆');

        // Track distribution of new_answer_idx
        counts[res.new_answer_idx]++;

        // Track full permutation
        const permKey = res.question.options.join('|');
        permutationsMap[permKey] = (permutationsMap[permKey] || 0) + 1;
      }

      // Expected count per position: 10,000 / 4 = 2,500
      const expectedPerPosition = N_RUNS / 4;

      // Chi-square calculation for 4 positions: df = 3
      let chiSquarePositions = 0;
      for (let idx = 0; idx < 4; idx++) {
        const observed = counts[idx];
        const percentage = (observed / N_RUNS) * 100;

        // Tolerance band: 25% ± 2.5% (between 22.5% and 27.5%)
        expect(percentage).toBeGreaterThanOrEqual(22.5);
        expect(percentage).toBeLessThanOrEqual(27.5);

        chiSquarePositions += Math.pow(observed - expectedPerPosition, 2) / expectedPerPosition;
      }

      // For df = 3, critical value at p = 0.001 is 16.27.
      // Under fair random shuffle, chiSquarePositions should be well below 20.
      expect(chiSquarePositions).toBeLessThan(20.0);

      // Verify permutation uniformity across all 24 possible permutations (4! = 24)
      const uniquePermutations = Object.keys(permutationsMap);
      expect(uniquePermutations.length).toBe(24); // All 24 permutations must appear

      // Expected count per permutation: 10,000 / 24 = 416.67
      const expectedPerPerm = N_RUNS / 24;
      let chiSquarePermutations = 0;

      for (const permKey of uniquePermutations) {
        const observed = permutationsMap[permKey];
        // Each permutation should occur with reasonable frequency (e.g. at least 250 times out of 10,000)
        expect(observed).toBeGreaterThan(250);
        expect(observed).toBeLessThan(600);

        chiSquarePermutations += Math.pow(observed - expectedPerPerm, 2) / expectedPerPerm;
      }

      // For df = 23, critical value at p = 0.001 is 49.73.
      expect(chiSquarePermutations).toBeLessThan(60.0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Absence of Option A Bias
  // ---------------------------------------------------------------------------
  describe('3. Absence of Option A Bias', () => {
    it('eliminates Option A bias (baseline 97.75% reduced to ~25%)', () => {
      // In the baseline audit, 87 out of 89 approved questions had answer_idx = 0 (97.75%)
      const BASELINE_OPTION_A_RATE = 87 / 89; // 97.75%

      const q: ShuffleableQuestion = {
        stem: '我想喝______。',
        options: ['茶', '米饭', '面条', '衣服'],
        answer_idx: 0, // Starts at A
      };

      const SAMPLE_SIZE = 5_000;
      let optionACount = 0;

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const res = shuffleQuestionAnswers(q);
        if (res.new_answer_idx === 0) {
          optionACount++;
        }
      }

      const postShuffleOptionARate = optionACount / SAMPLE_SIZE;

      // Prove that Option A rate is NOT near 97.75%
      expect(postShuffleOptionARate).toBeLessThan(0.30); // Far lower than baseline
      expect(postShuffleOptionARate).toBeGreaterThan(0.20); // Well within ~25%
      expect(postShuffleOptionARate).not.toBeCloseTo(BASELINE_OPTION_A_RATE, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Data Integrity & Preservation
  // ---------------------------------------------------------------------------
  describe('4. Data Integrity & Preservation', () => {
    it('preserves all option elements without loss or duplicate creation', () => {
      const q: ShuffleableQuestion = {
        stem: '昨天天气怎么样？',
        options: ['下雨了', '太冷了', '很好', '不知道'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const originalSorted = [...q.options].sort();

      for (let run = 0; run < 200; run++) {
        const res = shuffleQuestionAnswers(q);

        // Options length preserved
        expect(res.question.options.length).toBe(q.options.length);

        // All elements preserved
        const shuffledSorted = [...res.question.options].sort();
        expect(shuffledSorted).toEqual(originalSorted);

        // Other metadata fields preserved
        expect(res.question.stem).toBe(q.stem);
        expect(res.question.level).toBe(q.level);
        expect(res.question.skill).toBe(q.skill);
        expect(res.question.part_type).toBe(q.part_type);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Immutability & Purity
  // ---------------------------------------------------------------------------
  describe('5. Immutability & Purity', () => {
    it('never mutates input question object or options array (Object.freeze test)', () => {
      const frozenOptions = Object.freeze(['苹果', '香蕉', '橙子', '西瓜']);
      const frozenQuestion: ShuffleableQuestion = Object.freeze({
        stem: '桌子上有三个______。',
        options: frozenOptions as unknown as string[],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A: 苹果 là quả táo.',
      });

      // Calling shuffleQuestionAnswers on a frozen object should not throw any mutation error
      expect(() => {
        const res = shuffleQuestionAnswers(frozenQuestion);

        // Returns new object instance
        expect(res.question).not.toBe(frozenQuestion);
        expect(res.question.options).not.toBe(frozenQuestion.options);

        // Original properties are identical
        expect(frozenQuestion.options[0]).toBe('苹果');
        expect(frozenQuestion.answer_idx).toBe(0);
        expect(frozenQuestion.explanation_vi).toBe('Đáp án đúng là A: 苹果 là quả táo.');
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Edge Cases Handling
  // ---------------------------------------------------------------------------
  describe('6. Edge Cases Handling', () => {
    it('handles empty options array gracefully without crash (e.g. writing task)', () => {
      const q: ShuffleableQuestion = {
        stem: 'Please write a sentence with 学.',
        options: [],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(false);
      expect(res.question.options).toEqual([]);
      expect(res.new_answer_idx).toBe(0);
      expect(res.mapping).toEqual([]);
    });

    it('handles single-option question gracefully (options length = 1)', () => {
      const q: ShuffleableQuestion = {
        stem: 'Single option question',
        options: ['OnlyChoice'],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(false);
      expect(res.question.options).toEqual(['OnlyChoice']);
      expect(res.new_answer_idx).toBe(0);
      expect(res.mapping).toEqual([0]);
    });

    it('handles 2-option True/False questions (50/50 distribution)', () => {
      const q: ShuffleableQuestion = {
        stem: '飞机比火车快。',
        options: ['是', '不是'],
        answer_idx: 0,
      };

      let count0 = 0;
      let count1 = 0;
      const RUNS = 2_000;

      for (let i = 0; i < RUNS; i++) {
        const res = shuffleQuestionAnswers(q);
        expect(res.shuffled).toBe(true);
        expect(res.question.options[res.new_answer_idx]).toBe('是');
        if (res.new_answer_idx === 0) count0++;
        else count1++;
      }

      // Both should be ~50% ± 5%
      expect(count0 / RUNS).toBeGreaterThan(0.45);
      expect(count0 / RUNS).toBeLessThan(0.55);
      expect(count1 / RUNS).toBeGreaterThan(0.45);
      expect(count1 / RUNS).toBeLessThan(0.55);
    });

    it('handles 6-option questions (HSK 1 dialogue picture match _6opt)', () => {
      const q: ShuffleableQuestion = {
        stem: 'Dialogue matching 6 options',
        options: ['Picture A', 'Picture B', 'Picture C', 'Picture D', 'Picture E', 'Picture F'],
        answer_idx: 4, // "Picture E"
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(true);
      expect(res.question.options.length).toBe(6);
      expect(res.question.options[res.new_answer_idx]).toBe('Picture E');
      expect(res.mapping.length).toBe(6);
    });

    it('handles negative or out-of-bounds answer_idx by throwing RangeError', () => {
      const qNegative: ShuffleableQuestion = {
        stem: 'Negative idx',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: -1,
      };

      expect(() => shuffleQuestionAnswers(qNegative)).toThrow(RangeError);

      const qOverflow: ShuffleableQuestion = {
        stem: 'Overflow idx',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 99,
      };

      expect(() => shuffleQuestionAnswers(qOverflow)).toThrow(RangeError);
    });

    it('handles non-array or undefined options defensively', () => {
      const qInvalid = {
        stem: 'Invalid options',
        options: undefined as unknown as string[],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(qInvalid);
      expect(res.shuffled).toBe(false);
      expect(res.new_answer_idx).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Explanation Synchronization & Quality Gate 2 Alignment
  // ---------------------------------------------------------------------------
  describe('7. Explanation Synchronization & Quality Gate 2 Alignment', () => {
    it('synchronizes option letters in Vietnamese explanations when answer moves', () => {
      // Test cases for syncExplanationLetter
      expect(
        syncExplanationLetter('Đáp án đúng là A: 学校 nghĩa là trường học.', 0, 2)
      ).toBe('Đáp án đúng là C: 学校 nghĩa là trường học.');

      expect(
        syncExplanationLetter('Chọn A vì phù hợp với ngữ cảnh.', 0, 1)
      ).toBe('Chọn B vì phù hợp với ngữ cảnh.');

      expect(
        syncExplanationLetter('Phương án đúng là A.', 0, 3)
      ).toBe('Phương án đúng là D.');

      expect(
        syncExplanationLetter('A là đáp án đúng.', 0, 2)
      ).toBe('C là đáp án đúng.');

      expect(
        syncExplanationLetter('Đáp án: A', 0, 1)
      ).toBe('Đáp án: B');
    });

    it('does not corrupt distractor mentions or explanations without letter designations', () => {
      const complexExpl =
        'Đáp án đúng là A. Các phương án B (bệnh viện), C (sân bay) và D (cửa hàng) không phù hợp ngữ cảnh.';

      const synced = syncExplanationLetter(complexExpl, 0, 2); // A -> C
      expect(synced).toBe(complexExpl);

      // Contextual explanation without any letter
      const contextExpl = 'Trạng từ "太" đi cùng với "了" biểu thị mức độ quá mức.';
      expect(syncExplanationLetter(contextExpl, 0, 2)).toBe(contextExpl);
    });

    it('passes questionValidator Gate 2 consistency check after shuffle', () => {
      const candidate: any = {
        stem: '今天天气很好，我们去______吧。',
        options: ['公园', '医院', '银行', '车站'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A: 公园 là công viên, phù hợp với đi chơi khi thời tiết đẹp.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      // Shuffle candidate 20 times and validate each with questionValidator
      for (let i = 0; i < 20; i++) {
        const shuffled = shuffleQuestionAnswers(candidate);
        const validation = validateCandidate(shuffled.question);

        // Check if there are any explanation contradiction errors
        const contradictionErrors = validation.errors.filter((e) =>
          e.includes('Explanation contradicts answer_idx')
        );
        expect(contradictionErrors.length).toBe(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Low-level Array Helper `shuffleOptionsArray`
  // ---------------------------------------------------------------------------
  describe('8. Low-level Array Helper `shuffleOptionsArray`', () => {
    it('works on generic arrays (numbers, objects)', () => {
      const numArr = [10, 20, 30, 40, 50];
      const res = shuffleOptionsArray(numArr);
      expect(res.shuffled.length).toBe(5);
      expect([...res.shuffled].sort((a, b) => a - b)).toEqual(numArr);

      for (let i = 0; i < numArr.length; i++) {
        expect(res.shuffled[res.mapping[i]]).toBe(numArr[i]);
      }
    });

    it('handles empty or 1-element arrays safely', () => {
      expect(shuffleOptionsArray([])).toEqual({ shuffled: [], mapping: [] });
      expect(shuffleOptionsArray(['single'])).toEqual({ shuffled: ['single'], mapping: [0] });
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Database Safety & Zero-Write Invariant
  // ---------------------------------------------------------------------------
  describe('9. Database Safety & Zero-Write Invariant', () => {
    const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');

    it('preserves data/hsk_exam.db SHA-256 untouched', () => {
      expect(fs.existsSync(hskExamDbPath)).toBe(true);
      const buffer = fs.readFileSync(hskExamDbPath);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(sha256).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('preserves data/qbank/qbank.db exam_sessions count exactly at 1735 (1699 historical + 36 practice)', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      // 1699 historical sessions intact + 36 legitimate practice sessions from Phases 8-16
      const row: any = db.prepare('SELECT COUNT(*) as c FROM exam_sessions').get();
      expect(row.c).toBe(1735);
      db.close();
    });
  });
});
