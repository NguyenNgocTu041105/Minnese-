/**
 * Regression verification suite covering fixes identified during QA review:
 * 1. Audio stream abort/timeout/cache hygiene in playPutonghuaAudioStream & stopChineseAudio
 * 2. SAPI5 male/female voice ranking ordering in rankVoice
 * 3. HSK 1-6 coursebook vocabulary resolution & non-destructive batch ensureWordsInSRS
 * 4. StrictMode/state-safety invariants in PronunciationFlashcardsModal, VocabularyWhiteboardModal, App, and CoursebookView
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  playPutonghuaAudioStream,
  stopChineseAudio,
  rankVoice,
} from '../src/utils/chineseAudio';
import {
  getLessonsForLevel,
  getLessonVocabulary,
  ensureWordsInSRS,
} from '../src/utils/coursebookVocab';
import type { SRSCardState, WordItem } from '../src/types';

class MockAudioElement {
  static createdUrls: string[] = [];
  static instances: MockAudioElement[] = [];

  src: string;
  playbackRate = 1;
  currentTime = 0;
  paused = true;
  error: MediaError | null = null;
  onplaying: ((ev?: any) => void) | null = null;
  oncanplay: ((ev?: any) => void) | null = null;
  onended: ((ev?: any) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  private playBehavior: 'resolve' | 'pending' | 'reject_network' = 'pending';

  constructor(url: string) {
    this.src = url;
    MockAudioElement.createdUrls.push(url);
    MockAudioElement.instances.push(this);
  }

  setPlayBehavior(mode: 'resolve' | 'pending' | 'reject_network') {
    this.playBehavior = mode;
  }

  play(): Promise<void> {
    this.paused = false;
    if (this.playBehavior === 'reject_network') {
      return Promise.reject(new Error('Network fail'));
    }
    if (this.playBehavior === 'resolve') {
      return Promise.resolve();
    }
    return new Promise<void>(() => {
      // Stays pending until ended, errored, or cancelled
    });
  }

  pause(): void {
    this.paused = true;
  }
}

describe('QA Regression Suite: Audio Stream, Voice Ranking, SRS Batching & Modal Invariants', () => {
  const originalAudio = (globalThis as any).Audio;

  beforeEach(() => {
    MockAudioElement.createdUrls = [];
    MockAudioElement.instances = [];
    (globalThis as any).Audio = MockAudioElement;
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopChineseAudio();
    vi.useRealTimers();
    (globalThis as any).Audio = originalAudio;
    vi.restoreAllMocks();
  });

  describe('1. playPutonghuaAudioStream & stopChineseAudio cleanup', () => {
    it('cancelling mid-flight via stopChineseAudio clears startup timer and resolves without ghost timeout error', async () => {
      const p = playPutonghuaAudioStream('你好世界');
      expect(MockAudioElement.instances.length).toBe(1);

      // User switches tabs or clicks another word before network audio finishes
      stopChineseAudio();

      // Must resolve immediately instead of staying unsettled or rejecting 5s later
      await expect(p).resolves.toBeUndefined();

      // Advance past startup timeout window to ensure no delayed rejection triggers unhandled noise
      vi.advanceTimersByTime(6000);
      expect(MockAudioElement.instances[0].paused).toBe(true);
    });

    it('clearing startup timeout on onplaying allows long sentences (>5s) to finish normally', async () => {
      const p = playPutonghuaAudioStream('这是一个比较长的汉语例句测试');
      const instance = MockAudioElement.instances[0];

      // Playback begins cleanly after 400ms
      vi.advanceTimersByTime(400);
      instance.onplaying?.();

      // Wait 7 seconds (>5s startup timeout); playback must still be running, NOT aborted
      vi.advanceTimersByTime(7000);
      expect(instance.paused).toBe(false);

      // Natural completion at 7.5s
      instance.onended?.();
      await expect(p).resolves.toBeUndefined();
    });

    it('evicts broken audio entries from ttsAudioCache on error so next attempt allocates fresh Audio', async () => {
      const text = '缓存错误恢复测试词';
      const firstAttempt = playPutonghuaAudioStream(text);
      const firstAudio = MockAudioElement.instances[0];

      firstAudio.error = { code: 4 } as MediaError;
      firstAudio.onerror?.(new Event('error'));
      await expect(firstAttempt).rejects.toBeDefined();

      // Second attempt must NOT reuse the failed cached MockAudioElement
      const secondAttempt = playPutonghuaAudioStream(text);
      expect(MockAudioElement.instances.length).toBe(2);

      const secondAudio = MockAudioElement.instances[1];
      expect(secondAudio).not.toBe(firstAudio);
      secondAudio.onplaying?.();
      secondAudio.onended?.();
      await expect(secondAttempt).resolves.toBeUndefined();
    });
  });

  describe('2. rankVoice SAPI5 vs Neural voice gender selection', () => {
    const mkVoice = (name: string, lang = 'zh-CN', localService = true): SpeechSynthesisVoice => ({
      name,
      lang,
      localService,
      default: false,
      voiceURI: name,
    });

    it('ranks Kangkang above female SAPI5 voices for male role while Neural Yunxi always wins overall', () => {
      const huihui = mkVoice('Microsoft Huihui - Chinese (Simplified, PRC)', 'zh-CN', true);
      const kangkang = mkVoice('Microsoft Kangkang - Chinese (Simplified, PRC)', 'zh-CN', true);
      const yunxi = mkVoice('Microsoft Yunxi Online (Natural) - Chinese (Mainland)', 'zh-CN', false);

      expect(rankVoice(kangkang, 'male')).toBeGreaterThan(0);
      expect(rankVoice(huihui, 'male')).toBeLessThan(0);
      expect(rankVoice(kangkang, 'male')).toBeGreaterThan(rankVoice(huihui, 'male'));
      expect(rankVoice(yunxi, 'male')).toBeGreaterThan(rankVoice(kangkang, 'male'));
    });

    it('ranks Huihui/Yaoyao above Kangkang for female role while Neural Xiaoxiao always wins overall', () => {
      const huihui = mkVoice('Microsoft Huihui - Chinese (Simplified, PRC)', 'zh-CN', true);
      const kangkang = mkVoice('Microsoft Kangkang - Chinese (Simplified, PRC)', 'zh-CN', true);
      const xiaoxiao = mkVoice('Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', 'zh-CN', false);

      expect(rankVoice(huihui, 'female')).toBeGreaterThan(0);
      expect(rankVoice(kangkang, 'female')).toBeLessThan(0);
      expect(rankVoice(huihui, 'female')).toBeGreaterThan(rankVoice(kangkang, 'female'));
      expect(rankVoice(xiaoxiao, 'female')).toBeGreaterThan(rankVoice(huihui, 'female'));
    });
  });

  describe('3. Coursebook HSK 1-6 vocabulary resolution & non-destructive SRS batching', () => {
    it('resolves distinct lesson vocabularies for HSK 1..6 without falling back to HSK 4 on levels 5/6', () => {
      const hsk4L1 = getLessonVocabulary(4, 1);
      const hsk5L1 = getLessonVocabulary(5, 1);
      const hsk6L1 = getLessonVocabulary(6, 1);

      expect(getLessonsForLevel(5).length).toBeGreaterThan(0);
      expect(getLessonsForLevel(6).length).toBeGreaterThan(0);
      expect(hsk5L1.length).toBeGreaterThan(0);
      expect(hsk6L1.length).toBeGreaterThan(0);

      expect(hsk5L1.map((w) => w.id)).not.toEqual(hsk4L1.map((w) => w.id));
      expect(hsk6L1.map((w) => w.id)).not.toEqual(hsk4L1.map((w) => w.id));
    });

    it('ensureWordsInSRS adds missing lesson words in one batch without overwriting existing mastered SRS state', () => {
      const store = new Map<string, string>();
      const prevLS = (globalThis as any).localStorage;
      (globalThis as any).localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      };

      try {
        const hsk1L2 = getLessonVocabulary(1, 2);
        expect(hsk1L2.length).toBeGreaterThanOrEqual(10);

        const firstWord = hsk1L2[0];
        const existingCard: SRSCardState = {
          wordId: firstWord.id,
          repetition: 6,
          interval: 21,
          easinessFactor: 2.7,
          lastReviewDate: '2026-01-01T00:00:00.000Z',
          nextReviewDate: '2026-01-22T00:00:00.000Z',
          history: [],
          state: 'mastered',
        };

        const updated = ensureWordsInSRS(hsk1L2, { [firstWord.id]: existingCard });

        // Existing mastered progress MUST remain intact
        expect(updated[firstWord.id]).toEqual(existingCard);
        // All remaining words MUST be added cleanly without dropping earlier items
        for (const word of hsk1L2.slice(1)) {
          expect(updated[word.id]).toBeDefined();
          expect(updated[word.id].state).toBe('new');
        }
        expect(Object.keys(updated).length).toBe(hsk1L2.length);
        expect(store.has('minnese_srs_cards_v1')).toBe(true);
      } finally {
        (globalThis as any).localStorage = prevLS;
      }
    });
  });

  describe('4. Component hygiene invariants after QA fixes', () => {
    it('PronunciationFlashcardsModal never calls setCompletedWords inside setQueue state updater (StrictMode safe)', () => {
      const src = fs.readFileSync(
        path.resolve(__dirname, '../src/components/Coursebook/PronunciationFlashcardsModal.tsx'),
        'utf-8'
      );
      const setQueueCalls = src.match(/setQueue\(\(prevQueue\)\s*=>\s*\{[\s\S]*?\}\);/g) || [];
      expect(setQueueCalls.length).toBeGreaterThan(0);
      for (const block of setQueueCalls) {
        expect(block).not.toContain('setCompletedWords(');
      }
    });

    it('VocabularyWhiteboardModal supports short-viewport scrolling, portal isolation, and resyncs isOpen/initial props', () => {
      const src = fs.readFileSync(
        path.resolve(__dirname, '../src/components/Coursebook/VocabularyWhiteboardModal.tsx'),
        'utf-8'
      );
      expect(src).toContain('overflow-y-auto');
      expect(src).toContain('[isOpen, words, initialRandomize, initialWordIndex]');
      expect(src).toContain('createPortal');
      expect(src).toContain('z-[70]');
    });

    it('App.tsx uses batch ensureWordsInSRS on flashcard launch instead of single-word overwrite loop', () => {
      const src = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf-8');
      expect(src).toContain('ensureWordsInSRS(words, srsCards)');
      expect(src).not.toContain('words.forEach((w) => handleAddWordToSRS(w.id))');
    });

    it('CoursebookView.tsx imports and invokes stopChineseAudio on unmount/switch/playback', () => {
      const src = fs.readFileSync(
        path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx'),
        'utf-8'
      );
      expect(src).toContain('stopChineseAudio');
      expect(src).not.toContain('Bài trước');
      expect(src).not.toContain('Bài sau');
    });
  });
});
