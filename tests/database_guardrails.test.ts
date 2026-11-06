import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import {
  examRouter,
  assertSafeTestDb,
  isOperationalDbPath,
  isTestEnv,
  enableTestMode,
  createTestExamDb,
  setExamDbForTesting,
  closeReadOnlyDbForTesting,
  clearAllSessionsForTesting,
  DatabaseGuardError,
} from '../src/server/examRoutes';

describe('Database Guard Rails & Test DB Isolation (R2)', () => {
  const originalQbankEnv = process.env.QBANK_DB_PATH;

  beforeEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(null);
    closeReadOnlyDbForTesting();
    delete process.env.QBANK_DB_PATH;
  });

  afterEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(null);
    closeReadOnlyDbForTesting();
    if (originalQbankEnv !== undefined) {
      process.env.QBANK_DB_PATH = originalQbankEnv;
    } else {
      delete process.env.QBANK_DB_PATH;
    }
  });

  describe('1. Operational Database Path Detection', () => {
    it('accurately identifies data/qbank/qbank.db as operational DB regardless of formatting', () => {
      expect(isOperationalDbPath('data/qbank/qbank.db')).toBe(true);
      expect(isOperationalDbPath('./data/qbank/qbank.db')).toBe(true);
      expect(isOperationalDbPath('data\\qbank\\qbank.db')).toBe(true);
      expect(isOperationalDbPath(path.resolve(process.cwd(), 'data/qbank/qbank.db'))).toBe(true);
      expect(isOperationalDbPath('DATA/QBANK/QBANK.DB')).toBe(true);
    });

    it('accurately identifies data/hsk_exam.db as operational DB', () => {
      expect(isOperationalDbPath('data/hsk_exam.db')).toBe(true);
      expect(isOperationalDbPath('./data/hsk_exam.db')).toBe(true);
      expect(isOperationalDbPath('data\\hsk_exam.db')).toBe(true);
      expect(isOperationalDbPath(path.resolve(process.cwd(), 'data/hsk_exam.db'))).toBe(true);
    });

    it('does NOT flag in-memory or temporary databases as operational', () => {
      expect(isOperationalDbPath(':memory:')).toBe(false);
      expect(isOperationalDbPath('')).toBe(false);
      expect(isOperationalDbPath('tmp/test.db')).toBe(false);
      expect(isOperationalDbPath('test_isolated.sqlite')).toBe(false);
    });
  });

  describe('2. assertSafeTestDb Guard Rail Assertion Helper', () => {
    it('throws DatabaseGuardError when given operational qbank.db path', () => {
      expect(() => assertSafeTestDb('data/qbank/qbank.db')).toThrow(DatabaseGuardError);
      expect(() => assertSafeTestDb('data/qbank/qbank.db')).toThrow(
        /Operational database write\/mutation blocked/
      );
    });

    it('throws DatabaseGuardError when given operational hsk_exam.db path', () => {
      expect(() => assertSafeTestDb('data/hsk_exam.db')).toThrow(DatabaseGuardError);
    });

    it('throws DatabaseGuardError when no path given and QBANK_DB_PATH is unset (defaulting to operational DB)', () => {
      delete process.env.QBANK_DB_PATH;
      expect(() => assertSafeTestDb()).toThrow(DatabaseGuardError);
    });

    it('does NOT throw when given :memory: or a temporary test database', () => {
      expect(() => assertSafeTestDb(':memory:')).not.toThrow();
      expect(() => assertSafeTestDb('tmp/safe_test.db')).not.toThrow();
    });

    it('guard rail works even if environment variables are missing', () => {
      // Direct call ignores NODE_ENV and VITEST because the target path is checked directly
      expect(() => assertSafeTestDb(path.resolve(process.cwd(), 'data/qbank/qbank.db'))).toThrow(
        DatabaseGuardError
      );
    });
  });

  describe('3. In-Memory Database Creation & Seeding', () => {
    it('creates an in-memory SQLite database with exam_sessions schema', () => {
      const memDb = createTestExamDb({ seedPool: false });
      const tableInfo = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='exam_sessions'").get();
      expect(tableInfo).toBeDefined();
      memDb.close();
    });

    it('seeds approved questions and pool from operational DB in read-only mode by default', () => {
      const memDb = createTestExamDb({ seedPool: true });
      const qCount = (memDb.prepare('SELECT count(*) as c FROM questions').get() as any).c;
      const pCount = (memDb.prepare('SELECT count(*) as c FROM exam_eligible_pool').get() as any).c;
      // 96 approved active questions seeded from operational qbank.db (89 baseline + 7 admin-approved)
      expect(qCount).toBe(96);
      expect(pCount).toBeGreaterThanOrEqual(96);
      memDb.close();
    });
  });

  describe('4. Router Guard Rail Execution & Isolation', () => {
    it('passing null to setExamDbForTesting prevents writes to operational DB', async () => {
      setExamDbForTesting(null);
      enableTestMode(true);

      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      const server = app.listen(0);
      const port = (server.address() as any).port;
      const baseUrl = `http://127.0.0.1:${port}/api/exam`;

      try {
        // Attempting to generate a session when DB is unisolated in test mode should fail or abort
        const res = await fetch(`${baseUrl}/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: 1, mode: 'practice', count: 5 }),
        });

        // The request must NOT succeed without an isolated test database
        // In Express, a rethrown error results in 500
        expect(res.status).toBe(500);
      } finally {
        server.close();
      }
    });

    it('allows clean session generation and scoring when an isolated in-memory DB is injected', async () => {
      const memDb = createTestExamDb({ seedPool: true });
      setExamDbForTesting(memDb);

      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      const server = app.listen(0);
      const port = (server.address() as any).port;
      const baseUrl = `http://127.0.0.1:${port}/api/exam`;

      try {
        const res = await fetch(`${baseUrl}/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: 1, mode: 'practice', count: 3 }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.sessionId).toBeDefined();

        // The session must be in memDb and NOT in operational DB
        const savedInMem = memDb.prepare('SELECT count(*) as c FROM exam_sessions').get() as any;
        expect(savedInMem.c).toBe(1);

        // Submit to memDb
        const subRes = await fetch(`${baseUrl}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            answers: {},
            timeSpentSeconds: 60,
          }),
        });

        expect(subRes.status).toBe(200);
        const subData = await subRes.json();
        expect(subData.success).toBe(true);

        const updatedInMem = memDb.prepare('SELECT status FROM exam_sessions WHERE session_id = ?').get(data.sessionId) as any;
        expect(updatedInMem.status).toBe('submitted');
      } finally {
        server.close();
        memDb.close();
      }
    });

    it('supports QBANK_DB_PATH=":memory:" environment variable override', async () => {
      process.env.QBANK_DB_PATH = ':memory:';

      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      const server = app.listen(0);
      const port = (server.address() as any).port;
      const baseUrl = `http://127.0.0.1:${port}/api/exam`;

      try {
        const res = await fetch(`${baseUrl}/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: 1, mode: 'practice', count: 3 }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      } finally {
        server.close();
      }
    });
  });
});
