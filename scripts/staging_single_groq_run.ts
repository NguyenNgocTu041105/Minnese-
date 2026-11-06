import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { assertStagingDatabaseIsolation, getQBankDbPath, getHskExamDbPath } from '../src/server/dbPaths.js';
import { generateWaterfallQuestions } from '../src/server/llm/waterfallGenerator.js';
import { normalizeQuestionList } from '../src/server/llm/jsonParser.js';
import { validateCandidate, evaluateCandidateSixGates, computeContentHash } from '../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

function getFileSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

async function runStagingSingleGroq(): Promise<void> {
  console.log('=== STAGING LIVE GROQ GENERATION RUN (1 REQUEST) ===\n');

  // 1. Guardrails setup
  process.env.MINNESE_STAGING = 'true';
  process.env.QBANK_LLM_FREE_ONLY = 'true';
  process.env.QBANK_LLM_ALLOW_PAID = 'false';
  process.env.QBANK_LLM_FREE_PROVIDERS = 'groq,groq-llama-3.3';
  process.env.QBANK_DB_PATH = 'D:\\minnese-staging-20261027\\qbank-staging.db';
  process.env.HSK_EXAM_DB_PATH = 'D:\\minnese-staging-20261027\\hsk-exam-staging.db';
  process.env.HOST = '127.0.0.1';

  assertStagingDatabaseIsolation();
  console.log('✓ Staging database isolation verified.');

  const opQBank = path.resolve('data/qbank/qbank.db');
  const opHsk = path.resolve('data/hsk_exam.db');
  const opQBankHashBefore = getFileSha256(opQBank);
  const opHskHashBefore = getFileSha256(opHsk);
  console.log(`✓ Operational QBank DB Hash Before: ${opQBankHashBefore}`);
  console.log(`✓ Operational HSK DB Hash Before:   ${opHskHashBefore}`);

  // 2. Open staging DB
  const stagingQBankPath = getQBankDbPath();
  const db = new DatabaseSync(stagingQBankPath);
  console.log(`✓ Connected to staging DB: ${stagingQBankPath}`);

  const pendingCountBefore = (db.prepare('SELECT count(*) as count FROM pending_questions').get() as any).count;
  console.log(`✓ Pending questions before run: ${pendingCountBefore}`);

  // 3. Execute 1 live Groq generation call
  console.log('\n[Requesting Groq Cloud free tier: model qwen/qwen3.8-27b, 1 question, HSK 1 Reading]...');
  const batchId = `staging_live_${Date.now()}`;
  const startTime = Date.now();

  const waterfallResult = await generateWaterfallQuestions({
    level: 1,
    skill: 'reading',
    part_type: 'read_fill_blank_4opt',
    count: 1,
    provider: 'groq-llama-3.3',
    freeOnly: true,
    mock: false,
  });

  const durationMs = Date.now() - startTime;
  console.log(`✓ Groq generation completed in ${durationMs}ms`);
  console.log(`  Provider used: ${waterfallResult.providerUsed}`);
  console.log(`  Model used:    ${waterfallResult.modelUsed}`);
  console.log(`  Finish reason: ${waterfallResult.finishReason || 'stop'}`);
  console.log(`  Token usage:   ${JSON.stringify(waterfallResult.tokenUsage || {})}`);

  // 4. Normalize candidates (deterministic completed_stem & pinyin alignment)
  const rawCandidate = (waterfallResult.questions || [])[0];
  if (!rawCandidate) {
    throw new Error('No candidate question returned by Groq.');
  }

  const normalizedList = normalizeQuestionList([rawCandidate]);
  const candidate = normalizedList[0];
  console.log('\n--- Generated Candidate Question ---');
  console.log(`  Stem:           ${candidate.stem}`);
  console.log(`  Completed Stem: ${candidate.completed_stem}`);
  console.log(`  Options:        ${JSON.stringify(candidate.options)}`);
  console.log(`  Answer Index:   ${candidate.answer_idx} (${candidate.options?.[candidate.answer_idx ?? -1]})`);
  console.log(`  Pinyin:         ${candidate.pinyin}`);
  console.log(`  Explanation:    ${candidate.explanation_vi}`);
  console.log(`  Distractor Rationales: ${JSON.stringify(candidate.distractor_rationales || [])}`);

  // 5. Six-Gate Multi-Layer Validation
  const valResult = validateCandidate(candidate, [], {
    expectedLevel: 1,
    expectedSkill: 'reading',
    expectedPartType: 'read_fill_blank_4opt',
    requireLanguageQuality: true,
    requireDistractorRationales: true,
  });

  const sixGates = evaluateCandidateSixGates(candidate, [], {
    expectedLevel: 1,
    expectedSkill: 'reading',
    expectedPartType: 'read_fill_blank_4opt',
    requireLanguageQuality: true,
    requireDistractorRationales: true,
  });

  console.log('\n--- Six Gates Evaluation Result ---');
  console.log(`  Gate 1 (Schema):              ${sixGates.gate1_schema.passed ? 'PASS' : 'FAIL'} (${sixGates.gate1_schema.details})`);
  console.log(`  Gate 2 (Rationales/Coherence): ${sixGates.gate2_rationales_coherence.passed ? 'PASS' : 'FAIL'} (${sixGates.gate2_rationales_coherence.details})`);
  console.log(`  Gate 3 (Vocab Coverage):      ${sixGates.gate3_vocab_coverage.passed ? 'PASS' : 'FAIL'} (${sixGates.gate3_vocab_coverage.details})`);
  console.log(`  Gate 4 (Distractor POS):      ${sixGates.gate4_distractor_quality.passed ? 'PASS' : 'FAIL'} (${sixGates.gate4_distractor_quality.details})`);
  console.log(`  Gate 5 (Uniqueness):          ${sixGates.gate5_uniqueness.passed ? 'PASS' : 'FAIL'} (${sixGates.gate5_uniqueness.details})`);
  console.log(`  Gate 6 (Blind Solve):         ${sixGates.gate6_blind_solve.passed ? 'PASS' : 'FAIL'} (${sixGates.gate6_blind_solve.details})`);
  console.log(`  All Gates Passed:             ${sixGates.allPassed}`);
  console.log(`  Candidate Valid:              ${valResult.valid}`);
  if (valResult.errors.length > 0) {
    console.log(`  Validation Errors:            ${JSON.stringify(valResult.errors)}`);
  }
  if (valResult.warnings.length > 0) {
    console.log(`  Validation Warnings:          ${JSON.stringify(valResult.warnings)}`);
  }

  // 6. Save to Staging Pending Pool (Strictly Pending, Zero Auto-Approve)
  const qId = `pend_1_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const cHash = computeContentHash(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0, candidate.options_images);

  db.prepare(`
    INSERT INTO pending_questions (
      id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, options_images, topic, status, provider_used, content_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(
    qId,
    batchId,
    candidate.stem,
    JSON.stringify(candidate.options || []),
    candidate.answer_idx ?? 0,
    candidate.pinyin || null,
    candidate.explanation_vi || '',
    candidate.level || 1,
    candidate.skill || 'reading',
    candidate.part_type || 'read_fill_blank_4opt',
    candidate.illustration_theme || null,
    JSON.stringify(candidate.options_images || []),
    candidate.topic || null,
    waterfallResult.providerUsed,
    cHash
  );

  const pendingCountAfter = (db.prepare('SELECT count(*) as count FROM pending_questions').get() as any).count;
  console.log(`\n✓ Saved candidate to staging pending_questions (id: ${qId}, status: 'pending')`);
  console.log(`✓ Pending questions after run: ${pendingCountAfter} (+${pendingCountAfter - pendingCountBefore})`);

  // Record generation_runs
  const runId = `run_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  db.prepare(`
    INSERT INTO generation_runs (
      id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
    ) VALUES (?, ?, 1, 'reading', 1, 1, 1, ?, ?, ?, ?, ?)
  `).run(
    runId,
    batchId,
    valResult.valid ? 0 : 1,
    waterfallResult.providerUsed,
    waterfallResult.modelUsed || 'qwen/qwen3.8-27b',
    valResult.valid ? 'success' : 'partial',
    JSON.stringify({
      batch_id: batchId,
      token_usage: waterfallResult.tokenUsage || null,
      finish_reason: waterfallResult.finishReason || null,
      val_result: valResult,
      six_gates: sixGates,
    })
  );

  db.close();

  // 7. Verify Operational Database Invariance
  const opQBankHashAfter = getFileSha256(opQBank);
  const opHskHashAfter = getFileSha256(opHsk);
  console.log('\n--- Operational Database Invariance Check ---');
  console.log(`  Operational QBank DB Hash After:  ${opQBankHashAfter}`);
  console.log(`  Operational HSK DB Hash After:    ${opHskHashAfter}`);
  const qbankMatch = opQBankHashBefore === opQBankHashAfter;
  const hskMatch = opHskHashBefore === opHskHashAfter;
  console.log(`  QBank DB Invariant: ${qbankMatch ? 'YES (100% BIT-FOR-BIT IDENTICAL)' : 'NO (MUTATED!)'}`);
  console.log(`  HSK DB Invariant:   ${hskMatch ? 'YES (100% BIT-FOR-BIT IDENTICAL)' : 'NO (MUTATED!)'}`);

  if (!qbankMatch || !hskMatch) {
    throw new Error('CRITICAL ERROR: Operational database hash mismatch after staging run!');
  }

  // 8. Write Markdown Audit Artifact
  const artifactDir = path.resolve('artifacts/audit');
  fs.mkdirSync(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, 'STAGING_LIVE_GROQ_RUN.md');

  const artifactContent = `# Staging Live Groq Generation Audit Log

- **Date:** ${new Date().toISOString()}
- **Environment:** Staging (\`MINNESE_STAGING=true\`)
- **Cost Policy:** \`QBANK_LLM_FREE_ONLY=true\`, \`QBANK_LLM_ALLOW_PAID=false\`
- **Provider Used:** ${waterfallResult.providerUsed} (${waterfallResult.modelUsed})
- **Duration:** ${durationMs}ms
- **Token Usage:** \`${JSON.stringify(waterfallResult.tokenUsage || {})}\`
- **Finish Reason:** \`${waterfallResult.finishReason || 'stop'}\`

## Operational Database Invariance Verification

| Database | Baseline SHA-256 | Post-Run SHA-256 | Status |
| :--- | :--- | :--- | :--- |
| \`data/hsk_exam.db\` | \`${opHskHashBefore}\` | \`${opHskHashAfter}\` | **100% Invariant (MATCH)** |
| \`data/qbank/qbank.db\` | \`${opQBankHashBefore}\` | \`${opQBankHashAfter}\` | **100% Invariant (MATCH)** |

## Staging Database Mutation

- **Target Database:** \`${stagingQBankPath}\`
- **Table:** \`pending_questions\`
- **Question ID:** \`${qId}\`
- **Lifecycle Status:** \`pending\` (NO auto-approval)
- **Pending Questions Delta:** \`${pendingCountBefore}\` -> \`${pendingCountAfter}\` (+1)

## Generated Candidate Details

- **Stem:** \`${candidate.stem}\`
- **Completed Stem:** \`${candidate.completed_stem}\`
- **Options:** \`${JSON.stringify(candidate.options)}\`
- **Answer Index:** \`${candidate.answer_idx}\` (\`${candidate.options?.[candidate.answer_idx ?? -1]}\`)
- **Pinyin:** \`${candidate.pinyin}\`
- **Explanation (VI):** ${candidate.explanation_vi}
- **Distractor Rationales:**
\`\`\`json
${JSON.stringify(candidate.distractor_rationales || [], null, 2)}
\`\`\`

## Quality Contract Six-Gate Evaluation

| Gate | Name | Result | Details |
| :--- | :--- | :--- | :--- |
| Gate 1 | Schema & Structure | **${sixGates.gate1_schema.passed ? 'PASS' : 'FAIL'}** | ${sixGates.gate1_schema.details} |
| Gate 2 | Rationales & Coherence | **${sixGates.gate2_rationales_coherence.passed ? 'PASS' : 'FAIL'}** | ${sixGates.gate2_rationales_coherence.details} |
| Gate 3 | Vocab Syllabus Alignment | **${sixGates.gate3_vocab_coverage.passed ? 'PASS' : 'FAIL'}** | ${sixGates.gate3_vocab_coverage.details} |
| Gate 4 | Distractor POS Quality | **${sixGates.gate4_distractor_quality.passed ? 'PASS' : 'FAIL'}** | ${sixGates.gate4_distractor_quality.details} |
| Gate 5 | Deduplication & Uniqueness | **${sixGates.gate5_uniqueness.passed ? 'PASS' : 'FAIL'}** | ${sixGates.gate5_uniqueness.details} |
| Gate 6 | Blind Solve & Unambiguity | **${sixGates.gate6_blind_solve.passed ? 'PASS' : 'FAIL'}** | ${sixGates.gate6_blind_solve.details} |

**Overall Gate Status:** **${sixGates.allPassed ? 'ALL GATES PASSED' : 'PARTIAL / MANUAL REVIEW NEEDED'}**
`;

  fs.writeFileSync(artifactPath, artifactContent, 'utf-8');
  console.log(`\n✓ Audit artifact written to: ${artifactPath}`);
  console.log('=== STAGING RUN COMPLETE ===\n');
}

runStagingSingleGroq().catch((err) => {
  console.error('\n❌ STAGING LIVE GROQ RUN FAILED:', err);
  process.exit(1);
});
