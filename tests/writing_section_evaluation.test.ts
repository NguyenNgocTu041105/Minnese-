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

describe('Milestone M4: Comprehensive Writing Section Execution & Evaluation Support (Feature 24)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;

  beforeAll(async () => {
    // 1. Verify operational DB hash invariant before starting tests
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);

    // 2. Set up isolated in-memory test database
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

    // 3. Seed an approved writing question into testDb
    testDb.prepare(`
      INSERT INTO questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
    `).run(
      'q_writing_test_1',
      '请结合以下词语写一篇80字左右的短文：[旅游, 风景, 难忘, 照片, 朋友]',
      JSON.stringify([]),
      0,
      '',
      '去年我和朋友一起去北京旅游，风景非常优美，留下了很多难忘的照片。',
      5,
      'writing',
      'write_words_essay_80words'
    );

    testDb.prepare(`
      INSERT INTO exam_eligible_pool (
        question_id, level, skill, part_type, stem, practice_eligible, exam_eligible
      ) VALUES (?, ?, ?, ?, ?, 1, 1)
    `).run(
      'q_writing_test_1',
      5,
      'writing',
      'write_words_essay_80words',
      '请结合以下词语写一篇80字左右的短文：[旅游, 风景, 难忘, 照片, 朋友]'
    );

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

    // Verify operational DB hash invariant after tests
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  // =========================================================================
  // SUITE 1: 0-Option Format Compatibility & Contract Compliance
  // =========================================================================
  describe('Suite 1: 0-Option Format Compatibility & Contract Compliance', () => {
    it('1.1: accepts valid 0-option open-ended writing tasks across HSK 4, 5, 6', () => {
      const writingTasks = [
        {
          id: 'w_hsk4_1',
          level: 4,
          skill: 'writing',
          part_type: 'write_sentence_from_picture_word',
          stem: '看图，用词造句：[乒乓球]',
          options: [],
          answer_idx: 0,
        },
        {
          id: 'w_hsk4_2',
          level: 4,
          skill: 'writing',
          part_type: 'write_short_essay_80chars',
          stem: '请写一篇短文',
          options: [],
          answer_idx: 0,
        },
        {
          id: 'w_hsk5_1',
          level: 5,
          skill: 'writing',
          part_type: 'write_story_from_4pictures_100chars',
          stem: '看图，写一篇故事',
          options: [],
          answer_idx: 0,
        },
        {
          id: 'w_hsk5_2',
          level: 5,
          skill: 'writing',
          part_type: 'write_topic_essay_200chars',
          stem: '话题作文：千里之行，始于足下',
          options: [],
          answer_idx: 0,
        },
        {
          id: 'w_hsk6_1',
          level: 6,
          skill: 'writing',
          part_type: 'write_summary_shortening_400chars',
          stem: '缩写文章',
          options: [],
          answer_idx: 0,
        },
        {
          id: 'w_hsk6_2',
          level: 6,
          skill: 'writing',
          part_type: 'write_topic_essay_300chars',
          stem: '论述文写作',
          options: [],
          answer_idx: 0,
        },
      ];

      for (const task of writingTasks) {
        const res = validateFormatCompatibility(task, task.level);
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(true);
        expect(res.ineligible_reasons).toEqual([]);
      }
    });

    it('1.2: rejects multi-option questions falsely labeled as open-ended writing tasks', () => {
      const fakeWritingTask = {
        id: 'fake_writing_with_opts',
        level: 5,
        skill: 'writing',
        part_type: 'write_words_essay_80words',
        stem: 'Fake writing task with options',
        options: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
        answer_idx: 0,
      };

      const result = validateFormatCompatibility(fakeWritingTask, 5);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.length).toBeGreaterThan(0);
    });

    it('1.3: null-safety: safely normalizes questions where options is undefined or null', () => {
      const uninitWritingTask = {
        id: 'w_null_options',
        level: 5,
        skill: 'writing',
        part_type: 'write_words_essay_80words',
        stem: 'Writing task with undefined options',
        options: undefined,
        answer_idx: 0,
      };

      expect(() => {
        const res = validateFormatCompatibility(uninitWritingTask, 5);
        expect(res.practice_eligible).toBe(true);
      }).not.toThrow();
    });

    it('1.4: preserves 6 options for write_component_assembly_6opt', () => {
      const assemblyTask = {
        id: 'w_assembly_6opt',
        level: 3,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
        stem: '连词成句',
        options: ['这', '位', '导游', '做了', '详细的', '介绍'],
        answer_idx: 0,
      };

      const res = validateFormatCompatibility(assemblyTask, 3);
      expect(res.practice_eligible).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 2: Anti-Cheat Answer Stripping & Shuffling Null-Safety
  // =========================================================================
  describe('Suite 2: Anti-Cheat Answer Stripping & Shuffling Null-Safety', () => {
    it('2.1: stripAnswerFromQuestion cleanly handles 0-option writing tasks without throwing', () => {
      const writingQ: any = {
        id: 'w_strip_test',
        level: 5,
        skill: 'writing',
        part_type: 'write_words_essay_80words',
        stem: '写作题目',
        options: [],
        answer_index: 0,
        explanation_vi: '范文参考',
      };

      const stripped = stripAnswerFromQuestion(writingQ);
      expect(stripped.id).toBe('w_strip_test');
      expect((stripped as any).answer_index).toBeUndefined();
      expect((stripped as any).explanation_vi).toBeUndefined();
      expect(stripped.options).toEqual([]);
    });

    it('2.2: canShuffle returns false for 0-option writing tasks', () => {
      const writingQ = {
        options: [],
        answer_idx: 0,
        part_type: 'write_words_essay_80words',
      };

      const check = canShuffle(writingQ);
      expect(check.canShuffle).toBe(false);
    });

    it('2.3: shuffleQuestionAnswers leaves 0-option question intact without mutation or error', () => {
      const writingQ = {
        options: [],
        answer_idx: 0,
        part_type: 'write_words_essay_80words',
      };

      const res = shuffleQuestionAnswers(writingQ);
      expect(res.shuffled).toBe(false);
      expect(res.question.options).toEqual([]);
      expect(res.new_answer_idx).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 3: Practice Mode Answer Submission & Instant Validation (POST /api/exam/check-answer)
  // =========================================================================
  describe('Suite 3: Practice Mode Answer Submission & Instant Validation (POST /api/exam/check-answer)', () => {
    let practiceSessionId: string = '';

    beforeAll(async () => {
      // Create a practice session with our writing question
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          mode: 'practice',
          skill: 'writing',
          count: 1,
        }),
      });

      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      practiceSessionId = data.sessionId;
    });

    it('3.1: rejects check-answer request missing sessionId with HTTP 400 SESSION_REQUIRED', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'q_writing_test_1',
          userAnswer: '我的作文',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('SESSION_REQUIRED');
    });

    it('3.2: rejects check-answer request missing questionId or userAnswer with HTTP 400 INVALID_INPUT', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: practiceSessionId,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('INVALID_INPUT');
    });

    it('3.3: evaluates empty string ("") or whitespace ("   ") essay answer as isCorrect: false', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: practiceSessionId,
          questionId: 'q_writing_test_1',
          userAnswer: '    ',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCorrect).toBe(false);
    });

    it('3.4: evaluates valid Chinese essay text as isCorrect: true, returning model essay reference in explanation_vi', async () => {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: practiceSessionId,
          questionId: 'q_writing_test_1',
          userAnswer: '去年夏天我和几个好朋友一起去北京旅游，那里的风景非常优美，我们拍了很多照片。',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCorrect).toBe(true);
      expect(data.explanation_vi).toContain('去年我和朋友一起去北京旅游');
    });

    it('3.5: null-safety: does not crash on formatCorrectAnswerText when options is empty array [], eliminates "A"', () => {
      // 0-option writing tasks should return empty string, never "A"
      const formatted = formatCorrectAnswerText([], 0);
      expect(formatted).toBe('');
      expect(formatted).not.toBe('A');

      const formattedUndefined = formatCorrectAnswerText(undefined, 0);
      expect(formattedUndefined).toBe('');
    });
  });

  // =========================================================================
  // SUITE 4: Full Exam Submission & Scoring Integrity (POST /api/exam/submit)
  // =========================================================================
  describe('Suite 4: Full Exam Submission & Scoring Integrity (POST /api/exam/submit)', () => {
    it('4.1: submitting exam with string essay answer records userAnswer verbatim, marks isCorrect: true, and credits sectionScores.writing', async () => {
      // Create session
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          mode: 'practice',
          skill: 'writing',
          count: 1,
        }),
      });
      const genData = await genRes.json();
      expect(genData.success).toBe(true);
      expect(genData.questions.length).toBeGreaterThan(0);
      const sId = genData.sessionId;
      const qId = genData.questions[0].id;

      const subRes = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sId,
          answers: {
            [qId]: '我的作文内容：旅游非常开心。',
          },
        }),
      });

      expect(subRes.status).toBe(200);
      const subData = await subRes.json();
      expect(subData.success).toBe(true);
      expect(subData.scoreResult).toBeDefined();
      expect(subData.scoreResult.sectionScores?.writing).toBeDefined();
      expect(subData.scoreResult.sectionScores.writing.score).toBeGreaterThan(0);

      const reviewItem = subData.scoreResult.review?.find((r: any) => r.id === qId);
      expect(reviewItem).toBeDefined();
      expect(reviewItem.isCorrect).toBe(true);
      expect(reviewItem.userAnswer).toBe('我的作文内容：旅游非常开心。');
    });

    it('4.2: submitting exam with unanswered writing task marks isCorrect: false and awards 0 score to writing section', async () => {
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          mode: 'practice',
          skill: 'writing',
          count: 1,
        }),
      });
      const genData = await genRes.json();
      expect(genData.success).toBe(true);
      expect(genData.questions.length).toBeGreaterThan(0);
      const sId = genData.sessionId;
      const qId = genData.questions[0].id;

      const subRes = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sId,
          answers: {},
        }),
      });

      expect(subRes.status).toBe(200);
      const subData = await subRes.json();
      expect(subData.success).toBe(true);
      expect(subData.scoreResult.sectionScores?.writing?.score).toBe(0);

      const reviewItem = subData.scoreResult.review?.find((r: any) => r.id === qId);
      expect(reviewItem).toBeDefined();
      expect(reviewItem.isCorrect).toBe(false);
    });

    it('4.3: submission idempotency: resubmitting with same sessionId returns identical score result without duplicate records', async () => {
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 5,
          mode: 'practice',
          skill: 'writing',
          count: 1,
        }),
      });
      const genData = await genRes.json();
      const sId = genData.sessionId;
      const qId = genData.questions[0].id;

      const subPayload = {
        sessionId: sId,
        answers: {
          [qId]: '我的作文内容：桂林风景好。',
        },
      };

      const res1 = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subPayload),
      });
      const data1 = await res1.json();

      const res2 = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subPayload),
      });
      const data2 = await res2.json();

      expect(data1.scoreResult.totalScore).toBe(data2.scoreResult.totalScore);
      expect(data1.submissionId).toBe(data2.submissionId);
    });
  });


  // =========================================================================
  // SUITE 5: Writing Evaluation Endpoint Comprehensive Edge Cases (POST /api/exam/evaluate-writing)
  // =========================================================================
  describe('Suite 5: Writing Evaluation Endpoint Comprehensive Edge Cases (POST /api/exam/evaluate-writing)', () => {
    it('5.1: empty essay text ("") or whitespace returns score 0, charCount 0, feedbackVi warning, all rubric criteria 0', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: '  \n\t  ',
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.score).toBe(0);
      expect(data.charCount).toBe(0);
      expect(data.feedbackVi).toContain('chưa nhập');
      for (const crit of data.rubricCriteria) {
        expect(crit.awardedPoints).toBe(0);
      }
    });

    it('5.2: non-Hanzi text returns score 0, charCount 0, feedbackVi warning', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: 'Hello World! This is an English sentence 123456.',
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.score).toBe(0);
      expect(data.charCount).toBe(0);
      expect(data.feedbackVi).toContain('chưa nhập');
    });

    it('5.3: HSK 4 picture-word sentence evaluation scales targetCharCount to 20 and maxScore to 15', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: '他正在操场上热情地打乒乓球。',
          level: 4,
          part_type: 'write_sentence_from_picture_word',
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.targetCharCount).toBe(20);
      expect(data.maxScore).toBe(15);
      expect(data.score).toBeGreaterThan(0);
      expect(data.score).toBeLessThanOrEqual(15);
    });

    it('5.4: HSK 5 80-word essay evaluation across 4 length tiers', async () => {
      const baseBody = {
        level: 5,
        part_type: 'write_words_essay_80words',
      };

      // Tier 1: Very short (20 Hanzi)
      const resShort = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...baseBody,
          essayText: '去年夏天我和几个好朋友一起去北京旅游。',
        }),
      });
      const dataShort = await resShort.json();
      expect(dataShort.charCount).toBeLessThan(30);
      expect(dataShort.score).toBeLessThan(15);
      expect(dataShort.feedbackVi).toContain('chưa đạt tiêu chuẩn');

      // Tier 2: Medium (60 Hanzi)
      const resMed = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...baseBody,
          essayText: '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫也非常美丽。我们在天安门广场拍了很多难忘的照片。',
        }),
      });


      const dataMed = await resMed.json();
      expect(dataMed.charCount).toBeGreaterThanOrEqual(50);
      expect(dataMed.charCount).toBeLessThan(80);
      expect(dataMed.score).toBeGreaterThanOrEqual(15);
      expect(dataMed.feedbackVi).toContain('hơi ngắn');

      // Tier 3: Full (85 Hanzi)
      const resFull = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...baseBody,
          essayText: '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片，尝了地道的北京烤鸭。这次旅行让我收获了很多快乐与知识。',
        }),
      });
      const dataFull = await resFull.json();
      expect(dataFull.charCount).toBeGreaterThanOrEqual(80);
      expect(dataFull.score).toBeGreaterThanOrEqual(24);
      expect(dataFull.feedbackVi).toContain('Đạt yêu cầu về dung lượng');

      // Tier 4: Over-length (160 Hanzi, capped at maxScore 30)
      const resOver = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...baseBody,
          essayText: '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片，尝了地道的北京烤鸭。这次旅行让我收获了很多快乐与知识。去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片。',
        }),
      });
      const dataOver = await resOver.json();
      expect(dataOver.charCount).toBeGreaterThan(120);
      expect(dataOver.score).toBeLessThanOrEqual(30);
    });

    it('5.5: HSK 5 100-word story sets targetCharCount = 100, maxScore = 40', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: '这是一个生动有趣的看图故事，四幅图展现了一个关于坚持与梦想的故事。',
          level: 5,
          part_type: 'write_story_from_4pictures_100chars',
        }),
      });

      const data = await res.json();
      expect(data.targetCharCount).toBe(100);
      expect(data.maxScore).toBe(40);
    });

    it('5.6: HSK 5 200-word topic essay sets targetCharCount = 200, maxScore = 60', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: '千里之行，始于足下。这句话告诉我们在人生的道路上，无论目标多么宏大，都必须从眼前的第一步踏实走起。',
          level: 5,
          part_type: 'write_topic_essay_200chars',
        }),
      });

      const data = await res.json();
      expect(data.targetCharCount).toBe(200);
      expect(data.maxScore).toBe(60);
    });

    it('5.7: HSK 6 400-word narrative summary sets targetCharCount = 400, maxScore = 100', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: '这是一个400字的高阶缩写文章。',
          level: 6,
          part_type: 'write_narrative_summary_400words',
        }),
      });

      const data = await res.json();
      expect(data.targetCharCount).toBe(400);
      expect(data.maxScore).toBe(100);
    });

    it('5.8: keyword extraction and matching (full match vs partial match)', async () => {
      const keywords = ['旅游', '风景', '难忘', '照片', '朋友'];

      // Full match
      const fullText = '去年夏天我和几个好朋友一起去北京旅游，那里的风景非常优美，我们拍了很多难忘的照片。';
      const resFull = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: fullText,
          level: 5,
          part_type: 'write_words_essay_80words',
          keywords,
        }),
      });
      const dataFull = await resFull.json();
      expect(dataFull.keywordsUsed).toEqual(expect.arrayContaining(keywords));
      expect(dataFull.keywordsMissing).toEqual([]);
      expect(dataFull.feedbackVi).toContain('toàn bộ từ khóa bắt buộc');

      // Partial match (omits '照片' and '朋友')
      const partialText = '去年夏天我去桂林旅游，那里的风景让我特别难忘。';
      const resPart = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: partialText,
          level: 5,
          part_type: 'write_words_essay_80words',
          keywords,
        }),
      });
      const dataPart = await resPart.json();
      expect(dataPart.keywordsUsed.length).toBe(3);
      expect(dataPart.keywordsMissing).toEqual(expect.arrayContaining(['照片', '朋友']));
      expect(dataPart.feedbackVi).toContain('Chưa sử dụng các từ khóa bắt buộc');
    });

    it('5.9: stem keyword regex extraction extracts keywords from bracketed stem', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem: '请结合以下几个词语写一篇短文：[失败, 经验, 坚持, 成功]。',
          essayText: '面对失败时，我们应当总结经验，只要坚持努力，最终一定会取得成功。',
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      expect(data.keywordsUsed).toEqual(expect.arrayContaining(['失败', '经验', '坚持', '成功']));
      expect(data.keywordsMissing).toEqual([]);
    });

    it('5.10: Chinese punctuation and connectors analysis elevates grammar score', async () => {
      const textWithConnectors = '因为我们提前做好了准备，所以整个旅途非常顺利。虽然路途遥远，但是大家都觉得很有意义。';
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: textWithConnectors,
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      const grammarCrit = data.rubricCriteria.find((c: any) => c.name.includes('Ngữ pháp'));
      expect(grammarCrit).toBeDefined();
      expect(grammarCrit.note).toContain('liên từ kết nối');
      expect(data.feedbackVi).toContain('sử dụng hiệu quả liên từ');
    });
  });

  // =========================================================================
  // SUITE 6: Rubric Mathematical Invariants & Score Bounds
  // =========================================================================
  describe('Suite 6: Rubric Mathematical Invariants & Score Bounds', () => {
    it('6.1: rubric criteria count exactly 3 (Length, Grammar, Vocabulary/Relevance)', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: '这是一篇测试文章。',
          level: 5,
        }),
      });

      const data = await res.json();
      expect(data.rubricCriteria.length).toBe(3);
      expect(data.rubricCriteria[0].name).toContain('Độ dài');
      expect(data.rubricCriteria[1].name).toContain('Ngữ pháp');
      expect(data.rubricCriteria[2].name).toContain('Relevance');
    });

    it('6.2: criterion invariants: 0 <= awardedPoints <= maxPoints for each criterion', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: '春暖花开，万物复苏，大地充满了无限生机与活力。',
          level: 5,
        }),
      });

      const data = await res.json();
      for (const crit of data.rubricCriteria) {
        expect(crit.awardedPoints).toBeGreaterThanOrEqual(0);
        expect(crit.awardedPoints).toBeLessThanOrEqual(crit.maxPoints);
      }
    });

    it('6.3: sum invariants: sum(maxPoints) === maxScore and sum(awardedPoints) === score', async () => {
      const testCases = [
        { level: 4, part_type: 'write_sentence_from_picture_word', text: '他喜欢打篮球。' },
        { level: 5, part_type: 'write_words_essay_80words', text: '去年旅游很开心。' },
        { level: 5, part_type: 'write_topic_essay_200chars', text: '千里之行，始于足下。我们要努力。' },
        { level: 6, part_type: 'write_summary_shortening_400chars', text: '缩写文章内容。' },
      ];

      for (const tc of testCases) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: tc.level,
            part_type: tc.part_type,
            essayText: tc.text,
          }),
        });

        const data = await res.json();
        const sumMaxPoints = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.maxPoints, 0);
        const sumAwardedPoints = data.rubricCriteria.reduce((acc: number, c: any) => acc + c.awardedPoints, 0);

        expect(sumMaxPoints).toBe(data.maxScore);
        expect(sumAwardedPoints).toBe(data.score);
      }
    });

    it('6.4: score bound: 0 <= score <= maxScore across all levels and extreme inputs', async () => {
      // Very long text (1000 Hanzi)
      const longText = '中国文化博大精深源远流长。'.repeat(85); // > 1000 chars

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: longText,
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(data.maxScore);
    });
  });
});
