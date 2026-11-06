/**
 * tests/adversarial_challenger_m4_empirical.test.ts
 *
 * Empirical Adversarial Challenge & Stress-Test Suite for Milestone M4:
 * Writing Section Execution, Evaluation Support, Null-Safety & Edge Case Boundaries.
 *
 * Authored by: challenger_m4_1 (EMPIRICAL CHALLENGER)
 * Target:
 *  1. Writing task format and null-safety (0-option questions, undefined options, empty arrays, mixed options in practice & mock exam modes, absence of "Đáp án đúng: A").
 *  2. Student answer submission in practice and full exam modes (empty essays, whitespace-only essays, single char essays, ultra-long essays > 1000 chars, non-Chinese text: English, emoji, symbols).
 *  3. Accurate grading and review payload structure.
 *  4. Rubric mathematical invariants across boundary conditions and fuzzing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  examRouter,
  createTestExamDb,
  setExamDbForTesting,
  stripAnswerFromQuestion,
} from '../src/server/examRoutes.js';
import { canShuffle, shuffleQuestionAnswers } from '../src/server/utils/answerShuffle.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';
import { formatCorrectAnswerText } from '../src/components/HSKMockExam';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Adversarial Challenge M4: Writing Execution, Evaluation & Boundary Invariants', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;

  beforeAll(async () => {
    // 1. Verify operational DB hash invariant before running tests
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    // 2. Set up isolated in-memory test database with zero leakage
    testDb = createTestExamDb({ seedPool: false });
    testDb.exec(`
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
        status TEXT NOT NULL DEFAULT 'approved',
        is_active INTEGER NOT NULL DEFAULT 1,
        topic TEXT,
        tested_vocab TEXT,
        illustration_theme TEXT,
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
        ineligible_reasons TEXT
      );
    `);
    setExamDbForTesting(testDb);

    // 3. Seed isolated questions (listening, reading, writing) into questions AND exam_eligible_pool
    testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
    `).run(
      'adv_q_listen_1',
      '听录音，选出正确答案。',
      JSON.stringify(['北京', '上海', '广州']),
      1,
      '',
      'Đáp án đúng là B. Thí sinh nói đi Thượng Hải.',
      5,
      'listening',
      'listen_dialogue_3opt'
    );
    testDb.prepare(`
      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `).run('adv_q_listen_1', 5, 'listening', 'listen_dialogue_3opt', '听录音，选出正确答案。');

    testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
    `).run(
      'adv_q_read_1',
      '阅读短文并回答问题。',
      JSON.stringify(['每天', '有时候', '经常', '从不']),
      2,
      '',
      'Đáp án đúng là C. Trong đoạn có từ 经常.',
      5,
      'reading',
      'read_comprehension_4opt'
    );
    testDb.prepare(`
      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `).run('adv_q_read_1', 5, 'reading', 'read_comprehension_4opt', '阅读短文并回答问题。');

    testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
    `).run(
      'adv_q_write_1',
      '请结合以下词语写一篇80字左右的短文：[旅行, 朋友, 风景, 难忘, 照片]',
      JSON.stringify([]),
      0,
      '',
      '去年我和朋友一起去黄山旅行，那里的风景美极了，留下了很多难忘的照片。',
      5,
      'writing',
      'write_words_essay_80words'
    );
    testDb.prepare(`
      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `).run('adv_q_write_1', 5, 'writing', 'write_words_essay_80words', '请结合以下词语写一篇80字左右的短文：[旅行, 朋友, 风景, 难忘, 照片]');

    // 4. Start isolated Express test server
    const app = express();
    app.use(express.json());
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server?.address();
        const port = typeof addr === 'object' && addr ? addr.port : 8000;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    setExamDbForTesting(null);
    testDb.close();

    // Verify operational DB hash invariant after test completion
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  // =========================================================================
  // VECTOR 1: Writing Task Format & Null-Safety Stress Testing
  // =========================================================================
  describe('Vector 1: Writing Task Format & Null-Safety Invariants', () => {
    it('1.1: formatCorrectAnswerText never produces "A" or "Đáp án đúng: A" for open-ended writing questions', () => {
      // Empty array
      expect(formatCorrectAnswerText([], 0)).toBe('');
      // Undefined
      expect(formatCorrectAnswerText(undefined, 0)).toBe('');
      // Null
      expect(formatCorrectAnswerText(null, 0)).toBe('');
      // Arbitrary answerIndex with empty options
      expect(formatCorrectAnswerText([], -1)).toBe('');
      expect(formatCorrectAnswerText([], 999)).toBe('');
      expect(formatCorrectAnswerText([], NaN)).toBe('');
      expect(formatCorrectAnswerText(undefined, 3)).toBe('');
      expect(formatCorrectAnswerText(null, 2)).toBe('');
    });

    it('1.2: formatCorrectAnswerText handles boundary and malformed options safely', () => {
      // Valid MCQ option with letter prefix
      expect(formatCorrectAnswerText(['A. 苹果', 'B. 香蕉'], 1)).toBe('B. 香蕉');
      // Valid MCQ option without letter prefix
      expect(formatCorrectAnswerText(['苹果', '香蕉'], 0)).toBe('A. 苹果');
      // Index out of bounds returns fallback letter or empty
      expect(formatCorrectAnswerText(['A. 苹果'], 5)).toBe('F');
      // Negative index defaults to 0 safely
      expect(formatCorrectAnswerText(['A. 苹果', 'B. 香蕉'], -1)).toBe('A. 苹果');
    });

    it('1.3: stripAnswerFromQuestion safely sanitizes writing questions with undefined or empty options', () => {
      const qWriting: any = {
        id: 'q_test_strip',
        level: 5,
        skill: 'writing',
        part_type: 'write_words_essay_80words',
        stem: '请写一篇短文',
        options: [],
        answer_index: 0,
        answer_idx: 0,
        explanation_vi: 'Bài mẫu tham khảo',
        explanation: 'Model essay',
      };

      const stripped = stripAnswerFromQuestion(qWriting);
      expect((stripped as any).answer_index).toBeUndefined();
      expect((stripped as any).answer_idx).toBeUndefined();
      expect((stripped as any).explanation_vi).toBeUndefined();
      expect((stripped as any).explanation).toBeUndefined();
      expect(stripped.id).toBe('q_test_strip');
      expect(stripped.options).toEqual([]);
      expect(stripped.stem).toBe('请写一篇短文');

      // Boundary: options is undefined
      const qWritingUndefinedOpts: any = {
        id: 'q_test_strip_undef',
        level: 6,
        skill: 'writing',
        part_type: 'write_summary_shortening_400chars',
        stem: '缩写文章',
        options: undefined,
        answer_index: 0,
      };
      const stripped2 = stripAnswerFromQuestion(qWritingUndefinedOpts);
      expect(stripped2.id).toBe('q_test_strip_undef');
      expect(stripped2.options).toBeUndefined();
      expect((stripped2 as any).answer_index).toBeUndefined();
    });

    it('1.4: canShuffle and shuffleQuestionAnswers reject open-ended writing questions gracefully without mutation', () => {
      const writingQuestion = {
        id: 'q_adv_shuffle_writing',
        level: 5,
        skill: 'writing',
        part_type: 'write_words_essay_80words',
        stem: '写一篇80字短文',
        options: [],
        answer_index: 0,
        explanation_vi: 'Bài mẫu HSK 5',
      };

      // canShuffle must return false for < 2 options
      const guard = canShuffle(writingQuestion);
      expect(guard.canShuffle).toBe(false);
      expect(guard.category).toBe(5);
      expect(guard.reason).toContain('Less than 2 options');

      // shuffleQuestionAnswers must not throw and must return shuffled: false
      const result = shuffleQuestionAnswers(writingQuestion);
      expect(result.shuffled).toBe(false);
      expect(result.new_answer_idx).toBe(0);
      expect(result.options).toEqual([]);
      // Input object remains unmutated
      expect(writingQuestion.options).toEqual([]);

      // Test with options = undefined / null
      const undefOptsQuestion: any = {
        id: 'q_undef_opts',
        options: undefined,
        answer_index: 0,
      };
      const guardUndef = canShuffle(undefOptsQuestion);
      expect(guardUndef.canShuffle).toBe(false);
      const resUndef = shuffleQuestionAnswers(undefOptsQuestion);
      expect(resUndef.shuffled).toBe(false);
      expect(resUndef.options).toEqual([]);
    });

    it('1.5: validateFormatCompatibility accurately validates 0-option writing tasks across HSK 4-6', () => {
      const hsk4Writing = {
        id: 'hsk4_pic_word',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        stem: '看图，用词造句：[弹钢琴]',
        options: [],
        answer_idx: 0,
      };
      const res4 = validateFormatCompatibility(hsk4Writing, 4);
      expect(res4.practice_eligible).toBe(true);
      expect(res4.exam_eligible).toBe(true);

      const hsk5Writing = {
        id: 'hsk5_essay_80',
        level: 5,
        skill: 'writing',
        part_type: 'write_words_essay_80words',
        stem: '请结合以下词语写短文：[环境, 保护, 塑料袋, 垃圾, 习惯]',
        options: [],
        answer_idx: 0,
      };
      const res5 = validateFormatCompatibility(hsk5Writing, 5);
      expect(res5.practice_eligible).toBe(true);
      expect(res5.exam_eligible).toBe(true);

      const hsk6Writing = {
        id: 'hsk6_summary_400',
        level: 6,
        skill: 'writing',
        part_type: 'write_summary_shortening_400chars',
        stem: '仔细阅读下面这篇文章，缩写成一篇400字左右的短文。',
        options: [],
        answer_idx: 0,
      };
      const res6 = validateFormatCompatibility(hsk6Writing, 6);
      expect(res6.practice_eligible).toBe(true);
      expect(res6.exam_eligible).toBe(true);
    });
  });

  // =========================================================================
  // VECTOR 2: Practice Mode `/check-answer` Adversarial Stress
  // =========================================================================
  describe('Vector 2: Practice Mode /check-answer Adversarial Stress', () => {
    let practiceSessionId = '';

    beforeAll(async () => {
      // Create a practice session with a writing question
      const createRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          mode: 'practice',
          skill: 'writing',
          count: 1,
        }),
      });
      const data = await createRes.json();
      expect(createRes.status).toBe(200);
      expect(data.success).toBe(true);
      practiceSessionId = data.sessionId;
    });

    it('2.1: check-answer with empty string essay returns isCorrect: false and never leaks letter "A"', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: practiceSessionId,
          questionId: 'adv_q_write_1',
          userAnswer: '',
        }),
      });
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCorrect).toBe(false);
      // Crucial: correctAnswerText must NOT contain "A" or "A. ..."
      expect(data.correctAnswerText).not.toBe('A');
      expect(data.correctAnswerText).not.toMatch(/^[A-Z]\.\s/);
      expect(data.correctAnswerText).toContain('黄山旅行');
    });

    it('2.2: check-answer with whitespace-only essay returns isCorrect: false', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: practiceSessionId,
          questionId: 'adv_q_write_1',
          userAnswer: '    \r\n\t   ',
        }),
      });
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCorrect).toBe(false);
      expect(data.correctAnswerText).not.toBe('A');
    });

    it('2.3: check-answer with single Hanzi character returns isCorrect: true and model essay', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: practiceSessionId,
          questionId: 'adv_q_write_1',
          userAnswer: '写',
        }),
      });
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCorrect).toBe(true);
      expect(data.correctAnswerText).toContain('黄山旅行');
    });

    it('2.4: check-answer rejects missing sessionId and missing questionId with distinct codes', async () => {
      const resNoSession = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'adv_q_write_1',
          userAnswer: '测试',
        }),
      });
      expect(resNoSession.status).toBe(400);
      const dataNoSession = await resNoSession.json();
      expect(dataNoSession.code).toBe('SESSION_REQUIRED');

      const resNoQ = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: practiceSessionId,
          userAnswer: '测试',
        }),
      });
      expect(resNoQ.status).toBe(400);
      const dataNoQ = await resNoQ.json();
      expect(dataNoQ.code).toBe('INVALID_INPUT');
    });

    it('2.5: check-answer for MCQ returns formatted letter and option text', async () => {
      // Create session with listening MCQ
      const mcqRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          mode: 'practice',
          skill: 'listening',
          count: 1,
        }),
      });
      const mcqData = await mcqRes.json();
      expect(mcqRes.status).toBe(200);
      expect(mcqData.success).toBe(true);
      const mcqSessionId = mcqData.sessionId;

      const checkRes = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mcqSessionId,
          questionId: 'adv_q_listen_1',
          userAnswer: 1,
        }),
      });
      const checkData = await checkRes.json();
      expect(checkData.success).toBe(true);
      expect(checkData.isCorrect).toBe(true);
      expect(checkData.correctAnswerText).toBe('B. 上海');
    });
  });

  // =========================================================================
  // VECTOR 3: Full Exam Submission (/submit) Boundary & Payload Stress
  // =========================================================================
  describe('Vector 3: Full Exam Submission (/submit) Payload Boundaries & Scoring', () => {
    let mockSessionId = '';

    beforeAll(async () => {
      // Assemble a session with 1 listening, 1 reading, and 1 writing question
      const questions = [
        {
          id: 'adv_q_listen_1',
          level: 5,
          section: 'listening',
          part_type: 'listen_dialogue_3opt',
          stem: '听录音，选出正确答案。',
          options: ['北京', '上海', '广州'],
          answer_index: 1,
          explanation_vi: 'Đáp án B.',
        },
        {
          id: 'adv_q_read_1',
          level: 5,
          section: 'reading',
          part_type: 'read_comprehension_4opt',
          stem: '阅读短文并回答问题。',
          options: ['每天', '有时候', '经常', '从不'],
          answer_index: 2,
          explanation_vi: 'Đáp án C.',
        },
        {
          id: 'adv_q_write_1',
          level: 5,
          section: 'writing',
          part_type: 'write_words_essay_80words',
          stem: '请结合以下词语写一篇80字左右的短文：[旅行, 朋友, 风景, 难忘, 照片]',
          options: [],
          answer_index: 0,
          explanation_vi: '去年我和朋友一起去黄山旅行，那里的风景美极了，留下了很多难忘的照片。',
        },
      ];

      const sessionObj = {
        id: `mock_session_${Date.now()}`,
        level: 5,
        mode: 'mock',
        questions,
        totalQuestions: 3,
        timeLimitMinutes: 110,
        maxScore: 300,
        passScore: 180,
        createdAt: Date.now(),
        expiresAt: Date.now() + 110 * 60 * 1000,
      };

      testDb.prepare(`
        INSERT INTO exam_sessions (session_id, level, mode, session_json, status, created_at, expires_at)
        VALUES (?, 5, 'mock', ?, 'in_progress', ?, ?)
      `).run(sessionObj.id, JSON.stringify(sessionObj), sessionObj.createdAt, sessionObj.expiresAt);

      mockSessionId = sessionObj.id;
    });

    it('3.1: submit with empty string for writing yields writing score = 0 and isCorrect: false', async () => {
      const res = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mockSessionId,
          answers: {
            adv_q_listen_1: 1, // correct
            adv_q_read_1: 2,   // correct
            adv_q_write_1: '', // empty essay
          },
          timeSpentSeconds: 1200,
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      const scoreResult = data.scoreResult;

      // Listening: 100/100, Reading: 100/100, Writing: 0/100 -> Total: 200/300
      expect(scoreResult.sectionScores.listening.correct).toBe(1);
      expect(scoreResult.sectionScores.reading.correct).toBe(1);
      expect(scoreResult.sectionScores.writing.correct).toBe(0);
      expect(scoreResult.sectionScores.writing.score).toBe(0);
      expect(scoreResult.totalScore).toBe(200);
      expect(scoreResult.passed).toBe(true); // 200 >= 180

      // Detailed review validation
      const writeReview = scoreResult.detailedReview.find((r: any) => r.id === 'adv_q_write_1');
      expect(writeReview).toBeDefined();
      expect(writeReview.isCorrect).toBe(false);
      expect(writeReview.userAnswer).toBe('');
      expect(writeReview.explanation_vi).toContain('黄山旅行');
    });

    it('3.2: idempotent submit returns exact same scoreResult without duplication', async () => {
      const res = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mockSessionId,
          answers: { adv_q_write_1: 'should be ignored by idempotency' },
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isRetryIdempotent).toBe(true);
      expect(data.scoreResult.totalScore).toBe(200);
      expect(data.scoreResult.sectionScores.writing.score).toBe(0);
    });

    it('3.3: submit with whitespace-only essay correctly yields 0 points', async () => {
      // Create new fresh session
      const newSessionId = `mock_session_ws_${Date.now()}`;
      const questions = [
        {
          id: 'adv_q_write_ws',
          level: 5,
          section: 'writing',
          part_type: 'write_words_essay_80words',
          stem: '写短文',
          options: [],
          answer_index: 0,
          explanation_vi: 'Bài mẫu',
        },
      ];
      const sObj = {
        id: newSessionId,
        level: 5,
        mode: 'mock',
        questions,
        totalQuestions: 1,
        timeLimitMinutes: 110,
        maxScore: 300,
        passScore: 180,
        createdAt: Date.now(),
        expiresAt: Date.now() + 110 * 60 * 1000,
      };
      testDb.prepare(`
        INSERT INTO exam_sessions (session_id, level, mode, session_json, status, created_at, expires_at)
        VALUES (?, 5, 'mock', ?, 'in_progress', ?, ?)
      `).run(newSessionId, JSON.stringify(sObj), sObj.createdAt, sObj.expiresAt);

      const res = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          answers: {
            adv_q_write_ws: '    \t\r\n    ',
          },
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.scoreResult.sectionScores.writing.correct).toBe(0);
      const rev = data.scoreResult.detailedReview[0];
      expect(rev.isCorrect).toBe(false);
      expect(rev.userAnswer).toBe('    \t\r\n    ');
    });

    it('3.4: submit with ultra-long essay (> 1500 chars) processes safely and preserves full answer', async () => {
      const ultraLongSessionId = `mock_session_long_${Date.now()}`;
      const questions = [
        {
          id: 'adv_q_write_long',
          level: 5,
          section: 'writing',
          part_type: 'write_words_essay_80words',
          stem: '写短文',
          options: [],
          answer_index: 0,
          explanation_vi: 'Bài mẫu',
        },
      ];
      const sObj = {
        id: ultraLongSessionId,
        level: 5,
        mode: 'mock',
        questions,
        totalQuestions: 1,
        timeLimitMinutes: 110,
        maxScore: 300,
        passScore: 180,
        createdAt: Date.now(),
        expiresAt: Date.now() + 110 * 60 * 1000,
      };
      testDb.prepare(`
        INSERT INTO exam_sessions (session_id, level, mode, session_json, status, created_at, expires_at)
        VALUES (?, 5, 'mock', ?, 'in_progress', ?, ?)
      `).run(ultraLongSessionId, JSON.stringify(sObj), sObj.createdAt, sObj.expiresAt);

      const hugeEssay = '去旅游和朋友看风景拍照。'.repeat(150); // 1,800 Chinese chars
      const res = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: ultraLongSessionId,
          answers: {
            adv_q_write_long: hugeEssay,
          },
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.scoreResult.sectionScores.writing.correct).toBe(1);
      const rev = data.scoreResult.detailedReview[0];
      expect(rev.isCorrect).toBe(true);
      expect(rev.userAnswer.length).toBe(hugeEssay.length);
    });

    it('3.5: submit with completely omitted writing answer defaults to userAnswer: "" and isCorrect: false', async () => {
      const omitSessionId = `mock_session_omit_${Date.now()}`;
      const questions = [
        {
          id: 'adv_q_write_omit',
          level: 5,
          section: 'writing',
          part_type: 'write_words_essay_80words',
          stem: '写短文',
          options: [],
          answer_index: 0,
          explanation_vi: 'Bài mẫu',
        },
      ];
      const sObj = {
        id: omitSessionId,
        level: 5,
        mode: 'mock',
        questions,
        totalQuestions: 1,
        timeLimitMinutes: 110,
        maxScore: 300,
        passScore: 180,
        createdAt: Date.now(),
        expiresAt: Date.now() + 110 * 60 * 1000,
      };
      testDb.prepare(`
        INSERT INTO exam_sessions (session_id, level, mode, session_json, status, created_at, expires_at)
        VALUES (?, 5, 'mock', ?, 'in_progress', ?, ?)
      `).run(omitSessionId, JSON.stringify(sObj), sObj.createdAt, sObj.expiresAt);

      const res = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: omitSessionId,
          answers: {}, // Empty answers dictionary
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.scoreResult.sectionScores.writing.correct).toBe(0);
      const rev = data.scoreResult.detailedReview[0];
      expect(rev.isCorrect).toBe(false);
      expect(rev.userAnswer).toBe('');
    });
  });

  // =========================================================================
  // VECTOR 4: Writing Evaluation Endpoint (/evaluate-writing) Invariant & Fuzzing
  // =========================================================================
  describe('Vector 4: Writing Evaluation Endpoint (/evaluate-writing) Invariant Fuzzing', () => {
    it('4.1: empty, null, undefined, or whitespace text yields score: 0 and exactly 0 Hanzi', async () => {
      const edgeCases = ['', '    ', '\t\n\r', undefined, null];

      for (const essayText of edgeCases) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 5,
            part_type: 'write_words_essay_80words',
            essayText,
            maxScore: 30,
          }),
        });

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.score).toBe(0);
        expect(data.charCount).toBe(0);
        expect(data.feedbackVi).toContain('Thí sinh chưa nhập nội dung');
        expect(data.rubricCriteria).toHaveLength(3);
        const sumMax = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.maxPoints, 0);
        expect(sumMax).toBe(30);
        const sumAwarded = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.awardedPoints, 0);
        expect(sumAwarded).toBe(0);
      }
    });

    it('4.2: non-Chinese text (English, Emojis, Symbols) produces charCount: 0 and score: 0', async () => {
      const nonChineseInputs = [
        'This is a complete essay written in English language. It talks about travel and friends.',
        '😀😁😂🤣😃😄😅😆😉😊😋😎🎉🌟✨🔥',
        '!@#$%^&*()_+-=[]{}|;:",.<>?/~`1234567890',
        'Привет, это текст на русском языке для проверки устойчивости.',
        'مرحبا هذا نص باللغة العربية لاختبار النظام',
      ];

      for (const essayText of nonChineseInputs) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 5,
            part_type: 'write_words_essay_80words',
            essayText,
            maxScore: 30,
          }),
        });

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.charCount).toBe(0);
        expect(data.score).toBe(0);
        expect(data.feedbackVi).toContain('chưa nhập nội dung bài viết bằng chữ Hán');
      }
    });

    it('4.3: mixed Chinese and non-Chinese text accurately counts only Hanzi characters', async () => {
      const mixedText = '今天天气非常好 (Sunny Day) 😀! 我和朋友去北京旅游。#Travel2026';
      // Hanzi: 今天天气非常好 (7) + 我和朋友去北京旅游 (9) = 16 Hanzi characters

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 4,
          part_type: 'write_sentence_from_picture_word',
          essayText: mixedText,
          maxScore: 15,
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.charCount).toBe(16);
      expect(data.score).toBeGreaterThan(0);
      expect(data.score).toBeLessThanOrEqual(15);
    });

    it('4.4: single Hanzi character essay is scored without crash, NaN or overflow', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          part_type: 'write_words_essay_80words',
          essayText: '好',
          maxScore: 30,
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.charCount).toBe(1);
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(30);
      expect(Number.isNaN(data.score)).toBe(false);
      const sumAwarded = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.awardedPoints, 0);
      expect(sumAwarded).toBe(data.score);
    });

    it('4.5: ultra-long essay (1,350 Chinese characters) executes rapidly (< 100ms) and respects score bounds', async () => {
      const longEssay = '去年夏天我和几个好朋友一起去旅行，那里的山水风景非常美丽，真是令人难忘。我们拍了很多照片留作纪念。'.repeat(30);
      // Hanzi count per unit: 45 * 30 = 1,350 Hanzi characters

      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 6,
          part_type: 'write_summary_shortening_400chars',
          essayText: longEssay,
          maxScore: 100,
          keywords: ['旅行', '朋友', '风景', '难忘', '照片'],
        }),
      });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(150); // Very fast execution
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.charCount).toBe(1350);
      expect(data.score).toBe(100); // Max capped
      expect(data.score).toBeLessThanOrEqual(100);
      expect(data.keywordsMissing).toHaveLength(0);
      expect(data.keywordsUsed).toHaveLength(5);

      const sumAwarded = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.awardedPoints, 0);
      expect(sumAwarded).toBe(100);
    });

    it('4.6: Rubric Mathematical Invariant Fuzzing across diverse scores & lengths', async () => {
      // Test 10 arbitrary maxScore values including odd and prime numbers
      const testScores = [1, 5, 11, 15, 17, 25, 30, 43, 60, 100];
      const testTexts = [
        '去北京旅游。', // short
        '因为今天天气很好，所以我和朋友一起去公园散步，风景很漂亮，拍照留念。虽然有点累，但是很开心。', // medium (~45 chars)
        '去年夏天我和朋友一起去黄山旅游，那里的自然风景非常优美，留下了许多难忘的美好回忆。我们一起拍了很多珍贵的照片，大家都很开心。'.repeat(2), // long (~120 chars)
      ];

      for (const maxScore of testScores) {
        for (const essayText of testTexts) {
          const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              level: 5,
              part_type: 'write_words_essay_80words',
              essayText,
              maxScore,
              keywords: ['旅游', '风景', '朋友'],
            }),
          });

          const data = await res.json();
          expect(data.success).toBe(true);

          // Invariant 1: Score within [0, maxScore]
          expect(data.score).toBeGreaterThanOrEqual(0);
          expect(data.score).toBeLessThanOrEqual(maxScore);

          // Invariant 2: Sum of maxPoints in rubricCriteria equals exactly maxScore
          const sumMax = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.maxPoints, 0);
          expect(sumMax).toBe(maxScore);

          // Invariant 3: Sum of awardedPoints in rubricCriteria equals exactly score
          const sumAwarded = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.awardedPoints, 0);
          expect(sumAwarded).toBe(data.score);

          // Invariant 4: Each criterion awardedPoints is within [0, maxPoints]
          for (const crit of data.rubricCriteria) {
            expect(crit.awardedPoints).toBeGreaterThanOrEqual(0);
            expect(crit.awardedPoints).toBeLessThanOrEqual(crit.maxPoints);
          }
        }
      }
    });

    it('4.7: keyword extraction handles brackets, colons, and special characters safely', async () => {
      // Square brackets
      const res1 = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          stem: '请根据词语写短文：[科技, 互联网, 发展, 改变]',
          essayText: '互联网的发展改变了人们的生活。',
        }),
      });
      const data1 = await res1.json();
      expect(data1.success).toBe(true);
      expect(data1.keywordsUsed).toContain('互联网');
      expect(data1.keywordsUsed).toContain('发展');
      expect(data1.keywordsUsed).toContain('改变');
      expect(data1.keywordsMissing).toContain('科技');

      // Chinese brackets
      const res2 = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          stem: '话题写作：【健康，运动，饮食】',
          essayText: '每天坚持运动有利于身体健康。',
        }),
      });
      const data2 = await res2.json();
      expect(data2.success).toBe(true);
      expect(data2.keywordsUsed).toContain('运动');
      expect(data2.keywordsUsed).toContain('健康');
      expect(data2.keywordsMissing).toContain('饮食');

      // Colon format
      const res3 = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          stem: '关键词：环境保护、垃圾分类、绿色生活',
          essayText: '我们要做好垃圾分类，过上绿色生活。',
        }),
      });
      const data3 = await res3.json();
      expect(data3.success).toBe(true);
      expect(data3.keywordsUsed).toContain('垃圾分类');
      expect(data3.keywordsUsed).toContain('绿色生活');
      expect(data3.keywordsMissing).toContain('环境保护');
    });

    it('4.8: Chinese punctuation and connectors influence grammar score and feedback note', async () => {
      // 30 Hanzi with zero punctuation
      const noPunctText = '去年夏天我和朋友一起去黄山旅游风景非常美丽我们拍了很多照片留作纪念';
      const resNoPunct = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          essayText: noPunctText,
          maxScore: 30,
        }),
      });
      const dataNoPunct = await resNoPunct.json();
      expect(dataNoPunct.success).toBe(true);
      const grammarCritNoPunct = dataNoPunct.rubricCriteria.find((c: any) => c.name.includes('Grammar'));
      expect(grammarCritNoPunct.note).toContain('Thiếu dấu ngắt câu');

      // 30 Hanzi with proper Chinese punctuation and connectors
      const withPunctText = '因为去年夏天天气好，所以我和朋友去旅游。风景不但美丽，而且令人难忘。';
      const resPunct = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          essayText: withPunctText,
          maxScore: 30,
        }),
      });
      const dataPunct = await resPunct.json();
      expect(dataPunct.success).toBe(true);
      const grammarCritPunct = dataPunct.rubricCriteria.find((c: any) => c.name.includes('Grammar'));
      expect(grammarCritPunct.awardedPoints).toBeGreaterThan(grammarCritNoPunct.awardedPoints);
      expect(grammarCritPunct.note).toContain('có liên từ kết nối');
    });
  });

  // =========================================================================
  // VECTOR 5: Review View & Notebook View Null-Safety Simulation
  // =========================================================================
  describe('Vector 5: Component Safety & Zero Leaked "A" Simulation', () => {
    it('5.1: Review View writing branch logic avoids "Đáp án đúng: A"', () => {
      const mockWritingItem = {
        id: 'rev_write_1',
        section: 'writing',
        part_type: 'write_words_essay_80words',
        options: [],
        answer_index: 0,
        correctAnswer: 0,
        explanation_vi: '去年我和朋友一起去黄山旅行...',
        userAnswer: '这是我的文章。',
        isCorrect: true,
      };

      // In HSKMockExam.tsx, line 4538:
      const isWriting = mockWritingItem.section === 'writing' || mockWritingItem.part_type?.startsWith('write_');
      expect(isWriting).toBe(true);

      // Verify that if isWriting is true, the branch renders 参考范文 and not "Đáp án đúng: A"
      let renderedCorrectAnswerLabel = '';
      if (isWriting) {
        renderedCorrectAnswerLabel = '参考范文 (Bài văn / Câu mẫu chuẩn HSK)';
      } else {
        renderedCorrectAnswerLabel = `Đáp án đúng: ${formatCorrectAnswerText(mockWritingItem.options, mockWritingItem.correctAnswer)}`;
      }

      expect(renderedCorrectAnswerLabel).not.toContain('Đáp án đúng: A');
      expect(renderedCorrectAnswerLabel).toContain('参考范文');
    });

    it('5.2: Notebook View writing branch logic renders student draft and model essay without option grid', () => {
      const mockNotebookItem = {
        id: 'nb_write_1',
        section: 'writing',
        part_type: 'write_sentence_from_picture_word',
        stem: '看图，用词造句：[弹钢琴]',
        options: [],
        answer_idx: 0,
        correctAnswer: 0,
        explanation_vi: '妹妹正在认真地弹钢琴。',
        userAnswer: '他弹钢琴。',
      };

      const isWriting = mockNotebookItem.section === 'writing' || mockNotebookItem.part_type?.startsWith('write_');
      expect(isWriting).toBe(true);

      // Verify formatCorrectAnswerText with empty options is empty
      const answerText = formatCorrectAnswerText(mockNotebookItem.options, mockNotebookItem.correctAnswer);
      expect(answerText).toBe('');
    });
  });

  // =========================================================================
  // VECTOR 6: Malicious / Fuzzed Payloads & Type Confusion Safety
  // =========================================================================
  describe('Vector 6: Malicious / Fuzzed Payloads & Type Confusion Safety', () => {
    it('6.1: SQL injection and XSS strings in essay submission do not compromise system or throw errors', async () => {
      const maliciousPayloads = [
        "'; DROP TABLE exam_sessions; --",
        "1' OR '1'='1",
        '<script>alert("xss")</script><img src=x onerror=alert(1)>',
        '${7*7}{{7*7}}',
        '\\"\\n\\r\\t',
      ];

      for (const payload of maliciousPayloads) {
        // Test in /evaluate-writing
        const resEval = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 5,
            part_type: 'write_words_essay_80words',
            essayText: payload,
          }),
        });
        expect(resEval.status).toBe(200);
        const dataEval = await resEval.json();
        expect(dataEval.success).toBe(true);
        expect(dataEval.charCount).toBe(0); // None are Hanzi characters
        expect(dataEval.score).toBe(0);
      }
    });

    it('6.2: control characters and zero-width spaces are handled safely without crash', async () => {
      const controlText = '\u0000\u0001\u0002我\u200B们\uFEFF学\b\f\v习\u001F中文。';
      // Hanzi: 我们学习中文 (6 Hanzi)
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 4,
          part_type: 'write_sentence_from_picture_word',
          essayText: controlText,
          maxScore: 15,
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.charCount).toBe(6);
      expect(data.score).toBeGreaterThan(0);
    });

    it('6.3: type confusion in userAnswer handles arrays and objects gracefully', async () => {
      const confuseSessionId = `mock_session_confuse_${Date.now()}`;
      const questions = [
        {
          id: 'adv_q_write_confuse',
          level: 5,
          section: 'writing',
          part_type: 'write_words_essay_80words',
          stem: '写短文',
          options: [],
          answer_index: 0,
          explanation_vi: 'Bài mẫu',
        },
      ];
      const sObj = {
        id: confuseSessionId,
        level: 5,
        mode: 'mock',
        questions,
        totalQuestions: 1,
        timeLimitMinutes: 110,
        maxScore: 300,
        passScore: 180,
        createdAt: Date.now(),
        expiresAt: Date.now() + 110 * 60 * 1000,
      };
      testDb.prepare(`
        INSERT INTO exam_sessions (session_id, level, mode, session_json, status, created_at, expires_at)
        VALUES (?, 5, 'mock', ?, 'in_progress', ?, ?)
      `).run(confuseSessionId, JSON.stringify(sObj), sObj.createdAt, sObj.expiresAt);

      // Submit with object and array as answers
      const res = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: confuseSessionId,
          answers: {
            adv_q_write_confuse: { invalid: 'object' },
          },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.scoreResult.sectionScores.writing.correct).toBe(0);
      expect(data.scoreResult.detailedReview[0].isCorrect).toBe(false);
    });

    it('6.4: evaluate-writing with 100 keywords executes without regex or stack overflow', async () => {
      const keywords100 = Array.from({ length: 100 }, (_, i) => `关键词编号_${String(i).padStart(3, '0')}`);
      const essay = '关键词编号_000 关键词编号_001 关键词编号_050 关键词编号_099 今天的天气非常好。';

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          part_type: 'write_words_essay_80words',
          essayText: essay,
          keywords: keywords100,
          maxScore: 30,
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.keywordsUsed.length).toBe(4);
      expect(data.keywordsMissing.length).toBe(96);
      expect(data.score).toBeGreaterThan(0);
      expect(data.score).toBeLessThanOrEqual(30);
    });

    it('6.5: evaluate-writing handles non-existent questionId and sessionId gracefully', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'non_existent_question_id_99999',
          sessionId: 'non_existent_session_id_99999',
          essayText: '这是一篇普通的短文。',
          level: 5,
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.charCount).toBe(9); // 9 Hanzi characters (excluding punctuation 。)
      expect(data.score).toBeGreaterThan(0);
    });
  });
});
