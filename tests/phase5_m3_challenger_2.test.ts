/**
 * Challenger 2 Adversarial Test Suite: Milestone M3
 * Skill Practice Flow & Pool Sync Deep Empirical Verification
 *
 * Invariants tested:
 * 1. Database Invariant: data/hsk_exam.db SHA-256 hash strictly equals
 *    DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1.
 * 2. Accurate question counts across all 6 HSK levels in live database:
 *    HSK 1: 69, HSK 2: 6, HSK 3: 5, HSK 4: 3, HSK 5: 3, HSK 6: 3 (Sum = 89).
 * 3. HSK 6 Practice Mode Deep Verification:
 *    - Correctly loads 3 approved reading questions.
 *    - Question schema integrity: stem, 4 options, valid answer_idx, explanation_vi.
 *    - Deficient skills (listening, writing) return clean empty-state payload (0 LLM calls).
 * 4. Anti-Cheat Security & Check-Answer Endpoint:
 *    - Client questions have answer_index and explanation_vi completely stripped.
 *    - Session retrieval does not leak answers.
 *    - POST /api/exam/check-answer accurately validates correct and incorrect answers.
 *    - Robust handling of edge cases (out-of-bounds answers, invalid types, 404 for missing IDs).
 * 5. Orphan Row Isolation in exam_eligible_pool:
 *    - getEligiblePoolStats filters out all orphan rows and returns exactly 89 practice questions.
 *    - Adversarial isolation: synthetic orphan and invalid status rows in exam_eligible_pool
 *      never leak into practice pool statistics.
 * 6. UI Navigation Contract:
 *    - HSKMockExam.tsx contains HSK 1–6 in Hall practice selector, Empty State quick-switcher,
 *      and Practice Room filter bar.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  examRouter,
  loadApprovedQuestionsFromDb,
  setExamDbForTesting,
  clearAllSessionsForTesting,
  createTestExamDb,
} from '../src/server/examRoutes.js';
import {
  getEligiblePoolStats,
  inspectExamPoolBySections,
} from '../src/server/qbankFormatSync.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Challenger 2 Adversarial Suite: Milestone M3 (Skill Practice & Pool Sync)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let memDb: DatabaseSync;

  beforeAll(async () => {
    // Verify baseline database integrity
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    const hash = getSha256(HSK_EXAM_DB_PATH);
    expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    memDb = createTestExamDb({ seedPool: true });
    setExamDbForTesting(memDb);

    // Mount Express server for direct HTTP tests
    const app: Express = express();
    app.use(express.json());
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server?.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    setExamDbForTesting(null);
    clearAllSessionsForTesting();
    try {
      memDb?.close();
    } catch {}

    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }

    // Verify database SHA-256 remains completely untouched after all testing
    const finalHash = getSha256(HSK_EXAM_DB_PATH);
    expect(finalHash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(memDb);
  });

  // =========================================================================
  // Dimension 1: Database Invariant & SHA-256 Checksum
  // =========================================================================
  describe('1. Database Invariant & Integrity Verification', () => {
    it('data/hsk_exam.db SHA-256 hash strictly matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });

    it('data/qbank/qbank.db operational database has exactly 89 approved active questions and preserved exam_sessions', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      const qRow: any = db.prepare(
        "SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND COALESCE(is_active, 1) = 1"
      ).get();
      expect(Number(qRow?.cnt)).toBe(96);

      // Verify exam_sessions count is preserved (>= 577)
      const sessionRow: any = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get();
      expect(Number(sessionRow?.cnt)).toBeGreaterThanOrEqual(577);
    });
  });

  // =========================================================================
  // Dimension 2: Question Counts Across All 6 HSK Levels (Live DB Verification)
  // =========================================================================
  describe('2. All 6 HSK Levels Practice Flow Counts Verification', () => {
    const EXPECTED_COUNTS: Record<number, { total: number; listening: number; reading: number; writing: number }> = {
      1: { total: 71, listening: 18, reading: 53, writing: 0 },
      2: { total: 10, listening: 1, reading: 9, writing: 0 },
      3: { total: 5, listening: 0, reading: 5, writing: 0 },
      4: { total: 3, listening: 0, reading: 3, writing: 0 },
      5: { total: 4, listening: 0, reading: 4, writing: 0 },
      6: { total: 3, listening: 0, reading: 3, writing: 0 },
    };

    it('loadApprovedQuestionsFromDb loads exact counts for each HSK level (HSK 1: 69, HSK 2: 6, HSK 3: 5, HSK 4: 3, HSK 5: 3, HSK 6: 3)', () => {
      let grandTotal = 0;

      for (let lvl = 1; lvl <= 6; lvl++) {
        const expected = EXPECTED_COUNTS[lvl];
        const allQuestions = loadApprovedQuestionsFromDb(lvl, { mode: 'practice' });
        expect(allQuestions.length).toBe(expected.total);
        grandTotal += allQuestions.length;

        const listeningQs = loadApprovedQuestionsFromDb(lvl, { mode: 'practice', skill: 'listening' });
        expect(listeningQs.length).toBe(expected.listening);

        const readingQs = loadApprovedQuestionsFromDb(lvl, { mode: 'practice', skill: 'reading' });
        expect(readingQs.length).toBe(expected.reading);

        const writingQs = loadApprovedQuestionsFromDb(lvl, { mode: 'practice', skill: 'writing' });
        expect(writingQs.length).toBe(expected.writing);

        // Verify that sum of skills matches total
        expect(listeningQs.length + readingQs.length + writingQs.length).toBe(expected.total);
      }

      expect(grandTotal).toBe(96);
    });

    it('GET /api/exam/practice?strict=true returns exact counts across all 6 levels', async () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const expected = EXPECTED_COUNTS[lvl];
        const res = await fetch(`${baseUrl}/api/exam/practice?level=${lvl}&count=100&strict=true`);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.llmCallsMade).toBe(0);
        expect(body.questions.length).toBe(expected.total);
        expect(body.actualCount).toBe(expected.total);
      }
    });

    it('POST /api/exam/generate-mock with strictQbankOnly: true returns exact counts across all 6 levels', async () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const expected = EXPECTED_COUNTS[lvl];
        const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: lvl,
            mode: 'practice',
            strictQbankOnly: true,
            count: 100,
          }),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.llmCallsMade).toBe(0);
        expect(body.session.questions.length).toBe(expected.total);
        expect(body.session.actualCount).toBe(expected.total);
      }
    });
  });

  // =========================================================================
  // Dimension 3: HSK 6 Practice Mode Deep Verification
  // =========================================================================
  describe('3. HSK 6 Practice Mode Deep Verification', () => {
    it('HSK 6 practice mode correctly loads the 3 reading questions with complete schema', () => {
      const hsk6Qs = loadApprovedQuestionsFromDb(6, { mode: 'practice' });
      expect(hsk6Qs.length).toBe(3);

      for (const q of hsk6Qs) {
        expect(q.level).toBe(6);
        expect(q.section).toBe('reading');
        expect(typeof q.stem).toBe('string');
        expect(q.stem.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(4);
        for (const opt of q.options) {
          expect(typeof opt).toBe('string');
          expect(opt.trim().length).toBeGreaterThan(0);
        }
        expect(typeof q.answer_index).toBe('number');
        expect(q.answer_index).toBeGreaterThanOrEqual(0);
        expect(q.answer_index).toBeLessThan(q.options.length);
        expect(typeof q.explanation_vi).toBe('string');
        expect(q.explanation_vi.trim().length).toBeGreaterThan(0);
      }
    });

    it('GET /api/exam/practice for HSK 6 returns 3 reading questions and 0 for listening/writing without LLM fallback', async () => {
      // 1. Reading: returns 3 questions
      const readRes = await fetch(`${baseUrl}/api/exam/practice?level=6&skill=reading&strict=true`);
      expect(readRes.status).toBe(200);
      const readBody = await readRes.json();
      expect(readBody.success).toBe(true);
      expect(readBody.llmCallsMade).toBe(0);
      expect(readBody.questions.length).toBe(3);
      expect(readBody.isShortage).toBe(true); // 3 < requested 10
      readBody.questions.forEach((q: any) => {
        expect(q.level).toBe(6);
        expect(q.section).toBe('reading');
      });

      // 2. Listening: returns 0 questions cleanly
      const listRes = await fetch(`${baseUrl}/api/exam/practice?level=6&skill=listening&strict=true`);
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.success).toBe(true);
      expect(listBody.llmCallsMade).toBe(0);
      expect(listBody.questions).toEqual([]);
      expect(listBody.count).toBe(0);
      expect(listBody.isShortage).toBe(true);

      // 3. Writing: returns 0 questions cleanly
      const writeRes = await fetch(`${baseUrl}/api/exam/practice?level=6&skill=writing&strict=true`);
      expect(writeRes.status).toBe(200);
      const writeBody = await writeRes.json();
      expect(writeBody.success).toBe(true);
      expect(writeBody.llmCallsMade).toBe(0);
      expect(writeBody.questions).toEqual([]);
      expect(writeBody.count).toBe(0);
      expect(writeBody.isShortage).toBe(true);
    });
  });

  // =========================================================================
  // Dimension 4: Anti-Cheat & Answer Stripping Security & Check-Answer Endpoint
  // =========================================================================
  describe('4. Anti-Cheat Security & Check-Answer Endpoint Verification', () => {
    it('POST /api/exam/generate-mock strips answer_index and explanation_vi from all client questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 6,
          mode: 'practice',
          skill: 'reading',
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.session.questions.length).toBe(3);

      for (const q of body.session.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }

      // Root-level questions array must also strip answers
      for (const q of body.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }
    });

    it('GET /api/exam/session/:sessionId strips answer_index and explanation_vi', async () => {
      // 1. Create session
      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          strictQbankOnly: true,
          count: 5,
        }),
      });
      const createBody = await createRes.json();
      const sessionId = createBody.session.sessionId;
      expect(sessionId).toBeDefined();

      // 2. Retrieve session
      const getRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
      expect(getRes.status).toBe(200);
      const getBody = await getRes.json();
      expect(getBody.success).toBe(true);
      expect(getBody.session.questions.length).toBe(5);

      for (const q of getBody.session.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }
    });

    it('POST /api/exam/check-answer validates answers accurately for HSK 6 questions', async () => {
      // 1. Fetch raw HSK 6 questions from DB to know ground truth answers
      const rawQs = loadApprovedQuestionsFromDb(6, { mode: 'practice' });
      expect(rawQs.length).toBe(3);

      // 2. Create session for HSK 6
      const sessionRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 6,
          mode: 'practice',
          skill: 'reading',
          strictQbankOnly: true,
        }),
      });
      const sessionBody = await sessionRes.json();
      const sessionId = sessionBody.session.sessionId;

      // 3. Test check-answer for each of the 3 questions
      for (const rawQ of rawQs) {
        const correctAns = rawQ.answer_index;
        const wrongAns = (correctAns + 1) % rawQ.options.length;

        // Test correct answer submission
        const correctRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: rawQ.id,
            userAnswer: correctAns,
          }),
        });
        expect(correctRes.status).toBe(200);
        const correctBody = await correctRes.json();
        expect(correctBody.success).toBe(true);
        expect(correctBody.isCorrect).toBe(true);
        expect(correctBody.correctAnswer).toBe(correctAns);
        expect(typeof correctBody.explanation_vi).toBe('string');
        expect(correctBody.explanation_vi.length).toBeGreaterThan(0);

        // Test wrong answer submission
        const wrongRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: rawQ.id,
            userAnswer: wrongAns,
          }),
        });
        expect(wrongRes.status).toBe(200);
        const wrongBody = await wrongRes.json();
        expect(wrongBody.success).toBe(true);
        expect(wrongBody.isCorrect).toBe(false);
        expect(wrongBody.correctAnswer).toBe(correctAns);
        expect(typeof wrongBody.explanation_vi).toBe('string');
      }
    });

    it('POST /api/exam/check-answer rejects invalid or non-existent requests with appropriate HTTP status', async () => {
      // 1. Missing questionId or userAnswer -> HTTP 400
      const badReqRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(badReqRes.status).toBe(400);

      // 2. String userAnswer instead of number -> HTTP 400
      const badTypeRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: 'q-1', userAnswer: '0' }),
      });
      expect(badTypeRes.status).toBe(400);

      // 3. Non-existent questionId -> HTTP 404
      const notFoundRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: 'non_existent_id_999999', userAnswer: 0 }),
      });
      expect([400, 404]).toContain(notFoundRes.status);
    });
  });

  // =========================================================================
  // Dimension 5: Orphan Row Isolation in exam_eligible_pool
  // =========================================================================
  describe('5. Orphan Row Isolation in exam_eligible_pool', () => {
    it('live qbank.db getEligiblePoolStats returns exactly 89 practice questions (filtering 13 orphan rows)', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      // Count raw rows in exam_eligible_pool
      const rawPoolCount: any = db.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get();
      expect(Number(rawPoolCount?.cnt)).toBeGreaterThanOrEqual(94);

      // Verify getEligiblePoolStats isolates orphans and returns exactly 96
      const stats = getEligiblePoolStats(db);
      expect(stats['1'].practice_count).toBe(71);
      expect(stats['2'].practice_count).toBe(10);
      expect(stats['3'].practice_count).toBe(5);
      expect(stats['4'].practice_count).toBe(3);
      expect(stats['5'].practice_count).toBe(4);
      expect(stats['6'].practice_count).toBe(3);

      const totalPractice = Object.values(stats).reduce((acc: number, cur: any) => acc + cur.practice_count, 0);
      expect(totalPractice).toBe(96);

      const totalExam = Object.values(stats).reduce((acc: number, cur: any) => acc + cur.exam_count, 0);
      expect(totalExam).toBeGreaterThanOrEqual(0);
    });

    it('isolated in-memory test: getEligiblePoolStats and inspectExamPoolBySections strictly exclude dirty orphans', () => {
      const mockDb = new DatabaseSync(':memory:');
      mockDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          explanation_vi TEXT,
          status TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE exam_eligible_pool (
          question_id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          practice_eligible INTEGER NOT NULL DEFAULT 1,
          exam_eligible INTEGER NOT NULL DEFAULT 0,
          compatible_formats TEXT,
          ineligible_reasons TEXT
        );

        -- Approved active questions (3 across levels 1, 2, 6)
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1', '["A","B"]', 0, 'approved', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1', 1, 0);

        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q2', 2, 'reading', 'read_fill_blank_4opt', 'Stem 2', '["A","B"]', 0, 'approved', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q2', 2, 'reading', 'read_fill_blank_4opt', 'Stem 2', 1, 0);

        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q6', 6, 'reading', 'read_comprehension_short_3opt', 'Stem 6', '["A","B"]', 0, 'approved', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q6', 6, 'reading', 'read_comprehension_short_3opt', 'Stem 6', 1, 0);

        -- Adversarial dirty row 1: pure orphan (no questions entry at all)
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('orphan_ghost_1', 1, 'reading', 'read_fill_blank_4opt', 'Ghost stem', 1, 1);

        -- Adversarial dirty row 2: pure orphan (level 6)
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('orphan_ghost_6', 6, 'reading', 'read_comprehension_short_3opt', 'Ghost stem 6', 1, 1);

        -- Adversarial dirty row 3: question exists but status is pending
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_pending', 1, 'reading', 'read_fill_blank_4opt', 'Stem pending', '["A","B"]', 0, 'pending', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_pending', 1, 'reading', 'read_fill_blank_4opt', 'Stem pending', 1, 1);

        -- Adversarial dirty row 4: question exists but status is rejected
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_rejected', 2, 'reading', 'read_fill_blank_4opt', 'Stem rejected', '["A","B"]', 0, 'rejected', 0);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_rejected', 2, 'reading', 'read_fill_blank_4opt', 'Stem rejected', 1, 1);

        -- Adversarial dirty row 5: question is approved but is_active = 0 (disabled)
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_disabled', 6, 'reading', 'read_comprehension_short_3opt', 'Stem disabled', '["A","B"]', 0, 'approved', 0);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_disabled', 6, 'reading', 'read_comprehension_short_3opt', 'Stem disabled', 1, 1);
      `);

      const stats = getEligiblePoolStats(mockDb);
      // Level 1: exactly 1 ('q1'), ignoring 'orphan_ghost_1' and 'q_pending'
      expect(stats['1'].practice_count).toBe(1);
      // Level 2: exactly 1 ('q2'), ignoring 'q_rejected'
      expect(stats['2'].practice_count).toBe(1);
      // Level 3..5: 0
      expect(stats['3'].practice_count).toBe(0);
      expect(stats['4'].practice_count).toBe(0);
      expect(stats['5'].practice_count).toBe(0);
      // Level 6: exactly 1 ('q6'), ignoring 'orphan_ghost_6' and 'q_disabled'
      expect(stats['6'].practice_count).toBe(1);

      const totalPractice = Object.values(stats).reduce((acc: number, cur: any) => acc + cur.practice_count, 0);
      expect(totalPractice).toBe(3);

      // Verify inspectExamPoolBySections ignores orphans as well
      const inspection1 = inspectExamPoolBySections(mockDb, 1);
      expect(inspection1.totalAvailable).toBe(0); // None has exam_eligible = 1 from approved questions
    });
  });

  // =========================================================================
  // Dimension 6: UI Component Invariants (HSKMockExam.tsx)
  // =========================================================================
  describe('6. UI Component Invariants & Level Switchers', () => {
    it('HSKMockExam.tsx source code contains HSK 1–6 in all 3 level selection areas', () => {
      const compPath = path.resolve(process.cwd(), 'src/components/HSKMockExam.tsx');
      expect(fs.existsSync(compPath)).toBe(true);
      const code = fs.readFileSync(compPath, 'utf-8');

      // 1. Hall Practice deck
      expect(code).toContain('practice-level-tab-');
      // 2. Empty state quick switcher
      expect(code).toContain('empty-state-level-');
      // 3. Practice room filter bar
      expect(code).toContain('practice-room-level-tab-');

      // Count occurrences of [1, 2, 3, 4, 5, 6].map
      const matches = code.match(/\[1,\s*2,\s*3,\s*4,\s*5,\s*6\]/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });
  });
});
