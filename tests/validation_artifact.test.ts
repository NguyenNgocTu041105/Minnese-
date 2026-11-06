import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeValidationDiagnosticArtifact } from '../src/server/llm/validationArtifact.js';
import { describeValidationIssue } from '../src/server/llm/validationDiagnostics.js';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('rejected-candidate diagnostic artifacts', () => {
  it('writes only candidate evidence and issues to a new artifact, redacting credentials', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'minnese-validation-diagnostic-'));
    roots.push(root);
    const secret = 'unit-test-secret-value';
    const relativePath = writeValidationDiagnosticArtifact(
      root,
      'batch_test_123',
      0,
      {
        stem: '今天的晚餐____。',
        options: ['很好吃', '学校'],
        answer_idx: 0,
        completed_stem: '今天的晚餐很好吃。',
        pinyin: 'jīn tiān de wǎn cān hěn hǎo chī。',
        explanation_vi: `Kết luận API_KEY=${secret}.`,
      },
      'stop',
      900,
      [describeValidationIssue('explanation_vi must end with terminal punctuation')],
      [secret],
    );

    const artifact = JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
    expect(artifact.candidate).toMatchObject({
      stem: '今天的晚餐____。',
      options: ['很好吃', '学校'],
      answer_idx: 0,
      completed_stem: '今天的晚餐很好吃。',
      pinyin: 'jīn tiān de wǎn cān hěn hǎo chī。',
    });
    expect(artifact.finish_reason).toBe('stop');
    expect(artifact.max_completion_tokens).toBe(900);
    expect(artifact.validation_issues[0]).toMatchObject({ code: 'explanation', path: '$.explanation_vi' });
    expect(JSON.stringify(artifact)).not.toContain(secret);
    expect(artifact.authorization).toBeUndefined();
  });
});
