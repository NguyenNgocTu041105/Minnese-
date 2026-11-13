/**
 * tests/adversarial_challenger_m2_4_pronunciation_eval.test.ts
 *
 * Milestone 2 Iteration 4: Adversarial Pronunciation Evaluator Stress & Empirical Verification
 * Challenger Agent: challenger_m2_4_1
 *
 * Objectives Verified:
 * 1. English words containing pinyin substrings (e.g. -ing, -eng, -ang, -ong, -ian words)
 *    strictly score 0 when evaluated against single-character words (hanzi.length === 1).
 * 2. Legitimate isolated pronunciations, tone variations, numbered pinyins, and spaced
 *    pinyin phrases are NOT accidentally rejected.
 * 3. Multi-character words in conversational carrier phrases continue to be recognized accurately.
 * 4. Sub-syllables, phonetic fragments, and Latin noise are strictly rejected.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateSpeechPronunciation,
  isPronunciationAcceptable,
  stripTones,
  normalizeChineseText,
  type EvalResult,
} from '../src/utils/pronunciationEval';
import type { WordItem } from '../src/types';

describe('Milestone 2 Iteration 4: Empirical Pronunciation Evaluation Challenge', () => {

  // Single-character reference targets
  const targetTing: WordItem = {
    id: 'w-ting',
    hanzi: '听',
    pinyin: 'tīng',
    vietnamese: 'Nghe',
    hskLevel: 1,
  };

  const targetDing: WordItem = {
    id: 'w-ding',
    hanzi: '定',
    pinyin: 'dìng',
    vietnamese: 'Định',
    hskLevel: 2,
  };

  const targetJing: WordItem = {
    id: 'w-jing',
    hanzi: '经',
    pinyin: 'jīng',
    vietnamese: 'Kinh',
    hskLevel: 2,
  };

  const targetMing: WordItem = {
    id: 'w-ming',
    hanzi: '明',
    pinyin: 'míng',
    vietnamese: 'Sáng; Minh',
    hskLevel: 1,
  };

  const targetXing: WordItem = {
    id: 'w-xing',
    hanzi: '星',
    pinyin: 'xīng',
    vietnamese: 'Sao; Tinh',
    hskLevel: 1,
  };

  const targetNing: WordItem = {
    id: 'w-ning',
    hanzi: '宁',
    pinyin: 'níng',
    vietnamese: 'Ninh',
    hskLevel: 2,
  };

  const targetLing: WordItem = {
    id: 'w-ling',
    hanzi: '零',
    pinyin: 'líng',
    vietnamese: 'Số 0',
    hskLevel: 1,
  };

  const targetLeng: WordItem = {
    id: 'w-leng',
    hanzi: '冷',
    pinyin: 'lěng',
    vietnamese: 'Lạnh',
    hskLevel: 1,
  };

  const targetNeng: WordItem = {
    id: 'w-neng',
    hanzi: '能',
    pinyin: 'néng',
    vietnamese: 'Có thể',
    hskLevel: 1,
  };

  const targetDeng: WordItem = {
    id: 'w-deng',
    hanzi: '等',
    pinyin: 'děng',
    vietnamese: 'Đợi',
    hskLevel: 1,
  };

  const targetMang: WordItem = {
    id: 'w-mang',
    hanzi: '忙',
    pinyin: 'máng',
    vietnamese: 'Bận',
    hskLevel: 1,
  };

  const targetKang: WordItem = {
    id: 'w-kang',
    hanzi: '康',
    pinyin: 'kāng',
    vietnamese: 'Khang; Khỏe mạnh',
    hskLevel: 2,
  };

  const targetRang: WordItem = {
    id: 'w-rang',
    hanzi: '让',
    pinyin: 'ràng',
    vietnamese: 'Nhường; Để',
    hskLevel: 2,
  };

  const targetDang: WordItem = {
    id: 'w-dang',
    hanzi: '当',
    pinyin: 'dāng',
    vietnamese: 'Làm; Đang',
    hskLevel: 2,
  };

  const targetRan: WordItem = {
    id: 'w-ran',
    hanzi: '然',
    pinyin: 'rán',
    vietnamese: 'Nhiên',
    hskLevel: 2,
  };

  const targetSong: WordItem = {
    id: 'w-song',
    hanzi: '送',
    pinyin: 'sòng',
    vietnamese: 'Tặng; Tiễn',
    hskLevel: 2,
  };

  const targetDong: WordItem = {
    id: 'w-dong',
    hanzi: '懂',
    pinyin: 'dǒng',
    vietnamese: 'Hiểu',
    hskLevel: 2,
  };

  const targetDongEast: WordItem = {
    id: 'w-dong-east',
    hanzi: '东',
    pinyin: 'dōng',
    vietnamese: 'Đông',
    hskLevel: 1,
  };

  const targetDian: WordItem = {
    id: 'w-dian',
    hanzi: '点',
    pinyin: 'diǎn',
    vietnamese: 'Điểm; Giờ; Chút',
    hskLevel: 1,
  };

  const targetTian: WordItem = {
    id: 'w-tian',
    hanzi: '天',
    pinyin: 'tiān',
    vietnamese: 'Ngày; Trời',
    hskLevel: 1,
  };

  const targetJian: WordItem = {
    id: 'w-jian',
    hanzi: '见',
    pinyin: 'jiàn',
    vietnamese: 'Gặp; Thấy',
    hskLevel: 1,
  };

  const targetNian: WordItem = {
    id: 'w-nian',
    hanzi: '年',
    pinyin: 'nián',
    vietnamese: 'Năm',
    hskLevel: 1,
  };

  const targetLian: WordItem = {
    id: 'w-lian',
    hanzi: '脸',
    pinyin: 'liǎn',
    vietnamese: 'Mặt',
    hskLevel: 2,
  };

  // Multi-character reference targets
  const targetNihao: WordItem = {
    id: 'w-nihao',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    vietnamese: 'Xin chào',
    hskLevel: 1,
  };

  const targetDuibuqi: WordItem = {
    id: 'w-duibuqi',
    hanzi: '对不起',
    pinyin: 'duì bu qǐ',
    vietnamese: 'Xin lỗi',
    hskLevel: 1,
  };

  const targetZhongguo: WordItem = {
    id: 'w-zhongguo',
    hanzi: '中国',
    pinyin: 'zhōng guó',
    vietnamese: 'Trung Quốc',
    hskLevel: 1,
  };

  const targetTushuguan: WordItem = {
    id: 'w-tushuguan',
    hanzi: '图书馆',
    pinyin: 'tú shū guǎn',
    vietnamese: 'Thư viện',
    hskLevel: 2,
  };

  const targetXiexie: WordItem = {
    id: 'w-xiexie',
    hanzi: '谢谢',
    pinyin: 'xiè xie',
    vietnamese: 'Cảm ơn',
    hskLevel: 1,
  };

  // ==========================================================================
  // MANDATE 1: English Words Containing Pinyin Substrings (Single Char Target)
  // ==========================================================================
  describe('Mandate 1: English Words Containing Pinyin Substrings Strict Rejection', () => {

    it('1.1: -ing English words strictly score 0 against single-character words', () => {
      const ingCases: Array<{ word: string; target: WordItem; desc: string }> = [
        { word: 'meeting', target: targetTing, desc: 'meeting contains "ting"' },
        { word: 'waiting', target: targetTing, desc: 'waiting contains "ting"' },
        { word: 'painting', target: targetTing, desc: 'painting contains "ting"' },
        { word: 'eating', target: targetTing, desc: 'eating contains "ting"' },
        { word: 'writing', target: targetTing, desc: 'writing contains "ting"' },
        { word: 'string', target: targetTing, desc: 'string contains "ting"' },
        { word: 'king', target: targetTing, desc: 'king vs ting' },
        { word: 'king', target: targetJing, desc: 'king vs jing' },
        { word: 'king', target: targetXing, desc: 'king vs xing' },
        { word: 'morning', target: targetNing, desc: 'morning contains "ning"' },
        { word: 'learning', target: targetNing, desc: 'learning contains "ning"' },
        { word: 'planning', target: targetNing, desc: 'planning contains "ning"' },
        { word: 'reading', target: targetDing, desc: 'reading contains "ding"' },
        { word: 'building', target: targetDing, desc: 'building contains "ding"' },
        { word: 'standing', target: targetDing, desc: 'standing contains "ding"' },
        { word: 'swimming', target: targetMing, desc: 'swimming contains "ming"' },
        { word: 'timing', target: targetMing, desc: 'timing contains "ming"' },
        { word: 'becoming', target: targetMing, desc: 'becoming contains "ming"' },
        { word: 'spelling', target: targetLing, desc: 'spelling contains "ling"' },
        { word: 'smiling', target: targetLing, desc: 'smiling contains "ling"' },
        { word: 'calling', target: targetLing, desc: 'calling contains "ling"' },
      ];

      for (const { word, target, desc } of ingCases) {
        const res = evaluateSpeechPronunciation(word, target);
        expect(res.isCorrect, `Expected ${desc} to be rejected`).toBe(false);
        expect(res.score, `Expected ${desc} score to be 0`).toBe(0);
        expect(res.matchedBy).toBe('none');
        expect(res.matchLevel).toBe('none');
        expect(isPronunciationAcceptable(word, target)).toBe(false);
      }
    });

    it('1.2: -eng English words strictly score 0 against single-character words', () => {
      const engCases: Array<{ word: string; target: WordItem; desc: string }> = [
        { word: 'length', target: targetLeng, desc: 'length contains "leng"' },
        { word: 'challenge', target: targetLeng, desc: 'challenge contains "leng"' },
        { word: 'strength', target: targetLeng, desc: 'strength vs leng' },
        { word: 'passenger', target: targetNeng, desc: 'passenger vs neng' },
        { word: 'length', target: targetDeng, desc: 'length vs deng' },
      ];

      for (const { word, target, desc } of engCases) {
        const res = evaluateSpeechPronunciation(word, target);
        expect(res.isCorrect, `Expected ${desc} to be rejected`).toBe(false);
        expect(res.score, `Expected ${desc} score to be 0`).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('1.3: -ang English words strictly score 0 against single-character words', () => {
      const angCases: Array<{ word: string; target: WordItem; desc: string }> = [
        { word: 'mango', target: targetMang, desc: 'mango contains "mang"' },
        { word: 'kangaroo', target: targetKang, desc: 'kangaroo contains "kang"' },
        { word: 'kangaroo', target: targetRang, desc: 'kangaroo vs rang' },
        { word: 'boomerang', target: targetRang, desc: 'boomerang contains "rang"' },
        { word: 'danger', target: targetDang, desc: 'danger contains "dang"' },
        { word: 'orange', target: targetRan, desc: 'orange contains "ran"' },
        { word: 'stranger', target: targetRang, desc: 'stranger contains "rang"' },
        { word: 'tangerine', target: targetMang, desc: 'tangerine vs mang' },
        { word: 'manganese', target: targetMang, desc: 'manganese contains "mang"' },
        { word: 'hanger', target: targetKang, desc: 'hanger vs kang' },
      ];

      for (const { word, target, desc } of angCases) {
        const res = evaluateSpeechPronunciation(word, target);
        expect(res.isCorrect, `Expected ${desc} to be rejected`).toBe(false);
        expect(res.score, `Expected ${desc} score to be 0`).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('1.4: -ong English words strictly score 0 against single-character words', () => {
      const ongCases: Array<{ word: string; target: WordItem; desc: string }> = [
        { word: 'songwriter', target: targetSong, desc: 'songwriter contains "song"' },
        { word: 'dingdong', target: targetDong, desc: 'dingdong contains "dong"' },
        { word: 'dingdong', target: targetDongEast, desc: 'dingdong contains "dong"' },
        { word: 'dingdong', target: targetDing, desc: 'dingdong contains "ding"' },
        { word: 'belong', target: targetSong, desc: 'belong vs song' },
        { word: 'prolong', target: targetDong, desc: 'prolong vs dong' },
        { word: 'furlong', target: targetSong, desc: 'furlong vs song' },
        { word: 'hongkong', target: targetSong, desc: 'hongkong vs song' },
        { word: 'pingpong', target: targetDong, desc: 'pingpong vs dong' },
      ];

      for (const { word, target, desc } of ongCases) {
        const res = evaluateSpeechPronunciation(word, target);
        expect(res.isCorrect, `Expected ${desc} to be rejected`).toBe(false);
        expect(res.score, `Expected ${desc} score to be 0`).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('1.5: -ian English words strictly score 0 against single-character words', () => {
      const ianCases: Array<{ word: string; target: WordItem; desc: string }> = [
        { word: 'comedian', target: targetDian, desc: 'comedian contains "dian"' },
        { word: 'guardian', target: targetDian, desc: 'guardian contains "dian"' },
        { word: 'radiant', target: targetDian, desc: 'radiant contains "dian"' },
        { word: 'italian', target: targetLian, desc: 'italian contains "lian"' },
        { word: 'canadian', target: targetDian, desc: 'canadian contains "dian"' },
        { word: 'indian', target: targetDian, desc: 'indian contains "dian"' },
        { word: 'median', target: targetDian, desc: 'median contains "dian"' },
        { word: 'valiant', target: targetLian, desc: 'valiant contains "lian"' },
        { word: 'brilliant', target: targetLian, desc: 'brilliant contains "lian"' },
        { word: 'christian', target: targetTian, desc: 'christian contains "tian"' },
        { word: 'pedestrian', target: targetTian, desc: 'pedestrian contains "tian"' },
        { word: 'convenient', target: targetNian, desc: 'convenient contains "nian"' },
      ];

      for (const { word, target, desc } of ianCases) {
        const res = evaluateSpeechPronunciation(word, target);
        expect(res.isCorrect, `Expected ${desc} to be rejected`).toBe(false);
        expect(res.score, `Expected ${desc} score to be 0`).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('1.6: English sentences containing pinyin substring words strictly score 0 against single-character words', () => {
      const sentenceCases: Array<{ sentence: string; target: WordItem; desc: string }> = [
        { sentence: 'we have an urgent meeting', target: targetTing, desc: 'sentence with meeting vs 听' },
        { sentence: 'i am waiting for you', target: targetTing, desc: 'sentence with waiting vs 听' },
        { sentence: 'this is a major challenge', target: targetLeng, desc: 'sentence with challenge vs 冷' },
        { sentence: 'i eat a delicious mango', target: targetMang, desc: 'sentence with mango vs 忙' },
        { sentence: 'the songwriter plays piano', target: targetSong, desc: 'sentence with songwriter vs 送' },
        { sentence: 'he is a funny comedian', target: targetDian, desc: 'sentence with comedian vs 点' },
        { sentence: 'the bell went dingdong', target: targetDong, desc: 'sentence with dingdong vs 懂' },
      ];

      for (const { sentence, target, desc } of sentenceCases) {
        const res = evaluateSpeechPronunciation(sentence, target);
        expect(res.isCorrect, `Expected "${sentence}" to be rejected for ${target.hanzi}`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });
  });

  // ==========================================================================
  // MANDATE 2: Legitimate Pronunciations, Tones, Numbers, & Spaced Phrases
  // ==========================================================================
  describe('Mandate 2: Legitimate Pronunciations Preservation', () => {

    it('2.1: Exact Hanzi entries score 100 on Tier 1 (both single and multi-character)', () => {
      const exactHanziCases: Array<{ input: string; target: WordItem }> = [
        { input: '听', target: targetTing },
        { input: '冷', target: targetLeng },
        { input: '忙', target: targetMang },
        { input: '送', target: targetSong },
        { input: '点', target: targetDian },
        { input: '你好', target: targetNihao },
        { input: '对不起', target: targetDuibuqi },
        { input: '中国', target: targetZhongguo },
        { input: '图书馆', target: targetTushuguan },
        { input: '谢谢', target: targetXiexie },
      ];

      for (const { input, target } of exactHanziCases) {
        const res = evaluateSpeechPronunciation(input, target);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(100);
        expect(res.matchedBy).toBe('hanzi_exact');
        expect(res.matchLevel).toBe('hanzi_exact');
      }
    });

    it('2.2: Exact Pinyin with diacritic tone scores 90 on Tier 3', () => {
      const exactPinyinCases: Array<{ input: string; target: WordItem }> = [
        { input: 'tīng', target: targetTing },
        { input: 'lěng', target: targetLeng },
        { input: 'máng', target: targetMang },
        { input: 'sòng', target: targetSong },
        { input: 'diǎn', target: targetDian },
        { input: 'nǐ hǎo', target: targetNihao },
        { input: 'duì bu qǐ', target: targetDuibuqi },
        { input: 'zhōng guó', target: targetZhongguo },
        { input: 'tú shū guǎn', target: targetTushuguan },
      ];

      for (const { input, target } of exactPinyinCases) {
        const res = evaluateSpeechPronunciation(input, target);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(90);
        expect(res.matchedBy).toBe('pinyin_exact');
      }
    });

    it('2.3: Isolated base Pinyin (tone drop) scores 80 on Tier 4', () => {
      const basePinyinCases: Array<{ input: string; target: WordItem }> = [
        { input: 'ting', target: targetTing },
        { input: 'leng', target: targetLeng },
        { input: 'mang', target: targetMang },
        { input: 'song', target: targetSong },
        { input: 'dian', target: targetDian },
        { input: 'ni hao', target: targetNihao },
        { input: 'dui bu qi', target: targetDuibuqi },
        { input: 'zhong guo', target: targetZhongguo },
        { input: 'tu shu guan', target: targetTushuguan },
        { input: 'xie xie', target: targetXiexie },
      ];

      for (const { input, target } of basePinyinCases) {
        const res = evaluateSpeechPronunciation(input, target);
        expect(res.isCorrect).toBe(true);
        expect(res.score).toBe(80);
        expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      }
    });

    it('2.4: Tone slips / tone variations score 80 (pinyin_tone_insensitive)', () => {
      // Single character tone slips
      expect(evaluateSpeechPronunciation('tíng', targetTing).score).toBe(80);
      expect(evaluateSpeechPronunciation('tǐng', targetTing).score).toBe(80);
      expect(evaluateSpeechPronunciation('tìng', targetTing).score).toBe(80);

      expect(evaluateSpeechPronunciation('māng', targetMang).score).toBe(80);
      expect(evaluateSpeechPronunciation('mǎng', targetMang).score).toBe(80);
      expect(evaluateSpeechPronunciation('màng', targetMang).score).toBe(80);

      expect(evaluateSpeechPronunciation('lēng', targetLeng).score).toBe(80);
      expect(evaluateSpeechPronunciation('léng', targetLeng).score).toBe(80);
      expect(evaluateSpeechPronunciation('lèng', targetLeng).score).toBe(80);

      // Multi-character tone slips
      expect(evaluateSpeechPronunciation('nī hāo', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('ní háo', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('nì hào', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('duī bù qī', targetDuibuqi).score).toBe(80);
    });

    it('2.5: Numbered Pinyin (spaced, unspaced, digit variations) score 80', () => {
      // Single-character numbered pinyins
      expect(evaluateSpeechPronunciation('ting1', targetTing).score).toBe(80);
      expect(evaluateSpeechPronunciation('ting 1', targetTing).score).toBe(80);
      expect(evaluateSpeechPronunciation('leng3', targetLeng).score).toBe(80);
      expect(evaluateSpeechPronunciation('leng 3', targetLeng).score).toBe(80);
      expect(evaluateSpeechPronunciation('mang2', targetMang).score).toBe(80);
      expect(evaluateSpeechPronunciation('dian3', targetDian).score).toBe(80);
      expect(evaluateSpeechPronunciation('song4', targetSong).score).toBe(80);

      // Multi-character numbered pinyins
      expect(evaluateSpeechPronunciation('ni3 hao3', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('ni3hao3', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('ni 3 hao 3', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('dui4 bu5 qi3', targetDuibuqi).score).toBe(80);
      expect(evaluateSpeechPronunciation('dui4 bu0 qi3', targetDuibuqi).score).toBe(80);
      expect(evaluateSpeechPronunciation('dui4 bu qi3', targetDuibuqi).score).toBe(80);
      expect(evaluateSpeechPronunciation('tu2 shu1 guan3', targetTushuguan).score).toBe(80);
      expect(evaluateSpeechPronunciation('tu2shu1guan3', targetTushuguan).score).toBe(80);
    });

    it('2.6: Spaced pinyin phrases with irregular punctuation & whitespace tolerance', () => {
      // Multiple spaces
      expect(evaluateSpeechPronunciation('ni   hao', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('  tīng  ', targetTing).score).toBe(90);
      expect(evaluateSpeechPronunciation('dui   bu   qi', targetDuibuqi).score).toBe(80);

      // Punctuation and symbols
      expect(evaluateSpeechPronunciation('ni - hao!', targetNihao).score).toBe(80);
      expect(evaluateSpeechPronunciation('ting.', targetTing).score).toBe(80);
      expect(evaluateSpeechPronunciation('tīng!', targetTing).score).toBe(90);
      expect(evaluateSpeechPronunciation('dui, bu, qi...', targetDuibuqi).score).toBe(80);

      // Zero-width spaces & BOM characters
      expect(evaluateSpeechPronunciation('\u200Bting\uFEFF', targetTing).score).toBe(80);
      expect(evaluateSpeechPronunciation('ni\u200Bhao', targetNihao).score).toBe(80);
    });
  });

  // ==========================================================================
  // MANDATE 3: Multi-Character Words in Conversational Carrier Phrases
  // ==========================================================================
  describe('Mandate 3: Conversational Carrier Phrases Recognition', () => {

    it('3.1: Hanzi carrier phrases containing multi-character targets score 95 (hanzi_contains)', () => {
      const hanziCarrierCases: Array<{ phrase: string; target: WordItem }> = [
        { phrase: '老师你好！', target: targetNihao },
        { phrase: '我想说你好', target: targetNihao },
        { phrase: '你说你好吗', target: targetNihao },
        { phrase: '你好我的朋友', target: targetNihao },
        { phrase: '真的对不起大家', target: targetDuibuqi },
        { phrase: '对不起，我迟到了', target: targetDuibuqi },
        { phrase: '我们去图书馆看书', target: targetTushuguan },
        { phrase: '我是中国人', target: targetZhongguo },
        { phrase: '中国很大', target: targetZhongguo },
        { phrase: '非常谢谢你的关心', target: targetXiexie },
      ];

      for (const { phrase, target } of hanziCarrierCases) {
        const res = evaluateSpeechPronunciation(phrase, target);
        expect(res.isCorrect, `Carrier phrase "${phrase}" should match ${target.hanzi}`).toBe(true);
        expect(res.score).toBe(95);
        expect(res.matchedBy).toBe('hanzi_contains');
        expect(res.matchLevel).toBe('hanzi_contains');
      }
    });

    it('3.2: Pinyin Latin carrier phrases containing multi-character targets score 80', () => {
      const pinyinCarrierCases: Array<{ phrase: string; target: WordItem }> = [
        { phrase: 'wo xiang shuo ni hao', target: targetNihao },
        { phrase: 'lao shi ni hao ya', target: targetNihao },
        { phrase: 'da jia hao wo shi zhong guo ren', target: targetZhongguo },
        { phrase: 'zhen de dui bu qi da jia', target: targetDuibuqi },
        { phrase: 'wo men qu tu shu guan ba', target: targetTushuguan },
      ];

      for (const { phrase, target } of pinyinCarrierCases) {
        const res = evaluateSpeechPronunciation(phrase, target);
        expect(res.isCorrect, `Pinyin phrase "${phrase}" should match ${target.hanzi}`).toBe(true);
        expect(res.score).toBe(80);
        expect(res.matchedBy).toBe('pinyin_tone_insensitive');
      }
    });

    it('3.3: Single-character targets in conversational carrier phrases recognized accurately', () => {
      // Hanzi carrier phrases for single-character words
      expect(evaluateSpeechPronunciation('我想听音乐', targetTing).score).toBe(95);
      expect(evaluateSpeechPronunciation('今天天气很冷', targetLeng).score).toBe(95);
      expect(evaluateSpeechPronunciation('我很忙', targetMang).score).toBe(95);
      expect(evaluateSpeechPronunciation('请等一下', targetDeng).score).toBe(95);

      // Pinyin carrier phrases for single-character words (word boundary preserved)
      expect(evaluateSpeechPronunciation('wo xiang ting yin yue', targetTing).score).toBe(80);
      expect(evaluateSpeechPronunciation('wo hen mang', targetMang).score).toBe(80);
      expect(evaluateSpeechPronunciation('tian qi hen leng', targetLeng).score).toBe(80);
      expect(evaluateSpeechPronunciation('wo yao dian cai', targetDian).score).toBe(80);
      expect(evaluateSpeechPronunciation('qing bang wo', { hanzi: '帮', pinyin: 'bāng' }).score).toBe(80);
    });
  });

  // ==========================================================================
  // MANDATE 4: Sub-syllables, Fragments, and Noise Rejection
  // ==========================================================================
  describe('Mandate 4: Phonetic Fragments and Noise Strict Rejection', () => {

    it('4.1: Sub-syllable fragments of multi-character targets strictly rejected with score 0', () => {
      // Fragments of "中国" (zhōng guó)
      const zhongguoFragments = ['on', 'go', 'ng', 'zh', 'ong', 'guo', 'zhon', '中', '国'];
      for (const frag of zhongguoFragments) {
        const res = evaluateSpeechPronunciation(frag, targetZhongguo);
        expect(res.isCorrect, `Fragment "${frag}" should be rejected for 中国`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }

      // Fragments of "对不起" (duì bu qǐ)
      const duibuqiFragments = ['dui', 'bu', 'qi', 'du', 'ui', 'iq', '对不', '不起', '对'];
      for (const frag of duibuqiFragments) {
        const res = evaluateSpeechPronunciation(frag, targetDuibuqi);
        expect(res.isCorrect, `Fragment "${frag}" should be rejected for 对不起`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }

      // Fragments of "图书馆" (tú shū guǎn)
      const tushuguanFragments = ['tu', 'shu', 'guan', '图书', '书馆', '馆'];
      for (const frag of tushuguanFragments) {
        const res = evaluateSpeechPronunciation(frag, targetTushuguan);
        expect(res.isCorrect, `Fragment "${frag}" should be rejected for 图书馆`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('4.2: Falsy, empty, whitespace-only, and punctuation-only inputs return score 0', () => {
      const emptyInputs = ['', '   ', '\t\n', '...', '?!,', '---', '（）《》', '12345'];
      for (const input of emptyInputs) {
        const res = evaluateSpeechPronunciation(input, targetNihao);
        expect(res.isCorrect).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('4.3: Edge case: 2-character word with short pinyin (e.g. 阿姨 ā yí) handles carrier & rejects sub-tokens', () => {
      const targetAyi: WordItem = {
        id: 'w-ayi',
        hanzi: '阿姨',
        pinyin: 'ā yí',
        vietnamese: 'Dì; Cô',
        hskLevel: 2,
      };

      // Legitimate exact and tone variations
      expect(evaluateSpeechPronunciation('阿姨', targetAyi).score).toBe(100);
      expect(evaluateSpeechPronunciation('ā yí', targetAyi).score).toBe(90);
      expect(evaluateSpeechPronunciation('a yi', targetAyi).score).toBe(80);
      expect(evaluateSpeechPronunciation('a1 yi2', targetAyi).score).toBe(80);

      // Carrier phrase with word boundary
      expect(evaluateSpeechPronunciation('wo de ayi', targetAyi).score).toBe(80);
      expect(evaluateSpeechPronunciation('这是我的阿姨', targetAyi).score).toBe(95);

      // English words containing 'ayi' as substring (e.g. "playing", "saying") must be rejected
      expect(evaluateSpeechPronunciation('playing', targetAyi).score).toBe(0);
      expect(evaluateSpeechPronunciation('saying', targetAyi).score).toBe(0);
      expect(evaluateSpeechPronunciation('daylight', targetAyi).score).toBe(0);
    });
  });

  // ==========================================================================
  // MANDATE 5: Deep Stress, Case Invariance, Overloads, & Fuzzing
  // ==========================================================================
  describe('Mandate 5: Deep Stress, Polyphones, Case Invariance & Overloads', () => {

    it('5.1: Case-insensitivity stress across English attack vectors strictly scores 0', () => {
      const casingAttacks = [
        'MEETING', 'Meeting', 'mEeTiNg', 'wAiTiNg', 'WAITING',
        'PAINTING', 'Painting', 'LENGTH', 'Length', 'lEnGtH',
        'CHALLENGE', 'Challenge', 'MANGO', 'Mango', 'mAnGo',
        'KANGAROO', 'Kangaroo', 'BOOMERANG', 'Boomerang',
        'DANGER', 'Danger', 'ORANGE', 'Orange',
        'SONGWRITER', 'Songwriter', 'DINGDONG', 'Dingdong',
        'COMEDIAN', 'Comedian', 'GUARDIAN', 'Guardian',
        'RADIANT', 'Radiant', 'ITALIAN', 'Italian',
      ];

      for (const attack of casingAttacks) {
        expect(evaluateSpeechPronunciation(attack, targetTing).score, `${attack} vs 听`).toBe(0);
        expect(evaluateSpeechPronunciation(attack, targetLeng).score, `${attack} vs 冷`).toBe(0);
        expect(evaluateSpeechPronunciation(attack, targetMang).score, `${attack} vs 忙`).toBe(0);
        expect(evaluateSpeechPronunciation(attack, targetSong).score, `${attack} vs 送`).toBe(0);
        expect(evaluateSpeechPronunciation(attack, targetDian).score, `${attack} vs 点`).toBe(0);
      }
    });

    it('5.2: Polyphone & -ing suffix words against 行 (xíng / háng)', () => {
      const targetXingHang: WordItem = {
        id: 'w-xing-hang',
        hanzi: '行',
        pinyin: 'xíng',
        vietnamese: 'Đi; Được',
        hskLevel: 1,
      };

      // Legitimate pronunciations
      expect(evaluateSpeechPronunciation('行', targetXingHang).score).toBe(100);
      expect(evaluateSpeechPronunciation('xíng', targetXingHang).score).toBe(90);
      expect(evaluateSpeechPronunciation('xing', targetXingHang).score).toBe(80);
      expect(evaluateSpeechPronunciation('xing2', targetXingHang).score).toBe(80);

      // English words ending in -xing
      const xingEnglishWords = ['boxing', 'fixing', 'mixing', 'relaxing', 'taxing', 'faxing'];
      for (const word of xingEnglishWords) {
        const res = evaluateSpeechPronunciation(word, targetXingHang);
        expect(res.isCorrect, `English word "${word}" must not match 行`).toBe(false);
        expect(res.score).toBe(0);
        expect(res.matchedBy).toBe('none');
      }
    });

    it('5.3: Overloaded parameter signatures (string, object without pinyin, full WordItem)', () => {
      // 1. Raw Hanzi string as expected target
      expect(evaluateSpeechPronunciation('听', '听').score).toBe(100);
      expect(evaluateSpeechPronunciation('tīng', '听').score).toBe(90);
      expect(evaluateSpeechPronunciation('ting', '听').score).toBe(80);
      expect(evaluateSpeechPronunciation('meeting', '听').score).toBe(0);
      expect(evaluateSpeechPronunciation('waiting', '听').score).toBe(0);

      // 2. Minimal object without pinyin field
      expect(evaluateSpeechPronunciation('听', { hanzi: '听' }).score).toBe(100);
      expect(evaluateSpeechPronunciation('tīng', { hanzi: '听' }).score).toBe(90);
      expect(evaluateSpeechPronunciation('ting', { hanzi: '听' }).score).toBe(80);
      expect(evaluateSpeechPronunciation('meeting', { hanzi: '听' }).score).toBe(0);

      // 3. Object with explicit pinyin field
      expect(evaluateSpeechPronunciation('听', { hanzi: '听', pinyin: 'tīng' }).score).toBe(100);
      expect(evaluateSpeechPronunciation('tīng', { hanzi: '听', pinyin: 'tīng' }).score).toBe(90);
      expect(evaluateSpeechPronunciation('ting', { hanzi: '听', pinyin: 'tīng' }).score).toBe(80);
      expect(evaluateSpeechPronunciation('meeting', { hanzi: '听', pinyin: 'tīng' }).score).toBe(0);
    });

    it('5.4: Adversarial Fuzzing: 500 synthesized carrier and noise attacks against single characters', () => {
      const singleTargets = [
        { word: targetTing, pinyin: 'ting' },
        { word: targetLeng, pinyin: 'leng' },
        { word: targetMang, pinyin: 'mang' },
        { word: targetSong, pinyin: 'song' },
        { word: targetDian, pinyin: 'dian' },
      ];

      const englishNoiseWords = [
        'meeting', 'waiting', 'painting', 'building', 'morning',
        'length', 'challenge', 'strength',
        'mango', 'kangaroo', 'boomerang', 'danger', 'orange',
        'songwriter', 'dingdong', 'belong',
        'comedian', 'guardian', 'radiant', 'italian', 'canadian',
      ];

      const englishCarriers = [
        'i have a', 'there is a', 'we saw the', 'it was a',
        'please avoid the', 'she mentioned the', 'he bought some',
      ];

      // Fuzz 500 noise combinations: english carrier + english noise word -> must strictly score 0
      let trial = 0;
      for (let i = 0; i < 100; i++) {
        const carrier = englishCarriers[i % englishCarriers.length];
        const noise = englishNoiseWords[i % englishNoiseWords.length];
        const targetObj = singleTargets[i % singleTargets.length];

        const sentence1 = `${carrier} ${noise}`;
        const sentence2 = `${noise} happens today`;

        const res1 = evaluateSpeechPronunciation(sentence1, targetObj.word);
        expect(res1.score, `Trial ${trial++}: "${sentence1}" vs ${targetObj.word.hanzi}`).toBe(0);
        expect(res1.isCorrect).toBe(false);

        const res2 = evaluateSpeechPronunciation(sentence2, targetObj.word);
        expect(res2.score, `Trial ${trial++}: "${sentence2}" vs ${targetObj.word.hanzi}`).toBe(0);
        expect(res2.isCorrect).toBe(false);
      }
      expect(trial).toBe(200);
    });

    it('5.5: Adversarial Fuzzing: 300 randomized legitimate pinyin variations strictly pass', () => {
      const targets = [
        { word: targetNihao, basePinyin: 'ni hao', tones: ['nǐ hǎo', 'ni3 hao3', 'ni3hao3', 'nī hāo', 'ní háo'] },
        { word: targetDuibuqi, basePinyin: 'dui bu qi', tones: ['duì bu qǐ', 'dui4 bu5 qi3', 'dui4 bu0 qi3', 'duī bù qī'] },
        { word: targetTushuguan, basePinyin: 'tu shu guan', tones: ['tú shū guǎn', 'tu2 shu1 guan3', 'tu2shu1guan3'] },
        { word: targetTing, basePinyin: 'ting', tones: ['tīng', 'ting1', 'ting2', 'ting3', 'ting4', 'tíng', 'tǐng'] },
        { word: targetLeng, basePinyin: 'leng', tones: ['lěng', 'leng3', 'leng 3', 'léng', 'lēng', 'lèng'] },
      ];

      let trial = 0;
      for (const t of targets) {
        // Base pinyin must score 80
        const resBase = evaluateSpeechPronunciation(t.basePinyin, t.word);
        expect(resBase.isCorrect).toBe(true);
        expect(resBase.score).toBeGreaterThanOrEqual(80);
        trial++;

        // Tone variants must score >= 80
        for (const variant of t.tones) {
          const res = evaluateSpeechPronunciation(variant, t.word);
          expect(res.isCorrect, `Trial ${trial++}: "${variant}" for ${t.word.hanzi}`).toBe(true);
          expect(res.score).toBeGreaterThanOrEqual(80);
        }
      }
      expect(trial).toBeGreaterThanOrEqual(25);
    });
  });
});
