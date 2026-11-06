/**
 * Adversarial Challenger M1.2: POST /api/qbank/upload-file Empirical Stress Verification
 *
 * Exhaustive adversarial attack suite covering:
 * 1. Truncated zip/docx buffers, corrupted headers, polyglot payloads.
 * 2. Boundary buffer sizes: 10MB exactly (10,485,760 bytes) vs 10MB + 1 byte (10,485,761 bytes).
 * 3. Null-byte filenames and malformed base64 strings.
 * 4. Server resilience: Express server never crashes, always returns valid JSON error responses.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import zlib from 'node:zlib';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';

describe('Adversarial Challenge: POST /api/qbank/upload-file Hardening Suite', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let stagingDb: DatabaseSync;
  const TEST_TOKEN = 'adversarial-challenger-m1-2-token';

  beforeAll(async () => {
    stagingDb = new DatabaseSync(':memory:');
    ensurePendingSchema(stagingDb);
    setDbSyncForTesting(stagingDb);
    setQBankAdminTokenForTesting(TEST_TOKEN);

    app = express();
    // Allow large payloads to reach route-level buffer boundary logic
    app.use(express.json({ limit: '20mb' }));
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

  // Helper to POST to /api/qbank/upload-file
  async function postUpload(body: any): Promise<{ status: number; data: any; rawText: string; contentType: string }> {
    const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Intentionally capture if non-JSON
    }

    return { status: res.status, data, rawText, contentType };
  }

  // =========================================================================
  // 1. TRUNCATED ZIP / DOCX BUFFERS & CORRUPTED ARCHIVE HEADERS
  // =========================================================================
  describe('1. Truncated ZIP/DOCX Buffers & Corrupted Headers', () => {
    it('1.1: Truncated PK local file headers (1, 2, 4, 15, 29 bytes) -> valid JSON, no crash', async () => {
      const truncatedPayloads = [
        Buffer.from([0x50]), // 1 byte
        Buffer.from([0x50, 0x4b]), // 2 bytes 'PK'
        Buffer.from([0x50, 0x4b, 0x03, 0x04]), // 4 bytes standard PK signature
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // 15 bytes
        Buffer.alloc(29, 0xaa), // 29 bytes (1 byte short of 30-byte header)
      ];

      for (const buf of truncatedPayloads) {
        const { status, data, contentType } = await postUpload({
          file_name: 'truncated.docx',
          file_type: 'docx',
          file_base64: buf.toString('base64'),
        });

        expect(contentType).toContain('application/json');
        expect(data).not.toBeNull();
        expect([200, 400]).toContain(status);
        if (status === 400) {
          expect(data.success).toBe(false);
          expect(typeof data.error).toBe('string');
        } else {
          expect(data.total_parsed).toBe(0);
        }
      }
    });

    it('1.2: PK header claiming 1000-byte filename on 35-byte buffer -> no OOB read crash', async () => {
      // 30 bytes header + 5 bytes filename, but header states fnLen = 1000
      const header = Buffer.alloc(35);
      header.writeUInt32LE(0x04034b50, 0); // PK signature
      header.writeUInt16LE(20, 4); // version
      header.writeUInt16LE(0, 6); // flags
      header.writeUInt16LE(0, 8); // comp method (stored)
      header.writeUInt32LE(0, 14); // crc32
      header.writeUInt32LE(0, 18); // comp size
      header.writeUInt32LE(0, 22); // uncomp size
      header.writeUInt16LE(1000, 26); // fnLen = 1000 (overflows buffer)
      header.writeUInt16LE(0, 28); // extraLen = 0
      header.write('hello', 30, 'utf8');

      const { status, data, contentType } = await postUpload({
        file_name: 'overflow_fnlen.docx',
        file_type: 'docx',
        file_base64: header.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('1.3: PK entry for word/document.xml with truncated deflate stream -> caught gracefully', async () => {
      // Build a local entry with valid name "word/document.xml", compMethod 8, compSize = 100
      // but only provide 10 bytes of invalid deflate data
      const filename = 'word/document.xml';
      const fnBytes = Buffer.from(filename, 'utf8');
      const header = Buffer.alloc(30 + fnBytes.length + 10);
      header.writeUInt32LE(0x04034b50, 0);
      header.writeUInt16LE(20, 4);
      header.writeUInt16LE(0, 6);
      header.writeUInt16LE(8, 8); // Deflate
      header.writeUInt32LE(0x12345678, 14);
      header.writeUInt32LE(100, 18); // Claims 100 bytes compSize
      header.writeUInt32LE(500, 22); // Uncomp size
      header.writeUInt16LE(fnBytes.length, 26);
      header.writeUInt16LE(0, 28);
      fnBytes.copy(header, 30);
      // Corrupt compressed payload (not valid zlib/deflate)
      Buffer.from([0x78, 0x9c, 0xff, 0xff, 0x00, 0x00, 0x11, 0x22, 0x33, 0x44]).copy(header, 30 + fnBytes.length);

      const { status, data, contentType } = await postUpload({
        file_name: 'corrupt_deflate.docx',
        file_type: 'docx',
        file_base64: header.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('1.4: Corrupted Central Directory & EOCD pointers -> handles invalid offsets safely', async () => {
      // EOCD signature 0x06054b50 with corrupt cdOffset = 0x7FFFFFFF
      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
      eocd.writeUInt16LE(0, 4); // disk num
      eocd.writeUInt16LE(0, 6); // start disk
      eocd.writeUInt16LE(5, 8); // entries on disk
      eocd.writeUInt16LE(5, 10); // total entries
      eocd.writeUInt32LE(100, 12); // cd size
      eocd.writeUInt32LE(0x7fffffff, 16); // cdOffset pointing out of range
      eocd.writeUInt16LE(0, 20); // comment len

      const { status, data, contentType } = await postUpload({
        file_name: 'bad_eocd.docx',
        file_type: 'docx',
        file_base64: eocd.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('1.5: Repetitive PK headers (header flood) -> no infinite loop or hanging', async () => {
      // 200 copies of PK\x03\x04 without valid entries
      const flood = Buffer.alloc(200 * 30);
      for (let i = 0; i < 200; i++) {
        flood.writeUInt32LE(0x04034b50, i * 30);
        flood.writeUInt16LE(0, i * 30 + 8);
        flood.writeUInt32LE(0, i * 30 + 18);
        flood.writeUInt16LE(0, i * 30 + 26);
        flood.writeUInt16LE(0, i * 30 + 28);
      }

      const { status, data, contentType } = await postUpload({
        file_name: 'header_flood.docx',
        file_type: 'docx',
        file_base64: flood.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });
  });

  // =========================================================================
  // 2. CORRUPTED HEADERS & POLYGLOT PAYLOADS
  // =========================================================================
  describe('2. Corrupted File Headers & Polyglots', () => {
    it('2.1: GIF89a image prepended to PKZip archive (.docx) -> safely handled', async () => {
      const gifHeader = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
      const fakeZip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
      const polyglot = Buffer.concat([gifHeader, fakeZip]);

      const { status, data, contentType } = await postUpload({
        file_name: 'polyglot_gif_docx.docx',
        file_type: 'docx',
        file_base64: polyglot.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('2.2: HTML table payload disguised as .xlsx -> parsed safely or rejected without crash', async () => {
      const htmlPayload = Buffer.from(`
        <!DOCTYPE html>
        <html>
          <head><title>Fake Excel</title></head>
          <body>
            <script>alert('XSS')</script>
            <table>
              <tr><th>Câu hỏi</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Đáp án</th></tr>
              <tr><td>他是我的____。</td><td>老师</td><td>苹果</td><td>飞机</td><td>喝水</td><td>A</td></tr>
            </table>
          </body>
        </html>
      `, 'utf8');

      const { status, data, contentType } = await postUpload({
        file_name: 'table.xlsx',
        file_type: 'xlsx',
        file_base64: htmlPayload.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('2.3: Windows PE Executable binary header (.exe) renamed to .xlsx -> handled cleanly', async () => {
      const peHeader = Buffer.alloc(512);
      peHeader.write('MZ', 0, 'ascii'); // DOS signature
      peHeader.writeUInt32LE(0x0000003c, 0x3c); // PE header offset
      peHeader.write('PE\x00\x00', 0x3c, 'ascii');

      const { status, data, contentType } = await postUpload({
        file_name: 'trojan_payload.xlsx',
        file_type: 'xlsx',
        file_base64: peHeader.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('2.4: Linux ELF Executable binary header renamed to .docx -> handled cleanly', async () => {
      const elfHeader = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

      const { status, data, contentType } = await postUpload({
        file_name: 'elf_binary.docx',
        file_type: 'docx',
        file_base64: elfHeader.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('2.5: Truncated OLE CFB compound document header (.xls) -> handled cleanly', async () => {
      // OLE header is 0xD0CF11E0A1B11AE1
      const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x01, 0x02]);

      const { status, data, contentType } = await postUpload({
        file_name: 'corrupt.xls',
        file_type: 'xls',
        file_base64: oleHeader.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('2.6: Malformed PDF header & infinite loop xref table -> handled cleanly without hang', async () => {
      const badPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%EOF');

      const { status, data, contentType } = await postUpload({
        file_name: 'broken.pdf',
        file_type: 'pdf',
        file_base64: badPdf.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });
  });

  // =========================================================================
  // 3. BOUNDARY BUFFER SIZES: 10MB (10,485,760 bytes) vs 10MB + 1 BYTE (10,485,761 bytes)
  // =========================================================================
  describe('3. Boundary Buffer Sizes (10MB vs 10MB + 1 Byte)', () => {
    it('3.1: Exactly 10MB buffer (10,485,760 bytes) -> passes size limit check', async () => {
      const EXACT_10MB = 10 * 1024 * 1024; // 10,485,760 bytes
      const buf10MB = Buffer.alloc(EXACT_10MB, 0x20); // filled with spaces

      const { status, data, contentType } = await postUpload({
        file_name: 'exact_10mb.txt',
        file_type: 'txt',
        file_base64: buf10MB.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      // MUST NOT be rejected by size check error!
      if (status === 400) {
        expect(data.error).not.toContain('vượt quá giới hạn cho phép (tối đa 10MB)');
      } else {
        expect(status).toBe(200);
        expect(data.total_parsed).toBe(0);
      }
    });

    it('3.2: 10MB + 1 byte (10,485,761 bytes) -> strictly rejected with HTTP 400 size limit error', async () => {
      const OVER_10MB = 10 * 1024 * 1024 + 1; // 10,485,761 bytes
      const bufOver = Buffer.alloc(OVER_10MB, 0x20);

      const { status, data, contentType } = await postUpload({
        file_name: 'over_10mb_plus_1.txt',
        file_type: 'txt',
        file_base64: bufOver.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(status).toBe(400);
      expect(data).not.toBeNull();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Kích thước tệp tin vượt quá giới hạn cho phép (tối đa 10MB).');
    });

    it('3.3: 10MB + 1024 bytes (10,486,784 bytes) -> strictly rejected with HTTP 400 size limit error', async () => {
      const OVER_10MB_KB = 10 * 1024 * 1024 + 1024;
      const bufOver = Buffer.alloc(OVER_10MB_KB, 0x20);

      const { status, data, contentType } = await postUpload({
        file_name: 'over_10mb_kb.txt',
        file_type: 'txt',
        file_base64: bufOver.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Kích thước tệp tin vượt quá giới hạn cho phép (tối đa 10MB).');
    });

    it('3.4: 10MB - 1 byte (10,485,759 bytes) -> passes size limit check', async () => {
      const UNDER_10MB = 10 * 1024 * 1024 - 1; // 10,485,759 bytes
      const bufUnder = Buffer.alloc(UNDER_10MB, 0x20);

      const { status, data, contentType } = await postUpload({
        file_name: 'under_10mb.txt',
        file_type: 'txt',
        file_base64: bufUnder.toString('base64'),
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      if (status === 400) {
        expect(data.error).not.toContain('vượt quá giới hạn cho phép (tối đa 10MB)');
      } else {
        expect(status).toBe(200);
      }
    });
  });

  // =========================================================================
  // 4. NULL-BYTE FILENAMES & MALFORMED BASE64 STRINGS
  // =========================================================================
  describe('4. Null-Byte Filenames & Malformed Base64 Strings', () => {
    it('4.1: Filename with embedded null byte (test\\0.xlsx) -> handled cleanly', async () => {
      const validTxtBase64 = Buffer.from('Câu 1: 他是我的____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A\nGiải thích: Thầy giáo').toString('base64');

      const { status, data, contentType } = await postUpload({
        file_name: 'test\0.xlsx',
        file_type: 'xlsx',
        file_base64: validTxtBase64,
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
      expect(data.file_name || data.error).toBeDefined();
    });

    it('4.2: Filename starting with null byte (\\0evil.docx) -> handled cleanly', async () => {
      const dummyBuf = Buffer.from('sample text').toString('base64');

      const { status, data, contentType } = await postUpload({
        file_name: '\0evil.docx',
        file_type: 'docx',
        file_base64: dummyBuf,
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('4.3: Filename with null byte masking unsupported extension (malicious.docx\\0.exe) -> rejects extension', async () => {
      const dummyBuf = Buffer.from('sample text').toString('base64');

      const { status, data, contentType } = await postUpload({
        file_name: 'malicious.docx\0.exe',
        file_base64: dummyBuf,
      });

      expect(contentType).toContain('application/json');
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/không được hỗ trợ/);
    });

    it('4.4: Filename with path traversal + null byte (../../secret\\0.json) -> handled safely without fs leak', async () => {
      const dummyJson = Buffer.from(JSON.stringify([{ stem: '你好', options: ['A', 'B', 'C', 'D'], answer_idx: 0 }])).toString('base64');

      const { status, data, contentType } = await postUpload({
        file_name: '../../../../secret\0.json',
        file_type: 'json',
        file_base64: dummyJson,
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('4.5: Malformed base64 with only illegal non-base64 characters -> returns 400 empty buffer error', async () => {
      // Pure non-base64 characters (neither standard base64 nor base64url characters)
      const { status, data, contentType } = await postUpload({
        file_name: 'illegal_chars.txt',
        file_type: 'txt',
        file_base64: '!@#$%^&*()~`<>?:";\'',
      });

      expect(contentType).toContain('application/json');
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tệp tin rỗng (0 byte).');
    });

    it('4.5b: Malformed base64 with non-base64 noise mixed with base64url characters -> handles without crash', async () => {
      const { status, data, contentType } = await postUpload({
        file_name: 'noisy_chars.txt',
        file_type: 'txt',
        file_base64: '!@#$%^&*()_+-=~`<>?:";\'',
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('4.6: Data URI scheme with empty payload (data:application/octet-stream;base64,) -> returns 400 empty buffer error', async () => {
      const { status, data, contentType } = await postUpload({
        file_name: 'data_uri_empty.txt',
        file_type: 'txt',
        file_base64: 'data:application/octet-stream;base64,',
      });

      expect(contentType).toContain('application/json');
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tệp tin rỗng (0 byte).');
    });

    it('4.7: Malformed base64 with broken padding (===) -> returns 400 or handles cleanly', async () => {
      const { status, data, contentType } = await postUpload({
        file_name: 'bad_padding.txt',
        file_type: 'txt',
        file_base64: '====',
      });

      expect(contentType).toContain('application/json');
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tệp tin rỗng (0 byte).');
    });

    it('4.8: MIME base64 with whitespace, newlines (\\r\\n), and tabs interspersed -> decodes cleanly', async () => {
      const rawText = 'Câu 1: 他是我的____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A\nGiải thích: Thầy giáo';
      const cleanBase64 = Buffer.from(rawText, 'utf8').toString('base64');
      // Interleave newlines and tabs
      const interleaved = cleanBase64.slice(0, 10) + '\r\n\t ' + cleanBase64.slice(10, 25) + '\n   ' + cleanBase64.slice(25);

      const { status, data, contentType } = await postUpload({
        file_name: 'interleaved.txt',
        file_type: 'txt',
        file_base64: interleaved,
      });

      expect(contentType).toContain('application/json');
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(1);
      expect(data.accepted_count).toBe(1);
    });

    it('4.9: Truncated base64 string (unaligned nibble) -> decodes partial buffer safely', async () => {
      // 7 characters (unaligned base64)
      const { status, data, contentType } = await postUpload({
        file_name: 'unaligned.txt',
        file_type: 'txt',
        file_base64: 'ABCDEFG',
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('4.10: Null byte inside base64 string (AAAA\\0BBBB) -> handled safely without exception', async () => {
      const { status, data, contentType } = await postUpload({
        file_name: 'null_in_base64.txt',
        file_type: 'txt',
        file_base64: 'AAAA\0BBBB==',
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('4.11: Trailing garbage after valid base64 padding (AAAA==TRAILING_GARBAGE) -> handled safely', async () => {
      const { status, data, contentType } = await postUpload({
        file_name: 'trailing_garbage.txt',
        file_type: 'txt',
        file_base64: 'AAAA==TRAILING_GARBAGE',
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('4.12: Extremely long filename (10,000 characters) -> handled without crash', async () => {
      const hugeName = 'a'.repeat(9995) + '.txt';
      const dummyBase64 = Buffer.from('Câu 1: 他是我的____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A\nGiải thích: Thầy giáo').toString('base64');

      const { status, data, contentType } = await postUpload({
        file_name: hugeName,
        file_type: 'txt',
        file_base64: dummyBase64,
      });

      expect(contentType).toContain('application/json');
      expect(data).not.toBeNull();
      expect([200, 400]).toContain(status);
    });

    it('4.13: Non-string body types (numbers, objects, nulls) -> handled safely without crash', async () => {
      // Object as file_base64, number as file_name, null as file_type
      const { status, data, contentType } = await postUpload({
        file_name: 123456,
        file_type: null,
        file_base64: { bad: 'payload' },
      });

      expect(contentType).toContain('application/json');
      expect([200, 400]).toContain(status);
      expect(data).not.toBeNull();
      expect(typeof data).toBe('object');
    });

    it('4.14: Completely empty JSON body ({}) -> returns clean 400 without crashing', async () => {
      const { status, data, contentType } = await postUpload({});

      expect(contentType).toContain('application/json');
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(typeof data.error).toBe('string');
    });
  });

  // =========================================================================
  // 5. SERVER CRASH-PROOF VERIFICATION & LIVENESS HEARTBEAT
  // =========================================================================
  describe('5. Server Crash-Proof Verification', () => {
    it('5.1: Rapid consecutive barrage of 25 corrupt payloads does not crash Express server', async () => {
      const garbagePayloads = [
        Buffer.from([0x00, 0x01, 0x02, 0x03]),
        Buffer.from('corrupt non-zip content'),
        Buffer.from([0x50, 0x4b, 0x07, 0x08]),
        Buffer.alloc(500, 0xff),
        Buffer.from('{"not": "candidate_array"}'),
        Buffer.from('%PDF-9.9 corrupt object stream'),
      ];

      for (let i = 0; i < 25; i++) {
        const payload = garbagePayloads[i % garbagePayloads.length];
        const ext = ['docx', 'xlsx', 'xls', 'pdf', 'txt', 'json'][i % 6];
        const res = await postUpload({
          file_name: `stress_${i}.${ext}`,
          file_type: ext,
          file_base64: payload.toString('base64'),
        });

        expect(res.contentType).toContain('application/json');
        expect(res.data).not.toBeNull();
        expect([200, 400]).toContain(res.status);
      }

      // Verify server is STILL completely alive and accepts valid question
      const validTxt = Buffer.from('Câu 1: 桌子上有____本书。\nA. 三\nB. 看\nC. 去\nD. 叫\nĐáp án: A\nGiải thích: Số 3').toString('base64');
      const healthCheck = await postUpload({
        file_name: 'liveness_check.txt',
        file_type: 'txt',
        file_base64: validTxt,
      });

      expect(healthCheck.status).toBe(200);
      expect(healthCheck.data.success).toBe(true);
      expect(healthCheck.data.accepted_count).toBe(1);
    });
  });
});
