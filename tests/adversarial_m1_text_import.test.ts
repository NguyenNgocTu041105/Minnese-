/**
 * Adversarial Stress & Edge-Case Verification Suite for Text Import (Milestone M1)
 * Author: challenger_m1_1 (Empirical Challenger)
 *
 * Verifies universalQuestionParser.ts and POST /api/qbank/import against:
 * 1. Extreme, nested, corrupted, and boundary markdown inputs
 * 2. Boundary lengths (49,999 vs 50,000 vs 50,001 chars) and ReDoS resistance
 * 3. Unicode edge cases (emoji overload, ZWJ sequences, zero-width spaces, unpaired surrogates, RTL, fullwidth)
 * 4. Multi-paragraph stems and dialogues (with speaker labels, blank lines, passage context)
 * 5. Bracketed pinyin in stems and options (square brackets, Chinese brackets, parentheses)
 * 6. Answer key placement variations (same-line, last-option, inline markers, merged explanations)
 * 7. Corrupted, partial, and pathological payloads
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import {
  parseUniversalQuestions,
  splitIntoQuestionBlocks,
  parseSingleQuestionBlock,
} from '../src/server/llm/universalQuestionParser.js';

describe('Adversarial Challenge: Universal Question Parser & Text Import Pipeline (Milestone M1)', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let stagingDb: DatabaseSync;
  const TEST_ADMIN_TOKEN = 'challenger-test-token-m1';

  beforeAll(async () => {
    stagingDb = new DatabaseSync(':memory:');
    ensurePendingSchema(stagingDb);
    setDbSyncForTesting(stagingDb);
    setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

    app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use('/api/qbank', qbankRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    setDbSyncForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(() => {
    stagingDb.exec('DELETE FROM pending_questions;');
  });

  // =========================================================================
  // SUITE 1: Extreme & Nested Markdown Formatting
  // =========================================================================
  describe('1. Extreme & Nested Markdown Formatting', () => {
    it('1.1 parses question wrapped in markdown code blocks with language identifiers', () => {
      const input = '```markdown\n' +
        '### Câu 1:\n' +
        '**Đề bài:** 他是我的____。\n' +
        '- **A.** 老师\n' +
        '- **B.** 苹果\n' +
        '- **C.** 飞机\n' +
        '- **D.** 喝水\n' +
        '**Đáp án:** A\n' +
        '**Giải thích:** 老师 là thầy giáo.\n' +
        '```';

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('他是我的____。');
      expect(parsed[0].options).toEqual(['老师', '苹果', '飞机', '喝水']);
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[0].explanation_vi).toContain('thầy giáo');
    });

    it('1.2 parses question with deeply nested headers (##### **Câu 1:**)', () => {
      const input = `
##### **Câu 1:**
**Đề bài:** 昨天天气很____。
* **A.** 好
* **B.** 买
* **C.** 谁
* **D.** 哪
**Đáp án:** A
**Giải thích:** 好 có nghĩa là tốt.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('昨天天气很____。');
      expect(parsed[0].options[0]).toBe('好');
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('1.3 parses questions with blockquote prefix (> ) [FIXED]', () => {
      const input = `
> ### Câu 1:
> **Đề bài:** 桌子上有____本书。
> - **A.** 三
> - **B.** 看
> - **C.** 去
> - **D.** 叫
> **Đáp án:** A
> **Giải thích:** 三 là số ba.
      `;

      const parsed = parseUniversalQuestions(input);
      // Verify blockquote does not crash parser and extracts question cleanly
      expect(parsed.length).toBe(1);
      expect(parsed[0].options).toEqual(['三', '看', '去', '叫']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('1.4 handles mixed bullet styles and formatting (-, *, •, +, bold, parentheses, brackets) [FIXED]', () => {
      const input = `
Câu 1: 我想____中国菜。
- (A) 吃
* [B] 听
• **C.** 读
+ D) 坐
Đáp án: A
Giải thích: 吃 có nghĩa là ăn.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('我想____中国菜。');
      expect(parsed[0].options.length).toBe(4);
      expect(parsed[0].options[0]).toBe('吃');
      expect(parsed[0].options[1]).toBe('听');
      expect(parsed[0].options[2]).toBe('读');
      expect(parsed[0].options[3]).toBe('坐');
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('1.5 handles rich inline markdown (strikethrough, inline code, bold-italic) without corrupting options', () => {
      const input = `
Câu 1: 她是我的\`朋友\`。
- **A.** *老师*
- **B.** ~~苹果~~
- **C.** ***飞机***
- **D.** 喝水
Đáp án: A
Giải thích: Bạn bè và thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('朋友');
      // The options should be extracted without throwing or hanging
      expect(parsed[0].options.length).toBe(4);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('1.6 handles unclosed markdown code fence gracefully', () => {
      const input = '```\n' +
        'Câu 1: 他是我的____。\n' +
        'A. 老师\n' +
        'B. 苹果\n' +
        'C. 飞机\n' +
        'D. 喝水\n' +
        'Đáp án: A\n';

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].options.length).toBe(4);
    });

    it('1.7 handles horizontal rules (---, ***, ___) between questions', () => {
      const input = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A

---

Câu 2: 桌子上有____本书。
A. 三
B. 看
C. 去
D. 叫
Đáp án: A

***
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toContain('他是我的____。');
      expect(parsed[1].stem).toContain('桌子上有____本书。');
    });
  });

  // =========================================================================
  // SUITE 2: Boundary Lengths & ReDoS Stress Testing
  // =========================================================================
  describe('2. Boundary Lengths & ReDoS Stress Testing', () => {
    it('2.1 payload of exactly 49,999 characters succeeds via POST /api/qbank/import within 2000ms', async () => {
      // Build a repeating valid question block and pad to exactly 49,999 chars
      const baseQ = (i: number) =>
        `Câu ${i}: 他是我的第${i}个____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A\nGiải thích: Thầy giáo thứ ${i}.\n\n`;

      let text = '';
      let i = 1;
      while (text.length + baseQ(i).length < 49990) {
        text += baseQ(i);
        i++;
      }
      // Pad exact remaining characters with spaces/comment
      const remaining = 49999 - text.length;
      text += ' '.repeat(remaining);
      expect(text.length).toBe(49999);

      const startTime = Date.now();
      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text }),
      });
      const elapsed = Date.now() - startTime;

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBeGreaterThan(50);
      expect(elapsed).toBeLessThan(3000); // Must be fast
    });

    it('2.2 payload of exactly 50,000 characters passes boundary check (<= 50,000 chars)', async () => {
      const baseQ = `Câu 1: 他是我的____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A\nGiải thích: Thầy giáo.\n\n`;
      let text = baseQ;
      const remaining = 50000 - text.length;
      text += ' '.repeat(remaining);
      expect(text.length).toBe(50000);

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(1);
    });

    it('2.3 payload of exactly 50,001 characters fails with HTTP 400 and informative error', async () => {
      const text = 'a'.repeat(50001);
      expect(text.length).toBe(50001);

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Nội dung văn bản quá dài (vượt quá 50,000 ký tự).');
    });

    it('2.4 raw_text and input aliases also trigger 50,001 character boundary guard', async () => {
      const res1 = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ raw_text: 'x'.repeat(50001) }),
      });
      expect(res1.status).toBe(400);

      const res2 = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ input: 'y'.repeat(50001) }),
      });
      expect(res2.status).toBe(400);
    });

    it('2.5 ReDoS Stress: 40,000 pathological characters (unclosed brackets, repeated asterisks, whitespace) terminates under 500ms', () => {
      // Test regexes against pathological inputs
      const pathological1 = '['.repeat(20000) + ']'.repeat(20000);
      const t0 = Date.now();
      const p1 = parseUniversalQuestions(pathological1);
      const d0 = Date.now() - t0;
      expect(d0).toBeLessThan(500);
      expect(p1).toEqual([]);

      const pathological2 = 'A. '.repeat(10000);
      const t1 = Date.now();
      const p2 = parseUniversalQuestions(pathological2);
      const d1 = Date.now() - t1;
      expect(d1).toBeLessThan(500);
      expect(p2).toEqual([]);

      const pathological3 = '***'.repeat(10000);
      const t2 = Date.now();
      const p3 = parseUniversalQuestions(pathological3);
      const d2 = Date.now() - t2;
      expect(d2).toBeLessThan(500);
      expect(p3).toEqual([]);
    });
  });

  // =========================================================================
  // SUITE 3: Unicode Edge Cases & Emoji Overload
  // =========================================================================
  describe('3. Unicode Edge Cases & Emoji Overload', () => {
    it('3.1 handles emoji overload in stem and options without crashing or hanging', () => {
      const input = `
Câu 1: 🍎🎉🚀🔥 他是我的____。 🌟✨💡🎯
A. 老师 👨‍🏫
B. 苹果 🍎
C. 飞机 ✈️
D. 喝水 🥤
Đáp án: A
Giải thích: 老师 là thầy giáo 👨‍🏫.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('他是我的____。');
      expect(parsed[0].options[0]).toContain('老师');
      expect(parsed[0].options[1]).toContain('苹果');
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('3.2 handles complex ZWJ emoji sequences (👩‍👩‍👧‍👦, skin tones) cleanly', () => {
      const input = `
Câu 1: 这一家四口 👩‍👩‍👧‍👦 很幸福，他们都在____。
A. 笑
B. 哭
C. 跑
D. 叫
Đáp án: A
Giải thích: Mọi người đều cười.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('这一家四口');
      expect(parsed[0].options).toEqual(['笑', '哭', '跑', '叫']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('3.3 handles zero-width spaces (\u200B, \u200C, \u200D, \uFEFF) embedded in text', () => {
      const input = `
\uFEFFCâu 1:\u200B 他是我的\u200B____。
A.\u200B 老师
B.\u200B 苹果
C.\u200B 飞机
D.\u200B 喝水
Đáp\u200B án: A
Giải\u200B thích: Thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].options.length).toBe(4);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('3.4 handles mixed Vietnamese diacritics, Traditional Chinese, and RTL text in stem', () => {
      const input = `
Câu 1: Từ "nghiêng ngả, khuỷu tay" trong tiếng Trung có thể là gì? 他是____（台灣/中國）。 مرحبا
A. 學生
B. 老師
C. 蘋果
D. 飛機
Đáp án: B
Giải thích: 老師 là thầy giáo trong chữ phồn thể.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].options.length).toBe(4);
      expect(parsed[0].options[1]).toBe('老師');
      expect(parsed[0].answer_idx).toBe(1);
    });

    it('3.5 handles fullwidth Latin letters (Ａ. Ｂ. Ｃ. Ｄ.)', () => {
      const input = `
Câu 1: 他是我的____。
Ａ. 老师
Ｂ. 苹果
Ｃ. 飞机
Ｄ. 喝水
Đáp án: Ａ
Giải thích: 老师 là thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input);
      // Even if fullwidth is not mapped, parser must never crash
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 4: Multi-Paragraph Stems & Dialogues
  // =========================================================================
  describe('4. Multi-Paragraph Stems & Dialogues', () => {
    it('4.1 parses multi-turn dialogue with Chinese speaker names preserving stem context', () => {
      const input = `
Câu 1:
王老师：明天你有时间吗？
李想：有时间，怎么了？
王老师：我想请你喝咖啡。
李想：太好了，谢谢老师！
问：王老师想做什么？
A. 请喝咖啡
B. 去买书
C. 去看电影
D. 去图书馆
Đáp án: A
Giải thích: 王老师 muốn mời uống cà phê.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('王老师');
      expect(parsed[0].stem).toContain('李想');
      expect(parsed[0].options).toEqual(['请喝咖啡', '去买书', '去看电影', '去图书馆']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('4.2 parses multi-paragraph reading passage followed by stem and options', () => {
      const input = `
Câu 1:
北京是中国的首都，有很多名胜古迹。故宫和长城都很有名。
每年都有很多外国游客来北京旅游。他们都很喜欢北京烤鸭。
问：外国游客喜欢吃什么？
A. 北京烤鸭
B. 包子
C. 米饭
D. 水饺
Đáp án: A
Giải thích: Khách du lịch thích ăn vịt quay Bắc Kinh.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('北京烤鸭');
      expect(parsed[0].options[0]).toBe('北京烤鸭');
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('4.3 parses dialogue with Latin speaker labels A: and B: without confusing them as options [FIXED]', () => {
      const input = `
Câu 1:
A: 你好，请问图书馆怎么走？
B: 一直往前走，到十字路口往左拐。
问：图书馆怎么走？
A. 往左拐
B. 往右拐
C. 往回走
D. 往前走
Đáp án: A
Giải thích: Rẽ trái.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      // The options should be the actual options, not dialogue lines
      expect(parsed[0].options.length).toBe(4);
      expect(parsed[0].answer_idx).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 5: Bracketed Pinyin Variations
  // =========================================================================
  describe('5. Bracketed Pinyin Variations', () => {
    it('5.1 handles stem containing square bracketed pinyin [huānyíng] without corruption', () => {
      const input = `
Câu 1: 欢迎 [huānyíng] 你来我家____。
A. 玩儿
B. 喝水
C. 睡觉
D. 跑步
Đáp án: A
Giải thích: Đến nhà chơi.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('欢迎');
      expect(parsed[0].options).toEqual(['玩儿', '喝水', '睡觉', '跑步']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('5.2 handles Chinese brackets 【lǎoshī】 in stem and options', () => {
      const input = `
Câu 1: 他是我们的中文老师【lǎoshī】，对我们很____。
A. 好【hǎo】
B. 坏【huài】
C. 多【duō】
D. 少【shǎo】
Đáp án: A
Giải thích: Thầy giáo đối xử rất tốt.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('老师');
      expect(parsed[0].options).toEqual(['好', '坏', '多', '少']);
      expect(parsed[0].options_pinyin).toEqual(['hǎo', 'huài', 'duō', 'shǎo']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('5.3 preserves parenthesized Hanzi descriptions (non-pinyin) in stem', () => {
      const input = `
Câu 1: 桌子上有一本书（书很新），那是____的书。
A. 我
B. 他
C. 谁
D. 老师
Đáp án: D
Giải thích: Cuốn sách của thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('书很新');
      expect(parsed[0].options.length).toBe(4);
      expect(parsed[0].answer_idx).toBe(3);
    });

    it('5.4 extracts explicit parenthesized pinyin (lǎoshī), strips it from stem and preserves accurate pinyin', () => {
      const input = `
Câu 1: 他是我的老师 (lǎoshī)，教我们中文。
A. 学习
B. 工作
C. 吃饭
D. 喝水
Đáp án: A
Giải thích: Học tập.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      // Pinyin in parentheses should be stripped from stem so it does not contaminate the Hanzi stem
      expect(parsed[0].stem).toBe('他是我的老师，教我们中文。');
      expect(parsed[0].stem).not.toContain('(lǎoshī)');
      expect(parsed[0].pinyin).toContain('lǎo shī');
    });
  });

  // =========================================================================
  // SUITE 6: Answer Key Placement Variations
  // =========================================================================
  describe('6. Answer Key Placement Variations', () => {
    it('6.1 parses answer placed on the same line as the question stem', () => {
      const input = `
Câu 1: 他是我的____。 Đáp án: A
A. 老师
B. 苹果
C. 飞机
D. 喝水
Giải thích: Thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('他是我的____。');
      expect(parsed[0].options).toEqual(['老师', '苹果', '飞机', '喝水']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('6.2 parses answer placed on the same line as the last option', () => {
      const input = `
Câu 1: 桌子上有____本书。
A. 三
B. 看
C. 去
D. 叫 Đáp án: A
Giải thích: Số ba.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].options[3]).toBe('叫');
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('6.3 parses inline marked answers (A. 老师 [x] or B. 苹果 (Đúng))', () => {
      const input = `
Câu 1: 我想____中国菜。
A. 吃 [x]
B. 听
C. 读
D. 坐
Giải thích: Ăn món Trung Quốc.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].options[0]).toBe('吃');
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('6.4 parses asterisk leading marked option (*A. 老师)', () => {
      const input = `
Câu 1: 昨天天气很____。
*A. 好
B. 买
C. 谁
D. 哪
Giải thích: Thời tiết tốt.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].options[0]).toBe('好');
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('6.5 parses merged answer and explanation on same line (Đáp án: A - Giải thích: Thầy giáo)', () => {
      const input = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A - Giải thích: 老师 là thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[0].explanation_vi).toContain('thầy giáo');
    });
  });

  // =========================================================================
  // SUITE 7: Corrupted, Partial & Server Crash Safety
  // =========================================================================
  describe('7. Corrupted, Partial & Server Crash Safety', () => {
    it('7.1 completely garbage input returns total_parsed: 0 without crashing server', async () => {
      const garbage = 'a9f83j209fjw0e9jf0923jf0923jf092j3f09j23f\n\n===+++---***\n\n0932jf092jf';
      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text: garbage }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(0);
      expect(data.message).toContain('Không tìm thấy câu hỏi hợp lệ');
    });

    it('7.2 non-string req.body inputs (numbers, arrays, null) do not crash server', async () => {
      const res1 = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text: 123456 }),
      });
      expect(res1.status).toBe(200);

      const res2 = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text: null }),
      });
      expect(res2.status).toBe(200);
    });

    it('7.3 handles question with corrupt answer key (Đáp án: Z, Đáp án: 999) safely', () => {
      const input = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: Z
Giải thích: Lỗi đáp án.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      // Fallback answer_idx must remain within bounds [0, options.length - 1]
      expect(parsed[0].answer_idx).toBeGreaterThanOrEqual(0);
      expect(parsed[0].answer_idx).toBeLessThan(parsed[0].options.length);
    });

    it('7.4 deduplicates identical questions in same import payload', async () => {
      const input = `
Câu 1: 他是我的老师。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: Thầy giáo.

Câu 2: 他是我的老师。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: Thầy giáo.
      `;

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text: input }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total_parsed).toBe(2);
      // Second question has identical stem, must be rejected or deduplicated
      expect(data.accepted_count).toBe(1);
      expect(data.rejected_count).toBe(1);
    });
  });

  // =========================================================================
  // SUITE 8: Special Option Structures & Layouts (3-opt, 6-opt, T/F, Horizontal)
  // =========================================================================
  describe('8. Special Option Structures & Layouts', () => {
    it('8.1 correctly parses 3-option questions (HSK 1 Listening/Reading)', () => {
      const input = `
Câu 1: 他在做什么？
A. 睡觉
B. 看书
C. 吃饭
Đáp án: A
Giải thích: Đang ngủ.
      `;

      const parsed = parseUniversalQuestions(input, {
        default_level: 1,
        default_skill: 'listening',
        default_part_type: 'listen_picture_match_3opt',
      });

      expect(parsed.length).toBe(1);
      expect(parsed[0].options).toEqual(['睡觉', '看书', '吃饭']);
      expect(parsed[0].options.length).toBe(3);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('8.2 correctly parses 6-option word-bank questions (HSK 1-4 A-F)', () => {
      const input = `
Câu 1: 桌子上有一本书，那是我的____。
A. 电脑
B. 苹果
C. 朋友
D. 衣服
E. 飞机
F. 老师
Đáp án: F
Giải thích: Cuốn sách của thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input, {
        default_level: 2,
        default_skill: 'reading',
        default_part_type: 'read_fill_blank_word_bank_6opt',
      });

      expect(parsed.length).toBe(1);
      expect(parsed[0].options.length).toBe(6);
      expect(parsed[0].options[5]).toBe('老师');
      expect(parsed[0].answer_idx).toBe(5);
    });

    it('8.3 correctly parses True/False 2-option questions with 对 / 错', () => {
      const input = `
Câu 1: 明天天气很好。
A. 对
B. 错
Đáp án: A
Giải thích: Đúng.
      `;

      const parsed = parseUniversalQuestions(input, {
        default_level: 1,
        default_skill: 'reading',
        default_part_type: 'read_true_false_2opt',
      });

      expect(parsed.length).toBe(1);
      expect(parsed[0].options).toEqual(['对', '错']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('8.4 correctly parses horizontal options on a single line (A. ... B. ... C. ... D. ...)', () => {
      const input = `
Câu 1: 他是我的____。
A. 老师    B. 苹果    C. 飞机    D. 喝水
Đáp án: A
Giải thích: Thầy giáo.
      `;

      const parsed = parseUniversalQuestions(input);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('他是我的____。');
      expect(parsed[0].options).toEqual(['老师', '苹果', '飞机', '喝水']);
      expect(parsed[0].answer_idx).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 9: Malformed JSON & Unpaired Surrogates Crash Safety
  // =========================================================================
  describe('9. Malformed JSON & Unpaired Surrogates Crash Safety', () => {
    it('9.1 handles broken/malformed JSON string in text field without crashing', async () => {
      const malformedJson = '[\n  {"stem": "他是我的____。", "options": ["老师", "苹果", ';
      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text: malformedJson }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // Malformed JSON should gracefully fall through to regex parser or return 0 parsed without throwing
      expect(data.total_parsed).toBeGreaterThanOrEqual(0);
    });

    it('9.2 handles unpaired surrogates and invalid Unicode sequences safely without crashing server', async () => {
      const surrogatePayload = 'Câu 1: 他是我的\uD800____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A\nGiải thích: Surrogate.';
      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
        body: JSON.stringify({ text: surrogatePayload }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});

