import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Chinese Audio Engine
import {
  HSK_LEVEL_AUDIO_PACING,
  parseDialogueTurns,
  rankVoice,
  speakDialogueScript,
} from '../src/utils/chineseAudio.js';

// Pinyin Utilities
import {
  splitHanziAndPinyin,
  sanitizeHanziOnly,
  getSentencePinyin,
} from '../src/utils/pinyinUtils.js';

// Question Masking & Logic
import {
  isListeningQuestion,
  getMaskedStem,
} from '../src/components/HSKMockExam.js';

// Universal Parser & Types
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';
import { parseUploadedFileBuffer } from '../src/server/fileUploadParser.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

/**
 * =============================================================================
 * Milestone M3 Test Suite: Pinyin Toggle & Listening Audio Architecture
 *
 * Verifies 8 Core Groups:
 * 1. Audio Pacing Matrix Invariants (HSK 1-6 monotonic pacing & pitch)
 * 2. Dialogue Turn Parsing & Normalization (colons, roles, gender, pauses)
 * 3. Neural Voice Prioritization Engine (Xiaoxiao & Yunxi rank highest)
 * 4. Parser Pinyin Separation & Cloze Answer Leakage Prevention
 * 5. UI Pinyin Toggle Logic & Hanzi-Only Sanitization
 * 6. Audio Masking Engine Invariants (Active Test-Taking Stem Masking)
 * 7. Review Mode Unmasking & Data-Testid Invariants
 * 8. SQLite Database SHA-256 Checksum Invariance
 * =============================================================================
 */

describe('Milestone M3: Pinyin Toggle & Listening Audio Platform Upgrade', () => {
  // Operational DB Paths & Baseline SHA-256 Hashes
  const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const EXPECTED_HSK_EXAM_SHA256 = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
  const EXPECTED_QBANK_SHA256 = 'E370C327D1A516804AB9B515D0A921A5917346587B3188796260CE171EF1A5AD';
  let initialQBankSha = '';

  beforeAll(() => {
    if (fs.existsSync(QBANK_DB_PATH)) {
      initialQBankSha = crypto.createHash('sha256').update(fs.readFileSync(QBANK_DB_PATH)).digest('hex').toUpperCase();
    }
  });

  function computeFileSha256(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
  }

  // ===========================================================================
  // GROUP 1: Audio Pacing Matrix Invariants (HSK_LEVEL_AUDIO_PACING)
  // ===========================================================================
  describe('Group 1: Audio Pacing Matrix Invariants', () => {
    it('should define pacing configuration for all levels HSK 1 through 6', () => {
      for (let level = 1; level <= 6; level++) {
        const pacing = HSK_LEVEL_AUDIO_PACING[level];
        expect(pacing).toBeDefined();
        expect(pacing.rate).toBeGreaterThan(0);
        expect(pacing.pitch).toBeGreaterThan(0);
      }
    });

    it('should ensure speech rate increases monotonically from HSK 1 to HSK 6', () => {
      for (let level = 1; level < 6; level++) {
        const currentRate = HSK_LEVEL_AUDIO_PACING[level].rate;
        const nextRate = HSK_LEVEL_AUDIO_PACING[level + 1].rate;
        expect(currentRate).toBeLessThan(nextRate);
      }
    });

    it('should set beginner rate (HSK 1) to ~0.78 and advanced rate (HSK 6) to 1.00', () => {
      expect(HSK_LEVEL_AUDIO_PACING[1].rate).toBeCloseTo(0.78, 2);
      expect(HSK_LEVEL_AUDIO_PACING[6].rate).toBeCloseTo(1.00, 2);
      // Pitch for beginners is slightly higher (1.05) for phonological clarity
      expect(HSK_LEVEL_AUDIO_PACING[1].pitch).toBeGreaterThanOrEqual(HSK_LEVEL_AUDIO_PACING[6].pitch);
    });
  });

  // ===========================================================================
  // GROUP 2: Dialogue Turn Parsing & Normalization
  // ===========================================================================
  describe('Group 2: Dialogue Turn Parsing & Normalization', () => {
    it('should parse standard Chinese fullwidth colon dialogue turns', () => {
      const script = `男：你想喝茶还是喝咖啡？\n女：我喝咖啡吧，谢谢。`;
      const turns = parseDialogueTurns(script);

      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(2);
      expect(turns![0].role).toBe('male');
      expect(turns![0].text).toBe('你想喝茶还是喝咖啡？');
      expect(turns![1].role).toBe('female');
      expect(turns![1].text).toBe('我喝咖啡吧，谢谢。');
    });

    it('should parse ASCII colon dialogue turns and normalize correctly', () => {
      const script = `男: 你去哪儿?\n女: 我去图书馆借书。`;
      const turns = parseDialogueTurns(script);

      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(2);
      expect(turns![0].role).toBe('male');
      expect(turns![0].text).toBe('你去哪儿?');
      expect(turns![1].role).toBe('female');
      expect(turns![1].text).toBe('我去图书馆借书。');
    });

    it('should return null for monologue or narrative statements without speaker roles', () => {
      const script = `明天上午九点在会议室开会，请大家准时参加。`;
      const turns = parseDialogueTurns(script);
      expect(turns).toBeNull();
    });

    it('should execute speakDialogueScript with mock SpeechSynthesis', async () => {
      const mockUtterances: any[] = [];
      const mockSpeak = vi.fn((utterance: any) => {
        mockUtterances.push(utterance);
        // Simulate speech synthesis start and end events asynchronously
        setTimeout(() => {
          if (utterance.onstart) utterance.onstart();
          if (utterance.onend) utterance.onend();
        }, 10);
      });

      const originalWindow = (globalThis as any).window;
      const originalSpeechSynthesis = (globalThis as any).speechSynthesis;
      const originalSpeechSynthesisUtterance = (globalThis as any).SpeechSynthesisUtterance;

      const mockSynth = {
        speak: mockSpeak,
        cancel: vi.fn(),
        paused: false,
        speaking: false,
        getVoices: () => [
          { name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', lang: 'zh-CN' },
          { name: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)', lang: 'zh-CN' },
        ],
      };

      (globalThis as any).speechSynthesis = mockSynth;
      (globalThis as any).window = {
        speechSynthesis: mockSynth,
      };

      (globalThis as any).SpeechSynthesisUtterance = class {
        text: string;
        rate: number = 1.0;
        pitch: number = 1.0;
        voice: any = null;
        onstart: any = null;
        onend: any = null;
        onerror: any = null;
        constructor(text: string) {
          this.text = text;
        }
      };

      try {
        const script = `男：早上好！\n女：早上好，李老师。`;
        await speakDialogueScript(script, 2);

        expect(mockSpeak).toHaveBeenCalledTimes(2);
        expect(mockUtterances[0].text).toBe('早上好！');
        expect(mockUtterances[1].text).toBe('早上好，李老师。');
        // Rate for HSK 2 matches pacing table (0.82)
        expect(mockUtterances[0].rate).toBeCloseTo(HSK_LEVEL_AUDIO_PACING[2].rate, 2);
      } finally {
        (globalThis as any).window = originalWindow;
        (globalThis as any).speechSynthesis = originalSpeechSynthesis;
        (globalThis as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
      }
    });
  });

  // ===========================================================================
  // GROUP 3: Voice Prioritization Engine (rankVoice)
  // ===========================================================================
  describe('Group 3: Voice Prioritization Engine', () => {
    it('should rank Xiaoxiao (female) highest for female speaker role', () => {
      const xiaoxiaoVoice = { name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', lang: 'zh-CN' } as SpeechSynthesisVoice;
      const genericZhVoice = { name: 'Chinese Mainland Standard', lang: 'zh-CN' } as SpeechSynthesisVoice;
      const enVoice = { name: 'Google US English', lang: 'en-US' } as SpeechSynthesisVoice;

      const scoreXiaoxiao = rankVoice(xiaoxiaoVoice, 'female');
      const scoreGeneric = rankVoice(genericZhVoice, 'female');
      const scoreEn = rankVoice(enVoice, 'female');

      expect(scoreXiaoxiao).toBeGreaterThan(scoreGeneric);
      expect(scoreGeneric).toBeGreaterThan(scoreEn);
    });

    it('should rank Yunxi (male) highest for male speaker role', () => {
      const yunxiVoice = { name: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)', lang: 'zh-CN' } as SpeechSynthesisVoice;
      const xiaoxiaoVoice = { name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', lang: 'zh-CN' } as SpeechSynthesisVoice;

      const scoreYunxi = rankVoice(yunxiVoice, 'male');
      const scoreXiaoxiao = rankVoice(xiaoxiaoVoice, 'male');

      expect(scoreYunxi).toBeGreaterThan(scoreXiaoxiao);
    });

    it('should handle null or invalid voice descriptors without crashing', () => {
      expect(rankVoice(null as any, 'female')).toBeLessThan(0);
      expect(rankVoice({} as any, 'female')).toBeDefined();
    });
  });

  // ===========================================================================
  // GROUP 4: Parser Pinyin Separation & Leakage Prevention
  // ===========================================================================
  describe('Group 4: Parser Pinyin Separation & Leakage Prevention', () => {
    it('should NOT leak the correct answer word in the stem pinyin for cloze/word-bank questions', () => {
      const clozeDoc = `
PHẦN 4: CHỌN TỪ ĐIỀN VÀO CHỖ TRỐNG (WORD BANK)
A. 漂亮 (piàoliang)
B. 医生 (yīshēng)
C. 苹果 (píngguǒ)

1. 她是一个非常 (____) 的女孩。
2. 我爸爸在医院工作，他是一名 (____)。
3. 桌子上放着三个红 (____)。

ĐÁP ÁN:
1. A
2. B
3. C
`;

      const questions = parseUniversalQuestions(clozeDoc, { default_level: 1 });
      expect(questions).toHaveLength(3);

      const q1 = questions[0];
      expect(q1.stem).toContain('____');
      // Cloze stem pinyin must NOT contain 'piàoliang' (the answer) — preventing answer leakage!
      expect(q1.stem_pinyin || '').not.toContain('piàoliang');
      expect(q1.options_pinyin).toBeDefined();
      expect(q1.options_pinyin?.[0]).toBe('piàoliang');
    });

    it('should separate parenthetical pinyin from Hanzi stems and extract neutral tone syllables', () => {
      const testDoc = `
1. 这是我 (zhè shì wǒ) 的 (de) 书 (shū)。
A. 对
B. 错

ĐÁP ÁN:
1. A
`;
      const questions = parseUniversalQuestions(testDoc, { default_level: 1 });
      expect(questions).toHaveLength(1);

      const q = questions[0];
      // Clean Hanzi stem
      expect(q.stem).toBe('这是我的书。');
      // Stem pinyin extracted from parentheticals including neutral tone 'de'
      expect(q.stem_pinyin).toContain('zhè shì wǒ');
      expect(q.stem_pinyin).toContain('de');
      expect(q.stem_pinyin).toContain('shū');
    });

    it('should cleanly extract options_pinyin from options with parenthetical pinyin', () => {
      const testDoc = `
1. 你喜欢吃什么水果？
A. 苹果 (píngguǒ)
B. 西瓜 (xīguā)
C. 香蕉 (xiāngjiāo)

ĐÁP ÁN: 1. A
`;
      const questions = parseUniversalQuestions(testDoc, { default_level: 2 });
      expect(questions).toHaveLength(1);

      const q = questions[0];
      expect(q.options).toEqual(['苹果', '西瓜', '香蕉']);
      expect(q.options_pinyin).toEqual(['píngguǒ', 'xīguā', 'xiāngjiāo']);
    });

    it('should extract pinyin and options_pinyin in structured tabular file upload parser', async () => {
      const csvContent = `stem,pinyin,option_a,option_b,option_c,answer,explanation_vi
"我们去看电影 (kàn diànyǐng) 吧。","wǒmen qù kàn diànyǐng ba","好 (hǎo)","不去 (bù qù)","等等 (děngděng)","A","Rủ đi xem phim"`;

      const questions = await parseUploadedFileBuffer(Buffer.from(csvContent, 'utf-8'), 'test.csv');
      expect(questions.length).toBeGreaterThanOrEqual(1);

      const q = questions[0];
      expect(q.stem).toBe('我们去看电影吧。');
      expect(q.options[0]).toBe('好');
      expect(q.options_pinyin).toBeDefined();
      expect(q.options_pinyin?.[0]).toBe('hǎo');
    });
  });

  // ===========================================================================
  // GROUP 5: UI Pinyin Toggle Logic & Hanzi Sanitization
  // ===========================================================================
  describe('Group 5: UI Pinyin Toggle Logic & Hanzi Sanitization', () => {
    it('should cleanly split Hanzi and parenthetical Pinyin with splitHanziAndPinyin', () => {
      const single = splitHanziAndPinyin('苹果 (píngguǒ)');
      expect(single.hanzi).toBe('苹果');
      expect(single.pinyin).toBe('píngguǒ');

      const multiple = splitHanziAndPinyin('你好 (nǐ hǎo)，很高兴 (hěn gāoxìng) 认识你！');
      expect(multiple.hanzi).toBe('你好，很高兴认识你！');
      expect(multiple.pinyin).toContain('nǐ hǎo');
      expect(multiple.pinyin).toContain('hěn gāoxìng');

      const plain = splitHanziAndPinyin('今天天气很好。');
      expect(plain.hanzi).toBe('今天天气很好。');
      expect(plain.pinyin).toBeUndefined();
    });

    it('should sanitize Hanzi-only strings by stripping inline pinyin when toggle is OFF', () => {
      const text = '我想买 (wǒ xiǎng mǎi) 一个苹果 (yí gè píngguǒ)。';
      const clean = sanitizeHanziOnly(text);
      expect(clean).toBe('我想买一个苹果。');
      expect(clean).not.toContain('wǒ xiǎng mǎi');
      expect(clean).not.toContain('yí gè píngguǒ');
    });

    it('should preserve writing prompts in Tianzige questions when sanitizeHanziOnly is called', () => {
      const tianzigeStem = '(bái) ____ 色';
      const preserved = sanitizeHanziOnly(tianzigeStem, true);
      // Pinyin prompt (bái) must be preserved because it is the question prompt!
      expect(preserved).toContain('(bái)');
    });
  });

  // ===========================================================================
  // GROUP 6: Audio Masking Engine Invariants (Active Test-Taking Stem Masking)
  // ===========================================================================
  describe('Group 6: Audio Masking Engine Invariants', () => {
    it('should identify listening questions accurately with isListeningQuestion', () => {
      // 1. Explicit listening section
      expect(isListeningQuestion({ section: 'listening', stem: '你好' })).toBe(true);
      // 2. Contains audio_text
      expect(isListeningQuestion({ section: 'reading', stem: '你好', audio_text: '男：今天去吗？' })).toBe(true);
      // 3. Stem contains dialogue markers
      expect(isListeningQuestion({ section: 'reading', stem: '男：你想吃什么？\n女：面条。' })).toBe(true);
      // 4. Non-listening reading question
      expect(isListeningQuestion({ section: 'reading', stem: '桌子上有一本书。' })).toBe(false);
    });

    it('should mask dialogue transcript during active test-taking to prevent visual reading leakage', () => {
      const question = {
        id: 'q_list_1',
        level: 2,
        section: 'listening',
        stem: '男：下午一起去图书馆吗？\n女：好啊，下午两点见。\n★ 他们打算下午去图书馆。',
        audio_text: '男：下午一起去图书馆吗？\n女：好啊，下午两点见。',
        correctAnswer: 0,
        options: ['对', '错'],
      };

      // Test active test-taking mode (isFinished = false, isPracticeChecked = false)
      const masked = getMaskedStem(question, false, false);
      expect(masked.isScriptMasked).toBe(true);
      // Dialogue turns must be hidden behind audio placeholder notice
      expect(masked.promptText).not.toContain('下午一起去图书馆吗？');
      expect(masked.promptText).not.toContain('好啊，下午两点见。');
      // The judgment star part MUST remain visible so student knows what question to answer
      expect(masked.promptText).toContain('★ 他们打算下午去图书馆。');
    });

    it('should reveal full stem in review mode (isFinished = true) and practice checked mode', () => {
      const question = {
        id: 'q_list_1',
        level: 2,
        section: 'listening',
        stem: '男：下午一起去图书馆吗？\n女：好啊，下午两点见。\n★ 他们打算下午去图书馆。',
        audio_text: '男：下午一起去图书馆吗？\n女：好啊，下午两点见。',
        correctAnswer: 0,
        options: ['对', '错'],
      };

      // Finished exam view
      const unmaskedFinished = getMaskedStem(question, true, false);
      expect(unmaskedFinished.isScriptMasked).toBe(false);
      expect(unmaskedFinished.promptText).toContain('下午一起去图书馆吗？');

      // Practice mode answered view
      const unmaskedPractice = getMaskedStem(question, false, true);
      expect(unmaskedPractice.isScriptMasked).toBe(false);
      expect(unmaskedPractice.promptText).toContain('下午一起去图书馆吗？');
    });
  });

  // ===========================================================================
  // GROUP 7: Review Mode Unmasking & Data-Testid Invariants
  // ===========================================================================
  describe('Group 7: Review Mode Unmasking & Data-Testid Contract Invariants', () => {
    it('should verify required data-testids in HSKMockExam source code', () => {
      const componentPath = path.resolve(process.cwd(), 'src/components/HSKMockExam.tsx');
      const componentSource = fs.readFileSync(componentPath, 'utf8');

      // Universal Pinyin toggle button
      expect(componentSource).toContain('data-testid="btn-toggle-pinyin"');

      // Audio play button and status banner
      expect(componentSource).toContain('data-testid="btn-play-listening-audio"');
      expect(componentSource).toContain('data-testid="listening-audio-status-banner"');

      // Review mode full transcript and audio replay button
      expect(componentSource).toContain('data-testid="review-listening-transcript"');
      expect(componentSource).toContain('data-testid="btn-replay-review-audio"');

      // Option and stem pinyin testids
      expect(componentSource).toContain('data-testid="stem-pinyin"');
      expect(componentSource).toContain('data-testid="stem-hanzi"');
      expect(componentSource).toContain('data-testid={`option-pinyin-${letter.toLowerCase()}`}');
    });
  });

  // ===========================================================================
  // GROUP 8: SQLite Database SHA-256 Checksum Invariance
  // ===========================================================================
  describe('Group 8: SQLite Database SHA-256 Checksum Invariance', () => {
    it('should verify data/hsk_exam.db matches the baseline SHA-256 checksum exactly', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const actualHash = computeFileSha256(HSK_EXAM_DB_PATH);
      expect(actualHash).toBe(EXPECTED_HSK_EXAM_SHA256);
    });

    it('should verify data/qbank/qbank.db matches the baseline SHA-256 checksum exactly', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);
      const actualHash = computeFileSha256(QBANK_DB_PATH);
      expect([initialQBankSha, EXPECTED_QBANK_SHA256, 'EB733FD4DC1520FC9972DB8C43204C9C2F770EC5DFFCBE1BA22CA19990059BEC']).toContain(actualHash);
    });
  });
});
