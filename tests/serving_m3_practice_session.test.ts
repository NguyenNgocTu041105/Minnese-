/**
 * tests/serving_m3_practice_session.test.ts
 *
 * Milestone M3: Session-Based Practice Serving & Session-Bound Scoring Integration
 * Covers Phase 8.4 R3, R4, R5:
 * - Session creation with shuffle ON vs OFF under ENABLE_SERVING_ANSWER_SHUFFLE
 * - In-memory deep cloning & options/answer_index/answer_idx synchronization
 * - Answer stripping (anti-cheat: answer_index and answer_idx stripped from client response)
 * - Session snapshot immutability & re-fetching consistency
 * - Strict session-bound scoring in POST /api/exam/check-answer (no cross-session loop, no fixture/raw DB fallback)
 * - Direct practice audit (GET /api/exam/practice remains un-shuffled per R5)
 * - 100% in-memory SQLite isolation (:memory:) with zero production DB mutation
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

describe('Milestone M3: Session-Based Practice Serving & Session-Bound Scoring', () => {
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

    // Seed test-specific questions with diverse linguistic and structural categories
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
        ('m3-q1-cat1', 'Chọn từ thích hợp: Quả chuối có màu vàng.', '["苹果", "香蕉", "橙子", "西瓜"]', 1, 1, 'reading', 'read_match', 'Trái chuối là loại quả màu vàng giàu dinh dưỡng.', 'approved', 1),
        ('m3-q2-cat2', 'Chọn từ thích hợp: Con mèo đang ngủ.', '["猫", "狗", "鸟", "鱼"]', 0, 1, 'reading', 'read_match', 'Chọn đáp án A: con mèo đang ngủ trên ghế.', 'approved', 1),
        ('m3-q3-cat3', 'Phương tiện giao thông nào chạy trên đường ray?', '["飞机", "火车", "出租车", "自行车"]', 1, 1, 'reading', 'read_match', 'Đáp án B đúng. A sai vì bay trên trời, C sai vì chạy trên đường bộ.', 'approved', 1),
        ('m3-q4-tf', 'Bắc Kinh là thủ đô của Trung Quốc.', '["对", "错"]', 0, 1, 'reading', 'read_tf', 'Nhận định này hoàn toàn chính xác.', 'approved', 1),
        ('m3-q5-wordbank', 'Chọn từ điền vào chỗ trống:', '["A", "B", "C", "D", "E", "F"]', 2, 1, 'reading', 'read_fill_blank_word_bank', 'Điền C phù hợp ngữ cảnh.', 'approved', 1);

      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES
        ('m3-q1-cat1', 1, 'reading', 'read_match', 'Chọn từ thích hợp: Quả chuối có màu vàng.', 1, 0),
        ('m3-q2-cat2', 1, 'reading', 'read_match', 'Chọn từ thích hợp: Con mèo đang ngủ.', 1, 0),
        ('m3-q3-cat3', 1, 'reading', 'read_match', 'Phương tiện giao thông nào chạy trên đường ray?', 1, 0),
        ('m3-q4-tf', 1, 'reading', 'read_tf', 'Bắc Kinh là thủ đô của Trung Quốc.', 1, 0),
        ('m3-q5-wordbank', 1, 'reading', 'read_fill_blank_word_bank', 'Chọn từ điền vào chỗ trống:', 1, 0);
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
  // Section 1: Feature Flag OFF Behavior (Canonical Order Preserved)
  // =========================================================================
  describe('1. Feature Flag OFF: Practice Serving Invariance', () => {
    it('serves questions in original canonical order and masks answers from client', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'false';
      expect(isServingAnswerShuffleEnabled()).toBe(false);

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 5,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();

      const questions = data.questions;
      expect(questions.length).toBeGreaterThanOrEqual(1);

      // Verify anti-cheat: answer_index and answer_idx must be completely stripped
      for (const q of questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.shuffled).toBe(false);
      }

      // Check Category 1 question retains canonical options
      const q1 = questions.find((q: any) => q.id === 'm3-q1-cat1');
      expect(q1).toBeDefined();
      expect(q1.options).toEqual(['苹果', '香蕉', '橙子', '西瓜']);

      // Check session snapshot in memory/DB preserves original answers
      const session = getSessionDirect(data.sessionId);
      expect(session).toBeDefined();
      const snapQ1 = session?.questions.find((q) => q.id === 'm3-q1-cat1');
      expect(snapQ1).toBeDefined();
      expect(snapQ1?.answer_index).toBe(1);
      expect(snapQ1?.options[snapQ1.answer_index]).toBe('香蕉');
      expect(snapQ1?.shuffled).toBe(false);
    });
  });

  // =========================================================================
  // Section 2: Feature Flag ON Behavior (Controlled Serving Shuffle)
  // =========================================================================
  describe('2. Feature Flag ON: Controlled In-Memory Practice Shuffle', () => {
    it('shuffles eligible questions, updates answer_index & answer_idx, syncs Category 2 explanation, and preserves Category 3/4/5', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';
      expect(isServingAnswerShuffleEnabled()).toBe(true);

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 5,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();

      const clientQuestions = data.questions;

      // 1. Anti-cheat masking on client response
      for (const q of clientQuestions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }

      // 2. Inspect persisted session snapshot
      const session = getSessionDirect(data.sessionId);
      expect(session).toBeDefined();
      expect(session?.mode).toBe('practice');

      // Category 1 question: should be shuffled with shuffled: true
      const snapQ1 = session?.questions.find((q) => q.id === 'm3-q1-cat1');
      expect(snapQ1).toBeDefined();
      expect(snapQ1?.shuffled).toBe(true);
      // Both dual fields must match and point to '香蕉'
      expect(snapQ1?.answer_index).toBeDefined();
      expect(snapQ1?.answer_idx).toBe(snapQ1?.answer_index);
      expect(snapQ1?.options[snapQ1!.answer_index]).toBe('香蕉');

      // Category 2 question: should be shuffled and letter in explanation synchronized
      const snapQ2 = session?.questions.find((q) => q.id === 'm3-q2-cat2');
      expect(snapQ2).toBeDefined();
      expect(snapQ2?.shuffled).toBe(true);
      expect(snapQ2?.answer_index).toBeDefined();
      expect(snapQ2?.answer_idx).toBe(snapQ2?.answer_index);
      expect(snapQ2?.options[snapQ2!.answer_index]).toBe('猫');

      const expectedLetter = String.fromCharCode(65 + snapQ2!.answer_index);
      expect(snapQ2?.explanation_vi).toContain(`Chọn đáp án ${expectedLetter}`);

      // Category 3 question: multi-distractor explanation must NOT be shuffled
      const snapQ3 = session?.questions.find((q) => q.id === 'm3-q3-cat3');
      expect(snapQ3).toBeDefined();
      expect(snapQ3?.shuffled).toBe(false);
      expect(snapQ3?.shuffle_reason).toContain('Group 3: Multi-distractor explanation');
      expect(snapQ3?.options).toEqual(['飞机', '火车', '出租车', '自行车']);
      expect(snapQ3?.answer_index).toBe(1);

      // True/False question: fixed structure must NOT be shuffled
      const snapQ4 = session?.questions.find((q) => q.id === 'm3-q4-tf');
      expect(snapQ4).toBeDefined();
      expect(snapQ4?.shuffled).toBe(false);
      expect(snapQ4?.shuffle_reason).toMatch(/Fixed order/);
      expect(snapQ4?.options).toEqual(['对', '错']);

      // Shared word-bank question: must NOT be shuffled
      const snapQ5 = session?.questions.find((q) => q.id === 'm3-q5-wordbank');
      expect(snapQ5).toBeDefined();
      expect(snapQ5?.shuffled).toBe(false);
      expect(snapQ5?.shuffle_reason).toBe('Shared word bank A-F group');
    });

    it('deep-clone invariant: original database questions are never mutated by serving shuffle', () => {
      // Direct query to test database
      const row: any = memDb.prepare('SELECT options, answer_idx FROM questions WHERE id = ?').get('m3-q1-cat1');
      expect(JSON.parse(row.options)).toEqual(['苹果', '香蕉', '橙子', '西瓜']);
      expect(row.answer_idx).toBe(1);
    });
  });

  // =========================================================================
  // Section 3: Snapshot Immutability & Re-fetching Consistency
  // =========================================================================
  describe('3. Snapshot Immutability & Re-fetching', () => {
    it('GET /api/exam/session/:sessionId returns exactly identical options without re-shuffling', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 5,
          strictQbankOnly: true,
        }),
      });

      const createData = await createRes.json();
      const sessionId = createData.sessionId;
      const initialClientQ1 = createData.questions.find((q: any) => q.id === 'm3-q1-cat1');

      // Re-fetch existing session 3 consecutive times
      for (let i = 0; i < 3; i++) {
        const fetchRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
        expect(fetchRes.status).toBe(200);
        const fetchData = await fetchRes.json();
        expect(fetchData.success).toBe(true);

        const refetchedQ1 = fetchData.session.questions.find((q: any) => q.id === 'm3-q1-cat1');
        expect(refetchedQ1.options).toEqual(initialClientQ1.options);
        expect(refetchedQ1.answer_index).toBeUndefined();
        expect(refetchedQ1.answer_idx).toBeUndefined();
      }
    });

    it('two distinct sessions containing the same question maintain independent shuffled states', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const s1Res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 5, strictQbankOnly: true }),
      });
      const s1Data = await s1Res.json();

      const s2Res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 5, strictQbankOnly: true }),
      });
      const s2Data = await s2Res.json();

      expect(s1Data.sessionId).not.toBe(s2Data.sessionId);

      const snap1 = getSessionDirect(s1Data.sessionId);
      const snap2 = getSessionDirect(s2Data.sessionId);

      const q1InS1 = snap1?.questions.find((q) => q.id === 'm3-q1-cat1');
      const q1InS2 = snap2?.questions.find((q) => q.id === 'm3-q1-cat1');

      // Both must correctly point to '香蕉' in their respective snapshots
      expect(q1InS1?.options[q1InS1!.answer_index]).toBe('香蕉');
      expect(q1InS2?.options[q1InS2!.answer_index]).toBe('香蕉');
    });
  });

  // =========================================================================
  // Section 4: Session-Bound Scoring in POST /api/exam/check-answer (R4)
  // =========================================================================
  describe('4. Session-Bound Scoring in POST /api/exam/check-answer', () => {
    it('rejects requests missing sessionId with HTTP 400 and SESSION_REQUIRED', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'm3-q1-cat1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
      expect(data.error).toContain('sessionId is required');
    });

    it('rejects non-existent or expired sessionId with HTTP 404 and SESSION_NOT_FOUND', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'non-existent-session-uuid-12345',
          questionId: 'm3-q1-cat1',
          userAnswer: 1,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });

    it('rejects questionId that does not belong to the session with HTTP 404 and QUESTION_NOT_IN_SESSION', async () => {
      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 5, strictQbankOnly: true }),
      });
      const { sessionId } = await createRes.json();

      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'completely-unrelated-question-id',
          userAnswer: 0,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('QUESTION_NOT_IN_SESSION');
    });

    it('correctly grades against the session snapshot (even when shuffled)', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 5, strictQbankOnly: true }),
      });
      const { sessionId } = await createRes.json();

      const session = getSessionDirect(sessionId);
      const snapQ1 = session?.questions.find((q) => q.id === 'm3-q1-cat1');
      expect(snapQ1).toBeDefined();

      const correctShuffledIndex = snapQ1!.answer_index;
      const wrongShuffledIndex = (correctShuffledIndex + 1) % snapQ1!.options.length;

      // 1. Submit correct answer index
      const correctRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'm3-q1-cat1',
          userAnswer: correctShuffledIndex,
        }),
      });

      expect(correctRes.status).toBe(200);
      const correctData = await correctRes.json();
      expect(correctData.success).toBe(true);
      expect(correctData.isCorrect).toBe(true);
      expect(correctData.correctAnswer).toBe(correctShuffledIndex);
      expect(correctData.explanation_vi).toBe(snapQ1!.explanation_vi);

      // 2. Submit wrong answer index
      const wrongRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'm3-q1-cat1',
          userAnswer: wrongShuffledIndex,
        }),
      });

      expect(wrongRes.status).toBe(200);
      const wrongData = await wrongRes.json();
      expect(wrongData.success).toBe(true);
      expect(wrongData.isCorrect).toBe(false);
      expect(wrongData.correctAnswer).toBe(correctShuffledIndex);
    });

    it('does NOT fallback to raw database or other active sessions when question is not in target session', async () => {
      // Create session A containing m3-q1-cat1
      const s1Res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 1, strictQbankOnly: true }),
      });
      const { sessionId: sessionIdA } = await s1Res.json();

      // Create an empty dummy session B by directly creating a session without m3-q1-cat1
      const sessionIdB = 'dummy-empty-session-b';
      const dummySession: any = {
        sessionId: sessionIdB,
        level: 1,
        mode: 'practice',
        questions: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + 100000,
      };
      memDb.prepare(`
        INSERT INTO exam_sessions (session_id, level, mode, session_json, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sessionIdB, 1, 'practice', JSON.stringify(dummySession), dummySession.createdAt, dummySession.expiresAt);

      // Attempt to check m3-q1-cat1 against session B
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdB,
          questionId: 'm3-q1-cat1',
          userAnswer: 1,
        }),
      });

      // Must strictly return 404 QUESTION_NOT_IN_SESSION rather than finding it in session A or raw DB!
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.code).toBe('QUESTION_NOT_IN_SESSION');
    });
  });

  // =========================================================================
  // Section 5: Direct Practice Audit (R5)
  // =========================================================================
  describe('5. Direct Practice Audit (GET /api/exam/practice)', () => {
    it('serves canonical un-shuffled questions without creating sessions even when flag is ON', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&count=5&strict=true`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeNull();
      expect(data.sessionRequiredForScoring).toBe(true);
      expect(data.antiCheatProtected).toBe(true);

      const q1 = data.questions.find((q: any) => q.id === 'm3-q1-cat1');
      expect(q1).toBeDefined();
      // Canonical un-shuffled options preserved per R5
      expect(q1.options).toEqual(['苹果', '香蕉', '橙子', '西瓜']);
      // Anti-cheat: answer_index and explanation_vi are stripped
      expect(q1.answer_index).toBeUndefined();
      expect((q1 as any).answer_idx).toBeUndefined();
      expect(q1.explanation_vi).toBeUndefined();
    });
  });
});
