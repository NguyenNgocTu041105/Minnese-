/**
 * Dedicated Regression Suite: Practice API Anti-Leak & Contract Compatibility (R1)
 *
 * Verifies that:
 * 1. GET /api/exam/practice & /api/exam/practice-questions are strictly sanitized (Anti-Cheat).
 * 2. Every question item in the response has answer_index, answer_idx, explanation_vi, explanation stripped.
 * 3. Contract metadata (sessionId: null, sessionRequiredForScoring: true, antiCheatProtected: true) is returned.
 * 4. Options array remains complete and intact.
 * 5. Direct submission to POST /api/exam/check-answer without sessionId is strictly rejected with HTTP 400 (SESSION_REQUIRED).
 * 6. Legitimate scoring via session (POST /generate-mock -> POST /check-answer) remains 100% operational and reveals correctAnswer/explanation_vi only upon scoring.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  examRouter,
  clearAllSessionsForTesting,
  createTestExamDb,
  setExamDbForTesting,
  stripAnswerFromQuestion,
} from '../src/server/examRoutes';

describe('Regression Suite: Practice API Anti-Leak & Contract Compatibility (R1)', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;
  let memDb: DatabaseSync;

  beforeAll(async () => {
    // Isolated in-memory database to strictly protect production DB files
    memDb = createTestExamDb({ seedPool: true });
    setExamDbForTesting(memDb);

    app = express();
    app.use(express.json());
    app.use('/api/exam', examRouter);

    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address() as any;
    baseUrl = `http://127.0.0.1:${address.port}/api/exam`;
  });

  afterAll(async () => {
    setExamDbForTesting(null);
    clearAllSessionsForTesting();
    try {
      memDb?.close();
    } catch {}
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // Helper fetcher
  async function fetchJson(path: string, options: RequestInit = {}) {
    const res = await fetch(`${baseUrl}${path}`, options);
    const data = await res.json();
    return { status: res.status, headers: res.headers, data };
  }

  it('1. GET /api/exam/practice returns 200 with anti-cheat contract metadata and strips all answers/explanations', async () => {
    const { status, data } = await fetchJson('/practice?level=1&count=10');
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sessionId).toBeNull();
    expect(data.sessionRequiredForScoring).toBe(true);
    expect(data.antiCheatProtected).toBe(true);
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);

    for (const q of data.questions) {
      expect(q.id).toBeDefined();
      expect(q.stem).toBeDefined();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.item_number).toBeGreaterThan(0);

      // Anti-Cheat / Anti-Leak Guarantee
      expect(q.answer_index).toBeUndefined();
      expect(q.answer_idx).toBeUndefined();
      expect(q.explanation_vi).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    }
  });

  it('2. GET /api/exam/practice-questions (alias route) enforces identical anti-cheat protection', async () => {
    const { status, data } = await fetchJson('/practice-questions?level=1&skill=reading&count=5');
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sessionId).toBeNull();
    expect(data.sessionRequiredForScoring).toBe(true);
    expect(data.antiCheatProtected).toBe(true);
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);

    for (const q of data.questions) {
      expect(q.section).toBe('reading');
      expect(q.answer_index).toBeUndefined();
      expect(q.answer_idx).toBeUndefined();
      expect(q.explanation_vi).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    }
  });

  it('3. Unit test: stripAnswerFromQuestion strips answer_index, answer_idx, explanation_vi, and explanation', () => {
    const questionWithLeak = {
      id: 'leak-test-q1',
      level: 1,
      section: 'reading' as const,
      part_type: 'single_choice',
      stem: '这是什么？',
      options: ['苹果', '香蕉', '西瓜', '葡萄'],
      answer_index: 1,
      answer_idx: 1,
      explanation_vi: 'Đáp án là B. 香蕉 là quả chuối.',
      explanation: 'General explanation text',
      extra_prop: 'safe',
    } as any;

    const sanitized = stripAnswerFromQuestion(questionWithLeak);
    expect(sanitized.id).toBe('leak-test-q1');
    expect(sanitized.stem).toBe('这是什么？');
    expect(sanitized.options).toEqual(['苹果', '香蕉', '西瓜', '葡萄']);
    expect((sanitized as any).extra_prop).toBe('safe');

    expect((sanitized as any).answer_index).toBeUndefined();
    expect((sanitized as any).answer_idx).toBeUndefined();
    expect((sanitized as any).explanation_vi).toBeUndefined();
    expect((sanitized as any).explanation).toBeUndefined();
  });

  it('4. POST /api/exam/check-answer strictly rejects scoring request without sessionId (HTTP 400 SESSION_REQUIRED)', async () => {
    const { status, data } = await fetchJson('/check-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: 'hsk1-mock-q01',
        userAnswer: 0,
      }),
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('SESSION_REQUIRED');
    expect(data.error).toBe('sessionId is required for check-answer');
  });

  it('5. Session scoring flow (POST /generate-mock -> POST /check-answer) preserves legitimate answer revelation upon scoring', async () => {
    // Step 1: Generate session-based practice
    const genRes = await fetchJson('/generate-mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 1,
        mode: 'practice',
        count: 5,
      }),
    });

    expect(genRes.status).toBe(200);
    expect(genRes.data.success).toBe(true);
    const session = genRes.data.session;
    expect(session.sessionId).toBeTruthy();
    expect(session.questions.length).toBeGreaterThan(0);

    // Initial payload received by student client must have answers stripped
    const q1 = session.questions[0];
    expect(q1.answer_index).toBeUndefined();
    expect(q1.explanation_vi).toBeUndefined();

    // Step 2: Student submits an answer to /check-answer with valid sessionId
    const checkRes = await fetchJson('/check-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        questionId: q1.id,
        userAnswer: 0,
      }),
    });

    expect(checkRes.status).toBe(200);
    expect(checkRes.data.success).toBe(true);
    // After scoring, server legitimately returns the correct answer and Vietnamese explanation
    expect(typeof checkRes.data.correctAnswer).toBe('number');
    expect(typeof checkRes.data.isCorrect).toBe('boolean');
    expect(typeof checkRes.data.explanation_vi).toBe('string');
    expect(checkRes.data.explanation_vi.length).toBeGreaterThan(0);
  });
});
