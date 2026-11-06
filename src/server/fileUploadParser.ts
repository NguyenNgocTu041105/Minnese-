/**
 * src/server/fileUploadParser.ts
 *
 * Universal Multi-Format File Ingestion Service for Minnese QBank.
 * Supports extracting questions from:
 * 1. Excel (.xlsx, .xls) and CSV (.csv):
 *    - Case 1: Header row anywhere in Rows 1–25 (skips title banners & metadata rows).
 *    - Case 2: Headerless tabular spreadsheets (auto-detects MCQ & True/False column shapes).
 *    - Case 3: Single-cell combined options ("A. ... B. ... C. ... D. ...", newline/pipe/semicolon separated).
 *    - Case 4: Inline marked correct options (*A. 老师, 老师 (Đúng), [x] 苹果, ✓ 飞机).
 *    - Case 5: Multi-sheet workbooks (Questions on Sheet 1, Answer Key on Sheet 2 "Đáp án" / "Answer Key").
 *    - Case 6: 4-Part HSK Exam free-form layout in Excel (pairs horizontal A|B|C|D|E rows with word bank cells).
 *    - Case 7: CSV encodings (UTF-8 BOM, UTF-16LE/BE BOM) and delimiters (comma, semicolon, tab, pipe).
 * 2. Word (.docx):
 *    - Unpacks PKZip archive in-memory using Node.js built-in node:zlib.
 *    - Reconstructs Word automatic numbering (<w:numPr> + word/numbering.xml) for 1., 2. and A., B., C., D.
 *    - Detects formatting-marked correct answers (bold <w:b/>, color <w:color/>, highlight <w:highlight/>, shading <w:shd/>, underline <w:u/>).
 *    - Converts all 5 Word table (<w:tbl>) layouts (horizontal word bank, bottom answer key table, 2-col option pool, question-per-row table, True/False table).
 * 3. PDF (.pdf):
 *    - X/Y coordinate-aware line & column reconstruction from pdfjs-dist text items.
 *    - Preserves line breaks, horizontal option columns, and strips page number footers.
 * 4. Plain Text (.txt / .json):
 *    - BOM-aware decoding and universal question parsing.
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import zlib from 'node:zlib';
import { pinyin as getPinyinPro } from 'pinyin-pro';
import { parseUniversalQuestions, UniversalParseOptions } from './llm/universalQuestionParser.js';
import { solveSingleQuestionSync, solveTrueFalseQuestion } from './llm/autoAnswerSolver.js';
import { CandidateQuestion } from './llm/types.js';

export interface ExtractedFileResult {
  filename: string;
  file_type: 'xlsx' | 'xls' | 'csv' | 'docx' | 'pdf' | 'txt' | 'json';
  raw_text: string;
  is_structured_table: boolean;
  questions: CandidateQuestion[];
  diagnostics?: {
    detected_mode: string;
    sheets_processed?: number;
    external_answer_keys_found?: number;
  };
}

/**
 * Decodes a text buffer with automatic BOM detection (UTF-8 BOM, UTF-16LE BOM, UTF-16BE BOM).
 */
export function decodeTextBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) return '';

  // UTF-8 BOM (EF BB BF)
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf-8');
  }

  // UTF-16LE BOM (FF FE)
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }

  // UTF-16BE BOM (FE FF)
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.allocUnsafe(buffer.length - 2);
    for (let i = 2; i + 1 < buffer.length; i += 2) {
      swapped[i - 2] = buffer[i + 1];
      swapped[i - 1] = buffer[i];
    }
    return swapped.toString('utf16le');
  }

  // Heuristic for UTF-16LE without BOM (null bytes at odd positions in ASCII range)
  if (buffer.length >= 8 && buffer[1] === 0x00 && buffer[3] === 0x00) {
    return buffer.toString('utf16le');
  }

  return buffer.toString('utf-8');
}

/**
 * Unpacks a PKZip archive in memory using Node.js built-in node:zlib.
 * Handles both standard local file headers and Central Directory headers (supports data descriptor bit 3).
 */
export function unpackZipFiles(buffer: Buffer): Record<string, Buffer> {
  const files: Record<string, Buffer> = {};
  if (!buffer || buffer.length < 22) {
    return files;
  }

  // Find End of Central Directory (EOCD) signature 0x06054b50 searching backwards
  let eocdOffset = -1;
  const maxSearch = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= maxSearch; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
    const cdEntries = buffer.readUInt16LE(eocdOffset + 10);
    let cur = cdOffset;

    for (let i = 0; i < cdEntries && cur + 46 <= buffer.length; i++) {
      if (buffer.readUInt32LE(cur) !== 0x02014b50) break;

      const compMethod = buffer.readUInt16LE(cur + 10);
      const compSize = buffer.readUInt32LE(cur + 20);
      const fnLen = buffer.readUInt16LE(cur + 28);
      const extraLen = buffer.readUInt16LE(cur + 30);
      const commentLen = buffer.readUInt16LE(cur + 32);
      const localHdrOffset = buffer.readUInt32LE(cur + 42);
      const filename = buffer.toString('utf8', cur + 46, cur + 46 + fnLen);

      if (localHdrOffset + 30 <= buffer.length && buffer.readUInt32LE(localHdrOffset) === 0x04034b50) {
        const localFnLen = buffer.readUInt16LE(localHdrOffset + 26);
        const localExtraLen = buffer.readUInt16LE(localHdrOffset + 28);
        const dataStart = localHdrOffset + 30 + localFnLen + localExtraLen;

        if (dataStart + compSize <= buffer.length) {
          const compData = buffer.subarray(dataStart, dataStart + compSize);
          let decomp = compData;
          if (compMethod === 8) {
            try {
              decomp = zlib.inflateRawSync(compData);
            } catch {
              decomp = compData;
            }
          }
          files[filename] = decomp;
        }
      }

      cur += 46 + fnLen + extraLen + commentLen;
    }
  }

  // Fallback: Scan local headers directly if EOCD produced no files
  if (Object.keys(files).length === 0) {
    let offset = 0;
    while (offset + 30 <= buffer.length) {
      const sig = buffer.readUInt32LE(offset);
      if (sig !== 0x04034b50) break;

      const compMethod = buffer.readUInt16LE(offset + 8);
      const compSize = buffer.readUInt32LE(offset + 18);
      const fnLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);
      const filename = buffer.toString('utf8', offset + 30, offset + 30 + fnLen);
      const dataStart = offset + 30 + fnLen + extraLen;

      if (compSize > 0 && dataStart + compSize <= buffer.length) {
        const compData = buffer.subarray(dataStart, dataStart + compSize);
        let decomp = compData;
        if (compMethod === 8) {
          try {
            decomp = zlib.inflateRawSync(compData);
          } catch {
            decomp = compData;
          }
        }
        files[filename] = decomp;
        offset = dataStart + compSize;
      } else {
        offset = dataStart;
        break;
      }
    }
  }

  return files;
}

// ============================================================================
// R2: DEEP WORD (.DOCX) PARSER (Auto-Numbering, Styled Answers, Smart Tables)
// ============================================================================

function unescapeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

interface DocxNumberingLevel {
  numFmt: string;
  lvlText: string;
  start: number;
}

function parseDocxNumberingXml(numberingXml?: string): Map<string, Map<number, DocxNumberingLevel>> {
  const numMap = new Map<string, Map<number, DocxNumberingLevel>>();
  if (!numberingXml) return numMap;

  const abstractMap = new Map<string, Map<number, DocxNumberingLevel>>();
  const abstractMatches = numberingXml.matchAll(/<w:abstractNum\b[^>]*w:abstractNumId="([^"]+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/gi);
  for (const am of abstractMatches) {
    const absId = am[1];
    const body = am[2];
    const lvlMap = new Map<number, DocxNumberingLevel>();
    const lvlMatches = body.matchAll(/<w:lvl\b[^>]*w:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvl>/gi);
    for (const lm of lvlMatches) {
      const ilvl = parseInt(lm[1], 10);
      const lBody = lm[2];
      const fmtMatch = lBody.match(/<w:numFmt\b[^>]*w:val="([^"]+)"/i);
      const txtMatch = lBody.match(/<w:lvlText\b[^>]*w:val="([^"]+)"/i);
      const startMatch = lBody.match(/<w:start\b[^>]*w:val="(\d+)"/i);
      lvlMap.set(ilvl, {
        numFmt: fmtMatch ? fmtMatch[1] : ilvl === 0 ? 'decimal' : 'upperLetter',
        lvlText: txtMatch ? txtMatch[1] : '%1.',
        start: startMatch ? parseInt(startMatch[1], 10) : 1,
      });
    }
    abstractMap.set(absId, lvlMap);
  }

  const numMatches = numberingXml.matchAll(/<w:num\b[^>]*w:numId="([^"]+)"[^>]*>([\s\S]*?)<\/w:num>/gi);
  for (const nm of numMatches) {
    const numId = nm[1];
    const nBody = nm[2];
    const absMatch = nBody.match(/<w:abstractNumId\b[^>]*w:val="([^"]+)"/i);
    if (absMatch && abstractMap.has(absMatch[1])) {
      numMap.set(numId, abstractMap.get(absMatch[1])!);
    }
  }

  return numMap;
}

interface ParsedParagraph {
  text: string;
  isEmphasized: boolean;
  emphasizedSegments: string[];
  charEmphasis: boolean[];
  numId?: string;
  ilvl?: number;
}

function isRunEmphasized(rPrXml: string): { emphasized: boolean; isUnderlineOnly: boolean } {
  if (!rPrXml) return { emphasized: false, isUnderlineOnly: false };

  const hasStandardBold =
    /<w:b(?:\s*\/|\s+w:val="(?:true|1|on)")?>/i.test(rPrXml) &&
    !/<w:b\s+w:val="(?:false|0|off)"/i.test(rPrXml);

  const hasComplexScriptBold =
    /<w:bCs(?:\s*\/|\s+w:val="(?:true|1|on)")?>/i.test(rPrXml) &&
    !/<w:bCs\s+w:val="(?:false|0|off)"/i.test(rPrXml);

  const hasBold = hasStandardBold || hasComplexScriptBold;

  const colorMatch = rPrXml.match(/<w:color\b[^>]*w:val="([^"]+)"/i);
  const colorVal = colorMatch ? colorMatch[1].toUpperCase() : '';

  const themeColorMatch = rPrXml.match(/<w:color\b[^>]*w:themeColor="([^"]+)"/i);
  const themeColorVal = themeColorMatch ? themeColorMatch[1].toLowerCase() : '';
  const hasThemeColor = Boolean(themeColorVal) && themeColorVal !== 'none';

  const hasExplicitColor =
    Boolean(colorVal) &&
    colorVal !== 'AUTO' &&
    colorVal !== '000000' &&
    colorVal !== 'NONE' &&
    !/^(?:111111|222222|333333|444444)$/.test(colorVal);

  const hasHighlightColor = hasExplicitColor || (hasThemeColor && colorVal !== '000000');

  const hasHighlight =
    /<w:highlight\b[^>]*w:val="(?!none)[^"]+"/i.test(rPrXml) ||
    /<w:shd\b[^>]*w:fill="(?!auto|ffffff|none)[^"]+"/i.test(rPrXml);

  const hasUnderline =
    /<w:u(?:\s*\/|\s+w:val="(?!none)[^"]+")[^>]*>/i.test(rPrXml);

  const strongEmphasis = hasBold || hasHighlightColor || hasHighlight;
  return {
    emphasized: strongEmphasis || hasUnderline,
    isUnderlineOnly: !strongEmphasis && hasUnderline,
  };
}

function parseDocxParagraphXml(pXml: string): ParsedParagraph {
  let numId: string | undefined;
  let ilvl: number | undefined;

  const numPrMatch = pXml.match(/<w:numPr>([\s\S]*?)<\/w:numPr>/i);
  if (numPrMatch) {
    const idMatch = numPrMatch[1].match(/<w:numId\b[^>]*w:val="([^"]+)"/i);
    const lvlMatch = numPrMatch[1].match(/<w:ilvl\b[^>]*w:val="(\d+)"/i);
    if (idMatch) numId = idMatch[1];
    ilvl = lvlMatch ? parseInt(lvlMatch[1], 10) : 0;
  }

  // Paragraph-level shading or rPr emphasis
  const pPrMatch = pXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/i);
  const pLevelEmphasis = pPrMatch ? isRunEmphasized(pPrMatch[1]).emphasized : false;

  const runs = Array.from(pXml.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>|<w:br\b[^>]*\/?>/gi));
  let fullText = '';
  let anyRunEmphasized = pLevelEmphasis;
  const emphasizedSegments: string[] = [];
  const charEmphasis: boolean[] = [];

  for (const rMatch of runs) {
    const token = rMatch[0];
    if (/^<w:br/i.test(token)) {
      fullText += '\n';
      charEmphasis.push(false);
      continue;
    }

    const rBody = rMatch[1] || '';
    const rPrMatch = rBody.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/i);
    const { emphasized, isUnderlineOnly } = isRunEmphasized(rPrMatch ? rPrMatch[1] : '');

    const tMatches = Array.from(rBody.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/?>/gi));
    let runText = '';
    for (const tm of tMatches) {
      if (/^<w:tab/i.test(tm[0])) {
        runText += isUnderlineOnly ? '____' : '\t';
      } else {
        runText += unescapeXmlEntities(tm[1] || '');
      }
    }

    // Empty/whitespace underlined run inside a sentence represents a blank placeholder ____
    const isBlankPlaceholder = isUnderlineOnly && runText.length > 0 && /^[\s\u3000_]+$/.test(runText);
    if (isBlankPlaceholder) {
      runText = '____';
    }

    const isRunEmp = Boolean(
      (emphasized || pLevelEmphasis) &&
      !isBlankPlaceholder &&
      runText.trim().length > 0
    );

    for (let c = 0; c < runText.length; c++) {
      charEmphasis.push(isRunEmp && runText[c].trim().length > 0);
    }

    if (isRunEmp) {
      anyRunEmphasized = true;
      emphasizedSegments.push(runText.trim());
    } else if (emphasized && !isBlankPlaceholder) {
      anyRunEmphasized = true;
    }

    fullText += runText;
  }

  // Fallback if <w:t> tags existed outside standard <w:r>
  if (!fullText) {
    fullText = unescapeXmlEntities(
      pXml
        .replace(/<w:br[^>]*>/gi, '\n')
        .replace(/<w:t[^>]*>(.*?)<\/w:t>/gi, '$1')
        .replace(/<[^>]+>/g, '')
    );
  }

  while (charEmphasis.length < fullText.length) {
    charEmphasis.push(anyRunEmphasized);
  }

  const trimmed = fullText.trim();
  const leadSpaces = fullText.indexOf(trimmed);
  const slicedEmphasis = leadSpaces >= 0 ? charEmphasis.slice(leadSpaces, leadSpaces + trimmed.length) : charEmphasis;

  return {
    text: trimmed,
    isEmphasized: anyRunEmphasized,
    emphasizedSegments,
    charEmphasis: slicedEmphasis,
    numId,
    ilvl,
  };
}

function detectMarkedOptionInLine(p: ParsedParagraph): string | null {
  if (!p.isEmphasized && p.emphasizedSegments.length === 0) return null;

  // Case B: Horizontal options on one line ("A. 老师   B. 苹果   C. 飞机   D. 喝水") where one option segment is emphasized
  const optRegex = /(?:^|[\s\t]+|(?<=[。！？，；：,.!?;:\)\]）]))[\(\[（]?([A-Fa-f])[\)\]）\.\:、\s]/g;
  const matches = Array.from(p.text.matchAll(optRegex));

  if (matches.length >= 2) {
    const optionMatches: Array<{ letter: string; start: number; end: number }> = [];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const letter = m[1].toUpperCase();
      const start = m.index!;
      const end = i + 1 < matches.length ? matches[i + 1].index! : p.text.length;
      optionMatches.push({ letter, start, end });
    }

    const emphasizedLetters: string[] = [];
    for (const opt of optionMatches) {
      let optHasEmp = false;
      if (p.charEmphasis && p.charEmphasis.length === p.text.length) {
        for (let idx = opt.start; idx < opt.end; idx++) {
          if (p.charEmphasis[idx]) {
            optHasEmp = true;
            break;
          }
        }
      } else {
        const optText = p.text.slice(opt.start, opt.end);
        optHasEmp = p.emphasizedSegments.some((seg) => seg.length > 0 && optText.includes(seg));
      }
      if (optHasEmp) {
        emphasizedLetters.push(opt.letter);
      }
    }

    if (emphasizedLetters.length === 1) {
      return emphasizedLetters[0];
    }
    return null;
  }

  // Case A: The entire paragraph is a single option line (e.g. "B. 苹果") and is emphasized
  const singleOptMatch = p.text.match(/^[\(\[（]?([A-Fa-f])[\)\]）\.\:、\s]\s*(.+)$/);
  if (singleOptMatch && p.isEmphasized) {
    return singleOptMatch[1].toUpperCase();
  }

  return null;
}


function formatDocxTable(tblXml: string): { lines: string[]; bottomAnswerKeyLines: string[] } {
  const lines: string[] = [];
  const bottomAnswerKeyLines: string[] = [];

  const trMatches = Array.from(tblXml.matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/gi));
  const grid: Array<Array<{ text: string; isEmphasized: boolean }>> = [];

  for (const tr of trMatches) {
    const tcMatches = Array.from(tr[1].matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/gi));
    const rowCells: Array<{ text: string; isEmphasized: boolean }> = [];
    for (const tc of tcMatches) {
      const tcBody = tc[1];
      const cellShdEmphasized = /<w:shd\b[^>]*w:fill="(?!auto|ffffff|none)[^"]+"/i.test(tcBody);
      const pMatches = Array.from(tcBody.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi));
      const cellParagraphs = pMatches.map((pm) => parseDocxParagraphXml(pm[0]));
      const cellText = cellParagraphs
        .map((cp) => cp.text)
        .filter(Boolean)
        .join(' ')
        .trim();
      const cellEmphasized = cellShdEmphasized || cellParagraphs.some((cp) => cp.isEmphasized);
      rowCells.push({ text: cellText, isEmphasized: cellEmphasized });
    }
    if (rowCells.some((c) => c.text.length > 0)) {
      grid.push(rowCells);
    }
  }

  if (grid.length === 0) return { lines, bottomAnswerKeyLines };

  // Layout 1: 2-Row Horizontal Word Bank Table (Row 0: A | B | C | D | E, Row 1: words)
  // User Requirement R2.3: format as "A. word\nB. word\nC. word..." and strip trailing punctuation from headers
  if (
    grid.length === 2 &&
    grid[0].length >= 3 &&
    grid[0].length === grid[1].length &&
    grid[0].every((c) => /^[A-F][\.\:\s]*$/i.test(c.text.trim()))
  ) {
    for (let c = 0; c < grid[0].length; c++) {
      const letter = grid[0][c].text.trim().replace(/[\.\:\s]/g, '').toUpperCase();
      const word = grid[1][c].text.trim();
      lines.push(`${letter}. ${word}`);
    }
    return { lines, bottomAnswerKeyLines };
  }

  // Layout 2: Bottom Answer Key Table (pairs of rows where Row 2k is 1, 2, 3... and Row 2k+1 is A, B, C / √, ×)
  // Supports optional leading label column: e.g. "Câu | 1 | 2 | 3" and "Đáp án | A | B | C"
  if (grid.length >= 2 && grid.length % 2 === 0) {
    let matchesHorizontalKey = true;
    const candidateKeys: string[] = [];

    for (let r = 0; r + 1 < grid.length; r += 2) {
      const qRow = grid[r];
      const aRow = grid[r + 1];
      if (qRow.length < 2 || aRow.length < 2) {
        matchesHorizontalKey = false;
        break;
      }

      const hasLabelCol =
        !/^(?:(?:Câu|第|Q)\s*)?\d+(?:\s*题)?$/i.test(qRow[0].text.trim()) &&
        /(?:câu|question|stt|题号|item|no\.?)/i.test(qRow[0].text) &&
        /(?:đáp\s*án|answer|key|答案|\bda\b)/i.test(aRow[0].text);

      const startCol = hasLabelCol ? 1 : 0;
      const qCells = qRow.slice(startCol);
      const aCells = aRow.slice(startCol);

      if (
        qCells.length < 2 ||
        !qCells.every((c) => /^(?:(?:Câu|第|Q)\s*)?\d+(?:\s*题)?$/i.test(c.text.trim())) ||
        !aCells.every((c) => /^[A-Fa-f对错√×✓✗ĐúngSaiTrueFalse0-5]+$/i.test(c.text.trim()))
      ) {
        matchesHorizontalKey = false;
        break;
      }

      for (let c = 0; c < Math.min(qCells.length, aCells.length); c++) {
        const qNumMatch = qCells[c].text.match(/\d+/);
        const ans = aCells[c].text.trim();
        if (qNumMatch && ans) {
          candidateKeys.push(`${qNumMatch[0]}. ${ans}`);
        }
      }
    }

    if (matchesHorizontalKey && candidateKeys.length >= 2) {
      bottomAnswerKeyLines.push(...candidateKeys);
      return { lines, bottomAnswerKeyLines };
    }
  }

  // Layout 2B: Vertical Answer Key Table (2 columns: Col 0 is Question #, Col 1 is Answer)
  if (grid.length >= 3 && grid.every((r) => r.length === 2)) {
    const hasHeader =
      /(?:câu|question|stt|题号|item|no\.?)/i.test(grid[0][0].text) &&
      /(?:đáp\s*án|answer|key|答案|\bda\b)/i.test(grid[0][1].text);
    const dataRows = hasHeader ? grid.slice(1) : grid;
    const isVerticalKey =
      dataRows.length >= 2 &&
      dataRows.every(
        (r) =>
          /^(?:(?:Câu|第|Q)\s*)?\d+(?:\s*题)?$/i.test(r[0].text.trim()) &&
          /^[A-Fa-f对错√×✓✗ĐúngSaiTrueFalse0-5]+$/i.test(r[1].text.trim())
      );

    if (isVerticalKey) {
      for (const r of dataRows) {
        const qNumMatch = r[0].text.match(/\d+/);
        const ans = r[1].text.trim();
        if (qNumMatch && ans) {
          bottomAnswerKeyLines.push(`${qNumMatch[0]}. ${ans}`);
        }
      }
      return { lines, bottomAnswerKeyLines };
    }
  }

  // Layout 3: 2-Column Shared Option Pool Table (Col 0 is A..F or Ký hiệu, Col 1 is option text)
  const optionPoolRows = grid.filter(
    (r) => r.length >= 2 && /^[A-F]$/i.test(r[0].text.trim()) && /[\u4e00-\u9fa5]/.test(r[1].text)
  );
  if (optionPoolRows.length >= 2 && optionPoolRows.length >= grid.length - 1) {
    for (const r of optionPoolRows) {
      lines.push(`| ${r[0].text.trim().toUpperCase()} | ${r[1].text.trim()} |`);
    }
    return { lines, bottomAnswerKeyLines };
  }

  // Layout 4: Question-Per-Row Table (Header row or rows with Stem + 4 Options + optional Answer/Explanation)
  let headerRowIdx = -1;
  const maxScanRows = Math.min(3, grid.length);

  for (let r = 0; r < maxScanRows; r++) {
    const rowTexts = grid[r].map((c) => c.text.toLowerCase().trim());
    const hasQuestionCol = rowTexts.some((t) =>
      /(?:câu(?:\s*hỏi)?|đề\s*bài|stem|question|题干|题目|nội\s*dung)/i.test(t)
    );
    const optMatches = ['a', 'b', 'c', 'd'].filter((opt) => rowTexts.includes(opt));
    const hasOptHeaders = optMatches.length >= 3;
    const hasAnsHeader = rowTexts.some((t) => /(?:đáp\s*án|answer|key|答案|\bda\b)/i.test(t));

    if (hasOptHeaders || (hasQuestionCol && (hasAnsHeader || grid[r].length >= 5))) {
      headerRowIdx = r;
      break;
    }
  }

  const hasTableHeader = headerRowIdx !== -1;
  const startRow = hasTableHeader ? headerRowIdx + 1 : 0;
  let looksLikeQuestionPerRow = hasTableHeader;

  if (!looksLikeQuestionPerRow && grid.length > 0) {
    const sampleRow = grid[startRow];
    if (sampleRow && sampleRow.length >= 5) {
      const hasNumFirst = /^\d+$/.test(sampleRow[0].text.trim());
      const stemColIdx = hasNumFirst ? 1 : 0;
      if (
        sampleRow.length >= stemColIdx + 5 &&
        /[\u4e00-\u9fa5]/.test(sampleRow[stemColIdx].text) &&
        /[\u4e00-\u9fa5]/.test(sampleRow[stemColIdx + 1].text)
      ) {
        looksLikeQuestionPerRow = true;
      }
    }
  }

  if (looksLikeQuestionPerRow) {
    let qCounter = 0;
    for (let r = startRow; r < grid.length; r++) {
      const row = grid[r];
      if (row.every((c) => !c.text.trim())) continue;

      let stemIdx = 0;
      if (/^(?:Câu\s*)?\d+[\.\)]?$/i.test(row[0].text.trim()) && row.length >= 6) {
        stemIdx = 1;
      }

      const stem = row[stemIdx]?.text.trim() || '';
      if (!stem || !/[\u4e00-\u9fa5]/.test(stem)) continue;

      const numMatch = row[0].text.trim().match(/^(?:Câu\s*)?(\d+)[\.\)]?$/i);
      const qNum = numMatch ? numMatch[1] : String(++qCounter);
      const optCells = row.slice(stemIdx + 1, stemIdx + 5);
      const optLetters = ['A', 'B', 'C', 'D'];
      const optLines: string[] = [];
      let emphasizedLetter: string | null = null;

      for (let i = 0; i < optCells.length; i++) {
        const cell = optCells[i];
        if (!cell || !cell.text.trim()) continue;
        const cleanOpt = cell.text.replace(/^[A-D][\.\:、\s]\s*/i, '').trim();
        optLines.push(`${optLetters[i]}. ${cleanOpt}`);
        if (cell.isEmphasized) {
          emphasizedLetter = optLetters[i];
        }
      }

      let explicitAns = '';
      let explicitExpl = '';
      if (row.length > stemIdx + 5) {
        const candAns = row[stemIdx + 5]?.text.trim() || '';
        if (/^[A-Da-d1-4对错√×✓✗ĐúngSaiTrueFalse]$/.test(candAns)) {
          explicitAns = candAns;
          explicitExpl = row[stemIdx + 6]?.text.trim() || '';
        } else {
          explicitExpl = candAns;
        }
      }

      const finalAns = explicitAns || emphasizedLetter;
      lines.push(
        `Câu ${qNum}: ${stem}`,
        ...optLines,
        ...(finalAns ? [`Đáp án: ${finalAns}`] : []),
        ...(explicitExpl ? [`Giải thích: ${explicitExpl}`] : [])
      );
    }
    if (lines.length > 0) {
      return { lines, bottomAnswerKeyLines };
    }
  }

  // Layout 5: Generic / True-False Table Fallback
  for (const row of grid) {
    const texts = row.map((c) => c.text.trim()).filter(Boolean);
    if (texts.length === 0) continue;
    // Check if last cell is a True/False symbol
    if (texts.length >= 2 && /^(?:√|✓|×|✗|对|错|Đúng|Sai|True|False)$/i.test(texts[texts.length - 1])) {
      const tfSym = texts[texts.length - 1];
      const stemPart = texts.slice(0, -1).join(' ');
      lines.push(`${stemPart} → [${tfSym}]`);
    } else {
      lines.push(texts.join('\t'));
    }
  }

  return { lines, bottomAnswerKeyLines };
}

/**
 * Extracts structured text from a Word document (.docx) Buffer:
 * - Reconstructs automatic numbering (<w:numPr> + word/numbering.xml)
 * - Detects formatting-marked correct answers (bold, color, highlight, shading, underline)
 * - Smartly converts all 5 Word table layouts (<w:tbl>)
 */
export function extractDocxTextFromBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  try {
    const zipFiles = unpackZipFiles(buffer);
    const getZipEntry = (name: string): Buffer | undefined => {
      const norm = name.toLowerCase().replace(/\\/g, '/');
      for (const [k, v] of Object.entries(zipFiles)) {
        if (k.toLowerCase().replace(/\\/g, '/') === norm) {
          return v;
        }
      }
      return undefined;
    };

    const docXmlBuf = getZipEntry('word/document.xml');
    if (!docXmlBuf) {
      const utf8Str = decodeTextBuffer(buffer);
      if (!utf8Str.startsWith('PK')) {
        return utf8Str.trim();
      }
      return '';
    }

    const documentXml = docXmlBuf.toString('utf-8');
    const numberingXml = getZipEntry('word/numbering.xml')?.toString('utf-8');
    const numMap = parseDocxNumberingXml(numberingXml);
    const counters = new Map<string, number>();

    // Tokenize top-level <w:tbl> and <w:p> in document order
    const blockTokens = Array.from(
      documentXml.matchAll(/<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi)
    );

    const outputLines: string[] = [];
    const deferredBottomAnswerKeys: string[] = [];

    // Track pending question option group to resolve single-emphasized-option answers
    let currentQuestionOptionEmphasis: Array<{ letter: string; isEmphasized: boolean }> = [];
    let lastNumIdForQuestion: string | undefined;
    let inQuestionContext = false;
    let currentQuestionOptionsCount = 0;

    const flushQuestionEmphasis = () => {
      if (currentQuestionOptionEmphasis.length >= 2) {
        const emphasizedOnes = currentQuestionOptionEmphasis.filter((o) => o.isEmphasized);
        if (emphasizedOnes.length === 1) {
          outputLines.push(`[ĐÁP_ÁN: ${emphasizedOnes[0].letter}]`);
        }
      }
      currentQuestionOptionEmphasis = [];
    };

    const resetOptionCounters = () => {
      for (const k of Array.from(counters.keys())) {
        const [cNumId, cIlvlStr] = k.split(':');
        const cIlvl = parseInt(cIlvlStr, 10);
        const spec = numMap.get(cNumId)?.get(cIlvl);
        if (
          cIlvl > 0 ||
          spec?.numFmt === 'upperLetter' ||
          spec?.numFmt === 'lowerLetter' ||
          (lastNumIdForQuestion !== undefined && cNumId !== lastNumIdForQuestion)
        ) {
          counters.delete(k);
        }
      }
    };

    for (const tokenMatch of blockTokens) {
      const xmlBlock = tokenMatch[0];
      if (/^<w:tbl\b/i.test(xmlBlock)) {
        flushQuestionEmphasis();
        inQuestionContext = false;
        currentQuestionOptionsCount = 0;
        const { lines, bottomAnswerKeyLines } = formatDocxTable(xmlBlock);
        outputLines.push(...lines);
        deferredBottomAnswerKeys.push(...bottomAnswerKeyLines);
        continue;
      }

      const p = parseDocxParagraphXml(xmlBlock);
      if (!p.text) continue;

      let lineText = p.text;

      // Reconstruct Word Auto-Numbering (<w:numPr>) if prefix is not already in text
      if (p.numId !== undefined) {
        const ilvl = p.ilvl ?? 0;
        const counterKey = `${p.numId}:${ilvl}`;

        // Reset deeper levels if we are at level 0
        if (ilvl === 0) {
          for (const k of Array.from(counters.keys())) {
            if (k.startsWith(`${p.numId}:`) && k !== counterKey) {
              counters.delete(k);
            }
          }
        }

        const lvlSpec = numMap.get(p.numId)?.get(ilvl);
        let numFmt = lvlSpec?.numFmt || (ilvl > 0 ? 'upperLetter' : 'decimal');

        // Heuristic: if numbering.xml is absent or a different numId is used for options right after a question stem
        const looksLikeOptionText = !/(?:[?？]|_{2,}|(?:^|[\s(（])(?:Câu|第|Question|Q)\s*\d+)/i.test(lineText);
        const isFollowUpOption =
          !lvlSpec &&
          ilvl === 0 &&
          inQuestionContext &&
          currentQuestionOptionsCount < 6 &&
          looksLikeOptionText;

        if (
          (!lvlSpec && ilvl === 0 && lastNumIdForQuestion && p.numId !== lastNumIdForQuestion && (counters.get(counterKey) ?? 0) < 6) ||
          isFollowUpOption
        ) {
          numFmt = 'upperLetter';
        }

        const isQuestionStemNumPr =
          numFmt === 'decimal' ||
          (!lvlSpec && ilvl === 0 && !isFollowUpOption && (!lastNumIdForQuestion || p.numId === lastNumIdForQuestion));

        if (isQuestionStemNumPr) {
          flushQuestionEmphasis();
          resetOptionCounters();
          lastNumIdForQuestion = p.numId;
          inQuestionContext = true;
          currentQuestionOptionsCount = 0;
        }

        const startVal = lvlSpec?.start ?? 1;
        const nextCount = (counters.get(counterKey) ?? startVal - 1) + 1;
        counters.set(counterKey, nextCount);

        const alreadyHasPrefix =
          /^(?:(?:Câu|第|Question|Q)\s*\d+|\d+[\.\:、\)]|[A-Fa-f][\.\:、\)])/i.test(lineText);

        if (!alreadyHasPrefix) {
          if (numFmt === 'upperLetter' || numFmt === 'lowerLetter') {
            const letter = String.fromCharCode(64 + Math.min(nextCount, 26));
            lineText = `${letter}. ${lineText}`;
          } else {
            lastNumIdForQuestion = p.numId;
            lineText = `Câu ${nextCount}: ${lineText}`;
          }
        }
      }

      // Check if this line is an explicit question stem in text (e.g. "Câu 2: ...")
      const optPrefixMatch = lineText.match(/^[\(\[（]?([A-Fa-f])[\)\]）\.\:、\s]\s*(.+)$/);
      const isExplicitAnswerLine = /^(?:Đáp án|Correct Answer|Answer|Key|正确答案|答案)[:\s]/i.test(lineText);

      const hasMultipleInlineOptions =
        (lineText.match(/(?:^|[\s\t]+|(?<=[。！？，；：,.!?;:\)\]）]))[\(\[（]?[A-Fa-f][\)\]）\.\:、\s]/g) || []).length >= 2;

      const isExplicitStem =
        /^(?:(?:Câu|第|Question|Q)\s*\d+|\d+[\.\:、\)])/i.test(lineText) &&
        !optPrefixMatch &&
        !hasMultipleInlineOptions;

      if (isExplicitStem) {
        flushQuestionEmphasis();
        resetOptionCounters();
        lastNumIdForQuestion = p.numId ?? '__explicit__';
        inQuestionContext = true;
        currentQuestionOptionsCount = 0;
      }

      if (isExplicitAnswerLine) {
        // Explicit answer key overrides emphasis tracking
        currentQuestionOptionEmphasis = [];
        inQuestionContext = false;
        currentQuestionOptionsCount = 0;
        outputLines.push(lineText);
        continue;
      }

      if (hasMultipleInlineOptions) {
        if (currentQuestionOptionEmphasis.length >= 2) {
          flushQuestionEmphasis();
        } else {
          currentQuestionOptionEmphasis = [];
        }
        inQuestionContext = false;
        currentQuestionOptionsCount = 0;
        const inlineMarked = detectMarkedOptionInLine({ ...p, text: lineText });
        outputLines.push(lineText);
        if (inlineMarked) {
          outputLines.push(`[ĐÁP_ÁN: ${inlineMarked}]`);
        }
        continue;
      }

      if (optPrefixMatch) {
        const ltr = optPrefixMatch[1].toUpperCase();
        currentQuestionOptionEmphasis.push({
          letter: ltr,
          isEmphasized: p.isEmphasized,
        });
        currentQuestionOptionsCount++;
        outputLines.push(lineText);
      } else {
        // If previous question had options, flush its emphasized answer before starting the next question/line
        if (currentQuestionOptionEmphasis.length >= 2) {
          flushQuestionEmphasis();
        } else {
          currentQuestionOptionEmphasis = [];
        }
        // Check if this single line has horizontal options with one emphasized option
        const inlineMarked = detectMarkedOptionInLine({ ...p, text: lineText });
        outputLines.push(lineText);
        if (inlineMarked) {
          outputLines.push(`[ĐÁP_ÁN: ${inlineMarked}]`);
        }
      }
    }

    flushQuestionEmphasis();

    if (deferredBottomAnswerKeys.length > 0) {
      outputLines.push('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT', ...deferredBottomAnswerKeys);
    }

    return outputLines.join('\n').trim();
  } catch {
    return '';
  }
}

// ============================================================================
// R1: X/Y COORDINATE LAYOUT-AWARE PDF PARSER
// ============================================================================

export interface PdfTextItemLike {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
}

/**
 * Reconstructs visual multi-line & multi-column text from PDF textContent.items
 * using X (transform[4]) and Y (transform[5]) coordinates.
 */
export function reconstructPdfPageTextFromItems(items: PdfTextItemLike[]): string {
  if (!Array.isArray(items) || items.length === 0) return '';

  interface PositionedPiece {
    str: string;
    x: number;
    y: number;
    width: number;
    hasEOL: boolean;
    hasCoords: boolean;
    orderIdx: number;
  }

  const pieces: PositionedPiece[] = [];
  let fallbackY = 10000;
  let fallbackX = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || typeof it.str !== 'string') continue;
    const str = it.str;
    if (!str && !it.hasEOL) continue;

    const hasCoords = Array.isArray(it.transform) && it.transform.length >= 6;
    // Filter out synthetic whitespace-only items when real coordinates exist,
    // so that true spatial coordinate gaps can trigger tab insertion (gap > 18).
    if (hasCoords && !str.trim() && !it.hasEOL) continue;

    const width = typeof it.width === 'number' && it.width > 0 ? it.width : str.length * 6;
    const x = hasCoords ? Number(it.transform![4]) || 0 : fallbackX;
    const y = hasCoords ? Number(it.transform![5]) || 0 : fallbackY;

    if (!hasCoords) {
      if (it.hasEOL) {
        fallbackY -= 20;
        fallbackX = 0;
      } else {
        fallbackX += width + 6;
      }
    }

    pieces.push({
      str,
      x,
      y,
      width,
      hasEOL: Boolean(it.hasEOL),
      hasCoords,
      orderIdx: i,
    });
  }

  if (pieces.length === 0) return '';

  // 1. Sort top-to-bottom (Y descending) with strict weak ordering
  const sortedPieces = [...pieces].sort((a, b) => {
    if (b.y !== a.y) {
      return b.y - a.y;
    }
    if (a.x !== b.x) {
      return a.x - b.x;
    }
    return a.orderIdx - b.orderIdx;
  });

  // 2. Cluster items into visual lines with tolerance |y - currentLineBaseY| <= 3.5
  const visualLines: PositionedPiece[][] = [];
  let currentLine: PositionedPiece[] = [];
  let currentLineBaseY: number | null = null;

  for (const p of sortedPieces) {
    if (currentLine.length === 0 || currentLineBaseY === null) {
      currentLine.push(p);
      currentLineBaseY = p.y;
    } else if (Math.abs(p.y - currentLineBaseY) <= 3.5) {
      currentLine.push(p);
    } else {
      visualLines.push(currentLine);
      currentLine = [p];
      currentLineBaseY = p.y;
    }
  }
  if (currentLine.length > 0) {
    visualLines.push(currentLine);
  }

  // 3. Reconstruct text per line with tab delimiter for horizontal columns (gap > 18)
  const outputLines: string[] = [];
  for (const linePieces of visualLines) {
    // Sort left-to-right by X coordinate, secondary orderIdx
    linePieces.sort((a, b) => a.x - b.x || a.orderIdx - b.orderIdx);

    let lineStr = '';
    const lineBaseY = linePieces[0]?.y ?? 400;

    for (let i = 0; i < linePieces.length; i++) {
      const cur = linePieces[i];
      if (i > 0) {
        const prev = linePieces[i - 1];
        const gap = cur.x - (prev.x + prev.width);
        if (gap > 18) {
          lineStr = lineStr.replace(/ +$/, '') + '\t';
        } else if (gap > 2.5) {
          const prevEndsSpace = /\s$/.test(lineStr);
          const curStartsSpace = /^\s/.test(cur.str);
          if (!prevEndsSpace && !curStartsSpace) {
            lineStr += ' ';
          }
        }
      }
      lineStr += cur.str;
    }

    const trimmed = lineStr.trim();
    if (!trimmed) continue;

    // 4. Safe page footer/header removal:
    // Only strip lines at page margins (Y < 45 or Y > 750) or matching explicit page patterns.
    // Standalone numbers ("1", "2", "4", "10") are ONLY stripped if located at page margins.
    const hasRealCoords = linePieces.some((p) => p.hasCoords);
    const isMargin = hasRealCoords && (lineBaseY < 45 || lineBaseY > 750);
    const isBareNumberInMargin = /^\d+$/.test(trimmed) && isMargin;
    const isExplicitPageFooter =
      /^(?:Trang|Page)\s*\d+(?:\s*(?:\/|of)\s*\d+)?$/i.test(trimmed) ||
      /^第\s*\d+\s*页(?:\s*[/,，共]\s*(?:共\s*)?\d+\s*页)?$/i.test(trimmed) ||
      /^\d+\s*(?:\/|of)\s*\d+$/i.test(trimmed) ||
      /^[-–—]\s*\d+\s*[-–—]$/.test(trimmed);

    // Also strip margin lines where all tab-separated pieces are page/bare numbers (e.g. "Page 1 of 5\t1")
    const tokens = trimmed.split('\t').map((t) => t.trim()).filter(Boolean);
    const isMarginPageTokensOnly =
      isMargin &&
      tokens.length > 0 &&
      tokens.every(
        (t) =>
          /^\d+$/.test(t) ||
          /^(?:Trang|Page)\s*\d+(?:\s*(?:\/|of)\s*\d+)?$/i.test(t) ||
          /^第\s*\d+\s*页(?:\s*[/,，共]\s*(?:共\s*)?\d+\s*页)?$/i.test(t) ||
          /^\d+\s*(?:\/|of)\s*\d+$/i.test(t) ||
          /^[-–—]\s*\d+\s*[-–—]$/.test(t)
      );

    if (isBareNumberInMargin || isExplicitPageFooter || isMarginPageTokensOnly) {
      continue;
    }

    outputLines.push(trimmed);
  }

  return outputLines.join('\n');
}

/**
 * Extracts digital text layer from a PDF Buffer using pdfjs-dist legacy build
 * with X/Y coordinate-aware line and column reconstruction.
 */
export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  try {
    let pdfjsLib: any;
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch {
      pdfjsLib = await import('pdfjs-dist');
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages, 100);
    const pageChunks: string[] = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = reconstructPdfPageTextFromItems(textContent.items as PdfTextItemLike[]);
      if (pageText) {
        pageChunks.push(pageText);
      }
    }

    return pageChunks.join('\n\n');
  } catch {
    return '';
  }
}

// ============================================================================
// FLEXIBLE ANSWER KEY RESOLVER & PART-TYPE INFERENCE
// ============================================================================

/**
 * Resolves letter (A-F), boolean symbols (√/×, 对/错, Đúng/Sai), numeric indices (0-4 or 1-5),
 * or verbatim text match into a 0-based option index.
 */
export function resolveAnswerIndex(
  rawAnswer: string | number | undefined | null,
  options: string[]
): number {
  if (rawAnswer === undefined || rawAnswer === null) return 0;

  const str = String(rawAnswer).trim();
  if (!str) return 0;

  const upper = str.toUpperCase();

  // 1. Single Letter A-F
  if (/^[A-F]$/.test(upper)) {
    const idx = upper.charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return idx;
    return idx;
  }

  // 2. Letter prefix like "A. ...", "A: ...", "(A)", "[A]", "Đáp án A"
  const prefixMatch = upper.match(/^(?:ĐÁP\s*ÁN\s*|ANSWER\s*|KEY\s*)?[\(\[（]?([A-F])[\)\]）\.\:\s]/i);
  if (prefixMatch) {
    const idx = prefixMatch[1].charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return idx;
  }

  // 3. Numeric Index (handles 0-based and 1-based indexing)
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    if (n === 0) return 0;
    if (n >= 1 && n <= options.length) return n - 1;
    if (n >= 0 && n < options.length) return n;
    return 0;
  }

  // 4. Boolean / True-False Symbols
  const truePattern = /^(√|✓|✔|对|正确|TRUE|ĐÚNG|Đ|T|RIGHT|YES)$/i;
  const falsePattern = /^(×|✗|✘|错|错误|FALSE|SAI|S|F|WRONG|NO)$/i;

  if (truePattern.test(str)) return 0;
  if (falsePattern.test(str)) return 1;

  // 5. Verbatim match with options
  const cleanStr = str.toLowerCase().replace(/^[a-f][\.\:\s]*/i, '').trim();
  for (let i = 0; i < options.length; i++) {
    const optClean = options[i].toLowerCase().replace(/^[a-f][\.\:\s]*/i, '').trim();
    if (optClean === cleanStr || options[i].trim() === str) {
      return i;
    }
  }

  return 0;
}

/**
 * Infers the most accurate part_type for an extracted question so non-blank questions
 * never falsely fail `requiresPlaceholder` in Gate 1.
 */
function inferQuestionPartType(
  stem: string,
  options: string[],
  skill: 'listening' | 'reading' | 'writing',
  explicitPartType?: string,
  defaultPartType?: string
): string {
  if (explicitPartType && explicitPartType.trim()) {
    return explicitPartType.trim();
  }

  const hasBlank = /(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/.test(stem);
  if (options.length === 2 && options[0] === '对' && options[1] === '错') {
    return skill === 'listening' ? 'listen_true_false_2opt' : 'read_true_false_2opt';
  }

  if (hasBlank) {
    if (options.length === 4) return 'read_fill_blank_4opt';
    if (options.length >= 3 && options.length <= 6) return `read_fill_blank_word_bank_${options.length}opt`;
  } else {
    if (stem.includes('★') && options.length === 3) return 'read_comprehension_short_3opt';
    if (stem.includes('★') && options.length === 4) return 'read_comprehension_4opt';
    if (skill === 'listening' && options.length === 4) return 'listen_dialogue_qa_4opt';
    if (skill === 'listening' && options.length === 3) return 'listen_monologue_qa_3opt';
    if (options.length >= 2 && options.length <= 6) {
      return `read_dialogue_matching_${options.length}opt`;
    }
  }

  return defaultPartType || 'read_fill_blank_4opt';
}

// ============================================================================
// R3: 7-CASE REAL-WORLD EXCEL / CSV PARSER
// ============================================================================

const STEM_HEADER_REGEX = /^(?:câu\s*hỏi|đề\s*bài|nội\s*dung(?:\s*câu\s*hỏi|\s*đề)?|câu\s*dẫn|văn\s*bản|stem|question(?:\s*text|\s*stem)?|prompt|content|text|题目|题干|问题|句子|内容)(?:\s*\([^\)]*\))?$/i;
const PINYIN_HEADER_REGEX = /^(?:pinyin|phiên\s*âm|bính\s*âm|phonetic|pronunciation|拼音)(?:\s*\([^\)]*\))?$/i;
const COMBINED_OPTS_HEADER_REGEX = /^(?:options|choices|các\s*lựa\s*chọn|các\s*phương\s*án|danh\s*sách\s*đáp\s*án|phương\s*án|lựa\s*chọn|选项)(?:\s*\([^\)]*\))?$/i;
const ANSWER_HEADER_REGEX = /^(?:đáp\s*án(?:\s*đúng)?|kết\s*quả|key|answer(?:\s*key)?|correct(?:\s*answer)?|correct_answer|答案|正确答案)(?:\s*\([^\)]*\))?$/i;
const EXPLANATION_HEADER_REGEX = /^(?:giải\s*thích(?:\s*chi\s*tiết)?|lời\s*giải|ghi\s*chú|dịch\s*nghĩa|explanation|solution|rationale|notes|translation|explain|解析|解释|详细解析|说明)(?:\s*\([^\)]*\))?$/i;
const LEVEL_HEADER_REGEX = /^(?:hsk|cấp\s*độ|cấp\s*hsk|level|hsk\s*level|cấp|级别|hsk等级|等级)(?:\s*\([^\)]*\))?$/i;
const SKILL_HEADER_REGEX = /^(?:kỹ\s*năng|phần\s*thi|skill|section|技能|题型类别)(?:\s*\([^\)]*\))?$/i;
const PART_TYPE_HEADER_REGEX = /^(?:dạng\s*bài|loại\s*câu\s*hỏi|part\s*type|part_type|type|题型)(?:\s*\([^\)]*\))?$/i;
const TOPIC_HEADER_REGEX = /^(?:chủ\s*đề|topic|theme|主题)(?:\s*\([^\)]*\))?$/i;
const GRAMMAR_HEADER_REGEX = /^(?:ngữ\s*pháp|điểm\s*ngữ\s*pháp|target\s*grammar|target_grammar|grammar|语法点)(?:\s*\([^\)]*\))?$/i;
const VOCAB_HEADER_REGEX = /^(?:từ\s*vựng|từ\s*kiểm\s*tra|từ\s*trọng\s*tâm|tested\s*vocab|tested_vocab|target\s*vocab|vocab|考点词汇|词汇)(?:\s*\([^\)]*\))?$/i;
const STT_HEADER_REGEX = /^(?:stt|số\s*thứ\s*tự|no\.?|#|id|câu\s*số|question\s*no|题号|序号)$/i;

function matchOptionLetterHeader(headerCell: string): number | null {
  const clean = headerCell.replace(/\s*\([^\)]*\)\s*/g, '').trim().toLowerCase();
  const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
  for (let i = 0; i < letters.length; i++) {
    const ltr = letters[i];
    if (
      clean === ltr ||
      clean === `option ${ltr}` ||
      clean === `option_${ltr}` ||
      clean === `opt ${ltr}` ||
      clean === `opt_${ltr}` ||
      clean === `choice ${ltr}` ||
      clean === `choice_${ltr}` ||
      clean === `đáp án ${ltr}` ||
      clean === `lựa chọn ${ltr}` ||
      clean === `phương án ${ltr}` ||
      clean === `选项${ltr}` ||
      clean === `${ltr}.` ||
      clean === `${ltr}:`
    ) {
      return i;
    }
  }
  return null;
}

/**
 * Splits a single combined options cell (e.g. "A. 老师 B. 苹果 C. 飞机 D. 喝水" or "老师 | 苹果 | 飞机 | 喝水")
 * into individual option strings.
 */
function splitCombinedOptionsCell(rawCell: string): string[] {
  const trimmed = rawCell.trim();
  if (!trimmed) return [];

  // 1. JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr) && arr.length >= 2) {
        return arr.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      // Fall through
    }
  }

  // 2. Lettered options A..F on one or multiple lines
  const inlineMarkerPattern = '(?:\\*+|\\[\\s*(?:[xX✓✔√]|đúng|correct|đáp\\s*án\\s*đúng)\\s*\\]|\\(\\s*(?:đúng|correct|đáp\\s*án\\s*đúng|[✓✔√])\\s*\\)|[✓✔√])';
  const hasOptionsPattern = new RegExp(
    `(?:^|[\\s\\n;|]+)(?:${inlineMarkerPattern})?\\s*[\\(\\[（]?A[\\)\\]）\\.\\:、\\s][\\s\\S]+(?:${inlineMarkerPattern})?\\s*[\\(\\[（]?B[\\)\\]）\\.\\:、\\s]`,
    'i'
  );
  if (hasOptionsPattern.test(trimmed)) {
    const inlineRegex = new RegExp(
      `(?:^|[\\s\\n;|]+)(${inlineMarkerPattern})?\\s*[\\(\\[（]?([A-Fa-f])[\\)\\]）\\.\\:、\\s]\\s*([^\\n;|]+?)(?=(?:[\\s\\n;|]+(?:${inlineMarkerPattern})?\\s*[\\(\\[（]?[A-Fa-f][\\)\\]）\\.\\:、\\s]|$))`,
      'gi'
    );
    const extracted: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = inlineRegex.exec(trimmed)) !== null) {
      const mark = m[1] ? `${m[1]} ` : '';
      extracted.push(`${mark}${m[3].trim()}`);
    }
    if (extracted.length >= 2) return extracted;
  }

  // 3. Delimited by newline, semicolon, or pipe
  if (/[\n;|]/.test(trimmed)) {
    const parts = trimmed
      .split(/[\n;|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) return parts;
  }

  return [];
}

/**
 * Checks whether an option string carries an inline "correct answer" marker
 * such as `*老师`, `*A. 老师`, `老师 (Đúng)`, `[x] 老师`, `✓ 老师`, `(Đáp án đúng) 老师`.
 */
function stripInlineCorrectMarker(rawOpt: string): { text: string; isMarkedCorrect: boolean } {
  let text = rawOpt.trim();
  let isMarkedCorrect = false;

  const leadingMarkerRegex = /^(?:\*+|\[\s*(?:[xX✓✔√]|đúng|correct|đáp\s*án\s*đúng)\s*\]|\(\s*(?:đúng|correct|đáp\s*án\s*đúng|[✓✔√])\s*\)|[✓✔√])\s*/i;
  const trailingMarkerRegex = /(?:\(\s*(?:đáp\s*án\s*đúng|đúng|correct|right|[✓✔√])\s*\)|\[\s*(?:đáp\s*án\s*đúng|đúng|correct|right|[xX✓✔√])\s*\]|\*+)$/i;

  if (leadingMarkerRegex.test(text)) {
    isMarkedCorrect = true;
    text = text.replace(leadingMarkerRegex, '').trim();
  }

  // Strip A., B. prefix if present
  text = text.replace(/^[\(\[（]?[A-Fa-f][\)\]）\.\:、\s]\s*/, '').trim();

  // Strip leading marker if placed after option letter (e.g. "A. * 老师" or "A. (Đúng) 老师")
  if (leadingMarkerRegex.test(text)) {
    isMarkedCorrect = true;
    text = text.replace(leadingMarkerRegex, '').trim();
  }

  // Strip trailing marker if placed at end of option (e.g. "老师 (Đúng)" or "老师 *")
  if (trailingMarkerRegex.test(text)) {
    isMarkedCorrect = true;
    text = text.replace(trailingMarkerRegex, '').trim();
  }

  return { text, isMarkedCorrect };
}

/**
 * Builds a normalized CandidateQuestion from extracted spreadsheet fields.
 */
function buildCandidateFromSpreadsheetFields(params: {
  rawStem: string;
  rawPinyin?: string | null;
  rawOptions: string[];
  rawAnswer?: string;
  rawExplanation?: string;
  level: number;
  skill: 'listening' | 'reading' | 'writing';
  explicitPartType?: string;
  defaultPartType?: string;
  topic: string | null;
  targetGrammar?: string;
  testedVocab?: string[];
}): CandidateQuestion | null {
  let stem = params.rawStem.trim();
  if (!stem) return null;

  let pinyin = params.rawPinyin?.trim() || null;

  // Extract parenthetical pinyin from stem and keep stem clean Hanzi
  const stemPinyinMatches = Array.from(
    stem.matchAll(/[\(\uff08](?=[^\)\uff09]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\d\.\,\!\?'’\-_]+)[\)\uff09]/g)
  );
  const stemPinyinList = stemPinyinMatches.map((m) => m[1].trim()).filter(Boolean);
  if (!pinyin && stemPinyinList.length > 0) {
    pinyin = stemPinyinList.join(' ');
  }
  if (stemPinyinList.length > 0) {
    stem = stem
      .replace(/\s*[\(\uff08](?=[^\)\uff09]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\d\.\,\!\?'’\-_]+)[\)\uff09]\s*/g, '')
      .replace(/\s+([，。！？,.!?；;:])/g, '$1')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  // Normalize blank placeholders ( ), （ ）, ___ to ____
  if (/（[\s\u3000]*）|\([\s\u3000]*\)|[\(（]\s*_{1,}\s*[\)）]|_{2,}/.test(stem)) {
    stem = stem
      .replace(/\s*(?:（[\s\u3000]*）|\([\s\u3000]*\)|[\(（]\s*_{1,}\s*[\)）]|_{2,})\s*/g, '____')
      .trim();
  }

  if (!/[\u4e00-\u9fa5]/.test(stem)) {
    return null;
  }

  if (!pinyin) {
    try {
      pinyin = getPinyinPro(stem, { toneType: 'symbol' });
    } catch {
      pinyin = null;
    }
  }

  // Process options & detect inline marked correct option
  const rawOpts = [...params.rawOptions];
  let inlineMarkedIdx: number | null = null;
  const cleanOptions: string[] = [];
  const optionsPinyinList: string[] = [];

  if (rawOpts.length === 0) {
    // True/False question fallback: use standard Chinese ['对', '错'] so Gate 1 passes cleanly
    cleanOptions.push('对', '错');
    optionsPinyinList.push('duì', 'cuò');
  } else {
    for (let i = 0; i < rawOpts.length; i++) {
      const { text: stripped, isMarkedCorrect } = stripInlineCorrectMarker(rawOpts[i]);
      if (isMarkedCorrect && inlineMarkedIdx === null) {
        inlineMarkedIdx = i;
      }

      const pinyinMatches = Array.from(
        stripped.matchAll(/[\(\uff08]([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-_]+)[\)\uff09]/g)
      );
      const pList = pinyinMatches.map((m) => m[1].trim()).filter(Boolean);
      const explicitOptPinyin = pList.length > 0 ? pList.join(' ') : null;
      const cleanOpt = stripped
        .replace(/\s*[\(\uff08][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-_]+[\)\uff09]\s*/g, '')
        .replace(/\s+([，。！？,.!?；;:])/g, '$1')
        .replace(/[ \t]+/g, ' ')
        .trim();

      const finalOpt = cleanOpt || stripped;
      cleanOptions.push(finalOpt);
      const optPinyin =
        explicitOptPinyin ||
        (finalOpt && /[\u4e00-\u9fa5]/.test(finalOpt) ? getPinyinPro(finalOpt, { toneType: 'symbol' }) : '');
      optionsPinyinList.push(optPinyin);
    }
  }

  // Normalize 2-option boolean labels (e.g. Đúng/Sai, True/False, √/×) to ['对', '错']
  if (
    cleanOptions.length === 2 &&
    cleanOptions.every((o) => /^(?:对|错|√|×|✓|✗|Đúng|Sai|True|False|✓\s*Đúng|✗\s*Sai)$/i.test(o.trim()))
  ) {
    cleanOptions[0] = '对';
    cleanOptions[1] = '错';
    optionsPinyinList[0] = 'duì';
    optionsPinyinList[1] = 'cuò';
  }

  // Resolve answer index
  let answerIdx = 0;
  let explanation = params.rawExplanation?.trim() || '';

  if (params.rawAnswer && params.rawAnswer.trim()) {
    answerIdx = resolveAnswerIndex(params.rawAnswer, cleanOptions);
  } else if (inlineMarkedIdx !== null) {
    answerIdx = inlineMarkedIdx;
  } else if (cleanOptions.length === 2 && cleanOptions[0] === '对' && cleanOptions[1] === '错') {
    const solvedTf = solveTrueFalseQuestion(stem, cleanOptions);
    answerIdx = solvedTf.answer_idx;
    if (!explanation) explanation = solvedTf.explanation_vi;
  } else {
    const solved = solveSingleQuestionSync(stem, cleanOptions);
    if (solved && typeof solved.answer_idx === 'number') {
      answerIdx = solved.answer_idx;
      if (!explanation && solved.explanation_vi) explanation = solved.explanation_vi;
    }
  }

  if (answerIdx < 0 || answerIdx >= cleanOptions.length) {
    answerIdx = 0;
  }

  const partType = inferQuestionPartType(
    stem,
    cleanOptions,
    params.skill,
    params.explicitPartType,
    params.defaultPartType
  );

  const chosenOpt = cleanOptions[answerIdx] || '';
  const completedStem = stem.includes('____') ? stem.replace(/____/g, chosenOpt) : undefined;

  if (!explanation) {
    explanation = `Đáp án đúng là ${chosenOpt}, phù hợp ngữ pháp và ngữ cảnh HSK ${params.level}.`;
  } else if (explanation.length < 10) {
    explanation = `${explanation} — Đáp án đúng là ${chosenOpt} (HSK ${params.level}).`;
  }

  return {
    stem,
    pinyin,
    stem_pinyin: pinyin,
    options: cleanOptions,
    options_pinyin: optionsPinyinList.length === cleanOptions.length ? optionsPinyinList : undefined,
    answer_idx: answerIdx,
    explanation_vi: explanation,
    explanation_summary_vi: explanation,
    answer_rationale_vi: explanation,
    completed_stem: completedStem,
    canonical_completed_stem: completedStem,
    level: params.level,
    skill: params.skill,
    part_type: partType,
    topic: params.topic,
    target_grammar: params.targetGrammar,
    tested_vocab: params.testedVocab,
  };
}

/**
 * Extracts an Answer Key map (question number -> { answer, explanation }) from an Answer Key sheet or table.
 */
function extractExternalAnswerKeysFromGrid(
  grid: string[][],
  answerMap: Map<number, { answer: string; explanation?: string }>
): boolean {
  if (grid.length === 0) return false;
  let foundCount = 0;

  // Pattern A: 2-row horizontal answer table (Row r: 1 | 2 | 3..., Row r+1: A | B | C...)
  for (let r = 0; r + 1 < grid.length; r++) {
    const topRow = grid[r].map((c) => c.trim()).filter(Boolean);
    const botRow = grid[r + 1].map((c) => c.trim()).filter(Boolean);
    if (
      topRow.length >= 2 &&
      topRow.length === botRow.length &&
      topRow.every((c) => /^(?:Câu\s*|第\s*|Q\s*)?\d+(?:\s*题)?$/i.test(c)) &&
      botRow.every((c) => /^[A-Fa-f1-5对错√×✓✗ĐúngSaiTrueFalse]+$/i.test(c))
    ) {
      for (let i = 0; i < topRow.length; i++) {
        const qNum = parseInt(topRow[i].replace(/\D/g, ''), 10);
        if (!isNaN(qNum) && qNum > 0) {
          answerMap.set(qNum, { answer: botRow[i] });
          foundCount++;
        }
      }
      r++;
    }
  }

  // Pattern B: Vertical rows [Câu/STT | Đáp án | Giải thích] or single-cell "Câu 1: B"
  for (const row of grid) {
    const nonEmpty = row.map((c) => c.trim()).filter(Boolean);
    if (nonEmpty.length === 0) continue;

    // Handle single-cell answer key strings like "Câu 1: B", "1. B", "1: B", "Câu 1: B - Giải thích"
    if (nonEmpty.length === 1) {
      const singleMatch = nonEmpty[0].match(
        /^(?:Câu\s*|第\s*|Q\s*|Question\s*)?(\d+)(?:\s*题)?[\.\:\s\-–—]+\s*(?:đáp\s*án\s*|answer\s*)?([A-Fa-f1-5对错√×✓✗ĐúngSaiTrueFalse])(?:\s*[\.\:\s\-–—]+\s*(.*))?$/i
      );
      if (singleMatch) {
        const qNum = parseInt(singleMatch[1], 10);
        const ans = singleMatch[2];
        const expl = singleMatch[3]?.trim() || undefined;
        answerMap.set(qNum, { answer: ans, explanation: expl });
        foundCount++;
        continue;
      }
    }

    if (nonEmpty.length < 2) continue;

    const first = nonEmpty[0];
    const second = nonEmpty[1];
    // Skip header row
    if (/^(?:stt|câu|question|no|题号)$/i.test(first) && /^(?:đáp\s*án|answer|key|答案)$/i.test(second)) {
      continue;
    }

    const qNumMatch = first.match(/^(?:Câu|第|Question|Q)?\s*(\d+)(?:\s*题)?[\.\:\)]?$/i);
    const ansMatch = second.match(/^(?:đáp\s*án\s*|answer\s*)?([A-Fa-f1-5对错√×✓✗ĐúngSaiTrueFalse])$/i);
    if (
      qNumMatch &&
      ansMatch &&
      (nonEmpty.length <= 3 || !/[\u4e00-\u9fa5]/.test(nonEmpty[2] || ''))
    ) {
      const qNum = parseInt(qNumMatch[1], 10);
      const expl = nonEmpty.slice(2).join(' ').trim() || undefined;
      answerMap.set(qNum, { answer: ansMatch[1], explanation: expl });
      foundCount++;
    }
  }

  return foundCount >= 2;
}

interface ColumnMapSpec {
  headerRowIdx: number;
  sttCol?: number;
  stemCol: number;
  pinyinCol?: number;
  optCols: Map<number, number>; // option index 0..5 -> column index
  combinedOptsCol?: number;
  answerCol?: number;
  explanationCol?: number;
  levelCol?: number;
  skillCol?: number;
  partTypeCol?: number;
  topicCol?: number;
  grammarCol?: number;
  vocabCol?: number;
}

/**
 * Scans Rows 0..25 of a 2D sheet grid to find a structured header row (Case 1).
 */
function findHeaderRowAndColumnMap(grid: string[][]): ColumnMapSpec | null {
  const maxScan = Math.min(grid.length, 25);

  for (let r = 0; r < maxScan; r++) {
    const row = grid[r];
    if (!row || row.length < 2) continue;

    let sttCol: number | undefined;
    let stemCol = -1;
    let pinyinCol: number | undefined;
    const optCols = new Map<number, number>();
    let combinedOptsCol: number | undefined;
    let answerCol: number | undefined;
    let explanationCol: number | undefined;
    let levelCol: number | undefined;
    let skillCol: number | undefined;
    let partTypeCol: number | undefined;
    let topicCol: number | undefined;
    let grammarCol: number | undefined;
    let vocabCol: number | undefined;

    for (let c = 0; c < row.length; c++) {
      const rawH = String(row[c] || '').trim();
      if (!rawH) continue;
      const cleanH = rawH.replace(/\s+/g, ' ').trim();

      if (STT_HEADER_REGEX.test(cleanH)) {
        sttCol = c;
        continue;
      }
      if (stemCol === -1 && (STEM_HEADER_REGEX.test(cleanH) || /(?:câu\s*hỏi|đề\s*bài|question\s*stem|题干|题目)/i.test(cleanH))) {
        stemCol = c;
        continue;
      }
      if (PINYIN_HEADER_REGEX.test(cleanH)) {
        pinyinCol = c;
        continue;
      }
      const optIdx = matchOptionLetterHeader(cleanH);
      if (optIdx !== null && !optCols.has(optIdx)) {
        optCols.set(optIdx, c);
        continue;
      }
      if (COMBINED_OPTS_HEADER_REGEX.test(cleanH)) {
        combinedOptsCol = c;
        continue;
      }
      if (ANSWER_HEADER_REGEX.test(cleanH)) {
        answerCol = c;
        continue;
      }
      if (EXPLANATION_HEADER_REGEX.test(cleanH)) {
        explanationCol = c;
        continue;
      }
      if (LEVEL_HEADER_REGEX.test(cleanH)) {
        levelCol = c;
        continue;
      }
      if (SKILL_HEADER_REGEX.test(cleanH)) {
        skillCol = c;
        continue;
      }
      if (PART_TYPE_HEADER_REGEX.test(cleanH)) {
        partTypeCol = c;
        continue;
      }
      if (TOPIC_HEADER_REGEX.test(cleanH)) {
        topicCol = c;
        continue;
      }
      if (GRAMMAR_HEADER_REGEX.test(cleanH)) {
        grammarCol = c;
        continue;
      }
      if (VOCAB_HEADER_REGEX.test(cleanH)) {
        vocabCol = c;
        continue;
      }
    }

    if (stemCol !== -1 && (optCols.size >= 2 || combinedOptsCol !== undefined || answerCol !== undefined)) {
      return {
        headerRowIdx: r,
        sttCol,
        stemCol,
        pinyinCol,
        optCols,
        combinedOptsCol,
        answerCol,
        explanationCol,
        levelCol,
        skillCol,
        partTypeCol,
        topicCol,
        grammarCol,
        vocabCol,
      };
    }
  }

  return null;
}

/**
 * Case 2: Parses a Headerless Tabular Spreadsheet when no header row exists,
 * using data-shape heuristics across rows.
 */
function tryParseHeaderlessTableGrid(
  grid: string[][],
  externalAnswerMap: Map<number, { answer: string; explanation?: string }>,
  options?: UniversalParseOptions
): CandidateQuestion[] {
  const nonEmptyRows = grid.filter((r) => r.some((c) => c.trim().length > 0));
  if (nonEmptyRows.length === 0) return [];

  const defaultLevel = options?.default_level || 1;
  const defaultSkill = ((options?.default_skill as any) || 'reading') as 'listening' | 'reading' | 'writing';
  const defaultTopic = options?.default_topic || null;

  const candidates: CandidateQuestion[] = [];
  let rowQuestionNum = 0;

  for (const rawRow of nonEmptyRows) {
    const row = rawRow.map((c) => String(c || '').trim());
    // Skip title banner rows (single non-empty cell without options)
    const nonEmptyCells = row.filter(Boolean);
    if (nonEmptyCells.length < 2) continue;

    let colCursor = 0;
    let qNumFromRow: number | null = null;
    if (/^(?:Câu\s*|第\s*|Q\s*)?\d+[\.\)]?$/i.test(row[0]) && nonEmptyCells.length >= 3) {
      qNumFromRow = parseInt(row[0].replace(/\D/g, ''), 10);
      colCursor = 1;
    }

    const firstCell = row[colCursor] || '';
    if (!/[\u4e00-\u9fa5]/.test(firstCell)) continue;

    rowQuestionNum++;
    const effectiveQNum = qNumFromRow || rowQuestionNum;
    const extKey = externalAnswerMap.get(effectiveQNum);

    const remainingCells = row.slice(colCursor + 1).filter((c) => c.length > 0);
    if (remainingCells.length === 0) continue;

    // Shape 2C: True/False row ([Stem] | [√/×/对/错/Đúng/Sai] | [Optional Explanation])
    // or ([Word] | [Sentence] | [√/×/对/错/Đúng/Sai] | [Optional Explanation])
    if (
      remainingCells.length >= 1 &&
      /^(?:√|✓|✔|×|✗|✘|对|错|Đúng|Sai|True|False)$/i.test(remainingCells[0])
    ) {
      const q = buildCandidateFromSpreadsheetFields({
        rawStem: firstCell,
        rawOptions: ['对', '错'],
        rawAnswer: remainingCells[0] || extKey?.answer,
        rawExplanation: remainingCells[1] || extKey?.explanation,
        level: defaultLevel,
        skill: defaultSkill,
        defaultPartType: 'read_true_false_2opt',
        topic: defaultTopic,
      });
      if (q) candidates.push(q);
      continue;
    }

    if (
      remainingCells.length >= 2 &&
      /[\u4e00-\u9fa5]/.test(remainingCells[0]) &&
      /^(?:√|✓|✔|×|✗|✘|对|错|Đúng|Sai|True|False)$/i.test(remainingCells[1])
    ) {
      const q = buildCandidateFromSpreadsheetFields({
        rawStem: `${firstCell} ${remainingCells[0]}`,
        rawOptions: ['对', '错'],
        rawAnswer: remainingCells[1] || extKey?.answer,
        rawExplanation: remainingCells[2] || extKey?.explanation,
        level: defaultLevel,
        skill: defaultSkill,
        defaultPartType: 'read_true_false_2opt',
        topic: defaultTopic,
      });
      if (q) candidates.push(q);
      continue;
    }

    // Shape 2B: Single-cell combined options ([Stem] | ["A. ... B. ... C. ... D. ..."] | [Optional Ans] | [Optional Expl])
    const splitCombined = splitCombinedOptionsCell(remainingCells[0]);
    if (splitCombined.length >= 2) {
      const q = buildCandidateFromSpreadsheetFields({
        rawStem: firstCell,
        rawOptions: splitCombined,
        rawAnswer: remainingCells[1] || extKey?.answer,
        rawExplanation: remainingCells[2] || extKey?.explanation,
        level: defaultLevel,
        skill: defaultSkill,
        defaultPartType: options?.default_part_type,
        topic: defaultTopic,
      });
      if (q) candidates.push(q);
      continue;
    }

    // Shape 2A: 4 or 5 option columns ([Stem] | [OptA] | [OptB] | [OptC] | [OptD] | [Optional Ans] | [Optional Expl])
    if (remainingCells.length >= 4) {
      // Check if 5th cell is Option E or Answer Key (A-D / 1-4)
      let optCount = 4;
      if (
        remainingCells.length >= 5 &&
        !/^(?:[A-Ea-e]|[1-5]|对|错|√|×)$/.test(remainingCells[4]) &&
        /[\u4e00-\u9fa5]/.test(remainingCells[4]) &&
        remainingCells[4].length <= 15
      ) {
        optCount = 5;
      }

      const rowOpts = remainingCells.slice(0, optCount);
      const afterOpts = remainingCells.slice(optCount);
      let rawAns = extKey?.answer || '';
      let rawExpl = extKey?.explanation || '';

      if (afterOpts.length > 0) {
        if (/^(?:[A-Fa-f]|[0-5]|对|错|√|×|✓|✗|Đúng|Sai|True|False)$/i.test(afterOpts[0])) {
          rawAns = afterOpts[0];
          rawExpl = afterOpts.slice(1).join(' ') || rawExpl;
        } else {
          rawExpl = afterOpts.join(' ');
        }
      }

      const q = buildCandidateFromSpreadsheetFields({
        rawStem: firstCell,
        rawOptions: rowOpts,
        rawAnswer: rawAns,
        rawExplanation: rawExpl,
        level: defaultLevel,
        skill: defaultSkill,
        defaultPartType: options?.default_part_type,
        topic: defaultTopic,
      });
      if (q) candidates.push(q);
    }
  }

  return candidates;
}

/**
 * Case 6: Converts a free-form spreadsheet grid into clean multi-line text for parseUniversalQuestions,
 * preserving 2-row horizontal word bank tables (A|B|C|D|E over words) and 2-column option pools.
 */
function convertGridToUnstructuredExamText(grid: string[][]): string[] {
  const lines: string[] = [];

  for (let r = 0; r < grid.length; r++) {
    const cells = grid[r].map((c) => String(c || '').trim()).filter(Boolean);
    if (cells.length === 0) continue;

    // Detect horizontal option letter row (A | B | C | D | E) paired with words row immediately below
    if (
      r + 1 < grid.length &&
      cells.length >= 3 &&
      cells.every((c) => /^[A-F][\.\:\)]?$/i.test(c))
    ) {
      const nextCells = grid[r + 1].map((c) => String(c || '').trim()).filter(Boolean);
      if (nextCells.length === cells.length && nextCells.some((c) => /[\u4e00-\u9fa5]/.test(c))) {
        const letters = cells.map((c) => c.replace(/[^A-Fa-f]/g, '').toUpperCase()).join('');
        const words = nextCells.join(' ');
        lines.push(`${letters} ${words}`);
        r++; // Skip next row since it was paired
        continue;
      }
    }

    // Detect 2-column option pool row (e.g. A | 不客气。)
    if (cells.length >= 2 && /^[A-F][\.\:\)]?$/i.test(cells[0]) && /[\u4e00-\u9fa5]/.test(cells[1])) {
      const cleanLetter = cells[0].replace(/[^A-Fa-f]/g, '').toUpperCase();
      lines.push(`| ${cleanLetter} | ${cells.slice(1).join(' ')} |`);
      continue;
    }

    lines.push(cells.join(' '));
  }

  return lines;
}

/**
 * Extracts and maps spreadsheet data (XLSX, XLS, CSV) into CandidateQuestion[]
 * across all 7 real-world spreadsheet cases.
 */
export function extractSpreadsheetData(
  buffer: Buffer,
  fileType: 'xlsx' | 'xls' | 'csv',
  options?: UniversalParseOptions
): { rawText: string; isStructured: boolean; questions: CandidateQuestion[]; detectedMode: string } {
  if (!buffer || buffer.length === 0) {
    return { rawText: '', isStructured: false, questions: [], detectedMode: 'empty' };
  }

  const sheets: Array<{ name: string; grid: string[][] }> = [];

  if (fileType === 'csv') {
    const csvContent = decodeTextBuffer(buffer).replace(/^\uFEFF/, '');
    const parseResult = Papa.parse<string[]>(csvContent, {
      header: false,
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t', '|'],
    });
    const grid = (parseResult.data || []).map((row) =>
      Array.isArray(row) ? row.map((c) => String(c ?? '').trim()) : []
    );
    if (grid.length > 0) {
      sheets.push({ name: 'CSV', grid });
    }
  } else {
    try {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const grid = rawGrid.map((row) =>
          Array.isArray(row) ? row.map((c) => String(c ?? '').trim()) : []
        );
        if (grid.some((r) => r.some((c) => c.length > 0))) {
          sheets.push({ name: sheetName, grid });
        }
      }
    } catch {
      return { rawText: '', isStructured: false, questions: [], detectedMode: 'error' };
    }
  }

  if (sheets.length === 0) {
    return { rawText: '', isStructured: false, questions: [], detectedMode: 'empty' };
  }

  // Case 5: Scan for separate Answer Key sheets (e.g. Sheet 2 "Đáp án" / "Answer Key" / "答案")
  const externalAnswerMap = new Map<number, { answer: string; explanation?: string }>();
  const questionSheets: Array<{ name: string; grid: string[][] }> = [];

  for (const sh of sheets) {
    const isAnswerSheetName = /(?:đáp\s*án|dap\s*an|answer\s*key|answers?|keys?|^da$|答案|lời\s*giải|loi\s*giai)/i.test(sh.name.trim());
    const tempMap = new Map<number, { answer: string; explanation?: string }>();
    const hasAnswerKeys = extractExternalAnswerKeysFromGrid(sh.grid, tempMap);
    const hasStems = sh.grid.some((r) =>
      r.some((c) => STEM_HEADER_REGEX.test(c) || (c.length > 5 && /[\u4e00-\u9fa5]{3,}/.test(c)))
    );

    if (sheets.length > 1 && ((isAnswerSheetName || hasAnswerKeys) && (!hasStems || isAnswerSheetName))) {
      for (const [k, v] of tempMap.entries()) {
        externalAnswerMap.set(k, v);
      }
    } else {
      questionSheets.push(sh);
    }
  }
  if (questionSheets.length === 0) {
    questionSheets.push(...sheets);
  }

  // Also scan bottom rows of question sheets for embedded answer key tables
  for (const sh of questionSheets) {
    extractExternalAnswerKeysFromGrid(sh.grid, externalAnswerMap);
  }

  // === PATH A: STRUCTURED TABULAR SPREADSHEET (Case 1, Case 3, Case 4, Case 5) ===
  const structuredQuestions: CandidateQuestion[] = [];
  let foundStructuredSheet = false;

  for (const sh of questionSheets) {
    const colMap = findHeaderRowAndColumnMap(sh.grid);
    if (!colMap) continue;

    foundStructuredSheet = true;
    let qRowCounter = 0;

    for (let r = colMap.headerRowIdx + 1; r < sh.grid.length; r++) {
      const row = sh.grid[r];
      if (!row || row.every((c) => !c.trim())) continue;

      const rawStem = row[colMap.stemCol]?.trim() || '';
      if (!rawStem) continue;

      qRowCounter++;
      let qNum = qRowCounter;
      if (colMap.sttCol !== undefined && row[colMap.sttCol]) {
        const parsedStt = parseInt(row[colMap.sttCol].replace(/\D/g, ''), 10);
        if (!isNaN(parsedStt) && parsedStt > 0) qNum = parsedStt;
      }

      const rawPinyin = colMap.pinyinCol !== undefined ? row[colMap.pinyinCol]?.trim() || null : null;

      // Collect Options (A–F columns or Combined Options column)
      const optionsList: string[] = [];
      for (let optIdx = 0; optIdx < 6; optIdx++) {
        const cIdx = colMap.optCols.get(optIdx);
        if (cIdx !== undefined && row[cIdx] && row[cIdx].trim()) {
          optionsList.push(row[cIdx].trim());
        }
      }

      if (optionsList.length === 0 && colMap.combinedOptsCol !== undefined && row[colMap.combinedOptsCol]) {
        optionsList.push(...splitCombinedOptionsCell(row[colMap.combinedOptsCol]));
      }

      // Also check if Stem cell itself contains inline options (e.g. "他是我的____。 A. 老师 B. 苹果 C. 飞机 D. 喝水")
      let finalRawStem = rawStem;
      const inlineStemOptRegex = /(?:^|[\s\t。！？\.\!\?])(?:\*+|\[\s*(?:[xX✓✔√]|đúng|correct|đáp\s*án\s*đúng)\s*\]|\(\s*(?:đúng|correct|đáp\s*án\s*đúng|[✓✔√])\s*\)|[✓✔√])?\s*[\(\[（]?A[\)\]）\.\:、\s].+?[\s\t]+(?:(?:\*+|\[\s*(?:[xX✓✔√]|đúng|correct|đáp\s*án\s*đúng)\s*\]|\(\s*(?:đúng|correct|đáp\s*án\s*đúng|[✓✔√])\s*\)|[✓✔√])?\s*)?[\(\[（]?B[\)\]）\.\:、\s]/i;
      if (optionsList.length === 0 && inlineStemOptRegex.test(rawStem)) {
        const splitFromStem = splitCombinedOptionsCell(rawStem);
        if (splitFromStem.length >= 2) {
          optionsList.push(...splitFromStem);
          finalRawStem = rawStem
            .replace(/(?:[\s\t]+|(?<=[。！？\.\!\?]))(?:\*+|\[\s*(?:[xX✓✔√]|đúng|correct|đáp\s*án\s*đúng)\s*\]|\(\s*(?:đúng|correct|đáp\s*án\s*đúng|[✓✔√])\s*\)|[✓✔√])?\s*[\(\[（]?A[\)\]）\.\:、\s][\s\S]*$/i, '')
            .trim();
        }
      }

      const extKey = externalAnswerMap.get(qNum);
      const rawAnswer =
        (colMap.answerCol !== undefined ? row[colMap.answerCol]?.trim() : '') ||
        extKey?.answer ||
        '';
      const rawExplanation =
        (colMap.explanationCol !== undefined ? row[colMap.explanationCol]?.trim() : '') ||
        extKey?.explanation ||
        '';

      let level = options?.default_level || 1;
      if (colMap.levelCol !== undefined && row[colMap.levelCol]) {
        const num = parseInt(row[colMap.levelCol].replace(/\D/g, ''), 10);
        if (num >= 1 && num <= 6) level = num;
      }

      let skill: 'listening' | 'reading' | 'writing' =
        ((options?.default_skill as any) || 'reading');
      if (colMap.skillCol !== undefined && row[colMap.skillCol]) {
        const strVal = row[colMap.skillCol].toLowerCase();
        if (strVal.includes('nghe') || strVal.includes('listen') || strVal.includes('听')) {
          skill = 'listening';
        } else if (strVal.includes('viết') || strVal.includes('writ') || strVal.includes('书写') || strVal.includes('写')) {
          skill = 'writing';
        } else {
          skill = 'reading';
        }
      }

      const explicitPartType =
        colMap.partTypeCol !== undefined && row[colMap.partTypeCol]?.trim()
          ? row[colMap.partTypeCol].trim()
          : undefined;

      const topic =
        (colMap.topicCol !== undefined && row[colMap.topicCol]?.trim()
          ? row[colMap.topicCol].trim()
          : null) ||
        options?.default_topic ||
        null;

      const targetGrammar =
        colMap.grammarCol !== undefined && row[colMap.grammarCol]?.trim()
          ? row[colMap.grammarCol].trim()
          : undefined;

      const testedVocab =
        colMap.vocabCol !== undefined && row[colMap.vocabCol]?.trim()
          ? row[colMap.vocabCol].trim().split(/[,;\s]+/).filter(Boolean)
          : undefined;

      const candidate = buildCandidateFromSpreadsheetFields({
        rawStem: finalRawStem,
        rawPinyin,
        rawOptions: optionsList,
        rawAnswer,
        rawExplanation,
        level,
        skill,
        explicitPartType,
        defaultPartType: options?.default_part_type,
        topic,
        targetGrammar,
        testedVocab,
      });

      if (candidate) {
        structuredQuestions.push(candidate);
      }
    }
  }

  if (foundStructuredSheet) {
    return {
      rawText: JSON.stringify(structuredQuestions, null, 2),
      isStructured: true,
      questions: structuredQuestions,
      detectedMode: 'structured_header_table',
    };
  }

  // === PATH B: HEADERLESS TABULAR SPREADSHEET (Case 2) ===
  const headerlessQuestions: CandidateQuestion[] = [];
  for (const sh of questionSheets) {
    const parsedFromHeaderless = tryParseHeaderlessTableGrid(sh.grid, externalAnswerMap, options);
    headerlessQuestions.push(...parsedFromHeaderless);
  }

  // Only treat as headerless table if it did not come from a multi-part exam section layout
  const hasMultiPartSectionHeaders = questionSheets.some((sh) =>
    sh.grid.some((r) =>
      r.some((c) => /(?:第\s*[一二三四五六1-6]\s*部分|Phần\s*[1-6I-VI]+|Part\s*[1-6])/i.test(c))
    )
  );

  if (!hasMultiPartSectionHeaders && headerlessQuestions.length >= 1) {
    return {
      rawText: JSON.stringify(headerlessQuestions, null, 2),
      isStructured: true,
      questions: headerlessQuestions,
      detectedMode: 'headerless_table',
    };
  }

  // === PATH C: UNSTRUCTURED / 4-PART FREE-FORM SPREADSHEET (Case 6) ===
  const textLines: string[] = [];
  for (const sh of questionSheets) {
    textLines.push(...convertGridToUnstructuredExamText(sh.grid));
  }

  if (externalAnswerMap.size > 0) {
    textLines.push('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT');
    for (const [qNum, val] of externalAnswerMap.entries()) {
      textLines.push(`${qNum}. ${val.answer}${val.explanation ? ` - ${val.explanation}` : ''}`);
    }
  }

  const rawText = textLines.join('\n');
  const questions = parseUniversalQuestions(rawText, options);

  return {
    rawText,
    isStructured: false,
    questions,
    detectedMode: 'freeform_universal',
  };
}

/**
 * Main coordinator function:
 * Parses an uploaded file Buffer (.xlsx, .xls, .csv, .docx, .pdf, .txt, .json)
 * and returns CandidateQuestion[].
 */
export async function parseUploadedFileBuffer(
  buffer: Buffer,
  fileTypeOrName: string,
  options?: UniversalParseOptions
): Promise<CandidateQuestion[]> {
  const result = await extractUploadedFileDetails(buffer, fileTypeOrName, options);
  return result.questions;
}

/**
 * Base64 equivalent of parseUploadedFileBuffer.
 */
export async function parseUploadedFileBase64(
  fileBase64: string,
  fileTypeOrName: string,
  options?: UniversalParseOptions
): Promise<CandidateQuestion[]> {
  const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
  const buffer = Buffer.from(cleanBase64, 'base64');
  return parseUploadedFileBuffer(buffer, fileTypeOrName, options);
}

/**
 * Detailed extraction function returning ExtractedFileResult with questions, raw_text, is_structured_table, and diagnostics.
 */
export async function extractUploadedFileDetails(
  buffer: Buffer,
  fileTypeOrName: string,
  options?: UniversalParseOptions
): Promise<ExtractedFileResult> {
  const lower = fileTypeOrName.toLowerCase();
  let fileType: ExtractedFileResult['file_type'] = 'txt';
  let rawText = '';
  let questions: CandidateQuestion[] = [];
  let isStructured = false;
  let detectedMode = 'universal_text';

  if (lower.endsWith('.xlsx') || lower === 'xlsx') {
    fileType = 'xlsx';
    const res = extractSpreadsheetData(buffer, 'xlsx', options);
    rawText = res.rawText;
    questions = res.questions;
    isStructured = res.isStructured;
    detectedMode = res.detectedMode;
  } else if (lower.endsWith('.xls') || lower === 'xls') {
    fileType = 'xls';
    const res = extractSpreadsheetData(buffer, 'xls', options);
    rawText = res.rawText;
    questions = res.questions;
    isStructured = res.isStructured;
    detectedMode = res.detectedMode;
  } else if (lower.endsWith('.csv') || lower === 'csv') {
    fileType = 'csv';
    const res = extractSpreadsheetData(buffer, 'csv', options);
    rawText = res.rawText;
    questions = res.questions;
    isStructured = res.isStructured;
    detectedMode = res.detectedMode;
  } else if (lower.endsWith('.docx') || lower === 'docx') {
    fileType = 'docx';
    rawText = extractDocxTextFromBuffer(buffer);
    questions = parseUniversalQuestions(rawText, options);
    detectedMode = 'docx_openxml_deep';
  } else if (lower.endsWith('.pdf') || lower === 'pdf') {
    fileType = 'pdf';
    rawText = await extractPdfTextFromBuffer(buffer);
    const normalizedForParsing = rawText.replace(/(^|\n|\r)\s*Cau\s*(\d+)[\.\:、\s\-]/gi, '$1Câu $2: ');
    questions = parseUniversalQuestions(normalizedForParsing, options).map((q) => ({
      ...q,
      stem: q.stem ? q.stem.replace(/([^\s])(_{2,})/g, '$1 $2') : q.stem,
    }));
    detectedMode = 'pdf_xy_layout';
  } else if (lower.endsWith('.json') || lower === 'json') {
    fileType = 'json';
    rawText = decodeTextBuffer(buffer);
    questions = parseUniversalQuestions(rawText, options);
    detectedMode = 'json_direct';
  } else {
    fileType = 'txt';
    rawText = decodeTextBuffer(buffer);
    questions = parseUniversalQuestions(rawText, options);
    detectedMode = 'plain_text';
  }

  return {
    filename: fileTypeOrName,
    file_type: fileType,
    raw_text: rawText,
    is_structured_table: isStructured,
    questions,
    diagnostics: {
      detected_mode: detectedMode,
    },
  };
}
