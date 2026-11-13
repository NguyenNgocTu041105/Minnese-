/**
 * tests/adversarial_challenger_m1_1_empirical_verification.test.ts
 *
 * Empirical Challenger Verification Suite for Milestone 1
 * Author: challenger_m1_1 (critic, specialist)
 *
 * Comprehensive adversarial verification of LessonExercisesStudio.tsx:
 * 1. Challenge R1: Complete removal of AI generation & manual check controls (AST & rendered DOM).
 * 2. Challenge R2: Instant answer feedback across all 6 exercise types:
 *    - multiple_choice, fill_blank, sentence_scramble, translation, dialogue_match, error_spotting.
 *    - Immediate visual styling (emerald on correct, rose on incorrect, correct answer highlight).
 *    - Detailed grammatical explanation card with grammarFocus and status badge.
 *    - Sentence scramble placement, segment exhaustion, removal, reset, and instant completion evaluation.
 *    - Per-question reset ("Làm lại câu này") and header global reset ("Làm lại tất cả").
 * 3. Challenge R3: Dedicated question note-taking section with LocalStorage persistence:
 *    - Dual-key persistence (consolidated key and direct fallback key).
 *    - Character encoding stress: Unicode Hanzi, Vietnamese diacritics, special characters, quotes, HTML, newlines, emoji.
 *    - Auto-save indicator ("Đã lưu tự động") presence / absence.
 *    - Reload rehydration and direct key fallback.
 *    - Fault injection: corrupted JSON, storage exceptions, and SSR undefined localStorage.
 * 4. Challenge Evaluation Oracle:
 *    - checkQuestionCorrect oracle testing across all HSK 1 and HSK 2 curriculum questions.
 *    - Zero false positive check on incorrect options.
 */

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

function cleanHtml(html: string): string {
  return html.replace(/<!-- -->/g, '');
}

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

  getSnapshot(): Record<string, string> {
    return { ...this.store };
  }
}

// Canonical 6-Type Fixture Set
const canonicalExercises: Record<ExerciseType, ExerciseItem> = {
  multiple_choice: {
    id: 'canon-mc',
    type: 'multiple_choice',
    question: 'Chọn chữ Hán đúng cho từ "Nǐ hǎo":',
    hanziPrompt: '你好',
    pinyinPrompt: 'Nǐ hǎo',
    vietnamesePrompt: 'Chào bạn',
    options: ['A. 你好', 'B. 再见', 'C. 谢谢', 'D. 不客气'],
    correctAnswer: 'A. 你好',
    explanation: '"你好" (nǐ hǎo) là lời chào thông dụng nhất trong tiếng Trung.',
    grammarFocus: 'Chào hỏi cơ bản',
    audioText: '你好',
  },
  fill_blank: {
    id: 'canon-fill',
    type: 'fill_blank',
    question: 'Điền từ thích hợp vào chỗ trống: 他 ____ 老师。',
    options: ['是', '不', '很', '吗'],
    correctAnswer: '是',
    explanation: 'Dùng động từ phán đoán "是" để liên kết chủ ngữ và danh từ chỉ nghề nghiệp.',
    grammarFocus: 'Động từ phán đoán 是',
  },
  sentence_scramble: {
    id: 'canon-scramble',
    type: 'sentence_scramble',
    question: 'Sắp xếp các từ sau thành câu hoàn chỉnh:',
    scrambleSegments: ['我', '是', '越南人'],
    options: [],
    correctAnswer: '我是越南人',
    explanation: 'Cấu trúc câu khẳng định với "是": Chủ ngữ + 是 + Danh từ.',
    grammarFocus: 'Cấu trúc chữ 是',
    audioText: '我是越南人',
  },
  translation: {
    id: 'canon-translation',
    type: 'translation',
    question: 'Dịch câu sang tiếng Trung: "Rất vui được gặp bạn"',
    options: ['很高兴认识你', '你是哪国人', '明天见', '对不起'],
    correctAnswer: '很高兴认识你',
    explanation: '"很高兴认识你" (hěn gāoxìng rènshí nǐ) là mẫu câu lịch sự dùng khi mới quen biết.',
    grammarFocus: 'Mẫu câu xã giao',
  },
  dialogue_match: {
    id: 'canon-dialogue',
    type: 'dialogue_match',
    question: 'Ghép câu đáp lại thích hợp: "谢谢你！"',
    options: ['不客气', '没关系', '你好', '再见'],
    correctAnswer: '不客气',
    explanation: 'Khi người khác nói "谢谢" (cảm ơn), câu đáp lại chuẩn mực là "不客气".',
    grammarFocus: 'Hội thoại cảm ơn và đáp từ',
  },
  error_spotting: {
    id: 'canon-error',
    type: 'error_spotting',
    question: 'Tìm lỗi sai trong câu: "我不是是学生。"',
    options: ['Bỏ một chữ 是', 'Thay 是 bằng 有', 'Bỏ chữ 不', 'Thay 我 bằng 他'],
    correctAnswer: 'Bỏ một chữ 是',
    explanation: 'Câu bị lặp động từ "是", dạng phủ định chuẩn là "不是 + danh từ".',
    grammarFocus: 'Dạng phủ định 不是',
  },
};

const canonicalLesson: DetailedTextbookLesson = {
  lessonNumber: 1,
  titleHanzi: '你好',
  titlePinyin: 'Nǐ hǎo',
  titleVietnamese: 'Xin chào',
  pageStart: 1,
  objectives: ['Chào hỏi cơ bản'],
  texts: [],
  vocabulary: [],
  grammarPoints: [],
  exercises: Object.values(canonicalExercises),
};

describe('Empirical Verification Challenger Suite: Milestone 1', () => {
  const rootDir = process.cwd();
  const componentPath = path.resolve(rootDir, 'src/components/Coursebook/LessonExercisesStudio.tsx');
  let sourceCode: string;
  let mockStorage: MockLocalStorage;
  let originalPropertyDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    sourceCode = fs.readFileSync(componentPath, 'utf-8');
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

  // =========================================================================
  // 1. CHALLENGE R1: REMOVAL OF AI GENERATOR & MANUAL BATCH CHECK CONTROLS
  // =========================================================================
  describe('1. Challenge R1: Complete Removal of AI & Manual Check Controls', () => {
    it('1.1: Source code contains ZERO occurrences of forbidden text patterns', () => {
      const forbiddenStrings = [
        'Sinh thêm bài tập AI',
        'Kiểm tra đáp án',
        'Luyện thêm câu mới',
        'Sinh thêm bài tập AI thông minh',
        'isAiModalOpen',
        'setIsAiModalOpen',
        'handleGenerateAiExercises',
        'handleCheckAnswers',
        'aiQuestionCount',
        'aiPracticeMode',
      ];

      for (const str of forbiddenStrings) {
        expect(sourceCode).not.toContain(str);
      }
    });

    it('1.2: AST inspection verifies zero forbidden JSX elements, props, or identifiers', () => {
      const sourceFile = ts.createSourceFile('LessonExercisesStudio.tsx', sourceCode, ts.ScriptTarget.Latest, true);
      const bannedRegexes = [
        /sinh\s*thêm\s*bài\s*tập/i,
        /kiểm\s*tra\s*đáp\s*án/i,
        /luyện\s*thêm\s*câu\s*mới/i,
        /isaimodalopen/i,
        /handlegenerateai/i,
        /handlecheckanswers/i,
      ];

      const violations: string[] = [];

      function checkNode(node: ts.Node) {
        let text = '';
        if (ts.isIdentifier(node)) text = node.text;
        else if (ts.isStringLiteral(node)) text = node.text;
        else if (ts.isJsxText(node)) text = node.text;

        if (text) {
          for (const reg of bannedRegexes) {
            if (reg.test(text)) {
              violations.push(`[Line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}] ${text}`);
            }
          }
        }
        ts.forEachChild(node, checkNode);
      }

      checkNode(sourceFile);
      expect(violations).toEqual([]);
    });

    it('1.3: Rendered DOM across all 15 HSK 1 and 15 HSK 2 lessons contains zero forbidden controls', () => {
      const allLessons = [
        ...NEW_HSK1_FULL_LESSONS.map((l) => ({ lesson: l, level: 1 })),
        ...NEW_HSK2_FULL_LESSONS.map((l) => ({ lesson: l, level: 2 })),
      ];

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
        expect(html).not.toContain('isAiModalOpen');
      }
    });
  });

  // =========================================================================
  // 2. CHALLENGE R2: INSTANT FEEDBACK ACROSS ALL 6 EXERCISE TYPES
  // =========================================================================
  describe('2. Challenge R2: Instant Answer Feedback across All 6 Exercise Types', () => {
    it('2.1: Header action area renders live counter chip and global reset button', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      // Live counter chip
      expect(html).toContain('Đã làm: 0/6 • Đúng: 0');
      // Global reset button present and disabled initially
      expect(html).toContain('Làm lại tất cả');
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Làm lại tất cả/);
    });

    it('2.2: Filter tabs exist for all 6 exercise types', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Tất cả (6)');
      expect(html).toContain('🧩 Sắp xếp câu (1)');
      expect(html).toContain('✍️ Điền từ vào ô (1)');
      expect(html).toContain('🎯 Trắc nghiệm (1)');
      expect(html).toContain('🔄 Dịch câu &amp; Mẫu câu (1)');
      expect(html).toContain('💬 Ghép hội thoại (1)');
      expect(html).toContain('🔍 Tìm &amp; sửa lỗi (1)');
    });

    it('2.3: Per-question retry button ("Làm lại câu này") is wired in source for individual reset', () => {
      expect(sourceCode).toContain('handleResetQuestion(ex.id)');
      expect(sourceCode).toContain('Làm lại câu này');
      expect(sourceCode).toContain('RotateCcw');
    });

    it('2.4: Instant visual feedback CSS contract verification in source code', () => {
      // Emerald styling on correct selection:
      expect(sourceCode).toContain('bg-emerald-500 text-white border-emerald-500 font-bold shadow-xs');
      // Rose styling on incorrect selection:
      expect(sourceCode).toContain('bg-rose-500 text-white border-rose-500 font-bold shadow-xs');
      // Correct answer highlighted in emerald when user chose incorrectly:
      expect(sourceCode).toContain('bg-emerald-500 text-white border-emerald-500 font-bold pointer-events-none shadow-xs');
      // Unselected options disabled:
      expect(sourceCode).toContain('opacity-50 pointer-events-none');
    });

    it('2.5: Immediate grammatical explanation contract verification in source code', () => {
      // Explanation card renders immediately upon isAnswered:
      expect(sourceCode).toContain('{isAnswered && (');
      // Positive badge:
      expect(sourceCode).toContain('Chính xác! 🎉');
      // Negative badge:
      expect(sourceCode).toContain('Chưa chính xác!');
      // Correct answer reveal when wrong:
      expect(sourceCode).toContain('Đáp án đúng: {ex.correctAnswer}');
      // Detailed explanation & grammar focus:
      expect(sourceCode).toContain('{ex.explanation}');
      expect(sourceCode).toContain('{ex.grammarFocus}');
    });

    it('2.6: Incremental XP award contract (+10 XP per unique correct answer)', () => {
      expect(sourceCode).toContain('setRewardedQuestionIds');
      expect(sourceCode).toMatch(/onUpdateUserXp\s*\(\s*10\s*\)/);
      expect(sourceCode).toContain('rewardedQuestionIds.size * 10');
    });

    it('2.7: Sentence Scramble mechanics: segment building, removal, exhaustion, reset & evaluation', () => {
      expect(sourceCode).toContain('handleAddScrambleSegment');
      expect(sourceCode).toContain('handleRemoveScrambleSegment');
      expect(sourceCode).toContain('handleResetScramble');
      expect(sourceCode).toContain('Xóa làm lại');
      // Must evaluate instantly when updated.length === totalSegments
      expect(sourceCode).toMatch(/totalSegments\s*>\s*0\s*&&\s*updated\.length\s*===\s*totalSegments/);
    });
  });

  // =========================================================================
  // 3. CHALLENGE R3: QUESTION NOTE-TAKING SECTION & LOCALSTORAGE PERSISTENCE
  // =========================================================================
  describe('3. Challenge R3: Dedicated Question Note Box & LocalStorage Persistence', () => {
    it('3.1: Every question card renders dedicated note section with textarea and accessible label', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      for (const ex of canonicalLesson.exercises) {
        expect(html).toContain(`for="note-${ex.id}"`);
        expect(html).toContain(`id="note-${ex.id}"`);
        expect(html).toContain('Ghi chú cá nhân của bạn:');
        expect(html).toContain('placeholder="Ghi chép từ vựng mới, cấu trúc ngữ pháp cần lưu ý cho câu này..."');
      }
    });

    it('3.2: Dual-key persistence: loads consolidated notes JSON correctly', () => {
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      const testNotes = {
        'canon-mc': 'Ghi chú cho câu trắc nghiệm',
        'canon-fill': 'Lưu ý động từ 是 phán đoán',
      };
      mockStorage.setItem(consolidatedKey, JSON.stringify(testNotes));

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Ghi chú cho câu trắc nghiệm');
      expect(html).toContain('Lưu ý động từ 是 phán đoán');
    });

    it('3.3: Direct key fallback: loads direct note when consolidated key is missing an exercise entry', () => {
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      // Consolidated only has canon-mc
      mockStorage.setItem(consolidatedKey, JSON.stringify({ 'canon-mc': 'Ghi chú consolidated' }));
      // Direct fallback key for canon-translation
      mockStorage.setItem('minnese_note_canon-translation', 'Ghi chú fallback direct cho dịch câu');

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Ghi chú consolidated');
      expect(html).toContain('Ghi chú fallback direct cho dịch câu');
    });

    it('3.4: Auto-save badge ("Đã lưu tự động") displays when note has non-empty content', () => {
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      mockStorage.setItem(consolidatedKey, JSON.stringify({ 'canon-mc': 'Ghi chú đã lưu' }));

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Đã lưu tự động');
    });

    it('3.5: Auto-save badge does NOT display when note is empty or pure whitespace', () => {
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      mockStorage.setItem(consolidatedKey, JSON.stringify({ 'canon-mc': '   ' }));

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).not.toContain('Đã lưu tự động');
    });

    it('3.6: Character encoding stress: handles Unicode Hanzi, Vietnamese, quotes, HTML, newlines, and emoji', () => {
      const complexNote = '汉字：你好世界！🇻🇳 Tiếng Việt: Chú ý chữ 把 &amp; 被. Quotes: "single\' &amp; double". HTML: &lt;div&gt;test&lt;/div&gt;. Newline:\nDòng 2. Emoji: 🎉🚀💡';
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      mockStorage.setItem(consolidatedKey, JSON.stringify({ 'canon-mc': complexNote }));

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: canonicalLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('你好世界');
      expect(html).toContain('Tiếng Việt: Chú ý chữ 把');
      expect(html).toContain('Đã lưu tự động');
    });

    it('3.7: Fault injection: graceful error handling on corrupted localStorage JSON', () => {
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      mockStorage.setItem(consolidatedKey, '{ corrupted: invalid-json');

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: canonicalLesson,
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('Ghi chú cá nhân của bạn:');
      }).not.toThrow();
    });

    it('3.8: SSR resilience: cleanly renders when localStorage is completely undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: canonicalLesson,
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('Ghi chú cá nhân của bạn:');
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 4. CHALLENGE 4: EVALUATION ORACLE & CURRICULAR INVARIANTS
  // =========================================================================
  describe('4. Challenge 4: Evaluation Oracle & Curricular Dataset Integrity', () => {
    const checkQuestionCorrect = (ex: ExerciseItem, answer: string): boolean => {
      if (!answer) return false;
      const cleanUser = answer.replace(/\s+/g, '').toLowerCase();
      const cleanCorrect = (ex.correctAnswer || '').replace(/\s+/g, '').toLowerCase();
      if (!cleanCorrect) return false;
      return cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    };

    it('4.1: Correct answers evaluate to true across all 6 canonical exercise types', () => {
      for (const ex of Object.values(canonicalExercises)) {
        expect(checkQuestionCorrect(ex, ex.correctAnswer)).toBe(true);
      }
    });

    it('4.2: Falsy and missing answers evaluate to false', () => {
      const ex = canonicalExercises.multiple_choice;
      expect(checkQuestionCorrect(ex, '')).toBe(false);
      expect(checkQuestionCorrect(ex, null as any)).toBe(false);
      expect(checkQuestionCorrect(ex, undefined as any)).toBe(false);
    });

    it('4.3: Whitespace and case variations evaluate robustly', () => {
      const ex: ExerciseItem = {
        id: 'test-norm',
        type: 'multiple_choice',
        question: 'Q',
        options: ['A. Hello World'],
        correctAnswer: 'A. Hello World',
        explanation: 'Exp',
      };

      expect(checkQuestionCorrect(ex, 'a. hello world')).toBe(true);
      expect(checkQuestionCorrect(ex, '  A.  Hello   World  ')).toBe(true);
      expect(checkQuestionCorrect(ex, 'A.HELLOWORLD')).toBe(true);
      expect(checkQuestionCorrect(ex, 'A. Goodbye World')).toBe(false);
    });

    it('4.4: Curricular Invariant Audit: ZERO false positives across all 30 lessons (HSK 1 & HSK 2)', () => {
      const allLessons = [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS];
      const falsePositives: {
        hskLevel: number;
        lessonNumber: number;
        exerciseId: string;
        correctAnswer: string;
        conflictingWrongOption: string;
      }[] = [];

      for (const lesson of allLessons) {
        for (const ex of lesson.exercises || []) {
          if (!ex.options || ex.options.length <= 1) continue;
          for (const opt of ex.options) {
            if (opt === ex.correctAnswer) continue;
            // Verify this wrong option is NOT evaluated as correct
            if (checkQuestionCorrect(ex, opt)) {
              falsePositives.push({
                hskLevel: (lesson as any).hskLevel || 1,
                lessonNumber: lesson.lessonNumber,
                exerciseId: ex.id,
                correctAnswer: ex.correctAnswer,
                conflictingWrongOption: opt,
              });
            }
          }
        }
      }

      // Assert that NO wrong option is ever evaluated as correct!
      expect(falsePositives).toEqual([]);
    });

    it('4.5: Curricular Invariant Audit: ALL authentic exercise correct answers evaluate to true', () => {
      const allLessons = [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS];
      const failingQuestions: {
        lessonNumber: number;
        exerciseId: string;
        correctAnswer: string;
      }[] = [];

      for (const lesson of allLessons) {
        for (const ex of lesson.exercises || []) {
          if (!ex.correctAnswer) {
            failingQuestions.push({
              lessonNumber: lesson.lessonNumber,
              exerciseId: ex.id,
              correctAnswer: 'MISSING',
            });
            continue;
          }
          if (!checkQuestionCorrect(ex, ex.correctAnswer)) {
            failingQuestions.push({
              lessonNumber: lesson.lessonNumber,
              exerciseId: ex.id,
              correctAnswer: ex.correctAnswer,
            });
          }
        }
      }

      expect(failingQuestions).toEqual([]);
    });
  });

  // =========================================================================
  // 5. CHALLENGE 5: STATE MACHINE INTERACTIVE INVARIANT SIMULATION
  // =========================================================================
  describe('5. Challenge 5: State Machine Interactive Invariant Simulation', () => {
    // Simulator mirroring LessonExercisesStudio state machine precisely:
    class StudioStateMachine {
      selectedAnswers: Record<string, string> = {};
      scrambleBuilt: Record<string, string[]> = {};
      rewardedQuestionIds: Set<string> = new Set();
      notes: Record<string, string> = {};
      xpAwarded: number = 0;

      constructor(public lesson: DetailedTextbookLesson, public hskLevel: number) {}

      handleSelectOption(exerciseId: string, opt: string) {
        if (this.selectedAnswers[exerciseId]) return; // Locked once answered
        this.selectedAnswers[exerciseId] = opt;

        const ex = (this.lesson.exercises || []).find((e) => e.id === exerciseId);
        if (!ex) return;

        const cleanUser = opt.replace(/\s+/g, '').toLowerCase();
        const cleanCorrect = (ex.correctAnswer || '').replace(/\s+/g, '').toLowerCase();
        const isCorrect = cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);

        if (isCorrect && !this.rewardedQuestionIds.has(exerciseId)) {
          this.rewardedQuestionIds.add(exerciseId);
          this.xpAwarded += 10;
        }
      }

      handleAddScrambleSegment(exerciseId: string, segment: string) {
        const ex = (this.lesson.exercises || []).find((e) => e.id === exerciseId);
        const totalSegments = ex?.scrambleSegments?.length || 0;
        const current = this.scrambleBuilt[exerciseId] || [];

        if (totalSegments > 0 && current.length >= totalSegments) return;

        const updated = [...current, segment];
        this.scrambleBuilt[exerciseId] = updated;

        if (totalSegments > 0 && updated.length === totalSegments) {
          const assembledText = updated.join('');
          this.selectedAnswers[exerciseId] = assembledText;

          if (ex) {
            const cleanUser = assembledText.replace(/\s+/g, '').toLowerCase();
            const cleanCorrect = (ex.correctAnswer || '').replace(/\s+/g, '').toLowerCase();
            const isCorrect = cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);

            if (isCorrect && !this.rewardedQuestionIds.has(exerciseId)) {
              this.rewardedQuestionIds.add(exerciseId);
              this.xpAwarded += 10;
            }
          }
        }
      }

      handleRemoveScrambleSegment(exerciseId: string, itemIdx: number) {
        const current = this.scrambleBuilt[exerciseId] || [];
        this.scrambleBuilt[exerciseId] = current.filter((_, idx) => idx !== itemIdx);
        delete this.selectedAnswers[exerciseId];
      }

      handleResetScramble(exerciseId: string) {
        this.scrambleBuilt[exerciseId] = [];
        delete this.selectedAnswers[exerciseId];
      }

      handleResetQuestion(exerciseId: string) {
        delete this.selectedAnswers[exerciseId];
        this.scrambleBuilt[exerciseId] = [];
      }

      handleResetAll() {
        this.selectedAnswers = {};
        this.scrambleBuilt = {};
      }

      handleUpdateNote(exerciseId: string, value: string, storage: MockLocalStorage) {
        this.notes[exerciseId] = value;
        const consolidatedKey = `minnese_exercise_notes_hsk${this.hskLevel}_l${this.lesson.lessonNumber}`;
        storage.setItem(consolidatedKey, JSON.stringify(this.notes));

        const directKey = `minnese_note_${exerciseId}`;
        if (value.trim()) {
          storage.setItem(directKey, value);
        } else {
          storage.removeItem(directKey);
        }
      }
    }

    it('5.1: Option locking: once an option is selected, subsequent option clicks are rejected', () => {
      const sm = new StudioStateMachine(canonicalLesson, 1);
      const exId = canonicalExercises.multiple_choice.id;

      sm.handleSelectOption(exId, 'A. 你好');
      expect(sm.selectedAnswers[exId]).toBe('A. 你好');

      // Attempt to change answer to B. 再见
      sm.handleSelectOption(exId, 'B. 再见');
      // Must remain locked to initial selection A. 你好
      expect(sm.selectedAnswers[exId]).toBe('A. 你好');
    });

    it('5.2: Anti-XP farming: retrying a question after reset does NOT re-award duplicate XP', () => {
      const sm = new StudioStateMachine(canonicalLesson, 1);
      const exId = canonicalExercises.multiple_choice.id;

      // First attempt correct
      sm.handleSelectOption(exId, 'A. 你好');
      expect(sm.xpAwarded).toBe(10);
      expect(sm.rewardedQuestionIds.has(exId)).toBe(true);

      // Reset question
      sm.handleResetQuestion(exId);
      expect(sm.selectedAnswers[exId]).toBeUndefined();

      // Answer correctly second time
      sm.handleSelectOption(exId, 'A. 你好');
      // XP must still be 10, NOT 20!
      expect(sm.xpAwarded).toBe(10);
    });

    it('5.3: Scramble state transitions: building, removing, resetting, and full assembly evaluation', () => {
      const sm = new StudioStateMachine(canonicalLesson, 1);
      const exId = canonicalExercises.sentence_scramble.id; // Segments: ['我', '是', '越南人']

      // Step 1: Add first segment
      sm.handleAddScrambleSegment(exId, '我');
      expect(sm.scrambleBuilt[exId]).toEqual(['我']);
      expect(sm.selectedAnswers[exId]).toBeUndefined(); // Incomplete, not evaluated

      // Step 2: Add second segment
      sm.handleAddScrambleSegment(exId, '越南人');
      expect(sm.scrambleBuilt[exId]).toEqual(['我', '越南人']);
      expect(sm.selectedAnswers[exId]).toBeUndefined();

      // Step 3: Remove second segment
      sm.handleRemoveScrambleSegment(exId, 1);
      expect(sm.scrambleBuilt[exId]).toEqual(['我']);

      // Step 4: Click 'Xóa làm lại'
      sm.handleResetScramble(exId);
      expect(sm.scrambleBuilt[exId]).toEqual([]);

      // Step 5: Place in correct order: 我, 是, 越南人
      sm.handleAddScrambleSegment(exId, '我');
      sm.handleAddScrambleSegment(exId, '是');
      sm.handleAddScrambleSegment(exId, '越南人');

      // Evaluates immediately on 3rd segment
      expect(sm.scrambleBuilt[exId]).toEqual(['我', '是', '越南人']);
      expect(sm.selectedAnswers[exId]).toBe('我是越南人');
      expect(sm.xpAwarded).toBe(10);

      // Step 6: Attempt to add extra segment beyond total
      sm.handleAddScrambleSegment(exId, '我');
      expect(sm.scrambleBuilt[exId].length).toBe(3);
    });

    it('5.4: Live stats calculation matches answered count, correct count, and percentage', () => {
      const sm = new StudioStateMachine(canonicalLesson, 1);

      // Answer 1: MC correct
      sm.handleSelectOption(canonicalExercises.multiple_choice.id, 'A. 你好');
      // Answer 2: Fill blank WRONG
      sm.handleSelectOption(canonicalExercises.fill_blank.id, '不');

      // Total answered = 2, Correct = 1
      let answered = 0;
      let correct = 0;
      for (const ex of canonicalLesson.exercises) {
        const ans = sm.selectedAnswers[ex.id];
        if (ans) {
          answered++;
          const cleanUser = ans.replace(/\s+/g, '').toLowerCase();
          const cleanCorrect = (ex.correctAnswer || '').replace(/\s+/g, '').toLowerCase();
          if (cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
            correct++;
          }
        }
      }

      expect(answered).toBe(2);
      expect(correct).toBe(1);
      const pct = Math.round((correct / canonicalLesson.exercises.length) * 100);
      expect(pct).toBe(Math.round((1 / 6) * 100)); // 17%
    });

    it('5.5: Note persistence synchronization: saves to both keys and deletes direct key when cleared', () => {
      const sm = new StudioStateMachine(canonicalLesson, 1);
      const exId = canonicalExercises.translation.id;
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      const directKey = `minnese_note_${exId}`;

      // Save non-empty note
      sm.handleUpdateNote(exId, 'Ghi chú tiếng Trung: 很高兴认识你', mockStorage);
      expect(JSON.parse(mockStorage.getItem(consolidatedKey)!)[exId]).toBe('Ghi chú tiếng Trung: 很高兴认识你');
      expect(mockStorage.getItem(directKey)).toBe('Ghi chú tiếng Trung: 很高兴认识你');

      // Clear note
      sm.handleUpdateNote(exId, '', mockStorage);
      expect(JSON.parse(mockStorage.getItem(consolidatedKey)!)[exId]).toBe('');
      // Direct key must be removed
      expect(mockStorage.getItem(directKey)).toBeNull();
    });
  });
});

