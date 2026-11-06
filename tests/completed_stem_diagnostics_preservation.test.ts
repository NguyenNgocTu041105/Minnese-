import { describe, it, expect } from 'vitest';
import { normalizeQuestionAliases } from '../src/server/llm/jsonParser.js';
import { validateQuestionLanguageQuality, validateCandidate } from '../src/server/llm/questionValidator.js';

describe('completed_stem Diagnostics & Model Fidelity Preservation', () => {
  it('does NOT overwrite model placeholder in completed_stem, allowing validator to catch the defect', () => {
    const rawModelOutput = {
      stem: '我想喝____。',
      completed_stem: '我想喝____。', // Model failed to substitute placeholder!
      options: ['水', '苹果', '飞机', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Đáp án đúng: 水 (nước).',
    };

    const parsed = normalizeQuestionAliases(rawModelOutput, 1, 'reading', false);
    expect(parsed).not.toBeNull();

    // 1. Raw completed_stem is preserved with the model's placeholder
    expect(parsed!.raw_completed_stem).toBe('我想喝____。');

    // 2. Deterministic canonical completed stem is computed and populated in completed_stem
    expect(parsed!.canonical_completed_stem).toBe('我想喝水。');
    expect(parsed!.completed_stem).toBe('我想喝水。');

    // 3. Validator correctly rejects the model's defect via raw_completed_stem
    const errors = validateQuestionLanguageQuality(parsed!);
    expect(errors.some((e) => e.includes('completed_stem contains unreplaced blank placeholder'))).toBe(true);
  });

  it('does NOT overwrite model hallucination in completed_stem, allowing validator to detect added words', () => {
    const rawModelOutput = {
      stem: '我想喝____。',
      completed_stem: '我想喝很多好喝的热茶水。', // Model added hallucinated words!
      options: ['水', '苹果', '飞机', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Đáp án đúng: 水 (nước).',
    };

    const parsed = normalizeQuestionAliases(rawModelOutput, 1, 'reading', false);
    expect(parsed).not.toBeNull();
    expect(parsed!.completed_stem).toBe('我想喝水。');
    expect(parsed!.raw_completed_stem).toBe('我想喝很多好喝的热茶水。');
    expect(parsed!.canonical_completed_stem).toBe('我想喝水。');

    const errors = validateQuestionLanguageQuality(parsed!);
    expect(errors.some((e) => e.includes('adds content beyond the exact answer_idx option substitution'))).toBe(true);
  });

  it('rejects when model completely omits completed_stem for fill-in-the-blank MCQ', () => {
    const rawModelOutput = {
      stem: '我想喝____。',
      // completed_stem omitted!
      options: ['水', '苹果', '飞机', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Đáp án đúng: 水 (nước).',
    };

    const parsed = normalizeQuestionAliases(rawModelOutput, 1, 'reading', false);
    expect(parsed).not.toBeNull();
    expect(parsed!.raw_completed_stem).toBeUndefined();
    expect(parsed!.canonical_completed_stem).toBe('我想喝水。');

    // When completed_stem is explicitly missing from candidate:
    const candidateWithoutCompleted = { ...parsed!, completed_stem: undefined };
    const errors = validateQuestionLanguageQuality(candidateWithoutCompleted);
    expect(errors.some((e) => e.includes('completed_stem is required'))).toBe(true);
  });

  it('handles reading comprehension short 3opt without forcing placeholder substitution', () => {
    const rawModelOutput = {
      stem: '今天天气很好，我和朋友一起去公园。★ 我们去哪里？',
      options: ['学校', '公园', '医院'],
      answer_idx: 1,
      level: 1,
      skill: 'reading',
      part_type: 'read_comprehension_short_3opt',
      explanation_vi: 'Đáp án đúng: 公园 (công viên).',
    };

    const parsed = normalizeQuestionAliases(rawModelOutput, 1, 'reading', false);
    expect(parsed).not.toBeNull();
    // For reading comprehension, stem itself is canonical
    expect(parsed!.canonical_completed_stem).toBe('今天天气很好，我和朋友一起去公园。★ 我们去哪里？');
    expect(parsed!.completed_stem).toBe('今天天气很好，我和朋友一起去公园。★ 我们去哪里？');
  });
});
