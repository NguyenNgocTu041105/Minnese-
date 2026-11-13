/**
 * tests/milestone2_challenger_re_1_empirical.test.ts
 *
 * Independent Empirical Verification and Adversarial Challenge Suite
 * Author: challenger_m2_re_1 (Empirical Challenger)
 *
 * Scope:
 * 1. Independent Verification of Milestone 2 Core Remediation Mandates:
 *    - shuffleArray([1, 2, 3], () => 1.0) produces [1, 2, 3] with 0 undefined values and length 3.
 *    - evaluateSpeechPronunciation('ni3 hao3', { hanzi: '你好', pinyin: 'nǐ hǎo' }) returns isCorrect: true, score >= 80.
 *    - evaluateSpeechPronunciation('对不', { hanzi: '对不起', pinyin: 'duì bu qǐ' }) returns isCorrect: false, score 0.
 *    - evaluateSpeechPronunciation('on', { hanzi: '中国', pinyin: 'zhōng guó' }) returns isCorrect: false, score 0.
 * 2. Deep Adversarial Boundary Testing:
 *    - Extreme boundary RNGs (1.0, 0.0, 0.999999, alternating extremes, >1.0 clamp robustness)
 *    - Array mutation immunity across 5,000 trials
 *    - Object.freeze() immutability with nested object references
 *    - Sub-syllables, phonetic fragments, and truncated words rejection
 *    - English homograph/substring injection attacks against short Chinese words
 *    - Conversational carrier phrases and punctuation normalization
 *    - Numbered pinyin variations (spacing, tone 0/5 neutral, multi-digit resilience)
 */

import { describe, it, expect } from 'vitest';
import { shuffleArray } from '../src/utils/shuffleUtils';
import {
  evaluateSpeechPronunciation,
  isPronunciationAcceptable,
  stripTones,
  normalizeChineseText,
  type EvalResult,
} from '../src/utils/pronunciationEval';
import type { WordItem } from '../src/types';

describe('Milestone 2 Re-Challenge: Independent Empirical Verification', () => {

  // ==========================================================================
  // MANDATORY SPECIFICATION CHECKS
  // ==========================================================================
  describe('A. Mandatory Verification Criteria', () => {

    it('A.1: Mandate 1 - shuffleArray([1, 2, 3], () => 1.0) produces [1, 2, 3] with 0 undefined values and length 3', () => {
      const input = [1, 2, 3];
      const maxRng = () => 1.0;
      const result = shuffleArray(input, maxRng);

      // Verify length is strictly 3 (no array expansion to length 4)
      expect(result.length).toBe(3);

      // Verify zero undefined or null elements
      expect(result.includes(undefined as unknown as number)).toBe(false);
      expect(result.every((x) => x !== undefined && x !== null)).toBe(true);

      // Verify exact identity permutation [1, 2, 3] produced by clamped self-swaps
      expect(result).toEqual([1, 2, 3]);

      // Verify input array was not mutated and result is a distinct reference
      expect(result).not.toBe(input);
      expect(input).toEqual([1, 2, 3]);
    });

    it('A.2: Mandate 2 - evaluateSpeechPronunciation("ni3 hao3", { hanzi: "你好", pinyin: "nǐ hǎo" }) returns isCorrect: true, score >= 80', () => {
      const target = { hanzi: '你好', pinyin: 'nǐ hǎo' };
      const res: EvalResult = evaluateSpeechPronunciation('ni3 hao3', target);

      expect(res.isCorrect).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(80);
      expect(res.score).toBe(80);
      expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      expect(res.matchLevel).toBe('pinyin_tone_insensitive');
      expect(isPronunciationAcceptable('ni3 hao3', target)).toBe(true);
    });

    it('A.3: Mandate 3 - evaluateSpeechPronunciation("对不", { hanzi: "对不起", pinyin: "duì bu qǐ" }) returns isCorrect: false, score 0', () => {
      const target = { hanzi: '对不起', pinyin: 'duì bu qǐ' };
      const res = evaluateSpeechPronunciation('对不', target);

      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
      expect(res.matchedBy).toBe('none');
      expect(res.matchLevel).toBe('none');
      expect(isPronunciationAcceptable('对不', target)).toBe(false);
    });

    it('A.4: Mandate 4 - evaluateSpeechPronunciation("on", { hanzi: "中国", pinyin: "zhōng guó" }) returns isCorrect: false, score 0', () => {
      const target = { hanzi: '中国', pinyin: 'zhōng guó' };
      const res = evaluateSpeechPronunciation('on', target);

      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
      expect(res.matchedBy).toBe('none');
      expect(res.matchLevel).toBe('none');
      expect(isPronunciationAcceptable('on', target)).toBe(false);
    });
  });

  // ==========================================================================
  // ADVERSARIAL STRESS: SHUFFLE UTILITY CORNER CASES
  // ==========================================================================
  describe('B. Adversarial Stress: Shuffle Utility', () => {

    it('B.1: Boundary Clamp Safety under extreme RNG values (0.0, 0.999999, 1.0, and simulated >1.0 overflow)', () => {
      const input = ['A', 'B', 'C', 'D'];

      // RNG === 0.0: deterministic shift
      const resMin = shuffleArray(input, () => 0.0);
      expect(resMin.length).toBe(4);
      expect(resMin.includes(undefined as unknown as string)).toBe(false);
      expect([...resMin].sort()).toEqual([...input].sort());

      // RNG === 0.999999999999999: near 1.0
      const resNear1 = shuffleArray(input, () => 0.999999999999999);
      expect(resNear1.length).toBe(4);
      expect(resNear1.includes(undefined as unknown as string)).toBe(false);
      expect(resNear1).toEqual(['A', 'B', 'C', 'D']);

      // RNG === 1.0: exact boundary
      const res1 = shuffleArray(input, () => 1.0);
      expect(res1.length).toBe(4);
      expect(res1.includes(undefined as unknown as string)).toBe(false);
      expect(res1).toEqual(['A', 'B', 'C', 'D']);

      // RNG > 1.0: clamp safety against aberrant custom RNGs (e.g. 1.25)
      const resOver = shuffleArray(input, () => 1.25);
      expect(resOver.length).toBe(4);
      expect(resOver.includes(undefined as unknown as string)).toBe(false);
      expect(resOver).toEqual(['A', 'B', 'C', 'D']);
    });

    it('B.2: 5,000 trials of random shuffles with Object.freeze() and complex element payload', () => {
      const originalPayload = Object.freeze([
        Object.freeze({ id: 1, hanzi: '你好', tags: Object.freeze(['greeting', 'hsk1']) }),
        Object.freeze({ id: 2, hanzi: '再见', tags: Object.freeze(['farewell', 'hsk1']) }),
        Object.freeze({ id: 3, hanzi: '谢谢', tags: Object.freeze(['polite', 'hsk1']) }),
        Object.freeze({ id: 4, hanzi: '对不起', tags: Object.freeze(['apology', 'hsk1']) }),
        Object.freeze({ id: 5, hanzi: '中国', tags: Object.freeze(['country', 'hsk1']) }),
      ]);

      const baselineIds = originalPayload.map((x) => x.id).sort();

      for (let trial = 0; trial < 5000; trial++) {
        const shuffled = shuffleArray(originalPayload);
        expect(shuffled).not.toBe(originalPayload);
        expect(shuffled.length).toBe(5);
        const shuffledIds = shuffled.map((x) => x.id).sort();
        expect(shuffledIds).toEqual(baselineIds);
      }
    });

    it('B.3: Edge case elements - falsy values (0, false, null, undefined, "") preserved correctly', () => {
      const falsyInput = [0, false, null, undefined, ''];
      const shuffled = shuffleArray(falsyInput, () => 0.5);

      expect(shuffled.length).toBe(5);
      expect(shuffled).toContain(0);
      expect(shuffled).toContain(false);
      expect(shuffled).toContain(null);
      expect(shuffled).toContain(undefined);
      expect(shuffled).toContain('');
    });
  });

  // ==========================================================================
  // ADVERSARIAL STRESS: PRONUNCIATION EVALUATION ATTACK VECTORS
  // ==========================================================================
  describe('C. Adversarial Stress: Pronunciation Evaluation Attack Vectors', () => {

    const wordZhongguo: WordItem = {
      id: 'w-zhongguo',
      hanzi: '中国',
      pinyin: 'zhōng guó',
      vietnamese: 'Trung Quốc',
      hskLevel: 1,
    };

    const wordDuibuqi: WordItem = {
      id: 'w-duibuqi',
      hanzi: '对不起',
      pinyin: 'duì bu qǐ',
      vietnamese: 'Xin lỗi',
      hskLevel: 1,
    };

    const wordTushuguan: WordItem = {
      id: 'w-tushuguan',
      hanzi: '图书馆',
      pinyin: 'tú shū guǎn',
      vietnamese: 'Thư viện',
      hskLevel: 2,
    };

    const wordEr: WordItem = {
      id: 'w-er',
      hanzi: '二',
      pinyin: 'èr',
      vietnamese: 'Hai',
      hskLevel: 1,
    };

    const wordTa: WordItem = {
      id: 'w-ta',
      hanzi: '他',
      pinyin: 'tā',
      vietnamese: 'Anh ấy',
      hskLevel: 1,
    };

    it('C.1: Sub-syllable & fragment attack matrix strictly rejected with score 0', () => {
      const fragments = [
        // Sub-syllables of 'zhongguo'
        'on', 'go', 'ng', 'zh', 'ong', 'hon', 'gu', 'uo',
        // Single characters of multi-character word
        '中', '国',
        // Sub-syllables of 'duibuqi'
        'dui', 'bu', 'qi', 'du', 'ui', 'iq',
        // Incomplete prefixes
        '对不', '不起', '对',
        // Incomplete prefixes of '图书馆'
        '图书', '书馆', '馆',
      ];

      for (const frag of ['on', 'go', 'ng', 'zh', 'ong', 'hon', 'gu', 'uo', '中', '国']) {
        const res = evaluateSpeechPronunciation(frag, wordZhongguo);
        expect(res.isCorrect, `Fragment "${frag}" should be rejected for 中国`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }

      for (const frag of ['dui', 'bu', 'qi', 'du', 'ui', 'iq', '对不', '不起', '对']) {
        const res = evaluateSpeechPronunciation(frag, wordDuibuqi);
        expect(res.isCorrect, `Fragment "${frag}" should be rejected for 对不起`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }

      for (const frag of ['图书', '书馆', '馆']) {
        const res = evaluateSpeechPronunciation(frag, wordTushuguan);
        expect(res.isCorrect, `Fragment "${frag}" should be rejected for 图书馆`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('C.2: English word substring infiltration attacks rejected with score 0', () => {
      // Attacks against 'èr' (二)
      const englishWordsEr = ['computer', 'water', 'silver', 'paper', 'river', 'player', 'teacher'];
      for (const w of englishWordsEr) {
        const res = evaluateSpeechPronunciation(w, wordEr);
        expect(res.isCorrect, `English word "${w}" should not match "二"`).toBe(false);
        expect(res.score).toBe(0);
      }

      // Attacks against 'tā' (他)
      const englishWordsTa = ['table', 'star', 'guitar', 'digital', 'metallic', 'contact'];
      for (const w of englishWordsTa) {
        const res = evaluateSpeechPronunciation(w, wordTa);
        expect(res.isCorrect, `English word "${w}" should not match "他"`).toBe(false);
        expect(res.score).toBe(0);
      }
    });

    it('C.3: Legitimate whole-word English pinyin entry accepted', () => {
      // If user inputs the exact pinyin word 'er' or 'ta', it is legitimate Tier 4 match
      const resEr = evaluateSpeechPronunciation('er', wordEr);
      expect(resEr.isCorrect).toBe(true);
      expect(resEr.score).toBe(80);

      const resTa = evaluateSpeechPronunciation('ta', wordTa);
      expect(resTa.isCorrect).toBe(true);
      expect(resTa.score).toBe(80);
    });

    it('C.4: Numbered Pinyin comprehensive variations (spaced, unspaced, neutral 5, neutral 0)', () => {
      const targetNihao = { hanzi: '你好', pinyin: 'nǐ hǎo' };

      // Spaced
      expect(evaluateSpeechPronunciation('ni3 hao3', targetNihao).score).toBe(80);
      // Unspaced
      expect(evaluateSpeechPronunciation('ni3hao3', targetNihao).score).toBe(80);
      // Extra spaces between digits
      expect(evaluateSpeechPronunciation('ni 3 hao 3', targetNihao).score).toBe(80);

      // Neutral tones with tone 5 or 0
      const targetXiexie = { hanzi: '谢谢', pinyin: 'xiè xie' };
      expect(evaluateSpeechPronunciation('xie4 xie5', targetXiexie).score).toBe(80);
      expect(evaluateSpeechPronunciation('xie4 xie0', targetXiexie).score).toBe(80);
      expect(evaluateSpeechPronunciation('xie4 xie', targetXiexie).score).toBe(80);
    });

    it('C.5: Carrier phrases containing complete targets strictly pass with score 95', () => {
      const targetNihao = { hanzi: '你好', pinyin: 'nǐ hǎo' };

      const carrierPhrases = [
        '老师你好！',
        '我想说你好',
        '你说你好吗',
        '大家你好呀',
        '你好我的朋友',
      ];

      for (const phrase of carrierPhrases) {
        const res = evaluateSpeechPronunciation(phrase, targetNihao);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(95);
        expect(res.matchedBy).toBe('hanzi_contains');
      }

      // Carrier phrase for 3-character word
      const resDuibuqi = evaluateSpeechPronunciation('真的对不起大家', wordDuibuqi);
      expect(resDuibuqi.isCorrect).toBe(true);
      expect(resDuibuqi.score).toBe(95);
      expect(resDuibuqi.matchedBy).toBe('hanzi_contains');
    });

    it('C.6: Invisible and special punctuation tolerance (zero-width spaces, full-width quotes, tildes)', () => {
      const target = { hanzi: '你好', pinyin: 'nǐ hǎo' };

      // Zero-width space
      const resZws = evaluateSpeechPronunciation('你\u200B好', target);
      expect(resZws.isCorrect).toBe(true);
      expect(resZws.score).toBe(100);

      // BOM character
      const resBom = evaluateSpeechPronunciation('\uFEFF你好', target);
      expect(resBom.isCorrect).toBe(true);
      expect(resBom.score).toBe(100);

      // Corner brackets and curly quotes
      const resQuotes = evaluateSpeechPronunciation('「你好」', target);
      expect(resQuotes.isCorrect).toBe(true);
      expect(resQuotes.score).toBe(100);

      // Tilde
      const resTilde = evaluateSpeechPronunciation('你好～', target);
      expect(resTilde.isCorrect).toBe(true);
      expect(resTilde.score).toBe(100);
    });
  });
});
