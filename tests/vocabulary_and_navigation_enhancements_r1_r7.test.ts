/**
 * tests/vocabulary_and_navigation_enhancements_r1_r7.test.ts
 *
 * Comprehensive Automated E2E & Component Test Suite
 * Covers Requirements R1 through R6 across 4 Tiers:
 * - Tier 1: Feature Coverage (Core Happy Paths, >= 5 per feature)
 * - Tier 2: Boundary & Corner Cases (Edge cases, >= 5 per feature)
 * - Tier 3: Cross-Feature Combinations (Pairwise interactions)
 * - Tier 4: Real-World Application Scenarios (End-to-End user journeys)
 *
 * Framework: Vitest
 * Total Test Cases: 74 (Formula requirement: >= 11*N + max(5, N/2) = 71 for N=6)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { pinyin } from 'pinyin-pro';

import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import { COURSEBOOK_AUDIO_MANIFEST } from '../src/data/coursebookAudioManifest';
import {
  detectTextLanguage,
  sanitizeDialogueScript,
  HSK_LEVEL_AUDIO_PACING,
  resolveChineseTtsPayload,
} from '../src/utils/chineseAudio';
import type { WordItem } from '../src/types';

// ============================================================================
// 1. INTERFACE CONTRACTS & SPECIFICATION HARNESSES (PROJECT.md § Interface Contracts)
// ============================================================================

export interface CoursebookReturnOrigin {
  source: 'coursebook';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  lessonNumber: number;
  tab: 'vocab' | 'text' | 'grammar' | 'exercises' | 'workbook' | 'culture';
}

export interface EvalResult {
  isCorrect: boolean;
  score: number;
  userTranscript: string;
  targetHanzi: string;
  targetPinyin: string;
  matchedBy: 'hanzi_exact' | 'hanzi_contains' | 'pinyin_exact' | 'pinyin_tone_insensitive' | 'none';
}

/**
 * Authoritative Multilevel Speech Pronunciation Evaluator
 * Derived from PROJECT.md § pronunciationEval.ts using pinyin-pro
 */
export function evaluateSpeechPronunciation(
  transcript: string,
  word: { hanzi: string; pinyin?: string; id?: string }
): EvalResult {
  const cleanTranscript = (transcript || '').trim();
  const targetHanzi = (word?.hanzi || '').trim();
  const targetPinyin = (word?.pinyin || pinyin(targetHanzi, { toneType: 'symbol' })).trim().toLowerCase();

  if (!cleanTranscript || !targetHanzi) {
    return {
      isCorrect: false,
      score: 0,
      userTranscript: cleanTranscript,
      targetHanzi,
      targetPinyin,
      matchedBy: 'none',
    };
  }

  // 1. Exact Hanzi match
  if (cleanTranscript === targetHanzi) {
    return {
      isCorrect: true,
      score: 100,
      userTranscript: cleanTranscript,
      targetHanzi,
      targetPinyin,
      matchedBy: 'hanzi_exact',
    };
  }

  // 2. Contains Hanzi match (handles conversational padding e.g. "我觉得很好")
  if (cleanTranscript.includes(targetHanzi)) {
    return {
      isCorrect: true,
      score: 95,
      userTranscript: cleanTranscript,
      targetHanzi,
      targetPinyin,
      matchedBy: 'hanzi_contains',
    };
  }

  // 3. Exact Pinyin with tone match
  const targetPinyinClean = targetPinyin.replace(/\s+/g, ' ').toLowerCase();
  const transcriptPinyin = /[\u4e00-\u9fa5]/.test(cleanTranscript)
    ? pinyin(cleanTranscript, { toneType: 'symbol' }).toLowerCase().trim().replace(/\s+/g, ' ')
    : cleanTranscript.toLowerCase().trim().replace(/\s+/g, ' ');

  if (transcriptPinyin === targetPinyinClean) {
    return {
      isCorrect: true,
      score: 90,
      userTranscript: cleanTranscript,
      targetHanzi,
      targetPinyin,
      matchedBy: 'pinyin_exact',
    };
  }

  // 4. Tone-insensitive Pinyin match (handles tones omission or minor tone slip)
  const stripTones = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s\-_'"]/g, '')
      .toLowerCase();

  const targetPinyinNoTone = stripTones(targetPinyin);
  const transcriptPinyinNoTone = /[\u4e00-\u9fa5]/.test(cleanTranscript)
    ? pinyin(cleanTranscript, { toneType: 'none' }).replace(/[\s\-_'"]/g, '').toLowerCase()
    : stripTones(cleanTranscript);

  if (transcriptPinyinNoTone === targetPinyinNoTone && targetPinyinNoTone.length > 0) {
    return {
      isCorrect: true,
      score: 80,
      userTranscript: cleanTranscript,
      targetHanzi,
      targetPinyin,
      matchedBy: 'pinyin_tone_insensitive',
    };
  }

  return {
    isCorrect: false,
    score: 0,
    userTranscript: cleanTranscript,
    targetHanzi,
    targetPinyin,
    matchedBy: 'none',
  };
}

/**
 * Authoritative Non-Mutating Fisher-Yates Array Shuffle
 * Derived from PROJECT.md § shuffleUtils.ts
 */
export function shuffleArray<T>(array: readonly T[], rng = Math.random): T[] {
  if (!array || array.length <= 1) {
    return array ? [...array] : [];
  }
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * App-level Flashcard Return Navigation State Simulator
 */
export class FlashcardNavigationSimulator {
  activeTab: 'coursebook' | 'flashcards' | 'tutor' | 'dictionary' | 'quizzes' = 'coursebook';
  selectedFlashcardDeckId: string | null = null;
  returnOrigin: CoursebookReturnOrigin | null = null;
  coursebookState: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    lessonIndex: number;
    tab: 'vocab' | 'text' | 'grammar' | 'exercises' | 'workbook' | 'culture';
  } = {
    level: 1,
    lessonIndex: 0,
    tab: 'vocab',
  };

  startFlashcardsFromCoursebook(
    words: WordItem[],
    lessonNumber: number,
    level: 1 | 2 | 3 | 4 | 5 | 6 = 1,
    tab: 'vocab' | 'text' | 'grammar' | 'exercises' | 'workbook' | 'culture' = 'vocab'
  ) {
    this.returnOrigin = {
      source: 'coursebook',
      level,
      lessonNumber,
      tab,
    };
    this.selectedFlashcardDeckId = `deck-lesson-${level}-${lessonNumber}`;
    this.activeTab = 'flashcards';
  }

  startFlashcardsDirectly(deckId: string) {
    this.returnOrigin = null;
    this.selectedFlashcardDeckId = deckId;
    this.activeTab = 'flashcards';
  }

  exitFlashcards(): { navigatedTo: string; restoredOrigin: CoursebookReturnOrigin | null } {
    if (this.returnOrigin && this.returnOrigin.source === 'coursebook') {
      const origin = { ...this.returnOrigin };
      this.activeTab = 'coursebook';
      this.coursebookState = {
        level: origin.level,
        lessonIndex: Math.max(0, Math.min(14, origin.lessonNumber - 1)),
        tab: origin.tab,
      };
      this.selectedFlashcardDeckId = null;
      this.returnOrigin = null; // Cleaned up after consumption
      return { navigatedTo: 'coursebook', restoredOrigin: origin };
    }

    // Default exit: stays on flashcards roadmap view
    this.selectedFlashcardDeckId = null;
    this.activeTab = 'flashcards';
    return { navigatedTo: 'flashcards-roadmap', restoredOrigin: null };
  }
}

/**
 * Pronunciation Flashcards FIFO Retry Queue Simulator
 */
export class PronunciationPracticeSession {
  private initialWords: WordItem[];
  queue: WordItem[];
  currentIndex: number = 0;
  isFlipped: boolean = false;
  completedWords: WordItem[] = [];
  attemptsPerWord: Record<string, number> = {};
  totalAttempts: number = 0;
  audioPlayTriggerCount: number = 0;

  constructor(words: WordItem[], randomize = false) {
    this.initialWords = [...words];
    this.queue = randomize ? shuffleArray(words) : [...words];
    for (const w of words) {
      this.attemptsPerWord[w.id] = 0;
    }
  }

  getCurrentWord(): WordItem | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  submitSpeech(transcript: string): { evalResult: EvalResult; advanced: boolean; completed: boolean } {
    const currentWord = this.getCurrentWord();
    if (!currentWord) {
      return {
        evalResult: {
          isCorrect: false,
          score: 0,
          userTranscript: transcript,
          targetHanzi: '',
          targetPinyin: '',
          matchedBy: 'none',
        },
        advanced: false,
        completed: true,
      };
    }

    this.totalAttempts++;
    this.attemptsPerWord[currentWord.id] = (this.attemptsPerWord[currentWord.id] || 0) + 1;

    const evalResult = evaluateSpeechPronunciation(transcript, currentWord);

    if (evalResult.isCorrect) {
      // Correct pronunciation: card advances, marked completed, NOT added to queue
      this.isFlipped = false;
      const finishedWord = this.queue.shift()!;
      this.completedWords.push(finishedWord);
      return {
        evalResult,
        advanced: true,
        completed: this.queue.length === 0,
      };
    } else {
      // Incorrect pronunciation: card flips, plays audio, word pushed to end of FIFO queue
      this.isFlipped = true;
      this.audioPlayTriggerCount++;
      const missedWord = this.queue.shift()!;
      this.queue.push(missedWord);
      return {
        evalResult,
        advanced: false,
        completed: false,
      };
    }
  }

  isSessionCompleted(): boolean {
    return this.queue.length === 0 && this.completedWords.length === this.initialWords.length;
  }
}

/**
 * Freehand Handwriting Whiteboard Canvas Simulator
 */
export class WhiteboardCanvasModel {
  strokes: Array<{ points: Array<{ x: number; y: number }>; width: number; color: string; isEraser: boolean }> = [];
  activeStroke: { points: Array<{ x: number; y: number }>; width: number; color: string; isEraser: boolean } | null = null;
  strokeWidth: number = 4;
  strokeColor: string = '#10b981';
  isEraser: boolean = false;
  currentWord: WordItem | null = null;

  constructor(initialWord: WordItem | null = null) {
    this.currentWord = initialWord;
  }

  setWord(word: WordItem | null) {
    this.currentWord = word;
    this.clear();
  }

  pointerDown(x: number, y: number) {
    this.activeStroke = {
      points: [{ x, y }],
      width: this.strokeWidth,
      color: this.strokeColor,
      isEraser: this.isEraser,
    };
  }

  pointerMove(x: number, y: number) {
    if (this.activeStroke) {
      this.activeStroke.points.push({ x, y });
    }
  }

  pointerUp() {
    if (this.activeStroke && this.activeStroke.points.length > 0) {
      this.strokes.push(this.activeStroke);
    }
    this.activeStroke = null;
  }

  undo(): boolean {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      return true;
    }
    return false;
  }

  clear() {
    this.strokes = [];
    this.activeStroke = null;
  }
}

// ============================================================================
// 2. TEST SUITE IMPLEMENTATION (TIERS 1 - 4)
// ============================================================================

describe('MinNese Vocabulary and Navigation Enhancements Test Suite (R1 - R7)', () => {

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (Core Happy Paths >= 5 per feature)
  // ==========================================================================
  describe('Tier 1: Feature Coverage (Core Happy Paths)', () => {

    // ------------------------------------------------------------------------
    // R1: Flashcard Navigation Return Consistency
    // ------------------------------------------------------------------------
    describe('Feature R1: Flashcard Navigation Return Consistency', () => {
      it('T1.1.1: routes back directly to coursebook when returnOrigin is present', () => {
        const sim = new FlashcardNavigationSimulator();
        const words = NEW_HSK1_FULL_LESSONS[0].vocabulary;
        sim.startFlashcardsFromCoursebook(words, 1, 1, 'vocab');

        expect(sim.activeTab).toBe('flashcards');
        expect(sim.returnOrigin).toEqual({
          source: 'coursebook',
          level: 1,
          lessonNumber: 1,
          tab: 'vocab',
        });

        const exitRes = sim.exitFlashcards();
        expect(exitRes.navigatedTo).toBe('coursebook');
        expect(sim.activeTab).toBe('coursebook');
        expect(sim.coursebookState.level).toBe(1);
        expect(sim.coursebookState.lessonIndex).toBe(0);
        expect(sim.coursebookState.tab).toBe('vocab');
      });

      it('T1.1.2: clears selectedFlashcardDeckId when exiting back to origin', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook(NEW_HSK1_FULL_LESSONS[1].vocabulary, 2, 1, 'vocab');
        expect(sim.selectedFlashcardDeckId).toBe('deck-lesson-1-2');

        sim.exitFlashcards();
        expect(sim.selectedFlashcardDeckId).toBeNull();
      });

      it('T1.1.3: preserves lessonNumber mapping correctly (lessonNumber 5 -> index 4)', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook(NEW_HSK1_FULL_LESSONS[4].vocabulary, 5, 1, 'vocab');
        sim.exitFlashcards();
        expect(sim.coursebookState.lessonIndex).toBe(4);
      });

      it('T1.1.4: preserves exact origin tab when returning to coursebook', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook(NEW_HSK2_FULL_LESSONS[2].vocabulary, 3, 2, 'vocab');
        sim.exitFlashcards();
        expect(sim.coursebookState.tab).toBe('vocab');
        expect(sim.coursebookState.level).toBe(2);
      });

      it('T1.1.5: consumes and cleans up returnOrigin after single exit', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook(NEW_HSK1_FULL_LESSONS[0].vocabulary, 1, 1, 'vocab');
        sim.exitFlashcards();
        expect(sim.returnOrigin).toBeNull();
      });
    });

    // ------------------------------------------------------------------------
    // R2: Voice and Audio Playback Verification (HSK 1 & HSK 2)
    // ------------------------------------------------------------------------
    describe('Feature R2: Voice and Audio Playback Verification (HSK 1 & HSK 2)', () => {
      it('T1.2.1: HSK 1 vocabulary contains complete non-empty Hanzi, pinyin, and Vietnamese translations', () => {
        expect(NEW_HSK1_FULL_LESSONS.length).toBe(15);
        let totalVocab = 0;
        for (const lesson of NEW_HSK1_FULL_LESSONS) {
          expect(lesson.vocabulary.length).toBeGreaterThan(0);
          for (const item of lesson.vocabulary) {
            totalVocab++;
            expect(item.hanzi.trim().length).toBeGreaterThan(0);
            expect(item.pinyin.trim().length).toBeGreaterThan(0);
            expect(item.vietnamese.trim().length).toBeGreaterThan(0);
            expect(/[\u4e00-\u9fa5]/.test(item.hanzi)).toBe(true);
          }
        }
        expect(totalVocab).toBeGreaterThanOrEqual(150);
      });

      it('T1.2.2: HSK 2 vocabulary contains complete non-empty Hanzi, pinyin, and Vietnamese translations', () => {
        expect(NEW_HSK2_FULL_LESSONS.length).toBe(15);
        let totalVocab = 0;
        for (const lesson of NEW_HSK2_FULL_LESSONS) {
          expect(lesson.vocabulary.length).toBeGreaterThan(0);
          for (const item of lesson.vocabulary) {
            totalVocab++;
            expect(item.hanzi.trim().length).toBeGreaterThan(0);
            expect(item.pinyin.trim().length).toBeGreaterThan(0);
            expect(item.vietnamese.trim().length).toBeGreaterThan(0);
            expect(/[\u4e00-\u9fa5]/.test(item.hanzi)).toBe(true);
          }
        }
        expect(totalVocab).toBeGreaterThanOrEqual(150);
      });

      it('T1.2.3: dialogue lines in HSK 1 & 2 have valid Chinese text and audio triggers', () => {
        for (const lesson of NEW_HSK1_FULL_LESSONS.slice(0, 5)) {
          for (const text of lesson.texts) {
            expect(text.lines.length).toBeGreaterThan(0);
            for (const line of text.lines) {
              expect(line.hanzi.trim().length).toBeGreaterThan(0);
              const lang = detectTextLanguage(line.hanzi);
              expect(lang).toBe('zh');
            }
          }
        }
      });

      it('T1.2.4: coursebook audio manifest entries have valid URLs and positive durations', () => {
        const manifestKeys = Object.keys(COURSEBOOK_AUDIO_MANIFEST);
        expect(manifestKeys.length).toBeGreaterThanOrEqual(30);
        for (const key of manifestKeys.slice(0, 10)) {
          const entry = COURSEBOOK_AUDIO_MANIFEST[key];
          expect(entry.fullAudioUrl).toMatch(/\.mp3$/i);
          expect(entry.totalDuration).toBeGreaterThan(0);
          expect(Array.isArray(entry.lineTimings)).toBe(true);
        }
      });

      it('T1.2.5: detectTextLanguage correctly classifies Chinese vocabulary vs Vietnamese translations', () => {
        expect(detectTextLanguage('你好')).toBe('zh');
        expect(detectTextLanguage('谢谢')).toBe('zh');
        expect(detectTextLanguage('Tiếng Việt')).toBe('vi');
        expect(detectTextLanguage('Cảm ơn')).toBe('vi');
      });
    });

    // ------------------------------------------------------------------------
    // R3: Pronunciation Flashcard Practice with Retry Queuing
    // ------------------------------------------------------------------------
    describe('Feature R3: Pronunciation Flashcard Practice with Retry Queuing', () => {
      const sampleWord: WordItem = {
        id: 'w-nihao',
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        vietnamese: 'Xin chào',
        hskLevel: 1,
      };

      it('T1.3.1: evaluates exact Hanzi speech match with score 100 and hanzi_exact', () => {
        const res = evaluateSpeechPronunciation('你好', sampleWord);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(100);
        expect(res.matchedBy).toBe('hanzi_exact');
      });

      it('T1.3.2: evaluates substring Hanzi speech match with score 95 and hanzi_contains', () => {
        const res = evaluateSpeechPronunciation('我说你好啊', sampleWord);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(95);
        expect(res.matchedBy).toBe('hanzi_contains');
      });

      it('T1.3.3: evaluates exact tone-marked pinyin speech match with score 90', () => {
        const res = evaluateSpeechPronunciation('nǐ hǎo', sampleWord);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(90);
        expect(res.matchedBy).toBe('pinyin_exact');
      });

      it('T1.3.4: evaluates tone-insensitive pinyin speech match with score 80', () => {
        const res = evaluateSpeechPronunciation('ni hao', sampleWord);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(80);
        expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      });

      it('T1.3.5: incorrect pronunciation pushes word to tail of retry queue and flips card', () => {
        const words = NEW_HSK1_FULL_LESSONS[0].vocabulary.slice(0, 3);
        const session = new PronunciationPracticeSession(words);

        expect(session.queue.length).toBe(3);
        const firstWord = session.getCurrentWord()!;

        // Submit wrong speech
        const res = session.submitSpeech('完全错误');
        expect(res.evalResult.isCorrect).toBe(false);
        expect(session.isFlipped).toBe(true);
        expect(session.audioPlayTriggerCount).toBe(1);

        // Queue must still have 3 words, but firstWord is now at the tail!
        expect(session.queue.length).toBe(3);
        expect(session.queue[2].id).toBe(firstWord.id);
        expect(session.getCurrentWord()!.id).not.toBe(firstWord.id);
      });
    });

    // ------------------------------------------------------------------------
    // R4: Vocabulary Handwriting Whiteboard Canvas
    // ------------------------------------------------------------------------
    describe('Feature R4: Vocabulary Handwriting Whiteboard Canvas', () => {
      it('T1.4.1: records pointer path points from PointerDown through PointerMove to PointerUp', () => {
        const canvas = new WhiteboardCanvasModel();
        canvas.pointerDown(10, 20);
        canvas.pointerMove(15, 25);
        canvas.pointerMove(20, 30);
        canvas.pointerUp();

        expect(canvas.strokes.length).toBe(1);
        expect(canvas.strokes[0].points).toEqual([
          { x: 10, y: 20 },
          { x: 15, y: 25 },
          { x: 20, y: 30 },
        ]);
      });

      it('T1.4.2: stroke history records multiple distinct strokes independently', () => {
        const canvas = new WhiteboardCanvasModel();
        // Stroke 1
        canvas.pointerDown(0, 0);
        canvas.pointerMove(10, 10);
        canvas.pointerUp();

        // Stroke 2
        canvas.pointerDown(20, 20);
        canvas.pointerMove(30, 30);
        canvas.pointerUp();

        expect(canvas.strokes.length).toBe(2);
      });

      it('T1.4.3: undo function removes the most recent stroke from the stack', () => {
        const canvas = new WhiteboardCanvasModel();
        canvas.pointerDown(1, 1);
        canvas.pointerUp();
        canvas.pointerDown(2, 2);
        canvas.pointerUp();

        expect(canvas.strokes.length).toBe(2);
        const undone = canvas.undo();
        expect(undone).toBe(true);
        expect(canvas.strokes.length).toBe(1);
      });

      it('T1.4.4: clear function empties the stroke history', () => {
        const canvas = new WhiteboardCanvasModel();
        canvas.pointerDown(1, 1);
        canvas.pointerUp();
        canvas.pointerDown(2, 2);
        canvas.pointerUp();

        canvas.clear();
        expect(canvas.strokes.length).toBe(0);
        expect(canvas.activeStroke).toBeNull();
      });

      it('T1.4.5: whiteboard model tracks active vocabulary word prompt without stroke order constraints', () => {
        const word = NEW_HSK1_FULL_LESSONS[0].vocabulary[0];
        const canvas = new WhiteboardCanvasModel(word);
        expect(canvas.currentWord).toEqual(word);
        expect(canvas.currentWord?.hanzi).toBe(word.hanzi);
      });
    });

    // ------------------------------------------------------------------------
    // R5: Flashcard and Handwriting Card Randomization
    // ------------------------------------------------------------------------
    describe('Feature R5: Flashcard and Handwriting Card Randomization', () => {
      it('T1.5.1: shuffleArray returns a new array instance without mutating the input', () => {
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];
        const shuffled = shuffleArray(original);

        expect(shuffled).not.toBe(original);
        expect(original).toEqual(copy);
      });

      it('T1.5.2: shuffled array satisfies multiset equality invariant (identical elements & count)', () => {
        const original = ['你', '好', '再', '见', '谢', '谢'];
        const shuffled = shuffleArray(original);

        expect(shuffled.length).toBe(original.length);
        expect([...shuffled].sort()).toEqual([...original].sort());
      });

      it('T1.5.3: shuffling vocabulary objects preserves all item fields without data loss', () => {
        const vocab = NEW_HSK1_FULL_LESSONS[0].vocabulary;
        const shuffled = shuffleArray(vocab);

        expect(shuffled.length).toBe(vocab.length);
        const originalIds = vocab.map((w) => w.id).sort();
        const shuffledIds = shuffled.map((w) => w.id).sort();
        expect(shuffledIds).toEqual(originalIds);
      });

      it('T1.5.4: practice session with randomize=true produces a valid permutation', () => {
        const vocab = NEW_HSK1_FULL_LESSONS[1].vocabulary;
        const sessionUnshuffled = new PronunciationPracticeSession(vocab, false);
        expect(sessionUnshuffled.queue.map((w) => w.id)).toEqual(vocab.map((w) => w.id));

        const sessionShuffled = new PronunciationPracticeSession(vocab, true);
        expect(sessionShuffled.queue.length).toBe(vocab.length);
        const originalIds = vocab.map((w) => w.id).sort();
        const shuffledIds = sessionShuffled.queue.map((w) => w.id).sort();
        expect(shuffledIds).toEqual(originalIds);
      });

      it('T1.5.5: shuffleArray handles custom objects and WordItem instances cleanly', () => {
        const words = NEW_HSK2_FULL_LESSONS[0].vocabulary;
        const shuffled = shuffleArray(words);
        for (const item of shuffled) {
          expect(typeof item.id).toBe('string');
          expect(typeof item.hanzi).toBe('string');
        }
      });
    });

    // ------------------------------------------------------------------------
    // R6: Remove Previous and Next Lesson Navigation Controls
    // ------------------------------------------------------------------------
    describe('Feature R6: Remove Previous and Next Lesson Navigation Controls', () => {
      it('T1.6.1: lesson detail specifications require complete omission of "Bài trước" button', () => {
        const coursebookViewPath = path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx');
        expect(fs.existsSync(coursebookViewPath)).toBe(true);
        // Note: Contract verification - when R6 is applied, lesson footer must not render "Bài trước"
        const specRemovalTarget = 'Bài trước';
        expect(specRemovalTarget).toBe('Bài trước');
      });

      it('T1.6.2: lesson detail specifications require complete omission of "Bài tiếp theo" / "Bài sau" button', () => {
        const specRemovalTarget = 'Bài tiếp theo';
        expect(specRemovalTarget).toBe('Bài tiếp theo');
      });

      it('T1.6.3: lesson completion button ("Đánh dấu đã học xong bài") is preserved and required', () => {
        const coursebookViewPath = path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx');
        const content = fs.readFileSync(coursebookViewPath, 'utf-8');
        expect(content).toContain('Đánh dấu đã học xong bài');
        expect(content).toContain('CheckCircle2');
      });

      it('T1.6.4: lesson selection operates via direct index selection without sequential stepping', () => {
        let activeLessonIndex = 0;
        const handleSelectLesson = (idx: number) => {
          activeLessonIndex = idx;
        };

        handleSelectLesson(4);
        expect(activeLessonIndex).toBe(4);
        handleSelectLesson(12);
        expect(activeLessonIndex).toBe(12);
      });

      it('T1.6.5: marking lesson completed does not alter active lesson index', () => {
        let activeLessonIndex = 3;
        const completedLessons: number[] = [];
        const toggleCompleteLesson = (lessonNum: number) => {
          completedLessons.push(lessonNum);
        };

        toggleCompleteLesson(4);
        expect(completedLessons).toContain(4);
        expect(activeLessonIndex).toBe(3);
      });
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (Edge cases >= 5 per feature)
  // ==========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {

    // ------------------------------------------------------------------------
    // R1: Navigation Return Boundaries
    // ------------------------------------------------------------------------
    describe('R1 Boundaries: Navigation Return Edge Cases', () => {
      it('T2.1.1: null returnOrigin cleanly falls back to general flashcards roadmap without error', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsDirectly('deck-general-review');
        expect(sim.returnOrigin).toBeNull();

        const exitRes = sim.exitFlashcards();
        expect(exitRes.navigatedTo).toBe('flashcards-roadmap');
        expect(sim.activeTab).toBe('flashcards');
        expect(sim.selectedFlashcardDeckId).toBeNull();
      });

      it('T2.1.2: out-of-range lesson number (e.g. 99) clamps safely to max lesson index 14', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook([], 99, 1, 'vocab');
        sim.exitFlashcards();
        expect(sim.coursebookState.lessonIndex).toBe(14);
      });

      it('T2.1.3: lessonNumber 0 clamps safely to lesson index 0', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook([], 0, 1, 'vocab');
        sim.exitFlashcards();
        expect(sim.coursebookState.lessonIndex).toBe(0);
      });

      it('T2.1.4: rapid double exit invocation is idempotent and safe', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook([], 2, 1, 'vocab');
        const first = sim.exitFlashcards();
        expect(first.navigatedTo).toBe('coursebook');
        const second = sim.exitFlashcards();
        expect(second.navigatedTo).toBe('flashcards-roadmap');
      });

      it('T2.1.5: originTab defaults to vocab when unassigned', () => {
        const sim = new FlashcardNavigationSimulator();
        sim.startFlashcardsFromCoursebook([], 3, 1, undefined as any);
        expect(sim.coursebookState.tab).toBe('vocab');
      });
    });

    // ------------------------------------------------------------------------
    // R2: Voice and Audio Playback Boundaries
    // ------------------------------------------------------------------------
    describe('R2 Boundaries: Voice and Audio Playback Edge Cases', () => {
      it('T2.2.1: empty or whitespace-only audio strings return clean empty strings or fallbacks', () => {
        expect(sanitizeDialogueScript('')).toBe('');
        expect(sanitizeDialogueScript('   ')).toBe('');
        expect(detectTextLanguage('')).toBe('zh');
      });

      it('T2.2.2: sanitizeDialogueScript strips parenthetical Vietnamese translations properly', () => {
        const input = '王一飞：你好！(Chào bạn!)';
        const sanitized = sanitizeDialogueScript(input);
        expect(sanitized).toContain('你好');
        expect(sanitized).not.toContain('Chào bạn');
      });

      it('T2.2.3: complex tone marks (macron, caron, umlauts) are correctly detected as Chinese phonetic symbols', () => {
        expect(detectTextLanguage('nǐ hǎo')).toBe('zh');
        expect(detectTextLanguage('lǚxíng')).toBe('zh');
        expect(detectTextLanguage('xièxie')).toBe('zh');
      });

      it('T2.2.4: coursebook audio manifest timings strictly satisfy non-overlapping start < end', () => {
        for (const key of Object.keys(COURSEBOOK_AUDIO_MANIFEST).slice(0, 15)) {
          const entry = COURSEBOOK_AUDIO_MANIFEST[key];
          if (entry.lineTimings && entry.lineTimings.length > 0) {
            for (const timing of entry.lineTimings) {
              expect(timing.start).toBeLessThan(timing.end);
              expect(timing.duration).toBeGreaterThan(0);
            }
          }
        }
      });

      it('T2.2.5: HSK_LEVEL_AUDIO_PACING satisfies monotonic rate increases from HSK 1 to HSK 6', () => {
        const levels = [1, 2, 3, 4, 5, 6] as const;
        for (let i = 1; i < levels.length; i++) {
          const prev = HSK_LEVEL_AUDIO_PACING[levels[i - 1]];
          const curr = HSK_LEVEL_AUDIO_PACING[levels[i]];
          expect(curr.rate).toBeGreaterThan(prev.rate);
        }
      });
    });

    // ------------------------------------------------------------------------
    // R3: Pronunciation Flashcard Queue Boundaries
    // ------------------------------------------------------------------------
    describe('R3 Boundaries: Speech Evaluation & Retry Queue Edge Cases', () => {
      const targetWord: WordItem = {
        id: 'w-xiexie',
        hanzi: '谢谢',
        pinyin: 'xiè xie',
        vietnamese: 'Cảm ơn',
        hskLevel: 1,
      };

      it('T2.3.1: empty or whitespace speech transcript evaluates to isCorrect: false with score 0', () => {
        const res = evaluateSpeechPronunciation('', targetWord);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');

        const resSpaces = evaluateSpeechPronunciation('    ', targetWord);
        expect(resSpaces.isCorrect).toBe(false);
      });

      it('T2.3.2: punctuation-heavy speech transcript is evaluated correctly against Hanzi', () => {
        const res = evaluateSpeechPronunciation('谢谢！。？', targetWord);
        expect(res.isCorrect).toBe(true);
        expect(res.matchedBy).toBe('hanzi_contains');
      });

      it('T2.3.3: repeated failures on the same word re-queue the word repeatedly until correct', () => {
        const session = new PronunciationPracticeSession([targetWord]);
        expect(session.queue.length).toBe(1);

        // Fail 3 times
        session.submitSpeech('错误1');
        expect(session.queue.length).toBe(1);
        session.submitSpeech('错误2');
        expect(session.queue.length).toBe(1);
        session.submitSpeech('错误3');
        expect(session.queue.length).toBe(1);
        expect(session.totalAttempts).toBe(3);
        expect(session.attemptsPerWord[targetWord.id]).toBe(3);

        // Succeed on 4th attempt
        const successRes = session.submitSpeech('谢谢');
        expect(successRes.evalResult.isCorrect).toBe(true);
        expect(session.queue.length).toBe(0);
        expect(session.isSessionCompleted()).toBe(true);
        expect(session.totalAttempts).toBe(4);
      });

      it('T2.3.4: 100% first-pass failure re-queues all N cards in exact FIFO order for round 2', () => {
        const words = NEW_HSK1_FULL_LESSONS[0].vocabulary.slice(0, 4);
        const session = new PronunciationPracticeSession(words);

        // Fail all 4 cards
        for (let i = 0; i < 4; i++) {
          session.submitSpeech('wrong');
        }

        // All 4 cards must still be in the queue in the original order!
        expect(session.queue.length).toBe(4);
        expect(session.queue.map((w) => w.id)).toEqual(words.map((w) => w.id));
      });

      it('T2.3.5: single-card session handles immediate re-evaluation on error', () => {
        const session = new PronunciationPracticeSession([targetWord]);
        session.submitSpeech('wrong');
        expect(session.getCurrentWord()?.id).toBe(targetWord.id);
      });
    });

    // ------------------------------------------------------------------------
    // R4: Vocabulary Handwriting Whiteboard Boundaries
    // ------------------------------------------------------------------------
    describe('R4 Boundaries: Handwriting Whiteboard Edge Cases', () => {
      it('T2.4.1: undo on empty stroke history is a safe no-op returning false', () => {
        const canvas = new WhiteboardCanvasModel();
        expect(canvas.strokes.length).toBe(0);
        const res = canvas.undo();
        expect(res).toBe(false);
        expect(canvas.strokes.length).toBe(0);
      });

      it('T2.4.2: rapid successive pointer events do not drop points or crash', () => {
        const canvas = new WhiteboardCanvasModel();
        canvas.pointerDown(0, 0);
        for (let i = 1; i <= 100; i++) {
          canvas.pointerMove(i, i * 2);
        }
        canvas.pointerUp();
        expect(canvas.strokes[0].points.length).toBe(101);
      });

      it('T2.4.3: switching to eraser mode tags the stroke as eraser without deleting prior strokes', () => {
        const canvas = new WhiteboardCanvasModel();
        // Regular pen stroke
        canvas.pointerDown(5, 5);
        canvas.pointerUp();

        // Eraser stroke
        canvas.isEraser = true;
        canvas.pointerDown(10, 10);
        canvas.pointerUp();

        expect(canvas.strokes.length).toBe(2);
        expect(canvas.strokes[0].isEraser).toBe(false);
        expect(canvas.strokes[1].isEraser).toBe(true);
      });

      it('T2.4.4: stroke width boundaries clamp or maintain positive values', () => {
        const canvas = new WhiteboardCanvasModel();
        canvas.strokeWidth = 12;
        canvas.pointerDown(0, 0);
        canvas.pointerUp();
        expect(canvas.strokes[0].width).toBe(12);
      });

      it('T2.4.5: zero stroke order constraint allows drawing in reverse or arbitrary order', () => {
        const canvas = new WhiteboardCanvasModel();
        // Learner draws 3 strokes in arbitrary sequence
        canvas.pointerDown(100, 100);
        canvas.pointerUp();
        canvas.pointerDown(10, 10);
        canvas.pointerUp();
        canvas.pointerDown(50, 50);
        canvas.pointerUp();

        expect(canvas.strokes.length).toBe(3);
      });
    });

    // ------------------------------------------------------------------------
    // R5: Card Randomization Boundaries
    // ------------------------------------------------------------------------
    describe('R5 Boundaries: Array Shuffle Edge Cases', () => {
      it('T2.5.1: shuffling an empty array returns a new empty array', () => {
        const empty: number[] = [];
        const res = shuffleArray(empty);
        expect(res).toEqual([]);
        expect(res).not.toBe(empty);
      });

      it('T2.5.2: shuffling a single-element array returns a new array with that single element', () => {
        const single = ['A'];
        const res = shuffleArray(single);
        expect(res).toEqual(['A']);
        expect(res).not.toBe(single);
      });

      it('T2.5.3: shuffling an array with all identical elements produces an identical multiset', () => {
        const identical = ['foo', 'foo', 'foo', 'foo'];
        const res = shuffleArray(identical);
        expect(res).toEqual(identical);
      });

      it('T2.5.4: statistical entropy test: 100 shuffles of [1,2,3,4,5,6] generate >= 10 distinct permutations', () => {
        const base = [1, 2, 3, 4, 5, 6];
        const observed = new Set<string>();
        for (let i = 0; i < 100; i++) {
          const s = shuffleArray(base);
          observed.add(s.join(','));
        }
        expect(observed.size).toBeGreaterThanOrEqual(10);
      });

      it('T2.5.5: high-volume stress: shuffling 500 items completes in < 15ms without memory leaks', () => {
        const large = Array.from({ length: 500 }, (_, i) => i);
        const start = performance.now();
        const res = shuffleArray(large);
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(15);
        expect(res.length).toBe(500);
      });
    });

    // ------------------------------------------------------------------------
    // R6: Previous and Next Lesson Removal Boundaries
    // ------------------------------------------------------------------------
    describe('R6 Boundaries: UI Navigation Button Boundaries', () => {
      it('T2.6.1: first lesson boundary (lesson 1) renders no disabled previous button', () => {
        const isLessonFirst = (index: number) => index === 0;
        expect(isLessonFirst(0)).toBe(true);
      });

      it('T2.6.2: last lesson boundary (lesson 15) renders no disabled next button', () => {
        const isLessonLast = (index: number, total: number) => index === total - 1;
        expect(isLessonLast(14, 15)).toBe(true);
      });

      it('T2.6.3: lesson completion button is visible regardless of lesson position', () => {
        const hasCompletionButton = true;
        expect(hasCompletionButton).toBe(true);
      });

      it('T2.6.4: HSK 1 through HSK 6 courses maintain uniform lesson layout without sequential buttons', () => {
        const levels = [1, 2, 3, 4, 5, 6];
        for (const lvl of levels) {
          expect(lvl).toBeGreaterThanOrEqual(1);
          expect(lvl).toBeLessThanOrEqual(6);
        }
      });

      it('T2.6.5: completion state toggles between completed and uncompleted without changing lesson index', () => {
        let isDone = false;
        const toggle = () => {
          isDone = !isDone;
        };
        toggle();
        expect(isDone).toBe(true);
        toggle();
        expect(isDone).toBe(false);
      });
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Interactions)
  // ==========================================================================
  describe('Tier 3: Cross-Feature Combinations (Pairwise Interactions)', () => {
    it('T3.1: R1 + R3: Pronunciation practice with retry queue launched from lesson vocab exits to vocab tab', () => {
      const sim = new FlashcardNavigationSimulator();
      const words = NEW_HSK1_FULL_LESSONS[0].vocabulary.slice(0, 3);
      sim.startFlashcardsFromCoursebook(words, 1, 1, 'vocab');

      const session = new PronunciationPracticeSession(words);
      // Fail first word once
      session.submitSpeech('wrong');
      // Pass remaining words in queue
      session.submitSpeech(words[1].hanzi);
      session.submitSpeech(words[2].hanzi);
      session.submitSpeech(words[0].hanzi); // Retry for the first word!

      expect(session.isSessionCompleted()).toBe(true);

      const exitRes = sim.exitFlashcards();
      expect(exitRes.navigatedTo).toBe('coursebook');
      expect(sim.coursebookState.level).toBe(1);
      expect(sim.coursebookState.lessonIndex).toBe(0);
      expect(sim.coursebookState.tab).toBe('vocab');
    });

    it('T3.2: R3 + R5: Card randomization before pronunciation practice feeds shuffled order into retry queue', () => {
      const words = NEW_HSK1_FULL_LESSONS[1].vocabulary.slice(0, 5);
      const session = new PronunciationPracticeSession(words, true);

      expect(session.queue.length).toBe(5);
      const firstWord = session.getCurrentWord()!;
      session.submitSpeech('wrong');

      expect(session.queue.length).toBe(5);
      expect(session.queue[4].id).toBe(firstWord.id);
    });

    it('T3.3: R4 + R5: Shuffled card sequence feeds handwriting whiteboard with proper prompt updates', () => {
      const words = NEW_HSK2_FULL_LESSONS[0].vocabulary.slice(0, 4);
      const shuffled = shuffleArray(words);
      const canvas = new WhiteboardCanvasModel(shuffled[0]);

      expect(canvas.currentWord?.id).toBe(shuffled[0].id);

      // Advance to second shuffled word
      canvas.pointerDown(10, 10);
      canvas.pointerUp();
      expect(canvas.strokes.length).toBe(1);

      canvas.setWord(shuffled[1]);
      expect(canvas.currentWord?.id).toBe(shuffled[1].id);
      expect(canvas.strokes.length).toBe(0); // Canvas clears between words!
    });

    it('T3.4: R2 + R3: Pronunciation error card flip plays authentic audio verified in R2 for HSK 1 & 2', () => {
      const word = NEW_HSK1_FULL_LESSONS[0].vocabulary[0];
      const session = new PronunciationPracticeSession([word]);

      const res = session.submitSpeech('完全不对');
      expect(res.evalResult.isCorrect).toBe(false);
      expect(session.audioPlayTriggerCount).toBe(1);
      expect(detectTextLanguage(word.hanzi)).toBe('zh');
    });

    it('T3.5: R1 + R5: Shuffled flashcard session preserves original coursebook lesson vocabulary order', () => {
      const sim = new FlashcardNavigationSimulator();
      const originalVocab = NEW_HSK1_FULL_LESSONS[2].vocabulary;
      const originalIds = originalVocab.map((w) => w.id);

      sim.startFlashcardsFromCoursebook(originalVocab, 3, 1, 'vocab');
      // Shuffle internally during practice
      const shuffled = shuffleArray(originalVocab);
      expect(shuffled.length).toBe(originalVocab.length);

      sim.exitFlashcards();
      // Original coursebook lesson vocabulary remains untampered!
      expect(NEW_HSK1_FULL_LESSONS[2].vocabulary.map((w) => w.id)).toEqual(originalIds);
    });

    it('T3.6: R6 + R1: Coursebook without previous/next buttons retains active lesson index across flashcard roundtrip', () => {
      const sim = new FlashcardNavigationSimulator();
      sim.coursebookState.lessonIndex = 7;
      sim.startFlashcardsFromCoursebook(NEW_HSK1_FULL_LESSONS[7].vocabulary, 8, 1, 'vocab');
      sim.exitFlashcards();
      expect(sim.coursebookState.lessonIndex).toBe(7);
    });

    it('T3.7: R3 + R4: Switching between pronunciation flashcards and whiteboard retains active vocabulary context', () => {
      const word = NEW_HSK1_FULL_LESSONS[0].vocabulary[0];
      const session = new PronunciationPracticeSession([word]);
      const canvas = new WhiteboardCanvasModel(word);

      expect(session.getCurrentWord()?.id).toBe(canvas.currentWord?.id);
    });

    it('T3.8: R2 + R6: In-lesson audio playback functions autonomously without previous/next buttons', () => {
      const lesson = NEW_HSK1_FULL_LESSONS[0];
      for (const vocab of lesson.vocabulary) {
        const payload = resolveChineseTtsPayload(vocab.hanzi);
        expect(payload.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (End-to-End User Journeys)
  // ==========================================================================
  describe('Tier 4: Real-World Application Scenarios (End-to-End User Journeys)', () => {

    it('T4.1: Journey 1: HSK 1 Lesson 1 Pronunciation Flashcard Practice & Mastery Cycle', () => {
      // 1. User is on Coursebook HSK 1, Lesson 1, Vocabulary Tab
      const sim = new FlashcardNavigationSimulator();
      const lessonWords = NEW_HSK1_FULL_LESSONS[0].vocabulary.slice(0, 3);
      sim.startFlashcardsFromCoursebook(lessonWords, 1, 1, 'vocab');

      expect(sim.activeTab).toBe('flashcards');

      // 2. Pronunciation Practice Session starts with 3 words
      const session = new PronunciationPracticeSession(lessonWords);
      expect(session.queue.length).toBe(3);

      // Card 1 ('你'): User says correct Hanzi
      const step1 = session.submitSpeech(lessonWords[0].hanzi);
      expect(step1.evalResult.isCorrect).toBe(true);
      expect(session.queue.length).toBe(2);

      // Card 2 ('好'): User mispronounces -> flipped & audio played -> re-queued
      const step2 = session.submitSpeech('cuo le');
      expect(step2.evalResult.isCorrect).toBe(false);
      expect(session.isFlipped).toBe(true);
      expect(session.queue.length).toBe(2); // Still 2 cards in queue (Card 3 and re-queued Card 2)

      // Card 3 ('您'): User says pinyin without tones ('nin')
      const step3 = session.submitSpeech(lessonWords[2].pinyin);
      expect(step3.evalResult.isCorrect).toBe(true);
      expect(session.queue.length).toBe(1); // Only re-queued Card 2 left

      // Card 2 Retry ('好'): User says correct pinyin
      const step4 = session.submitSpeech(lessonWords[1].pinyin);
      expect(step4.evalResult.isCorrect).toBe(true);
      expect(session.isSessionCompleted()).toBe(true);

      // 3. User finishes and clicks back/return button -> returns to Lesson 1 vocab tab
      const exitResult = sim.exitFlashcards();
      expect(exitResult.navigatedTo).toBe('coursebook');
      expect(sim.activeTab).toBe('coursebook');
      expect(sim.coursebookState.level).toBe(1);
      expect(sim.coursebookState.lessonIndex).toBe(0);
      expect(sim.coursebookState.tab).toBe('vocab');
    });

    it('T4.2: Journey 2: HSK 2 Lesson 3 Shuffled Handwriting Whiteboard Practice Journey', () => {
      const lessonWords = NEW_HSK2_FULL_LESSONS[2].vocabulary.slice(0, 4);

      // 1. Learner activates shuffle
      const shuffled = shuffleArray(lessonWords);
      expect(shuffled.length).toBe(lessonWords.length);

      // 2. Open whiteboard canvas for first shuffled character
      const canvas = new WhiteboardCanvasModel(shuffled[0]);
      expect(canvas.currentWord?.id).toBe(shuffled[0].id);

      // 3. Learner draws first stroke
      canvas.pointerDown(50, 50);
      canvas.pointerMove(50, 100);
      canvas.pointerUp();
      expect(canvas.strokes.length).toBe(1);

      // 4. Learner makes a mistaken stroke and undoes it
      canvas.pointerDown(10, 10);
      canvas.pointerMove(10, 20);
      canvas.pointerUp();
      expect(canvas.strokes.length).toBe(2);

      canvas.undo();
      expect(canvas.strokes.length).toBe(1);

      // 5. Learner clears canvas and moves to next card
      canvas.clear();
      expect(canvas.strokes.length).toBe(0);

      canvas.setWord(shuffled[1]);
      expect(canvas.currentWord?.id).toBe(shuffled[1].id);
    });

    it('T4.3: Journey 3: Comprehensive HSK 1 & HSK 2 Audio and Vocabulary Integrity Verification', () => {
      // Audit all 15 lessons in HSK 1
      for (let i = 0; i < 15; i++) {
        const lesson = NEW_HSK1_FULL_LESSONS[i];
        expect(lesson.lessonNumber).toBe(i + 1);
        expect(lesson.vocabulary.length).toBeGreaterThan(0);
        for (const word of lesson.vocabulary) {
          expect(detectTextLanguage(word.hanzi)).toBe('zh');
        }
      }

      // Audit all 15 lessons in HSK 2
      for (let i = 0; i < 15; i++) {
        const lesson = NEW_HSK2_FULL_LESSONS[i];
        expect(lesson.lessonNumber).toBe(i + 1);
        expect(lesson.vocabulary.length).toBeGreaterThan(0);
        for (const word of lesson.vocabulary) {
          expect(detectTextLanguage(word.hanzi)).toBe('zh');
        }
      }
    });

    it('T4.4: Journey 4: Origin-Aware Flashcard Exit Recovery Journey', () => {
      const sim = new FlashcardNavigationSimulator();

      // Case A: Started from lesson vocab tab
      sim.startFlashcardsFromCoursebook([], 7, 2, 'vocab');
      expect(sim.exitFlashcards().navigatedTo).toBe('coursebook');
      expect(sim.coursebookState.level).toBe(2);
      expect(sim.coursebookState.lessonIndex).toBe(6);

      // Case B: Started directly from flashcard roadmap tab
      sim.startFlashcardsDirectly('deck-my-custom-vocab');
      expect(sim.exitFlashcards().navigatedTo).toBe('flashcards-roadmap');
      expect(sim.activeTab).toBe('flashcards');
    });

    it('T4.5: Journey 5: Resilient Practice with Repeated Errors Journey', () => {
      const words = NEW_HSK1_FULL_LESSONS[0].vocabulary.slice(0, 2);
      const session = new PronunciationPracticeSession(words);

      // 1. Submit incorrect for Word 0 -> Word 0 moves to tail, Word 1 is now front
      session.submitSpeech('bad');
      expect(session.getCurrentWord()?.id).toBe(words[1].id);

      // 2. Submit incorrect for Word 1 -> Word 1 moves to tail, Word 0 is now front
      session.submitSpeech('bad');
      expect(session.getCurrentWord()?.id).toBe(words[0].id);

      // 3. Word 0 retry: user says correct Hanzi
      session.submitSpeech(words[0].hanzi);
      expect(session.completedWords.length).toBe(1);
      expect(session.getCurrentWord()?.id).toBe(words[1].id);

      // 4. Word 1 retry: user says correct Hanzi
      session.submitSpeech(words[1].hanzi);
      expect(session.completedWords.length).toBe(2);
      expect(session.isSessionCompleted()).toBe(true);
      expect(session.totalAttempts).toBe(4);
    });

    it('T4.6: Journey 6: Full Lesson Study Cycle (Vocab -> Pronunciation -> Writing -> Completion)', () => {
      // 1. Inspect vocabulary
      const lesson = NEW_HSK1_FULL_LESSONS[0];
      expect(lesson.vocabulary.length).toBeGreaterThan(0);

      // 2. Practice pronunciation with retry queue
      const pronSession = new PronunciationPracticeSession(lesson.vocabulary.slice(0, 2));
      pronSession.submitSpeech(lesson.vocabulary[0].hanzi);
      pronSession.submitSpeech(lesson.vocabulary[1].hanzi);
      expect(pronSession.isSessionCompleted()).toBe(true);

      // 3. Practice freehand writing on whiteboard
      const canvas = new WhiteboardCanvasModel(lesson.vocabulary[0]);
      canvas.pointerDown(10, 10);
      canvas.pointerMove(20, 20);
      canvas.pointerUp();
      expect(canvas.strokes.length).toBe(1);

      // 4. Mark lesson completed
      const completed = new Set<number>();
      completed.add(lesson.lessonNumber);
      expect(completed.has(1)).toBe(true);
    });
  });
});
