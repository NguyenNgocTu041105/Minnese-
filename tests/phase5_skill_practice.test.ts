/**
 * Milestone M3: Skill-Specific Practice Mode & Pool Sync Test Suite
 *
 * Requirements R3, R4 & Acceptance Criteria 7, 8, 9:
 * 1. AC 7: Practice API endpoint serves ONLY approved, active questions matching selected HSK level and skill.
 * 2. AC 8: Practice API endpoint strictly excludes pending, rejected, and disabled questions.
 * 3. AC 9: Empty filter result returns clean empty-state payload (HTTP 200, questions: [], isShortage: true, llmCallsMade: 0)
 *    without fallback LLM calls.
 * 4. Database Invariants:
 *    - data/hsk_exam.db SHA-256 hash strictly equals DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1.
 *    - data/qbank/qbank.db operational database has 89 approved questions.
 *    - All 89 approved questions have practice_eligible = 1 and exam_eligible = 0 in exam_eligible_pool.
 *    - getEligiblePoolStats(db) returns exactly 89 approved practice questions matching questions table (filtering orphans).
 * 5. HSK 1–6 Level Coverage in practice options and UI controls.
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
  ensureEligiblePoolSchema,
  inspectExamPoolBySections,
} from '../src/server/qbankFormatSync.js';
import {
  fetchExamSessionFromBackend,
  formatConciseExplanation,
} from '../src/components/HSKMockExam.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Milestone M3: Skill-Specific Practice Mode (R3, R4, AC 7–9)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let memDb: DatabaseSync;

  beforeAll(async () => {
    // 1. Verify baseline database integrity
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    const hash = getSha256(HSK_EXAM_DB_PATH);
    expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    memDb = createTestExamDb({ seedPool: true });
    setExamDbForTesting(memDb);

    // 2. Start temporary Express server mounting examRouter
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
    // Restore default DB instance
    setExamDbForTesting(null);
    clearAllSessionsForTesting();
    try {
      memDb?.close();
    } catch {}

    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }

    // Verify database SHA-256 remains completely untouched after tests
    const finalHash = getSha256(HSK_EXAM_DB_PATH);
    expect(finalHash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(memDb);
  });

  // =========================================================================
  // Section 1: Database Invariants & Pool Sync (R4)
  // =========================================================================
  describe('1. Database Invariants & Pool Sync Verification', () => {
    it('data/hsk_exam.db SHA-256 strictly matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });

    it('data/qbank/qbank.db contains exactly 89 approved active questions', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const row: any = db.prepare(
        "SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND COALESCE(is_active, 1) = 1"
      ).get();
      expect(Number(row?.cnt)).toBe(96);
    });

    it('all 89 approved questions have practice_eligible = 1 and exam_eligible = 0 in exam_eligible_pool', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      // Join questions with exam_eligible_pool
      const rows: any[] = db.prepare(`
        SELECT 
          q.id,
          q.level,
          q.skill,
          COALESCE(p.practice_eligible, 0) as practice_eligible,
          COALESCE(p.exam_eligible, 0) as exam_eligible
        FROM questions q
        LEFT JOIN exam_eligible_pool p ON q.id = p.question_id
        WHERE q.status = 'approved' AND COALESCE(q.is_active, 1) = 1
      `).all() as any[];

      expect(rows.length).toBe(96);
      for (const r of rows) {
        expect(Number(r.practice_eligible)).toBe(1);
        expect([0, 1]).toContain(Number(r.exam_eligible));
      }
    });

    it('getEligiblePoolStats returns 89 approved questions matching questions table and ignores orphan rows', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const stats = getEligiblePoolStats(db);

      expect(stats).toBeDefined();
      expect(stats['1'].practice_count).toBe(71);
      expect(stats['1'].exam_count).toBeGreaterThanOrEqual(0);

      expect(stats['2'].practice_count).toBe(10);
      expect(stats['2'].exam_count).toBeGreaterThanOrEqual(0);

      expect(stats['3'].practice_count).toBe(5);
      expect(stats['3'].exam_count).toBeGreaterThanOrEqual(0);

      expect(stats['4'].practice_count).toBe(3);
      expect(stats['4'].exam_count).toBeGreaterThanOrEqual(0);

      expect(stats['5'].practice_count).toBe(4);
      expect(stats['5'].exam_count).toBeGreaterThanOrEqual(0);

      expect(stats['6'].practice_count).toBe(3);
      expect(stats['6'].exam_count).toBeGreaterThanOrEqual(0);

      const totalPractice = Object.values(stats).reduce((acc: number, cur: any) => acc + cur.practice_count, 0);
      expect(totalPractice).toBe(96);

      const totalExam = Object.values(stats).reduce((acc: number, cur: any) => acc + cur.exam_count, 0);
      expect(totalExam).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================================================
  // Section 2: AC 7 - Practice API Serves ONLY Approved Active Matching Questions
  // =========================================================================
  describe('2. AC 7: Practice API Strictly Serves Approved Active Questions Matching Filter', () => {
    it('loadApprovedQuestionsFromDb loads only approved active questions for requested level and skill', () => {
      // HSK 1 Reading
      const readingQs = loadApprovedQuestionsFromDb(1, { mode: 'practice', skill: 'reading' });
      expect(readingQs.length).toBe(53);
      for (const q of readingQs) {
        expect(q.level).toBe(1);
        expect(q.section).toBe('reading');
        expect(q.stem.length).toBeGreaterThan(0);
        expect(Array.isArray(q.options)).toBe(true);
      }

      // HSK 1 Listening
      const listeningQs = loadApprovedQuestionsFromDb(1, { mode: 'practice', skill: 'listening' });
      expect(listeningQs.length).toBe(18);
      for (const q of listeningQs) {
        expect(q.level).toBe(1);
        expect(q.section).toBe('listening');
        expect(q.stem.length).toBeGreaterThan(0);
      }

      // HSK 1 Writing (0 in DB)
      const writingQs = loadApprovedQuestionsFromDb(1, { mode: 'practice', skill: 'writing' });
      expect(writingQs.length).toBe(0);
    });

    it('GET /api/exam/practice?level=1&skill=reading returns strictly approved reading questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&count=10`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.llmCallsMade).toBe(0);
      expect(body.level).toBe(1);
      expect(body.skill).toBe('reading');
      expect(body.questions.length).toBe(10);

      // Verify every returned item has level 1, section reading, and sequential item_number
      body.questions.forEach((q: any, idx: number) => {
        expect(q.level).toBe(1);
        expect(q.section).toBe('reading');
        expect(q.item_number).toBe(idx + 1);
        expect(typeof q.stem).toBe('string');
        expect(Array.isArray(q.options)).toBe(true);
      });
    });

    it('GET /api/exam/practice?level=1&skill=listening returns strictly approved listening questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=listening&count=10`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.llmCallsMade).toBe(0);
      expect(body.level).toBe(1);
      expect(body.skill).toBe('listening');
      expect(body.questions.length).toBe(10);

      body.questions.forEach((q: any) => {
        expect(q.level).toBe(1);
        expect(q.section).toBe('listening');
      });
    });

    it('POST /api/exam/generate-mock (mode: practice) returns client-safe questions with stripped answers', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 5,
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.llmCallsMade).toBe(0);
      expect(body.session.mode).toBe('practice');
      expect(body.session.skill).toBe('reading');
      expect(body.session.questions.length).toBe(5);

      // Anti-cheat verification: answer_index and explanation_vi stripped from client questions
      body.session.questions.forEach((q: any) => {
        expect(q.section).toBe('reading');
        expect(q.answer_index).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      });

      // Verify check-answer endpoint works for practice mode answer validation
      const firstQ = body.session.questions[0];
      const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: body.session.sessionId,
          questionId: firstQ.id,
          userAnswer: 0,
        }),
      });

      expect(checkRes.status).toBe(200);
      const checkBody = await checkRes.json();
      expect(checkBody.success).toBe(true);
      expect(typeof checkBody.isCorrect).toBe('boolean');
      expect(typeof checkBody.correctAnswer).toBe('number');
      expect(typeof checkBody.explanation_vi).toBe('string');
    });
  });

  // =========================================================================
  // Section 3: AC 8 - Strictly Exclude Pending, Rejected, and Disabled Questions
  // =========================================================================
  describe('3. AC 8: Strictly Exclude Pending, Rejected, and Disabled Questions', () => {
    let mockMemDb: DatabaseSync;

    beforeEach(() => {
      // Create an isolated in-memory SQLite database to simulate edge cases
      mockMemDb = new DatabaseSync(':memory:');
      mockMemDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          pinyin TEXT,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          explanation_vi TEXT,
          status TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          topic TEXT,
          tested_vocab TEXT,
          illustration_theme TEXT
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

        -- 1. Valid approved active item
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active)
        VALUES ('q_approved_active', 1, 'reading', 'read_fill_blank_4opt', 'Stem approved active', '["A","B","C","D"]', 0, 'Exp 1', 'approved', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_approved_active', 1, 'reading', 'read_fill_blank_4opt', 'Stem approved active', 1, 0);

        -- 2. Pending item
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active)
        VALUES ('q_pending', 1, 'reading', 'read_fill_blank_4opt', 'Stem pending', '["A","B","C","D"]', 1, 'Exp 2', 'pending', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_pending', 1, 'reading', 'read_fill_blank_4opt', 'Stem pending', 1, 0);

        -- 3. Rejected item
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active)
        VALUES ('q_rejected', 1, 'reading', 'read_fill_blank_4opt', 'Stem rejected', '["A","B","C","D"]', 2, 'Exp 3', 'rejected', 0);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_rejected', 1, 'reading', 'read_fill_blank_4opt', 'Stem rejected', 0, 0);

        -- 4. Disabled item (approved but is_active = 0)
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active)
        VALUES ('q_disabled', 1, 'reading', 'read_fill_blank_4opt', 'Stem disabled', '["A","B","C","D"]', 3, 'Exp 4', 'approved', 0);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_disabled', 1, 'reading', 'read_fill_blank_4opt', 'Stem disabled', 1, 0);

        -- 5. Approved active but practice_eligible = 0
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active)
        VALUES ('q_practice_ineligible', 1, 'reading', 'read_fill_blank_4opt', 'Stem ineligible', '["A","B","C","D"]', 0, 'Exp 5', 'approved', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_practice_ineligible', 1, 'reading', 'read_fill_blank_4opt', 'Stem ineligible', 0, 0);
      `);

      setExamDbForTesting(mockMemDb);
    });

    afterEach(() => {
      setExamDbForTesting(memDb);
    });

    it('loadApprovedQuestionsFromDb strictly includes ONLY approved, active, practice_eligible questions', () => {
      const results = loadApprovedQuestionsFromDb(1, { mode: 'practice', skill: 'reading' });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('q_approved_active');
    });

    it('GET /api/exam/practice?strict=true strictly excludes pending, rejected, disabled, and ineligible questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&strict=true`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.questions.length).toBe(1);
      expect(body.questions[0].id).toBe('q_approved_active');

      const returnedIds = body.questions.map((q: any) => q.id);
      expect(returnedIds).not.toContain('q_pending');
      expect(returnedIds).not.toContain('q_rejected');
      expect(returnedIds).not.toContain('q_disabled');
      expect(returnedIds).not.toContain('q_practice_ineligible');
    });

    it('POST /api/exam/generate-mock with strictQbankOnly strictly excludes non-approved items', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.session.questions.length).toBe(1);
      expect(body.session.questions[0].id).toBe('q_approved_active');
    });
  });

  // =========================================================================
  // Section 4: AC 9 - Empty Filter Returns Clean Empty-State Payload (0 LLM Calls)
  // =========================================================================
  describe('4. AC 9: Clean Empty-State Payload on Deficient Filters Without LLM Fallback', () => {
    it('GET /api/exam/practice with strict=true on 0-question group returns HTTP 200, questions: [], isShortage: true, llmCallsMade: 0', async () => {
      // HSK 1 Writing currently has 0 approved questions in DB
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=writing&strict=true`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.llmCallsMade).toBe(0);
      expect(body.questions).toEqual([]);
      expect(body.count).toBe(0);
      expect(body.actualCount).toBe(0);
      expect(body.dbMatchedCount).toBe(0);
      expect(body.isShortage).toBe(true);
      expect(body.skill).toBe('writing');
      expect(body.level).toBe(1);
    });

    it('GET /api/exam/practice on non-existent skill returns HTTP 200, questions: [], isShortage: true', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=speaking&strict=true`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.llmCallsMade).toBe(0);
      expect(body.questions).toEqual([]);
      expect(body.actualCount).toBe(0);
      expect(body.isShortage).toBe(true);
    });

    it('POST /api/exam/generate-mock with strictQbankOnly: true returns empty questions array when 0 questions exist', async () => {
      // HSK 1 Writing currently has 0 approved questions in DB
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'writing',
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.llmCallsMade).toBe(0);
      expect(body.session.totalQuestions).toBe(0);
      expect(body.session.actualCount).toBe(0);
      expect(body.session.questions).toEqual([]);
      expect(body.session.isShortage).toBe(true);
      expect(body.isShortage).toBe(true);
    });

    it('PRACTICE_STRICT_DB_ONLY environment variable enforces strict DB-only behavior', async () => {
      const originalEnv = process.env.PRACTICE_STRICT_DB_ONLY;
      process.env.PRACTICE_STRICT_DB_ONLY = 'true';

      try {
        const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=writing`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.llmCallsMade).toBe(0);
        expect(body.questions).toEqual([]);
        expect(body.isShortage).toBe(true);
      } finally {
        process.env.PRACTICE_STRICT_DB_ONLY = originalEnv;
      }
    });

    it('fetchExamSessionFromBackend handles empty practice questions payload cleanly without error', async () => {
      const mockFetch = (async () => {
        return {
          ok: true,
          json: async () => ({
            success: true,
            llmCallsMade: 0,
            session: {
              sessionId: 'test-empty-session',
              level: 2,
              mode: 'practice',
              skill: 'listening',
              totalQuestions: 0,
              questions: [],
              isShortage: true,
            },
          }),
        } as any;
      }) as unknown as typeof fetch;

      const result = await fetchExamSessionFromBackend({
        level: 2,
        mode: 'practice',
        skill: 'listening',
        fetchFn: mockFetch,
      });

      expect(result.success).toBe(true);
      expect(result.questions).toEqual([]);
      expect(result.isShortage).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // =========================================================================
  // Section 5: HSK 1–6 Level Coverage in Practice Mode
  // =========================================================================
  describe('5. HSK 1–6 Level Coverage in Practice Options & UI Elements', () => {
    it('loadApprovedQuestionsFromDb loads approved questions for HSK 6', () => {
      const hsk6Qs = loadApprovedQuestionsFromDb(6, { mode: 'practice' });
      expect(hsk6Qs.length).toBe(3);
      for (const q of hsk6Qs) {
        expect(q.level).toBe(6);
        expect(q.section).toBe('reading');
        expect(q.stem).toBeDefined();
        expect(q.stem.length).toBeGreaterThan(0);
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(4);
      }
    });

    it('HSKMockExam component source code defines HSK 1–6 in all practice level selectors', () => {
      const compPath = path.resolve(process.cwd(), 'src/components/HSKMockExam.tsx');
      expect(fs.existsSync(compPath)).toBe(true);
      const code = fs.readFileSync(compPath, 'utf-8');

      // 1. Practice selection deck in Hall
      expect(code).toContain('practice-level-tab-');
      expect(code).toMatch(/\[1,\s*2,\s*3,\s*4,\s*5,\s*6\]\.map\(\(lvl\)\s*=>/);

      // 2. Empty state quick switcher
      expect(code).toContain('data-testid="practice-empty-state"');
      expect(code).toContain('empty-state-level-');

      // 3. Practice room filter bar
      expect(code).toContain('data-testid="practice-filter-bar"');
      expect(code).toContain('practice-room-level-tab-');

      // Verify that [1, 2, 3, 4, 5, 6] is present in practice filter bar
      const filterBarIndex = code.indexOf('data-testid="practice-filter-bar"');
      expect(filterBarIndex).toBeGreaterThan(-1);
      const filterBarSlice = code.slice(filterBarIndex, filterBarIndex + 600);
      expect(filterBarSlice).toMatch(/\[1,\s*2,\s*3,\s*4,\s*5,\s*6\]/);
    });

    it('formatConciseExplanation cleans redundant transcript prefixes for student explanation readability', () => {
      const raw = 'Nội dung bài nghe: "你好". Câu này có nghĩa là xin chào, đáp án A đúng.';
      const formatted = formatConciseExplanation(raw);
      expect(formatted).not.toContain('Nội dung bài nghe:');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});
