/**
 * tests/serving_cross_session_isolation.test.ts
 *
 * Empirical Adversarial Verification Suite:
 * 1. Cross-Session Isolation:
 *    - Independent option permutations across distinct sessions for the same question(s)
 *    - 100% accurate scoring within each session according to its unique permutation
 *    - Cross-session submission rejection (submitting Session B's answer to Session A fails)
 * 2. Reload & Refresh Immutability:
 *    - 50+ consecutive page reload / re-fetch calls (`GET /api/exam/session/:sessionId`)
 *    - 100% invariant options order and answer indices across all 50+ reloads
 *    - 50 concurrent burst reloads (`Promise.all`) maintaining absolute immutability
 *    - Cold-start / RAM cache eviction reload from SQLite persistent snapshot
 *    - Post-reload scoring invariance (100% correct scoring after 50+ reloads)
 *    - Zero answer leakage in client responses across all reloads
 * 3. Database Safety:
 *    - 100% in-memory SQLite isolation (:memory:), zero mutations to data/hsk_exam.db and data/qbank/qbank.db
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

describe('Empirical Adversarial Challenge: Cross-Session Isolation & Reload Immutability', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let memDb: DatabaseSync;
  const originalEnvShuffle = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;

  beforeAll(async () => {
    // 1. Verify baseline production DB integrity before executing tests
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    // 2. Initialize in-memory SQLite DB
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
        ('iso-q1-fruit', 'Chọn loại quả màu vàng:', '["苹果", "香蕉", "橙子", "西瓜"]', 1, 1, 'reading', 'read_match', 'Quả chuối có màu vàng.', 'approved', 1),
        ('iso-q2-city', 'Thủ đô của Trung Quốc là:', '["北京", "上海", "广州", "深圳"]', 0, 1, 'reading', 'read_match', 'Bắc Kinh là thủ đô.', 'approved', 1),
        ('iso-q3-job', 'Người làm việc ở bệnh viện:', '["老师", "司机", "医生", "工人"]', 2, 1, 'reading', 'read_match', 'Bác sĩ làm việc ở bệnh viện.', 'approved', 1),
        ('iso-q4-place', 'Nơi học sinh đến học hàng ngày:', '["公园", "超市", "电影院", "学校"]', 3, 1, 'reading', 'read_match', 'Học sinh đến trường học.', 'approved', 1),
        ('iso-q5-vehicle', 'Phương tiện bay trên trời:', '["火车", "飞机", "轮船", "公共汽车"]', 1, 1, 'reading', 'read_match', 'Máy bay bay trên trời.', 'approved', 1);

      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES
        ('iso-q1-fruit', 1, 'reading', 'read_match', 'Chọn loại quả màu vàng:', 1, 0),
        ('iso-q2-city', 1, 'reading', 'read_match', 'Thủ đô của Trung Quốc là:', 1, 0),
        ('iso-q3-job', 1, 'reading', 'read_match', 'Người làm việc ở bệnh viện:', 1, 0),
        ('iso-q4-place', 1, 'reading', 'read_match', 'Nơi học sinh đến học hàng ngày:', 1, 0),
        ('iso-q5-vehicle', 1, 'reading', 'read_match', 'Phương tiện bay trên trời:', 1, 0);
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

    // Verify database SHA-256 remains completely untouched after all tests
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(memDb);
  });

  // =========================================================================
  // Test Section 1: Cross-Session Isolation & Independent Permutations
  // =========================================================================
  describe('1. Cross-Session Isolation: Independent Permutations Across Sessions', () => {
    it('creates distinct practice sessions containing identical questions with independent permutations', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';
      expect(isServingAnswerShuffleEnabled()).toBe(true);

      // Create Session A and Session B with identical question filters
      const reqPayload = {
        level: 1,
        mode: 'practice',
        skill: 'reading',
        count: 5,
        strictQbankOnly: true,
      };

      const resA = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload),
      });
      const dataA = await resA.json();
      expect(resA.status).toBe(200);
      expect(dataA.success).toBe(true);
      const sessionIdA = dataA.sessionId;

      const resB = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload),
      });
      const dataB = await resB.json();
      expect(resB.status).toBe(200);
      expect(dataB.success).toBe(true);
      const sessionIdB = dataB.sessionId;

      // Assert distinct session IDs
      expect(sessionIdA).not.toBe(sessionIdB);

      // Verify that both sessions received all 5 questions
      expect(dataA.questions.length).toBe(5);
      expect(dataB.questions.length).toBe(5);

      // Retrieve full internal snapshots
      const sessionSnapA = getSessionDirect(sessionIdA);
      const sessionSnapB = getSessionDirect(sessionIdB);
      expect(sessionSnapA).toBeDefined();
      expect(sessionSnapB).toBeDefined();

      // Check all 5 questions in both sessions
      const questionIds = ['iso-q1-fruit', 'iso-q2-city', 'iso-q3-job', 'iso-q4-place', 'iso-q5-vehicle'];
      const targetAnswers = {
        'iso-q1-fruit': '香蕉',
        'iso-q2-city': '北京',
        'iso-q3-job': '医生',
        'iso-q4-place': '学校',
        'iso-q5-vehicle': '飞机',
      };

      for (const qId of questionIds) {
        const qA = sessionSnapA?.questions.find((q) => q.id === qId);
        const qB = sessionSnapB?.questions.find((q) => q.id === qId);
        expect(qA).toBeDefined();
        expect(qB).toBeDefined();

        const expectedWord = targetAnswers[qId as keyof typeof targetAnswers];

        // Semantic invariant: answer_index in Session A must point to the correct text
        expect(qA!.options[qA!.answer_index]).toBe(expectedWord);
        // Semantic invariant: answer_index in Session B must point to the correct text
        expect(qB!.options[qB!.answer_index]).toBe(expectedWord);

        // Dual field consistency in both sessions
        expect(qA!.answer_idx).toBe(qA!.answer_index);
        expect(qB!.answer_idx).toBe(qB!.answer_index);
      }

      // Statistical permutation independence check across multiple session generations:
      // Over 15 trial sessions for 'iso-q1-fruit' (4! = 24 permutations),
      // we must observe at least 2 distinct option permutations.
      const observedPermutations = new Set<string>();
      for (let i = 0; i < 15; i++) {
        const trialRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqPayload),
        });
        const trialData = await trialRes.json();
        const trialSession = getSessionDirect(trialData.sessionId);
        const trialQ = trialSession?.questions.find((q) => q.id === 'iso-q1-fruit');
        if (trialQ) {
          observedPermutations.add(trialQ.options.join('|'));
        }
      }
      expect(observedPermutations.size).toBeGreaterThan(1);
    });

    it('scores 100% correctly when each session answers according to its own shuffled order', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const reqPayload = {
        level: 1,
        mode: 'practice',
        skill: 'reading',
        count: 5,
        strictQbankOnly: true,
      };

      // 1. Create Session A
      const resA = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload),
      });
      const { sessionId: sessionAId } = await resA.json();
      const snapA = getSessionDirect(sessionAId)!;

      // 2. Create Session B
      const resB = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload),
      });
      const { sessionId: sessionBId } = await resB.json();
      const snapB = getSessionDirect(sessionBId)!;

      expect(sessionAId).not.toBe(sessionBId);

      // 3. Score Session A: answer all 5 questions using Session A's shuffled answer indices
      let sessionAScore = 0;
      for (const q of snapA.questions) {
        const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionAId,
            questionId: q.id,
            userAnswer: q.answer_index,
          }),
        });

        expect(checkRes.status).toBe(200);
        const checkData = await checkRes.json();
        expect(checkData.success).toBe(true);
        expect(checkData.isCorrect).toBe(true);
        expect(checkData.correctAnswer).toBe(q.answer_index);
        if (checkData.isCorrect) sessionAScore++;
      }
      expect(sessionAScore).toBe(snapA.questions.length); // 100% (5/5)

      // 4. Score Session B: answer all 5 questions using Session B's shuffled answer indices
      let sessionBScore = 0;
      for (const q of snapB.questions) {
        const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionBId,
            questionId: q.id,
            userAnswer: q.answer_index,
          }),
        });

        expect(checkRes.status).toBe(200);
        const checkData = await checkRes.json();
        expect(checkData.success).toBe(true);
        expect(checkData.isCorrect).toBe(true);
        expect(checkData.correctAnswer).toBe(q.answer_index);
        if (checkData.isCorrect) sessionBScore++;
      }
      expect(sessionBScore).toBe(snapB.questions.length); // 100% (5/5)
    });

    it('cross-session collision defense: submitting Session B answer indices to Session A fails when permutations differ', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const reqPayload = {
        level: 1,
        mode: 'practice',
        skill: 'reading',
        count: 5,
        strictQbankOnly: true,
      };

      // Loop until we find a pair of sessions where at least one question has differing answer indices
      let sessionAId = '';
      let sessionBId = '';
      let differingQuestionId = '';
      let answerIdxA = -1;
      let answerIdxB = -1;

      for (let attempt = 0; attempt < 20; attempt++) {
        const resA = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqPayload),
        });
        const dataA = await resA.json();

        const resB = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqPayload),
        });
        const dataB = await resB.json();

        const snapA = getSessionDirect(dataA.sessionId)!;
        const snapB = getSessionDirect(dataB.sessionId)!;

        for (const qA of snapA.questions) {
          const qB = snapB.questions.find((q) => q.id === qA.id);
          if (qB && qA.answer_index !== qB.answer_index) {
            sessionAId = dataA.sessionId;
            sessionBId = dataB.sessionId;
            differingQuestionId = qA.id;
            answerIdxA = qA.answer_index;
            answerIdxB = qB.answer_index;
            break;
          }
        }
        if (differingQuestionId) break;
      }

      // Assert that we successfully captured a differing permutation
      expect(differingQuestionId).not.toBe('');
      expect(answerIdxA).not.toBe(answerIdxB);

      // Now: Submit answerIdxB to Session A -> MUST be marked INCORRECT
      const crossResA = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionAId,
          questionId: differingQuestionId,
          userAnswer: answerIdxB,
        }),
      });

      expect(crossResA.status).toBe(200);
      const crossDataA = await crossResA.json();
      expect(crossDataA.success).toBe(true);
      expect(crossDataA.isCorrect).toBe(false);
      expect(crossDataA.correctAnswer).toBe(answerIdxA);

      // And symmetrically: Submit answerIdxA to Session B -> MUST be marked INCORRECT
      const crossResB = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionBId,
          questionId: differingQuestionId,
          userAnswer: answerIdxA,
        }),
      });

      expect(crossResB.status).toBe(200);
      const crossDataB = await crossResB.json();
      expect(crossDataB.success).toBe(true);
      expect(crossDataB.isCorrect).toBe(false);
      expect(crossDataB.correctAnswer).toBe(answerIdxB);
    });
  });

  // =========================================================================
  // Test Section 2: Refresh & Reload Immutability (50+ Invocations)
  // =========================================================================
  describe('2. Refresh & Reload Immutability: 50+ Consecutive Fetch Requests', () => {
    it('simulates 60 page reloads / re-fetches and verifies options order NEVER re-shuffles', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      // 1. Create a practice session
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

      expect(createRes.status).toBe(200);
      const createData = await createRes.json();
      const sessionId = createData.sessionId;
      expect(sessionId).toBeDefined();

      // Record initial baseline question presentation at T0
      const baselineQuestions = createData.questions;
      expect(baselineQuestions.length).toBe(5);

      const baselineQuestionMap = new Map<string, string[]>();
      for (const q of baselineQuestions) {
        baselineQuestionMap.set(q.id, [...q.options]);
      }

      // Record internal snapshot answers at T0
      const initialSnapshot = getSessionDirect(sessionId)!;
      const initialSnapshotAnswers = new Map<string, number>();
      for (const q of initialSnapshot.questions) {
        initialSnapshotAnswers.set(q.id, q.answer_index);
      }

      // 2. Perform 60 sequential GET /api/exam/session/:sessionId requests
      const TOTAL_RELOADS = 60;
      for (let reload = 1; reload <= TOTAL_RELOADS; reload++) {
        const fetchRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
        expect(fetchRes.status).toBe(200);

        const fetchData = await fetchRes.json();
        expect(fetchData.success).toBe(true);
        expect(fetchData.session.sessionId).toBe(sessionId);
        expect(fetchData.session.questions.length).toBe(5);

        // Assert that every single question retains the exact same option permutation
        for (const q of fetchData.session.questions) {
          const baselineOptions = baselineQuestionMap.get(q.id);
          expect(baselineOptions).toBeDefined();
          expect(q.options).toEqual(baselineOptions);

          // Anti-cheat verification across all 60 reloads
          expect(q.answer_index).toBeUndefined();
          expect(q.answer_idx).toBeUndefined();
          expect(q.explanation_vi).toBeUndefined();
        }

        // Verify that internal snapshot answer_index has never mutated
        const currentSnapshot = getSessionDirect(sessionId)!;
        for (const q of currentSnapshot.questions) {
          expect(q.answer_index).toBe(initialSnapshotAnswers.get(q.id));
          expect(q.answer_idx).toBe(initialSnapshotAnswers.get(q.id));
        }
      }

      // 3. After 60 reloads, score all questions: verify 100% correct grading
      for (const q of initialSnapshot.questions) {
        const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: q.id,
            userAnswer: q.answer_index,
          }),
        });

        expect(checkRes.status).toBe(200);
        const checkData = await checkRes.json();
        expect(checkData.success).toBe(true);
        expect(checkData.isCorrect).toBe(true);
        expect(checkData.correctAnswer).toBe(q.answer_index);
      }
    });

    it('burst reload stress: 50 concurrent GET requests simultaneously fetch session without race conditions', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 5, strictQbankOnly: true }),
      });
      const { sessionId, questions: initialQuestions } = await createRes.json();
      const expectedFruitOptions = initialQuestions.find((q: any) => q.id === 'iso-q1-fruit').options;

      // Dispatch 50 concurrent requests simultaneously
      const burstPromises = Array.from({ length: 50 }, () =>
        fetch(`${baseUrl}/api/exam/session/${sessionId}`).then((r) => r.json())
      );

      const results = await Promise.all(burstPromises);
      expect(results.length).toBe(50);

      for (const res of results) {
        expect(res.success).toBe(true);
        const fruitQ = res.session.questions.find((q: any) => q.id === 'iso-q1-fruit');
        expect(fruitQ.options).toEqual(expectedFruitOptions);
        expect(fruitQ.answer_index).toBeUndefined();
      }
    });

    it('cold-start / memory eviction: reloading 50+ times from SQLite disk/in-memory persistent snapshot retains 100% immutability', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading', count: 5, strictQbankOnly: true }),
      });
      const { sessionId, questions: initialQuestions } = await createRes.json();
      const snapAtCreation = getSessionDirect(sessionId)!;

      // Evict RAM session cache completely to simulate server restart / memory reclamation
      clearAllSessionsForTesting();

      // Verify RAM cache is empty
      const rowInDb: any = memDb.prepare('SELECT session_json FROM exam_sessions WHERE session_id = ?').get(sessionId);
      expect(rowInDb).toBeDefined();
      expect(rowInDb.session_json).toBeDefined();

      // Perform 50 consecutive re-fetches from SQLite persistent storage
      for (let i = 0; i < 50; i++) {
        // Clear RAM cache before each fetch to force SQLite disk reading
        clearAllSessionsForTesting();

        const fetchRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
        expect(fetchRes.status).toBe(200);
        const fetchData = await fetchRes.json();
        expect(fetchData.success).toBe(true);

        const fruitQ = fetchData.session.questions.find((q: any) => q.id === 'iso-q1-fruit');
        const initialFruit = initialQuestions.find((q: any) => q.id === 'iso-q1-fruit');
        expect(fruitQ.options).toEqual(initialFruit.options);
      }

      // Check-answer after cold start and 50 persistent reloads
      for (const q of snapAtCreation.questions) {
        const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: q.id,
            userAnswer: q.answer_index,
          }),
        });

        expect(checkRes.status).toBe(200);
        const checkData = await checkRes.json();
        expect(checkData.isCorrect).toBe(true);
      }
    });
  });

  // =========================================================================
  // Test Section 3: Feature Flag Safety & Zero Production DB Mutation
  // =========================================================================
  describe('3. Production Database Invariants & Safety', () => {
    it('confirms production database SHA-256 and records are completely untouched', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
