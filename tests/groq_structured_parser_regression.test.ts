import { describe, expect, it } from 'vitest';
import { parseWithSelfRepair } from '../src/server/llm/jsonParser.js';
import { validateCandidate } from '../src/server/llm/questionValidator.js';
import { validGroqStructuredResponse } from './fixtures/groq_structured_responses.js';
import { buildQuestionResponseFormat } from '../src/server/llm/waterfallGenerator.js';
import { validateQuestionLanguageQuality } from '../src/server/llm/questionValidator.js';

const asJson = (value: unknown) => JSON.stringify(value);

describe('Groq structured response parser and validator contract', () => {
  it('parses the questions envelope without changing four options or answer index', async () => {
    const parsed = await parseWithSelfRepair(asJson(validGroqStructuredResponse), undefined, 1, 'reading', true);
    expect(parsed.questions).toHaveLength(1);
    expect(parsed.questions[0].options).toEqual(['学校', '医院', '机场', '商店']);
    expect(parsed.questions[0].completed_stem).toBe('小明今天去学校。');
    expect(parsed.questions[0].answer_idx).toBe(0);
    const validation = validateCandidate(parsed.questions[0]);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('keeps completed_stem in parser output and the same required strict schema contract', async () => {
    const format: any = buildQuestionResponseFormat(1, 'reading', 'read_fill_blank_4opt', 1);
    const required = format.json_schema.schema.properties.questions.items.required;
    const parsed = await parseWithSelfRepair(asJson(validGroqStructuredResponse), undefined, 1, 'reading', true);
    expect(required).toContain('completed_stem');
    expect(parsed.questions[0].completed_stem).toBe('小明今天去学校。');

    const missing = { ...parsed.questions[0], completed_stem: undefined };
    expect(validateQuestionLanguageQuality(missing)).toContain(
      'completed_stem is required for multiple-choice Chinese questions',
    );
  });

  it('rejects missing top-level questions envelope', async () => {
    await expect(parseWithSelfRepair(asJson(validGroqStructuredResponse.questions[0]), undefined, 1, 'reading', true))
      .rejects.toThrow('$.questions');
  });

  it.each([
    ['options object', { A: '学校', B: '医院', C: '机场', D: '商店' }],
    ['wrong option count', ['学校', '医院', '机场']],
  ])('does not normalize malformed %s into a valid four-option array', async (_label, options) => {
    const input = structuredQuestion({ options });
    const parsed = await parseWithSelfRepair(asJson(input), undefined, 1, 'reading', true);
    const errors = validateCandidate(parsed.questions[0]).errors;
    if (_label === 'options object') expect(errors).toContain('$.options must be an array (got object)');
    else expect(errors.some((e) => e.includes('Options must contain exactly 4 items'))).toBe(true);
  });

  it.each([
    ['missing', undefined],
    ['string', '1'],
    ['fractional', 1.5],
    ['negative', -1],
    ['above range', 4],
  ])('preserves invalid %s answer_idx for validator rejection', async (_label, answer_idx) => {
    const input = structuredQuestion({ answer_idx });
    const parsed = await parseWithSelfRepair(asJson(input), undefined, 1, 'reading', true);
    const errors = validateCandidate(parsed.questions[0]).errors;
    expect(errors.some((e) => e.includes('answer_idx'))).toBe(true);
    expect(parsed.questions[0].answer_idx).not.toBe(0);
  });

  it('preserves malformed option element types for structural rejection without crashing', async () => {
    const parsed = await parseWithSelfRepair(asJson(structuredQuestion({ options: ['学校', 7, '机场', '商店'] })), undefined, 1, 'reading', true);
    expect(() => validateCandidate(parsed.questions[0])).not.toThrow();
    expect(validateCandidate(parsed.questions[0]).errors).toContain('options[1] must be a non-empty string (got number)');
  });
});

function structuredQuestion(overrides: Record<string, unknown>) {
  return { questions: [{ ...validGroqStructuredResponse.questions[0], ...overrides }] };
}
