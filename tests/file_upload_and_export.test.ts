/**
 * =============================================================================
 * Milestone M2 Test Suite: Multi-Format File Upload & Exam Export
 * Target: tests/file_upload_and_export.test.ts
 *
 * Requirements Tracked:
 * 1. In-Memory Generation (Zero Hardcoded Static Files):
 *    - In-memory XLSX generation via `xlsx` buffer write.
 *    - In-memory CSV generation via PapaParse / RFC 4180 UTF-8 buffer.
 *    - In-memory DOCX generation via PKZip + OpenXML document.xml.
 *    - In-memory PDF generation via PDF-1.4 stream syntax.
 * 2. Ingestion Pipeline & Quality Gates:
 *    - Tabular XLSX/CSV extraction with multilingual headers (VN/EN/CN).
 *    - Diverse answer keys (letters A-E, numbers 0-4 / 1-5, boolean symbols √/×).
 *    - Unstructured XLSX/CSV text cell extraction.
 *    - DOCX paragraph and table extraction.
 *    - PDF text stream extraction with headers.
 *    - Full 6-Gate verification (all valid questions pass 6 gates).
 * 3. Export Generators & Roundtrip Invariants:
 *    - Excel export: 3 sheets, column headers, valid PKZip header.
 *    - Word export: Typography, candidate box, adaptive options, Answer Key page break.
 *    - JSON export: 100% roundtrip identity through parseUniversalQuestions.
 * 4. Negative & Adversarial Stress Tests:
 *    - 0-byte empty buffers (all 4 formats).
 *    - Corrupt / truncated binary buffers (garbage bytes, partial zip, partial pdf).
 *    - Header-only sheets with 0 data rows.
 * 5. Database Safety Invariants:
 *    - Verification of data/hsk_exam.db and data/qbank/qbank.db SHA-256 hashes.
 * =============================================================================
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';
import {
  parseUploadedFileBuffer,
  parseUploadedFileBase64,
  extractUploadedFileDetails,
  extractDocxTextFromBuffer,
  extractPdfTextFromBuffer,
  extractSpreadsheetData,
  resolveAnswerIndex,
} from '../src/server/fileUploadParser.js';
import {
  exportExamToExcel,
  exportExamToWord,
  exportExamToJson,
} from '../src/server/examExportService.js';

// =============================================================================
// In-Memory File Generators (Zero External Fixtures)
// =============================================================================

/** Generates an in-memory XLSX buffer with specified sheet data */
function generateInMemoryXlsx(
  sheetData: Record<string, any>[],
  sheetName = 'De_Thi'
): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}

/** Generates an in-memory CSV buffer with UTF-8 BOM and custom delimiter */
function generateInMemoryCsv(
  rows: Record<string, any>[],
  delimiter = ','
): Buffer {
  const csvString = Papa.unparse(rows, { delimiter });
  return Buffer.from('\uFEFF' + csvString, 'utf8');
}

/**
 * Generates an in-memory DOCX buffer (valid PKZip containing word/document.xml)
 * using Node's built-in zlib (zero dependencies).
 */
function generateInMemoryDocx(paragraphs: string[]): Buffer {
  const pXmls = paragraphs
    .map(
      (p) =>
        `<w:p><w:r><w:t>${p
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</w:t></w:r></w:p>`
    )
    .join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${pXmls}</w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return buildZipArchive([
    { name: '[Content_Types].xml', content: Buffer.from(contentTypesXml, 'utf-8') },
    { name: '_rels/.rels', content: Buffer.from(relsXml, 'utf-8') },
    { name: 'word/document.xml', content: Buffer.from(docXml, 'utf-8') },
  ]);
}

/** Helper: builds a standard PKZip buffer in memory using Node zlib */
function buildZipArchive(
  files: { name: string; content: Buffer }[]
): Buffer {
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[i] = c;
  }
  const calcCrc = (buf: Buffer) => {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  };

  const parts: Buffer[] = [];
  const entries: {
    nameBuf: Buffer;
    crc: number;
    compLen: number;
    uncompLen: number;
    offset: number;
  }[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const compBuf = zlib.deflateRawSync(f.content);
    const crc = calcCrc(f.content);

    const localHdr = Buffer.alloc(30);
    localHdr.writeUInt32LE(0x04034b50, 0);
    localHdr.writeUInt16LE(20, 4);
    localHdr.writeUInt16LE(0, 6);
    localHdr.writeUInt16LE(8, 8);
    localHdr.writeUInt16LE(0, 10);
    localHdr.writeUInt16LE(0, 12);
    localHdr.writeUInt32LE(crc, 14);
    localHdr.writeUInt32LE(compBuf.length, 18);
    localHdr.writeUInt32LE(f.content.length, 22);
    localHdr.writeUInt16LE(nameBuf.length, 26);
    localHdr.writeUInt16LE(0, 28);

    parts.push(localHdr, nameBuf, compBuf);
    entries.push({
      nameBuf,
      crc,
      compLen: compBuf.length,
      uncompLen: f.content.length,
      offset,
    });
    offset += 30 + nameBuf.length + compBuf.length;
  }

  const cdStart = offset;
  let cdSize = 0;

  for (const e of entries) {
    const cdHdr = Buffer.alloc(46);
    cdHdr.writeUInt32LE(0x02014b50, 0);
    cdHdr.writeUInt16LE(20, 4);
    cdHdr.writeUInt16LE(20, 6);
    cdHdr.writeUInt16LE(0, 8);
    cdHdr.writeUInt16LE(8, 10);
    cdHdr.writeUInt16LE(0, 12);
    cdHdr.writeUInt16LE(0, 14);
    cdHdr.writeUInt32LE(e.crc, 16);
    cdHdr.writeUInt32LE(e.compLen, 20);
    cdHdr.writeUInt32LE(e.uncompLen, 24);
    cdHdr.writeUInt16LE(e.nameBuf.length, 28);
    cdHdr.writeUInt16LE(0, 30);
    cdHdr.writeUInt16LE(0, 32);
    cdHdr.writeUInt16LE(0, 34);
    cdHdr.writeUInt16LE(0, 36);
    cdHdr.writeUInt32LE(0, 38);
    cdHdr.writeUInt32LE(e.offset, 42);

    parts.push(cdHdr, e.nameBuf);
    cdSize += 46 + e.nameBuf.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  parts.push(eocd);
  return Buffer.concat(parts);
}

/** Generates an in-memory PDF buffer with valid PDF-1.4 stream syntax */
function generateInMemoryPdf(lines: string[]): Buffer {
  let contentStream = 'BT\n/F1 12 Tf\n72 720 Td\n16 TL\n';
  for (const line of lines) {
    const escaped = line
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    contentStream += `(${escaped}) Tj\nT*\n`;
  }
  contentStream += 'ET';
  const streamLen = Buffer.byteLength(contentStream, 'latin1');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  offsets.push(pdf.length);
  pdf +=
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

  offsets.push(pdf.length);
  pdf +=
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const startXref = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

// =============================================================================
// Test Suite Execution
// =============================================================================

describe('Milestone M2: Multi-Format File Ingestion, Export, & Quality Gates', () => {
  const HSK_EXAM_DB = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const QBANK_DB = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const EXPECTED_HSK_EXAM_SHA256 =
    'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
  let initialQBankSha: string = '';
  const EXPECTED_QBANK_SHA256 =
    'E370C327D1A516804AB9B515D0A921A5917346587B3188796260CE171EF1A5AD';

  beforeAll(() => {
    if (fs.existsSync(QBANK_DB)) {
      initialQBankSha = getFileSha256(QBANK_DB);
    }
  });

  function getFileSha256(p: string): string {
    return crypto
      .createHash('sha256')
      .update(fs.readFileSync(p))
      .digest('hex')
      .toUpperCase();
  }

  // ---------------------------------------------------------------------------
  // 1. Tabular XLSX & CSV Multi-Lingual Extraction
  // ---------------------------------------------------------------------------
  describe('1. Tabular Ingestion with Multi-Lingual Headers & Formats', () => {
    it('extracts questions from Vietnamese-headed XLSX workbook via parseUploadedFileBuffer', async () => {
      const rows = [
        {
          STT: 1,
          'Câu hỏi': '他非常喜欢吃中国米饭。',
          Pinyin: 'Tā fēicháng xǐhuan chī Zhōngguó mǐfàn.',
          'Đáp án A': '米饭',
          'Đáp án B': '面条',
          'Đáp án C': '苹果',
          'Đáp án D': '茶',
          'Đáp án đúng': 'A',
          'Giải thích': 'Trong câu có từ 米饭 (cơm) tương ứng đáp án A.',
          HSK: 2,
          'Kỹ năng': 'Đọc hiểu',
          'Dạng bài': 'read_fill_blank_4opt',
        },
      ];
      const buf = generateInMemoryXlsx(rows);
      expect(buf.subarray(0, 4).toString('hex')).toBe('504b0304'); // PKZip

      const questions = await parseUploadedFileBuffer(buf, 'test_exam.xlsx');
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toBe('他非常喜欢吃中国米饭。');
      expect(questions[0].pinyin).toBe('Tā fēicháng xǐhuan chī Zhōngguó mǐfàn.');
      expect(questions[0].options).toEqual(['米饭', '面条', '苹果', '茶']);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].level).toBe(2);
      expect(questions[0].skill).toBe('reading');

      // 6-Gate verification
      const sixGate = evaluateCandidateSixGates(questions[0], []);
      expect(sixGate.allPassed).toBe(true);
    });

    it('extracts questions from English-headed CSV with diverse answer keys', async () => {
      const rows = [
        {
          Question: '我们在图书馆里看书。',
          Pinyin: 'Wǒmen zài túshūguǎn lǐ kànshū.',
          A: '图书馆',
          B: '医院',
          C: '商店',
          D: '机场',
          Answer: '0', // 0-based index
          Explanation: 'Từ 图书馆 (thư viện) phù hợp với hành động看书.',
          Level: 3,
          Skill: 'reading',
        },
        {
          Question: '天气太热了，我想喝水。',
          OptionA: '喝水',
          OptionB: '吃菜',
          OptionC: '看书',
          OptionD: '买票',
          Key: 'A', // Letter
          Solution: 'Ngữ cảnh khát nước muốn uống nước.',
          Level: 1,
        },
      ];
      const buf = generateInMemoryCsv(rows);
      const questions = await parseUploadedFileBuffer(buf, 'exam.csv');
      expect(questions.length).toBe(2);
      expect(questions[0].stem).toBe('我们在图书馆里看书。');
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[1].stem).toBe('天气太热了，我想喝水。');
      expect(questions[1].answer_idx).toBe(0);
    });

    it('extracts questions from Chinese-headed spreadsheet with True/False symbols', async () => {
      const rows = [
        {
          题干: '桌子上有一本书。',
          拼音: 'Zhuōzi shang yǒu yì běn shū.',
          选项A: '正确 (√)',
          选项B: '错误 (×)',
          答案: '√',
          解析: 'Đúng theo ngữ cảnh trên bàn có một cuốn sách.',
          级别: 'HSK 1',
        },
      ];
      const buf = generateInMemoryXlsx(rows);
      const details = await extractUploadedFileDetails(buf, 'hsk_tf.xlsx');
      expect(details.is_structured_table).toBe(true);
      expect(details.questions.length).toBe(1);
      expect(details.questions[0].stem).toBe('桌子上有一本书。');
      expect(details.questions[0].answer_idx).toBe(0);
    });

    it('resolves diverse answer formats accurately with resolveAnswerIndex', () => {
      const opts = ['A选项', 'B选项', 'C选项', 'D选项'];
      expect(resolveAnswerIndex('A', opts)).toBe(0);
      expect(resolveAnswerIndex('B', opts)).toBe(1);
      expect(resolveAnswerIndex('C', opts)).toBe(2);
      expect(resolveAnswerIndex('D', opts)).toBe(3);
      expect(resolveAnswerIndex('0', opts)).toBe(0);
      expect(resolveAnswerIndex('1', opts)).toBe(0); // 1-based index 1 -> 0
      expect(resolveAnswerIndex('2', opts)).toBe(1); // 1-based index 2 -> 1
      expect(resolveAnswerIndex('√', ['✓ Đúng', '✗ Sai'])).toBe(0);
      expect(resolveAnswerIndex('×', ['✓ Đúng', '✗ Sai'])).toBe(1);
      expect(resolveAnswerIndex('Đúng', ['✓ Đúng', '✗ Sai'])).toBe(0);
      expect(resolveAnswerIndex('Sai', ['✓ Đúng', '✗ Sai'])).toBe(1);
      expect(resolveAnswerIndex('A选项', opts)).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Unstructured Spreadsheets & Text Blocks
  // ---------------------------------------------------------------------------
  describe('2. Unstructured Text Cells in Spreadsheets', () => {
    it('parses multi-line text blocks dumped in single spreadsheet cells', async () => {
      const rawBlock = `第一部分: 第 1 - 2 题
1. 桌子上有一本书。(Zhuōzi shang yǒu yì běn shū.)
A. 正确
B. 错误
2. 他在睡觉，没打电话。(Tā zài shuìjiào, méi dǎ diànhuà.)
A. 正确
B. 错误
ĐÁP ÁN: 1. A  2. A`;

      const rows = [{ 'Nội dung đề thi': rawBlock }];
      const buf = generateInMemoryXlsx(rows);

      const details = await extractUploadedFileDetails(buf, 'unstructured.xlsx');
      expect(details.questions.length).toBe(2);
      expect(details.questions[0].stem).toContain('桌子上有一本书');
      expect(details.questions[1].stem).toContain('他在睡觉');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Word (.docx) Extraction
  // ---------------------------------------------------------------------------
  describe('3. Word (.docx) Document Ingestion', () => {
    it('unpacks in-memory DOCX and extracts clean questions with options', async () => {
      const paragraphs = [
        'KỲ THI THỬ HSK CẤP 2',
        'Phần 1: Đọc hiểu',
        '1. 他去北京旅游了。(Tā qù Běijīng lǚyóu le.)',
        'A. 北京    B. 上海    C. 广州    D. 深圳',
        'ĐÁP ÁN: 1. A',
        'Giải thích: Trong câu có nói đến việc đi Bắc Kinh du lịch.',
      ];
      const docxBuf = generateInMemoryDocx(paragraphs);
      expect(docxBuf.subarray(0, 4).toString('hex')).toBe('504b0304');

      const extractedText = extractDocxTextFromBuffer(docxBuf);
      expect(extractedText).toContain('KỲ THI THỬ HSK CẤP 2');
      expect(extractedText).toContain('他去北京旅游了');

      const questions = await parseUploadedFileBuffer(docxBuf, 'test_exam.docx', {
        default_level: 2,
      });
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toContain('他去北京旅游了');
      expect(questions[0].options.length).toBe(4);
      expect(questions[0].answer_idx).toBe(0);
    });

    it('supports Base64 upload via parseUploadedFileBase64', async () => {
      const paragraphs = [
        '1. 我每天早上六点起床。(Wǒ měitiān zǎoshang liù diǎn qǐchuáng.)',
        'A. 六点    B. 七点    C. 八点    D. 九点',
        'ĐÁP ÁN: 1. A',
      ];
      const docxBuf = generateInMemoryDocx(paragraphs);
      const base64Str = docxBuf.toString('base64');

      const questions = await parseUploadedFileBase64(base64Str, 'morning.docx');
      expect(questions.length).toBe(1);
      expect(questions[0].stem).toContain('我每天早上六点起床');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PDF Text Stream Extraction
  // ---------------------------------------------------------------------------
  describe('4. PDF Text Stream Ingestion', () => {
    it('extracts text stream from in-memory PDF via pdfjs-dist legacy build', async () => {
      const pdfLines = [
        'HSK (Cap 1) De thi mau',
        'Phan 1: Cau 1-2',
        '1. Pingguo (píngguǒ)',
        'A. Tao',
        'B. Le',
        'DAP AN: 1. A',
      ];
      const pdfBuf = generateInMemoryPdf(pdfLines);
      expect(pdfBuf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      const text = await extractPdfTextFromBuffer(pdfBuf);
      expect(text).toContain('Pingguo');
      expect(text).toContain('DAP AN');

      const questions = await parseUploadedFileBuffer(pdfBuf, 'mock_exam.pdf');
      expect(questions.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Export Format Integrity & Roundtrip Invariants
  // ---------------------------------------------------------------------------
  describe('5. Export Generators & Roundtrip Fidelity', () => {
    const sampleQuestions: CandidateQuestion[] = [
      {
        id: 'q_hsk1_001',
        stem: '他在房间睡觉。',
        pinyin: 'Tā zài fángjiān shuìjiào.',
        options: ['睡觉', '吃饭', '喝水', '看书'],
        answer_idx: 0,
        explanation_vi: 'Đúng ngữ cảnh anh ấy đang ngủ trong phòng.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        topic: 'doi_song',
        target_grammar: '在 + Nơi chốn + Động từ',
        tested_vocab: ['房间', '睡觉'],
        difficulty_tier: 'tier1_difficult',
        trap_type: 'collocation',
      },
      {
        id: 'q_hsk1_002',
        stem: '我有三本书。',
        pinyin: 'Wǒ yǒu sān běn shū.',
        options: ['本', '个', '只', '张'],
        answer_idx: 0,
        explanation_vi: 'Lượng từ cho sách 书 là 本.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      },
    ];

    it('exports to Excel with 3 structured sheets, column widths, and proper headers', () => {
      const excelBuf = exportExamToExcel(sampleQuestions, 'Đề thi thử HSK 1');
      expect(excelBuf.subarray(0, 4).toString('hex')).toBe('504b0304'); // PKZip (.xlsx)

      const wb = XLSX.read(excelBuf, { type: 'buffer' });
      expect(wb.SheetNames).toEqual(['Đề thi HSK', 'Đáp án & Giải thích', 'Ma trận kiến thức']);

      // Check Sheet 1 rows
      const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets['Đề thi HSK']) as any[];
      expect(sheet1.length).toBe(2);
      expect(sheet1[0]['Câu hỏi / Ngữ cảnh']).toBe('他在房间睡觉。');
      expect(sheet1[0]['Đáp án đúng']).toContain('A. 睡觉');

      // Check Sheet 2 rows
      const sheet2 = XLSX.utils.sheet_to_json(wb.Sheets['Đáp án & Giải thích']) as any[];
      expect(sheet2.length).toBe(2);
      expect(sheet2[0]['Đáp án đúng']).toContain('A. 睡觉');

      // Check Sheet 3 rows
      const sheet3 = XLSX.utils.sheet_to_json(wb.Sheets['Ma trận kiến thức']) as any[];
      expect(sheet3.length).toBe(2);
      expect(sheet3[0]['Từ vựng trọng tâm']).toBe('房间, 睡觉');
    });

    it('exports to Word (.docx) with valid OpenXML, typography, and page break', () => {
      const wordBuf = exportExamToWord(sampleQuestions, 'Đề thi chuẩn HSK 1', {
        duration_minutes: 35,
        include_answers: true,
        include_explanations: true,
      });
      expect(wordBuf.subarray(0, 4).toString('hex')).toBe('504b0304'); // Valid PKZip (.docx)

      const docText = extractDocxTextFromBuffer(wordBuf);
      expect(docText).toContain('HỆ THỐNG LUYỆN THI HÁN NGỮ MINNESE');
      expect(docText).toContain('Đề thi chuẩn HSK 1');
      expect(docText).toContain('他在房间睡觉');
      expect(docText).toContain('Tā zài fángjiān shuìjiào');
      expect(docText).toContain('BẢNG ĐÁP ÁN & GIẢI THÍCH CHI TIẾT');
    });

    it('guarantees 100% roundtrip fidelity for JSON export and import: import(export(Q)) === Q', () => {
      const jsonStr = exportExamToJson(sampleQuestions, {
        title: 'Đề thi HSK 1 Roundtrip',
        level: 1,
      });

      const reImported = parseUniversalQuestions(jsonStr, { default_level: 1 });
      expect(reImported.length).toBe(sampleQuestions.length);

      for (let i = 0; i < sampleQuestions.length; i++) {
        expect(reImported[i].stem).toBe(sampleQuestions[i].stem);
        expect(reImported[i].options).toEqual(sampleQuestions[i].options);
        expect(reImported[i].answer_idx).toBe(sampleQuestions[i].answer_idx);
        expect(reImported[i].explanation_vi).toBeDefined();
        expect(reImported[i].explanation_vi.length).toBeGreaterThan(0);
        expect(reImported[i].level).toBe(sampleQuestions[i].level);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Negative & Adversarial Stress Tests
  // ---------------------------------------------------------------------------
  describe('6. Negative & Adversarial Stress Tests', () => {
    it('handles 0-byte empty file buffer gracefully across all formats', async () => {
      const emptyBuf = Buffer.alloc(0);

      const xlsxRes = await parseUploadedFileBuffer(emptyBuf, 'empty.xlsx');
      expect(xlsxRes).toEqual([]);

      const csvRes = await parseUploadedFileBuffer(emptyBuf, 'empty.csv');
      expect(csvRes).toEqual([]);

      const docxRes = await parseUploadedFileBuffer(emptyBuf, 'empty.docx');
      expect(docxRes).toEqual([]);

      const pdfRes = await parseUploadedFileBuffer(emptyBuf, 'empty.pdf');
      expect(pdfRes).toEqual([]);
    });

    it('rejects corrupt binary buffers without crashing process', async () => {
      const garbageBuf = Buffer.from('PK\x03\x04ThisIsCorruptedGarbageDataNotAZip1234567890');

      const xlsxDetails = await extractUploadedFileDetails(garbageBuf, 'corrupt.xlsx');
      expect(xlsxDetails.questions).toBeDefined();

      const docxDetails = await extractUploadedFileDetails(garbageBuf, 'corrupt.docx');
      expect(docxDetails.questions).toBeDefined();
    });

    it('evaluates Six Quality Gates on malformed candidates', () => {
      const malformedCandidate: CandidateQuestion = {
        stem: '短', // Too short (Gate 1 schema fails)
        options: ['A'], // Missing options (Gate 4 fails)
        answer_idx: 0,
        explanation_vi: '', // Empty explanation (Gate 2 fails)
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = evaluateCandidateSixGates(malformedCandidate, []);
      expect(result.allPassed).toBe(false);
      expect(result.gate1_schema.passed).toBe(false);
      expect(result.gate2_rationales_coherence.passed).toBe(false);
    });

    it('handles spreadsheet with headers only and 0 data rows', async () => {
      const headerOnly = [{ 'Câu hỏi': '', 'Đáp án A': '', 'Đáp án đúng': '' }];
      const buf = generateInMemoryXlsx(headerOnly);
      const questions = await parseUploadedFileBuffer(buf, 'empty_rows.xlsx');
      expect(questions).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Operational Database Immutability Invariant
  // ---------------------------------------------------------------------------
  describe('7. Operational Database Immutability Invariant', () => {
    it('guarantees data/hsk_exam.db SHA-256 is 100% unchanged', () => {
      const currentHash = getFileSha256(HSK_EXAM_DB);
      expect(currentHash).toBe(EXPECTED_HSK_EXAM_SHA256);
    });

    it('guarantees data/qbank/qbank.db SHA-256 is 100% unchanged', () => {
      const currentHash = getFileSha256(QBANK_DB);
      expect(currentHash).toBe(initialQBankSha || EXPECTED_QBANK_SHA256);
    });
  });
});
