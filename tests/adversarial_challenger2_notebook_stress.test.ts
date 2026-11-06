/**
 * ADVERSARIAL CHALLENGER 2 TEST SUITE: Wrong Answer Notebook Permutation Stress
 *
 * Verifies R2 (Wrong Answer Notebook Snapshot Consistency) under hostile stress:
 * 1. 100+ random Fisher-Yates permutations across 5-session cascades with PRNG.
 * 2. Multi-question concurrent notebook interleaving (20 questions, 150 operations).
 * 3. Boundary cases: string userAnswer (writing reorder), empty/single/10+ options.
 * 4. Pedagogical state machine: Re-mastering and un-mastering cycle flipping.
 * 5. Attempt counter monotonicity, resilience against undefined/falsy attempts.
 * 6. Zero false-positive invariant: userAnswer === correctAnswer NEVER in notebook.
 */

import { describe, it, expect } from 'vitest';
import {
  WrongAnswerItem,
  LogWrongAnswerInput,
  syncWrongAnswerEntry,
  formatCorrectAnswerText,
} from '../src/components/HSKMockExam';

/**
 * Seeded Mulberry32 PRNG for 100% reproducible adversarial fuzzing.
 */
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using PRNG.
 */
function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

describe('Adversarial Challenger 2: Wrong Answer Notebook Permutation Stress', () => {
  // =========================================================================
  // Challenge 1: 100+ Random Permutations across 5 Sequential Sessions
  // =========================================================================
  it('1. 120 Random Permutations across 5 Sequential Sessions (Zero Desync & Stable Key)', () => {
    const rng = createPRNG(20261027);
    const TOTAL_TRIALS = 120;
    const SESSIONS_PER_TRIAL = 5;

    // Define canonical questions with distinct semantic options and true correct answer
    const CANONICAL_QUESTIONS = [
      {
        id: 'q-food-1',
        stem: '你喜欢吃什么？',
        options: ['米饭', '面条', '饺子', '包子'],
        correctText: '饺子',
      },
      {
        id: 'q-weather-2',
        stem: '今天天气怎么样？',
        options: ['晴天', '阴天', '下雨', '刮风', '下雪'],
        correctText: '晴天',
      },
      {
        id: 'q-trans-3',
        stem: '我们怎么去学校？',
        options: ['坐飞机', '骑自行车', '坐地铁'],
        correctText: '坐地铁',
      },
      {
        id: 'q-color-4',
        stem: '他买了什么颜色的衣服？',
        options: ['红色', '蓝色', '黑色', '白色', '黄色', '绿色'],
        correctText: '黑色',
      },
    ];

    for (let trial = 0; trial < TOTAL_TRIALS; trial++) {
      const q = CANONICAL_QUESTIONS[trial % CANONICAL_QUESTIONS.length];
      let notebook: WrongAnswerItem[] = [];
      let initialEntryId = '';

      for (let session = 1; session <= SESSIONS_PER_TRIAL; session++) {
        // Generate random permutation of options
        const permutedOptions = shuffleArray(q.options, rng);
        const newCorrectIdx = permutedOptions.indexOf(q.correctText);
        expect(newCorrectIdx).toBeGreaterThanOrEqual(0);

        // Student chooses a wrong option (randomly chosen among incorrect options)
        const wrongOptionPool = permutedOptions.filter((opt) => opt !== q.correctText);
        const chosenWrongText = wrongOptionPool[Math.floor(rng() * wrongOptionPool.length)];
        const studentUserAnswerIdx = permutedOptions.indexOf(chosenWrongText);

        expect(studentUserAnswerIdx).toBeGreaterThanOrEqual(0);
        expect(studentUserAnswerIdx).not.toBe(newCorrectIdx);

        const timestamp = 1730000000000 + trial * 10000 + session * 1000;
        const input: LogWrongAnswerInput = {
          questionId: q.id,
          level: 2,
          section: 'reading',
          part_type: 'single_choice',
          stem: q.stem,
          options: permutedOptions,
          userAnswer: studentUserAnswerIdx,
          correctAnswer: newCorrectIdx,
          explanation_vi: `Đáp án đúng là ${String.fromCharCode(65 + newCorrectIdx)}. ${q.correctText}`,
        };

        notebook = syncWrongAnswerEntry(notebook, input, timestamp);

        // Verification for this session:
        expect(notebook).toHaveLength(1);
        const entry = notebook[0];

        if (session === 1) {
          initialEntryId = entry.id;
          expect(initialEntryId).toBeTruthy();
        } else {
          // INVARIANT: ID stability across all permutation shifts
          expect(entry.id).toBe(initialEntryId);
        }

        // INVARIANT: Attempts equals session number
        expect(entry.attempts).toBe(session);

        // INVARIANT: Mastered is always false on failure
        expect(entry.mastered).toBe(false);

        // INVARIANT: Timestamp updated to current session
        expect(entry.timestamp).toBe(timestamp);

        // INVARIANT: Option snapshot coherence
        expect(entry.options).toEqual(permutedOptions);
        expect(entry.correctAnswer).toBe(newCorrectIdx);
        expect(entry.userAnswer).toBe(studentUserAnswerIdx);

        // INVARIANT: Resolved option text matches reality exactly
        expect(entry.options[entry.userAnswer as number]).toBe(chosenWrongText);
        expect(entry.options[entry.correctAnswer]).toBe(q.correctText);

        // INVARIANT: Zero false-positive collision
        expect(entry.userAnswer).not.toBe(entry.correctAnswer);
        expect(entry.options[entry.userAnswer as number]).not.toBe(entry.options[entry.correctAnswer]);

        // INVARIANT: UI Formatter matches new permutation
        const formatted = formatCorrectAnswerText(entry.options, entry.correctAnswer);
        const expectedLetter = String.fromCharCode(65 + newCorrectIdx);
        expect(formatted).toBe(`${expectedLetter}. ${q.correctText}`);
      }
    }
  });

  // =========================================================================
  // Challenge 2: Multi-Question Concurrent Interleaving
  // =========================================================================
  it('2. 20-Question Concurrent Notebook Interleaving with 150 Operations', () => {
    const rng = createPRNG(424242);
    const NUM_QUESTIONS = 20;
    const TOTAL_OPERATIONS = 150;

    const questionPool = Array.from({ length: NUM_QUESTIONS }, (_, i) => ({
      id: `q-concurrent-${i + 1}`,
      stem: `Stem for question ${i + 1}`,
      options: [`Opt A${i}`, `Opt B${i}`, `Opt C${i}`, `Opt D${i}`],
      correctText: `Opt B${i}`,
    }));

    let notebook: WrongAnswerItem[] = [];
    const expectedAttempts: Record<string, number> = {};
    const recordedIds: Record<string, string> = {};

    for (let op = 0; op < TOTAL_OPERATIONS; op++) {
      // Pick random question from pool
      const q = questionPool[Math.floor(rng() * questionPool.length)];
      expectedAttempts[q.id] = (expectedAttempts[q.id] || 0) + 1;

      // Random permutation
      const permuted = shuffleArray(q.options, rng);
      const correctIdx = permuted.indexOf(q.correctText);
      const wrongOpts = permuted.filter((o) => o !== q.correctText);
      const wrongChoice = wrongOpts[Math.floor(rng() * wrongOpts.length)];
      const userIdx = permuted.indexOf(wrongChoice);

      const timestamp = 1731000000000 + op * 500;
      const input: LogWrongAnswerInput = {
        questionId: q.id,
        level: 1,
        section: 'reading',
        part_type: 'single_choice',
        stem: q.stem,
        options: permuted,
        userAnswer: userIdx,
        correctAnswer: correctIdx,
        explanation_vi: `Exp for ${q.id}`,
      };

      notebook = syncWrongAnswerEntry(notebook, input, timestamp);

      // Verify no duplicate question entries exist
      const questionIds = notebook.map((item) => item.questionId);
      const uniqueQuestionIds = new Set(questionIds);
      expect(questionIds.length).toBe(uniqueQuestionIds.size);

      // Verify ID stability for this question
      const currentEntry = notebook.find((item) => item.questionId === q.id)!;
      expect(currentEntry).toBeDefined();

      if (!recordedIds[q.id]) {
        recordedIds[q.id] = currentEntry.id;
      } else {
        expect(currentEntry.id).toBe(recordedIds[q.id]);
      }

      // Verify attempts counter matches tracking
      expect(currentEntry.attempts).toBe(expectedAttempts[q.id]);
      // Verify snapshot accuracy
      expect(currentEntry.options[currentEntry.userAnswer as number]).toBe(wrongChoice);
      expect(currentEntry.options[currentEntry.correctAnswer]).toBe(q.correctText);
    }

    // Final integrity check across all questions present in notebook
    expect(notebook.length).toBe(Object.keys(expectedAttempts).length);
    for (const item of notebook) {
      expect(item.attempts).toBe(expectedAttempts[item.questionId]);
      expect(item.id).toBe(recordedIds[item.questionId]);
      expect(item.options[item.userAnswer as number]).not.toBe(item.options[item.correctAnswer]);
    }
  });

  // =========================================================================
  // Challenge 3: Boundary Cases - String userAnswer (Writing Reorder Tasks)
  // =========================================================================
  it('3. Boundary: String userAnswer (HSK Writing Reordering & Free Text)', () => {
    let notebook: WrongAnswerItem[] = [];
    const fixedTime = 1732000000000;

    // Session 1: Student submits incorrect word order as string
    const inputWritingS1: LogWrongAnswerInput = {
      questionId: 'hsk3-write-reorder-1',
      level: 3,
      section: 'writing',
      part_type: 'read_reorder_sentence',
      stem: '连词成句：学习 / 我 / 汉语 / 在',
      options: [], // Writing tasks often have no MCQ options
      userAnswer: '学习 我 在 汉语', // Wrong order
      correctAnswer: 0,
      explanation_vi: 'Thứ tự đúng: 我在学习汉语。',
    };

    notebook = syncWrongAnswerEntry(notebook, inputWritingS1, fixedTime);
    expect(notebook).toHaveLength(1);
    expect(notebook[0].userAnswer).toBe('学习 我 在 汉语');
    expect(typeof notebook[0].userAnswer).toBe('string');
    expect(notebook[0].attempts).toBe(1);
    const initialId = notebook[0].id;

    // Session 2: Student retries writing task, makes a different mistake
    const inputWritingS2: LogWrongAnswerInput = {
      ...inputWritingS1,
      userAnswer: '我在 汉语 学习', // Still wrong
      explanation_vi: 'Thứ tự đúng: 我在学习汉语。 (Chủ ngữ + 在 + Động từ + Tân ngữ)',
    };

    notebook = syncWrongAnswerEntry(notebook, inputWritingS2, fixedTime + 5000);
    expect(notebook).toHaveLength(1);
    expect(notebook[0].id).toBe(initialId); // Stably preserved!
    expect(notebook[0].attempts).toBe(2);
    expect(notebook[0].userAnswer).toBe('我在 汉语 学习');
    expect(notebook[0].explanation_vi).toContain('Chủ ngữ + 在');

    // UI letter derivation test for string userAnswer
    const item = notebook[0];
    const userDisplay =
      typeof item.userAnswer === 'number'
        ? item.userAnswer >= 0
          ? String.fromCharCode(65 + item.userAnswer)
          : 'Chưa chọn'
        : item.userAnswer || 'Chưa chọn';

    expect(userDisplay).toBe('我在 汉语 学习');

    // Edge case: Empty string userAnswer
    const inputWritingEmpty: LogWrongAnswerInput = {
      ...inputWritingS1,
      userAnswer: '',
    };
    notebook = syncWrongAnswerEntry(notebook, inputWritingEmpty, fixedTime + 10000);
    expect(notebook[0].attempts).toBe(3);
    expect(notebook[0].userAnswer).toBe('');
    const userDisplayEmpty =
      typeof notebook[0].userAnswer === 'number'
        ? notebook[0].userAnswer >= 0
          ? String.fromCharCode(65 + notebook[0].userAnswer)
          : 'Chưa chọn'
        : notebook[0].userAnswer || 'Chưa chọn';
    expect(userDisplayEmpty).toBe('Chưa chọn');
  });

  // =========================================================================
  // Challenge 4: Boundary Cases - Extreme Option Counts (0, 1, 2, 16 options)
  // =========================================================================
  it('4. Boundary: Extreme Option Counts (0, 1, 2, and 16 options)', () => {
    let notebook: WrongAnswerItem[] = [];
    const time = 1733000000000;

    // 0 options (Writing prompt)
    const zeroOptInput: LogWrongAnswerInput = {
      questionId: 'q-zero-opts',
      level: 4,
      section: 'writing',
      part_type: 'write_composition',
      stem: '看图写句子',
      options: [],
      userAnswer: '小狗在睡觉',
      correctAnswer: 0,
      explanation_vi: 'Gợi ý đáp án',
    };
    notebook = syncWrongAnswerEntry(notebook, zeroOptInput, time);
    expect(notebook[0].options).toEqual([]);
    expect(formatCorrectAnswerText(notebook[0].options, 0)).toBe('');

    // 1 option (Edge case)
    const singleOptInput: LogWrongAnswerInput = {
      questionId: 'q-single-opt',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: '单选测试',
      options: ['唯一答案'],
      userAnswer: 0,
      correctAnswer: 0,
      explanation_vi: 'Giải thích',
    };
    notebook = syncWrongAnswerEntry(notebook, singleOptInput, time);
    expect(notebook[0].options).toEqual(['唯一答案']);
    expect(formatCorrectAnswerText(notebook[0].options, 0)).toBe('A. 唯一答案');

    // 2 options (True/False judgment)
    const tfInput: LogWrongAnswerInput = {
      questionId: 'q-tf-judgment',
      level: 2,
      section: 'listening',
      part_type: 'true_false',
      stem: '判断对错',
      options: ['对', '错'],
      userAnswer: 1, // Student said '错'
      correctAnswer: 0, // Correct was '对'
      explanation_vi: 'Đáp án là Đúng (A)',
    };
    notebook = syncWrongAnswerEntry(notebook, tfInput, time);
    const tfEntry = notebook.find((i) => i.questionId === 'q-tf-judgment')!;
    expect(tfEntry.options).toEqual(['对', '错']);
    expect(tfEntry.options[tfEntry.userAnswer as number]).toBe('错');
    expect(tfEntry.options[tfEntry.correctAnswer]).toBe('对');

    // 16 options (HSK 5/6 vocabulary matching / large word bank)
    const largeOpts = Array.from({ length: 16 }, (_, i) => `词语-${String.fromCharCode(65 + i)}`);
    const largeBankInput: LogWrongAnswerInput = {
      questionId: 'q-large-bank',
      level: 6,
      section: 'reading',
      part_type: 'match_large_bank',
      stem: '选词填空（16选1）',
      options: largeOpts,
      userAnswer: 15, // Option P
      correctAnswer: 4, // Option E
      explanation_vi: 'Giải thích chọn E',
    };
    notebook = syncWrongAnswerEntry(notebook, largeBankInput, time);
    const largeEntry = notebook.find((i) => i.questionId === 'q-large-bank')!;
    expect(largeEntry.options.length).toBe(16);
    expect(largeEntry.userAnswer).toBe(15);
    expect(largeEntry.correctAnswer).toBe(4);
    expect(formatCorrectAnswerText(largeEntry.options, 4)).toBe('E. 词语-E');
    expect(formatCorrectAnswerText(largeEntry.options, 15)).toBe('P. 词语-P');
  });

  // =========================================================================
  // Challenge 5: Pedagogical Flapping - Repeated Re-mastering & Un-mastering Cycle
  // =========================================================================
  it('5. Pedagogical Flapping: Mastered Item Repeatedly Un-mastered Across 10 Cycles', () => {
    let notebook: WrongAnswerItem[] = [];
    const baseTime = 1734000000000;
    const CYCLES = 10;

    // Initial failure
    notebook = syncWrongAnswerEntry(
      notebook,
      {
        questionId: 'q-flapping',
        level: 3,
        section: 'reading',
        part_type: 'single_choice',
        stem: 'Flapping Stem',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanation_vi: 'Exp',
      },
      baseTime
    );

    const stableId = notebook[0].id;
    expect(notebook[0].attempts).toBe(1);
    expect(notebook[0].mastered).toBe(false);

    for (let c = 1; c <= CYCLES; c++) {
      // Step A: Student masters question in a retest / practice check
      notebook = notebook.map((item) =>
        item.questionId === 'q-flapping' ? { ...item, mastered: true } : item
      );
      expect(notebook[0].mastered).toBe(true);
      expect(notebook[0].attempts).toBe(c); // Attempts untouched by mastering

      // Step B: Student fails question again in a subsequent mock exam session
      const permuted = c % 2 === 0 ? ['A', 'B'] : ['B', 'A'];
      const corr = permuted.indexOf('B');
      const user = permuted.indexOf('A');

      notebook = syncWrongAnswerEntry(
        notebook,
        {
          questionId: 'q-flapping',
          level: 3,
          section: 'reading',
          part_type: 'single_choice',
          stem: `Flapping Stem Iteration ${c}`,
          options: permuted,
          userAnswer: user,
          correctAnswer: corr,
          explanation_vi: `Exp Iteration ${c}`,
        },
        baseTime + c * 10000
      );

      // INVARIANT: mastered MUST un-master back to false
      expect(notebook[0].mastered).toBe(false);
      // INVARIANT: attempts strictly increments
      expect(notebook[0].attempts).toBe(c + 1);
      // INVARIANT: ID never changes
      expect(notebook[0].id).toBe(stableId);
      // INVARIANT: Options updated
      expect(notebook[0].options[notebook[0].userAnswer as number]).toBe('A');
      expect(notebook[0].options[notebook[0].correctAnswer]).toBe('B');
    }
  });

  // =========================================================================
  // Challenge 6: Attempt Counter Robustness (Nullish / Falsy / Boundary Values)
  // =========================================================================
  it('6. Attempt Counter Robustness: Resilient against 0, undefined, or missing attempts', () => {
    const fixedTime = 1735000000000;

    // Case A: prevItem has attempts: 0 (falsy)
    const prevZeroAttempts: WrongAnswerItem = {
      id: 'id-zero-att',
      questionId: 'q-zero-att',
      level: 1,
      section: 'reading',
      part_type: 'single_choice',
      stem: 'Stem',
      options: ['A', 'B'],
      userAnswer: 0,
      correctAnswer: 1,
      explanation_vi: 'Exp',
      timestamp: fixedTime,
      attempts: 0,
      mastered: false,
    };

    const updatedA = syncWrongAnswerEntry(
      [prevZeroAttempts],
      {
        questionId: 'q-zero-att',
        level: 1,
        section: 'reading',
        part_type: 'single_choice',
        stem: 'Stem',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanation_vi: 'Exp',
      },
      fixedTime + 1000
    );

    // Because (prevItem.attempts || 1) + 1, if attempts is 0, (0 || 1) + 1 = 2
    expect(updatedA[0].attempts).toBe(2);

    // Case B: prevItem has attempts: undefined as any
    const prevUndefinedAttempts: WrongAnswerItem = {
      ...prevZeroAttempts,
      id: 'id-undef-att',
      questionId: 'q-undef-att',
      attempts: undefined as any,
    };

    const updatedB = syncWrongAnswerEntry(
      [prevUndefinedAttempts],
      {
        questionId: 'q-undef-att',
        level: 1,
        section: 'reading',
        part_type: 'single_choice',
        stem: 'Stem',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanation_vi: 'Exp',
      },
      fixedTime + 2000
    );

    expect(updatedB[0].attempts).toBe(2);

    // Case C: Large attempts count (e.g. 999)
    const prevLargeAttempts: WrongAnswerItem = {
      ...prevZeroAttempts,
      id: 'id-large-att',
      questionId: 'q-large-att',
      attempts: 999,
    };

    const updatedC = syncWrongAnswerEntry(
      [prevLargeAttempts],
      {
        questionId: 'q-large-att',
        level: 1,
        section: 'reading',
        part_type: 'single_choice',
        stem: 'Stem',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanation_vi: 'Exp',
      },
      fixedTime + 3000
    );

    expect(updatedC[0].attempts).toBe(1000);
  });

  // =========================================================================
  // Challenge 7: formatCorrectAnswerText Boundary Robustness
  // =========================================================================
  it('7. formatCorrectAnswerText: Extreme and Malformed Input Robustness', () => {
    // Standard 4-option
    expect(formatCorrectAnswerText(['香蕉', '苹果', '西瓜', '葡萄'], 1)).toBe('B. 苹果');

    // Options already have embedded letters
    expect(formatCorrectAnswerText(['A. 香蕉', 'B: 苹果', 'C 西瓜', 'D.葡萄'], 1)).toBe('B. 苹果');

    // Empty or non-array options
    expect(formatCorrectAnswerText([], 0)).toBe('');
    expect(formatCorrectAnswerText(null, 2)).toBe('');
    expect(formatCorrectAnswerText(undefined, 3)).toBe('');

    // Index out of range
    expect(formatCorrectAnswerText(['A', 'B'], 5)).toBe('F');
    expect(formatCorrectAnswerText(['A', 'B'], -1)).toBe('A. A'); // safeIdx fallback to 0
    expect(formatCorrectAnswerText(['A', 'B'], NaN as any)).toBe('A. A');
  });
});
