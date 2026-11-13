/**
 * =============================================================================
 * Adversarial Challenger 2 Test Suite: AI Edge Cases & Systemic Stress Test
 *
 * Challenger: challenger_ai_input_2 (teamwork_challenger)
 * Scope:
 * 1. Model-Specific Stress Vectors:
 *    - ChatGPT: Raw markdown with nested lists, bold numbers, code blocks, conversational intro/outro.
 *    - Claude: Multi-paragraph questions, dialogue passages (A: ... B: ... 问: ...), mixed lowercase options.
 *    - Gemini: Numbered lists with conversational pleasantries, Markdown tables with questions and options.
 *    - DeepSeek / Grok / Local LLM: Vietnamese-Chinese mixed questions, LaTeX markers, unescaped quotes.
 * 2. Six Quality Gates Stress Testing:
 *    - evaluateCandidateSixGates with { lenientImport: true } vs { lenientImport: false }.
 * 3. Roundtrip JSON Serialization:
 *    - exportExamToJson followed by parseUniversalQuestions (zero information degradation).
 * =============================================================================
 */

import { describe, it, expect } from 'vitest';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';
import { exportExamToJson } from '../src/server/examExportService.js';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

describe('Challenger AI Input 2: Adversarial Stress Test Suite', () => {

  // ===========================================================================
  // Vector 1: ChatGPT Stress Vectors
  // ===========================================================================
  describe('Vector 1: ChatGPT Edge Cases', () => {
    it('1.1 should parse nested markdown lists with bold numbers and conversational intro/outro', () => {
      const input = `
Xin chào! Dưới đây là các câu hỏi luyện thi HSK 1 mà bạn đã yêu cầu:

* **1.** 他在学校学习汉语。
  * A. 学习
  * B. 看书
  * C. 睡觉
  * D. 买东西
  * **Đáp án:** A
  * **Giải thích:** Trong câu có từ 学校 (trường học), từ phù hợp nhất là 学习.

* **2.** 桌子上有一个大西瓜。
  * A. 苹果
  * B. 西瓜
  * C. 米饭
  * D. 飞机
  * **Đáp án:** B
  * **Giải thích:** 西瓜 là quả dưa hấu.

Hy vọng các câu hỏi này hữu ích cho bạn! Chúc bạn dạy tốt!
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(2);

      // Q1 verification
      expect(results[0].stem).toContain('他在学校学习汉语');
      expect(results[0].options).toEqual(['学习', '看书', '睡觉', '买东西']);
      expect(results[0].answer_idx).toBe(0);
      expect(results[0].explanation_vi).toContain('trường học');

      // Q2 verification
      expect(results[1].stem).toContain('桌子上有一个大西瓜');
      expect(results[1].options).toEqual(['苹果', '西瓜', '米饭', '飞机']);
      expect(results[1].answer_idx).toBe(1);
    });

    it('1.2 should parse questions encapsulated inside markdown code block with conversational framing', () => {
      const input = `
Here is the exam content formatted in markdown:

\`\`\`markdown
1. 妈妈在厨房做饭。
A. 做饭
B. 洗衣服
C. 睡觉
D. 看书
Đáp án: A
Giải thích: 厨房 là nhà bếp, hành động tương ứng là 做饭.

2. 爸爸去医院看病。
A. 商店
B. 医院
C. 学校
D. 车站
Đáp án: B
Giải thích: 看病 (khám bệnh) diễn ra ở 医院 (bệnh viện).
\`\`\`

Let me know if you need adjustments!
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(2);
      expect(results[0].options).toHaveLength(4);
      expect(results[0].answer_idx).toBe(0);
      expect(results[1].options).toHaveLength(4);
      expect(results[1].answer_idx).toBe(1);
    });

    it('1.3 evaluates limitation on multiple separate markdown code blocks (only first block extracted)', () => {
      const input = [
        'Phần 1:',
        '```text',
        '1. 他是我的好朋友。',
        'A. 朋友',
        'B. 老师',
        'C. 医生',
        'D. 同学',
        'Đáp án: A',
        '```',
        '',
        'Phần 2:',
        '```text',
        '2. 我们在图书馆看书。',
        'A. 车站',
        'B. 医院',
        'C. 图书馆',
        'D. 电影院',
        'Đáp án: C',
        '```'
      ].join('\n');

      const results = parseUniversalQuestions(input, { default_level: 1 });
      // Empirical verification: current implementation matches the first code fence only
      expect(results.length).toBe(1);
      expect(results[0].stem).toContain('他是我的好朋友');
    });
  });

  // ===========================================================================
  // Vector 2: Claude Stress Vectors
  // ===========================================================================
  describe('Vector 2: Claude Edge Cases', () => {
    it('2.1 should parse dialogue passage with speaker turns and question stem', () => {
      const input = `
1. A: 你好！
B: 你好！很高兴认识你。
问：他们在做什么？
A) 说话
B) 睡觉
C) 吃饭
D) 看书
Answer: A
Explanation: Cả hai người đang chào hỏi nhau (说话).
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(1);
      const q = results[0];

      // Stem should contain the dialogue and question
      expect(q.stem).toContain('你好');
      expect(q.stem).toContain('他们在做什么');
      // Options should NOT be contaminated by speaker turns A: or B:
      expect(q.options).toEqual(['说话', '睡觉', '吃饭', '看书']);
      expect(q.answer_idx).toBe(0);
      expect(q.explanation_vi).toContain('chào hỏi');
    });

    it('2.2 should parse lowercase options with mixed delimiter styles (a), b), c), d))', () => {
      const input = `
Question 1: 他喜欢喝茶。
a) 喝茶
b) 喝水
c) 吃饭
d) 睡觉
Answer: a
Explanation: Câu nói về sở thích uống trà (喝茶).

Question 2: 姐姐去商店买苹果。
a. 苹果
b. 香蕉
c. 衣服
d. 书
Answer: a
Explanation: Mua táo (苹果).
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(2);
      expect(results[0].options).toEqual(['喝茶', '喝水', '吃饭', '睡觉']);
      expect(results[0].answer_idx).toBe(0);
      expect(results[1].options).toEqual(['苹果', '香蕉', '衣服', '书']);
      expect(results[1].answer_idx).toBe(0);
    });

    it('2.3 should parse dialogue with Chinese speaker names (男:, 女:)', () => {
      const input = `
1. 男：请问，图书馆在哪儿？
女：在学校前面。
问：男的要去哪儿？
A. 学校
B. 图书馆
C. 医院
D. 商店
Answer: B
Explanation: Người nam hỏi đường đến thư viện (图书馆).
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(1);
      expect(results[0].options).toEqual(['学校', '图书馆', '医院', '商店']);
      expect(results[0].answer_idx).toBe(1);
      expect(results[0].part_type).toBe('listen_dialogue_qa_4opt');
    });

    it('2.4 evaluates limitation on standalone passage before Question 1 (passage discarded if detached)', () => {
      const input = [
        'Passage:',
        '今天天气很好。我和朋友一起去公园散步。',
        '公园里有很多漂亮的花，还有很多人在跑步。',
        '',
        'Question 1: 他们去哪里了？',
        'A. 学校',
        'B. 公园',
        'C. 医院',
        'D. 商店',
        'Answer: B'
      ].join('\n');

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(1);
      // Demonstrates that detached passage before Question 1 is not captured into stem or passage
      expect(results[0].stem).toBe('他们去哪里了？');
      expect(results[0].passage).toBeUndefined();
    });
  });

  // ===========================================================================
  // Vector 3: Gemini Stress Vectors
  // ===========================================================================
  describe('Vector 3: Gemini Edge Cases', () => {
    it('3.1 should parse numbered list with pleasantries and bolded option tokens', () => {
      const input = `
Certainly! Here is the quiz you requested:

1. 他今天很高兴。
* **A)** 高兴
* **B)** 生气
* **C)** 难过
* **D)** 累
* **Answer:** A
* **Explanation:** 高兴 có nghĩa là vui vẻ.

2. 妹妹在房间睡觉。
* **A.** 睡觉
* **B.** 做饭
* **C.** 看电视
* **D.** 学习
* **Answer:** A
* **Explanation:** 睡觉 có nghĩa là ngủ.

Hope this helps! Let me know if you need anything else.
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(2);
      expect(results[0].options).toEqual(['高兴', '生气', '难过', '累']);
      expect(results[0].answer_idx).toBe(0);
      expect(results[1].options).toEqual(['睡觉', '做饭', '看电视', '学习']);
      expect(results[1].answer_idx).toBe(0);
    });

    it('3.2 evaluates empirical behavior on markdown tables with questions and options', () => {
      const tableInput = [
        '| Câu | Câu hỏi | A | B | C | D | Đáp án | Giải thích |',
        '|---|---|---|---|---|---|---|---|',
        '| 1 | 他在学校____汉语。 | 学习 | 看书 | 睡觉 | 买东西 | A | Ở trường học thì học tập |',
        '| 2 | 桌子上有一个大____。 | 苹果 | 西瓜 | 米饭 | 飞机 | B | 西瓜 là dưa hấu |'
      ].join('\n');

      const results = parseUniversalQuestions(tableInput, { default_level: 1 });

      // Empirical challenger finding: Markdown table rows are NOT parsed as individual questions
      // The parser combines table text into 1 candidate with malformed options containing pipe characters
      expect(results.length).toBe(1);
      expect(results[0].options.some(opt => opt.includes('|'))).toBe(true);

      // Downstream, Gate 1 correctly detects schema violations and rejects the malformed table candidate
      const gateEvaluation = evaluateCandidateSixGates(results[0], [], { lenientImport: true });
      expect(gateEvaluation.gate1_schema.passed).toBe(false);
      expect(gateEvaluation.allPassed).toBe(false);
    });
  });

  // ===========================================================================
  // Vector 4: DeepSeek / Grok / Local LLM Stress Vectors
  // ===========================================================================
  describe('Vector 4: DeepSeek / Grok / Local LLM Edge Cases', () => {
    it('4.1 should parse Vietnamese-Chinese bilingual prompt with explanatory parenthetical translations', () => {
      const input = `
Câu 1: Chọn từ thích hợp điền vào chỗ trống: 他在学校____汉语。(Anh ấy ở trường học tiếng Trung.)
A. 学习 (học tập)
B. 看书 (đọc sách)
C. 睡觉 (ngủ)
D. 买东西 (mua đồ)
Đáp án: A
Giải thích: Động từ "学习" phù hợp với ngữ cảnh "ở trường học tiếng Trung".
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(1);
      const q = results[0];
      expect(q.stem).toContain('他在学校');
      expect(q.stem).toContain('____');
      expect(q.options[0]).toContain('学习');
      expect(q.options[1]).toContain('看书');
      expect(q.options[2]).toContain('睡觉');
      expect(q.options[3]).toContain('买东西');
      expect(q.answer_idx).toBe(0);
    });

    it('4.2 should parse question stems containing LaTeX math markers ($x$, $3$)', () => {
      const input = `
1. 桌子上有 $3$ 个苹果。
A. $1$ 个
B. $2$ 个
C. $3$ 个
D. $4$ 个
Answer: C
Explanation: Trong câu nêu rõ số lượng là $3$ 个苹果.
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(1);
      expect(results[0].stem).toContain('桌子上有');
      expect(results[0].options).toHaveLength(4);
      expect(results[0].answer_idx).toBe(2);
    });

    it('4.3 should handle unescaped quotes in dialogue quotes in raw text without crashing', () => {
      const input = `
1. 妈妈说："今天晚上吃"饺子"。"
A. 米饭
B. 饺子
C. 面条
D. 包子
Answer: B
Explanation: Mẹ nói ăn sủi cảo (饺子).
      `.trim();

      const results = parseUniversalQuestions(input, { default_level: 1 });
      expect(results.length).toBe(1);
      expect(results[0].options).toEqual(['米饭', '饺子', '面条', '包子']);
      expect(results[0].answer_idx).toBe(1);
    });
  });

  // ===========================================================================
  // Vector 5: Six Quality Gates Boundary Stress Testing
  // ===========================================================================
  describe('Vector 5: Six Quality Gates (evaluateCandidateSixGates)', () => {
    it('5.1 should pass all 6 gates in both lenient and strict modes for canonical HSK 1 question', () => {
      const canonicalQ: CandidateQuestion = {
        stem: '他在学校____汉语。',
        options: ['学习', '看书', '睡觉', '买东西'],
        answer_idx: 0,
        explanation_vi: 'Đáp án A: 学习 (học tập) phù hợp với ngữ cảnh ở trường học.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const evalStrict = evaluateCandidateSixGates(canonicalQ, [], { lenientImport: false });
      const evalLenient = evaluateCandidateSixGates(canonicalQ, [], { lenientImport: true });

      // In lenient mode, core gates (1, 2, 5) must pass
      expect(evalLenient.gate1_schema.passed).toBe(true);
      expect(evalLenient.gate2_explanation.passed).toBe(true);
      expect(evalLenient.gate5_uniqueness.passed).toBe(true);
      expect(evalLenient.allPassed).toBe(true);

      // Core gates also pass in strict mode
      expect(evalStrict.gate1_schema.passed).toBe(true);
      expect(evalStrict.gate5_uniqueness.passed).toBe(true);
    });

    it('5.2 should pass in lenientImport: true but fail Gate 4 (Distractor POS mismatch) in lenientImport: false', () => {
      // Question where target is verb (研究) but distractors are mixed POS (苹果: noun, 非常: adverb)
      const mixedPosQ: CandidateQuestion = {
        stem: '他正在全面深入地____这项复杂的政策。',
        options: ['研究', '苹果', '非常', '在'],
        answer_idx: 0,
        explanation_vi: 'Đáp án A: 研究 là động từ phù hợp với câu.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const evalStrict = evaluateCandidateSixGates(mixedPosQ, [], { lenientImport: false });
      const evalLenient = evaluateCandidateSixGates(mixedPosQ, [], { lenientImport: true });

      // In lenient mode: Gate 1, 2, and 5 pass -> allPassed is true
      expect(evalLenient.gate1_schema.passed).toBe(true);
      expect(evalLenient.gate5_uniqueness.passed).toBe(true);
      expect(evalLenient.allPassed).toBe(true);

      // In strict mode: Gate 4 distractor POS mismatch blocks allPassed
      expect(evalStrict.allPassed).toBe(false);
      expect(evalStrict.gate4_distractor_quality.passed).toBe(false);
      expect(evalStrict.gate4_distractor_quality.details).toContain('苹果');
    });

    it('5.3 should fail Gate 3 (Vocab Syllabus) when strictLevel: true is enforced', () => {
      const advancedVocabQ: CandidateQuestion = {
        stem: '他正在全面深入地____这项复杂的国际贸易经济政策。',
        options: ['研究', '分析', '讨论', '报告'],
        answer_idx: 0,
        explanation_vi: 'Đáp án A: 研究 là từ phù hợp.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const evalStrictLevel = evaluateCandidateSixGates(advancedVocabQ, [], { lenientImport: false, strictLevel: true });
      expect(evalStrictLevel.gate3_vocab_coverage.passed).toBe(false);
      expect(evalStrictLevel.allPassed).toBe(false);
    });

    it('5.4 should reject candidate when Gate 1 (Schema / Option count) fails even in lenientImport: true', () => {
      // Only 1 option provided (invalid schema)
      const invalidSchemaQ: Partial<CandidateQuestion> = {
        stem: '他在学校学习。',
        options: ['学习'],
        answer_idx: 0,
        explanation_vi: 'Chỉ có 1 lựa chọn.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const evalLenient = evaluateCandidateSixGates(invalidSchemaQ, [], { lenientImport: true });
      expect(evalLenient.gate1_schema.passed).toBe(false);
      expect(evalLenient.allPassed).toBe(false);
    });

    it('5.5 should reject candidate when Gate 5 (Uniqueness / Duplicate) fails even in lenientImport: true', () => {
      const q: CandidateQuestion = {
        stem: '他在学校学习汉语。',
        options: ['学习', '看书', '睡觉', '买东西'],
        answer_idx: 0,
        explanation_vi: 'Giải thích câu.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      // Existing stem matches this stem exactly
      const existingStems = ['他在学校学习汉语。'];

      const evalLenient = evaluateCandidateSixGates(q, existingStems, { lenientImport: true });
      expect(evalLenient.gate5_uniqueness.passed).toBe(false);
      expect(evalLenient.allPassed).toBe(false);
    });
  });

  // ===========================================================================
  // Vector 6: Roundtrip JSON Serialization & Zero Information Degradation
  // ===========================================================================
  describe('Vector 6: Roundtrip JSON Serialization & Zero Information Degradation', () => {
    it('6.1 should serialize full candidate questions via exportExamToJson and re-parse with 100% field fidelity', () => {
      const originalQuestions: CandidateQuestion[] = [
        {
          id: 'q_hsk1_001',
          stem: '桌子上有两个____。',
          pinyin: 'Zhuōzi shang yǒu liǎng ge ____.',
          passage: '我家有一张大桌子。',
          options: ['苹果', '香蕉', '杯子', '衣服'],
          answer_idx: 0,
          explanation_vi: 'Đáp án A: 苹果 (quả táo) kết hợp với lượng từ 个.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          topic: 'daily_life',
          target_grammar: '量词 + 名词',
          tested_vocab: ['桌子', '苹果', '个'],
          difficulty_tier: 'tier1_difficult',
          trap_type: 'distractor_pos',
          illustration_theme: 'classroom',
          options_images: ['img1.png', 'img2.png', 'img3.png', 'img4.png'],
        },
        {
          id: 'q_hsk1_002',
          stem: '他们去医院看病。',
          pinyin: 'Tāmen qù yīyuàn kànbìng.',
          options: ['对', '错'],
          answer_idx: 0,
          explanation_vi: 'Đáp án Đúng: Đi bệnh viện để khám bệnh.',
          level: 1,
          skill: 'reading',
          part_type: 'read_true_false_2opt',
          topic: 'health',
        },
      ];

      // Export to standard Minnese JSON
      const jsonExport = exportExamToJson(originalQuestions, { title: 'HSK 1 Test Exam' });
      expect(typeof jsonExport).toBe('string');
      expect(jsonExport).toContain('https://minnese.edu.vn/schemas/hsk-exam-v2.json');

      // Re-parse exported JSON using parseUniversalQuestions
      const reParsedQuestions = parseUniversalQuestions(jsonExport);
      expect(reParsedQuestions.length).toBe(originalQuestions.length);

      // Verify Question 1 field preservation
      const q1 = reParsedQuestions[0];
      const orig1 = originalQuestions[0];
      expect(q1.id).toBe(orig1.id);
      expect(q1.stem).toBe(orig1.stem);
      expect(q1.pinyin).toBe(orig1.pinyin);
      expect(q1.passage).toBe(orig1.passage);
      expect(q1.options).toEqual(orig1.options);
      expect(q1.answer_idx).toBe(orig1.answer_idx);
      expect(q1.explanation_vi).toBe(orig1.explanation_vi);
      expect(q1.level).toBe(orig1.level);
      expect(q1.skill).toBe(orig1.skill);
      expect(q1.part_type).toBe(orig1.part_type);
      expect(q1.topic).toBe(orig1.topic);
      expect(q1.target_grammar).toBe(orig1.target_grammar);
      expect(q1.tested_vocab).toEqual(orig1.tested_vocab);
      expect(q1.difficulty_tier).toBe(orig1.difficulty_tier);
      expect(q1.trap_type).toBe(orig1.trap_type);
      expect(q1.illustration_theme).toBe(orig1.illustration_theme);
      expect(q1.options_images).toEqual(orig1.options_images);

      // Verify Question 2 field preservation
      const q2 = reParsedQuestions[1];
      const orig2 = originalQuestions[1];
      expect(q2.id).toBe(orig2.id);
      expect(q2.stem).toBe(orig2.stem);
      expect(q2.options).toEqual(orig2.options);
      expect(q2.answer_idx).toBe(orig2.answer_idx);
      expect(q2.explanation_vi).toBe(orig2.explanation_vi);
      expect(q2.part_type).toBe(orig2.part_type);
    });

    it('6.2 should ensure that JSON options with pre-existing letter prefixes do not double-prefix upon roundtrip', () => {
      // Sometimes an external JSON has options already prefixed with 'A. '
      const jsonWithPrefixes = JSON.stringify({
        $schema: 'https://minnese.edu.vn/schemas/hsk-exam-v2.json',
        questions: [
          {
            stem: '他在学校____汉语。',
            options: ['A. 学习', 'B. 看书', 'C. 睡觉', 'D. 买东西'],
            answer_idx: 0,
            explanation_vi: 'Giải thích A',
          },
        ],
      });

      const parsed = parseUniversalQuestions(jsonWithPrefixes);
      expect(parsed[0].options).toEqual(['学习', '看书', '睡觉', '买东西']);

      // Export again and ensure options remain clean
      const reExported = exportExamToJson(parsed);
      const reParsed = parseUniversalQuestions(reExported);
      expect(reParsed[0].options).toEqual(['学习', '看书', '睡觉', '买东西']);
    });
  });
});
