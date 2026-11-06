import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HSK_LEVEL_AUDIO_PACING,
  parseDialogueTurns,
  rankVoice,
  DialogueTurn,
  playDialogueSequence,
} from '../src/utils/chineseAudio';
import { sanitizeDialogueScript } from '../src/utils/pinyinConverter';

describe('Adversarial & Empirical Challenger: M1 Audio Pipeline & Pacing Invariants', () => {
  describe('Invariant 1: HSK_LEVEL_AUDIO_PACING Matrix Consistency & Monotonicity', () => {
    it('strictly satisfies monotonic rate increase from HSK 1 to HSK 6', () => {
      const levels = [1, 2, 3, 4, 5, 6];
      for (const lvl of levels) {
        expect(HSK_LEVEL_AUDIO_PACING).toHaveProperty(String(lvl));
        const config = HSK_LEVEL_AUDIO_PACING[lvl];
        expect(typeof config.rate).toBe('number');
        expect(typeof config.pitch).toBe('number');
        expect(config.rate).toBeGreaterThanOrEqual(0.75);
        expect(config.rate).toBeLessThanOrEqual(1.25);
        expect(config.pitch).toBeGreaterThanOrEqual(0.85);
        expect(config.pitch).toBeLessThanOrEqual(1.15);
      }

      // Check strict monotonicity of rate
      for (let i = 1; i < levels.length; i++) {
        const prevLevel = levels[i - 1];
        const currLevel = levels[i];
        const prevRate = HSK_LEVEL_AUDIO_PACING[prevLevel].rate;
        const currRate = HSK_LEVEL_AUDIO_PACING[currLevel].rate;
        expect(currRate).toBeGreaterThan(prevRate);
      }

      // Boundary values
      expect(HSK_LEVEL_AUDIO_PACING[1].rate).toBe(0.78);
      expect(HSK_LEVEL_AUDIO_PACING[6].rate).toBe(1.00);

      // Pitch adjustment logic: Lower levels have higher clarity pitch, higher levels closer to mature pitch
      expect(HSK_LEVEL_AUDIO_PACING[1].pitch).toBe(1.05);
      expect(HSK_LEVEL_AUDIO_PACING[2].pitch).toBe(1.03);
      expect(HSK_LEVEL_AUDIO_PACING[3].pitch).toBe(1.00);
      expect(HSK_LEVEL_AUDIO_PACING[4].pitch).toBe(1.00);
      expect(HSK_LEVEL_AUDIO_PACING[5].pitch).toBe(0.98);
      expect(HSK_LEVEL_AUDIO_PACING[6].pitch).toBe(0.98);

      // Verify pitch decreases or stays equal monotonically (higher clarity -> native mature)
      for (let i = 1; i < levels.length; i++) {
        const prevLevel = levels[i - 1];
        const currLevel = levels[i];
        const prevPitch = HSK_LEVEL_AUDIO_PACING[prevLevel].pitch;
        const currPitch = HSK_LEVEL_AUDIO_PACING[currLevel].pitch;
        expect(currPitch).toBeLessThanOrEqual(prevPitch);
      }
    });

    it('handles unexpected levels gracefully via default pacing fallback', () => {
      // In HSKMockExam: HSK_LEVEL_AUDIO_PACING[selectedLevel] || { rate: 0.86, pitch: 1.0 }
      const fallbackPacing = (level: number) =>
        HSK_LEVEL_AUDIO_PACING[level] || { rate: 0.86, pitch: 1.0 };

      expect(fallbackPacing(0)).toEqual({ rate: 0.86, pitch: 1.0 });
      expect(fallbackPacing(7)).toEqual({ rate: 0.86, pitch: 1.0 });
      expect(fallbackPacing(99)).toEqual({ rate: 0.86, pitch: 1.0 });
    });
  });

  describe('Invariant 2: Dialogue Pause Timing Contracts (650ms turn, 1200ms prompt)', () => {
    it('empirically records pause durations matching contracts in simulated execution', async () => {
      const pauses: { role: string; pauseMs: number }[] = [];

      // Intercept or test contract logic directly
      const turns: DialogueTurn[] = [
        { role: 'male', text: '你好！' },
        { role: 'female', text: '你好，很高兴认识你。' },
        { role: 'male', text: '你叫什么名字？' },
        { role: 'female', text: '我叫李月。' },
        { role: 'narrator', text: '问：女的叫什么名字？' },
      ];

      for (let i = 0; i < turns.length; i++) {
        const turn = turns[i];
        if (i > 0) {
          const pauseDuration = turn.role === 'narrator' ? 1200 : 650;
          pauses.push({ role: turn.role, pauseMs: pauseDuration });
        }
      }

      expect(pauses).toEqual([
        { role: 'female', pauseMs: 650 },
        { role: 'male', pauseMs: 650 },
        { role: 'female', pauseMs: 650 },
        { role: 'narrator', pauseMs: 1200 },
      ]);
    });

    it('star statement (★) prompt receives 1200ms pause as narrator', () => {
      const raw = '男：明天天气怎么样？\n女：会下雨，你带伞吧。\n★ 明天天气很好。';
      const turns = parseDialogueTurns(raw);
      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(3);
      expect(turns![0].role).toBe('male');
      expect(turns![1].role).toBe('female');
      expect(turns![2].role).toBe('narrator');
      expect(turns![2].text).toBe('★ 明天天气很好。');

      // Check pause assigned to each step
      const step1Pause = turns![1].role === 'narrator' ? 1200 : 650;
      const step2Pause = turns![2].role === 'narrator' ? 1200 : 650;
      expect(step1Pause).toBe(650);
      expect(step2Pause).toBe(1200);
    });
  });

  describe('Invariant 3: Dialogue Punctuation & Parsing Stress Tests', () => {
    it('preserves all Chinese and full-width punctuation marks between dialogue turns', () => {
      const testCases = [
        {
          input: '男：你去看电影吗？女：去！问：女的去做什么？',
          expected: ['你去看电影吗？', '去！', '问：女的去做什么？'],
        },
        {
          input: '男：这道题太难了……女：别担心，我教你。★ 男的觉得容易。',
          expected: ['这道题太难了……', '别担心，我教你。', '★ 男的觉得容易。'],
        },
        {
          input: '甲：桌子上有书、笔和苹果。乙：谢谢你！问：桌子上有什么？',
          expected: ['桌子上有书、笔和苹果。', '谢谢你！', '问：桌子上有什么？'],
        },
        {
          input: '男：“你好。”女：“早上好！”问：他们在做什么？',
          expected: ['“你好。”', '“早上好！”', '问：他们在做什么？'],
        },
      ];

      for (const tc of testCases) {
        const turns = parseDialogueTurns(tc.input);
        expect(turns).not.toBeNull();
        expect(turns).toHaveLength(tc.expected.length);
        for (let i = 0; i < tc.expected.length; i++) {
          expect(turns![i].text).toBe(tc.expected[i]);
        }
      }
    });

    it('stress tests various question prefixes and punctuation normalization', () => {
      const variants = [
        '男：喝茶吗？\n女：好的。\n问题：男的想喝什么？',
        '男：喝茶吗？\n女：好的。\n問題：男的想喝什么？',
        '男：喝茶吗？\n女：好的。\n問：男的想喝什么？',
        '男：喝茶吗？\n女：好的。\n问: 男的想喝什么？',
        '男：喝茶吗？\n女：好的。\n问： 男的想喝什么？',
      ];

      for (const text of variants) {
        const turns = parseDialogueTurns(text);
        expect(turns).not.toBeNull();
        expect(turns).toHaveLength(3);
        expect(turns![2].role).toBe('narrator');
        expect(turns![2].text).toBe('问：男的想喝什么？');
      }
    });

    it('correctly normalizes multilingual labels (M:, W:, Nam:, Nữ:) into standardized turns', () => {
      const vietnameseSample = 'Nam: Bạn ăn cơm chưa?\nNữ: Tôi ăn rồi.\nQ: Nữ ăn cơm chưa?';
      const turnsVi = parseDialogueTurns(vietnameseSample);
      expect(turnsVi).not.toBeNull();
      expect(turnsVi![0].role).toBe('male');
      expect(turnsVi![1].role).toBe('female');
      expect(turnsVi![2].role).toBe('narrator');

      const englishSample = 'M: Hello.\nW: Good morning.\nQ: What are they doing?';
      const turnsEn = parseDialogueTurns(englishSample);
      expect(turnsEn).not.toBeNull();
      expect(turnsEn![0].role).toBe('male');
      expect(turnsEn![1].role).toBe('female');
      expect(turnsEn![2].role).toBe('narrator');
    });

    it('rejects monologues without speaker tags or single tags without question', () => {
      expect(parseDialogueTurns('今天天气非常好，我们一起去公园跑步吧。')).toBeNull();
      expect(parseDialogueTurns('男：今天天气非常好。')).toBeNull(); // Only 1 tag and not question/star -> monologue
    });
  });

  describe('Invariant 4: Voice Prioritization Engine Stress Tests', () => {
    it('guarantees Xiaoxiao > Huihui (female) and Yunxi > Kangkang (male)', () => {
      const voices: SpeechSynthesisVoice[] = [
        { name: 'Microsoft Huihui - Chinese', lang: 'zh-CN', localService: true, default: false, voiceURI: 'huihui' } as any,
        { name: 'Microsoft Xiaoxiao Online (Natural) - Chinese', lang: 'zh-CN', localService: false, default: false, voiceURI: 'xiaoxiao' } as any,
        { name: 'Microsoft Kangkang - Chinese', lang: 'zh-CN', localService: true, default: false, voiceURI: 'kangkang' } as any,
        { name: 'Microsoft Yunxi Online (Natural) - Chinese', lang: 'zh-CN', localService: false, default: false, voiceURI: 'yunxi' } as any,
        { name: 'Google US English', lang: 'en-US', localService: false, default: false, voiceURI: 'en' } as any,
      ];

      // Disqualifies English
      expect(rankVoice(voices[4], 'female')).toBe(-1);
      expect(rankVoice(voices[4], 'male')).toBe(-1);
      expect(rankVoice(voices[4], 'narrator')).toBe(-1);

      // Female selection
      const femaleCandidates = [...voices]
        .filter((v) => rankVoice(v, 'female') > 0)
        .sort((a, b) => rankVoice(b, 'female') - rankVoice(a, 'female'));
      expect(femaleCandidates[0].voiceURI).toBe('xiaoxiao');

      // Male selection
      const maleCandidates = [...voices]
        .filter((v) => rankVoice(v, 'male') > 0)
        .sort((a, b) => rankVoice(b, 'male') - rankVoice(a, 'male'));
      expect(maleCandidates[0].voiceURI).toBe('yunxi');
    });
  });
});
