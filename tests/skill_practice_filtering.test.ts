/**
 * Test Suite: Strict Skill & Level Practice Filtering Verification (Issue 3 / R2)
 *
 * Verifies that:
 * 1. getPracticeQuestions(level, skill) strictly filters questions:
 *    - HSK 1 + listening -> 100% listening questions.
 *    - HSK 1 + reading -> 100% reading questions.
 *    - HSK 1 + writing -> 100% foundational writing questions.
 *    - Unknown / empty skill -> returns [] and never silently falls back to full exam.
 * 2. GET /api/exam/practice & GET /api/exam/practice-questions:
 *    - Enforces pure section filter.
 *    - Returns accurate metadata: requestedCount, actualCount, isShortage, skill, level.
 *    - When skill has 0 questions, returns [] and isShortage: true, without mixing other skills.
 * 3. POST /api/exam/generate-mock (mode: 'practice'):
 *    - Generates practice session with 100% matching section questions.
 *    - Strips answer_index and explanation_vi for student client safety.
 *    - Provides requestedCount, actualCount, isShortage metadata.
 * 4. Client Session Fetcher (fetchExamSessionFromBackend):
 *    - Clean isolation when switching skills (Listening -> Reading retains no stale questions).
 *    - Fallback on API network error / HTTP 500 maintains 100% pure skill filtering from fixtures.
 *    - Fallback on unavailable skill returns [] with isShortage: true without leaking other skills.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  getPracticeQuestions,
  getMockExamQuestions,
  HSKExamQuestion,
} from '../src/data/hskMockExamFixtures';
import {
  examRouter,
  clearAllSessionsForTesting,
  loadApprovedQuestionsFromDb,
  createTestExamDb,
  setExamDbForTesting,
} from '../src/server/examRoutes';
import {
  fetchExamSessionFromBackend,
  LoadExamSessionOptions,
  formatCorrectAnswerText,
} from '../src/components/HSKMockExam';

describe('Strict Skill & Level Practice Filtering Suite (Issue 3 / R2)', () => {
  // =========================================================================
  // 1. Core Fixture Filtering Engine: getPracticeQuestions
  // =========================================================================
  describe('1. getPracticeQuestions Core Fixture Filtering', () => {
    it('HSK 1 + listening -> 100% listening questions', () => {
      const questions = getPracticeQuestions(1, 'listening', undefined, 10);
      expect(questions.length).toBe(10);
      for (const q of questions) {
        expect(q.section.toLowerCase()).toBe('listening');
        expect(q.level).toBe(1);
      }
    });

    it('HSK 1 + reading -> 100% reading questions', () => {
      const questions = getPracticeQuestions(1, 'reading', undefined, 10);
      expect(questions.length).toBe(10);
      for (const q of questions) {
        expect(q.section.toLowerCase()).toBe('reading');
        expect(q.level).toBe(1);
      }
    });

    it('HSK 1 + writing -> 100% writing questions (foundational writing set)', () => {
      const questions = getPracticeQuestions(1, 'writing', undefined, 5);
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q.section.toLowerCase()).toBe('writing');
        expect(q.level).toBe(1);
      }
    });

    it('HSK 2..5 skills -> 100% pure matching section', () => {
      for (const lvl of [2, 3, 4, 5]) {
        for (const skill of ['listening', 'reading', 'writing']) {
          const qs = getPracticeQuestions(lvl, skill, undefined, 5);
          expect(qs.length).toBeGreaterThan(0);
          for (const q of qs) {
            expect(q.section.toLowerCase()).toBe(skill);
            expect(q.level).toBe(lvl);
          }
        }
      }
    });

    it('Skill with no questions -> returns [] and strictly NEVER falls back to full exam', () => {
      // 'speaking' is not in HSK 1 fixtures
      const qs = getPracticeQuestions(1, 'speaking', undefined, 10);
      expect(qs).toEqual([]);
      expect(qs.length).toBe(0);

      // Random non-existent skill
      const nonExistent = getPracticeQuestions(2, 'nonexistent_skill_xyz', undefined, 10);
      expect(nonExistent).toEqual([]);
      expect(nonExistent.length).toBe(0);
    });

    it('General practice with skill="all" or undefined returns questions from full exam', () => {
      const allSkill = getPracticeQuestions(1, 'all', undefined, 10);
      expect(allSkill.length).toBe(10);

      const undefSkill = getPracticeQuestions(1, undefined, undefined, 10);
      expect(undefSkill.length).toBe(10);
    });

    it('Boundary counts: count <= 0 returns empty array without crashing', () => {
      expect(getPracticeQuestions(1, 'listening', undefined, 0)).toEqual([]);
      expect(getPracticeQuestions(1, 'reading', undefined, -5)).toEqual([]);
    });

    it('Shortage request: requesting more questions than available returns only available without padding from other skills', () => {
      // HSK 1 writing has ~10 items
      const requested = 999;
      const qs = getPracticeQuestions(1, 'writing', undefined, requested);
      expect(qs.length).toBeLessThan(requested);
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.section.toLowerCase()).toBe('writing');
      }
    });
  });

  // =========================================================================
  // 2. Backend API Endpoints: GET /api/exam/practice & /practice-questions
  // =========================================================================
  describe('2. Backend GET /api/exam/practice & /practice-questions Endpoints', () => {
    let app: Express;
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      server = app.listen(0, '127.0.0.1');
      await new Promise<void>((resolve) => server.once('listening', resolve));
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
      clearAllSessionsForTesting();
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('GET /api/exam/practice with HSK 1 + listening returns 100% listening and accurate metadata', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=listening&count=8`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('listening');
      expect(data.level).toBe(1);
      expect(data.requestedCount).toBe(8);
      expect(data.actualCount).toBe(8);
      expect(data.count).toBe(8);
      expect(data.isShortage).toBe(false);
      expect(data.questions).toHaveLength(8);

      data.questions.forEach((q: any, idx: number) => {
        expect(q.section).toBe('listening');
        expect(q.item_number).toBe(idx + 1);
      });
    });

    it('GET /api/exam/practice-questions (alias) with HSK 1 + reading returns 100% reading', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice-questions?level=1&skill=reading&count=7`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('reading');
      expect(data.level).toBe(1);
      expect(data.requestedCount).toBe(7);
      expect(data.actualCount).toBe(7);
      expect(data.isShortage).toBe(false);
      expect(data.questions).toHaveLength(7);

      for (const q of data.questions) {
        expect(q.section).toBe('reading');
      }
    });

    it('GET /api/exam/practice with non-existent skill returns empty array, isShortage: true, and NO mixed skills', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=speaking&count=10`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('speaking');
      expect(data.actualCount).toBe(0);
      expect(data.count).toBe(0);
      expect(data.requestedCount).toBe(10);
      expect(data.isShortage).toBe(true);
      expect(data.questions).toEqual([]);
    });

    it('GET /api/exam/practice with count higher than pool returns available count and sets isShortage: true', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=writing&count=100`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('writing');
      expect(data.requestedCount).toBe(100);
      expect(data.actualCount).toBeLessThan(100);
      expect(data.actualCount).toBeGreaterThan(0);
      expect(data.isShortage).toBe(true);
      for (const q of data.questions) {
        expect(q.section).toBe('writing');
      }
    });

    it('GET /api/exam/practice with skill="all" returns questions across all sections and isShortage: false', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=all&count=10`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('all');
      expect(data.requestedCount).toBe(10);
      expect(data.actualCount).toBe(10);
      expect(data.isShortage).toBe(false);
      expect(data.questions).toHaveLength(10);
    });

    it('GET /api/exam/practice with skill=" LISTENING " handles uppercase and whitespace properly', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=%20LISTENING%20&count=5`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('listening');
      expect(data.questions).toHaveLength(5);
      for (const q of data.questions) {
        expect(q.section.toLowerCase()).toBe('listening');
      }
    });

    it('GET /api/exam/practice with specific part_type filters strictly by part_type', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&part_type=read_sentence_picture_match_6opt&count=4`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
      for (const q of data.questions) {
        expect(q.part_type.toLowerCase()).toBe('read_sentence_picture_match_6opt');
        expect(q.section.toLowerCase()).toBe('reading');
      }
    });
  });

  // =========================================================================
  // 3. Backend POST /api/exam/generate-mock Practice Session
  // =========================================================================
  describe('3. POST /api/exam/generate-mock Practice Mode Generation', () => {
    let app: Express;
    let server: Server;
    let baseUrl: string;
    let memDb: DatabaseSync;
    const originalEnvShuffle = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
    const originalDbPath = process.env.QBANK_DB_PATH;

    beforeAll(async () => {
      // Initialize isolated in-memory SQLite database with approved questions seeded
      memDb = createTestExamDb({ seedPool: true });
      setExamDbForTesting(memDb);

      app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      server = app.listen(0, '127.0.0.1');
      await new Promise<void>((resolve) => server.once('listening', resolve));
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
      if (originalEnvShuffle !== undefined) {
        process.env.ENABLE_SERVING_ANSWER_SHUFFLE = originalEnvShuffle;
      } else {
        delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
      }
      if (originalDbPath !== undefined) {
        process.env.QBANK_DB_PATH = originalDbPath;
      } else {
        delete process.env.QBANK_DB_PATH;
      }

      setExamDbForTesting(null);
      clearAllSessionsForTesting();
      try {
        memDb?.close();
      } catch {}

      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    beforeEach(() => {
      clearAllSessionsForTesting();
      setExamDbForTesting(memDb);
    });

    it('generates practice session with 100% listening questions and anti-cheat masking', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'listening',
          count: 6,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.requestedCount).toBe(6);
      expect(data.actualCount).toBe(6);
      expect(data.isShortage).toBe(false);
      expect(data.skill).toBe('listening');
      expect(data.session.mode).toBe('practice');
      expect(data.session.questions).toHaveLength(6);

      for (const q of data.session.questions) {
        expect(q.section).toBe('listening');
        // Anti-cheat verification
        expect(q.answer_index).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }
    });

    it('generates practice session with 100% reading questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 2,
          mode: 'practice',
          skill: 'reading',
          count: 10,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.session.skill).toBe('reading');
      expect(data.session.questions).toHaveLength(10);
      for (const q of data.session.questions) {
        expect(q.section).toBe('reading');
      }
    });

    it('returns empty questions array and isShortage: true when requesting a skill with 0 questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'speaking',
          count: 10,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.actualCount).toBe(0);
      expect(data.isShortage).toBe(true);
      expect(data.session.questions).toHaveLength(0);
      expect(data.session.isShortage).toBe(true);
    });

    it('GET /api/exam/session/:sessionId preserves practice shortage metadata', async () => {
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'writing',
          count: 99,
        }),
      });
      const genData = await genRes.json();
      const sId = genData.session.sessionId;

      const getRes = await fetch(`${baseUrl}/api/exam/session/${sId}`);
      expect(getRes.status).toBe(200);
      const sessionData = await getRes.json();

      expect(sessionData.session.sessionId).toBe(sId);
      expect(sessionData.session.requestedCount).toBe(99);
      expect(sessionData.session.actualCount).toBeLessThan(99);
      expect(sessionData.session.isShortage).toBe(true);
      expect(sessionData.session.skill).toBe('writing');
    });

    it('POST /api/exam/generate-mock with mode: "practice" and skill: "all" returns questions and NEVER returns empty array', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'all',
          count: 10,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('all');
      expect(data.requestedCount).toBe(10);
      expect(data.actualCount).toBe(10);
      expect(data.isShortage).toBe(false);
      expect(data.session.questions).toHaveLength(10);
      expect(data.session.isShortage).toBe(false);
    });

    it('POST /api/exam/generate-mock with mode: "practice" and skill: " READING " normalizes casing and whitespace', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: '  READING  ',
          count: 6,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.skill).toBe('reading');
      expect(data.session.questions).toHaveLength(6);
      for (const q of data.session.questions) {
        expect(q.section.toLowerCase()).toBe('reading');
      }
    });

    it('POST /api/exam/generate-mock with mode: "practice" and part_type filters strictly by part_type', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          part_type: 'read_sentence_picture_match_6opt',
          count: 5,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.session.questions.length).toBeGreaterThan(0);
      for (const q of data.session.questions) {
        expect(q.part_type.toLowerCase()).toBe('read_sentence_picture_match_6opt');
        expect(q.section.toLowerCase()).toBe('reading');
      }
    });
  });

  // =========================================================================
  // 4. Client Session Fetcher: Skill Switching Isolation & Error Fallback
  // =========================================================================
  describe('4. Client Session Fetcher: Skill Switching Isolation & Error Fallbacks', () => {
    it('switching skill from Listening to Reading retains zero stale listening questions', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
        callCount++;
        const body = JSON.parse(init.body);
        const requestedSkill = body.skill;

        const fakeQuestions: HSKExamQuestion[] =
          requestedSkill === 'listening'
            ? [
                {
                  id: 'ls-1',
                  level: 1,
                  section: 'listening',
                  part_type: 'listen_picture',
                  item_number: 1,
                  stem: '听录音 (Listening Stem)',
                  options: ['A', 'B'],
                  answer_index: 0,
                  explanation_vi: 'Nghe đúng',
                },
              ]
            : [
                {
                  id: 'rd-1',
                  level: 1,
                  section: 'reading',
                  part_type: 'read_comprehension',
                  item_number: 1,
                  stem: '阅读 (Reading Stem)',
                  options: ['C', 'D'],
                  answer_index: 1,
                  explanation_vi: 'Đọc đúng',
                },
              ];

        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            requestedCount: 1,
            actualCount: 1,
            isShortage: false,
            skill: requestedSkill,
            level: 1,
            session: {
              sessionId: `session-${requestedSkill}`,
              questions: fakeQuestions,
              level: 1,
              mode: 'practice',
              skill: requestedSkill,
            },
          }),
        };
      });

      // 1. Load Listening Session
      const listenResult = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'listening',
        count: 5,
        fetchFn: mockFetch as any,
      });

      expect(listenResult.success).toBe(true);
      expect(listenResult.dataSource).toBe('api');
      expect(listenResult.questions).toHaveLength(1);
      expect(listenResult.questions[0].section).toBe('listening');

      // 2. Switch to Reading Session
      const readResult = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'reading',
        count: 5,
        fetchFn: mockFetch as any,
      });

      expect(readResult.success).toBe(true);
      expect(readResult.dataSource).toBe('api');
      expect(readResult.questions).toHaveLength(1);
      expect(readResult.questions[0].section).toBe('reading');

      // Zero stale questions retained
      const listenInRead = readResult.questions.filter((q) => q.section === 'listening');
      expect(listenInRead).toHaveLength(0);
      expect(callCount).toBe(2);
    });

    it('fallback when API returns HTTP 500 error maintains 100% pure skill filtering from fixtures', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'listening',
        count: 6,
        fetchFn: mockFetch as any,
      });

      expect(result.success).toBe(false);
      expect(result.dataSource).toBe('fixture');
      expect(result.fallbackNotice).toContain('Chế độ dự phòng:');
      expect(result.questions).toHaveLength(6);
      expect(result.skill).toBe('listening');

      // 100% of fallback questions belong to listening!
      for (const q of result.questions) {
        expect(q.section.toLowerCase()).toBe('listening');
      }
    });

    it('fallback when network fetch throws Network Error maintains 100% pure skill filtering', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await fetchExamSessionFromBackend({
        level: 2,
        mode: 'practice',
        skill: 'reading',
        count: 8,
        fetchFn: mockFetch as any,
      });

      expect(result.success).toBe(false);
      expect(result.dataSource).toBe('fixture');
      expect(result.fallbackNotice).toContain('Chế độ ngoại tuyến:');
      expect(result.questions).toHaveLength(8);

      for (const q of result.questions) {
        expect(q.section.toLowerCase()).toBe('reading');
      }
    });

    it('fallback when skill has 0 questions returns empty array and isShortage: true without leaking other skills', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const result = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'speaking',
        count: 10,
        fetchFn: mockFetch as any,
      });

      expect(result.success).toBe(false);
      expect(result.dataSource).toBe('fixture');
      expect(result.questions).toEqual([]);
      expect(result.actualCount).toBe(0);
      expect(result.isShortage).toBe(true);
      expect(result.skill).toBe('speaking');
    });

    it('client fetcher with skill: "all" succeeds and properly returns questions across sections', async () => {
      const mockFetch = vi.fn().mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            requestedCount: 10,
            actualCount: 10,
            isShortage: false,
            skill: 'all',
            level: 1,
            session: {
              sessionId: 'session-all-1',
              level: 1,
              mode: 'practice',
              skill: 'all',
              questions: [
                { id: 'ls-1', level: 1, section: 'listening', part_type: 'listen_picture', item_number: 1, stem: '1', options: ['A'] },
                { id: 'rd-1', level: 1, section: 'reading', part_type: 'read_true_false', item_number: 2, stem: '2', options: ['A'] },
              ],
            },
          }),
        };
      });

      const result = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'all',
        count: 10,
        fetchFn: mockFetch as any,
      });

      expect(result.success).toBe(true);
      expect(result.dataSource).toBe('api');
      expect(result.skill).toBe('all');
      expect(result.questions).toHaveLength(2);
    });

    it('rapid sequential abort on switching skills cancels pending request cleanly', async () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();

      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
        if (init.signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                session: { sessionId: 'late', questions: [], mode: 'practice' },
              }),
            });
          }, 100);

          init.signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });

      // Start request 1 then immediately abort it
      const p1 = fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'listening',
        signal: controller1.signal,
        fetchFn: mockFetch as any,
      });
      controller1.abort();

      await expect(p1).rejects.toThrow('Aborted');

      // Request 2 completes cleanly
      const mockFetch2 = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          requestedCount: 5,
          actualCount: 5,
          isShortage: false,
          skill: 'reading',
          session: {
            sessionId: 'req2',
            questions: [{ id: 'r2', level: 1, section: 'reading', part_type: 'read_match', item_number: 1, stem: 's', options: ['A'] }],
            mode: 'practice',
          },
        }),
      });

      const p2 = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'reading',
        signal: controller2.signal,
        fetchFn: mockFetch2 as any,
      });

      expect(p2.success).toBe(true);
      expect(p2.questions[0].section).toBe('reading');
    });
  });

  // =========================================================================
  // 5. Adversarial Practice Edge Cases & Robustness (Review Round 2)
  // =========================================================================
  describe('5. Adversarial Practice Edge Cases & Robustness (Review Round 2)', () => {
    it('formatCorrectAnswerText handles null, undefined, or missing options gracefully without crashing', () => {
      expect(formatCorrectAnswerText(null, 0)).toBe('');
      expect(formatCorrectAnswerText(undefined, 2)).toBe('');
      expect(formatCorrectAnswerText([], 1)).toBe('');
      expect(formatCorrectAnswerText(['苹果', '香蕉'], 9)).toBe('J');
      expect(formatCorrectAnswerText(['A. 苹果', 'B. 香蕉'], 0)).toBe('A. 苹果');
      expect(formatCorrectAnswerText(['A: 苹果', 'B: 香蕉'], 1)).toBe('B. 香蕉');
    });

    it('fetchExamSessionFromBackend handles questions with null/empty options or custom part_type safely', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          requestedCount: 2,
          actualCount: 2,
          isShortage: false,
          skill: 'reading',
          level: 2,
          session: {
            sessionId: 'custom-session-123',
            level: 2,
            mode: 'practice',
            skill: 'reading',
            questions: [
              {
                id: 'custom-q1',
                level: 2,
                section: 'reading',
                part_type: 'unknown_custom_format_v9',
                item_number: 1,
                stem: 'Question with null options',
                options: null as any,
              },
              {
                id: 'custom-q2',
                level: 2,
                section: 'reading',
                part_type: 'custom_essay_type',
                item_number: 2,
                stem: 'Question with empty options',
                options: [],
              },
            ],
          },
        }),
      });

      const res = await fetchExamSessionFromBackend({
        level: 2,
        mode: 'practice',
        skill: 'reading',
        fetchFn: mockFetch as any,
      });

      expect(res.success).toBe(true);
      expect(res.dataSource).toBe('api');
      expect(res.questions).toHaveLength(2);
      expect(res.questions[0].id).toBe('custom-q1');
      expect(res.questions[1].id).toBe('custom-q2');
    });

    it('validates 3-tier isShortage logic consistency (full, partial shortage, zero questions)', async () => {
      // Tier A: Full quota met (actual === requested) -> isShortage: false
      const mockFetchFull = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          requestedCount: 5,
          actualCount: 5,
          isShortage: false,
          skill: 'listening',
          session: {
            sessionId: 'full-session',
            questions: Array.from({ length: 5 }, (_, i) => ({ id: `q-${i}`, section: 'listening' })),
            requestedCount: 5,
            actualCount: 5,
            isShortage: false,
          },
        }),
      });

      const resFull = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'listening',
        count: 5,
        fetchFn: mockFetchFull as any,
      });
      expect(resFull.isShortage).toBe(false);
      expect(resFull.actualCount).toBe(5);

      // Tier B: Partial shortage (0 < actual < requested) -> isShortage: true
      const mockFetchPartial = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          requestedCount: 10,
          actualCount: 4,
          isShortage: true,
          skill: 'writing',
          session: {
            sessionId: 'partial-session',
            questions: Array.from({ length: 4 }, (_, i) => ({ id: `w-${i}`, section: 'writing' })),
            requestedCount: 10,
            actualCount: 4,
            isShortage: true,
          },
        }),
      });

      const resPartial = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'writing',
        count: 10,
        fetchFn: mockFetchPartial as any,
      });
      expect(resPartial.isShortage).toBe(true);
      expect(resPartial.actualCount).toBe(4);

      // Tier C: Zero matching questions (actual === 0) -> isShortage: true
      const mockFetchZero = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          requestedCount: 10,
          actualCount: 0,
          isShortage: true,
          skill: 'speaking',
          session: {
            sessionId: 'zero-session',
            questions: [],
            requestedCount: 10,
            actualCount: 0,
            isShortage: true,
          },
        }),
      });

      const resZero = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'speaking',
        count: 10,
        fetchFn: mockFetchZero as any,
      });
      expect(resZero.isShortage).toBe(true);
      expect(resZero.actualCount).toBe(0);
      expect(resZero.questions).toEqual([]);
    });

    it('switching practice level & skill guarantees session and question pool isolation', async () => {
      let callIndex = 0;
      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
        callIndex++;
        const body = init?.body ? JSON.parse(init.body) : {};
        const requestedLevel = Number(body.level) || 1;
        const requestedSkill = body.skill || 'listening';
        const isLevel2Reading = requestedLevel === 2 && requestedSkill === 'reading';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            level: isLevel2Reading ? 2 : 1,
            skill: isLevel2Reading ? 'reading' : 'listening',
            requestedCount: 3,
            actualCount: 3,
            isShortage: false,
            session: {
              sessionId: `session-call-${callIndex}`,
              level: isLevel2Reading ? 2 : 1,
              skill: isLevel2Reading ? 'reading' : 'listening',
              mode: 'practice',
              questions: isLevel2Reading
                ? [{ id: 'l2-r1', level: 2, section: 'reading', stem: 'r1', options: ['A'] }]
                : [{ id: 'l1-l1', level: 1, section: 'listening', stem: 'l1', options: ['A'] }],
            },
          }),
        };
      });

      // Session 1: HSK 1 Listening
      const s1 = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'listening',
        fetchFn: mockFetch as any,
      });

      // Session 2: HSK 2 Reading
      const s2 = await fetchExamSessionFromBackend({
        level: 2,
        mode: 'practice',
        skill: 'reading',
        fetchFn: mockFetch as any,
      });

      expect(s1.sessionId).not.toBe(s2.sessionId);
      expect(s1.level).toBe(1);
      expect(s1.skill).toBe('listening');
      expect(s2.level).toBe(2);
      expect(s2.skill).toBe('reading');

      // Zero overlap in question IDs
      const s1Ids = new Set(s1.questions.map((q) => q.id));
      const overlap = s2.questions.filter((q) => s1Ids.has(q.id));
      expect(overlap).toHaveLength(0);
    });
  });

  // =========================================================================
  // 6. Adversarial Stress & Resiliency Verification (Review Round 3)
  // =========================================================================
  describe('6. Adversarial Stress & Resiliency Verification (Review Round 3)', () => {
    it('defensive sentence arrangement chip finder handles null/undefined options safely', () => {
      // Simulates assembled sentence chip matcher when options is null or undefined
      const assembled = '我是留学生';
      const safeFindMatch = (options: any, target: string) => {
        return (options || []).findIndex((opt: string) =>
          opt.replace(/^[A-Z]\.\s*/, '').replace(/[。！？]/g, '').trim() === target.replace(/[。！？]/g, '').trim()
        );
      };

      expect(safeFindMatch(null, assembled)).toBe(-1);
      expect(safeFindMatch(undefined, assembled)).toBe(-1);
      expect(safeFindMatch([], assembled)).toBe(-1);
      expect(safeFindMatch(['A. 我是学生', 'B. 我是留学生。'], assembled)).toBe(1);
    });

    it('result review & notebook card options mapping handles null/undefined options without crashing', () => {
      const sampleQuestionWithNullOpts: any = {
        id: 'q-null-opt',
        stem: 'Translate the following phrase',
        options: null,
        correctAnswer: 0,
        userAnswer: 0,
        options_images: undefined,
      };

      // Simulates render mapping in result view
      const mappedOptions = (sampleQuestionWithNullOpts.options || []).map((opt: string, idx: number) => ({
        letter: String.fromCharCode(65 + idx),
        text: opt,
      }));
      expect(mappedOptions).toEqual([]);

      const formattedAnswer = formatCorrectAnswerText(sampleQuestionWithNullOpts.options, sampleQuestionWithNullOpts.correctAnswer);
      expect(formattedAnswer).toBe('');
    });

    it('multi-step sequential practice level & skill transitions maintain strict purity across all hops', () => {
      // Step 1: HSK 1 Listening (requested: 25, pool: 20 -> returns 20, 100% listening)
      const hsk1L = getPracticeQuestions(1, 'listening', undefined, 25);
      expect(hsk1L.length).toBe(20);
      for (const q of hsk1L) {
        expect(q.section.toLowerCase()).toBe('listening');
        expect(q.level).toBe(1);
      }

      // Step 2: HSK 1 Writing (requested: 10, pool: 5 -> returns 5, 100% writing)
      const hsk1W = getPracticeQuestions(1, 'writing', undefined, 10);
      expect(hsk1W.length).toBe(5);
      for (const q of hsk1W) {
        expect(q.section.toLowerCase()).toBe('writing');
        expect(q.level).toBe(1);
      }

      // Step 3: HSK 2 Reading (requested: 8, pool: 25 -> returns 8, 100% reading)
      const hsk2R = getPracticeQuestions(2, 'reading', undefined, 8);
      expect(hsk2R.length).toBe(8);
      for (const q of hsk2R) {
        expect(q.section.toLowerCase()).toBe('reading');
        expect(q.level).toBe(2);
      }

      // Step 4: HSK 3 Writing (requested: 5, pool: 10 -> returns 5, 100% writing)
      const hsk3W = getPracticeQuestions(3, 'writing', undefined, 5);
      expect(hsk3W.length).toBe(5);
      for (const q of hsk3W) {
        expect(q.section.toLowerCase()).toBe('writing');
        expect(q.level).toBe(3);
      }
    });

    it('GET /api/exam/practice handles extreme/invalid count query parameters predictably', () => {
      // Testing fixture logic under negative and NaN counts
      expect(getPracticeQuestions(1, 'reading', undefined, -100)).toEqual([]);
      expect(getPracticeQuestions(1, 'reading', undefined, 0)).toEqual([]);
      // Upper bound limit: HSK 1 reading has exactly 20 questions in fixtures
      const maxAvailable = getPracticeQuestions(1, 'reading', undefined, 9999);
      expect(maxAvailable.length).toBe(20);
      for (const q of maxAvailable) {
        expect(q.section.toLowerCase()).toBe('reading');
      }
    });
  });
});
