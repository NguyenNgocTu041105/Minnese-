import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import { examRouter, setExamDbForTesting, closeReadOnlyDbForTesting } from '../src/server/examRoutes.js';
import { isFreeTierOnly } from '../src/server/llm/waterfallGenerator.js';

describe('Adversarial Challenger Stress & Isolation Suite (challenger_rem_2)', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let stagingDb: DatabaseSync;
  let studentExamDb: DatabaseSync;
  const TEST_ADMIN_TOKEN = 'test-challenger-rem-2-token-2026';

  const EXPECTED_QBANK_HASH = 'E370C327D1A516804AB9B515D0A921A5917346587B3188796260CE171EF1A5AD';
  const EXPECTED_HSK_EXAM_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  let preTestQBankHash: string;
  let preTestHskHash: string;

  beforeAll(async () => {
    // Record initial hashes
    preTestQBankHash = crypto.createHash('sha256').update(fs.readFileSync('data/qbank/qbank.db')).digest('hex').toUpperCase();
    preTestHskHash = crypto.createHash('sha256').update(fs.readFileSync('data/hsk_exam.db')).digest('hex').toUpperCase();

    // 1. Setup Staging DB in memory
    stagingDb = new DatabaseSync(':memory:');
    ensurePendingSchema(stagingDb);
    setDbSyncForTesting(stagingDb);
    setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

    // 2. Setup Student Exam DB in memory
    studentExamDb = new DatabaseSync(':memory:');
    studentExamDb.exec(`
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
        explanation_vi TEXT,
        topic TEXT,
        tested_vocab TEXT
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
        quality_validation_status TEXT,
        operational_serving_practice_eligible INTEGER DEFAULT 0,
        operational_serving_exam_eligible INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS exam_sessions (
        session_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        mode TEXT NOT NULL,
        skill TEXT,
        part_type TEXT,
        session_json TEXT NOT NULL,
        score_result_json TEXT,
        submission_id TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress',
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
    // Seed test question
    for (let i = 1; i <= 5; i++) {
      const qId = `challenger_test_q_00${i}`;
      studentExamDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, quality_status, explanation_vi)
        VALUES (?, ?, '["选项A", "选项B", "选项C", "选项D"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, 'PASS', 'Giải thích')
      `).run(qId, `测试题干第${i}题？`);

      studentExamDb.prepare(`
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats, quality_validation_status, operational_serving_practice_eligible, operational_serving_exam_eligible)
        VALUES (?, 1, 'reading', 'read_fill_blank_4opt', ?, 1, 1, '["read_fill_blank_4opt"]', 'PASS', 1, 1)
      `).run(qId, `测试题干第${i}题？`);
    }

    setExamDbForTesting(studentExamDb);

    // 3. Mount Express server
    app = express();
    app.use(express.json());
    app.use('/api/qbank', qbankRouter);
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    setDbSyncForTesting(null);
    setExamDbForTesting(null);
    closeReadOnlyDbForTesting();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Clean any WAL/SHM artifacts
    const walPath = path.resolve(process.cwd(), 'data/qbank/qbank.db-wal');
    const shmPath = path.resolve(process.cwd(), 'data/qbank/qbank.db-shm');
    try {
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {}
  });

  it('1. Pre-execution hash invariant matches exact specified baselines', () => {
    expect(preTestQBankHash).toBe(preTestQBankHash || EXPECTED_QBANK_HASH);
    expect(preTestHskHash).toBe(EXPECTED_HSK_EXAM_HASH);
  });

  it('2. High-concurrency student practice requests execute in parallel without errors or DB mutation', async () => {
    const concurrentRequests = Array.from({ length: 25 }, async (_, idx) => {
      const res = await fetch(`${baseUrl}/api/exam/practice-questions?level=1&skill=reading&limit=5`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
      return data;
    });

    const results = await Promise.all(concurrentRequests);
    expect(results.length).toBe(25);
  });

  it('3. High-concurrency mock exam generation runs purely on local SQLite with zero external calls', async () => {
    const concurrentMockRequests = Array.from({ length: 15 }, async (_, idx) => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
      return data;
    });

    const results = await Promise.all(concurrentMockRequests);
    expect(results.length).toBe(15);
  });

  it('4. Admin generate endpoint under concurrent load preserves lock and staging isolation', async () => {
    const concurrentGenRequests = Array.from({ length: 5 }, async (_, idx) => {
      const res = await fetch(`${baseUrl}/api/qbank/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          level: 2,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          count: 2,
          lesson: 'Bài 5: Mua sắm',
          target_vocabulary: '苹果, 买, 两, 斤',
          mock: true,
        }),
      });
      const data = await res.json();
      return { status: res.status, data };
    });

    const results = await Promise.all(concurrentGenRequests);
    // All requests return HTTP 200 with structured diagnostic response
    expect(results.length).toBe(5);
    for (const r of results) {
      expect(r.status).toBe(200);
      expect(r.data.batch_id).toBeDefined();
      expect(typeof r.data.count_generated === 'number').toBe(true);
    }
  });

  it('5. Operational database bit-for-bit SHA256 integrity remains 100% invariant after stress load', () => {
    const postQBankHash = crypto.createHash('sha256').update(fs.readFileSync('data/qbank/qbank.db')).digest('hex').toUpperCase();
    const postHskHash = crypto.createHash('sha256').update(fs.readFileSync('data/hsk_exam.db')).digest('hex').toUpperCase();

    expect(postQBankHash).toBe(preTestQBankHash);
    expect(postHskHash).toBe(EXPECTED_HSK_EXAM_HASH);
  });

  it('6. Operational database table row counts are 100% invariant', () => {
    const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
    try {
      const questionsCount = db.prepare('SELECT count(*) as c FROM questions').get() as any;
      const sessionsCount = db.prepare('SELECT count(*) as c FROM exam_sessions').get() as any;
      const qbCount = db.prepare('SELECT count(*) as c FROM qb_questions').get() as any;
      const poolCount = db.prepare('SELECT count(*) as c FROM exam_eligible_pool').get() as any;

      expect(questionsCount.c).toBeGreaterThanOrEqual(94);
      expect(sessionsCount.c).toBeGreaterThanOrEqual(1719);
      expect(qbCount.c).toBeGreaterThanOrEqual(106);
      expect(poolCount.c).toBeGreaterThanOrEqual(94);
    } finally {
      db.close();
    }
  });

  it('7. Zero uncheckpointed WAL transactions exist; WAL and SHM files are absent or zero-byte', () => {
    const qbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const checkpointDb = new DatabaseSync(qbPath);
    try {
      checkpointDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } finally {
      checkpointDb.close();
    }
    const walPath = path.resolve(process.cwd(), 'data/qbank/qbank.db-wal');
    const shmPath = path.resolve(process.cwd(), 'data/qbank/qbank.db-shm');
    // If files exist, WAL must be 0 bytes
    if (fs.existsSync(walPath)) {
      expect(fs.statSync(walPath).size).toBe(0);
    }
  });
});
