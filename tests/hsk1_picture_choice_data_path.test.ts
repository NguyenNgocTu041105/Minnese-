import { describe, expect, it } from 'vitest';
import { normalizeQuestionAliases } from '../src/server/llm/jsonParser.js';
import { validateCandidate } from '../src/server/llm/questionValidator.js';

describe('HSK 1 picture-choice question data path', () => {
  it('keeps options_images while normalizing a provider response', () => {
    const normalized = normalizeQuestionAliases({
      stem: '他正在做什么？',
      options: ['看书', '吃饭', '睡觉'],
      options_images: ['reading', 'rice', 'sleeping'],
      answer_idx: 0,
      explanation_vi: 'Người này đang đọc sách.',
      level: 1,
      skill: 'listening',
      part_type: 'listen_picture_match_3opt',
    });

    expect(normalized?.options_images).toEqual(['reading', 'rice', 'sleeping']);
  });

  it('rejects a 4-choice response where the HSK 1 blueprint requires six', () => {
    const result = validateCandidate({
      stem: '他们在哪里？',
      options: ['学校', '医院', '机场', '商店'],
      options_images: ['school', 'hospital', 'airport', 'shop'],
      answer_idx: 0,
      explanation_vi: '他们在学校。',
      level: 1,
      skill: 'reading',
      part_type: 'read_sentence_picture_match_6opt',
    });

    expect(result.errors.join(' ')).toMatch(/exactly 6 options|exactly 6 images/);
  });

  it('requires distinct supported image scenes aligned to every option', () => {
    const base = {
      stem: '他正在做什么？',
      options: ['看书', '吃饭', '睡觉'],
      answer_idx: 0,
      explanation_vi: 'Người này đang đọc sách.',
      level: 1,
      skill: 'listening' as const,
      part_type: 'listen_picture_match_3opt',
    };

    const repeated = validateCandidate({ ...base, options_images: ['reading', 'reading', 'sleeping'] });
    expect(repeated.errors.join(' ')).toContain('options_images must contain distinct image choices');

    const unsupported = validateCandidate({ ...base, options_images: ['reading', 'rice', 'not_a_scene'] });
    expect(unsupported.errors.join(' ')).toContain('unsupported SVG scene');

    const validImageBank = validateCandidate({ ...base, options_images: ['reading', 'rice', 'sleeping'] });
    expect(validImageBank.errors.join(' ')).not.toMatch(/options_images|illustration_theme/);
  });
});
