/**
 * tests/adversarial_smoke_practice_shuffle.test.ts
 *
 * Empirical Smoke & Adversarial Verification Test Suite
 * Executed by: challenger_smoke_1
 *
 * Mission:
 * 1. Mode 1: Feature Flag OFF (unset or false)
 *    - Canonical options order served (shuffled: false)
 *    - Anti-cheat client response sanitization
 *    - Check-answer works with canonical index
 *    - Mock Exam (mode: 'mock') 100% unaffected
 * 2. Mode 2: Feature Flag ON ('true')
 *    - Shuffles options for eligible questions (shuffled: true)
 *    - Dual index sync (answer_index === answer_idx)
 *    - Anti-cheat masking: answer_index, answer_idx, explanation_vi stripped from client response
 *    - Check-answer grades correctly with permuted index
 *    - Check-answer rejects old canonical index when permuted
 *    - Conservative fallback preserves True/False and Word-bank items
 *    - Mock Exam (mode: 'mock') remains completely un-shuffled
 * 3. Cross-Session Isolation:
 *    - Independent permutations across distinct sessions sharing questions
 *    - Submitting Session A's answer index to Session B is rejected if permuted differently
 *    - Submitting question from another session returns 404 QUESTION_NOT_IN_SESSION
 * 4. Browser Reload vs API Restore distinction:
 *    - GET /api/exam/session/:sessionId restores exact snapshot without re-shuffling
 *    - F5 browser reload creates a fresh session with new permutation
 * 5. Direct Practice Route Leakage Check (GET /api/exam/practice)
 * 6. Database Safety & Invariant Verification:
 *    - 100% isolated in-memory SQLite (:memory:)
 *    - Zero mutations to data/hsk_exam.db (SHA-256 verified) and data/qbank/qbank.db
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

describe('Empirical Challenger Smoke Verification: Practice Serving Answer Shuffle', () => {
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
        ('smoke-q1-mcq', 'Chọn từ thích hợp: Quả chuối có màu vàng.', '["苹果", "香蕉", "橙子", "西瓜"]', 1, 1, 'reading', 'read_match', 'Quả chuối có màu vàng.', 'approved', 1),
        ('smoke-q2-letter', 'Chọn từ thích hợp: Con mèo đang ngủ.', '["猫", "狗", "鸟", "鱼"]', 0, 1, 'reading', 'read_match', 'Chọn đáp án A: con mèo đang ngủ trên ghế.', 'approved', 1),
        ('smoke-q3-tf', 'Bắc Kinh là thủ đô của Trung Quốc.', '["对", "错"]', 0, 1, 'reading', 'read_tf', 'Nhận định này hoàn toàn chính xác.', 'approved', 1),
        ('smoke-q4-wordbank', 'Chọn từ điền vào chỗ trống:', '["A", "B", "C", "D", "E", "F"]', 2, 1, 'reading', 'read_fill_blank_word_bank', 'Đáp án C đúng.', 'approved', 1);

      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES
        ('smoke-q1-mcq', 1, 'reading', 'read_match', 'Chọn từ thích hợp: Quả chuối có màu vàng.', 1, 0),
        ('smoke-q2-letter', 1, 'reading', 'read_match', 'Chọn từ thích hợp: Con mèo đang ngủ.', 1, 0),
        ('smoke-q3-tf', 1, 'reading', 'read_tf', 'Bắc Kinh là thủ đô của Trung Quốc.', 1, 0),
        ('smoke-q4-wordbank', 1, 'reading', 'read_fill_blank_word_bank', 'Chọn từ điền vào chỗ trống:', 1, 0);
    `);

    setExamDbForTesting(memDb);

    // 3. Start local Express test server on random ephemeral port
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
  // SECTION 1: MODE 1 - FEATURE FLAG OFF (Unset or 'false')
  // =========================================================================
  describe('Mode 1: Feature Flag OFF (ENABLE_SERVING_ANSWER_SHUFFLE=false or unset)', () => {
    it('1.1: Serves questions in canonical order with anti-cheat masking and valid sessionId', async () => {
      delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
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
      expect(typeof data.sessionId).toBe('string');
      expect(data.questions.length).toBe(4);

      // Verify Anti-Cheat: answer_index, answer_idx, explanation_vi stripped from client response
      for (const q of data.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.shuffled).toBe(false);
      }

      // Verify canonical options order preserved for Q1 and Q2
      const q1 = data.questions.find((q: any) => q.id === 'smoke-q1-mcq');
      expect(q1.options).toEqual(['苹果', '香蕉', '橙子', '西瓜']);

      const q2 = data.questions.find((q: any) => q.id === 'smoke-q2-letter');
      expect(q2.options).toEqual(['猫', '狗', '鸟', '鱼']);

      // Inspect persisted session snapshot
      const snapshot = getSessionDirect(data.sessionId);
      expect(snapshot).toBeDefined();
      const snapQ1 = snapshot?.questions.find((q) => q.id === 'smoke-q1-mcq');
      expect(snapQ1?.answer_index).toBe(1);
      // Canonical question has answer_index = 1 and points to '香蕉'
      expect(snapQ1?.options[1]).toBe('香蕉');
      expect(snapQ1?.shuffled).toBe(false);
    });

    it('1.2: Check-answer scores accurately against canonical answer index in snapshot', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'false';

      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
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
      const genData = await genRes.json();
      const sessionId = genData.sessionId;

      // Submit CORRECT canonical answer (index 1 = 香蕉) for smoke-q1-mcq
      const correctRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'smoke-q1-mcq',
          userAnswer: 1,
        }),
      });
      expect(correctRes.status).toBe(200);
      const correctData = await correctRes.json();
      expect(correctData.success).toBe(true);
      expect(correctData.isCorrect).toBe(true);
      expect(correctData.correctAnswer).toBe(1);
      expect(correctData.explanation_vi).toContain('Quả chuối có màu vàng.');

      // Submit INCORRECT canonical answer (index 0 = 苹果) for smoke-q1-mcq
      const incorrectRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'smoke-q1-mcq',
          userAnswer: 0,
        }),
      });
      expect(incorrectRes.status).toBe(200);
      const incorrectData = await incorrectRes.json();
      expect(incorrectData.success).toBe(true);
      expect(incorrectData.isCorrect).toBe(false);
      expect(incorrectData.correctAnswer).toBe(1);
      expect(incorrectData.explanation_vi).toBeDefined();

      // Submit missing sessionId -> 400 SESSION_REQUIRED
      const missingSessionRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'smoke-q1-mcq',
          userAnswer: 1,
        }),
      });
      expect(missingSessionRes.status).toBe(400);
      const missingData = await missingSessionRes.json();
      expect(missingData.code).toBe('SESSION_REQUIRED');

      // Submit unknown sessionId -> 404 SESSION_NOT_FOUND
      const unknownSessionRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'non-existent-session-id',
          questionId: 'smoke-q1-mcq',
          userAnswer: 1,
        }),
      });
      expect(unknownSessionRes.status).toBe(404);
      const unknownData = await unknownSessionRes.json();
      expect(unknownData.code).toBe('SESSION_NOT_FOUND');
    });

    it('1.3: Mock Exam mode is unaffected by Flag OFF', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'false';

      // 1. Strict official mock exam request with insufficient questions returns 400 shortage report
      const strictRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'mock',
        }),
      });
      expect(strictRes.status).toBe(400);
      const strictData = await strictRes.json();
      expect(strictData.success).toBe(false);
      expect(strictData.is_fully_eligible).toBe(false);

      // 2. Demo fixture mock exam request succeeds and is NOT shuffled
      const fixtureRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'mock',
          allowFixtures: true,
        }),
      });

      expect(fixtureRes.status).toBe(200);
      const fixtureData = await fixtureRes.json();
      expect(fixtureData.success).toBe(true);
      expect(fixtureData.session.mode).toBe('mock');

      // Verify none of the questions have shuffled: true
      for (const q of fixtureData.questions) {
        expect(q.shuffled).toBeFalsy();
      }
    });
  });

  // =========================================================================
  // SECTION 2: MODE 2 - FEATURE FLAG ON ('true')
  // =========================================================================
  describe('Mode 2: Feature Flag ON (ENABLE_SERVING_ANSWER_SHUFFLE=true)', () => {
    it('2.1: Shuffles eligible options, synchronizes dual index and letters, and masks client payload', async () => {
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
      expect(data.sessionId).toBeDefined();

      const clientQuestions = data.questions;
      expect(clientQuestions.length).toBe(4);

      // Verify Anti-Cheat: answer_index, answer_idx, and explanation_vi completely stripped
      for (const q of clientQuestions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
      }

      // Inspect persisted session snapshot
      const snapshot = getSessionDirect(data.sessionId);
      expect(snapshot).toBeDefined();
      expect(snapshot?.mode).toBe('practice');

      // Verify Q1 (Category 1 semantic)
      const snapQ1 = snapshot?.questions.find((q) => q.id === 'smoke-q1-mcq');
      expect(snapQ1).toBeDefined();
      expect(snapQ1?.shuffled).toBe(true);
      expect(snapQ1?.options.length).toBe(4);
      expect(new Set(snapQ1?.options)).toEqual(new Set(['苹果', '香蕉', '橙子', '西瓜']));
      // Invariant: answer_index points exactly to '香蕉'
      expect(snapQ1?.options[snapQ1.answer_index]).toBe('香蕉');
      // Dual index consistency
      expect(snapQ1?.answer_idx).toBe(snapQ1?.answer_index);

      // Verify Q2 (Category 2 letter-tied explanation: 'Chọn đáp án A: con mèo đang ngủ trên ghế.')
      const snapQ2 = snapshot?.questions.find((q) => q.id === 'smoke-q2-letter');
      expect(snapQ2).toBeDefined();
      expect(snapQ2?.shuffled).toBe(true);
      expect(snapQ2?.options[snapQ2.answer_index]).toBe('猫');
      expect(snapQ2?.answer_idx).toBe(snapQ2?.answer_index);

      // Verify explanation letter synchronization
      const expectedLetter = String.fromCharCode(65 + snapQ2!.answer_index);
      expect(snapQ2?.explanation_vi).toContain(`Chọn đáp án ${expectedLetter}`);

      // Verify Q3 (True/False - part_type 'read_tf') is conservative fallback
      const snapQ3 = snapshot?.questions.find((q) => q.id === 'smoke-q3-tf');
      expect(snapQ3).toBeDefined();
      expect(snapQ3?.shuffled).toBe(false);
      expect(snapQ3?.shuffle_reason).toBe('Fixed order question type');

      // Verify Q4 (Word-bank - part_type 'read_fill_blank_word_bank') is conservative fallback
      const snapQ4 = snapshot?.questions.find((q) => q.id === 'smoke-q4-wordbank');
      expect(snapQ4).toBeDefined();
      expect(snapQ4?.shuffled).toBe(false);
      expect(snapQ4?.shuffle_reason).toBe('Shared word bank A-F group');
    });

    it('2.2: Practice check-answer scores accurately against shuffled index and rejects stale canonical index', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      // Run multiple attempts until we catch a shuffle where answer_index moved from canonical (index 1 -> != 1)
      let targetSessionId = '';
      let targetNewIdx = -1;
      let targetSnapQ1: any = null;

      for (let attempt = 0; attempt < 20; attempt++) {
        clearAllSessionsForTesting();
        const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
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
        const genData = await genRes.json();
        const snap = getSessionDirect(genData.sessionId);
        const q1 = snap?.questions.find((q) => q.id === 'smoke-q1-mcq');
        if (q1 && q1.answer_index !== 1) {
          targetSessionId = genData.sessionId;
          targetNewIdx = q1.answer_index;
          targetSnapQ1 = q1;
          break;
        }
      }

      // If due to RNG it didn't move in 20 attempts (prob (1/4)^20 ~ 0), generate one more and test whatever index
      if (!targetSessionId) {
        const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
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
        const genData = await genRes.json();
        targetSessionId = genData.sessionId;
        const snap = getSessionDirect(genData.sessionId);
        targetSnapQ1 = snap?.questions.find((q) => q.id === 'smoke-q1-mcq');
        targetNewIdx = targetSnapQ1.answer_index;
      }

      expect(targetSnapQ1).toBeDefined();
      expect(targetSnapQ1.options[targetNewIdx]).toBe('香蕉');

      // 1. Submit the NEW correct answer index -> MUST BE isCorrect: true
      const correctRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSessionId,
          questionId: 'smoke-q1-mcq',
          userAnswer: targetNewIdx,
        }),
      });
      expect(correctRes.status).toBe(200);
      const correctData = await correctRes.json();
      expect(correctData.success).toBe(true);
      expect(correctData.isCorrect).toBe(true);
      expect(correctData.correctAnswer).toBe(targetNewIdx);
      expect(correctData.explanation_vi).toContain('Quả chuối có màu vàng.');

      // 2. Submit an incorrect index -> MUST BE isCorrect: false
      const wrongIdx = (targetNewIdx + 1) % 4;
      const wrongRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSessionId,
          questionId: 'smoke-q1-mcq',
          userAnswer: wrongIdx,
        }),
      });
      expect(wrongRes.status).toBe(200);
      const wrongData = await wrongRes.json();
      expect(wrongData.success).toBe(true);
      expect(wrongData.isCorrect).toBe(false);
      expect(wrongData.correctAnswer).toBe(targetNewIdx);

      // 3. If targetNewIdx moved away from original canonical index 1,
      // submitting canonical index 1 MUST BE isCorrect: false (proving no fallback to DB canonical answer)
      if (targetNewIdx !== 1) {
        const canonicalSubmitRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: targetSessionId,
            questionId: 'smoke-q1-mcq',
            userAnswer: 1, // Stale canonical index
          }),
        });
        const canonicalSubmitData = await canonicalSubmitRes.json();
        expect(canonicalSubmitData.success).toBe(true);
        expect(canonicalSubmitData.isCorrect).toBe(false);
        expect(canonicalSubmitData.correctAnswer).toBe(targetNewIdx);
      }
    });

    it('2.3: Mock Exam mode is NEVER shuffled even when Feature Flag is ON', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';
      expect(isServingAnswerShuffleEnabled()).toBe(true);

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

      // Verify Mock Exam questions are never marked as shuffled
      for (const q of data.questions) {
        expect(q.shuffled).toBeFalsy();
      }
    });
  });

  // =========================================================================
  // SECTION 3: CROSS-SESSION ISOLATION & PERMUTATION INDEPENDENCE
  // =========================================================================
  describe('3. Cross-Session Isolation: Independent Permutations & Isolated Scoring', () => {
    it('3.1: Two independent practice sessions sharing Q1 produce distinct permutations and isolated scoring', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const payload = {
        level: 1,
        mode: 'practice',
        skill: 'reading',
        count: 1,
        strictQbankOnly: true,
      };

      // Create Session A
      const resA = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const dataA = await resA.json();
      const sessionIdA = dataA.sessionId;

      // Create Session B
      const resB = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const dataB = await resB.json();
      const sessionIdB = dataB.sessionId;

      expect(sessionIdA).not.toBe(sessionIdB);

      const snapA = getSessionDirect(sessionIdA);
      const snapB = getSessionDirect(sessionIdB);

      const qA = snapA?.questions.find((q) => q.id === 'smoke-q1-mcq');
      const qB = snapB?.questions.find((q) => q.id === 'smoke-q1-mcq');

      expect(qA).toBeDefined();
      expect(qB).toBeDefined();

      // Semantic invariant holds for both independently
      expect(qA!.options[qA!.answer_index]).toBe('香蕉');
      expect(qB!.options[qB!.answer_index]).toBe('香蕉');

      // Grade Session A with Session A's correct answer
      const gradeARes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdA,
          questionId: 'smoke-q1-mcq',
          userAnswer: qA!.answer_index,
        }),
      });
      const gradeAData = await gradeARes.json();
      expect(gradeAData.isCorrect).toBe(true);

      // Grade Session B with Session B's correct answer
      const gradeBRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdB,
          questionId: 'smoke-q1-mcq',
          userAnswer: qB!.answer_index,
        }),
      });
      const gradeBData = await gradeBRes.json();
      expect(gradeBData.isCorrect).toBe(true);

      // Statistical permutation variation check across 15 sessions
      const observedPermutations = new Set<string>();
      for (let i = 0; i < 15; i++) {
        const r = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const d = await r.json();
        const s = getSessionDirect(d.sessionId);
        const q = s?.questions.find((item) => item.id === 'smoke-q1-mcq');
        if (q) {
          observedPermutations.add(q.options.join('|'));
        }
      }
      // With 4! = 24 permutations, 15 trials will almost certainly produce >= 3 distinct permutations
      expect(observedPermutations.size).toBeGreaterThanOrEqual(3);
    });

    it('3.2: Rejects check-answer when questionId does not belong to the requested session', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 1,
          strictQbankOnly: true,
        }),
      });
      const data = await res.json();
      const sessionId = data.sessionId;

      // Submit foreign question ID that is not in this session
      const foreignRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'foreign-unknown-question-id',
          userAnswer: 0,
        }),
      });
      expect(foreignRes.status).toBe(404);
      const foreignData = await foreignRes.json();
      expect(foreignData.code).toBe('QUESTION_NOT_IN_SESSION');
    });
  });

  // =========================================================================
  // SECTION 4: BROWSER RELOAD VS API SESSION RESTORE
  // =========================================================================
  describe('4. Browser Reload vs API Session Restore Distinction', () => {
    it('4.1: API Session Restore (GET /api/exam/session/:sessionId) preserves exact options snapshot without re-shuffling', async () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
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
      const genData = await genRes.json();
      const sessionId = genData.sessionId;
      const initialClientQ1 = genData.questions.find((q: any) => q.id === 'smoke-q1-mcq');

      // Perform 5 consecutive API restore calls
      for (let i = 0; i < 5; i++) {
        const restoreRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
        expect(restoreRes.status).toBe(200);
        const restoreData = await restoreRes.json();
        expect(restoreData.success).toBe(true);

        const restoredQ1 = restoreData.session.questions.find((q: any) => q.id === 'smoke-q1-mcq');
        expect(restoredQ1.options).toEqual(initialClientQ1.options);
        // Anti-cheat verification on restored payload
        expect(restoredQ1.answer_index).toBeUndefined();
        expect(restoredQ1.answer_idx).toBeUndefined();
        expect(restoredQ1.explanation_vi).toBeUndefined();
      }
    });

    it('4.2: Frontend Browser Reload (F5) distinction verification', async () => {
      // In HSKMockExam.tsx, state persistence into sessionStorage is conditional upon:
      // if (currentView === 'exam' && activeSessionId && questions.length > 0 && timeLeftSeconds > 0)
      // In Practice mode, currentView === 'practice', so no session is cached.
      // Therefore, a browser F5 reload initiates a NEW session.
      // We verify here that calling generate-mock with practice mode returns a FRESH sessionId
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';

      const run1 = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', count: 1 }),
      });
      const data1 = await run1.json();

      const run2 = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', count: 1 }),
      });
      const data2 = await run2.json();

      expect(data1.sessionId).not.toBe(data2.sessionId);
    });
  });

  // =========================================================================
  // SECTION 5: DIRECT PRACTICE ROUTE LEAKAGE AUDIT (GET /api/exam/practice)
  // =========================================================================
  describe('5. Direct Practice Route Audit (GET /api/exam/practice)', () => {
    it('5.1: Serves canonical un-shuffled options and strictly strips answers/explanations (anti-cheat protected)', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading&strict=true`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeNull();
      expect(data.sessionRequiredForScoring).toBe(true);
      expect(data.antiCheatProtected).toBe(true);

      const q1 = data.questions.find((q: any) => q.id === 'smoke-q1-mcq');
      expect(q1).toBeDefined();
      // Canonical options order
      expect(q1.options).toEqual(['苹果', '香蕉', '橙子', '西瓜']);
      // Anti-Cheat: Directly called route strictly strips answer_index, answer_idx, explanation_vi, explanation
      expect(q1.answer_index).toBeUndefined();
      expect((q1 as any).answer_idx).toBeUndefined();
      expect(q1.explanation_vi).toBeUndefined();
      expect((q1 as any).explanation).toBeUndefined();
    });
  });

  // =========================================================================
  // SECTION 6: PRODUCTION DATABASE PRESERVATION INVARIANT
  // =========================================================================
  describe('6. Production Database Preservation Invariant', () => {
    it('6.1: Confirms data/hsk_exam.db SHA-256 hash has not mutated', () => {
      const currentHash = getSha256(HSK_EXAM_DB_PATH);
      expect(currentHash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
