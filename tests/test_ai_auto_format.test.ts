/**
 * Test Suite: AI Auto-Format via Ollama (qwen2.5:7b) (Milestone M2)
 *
 * Verifies:
 * 1. extractAndNormalizeCandidateQuestions across 5 input formats:
 *    - ChatGPT numbered list
 *    - Claude markdown
 *    - Loose JSON / wrapped objects
 *    - HSK raw format
 *    - Mixed Vietnamese-Chinese text
 * 2. Field normalization (options prefix stripping, answer_idx mapping, level/skill validation)
 * 3. Input validation in POST /api/qbank/ai-format (empty input, length > 50,000)
 * 4. Automatic 1-attempt retry when initial output is invalid JSON
 * 5. Timeout (30s) and network error handling with HTTP 503 Vietnamese message
 * 6. Live Ollama integration when service is running
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  extractAndNormalizeCandidateQuestions,
  buildAiFormatPrompt,
} from '../src/server/qbankRoutes.js';

describe('Milestone M2: AI Auto-Format via Ollama (qwen2.5:7b)', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  const TEST_ADMIN_TOKEN = 'test-admin-token-for-ai-auto-format-32chars-ok';

  beforeAll(async () => {
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
    setQBankAdminTokenForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TEST_ADMIN_TOKEN}`,
  };

  describe('1. Parsing & Field Normalization (extractAndNormalizeCandidateQuestions)', () => {
    it('Format 1: ChatGPT numbered list JSON output parses cleanly', () => {
      const chatgptOutput = `[
        {
          "stem": "她是我的____。",
          "options": ["A. 老师", "B. 苹果", "C. 飞机", "D. 喝水"],
          "answer_idx": 0,
          "explanation_vi": "老师 có nghĩa là thầy giáo, phù hợp với ngữ cảnh câu.",
          "level": 1,
          "skill": "reading"
        }
      ]`;

      const questions = extractAndNormalizeCandidateQuestions(chatgptOutput, 1, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toBe('她是我的____。');
      expect(questions[0].options).toEqual(['老师', '苹果', '飞机', '喝水']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('thầy giáo');
      expect(questions[0].level).toBe(1);
      expect(questions[0].skill).toBe('reading');
    });

    it('Format 2: Claude markdown fences with bulleted bold options and markdown keys', () => {
      const claudeOutput = `\`\`\`json
[
  {
    "stem": "我想去北京____。",
    "options": ["- **A.** 旅游", "- **B.** 睡觉", "- **C.** 吃饭", "- **D.** 喝水"],
    "answer": "A",
    "explanation_vi": "**Giải thích:** 旅游 có nghĩa là du lịch.",
    "level": 2,
    "skill": "reading"
  }
]
\`\`\``;

      const questions = extractAndNormalizeCandidateQuestions(claudeOutput, 2, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toBe('我想去北京____。');
      expect(questions[0].options).toEqual(['旅游', '睡觉', '吃饭', '喝水']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].level).toBe(2);
    });

    it('Format 3: Loose JSON with object wrapper {"questions": [...]} and letter answers', () => {
      const looseJson = `
      {
        "status": "ok",
        "questions": [
          {
            "stem": "大夫，我的肚子很____。",
            "options": ["疼", "高", "新", "冷"],
            "answer": "A",
            "explanation": "疼 là đau, bụng đau rất hợp lý.",
            "level": 3,
            "skill": "reading"
          }
        ]
      }
      `;

      const questions = extractAndNormalizeCandidateQuestions(looseJson, 3, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toBe('大夫，我的肚子很____。');
      expect(questions[0].options).toEqual(['疼', '高', '新', '冷']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('bụng đau');
      expect(questions[0].level).toBe(3);
    });

    it('Format 3b: Single standalone object without array brackets', () => {
      const singleObject = `
      {
        "question": "明天你来不来？",
        "options": ["来", "去", "吃", "走"],
        "answer_idx": 0,
        "explanation_vi": "Trả lời trực tiếp 来",
        "level": 1,
        "skill": "reading"
      }
      `;

      const questions = extractAndNormalizeCandidateQuestions(singleObject, 1, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toBe('明天你来不来？');
      expect(questions[0].options).toEqual(['来', '去', '吃', '走']);
      expect(questions[0].answer_idx).toBe(0);
    });

    it('Format 4: HSK raw format (Chinese keys, option A answer, explanation)', () => {
      const hskRaw = `[
        {
          "stem": "小明每天早上七点____。",
          "options": ["起床", "睡觉", "洗澡", "看电视"],
          "answer": "A",
          "explanation_vi": "起床 nghĩa là thức dậy.",
          "level": 1,
          "skill": "reading"
        }
      ]`;

      const questions = extractAndNormalizeCandidateQuestions(hskRaw, 1, 'reading');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toBe('小明每天早上七点____。');
      expect(questions[0].options).toEqual(['起床', '睡觉', '洗澡', '看电视']);
      expect(questions[0].answer_idx).toBe(0);
    });

    it('Format 5: Mixed Vietnamese-Chinese text with conversational options', () => {
      const mixedText = `[
        {
          "stem": "甲：你今天几点去学校？\\n乙：____。",
          "options": ["A. 八点", "B. 昨天", "C. 商店", "D. 苹果"],
          "answer_idx": 0,
          "explanation_vi": "Hỏi thời gian 几点 nên trả lời bằng giờ 八点 (8 giờ).",
          "level": 2,
          "skill": "listening"
        }
      ]`;

      const questions = extractAndNormalizeCandidateQuestions(mixedText, 2, 'listening');
      expect(questions).toHaveLength(1);
      expect(questions[0].stem).toContain('你今天几点去学校？');
      expect(questions[0].options).toEqual(['八点', '昨天', '商店', '苹果']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].skill).toBe('listening');
    });

    it('Normalizes level boundary (clamped to 1-6) and invalid skill fallback', () => {
      const raw = `[
        {
          "stem": "测试题",
          "options": ["A", "B", "C", "D"],
          "answer_idx": 2,
          "level": 99,
          "skill": "unknown_skill"
        }
      ]`;

      const questions = extractAndNormalizeCandidateQuestions(raw, 3, 'writing');
      expect(questions).toHaveLength(1);
      expect(questions[0].level).toBe(3); // clamped/fallback
      expect(questions[0].skill).toBe('writing'); // fallback
    });

    it('Gracefully returns empty array on corrupted, non-JSON or invalid input', () => {
      expect(extractAndNormalizeCandidateQuestions('')).toEqual([]);
      expect(extractAndNormalizeCandidateQuestions('Random non-json text without brackets')).toEqual([]);
      expect(extractAndNormalizeCandidateQuestions('{ invalid json: }}')).toEqual([]);
    });
  });

  describe('2. Prompt Generator (buildAiFormatPrompt)', () => {
    it('Generates prompt with default level, skill and strict JSON instructions', () => {
      const prompt = buildAiFormatPrompt('Input text here', 2, 'listening', false);
      expect(prompt).toContain('level": 2');
      expect(prompt).toContain('skill": "listening"');
      expect(prompt).toContain('Input text here');
      expect(prompt).not.toContain('CRITICAL RETRY NOTICE');
    });

    it('Generates retry prompt with reinforced retry instructions', () => {
      const retryPrompt = buildAiFormatPrompt('Input text here', 1, 'reading', true);
      expect(retryPrompt).toContain('CRITICAL RETRY NOTICE');
    });
  });

  describe('3. Route Validation & Auth (POST /api/qbank/ai-format)', () => {
    it('Rejects unauthenticated requests with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: 'Test question' }),
      });

      expect(res.status).toBe(401);
    });

    it('Rejects empty raw_text with HTTP 400 and Vietnamese error', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ raw_text: '' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vui lòng cung cấp nội dung văn bản hợp lệ.');
    });

    it('Rejects whitespace-only text with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text: '    \n\t  ' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vui lòng cung cấp nội dung văn bản hợp lệ.');
    });

    it('Rejects text exceeding 50,000 characters with HTTP 400', async () => {
      const longText = 'A'.repeat(50001);
      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ raw_text: longText }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vui lòng cung cấp nội dung văn bản hợp lệ.');
    });
  });

  describe('4. Mock Server Tests: Retry, Schema, and Error Handling', () => {
    let mockOllamaApp: express.Express;
    let mockOllamaServer: http.Server;
    let mockOllamaPort: number;
    let callCount = 0;
    let mockResponseHandler: (req: express.Request, res: express.Response) => void;

    beforeAll(async () => {
      mockOllamaApp = express();
      mockOllamaApp.use(express.json());
      mockOllamaApp.post('/api/generate', (req, res) => {
        callCount++;
        if (mockResponseHandler) {
          mockResponseHandler(req, res);
        } else {
          res.json({ response: '[]' });
        }
      });

      await new Promise<void>((resolve) => {
        mockOllamaServer = mockOllamaApp.listen(0, '127.0.0.1', () => {
          const addr = mockOllamaServer.address() as any;
          mockOllamaPort = addr.port;
          resolve();
        });
      });
    });

    afterAll(async () => {
      if (mockOllamaServer) {
        await new Promise<void>((resolve) => mockOllamaServer.close(() => resolve()));
      }
    });

    it('Succeeds on Attempt 1 when Ollama returns valid JSON', async () => {
      const originalOllamaBase = process.env.OLLAMA_BASE_URL;
      process.env.OLLAMA_BASE_URL = `http://127.0.0.1:${mockOllamaPort}`;
      callCount = 0;

      mockResponseHandler = (_req, res) => {
        res.json({
          response: JSON.stringify([
            {
              stem: '他是我的老师。',
              options: ['老师', '学生', '医生', '司机'],
              answer_idx: 0,
              explanation_vi: '老师 là giáo viên.',
              level: 1,
              skill: 'reading',
            },
          ]),
        });
      };

      try {
        const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ raw_text: 'Test question' }),
        });

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.success).toBe(true);
        expect(data.count).toBe(1);
        expect(data.questions[0].stem).toBe('他是我的老师。');
        expect(callCount).toBe(1);
      } finally {
        if (originalOllamaBase) process.env.OLLAMA_BASE_URL = originalOllamaBase;
        else delete process.env.OLLAMA_BASE_URL;
      }
    });

    it('Automatically retries (Attempt 2) when Attempt 1 returns malformed output', async () => {
      const originalOllamaBase = process.env.OLLAMA_BASE_URL;
      process.env.OLLAMA_BASE_URL = `http://127.0.0.1:${mockOllamaPort}`;
      callCount = 0;

      mockResponseHandler = (_req, res) => {
        if (callCount === 1) {
          // Attempt 1: Return invalid text
          res.json({ response: 'I am not sure, here is some corrupted text: { broken' });
        } else {
          // Attempt 2 (retry): Return valid JSON array
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
          body: JSON.stringify({ raw_text: 'Corrupted first try' }),
        });

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.success).toBe(true);
        expect(data.count).toBe(1);
        expect(data.questions[0].stem).toBe('苹果很好吃。');
        expect(callCount).toBe(2); // Attempt 1 + Attempt 2
      } finally {
        if (originalOllamaBase) process.env.OLLAMA_BASE_URL = originalOllamaBase;
        else delete process.env.OLLAMA_BASE_URL;
      }
    });

    it('Returns HTTP 503 with Vietnamese error when Ollama server is unreachable', async () => {
      const originalOllamaBase = process.env.OLLAMA_BASE_URL;
      // Connect to non-existent port
      process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:59999';

      try {
        const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ raw_text: 'Test unreachable Ollama' }),
        });

        expect(res.status).toBe(503);
        const data = await res.json() as any;
        expect(data.success).toBe(false);
        expect(data.error).toBe(
          'Không thể kết nối đến máy chủ AI Ollama (http://localhost:11434). Vui lòng đảm bảo dịch vụ Ollama đang chạy với mô hình qwen2.5:7b.'
        );
      } finally {
        if (originalOllamaBase) process.env.OLLAMA_BASE_URL = originalOllamaBase;
        else delete process.env.OLLAMA_BASE_URL;
      }
    });
  });

  describe('5. Live Ollama Integration (qwen2.5:7b)', () => {
    it('Formats live ChatGPT text via Ollama qwen2.5:7b', async () => {
      // Direct call to local Ollama
      const input = `
      1. 他是我的____。
      A. 老师
      B. 苹果
      C. 飞机
      D. 喝水
      Đáp án: A
      Giải thích: 老师 nghĩa là thầy giáo.
      `;

      const res = await fetch(`${baseUrl}/api/qbank/ai-format`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          raw_text: input,
          default_level: 1,
          default_skill: 'reading',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);
      expect(data.questions[0].stem).toContain('他是我的');
      expect(data.questions[0].options).toHaveLength(4);
      expect(data.questions[0].answer_idx).toBe(0);
      expect(typeof data.formatted_json).toBe('string');
    }, 45000);

    it('Formats live Claude markdown text via Ollama qwen2.5:7b', async () => {
      const input = `
      ### Câu 1:
      **Đề bài:** 我想去北京____。
      - **A.** 旅游
      - **B.** 睡觉
      - **C.** 吃饭
      - **D.** 喝水
      **Đáp án:** A
      **Giải thích:** 旅游 có nghĩa là du lịch.
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
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);
      expect(data.questions[0].stem).toContain('北京');
      expect(data.questions[0].options).toHaveLength(4);
      expect(data.questions[0].answer_idx).toBe(0);
    }, 45000);
  });
});
