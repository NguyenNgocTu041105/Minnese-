import { describe, it, expect } from 'vitest';
import { getUnifiedVocabularyList } from '../src/utils/vocabStorage';
import { FULL_HSK_SYLLABUS_VOCAB } from '../src/data/fullHskSyllabusVocab';

describe('Dictionary Full HSK 1-6 Vocabulary Suite', () => {
  it('loads full syllabus vocabulary with at least 5,334 headwords', () => {
    expect(FULL_HSK_SYLLABUS_VOCAB.length).toBeGreaterThanOrEqual(5334);
  });

  it('contains comprehensive vocabulary across all 6 HSK levels in getUnifiedVocabularyList', () => {
    const allVocab = getUnifiedVocabularyList();
    expect(allVocab.length).toBeGreaterThanOrEqual(5334);

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const w of allVocab) {
      if (w.hskLevel >= 1 && w.hskLevel <= 6) {
        counts[w.hskLevel]++;
      }
    }

    expect(counts[1]).toBeGreaterThanOrEqual(300);
    expect(counts[2]).toBeGreaterThanOrEqual(197);
    expect(counts[3]).toBeGreaterThanOrEqual(491);
    expect(counts[4]).toBeGreaterThanOrEqual(990);
    expect(counts[5]).toBeGreaterThanOrEqual(1579);
    expect(counts[6]).toBeGreaterThanOrEqual(1777);
  });

  it('guarantees every vocabulary item has valid hanzi, pinyin, hanViet, and vietnamese definition', () => {
    const allVocab = getUnifiedVocabularyList();
    for (const w of allVocab) {
      expect(w.hanzi).toBeDefined();
      expect(w.hanzi.trim().length).toBeGreaterThan(0);
      expect(w.pinyin).toBeDefined();
      expect(w.pinyin.trim().length).toBeGreaterThan(0);
      expect(w.hanViet).toBeDefined();
      expect(w.hanViet!.trim().length).toBeGreaterThan(0);
      expect(w.vietnamese).toBeDefined();
      expect(w.vietnamese!.trim().length).toBeGreaterThan(0);
      expect(w.hskLevel).toBeGreaterThanOrEqual(1);
      expect(w.hskLevel).toBeLessThanOrEqual(6);
    }
  });

  it('has zero duplicate IDs in the unified list', () => {
    const allVocab = getUnifiedVocabularyList();
    const seen = new Set<string>();
    for (const w of allVocab) {
      expect(seen.has(w.id)).toBe(false);
      seen.add(w.id);
    }
  });

  it('correctly resolves key vocabulary across HSK 1 to 6', () => {
    const allVocab = getUnifiedVocabularyList();
    const map = new Map(allVocab.map((w) => [w.hanzi, w]));

    // HSK 1
    const nihao = map.get('你好');
    expect(nihao).toBeDefined();
    expect(nihao!.hskLevel).toBe(1);

    // HSK 2
    const wan = map.get('万');
    expect(wan).toBeDefined();
    expect(wan!.hskLevel).toBe(2);
    expect(wan!.hanViet).toBe('Vạn');

    // HSK 3
    const yigong = map.get('一共');
    expect(yigong).toBeDefined();
    expect(yigong!.hskLevel).toBe(3);

    // HSK 4
    const falv = map.get('法律');
    expect(falv).toBeDefined();
    expect(falv!.hskLevel).toBe(4);

    // HSK 5
    const yidai = map.get('一代');
    expect(yidai).toBeDefined();
    expect(yidai!.hskLevel).toBe(5);

    // HSK 6
    const yiyi = map.get('一一');
    expect(yiyi).toBeDefined();
    expect(yiyi!.hskLevel).toBe(6);
  });
});
