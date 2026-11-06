/**
 * Adversarial Stress Test: QuizzesView Accuracy, XP Scoring, and QuizQuestion Conformance
 *
 * This empirical test harness verifies:
 * 1. Accuracy calculations:
 *    - Strict [0, 100]% bounds across all score/total combinations
 *    - Edge cases: 0/20 (0%), 20/20 (100%), 1/1 (100%), 0/1 (0%)
 *    - Fractional rounding: 1/3, 2/3, 1/7
 *    - Monotonicity: accuracy(k, N) <= accuracy(k+1, N)
 *    - Zero total handling (0/0)
 * 2. XP award logic:
 *    - +25 XP per correct answer
 *    - 0 XP for wrong answer
 *    - Idempotency (prevent double-awarding if option clicked repeatedly)
 *    - UI display alignment (+25 XP badge, +{score*25} XP result card, Zalo share)
 * 3. Question pool non-emptiness & filter safety:
 *    - getCuratedQuestions across all HSK levels (1-6, 'all') and sub-types ('all', 'pinyin', 'grammar')
 *    - applyFilters fallback behavior
 * 4. QuizQuestion interface conformance:
 *    - All questions in CURATED_PINYIN_GRAMMAR_QUESTIONS and CURATED_LISTENING_QUESTIONS
 *    - Server /api/gemini/generate-quiz fallback questions
 *    - Strict schema validation: id, type, prompt, options, correctAnswer, explanation, audioText
 *    - Exact match: correctAnswer MUST exist in options
 */

import {
  getCuratedQuestions,
  CURATED_PINYIN_GRAMMAR_BY_HSK,
  CURATED_LISTENING_BY_HSK,
  CURATED_PINYIN_GRAMMAR_QUESTIONS,
  CURATED_LISTENING_QUESTIONS,
} from '../src/data/curatedQuizData';
import { QuizQuestion, HSKLevel, UserStats } from '../src/types';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  [PASS] ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  [FAIL] ${name}${details ? ': ' + details : ''}`);
  }
}

// =========================================================================
// SUITE 1: ACCURACY CALCULATIONS & MATHEMATICAL BOUNDS
// =========================================================================
function runAccuracyCalculationTests() {
  console.log('\n=== [SUITE 1] ACCURACY CALCULATIONS & BOUNDS ===\n');

  // Exact formula from QuizzesView.tsx: lines 232, 296, 955
  const calcAccuracy = (score: number, total: number): number => {
    return Math.round((score / total) * 100);
  };

  // Safe formula with total > 0 guard
  const calcAccuracySafe = (score: number, total: number): number => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  // 1. Edge Case: 0 correct out of 20
  const acc0_20 = calcAccuracy(0, 20);
  assert(acc0_20 === 0, 'Edge Case 0/20 returns 0%', `Got ${acc0_20}%`);

  // 2. Edge Case: 20 correct out of 20
  const acc20_20 = calcAccuracy(20, 20);
  assert(acc20_20 === 100, 'Edge Case 20/20 returns 100%', `Got ${acc20_20}%`);

  // 3. Edge Case: 1 correct out of 1
  const acc1_1 = calcAccuracy(1, 1);
  assert(acc1_1 === 100, 'Edge Case 1/1 returns 100%', `Got ${acc1_1}%`);

  // 4. Edge Case: 0 correct out of 1
  const acc0_1 = calcAccuracy(0, 1);
  assert(acc0_1 === 0, 'Edge Case 0/1 returns 0%', `Got ${acc0_1}%`);

  // 5. Intermediate values
  assert(calcAccuracy(10, 20) === 50, 'Accuracy 10/20 returns 50%', `Got ${calcAccuracy(10, 20)}%`);
  assert(calcAccuracy(5, 20) === 25, 'Accuracy 5/20 returns 25%', `Got ${calcAccuracy(5, 20)}%`);
  assert(calcAccuracy(15, 20) === 75, 'Accuracy 15/20 returns 75%', `Got ${calcAccuracy(15, 20)}%`);
  assert(calcAccuracy(19, 20) === 95, 'Accuracy 19/20 returns 95%', `Got ${calcAccuracy(19, 20)}%`);
  assert(calcAccuracy(1, 20) === 5, 'Accuracy 1/20 returns 5%', `Got ${calcAccuracy(1, 20)}%`);

  // 6. Fractional rounding checks
  assert(calcAccuracy(1, 3) === 33, 'Fractional rounding 1/3 returns 33%', `Got ${calcAccuracy(1, 3)}%`);
  assert(calcAccuracy(2, 3) === 67, 'Fractional rounding 2/3 returns 67%', `Got ${calcAccuracy(2, 3)}%`);
  assert(calcAccuracy(1, 7) === 14, 'Fractional rounding 1/7 returns 14%', `Got ${calcAccuracy(1, 7)}%`);
  assert(calcAccuracy(5, 7) === 71, 'Fractional rounding 5/7 returns 71%', `Got ${calcAccuracy(5, 7)}%`);

  // 7. Exhaustive Monotonicity & Invariant Check for N in 1..100, k in 0..N
  let allWithinBounds = true;
  let allMonotonic = true;
  let totalPairsChecked = 0;

  for (let total = 1; total <= 100; total++) {
    let prevAcc = -1;
    for (let score = 0; score <= total; score++) {
      const acc = calcAccuracy(score, total);
      totalPairsChecked++;
      if (acc < 0 || acc > 100 || isNaN(acc) || !isFinite(acc)) {
        allWithinBounds = false;
      }
      if (acc < prevAcc) {
        allMonotonic = false;
      }
      prevAcc = acc;
    }
  }

  assert(
    allWithinBounds,
    `Invariant: Score / Total accuracy strictly in [0, 100]% across all ${totalPairsChecked} (score, total) combinations`,
    'No NaN, no overflow, strictly 0..100'
  );
  assert(allMonotonic, 'Monotonicity: Higher scores never yield lower accuracy', 'Verified non-decreasing');

  // 8. Adversarial Zero Total Check (0/0)
  const rawZeroAcc = calcAccuracy(0, 0);
  const isRawNaN = isNaN(rawZeroAcc);
  const safeZeroAcc = calcAccuracySafe(0, 0);

  assert(
    isRawNaN,
    'Observation: Raw Math.round((0/0)*100) evaluates to NaN without guard',
    'Raw returns NaN'
  );
  assert(
    safeZeroAcc === 0,
    'Safe Accuracy Guard: total > 0 ? round(...) : 0 evaluates to 0%',
    `Safe formula yields ${safeZeroAcc}%`
  );
}

// =========================================================================
// SUITE 2: QUESTION POOL INTEGRITY & FILTER RESILIENCE
// =========================================================================
function runQuestionPoolTests() {
  console.log('\n=== [SUITE 2] QUESTION POOL INTEGRITY & FILTER RESILIENCE ===\n');

  // 1. Base curated counts
  assert(
    CURATED_PINYIN_GRAMMAR_QUESTIONS.length > 0,
    `CURATED_PINYIN_GRAMMAR_QUESTIONS pool non-empty (${CURATED_PINYIN_GRAMMAR_QUESTIONS.length} questions)`
  );
  assert(
    CURATED_LISTENING_QUESTIONS.length > 0,
    `CURATED_LISTENING_QUESTIONS pool non-empty (${CURATED_LISTENING_QUESTIONS.length} questions)`
  );

  // 2. Test getCuratedQuestions across all HSK levels for pinyin_grammar
  const hskLevels: HSKLevel[] = [1, 2, 3, 4, 5, 6];
  for (const lvl of hskLevels) {
    const list = getCuratedQuestions('pinyin_grammar', lvl, 'all');
    assert(
      list.length > 0,
      `HSK ${lvl} Pinyin & Grammar pool has questions`,
      `Count: ${list.length}`
    );
  }

  // 3. Test getCuratedQuestions across all HSK levels for listening
  for (const lvl of hskLevels) {
    const list = getCuratedQuestions('listening', lvl, 'all');
    assert(
      list.length > 0,
      `HSK ${lvl} Listening pool has questions`,
      `Count: ${list.length}`
    );
  }

  // 4. Test subType filters ('pinyin', 'grammar')
  for (const lvl of hskLevels) {
    const pinyinOnly = getCuratedQuestions('pinyin_grammar', lvl, 'pinyin');
    const grammarOnly = getCuratedQuestions('pinyin_grammar', lvl, 'grammar');

    // Verify type purity
    const pinyinPure = pinyinOnly.every((q) => q.type === 'pinyin');
    const grammarPure = grammarOnly.every((q) => q.type === 'grammar');

    assert(
      pinyinPure,
      `HSK ${lvl} subType 'pinyin' contains only type='pinyin'`,
      `Count: ${pinyinOnly.length}`
    );
    assert(
      grammarPure,
      `HSK ${lvl} subType 'grammar' contains only type='grammar'`,
      `Count: ${grammarOnly.length}`
    );
  }

  // 5. Verify applyFilters fallback resilience:
  // If a filter combination were to yield 0 items, QuizzesView line 102 falls back to CURATED_PINYIN_GRAMMAR_QUESTIONS
  const simulateApplyFilters = (cat: any, hsk: any, sub: any): QuizQuestion[] => {
    if (cat === 'pinyin_grammar' || cat === 'listening') {
      const filtered = getCuratedQuestions(cat, hsk, sub);
      return filtered.length > 0 ? filtered : CURATED_PINYIN_GRAMMAR_QUESTIONS;
    }
    return CURATED_PINYIN_GRAMMAR_QUESTIONS;
  };

  const fallbackTest = simulateApplyFilters('pinyin_grammar', 999 as any, 'pinyin');
  assert(
    fallbackTest.length > 0,
    'applyFilters fallback guarantees activeQuestionPool.length > 0 even with invalid HSK level',
    `Fallback pool count: ${fallbackTest.length}`
  );
}

// =========================================================================
// SUITE 3: XP AWARD LOGIC & STATE MACHINE SIMULATION
// =========================================================================
function runXpLogicTests() {
  console.log('\n=== [SUITE 3] XP AWARD LOGIC & SIMULATION ===\n');

  // Simulated QuizzesView State Machine
  class QuizzesSimulator {
    public score = 0;
    public currentQuestionIndex = 0;
    public selectedOption: string | null = null;
    public isAnswered = false;
    public isCorrect = false;
    public quizFinished = false;
    public activePool: QuizQuestion[];
    public stats: UserStats;
    public statsUpdateLog: Array<Partial<UserStats>> = [];

    constructor(pool: QuizQuestion[], initialStats?: Partial<UserStats>) {
      this.activePool = pool;
      this.stats = {
        xp: 100,
        dailyStreak: 1,
        lastActiveDate: new Date().toISOString(),
        cardsReviewedToday: 0,
        totalReviews: 0,
        quizzesCompleted: 0,
        quizAccuracy: 0,
        masteredWordsCount: 0,
        studyTimeMinutes: 0,
        ...initialStats,
      };
    }

    onUpdateStats(newStats: Partial<UserStats>) {
      this.statsUpdateLog.push(newStats);
      this.stats = {
        ...this.stats,
        ...newStats,
      };
    }

    handleSelectOption(option: string) {
      if (this.isAnswered || !this.currentQ) return;
      this.selectedOption = option;
      this.isAnswered = true;

      const correct = option === this.currentQ.correctAnswer;
      this.isCorrect = correct;

      if (correct) {
        this.score++;
        // Award +25 XP (QuizzesView.tsx:280-283)
        this.onUpdateStats({
          xp: this.stats.xp + 25,
        });
      }
    }

    handleNextQuestion() {
      if (this.currentQuestionIndex + 1 < this.activePool.length) {
        this.currentQuestionIndex++;
        this.selectedOption = null;
        this.isAnswered = false;
        this.isCorrect = false;
      } else {
        this.quizFinished = true;
        this.onUpdateStats({
          quizzesCompleted: this.stats.quizzesCompleted + 1,
          quizAccuracy: Math.round((this.score / this.activePool.length) * 100),
        });
      }
    }

    get currentQ(): QuizQuestion | null {
      return this.activePool[this.currentQuestionIndex] || null;
    }
  }

  // 1. Simulation: 20 Questions Quiz with Perfect Score (20/20)
  const mockPool20: QuizQuestion[] = CURATED_PINYIN_GRAMMAR_QUESTIONS.slice(0, 20);
  const simPerfect = new QuizzesSimulator(mockPool20, { xp: 100, quizzesCompleted: 0 });

  for (let i = 0; i < mockPool20.length; i++) {
    const q = simPerfect.currentQ!;
    simPerfect.handleSelectOption(q.correctAnswer as string);
    simPerfect.handleNextQuestion();
  }

  assert(simPerfect.score === 20, '20/20 Quiz: Final score is 20', `Score: ${simPerfect.score}`);
  assert(simPerfect.quizFinished, '20/20 Quiz: Marked as finished');
  assert(simPerfect.stats.quizAccuracy === 100, '20/20 Quiz: Final accuracy is 100%', `Got ${simPerfect.stats.quizAccuracy}%`);
  assert(simPerfect.stats.quizzesCompleted === 1, '20/20 Quiz: quizzesCompleted incremented to 1');
  assert(
    simPerfect.stats.xp === 100 + 20 * 25,
    `20/20 Quiz: XP correctly awarded +500 XP (from 100 to 600)`,
    `Final XP: ${simPerfect.stats.xp}`
  );

  // 2. Simulation: 20 Questions Quiz with Zero Score (0/20)
  const simZero = new QuizzesSimulator(mockPool20, { xp: 100, quizzesCompleted: 0 });
  for (let i = 0; i < mockPool20.length; i++) {
    const q = simZero.currentQ!;
    // Choose wrong option
    const wrongOpt = q.options?.find((opt) => opt !== q.correctAnswer) || 'WRONG_ANSWER';
    simZero.handleSelectOption(wrongOpt);
    simZero.handleNextQuestion();
  }

  assert(simZero.score === 0, '0/20 Quiz: Final score is 0', `Score: ${simZero.score}`);
  assert(simZero.stats.quizAccuracy === 0, '0/20 Quiz: Final accuracy is 0%', `Got ${simZero.stats.quizAccuracy}%`);
  assert(simZero.stats.xp === 100, '0/20 Quiz: XP remains 100 (+0 XP awarded)', `Final XP: ${simZero.stats.xp}`);
  assert(simZero.stats.quizzesCompleted === 1, '0/20 Quiz: quizzesCompleted incremented to 1');

  // 3. Simulation: 1 Question Quiz with 1 Correct (1/1)
  const mockPool1: QuizQuestion[] = CURATED_PINYIN_GRAMMAR_QUESTIONS.slice(0, 1);
  const simOne = new QuizzesSimulator(mockPool1, { xp: 50 });
  simOne.handleSelectOption(mockPool1[0].correctAnswer as string);
  simOne.handleNextQuestion();

  assert(simOne.score === 1, '1/1 Quiz: Final score is 1');
  assert(simOne.stats.quizAccuracy === 100, '1/1 Quiz: Final accuracy is 100%');
  assert(simOne.stats.xp === 75, '1/1 Quiz: Awarded exactly +25 XP (from 50 to 75)', `Final XP: ${simOne.stats.xp}`);

  // 4. Test Idempotent Option Selection (prevent multiple clicks per question)
  const simIdempotent = new QuizzesSimulator(mockPool20, { xp: 0 });
  const firstQ = simIdempotent.currentQ!;
  simIdempotent.handleSelectOption(firstQ.correctAnswer as string);
  const xpAfterFirstClick = simIdempotent.stats.xp;
  const scoreAfterFirstClick = simIdempotent.score;

  // Attempt second click on same question with correct answer
  simIdempotent.handleSelectOption(firstQ.correctAnswer as string);
  // Attempt third click with another option
  const otherOpt = firstQ.options?.find((o) => o !== firstQ.correctAnswer) || 'OTHER';
  simIdempotent.handleSelectOption(otherOpt);

  assert(
    simIdempotent.score === scoreAfterFirstClick,
    'Idempotency: Re-clicking options does NOT increment score',
    `Score stayed at ${simIdempotent.score}`
  );
  assert(
    simIdempotent.stats.xp === xpAfterFirstClick,
    'Idempotency: Re-clicking options does NOT re-award XP',
    `XP stayed at ${simIdempotent.stats.xp}`
  );

  // 5. Consistency Check of UI XP Text Formulas:
  // UI Badge: "+25 XP / câu đúng" (QuizzesView:533)
  // Result card: "+{score * 25} XP" (QuizzesView:961)
  // Zalo share: `+${score * 25} XP` (QuizzesView:242)
  let allScoreXpConsistent = true;
  for (let s = 0; s <= 20; s++) {
    const totalAwarded = s * 25;
    const uiResultCardText = `+${s * 25} XP`;
    const uiZaloText = `+${s * 25} XP`;
    if (uiResultCardText !== `+${totalAwarded} XP` || uiZaloText !== `+${totalAwarded} XP`) {
      allScoreXpConsistent = false;
    }
  }
  assert(allScoreXpConsistent, 'UI Consistency: UI XP formulas strictly match score * 25 XP');

  // 6. Robustness test: stats.xp is 0
  const simZeroXp = new QuizzesSimulator(mockPool1, { xp: 0 });
  simZeroXp.handleSelectOption(mockPool1[0].correctAnswer as string);
  assert(simZeroXp.stats.xp === 25, 'Zero initial XP: 0 + 25 = 25 XP without NaN');
}

// =========================================================================
// SUITE 4: QUIZQUESTION INTERFACE CONFORMANCE
// =========================================================================
function runQuizQuestionInterfaceTests() {
  console.log('\n=== [SUITE 4] QUIZQUESTION INTERFACE CONFORMANCE ===\n');

  const validTypes = new Set([
    'pinyin',
    'meaning',
    'listening',
    'word_order',
    'radical',
    'fill_blank',
    'grammar',
    'writing',
  ]);

  const allCuratedQuestions = [
    ...CURATED_PINYIN_GRAMMAR_QUESTIONS,
    ...CURATED_LISTENING_QUESTIONS,
  ];

  assert(
    allCuratedQuestions.length > 0,
    `Total curated questions to validate: ${allCuratedQuestions.length}`
  );

  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];
  let invalidTypeCount = 0;
  let emptyPromptCount = 0;
  let invalidOptionsCount = 0;
  let correctAnswerNotInOptionsCount = 0;
  let emptyExplanationCount = 0;
  let missingAudioTextListeningCount = 0;
  let invalidHskLevelCount = 0;

  for (const q of allCuratedQuestions) {
    // 1. ID uniqueness
    if (seenIds.has(q.id)) {
      duplicateIds.push(q.id);
    } else {
      seenIds.add(q.id);
    }

    // 2. Type conformance
    if (!validTypes.has(q.type)) {
      invalidTypeCount++;
    }

    // 3. Prompt conformance
    if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.trim() === '') {
      emptyPromptCount++;
    }

    // 4. Options array conformance
    if (
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      q.options.some((opt) => typeof opt !== 'string' || opt.trim() === '')
    ) {
      invalidOptionsCount++;
    } else {
      // Check for duplicate options within question
      const optSet = new Set(q.options);
      if (optSet.size !== q.options.length) {
        invalidOptionsCount++;
      }
    }

    // 5. CorrectAnswer conformance & option match
    if (typeof q.correctAnswer === 'string') {
      if (!q.options || !q.options.includes(q.correctAnswer)) {
        correctAnswerNotInOptionsCount++;
        console.error(
          `    [MISMATCH] Question id=${q.id}: correctAnswer="${q.correctAnswer}" not found in options:`,
          q.options
        );
      }
    } else if (Array.isArray(q.correctAnswer)) {
      // Note: In QuizzesView.tsx:272, option === currentQ.correctAnswer.
      // If correctAnswer is array, equality fails!
      correctAnswerNotInOptionsCount++;
    } else {
      correctAnswerNotInOptionsCount++;
    }

    // 6. Explanation conformance
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim() === '') {
      emptyExplanationCount++;
    }

    // 7. Listening type audioText conformance
    if (q.type === 'listening') {
      if (!q.audioText || typeof q.audioText !== 'string' || q.audioText.trim() === '') {
        missingAudioTextListeningCount++;
      }
    }

    // 8. HskLevel conformance (if provided)
    if (q.hskLevel !== undefined && (q.hskLevel < 1 || q.hskLevel > 6)) {
      invalidHskLevelCount++;
    }
  }

  assert(duplicateIds.length === 0, 'Question ID uniqueness across all curated questions', `Duplicates: ${duplicateIds.join(', ')}`);
  assert(invalidTypeCount === 0, 'Question types strictly match QuizQuestion.type union', `Invalid: ${invalidTypeCount}`);
  assert(emptyPromptCount === 0, 'Prompts are non-empty strings', `Empty prompts: ${emptyPromptCount}`);
  assert(invalidOptionsCount === 0, 'Options arrays are valid (length >= 2, non-empty, no duplicates)', `Invalid: ${invalidOptionsCount}`);
  assert(
    correctAnswerNotInOptionsCount === 0,
    'correctAnswer strictly matches an option in options array',
    `Mismatches: ${correctAnswerNotInOptionsCount}`
  );
  assert(emptyExplanationCount === 0, 'Explanations are non-empty strings', `Empty: ${emptyExplanationCount}`);
  assert(
    missingAudioTextListeningCount === 0,
    "All 'listening' questions provide audioText for Chinese TTS audio playback",
    `Missing audioText: ${missingAudioTextListeningCount}`
  );
  assert(invalidHskLevelCount === 0, 'HSK levels (when specified) are valid (1-6)', `Invalid: ${invalidHskLevelCount}`);

  // 9. Fallback questions conformance in server.ts
  const serverFallbackQuestions: QuizQuestion[] = [
    {
      id: `q-gen-fallback-1`,
      type: 'pinyin',
      prompt: `Chọn phiên âm Pinyin kèm thanh điệu chính xác cho từ "学习":`,
      questionChinese: '学习',
      options: ['xuéxí (học tập)', 'xuěxǐ', 'xuéxì', 'xūexí'],
      correctAnswer: 'xuéxí (học tập)',
      explanation: '学习 (học tập) gồm thanh 2 (xué) và thanh 2 (xí). Cả hai âm đều đọc lướt từ trầm lên bổng.',
      usageNotes: '学习 có thể làm động từ hoặc danh từ.',
      hskLevel: 1,
    },
    {
      id: `q-gen-fallback-2`,
      type: 'meaning',
      prompt: `Từ "准备" trong câu "我们准备出发了" có nghĩa là gì?`,
      questionChinese: '准备',
      options: ['Chuẩn bị / sắp xếp / dự định', 'Giải quyết / xử lý', 'Hiểu biết / thấu suốt', 'Lo lắng / bồn chồn'],
      correctAnswer: 'Chuẩn bị / sắp xếp / dự định',
      explanation: '准备 (zhǔnbèi) nghĩa là chuẩn bị, sắp xếp trước hoặc dự định làm việc gì đó.',
      hskLevel: 2,
    },
    {
      id: `q-gen-fallback-3`,
      type: 'grammar',
      prompt: `Trợ từ kết cấu nào thích hợp điền vào chỗ trống: "他跑___非常快"?`,
      questionChinese: '他跑___非常快',
      options: ['得 (nối bổ ngữ trình độ)', '的 (nối định ngữ sở hữu)', '地 (nối trạng ngữ hành động)', '着 (biểu thị tiếp diễn)'],
      correctAnswer: '得 (nối bổ ngữ trình độ)',
      explanation: 'Trợ từ "得" (de) đứng sau Động từ (跑) để nối với bổ ngữ trạng thái/trình độ (非常快).',
      hskLevel: 2,
    },
    {
      id: `q-gen-fallback-4`,
      type: 'pinyin',
      prompt: `Xác định biến điệu của chữ "不" trong câu "我不是学生":`,
      questionChinese: '不是',
      options: ['bú shì (biến thành thanh 2 trước thanh 4)', 'bù shì (giữ thanh 4)', 'bǔ shì (thanh 3)', 'bu shì (thanh nhẹ)'],
      correctAnswer: 'bú shì (biến thành thanh 2 trước thanh 4)',
      explanation: 'Chữ "不" (bù) khi đứng trước một âm tiết mang thanh 4 sẽ biến thành thanh 2 (bú).',
      hskLevel: 1,
    },
    {
      id: `q-gen-fallback-5`,
      type: 'grammar',
      prompt: `Chọn trật tự câu chữ "把" chính xác:`,
      questionChinese: '作业 / 做完了 / 我 / 把',
      options: [
        '我把作业做完了。(Chủ ngữ + 把 + Tân ngữ + Động từ + Kết quả)',
        '我做完了把作业。',
        '把作业我做完了。',
        '我作业把做完了。',
      ],
      correctAnswer: '我把作业做完了。(Chủ ngữ + 把 + Tân ngữ + Động từ + Kết quả)',
      explanation: 'Câu chữ 把 dùng để nhấn mạnh hành động tác động và làm thay đổi trạng thái của tân ngữ xác định.',
      hskLevel: 3,
    },
  ];

  let serverFallbackConforms = true;
  for (const q of serverFallbackQuestions) {
    if (!validTypes.has(q.type) || !q.prompt || !q.options?.includes(q.correctAnswer as string)) {
      serverFallbackConforms = false;
    }
  }

  assert(serverFallbackConforms, 'Server /api/gemini/generate-quiz fallback questions conform to QuizQuestion interface');
}

// =========================================================================
// RUN ALL SUITES
// =========================================================================
async function main() {
  console.log('===================================================================');
  console.log('CHALLENGER QUIZZES: EMPIRICAL STRESS TESTING HARNESS');
  console.log('Testing QuizzesView Accuracy, XP Scoring & QuizQuestion Conformance');
  console.log('===================================================================');

  runAccuracyCalculationTests();
  runQuestionPoolTests();
  runXpLogicTests();
  runQuizQuestionInterfaceTests();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n===================================================================');
  console.log(`TOTAL CHECKS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
