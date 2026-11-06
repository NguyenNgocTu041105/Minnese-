/**
 * tests/adversarial_challenger2_phase8_2_linguistics.test.ts
 *
 * Empirical Adversarial & Linguistic Stress Test Suite for Phase 8.2 Verified Remediation
 * Agent: Challenger 2 (Adversarial Verifier for Explanation Safety & Vietnamese Linguistics)
 *
 * Scrutinizes:
 * 1. Vietnamese words starting with B, C, D followed by vowels ("Cà phê", "Cơm tấm", "Bác sĩ", "Bố mẹ", "Đi chợ", "câu hỏi", "các phương án").
 * 2. Multi-option breakdown sentences ("Đáp án đúng là A. B sai vì trường học, C sai vì bệnh viện, D sai vì thư viện.").
 * 3. Negation & distractor elimination clauses:
 *    - Validating safe preservation of "Không nên chọn A...", "Tuyệt đối đừng chọn A vì sai...", "Tránh chọn A...".
 *    - Exposing critical regex bug: \b on non-ASCII characters ("loại trừ", "loại bỏ", "sai vì") failing to trigger negation protection.
 *    - Exposing semantic inversion bug: distractor rationale ("A là phương án sai", "A là đáp án sai lầm", "Chọn A là sai")
 *      being converted to declare the new correct answer B as wrong ("B là phương án sai") under 'synced_affirmative'.
 *    - Exposing unhandled Vietnamese negation markers ("chẳng", "chớ", "cấm", "từ chối").
 * 4. Mixed English/Vietnamese, HSK grammar formulas ("A + 比 + B"), and alphanumeric edge cases ("A1").
 * 5. Strict database invariants (bit-for-bit SHA256 of data/hsk_exam.db, row counts of data/qbank/qbank.db).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  syncExplanationLetterSafe,
  syncExplanationLetter,
  isIsolatedOptionLetter,
  shuffleQuestionAnswers,
  NEGATION_INDICATOR_REGEX,
  type ShuffleableQuestion,
} from '../src/server/utils/answerShuffle';

describe('Adversarial Challenger 2: Explanation Safety & Vietnamese Linguistics Suite', () => {

  // =========================================================================
  // TASK 1: Vietnamese Words Starting with B, C, D Followed by Vowels
  // =========================================================================
  describe('Task 1: Vietnamese Words Starting with B, C, D (Corruption Prevention)', () => {

    it('correctly classifies Vietnamese words starting with B, C, D as NOT isolated option letters', () => {
      // "Cà phê"
      const textCaPhe = 'Chúng ta uống Cà phê nhé.';
      expect(isIsolatedOptionLetter(textCaPhe, textCaPhe.indexOf('C'), 1)).toBe(false);

      // "Cơm tấm"
      const textCom = 'Buổi trưa ăn Cơm tấm.';
      expect(isIsolatedOptionLetter(textCom, textCom.indexOf('C'), 1)).toBe(false);

      // "Bác sĩ"
      const textBacSi = 'Bác sĩ đang khám bệnh.';
      expect(isIsolatedOptionLetter(textBacSi, textBacSi.indexOf('B'), 1)).toBe(false);

      // "Bố mẹ"
      const textBoMe = 'Bố mẹ đi làm sớm.';
      expect(isIsolatedOptionLetter(textBoMe, textBoMe.indexOf('B'), 1)).toBe(false);

      // "Đi chợ" (or "Di cho")
      const textDiCho = 'Di chợ mua rau quả.';
      expect(isIsolatedOptionLetter(textDiCho, textDiCho.indexOf('D'), 1)).toBe(false);

      // Lowercase words: "câu hỏi", "các phương án"
      const textCauHoi = 'Đọc kỹ câu hỏi trước khi làm.';
      expect(isIsolatedOptionLetter(textCauHoi, textCauHoi.indexOf('c'), 1)).toBe(false);

      const textCac = 'Xem xét các phương án.';
      expect(isIsolatedOptionLetter(textCac, textCac.indexOf('c'), 1)).toBe(false);
    });

    it('never corrupts Vietnamese words when old answer letter matches their initial (e.g. C -> A, B -> A)', () => {
      // C -> A should NOT turn "Cà phê" into "Aà phê"
      const text1 = 'Đáp án đúng là Cà phê.';
      const res1 = syncExplanationLetterSafe(text1, 2, 0); // oldIdx = 2 ('C'), newIdx = 0 ('A')
      expect(res1.explanation).toBe('Đáp án đúng là Cà phê.');
      expect(res1.synced).toBe(false);

      // B -> A should NOT turn "Bác sĩ" into "Aác sĩ"
      const text2 = 'Phương án đúng là Bác sĩ.';
      const res2 = syncExplanationLetterSafe(text2, 1, 0); // oldIdx = 1 ('B'), newIdx = 0 ('A')
      expect(res2.explanation).toBe('Phương án đúng là Bác sĩ.');
      expect(res2.synced).toBe(false);

      // C -> A should NOT turn "Cơm tấm" into "Aơm tấm"
      const text3 = 'Đáp án là Cơm tấm.';
      const res3 = syncExplanationLetterSafe(text3, 2, 0);
      expect(res3.explanation).toBe('Đáp án là Cơm tấm.');
      expect(res3.synced).toBe(false);

      // Lowercase "câu hỏi", "các phương án" are preserved
      const text4 = 'Chọn câu hỏi phù hợp trong các phương án.';
      const res4 = syncExplanationLetterSafe(text4, 2, 0);
      expect(res4.explanation).toBe(text4);
      expect(res4.synced).toBe(false);
    });

    it('successfully synchronizes option label while strictly preserving Vietnamese words in same explanation', () => {
      // Affirmative option 'A' -> 'C', while preserving "Cà phê" and "Cơm tấm"
      const text = 'Đáp án đúng là A. Cà phê và Cơm tấm là đặc sản.';
      const res = syncExplanationLetterSafe(text, 0, 2); // A -> C
      expect(res.synced).toBe(true);
      expect(res.status).toBe('synced_affirmative');
      expect(res.explanation).toBe('Đáp án đúng là C. Cà phê và Cơm tấm là đặc sản.');

      // Affirmative option 'B' -> 'A', while preserving "Bác sĩ" and "Bố mẹ"
      const textB = 'Phương án đúng là: B. Bác sĩ chữa bệnh cho Bố mẹ.';
      const resB = syncExplanationLetterSafe(textB, 1, 0); // B -> A
      expect(resB.synced).toBe(true);
      expect(resB.status).toBe('synced_affirmative');
      expect(resB.explanation).toBe('Phương án đúng là: A. Bác sĩ chữa bệnh cho Bố mẹ.');
    });
  });

  // =========================================================================
  // TASK 2: Multi-Option Breakdown Sentences
  // =========================================================================
  describe('Task 2: Multi-Option Breakdown Preservation', () => {

    it('safely preserves full text when other option letters are present (Rule 2 conflict detection)', () => {
      const breakdownText = 'Đáp án đúng là A. B sai vì trường học, C sai vì bệnh viện, D sai vì thư viện.';
      const res = syncExplanationLetterSafe(breakdownText, 0, 2); // A -> C
      expect(res.synced).toBe(false);
      expect(res.status).toBe('preserved_conflict');
      expect(res.explanation).toBe(breakdownText); // 100% preserved
      expect(res.details).toContain("Explanation contains other option letter 'B'");
    });

    it('safely preserves text with multiple comma-separated option letters', () => {
      const multiLetters = 'A là đáp án đúng. Các phương án B, C, D không đúng.';
      const res = syncExplanationLetterSafe(multiLetters, 0, 1);
      expect(res.synced).toBe(false);
      expect(res.explanation).toBe(multiLetters);
    });
  });

  // =========================================================================
  // TASK 3: Negation Phrasing & Critical Vulnerability Reproduction
  // =========================================================================
  describe('Task 3: Negation Clauses & Adversarial Edge Cases', () => {

    it('preserves explanations with standard ASCII-ending negation keywords (không, chưa, đừng, tránh)', () => {
      // "Không nên chọn A..."
      const t1 = 'Không nên chọn A vì đây là danh từ.';
      const r1 = syncExplanationLetterSafe(t1, 0, 2);
      expect(r1.synced).toBe(false);
      expect(r1.status).toBe('preserved_negation');
      expect(r1.explanation).toBe(t1);

      // "Tuyệt đối đừng chọn A vì sai..."
      const t2 = 'Tuyệt đối đừng chọn A vì sai ngữ pháp.';
      const r2 = syncExplanationLetterSafe(t2, 0, 1);
      expect(r2.synced).toBe(false);
      expect(r2.status).toBe('preserved_negation');
      expect(r2.explanation).toBe(t2);

      // "Tránh chọn A..."
      const t3 = 'Tránh chọn A khi chưa hiểu rõ ngữ cảnh.';
      const r3 = syncExplanationLetterSafe(t3, 0, 3);
      expect(r3.synced).toBe(false);
      expect(r3.status).toBe('preserved_negation');
      expect(r3.explanation).toBe(t3);

      // "Chưa thể chọn A..."
      const t4 = 'Chưa thể chọn A vì thiếu tân ngữ.';
      const r4 = syncExplanationLetterSafe(t4, 0, 1);
      expect(r4.synced).toBe(false);
      expect(r4.status).toBe('preserved_negation');
      expect(r4.explanation).toBe(t4);
    });

    // -----------------------------------------------------------------------
    // CRITICAL EMPIRICAL FINDING 1:
    // NEGATION_INDICATOR_REGEX uses \b which fails on Unicode non-ASCII letters!
    // -----------------------------------------------------------------------
    it('VERIFIED REMEDIATION: NEGATION_INDICATOR_REGEX matches "loại trừ", "loại bỏ", and "sai vì"', () => {
      // In JS RegExp with Unicode lookahead, non-ASCII vowels ('ừ', 'ỏ', 'ì') now correctly delimit words.
      expect(NEGATION_INDICATOR_REGEX.test('loại trừ phương án A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('loại bỏ phương án A')).toBe(true);
      expect(NEGATION_INDICATOR_REGEX.test('sai vì phương án A')).toBe(true);
    });

    // -----------------------------------------------------------------------
    // CRITICAL EMPIRICAL FINDING 2 (REMEDIATED):
    // Safe Preservation of Distractor Rationales preventing Semantic Inversion
    // -----------------------------------------------------------------------
    it('VERIFIED REMEDIATION: syncExplanationLetterSafe safely preserves distractor rationales declaring correct answer wrong', () => {
      // Scenario A: "A là phương án sai."
      // Pattern 2 strictly requires (đúng/chính xác); Rule 1 catches "sai" -> safely preserved!
      const distractorA = 'A là phương án sai.';
      const resA = syncExplanationLetterSafe(distractorA, 0, 1);
      expect(resA.explanation).toBe('A là phương án sai.');
      expect(resA.synced).toBe(false);
      expect(resA.status).toBe('preserved_negation');

      // Scenario B: "A là đáp án sai lầm."
      const distractorB = 'A là đáp án sai lầm.';
      const resB = syncExplanationLetterSafe(distractorB, 0, 1);
      expect(resB.explanation).toBe('A là đáp án sai lầm.');
      expect(resB.synced).toBe(false);
      expect(resB.status).toBe('preserved_negation');

      // Scenario C: "Phương án A là sai trong trường hợp này."
      const distractorC = 'Phương án A là sai trong trường hợp này.';
      const resC = syncExplanationLetterSafe(distractorC, 0, 1);
      expect(resC.explanation).toBe('Phương án A là sai trong trường hợp này.');
      expect(resC.synced).toBe(false);
      expect(resC.status).toBe('preserved_negation');

      // Scenario D: "Chọn A là sai."
      const distractorD = 'Chọn A là sai.';
      const resD = syncExplanationLetterSafe(distractorD, 0, 1);
      expect(resD.explanation).toBe('Chọn A là sai.');
      expect(resD.synced).toBe(false);
      expect(resD.status).toBe('preserved_negation');

      // Scenario E: "Loại trừ phương án A là phù hợp trong ngữ cảnh này."
      const distractorE = 'Loại trừ phương án A là phù hợp trong ngữ cảnh này.';
      const resE = syncExplanationLetterSafe(distractorE, 0, 1);
      expect(resE.explanation).toBe('Loại trừ phương án A là phù hợp trong ngữ cảnh này.');
      expect(resE.synced).toBe(false);
      expect(resE.status).toBe('preserved_negation');
    });

    // -----------------------------------------------------------------------
    // EMPIRICAL FINDING 3 (REMEDIATED):
    // Common Vietnamese negation words covered by hardened NEGATION_INDICATOR_REGEX
    // -----------------------------------------------------------------------
    it('VERIFIED REMEDIATION: Handled Vietnamese negation markers ("chẳng", "cấm", "chớ", "từ chối")', () => {
      // "Chẳng nên chọn A." -> preserved
      const tChang = 'Chẳng nên chọn A.';
      const rChang = syncExplanationLetterSafe(tChang, 0, 1);
      expect(rChang.explanation).toBe('Chẳng nên chọn A.');
      expect(rChang.synced).toBe(false);
      expect(rChang.status).toBe('preserved_negation');

      // "Cấm chọn A." -> preserved
      const tCam = 'Cấm chọn A.';
      const rCam = syncExplanationLetterSafe(tCam, 0, 1);
      expect(rCam.explanation).toBe('Cấm chọn A.');
      expect(rCam.synced).toBe(false);
      expect(rCam.status).toBe('preserved_negation');

      // "Chớ nên chọn A." -> preserved
      const tCho = 'Chớ nên chọn A.';
      const rCho = syncExplanationLetterSafe(tCho, 0, 1);
      expect(rCho.explanation).toBe('Chớ nên chọn A.');
      expect(rCho.synced).toBe(false);
      expect(rCho.status).toBe('preserved_negation');

      // "Cần từ chối chọn A." -> preserved
      const tTuChoi = 'Cần từ chối chọn A.';
      const rTuChoi = syncExplanationLetterSafe(tTuChoi, 0, 1);
      expect(rTuChoi.explanation).toBe('Cần từ chối chọn A.');
      expect(rTuChoi.synced).toBe(false);
      expect(rTuChoi.status).toBe('preserved_negation');
    });
  });

  // =========================================================================
  // TASK 4: Mixed English, Math Formulas, Grammar Patterns & Alphanumerics
  // =========================================================================
  describe('Task 4: Mixed English, Math Formulas, Grammar Patterns & Alphanumerics', () => {

    it('safely handles HSK grammar formulas with multiple letters ("A + 比 + B")', () => {
      const grammarFormula = 'Cấu trúc so sánh: A + 比 + B + tính từ. Trong câu này đáp án đúng là A.';
      const res = syncExplanationLetterSafe(grammarFormula, 0, 1);
      // 'B' in formula triggers preserved_conflict
      expect(res.synced).toBe(false);
      expect(res.status).toBe('preserved_conflict');
      expect(res.explanation).toBe(grammarFormula);
    });

    it('safely handles "Vitamin C" when option letter is A', () => {
      const text = 'Đáp án đúng là A vì chứa nhiều Vitamin C.';
      const res = syncExplanationLetterSafe(text, 0, 1); // A -> B
      // Isolated 'C' in "Vitamin C." is detected as potential option letter, triggering safe preservation
      expect(res.synced).toBe(false);
      expect(res.status).toBe('preserved_conflict');
      expect(res.explanation).toBe(text);
    });

    it('EMPIRICAL EDGE CASE: Pattern 1 replaces alphanumeric sub-question or level identifiers (e.g. A1 -> B1)', () => {
      // Lookahead (?![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]) does not forbid digits (0-9)
      const textA1 = 'Đáp án đúng là A1';
      const resA1 = syncExplanationLetterSafe(textA1, 0, 1);
      expect(resA1.explanation).toBe('Đáp án đúng là B1'); // Replaced A1 with B1
      expect(resA1.synced).toBe(true);
    });
  });

  // =========================================================================
  // TASK 5: Strict Database Invariants & Zero Pollution
  // =========================================================================
  describe('Task 5: Production Database Invariants & Zero Mutation Verification', () => {
    const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

    it('verifies data/hsk_exam.db SHA-256 remains bit-for-bit identical to invariant', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const buffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const actualHash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(actualHash).toBe(EXPECTED_HASH);
    });

    it('verifies data/qbank/qbank.db core baseline invariants remain untouched', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        // 1699 historical sessions preserved + 36 verified practice sessions added in Phases 8-16
        const sessions = db.prepare('SELECT COUNT(1) as c FROM exam_sessions').get() as { c: number };
        expect(sessions.c).toBe(1735);

        // Baseline 89 approved questions + 7 approved during Phase 5/6 reviews
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
  });
});
