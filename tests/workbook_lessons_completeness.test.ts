import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../src/data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../src/data/newHsk4BookData';
import { NEW_HSK5_FULL_LESSONS } from '../src/data/newHsk5BookData';
import { NEW_HSK6_FULL_LESSONS } from '../src/data/newHsk6BookData';

import {
  getEnrichedWorkbookLesson,
  getEnrichedWorkbookLessons,
  EnrichedWorkbookLesson,
} from '../src/data/workbookEnricher';
import { HSK1_WORKBOOK_LESSONS } from '../src/data/hsk1WorkbookData';
import { HSK2_WORKBOOK_LESSONS } from '../src/data/hsk2WorkbookData';
import {
  getEnrichedWorkbookLessons as exportedFromView,
  getEnrichedWorkbookLesson as exportedLessonFromView,
} from '../src/components/Coursebook/WorkbookView';

describe('Workbook Lessons Completeness & Mode Streamlining Suite', () => {
  const ALL_LEVELS = [
    { level: 1, lessons: NEW_HSK1_FULL_LESSONS },
    { level: 2, lessons: NEW_HSK2_FULL_LESSONS },
    { level: 3, lessons: NEW_HSK3_FULL_LESSONS },
    { level: 4, lessons: NEW_HSK4_FULL_LESSONS },
    { level: 5, lessons: NEW_HSK5_FULL_LESSONS },
    { level: 6, lessons: NEW_HSK6_FULL_LESSONS },
  ];

  describe('1. 100% Lessons Completeness & Curriculum Title Synchronization (HSK 1-6)', () => {
    ALL_LEVELS.forEach(({ level, lessons }) => {
      it(`HSK ${level}: all enriched lessons (${lessons.length}+) must have complete exercises matching curriculum`, () => {
        const enrichedLessons = getEnrichedWorkbookLessons(level);
        expect(enrichedLessons.length).toBeGreaterThanOrEqual(lessons.length);

        enrichedLessons.forEach((wbLesson) => {
          // 1. Title and lesson number synchronization
          expect(wbLesson.lessonNumber).toBeGreaterThanOrEqual(1);
          expect(wbLesson.titleChinese).toBeTruthy();
          expect(wbLesson.titleVietnamese).toBeTruthy();

          // 2. Listening exercises >= 3
          expect(wbLesson.listeningExercises).toBeDefined();
          expect(wbLesson.listeningExercises.length).toBeGreaterThanOrEqual(3);
          wbLesson.listeningExercises.forEach((item, idx) => {
            expect(item.id, `HSK ${level} L${wbLesson.lessonNumber} listening ${idx} must have id`).toBeTruthy();
            expect(item.audioScript, `HSK ${level} L${wbLesson.lessonNumber} listening ${idx} must have audioScript`).toBeTruthy();
            expect(item.options.length, `HSK ${level} L${wbLesson.lessonNumber} listening ${idx} options count`).toBeGreaterThanOrEqual(2);
            expect(item.correctKey, `HSK ${level} L${wbLesson.lessonNumber} listening ${idx} must have correctKey`).toBeTruthy();
            expect(item.explanation, `HSK ${level} L${wbLesson.lessonNumber} listening ${idx} must have explanation`).toBeTruthy();
          });

          // 3. Reading exercises >= 3
          expect(wbLesson.readingExercises).toBeDefined();
          expect(wbLesson.readingExercises.length).toBeGreaterThanOrEqual(3);
          wbLesson.readingExercises.forEach((item, idx) => {
            expect(item.id, `HSK ${level} L${wbLesson.lessonNumber} reading ${idx} must have id`).toBeTruthy();
            expect(item.promptChinese, `HSK ${level} L${wbLesson.lessonNumber} reading ${idx} must have promptChinese`).toBeTruthy();
            expect(item.options.length, `HSK ${level} L${wbLesson.lessonNumber} reading ${idx} options count`).toBeGreaterThanOrEqual(2);
            expect(item.correctKey, `HSK ${level} L${wbLesson.lessonNumber} reading ${idx} must have correctKey`).toBeTruthy();
            expect(item.explanation, `HSK ${level} L${wbLesson.lessonNumber} reading ${idx} must have explanation`).toBeTruthy();
          });

          // 4. Listen & read drills >= 2 groups
          expect(wbLesson.listenAndReadDrills).toBeDefined();
          expect(wbLesson.listenAndReadDrills.length).toBeGreaterThanOrEqual(2);
          wbLesson.listenAndReadDrills.forEach((drill, dIdx) => {
            expect(drill.title, `HSK ${level} L${wbLesson.lessonNumber} drill ${dIdx} must have title`).toBeTruthy();
            expect(drill.items.length, `HSK ${level} L${wbLesson.lessonNumber} drill ${dIdx} must have items`).toBeGreaterThanOrEqual(1);
            drill.items.forEach((it) => {
              expect(it.audioText).toBeTruthy();
              expect(it.correctAnswer).toBeTruthy();
              expect(it.options.length).toBeGreaterThanOrEqual(1);
            });
          });

          // 5. Word expansion: fillInBlanks >= 3, combinations, wordBank
          expect(wbLesson.wordExpansion).toBeDefined();
          expect(wbLesson.wordExpansion.fillInBlanks.length).toBeGreaterThanOrEqual(3);
          expect(wbLesson.wordExpansion.exercises.length).toBeGreaterThanOrEqual(3);
          expect(wbLesson.wordExpansion.combinations.length).toBeGreaterThanOrEqual(1);
          expect(wbLesson.wordExpansion.wordBank.length).toBeGreaterThanOrEqual(1);
          wbLesson.wordExpansion.fillInBlanks.forEach((fib, fIdx) => {
            expect(fib.sentenceWithBlank, `HSK ${level} L${wbLesson.lessonNumber} fib ${fIdx} sentenceWithBlank`).toBeTruthy();
            expect(fib.options.length, `HSK ${level} L${wbLesson.lessonNumber} fib ${fIdx} options`).toBeGreaterThanOrEqual(2);
            expect(fib.correctAnswer, `HSK ${level} L${wbLesson.lessonNumber} fib ${fIdx} correctAnswer`).toBeTruthy();
          });

          // 6. Writing exercises >= 2
          expect(wbLesson.writingExercises).toBeDefined();
          expect(wbLesson.writingExercises.length).toBeGreaterThanOrEqual(2);
          wbLesson.writingExercises.forEach((w, wIdx) => {
            const hanzi = w.hanzi || w.word || w.correctAnswer;
            expect(hanzi, `HSK ${level} L${wbLesson.lessonNumber} writing ${wIdx} must have hanzi`).toBeTruthy();
          });

          // 7. Phonetics & Hanzi section always present
          expect(wbLesson.phonetics).toBeDefined();
          expect(wbLesson.phonetics!.length).toBeGreaterThanOrEqual(1);
          expect(wbLesson.hanziSection).toBeDefined();
        });
      });
    });

    it('HSK 1 Lesson 14 must have synchronized title: 她买了不少衣服 (Cô ấy đã mua không ít quần áo)', () => {
      const lesson14 = getEnrichedWorkbookLesson(1, 14);
      expect(lesson14.lessonNumber).toBe(14);
      expect(lesson14.titleChinese).toBe('她买了不少衣服');
      expect(lesson14.titleVietnamese).toBe('Cô ấy đã mua không ít quần áo');
    });

    it('HSK 3 must contain all 15 workbook lessons without dropping lessons 11-15', () => {
      const hsk3Lessons = getEnrichedWorkbookLessons(3);
      expect(hsk3Lessons.length).toBeGreaterThanOrEqual(15);

      for (let lNum = 11; lNum <= 15; lNum++) {
        const lesson = getEnrichedWorkbookLesson(3, lNum);
        expect(lesson.lessonNumber).toBe(lNum);
        expect(lesson.listeningExercises.length).toBeGreaterThanOrEqual(3);
        expect(lesson.readingExercises.length).toBeGreaterThanOrEqual(3);
        expect(lesson.listenAndReadDrills.length).toBeGreaterThanOrEqual(2);
        expect(lesson.wordExpansion.fillInBlanks.length).toBeGreaterThanOrEqual(3);
        expect(lesson.writingExercises.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('HSK 6 Lesson 2 must retain 父母之爱 and not fall back to lesson 1', () => {
      const hsk6Lessons = getEnrichedWorkbookLessons(6);
      const l2FromList = hsk6Lessons.find((l) => l.lessonNumber === 2);
      expect(l2FromList).toBeDefined();
      expect(l2FromList?.titleChinese).toBe('父母之爱');

      const l2 = getEnrichedWorkbookLesson(6, 2);
      expect(l2.lessonNumber).toBe(2);
      expect(l2.titleChinese).toBe('父母之爱');
      expect(l2.titleVietnamese).toBe('Tình yêu thương của cha mẹ');
      expect(l2.listeningExercises.length).toBeGreaterThanOrEqual(3);
      expect(l2.readingExercises.length).toBeGreaterThanOrEqual(3);
    });

    it('HSK 5 and HSK 6 lessons after lesson 3 must not fall back to lesson 1', () => {
      // HSK 5 lessons 4 & 5
      const hsk5L4 = getEnrichedWorkbookLesson(5, 4);
      expect(hsk5L4.lessonNumber).toBe(4);
      expect(hsk5L4.titleChinese).toBe('子路背米');
      expect(hsk5L4.listeningExercises.length).toBeGreaterThanOrEqual(3);

      const hsk5L5 = getEnrichedWorkbookLesson(5, 5);
      expect(hsk5L5.lessonNumber).toBe(5);
      expect(hsk5L5.titleChinese).toBe('济南的泉水');
      expect(hsk5L5.readingExercises.length).toBeGreaterThanOrEqual(3);

      // HSK 6 lessons 4, 5, 6
      const hsk6L4 = getEnrichedWorkbookLesson(6, 4);
      expect(hsk6L4.lessonNumber).toBe(4);
      expect(hsk6L4.titleChinese).toBe('完美的胜利');
      expect(hsk6L4.listeningExercises.length).toBeGreaterThanOrEqual(3);

      const hsk6L5 = getEnrichedWorkbookLesson(6, 5);
      expect(hsk6L5.lessonNumber).toBe(5);
      expect(hsk6L5.titleChinese).toBe('学一门外语需要理由吗？');
      expect(hsk6L5.readingExercises.length).toBeGreaterThanOrEqual(3);

      const hsk6L6 = getEnrichedWorkbookLesson(6, 6);
      expect(hsk6L6.lessonNumber).toBe(6);
      expect(hsk6L6.titleChinese).toBe('喝着茶，聊着天');
      expect(hsk6L6.writingExercises.length).toBeGreaterThanOrEqual(2);
    });

    it('Arbitrary lesson query beyond declared textbook must synthesize and never fall back to Lesson 1', () => {
      const hsk5L10 = getEnrichedWorkbookLesson(5, 10);
      expect(hsk5L10.lessonNumber).toBe(10);
      expect(hsk5L10.listeningExercises.length).toBeGreaterThanOrEqual(3);
      expect(hsk5L10.readingExercises.length).toBeGreaterThanOrEqual(3);
      expect(hsk5L10.writingExercises.length).toBeGreaterThanOrEqual(2);

      const hsk6L10 = getEnrichedWorkbookLesson(6, 10);
      expect(hsk6L10.lessonNumber).toBe(10);
      expect(hsk6L10.listeningExercises.length).toBeGreaterThanOrEqual(3);
    });

    it('Writing exercises preserve sentenceContext for intermediate/advanced levels', () => {
      const hsk4L1 = getEnrichedWorkbookLesson(4, 1);
      const sentenceRearrangeEx = hsk4L1.writingExercises.find((w) => Boolean(w.sentenceContext));
      expect(sentenceRearrangeEx).toBeDefined();
      expect(sentenceRearrangeEx?.sentenceContext).toContain('/');
      expect(sentenceRearrangeEx?.correctAnswer).toBeTruthy();
    });

    it('Helper functions must be exported and usable directly from WorkbookView.tsx', () => {
      expect(typeof exportedFromView).toBe('function');
      expect(typeof exportedLessonFromView).toBe('function');

      const wbLessons = exportedFromView(1);
      expect(wbLessons.length).toBe(15);
      const l1 = exportedLessonFromView(1, 1);
      expect(l1.lessonNumber).toBe(1);
      expect(l1.listeningExercises.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('2. WorkbookView Component Code & UI Architecture Verification', () => {
    const workbookViewPath = path.resolve(__dirname, '../src/components/Coursebook/WorkbookView.tsx');
    const sourceCode = fs.readFileSync(workbookViewPath, 'utf-8');

    it('compact navigation bar must contain 2 view modes: lesson_workbook and ai_generated_exam', () => {
      // Extract the mode switcher container block in the compact navigation bar
      const modeSwitcherRegex = /{\/\*\s*Mode Switcher[^*]*\*\/}([\s\S]*?)<\/div>/i;
      const match = sourceCode.match(modeSwitcherRegex);
      expect(match, 'Mode Switcher block must exist in WorkbookView.tsx').toBeTruthy();
      const modeSwitcherCode = match ? match[1] : '';

      // Must contain button for lesson_workbook
      expect(modeSwitcherCode).toContain("setViewMode('lesson_workbook')");
      // Must contain button for ai_generated_exam
      expect(modeSwitcherCode).toContain("setViewMode('ai_generated_exam')");

      // Mode switcher MUST NOT offer official_mock_exam
      expect(modeSwitcherCode).not.toContain("setViewMode('official_mock_exam')");
      expect(modeSwitcherCode).not.toContain('Đề Thi Thử Chuẩn');
    });

    it('must default subTab to mock_drill and place mock_drill first in availableSubTabs', () => {
      // Default state initialization
      expect(sourceCode).toContain("useState<'mock_drill' | 'listen_read' | 'word_expansion' | 'writing' | 'xiaoyu'>('mock_drill')");

      // Available subtabs must order mock_drill first
      const availableSubTabsRegex = /availableSubTabs\s*=\s*useMemo\(\(\)\s*=>\s*{([\s\S]*?)return\s+rawTabs/i;
      const match = sourceCode.match(availableSubTabsRegex);
      expect(match, 'availableSubTabs useMemo block must exist').toBeTruthy();
      const code = match ? match[1] : '';

      const mockDrillIndex = code.indexOf("id: 'mock_drill'");
      const listenReadIndex = code.indexOf("id: 'listen_read'");
      const wordExpIndex = code.indexOf("id: 'word_expansion'");
      const xiaoyuIndex = code.indexOf("id: 'xiaoyu'");

      expect(mockDrillIndex).toBeGreaterThan(-1);
      expect(mockDrillIndex).toBeLessThan(listenReadIndex);
      expect(mockDrillIndex).toBeLessThan(wordExpIndex);
      expect(mockDrillIndex).toBeLessThan(xiaoyuIndex);
    });

    it('must completely eliminate green banner and redundant workbook-lesson-select dropdown', () => {
      // 1. Verify absence of green banner gradient classes
      expect(sourceCode).not.toContain('from-teal-800 via-emerald-900 to-slate-950');
      expect(sourceCode).not.toContain('from-teal-800');
      expect(sourceCode).not.toContain('Cấp độ Sách Bài Tập:');

      // 2. Verify absence of redundant workbook lesson select dropdown
      expect(sourceCode).not.toContain('id="workbook-lesson-select"');
      expect(sourceCode).not.toContain('Sách Bài Tập Theo Bài Học');
      expect(sourceCode).not.toContain('SÁCH BÀI TẬP THEO BÀI HỌC');
    });

    it('must synchronize props (hskLevel, currentLessonNumber) and reset answer states upon lesson switch', () => {
      // Props interface checks
      expect(sourceCode).toContain('hskLevel');
      expect(sourceCode).toContain('currentLessonNumber');

      // State synchronization hooks
      expect(sourceCode).toMatch(/setSelectedHskLevel\s*\(\s*hskLevel/);
      expect(sourceCode).toMatch(/setSelectedLessonNum\s*\(\s*currentLessonNumber/);

      // Answer reset when lesson or level changes
      expect(sourceCode).toMatch(/setUserAnswers\s*\(\s*\{\s*\}\s*\)/);
      expect(sourceCode).toMatch(/setIsAnswerSubmitted\s*\(\s*\{\s*\}\s*\)/);
    });

    it('CoursebookView passes active lesson props directly into WorkbookView', () => {
      const coursebookViewPath = path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx');
      const coursebookSource = fs.readFileSync(coursebookViewPath, 'utf-8');

      expect(coursebookSource).toContain('<WorkbookView');
      expect(coursebookSource).toMatch(/hskLevel=\{selectedHskLevel\}/);
      expect(coursebookSource).toMatch(/currentLessonNumber=\{currentLesson\.lessonNumber\}/);
      expect(coursebookSource).toMatch(/currentLesson=\{currentLesson\}/);
    });

    it('must have CTA button at end of Xiaoyu tab switching to mock_drill', () => {
      expect(sourceCode).toContain("onClick={() => setSubTab('mock_drill')}");
      expect(sourceCode).toContain('Làm bài tập thực hành của Bài');
    });

    it('auto-redirects official_mock_exam to lesson_workbook if accidentally entered', () => {
      expect(sourceCode).toMatch(/official_mock_exam[\s\S]*?setViewMode\(['"]lesson_workbook['"]\)/);
    });
  });

  describe('3. Authentic Workbook Exercises from Source PDFs (HSK 1 & HSK 2)', () => {
    it('HSK 1 Lessons 12, 13, and 14 contain authentic extracted questions from SBT HSK1 (3.0).pdf', () => {
      // Lesson 12: 昨天下了雪 (PDF p. 084-092)
      const l12 = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 12);
      expect(l12, 'HSK 1 Lesson 12 must be present in raw data').toBeDefined();
      expect(l12?.titleChinese).toBe('昨天下了雪');
      expect((l12?.hskMockListening?.length || 0) + (l12?.hskMockReading?.length || 0)).toBeGreaterThanOrEqual(2);

      // Verify authentic Chinese characters in Lesson 12
      const l12AllText = JSON.stringify(l12);
      expect(l12AllText).toContain('昨天');
      expect(l12AllText).toContain('下雪');

      // Lesson 13: 请给我一杯茶 (PDF p. 093-101)
      const l13 = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 13);
      expect(l13, 'HSK 1 Lesson 13 must be present in raw data').toBeDefined();
      expect(l13?.titleChinese).toBe('请给我一杯茶');
      expect((l13?.hskMockListening?.length || 0) + (l13?.hskMockReading?.length || 0)).toBeGreaterThanOrEqual(2);

      // Lesson 14: 她买了不少衣服 (PDF p. 102-110)
      const l14 = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 14);
      expect(l14, 'HSK 1 Lesson 14 must be present in raw data').toBeDefined();
      expect(l14?.titleChinese).toBe('她买了不少衣服');
      expect((l14?.hskMockListening?.length || 0) + (l14?.hskMockReading?.length || 0)).toBeGreaterThanOrEqual(2);
    });

    it('HSK 2 all 15 lessons contain authentic radicals, word expansions, and exercise keys from SBT HSK2 (3.0).pdf', () => {
      expect(HSK2_WORKBOOK_LESSONS.length).toBe(15);

      HSK2_WORKBOOK_LESSONS.forEach((wbLesson) => {
        const lNum = wbLesson.lessonNumber;
        expect(lNum).toBeGreaterThanOrEqual(1);
        expect(lNum).toBeLessThanOrEqual(15);
        expect(wbLesson.titleChinese, `HSK 2 L${lNum} titleChinese`).toBeTruthy();
        expect(wbLesson.titleVietnamese, `HSK 2 L${lNum} titleVietnamese`).toBeTruthy();

        // 1. Hanzi Section: radicals >= 2, copyWords >= 4
        expect(wbLesson.hanziSection, `HSK 2 L${lNum} hanziSection`).toBeDefined();
        expect(wbLesson.hanziSection?.radicals?.length, `HSK 2 L${lNum} radicals count`).toBeGreaterThanOrEqual(2);
        expect(wbLesson.hanziSection?.copyWords?.length, `HSK 2 L${lNum} copyWords count`).toBeGreaterThanOrEqual(4);

        // 2. Word Expansion: baseWords = 6, compounds >= 3, exercises >= 3
        expect(wbLesson.wordExpansion, `HSK 2 L${lNum} wordExpansion`).toBeDefined();
        expect(wbLesson.wordExpansion?.baseWords?.length, `HSK 2 L${lNum} baseWords`).toBeGreaterThanOrEqual(6);
        expect(wbLesson.wordExpansion?.compounds?.length, `HSK 2 L${lNum} compounds`).toBeGreaterThanOrEqual(3);
        expect(wbLesson.wordExpansion?.exercises?.length, `HSK 2 L${lNum} fillInBlanks exercises`).toBeGreaterThanOrEqual(3);

        wbLesson.wordExpansion?.exercises?.forEach((fib, fIdx) => {
          expect(fib.sentenceWithBlank, `HSK 2 L${lNum} fib ${fIdx} sentenceWithBlank`).toBeTruthy();
          expect(fib.options.length, `HSK 2 L${lNum} fib ${fIdx} options`).toBeGreaterThanOrEqual(2);
          expect(fib.correctAnswer, `HSK 2 L${lNum} fib ${fIdx} correctAnswer`).toBeTruthy();
        });

        // 3. Listening & Reading Mock Drills presence
        const totalMockDrills = (wbLesson.listeningExercises?.length || 0) + (wbLesson.readingExercises?.length || 0);
        expect(totalMockDrills, `HSK 2 L${lNum} authentic listening+reading exercises`).toBeGreaterThanOrEqual(2);
      });
    });

    it('HSK 2 Writing exercises include component assembly (Q25-27) and pinyin character writing (Q28-30)', () => {
      // Check writing exercises in Lesson 1 and across lessons
      const l1 = HSK2_WORKBOOK_LESSONS[0];
      expect(l1.writingExercises, 'HSK 2 L1 writing exercises').toBeDefined();
      expect(l1.writingExercises!.length).toBeGreaterThanOrEqual(2);

      l1.writingExercises!.forEach((w: any) => {
        expect(w.id).toBeTruthy();
        expect(w.correctAnswer).toBeTruthy();
        expect(w.promptText || w.pinyinGuide || w.hanzi).toBeTruthy();
      });
    });

    it('workbookEnricher prioritizes raw authentic data without overwriting or displacing authentic questions', () => {
      const enrichedL1 = getEnrichedWorkbookLesson(2, 1);
      const rawL1 = HSK2_WORKBOOK_LESSONS[0];

      // Verifies that enriched questions retain the authentic raw questions
      if (rawL1.readingExercises && rawL1.readingExercises.length > 0) {
        const rawFirstId = rawL1.readingExercises[0].id;
        const matchingEnriched = enrichedL1.readingExercises.find((r) => r.id === rawFirstId);
        expect(matchingEnriched, 'Enriched reading exercises must preserve authentic raw questions').toBeDefined();
        expect(matchingEnriched?.correctKey).toBe(rawL1.readingExercises[0].correctKey);
      }
    });
  });

  describe('4. Database & System Integrity Verification', () => {
    it('data/hsk_exam.db SHA-256 hash remains intact and unchanged', () => {
      const dbPath = path.resolve(__dirname, '../data/hsk_exam.db');
      expect(fs.existsSync(dbPath), 'data/hsk_exam.db must exist').toBe(true);

      const fileBuffer = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
      expect(hash).toBe(EXPECTED_HASH);
    });
  });
});
