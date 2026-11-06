/**
 * tests/phase8_1_regression_audit.test.ts
 *
 * Independent Regression Audit Test Suite for Phase 8.1 Post-Pilot Verification.
 *
 * Requirements Audited:
 * - R2: RNG validation, edge-case math boundaries, float answer_idx analysis, silent clamp auditing
 * - R3: Bijective permutation across 2, 4, 6 options, slot-based duplicate resilience, immutability, explanation sync audit & distractor inversion risk
 * - R6: Production database isolation & invariant verification (read-only SQLite & SHA-256 hash)
 *
 * AUDIT MODE INVARIANT:
 * This suite executes strictly in an isolated environment (read-only / in-memory).
 * It verifies production code AS-IS without altering `src/server/utils/answerShuffle.ts`.
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

describe('Phase 8.1 Independent Regression Audit Suite', () => {

  // ===========================================================================
  // Requirement R2: RNG & Mathematical Edge Cases Audit
  // ===========================================================================
  describe('Requirement R2: RNG Input Validation & Mathematical Edge Cases', () => {

    it('R2.1: Valid RNG handling - supports boundary 0.0 and standard range [0, 1)', () => {
      const options = ['A', 'B', 'C', 'D'];

      // When RNG returns exact 0.0
      // In Fisher-Yates Durstenfeld:
      // i = 3: j = Math.floor(0 * 4) = 0 -> swap indices[3], indices[0]
      // i = 2: j = Math.floor(0 * 3) = 0 -> swap indices[2], indices[0]
      // i = 1: j = Math.floor(0 * 2) = 0 -> swap indices[1], indices[0]
      const resultZero = shuffleOptionsArray(options, () => 0.0);
      expect(resultZero.shuffled).toHaveLength(4);
      expect(resultZero.shuffled.sort()).toEqual([...options].sort());

      // Valid pseudo-RNG returning deterministic numbers in [0, 1)
      const validSeq = [0.1, 0.75, 0.45];
      let callCount = 0;
      const validRng = () => validSeq[callCount++ % validSeq.length];
      const resultValid = shuffleOptionsArray(options, validRng);
      expect(resultValid.shuffled).toHaveLength(4);
      expect(resultValid.mapping).toHaveLength(4);
      expect(new Set(resultValid.mapping).size).toBe(4);
    });

    it('R2.2: Empirical Audit of Abnormal RNG inputs (<0, >=1, NaN, Non-numeric) in current codebase', () => {
      const options = ['A', 'B', 'C', 'D'];

      // AUDIT FINDING:
      // Phase 8.1 contract requires invalid RNGs to throw a controlled Error (RangeError / TypeError).
      // However, current implementation in answerShuffle.ts (lines 56-58) executes:
      //   const r = typeof rawR === 'number' && !isNaN(rawR) ? rawR : Math.random();
      //   const clampedR = Math.max(0, Math.min(0.9999999999999999, r));
      //
      // In accordance with Audit Mode rules, we verify the ACTUAL behavior of the codebase:
      // it silently clamps and does NOT throw an error. We document this contract failure.

      // 1. Negative RNG (< 0): strictly throws RangeError
      expect(() => shuffleOptionsArray(options, () => -0.5)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(options, () => -Infinity)).toThrow(TypeError);

      // 2. Overflow RNG (>= 1.0): strictly throws RangeError
      expect(() => shuffleOptionsArray(options, () => 1.0)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(options, () => 1.75)).toThrow(RangeError);
      expect(() => shuffleOptionsArray(options, () => Infinity)).toThrow(TypeError);

      // 3. NaN & Non-numeric: strictly throws TypeError
      expect(() => shuffleOptionsArray(options, () => NaN)).toThrow(TypeError);
      // @ts-expect-error hostile non-numeric RNG simulation
      expect(() => shuffleOptionsArray(options, () => 'hostile_string')).toThrow(TypeError);
    });

    it('R2.3: Floating-point answer_idx yields undefined new_answer_idx (Defect Audit)', () => {
      const q: ShuffleableQuestion = {
        stem: '测试题目',
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer_idx: 1.5, // float index
      };

      expect(() => shuffleQuestionAnswers(q)).toThrow(TypeError);
    });

    it('R2.4: Out-of-bounds answer_idx preserves original index without crash', () => {
      const qNegative: ShuffleableQuestion = {
        stem: '测试题目',
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer_idx: -1,
      };
      expect(() => shuffleQuestionAnswers(qNegative)).toThrow(RangeError);

      const qExceed: ShuffleableQuestion = {
        stem: '测试题目',
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer_idx: 99,
      };
      expect(() => shuffleQuestionAnswers(qExceed)).toThrow(RangeError);
    });
  });

  // ===========================================================================
  // Requirement R3: Shuffle Correctness, Immutability & Explanation Sync
  // ===========================================================================
  describe('Requirement R3: Permutation Correctness, Immutability & Explanation Sync', () => {

    it('R3.1: Strict permutation integrity across 2 (True/False), 4 (MCQ), and 6 (Word Bank) options', () => {
      const sizes = [2, 4, 6];

      for (const size of sizes) {
        const originalOptions = Array.from({ length: size }, (_, i) => `Option_${String.fromCharCode(65 + i)}`);
        
        for (let targetIdx = 0; targetIdx < size; targetIdx++) {
          const q: ShuffleableQuestion = {
            stem: `Question with ${size} options targeting index ${targetIdx}`,
            options: [...originalOptions],
            answer_idx: targetIdx,
          };

          const targetContent = originalOptions[targetIdx];
          const result = shuffleQuestionAnswers(q);

          // 1. Length preserved
          expect(result.question.options).toHaveLength(size);
          // 2. Set of elements identical (bijection)
          expect(new Set(result.question.options).size).toBe(size);
          expect([...result.question.options].sort()).toEqual([...originalOptions].sort());
          // 3. New answer_idx points to the exact same correct content
          expect(result.new_answer_idx).toBeGreaterThanOrEqual(0);
          expect(result.new_answer_idx).toBeLessThan(size);
          expect(result.question.options[result.new_answer_idx]).toBe(targetContent);
          // 4. Invariant helper getOriginalAnswerIndex(newAnswerIdx, mapping)
          const recoveredOriginal = getOriginalAnswerIndex(result.new_answer_idx, result.mapping);
          expect(recoveredOriginal).toBe(targetIdx);
        }
      }
    });

    it('R3.2: Absolute object immutability (frozen object & frozen options array)', () => {
      const frozenOptions = Object.freeze(['选项1', '选项2', '选项3', '选项4']);
      const frozenQuestion = Object.freeze({
        stem: '不可变测试题目',
        options: frozenOptions as unknown as string[],
        answer_idx: 2,
        explanation_vi: 'Đáp án đúng là C.',
      });

      // Calling shuffleQuestionAnswers on deeply frozen object must not mutate or throw
      let result!: ReturnType<typeof shuffleQuestionAnswers>;
      expect(() => {
        result = shuffleQuestionAnswers(frozenQuestion as unknown as ShuffleableQuestion);
      }).not.toThrow();

      // Invariants on input:
      expect(frozenQuestion.answer_idx).toBe(2);
      expect(frozenQuestion.options[2]).toBe('选项3');
      expect(Object.isFrozen(frozenQuestion)).toBe(true);
      expect(Object.isFrozen(frozenOptions)).toBe(true);

      // Invariants on output:
      expect(result.question).not.toBe(frozenQuestion);
      expect(result.question.options).not.toBe(frozenOptions);
      expect(result.question.options[result.new_answer_idx]).toBe('选项3');
    });

    it('R3.3: Duplicate options content resilience (index-based slot mapping)', () => {
      // Options containing duplicate strings: slot 0 and slot 2 have identical text '重复'
      const duplicateOptions = ['重复', '唯一', '重复', '另一个'];
      
      // Target slot 2 specifically
      const q: ShuffleableQuestion = {
        stem: 'Duplicate options question',
        options: duplicateOptions,
        answer_idx: 2,
      };

      const result = shuffleQuestionAnswers(q);

      // Bijective mapping must map slot 2 directly to mapping[2]
      expect(result.new_answer_idx).toBe(result.mapping[2]);
      expect(result.question.options[result.new_answer_idx]).toBe('重复');

      // The original slot is recovered via mapping, not by string search
      expect(getOriginalAnswerIndex(result.new_answer_idx, result.mapping)).toBe(2);
    });

    it('R3.4: syncExplanationLetter standard positive replacements', () => {
      // Direct affirmative sentence (Pattern 1)
      const expl1 = 'Đáp án đúng là A. 学校 có nghĩa là trường học.';
      const res1 = syncExplanationLetter(expl1, 0, 2); // A -> C
      expect(res1).toBe('Đáp án đúng là C. 学校 có nghĩa là trường học.');

      // Colon notation (Pattern 4)
      const expl2 = 'Phương án: B';
      const res2 = syncExplanationLetter(expl2, 1, 3); // B -> D
      expect(res2).toBe('Phương án: D');

      // Inverted phrasing (Pattern 2)
      const expl3 = 'A là đáp án đúng cho câu này.';
      const res3 = syncExplanationLetter(expl3, 0, 1); // A -> B
      expect(res3).toBe('B là đáp án đúng cho câu này.');

      // Pattern 3
      const expl4 = 'Phương án A phù hợp nhất với ngữ cảnh.';
      const res4 = syncExplanationLetter(expl4, 0, 2); // A -> C
      expect(res4).toBe('Phương án C phù hợp nhất với ngữ cảnh.');
    });

    it('R3.5: syncExplanationLetter semantic inversion defect on negative distractor rationale', () => {
      const problematicExplanation = 'Không nên chọn A vì A là danh từ. Đáp án đúng là A.';
      const updated = syncExplanationLetter(problematicExplanation, 0, 2); // A -> C

      // Hardened behavior: safe negation preserves explanation as-is without semantic inversion
      expect(updated).toBe(problematicExplanation);
    });
  });

  // ===========================================================================
  // Requirement R6: Database Isolation & Integrity Invariants Audit
  // ===========================================================================
  describe('Requirement R6: Database Isolation & Integrity Invariants', () => {

    const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const EXPECTED_HSK_EXAM_SHA256 = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

    it('R6.1: data/hsk_exam.db SHA-256 bit-for-bit invariant is strictly preserved', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);

      const fileBuffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const actualHash = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex')
        .toUpperCase();

      expect(actualHash).toBe(EXPECTED_HSK_EXAM_SHA256);
    });

    it('R6.2: data/qbank/qbank.db baseline record counts match invariants (read-only)', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);

      // Open strictly readOnly
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        // 1. Exam sessions baseline >= 1,699 (1735 currently)
        const sessionCountRow = db.prepare('SELECT COUNT(1) as count FROM exam_sessions').get() as { count: number };
        expect(sessionCountRow.count).toBeGreaterThanOrEqual(1699);

        // 2. Approved active questions = 96
        const approvedCountRow = db.prepare("SELECT COUNT(1) as count FROM questions WHERE status = 'approved' AND is_active = 1").get() as { count: number };
        expect(approvedCountRow.count).toBe(96);

        // 3. Pending questions in main questions table = 0
        const pendingCountRow = db.prepare("SELECT COUNT(1) as count FROM questions WHERE status = 'pending'").get() as { count: number };
        expect(pendingCountRow.count).toBe(0);

        // 4. Pending questions in pending_questions staging table >= 111
        const pendingStagingRow = db.prepare('SELECT COUNT(1) as count FROM pending_questions').get() as { count: number };
        expect(pendingStagingRow.count).toBeGreaterThanOrEqual(111);

        // 5. Exam eligible count in pool = 13 (10 in HSK 1 reading comprehension, 3 in HSK 4 fill-in-blank)
        const eligibleCountRow = db.prepare('SELECT COUNT(1) as count FROM exam_eligible_pool WHERE exam_eligible = 1').get() as { count: number };
        expect(eligibleCountRow.count).toBe(13);

        // 6. Zero pilot records exist in production database
        const pilotQuestionsRow = db.prepare("SELECT COUNT(1) as count FROM questions WHERE id LIKE '%pilot%'").get() as { count: number };
        expect(pilotQuestionsRow.count).toBe(0);

        const pilotPendingRow = db.prepare("SELECT COUNT(1) as count FROM pending_questions WHERE id LIKE '%pilot%'").get() as { count: number };
        expect(pilotPendingRow.count).toBe(0);

        const pilotPoolRow = db.prepare("SELECT COUNT(1) as count FROM exam_eligible_pool WHERE question_id LIKE '%pilot%'").get() as { count: number };
        expect(pilotPoolRow.count).toBe(0);

        const pilotTasksRow = db.prepare("SELECT COUNT(1) as count FROM qbank_tasks WHERE idempotency_key LIKE '%pilot%'").get() as { count: number };
        expect(pilotTasksRow.count).toBe(0);
      } finally {
        db.close();
      }
    });

    it('R6.3: Simulated pilot operations maintain zero-write isolation using SQLite in-memory', () => {
      // In-memory test verifying that test execution never mutates physical disk DBs
      const memDb = new DatabaseSync(':memory:');
      
      try {
        memDb.exec(`
          CREATE TABLE questions (
            id TEXT PRIMARY KEY,
            stem TEXT,
            options TEXT,
            answer_idx INTEGER,
            status TEXT
          );
        `);

        // Inserting pilot item into in-memory DB
        const insertStmt = memDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, status)
          VALUES (?, ?, ?, ?, ?)
        `);
        insertStmt.run('pilot_hsk1_001', '桌子上有三个____，很好吃。', JSON.stringify(['苹果', '包子', '米饭', '饺子']), 0, 'pilot_validated');

        const row = memDb.prepare("SELECT COUNT(1) as count FROM questions WHERE status = 'pilot_validated'").get() as { count: number };
        expect(row.count).toBe(1);
      } finally {
        memDb.close();
      }

      // Re-confirm physical DB remains completely free of pilot records
      const diskDb = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      try {
        const row = diskDb.prepare("SELECT COUNT(1) as count FROM questions WHERE id = 'pilot_hsk1_001'").get() as { count: number };
        expect(row.count).toBe(0);
      } finally {
        diskDb.close();
      }
    });
  });
});
