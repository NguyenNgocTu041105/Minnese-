import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { CandidateQuestion } from './types.js';
import type { CandidateValidationIssue } from './validationDiagnostics.js';

const DIAGNOSTIC_FIELDS = [
  'GROQ_API_KEY',
  'DEEPSEEK_API_KEY',
  'GEMINI_API_KEY',
  'QBANK_LLM_API_KEY',
  'ADMIN_TOKEN',
  'ADMIN_API_TOKEN',
  'AUTH_TOKEN',
  'AUTHORIZATION',
];

function credentialValues(): string[] {
  return DIAGNOSTIC_FIELDS
    .map((name) => process.env[name]?.trim())
    .filter((value): value is string => typeof value === 'string' && value.length >= 6);
}

function redactText(value: string, secrets: string[]): string {
  let safe = value;
  for (const secret of secrets) safe = safe.split(secret).join('[REDACTED]');
  return safe
    .replace(/\bBearer\s+[^\s,;]+/giu, 'Bearer [REDACTED]')
    .replace(/\b(?:gsk_|sk-|AIza)[A-Za-z0-9_-]{12,}\b/gu, '[REDACTED]')
    .replace(/\b(api[_-]?key|admin[_-]?token|authorization)\s*[:=]\s*["']?[^\s,"']+/giu, '$1=[REDACTED]');
}

function redactValue(value: unknown, secrets: string[]): unknown {
  if (typeof value === 'string') return redactText(value, secrets);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, secrets));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactValue(item, secrets)]));
  }
  return value ?? null;
}

export function createValidationDiagnosticPayload(
  batchId: string,
  candidateIndex: number,
  candidate: Partial<CandidateQuestion>,
  finishReason: string | undefined,
  maxCompletionTokens: number | undefined,
  issues: CandidateValidationIssue[],
  knownSecrets = credentialValues(),
) {
  return redactValue({
    version: 1,
    created_at: new Date().toISOString(),
    batch_id: batchId,
    candidate_index: candidateIndex,
    candidate: {
      stem: candidate.stem,
      options: candidate.options,
      answer_idx: candidate.answer_idx,
      completed_stem: candidate.completed_stem,
      pinyin: candidate.pinyin,
      explanation_vi: candidate.explanation_vi,
    },
    finish_reason: finishReason ?? null,
    max_completion_tokens: maxCompletionTokens ?? null,
    validation_issues: issues,
  }, knownSecrets) as Record<string, unknown>;
}

export function writeValidationDiagnosticArtifact(
  workspaceRoot: string,
  batchId: string,
  candidateIndex: number,
  candidate: Partial<CandidateQuestion>,
  finishReason: string | undefined,
  maxCompletionTokens: number | undefined,
  issues: CandidateValidationIssue[],
  knownSecrets?: string[],
): string {
  const safeBatchId = batchId.replace(/[^A-Za-z0-9_-]/gu, '_');
  const directory = path.resolve(workspaceRoot, 'artifacts', 'qbank-validation-diagnostics');
  fs.mkdirSync(directory, { recursive: true });
  const filename = `${safeBatchId}_candidate-${candidateIndex}_${crypto.randomUUID()}.json`;
  const fullPath = path.join(directory, filename);
  const payload = createValidationDiagnosticPayload(batchId, candidateIndex, candidate, finishReason, maxCompletionTokens, issues, knownSecrets);
  fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  return path.relative(workspaceRoot, fullPath).replace(/\\/gu, '/');
}
