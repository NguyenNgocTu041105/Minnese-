import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import http from 'http';
import { examRouter, setExamDbForTesting, loadApprovedQuestionsFromDb } from '../src/server/examRoutes.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';

describe('Phase A2: Real HTTP Serving Endpoints Fail-Closed Safety Verification', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let testDb: DatabaseSync;

  beforeAll(async () => {
    testDb = new DatabaseSync(':memory:');
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        quality_status TEXT,
        explanation_vi TEXT
      );
      CREATE TABLE IF NOT EXISTS pending_questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        quality_status TEXT
      );
      CREATE TABLE IF NOT EXISTS exam_eligible_pool (
        question_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT,
        stem TEXT,
        practice_eligible INTEGER DEFAULT 0,
        exam_eligible INTEGER DEFAULT 0,
        compatible_formats TEXT,
        ineligible_reasons TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Setup the 7 mandatory matrix combinations + 1 legitimate combination
    const insertQ = testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, quality_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPool = testDb.prepare(`
      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, practice_eligible, exam_eligible)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const defaultOpts = JSON.stringify(['两点', '三点', '四点']);

    // 1. pending + quality: PASS -> NOT SERVED
    insertQ.run('c1_pending_pass', '时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'pending', 1, 'PASS');
    insertPool.run('c1_pending_pass', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 2. rejected + quality: PASS -> NOT SERVED
    insertQ.run('c2_rejected_pass', '时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'rejected', 1, 'PASS');
    insertPool.run('c2_rejected_pass', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 3. approved + inactive + quality: PASS -> NOT SERVED
    insertQ.run('c3_approved_inactive', '时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 0, 'PASS');
    insertPool.run('c3_approved_inactive', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 4. approved + active + quality: FAIL -> NOT SERVED
    insertQ.run('c4_approved_fail', '时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'FAIL');
    insertPool.run('c4_approved_fail', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 5. approved + active + quality: REVIEW -> NOT SERVED
    insertQ.run('c5_approved_review', '时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'REVIEW');
    insertPool.run('c5_approved_review', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 6. approved + active + quality: UNKNOWN -> NOT SERVED
    insertQ.run('c6_approved_unknown', '时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'UNKNOWN');
    insertPool.run('c6_approved_unknown', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 7. approved + active + quality: missing/null -> NOT SERVED
    insertQ.run('c7_approved_missing', '时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, null);
    insertPool.run('c7_approved_missing', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 8. approved + active + quality: PASS + format compatible -> SERVED
    insertQ.run('c8_approved_active_pass_valid', '明天下午三点，我要打电话给妈妈。★ 时间是几点？', defaultOpts, 1, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'PASS');
    insertPool.run('c8_approved_active_pass_valid', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    setExamDbForTesting(testDb);

    app = express();
    app.use(express.json());
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    setExamDbForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (testDb) {
      testDb.close();
    }
  });

  describe('1. Direct loadApprovedQuestionsFromDb Fail-Closed Matrix', () => {
    it('strictly serves ONLY c8_approved_active_pass_valid in practice mode', () => {
      const questions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      const ids = questions.map((q) => q.id);
      expect(ids).toEqual(['c8_approved_active_pass_valid']);
      expect(ids).not.toContain('c1_pending_pass');
      expect(ids).not.toContain('c2_rejected_pass');
      expect(ids).not.toContain('c3_approved_inactive');
      expect(ids).not.toContain('c4_approved_fail');
      expect(ids).not.toContain('c5_approved_review');
      expect(ids).not.toContain('c6_approved_unknown');
      expect(ids).not.toContain('c7_approved_missing');
    });

    it('strictly serves ONLY c8_approved_active_pass_valid in mock mode', () => {
      const questions = loadApprovedQuestionsFromDb(1, { mode: 'mock' }, testDb);
      const ids = questions.map((q) => q.id);
      expect(ids).toEqual(['c8_approved_active_pass_valid']);
      expect(ids).not.toContain('c1_pending_pass');
      expect(ids).not.toContain('c2_rejected_pass');
      expect(ids).not.toContain('c3_approved_inactive');
      expect(ids).not.toContain('c4_approved_fail');
      expect(ids).not.toContain('c5_approved_review');
      expect(ids).not.toContain('c6_approved_unknown');
      expect(ids).not.toContain('c7_approved_missing');
    });
  });

  describe('2. Real HTTP Endpoints Fail-Closed Matrix', () => {
    it('GET /api/exam/practice: strictly blocks all 7 non-compliant states and serves ONLY c8', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&strict=true`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.questions)).toBe(true);

      const returnedIds = data.questions.map((q: any) => q.id);
      expect(returnedIds).toEqual(['c8_approved_active_pass_valid']);

      // Exhaustive block assertions:
      expect(returnedIds).not.toContain('c1_pending_pass');
      expect(returnedIds).not.toContain('c2_rejected_pass');
      expect(returnedIds).not.toContain('c3_approved_inactive');
      expect(returnedIds).not.toContain('c4_approved_fail');
      expect(returnedIds).not.toContain('c5_approved_review');
      expect(returnedIds).not.toContain('c6_approved_unknown');
      expect(returnedIds).not.toContain('c7_approved_missing');
    });

    it('GET /api/exam/practice-questions: alias route strictly blocks all 7 non-compliant states', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice-questions?level=1&strict=true`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      const returnedIds = data.questions.map((q: any) => q.id);
      expect(returnedIds).toEqual(['c8_approved_active_pass_valid']);
      expect(returnedIds).not.toContain('c1_pending_pass');
      expect(returnedIds).not.toContain('c2_rejected_pass');
      expect(returnedIds).not.toContain('c3_approved_inactive');
      expect(returnedIds).not.toContain('c4_approved_fail');
      expect(returnedIds).not.toContain('c5_approved_review');
      expect(returnedIds).not.toContain('c6_approved_unknown');
      expect(returnedIds).not.toContain('c7_approved_missing');
    });

    it('POST /api/exam/generate-mock: practice session strictly serves ONLY c8 and 0 unapproved/invalid', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          strictQbankOnly: true,
          count: 5,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.session).toBeDefined();
      expect(Array.isArray(data.session.questions)).toBe(true);

      const sessionIds = data.session.questions.map((q: any) => q.id);
      expect(sessionIds).toEqual(['c8_approved_active_pass_valid']);
      expect(sessionIds).not.toContain('c1_pending_pass');
      expect(sessionIds).not.toContain('c2_rejected_pass');
      expect(sessionIds).not.toContain('c3_approved_inactive');
      expect(sessionIds).not.toContain('c4_approved_fail');
      expect(sessionIds).not.toContain('c5_approved_review');
      expect(sessionIds).not.toContain('c6_approved_unknown');
      expect(sessionIds).not.toContain('c7_approved_missing');
    });
  });
});
