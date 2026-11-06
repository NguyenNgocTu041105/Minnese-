/**
 * tests/adversarial_m3_1_session_binding.test.ts
 *
 * Empirical Adversarial Challenger Suite for Milestone M3.1:
 * - POST /api/exam/check-answer session binding & isolation
 * - Missing sessionId rejection (HTTP 400 SESSION_REQUIRED)
 * - Non-existent / expired / invalid sessionId rejection (HTTP 404 SESSION_NOT_FOUND)
 * - Cross-session question ID boundary enforcement (HTTP 404 QUESTION_NOT_IN_SESSION)
 * - Complete elimination of raw DB & fixture grading fallback
 * - Anti-cheat answer masking across generate-mock and getSession endpoints
 * - Snapshot-bound grading accuracy (shuffled vs un-shuffled)
 * - 100% in-memory SQLite isolation (:memory:) and production DB SHA-256 preservation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Express } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  examRouter,
  createTestExamDb,
  setExamDbForTesting,
  clearAllSessionsForTesting,
  getSessionDirect,
} from '../src/server/examRoutes.js';
import { isServingAnswerShuffleEnabled } from '../src/server/utils/answerShuffle.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Adversarial Challenger M3.1: Session Binding & Anti-Cheat Answer Masking', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let memDb: DatabaseSync;
  const originalEnvShuffle = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;

  beforeAll(async () => {
    // 1. Verify baseline production DB integrity
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    // 2. Initialize in-memory SQLite DB
    memDb = createTestExamDb({ seedPool: false });

    // Seed test questions:
    // Session A pool: adv-q1, adv-q2
    // Session B pool: adv-q3, adv-q4
    // Raw DB orphan question: adv-q-orphan (in DB, never placed into any session)
    memDb.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        pinyin TEXT,
        explanation_vi TEXT,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        illustration_theme TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        is_active INTEGER NOT NULL DEFAULT 1,
        topic TEXT,
        tested_vocab TEXT,
        passage TEXT
      );
      CREATE TABLE IF NOT EXISTS exam_eligible_pool (
        question_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        stem TEXT NOT NULL,
        practice_eligible INTEGER NOT NULL DEFAULT 1,
        exam_eligible INTEGER NOT NULL DEFAULT 0,
        compatible_formats TEXT,
        ineligible_reasons TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, explanation_vi, status, is_active)
      VALUES 
        ('adv-q1', 'Chọn quả màu đỏ:', '["香蕉", "苹果", "葡萄", "西瓜"]', 1, 1, 'reading', 'read_match', 'Quả táo màu đỏ.', 'approved', 1),
        ('adv-q2', 'Chọn con vật sống dưới nước:', '["鱼", "鸟", "猫", "狗"]', 0, 1, 'reading', 'read_match', 'Cá sống dưới nước.', 'approved', 1),
        ('adv-q3', 'Chọn phương tiện có cánh:', '["汽车", "飞机", "轮船", "火车"]', 1, 1, 'reading', 'read_match', 'Máy bay có cánh.', 'approved', 1),
        ('adv-q4', 'Thời tiết mùa hè rất nóng.', '["对", "错"]', 0, 1, 'reading', 'read_tf', 'Nhận định đúng.', 'approved', 1),
        ('adv-q-orphan', 'Câu hỏi chỉ có trong DB gốc:', '["A", "B", "C", "D"]', 2, 1, 'reading', 'read_match', 'Giải thích câu orphan.', 'approved', 1);

      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES
        ('adv-q1', 1, 'reading', 'read_match', 'Chọn quả màu đỏ:', 1, 0),
        ('adv-q2', 1, 'reading', 'read_match', 'Chọn con vật sống dưới nước:', 1, 0),
        ('adv-q3', 1, 'reading', 'read_match', 'Chọn phương tiện có cánh:', 1, 0),
        ('adv-q4', 1, 'reading', 'read_tf', 'Thời tiết mùa hè rất nóng.', 1, 0),
        ('adv-q-orphan', 1, 'reading', 'read_match', 'Câu hỏi chỉ có trong DB gốc:', 1, 0);
    `);

    setExamDbForTesting(memDb);

    // 3. Start local Express test server
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
    // Restore environment variable
    if (originalEnvShuffle !== undefined) {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = originalEnvShuffle;
    } else {
      delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
    }

    setExamDbForTesting(null);
    clearAllSessionsForTesting();
    try {
      memDb?.close();
    } catch {}

    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }

    // Verify database SHA-256 remains completely untouched after tests
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(memDb);
  });

  // =========================================================================
  // Challenge Area 1: Adversarial Missing sessionId Rejection (HTTP 400)
  // =========================================================================
  describe('Challenge 1: Adversarial Missing sessionId Rejection', () => {
    it('rejects request with omitted sessionId field entirely', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
      expect(data.error).toContain('sessionId is required for check-answer');
    });

    it('rejects request with null sessionId', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: null,
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('rejects request with empty string sessionId ("")', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: '',
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('rejects request with boolean false sessionId', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: false,
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('rejects request with numeric 0 sessionId', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 0,
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('rejects completely empty JSON body ({})', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
    });
  });

  // =========================================================================
  // Challenge Area 2: Non-Existent, Expired & Malicious sessionId (HTTP 404)
  // =========================================================================
  describe('Challenge 2: Non-Existent, Expired & Malicious sessionId Rejection', () => {
    it('rejects random non-existent UUID sessionId with 404 SESSION_NOT_FOUND', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'b7c2901a-8f24-4f9e-bf23-8cf48c3b9999',
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });

    it('rejects SQL injection payload as sessionId with 404 SESSION_NOT_FOUND', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: "' OR 1=1 --",
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });

    it('rejects expired session snapshot from database with 404 SESSION_NOT_FOUND', async () => {
      const expiredSessionId = 'expired-session-challenge-123';
      const expiredSession: any = {
        sessionId: expiredSessionId,
        level: 1,
        mode: 'practice',
        questions: [
          {
            id: 'adv-q1',
            level: 1,
            section: 'reading',
            part_type: 'read_match',
            stem: 'Chọn quả màu đỏ:',
            options: ['香蕉', '苹果', '葡萄', '西瓜'],
            answer_index: 1,
            explanation_vi: 'Quả táo màu đỏ.',
          },
        ],
        createdAt: Date.now() - 1000000,
        expiresAt: Date.now() - 50000, // 50 seconds in the past
      };

      // Insert directly into exam_sessions DB table with past expires_at
      memDb.prepare(`
        INSERT INTO exam_sessions (session_id, level, mode, session_json, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        expiredSessionId,
        1,
        'practice',
        JSON.stringify(expiredSession),
        expiredSession.createdAt,
        expiredSession.expiresAt
      );

      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: expiredSessionId,
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });
  });

  // =========================================================================
  // Challenge Area 3: Cross-Session & Boundary Isolation (HTTP 404 QUESTION_NOT_IN_SESSION)
  // =========================================================================
  describe('Challenge 3: Cross-Session Question Isolation', () => {
    it('strictly isolates Session A and Session B questions and blocks cross-session checking', async () => {
      // Create Session A excluding adv-q3 and adv-q4
      const resA = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 2,
          excludeQuestionIds: ['adv-q3', 'adv-q4', 'adv-q-orphan'],
          strictQbankOnly: true,
        }),
      });
      const dataA = await resA.json();
      expect(dataA.success).toBe(true);
      const sessionIdA = dataA.sessionId;

      // Create Session B excluding adv-q1 and adv-q2
      const resB = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 2,
          excludeQuestionIds: ['adv-q1', 'adv-q2', 'adv-q-orphan'],
          strictQbankOnly: true,
        }),
      });
      const dataB = await resB.json();
      expect(dataB.success).toBe(true);
      const sessionIdB = dataB.sessionId;

      // Verify Session A contains adv-q1, not adv-q3
      const snapA = getSessionDirect(sessionIdA);
      const snapB = getSessionDirect(sessionIdB);
      expect(snapA?.questions.some((q) => q.id === 'adv-q1')).toBe(true);
      expect(snapA?.questions.some((q) => q.id === 'adv-q3')).toBe(false);
      expect(snapB?.questions.some((q) => q.id === 'adv-q3')).toBe(true);
      expect(snapB?.questions.some((q) => q.id === 'adv-q1')).toBe(false);

      // Attack: Send Session A id with Session B's question (adv-q3)
      const attackRes1 = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdA,
          questionId: 'adv-q3',
          userAnswer: 1,
        }),
      });

      expect(attackRes1.status).toBe(404);
      const attackData1 = await attackRes1.json();
      expect(attackData1.success).toBe(false);
      expect(attackData1.code).toBe('QUESTION_NOT_IN_SESSION');

      // Attack: Send Session B id with Session A's question (adv-q1)
      const attackRes2 = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdB,
          questionId: 'adv-q1',
          userAnswer: 1,
        }),
      });

      expect(attackRes2.status).toBe(404);
      const attackData2 = await attackRes2.json();
      expect(attackData2.success).toBe(false);
      expect(attackData2.code).toBe('QUESTION_NOT_IN_SESSION');
    });

    it('rejects nonexistent question ID in a valid session with 404 QUESTION_NOT_IN_SESSION', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 2,
          strictQbankOnly: true,
        }),
      });
      const { sessionId } = await res.json();

      const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'ghost-question-not-existing-anywhere',
          userAnswer: 0,
        }),
      });

      expect(checkRes.status).toBe(404);
      const checkData = await checkRes.json();
      expect(checkData.success).toBe(false);
      expect(checkData.code).toBe('QUESTION_NOT_IN_SESSION');
    });
  });

  // =========================================================================
  // Challenge Area 4: Complete Elimination of Raw DB / Fixture Fallback
  // =========================================================================
  describe('Challenge 4: Complete Elimination of Raw Database Grading Fallback', () => {
    it('guarantees an approved DB question CANNOT be graded without being part of an active session snapshot', async () => {
      // adv-q-orphan exists in database questions table as approved, active question
      const dbRow: any = memDb.prepare('SELECT id, status, is_active FROM questions WHERE id = ?').get('adv-q-orphan');
      expect(dbRow).toBeDefined();
      expect(dbRow.status).toBe('approved');
      expect(dbRow.is_active).toBe(1);

      // Attempt 1: Check without sessionId
      const resNoSession = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'adv-q-orphan',
          userAnswer: 2,
        }),
      });
      expect(resNoSession.status).toBe(400);
      expect((await resNoSession.json()).code).toBe('SESSION_REQUIRED');

      // Attempt 2: Check with non-existent sessionId
      const resFakeSession = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'completely-fake-session-id',
          questionId: 'adv-q-orphan',
          userAnswer: 2,
        }),
      });
      expect(resFakeSession.status).toBe(404);
      expect((await resFakeSession.json()).code).toBe('SESSION_NOT_FOUND');

      // Attempt 3: Check with valid session that excluded adv-q-orphan
      const resCreate = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 2,
          excludeQuestionIds: ['adv-q-orphan'],
          strictQbankOnly: true,
        }),
      });
      const { sessionId } = await resCreate.json();

      const resMismatch = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'adv-q-orphan',
          userAnswer: 2,
        }),
      });
      expect(resMismatch.status).toBe(404);
      const mismatchData = await resMismatch.json();
      expect(mismatchData.code).toBe('QUESTION_NOT_IN_SESSION');

      // Verification: At no point did the server read adv-q-orphan from the DB to grade it
    });
  });

  // =========================================================================
  // Challenge Area 5: Anti-Cheat Masking on generate-mock & getSession Endpoints
  // =========================================================================
  describe('Challenge 5: Anti-Cheat Answer Masking', () => {
    it('verifies generate-mock strips answer_index, answer_idx, and explanation_vi when shuffle is OFF', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'false';
      expect(isServingAnswerShuffleEnabled()).toBe(false);

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 4,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify top-level questions array
      expect(data.questions.length).toBeGreaterThan(0);
      for (const q of data.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }

      // Verify nested session.questions array
      expect(data.session.questions.length).toBeGreaterThan(0);
      for (const q of data.session.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }
    });

    it('verifies generate-mock strips answer_index, answer_idx, and explanation_vi when shuffle is ON', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';
      expect(isServingAnswerShuffleEnabled()).toBe(true);

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 4,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      for (const q of data.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }
      for (const q of data.session.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }
    });

    it('verifies GET /api/exam/session/:sessionId strips answer_index, answer_idx, and explanation_vi', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 3,
          strictQbankOnly: true,
        }),
      });
      const { sessionId } = await createRes.json();

      const getRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.success).toBe(true);

      for (const q of getData.session.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }
    });
  });

  // =========================================================================
  // Challenge Area 6: Grading Bound Strictly to Snapshot Index (Shuffled Case)
  // =========================================================================
  describe('Challenge 6: Grading Accuracy Bound Strictly to Snapshot', () => {
    it('grades against shuffled snapshot position and rejects the stale database index', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 4,
          strictQbankOnly: true,
        }),
      });
      const { sessionId } = await res.json();
      const session = getSessionDirect(sessionId);
      expect(session).toBeDefined();

      const snapQ1 = session?.questions.find((q) => q.id === 'adv-q1');
      expect(snapQ1).toBeDefined();
      const shuffledCorrectIndex = snapQ1!.answer_index;
      const targetOption = '苹果'; // original correct answer text

      // Confirm option at shuffledCorrectIndex is '苹果'
      expect(snapQ1!.options[shuffledCorrectIndex]).toBe(targetOption);

      // Raw DB original answer index was 1
      const rawDbRow: any = memDb.prepare('SELECT answer_idx FROM questions WHERE id = ?').get('adv-q1');
      expect(rawDbRow.answer_idx).toBe(1);

      // Case A: Submit the correct shuffled index
      const correctRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'adv-q1',
          userAnswer: shuffledCorrectIndex,
        }),
      });
      expect(correctRes.status).toBe(200);
      const correctData = await correctRes.json();
      expect(correctData.success).toBe(true);
      expect(correctData.isCorrect).toBe(true);
      expect(correctData.correctAnswer).toBe(shuffledCorrectIndex);
      expect(correctData.correctAnswerText).toContain(targetOption);

      // Case B: If shuffled index != original DB index 1, submitting 1 must be marked INCORRECT
      if (shuffledCorrectIndex !== 1) {
        const staleRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: 'adv-q1',
            userAnswer: 1, // original raw DB index
          }),
        });
        expect(staleRes.status).toBe(200);
        const staleData = await staleRes.json();
        expect(staleData.success).toBe(true);
        expect(staleData.isCorrect).toBe(false);
      }
    });

    it('supports letter inputs ("A", "B", "C", "D") and maps to snapshot indices correctly', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 4,
          strictQbankOnly: true,
        }),
      });
      const { sessionId } = await res.json();
      const session = getSessionDirect(sessionId);
      const snapQ1 = session?.questions.find((q) => q.id === 'adv-q1');
      const correctIndex = snapQ1!.answer_index;
      const correctLetter = String.fromCharCode(65 + correctIndex);

      const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'adv-q1',
          userAnswer: correctLetter,
        }),
      });
      expect(checkRes.status).toBe(200);
      const checkData = await checkRes.json();
      expect(checkData.success).toBe(true);
      expect(checkData.isCorrect).toBe(true);
      expect(checkData.correctAnswer).toBe(correctIndex);
    });

    it('rejects invalid inputs when questionId is missing or userAnswer format is invalid', async () => {
      const resCreate = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 2, strictQbankOnly: true }),
      });
      const { sessionId } = await resCreate.json();

      // Missing questionId
      const resNoQ = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userAnswer: 0 }),
      });
      expect(resNoQ.status).toBe(400);
      expect((await resNoQ.json()).code).toBe('INVALID_INPUT');

      // Invalid userAnswer type (null / object / array)
      const resBadAns = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId: 'adv-q1', userAnswer: null }),
      });
      expect(resBadAns.status).toBe(400);
      expect((await resBadAns.json()).code).toBe('INVALID_INPUT');
    });
  });

  // =========================================================================
  // Challenge Area 7: Database Guardrails & Immutability
  // =========================================================================
  describe('Challenge 7: Production Database Guardrail Invariance', () => {
    it('confirms data/hsk_exam.db SHA-256 hash strictly preserved throughout all tests', () => {
      expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
