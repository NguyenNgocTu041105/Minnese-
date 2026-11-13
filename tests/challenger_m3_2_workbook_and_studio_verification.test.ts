import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';

import {
  HSK2_WORKBOOK_LESSONS,
  HSK2WorkbookLesson,
} from '../src/data/hsk2WorkbookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import {
  WorkbookView,
  getEnrichedWorkbookLessons,
  getEnrichedWorkbookLesson,
} from '../src/components/Coursebook/WorkbookView';
import { LessonExercisesStudio } from '../src/components/Coursebook/LessonExercisesStudio';
import { enrichWorkbookLesson } from '../src/data/workbookEnricher';

// Helper to strip React 19 SSR comment markers
function cleanHtml(html: string): string {
  return html.replace(/<!-- -->/g, '');
}

// In-Memory Mock Storage Implementation for LocalStorage Testing
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
}

describe('Challenger M3-2 Empirical Verification: HSK 2 Workbook & UI Integration', () => {
  const rootDir = process.cwd();
  const hsk2WorkbookDataPath = path.resolve(rootDir, 'src/data/hsk2WorkbookData.ts');
  const hsk2BookDataPath = path.resolve(rootDir, 'src/data/newHsk2BookData.ts');
  const studioComponentPath = path.resolve(rootDir, 'src/components/Coursebook/LessonExercisesStudio.tsx');

  // =========================================================================
  // SECTION 1: HSK 2 WORKBOOK DATA INTEGRITY & ZERO PLACEHOLDER ENFORCEMENT
  // =========================================================================
  describe('1. HSK 2 Workbook Data Invariants & Zero Placeholders', () => {
    const rawSource = fs.readFileSync(hsk2WorkbookDataPath, 'utf-8');

    it('contains ZERO forbidden placeholders ("TODO", "dummy", "placeholder", "mock_fallback")', () => {
      const placeholderRegex = /\b(TODO|dummy|placeholder|mock_fallback|temp_question)\b/i;
      expect(rawSource).not.toMatch(placeholderRegex);
    });

    it('contains exactly 15 workbook lessons', () => {
      expect(HSK2_WORKBOOK_LESSONS.length).toBe(15);
      const lessonNumbers = HSK2_WORKBOOK_LESSONS.map((l) => l.lessonNumber).sort((a, b) => a - b);
      expect(lessonNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    it('contains exactly 495 authentic exercises: 150 listening, 210 reading, 90 writing, 45 word expansion', () => {
      let totalListening = 0;
      let totalReading = 0;
      let totalWriting = 0;
      let totalWordExpansion = 0;

      const allIds = new Set<string>();

      HSK2_WORKBOOK_LESSONS.forEach((lesson) => {
        const lNum = lesson.lessonNumber;
        const listen = lesson.listeningExercises || [];
        const read = lesson.readingExercises || [];
        const wr = lesson.writingExercises || [];
        const we = lesson.wordExpansion?.exercises || [];

        expect(listen.length, `Lesson ${lNum} must have 10 listening questions`).toBe(10);
        expect(read.length, `Lesson ${lNum} must have 14 reading questions`).toBe(14);
        expect(wr.length, `Lesson ${lNum} must have 6 writing questions`).toBe(6);
        expect(we.length, `Lesson ${lNum} must have 3 word expansion questions`).toBe(3);

        totalListening += listen.length;
        totalReading += read.length;
        totalWriting += wr.length;
        totalWordExpansion += we.length;

        // Check ID uniqueness
        [...listen, ...read, ...wr, ...we].forEach((ex) => {
          expect(allIds.has(ex.id), `Exercise ID ${ex.id} must be unique`).toBe(false);
          allIds.add(ex.id);
        });
      });

      expect(totalListening).toBe(150);
      expect(totalReading).toBe(210);
      expect(totalWriting).toBe(90);
      expect(totalWordExpansion).toBe(45);
      expect(allIds.size).toBe(495);
    });

    it('guarantees 100% of workbook exercises have non-empty explanations and valid answers', () => {
      HSK2_WORKBOOK_LESSONS.forEach((lesson) => {
        // Listening
        (lesson.listeningExercises || []).forEach((q) => {
          expect(q.id).toBeDefined();
          expect(q.promptText || q.audioScript).toBeTruthy();
          expect(q.correctKey).toMatch(/^[A-F]$/);
          expect(q.explanation).toBeTruthy();
          expect(q.options.length).toBeGreaterThanOrEqual(2);
        });

        // Reading
        (lesson.readingExercises || []).forEach((q) => {
          expect(q.id).toBeDefined();
          expect(q.promptChinese || q.promptText).toBeTruthy();
          expect(q.correctKey).toMatch(/^[A-F]$/);
          expect(q.explanation).toBeTruthy();
          expect(q.options.length).toBeGreaterThanOrEqual(2);
        });

        // Writing
        (lesson.writingExercises || []).forEach((q) => {
          expect(q.id).toBeDefined();
          expect(q.promptText).toBeTruthy();
          expect(q.correctAnswer).toBeTruthy();
          expect(q.explanation).toBeTruthy();
        });

        // Word Expansion
        (lesson.wordExpansion?.exercises || []).forEach((q) => {
          expect(q.id).toBeDefined();
          expect(q.sentenceWithBlank).toContain('（ ）');
          expect(q.options.length).toBe(3);
          expect(q.options).toContain(q.correctAnswer);
        });
      });
    });
  });

  // =========================================================================
  // SECTION 2: PDF AUTHENTICITY SPOT-CHECKS (LESSON 1, 5, 10)
  // =========================================================================
  describe('2. Authentic Alignment with Official FLTRP Workbook PDF', () => {
    it('verifies Lesson 1 Listening & Reading & Writing match PDF pages 5, 7, 11, 12 verbatim', () => {
      const l1 = HSK2_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 1)!;
      expect(l1).toBeDefined();

      // Listening Q1 (PDF p. 5, item 1): High-speed train (高铁)
      const q1 = l1.listeningExercises!.find((q) => q.questionNumber === 1);
      expect(q1?.id).toBe('h2-l01-l01');
      expect(q1?.correctKey).toBe('A');
      expect(q1?.options[0].textChinese).toContain('高铁');

      // Listening Q7-10 (PDF p. 7): Dialogue options
      const q7 = l1.listeningExercises!.find((q) => q.questionNumber === 7);
      expect(q7?.options.map((o: any) => o.textChinese)).toEqual([
        '饭店 (fàndiàn)',
        '超市 (chāoshì)',
        '学校 (xuéxiào)',
      ]);
      expect(q7?.correctKey).toBe('A');

      const q8 = l1.listeningExercises!.find((q) => q.questionNumber === 8);
      expect(q8?.options.map((o: any) => o.textChinese)).toEqual([
        '北京 (Běijīng)',
        '上海 (Shànghǎi)',
        '西安 (Xī’ān)',
      ]);
      expect(q8?.correctKey).toBe('B');

      // Reading Q22-24 (PDF p. 11): Passage comprehension
      const q22 = l1.readingExercises!.find((q) => q.questionNumber === 22);
      expect(q22?.promptChinese).toContain('到了西安，朋友来接我们，还给我们介绍了一家饭店。');
      expect(q22?.subPrompt).toContain('朋友介绍了什么？');
      expect(q22?.correctKey).toBe('B');

      const q23 = l1.readingExercises!.find((q) => q.questionNumber === 23);
      expect(q23?.promptChinese).toContain('一雪姐请我吃了烤鸭');
      expect(q23?.correctKey).toBe('A');

      // Writing Q25-30 (PDF p. 12, book page 010)
      const q25 = l1.writingExercises!.find((q) => q.questionNumber === 25);
      expect(q25?.correctAnswer).toBe('懂');
      expect(q25?.explanation).toContain('懂');

      const q26 = l1.writingExercises!.find((q) => q.questionNumber === 26);
      expect(q26?.correctAnswer).toBe('给');

      const q27 = l1.writingExercises!.find((q) => q.questionNumber === 27);
      expect(q27?.correctAnswer).toBe('次');

      const q28 = l1.writingExercises!.find((q) => q.questionNumber === 28);
      expect(q28?.pinyinGuide).toBe('yǒu');
      expect(q28?.correctAnswer).toBe('有');

      const q29 = l1.writingExercises!.find((q) => q.questionNumber === 29);
      expect(q29?.pinyinGuide).toBe('yǐ');
      expect(q29?.correctAnswer).toBe('已');

      const q30 = l1.writingExercises!.find((q) => q.questionNumber === 30);
      expect(q30?.pinyinGuide).toBe('nà');
      expect(q30?.correctAnswer).toBe('那');
    });

    it('verifies Lesson 5 Writing matches PDF page 52 verbatim', () => {
      const l5 = HSK2_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 5)!;
      expect(l5).toBeDefined();

      const q25 = l5.writingExercises!.find((q) => q.questionNumber === 25);
      expect(q25?.correctAnswer).toBe('等');

      const q26 = l5.writingExercises!.find((q) => q.questionNumber === 26);
      expect(q26?.correctAnswer).toBe('奶');

      const q27 = l5.writingExercises!.find((q) => q.questionNumber === 27);
      expect(q27?.correctAnswer).toBe('准');

      const q28 = l5.writingExercises!.find((q) => q.questionNumber === 28);
      expect(q28?.pinyinGuide).toBe('xià');
      expect(q28?.correctAnswer).toBe('下');

      const q29 = l5.writingExercises!.find((q) => q.questionNumber === 29);
      expect(q29?.pinyinGuide).toBe('gēn');
      expect(q29?.correctAnswer).toBe('跟');

      const q30 = l5.writingExercises!.find((q) => q.questionNumber === 30);
      expect(q30?.pinyinGuide).toBe('yī');
      expect(q30?.correctAnswer).toBe('一');
    });

    it('verifies Lesson 10 Writing matches PDF page 102 verbatim', () => {
      const l10 = HSK2_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 10)!;
      expect(l10).toBeDefined();

      const q25 = l10.writingExercises!.find((q) => q.questionNumber === 25);
      expect(q25?.correctAnswer).toBe('错');

      const q26 = l10.writingExercises!.find((q) => q.questionNumber === 26);
      expect(q26?.correctAnswer).toBe('题');

      const q27 = l10.writingExercises!.find((q) => q.questionNumber === 27);
      expect(q27?.correctAnswer).toBe('笑');

      const q28 = l10.writingExercises!.find((q) => q.questionNumber === 28);
      expect(q28?.pinyinGuide).toBe('hòu');
      expect(q28?.correctAnswer).toBe('后');

      const q29 = l10.writingExercises!.find((q) => q.questionNumber === 29);
      expect(q29?.pinyinGuide).toBe('kāi');
      expect(q29?.correctAnswer).toBe('开');

      const q30 = l10.writingExercises!.find((q) => q.questionNumber === 30);
      expect(q30?.pinyinGuide).toBe('cí');
      expect(q30?.correctAnswer).toBe('词');
    });
  });

  // =========================================================================
  // SECTION 3: WORKBOOKVIEW REACT SSR INTEGRATION WITH HSK 2
  // =========================================================================
  describe('3. WorkbookView Integration with HSK 2', () => {
    it('successfully enriches and returns 15 workbook lessons for HSK Level 2', () => {
      const enrichedLessons = getEnrichedWorkbookLessons(2);
      expect(enrichedLessons.length).toBe(15);

      enrichedLessons.forEach((el, idx) => {
        expect(el.lessonNumber).toBe(idx + 1);
        expect(el.listeningExercises.length).toBe(10);
        expect(el.readingExercises.length).toBe(14);
        expect(el.writingExercises.length).toBeGreaterThanOrEqual(6);
        expect(el.wordExpansion).toBeDefined();
      });
    });

    it('renders WorkbookView cleanly across ALL 15 HSK 2 lessons without crashing', () => {
      NEW_HSK2_FULL_LESSONS.forEach((lesson) => {
        const html = cleanHtml(
          renderToString(
            React.createElement(WorkbookView, {
              hskLevel: 2,
              currentLessonNumber: lesson.lessonNumber,
              currentLesson: lesson,
            })
          )
        );

        expect(html).toContain('id="workbook-root-container"');
        expect(html).toContain(`Bài ${lesson.lessonNumber}`);
        expect(html).toContain('Sách Bài Tập');
        expect(html).toContain('Mô Phỏng Đề HSK (模拟训练)');
      });
    });
  });

  // =========================================================================
  // SECTION 4: LESSONEXERCISESSTUDIO REACT SSR INTEGRATION WITH HSK 2
  // =========================================================================
  describe('4. LessonExercisesStudio Integration with HSK 2', () => {
    let originalLocalStorage: any;

    beforeEach(() => {
      originalLocalStorage = (globalThis as any).localStorage;
      (globalThis as any).localStorage = new MockLocalStorage();
    });

    it('renders cleanly across ALL 15 HSK 2 lessons with 30 exercises each (450 total)', () => {
      let totalRenderedExercises = 0;

      NEW_HSK2_FULL_LESSONS.forEach((lesson) => {
        expect(lesson.exercises?.length, `Lesson ${lesson.lessonNumber} must have 30 exercises`).toBe(30);
        totalRenderedExercises += lesson.exercises!.length;

        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson,
              hskLevel: 2,
            })
          )
        );

        // Verify header
        expect(html).toContain(`HSK 2 • Bài ${lesson.lessonNumber}`);
        expect(html).toContain('30 câu bài tập vận dụng');

        // Verify R1 removals: NO AI generation and NO batch check buttons
        expect(html).not.toContain('Sinh thêm bài tập AI');
        expect(html).not.toContain('Kiểm tra đáp án');

        // Verify R3 note-taking box exists for every single exercise in the lesson
        lesson.exercises!.forEach((ex) => {
          expect(html).toContain(`id="note-${ex.id}"`);
          expect(html).toContain(`Ghi chú cá nhân của bạn:`);
        });
      });

      expect(totalRenderedExercises).toBe(450);
    });

    it('persists and restores student notes for HSK 2 questions via dual-key strategy', () => {
      const lesson2 = NEW_HSK2_FULL_LESSONS.find((l) => l.lessonNumber === 2)!;
      expect(lesson2).toBeDefined();

      const exerciseId = 'hsk2-l02-ex01';
      const studentNote = 'Ghi nhớ: Cấu trúc 还是……吧 biểu thị sự lựa chọn có tính chất khuyên nhủ.';

      // Set note in consolidated lesson storage
      const lessonKey = 'minnese_exercise_notes_hsk2_l2';
      (globalThis as any).localStorage.setItem(
        lessonKey,
        JSON.stringify({ [exerciseId]: studentNote })
      );

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: lesson2,
            hskLevel: 2,
          })
        )
      );

      // Verify the note is populated in SSR html
      expect(html).toContain(studentNote);
    });

    it('falls back to single-exercise note key if consolidated key is missing', () => {
      const lesson3 = NEW_HSK2_FULL_LESSONS.find((l) => l.lessonNumber === 3)!;
      const exerciseId = 'hsk2-l03-ex05';
      const singleNote = 'Ghi chú đơn lẻ cho câu 5 bài 3 HSK 2.';

      (globalThis as any).localStorage.setItem(`minnese_note_${exerciseId}`, singleNote);

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: lesson3,
            hskLevel: 2,
          })
        )
      );

      expect(html).toContain(singleNote);
    });
  });

  // =========================================================================
  // SECTION 5: ADVERSARIAL STRESS & BOUNDARY RESILIENCE
  // =========================================================================
  describe('5. Adversarial Stress & Boundary Resilience', () => {
    it('enrichWorkbookLesson handles empty or undefined raw workbook lesson gracefully', () => {
      const lesson1 = NEW_HSK2_FULL_LESSONS[0];
      expect(() => {
        const enriched = enrichWorkbookLesson(2, lesson1, undefined);
        expect(enriched.lessonNumber).toBe(1);
        expect(enriched.titleChinese).toBe(lesson1.titleHanzi);
      }).not.toThrow();
    });

    it('handles unexpected currentLessonNumber out of bounds [0, 99, -1]', () => {
      for (const badNum of [0, -1, 99]) {
        expect(() => {
          renderToString(
            React.createElement(WorkbookView, {
              hskLevel: 2,
              currentLessonNumber: badNum,
            })
          );
        }).not.toThrow();
      }
    });

    it('preserves notes with complex unicode, accents, emojis, and brackets', () => {
      const complexNote = 'HSK2 练习: 为什么？ 🇨🇳 "Khai giảng" = 开学 (kāixué) <tag> & [100%]';
      const key = 'minnese_exercise_notes_hsk2_l1';
      (globalThis as any).localStorage.setItem(
        key,
        JSON.stringify({ 'hsk2-l01-ex01': complexNote })
      );

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: NEW_HSK2_FULL_LESSONS[0],
            hskLevel: 2,
          })
        )
      );

      expect(html).toContain('HSK2 练习: 为什么？ 🇨🇳');
      expect(html).toContain('开学 (kāixué)');
    });
  });
});
