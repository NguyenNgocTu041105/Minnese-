/**
/**
 * Test Suite: Adversarial Challenge — AI Auto-Format via Ollama (qwen2.5:7b)
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE
 * Tests:
 * 1. 5+ distinct input formats (ChatGPT, Claude markdown, loose JSON, HSK raw format, mixed VN-CN)
 * 2. Edge cases (empty text, whitespace, 50k char boundary, 50k+1 chars, code fence variations)
 * 3. Parser resilience (trailing commas, dialogue speaker collisions, full-width letters, numeric answers)
 * 4. Fault injection & Error handling (offline Ollama, HTTP 500/503 from Ollama, dual-attempt retry, malformed outputs)
 * 5. Live Ollama integration tests across formats with schema contract verification
 * 6. Admin token authentication enforcement
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  extractAndNormalizeCandidateQuestions,
  buildAiFormatPrompt,
  CandidateQuestionFormatted,
} from '../src/server/qbankRoutes.js';

describe('Adversarial Challenge: AI Auto-Format Endpoint & Normalization Engine', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  const ADVERSARIAL_TEST_TOKEN = 'adversarial-challenger-m2-token-safe-random-64hex';

  beforeAll(async () => {
    setQBankAdminTokenForTesting(ADVERSARIAL_TEST_TOKEN);

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
    setQBankAdminTokenForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ADVERSARIAL_TEST_TOKEN}`,
  };

  // =========================================================================
  // SUITE 1: 5+ Distinct Input Formats & Speaker Collocation Stress
  // =========================================================================
  describe('Suite 1: Multi-Format Parsing & Normalization Resilience', () => {
    it('Format 1: ChatGPT complex numbered format with diverse option prefixes', () => {
      const chatgptInput = `
      [
        {
          "stem": "今天天气很好，我们去公园____吧。",
          "options": ["A. 散步", "B) 跑步", "C - 游泳", "D. 睡觉"],
          "answer": "A",
          "explanation_vi": "散步 nghĩa là đi dạo, rất phù hợp khi thời tiết đẹp tại công viên.",
          "level": 2,
          "skill": "reading"
        },
        {
          "stem": "你桌子上的那本书是谁的？那是____的书。",
          "options": ["(A) 我", "[B] 老师", "（C）他", "D. 爸爸"],
          "answer_idx": 1,
          "explanation_vi": "Đáp án 老师 chỉ sở hữu người.",
          "level": 1,
          "skill": "reading"
        }
      ]
      `;

      const questions = extractAndNormalizeCandidateQuestions(chatgptInput, 1, 'reading');
      expect(questions).toHaveLength(2);

      // Question 1: Check prefix stripping (A., B), C -, D.)
      expect(questions[0].options).toEqual(['散步', '跑步', '游泳', '睡觉']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('đi dạo');

      // Question 2: Check bracketed prefix stripping ((A), [B], （C）, D.)
      expect(questions[1].options).toEqual(['我', '老师', '他', '爸爸']);
      expect(questions[1].answer_idx).toBe(1);
    });

    it('Format 2: Claude markdown format with blockquotes, bold options, and trailing text', () => {
      const claudeMarkdown = `
Dưới đây là các câu hỏi HSK đã được định dạng theo yêu cầu:

\`\`\`json
[
  {
    "stem": "这家饭馆的菜味道真好，____也很便宜。",
    "options": [
      "- **A.** 而且",
      "- **B.** 但是",
      "- **C.** 虽然",
      "- **D.** 因为"
    ],
    "answer": "A",
    "explanation": "**Giải thích chi tiết:** Cặp liên từ nối biểu thị tăng tiến là 而且.",
    "level": 3,
    "skill": "reading"
  }
]
\`\`\`

Chúc bạn ôn thi HSK đạt kết quả cao!
      `;

      const questions = extractAndNormalizeCandidateQuestions(claudeMarkdown, 3, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toBe('这家饭馆的菜味道真好，____也很便宜。');
      expect(questions[0].options).toEqual(['而且', '但是', '虽然', '因为']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('Giải thích chi tiết');
      expect(questions[0].level).toBe(3);
    });

    it('Format 3: Loose JSON with items array, trailing commas, and numeric answer strings', () => {
      const looseJson = `
      {
        "status": "success",
        "timestamp": 1730592000,
        "items": [
          {
            "question": "请把空调关____，房间里有点冷。",
            "options": [
              "上",
              "开",
              "了",
              "掉",
            ],
            "answer": "1",
            "explain": "关上 nghĩa là đóng lại, tắt máy điều hòa.",
            "level": 3,
            "skill": "reading",
          },
        ]
      }
      `;

      // Notice trailing commas and wrapper items
      const questions = extractAndNormalizeCandidateQuestions(looseJson, 3, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toContain('请把空调关____');
      expect(questions[0].options).toEqual(['上', '开', '了', '掉']);
      // Answer string "1" clamped/normalized
      expect(questions[0].answer_idx).toBe(1);
      expect(questions[0].explanation_vi).toContain('关上');
    });

    it('Format 3b: Dirty array with nulls, empty objects, and primitive entries', () => {
      const dirtyArray = `
      [
        null,
        12345,
        "random string",
        {},
        { "stem": "" },
        {
          "stem": "有效 câu hỏi hợp lệ: ____",
          "options": ["A", "B", "C", "D"],
          "answer_idx": 2,
          "explanation_vi": "Hợp lệ"
        },
        null
      ]
      `;

      const questions = extractAndNormalizeCandidateQuestions(dirtyArray, 2, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toBe('有效 câu hỏi hợp lệ: ____');
      expect(questions[0].answer_idx).toBe(2);
    });

    it('Format 4: HSK raw format with Chinese brackets and pause marks (A、, B、, C、, D、)', () => {
      const hskRaw = `
      [
        {
          "stem": "【阅读第1题】王老师不仅教汉语，【____】教书法。",
          "options": ["A、而且", "B、还是", "C、或者", "D、并且"],
          "answer": "A",
          "explanation_vi": "Cấu trúc 不仅...而且... (không những... mà còn...).",
          "level": 4,
          "skill": "reading"
        },
        {
          "stem": "李经理今天下午要去机场【____】一位重要的客人。",
          "options": ["A. 接", "B. 送", "C. 找", "D. 看"],
          "answer": "A",
          "explanation_vi": "接客人 nghĩa là đón khách.",
          "level": 3,
          "skill": "reading"
        }
      ]
      `;

      const questions = extractAndNormalizeCandidateQuestions(hskRaw, 4, 'reading');
      expect(questions).toHaveLength(2);
      expect(questions[0].options).toEqual(['而且', '还是', '或者', '并且']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[1].options).toEqual(['接', '送', '找', '看']);
      expect(questions[1].answer_idx).toBe(0);
    });

    it('Format 5: Mixed Vietnamese-Chinese with dialogue speakers A: and B: in stem', () => {
      const dialogueStem = `
      [
        {
          "stem": "A: 你好，请问洗手间在哪儿？\\nB: 就在前面右拐，____的地方就是。\\nA: 谢谢！",
          "options": ["A. 看见", "B. 听说", "C. 标志", "D. 觉得"],
          "answer_idx": 0,
          "explanation_vi": "看见的地方 (nơi nhìn thấy) phù hợp với ngữ cảnh chỉ đường.",
          "level": 2,
          "skill": "listening"
        }
      ]
      `;

      const questions = extractAndNormalizeCandidateQuestions(dialogueStem, 2, 'listening');
      expect(questions).toHaveLength(1);
      // Ensure stem preserves dialogue lines and speaker initials A: and B:
      expect(questions[0].stem).toContain('A: 你好');
      expect(questions[0].stem).toContain('B: 就在前面');
      expect(questions[0].options).toEqual(['看见', '听说', '标志', '觉得']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].skill).toBe('listening');
    });

    it('Format 5b: Vietnamese bilingual glosses inside options (A. 苹果 (quả táo))', () => {
      const bilingualOptions = `
      [
        {
          "stem": "桌子上放着几个红色的____。",
          "options": ["A. 苹果 (quả táo)", "B. 电脑 (máy tính)", "C. 衣服 (quần áo)", "D. 铅笔 (bút chì)"],
          "answer_idx": 0,
          "explanation_vi": "Màu đỏ kết hợp với 苹果.",
          "level": 1,
          "skill": "reading"
        }
      ]
      `;

      const questions = extractAndNormalizeCandidateQuestions(bilingualOptions, 1, 'reading');
      expect(questions).toHaveLength(1);
      // Strips only prefix 'A. ', preserves option content including parentheses
      expect(questions[0].options[0]).toBe('苹果 (quả táo)');
      expect(questions[0].options[1]).toBe('电脑 (máy tính)');
    });
  });

  // =========================================================================
  // SUITE 2: Edge Cases, Security & Input Boundary Limits
  // =========================================================================
  describe('Suite 2: Boundary & Edge Case Stress-Testing', () => {
    it('Edge 1: Rejects unauthenticated request with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: 'Test question' }),
      });
      expect(res.status).toBe(401);
    });

    it('Edge 2: Rejects invalid token with HTTP 403', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token-12345',
        },
        body: JSON.stringify({ raw_text: 'Test question' }),
      });
      expect(res.status).toBe(403);
    });

    it('Edge 3: Rejects empty text "" with HTTP 400 and exact Vietnamese message', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ raw_text: '' }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vui lòng cung cấp nội dung văn bản hợp lệ.');
    });

    it('Edge 4: Rejects whitespace-only string "\\t\\n  \\r" with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text: '  \n\t\r  ' }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vui lòng cung cấp nội dung văn bản hợp lệ.');
    });

    it('Edge 5: Rejects missing payload {} or non-string with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ raw_text: 12345 }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vui lòng cung cấp nội dung văn bản hợp lệ.');
    });

    it('Edge 6: Rejects text strictly greater than 50,000 characters with HTTP 400', async () => {
      const overLimit = 'X'.repeat(50001);
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ raw_text: overLimit }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vui lòng cung cấp nội dung văn bản hợp lệ.');
    });

    it('Edge 7: Multiple unclosed code fences are stripped gracefully', () => {
      const raw = `\`\`\`json
      [
        {
          "stem": "测试题",
          "options": ["A", "B", "C", "D"],
          "answer_idx": 0,
          "explanation_vi": "Giải thích",
          "level": 1,
          "skill": "reading"
        }
      ]
      \`\`\``;
      const res = extractAndNormalizeCandidateQuestions(raw);
      expect(res).toHaveLength(1);
      expect(res[0].stem).toBe('测试题');
    });

    it('Edge 8: Default level clamping and skill fallback logic', () => {
      const raw = `[
        {
          "stem": "Câu hỏi test fallback",
          "options": ["1", "2", "3", "4"],
          "answer_idx": 0,
          "level": -10,
          "skill": "invalid_magic_skill"
        }
      ]`;
      const res = extractAndNormalizeCandidateQuestions(raw, 5, 'writing');
      expect(res).toHaveLength(1);
      expect(res[0].level).toBe(5); // Fallback to provided defaultLevel
      expect(res[0].skill).toBe('writing'); // Fallback to provided defaultSkill
    });
  });

  // =========================================================================
  // SUITE 3: Fault Injection, Dual-Attempt Retries & Ollama Failures
  // =========================================================================
  describe('Suite 3: Fault Injection & Resilience Testing via Mock Ollama', () => {
    let mockApp: express.Express;
    let mockServer: http.Server;
    let mockPort: number;
    let callHistory: { prompt: string; attempt: number }[] = [];
    let customHandler: ((req: express.Request, res: express.Response) => void) | null = null;

    beforeAll(async () => {
      mockApp = express();
      mockApp.use(express.json());
      mockApp.post('/api/generate', (req, res) => {
        callHistory.push({
          prompt: String(req.body?.prompt || ''),
          attempt: callHistory.length + 1,
        });

        if (customHandler) {
          customHandler(req, res);
        } else {
          res.json({ response: '[]' });
        }
      });

      await new Promise<void>((resolve) => {
        mockServer = mockApp.listen(0, '127.0.0.1', () => {
          const addr = mockServer.address() as any;
          mockPort = addr.port;
          resolve();
        });
      });
    });

    afterAll(async () => {
      if (mockServer) {
        await new Promise<void>((resolve) => mockServer.close(() => resolve()));
      }
    });

    it('Fault 1: Dual-attempt retry works: Attempt 1 fails, Attempt 2 includes CRITICAL RETRY NOTICE and succeeds', async () => {
      const oldBase = process.env.OLLAMA_BASE_URL;
      process.env.OLLAMA_BASE_URL = `http://127.0.0.1:${mockPort}`;
      callHistory = [];

      customHandler = (_req, res) => {
        if (callHistory.length === 1) {
          // Attempt 1: Return garbage / non-JSON
          res.json({ response: 'Xin lỗi, tôi là mô hình AI và đây không phải JSON: ```broken' });
        } else {
          // Attempt 2: Return valid JSON
          res.json({
            response: JSON.stringify([
              {
                stem: '苹果很好吃。',
                options: ['苹果', '香蕉', '西瓜', '葡萄'],
                answer_idx: 0,
                explanation_vi: 'Táo rất ngon.',
                level: 1,
                skill: 'reading',
              },
            ]),
          });
        }
      };

      try {
        const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ raw_text: 'Dán câu hỏi thử nghiệm retry' }),
        });

        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.success).toBe(true);
        expect(data.count).toBe(1);
        expect(data.questions[0].stem).toBe('苹果很好吃。');

        // Verify two attempts were made
        expect(callHistory).toHaveLength(2);
        // Attempt 2 must contain the reinforced retry hint
        expect(callHistory[1].prompt).toContain('CRITICAL RETRY NOTICE');
      } finally {
        if (oldBase) process.env.OLLAMA_BASE_URL = oldBase;
        else delete process.env.OLLAMA_BASE_URL;
      }
    });

    it('Fault 2: When both attempts return malformed JSON, returns HTTP 400 with Vietnamese diagnostic message', async () => {
      const oldBase = process.env.OLLAMA_BASE_URL;
      process.env.OLLAMA_BASE_URL = `http://127.0.0.1:${mockPort}`;
      callHistory = [];

      customHandler = (_req, res) => {
        // Both attempts return non-parsable output
        res.json({ response: 'Thất bại: không có JSON nào ở đây.' });
      };

      try {
        const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ raw_text: 'Dán câu hỏi lỗi kép' }),
        });

        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toBe(
          'Mô hình AI không tìm thấy câu hỏi hợp lệ trong văn bản. Vui lòng kiểm tra lại nội dung đầu vào.'
        );
        expect(data.count).toBe(0);
        expect(callHistory).toHaveLength(2); // Attempt 1 + Attempt 2 retry
      } finally {
        if (oldBase) process.env.OLLAMA_BASE_URL = oldBase;
        else delete process.env.OLLAMA_BASE_URL;
      }
    });

    it('Fault 3: When Ollama server is completely offline / unreachable, returns HTTP 503 with exact Vietnamese message', async () => {
      const oldBase = process.env.OLLAMA_BASE_URL;
      // Use an unreachable port
      process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:58888';

      try {
        const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ raw_text: 'Kiểm tra lỗi offline' }),
        });

        expect(res.status).toBe(503);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toBe(
          'Không thể kết nối đến máy chủ AI Ollama (http://localhost:11434). Vui lòng đảm bảo dịch vụ Ollama đang chạy với mô hình qwen2.5:7b.'
        );
      } finally {
        if (oldBase) process.env.OLLAMA_BASE_URL = oldBase;
        else delete process.env.OLLAMA_BASE_URL;
      }
    });

    it('Fault 4: When Ollama returns HTTP 500 error status, returns HTTP 503 cleanly', async () => {
      const oldBase = process.env.OLLAMA_BASE_URL;
      process.env.OLLAMA_BASE_URL = `http://127.0.0.1:${mockPort}`;
      callHistory = [];

      customHandler = (_req, res) => {
        res.status(500).json({ error: 'Internal Ollama model error' });
      };

      try {
        const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ raw_text: 'Kiểm tra Ollama 500' }),
        });

        expect(res.status).toBe(503);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain('Không thể kết nối đến máy chủ AI Ollama');
      } finally {
        if (oldBase) process.env.OLLAMA_BASE_URL = oldBase;
        else delete process.env.OLLAMA_BASE_URL;
      }
    });
  });

  // =========================================================================
  // SUITE 4: Live Ollama Integration (qwen2.5:7b) & Schema Integrity
  // =========================================================================
  describe('Suite 4: Live Ollama Verification (qwen2.5:7b)', () => {
    // Helper to validate CandidateQuestionFormatted contract
    const verifyCandidateQuestionContract = (q: CandidateQuestionFormatted) => {
      expect(typeof q.stem).toBe('string');
      expect(q.stem.trim().length).toBeGreaterThan(0);

      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toHaveLength(4);
      for (const opt of q.options) {
        expect(typeof opt).toBe('string');
        expect(opt.trim().length).toBeGreaterThan(0);
        // Prefix stripped check: shouldn't start with "A. "
        expect(opt).not.toMatch(/^[A-D]\.\s+/);
      }

      expect(typeof q.answer_idx).toBe('number');
      expect(q.answer_idx).toBeGreaterThanOrEqual(0);
      expect(q.answer_idx).toBeLessThanOrEqual(3);

      expect(typeof q.explanation_vi).toBe('string');
      expect(q.explanation_vi.trim().length).toBeGreaterThan(0);

      expect(typeof q.level).toBe('number');
      expect(q.level).toBeGreaterThanOrEqual(1);
      expect(q.level).toBeLessThanOrEqual(6);

      expect(['reading', 'listening', 'writing']).toContain(q.skill);
    };

    it('Live 1: Parses live ChatGPT-style input with target word and Vietnamese explanation', async () => {
      const input = `
      1. 我昨天买了一____新电脑。
      A. 台
      B. 张
      C. 本
      D. 个
      Đáp án đúng: A
      Giải thích: Lượng từ cho thiết bị điện tử, máy tính là 台.
      `;

      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          raw_text: input,
          default_level: 2,
          default_skill: 'reading',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);

      const q = data.questions[0];
      verifyCandidateQuestionContract(q);
      expect(q.stem).toContain('电脑');
      expect(q.options).toContain('台');
      expect(q.answer_idx).toBe(0);

      // Verify formatted_json is valid JSON
      const parsedFromFormattedJson = JSON.parse(data.formatted_json);
      expect(Array.isArray(parsedFromFormattedJson)).toBe(true);
      expect(parsedFromFormattedJson[0].stem).toBe(q.stem);
    }, 45000);

    it('Live 2: Parses live Claude markdown format with bold headers and bullets', async () => {
      const input = `
      ### Đề thi mẫu HSK 3:
      **Câu hỏi:** 虽然工作很累，____他依然坚持每天学汉语。
      - **A.** 但是
      - **B.** 因为
      - **C.** 所以
      - **D.** 如果
      **Đáp án:** A
      **Giải thích:** Cặp từ liên kết 虽然...但是... biểu thị quan hệ chuyển ngoặt (tuy... nhưng...).
      `;

      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          raw_text: input,
          default_level: 3,
          default_skill: 'reading',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);

      const q = data.questions[0];
      verifyCandidateQuestionContract(q);
      expect(q.stem).toContain('虽然');
      expect(q.options).toContain('但是');
      expect(q.answer_idx).toBe(0);
      expect(q.level).toBe(3);
    }, 45000);

    it('Live 3: Parses live mixed Vietnamese-Chinese dialogue format', async () => {
      const input = `
      甲：你什么时候去北京？
      乙：我打算下个____去。
      A. 星期
      B. 昨天
      C. 去年
      D. 钟头
      Đáp án: A
      Giải thích: 下个 (tiếp theo) kết hợp với 星期 (tuần sau).
      `;

      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          raw_text: input,
          default_level: 2,
          default_skill: 'listening',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);

      const q = data.questions[0];
      verifyCandidateQuestionContract(q);
      expect(q.stem).toContain('北京');
      expect(q.options).toContain('星期');
      expect(q.answer_idx).toBe(0);
      expect(q.skill).toBe('listening');
    }, 45000);
  });

  // =========================================================================
  // SUITE 5: Empirical Adversarial Failure Modes & Bug Demonstrations
  // =========================================================================
  describe('Suite 5: Empirical Adversarial Failure Modes & Bug Demonstrations', () => {
    it('Bug 1: Full-width Chinese letters (Ｂ, Ｃ, Ｄ) in answer string fail /^[A-Da-d]/ and silently corrupt to 0 (A)', () => {
      // In HSK Chinese exams, answers are frequently formatted with full-width letters Ａ, Ｂ, Ｃ, Ｄ.
      // Currently, qbankRoutes.ts line 1875 checks item.answer.trim().match(/^[A-Da-d]/), which only matches ASCII half-width.
      // Consequently, answer "Ｂ" fails to match and silently defaults to 0 (A), causing silent question corruption!
      const raw = JSON.stringify([
        {
          stem: '李经理今天下午要去机场接一位重要的客人。',
          options: ['接', '送', '找', '看'],
          answer: 'Ｂ', // Full-width B (\uFF22)
          explanation_vi: 'Đáp án là 送 (B)',
        },
      ]);

      const questions = extractAndNormalizeCandidateQuestions(raw, 3, 'reading');
      expect(questions).toHaveLength(1);
      // Bug: questions[0].answer_idx is currently 0, when it SHOULD be 1
      expect(questions[0].answer_idx).toBe(1);
    });

    it('Bug 2: Full-width option prefixes (Ａ., Ｂ.) and full-width colon (A：) fail to be stripped from options', () => {
      // In qbankRoutes.ts line 1860, the regex only matches half-width [A-Fa-f] and half-width [\\)\]）\\.\\:、\\s\\-].
      // Full-width letters Ａ-Ｄ (\uFF21-\uFF24) and full-width colon ： (\uFF1A) or full-width dot ． (\uFF0E) are not stripped.
      const raw = JSON.stringify([
        {
          stem: '大夫，我的肚子很____。',
          options: ['Ａ. 疼', 'Ｂ. 高', 'Ｃ. 新', 'Ｄ. 冷'],
          answer_idx: 0,
        },
      ]);

      const questions = extractAndNormalizeCandidateQuestions(raw, 3, 'reading');
      expect(questions).toHaveLength(1);
      // Bug: Currently returns ['Ａ. 疼', 'Ｂ. 高', 'Ｃ. 新', 'Ｄ. 冷']
      expect(questions[0].options).toEqual(['疼', '高', '新', '冷']);
    });

    it('Bug 3: Options formatted as dictionary/object { "A": "...", "B": "..." } yields empty options array', () => {
      // LLMs frequently output options as a dictionary { "A": "选项1", "B": "选项2", ... }
      // In qbankRoutes.ts line 1856, only Array.isArray and typeof string are checked, leaving options as []
      const raw = JSON.stringify([
        {
          stem: '他是我的____。',
          options: {
            A: '老师',
            B: '学生',
            C: '医生',
            D: '司机',
          },
          answer_idx: 0,
        },
      ]);

      const questions = extractAndNormalizeCandidateQuestions(raw, 1, 'reading');
      expect(questions).toHaveLength(1);
      // Bug: Currently returns []
      expect(questions[0].options).toEqual(['老师', '学生', '医生', '司机']);
    });

    it('Bug 4: Loose JSON wrapped in data.questions or data.items fails to unwrap and returns empty array', () => {
      // APIs or wrappers often return { code: 200, data: { questions: [...] } }
      // qbankRoutes.ts line 1845 checks parsed.data, but does not check parsed.data.questions or parsed.data.items if data is an object
      const raw = JSON.stringify({
        code: 200,
        data: {
          questions: [
            {
              stem: '测试题目',
              options: ['A', 'B', 'C', 'D'],
              answer_idx: 0,
            },
          ],
        },
      });

      const questions = extractAndNormalizeCandidateQuestions(raw, 1, 'reading');
      // Bug: Currently returns length 0
      expect(questions).toHaveLength(1);
    });

    it('Bug 5: Chinese prefixed answer format (【答案】B or 答案：C) fails to parse and corrupts to 0 (A)', () => {
      // Chinese exam dumps use "答案：C" or "【答案】C"
      // qbankRoutes.ts line 1875 checks item.answer.trim().match(/^[A-Da-d]/), which requires the letter at the start
      const raw = JSON.stringify([
        {
          stem: '李经理今天去哪里？',
          options: ['学校', '医院', '机场', '银行'],
          answer: '【答案】C',
          explanation_vi: 'Giải thích',
        },
      ]);

      const questions = extractAndNormalizeCandidateQuestions(raw, 2, 'reading');
      expect(questions).toHaveLength(1);
      // Bug: Currently returns 0 instead of 2 (C)
      expect(questions[0].answer_idx).toBe(2);
    });
  });
});

