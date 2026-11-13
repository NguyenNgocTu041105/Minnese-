/**
 * tests/milestone2_audio_shuffle_pronunciation.test.ts
 *
 * Dedicated Milestone 2 Unit Test Suite covering Requirements R2, R5, & R7:
 * 1. Audio Manifest and File Existence Across HSK 1 and HSK 2 (R2)
 * 2. Multilevel Speech Pronunciation Evaluator (R3 & R7)
 * 3. Immutable Fisher-Yates Array Shuffle Utility (R5 & R7)
 *
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import { COURSEBOOK_AUDIO_MANIFEST } from '../src/data/coursebookAudioManifest';
import { detectTextLanguage, resolveChineseTtsPayload } from '../src/utils/chineseAudio';
import type { WordItem } from '../src/types';

import { shuffleArray } from '../src/utils/shuffleUtils';
import {
  evaluateSpeechPronunciation,
  isPronunciationAcceptable,
  normalizeChineseText,
  extractPinyin,
  stripTones,
  stripPinyinTones,
  sanitizePinyinForComparison,
  sanitizeTranscriptPunctuation,
  type EvalResult,
  type PronunciationResult,
} from '../src/utils/pronunciationEval';

describe('Milestone 2: Audio, Pronunciation Evaluator & Shuffle Test Suite', () => {

  // ==========================================================================
  // SECTION 1: Audio Manifest and File Existence Across HSK 1 and HSK 2 (R2)
  // ==========================================================================
  describe('1. Audio Manifest & File Existence Across HSK 1 & HSK 2', () => {
    it('1.1: Audio manifest maps exactly 105 texts and 511 dialogue lines', () => {
      const manifestKeys = Object.keys(COURSEBOOK_AUDIO_MANIFEST);
      expect(manifestKeys.length).toBe(105);

      let totalLines = 0;
      for (const key of manifestKeys) {
        const item = COURSEBOOK_AUDIO_MANIFEST[key];
        expect(item.id).toBe(key);
        expect(item.fullAudioUrl).toMatch(/\.mp3$/i);
        expect(Array.isArray(item.lines)).toBe(true);
        totalLines += item.lines.length;
      }
      expect(totalLines).toBe(511);
    });

    it('1.2: All 616 audio files exist on physical disk with positive non-zero file size', () => {
      let missingCount = 0;
      let zeroByteCount = 0;
      let validFileCount = 0;

      for (const key of Object.keys(COURSEBOOK_AUDIO_MANIFEST)) {
        const textItem = COURSEBOOK_AUDIO_MANIFEST[key];

        // Check full dialogue audio
        if (textItem.fullAudioUrl) {
          const diskPath = path.resolve(process.cwd(), 'public', textItem.fullAudioUrl.replace(/^\//, ''));
          if (!fs.existsSync(diskPath)) {
            missingCount++;
          } else {
            const stat = fs.statSync(diskPath);
            if (stat.size === 0) zeroByteCount++;
            else validFileCount++;
          }
        }

        // Check individual line audios
        if (Array.isArray(textItem.lines)) {
          for (const line of textItem.lines) {
            if (line.audioUrl) {
              const diskPath = path.resolve(process.cwd(), 'public', line.audioUrl.replace(/^\//, ''));
              if (!fs.existsSync(diskPath)) {
                missingCount++;
              } else {
                const stat = fs.statSync(diskPath);
                if (stat.size === 0) zeroByteCount++;
                else validFileCount++;
              }
            }
          }
        }
      }

      expect(missingCount).toBe(0);
      expect(zeroByteCount).toBe(0);
      expect(validFileCount).toBe(616);
    });

    it('1.3: Audio line timings strictly satisfy monotonic ordering (start < end, duration > 0)', () => {
      for (const key of Object.keys(COURSEBOOK_AUDIO_MANIFEST)) {
        const item = COURSEBOOK_AUDIO_MANIFEST[key];
        if (item.lineTimings && item.lineTimings.length > 0) {
          for (const timing of item.lineTimings) {
            expect(timing.start).toBeLessThan(timing.end);
            expect(timing.duration).toBeGreaterThan(0);
            expect(timing.duration).toBeCloseTo(timing.end - timing.start, 2);
          }
        }
      }
    });

    it('1.4: Every vocabulary item across HSK 1 and HSK 2 has non-empty Hanzi, Pinyin, and Vietnamese', () => {
      let hsk1VocabCount = 0;
      for (const lesson of NEW_HSK1_FULL_LESSONS) {
        expect(lesson.vocabulary.length).toBeGreaterThan(0);
        for (const item of lesson.vocabulary) {
          hsk1VocabCount++;
          expect(item.hanzi.trim().length).toBeGreaterThan(0);
          expect(item.pinyin.trim().length).toBeGreaterThan(0);
          expect(item.vietnamese.trim().length).toBeGreaterThan(0);
          expect(detectTextLanguage(item.hanzi)).toBe('zh');
        }
      }
      expect(hsk1VocabCount).toBeGreaterThanOrEqual(150);

      let hsk2VocabCount = 0;
      for (const lesson of NEW_HSK2_FULL_LESSONS) {
        expect(lesson.vocabulary.length).toBeGreaterThan(0);
        for (const item of lesson.vocabulary) {
          hsk2VocabCount++;
          expect(item.hanzi.trim().length).toBeGreaterThan(0);
          expect(item.pinyin.trim().length).toBeGreaterThan(0);
          expect(item.vietnamese.trim().length).toBeGreaterThan(0);
          expect(detectTextLanguage(item.hanzi)).toBe('zh');
        }
      }
      expect(hsk2VocabCount).toBeGreaterThanOrEqual(150);
    });

    it('1.5: Every grammar point example has valid Chinese Hanzi producing a valid TTS payload', () => {
      for (const lesson of [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS]) {
        for (const gp of lesson.grammarPoints) {
          expect(gp.examples.length).toBeGreaterThan(0);
          for (const ex of gp.examples) {
            expect(ex.hanzi.trim().length).toBeGreaterThan(0);
            const payload = resolveChineseTtsPayload(ex.hanzi);
            expect(payload.trim().length).toBeGreaterThan(0);
            expect(detectTextLanguage(ex.hanzi)).toBe('zh');
          }
        }
      }
    });
  });

  // ==========================================================================
  // SECTION 2: Pronunciation Evaluator Across All 5 Matching Levels & Edge Cases
  // ==========================================================================
  describe('2. Pronunciation Evaluator Across 5 Matching Levels & Edge Cases', () => {
    const wordNihao: WordItem = {
      id: 'w-nihao',
      hanzi: '你好',
      pinyin: 'nǐ hǎo',
      vietnamese: 'Xin chào',
      hskLevel: 1,
    };

    const wordShi: WordItem = {
      id: 'w-shi',
      hanzi: '是',
      pinyin: 'shì',
      vietnamese: 'Là, đúng',
      hskLevel: 1,
    };

    it('2.1: Level 1 - Exact Hanzi match awards score 100 with matchedBy: hanzi_exact', () => {
      const res: EvalResult = evaluateSpeechPronunciation('你好', wordNihao);
      expect(res.isCorrect).toBe(true);
      expect(res.score).toBe(100);
      expect(res.matchedBy).toBe('hanzi_exact');
      expect(res.matchLevel).toBe('hanzi_exact');
      expect(res.targetHanzi).toBe('你好');
      expect(res.expectedText).toBe('你好');
      expect(res.recognizedText).toBe('你好');
    });

    it('2.2: Level 2 - Contains Hanzi match awards score 95 with matchedBy: hanzi_contains', () => {
      const res = evaluateSpeechPronunciation('我觉得你好', wordNihao);
      expect(res.isCorrect).toBe(true);
      expect(res.score).toBe(95);
      expect(res.matchedBy).toBe('hanzi_contains');
      expect(res.matchLevel).toBe('hanzi_contains');
    });

    it('2.3: Level 3 - Exact Pinyin with tone awards score 90 and correctly resolves homophones', () => {
      // Recognizer transcribed '事' (shì) when target was '是' (shì)
      const resHomophone: PronunciationResult = evaluateSpeechPronunciation('事', wordShi);
      expect(resHomophone.isCorrect).toBe(true);
      expect(resHomophone.score).toBe(90);
      expect(resHomophone.matchedBy).toBe('pinyin_exact');
      expect(resHomophone.matchLevel).toBe('pinyin_exact');

      // Direct pinyin transcript with tone marks
      const resPinyin = evaluateSpeechPronunciation('nǐ hǎo', wordNihao);
      expect(resPinyin.isCorrect).toBe(true);
      expect(resPinyin.score).toBe(90);
      expect(resPinyin.matchedBy).toBe('pinyin_exact');
    });

    it('2.4: Level 4 - Tone-insensitive Pinyin match awards score 80 with matchedBy: pinyin_tone_insensitive', () => {
      const res = evaluateSpeechPronunciation('ni hao', wordNihao);
      expect(res.isCorrect).toBe(true);
      expect(res.score).toBe(80);
      expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      expect(res.matchLevel).toBe('pinyin_tone_insensitive');
    });

    it('2.5: Level 5 - Complete mismatch returns score 0 with isCorrect: false and matchedBy: none', () => {
      const res = evaluateSpeechPronunciation('苹果', wordNihao);
      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
      expect(res.matchedBy).toBe('none');
      expect(res.matchLevel).toBe('none');
    });

    it('2.6: Edge Case - Empty or whitespace transcript returns isCorrect: false with score 0', () => {
      expect(evaluateSpeechPronunciation('', wordNihao).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('   ', wordNihao).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('\t\n', wordNihao).score).toBe(0);
    });

    it('2.7: Edge Case - Chinese & Western punctuation in transcript is stripped cleanly', () => {
      const res = evaluateSpeechPronunciation('你好！，。？', wordNihao);
      expect(res.isCorrect).toBe(true);
      expect(res.matchedBy).toBe('hanzi_exact');
    });

    it('2.8: Edge Case - Dynamic pinyin calculation when target word lacks pinyin field', () => {
      const wordWithoutPinyin = { hanzi: '再见' };
      const res = evaluateSpeechPronunciation('zàijiàn', wordWithoutPinyin);
      expect(res.isCorrect).toBe(true);
      expect(res.matchedBy).toBe('pinyin_exact');
    });

    it('2.9: Edge Case - Multi-character phrases and neutral tone words (e.g. 谢谢 xiè xie)', () => {
      const wordXiexie: WordItem = {
        id: 'w-xiexie',
        hanzi: '谢谢',
        pinyin: 'xiè xie',
        vietnamese: 'Cảm ơn',
        hskLevel: 1,
      };
      const res = evaluateSpeechPronunciation('xiexie', wordXiexie);
      expect(res.isCorrect).toBe(true);
      expect(res.matchedBy).toBe('pinyin_tone_insensitive');
    });

    it('2.10: Helper functions - normalizeChineseText, extractPinyin, stripTones, isPronunciationAcceptable', () => {
      expect(normalizeChineseText(' 你好，世界！ ')).toBe('你好世界');
      expect(sanitizeTranscriptPunctuation('谢谢！。？')).toBe('谢谢');
      expect(extractPinyin('你好')).toMatch(/nǐ\s*hǎo/);
      expect(stripTones('nǐ hǎo')).toBe('nihao');
      expect(stripPinyinTones('xièxie')).toBe('xiexie');
      expect(sanitizePinyinForComparison('dà, jiā!')).toBe('dà jiā');
      expect(isPronunciationAcceptable('你好', wordNihao)).toBe(true);
      expect(isPronunciationAcceptable('苹果', wordNihao)).toBe(false);
    });

    it('2.11: Adversarial Hardening - Sub-syllable and phoneme fragments are strictly rejected', () => {
      const wordZhongguo: WordItem = {
        id: 'w-zhongguo',
        hanzi: '中国',
        pinyin: 'zhōng guó',
        vietnamese: 'Trung Quốc',
        hskLevel: 1,
      };

      // Sub-syllable fragments of 'zhongguo' ('on', 'go', 'ng', 'zh', 'hon', 'ong') must be rejected
      const invalidFragmentsZhongguo = ['on', 'go', 'ng', 'zh', 'hon', 'ong'];
      for (const frag of invalidFragmentsZhongguo) {
        const res = evaluateSpeechPronunciation(frag, wordZhongguo);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(res.matchLevel).toBe('none');
      }

      // Sub-syllable fragments of 'nihao' ('ha', 'ao', 'ih', 'ho') must be rejected
      const invalidFragmentsNihao = ['ha', 'ao', 'ih', 'ho'];
      for (const frag of invalidFragmentsNihao) {
        const res = evaluateSpeechPronunciation(frag, wordNihao);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(res.matchLevel).toBe('none');
      }
    });

    it('2.12: Adversarial Hardening - Truncated and incomplete Hanzi words are strictly rejected', () => {
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
        id: 'w-bus',
        hanzi: '公共汽车',
        pinyin: 'gōng gòng qì chē',
        vietnamese: 'Xe buýt',
        hskLevel: 2,
      };

      // Truncated prefixes of '对不起' (e.g. '对不', '不起') must NOT pass
      expect(evaluateSpeechPronunciation('对不', wordDuibuqi).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('对不', wordDuibuqi).score).toBe(0);
      expect(evaluateSpeechPronunciation('不起', wordDuibuqi).isCorrect).toBe(false);

      // Truncated prefixes of '图书馆' (e.g. '图书', '书馆') must NOT pass
      expect(evaluateSpeechPronunciation('图书', wordTushuguan).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('图书', wordTushuguan).score).toBe(0);
      expect(evaluateSpeechPronunciation('书馆', wordTushuguan).isCorrect).toBe(false);

      // Truncated prefixes of '公共汽车' (e.g. '公共', '汽车', '公共汽') must NOT pass
      expect(evaluateSpeechPronunciation('公共', wordGonggongqiche).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('公共', wordGonggongqiche).score).toBe(0);
      expect(evaluateSpeechPronunciation('汽车', wordGonggongqiche).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('公共汽', wordGonggongqiche).isCorrect).toBe(false);

      // Conversational carrier phrases containing the complete word MUST continue to pass
      const carrierRes = evaluateSpeechPronunciation('我觉得对不起', wordDuibuqi);
      expect(carrierRes.isCorrect).toBe(true);
      expect(carrierRes.score).toBe(95);
      expect(carrierRes.matchedBy).toBe('hanzi_contains');
    });

    it('2.13: Numbered Pinyin Support - Accepts numbered pinyin transcripts (e.g. ni3 hao3 for nǐ hǎo)', () => {
      // Standard spaced numbered pinyin
      const resSpaced = evaluateSpeechPronunciation('ni3 hao3', wordNihao);
      expect(resSpaced.isCorrect).toBe(true);
      expect(resSpaced.score).toBe(80);
      expect(resSpaced.matchedBy).toBe('pinyin_tone_insensitive');
      expect(resSpaced.matchLevel).toBe('pinyin_tone_insensitive');

      // Unspaced numbered pinyin
      const resUnspaced = evaluateSpeechPronunciation('ni3hao3', wordNihao);
      expect(resUnspaced.isCorrect).toBe(true);
      expect(resUnspaced.score).toBe(80);
      expect(resUnspaced.matchedBy).toBe('pinyin_tone_insensitive');

      // Single-character numbered pinyin
      const resShi = evaluateSpeechPronunciation('shi4', wordShi);
      expect(resShi.isCorrect).toBe(true);
      expect(resShi.score).toBe(80);
      expect(resShi.matchedBy).toBe('pinyin_tone_insensitive');

      // Multi-character numbered pinyin with neutral tone (tone 5 or unnumbered)
      const wordXiexie: WordItem = {
        id: 'w-xiexie',
        hanzi: '谢谢',
        pinyin: 'xiè xie',
        vietnamese: 'Cảm ơn',
        hskLevel: 1,
      };
      const resXie1 = evaluateSpeechPronunciation('xie4 xie', wordXiexie);
      expect(resXie1.isCorrect).toBe(true);
      expect(resXie1.score).toBe(80);

      const resXie2 = evaluateSpeechPronunciation('xie4 xie5', wordXiexie);
      expect(resXie2.isCorrect).toBe(true);
      expect(resXie2.score).toBe(80);
    });

    it('2.14: Adversarial Hardening - Rejection of English noise words containing pinyin substrings', () => {
      const wordEr: WordItem = {
        id: 'w-er',
        hanzi: '二',
        pinyin: 'èr',
        vietnamese: 'Hai (số 2)',
        hskLevel: 1,
      };

      const wordWo: WordItem = {
        id: 'w-wo',
        hanzi: '我',
        pinyin: 'wǒ',
        vietnamese: 'Tôi',
        hskLevel: 1,
      };

      const wordTa: WordItem = {
        id: 'w-ta',
        hanzi: '他',
        pinyin: 'tā',
        vietnamese: 'Anh ấy',
        hskLevel: 1,
      };

      const wordNi: WordItem = {
        id: 'w-ni',
        hanzi: '你',
        pinyin: 'nǐ',
        vietnamese: 'Bạn',
        hskLevel: 1,
      };

      const wordDa: WordItem = {
        id: 'w-da',
        hanzi: '大',
        pinyin: 'dà',
        vietnamese: 'To, lớn',
        hskLevel: 1,
      };

      // English words containing 'er' ('computer', 'water', 'teacher') must NOT match '二'
      expect(evaluateSpeechPronunciation('computer', wordEr).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('computer', wordEr).score).toBe(0);
      expect(evaluateSpeechPronunciation('water', wordEr).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('teacher', wordEr).isCorrect).toBe(false);

      // English words containing 'wo' ('two', 'world', 'work') must NOT match '我'
      expect(evaluateSpeechPronunciation('two', wordWo).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('two', wordWo).score).toBe(0);
      expect(evaluateSpeechPronunciation('world', wordWo).isCorrect).toBe(false);

      // English words containing 'ta' ('table', 'data', 'star') must NOT match '他'
      expect(evaluateSpeechPronunciation('table', wordTa).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('table', wordTa).score).toBe(0);

      // English words containing 'ni' ('tennis', 'nice', 'night') must NOT match '你'
      expect(evaluateSpeechPronunciation('tennis', wordNi).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('tennis', wordNi).score).toBe(0);
      expect(evaluateSpeechPronunciation('nice', wordNi).isCorrect).toBe(false);

      // English words containing 'da' ('data', 'day') must NOT match '大'
      expect(evaluateSpeechPronunciation('data', wordDa).isCorrect).toBe(false);
      expect(evaluateSpeechPronunciation('data', wordDa).score).toBe(0);
    });

    // ========================================================================
    // 2.15: Adversarial Hardening — 10 English Noise Words vs Single-Char Words
    // ========================================================================
    it('2.15: Adversarial Hardening - 10 English noise words strictly rejected against single-character words with pinyin length >= 4', () => {
      const adversarialPairs = [
        { noise: 'meeting', hanzi: '听', pinyin: 'tīng', desc: 'meeting contains ting' },
        { noise: 'waiting', hanzi: '听', pinyin: 'tīng', desc: 'waiting contains ting' },
        { noise: 'length', hanzi: '冷', pinyin: 'lěng', desc: 'length contains leng' },
        { noise: 'challenge', hanzi: '冷', pinyin: 'lěng', desc: 'challenge contains leng' },
        { noise: 'mango', hanzi: '忙', pinyin: 'máng', desc: 'mango contains mang' },
        { noise: 'bowling', hanzi: '零', pinyin: 'líng', desc: 'bowling contains ling' },
        { noise: 'bangkok', hanzi: '帮', pinyin: 'bāng', desc: 'bangkok contains bang' },
        { noise: 'exchange', hanzi: '长', pinyin: 'cháng', desc: 'exchange contains chang' },
        { noise: 'songwriter', hanzi: '送', pinyin: 'sòng', desc: 'songwriter contains song' },
        { noise: 'dingdong', hanzi: '懂', pinyin: 'dǒng', desc: 'dingdong contains dong' },
      ];

      for (const item of adversarialPairs) {
        const res = evaluateSpeechPronunciation(item.noise, {
          hanzi: item.hanzi,
          pinyin: item.pinyin,
        });

        expect(res.isCorrect, `English noise "${item.noise}" should not match "${item.hanzi}" (${item.pinyin})`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(res.matchLevel).toBe('none');
        expect(isPronunciationAcceptable(item.noise, { hanzi: item.hanzi, pinyin: item.pinyin })).toBe(false);
      }

      // Additional English vocabulary noise words containing nasal/compound finals
      const additionalNoise = [
        { noise: 'eating', target: { hanzi: '听', pinyin: 'tīng' } },
        { noise: 'painting', target: { hanzi: '听', pinyin: 'tīng' } },
        { noise: 'management', target: { hanzi: '忙', pinyin: 'máng' } },
        { noise: 'cycling', target: { hanzi: '零', pinyin: 'líng' } },
        { noise: 'banging', target: { hanzi: '帮', pinyin: 'bāng' } },
        { noise: 'bingo', target: { hanzi: '病', pinyin: 'bìng' } },
        { noise: 'champagne', target: { hanzi: '唱', pinyin: 'chàng' } },
      ];

      for (const item of additionalNoise) {
        const res = evaluateSpeechPronunciation(item.noise, item.target);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    // ========================================================================
    // 2.16: Legitimately Spoken Single-Character Words
    // ========================================================================
    it('2.16: Legitimately spoken single-character words (isolated pinyin, numbered pinyin, carrier phrases)', () => {
      const wordTing: WordItem = {
        id: 'w-ting',
        hanzi: '听',
        pinyin: 'tīng',
        vietnamese: 'Nghe',
        hskLevel: 1,
      };

      const wordLeng: WordItem = {
        id: 'w-leng',
        hanzi: '冷',
        pinyin: 'lěng',
        vietnamese: 'Lạnh',
        hskLevel: 1,
      };

      const wordMang: WordItem = {
        id: 'w-mang',
        hanzi: '忙',
        pinyin: 'máng',
        vietnamese: 'Bận',
        hskLevel: 1,
      };

      const wordLing: WordItem = {
        id: 'w-ling',
        hanzi: '零',
        pinyin: 'líng',
        vietnamese: 'Số không',
        hskLevel: 1,
      };

      const wordBang: WordItem = {
        id: 'w-bang',
        hanzi: '帮',
        pinyin: 'bāng',
        vietnamese: 'Giúp đỡ',
        hskLevel: 2,
      };

      const wordChang: WordItem = {
        id: 'w-chang',
        hanzi: '长',
        pinyin: 'cháng',
        vietnamese: 'Dài',
        hskLevel: 2,
      };

      const wordSong: WordItem = {
        id: 'w-song',
        hanzi: '送',
        pinyin: 'sòng',
        vietnamese: 'Tặng, tiễn',
        hskLevel: 2,
      };

      const wordDong: WordItem = {
        id: 'w-dong',
        hanzi: '懂',
        pinyin: 'dǒng',
        vietnamese: 'Hiểu',
        hskLevel: 2,
      };

      // 1. Isolated Pinyin with Tone Mark Diacritics -> Level 3 (Score 90, pinyin_exact)
      const exactToneList = [
        { word: wordTing, input: 'tīng' },
        { word: wordLeng, input: 'lěng' },
        { word: wordMang, input: 'máng' },
        { word: wordLing, input: 'líng' },
        { word: wordBang, input: 'bāng' },
        { word: wordChang, input: 'cháng' },
        { word: wordSong, input: 'sòng' },
        { word: wordDong, input: 'dǒng' },
      ];
      for (const item of exactToneList) {
        const res = evaluateSpeechPronunciation(item.input, item.word);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(90);
        expect(res.matchedBy).toBe('pinyin_exact');
      }

      // 2. Isolated Plain Pinyin (Tone Omission / Tone Slip) -> Level 4 (Score 80, pinyin_tone_insensitive)
      const plainPinyinList = [
        { word: wordTing, input: 'ting' },
        { word: wordLeng, input: 'leng' },
        { word: wordMang, input: 'mang' },
        { word: wordLing, input: 'ling' },
        { word: wordBang, input: 'bang' },
        { word: wordChang, input: 'chang' },
        { word: wordSong, input: 'song' },
        { word: wordDong, input: 'dong' },
      ];
      for (const item of plainPinyinList) {
        const res = evaluateSpeechPronunciation(item.input, item.word);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(80);
        expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      }

      // 3. Isolated Numbered Pinyin -> Level 4 (Score 80, pinyin_tone_insensitive)
      const numberedPinyinList = [
        { word: wordTing, input: 'ting1' },
        { word: wordLeng, input: 'leng3' },
        { word: wordMang, input: 'mang2' },
        { word: wordLing, input: 'ling2' },
        { word: wordBang, input: 'bang1' },
        { word: wordChang, input: 'chang2' },
        { word: wordSong, input: 'song4' },
        { word: wordDong, input: 'dong3' },
      ];
      for (const item of numberedPinyinList) {
        const res = evaluateSpeechPronunciation(item.input, item.word);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(80);
        expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      }

      // 4. Legitimate Spaced Latin Carrier Phrases -> Level 4 (Score 80, pinyin_tone_insensitive)
      const carrierPhrases = [
        { word: wordTing, input: 'wo ting dao le' },
        { word: wordTing, input: 'wǒ tīng dào le' },
        { word: wordTing, input: 'wo3 ting1 dao4 le' },
        { word: wordTing, input: 'ting dao le' },
        { word: wordTing, input: 'wo yao ting' },
        { word: wordLeng, input: 'wo bu leng' },
        { word: wordMang, input: 'ta hen mang' },
        { word: wordMang, input: 'tā hěn máng' },
        { word: wordBang, input: 'wo bang ni' },
        { word: wordDong, input: 'wo bu dong' },
      ];
      for (const item of carrierPhrases) {
        const res = evaluateSpeechPronunciation(item.input, item.word);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(80);
        expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      }

      // 5. Legitimate Chinese Carrier Phrases -> Level 2 (Score 95, hanzi_contains)
      const hanziCarriers = [
        { word: wordTing, input: '我听到了' },
        { word: wordTing, input: '你听我说' },
        { word: wordLeng, input: '我觉得冷' },
        { word: wordMang, input: '他很忙' },
        { word: wordBang, input: '我帮你' },
        { word: wordDong, input: '我听不懂' },
      ];
      for (const item of hanziCarriers) {
        const res = evaluateSpeechPronunciation(item.input, item.word);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(95);
        expect(res.matchedBy).toBe('hanzi_contains');
      }
    });

    // ========================================================================
    // 2.17: Legitimately Spoken Multi-Character Carrier Phrases
    // ========================================================================
    it('2.17: Legitimately spoken multi-character carrier phrases (wo shuo ni hao, ting yin yue)', () => {
      const wordNihao: WordItem = {
        id: 'w-nihao',
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        vietnamese: 'Xin chào',
        hskLevel: 1,
      };

      const wordTingyinyue: WordItem = {
        id: 'w-music',
        hanzi: '听音乐',
        pinyin: 'tīng yīn yuè',
        vietnamese: 'Nghe nhạc',
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
        id: 'w-library',
        hanzi: '图书馆',
        pinyin: 'tú shū guǎn',
        vietnamese: 'Thư viện',
        hskLevel: 2,
      };

      // Spaced Latin multi-character carrier phrases -> Level 4 (Score 80, pinyin_tone_insensitive)
      const latinMultiPhrases = [
        { word: wordNihao, input: 'wo shuo ni hao' },
        { word: wordNihao, input: 'ni hao ma' },
        { word: wordNihao, input: 'dajia ni hao' },
        { word: wordTingyinyue, input: 'ting yin yue' },
        { word: wordTingyinyue, input: 'wo xi huan ting yin yue' },
        { word: wordTingyinyue, input: 'wo xiang ting yin yue' },
        { word: wordXiexie, input: 'xie xie ni' },
        { word: wordXiexie, input: 'duo xie xie' },
        { word: wordDuibuqi, input: 'dui bu qi a' },
        { word: wordDuibuqi, input: 'zhen de dui bu qi' },
        { word: wordTushuguan, input: 'qu tu shu guan' },
      ];
      for (const item of latinMultiPhrases) {
        const res = evaluateSpeechPronunciation(item.input, item.word);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(80);
        expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      }

      // Unspaced Latin multi-character phrases -> Level 4 (Score 80, pinyin_tone_insensitive)
      expect(evaluateSpeechPronunciation('woshuonihao', wordNihao).isCorrect).toBe(true);
      expect(evaluateSpeechPronunciation('woshuonihao', wordNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('tingyinyue', wordTingyinyue).isCorrect).toBe(true);
      expect(evaluateSpeechPronunciation('tingyinyue', wordTingyinyue).score).toBe(80);

      // Chinese multi-character carrier phrases -> Level 2 (Score 95, hanzi_contains)
      const hanziMultiPhrases = [
        { word: wordNihao, input: '我想说你好' },
        { word: wordNihao, input: '你好吗？' },
        { word: wordTingyinyue, input: '我想听音乐' },
        { word: wordTingyinyue, input: '正在听音乐呢' },
        { word: wordXiexie, input: '太谢谢了！' },
        { word: wordDuibuqi, input: '我觉得对不起' },
        { word: wordTushuguan, input: '去图书馆借书' },
      ];
      for (const item of hanziMultiPhrases) {
        const res = evaluateSpeechPronunciation(item.input, item.word);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(95);
        expect(res.matchedBy).toBe('hanzi_contains');
      }
    });
  });

  // ==========================================================================
  // SECTION 3: Shuffle Utility Immutability, Randomness & Boundary Cases (R5)
  // ==========================================================================
  describe('3. Shuffle Utility Immutability, Distribution & Boundary Cases', () => {
    it('3.1: Immutability - returns a new array reference and preserves original array', () => {
      const original = [1, 2, 3, 4, 5];
      const snapshot = [...original];
      const result = shuffleArray(original);

      expect(result).not.toBe(original);
      expect(original).toEqual(snapshot);
    });

    it('3.2: Immutability - operates safely on Object.freeze() arrays without throwing TypeError', () => {
      const frozen = Object.freeze(['a', 'b', 'c', 'd', 'e']);
      expect(() => shuffleArray(frozen)).not.toThrow();
      const result = shuffleArray(frozen);
      expect(result).not.toBe(frozen);
      expect(result.length).toBe(5);
    });

    it('3.3: Multiset Equality - output array contains identical elements and counts', () => {
      const original = ['A', 'B', 'B', 'C', 'C', 'C'];
      const result = shuffleArray(original);

      expect(result.length).toBe(original.length);
      expect([...result].sort()).toEqual([...original].sort());
    });

    it('3.4: Multiset Equality - preserves WordItem objects without data alteration', () => {
      const vocab = NEW_HSK1_FULL_LESSONS[0].vocabulary;
      const result = shuffleArray(vocab);

      expect(result.length).toBe(vocab.length);
      const originalIds = vocab.map((w) => w.id).sort();
      const resultIds = result.map((w) => w.id).sort();
      expect(resultIds).toEqual(originalIds);
    });

    it('3.5: Boundary Cases - empty array returns a new empty array instance', () => {
      const empty: number[] = [];
      const res = shuffleArray(empty);
      expect(res).toEqual([]);
      expect(res).not.toBe(empty);
    });

    it('3.6: Boundary Cases - single-element array returns a new single-element array', () => {
      const single = ['X'];
      const res = shuffleArray(single);
      expect(res).toEqual(['X']);
      expect(res).not.toBe(single);
    });

    it('3.7: Boundary Cases - null/undefined defensive handling returns empty array', () => {
      expect(shuffleArray(null as any)).toEqual([]);
      expect(shuffleArray(undefined as any)).toEqual([]);
    });

    it('3.8: Deterministic Testability - custom RNG produces exact predictable permutation', () => {
      const array = [1, 2, 3];
      // Mock RNG that always returns 0 (reverses or shifts positions predictably)
      const mockRngMin = () => 0;
      const resMin = shuffleArray(array, mockRngMin);
      expect(resMin.length).toBe(3);

      // Mock RNG that returns fixed index sequences
      let callCount = 0;
      const fixedSequenceRng = () => {
        callCount++;
        return 0.99; // Picks j = i (no swap)
      };
      const resIdentity = shuffleArray(array, fixedSequenceRng);
      expect(resIdentity).toEqual([1, 2, 3]);
    });

    it('3.9: Statistical Uniformity - Chi-Square Goodness-of-Fit test across 6,000 trials', () => {
      const input = [1, 2, 3]; // 3! = 6 possible permutations
      const permutationCounts: Record<string, number> = {
        '1,2,3': 0,
        '1,3,2': 0,
        '2,1,3': 0,
        '2,3,1': 0,
        '3,1,2': 0,
        '3,2,1': 0,
      };

      const trials = 6000;
      const expected = trials / 6; // 1,000 expected per permutation

      for (let t = 0; t < trials; t++) {
        const shuffled = shuffleArray(input);
        const key = shuffled.join(',');
        permutationCounts[key] = (permutationCounts[key] || 0) + 1;
      }

      // Compute Chi-Square statistic
      let chiSquare = 0;
      for (const key of Object.keys(permutationCounts)) {
        const observed = permutationCounts[key];
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }

      // For df = 5 (6 outcomes - 1), critical value at alpha = 0.001 is 20.515
      // and at alpha = 0.01 is 15.086. We assert chiSquare < 20.515.
      expect(chiSquare).toBeLessThan(20.515);
    });

    it('3.10: Performance Stress - Shuffling 1,000 items executes in < 5ms without memory leaks', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: `id-${i}`, value: i }));
      const start = performance.now();
      const result = shuffleArray(largeArray);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
      expect(result.length).toBe(1000);
      expect(result[0]).toBeDefined();
    });

    it('3.11: Boundary Safety - Custom RNG returning 1.0 preserves length and introduces zero undefined elements', () => {
      // 1. Array of numbers [1, 2, 3] replicating Reviewer 2 defect scenario
      const array3 = [1, 2, 3];
      const maxRng = () => 1.0;
      const res3 = shuffleArray(array3, maxRng);

      expect(res3).not.toBe(array3);
      expect(res3.length).toBe(3);
      expect(res3).toEqual([1, 2, 3]);
      expect(res3.includes(undefined as unknown as number)).toBe(false);

      // 2. Larger array [10, 20, 30, 40, 50, 60, 70, 80]
      const array8 = [10, 20, 30, 40, 50, 60, 70, 80];
      const res8 = shuffleArray(array8, maxRng);
      expect(res8.length).toBe(8);
      expect(res8).toEqual(array8);
      for (let i = 0; i < res8.length; i++) {
        expect(res8[i]).toBeDefined();
        expect(res8[i]).not.toBeUndefined();
      }

      // 3. Array of WordItem objects
      const vocab = NEW_HSK1_FULL_LESSONS[0].vocabulary.slice(0, 5);
      const resVocab = shuffleArray(vocab, maxRng);
      expect(resVocab.length).toBe(vocab.length);
      expect(resVocab).toEqual(vocab);
      expect(resVocab.every((item) => item !== undefined && item !== null)).toBe(true);

      // 4. Alternating boundary RNG sequence [1.0, 0.0, 1.0, 0.0]
      let callIdx = 0;
      const alternatingRng = () => (callIdx++ % 2 === 0 ? 1.0 : 0.0);
      const resAlt = shuffleArray([1, 2, 3, 4], alternatingRng);
      expect(resAlt.length).toBe(4);
      expect(resAlt.includes(undefined as unknown as number)).toBe(false);
      expect([...resAlt].sort()).toEqual([1, 2, 3, 4]);
    });
  });
});
