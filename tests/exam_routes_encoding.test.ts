/**
 * Verification Test Suite: Vietnamese Encoding Normalization & Hardening (R1)
 *
 * Verifies that:
 * 1. All exam endpoints enforce `Content-Type: application/json; charset=utf-8`.
 * 2. Response bodies are clean, valid UTF-8 JSON without BOM, without `\uFFFD`, and without corrupted `?` characters.
 * 3. Vietnamese diacritics, tone accents, error messages, and `explanation_vi` are preserved with 100% fidelity.
 * 4. Endpoints covered:
 *    - GET  /api/exam/blueprints
 *    - GET  /api/exam/practice
 *    - POST /api/exam/generate-mock
 *    - GET  /api/exam/session/:sessionId (200, 400, 404)
 *    - POST /api/exam/check-answer (200, 400, 404)
 *    - POST /api/exam/submit (200 with session, 200 without session)
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
} from '../src/server/examRoutes';

describe('Vietnamese Encoding & UTF-8 Header Hardening Suite (R1)', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;
  let memDb: DatabaseSync;

  beforeAll(async () => {
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

  // Helper to query endpoints and inspect raw bytes/headers/text
  async function fetchEndpoint(path: string, options: RequestInit = {}) {
    const response = await fetch(`${baseUrl}${path}`, options);
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }
    return {
      status: response.status,
      contentType,
      rawText,
      json,
    };
  }

  // Core invariant assertions for every response
  function assertUtf8JsonQuality(res: { contentType: string; rawText: string; json: any }) {
    // 1. Content-Type header validation
    expect(res.contentType).toMatch(/^application\/json/i);
    expect(res.contentType.toLowerCase()).toContain('charset=utf-8');

    // 2. Strict Unicode validity
    expect(res.rawText).not.toContain('\ufffd');
    expect(res.rawText).not.toMatch(/[a-zA-Z\u00C0-\u1EF9]\?[a-zA-Z\u00C0-\u1EF9]/);

    // 3. Valid JSON structure
    expect(res.json).not.toBeNull();
    expect(typeof res.json).toBe('object');
  }

  // Common Vietnamese diacritics pattern across vowels and đ/Đ
  const VIETNAMESE_DIACRITICS_REGEX = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/;

  // =========================================================================
  // 1. GET /api/exam/blueprints
  // =========================================================================
  describe('GET /api/exam/blueprints', () => {
    it('returns 200 with UTF-8 charset header and clean JSON', async () => {
      const res = await fetchEndpoint('/blueprints');
      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(true);
      expect(typeof res.json.blueprints).toBe('object');
      const levels = Object.keys(res.json.blueprints);
      expect(levels.length).toBeGreaterThanOrEqual(1);

      // Verify CJK / blueprint description characters
      const bp1 = res.json.blueprints['1'] || res.json.blueprints[1];
      expect(bp1).toBeDefined();
      expect(bp1.name).toContain('HSK 1');
    });
  });

  // =========================================================================
  // 2. GET /api/exam/practice
  // =========================================================================
  describe('GET /api/exam/practice', () => {
    it('returns 200 with anti-cheat protected questions and UTF-8 charset header', async () => {
      const res = await fetchEndpoint('/practice?level=1&count=5');
      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(true);
      expect(Array.isArray(res.json.questions)).toBe(true);
      expect(res.json.questions.length).toBeGreaterThanOrEqual(1);

      // Verify questions have valid stem and answers are strictly stripped (Anti-Cheat R1)
      for (const q of res.json.questions) {
        expect(q.stem).toBeDefined();
        expect(q.answer_index).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }

      // If fallback notice is returned, ensure clean Vietnamese UTF-8 encoding
      if (res.json.fallbackNotice) {
        expect(res.json.fallbackNotice).toMatch(VIETNAMESE_DIACRITICS_REGEX);
        expect(res.json.fallbackNotice).not.toContain('\ufffd');
      }
    });

    it('handles query filtering by skill while preserving UTF-8 charset', async () => {
      const res = await fetchEndpoint('/practice?level=1&skill=reading&count=3');
      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);
      expect(res.json.success).toBe(true);
      for (const q of res.json.questions) {
        expect(q.section).toBe('reading');
      }
    });
  });

  // =========================================================================
  // 3. POST /api/exam/generate-mock
  // =========================================================================
  describe('POST /api/exam/generate-mock', () => {
    it('generates a session with UTF-8 headers and uncorrupted stems/pinyin', async () => {
      const res = await fetchEndpoint('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });

      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(true);
      expect(res.json.session).toBeDefined();
      expect(res.json.session.sessionId).toBeTruthy();
      expect(res.json.session.level).toBe(1);
      expect(Array.isArray(res.json.session.questions)).toBe(true);
      expect(res.json.session.questions.length).toBe(40);

      // Verify stems and pinyin are not corrupted
      const firstQ = res.json.session.questions[0];
      expect(firstQ.stem).toBeTruthy();
      expect(firstQ.stem).not.toContain('\ufffd');
      // Anti-cheat: answer_index must NOT be exposed to client
      expect(firstQ.answer_index).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. GET /api/exam/session/:sessionId
  // =========================================================================
  describe('GET /api/exam/session/:sessionId', () => {
    it('retrieves active session with UTF-8 headers', async () => {
      // First generate session
      const createRes = await fetchEndpoint('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });
      const sessionId = createRes.json.session.sessionId;

      const res = await fetchEndpoint(`/session/${sessionId}`);
      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(true);
      expect(res.json.session.sessionId).toBe(sessionId);
      expect(Array.isArray(res.json.session.questions)).toBe(true);
    });

    it('returns 400 with accurate Vietnamese error message on empty/whitespace sessionId', async () => {
      const res = await fetchEndpoint('/session/%20');
      expect(res.status).toBe(400);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(false);
      expect(res.json.error).toBe('Mã phiên làm bài không hợp lệ.');
      expect(res.json.error).toMatch(VIETNAMESE_DIACRITICS_REGEX);
    });

    it('returns 404 with accurate Vietnamese error message on non-existent sessionId', async () => {
      const res = await fetchEndpoint('/session/nonexistent-session-00000000');
      expect(res.status).toBe(404);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(false);
      expect(res.json.error).toBe('Phiên làm bài thi không tồn tại hoặc đã hết hạn.');
      expect(res.json.error).toMatch(VIETNAMESE_DIACRITICS_REGEX);
    });
  });

  // =========================================================================
  // 5. POST /api/exam/check-answer
  // =========================================================================
  describe('POST /api/exam/check-answer', () => {
    let activeSessionId: string;
    let sampleQuestionId: string;

    beforeAll(async () => {
      const createRes = await fetchEndpoint('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });
      activeSessionId = createRes.json.session.sessionId;
      sampleQuestionId = createRes.json.session.questions[0].id;
    });

    it('returns 400 with accurate Vietnamese error message on missing body fields', async () => {
      const res = await fetchEndpoint('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });

      expect(res.status).toBe(400);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(false);
      expect(res.json.error).toBe('Thiếu mã câu hỏi (questionId) hoặc câu trả lời (userAnswer).');
      expect(res.json.error).toMatch(VIETNAMESE_DIACRITICS_REGEX);
    });

    it('returns 404 with accurate Vietnamese error message on unknown questionId', async () => {
      const res = await fetchEndpoint('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, questionId: 'unknown-question-id-xyz', userAnswer: 0 }),
      });

      expect(res.status).toBe(404);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(false);
      expect(res.json.error).toBe('Không tìm thấy câu hỏi trong phiên thi (Question not found in session)');
      expect(res.json.code).toBe('QUESTION_NOT_IN_SESSION');
    });

    it('returns 200 with rich Vietnamese explanation_vi for valid question', async () => {
      const res = await fetchEndpoint('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, questionId: sampleQuestionId, userAnswer: 0 }),
      });

      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(true);
      expect(typeof res.json.correctAnswer).toBe('number');
      expect(typeof res.json.isCorrect).toBe('boolean');
      expect(res.json.explanation_vi).toBeTruthy();
      expect(res.json.explanation_vi).toMatch(VIETNAMESE_DIACRITICS_REGEX);
    });
  });

  // =========================================================================
  // 6. POST /api/exam/submit
  // =========================================================================
  describe('POST /api/exam/submit', () => {
    it('returns 200 with rich detailed review and Vietnamese explanations for active session', async () => {
      // 1. Create a session first
      const createRes = await fetchEndpoint('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });
      const sessionId = createRes.json.session.sessionId;

      // 2. Submit answers
      const res = await fetchEndpoint('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          level: 1,
          answers: { 'hsk1-mock-q01': 0 },
          timeSpentSeconds: 150,
        }),
      });

      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(true);
      expect(res.json.scoreResult).toBeDefined();
      expect(res.json.scoreResult.totalScore).toBeGreaterThanOrEqual(0);
      expect(res.json.scoreResult.maxScore).toBe(200);
      expect(res.json.scoreResult.passScore).toBe(120);

      const review = res.json.scoreResult.detailedReview;
      expect(Array.isArray(review)).toBe(true);
      expect(review.length).toBe(40);

      // Verify Vietnamese explanations in detailedReview
      const reviewWithVi = review.find((r: any) => r.explanation_vi);
      expect(reviewWithVi).toBeDefined();
      expect(reviewWithVi.explanation_vi).toMatch(VIETNAMESE_DIACRITICS_REGEX);
      expect(reviewWithVi.explanation_vi).not.toContain('\ufffd');
    });

    it('returns 200 and UTF-8 charset header when submitting without active session (fallback mode)', async () => {
      const res = await fetchEndpoint('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          answers: {},
          timeSpentSeconds: 60,
        }),
      });

      expect(res.status).toBe(200);
      assertUtf8JsonQuality(res);

      expect(res.json.success).toBe(true);
      expect(res.json.scoreResult).toBeDefined();
      expect(res.json.scoreResult.passed).toBe(false);
    });
  });

  // =========================================================================
  // 7. Cross-Cutting Invariants & Tone Accents Integrity
  // =========================================================================
  describe('Cross-Cutting Vietnamese Tone Accents Integrity', () => {
    it('preserves all Vietnamese tone accents and letters without mangling', async () => {
      const createRes = await fetchEndpoint('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });
      const sessionId = createRes.json.session.sessionId;

      // Test known error responses contain expected characters
      const error400 = await fetchEndpoint('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      // "Thiếu mã câu hỏi (questionId) hoặc câu trả lời (userAnswer)."
      // Check specific Vietnamese vowels
      expect(error400.json.error).toContain('Thiếu');
      expect(error400.json.error).toContain('mã');
      expect(error400.json.error).toContain('hỏi');
      expect(error400.json.error).toContain('hoặc');
      expect(error400.json.error).toContain('trả');
      expect(error400.json.error).toContain('lời');

      const error404 = await fetchEndpoint('/session/nonexistent-session');
      // "Phiên làm bài thi không tồn tại hoặc đã hết hạn."
      expect(error404.json.error).toContain('Phiên');
      expect(error404.json.error).toContain('bài');
      expect(error404.json.error).toContain('không');
      expect(error404.json.error).toContain('tồn tại');
      expect(error404.json.error).toContain('đã');
      expect(error404.json.error).toContain('hết');
      expect(error404.json.error).toContain('hạn');
    });

    it('enforces Content-Type charset=utf-8 on all tested endpoints', async () => {
      const calls = [
        fetchEndpoint('/blueprints'),
        fetchEndpoint('/practice?level=1&count=1'),
        fetchEndpoint('/session/nonexistent-session'),
        fetchEndpoint('/check-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        fetchEndpoint('/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: 1 }),
        }),
      ];

      const results = await Promise.all(calls);
      for (const r of results) {
        expect(r.contentType.toLowerCase()).toContain('application/json');
        expect(r.contentType.toLowerCase()).toContain('charset=utf-8');
        expect(r.rawText).not.toContain('\ufffd');
      }
    });
  });
});
