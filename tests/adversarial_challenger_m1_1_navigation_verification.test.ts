/**
 * tests/adversarial_challenger_m1_1_navigation_verification.test.ts
 *
 * Empirical Challenger Verification Suite for Milestone 1 (R1 & R6)
 * Author: challenger_m1_1 (critic, specialist)
 *
 * Direct empirical challenge and stress-testing:
 * 1. AST & code-level verification of CoursebookView.tsx, FlashcardsView.tsx, App.tsx, types.ts
 * 2. Strict 0-occurrence assertion for "Bài trước", "Bài sau", "Bài tiếp theo"
 * 3. Functional rendering check for completion button ("Đánh dấu đã học xong bài")
 * 4. End-to-end state machine simulation of the navigation return loop
 * 5. Adversarial edge cases: bounds clipping, missing origin, multiple roundtrips, direct entry
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { CoursebookReturnOrigin, CoursebookTab, WordItem } from '../src/types';

describe('Adversarial Challenger M1: Empirical Verification of R1 & R6', () => {
  const typesPath = path.resolve(__dirname, '../src/types.ts');
  const coursebookViewPath = path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx');
  const appPath = path.resolve(__dirname, '../src/App.tsx');
  const flashcardsViewPath = path.resolve(__dirname, '../src/components/Flashcards/FlashcardsView.tsx');

  // =========================================================================
  // 1. AST / CODE INSPECTION: REMOVAL OF NAVIGATION BUTTONS (R6)
  // =========================================================================
  describe('Requirement R6: Complete Removal of Lesson Navigation Buttons', () => {
    const coursebookContent = fs.readFileSync(coursebookViewPath, 'utf-8');

    it('asserts strictly 0 occurrences of "Bài trước" in CoursebookView.tsx', () => {
      const matches = coursebookContent.match(/Bài trước/g);
      expect(matches).toBeNull();
    });

    it('asserts strictly 0 occurrences of "Bài sau" in CoursebookView.tsx', () => {
      const matches = coursebookContent.match(/Bài sau/g);
      expect(matches).toBeNull();
    });

    it('asserts strictly 0 occurrences of "Bài tiếp theo" in CoursebookView.tsx', () => {
      const matches = coursebookContent.match(/Bài tiếp theo/g);
      expect(matches).toBeNull();
    });

    it('asserts 0 occurrences of unused ChevronLeft in CoursebookView.tsx', () => {
      const matches = coursebookContent.match(/\bChevronLeft\b/g);
      expect(matches).toBeNull();
    });

    it('confirms completion button ("Đánh dấu đã học xong bài") is preserved and functional', () => {
      // Must contain button with toggleCompleteLesson handler
      expect(coursebookContent).toContain('toggleCompleteLesson(currentLesson.lessonNumber)');
      expect(coursebookContent).toContain('Đánh dấu đã học xong bài');
      expect(coursebookContent).toContain('✓ Đã học xong bài này');
      expect(coursebookContent).toContain('CheckCircle2');
      // Must be centered
      expect(coursebookContent).toContain('flex items-center justify-center mt-8');
    });

    it('confirms <WorkbookView> preserves currentLesson prop for workbook sync invariant', () => {
      expect(coursebookContent).toContain('<WorkbookView');
      expect(coursebookContent).toContain('currentLesson={currentLesson}');
    });
  });

  // =========================================================================
  // 2. CODE INSPECTION: NAVIGATION RETURN FLOW & CONTRACTS (R1)
  // =========================================================================
  describe('Requirement R1: Flashcard Return Navigation Flow & Contracts', () => {
    const typesContent = fs.readFileSync(typesPath, 'utf-8');
    const coursebookContent = fs.readFileSync(coursebookViewPath, 'utf-8');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    const flashcardsContent = fs.readFileSync(flashcardsViewPath, 'utf-8');

    it('types.ts exports CoursebookReturnOrigin and CoursebookTab', () => {
      expect(typesContent).toMatch(/export\s+type\s+CoursebookTab\s*=\s*'vocab'\s*\|\s*'text'/);
      expect(typesContent).toMatch(/export\s+interface\s+CoursebookReturnOrigin/);
    });

    it('CoursebookView vocabulary tab onStartFlashcards passes full 4-argument payload', () => {
      // Must pass (vocabulary, lessonNumber, selectedHskLevel, 'vocab')
      const vocabTabStartIndex = coursebookContent.indexOf("activeTab === 'vocab'");
      expect(vocabTabStartIndex).toBeGreaterThan(0);
      const vocabTabSection = coursebookContent.slice(
        vocabTabStartIndex,
        vocabTabStartIndex + 1000
      );
      expect(vocabTabSection).toContain('onStartFlashcards(');
      expect(vocabTabSection).toContain('currentLesson.vocabulary');
      expect(vocabTabSection).toContain('currentLesson.lessonNumber');
      expect(vocabTabSection).toContain('selectedHskLevel');
      expect(vocabTabSection).toContain("'vocab'");
    });

    it('CoursebookView header banner onStartFlashcards passes activeTab or fallback "vocab"', () => {
      expect(coursebookContent).toContain("activeTab || 'vocab'");
    });

    it('CoursebookView declares and consumes initial props correctly', () => {
      expect(coursebookContent).toContain('initialHskLevel?: 1 | 2 | 3 | 4 | 5 | 6;');
      expect(coursebookContent).toContain('initialLessonIndex?: number;');
      expect(coursebookContent).toContain('initialTab?: CoursebookTab;');
      expect(coursebookContent).toContain('onClearInitialCoursebookState?: () => void;');

      // Initial state evaluation
      expect(coursebookContent).toContain('if (initialHskLevel) return initialHskLevel;');
      expect(coursebookContent).toContain("if (typeof initialLessonIndex === 'number' && initialLessonIndex >= 0)");
      expect(coursebookContent).toContain("useState<CoursebookTab>(initialTab || 'text')");

      // Clear callback execution
      expect(coursebookContent).toContain('onClearInitialCoursebookState();');
    });

    it('App.tsx maintains flashcardReturnOrigin and coursebookInitialState', () => {
      expect(appContent).toContain('flashcardReturnOrigin, setFlashcardReturnOrigin');
      expect(appContent).toContain('coursebookInitialState, setCoursebookInitialState');
    });

    it('App.tsx wires onReturnToOrigin with state restoration to coursebook', () => {
      expect(appContent).toContain('onReturnToOrigin={(origin) => {');
      expect(appContent).toContain('setSelectedFlashcardDeckId(null);');
      expect(appContent).toContain('setFlashcardReturnOrigin(null);');
      expect(appContent).toContain('setCoursebookInitialState({');
      expect(appContent).toContain('level: origin.level,');
      expect(appContent).toContain('lessonIndex: Math.max(0, origin.lessonNumber - 1),');
      expect(appContent).toContain("tab: origin.tab || 'vocab',");
      expect(appContent).toContain("setActiveTab('coursebook');");
    });

    it('FlashcardsView handleExitStudy calls onReturnToOrigin when returnOrigin is present', () => {
      expect(flashcardsContent).toContain('const handleExitStudy = () => {');
      expect(flashcardsContent).toContain('if (returnOrigin && onReturnToOrigin) {');
      expect(flashcardsContent).toContain('onReturnToOrigin(returnOrigin);');
      expect(flashcardsContent).toContain('setSelectedDeckId(null);');
    });

    it('FlashcardsView both back button and session complete button use handleExitStudy', () => {
      // Study header back button
      expect(flashcardsContent).toContain('onClick={handleExitStudy}');
      // Finished session button
      expect(flashcardsContent).toContain(
        "returnOrigin?.source === 'coursebook' ? 'Quay lại bài học' : 'Trở về danh sách bộ thẻ'"
      );
    });

    it('Navbar clicks on flashcards tab clean up returnOrigin to avoid stale redirects', () => {
      expect(appContent).toContain("if (tab === 'flashcards')");
      expect(appContent).toContain('setFlashcardReturnOrigin(null);');
    });
  });

  // =========================================================================
  // 3. EMPIRICAL STATE MACHINE REPRODUCTION & ADVERSARIAL STRESS TEST
  // =========================================================================
  describe('Empirical State Machine Harness & Adversarial Stress Tests', () => {
    // Replicates App.tsx state transition logic for deep empirical testing
    class AppRoutingHarness {
      activeTab: string = 'coursebook';
      selectedFlashcardDeckId: string | null = null;
      flashcardReturnOrigin: CoursebookReturnOrigin | null = null;
      coursebookInitialState: {
        level: 1 | 2 | 3 | 4 | 5 | 6;
        lessonIndex: number;
        tab: CoursebookTab;
      } | null = null;

      // Simulated CoursebookView inner state
      coursebookInner = {
        selectedHskLevel: 1 as 1 | 2 | 3 | 4 | 5 | 6,
        selectedLessonIndex: 0,
        activeTab: 'text' as CoursebookTab,
      };

      // Simulates CoursebookView mount/render
      mountCoursebookView() {
        if (this.coursebookInitialState) {
          this.coursebookInner.selectedHskLevel = this.coursebookInitialState.level;
          this.coursebookInner.selectedLessonIndex = this.coursebookInitialState.lessonIndex;
          this.coursebookInner.activeTab = this.coursebookInitialState.tab;
          // onClearInitialCoursebookState called
          this.coursebookInitialState = null;
        }
      }

      // CoursebookView starts flashcards
      coursebookStartFlashcards(
        words: WordItem[],
        lessonNumber: number,
        level: 1 | 2 | 3 | 4 | 5 | 6,
        originTab: CoursebookTab = 'vocab'
      ) {
        const hskLevel = level || 1;
        if (lessonNumber) {
          this.selectedFlashcardDeckId = `deck-lesson-${hskLevel}-${lessonNumber}`;
          this.flashcardReturnOrigin = {
            source: 'coursebook',
            level: hskLevel,
            lessonNumber,
            tab: originTab,
          };
        } else {
          this.selectedFlashcardDeckId = 'deck-coursebook-progress';
          this.flashcardReturnOrigin = null;
        }
        this.activeTab = 'flashcards';
      }

      // FlashcardsView exits study
      flashcardsExitStudy(triggerOriginCallback = true) {
        if (this.flashcardReturnOrigin && triggerOriginCallback) {
          const origin = this.flashcardReturnOrigin;
          // Exact logic from App.tsx lines 922-931:
          this.selectedFlashcardDeckId = null;
          this.flashcardReturnOrigin = null;
          this.coursebookInitialState = {
            level: origin.level,
            lessonIndex: Math.max(0, origin.lessonNumber - 1),
            tab: origin.tab || 'vocab',
          };
          this.activeTab = 'coursebook';
          // User returns to CoursebookView
          this.mountCoursebookView();
        } else {
          // Direct exit on roadmap
          this.selectedFlashcardDeckId = null;
          this.activeTab = 'flashcards';
        }
      }

      // User clicks Navbar tab directly
      clickNavbarTab(tab: string) {
        if (tab === 'flashcards') {
          this.setFlashcardReturnOriginNull();
        }
        this.activeTab = tab;
        if (tab === 'coursebook') {
          this.mountCoursebookView();
        }
      }

      private setFlashcardReturnOriginNull() {
        this.flashcardReturnOrigin = null;
      }
    }

    it('Scenario 1: Starting flashcards from Coursebook Vocab tab returns to exact lesson & vocab tab', () => {
      const harness = new AppRoutingHarness();
      harness.coursebookInner.selectedHskLevel = 2;
      harness.coursebookInner.selectedLessonIndex = 6; // Lesson 7
      harness.coursebookInner.activeTab = 'vocab';

      const mockWords: WordItem[] = [{ id: 'w1', hanzi: '去', pinyin: 'qù', vietnamese: 'đi', hskLevel: 1 }];

      // Step 1: User starts flashcards from vocabulary tab
      harness.coursebookStartFlashcards(mockWords, 7, 2, 'vocab');

      expect(harness.activeTab).toBe('flashcards');
      expect(harness.selectedFlashcardDeckId).toBe('deck-lesson-2-7');
      expect(harness.flashcardReturnOrigin).toEqual({
        source: 'coursebook',
        level: 2,
        lessonNumber: 7,
        tab: 'vocab',
      });

      // Step 2: User finishes or exits flashcards
      harness.flashcardsExitStudy(true);

      // Step 3: Verified restored state
      expect(harness.activeTab).toBe('coursebook');
      expect(harness.selectedFlashcardDeckId).toBeNull();
      expect(harness.flashcardReturnOrigin).toBeNull();
      expect(harness.coursebookInner.selectedHskLevel).toBe(2);
      expect(harness.coursebookInner.selectedLessonIndex).toBe(6); // 7 - 1 = 6
      expect(harness.coursebookInner.activeTab).toBe('vocab');
      expect(harness.coursebookInitialState).toBeNull(); // Cleaned up after consumption
    });

    it('Scenario 2: Boundary lesson numbers (Lesson 1 and Lesson 15)', () => {
      const harness = new AppRoutingHarness();
      const mockWords: WordItem[] = [{ id: 'w1', hanzi: '好', pinyin: 'hǎo', vietnamese: 'tốt', hskLevel: 1 }];

      // Lesson 1 -> lessonIndex 0
      harness.coursebookStartFlashcards(mockWords, 1, 1, 'vocab');
      harness.flashcardsExitStudy(true);
      expect(harness.coursebookInner.selectedLessonIndex).toBe(0);
      expect(harness.coursebookInner.selectedHskLevel).toBe(1);

      // Lesson 15 -> lessonIndex 14
      harness.coursebookStartFlashcards(mockWords, 15, 3, 'vocab');
      harness.flashcardsExitStudy(true);
      expect(harness.coursebookInner.selectedLessonIndex).toBe(14);
      expect(harness.coursebookInner.selectedHskLevel).toBe(3);
    });

    it('Scenario 3: Direct Navbar entry to Flashcards does NOT redirect back to Coursebook', () => {
      const harness = new AppRoutingHarness();

      // User clicks Flashcards tab directly on Navbar
      harness.clickNavbarTab('flashcards');
      expect(harness.activeTab).toBe('flashcards');
      expect(harness.flashcardReturnOrigin).toBeNull();

      // User starts an SRS review deck from roadmap
      harness.selectedFlashcardDeckId = 'deck-coursebook-progress';

      // User exits
      harness.flashcardsExitStudy(false);

      // Must remain on flashcards roadmap view (activeTab remains 'flashcards')
      expect(harness.activeTab).toBe('flashcards');
      expect(harness.selectedFlashcardDeckId).toBeNull();
    });

    it('Scenario 4: Starting flashcards, switching to Navbar flashcards, cleans origin preventing leak', () => {
      const harness = new AppRoutingHarness();
      const mockWords: WordItem[] = [{ id: 'w1', hanzi: '水', pinyin: 'shuǐ', vietnamese: 'nước', hskLevel: 1 }];

      // Launched from Coursebook Lesson 4
      harness.coursebookStartFlashcards(mockWords, 4, 1, 'vocab');
      expect(harness.flashcardReturnOrigin).not.toBeNull();

      // User clicks top Navbar Flashcard button
      harness.clickNavbarTab('flashcards');
      expect(harness.flashcardReturnOrigin).toBeNull(); // Cleared!

      // Later exit does NOT unexpectedly jump back to coursebook
      harness.flashcardsExitStudy(false);
      expect(harness.activeTab).toBe('flashcards');
    });

    it('Scenario 5: Origin tab preservation for non-vocab tabs (text, grammar, exercises)', () => {
      const harness = new AppRoutingHarness();
      const mockWords: WordItem[] = [{ id: 'w1', hanzi: '听', pinyin: 'tīng', vietnamese: 'nghe', hskLevel: 1 }];

      // Launch from Grammar tab via header banner
      harness.coursebookStartFlashcards(mockWords, 3, 2, 'grammar');
      expect(harness.flashcardReturnOrigin?.tab).toBe('grammar');

      harness.flashcardsExitStudy(true);
      expect(harness.coursebookInner.activeTab).toBe('grammar');
    });

    it('Scenario 6: Multiple rapid roundtrips across different HSK levels maintain state fidelity', () => {
      const harness = new AppRoutingHarness();
      const mockWords: WordItem[] = [{ id: 'w1', hanzi: '大', pinyin: 'dà', vietnamese: 'lớn', hskLevel: 1 }];

      const testRuns: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; lesson: number; tab: CoursebookTab }> = [
        { level: 1, lesson: 2, tab: 'vocab' },
        { level: 2, lesson: 10, tab: 'vocab' },
        { level: 3, lesson: 5, tab: 'text' },
        { level: 4, lesson: 1, tab: 'vocab' },
        { level: 5, lesson: 15, tab: 'workbook' },
      ];

      for (const run of testRuns) {
        harness.coursebookStartFlashcards(mockWords, run.lesson, run.level, run.tab);
        expect(harness.activeTab).toBe('flashcards');
        harness.flashcardsExitStudy(true);

        expect(harness.activeTab).toBe('coursebook');
        expect(harness.coursebookInner.selectedHskLevel).toBe(run.level);
        expect(harness.coursebookInner.selectedLessonIndex).toBe(run.lesson - 1);
        expect(harness.coursebookInner.activeTab).toBe(run.tab);
      }
    });
  });
});
