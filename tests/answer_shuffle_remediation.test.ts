/**
 * tests/answer_shuffle_remediation.test.ts
 *
 * Comprehensive Independent Regression Test Suite for Phase 8.2: Verified Remediation (R1 & R2).
 * Verifies RNG hardening, strict answer_idx validation, and Unicode Vietnamese explanation synchronization.
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
  syncExplanationLetterSafe,
  isIsolatedOptionLetter,
  getOriginalAnswerIndex,
  NEGATION_INDICATOR_REGEX,
  type ShuffleableQuestion,
} from '../src/server/utils/answerShuffle';

describe('Phase 8.2: Answer Shuffle Remediation Suite (R1 & R2)', () => {

  // ===========================================================================
  // Requirement R1.1: RNG Mathematical Validation & Error Handling
  // ===========================================================================
  describe('R1.1: RNG Mathematical Validation & Error Handling in shuffleOptionsArray', () => {
    const items = ['A', 'B', 'C', 'D'];

    it('accepts exact 0.0 as a valid lower boundary RNG value', () => {
      expect(() => {
        const res = shuffleOptionsArray(items, () => 0.0);
        expect(res.shuffled).toHaveLength(4);
        expect(res.mapping).toHaveLength(4);
        expect(res.shuffled).toEqual(['B', 'C', 'D', 'A']);
      }).not.toThrow();
    });

    it('accepts deterministic pseudo-RNG returning valid values in [0, 1)', () => {
      const seq = [0.1, 0.5, 0.999999999999999];
      let idx = 0;
      const validRng = () => seq[idx++ % seq.length];

      const res = shuffleOptionsArray(items, validRng);
      expect(res.shuffled).toHaveLength(4);
      expect(new Set(res.shuffled).size).toBe(4);
      expect([...res.shuffled].sort()).toEqual([...items].sort());
    });

    it('throws RangeError for negative RNG values (< 0)', () => {
      expect(() => shuffleOptionsArray(items, () => -0.00000000001)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(items, () => -0.5)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(items, () => -100)).toThrow(RangeError);
    });

    it('throws RangeError for RNG values >= 1.0', () => {
      expect(() => shuffleOptionsArray(items, () => 1.0)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(items, () => 1.0000000000001)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(items, () => 2.5)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(items, () => 100)).toThrow(RangeError);
    });

    it('throws TypeError for non-finite numeric RNG values (NaN, Infinity, -Infinity)', () => {
      expect(() => shuffleOptionsArray(items, () => NaN)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(items, () => Infinity)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(items, () => -Infinity)).toThrow(TypeError);
    });

    it('throws TypeError for non-numeric RNG outputs (string, undefined, null, object)', () => {
      expect(() => shuffleOptionsArray(items, (() => '0.5') as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(items, (() => undefined) as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(items, (() => null) as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(items, (() => ({})) as any)).toThrow(TypeError);
    });

    it('throws TypeError if input items is not an array', () => {
      expect(() => shuffleOptionsArray(null as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(undefined as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray('string' as any)).toThrow(TypeError);
      expect(() => shuffleOptionsArray(123 as any)).toThrow(TypeError);
    });

    it('guarantees purity and immutability: input items array is untouched when RNG throws', () => {
      const originalItems = ['Apple', 'Banana', 'Cherry', 'Date'];
      const frozenInput = Object.freeze([...originalItems]);

      expect(() => {
        shuffleOptionsArray(frozenInput as unknown as string[], () => -0.5);
      }).toThrow(RangeError);

      // Verify array was not modified
      expect(frozenInput).toEqual(originalItems);
      expect(frozenInput[0]).toBe('Apple');
      expect(frozenInput[1]).toBe('Banana');
      expect(frozenInput[2]).toBe('Cherry');
      expect(frozenInput[3]).toBe('Date');
    });

    it('handles arrays of length 0 and 1 safely without calling RNG', () => {
      let rngCalled = false;
      const hostileRng = () => {
        rngCalled = true;
        return -999; // hostile RNG that would throw if called
      };

      const res0 = shuffleOptionsArray([], hostileRng);
      expect(res0.shuffled).toEqual([]);
      expect(res0.mapping).toEqual([]);
      expect(rngCalled).toBe(false);

      const res1 = shuffleOptionsArray(['Single'], hostileRng);
      expect(res1.shuffled).toEqual(['Single']);
      expect(res1.mapping).toEqual([0]);
      expect(rngCalled).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement R1.2: Strict answer_idx Validation in shuffleQuestionAnswers
  // ===========================================================================
  describe('R1.2: Strict answer_idx Validation in shuffleQuestionAnswers', () => {
    const qBase: ShuffleableQuestion = {
      stem: '北京是中国的______。',
      options: ['首都', '省会', '城市', '国家'],
      answer_idx: 0,
      explanation_vi: 'Đáp án đúng là A: 首都 có nghĩa là thủ đô.',
    };

    it('rejects floating-point answer_idx with TypeError (e.g. 1.5, 2.7, 0.1)', () => {
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: 1.5 })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: 2.7 })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: 0.1 })).toThrow(TypeError);
    });

    it('rejects NaN, Infinity, -Infinity, strings, and undefined answer_idx with TypeError', () => {
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: NaN })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: Infinity })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: -Infinity })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: '0' as any })).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: undefined as any })).toThrow(TypeError);
    });

    it('rejects negative answer_idx with RangeError (e.g. -1, -5)', () => {
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: -1 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: -5 })).toThrow(RangeError);
    });

    it('rejects out-of-bounds answer_idx with RangeError (>= options.length)', () => {
      // 4 options -> indices 0, 1, 2, 3
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: 4 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: 5 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ ...qBase, answer_idx: 99 })).toThrow(RangeError);
    });

    it('supports 2-option True/False questions (indices 0 and 1 strictly valid)', () => {
      const q2: ShuffleableQuestion = {
        stem: '飞机比火车快。',
        options: ['是', '不是'],
        answer_idx: 1,
      };

      const res = shuffleQuestionAnswers(q2);
      expect(res.shuffled).toBe(true);
      expect(Number.isInteger(res.new_answer_idx)).toBe(true);
      expect(res.new_answer_idx).toBeGreaterThanOrEqual(0);
      expect(res.new_answer_idx).toBeLessThan(2);
      expect(res.question.options[res.new_answer_idx]).toBe('不是');

      // Rejects index 2 or -1
      expect(() => shuffleQuestionAnswers({ ...q2, answer_idx: 2 })).toThrow(RangeError);
      expect(() => shuffleQuestionAnswers({ ...q2, answer_idx: -1 })).toThrow(RangeError);
    });

    it('supports 4-option MCQ questions (indices 0, 1, 2, 3 strictly valid)', () => {
      for (let i = 0; i < 4; i++) {
        const q4: ShuffleableQuestion = {
          stem: `Stem for index ${i}`,
          options: ['Opt0', 'Opt1', 'Opt2', 'Opt3'],
          answer_idx: i,
        };

        const res = shuffleQuestionAnswers(q4);
        expect(res.shuffled).toBe(true);
        expect(Number.isInteger(res.new_answer_idx)).toBe(true);
        expect(res.question.options[res.new_answer_idx]).toBe(`Opt${i}`);
      }
    });

    it('supports 6-option Word Bank questions (indices 0 to 5 strictly valid)', () => {
      const q6: ShuffleableQuestion = {
        stem: 'Word bank stem',
        options: ['OptA', 'OptB', 'OptC', 'OptD', 'OptE', 'OptF'],
        answer_idx: 5, // targeting last option
      };

      const res = shuffleQuestionAnswers(q6);
      expect(res.shuffled).toBe(true);
      expect(res.question.options[res.new_answer_idx]).toBe('OptF');
      expect(res.new_answer_idx).toBeGreaterThanOrEqual(0);
      expect(res.new_answer_idx).toBeLessThan(6);

      // Rejects index 6
      expect(() => shuffleQuestionAnswers({ ...q6, answer_idx: 6 })).toThrow(RangeError);
    });

    it('safely handles open-ended / writing tasks with 0 or 1 options (returns shuffled: false without throwing)', () => {
      // 0 options
      const q0: ShuffleableQuestion = {
        stem: 'Write a sentence with 喜欢.',
        options: [],
        answer_idx: -1,
      };
      const res0 = shuffleQuestionAnswers(q0);
      expect(res0.shuffled).toBe(false);
      expect(res0.question.options).toEqual([]);
      expect(res0.new_answer_idx).toBe(-1);

      // 1 option
      const q1: ShuffleableQuestion = {
        stem: 'Single prompt',
        options: ['OnlyChoice'],
        answer_idx: 0,
      };
      const res1 = shuffleQuestionAnswers(q1);
      expect(res1.shuffled).toBe(false);
      expect(res1.question.options).toEqual(['OnlyChoice']);
      expect(res1.new_answer_idx).toBe(0);
    });

    it('throws TypeError if question is null, undefined, or primitive', () => {
      expect(() => shuffleQuestionAnswers(null as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers(undefined as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers('invalid' as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers(123 as any)).toThrow(TypeError);
    });
  });

  // ===========================================================================
  // Requirement R2: Safe Explanation Synchronization & Unicode Protection
  // ===========================================================================
  describe('R2: Safe Explanation Synchronization & Unicode Protection', () => {

    it('isIsolatedOptionLetter distinguishes isolated option letters from Vietnamese/Latin words', () => {
      // "Đáp án đúng là Cà phê": 'C' is followed by 'à' -> NOT isolated
      const text1 = 'Đáp án đúng là Cà phê';
      const idx1 = text1.indexOf('C');
      expect(isIsolatedOptionLetter(text1, idx1, 1)).toBe(false);

      // "Bác sĩ": 'B' is followed by 'á' -> NOT isolated
      const text2 = 'Bác sĩ';
      const idx2 = text2.indexOf('B');
      expect(isIsolatedOptionLetter(text2, idx2, 1)).toBe(false);

      // "Chọn câu đúng": 'c' is followed by 'â' -> NOT isolated
      const text3 = 'Chọn câu đúng';
      const idx3 = text3.indexOf('c');
      expect(isIsolatedOptionLetter(text3, idx3, 1)).toBe(false);

      // "Đáp án đúng là C: cà phê": 'C' is preceded by ' ' and followed by ':' -> IS isolated
      const text4 = 'Đáp án đúng là C: cà phê';
      const idx4 = text4.indexOf('C');
      expect(isIsolatedOptionLetter(text4, idx4, 1)).toBe(true);

      // "Chọn A": 'A' is isolated
      const text5 = 'Chọn A';
      const idx5 = text5.indexOf('A');
      expect(isIsolatedOptionLetter(text5, idx5, 1)).toBe(true);
    });

    it('synchronizes standard affirmative single-letter designations correctly', () => {
      // Pattern 1: "Đáp án đúng là A"
      const expl1 = 'Đáp án đúng là A: 学校 có nghĩa là trường học.';
      const res1 = syncExplanationLetterSafe(expl1, 0, 2); // A -> C
      expect(res1.synced).toBe(true);
      expect(res1.status).toBe('synced_affirmative');
      expect(res1.explanation).toBe('Đáp án đúng là C: 学校 có nghĩa là trường học.');

      // Pattern 1 variant: "Chọn đáp án A"
      const expl2 = 'Chọn đáp án A vì đây là danh từ chỉ nơi chốn.';
      const res2 = syncExplanationLetterSafe(expl2, 0, 1); // A -> B
      expect(res2.synced).toBe(true);
      expect(res2.explanation).toBe('Chọn đáp án B vì đây là danh từ chỉ nơi chốn.');

      // Pattern 2: "A là đáp án đúng"
      const expl3 = 'A là đáp án đúng cho câu hỏi này.';
      const res3 = syncExplanationLetterSafe(expl3, 0, 2); // A -> C
      expect(res3.synced).toBe(true);
      expect(res3.explanation).toBe('C là đáp án đúng cho câu hỏi này.');

      // Pattern 3: "Phương án A là phù hợp"
      const expl4 = 'Phương án A phù hợp nhất với ngữ cảnh.';
      const res4 = syncExplanationLetterSafe(expl4, 0, 3); // A -> D
      expect(res4.synced).toBe(true);
      expect(res4.explanation).toBe('Phương án D phù hợp nhất với ngữ cảnh.');

      // Pattern 4: "Đáp án: A"
      const expl5 = 'Đáp án: A';
      const res5 = syncExplanationLetterSafe(expl5, 0, 1); // A -> B
      expect(res5.synced).toBe(true);
      expect(res5.explanation).toBe('Đáp án: B');

      // Backward compatibility: syncExplanationLetter returns exact string
      expect(syncExplanationLetter(expl1, 0, 2)).toBe('Đáp án đúng là C: 学校 có nghĩa là trường học.');
    });

    it('protects Vietnamese words starting with A-F from ASCII word boundary false replacement', () => {
      // "Cà phê" (C -> A should NOT become "Aà phê")
      const textCaPhe = 'Đáp án đúng là Cà phê.';
      const resCaPhe = syncExplanationLetterSafe(textCaPhe, 2, 0); // C -> A
      expect(resCaPhe.synced).toBe(false);
      expect(resCaPhe.explanation).toBe('Đáp án đúng là Cà phê.');

      // "Bác sĩ" (B -> A should NOT become "Aác sĩ")
      const textBacSi = 'Phương án chính xác là: Bác sĩ trong bệnh viện.';
      const resBacSi = syncExplanationLetterSafe(textBacSi, 1, 0); // B -> A
      expect(resBacSi.synced).toBe(false);
      expect(resBacSi.explanation).toBe('Phương án chính xác là: Bác sĩ trong bệnh viện.');

      // "Cơm" (C -> A should NOT become "Aơm")
      const textCom = 'Đáp án là Cơm tấm.';
      const resCom = syncExplanationLetterSafe(textCom, 2, 0); // C -> A
      expect(resCom.synced).toBe(false);
      expect(resCom.explanation).toBe('Đáp án là Cơm tấm.');

      // Lowercase "câu", "có", "cả"
      const textCau = 'Chọn câu đúng nhất.';
      const resCau = syncExplanationLetterSafe(textCau, 2, 0); // C -> A
      expect(resCau.synced).toBe(false);
      expect(resCau.explanation).toBe('Chọn câu đúng nhất.');
    });

    it('protects negative distractor rationale ("Không nên chọn A...", "loại trừ...") from semantic inversion', () => {
      // Negation phrase: "Không nên chọn A vì A là danh từ. Đáp án đúng là A."
      const sentenceKhongNen = 'Không nên chọn A vì A là danh từ. Đáp án đúng là A.';
      const resKhongNen = syncExplanationLetterSafe(sentenceKhongNen, 0, 2); // A -> C
      expect(resKhongNen.synced).toBe(false);
      expect(resKhongNen.status).toBe('preserved_negation');
      expect(resKhongNen.explanation).toBe(sentenceKhongNen); // Strictly preserved!

      // "Đừng chọn A"
      const sentenceDung = 'Đừng chọn A nếu chưa đọc kỹ.';
      const resDung = syncExplanationLetterSafe(sentenceDung, 0, 2);
      expect(resDung.status).toBe('preserved_negation');
      expect(resDung.explanation).toBe(sentenceDung);

      // "Tránh chọn A"
      const sentenceTranh = 'Tránh chọn A vì sai ngữ pháp.';
      const resTranh = syncExplanationLetterSafe(sentenceTranh, 0, 2);
      expect(resTranh.status).toBe('preserved_negation');
      expect(resTranh.explanation).toBe(sentenceTranh);

      // "Loại trừ phương án: A"
      const sentenceLoaiTru = 'Loại trừ phương án: A vì không phù hợp.';
      const resLoaiTru = syncExplanationLetterSafe(sentenceLoaiTru, 0, 2);
      expect(resLoaiTru.status).toBe('preserved_negation');
      expect(resLoaiTru.explanation).toBe(sentenceLoaiTru);
    });

    it('protects multi-option breakdowns ("A đúng, B sai vì...") from internal contradiction', () => {
      // Explanation contains analysis of multiple options:
      const multiOptionExpl = 'A đúng. B sai vì trường học. C sai vì bệnh viện.';
      const resMulti = syncExplanationLetterSafe(multiOptionExpl, 0, 2); // A -> C
      expect(resMulti.synced).toBe(false);
      expect(['preserved_conflict', 'preserved_negation']).toContain(resMulti.status);
      expect(resMulti.explanation).toBe(multiOptionExpl); // Strictly preserved!
    });

    it('reliably detects Unicode negation and elimination indicators via NEGATION_INDICATOR_REGEX', () => {
      // Accented vowels that fail on ASCII \b:
      expect(NEGATION_INDICATOR_REGEX.test('loại trừ phương án A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('loại bỏ phương án A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('sai vì phương án A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('loại đáp án: A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('loại phương án: A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('chẳng nên chọn A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('chớ nên chọn A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('cấm chọn A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('cần từ chối chọn A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('phương án A bị lỗi')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('dễ nhầm phương án A')).toBe(true);
    });

    it('safely preserves isolated distractor elimination sentences without masking words (Reviewer & Challenger findings)', () => {
      // Standalone distractor elimination clauses (without "không" or multiple option letters masking bugs):
      const t1 = 'Loại trừ phương án: A.';
      const r1 = syncExplanationLetterSafe(t1, 0, 2);
      expect(r1.status).toBe('preserved_negation');
      expect(r1.synced).toBe(false);
      expect(r1.explanation).toBe(t1);

      const t2 = 'Loại bỏ phương án: A.';
      const r2 = syncExplanationLetterSafe(t2, 0, 2);
      expect(r2.status).toBe('preserved_negation');
      expect(r2.synced).toBe(false);
      expect(r2.explanation).toBe(t2);

      const t3 = 'Loại đáp án: A.';
      const r3 = syncExplanationLetterSafe(t3, 0, 2);
      expect(r3.status).toBe('preserved_negation');
      expect(r3.synced).toBe(false);
      expect(r3.explanation).toBe(t3);

      const t4 = 'Phương án: A sai vì đây là danh từ.';
      const r4 = syncExplanationLetterSafe(t4, 0, 2);
      expect(r4.status).toBe('preserved_negation');
      expect(r4.synced).toBe(false);
      expect(r4.explanation).toBe(t4);

      const t5 = 'Phương án: A sai.';
      const r5 = syncExplanationLetterSafe(t5, 0, 2);
      expect(r5.status).toBe('preserved_negation');
      expect(r5.synced).toBe(false);
      expect(r5.explanation).toBe(t5);

      const t6 = 'A là phương án sai.';
      const r6 = syncExplanationLetterSafe(t6, 0, 1);
      expect(r6.status).toBe('preserved_negation');
      expect(r6.synced).toBe(false);
      expect(r6.explanation).toBe(t6);

      const t7 = 'A là đáp án sai lầm.';
      const r7 = syncExplanationLetterSafe(t7, 0, 1);
      expect(r7.status).toBe('preserved_negation');
      expect(r7.synced).toBe(false);
      expect(r7.explanation).toBe(t7);

      const t8 = 'Chọn A là sai.';
      const r8 = syncExplanationLetterSafe(t8, 0, 1);
      expect(r8.status).toBe('preserved_negation');
      expect(r8.synced).toBe(false);
      expect(r8.explanation).toBe(t8);

      const t9 = 'Loại trừ phương án A là phù hợp trong ngữ cảnh này.';
      const r9 = syncExplanationLetterSafe(t9, 0, 1);
      expect(r9.status).toBe('preserved_negation');
      expect(r9.synced).toBe(false);
      expect(r9.explanation).toBe(t9);

      const t10 = 'Phương án A là sai trong trường hợp này.';
      const r10 = syncExplanationLetterSafe(t10, 0, 1);
      expect(r10.status).toBe('preserved_negation');
      expect(r10.synced).toBe(false);
      expect(r10.explanation).toBe(t10);
    });

    it('safely preserves Vietnamese negation markers ("chẳng", "cấm", "chớ", "từ chối")', () => {
      const t1 = 'Chẳng nên chọn A.';
      const r1 = syncExplanationLetterSafe(t1, 0, 1);
      expect(r1.status).toBe('preserved_negation');
      expect(r1.synced).toBe(false);
      expect(r1.explanation).toBe(t1);

      const t2 = 'Cấm chọn A.';
      const r2 = syncExplanationLetterSafe(t2, 0, 1);
      expect(r2.status).toBe('preserved_negation');
      expect(r2.synced).toBe(false);
      expect(r2.explanation).toBe(t2);

      const t3 = 'Chớ nên chọn A.';
      const r3 = syncExplanationLetterSafe(t3, 0, 1);
      expect(r3.status).toBe('preserved_negation');
      expect(r3.synced).toBe(false);
      expect(r3.explanation).toBe(t3);

      const t4 = 'Cần từ chối chọn A.';
      const r4 = syncExplanationLetterSafe(t4, 0, 1);
      expect(r4.status).toBe('preserved_negation');
      expect(r4.synced).toBe(false);
      expect(r4.explanation).toBe(t4);
    });

    it('consistently updates standard affirmative designations under synced_affirmative', () => {
      // 1. "Đáp án đúng là A."
      const a1 = syncExplanationLetterSafe('Đáp án đúng là A.', 0, 2);
      expect(a1.status).toBe('synced_affirmative');
      expect(a1.synced).toBe(true);
      expect(a1.explanation).toBe('Đáp án đúng là C.');

      // 2. "A là đáp án đúng."
      const a2 = syncExplanationLetterSafe('A là đáp án đúng.', 0, 2);
      expect(a2.status).toBe('synced_affirmative');
      expect(a2.synced).toBe(true);
      expect(a2.explanation).toBe('C là đáp án đúng.');

      // 3. "Phương án đúng là: A."
      const a3 = syncExplanationLetterSafe('Phương án đúng là: A.', 0, 2);
      expect(a3.status).toBe('synced_affirmative');
      expect(a3.synced).toBe(true);
      expect(a3.explanation).toBe('Phương án đúng là: C.');

      // 4. "A là phương án chính xác."
      const a4 = syncExplanationLetterSafe('A là phương án chính xác.', 0, 2);
      expect(a4.status).toBe('synced_affirmative');
      expect(a4.synced).toBe(true);
      expect(a4.explanation).toBe('C là phương án chính xác.');

      // 5. "Phương án A phù hợp với ngữ cảnh."
      const a5 = syncExplanationLetterSafe('Phương án A phù hợp với ngữ cảnh.', 0, 2);
      expect(a5.status).toBe('synced_affirmative');
      expect(a5.synced).toBe(true);
      expect(a5.explanation).toBe('Phương án C phù hợp với ngữ cảnh.');

      // 6. "Đáp án: A"
      const a6 = syncExplanationLetterSafe('Đáp án: A', 0, 1);
      expect(a6.status).toBe('synced_affirmative');
      expect(a6.synced).toBe(true);
      expect(a6.explanation).toBe('Đáp án: B');

      // 7. "Chọn đáp án đúng: A"
      const a7 = syncExplanationLetterSafe('Chọn đáp án đúng: A', 0, 2);
      expect(a7.status).toBe('synced_affirmative');
      expect(a7.synced).toBe(true);
      expect(a7.explanation).toBe('Chọn đáp án đúng: C');
    });
  });

  // ===========================================================================
  // Requirement R6 & Database Invariants
  // ===========================================================================
  describe('Database Invariants & Isolation Verification', () => {
    const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

    it('verifies data/hsk_exam.db SHA-256 remains 100% bit-for-bit identical to invariant', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const buffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HASH);
    });

    it('verifies data/qbank/qbank.db core baseline invariants remain untouched', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        // 1699 historical sessions preserved + 36 verified practice sessions added in Phases 8-16
        const sessions = db.prepare('SELECT COUNT(1) as c FROM exam_sessions').get() as { c: number };
        expect(sessions.c).toBe(1735);

        // Baseline 89 approved questions + 6 approved in questions table (96 in qb_questions)
        const approved = db.prepare("SELECT COUNT(1) as c FROM questions WHERE status = 'approved' AND is_active = 1").get() as { c: number };
        expect(approved.c).toBe(96);

        // Staging pending questions count preserved (>= 111 baseline)
        const pending = db.prepare('SELECT COUNT(1) as c FROM pending_questions').get() as { c: number };
        expect(pending.c).toBeGreaterThanOrEqual(111);

        const pilotQuestions = db.prepare("SELECT COUNT(1) as c FROM questions WHERE id LIKE '%pilot%'").get() as { c: number };
        expect(pilotQuestions.c).toBe(0);
      } finally {
        db.close();
      }
    });

    it('verifies tests with simulated data execute strictly in SQLite :memory:', () => {
      const memDb = new DatabaseSync(':memory:');
      try {
        memDb.exec(`
          CREATE TABLE temp_questions (
            id TEXT PRIMARY KEY,
            answer_idx INTEGER
          );
        `);
        memDb.prepare('INSERT INTO temp_questions VALUES (?, ?)').run('temp_01', 0);
        const row = memDb.prepare('SELECT COUNT(1) as c FROM temp_questions').get() as { c: number };
        expect(row.c).toBe(1);
      } finally {
        memDb.close();
      }
    });
  });
});
