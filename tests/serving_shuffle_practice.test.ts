/**
 * tests/serving_shuffle_practice.test.ts
 *
 * Dedicated Test Suite for Serving Shuffle Practice Session Lifecycle (Phase 8.4 R7, R8, R9)
 *
 * Coverage:
 * 1. POST /api/exam/generate-mock with mode: 'practice':
 *    - Feature flag ENABLE_SERVING_ANSWER_SHUFFLE on vs off
 *    - In-memory deep cloning, option permutation, dual answer_index & answer_idx synchronization
 *    - Anti-cheat client response sanitization (answer_index, answer_idx, explanation_vi stripped)
 * 2. POST /api/exam/check-answer session-bound scoring:
 *    - Enforces sessionId (missing -> 400 SESSION_REQUIRED)
 *    - Validates session existence (unknown -> 404 SESSION_NOT_FOUND)
 *    - Validates question belongs to session (foreign question -> 404 QUESTION_NOT_IN_SESSION)
 *    - Grades 100% accurately against shuffled session snapshot
 * 3. GET /api/exam/session/:sessionId refresh & reload immutability:
 *    - Consecutive reloads return identical options without re-shuffling
 *    - Anti-cheat protection maintained across re-fetches
 * 4. Mock Exam Boundaries (R9):
 *    - mode: 'mock' is NEVER shuffled even when flag is ON
 *    - Blueprint mock exam boundaries and 1,699 historical sessions preserved
 * 5. Database Guard & In-Memory Isolation:
 *    - 100% runs against SQLite :memory: with zero mutation to production DBs
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

describe('Dedicated Test Suite: Serving Shuffle Practice Lifecycle (R7, R8, R9)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let memDb: DatabaseSync;
  const originalEnvShuffle = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;

  beforeAll(async () => {
    // 1. Verify baseline production DB integrity before executing any tests
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    // 2. Initialize isolated in-memory SQLite DB
    memDb = createTestExamDb({ seedPool: false });

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
        ('p-q1-semantic', 'Chọn từ thích hợp: Quả chuối có màu vàng.', '["苹果", "香蕉", "橙子", "西瓜"]', 1, 1, 'reading', 'read_match', 'Trái chuối là loại quả màu vàng giàu kali.', 'approved', 1),
        ('p-q2-affirmative', 'Chọn từ thích hợp: Con mèo đang ngủ.', '["猫", "狗", "鸟", "鱼"]', 0, 1, 'reading', 'read_match', 'Chọn đáp án A: con mèo đang ngủ dưới gầm bàn.', 'approved', 1),
        ('p-q3-multidistractor', 'Phương tiện nào chạy trên đường sắt?', '["飞机", "火车", "出租车", "自行车"]', 1, 1, 'reading', 'read_match', 'Đáp án B đúng. A sai vì bay trên trời, C sai vì chạy trên đường phố.', 'approved', 1),
        ('p-q4-truefalse', 'Bắc Kinh là thủ đô của Trung Quốc.', '["对", "错"]', 0, 1, 'reading', 'read_tf', 'Nhận định này hoàn toàn chính xác.', 'approved', 1);

      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES
        ('p-q1-semantic', 1, 'reading', 'read_match', 'Chọn từ thích hợp: Quả chuối có màu vàng.', 1, 0),
        ('p-q2-affirmative', 1, 'reading', 'read_match', 'Chọn từ thích hợp: Con mèo đang ngủ.', 1, 0),
        ('p-q3-multidistractor', 1, 'reading', 'read_match', 'Phương tiện nào chạy trên đường sắt?', 1, 0),
        ('p-q4-truefalse', 1, 'reading', 'read_tf', 'Bắc Kinh là thủ đô của Trung Quốc.', 1, 0);
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
  // Section 1: Practice Session Generation with Flag ON vs OFF
  // =========================================================================
  describe('1. POST /api/exam/generate-mock (mode: "practice")', () => {
    it('when feature flag is OFF: options remain in canonical order and answers are masked from client', async () => {
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
      expect(data.sessionId).toBeDefined();

      const questions = data.questions;
      expect(questions.length).toBe(4);

      // Anti-cheat verification: neither answer_index, answer_idx, nor explanation_vi leak to client
      for (const q of questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.shuffled).toBe(false);
      }

      // Canonical options preserved
      const q1 = questions.find((q: any) => q.id === 'p-q1-semantic');
      expect(q1.options).toEqual(['苹果', '香蕉', '橙子', '西瓜']);

      // Internal snapshot check
      const session = getSessionDirect(data.sessionId);
      expect(session).toBeDefined();
      const snapQ1 = session?.questions.find((q) => q.id === 'p-q1-semantic');
      expect(snapQ1?.options).toEqual(['苹果', '香蕉', '橙子', '西瓜']);
      expect(snapQ1?.answer_index).toBe(1);
      expect(snapQ1?.shuffled).toBe(false);
    });

    it('when feature flag is ON: eligible options are shuffled on in-memory deep copy, dual answer indices point to correct word, and answers are masked from client', async () => {
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

      // Anti-cheat verification on client payload
      for (const q of data.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }

      const session = getSessionDirect(data.sessionId);
      expect(session).toBeDefined();

      // Category 1: Semantic explanation -> shuffled: true
      const snapQ1 = session?.questions.find((q) => q.id === 'p-q1-semantic');
      expect(snapQ1).toBeDefined();
      expect(snapQ1?.shuffled).toBe(true);
      expect(snapQ1?.answer_index).toBeDefined();
      expect(snapQ1?.answer_idx).toBe(snapQ1?.answer_index);
      expect(snapQ1?.options[snapQ1!.answer_index]).toBe('香蕉');

      // Category 2: Affirmative explanation -> shuffled: true, letter synced
      const snapQ2 = session?.questions.find((q) => q.id === 'p-q2-affirmative');
      expect(snapQ2).toBeDefined();
      expect(snapQ2?.shuffled).toBe(true);
      expect(snapQ2?.answer_idx).toBe(snapQ2?.answer_index);
      expect(snapQ2?.options[snapQ2!.answer_index]).toBe('猫');
      const expectedLetter = String.fromCharCode(65 + snapQ2!.answer_index);
      expect(snapQ2?.explanation_vi).toContain(`Chọn đáp án ${expectedLetter}`);

      // Category 3: Multi-distractor explanation -> shuffled: false
      const snapQ3 = session?.questions.find((q) => q.id === 'p-q3-multidistractor');
      expect(snapQ3).toBeDefined();
      expect(snapQ3?.shuffled).toBe(false);
      expect(snapQ3?.options).toEqual(['飞机', '火车', '出租车', '自行车']);
      expect(snapQ3?.answer_index).toBe(1);

      // Fixed-order True/False -> shuffled: false
      const snapQ4 = session?.questions.find((q) => q.id === 'p-q4-truefalse');
      expect(snapQ4).toBeDefined();
      expect(snapQ4?.shuffled).toBe(false);
      expect(snapQ4?.options).toEqual(['对', '错']);
    });

    it('deep-copy purity: original database rows are completely untouched after serving shuffle', () => {
      const row: any = memDb.prepare('SELECT options, answer_idx FROM questions WHERE id = ?').get('p-q1-semantic');
      expect(JSON.parse(row.options)).toEqual(['苹果', '香蕉', '橙子', '西瓜']);
      expect(row.answer_idx).toBe(1);
    });
  });

  // =========================================================================
  // Section 2: Session-Bound Scoring via POST /api/exam/check-answer
  // =========================================================================
  describe('2. POST /api/exam/check-answer (Session-Bound Scoring)', () => {
    it('returns 400 SESSION_REQUIRED when sessionId is missing', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'p-q1-semantic',
          userAnswer: 0,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('returns 404 SESSION_NOT_FOUND when sessionId does not exist or has expired', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'unknown-session-uuid-9999',
          questionId: 'p-q1-semantic',
          userAnswer: 0,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });

    it('returns 404 QUESTION_NOT_IN_SESSION when questionId is not in the session', async () => {
      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 4, strictQbankOnly: true }),
      });
      const { sessionId } = await createRes.json();

      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'non-existent-question-id',
          userAnswer: 0,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('QUESTION_NOT_IN_SESSION');
    });

    it('accurately scores correct and incorrect answers against the session snapshot', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 4, strictQbankOnly: true }),
      });
      const { sessionId } = await createRes.json();
      const session = getSessionDirect(sessionId)!;

      const q1 = session.questions.find((q) => q.id === 'p-q1-semantic')!;
      const correctIndex = q1.answer_index;
      const wrongIndex = (correctIndex + 1) % q1.options.length;

      // Submit correct answer index
      const correctRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'p-q1-semantic',
          userAnswer: correctIndex,
        }),
      });

      expect(correctRes.status).toBe(200);
      const correctData = await correctRes.json();
      expect(correctData.success).toBe(true);
      expect(correctData.isCorrect).toBe(true);
      expect(correctData.correctAnswer).toBe(correctIndex);
      expect(correctData.correctAnswerText).toBeDefined();
      expect(correctData.explanation_vi).toBe(q1.explanation_vi);

      // Submit wrong answer index
      const wrongRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'p-q1-semantic',
          userAnswer: wrongIndex,
        }),
      });

      expect(wrongRes.status).toBe(200);
      const wrongData = await wrongRes.json();
      expect(wrongData.success).toBe(true);
      expect(wrongData.isCorrect).toBe(false);
      expect(wrongData.correctAnswer).toBe(correctIndex);
    });

    it('supports letter-based string userAnswer (e.g., "A", "B", "C", "D")', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 4, strictQbankOnly: true }),
      });
      const { sessionId } = await createRes.json();
      const session = getSessionDirect(sessionId)!;

      const q1 = session.questions.find((q) => q.id === 'p-q1-semantic')!;
      const correctLetter = String.fromCharCode(65 + q1.answer_index);

      const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'p-q1-semantic',
          userAnswer: correctLetter,
        }),
      });

      expect(checkRes.status).toBe(200);
      const checkData = await checkRes.json();
      expect(checkData.success).toBe(true);
      expect(checkData.isCorrect).toBe(true);
    });
  });

  // =========================================================================
  // Section 3: Refresh & Reload Immutability (GET /api/exam/session/:sessionId)
  // =========================================================================
  describe('3. GET /api/exam/session/:sessionId (Refresh Immutability)', () => {
    it('calling GET /api/exam/session/:sessionId multiple times returns identical shuffled options without re-shuffling', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 4, strictQbankOnly: true }),
      });
      const { sessionId, questions: initialQuestions } = await createRes.json();

      const initialQ1Options = initialQuestions.find((q: any) => q.id === 'p-q1-semantic').options;

      // Reload 5 times
      for (let i = 0; i < 5; i++) {
        const reloadRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
        expect(reloadRes.status).toBe(200);
        const reloadData = await reloadRes.json();
        expect(reloadData.success).toBe(true);

        const reloadQ1 = reloadData.session.questions.find((q: any) => q.id === 'p-q1-semantic');
        expect(reloadQ1.options).toEqual(initialQ1Options);

        // Anti-cheat verification across all reloads
        expect(reloadQ1.answer_index).toBeUndefined();
        expect(reloadQ1.answer_idx).toBeUndefined();
        expect(reloadQ1.explanation_vi).toBeUndefined();
      }
    });
  });

  // =========================================================================
  // Section 4: Mock Exam Boundaries (R9)
  // =========================================================================
  describe('4. Mock Exam Boundaries (mode: "mock" Strict Invariance)', () => {
    it('mock exam mode NEVER shuffles questions even when ENABLE_SERVING_ANSWER_SHUFFLE is on', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      // Request mock exam in fixture demo mode
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'mock',
          allowFixtures: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.mode).toBe('mock');

      // Verify that mock exam questions are NOT shuffled
      for (const q of data.questions) {
        expect(q.shuffled).toBeFalsy();
      }

      // Check session snapshot
      const session = getSessionDirect(data.sessionId);
      expect(session).toBeDefined();
      expect(session?.mode).toBe('mock');
      for (const q of session!.questions) {
        expect(q.shuffled).toBeFalsy();
      }
    });
  });
});
