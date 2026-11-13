import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import { HSK1_LESSON_EXERCISES } from '../src/data/hsk1LessonExercises';
import {
  NEW_HSK1_FULL_LESSONS,
  ExerciseItem,
  ExerciseType,
} from '../src/data/newHsk1BookData';
import {
  HSK1_OFFICIAL_MOCK_EXAM,
  HSK1_WORKBOOK_LESSONS,
} from '../src/data/hsk1WorkbookData';

// Replicate exact evaluation oracle from LessonExercisesStudio.tsx:
const checkQuestionCorrect = (ex: ExerciseItem, answer: string): boolean => {
  if (!answer) return false;
  const cleanUser = answer.replace(/\s+/g, '').toLowerCase();
  const cleanCorrect = (ex.correctAnswer || '').replace(/\s+/g, '').toLowerCase();
  if (!cleanCorrect) return false;
  return cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
};

describe('EMPIRICAL CHALLENGER: Milestone 2 Rigorous Stress Harness', () => {
  const allExercisesFlat: { lessonNum: number; exercise: ExerciseItem }[] = [];
  for (let l = 1; l <= 15; l++) {
    const list = HSK1_LESSON_EXERCISES[l] || [];
    for (const ex of list) {
      allExercisesFlat.push({ lessonNum: l, exercise: ex });
    }
  }

  // =========================================================================
  // SUITE 1: DATA VOLUME, SCOPE & WIRING INVARIANTS
  // =========================================================================
  describe('Suite 1: Data Volume & Coursebook Wiring', () => {
    it('1.1: HSK1_LESSON_EXERCISES contains all 15 lessons numbered 1 to 15', () => {
      const keys = Object.keys(HSK1_LESSON_EXERCISES).map(Number).sort((a, b) => a - b);
      expect(keys).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    it('1.2: Exactly 30 questions authored per lesson (450 total)', () => {
      expect(allExercisesFlat.length).toBe(450);

      for (let l = 1; l <= 15; l++) {
        const list = HSK1_LESSON_EXERCISES[l];
        expect(list, `Lesson ${l} exercise array must exist`).toBeDefined();
        expect(list.length, `Lesson ${l} must have exactly 30 questions`).toBe(30);
      }
    });

    it('1.3: All 450 question IDs are globally unique and follow canonical regex pattern', () => {
      const idPattern = /^hsk1-l(0[1-9]|1[0-5])-ex(0[1-9]|[12][0-9]|30)$/;
      const seenIds = new Set<string>();
      const duplicateIds: string[] = [];
      const malformedIds: string[] = [];

      for (const { lessonNum, exercise } of allExercisesFlat) {
        if (!idPattern.test(exercise.id)) {
          malformedIds.push(`L${lessonNum}: ${exercise.id}`);
        }
        if (seenIds.has(exercise.id)) {
          duplicateIds.push(exercise.id);
        }
        seenIds.add(exercise.id);
      }

      expect(malformedIds).toEqual([]);
      expect(duplicateIds).toEqual([]);
      expect(seenIds.size).toBe(450);
    });

    it('1.4: NEW_HSK1_FULL_LESSONS has 15 lessons with exactly matching 30 questions each', () => {
      expect(NEW_HSK1_FULL_LESSONS.length).toBe(15);

      for (let l = 1; l <= 15; l++) {
        const bookLesson = NEW_HSK1_FULL_LESSONS.find((bl) => bl.lessonNumber === l);
        expect(bookLesson, `Lesson ${l} must exist in NEW_HSK1_FULL_LESSONS`).toBeDefined();
        expect(bookLesson!.exercises.length, `NEW_HSK1_FULL_LESSONS[${l}] must have 30 exercises`).toBe(30);

        const modularList = HSK1_LESSON_EXERCISES[l];
        for (let i = 0; i < 30; i++) {
          expect(bookLesson!.exercises[i].id).toBe(modularList[i].id);
          expect(bookLesson!.exercises[i].correctAnswer).toBe(modularList[i].correctAnswer);
        }
      }
    });
  });

  // =========================================================================
  // SUITE 2: EXERCISE TYPE DISTRIBUTION PER LESSON
  // =========================================================================
  describe('Suite 2: Strict Distribution by Exercise Type', () => {
    const EXPECTED_PER_LESSON: Record<ExerciseType, number> = {
      multiple_choice: 7,
      fill_blank: 6,
      sentence_scramble: 5,
      dialogue_match: 4,
      translation: 4,
      error_spotting: 4,
    };

    it('2.1: Each of the 15 lessons satisfies the exact distribution', () => {
      const distributionViolations: string[] = [];

      for (let l = 1; l <= 15; l++) {
        const list = HSK1_LESSON_EXERCISES[l];
        const counts: Record<string, number> = {};
        for (const ex of list) {
          counts[ex.type] = (counts[ex.type] || 0) + 1;
        }

        for (const [type, expectedCount] of Object.entries(EXPECTED_PER_LESSON)) {
          const actualCount = counts[type] || 0;
          if (actualCount !== expectedCount) {
            distributionViolations.push(
              `Lesson ${l}: ${type} expected ${expectedCount}, got ${actualCount}`
            );
          }
        }
      }

      expect(distributionViolations).toEqual([]);
    });

    it('2.2: Overall dataset matches exact aggregate type totals', () => {
      const globalCounts: Record<string, number> = {};
      for (const { exercise } of allExercisesFlat) {
        globalCounts[exercise.type] = (globalCounts[exercise.type] || 0) + 1;
      }

      expect(globalCounts['multiple_choice']).toBe(105);
      expect(globalCounts['fill_blank']).toBe(90);
      expect(globalCounts['sentence_scramble']).toBe(75);
      expect(globalCounts['dialogue_match']).toBe(60);
      expect(globalCounts['translation']).toBe(60);
      expect(globalCounts['error_spotting']).toBe(60);
    });

    it('2.3: Order of types within each lesson conforms to canonical sequence', () => {
      // Canonical sequence:
      // ex01-ex07: multiple_choice
      // ex08-ex13: fill_blank
      // ex14-ex18: sentence_scramble
      // ex19-ex22: dialogue_match
      // ex23-ex26: translation
      // ex27-ex30: error_spotting
      for (let l = 1; l <= 15; l++) {
        const list = HSK1_LESSON_EXERCISES[l];
        for (let i = 0; i < 7; i++) expect(list[i].type).toBe('multiple_choice');
        for (let i = 7; i < 13; i++) expect(list[i].type).toBe('fill_blank');
        for (let i = 13; i < 18; i++) expect(list[i].type).toBe('sentence_scramble');
        for (let i = 18; i < 22; i++) expect(list[i].type).toBe('dialogue_match');
        for (let i = 22; i < 26; i++) expect(list[i].type).toBe('translation');
        for (let i = 26; i < 30; i++) expect(list[i].type).toBe('error_spotting');
      }
    });
  });

  // =========================================================================
  // SUITE 3: SCHEMA CONFORMANCE & SUBSTANTIVE METADATA
  // =========================================================================
  describe('Suite 3: Schema Conformance & Content Rigor', () => {
    it('3.1: Every question has non-empty common fields (id, question, correctAnswer, explanation, grammarFocus, audioText, vietnamesePrompt)', () => {
      const schemaDefects: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (!ex.id?.trim()) schemaDefects.push(`L${lessonNum}: missing id`);
        if (!ex.question?.trim()) schemaDefects.push(`L${lessonNum} ${ex.id}: missing question`);
        if (!ex.correctAnswer?.trim()) schemaDefects.push(`L${lessonNum} ${ex.id}: missing correctAnswer`);
        if (!ex.explanation?.trim() || ex.explanation.trim().length < 15) {
          schemaDefects.push(`L${lessonNum} ${ex.id}: explanation too short or missing (<15 chars)`);
        }
        if (!ex.grammarFocus?.trim()) schemaDefects.push(`L${lessonNum} ${ex.id}: missing grammarFocus`);
        if (!ex.audioText?.trim()) schemaDefects.push(`L${lessonNum} ${ex.id}: missing audioText`);
        if (!ex.vietnamesePrompt?.trim()) schemaDefects.push(`L${lessonNum} ${ex.id}: missing vietnamesePrompt`);
      }

      expect(schemaDefects).toEqual([]);
    });

    it('3.2: Non-scramble questions have prompt fields (hanziPrompt or pinyinPrompt where applicable)', () => {
      const nonScrambleTypes: ExerciseType[] = [
        'multiple_choice',
        'fill_blank',
        'dialogue_match',
        'translation',
        'error_spotting',
      ];

      const promptIssues: string[] = [];
      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (!nonScrambleTypes.includes(ex.type)) continue;

        // Prompt text must be available either in question, hanziPrompt, or vietnamesePrompt
        const hasPrompt = !!(ex.hanziPrompt?.trim() || ex.vietnamesePrompt?.trim() || ex.question?.trim());
        if (!hasPrompt) {
          promptIssues.push(`L${lessonNum} ${ex.id} (${ex.type}): lacks prompt content`);
        }
      }

      expect(promptIssues).toEqual([]);
    });

    it('3.3: Options array for discrete questions has >= 2 elements, includes correctAnswer, and has no duplicates', () => {
      const optionsIssues: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (ex.type === 'sentence_scramble') continue;

        if (!Array.isArray(ex.options) || ex.options.length < 2) {
          optionsIssues.push(`L${lessonNum} ${ex.id}: options array has < 2 elements`);
          continue;
        }

        // Check duplicate options
        const uniqueOpts = new Set(ex.options);
        if (uniqueOpts.size !== ex.options.length) {
          optionsIssues.push(`L${lessonNum} ${ex.id}: options array contains duplicate elements`);
        }

        // Check inclusion of correctAnswer in options
        const hasExactCorrect = ex.options.includes(ex.correctAnswer);
        if (!hasExactCorrect) {
          // Check normalized match
          const cleanCorrect = ex.correctAnswer.replace(/\s+/g, '').toLowerCase();
          const matches = ex.options.some(
            (opt) => opt.replace(/\s+/g, '').toLowerCase() === cleanCorrect
          );
          if (!matches) {
            optionsIssues.push(
              `L${lessonNum} ${ex.id}: options [${ex.options.join(' | ')}] does not contain correctAnswer "${ex.correctAnswer}"`
            );
          }
        }
      }

      expect(optionsIssues).toEqual([]);
    });

    it('3.4: Sentence scramble questions have empty options array and valid scrambleSegments that concatenate to correctAnswer', () => {
      const scrambleIssues: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (ex.type !== 'sentence_scramble') continue;

        // Options must be empty array per contract
        if (!Array.isArray(ex.options) || ex.options.length !== 0) {
          scrambleIssues.push(`L${lessonNum} ${ex.id}: options should be [] but got ${JSON.stringify(ex.options)}`);
        }

        // scrambleSegments must exist with >= 2 segments
        if (!Array.isArray(ex.scrambleSegments) || ex.scrambleSegments.length < 2) {
          scrambleIssues.push(`L${lessonNum} ${ex.id}: scrambleSegments missing or < 2 elements`);
          continue;
        }

        // All segments non-empty
        for (const seg of ex.scrambleSegments) {
          if (!seg || seg.trim().length === 0) {
            scrambleIssues.push(`L${lessonNum} ${ex.id}: contains empty scrambleSegment`);
          }
        }

        // Direct concatenation check (clean whitespace and compare)
        const concatenated = ex.scrambleSegments.join('');
        const cleanConcat = concatenated.replace(/\s+/g, '').toLowerCase();
        const cleanCorrect = ex.correctAnswer.replace(/\s+/g, '').toLowerCase();

        if (cleanConcat !== cleanCorrect) {
          scrambleIssues.push(
            `L${lessonNum} ${ex.id}: segments "${concatenated}" do not concatenate to correctAnswer "${ex.correctAnswer}"`
          );
        }
      }

      expect(scrambleIssues).toEqual([]);
    });
  });

  // =========================================================================
  // SUITE 4: EVALUATION ORACLE & ADVERSARIAL DISTRACTOR STRESS
  // =========================================================================
  describe('Suite 4: Evaluation Oracle & Adversarial Distractor Stress', () => {
    it('4.1: Positive Oracle: checkQuestionCorrect returns true for correctAnswer on ALL 450 questions', () => {
      const positiveFailures: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        const result = checkQuestionCorrect(ex, ex.correctAnswer);
        if (!result) {
          positiveFailures.push(`L${lessonNum} ${ex.id}: correctAnswer "${ex.correctAnswer}" evaluated to FALSE`);
        }
      }

      expect(positiveFailures).toEqual([]);
    });

    it('4.2: Negative Oracle (Empty / Nullish Inputs): returns false for empty answers', () => {
      for (const { exercise: ex } of allExercisesFlat) {
        expect(checkQuestionCorrect(ex, '')).toBe(false);
      }
    });

    it('4.3: Negative Oracle (Distractor Collision Resistance): Zero wrong options evaluate to true', () => {
      // Critical security and pedagogical invariant:
      // If a distractor option evaluates to true, the student gets an undeserved pass!
      const distractorCollisions: {
        id: string;
        lesson: number;
        correctAnswer: string;
        badDistractor: string;
      }[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (!ex.options || ex.options.length <= 1) continue;

        for (const opt of ex.options) {
          if (opt === ex.correctAnswer) continue;

          // Check if this distractor option is falsely evaluated as correct
          const isFalselyCorrect = checkQuestionCorrect(ex, opt);
          if (isFalselyCorrect) {
            distractorCollisions.push({
              id: ex.id,
              lesson: lessonNum,
              correctAnswer: ex.correctAnswer,
              badDistractor: opt,
            });
          }
        }
      }

      expect(distractorCollisions).toEqual([]);
    });

    it('4.4: Scramble Oracle: Reversed or wrong order assembly evaluates to false', () => {
      const scrambleFalsePositives: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (ex.type !== 'sentence_scramble' || !ex.scrambleSegments) continue;

        // Test reversed assembly
        if (ex.scrambleSegments.length >= 3) {
          const reversed = ex.scrambleSegments.slice().reverse().join('');
          const isCorrect = checkQuestionCorrect(ex, reversed);
          if (isCorrect) {
            scrambleFalsePositives.push(
              `L${lessonNum} ${ex.id}: reversed segments "${reversed}" incorrectly evaluated to true for answer "${ex.correctAnswer}"`
            );
          }
        }
      }

      expect(scrambleFalsePositives).toEqual([]);
    });
  });

  // =========================================================================
  // SUITE 5: WORKBOOK AUTHENTICITY & ZERO SYNTHETIC GENERATORS
  // =========================================================================
  describe('Suite 5: Workbook Authenticity & Regression Guardrails', () => {
    it('5.1: workbookEnricher.ts contains zero synthetic question generators or fake fallback loops', () => {
      const rootDir = process.cwd();
      const enricherPath = path.resolve(rootDir, 'src/data/workbookEnricher.ts');
      const enricherContent = fs.readFileSync(enricherPath, 'utf-8');

      expect(enricherContent).not.toContain('enrich_mock_');
      expect(enricherContent).not.toContain('mockListening.length < 3');
      expect(enricherContent).not.toContain('mockReading.length < 3');
    });

    it('5.2: HSK1_OFFICIAL_MOCK_EXAM has full 40 questions (including restored Q13, Q14, Q15)', () => {
      expect(HSK1_OFFICIAL_MOCK_EXAM.length).toBe(40);

      const q13 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q13');
      const q14 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q14');
      const q15 = HSK1_OFFICIAL_MOCK_EXAM.find((q) => q.id === 'mock-q15');

      expect(q13, 'mock-q13 must be present in official mock exam').toBeDefined();
      expect(q14, 'mock-q14 must be present in official mock exam').toBeDefined();
      expect(q15, 'mock-q15 must be present in official mock exam').toBeDefined();

      expect(q13!.audioScript).toContain('Jīntiān tài rè le');
      expect(q14!.audioScript).toContain('kàn diànyǐng');
      expect(q15!.audioScript).toContain('shuìjiào');

      // Check all 40 questions have id mock-q1 to mock-q40 in order
      for (let i = 1; i <= 40; i++) {
        expect(HSK1_OFFICIAL_MOCK_EXAM[i - 1].id).toBe(`mock-q${i}`);
      }
    });

    it('5.3: HSK1_WORKBOOK_LESSONS has authentic listenAndReadDrills for all 15 lessons and hanziSection for L4-15', () => {
      expect(HSK1_WORKBOOK_LESSONS.length).toBe(15);

      for (let l = 1; l <= 15; l++) {
        const wbLesson = HSK1_WORKBOOK_LESSONS.find((w) => w.lessonNumber === l);
        expect(wbLesson, `Workbook Lesson ${l} must exist`).toBeDefined();
        expect(wbLesson!.listenAndReadDrills?.length).toBeGreaterThan(0);

        if (l >= 4) {
          expect(
            wbLesson!.hanziSection,
            `Workbook Lesson ${l} must have hanziSection defined`
          ).toBeDefined();
          const hz = wbLesson!.hanziSection!;
          expect(hz.title?.length).toBeGreaterThan(0);
          expect(hz.vietnameseTitle?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // =========================================================================
  // SUITE 6: ADVERSARIAL CONTENT INTEGRITY & LINGUISTIC QUALITY
  // =========================================================================
  describe('Suite 6: Adversarial Content Integrity & Linguistic Quality', () => {
    it('6.1: Zero placeholder tokens (TODO, TBD, placeholder, lorem, ipsum) across all 450 questions', () => {
      const placeholderRegex = /\b(todo|tbd|placeholder|lorem\s*ipsum|test\s*câu|dummy)\b/i;
      const taintedQuestions: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        const blob = [
          ex.id,
          ex.question,
          ex.hanziPrompt,
          ex.pinyinPrompt,
          ex.vietnamesePrompt,
          ex.correctAnswer,
          ex.explanation,
          ex.grammarFocus,
          ex.audioText,
          ...(ex.options || []),
          ...(ex.scrambleSegments || []),
        ]
          .filter(Boolean)
          .join(' ');

        if (placeholderRegex.test(blob)) {
          taintedQuestions.push(`L${lessonNum} ${ex.id}: contains placeholder token in [${blob}]`);
        }
      }

      expect(taintedQuestions).toEqual([]);
    });

    it('6.2: High explanation uniqueness across all 450 questions (>95% unique)', () => {
      const explanationSet = new Set<string>();
      for (const { exercise: ex } of allExercisesFlat) {
        explanationSet.add(ex.explanation.trim());
      }

      // Assert high diversity of explanations
      const uniquenessRatio = explanationSet.size / allExercisesFlat.length;
      expect(uniquenessRatio).toBeGreaterThan(0.95);
      expect(explanationSet.size).toBeGreaterThan(430);
    });

    it('6.3: audioText purity: all questions have valid Chinese text or punctuation for speech synthesis', () => {
      const chineseCharRegex = /[\u4e00-\u9fa5]/;
      const nonChineseAudio: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (!chineseCharRegex.test(ex.audioText || '')) {
          nonChineseAudio.push(`L${lessonNum} ${ex.id}: audioText "${ex.audioText}" lacks Chinese characters`);
        }
      }

      expect(nonChineseAudio).toEqual([]);
    });

    it('6.4: Consistent option labeling: MCQs have standard A, B, C, D key prefixes', () => {
      const optionLabelIssues: string[] = [];

      for (const { lessonNum, exercise: ex } of allExercisesFlat) {
        if (ex.type === 'sentence_scramble') continue;

        ex.options.forEach((opt, idx) => {
          const expectedLetter = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
          const prefix = `${expectedLetter}.`;
          if (!opt.startsWith(prefix)) {
            optionLabelIssues.push(
              `L${lessonNum} ${ex.id} option[${idx}]: expected prefix "${prefix}", got "${opt.substring(0, 5)}"`
            );
          }
        });
      }

      expect(optionLabelIssues).toEqual([]);
    });
  });
});

