/**
 * tests/file_upload_comprehensive_cases.test.ts
 *
 * Comprehensive Multi-Case Verification Suite for File Upload Exam Ingestion:
 * - R1: PDF X/Y Coordinate Layout-Aware Line & Column Reconstruction
 * - R2: Deep Word (.docx) OpenXML Parser (Auto-Numbering, Styled Answers, 5 Table Layouts)
 * - R3: 7 Real-World Excel (.xlsx) & CSV (.csv) Cases (Banner rows, Headerless tables,
 *       Single-cell options, Inline *marked options, Multi-sheet Answer Key, Free-form 4-Part HSK,
 *       UTF-8/UTF-16LE BOM & Semicolon/Tab/Pipe CSV delimiters)
 * - R4: End-to-End POST /api/qbank/upload-file, Lenient 6-Gate Acceptance, Diagnostics, and Instant CBT
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as XLSX from 'xlsx';
import zlib from 'node:zlib';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  extractUploadedFileDetails,
  parseUploadedFileBuffer,
  extractDocxTextFromBuffer,
  extractPdfTextFromBuffer,
  reconstructPdfPageTextFromItems,
  decodeTextBuffer,
  resolveAnswerIndex,
} from '../src/server/fileUploadParser.js';
import {
  exportExamToExcel,
  exportExamToWord,
  exportExamToJson,
} from '../src/server/examExportService.js';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import { createCustomExamSet } from '../src/utils/customExamSetManager.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

/**
 * Helper to build an in-memory PKZip (.docx) buffer from custom XML files.
 */
function buildCustomDocxZip(filesMap: Record<string, string>): Buffer {
  const entries = Object.entries(filesMap).map(([name, content]) => ({
    name,
    data: Buffer.from(content, 'utf-8'),
  }));

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fnBuf = Buffer.from(entry.name, 'utf-8');
    const compressed = zlib.deflateRawSync(entry.data);

    const localHdr = Buffer.alloc(30);
    localHdr.writeUInt32LE(0x04034b50, 0);
    localHdr.writeUInt16LE(20, 4);
    localHdr.writeUInt16LE(0, 6);
    localHdr.writeUInt16LE(8, 8);
    localHdr.writeUInt16LE(0, 10);
    localHdr.writeUInt16LE(0, 12);
    localHdr.writeUInt32LE(0, 14);
    localHdr.writeUInt32LE(compressed.length, 18);
    localHdr.writeUInt32LE(entry.data.length, 22);
    localHdr.writeUInt16LE(fnBuf.length, 26);
    localHdr.writeUInt16LE(0, 28);

    localParts.push(localHdr, fnBuf, compressed);

    const cdHdr = Buffer.alloc(46);
    cdHdr.writeUInt32LE(0x02014b50, 0);
    cdHdr.writeUInt16LE(20, 4);
    cdHdr.writeUInt16LE(20, 6);
    cdHdr.writeUInt16LE(0, 8);
    cdHdr.writeUInt16LE(8, 10);
    cdHdr.writeUInt16LE(0, 12);
    cdHdr.writeUInt16LE(0, 14);
    cdHdr.writeUInt32LE(0, 16);
    cdHdr.writeUInt32LE(compressed.length, 20);
    cdHdr.writeUInt32LE(entry.data.length, 24);
    cdHdr.writeUInt16LE(fnBuf.length, 28);
    cdHdr.writeUInt16LE(0, 30);
    cdHdr.writeUInt16LE(0, 32);
    cdHdr.writeUInt16LE(0, 34);
    cdHdr.writeUInt16LE(0, 36);
    cdHdr.writeUInt32LE(0, 38);
    cdHdr.writeUInt32LE(offset, 42);

    centralParts.push(cdHdr, fnBuf);
    offset += 30 + fnBuf.length + compressed.length;
  }

  const cdBuffer = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, cdBuffer, eocd]);
}

describe('Comprehensive File Upload Exam Ingestion Suite (R1, R2, R3, R4)', () => {
  // =========================================================================
  // 1. R3: 7 Real-World Excel (.xlsx) & CSV (.csv) Cases
  // =========================================================================
  describe('R3: 7 Real-World Excel & CSV Cases', () => {
    it('Case 1A: Roundtrip Excel export (3-sheet workbook) parses 100% of questions accurately', async () => {
      const sampleQuestions: CandidateQuestion[] = [
        {
          stem: '桌子上有一____书。',
          pinyin: 'Zhuōzi shang yǒu yì běn shū.',
          options: ['本', '个', '杯', '块'],
          answer_idx: 0,
          explanation_vi: 'Lượng từ của sách (书) là 本.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        },
        {
          stem: '今天天气很热，我想____水。',
          pinyin: 'Jīntiān tiānqì hěn rè, wǒ xiǎng hē shuǐ.',
          options: ['吃', '喝', '看', '听'],
          answer_idx: 1,
          explanation_vi: 'Uống nước dùng động từ 喝.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        },
      ];

      const xlsxBuf = exportExamToExcel(sampleQuestions, 'Đề HSK 1 Chuẩn');
      const parsed = await parseUploadedFileBuffer(xlsxBuf, 'de_hsk1.xlsx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('桌子上有一____书。');
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[1].stem).toBe('今天天气很热，我想____水。');
      expect(parsed[1].answer_idx).toBe(1);
    });

    it('Case 1B: Finds Header Row at Row 5 after Title Banner rows & handles bilingual column headers', async () => {
      const aoa = [
        ['TRUNG TÂM TIẾNG TRUNG MINNESE - ĐỀ THI THỬ HSK 1'],
        ['Thời gian làm bài: 40 phút | Ngày thi: 01/11/2026'],
        [],
        ['Hướng dẫn: Chọn phương án đúng nhất cho mỗi câu hỏi dưới đây'],
        ['STT', 'Câu hỏi (Question Stem)', 'Phương án A (Option A)', 'Phương án B (Option B)', 'Phương án C (Option C)', 'Phương án D (Option D)', 'Đáp án đúng (Key)', 'Giải thích (Notes)'],
        ['1', '他在医院工作，他是一名____。 (Tā zài yīyuàn gōngzuò, tā shì yì míng ____.)', '老师 (lǎoshī)', '医生 (yīshēng)', '学生 (xuéshēng)', '朋友 (péngyou)', 'B', 'Làm việc ở bệnh viện là bác sĩ (医生).'],
        ['2', '你哥哥多大了？ (Nǐ gēge duō dà le?)', '他二十五岁。', '他是老师。', '他在家。', '很好。', 'A', 'Hỏi tuổi trả lời 二十五岁.'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const details = await extractUploadedFileDetails(buf, 'banner_exam.xlsx');
      expect(details.is_structured_table).toBe(true);
      expect(details.diagnostics?.detected_mode).toBe('structured_header_table');
      expect(details.questions.length).toBe(2);
      expect(details.questions[0].stem).toBe('他在医院工作，他是一名____。');
      expect(details.questions[0].options).toEqual(['老师', '医生', '学生', '朋友']);
      expect(details.questions[0].answer_idx).toBe(1);
      // Question 2 has no blank, so part_type is auto-inferred as read_dialogue_matching_4opt
      expect(details.questions[1].stem).toBe('你哥哥多大了？');
      expect(details.questions[1].part_type).toBe('read_dialogue_matching_4opt');
      expect(details.questions[1].answer_idx).toBe(0);
    });

    it('Case 2A & 2B: Parses Headerless Tabular Excel sheets (MCQ rows & True/False rows)', async () => {
      // 2A: Headerless MCQ sheet
      const mcqAoa = [
        ['1', '我想去商店买____。', '苹果', '医院', '睡觉', '怎么', 'A', 'Mua táo ở cửa hàng'],
        ['2', '请问，这个字怎么____？', '吃', '喝', '写', '听', 'C', 'Chữ Hán thì dùng động từ viết (写)'],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(mcqAoa);
      const wb1 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb1, ws1, 'Sheet1');
      const buf1 = XLSX.write(wb1, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const res1 = await extractUploadedFileDetails(buf1, 'headerless_mcq.xlsx');
      expect(res1.diagnostics?.detected_mode).toBe('headerless_table');
      expect(res1.questions.length).toBe(2);
      expect(res1.questions[0].answer_idx).toBe(0);
      expect(res1.questions[1].answer_idx).toBe(2);

      // 2B: Headerless True/False sheet
      const tfAoa = [
        ['1', '苹果 (píngguǒ)', '桌子上有一本书。', '×', 'Quả táo và quyển sách không khớp nghĩa'],
        ['2', '喝水 (hē shuǐ)', '天气很热，我想喝水。', '√', 'Cùng nói về việc uống nước'],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(tfAoa);
      const wb2 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb2, ws2, 'Sheet1');
      const buf2 = XLSX.write(wb2, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const res2 = await extractUploadedFileDetails(buf2, 'headerless_tf.xlsx');
      expect(res2.questions.length).toBe(2);
      expect(res2.questions[0].options).toEqual(['对', '错']);
      expect(res2.questions[0].answer_idx).toBe(1); // × -> 1
      expect(res2.questions[1].answer_idx).toBe(0); // √ -> 0
    });

    it('Case 3 & Case 4: Splits single-cell combined options and detects inline *marked / (Đúng) correct option', async () => {
      const aoa = [
        ['Câu hỏi', 'Các lựa chọn'],
        ['星期天我和朋友去电影院看____。', 'A. 苹果   *B. 电影   C. 衣服   D. 米饭'],
        ['他今年二十五____。', 'A. 本 | B. 块 | C. 岁 (Đúng) | D. 个'],
        ['你在做什么____？', '[x] A. 呢\nB. 吗\nC. 吧\nD. 了'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'combined_and_marked.xlsx');
      expect(parsed.length).toBe(3);
      expect(parsed[0].options).toEqual(['苹果', '电影', '衣服', '米饭']);
      expect(parsed[0].answer_idx).toBe(1);
      expect(parsed[1].options).toEqual(['本', '块', '岁', '个']);
      expect(parsed[1].answer_idx).toBe(2);
      expect(parsed[2].options).toEqual(['呢', '吗', '吧', '了']);
      expect(parsed[2].answer_idx).toBe(0);
    });

    it('Case 5: Merges Answer Key from Sheet 2 ("Đáp án") into questions on Sheet 1', async () => {
      const sheet1Aoa = [
        ['STT', 'Câu hỏi', 'A', 'B', 'C', 'D'],
        ['1', '他是我的____。', '苹果', '老师', '水', '米饭'],
        ['2', '我想买一____衣服。', '本', '个', '件', '杯'],
      ];
      const sheet2Aoa = [
        ['Câu', 'Đáp án', 'Giải thích'],
        ['1', 'B', 'Thầy giáo là 老师.'],
        ['2', 'C', 'Lượng từ quần áo là 件.'],
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1Aoa), 'Đề thi');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2Aoa), 'Đáp án');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'two_sheets.xlsx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].answer_idx).toBe(1);
      expect(parsed[0].explanation_vi).toContain('老师');
      expect(parsed[1].answer_idx).toBe(2);
      expect(parsed[1].explanation_vi).toContain('件');
    });

    it('Case 6: Parses 4-Part HSK Exam free-form layout in Excel (including horizontal A|B|C|D|E word bank row)', async () => {
      const aoa = [
        ['第一部分: 第 1 - 2 题'],
        ['Quy tắc: Đọc từ vựng và câu tương ứng, điền đúng (√) hoặc sai (×).'],
        ['苹果 (píngguǒ)', '桌子上有一本书。', '→ [ ]'],
        ['喝水 (hē shuǐ)', '天气很热，我想喝水。', '→ [ ]'],
        ['第四部分: 第 3 - 4 题'],
        ['Quy tắc: Chọn từ thích hợp trong bảng để điền vào chỗ trống.'],
        ['A', 'B', 'C', 'D', 'E'],
        ['多少 (duōshao)', '听 (tīng)', '喜欢 (xǐhuan)', '里 (lǐ)', '怎么 (zěnme)'],
        ['我非常 ______ 吃中国米饭。', '→ [ ]'],
        ['请问，这个大苹果 ______ 钱一个？', '→ [ ]'],
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'HSK1');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'freeform_4part.xlsx');
      expect(parsed.length).toBe(4);
      expect(parsed[0].part_type).toBe('read_true_false_2opt');
      expect(parsed[0].options).toEqual(['对', '错']);
      expect(parsed[0].answer_idx).toBe(1); // 苹果 vs 书 -> 错
      expect(parsed[1].answer_idx).toBe(0); // 喝水 -> 对
      expect(parsed[2].options).toEqual(['多少', '听', '喜欢', '里', '怎么']);
      expect(parsed[2].answer_idx).toBe(2); // 喜欢
      expect(parsed[3].answer_idx).toBe(0); // 多少
    });

    it('Case 7: Handles CSV with UTF-8 BOM, UTF-16LE BOM, and Semicolon / Tab / Pipe delimiters', async () => {
      const semicolonCsv =
        '\uFEFFCâu hỏi;A;B;C;D;Đáp án;Giải thích\n' +
        '我喜欢吃____。;苹果;喝水;睡觉;怎么;A;Ăn táo (苹果)\n' +
        '他去____看医生。;学校;医院;商店;饭店;B;Khám bác sĩ ở bệnh viện (医院)';
      const utf8BomBuf = Buffer.from(semicolonCsv, 'utf-8');

      const parsedSemi = await parseUploadedFileBuffer(utf8BomBuf, 'semicolon_bom.csv');
      expect(parsedSemi.length).toBe(2);
      expect(parsedSemi[0].answer_idx).toBe(0);
      expect(parsedSemi[1].answer_idx).toBe(1);

      // UTF-16LE with BOM and Tab delimiter
      const tabCsv =
        'Câu hỏi\tA\tB\tC\tD\tĐáp án\n' +
        '北京今天天气____？\t怎么样\t什么\t谁\t哪儿\tA';
      const utf16Bom = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(tabCsv, 'utf16le')]);
      expect(decodeTextBuffer(utf16Bom)).toContain('北京今天天气');

      const parsedUtf16 = await parseUploadedFileBuffer(utf16Bom, 'utf16_tab.csv');
      expect(parsedUtf16.length).toBe(1);
      expect(parsedUtf16[0].stem).toBe('北京今天天气____？');
      expect(parsedUtf16[0].answer_idx).toBe(0);
    });
  });

  // =========================================================================
  // 1B. R3: Excel / CSV Multi-Layout Parser (AC1: 13 Real-World Cases)
  // =========================================================================
  describe('R3: Excel / CSV Multi-Layout Parser (AC1)', () => {
    // 1. Standard Excel (.xlsx) with 4 options
    it('1. Standard Excel (.xlsx) with 4 options parses cleanly', async () => {
      const aoa = [
        ['STT', 'Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án', 'Giải thích'],
        ['1', '他在医院工作，他是一名____。', '老师', '医生', '学生', '朋友', 'B', 'Bác sĩ làm ở bệnh viện'],
        ['2', '我想买一____衣服。', '本', '个', '件', '杯', 'C', 'Lượng từ quần áo là 件'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'De_Thi');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'standard_4opt.xlsx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('他在医院工作，他是一名____。');
      expect(parsed[0].options).toEqual(['老师', '医生', '学生', '朋友']);
      expect(parsed[0].answer_idx).toBe(1);
      expect(parsed[1].options).toEqual(['本', '个', '件', '杯']);
      expect(parsed[1].answer_idx).toBe(2);
    });

    // 2. Excel with banner title in rows 0-4 and headers at row 5
    it('2. Excel with banner title in rows 0-4 and headers at row 5', async () => {
      const aoa = [
        ['TRƯỜNG ĐẠI HỌC NGOẠI NGỮ - KHOA TIẾNG TRUNG'],
        ['KỲ THI ĐÁNH GIÁ NĂNG LỰC HÁN NGỮ HSK 1'],
        ['Thời gian làm bài: 35 phút'],
        ['Chú ý: Thí sinh không được sử dụng từ điển'],
        ['Mã đề thi: HSK1-2026-01'],
        ['STT', 'Câu hỏi', 'Phương án A', 'Phương án B', 'Phương án C', 'Phương án D', 'Đáp án', 'Giải thích'],
        ['1', '桌子上有一____书。', '本', '个', '杯', '块', 'A', 'Lượng từ của sách là 本'],
        ['2', '今天天气很热，我想____水。', '吃', '喝', '看', '听', 'B', 'Uống nước dùng động từ 喝'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'De_Thi');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const details = await extractUploadedFileDetails(buf, 'banner_row5.xlsx');
      expect(details.is_structured_table).toBe(true);
      expect(details.diagnostics?.detected_mode).toBe('structured_header_table');
      expect(details.questions.length).toBe(2);
      expect(details.questions[0].answer_idx).toBe(0);
      expect(details.questions[1].answer_idx).toBe(1);
    });

    // 3. Excel with banner title at row 20
    it('3. Excel with banner title at row 20 (headers at row 20)', async () => {
      const aoa: any[][] = [];
      for (let i = 0; i < 20; i++) {
        aoa.push([`Dòng thông tin banner / hướng dẫn số ${i + 1}`]);
      }
      // Row 20 (0-indexed) is headers
      aoa.push(['STT', 'Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án', 'Giải thích']);
      aoa.push(['1', '北京的秋天天气很____。', '冷', '热', '舒服', '大', 'C', 'Thời tiết dễ chịu là 舒服']);
      aoa.push(['2', '请问，这个字怎么____？', '吃', '喝', '写', '听', 'C', 'Chữ Hán thì viết (写)']);

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'De_Thi');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const details = await extractUploadedFileDetails(buf, 'banner_row20.xlsx');
      expect(details.is_structured_table).toBe(true);
      expect(details.diagnostics?.detected_mode).toBe('structured_header_table');
      expect(details.questions.length).toBe(2);
      expect(details.questions[0].stem).toBe('北京的秋天天气很____。');
      expect(details.questions[0].answer_idx).toBe(2);
      expect(details.questions[1].answer_idx).toBe(2);
    });

    // 4. Excel empty structured sheet (headers only, 0 data rows) -> returns empty array, no false questions
    it('4. Excel empty structured sheet (headers only, 0 data rows) returns empty array without false questions', async () => {
      const aoa = [
        ['STT', 'Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án', 'Giải thích'],
        ['', '', '', '', '', '', '', ''],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Empty_Sheet');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'empty_structured.xlsx');
      expect(parsed).toEqual([]);
    });

    // 5. Headerless Excel layout detected via column heuristics
    it('5. Headerless Excel layout detected via column heuristics', async () => {
      const aoa = [
        ['1', '我想去商店买____。', '苹果', '医院', '睡觉', '怎么', 'A', 'Mua táo ở cửa hàng'],
        ['2', '他是我的____。', '老师', '水', '茶', '米饭', 'A', 'Thầy giáo là 老师'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const details = await extractUploadedFileDetails(buf, 'headerless_heuristics.xlsx');
      expect(details.is_structured_table).toBe(true);
      expect(details.diagnostics?.detected_mode).toBe('headerless_table');
      expect(details.questions.length).toBe(2);
      expect(details.questions[0].stem).toBe('我想去商店买____。');
      expect(details.questions[0].options).toEqual(['苹果', '医院', '睡觉', '怎么']);
      expect(details.questions[0].answer_idx).toBe(0);
      expect(details.questions[1].answer_idx).toBe(0);
    });

    // 6. Excel with combined cell options (`A. ... B. ... C. ... D. ...`)
    it('6. Excel with combined cell options (A. ... B. ... C. ... D. ...)', async () => {
      const aoa = [
        ['Câu hỏi', 'Lựa chọn', 'Đáp án', 'Giải thích'],
        ['昨天我和朋友去电影院看____。', 'A. 苹果 B. 电影 C. 衣服 D. 米饭', 'B', 'Xem phim là 电影'],
        ['他坐____去上海。', 'A. 飞机\nB. 苹果\nC. 水\nD. 书', 'A', 'Đi máy bay là 飞机'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Combined');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'combined_options.xlsx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].options).toEqual(['苹果', '电影', '衣服', '米饭']);
      expect(parsed[0].answer_idx).toBe(1);
      expect(parsed[1].options).toEqual(['飞机', '苹果', '水', '书']);
      expect(parsed[1].answer_idx).toBe(0);
    });

    // 7. Excel with inline asterisk marked answer (`*A. 苹果`)
    it('7. Excel with inline asterisk marked answer (*A. 苹果)', async () => {
      const aoa = [
        ['Câu hỏi', 'Các phương án'],
        ['星期天我想去超市买____。', '*A. 苹果   B. 医院   C. 睡觉   D. 学习'],
        ['明天天气很冷，你要多穿____。', 'A. 米饭   B. 喝水   *C. 衣服   D. 苹果'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Marked_Asterisk');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'marked_asterisk.xlsx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].options).toEqual(['苹果', '医院', '睡觉', '学习']);
      expect(parsed[0].answer_idx).toBe(0); // *A -> idx 0
      expect(parsed[1].options).toEqual(['米饭', '喝水', '衣服', '苹果']);
      expect(parsed[1].answer_idx).toBe(2); // *C -> idx 2
    });

    // 8. Excel with inline text marked answer (`B. 香蕉 (Đúng)`)
    it('8. Excel with inline text marked answer (B. 香蕉 (Đúng) / (Đáp án đúng) C. ...)', async () => {
      const aoa = [
        ['Câu hỏi', 'Danh sách lựa chọn'],
        ['猴子最喜欢吃____。', 'A. 苹果 | B. 香蕉 (Đúng) | C. 西瓜 | D. 葡萄'],
        ['他每天早上喝一____牛奶。', 'A. 本 | B. 个 | (Đáp án đúng) C. 杯 | D. 件'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Marked_Text');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'marked_text.xlsx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].options).toEqual(['苹果', '香蕉', '西瓜', '葡萄']);
      expect(parsed[0].answer_idx).toBe(1); // B (Đúng) -> idx 1
      expect(parsed[1].options).toEqual(['本', '个', '杯', '件']);
      expect(parsed[1].answer_idx).toBe(2); // C (Đáp án đúng) -> idx 2
    });

    // 9. Multi-sheet Excel (Sheet 1 questions without answers, Sheet 2 answer keys merged)
    it('9. Multi-sheet Excel (Sheet 1 questions without answers, Sheet 2 answer keys merged)', async () => {
      const sheet1Aoa = [
        ['STT', 'Câu hỏi', 'A', 'B', 'C', 'D'],
        ['1', '李老师在教室里____汉语。', '教', '买', '穿', '走'],
        ['2', '我想去中国____。', '吃', '喝', '旅游', '看'],
      ];
      const sheet2Aoa = [
        ['Câu 1: A - Thầy giáo dạy tiếng Trung (教)'],
        ['Câu 2: C - Đi Trung Quốc du lịch (旅游)'],
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1Aoa), 'Đề thi');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2Aoa), 'Đáp án');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const parsed = await parseUploadedFileBuffer(buf, 'multi_sheet_merged.xlsx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('李老师在教室里____汉语。');
      expect(parsed[0].answer_idx).toBe(0); // A from Sheet 2
      expect(parsed[0].explanation_vi).toContain('教');
      expect(parsed[1].stem).toBe('我想去中国____。');
      expect(parsed[1].answer_idx).toBe(2); // C from Sheet 2
      expect(parsed[1].explanation_vi).toContain('旅游');
    });

    // 10. CSV with semicolon delimiter `;`
    it('10. CSV with semicolon delimiter (;)', async () => {
      const csvStr =
        'Câu hỏi;A;B;C;D;Đáp án;Giải thích\n' +
        '我喜欢吃____。;苹果;喝水;睡觉;怎么;A;Ăn táo là 苹果\n' +
        '他去____看医生。;学校;医院;商店;饭店;B;Khám bác sĩ ở bệnh viện';
      const buf = Buffer.from(csvStr, 'utf-8');

      const parsed = await parseUploadedFileBuffer(buf, 'semicolon.csv');
      expect(parsed.length).toBe(2);
      expect(parsed[0].options).toEqual(['苹果', '喝水', '睡觉', '怎么']);
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[1].options).toEqual(['学校', '医院', '商店', '饭店']);
      expect(parsed[1].answer_idx).toBe(1);
    });

    // 11. CSV with tab delimiter `\t`
    it('11. CSV with tab delimiter (\\t)', async () => {
      const tabCsv =
        'Câu hỏi\tA\tB\tC\tD\tĐáp án\tGiải thích\n' +
        '北京今天天气____？\t怎么样\t什么\t谁\t哪儿\tA\tHỏi thời tiết thế nào\n' +
        '你想喝咖啡还是____？\t茶\t书\t苹果\t衣服\tA\tUống trà là 茶';
      const buf = Buffer.from(tabCsv, 'utf-8');

      const parsed = await parseUploadedFileBuffer(buf, 'tab_delimited.csv');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('北京今天天气____？');
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[1].stem).toBe('你想喝咖啡还是____？');
      expect(parsed[1].answer_idx).toBe(0);
    });

    // 12. CSV with UTF-8 BOM encoding
    it('12. CSV with UTF-8 BOM encoding', async () => {
      const bomCsv =
        '\uFEFFCâu hỏi,A,B,C,D,Đáp án,Giải thích\n' +
        '他今年二十五____。,岁,本,块,个,A,Tuổi dùng 岁\n' +
        '那是谁的____？,书,吃,喝,热,A,Sách là 书';
      const buf = Buffer.from(bomCsv, 'utf-8');

      const parsed = await parseUploadedFileBuffer(buf, 'utf8_bom.csv');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('他今年二十五____。');
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[1].stem).toBe('那是谁的____？');
      expect(parsed[1].answer_idx).toBe(0);
    });

    // 13. CSV with UTF-16LE encoding
    it('13. CSV with UTF-16LE encoding', async () => {
      const content =
        'Câu hỏi,A,B,C,D,Đáp án,Giải thích\n' +
        '你在看什么____？,书,水,苹果,衣服,A,Đọc sách dùng 书\n' +
        '我每天坐____上班。,地铁,苹果,茶,椅子,A,Đi làm bằng tàu điện ngầm';
      const utf16leBuf = Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from(content, 'utf16le'),
      ]);

      const parsed = await parseUploadedFileBuffer(utf16leBuf, 'utf16le.csv');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('你在看什么____？');
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[1].stem).toBe('我每天坐____上班。');
      expect(parsed[1].answer_idx).toBe(0);
    });
  });

  // =========================================================================
  // 2. R2: Deep Word (.docx) OpenXML Parser Cases
  // =========================================================================
  describe('R2: Deep Word (.docx) OpenXML Cases', () => {
    it('Case 8A: Roundtrip Word (.docx) export with bottom Answer Key section parses 100% accurately', async () => {
      const sampleQuestions: CandidateQuestion[] = [
        {
          stem: '他是我的____。',
          pinyin: 'Tā shì wǒ de ____.',
          options: ['水', '老师', '吃', '热'],
          answer_idx: 1,
          explanation_vi: 'Thầy giáo là 老师.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        },
        {
          stem: '你认识那个汉字吗？',
          pinyin: 'Nǐ rènshi nà ge hànzì ma?',
          options: ['我会写一点儿。', '今天很冷。', '三个苹果。', '坐出租车。'],
          answer_idx: 0,
          explanation_vi: 'Hỏi biết chữ Hán không -> Trả lời biết viết một chút.',
          level: 1,
          skill: 'reading',
          part_type: 'read_dialogue_matching_4opt',
        },
      ];

      const docxBuf = exportExamToWord(sampleQuestions, 'Đề HSK 1 Word');
      const parsed = await parseUploadedFileBuffer(docxBuf, 'roundtrip.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('他是我的____。');
      expect(parsed[0].answer_idx).toBe(1);
      expect(parsed[1].stem).toBe('你认识那个汉字吗？');
      expect(parsed[1].answer_idx).toBe(0);
    });

    it('Case 8B: Reconstructs Word Automatic Numbering (<w:numPr> + word/numbering.xml) & detects bold/colored answers', async () => {
      const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:abstractNum w:abstractNumId="1">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
            <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%2."/></w:lvl>
          </w:abstractNum>
          <w:num w:numId="10"><w:abstractNumId w:val="1"/></w:num>
        </w:numbering>`;

      // Notice: No "1.", "2." or "A.", "B.", "C.", "D." inside <w:t>!
      // And no "Đáp án:" text! Option C in Q1 is bold (<w:b/>) and Option B in Q2 is red (<w:color w:val="FF0000"/>).
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="10"/></w:numPr></w:pPr>
              <w:r><w:t>我想去书店买两</w:t></w:r>
              <w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>    </w:t></w:r>
              <w:r><w:t>汉语书。</w:t></w:r>
            </w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>个</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>杯</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>本</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>件</w:t></w:r></w:p>

            <w:p>
              <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="10"/></w:numPr></w:pPr>
              <w:r><w:t>谢谢你的帮助！</w:t></w:r>
            </w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>好的，明天见。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>不客气。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>我在看书呢。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>没关系。</w:t></w:r></w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({
        'word/document.xml': documentXml,
        'word/numbering.xml': numberingXml,
      });

      const extractedText = extractDocxTextFromBuffer(zipBuf);
      expect(extractedText).toContain('Câu 1: 我想去书店买两____汉语书。');
      expect(extractedText).toContain('C. 本');
      expect(extractedText).toContain('[ĐÁP_ÁN: C]');
      expect(extractedText).toContain('[ĐÁP_ÁN: B]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'auto_num_and_styled.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('我想去书店买两____汉语书。');
      expect(parsed[0].options).toEqual(['个', '杯', '本', '件']);
      expect(parsed[0].answer_idx).toBe(2); // C (bold)
      expect(parsed[1].stem).toBe('谢谢你的帮助！');
      expect(parsed[1].answer_idx).toBe(1); // B (red color)
    });

    it('Case 8C: Converts Word tables (<w:tbl>): Question-per-row table & 2-row Bottom Answer Key table', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 天气很热，我想____水。</w:t></w:r></w:p>
            <w:p><w:r><w:t>A. 吃   B. 喝   C. 看   D. 写</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 2: 他坐____去北京。</w:t></w:r></w:p>
            <w:p><w:r><w:t>A. 苹果   B. 书   C. 飞机   D. 水</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const parsed = await parseUploadedFileBuffer(zipBuf, 'table_key.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].answer_idx).toBe(1); // B from bottom table
      expect(parsed[1].answer_idx).toBe(2); // C from bottom table
    });

    it('Case W1: Multi-Question Auto-Numbering Restart across separate numIds', async () => {
      const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:abstractNum w:abstractNumId="1">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:abstractNum w:abstractNumId="2">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
          <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
        </w:numbering>`;

      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>我想喝____。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>水</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>书</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>苹果</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>飞机</w:t></w:r></w:p>

            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>那是李老师的____。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>衣服</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>自行车</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>桌子</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>椅子</w:t></w:r></w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({
        'word/document.xml': documentXml,
        'word/numbering.xml': numberingXml,
      });

      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('Câu 1: 我想喝____。');
      expect(extracted).toContain('A. 水');
      expect(extracted).toContain('B. 书');
      expect(extracted).toContain('Câu 2: 那是李老师的____。');
      expect(extracted).toContain('A. 衣服');
      expect(extracted).toContain('B. 自行车');
      expect(extracted).not.toContain('E. 衣服');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w1_restart.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].options).toEqual(['水', '书', '苹果', '飞机']);
      expect(parsed[0].answer_idx).toBe(0); // A
      expect(parsed[1].options).toEqual(['衣服', '自行车', '桌子', '椅子']);
      expect(parsed[1].answer_idx).toBe(1); // B
    });

    it('Case W2: Horizontal options in single paragraph with Bold answer', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 天气很热，我想____水。</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 吃   </w:t></w:r>
              <w:r><w:rPr><w:b/></w:rPr><w:t>B. 喝   </w:t></w:r>
              <w:r><w:t>C. 看   D. 写</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: B]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w2_horizontal_bold.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('天气很热，我想____水。');
      expect(parsed[0].options).toEqual(['吃', '喝', '看', '写']);
      expect(parsed[0].answer_idx).toBe(1); // B
    });

    it('Case W3: Horizontal options with Red Color answer (<w:color w:val="FF0000"/>)', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 他去医院看____。</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 老师   B. 学生   </w:t></w:r>
              <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>C. 医生   </w:t></w:r>
              <w:r><w:t>D. 司机</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: C]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w3_horizontal_color.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].options).toEqual(['老师', '学生', '医生', '司机']);
      expect(parsed[0].answer_idx).toBe(2); // C
    });

    it('Case W4: Horizontal options with Highlight / Shading answer (<w:highlight/> / <w:shd/>)', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 星期天我和朋友去电影院____。</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 睡觉   B. 喝水   C. 买书   </w:t></w:r>
              <w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>D. 看电影</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: D]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w4_horizontal_highlight.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].options).toEqual(['睡觉', '喝水', '买书', '看电影']);
      expect(parsed[0].answer_idx).toBe(3); // D
    });

    it('Case W5: Underline disambiguation: Stem placeholder ____ vs Option underlined answer', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Câu 1: 我想去书店买两</w:t></w:r>
              <w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>    </w:t></w:r>
              <w:r><w:t>汉语书。</w:t></w:r>
            </w:p>
            <w:p>
              <w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>A. 本   </w:t></w:r>
              <w:r><w:t>B. 个   C. 杯   D. 件</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('Câu 1: 我想去书店买两____汉语书。');
      expect(extracted).toContain('[ĐÁP_ÁN: A]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w5_underline.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('我想去书店买两____汉语书。');
      expect(parsed[0].options).toEqual(['本', '个', '杯', '件']);
      expect(parsed[0].answer_idx).toBe(0); // A
    });

    it('Case W6: Chinese characters with Complex Script Bold (<w:bCs/>) without standard <w:b/>', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 昨天北京的天气怎么样？</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 很好   </w:t></w:r>
              <w:r><w:rPr><w:bCs/></w:rPr><w:t>B. 很冷   </w:t></w:r>
              <w:r><w:t>C. 太热   D. 下雨</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: B]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w6_bcs.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(1); // B
    });

    it('Case W7: 2-Row Horizontal Word Bank Table (HSK Part 4) with punctuated headers', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>第四部分: 第 1 - 2 题</w:t></w:r></w:p>
            <w:p><w:r><w:t>Quy tắc: Chọn từ thích hợp trong bảng để điền vào chỗ trống.</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>A.</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B.</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C.</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>D.</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>E.</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>多少</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>听</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>喜欢</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>里</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>怎么</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
            <w:p><w:r><w:t>我非常____吃中国米饭。 → [ ]</w:t></w:r></w:p>
            <w:p><w:r><w:t>他在房间____睡觉。 → [ ]</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('A. 多少');
      expect(extracted).toContain('B. 听');
      expect(extracted).toContain('C. 喜欢');
      expect(extracted).toContain('D. 里');
      expect(extracted).toContain('E. 怎么');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w7_word_bank.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].stem).toBe('我非常____吃中国米饭。');
      expect(parsed[0].options).toEqual(['多少', '听', '喜欢', '里', '怎么']);
      expect(parsed[0].answer_idx).toBe(2); // C
      expect(parsed[1].stem).toBe('他在房间____睡觉。');
      expect(parsed[1].options).toEqual(['多少', '听', '喜欢', '里', '怎么']);
      expect(parsed[1].answer_idx).toBe(3); // D
    });

    it('Case W8: Bottom Answer Key Table with leading label column ("Câu" and "Đáp án")', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 苹果 桌子上有一本书。 → [ ]</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 2: 喝水 天气很热，我想喝水。 → [ ]</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 3: 他坐飞机去北京。 A. 飞机 B. 火车 C. 出租车 D. 自行车</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>Câu</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>3</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>Đáp án</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>×</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>√</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT');
      expect(extracted).toContain('1. ×');
      expect(extracted).toContain('2. √');
      expect(extracted).toContain('3. A');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w8_label_key_table.docx');
      expect(parsed.length).toBe(3);
      expect(parsed[0].answer_idx).toBe(1); // × is False (idx 1)
      expect(parsed[1].answer_idx).toBe(0); // √ is True (idx 0)
      expect(parsed[2].answer_idx).toBe(0); // A (idx 0)
    });

    it('Case W9: Question-per-row table without inline answers defers to footer table instead of fake "A"', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>STT</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Câu hỏi</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>他是我的____。</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>水</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>老师</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>吃</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>热</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>昨天北京很____。</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>冷</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>热</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>水</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>大</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      // Ensure the question rows themselves do not have premature "Đáp án: A"
      expect(extracted).not.toMatch(/Câu 1:[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\nĐáp án: A/);

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w9_no_premature_a.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].answer_idx).toBe(1); // B from footer table (not forced to A!)
      expect(parsed[1].answer_idx).toBe(0); // A from footer table
    });

    it('Case W10: Word document with stem bold keyword does not emit false answer', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Câu 1: 这里的风景非常</w:t></w:r>
              <w:r><w:rPr><w:b/></w:rPr><w:t>美丽</w:t></w:r>
              <w:r><w:t>。</w:t></w:r>
            </w:p>
            <w:p><w:r><w:t>A. 吃   B. 喝   C. 看   D. 写</w:t></w:r></w:p>
            <w:p><w:r><w:t>Đáp án: C</w:t></w:r></w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      // Should NOT contain [ĐÁP_ÁN: ...] from stem keyword "美丽"
      expect(extracted).not.toContain('[ĐÁP_ÁN:');
      expect(extracted).toContain('Đáp án: C');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w10_stem_bold.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(2); // C
    });

    it('Case W11: 2-column Vertical Answer Key table (| Câu | Đáp án |) parses answers correctly', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 天气很热，我想____水。 A. 吃 B. 喝 C. 看 D. 写</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 2: 他坐____去北京。 A. 飞机 B. 书 C. 水 D. 苹果</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>Câu</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Đáp án</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT');
      expect(extracted).toContain('1. B');
      expect(extracted).toContain('2. A');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'w11_vertical_table_key.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].answer_idx).toBe(1); // B
      expect(parsed[1].answer_idx).toBe(0); // A
    });
  });

  // =========================================================================
  // 3. R1: PDF X/Y Coordinate Layout Reconstruction
  // =========================================================================
  describe('R1: PDF X/Y Coordinate Layout Reconstruction', () => {
    // Helper for generating in-memory PDF-1.4 binary buffer
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
      pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

      offsets.push(pdf.length);
      pdf += `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

      offsets.push(pdf.length);
      pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

      const xrefOffset = pdf.length;
      pdf += 'xref\n0 6\n0000000000 65535 f \n';
      for (const off of offsets) {
        pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
      }
      pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

      return Buffer.from(pdf, 'latin1');
    }

    it('Case 9A: Reconstructs visual lines, preserves horizontal option columns, and strips page footers', () => {
      const pdfItems = [
        // Line 1 (y = 750)
        { str: 'Câu 1: ', transform: [1, 0, 0, 1, 50, 750], width: 35 },
        { str: '他是我的____。', transform: [1, 0, 0, 1, 86, 750], width: 90 },
        // Line 2 (y = 730): 4 horizontal options separated by wide X gaps
        { str: 'A. 老师', transform: [1, 0, 0, 1, 50, 730], width: 40 },
        { str: 'B. 苹果', transform: [1, 0, 0, 1, 160, 730], width: 40 },
        { str: 'C. 飞机', transform: [1, 0, 0, 1, 270, 730], width: 40 },
        { str: 'D. 喝水', transform: [1, 0, 0, 1, 380, 730], width: 40 },
        // Line 3 (y = 710)
        { str: 'Đáp án: A', transform: [1, 0, 0, 1, 50, 710], width: 60 },
        // Page footer at bottom (y = 30) - should be stripped!
        { str: 'Trang 1 / 4', transform: [1, 0, 0, 1, 250, 30], width: 60 },
      ];

      const pageText = reconstructPdfPageTextFromItems(pdfItems);
      expect(pageText).toContain('Câu 1: 他是我的____。');
      expect(pageText).toContain('A. 老师\tB. 苹果\tC. 飞机\tD. 喝水');
      expect(pageText).not.toContain('Trang 1 / 4');
    });

    it('Case 9B: Baseline jitter tolerance (|dy| <= 3.5) clusters glyphs into single line without merging adjacent lines (|dy| >= 7.0)', () => {
      const pdfItems = [
        // Line 1 with baseline jitter: y in [699.2, 702.5] (anchor 702.5, |dy| <= 3.3)
        { str: 'Câu 1: ', transform: [1, 0, 0, 1, 50, 700.0], width: 35 },
        { str: '他', transform: [1, 0, 0, 1, 86, 702.5], width: 12 },
        { str: '买了一本书。', transform: [1, 0, 0, 1, 98, 699.2], width: 60 },
        // Line 2: y = 688.0 (anchor 702.5 - 688.0 = 14.5 > 3.5)
        { str: 'A. 苹果', transform: [1, 0, 0, 1, 50, 688.0], width: 40 },
        { str: 'B. 老师', transform: [1, 0, 0, 1, 160, 687.5], width: 40 },
      ];

      const pageText = reconstructPdfPageTextFromItems(pdfItems);
      const lines = pageText.split('\n');
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('Câu 1: 他买了一本书。');
      expect(lines[1]).toBe('A. 苹果\tB. 老师');
    });

    it('Case 9C: Preserves tab delimiter for wide horizontal option gaps (gap > 18) vs normal spacing (gap > 2.5) vs glued Chinese characters (gap <= 2.5)', () => {
      const pdfItems = [
        // Option A: "A. " at 50..65, "老" at 65..75, "师" at 75..85 (gap = 0 <= 2.5 -> glued "老师")
        { str: 'A. ', transform: [1, 0, 0, 1, 50, 600], width: 15 },
        { str: '老', transform: [1, 0, 0, 1, 65, 600], width: 10 },
        { str: '师', transform: [1, 0, 0, 1, 75, 600], width: 10 },
        // Option B: at x = 110 (gap = 110 - 85 = 25 > 18 -> '\tB. ')
        // "好" at 126..136, "人" at 138..148 (gap = 2 <= 2.5 -> glued "好人")
        { str: 'B. ', transform: [1, 0, 0, 1, 110, 600], width: 16 },
        { str: '好', transform: [1, 0, 0, 1, 126, 600], width: 10 },
        { str: '人', transform: [1, 0, 0, 1, 138, 600], width: 10 },
      ];

      const pageText = reconstructPdfPageTextFromItems(pdfItems);
      expect(pageText).toBe('A. 老师\tB. 好人');
    });

    it('Case 9D: Correctly reorders out-of-order stream items by X ascending (left-to-right)', () => {
      // PDF content streams can emit elements in arbitrary order: D, A, C, B
      const pdfItems = [
        { str: 'D. 四', transform: [1, 0, 0, 1, 380, 500], width: 40 },
        { str: 'A. 一', transform: [1, 0, 0, 1, 50, 500], width: 40 },
        { str: 'C. 三', transform: [1, 0, 0, 1, 270, 500], width: 40 },
        { str: 'B. 二', transform: [1, 0, 0, 1, 160, 500], width: 40 },
      ];

      const pageText = reconstructPdfPageTextFromItems(pdfItems);
      expect(pageText).toBe('A. 一\tB. 二\tC. 三\tD. 四');
    });

    it('Case 9E: Safe page footer removal: removes various footer patterns at margins while strictly preserving standalone digits, section headers, and answer keys in document body', () => {
      const pdfItems = [
        // Running header in top margin (y = 780 > 750)
        { str: 'Page 1 of 5', transform: [1, 0, 0, 1, 250, 780], width: 60 },
        { str: '1', transform: [1, 0, 0, 1, 550, 780], width: 10 },
        // Document body items (y between 50 and 740)
        { str: '第一部分: 阅读理解', transform: [1, 0, 0, 1, 50, 740], width: 100 },
        { str: 'Phần 1: Chọn từ thích hợp', transform: [1, 0, 0, 1, 50, 720], width: 120 },
        { str: 'Câu 1: 他买了 3 个苹果。', transform: [1, 0, 0, 1, 50, 690], width: 110 },
        { str: 'A. 4', transform: [1, 0, 0, 1, 50, 660], width: 30 },
        { str: '4', transform: [1, 0, 0, 1, 50, 630], width: 10 }, // Standalone digit in body - MUST BE PRESERVED!
        { str: 'ĐÁP ÁN: 1. A  2. B  3. C', transform: [1, 0, 0, 1, 50, 600], width: 140 },
        // Running footers in bottom margin (y < 45)
        { str: '第 1 页 共 5 页', transform: [1, 0, 0, 1, 200, 35], width: 70 },
        { str: '- 1 -', transform: [1, 0, 0, 1, 280, 30], width: 30 },
        { str: '1', transform: [1, 0, 0, 1, 500, 20], width: 10 }, // Bare digit at margin - MUST BE STRIPPED!
      ];

      const pageText = reconstructPdfPageTextFromItems(pdfItems);
      // Footers and headers at margins must be removed
      expect(pageText).not.toContain('Page 1 of 5');
      expect(pageText).not.toContain('第 1 页 共 5 页');
      expect(pageText).not.toContain('- 1 -');

      // Body content must be preserved 100%
      expect(pageText).toContain('第一部分: 阅读理解');
      expect(pageText).toContain('Phần 1: Chọn từ thích hợp');
      expect(pageText).toContain('Câu 1: 他买了 3 个苹果。');
      expect(pageText).toContain('A. 4');
      expect(pageText).toContain('4');
      expect(pageText).toContain('ĐÁP ÁN: 1. A  2. B  3. C');

      // Verify that '4' is actually preserved as a line
      const lines = pageText.split('\n');
      expect(lines).toContain('4');
      // Margin bare '1' should NOT be in lines
      expect(lines).not.toContain('1');
    });

    it('Case 9F: Robust fallback handling for items without transform coordinates using hasEOL, and empty items array', () => {
      // Empty items returns ''
      expect(reconstructPdfPageTextFromItems([])).toBe('');

      // Items without transform, relying on hasEOL
      const fallbackItems = [
        { str: 'Câu 1: ', hasEOL: false },
        { str: '他是老师。', hasEOL: true },
        { str: 'A. 对', hasEOL: false },
        { str: 'B. 错', hasEOL: true },
      ];

      const pageText = reconstructPdfPageTextFromItems(fallbackItems);
      const lines = pageText.split('\n');
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('Câu 1: 他是老师。');
      expect(lines[1]).toBe('A. 对 B. 错');
    });

    it('Case 9G: End-to-end PDF stream extraction and question parsing via extractPdfTextFromBuffer and parseUploadedFileBuffer', async () => {
      const pdfLines = [
        'HSK 1 Mock Test',
        'Cau 1: Ta shi wo de ____.',
        'A. laoshi  B. pingguo  C. feiji  D. heshui',
        'DAP AN: A',
      ];
      const pdfBuf = generateInMemoryPdf(pdfLines);
      expect(pdfBuf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      const extractedText = await extractPdfTextFromBuffer(pdfBuf);
      expect(extractedText).toContain('Ta shi wo de ____.');
      expect(extractedText).toContain('DAP AN: A');

      const parsed = await parseUploadedFileBuffer(pdfBuf, 'hsk_exam.pdf');
      expect(parsed.length).toBeGreaterThanOrEqual(1);
      expect(parsed[0].answer_idx).toBe(0);
    });
  });

  // =========================================================================
  // 4. R4: End-to-End POST /api/qbank/upload-file & Instant CBT Integration
  // =========================================================================
  describe('R4: End-to-End /api/qbank/upload-file & Instant CBT Conversion', () => {
    let app: express.Express;
    let server: http.Server;
    let baseUrl: string;
    let stagingDb: DatabaseSync;
    const TEST_TOKEN = 'upload-comprehensive-token-2026';

    beforeAll(async () => {
      stagingDb = new DatabaseSync(':memory:');
      ensurePendingSchema(stagingDb);
      setDbSyncForTesting(stagingDb);
      setQBankAdminTokenForTesting(TEST_TOKEN);

      app = express();
      app.use(express.json({ limit: '25mb' }));
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

    it('Accepts 100% of mixed-format real-world questions (True/False, Dialogue Match, Word Bank, Fill Blank) via /api/qbank/upload-file and converts to CBT', async () => {
      const full20QText = `
第一部分: 第 1 - 5 题 (Phần 1: Câu 1 - 5)
Quy tắc: Đọc từ vựng và câu tương ứng, xác định xem nội dung hai bên có đồng nhất ý nghĩa hay không. Điền đúng (√) hoặc sai (×).
苹果 (píngguǒ) 桌子上有一本书。(Zhuōzi shang yǒu yì běn shū.) → [ ]
喝水 (hē shuǐ) 天气很热，我想喝水。(Tiānqì hěn rè, wǒ xiǎng hē shuǐ.) → [ ]
打电话 (dǎ diànhuà) 他在睡觉，没打电话。(Tā zài shuìjiào, méi dǎ diànhuà.) → [ ]
看电影 (kàn diànyǐng) 星期天我和朋友去电影院看电影。(Xīngqītiān wǒ hé péngyou qù diànyǐngyuàn kàn diànyǐng.) → [ ]
飞机 (fēijī) 那是李老师的自行车。(Nà shì Lǐ lǎoshī de zìxíngchē.) → [ ]
第二部分: 第 6 - 10 题 (Phần 2: Câu 6 - 10)
Quy tắc: Chọn một phương án phù hợp nhất từ A đến E để ghép với từng câu ngữ cảnh (mỗi phương án chỉ dùng một lần).
Ký hiệu Câu lựa chọn
A 不客气。(Bú kèqi.)
B 她去医院看医生了。(Tā qù yīyuàn kàn yīshēng le.)
C 好的，明天见。(Hǎo de, míngtiān jiàn.)
D 没关系，请坐。(Méi guānxi, qǐng zuò.)
E 我在看书呢。(Wǒ zài kàn shū ne.)
谢谢你的帮助！(Xièxie nǐ de bāngzhù!) → [ ]
对不起，我来晚了。(Duìbuqǐ, wǒ lái wǎn le.) → [ ]
你妈妈不在家吗？(Nǐ māma bú zài jiā ma?) → [ ]
你在做什么呢？(Nǐ zài zuò shénme ne?) → [ ]
明天上午八点见。(Míngtiān shàngwǔ bā diǎn jiàn.) → [ ]
第三部分: 第 11 - 15 题 (Phần 3: Câu 11 - 15)
Quy tắc: Chọn chữ cái từ A đến E tương ứng với câu trả lời đúng cho từng câu hỏi.
Ký hiệu Câu phản hồi
A 我是坐出租车去的。(Wǒ shì zuò chūzūchē qù de.)
B 他今年二十五岁。(Tā jīnnián èrshíwǔ suì.)
C 今天冷，明天不冷。(Jīntiān lěng, míngtiān bù lěng.)
D 我会写一点儿。(Wǒ huì xiě yìdiǎnr.)
E 里面有三个苹果。(Lǐmian yǒu sān ge píngguǒ.)
你认识那个汉字吗？你会写吗？(Nǐ rènshi nà ge hànzì ma? Nǐ huì xiě ma?) → [ ]
你哥哥多大了？(Nǐ gēge duō dà le?) → [ ]
你怎么去火车站的？(Nǐ zěnme qù huǒchēzhàn de?) → [ ]
书包里面有什么？(Shūbāo lǐmian yǒu shénme?) → [ ]
北京今天天气冷不冷？(Běijīng jīntiān tiānqì lěng bù lěng?) → [ ]
第四部分: 第 16 - 20 题 (Phần 4: Câu 16 - 20)
Quy tắc: Chọn từ thích hợp trong bảng để điền vào chỗ trống trong mỗi câu.
ABCDE 多少 (duōshao) 听 (tīng) 喜欢 (xǐhuan) 里 (lǐ) 怎么 (zěnme)
我非常 ______ 吃中国米饭。(Wǒ fēicháng ______ chī Zhōngguó mǐfàn.) → [ ]
请问，这个大苹果 ______ 钱一个？(Qǐngwèn, zhè ge dà píngguǒ ______ qián yí ge?) → [ ]
他在房间 ______ 睡觉。(Tā zài fángjiān ______ shuìjiào.) → [ ]
你想 ______ 音乐还是看电视？(Nǐ xiǎng ______ yīnyuè háishi kàn diànshì?) → [ ]
医院在哪儿？请问我 ______ 走？(Yīyuàn zài nǎr? Qǐngwèn wǒ ______ zǒu?) → [ ]
      `;

      // Package this 20-question exam into a Word (.docx) file and upload via POST /api/qbank/upload-file
      const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            ${full20QText
              .split('\n')
              .map((l) => `<w:p><w:r><w:t>${l}</w:t></w:r></w:p>`)
              .join('\n')}
          </w:body>
        </w:document>`;
      const docxBuf = buildCustomDocxZip({ 'word/document.xml': docXml });

      const res = await fetch(`${baseUrl}/api/qbank/upload-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          file_name: 'de_thi_20_cau_hsk1.docx',
          file_type: 'docx',
          file_base64: docxBuf.toString('base64'),
          default_level: 1,
          default_skill: 'reading',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(20);
      expect(data.accepted_count).toBe(20);
      expect(data.rejected_count).toBe(0);
      expect(data.diagnostics?.detected_mode).toBe('docx_openxml_deep');
      expect(data.raw_text_preview).toContain('第一部分');

      // Convert all 20 uploaded questions into an Instant CBT Exam Set
      const rawQuestions = data.results.map((r: any) => r.question);
      const cbtSet = createCustomExamSet({
        title: 'Đề HSK 1 từ File Word (20 câu)',
        level: 1,
        sourceLabel: 'File: de_thi_20_cau_hsk1.docx',
        rawQuestions,
      });

      expect(cbtSet.questionCount).toBe(20);
      expect(cbtSet.questions[0].options).toEqual(['✓ 对 (Đúng)', '✗ 错 (Sai)']);
      expect(cbtSet.questions[0].answer_index).toBe(1);
      expect(cbtSet.questions[5].options.length).toBe(5);
      expect(cbtSet.questions[5].answer_index).toBe(0); // A: 不客气。
      expect(cbtSet.questions[15].answer_index).toBe(2); // C: 喜欢
    });
  });
});
