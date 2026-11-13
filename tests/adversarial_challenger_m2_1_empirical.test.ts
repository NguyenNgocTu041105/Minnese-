/**
 * tests/adversarial_challenger_m2_1_empirical.test.ts
 *
 * Independent Empirical Challenger Verification Test Suite for Milestone 2:
 * 1. Fisher-Yates shuffleArray:
 *    - 10,000 randomized trials (mutation checks, multiset equality)
 *    - Extreme inputs: [], 1-element, 2-element, 1,000-element, frozen arrays, null/undefined
 *    - Statistical distribution: Chi-square Goodness-of-Fit on N=3 (6 permutations) and N=4 (24 permutations)
 *    - Marginal position uniformity & derangement probability
 * 2. evaluateSpeechPronunciation:
 *    - Homophone pairs stress testing (是/事/市/视/试, 他/她/它, 做/作/坐/座)
 *    - Tone insensitivity (diacritics, neutral tones, unaccented ASCII, tone numbers e.g. ni3 hao3)
 *    - Speech carrier phrases & conversational padding
 *    - Negative testing (unrelated words, gibberish, empty strings, punctuation only)
 *    - Scoring ladder validation (100, 95, 90, 80, 0)
 *
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import { shuffleArray } from '../src/utils/shuffleUtils';
import {
  evaluateSpeechPronunciation,
  isPronunciationAcceptable,
  normalizeChineseText,
  stripTones,
  sanitizePinyinForComparison,
  extractPinyin,
  type EvalResult,
} from '../src/utils/pronunciationEval';
import type { WordItem } from '../src/types';

describe('Adversarial Challenger M2.1: Empirical Stress Harness', () => {

  // ==========================================================================
  // SECTION 1: SHUFFLE UTILITY EMPIRICAL CHALLENGES
  // ==========================================================================
  describe('1. shuffleArray Empirical Verification', () => {

    it('1.1: 10,000 randomized trials - ZERO input mutations and result !== input guaranteed', () => {
      const input = [10, 20, 30, 40, 50, 60, 70, 80];
      const snapshot = Object.freeze([...input]);

      let referenceCollisions = 0;
      let mutationCount = 0;

      for (let trial = 0; trial < 10000; trial++) {
        const result = shuffleArray(input);

        // Verify distinct reference
        if (result === input) {
          referenceCollisions++;
        }

        // Verify original input array remains completely untouched
        if (input.length !== snapshot.length) {
          mutationCount++;
          break;
        }
        for (let i = 0; i < input.length; i++) {
          if (input[i] !== snapshot[i]) {
            mutationCount++;
            break;
          }
        }
      }

      expect(referenceCollisions).toBe(0);
      expect(mutationCount).toBe(0);
      expect(input).toEqual([...snapshot]);
    });

    it('1.2: 10,000 randomized trials - Strict multiset conservation (no lost or duplicated elements)', () => {
      const complexInput = [
        'apple',
        'banana',
        'banana',
        'cherry',
        'date',
        'date',
        'date',
        'elderberry',
      ];
      const sortedBaseline = [...complexInput].sort();

      for (let trial = 0; trial < 10000; trial++) {
        const result = shuffleArray(complexInput);

        expect(result.length).toBe(complexInput.length);
        const sortedResult = [...result].sort();
        expect(sortedResult).toEqual(sortedBaseline);
      }
    });

    it('1.3: Extreme Inputs - empty array, 1-element, 2-elements, and 1,000 elements', () => {
      // Empty array
      const empty: number[] = [];
      const emptyRes = shuffleArray(empty);
      expect(emptyRes).toEqual([]);
      expect(emptyRes).not.toBe(empty);

      // Single element array
      const single = [999];
      const singleRes = shuffleArray(single);
      expect(singleRes).toEqual([999]);
      expect(singleRes).not.toBe(single);

      // Two elements array
      const two = ['first', 'second'];
      let seenOriginal = false;
      let seenInverted = false;
      for (let i = 0; i < 200; i++) {
        const r = shuffleArray(two);
        expect(r).not.toBe(two);
        expect(r.length).toBe(2);
        if (r[0] === 'first' && r[1] === 'second') seenOriginal = true;
        if (r[0] === 'second' && r[1] === 'first') seenInverted = true;
      }
      expect(seenOriginal).toBe(true);
      expect(seenInverted).toBe(true);

      // 1,000 elements array
      const thousand = Array.from({ length: 1000 }, (_, idx) => idx);
      const start = performance.now();
      const thousandRes = shuffleArray(thousand);
      const elapsed = performance.now() - start;

      expect(thousandRes).not.toBe(thousand);
      expect(thousandRes.length).toBe(1000);
      expect([...thousandRes].sort((a, b) => a - b)).toEqual(thousand);
      expect(elapsed).toBeLessThan(15); // Executes under 15ms
    });

    it('1.4: Extreme Inputs - Object.freeze() immutability enforcement', () => {
      const frozenInput = Object.freeze([
        Object.freeze({ id: 1, text: 'one' }),
        Object.freeze({ id: 2, text: 'two' }),
        Object.freeze({ id: 3, text: 'three' }),
        Object.freeze({ id: 4, text: 'four' }),
      ]);

      expect(() => {
        const res = shuffleArray(frozenInput);
        expect(res).not.toBe(frozenInput);
        expect(res.length).toBe(4);
      }).not.toThrow();
    });

    it('1.5: Defensive Boundary - null and undefined handling', () => {
      expect(shuffleArray(null as unknown as number[])).toEqual([]);
      expect(shuffleArray(undefined as unknown as number[])).toEqual([]);
    });

    it('1.6: Statistical Uniformity - Chi-Square Test on N=3 (6 permutations, 60,000 trials)', () => {
      const input = [1, 2, 3];
      const permutations: Record<string, number> = {
        '1,2,3': 0,
        '1,3,2': 0,
        '2,1,3': 0,
        '2,3,1': 0,
        '3,1,2': 0,
        '3,2,1': 0,
      };

      const trials = 60000;
      const expected = trials / 6; // 10,000 expected per permutation

      for (let i = 0; i < trials; i++) {
        const res = shuffleArray(input);
        const key = res.join(',');
        permutations[key] = (permutations[key] || 0) + 1;
      }

      // Compute Chi-Square statistic
      let chiSquare = 0;
      for (const key of Object.keys(permutations)) {
        const observed = permutations[key];
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }

      // Degrees of freedom = 6 - 1 = 5
      // Critical value for alpha = 0.001 is 20.515, alpha = 0.01 is 15.086
      expect(chiSquare).toBeLessThan(20.515);
    });

    it('1.7: Statistical Uniformity - Marginal Position Distribution (4 elements, 40,000 trials)', () => {
      const input = ['A', 'B', 'C', 'D'];
      const trials = 40000;
      const expected = trials / 4; // 10,000 times in each position

      // Counts of element 'A' appearing at index 0, 1, 2, 3
      const positionCounts = [0, 0, 0, 0];

      for (let i = 0; i < trials; i++) {
        const res = shuffleArray(input);
        const idxA = res.indexOf('A');
        positionCounts[idxA]++;
      }

      // Check that each position is within 5% of expected
      for (let p = 0; p < 4; p++) {
        const ratio = positionCounts[p] / expected;
        expect(ratio).toBeGreaterThan(0.95);
        expect(ratio).toBeLessThan(1.05);
      }
    });

    it('1.8: Statistical Uniformity - N=4 full Chi-Square test (24 permutations, 24,000 trials)', () => {
      const input = [1, 2, 3, 4];
      const permutations: Record<string, number> = {};
      const trials = 24000;
      const expected = trials / 24; // 1,000 expected per permutation

      for (let i = 0; i < trials; i++) {
        const res = shuffleArray(input);
        const key = res.join(',');
        permutations[key] = (permutations[key] || 0) + 1;
      }

      expect(Object.keys(permutations).length).toBe(24);

      let chiSquare = 0;
      for (const key of Object.keys(permutations)) {
        const observed = permutations[key];
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }

      // df = 24 - 1 = 23. Critical value at alpha = 0.001 is 49.728
      expect(chiSquare).toBeLessThan(49.728);
    });

    it('1.9: Statistical Uniformity - Derangement frequency matches theoretical probability (!4/4! = 0.375)', () => {
      const input = [1, 2, 3, 4];
      const trials = 20000;
      let derangementCount = 0;

      for (let i = 0; i < trials; i++) {
        const res = shuffleArray(input);
        const isDerangement = res.every((val, idx) => val !== input[idx]);
        if (isDerangement) derangementCount++;
      }

      const empiricalRate = derangementCount / trials;
      // Theoretical rate for N=4 is 9/24 = 0.375.
      // Assert within +/- 0.02 of 0.375 (i.e. between 0.355 and 0.395)
      expect(empiricalRate).toBeGreaterThan(0.355);
      expect(empiricalRate).toBeLessThan(0.395);
    });
  });

  // ==========================================================================
  // SECTION 2: SPEECH PRONUNCIATION EVALUATION CHALLENGES
  // ==========================================================================
  describe('2. evaluateSpeechPronunciation Empirical Verification', () => {

    const wordShi: WordItem = {
      id: 'w-shi-hsk1',
      hanzi: '是',
      pinyin: 'shì',
      vietnamese: 'Là, phải, đúng',
      hskLevel: 1,
    };

    const wordNihao: WordItem = {
      id: 'w-nihao-hsk1',
      hanzi: '你好',
      pinyin: 'nǐ hǎo',
      vietnamese: 'Xin chào',
      hskLevel: 1,
    };

    const wordTa: WordItem = {
      id: 'w-ta-hsk1',
      hanzi: '他',
      pinyin: 'tā',
      vietnamese: 'Anh ấy',
      hskLevel: 1,
    };

    it('2.1: Stress test homophone pairs (是 vs 事/市/视/试/誓/室/适)', () => {
      const homophones = ['事', '市', '视', '试', '誓', '室', '适'];
      for (const hp of homophones) {
        const res = evaluateSpeechPronunciation(hp, wordShi);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(90);
        expect(res.matchedBy).toBe('pinyin_exact');
        expect(res.matchLevel).toBe('pinyin_exact');
      }

      // Exact character should still award 100
      const exactRes = evaluateSpeechPronunciation('是', wordShi);
      expect(exactRes.isCorrect).toBe(true);
      expect(exactRes.score).toBe(100);
      expect(exactRes.matchedBy).toBe('hanzi_exact');
    });

    it('2.2: Cross-character homophones (他 vs 她 vs 它)', () => {
      const homophonesTa = ['她', '它'];
      for (const hp of homophonesTa) {
        const res = evaluateSpeechPronunciation(hp, wordTa);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(90);
        expect(res.matchedBy).toBe('pinyin_exact');
      }
    });

    it('2.3: Tone insensitivity (nǐ hǎo vs ni hao)', () => {
      // Unaccented plain ASCII pinyin
      const resToneFree = evaluateSpeechPronunciation('ni hao', wordNihao);
      expect(resToneFree.isCorrect).toBe(true);
      expect(resToneFree.score).toBe(80);
      expect(resToneFree.matchedBy).toBe('pinyin_tone_insensitive');

      // Tone-marked pinyin
      const resToneMarked = evaluateSpeechPronunciation('nǐ hǎo', wordNihao);
      expect(resToneMarked.isCorrect).toBe(true);
      expect(resToneMarked.score).toBe(90);
      expect(resToneMarked.matchedBy).toBe('pinyin_exact');
    });

    it('2.3b: Numbered pinyin (ni3 hao3) matches tone-insensitively with score 80', () => {
      const resNumbered = evaluateSpeechPronunciation('ni3 hao3', wordNihao);
      expect(resNumbered.isCorrect).toBe(true);
      expect(resNumbered.score).toBe(80);
      expect(resNumbered.matchedBy).toBe('pinyin_tone_insensitive');
    });

    it('2.4: Partial speech carrier phrases ("我想说你好", "你说你好吗", "我觉得是")', () => {
      // Long carrier phrases containing the target word
      const phrases = [
        '我想说你好',
        '你说你好吗',
        '大家你好',
        '老师你好！',
      ];

      for (const phrase of phrases) {
        const res = evaluateSpeechPronunciation(phrase, wordNihao);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(95);
        expect(res.matchedBy).toBe('hanzi_contains');
        expect(res.matchLevel).toBe('hanzi_contains');
      }

      const resShiCarrier = evaluateSpeechPronunciation('我觉得是', wordShi);
      expect(resShiCarrier.isCorrect).toBe(true);
      expect(resShiCarrier.score).toBe(95);
      expect(resShiCarrier.matchedBy).toBe('hanzi_contains');
    });

    it('2.4b: Truncated word rejection - incomplete speech is rejected with score 0', () => {
      const wordDuiBuQi: WordItem = {
        id: 'w-duibuqi',
        hanzi: '对不起',
        pinyin: 'duì bu qǐ',
        vietnamese: 'Xin lỗi',
        hskLevel: 1,
      };

      // User only said 2 characters out of a 3 character word
      const partialRes = evaluateSpeechPronunciation('对不', wordDuiBuQi);
      expect(partialRes.isCorrect).toBe(false);
      expect(partialRes.score).toBe(0);
      expect(partialRes.matchedBy).toBe('none');
    });

    it('2.5: Negative testing - unrelated words, noise, empty strings, punctuation only', () => {
      const negativeInputs = [
        '苹果',           // unrelated Chinese word
        '谢谢',           // different common greeting
        'random noise',   // English text
        'blabla123',      // alphanumeric gibberish
        '',               // empty string
        '     ',          // spaces only
        '\t\n\r',         // whitespace escape chars
        '！？…',          // Chinese punctuation only
        '，。！？；：“”‘’（）《》【】…—、', // full set of Chinese punctuation
        '...,,,!!!???',   // Western punctuation only
      ];

      for (const neg of negativeInputs) {
        const res = evaluateSpeechPronunciation(neg, wordNihao);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(res.matchLevel).toBe('none');
        expect(isPronunciationAcceptable(neg, wordNihao)).toBe(false);
      }
    });

    it('2.6: Strict scoring ladder verification (100, 95, 90, 80, 0)', () => {
      // 100: hanzi_exact
      const score100 = evaluateSpeechPronunciation('你好', wordNihao);
      expect(score100.score).toBe(100);
      expect(score100.matchedBy).toBe('hanzi_exact');

      // 95: hanzi_contains
      const score95 = evaluateSpeechPronunciation('我想说你好', wordNihao);
      expect(score95.score).toBe(95);
      expect(score95.matchedBy).toBe('hanzi_contains');

      // 90: pinyin_exact (exact pinyin or homophone)
      const score90 = evaluateSpeechPronunciation('nǐ hǎo', wordNihao);
      expect(score90.score).toBe(90);
      expect(score90.matchedBy).toBe('pinyin_exact');

      // 80: pinyin_tone_insensitive
      const score80 = evaluateSpeechPronunciation('ni hao', wordNihao);
      expect(score80.score).toBe(80);
      expect(score80.matchedBy).toBe('pinyin_tone_insensitive');

      // 0: none
      const score0 = evaluateSpeechPronunciation('再见', wordNihao);
      expect(score0.score).toBe(0);
      expect(score0.matchedBy).toBe('none');
    });

    it('2.7: Target format flexibility - accepts WordItem, { hanzi, pinyin }, or plain string', () => {
      // WordItem
      const resWordItem = evaluateSpeechPronunciation('你好', wordNihao);
      expect(resWordItem.isCorrect).toBe(true);

      // Lightweight object
      const resObj = evaluateSpeechPronunciation('你好', { hanzi: '你好', pinyin: 'nǐ hǎo' });
      expect(resObj.isCorrect).toBe(true);
      expect(resObj.score).toBe(100);

      // Plain string
      const resStr = evaluateSpeechPronunciation('你好', '你好');
      expect(resStr.isCorrect).toBe(true);
      expect(resStr.score).toBe(100);
      expect(resStr.targetPinyin).toMatch(/nǐ\s*hǎo/);
    });

    it('2.8: Spacing and casing tolerance (full-width space, excessive whitespace, uppercase)', () => {
      // Full-width space (common in Asian IME input: \u3000)
      const resFullWidth = evaluateSpeechPronunciation('你好\u3000世界', { hanzi: '你好世界' });
      expect(resFullWidth.isCorrect).toBe(true);
      expect(resFullWidth.score).toBe(100);

      // Excessive whitespace in pinyin
      const resExcessSpace = evaluateSpeechPronunciation('   nǐ       hǎo   ', wordNihao);
      expect(resExcessSpace.isCorrect).toBe(true);
      expect(resExcessSpace.score).toBe(90);

      // Uppercase pinyin
      const resUpper = evaluateSpeechPronunciation('NI HAO', wordNihao);
      expect(resUpper.isCorrect).toBe(true);
      expect(resUpper.score).toBe(80);
    });

    it('2.9: Polyphone resolution via explicit target pinyin', () => {
      // Character 行 has multiple readings: xíng (walk, ok) vs háng (line, row)
      const wordXing: WordItem = {
        id: 'w-xing',
        hanzi: '行',
        pinyin: 'xíng',
        vietnamese: 'Được, đi',
        hskLevel: 1,
      };

      // Spoken as xíng (pinyin match)
      const resXing = evaluateSpeechPronunciation('xíng', wordXing);
      expect(resXing.isCorrect).toBe(true);
      expect(resXing.score).toBe(90);

      // Spoken as háng (mismatch)
      const resHang = evaluateSpeechPronunciation('háng', wordXing);
      expect(resHang.isCorrect).toBe(false);
      expect(resHang.score).toBe(0);
    });

    it('2.10: Noise resilience - emojis and symbols mixed with valid speech', () => {
      // Valid speech with emojis (e.g. mobile IME autocomplete emojis)
      // Emoji acts as conversational padding, matching Tier 2 hanzi_contains (score 95)
      const resEmoji = evaluateSpeechPronunciation('你好👋', wordNihao);
      expect(resEmoji.isCorrect).toBe(true);
      expect(resEmoji.score).toBe(95);
      expect(resEmoji.matchedBy).toBe('hanzi_contains');

      // Pure digits as noise against Chinese word
      const resDigits = evaluateSpeechPronunciation('1234567890', wordNihao);
      expect(resDigits.isCorrect).toBe(false);
      expect(resDigits.score).toBe(0);
    });
  });
});
