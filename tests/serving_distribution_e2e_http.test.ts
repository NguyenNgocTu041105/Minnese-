import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import http from 'http';
import { examRouter, setExamDbForTesting } from '../src/server/examRoutes.js';

describe('End-to-End Real HTTP Serving Distribution Safety', () => {
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
        is_active INTEGER DEFAULT 1
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

    // 1. Legitimate approved, active, eligible question
    testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('q_legit_approved', '他每天都去学校____。', JSON.stringify(['学习', '苹果', '飞机', '医生']), 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1);

    testDb.prepare(`
      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, practice_eligible, exam_eligible)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('q_legit_approved', 1, 'reading', 'read_fill_blank_4opt', 1, 1);

    // 2. Pending question (should NEVER leak)
    testDb.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('q_pending_leak', '我想喝____。', JSON.stringify(['茶', '书', '狗', '学校']), 0, 1, 'reading', 'read_fill_blank_4opt', 'pending', 1);

    // 3. Rejected question (should NEVER leak)
    testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('q_rejected_leak', '我看____。', JSON.stringify(['书', '笔', '桌子', '椅子']), 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', 1);

    // 4. Inactive question (is_active = 0, should NEVER leak)
    testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('q_inactive_leak', '这是我的____。', JSON.stringify(['猫', '水', '飞', '写']), 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 0);

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

  it('GET /api/exam/practice: strictly returns only approved active questions, 0 pending/rejected leaks', async () => {
    const res = await fetch(`${baseUrl}/api/exam/practice?level=1&strict=true`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBe(1);
    expect(data.questions[0].id).toBe('q_legit_approved');

    // Strict leak assertion
    const ids = data.questions.map((q: any) => q.id);
    expect(ids).not.toContain('q_pending_leak');
    expect(ids).not.toContain('q_rejected_leak');
    expect(ids).not.toContain('q_inactive_leak');
  });

  it('GET /api/exam/practice-questions: alias route strictly blocks pending and rejected questions', async () => {
    const res = await fetch(`${baseUrl}/api/exam/practice-questions?level=1&strict=true`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.questions.length).toBe(1);
    expect(data.questions[0].id).toBe('q_legit_approved');

    const ids = data.questions.map((q: any) => q.id);
    expect(ids).not.toContain('q_pending_leak');
    expect(ids).not.toContain('q_rejected_leak');
    expect(ids).not.toContain('q_inactive_leak');
  });

  it('POST /api/exam/generate-mock (practice mode): never leaks pending or rejected questions', async () => {
    const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 1,
        mode: 'practice',
        strict: true,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.questions.length).toBe(1);
    expect(data.questions[0].id).toBe('q_legit_approved');

    const ids = data.questions.map((q: any) => q.id);
    expect(ids).not.toContain('q_pending_leak');
    expect(ids).not.toContain('q_rejected_leak');
    expect(ids).not.toContain('q_inactive_leak');
  });

  it('POST /api/exam/generate-mock (mock mode): strictly rejects shortage without borrowing pending questions', async () => {
    const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 1,
        mode: 'mock',
      }),
    });

    // In mock mode, HSK 1 requires 40 questions. Only 1 is available.
    // It must return 400 with total_missing, NOT borrow pending questions!
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.success).toBe(false);
    expect(data.is_fully_eligible).toBe(false);
    expect(data.total_missing).toBeGreaterThan(0);
  });
});
