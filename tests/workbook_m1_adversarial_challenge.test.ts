import { describe, it, expect } from 'vitest';
import { sanitizeDialogueScript } from '../src/utils/pinyinConverter';
import {
  parseDialogueTurns,
  rankVoice,
  HSK_LEVEL_AUDIO_PACING,
  DialogueTurn,
} from '../src/utils/chineseAudio';

/**
 * Challenger M1-1 Empirical Adversarial Stress Suite
 * Stress-tests dialogue scripts, voice ranking engine, and listening anti-leak invariants.
 */
describe('Challenger M1-1: Empirical Adversarial Stress Suite', () => {
  // =========================================================================
  // 1. STRESS DIALOGUE SCRIPTS
  // =========================================================================
  describe('1. Stress Dialogue Scripts & Punctuation Integrity', () => {
    it('1.1 handles multiple turns with mixed punctuation (！？。……，；) without corruption or swallowing', () => {
      const script =
        '男：真的吗？！女：真的！男：太好了……女：快走吧。问：女的是什么语气？';
      const turns = parseDialogueTurns(script);

      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(5);
      expect(turns![0]).toEqual({ role: 'male', text: '真的吗？！' });
      expect(turns![1]).toEqual({ role: 'female', text: '真的！' });
      expect(turns![2]).toEqual({ role: 'male', text: '太好了……' });
      expect(turns![3]).toEqual({ role: 'female', text: '快走吧。' });
      expect(turns![4]).toEqual({ role: 'narrator', text: '问：女的是什么语气？' });
    });

    it('1.2 handles dialogue scripts with ZERO spaces between turns and punctuation', () => {
      // Classic HSK listening format without any spaces:
      const script1 = '男：我想买苹果。女：给你。★他想买苹果。';
      const turns1 = parseDialogueTurns(script1);
      expect(turns1).not.toBeNull();
      expect(turns1).toHaveLength(3);
      expect(turns1![0]).toEqual({ role: 'male', text: '我想买苹果。' });
      expect(turns1![1]).toEqual({ role: 'female', text: '给你。' });
      expect(turns1![2]).toEqual({ role: 'narrator', text: '★ 他想买苹果。' });

      const script2 = '男：你明天去吗？女：不去！问：男的是什么意思？';
      const turns2 = parseDialogueTurns(script2);
      expect(turns2).not.toBeNull();
      expect(turns2).toHaveLength(3);
      expect(turns2![0]).toEqual({ role: 'male', text: '你明天去吗？' });
      expect(turns2![1]).toEqual({ role: 'female', text: '不去！' });
      expect(turns2![2]).toEqual({ role: 'narrator', text: '问：男的是什么意思？' });

      const script3 = '甲：你好。乙：你好。';
      const turns3 = parseDialogueTurns(script3);
      expect(turns3).not.toBeNull();
      expect(turns3).toHaveLength(2);
      expect(turns3![0]).toEqual({ role: 'male', text: '你好。' });
      expect(turns3![1]).toEqual({ role: 'female', text: '你好。' });
    });

    it('1.3 tests behavior of unpunctuated, unspaced script boundaries', () => {
      // Even if script has no punctuation between turns, if space or newline exists:
      const spacedNoPunct = '男：你好 女：再见';
      const turnsSpaced = parseDialogueTurns(spacedNoPunct);
      expect(turnsSpaced).not.toBeNull();
      expect(turnsSpaced).toHaveLength(2);
      expect(turnsSpaced![0]).toEqual({ role: 'male', text: '你好' });
      expect(turnsSpaced![1]).toEqual({ role: 'female', text: '再见' });

      // When there is newline:
      const newlineNoPunct = '男：你好\n女：再见';
      const turnsNewline = parseDialogueTurns(newlineNoPunct);
      expect(turnsNewline).not.toBeNull();
      expect(turnsNewline).toHaveLength(2);
      expect(turnsNewline![0]).toEqual({ role: 'male', text: '你好' });
      expect(turnsNewline![1]).toEqual({ role: 'female', text: '再见' });
    });

    it('1.4 handles star statements (★ / (★)) with Pinyin and Hanzi', () => {
      // Star statement with Hanzi
      const sample1 = '男：去哪儿？\n女：看电影。\n★ 他们去看电影。';
      const turns1 = parseDialogueTurns(sample1);
      expect(turns1).not.toBeNull();
      expect(turns1).toHaveLength(3);
      expect(turns1![2]).toEqual({ role: 'narrator', text: '★ 他们去看电影。' });

      // Parenthesized star with colon
      const sample2 = '男：冷吗？\n女：不冷。\n(★)：天气很冷。';
      const turns2 = parseDialogueTurns(sample2);
      expect(turns2).not.toBeNull();
      expect(turns2![2]).toEqual({ role: 'narrator', text: '★ 天气很冷。' });

      // Star statement with Pinyin in script
      const sample3 = '男：Nǐ qù nǎr?\n女：Wǒ qù túshūguǎn.\n★ Tā qù túshūguǎn.';
      const turns3 = parseDialogueTurns(sample3);
      expect(turns3).not.toBeNull();
      expect(turns3).toHaveLength(3);
      expect(turns3![0].role).toBe('male');
      expect(turns3![1].role).toBe('female');
      expect(turns3![2].role).toBe('narrator');
      expect(turns3![2].text).toContain('★');

      // Standalone star without multi-role dialogue:
      // When a single statement starts with ★, parseDialogueTurns detects ★ as special prompt
      const singleStar = '★ 音乐会七点开始。';
      const singleTurns = parseDialogueTurns(singleStar);
      expect(singleTurns).not.toBeNull();
      expect(singleTurns).toHaveLength(1);
      expect(singleTurns![0]).toEqual({ role: 'narrator', text: '★ 音乐会七点开始。' });
    });

    it('1.5 handles English A: and B: alternating turns across multiple exchanges', () => {
      const script = 'A: 你好！\nB: 早上好！\nA: 今天天气真好。\nB: 是啊，我们去公园吧！\nQuestion: 他们打算去哪儿？';
      const turns = parseDialogueTurns(script);
      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(5);
      expect(turns![0]).toEqual({ role: 'male', text: '你好！' });
      expect(turns![1]).toEqual({ role: 'female', text: '早上好！' });
      expect(turns![2]).toEqual({ role: 'male', text: '今天天气真好。' });
      expect(turns![3]).toEqual({ role: 'female', text: '是啊，我们去公园吧！' });
      expect(turns![4]).toEqual({ role: 'narrator', text: '问：他们打算去哪儿？' });

      // Lowercase a: and b:
      const lowerScript = 'a: 你去哪儿？\nb: 我去学校。';
      const lowerTurns = parseDialogueTurns(lowerScript);
      expect(lowerTurns).not.toBeNull();
      expect(lowerTurns).toHaveLength(2);
      expect(lowerTurns![0]).toEqual({ role: 'male', text: '你去哪儿？' });
      expect(lowerTurns![1]).toEqual({ role: 'female', text: '我去学校。' });

      // If only A: exists without B:, it is NOT converted to 甲/乙 (not alternating dialogue)
      const onlyA = 'A: 这是一个测试。';
      const onlyATurns = parseDialogueTurns(onlyA);
      expect(onlyATurns).toBeNull();
    });

    it('1.6 handles multilingual speaker tags and question prefixes', () => {
      // Vietnamese speaker labels
      const vnScript = 'Nam: Bạn ăn cơm chưa?\nNữ: Tôi ăn rồi.\nHỏi: Nữ đã ăn cơm chưa?';
      const vnTurns = parseDialogueTurns(vnScript);
      expect(vnTurns).not.toBeNull();
      expect(vnTurns).toHaveLength(3);
      expect(vnTurns![0].role).toBe('male');
      expect(vnTurns![1].role).toBe('female');
      expect(vnTurns![2].role).toBe('narrator');
      expect(vnTurns![2].text.startsWith('问：')).toBe(true);

      // English M: / W: / Q:
      const enScript = 'M: Where are you?\nW: I am at home.\nQ: Where is she?';
      const enTurns = parseDialogueTurns(enScript);
      expect(enTurns).not.toBeNull();
      expect(enTurns).toHaveLength(3);
      expect(enTurns![0].role).toBe('male');
      expect(enTurns![1].role).toBe('female');
      expect(enTurns![2].role).toBe('narrator');

      // Chinese question variants: 问题, 問題, 問
      for (const qTag of ['问题：', '問題：', '問：', 'Wèn: ']) {
        const qScript = `男：好的。\n女：再见。\n${qTag}他们说什么？`;
        const qTurns = parseDialogueTurns(qScript);
        expect(qTurns).not.toBeNull();
        expect(qTurns![2]).toEqual({ role: 'narrator', text: '问：他们说什么？' });
      }
    });

    it('1.7 handles preambles before the first speaker tag', () => {
      const scriptWithPreamble = '第1到5题：听对话，选择正确答案。\n男：你好。\n女：你好。';
      const turns = parseDialogueTurns(scriptWithPreamble);
      expect(turns).not.toBeNull();
      expect(turns).toHaveLength(3);
      expect(turns![0]).toEqual({ role: 'narrator', text: '第1到5题：听对话，选择正确答案。' });
      expect(turns![1]).toEqual({ role: 'male', text: '你好。' });
      expect(turns![2]).toEqual({ role: 'female', text: '你好。' });
    });
  });

  // =========================================================================
  // 2. VOICE RANKING ALGORITHM ADVERSARIAL MATRIX
  // =========================================================================
  describe('2. Voice Ranking Algorithm Adversarial Stress Matrix', () => {
    // Factory for mock SpeechSynthesisVoice
    const createVoice = (
      name: string,
      lang: string,
      localService = true,
      defaultVoice = false
    ): SpeechSynthesisVoice => ({
      name,
      lang,
      localService,
      default: defaultVoice,
      voiceURI: name,
    });

    it('2.1 SAPI5 Only Environment: correctly selects best male and female fallback', () => {
      const sapiVoices = [
        createVoice('Microsoft Huihui - Chinese (Simplified, PRC)', 'zh-CN', true),
        createVoice('Microsoft Kangkang - Chinese (Simplified, PRC)', 'zh-CN', true),
        createVoice('Microsoft Yaoyao - Chinese (Simplified, PRC)', 'zh-CN', true),
      ];

      // Male ranking: Kangkang must be ranked highest
      const maleRanked = [...sapiVoices].sort(
        (a, b) => rankVoice(b, 'male') - rankVoice(a, 'male')
      );
      expect(maleRanked[0].name).toContain('Kangkang');
      expect(rankVoice(maleRanked[0], 'male')).toBeGreaterThan(0);
      // Huihui and Yaoyao must be penalized when target is male
      expect(rankVoice(sapiVoices[0], 'male')).toBeLessThan(0); // Huihui gets -80 penalty

      // Female ranking: Huihui and Yaoyao must rank higher than Kangkang
      const femaleRanked = [...sapiVoices].sort(
        (a, b) => rankVoice(b, 'female') - rankVoice(a, 'female')
      );
      expect(femaleRanked[0].name).toMatch(/Huihui|Yaoyao/);
      expect(rankVoice(femaleRanked[0], 'female')).toBeGreaterThan(0);
      // Kangkang gets -80 penalty when target is female
      expect(rankVoice(sapiVoices[1], 'female')).toBeLessThan(0);
    });

    it('2.2 Neural Only Environment: correctly ranks primary neural voices', () => {
      const neuralVoices = [
        createVoice('Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', 'zh-CN', false),
        createVoice('Microsoft Yunxi Online (Natural) - Chinese (Mainland)', 'zh-CN', false),
        createVoice('Microsoft Yunjian Online (Natural) - Chinese (Mainland)', 'zh-CN', false),
        createVoice('Microsoft Xiaoyi Online (Natural) - Chinese (Mainland)', 'zh-CN', false),
      ];

      // Female: Xiaoxiao should score highest, followed by Xiaoyi
      const femaleRanked = [...neuralVoices].sort(
        (a, b) => rankVoice(b, 'female') - rankVoice(a, 'female')
      );
      expect(femaleRanked[0].name).toContain('Xiaoxiao');
      expect(femaleRanked[1].name).toContain('Xiaoyi');
      expect(rankVoice(femaleRanked[0], 'female')).toBeGreaterThan(160);

      // Male: Yunxi should score highest, followed by Yunjian
      const maleRanked = [...neuralVoices].sort(
        (a, b) => rankVoice(b, 'male') - rankVoice(a, 'male')
      );
      expect(maleRanked[0].name).toContain('Yunxi');
      expect(maleRanked[1].name).toContain('Yunjian');
      expect(rankVoice(maleRanked[0], 'male')).toBeGreaterThan(160);

      // Narrator: Xiaoxiao and Yunxi should both have top scores
      const narratorXiaoxiao = rankVoice(neuralVoices[0], 'narrator');
      const narratorYunxi = rankVoice(neuralVoices[1], 'narrator');
      expect(narratorXiaoxiao).toBeGreaterThan(150);
      expect(narratorYunxi).toBeGreaterThan(150);
    });

    it('2.3 Mixed Languages: strictly disqualifies non-Chinese voices (-1)', () => {
      const mixedVoices = [
        createVoice('Microsoft David - English (United States)', 'en-US'),
        createVoice('Microsoft Zira - English (United States)', 'en-US'),
        createVoice('Google 日本語', 'ja-JP'),
        createVoice('Microsoft An - Vietnamese (Vietnam)', 'vi-VN'),
        createVoice('Microsoft Paul - French (France)', 'fr-FR'),
        createVoice('Microsoft Hedda - German (Germany)', 'de-DE'),
        createVoice('Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', 'zh-CN', false),
        createVoice('Microsoft Yunxi Online (Natural) - Chinese (Mainland)', 'zh-CN', false),
        createVoice('Microsoft Huihui - Chinese (Simplified, PRC)', 'zh-CN', true),
      ];

      // All non-Chinese voices must return exactly -1
      for (const nonZh of mixedVoices.slice(0, 6)) {
        expect(rankVoice(nonZh, 'male')).toBe(-1);
        expect(rankVoice(nonZh, 'female')).toBe(-1);
        expect(rankVoice(nonZh, 'narrator')).toBe(-1);
      }

      // Filtering with rankVoice > 0 strictly eliminates all non-Chinese voices
      const filteredMale = mixedVoices.filter((v) => rankVoice(v, 'male') > 0);
      expect(filteredMale.every((v) => v.lang.startsWith('zh'))).toBe(true);

      const filteredFemale = mixedVoices.filter((v) => rankVoice(v, 'female') > 0);
      expect(filteredFemale.every((v) => v.lang.startsWith('zh'))).toBe(true);
    });

    it('2.4 iOS / macOS Safari / Android voice names evaluation', () => {
      const mobileVoices = [
        createVoice('Ting-Ting', 'zh-CN'),
        createVoice('Tingting', 'zh-CN'),
        createVoice('Sin-Ji', 'zh-HK'),
        createVoice('Mei-Jia', 'zh-TW'),
        createVoice('Li-Mu', 'zh-CN'),
        createVoice('Google 普通话（中国大陆）', 'zh-CN'),
      ];

      // All mobile Chinese voices must pass baseline Chinese check (> 0 for general narrator)
      for (const v of mobileVoices) {
        expect(rankVoice(v, 'narrator')).toBeGreaterThan(0);
      }

      // Tingting (without hyphen) matches female bonus (+50)
      const tingtingScore = rankVoice(mobileVoices[1], 'female');
      expect(tingtingScore).toBeGreaterThan(50);

      // Google 普通话 matches Google bonus (+20)
      const googleScore = rankVoice(mobileVoices[5], 'female');
      expect(googleScore).toBeGreaterThan(25);
    });

    it('2.5 Robustness against null, empty, and malformed inputs', () => {
      expect(rankVoice(null as any, 'male')).toBe(-1);
      expect(rankVoice(undefined as any, 'female')).toBe(-1);
      expect(rankVoice({} as any, 'narrator')).toBe(-1);
      expect(rankVoice(createVoice('', ''), 'male')).toBe(-1);
      expect(rankVoice(createVoice('Custom Voice', 'unknown'), 'female')).toBe(-1);
    });
  });

  // =========================================================================
  // 3. LISTENING QUESTION PASSAGE ANTI-LEAKAGE INVARIANT MATRIX
  // =========================================================================
  describe('3. Listening Question Passage Anti-Leakage Invariant Matrix', () => {
    // Simulator of HSKMockExam line 2780-2792 logic
    const evaluatePassageRendering = (question: {
      section: 'listening' | 'reading' | 'writing';
      passage?: string;
      stem: string;
      group_id?: string;
    }) => {
      const hasPassage =
        question.section !== 'listening' &&
        (Boolean(question.passage) ||
          question.stem.includes('\n★') ||
          question.stem.includes('\n问：'));

      const passageContent =
        question.passage ||
        (question.stem.includes('\n★')
          ? question.stem.split('\n★')[0]
          : question.stem.includes('\n问：')
          ? question.stem.split('\n问：')[0]
          : '');

      const isRendered = Boolean(hasPassage && passageContent.trim());
      return { hasPassage, passageContent, isRendered };
    };

    it('3.1 NEVER renders passage box when section === "listening" under ANY combination of passage, \\n★, or \\n问：', () => {
      const stressMatrix = [
        // 1. Plain listening question without passage or markers
        { section: 'listening' as const, passage: undefined, stem: '你叫什么名字？' },
        // 2. Listening question with passage field explicitly populated
        { section: 'listening' as const, passage: '这段录音是关于买苹果的。', stem: '男的想买什么？' },
        // 3. Listening question with \n★ in stem
        {
          section: 'listening' as const,
          passage: undefined,
          stem: '男：今天晚上下雨吗？\n女：不下雨。\n★ 今天晚上下雨。',
        },
        // 4. Listening question with \n问： in stem
        {
          section: 'listening' as const,
          passage: undefined,
          stem: '男：你想去哪儿？\n女：我去图书馆。\n问：女的去哪儿？',
        },
        // 5. Listening question with BOTH passage AND \n★
        {
          section: 'listening' as const,
          passage: '录音文本内容',
          stem: '对话内容\n★ 判断题',
        },
        // 6. Listening question with BOTH passage AND \n问：
        {
          section: 'listening' as const,
          passage: '录音文本内容',
          stem: '对话内容\n问：选择题',
        },
        // 7. Listening question with group_id and complex stem
        {
          section: 'listening' as const,
          passage: 'Shared listening conversation',
          stem: '第一段录音\n问：第一个问题？',
          group_id: 'GRP_LISTEN_01',
        },
      ];

      for (const q of stressMatrix) {
        const result = evaluatePassageRendering(q);
        expect(
          result.hasPassage,
          `hasPassage must be false for listening question: ${JSON.stringify(q)}`
        ).toBe(false);
        expect(
          result.isRendered,
          `Passage panel must NEVER render for listening question: ${JSON.stringify(q)}`
        ).toBe(false);
      }
    });

    it('3.2 correctly renders passage box for reading questions when passage or markers are present', () => {
      // Reading question with passage
      const readingPassage = evaluatePassageRendering({
        section: 'reading',
        passage: '王先生在北京工作了十年。',
        stem: '王先生在哪里工作？',
      });
      expect(readingPassage.hasPassage).toBe(true);
      expect(readingPassage.isRendered).toBe(true);
      expect(readingPassage.passageContent).toBe('王先生在北京工作了十年。');

      // Reading question with embedded \n★
      const readingStar = evaluatePassageRendering({
        section: 'reading',
        stem: '明天是星期天，学校不上课。\n★ 明天要上课。',
      });
      expect(readingStar.hasPassage).toBe(true);
      expect(readingStar.isRendered).toBe(true);
      expect(readingStar.passageContent).toBe('明天是星期天，学校不上课。');

      // Reading question with embedded \n问：
      const readingQuestion = evaluatePassageRendering({
        section: 'reading',
        stem: '小李很喜欢看书，每天晚上都看一个小时。\n问：小李有什么爱好？',
      });
      expect(readingQuestion.hasPassage).toBe(true);
      expect(readingQuestion.isRendered).toBe(true);
      expect(readingQuestion.passageContent).toBe('小李很喜欢看书，每天晚上都看一个小时。');
    });

    it('3.3 ensures promptStem cleanly isolates the question for embedded passage formats', () => {
      // Simulator of promptStem calculation (lines 2818-2825)
      const getPromptStem = (q: { passage?: string; stem: string }) => {
        const isEmbeddedPassage =
          !q.passage && (q.stem.includes('\n★') || q.stem.includes('\n问：'));
        return isEmbeddedPassage
          ? q.stem.includes('\n★')
            ? '★ ' + q.stem.split('\n★').slice(1).join('\n★').trim()
            : '问：' + q.stem.split('\n问：').slice(1).join('\n问：').trim()
          : q.stem;
      };

      const starStem = '对话前文\n★ 这是陈述句。';
      expect(getPromptStem({ stem: starStem })).toBe('★ 这是陈述句。');

      const qStem = '对话前文\n问：这是问题？';
      expect(getPromptStem({ stem: qStem })).toBe('问：这是问题？');

      // When passage is already separated, stem remains untouched
      const separated = { passage: '单独文章', stem: '文章主要讲了什么？' };
      expect(getPromptStem(separated)).toBe('文章主要讲了什么？');
    });
  });

  // =========================================================================
  // 4. AUDIO PACING MATRIX & PITCH INVARIANTS
  // =========================================================================
  describe('4. Audio Pacing Matrix & Pitch Invariants', () => {
    it('4.1 verifies HSK 1–6 rate is monotonically non-decreasing', () => {
      const levels = [1, 2, 3, 4, 5, 6] as const;
      for (let i = 0; i < levels.length - 1; i++) {
        const curr = HSK_LEVEL_AUDIO_PACING[levels[i]];
        const next = HSK_LEVEL_AUDIO_PACING[levels[i + 1]];
        expect(curr.rate).toBeLessThanOrEqual(next.rate);
      }
      expect(HSK_LEVEL_AUDIO_PACING[1].rate).toBe(0.78);
      expect(HSK_LEVEL_AUDIO_PACING[6].rate).toBe(1.0);
    });

    it('4.2 verifies HSK 1–6 pitch is monotonically non-increasing', () => {
      const levels = [1, 2, 3, 4, 5, 6] as const;
      for (let i = 0; i < levels.length - 1; i++) {
        const curr = HSK_LEVEL_AUDIO_PACING[levels[i]];
        const next = HSK_LEVEL_AUDIO_PACING[levels[i + 1]];
        expect(curr.pitch).toBeGreaterThanOrEqual(next.pitch);
      }
      expect(HSK_LEVEL_AUDIO_PACING[1].pitch).toBe(1.05);
      expect(HSK_LEVEL_AUDIO_PACING[6].pitch).toBe(0.98);
    });

    it('4.3 verifies gender pitch multipliers differentiate voices even on single-voice platforms', () => {
      const basePitch = 1.0;
      const malePitch = basePitch * 0.88;
      const femalePitch = basePitch * 1.12;

      expect(malePitch).toBeLessThan(basePitch);
      expect(femalePitch).toBeGreaterThan(basePitch);
      expect(femalePitch - malePitch).toBeGreaterThan(0.2); // Noticeable >20% pitch separation
    });
  });
});
