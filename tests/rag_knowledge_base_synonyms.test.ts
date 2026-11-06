/**
 * Verification Test Suite: R3 RAG Knowledge Base Short-Tag Collision & Cross-Language Synonym Map
 *
 * Mandated Test Cases from ORIGINAL_REQUEST.md Section 5.4:
 * 1. Query "biến điệu thanh 3" returns at least one document related to tone sandhi (`rag-tones-sandhi`).
 * 2. Query "từ vựng HSK 3" (or "từ vựng") returns vocabulary-related document (e.g. `rag-grammar-measure-words-all`).
 * 3. Short words ("làm sao để học", "đề thi khó không", "chuẩn bị thi", "hôm nay bị ốm", "ba mẹ em", "hẹn thứ ba", "học bù")
 *    do NOT produce false positive collisions on `de`, `bi`, `ba`, `bu`.
 * 4. English queries (`tone sandhi`, `measure words`, `grammar`, `pronunciation`) continue to work as expected.
 * 5. Vietnamese queries with diacritics are normalized properly.
 * 6. A document is not returned multiple times even when multiple synonyms match.
 * 7. Existing standard RAG queries preserve reasonable ranking and scores.
 */

import { describe, it, expect } from 'vitest';
import {
  queryKnowledgeBase,
  removeVietnameseTones,
  containsWord,
  SEMANTIC_TERM_SYNONYMS,
  INITIAL_RAG_DOCUMENTS,
  VIETNAMESE_STOP_WORDS
} from '../src/data/ragKnowledgeBase';

describe('R3 RAG Knowledge Base Short-Tag Collision & Cross-Language Synonyms Suite', () => {
  // =========================================================================
  // TEST CASE 1: Query "biến điệu thanh 3" returns tone sandhi document
  // =========================================================================
  describe('Case 1: Tone Sandhi & Multi-space Queries', () => {
    it('should return rag-tones-sandhi as the top match for "biến điệu thanh 3"', () => {
      const results = queryKnowledgeBase('biến điệu thanh 3');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-tones-sandhi');
      expect(results[0].category).toBe('tones');
    });

    it('should normalize multiple whitespace characters in "biến    điệu   thanh   3"', () => {
      const results = queryKnowledgeBase('biến    điệu   thanh   3');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-tones-sandhi');
    });

    it('should retrieve rag-tones-sandhi for "biến điệu" and "thanh 3"', () => {
      const res1 = queryKnowledgeBase('biến điệu');
      expect(res1.some((d) => d.id === 'rag-tones-sandhi')).toBe(true);

      const res2 = queryKnowledgeBase('thanh 3');
      expect(res2.some((d) => d.id === 'rag-tones-sandhi')).toBe(true);
    });
  });

  // =========================================================================
  // TEST CASE 2: Query "từ vựng HSK 3" or "từ vựng" returns vocabulary document
  // =========================================================================
  describe('Case 2: Vocabulary Queries', () => {
    it('should return rag-grammar-measure-words-all as top match for "từ vựng HSK 3"', () => {
      const results = queryKnowledgeBase('từ vựng HSK 3');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-measure-words-all');
      expect(results[0].category).toBe('vocabulary');
    });

    it('should return vocabulary/chengyu documents for query "từ vựng"', () => {
      const results = queryKnowledgeBase('từ vựng');
      expect(results.length).toBeGreaterThan(0);
      const docIds = results.map((d) => d.id);
      expect(docIds).toContain('rag-grammar-measure-words-all');
      expect(docIds).toContain('rag-chengyu-hsk45');
    });

    it('should return rag-grammar-measure-words-all for "lượng từ"', () => {
      const results = queryKnowledgeBase('lượng từ');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-measure-words-all');
    });

    it('should return rag-chengyu-hsk45 for "thành ngữ"', () => {
      const results = queryKnowledgeBase('thành ngữ');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-chengyu-hsk45');
    });
  });

  // =========================================================================
  // TEST CASE 3: Short-Word False Positive Collision Prevention
  // =========================================================================
  describe('Case 3: Short-Word False Positive Collision Prevention (de, bi, ba, bu)', () => {
    // 3.1 Tag "de" collisions (Vietnamese "để", "đề", "dễ")
    it('should NOT falsely match tag "de" on "làm sao để học"', () => {
      const results = queryKnowledgeBase('làm sao để học');
      expect(results.some((d) => d.id === 'rag-grammar-de-particles')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "de" on "làm sao để học tốt tiếng Trung"', () => {
      const results = queryKnowledgeBase('làm sao để học tốt tiếng Trung');
      expect(results.some((d) => d.id === 'rag-grammar-de-particles')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "de" on "đề thi khó không"', () => {
      const results = queryKnowledgeBase('đề thi khó không');
      expect(results.some((d) => d.id === 'rag-grammar-de-particles')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "de" on "đề thi HSK khó không"', () => {
      const results = queryKnowledgeBase('đề thi HSK khó không');
      expect(results.some((d) => d.id === 'rag-grammar-de-particles')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "de" on "ngữ pháp này rất dễ hiểu"', () => {
      const results = queryKnowledgeBase('ngữ pháp này rất dễ hiểu');
      expect(results.some((d) => d.id === 'rag-grammar-de-particles')).toBe(false);
      expect(results.length).toBe(0);
    });

    // 3.2 Tag "bi" collisions (Vietnamese "chuẩn bị", "bị ốm")
    it('should NOT falsely match tag "bi" on "chuẩn bị thi"', () => {
      const results = queryKnowledgeBase('chuẩn bị thi');
      expect(results.some((d) => d.id === 'rag-grammar-comparisons-complete')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "bi" on "chuẩn bị thi HSK"', () => {
      const results = queryKnowledgeBase('chuẩn bị thi HSK');
      expect(results.some((d) => d.id === 'rag-grammar-comparisons-complete')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "bi" on "hôm nay bị ốm"', () => {
      const results = queryKnowledgeBase('hôm nay bị ốm');
      expect(results.some((d) => d.id === 'rag-grammar-comparisons-complete')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "bi" on "hôm nay em bị ốm xin nghỉ"', () => {
      const results = queryKnowledgeBase('hôm nay em bị ốm xin nghỉ');
      expect(results.some((d) => d.id === 'rag-grammar-comparisons-complete')).toBe(false);
      expect(results.length).toBe(0);
    });

    // 3.3 Tag "ba" collisions (Vietnamese "ba mẹ", "thứ ba")
    it('should NOT falsely match tag "ba" on "ba mẹ em"', () => {
      const results = queryKnowledgeBase('ba mẹ em');
      expect(results.some((d) => d.id === 'rag-grammar-ba-structure')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "ba" on "ba mẹ em đi làm"', () => {
      const results = queryKnowledgeBase('ba mẹ em đi làm');
      expect(results.some((d) => d.id === 'rag-grammar-ba-structure')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "ba" on "hẹn thứ ba"', () => {
      const results = queryKnowledgeBase('hẹn thứ ba');
      expect(results.some((d) => d.id === 'rag-grammar-ba-structure')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "ba" on "hẹn gặp lại vào thứ ba"', () => {
      const results = queryKnowledgeBase('hẹn gặp lại vào thứ ba');
      expect(results.some((d) => d.id === 'rag-grammar-ba-structure')).toBe(false);
      expect(results.length).toBe(0);
    });

    // 3.4 Tag "bu" collisions (Vietnamese "học bù")
    it('should NOT falsely match tag "bu" on "học bù"', () => {
      const results = queryKnowledgeBase('học bù');
      expect(results.some((d) => d.id === 'rag-tones-sandhi')).toBe(false);
      expect(results.length).toBe(0);
    });

    it('should NOT falsely match tag "bu" on "học bù ngày mai"', () => {
      const results = queryKnowledgeBase('học bù ngày mai');
      expect(results.some((d) => d.id === 'rag-tones-sandhi')).toBe(false);
      expect(results.length).toBe(0);
    });
  });

  // =========================================================================
  // TEST CASE 4: English Cross-Language Queries
  // =========================================================================
  describe('Case 4: English Cross-Language Queries', () => {
    it('should return rag-tones-sandhi for "tone sandhi"', () => {
      const results = queryKnowledgeBase('tone sandhi');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-tones-sandhi');
    });

    it('should return rag-tones-sandhi for "third tone sandhi"', () => {
      const results = queryKnowledgeBase('third tone sandhi');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-tones-sandhi');
    });

    it('should return rag-grammar-measure-words-all for "measure words"', () => {
      const results = queryKnowledgeBase('measure words');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-measure-words-all');
    });

    it('should return vocabulary documents for "vocabulary"', () => {
      const results = queryKnowledgeBase('vocabulary');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-measure-words-all');
    });

    it('should return grammar documents for "grammar"', () => {
      const results = queryKnowledgeBase('grammar');
      expect(results.length).toBeGreaterThan(0);
      const categories = results.map((d) => d.category);
      expect(categories.every((c) => c === 'grammar')).toBe(true);
    });

    it('should return rag-tones-sandhi for "pronunciation"', () => {
      const results = queryKnowledgeBase('pronunciation');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-tones-sandhi');
    });

    it('should return rag-grammar-bei-passive for "passive"', () => {
      const results = queryKnowledgeBase('passive');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-bei-passive');
    });

    it('should return rag-grammar-comparisons-complete for "comparison"', () => {
      const results = queryKnowledgeBase('comparison');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-comparisons-complete');
    });

    it('should return rag-grammar-complements-hsk for "complements"', () => {
      const results = queryKnowledgeBase('complements');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-complements-hsk');
    });

    it('should return rag-grammar-complex-sentences for "conjunctions"', () => {
      const results = queryKnowledgeBase('conjunctions');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-complex-sentences');
    });

    it('should return rag-grammar-ba-structure for "ba sentence"', () => {
      const results = queryKnowledgeBase('ba sentence');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-ba-structure');
    });
  });

  // =========================================================================
  // TEST CASE 5: Vietnamese Diacritics Normalization & Case Sensitivity
  // =========================================================================
  describe('Case 5: Vietnamese Diacritics Normalization & Case Insensitivity', () => {
    it('should match UPPERCASE query "CÂU CHỮ BA" to rag-grammar-ba-structure', () => {
      const results = queryKnowledgeBase('CÂU CHỮ BA');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-ba-structure');
    });

    it('should match "câu chữ bị" and "bị động" to rag-grammar-bei-passive', () => {
      const res1 = queryKnowledgeBase('câu chữ bị');
      expect(res1[0]?.id).toBe('rag-grammar-bei-passive');

      const res2 = queryKnowledgeBase('bị động');
      expect(res2[0]?.id).toBe('rag-grammar-bei-passive');
    });

    it('should match "câu so sánh" and "so sánh" to rag-grammar-comparisons-complete', () => {
      const res1 = queryKnowledgeBase('câu so sánh');
      expect(res1[0]?.id).toBe('rag-grammar-comparisons-complete');

      const res2 = queryKnowledgeBase('so sánh');
      expect(res2[0]?.id).toBe('rag-grammar-comparisons-complete');
    });

    it('should match "bổ ngữ" to rag-grammar-complements-hsk', () => {
      const results = queryKnowledgeBase('bổ ngữ');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-complements-hsk');
    });

    it('should match "liên từ" to rag-grammar-complex-sentences', () => {
      const results = queryKnowledgeBase('liên từ');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-complex-sentences');
    });

    it('should correctly remove Vietnamese tones via removeVietnameseTones()', () => {
      expect(removeVietnameseTones('Tiếng Việt')).toBe('Tieng Viet');
      expect(removeVietnameseTones('biến điệu thanh điệu')).toBe('bien dieu thanh dieu');
      expect(removeVietnameseTones('Đồng bằng')).toBe('Dong bang');
      expect(removeVietnameseTones('để ý')).toBe('de y');
    });
  });

  // =========================================================================
  // TEST CASE 6: Deduplication & Score Stability
  // =========================================================================
  describe('Case 6: Deduplication & Score Stability', () => {
    it('should not contain duplicate documents in returned array', () => {
      // Query that hits multiple synonyms
      const results = queryKnowledgeBase('biến điệu thanh 3 tone sandhi pinyin', 10);
      const ids = results.map((d) => d.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should strictly respect the limit parameter', () => {
      const res1 = queryKnowledgeBase('grammar', 2);
      expect(res1.length).toBeLessThanOrEqual(2);

      const res2 = queryKnowledgeBase('từ vựng', 1);
      expect(res2.length).toBe(1);
    });

    it('should maintain stable scores without uncontrolled inflation', () => {
      const resultsSingle = queryKnowledgeBase('tone sandhi', 1);
      const resultsMulti = queryKnowledgeBase('bien dieu thanh 3 tone sandhi thanh ba', 1);

      expect(resultsSingle[0].id).toBe('rag-tones-sandhi');
      expect(resultsMulti[0].id).toBe('rag-tones-sandhi');
    });
  });

  // =========================================================================
  // TEST CASE 7: Standard RAG Baseline Queries & Edge Cases
  // =========================================================================
  describe('Case 7: Standard Baseline Queries, Hanzi & Edge Cases', () => {
    it('should match single Hanzi "把" to rag-grammar-ba-structure', () => {
      const results = queryKnowledgeBase('把');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-ba-structure');
    });

    it('should match single Hanzi "被" to rag-grammar-bei-passive', () => {
      const results = queryKnowledgeBase('被');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-bei-passive');
    });

    it('should match single Hanzi "比" to rag-grammar-comparisons-complete', () => {
      const results = queryKnowledgeBase('比');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-comparisons-complete');
    });

    it('should match single Hanzi "的" to rag-grammar-de-particles', () => {
      const results = queryKnowledgeBase('的');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-de-particles');
    });

    it('should match single Hanzi "得" to rag-grammar-de-particles', () => {
      const results = queryKnowledgeBase('得');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-de-particles');
    });

    it('should match single Hanzi "地" to rag-grammar-de-particles', () => {
      const results = queryKnowledgeBase('地');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rag-grammar-de-particles');
    });

    it('should return [] for pure conversational stop words', () => {
      const results = queryKnowledgeBase('chào cô giáo em muốn học một bài mới hôm nay');
      expect(results.length).toBe(0);
    });

    it('should return [] safely for empty, whitespace, and punctuation queries', () => {
      expect(queryKnowledgeBase('')).toEqual([]);
      expect(queryKnowledgeBase('   \t\n  ')).toEqual([]);
      expect(queryKnowledgeBase('!@#$%^&*()_+~`{}[]:;"\'<>,.?/')).toEqual([]);
    });

    it('should execute huge 10,000-character queries safely without crash', () => {
      const hugeQuery = 'học tiếng Trung '.repeat(625);
      const t0 = performance.now();
      const results = queryKnowledgeBase(hugeQuery);
      const duration = performance.now() - t0;

      expect(Array.isArray(results)).toBe(true);
      expect(duration).toBeLessThan(100);
    });

    it('should accurately test containsWord unicode boundaries', () => {
      expect(containsWord('câu chữ ba', 'ba')).toBe(true);
      expect(containsWord('bản đồ', 'ba')).toBe(false);
      expect(containsWord('3 chữ de', 'de')).toBe(true);
      expect(containsWord('đẹp lắm', 'de')).toBe(false);
      expect(containsWord('câu so sánh bi', 'bi')).toBe(true);
      expect(containsWord('chuẩn bị', 'bi')).toBe(false); // "bị" !== "bi"
    });
  });
});
