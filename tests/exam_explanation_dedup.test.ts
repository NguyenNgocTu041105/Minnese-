/**
 * Test Suite: Exam Explanation Deduplication & Answer Feedback Standardization (Issue 2)
 *
 * Verifies that:
 * 1. formatConciseExplanation strips redundant transcript/question prefixes, capitalizes first character,
 *    and safely falls back to raw text if cleaned text is empty.
 * 2. formatCorrectAnswerText extracts option letter and text, stripping duplicate leading letters.
 * 3. POST /api/exam/check-answer computes and returns correctAnswerText alongside correctAnswer and explanation_vi.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  formatConciseExplanation,
  formatCorrectAnswerText,
} from '../src/components/HSKMockExam';
import {
  examRouter,
  clearAllSessionsForTesting,
  createTestExamDb,
  setExamDbForTesting,
} from '../src/server/examRoutes';

describe('Exam Explanation Deduplication & Formatting Suite (Issue 2)', () => {
  describe('1. formatConciseExplanation Utility', () => {
    it('strips listening audio transcript prefixes and preserves core reasoning', () => {
      const raw1 =
        'Nội dung bài nghe: "苹果。这是一个红色的苹果。" (Táo. Đây là một quả táo màu đỏ). Lựa chọn A "苹果" (píngguǒ - quả táo) hoàn toàn khớp với hình minh họa và lời thoại. Lựa chọn B là quả chuối, C là quả dưa hấu.';
      const cleaned1 = formatConciseExplanation(raw1);
      expect(cleaned1).toBe(
        'Lựa chọn A "苹果" (píngguǒ - quả táo) hoàn toàn khớp với hình minh họa và lời thoại. Lựa chọn B là quả chuối, C là quả dưa hấu.'
      );

      const raw2 =
        'Nội dung bài nghe: "看书。哥哥在房间里看书。" (Đọc sách. Anh trai đang đọc sách trong phòng). Cụm động từ "看书" (kànshū - đọc sách) khớp chính xác với đáp án B. A là đi ngủ (睡觉), C là uống nước (喝水).';
      const cleaned2 = formatConciseExplanation(raw2);
      expect(cleaned2).toBe(
        'Cụm động từ "看书" (kànshū - đọc sách) khớp chính xác với đáp án B. A là đi ngủ (睡觉), C là uống nước (喝水).'
      );
    });

    it('strips spoken question prefixes (Câu hỏi nghe được)', () => {
      const raw =
        'Câu hỏi nghe được: "你在做什么？" (Bạn đang làm gì?). Cụm động từ "看书" (đọc sách) là hành động phù hợp nhất.';
      const cleaned = formatConciseExplanation(raw);
      expect(cleaned).toBe(
        'Cụm động từ "看书" (đọc sách) là hành động phù hợp nhất.'
      );
    });

    it('strips text / dialogue sentence prefixes (Câu văn, Lời chào)', () => {
      const rawSentence =
        'Câu văn: "桌子上有两杯热茶。" (Trên bàn có hai tách trà nóng). Cụm danh từ chỉ vật "两杯热茶" (hai tách trà nóng) khớp chính xác với lựa chọn E.';
      const cleanedSentence = formatConciseExplanation(rawSentence);
      expect(cleanedSentence).toBe(
        'Cụm danh từ chỉ vật "两杯热茶" (hai tách trà nóng) khớp chính xác với lựa chọn E.'
      );

      const rawGreeting =
        'Lời chào làm quen: "你好，很高兴认识你！" (Xin chào, rất vui được làm quen với bạn!). Câu đáp lễ chuẩn mực tương xứng là D: "认识你我也很高兴。" (Làm quen với bạn tôi cũng rất vui).';
      const cleanedGreeting = formatConciseExplanation(rawGreeting);
      expect(cleanedGreeting).toBe(
        'Câu đáp lễ chuẩn mực tương xứng là D: "认识你我也很高兴。" (Làm quen với bạn tôi cũng rất vui).'
      );
    });

    it('strips Vietnamese meaning repetition prefixes (Câu ... nghĩa là ..., Câu này có nghĩa là ...)', () => {
      const rawMeaning1 =
        "Câu '他在图书馆看书' nghĩa là 'Anh ấy đọc sách ở thư viện'. Hành động phù hợp với hình ảnh thư viện là '看书' (đọc sách).";
      const cleanedMeaning1 = formatConciseExplanation(rawMeaning1);
      expect(cleanedMeaning1).toBe(
        "Hành động phù hợp với hình ảnh thư viện là '看书' (đọc sách)."
      );

      const rawMeaning2 =
        "Câu này có nghĩa là 'Bộ quần áo này rất đẹp, nhưng tôi không có nhiều tiền để mua.' Từ '钱' (tiền) phù hợp với ngữ cảnh giá cả và mua sắm.";
      const cleanedMeaning2 = formatConciseExplanation(rawMeaning2);
      expect(cleanedMeaning2).toBe(
        "Từ '钱' (tiền) phù hợp với ngữ cảnh giá cả và mua sắm."
      );
    });

    it('strips reading paragraph prefixes (Đoạn văn nêu rõ "..." nên...)', () => {
      const rawParagraph =
        'Đoạn văn nêu rõ "外边下雨了" nên hiện tượng thời tiết đúng là \'下雨\' (mưa).';
      const cleanedParagraph = formatConciseExplanation(rawParagraph);
      expect(cleanedParagraph).toBe(
        "Hiện tượng thời tiết đúng là '下雨' (mưa)."
      );
    });

    it('handles chained redundant prefixes iteratively', () => {
      const rawChained =
        'Nội dung bài nghe: "看书。" (Đọc sách). Câu hỏi nghe được: "他在做什么？" (Anh ấy đang làm gì?). Đáp án B là hành động đọc sách chính xác.';
      const cleanedChained = formatConciseExplanation(rawChained);
      expect(cleanedChained).toBe(
        'Đáp án B là hành động đọc sách chính xác.'
      );
    });

    it('capitalizes the first character of the remaining text', () => {
      const raw =
        'Câu văn: "外边很冷。" (Bên ngoài rất lạnh). từ "冷" (lěng) biểu thị nhiệt độ thấp.';
      const cleaned = formatConciseExplanation(raw);
      expect(cleaned.startsWith('Từ "冷"')).toBe(true);
    });

    it('falls back safely to raw text if cleaned text is empty', () => {
      const rawOnlyTranscript =
        'Nội dung bài nghe: "苹果。这是一个红色的苹果。" (Táo. Đây là một quả táo màu đỏ).';
      const cleaned = formatConciseExplanation(rawOnlyTranscript);
      expect(cleaned).toBe(rawOnlyTranscript);
    });

    it('safely handles empty strings, null, and undefined without throwing', () => {
      expect(formatConciseExplanation('')).toBe('');
      expect(formatConciseExplanation('   ')).toBe('');
      expect(formatConciseExplanation(null as any)).toBe('');
      expect(formatConciseExplanation(undefined as any)).toBe('');
    });

    it('preserves already clean explanation text without modification', () => {
      const cleanText =
        'Từ "喜欢" (xǐhuan) có nghĩa là yêu thích, hoàn toàn khớp với câu hỏi sở thích.';
      expect(formatConciseExplanation(cleanText)).toBe(cleanText);
    });
  });

  describe('2. formatCorrectAnswerText Utility', () => {
    it('formats option when options already contain leading letters', () => {
      const options = ['A. 睡觉 (shuìjiào)', 'B. 看书 (kànshū)', 'C. 喝水 (hēshuǐ)'];
      expect(formatCorrectAnswerText(options, 1)).toBe('B. 看书 (kànshū)');
      expect(formatCorrectAnswerText(options, 0)).toBe('A. 睡觉 (shuìjiào)');
      expect(formatCorrectAnswerText(options, 2)).toBe('C. 喝水 (hēshuǐ)');
    });

    it('formats option when options do not contain leading letters', () => {
      const options = ['睡觉 (shuìjiào)', '看书 (kànshū)', '喝水 (hēshuǐ)'];
      expect(formatCorrectAnswerText(options, 1)).toBe('B. 看书 (kànshū)');
      expect(formatCorrectAnswerText(options, 0)).toBe('A. 睡觉 (shuìjiào)');
    });

    it('formats option with colon or space separators cleanly', () => {
      const options1 = ['A: 苹果', 'B: 香蕉'];
      expect(formatCorrectAnswerText(options1, 0)).toBe('A. 苹果');
      expect(formatCorrectAnswerText(options1, 1)).toBe('B. 香蕉');

      const options2 = ['A 苹果', 'B 香蕉'];
      expect(formatCorrectAnswerText(options2, 1)).toBe('B. 香蕉');
    });

    it('normalizes letter to match answerIndex even if option string had mismatched letter', () => {
      const mismatched = ['B. 看书 (kànshū)'];
      expect(formatCorrectAnswerText(mismatched, 0)).toBe('A. 看书 (kànshū)');
    });

    it('handles edge cases safely (empty array, null, out-of-bounds)', () => {
      expect(formatCorrectAnswerText([], 2)).toBe('');
      expect(formatCorrectAnswerText(null, 3)).toBe('');
      expect(formatCorrectAnswerText(undefined, 0)).toBe('');
      expect(formatCorrectAnswerText(['A. 苹果'], -1)).toBe('A. 苹果');
    });
  });

  describe('3. POST /api/exam/check-answer Backend Endpoint', () => {
    let app: Express;
    let server: Server;
    let baseUrl: string;
    let activeSessionId: string;
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

      const createRes = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });
      const data = await createRes.json();
      activeSessionId = data.session.sessionId;
    });

    afterAll(async () => {
      setExamDbForTesting(null);
      clearAllSessionsForTesting();
      try {
        memDb?.close();
      } catch {}
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('returns success: true, isCorrect: true, correctAnswer, and correctAnswerText on correct answer', async () => {
      const res = await fetch(`${baseUrl}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, questionId: 'hsk1-mock-q02', userAnswer: 1 }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCorrect).toBe(true);
      expect(data.correctAnswer).toBe(1);
      expect(data.correctAnswerText).toBe('B. 看书 (kànshū)');
      expect(typeof data.explanation_vi).toBe('string');
      expect(data.explanation_vi.length).toBeGreaterThan(0);
    });

    it('returns success: true, isCorrect: false, and correctAnswerText on incorrect answer', async () => {
      const res = await fetch(`${baseUrl}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, questionId: 'hsk1-mock-q02', userAnswer: 0 }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCorrect).toBe(false);
      expect(data.correctAnswer).toBe(1);
      expect(data.correctAnswerText).toBe('B. 看书 (kànshū)');
      expect(typeof data.explanation_vi).toBe('string');
      expect(data.explanation_vi.length).toBeGreaterThan(0);
    });

    it('returns 400 when questionId or userAnswer is missing', async () => {
      const res = await fetch(`${baseUrl}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, questionId: 'hsk1-mock-q02' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('returns 404 when questionId does not exist', async () => {
      const res = await fetch(`${baseUrl}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, questionId: 'non-existent-question-id', userAnswer: 0 }),
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });
});
