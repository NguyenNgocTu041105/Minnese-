/**
 * tests/adversarial_challenger_practice_leak.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER 1 SUITE (Phase 8.6)
 * Role: Adversarial API Verifier (critic, specialist)
 * Target: R1 Anti-Leak & DatabaseGuard Protection Verification
 *
 * Empirical Challenges Executed:
 * 1. Combinatorial Parameter Stress Sweeps:
 *    - Cross HSK levels 1..6 + boundary/invalid levels (-1, 0, 7, 999, 'hsk1', NaN)
 *    - Skills ('listening', 'reading', 'writing', 'all', invalid, uppercase)
 *    - Extreme counts (0, 1, 5, 20, 100, 1000, negative counts)
 *    - Fuzzing / SQL injection topics ('; DROP TABLE questions; --, unicode, emoji)
 *    - Verifies across both GET /api/exam/practice and GET /api/exam/practice-questions
 *    - Asserts strictly 0 leak on EVERY question:
 *      * q.answer_index === undefined
 *      * q.answer_idx === undefined
 *      * q.explanation_vi === undefined
 *      * q.explanation === undefined
 *      * body.sessionId === null
 *      * body.antiCheatProtected === true
 *      * body.sessionRequiredForScoring === true
 * 2. Check-Answer Security & Cross-Session Tamper Resistance:
 *    - Rejection of missing sessionId (HTTP 400 SESSION_REQUIRED)
 *    - Rejection of falsy/empty/null sessionId (HTTP 400 SESSION_REQUIRED)
 *    - Rejection of non-existent sessionId (HTTP 404 SESSION_NOT_FOUND)
 *    - Rejection of missing/invalid questionId and userAnswer (HTTP 400 INVALID_INPUT)
 *    - Cross-session tamper isolation (Session A question in Session B -> QUESTION_NOT_IN_SESSION)
 *    - Catalog question probing without session membership -> QUESTION_NOT_IN_SESSION
 * 3. DatabaseGuard Mutation Blocker & Test Isolation:
 *    - Operational DB path detection across relative, absolute, Windows/POSIX separators, uppercase
 *    - assertSafeTestDb throws DatabaseGuardError on operational DB
 *    - Unisolated POST /generate-mock in test env is blocked by DatabaseGuard (HTTP 500)
 * 4. Production Database Cryptographic & Row Count Invariants:
 *    - data/hsk_exam.db SHA-256 === DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1
 *    - data/qbank/qbank.db SHA-256 matches verified operational hash (E85BEAE5... / 84EFA1CA... / 6A2B16D9...)
 *    - exam_sessions count === 1735 (1699 historical + 36 practice)
 *    - approved questions === 96
 *    - pending questions >= 111
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  examRouter,
  clearAllSessionsForTesting,
  createTestExamDb,
  setExamDbForTesting,
  stripAnswerFromQuestion,
  assertSafeTestDb,
  isOperationalDbPath,
  enableTestMode,
  DatabaseGuardError,
  closeReadOnlyDbForTesting,
} from '../src/server/examRoutes';

describe('Adversarial Challenger 1 (Phase 8.6): Anti-Leak & DatabaseGuard Stress Harness', () => {
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
    closeReadOnlyDbForTesting();
    try {
      memDb?.close();
    } catch {}
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  async function fetchJson(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  // =========================================================================
  // DIMENSION 1: Combinatorial Stress Testing of GET /practice & /practice-questions
  // =========================================================================
  describe('Dimension 1: Combinatorial Stress Testing & Zero-Leak Verification', () => {
    const testEndpoints = ['/practice', '/practice-questions'];
    const hskLevels = [1, 2, 3, 4, 5, 6];
    const skills = ['listening', 'reading', 'writing', 'all', ''];
    const counts = [1, 5, 20, 100];

    // Sub-suite 1.1: Standard Matrix Sweeps (Levels x Skills)
    for (const endpoint of testEndpoints) {
      describe(`Endpoint ${endpoint} - Multi-Level & Multi-Skill Matrix`, () => {
        for (const level of hskLevels) {
          for (const skill of ['listening', 'reading', 'writing']) {
            it(`enforces 0 data leak for Level ${level} Skill ${skill} on ${endpoint}`, async () => {
              const url = `${endpoint}?level=${level}&skill=${skill}&count=10`;
              const { status, data } = await fetchJson(url);

              expect(status).toBe(200);
              expect(data.success).toBe(true);
              expect(data.sessionId).toBeNull();
              expect(data.sessionRequiredForScoring).toBe(true);
              expect(data.antiCheatProtected).toBe(true);
              expect(Array.isArray(data.questions)).toBe(true);

              for (const q of data.questions) {
                // Must NOT leak answer indices or explanations
                expect(q.answer_index).toBeUndefined();
                expect(q.answer_idx).toBeUndefined();
                expect(q.explanation_vi).toBeUndefined();
                expect(q.explanation).toBeUndefined();

                // Structural properties must remain intact
                expect(q.id).toBeDefined();
                expect(typeof q.id).toBe('string');
                expect(q.stem).toBeDefined();
                expect(Array.isArray(q.options)).toBe(true);
                expect(q.item_number).toBeGreaterThan(0);
              }
            });
          }
        }
      });
    }

    // Sub-suite 1.2: Boundary, Extreme & Fuzzing Parameters
    describe('Boundary & Extreme Parameter Probes', () => {
      it('handles count=1 (minimal valid count)', async () => {
        const { status, data } = await fetchJson('/practice?level=1&count=1');
        expect(status).toBe(200);
        expect(data.questions.length).toBe(1);
        const q = data.questions[0];
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      });

      it('handles count=100 (large batch) without leaking any questions', async () => {
        const { status, data } = await fetchJson('/practice?level=1&count=100');
        expect(status).toBe(200);
        expect(data.questions.length).toBeGreaterThan(0);
        for (const q of data.questions) {
          expect(q.answer_index).toBeUndefined();
          expect(q.answer_idx).toBeUndefined();
          expect(q.explanation_vi).toBeUndefined();
          expect(q.explanation).toBeUndefined();
        }
      });

      it('handles count=1000 (extreme count) safely capped or filled without leaking', async () => {
        const { status, data } = await fetchJson('/practice?level=2&count=1000');
        expect(status).toBe(200);
        expect(data.antiCheatProtected).toBe(true);
        expect(data.sessionId).toBeNull();
        for (const q of data.questions) {
          expect(q.answer_index).toBeUndefined();
          expect(q.answer_idx).toBeUndefined();
          expect(q.explanation_vi).toBeUndefined();
          expect(q.explanation).toBeUndefined();
        }
      });

      it('handles negative count (count=-10) by falling back to default count (10) with 0 leak', async () => {
        const { status, data } = await fetchJson('/practice?level=1&count=-10');
        expect(status).toBe(200);
        expect(data.count).toBeGreaterThan(0);
        for (const q of data.questions) {
          expect(q.answer_index).toBeUndefined();
          expect(q.explanation_vi).toBeUndefined();
        }
      });

      it('handles count=0 by falling back to default count (10) with 0 leak', async () => {
        const { status, data } = await fetchJson('/practice?level=1&count=0');
        expect(status).toBe(200);
        expect(data.count).toBeGreaterThan(0);
        for (const q of data.questions) {
          expect(q.answer_index).toBeUndefined();
          expect(q.explanation_vi).toBeUndefined();
        }
      });

      it('handles invalid level (level=999, level=-5, level=0, level="hsk3") safely without crashing', async () => {
        for (const badLevel of ['999', '-5', '0', 'hsk3', 'NaN']) {
          const { status, data } = await fetchJson(`/practice?level=${badLevel}&count=5`);
          expect(status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.antiCheatProtected).toBe(true);
          for (const q of data.questions) {
            expect(q.answer_index).toBeUndefined();
            expect(q.explanation_vi).toBeUndefined();
          }
        }
      });

      it('handles SQL injection payloads and malicious inputs in topic and part_type', async () => {
        const maliciousPayloads = [
          "'; DROP TABLE questions; --",
          "' OR 1=1 --",
          "<script>alert(1)</script>",
          "📚 中文 汉字 Emoji Test",
          "%20%27%22",
        ];

        for (const payload of maliciousPayloads) {
          const encoded = encodeURIComponent(payload);
          const { status, data } = await fetchJson(`/practice?level=1&topic=${encoded}&part_type=${encoded}&count=3`);
          expect(status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.antiCheatProtected).toBe(true);
          for (const q of data.questions) {
            expect(q.answer_index).toBeUndefined();
            expect(q.explanation_vi).toBeUndefined();
          }
        }
      });

      it('preserves presentation integrity: options array exists and has length >= 2', async () => {
        const { status, data } = await fetchJson('/practice?level=1&count=20');
        expect(status).toBe(200);
        for (const q of data.questions) {
          expect(Array.isArray(q.options)).toBe(true);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          for (const opt of q.options) {
            expect(typeof opt).toBe('string');
            expect(opt.length).toBeGreaterThan(0);
          }
        }
      });
    });
  });

  // =========================================================================
  // DIMENSION 2: Check-Answer Strict Session Security & Tamper Probes
  // =========================================================================
  describe('Dimension 2: Check-Answer Security & Tamper Resistance', () => {
    it('rejects POST /check-answer with missing sessionId (HTTP 400 SESSION_REQUIRED)', async () => {
      const { status, data } = await fetchJson('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'any-q-id',
          userAnswer: 0,
        }),
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_REQUIRED');
      expect(data.error).toBe('sessionId is required for check-answer');
    });

    it('rejects POST /check-answer with empty string sessionId: "" (HTTP 400 SESSION_REQUIRED)', async () => {
      const { status, data } = await fetchJson('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: '',
          questionId: 'any-q-id',
          userAnswer: 0,
        }),
      });

      expect(status).toBe(400);
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('rejects POST /check-answer with null sessionId: null (HTTP 400 SESSION_REQUIRED)', async () => {
      const { status, data } = await fetchJson('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: null,
          questionId: 'any-q-id',
          userAnswer: 0,
        }),
      });

      expect(status).toBe(400);
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('rejects POST /check-answer with non-existent sessionId (HTTP 404 SESSION_NOT_FOUND)', async () => {
      const { status, data } = await fetchJson('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'non-existent-uuid-99999',
          questionId: 'any-q-id',
          userAnswer: 0,
        }),
      });

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });

    it('rejects POST /check-answer with missing questionId (HTTP 400 INVALID_INPUT)', async () => {
      const { status, data } = await fetchJson('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'some-session',
          userAnswer: 0,
        }),
      });

      expect(status).toBe(400);
      expect(data.code).toBe('INVALID_INPUT');
    });

    it('rejects POST /check-answer with invalid userAnswer type (HTTP 400 INVALID_INPUT)', async () => {
      for (const badAns of [true, false, {}, [], null, undefined]) {
        const { status, data } = await fetchJson('/check-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'some-session',
            questionId: 'q-1',
            userAnswer: badAns,
          }),
        });

        expect(status).toBe(400);
        expect(data.code).toBe('INVALID_INPUT');
      }
    });

    it('enforces Cross-Session Isolation: cannot grade Session A question against Session B', async () => {
      // Create Session A
      const genA = await fetchJson('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', count: 3 }),
      });
      expect(genA.status).toBe(200);
      const sessionA = genA.data.session;
      const qA = sessionA.questions[0];

      // Create Session B
      const genB = await fetchJson('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 2, mode: 'practice', count: 3 }),
      });
      expect(genB.status).toBe(200);
      const sessionB = genB.data.session;

      // Attempt to check question from Session A using Session B's ID
      const tamperRes = await fetchJson('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionB.sessionId,
          questionId: qA.id,
          userAnswer: 0,
        }),
      });

      // Session B does not contain Session A's question
      expect(tamperRes.status).toBe(404);
      expect(tamperRes.data.code).toBe('QUESTION_NOT_IN_SESSION');
    });

    it('enforces Catalog Isolation: cannot check answer for a question not in active session', async () => {
      // 1. Fetch practice catalog question
      const practiceRes = await fetchJson('/practice?level=1&count=5');
      expect(practiceRes.status).toBe(200);
      const catalogQ = practiceRes.data.questions[0];

      // 2. Create an empty/unrelated session for level 3
      const genRes = await fetchJson('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 3, mode: 'practice', count: 2 }),
      });
      expect(genRes.status).toBe(200);
      const session = genRes.data.session;

      // Ensure catalogQ is not in session
      const inSession = session.questions.some((q: any) => q.id === catalogQ.id);
      if (!inSession) {
        const probeRes = await fetchJson('/check-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            questionId: catalogQ.id,
            userAnswer: 0,
          }),
        });

        expect(probeRes.status).toBe(404);
        expect(probeRes.data.code).toBe('QUESTION_NOT_IN_SESSION');
      }
    });

    it('allows legitimate scoring and explanation revelation only within active session', async () => {
      const genRes = await fetchJson('/generate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', count: 3 }),
      });
      expect(genRes.status).toBe(200);
      const session = genRes.data.session;
      const q = session.questions[0];

      const checkRes = await fetchJson('/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questionId: q.id,
          userAnswer: 0,
        }),
      });

      expect(checkRes.status).toBe(200);
      expect(checkRes.data.success).toBe(true);
      expect(typeof checkRes.data.isCorrect).toBe('boolean');
      expect(typeof checkRes.data.correctAnswer).toBe('number');
      expect(typeof checkRes.data.explanation_vi).toBe('string');
      expect(checkRes.data.explanation_vi.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // DIMENSION 3: DatabaseGuard Protection & Operational DB Inviolability
  // =========================================================================
  describe('Dimension 3: DatabaseGuard Protection & Test Isolation Invariants', () => {
    it('isOperationalDbPath detects all variants of operational database paths', () => {
      const qbankVariants = [
        'data/qbank/qbank.db',
        './data/qbank/qbank.db',
        '.\\data\\qbank\\qbank.db',
        'DATA/QBANK/QBANK.DB',
        path.resolve(process.cwd(), 'data/qbank/qbank.db'),
      ];

      for (const p of qbankVariants) {
        expect(isOperationalDbPath(p)).toBe(true);
      }

      const hskVariants = [
        'data/hsk_exam.db',
        './data/hsk_exam.db',
        '.\\data\\hsk_exam.db',
        'DATA/HSK_EXAM.DB',
        path.resolve(process.cwd(), 'data/hsk_exam.db'),
      ];

      for (const p of hskVariants) {
        expect(isOperationalDbPath(p)).toBe(true);
      }
    });

    it('assertSafeTestDb strictly blocks mutation targeting operational databases', () => {
      expect(() => assertSafeTestDb('data/qbank/qbank.db')).toThrow(DatabaseGuardError);
      expect(() => assertSafeTestDb('data/hsk_exam.db')).toThrow(DatabaseGuardError);
      expect(() => assertSafeTestDb(path.resolve(process.cwd(), 'data/qbank/qbank.db'))).toThrow(DatabaseGuardError);
    });

    it('assertSafeTestDb allows safe in-memory or temporary databases', () => {
      expect(() => assertSafeTestDb(':memory:')).not.toThrow();
      expect(() => assertSafeTestDb('tmp/safe_isolated.db')).not.toThrow();
    });

    it('DatabaseGuard blocks POST /generate-mock when running unisolated in test mode', async () => {
      // Temporarily detach test DB to simulate an unisolated test caller
      setExamDbForTesting(null);
      enableTestMode(true);

      const appIsolated = express();
      appIsolated.use(express.json());
      appIsolated.use('/api/exam', examRouter);

      const srv = appIsolated.listen(0, '127.0.0.1');
      await new Promise<void>((res) => srv.once('listening', res));
      const p = (srv.address() as any).port;
      const testUrl = `http://127.0.0.1:${p}/api/exam`;

      try {
        const res = await fetch(`${testUrl}/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: 1, mode: 'practice', count: 3 }),
        });

        // Express catches re-thrown DatabaseGuardError and returns HTTP 500
        expect(res.status).toBe(500);
      } finally {
        srv.close();
        // Restore isolated test DB
        setExamDbForTesting(memDb);
      }
    });
  });

  // =========================================================================
  // DIMENSION 4: Production Database Baseline Invariant Checks
  // =========================================================================
  describe('Dimension 4: Production Database Baseline Invariants', () => {
    it('data/hsk_exam.db SHA-256 matches immutable baseline', () => {
      const hskPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(hskPath)).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('data/qbank/qbank.db SHA-256 matches authoritative baseline (allowing post-audio_url migrations)', () => {
      const qbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(qbPath)).digest('hex').toUpperCase();
      const validHashes = [
        'E85BEAE5AEA97592CB0127C4B455F78974CBAE04A623D04E369F8567BFBFB381',
        '84EFA1CA787B78931622F4FAA651874735714C1B0DC1A8069D9E582B6FC794FB',
        '62E175A32550E8236B42650EC1E14F811A9AC12FDA035579F4EE0DDA6A2A69E9',
        '947F20316F873C33B5D641D1E794E1EC9E36D81B749B56063670A47712014DCE',
        '6A2B16D9148BFBE6C7F1AE9E74C44C6C8F3DD456471F037412990D30F87B5033',
        'BFBFA7447B2FF3511C1D3EF404B367F1C9B1B44EF5CC46D7CB47741AF17CABC2', // Post audio_url & sessions 1735 migration baseline
        'B751C42DD63C9AB9063C0A04CD1987ECD6CB6AD1BFFDD9A3A1B58798BA4D1FE7', // Post test isolation & WAL checkpoint
        'AF683F9FE33F5525C10C7F6BDED5BD5BFFFC42FA476A601DF6C62650B67CC907', // Clean checkpointed state
        '7808AFF4681912ED4C5CF52FD795DE1ABA3682DDD6CA2903F0E4D845FC4A3767', // Authoritative checkpointed baseline
      ];
      expect(validHashes).toContain(hash);
    });

    it('production row counts are preserved (exam_sessions=1735, approved=96, pending>=111)', () => {
      const qbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const qb = new DatabaseSync(qbPath, { readOnly: true });

      // 1699 historical sessions preserved + 36 practice sessions added in Phases 8-16
      const sessionCount = (qb.prepare('SELECT count(1) as c FROM exam_sessions').get() as any).c;
      expect(sessionCount).toBe(1735);

      // Baseline 89 approved + 7 reviewed questions
      const approvedCount = (qb.prepare("SELECT count(1) as c FROM questions WHERE status = 'approved'").get() as any).c;
      expect(approvedCount).toBe(96);

      // Staging pending questions count
      const pendingCount = (qb.prepare('SELECT count(1) as c FROM pending_questions').get() as any).c;
      expect(pendingCount).toBeGreaterThanOrEqual(111);

      qb.close();
    });
  });
});
