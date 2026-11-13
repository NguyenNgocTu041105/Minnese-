import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { LessonExercisesStudio } from '../src/components/Coursebook/LessonExercisesStudio';
import {
  ExerciseItem,
  ExerciseType,
  DetailedTextbookLesson,
  NEW_HSK1_FULL_LESSONS,
} from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';

// ============================================================================
// Helper to strip React 19 SSR comment markers for clean text assertions
// ============================================================================
function cleanHtml(html: string): string {
  return html.replace(/<!-- -->/g, '');
}

// ============================================================================
// In-Memory Mock Storage Implementation for LocalStorage Testing
// ============================================================================
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

// ============================================================================
// Canonical Test Fixtures Matching DetailedTextbookLesson Schema
// ============================================================================
const sampleExerciseMC: ExerciseItem = {
  id: 'hsk1-l1-ex-1',
  type: 'multiple_choice',
  question: 'Chọn chữ Hán đúng cho từ "Nǐ hǎo":',
  hanziPrompt: '你好',
  pinyinPrompt: 'Nǐ hǎo',
  vietnamesePrompt: 'Chào bạn',
  options: ['你好', '再见', '谢谢', '不客气'],
  correctAnswer: '你好',
  explanation: '"你好" (nǐ hǎo) là lời chào phổ biến nhất trong tiếng Trung, gồm "你" (bạn) và "好" (tốt).',
  grammarFocus: 'Chào hỏi cơ bản',
  audioText: '你好',
};

const sampleExerciseScramble: ExerciseItem = {
  id: 'hsk1-l1-ex-2',
  type: 'sentence_scramble',
  question: 'Sắp xếp các từ sau thành câu hoàn chỉnh:',
  scrambleSegments: ['我', '是', '越南人'],
  options: [],
  correctAnswer: '我是越南人',
  explanation: 'Cấu trúc câu khẳng định với "是": Chủ ngữ + 是 + Danh từ.',
  grammarFocus: 'Cấu trúc chữ 是',
  audioText: '我是越南人',
};

const sampleExerciseFillBlank: ExerciseItem = {
  id: 'hsk1-l1-ex-3',
  type: 'fill_blank',
  question: 'Điền từ thích hợp vào chỗ trống: 他 ____ 老师。',
  options: ['是', '不', '很', '吗'],
  correctAnswer: '是',
  explanation: 'Dùng động từ "是" để biểu thị phán đoán: Anh ấy là giáo viên.',
  grammarFocus: 'Động từ phán đoán 是',
};

const sampleExerciseTranslation: ExerciseItem = {
  id: 'hsk1-l1-ex-4',
  type: 'translation',
  question: 'Dịch câu sang tiếng Trung: "Rất vui được gặp bạn"',
  options: ['很高兴认识你', '你是哪国人', '明天见', '对不起'],
  correctAnswer: '很高兴认识你',
  explanation: '"很高兴认识你" (hěn gāoxìng rènshí nǐ) là mẫu câu lịch sự dùng khi mới quen biết.',
  grammarFocus: 'Mẫu câu xã giao',
};

const sampleExerciseDialogue: ExerciseItem = {
  id: 'hsk1-l1-ex-5',
  type: 'dialogue_match',
  question: 'Ghép câu trả lời phù hợp: "谢谢你！"',
  options: ['不客气', '没关系', '你好', '再见'],
  correctAnswer: '不客气',
  explanation: 'Khi người khác nói "谢谢" (cảm ơn), câu đáp lại chuẩn mực là "不客气" (đừng khách sáo).',
  grammarFocus: 'Hội thoại cảm ơn và đáp từ',
};

const sampleExerciseErrorSpotting: ExerciseItem = {
  id: 'hsk1-l1-ex-6',
  type: 'error_spotting',
  question: 'Tìm lỗi sai trong câu sau: "我不是是学生。"',
  options: ['Bỏ một chữ 是', 'Thay 是 bằng 有', 'Bỏ chữ 不', 'Thay 我 bằng 他'],
  correctAnswer: 'Bỏ một chữ 是',
  explanation: 'Câu bị lặp động từ "是", dạng phủ định chuẩn là "不是 + danh từ".',
  grammarFocus: 'Dạng phủ định 不是',
};

const sampleLesson: DetailedTextbookLesson = {
  lessonNumber: 1,
  titleHanzi: '你好',
  titlePinyin: 'Nǐ hǎo',
  titleVietnamese: 'Xin chào',
  pageStart: 1,
  objectives: ['Chào hỏi cơ bản'],
  texts: [],
  vocabulary: [],
  grammarPoints: [],
  exercises: [
    sampleExerciseMC,
    sampleExerciseScramble,
    sampleExerciseFillBlank,
    sampleExerciseTranslation,
    sampleExerciseDialogue,
    sampleExerciseErrorSpotting,
  ],
};

describe('LessonExercisesStudio Refactoring: Instant Feedback, Explanations & Notes Suite', () => {
  const rootDir = process.cwd();
  const targetComponentPath = path.resolve(rootDir, 'src/components/Coursebook/LessonExercisesStudio.tsx');
  let sourceCode: string;
  let originalLocalStorage: any;

  beforeEach(() => {
    sourceCode = fs.readFileSync(targetComponentPath, 'utf-8');
    originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = new MockLocalStorage();
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

  // ==========================================================================
  // REQUIREMENT R1: REMOVAL OF AI GENERATOR & MANUAL CHECK CONTROLS
  // ==========================================================================
  describe('Requirement R1: Complete Removal of AI Generator & Manual Check Controls', () => {
    it('R1.1: Source code contains ZERO occurrences of "Sinh thêm bài tập AI"', () => {
      expect(sourceCode).not.toContain('Sinh thêm bài tập AI');
      expect(sourceCode.toLowerCase()).not.toContain('sinh thêm bài tập ai');
    });

    it('R1.2: Source code contains ZERO occurrences of "Kiểm tra đáp án" batch check button', () => {
      expect(sourceCode).not.toContain('Kiểm tra đáp án');
      expect(sourceCode.toLowerCase()).not.toContain('kiểm tra đáp án');
    });

    it('R1.3: Source code contains ZERO occurrences of "Luyện thêm câu mới" secondary trigger', () => {
      expect(sourceCode).not.toContain('Luyện thêm câu mới');
      expect(sourceCode.toLowerCase()).not.toContain('luyện thêm câu mới');
    });

    it('R1.4: Source code contains ZERO references to AI generation modal state or setters', () => {
      expect(sourceCode).not.toContain('isAiModalOpen');
      expect(sourceCode).not.toContain('setIsAiModalOpen');
      expect(sourceCode).not.toContain('aiQuestionCount');
      expect(sourceCode).not.toContain('setAiQuestionCount');
      expect(sourceCode).not.toContain('aiPracticeMode');
      expect(sourceCode).not.toContain('setAiPracticeMode');
      expect(sourceCode).not.toContain('isGeneratingAi');
      expect(sourceCode).not.toContain('aiGenError');
      expect(sourceCode).not.toContain('aiGenSuccessNotice');
    });

    it('R1.5: Source code contains ZERO references to AI generation handlers or API routes', () => {
      expect(sourceCode).not.toContain('handleGenerateAiExercises');
      expect(sourceCode).not.toContain('/api/gemini/generate-lesson-exercises');
      expect(sourceCode).not.toContain('handleCheckAnswers');
    });

    it('R1.6: Source code completely removes AI generation modal JSX dialog container', () => {
      expect(sourceCode).not.toContain('Sinh thêm bài tập AI thông minh');
      expect(sourceCode).not.toContain('bg-black/60 backdrop-blur-xs');
      expect(sourceCode).not.toMatch(/<Sparkles[^>]*\/>\s*<h4[^>]*>Sinh thêm/i);
    });

    it('R1.7: Rendered HTML output has zero removed buttons or AI modal dialogs', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).not.toContain('Sinh thêm bài tập AI');
      expect(html).not.toContain('Kiểm tra đáp án');
      expect(html).not.toContain('Luyện thêm câu mới');
      expect(html).not.toContain('Sinh thêm bài tập AI thông minh');
    });
  });

  // ==========================================================================
  // REQUIREMENT R2: INSTANT FEEDBACK & DETAILED GRAMMATICAL EXPLANATIONS
  // ==========================================================================
  describe('Requirement R2: Instant Feedback & Detailed Grammatical Explanations', () => {
    it('R2.1: Header action area displays live progress badge ("Đã làm: X/Y • Đúng: Z")', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      // Verify presence of live counter chip
      expect(html).toContain('Đã làm: 0/6 • Đúng: 0');
    });

    it('R2.2: Header action area provides a global reset button ("Làm lại tất cả")', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Làm lại tất cả');
      expect(sourceCode).toContain('handleResetAll');
    });

    it('R2.3: Option correctness styling is evaluated per question without global batch check gating', () => {
      // Must not gate correctness behind a global isChecked boolean
      expect(sourceCode).not.toMatch(/const\s+isCorrect\s*=\s*isChecked\s*&&/);
      expect(sourceCode).not.toMatch(/{\s*isChecked\s*&&/);
      // Option styling must have emerald (correct) and rose (incorrect) instant visual feedback
      expect(sourceCode).toContain('bg-emerald-500');
      expect(sourceCode).toContain('bg-rose-500');
    });

    it('R2.4: Question cards render per-question retry button ("Làm lại câu này")', () => {
      // Must support resetting individual question state
      expect(sourceCode).toContain('handleResetQuestion');
      expect(sourceCode).toContain('Làm lại câu này');
    });

    it('R2.5: Immediate grammatical explanation rendering contract', () => {
      // The explanation box must render ex.explanation and ex.grammarFocus directly upon answer
      expect(sourceCode).toContain('{ex.explanation}');
      expect(sourceCode).toContain('{ex.grammarFocus}');
      expect(sourceCode).toContain('Chính xác! 🎉');
      expect(sourceCode).toContain('Chưa chính xác');
      expect(sourceCode).toContain('Đáp án đúng:');
    });

    it('R2.6: Sentence Scramble instant evaluation upon placing all segments', () => {
      // Source code must trigger evaluation when segments placed equals total segments
      expect(sourceCode).toContain('handleAddScrambleSegment');
      expect(sourceCode).toContain('handleResetScramble');
      expect(sourceCode).toContain('Xóa làm lại');
    });

    it('R2.7: Incremental XP award contract upon answering correctly', () => {
      // XP must be awarded incrementally upon answering correctly rather than batch check
      expect(sourceCode).toMatch(/onUpdateUserXp\s*\(\s*10\s*\)/);
      expect(sourceCode).toContain('rewardedQuestionIds');
    });

    it('R2.8: checkQuestionCorrect normalizes whitespace, case, and handles partial answer inclusion', () => {
      // Validate the answer comparison logic used in the studio
      expect(sourceCode).toContain('checkQuestionCorrect');
      expect(sourceCode).toContain('.replace(/\\s+/g, \'\')');
      expect(sourceCode).toContain('.toLowerCase()');
    });
  });

  // ==========================================================================
  // REQUIREMENT R3: QUESTION NOTE-TAKING SECTION & LOCAL PERSISTENCE
  // ==========================================================================
  describe('Requirement R3: Dedicated Question Note-Taking Section & LocalStorage Persistence', () => {
    it('R3.1: Every question card renders a dedicated personal note-taking area with textarea', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      // Must render note box header
      expect(html).toContain('Ghi chú cá nhân của bạn');
      // Must render textarea
      expect(html).toContain('<textarea');
      // Must render descriptive placeholder
      expect(html).toContain('Ghi chép từ vựng mới, cấu trúc ngữ pháp cần lưu ý cho câu này...');
    });

    it('R3.2: Storage contract defines both consolidated lesson key and direct exercise fallback key', () => {
      // Consolidated key format: minnese_exercise_notes_hsk${hskLevel}_l${lesson.lessonNumber}
      expect(sourceCode).toContain('minnese_exercise_notes_hsk');
      // Direct key format: minnese_note_${exerciseId}
      expect(sourceCode).toContain('minnese_note_');
    });

    it('R3.3: Component guards all localStorage operations with typeof localStorage !== "undefined"', () => {
      // Safe against Node / SSR environments
      const storageOccurrences = sourceCode.match(/localStorage\.[a-zA-Z]+/g) || [];
      expect(storageOccurrences.length).toBeGreaterThan(0);
      expect(sourceCode).toContain("typeof localStorage !== 'undefined'");
    });

    it('R3.4: Restores pre-saved notes from consolidated localStorage key on mount/render', () => {
      const consolidatedKey = 'minnese_exercise_notes_hsk1_l1';
      const storedNotes = {
        'hsk1-l1-ex-1': 'Lưu ý: 你好 là lời chào trang trọng hoặc phổ biến.',
        'hsk1-l1-ex-3': 'Ngữ pháp chữ 是 rất quan trọng.',
      };
      (globalThis as any).localStorage.setItem(consolidatedKey, JSON.stringify(storedNotes));

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Lưu ý: 你好 là lời chào trang trọng hoặc phổ biến.');
      expect(html).toContain('Ngữ pháp chữ 是 rất quan trọng.');
      expect(html).toContain('Đã lưu tự động');
    });

    it('R3.5: Restores notes from direct key minnese_note_${id} as fallback if not in consolidated key', () => {
      const directKey = 'minnese_note_hsk1-l1-ex-4';
      (globalThis as any).localStorage.setItem(directKey, 'Ghi chú fallback từ direct key cho câu dịch.');

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      expect(html).toContain('Ghi chú fallback từ direct key cho câu dịch.');
      expect(html).toContain('Đã lưu tự động');
    });

    it('R3.6: SSR Resilience: Renders cleanly when localStorage is completely undefined', () => {
      (globalThis as any).localStorage = undefined;

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: sampleLesson,
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('Ghi chú cá nhân của bạn');
        expect(html).toContain('<textarea');
      }).not.toThrow();
    });

    it('R3.7: Graceful error recovery when localStorage contains corrupted/invalid JSON', () => {
      (globalThis as any).localStorage = new MockLocalStorage();
      (globalThis as any).localStorage.setItem('minnese_exercise_notes_hsk1_l1', 'INVALID_JSON_CORRUPTED{[[');

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: sampleLesson,
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('Ghi chú cá nhân của bạn');
      }).not.toThrow();
    });

    it('R3.8: Direct key cleanup: removing note deletes direct key from localStorage', () => {
      // Verification of direct key cleanup contract in handleUpdateNote
      expect(sourceCode).toContain('localStorage.removeItem(directKey)');
    });
  });

  // ==========================================================================
  // MULTI-EXERCISE & CURRICULUM COMPATIBILITY
  // ==========================================================================
  describe('Multi-Exercise & Curriculum Compatibility (HSK 1 & HSK 2)', () => {
    it('renders cleanly across ALL 15 lessons of NEW_HSK1_FULL_LESSONS', () => {
      NEW_HSK1_FULL_LESSONS.forEach((realLesson) => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: realLesson,
              hskLevel: 1,
            })
          )
        );

        expect(html).toContain(`HSK 1 • Bài ${realLesson.lessonNumber}`);
        expect(html).not.toContain('Sinh thêm bài tập AI');
        expect(html).not.toContain('Kiểm tra đáp án');

        // Verify each exercise in the lesson has a note taking area
        (realLesson.exercises || []).forEach((ex) => {
          expect(html).toContain(`id="note-${ex.id}"`);
        });
      });
    });

    it('renders cleanly across ALL 15 lessons of NEW_HSK2_FULL_LESSONS', () => {
      NEW_HSK2_FULL_LESSONS.forEach((realLesson) => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: realLesson,
              hskLevel: 2,
            })
          )
        );

        expect(html).toContain(`HSK 2 • Bài ${realLesson.lessonNumber}`);
        expect(html).not.toContain('Sinh thêm bài tập AI');
        expect(html).not.toContain('Kiểm tra đáp án');

        // Verify each exercise in the lesson has a note taking area
        (realLesson.exercises || []).forEach((ex) => {
          expect(html).toContain(`id="note-${ex.id}"`);
        });
      });
    });

    it('handles empty exercise list gracefully without divide-by-zero crashes', () => {
      const emptyLesson: DetailedTextbookLesson = {
        lessonNumber: 99,
        titleHanzi: '空',
        titlePinyin: 'kōng',
        titleVietnamese: 'Rỗng',
        pageStart: 99,
        objectives: [],
        texts: [],
        vocabulary: [],
        grammarPoints: [],
        exercises: [],
      };

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: emptyLesson,
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('0 câu bài tập vận dụng');
        expect(html).toContain('Đã làm: 0/0');
      }).not.toThrow();
    });

    it('renders exercise type filter tabs with accurate non-zero counts', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
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

    it('renders audio playback buttons for exercises with audioText or hanziPrompt', () => {
      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      // Exercises with audioText have title="Nghe phát âm chuẩn"
      expect(html).toContain('title="Nghe phát âm chuẩn"');
    });
  });

  // ==========================================================================
  // ADVERSARIAL VERIFICATION & BOUNDARY STRESS
  // ==========================================================================
  describe('Adversarial Verification & Boundary Stress', () => {
    it('preserves notes with complex special characters, quotes, HTML tags, and emojis', () => {
      const complexNote = 'Ghi chú "đặc biệt": <script>alert(1)</script> • Dấu ngoặc \\/ & "引号" 🎉 🇨🇳 100%!';
      const key = 'minnese_exercise_notes_hsk1_l1';
      (globalThis as any).localStorage.setItem(key, JSON.stringify({ 'hsk1-l1-ex-1': complexNote }));

      const html = cleanHtml(
        renderToString(
          React.createElement(LessonExercisesStudio, {
            lesson: sampleLesson,
            hskLevel: 1,
          })
        )
      );

      // Note text is safely escaped into textarea by React
      expect(html).toContain('Ghi chú &quot;đặc biệt&quot;: &lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).toContain('🎉 🇨🇳 100%!');
    });

    it('handles localStorage QuotaExceededError gracefully without unhandled crashes', () => {
      // Mock setItem throwing QuotaExceededError
      const failingStorage = new MockLocalStorage();
      failingStorage.setItem = () => {
        const err = new Error('The quota has been exceeded.');
        err.name = 'QuotaExceededError';
        throw err;
      };
      (globalThis as any).localStorage = failingStorage;

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: sampleLesson,
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('Ghi chú cá nhân của bạn');
      }).not.toThrow();
    });

    it('handles questions missing optional prompts/grammarFocus gracefully', () => {
      const bareExercise: ExerciseItem = {
        id: 'bare-1',
        type: 'multiple_choice',
        question: 'Câu hỏi tối giản không có prompts phụ',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Giải thích tối giản.',
      };

      const bareLesson: DetailedTextbookLesson = {
        lessonNumber: 5,
        titleHanzi: '测试',
        titlePinyin: 'cèshì',
        titleVietnamese: 'Kiểm thử',
        pageStart: 5,
        objectives: [],
        texts: [],
        vocabulary: [],
        grammarPoints: [],
        exercises: [bareExercise],
      };

      expect(() => {
        const html = cleanHtml(
          renderToString(
            React.createElement(LessonExercisesStudio, {
              lesson: bareLesson,
              hskLevel: 1,
            })
          )
        );
        expect(html).toContain('Câu hỏi tối giản không có prompts phụ');
      }).not.toThrow();
    });
  });
});
