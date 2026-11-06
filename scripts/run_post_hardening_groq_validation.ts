import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { assertStagingDatabaseIsolation, getQBankDbPath } from '../src/server/dbPaths.js';
import { generateWaterfallQuestions } from '../src/server/llm/waterfallGenerator.js';
import { normalizeQuestionList } from '../src/server/llm/jsonParser.js';
import {
  validateCandidate,
  evaluateCandidateSixGates,
  computeContentHash,
  computeNearDuplicateSignature,
  getComparableStem,
} from '../src/server/llm/questionValidator.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';
import { verifyQuestionVocab } from '../src/server/qbankCoverageEngine.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

function getFileSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ValidationItemResult {
  index: number;
  batchId: string;
  questionId: string;
  level: number;
  skill: string;
  partType: string;
  topic?: string;
  targetGrammar?: string;
  blueprintVersion: string;
  providerUsed: string;
  modelUsed: string;
  tokenUsage?: any;
  rateLimits?: any;
  requestId?: string;
  finishReason?: string;
  durationMs: number;
  candidate: CandidateQuestion;
  rawCompletedStem?: string;
  canonicalCompletedStem?: string;
  testedVocab?: string[];
  sixGates: ReturnType<typeof evaluateCandidateSixGates>;
  validation: ReturnType<typeof validateCandidate>;
  formatCheck: ReturnType<typeof validateFormatCompatibility>;
  vocabCheck: ReturnType<typeof verifyQuestionVocab>;
  dbStatus: 'pending';
  contentHash: string;
}

export interface HttpTelemetryEntry {
  reqNum: number;
  url: string;
  status?: number;
  durationMs: number;
  requestId?: string;
  tpmRemaining?: number;
  rpdRemaining?: number;
  tokensTotal?: number;
  error?: string;
}

export async function runControlledGroqValidation(): Promise<{
  results: ValidationItemResult[];
  telemetry: HttpTelemetryEntry[];
  batchId: string;
  totalOutboundHttpRequests: number;
  rateLimitedCount: number;
}> {
  console.log('=== MINNESE CONTROLLED GROQ VALIDATION: POST-HARDENING UNAMBIGUITY & MEDIA CHECK ===\n');

  // 1. Preflight Staging Guardrails Setup
  process.env.MINNESE_STAGING = 'true';
  process.env.QBANK_LLM_MODE = 'free';
  process.env.QBANK_LLM_FREE_ONLY = 'true';
  process.env.QBANK_LLM_ALLOW_PAID = 'false';
  process.env.QBANK_LLM_MAX_RETRIES = '0';
  process.env.QBANK_LLM_FREE_PROVIDERS = 'groq,groq-llama-3.3';
  process.env.QBANK_DB_PATH = 'D:\\minnese-staging-20261027\\qbank-staging.db';
  process.env.HSK_EXAM_DB_PATH = 'D:\\minnese-staging-20261027\\hsk-exam-staging.db';
  process.env.HOST = '127.0.0.1';

  assertStagingDatabaseIsolation();
  console.log('✓ Staging database isolation verified.');

  const expectedQBankHash = 'E85BEAE5AEA97592CB0127C4B455F78974CBAE04A623D04E369F8567BFBFB381';
  const expectedHskHash = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  const opQBank = path.resolve('data/qbank/qbank.db');
  const opHsk = path.resolve('data/hsk_exam.db');
  const opQBankHashBefore = getFileSha256(opQBank);
  const opHskHashBefore = getFileSha256(opHsk);
  console.log(`✓ Operational QBank DB Hash Before: ${opQBankHashBefore}`);
  console.log(`✓ Operational HSK DB Hash Before:   ${opHskHashBefore}`);

  if (opQBankHashBefore !== expectedQBankHash || opHskHashBefore !== expectedHskHash) {
    throw new Error(`BLOCKED: Operational database hash mismatch before run!`);
  }

  const stagingDbPath = getQBankDbPath();
  const db = new DatabaseSync(stagingDbPath);
  console.log(`✓ Connected to Staging DB: ${stagingDbPath}`);

  const beforePendingCount = db.prepare('SELECT count(*) as count FROM pending_questions').get() as { count: number };
  console.log(`✓ Pending questions in Staging DB before validation: ${beforePendingCount.count}\n`);

  // Load existing hashes from staging to prevent near duplicates
  const existingRows = db.prepare('SELECT content_hash, near_duplicate_signature FROM pending_questions').all() as { content_hash?: string; near_duplicate_signature?: string }[];
  const existingContentHashes = new Set<string>();
  const existingNearDupSignatures = new Set<string>();
  for (const row of existingRows) {
    if (row.content_hash) existingContentHashes.add(row.content_hash);
    if (row.near_duplicate_signature) existingNearDupSignatures.add(row.near_duplicate_signature);
  }

  // 2. Strict HTTP Request Interceptor & Budget Cap (Max 5 requests total)
  const MAX_HTTP_REQUESTS = 5;
  let totalHttpRequests = 0;
  let rateLimitedCount = 0;
  const telemetry: HttpTelemetryEntry[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function interceptedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

    if (urlStr.includes('api.groq.com')) {
      if (totalHttpRequests >= MAX_HTTP_REQUESTS) {
        throw new Error(`[BUDGET_EXHAUSTED] Reached maximum allowed HTTP request budget (${MAX_HTTP_REQUESTS}). Aborting outbound request.`);
      }
      totalHttpRequests++;
      const reqIdx = totalHttpRequests;
      console.log(`[HTTP Request Budget] Outbound Groq request #${reqIdx}/${MAX_HTTP_REQUESTS} -> ${urlStr}`);

      const start = Date.now();
      try {
        const response = await originalFetch(input, init);
        const durationMs = Date.now() - start;

        const remainingRequests = response.headers.get('x-ratelimit-remaining-requests');
        const remainingTokens = response.headers.get('x-ratelimit-remaining-tokens');
        const requestId = response.headers.get('x-request-id') || undefined;

        if (response.status === 429) {
          rateLimitedCount++;
        }

        telemetry.push({
          reqNum: reqIdx,
          url: urlStr,
          status: response.status,
          durationMs,
          requestId,
          tpmRemaining: remainingTokens ? Number(remainingTokens) : undefined,
          rpdRemaining: remainingRequests ? Number(remainingRequests) : undefined,
        });

        return response;
      } catch (err: any) {
        const durationMs = Date.now() - start;
        telemetry.push({
          reqNum: reqIdx,
          url: urlStr,
          durationMs,
          error: err.message,
        });
        throw err;
      }
    }

    return originalFetch(input, init);
  };

  // 3. Planned Validation Targets (HSK 2 Grammar & Disambiguation, HSK 2 Reading, HSK 1 Listening)
  const testTargets = [
    {
      level: 2,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      target_grammar: 'GP_L2_ER_VS_LIANG',
      topic: 'shopping_daily',
      blueprint_version: 'HSK 2 Practice Pool (CLEC HSK 3.0 Band 2)',
      label: 'Question 1: HSK 2 Fill-in-Blank testing 两 vs 二 with newly hardened numerical context mandate',
    },
    {
      level: 2,
      skill: 'reading',
      part_type: 'read_comprehension_short_3opt',
      target_grammar: 'GP_L2_CONNECTIVE_YINWEI_SUOYI',
      topic: 'weather_travel',
      blueprint_version: 'HSK 2 Official (CLEC HSK 3.0 Band 2)',
      label: 'Question 2: HSK 2 Reading Comprehension Short 3-opt testing 因为...所以...',
    },
    {
      level: 1,
      skill: 'listening',
      part_type: 'listen_question_answer_3opt',
      topic: 'daily_life',
      blueprint_version: 'HSK 1 Official (CLEC HSK 3.0 Band 1)',
      label: 'Question 3: HSK 1 Listening Question-Answer 3-opt with spoken audio_text',
    },
  ];

  const batchId = `val_groq_5_${Date.now()}`;
  console.log(`✓ Dedicated Validation Batch ID: ${batchId}\n`);

  const results: ValidationItemResult[] = [];
  const existingStems: string[] = [];

  try {
    for (let i = 0; i < testTargets.length; i++) {
      if (totalHttpRequests >= MAX_HTTP_REQUESTS) {
        console.log(`[Budget Guard] Max request cap reached. Stopping generation loop.`);
        break;
      }

      // Add 20s cooldown between consecutive requests to prevent Groq Free Tier TPM output window 429
      if (i > 0) {
        console.log(`[Rate Limit Guard] Cooling down 20s between requests to respect Groq Free Tier TPM window...`);
        await sleep(20000);
      }

      const target = testTargets[i];
      console.log(`--- [Question ${i + 1}/${testTargets.length}] ${target.label} ---`);

      try {
        const generationResult = await generateWaterfallQuestions({
          level: target.level,
          skill: target.skill as any,
          part_type: target.part_type,
          count: 1,
          target_grammar: target.target_grammar,
          topic: target.topic,
          provider: 'groq-llama-3.3',
          model: 'qwen/qwen3.8-27b',
          freeOnly: true,
          mock: false,
          maxRetries: 0,
        });

        const rawCandidate = generationResult?.questions?.[0];
        if (!rawCandidate) {
          console.log(`⚠️ No raw question returned for question ${i + 1}`);
          continue;
        }

        const normalizedQuestions = normalizeQuestionList([rawCandidate]);
        if (normalizedQuestions.length === 0) {
          console.log(`⚠️ No normalized questions parsed for question ${i + 1}`);
          continue;
        }

        const candidate = normalizedQuestions[0];
        candidate.level = target.level;
        candidate.skill = target.skill as any;
        candidate.part_type = target.part_type;

        const questionId = `pend_val_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

        // Compute hashes and signatures
        const contentHash = computeContentHash(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0, candidate.options_images);
        const nearDupSig = computeNearDuplicateSignature(candidate.stem, candidate.options || []);
        const comparableStem = getComparableStem(candidate.stem, candidate.options, candidate.answer_idx);

        // Run Six Quality Gates
        const sixGates = evaluateCandidateSixGates(candidate, existingStems, {
          existingContentHashes,
          existingNearDupSignatures,
          expectedLevel: target.level,
          expectedSkill: target.skill,
          expectedPartType: target.part_type,
          requireLanguageQuality: true,
          requireDistractorRationales: true,
        });

        // Run Extended Validator
        const validation = validateCandidate(candidate, existingStems, {
          existingContentHashes,
          existingNearDupSignatures,
          expectedLevel: target.level,
          expectedSkill: target.skill,
          expectedPartType: target.part_type,
          requireLanguageQuality: true,
          requireDistractorRationales: true,
        });

        // Run Format Compatibility Check
        const formatCheck = validateFormatCompatibility(
          {
            ...candidate,
            id: questionId,
            status: 'pending',
            is_active: 0,
            sixGates,
            validation,
          },
          target.level
        );

        // Run Vocab Verification
        const vocabCheck = verifyQuestionVocab(
          {
            stem: candidate.stem,
            options: candidate.options,
            answer_idx: candidate.answer_idx,
            passage: candidate.passage,
            audio_text: (candidate as any).audio_text,
          },
          target.level
        );

        // Print Candidate Assessment
        console.log(`✓ [Candidate #${i + 1}] ID: ${questionId} | Stem: "${candidate.stem}" | Answer: [${candidate.answer_idx}] "${candidate.options[candidate.answer_idx]}"`);
        console.log(`  Six Gates allPassed: ${sixGates.allPassed ? 'PASS' : 'FAIL'} | G6 Blind Solve: ${sixGates.gate6_blind_solve.passed ? 'PASS' : 'FAIL'} [${validation.solverAnalysis?.semantic_uniqueness_status || 'STATUS_UNSET'}]`);
        if (validation.solverAnalysis?.reason) {
          console.log(`  Ambiguity note: ${validation.solverAnalysis.reason}`);
        }
        console.log(`  Format Compat: practice=${formatCheck.practice_format_compatible}, exam=${formatCheck.exam_format_compatible}`);
        console.log(`  Serving Eligible: ${formatCheck.operational_serving_eligible ? 'YES' : 'NO (FAIL-CLOSED)'}\n`);

        existingStems.push(comparableStem);

        // Insert into Staging DB strictly in pending status
        const insertStmt = db.prepare(`
          INSERT INTO pending_questions (
            id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type,
            illustration_theme, status, provider_used, rejection_note, content_hash,
            created_at, updated_at, topic, batch_id, near_duplicate_signature,
            tested_vocab, passage, is_active, options_images
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, 'pending', ?, NULL, ?,
            datetime('now'), datetime('now'), ?, ?, ?,
            ?, ?, 1, ?
          )
        `);

        insertStmt.run(
          questionId,
          candidate.stem,
          JSON.stringify(candidate.options || []),
          candidate.answer_idx ?? 0,
          candidate.pinyin || '',
          candidate.explanation_vi || '',
          target.level,
          target.skill,
          target.part_type,
          candidate.illustration_theme || null,
          generationResult?.providerUsed || 'groq',
          contentHash,
          target.topic || null,
          batchId,
          nearDupSig,
          JSON.stringify(candidate.tested_vocab || []),
          candidate.passage || null,
          candidate.options_images ? JSON.stringify(candidate.options_images) : null
        );

        results.push({
          index: i + 1,
          batchId,
          questionId,
          level: target.level,
          skill: target.skill,
          partType: target.part_type,
          topic: target.topic,
          targetGrammar: target.target_grammar,
          blueprintVersion: target.blueprint_version,
          providerUsed: generationResult.providerUsed || 'groq',
          modelUsed: generationResult.modelUsed || 'qwen/qwen3.8-27b',
          tokenUsage: generationResult.tokenUsage,
          rateLimits: generationResult.rateLimits,
          requestId: (generationResult as any).requestId,
          finishReason: generationResult.finishReason,
          durationMs: (generationResult as any).durationMs || 0,
          candidate,
          rawCompletedStem: candidate.raw_completed_stem,
          canonicalCompletedStem: candidate.canonical_completed_stem,
          testedVocab: candidate.tested_vocab,
          sixGates,
          validation,
          formatCheck,
          vocabCheck,
          dbStatus: 'pending',
          contentHash,
        });
      } catch (err: any) {
        console.log(`❌ Groq call error for question ${i + 1}: ${err.message}`);
        if (err.message.includes('BUDGET_EXHAUSTED')) {
          break;
        }
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
    db.close();
  }

  // 4. Post-run Database Invariant Auditing
  const opQBankHashAfter = getFileSha256(opQBank);
  const opHskHashAfter = getFileSha256(opHsk);
  console.log('=== VALIDATION EXECUTION COMPLETE ===');
  console.log(`Total Outbound HTTP Requests: ${totalHttpRequests}/${MAX_HTTP_REQUESTS}`);
  console.log(`Successful Candidates Created: ${results.length}`);
  console.log(`Operational QBank DB Hash After: ${opQBankHashAfter} (${opQBankHashAfter === expectedQBankHash ? 'UNMODIFIED' : 'MUTATED!'})`);
  console.log(`Operational HSK DB Hash After:   ${opHskHashAfter} (${opHskHashAfter === expectedHskHash ? 'UNMODIFIED' : 'MUTATED!'})\n`);

  // Write telemetry output
  const outputData = {
    results,
    telemetry,
    batchId,
    totalOutboundHttpRequests: totalHttpRequests,
    rateLimitedCount,
    operationalDbHashes: {
      qbank: opQBankHashAfter,
      exam: opHskHashAfter,
      qbankInvariant: opQBankHashAfter === expectedQBankHash,
      examInvariant: opHskHashAfter === expectedHskHash,
    },
  };

  const outputPath = path.resolve('artifacts/audit/controlled_groq_validation_data.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`✓ Execution telemetry saved to ${outputPath}`);

  return {
    results,
    telemetry,
    batchId,
    totalOutboundHttpRequests: totalHttpRequests,
    rateLimitedCount,
  };
}

if (process.argv[1] && process.argv[1].includes('run_post_hardening_groq_validation')) {
  runControlledGroqValidation().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
