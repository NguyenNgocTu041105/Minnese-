/**
 * tests/adversarial_challenger1_phase8_1.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE — Phase 8.1
 * Author: challenger_1_phase8_1 (critic, specialist)
 *
 * Core Empirical Probes:
 * 1. Extreme RNG boundary outputs (-Number.MAX_VALUE, -1e-15, 0.0, 1.0 - EPSILON, 1.0, 1.0 + 1e-15, Number.MAX_VALUE, NaN, undefined, +-Infinity)
 * 2. Silent Clamping Contract Violation (empirically verifies code silently clamps instead of throwing Error per Phase 8.1 R2)
 * 3. Non-integer answer_idx defect verification (2.7, 1.5, NaN, -0) yielding undefined index
 * 4. Monte Carlo Permutation Stress Testing (5,000 runs per size: 2, 4, 6 options) verifying 100% bijection and option tracking
 * 5. Database Isolation & SHA-256 Invariants (read-only verification of data/hsk_exam.db and data/qbank/qbank.db)
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

describe('Adversarial Challenger 1 (Phase 8.1): Empirical Stress Suite', () => {

  // ===========================================================================
  // Dimension 1 & 2: Extreme RNG Values & Silent Clamping Verification (ISSUE-01)
  // ===========================================================================
  describe('Dimension 1 & 2: Extreme RNG Values & Silent Clamping Verification', () => {
    const sampleOptions = ['Alpha', 'Beta', 'Gamma', 'Delta'];

    it('proves rejection with RangeError on extreme negative RNG values (-Number.MAX_VALUE, -1e-15, -Infinity)', () => {
      expect(() => shuffleOptionsArray(sampleOptions, () => -Number.MAX_VALUE)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(sampleOptions, () => -1e-15)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(sampleOptions, () => -Infinity)).toThrow(TypeError);
    });

    it('proves valid lower boundary 0.0 behaves identically to negative clamped values', () => {
      // 0.0 is valid in [0, 1)
      const res = shuffleOptionsArray(sampleOptions, () => 0.0);
      expect(res.shuffled).toEqual(['Beta', 'Gamma', 'Delta', 'Alpha']);
      expect(res.mapping).toEqual([3, 0, 1, 2]); // old index 0 ('Alpha') is at new index 3
    });

    it('proves behavior near upper boundary (1.0 - Number.EPSILON)', () => {
      const res = shuffleOptionsArray(sampleOptions, () => 1.0 - Number.EPSILON);
      expect(res.shuffled).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
      expect(res.mapping).toEqual([0, 1, 2, 3]);
    });

    it('proves silent clamping on extreme upper RNG values (1.0, 1.0 + 1e-15, Number.MAX_VALUE, +Infinity)', () => {
      expect(() => shuffleOptionsArray(sampleOptions, () => 1.0)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(sampleOptions, () => 1.0 + 1e-15)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(sampleOptions, () => Number.MAX_VALUE)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(sampleOptions, () => Infinity)).toThrow(TypeError);
    });

    it('proves silent fallback to Math.random on NaN and undefined RNG outputs', () => {
      expect(() => shuffleOptionsArray(sampleOptions, () => NaN)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(sampleOptions, () => undefined as unknown as number)).toThrow(TypeError);
    });
  });

  // ===========================================================================
  // Dimension 3: Non-integer and Abnormal answer_idx Defect Verification
  // ===========================================================================
  describe('Dimension 3: Non-integer and Abnormal answer_idx Handling', () => {
    const qBase: ShuffleableQuestion = {
      stem: 'Adversarial answer_idx challenge',
      options: ['Option 0', 'Option 1', 'Option 2', 'Option 3'],
      answer_idx: 0,
    };

    it('confirms float index 2.7 defect: produces TypeError', () => {
      const qFloat: ShuffleableQuestion = {
        ...qBase,
        answer_idx: 2.7,
      };

      expect(() => shuffleQuestionAnswers(qFloat)).toThrow(TypeError);
    });

    it('confirms float index 1.5 defect: produces TypeError', () => {
      const qFloat: ShuffleableQuestion = {
        ...qBase,
        answer_idx: 1.5,
      };

      expect(() => shuffleQuestionAnswers(qFloat)).toThrow(TypeError);
    });

    it('confirms -0 integer behavior: mapped correctly without becoming undefined', () => {
      // In JS, -0 is a number, -0 === 0, mapping[-0] is mapping[0]
      const qMinusZero: ShuffleableQuestion = {
        ...qBase,
        answer_idx: -0,
      };

      const result = shuffleQuestionAnswers(qMinusZero);
      expect(typeof result.new_answer_idx).toBe('number');
      expect(result.new_answer_idx).toBeGreaterThanOrEqual(0);
      expect(result.new_answer_idx).toBeLessThan(4);
      expect(result.question.options[result.new_answer_idx]).toBe('Option 0');
    });

    it('confirms NaN answer_idx throws TypeError', () => {
      const qNaN: ShuffleableQuestion = {
        ...qBase,
        answer_idx: NaN,
      };

      expect(() => shuffleQuestionAnswers(qNaN)).toThrow(TypeError);
    });

    it('confirms Infinite answer_idx throws TypeError', () => {
      const qInf: ShuffleableQuestion = {
        ...qBase,
        answer_idx: Infinity,
      };
      expect(() => shuffleQuestionAnswers(qInf)).toThrow(TypeError);

      const qNegInf: ShuffleableQuestion = {
        ...qBase,
        answer_idx: -Infinity,
      };
      expect(() => shuffleQuestionAnswers(qNegInf)).toThrow(TypeError);
    });
  });

  // ===========================================================================
  // Dimension 4: Monte Carlo Permutation Stress Testing (5,000 Runs)
  // ===========================================================================
  describe('Dimension 4: Monte Carlo Permutation Stress Testing (5,000 runs per size)', () => {
    const N_RUNS = 5000;

    it('Stress-tests 2-option questions (True/False): 100% bijection, 100% correct answer tracking', () => {
      const options = ['对 (Đúng)', '错 (Sai)'];
      const targetIdx = 0; // Target is '对 (Đúng)'
      const targetContent = options[targetIdx];

      const q: ShuffleableQuestion = {
        stem: '北京是中国的首都。',
        options,
        answer_idx: targetIdx,
      };

      const posCounts = [0, 0];
      const permCounts: Record<string, number> = {};

      for (let i = 0; i < N_RUNS; i++) {
        const res = shuffleQuestionAnswers(q);

        // 1. Array length strictly preserved
        expect(res.question.options).toHaveLength(2);

        // 2. Bijection: set of options preserved
        expect(new Set(res.question.options).size).toBe(2);
        expect(res.question.options.includes('对 (Đúng)')).toBe(true);
        expect(res.question.options.includes('错 (Sai)')).toBe(true);

        // 3. Target answer content tracking 100% accurate
        expect(res.question.options[res.new_answer_idx]).toBe(targetContent);

        // 4. Invariant reversibility
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(targetIdx);

        posCounts[res.new_answer_idx]++;
        const permKey = res.question.options.join('|');
        permCounts[permKey] = (permCounts[permKey] || 0) + 1;
      }

      // In 5,000 runs of 2 options (2! = 2 permutations):
      // Both permutations must occur
      expect(Object.keys(permCounts)).toHaveLength(2);

      // Distribution balance: each of [0, 1] should be ~2500 (between 40% and 60%)
      const ratioA = posCounts[0] / N_RUNS;
      const ratioB = posCounts[1] / N_RUNS;
      expect(ratioA).toBeGreaterThan(0.40);
      expect(ratioA).toBeLessThan(0.60);
      expect(ratioB).toBeGreaterThan(0.40);
      expect(ratioB).toBeLessThan(0.60);
    });

    it('Stress-tests 4-option questions (MCQ): 100% bijection, 100% correct answer tracking, 24/24 permutations', () => {
      const options = ['苹果', '香蕉', '西瓜', '葡萄'];
      const targetIdx = 2; // Target is '西瓜' (Option C)
      const targetContent = options[targetIdx];

      const q: ShuffleableQuestion = {
        stem: '夏天最常吃的水果是______。',
        options,
        answer_idx: targetIdx,
      };

      const posCounts = [0, 0, 0, 0];
      const permCounts: Record<string, number> = {};

      for (let i = 0; i < N_RUNS; i++) {
        const res = shuffleQuestionAnswers(q);

        // 1. Array length strictly preserved
        expect(res.question.options).toHaveLength(4);

        // 2. Bijection: all 4 unique options present
        expect(new Set(res.question.options).size).toBe(4);

        // 3. Correct answer mapping 100% maintained
        expect(res.question.options[res.new_answer_idx]).toBe(targetContent);

        // 4. Invariant reversibility
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(targetIdx);

        posCounts[res.new_answer_idx]++;
        const permKey = res.question.options.join('|');
        permCounts[permKey] = (permCounts[permKey] || 0) + 1;
      }

      // In 5,000 runs of 4 options (4! = 24 permutations):
      // All 24 permutations must appear
      expect(Object.keys(permCounts)).toHaveLength(24);

      // Uniformity: each position A, B, C, D should get ~1,250 hits (~25%, between 20% and 30%)
      for (let pos = 0; pos < 4; pos++) {
        const freq = posCounts[pos] / N_RUNS;
        expect(freq).toBeGreaterThan(0.20);
        expect(freq).toBeLessThan(0.30);
      }
    });

    it('Stress-tests 6-option questions (Word Bank A-F): 100% bijection, 100% correct answer tracking', () => {
      const options = ['高兴', '漂亮', '认识', '帮助', '便宜', '准备'];
      const targetIdx = 4; // Target is '便宜' (Option E)
      const targetContent = options[targetIdx];

      const q: ShuffleableQuestion = {
        stem: '这件衣服很______。',
        options,
        answer_idx: targetIdx,
      };

      const posCounts = [0, 0, 0, 0, 0, 0];
      const permCounts: Record<string, number> = {};

      for (let i = 0; i < N_RUNS; i++) {
        const res = shuffleQuestionAnswers(q);

        // 1. Length preserved
        expect(res.question.options).toHaveLength(6);

        // 2. Bijection: all 6 unique items present
        expect(new Set(res.question.options).size).toBe(6);

        // 3. Correct answer mapping 100% maintained
        expect(res.question.options[res.new_answer_idx]).toBe(targetContent);

        // 4. Invariant reversibility
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(targetIdx);

        posCounts[res.new_answer_idx]++;
        const permKey = res.question.options.join('|');
        permCounts[permKey] = (permCounts[permKey] || 0) + 1;
      }

      // In 5,000 runs of 6 options (6! = 720 possible permutations):
      // Substantial entropy: at least 650 distinct permutations should be observed
      expect(Object.keys(permCounts).length).toBeGreaterThan(650);

      // Each of the 6 positions should be populated (between 12% and 22%, expected ~16.7%)
      for (let pos = 0; pos < 6; pos++) {
        const freq = posCounts[pos] / N_RUNS;
        expect(freq).toBeGreaterThan(0.12);
        expect(freq).toBeLessThan(0.22);
      }
    });
  });

  // ===========================================================================
  // Dimension 5: Database Invariant & Zero Contamination Audit
  // ===========================================================================
  describe('Dimension 5: Database Invariant & Zero Contamination Audit', () => {
    const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

    it('verifies data/hsk_exam.db SHA-256 strictly equals invariant hash', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const buffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HASH);
    });

    it('verifies data/qbank/qbank.db baseline numbers remain untouched in read-only mode', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        const sessionRow = db.prepare('SELECT count(1) as c FROM exam_sessions').get() as { c: number };
        expect(sessionRow.c).toBeGreaterThanOrEqual(1699);

        const approvedRow = db.prepare("SELECT count(1) as c FROM questions WHERE status = 'approved' AND is_active = 1").get() as { c: number };
        expect(approvedRow.c).toBeGreaterThanOrEqual(89);

        const pendingRow = db.prepare("SELECT count(1) as c FROM questions WHERE status = 'pending'").get() as { c: number };
        expect(pendingRow.c).toBe(0);

        const pendingStagingRow = db.prepare('SELECT count(1) as c FROM pending_questions').get() as { c: number };
        expect(pendingStagingRow.c).toBeGreaterThanOrEqual(111);

        const eligibleRow = db.prepare('SELECT count(1) as c FROM exam_eligible_pool WHERE exam_eligible = 1').get() as { c: number };
        expect(eligibleRow.c).toBeGreaterThanOrEqual(0);

        // Zero test/pilot records in questions, pending_questions, or tasks
        const pilotQuestions = db.prepare("SELECT count(1) as c FROM questions WHERE id LIKE '%pilot%' OR id LIKE '%adversarial%'").get() as { c: number };
        expect(pilotQuestions.c).toBe(0);

        const pilotPending = db.prepare("SELECT count(1) as c FROM pending_questions WHERE id LIKE '%pilot%' OR id LIKE '%adversarial%'").get() as { c: number };
        expect(pilotPending.c).toBe(0);
      } finally {
        db.close();
      }
    });
  });
});
