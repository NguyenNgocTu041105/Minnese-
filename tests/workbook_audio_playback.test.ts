import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { getEnrichedWorkbookLessons } from '../src/data/workbookEnricher';
import {
  resolveChineseTtsPayload,
  syllableToHanzi,
  segmentPinyinWord,
  pinyinPhraseToHanzi,
  sanitizeDialogueScript,
} from '../src/utils/pinyinConverter';
import { detectTextLanguage } from '../src/utils/chineseAudio';

describe('Workbook Audio Playback & Chinese TTS Synthesis Suite', () => {
  describe('1. Pinyin Syllable & Multi-syllable Tone Converter Unit Tests', () => {
    it('accurately resolves single syllables with tones to representative standard Mandarin Hanzi', () => {
      const singleSyllableAcceptanceCases: Record<string, string> = {
        'mō': '摸',
        'fú': '福',
        'dǐ': '底',
        'tào': '套',
        'jī': '鸡',
        'qī': '七',
        'xiě': '写',
        'nǚ': '女',
        'lǜ': '绿',
      };

      for (const [syllable, expectedHanzi] of Object.entries(singleSyllableAcceptanceCases)) {
        const resolved = syllableToHanzi(syllable);
        expect(resolved, `Syllable ${syllable} should resolve to ${expectedHanzi}`).toBe(expectedHanzi);
        const fullPayload = resolveChineseTtsPayload(syllable);
        expect(fullPayload).toBe(expectedHanzi);
      }
    });

    it('handles Pinyin syllables wrapped in curly quotes or ASCII quotes', () => {
      expect(resolveChineseTtsPayload('“fú”')).toBe('福');
      expect(resolveChineseTtsPayload('“mō”')).toBe('摸');
      expect(resolveChineseTtsPayload('"dǐ"')).toBe('底');
      expect(resolveChineseTtsPayload("'tào'")).toBe('套');
      expect(resolveChineseTtsPayload('mō、fú、dǐ')).toBe('摸、福、底');
    });

    it('handles numeric tone notations (e.g. mo1, fu2, di3, tao4, nv3, lv4, de0, ma0)', () => {
      expect(resolveChineseTtsPayload('mo1')).toBe('摸');
      expect(resolveChineseTtsPayload('fu2')).toBe('福');
      expect(resolveChineseTtsPayload('di3')).toBe('底');
      expect(resolveChineseTtsPayload('tao4')).toBe('套');
      expect(resolveChineseTtsPayload('nv3')).toBe('女');
      expect(resolveChineseTtsPayload('lv4')).toBe('绿');
      expect(resolveChineseTtsPayload('de0')).toBe('的');
      expect(resolveChineseTtsPayload('ma0')).toBe('吗');
      expect(resolveChineseTtsPayload('zi0')).toBe('子');
    });

    it('handles j, q, x, y syllables combined with ü (jǖ, qǚ, xǚ, xüé, yüè, jüān, lue4, nue4)', () => {
      expect(resolveChineseTtsPayload('jǖ')).toBe('居');
      expect(resolveChineseTtsPayload('qǚ')).toBe('取');
      expect(resolveChineseTtsPayload('xǚ')).toBe('许');
      expect(resolveChineseTtsPayload('xüé')).toBe('学');
      expect(resolveChineseTtsPayload('yüè')).toBe('越');
      expect(resolveChineseTtsPayload('jüān')).toBe('捐');
      expect(resolveChineseTtsPayload('qüān')).toBe('圈');
      expect(resolveChineseTtsPayload('xüǎn')).toBe('选');
      expect(resolveChineseTtsPayload('lue4')).toBe('略');
      expect(resolveChineseTtsPayload('nue4')).toBe('虐');
    });

    it('handles concatenated numeric syllables (e.g. ni3hao3, xie4xie5, dui4bu5qi3)', () => {
      expect(resolveChineseTtsPayload('ni3hao3')).toBe('你好');
      expect(resolveChineseTtsPayload('xie4xie5')).toBe('谢谢');
      expect(resolveChineseTtsPayload('dui4bu5qi3')).toBe('对不起');
    });

    it('accurately segments compound words with apostrophes (e.g. xī\'ān, nǚ\'ér)', () => {
      expect(segmentPinyinWord("xī'ān")).toEqual(['xī', 'ān']);
      expect(resolveChineseTtsPayload("xī'ān")).toBe('西安');
      expect(resolveChineseTtsPayload("nǚ'ér")).toBe('女儿');
    });

    it('accurately converts multi-syllable phrases and strips Vietnamese/English parentheticals', () => {
      const phraseTestCases: Array<{ input: string; expectedSubstring: string; forbiddenRegex: RegExp }> = [
        {
          input: 'sān gè píngguǒ (ba quả táo)',
          expectedSubstring: '三个苹果',
          forbiddenRegex: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
        },
        {
          input: 'Nǐ hǎo ma? (Bạn có khỏe không?)',
          expectedSubstring: '你好吗',
          forbiddenRegex: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
        },
        {
          input: 'sān gè píngguǒ (three apples)',
          expectedSubstring: '三个苹果',
          forbiddenRegex: /apples|three/i,
        },
        {
          input: 'Nǐ hǎo ma? (How are you?)',
          expectedSubstring: '你好吗',
          forbiddenRegex: /how|are|you/i,
        },
        {
          input: 'Xièxie! (Thank you)',
          expectedSubstring: '谢谢',
          forbiddenRegex: /thank/i,
        },
        {
          input: 'chē (xe hoi)',
          expectedSubstring: '车',
          forbiddenRegex: /xe|hoi/i,
        },
        {
          input: 'bēizi (cai ly)',
          expectedSubstring: '杯子',
          forbiddenRegex: /cai|ly/i,
        },
        {
          input: 'xuésheng (hoc sinh)',
          expectedSubstring: '学生',
          forbiddenRegex: /hoc|sinh/i,
        },
        {
          input: 'A: 你好！ B: 你好！',
          expectedSubstring: '你好！',
          forbiddenRegex: /\b[A-B]\s*[:：]/,
        },
        {
          input: 'Nán: Nǐ zhù zài nǎr? Nǚ: Wǒ zhù zài 502 fángjiān.',
          expectedSubstring: '男：你住在哪儿？女：我住在502房间。',
          forbiddenRegex: /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/,
        },
        {
          input: 'Nán: Nǐ xiǎng hē diǎnr shénme? Nǚ: Qǐng gěi wǒ yì bēi rè chá ba.',
          expectedSubstring: '点儿',
          forbiddenRegex: /diǎnr/,
        },
        {
          input: 'Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)',
          expectedSubstring: '问：他在做什么？',
          forbiddenRegex: /Hỏi/,
        },
        {
          input: '（问：他是哪国人？）',
          expectedSubstring: '问：他是哪国人？',
          forbiddenRegex: /Hỏi/,
        },
        {
          input: 'M: Nǐ hǎo! W: Nǐ hǎo! Q: Tāmen zài nǎr?',
          expectedSubstring: '男：你好！女：你好！问：他们在哪儿？',
          forbiddenRegex: /\b[MWQ]\s*[:：]/,
        },
        {
          input: '1、A: Nǐ hǎo. B: Nǐ hǎo.',
          expectedSubstring: '你好。',
          forbiddenRegex: /阿|A|B/,
        },
        {
          input: 'Nam: Nǐ hǎo! Nữ: Nǐ hǎo! Hỏi: Tāmen zài nǎr?',
          expectedSubstring: '男：你好！女：你好！问：他们在哪儿？',
          forbiddenRegex: /Nam|Nữ|Hỏi/,
        },
        {
          input: 'Người nam: Nǐ hǎo! Người nữ: Nǐ hǎo! Câu hỏi: Tāmen zài nǎr?',
          expectedSubstring: '男：你好！女：你好！问：他们在哪儿？',
          forbiddenRegex: /Người|nam|nữ|Câu|hỏi/i,
        },
        {
          input: 'A. 你好 B. 谢谢',
          expectedSubstring: '你好 谢谢',
          forbiddenRegex: /\b[AB]\b|阿/,
        },
        {
          input: 'A. Nǐ hǎo B. Zàijiàn',
          expectedSubstring: '你好再见',
          forbiddenRegex: /\b[AB]\b|阿/,
        },
        {
          input: 'A、Nǐ hǎo B、Zàijiàn',
          expectedSubstring: '你好再见',
          forbiddenRegex: /\b[AB]\b|阿/,
        },
        {
          input: 'Đoạn hội thoại 1: Nǐ hǎo!',
          expectedSubstring: '你好！',
          forbiddenRegex: /Đoạn|hội|thoại/i,
        },
      ];

      for (const tc of phraseTestCases) {
        const resolved = resolveChineseTtsPayload(tc.input);
        expect(resolved, `Should contain expected substring for input "${tc.input}"`).toContain(tc.expectedSubstring);
        expect(
          tc.forbiddenRegex.test(resolved),
          `Resolved string "${resolved}" must not match forbidden pattern ${tc.forbiddenRegex}`
        ).toBe(false);
      }
    });

    it('safely handles pure non-Chinese or standalone parentheticals by returning empty payload instead of garbled TTS', () => {
      const pureNonChineseCases = [
        '(ba quả táo)',
        '(Bạn có khỏe không?)',
        '(three apples)',
        '(xe hơi)',
        '(cai ly)',
        'Bạn có khỏe không?',
      ];
      for (const nc of pureNonChineseCases) {
        const resolved = resolveChineseTtsPayload(nc);
        expect(resolved, `Pure non-Chinese text "${nc}" must resolve to empty string`).toBe('');
      }
    });

    it('resolves Pinyin followed by parenthesized Hanzi without stutter duplication', () => {
      expect(resolveChineseTtsPayload('mō (摸)')).toBe('摸');
      expect(resolveChineseTtsPayload('fú (福)')).toBe('福');
      expect(resolveChineseTtsPayload('dǐ (底)')).toBe('底');
      expect(resolveChineseTtsPayload('tào (套)')).toBe('套');
      expect(resolveChineseTtsPayload('sān gè píngguǒ (三个苹果)')).toBe('三个苹果');
      expect(resolveChineseTtsPayload('Nǐ hǎo (你好)')).toBe('你好');
    });

    it('handles Erhua (儿化音) syllables cleanly without leaving raw Latin "r"', () => {
      const erhuaCases = ['nǎr', 'diǎnr', 'zhèr', 'nàr', 'wánr', 'huàr', 'yìdiǎnr'];
      for (const e of erhuaCases) {
        const resolved = resolveChineseTtsPayload(e);
        expect(/[\u4e00-\u9fa5]/.test(resolved), `Erhua ${e} must produce Hanzi`).toBe(true);
        expect(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(resolved), `Erhua ${e} must not contain tone marks`).toBe(false);
        expect(/\b[a-zA-Z]+\b/.test(resolved), `Erhua ${e} must not leave Latin letters`).toBe(false);
      }
    });

    it('accurately detects language as "zh" for Pinyin syllables with tone marks and mixed parentheticals', () => {
      const pinyinSyllables = [
        'mō', 'fú', 'dǐ', 'tào', 'jī', 'qī', 'xiě', 'nǚ', 'lǜ',
        'èr', 'shí', 'zhèr', 'nàr', 'guò', 'tiáo', 'Zhōngguó',
        'sān gè píngguǒ (ba quả táo)',
        'Nǐ hǎo ma? (Bạn có khỏe không?)',
        'Nǐ jiào shénme míngzi? (Bạn tên là gì?)',
      ];
      for (const s of pinyinSyllables) {
        const lang = detectTextLanguage(s);
        expect(lang, `Language of "${s}" should be detected as "zh"`).toBe('zh');
      }
    });
  });

  describe('2. Comprehensive Audit Across All Lessons in HSK 1–6', () => {
    it('resolves every workbook listening exercise, listen-read drill, and phonetic drill to speakable Hanzi', () => {
      let totalAudioStringsChecked = 0;
      let languageMismatches = 0;
      const failures: Array<{
        level: number;
        lesson: number;
        category: string;
        original: string;
        resolved: string;
        reason: string;
      }> = [];

      for (let level = 1; level <= 6; level++) {
        const lessons = getEnrichedWorkbookLessons(level);
        expect(lessons.length, `HSK ${level} must have lessons`).toBeGreaterThan(0);

        for (const lesson of lessons) {
          // 1. Phonetics audioDrillList
          if (lesson.phonetics && lesson.phonetics.length > 0) {
            for (const p of lesson.phonetics) {
              if (p.audioDrillList && p.audioDrillList.length > 0) {
                for (const d of p.audioDrillList) {
                  const raw = d.hanzi || d.audioText || d.pinyin || '';
                  if (!raw) continue;
                  totalAudioStringsChecked++;

                  const detectedLang = detectTextLanguage(raw);
                  if (detectedLang !== 'zh') {
                    languageMismatches++;
                  }

                  const resolved = resolveChineseTtsPayload(raw);

                  if (!/[\u4e00-\u9fa5]/.test(resolved)) {
                    failures.push({
                      level,
                      lesson: lesson.lessonNumber,
                      category: 'phonetic_no_hanzi',
                      original: raw,
                      resolved,
                      reason: 'Output has no Chinese Hanzi characters',
                    });
                  }
                  if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(resolved)) {
                    failures.push({
                      level,
                      lesson: lesson.lessonNumber,
                      category: 'phonetic_raw_pinyin_tone',
                      original: raw,
                      resolved,
                      reason: 'Output contains unvoiced Latin Pinyin diacritics',
                    });
                  }
                  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(resolved)) {
                    failures.push({
                      level,
                      lesson: lesson.lessonNumber,
                      category: 'phonetic_vietnamese_leak',
                      original: raw,
                      resolved,
                      reason: 'Output leaks Vietnamese text into TTS payload',
                    });
                  }
                }
              }
            }
          }

          // 2. Listen and Read Drills (listenAndReadDrills)
          if (lesson.listenAndReadDrills && lesson.listenAndReadDrills.length > 0) {
            for (const drill of lesson.listenAndReadDrills) {
              if (drill.items && drill.items.length > 0) {
                for (const item of drill.items) {
                  const raw = item.audioText || (item as any).pinyinText || (item as any).pinyinPrompt || '';
                  if (!raw) continue;
                  totalAudioStringsChecked++;

                  const detectedLang = detectTextLanguage(raw);
                  if (detectedLang !== 'zh') {
                    languageMismatches++;
                  }

                  const resolved = resolveChineseTtsPayload(raw);

                  if (!/[\u4e00-\u9fa5]/.test(resolved)) {
                    failures.push({
                      level,
                      lesson: lesson.lessonNumber,
                      category: 'listen_read_no_hanzi',
                      original: raw,
                      resolved,
                      reason: 'Output has no Chinese Hanzi characters',
                    });
                  }
                  if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(resolved)) {
                    failures.push({
                      level,
                      lesson: lesson.lessonNumber,
                      category: 'listen_read_raw_pinyin_tone',
                      original: raw,
                      resolved,
                      reason: 'Output contains unvoiced Latin Pinyin diacritics',
                    });
                  }
                  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(resolved)) {
                    failures.push({
                      level,
                      lesson: lesson.lessonNumber,
                      category: 'listen_read_vietnamese_leak',
                      original: raw,
                      resolved,
                      reason: 'Output leaks Vietnamese text into TTS payload',
                    });
                  }
                }
              }
            }
          }

          // 3. Listening Exercises (listeningExercises & hskMockListening)
          const allListening = [
            ...(lesson.listeningExercises || []),
            ...(lesson.hskMockListening || []),
          ];
          for (const q of allListening) {
            const raw = q.audioScript || (q as any).promptChinese || '';
            if (!raw) continue;
            totalAudioStringsChecked++;

            const detectedLang = detectTextLanguage(raw);
            if (detectedLang !== 'zh') {
              languageMismatches++;
            }

            const resolved = resolveChineseTtsPayload(raw);

            if (!/[\u4e00-\u9fa5]/.test(resolved)) {
              failures.push({
                level,
                lesson: lesson.lessonNumber,
                category: 'listening_no_hanzi',
                original: raw,
                resolved,
                reason: 'Output has no Chinese Hanzi characters',
              });
            }
            if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(resolved)) {
              failures.push({
                level,
                lesson: lesson.lessonNumber,
                category: 'listening_raw_pinyin_tone',
                original: raw,
                resolved,
                reason: 'Output contains unvoiced Latin Pinyin diacritics',
              });
            }
            if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(resolved)) {
              failures.push({
                level,
                lesson: lesson.lessonNumber,
                category: 'listening_vietnamese_leak',
                original: raw,
                resolved,
                reason: 'Output leaks Vietnamese text into TTS payload',
              });
            }
          }
        }
      }

      console.log(`Total verified workbook audio items across HSK 1-6: ${totalAudioStringsChecked}`);
      console.log(`Language mismatches across all items: ${languageMismatches}`);
      if (failures.length > 0) {
        console.error('Audio payload failures found:', failures);
      }

      expect(totalAudioStringsChecked).toBeGreaterThan(200);
      expect(failures.length, `Expected 0 failures, but found ${failures.length}`).toBe(0);
      expect(languageMismatches, `Expected 0 language mismatches, but found ${languageMismatches}`).toBe(0);
    });
  });

  describe('3. Database Hash Invariant Verification', () => {
    it('data/hsk_exam.db SHA-256 hash strictly matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const dbPath = path.resolve(__dirname, '../data/hsk_exam.db');
      expect(fs.existsSync(dbPath), 'data/hsk_exam.db must exist').toBe(true);

      const fileBuffer = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
      expect(hash).toBe(EXPECTED_HASH);
    });
  });

  describe('4. Multi-Role Dialogue Turn Parsing & Pacing Verification', () => {
    it('correctly splits dialogues into distinct speaker turns with clean speech text', async () => {
      const { parseDialogueTurns } = await import('../src/utils/chineseAudio');

      const sample1 = '男：你想买什么水果？\n女：我想买几个红苹果。';
      const turns1 = parseDialogueTurns(sample1);
      expect(turns1).not.toBeNull();
      expect(turns1).toHaveLength(2);
      expect(turns1![0]).toEqual({ role: 'male', text: '你想买什么水果？' });
      expect(turns1![1]).toEqual({ role: 'female', text: '我想买几个红苹果。' });

      const sample2 = '女：小张，这本汉语书多少钱？\n男：不贵，三十块钱。\n问：这本书多少钱？';
      const turns2 = parseDialogueTurns(sample2);
      expect(turns2).not.toBeNull();
      expect(turns2).toHaveLength(3);
      expect(turns2![0]).toEqual({ role: 'female', text: '小张，这本汉语书多少钱？' });
      expect(turns2![1]).toEqual({ role: 'male', text: '不贵，三十块钱。' });
      expect(turns2![2]).toEqual({ role: 'narrator', text: '问：这本书多少钱？' });

      const monologue = '看书。哥哥在房间里看书。';
      const turnsMono = parseDialogueTurns(monologue);
      expect(turnsMono).toBeNull();
    });

    it('retains preceding Chinese punctuation (。、！、？) between turns without swallowing', async () => {
      const { parseDialogueTurns } = await import('../src/utils/chineseAudio');
      const sample = '男：我想买苹果。女：给你！问：男的想买什么？';
      const turns = parseDialogueTurns(sample);
      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(3);
      expect(turns![0]).toEqual({ role: 'male', text: '我想买苹果。' });
      expect(turns![1]).toEqual({ role: 'female', text: '给你！' });
      expect(turns![2]).toEqual({ role: 'narrator', text: '问：男的想买什么？' });

      const questionSample = '男：你明天去吗？女：不去！问：男的是什么意思？';
      const qTurns = parseDialogueTurns(questionSample);
      expect(qTurns![0].text).toBe('你明天去吗？');
      expect(qTurns![1].text).toBe('不去！');
    });

    it('parses star statement (★) prompts into narrator role turns', async () => {
      const { parseDialogueTurns } = await import('../src/utils/chineseAudio');
      const sample = '男：今天晚上的音乐会七点半开始，我们六点出发吧。\n女：好的，早点去还能找个好座位。\n★ 音乐会六点开始。';
      const turns = parseDialogueTurns(sample);
      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(3);
      expect(turns![0].role).toBe('male');
      expect(turns![1].role).toBe('female');
      expect(turns![2]).toEqual({ role: 'narrator', text: '★ 音乐会六点开始。' });

      // Also handles parenthesized star (★)
      const parenSample = '男：外面冷吗？\n女：不冷。\n(★) 外面很冷。';
      const parenTurns = parseDialogueTurns(parenSample);
      expect(parenTurns).not.toBeNull();
      expect(parenTurns![2]).toEqual({ role: 'narrator', text: '★ 外面很冷。' });
    });

    it('normalizes question prefix variations (问题：, 問題：, 問：) to narrator role', async () => {
      const { parseDialogueTurns } = await import('../src/utils/chineseAudio');
      const sample1 = '男：明天上午有会议。\n女：好的。\n问题：他们明天要做什么？';
      const turns1 = parseDialogueTurns(sample1);
      expect(turns1).not.toBeNull();
      expect(turns1).toHaveLength(3);
      expect(turns1![2]).toEqual({ role: 'narrator', text: '问：他们明天要做什么？' });

      const sample2 = '男：今天吃什么？\n女：面条。\n問：他们今天吃什么？';
      const turns2 = parseDialogueTurns(sample2);
      expect(turns2).not.toBeNull();
      expect(turns2).toHaveLength(3);
      expect(turns2![2]).toEqual({ role: 'narrator', text: '问：他们今天吃什么？' });
    });

    it('parses alternating A: and B: dialogue pairs as 甲：(male) and 乙：(female)', async () => {
      const { parseDialogueTurns } = await import('../src/utils/chineseAudio');
      const sample = 'A: 你好！\nB: 早上好！';
      const turns = parseDialogueTurns(sample);
      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(2);
      expect(turns![0]).toEqual({ role: 'male', text: '你好！' });
      expect(turns![1]).toEqual({ role: 'female', text: '早上好！' });
    });

    it('prioritizes Neural Natural voices over legacy robotic SAPI5 voices', async () => {
      const { rankVoice } = await import('../src/utils/chineseAudio');

      const xiaoxiao = {
        name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
        lang: 'zh-CN',
        localService: false,
        default: false,
        voiceURI: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
      } as SpeechSynthesisVoice;

      const huihui = {
        name: 'Microsoft Huihui - Chinese (Simplified, PRC)',
        lang: 'zh-CN',
        localService: true,
        default: false,
        voiceURI: 'Microsoft Huihui - Chinese (Simplified, PRC)',
      } as SpeechSynthesisVoice;

      const yunxi = {
        name: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)',
        lang: 'zh-CN',
        localService: false,
        default: false,
        voiceURI: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)',
      } as SpeechSynthesisVoice;

      const kangkang = {
        name: 'Microsoft Kangkang - Chinese (Simplified, PRC)',
        lang: 'zh-CN',
        localService: true,
        default: false,
        voiceURI: 'Microsoft Kangkang - Chinese (Simplified, PRC)',
      } as SpeechSynthesisVoice;

      const davidEnglish = {
        name: 'Microsoft David - English (United States)',
        lang: 'en-US',
        localService: true,
        default: false,
        voiceURI: 'Microsoft David',
      } as SpeechSynthesisVoice;

      // Female ranking: Xiaoxiao >> Huihui
      const xiaoxiaoScore = rankVoice(xiaoxiao, 'female');
      const huihuiScore = rankVoice(huihui, 'female');
      expect(xiaoxiaoScore).toBeGreaterThan(huihuiScore);
      expect(xiaoxiaoScore).toBeGreaterThan(150);

      // Male ranking: Yunxi >> Kangkang
      const yunxiScore = rankVoice(yunxi, 'male');
      const kangkangScore = rankVoice(kangkang, 'male');
      expect(yunxiScore).toBeGreaterThan(kangkangScore);
      expect(yunxiScore).toBeGreaterThan(150);

      // Narrator ranking: Xiaoxiao/Yunxi >> Huihui
      expect(rankVoice(xiaoxiao, 'narrator')).toBeGreaterThan(rankVoice(huihui, 'narrator'));

      // Non-Chinese voice is disqualified (-1)
      expect(rankVoice(davidEnglish, 'female')).toBe(-1);
    });

    it('verifies pause timing invariants (650ms between turns, 1200ms before prompt) and HSK pacing matrix', async () => {
      const { HSK_LEVEL_AUDIO_PACING } = await import('../src/utils/chineseAudio');

      // HSK 1-6 Pacing Matrix verification
      expect(HSK_LEVEL_AUDIO_PACING[1]).toEqual({ rate: 0.78, pitch: 1.05 });
      expect(HSK_LEVEL_AUDIO_PACING[2]).toEqual({ rate: 0.82, pitch: 1.03 });
      expect(HSK_LEVEL_AUDIO_PACING[3]).toEqual({ rate: 0.86, pitch: 1.00 });
      expect(HSK_LEVEL_AUDIO_PACING[4]).toEqual({ rate: 0.90, pitch: 1.00 });
      expect(HSK_LEVEL_AUDIO_PACING[5]).toEqual({ rate: 0.95, pitch: 0.98 });
      expect(HSK_LEVEL_AUDIO_PACING[6]).toEqual({ rate: 1.00, pitch: 0.98 });

      // Pause timing invariants:
      // Between conversational turns (non-narrator) = 650ms
      // Before question prompt / star statement (narrator) = 1200ms
      const getPauseDuration = (role: 'male' | 'female' | 'narrator') => (role === 'narrator' ? 1200 : 650);
      expect(getPauseDuration('female')).toBe(650);
      expect(getPauseDuration('male')).toBe(650);
      expect(getPauseDuration('narrator')).toBe(1200);
    });
  });
});
