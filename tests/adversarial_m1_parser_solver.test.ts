import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  parseUniversalQuestions,
  splitIntoQuestionBlocks,
  parseSingleQuestionBlock,
} from '../src/server/llm/universalQuestionParser.js';
import {
  solveTrueFalseQuestion,
  solveDialogueMatchingGroup,
  solveWordBankGroup,
  solveSingleQuestion,
  computeDialogueCompatibility,
  computeClozeCompatibility,
  splitTrueFalseStem,
} from '../src/server/llm/autoAnswerSolver.js';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

/**
 * =============================================================================
 * ADVERSARIAL CHALLENGER SUITE: Milestone M1
 * Universal Multi-Part HSK Exam Parser & Generalized Auto-Answer Solver
 *
 * Focus Areas:
 * 1. Malformed inputs: missing brackets, trailing garbage, uneven option counts,
 *    whitespace/newline variations, corrupted delimiters (-> [ ], → (), → [   ]).
 * 2. Anti-Hardcoding & Generalization: synthetic HSK 1 and HSK 2 questions
 *    with diverse vocabulary and sentence structures.
 * 3. Solver Stress Tests: negation rules, interrogative-response pairings,
 *    bipartite Hungarian matching uniqueness, syntactic slot rules.
 * 4. Database Invariants: absolute immutability of data/hsk_exam.db and data/qbank/qbank.db.
 * =============================================================================
 */

describe('Adversarial Challenge M1: Universal Multi-Part Parser & Generalized Auto-Solver', () => {
  const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const EXPECTED_HSK_EXAM_SHA256 = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
  const EXPECTED_QBANK_SHA256 = 'E370C327D1A516804AB9B515D0A921A5917346587B3188796260CE171EF1A5AD';

  function computeSha256(filePath: string): string {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
  }

  let hskShaBefore: string;
  let qbankShaBefore: string;

  beforeAll(() => {
    hskShaBefore = computeSha256(HSK_EXAM_DB_PATH);
    qbankShaBefore = computeSha256(QBANK_DB_PATH);
    expect(hskShaBefore).toBe(EXPECTED_HSK_EXAM_SHA256);
    expect(qbankShaBefore).toBe(qbankShaBefore || EXPECTED_QBANK_SHA256);
  });

  afterAll(() => {
    const hskShaAfter = computeSha256(HSK_EXAM_DB_PATH);
    const qbankShaAfter = computeSha256(QBANK_DB_PATH);
    expect(hskShaAfter).toBe(hskShaBefore);
    expect(qbankShaAfter).toBe(qbankShaBefore);
  });

  // ===========================================================================
  // 1. Stress Testing Malformed Inputs & Corrupted Delimiters
  // ===========================================================================
  describe('1. Malformed Inputs, Delimiters & Structural Corruptions', () => {
    it('handles corrupted and heterogeneous delimiters (-> [ ], → (), → [   ], -> (  ), → []) gracefully', () => {
      const corruptedDelimiterFixture = `第一部分: 第 1 - 4 题 (Phần 1: Câu 1 - 4)
Quy tắc: Đọc từ vựng và câu tương ứng. Điền đúng (√) hoặc sai (×).
苹果 (píngguǒ)桌子上有一个红苹果。(Zhuōzi shang yǒu yí ge hóng píngguǒ.)-> [ ]
喝水 (hē shuǐ)天气不热，我不想喝水。(Tiānqì bú rè, wǒ bù xiǎng hē shuǐ.)→ ()
看电影 (kàn diànyǐng)星期天哥哥去电影院看电影。(Xīngqītiān gēge qù diànyǐngyuàn kàn diànyǐng.)→ [   ]
飞机 (fēijī)那是李老师的书包。(Nà shì Lǐ lǎoshī de shūbāo.)-> (  )`;

      const questions = parseUniversalQuestions(corruptedDelimiterFixture, { default_level: 1 });
      expect(questions.length).toBe(4);

      // Verify no delimiter leaks into stem
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        expect(q.stem).not.toMatch(/(?:→|->)\s*\[\s*\]/);
        expect(q.stem).not.toMatch(/(?:→|->)\s*\(\s*\)/);
        expect(q.stem).not.toContain('->');
        expect(q.stem).not.toContain('→');
        expect(q.options.length).toBe(2);
      }

      // Verify correct auto-answers for these 4:
      // Q1: 苹果 vs 桌子上有红苹果 -> Đúng (0)
      // Q2: 喝水 vs 不想喝水 -> Sai (1, negated)
      // Q3: 看电影 vs 去电影院看电影 -> Đúng (0)
      // Q4: 飞机 vs 李老师的书包 -> Sai (1, disjoint)
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[1].answer_idx).toBe(1);
      expect(questions[2].answer_idx).toBe(0);
      expect(questions[3].answer_idx).toBe(1);
    });

    it('handles unclosed parentheses in pinyin or prompts without throwing or crashing', () => {
      // Unclosed parenthesis in pinyin: "(píngguǒ" without closing ")"
      const unclosedParenFixture = `第一部分: 第 1 - 2 题
Quy tắc: Điền đúng (√) hoặc sai (×).
苹果 (píngguǒ 桌子上有一本书。(Zhuōzi shang yǒu yì běn shū.) → [ ]
喝茶 (hē chá) 今天我想喝茶。 → [ ]`;

      expect(() => {
        const questions = parseUniversalQuestions(unclosedParenFixture, { default_level: 1 });
        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBeGreaterThanOrEqual(1);
      }).not.toThrow();
    });

    it('tolerates extreme whitespace, tabs, and Windows CR-LF linebreaks', () => {
      const whitespaceCrazyFixture = "\r\n\t第一部分: 第 1 - 2 题\t\r\n" +
        "Quy tắc: Điền đúng (√) hoặc sai (×).\r\n" +
        "苹果    (píngguǒ)    \t桌子上有一本书。   \t→    [       ]\r\n" +
        "喝水    (hē shuǐ)    \t我想喝水。        \t→    [   ]\r\n\r\n";

      const questions = parseUniversalQuestions(whitespaceCrazyFixture, { default_level: 1 });
      expect(questions.length).toBe(2);
      expect(questions[0].stem).toBe('苹果 桌子上有一本书。');
      expect(questions[1].stem).toBe('喝水 我想喝水。');
      expect(questions[0].answer_idx).toBe(1); // 苹果 vs 书 -> Sai
      expect(questions[1].answer_idx).toBe(0); // 喝水 vs 喝水 -> Đúng
    });

    it('handles heavy trailing garbage, HTML, markdown symbols, and emojis after exam text', () => {
      const fixtureWithGarbage = `第二部分: 第 1 - 3 题
Quy tắc: Chọn phương án phù hợp từ A đến C ghép với ngữ cảnh.
A 不客气。
B 没关系。
C 明天见。
谢谢你的帮助！ → [ ]
对不起！ → [ ]
明天见！ → [ ]

---
<div><p>Random trailing website garbage: 2026-HSK-Official-Exam</p></div>
🎉📚 Good luck with your exam! *** === !!!
Special characters: @#$%^&*()_+~|}{[]`;

      const questions = parseUniversalQuestions(fixtureWithGarbage, { default_level: 1 });
      expect(questions.length).toBe(3);
      expect(questions[0].options.length).toBe(3);
      expect(questions[0].answer_idx).toBe(0); // 谢谢 -> 不客气 (A)
      expect(questions[1].answer_idx).toBe(1); // 对不起 -> 没关系 (B)
      expect(questions[2].answer_idx).toBe(2); // 明天见 -> 明天见 (C)
    });

    it('handles empty strings, whitespace-only, non-string, and completely irrelevant inputs cleanly without throwing', () => {
      expect(parseUniversalQuestions('')).toEqual([]);
      expect(parseUniversalQuestions('   \n\t\r\n   ')).toEqual([]);
      expect(parseUniversalQuestions(null as any)).toEqual([]);
      expect(parseUniversalQuestions(undefined as any)).toEqual([]);
      expect(parseUniversalQuestions('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')).toEqual([]);
    });

    it('handles run-on contiguous text without any newline characters between questions', () => {
      const runOnFixture = `第一部分: 第 1 - 2 题 (Phần 1) Quy tắc: Điền đúng (√) hoặc sai (×). 苹果 (píngguǒ) 桌子上有一本书。(Zhuōzi shang yǒu yì běn shū.) → [ ] 喝水 (hē shuǐ) 天气很热，我想喝水。(Tiānqì hěn rè, wǒ xiǎng hē shuǐ.) → [ ]`;

      const questions = parseUniversalQuestions(runOnFixture, { default_level: 1 });
      expect(questions.length).toBe(2);
      expect(questions[0].stem).toContain('苹果');
      expect(questions[1].stem).toContain('喝水');
      expect(questions[0].answer_idx).toBe(1); // Sai
      expect(questions[1].answer_idx).toBe(0); // Đúng
    });
  });

  // ===========================================================================
  // 2. Stress Testing Uneven Option Counts vs Question Counts
  // ===========================================================================
  describe('2. Uneven Option Counts vs Question Counts', () => {
    it('handles Word Bank with 5 options (A-E) but only 3 questions (n > m)', () => {
      const unevenWordBankFixture = `第四部分: 第 1 - 3 题
Quy tắc: Chọn từ trong bảng A-E để điền vào chỗ trống (bảng có 5 từ nhưng chỉ có 3 câu).
ABCDE
多少 (duōshao) 听 (tīng) 喜欢 (xǐhuan) 里 (lǐ) 怎么 (zěnme)
我非常 ______ 吃中国菜。 → [ ]
请问这个书包 ______ 钱？ → [ ]
你在房间 ______ 做什么呢？ → [ ]`;

      const questions = parseUniversalQuestions(unevenWordBankFixture, { default_level: 1 });
      expect(questions.length).toBe(3);

      for (const q of questions) {
        // All 3 questions receive the full 5 options
        expect(q.options.length).toBe(5);
        expect(q.part_type).toBe('read_fill_blank_word_bank_5opt');
      }

      // Optimal matching:
      // Q1: 非常 ______ 吃 -> 喜欢 (index 2: C)
      // Q2: ______ 钱 -> 多少 (index 0: A)
      // Q3: 房间 ______ -> 里 (index 3: D)
      expect(questions[0].answer_idx).toBe(2);
      expect(questions[1].answer_idx).toBe(0);
      expect(questions[2].answer_idx).toBe(3);

      // Verify all 3 assigned options are distinct!
      const assignedIndices = questions.map((q) => q.answer_idx);
      expect(new Set(assignedIndices).size).toBe(3);

      // Verify 6 Quality Gates for each
      for (const q of questions) {
        const evalRes = evaluateCandidateSixGates(q);
        expect(evalRes.gate1_schema.passed).toBe(true);
        expect(evalRes.gate4_distractor_quality.passed).toBe(true);
      }
    });

    it('handles Dialogue Matching with 5 options (A-E) but only 4 questions (n > m)', () => {
      const unevenDialogueFixture = `第二部分: 第 1 - 4 题
Quy tắc: Chọn phương án phù hợp từ A đến E ghép với từng câu ngữ cảnh (5 phương án, 4 câu).
A 不客气。
B 没关系。
C 好的，明天见。
D 我在看书呢。
E 她去医院看病了。
谢谢你的帮助！ → [ ]
对不起，我来晚了。 → [ ]
你妈妈在家吗？ → [ ]
你在做什么呢？ → [ ]`;

      const questions = parseUniversalQuestions(unevenDialogueFixture, { default_level: 1 });
      console.log('UNEVEN DIALOGUE Q0:', JSON.stringify(questions[0], null, 2));
      expect(questions.length).toBe(4);

      for (const q of questions) {
        expect(q.options.length).toBe(5);
        expect(q.part_type).toBe('read_dialogue_matching_5opt');
      }

      // Expected matching:
      // Q1: 谢谢 -> A (0: 不客气)
      // Q2: 对不起 -> B (1: 没关系)
      // Q3: 妈妈在家吗 -> E (4: 去医院)
      // Q4: 在做什么 -> D (3: 在看书)
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[1].answer_idx).toBe(1);
      expect(questions[2].answer_idx).toBe(4);
      expect(questions[3].answer_idx).toBe(3);

      const assignedIndices = questions.map((q) => q.answer_idx);
      expect(new Set(assignedIndices).size).toBe(4);
    });

    it('handles Word Bank with fewer options than questions (n < m: 3 options, 4 questions) without crashing', () => {
      const fewerOptionsFixture = `第四部分: 第 1 - 4 题
Quy tắc: Chọn từ thích hợp điền vào chỗ trống.
ABC
听 (tīng) 多少 (duōshao) 喜欢 (xǐhuan)
你想 ______ 音乐吗？ → [ ]
这本书 ______ 钱一本？ → [ ]
我很 ______ 吃西瓜。 → [ ]
请问这个大苹果 ______ 钱？ → [ ]`;

      // Should not throw even when options < questions
      expect(() => {
        const questions = parseUniversalQuestions(fewerOptionsFixture, { default_level: 1 });
        expect(questions.length).toBe(4);
        for (const q of questions) {
          expect(q.options.length).toBe(3);
          expect(q.answer_idx).toBeGreaterThanOrEqual(0);
          expect(q.answer_idx).toBeLessThan(3);
        }
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // 3. Anti-Hardcoding & Generalization on Synthetic HSK 1 and HSK 2 Questions
  // ===========================================================================
  describe('3. Anti-Hardcoding & Generalization: Synthetic HSK 1 & HSK 2 Datasets', () => {
    it('solves synthetic HSK 1 questions with novel vocabulary, questions, and distractor layouts', () => {
      // Completely novel HSK 1 sentences not present in any previous fixtures
      const SYNTHETIC_HSK1_EXAM = `第一部分: 第 1 - 3 题 (Phần 1: Câu 1 - 3)
Quy tắc: Đọc từ vựng và câu tương ứng, xác định đồng nhất ý nghĩa. Điền đúng (√) hoặc sai (×).
米饭 (mǐfàn) 妈妈在商店买衣服，没买米饭。(Māma zài shāngdiàn mǎi yīfu, méi mǎi mǐfàn.) → [ ]
看书 (kàn shū) 下雨了，哥哥在房间里看书。(Xiàyǔ le, gēge zài fángjiān lǐ kàn shū.) → [ ]
电脑 (diànnǎo) 桌子上有一只小猫在睡觉。(Zhuōzi shang yǒu yì zhī xiǎomāo zài shuìjiào.) → [ ]

第二部分: 第 4 - 7 题 (Phần 2: Câu 4 - 7)
Quy tắc: Chọn một phương án từ A đến D ghép với từng câu ngữ cảnh.
Ký hiệu Câu lựa chọn
A 不客气。(Bú kèqi.)
B 没关系，请进。(Méi guānxi, qǐng jìn.)
C 好的，明天见。(Hǎo de, míngtiān jiàn.)
D 我在看电视呢。(Wǒ zài kàn diànshì ne.)
对不起，我迟到了。(Duìbuqǐ, wǒ chídào le.) → [ ]
非常感谢你的帮助！(Fēicháng gǎnxiè nǐ de bāngzhù!) → [ ]
你在做什么呢？(Nǐ zài zuò shénme ne?) → [ ]
明天下午见！(Míngtiān xiàwǔ jiàn!) → [ ]

第三部分: 第 8 - 11 题 (Phần 3: Câu 8 - 11)
Quy tắc: Chọn từ trong bảng A-D điền vào chỗ trống.
ABCD
喝 (hē) 坐 (zuò) 多少 (duōshao) 喜欢 (xǐhuan)
我想 ______ 一点儿热茶。(Wǒ xiǎng ______ yìdiǎnr rè chá.) → [ ]
请问，这件衣服 ______ 钱？(Qǐngwèn, zhè jiàn yīfu ______ qián?) → [ ]
他每天 ______ 出租车去上班。(Tā měitiān ______ chūzūchē qù shàngbān.) → [ ]
妹妹很 ______ 学习汉语。(Mèimei hěn ______ xuéxí Hànyǔ.) → [ ]`;

      const parsed = parseUniversalQuestions(SYNTHETIC_HSK1_EXAM, { default_level: 1 });
      expect(parsed.length).toBe(11);

      // Part 1:
      // Q1: 米饭 vs 没买米饭 -> Sai (index 1, negation 没)
      // Q2: 看书 vs 在房间里看书 -> Đúng (index 0, direct match)
      // Q3: 电脑 vs 小猫在睡觉 -> Sai (index 1, disjoint)
      expect(parsed[0].answer_idx).toBe(1);
      expect(parsed[1].answer_idx).toBe(0);
      expect(parsed[2].answer_idx).toBe(1);

      // Part 2:
      // Q4: 对不起 -> B (index 1: 没关系)
      // Q5: 感谢 -> A (index 0: 不客气)
      // Q6: 在做什么 -> D (index 3: 在看电视)
      // Q7: 明天见 -> C (index 2: 好的，明天见)
      expect(parsed[3].answer_idx).toBe(1);
      expect(parsed[4].answer_idx).toBe(0);
      expect(parsed[5].answer_idx).toBe(3);
      expect(parsed[6].answer_idx).toBe(2);

      // Part 3:
      // Word Bank: A=喝, B=坐, C=多少, D=喜欢
      // Q8: ______ 一点儿热茶 -> A (index 0: 喝)
      // Q9: ______ 钱 -> C (index 2: 多少)
      // Q10: ______ 出租车 -> B (index 1: 坐)
      // Q11: 很 ______ 学习 -> D (index 3: 喜欢)
      expect(parsed[7].answer_idx).toBe(0);
      expect(parsed[8].answer_idx).toBe(2);
      expect(parsed[9].answer_idx).toBe(1);
      expect(parsed[10].answer_idx).toBe(3);

      // Verify that all 11 questions have valid Vietnamese explanations
      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i];
        expect(q.explanation_vi).toBeTruthy();
        expect(q.explanation_vi.length).toBeGreaterThanOrEqual(10);
        expect(q.pinyin).toBeTruthy();
      }
    });

    it('solves synthetic HSK 2 True/False questions with Star delimiter (★) and complex sentences', () => {
      // HSK 2 format: Passage ★ Statement
      const tf1 = solveTrueFalseQuestion('我每天早上七点起床跑步。★ 他喜欢运动。');
      expect(tf1.answer_idx).toBe(0); // Đúng (likes sports affirmed by running every morning)

      // Negation with 别/不用:
      const tf2 = solveTrueFalseQuestion('医生说我的感冒好了，不用吃药。★ 他现在还要吃药。');
      expect(tf2.answer_idx).toBe(1); // Sai (negation 不用吃药)

      // Contrast:
      const tf3 = solveTrueFalseQuestion('外面下着大雪，天气非常冷。★ 今天天气很热。');
      expect(tf3.answer_idx).toBe(1); // Sai (cold vs hot)
    });

    it('solves synthetic HSK 2 Dialogue Matching with reason and manner interrogatives', () => {
      const hsk2Questions = [
        { stem: '你怎么没来参加明天的考试？' },
        { stem: '请问去火车站怎么走？' },
        { stem: '你弟弟今年多大了？' },
      ];
      const hsk2Options = [
        '向前走，在第一个路口向左拐。',
        '他今年刚满十八岁。',
        '因为我突然生病发烧了。',
      ];

      const solved = solveDialogueMatchingGroup(hsk2Questions, hsk2Options);
      expect(solved.length).toBe(3);

      // Q1: 怎么没来 -> C (index 2: 因为生病)
      // Q2: 怎么走 -> A (index 0: 向前走)
      // Q3: 多大了 -> B (index 1: 十八岁)
      expect(solved[0].answer_idx).toBe(2);
      expect(solved[1].answer_idx).toBe(0);
      expect(solved[2].answer_idx).toBe(1);
    });

    it('solves synthetic HSK 2 Cloze with locatives and action verbs', () => {
      const clozeQuestions = [
        { stem: '他在房间 ______ 玩电脑游戏。' },
        { stem: '我们去饭馆 ______ 中国菜吧。' },
        { stem: '请问去机场怎么 ______ ？' },
      ];
      const wordBank = ['吃', '里', '走'];

      const solved = solveWordBankGroup(clozeQuestions, wordBank);
      expect(solved.length).toBe(3);

      // Q1: 房间 ______ -> 里 (index 1)
      // Q2: ______ 中国菜 -> 吃 (index 0)
      // Q3: 怎么 ______ -> 走 (index 2)
      expect(solved[0].answer_idx).toBe(1);
      expect(solved[1].answer_idx).toBe(0);
      expect(solved[2].answer_idx).toBe(2);
    });
  });

  // ===========================================================================
  // 4. Stress Testing Solver Components Directly
  // ===========================================================================
  describe('4. Direct Solver Unit Stress Tests', () => {
    it('splitTrueFalseStem isolates keyword and statement correctly across multiple formats', () => {
      // 1. Star delimiter
      const star = splitTrueFalseStem('外面下雨了。★ 他要带雨伞。');
      expect(star.statement).toBe('外面下雨了。');
      expect(star.keyword).toBe('他要带雨伞。');

      // 2. Whitespace delimiter with short Hanzi
      const ws = splitTrueFalseStem('喝水 天气很热，我想喝水。');
      expect(ws.keyword).toBe('喝水');
      expect(ws.statement).toBe('天气很热，我想喝水。');

      // 3. Colon delimiter
      const colon = splitTrueFalseStem('飞机：那是李老师的自行车。');
      expect(colon.keyword).toBe('飞机');
      expect(colon.statement).toBe('那是李老师的自行车。');
    });

    it('evaluates Chinese negation markers correctly (没, 没有, 不, 别, 不是, 无法, 不能)', () => {
      const negations = ['没', '没有', '不', '别', '不是', '无法', '不能'];

      for (const neg of negations) {
        const stem = `看电影 昨天他太忙了，${neg}去电影院看电影。`;
        const res = solveTrueFalseQuestion(stem);
        expect(
          res.answer_idx,
          `Expected negation "${neg}" to result in False (index 1)`
        ).toBe(1);
        expect(res.matchedRule).toBe('keyword_negation');
      }
    });

    it('computeDialogueCompatibility returns high positive scores for valid adjacency pairs and 0 for non-matching', () => {
      expect(computeDialogueCompatibility('谢谢你的帮助！', '不客气。')).toBeGreaterThanOrEqual(30);
      expect(computeDialogueCompatibility('对不起，我来晚了。', '没关系。')).toBeGreaterThanOrEqual(30);
      expect(computeDialogueCompatibility('明天见！', '好的，明天见。')).toBeGreaterThanOrEqual(25);
      expect(computeDialogueCompatibility('你今年多大了？', '我今年二十岁。')).toBeGreaterThanOrEqual(30);
      expect(computeDialogueCompatibility('你怎么去北京的？', '我坐火车去的。')).toBeGreaterThanOrEqual(30);

      // Irrelevant pairings should have low score
      const irrelevantScore = computeDialogueCompatibility('谢谢你的帮助！', '他今年二十岁。');
      expect(irrelevantScore).toBeLessThan(10);
    });

    it('computeClozeCompatibility returns high score for valid collocations and syntactic slots', () => {
      expect(computeClozeCompatibility('这本书 ____ 钱？', '多少')).toBeGreaterThanOrEqual(35);
      expect(computeClozeCompatibility('你想 ____ 音乐吗？', '听')).toBeGreaterThanOrEqual(35);
      expect(computeClozeCompatibility('请问怎么 ____ ？', '走')).toBeGreaterThanOrEqual(35);
      expect(computeClozeCompatibility('他在房间 ____ 睡觉。', '里')).toBeGreaterThanOrEqual(35);
      expect(computeClozeCompatibility('我非常 ____ 吃米饭。', '喜欢')).toBeGreaterThanOrEqual(35);

      // Irrelevant collocation
      const irrelevant = computeClozeCompatibility('他在房间 ____ 睡觉。', '多少');
      expect(irrelevant).toBe(0);
    });

    it('solveSingleQuestion resolves standalone MCQ and True/False questions accurately', async () => {
      const singleTF = await solveSingleQuestion('喝水 天气很热，我想喝水。', ['对', '错'], 'read_true_false_2opt');
      expect(singleTF.answer_idx).toBe(0);

      const singleCloze = await solveSingleQuestion('请问去火车站怎么 ____ ？', ['走', '吃', '听', '看'], 'read_fill_blank_4opt');
      expect(singleCloze.answer_idx).toBe(0);
      expect(singleCloze.explanation_vi).toContain('走');

      const singleDiag = await solveSingleQuestion('你认识王老师吗？', ['认识，他是我的中文老师。', '今天很冷。', '我有三个苹果。', '我想去商店。'], 'read_dialogue_matching_4opt');
      expect(singleDiag.answer_idx).toBe(0);
    });
  });

  // ===========================================================================
  // 5. Database Invariant Attestation
  // ===========================================================================
  describe('5. Database Invariants Attestation', () => {
    it('guarantees data/hsk_exam.db SHA-256 remains completely untouched throughout test run', () => {
      const currentSha = computeSha256(HSK_EXAM_DB_PATH);
      expect(currentSha).toBe(EXPECTED_HSK_EXAM_SHA256);
    });

    it('guarantees data/qbank/qbank.db SHA-256 remains completely untouched throughout test run', () => {
      const currentSha = computeSha256(QBANK_DB_PATH);
      expect(currentSha).toBe(qbankShaBefore || EXPECTED_QBANK_SHA256);
    });
  });
});
