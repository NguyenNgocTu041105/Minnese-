import { describe, expect, it } from 'vitest';
import { describeValidationIssue, summarizeCandidateIssues } from '../src/server/llm/validationDiagnostics.js';
import { validateCandidate } from '../src/server/llm/questionValidator.js';
import { observedGroqCandidate } from './fixtures/question_language_quality.js';

describe('validation diagnostic and rejection-summary consistency', () => {
  it('derives rejection buckets from the same candidate-level issue records', () => {
    const validation = validateCandidate({
      ...observedGroqCandidate,
      answer_idx: '1' as unknown as number,
      completed_stem: undefined,
      options: ['学校', '好吃', '出租车'],
    }, [], { requireLanguageQuality: true });
    const missingCompleted = validateCandidate({
      ...observedGroqCandidate,
      answer_idx: 1,
      completed_stem: undefined,
    }, [], { requireLanguageQuality: true });
    const issues = [...validation.errors, ...missingCompleted.errors].map(describeValidationIssue);
    const rejectedReasons = summarizeCandidateIssues(issues);

    expect(issues.every((issue) => issue.path && issue.code && issue.message)).toBe(true);
    expect(issues.some((issue) => issue.path === '$.answer_idx' && issue.code === 'answer_index')).toBe(true);
    expect(issues.some((issue) => issue.path === '$.completed_stem')).toBe(true);
    expect(Object.values(rejectedReasons).reduce((sum, count) => sum + count, 0)).toBe(issues.length);
    expect(rejectedReasons['Lỗi chỉ số answer_idx']).toBeGreaterThan(0);
  });

  it('does not classify explanation-only errors as answer-index or schema errors', () => {
    const explanationErrors = [
      'explanation_vi correct-answer section must identify the answer_idx option text',
      'explanation_vi must end with terminal punctuation',
    ];
    const issues = explanationErrors.map(describeValidationIssue);
    const summary = summarizeCandidateIssues(issues);
    expect(issues.every((issue) => issue.path === '$.explanation_vi' && issue.code === 'explanation')).toBe(true);
    expect(summary).toEqual({ 'Lỗi explanation_vi': 2 });
    expect(summary['Lỗi chỉ số answer_idx']).toBeUndefined();
  });

  it('classifies pinyin mismatch separately from structural schema errors', () => {
    const issue = describeValidationIssue('pinyin does not match the completed sentence (expected zhè ge)');
    expect(issue).toMatchObject({ code: 'pinyin', path: '$.pinyin', summary: 'Lỗi pinyin' });
  });

  it('reports missing or contradictory answer explanation as an explanation issue', () => {
    const missing = validateCandidate({
      ...observedGroqCandidate,
      explanation_vi: '',
      answer_idx: 1,
      options: ['学校', '好吃', '出租车', '苹果'],
    }, [], { requireLanguageQuality: true });
    expect(missing.errors.some((error) => error.includes('explanation_vi'))).toBe(true);
    expect(missing.errors.map(describeValidationIssue).every((issue) => issue.path !== '$.answer_idx')).toBe(true);
  });
});
