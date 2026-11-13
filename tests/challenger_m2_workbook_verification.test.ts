import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';

import {
  WorkbookView,
  getEnrichedWorkbookLessons,
  getEnrichedWorkbookLesson,
} from '../src/components/Coursebook/WorkbookView';
import {
  HSK1_WORKBOOK_LESSONS,
  HSK1_OFFICIAL_MOCK_EXAM,
} from '../src/data/hsk1WorkbookData';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { enrichWorkbookLesson } from '../src/data/workbookEnricher';

describe('Challenger M2 Verification: Workbook Authentic Alignment & Mock Exam Integrity', () => {
  const rootDir = process.cwd();
  const workbookEnricherPath = path.resolve(rootDir, 'src/data/workbookEnricher.ts');
  const hsk1WorkbookDataPath = path.resolve(rootDir, 'src/data/hsk1WorkbookData.ts');

  // =========================================================================
  // Mission Item 1: Fake question generator loops and synthetic mock IDs removal
  // =========================================================================
  describe('1. Absence of Fake Mock Generators in src/data/workbookEnricher.ts', () => {
    const enricherSource = fs.readFileSync(workbookEnricherPath, 'utf-8');

    it('must have ZERO occurrences of while loops for mockListening / mockReading', () => {
      expect(enricherSource).not.toContain('while (mockListening.length < 3)');
      expect(enricherSource).not.toContain('while (enrichedListening.length < 3');
      expect(enricherSource).not.toContain('while (mockReading.length < 3)');
      expect(enricherSource).not.toContain('while (enrichedReading.length < 3');
    });

    it('must have ZERO synthetic mock question IDs (enrich_mock_... or enrich_l*_n*_listen/read)', () => {
      expect(enricherSource).not.toContain('enrich_mock_');
      expect(enricherSource).not.toMatch(/id:\s*`enrich_l\$\{level\}_n\$\{lessonNumber\}_listen/);
      expect(enricherSource).not.toMatch(/id:\s*`enrich_l\$\{level\}_n\$\{lessonNumber\}_read/);
    });

    it('empirically verifies Lessons 1-3 do not have synthetic enrich_mock_ or enrich_l*_listen IDs after enrichment', () => {
      for (const lessonNum of [1, 2, 3]) {
        const tbLesson = NEW_HSK1_FULL_LESSONS.find((l) => l.lessonNumber === lessonNum);
        expect(tbLesson, `Lesson ${lessonNum} must exist in NEW_HSK1_FULL_LESSONS`).toBeDefined();

        const rawWbLesson = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === lessonNum);
        const enriched = enrichWorkbookLesson(1, tbLesson!, rawWbLesson);

        // Ensure no synthetic IDs in listening or reading
        enriched.listeningExercises.forEach((item) => {
          expect(item.id).not.toContain('enrich_mock_');
          expect(item.id).not.toMatch(/enrich_l\d+_n\d+_listen/);
        });
        enriched.readingExercises.forEach((item) => {
          expect(item.id).not.toContain('enrich_mock_');
          expect(item.id).not.toMatch(/enrich_l\d+_n\d+_read/);
        });
      }
    });

    it('empirically verifies Lessons 4-15 have authentic mock drills populated without synthetic fallback IDs', () => {
      for (let lNum = 4; lNum <= 15; lNum++) {
        const tbLesson = NEW_HSK1_FULL_LESSONS.find((l) => l.lessonNumber === lNum);
        const rawWbLesson = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === lNum);
        const enriched = enrichWorkbookLesson(1, tbLesson!, rawWbLesson);

        const totalMock = enriched.listeningExercises.length + enriched.readingExercises.length;
        expect(
          totalMock,
          `Lesson ${lNum} must have authentic mock drills from FLTRP workbook`
        ).toBeGreaterThanOrEqual(1);

        // Check each exercise ID
        enriched.listeningExercises.forEach((ex) => {
          expect(ex.id).not.toContain('enrich_mock_');
          expect(ex.id).not.toContain('enrich_l');
        });
        enriched.readingExercises.forEach((ex) => {
          expect(ex.id).not.toContain('enrich_mock_');
          expect(ex.id).not.toContain('enrich_l');
        });
      }
    });
  });

  // =========================================================================
  // Mission Item 2: HSK1_OFFICIAL_MOCK_EXAM verification (40 Qs, Q13-15 vs PDF p.126)
  // =========================================================================
  describe('2. HSK1_OFFICIAL_MOCK_EXAM Schema & PDF Page 126 Alignment', () => {
    it('must contain exactly 40 questions in total', () => {
      expect(HSK1_OFFICIAL_MOCK_EXAM.length).toBe(40);
    });

    it('must have exactly 20 listening questions and 20 reading questions', () => {
      const listeningQuestions = HSK1_OFFICIAL_MOCK_EXAM.filter((q) => q.section === 'listening');
      const readingQuestions = HSK1_OFFICIAL_MOCK_EXAM.filter((q) => q.section === 'reading');

      expect(listeningQuestions.length).toBe(20);
      expect(readingQuestions.length).toBe(20);
    });

    it('must have continuous sequential numbering from 1 to 40 without gaps', () => {
      const listeningNums = HSK1_OFFICIAL_MOCK_EXAM
        .filter((q) => q.section === 'listening')
        .map((q) => q.questionNumber);
      const readingNums = HSK1_OFFICIAL_MOCK_EXAM
        .filter((q) => q.section === 'reading')
        .map((q) => q.questionNumber);

      expect(listeningNums).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
      expect(readingNums).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);
    });

    it('must have exactly 4 parts of 5 questions each in both listening and reading', () => {
      for (const section of ['listening', 'reading'] as const) {
        for (let part = 1; part <= 4; part++) {
          const partQs = HSK1_OFFICIAL_MOCK_EXAM.filter(
            (q) => q.section === section && q.part === part
          );
          expect(partQs.length, `${section} part ${part} must have 5 questions`).toBe(5);
        }
      }
    });

    it('verifies Questions 13, 14, 15 match PDF page 126 (Book page 125) verbatim', () => {
      // In PDF Page 126 (Book p.125), Listening Part 3 (第11-15题):
      // Example: Handshake -> Picture C (女: 你好！男: 你好！很高兴认识你。-> C)
      // Picture A: Doctor on telephone
      // Picture B: Chairs (wooden chairs)
      // Picture D: People in movie theater
      // Picture E: Woman sweating in front of electric fan
      // Picture F: Child sleeping on bed

      // Question 11 -> Picture A (去医院看看)
      const q11 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q11');
      expect(q11).toBeDefined();
      expect(q11?.correctKey).toBe('A');

      // Question 12 -> Picture B (请坐，喝点儿茶吧)
      const q12 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q12');
      expect(q12).toBeDefined();
      expect(q12?.correctKey).toBe('B');

      // Question 13 -> Picture E (今天太热了，我们开风扇吧)
      const q13 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q13');
      expect(q13).toBeDefined();
      expect(q13?.section).toBe('listening');
      expect(q13?.part).toBe(3);
      expect(q13?.questionNumber).toBe(13);
      expect(q13?.correctKey).toBe('E');
      expect(q13?.audioScript).toContain('Jīntiān tài rè le');
      expect(q13?.audioScript).toContain('kāi fēngshàn ba');
      const optE13 = q13?.options.find((o) => o.key === 'E');
      expect(optE13).toBeDefined();
      expect(optE13?.textVietnamese).toMatch(/nóng|quạt/i);

      // Question 14 -> Picture D (我们一起去看电影吧)
      const q14 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q14');
      expect(q14).toBeDefined();
      expect(q14?.section).toBe('listening');
      expect(q14?.part).toBe(3);
      expect(q14?.questionNumber).toBe(14);
      expect(q14?.correctKey).toBe('D');
      expect(q14?.audioScript).toContain('qù kàn diànyǐng ba');
      const optD14 = q14?.options.find((o) => o.key === 'D');
      expect(optD14).toBeDefined();
      expect(optD14?.textVietnamese).toMatch(/phim|rạp/i);

      // Question 15 -> Picture F (孩子在床上睡觉呢)
      const q15 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q15');
      expect(q15).toBeDefined();
      expect(q15?.section).toBe('listening');
      expect(q15?.part).toBe(3);
      expect(q15?.questionNumber).toBe(15);
      expect(q15?.correctKey).toBe('F');
      expect(q15?.audioScript).toContain('shuìjiào ne');
      const optF15 = q15?.options.find((o) => o.key === 'F');
      expect(optF15).toBeDefined();
      expect(optF15?.textVietnamese).toMatch(/ngủ|giường/i);
    });
  });

  // =========================================================================
  // Mission Item 3: WorkbookView rendering without crash on Lessons 1-3
  // =========================================================================
  describe('3. WorkbookView React Rendering for Lessons 1-3', () => {
    it('renders cleanly on Lesson 1 without crashing and renders authentic subtabs', () => {
      const l1Data = NEW_HSK1_FULL_LESSONS.find((l) => l.lessonNumber === 1);
      const html = renderToString(
        React.createElement(WorkbookView, {
          hskLevel: 1,
          currentLessonNumber: 1,
          currentLesson: l1Data,
        })
      );

      expect(html).toContain('id="workbook-root-container"');
      expect(html).toMatch(/Bài (?:<!-- -->)?1/);
      expect(html).toContain('Sách Bài Tập');
      expect(html).toContain('Nghe Đọc Luyện (听读练)');
    });

    it('renders cleanly on Lesson 2 without crashing and presents authentic subtabs', () => {
      const l2Data = NEW_HSK1_FULL_LESSONS.find((l) => l.lessonNumber === 2);
      const html = renderToString(
        React.createElement(WorkbookView, {
          hskLevel: 1,
          currentLessonNumber: 2,
          currentLesson: l2Data,
        })
      );

      expect(html).toContain('id="workbook-root-container"');
      expect(html).toMatch(/Bài (?:<!-- -->)?2/);
      expect(html).toContain('Sách Bài Tập');
      expect(html).toContain('Nghe Đọc Luyện (听读练)');
    });

    it('renders cleanly on Lesson 3 without crashing and presents authentic subtabs', () => {
      const l3Data = NEW_HSK1_FULL_LESSONS.find((l) => l.lessonNumber === 3);
      const html = renderToString(
        React.createElement(WorkbookView, {
          hskLevel: 1,
          currentLessonNumber: 3,
          currentLesson: l3Data,
        })
      );

      expect(html).toContain('id="workbook-root-container"');
      expect(html).toMatch(/Bài (?:<!-- -->)?3/);
      expect(html).toContain('Sách Bài Tập');
      expect(html).toContain('Nghe Đọc Luyện (听读练)');
    });

    it('renders cleanly on Lesson 4 and DOES present mock_drill tab', () => {
      const l4Data = NEW_HSK1_FULL_LESSONS.find((l) => l.lessonNumber === 4);
      const html = renderToString(
        React.createElement(WorkbookView, {
          hskLevel: 1,
          currentLessonNumber: 4,
          currentLesson: l4Data,
        })
      );

      expect(html).toContain('id="workbook-root-container"');
      expect(html).toMatch(/Bài (?:<!-- -->)?4/);
      // Lesson 4 has authentic mock drills from FLTRP workbook!
      expect(html).toContain('Mô Phỏng Đề HSK (模拟训练)');
    });
  });

  // =========================================================================
  // Negative & Boundary Stress Testing
  // =========================================================================
  describe('4. Negative & Boundary Stress Testing', () => {
    it('handles unexpected currentLessonNumber outside [1, 15] gracefully', () => {
      expect(() => {
        renderToString(
          React.createElement(WorkbookView, {
            hskLevel: 1,
            currentLessonNumber: 99,
          })
        );
      }).not.toThrow();
    });

    it('handles null or empty currentLesson gracefully without exception', () => {
      expect(() => {
        renderToString(
          React.createElement(WorkbookView, {
            hskLevel: 1,
            currentLessonNumber: 1,
            currentLesson: undefined,
          })
        );
      }).not.toThrow();
    });

    it('enrichWorkbookLesson handles edge-case empty textbook lesson without crash', () => {
      const minimalLesson = {
        lessonNumber: 1,
        titleHanzi: '测试',
        titlePinyin: 'cèshì',
        titleVietnamese: 'Kiểm tra',
        vocabulary: [],
        texts: [],
        grammarPoints: [],
      } as any;

      expect(() => {
        const enriched = enrichWorkbookLesson(1, minimalLesson, undefined);
        expect(enriched.lessonNumber).toBe(1);
        expect(enriched.listeningExercises).toEqual([]);
        expect(enriched.readingExercises).toEqual([]);
      }).not.toThrow();
    });
  });
});
