/**
 * tests/auditor_milestone2_forensic_stress.test.ts
 *
 * Independent Adversarial Stress Test Suite for Milestone 2:
 * - Fisher-Yates Uniformity, Boundary, and Invariance (shuffleUtils.ts)
 * - Multi-tier Pronunciation Evaluation Robustness & Adversarial Edge Cases (pronunciationEval.ts)
 */

import { describe, it, expect } from 'vitest';
import { shuffleArray } from '../src/utils/shuffleUtils';
import {
  evaluateSpeechPronunciation,
  isPronunciationAcceptable,
  normalizeChineseText,
  extractPinyin,
  stripTones,
  sanitizePinyinForComparison,
} from '../src/utils/pronunciationEval';
import type { WordItem } from '../src/types';

describe('Auditor Forensic Stress Tests: Milestone 2', () => {

  // ==========================================================================
  // 1. ADVERSARIAL STRESS: Shuffle Utility
  // ==========================================================================
  describe('1. Adversarial Stress: shuffleArray', () => {
    it('1.1: Preserves object reference identity without deep-cloning inner objects', () => {
      const obj1 = { id: 1, name: 'one' };
      const obj2 = { id: 2, name: 'two' };
      const obj3 = { id: 3, name: 'three' };
      const arr = [obj1, obj2, obj3];

      const shuffled = shuffleArray(arr);
      expect(shuffled).not.toBe(arr);
      expect(shuffled.length).toBe(3);
      // Object references must be strictly identical
      expect(shuffled).toContain(obj1);
      expect(shuffled).toContain(obj2);
      expect(shuffled).toContain(obj3);
    });

    it('1.2: Preserves multiset duplicates without dropping or creating elements', () => {
      const arr = [42, 42, 42, 99, 99, 100];
      const shuffled = shuffleArray(arr);
      expect(shuffled.filter((x) => x === 42).length).toBe(3);
      expect(shuffled.filter((x) => x === 99).length).toBe(2);
      expect(shuffled.filter((x) => x === 100).length).toBe(1);
    });

    it('1.3: Chi-Square Uniformity Test across 24 permutations (4 elements, 12,000 trials)', () => {
      // 4! = 24 permutations. Expected count per permutation = 12000 / 24 = 500.
      const elements = [1, 2, 3, 4];
      const trials = 12000;
      const counts: Record<string, number> = {};

      for (let i = 0; i < trials; i++) {
        const res = shuffleArray(elements);
        const key = res.join(',');
        counts[key] = (counts[key] || 0) + 1;
      }

      // Ensure all 24 permutations occurred
      expect(Object.keys(counts).length).toBe(24);

      // Compute Chi-Square statistic: sum((observed - expected)^2 / expected)
      const expected = trials / 24;
      let chiSquare = 0;
      for (const key of Object.keys(counts)) {
        const observed = counts[key];
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }

      // For df = 23 (24 - 1), critical value at alpha = 0.001 is 49.728
      // and at alpha = 0.01 is 41.638. We test against 49.728.
      expect(chiSquare).toBeLessThan(49.728);
    });

    it('1.4: Handles extreme input sizes (10,000 items) in linear O(N) time', () => {
      const large = Array.from({ length: 10000 }, (_, i) => i);
      const t0 = performance.now();
      const res = shuffleArray(large);
      const elapsed = performance.now() - t0;

      expect(res.length).toBe(10000);
      expect(elapsed).toBeLessThan(50); // <50ms for 10k items
    });

    it('1.5: Adversarial RNG sequences (all 0, all 0.9999, alternating)', () => {
      const arr = [10, 20, 30, 40];
      // RNG returning 0 picks j = 0 at every step
      const rngZero = () => 0;
      const resZero = shuffleArray(arr, rngZero);
      expect(resZero.length).toBe(4);
      expect(resZero.sort((a, b) => a - b)).toEqual([10, 20, 30, 40]);

      // RNG returning near 1 picks j = i at every step (identity permutation)
      const rngIdentity = () => 0.999999;
      const resIdentity = shuffleArray(arr, rngIdentity);
      expect(resIdentity).toEqual([10, 20, 30, 40]);
    });
  });

  // ==========================================================================
  // 2. ADVERSARIAL STRESS: Pronunciation Evaluator
  // ==========================================================================
  describe('2. Adversarial Stress: evaluateSpeechPronunciation', () => {
    const targetWord: WordItem = {
      id: 'hsk1-w-001',
      hanzi: '学校',
      pinyin: 'xué xiào',
      vietnamese: 'Trường học',
      hskLevel: 1,
    };

    it('2.1: Rejects zero-width spaces, pure whitespace, and empty strings safely', () => {
      const cases = ['', '   ', '\t', '\n', '\u200B', '\uFEFF', '  \u200B  '];
      for (const input of cases) {
        const res = evaluateSpeechPronunciation(input, targetWord);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('2.2: Rejects pure punctuation without Chinese characters or pinyin', () => {
      const cases = ['!@#$%^&*()', '，。！？；：', '、、、……——', '   ???   '];
      for (const input of cases) {
        const res = evaluateSpeechPronunciation(input, targetWord);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('2.3: Handles emoji and conversational noise around target speech', () => {
      const resWithEmoji = evaluateSpeechPronunciation('🏫 学校 🎉', targetWord);
      expect(resWithEmoji.isCorrect).toBe(true);
      expect(resWithEmoji.score).toBeGreaterThanOrEqual(95);

      const resCarrier = evaluateSpeechPronunciation('这是我们的学校', targetWord);
      expect(resCarrier.isCorrect).toBe(true);
      expect(resCarrier.matchedBy).toBe('hanzi_contains');
      expect(resCarrier.score).toBe(95);
    });

    it('2.4: Comprehensive diacritics stripping across all Mandarin vowel tones', () => {
      const vowelsWithTones = 'āáǎà ēéěè īíǐì ōóǒò ūúǔù ǖǘǚǜ';
      const stripped = stripTones(vowelsWithTones);
      // All diacritics (including tones and umlauts via Unicode NFD) stripped to base Latin characters
      expect(stripped).toBe('aaaaeeeeiiiioooouuuuuuuu');
    });

    it('2.5: Homophone resolution across distinct characters with identical tone pinyin', () => {
      // '是' (shì) vs '事' (shì), '市' (shì), '视' (shì), '试' (shì)
      const shiWord: WordItem = {
        id: 'hsk1-shi',
        hanzi: '是',
        pinyin: 'shì',
        vietnamese: 'Là',
        hskLevel: 1,
      };

      const homophones = ['事', '市', '视', '试', '世', '士'];
      for (const h of homophones) {
        const res = evaluateSpeechPronunciation(h, shiWord);
        expect(res.isCorrect).toBe(true);
        expect(res.matchedBy).toBe('pinyin_exact');
        expect(res.score).toBe(90);
      }
    });

    it('2.6: Rejects completely unrelated Chinese words and phonetic mismatches', () => {
      const unrelated = ['苹果', '香蕉', '飞机', '老师', '猫', '中国'];
      for (const word of unrelated) {
        const res = evaluateSpeechPronunciation(word, targetWord);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('2.7: Extremely large transcript string does not crash or hang', () => {
      const hugeInput = '学'.repeat(5000);
      const res = evaluateSpeechPronunciation(hugeInput, targetWord);
      expect(typeof res.isCorrect).toBe('boolean');
      expect(typeof res.score).toBe('number');
    });

    it('2.8: Handles malformed expected argument gracefully (string, object, missing pinyin)', () => {
      // Target as raw Hanzi string
      const resStr = evaluateSpeechPronunciation('学校', '学校');
      expect(resStr.isCorrect).toBe(true);
      expect(resStr.matchedBy).toBe('hanzi_exact');

      // Target as object without pinyin
      const resObj = evaluateSpeechPronunciation('xuéxiào', { hanzi: '学校' });
      expect(resObj.isCorrect).toBe(true);
      expect(resObj.matchedBy).toBe('pinyin_exact');

      // Target as empty object
      const resEmptyObj = evaluateSpeechPronunciation('学校', {} as any);
      expect(resEmptyObj.isCorrect).toBe(false);
      expect(resEmptyObj.score).toBe(0);
    });

    it('2.9: Tone-insensitive matching with and without spacing variations', () => {
      const res1 = evaluateSpeechPronunciation('xue xiao', targetWord);
      expect(res1.isCorrect).toBe(true);
      expect(res1.matchedBy).toBe('pinyin_tone_insensitive');
      expect(res1.score).toBe(80);

      const res2 = evaluateSpeechPronunciation('xuexiao', targetWord);
      expect(res2.isCorrect).toBe(true);
      expect(res2.matchedBy).toBe('pinyin_tone_insensitive');
      expect(res2.score).toBe(80);
    });
  });
});
