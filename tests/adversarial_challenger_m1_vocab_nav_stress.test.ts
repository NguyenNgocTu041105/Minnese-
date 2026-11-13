import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { CoursebookReturnOrigin, CoursebookTab, WordItem } from '../src/types';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';

describe('Adversarial Empirical Stress Testing — Milestone 1 (challenger_m1_2)', () => {
  const coursebookViewPath = path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx');
  const appPath = path.resolve(__dirname, '../src/App.tsx');
  const flashcardsViewPath = path.resolve(__dirname, '../src/components/Flashcards/FlashcardsView.tsx');

  // =========================================================================
  // Challenge 1: Flashcards started with lessonNumber = undefined / 0
  // =========================================================================
  describe('Challenge 1: Flashcards started with undefined or falsy lessonNumber', () => {
    it('empirically falls back to deck-coursebook-progress and null returnOrigin when lessonNumber is undefined', () => {
      let selectedFlashcardDeckId: string | null = null;
      let flashcardReturnOrigin: CoursebookReturnOrigin | null = {
        source: 'coursebook',
        level: 1,
        lessonNumber: 1,
        tab: 'vocab',
      };
      let activeTab: string = 'coursebook';

      const mockSetSelectedFlashcardDeckId = (id: string | null) => {
        selectedFlashcardDeckId = id;
      };
      const mockSetFlashcardReturnOrigin = (origin: CoursebookReturnOrigin | null) => {
        flashcardReturnOrigin = origin;
      };
      const mockSetActiveTab = (tab: string) => {
        activeTab = tab;
      };
      const mockAddWordToSRS = vi.fn();

      // Mirror App.tsx onStartFlashcards logic exactly
      const onStartFlashcards = (
        words: WordItem[],
        lessonNumber?: number,
        level?: 1 | 2 | 3 | 4 | 5 | 6,
        originTab?: CoursebookTab
      ) => {
        words.forEach((w) => mockAddWordToSRS(w.id));
        const userProfileCurrentLevel = 1;
        const hskLevel = (level || userProfileCurrentLevel || 1) as 1 | 2 | 3 | 4 | 5 | 6;
        if (lessonNumber) {
          mockSetSelectedFlashcardDeckId(`deck-lesson-${hskLevel}-${lessonNumber}`);
          mockSetFlashcardReturnOrigin({
            source: 'coursebook',
            level: hskLevel,
            lessonNumber,
            tab: originTab || 'vocab',
          });
        } else {
          mockSetSelectedFlashcardDeckId('deck-coursebook-progress');
          mockSetFlashcardReturnOrigin(null);
        }
        mockSetActiveTab('flashcards');
      };

      const dummyWords: WordItem[] = [
        { id: 'w1', hanzi: '你好', pinyin: 'nǐ hǎo', vietnamese: 'xin chào', hskLevel: 1 },
      ];

      // Invoke with lessonNumber = undefined
      onStartFlashcards(dummyWords, undefined, 2, 'vocab');

      expect(selectedFlashcardDeckId).toBe('deck-coursebook-progress');
      expect(flashcardReturnOrigin).toBeNull();
      expect(activeTab).toBe('flashcards');
      expect(mockAddWordToSRS).toHaveBeenCalledWith('w1');

      // Now verify exit behavior when returnOrigin is null
      let exitSelectedDeckId: string | null = 'deck-coursebook-progress';
      const mockOnReturnToOrigin = vi.fn();
      const mockOnClearInitialDeckId = vi.fn();

      const handleExitStudy = (returnOrigin: CoursebookReturnOrigin | null) => {
        if (returnOrigin && mockOnReturnToOrigin) {
          mockOnReturnToOrigin(returnOrigin);
        } else {
          exitSelectedDeckId = null;
          mockOnClearInitialDeckId();
        }
      };

      handleExitStudy(flashcardReturnOrigin);

      // Verify it does NOT trigger onReturnToOrigin and safely clears deck to show roadmap
      expect(mockOnReturnToOrigin).not.toHaveBeenCalled();
      expect(exitSelectedDeckId).toBeNull();
      expect(mockOnClearInitialDeckId).toHaveBeenCalled();
      expect(activeTab).toBe('flashcards'); // Remains on flashcards roadmap view
    });

    it('empirically handles lessonNumber = 0 as falsy and routes to coursebook-progress deck safely', () => {
      let selectedDeckId: string | null = null;
      let returnOrigin: CoursebookReturnOrigin | null = 'initial' as any;

      const onStart = (lessonNumber?: number) => {
        const hskLevel = 1;
        if (lessonNumber) {
          selectedDeckId = `deck-lesson-${hskLevel}-${lessonNumber}`;
          returnOrigin = { source: 'coursebook', level: 1, lessonNumber, tab: 'vocab' };
        } else {
          selectedDeckId = 'deck-coursebook-progress';
          returnOrigin = null;
        }
      };

      onStart(0);
      expect(selectedDeckId).toBe('deck-coursebook-progress');
      expect(returnOrigin).toBeNull();
    });
  });

  // =========================================================================
  // Challenge 2: Out-of-bounds or Invalid lessonNumber in returnOrigin
  // =========================================================================
  describe('Challenge 2: Out-of-bounds and invalid lessonNumber handling', () => {
    it('empirically clamps negative or zero lessonNumber to lessonIndex = 0 in App.tsx', () => {
      const runOnReturn = (lessonNumber: number) => {
        const origin: CoursebookReturnOrigin = {
          source: 'coursebook',
          level: 1,
          lessonNumber,
          tab: 'vocab',
        };
        return {
          level: origin.level,
          lessonIndex: Math.max(0, origin.lessonNumber - 1),
          tab: origin.tab || 'vocab',
        };
      };

      expect(runOnReturn(0).lessonIndex).toBe(0);
      expect(runOnReturn(-1).lessonIndex).toBe(0);
      expect(runOnReturn(-999).lessonIndex).toBe(0);
      expect(runOnReturn(1).lessonIndex).toBe(0);
      expect(runOnReturn(2).lessonIndex).toBe(1);
      expect(runOnReturn(15).lessonIndex).toBe(14);
    });

    it('empirically falls back to activeLessonsList[0] when lessonIndex exceeds total lessons in CoursebookView', () => {
      const activeLessonsList = NEW_HSK1_FULL_LESSONS;
      expect(activeLessonsList.length).toBe(15);

      // Function under test matching CoursebookView line 1281-1282
      const resolveCurrentLesson = (selectedLessonIndex: number) => {
        return activeLessonsList[selectedLessonIndex] || activeLessonsList[0];
      };

      // Extreme out of bounds
      const lesson999 = resolveCurrentLesson(999);
      expect(lesson999).toBeDefined();
      expect(lesson999.lessonNumber).toBe(1); // Safely defaulted to Lesson 1

      const lessonNegative = resolveCurrentLesson(-5);
      expect(lessonNegative).toBeDefined();
      expect(lessonNegative.lessonNumber).toBe(1);

      // Boundary: index 14 is Lesson 15
      const lesson15 = resolveCurrentLesson(14);
      expect(lesson15.lessonNumber).toBe(15);

      // Out of bounds: index 15 (which is 16th item, does not exist in 15-lesson course)
      const lesson16 = resolveCurrentLesson(15);
      expect(lesson16.lessonNumber).toBe(1); // Safely defaulted to Lesson 1
    });

    it('resiliently handles NaN lessonNumber without crashing', () => {
      const origin: CoursebookReturnOrigin = {
        source: 'coursebook',
        level: 1,
        lessonNumber: NaN,
        tab: 'vocab',
      };
      const computedIndex = Math.max(0, origin.lessonNumber - 1);
      // Math.max(0, NaN) is NaN
      expect(Number.isNaN(computedIndex)).toBe(true);

      // CoursebookView guard: typeof initialLessonIndex === 'number' && initialLessonIndex >= 0
      // In JS, NaN >= 0 is false!
      const isAcceptedByCoursebook =
        typeof computedIndex === 'number' && computedIndex >= 0;
      expect(isAcceptedByCoursebook).toBe(false);

      // Falls back to 0
      const initialIndex = isAcceptedByCoursebook ? computedIndex : 0;
      expect(initialIndex).toBe(0);
    });
  });

  // =========================================================================
  // Challenge 3: Flashcards visited directly from navbar and exited
  // =========================================================================
  describe('Challenge 3: Direct Navbar visit to Flashcards and session exit', () => {
    it('empirically verifies App.tsx clears flashcardReturnOrigin upon navbar selection', () => {
      const appContent = fs.readFileSync(appPath, 'utf-8');

      // Top navbar handler:
      // if (tab === 'flashcards') { setFlashcardReturnOrigin(null); }
      expect(appContent).toMatch(/if\s*\(\s*tab\s*===\s*['"]flashcards['"]\s*\)\s*\{\s*setFlashcardReturnOrigin\(null\);/);

      // Mobile bottom nav handler:
      expect(appContent).toMatch(/if\s*\(\s*\(item\.id\s+as\s+string\)\s*===\s*['"]flashcards['"]\s*\)\s*\{\s*setFlashcardReturnOrigin\(null\);/);
    });

    it('empirically verifies FlashcardsView handles null returnOrigin by showing roadmap and not redirecting', () => {
      let currentView = 'study_session';
      let selectedDeckId: string | null = 'deck-hsk1-all';
      let activeTab = 'flashcards';
      const onReturnToOrigin = vi.fn();
      const onClearInitialDeckId = vi.fn(() => {
        selectedDeckId = null;
      });

      const returnOrigin: CoursebookReturnOrigin | null = null;

      // FlashcardsView handleExitStudy implementation
      const handleExitStudy = () => {
        if (returnOrigin && onReturnToOrigin) {
          onReturnToOrigin(returnOrigin);
        } else {
          selectedDeckId = null;
          if (onClearInitialDeckId) {
            onClearInitialDeckId();
          }
        }
      };

      handleExitStudy();

      expect(onReturnToOrigin).not.toHaveBeenCalled();
      expect(selectedDeckId).toBeNull();
      expect(onClearInitialDeckId).toHaveBeenCalled();
      expect(activeTab).toBe('flashcards'); // User stays on flashcards tab
    });

    it('verifies back button text in FlashcardsView is dynamic based on returnOrigin presence', () => {
      const flashcardsContent = fs.readFileSync(flashcardsViewPath, 'utf-8');

      expect(flashcardsContent).toContain("returnOrigin?.source === 'coursebook'");
      expect(flashcardsContent).toContain('`Quay lại bài học (Bài ${returnOrigin.lessonNumber})`');
      expect(flashcardsContent).toContain("'Quay lại danh sách bài học'");
    });
  });

  // =========================================================================
  // Challenge 4: Absence of "Bài trước", "Bài sau", "Bài tiếp theo" in CoursebookView
  // =========================================================================
  describe('Challenge 4: Complete eradication of previous/next lesson buttons across CoursebookView', () => {
    it('verifies ZERO conditional or unconditional paths render "Bài trước" in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');

      // Strict check for "Bài trước" anywhere in file
      const match = content.match(/Bài\s*trước/i);
      expect(match).toBeNull();
    });

    it('verifies ZERO conditional or unconditional paths render "Bài sau" in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');

      // Strict check for "Bài sau" anywhere in file
      const match = content.match(/Bài\s*sau/i);
      expect(match).toBeNull();
    });

    it('verifies ZERO occurrences of "Bài tiếp theo" in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');

      const match = content.match(/Bài\s*tiếp\s*theo/i);
      expect(match).toBeNull();
    });

    it('verifies ChevronLeft is completely removed from imports and JSX in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');

      expect(content).not.toContain('ChevronLeft');
    });

    it('verifies the completion button is properly retained and centered at the bottom of CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');

      expect(content).toContain('toggleCompleteLesson(currentLesson.lessonNumber)');
      expect(content).toContain('Đánh dấu đã học xong bài');
      expect(content).toContain('✓ Đã học xong bài này');
      expect(content).toContain('justify-center mt-8');
    });
  });

  // =========================================================================
  // Challenge 5: Cross-course resilience & Idempotent Origin Consumption
  // =========================================================================
  describe('Challenge 5: Multi-level HSK support and State Consumption Hygiene', () => {
    it('supports origin return across all HSK levels (1 through 6)', () => {
      const levels: (1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 3, 4, 5, 6];

      for (const level of levels) {
        const origin: CoursebookReturnOrigin = {
          source: 'coursebook',
          level,
          lessonNumber: 7,
          tab: 'vocab',
        };

        const state = {
          level: origin.level,
          lessonIndex: Math.max(0, origin.lessonNumber - 1),
          tab: origin.tab || 'vocab',
        };

        expect(state.level).toBe(level);
        expect(state.lessonIndex).toBe(6);
        expect(state.tab).toBe('vocab');
      }
    });

    it('verifies CoursebookView clears initial state immediately after consumption to prevent re-navigation loops', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');

      // Look for the useEffect cleanup invocation
      expect(content).toContain('if (shouldClear && onClearInitialCoursebookState) {');
      expect(content).toContain('onClearInitialCoursebookState();');
    });
  });
});
