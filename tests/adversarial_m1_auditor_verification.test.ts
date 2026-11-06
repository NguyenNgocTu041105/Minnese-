/**
 * Independent Forensic Adversarial Verification Suite for Milestone M1
 * Author: auditor_m1 (Forensic Integrity Auditor)
 *
 * Stress-tests worker_m1's implementation against adversarial variants:
 * 1. Claude Markdown syntax permutations (asterisks, bullets, answer bolding, header variants).
 * 2. File upload extension casing, malicious extensions, and buffer limit boundaries.
 * 3. Text length threshold exact boundaries (50,000 vs 50,001 chars).
 * 4. Database hash and schema integrity invariance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';

describe('Forensic Adversarial Audit: Milestone M1 Hardening', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let testDb: DatabaseSync;
  const TEST_TOKEN = 'forensic-auditor-token-2026';

  beforeAll(async () => {
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    setDbSyncForTesting(testDb);
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

  describe('Adversarial Claude Markdown Parser Permutations', () => {
    it('Permutation A: Asterisk bullets (* **A.**) and bold-wrapped answer (**Đáp án: B**)', () => {
      const input = `
### Câu 1:
**Đề bài:** 他是我的____。
* **A.** 老师
* **B.** 苹果
* **C.** 飞机
* **D.** 喝水
**Đáp án: A**
**Giải thích:** 老师 có nghĩa là thầy giáo.
`;
      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('他是我的____。');
      expect(questions[0].options).toEqual(['老师', '苹果', '飞机', '喝水']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].explanation_vi).toContain('thầy giáo');
    });

    it('Permutation B: Double bold in answer (**Đáp án:** **C**) and dash bullets (- **A.**)', () => {
      const input = `
### Câu 2:
**Đề bài:** 我坐____去北京。
- **A.** 吃饭
- **B.** 喝茶
- **C.** 飞机
- **D.** 很高
**Đáp án:** **C**
**Giải thích:** 飞机 có nghĩa là máy bay.
`;
      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('我坐____去北京。');
      expect(questions[0].options).toEqual(['吃饭', '喝茶', '飞机', '很高']);
      expect(questions[0].answer_idx).toBe(2);
      expect(questions[0].explanation_vi).toContain('máy bay');
    });

    it('Permutation C: Multi-question block with mixed spacing, indentation, and header formatting', () => {
      const input = `
**Câu 1:**
- **A.** 很好
- **B.** 电脑
- **C.** 学习
- **D.** 早上
**Đáp án:** A
**Giải thích:** Rất tốt

### Câu 2:
**Đề bài:** 我在学校____书。
- **A.** 看
- **B.** 听
- **C.** 吃
- **D.** 去
**Đáp án:** A
**Giải thích:** Đọc sách tại trường
`;
      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(2);
      expect(questions[0].options[0]).toBe('很好');
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[1].stem).toBe('我在学校____书。');
      expect(questions[1].options[0]).toBe('看');
      expect(questions[1].answer_idx).toBe(0);
    });

    it('Permutation D: Clean multiline Vietnamese explanation under Claude format', () => {
      const input = `
### Câu 1:
**Đề bài:** 昨天天气____。
- **A.** 很好
- **B.** 电脑
- **C.** 飞机
- **D.** 医院
**Đáp án:** A
**Giải thích:**
Dòng 1: Thời tiết hôm qua rất tốt.
Dòng 2: Phân tích bổ sung về ngữ cảnh.
`;
      const questions = parseUniversalQuestions(input);
      expect(questions.length).toBe(1);
      expect(questions[0].explanation_vi).toContain('Thời tiết hôm qua rất tốt.');
      expect(questions[0].explanation_vi).toContain('Phân tích bổ sung');
    });
  });

  describe('Adversarial File Upload Security & Boundary Checks', () => {
    it('Case-insensitive extension matching (.TXT, .JSON) should be accepted', async () => {
      const txt = 'Câu 1: 他是____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A';
      const base64 = Buffer.from(txt).toString('base64');
      const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'TEST_FILE.TXT',
          file_type: 'TXT',
          file_base64: base64,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(1);
    });

    it('Case-insensitive forbidden extension (.MP3, .PNG, .EXE) must be rejected with 400', async () => {
      const dummy = Buffer.from('binary-data').toString('base64');

      for (const ext of ['MP3', 'png', 'EXE', 'sh']) {
        const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
          body: JSON.stringify({
            file_name: `malicious.${ext}`,
            file_base64: dummy,
          }),
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('không được hỗ trợ');
      }
    });

    it('Exact buffer boundary check: <= 10MB vs > 10MB', async () => {
      // Exactly 10MB buffer
      const tenMbBuf = Buffer.alloc(10 * 1024 * 1024, ' ');
      const res10Mb = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'ten_mb.txt',
          file_type: 'txt',
          file_base64: tenMbBuf.toString('base64'),
        }),
      });
      // Should not be rejected by size guard (status 200, parses 0 questions from spaces)
      expect(res10Mb.status).toBe(200);

      // 10MB + 1 byte buffer
      const overTenMbBuf = Buffer.alloc(10 * 1024 * 1024 + 1, ' ');
      const resOver = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          file_name: 'over_ten_mb.txt',
          file_type: 'txt',
          file_base64: overTenMbBuf.toString('base64'),
        }),
      });
      expect(resOver.status).toBe(400);
      const dataOver = await resOver.json();
      expect(dataOver.error).toContain('vượt quá giới hạn cho phép (tối đa 10MB)');
    });
  });

  describe('Adversarial Text Input Thresholds', () => {
    it('Exact text boundary: 50,000 chars accepted vs 50,001 chars rejected (400)', async () => {
      // Exactly 50,000 characters
      const exactly50k = 'A'.repeat(50000);
      const res50k = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: exactly50k }),
      });
      // Not rejected by length guard; returns 200 with 0 parsed
      expect(res50k.status).toBe(200);
      const data50k = await res50k.json();
      expect(data50k.success).toBe(true);
      expect(data50k.total_parsed).toBe(0);

      // 50,001 characters
      const over50k = 'A'.repeat(50001);
      const resOver50k = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({ text: over50k }),
      });
      expect(resOver50k.status).toBe(400);
      const dataOver50k = await resOver50k.json();
      expect(dataOver50k.success).toBe(false);
      expect(dataOver50k.error).toContain('vượt quá 50,000 ký tự');
    });
  });

  describe('Database Integrity and Hash Invariants', () => {
    it('data/hsk_exam.db SHA-256 strictly invariant', () => {
      const dbPath = path.resolve('data/hsk_exam.db');
      const content = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('data/qbank/qbank.db schema integrity preserved', () => {
      const qbankDbPath = path.resolve('data/qbank/qbank.db');
      const liveDb = new DatabaseSync(qbankDbPath, { open: true });
      try {
        const integrity = liveDb.prepare('PRAGMA integrity_check').all() as any[];
        expect(integrity.length).toBe(1);
        expect(integrity[0].integrity_check).toBe('ok');

        const tables = (liveDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]).map((r) => r.name);
        expect(tables).toContain('pending_questions');
        expect(tables).toContain('questions');
        expect(tables).toContain('exam_sessions');
      } finally {
        liveDb.close();
      }
    });
  });
});
