/**
 * Test Suite: QBank OCR Image Question Ingestion Pipeline (Milestone 4 - R4)
 *
 * Verifies:
 * 1. POST /api/qbank/ocr payload validation (missing payload, empty base64, malformed base64).
 * 2. Base64 decoding, MIME sanitization, and text extraction.
 * 3. Vision OCR parsing of Chinese textbook exam questions:
 *    - Reading single choice / fill-in-the-blank
 *    - Listening dialogue with speaker turns (男/女/问)
 * 4. Integration with parseUniversalQuestions() and 6-Gate Quality Validation.
 * 5. Persistence into SQLite pending_questions table:
 *    - status = 'pending'
 *    - provider_used = 'gemini-ocr'
 *    - batch_id starting with 'ocr_'
 * 6. Deduplication via content_hash and near_duplicate_signature.
 * 7. auto_parse option flag (preview vs auto-ingest).
 * 8. Friendly HTTP 422 error rejection on unparseable/blank images.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  setDbSyncForTesting,
  ensurePendingSchema,
} from '../src/server/qbankRoutes.js';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';

describe('Milestone 4 - R4: OCR Question Ingestion Pipeline', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let testDb: DatabaseSync;
  const TEST_ADMIN_TOKEN = 'test-m4-ocr-pipeline-admin-safe-token-64hex';

  beforeAll(async () => {
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    setDbSyncForTesting(testDb);
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

  describe('1. Payload Validation & Error Handling', () => {
    it('rejects missing image payload with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Thiếu dữ liệu hình ảnh');
    });

    it('rejects empty string image payload with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ image: '   ' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Thiếu dữ liệu hình ảnh');
    });

    it('rejects empty data URL prefix with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ image: 'data:image/png;base64,' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('base64 rỗng');
    });

    it('rejects malformed base64 string with invalid characters with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ image: 'data:image/png;base64,not_a_valid_base64!@#$%^&*()' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('không hợp lệ');
    });
  });

  describe('2. Transcribing Chinese Textbook Exam Questions & Question Ingestion', () => {
    it('transcribes and ingests a single-choice fill-in-the-blank question into pending_questions', async () => {
      const sampleExamSheet = [
        'Câu 1: 他每天早上都____跑步。(Tā měitiān zǎoshang dōu ____ pǎobù.)',
        'A. 去',
        'B. 吃',
        'C. 喝',
        'D. 听',
        '',
        'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
        'Câu 1: A. Giải thích: Động từ "去" (đi) kết hợp với "跑步" tạo thành cụm "đi chạy bộ".',
      ].join('\n');

      const base64DataUrl = `data:image/png;base64,${Buffer.from(sampleExamSheet, 'utf-8').toString('base64')}`;

      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          image: base64DataUrl,
          target_level: 2,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.text).toContain('他每天早上都____跑步');
      expect(data.count).toBe(1);
      expect(data.questions.length).toBe(1);

      const q = data.questions[0];
      expect(q.stem).toContain('他每天早上都____跑步');
      expect(q.options).toEqual(['去', '吃', '喝', '听']);
      expect(q.answer_idx).toBe(0);
      expect(q.level).toBe(2);
      expect(q.status).toBe('pending');
      expect(q.provider_used).toBe('gemini-ocr');

      // Verify row exists directly in SQLite pending_questions
      const row: any = testDb.prepare('SELECT * FROM pending_questions WHERE id = ?').get(q.id);
      expect(row).toBeDefined();
      expect(row.stem).toContain('他每天早上都____跑步');
      expect(row.status).toBe('pending');
      expect(row.provider_used).toBe('gemini-ocr');
      expect(row.batch_id).toMatch(/^ocr_/);
    });

    it('transcribes and ingests a listening dialogue question with speaker turns', async () => {
      const sampleListeningSheet = [
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

      const base64DataUrl = `data:image/jpeg;base64,${Buffer.from(sampleListeningSheet, 'utf-8').toString('base64')}`;

      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          image: base64DataUrl,
          target_level: 3,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);

      const q = data.questions[0];
      expect(q.skill).toBe('listening');
      expect(q.part_type).toBe('listen_dialogue_qa_4opt');
      expect(q.options.length).toBe(4);
      expect(q.options[0]).toBe('去图书馆');
      expect(q.answer_idx).toBe(0);
      expect(q.level).toBe(3);

      const row: any = testDb.prepare('SELECT * FROM pending_questions WHERE id = ?').get(q.id);
      expect(row.skill).toBe('listening');
      expect(row.status).toBe('pending');
    });

    it('transcribes multi-question exam exercises and stores all candidate questions', async () => {
      const multiQSheet = [
        'Câu 1: 我____喝茶，不喝咖啡。(Wǒ ____ hē chá, bù hē kāfēi.)',
        'A. 喜欢',
        'B. 是',
        'C. 在',
        'D. 有',
        '',
        'Câu 2: 姐姐在学校工作，她是一位____。(Jiějie zài xuéxiào gōngzuò, tā shì yí wèi ____.)',
        'A. 医生',
        'B. 老师',
        'C. 司机',
        'D. 学生',
        '',
        'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
        'Câu 1: A. Giải thích: Dùng động từ "喜欢" để diễn đạt sở thích uống trà.',
        'Câu 2: B. Giải thích: Làm việc ở trường học (学校) nên chức vụ phù hợp nhất là giáo viên (老师).',
      ].join('\n');

      const base64DataUrl = `data:image/webp;base64,${Buffer.from(multiQSheet, 'utf-8').toString('base64')}`;

      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          image: base64DataUrl,
          target_level: 1,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
      expect(data.questions.length).toBe(2);

      expect(data.questions[0].stem).toContain('我____喝茶');
      expect(data.questions[0].answer_idx).toBe(0);

      expect(data.questions[1].stem).toContain('姐姐在学校工作');
      expect(data.questions[1].answer_idx).toBe(1);
    });
  });

  describe('3. Deduplication & Content Hash Guard', () => {
    it('prevents duplicate insertion when identical OCR content is submitted again', async () => {
      const uniqueSheet = [
        `Câu 1: 这是第${Date.now()}次测试。(Zhè shì dì cì cèshì.)`,
        'A. 对',
        'B. 错',
        '',
        'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
        'Câu 1: A. Giải thích: Câu nhận định hoàn toàn chính xác.',
      ].join('\n');

      const base64DataUrl = `data:image/png;base64,${Buffer.from(uniqueSheet, 'utf-8').toString('base64')}`;

      // First ingestion
      const res1 = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ image: base64DataUrl, target_level: 2 }),
      });
      const data1 = await res1.json();
      expect(data1.success).toBe(true);
      expect(data1.accepted_count).toBe(1);

      // Second ingestion with identical content
      const res2 = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ image: base64DataUrl, target_level: 2 }),
      });
      const data2 = await res2.json();
      expect(data2.success).toBe(true);
      expect(data2.accepted_count).toBe(0);
      expect(data2.rejected_count).toBe(1);
    });
  });

  describe('4. Parameter Options: auto_parse and Target Level', () => {
    it('supports auto_parse = false to extract text without database insertion', async () => {
      const textOnlySheet = [
        'Câu 1: 昨天天气很冷。(Zuótiān tiānqì hěn lěng.)',
        'A. 对',
        'B. 错',
        '',
        'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
        'Câu 1: A. Giải thích: Đúng.',
      ].join('\n');

      const base64DataUrl = `data:image/png;base64,${Buffer.from(textOnlySheet, 'utf-8').toString('base64')}`;

      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          image: base64DataUrl,
          auto_parse: false,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.text).toContain('昨天天气很冷');
      expect(data.count).toBe(0);
      expect(data.questions).toEqual([]);
    });

    it('propagates target_level and default_topic correctly into pending questions', async () => {
      const sheet = [
        'Câu 1: 医院离这里很远，我们需要坐公共汽车去。(Yīyuàn lí zhèlǐ hěn yuǎn.)',
        '问：他们怎么去医院？',
        'A. 坐公共汽车',
        'B. 走路',
        'C. 骑自行车',
        'D. 坐飞机',
        '',
        'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
        'Câu 1: A. Giải thích: Câu nói rõ "需要坐公共汽车去".',
      ].join('\n');

      const base64DataUrl = `data:image/png;base64,${Buffer.from(sheet, 'utf-8').toString('base64')}`;

      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          image: base64DataUrl,
          target_level: 4,
          default_topic: 'Giao thông & Đi lại',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions[0].level).toBe(4);
      expect(data.questions[0].topic).toBe('Giao thông & Đi lại');
    });
  });

  describe('5. Unparseable/Blank Image Rejection', () => {
    it('returns HTTP 422 with friendly error message when receiving unparseable/blank binary image', async () => {
      // Create a 32-byte blank PNG header buffer without text
      const binaryPngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      ]);
      const base64DataUrl = `data:image/png;base64,${binaryPngHeader.toString('base64')}`;

      const res = await fetch(`${baseUrl}/api/qbank/ocr`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          image: base64DataUrl,
          target_level: 1,
        }),
      });

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Không thể nhận diện văn bản tiếng Trung từ hình ảnh. Vui lòng tải lên ảnh chụp bài thi rõ nét hơn.'
      );
    });
  });
});
