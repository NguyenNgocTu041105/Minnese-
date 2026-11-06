import { describe, expect, it } from 'vitest';
import { pinyin } from 'pinyin-pro';
import { validateCandidate, validateQuestionLanguageQuality } from '../src/server/llm/questionValidator.js';
import { parseWithSelfRepair } from '../src/server/llm/jsonParser.js';
import { buildQuestionResponseFormat } from '../src/server/llm/waterfallGenerator.js';
import { describeValidationIssue } from '../src/server/llm/validationDiagnostics.js';

const rationale = (option_idx: number, option_text: string, rationale_vi: string) => ({ option_idx, option_text, rationale_vi });

function candidate(overrides: Record<string, unknown> = {}): any {
  const stem = '我去____看病。';
  const completed_stem = '我去医院看病。';
  const options = ['医院', '学校', '机场', '商店'];
  return {
    stem,
    completed_stem,
    options,
    answer_idx: 0,
    pinyin: pinyin(completed_stem, { toneType: 'symbol' }),
    explanation_summary_vi: 'Người nói đến một địa điểm để khám bệnh.',
    answer_rationale_vi: '医院 là nơi khám bệnh trong ngữ cảnh này.',
    distractor_rationales: [
      rationale(1, '学校', '学校 là nơi học tập, không phải nơi khám bệnh.'),
      rationale(2, '机场', '机场 là nơi đi máy bay, không phải nơi khám bệnh.'),
      rationale(3, '商店', '商店 là nơi mua bán, không phải nơi khám bệnh.'),
    ],
    level: 1,
    skill: 'reading' as const,
    part_type: 'read_fill_blank_4opt',
    naturalness_review: { status: 'natural' as const, rationale_vi: 'Câu hoàn chỉnh tự nhiên và đủ thành phần.' },
    explanation_vi: 'Dịch nghĩa: Người nói đến bệnh viện để khám bệnh.\n- Đáp án đúng: 医院 là nơi khám bệnh trong ngữ cảnh này.\n- Phân tích phương án nhiễu:\n  + Phương án B (学校): 学校 là nơi học tập, không phải nơi khám bệnh.\n  + Phương án C (机场): 机场 là nơi đi máy bay, không phải nơi khám bệnh.\n  + Phương án D (商店): 商店 là nơi mua bán, không phải nơi khám bệnh.',
    ...overrides,
  };
}

describe('real question quality and indexed rationale contract', () => {
  it('rejects the observed ungrammatical demonstrative noun phrase', () => {
    const errors = validateQuestionLanguageQuality({
      ...candidate(),
      stem: '这____很好吃。',
      options: ['苹果', '医院', '西瓜', '出租车'],
      answer_idx: 0,
      completed_stem: '这苹果很好吃。',
      pinyin: pinyin('这苹果很好吃。', { toneType: 'symbol' }),
    });
    expect(errors).toContain('completed_stem has a likely missing Mandarin classifier after demonstrative');
  });

  it('routes an underspecified stem with interchangeable fruit answers to human review', () => {
    const q = candidate({
      stem: '这个____很好吃。',
      completed_stem: '这个苹果很好吃。',
      options: ['苹果', '医院', '西瓜', '出租车'],
      answer_idx: 0,
      pinyin: pinyin('这个苹果很好吃。', { toneType: 'symbol' }),
      explanation_summary_vi: 'Loại quả này có vị ngon.',
      answer_rationale_vi: '苹果 là loại quả phù hợp.',
      distractor_rationales: [
        rationale(1, '医院', '医院 là cơ sở khám chữa bệnh, không phải loại quả.'),
        rationale(2, '西瓜', '西瓜 cũng là loại quả có thể ăn và ngon trong câu này.'),
        rationale(3, '出租车', '出租车 là phương tiện đi lại, không phải loại quả.'),
      ],
      explanation_vi: 'Dịch nghĩa: Loại quả này ngon.\n- Đáp án đúng: 苹果 là loại quả phù hợp.\n- Phân tích phương án nhiễu:\n  + Phương án B (医院): 医院 là cơ sở khám chữa bệnh, không phải quả.\n  + Phương án C (西瓜): 西瓜 cũng là loại quả có thể ăn và ngon trong câu này.\n  + Phương án D (出租车): 出租车 là phương tiện đi lại, không phải quả.',
    });
    const result = validateCandidate(q, [], { requireLanguageQuality: true, requireDistractorRationales: true });
    expect(result.errors).toEqual([]);
    expect(result.actionRecommendation).toBe('needs_admin_review');
    expect(result.warnings.some((warning) => warning.includes('potential answer ambiguity'))).toBe(true);
  });

  it('rejects a rationale whose indexed option text and rationale vocabulary disagree', () => {
    const q = candidate({
      distractor_rationales: [
        rationale(1, '学校', '学校是学习的地方，不是医院。'),
        rationale(2, '西瓜', '香蕉不是医院，不能用于看病。'),
        rationale(3, '商店', '商店是购物的地方，不是医院。'),
      ],
    });
    const errors = validateCandidate(q, [], { requireDistractorRationales: true }).errors;
    expect(errors.some((error) => error.includes('rationale_vi must identify its indexed option text'))).toBe(true);
    expect(errors.some((error) => error.includes('rationale_vi mentions a different option text'))).toBe(true);
    expect(describeValidationIssue(errors.find((error) => error.includes('distractor_rationales'))!).code).toBe('distractor_rationale');
  });

  it('rejects missing, duplicate, and correct-answer rationales', () => {
    const base = candidate();
    const missing = validateCandidate({ ...base, distractor_rationales: base.distractor_rationales.slice(0, 2) }, [], { requireDistractorRationales: true });
    expect(missing.errors.some((error) => error.includes('missing option index 3'))).toBe(true);
    const duplicate = validateCandidate({ ...base, distractor_rationales: [base.distractor_rationales[0], base.distractor_rationales[0], base.distractor_rationales[2]] }, [], { requireDistractorRationales: true });
    expect(duplicate.errors.some((error) => error.includes('duplicates another'))).toBe(true);
    const correct = validateCandidate({ ...base, distractor_rationales: [rationale(0, '医院', '医院是看病的地方。'), ...base.distractor_rationales.slice(1)] }, [], { requireDistractorRationales: true });
    expect(correct.errors.some((error) => error.includes('must not reference the correct answer'))).toBe(true);
  });

  it('parses and formats actual option labels from indexed data, while enforcing the same strict schema', async () => {
    const raw = candidate();
    const response = { questions: [{ ...raw, options_images: [], illustration_theme: null, topic: null, difficulty_tier: 'tier1_difficult', trap_type: 'context_scope', target_grammar: '地点词', target_vocabulary: '医院' }] };
    const parsed = await parseWithSelfRepair(JSON.stringify(response), undefined, 1, 'reading', true);
    expect(parsed.questions[0].explanation_vi).toContain('Phương án B (学校)');
    expect(parsed.questions[0].explanation_vi).toContain('Phương án C (机场)');
    expect(parsed.questions[0].explanation_vi).toContain('Phương án D (商店)');
    const validation = validateCandidate(parsed.questions[0], [], { requireLanguageQuality: true, requireDistractorRationales: true });
    expect(validation.errors).toEqual([]);
    const schema: any = buildQuestionResponseFormat(1, 'reading', 'read_fill_blank_4opt', 1).json_schema.schema.properties.questions.items;
    expect(schema.properties.distractor_rationales.items.required).toEqual(['option_idx', 'option_text', 'rationale_vi']);
    expect(schema.properties).not.toHaveProperty('explanation_vi');
    expect(schema.properties).toHaveProperty('explanation_summary_vi');
  });

  it('distinguishes complete markdown explanations from genuine truncation', () => {
    expect(validateQuestionLanguageQuality({ ...candidate(), explanation_vi: 'Giải thích đầy đủ. **' }).some((e) => e.includes('terminal punctuation'))).toBe(false);
    expect(validateQuestionLanguageQuality({ ...candidate(), explanation_vi: 'Phương án D không phù hợp vì' }).some((e) => e.includes('terminal punctuation'))).toBe(true);
    expect(validateQuestionLanguageQuality({ ...candidate(), explanation_vi: 'Giải thích.\n- Đáp án đúng: 医院 phù hợp.\n- Phân tích phương án nhiễu:\n  + Phương án B (学校) không phù hợp.\n  + Phương án C (机场) không phù hợp.' }).some((e) => e.includes('option D'))).toBe(true);
  });
});
