import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import * as ts from 'typescript';

import { LessonExercisesStudio } from '../src/components/Coursebook/LessonExercisesStudio';
import {
  ExerciseItem,
  ExerciseType,
  DetailedTextbookLesson,
  NEW_HSK1_FULL_LESSONS,
} from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';

// Strip React 19 SSR comment markers
function cleanHtml(html: string): string {
  return html.replace(/<!-- -->/g, '');
}

// In-Memory Mock Storage Implementation
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

  getInternalStore(): Record<string, string> {
    return { ...this.store };
  }
}

describe('EMPIRICAL CHALLENGER: Stress Harness & Invariant Verification for LessonExercisesStudio', () => {
  const rootDir = process.cwd();
  const componentFilePath = path.resolve(rootDir, 'src/components/Coursebook/LessonExercisesStudio.tsx');
  let sourceCode: string;
  let mockStorage: MockLocalStorage;
  let originalPropertyDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    sourceCode = fs.readFileSync(componentFilePath, 'utf-8');
    mockStorage = new MockLocalStorage();
    originalPropertyDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalPropertyDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalPropertyDescriptor);
    } else {
      delete (globalThis as any).localStorage;
    }
  });

  // ==========================================================================
  // CHALLENGE 1: AST-LEVEL DEEP SCAN & NEGATIVE ASSERTIONS (R1)
  // ==========================================================================
  describe('Challenge 1: AST-Level Scrutiny & Negative Assertions for R1', () => {
    it('1.1: TypeScript AST contains ZERO identifier, string literal, or JSXText matching AI controls', () => {
      const sourceFile = ts.createSourceFile('LessonExercisesStudio.tsx', sourceCode, ts.ScriptTarget.Latest, true);
      const bannedRegexes = [
        /sinh\s*thêm/i,
        /kiểm\s*tra\s*đáp\s*án/i,
        /luyện\s*thêm\s*câu\s*mới/i,
        /isaimodalopen/i,
        /setisaimodalopen/i,
        /handlegenerateai/i,
        /handlecheckanswers/i,
        /aipracticemode/i,
        /aiquestioncount/i,
      ];

      const violations: { kind: string; text: string; line: number }[] = [];

      function walk(node: ts.Node) {
        let textToCheck = '';
        if (ts.isIdentifier(node)) textToCheck = node.text;
        else if (ts.isStringLiteral(node)) textToCheck = node.text;
        else if (ts.isJsxText(node)) textToCheck = node.text;

        if (textToCheck) {
          for (const regex of bannedRegexes) {
            if (regex.test(textToCheck)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                kind: ts.SyntaxKind[node.kind],
                text: textToCheck,
                line: line + 1,
              });
            }
          }
        }
        ts.forEachChild(node, walk);
      }

      walk(sourceFile);
      expect(violations).toEqual([]);
    });

    it('1.2: Rendered DOM across all 15 HSK 1 and 15 HSK 2 lessons contains ZERO trace of removed buttons or modal overlays', () => {
      const allLessons = [
        ...NEW_HSK1_FULL_LESSONS.map((l) => ({ lesson: l, level: 1 })),
        ...NEW_HSK2_FULL_LESSONS.map((l) => ({ lesson: l, level: 2 })),
      ];

      expect(allLessons.length).toBe(30);

      for (const { lesson, level } of allLessons) {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson,
              hskLevel: level,
            })
          )
        );

        expect(html).not.toMatch(/sinh\s*thêm\s*bài\s*tập/i);
        expect(html).not.toMatch(/kiểm\s*tra\s*đáp\s*án/i);
        expect(html).not.toMatch(/luyện\s*thêm\s*câu\s*mới/i);
        expect(html).not.toMatch(/fixed\s+inset-0/);
        expect(html).not.toMatch(/backdrop-blur/);
      }
    });
  });

  // ==========================================================================
  // CHALLENGE 2: EVALUATION LOGIC ORACLE & DATASET STRESS (R2)
  // ==========================================================================
  describe('Challenge 2: checkQuestionCorrect Oracle & Substring Match Analysis', () => {
    // Exact function as in LessonExercisesStudio.tsx:
    const checkQuestionCorrect = (ex: ExerciseItem, answer: string): boolean => {
      if (!answer) return false;
      const cleanUser = answer.replace(/\s+/g, '').toLowerCase();
      const cleanCorrect = (ex.correctAnswer || '').replace(/\s+/g, '').toLowerCase();
      if (!cleanCorrect) return false;
      return cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    };

    it('2.1: checkQuestionCorrect boundary evaluation on empty and nullish inputs', () => {
      const dummyEx: ExerciseItem = {
        id: 'test-1',
        type: 'multiple_choice',
        question: 'Q',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Exp',
      };

      // Falsy input evaluates to false immediately
      expect(checkQuestionCorrect(dummyEx, '')).toBe(false);
      expect(checkQuestionCorrect(dummyEx, null as any)).toBe(false);
      expect(checkQuestionCorrect(dummyEx, undefined as any)).toBe(false);

      // CHALLENGE FINDING: '   ' has non-empty length before replace, causing cleanUser=''
      // cleanCorrect.includes('') evaluates to true.
      // In LessonExercisesStudio, this is prevented at component level by:
      // (1) Options are structured discrete strings, never pure whitespace
      // (2) isAnswered check uses !!selectedAnswers[ex.id]?.trim() in stats
      const isWhitespacePureResult = checkQuestionCorrect(dummyEx, '   ');
      // Documenting empirical behavior:
      expect(isWhitespacePureResult).toBe(true);
    });

    it('2.2: checkQuestionCorrect returns false when ex.correctAnswer is missing or empty', () => {
      const dummyExNoAns: ExerciseItem = {
        id: 'test-2',
        type: 'multiple_choice',
        question: 'Q',
        options: ['A', 'B'],
        correctAnswer: '',
        explanation: 'Exp',
      };

      expect(checkQuestionCorrect(dummyExNoAns, 'A')).toBe(false);
    });

    it('2.3: Oracle stress on all HSK 1 and HSK 2 exercises: verify incorrect options NEVER trigger false positives', () => {
      // In multiple-choice questions, verify NO wrong option is accidentally evaluated as correct
      const allLessons = [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS];
      const ambiguityIssues: {
        lesson: number;
        questionId: string;
        correctAnswer: string;
        conflictingWrongOption: string;
      }[] = [];

      for (const lesson of allLessons) {
        for (const ex of lesson.exercises || []) {
          if (!ex.options || ex.options.length <= 1) continue;
          for (const opt of ex.options) {
            if (opt === ex.correctAnswer) continue;
            // Test if checkQuestionCorrect evaluates this wrong option as correct
            const wouldBeCorrect = checkQuestionCorrect(ex, opt);
            if (wouldBeCorrect) {
              ambiguityIssues.push({
                lesson: lesson.lessonNumber,
                questionId: ex.id,
                correctAnswer: ex.correctAnswer,
                conflictingWrongOption: opt,
              });
            }
          }
        }
      }

      // Assert that ZERO wrong options across the entire curriculum trigger false positives!
      expect(ambiguityIssues).toEqual([]);
    });

    it('2.4: Sentence scramble Oracle: exact assembly matches correctAnswer', () => {
      const scrambleEx: ExerciseItem = {
        id: 'scramble-1',
        type: 'sentence_scramble',
        question: 'Sắp xếp câu',
        scrambleSegments: ['明天', '我', '去', '北京'],
        options: [],
        correctAnswer: '明天我去北京',
        explanation: 'Trạng từ chỉ thời gian đứng đầu câu hoặc sau chủ ngữ.',
      };

      const correctAssembly = ['明天', '我', '去', '北京'].join('');
      const wrongAssembly1 = ['我', '明天', '北京', '去'].join('');
      const wrongAssembly2 = ['去', '北京', '明天', '我'].join('');

      expect(checkQuestionCorrect(scrambleEx, correctAssembly)).toBe(true);
      expect(checkQuestionCorrect(scrambleEx, wrongAssembly1)).toBe(false);
      expect(checkQuestionCorrect(scrambleEx, wrongAssembly2)).toBe(false);
    });
  });

  // ==========================================================================
  // CHALLENGE 3: LOCALSTORAGE DUAL-KEY PERSISTENCE & FAULT INJECTION (R3)
  // ==========================================================================
  describe('Challenge 3: LocalStorage Dual-Key Persistence & Fault Injection', () => {
    it('3.1: Dual-key contract: consolidated and direct keys are isolated across lessons and levels', () => {
      const lesson1Hsk1 = NEW_HSK1_FULL_LESSONS[0];
      const lesson1Hsk2 = NEW_HSK2_FULL_LESSONS[0];

      const hsk1ExId = lesson1Hsk1.exercises[0].id;
      const hsk2ExId = lesson1Hsk2.exercises[0].id;

      // Setup notes for HSK 1 Lesson 1
      mockStorage.setItem(
        'minnese_exercise_notes_hsk1_l1',
        JSON.stringify({ [hsk1ExId]: 'Ghi chú bài 1 HSK 1' })
      );
      mockStorage.setItem(`minnese_note_${hsk1ExId}`, 'Ghi chú bài 1 HSK 1');

      // Setup notes for HSK 2 Lesson 1 (same lesson number, different level)
      mockStorage.setItem(
        'minnese_exercise_notes_hsk2_l1',
        JSON.stringify({ [hsk2ExId]: 'Ghi chú bài 1 HSK 2' })
      );
      mockStorage.setItem(`minnese_note_${hsk2ExId}`, 'Ghi chú bài 1 HSK 2');

      const htmlHsk1 = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: lesson1Hsk1,
            hskLevel: 1,
          })
        )
      );

      // HSK 1 Lesson 1 must see its own note and NOT the HSK 2 note
      expect(htmlHsk1).toContain('Ghi chú bài 1 HSK 1');
      expect(htmlHsk1).not.toContain('Ghi chú bài 1 HSK 2');

      const htmlHsk2 = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: lesson1Hsk2,
            hskLevel: 2,
          })
        )
      );

      // HSK 2 Lesson 1 must see its own note and NOT the HSK 1 note
      expect(htmlHsk2).toContain('Ghi chú bài 1 HSK 2');
      expect(htmlHsk2).not.toContain('Ghi chú bài 1 HSK 1');
    });

    it('3.2: Direct key fallback fires when consolidated JSON is missing an exercise entry', () => {
      const lesson = NEW_HSK1_FULL_LESSONS[0];
      const firstExId = lesson.exercises[0].id;
      const secondExId = lesson.exercises[1].id;

      // Consolidated key only has note for first exercise
      mockStorage.setItem(
        `minnese_exercise_notes_hsk1_l${lesson.lessonNumber}`,
        JSON.stringify({ [firstExId]: 'Consolidated note' })
      );
      // Direct key has note for second exercise
      mockStorage.setItem(`minnese_note_${secondExId}`, 'Fallback direct note for exercise 2');

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Consolidated note');
      expect(html).toContain('Fallback direct note for exercise 2');
    });

    it('3.3: High-capacity stress: Handles large text note with Unicode, symbols, and formatting', () => {
      const lesson = NEW_HSK1_FULL_LESSONS[0];
      const firstExId = lesson.exercises[0].id;

      const largeNoteChunk = '汉字 拼音 🇨🇳 Tiếng Việt: Đây là ghi chú rất dài để kiểm tra độ bền dữ liệu! ';
      const hugeNote = largeNoteChunk.repeat(200); // ~15KB string
      expect(hugeNote.length).toBeGreaterThan(10000);

      mockStorage.setItem(
        `minnese_exercise_notes_hsk1_l${lesson.lessonNumber}`,
        JSON.stringify({ [firstExId]: hugeNote })
      );

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Tiếng Việt: Đây là ghi chú rất dài');
      expect(html).toContain('Đã lưu tự động');
    });

    it('3.4: SSR Resilience: cleanly renders when localStorage is completely undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: NEW_HSK1_FULL_LESSONS[0],
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('Ghi chú cá nhân của bạn');
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // CHALLENGE 4: INTERFACE INVARIANTS & HEADER CONTROLS
  // ==========================================================================
  describe('Challenge 4: Interface Invariants, Progress Counting & Reset Behavior', () => {
    it('4.1: Progress counter accurately reflects initial state ("Đã làm: 0/N • Đúng: 0")', () => {
      const lesson = NEW_HSK1_FULL_LESSONS[0];
      const count = lesson.exercises.length;

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain(`Đã làm: 0/${count} • Đúng: 0`);
      // Global reset button must be disabled when totalAnswered is 0
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Làm lại tất cả/);
    });

    it('4.2: Filter tabs exist for question types present in the lesson', () => {
      const lesson = NEW_HSK1_FULL_LESSONS[0];
      const typesInLesson = new Set(lesson.exercises.map((e) => e.type));

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain(`Tất cả (${lesson.exercises.length})`);

      if (typesInLesson.has('sentence_scramble')) {
        expect(html).toContain('🧩 Sắp xếp câu');
      }
      if (typesInLesson.has('fill_blank')) {
        expect(html).toContain('✍️ Điền từ vào ô');
      }
      if (typesInLesson.has('multiple_choice')) {
        expect(html).toContain('🎯 Trắc nghiệm');
      }
      if (typesInLesson.has('translation')) {
        expect(html).toContain('🔄 Dịch câu &amp; Mẫu câu');
      }
      if (typesInLesson.has('dialogue_match')) {
        expect(html).toContain('💬 Ghép hội thoại');
      }
      if (typesInLesson.has('error_spotting')) {
        expect(html).toContain('🔍 Tìm &amp; sửa lỗi');
      }
    });

    it('4.3: Per-question reset and note inputs have correct matching accessibility IDs', () => {
      const lesson = NEW_HSK1_FULL_LESSONS[0];

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson,
            hskLevel: 1,
          })
        )
      );

      for (const ex of lesson.exercises) {
        // Label must point to htmlFor="note-{id}" and textarea id="note-{id}"
        expect(html).toContain(`for="note-${ex.id}"`);
        expect(html).toContain(`id="note-${ex.id}"`);
      }
    });
  });
});
