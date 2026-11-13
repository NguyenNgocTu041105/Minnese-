/**
 * =============================================================================
 * Automated Test Suite: AI Multi-Source Question Parser & Ingestion Engine
 * Test Architecture: 4-Tier Test Verification (Tiers 1–4)
 * Specifications: ORIGINAL_REQUEST.md, PROJECT.md, spec_miner_ai_formats/handoff.md,
 *                 explorer_survey_export_tests/handoff.md
 *
 * Tier 1: Feature Coverage (ChatGPT, Claude, Gemini Outputs)
 * Tier 2: Boundary & Corner Cases (Full-Width Latin, Explicit Prefixes, Slashes,
 *         Hyphens, Irregular Line Breaks, Horizontal/2x2 Grids, Inline Answers)
 * Tier 3: Cross-Feature Combinations (Bottom Keys + Explanations, Text Answers,
 *         Part-Type Auto-Inference, JSON Prefix Normalization)
 * Tier 4: Real-World Ingestion-to-Export Pipeline (Excel 3-Sheet, Word OpenXML,
 *         JSON Roundtrip Fidelity, Six Quality Gates Validation)
 * =============================================================================
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';
import {
  exportExamToExcel,
  exportExamToWord,
  exportExamToJson,
} from '../src/server/examExportService.js';
import { extractDocxTextFromBuffer } from '../src/server/fileUploadParser.js';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

// =============================================================================
// Section 0: The 7 Canonical Production Fixtures from Spec Miner Handoff
// =============================================================================

export const FIXTURE_CHATGPT_COMPREHENSIVE = `
**1.** 他在学校学习汉语。(Tā zài xuéxiào xuéxí Hànyǔ.)
- A) 学习
- B) 看书
- C) 睡觉
- D) 买东西
**Answer:** A
**Explanation:** Trong câu có từ 学校 (trường học), động từ phù hợp nhất là 学习 (học tập).

**Question 2:** 桌子上有一个大西瓜。
* A. 苹果
* B. 西瓜
* C. 米饭
* D. 飞机
**Correct Answer:** B
**Explanation:** 西瓜 nghĩa là quả dưa hấu.
`.trim();

export const FIXTURE_CLAUDE_COMPREHENSIVE = `
Here are the practice questions:

1. 他是我的好朋友。
A) 医生
B) 老师
C) 朋友
D) 同学
Answer: C
Explanation: Từ 朋友 (bạn bè) phù hợp với ngữ cảnh câu.

2. 我们在图书馆看书。
a. 图书馆
b. 医院
c. 电影院
d. 车站
Answer: a
Explanation: Đọc sách ở thư viện (图书馆).
`.trim();

export const FIXTURE_GEMINI_COMPREHENSIVE = `
Certainly! Here are 2 practice questions for your HSK exam preparation:

1. 他今天很高兴。
* **A)** 高兴
* **B)** 生气
* **C)** 难过
* **D)** 累
* **Answer:** A
* **Explanation:** 高兴 có nghĩa là vui vẻ, hạnh phúc.

2. 姐姐在看电视。
* **A.** 看书
* **B.** 看电视
* **C.** 听音乐
* **D.** 玩游戏
* **Answer:** B
* **Explanation:** 看电视 có nghĩa là xem tivi.

I hope these questions help your students prepare for the exam! Let me know if you need more.
`.trim();

export const FIXTURE_TEACHER_ANOMALIES_PACK = `
Câu 01: 他喜欢吃水果。   


A. 苹果    B. 香蕉    C. 西瓜    D. 桃子
Đáp án: A   

Câu 02: 桌子上有一本书。
A. 书       B. 笔
C. 本子     D. 手机
Đáp án: A
Giải thích: Trên bàn có một cuốn sách (书).

15. 妈妈在厨房做饭。
A. 洗衣服
* B. 做饭
C. 睡觉
D. 看电视

II. 哥哥在睡觉。
[A] 看书
[B] 吃饭
[C] 睡觉
[D] 工作
Đáp án: C
`.trim();

export const FIXTURE_NON_STANDARD_OPTION_LABELS = `
Câu 1: 他在学校学习。
Ａ. 学习
Ｂ. 看书
Ｃ. 睡觉
Ｄ. 买东西
Đáp án: A

Câu 2: 爸爸在医院工作。
Option A: 医生
Option B: 老师
Option C: 司机
Option D: 护士
Answer: A

Câu 3: 他去火车站买票。
选项A: 机场
选项B: 火车站
选项C: 商店
选项D: 医院
答案: B

Câu 4: 姐姐在喝茶。
A/ 喝水
B/ 喝茶
C/ 吃饭
D/ 睡觉
Đáp án: B
`.trim();

export const FIXTURE_BOTTOM_ANSWER_KEY_WITH_EXPLANATIONS = `
Câu 1: 他在学校学习。
A. 学习
B. 看书
C. 睡觉
D. 买东西

Câu 2: 他去北京旅游。
A. 北京
B. 上海
C. 广州
D. 深圳

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT
Câu 1: A. Giải thích: Trong câu có từ 学校 (trường học), phù hợp nhất với 学习 (học tập).
Câu 2: A. Giải thích: Bắc Kinh (北京) là thủ đô Trung Quốc, đáp án A.
`.trim();

export const FIXTURE_TRUE_FALSE_AND_BLANKS = `
Câu 1: 苹果 桌子上有一个红苹果。(píngguǒ)
Đúng
Sai
Đáp án: Đúng

Câu 2: 喝水 他在睡觉，没喝水。
A. 正确 (√)
B. 错误 (×)
Đáp án: B

3. 我非常 [...] 吃中国米饭。
A. 喜欢
B. 讨厌
C. 害怕
D. 知道
Đáp án: A

4. 请问，这个苹果 （ ） 钱一个？
A. 怎么
B. 多少
C. 什么
D. 几
Đáp án: B
`.trim();

describe('AI Multi-Source Question Parser & Ingestion Suite', () => {

  // ===========================================================================
  // Section 0: Validation of 7 Canonical Production Fixtures
  // ===========================================================================
  describe('Section 0: Seven Production AI Fixtures (Spec Miner Handoff)', () => {
    it('Fixture 1: parses ChatGPT comprehensive output with bold headers and markdown bullets', () => {
      const questions = parseUniversalQuestions(FIXTURE_CHATGPT_COMPREHENSIVE, {
        default_level: 1,
        default_skill: 'reading',
      });

      expect(questions.length).toBe(2);

      // Question 1
      expect(questions[0].stem).toBe('他在学校学习汉语。');
      expect(questions[0].options).toEqual(['学习', '看书', '睡觉', '买东西']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('Trong câu có từ 学校');
      expect(questions[0].pinyin).toMatch(/xué\s*xiào/i);

      // Question 2
      expect(questions[1].stem).toBe('桌子上有一个大西瓜。');
      expect(questions[1].options).toEqual(['苹果', '西瓜', '米饭', '飞机']);
      expect(questions[1].answer_idx).toBe(1);
      expect(questions[1].explanation_vi).toContain('西瓜 nghĩa là quả dưa hấu');
    });

    it('Fixture 2: parses Claude comprehensive output with parenthesized and lowercase options', () => {
      const questions = parseUniversalQuestions(FIXTURE_CLAUDE_COMPREHENSIVE, {
        default_level: 1,
        default_skill: 'reading',
      });

      expect(questions.length).toBe(2);

      // Question 1
      expect(questions[0].stem).toBe('他是我的好朋友。');
      expect(questions[0].options).toEqual(['医生', '老师', '朋友', '同学']);
      expect(questions[0].answer_idx).toBe(2);
      expect(questions[0].explanation_vi).toContain('Từ 朋友 (bạn bè)');

      // Question 2 (lowercase a. b. c. d. options)
      expect(questions[1].stem).toBe('我们在图书馆看书。');
      expect(questions[1].options).toEqual(['图书馆', '医院', '电影院', '车站']);
      expect(questions[1].answer_idx).toBe(0);
      expect(questions[1].explanation_vi).toContain('Đọc sách ở thư viện');
    });

    it('Fixture 3: parses Gemini output with conversational preamble and epilogue', () => {
      const questions = parseUniversalQuestions(FIXTURE_GEMINI_COMPREHENSIVE, {
        default_level: 1,
        default_skill: 'reading',
      });

      expect(questions.length).toBe(2);

      // Question 1
      expect(questions[0].stem).toBe('他今天很高兴。');
      expect(questions[0].options).toEqual(['高兴', '生气', '难过', '累']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('高兴 có nghĩa là vui vẻ');

      // Question 2
      expect(questions[1].stem).toBe('姐姐在看电视。');
      expect(questions[1].options).toEqual(['看书', '看电视', '听音乐', '玩游戏']);
      expect(questions[1].answer_idx).toBe(1);
      expect(questions[1].explanation_vi).toContain('看电视 có nghĩa là xem tivi');
    });

    it('Fixture 4: parses Teacher Real-World Anomaly Pack (horizontal options, 2x2 grid, Roman/non-1 numbers)', () => {
      const questions = parseUniversalQuestions(FIXTURE_TEACHER_ANOMALIES_PACK, {
        default_level: 1,
      });

      expect(questions.length).toBe(4);

      // Q1: Horizontal single-line options
      expect(questions[0].stem).toBe('他喜欢吃水果。');
      expect(questions[0].options).toEqual(['苹果', '香蕉', '西瓜', '桃子']);
      expect(questions[0].answer_idx).toBe(0);

      // Q2: 2x2 grid layout
      expect(questions[1].stem).toBe('桌子上有一本书。');
      expect(questions[1].options).toEqual(['书', '笔', '本子', '手机']);
      expect(questions[1].answer_idx).toBe(0);
      expect(questions[1].explanation_vi).toContain('Trên bàn có một cuốn sách');

      // Q3: Non-1 starting number 15 + inline asterisk answer marker
      expect(questions[2].stem).toBe('妈妈在厨房做饭。');
      expect(questions[2].options).toEqual(['洗衣服', '做饭', '睡觉', '看电视']);
      expect(questions[2].answer_idx).toBe(1);

      // Q4: Roman numeral II + square brackets [A]..[D]
      expect(questions[3].stem).toBe('哥哥在睡觉。');
      expect(questions[3].options).toEqual(['看书', '吃饭', '睡觉', '工作']);
      expect(questions[3].answer_idx).toBe(2);
    });

    it('Fixture 5: parses non-standard option labels (Full-width letters, explicit prefixes, slashes)', () => {
      const questions = parseUniversalQuestions(FIXTURE_NON_STANDARD_OPTION_LABELS, {
        default_level: 1,
      });

      expect(questions.length).toBe(4);

      // Q1: Full-width Latin letters Ａ-Ｄ
      expect(questions[0].stem).toBe('他在学校学习。');
      expect(questions[0].options).toEqual(['学习', '看书', '睡觉', '买东西']);
      expect(questions[0].answer_idx).toBe(0);

      // Q2: English explicit Option A: .. Option D:
      expect(questions[1].stem).toBe('爸爸在医院工作。');
      expect(questions[1].options).toEqual(['医生', '老师', '司机', '护士']);
      expect(questions[1].answer_idx).toBe(0);

      // Q3: Chinese explicit 选项A: .. 选项D:
      expect(questions[2].stem).toBe('他去火车站买票。');
      expect(questions[2].options).toEqual(['机场', '火车站', '商店', '医院']);
      expect(questions[2].answer_idx).toBe(1);

      // Q4: Slash delimiters A/ .. D/
      expect(questions[3].stem).toBe('姐姐在喝茶。');
      expect(questions[3].options).toEqual(['喝水', '喝茶', '吃饭', '睡觉']);
      expect(questions[3].answer_idx).toBe(1);
    });

    it('Fixture 6: captures multilingual bottom answer key and detailed explanations with dot separator', () => {
      const questions = parseUniversalQuestions(FIXTURE_BOTTOM_ANSWER_KEY_WITH_EXPLANATIONS, {
        default_level: 1,
      });

      expect(questions.length).toBe(2);

      expect(questions[0].stem).toBe('他在学校学习。');
      expect(questions[0].options).toEqual(['学习', '看书', '睡觉', '买东西']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('Trong câu có từ 学校 (trường học)');

      expect(questions[1].stem).toBe('他去北京旅游。');
      expect(questions[1].options).toEqual(['北京', '上海', '广州', '深圳']);
      expect(questions[1].answer_idx).toBe(0);
      expect(questions[1].explanation_vi).toContain('Bắc Kinh (北京) là thủ đô Trung Quốc');
    });

    it('Fixture 7: normalizes True/False formats and cleans multi-format fill blanks', () => {
      const questions = parseUniversalQuestions(FIXTURE_TRUE_FALSE_AND_BLANKS, {
        default_level: 1,
        default_skill: 'reading',
      });

      expect(questions.length).toBe(4);

      // Q1: Đúng/Sai normalized to 对/错
      expect(questions[0].stem).toBe('苹果 桌子上有一个红苹果。');
      expect(questions[0].options).toEqual(['对', '错']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].part_type).toBe('read_true_false_2opt');

      // Q2: 正确(√)/错误(×) normalized to 对/错
      expect(questions[1].stem).toBe('喝水 他在睡觉，没喝水。');
      expect(questions[1].options).toEqual(['对', '错']);
      expect(questions[1].answer_idx).toBe(1);
      expect(questions[1].part_type).toBe('read_true_false_2opt');

      // Q3: Fill blank with [...] converted to ____
      expect(questions[2].stem).toBe('我非常 ____ 吃中国米饭。');
      expect(questions[2].completed_stem).toBe('我非常喜欢吃中国米饭。');
      expect(questions[2].options).toEqual(['喜欢', '讨厌', '害怕', '知道']);
      expect(questions[2].answer_idx).toBe(0);
      expect(questions[2].part_type).toBe('read_fill_blank_4opt');

      // Q4: Fill blank with （ ） converted to ____
      expect(questions[3].stem).toBe('请问，这个苹果 ____ 钱一个？');
      expect(questions[3].completed_stem).toBe('请问，这个苹果多少钱一个？');
      expect(questions[3].options).toEqual(['怎么', '多少', '什么', '几']);
      expect(questions[3].answer_idx).toBe(1);
      expect(questions[3].part_type).toBe('read_fill_blank_4opt');
    });
  });

  // ===========================================================================
  // TIER 1: FEATURE COVERAGE (MAJOR AI MODELS)
  // ===========================================================================
  describe('Tier 1: Feature Coverage — Major AI Models', () => {
    it('Tier 1.1 (ChatGPT): parses markdown bold numbering and bulleted options', () => {
      const input = `
**Question 1:** 他是北京人。
- A) 北京
- B) 上海
- C) 广州
- D) 深圳
**Answer:** A
**Rationale:** 北京 là thành phố được nhắc đến.
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('他是北京人。');
      expect(questions[0].options).toEqual(['北京', '上海', '广州', '深圳']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('thành phố được nhắc đến');
    });

    it('Tier 1.2 (ChatGPT): unwraps questions enclosed inside markdown code fences (```markdown / ```text)', () => {
      const input = `
\`\`\`markdown
1. 他在看书。
A. 学习
B. 看书
C. 听歌
D. 跑步
Đáp án: B
\`\`\`
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('他在看书。');
      expect(questions[0].options).toEqual(['学习', '看书', '听歌', '跑步']);
      expect(questions[0].answer_idx).toBe(1);
    });

    it('Tier 1.3 (Claude): parses numbered questions with parenthesized options and lowercase labels', () => {
      const input = `
1. 老师在教室上课。
(A) 教室
(B) 医院
(C) 饭馆
(D) 机场
Answer: A
Explanation: Thầy giáo dạy học ở phòng học (教室).

2. 弟弟今年八岁。
a. 六岁
b. 七岁
c. 八岁
d. 九岁
Answer: c
Explanation: Em trai 8 tuổi (八岁).
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(2);

      expect(questions[0].stem).toBe('老师在教室上课。');
      expect(questions[0].options).toEqual(['教室', '医院', '饭馆', '机场']);
      expect(questions[0].answer_idx).toBe(0);

      expect(questions[1].stem).toBe('弟弟今年八岁。');
      expect(questions[1].options).toEqual(['六岁', '七岁', '八岁', '九岁']);
      expect(questions[1].answer_idx).toBe(2);
    });

    it('Tier 1.4 (Gemini): ignores multi-line conversational preamble and epilogue', () => {
      const input = `
Hello teacher! Here is the practice set you requested:
Hope you have a productive class with these questions!

1. 妈妈去商店买水果。
* **A.** 商店
* **B.** 学校
* **C.** 医院
* **D.** 车站
* **Answer:** A
* **Explanation:** Mẹ đi cửa hàng (商店) mua hoa quả.

Let me know if you would like me to adjust difficulty or add more questions!
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('妈妈去商店买水果。');
      expect(questions[0].options).toEqual(['商店', '学校', '医院', '车站']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('cửa hàng (商店)');
    });
  });

  // ===========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (TEACHER ANOMALIES)
  // ===========================================================================
  describe('Tier 2: Boundary & Corner Cases — Teacher Copy-Paste Anomalies', () => {
    it('Tier 2.1: handles Chinese IME full-width Latin letters (Ａ. Ｂ. Ｃ. Ｄ. \uFF21-\uFF26)', () => {
      const input = `
1. 他每天喝茶。
Ａ. 喝茶
Ｂ. 喝水
Ｃ. 吃饭
Ｄ. 睡觉
Đáp án: A
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('他每天喝茶。');
      expect(questions[0].options).toEqual(['喝茶', '喝水', '吃饭', '睡觉']);
      expect(questions[0].answer_idx).toBe(0);
    });

    it('Tier 2.2: handles explicit option prefixes (Option A:, 选项A:, 选项 A:, Phương án A:)', () => {
      const input = `
Câu 1: 他在看电影。
Option A: 看电影
Option B: 听音乐
Option C: 打篮球
Option D: 踢足球
Answer: A

Câu 2: 他去火车站。
选项A: 机场
选项B: 火车站
选项C: 商店
选项D: 饭店
答案: B

Câu 3: 他在教室。
选项 A: 教室
选项 B: 医院
选项 C: 图书馆
选项 D: 学校
Đáp án: A

Câu 4: 他在吃饭。
Phương án A: 睡觉
Phương án B: 喝水
Phương án C: 吃饭
Phương án D: 看书
Đáp án: C
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(4);

      expect(questions[0].options).toEqual(['看电影', '听音乐', '打篮球', '踢足球']);
      expect(questions[0].answer_idx).toBe(0);

      expect(questions[1].options).toEqual(['机场', '火车站', '商店', '饭店']);
      expect(questions[1].answer_idx).toBe(1);

      expect(questions[2].options).toEqual(['教室', '医院', '图书馆', '学校']);
      expect(questions[2].answer_idx).toBe(0);

      expect(questions[3].options).toEqual(['睡觉', '喝水', '吃饭', '看书']);
      expect(questions[3].answer_idx).toBe(2);
    });

    it('Tier 2.3: handles non-letter option prefixes (circled numbers ①..④ and numeric 1..4)', () => {
      const inputCircled = `
1. 他是医生。
① 医生
② 老师
③ 司机
④ 护士
Đáp án: ①
      `.trim();

      const qCircled = parseUniversalQuestions(inputCircled);
      expect(qCircled.length).toBe(1);
      expect(qCircled[0].options).toEqual(['医生', '老师', '司机', '护士']);
      expect(qCircled[0].answer_idx).toBe(0);

      const inputNumeric = `
1. 桌子上有苹果。
1. 苹果
2. 香蕉
3. 西瓜
4. 桃子
Đáp án: 1
      `.trim();

      const qNumeric = parseUniversalQuestions(inputNumeric);
      expect(qNumeric.length).toBe(1);
      expect(qNumeric[0].options).toEqual(['苹果', '香蕉', '西瓜', '桃子']);
      expect(qNumeric[0].answer_idx).toBe(0);
    });

    it('Tier 2.4: strips slash separators (A/) and hyphen separators (A - ) without dirty punctuation in option text', () => {
      const inputSlash = `
1. 他喜欢吃米饭。
A/ 米饭
B/ 面条
C/ 包子
D/ 饺子
Đáp án: A
      `.trim();

      const qSlash = parseUniversalQuestions(inputSlash);
      expect(qSlash.length).toBe(1);
      expect(qSlash[0].options).toEqual(['米饭', '面条', '包子', '饺子']);
      expect(qSlash[0].answer_idx).toBe(0);

      const inputHyphen = `
1. 他在睡觉。
A - 睡觉
B - 吃饭
C - 喝茶
D - 看电视
Đáp án: A
      `.trim();

      const qHyphen = parseUniversalQuestions(inputHyphen);
      expect(qHyphen.length).toBe(1);
      // Must NOT contain leading '- '
      expect(qHyphen[0].options).toEqual(['睡觉', '吃饭', '喝茶', '看电视']);
      expect(qHyphen[0].options.every((opt) => !opt.startsWith('-'))).toBe(true);
      expect(qHyphen[0].answer_idx).toBe(0);
    });

    it('Tier 2.5: handles irregular line breaks, CRLF (\\r\\n), and 4+ consecutive empty lines', () => {
      const input = "1. 他是老师。\r\n\r\n\r\n\r\nA. 老师\r\n\r\nB. 学生\r\n\r\nC. 医生\r\n\r\nD. 司机\r\n\r\n\r\nĐáp án: A\r\n";

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('他是老师。');
      expect(questions[0].options).toEqual(['老师', '学生', '医生', '司机']);
      expect(questions[0].answer_idx).toBe(0);
    });

    it('Tier 2.6: handles mixed delimiter styles in a single question block', () => {
      const input = `
1. 他在买东西。
A. 苹果
B) 香蕉
C: 西瓜
D、桃子
Đáp án: B
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].options).toEqual(['苹果', '香蕉', '西瓜', '桃子']);
      expect(questions[0].answer_idx).toBe(1);
    });

    it('Tier 2.7: extracts 4 options placed horizontally on a single line', () => {
      const input = `
1. 他去北京。
A. 北京    B. 上海    C. 广州    D. 深圳
Đáp án: A
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].options).toEqual(['北京', '上海', '广州', '深圳']);
      expect(questions[0].answer_idx).toBe(0);
    });

    it('Tier 2.8: extracts options formatted as a 2x2 grid', () => {
      const input = `
1. 他有一只猫。
A. 猫    B. 狗
C. 鸟    D. 鱼
Đáp án: A
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].options).toEqual(['猫', '狗', '鸟', '鱼']);
      expect(questions[0].answer_idx).toBe(0);
    });

    it('Tier 2.9: strips trailing inline answers on the question stem line without leaking into stem text', () => {
      const input = `
**1. 他在学校学习。(Answer: A)**
A. 学习
B. 看书
C. 睡觉
D. 买东西

2. 他是我的好朋友。 [Đáp án: C]
A. 医生
B. 老师
C. 朋友
D. 同学
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(2);

      expect(questions[0].stem).toBe('他在学校学习。');
      expect(questions[0].stem).not.toContain('Answer');
      expect(questions[0].answer_idx).toBe(0);

      expect(questions[1].stem).toBe('他是我的好朋友。');
      expect(questions[1].stem).not.toContain('Đáp án');
      expect(questions[1].answer_idx).toBe(2);
    });

    it('Tier 2.10: strips leading markdown bullet points and cleans parenthesized pinyin from stem', () => {
      const input = `
* Question 1: 他是医生。(yīshēng)
A. 医生
B. 老师
C. 司机
D. 护士
Đáp án: A
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('他是医生。');
      expect(questions[0].stem).not.toContain('*');
      expect(questions[0].stem).not.toContain('yīshēng');
      expect(questions[0].pinyin?.replace(/\s+/g, '')).toContain('yīshēng');
    });
  });

  // ===========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // ===========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('Tier 3.1: captures bottom answer keys with explanation when period immediately follows answer letter (Câu 1: A. Giải thích: ...)', () => {
      const input = `
Câu 1: 他在看书。
A. 学习
B. 看书
C. 睡觉
D. 跑步

Câu 2: 他去商店。
A. 商店
B. 学校
C. 医院
D. 车站

ĐÁP ÁN:
Câu 1: B. Giải thích: Ngữ cảnh xem sách (看书) chọn B.
Câu 2: A. Giải thích: Mua đồ thì đến cửa hàng (商店).
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(2);

      expect(questions[0].answer_idx).toBe(1);
      expect(questions[0].explanation_vi).toContain('Ngữ cảnh xem sách (看书) chọn B.');

      expect(questions[1].answer_idx).toBe(0);
      expect(questions[1].explanation_vi).toContain('Mua đồ thì đến cửa hàng (商店).');
    });

    it('Tier 3.2: resolves text-based answer keys (Đáp án: 苹果) by matching option text string', () => {
      const input = `
1. 桌子上有一个红苹果。
A. 苹果
B. 香蕉
C. 西瓜
D. 桃子
Đáp án: 苹果

2. 他在医院工作。
A. 老师
B. 司机
C. 医生
D. 护士
Đáp án: 医生
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(2);

      expect(questions[0].answer_idx).toBe(0); // 苹果 is option 0
      expect(questions[1].answer_idx).toBe(2); // 医生 is option 2
    });

    it('Tier 3.3: auto-infers correct part_type for 3-option and 5-option fill blanks without schema mismatch', () => {
      const input3Opt = `
1. 他去学校____汉语。
A. 学习
B. 睡觉
C. 吃饭
Đáp án: A
      `.trim();

      const q3 = parseUniversalQuestions(input3Opt, { default_part_type: 'read_fill_blank_4opt' });
      expect(q3.length).toBe(1);
      expect(q3[0].options.length).toBe(3);
      // Remediation must update part_type to match 3 options so Gate 1 passes
      expect(q3[0].part_type).toBe('read_fill_blank_word_bank_3opt');

      const input5Opt = `
1. 我想喝一____水。
A. 杯
B. 个
C. 张
D. 本
E. 只
Đáp án: A
      `.trim();

      const q5 = parseUniversalQuestions(input5Opt, { default_part_type: 'read_fill_blank_4opt' });
      expect(q5.length).toBe(1);
      expect(q5[0].options.length).toBe(5);
      expect(q5[0].part_type).toBe('read_fill_blank_word_bank_5opt');
    });

    it('Tier 3.4: strips embedded option prefixes from JSON imports to prevent double-prefix export bugs', () => {
      const jsonInput = JSON.stringify({
        questions: [
          {
            stem: '他是我的老师。',
            options: ['A. 老师', 'B. 医生', 'C. 司机', 'D. 护士'],
            answer_idx: 0,
            explanation_vi: 'Thầy giáo là 老师.',
            level: 1,
            skill: 'reading',
            part_type: 'read_dialogue_matching_4opt',
          },
          {
            stem: '他去北京旅游。',
            options: ['Option A: 北京', 'Option B: 上海', 'Option C: 广州', 'Option D: 深圳'],
            answer_idx: 0,
            explanation_vi: 'Đi du lịch Bắc Kinh.',
            level: 1,
            skill: 'reading',
            part_type: 'read_dialogue_matching_4opt',
          },
          {
            stem: '桌子上有西瓜。',
            options: ['选项A: 苹果', '选项B: 西瓜', '选项C: 香蕉', '选项D: 桃子'],
            answer_idx: 1,
            explanation_vi: 'Quả dưa hấu là 西瓜.',
            level: 1,
            skill: 'reading',
            part_type: 'read_dialogue_matching_4opt',
          },
        ],
      });

      const questions = parseUniversalQuestions(jsonInput);
      expect(questions.length).toBe(3);

      // Verify prefixes are stripped so options contain ONLY Chinese content
      expect(questions[0].options).toEqual(['老师', '医生', '司机', '护士']);
      expect(questions[1].options).toEqual(['北京', '上海', '广州', '深圳']);
      expect(questions[2].options).toEqual(['苹果', '西瓜', '香蕉', '桃子']);
    });

    it('Tier 3.5: expands conversational answer markers (Chọn đáp án:, Đáp án chính xác là:, Ans:, =>)', () => {
      const input = `
1. 他喜欢吃水果。
A. 苹果
B. 面包
C. 米饭
D. 鸡蛋
Chọn đáp án: A

2. 他在喝水。
A. 喝水
B. 吃饭
C. 睡觉
D. 跑步
Đáp án chính xác là: A

3. 爸爸在看电视。
A. 看书
B. 看电视
C. 听音乐
D. 玩游戏
Ans: B

4. 妈妈去商店。
A. 商店
B. 学校
C. 医院
D. 车站
=> A
      `.trim();

      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(4);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[1].answer_idx).toBe(0);
      expect(questions[2].answer_idx).toBe(1);
      expect(questions[3].answer_idx).toBe(0);
    });
  });

  // ===========================================================================
  // TIER 4: REAL-WORLD INGESTION-TO-EXPORT PIPELINE
  // ===========================================================================
  describe('Tier 4: Real-World Ingestion-to-Export Pipeline', () => {
    it('Tier 4.1: exports ingested AI questions to Excel (.xlsx) with 3 structured sheets and no double prefixes', () => {
      // Ingest AI questions
      const ingested = parseUniversalQuestions(FIXTURE_CHATGPT_COMPREHENSIVE, {
        default_level: 1,
        default_skill: 'reading',
      });
      expect(ingested.length).toBe(2);

      // Export to Excel
      const excelBuf = exportExamToExcel(ingested, 'Đề thi ChatGPT HSK 1');
      expect(Buffer.isBuffer(excelBuf)).toBe(true);
      expect(excelBuf.length).toBeGreaterThan(0);
      expect(excelBuf.subarray(0, 4).toString('hex')).toBe('504b0304'); // PKZip magic bytes

      // Parse workbook and assert sheets
      const wb = XLSX.read(excelBuf, { type: 'buffer' });
      expect(wb.SheetNames).toEqual(['Đề thi HSK', 'Đáp án & Giải thích', 'Ma trận kiến thức']);

      // Sheet 1 checks: verify no double prefixes (e.g. 'A. A. 学习' must NOT exist)
      const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets['Đề thi HSK']) as any[];
      expect(sheet1.length).toBe(2);
      expect(sheet1[0]['Câu hỏi / Ngữ cảnh']).toBe('他在学校学习汉语。');
      expect(sheet1[0]['Đáp án A']).toBe('学习');
      expect(sheet1[0]['Đáp án A']).not.toMatch(/^[A-D]\.\s+[A-D]\./); // No double prefix
      expect(sheet1[0]['Đáp án đúng']).toBe('A. 学习');

      // Sheet 2 checks
      const sheet2 = XLSX.utils.sheet_to_json(wb.Sheets['Đáp án & Giải thích']) as any[];
      expect(sheet2.length).toBe(2);
      expect(sheet2[0]['Giải thích chi tiết & Dịch nghĩa']).toContain('Trong câu có từ 学校');
    });

    it('Tier 4.2: exports ingested AI questions to Word (.docx) with valid OpenXML PKZip archive and answer table', () => {
      const ingested = parseUniversalQuestions(FIXTURE_CLAUDE_COMPREHENSIVE, {
        default_level: 1,
        default_skill: 'reading',
      });
      expect(ingested.length).toBe(2);

      const wordBuf = exportExamToWord(ingested, 'Đề thi Claude HSK 1', {
        duration_minutes: 35,
        include_answers: true,
        include_explanations: true,
      });

      expect(Buffer.isBuffer(wordBuf)).toBe(true);
      expect(wordBuf.length).toBeGreaterThan(0);
      expect(wordBuf.subarray(0, 4).toString('hex')).toBe('504b0304'); // Valid PKZip (.docx)

      // Extract and verify text
      const docxText = extractDocxTextFromBuffer(wordBuf);
      expect(docxText).toContain('HỆ THỐNG LUYỆN THI HÁN NGỮ MINNESE');
      expect(docxText).toContain('Đề thi Claude HSK 1');
      expect(docxText).toContain('他是我的好朋友');
      expect(docxText).toContain('我们在图书馆看书');
      expect(docxText).toContain('BẢNG ĐÁP ÁN & GIẢI THÍCH CHI TIẾT');
      // Verify options in Word do not have double prefixes
      expect(docxText).not.toContain('A. A.');
      expect(docxText).not.toContain('B. B.');
    });

    it('Tier 4.3: guarantees 100% roundtrip fidelity for JSON schema: import(export(Q)) === Q', () => {
      const ingested = parseUniversalQuestions(FIXTURE_NON_STANDARD_OPTION_LABELS, {
        default_level: 1,
        default_skill: 'reading',
      });
      expect(ingested.length).toBe(4);

      // Export to JSON v2.0
      const jsonString = exportExamToJson(ingested, {
        title: 'Đề thi Non-Standard HSK 1',
        level: 1,
      });

      const parsedJson = JSON.parse(jsonString);
      expect(parsedJson.$schema).toBe('https://minnese.edu.vn/schemas/hsk-exam-v2.json');
      expect(parsedJson.version).toBe('2.0.0');
      expect(parsedJson.questions.length).toBe(4);

      // Re-import and verify 100% field preservation
      const roundtripped = parseUniversalQuestions(jsonString, { default_level: 1 });
      expect(roundtripped.length).toBe(4);

      for (let i = 0; i < ingested.length; i++) {
        expect(roundtripped[i].stem).toBe(ingested[i].stem);
        expect(roundtripped[i].options).toEqual(ingested[i].options);
        expect(roundtripped[i].answer_idx).toBe(ingested[i].answer_idx);
        expect(roundtripped[i].level).toBe(ingested[i].level);
      }
    });

    it('Tier 4.4: passes Gate 1 (Schema & bounds) in evaluateCandidateSixGates for all 7 remediated fixtures', () => {
      const allFixtures = [
        FIXTURE_CHATGPT_COMPREHENSIVE,
        FIXTURE_CLAUDE_COMPREHENSIVE,
        FIXTURE_GEMINI_COMPREHENSIVE,
        FIXTURE_TEACHER_ANOMALIES_PACK,
        FIXTURE_NON_STANDARD_OPTION_LABELS,
        FIXTURE_BOTTOM_ANSWER_KEY_WITH_EXPLANATIONS,
        FIXTURE_TRUE_FALSE_AND_BLANKS,
      ];

      for (const fix of allFixtures) {
        const questions = parseUniversalQuestions(fix, { default_level: 1 });
        expect(questions.length).toBeGreaterThanOrEqual(2);

        for (const q of questions) {
          const evalResult = evaluateCandidateSixGates(q, [], { lenientImport: true });
          // Gate 1 (Schema & Bounds) MUST strictly pass
          expect(evalResult.gate1_schema.passed).toBe(true);
          // Stem must have Hanzi and non-empty
          expect(q.stem.length).toBeGreaterThanOrEqual(2);
          // Options must have at least 2 items
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          // answer_idx must be in valid range
          expect(q.answer_idx).toBeGreaterThanOrEqual(0);
          expect(q.answer_idx).toBeLessThan(q.options.length);
          // Options must not contain embedded option labels
          for (const opt of q.options) {
            expect(opt).not.toMatch(/^[A-Da-d]\.\s+/);
            expect(opt).not.toMatch(/^Option\s+[A-D]:/i);
            expect(opt).not.toMatch(/^选项[A-D]:/i);
          }
        }
      }
    });
  });
});
