import { describe, expect, it } from 'vitest';
import { pinyin } from 'pinyin-pro';
import { buildQuestionResponseFormat } from '../src/server/llm/waterfallGenerator.js';
import { hasTerminalPunctuation, validateCandidate, validateQuestionLanguageQuality } from '../src/server/llm/questionValidator.js';
import { coherentHsk1Candidate, observedGroqCandidate } from './fixtures/question_language_quality.js';

describe('LLM question language-quality regression gates', () => {
  it('accepts a fixture whose completed_stem and pinyin exactly match the filled stem', () => {
    expect(validateQuestionLanguageQuality(coherentHsk1Candidate)).toEqual([]);
  });

  it('detects the observed Groq candidate completed-stem and pinyin mismatches, missing naturalness review, and truncation', () => {
    const errors = validateQuestionLanguageQuality(observedGroqCandidate);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('pinyin does not match'),
      expect.stringContaining('naturalness_review must explicitly pass'),
      expect.stringContaining('completed_stem adds content'),
      expect.stringContaining('must end with terminal punctuation'),
    ]));
  });

  it('rejects a naturalness self-review that flags the completed sentence as awkward', () => {
    const candidate = {
      ...coherentHsk1Candidate,
      naturalness_review: { status: 'unnatural' as const, rationale_vi: 'Thiếu thành phần ngữ pháp.' },
    };
    expect(validateQuestionLanguageQuality(candidate)).toContain(
      'naturalness_review must explicitly pass the completed sentence as natural',
    );
  });

  it('requires completed_stem and rejects missing or wrong-answer explanations', () => {
    const missingCompleted = { ...coherentHsk1Candidate, completed_stem: undefined };
    expect(validateQuestionLanguageQuality(missingCompleted)).toContain(
      'completed_stem is required for multiple-choice Chinese questions',
    );

    const missingExplanation = { ...coherentHsk1Candidate, explanation_vi: '' };
    expect(validateQuestionLanguageQuality(missingExplanation)).toContain(
      'explanation_vi correct-answer section must identify the answer_idx option text',
    );

    const contradictingExplanation = {
      ...coherentHsk1Candidate,
      explanation_vi: [
        'Dịch nghĩa: Bữa tối hôm nay rất ngon.',
        '- Đáp án đúng là D (苹果), vì đó là lựa chọn phù hợp nhất.',
        '- Phân tích phương án nhiễu: 学校, 出租车, 苹果.',
      ].join('\n'),
    };
    expect(validateCandidate(contradictingExplanation).errors.some((error) => /contradicts answer_idx|designates distractor/i.test(error))).toBe(true);
  });

  it('rejects a completed_stem that adds a word absent from the stem and answer', () => {
    const candidate = {
      ...coherentHsk1Candidate,
      completed_stem: '今天的晚餐特别很好吃。',
    };
    expect(validateQuestionLanguageQuality(candidate)).toContain(
      'completed_stem adds content beyond the exact answer_idx option substitution',
    );
  });

  it('treats completed_stem punctuation as part of the exact stem mapping contract', () => {
    const candidate = { ...coherentHsk1Candidate, completed_stem: '今天的晚餐很好吃' };
    expect(validateQuestionLanguageQuality(candidate)).toContain(
      'completed_stem does not match stem with the answer_idx option inserted',
    );
  });

  it('requires literal answer substitution for the apple example and rejects added 很', () => {
    const candidate = appleCandidate('这个苹果好吃。');
    expect(validateQuestionLanguageQuality(candidate)).toEqual([]);

    const addedWord = appleCandidate('这个苹果很好吃。', pinyin('这个苹果很好吃。', { toneType: 'symbol' }));
    const errors = validateQuestionLanguageQuality(addedWord);
    expect(errors).toContain('completed_stem adds content beyond the exact answer_idx option substitution');
    expect(errors.some((error) => error.includes('pinyin does not match'))).toBe(true);
  });

  it('normalizes pinyin spacing and punctuation without ignoring tones or syllable sequence', () => {
    const expected = pinyin('这个苹果好吃。', { toneType: 'symbol' });
    const punctuationVariant = appleCandidate(expected.trim().replace(/\s+/gu, '   ').replace(/[。.!?]\s*$/u, '!'));
    expect(validateQuestionLanguageQuality(punctuationVariant).some((error) => error.includes('pinyin does not match'))).toBe(false);

    const missingSyllable = appleCandidate('这个苹果好吃。', 'zhè ge píng guǒ hǎo');
    expect(validateQuestionLanguageQuality(missingSyllable).some((error) => error.includes('pinyin does not match'))).toBe(true);

    const wrongTone = appleCandidate('这个苹果好吃。', expected.replace('hǎo', 'hào'));
    expect(validateQuestionLanguageQuality(wrongTone).some((error) => error.includes('pinyin does not match'))).toBe(true);

    const extraSyllable = appleCandidate('这个苹果好吃。', expected.replace('hǎo', 'hěn hǎo'));
    expect(validateQuestionLanguageQuality(extraSyllable).some((error) => error.includes('pinyin does not match'))).toBe(true);
  });

  it('requires every distractor to be explained and the explanation to end cleanly', () => {
    const candidate = {
      ...coherentHsk1Candidate,
      explanation_vi: coherentHsk1Candidate.explanation_vi
        .replace('(出租车)', '(车辆)')
        .replace(/\.$/u, ''),
    };
    const errors = validateQuestionLanguageQuality(candidate);
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('does not account for option C')]));
    expect(errors).toContain('explanation_vi must end with terminal punctuation');
  });

  it('accepts punctuation before supported Markdown or quote/bracket closers', () => {
    expect(hasTerminalPunctuation('Giải thích đã hoàn tất.**')).toBe(true);
    expect(hasTerminalPunctuation('Giải thích đã hoàn tất。)')).toBe(true);
    expect(hasTerminalPunctuation('> Giải thích đã hoàn tất!')).toBe(true);
  });

  it('rejects an explanation that stops mid-sentence without a terminal mark', () => {
    expect(hasTerminalPunctuation('Đáp án đúng vì câu này phù hợp với')).toBe(false);
    const candidate = { ...coherentHsk1Candidate, explanation_vi: 'Đáp án đúng vì câu này phù hợp với' };
    expect(validateQuestionLanguageQuality(candidate)).toContain('explanation_vi must end with terminal punctuation');
  });

  it('keeps the strict Groq response schema aligned with the quality gate contract', () => {
    const format: any = buildQuestionResponseFormat(1, 'reading', 'read_fill_blank_4opt', 1);
    const schema = format.json_schema.schema.properties.questions.items;
    expect(schema.required).toContain('completed_stem');
    expect(schema.properties.completed_stem.type).toBe('string');
    expect(schema.required).toContain('naturalness_review');
    expect(schema.properties.naturalness_review.properties.status.enum).toEqual(['natural', 'unnatural']);
  });

  it('applies language-quality failures to candidates rejected by the production validator when enabled', () => {
    const result = validateCandidate(observedGroqCandidate, [], { requireLanguageQuality: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('pinyin does not match')]));
  });
});

function appleCandidate(completed_stem: string, pinyinText = pinyin('这个苹果好吃。', { toneType: 'symbol' })) {
  return {
    stem: '这个苹果____。',
    options: ['漂亮', '大', '好吃', '贵'],
    answer_idx: 2,
    completed_stem,
    pinyin: pinyinText,
    explanation_vi: [
      'Dịch nghĩa: Quả táo này ngon.',
      '- Đáp án đúng: 好吃 mô tả hương vị của quả táo.',
      '- Phân tích phương án nhiễu:',
      '+ 漂亮 nói về vẻ ngoài.',
      '+ 大 nói về kích thước.',
      '+ 贵 nói về giá cả.',
      'Đây là lựa chọn phù hợp nhất.',
    ].join('\n'),
    level: 1,
    skill: 'reading' as const,
    part_type: 'read_fill_blank_4opt',
    naturalness_review: { status: 'natural' as const, rationale_vi: 'Câu đúng phép điền và tự nhiên.' },
  };
}
