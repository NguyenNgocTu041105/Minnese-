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

interface PilotItemResult {
  index: number;
  batchId: string;
  questionId: string;
  level: number;
  skill: string;
  partType: string;
  topic?: string;
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

interface HttpTelemetryEntry {
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

export async function runControlledPilot3(): Promise<void> {
  console.log('=== MINNESE CONTROLLED PILOT 3: FINAL TECHNICAL CHECK + LIVE QUESTION QUALITY ===\n');

  // 1. Preflight Staging Guardrails Setup
  process.env.MINNESE_STAGING = 'true';
  process.env.QBANK_LLM_FREE_ONLY = 'true';
  process.env.QBANK_LLM_ALLOW_PAID = 'false';
  process.env.QBANK_LLM_MAX_RETRIES = '0'; // Strictly disable automatic retries
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

  // Fix vocabCheck logging
  // 4. Pilot 3 Configurations (Audited HSK 1 Blueprint Part Types & Topics)
  const pilotConfigs = [
    {
      partType: 'read_comprehension_short_3opt',
      topic: 'daily_activity_time',
      targetVocab: ['上午', '看书', '学校'],
      hint: 'Short reading statement followed by question, e.g. 我上午去学校看书。★ 我什么时候去学校？',
    },
    {
      partType: 'read_fill_blank_4opt',
      topic: 'food_dining',
      targetVocab: ['吃', '米饭', '苹果', '茶'],
      hint: 'Sentence about eating or drinking, e.g. 中午我们吃____。',
    },
    {
      partType: 'read_comprehension_short_3opt',
      topic: 'family_location',
      targetVocab: ['爸爸', '医院', '工作'],
      hint: 'Short reading statement about family member and workplace, e.g. 我爸爸在医院工作，他是医生。★ 爸爸在哪里工作？',
    },
    {
      partType: 'read_fill_blank_4opt',
      topic: 'transport_travel',
      targetVocab: ['坐', '飞机', '去', '北京'],
      hint: 'Sentence about travelling or transportation, e.g. 明天我们坐____去北京。',
    },
    {
      partType: 'read_comprehension_short_3opt',
      topic: 'weather_status',
      targetVocab: ['天气', '冷', '热'],
      hint: 'Short statement about weather, e.g. 今天天气不冷，也不热。★ 今天天气怎么样？',
    },
  ];

  const results: PilotItemResult[] = [];
  const pilotBatchId = 'pilot_groq_5_pilot3_1793252449667';
  console.log(`✓ Dedicated Batch ID: ${pilotBatchId}\n`);

  // Load Candidate 1 already successfully fetched via Request #1
  totalOutboundHttpRequests = 1;
  successfulHttpResponses = 1;
  httpTelemetryLog.push({
    reqNum: 1,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    status: 200,
    durationMs: 1938,
  });

  const cand1Row = db.prepare("SELECT * FROM pending_questions WHERE id = 'pend_pilot3_1793252451605_633fe5'").get() as any;
  if (cand1Row) {
    const cand1Opts = JSON.parse(cand1Row.options);
    const cand1Obj: CandidateQuestion = {
      stem: cand1Row.stem,
      options: cand1Opts,
      answer_idx: cand1Row.answer_idx,
      pinyin: cand1Row.pinyin,
      explanation_vi: cand1Row.explanation_vi,
      level: 1,
      skill: 'reading',
      part_type: cand1Row.part_type,
    };
    const c1SixGates = evaluateCandidateSixGates(cand1Obj, existingStems, {
      existingContentHashes,
      existingNearDupSignatures,
      expectedLevel: 1,
      expectedSkill: 'reading',
      expectedPartType: cand1Row.part_type,
      requireLanguageQuality: true,
      requireDistractorRationales: true,
    });
    const c1Validation = validateCandidate(cand1Obj, existingStems, {
      existingContentHashes,
      existingNearDupSignatures,
      expectedLevel: 1,
      expectedSkill: 'reading',
      expectedPartType: cand1Row.part_type,
      requireLanguageQuality: true,
      requireDistractorRationales: true,
    });
    const c1FormatCheck = validateFormatCompatibility({ ...cand1Obj, sixGates: c1SixGates, validation: c1Validation, status: 'pending' }, 1);
    const c1VocabCheck = verifyQuestionVocab(cand1Obj, 1);

    results.push({
      index: 1,
      batchId: pilotBatchId,
      questionId: cand1Row.id,
      level: 1,
      skill: 'reading',
      partType: cand1Row.part_type,
      topic: cand1Row.topic,
      blueprintVersion: 'HSK 1 Official (Hanban/CTI Blueprint v2015/v3.0)',
      providerUsed: 'groq-llama-3.3',
      modelUsed: 'qwen/qwen3.8-27b',
      durationMs: 1938,
      candidate: cand1Obj,
      rawCompletedStem: undefined,
      canonicalCompletedStem: cand1Obj.completed_stem,
      testedVocab: [],
      sixGates: c1SixGates,
      validation: c1Validation,
      formatCheck: c1FormatCheck,
      vocabCheck: c1VocabCheck,
      dbStatus: 'pending',
      contentHash: cand1Row.content_hash,
    });
    console.log(`✓ Loaded Candidate #1 [ID: ${cand1Row.id}] into batch results.`);
  }

  for (let i = 1; i < pilotConfigs.length; i++) {
    if (totalOutboundHttpRequests >= MAX_HTTP_REQUEST_BUDGET) {
      console.warn(`[Budget Limit] Maximum HTTP request budget (${MAX_HTTP_REQUEST_BUDGET}) reached. Halting pilot.`);
      break;
    }

    const config = pilotConfigs[i];
    const itemNum = i + 1;
    console.log(`--- [Question ${itemNum}/5] Generating ${config.partType} (Topic: ${config.topic}) ---`);

    const itemStartTime = Date.now();
    let waterfallResult: any;

    try {
      waterfallResult = await generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        part_type: config.partType,
        count: 1,
        topic: config.topic,
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
        console.warn(`[Rate Limit Hit] Groq TPM limit encountered on question ${itemNum}. RetryAfter: ${retryAfterMs}ms`);

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
            level: 1,
            skill: 'reading',
            part_type: config.partType,
            count: 1,
            topic: config.topic,
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
    const canonicalCompletedStem = candidate.canonical_completed_stem || candidate.completed_stem;

    // Compute hashes
    const cHash = computeContentHash(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0, candidate.options_images);
    const nearSig = computeNearDuplicateSignature(candidate.stem, candidate.options || []);

    // Validate Six Gates
    const sixGates = evaluateCandidateSixGates(candidate, existingStems, {
      existingContentHashes,
      existingNearDupSignatures,
      expectedLevel: 1,
      expectedSkill: 'reading',
      expectedPartType: config.partType,
      requireLanguageQuality: true,
      requireDistractorRationales: true,
    });

    const validation = validateCandidate(candidate, existingStems, {
      existingContentHashes,
      existingNearDupSignatures,
      expectedLevel: 1,
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
      1
    );
    const vocabCheck = verifyQuestionVocab(candidate, 1);

    const questionId = `pend_pilot3_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

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
      1,
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
    if (nearSig) existingNearDupSignatures.add(nearSig);

    results.push({
      index: itemNum,
      batchId: pilotBatchId,
      questionId,
      level: 1,
      skill: 'reading',
      partType: config.partType,
      topic: config.topic,
      blueprintVersion: 'HSK 1 Official (Hanban/CTI Blueprint v2015/v3.0)',
      providerUsed: waterfallResult?.providerUsed || 'groq-llama-3.3',
      modelUsed: waterfallResult?.modelUsed || 'qwen/qwen3.8-27b',
      tokenUsage: waterfallResult?.tokenUsage,
      requestId: waterfallResult?.requestId,
      finishReason: waterfallResult?.finishReason,
      durationMs,
      candidate,
      rawCompletedStem,
      canonicalCompletedStem,
      testedVocab: candidate.tested_vocab,
      sixGates,
      validation,
      formatCheck,
      vocabCheck,
      dbStatus: 'pending',
      contentHash: cHash,
    });

    console.log(`✓ Stored candidate #${itemNum} [ID: ${questionId}]:`);
    console.log(`   Stem: ${candidate.stem}`);
    console.log(`   Options: ${JSON.stringify(candidate.options)} | Correct: [${candidate.answer_idx}] ${candidate.options?.[candidate.answer_idx ?? 0]}`);
    console.log(`   Six Gates Passed: ${sixGates.allPassed}`);
    console.log(`   Validation Errors: ${validation.errors.length} -> [${validation.errors.join('; ')}]`);
    console.log(`   Vocab Check: AboveLevel: ${vocabCheck.aboveLevel.length}, OutOfSyllabus: ${vocabCheck.outOfSyllabus.length}, IsValid: ${vocabCheck.isValidForLevel}`);
    console.log(`   Staging Status: pending (Strictly not auto-approved)\n`);

    // Pacing between generation requests to avoid free tier TPM burst limits
    if (i < pilotConfigs.length - 1 && totalOutboundHttpRequests < MAX_HTTP_REQUEST_BUDGET) {
      console.log(`[Pacing] Waiting 12000ms between calls to respect Groq Free Tier TPM...`);
      await sleep(12000);
    }
  }

  // 5. Post-Flight Invariant Checks
  console.log('=== POST-PILOT 3 INVARIANT CHECKS ===');
  const opQBankHashAfter = getFileSha256(opQBank);
  const opHskHashAfter = getFileSha256(opHsk);
  console.log(`✓ Operational QBank DB Hash After:  ${opQBankHashAfter}`);
  console.log(`✓ Operational HSK DB Hash After:    ${opHskHashAfter}`);

  const qbankIntact = opQBankHashAfter === expectedQBankHash;
  const hskIntact = opHskHashAfter === expectedHskHash;

  if (!qbankIntact || !hskIntact) {
    throw new Error(`CRITICAL_FAILURE: Operational database modified during pilot!`);
  }
  console.log('✓ Operational databases 100% UNMODIFIED and INTACT.\n');

  // Verify serving pool leak: 0 questions in operational DB, 0 questions in staging questions/exam_eligible_pool
  const stagingQuestionsWithBatch = (db.prepare('SELECT count(*) as count FROM questions WHERE batch_id = ?').get(pilotBatchId) as any).count;
  const stagingPoolWithBatch = (db.prepare(`
    SELECT count(*) as count 
    FROM exam_eligible_pool p 
    INNER JOIN pending_questions pq ON p.question_id = pq.id 
    WHERE pq.batch_id = ?
  `).get(pilotBatchId) as any).count;

  console.log(`✓ Staging questions table leak check (batch_id=${pilotBatchId}): ${stagingQuestionsWithBatch} (Expected: 0)`);
  console.log(`✓ Staging exam_eligible_pool leak check (batch_id=${pilotBatchId}): ${stagingPoolWithBatch} (Expected: 0)`);

  const pendingCountAfter = (db.prepare('SELECT count(*) as count FROM pending_questions').get() as any).count;
  console.log(`✓ Pending questions in Staging DB after pilot: ${pendingCountAfter} (+${pendingCountAfter - pendingCountBefore})\n`);

  // Save intermediate manifest for audit report generation
  const manifestData = {
    batchId: pilotBatchId,
    timestamp: new Date().toISOString(),
    totalOutboundHttpRequests,
    successfulHttpResponses,
    rateLimitedHttpResponses,
    failedHttpResponses,
    maxBudget: MAX_HTTP_REQUEST_BUDGET,
    preflight: {
      opQBankHashBefore,
      opHskHashBefore,
      opQBankHashAfter,
      opHskHashAfter,
      qbankIntact,
      hskIntact,
    },
    httpTelemetryLog,
    results,
  };

  const manifestPath = path.resolve('artifacts/audit/CONTROLLED_PILOT_3_MANIFEST.json');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');
  console.log(`✓ Manifest written to: ${manifestPath}`);
  console.log('=== PILOT 3 EXECUTION COMPLETE ===');
}

runControlledPilot3().catch((err) => {
  console.error('PILOT 3 RUNTIME CRASH:', err);
  process.exit(1);
});
