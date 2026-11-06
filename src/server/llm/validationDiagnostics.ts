export interface CandidateValidationIssue {
  code: string;
  path: string;
  message: string;
  summary: string;
}

/** Converts validator messages to a stable, field-addressable diagnostic contract. */
export function describeValidationIssue(message: string): CandidateValidationIssue {
  const lower = message.toLowerCase();
  let code = 'schema';
  let path = '$';
  let summary = 'Lỗi schema cấu trúc';

  if (lower.includes('vocabulary') || lower.includes('syllabus') || lower.includes('vượt cấp') || lower.includes('above level')) {
    code = 'vocabulary';
    path = '$.vocabulary';
    summary = 'Từ vựng vượt cấp HSK';
  } else if (lower.includes('explanation_vi')) {
    code = 'explanation';
    path = '$.explanation_vi';
    summary = 'Lỗi explanation_vi';
  } else if (lower.includes('completed_stem')) {
    code = lower.includes('adds content') ? 'completed_stem_extra_content' : 'completed_stem';
    path = '$.completed_stem';
    summary = 'Lỗi completed_stem';
  } else if (lower.includes('distractor_rationales')) {
    code = 'distractor_rationale';
    const match = message.match(/distractor_rationales\[(\d+)\]\.(option_idx|option_text|rationale_vi)/i);
    path = match ? `$.distractor_rationales[${match[1]}].${match[2]}` : '$.distractor_rationales';
    summary = 'Lỗi distractor rationale';
  } else if (/similarity|duplicate/i.test(message)) {
    code = 'duplicate';
    summary = 'Trùng lặp (>85% stem hoặc trùng options)';
  } else if (/latin or vietnamese/i.test(message)) {
    code = 'language_script';
    path = '$.stem';
    summary = 'Chứa chữ Latin/Việt';
  } else if (/at least one chinese character/i.test(message)) {
    code = 'missing_hanzi';
    path = '$.stem';
    summary = 'Thiếu chữ Hán trong câu dẫn';
  } else if (lower.includes('illustration_theme')) {
    code = 'illustration_theme';
    path = '$.illustration_theme';
    summary = 'Lỗi hình minh họa / Theme';
  } else if (lower.includes('answer_idx')) {
    code = 'answer_index';
    path = '$.answer_idx';
    summary = 'Lỗi chỉ số answer_idx';
  } else if (/options?/.test(lower) && /unique|trùng/.test(lower)) {
    code = 'duplicate_options';
    path = '$.options';
    summary = 'Trùng lặp phương án';
  } else if (lower.includes('naturalness_review')) {
    code = 'naturalness_review';
    path = '$.naturalness_review';
  } else if (lower.includes('pinyin')) {
    code = 'pinyin';
    path = '$.pinyin';
    summary = 'Lỗi pinyin';
  } else if (lower.includes('options[') || lower.includes('options must') || lower.includes('option at')) {
    code = 'options';
    path = '$.options';
  } else if (lower.includes('stem')) {
    code = 'stem';
    path = '$.stem';
  }

  return { code, path, message, summary };
}

export function summarizeCandidateIssues(issues: CandidateValidationIssue[]): Record<string, number> {
  return issues.reduce<Record<string, number>>((summary, issue) => {
    summary[issue.summary] = (summary[issue.summary] || 0) + 1;
    return summary;
  }, {});
}
