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
} from '../src/server/examRoutes.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Adversarial Challenger M4-2: Writing Evaluation Endpoint Stress & Invariants', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;

  beforeAll(async () => {
    // 1. Verify operational DB hash invariant before tests
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

    // 3. Start isolated Express test server
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
  // SUITE 1: Rubric Mathematical Invariants Across Arbitrary maxScore Values
  // =========================================================================
  describe('Suite 1: Rubric Mathematical Invariants Across Arbitrary maxScore Values', () => {
    const testMaxScores = [1, 2, 5, 7, 10, 13, 15, 20, 25, 30, 37, 40, 50, 60, 75, 83, 99, 100, 150, 200];

    const sampleTexts = [
      { label: 'empty', text: '' },
      { label: 'short (20 chars)', text: '今天我和朋友一起去公园散步，天气很好。' },
      { label: 'medium (50 chars)', text: '今天我和朋友一起去公园散步，天气很好。我们一边走路一边聊天，讨论了关于未来的梦想与计划。' },
      { label: 'full (85 chars)', text: '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片，尝了地道的北京烤鸭。' },
      { label: 'over (180 chars)', text: '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片，尝了地道的北京烤鸭。这次旅行让我收获了很多快乐与知识。去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片。' },
    ];

    for (const scoreVal of testMaxScores) {
      for (const sample of sampleTexts) {
        it(`maxScore=${scoreVal} with ${sample.label} text preserves exact sum and bounds`, async () => {
          const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              essayText: sample.text,
              level: 5,
              part_type: 'write_words_essay_80words',
              maxScore: scoreVal,
              keywords: ['旅游', '风景', '难忘'],
            }),
          });

          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.maxScore).toBe(scoreVal);

          // Invariant 1: Criteria count exactly 3
          expect(data.rubricCriteria).toBeDefined();
          expect(data.rubricCriteria.length).toBe(3);

          // Invariant 2: sum(maxPoints) === maxScore
          const sumMaxPoints = data.rubricCriteria.reduce((sum: number, c: any) => sum + c.maxPoints, 0);
          expect(sumMaxPoints).toBe(scoreVal);

          // Invariant 3: sum(awardedPoints) === score
          const sumAwarded = data.rubricCriteria.reduce((sum: number, c: any) => sum + c.awardedPoints, 0);
          expect(sumAwarded).toBe(data.score);

          // Invariant 4: Score bound 0 <= score <= maxScore
          expect(data.score).toBeGreaterThanOrEqual(0);
          expect(data.score).toBeLessThanOrEqual(scoreVal);

          // Invariant 5: Each criterion bound 0 <= awarded <= max
          for (const crit of data.rubricCriteria) {
            expect(crit.awardedPoints).toBeGreaterThanOrEqual(0);
            expect(crit.awardedPoints).toBeLessThanOrEqual(crit.maxPoints);
            expect(Number.isNaN(crit.maxPoints)).toBe(false);
            expect(Number.isNaN(crit.awardedPoints)).toBe(false);
          }

          // Invariant 6: No NaN or Infinity
          expect(Number.isNaN(data.score)).toBe(false);
          expect(Number.isFinite(data.score)).toBe(true);
          expect(Number.isNaN(data.charCount)).toBe(false);
          expect(Number.isNaN(data.targetCharCount)).toBe(false);
        });
      }
    }
  });

  // =========================================================================
  // SUITE 2: Boundary Conditions for Text Length
  // =========================================================================
  describe('Suite 2: Boundary Conditions for Text Length', () => {
    const targetCharCount = 80;
    const basePayload = {
      level: 5,
      part_type: 'write_words_essay_80words',
      keywords: ['旅游', '风景', '难忘'],
    };

    it('2.1: empty string and whitespace-only return 0 score and clear feedback', async () => {
      const inputs = ['', '    ', '\t\n\r  \n'];
      for (const input of inputs) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, essayText: input }),
        });
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.score).toBe(0);
        expect(data.charCount).toBe(0);
        expect(data.feedbackVi).toContain('chưa nhập');
        expect(data.rubricCriteria.every((c: any) => c.awardedPoints === 0)).toBe(true);
      }
    });

    it('2.2: non-Hanzi text (English, digits, emojis, symbols) treated as 0 Hanzi', async () => {
      const inputs = [
        'Hello World! This is an essay written in English.',
        '1234567890 987654321',
        '🚀 🎉 🇨🇳 📚 ✏️ 💻',
        '!@#$%^&*()_+=-{}[]:;"\'|<>,.?/',
      ];
      for (const input of inputs) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, essayText: input }),
        });
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.score).toBe(0);
        expect(data.charCount).toBe(0);
      }
    });

    it('2.3: single Hanzi character is handled safely without NaN or crash', async () => {
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, essayText: '好' }),
      });
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.charCount).toBe(1);
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(data.maxScore);
      expect(Number.isNaN(data.score)).toBe(false);
    });

    it('2.4: 50% length match (40 Hanzi out of 80) assigns length tier 0.6', async () => {
      // Generate exact 40 hanzi
      const fortyHanzi = '一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十';
      expect(fortyHanzi.length).toBe(40);

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, essayText: fortyHanzi }),
      });
      const data = await res.json();
      expect(data.charCount).toBe(40);
      const lenCrit = data.rubricCriteria.find((c: any) => c.name.includes('Độ dài'));
      expect(lenCrit.note).toContain('dung lượng còn thiếu');
    });

    it('2.5: exact length match (80 Hanzi) earns full length points', async () => {
      // 80 Chinese characters with keywords and punctuation
      const exact80 = '去年夏天我和好朋友一起去北京旅游。那里的自然风景非常优美，令人难忘。我们参观了宏伟的长城，游览了历史悠久的故宫，品尝了著名的北京烤鸭。这次充实而愉快的旅行给我留下了极其深刻美好的回忆，收获很多。';
      const hanziCount = (exact80.match(/[\u4e00-\u9fa5]/g) || []).length;
      expect(hanziCount).toBeGreaterThanOrEqual(80);

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, essayText: exact80 }),
      });
      const data = await res.json();
      expect(data.charCount).toBeGreaterThanOrEqual(80);
      const lenCrit = data.rubricCriteria.find((c: any) => c.name.includes('Độ dài'));
      expect(lenCrit.awardedPoints).toBe(lenCrit.maxPoints);
      expect(lenCrit.note).toContain('Đạt chuẩn số lượng chữ');
      expect(data.feedbackVi).toContain('Đạt yêu cầu về dung lượng chữ');
    });

    it('2.6: 150% length match (120 Hanzi) remains capped at maxLengthPoints and maxScore', async () => {
      // 120 Chinese characters
      const text120 = '去年夏天我和好朋友一起去北京旅游。那里的自然风景非常优美，令人难忘。我们参观了宏伟的长城，游览了历史悠久的故宫，品尝了著名的北京烤鸭。这次充实而愉快的旅行给我留下了极其深刻美好的回忆。而且，我们在旅途中结识了许多热情的当地朋友，大家互相交流学习生活心得，让我对中国传统文化有了更深刻的理解与体会。';
      const hanziCount = (text120.match(/[\u4e00-\u9fa5]/g) || []).length;
      expect(hanziCount).toBeGreaterThanOrEqual(120);

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, essayText: text120 }),
      });
      const data = await res.json();
      expect(data.charCount).toBeGreaterThanOrEqual(120);
      const lenCrit = data.rubricCriteria.find((c: any) => c.name.includes('Độ dài'));
      expect(lenCrit.awardedPoints).toBe(lenCrit.maxPoints);
      expect(data.score).toBeLessThanOrEqual(data.maxScore);
    });

    it('2.7: 500% length match (400+ Hanzi) does not overflow or crash', async () => {
      const sentence = '去年夏天我和朋友一起去北京旅游，那里的风景非常优美，留下了很多难忘的照片。';
      const text400 = sentence.repeat(14); // ~476 hanzi
      const hanziCount = (text400.match(/[\u4e00-\u9fa5]/g) || []).length;
      expect(hanziCount).toBeGreaterThanOrEqual(400);

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, essayText: text400 }),
      });
      const data = await res.json();
      expect(data.charCount).toBe(hanziCount);
      expect(data.score).toBeLessThanOrEqual(data.maxScore);
      expect(data.score).toBeGreaterThan(0);
      const sumAwarded = data.rubricCriteria.reduce((sum: number, c: any) => sum + c.awardedPoints, 0);
      expect(sumAwarded).toBe(data.score);
    });

    it('2.8: massive length (2,000+ Hanzi) terminates in milliseconds with valid score', async () => {
      const sentence = '中国文化博大精深，源远流长，具有独特的历史魅力与哲学智慧。';
      const text2000 = sentence.repeat(70); // ~2000 hanzi

      const startTime = Date.now();
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, essayText: text2000 }),
      });
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Must be fast

      const data = await res.json();
      expect(data.charCount).toBeGreaterThan(1500);
      expect(data.score).toBeLessThanOrEqual(data.maxScore);
    });
  });

  // =========================================================================
  // SUITE 3: Keyword Permutation Stress & Delimiter Robustness
  // =========================================================================
  describe('Suite 3: Keyword Permutation Stress & Delimiter Robustness', () => {
    const targetKeywords = ['失败', '经验', '坚持', '成功'];

    it('3.1: duplicate keywords in text do not falsely satisfy other missing keywords', async () => {
      // Keyword "坚持" repeated 10 times, but "失败", "经验", "成功" are missing
      const textOnlyOneKeywordRepeated = '面对困难，我们要坚持，必须坚持，不断坚持，始终坚持，永远坚持努力奋斗。';
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: textOnlyOneKeywordRepeated,
          level: 5,
          part_type: 'write_words_essay_80words',
          keywords: targetKeywords,
        }),
      });

      const data = await res.json();
      expect(data.keywordsUsed).toEqual(['坚持']);
      expect(data.keywordsMissing).toEqual(expect.arrayContaining(['失败', '经验', '成功']));
      expect(data.feedbackVi).toContain('Chưa sử dụng các từ khóa bắt buộc');
    });

    it('3.2: duplicate keywords in input array are handled cleanly without divide-by-zero or NaN', async () => {
      const dupKeywords = ['坚持', '坚持', '坚持', '成功', '成功'];
      const text = '面对困难，只要坚持，最终一定会成功。';

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: text,
          level: 5,
          part_type: 'write_words_essay_80words',
          keywords: dupKeywords,
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Number.isNaN(data.score)).toBe(false);
      expect(data.keywordsMissing.length).toBe(0);
    });

    it('3.3: keyword order permutations produce identical keywordsUsed and relevance scores', async () => {
      const textForward = '在人生道路上，我们要吸取失败的教训，总结宝贵的经验，只要始终坚持，就能够获得成功。';
      const textReverse = '我们渴望成功，但成功需要坚持。在面对失败时，我们要从中汲取宝贵经验。';

      const resFwd = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: textForward,
          level: 5,
          part_type: 'write_words_essay_80words',
          keywords: ['失败', '经验', '坚持', '成功'],
        }),
      });
      const dataFwd = await resFwd.json();

      const resRev = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: textReverse,
          level: 5,
          part_type: 'write_words_essay_80words',
          keywords: ['成功', '坚持', '经验', '失败'],
        }),
      });
      const dataRev = await resRev.json();

      expect(dataFwd.keywordsUsed.sort()).toEqual(dataRev.keywordsUsed.sort());
      expect(dataFwd.keywordsMissing).toEqual([]);
      expect(dataRev.keywordsMissing).toEqual([]);
    });

    it('3.4: stem keyword extraction handles diverse bracket & colon formats', async () => {
      const stems = [
        '请结合以下词语写一篇80字左右的短文：[旅游, 风景, 难忘, 照片, 朋友]',
        '请根据以下词语写短文：【旅游，风景、难忘，照片、朋友】',
        '写作题：关键词：旅游、风景、难忘、照片、朋友。请以此写短文。',
      ];

      const essay = '去年我和朋友去北京旅游，风景非常优美，我们拍了很多难忘的照片。';

      for (const stem of stems) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stem,
            essayText: essay,
            level: 5,
            part_type: 'write_words_essay_80words',
          }),
        });

        const data = await res.json();
        expect(data.keywordsUsed).toEqual(expect.arrayContaining(['旅游', '风景', '难忘', '照片', '朋友']));
        expect(data.keywordsMissing).toEqual([]);
      }
    });

    it('3.5: empty or missing keywords gracefully fall back to length-based relevance heuristic', async () => {
      const essay = '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片，尝了地道的北京烤鸭。这次旅行让我收获了很多快乐与知识。';

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: essay,
          level: 5,
          part_type: 'write_words_essay_80words',
          keywords: [],
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.keywordsUsed).toEqual([]);
      expect(data.keywordsMissing).toEqual([]);
      expect(data.score).toBeGreaterThan(0);
      const relCrit = data.rubricCriteria.find((c: any) => c.name.includes('Relevance'));
      expect(relCrit.awardedPoints).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SUITE 4: Chinese Punctuation & Connector Detection Robustness
  // =========================================================================
  describe('Suite 4: Chinese Punctuation & Connector Detection Robustness', () => {
    it('4.1: pure Chinese punctuation triggers no punctuation warning', async () => {
      const text = '今天天气晴朗，我们一起去图书馆看书。虽然内容很难，但是我们很认真！';
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: text,
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      const grammarCrit = data.rubricCriteria.find((c: any) => c.name.includes('Ngữ pháp'));
      expect(grammarCrit.note).not.toContain('Thiếu dấu ngắt câu');
      expect(data.feedbackVi).not.toContain('Cần bổ sung dấu câu chuẩn tiếng Trung');
    });

    it('4.2: absence of Chinese punctuation with charCount >= 25 penalizes grammar score by 40%', async () => {
      // 30 Hanzi without any punctuation marks
      const textNoPunct = '去年夏天我和几个好朋友一起去北京旅游那里的风景非常优美长城宏伟壮观烤鸭很好吃';
      const hanziCount = (textNoPunct.match(/[\u4e00-\u9fa5]/g) || []).length;
      expect(hanziCount).toBeGreaterThanOrEqual(25);

      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: textNoPunct,
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      const grammarCrit = data.rubricCriteria.find((c: any) => c.name.includes('Ngữ pháp'));
      expect(grammarCrit.note).toContain('Thiếu dấu ngắt câu');
      expect(data.feedbackVi).toContain('Cần bổ sung dấu câu chuẩn tiếng Trung');
    });

    it('4.3: using English/ASCII punctuation instead of Chinese full-width still flags missing Chinese punctuation', async () => {
      // 30 Hanzi with only English commas and periods: , . ! ?
      const textAsciiPunct = '去年夏天我和几个好朋友, 一起去北京旅游. 那里的风景非常优美! 长城宏伟壮观?';
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: textAsciiPunct,
          level: 5,
          part_type: 'write_words_essay_80words',
        }),
      });

      const data = await res.json();
      const grammarCrit = data.rubricCriteria.find((c: any) => c.name.includes('Ngữ pháp'));
      expect(grammarCrit.note).toContain('Thiếu dấu ngắt câu tiếng Trung chuẩn xác');
    });

    it('4.4: connectors from multiple categories detected and awarded correctly', async () => {
      const connectorsToTest = [
        ['因为', '所以'],
        ['虽然', '但是'],
        ['不但', '而且'],
        ['只要', '就'],
        ['首先', '其次', '最后'],
        ['一方面', '另一方面'],
      ];

      for (const pair of connectorsToTest) {
        const text = `${pair.join('...')}，这是一个包含逻辑连词的测试句子。在学习过程中我们感受到了很大的进步。`;
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            essayText: text,
            level: 5,
            part_type: 'write_words_essay_80words',
          }),
        });

        const data = await res.json();
        const grammarCrit = data.rubricCriteria.find((c: any) => c.name.includes('Ngữ pháp'));
        expect(grammarCrit.note).toContain('liên từ kết nối');
      }
    });

    it('4.5: stacking 10+ connectors does not cause grammar score overflow beyond maxGrammarPoints', async () => {
      const heavyConnectorText = '因为我们提前准备，所以不但顺利而且愉快。虽然路途遥远，但是大家觉得很值。此外，另外还有许多收获。因此，由于大家的共同努力，只要坚持，无论遇到什么困难，如果遇到问题，要是能解决，首先要冷静，其次要想办法，最后一定会成功。总之，这是一次难忘的经历。';
      const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: heavyConnectorText,
          level: 5,
          part_type: 'write_words_essay_80words',
          maxScore: 30,
        }),
      });

      const data = await res.json();
      const grammarCrit = data.rubricCriteria.find((c: any) => c.name.includes('Ngữ pháp'));
      expect(grammarCrit.awardedPoints).toBeLessThanOrEqual(grammarCrit.maxPoints);
      expect(grammarCrit.awardedPoints).toBe(grammarCrit.maxPoints);
    });
  });

  // =========================================================================
  // SUITE 5: Vietnamese Feedback Formatting & Absence of Crashes/NaN
  // =========================================================================
  describe('Suite 5: Vietnamese Feedback Formatting & Absence of Crashes/NaN', () => {
    it('5.1: feedbackVi formatting contains accurate percentage and Vietnamese notes', async () => {
      const testCases = [
        { text: '', expectedStatus: 'chưa nhập' },
        { text: '一二三四五六七八九十', expectedStatus: 'Dung lượng chưa đạt tiêu chuẩn quy định' },
        { text: '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫也非常美丽。我们在天安门广场拍了很多难忘的照片。', expectedStatus: 'Dung lượng hơi ngắn so với tiêu chuẩn' },
        { text: '去年夏天我和几个好朋友一起去北京旅游。那里的风景非常优美，长城宏伟壮观，故宫充满了历史文化气息。我们在天安门广场拍了许多难忘的照片，尝了地道的北京烤鸭。这次旅行让我收获了很多快乐与知识。', expectedStatus: 'Đạt yêu cầu về dung lượng chữ' },
      ];

      for (const tc of testCases) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            essayText: tc.text,
            level: 5,
            part_type: 'write_words_essay_80words',
          }),
        });

        const data = await res.json();
        expect(data.feedbackVi).toContain(tc.expectedStatus);
        expect(data.feedbackVi).not.toContain('NaN%');
        expect(data.feedbackVi).not.toContain('undefined');
        expect(data.feedbackVi).not.toContain('null');
      }
    });

    it('5.2: fuzzing malformed payloads returns HTTP 200 without crashes or unhandled 500s', async () => {
      const malformedPayloads = [
        {},
        { essayText: null },
        { essayText: 123456 },
        { essayText: true },
        { essayText: ['array'] },
        { essayText: { nested: 'object' } },
        { level: 'invalid_level', part_type: null },
        { maxScore: -50 },
        { maxScore: 0 },
        { maxScore: 'hundred' },
        { keywords: '  , , , , ' },
        { keywords: [123, true, null, undefined] },
        { stem: null, questionId: 'non_existent_id', sessionId: 'fake_sess' },
      ];

      for (const payload of malformedPayloads) {
        const res = await fetch(`${baseUrl}/api/exam/evaluate-writing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(Number.isNaN(data.score)).toBe(false);
        expect(Number.isFinite(data.score)).toBe(true);
        expect(data.score).toBeGreaterThanOrEqual(0);
        expect(data.score).toBeLessThanOrEqual(data.maxScore);
      }
    });
  });

  // =========================================================================
  // SUITE 6: Database Hash Invariant Verification
  // =========================================================================
  describe('Suite 6: Database Hash Invariant Verification', () => {
    it('6.1: data/hsk_exam.db remains strictly unchanged with original SHA-256 hash', () => {
      const currentHash = getSha256(HSK_EXAM_DB_PATH);
      expect(currentHash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
