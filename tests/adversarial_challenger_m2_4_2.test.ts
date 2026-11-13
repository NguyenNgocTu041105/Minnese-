/**
 * tests/adversarial_challenger_m2_4_2.test.ts
 *
 * Empirical Adversarial Challenger Test Suite for Milestone 2 Iteration 4:
 * Focus: Carrier Phrase Boundaries, Diacritics, Numbers, Punctuations,
 * Whitespaces, Multi-character Truncation Rejection, and Shuffle Utility Integrity.
 */

import { describe, it, expect } from 'vitest';
import type { WordItem } from '../src/types';
import {
  evaluateSpeechPronunciation,
  isPronunciationAcceptable,
  normalizeChineseText,
  stripTones,
  sanitizePinyinForComparison,
} from '../src/utils/pronunciationEval';
import { shuffleArray } from '../src/utils/shuffleUtils';

describe('Empirical Adversarial Challenge: Milestone 2 Iteration 4', () => {
  // Vocabulary fixtures
  const wordTing: WordItem = {
    id: 'w-ting',
    hanzi: '听',
    pinyin: 'tīng',
    vietnamese: 'Nghe',
    hskLevel: 1,
  };

  const wordMang: WordItem = {
    id: 'w-mang',
    hanzi: '忙',
    pinyin: 'máng',
    vietnamese: 'Bận',
    hskLevel: 1,
  };

  const wordLeng: WordItem = {
    id: 'w-leng',
    hanzi: '冷',
    pinyin: 'lěng',
    vietnamese: 'Lạnh',
    hskLevel: 1,
  };

  const wordBang: WordItem = {
    id: 'w-bang',
    hanzi: '帮',
    pinyin: 'bāng',
    vietnamese: 'Giúp đỡ',
    hskLevel: 2,
  };

  const wordNihao: WordItem = {
    id: 'w-nihao',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    vietnamese: 'Xin chào',
    hskLevel: 1,
  };

  const wordXiexie: WordItem = {
    id: 'w-xiexie',
    hanzi: '谢谢',
    pinyin: 'xiè xie',
    vietnamese: 'Cảm ơn',
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

  const wordGonggongqiche: WordItem = {
    id: 'w-gonggongqiche',
    hanzi: '公共汽车',
    pinyin: 'gōng gòng qì chē',
    vietnamese: 'Xe buýt',
    hskLevel: 2,
  };

  const wordTingyinyue: WordItem = {
    id: 'w-tingyinyue',
    hanzi: '听音乐',
    pinyin: 'tīng yīn yuè',
    vietnamese: 'Nghe nhạc',
    hskLevel: 1,
  };

  // ==========================================================================
  // SECTION 1: cleanSpacedTranscript Edge Cases in Conversational Phrases
  // ==========================================================================
  describe('1. cleanSpacedTranscript Edge Cases in Conversational Phrases', () => {

    // 1.1 Tone Diacritics in Phrases
    it('1.1: Accepts carrier phrases containing tone diacritics for single and multi-char words', () => {
      const toneDiacriticPhrases = [
        // Single character target "听" (tīng)
        { phrase: 'wǒ tīng dào le', target: wordTing },
        { phrase: 'nǐ tīng wǒ shuō', target: wordTing },
        { phrase: 'qǐng tīng', target: wordTing },
        { phrase: 'tā zài tīng', target: wordTing },
        { phrase: 'wǒmen tīng yīnyuè', target: wordTing },

        // Single character target "忙" (máng)
        { phrase: 'tā hěn máng', target: wordMang },
        { phrase: 'wǒ bù máng', target: wordMang },
        { phrase: 'nǐ máng ma', target: wordMang },

        // Single character target "冷" (lěng)
        { phrase: 'jīntiān hěn lěng', target: wordLeng },
        { phrase: 'wǒ bù lěng', target: wordLeng },

        // Single character target "帮" (bāng)
        { phrase: 'wǒ bāng nǐ', target: wordBang },
        { phrase: 'qǐng bāng wǒ', target: wordBang },

        // Multi-character target "你好" (nǐ hǎo)
        { phrase: 'wǒ shuō nǐ hǎo', target: wordNihao },
        { phrase: 'lǎoshī nǐ hǎo', target: wordNihao },
        { phrase: 'dàjiā nǐ hǎo', target: wordNihao },

        // Multi-character target "图书馆" (tú shū guǎn)
        { phrase: 'wǒmen qù tú shū guǎn', target: wordTushuguan },
        { phrase: 'zài tú shū guǎn kàn shū', target: wordTushuguan },

        // Multi-character target "听音乐" (tīng yīn yuè)
        { phrase: 'wǒ xǐhuān tīng yīn yuè', target: wordTingyinyue },
      ];

      for (const item of toneDiacriticPhrases) {
        const res = evaluateSpeechPronunciation(item.phrase, item.target);
        expect(res.isCorrect, `Failed for phrase "${item.phrase}" against "${item.target.hanzi}"`).toBe(true);
        expect(res.score).toBeGreaterThanOrEqual(80);
      }
    });

    // 1.2 Tone Numbers in Phrases
    it('1.2: Accepts carrier phrases containing tone numbers (1-5/0) for single and multi-char words', () => {
      const toneNumberedPhrases = [
        // Single character target "听" (tīng)
        { phrase: 'wo3 ting1 dao4 le', target: wordTing },
        { phrase: 'ni3 ting1 wo3 shuo1', target: wordTing },
        { phrase: 'qing3 ting1', target: wordTing },
        { phrase: 'ting1 dao4 le', target: wordTing },
        { phrase: 'wo3 yao4 ting1', target: wordTing },

        // Single character target "忙" (máng)
        { phrase: 'ta1 hen3 mang2', target: wordMang },
        { phrase: 'wo3 bu4 mang2', target: wordMang },
        { phrase: 'ni3 mang2 ma5', target: wordMang },

        // Single character target "冷" (lěng)
        { phrase: 'jin1 tian1 hen3 leng3', target: wordLeng },
        { phrase: 'wo3 bu4 leng3', target: wordLeng },

        // Single character target "帮" (bāng)
        { phrase: 'wo3 bang1 ni3', target: wordBang },

        // Multi-character target "你好" (nǐ hǎo)
        { phrase: 'wo3 shuo1 ni3 hao3', target: wordNihao },
        { phrase: 'ni3 hao3 ma5', target: wordNihao },
        { phrase: 'da4 jia1 ni3 hao3', target: wordNihao },

        // Multi-character target "谢谢" (xiè xie with neutral tone 5 or 0)
        { phrase: 'xie4 xie5 ni3', target: wordXiexie },
        { phrase: 'xie4 xie0 ni3', target: wordXiexie },
        { phrase: 'duo1 xie4 xie', target: wordXiexie },

        // Multi-character target "对不起" (duì bu qǐ)
        { phrase: 'dui4 bu5 qi3 a5', target: wordDuibuqi },
        { phrase: 'zhen1 de5 dui4 bu5 qi3', target: wordDuibuqi },

        // Multi-character target "图书馆" (tú shū guǎn)
        { phrase: 'wo3 men5 qu4 tu2 shu1 guan3', target: wordTushuguan },
      ];

      for (const item of toneNumberedPhrases) {
        const res = evaluateSpeechPronunciation(item.phrase, item.target);
        expect(res.isCorrect, `Failed for phrase "${item.phrase}" against "${item.target.hanzi}"`).toBe(true);
        expect(res.score).toBeGreaterThanOrEqual(80);
      }
    });

    // 1.3 Punctuation Attached to Target Word
    it('1.3: Cleanly removes leading, trailing, surrounding, and embedded Western and Chinese punctuation', () => {
      const punctuationPhrases = [
        // Comma attached
        { phrase: 'wo ting, dao le', target: wordTing },
        { phrase: 'ting, dao le', target: wordTing },
        { phrase: 'wo, ting, dao, le', target: wordTing },

        // Exclamation / question marks
        { phrase: 'ting!', target: wordTing },
        { phrase: 'ting?', target: wordTing },
        { phrase: 'wo ting! dao le', target: wordTing },
        { phrase: 'ting! dao le', target: wordTing },

        // Ellipsis
        { phrase: 'ting... dao le', target: wordTing },
        { phrase: 'wo ting... dao le', target: wordTing },
        { phrase: 'ting...', target: wordTing },

        // Chinese punctuation
        { phrase: 'wo ting，dao le', target: wordTing },
        { phrase: 'wo ting！dao le', target: wordTing },
        { phrase: 'wo ting…… dao le', target: wordTing },
        { phrase: '“ting”', target: wordTing },
        { phrase: '‘ting’', target: wordTing },
        { phrase: '（ting）', target: wordTing },
        { phrase: '【ting】', target: wordTing },
        { phrase: '《ting》', target: wordTing },

        // Quotes and brackets
        { phrase: '"ting"', target: wordTing },
        { phrase: "'ting'", target: wordTing },
        { phrase: '(ting)', target: wordTing },
        { phrase: '[ting]', target: wordTing },

        // Multi-word with attached punctuation
        { phrase: 'ni, hao!', target: wordNihao },
        { phrase: 'wo shuo: "ni hao!"', target: wordNihao },
        { phrase: 'tu shu guan, zai na li?', target: wordTushuguan },
        { phrase: 'dui bu qi... a!', target: wordDuibuqi },
      ];

      for (const item of punctuationPhrases) {
        const res = evaluateSpeechPronunciation(item.phrase, item.target);
        expect(res.isCorrect, `Failed for phrase "${item.phrase}" against "${item.target.hanzi}"`).toBe(true);
        expect(res.score).toBeGreaterThanOrEqual(80);
      }
    });

    // 1.4 Whitespace Normalization (Multi-space, Unicode whitespace, Zero-width spaces)
    it('1.4: Handles multi-spaces, tabs, newlines, Unicode spaces, and zero-width spaces defensively', () => {
      const whitespacePhrases = [
        // Multi-space (spaces > 1)
        { phrase: 'wo    ting     dao    le', target: wordTing },
        { phrase: '   ting   ', target: wordTing },
        { phrase: 'wo   shuo   ni   hao', target: wordNihao },

        // Tabs and newlines
        { phrase: 'wo\tting\ndao\r\nle', target: wordTing },
        { phrase: '\n\nting\n\n', target: wordTing },

        // Unicode whitespace: Non-Breaking Space NBSP (\u00A0)
        { phrase: 'wo\u00A0ting\u00A0dao\u00A0le', target: wordTing },
        { phrase: '\u00A0ting\u00A0', target: wordTing },

        // Unicode whitespace: Ideographic Space / Full-width (\u3000)
        { phrase: 'wo\u3000ting\u3000dao\u3000le', target: wordTing },
        { phrase: '\u3000ting\u3000', target: wordTing },

        // Unicode whitespace: En Space (\u2002), Em Space (\u2003), Thin Space (\u2009)
        { phrase: 'wo\u2002ting\u2002dao\u2002le', target: wordTing },
        { phrase: 'wo\u2003ting\u2003dao\u2003le', target: wordTing },
        { phrase: 'wo\u2009ting\u2009dao\u2009le', target: wordTing },

        // Zero-Width Spaces: ZWSP (\u200B) and BOM / ZWNBSP (\uFEFF)
        { phrase: '\uFEFFwo ting dao le\uFEFF', target: wordTing },
        { phrase: 'wo \u200B ting \u200B dao le', target: wordTing },
        { phrase: '\u200Bting\u200B', target: wordTing },
        { phrase: '\uFEFFni hao\uFEFF', target: wordNihao },
      ];

      for (const item of whitespacePhrases) {
        const res = evaluateSpeechPronunciation(item.phrase, item.target);
        expect(res.isCorrect, `Failed for whitespace phrase "${item.phrase}" against "${item.target.hanzi}"`).toBe(true);
        expect(res.score).toBeGreaterThanOrEqual(80);
      }
    });

    // 1.5 Positional Variations & Mixed Diacritic/Numbered Carrier Phrases
    it('1.5: Accepts target words at start, middle, and end with mixed diacritics and numbers', () => {
      const mixedPositionPhrases = [
        // Beginning of phrase
        { phrase: 'ting, wo shuo ni ting dao le ma', target: wordTing },
        { phrase: 'tīng! dàjiā qǐng tīng', target: wordTing },
        { phrase: 'ting1, wo3 ting1 dao4 le', target: wordTing },

        // Middle of phrase
        { phrase: 'wǒ ting1 dào le', target: wordTing },
        { phrase: 'ta1 hěn máng', target: wordMang },
        { phrase: 'jīntiān bu4 lěng', target: wordLeng },

        // End of phrase
        { phrase: 'nǐ yào tīng', target: wordTing },
        { phrase: 'ni3 yao4 ting1', target: wordTing },
        { phrase: 'wo3 men5 bu4 máng', target: wordMang },
        { phrase: 'tā bù lěng', target: wordLeng },

        // Multi-character words at different positions
        { phrase: 'nǐ hǎo, lǎoshī', target: wordNihao },
        { phrase: 'lǎoshī, nǐ hǎo', target: wordNihao },
        { phrase: 'wǒ xiǎng shuō nǐ hǎo', target: wordNihao },
      ];

      for (const item of mixedPositionPhrases) {
        const res = evaluateSpeechPronunciation(item.phrase, item.target);
        expect(res.isCorrect, `Failed for mixed phrase "${item.phrase}" against "${item.target.hanzi}"`).toBe(true);
        expect(res.score).toBeGreaterThanOrEqual(80);
      }
    });
  });

  // ==========================================================================
  // SECTION 2: Truncation and Substring False Match Rejection
  // ==========================================================================
  describe('2. Truncation and Substring False Match Rejection', () => {

    it('2.1: Strictly rejects truncated prefixes and suffixes of "对不起" (duì bu qǐ)', () => {
      const invalidTruncationsDuibuqi = [
        'duibu',
        'dui bu',
        'buqi',
        'bu qi',
        'duibuq',
        'dui',
        'bu',
        'qi',
        '对不',
        '不起',
        '对',
        '起',
        'wo shuo duibu',
        'zhen de duibu',
        'buqi le',
      ];

      for (const item of invalidTruncationsDuibuqi) {
        const res = evaluateSpeechPronunciation(item, wordDuibuqi);
        expect(res.isCorrect, `Truncation "${item}" should NOT match "对不起"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(isPronunciationAcceptable(item, wordDuibuqi)).toBe(false);
      }
    });

    it('2.2: Strictly rejects truncated prefixes and suffixes of "图书馆" (tú shū guǎn)', () => {
      const invalidTruncationsTushuguan = [
        'tushu',
        'tu shu',
        'shuguan',
        'shu guan',
        'tushug',
        'tu',
        'shu',
        'guan',
        '图书',
        '书馆',
        'qu tu shu',
        'zhe shi tushu',
      ];

      for (const item of invalidTruncationsTushuguan) {
        const res = evaluateSpeechPronunciation(item, wordTushuguan);
        expect(res.isCorrect, `Truncation "${item}" should NOT match "图书馆"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(isPronunciationAcceptable(item, wordTushuguan)).toBe(false);
      }
    });

    it('2.3: Strictly rejects truncated prefixes and suffixes of "公共汽车" (gōng gòng qì chē)', () => {
      const invalidTruncationsBus = [
        'gonggong',
        'gong gong',
        'qiche',
        'qi che',
        'gonggongqi',
        'gonggong qi',
        'gong',
        'che',
        '公共',
        '汽车',
        '公共汽',
        'zuo gong gong',
      ];

      for (const item of invalidTruncationsBus) {
        const res = evaluateSpeechPronunciation(item, wordGonggongqiche);
        expect(res.isCorrect, `Truncation "${item}" should NOT match "公共汽车"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(isPronunciationAcceptable(item, wordGonggongqiche)).toBe(false);
      }
    });

    it('2.4: Strictly rejects single syllables or single characters for 2-character words ("你好", "谢谢")', () => {
      // "你好" (nǐ hǎo)
      const invalidNihao = ['ni', 'hao', '你', '好', 'nih', 'ha'];
      for (const item of invalidNihao) {
        const res = evaluateSpeechPronunciation(item, wordNihao);
        expect(res.isCorrect, `Partial "${item}" should NOT match "你好"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }

      // "谢谢" (xiè xie)
      const invalidXiexie = ['xie', '谢', 'xiex'];
      for (const item of invalidXiexie) {
        const res = evaluateSpeechPronunciation(item, wordXiexie);
        expect(res.isCorrect, `Partial "${item}" should NOT match "谢谢"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('2.5: Strictly rejects English words containing pinyin substrings against single-character words', () => {
      const englishNoiseAgainstSingle = [
        // ting (听)
        { noise: 'meeting', target: wordTing },
        { noise: 'waiting', target: wordTing },
        { noise: 'eating', target: wordTing },
        { noise: 'painting', target: wordTing },
        { noise: 'starting', target: wordTing },
        { noise: 'tings', target: wordTing },

        // leng (冷)
        { noise: 'length', target: wordLeng },
        { noise: 'challenge', target: wordLeng },
        { noise: 'lengthen', target: wordLeng },

        // mang (忙)
        { noise: 'mango', target: wordMang },
        { noise: 'management', target: wordMang },
        { noise: 'manger', target: wordMang },

        // bang (帮)
        { noise: 'bangkok', target: wordBang },
        { noise: 'banging', target: wordBang },
        { noise: 'banger', target: wordBang },
      ];

      for (const item of englishNoiseAgainstSingle) {
        const res = evaluateSpeechPronunciation(item.noise, item.target);
        expect(res.isCorrect, `Noise "${item.noise}" should NOT match "${item.target.hanzi}"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('2.6: Strictly rejects English vocabulary against multi-character words', () => {
      const englishNoiseMulti = [
        { noise: 'library', target: wordTushuguan },
        { noise: 'nightclub', target: wordNihao },
        { noise: 'auditorium', target: wordGonggongqiche },
        { noise: 'production', target: wordDuibuqi },
        { noise: 'music', target: wordTingyinyue },
      ];

      for (const item of englishNoiseMulti) {
        const res = evaluateSpeechPronunciation(item.noise, item.target);
        expect(res.isCorrect, `Noise "${item.noise}" should NOT match "${item.target.hanzi}"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('2.7: Strictly rejects interstitial omissions in multi-character words', () => {
      const interstitialOmissions = [
        // "对不起" missing '不' or '对'
        { transcript: '对起', target: wordDuibuqi },
        { transcript: 'duiqi', target: wordDuibuqi },
        { transcript: 'dui qi', target: wordDuibuqi },

        // "图书馆" missing '书' or '图'
        { transcript: '图馆', target: wordTushuguan },
        { transcript: 'tuguan', target: wordTushuguan },
        { transcript: 'tu guan', target: wordTushuguan },

        // "公共汽车" missing characters
        { transcript: '公汽车', target: wordGonggongqiche },
        { transcript: '公共车', target: wordGonggongqiche },
        { transcript: 'gongqiche', target: wordGonggongqiche },
        { transcript: 'gonggongche', target: wordGonggongqiche },

        // "听音乐" missing '音'
        { transcript: '听乐', target: wordTingyinyue },
        { transcript: 'tingyue', target: wordTingyinyue },
      ];

      for (const item of interstitialOmissions) {
        const res = evaluateSpeechPronunciation(item.transcript, item.target);
        expect(res.isCorrect, `Omission "${item.transcript}" should NOT match "${item.target.hanzi}"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('2.8: Strictly rejects English compound words with embedded pinyin syllables', () => {
      const englishCompounds = [
        // ting (听) embedded in English words
        { word: 'something', target: wordTing },
        { word: 'anything', target: wordTing },
        { word: 'everything', target: wordTing },
        { word: 'nothing', target: wordTing },
        { word: 'winter', target: wordTing },
        { word: 'finger', target: wordTing },

        // mang (忙) embedded in English words
        { word: 'boomerang', target: wordMang },
        { word: 'manganese', target: wordMang },

        // bang (帮) embedded in English words
        { word: 'harangue', target: wordBang },
        { word: 'bangle', target: wordBang },
      ];

      for (const item of englishCompounds) {
        const res = evaluateSpeechPronunciation(item.word, item.target);
        expect(res.isCorrect, `English compound "${item.word}" should NOT match "${item.target.hanzi}"`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });
  });

  // ==========================================================================
  // SECTION 3: shuffleArray Immutability, Randomness & Boundary Robustness
  // ==========================================================================
  describe('3. shuffleArray Immutability, Randomness & Boundary Robustness', () => {

    it('3.1: Immutability - original array reference and element order remain unmodified', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const copy = [...original];

      const shuffled = shuffleArray(original);

      expect(shuffled).not.toBe(original);
      expect(original).toEqual(copy);
      expect(shuffled.length).toBe(original.length);
      expect([...shuffled].sort((a, b) => a - b)).toEqual(copy);
    });

    it('3.2: Immutability - works safely on Object.freeze() arrays without throwing TypeError', () => {
      const frozenVocab = Object.freeze([wordTing, wordMang, wordLeng, wordBang, wordNihao]);
      expect(() => shuffleArray(frozenVocab)).not.toThrow();

      const shuffled = shuffleArray(frozenVocab);
      expect(shuffled).not.toBe(frozenVocab);
      expect(shuffled.length).toBe(5);
      expect(shuffled.map((w) => w.id).sort()).toEqual(frozenVocab.map((w) => w.id).sort());
    });

    it('3.3: Boundary Safety - handles empty, single-element, null, and undefined arrays gracefully', () => {
      const empty: number[] = [];
      const resEmpty = shuffleArray(empty);
      expect(resEmpty).toEqual([]);
      expect(resEmpty).not.toBe(empty);

      const single = [42];
      const resSingle = shuffleArray(single);
      expect(resSingle).toEqual([42]);
      expect(resSingle).not.toBe(single);

      expect(shuffleArray(null as unknown as readonly number[])).toEqual([]);
      expect(shuffleArray(undefined as unknown as readonly number[])).toEqual([]);
    });

    it('3.4: Custom RNG Bounds - rng() returning 1.0 is clamped cleanly to i and produces 0 undefined items', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const maxRng = () => 1.0;

      const res = shuffleArray(items, maxRng);
      expect(res.length).toBe(items.length);
      expect(res).toEqual(items);
      for (const item of res) {
        expect(item).toBeDefined();
        expect(item).not.toBeUndefined();
      }

      // Large array test with max RNG
      const large = Array.from({ length: 500 }, (_, i) => i);
      const resLarge = shuffleArray(large, maxRng);
      expect(resLarge.length).toBe(500);
      expect(resLarge.every((v) => v !== undefined)).toBe(true);
    });

    it('3.5: Custom RNG Bounds - rng() returning 0.0 executes valid permutation without errors', () => {
      const items = [1, 2, 3, 4];
      const minRng = () => 0.0;

      const res = shuffleArray(items, minRng);
      expect(res.length).toBe(4);
      expect(res.every((v) => v !== undefined)).toBe(true);
      expect([...res].sort()).toEqual([1, 2, 3, 4]);
    });

    it('3.6: Statistical Randomness - Chi-Square Goodness-of-Fit test across 6,000 trials (N=3, df=5)', () => {
      const input = [1, 2, 3];
      const counts: Record<string, number> = {
        '1,2,3': 0,
        '1,3,2': 0,
        '2,1,3': 0,
        '2,3,1': 0,
        '3,1,2': 0,
        '3,2,1': 0,
      };

      const trials = 6000;
      const expected = trials / 6; // 1,000 per permutation

      for (let i = 0; i < trials; i++) {
        const shuffled = shuffleArray(input);
        const key = shuffled.join(',');
        counts[key] = (counts[key] || 0) + 1;
      }

      let chiSquare = 0;
      for (const key of Object.keys(counts)) {
        const obs = counts[key];
        chiSquare += Math.pow(obs - expected, 2) / expected;
      }

      // For df = 5 (6 outcomes - 1), critical value at alpha = 0.001 is 20.515
      expect(chiSquare).toBeLessThan(20.515);
    });

    it('3.7: Statistical Position Uniformity - Position distribution across 10,000 trials (N=4)', () => {
      const input = ['A', 'B', 'C', 'D'];
      const n = input.length;
      const trials = 10000;
      const expectedPerCell = trials / n; // 2,500

      // Matrix: counts[element][position]
      const matrix: Record<string, number[]> = {
        A: [0, 0, 0, 0],
        B: [0, 0, 0, 0],
        C: [0, 0, 0, 0],
        D: [0, 0, 0, 0],
      };

      for (let t = 0; t < trials; t++) {
        const shuffled = shuffleArray(input);
        for (let pos = 0; pos < n; pos++) {
          matrix[shuffled[pos]][pos]++;
        }
      }

      // Check that each element appears in each position roughly 25% of the time (+/- 15% tolerance)
      for (const elem of input) {
        for (let pos = 0; pos < n; pos++) {
          const count = matrix[elem][pos];
          expect(count).toBeGreaterThan(expectedPerCell * 0.85);
          expect(count).toBeLessThan(expectedPerCell * 1.15);
        }
      }
    });

    it('3.8: Performance Stress - Shuffles 10,000 items in < 25ms', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `item-${i}` }));
      const start = performance.now();
      const res = shuffleArray(largeArray);
      const elapsed = performance.now() - start;

      expect(res.length).toBe(10000);
      expect(res[0]).toBeDefined();
      expect(elapsed).toBeLessThan(25);
    });

    it('3.9: Multiset Invariant & Element Integrity - 50,000 items with non-mutation guarantee', () => {
      const original = Array.from({ length: 1000 }, (_, i) => ({ id: `word-${i}`, val: i * 2 }));
      const snapshot = original.map((w) => ({ ...w }));

      const shuffled = shuffleArray(original);

      expect(shuffled).not.toBe(original);
      expect(original).toEqual(snapshot);
      expect(shuffled.length).toBe(1000);
      expect(shuffled.map((w) => w.id).sort()).toEqual(snapshot.map((w) => w.id).sort());
    });
  });
});

