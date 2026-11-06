/**
 * Comprehensive Verification Suite for Multi-Source Question Import & Edge Cases (Milestone M1)
 *
 * Verifies all 15+ edge cases specified in ORIGINAL_REQUEST.md (under ## 2026-11-02T20:34:32Z)
 * and DISPATCH.md across File Upload (POST /api/qbank/upload-file) and Text Paste (POST /api/qbank/import).
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

describe('Milestone M1: Comprehensive Import & Upload Edge Cases Test Suite', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let stagingDb: DatabaseSync;
  const TEST_TOKEN = 'm1-worker-test-token-2026';

  beforeAll(async () => {
    stagingDb = new DatabaseSync(':memory:');
    ensurePendingSchema(stagingDb);
    setDbSyncForTesting(stagingDb);
    setQBankAdminTokenForTesting(TEST_TOKEN);

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
    // Clear pending_questions before each test case to prevent cross-test stem collision
    stagingDb.exec('DELETE FROM pending_questions;');
  });

  // =========================================================================
  // FILE UPLOAD EDGE CASES (POST /api/qbank/upload-file)
  // =========================================================================
  describe('File Upload Edge Cases (POST /api/qbank/upload-file)', () => {
    // Case 1: Valid .txt with 5 HSK questions
    it('Case 1: Upload valid .txt file with 5 HSK questions -> 200, parses 5, accepts 5', async () => {
      const txtContent = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: 老师 là thầy giáo.

Câu 2: 桌子上有____本书。
A. 三
B. 看
C. 去
D. 叫
Đáp án: A
Giải thích: 三 là số 3.

Câu 3: 我想____中国菜。
A. 吃
B. 听
C. 读
D. 坐
Đáp án: A
Giải thích: 吃 là ăn.

Câu 4: 昨天天气很____。
A. 好
B. 买
C. 谁
D. 哪
Đáp án: A
Giải thích: 好 là tốt.

Câu 5: 她是我的____。
A. 朋友
B. 电脑
C. 出租车
D. 衣服
Đáp án: A
Giải thích: 朋友 là bạn bè.
      `;
      const base64 = Buffer.from(txtContent, 'utf-8').toString('base64');
      const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'test_5q.txt',
          file_type: 'txt',
          file_base64: base64,
          default_level: 1,
          default_skill: 'reading',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(5);
      expect(data.accepted_count).toBe(5);
      expect(data.rejected_count).toBe(0);
    });

    // Case 2: Valid .json (CandidateQuestion array)
    it('Case 2: Upload valid .json file with CandidateQuestion array -> 200, accepts items', async () => {
      const jsonContent = JSON.stringify([
        {
          stem: '外面下雨了，____很冷。',
          options: ['现在', '医生', '飞机', '汉语'],
          answer_idx: 0,
          explanation_vi: 'Bây giờ rất lạnh.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        },
      ]);
      const base64 = Buffer.from(jsonContent, 'utf-8').toString('base64');
      const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'candidates.json',
          file_type: 'json',
          file_base64: base64,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(1);
      expect(data.accepted_count).toBe(1);
    });

    // Case 3: Empty file (0 bytes)
    it('Case 3: Upload empty file (0 byte buffer) -> 400 with clean error', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'empty.txt',
          file_type: 'txt',
          file_base64: '',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tệp tin rỗng (0 byte).');
    });

    // Case 4: Unsupported extension (.mp3, .png)
    it('Case 4: Upload unsupported file formats (.mp3, .png) -> 400 with whitelist error', async () => {
      const dummyBase64 = Buffer.from('test binary content').toString('base64');

      // Test .mp3
      const resMp3 = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'audio_track.mp3',
          file_type: 'mp3',
          file_base64: dummyBase64,
        }),
      });
      expect(resMp3.status).toBe(400);
      const dataMp3 = await resMp3.json();
      expect(dataMp3.success).toBe(false);
      expect(dataMp3.error).toContain('.mp3 không được hỗ trợ');

      // Test .png
      const resPng = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'image.png',
          file_type: 'png',
          file_base64: dummyBase64,
        }),
      });
      expect(resPng.status).toBe(400);
      const dataPng = await resPng.json();
      expect(dataPng.success).toBe(false);
      expect(dataPng.error).toContain('.png không được hỗ trợ');
    });

    // Case 5: File > 10MB
    it('Case 5: Upload file exceeding 10MB -> 400 with size limit error', async () => {
      // 10.5 MB buffer
      const largeBuffer = Buffer.alloc(10.5 * 1024 * 1024, 'a');
      const base64 = largeBuffer.toString('base64');
      const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'large_data.txt',
          file_type: 'txt',
          file_base64: base64,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Kích thước tệp tin vượt quá giới hạn cho phép (tối đa 10MB).');
    });

    // Case 6: Corrupt binary file
    it('Case 6: Upload corrupt binary file (random bytes) -> gracefully handled without crashing server', async () => {
      const corruptBinary = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x99, 0x88, 0x77, 0x00, 0x12, 0xff, 0xfe]);
      const base64 = corruptBinary.toString('base64');

      // Corrupt docx/xlsx file
      const resDocx = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'corrupt.docx',
          file_type: 'docx',
          file_base64: base64,
        }),
      });
      // Should return either 400 or 200 with 0 questions parsed, never crashing
      expect([200, 400]).toContain(resDocx.status);
      const dataDocx = await resDocx.json();
      expect(typeof dataDocx).toBe('object');

      // Corrupt txt file
      const resTxt = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'corrupt.txt',
          file_type: 'txt',
          file_base64: base64,
        }),
      });
      expect(resTxt.status).toBe(200);
      const dataTxt = await resTxt.json();
      expect(dataTxt.total_parsed).toBe(0);
    });

    // Case 7: File with duplicate questions (duplicate detection check)
    it('Case 7: Upload file with duplicate questions -> detects duplicates and reports rejected_count', async () => {
      const duplicateContent = `
Câu 1: 这是谁的书包？
A. 我的
B. 电脑
C. 吃饭
D. 医生
Đáp án: A
Giải thích: Sách của tôi

Câu 2: 这是谁的书包？
A. 我的
B. 电脑
C. 吃饭
D. 医生
Đáp án: A
Giải thích: Sách của tôi
      `;
      const base64 = Buffer.from(duplicateContent, 'utf-8').toString('base64');
      const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'duplicates.txt',
          file_type: 'txt',
          file_base64: base64,
          default_level: 1,
          default_skill: 'reading',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(2);
      expect(data.accepted_count).toBe(1);
      expect(data.rejected_count).toBe(1);
      expect(data.results[1].passed).toBe(false);
      expect(data.results[1].gates?.gate5_uniqueness?.passed).toBe(false);
    });

    // Case 8: File with questions missing required fields
    it('Case 8: Upload file with questions missing required fields -> caught by Gate 1, rejected cleanly without server crash', async () => {
      // 8a: Question missing stem
      const missingStemJson = JSON.stringify([{ stem: '', options: ['A', 'B', 'C', 'D'], answer_idx: 0 }]);
      const resStem = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'missing_stem.json',
          file_type: 'json',
          file_base64: Buffer.from(missingStemJson).toString('base64'),
        }),
      });
      expect(resStem.status).toBe(200);
      const dataStem = await resStem.json();
      expect(dataStem.total_parsed).toBe(0);
      expect(dataStem.message).toContain('Không tìm thấy câu hỏi hợp lệ trong tệp tin đã tải lên.');

      // 8b: Question missing required options (only 1 option -> parser safely returns 0 parsed questions)
      const oneOptTxt = 'Câu 1: 这是什么？\nA. 苹果\nĐáp án: A';
      const resOpt = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'missing_options.txt',
          file_type: 'txt',
          file_base64: Buffer.from(oneOptTxt).toString('base64'),
        }),
      });
      expect(resOpt.status).toBe(200);
      const dataOpt = await resOpt.json();
      expect(dataOpt.total_parsed).toBe(0);
      expect(dataOpt.message).toContain('Không tìm thấy câu hỏi hợp lệ trong tệp tin đã tải lên.');

      // 8c: Question with incomplete options for 4-option part type (2 options instead of 4) -> Gate 1 rejects
      const twoOptTxt = 'Câu 1: 这是我的____。\nA. 苹果\nB. 电脑\nĐáp án: A\nGiải thích: Quả táo';
      const resTwoOpt = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'incomplete_2opt.txt',
          file_type: 'txt',
          file_base64: Buffer.from(twoOptTxt).toString('base64'),
          default_part_type: 'read_fill_blank_4opt',
          strict_gates: true,
        }),
      });
      expect(resTwoOpt.status).toBe(200);
      const dataTwoOpt = await resTwoOpt.json();
      expect(dataTwoOpt.total_parsed).toBe(1);
      expect(dataTwoOpt.accepted_count).toBe(0);
      expect(dataTwoOpt.rejected_count).toBe(1);
      expect(dataTwoOpt.results[0].passed).toBe(false);
      expect(dataTwoOpt.results[0].gates?.gate1_schema?.passed).toBe(false);
    });
  });

  // =========================================================================
  // TEXT PASTE EDGE CASES (POST /api/qbank/import)
  // =========================================================================
  describe('Text Paste Edge Cases (POST /api/qbank/import)', () => {
    // Case 9: JSON array standard CandidateQuestion
    it('Case 9: Paste JSON array of standard CandidateQuestion -> 200, parses and accepts', async () => {
      const jsonText = JSON.stringify([
        {
          stem: '我想去商场____一件衬衫。',
          options: ['买', '写', '听', '画'],
          answer_idx: 0,
          explanation_vi: 'Mua một chiếc áo sơ mi.',
          level: 2,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        },
      ]);

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: jsonText }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(1);
      expect(data.accepted_count).toBe(1);
    });

    // Case 10: Output format from ChatGPT (numbered list)
    it('Case 10: Paste ChatGPT output format (numbered list) -> 200, parses correctly', async () => {
      const chatgptText = `
1. 你的汉语老师是哪国人？
A. 中国人
B. 汉语
C. 飞机
D. 谢谢
Đáp án: A
Giải thích: Giáo viên Trung Quốc

2. 他正在睡觉呢，别____他。
A. 打扰
B. 苹果
C. 喝水
D. 衣服
Đáp án: A
Giải thích: Đừng làm phiền anh ấy
      `;

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: chatgptText }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(2);
      expect(data.accepted_count).toBe(2);
    });

    // Case 11: Output format from Claude (markdown format)
    it('Case 11: Paste Claude output format (markdown ###, - **A.**, **Đáp án:**, **Giải thích:**) -> 200, parses accurately', async () => {
      const claudeText = `
### Câu 1:
**Đề bài:** 他是我的____。
- **A.** 老师
- **B.** 苹果
- **C.** 飞机
- **D.** 喝水
**Đáp án:** A
**Giải thích:** 老师 có nghĩa là thầy giáo.

### Câu 2:
**Đề bài:** 我____中国菜。
- **A.** 喜欢
- **B.** 桌子
- **C.** 昨天
- **D.** 认识
**Đáp án:** A
**Giải thích:** 喜欢 có nghĩa là thích.
      `;

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: claudeText }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(2);
      expect(data.accepted_count).toBe(2);
      expect(data.results[0].question.stem).toBe('他是我的____。');
      expect(data.results[0].question.options[0]).toBe('老师');
      expect(data.results[0].question.answer_idx).toBe(0);
      expect(data.results[1].question.stem).toBe('我____中国菜。');
      expect(data.results[1].question.options[0]).toBe('喜欢');
    });

    // Case 12: Empty text
    it('Case 12: Paste empty text -> 200, returns total_parsed 0 without errors', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: '' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(0);
      expect(data.accepted_count).toBe(0);
      expect(data.message).toContain('Không tìm thấy câu hỏi hợp lệ trong nội dung đã nhập.');
    });

    // Case 13: Text too long (>50,000 chars)
    it('Case 13: Paste text exceeding 50,000 characters -> 400 with length error', async () => {
      const longText = 'Câu 1: 他是老师。\nA. 对\nB. 错\n'.repeat(2500); // > 60,000 characters
      expect(longText.length).toBeGreaterThan(50000);

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: longText }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Nội dung văn bản quá dài (vượt quá 50,000 ký tự).');
    });

    // Case 14: Invalid JSON
    it('Case 14: Paste invalid JSON -> falls back gracefully, returns 200 without crashing', async () => {
      const malformedJson = '{"stem": "他是老师", "options": ["A", "B",}';

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: malformedJson }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(0);
    });

    // Case 15: Questions with only 2 options (missing C, D) for 4-option part type
    it('Case 15: Paste questions with only 2 options (missing C, D) for 4-opt part -> Gate 1 rejects cleanly', async () => {
      const twoOptText = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
Đáp án: A
Giải thích: Chỉ có 2 phương án
      `;

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          text: twoOptText,
          default_part_type: 'read_fill_blank_4opt',
          strict_gates: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total_parsed).toBe(1);
      expect(data.accepted_count).toBe(0);
      expect(data.rejected_count).toBe(1);
      expect(data.results[0].passed).toBe(false);
      expect(data.results[0].gates?.gate1_schema?.passed).toBe(false);
    });
  });
});
