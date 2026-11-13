import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { CoursebookReturnOrigin, CoursebookTab } from '../src/types';

describe('Milestone 1: Navigation & UI Controls (R1 & R6)', () => {
  const typesPath = path.resolve(__dirname, '../src/types.ts');
  const coursebookViewPath = path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx');
  const appPath = path.resolve(__dirname, '../src/App.tsx');
  const flashcardsViewPath = path.resolve(__dirname, '../src/components/Flashcards/FlashcardsView.tsx');

  describe('1. Interface Contracts in src/types.ts', () => {
    it('defines and exports CoursebookTab and CoursebookReturnOrigin', () => {
      const typesContent = fs.readFileSync(typesPath, 'utf-8');
      expect(typesContent).toContain('export type CoursebookTab');
      expect(typesContent).toContain('export interface CoursebookReturnOrigin');
      expect(typesContent).toContain("'vocab' | 'text' | 'grammar' | 'exercises' | 'workbook' | 'culture'");
    });

    it('CoursebookReturnOrigin conforms to the contract', () => {
      const testOrigin: CoursebookReturnOrigin = {
        source: 'coursebook',
        level: 1,
        lessonNumber: 3,
        tab: 'vocab',
      };
      expect(testOrigin.source).toBe('coursebook');
      expect(testOrigin.level).toBe(1);
      expect(testOrigin.lessonNumber).toBe(3);
      expect(testOrigin.tab).toBe('vocab');
    });
  });

  describe('2. R6: Lesson Detail Navigation Controls Removal & Clean Invariants', () => {
    it('has ZERO occurrences of "Bài trước", "Bài tiếp theo", or "Bài sau" in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).not.toContain('Bài trước');
      expect(content).not.toContain('Bài tiếp theo');
      expect(content).not.toContain('Bài sau');
    });

    it('has ZERO occurrences of unused ChevronLeft in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).not.toContain('ChevronLeft');
    });

    it('preserves ChevronRight in CoursebookView.tsx for sidebar lesson items', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).toContain('ChevronRight');
    });

    it('preserves the mark-as-completed lesson button in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).toContain('Đánh dấu đã học xong bài');
      expect(content).toContain('toggleCompleteLesson');
      expect(content).toContain('CheckCircle2');
    });

    it('preserves currentLesson={currentLesson} prop on <WorkbookView> in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).toContain('currentLesson={currentLesson}');
    });
  });

  describe('3. R1: CoursebookView Flashcard Launch & State Restoration', () => {
    it('CoursebookView accepts initial state props and clear callback', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).toContain('initialHskLevel?: 1 | 2 | 3 | 4 | 5 | 6;');
      expect(content).toContain('initialLessonIndex?: number;');
      expect(content).toContain('initialTab?: CoursebookTab;');
      expect(content).toContain('onClearInitialCoursebookState?: () => void;');
    });

    it('CoursebookView calls onStartFlashcards passing selectedHskLevel and "vocab"', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).toContain('selectedHskLevel,');
      expect(content).toContain("'vocab'");
    });

    it('CoursebookView contains state synchronization hook calling onClearInitialCoursebookState', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      expect(content).toContain('onClearInitialCoursebookState');
      expect(content).toContain('setActiveTab(initialTab)');
      expect(content).toContain('setSelectedLessonIndex(initialLessonIndex)');
      expect(content).toContain('setSelectedHskLevel(initialHskLevel)');
    });
  });

  describe('4. R1: App.tsx Return Origin State & Routing Flow', () => {
    it('declares flashcardReturnOrigin and coursebookInitialState in App.tsx', () => {
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain('flashcardReturnOrigin');
      expect(content).toContain('setFlashcardReturnOrigin');
      expect(content).toContain('coursebookInitialState');
      expect(content).toContain('setCoursebookInitialState');
    });

    it('passes initial props to CoursebookView in App.tsx', () => {
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain('initialHskLevel={coursebookInitialState?.level}');
      expect(content).toContain('initialLessonIndex={coursebookInitialState?.lessonIndex}');
      expect(content).toContain('initialTab={coursebookInitialState?.tab}');
      expect(content).toContain('onClearInitialCoursebookState={() => setCoursebookInitialState(null)}');
    });

    it('passes returnOrigin and onReturnToOrigin to FlashcardsView in App.tsx', () => {
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain('returnOrigin={flashcardReturnOrigin}');
      expect(content).toContain('onReturnToOrigin={(origin) => {');
      expect(content).toContain("setActiveTab('coursebook')");
    });

    it('clears flashcardReturnOrigin on direct Navbar tab clicks in App.tsx', () => {
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain("if (tab === 'flashcards')");
      expect(content).toContain('setFlashcardReturnOrigin(null)');
    });
  });

  describe('5. R1: FlashcardsView Exit Navigation', () => {
    it('FlashcardsView accepts returnOrigin and onReturnToOrigin props', () => {
      const content = fs.readFileSync(flashcardsViewPath, 'utf-8');
      expect(content).toContain('returnOrigin?: CoursebookReturnOrigin | null;');
      expect(content).toContain('onReturnToOrigin?: (origin: CoursebookReturnOrigin) => void;');
    });

    it('implements handleExitStudy() for both back button and completion screen', () => {
      const content = fs.readFileSync(flashcardsViewPath, 'utf-8');
      expect(content).toContain('const handleExitStudy = () => {');
      expect(content).toContain('onReturnToOrigin(returnOrigin)');
      expect(content).toContain('setSelectedDeckId(null)');
    });

    it('displays dynamic return origin label in study session header', () => {
      const content = fs.readFileSync(flashcardsViewPath, 'utf-8');
      expect(content).toContain("returnOrigin?.source === 'coursebook'");
      expect(content).toContain('Quay lại bài học');
    });
  });
});
