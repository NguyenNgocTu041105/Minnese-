/**
 * tests/adversarial_m3_pronunciation_flashcards.test.ts
 *
 * Adversarial Challenger Test Suite for Milestone 3 Gate 1
 * Targets:
 * - src/components/Coursebook/PronunciationFlashcardsModal.tsx
 * - src/utils/pronunciationEval.ts
 * - src/utils/shuffleUtils.ts
 *
 * Verifies:
 * 1. Multi-Alternative Speech Evaluation (maxAlternatives: 3, homophones, near-matches)
 * 2. FIFO Retry Queue Mechanics (N words, 100% fail, alternating errors, 1-word deck)
 * 3. Randomization R5 (non-mutating shuffle, permutation distribution)
 * 4. State Transitions & Lifecycle (Idle -> Listening -> Evaluating -> Correct/Incorrect)
 * 5. Adversarial Defect Reproduction (Desynchronization on incorrect flip & Session reset on shuffle toggle)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { WordItem, HSKLevel } from '../src/types';
import {
  evaluateSpeechPronunciation,
  EvalResult,
  normalizeChineseText,
  stripTones,
  sanitizePinyinForComparison,
} from '../src/utils/pronunciationEval';
import { shuffleArray } from '../src/utils/shuffleUtils';

// ============================================================================
// Mock Fixtures
// ============================================================================
const MOCK_DECK: WordItem[] = [
  {
    id: 'w1_nihao',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    vietnamese: 'xin chào',
    hskLevel: 1,
    hanViet: 'nhĩ hảo',
    partOfSpeech: 'greeting',
  },
  {
    id: 'w2_xiexie',
    hanzi: '谢谢',
    pinyin: 'xièxie',
    vietnamese: 'cảm ơn',
    hskLevel: 1,
    hanViet: 'tạ tạ',
    partOfSpeech: 'verb',
  },
  {
    id: 'w3_zaijian',
    hanzi: '再见',
    pinyin: 'zàijiàn',
    vietnamese: 'tạm biệt',
    hskLevel: 1,
    hanViet: 'tái kiến',
    partOfSpeech: 'phrase',
  },
  {
    id: 'w4_shi',
    hanzi: '是',
    pinyin: 'shì',
    vietnamese: 'là, vâng',
    hskLevel: 1,
    hanViet: 'thị',
    partOfSpeech: 'verb',
  },
  {
    id: 'w5_xuesheng',
    hanzi: '学生',
    pinyin: 'xuésheng',
    vietnamese: 'học sinh',
    hskLevel: 1,
    hanViet: 'học sinh',
    partOfSpeech: 'noun',
  },
];

describe('Milestone 3 Gate 1: Multi-Alternative Speech Evaluation Engine', () => {
  it('selects exact Hanzi (score 100) when alternative 0 is noise and alternative 1 is target', () => {
    const target = MOCK_DECK[1]; // 谢谢 (xièxie)
    const alternatives = ['斜斜', '谢谢', '写写'];

    let bestTranscript = alternatives[0];
    let bestResult: EvalResult | null = null;

    for (const alt of alternatives) {
      const ev = evaluateSpeechPronunciation(alt, target);
      if (!bestResult || ev.score > bestResult.score) {
        bestResult = ev;
        bestTranscript = alt;
      }
      if (ev.score === 100) break;
    }

    expect(bestTranscript).toBe('谢谢');
    expect(bestResult?.isCorrect).toBe(true);
    expect(bestResult?.score).toBe(100);
    expect(bestResult?.matchedBy).toBe('hanzi_exact');
  });

  it('selects homophone alternative (pinyin_exact, score 90) when speech recognizer transcribes a different character with identical pronunciation', () => {
    const target = MOCK_DECK[3]; // 是 (shì)
    // ASR returns: Alt 0: '四' (sì, tone mismatch), Alt 1: '事' (shì, exact homophone), Alt 2: '十' (shí, tone 2)
    const alternatives = ['四', '事', '十'];

    let bestTranscript = alternatives[0];
    let bestResult: EvalResult | null = null;

    for (const alt of alternatives) {
      const ev = evaluateSpeechPronunciation(alt, target);
      if (!bestResult || ev.score > bestResult.score) {
        bestResult = ev;
        bestTranscript = alt;
      }
      if (ev.score === 100) break;
    }

    expect(bestTranscript).toBe('事');
    expect(bestResult?.isCorrect).toBe(true);
    expect(bestResult?.score).toBe(90);
    expect(bestResult?.matchedBy).toBe('pinyin_exact');
  });

  it('selects tone-insensitive pinyin candidate (score 80) over complete mismatch (score 0)', () => {
    const target = MOCK_DECK[0]; // 你好 (nǐ hǎo)
    const alternatives = ['apple banana', 'ni hao', 'random string'];

    let bestTranscript = alternatives[0];
    let bestResult: EvalResult | null = null;

    for (const alt of alternatives) {
      const ev = evaluateSpeechPronunciation(alt, target);
      if (!bestResult || ev.score > bestResult.score) {
        bestResult = ev;
        bestTranscript = alt;
      }
      if (ev.score === 100) break;
    }

    expect(bestTranscript).toBe('ni hao');
    expect(bestResult?.isCorrect).toBe(true);
    expect(bestResult?.score).toBe(80);
    expect(bestResult?.matchedBy).toBe('pinyin_tone_insensitive');
  });

  it('correctly fails when all 3 alternatives are completely unrelated', () => {
    const target = MOCK_DECK[0]; // 你好
    const alternatives = ['苹果', '吃饭', '北京'];

    let bestTranscript = alternatives[0];
    let bestResult: EvalResult | null = null;

    for (const alt of alternatives) {
      const ev = evaluateSpeechPronunciation(alt, target);
      if (!bestResult || ev.score > bestResult.score) {
        bestResult = ev;
        bestTranscript = alt;
      }
      if (ev.score === 100) break;
    }

    expect(bestResult?.isCorrect).toBe(false);
    expect(bestResult?.score).toBe(0);
    expect(bestResult?.matchedBy).toBe('none');
  });

  it('short-circuits immediately upon encountering score 100 without iterating remaining alternatives', () => {
    const target = MOCK_DECK[0]; // 你好
    const alternatives = ['你好', '你好吗', '您好'];

    let iterations = 0;
    let bestResult: EvalResult | null = null;

    for (const alt of alternatives) {
      iterations++;
      const ev = evaluateSpeechPronunciation(alt, target);
      if (!bestResult || ev.score > bestResult.score) {
        bestResult = ev;
      }
      if (ev.score === 100) break;
    }

    expect(iterations).toBe(1); // Break on first alternative!
    expect(bestResult?.score).toBe(100);
  });

  it('handles conversational carrier phrase in alternative 2 when alternative 0 is noisy speech recognition artifact', () => {
    const target = MOCK_DECK[4]; // 学生 (xuésheng)
    const alternatives = ['哦', '嗯', '我是学生'];

    let bestTranscript = alternatives[0];
    let bestResult: EvalResult | null = null;

    for (const alt of alternatives) {
      const ev = evaluateSpeechPronunciation(alt, target);
      if (!bestResult || ev.score > bestResult.score) {
        bestResult = ev;
        bestTranscript = alt;
      }
      if (ev.score === 100) break;
    }

    expect(bestTranscript).toBe('我是学生');
    expect(bestResult?.isCorrect).toBe(true);
    expect(bestResult?.score).toBe(95);
    expect(bestResult?.matchedBy).toBe('hanzi_contains');
  });
});

describe('Milestone 3 Gate 1: FIFO Retry Queue Mechanics and Edge Cases', () => {
  it('maintains strict FIFO order across mixed correct and incorrect rounds for N=5 words', () => {
    const initialWords = [...MOCK_DECK];
    let queue: WordItem[] = [...initialWords];
    const completedWords: WordItem[] = [];

    const handleEvaluation = (isCorrect: boolean) => {
      if (queue.length === 0) return;
      if (isCorrect) {
        const finished = queue[0];
        completedWords.push(finished);
        queue = queue.slice(1);
      } else {
        const missed = queue[0];
        queue = [...queue.slice(1), missed];
      }
    };

    // Initial: [w1, w2, w3, w4, w5]
    expect(queue.map((w) => w.id)).toEqual([
      'w1_nihao',
      'w2_xiexie',
      'w3_zaijian',
      'w4_shi',
      'w5_xuesheng',
    ]);

    // 1. w1: Correct -> completed [w1], queue [w2, w3, w4, w5]
    handleEvaluation(true);
    expect(completedWords.map((w) => w.id)).toEqual(['w1_nihao']);
    expect(queue.map((w) => w.id)).toEqual(['w2_xiexie', 'w3_zaijian', 'w4_shi', 'w5_xuesheng']);

    // 2. w2: Incorrect -> queue [w3, w4, w5, w2]
    handleEvaluation(false);
    expect(queue.map((w) => w.id)).toEqual(['w3_zaijian', 'w4_shi', 'w5_xuesheng', 'w2_xiexie']);

    // 3. w3: Incorrect -> queue [w4, w5, w2, w3]
    handleEvaluation(false);
    expect(queue.map((w) => w.id)).toEqual(['w4_shi', 'w5_xuesheng', 'w2_xiexie', 'w3_zaijian']);

    // 4. w4: Correct -> completed [w1, w4], queue [w5, w2, w3]
    handleEvaluation(true);
    expect(completedWords.map((w) => w.id)).toEqual(['w1_nihao', 'w4_shi']);
    expect(queue.map((w) => w.id)).toEqual(['w5_xuesheng', 'w2_xiexie', 'w3_zaijian']);

    // 5. w5: Correct -> completed [w1, w4, w5], queue [w2, w3]
    handleEvaluation(true);
    expect(completedWords.map((w) => w.id)).toEqual(['w1_nihao', 'w4_shi', 'w5_xuesheng']);
    expect(queue.map((w) => w.id)).toEqual(['w2_xiexie', 'w3_zaijian']);

    // 6. w2 (second attempt): Correct -> completed [w1, w4, w5, w2], queue [w3]
    handleEvaluation(true);
    expect(completedWords.map((w) => w.id)).toEqual([
      'w1_nihao',
      'w4_shi',
      'w5_xuesheng',
      'w2_xiexie',
    ]);
    expect(queue.map((w) => w.id)).toEqual(['w3_zaijian']);

    // 7. w3 (second attempt): Correct -> completed all, queue empty
    handleEvaluation(true);
    expect(completedWords.length).toBe(5);
    expect(queue.length).toBe(0);

    const isSessionCompleted = initialWords.length > 0 && queue.length === 0;
    expect(isSessionCompleted).toBe(true);
  });

  it('edge case 1: 100% incorrect initial round preserves exact initial sequence after one full pass', () => {
    const initialWords = MOCK_DECK.slice(0, 3); // [w1, w2, w3]
    let queue = [...initialWords];
    const completedWords: WordItem[] = [];

    const handleEvaluation = (isCorrect: boolean) => {
      if (queue.length === 0) return;
      if (isCorrect) {
        completedWords.push(queue[0]);
        queue = queue.slice(1);
      } else {
        const missed = queue[0];
        queue = [...queue.slice(1), missed];
      }
    };

    // Round 1: Fail w1, fail w2, fail w3
    handleEvaluation(false); // w1 moved to tail: [w2, w3, w1]
    expect(queue.map((w) => w.id)).toEqual(['w2_xiexie', 'w3_zaijian', 'w1_nihao']);

    handleEvaluation(false); // w2 moved to tail: [w3, w1, w2]
    expect(queue.map((w) => w.id)).toEqual(['w3_zaijian', 'w1_nihao', 'w2_xiexie']);

    handleEvaluation(false); // w3 moved to tail: [w1, w2, w3]
    expect(queue.map((w) => w.id)).toEqual(['w1_nihao', 'w2_xiexie', 'w3_zaijian']);

    // After 100% failure in round 1, completed is 0 and queue order is strictly identical to initial
    expect(completedWords.length).toBe(0);
    expect(queue.map((w) => w.id)).toEqual(initialWords.map((w) => w.id));

    // Round 2: All 3 succeed
    handleEvaluation(true);
    handleEvaluation(true);
    handleEvaluation(true);

    expect(completedWords.length).toBe(3);
    expect(queue.length).toBe(0);
  });

  it('edge case 2: single-word deck repeatedly failing never drops word and only completes upon success', () => {
    const singleWordDeck = [MOCK_DECK[0]]; // [w1_nihao]
    let queue = [...singleWordDeck];
    let completedWords: WordItem[] = [];
    let attempts = 0;

    const handleEvaluation = (isCorrect: boolean) => {
      attempts++;
      if (queue.length === 0) return;
      if (isCorrect) {
        completedWords.push(queue[0]);
        queue = queue.slice(1);
      } else {
        const missed = queue[0];
        queue = [...queue.slice(1), missed];
      }
    };

    // 10 consecutive failures
    for (let i = 0; i < 10; i++) {
      handleEvaluation(false);
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe('w1_nihao');
      expect(completedWords.length).toBe(0);
      const isCompleted = singleWordDeck.length > 0 && queue.length === 0;
      expect(isCompleted).toBe(false);
    }

    // Success on 11th attempt
    handleEvaluation(true);
    expect(queue.length).toBe(0);
    expect(completedWords.length).toBe(1);
    expect(attempts).toBe(11);
    const isCompleted = singleWordDeck.length > 0 && queue.length === 0;
    expect(isCompleted).toBe(true);
  });

  it('manual skip behavior: skips current card to tail if queue > 1, but retains single card if queue === 1', () => {
    let queue = [MOCK_DECK[0], MOCK_DECK[1]]; // [w1, w2]

    const handleSkip = () => {
      if (queue.length <= 1) return;
      const skipped = queue[0];
      queue = [...queue.slice(1), skipped];
    };

    handleSkip();
    expect(queue.map((w) => w.id)).toEqual(['w2_xiexie', 'w1_nihao']);

    // Reduce to 1 item
    queue = [MOCK_DECK[0]];
    handleSkip();
    // Cannot skip single card out of queue
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe('w1_nihao');
  });
});

describe('Milestone 3 Gate 1: Card Randomization (R5)', () => {
  it('shuffleArray is non-mutating and returns a new array with identical elements', () => {
    const original = [...MOCK_DECK];
    const shuffled = shuffleArray(original);

    // Identity check: must be distinct array reference
    expect(shuffled).not.toBe(original);

    // Multiset equality: must contain exact same elements
    expect(shuffled.length).toBe(original.length);
    const originalIds = original.map((w) => w.id).sort();
    const shuffledIds = shuffled.map((w) => w.id).sort();
    expect(shuffledIds).toEqual(originalIds);

    // Original array must NOT be mutated
    expect(original.map((w) => w.id)).toEqual(MOCK_DECK.map((w) => w.id));
  });

  it('shuffleArray produces varied permutations across 100 runs without dropping elements', () => {
    const original = MOCK_DECK.map((w) => w.id);
    const seenPermutations = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const result = shuffleArray(MOCK_DECK);
      expect(result.length).toBe(5);
      seenPermutations.add(result.map((w) => w.id).join(','));
    }

    // Over 100 shuffles of 5 distinct items (120 possible permutations), we should see at least 30 unique orders
    expect(seenPermutations.size).toBeGreaterThanOrEqual(30);
  });

  it('shuffleArray handles 0-element and 1-element arrays safely', () => {
    expect(shuffleArray([])).toEqual([]);
    const single = [MOCK_DECK[0]];
    const shuffledSingle = shuffleArray(single);
    expect(shuffledSingle).toEqual(single);
    expect(shuffledSingle).not.toBe(single);
  });
});

describe('Milestone 3 Gate 1: State Transition Graph & Component Contract Inspection', () => {
  const componentPath = path.resolve(
    __dirname,
    '../src/components/Coursebook/PronunciationFlashcardsModal.tsx'
  );
  const content = fs.readFileSync(componentPath, 'utf-8');

  it('defines the 5 authoritative SpeechUIStatus states', () => {
    expect(content).toContain("export type SpeechUIStatus =");
    expect(content).toContain("'idle'");
    expect(content).toContain("'listening'");
    expect(content).toContain("'evaluating'");
    expect(content).toContain("'correct'");
    expect(content).toContain("'incorrect'");
  });

  it('configures Web Speech API recognition parameters correctly (lang: zh-CN, maxAlternatives: 3)', () => {
    expect(content).toContain("recognition.lang = 'zh-CN'");
    expect(content).toContain('recognition.interimResults = false');
    expect(content).toContain('recognition.maxAlternatives = 3');
  });

  it('implements cleanup on unmount and close: aborts recognition, clears timers, stops audio', () => {
    expect(content).toContain('recognitionRef.current.abort()');
    expect(content).toContain('clearTimeout(autoAdvanceTimerRef.current)');
    expect(content).toContain('clearTimeout(correctAdvanceTimerRef.current)');
    expect(content).toContain('stopChineseAudio()');
  });

  it('provides manual text input fallback form for unsupported speech browsers or mic permission rejection', () => {
    expect(content).toContain('showManualInput');
    expect(content).toContain('handleProcessSpeech(manualInputValue.trim())');
    expect(content).toContain('Chế độ giả lập micro');
  });
});

// ============================================================================
// ADVERSARIAL CHALLENGES & EMPIRICAL FAILURE MODE REPRODUCTION
// ============================================================================
describe('Milestone 3 Gate 1: Adversarial Failure Mode Reproduction', () => {
  const componentPath = path.resolve(
    __dirname,
    '../src/components/Coursebook/PronunciationFlashcardsModal.tsx'
  );
  const content = fs.readFileSync(componentPath, 'utf-8');

  /**
   * CHALLENGE 1: Demonstrator Card Desynchronization during Incorrect Flip
   *
   * R3 Requirement:
   * "If the pronunciation is incorrect, flip the card to demonstrate and play the correct pronunciation,
   * advance to the next card, and push the incorrect word to the end of the review queue so it repeats until answered correctly."
   *
   * In PronunciationFlashcardsModal.tsx lines 181-185:
   * setQueue((prevQueue) => [...prevQueue.slice(1), missed]) is invoked IMMEDIATELY at t=0 when pronunciation is incorrect.
   *
   * Because currentWord is defined as:
   * const currentWord: WordItem | null = queue.length > 0 ? queue[0] : null;
   *
   * When setQueue executes at t=0, currentWord IMMEDIATELY switches from Word1 to Word2.
   * Consequently, between t=0 and t=2600ms (during the error demonstration flip):
   * - Hanzi rendered: currentWord.hanzi -> WORD 2 (NOT Word 1!)
   * - Pinyin rendered: currentWord.pinyin -> WORD 2 (NOT Word 1!)
   * - Back Vietnamese rendered: currentWord.vietnamese -> WORD 2 (NOT Word 1!)
   * - Audio played: Word 1 audio (played before setQueue)
   *
   * RESULT: The user hears Word 1 audio while looking at the flipped card of Word 2!
   * The missed word Word 1 is NEVER shown on the flipped card!
   */
  it('CHALLENGE 1: verifies that setQueue is currently called outside autoAdvanceTimer on incorrect pronunciation', () => {
    // Find the incorrect branch in handleProcessSpeech
    const incorrectBranchStart = content.indexOf("setStatus('incorrect');");
    expect(incorrectBranchStart).toBeGreaterThan(0);

    const incorrectSection = content.slice(incorrectBranchStart, incorrectBranchStart + 800);

    // Verify setQueue is called BEFORE setTimeout
    const setQueueIndex = incorrectSection.indexOf('setQueue(');
    const setTimeoutIndex = incorrectSection.indexOf('setTimeout(');

    expect(setQueueIndex).toBeGreaterThan(0);
    expect(setTimeoutIndex).toBeGreaterThan(0);

    // Demonstrates defect: setQueue occurs BEFORE setTimeout instead of inside autoAdvanceTimer!
    expect(setQueueIndex).toBeLessThan(setTimeoutIndex);

    // Verify that inside setTimeout, setQueue is NOT called
    const insideTimeout = incorrectSection.slice(setTimeoutIndex, setTimeoutIndex + 300);
    expect(insideTimeout).not.toContain('setQueue(');
  });

  /**
   * CHALLENGE 2: Session Reset upon Shuffle Toggle
   *
   * In PronunciationFlashcardsModal.tsx:
   * Line 95: useEffect has dependencies `[isOpen, words, isRandomized]`.
   *
   * When the user clicks the "Xáo trộn" button during practice, handleToggleShuffle invokes:
   * setIsRandomized(nextRandomized);
   *
   * Because `isRandomized` changes, the initialization useEffect re-runs:
   * - setQueue(initialQueue) -> reloads ALL original words!
   * - setCompletedWords([]) -> WIPES ALL COMPLETED WORDS TO 0!
   * - setTotalAttempts(0) -> WIPES ATTEMPT STATS!
   *
   * If a learner has finished 8 of 10 words and toggles shuffle to mix the remaining 2 words,
   * all progress is destroyed and reset to 0/10!
   */
  it('CHALLENGE 2: verifies that isRandomized is present in the reset useEffect dependency array', () => {
    // Locate the reset useEffect
    const initEffectStart = content.indexOf('// Initialize or reset session when modal opens or words change');
    expect(initEffectStart).toBeGreaterThan(0);

    const initEffectEnd = content.indexOf('}, [', initEffectStart);
    const dependencyLine = content.slice(initEffectEnd, initEffectEnd + 60);

    // Demonstrates defect: isRandomized is in the reset effect dependency array
    expect(dependencyLine).toContain('isRandomized');

    // Inside this effect, setCompletedWords([]) wipes learner progress
    const effectBody = content.slice(initEffectStart, initEffectEnd);
    expect(effectBody).toContain('setCompletedWords([]);');
    expect(effectBody).toContain('setTotalAttempts(0);');
  });
});
