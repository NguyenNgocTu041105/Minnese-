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

export interface Pilot4ItemResult {
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

export async function runControlledPilot4(): Promise<{
  results: Pilot4ItemResult[];
  telemetry: HttpTelemetryEntry[];
  batchId: string;
  totalOutboundHttpRequests: number;
  rateLimitedCount: number;
}> {
  console.log('=== MINNESE CONTROLLED PILOT 4: LIVE HSK 2–4 QUALITY & COMPREHENSIVE HARDENING VALIDATION ===\n');

  // 1. Preflight Staging Guardrails Setup
  process.env.MINNESE_STAGING = 'true';
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

  if (opQBankHashBefore !== expectedQBankHash) {
    throw new Error(`PREFLIGHT_BLOCKED: Operational QBank DB hash mismatch! Expected ${expectedQBankHash}, got ${opQBankHashBefore}`);
  }
  if (opHskHashBefore !== expectedHskHash) {
    throw new Error(`PREFLIGHT_BLOCKED: Operational HSK DB hash mismatch! Expected ${expectedHskHash}, got ${opHskHashBefore}`);
  }

  // 2. Strict HTTP Request Budget Tracker & Interceptor
  const MAX_HTTP_REQUEST_BUDGET = 5;
  const MAX_REASONABLE_WAIT_MS = 25000;

  let totalOutboundHttpRequests = 0;
  let successfulHttpResponses = 0;
  let rateLimitedHttpResponses = 0;
  let failedHttpResponses = 0;
  const httpTelemetryLog: HttpTelemetryEntry[] = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string'
      ? input
      : (input instanceof URL ? input.toString() : (input as Request).url);

    if (urlStr.includes('api.groq.com')) {
      if (totalOutboundHttpRequests >= MAX_HTTP_REQUEST_BUDGET) {
        throw new Error(
          `STRICT_REQUEST_BUDGET_EXCEEDED: Hard cap of ${MAX_HTTP_REQUEST_BUDGET} HTTP generation requests reached. Outbound request blocked before transmission.`
        );
      }
      totalOutboundHttpRequests++;
      const currentReqNum = totalOutboundHttpRequests;
      console.log(`[HTTP Request Budget] Outbound Groq request #${currentReqNum}/${MAX_HTTP_REQUEST_BUDGET} -> ${urlStr}`);
      const fetchStart = Date.now();
      try {
        const resp = await originalFetch(input, init);
        const reqDuration = Date.now() - fetchStart;
        const reqId = resp.headers.get('x-request-id') || resp.headers.get('x-groq-id') || undefined;
        const tpmRem = resp.headers.get('x-ratelimit-remaining-tokens') ? Number(resp.headers.get('x-ratelimit-remaining-tokens')) : undefined;
        const rpdRem = resp.headers.get('x-ratelimit-remaining-requests') ? Number(resp.headers.get('x-ratelimit-remaining-requests')) : undefined;

        if (resp.status === 200) {
          successfulHttpResponses++;
        } else if (resp.status === 429) {
          rateLimitedHttpResponses++;
        } else if (!resp.ok) {
          failedHttpResponses++;
        }

        httpTelemetryLog.push({
          reqNum: currentReqNum,
          url: urlStr,
          status: resp.status,
          durationMs: reqDuration,
          requestId: reqId,
          tpmRemaining: tpmRem,
          rpdRemaining: rpdRem,
        });

        return resp;
      } catch (fetchErr: any) {
        const reqDuration = Date.now() - fetchStart;
        if (!String(fetchErr).includes('STRICT_REQUEST_BUDGET_EXCEEDED')) {
          failedHttpResponses++;
        }
        httpTelemetryLog.push({
          reqNum: currentReqNum,
          url: urlStr,
          durationMs: reqDuration,
          error: fetchErr?.message || String(fetchErr),
        });
        throw fetchErr;
      }
    }

    return originalFetch(input, init);
  };

  // 3. Connect to Staging Database
  const stagingQBankPath = getQBankDbPath();
  const db = new DatabaseSync(stagingQBankPath);
  console.log(`✓ Connected to Staging DB: ${stagingQBankPath}`);

  const pendingCountBefore = (db.prepare('SELECT count(*) as count FROM pending_questions').get() as any).count;
  console.log(`✓ Pending questions in Staging DB before pilot: ${pendingCountBefore}\n`);

  // Existing stems to guarantee uniqueness
  const existingStems: string[] = [];
  const existingContentHashes = new Set<string>();
  const existingNearDupSignatures = new Set<string>();

  try {
    const rows = db.prepare('SELECT stem, options, answer_idx, content_hash, near_duplicate_signature FROM pending_questions').all() as any[];
    for (const r of rows) {
      if (r.stem && r.options) {
        try {
          const opts = JSON.parse(r.options);
          existingStems.push(getComparableStem(r.stem, opts, r.answer_idx));
        } catch {}
      }
      if (r.content_hash) existingContentHashes.add(r.content_hash);
      if (r.near_duplicate_signature) existingNearDupSignatures.add(r.near_duplicate_signature);
    }
  } catch {}

  // 4. Pilot 4 Test Configurations (HSK 2–4 Expansion Across Part Types & Grammars)
  const pilotConfigs = [
    {
      level: 2,
      partType: 'read_comprehension_short_3opt',
      topic: 'weather_travel',
      targetGrammar: 'GP_L2_CONNECTIVE_YINWEI_SUOYI',
      targetVocab: ['因为', '所以', '下雨', '去'],
      blueprint: 'HSK 2 Official (CLEC HSK 3.0 Band 2)',
    },
    {
      level: 2,
      partType: 'read_fill_blank_4opt',
      topic: 'shopping_daily',
      targetGrammar: 'GP_L2_ER_VS_LIANG',
      targetVocab: ['两', '本', '买', '书'],
      blueprint: 'HSK 2 Practice Pool (CLEC HSK 3.0 Band 2)',
    },
    {
      level: 3,
      partType: 'read_fill_blank_4opt',
      topic: 'study_work',
      targetGrammar: 'GP_L3_RESULT_COMPLEMENT',
      targetVocab: ['看', '完', '书', '明白'],
      blueprint: 'HSK 3 Practice Pool (CLEC HSK 3.0 Band 3)',
    },
    {
      level: 3,
      partType: 'read_comprehension_4opt',
      topic: 'daily_life',
      targetGrammar: 'GP_L3_BA_SENTENCE_DISPOSAL',
      targetVocab: ['把', '放', '书包', '桌子'],
      blueprint: 'HSK 3 Official (CLEC HSK 3.0 Band 3)',
    },
    {
      level: 4,
      partType: 'read_fill_blank_4opt',
      topic: 'career_technology',
      targetGrammar: 'GP_L4_POTENTIAL_COMPLEMENT',
      targetVocab: ['做', '完', '工作', '复杂'],
      blueprint: 'HSK 4 Practice Pool (CLEC HSK 3.0 Band 4)',
    },
  ];

  const results: Pilot4ItemResult[] = [];
  const pilotBatchId = `pilot_groq_5_pilot4_${Date.now()}`;
  console.log(`✓ Dedicated Pilot 4 Batch ID: ${pilotBatchId}\n`);

  for (let i = 0; i < pilotConfigs.length; i++) {
    if (totalOutboundHttpRequests >= MAX_HTTP_REQUEST_BUDGET) {
      console.warn(`[Budget Limit] Maximum HTTP request budget (${MAX_HTTP_REQUEST_BUDGET}) reached. Halting pilot.`);
      break;
    }

    const config = pilotConfigs[i];
    const itemNum = i + 1;
    console.log(`--- [Question ${itemNum}/5] Generating HSK ${config.level} ${config.partType} (Grammar: ${config.targetGrammar}, Topic: ${config.topic}) ---`);

    const itemStartTime = Date.now();
    let waterfallResult: any;

    try {
      waterfallResult = await generateWaterfallQuestions({
        level: config.level,
        skill: 'reading',
        part_type: config.partType,
        count: 1,
        topic: config.topic,
        target_grammar: config.targetGrammar,
        provider: 'groq-llama-3.3',
        model: 'qwen/qwen3.8-27b',
        freeOnly: true,
        mock: false,
        maxRetries: 0,
      });
    } catch (err: any) {
      console.error(`❌ Groq call failed for question ${itemNum}:`, err.message);
      const is429 =
        err.category === 'rate_limited' ||
        err.category === 'quota_exhausted' ||
        err.status === 429 ||
        err.retryAfterMs !== undefined ||
        /quota|exhausted|rate/i.test(err.message);

      if (is429) {
        const retryAfterMs = Number(err.retryAfterMs) || 12000;
        console.warn(`[Rate Limit Hit] Groq limit encountered on question ${itemNum}. RetryAfter: ${retryAfterMs}ms`);

        if (totalOutboundHttpRequests >= MAX_HTTP_REQUEST_BUDGET) {
          console.warn(`[Budget Limit] Cannot retry question ${itemNum}: HTTP request budget exhausted. Halting pilot.`);
          break;
        }

        if (retryAfterMs > MAX_REASONABLE_WAIT_MS) {
          console.warn(`[Wait Too Long] Retry-After (${retryAfterMs}ms) exceeds reasonable limit (${MAX_REASONABLE_WAIT_MS}ms). Halting pilot gracefully.`);
          break;
        }

        console.log(`[Rate Limit Cooldown] Sleeping ${retryAfterMs}ms before retrying within budget...`);
        await sleep(retryAfterMs);

        if (totalOutboundHttpRequests >= MAX_HTTP_REQUEST_BUDGET) {
          console.warn(`[Budget Limit] HTTP request budget exhausted. Halting pilot.`);
          break;
        }

        try {
          console.log(`[Retrying Question ${itemNum}] Dispatching retry attempt within remaining budget...`);
          waterfallResult = await generateWaterfallQuestions({
            level: config.level,
            skill: 'reading',
            part_type: config.partType,
            count: 1,
            topic: config.topic,
            target_grammar: config.targetGrammar,
            provider: 'groq-llama-3.3',
            model: 'qwen/qwen3.8-27b',
            freeOnly: true,
            mock: false,
            maxRetries: 0,
          });
        } catch (retryErr: any) {
          console.warn(`[Retry Failed] Halting pilot gracefully: ${retryErr.message}`);
          break;
        }
      } else {
        console.error(`[Non-Retryable Error] ${err.message}. Halting pilot.`);
        break;
      }
    }

    const durationMs = Date.now() - itemStartTime;
    const rawCandidate = waterfallResult?.questions?.[0];
    if (!rawCandidate) {
      console.warn(`⚠️ No candidate returned for question ${itemNum}.`);
      continue;
    }

    // Preserve raw completed_stem before backend canonical normalization
    const rawCompletedStem = rawCandidate.completed_stem;

    // Normalize candidate
    const normalizedList = normalizeQuestionList([rawCandidate]);
    const candidate = normalizedList[0];
    candidate.level = config.level;
    candidate.skill = 'reading';
    candidate.part_type = config.partType;

    const canonicalCompletedStem = candidate.canonical_completed_stem || candidate.completed_stem;

    // Compute hashes
    const cHash = computeContentHash(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0, candidate.options_images);
    const nearSig = computeNearDuplicateSignature(candidate.stem, candidate.options || []);

    // Validate Six Gates
    const sixGates = evaluateCandidateSixGates(candidate, existingStems, {
      existingContentHashes,
      existingNearDupSignatures,
      expectedLevel: config.level,
      expectedSkill: 'reading',
      expectedPartType: config.partType,
      requireLanguageQuality: true,
      requireDistractorRationales: true,
    });

    const validation = validateCandidate(candidate, existingStems, {
      existingContentHashes,
      existingNearDupSignatures,
      expectedLevel: config.level,
      expectedSkill: 'reading',
      expectedPartType: config.partType,
      requireLanguageQuality: true,
      requireDistractorRationales: true,
    });

    const formatCheck = validateFormatCompatibility(
      {
        ...candidate,
        sixGates,
        validation,
        status: 'pending',
      },
      config.level
    );
    const vocabCheck = verifyQuestionVocab(candidate, config.level);

    const questionId = `pend_pilot4_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Store in Staging DB with status 'pending'
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
      config.level,
      'reading',
      config.partType,
      candidate.illustration_theme || null,
      waterfallResult?.providerUsed || 'groq',
      cHash,
      config.topic || null,
      pilotBatchId,
      nearSig,
      JSON.stringify(candidate.tested_vocab || []),
      candidate.passage || null,
      candidate.options_images ? JSON.stringify(candidate.options_images) : null
    );

    // Update sets to prevent dupes in subsequent iterations
    existingStems.push(getComparableStem(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0));
    existingContentHashes.add(cHash);
    existingNearDupSignatures.add(nearSig);

    const itemResult: Pilot4ItemResult = {
      index: itemNum,
      batchId: pilotBatchId,
      questionId,
      level: config.level,
      skill: 'reading',
      partType: config.partType,
      topic: config.topic,
      targetGrammar: config.targetGrammar,
      blueprintVersion: config.blueprint,
      providerUsed: waterfallResult?.providerUsed || 'groq-llama-3.3',
      modelUsed: waterfallResult?.modelUsed || 'qwen/qwen3.8-27b',
      tokenUsage: waterfallResult?.rawUsage,
      rateLimits: waterfallResult?.rateLimits,
      requestId: waterfallResult?.requestId,
      finishReason: waterfallResult?.finishReason,
      durationMs,
      candidate,
      rawCompletedStem,
      canonicalCompletedStem,
      testedVocab: candidate.tested_vocab || [],
      sixGates,
      validation,
      formatCheck,
      vocabCheck,
      dbStatus: 'pending',
      contentHash: cHash,
    };

    results.push(itemResult);
    console.log(`✓ [Candidate #${itemNum}] ID: ${questionId} | Stem: "${candidate.stem}" | Answer: [${candidate.answer_idx}] "${candidate.options?.[candidate.answer_idx ?? 0]}"`);
    console.log(`  Six Gates allPassed: ${sixGates.allPassed ? 'PASS' : 'FAIL'} | G3 Vocab: ${sixGates.gate3_vocab_coverage.passed ? 'PASS' : 'FAIL'} | G4 Distractor: ${sixGates.gate4_distractor_quality.passed ? 'PASS' : 'FAIL'}`);
    console.log(`  Format Compat: practice=${formatCheck.practice_format_compatible}, exam=${formatCheck.exam_format_compatible}`);
    console.log(`  Serving Eligible: ${formatCheck.operational_serving_eligible ? 'YES' : 'NO (FAIL-CLOSED)'}\n`);

    // Polite pause between generation requests to avoid aggressive bursts
    if (i < pilotConfigs.length - 1) {
      await sleep(2000);
    }
  }

  // Restore fetch
  globalThis.fetch = originalFetch;

  console.log(`=== PILOT 4 EXECUTION COMPLETE ===`);
  console.log(`Total Outbound HTTP Requests: ${totalOutboundHttpRequests}/${MAX_HTTP_REQUEST_BUDGET}`);
  console.log(`Successful HTTP Responses:    ${successfulHttpResponses}`);
  console.log(`Rate-Limited (429) Responses: ${rateLimitedHttpResponses}`);
  console.log(`Candidates Created in Staging:${results.length}`);

  return {
    results,
    telemetry: httpTelemetryLog,
    batchId: pilotBatchId,
    totalOutboundHttpRequests,
    rateLimitedCount: rateLimitedHttpResponses,
  };
}

// Execute if run as script
if (process.argv[1] && process.argv[1].endsWith('run_controlled_pilot_4.ts')) {
  runControlledPilot4()
    .then((out) => {
      fs.writeFileSync(
        path.resolve('artifacts/audit/pilot4_execution_data.json'),
        JSON.stringify(out, null, 2),
        'utf-8'
      );
      console.log('✓ Pilot 4 execution data saved to artifacts/audit/pilot4_execution_data.json');
      process.exit(0);
    })
    .catch((err) => {
      console.error('PILOT 4 FATAL ERROR:', err);
      process.exit(1);
    });
}
