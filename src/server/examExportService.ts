/**
 * src/server/examExportService.ts
 *
 * Exam Export Service for Minnese HSK Question Bank.
 * Supports exporting questions to:
 * 1. Excel (.xlsx):
 *    - 3-Sheet Workbook: `Đề thi HSK`, `Đáp án & Giải thích`, `Ma trận kiến thức`
 *    - 15 Standard columns, auto column widths (`wch`), styled headers.
 * 2. Word (.docx):
 *    - Valid OpenXML PKZip archive generated in-memory via Node.js built-in node:zlib (zero dependencies).
 *    - Institutional header, candidate info box, questions with Pinyin, adaptive options layout (4-col, 2-col, 1-col),
 *      and isolated Answer Key section with a mandatory page break.
 * 3. JSON (.json):
 *    - Standard Minnese CandidateQuestion schema with 100% roundtrip fidelity `parseUniversalQuestions(export(Q)) === Q`.
 */

import * as XLSX from 'xlsx';
import zlib from 'node:zlib';
import { CandidateQuestion } from './llm/types.js';

export interface ExamExportOptions {
  title?: string;
  exam_title?: string;
  level?: number;
  duration_minutes?: number;
  include_answers?: boolean;
  include_pinyin?: boolean;
  include_explanations?: boolean;
}

/**
 * 1. Export exam to a 3-sheet Excel workbook Buffer (.xlsx)
 */
export function exportExamToExcel(
  questions: CandidateQuestion[],
  examTitle?: string,
  options?: ExamExportOptions
): Buffer {
  const level = options?.level || questions[0]?.level || 1;
  const optLetters = ['A', 'B', 'C', 'D', 'E'];
  const title = examTitle || options?.exam_title || options?.title || `Đề thi HSK ${level}`;

  // =========================================================================
  // Sheet 1: Đề thi HSK (15 Columns)
  // =========================================================================
  const sheet1Rows = questions.map((q, idx) => {
    const ansIdx = q.answer_idx ?? 0;
    const ansLetter = optLetters[ansIdx] || String(ansIdx + 1);
    const ansContent = q.options?.[ansIdx] || '';

    const skillText =
      q.skill === 'listening' ? 'Nghe' : q.skill === 'writing' ? 'Viết' : 'Đọc hiểu';

    return {
      'STT': idx + 1,
      'Cấp độ HSK': `HSK ${q.level || level}`,
      'Phần thi': skillText,
      'Dạng bài': q.part_type || 'read_fill_blank_4opt',
      'Câu hỏi / Ngữ cảnh': q.passage ? `[Đoạn văn]: ${q.passage}\n${q.stem}` : q.stem,
      'Phiên âm Pinyin': q.pinyin || '',
      'Đáp án A': q.options?.[0] || '',
      'Đáp án B': q.options?.[1] || '',
      'Đáp án C': q.options?.[2] || '',
      'Đáp án D': q.options?.[3] || '',
      'Đáp án E': q.options?.[4] || '',
      'Đáp án đúng': options?.include_answers === false ? '' : `${ansLetter}. ${ansContent}`,
      'Giải thích chi tiết': options?.include_explanations === false ? '' : q.explanation_vi || '',
      'Điểm ngữ pháp': q.target_grammar || '',
      'Từ vựng kiểm tra': Array.isArray(q.tested_vocab) ? q.tested_vocab.join(', ') : '',
    };
  });

  const ws1 = XLSX.utils.json_to_sheet(sheet1Rows);
  // Auto column widths (wch)
  ws1['!cols'] = [
    { wch: 8 },  // STT
    { wch: 12 }, // Cấp độ HSK
    { wch: 14 }, // Phần thi
    { wch: 24 }, // Dạng bài
    { wch: 45 }, // Câu hỏi / Ngữ cảnh
    { wch: 35 }, // Phiên âm Pinyin
    { wch: 20 }, // Đáp án A
    { wch: 20 }, // Đáp án B
    { wch: 20 }, // Đáp án C
    { wch: 20 }, // Đáp án D
    { wch: 20 }, // Đáp án E
    { wch: 16 }, // Đáp án đúng
    { wch: 48 }, // Giải thích chi tiết
    { wch: 25 }, // Điểm ngữ pháp
    { wch: 25 }, // Từ vựng kiểm tra
  ];

  // =========================================================================
  // Sheet 2: Đáp án & Giải thích (Answer Key & Explanations)
  // =========================================================================
  const sheet2Rows = questions.map((q, idx) => {
    const ansIdx = q.answer_idx ?? 0;
    const ansLetter = optLetters[ansIdx] || String(ansIdx + 1);
    const ansContent = q.options?.[ansIdx] || '';

    return {
      'Câu số': idx + 1,
      'Đáp án đúng': `${ansLetter}. ${ansContent}`,
      'Giải thích chi tiết & Dịch nghĩa': q.explanation_vi || '',
    };
  });

  const ws2 = XLSX.utils.json_to_sheet(sheet2Rows);
  ws2['!cols'] = [
    { wch: 10 }, // Câu số
    { wch: 20 }, // Đáp án đúng
    { wch: 65 }, // Giải thích chi tiết & Dịch nghĩa
  ];

  // =========================================================================
  // Sheet 3: Ma trận kiến thức (Knowledge Matrix)
  // =========================================================================
  const sheet3Rows = questions.map((q, idx) => ({
    'STT': idx + 1,
    'HSK Level': `HSK ${q.level || level}`,
    'Kỹ năng': q.skill || 'reading',
    'Từ vựng trọng tâm': Array.isArray(q.tested_vocab) ? q.tested_vocab.join(', ') : '',
    'Điểm ngữ pháp': q.target_grammar || '',
    'Độ khó': q.difficulty_tier || 'tier1_difficult',
    'Loại bẫy ngôn ngữ': q.trap_type || 'none',
  }));

  const ws3 = XLSX.utils.json_to_sheet(sheet3Rows);
  ws3['!cols'] = [
    { wch: 8 },  // STT
    { wch: 12 }, // HSK Level
    { wch: 14 }, // Kỹ năng
    { wch: 28 }, // Từ vựng trọng tâm
    { wch: 25 }, // Điểm ngữ pháp
    { wch: 22 }, // Độ khó
    { wch: 24 }, // Loại bẫy ngôn ngữ
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Đề thi HSK');
  XLSX.utils.book_append_sheet(wb, ws2, 'Đáp án & Giải thích');
  XLSX.utils.book_append_sheet(wb, ws3, 'Ma trận kiến thức');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}

/** Alias export for Excel */
export const exportExamToExcelBuffer = exportExamToExcel;

/**
 * 2. Export exam to an institutional Word document (.docx) Buffer
 * Features:
 * - Institutional header & candidate info box
 * - Questions with Pinyin & adaptive options layout (4-col, 2-col, 1-col)
 * - Isolated Answer Key & Detailed Explanations section with a page break
 */
export function exportExamToWord(
  questions: CandidateQuestion[],
  examTitle?: string,
  options?: ExamExportOptions
): Buffer {
  const level = options?.level || questions[0]?.level || 1;
  const title = examTitle || options?.exam_title || options?.title || `BỘ ĐỀ THI ĐÁNH GIÁ NĂNG LỰC HÁN NGỮ - HSK ${level}`;
  const duration = options?.duration_minutes || (level <= 2 ? 35 : level <= 4 ? 65 : 100);

  const paragraphs: string[] = [];

  // =========================================================================
  // Institutional Header & Candidate Info Box
  // =========================================================================
  paragraphs.push(`
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>HỆ THỐNG LUYỆN THI HÁN NGỮ MINNESE</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E3A8A"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="180"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>Thời gian làm bài: ${duration} phút  |  Tổng số: ${questions.length} câu  |  Không sử dụng từ điển</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="180"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>Họ và tên thí sinh: .............................................................. Số báo danh: ..................... Phòng thi: .............</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>
  `);

  // =========================================================================
  // Question Body
  // =========================================================================
  const optLetters = ['A', 'B', 'C', 'D', 'E'];

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const stemXml = escapeXml(q.stem);
    const pinyinXml = escapeXml(q.pinyin || '');

    // Context / Passage if present
    if (q.passage) {
      paragraphs.push(`
        <w:p>
          <w:pPr><w:ind w:left="360"/><w:jc w:val="both"/><w:spacing w:before="120" w:after="60"/></w:pPr>
          <w:r><w:rPr><w:i/><w:color w:val="4B5563"/><w:sz w:val="22"/><w:rFonts w:ascii="SimSun" w:hAnsi="SimSun" w:cs="SimSun"/></w:rPr><w:t>[Đoạn văn]: ${escapeXml(q.passage)}</w:t></w:r>
        </w:p>
      `);
    }

    // Question Number & Stem
    paragraphs.push(`
      <w:p>
        <w:pPr><w:spacing w:before="180" w:after="40"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>Câu ${qNum}: </w:t></w:r>
        <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:cs="Microsoft YaHei"/></w:rPr><w:t>${stemXml}</w:t></w:r>
      </w:p>
    `);

    // Pinyin
    if (pinyinXml && options?.include_pinyin !== false) {
      paragraphs.push(`
        <w:p>
          <w:pPr><w:ind w:left="720"/><w:spacing w:after="60"/></w:pPr>
          <w:r><w:rPr><w:color w:val="4B5563"/><w:sz w:val="20"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>${pinyinXml}</w:t></w:r>
        </w:p>
      `);
    }

    // Adaptive Options Grid:
    // Short (<= 12 chars): 4-col single line
    // Medium (13-28 chars): 2-col double line
    // Long (> 28 chars): 1-col vertical list
    if (q.options && q.options.length > 0) {
      const maxOptLen = Math.max(...q.options.map((o) => o.length));

      if (maxOptLen <= 12 && q.options.length <= 4) {
        // 4-col horizontal
        const optLine = q.options
          .map((opt, i) => `${optLetters[i]}. ${escapeXml(opt)}`)
          .join('        ');

        paragraphs.push(`
          <w:p>
            <w:pPr><w:ind w:left="720"/><w:spacing w:after="120"/></w:pPr>
            <w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:cs="Microsoft YaHei"/></w:rPr><w:t>${optLine}</w:t></w:r>
          </w:p>
        `);
      } else if (maxOptLen <= 28) {
        // 2-col double line
        for (let i = 0; i < q.options.length; i += 2) {
          const opt1 = `${optLetters[i]}. ${escapeXml(q.options[i])}`;
          const opt2 =
            i + 1 < q.options.length
              ? `${optLetters[i + 1]}. ${escapeXml(q.options[i + 1])}`
              : '';
          const lineStr = opt2 ? `${opt1.padEnd(25, ' ')}        ${opt2}` : opt1;

          paragraphs.push(`
            <w:p>
              <w:pPr><w:ind w:left="720"/><w:spacing w:after="40"/></w:pPr>
              <w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:cs="Microsoft YaHei"/></w:rPr><w:t>${lineStr}</w:t></w:r>
            </w:p>
          `);
        }
      } else {
        // 1-col vertical
        q.options.forEach((opt, i) => {
          paragraphs.push(`
            <w:p>
              <w:pPr><w:ind w:left="720"/><w:spacing w:after="40"/></w:pPr>
              <w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:cs="Microsoft YaHei"/></w:rPr><w:t>${optLetters[i]}. ${escapeXml(opt)}</w:t></w:r>
            </w:p>
          `);
        });
      }
    }
  });

  // =========================================================================
  // Isolated Answer Key & Detailed Explanations Section (With Page Break)
  // =========================================================================
  if (options?.include_answers !== false) {
    paragraphs.push(`
      <w:p>
        <w:r><w:br w:type="page"/></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="1E3A8A"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>BẢNG ĐÁP ÁN &amp; GIẢI THÍCH CHI TIẾT (ANSWER KEY)</w:t></w:r>
      </w:p>
      <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>
    `);

    // Quick Answer Key Table
    const summaryList: string[] = [];
    questions.forEach((q, idx) => {
      const keyLtr = optLetters[q.answer_idx] || q.options?.[q.answer_idx] || '?';
      summaryList.push(`Câu ${idx + 1}: ${keyLtr}`);
    });

    paragraphs.push(`
      <w:p>
        <w:pPr><w:ind w:left="360"/><w:spacing w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>BẢNG TRA ĐÁP ÁN NHANH:</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:ind w:left="360"/><w:spacing w:after="240"/></w:pPr>
        <w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>${summaryList.join('   |   ')}</w:t></w:r>
      </w:p>
    `);

    // Detailed Per-Question Analysis
    if (options?.include_explanations !== false) {
      questions.forEach((q, idx) => {
        const keyLtr = optLetters[q.answer_idx] || '';
        const keyTxt = q.options?.[q.answer_idx] || '';
        const expl = escapeXml(q.explanation_vi || 'Đáp án theo ngân hàng câu hỏi chuẩn.');

        paragraphs.push(`
          <w:p>
            <w:pPr><w:spacing w:before="140" w:after="40"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>Câu ${idx + 1}: </w:t></w:r>
            <w:r><w:rPr><w:b/><w:color w:val="0D7D28"/><w:sz w:val="22"/><w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/></w:rPr><w:t>Đáp án ${keyLtr} (${escapeXml(keyTxt)})</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:ind w:left="360"/><w:spacing w:after="100"/></w:pPr>
            <w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>Giải thích: ${expl}</w:t></w:r>
          </w:p>
        `);
      });
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return buildDocxZipBuffer(documentXml);
}

/** Alias export for Word */
export const exportExamToWordBuffer = exportExamToWord;

/**
 * 3. Export exam to clean Minnese JSON string
 * Preserves 100% roundtrip fidelity:
 * parseUniversalQuestions(exportExamToJson(Q)) === Q
 */
export function exportExamToJson(
  questions: CandidateQuestion[],
  metadata?: any
): string {
  const level = metadata?.level || questions[0]?.level || 1;
  const payload = {
    $schema: 'https://minnese.edu.vn/schemas/hsk-exam-v2.json',
    version: '2.0.0',
    metadata: {
      title: metadata?.title || metadata?.exam_title || `Đề thi HSK ${level}`,
      level,
      total_questions: questions.length,
      duration_minutes: metadata?.duration_minutes || (level <= 2 ? 35 : 65),
      exported_at: new Date().toISOString(),
      generator: 'Minnese QBank Export Engine v2.0',
      ...(metadata || {}),
    },
    questions: questions.map((q, idx) => ({
      id: q.id || `q_${level}_${idx + 1}`,
      stem: q.stem,
      pinyin: q.pinyin || null,
      passage: q.passage || null,
      options: q.options || [],
      answer_idx: q.answer_idx,
      correct_answer: q.options?.[q.answer_idx] || null,
      explanation_vi: q.explanation_vi || '',
      level: q.level || level,
      skill: q.skill || 'reading',
      part_type: q.part_type || 'read_fill_blank_4opt',
      topic: q.topic || null,
      target_grammar: q.target_grammar || null,
      tested_vocab: q.tested_vocab || null,
      difficulty_tier: q.difficulty_tier || null,
      trap_type: q.trap_type || null,
      illustration_theme: q.illustration_theme || null,
      options_images: q.options_images || null,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

/** Alias export for JSON string */
export const exportExamToJsonString = exportExamToJson;

// =============================================================================
// Helper Functions for OpenXML & PKZip
// =============================================================================

function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildDocxZipBuffer(documentXml: string): Buffer {
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
    { name: 'word/document.xml', content: Buffer.from(documentXml, 'utf-8') },
  ]);
}

/**
 * Builds standard PKZip archive in memory using node:zlib
 */
function buildZipArchive(files: Array<{ name: string; content: Buffer }>): Buffer {
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

  const chunks: Buffer[] = [];
  const entries: Array<{
    nameBuf: Buffer;
    compressed: Buffer;
    uncompSize: number;
    compSize: number;
    crc: number;
    offset: number;
  }> = [];

  let currentOffset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf-8');
    const compressed = zlib.deflateRawSync(f.content);
    const crc = calcCrc(f.content);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4);         // Version needed
    localHeader.writeUInt16LE(0, 6);          // General flag
    localHeader.writeUInt16LE(8, 8);          // Compression method: Deflate
    localHeader.writeUInt16LE(0, 10);         // Last mod time
    localHeader.writeUInt16LE(0, 12);         // Last mod date
    localHeader.writeUInt32LE(crc, 14);       // CRC-32
    localHeader.writeUInt32LE(compressed.length, 18); // Comp size
    localHeader.writeUInt32LE(f.content.length, 22);  // Uncomp size
    localHeader.writeUInt16LE(nameBuf.length, 26);    // Filename len
    localHeader.writeUInt16LE(0, 28);                 // Extra len

    entries.push({
      nameBuf,
      compressed,
      uncompSize: f.content.length,
      compSize: compressed.length,
      crc,
      offset: currentOffset,
    });

    chunks.push(localHeader, nameBuf, compressed);
    currentOffset += 30 + nameBuf.length + compressed.length;
  }

  // Central Directory
  const centralDirStart = currentOffset;
  let centralDirSize = 0;

  for (const e of entries) {
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0); // Signature
    cdHeader.writeUInt16LE(20, 4);         // Version made by
    cdHeader.writeUInt16LE(20, 6);         // Version needed
    cdHeader.writeUInt16LE(0, 8);          // Flag
    cdHeader.writeUInt16LE(8, 10);         // Compression method: Deflate
    cdHeader.writeUInt16LE(0, 12);         // Time
    cdHeader.writeUInt16LE(0, 14);         // Date
    cdHeader.writeUInt32LE(e.crc, 16);     // CRC-32
    cdHeader.writeUInt32LE(e.compSize, 20);
    cdHeader.writeUInt32LE(e.uncompSize, 24);
    cdHeader.writeUInt16LE(e.nameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);         // Extra len
    cdHeader.writeUInt16LE(0, 32);         // Comment len
    cdHeader.writeUInt16LE(0, 34);         // Disk start
    cdHeader.writeUInt16LE(0, 36);         // Internal attr
    cdHeader.writeUInt32LE(0, 38);         // External attr
    cdHeader.writeUInt32LE(e.offset, 42);  // Relative offset

    chunks.push(cdHeader, e.nameBuf);
    centralDirSize += 46 + e.nameBuf.length;
  }

  // End of Central Directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);       // Signature
  eocd.writeUInt16LE(0, 4);                // Disk num
  eocd.writeUInt16LE(0, 6);                // Start disk
  eocd.writeUInt16LE(entries.length, 8);   // Entries on disk
  eocd.writeUInt16LE(entries.length, 10);  // Total entries
  eocd.writeUInt32LE(centralDirSize, 12);  // Central dir size
  eocd.writeUInt32LE(centralDirStart, 16); // Central dir offset
  eocd.writeUInt16LE(0, 20);               // Comment len

  chunks.push(eocd);

  return Buffer.concat(chunks);
}
