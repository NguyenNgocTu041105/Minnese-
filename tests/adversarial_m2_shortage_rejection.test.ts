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
import { getMockExamQuestions } from '../src/data/hskMockExamFixtures';

describe('Adversarial M2: Blueprint Shortage Rejection & Zero Silent Fixture Fallback', () => {
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
    clearAllSessionsForTesting();
    setExamDbForTesting(null);
    try {
      memDb?.close();
    } catch {}
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  async function postGenerateMock(body: any) {
    const res = await fetch(`${baseUrl}/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const status = res.status;
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status, json };
  }

  // -------------------------------------------------------------------------
  // 1. Comprehensive HSK Levels 1-6 Across Modes: Default, 'mock', 'official_mock'
  // -------------------------------------------------------------------------
  describe('1. Universal Level 1-6 Shortage Rejection Across Mock Modes', () => {
    const testCases: Array<{ level: number; modeDescription: string; payload: any }> = [];

    for (let level = 1; level <= 6; level++) {
      testCases.push(
        { level, modeDescription: 'default mode (omitted mode)', payload: { level } },
        { level, modeDescription: 'explicit mode: "mock"', payload: { level, mode: 'mock' } },
        { level, modeDescription: 'explicit mode: "official_mock"', payload: { level, mode: 'official_mock' } }
      );
    }

    testCases.forEach(({ level, modeDescription, payload }) => {
      it(`HSK ${level} with ${modeDescription} strictly returns HTTP 400 and structured breakdown without fixtures`, async () => {
        const { status, json } = await postGenerateMock(payload);

        expect(status).toBe(400);
        expect(json).toBeDefined();
        expect(json.success).toBe(false);
        expect(json.mode).toBe('mock');
        expect(json.level).toBe(level);
        expect(json.is_fully_eligible).toBe(false);
        expect(typeof json.total_required).toBe('number');
        expect(json.total_required).toBeGreaterThan(0);
        expect(typeof json.total_available).toBe('number');
        expect(typeof json.total_missing).toBe('number');
        expect(json.total_missing).toBeGreaterThan(0);
        expect(json.total_missing).toBe(json.total_required - json.total_available);
        expect(json.sections).toBeDefined();
        expect(typeof json.sections).toBe('object');
        expect(typeof json.error).toBe('string');
        expect(json.error).toContain(`Kho câu hỏi HSK ${level} chưa đủ điều kiện tạo đề thi chính thức`);
        // Zero fixture leakage
        expect(json.questions).toBeUndefined();
        expect(json.sessionId).toBeUndefined();
        expect(json.usingFixtureFallback).toBeUndefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. Partial Query Bypass Attempts (Skill, Topic, Vocab, Part Type, Count)
  // -------------------------------------------------------------------------
  describe('2. Partial Filter Tampering Cannot Bypass Shortage Rejection in Mock Mode', () => {
    const bypassAttempts = [
      { name: 'skill filter only (listening)', payload: { level: 1, mode: 'mock', skill: 'listening' } },
      { name: 'skill filter only (reading)', payload: { level: 1, mode: 'mock', skill: 'reading' } },
      { name: 'skill filter only (writing)', payload: { level: 3, mode: 'mock', skill: 'writing' } },
      { name: 'topic filter', payload: { level: 1, mode: 'mock', topic: 'daily_life' } },
      { name: 'vocab filter', payload: { level: 1, mode: 'mock', vocab: '你' } },
      { name: 'part_type filter', payload: { level: 1, mode: 'mock', part_type: 'read_true_false' } },
      { name: 'low count tampering (count: 1)', payload: { level: 1, mode: 'mock', count: 1 } },
      { name: 'zero count tampering (count: 0)', payload: { level: 1, mode: 'mock', count: 0 } },
      { name: 'negative count tampering (count: -10)', payload: { level: 1, mode: 'mock', count: -10 } },
      { name: 'strict: false tampering', payload: { level: 1, mode: 'mock', strict: false } },
      { name: 'strictQbankOnly: false tampering', payload: { level: 1, mode: 'mock', strictQbankOnly: false } },
      { name: 'SQL injection string in topic', payload: { level: 1, mode: 'mock', topic: "' OR 1=1 --" } },
      { name: 'SQL injection string in vocab', payload: { level: 1, mode: 'mock', vocab: "'; DROP TABLE questions; --" } },
    ];

    bypassAttempts.forEach(({ name, payload }) => {
      it(`tampering attempt "${name}" is strictly rejected with HTTP 400`, async () => {
        const { status, json } = await postGenerateMock(payload);

        expect(status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.is_fully_eligible).toBe(false);
        expect(json.questions).toBeUndefined();
        expect(json.sessionId).toBeUndefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Unauthorized Fixture Fallback Probing
  // -------------------------------------------------------------------------
  describe('3. Unauthorized Attempts to Trigger Fixture Fallback', () => {
    it('rejects with HTTP 400 when allowFixtures: false is passed explicitly', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        allowFixtures: false,
      });

      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });

    it('rejects with HTTP 400 when allow_fixtures: false is passed explicitly', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        allow_fixtures: false,
      });

      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });

    it('rejects with HTTP 400 when isFixtureDemo: false is passed explicitly', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        isFixtureDemo: false,
      });

      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });

    it('rejects with HTTP 400 on unrecognized/random mode strings', async () => {
      const randomModes = ['random_mode', 'full_exam', 'standard', 'cheat_mode', 'default'];
      for (const randMode of randomModes) {
        const { status, json } = await postGenerateMock({
          level: 1,
          mode: randMode,
        });

        expect(status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.questions).toBeUndefined();
      }
    });

    it('rejects with HTTP 400 when allowFixtures is falsy values: 0, "", null', async () => {
      for (const falsyVal of [0, '', null]) {
        const { status, json } = await postGenerateMock({
          level: 1,
          mode: 'mock',
          allowFixtures: falsyVal,
        });

        expect(status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.questions).toBeUndefined();
      }
    });

    it('probes string-encoded boolean tampering: allowFixtures: "false"', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        allowFixtures: 'false',
      });

      // ADVERSARIAL STRESS TEST:
      // If server does Boolean(body.allowFixtures), "false" is truthy in JS, causing unexpected fixture demo activation.
      // A strictly secure server must NOT authorize fixture fallback on "false".
      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });

    it('probes string-encoded boolean tampering: allow_fixtures: "false"', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        allow_fixtures: 'false',
      });

      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });

    it('probes string-encoded boolean tampering: isFixtureDemo: "false"', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        isFixtureDemo: 'false',
      });

      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });

    it('probes string-encoded boolean tampering: allowFixtures: "0"', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        allowFixtures: '0',
      });

      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Authorized Fixture Fallback Validation (allowFixtures: true)
  // -------------------------------------------------------------------------
  describe('4. Authorized Explicit Fixture Demo Validation', () => {
    it('correctly sets dataSource, usingFixtureFallback, isFixtureDemo, and fallbackNotice when allowFixtures: true', async () => {
      const { status, json } = await postGenerateMock({
        level: 1,
        mode: 'mock',
        allowFixtures: true,
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dataSource).toBe('fixture');
      expect(json.usingFixtureFallback).toBe(true);
      expect(json.isFixtureDemo).toBe(true);
      expect(typeof json.fallbackNotice).toBe('string');
      expect(json.fallbackNotice).toContain('Đề thi mẫu demo (Fixtures)');
      expect(Array.isArray(json.questions)).toBe(true);
      expect(json.questions.length).toBe(40);
      expect(json.sessionId).toBeDefined();

      // Anti-cheat verification: answers stripped from client delivery
      for (const q of json.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(typeof q.stem).toBe('string');
      }
    });

    it('correctly sets metadata when allow_fixtures: true is used (snake_case)', async () => {
      const { status, json } = await postGenerateMock({
        level: 2,
        mode: 'mock',
        allow_fixtures: true,
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dataSource).toBe('fixture');
      expect(json.usingFixtureFallback).toBe(true);
      expect(json.isFixtureDemo).toBe(true);
      expect(json.questions.length).toBe(60);
    });

    it('correctly serves fixture demo across all HSK levels 1-6 when allowFixtures: true', async () => {
      const expectedCounts: Record<number, number> = {
        1: 40,
        2: 60,
        3: 70,
        4: 70,
        5: 72,
        6: 82,
      };

      for (let level = 1; level <= 6; level++) {
        const { status, json } = await postGenerateMock({
          level,
          mode: 'mock',
          allowFixtures: true,
        });

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.dataSource).toBe('fixture');
        expect(json.usingFixtureFallback).toBe(true);
        expect(json.isFixtureDemo).toBe(true);
        expect(json.questions.length).toBe(getMockExamQuestions(level).length);
      }
    });
  });
});
