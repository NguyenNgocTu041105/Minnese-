import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';
import { evaluateCandidateSixGates, validateCandidate } from '../src/server/llm/questionValidator.js';
import {
  solveTrueFalseQuestion,
  solveDialogueMatchingGroup,
  solveWordBankGroup,
} from '../src/server/llm/autoAnswerSolver.js';

describe('Reviewer M1-2 Independent Edge Case & Conformance Review', () => {
  let initialQBankSha = '';
  beforeAll(() => {
    const qbankPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    if (fs.existsSync(qbankPath)) {
      initialQBankSha = crypto.createHash('sha256').update(fs.readFileSync(qbankPath)).digest('hex').toUpperCase();
    }
  });

  // =========================================================================
  // 1. Section Segmentation Edge Cases
  // =========================================================================
  describe('1. Section Segmentation Edge Cases', () => {
    it('handles mixed Chinese/Vietnamese titles with various numbering styles', () => {
      const mixedTitlesText = `
第1部分: 第 1 - 2 题 (Phần 1: Câu 1 - 2)
Quy tắc: Điền đúng (√) hoặc sai (×).
苹果 桌子上有一本书。 → [ ]
喝水 天气很热，我想喝水。 → [ ]

Phần 2: Câu 3 - 4 (Part 2: Questions 3 - 4)
Quy tắc: Ghép câu A đến B.
A 不客气。
B 好的，明天见。
谢谢你的帮助！ → [ ]
明天上午见！ → [ ]
`;
      const questions = parseUniversalQuestions(mixedTitlesText, { default_level: 1 });
      expect(questions.length).toBe(4);
      expect(questions[0].part_type).toBe('read_true_false_2opt');
      expect(questions[1].part_type).toBe('read_true_false_2opt');
      expect(questions[2].part_type).toBe('read_dialogue_matching_2opt');
      expect(questions[3].part_type).toBe('read_dialogue_matching_2opt');

      // Rule text must not leak into Q1 stem
      expect(questions[0].stem).not.toContain('Quy tắc');
      expect(questions[0].stem).not.toContain('Phần');
      expect(questions[2].stem).not.toContain('Quy tắc');
      expect(questions[2].stem).not.toContain('Phần');
    });

    it('handles run-on text with no whitespace between options or questions', () => {
      const runOnText = `第一部分: 第 1 - 2 题 (Phần 1: Câu 1 - 2)Quy tắc: Điền đúng (√) hoặc sai (×).飞机 那是李老师的自行车。→ [ ]看电影 星期天我和朋友去电影院看电影。→ [ ]第二部分: 第 3 - 4 题 (Phần 2: Câu 3 - 4)Quy tắc: Chọn phương án phù hợp từ A đến B.Ký hiệuCâu lựa chọnA不客气。(Bú kèqi.)B没关系。(Méi guānxi.)谢谢你的帮助！→ [ ]对不起，我来晚了。→ [ ]`;

      const questions = parseUniversalQuestions(runOnText, { default_level: 1 });
      expect(questions.length).toBe(4);

      // Part 1: Q1 and Q2
      expect(questions[0].part_type).toBe('read_true_false_2opt');
      expect(questions[0].stem).toContain('飞机');
      expect(questions[0].stem).toContain('自行车');
      expect(questions[0].answer_idx).toBe(1); // 飞机 vs 自行车 -> Sai (1)

      expect(questions[1].part_type).toBe('read_true_false_2opt');
      expect(questions[1].stem).toContain('看电影');
      expect(questions[1].answer_idx).toBe(0); // 看电影 vs 看电影 -> Đúng (0)

      // Part 2: Q3 and Q4
      expect(questions[2].part_type).toBe('read_dialogue_matching_2opt');
      expect(questions[2].options.length).toBe(2);
      expect(questions[2].options[0]).toBe('不客气。');
      expect(questions[2].options[1]).toBe('没关系。');
      expect(questions[2].answer_idx).toBe(0); // 谢谢 -> 不客气 (A = 0)

      expect(questions[3].answer_idx).toBe(1); // 对不起 -> 没关系 (B = 1)
    });

    it('handles markdown table variations with whitespace and lowercase letters', () => {
      const tableFixture = `第二部分: 第 1 - 2 题
Quy tắc: Chọn một phương án phù hợp từ bảng sau.
|  Ký hiệu  |   Câu phản hồi   |
|   a   |   不客气。   |
|   B   |   没关系，请坐。   |

1. 谢谢你的帮助！ → [ ]
2. 对不起，我来晚了。 → [ ]`;

      const questions = parseUniversalQuestions(tableFixture, { default_level: 1 });
      expect(questions.length).toBe(2);
      expect(questions[0].options.length).toBe(2);
      expect(questions[0].options[0]).toBe('不客气。');
      expect(questions[0].options[1]).toBe('没关系，请坐。');
      expect(questions[0].answer_idx).toBe(0); // A
      expect(questions[1].answer_idx).toBe(1); // B
    });

    it('handles unnumbered items without standard number prefix (1., Câu 1)', () => {
      const unnumberedText = `第一部分: 第 1 - 2 题
Quy tắc: Điền đúng (√) hoặc sai (×).
苹果 桌子上有一本书。→ [ ]
喝水 天气很热，我想喝水。→ [ ]`;

      const questions = parseUniversalQuestions(unnumberedText, { default_level: 1 });
      expect(questions.length).toBe(2);
      expect(questions[0].stem).toContain('苹果');
      expect(questions[1].stem).toContain('喝水');
    });
  });

  // =========================================================================
  // 2. Pinyin Separation Edge Cases
  // =========================================================================
  describe('2. Pinyin Separation Edge Cases', () => {
    it('cleanly strips inline Latin pinyin in parentheses without losing punctuation or Hanzi', () => {
      const rawText = `第一部分: 第 1 - 2 题
Quy tắc: Điền đúng (√) hoặc sai (×).
苹果 (píngguǒ)，桌子上有一本书。(Zhuōzi shang yǒu yì běn shū.) → [ ]
看电影 (kàn diànyǐng)！星期天我和朋友去电影院看电影。(Xīngqītiān wǒ hé péngyou qù diànyǐngyuàn kàn diànyǐng.) → [ ]`;

      const questions = parseUniversalQuestions(rawText, { default_level: 1 });
      expect(questions.length).toBe(2);

      // Q1: Check stem punctuation and Hanzi
      expect(questions[0].stem).toBe('苹果 ，桌子上有一本书。');
      expect(questions[0].pinyin).toContain('píngguǒ');
      expect(questions[0].pinyin).toContain('Zhuōzi');

      // Q2: Check exclamation mark and Hanzi
      expect(questions[1].stem).toBe('看电影 ！星期天我和朋友去电影院看电影。');
      expect(questions[1].pinyin).toContain('kàn diànyǐng');

      // Zero Latin letters in stem
      expect(/[a-zA-Z]/.test(questions[0].stem)).toBe(false);
      expect(/[a-zA-Z]/.test(questions[1].stem)).toBe(false);
    });

    it('handles full-width Chinese parentheses （píngguǒ） properly', () => {
      const fullWidthPinyinText = `第一部分: 第 1 - 1 题
Quy tắc: Điền đúng (√) hoặc sai (×).
苹果（píngguǒ）桌子上有一本书。（Zhuōzi shang yǒu yì běn shū.）→ [ ]`;

      const questions = parseUniversalQuestions(fullWidthPinyinText, { default_level: 1 });
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('苹果 桌子上有一本书。');
      expect(questions[0].pinyin).toContain('píngguǒ');
      expect(questions[0].pinyin).toContain('Zhuōzi');
      expect(/[a-zA-Z]/.test(questions[0].stem)).toBe(false);
    });

    it('handles cloze stems with placeholders in pinyin (Wǒ fēicháng ____ chī...)', () => {
      const clozeText = `第四部分: 第 1 - 1 题
Quy tắc: Điền từ vào chỗ trống.
A 喜欢 (xǐhuan)
我非常 ______ 吃中国米饭。(Wǒ fēicháng ______ chī Zhōngguó mǐfàn.) → [ ]`;

      const questions = parseUniversalQuestions(clozeText, { default_level: 1 });
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toContain('____');
      expect(questions[0].pinyin).toContain('fēicháng');
      expect(questions[0].pinyin).toContain('mǐfàn');
    });
  });

  // =========================================================================
  // 3. Auto-Solver Rationales Quality & Consistency
  // =========================================================================
  describe('3. Auto-Solver Rationales Quality & Consistency', () => {
    it('verifies True/False explanations are grammatically sound and strictly consistent with answer index', () => {
      const tfNegation = solveTrueFalseQuestion('他在睡觉，没打电话。', ['对', '错']);
      expect(tfNegation.answer_idx).toBe(1); // 错
      expect(tfNegation.explanation_vi).toContain('phủ định');
      expect(tfNegation.explanation_vi).toContain('错');
      expect(tfNegation.distractor_rationales).toBeDefined();
      expect(tfNegation.distractor_rationales![1].isCorrect).toBe(true);
      expect(tfNegation.distractor_rationales![0].isCorrect).toBe(false);

      const tfAffirmation = solveTrueFalseQuestion('天气很热，我想喝水。', ['对', '错']);
      expect(tfAffirmation.answer_idx).toBe(0); // 对
      expect(tfAffirmation.explanation_vi).toContain('đồng nhất');
      expect(tfAffirmation.explanation_vi).toContain('对');
      expect(tfAffirmation.distractor_rationales![0].isCorrect).toBe(true);
      expect(tfAffirmation.distractor_rationales![1].isCorrect).toBe(false);

      const tfDisjoint = solveTrueFalseQuestion('飞机 那是李老师的自行车。', ['对', '错']);
      expect(tfDisjoint.answer_idx).toBe(1); // 错
      expect(tfDisjoint.explanation_vi).toContain('không xuất hiện');
      expect(tfDisjoint.explanation_vi).toContain('错');
    });

    it('verifies Dialogue Matching explanations correctly reference the matched option and letter', () => {
      const questions = [{ stem: '谢谢你的帮助！' }, { stem: '对不起，我来晚了。' }];
      const options = ['不客气。', '没关系，请坐。'];
      const solved = solveDialogueMatchingGroup(questions, options);

      expect(solved.length).toBe(2);
      expect(solved[0].answer_idx).toBe(0); // A
      expect(solved[0].explanation_vi).toContain('A: 不客气。');
      expect(solved[0].distractor_rationales![0].isCorrect).toBe(true);
      expect(solved[0].distractor_rationales![1].isCorrect).toBe(false);

      expect(solved[1].answer_idx).toBe(1); // B
      expect(solved[1].explanation_vi).toContain('B: 没关系，请坐。');
      expect(solved[1].distractor_rationales![1].isCorrect).toBe(true);
      expect(solved[1].distractor_rationales![0].isCorrect).toBe(false);
    });

    it('verifies Word Bank Cloze explanations construct valid completed sentences', () => {
      const questions = [
        { stem: '请问，这个大苹果 ____ 钱一个？' },
        { stem: '他在房间 ____ 睡觉。' },
      ];
      const wordBank = ['多少', '里'];
      const solved = solveWordBankGroup(questions, wordBank);

      expect(solved.length).toBe(2);
      expect(solved[0].answer_idx).toBe(0); // A: 多少
      expect(solved[0].explanation_vi).toContain('多少');
      expect(solved[0].explanation_vi).toContain('cấu trúc ngữ pháp chuẩn xác');

      expect(solved[1].answer_idx).toBe(1); // B: 里
      expect(solved[1].explanation_vi).toContain('里');
      expect(solved[1].explanation_vi).toContain('cấu trúc ngữ pháp chuẩn xác');
    });
  });

  // =========================================================================
  // 4. Gate 4 POS Compatibility
  // =========================================================================
  describe('4. Gate 4 POS Compatibility', () => {
    it('ensures word bank tasks with mixed parts of speech do NOT falsely fail Gate 4', () => {
      // Word bank options spanning pronoun (多少), verb (听, 喜欢), noun/postposition (里), pronoun (怎么)
      const wordBankCandidates = [
        {
          stem: '我非常 ____ 吃中国米饭。',
          completed_stem: '我非常喜欢吃中国米饭。',
          options: ['多少', '听', '喜欢', '里', '怎么'],
          answer_idx: 2,
          explanation_vi: 'Từ 喜欢 điền vào chỗ trống tạo thành câu hoàn chỉnh và chuẩn ngữ pháp.',
          explanation_summary_vi: 'Từ 喜欢 điền vào chỗ trống tạo thành câu hoàn chỉnh.',
          answer_rationale_vi: '喜欢 là động từ tâm lý phù hợp với phó từ chỉ mức độ 非常.',
          level: 1,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_word_bank_5opt',
        },
        {
          stem: '请问，这个大苹果 ____ 钱一个？',
          completed_stem: '请问，这个大苹果多少钱一个？',
          options: ['多少', '听', '喜欢', '里', '怎么'],
          answer_idx: 0,
          explanation_vi: 'Từ 多少 điền vào chỗ trống hỏi giá tiền.',
          explanation_summary_vi: 'Từ 多少 điền vào chỗ trống hỏi giá tiền.',
          answer_rationale_vi: '多少 kết hợp với 钱 tạo thành cụm từ hỏi giá tiền 多少钱.',
          level: 1,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_word_bank_5opt',
        },
        {
          stem: '他在房间 ____ 睡觉。',
          completed_stem: '他在房间里睡觉。',
          options: ['多少', '听', '喜欢', '里', '怎么'],
          answer_idx: 3,
          explanation_vi: 'Từ 里 điền vào chỗ trống biểu thị vị trí bên trong.',
          explanation_summary_vi: 'Từ 里 điền vào chỗ trống biểu thị vị trí.',
          answer_rationale_vi: 'Phương vị từ 里 đi cùng 在... tạo thành ngữ cố định 在房间里.',
          level: 1,
          skill: 'reading' as const,
          part_type: 'read_fill_blank_word_bank_5opt',
        },
      ];

      for (const cand of wordBankCandidates) {
        const evalResult = evaluateCandidateSixGates(cand as any);
        expect(
          evalResult.gate4_distractor_quality.passed,
          `Candidate failed Gate 4 unexpectedly: ${evalResult.gate4_distractor_quality.details}`
        ).toBe(true);

        const valResult = validateCandidate(cand as any, []);
        const posWarnings = valResult.warnings.filter((w) => /POS mismatch/i.test(w));
        expect(
          posWarnings.length,
          `Word bank candidate emitted POS mismatch warnings: ${posWarnings.join(', ')}`
        ).toBe(0);
      }
    });

    it('ensures dialogue matching tasks with mixed option formats do NOT falsely fail Gate 4', () => {
      const dialogueCandidate = {
        stem: '你认识那个汉字吗？你会写吗？',
        options: [
          '我是坐出租车去的。',
          '他今年二十五岁。',
          '今天冷，明天不冷。',
          '我会写一点儿。',
          '里面有三个苹果。',
        ],
        answer_idx: 3,
        explanation_vi: 'Câu hỏi về khả năng viết chữ Hán, câu phản hồi D phù hợp nhất.',
        explanation_summary_vi: 'Câu hỏi về khả năng viết chữ Hán.',
        answer_rationale_vi: '我会写一点儿 trả lời trực tiếp cho câu hỏi 你会写吗.',
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_dialogue_matching_5opt',
      };

      const evalResult = evaluateCandidateSixGates(dialogueCandidate as any);
      expect(
        evalResult.gate4_distractor_quality.passed,
        `Dialogue matching failed Gate 4: ${evalResult.gate4_distractor_quality.details}`
      ).toBe(true);
    });
  });

  // =========================================================================
  // 5. Database Invariant Checksums
  // =========================================================================
  describe('5. Database Invariant Checksums', () => {
    it('verifies hsk_exam.db and qbank.db hashes are completely untouched', () => {
      const hskPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      const qbankPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');

      const hskSha = crypto.createHash('sha256').update(fs.readFileSync(hskPath)).digest('hex').toUpperCase();
      const qbankSha = crypto.createHash('sha256').update(fs.readFileSync(qbankPath)).digest('hex').toUpperCase();

      expect(hskSha).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
      expect(qbankSha).toBe(initialQBankSha || 'E370C327D1A516804AB9B515D0A921A5917346587B3188796260CE171EF1A5AD');
    });
  });
});
