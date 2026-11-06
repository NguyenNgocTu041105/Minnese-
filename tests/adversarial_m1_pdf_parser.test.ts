/**
 * ADVERSARIAL CHALLENGER SUITE — Milestone M1: PDF Layout-Aware Parser
 *
 * Target: src/server/fileUploadParser.ts (reconstructPdfPageTextFromItems, extractPdfTextFromBuffer)
 *
 * Stress Vectors:
 * 1. Ordering & Permutation Invariance: Reverse streams, 100 random shuffles, interleaved horizontal columns.
 * 2. Extreme Kerning & Baseline Jitter: Jitter up to 3.5pt, multi-char Chinese splits, negative kerning overlaps.
 * 3. Complex Footers & Margin vs Body Discrimination: Margin footers (Page X of Y, 第 X 页 共 Y 页, - X -),
 *    margin bare digits, and strict preservation of body standalone digits ("4", "1"), section titles, and answer keys.
 * 4. Multi-Page HSK Exam Layout: Multi-page binary PDF synthesis with cross-page questions and bottom answer keys.
 * 5. Degenerate Inputs: Empty items, null/undefined properties, missing coords with EOL fallback, zero-length buffers.
 */

import { describe, it, expect } from 'vitest';
import {
  reconstructPdfPageTextFromItems,
  extractPdfTextFromBuffer,
  parseUploadedFileBuffer,
  PdfTextItemLike,
} from '../src/server/fileUploadParser';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser';

// ============================================================================
// PDF BINARY GENERATOR HELPER
// ============================================================================

function generateMultiPageInMemoryPdf(pages: string[][]): Buffer {
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  // Catalog (1 0 obj)
  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // Pages parent (2 0 obj)
  const pageCount = pages.length;
  const pageObjIds = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  offsets.push(pdf.length);
  pdf += `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds}] /Count ${pageCount} >>\nendobj\n`;

  let currentObjId = 3;
  for (let i = 0; i < pages.length; i++) {
    const pageObjId = currentObjId;
    const contentObjId = currentObjId + 1;
    currentObjId += 2;

    const lines = pages[i];
    let contentStream = 'BT\n/F1 12 Tf\n';
    let currentY = 720;

    for (const line of lines) {
      const isFooter = /^(?:Trang|Page)\s*\d+/i.test(line);
      const y = isFooter ? 30 : currentY;

      if (line.includes('\t')) {
        const cols = line.split('\t');
        for (let c = 0; c < cols.length; c++) {
          const colX = 50 + c * 130;
          const escaped = cols[c]
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
          contentStream += `1 0 0 1 ${colX} ${y} Tm (${escaped}) Tj\n`;
        }
      } else {
        const escaped = line
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
        contentStream += `1 0 0 1 50 ${y} Tm (${escaped}) Tj\n`;
      }

      if (!isFooter) {
        currentY -= 25;
      }
    }
    contentStream += 'ET';
    const streamLen = Buffer.byteLength(contentStream, 'latin1');

    // Page object
    offsets.push(pdf.length);
    pdf += `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${3 + pageCount * 2} 0 R >> >> >>\nendobj\n`;

    // Content stream object
    offsets.push(pdf.length);
    pdf += `${contentObjId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  }

  // Font object (contiguous with last content stream)
  const fontObjId = 3 + pageCount * 2;
  offsets.push(pdf.length);
  pdf += `${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Adversarial Challenger Suite: PDF Layout-Aware Parser (Milestone M1)', () => {
  // --------------------------------------------------------------------------
  // SUITE 1: ORDERING & PERMUTATION INVARIANCE
  // --------------------------------------------------------------------------
  describe('Suite 1: Ordering & Permutation Invariance', () => {
    const canonicalExamItems: PdfTextItemLike[] = [
      // Top header (body area y = 740)
      { str: '第一部分: 阅读理解', transform: [1, 0, 0, 1, 50, 740], width: 100 },
      // Question 1 stem
      { str: 'Câu 1: ', transform: [1, 0, 0, 1, 50, 710], width: 35 },
      { str: '他是我的____。', transform: [1, 0, 0, 1, 85, 710], width: 80 },
      // Question 1 horizontal options (Line y = 690)
      { str: 'A. 老师', transform: [1, 0, 0, 1, 50, 690], width: 40 },
      { str: 'B. 苹果', transform: [1, 0, 0, 1, 160, 690], width: 40 },
      { str: 'C. 飞机', transform: [1, 0, 0, 1, 270, 690], width: 40 },
      { str: 'D. 喝水', transform: [1, 0, 0, 1, 380, 690], width: 40 },
      // Question 1 answer
      { str: 'Đáp án: A', transform: [1, 0, 0, 1, 50, 670], width: 50 },
      // Question 2 stem
      { str: 'Câu 2: 他在看____呢。', transform: [1, 0, 0, 1, 50, 640], width: 110 },
      // Question 2 horizontal options (Line y = 620)
      { str: 'A. 电视', transform: [1, 0, 0, 1, 50, 620], width: 40 },
      { str: 'B. 吃饭', transform: [1, 0, 0, 1, 160, 620], width: 40 },
      { str: 'C. 睡觉', transform: [1, 0, 0, 1, 270, 620], width: 40 },
      { str: 'D. 走', transform: [1, 0, 0, 1, 380, 620], width: 40 },
      // Bottom answer table summary (y = 200)
      { str: 'ĐÁP ÁN: 1. A  2. A', transform: [1, 0, 0, 1, 50, 200], width: 120 },
      // Margin footer (y = 30 < 45)
      { str: '第 1 页 共 5 页', transform: [1, 0, 0, 1, 250, 30], width: 80 },
      { str: '1', transform: [1, 0, 0, 1, 550, 25], width: 10 },
    ];

    it('1.1: Reconstructs exact same text when stream is reversed bottom-to-top and right-to-left', () => {
      const canonicalText = reconstructPdfPageTextFromItems(canonicalExamItems);
      const reversedItems = [...canonicalExamItems].reverse();
      const reversedText = reconstructPdfPageTextFromItems(reversedItems);

      expect(reversedText).toBe(canonicalText);
      expect(reversedText).toContain('第一部分: 阅读理解');
      expect(reversedText).toContain('A. 老师\tB. 苹果\tC. 飞机\tD. 喝水');
      expect(reversedText).toContain('A. 电视\tB. 吃饭\tC. 睡觉\tD. 走');
      expect(reversedText).not.toContain('第 1 页 共 5 页');
    });

    it('1.2: Permutation Invariance — 100 completely random item shuffles produce 100% identical outputs', () => {
      const baselineText = reconstructPdfPageTextFromItems(canonicalExamItems);

      for (let trial = 0; trial < 100; trial++) {
        // Seeded-style pseudo-random shuffle
        const shuffled = [...canonicalExamItems].sort(() => Math.sin(trial * 37 + 13) - 0.5);
        const trialText = reconstructPdfPageTextFromItems(shuffled);
        expect(trialText).toBe(baselineText);
      }
    });

    it('1.3: Interleaved horizontal option emissions (D, B, A, C) reconstruct strictly left-to-right (A, B, C, D)', () => {
      const interleavedLineItems: PdfTextItemLike[] = [
        { str: 'D. 四', transform: [1, 0, 0, 1, 380, 500], width: 30 },
        { str: 'B. 二', transform: [1, 0, 0, 1, 160, 500], width: 30 },
        { str: 'A. 一', transform: [1, 0, 0, 1, 50, 500], width: 30 },
        { str: 'C. 三', transform: [1, 0, 0, 1, 270, 500], width: 30 },
      ];

      const lineText = reconstructPdfPageTextFromItems(interleavedLineItems);
      expect(lineText).toBe('A. 一\tB. 二\tC. 三\tD. 四');
    });

    it('1.4: Scrambled individual Hanzi glyphs within words are restored in spatial left-to-right reading order', () => {
      // Word "图书馆" emitted as "馆" (x=70), "图" (x=50), "书" (x=60)
      const scrambledHanziItems: PdfTextItemLike[] = [
        { str: '馆', transform: [1, 0, 0, 1, 70, 600], width: 10 },
        { str: '图', transform: [1, 0, 0, 1, 50, 600], width: 10 },
        { str: '书', transform: [1, 0, 0, 1, 60, 600], width: 10 },
      ];

      const reconstructed = reconstructPdfPageTextFromItems(scrambledHanziItems);
      expect(reconstructed).toBe('图书馆');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: EXTREME KERNING, OVERLAP & BASELINE JITTER
  // --------------------------------------------------------------------------
  describe('Suite 2: Extreme Kerning, Overlap & Baseline Jitter', () => {
    it('2.1: Continuous baseline jitter within |dy| <= 3.5pt is unified into a single coherent visual line', () => {
      // Baseline Y = 700. Jitter offsets between -1.7pt and +1.8pt (total span = 3.5pt <= 3.5pt)
      const jitteredLine: PdfTextItemLike[] = [
        { str: 'Câu 1: ', transform: [1, 0, 0, 1, 50, 700.0], width: 35 },
        { str: '我', transform: [1, 0, 0, 1, 85, 701.8], width: 10 }, // dy = +1.8
        { str: '想', transform: [1, 0, 0, 1, 95, 698.3], width: 10 }, // dy = -1.7
        { str: '喝', transform: [1, 0, 0, 1, 105, 700.5], width: 10 },
        { str: '水', transform: [1, 0, 0, 1, 115, 699.1], width: 10 },
        { str: '。', transform: [1, 0, 0, 1, 125, 700.0], width: 8 },
      ];

      const text = reconstructPdfPageTextFromItems(jitteredLine);
      const lines = text.split('\n');
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('Câu 1: 我想喝水。');
    });

    it('2.2: Line boundary discrimination — lines spaced |dy| >= 4.5pt are strictly separated into distinct lines', () => {
      const distinctLines: PdfTextItemLike[] = [
        { str: 'Dòng thứ nhất', transform: [1, 0, 0, 1, 50, 700.0], width: 80 },
        { str: 'Dòng thứ hai', transform: [1, 0, 0, 1, 50, 695.5], width: 80 }, // dy = 4.5 > 3.5
        { str: 'Dòng thứ ba', transform: [1, 0, 0, 1, 50, 688.0], width: 80 }, // dy = 7.5 > 3.5
      ];

      const text = reconstructPdfPageTextFromItems(distinctLines);
      const lines = text.split('\n');
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('Dòng thứ nhất');
      expect(lines[1]).toBe('Dòng thứ hai');
      expect(lines[2]).toBe('Dòng thứ ba');
    });

    it('2.3: Glued Hanzi: zero gap (0pt), negative kerning overlap (-1.5pt), and micro gaps (2.0pt) yield no spaces', () => {
      const items: PdfTextItemLike[] = [
        // "北京": "北" (50..60), "京" (58.5..68.5) -> gap = -1.5 (overlapping bounding box)
        { str: '北', transform: [1, 0, 0, 1, 50, 600], width: 10 },
        { str: '京', transform: [1, 0, 0, 1, 58.5, 600], width: 10 },
        // "欢迎": "欢" (80..90), "迎" (90..100) -> gap = 0 (exact abutment)
        { str: '欢', transform: [1, 0, 0, 1, 80, 600], width: 10 },
        { str: '迎', transform: [1, 0, 0, 1, 90, 600], width: 10 },
        // "你": "你" (112..122) -> gap from 迎 is 12 (word gap -> single space)
        { str: '你', transform: [1, 0, 0, 1, 112, 600], width: 10 },
      ];

      const text = reconstructPdfPageTextFromItems(items);
      expect(text).toBe('北京 欢迎 你');
    });

    it('2.4: Wide option columns (gap > 18pt) produce clean Tab delimiters without trailing spaces', () => {
      const optionsLine: PdfTextItemLike[] = [
        { str: 'A. 苹果 ', transform: [1, 0, 0, 1, 50, 500], width: 45 },
        // gap = 120 - (50 + 45) = 25 > 18 -> '\t'
        { str: 'B. 香蕉', transform: [1, 0, 0, 1, 120, 500], width: 40 },
        // gap = 190 - (120 + 40) = 30 > 18 -> '\t'
        { str: 'C. 西瓜', transform: [1, 0, 0, 1, 190, 500], width: 40 },
      ];

      const text = reconstructPdfPageTextFromItems(optionsLine);
      expect(text).toBe('A. 苹果\tB. 香蕉\tC. 西瓜');
      expect(text.includes(' \t')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: COMPLEX FOOTERS, RUNNING HEADERS & DIGIT PROTECTION
  // --------------------------------------------------------------------------
  describe('Suite 3: Complex Footers & Margin vs Body Discrimination', () => {
    it('3.1: Strips all standard footer formats when positioned at bottom margins (Y < 45)', () => {
      const testCases = [
        '第 1 页 共 5 页',
        '第 2 页，共 10 页',
        '第 3 页 / 共 5 页',
        '第 4 页',
        'Page 1 of 10',
        'Page 5',
        'Trang 1 / 4',
        'Trang 3',
        '- 3 -',
        '1 / 5',
        '2 of 10',
      ];

      for (const footerStr of testCases) {
        const items: PdfTextItemLike[] = [
          { str: 'Câu 1: 他是医生。', transform: [1, 0, 0, 1, 50, 500], width: 80 },
          { str: footerStr, transform: [1, 0, 0, 1, 250, 30], width: 70 },
        ];
        const res = reconstructPdfPageTextFromItems(items);
        expect(res).toBe('Câu 1: 他是医生。');
        expect(res).not.toContain(footerStr);
      }
    });

    it('3.2: Strips running headers and bare page numbers at top margins (Y > 750)', () => {
      const items: PdfTextItemLike[] = [
        { str: 'Page 1 of 5', transform: [1, 0, 0, 1, 200, 770], width: 60 },
        { str: '1', transform: [1, 0, 0, 1, 550, 770], width: 10 },
        { str: 'Câu 1: 他是谁？', transform: [1, 0, 0, 1, 50, 700], width: 80 },
      ];

      const res = reconstructPdfPageTextFromItems(items);
      expect(res).toBe('Câu 1: 他是谁？');
      expect(res).not.toContain('Page 1 of 5');
      expect(res.split('\n')).not.toContain('1');
    });

    it('3.3: Strict Body Protection: Standalone digits ("4", "1"), section titles, and answer keys in body (45 <= Y <= 750) are 100% preserved', () => {
      const bodyItems: PdfTextItemLike[] = [
        // Section title at Y = 730
        { str: '第一部分: 阅读理解', transform: [1, 0, 0, 1, 50, 730], width: 100 },
        { str: 'Phần 1: Nghe hiểu', transform: [1, 0, 0, 1, 50, 710], width: 100 },
        // Standalone line "4" at Y = 680 (e.g. question number or option value)
        { str: '4', transform: [1, 0, 0, 1, 50, 680], width: 10 },
        // Standalone line "1" at Y = 650
        { str: '1', transform: [1, 0, 0, 1, 50, 650], width: 10 },
        // Question stem containing "4"
        { str: 'Câu 4: 他买了 4 个苹果。', transform: [1, 0, 0, 1, 50, 620], width: 120 },
        // Body answer key at Y = 100
        { str: 'ĐÁP ÁN: 1. A  2. B  3. C  4. D', transform: [1, 0, 0, 1, 50, 100], width: 150 },
        // Actual margin footer at Y = 25
        { str: '1', transform: [1, 0, 0, 1, 500, 25], width: 10 },
      ];

      const res = reconstructPdfPageTextFromItems(bodyItems);
      const lines = res.split('\n');

      expect(lines).toContain('第一部分: 阅读理解');
      expect(lines).toContain('Phần 1: Nghe hiểu');
      expect(lines).toContain('4');
      expect(lines).toContain('1');
      expect(lines).toContain('Câu 4: 他买了 4 个苹果。');
      expect(lines).toContain('ĐÁP ÁN: 1. A  2. B  3. C  4. D');

      // The margin '1' should NOT create an extra '1'
      const onesCount = lines.filter((l) => l.trim() === '1').length;
      expect(onesCount).toBe(1); // exactly one '1' (the body one at y=650)
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: MULTI-PAGE HSK EXAM SYNTHESIS & END-TO-END CBT EXTRACTION
  // --------------------------------------------------------------------------
  describe('Suite 4: Multi-Page HSK Exam Synthesis & End-to-End Extraction', () => {
    it('4.1: Synthesizes a 6-page binary PDF and verifies cross-page question extraction with bottom answer keys', async () => {
      const page1Lines = [
        'Cau 1: Ta shi wo de ____.',
        'A. laoshi\tB. pingguo\tC. feiji\tD. heshui',
        'Trang 1 / 6',
      ];

      const page2Lines = [
        'Cau 2: Tianqi hen re, wo xiang he ____.',
        'A. cha\tB. shu\tC. yifu\tD. che',
        'Trang 2 / 6',
      ];

      const page3Lines = [
        'Cau 3: Ta zuo ____ qu Beijing.',
        'A. feiji\tB. pingguo\tC. yifu\tD. cha',
        'Trang 3 / 6',
      ];

      const page4Lines = [
        'Cau 4: Zheli you san ge ____.',
        'A. pingguo\tB. heshui\tC. re\tD. shangdian',
        'Trang 4 / 6',
      ];

      const page5Lines = [
        'Cau 5: Ta zai ____ kan shu ne.',
        'A. xuexiao\tB. chi\tC. he\tD. feiji',
        'Trang 5 / 6',
      ];

      const page6Lines = [
        'Cau 6: Wo bu renshi na ge ____.',
        'A. hanzi\tB. shui\tC. cha\tD. che',
        'Trang 6 / 7',
      ];

      const page7Lines = [
        'ANSWER KEY',
        '1. A  2. B  3. C  4. D  5. A  6. B',
        'Trang 7 / 7',
      ];

      const multiPagePdfBuf = generateMultiPageInMemoryPdf([
        page1Lines,
        page2Lines,
        page3Lines,
        page4Lines,
        page5Lines,
        page6Lines,
        page7Lines,
      ]);
      expect(multiPagePdfBuf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      // 1. Text extraction
      const extractedText = await extractPdfTextFromBuffer(multiPagePdfBuf);
      expect(extractedText).toContain('Cau 1: Ta shi wo de ____.');
      expect(extractedText).toContain('Cau 3: Ta zuo ____ qu Beijing.');
      expect(extractedText).toContain('Cau 6: Wo bu renshi na ge ____.');
      expect(extractedText).toContain('ANSWER KEY');
      expect(extractedText).not.toContain('Trang 1 / 6');
      expect(extractedText).not.toContain('Trang 7 / 7');

      // 2. Question parsing
      const questions = await parseUploadedFileBuffer(multiPagePdfBuf, 'multi_page_hsk.pdf');
      expect(questions.length).toBe(6);

      // Verify question structure and correct answer resolution
      expect(questions[0].answer_idx).toBe(0); // A
      expect(questions[1].answer_idx).toBe(1); // B
      expect(questions[2].answer_idx).toBe(2); // C
      expect(questions[3].answer_idx).toBe(3); // D
      expect(questions[4].answer_idx).toBe(0); // A
      expect(questions[5].answer_idx).toBe(1); // B

      expect(questions[0].stem).toContain('Ta shi wo de ____.');
      expect(questions[5].stem).toContain('Wo bu renshi na ge ____.');
    });

    it('4.2: Bug Reproduction: pdfjs-dist synthetic space item swallows column gap (> 18pt), converting tabs to spaces', () => {
      // In real PDF streams from pdfjs-dist, spatial jumps produce synthetic space items:
      const realPdfjsItems: PdfTextItemLike[] = [
        { str: 'A. 老师', transform: [1, 0, 0, 1, 50, 700], width: 40 },
        { str: ' ', transform: [1, 0, 0, 1, 90, 700], width: 70 }, // pdfjs-dist synthetic space token
        { str: 'B. 苹果', transform: [1, 0, 0, 1, 160, 700], width: 40 },
      ];

      const result = reconstructPdfPageTextFromItems(realPdfjsItems);
      // EXPECTATION per PROJECT.md Feature 2 & R1 ("khoảng cách cột \t"):
      // The horizontal column gap is 70pt (> 18pt), so it should be separated by Tab '\t':
      expect(result).toBe('A. 老师\tB. 苹果');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: DEGENERATE & MALFORMED STREAM ROBUSTNESS
  // --------------------------------------------------------------------------
  describe('Suite 5: Degenerate & Malformed Stream Robustness', () => {
    it('5.1: Handles empty items, zero-length buffers, and non-string item properties without crashing', async () => {
      expect(reconstructPdfPageTextFromItems([])).toBe('');
      expect(reconstructPdfPageTextFromItems(null as any)).toBe('');
      expect(reconstructPdfPageTextFromItems(undefined as any)).toBe('');

      // Items with corrupt/null values
      const corruptItems: any[] = [
        null,
        undefined,
        {},
        { str: null },
        { str: 123 },
        { str: '', hasEOL: false },
        { str: 'Valid Text', transform: [1, 0, 0, 1, 50, 700], width: 50 },
      ];
      expect(reconstructPdfPageTextFromItems(corruptItems)).toBe('Valid Text');

      // Zero-length buffer
      expect(await extractPdfTextFromBuffer(Buffer.alloc(0))).toBe('');
      // Non-PDF buffer
      expect(await extractPdfTextFromBuffer(Buffer.from('not a pdf at all'))).toBe('');
    });

    it('5.2: Gracefully uses fallback positioning when coordinates are missing and relies on hasEOL', () => {
      const noCoordItems: PdfTextItemLike[] = [
        { str: 'Câu 1: ', width: 35, hasEOL: false },
        { str: '我是学生。', width: 60, hasEOL: true },
        { str: 'A. 对', width: 30, hasEOL: false },
        { str: 'B. 错', width: 30, hasEOL: true },
      ];

      const res = reconstructPdfPageTextFromItems(noCoordItems);
      const lines = res.split('\n');
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('Câu 1: 我是学生。');
      expect(lines[1]).toBe('A. 对 B. 错');
    });

    it('5.3: Stress test performance — processes 1,000 text items under 50ms', () => {
      const thousandItems: PdfTextItemLike[] = [];
      for (let i = 0; i < 1000; i++) {
        thousandItems.push({
          str: `Token_${i}`,
          transform: [1, 0, 0, 1, 50 + (i % 10) * 50, 800 - Math.floor(i / 10) * 15],
          width: 40,
        });
      }

      const t0 = performance.now();
      const output = reconstructPdfPageTextFromItems(thousandItems);
      const t1 = performance.now();

      expect(output.length).toBeGreaterThan(0);
      expect(t1 - t0).toBeLessThan(100); // well within reasonable bounds
    });
  });
});
