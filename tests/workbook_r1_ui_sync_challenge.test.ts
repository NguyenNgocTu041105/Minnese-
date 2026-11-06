import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer, ViteDevServer } from 'vite';

import {
  WorkbookView,
  getEnrichedWorkbookLessons,
  getEnrichedWorkbookLesson,
} from '../src/components/Coursebook/WorkbookView';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';

describe('Empirical Adversarial Challenge: Requirement R1 UI Sync & Architecture', () => {
  const rootDir = process.cwd();
  const workbookViewPath = path.resolve(rootDir, 'src/components/Coursebook/WorkbookView.tsx');
  const coursebookViewPath = path.resolve(rootDir, 'src/components/Coursebook/CoursebookView.tsx');
  const dbPath = path.resolve(rootDir, 'data/hsk_exam.db');

  let viteServer: ViteDevServer;

  beforeAll(async () => {
    viteServer = await createServer({
      root: rootDir,
      server: { middlewareMode: true, hmr: false, ws: false, watch: null },
      appType: 'spa',
    });
  });

  afterAll(async () => {
    if (viteServer) {
      await Promise.race([
        viteServer.close(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
  });

  describe('1. Absence Verification (Negative Testing for Forbidden Banner & Dropdown)', () => {
    const sourceCode = fs.readFileSync(workbookViewPath, 'utf-8');

    it('must have ZERO occurrences of green banner gradient classes', () => {
      expect(sourceCode).not.toContain('from-teal-800 via-emerald-900 to-slate-950');
      expect(sourceCode).not.toContain('from-teal-800');
      expect(sourceCode).not.toContain('via-emerald-900');
      expect(sourceCode).not.toContain('to-slate-950');
    });

    it('must have ZERO occurrences of redundant level header label "Cấp độ Sách Bài Tập:"', () => {
      expect(sourceCode).not.toContain('Cấp độ Sách Bài Tập:');
      expect(sourceCode).not.toContain('Cấp độ Sách Bài Tập');
    });

    it('must have ZERO occurrences of redundant lesson selector id="workbook-lesson-select"', () => {
      expect(sourceCode).not.toContain('id="workbook-lesson-select"');
      expect(sourceCode).not.toContain('workbook-lesson-select');
    });

    it('must have ZERO occurrences of duplicate lesson select dropdown labels', () => {
      expect(sourceCode.toLowerCase()).not.toContain('sách bài tập theo bài học');
    });

    it('must have ZERO redundant lesson selector <select> elements in WorkbookView.tsx', () => {
      // The only select element permitted is aiExamFocus in the AI generator
      const selectTags = sourceCode.match(/<select[\s\S]*?<\/select>/g) || [];
      selectTags.forEach((tag) => {
        expect(tag).not.toContain('workbook-lesson-select');
        expect(tag).not.toContain('Bài');
        expect(tag).toContain('aiExamFocus');
      });
    });

    it('must have eliminated the old duplicate subtabs bar container', () => {
      // The old redundant subtabs bar was placed below the banner with specific classes
      expect(sourceCode).not.toContain('overflow-x-auto pb-2 border-b border-[var(--color-border)]');
    });
  });

  describe('2. Mode Switcher Constraints & Fail-safe Redirection', () => {
    const sourceCode = fs.readFileSync(workbookViewPath, 'utf-8');

    it('viewMode state type is strictly limited to "lesson_workbook" | "ai_generated_exam"', () => {
      expect(sourceCode).toMatch(/useState<\s*['"]lesson_workbook['"]\s*\|\s*['"]ai_generated_exam['"]\s*>\s*\(\s*['"]lesson_workbook['"]\s*\)/);
    });

    it('mode switcher UI renders strictly 2 mode buttons: lesson_workbook and ai_generated_exam', () => {
      const switcherMatch = sourceCode.match(/{\/\*\s*Mode Switcher[^*]*\*\/}([\s\S]*?)<\/div>/i);
      expect(switcherMatch, 'Mode Switcher block must be present in WorkbookView').toBeTruthy();
      const switcherSnippet = switcherMatch![1];

      // Contains lesson_workbook button
      expect(switcherSnippet).toContain("setViewMode('lesson_workbook')");
      expect(switcherSnippet).toContain('Sách Bài Tập');

      // Contains ai_generated_exam button
      expect(switcherSnippet).toContain("setViewMode('ai_generated_exam')");
      expect(switcherSnippet).toContain('AI Chế Đề Thi Tùy Chọn');

      // Absolutely does not offer official_mock_exam
      expect(switcherSnippet).not.toContain("setViewMode('official_mock_exam')");
      expect(switcherSnippet).not.toContain('Đề Thi Thử Chuẩn');
    });

    it('contains auto-redirection useEffect fail-safe if viewMode is accidentally official_mock_exam', () => {
      expect(sourceCode).toMatch(/if\s*\(\s*viewMode\s*===\s*\(['"]official_mock_exam['"]\s*as\s*any\)\s*\)\s*{\s*setViewMode\(['"]lesson_workbook['"]\);/);
    });
  });

  describe('3. Prop Synchronization & State Reset Contracts', () => {
    const sourceCode = fs.readFileSync(workbookViewPath, 'utf-8');

    it('WorkbookViewProps correctly accepts hskLevel, currentLessonNumber, currentLesson, onUpdateUserXp', () => {
      expect(sourceCode).toContain('interface WorkbookViewProps');
      expect(sourceCode).toMatch(/hskLevel\?:/);
      expect(sourceCode).toMatch(/currentLessonNumber\?:/);
      expect(sourceCode).toMatch(/currentLesson\?:/);
      expect(sourceCode).toMatch(/onUpdateUserXp\?:/);
    });

    it('synchronizes hskLevel prop to selectedHskLevel state via useEffect', () => {
      const syncLevelRegex = /useEffect\(\s*\(\)\s*=>\s*{\s*if\s*\(\s*hskLevel\s*\)\s*{\s*setSelectedHskLevel\(hskLevel\);\s*}\s*},\s*\[\s*hskLevel\s*\]\s*\);/;
      expect(sourceCode).toMatch(syncLevelRegex);
    });

    it('synchronizes currentLessonNumber prop to selectedLessonNum state via useEffect', () => {
      const syncLessonRegex = /useEffect\(\s*\(\)\s*=>\s*{\s*if\s*\(\s*currentLessonNumber\s*\)\s*{\s*setSelectedLessonNum\(currentLessonNumber\);\s*}\s*},\s*\[\s*currentLessonNumber\s*\]\s*\);/;
      expect(sourceCode).toMatch(syncLessonRegex);
    });

    it('resets question answer states (userAnswers, isAnswerSubmitted, playingAudioId, subTab) on lesson or level changes', () => {
      const resetHookRegex = /useEffect\(\s*\(\)\s*=>\s*{\s*setUserAnswers\(\{\}\);\s*setIsAnswerSubmitted\(\{\}\);\s*setPlayingAudioId\(null\);\s*setSubTab\(['"]mock_drill['"]\);\s*},\s*\[\s*selectedHskLevel\s*,\s*selectedLessonNum\s*\]\s*\);/;
      expect(sourceCode).toMatch(resetHookRegex);
    });

    it('resets generated AI mock exam when selectedHskLevel changes', () => {
      expect(sourceCode).toMatch(/if\s*\(\s*generatedAiExam\s*&&\s*generatedAiExam\.hskLevel\s*!==\s*selectedHskLevel\s*\)\s*{\s*setGeneratedAiExam\(null\);\s*setAiExamAnswers\(\{\}\);\s*setIsAiTimerRunning\(false\);\s*}/);
    });

    it('auto-corrects selectedLessonNum if out of bounds for the selected HSK level', () => {
      expect(sourceCode).toMatch(/if\s*\(\s*activeLessons\.length\s*>\s*0\s*&&\s*!activeLessons\.some\(\(l\)\s*=>\s*l\.lessonNumber\s*===\s*selectedLessonNum\)\s*\)\s*{\s*setSelectedLessonNum\(activeLessons\[0\]\.lessonNumber\);\s*}/);
    });
  });

  describe('4. Empirical SSR Rendering & Resilience across Varied Props', () => {
    it('renders cleanly with default props (HSK 1 Lesson 1)', () => {
      const html = renderToString(React.createElement(WorkbookView, {}));
      expect(html).toContain('id="workbook-root-container"');
      expect(html).toMatch(/New HSK (?:<!-- -->)?1/);
      expect(html).toMatch(/Bài (?:<!-- -->)?1/);
      expect(html).toContain('Sách Bài Tập');
      expect(html).toContain('AI Chế Đề Thi Tùy Chọn');
      // Assert absence in rendered HTML
      expect(html).not.toContain('from-teal-800');
      expect(html).not.toContain('workbook-lesson-select');
      expect(html).not.toContain('Cấp độ Sách Bài Tập:');
    });

    it('renders correctly with HSK 1 Lesson 12 and detailed currentLesson prop', () => {
      const l12Data = NEW_HSK1_FULL_LESSONS.find((l) => l.lessonNumber === 12);
      const html = renderToString(
        React.createElement(WorkbookView, {
          hskLevel: 1,
          currentLessonNumber: 12,
          currentLesson: l12Data,
        })
      );
      expect(html).toContain('id="workbook-root-container"');
      expect(html).toMatch(/New HSK (?:<!-- -->)?1/);
      expect(html).toMatch(/Bài (?:<!-- -->)?12/);
    });

    it('renders correctly with HSK 2 Lesson 15', () => {
      const l15Data = NEW_HSK2_FULL_LESSONS.find((l) => l.lessonNumber === 15);
      const html = renderToString(
        React.createElement(WorkbookView, {
          hskLevel: 2,
          currentLessonNumber: 15,
          currentLesson: l15Data,
        })
      );
      expect(html).toContain('id="workbook-root-container"');
      expect(html).toMatch(/New HSK (?:<!-- -->)?2/);
      expect(html).toMatch(/Bài (?:<!-- -->)?15/);
    });

    it('renders correctly across HSK 3, 4, 5, 6 without crashing', () => {
      [3, 4, 5, 6].forEach((level) => {
        const html = renderToString(
          React.createElement(WorkbookView, {
            hskLevel: level,
            currentLessonNumber: 1,
          })
        );
        expect(html).toContain('id="workbook-root-container"');
        expect(html).toMatch(new RegExp(`New HSK (?:<!-- -->)?${level}`));
      });
    });

    it('handles out-of-bounds lessonNumber gracefully without throwing', () => {
      // HSK 1 only has 15 lessons; passing 999 should not crash
      expect(() => {
        const html = renderToString(
          React.createElement(WorkbookView, {
            hskLevel: 1,
            currentLessonNumber: 999,
          })
        );
        expect(html).toContain('id="workbook-root-container"');
      }).not.toThrow();
    });

    it('handles invalid / non-standard hskLevel gracefully without throwing', () => {
      expect(() => {
        const html = renderToString(
          React.createElement(WorkbookView, {
            hskLevel: 99 as any,
            currentLessonNumber: 1,
          })
        );
        expect(html).toContain('id="workbook-root-container"');
      }).not.toThrow();
    });
  });

  describe('5. CoursebookView ↔ WorkbookView Integration', () => {
    const coursebookSource = fs.readFileSync(coursebookViewPath, 'utf-8');

    it('CoursebookView imports WorkbookView', () => {
      expect(coursebookSource).toMatch(/import\s*\{\s*WorkbookView\s*\}\s*from\s*['"]\.\/WorkbookView['"]/);
    });

    it('CoursebookView renders WorkbookView under activeTab === "workbook"', () => {
      const workbookTabBlock = coursebookSource.match(/\{activeTab\s*===\s*['"]workbook['"]\s*&&([\s\S]*?)<\/(?:div|WorkbookView|\w+)>/);
      expect(workbookTabBlock, 'Workbook tab block must exist in CoursebookView').toBeTruthy();
      const code = workbookTabBlock![0];

      expect(code).toContain('<WorkbookView');
      expect(code).toContain('hskLevel={selectedHskLevel}');
      expect(code).toContain('currentLessonNumber={currentLesson.lessonNumber}');
      expect(code).toContain('currentLesson={currentLesson}');
      expect(code).toContain('onUpdateUserXp=');
    });
  });

  describe('6. Vite Transform & Dynamic Module Health for WorkbookView.tsx', () => {
    it('WorkbookView.tsx transforms cleanly through Vite with 0 syntax or compilation errors', async () => {
      const transformResult = await viteServer.transformRequest('/src/components/Coursebook/WorkbookView.tsx');
      expect(transformResult, 'Transform result must not be null').toBeDefined();
      expect(transformResult?.code).toBeTruthy();
      expect(transformResult?.code.length).toBeGreaterThan(1000);
    });

    it('all static and dynamic import paths in WorkbookView.tsx exist on disk with exact case-matching', () => {
      const source = fs.readFileSync(workbookViewPath, 'utf-8');
      const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"](\.[^'"]+)['"]/g;
      const baseDir = path.dirname(workbookViewPath);

      let match: RegExpExecArray | null;
      while ((match = importRegex.exec(source)) !== null) {
        const relPath = match[1];
        // Resolve target file
        const candidates = [
          path.resolve(baseDir, relPath),
          path.resolve(baseDir, `${relPath}.ts`),
          path.resolve(baseDir, `${relPath}.tsx`),
          path.resolve(baseDir, `${relPath}.js`),
          path.resolve(baseDir, `${relPath}/index.ts`),
          path.resolve(baseDir, `${relPath}/index.tsx`),
        ];
        const resolved = candidates.find((c) => fs.existsSync(c));
        expect(resolved, `Import target ${relPath} must exist on disk`).toBeDefined();

        // Exact case check
        if (resolved) {
          const dir = path.dirname(resolved);
          const actualFiles = fs.readdirSync(dir);
          const baseName = path.basename(resolved);
          expect(actualFiles).toContain(baseName);
        }
      }
    });
  });

  describe('7. System Integrity & Read-Only Database Verification', () => {
    it('data/hsk_exam.db matches expected SHA-256 hash byte-for-byte', () => {
      expect(fs.existsSync(dbPath), 'data/hsk_exam.db must exist').toBe(true);

      const buffer = fs.readFileSync(dbPath);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

      const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
      expect(sha256).toBe(EXPECTED_HASH);
    });
  });
});
