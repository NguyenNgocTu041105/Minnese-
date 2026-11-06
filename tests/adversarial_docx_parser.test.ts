/**
 * tests/adversarial_docx_parser.test.ts
 *
 * Adversarial Challenge Suite for Milestone M2 (Word .docx Parser Overhaul):
 * 1. Full 4-Part HSK Word Document in-memory synthesis:
 *    - Part 1: True/False with Word automatic numbering (<w:numPr>).
 *    - Part 2: Matching with horizontal options where answers are bolded (<w:b/>).
 *    - Part 3: Multiple choice with horizontal options where answers are red color (<w:color w:val="FF0000"/>).
 *    - Part 4: 2-row horizontal word bank table followed by fill-in-the-blank questions.
 *    - Footer: 2-row table answer key with "Câu" and "Đáp án" label headers.
 * 2. Downstream universalQuestionParser and parseUploadedFileBuffer extraction accuracy (100% of questions and answers).
 * 3. Extreme edge cases: 0-byte buffer, corrupt zip headers, truncated central directory, missing word/document.xml.
 */

import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import {
  extractDocxTextFromBuffer,
  extractUploadedFileDetails,
  parseUploadedFileBuffer,
} from '../src/server/fileUploadParser.js';

/**
 * Builds an in-memory PKZip (.docx) buffer from custom XML files.
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
    cdHdr.writeUInt32LE(0, 14);
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

describe('Adversarial Challenge: Milestone M2 Word (.docx) Parser', () => {
  describe('Scenario 1: Full 4-Part HSK Word Document In-Memory Synthesis', () => {
    it('synthesizes full 4-part HSK document and verifies 100% extraction accuracy across all parts and answer keys', async () => {
      const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:abstractNum w:abstractNumId="1">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:num w:numId="10"><w:abstractNumId w:val="1"/></w:num>
        </w:numbering>`;

      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <!-- Part 1: True / False with Word Auto-Numbering -->
            <w:p><w:r><w:t>第一部分: 第 1 - 2 题</w:t></w:r></w:p>
            <w:p><w:r><w:t>Quy tắc: Phán đoán đúng sai cho mỗi câu dưới đây.</w:t></w:r></w:p>
            <w:p>
              <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="10"/></w:numPr></w:pPr>
              <w:r><w:t>桌子上有一本书。 → [ ]</w:t></w:r>
            </w:p>
            <w:p>
              <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="10"/></w:numPr></w:pPr>
              <w:r><w:t>天气很热，我想喝水。 → [ ]</w:t></w:r>
            </w:p>

            <!-- Part 2: Matching with horizontal options where answers are bolded -->
            <w:p><w:r><w:t>第二部分: 第 3 - 4 题</w:t></w:r></w:p>
            <w:p><w:r><w:t>Quy tắc: Chọn câu trả lời phù hợp.</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 3: 他坐什么去北京？</w:t></w:r></w:p>
            <w:p>
              <w:r><w:rPr><w:b/></w:rPr><w:t>A. 飞机   </w:t></w:r>
              <w:r><w:t>B. 火车   C. 出租车   D. 自行车</w:t></w:r>
            </w:p>
            <w:p><w:r><w:t>Câu 4: 谁在医院工作？</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 老师   </w:t></w:r>
              <w:r><w:rPr><w:b/></w:rPr><w:t>B. 医生   </w:t></w:r>
              <w:r><w:t>C. 学生   D. 司机</w:t></w:r>
            </w:p>

            <!-- Part 3: Multiple choice where answers are red color (#FF0000) -->
            <w:p><w:r><w:t>第三部分: 第 5 - 6 题</w:t></w:r></w:p>
            <w:p><w:r><w:t>Quy tắc: Chọn đáp án đúng nhất.</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 5: 他在做什么呢？</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 他在睡觉。   B. 他在吃饭。   </w:t></w:r>
              <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>C. 他在看书。   </w:t></w:r>
              <w:r><w:t>D. 他在写字。</w:t></w:r>
            </w:p>
            <w:p><w:r><w:t>Câu 6: 你喜欢吃什么水果？</w:t></w:r></w:p>
            <w:p>
              <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>A. 苹果   </w:t></w:r>
              <w:r><w:t>B. 米饭   C. 面条   D. 包子</w:t></w:r>
            </w:p>

            <!-- Part 4: 2-row horizontal word bank table followed by fill-in-the-blank questions -->
            <w:p><w:r><w:t>第四部分: 第 7 - 8 题</w:t></w:r></w:p>
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
            <w:p><w:r><w:t>Câu 7: 我非常____吃中国米饭。 → [ ]</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 8: 他在房间____睡觉。 → [ ]</w:t></w:r></w:p>

            <!-- Footer: 2-row table answer key with "Câu" and "Đáp án" headers -->
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>Câu</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>3</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>4</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>5</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>6</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>7</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>8</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>Đáp án</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>×</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>√</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const docxBuf = buildCustomDocxZip({
        'word/document.xml': documentXml,
        'word/numbering.xml': numberingXml,
      });

      // 1. Text extraction check
      const rawText = extractDocxTextFromBuffer(docxBuf);
      expect(rawText).toContain('Câu 1: 桌子上有一本书。');
      expect(rawText).toContain('Câu 2: 天气很热，我想喝水。');
      expect(rawText).toContain('[ĐÁP_ÁN: A]');
      expect(rawText).toContain('[ĐÁP_ÁN: B]');
      expect(rawText).toContain('[ĐÁP_ÁN: C]');
      expect(rawText).toContain('A. 多少');
      expect(rawText).toContain('E. 怎么');
      expect(rawText).toContain('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT');
      expect(rawText).toContain('1. ×');
      expect(rawText).toContain('2. √');
      expect(rawText).toContain('3. A');
      expect(rawText).toContain('4. B');
      expect(rawText).toContain('5. C');
      expect(rawText).toContain('6. A');
      expect(rawText).toContain('7. C');
      expect(rawText).toContain('8. D');

      // 2. Downstream parsing check via parseUploadedFileBuffer
      const questions = await parseUploadedFileBuffer(docxBuf, 'full_4part_hsk.docx');
      expect(questions.length).toBe(8);

      // Part 1: True / False
      expect(questions[0].stem).toBe('桌子上有一本书。');
      expect(questions[0].options).toEqual(['对', '错']);
      expect(questions[0].answer_idx).toBe(1); // × (False)

      expect(questions[1].stem).toBe('天气很热，我想喝水。');
      expect(questions[1].options).toEqual(['对', '错']);
      expect(questions[1].answer_idx).toBe(0); // √ (True)

      // Part 2: Matching with bold horizontal options
      expect(questions[2].stem).toBe('他坐什么去北京？');
      expect(questions[2].options).toEqual(['飞机', '火车', '出租车', '自行车']);
      expect(questions[2].answer_idx).toBe(0); // A (bold)

      expect(questions[3].stem).toBe('谁在医院工作？');
      expect(questions[3].options).toEqual(['老师', '医生', '学生', '司机']);
      expect(questions[3].answer_idx).toBe(1); // B (bold)

      // Part 3: Multiple choice with red color options
      expect(questions[4].stem).toBe('他在做什么呢？');
      expect(questions[4].options).toEqual(['他在睡觉。', '他在吃饭。', '他在看书。', '他在写字。']);
      expect(questions[4].answer_idx).toBe(2); // C (red color)

      expect(questions[5].stem).toBe('你喜欢吃什么水果？');
      expect(questions[5].options).toEqual(['苹果', '米饭', '面条', '包子']);
      expect(questions[5].answer_idx).toBe(0); // A (red color)

      // Part 4: Word bank cloze questions
      expect(questions[6].stem).toBe('我非常____吃中国米饭。');
      expect(questions[6].options).toEqual(['多少', '听', '喜欢', '里', '怎么']);
      expect(questions[6].answer_idx).toBe(2); // C (喜欢)

      expect(questions[7].stem).toBe('他在房间____睡觉。');
      expect(questions[7].options).toEqual(['多少', '听', '喜欢', '里', '怎么']);
      expect(questions[7].answer_idx).toBe(3); // D (里)

      // 3. Verify detailed diagnostics via extractUploadedFileDetails
      const details = await extractUploadedFileDetails(docxBuf, 'full_4part_hsk.docx');
      expect(details.file_type).toBe('docx');
      expect(details.diagnostics?.detected_mode).toBe('docx_openxml_deep');
      expect(details.questions.length).toBe(8);
    });
  });

  describe('Scenario 2: Corrupt Zip, 0-byte Buffer, and Missing XML Edge Cases', () => {
    it('handles 0-byte buffer safely without throwing exceptions', async () => {
      const emptyBuf = Buffer.alloc(0);
      const text = extractDocxTextFromBuffer(emptyBuf);
      expect(text).toBe('');

      const parsed = await parseUploadedFileBuffer(emptyBuf, 'empty.docx');
      expect(parsed).toEqual([]);

      const details = await extractUploadedFileDetails(emptyBuf, 'empty.docx');
      expect(details.questions).toEqual([]);
      expect(details.raw_text).toBe('');
      expect(details.file_type).toBe('docx');
    });

    it('handles corrupt zip headers safely without crashing', async () => {
      // Buffer with partial PK signature but truncated header
      const truncatedBuf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
      const text1 = extractDocxTextFromBuffer(truncatedBuf);
      expect(text1).toBe('');

      const parsed1 = await parseUploadedFileBuffer(truncatedBuf, 'truncated.docx');
      expect(parsed1).toEqual([]);

      // Completely random non-zip binary garbage
      const garbageBuf = Buffer.from('Random non-zip binary garbage content representing corrupt download');
      const text2 = extractDocxTextFromBuffer(garbageBuf);
      // Fallback text decodes plain string
      expect(typeof text2).toBe('string');

      const parsed2 = await parseUploadedFileBuffer(garbageBuf, 'garbage.docx');
      expect(Array.isArray(parsed2)).toBe(true);
    });

    it('handles corrupt central directory or invalid deflated stream safely', async () => {
      // Craft a zip with invalid compressed data stream (deflate decompression error)
      const invalidDeflateBuf = Buffer.alloc(100);
      invalidDeflateBuf.writeUInt32LE(0x04034b50, 0); // Local header
      invalidDeflateBuf.writeUInt16LE(20, 4);
      invalidDeflateBuf.writeUInt16LE(8, 8); // comp method = 8 (deflate)
      invalidDeflateBuf.writeUInt32LE(20, 18); // comp size = 20
      invalidDeflateBuf.writeUInt32LE(50, 22); // uncomp size = 50
      invalidDeflateBuf.writeUInt16LE(17, 26); // fn length
      invalidDeflateBuf.write('word/document.xml', 30);
      // Fill compressed data with invalid non-deflate bytes
      invalidDeflateBuf.fill(0xff, 47, 67);

      const text = extractDocxTextFromBuffer(invalidDeflateBuf);
      expect(text).toBe('');

      const parsed = await parseUploadedFileBuffer(invalidDeflateBuf, 'bad_deflate.docx');
      expect(parsed).toEqual([]);
    });

    it('handles zip missing word/document.xml gracefully', async () => {
      // Valid PKZip structure containing only numbering.xml and [Content_Types].xml, but NO word/document.xml
      const missingDocXmlBuf = buildCustomDocxZip({
        '[Content_Types].xml': '<?xml version="1.0"?><Types></Types>',
        'word/numbering.xml': '<?xml version="1.0"?><w:numbering></w:numbering>',
      });

      const text = extractDocxTextFromBuffer(missingDocXmlBuf);
      expect(text).toBe('');

      const parsed = await parseUploadedFileBuffer(missingDocXmlBuf, 'no_document_xml.docx');
      expect(parsed).toEqual([]);

      const details = await extractUploadedFileDetails(missingDocXmlBuf, 'no_document_xml.docx');
      expect(details.questions).toEqual([]);
      expect(details.raw_text).toBe('');
    });
  });
});
