import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  reconstructPdfPageTextFromItems,
  extractPdfTextFromBuffer,
  parseUploadedFileBuffer,
  extractUploadedFileDetails,
  PdfTextItemLike,
} from '../src/server/fileUploadParser.js';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';

describe('Challenger M1-2: Adversarial PDF Layout-Aware Parser & Downstream Integration Suite', () => {
  let initialQBankSha: string = '';
  beforeAll(() => {
    if (fs.existsSync('data/qbank/qbank.db')) {
      initialQBankSha = crypto.createHash('sha256').update(fs.readFileSync('data/qbank/qbank.db')).digest('hex').toUpperCase();
    }
  });
  /**
   * Robust multi-page PDF-1.4 binary generator using standard Type 1 Helvetica font.
   */
  function generateMultiPagePdf(pagesLines: string[][]): Buffer {
    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    const count = pagesLines.length;

    // 1 0 obj: Catalog
    offsets.push(pdf.length);
    pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

    // Page object IDs: 3, 5, 7, ...
    // Stream object IDs: 4, 6, 8, ...
    // Font object ID: 3 + count * 2
    const fontId = 3 + count * 2;
    const pageKids: string[] = [];
    for (let i = 0; i < count; i++) {
      pageKids.push(`${3 + i * 2} 0 R`);
    }

    // 2 0 obj: Pages
    offsets.push(pdf.length);
    pdf += `2 0 obj\n<< /Type /Pages /Kids [${pageKids.join(' ')}] /Count ${count} >>\nendobj\n`;

    for (let i = 0; i < count; i++) {
      const pageId = 3 + i * 2;
      const streamId = 4 + i * 2;

      // Page obj
      offsets.push(pdf.length);
      pdf += `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj\n`;

      // Stream obj with lines
      let contentStream = 'BT\n/F1 12 Tf\n72 720 Td\n18 TL\n';
      for (const line of pagesLines[i]) {
        const escaped = line
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
        contentStream += `(${escaped}) Tj\nT*\n`;
      }
      contentStream += 'ET';
      const streamLen = Buffer.byteLength(contentStream, 'latin1');

      offsets.push(pdf.length);
      pdf += `${streamId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
    }

    // Font obj
    offsets.push(pdf.length);
    pdf += `${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

    const xrefOffset = pdf.length;
    const totalObjs = fontId + 1;
    pdf += `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(pdf, 'latin1');
  }

  // =========================================================================
  // SCENARIO 1: MULTI-PAGE EXAM PDF (HSK Part 1 T/F, Part 2 Matching, Answer Key)
  // =========================================================================
  describe('Scenario 1: Multi-Page Exam PDF Generation & Downstream Cross-Page Parsing', () => {
    it('1.1: Generates 3-page PDF in-memory and parses Part 1 (T/F), Part 2 (MCQ), and cross-page Answer Key', async () => {
      const page1Lines = [
        'MINNESE CHINESE CENTER - HSK 1 MOCK EXAM',
        'Question 1: Ta zai kan shu.',
        'A. True    B. False',
        'Question 2: Tianqi hen re.',
        'A. True    B. False',
        'Trang 1 / 3',
      ];

      const page2Lines = [
        'Question 3: Ta zai yiyuan gongzuo, ta shi ____.',
        'A. laoshi    B. yisheng    C. xuesheng    D. pengyou',
        'Question 4: Ni xiang he shenme?',
        'A. cha    B. pingguo    C. yifu    D. shuijiao',
        'Trang 2 / 3',
      ];

      const page3Lines = [
        'ANSWER KEY',
        '1. A - Nguoi trong tranh dang doc sach (kan shu).',
        '2. B - Troi tuyet roi thoi tiet lanh khong the la hen re.',
        '3. B - Lam viec tai benh vien la bac si (yisheng).',
        '4. A - Do uong la tra (cha).',
        'Trang 3 / 3',
      ];

      const multiPageBuf = generateMultiPagePdf([page1Lines, page2Lines, page3Lines]);
      expect(multiPageBuf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      // Step A: Extract raw text via extractPdfTextFromBuffer
      const extractedText = await extractPdfTextFromBuffer(multiPageBuf);
      expect(extractedText).toContain('Question 1: Ta zai kan shu.');
      expect(extractedText).toContain('Question 2: Tianqi hen re.');
      expect(extractedText).toContain('Question 3: Ta zai yiyuan gongzuo, ta shi ____.');
      expect(extractedText).toContain('Question 4: Ni xiang he shenme?');
      expect(extractedText).toContain('ANSWER KEY');
      expect(extractedText).toContain('1. A - Nguoi trong tranh dang doc sach');

      // Step B: Ensure page footers ("Trang 1 / 3", "Trang 2 / 3", "Trang 3 / 3") are stripped
      expect(extractedText).not.toContain('Trang 1 / 3');
      expect(extractedText).not.toContain('Trang 2 / 3');
      expect(extractedText).not.toContain('Trang 3 / 3');

      // Step C: Feed into parseUploadedFileBuffer
      const parsedQuestions = await parseUploadedFileBuffer(multiPageBuf, 'hsk_full_exam.pdf');
      expect(parsedQuestions.length).toBe(4);

      // Verify Question 1 (True/False)
      expect(parsedQuestions[0].stem).toContain('Ta zai kan shu');
      expect(parsedQuestions[0].options.length).toBeGreaterThanOrEqual(2);
      expect(parsedQuestions[0].answer_idx).toBe(0); // Key is 1. A -> index 0

      // Verify Question 2 (True/False)
      expect(parsedQuestions[1].stem).toContain('Tianqi hen re');
      expect(parsedQuestions[1].options.length).toBeGreaterThanOrEqual(2);
      expect(parsedQuestions[1].answer_idx).toBe(1); // Key is 2. B -> index 1

      // Verify Question 3 (MCQ 4 options)
      expect(parsedQuestions[2].stem).toContain('yiyuan gongzuo');
      expect(parsedQuestions[2].options).toEqual(['laoshi', 'yisheng', 'xuesheng', 'pengyou']);
      expect(parsedQuestions[2].answer_idx).toBe(1); // Key is 3. B (yisheng) -> index 1

      // Verify Question 4 (MCQ 4 options)
      expect(parsedQuestions[3].stem).toContain('Ni xiang he shenme');
      expect(parsedQuestions[3].options).toEqual(['cha', 'pingguo', 'yifu', 'shuijiao']);
      expect(parsedQuestions[3].answer_idx).toBe(0); // Key is 4. A (cha) -> index 0
    });

    it('1.2: Multi-page PDF layout coordinate extraction with horizontal tab separation across pages', async () => {
      // Test coordinate layout on simulated multi-page items
      const page1Items: PdfTextItemLike[] = [
        { str: '第一部分', transform: [1, 0, 0, 1, 50, 740], width: 60 },
        { str: '1. 他在看书。', transform: [1, 0, 0, 1, 50, 700], width: 80 },
        { str: 'A. 对', transform: [1, 0, 0, 1, 50, 670], width: 35 },
        { str: 'B. 错', transform: [1, 0, 0, 1, 150, 670], width: 35 }, // gap = 150 - 85 = 65 > 18 -> '\t'
        { str: 'Trang 1 / 2', transform: [1, 0, 0, 1, 250, 30], width: 60 },
      ];

      const page2Items: PdfTextItemLike[] = [
        { str: '第二部分', transform: [1, 0, 0, 1, 50, 740], width: 60 },
        { str: '2. 他在医院工作，他是医生吗？', transform: [1, 0, 0, 1, 50, 700], width: 220 },
        // Horizontal 4 options
        { str: 'A. 老师', transform: [1, 0, 0, 1, 50, 670], width: 40 },
        { str: 'B. 医生', transform: [1, 0, 0, 1, 140, 670], width: 40 }, // gap > 18
        { str: 'C. 学生', transform: [1, 0, 0, 1, 230, 670], width: 40 }, // gap > 18
        { str: 'D. 朋友', transform: [1, 0, 0, 1, 320, 670], width: 40 }, // gap > 18
        // Bottom answer key on page 2
        { str: 'ĐÁP ÁN:', transform: [1, 0, 0, 1, 50, 500], width: 60 },
        { str: '1. A    2. B', transform: [1, 0, 0, 1, 50, 480], width: 100 },
        { str: 'Page 2 of 2', transform: [1, 0, 0, 1, 250, 25], width: 60 },
      ];

      const p1Text = reconstructPdfPageTextFromItems(page1Items);
      const p2Text = reconstructPdfPageTextFromItems(page2Items);

      expect(p1Text).toContain('A. 对\tB. 错');
      expect(p1Text).not.toContain('Trang 1 / 2');

      expect(p2Text).toContain('A. 老师\tB. 医生\tC. 学生\tD. 朋友');
      expect(p2Text).toContain('ĐÁP ÁN:\n1. A    2. B');
      expect(p2Text).not.toContain('Page 2 of 2');

      // Combined text as extractPdfTextFromBuffer does (joined with '\n\n')
      const combined = `${p1Text}\n\n${p2Text}`;
      const questions = parseUniversalQuestions(combined);
      expect(questions.length).toBe(2);
      expect(questions[0].answer_idx).toBe(0); // 1. A -> index 0
      expect(questions[1].answer_idx).toBe(1); // 2. B -> index 1
    });
  });

  // =========================================================================
  // SCENARIO 2: CORRUPT, TRUNCATED & ANOMALOUS BUFFERS
  // =========================================================================
  describe('Scenario 2: Corrupt & Anomalous Buffers Fault Tolerance', () => {
    it('2.1: Gracefully returns empty string for 0-byte buffer without crashing', async () => {
      const zeroBuf = Buffer.alloc(0);
      const text = await extractPdfTextFromBuffer(zeroBuf);
      expect(text).toBe('');

      const parsed = await parseUploadedFileBuffer(zeroBuf, 'empty.pdf');
      expect(parsed).toEqual([]);

      const details = await extractUploadedFileDetails(zeroBuf, 'empty.pdf');
      expect(details.raw_text).toBe('');
      expect(details.questions).toEqual([]);
      expect(details.file_type).toBe('pdf');
    });

    it('2.2: Gracefully handles truncated PDF header / incomplete streams without unhandled rejection', async () => {
      const truncatedHeaders = [
        Buffer.from('%PDF-1.4\n'),
        Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
        Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
        Buffer.from('%PDF-1.7\n%âãÏÓ\n3 0 obj\n<< /Filter /FlateDecode /Length 12 >>\nstream\n'),
      ];

      for (const tBuf of truncatedHeaders) {
        const text = await extractPdfTextFromBuffer(tBuf);
        expect(text).toBe('');

        const parsed = await parseUploadedFileBuffer(tBuf, 'truncated.pdf');
        expect(parsed).toEqual([]);
      }
    });

    it('2.3: Gracefully handles random pseudo-random binary garbage masquerading as PDF', async () => {
      const randomGarbage = crypto.randomBytes(4096);
      const text = await extractPdfTextFromBuffer(randomGarbage);
      expect(text).toBe('');

      const parsed = await parseUploadedFileBuffer(randomGarbage, 'garbage.pdf');
      expect(parsed).toEqual([]);
    });

    it('2.4: Malformed item streams in reconstructPdfPageTextFromItems (null, missing transform, negative widths, NaN)', () => {
      // A: Null and empty array checks
      expect(reconstructPdfPageTextFromItems([])).toBe('');
      expect(reconstructPdfPageTextFromItems(null as any)).toBe('');
      expect(reconstructPdfPageTextFromItems(undefined as any)).toBe('');

      // B: Items with missing or malformed transform array
      const malformedItems: PdfTextItemLike[] = [
        null as any,
        undefined as any,
        { str: 'Valid Text 1', transform: undefined, width: -10, hasEOL: false },
        { str: '', hasEOL: true },
        { str: 'Valid Text 2', transform: [1, 2] as any, width: 0, hasEOL: true },
        { str: 'Valid Text 3', transform: ['not', 'numbers', 'x', 'y', 'z', 'w'] as any, width: NaN, hasEOL: true },
        { str: 12345 as any, transform: [1, 0, 0, 1, 50, 700], width: 50 },
      ];

      // Must not throw or crash
      const res = reconstructPdfPageTextFromItems(malformedItems);
      expect(typeof res).toBe('string');
      expect(res).toContain('Valid Text 1');
      expect(res).toContain('Valid Text 2');
    });

    it('2.5: Handles negative widths, NaN widths, and unusual coordinate scales gracefully', () => {
      const itemsWithOddMetrics: PdfTextItemLike[] = [
        { str: 'Question: ', transform: [1, 0, 0, 1, 50, 700], width: -100 }, // Negative width fallback
        { str: 'What is this?', transform: [1, 0, 0, 1, 120, 700], width: NaN }, // NaN width fallback
        { str: 'A. Option 1', transform: [1, 0, 0, 1, 50, 680], width: 0 },
        { str: 'B. Option 2', transform: [1, 0, 0, 1, 150, 680], width: 40 },
      ];

      const text = reconstructPdfPageTextFromItems(itemsWithOddMetrics);
      expect(text).toContain('Question: What is this?');
      expect(text).toContain('A. Option 1\tB. Option 2');
    });
  });

  // =========================================================================
  // SCENARIO 3: GEOMETRIC LAYOUT & EDGE CLUSTERING
  // =========================================================================
  describe('Scenario 3: Layout Geometry, Baseline Jitter, and Margin Filtering', () => {
    it('3.1: Strict weak ordering holds under chaotic permutation of text chunks on same and adjacent lines', () => {
      // 3 visual lines, each with 3 chunks, completely shuffled
      const rawChunks = [
        // Line 1: y = 700
        { str: 'Line1-A', transform: [1, 0, 0, 1, 50, 700], width: 30 },
        { str: 'Line1-B', transform: [1, 0, 0, 1, 120, 700], width: 30 },
        { str: 'Line1-C', transform: [1, 0, 0, 1, 190, 700], width: 30 },
        // Line 2: y = 680
        { str: 'Line2-A', transform: [1, 0, 0, 1, 50, 680], width: 30 },
        { str: 'Line2-B', transform: [1, 0, 0, 1, 120, 680], width: 30 },
        { str: 'Line2-C', transform: [1, 0, 0, 1, 190, 680], width: 30 },
        // Line 3: y = 660
        { str: 'Line3-A', transform: [1, 0, 0, 1, 50, 660], width: 30 },
        { str: 'Line3-B', transform: [1, 0, 0, 1, 120, 660], width: 30 },
        { str: 'Line3-C', transform: [1, 0, 0, 1, 190, 660], width: 30 },
      ];

      // Shuffle 10 times to verify V8 sort stability
      for (let s = 0; s < 10; s++) {
        const shuffled = [...rawChunks].sort(() => Math.random() - 0.5);
        const result = reconstructPdfPageTextFromItems(shuffled);
        const lines = result.split('\n');
        expect(lines.length).toBe(3);
        expect(lines[0]).toBe('Line1-A\tLine1-B\tLine1-C');
        expect(lines[1]).toBe('Line2-A\tLine2-B\tLine2-C');
        expect(lines[2]).toBe('Line3-A\tLine3-B\tLine3-C');
      }
    });

    it('3.2: Precision boundary at 18pt gap threshold (gap = 18.0 -> space, gap = 18.1 -> tab)', () => {
      // Piece 1: ends at x = 50 + 20 = 70
      // Piece 2a: starts at x = 88.0 -> gap = 18.0 <= 18 -> space
      const itemsSpace: PdfTextItemLike[] = [
        { str: 'Word1', transform: [1, 0, 0, 1, 50, 700], width: 20 },
        { str: 'Word2', transform: [1, 0, 0, 1, 88.0, 700], width: 20 },
      ];
      expect(reconstructPdfPageTextFromItems(itemsSpace)).toBe('Word1 Word2');

      // Piece 2b: starts at x = 88.2 -> gap = 18.2 > 18 -> tab
      const itemsTab: PdfTextItemLike[] = [
        { str: 'Word1', transform: [1, 0, 0, 1, 50, 700], width: 20 },
        { str: 'Word2', transform: [1, 0, 0, 1, 88.2, 700], width: 20 },
      ];
      expect(reconstructPdfPageTextFromItems(itemsTab)).toBe('Word1\tWord2');
    });

    it('3.3: Chinese character gluing (gap <= 2.5) vs space (gap > 2.5)', () => {
      // Gap = 2.0 <= 2.5 -> glued "你好"
      const glued: PdfTextItemLike[] = [
        { str: '你', transform: [1, 0, 0, 1, 50, 700], width: 10 },
        { str: '好', transform: [1, 0, 0, 1, 62.0, 700], width: 10 }, // gap = 62 - 60 = 2.0
      ];
      expect(reconstructPdfPageTextFromItems(glued)).toBe('你好');

      // Gap = 3.0 > 2.5 -> space "你 好"
      const spaced: PdfTextItemLike[] = [
        { str: '你', transform: [1, 0, 0, 1, 50, 700], width: 10 },
        { str: '好', transform: [1, 0, 0, 1, 63.0, 700], width: 10 }, // gap = 63 - 60 = 3.0
      ];
      expect(reconstructPdfPageTextFromItems(spaced)).toBe('你 好');
    });

    it('3.4: Content at extreme page coordinates (Y < 45 or Y > 750) is preserved if it is real question/answer text, only bare footers are stripped', () => {
      const extremeItems: PdfTextItemLike[] = [
        // Pure running header at top margin y = 780 > 750 (MUST BE STRIPPED)
        { str: 'Page 1 of 5', transform: [1, 0, 0, 1, 250, 780], width: 60 },

        // Real exam header at y = 740 (top of document body, MUST BE PRESERVED)
        { str: 'KỲ THI NĂNG LỰC HÁN NGỮ HSK 2', transform: [1, 0, 0, 1, 100, 740], width: 200 },

        // Body text y = 400 (MUST BE PRESERVED)
        { str: 'Câu 1: 他是老师。', transform: [1, 0, 0, 1, 50, 400], width: 100 },

        // Real answer key at y = 60 (bottom of body, MUST BE PRESERVED)
        { str: 'ĐÁP ÁN: 1. A', transform: [1, 0, 0, 1, 50, 60], width: 80 },

        // Pure bare page footer at bottom margin y = 30 < 45 (MUST BE STRIPPED)
        { str: '- 1 -', transform: [1, 0, 0, 1, 280, 30], width: 30 },
        { str: '1', transform: [1, 0, 0, 1, 500, 20], width: 10 },
      ];

      const res = reconstructPdfPageTextFromItems(extremeItems);
      // Real exam text preserved
      expect(res).toContain('KỲ THI NĂNG LỰC HÁN NGỮ HSK 2');
      expect(res).toContain('Câu 1: 他是老师。');
      expect(res).toContain('ĐÁP ÁN: 1. A');

      // Margin page numbers stripped
      expect(res).not.toContain('Page 1 of 5');
      expect(res).not.toContain('- 1 -');
      const lines = res.split('\n');
      expect(lines).not.toContain('1');
    });
  });

  // =========================================================================
  // SCENARIO 4: DOWNSTREAM INTEGRATION WITH UNIVERSAL QUESTION PARSER
  // =========================================================================
  describe('Scenario 4: Downstream universalQuestionParser Compatibility & Invariants', () => {
    it('4.1: Direct text flow from reconstructPdfPageTextFromItems to parseUniversalQuestions matches answers and options', () => {
      const pdfItems: PdfTextItemLike[] = [
        { str: 'Câu 1: 昨天北京的天气怎么样？', transform: [1, 0, 0, 1, 50, 700], width: 200 },
        // Tab-separated options
        { str: 'A. 太热了', transform: [1, 0, 0, 1, 50, 670], width: 50 },
        { str: 'B. 很好', transform: [1, 0, 0, 1, 150, 670], width: 40 },
        { str: 'C. 不冷', transform: [1, 0, 0, 1, 250, 670], width: 40 },
        { str: 'D. 下雨了', transform: [1, 0, 0, 1, 350, 670], width: 50 },
        { str: 'Câu 2: 他去哪儿了？', transform: [1, 0, 0, 1, 50, 630], width: 120 },
        { str: 'A. 商店', transform: [1, 0, 0, 1, 50, 600], width: 40 },
        { str: 'B. 学校', transform: [1, 0, 0, 1, 150, 600], width: 40 },
        { str: 'C. 医院', transform: [1, 0, 0, 1, 250, 600], width: 40 },
        { str: 'D. 家里', transform: [1, 0, 0, 1, 350, 600], width: 40 },
        // Separated bottom answer key
        { str: 'ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT', transform: [1, 0, 0, 1, 50, 550], width: 150 },
        { str: '1. A - Thời tiết quá nóng (太热了)', transform: [1, 0, 0, 1, 50, 520], width: 180 },
        { str: '2. C - Đến bệnh viện (医院)', transform: [1, 0, 0, 1, 50, 490], width: 160 },
      ];

      const rawText = reconstructPdfPageTextFromItems(pdfItems);
      const parsed = parseUniversalQuestions(rawText);

      expect(parsed.length).toBe(2);

      // Question 1
      expect(parsed[0].stem).toContain('昨天北京的天气怎么样？');
      expect(parsed[0].options).toEqual(['太热了', '很好', '不冷', '下雨了']);
      expect(parsed[0].answer_idx).toBe(0); // A -> 0

      // Question 2
      expect(parsed[1].stem).toContain('他去哪儿了？');
      expect(parsed[1].options).toEqual(['商店', '学校', '医院', '家里']);
      expect(parsed[1].answer_idx).toBe(2); // C -> 2
    });

    it('4.2: True/False Chinese glyphs (对/错, √/×) cleanly recognized and mapped to answer indices', () => {
      const pdfItems: PdfTextItemLike[] = [
        { str: 'Câu 1: 桌子上有一本书。', transform: [1, 0, 0, 1, 50, 700], width: 150 },
        { str: 'A. 对\tB. 错', transform: [1, 0, 0, 1, 50, 670], width: 100 },
        { str: 'Câu 2: 他在睡觉。', transform: [1, 0, 0, 1, 50, 630], width: 100 },
        { str: 'A. √\tB. ×', transform: [1, 0, 0, 1, 50, 600], width: 80 },
        { str: 'ĐÁP ÁN:', transform: [1, 0, 0, 1, 50, 550], width: 60 },
        { str: '1. A   2. B', transform: [1, 0, 0, 1, 50, 530], width: 100 },
      ];

      const rawText = reconstructPdfPageTextFromItems(pdfItems);
      const parsed = parseUniversalQuestions(rawText);

      expect(parsed.length).toBe(2);
      expect(parsed[0].answer_idx).toBe(0); // 1. A -> 对 -> 0
      expect(parsed[1].answer_idx).toBe(1); // 2. B -> × -> 1
    });

    it('4.3: Database invariance check: data/hsk_exam.db and data/qbank/qbank.db SHA-256 remain unaltered', () => {
      const fs = require('fs');
      const hash = (p: string) =>
        crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();

      const hskExamHash = hash('data/hsk_exam.db');
      const qbankHash = hash('data/qbank/qbank.db');

      expect(hskExamHash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
      expect(qbankHash).toBe(initialQBankSha || 'E370C327D1A516804AB9B515D0A921A5917346587B3188796260CE171EF1A5AD');
    });
  });
});
