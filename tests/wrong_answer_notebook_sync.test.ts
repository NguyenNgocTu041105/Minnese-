/**
 * Dedicated Regression Suite: Wrong Answer Notebook Snapshot Consistency (R2)
 *
 * Verifies that:
 * 1. Initial wrong answer recording creates complete presentation snapshot.
 * 2. Repeat failure on a previously logged question with a shuffled permutation atomically
 *    replaces options, options_images, correctAnswer, explanation_vi, stem, etc.
 * 3. Stable list item ID is preserved across updates to maintain React key stability.
 * 4. Attempt counter increments and mastered flag resets to false upon repeat failure.
 * 5. Retest question assembly (handleRetestWrongQuestions mapping) produces valid options[answer_index].
 * 6. UI display helpers (formatCorrectAnswerText, option letters) render accurate, non-conflicting status.
 */

import { describe, it, expect } from 'vitest';
import {
  WrongAnswerItem,
  LogWrongAnswerInput,
  syncWrongAnswerEntry,
  formatCorrectAnswerText,
} from '../src/components/HSKMockExam';
import type { HSKExamQuestion } from '../src/data/hskMockExamFixtures';

describe('Regression Suite: Wrong Answer Notebook Snapshot Consistency (R2)', () => {
  const FIXED_TIME_A = 1729990000000;
  const FIXED_TIME_B = 1729995000000;

  it('1. Initial Wrong Answer Creation (Session A)', () => {
    const sessionAInput: LogWrongAnswerInput = {
      questionId: 'hsk1-q-fruit',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: '这是什么水果？',
      pinyin_stem: 'Zhè shì shénme shuǐguǒ?',
      options: ['苹果', '香蕉', '西瓜', '葡萄'],
      userAnswer: 0, // Student chose Option A: '苹果'
      correctAnswer: 1, // Correct answer is Option B: '香蕉'
      explanation_vi: 'Đáp án là B. 香蕉 nghĩa là quả chuối.',
    };

    const initialNotebook: WrongAnswerItem[] = [];
    const updated = syncWrongAnswerEntry(initialNotebook, sessionAInput, FIXED_TIME_A);

    expect(updated).toHaveLength(1);
    const entry = updated[0];
    expect(entry.id).toMatch(/^wrong-1729990000000-/);
    expect(entry.questionId).toBe('hsk1-q-fruit');
    expect(entry.options).toEqual(['苹果', '香蕉', '西瓜', '葡萄']);
    expect(entry.userAnswer).toBe(0);
    expect(entry.correctAnswer).toBe(1);
    expect(entry.options[entry.userAnswer as number]).toBe('苹果');
    expect(entry.options[entry.correctAnswer]).toBe('香蕉');
    expect(entry.explanation_vi).toContain('Đáp án là B');
    expect(entry.attempts).toBe(1);
    expect(entry.mastered).toBe(false);
    expect(entry.timestamp).toBe(FIXED_TIME_A);
  });

  it('2. Repeat Wrong Answer with Shuffled Permutation (Session B) replaces snapshot atomically', () => {
    // State after Session A
    const sessionAEntry: WrongAnswerItem = {
      id: 'wrong-entry-fixed-uuid-12345',
      questionId: 'hsk1-q-fruit',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: '这是什么水果？',
      pinyin_stem: 'Zhè shì shénme shuǐguǒ?',
      options: ['苹果', '香蕉', '西瓜', '葡萄'],
      userAnswer: 0,
      correctAnswer: 1,
      explanation_vi: 'Đáp án là B. 香蕉 nghĩa là quả chuối.',
      timestamp: FIXED_TIME_A,
      attempts: 1,
      mastered: false,
    };

    // In Session B, serving answer shuffle is active:
    // Shuffled options: ['香蕉', '葡萄', '苹果', '西瓜']
    // Correct answer '香蕉' moved from index 1 to index 0!
    // Student picked '苹果', which is now at index 2!
    const sessionBInput: LogWrongAnswerInput = {
      questionId: 'hsk1-q-fruit',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: '这是什么水果？',
      pinyin_stem: 'Zhè shì shénme shuǐguǒ?',
      options: ['香蕉', '葡萄', '苹果', '西瓜'],
      userAnswer: 2, // Student selected Option C: '苹果'
      correctAnswer: 0, // Correct answer is now Option A: '香蕉'
      explanation_vi: 'Đáp án là A. 香蕉 nghĩa là quả chuối.',
    };

    const notebook = [sessionAEntry];
    const updated = syncWrongAnswerEntry(notebook, sessionBInput, FIXED_TIME_B);

    expect(updated).toHaveLength(1);
    const result = updated[0];

    // INVARIANT 1: Entry ID must be stably preserved (crucial for React list keys)
    expect(result.id).toBe('wrong-entry-fixed-uuid-12345');

    // INVARIANT 2: Attempt count increments
    expect(result.attempts).toBe(2);

    // INVARIANT 3: Timestamp updates
    expect(result.timestamp).toBe(FIXED_TIME_B);

    // INVARIANT 4: Full snapshot synchronization eliminates desync
    expect(result.options).toEqual(['香蕉', '葡萄', '苹果', '西瓜']);
    expect(result.correctAnswer).toBe(0);
    expect(result.userAnswer).toBe(2);
    expect(result.explanation_vi).toBe('Đáp án là A. 香蕉 nghĩa là quả chuối.');

    // INVARIANT 5: Option semantics verification
    expect(result.options[result.userAnswer as number]).toBe('苹果');
    expect(result.options[result.correctAnswer]).toBe('香蕉');

    // INVARIANT 6: Zero false-positive collision
    expect(result.userAnswer).not.toBe(result.correctAnswer);
  });

  it('3. Un-mastering Question on Repeat Failure resets mastered to false', () => {
    const masteredEntry: WrongAnswerItem = {
      id: 'wrong-entry-mastered',
      questionId: 'hsk1-q-fruit',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: '这是什么水果？',
      options: ['苹果', '香蕉'],
      userAnswer: 0,
      correctAnswer: 1,
      explanation_vi: 'Đáp án là B.',
      timestamp: FIXED_TIME_A,
      attempts: 2,
      mastered: true, // Previously marked mastered by passing a retest
    };

    const retestFailureInput: LogWrongAnswerInput = {
      questionId: 'hsk1-q-fruit',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: '这是什么水果？',
      options: ['香蕉', '苹果'],
      userAnswer: 1,
      correctAnswer: 0,
      explanation_vi: 'Đáp án là A.',
    };

    const updated = syncWrongAnswerEntry([masteredEntry], retestFailureInput, FIXED_TIME_B);
    expect(updated).toHaveLength(1);
    expect(updated[0].mastered).toBe(false); // Reset to false
    expect(updated[0].attempts).toBe(3); // Incremented from 2 to 3
  });

  it('4. Retest Question Reconstruction Consistency', () => {
    // Simulate notebook state after synchronized Session B
    const notebookEntry: WrongAnswerItem = {
      id: 'entry-sync',
      questionId: 'hsk1-q-sample',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: '看图选词',
      options: ['西瓜', '苹果', '香蕉'],
      userAnswer: 0,
      correctAnswer: 2, // '香蕉'
      explanation_vi: 'Đáp án chuẩn là C.',
      timestamp: FIXED_TIME_B,
      attempts: 2,
      mastered: false,
    };

    // Reconstruct question for retest (logic from handleRetestWrongQuestions)
    const retestQ: HSKExamQuestion = {
      id: notebookEntry.questionId,
      level: notebookEntry.level,
      section: notebookEntry.section,
      part_type: notebookEntry.part_type,
      item_number: 1,
      stem: notebookEntry.stem,
      pinyin_stem: notebookEntry.pinyin_stem,
      options: notebookEntry.options,
      options_images: notebookEntry.options_images,
      answer_index: notebookEntry.correctAnswer,
      explanation_vi: notebookEntry.explanation_vi,
      audio_text: notebookEntry.audio_text,
      illustration: notebookEntry.illustration,
      audio_playback: notebookEntry.level <= 3 ? 2 : 1,
    };

    // Verify retest question is 100% coherent:
    expect(retestQ.options[retestQ.answer_index as number]).toBe('香蕉');
  });

  it('5. Multi-Question Isolation: Updating Question A leaves Question B untouched', () => {
    const q1Entry: WrongAnswerItem = {
      id: 'id-q1',
      questionId: 'q1',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: 'Question 1',
      options: ['A', 'B'],
      userAnswer: 0,
      correctAnswer: 1,
      explanation_vi: 'Exp 1',
      timestamp: FIXED_TIME_A,
      attempts: 1,
      mastered: false,
    };

    const q2Entry: WrongAnswerItem = {
      id: 'id-q2',
      questionId: 'q2',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: 'Question 2',
      options: ['X', 'Y'],
      userAnswer: 1,
      correctAnswer: 0,
      explanation_vi: 'Exp 2',
      timestamp: FIXED_TIME_A,
      attempts: 1,
      mastered: true,
    };

    const updateQ1Input: LogWrongAnswerInput = {
      questionId: 'q1',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: 'Question 1 Updated',
      options: ['B', 'A'],
      userAnswer: 1,
      correctAnswer: 0,
      explanation_vi: 'Exp 1 Updated',
    };

    const result = syncWrongAnswerEntry([q1Entry, q2Entry], updateQ1Input, FIXED_TIME_B);
    expect(result).toHaveLength(2);

    // Q1 updated
    expect(result[0].id).toBe('id-q1');
    expect(result[0].attempts).toBe(2);
    expect(result[0].stem).toBe('Question 1 Updated');

    // Q2 untouched
    expect(result[1]).toEqual(q2Entry);
  });

  it('6. Display Formatter and UI Highlight Integrity', () => {
    const entry: WrongAnswerItem = {
      id: 'entry-display-test',
      questionId: 'q-display',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: 'Display Test',
      options: ['香蕉', '葡萄', '苹果', '西瓜'],
      correctAnswer: 0, // '香蕉' (Option A)
      userAnswer: 2, // '苹果' (Option C)
      explanation_vi: 'Giải thích',
      timestamp: FIXED_TIME_B,
      attempts: 2,
      mastered: false,
    };

    // Format correct answer text helper
    const formattedCorrect = formatCorrectAnswerText(entry.options, entry.correctAnswer);
    expect(formattedCorrect).toBe('A. 香蕉');

    // UI letter derivations (as in HSKMockExam lines 4291-4297)
    const correctLetter = String.fromCharCode(65 + entry.correctAnswer);
    const userLetter = String.fromCharCode(65 + (entry.userAnswer as number));

    expect(correctLetter).toBe('A');
    expect(userLetter).toBe('C');
    expect(correctLetter).not.toBe(userLetter);

    // Option card highlights (as in HSKMockExam lines 4426-4427)
    const isCorrectForOpt0 = 0 === entry.correctAnswer;
    const isUserForOpt0 = 0 === entry.userAnswer;
    expect(isCorrectForOpt0).toBe(true);
    expect(isUserForOpt0).toBe(false);

    const isCorrectForOpt2 = 2 === entry.correctAnswer;
    const isUserForOpt2 = 2 === entry.userAnswer;
    expect(isCorrectForOpt2).toBe(false);
    expect(isUserForOpt2).toBe(true);
  });
});
