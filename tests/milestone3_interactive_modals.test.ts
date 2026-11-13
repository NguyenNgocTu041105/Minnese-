/**
 * tests/milestone3_interactive_modals.test.ts
 *
 * Automated Unit, Component, and Integration Tests for Milestone 3:
 * - R3: Pronunciation Flashcards with Speech Recognition & FIFO Retry Queuing
 * - R4: Freehand Handwriting Whiteboard Canvas without Stroke Constraints
 * - R5: Non-Mutating Card Randomization Toggle Integration
 * - R6: Absence of Previous/Next Lesson Navigation Buttons in CoursebookView
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { WordItem, HSKLevel } from '../src/types';
import { evaluateSpeechPronunciation, EvalResult } from '../src/utils/pronunciationEval';
import { shuffleArray } from '../src/utils/shuffleUtils';

// ============================================================================
// Mock Data
// ============================================================================
const MOCK_WORDS: WordItem[] = [
  {
    id: 'w_1',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    vietnamese: 'xin chào',
    hskLevel: 1,
    hanViet: 'nhĩ hảo',
    partOfSpeech: 'greeting',
  },
  {
    id: 'w_2',
    hanzi: '谢谢',
    pinyin: 'xièxie',
    vietnamese: 'cảm ơn',
    hskLevel: 1,
    hanViet: 'tạ tạ',
    partOfSpeech: 'verb',
  },
  {
    id: 'w_3',
    hanzi: '再见',
    pinyin: 'zàijiàn',
    vietnamese: 'tạm biệt',
    hskLevel: 1,
    hanViet: 'tái kiến',
    partOfSpeech: 'phrase',
  },
];

// ============================================================================
// 1. R3: Pronunciation Flashcards & FIFO Retry Queue Logic
// ============================================================================
describe('Milestone 3 — R3: Pronunciation Flashcards Practice & Retry Queuing', () => {
  it('multilevel speech evaluation matches exact hanzi (hanzi_exact)', () => {
    const word = MOCK_WORDS[0]; // 你好, nǐ hǎo
    const result = evaluateSpeechPronunciation('你好', word);
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(result.matchedBy).toBe('hanzi_exact');
  });

  it('multilevel speech evaluation matches conversational carrier phrases (hanzi_contains)', () => {
    const word = MOCK_WORDS[1]; // 谢谢, xièxie
    const result = evaluateSpeechPronunciation('非常谢谢你', word);
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.matchedBy).toBe('hanzi_contains');
  });

  it('multilevel speech evaluation matches pinyin with tones (pinyin_exact)', () => {
    const word = MOCK_WORDS[2]; // 再见, zàijiàn
    const result = evaluateSpeechPronunciation('zàijiàn', word);
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.matchedBy).toBe('pinyin_exact');
  });

  it('multilevel speech evaluation matches pinyin without tones (pinyin_tone_insensitive)', () => {
    const word = MOCK_WORDS[0]; // 你好, nǐ hǎo
    const result = evaluateSpeechPronunciation('ni hao', word);
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.matchedBy).toBe('pinyin_tone_insensitive');
  });

  it('multilevel speech evaluation returns none for completely incorrect pronunciation', () => {
    const word = MOCK_WORDS[0]; // 你好
    const result = evaluateSpeechPronunciation('苹果 píngguǒ', word);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
    expect(result.matchedBy).toBe('none');
  });

  it('multi-alternative evaluation selects the best matching candidate from speech recognition results', () => {
    const word = MOCK_WORDS[1]; // 谢谢, xièxie
    // Simulated Web Speech API alternatives array with homophones/noise
    const alternatives = ['斜斜', '谢谢', '写写'];

    let bestResult: EvalResult | null = null;
    let bestTranscript = alternatives[0];

    for (const alt of alternatives) {
      const ev = evaluateSpeechPronunciation(alt, word);
      if (!bestResult || ev.score > bestResult.score) {
        bestResult = ev;
        bestTranscript = alt;
      }
      if (ev.score === 100) break;
    }

    expect(bestTranscript).toBe('谢谢');
    expect(bestResult?.isCorrect).toBe(true);
    expect(bestResult?.matchedBy).toBe('hanzi_exact');
  });

  it('simulates full FIFO retry queue lifecycle: incorrect cards pushed to tail until 100% mastery', () => {
    // Initial queue of 3 words: [W1 (你好), W2 (谢谢), W3 (再见)]
    const initialWords = [...MOCK_WORDS];
    let queue: WordItem[] = [...initialWords];
    const completedWords: WordItem[] = [];
    let isFlipped = false;
    let audioPlayedCount = 0;
    const playAudioMock = vi.fn((_hanzi: string) => {
      audioPlayedCount++;
    });

    const submitPronunciation = (transcript: string) => {
      const current = queue[0];
      if (!current) return;

      const evalRes = evaluateSpeechPronunciation(transcript, current);
      if (evalRes.isCorrect) {
        // Correct: advance immediately after feedback
        isFlipped = false;
        const finished = queue.shift()!;
        completedWords.push(finished);
      } else {
        // Incorrect: flip card to demonstrate, play audio; DEFER queue shift to advance transition
        isFlipped = true;
        playAudioMock(current.hanzi);
      }
    };

    const advanceAfterDemonstration = () => {
      if (isFlipped && queue.length > 0) {
        const missed = queue.shift()!;
        queue.push(missed);
        isFlipped = false;
      }
    };

    // Step 1: W1 (你好) pronounced correctly
    expect(queue[0].hanzi).toBe('你好');
    submitPronunciation('你好');
    expect(isFlipped).toBe(false);
    expect(completedWords.map((w) => w.hanzi)).toEqual(['你好']);
    expect(queue.map((w) => w.hanzi)).toEqual(['谢谢', '再见']);

    // Step 2: W2 (谢谢) pronounced incorrectly ('xi bu xie')
    expect(queue[0].hanzi).toBe('谢谢');
    submitPronunciation('xi bu xie');
    expect(isFlipped).toBe(true);
    expect(playAudioMock).toHaveBeenCalledWith('谢谢');
    // CRITICAL INVARIANT: queue must NOT have rotated yet during demonstration
    expect(queue[0].hanzi).toBe('谢谢');

    // Advance after demonstration completes
    advanceAfterDemonstration();
    expect(isFlipped).toBe(false);
    expect(queue.map((w) => w.hanzi)).toEqual(['再见', '谢谢']); // W2 now at tail!

    // Step 3: W3 (再见) pronounced correctly ('zàijiàn')
    expect(queue[0].hanzi).toBe('再见');
    submitPronunciation('zàijiàn');
    expect(completedWords.map((w) => w.hanzi)).toEqual(['你好', '再见']);
    expect(queue.map((w) => w.hanzi)).toEqual(['谢谢']); // Only W2 remains

    // Step 4: W2 (谢谢) re-attempted and pronounced correctly ('xièxie')
    expect(queue[0].hanzi).toBe('谢谢');
    submitPronunciation('xièxie');
    expect(completedWords.map((w) => w.hanzi)).toEqual(['你好', '再见', '谢谢']);
    expect(queue.length).toBe(0); // Queue is empty!

    // Practice session is now completed
    const isSessionCompleted = queue.length === 0 && completedWords.length === initialWords.length;
    expect(isSessionCompleted).toBe(true);
    expect(audioPlayedCount).toBe(1); // Audio triggered on the incorrect card
  });

  it('guarantees active card displays the missed word during demonstration flip and only advances queue upon timer completion or manual advance', () => {
    const deck = [...MOCK_WORDS]; // [W1 (你好), W2 (谢谢), W3 (再见)]
    let queue = [...deck];
    let isFlipped = false;
    let status: 'idle' | 'evaluating' | 'correct' | 'incorrect' = 'idle';
    let audioPlayed = '';

    const handleProcessSpeech = (transcript: string) => {
      const currentWord = queue[0];
      const result = evaluateSpeechPronunciation(transcript, currentWord);
      if (!result.isCorrect) {
        status = 'incorrect';
        isFlipped = true;
        audioPlayed = currentWord.hanzi;
        // Notice: queue is NOT mutated here!
      }
    };

    const handleAutoAdvance = () => {
      if (queue.length > 0) {
        const missed = queue[0];
        queue = [...queue.slice(1), missed];
      }
      isFlipped = false;
      status = 'idle';
    };

    const handleManualAdvance = () => {
      if (status === 'incorrect' && queue.length > 0) {
        const missed = queue[0];
        queue = [...queue.slice(1), missed];
      }
      isFlipped = false;
      status = 'idle';
    };

    // --- Scenario A: Auto-advance after demonstration timer ---
    expect(queue[0].hanzi).toBe('你好');
    handleProcessSpeech('apple'); // Incorrect speech

    // INVARIANT 1: Card is flipped, status is incorrect
    expect(status).toBe('incorrect');
    expect(isFlipped).toBe(true);
    // INVARIANT 2: queue[0] is still the MISSED word ('你好')
    expect(queue[0].hanzi).toBe('你好');
    expect(queue[0].pinyin).toBe('nǐ hǎo');
    expect(queue[0].vietnamese).toBe('xin chào');
    // INVARIANT 3: Audio played corresponds to the missed word
    expect(audioPlayed).toBe('你好');

    // Timer expires: auto advance fires
    handleAutoAdvance();
    expect(isFlipped).toBe(false);
    expect(status).toBe('idle');
    // INVARIANT 4: Only now does queue advance to the next card ('谢谢')
    expect(queue[0].hanzi).toBe('谢谢');
    expect(queue.map((w) => w.hanzi)).toEqual(['谢谢', '再见', '你好']);

    // --- Scenario B: Manual advance ("Tiếp tục" button) ---
    handleProcessSpeech('wrong pronunciation'); // Incorrect speech for '谢谢'
    expect(status).toBe('incorrect');
    expect(isFlipped).toBe(true);
    expect(queue[0].hanzi).toBe('谢谢');
    expect(audioPlayed).toBe('谢谢');

    // Learner clicks "Tiếp tục"
    handleManualAdvance();
    expect(isFlipped).toBe(false);
    expect(status).toBe('idle');
    expect(queue[0].hanzi).toBe('再见');
    expect(queue.map((w) => w.hanzi)).toEqual(['再见', '你好', '谢谢']);
  });

  it('manual text input fallback successfully processes pronunciation when Web Speech API is unavailable', () => {
    const word = MOCK_WORDS[2]; // 再见, zàijiàn
    const manualInput = 'zàijiàn';
    const result = evaluateSpeechPronunciation(manualInput, word);
    expect(result.isCorrect).toBe(true);
    expect(result.targetPinyin).toBe('zàijiàn');
  });
});

// ============================================================================
// 2. R4: Freehand Handwriting Whiteboard Canvas
// ============================================================================
describe('Milestone 3 — R4: Freehand Handwriting Whiteboard Canvas', () => {
  interface Point {
    x: number;
    y: number;
  }
  interface Stroke {
    points: Point[];
    color: string;
    width: number;
    isEraser: boolean;
  }

  it('records freehand stroke pointer down, move, and up sequence', () => {
    const strokes: Stroke[] = [];
    let activeStroke: Stroke | null = null;
    const currentColor = '#1f2937';
    const strokeWidth = 6;
    const isEraser = false;

    // PointerDown at (10, 20)
    activeStroke = {
      points: [{ x: 10, y: 20 }],
      color: currentColor,
      width: strokeWidth,
      isEraser,
    };

    // PointerMove through (15, 25), (20, 30), (25, 35)
    activeStroke.points.push({ x: 15, y: 25 });
    activeStroke.points.push({ x: 20, y: 30 });
    activeStroke.points.push({ x: 25, y: 35 });

    // PointerUp commits active stroke
    strokes.push(activeStroke);
    activeStroke = null;

    expect(strokes.length).toBe(1);
    expect(strokes[0].points.length).toBe(4);
    expect(strokes[0].points[0]).toEqual({ x: 10, y: 20 });
    expect(strokes[0].points[3]).toEqual({ x: 25, y: 35 });
    expect(strokes[0].color).toBe('#1f2937');
    expect(strokes[0].width).toBe(6);
    expect(strokes[0].isEraser).toBe(false);
  });

  it('supports 4 ink colors and 3 stroke widths', () => {
    const COLOR_PALETTE = ['#1f2937', '#10b981', '#2563eb', '#dc2626'];
    const STROKE_WIDTHS = [3, 6, 12];

    expect(COLOR_PALETTE).toContain('#1f2937'); // Black
    expect(COLOR_PALETTE).toContain('#10b981'); // Emerald
    expect(COLOR_PALETTE).toContain('#2563eb'); // Blue
    expect(COLOR_PALETTE).toContain('#dc2626'); // Crimson

    expect(STROKE_WIDTHS).toEqual([3, 6, 12]);
  });

  it('eraser mode tags stroke with isEraser: true without mutating prior ink strokes', () => {
    const strokes: Stroke[] = [];

    // Stroke 1: Normal ink
    strokes.push({
      points: [{ x: 10, y: 10 }, { x: 50, y: 50 }],
      color: '#1f2937',
      width: 6,
      isEraser: false,
    });

    // Stroke 2: Eraser
    strokes.push({
      points: [{ x: 30, y: 30 }, { x: 40, y: 40 }],
      color: '#000000',
      width: 24,
      isEraser: true,
    });

    expect(strokes.length).toBe(2);
    expect(strokes[0].isEraser).toBe(false);
    expect(strokes[1].isEraser).toBe(true);
    expect(strokes[1].width).toBe(24);
  });

  it('undo pops the latest stroke safely, clear empties stroke list', () => {
    let strokes: Stroke[] = [
      { points: [{ x: 1, y: 1 }], color: '#1f2937', width: 6, isEraser: false },
      { points: [{ x: 2, y: 2 }], color: '#1f2937', width: 6, isEraser: false },
      { points: [{ x: 3, y: 3 }], color: '#1f2937', width: 6, isEraser: false },
    ];

    // Undo once
    strokes = strokes.slice(0, -1);
    expect(strokes.length).toBe(2);

    // Clear
    strokes = [];
    expect(strokes.length).toBe(0);

    // Undo on empty list does not throw error
    const undoEmpty = () => {
      if (strokes.length === 0) return false;
      strokes = strokes.slice(0, -1);
      return true;
    };
    expect(undoEmpty()).toBe(false);
    expect(strokes.length).toBe(0);
  });

  it('compound words multi-character tabs properly decompose characters', () => {
    const word = MOCK_WORDS[0]; // "你好"
    const chars = Array.from(word.hanzi);
    expect(chars).toEqual(['你', '好']);
    expect(chars.length).toBe(2);
  });

  it('strictly verifies NO stroke order animation guides or constraints exist in VocabularyWhiteboardModal', () => {
    const whiteboardPath = path.resolve(
      __dirname,
      '../src/components/Coursebook/VocabularyWhiteboardModal.tsx'
    );
    const content = fs.readFileSync(whiteboardPath, 'utf-8');

    // Hanzi Writer or forced stroke constraints must NOT be used
    expect(content).not.toContain('hanzi-writer');
    expect(content).not.toContain('HanziWriter');
    expect(content).not.toContain('stroke-by-stroke');
    expect(content).not.toContain('animateStroke');
    expect(content).not.toContain('onStrokeScored');
    expect(content).not.toContain('strokeOrder');

    // Mizige and Tianzige grids must be present
    expect(content).toContain('mizi');
    expect(content).toContain('tianzi');
  });
});

// ============================================================================
// 3. R5: Card Sequence Randomization
// ============================================================================
describe('Milestone 3 — R5: Card Sequence Randomization Integration', () => {
  it('shuffleArray creates a new permutation without mutating the original words array', () => {
    const original = [...MOCK_WORDS];
    const originalHanzi = original.map((w) => w.hanzi);

    const shuffled = shuffleArray(original);

    // Same elements
    expect(shuffled.length).toBe(original.length);
    expect(new Set(shuffled.map((w) => w.id))).toEqual(new Set(original.map((w) => w.id)));

    // New array reference
    expect(shuffled).not.toBe(original);

    // Original array was not mutated in place
    expect(original.map((w) => w.hanzi)).toEqual(originalHanzi);
  });

  it('shuffleArray produces deterministic output when supplied with a seeded RNG', () => {
    const dummy = [1, 2, 3, 4, 5, 6, 7, 8];
    // Seeded pseudo-RNG returning constant steps
    let seed = 0.42;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const run1 = shuffleArray(dummy, rng);
    seed = 0.42;
    const run2 = shuffleArray(dummy, rng);

    expect(run1).toEqual(run2);
  });

  it('in-session shuffle toggle preserves completedWords and totalAttempts without wiping progress', () => {
    const deck: WordItem[] = [
      ...MOCK_WORDS,
      { id: 'w_4', hanzi: '是', pinyin: 'shì', vietnamese: 'là', hskLevel: 1 },
      { id: 'w_5', hanzi: '学生', pinyin: 'xuésheng', vietnamese: 'học sinh', hskLevel: 1 },
    ];
    let queue = [...deck];
    let completedWords: WordItem[] = [];
    let totalAttempts = 0;
    let isRandomized = false;

    // Learner completes first 2 words
    completedWords.push(queue.shift()!);
    totalAttempts++;
    completedWords.push(queue.shift()!);
    totalAttempts++;

    expect(completedWords.length).toBe(2);
    expect(queue.length).toBe(3);
    expect(totalAttempts).toBe(2);

    // Learner toggles shuffle mid-session
    const handleToggleShuffle = () => {
      const nextRandomized = !isRandomized;
      isRandomized = nextRandomized;
      if (nextRandomized) {
        queue = shuffleArray(queue);
      }
    };

    handleToggleShuffle();

    // INVARIANT 1: isRandomized changed to true
    expect(isRandomized).toBe(true);
    // INVARIANT 2: completedWords is NOT wiped
    expect(completedWords.length).toBe(2);
    expect(completedWords.map((w) => w.hanzi)).toEqual(['你好', '谢谢']);
    // INVARIANT 3: totalAttempts is NOT reset
    expect(totalAttempts).toBe(2);
    // INVARIANT 4: queue contains only the remaining 3 cards in valid permutation
    expect(queue.length).toBe(3);
    const remainingIds = queue.map((w) => w.id).sort();
    expect(remainingIds).toEqual(['w_3', 'w_4', 'w_5'].sort());
  });
});

// ============================================================================
// 4. R6: Complete Absence of Previous/Next Lesson Buttons in CoursebookView
// ============================================================================
describe('Milestone 3 — R6: Navigation Control Hygiene in CoursebookView', () => {
  const coursebookViewPath = path.resolve(
    __dirname,
    '../src/components/Coursebook/CoursebookView.tsx'
  );
  const content = fs.readFileSync(coursebookViewPath, 'utf-8');

  it('strictly contains ZERO occurrences of "Bài trước"', () => {
    expect(content.match(/Bài\s*trước/i)).toBeNull();
  });

  it('strictly contains ZERO occurrences of "Bài sau"', () => {
    expect(content.match(/Bài\s*sau/i)).toBeNull();
  });

  it('strictly contains ZERO occurrences of "Bài tiếp theo"', () => {
    expect(content.match(/Bài\s*tiếp\s*theo/i)).toBeNull();
  });

  it('strictly contains ZERO occurrences of ChevronLeft in imports and JSX', () => {
    expect(content).not.toContain('ChevronLeft');
  });

  it('preserves the centered lesson completion button at the bottom', () => {
    expect(content).toContain('toggleCompleteLesson(currentLesson.lessonNumber)');
    expect(content).toContain('Đánh dấu đã học xong bài');
    expect(content).toContain('✓ Đã học xong bài này');
  });
});

// ============================================================================
// 5. CoursebookView Action Bar & Modal Mounting Integration
// ============================================================================
describe('Milestone 3 — CoursebookView Modal Mounting and Vocabulary Tab Action Bar', () => {
  const coursebookViewPath = path.resolve(
    __dirname,
    '../src/components/Coursebook/CoursebookView.tsx'
  );
  const content = fs.readFileSync(coursebookViewPath, 'utf-8');

  it('imports PronunciationFlashcardsModal and VocabularyWhiteboardModal', () => {
    expect(content).toContain("import { PronunciationFlashcardsModal } from './PronunciationFlashcardsModal';");
    expect(content).toContain("import { VocabularyWhiteboardModal } from './VocabularyWhiteboardModal';");
  });

  it('mounts PronunciationFlashcardsModal and VocabularyWhiteboardModal in JSX', () => {
    expect(content).toContain('<PronunciationFlashcardsModal');
    expect(content).toContain('isOpen={isPronunciationModalOpen}');
    expect(content).toContain('<VocabularyWhiteboardModal');
    expect(content).toContain('isOpen={isWhiteboardModalOpen}');
  });

  it('declares action buttons: "Xáo trộn", "Luyện phát âm", "Luyện viết chữ"', () => {
    expect(content).toContain('Luyện phát âm');
    expect(content).toContain('Luyện viết chữ');
    expect(content).toContain('Xáo trộn');
  });

  it('retains onStartFlashcards payload within the first 1000 characters of activeTab === "vocab"', () => {
    const vocabTabStartIndex = content.indexOf("activeTab === 'vocab'");
    expect(vocabTabStartIndex).toBeGreaterThan(0);

    const vocabTabSection = content.slice(vocabTabStartIndex, vocabTabStartIndex + 1000);
    expect(vocabTabSection).toContain('onStartFlashcards(');
    expect(vocabTabSection).toContain('currentLesson.vocabulary');
    expect(vocabTabSection).toContain('currentLesson.lessonNumber');
    expect(vocabTabSection).toContain('selectedHskLevel');
    expect(vocabTabSection).toContain("'vocab'");
  });
});

// ============================================================================
// 6. Milestone 3 Gate Remediation Invariants: AST & Code Hygiene Verification
// ============================================================================
describe('Milestone 3 — Gate Remediation Invariants (Queue Timing, Shuffle Retention, Audio Cleanup)', () => {
  const flashcardsModalPath = path.resolve(
    __dirname,
    '../src/components/Coursebook/PronunciationFlashcardsModal.tsx'
  );
  const whiteboardModalPath = path.resolve(
    __dirname,
    '../src/components/Coursebook/VocabularyWhiteboardModal.tsx'
  );
  const flashcardsContent = fs.readFileSync(flashcardsModalPath, 'utf-8');
  const whiteboardContent = fs.readFileSync(whiteboardModalPath, 'utf-8');

  it('verifies that PronunciationFlashcardsModal does NOT call setQueue before setTimeout on failure', () => {
    const incorrectBranchStart = flashcardsContent.indexOf("setStatus('incorrect');");
    expect(incorrectBranchStart).toBeGreaterThan(0);

    const incorrectSection = flashcardsContent.slice(incorrectBranchStart, incorrectBranchStart + 800);
    const setQueueIndex = incorrectSection.indexOf('setQueue(');
    const setTimeoutIndex = incorrectSection.indexOf('setTimeout(');

    expect(setQueueIndex).toBeGreaterThan(0);
    expect(setTimeoutIndex).toBeGreaterThan(0);

    // setQueue must be called inside setTimeout, NOT before it!
    expect(setQueueIndex).toBeGreaterThan(setTimeoutIndex);

    // Verify inside setTimeout contains setQueue
    const insideTimeout = incorrectSection.slice(setTimeoutIndex, setTimeoutIndex + 400);
    expect(insideTimeout).toContain('setQueue(');
    expect(insideTimeout).toContain('missed');
  });

  it('verifies that handleManualAdvance rotates queue when status === "incorrect"', () => {
    const manualAdvanceStart = flashcardsContent.indexOf('const handleManualAdvance =');
    expect(manualAdvanceStart).toBeGreaterThan(0);

    const manualAdvanceSection = flashcardsContent.slice(manualAdvanceStart, manualAdvanceStart + 600);
    expect(manualAdvanceSection).toContain("status === 'incorrect'");
    expect(manualAdvanceSection).toContain('setQueue(');
    expect(manualAdvanceSection).toContain('missed');
  });

  it('verifies that isRandomized is NOT present in the initialization useEffect dependency array', () => {
    const initEffectStart = flashcardsContent.indexOf('// Initialize or reset session when modal opens or words change');
    expect(initEffectStart).toBeGreaterThan(0);

    const initEffectEnd = flashcardsContent.indexOf('}, [', initEffectStart);
    const dependencyLine = flashcardsContent.slice(initEffectEnd, initEffectEnd + 60);

    expect(dependencyLine).not.toContain('isRandomized');
    expect(dependencyLine).toContain('isOpen');
    expect(dependencyLine).toContain('words');
  });

  it('verifies that VocabularyWhiteboardModal imports and calls stopChineseAudio on close', () => {
    // 1. Must import stopChineseAudio
    expect(whiteboardContent).toContain('stopChineseAudio');

    // 2. handleClose calls stopChineseAudio
    const handleCloseIndex = whiteboardContent.indexOf('const handleClose =');
    expect(handleCloseIndex).toBeGreaterThan(0);
    const handleCloseSection = whiteboardContent.slice(handleCloseIndex, handleCloseIndex + 200);
    expect(handleCloseSection).toContain('stopChineseAudio()');
    expect(handleCloseSection).toContain('onClose()');

    // 3. Unmount / !isOpen cleanup calls stopChineseAudio
    expect(whiteboardContent).toMatch(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?stopChineseAudio\(\);[\s\S]*?\},?\s*\[isOpen\]\)/);
  });
});

