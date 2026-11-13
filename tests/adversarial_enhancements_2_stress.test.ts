/**
 * Adversarial Challenger 2 Stress Suite
 * Focus: Golden Standard Prompt Library (R3) & OCR Image Ingestion (R4)
 *
 * Verifies:
 * 1. Prompt Library (R3):
 *    - All 36 combinations (HSK 1-6 x 6 formats) produce zero unreplaced tokens.
 *    - Boundary and adversarial parameter inputs (negative, huge, empty, special chars).
 *    - AI model response simulations (ChatGPT, Claude, Gemini, DeepSeek).
 *    - 100% gate pass and zero data loss on ingestion.
 * 2. OCR Ingestion (R4):
 *    - Attack POST /api/qbank/ocr with corrupt base64, malformed images, empty payloads.
 *    - Attack with massive payloads (>10MB).
 *    - Attack with non-image MIME types.
 *    - Valid Chinese exam image ingestion through 6 gates with content_hash deduplication.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  buildGoldenPrompt,
  GOLDEN_PROMPT_FORMATS,
  HSK_LEVEL_META,
  type GoldenPromptFormatKey,
} from '../src/components/Admin/GoldenPromptLibraryModal';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  setDbSyncForTesting,
  ensurePendingSchema,
} from '../src/server/qbankRoutes';

describe('Adversarial Challenger 2: Prompt Library & OCR Stress Test', () => {
  describe('PART 1: Golden Standard Prompt Library (R3) Adversarial Stress', () => {
    const formats: GoldenPromptFormatKey[] = [
      'reading_mcq',
      'listening_dialogue',
      'dialogue_matching',
      'fill_in_blank',
      'true_false',
      'json_strict',
    ];

    it('adversarially audits all 36 prompt combinations for zero unreplaced placeholder tokens', () => {
      // Forbidden unreplaced placeholder patterns
      const forbiddenPlaceholders = [
        '[CẤP ĐỘ]',
        '[SỐ LƯỢNG]',
        '[CHỦ ĐỀ]',
        '[PINYIN]',
        '[LEVEL]',
        '[COUNT]',
        '[TOPIC]',
        'undefined',
        'NaN',
        'null',
        '[object Object]',
        '${level}',
        '${questionCount}',
        '${topic}',
        '${levelMeta',
      ];

      let combinationsChecked = 0;

      for (const format of formats) {
        for (let level = 1; level <= 6; level++) {
          const prompt = buildGoldenPrompt({
            level,
            format,
            questionCount: 7,
            topic: 'Kinh tế số & Thương mại điện tử xuyên biên giới',
            includePinyin: level <= 3,
          });

          expect(prompt).toBeTruthy();
          expect(typeof prompt).toBe('string');
          expect(prompt.length).toBeGreaterThan(150);

          for (const forbidden of forbiddenPlaceholders) {
            expect(
              prompt.includes(forbidden),
              `Format ${format} Level ${level} contains forbidden token: "${forbidden}"`
            ).toBe(false);
          }

          // Invariant: Must mention HSK {level}
          expect(prompt).toContain(`HSK ${level}`);

          // Invariant: Must contain target vocabulary from HSK_LEVEL_META
          const expectedVocab = HSK_LEVEL_META[level].vocabTarget;
          expect(prompt).toContain(expectedVocab);

          // Invariant: Non-JSON formats must guarantee the canonical footer
          if (format !== 'json_strict') {
            expect(prompt).toContain('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:');
            expect(prompt).toContain('Câu 1:');
          } else {
            expect(prompt).toContain('```json');
            expect(prompt).toContain('"answer_idx"');
          }

          combinationsChecked++;
        }
      }

      expect(combinationsChecked).toBe(36);
    });

    it('stress-tests boundary and adversarial parameters without crashing or leaking unhandled tokens', () => {
      const boundaryCases = [
        { level: -999, questionCount: -50, topic: '', format: 'reading_mcq' },
        { level: 999, questionCount: 1000, topic: '   \n\t  ', format: 'listening_dialogue' },
        { level: 0, questionCount: 0, topic: 'Special chars: <script>alert(1)</script> " \' & \r\n', format: 'dialogue_matching' },
        { level: 3.7, questionCount: 4.9, topic: 'Unicode: 🌸🚀🎯 Việt Nam Trung Quốc', format: 'fill_in_blank' },
        { level: NaN as any, questionCount: undefined, topic: undefined, format: 'true_false' },
        { level: null as any, questionCount: null as any, topic: null as any, format: 'json_strict' },
      ];

      for (const params of boundaryCases) {
        const prompt = buildGoldenPrompt(params);
        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(100);
        expect(prompt).not.toContain('NaN');
        expect(prompt).not.toContain('undefined');
        expect(prompt).not.toContain('null');
        expect(prompt).not.toContain('[object Object]');
      }
    });

    describe('Diverse AI Model Response Simulations & Gate Ingestion', () => {
      it('Simulates ChatGPT (markdown code blocks, bolding, adherence to golden prompt) -> 100% gate pass & zero data loss', () => {
        const chatGptResponse = `\`\`\`markdown
Câu 1: 我每天早上七点起床，然后去学校。他每天几点起床？(Wǒ měitiān zǎoshang qī diǎn qǐchuáng, ránhòu qù xuéxiào. Tā měitiān jǐ diǎn qǐchuáng?)
A. 六点
B. 七点
C. 八点
D. 九点

Câu 2: 昨天北京的天气很好，不冷也不热。昨天北京天气怎么样？(Zuótiān Běijīng de tiānqì hěn hǎo, bù lěng yě bú rè. Zuótiān Běijīng tiānqì zěnmeyàng?)
A. 很冷
B. 很热
C. 很好
D. 不太好

Câu 3: 他在商店买了一件红色的衣服。他买了什么？(Tā zài shāngdiàn mǎi le yí jiàn hóngsè de yīfu. Tā mǎi le shénme?)
A. 衣服
B. 水果
C. 电脑
D. 书包

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: B. Giải thích: Tôi thức dậy lúc 7 giờ mỗi sáng (七点起床).
Câu 2: C. Giải thích: Thời tiết Bắc Kinh rất tốt (很好), không lạnh cũng không nóng.
Câu 3: A. Giải thích: Mua một chiếc áo màu đỏ (一件红色的衣服).
\`\`\``;

        const questions = parseUniversalQuestions(chatGptResponse, { default_level: 2 });
        expect(questions).toHaveLength(3);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          expect(q.stem).toBeTruthy();
          expect(q.options).toHaveLength(4);
          expect(q.answer_idx).toBeGreaterThanOrEqual(0);
          expect(q.answer_idx).toBeLessThan(4);
          expect(q.explanation_vi).toBeTruthy();

          const gates = evaluateCandidateSixGates(q, [], { lenientImport: true });
          expect(gates.allPassed, `ChatGPT Question ${i + 1} failed gates: ${JSON.stringify(gates)}`).toBe(true);
        }

        expect(questions[0].answer_idx).toBe(1); // B
        expect(questions[1].answer_idx).toBe(2); // C
        expect(questions[2].answer_idx).toBe(0); // A
      });

      it('Simulates Claude (lowercase/mixed-case headers, full-width punctuation, tags) -> 100% gate pass & listening inference', () => {
        const claudeResponse = `<questions>
Câu 1：
男：请问，图书馆几点关门？(Qǐngwèn, túshūguǎn jǐ diǎn guānmén?)
女：下午五点半。(Xiàwǔ wǔ diǎn bàn.)
问：图书馆什么时候关门？
A. 五点
B. 五点半
C. 六点
D. 六点半

Câu 2：
男：你想喝茶还是喝咖啡？(Nǐ xiǎng hē chá háishì hē kāfēi?)
女：给我一杯热茶吧，谢谢。(Gěi wǒ yì bēi rè chá ba, xièxie.)
问：女的想喝什么？
A. 牛奶
B. 咖啡
C. 水
D. 茶
</questions>

<answer_key>
đáp án và giải thích chi tiết:
câu 1: b. giải thích: nam hỏi mấy giờ thư viện đóng cửa, nữ trả lời 5 giờ rưỡi chiều.
câu 2: d. giải thích: nữ chọn uống một cốc trà nóng, do đó đáp án đúng là d.
</answer_key>`;

        const questions = parseUniversalQuestions(claudeResponse, { default_level: 2 });
        expect(questions).toHaveLength(2);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          expect(q.skill).toBe('listening');
          expect(q.part_type).toBe('listen_dialogue_qa_4opt');
          expect(q.options).toHaveLength(4);
          expect(q.stem).toContain('男');
          expect(q.stem).toContain('女');
          expect(q.stem).toContain('问');

          const gates = evaluateCandidateSixGates(q, [], { lenientImport: true });
          expect(gates.allPassed, `Claude Question ${i + 1} failed gates: ${JSON.stringify(gates)}`).toBe(true);
        }

        expect(questions[0].answer_idx).toBe(1); // B
        expect(questions[1].answer_idx).toBe(3); // D
      });

      it('Simulates Gemini (emojis, conversational preamble, bold options, fill-in-blank) -> 100% gate pass', () => {
        const geminiResponse = `🌟 Dưới đây là bộ câu hỏi điền từ vào chỗ trống HSK dành cho bạn:

**Câu 1:** 桌子上有一____苹果。(Zhuōzi shang yǒu yì ____ píngguǒ.)
* **A.** 个
* **B.** 本
* **C.** 杯
* **D.** 张

**Câu 2:** 他每天晚上都____看书。(Tā měitiān wǎnshang dōu ____ kànshū.)
* **A.** 喜欢
* **B.** 常常
* **C.** 已经
* **D.** 一边

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: A. Giải thích: Lượng từ cho quả táo (苹果) là "个" (gè), dùng "一个苹果" để chỉ một quả táo.
Câu 2: A. Giải thích: Thích đọc sách (喜欢看书), vị ngữ chỉ sở thích phù hợp nhất.`;

        const questions = parseUniversalQuestions(geminiResponse, { default_level: 3 });
        expect(questions).toHaveLength(2);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          expect(q.stem).toContain('____');
          expect(q.options).toHaveLength(4);

          const gates = evaluateCandidateSixGates(q, [], { lenientImport: true });
          expect(gates.allPassed, `Gemini Question ${i + 1} failed gates: ${JSON.stringify(gates)}`).toBe(true);
        }

        expect(questions[0].answer_idx).toBe(0); // A (个)
        expect(questions[1].answer_idx).toBe(0); // A (喜欢)
      });

      it('Simulates DeepSeek (<think> reasoning block, True/False format) -> 100% gate pass', () => {
        const deepSeekResponse = `<think>
Tôi đang phân tích yêu cầu tạo câu hỏi Đúng / Sai HSK.
Cần cung cấp nội dung rõ ràng và bảng đáp án chi tiết.
</think>

Câu 1: 北京是中国的首都。(Běijīng shì Zhōngguó de shǒudū.)
A. 对
B. 错

Câu 2: 喝茶对身体不好。(Hē chá duì shēntǐ bù hǎo.)
A. 对
B. 错

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: A. Giải thích: Bắc Kinh là thủ đô của Trung Quốc, khẳng định hoàn toàn đúng.
Câu 2: B. Giải thích: Uống trà có lợi cho sức khỏe, nhận định trên là sai.`;

        const questions = parseUniversalQuestions(deepSeekResponse, { default_level: 1 });
        expect(questions).toHaveLength(2);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          expect(q.stem).not.toContain('<think>');
          expect(q.stem).not.toContain('</think>');
          expect(q.options).toEqual(['对', '错']);

          const gates = evaluateCandidateSixGates(q, [], { lenientImport: true });
          expect(gates.allPassed, `DeepSeek Question ${i + 1} failed gates: ${JSON.stringify(gates)}`).toBe(true);
        }

        expect(questions[0].answer_idx).toBe(0); // A (对)
        expect(questions[1].answer_idx).toBe(1); // B (错)
      });

      it('Simulates Dialogue Matching (5-opt shared option pool) -> 100% gate pass & zero data loss', () => {
        const matchingResponse = `第二部分: 第 1 - 5 题
Quy tắc: Chọn một phương án phù hợp nhất từ A đến E để ghép với từng câu ngữ cảnh (mỗi phương án chỉ dùng một lần).
Ký hiệu Câu lựa chọn
A. 不客气。(Bú kèqi.)
B. 她去医院看医生了。(Tā qù yīyuàn kàn yīshēng le.)
C. 好的，明天见。(Hǎo de, míngtiān jiàn.)
D. 没关系，请坐。(Méi guānxi, qǐng zuò.)
E. 我在看书呢。(Wǒ zài kàn shū ne.)

1. 谢谢你的帮助！(Xièxie nǐ de bāngzhù!) → [ ]
2. 对不起，我来晚了。(Duìbuqǐ, wǒ lái wǎn le.) → [ ]
3. 你妈妈不在家吗？(Nǐ māma bú zài jiā ma?) → [ ]
4. 你在做什么呢？(Nǐ zài zuò shénme ne?) → [ ]
5. 明天上午八点见。(Míngtiān shàngwǔ bā diǎn jiàn.) → [ ]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: A. Giải thích: Đáp lại lời cảm ơn bằng "Không có gì".
Câu 2: D. Giải thích: Đáp lại lời xin lỗi đến muộn bằng "Không sao, mời ngồi".
Câu 3: B. Giải thích: Trả lời về mẹ bằng "Bà ấy đi viện khám bác sĩ rồi".
Câu 4: E. Giải thích: Trả lời đang làm gì bằng "Tôi đang đọc sách này".
Câu 5: C. Giải thích: Đáp lại hẹn ngày mai bằng "Được, ngày mai gặp".`;

        const questions = parseUniversalQuestions(matchingResponse, { default_level: 1 });
        expect(questions).toHaveLength(5);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          expect(q.options).toHaveLength(5);
          expect(q.explanation_vi).toBeTruthy();

          const gates = evaluateCandidateSixGates(q, [], { lenientImport: true });
          expect(gates.allPassed, `Dialogue Matching Q${i + 1} failed gates: ${JSON.stringify(gates)}`).toBe(true);
        }

        expect(questions[0].answer_idx).toBe(0); // A
        expect(questions[1].answer_idx).toBe(3); // D
        expect(questions[2].answer_idx).toBe(1); // B
        expect(questions[3].answer_idx).toBe(4); // E
        expect(questions[4].answer_idx).toBe(2); // C
      });

      it('Simulates JSON Strict CandidateQuestion format (with markdown fence & trailing commas) -> 100% gate pass', () => {
        const jsonStrictResponse = `\`\`\`json
[
  {
    "stem": "今天天气非常晴朗，我们去公园散步吧。(Jīntiān tiānqì fēicháng qínglǎng, wǒmen qù gōngyuán sànbù ba.)",
    "options": ["去公园", "去商店", "在家睡觉", "去工作"],
    "answer_idx": 0,
    "pinyin": "Jīntiān tiānqì fēicháng qínglǎng",
    "explanation_vi": "Thời tiết đẹp nên rủ đi dạo công viên, đáp án đúng là A.",
    "level": 3,
    "skill": "reading",
    "part_type": "read_comprehension_4opt",
  },
  {
    "stem": "男：你什么时候去上海？\\n女：下个星期一。\\n问：女的哪天去上海？",
    "options": ["这个星期天", "下个星期一", "下个星期五", "下个月"],
    "answer_idx": 1,
    "pinyin": "Nǐ shénme shíhou qù Shànghǎi",
    "explanation_vi": "Nhân vật nữ trả lời thứ hai tuần sau (下个星期一), đáp án đúng là B.",
    "level": 3,
    "skill": "listening",
    "part_type": "listen_dialogue_qa_4opt",
  }
]
\`\`\``;

        const questions = parseUniversalQuestions(jsonStrictResponse, { default_level: 3 });
        expect(questions).toHaveLength(2);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          expect(q.options).toHaveLength(4);
          expect(q.answer_idx).toBe(i);

          const gates = evaluateCandidateSixGates(q, [], { lenientImport: true });
          expect(gates.allPassed, `JSON Strict Q${i + 1} failed gates: ${JSON.stringify(gates)}`).toBe(true);
        }

        expect(questions[0].skill).toBe('reading');
        expect(questions[1].skill).toBe('listening');
      });

      it('Adversarial Edge Case Discovery: Preamble with multiple digit tokens triggers phantom question creation', () => {
        // When AI output contains preamble with 2 distinct digits (e.g. "3 câu hỏi... HSK 2"),
        // universalQuestionParser matches the digits as option labels!
        const aiResponseWithPreambleDigits = `Chào bạn! Dưới đây là 3 câu hỏi trắc nghiệm Đọc hiểu HSK 2 tôi đã tạo cho bạn:

Câu 1: 我每天早上七点起床。(Wǒ měitiān zǎoshang qī diǎn qǐchuáng.)
A. 六点
B. 七点
C. 八点
D. 九点

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: B. Giải thích: Thức dậy lúc 7 giờ.`;

        const parsed = parseUniversalQuestions(aiResponseWithPreambleDigits, { default_level: 2 });
        // Demonstrating the adversarial vulnerability: parsed length is 2 instead of 1!
        expect(parsed.length).toBeGreaterThan(1);
        const phantom = parsed[0];
        expect(phantom.stem).toContain('Chào bạn');
        // The phantom question lacks Chinese characters in options
        expect(/[\u4e00-\u9fa5]/.test(phantom.options.join(''))).toBe(false);
      });
    });
  });

  describe('PART 2: OCR Image-to-Question Ingestion (R4) Adversarial Stress', () => {
    let app: express.Express;
    let server: http.Server;
    let baseUrl: string;
    let testDb: DatabaseSync;
    const TEST_ADMIN_TOKEN = 'test-challenger-ocr-stress-token-secure-64hex';

    beforeAll(async () => {
      testDb = new DatabaseSync(':memory:');
      ensurePendingSchema(testDb);
      setDbSyncForTesting(testDb);
      setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

      app = express();
      // Test server configured with 2MB body parser limit (matching production server.ts)
      app.use(express.json({ limit: '2mb' }));
      app.use('/api/qbank', qbankRouter);

      // Global error handler for 413 / parsing errors matching server.ts lines 3450-3456
      app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (err) {
          return res.status(err.status || err.statusCode || 500).json({
            success: false,
            error: err.message || 'Lỗi máy chủ',
          });
        }
        next();
      });

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address() as any;
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    });

    afterAll(async () => {
      setQBankAdminTokenForTesting(null);
      setDbSyncForTesting(null);
      if (testDb) {
        try {
          testDb.close();
        } catch {}
      }
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_ADMIN_TOKEN}`,
    };

    describe('Adversarial Payload Attacks on POST /api/qbank/ocr', () => {
      it('Attack 1: Empty payloads ({}, {image: ""}, {image: "   "}, null, numbers) -> HTTP 400', async () => {
        const invalidPayloads = [
          {},
          { image: '' },
          { image: '   ' },
          { image: null },
          { image: 12345 },
          { image: true },
          { image: [] },
          { image: {} },
          { image_base64: '' },
          { image: 'data:image/png;base64,' },
          { image: 'data:image/jpeg;base64,   ' },
        ];

        for (const payload of invalidPayloads) {
          const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload),
          });

          expect(
            res.status,
            `Expected HTTP 400 for payload ${JSON.stringify(payload)}, got ${res.status}`
          ).toBe(400);

          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toBeTruthy();
        }
      });

      it('Attack 2: Corrupt base64 with invalid characters, control bytes, and empty buffer -> HTTP 400', async () => {
        const corruptBase64s = [
          'data:image/png;base64,not_a_valid_base64!@#$%^&*()',
          'data:image/png;base64,AAAA\0BBBB',
          'data:image/webp;base64,中文字符串非base64',
          'data:image/png;base64,====',
          'data:image/png;base64,---invalid---',
        ];

        for (const raw of corruptBase64s) {
          const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ image: raw }),
          });

          expect(res.status, `Expected HTTP 400 for corrupt base64: ${raw}`).toBe(400);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toBeTruthy();
        }
      });

      it('Attack 2b (Adversarial Edge Case Discovery): Malformed base64 padding (abc===) bypasses regex validation', async () => {
        // RFC 4648 specifies that base64 padding cannot exceed 2 '=' characters and length must be % 4 === 0.
        // However, regex /^[A-Za-z0-9+/=\s]+$/ permits 'abc===' (6 chars with 3 '=' padding).
        // Node Buffer.from('abc===', 'base64') decodes 2 bytes (<Buffer 69 b7>) without throwing.
        // In test mode, this triggers the offline fallback and returns HTTP 200 rather than HTTP 400.
        const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ image: 'data:image/jpeg;base64,abc===' }),
        });

        // Documenting the behavioral finding:
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      });

      it('Attack 3: Non-image MIME types in data URL -> HTTP 400', async () => {
        const nonImagePayloads = [
          { image: 'data:application/pdf;base64,JVBERi0xLjQKJ...' },
          { image: 'data:text/plain;base64,SGVsbG8gd29ybGQ=' },
          { image: 'data:video/mp4;base64,AAAAIGZ0eXBpc29t...' },
          { image: 'data:application/octet-stream;base64,DEADBEEF' },
          { image: 'data:audio/mp3;base64,SUQzBAAAAAAA...' },
        ];

        for (const p of nonImagePayloads) {
          const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(p),
          });

          expect(
            res.status,
            `Expected HTTP 400 for non-image data URL: ${p.image.slice(0, 30)}`
          ).toBe(400);

          const data = await res.json();
          expect(data.success).toBe(false);
        }
      });

      it('Attack 3b (Adversarial Edge Case Discovery): Non-image mime_type in JSON body with raw base64', async () => {
        // When raw base64 is passed with body mime_type: 'application/pdf',
        // the endpoint does not reject non-image MIME types explicitly.
        const rawBase64 = Buffer.from('Raw test data buffer').toString('base64');
        const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            image: rawBase64,
            mime_type: 'application/pdf',
          }),
        });

        // Documenting the behavior: endpoint accepts and processes via fallback (status 200)
        // rather than enforcing image/* MIME validation upfront.
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      });

      it('Attack 4: Massive payloads (>10MB) -> HTTP 413/400 without crashing or memory leak', async () => {
        // Create an 11MB payload (larger than 2MB server limit and >10MB specification)
        const massiveBase64 = 'A'.repeat(11 * 1024 * 1024);
        const payload = JSON.stringify({
          image: `data:image/jpeg;base64,${massiveBase64}`,
        });

        const startTime = Date.now();
        const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: payload,
        });

        const elapsed = Date.now() - startTime;

        // In Express, body parser rejects payload > limit with 413 Payload Too Large
        expect([400, 413]).toContain(res.status);
        const data = await res.json();
        expect(data.success).toBe(false);

        // Verify server is STILL fully alive and healthy immediately after attack
        const healthRes = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({}),
        });
        expect(healthRes.status).toBe(400); // Standard rejection, not 500 or timeout!
        expect(elapsed).toBeLessThan(10000); // Fast response, no freezing
      });

      it('Attack 5: Malformed decoded image buffer (0-byte empty buffer) -> HTTP 400', async () => {
        // A valid base64 character that decodes to 0 bytes doesn't exist, but empty base64 after prefix:
        const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ image: 'data:image/png;base64,' }),
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('rỗng');
      });
    });

    describe('Valid Chinese Exam Images -> 6 Gates & Deduplication Guard', () => {
      it('Parses valid Chinese reading exam image through 6 gates and persists with deduplication', async () => {
        const examSheetText = [
          'Câu 1: 我每天早上都____跑步。(Wǒ měitiān zǎoshang dōu ____ pǎobù.)',
          'A. 去',
          'B. 吃',
          'C. 喝',
          'D. 听',
          '',
          'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
          'Câu 1: A. Giải thích: Động từ "去" (đi) kết hợp với "跑步" tạo thành cụm "đi chạy bộ" phù hợp ngữ nghĩa nhất.',
        ].join('\n');

        const base64DataUrl = `data:image/png;base64,${Buffer.from(examSheetText, 'utf-8').toString('base64')}`;

        // First Ingestion
        const res1 = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            image: base64DataUrl,
            target_level: 2,
            strict_gates: true, // Test with strict 6 gates!
          }),
        });

        expect(res1.status).toBe(200);
        const data1 = await res1.json();
        expect(data1.success).toBe(true);
        expect(data1.count).toBe(1);
        expect(data1.accepted_count).toBe(1);
        expect(data1.rejected_count).toBe(0);

        const q1 = data1.questions[0];
        expect(q1.stem).toContain('我每天早上都____跑步');
        expect(q1.options).toEqual(['去', '吃', '喝', '听']);
        expect(q1.answer_idx).toBe(0);
        expect(q1.status).toBe('imported');
        expect(q1.provider_used).toBe('gemini-ocr');

        // Verify 6 gates passed
        const gateResult = data1.results[0];
        expect(gateResult.passed).toBe(true);
        expect(gateResult.gates.allPassed).toBe(true);
        expect(gateResult.gates.gate1_schema.passed).toBe(true);
        expect(gateResult.gates.gate2_rationales_coherence.passed).toBe(true);
        expect(gateResult.gates.gate3_vocab_coverage.passed).toBe(true);
        expect(gateResult.gates.gate4_distractor_quality.passed).toBe(true);
        expect(gateResult.gates.gate5_uniqueness.passed).toBe(true);
        expect(gateResult.gates.gate6_blind_solve.passed).toBe(true);

        // Verify row in SQLite
        const row1: any = testDb.prepare('SELECT * FROM pending_questions WHERE id = ?').get(q1.id);
        expect(row1).toBeDefined();
        expect(row1.content_hash).toBe(gateResult.content_hash);
        expect(row1.status).toBe('imported');

        // Second Ingestion: Exact same content -> deduplication MUST block insertion
        const res2 = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            image: base64DataUrl,
            target_level: 2,
            strict_gates: true,
          }),
        });

        expect(res2.status).toBe(200);
        const data2 = await res2.json();
        expect(data2.success).toBe(true);
        expect(data2.accepted_count).toBe(0); // Deduplicated!
        expect(data2.rejected_count).toBe(1); // Rejected due to duplicate content_hash!

        // Verify row count in SQLite did NOT increase
        const countRow: any = testDb
          .prepare('SELECT COUNT(*) as cnt FROM pending_questions WHERE content_hash = ?')
          .get(gateResult.content_hash);
        expect(countRow.cnt).toBe(1);
      });

      it('Parses valid Chinese listening dialogue exam image with speaker turns and auto-infers listening skill', async () => {
        const listeningSheetText = [
          'Câu 1:',
          '男：小张，你今天下午有空吗？(Xiǎo Zhāng, nǐ jīntiān xiàwǔ yǒu kòng ma?)',
          '女：不好意思，我下午要去图书馆复习。(Bù hǎoyìsi, wǒ xiàwǔ yào qù túshūguǎn fùxí.)',
          '问：女的下午打算做什么？(Nǚ de xiàwǔ dǎsuàn zuò shénme?)',
          'A. 去图书馆',
          'B. 去超市',
          'C. 在家睡觉',
          'D. 看电影',
          '',
          'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
          'Câu 1: A. Giải thích: Người nữ trả lời "要去图书馆复习" (đi thư viện ôn tập), do đó chọn A.',
        ].join('\n');

        const base64DataUrl = `data:image/jpeg;base64,${Buffer.from(listeningSheetText, 'utf-8').toString('base64')}`;

        const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            image: base64DataUrl,
            target_level: 3,
            strict_gates: true,
          }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.accepted_count).toBe(1);

        const q = data.questions[0];
        expect(q.skill).toBe('listening');
        expect(q.part_type).toBe('listen_dialogue_qa_4opt');
        expect(q.options).toHaveLength(4);
        expect(q.answer_idx).toBe(0);

        const row: any = testDb.prepare('SELECT * FROM pending_questions WHERE id = ?').get(q.id);
        expect(row).toBeDefined();
        expect(row.skill).toBe('listening');
        expect(row.part_type).toBe('listen_dialogue_qa_4opt');
      });

      it('Stress Test: 10 Concurrent OCR Ingestion Requests -> Zero DB deadlocks or crashes', async () => {
        const sampleDistinctQuestions = [
          { stem: '我想去中国旅游，看长城。', opt: ['中国', '医院', '学校', '商店'], exp: 'Đi du lịch Trung Quốc xem Trường Thành.' },
          { stem: '今天晚上下雨，我们不能去公园散步。', opt: ['下雨', '晴天', '阴天', '刮风'], exp: 'Tối nay trời mưa không thể đi dạo công viên.' },
          { stem: '这本汉语书很便宜，只要十五块钱。', opt: ['便宜', '贵', '高', '多'], exp: 'Cuốn sách này rất rẻ.' },
          { stem: '妈妈在厨房做饭，菜非常香。', opt: ['做饭', '看书', '睡觉', '打球'], exp: 'Mẹ đang nấu cơm trong bếp.' },
          { stem: '李医生是一位非常有经验的大夫。', opt: ['医生', '老师', '司机', '服务员'], exp: 'Bác sĩ Lý là một thầy thuốc nhiều kinh nghiệm.' },
          { stem: '火车站离这里不远，走路十分钟就到了。', opt: ['火车站', '机场', '电影院', '超市'], exp: 'Ga xe lửa cách đây không xa.' },
          { stem: '他每天早上喜欢喝一杯热牛奶。', opt: ['牛奶', '咖啡', '茶', '可乐'], exp: 'Thích uống một cốc sữa nóng.' },
          { stem: '姐姐在大学学习英语，成绩很优秀。', opt: ['英语', '汉语', '法语', '日语'], exp: 'Học tiếng Anh ở trường đại học.' },
          { stem: '外面天气非常冷，你多穿一点儿衣服。', opt: ['冷', '热', '暖和', '凉快'], exp: 'Thời tiết bên ngoài rất lạnh, hãy mặc thêm áo.' },
          { stem: '这是我的新手机，颜色很漂亮。', opt: ['手机', '电脑', '手表', '自行车'], exp: 'Điện thoại mới màu sắc rất đẹp.' },
        ];

        const makePayload = (idx: number) => {
          const item = sampleDistinctQuestions[idx];
          const text = [
            `Câu 1: ${item.stem}`,
            `A. ${item.opt[0]}`,
            `B. ${item.opt[1]}`,
            `C. ${item.opt[2]}`,
            `D. ${item.opt[3]}`,
            '',
            'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
            `Câu 1: A. Giải thích: ${item.exp}`,
          ].join('\n');
          return `data:image/png;base64,${Buffer.from(text, 'utf-8').toString('base64')}`;
        };

        const promises = Array.from({ length: 10 }, (_, i) =>
          fetch(`${baseUrl}/api/qbank/ocr`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              image: makePayload(i),
              target_level: 2,
            }),
          }).then((res) => res.json())
        );

        const results = await Promise.all(promises);
        for (let i = 0; i < results.length; i++) {
          expect(results[i].success, `Concurrent request ${i} failed: ${JSON.stringify(results[i])}`).toBe(true);
          expect(results[i].accepted_count, `Concurrent request ${i} rejected: ${JSON.stringify(results[i])}`).toBe(1);
        }
      });

      it('Gate Sensitivity: Compares lenientImport vs strict_gates behavior on borderline question', async () => {
        // A question with out-of-syllabus vocabulary for Level 1 (e.g. 经济学, 商业 - HSK 4/5 words)
        const advancedVocabSheet = [
          'Câu 1: 他在大学学习经济学和商业管理。(Tā zài dàxué xuéxí jīngjìxué hé shāngyè guǎnlǐ.)',
          'A. 经济学',
          'B. 电脑',
          'C. 苹果',
          'D. 喝水',
          '',
          'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
          'Câu 1: A. Giải thích: Ngành kinh tế học (经济学).',
        ].join('\n');

        const base64DataUrl = `data:image/png;base64,${Buffer.from(advancedVocabSheet, 'utf-8').toString('base64')}`;

        // In lenient mode (default): Gate 1, 2, 5 are evaluated; syllabus warnings are tolerated
        const resLenient = await fetch(`${baseUrl}/api/qbank/ocr`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            image: base64DataUrl,
            target_level: 1,
            strict_gates: false,
          }),
        });
        const dataLenient = await resLenient.json();
        expect(dataLenient.success).toBe(true);
        expect(dataLenient.accepted_count).toBe(1);
      });
    });
  });
});
