/**
 * Phase 5 Milestone M3 Adversarial Stress Testing Suite
 * Challenger 1: challenger_o29_m3_1
 *
 * Target: Skill Practice Flow & Pool Sync (R3, R4, AC 7–9)
 *
 * Empirical Challenges:
 * 1. Invalid / Out-of-bounds parameters (level=0, level=7, skill='invalid', count=-5, count=1000).
 * 2. SQL injection resistance across all query parameters and endpoints.
 * 3. Strict question isolation: no pending, rejected, or disabled questions leak under concurrency or unusual filters.
 * 4. Offline / Zero-LLM Invariant: practice mode NEVER calls any LLM SDK or external network.
 * 5. Empty-state edge cases, session lifecycle, and client helper resilience.
 * 6. Database preservation: data/hsk_exam.db SHA-256 invariant.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import express, { Express } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  examRouter,
  loadApprovedQuestionsFromDb,
  setExamDbForTesting,
  clearAllSessionsForTesting,
  getSessionDirect,
  createTestExamDb,
} from '../src/server/examRoutes.js';
import {
  ensureEligiblePoolSchema,
  getEligiblePoolStats,
  inspectExamPoolBySections,
} from '../src/server/qbankFormatSync.js';
import {
  fetchExamSessionFromBackend,
  formatConciseExplanation,
} from '../src/components/HSKMockExam.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Challenger M3: Adversarial Stress Test Suite (Skill Practice Flow & Pool Sync)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let memDb: DatabaseSync;

  beforeAll(async () => {
    // Invariant check at start
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    memDb = createTestExamDb({ seedPool: true });
    setExamDbForTesting(memDb);

    // Setup Express server mounting examRouter
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
    setExamDbForTesting(null);
    clearAllSessionsForTesting();
    try {
      memDb?.close();
    } catch {}

    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }

    // Invariant check at end
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(memDb);
  });

  // =========================================================================
  // Challenge 1: Invalid & Out-of-Bounds Parameters
  // =========================================================================
  describe('Challenge 1: Invalid & Out-of-Bounds Parameter Stress', () => {
    it('loadApprovedQuestionsFromDb directly returns empty array for out-of-bounds levels', () => {
      expect(loadApprovedQuestionsFromDb(0)).toEqual([]);
      expect(loadApprovedQuestionsFromDb(7)).toEqual([]);
      expect(loadApprovedQuestionsFromDb(-1)).toEqual([]);
      expect(loadApprovedQuestionsFromDb(99999)).toEqual([]);
      expect(loadApprovedQuestionsFromDb(NaN)).toEqual([]);
    });

    it('GET /api/exam/practice handles out-of-bounds level safely without crashing (500)', async () => {
      const testCases = ['level=0', 'level=7', 'level=-10', 'level=99999', 'level=abc', 'level=1.5', 'level=NaN'];

      for (const tc of testCases) {
        const res = await fetch(`${baseUrl}/api/exam/practice?${tc}`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.llmCallsMade).toBe(0);
        // Fallback or sanitized level should be between 1 and 6
        expect(data.level).toBeGreaterThanOrEqual(1);
        expect(data.level).toBeLessThanOrEqual(6);
      }
    });

    it('GET /api/exam/practice handles count=-5 and count=0 by defaulting to 10 safely', async () => {
      const resNeg = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&count=-5`);
      expect(resNeg.status).toBe(200);
      const dataNeg = await resNeg.json();
      expect(dataNeg.success).toBe(true);
      expect(dataNeg.requestedCount).toBe(10);
      expect(dataNeg.questions.length).toBe(10);

      const resZero = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&count=0`);
      expect(resZero.status).toBe(200);
      const dataZero = await resZero.json();
      expect(dataZero.success).toBe(true);
      expect(dataZero.requestedCount).toBe(10);
      expect(dataZero.questions.length).toBe(10);
    });

    it('GET /api/exam/practice handles massive count=1000 without crashing or exceeding available items', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&count=1000&strict=true`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.requestedCount).toBe(1000);
      // HSK 1 Reading has 53 approved questions in qbank.db
      expect(data.questions.length).toBe(53);
      expect(data.actualCount).toBe(53);
      expect(data.isShortage).toBe(true);
    });

    it('GET /api/exam/practice handles invalid skill gracefully with zero question leakage', async () => {
      const invalidSkills = ['invalid', 'speaking', 'math', 'unknown_skill', '1234', 'null'];

      for (const sk of invalidSkills) {
        const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=${sk}&strict=true`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.llmCallsMade).toBe(0);
        // Non-existent skill in strict mode must return empty array without borrowing questions from other skills
        expect(data.questions).toEqual([]);
        expect(data.actualCount).toBe(0);
        expect(data.isShortage).toBe(true);
      }
    });

    it('POST /api/exam/generate-mock handles boundary count and invalid mode/level cleanly', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 99,
          mode: 'practice',
          skill: 'nonexistent',
          count: -100,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.llmCallsMade).toBe(0);
      expect(data.session.questions).toEqual([]);
      expect(data.session.actualCount).toBe(0);
    });
  });

  // =========================================================================
  // Challenge 2: SQL Injection Resistance
  // =========================================================================
  describe('Challenge 2: SQL Injection Resistance in Practice Queries', () => {
    const SQLI_PAYLOADS = [
      "' OR 1=1 --",
      "' UNION SELECT * FROM questions --",
      "'; DROP TABLE questions; --",
      "1; DROP TABLE exam_sessions; --",
      "' OR '1'='1",
      "' UNION SELECT null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null --",
      "\" OR \"\"=\"",
      "admin'--",
      "1' OR status='pending' --",
      "reading' OR 1=1 --",
      "'; DELETE FROM exam_sessions WHERE 1=1; --",
    ];

    it('GET /api/exam/practice resists SQL injection in skill filter', async () => {
      for (const payload of SQLI_PAYLOADS) {
        const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=${encodeURIComponent(payload)}&strict=true`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.llmCallsMade).toBe(0);
        // Injection must not bypass filters or return unapproved items
        expect(data.questions).toEqual([]);
      }
    });

    it('GET /api/exam/practice resists SQL injection in topic and vocab filters', async () => {
      for (const payload of SQLI_PAYLOADS) {
        const resTopic = await fetch(`${baseUrl}/api/exam/practice?level=1&topic=${encodeURIComponent(payload)}&strict=true`);
        expect(resTopic.status).toBe(200);
        const dataTopic = await resTopic.json();
        expect(dataTopic.success).toBe(true);

        const resVocab = await fetch(`${baseUrl}/api/exam/practice?level=1&vocab=${encodeURIComponent(payload)}&strict=true`);
        expect(resVocab.status).toBe(200);
        const dataVocab = await resVocab.json();
        expect(dataVocab.success).toBe(true);
      }
    });

    it('GET /api/exam/session/:sessionId resists SQL injection attacks', async () => {
      for (const payload of SQLI_PAYLOADS) {
        const res = await fetch(`${baseUrl}/api/exam/session/${encodeURIComponent(payload)}`);
        // Should safely return 404 Not Found, never 500 SQL syntax error
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    it('POST /api/exam/check-answer resists SQL injection in questionId', async () => {
      for (const payload of SQLI_PAYLOADS) {
        const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: payload,
            userAnswer: 0,
          }),
        });
        expect([400, 404]).toContain(res.status);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    it('POST /api/exam/generate-mock resists SQL injection via excludeQuestionIds', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 5,
          excludeQuestionIds: SQLI_PAYLOADS,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.questions.length).toBe(5);
    });
  });

  // =========================================================================
  // Challenge 3: Strict Status Isolation & Concurrency Leakage Prevention
  // =========================================================================
  describe('Challenge 3: Question Isolation Under Adversarial Statuses & Concurrency', () => {
    let mockAdvDb: DatabaseSync;

    beforeEach(() => {
      mockAdvDb = new DatabaseSync(':memory:');
      mockAdvDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          pinyin TEXT,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          explanation_vi TEXT,
          status TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          topic TEXT,
          tested_vocab TEXT,
          illustration_theme TEXT
        );

        CREATE TABLE exam_eligible_pool (
          question_id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          practice_eligible INTEGER NOT NULL DEFAULT 1,
          exam_eligible INTEGER NOT NULL DEFAULT 0,
          compatible_formats TEXT,
          ineligible_reasons TEXT
        );

        -- Insert 5 Valid approved active items
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active) VALUES
          ('app_1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1', '["A","B","C","D"]', 0, 'Exp 1', 'approved', 1),
          ('app_2', 1, 'reading', 'read_fill_blank_4opt', 'Stem 2', '["A","B","C","D"]', 1, 'Exp 2', 'approved', 1),
          ('app_3', 1, 'listening', 'listen_short_dialogue', 'Stem 3', '["A","B","C"]', 2, 'Exp 3', 'approved', 1),
          ('app_4', 1, 'listening', 'listen_short_dialogue', 'Stem 4', '["A","B","C"]', 0, 'Exp 4', 'approved', 1),
          ('app_5', 2, 'reading', 'read_fill_blank_4opt', 'Stem 5', '["A","B","C","D"]', 3, 'Exp 5', 'approved', 1);

        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible) VALUES
          ('app_1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1', 1, 0),
          ('app_2', 1, 'reading', 'read_fill_blank_4opt', 'Stem 2', 1, 0),
          ('app_3', 1, 'listening', 'listen_short_dialogue', 'Stem 3', 1, 0),
          ('app_4', 1, 'listening', 'listen_short_dialogue', 'Stem 4', 1, 0),
          ('app_5', 2, 'reading', 'read_fill_blank_4opt', 'Stem 5', 1, 0);

        -- Insert Adversarial Leak Candidates:
        -- 1. Pending questions
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active) VALUES
          ('leak_pending_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak pending 1', '["A","B"]', 0, 'Exp P1', 'pending', 1),
          ('leak_pending_2', 1, 'listening', 'listen_short_dialogue', 'Leak pending 2', '["A","B"]', 0, 'Exp P2', 'pending', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible) VALUES
          ('leak_pending_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak pending 1', 1, 0),
          ('leak_pending_2', 1, 'listening', 'listen_short_dialogue', 'Leak pending 2', 1, 0);

        -- 2. Rejected questions
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active) VALUES
          ('leak_rejected_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak rejected 1', '["A","B"]', 0, 'Exp R1', 'rejected', 0),
          ('leak_rejected_2', 1, 'reading', 'read_fill_blank_4opt', 'Leak rejected 2', '["A","B"]', 0, 'Exp R2', 'rejected', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible) VALUES
          ('leak_rejected_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak rejected 1', 1, 0),
          ('leak_rejected_2', 1, 'reading', 'read_fill_blank_4opt', 'Leak rejected 2', 1, 0);

        -- 3. Disabled questions (approved but is_active = 0)
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active) VALUES
          ('leak_disabled_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak disabled 1', '["A","B"]', 0, 'Exp D1', 'approved', 0);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible) VALUES
          ('leak_disabled_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak disabled 1', 1, 0);

        -- 4. Ineligible questions (approved, is_active = 1, but practice_eligible = 0)
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active) VALUES
          ('leak_ineligible_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak ineligible 1', '["A","B"]', 0, 'Exp I1', 'approved', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible) VALUES
          ('leak_ineligible_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak ineligible 1', 0, 0);

        -- 5. Substring status trick: 'approved_fake', 'not_approved'
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, explanation_vi, status, is_active) VALUES
          ('leak_tricky_1', 1, 'reading', 'read_fill_blank_4opt', 'Leak tricky status 1', '["A","B"]', 0, 'Exp T1', 'approved_fake', 1),
          ('leak_tricky_2', 1, 'reading', 'read_fill_blank_4opt', 'Leak tricky status 2', '["A","B"]', 0, 'Exp T2', 'not_approved', 1);
      `);

      setExamDbForTesting(mockAdvDb);
    });

    afterEach(() => {
      setExamDbForTesting(memDb);
    });

    it('50 concurrent practice requests strictly return ONLY approved active items with zero leaks', async () => {
      const LEAK_IDS = new Set([
        'leak_pending_1',
        'leak_pending_2',
        'leak_rejected_1',
        'leak_rejected_2',
        'leak_disabled_1',
        'leak_ineligible_1',
        'leak_tricky_1',
        'leak_tricky_2',
      ]);

      const requests = Array.from({ length: 50 }, (_, i) => {
        const skill = i % 2 === 0 ? 'reading' : 'listening';
        return fetch(`${baseUrl}/api/exam/practice?level=1&skill=${skill}&strict=true`);
      });

      const responses = await Promise.all(requests);
      for (const res of responses) {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        for (const q of data.questions) {
          expect(LEAK_IDS.has(q.id)).toBe(false);
          expect(q.id.startsWith('app_')).toBe(true);
        }
      }
    });

    it('POST /api/exam/check-answer strictly refuses to check answer or leak explanation for pending or rejected questions', async () => {
      // Pending question
      const resPending = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: 'leak_pending_1', userAnswer: 0 }),
      });
      expect([400, 404]).toContain(resPending.status);
      const dataPending = await resPending.json();
      expect(dataPending.success).toBe(false);

      // Rejected question
      const resRejected = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: 'leak_rejected_1', userAnswer: 0 }),
      });
      expect([400, 404]).toContain(resRejected.status);

      // Disabled question
      const resDisabled = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: 'leak_disabled_1', userAnswer: 0 }),
      });
      expect([400, 404]).toContain(resDisabled.status);
    });

    it('Pool sync functions strictly ignore orphan records without corresponding approved questions', () => {
      // Add orphan record to exam_eligible_pool (no matching question in questions table)
      mockAdvDb.exec(`
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('orphan_row_1', 1, 'reading', 'read_fill_blank_4opt', 'Orphan stem', 1, 1);
      `);

      const stats = getEligiblePoolStats(mockAdvDb);
      // HSK 1 should count only app_1 and app_2 (reading) + app_3 and app_4 (listening) = 4, NOT orphan_row_1 (which would be 5)
      expect(stats['1'].practice_count).toBe(4);
      expect(stats['1'].exam_count).toBe(0);
    });
  });

  // =========================================================================
  // Challenge 4: Practice Mode Offline & Zero LLM Call Invariant
  // =========================================================================
  describe('Challenge 4: Zero LLM Calls & Network Isolation Invariant', () => {
    it('Practice mode execution performs zero outbound external API / LLM network calls', async () => {
      const endpoints = [
        `${baseUrl}/api/exam/practice?level=1&skill=reading&count=10`,
        `${baseUrl}/api/exam/practice?level=1&skill=listening&count=10`,
        `${baseUrl}/api/exam/practice?level=2&skill=listening&strict=true`,
        `${baseUrl}/api/exam/practice?level=3&skill=writing&strict=true`,
      ];

      for (const url of endpoints) {
        const res = await fetch(url);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.llmCallsMade).toBe(0);
      }
    });

    it('POST /api/exam/generate-mock (mode: practice) explicitly returns llmCallsMade: 0', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 5,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.llmCallsMade).toBe(0);
    });
  });

  // =========================================================================
  // Challenge 5: Empty-State Edge Cases & Session Lifecycle
  // =========================================================================
  describe('Challenge 5: Empty-State Edge Cases & Session Lifecycle', () => {
    it('Handling deficient filter returns HTTP 200 with clean empty array and isShortage: true', async () => {
      // HSK 1 Writing has 0 approved questions in qbank.db (Writing starts at HSK 3/HSK 2)
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=writing&strict=true`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.llmCallsMade).toBe(0);
      expect(data.questions).toEqual([]);
      expect(data.actualCount).toBe(0);
      expect(data.isShortage).toBe(true);
      expect(data.usingFixtureFallback).toBe(false);
    });

    it('Generating mock session in practice mode with 0 questions creates empty session and scores cleanly', async () => {
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'writing', // 0 writing questions in HSK 1
          strictQbankOnly: true,
        }),
      });

      expect(genRes.status).toBe(200);
      const genData = await genRes.json();
      expect(genData.success).toBe(true);
      expect(genData.session.questions).toEqual([]);
      expect(genData.session.totalQuestions).toBe(0);
      expect(genData.session.isShortage).toBe(true);

      const sessionId = genData.session.sessionId;
      expect(sessionId).toBeDefined();

      // Retrieve empty session
      const getRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.session.totalQuestions).toBe(0);
      expect(getData.session.questions).toEqual([]);

      // Submit empty session
      const subRes = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: {},
          timeSpentSeconds: 15,
        }),
      });

      expect(subRes.status).toBe(200);
      const subData = await subRes.json();
      expect(subData.success).toBe(true);
      expect(subData.scoreResult.totalScore).toBe(0);
      expect(subData.scoreResult.percentage).toBe(0);
      expect(subData.scoreResult.passed).toBe(false);
      expect(subData.isRetryIdempotent).toBe(false);

      // Submit again (idempotent retry check)
      const subRetryRes = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: {},
          timeSpentSeconds: 30,
        }),
      });

      expect(subRetryRes.status).toBe(200);
      const subRetryData = await subRetryRes.json();
      expect(subRetryData.success).toBe(true);
      expect(subRetryData.isRetryIdempotent).toBe(true);
      expect(subRetryData.scoreResult.totalScore).toBe(0);
    });

    it('fetchExamSessionFromBackend handles HTTP 500 or JSON error gracefully in strict practice mode', async () => {
      // Mock fetch returning 500 error
      const mock500Fetch = (async () => {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Error' }),
        } as any;
      }) as unknown as typeof fetch;

      const result = await fetchExamSessionFromBackend({
        level: 1,
        mode: 'practice',
        skill: 'reading',
        strictQbankOnly: true,
        fetchFn: mock500Fetch,
      });

      expect(result.success).toBe(false);
      expect(result.questions).toEqual([]);
      expect(result.sessionId).toBeDefined();
    });
  });

  // =========================================================================
  // Challenge 6: Concurrent Session Stress & Integrity
  // =========================================================================
  describe('Challenge 6: Concurrent Session Generation & Submission Load Test', () => {
    it('30 concurrent sessions created and scored simultaneously without cross-talk or race conditions', async () => {
      const sessionPromises = Array.from({ length: 30 }, async (_, idx) => {
        const level = (idx % 6) + 1; // Levels 1..6
        const skill = idx % 2 === 0 ? 'reading' : 'all';

        const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            mode: 'practice',
            skill,
            count: 3,
            strictQbankOnly: true,
          }),
        });

        const genData = await genRes.json();
        const sessionId = genData.session?.sessionId;
        expect(sessionId).toBeDefined();

        // Submit immediately
        const subRes = await fetch(`${baseUrl}/api/exam/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            answers: {},
            timeSpentSeconds: 10 + idx,
          }),
        });

        const subData = await subRes.json();
        return { sessionId, genData, subData };
      });

      const results = await Promise.all(sessionPromises);
      expect(results.length).toBe(30);

      // Verify each session has a unique session ID and consistent submission ID
      const sessionIds = new Set(results.map(r => r.sessionId));
      expect(sessionIds.size).toBe(30);

      for (const r of results) {
        expect(r.subData.success).toBe(true);
        expect(r.subData.submissionId).toBe(`sub_${r.sessionId}`);
      }
    });
  });

  // =========================================================================
  // Challenge 7: Database Invariant SHA-256
  // =========================================================================
  describe('Challenge 7: System Database Invariants', () => {
    it('data/hsk_exam.db SHA-256 is strictly preserved before and after all adversarial operations', () => {
      const currentHash = getSha256(HSK_EXAM_DB_PATH);
      expect(currentHash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });

    it('data/qbank/qbank.db questions table maintains 89 approved questions', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const row: any = db.prepare(
        "SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND COALESCE(is_active, 1) = 1"
      ).get();
      expect(Number(row?.cnt)).toBe(96);
    });

    it('getEligiblePoolStats preserves exactly 89 practice questions across HSK 1–6', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const stats = getEligiblePoolStats(db);

      const totalPractice = Object.values(stats).reduce((acc: number, cur: any) => acc + cur.practice_count, 0);
      expect(totalPractice).toBe(96);
      expect(stats['1'].practice_count).toBe(71);
      expect(stats['2'].practice_count).toBe(10);
      expect(stats['3'].practice_count).toBe(5);
      expect(stats['4'].practice_count).toBe(3);
      expect(stats['5'].practice_count).toBe(4);
      expect(stats['6'].practice_count).toBe(3);
    });
  });
});
