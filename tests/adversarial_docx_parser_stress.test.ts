/**
 * tests/adversarial_docx_parser_stress.test.ts
 *
 * Empirical Adversarial Stress Suite for Milestone M2 Word (.docx) Parser:
 * 1. Multi-List Document Stress (5 consecutive questions, alternating/overlapping numIds, strict A-D options)
 * 2. Horizontal Options with Multi-Style Formatting (shading, themeColor, bCs, underline blanks in stem, multi-word options)
 * 3. Table Structure Stress (missing cells, merged cells, punctuated headers A:, B., mixed label headers STT | Câu | 题号)
 */

import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import {
  extractDocxTextFromBuffer,
  parseUploadedFileBuffer,
} from '../src/server/fileUploadParser.js';

/**
 * In-memory PKZip (.docx) builder helper.
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

describe('Adversarial M2 Word (.docx) Parser Empirical Challenge', () => {

  // =========================================================================
  // SCENARIO 1: Multi-List Document Stress
  // =========================================================================
  describe('Scenario 1: Multi-List Document Stress', () => {
    it('1A: 5 consecutive questions with alternating and overlapping numIds (1, 2, 3, 4, 5) strictly keep options A..D without leaking to E..Z', async () => {
      // 5 abstractNum definitions:
      // abstractNum 1: decimal (for stems)
      // abstractNum 2: upperLetter (for options)
      // abstractNum 3: decimal (for stems)
      // abstractNum 4: upperLetter (for options)
      // abstractNum 5: upperLetter (for options)
      const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:abstractNum w:abstractNumId="1">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:abstractNum w:abstractNumId="2">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:abstractNum w:abstractNumId="3">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:abstractNum w:abstractNumId="4">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:abstractNum w:abstractNumId="5">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%1."/></w:lvl>
          </w:abstractNum>
          <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
          <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
          <w:num w:numId="3"><w:abstractNumId w:val="3"/></w:num>
          <w:num w:numId="4"><w:abstractNumId w:val="4"/></w:num>
          <w:num w:numId="5"><w:abstractNumId w:val="5"/></w:num>
        </w:numbering>`;

      // Q1: stem numId 1, opt numId 2 (Answer: A bold)
      // Q2: stem numId 3, opt numId 4 (Answer: B bold)
      // Q3: stem numId 1, opt numId 2 (Answer: C bold) - Reuses numId 1 & 2!
      // Q4: stem numId 3, opt numId 5 (Answer: D bold) - Overlapping numId 3 & 5!
      // Q5: stem numId 1, opt numId 4 (Answer: A bold) - Overlapping numId 1 & 4!
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <!-- Question 1 -->
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>今天天气很好，我想去____。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>学校</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>医院</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>商店</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>饭店</w:t></w:r></w:p>

            <!-- Question 2 -->
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr></w:pPr><w:r><w:t>桌子上有两____书。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>个</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>本</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>杯</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>件</w:t></w:r></w:p>

            <!-- Question 3 -->
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>我想喝____水。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>吃</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>看</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>喝</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>写</w:t></w:r></w:p>

            <!-- Question 4 -->
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr></w:pPr><w:r><w:t>他坐____去中国。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="5"/></w:numPr></w:pPr><w:r><w:t>火车</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="5"/></w:numPr></w:pPr><w:r><w:t>出租车</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="5"/></w:numPr></w:pPr><w:r><w:t>公共汽车</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="5"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>飞机</w:t></w:r></w:p>

            <!-- Question 5 -->
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>我妈妈是____。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>老师</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>学生</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>医生</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>护士</w:t></w:r></w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({
        'word/document.xml': documentXml,
        'word/numbering.xml': numberingXml,
      });

      const extracted = extractDocxTextFromBuffer(zipBuf);
      // Strictly verify no leakage to E..Z in options:
      expect(extracted).not.toContain('E.');
      expect(extracted).not.toContain('F.');
      expect(extracted).not.toContain('G.');
      expect(extracted).not.toContain('H.');
      expect(extracted).not.toContain('I.');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'multi_list_stress.docx');
      expect(parsed.length).toBe(5);

      // Verify Question 1
      expect(parsed[0].stem).toContain('今天天气很好');
      expect(parsed[0].options).toEqual(['学校', '医院', '商店', '饭店']);
      expect(parsed[0].answer_idx).toBe(0); // A

      // Verify Question 2
      expect(parsed[1].stem).toContain('桌子上有两');
      expect(parsed[1].options).toEqual(['个', '本', '杯', '件']);
      expect(parsed[1].answer_idx).toBe(1); // B

      // Verify Question 3
      expect(parsed[2].stem).toContain('我想喝');
      expect(parsed[2].options).toEqual(['吃', '看', '喝', '写']);
      expect(parsed[2].answer_idx).toBe(2); // C

      // Verify Question 4
      expect(parsed[3].stem).toContain('他坐');
      expect(parsed[3].options).toEqual(['火车', '出租车', '公共汽车', '飞机']);
      expect(parsed[3].answer_idx).toBe(3); // D

      // Verify Question 5
      expect(parsed[4].stem).toContain('我妈妈是');
      expect(parsed[4].options).toEqual(['老师', '学生', '医生', '护士']);
      expect(parsed[4].answer_idx).toBe(0); // A
    });

    it('1B: Hierarchical lists using single numId with ilvl 0 (stem) and ilvl 1 (options) resets across 5 questions', async () => {
      const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:abstractNum w:abstractNumId="1">
            <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
            <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%2."/></w:lvl>
          </w:abstractNum>
          <w:num w:numId="10"><w:abstractNumId w:val="1"/></w:num>
        </w:numbering>`;

      let bodyXml = '';
      for (let q = 1; q <= 5; q++) {
        bodyXml += `
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>第 ${q} 题: 这是问题内容。</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>选项甲</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>选项乙</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>选项丙</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="10"/></w:numPr></w:pPr><w:r><w:t>选项丁</w:t></w:r></w:p>
        `;
      }

      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>${bodyXml}</w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({
        'word/document.xml': documentXml,
        'word/numbering.xml': numberingXml,
      });

      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).not.toContain('E.');
      expect(extracted).not.toContain('F.');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'hierarchical_5q.docx');
      expect(parsed.length).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(parsed[i].options).toEqual(['选项甲', '选项乙', '选项丙', '选项丁']);
        expect(parsed[i].answer_idx).toBe(2); // C
      }
    });

    it('1C: Explicit text stem ("Câu 1: ...") with numPr options when numbering.xml is missing or stripped', async () => {
      // No numbering.xml provided!
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 今天天气很好，我想去买书。</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>学校</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>书店</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>医院</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>饭馆</w:t></w:r></w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('A. 学校');
      expect(extracted).toContain('B. 书店');
      expect(extracted).toContain('[ĐÁP_ÁN: B]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'stem_text_options_numpr.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].options).toEqual(['学校', '书店', '医院', '饭馆']);
      expect(parsed[0].answer_idx).toBe(1); // B
    });
  });

  // =========================================================================
  // SCENARIO 2: Horizontal Options with Multi-Style Formatting
  // =========================================================================
  describe('Scenario 2: Horizontal Options with Multi-Style Formatting', () => {
    it('2A: Horizontal multi-word options with underline blanks in stem and bold multi-word answer', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Câu 1: 今天的天气非常好，我们大家决定去公园</w:t></w:r>
              <w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>        </w:t></w:r>
              <w:r><w:t>。</w:t></w:r>
            </w:p>
            <w:p>
              <w:r><w:t>A. </w:t></w:r>
              <w:r><w:rPr><w:b/></w:rPr><w:t>散步 拍 照片</w:t></w:r>
              <w:r><w:t>   B. 喝 两 杯 水   C. 看 一 个 电 影   D. 去 学 校 看 书</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('Câu 1: 今天的天气非常好，我们大家决定去公园____。');
      expect(extracted).toContain('[ĐÁP_ÁN: A]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'horizontal_multiword_bold.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].options[0]).toContain('散步 拍 照片');
      expect(parsed[0].answer_idx).toBe(0); // A
    });

    it('2B: Horizontal options with cell/text shading (<w:shd w:fill="FFFF00"/>) on multi-word Option C', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 他是一名非常优秀的____。</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 医院 医生   B. 饭店 厨师   </w:t></w:r>
              <w:r><w:rPr><w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/></w:rPr><w:t>C. 大学 汉语 老师   </w:t></w:r>
              <w:r><w:t>D. 公司 经理</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: C]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'horizontal_shd.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(2); // C
    });

    it('2C: Horizontal options with Complex Script Bold (<w:bCs/>) on multi-word Option B', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 下课以后，同学们一起去____。</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 机场 坐 飞机   </w:t></w:r>
              <w:r><w:rPr><w:bCs/></w:rPr><w:t>B. 操场 踢 足球   </w:t></w:r>
              <w:r><w:t>C. 教室 里 睡觉   D. 宿舍 看 电视</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: B]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'horizontal_bcs.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(1); // B
    });

    it('2D: Horizontal options with Theme Color (<w:color w:val="4F81BD" w:themeColor="accent1"/>)', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 请问去火车站怎么走？</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 往前走   B. 向左拐   C. 坐出租车   </w:t></w:r>
              <w:r><w:rPr><w:color w:val="2E75B6" w:themeColor="accent1"/></w:rPr><w:t>D. 一直往东走五百米</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: D]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'horizontal_themecolor.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(3); // D
    });

    it('2F: Horizontal options with pure themeColor attribute (<w:color w:themeColor="accent2"/> without explicit w:val)', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 请问去图书馆怎么走？</w:t></w:r></w:p>
            <w:p>
              <w:r><w:t>A. 往前走   </w:t></w:r>
              <w:r><w:rPr><w:color w:themeColor="accent2"/></w:rPr><w:t>B. 向左拐   </w:t></w:r>
              <w:r><w:t>C. 坐出租车   D. 坐地铁</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('[ĐÁP_ÁN: B]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'horizontal_pure_themecolor.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(1); // B
    });


    it('2E: Stem has bold keyword AND underline blank; Option C has shading + complex script bold; Option A, B, D have plain text', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Câu 1: 这里的风景非常</w:t></w:r>
              <w:r><w:rPr><w:b/></w:rPr><w:t>美丽</w:t></w:r>
              <w:r><w:t>，我们应该多买几</w:t></w:r>
              <w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>      </w:t></w:r>
              <w:r><w:t>回去。</w:t></w:r>
            </w:p>
            <w:p>
              <w:r><w:t>A. 本   B. 件   </w:t></w:r>
              <w:r><w:rPr><w:bCs/><w:shd w:val="clear" w:fill="E2EFDA"/></w:rPr><w:t>C. 张   </w:t></w:r>
              <w:r><w:t>D. 个</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('Câu 1: 这里的风景非常美丽，我们应该多买几____回去。');
      expect(extracted).toContain('[ĐÁP_ÁN: C]');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'combo_stem_and_opt_emp.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('这里的风景非常美丽，我们应该多买几____回去。');
      expect(parsed[0].options).toEqual(['本', '件', '张', '个']);
      expect(parsed[0].answer_idx).toBe(2); // C
    });
  });

  // =========================================================================
  // SCENARIO 3: Table Structure Stress
  // =========================================================================
  describe('Scenario 3: Table Structure Stress', () => {
    it('3A: Horizontal Word Bank table with punctuated headers (A:, B., C:, D., E:) parses words and downstream questions correctly', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>第四部分: 第 1 - 2 题</w:t></w:r></w:p>
            <w:p><w:r><w:t>Quy tắc: Chọn từ thích hợp trong bảng để điền vào chỗ trống.</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>A:</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B.</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C:</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>D.</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>E:</w:t></w:r></w:p></w:tc>
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

      const parsed = await parseUploadedFileBuffer(zipBuf, 'punctuated_headers_table.docx');
      expect(parsed.length).toBe(2);
      expect(parsed[0].options).toEqual(['多少', '听', '喜欢', '里', '怎么']);
      expect(parsed[0].answer_idx).toBe(2); // C
      expect(parsed[1].options).toEqual(['多少', '听', '喜欢', '里', '怎么']);
      expect(parsed[1].answer_idx).toBe(3); // D
    });

    it('3B: Bottom Answer Key Table with mixed multilingual label headers ("STT", "Câu", "Question")', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 我想去书店买两本汉语书。 A. 个 B. 杯 C. 本 D. 件</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 2: 他坐飞机去北京。 A. 火车 B. 飞机 C. 出租车 D. 自行车</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 3: 谢谢你的帮助！ A. 好的 B. 不客气 C. 没关系 D. 再见</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>STT | Câu | 题号</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>3</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>Đáp án / 答案</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('1. C');
      expect(extracted).toContain('2. B');
      expect(extracted).toContain('3. B');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'stt_dapan_key_table.docx');
      expect(parsed.length).toBe(3);
      expect(parsed[0].answer_idx).toBe(2); // C
      expect(parsed[1].answer_idx).toBe(1); // B
      expect(parsed[2].answer_idx).toBe(1); // B
    });

    it('3C: Bottom Answer Key Table where questions row has 5 items and answer row has 4 items (gracefully pairs matching items)', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Câu 1: 天气很热，我想____水。 A. 吃 B. 喝 C. 看 D. 写</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 2: 他坐____去北京。 A. 苹果 B. 书 C. 飞机 D. 水</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 3: 他是我的____。 A. 水 B. 老师 C. 吃 D. 热</w:t></w:r></w:p>
            <w:p><w:r><w:t>Câu 4: 昨天北京很____。 A. 冷 B. 热 C. 水 D. 大</w:t></w:r></w:p>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>3</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>4</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>5</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('1. B');
      expect(extracted).toContain('2. C');
      expect(extracted).toContain('3. B');
      expect(extracted).toContain('4. A');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'mismatched_row_counts_table.docx');
      expect(parsed.length).toBe(4);
      expect(parsed[0].answer_idx).toBe(1); // B
      expect(parsed[1].answer_idx).toBe(2); // C
      expect(parsed[2].answer_idx).toBe(1); // B
      expect(parsed[3].answer_idx).toBe(0); // A
    });

    it('3D: Question-per-row table with merged header cells (<w:gridSpan w:val="2"/>) does not crash and parses rows', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:tbl>
              <w:tr>
                <w:tc>
                  <w:tcPr><w:gridSpan w:val="2"/></w:tcPr>
                  <w:p><w:r><w:t>HSK Đề Thi Trắc Nghiệm</w:t></w:r></w:p>
                </w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Đáp án</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>他是我的____。</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>水</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>老师</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>吃</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>热</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('Câu 1: 他是我的____。');
      expect(extracted).toContain('B. 老师');
      expect(extracted).toContain('Đáp án: B');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'merged_cells_table.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('他是我的____。');
      expect(parsed[0].options).toEqual(['水', '老师', '吃', '热']);
      expect(parsed[0].answer_idx).toBe(1); // B
    });

    it('3E: Question-per-row table with standard header ("STT", "Câu", "A", "B", "C", "D", "Đáp án")', async () => {
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:tbl>
              <w:tr>
                <w:tc><w:p><w:r><w:t>STT</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Câu</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Đáp án</w:t></w:r></w:p></w:tc>
              </w:tr>
              <w:tr>
                <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>他是我的____。</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>水</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>老师</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>吃</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>热</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
              </w:tr>
            </w:tbl>
          </w:body>
        </w:document>`;

      const zipBuf = buildCustomDocxZip({ 'word/document.xml': documentXml });
      const extracted = extractDocxTextFromBuffer(zipBuf);
      expect(extracted).toContain('Câu 1: 他是我的____。');
      expect(extracted).toContain('B. 老师');
      expect(extracted).toContain('Đáp án: B');

      const parsed = await parseUploadedFileBuffer(zipBuf, 'standard_header_cau_table.docx');
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('他是我的____。');
      expect(parsed[0].answer_idx).toBe(1); // B
    });
  });
});
