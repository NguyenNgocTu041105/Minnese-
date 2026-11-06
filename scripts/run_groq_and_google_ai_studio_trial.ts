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

export interface TrialItemResult {
  provider: 'groq' | 'google_ai_studio';
  modelUsed: string;
  testCase: string;
  level: number;
  skill: string;
  partType: string;
  targetGrammar?: string;
  topic?: string;
  candidate?: CandidateQuestion;
  sixGates?: ReturnType<typeof evaluateCandidateSixGates>;
  validation?: ReturnType<typeof validateCandidate>;
  formatCheck?: ReturnType<typeof validateFormatCompatibility>;
  vocabCheck?: ReturnType<typeof verifyQuestionVocab>;
  dbStatus: 'pending';
  questionId?: string;
  contentHash?: string;
  durationMs: number;
  httpStatus: number;
  tokenUsage?: any;
  error?: string;
}

export interface ProviderExecutionSummary {
  provider: string;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  status: 'COMPLETED' | 'BLOCKED_FREE_TIER_EXHAUSTED' | 'FAILED';
  notes: string;
}

export async function runGroqAndGoogleAiStudioTrial(): Promise<void> {
  console.log('=== MINNESE: GROQ & GOOGLE AI STUDIO COMPARATIVE TRIAL ===\n');

  // 1. Guardrails & Database Verification
  process.env.MINNESE_STAGING = 'true';
  process.env.QBANK_LLM_MODE = 'free';
  process.env.QBANK_LLM_FREE_ONLY = 'true';
  process.env.QBANK_LLM_ALLOW_PAID = 'false';
  process.env.QBANK_LLM_MAX_RETRIES = '0';
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
    throw new Error('BLOCKED: Operational database hash mismatch before run!');
  }

  const stagingDbPath = getQBankDbPath();
  const db = new DatabaseSync(stagingDbPath);
  console.log(`✓ Connected to Staging DB: ${stagingDbPath}`);

  // Load existing hashes and signatures for dedup
  const existingRows = db.prepare('SELECT content_hash, near_duplicate_signature, stem FROM pending_questions').all() as any[];
  const existingContentHashes = new Set<string>();
  const existingNearDupSignatures = new Set<string>();
  const existingStems: string[] = [];

  for (const r of existingRows) {
    if (r.content_hash) existingContentHashes.add(r.content_hash);
    if (r.near_duplicate_signature) existingNearDupSignatures.add(r.near_duplicate_signature);
    if (r.stem) existingStems.push(r.stem);
  }
  console.log(`✓ Loaded ${existingRows.length} existing staging candidates for deduplication.\n`);

  const testTargets = [
    {
      caseId: 'Test 1 — HSK 2: Điền từ và đáp án duy nhất',
      level: 2,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      target_grammar: 'GP_L2_ER_VS_LIANG',
      topic: 'shopping_numbers',
      blueprint_version: 'HSK 2 Official (CLEC HSK 3.0 Band 2)',
    },
    {
      caseId: 'Test 2 — HSK 2: Đọc hiểu ngắn',
      level: 2,
      skill: 'reading',
      part_type: 'read_comprehension_short_3opt',
      target_grammar: 'GP_L2_CONNECTIVE_YINWEI_SUOYI',
      topic: 'daily_activities',
      blueprint_version: 'HSK 2 Official (CLEC HSK 3.0 Band 2)',
    },
    {
      caseId: 'Test 3 — HSK 1: Nghe hỏi–đáp',
      level: 1,
      skill: 'listening',
      part_type: 'listen_question_answer_3opt',
      topic: 'daily_life',
      blueprint_version: 'HSK 1 Official (CLEC HSK 3.0 Band 1)',
    },
  ];

  const results: TrialItemResult[] = [];
  const providerSummaries: ProviderExecutionSummary[] = [];

  // =========================================================================
  // PROVIDER 1: Google AI Studio (Free Tier Preflight & Controlled Trial)
  // =========================================================================
  console.log('--- EXECUTING PROVIDER 1: Google AI Studio (Free Tier) ---');
  const googleApiKey = process.env.GEMINI_API_KEY?.trim();
  let googleRequestsMade = 0;
  let googleSuccess = 0;
  let googleFailed = 0;
  let googleBlockedReason = '';

  if (!googleApiKey) {
    console.log('⚠️ GEMINI_API_KEY not configured. Skipping Google AI Studio.');
    providerSummaries.push({
      provider: 'Google AI Studio',
      model: 'gemini-3.8-flash',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      status: 'BLOCKED_FREE_TIER_EXHAUSTED',
      notes: 'GEMINI_API_KEY is missing from environment.',
    });
  } else {
    // Attempt generation for the 3 target test cases with max 3 requests
    for (let i = 0; i < testTargets.length; i++) {
      if (googleRequestsMade >= 3) break;
      const target = testTargets[i];
      googleRequestsMade++;
      console.log(`[Google AI Studio Req ${googleRequestsMade}/3] ${target.caseId}`);

      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        // Call Google AI Studio OpenAI-compatible chat completions or native endpoint
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a Chinese HSK exam generator. Output strict JSON array of 1 question for HSK ${target.level}, skill: ${target.skill}, part_type: ${target.part_type}, target_grammar: ${target.target_grammar || 'standard'}. Fields: stem, options (array of strings), answer_idx (number), explanation_vi (Vietnamese explanation). Output ONLY raw JSON.`,
                    },
                  ],
                },
              ],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);
        const durationMs = Date.now() - start;
        const data = await res.json() as any;

        if (data.error) {
          googleFailed++;
          googleBlockedReason = `HTTP ${data.error.code || res.status}: ${data.error.message}`;
          console.log(`  ❌ Google AI Studio Error: ${googleBlockedReason}`);
          results.push({
            provider: 'google_ai_studio',
            modelUsed: 'gemini-3.8-flash',
            testCase: target.caseId,
            level: target.level,
            skill: target.skill,
            partType: target.part_type,
            targetGrammar: target.target_grammar,
            topic: target.topic,
            dbStatus: 'pending',
            durationMs,
            httpStatus: data.error.code || res.status,
            error: data.error.message,
          });

          // If capacity is exhausted / 503 / 429, don't hammer the API; halt immediately
          if (data.error.code === 503 || data.error.status === 'UNAVAILABLE' || data.error.message?.includes('high demand')) {
            console.log('  ⚠️ Google AI Studio Free Tier capacity exhausted (Spikes in demand / 503). Halting further requests per safety rules.');
            break;
          }
        } else {
          // Success parsing response
          googleSuccess++;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          console.log(`  ✓ Google AI Studio responded in ${durationMs}ms`);
          // Parse candidate
          const normalized = normalizeQuestionList(text);
          if (normalized.length > 0) {
            const candidate = normalized[0];
            candidate.level = target.level;
            candidate.skill = target.skill as any;
            candidate.part_type = target.part_type;
            const qId = `pend_gemini_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
            const contentHash = computeContentHash(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0);
            const nearDup = computeNearDuplicateSignature(candidate.stem, candidate.options || []);

            const sixGates = evaluateCandidateSixGates(candidate, existingStems, {
              existingContentHashes,
              existingNearDupSignatures,
              expectedLevel: target.level,
              expectedSkill: target.skill,
              expectedPartType: target.part_type,
              requireLanguageQuality: true,
              requireDistractorRationales: true,
            });

            const validation = validateCandidate(candidate, existingStems, {
              expectedLevel: target.level,
              expectedSkill: target.skill,
              expectedPartType: target.part_type,
            });

            const formatCheck = validateFormatCompatibility(
              { ...candidate, id: qId, status: 'pending', is_active: 0, sixGates, validation },
              target.level
            );

            const vocabCheck = verifyQuestionVocab(
              { stem: candidate.stem, options: candidate.options, answer_idx: candidate.answer_idx, audio_text: (candidate as any).audio_text },
              target.level
            );

            results.push({
              provider: 'google_ai_studio',
              modelUsed: 'gemini-3.8-flash',
              testCase: target.caseId,
              level: target.level,
              skill: target.skill,
              partType: target.part_type,
              targetGrammar: target.target_grammar,
              topic: target.topic,
              candidate,
              sixGates,
              validation,
              formatCheck,
              vocabCheck,
              dbStatus: 'pending',
              questionId: qId,
              contentHash,
              durationMs,
              httpStatus: 200,
            });

            // Insert candidate into staging db strictly in pending status
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
                ?, ?, 0, ?
              )
            `);

            insertStmt.run(
              qId,
              candidate.stem,
              JSON.stringify(candidate.options || []),
              Number(candidate.answer_idx ?? 0),
              candidate.pinyin || '',
              candidate.explanation_vi || 'Giải thích chuẩn',
              target.level,
              target.skill,
              target.part_type,
              candidate.illustration_theme || null,
              'google_ai_studio/gemini-3.8-flash',
              contentHash,
              target.topic || null,
              'trial_google_1',
              nearDup,
              JSON.stringify(vocabCheck.tested || []),
              candidate.passage || null,
              candidate.options_images ? JSON.stringify(candidate.options_images) : null
            );
          }
        }
      } catch (err: any) {
        googleFailed++;
        const durationMs = Date.now() - start;
        console.log(`  ❌ Request failed/aborted: ${err.message}`);
        results.push({
          provider: 'google_ai_studio',
          modelUsed: 'gemini-3.8-flash',
          testCase: target.caseId,
          level: target.level,
          skill: target.skill,
          partType: target.part_type,
          targetGrammar: target.target_grammar,
          topic: target.topic,
          dbStatus: 'pending',
          durationMs,
          httpStatus: 0,
          error: err.message,
        });
        break;
      }
    }

    providerSummaries.push({
      provider: 'Google AI Studio',
      model: 'gemini-3.8-flash',
      totalRequests: googleRequestsMade,
      successfulRequests: googleSuccess,
      failedRequests: googleFailed,
      status: googleFailed > 0 && googleSuccess === 0 ? 'BLOCKED_FREE_TIER_EXHAUSTED' : 'COMPLETED',
      notes: googleBlockedReason || (googleSuccess > 0 ? 'Generated questions successfully' : 'No requests made'),
    });
  }

  // =========================================================================
  // PROVIDER 2: Groq Cloud Free Tier (Controlled Trial)
  // =========================================================================
  console.log('\n--- EXECUTING PROVIDER 2: Groq Cloud Free Tier (qwen/qwen3.8-27b) ---');
  let groqRequestsMade = 0;
  let groqSuccess = 0;
  let groqFailed = 0;

  for (let i = 0; i < testTargets.length; i++) {
    if (groqRequestsMade >= 3) break;
    const target = testTargets[i];

    if (groqRequestsMade > 0) {
      console.log('  [Cooldown] Waiting 20s to strictly prevent Groq Free Tier TPM/RPD rate-limits...');
      await sleep(20000);
    }

    groqRequestsMade++;
    console.log(`[Groq Req ${groqRequestsMade}/3] ${target.caseId}`);

    const start = Date.now();
    try {
      const genRes = await generateWaterfallQuestions({
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

      const raw = genRes?.questions?.[0];
      const durationMs = Date.now() - start;

      if (!raw) {
        groqFailed++;
        console.log('  ⚠️ No question returned from Groq');
        continue;
      }

      const normalized = normalizeQuestionList([raw]);
      if (normalized.length === 0) {
        groqFailed++;
        console.log('  ⚠️ Could not normalize question from Groq');
        continue;
      }

      groqSuccess++;
      const candidate = normalized[0];
      candidate.level = target.level;
      candidate.skill = target.skill as any;
      candidate.part_type = target.part_type;

      const qId = `pend_groq_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const contentHash = computeContentHash(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0, candidate.options_images);
      const nearDup = computeNearDuplicateSignature(candidate.stem, candidate.options || []);

      const sixGates = evaluateCandidateSixGates(candidate, existingStems, {
        existingContentHashes,
        existingNearDupSignatures,
        expectedLevel: target.level,
        expectedSkill: target.skill,
        expectedPartType: target.part_type,
        requireLanguageQuality: true,
        requireDistractorRationales: true,
      });

      const validation = validateCandidate(candidate, existingStems, {
        expectedLevel: target.level,
        expectedSkill: target.skill,
        expectedPartType: target.part_type,
      });

      const formatCheck = validateFormatCompatibility(
        { ...candidate, id: qId, status: 'pending', is_active: 0, sixGates, validation },
        target.level
      );

      const vocabCheck = verifyQuestionVocab(
        { stem: candidate.stem, options: candidate.options, answer_idx: candidate.answer_idx, audio_text: (candidate as any).audio_text },
        target.level
      );

      console.log(`  ✓ Groq Stem: "${candidate.stem}" | Answer [${candidate.answer_idx}]: "${candidate.options[candidate.answer_idx]}"`);
      console.log(`    Six Gates: ${sixGates.allPassed ? 'PASS' : 'FAIL'} | G6 Blind Solve: ${sixGates.gate6_blind_solve.passed ? 'PASS' : 'FAIL'} [${validation.solverAnalysis?.semantic_uniqueness_status || 'UNKNOWN'}]`);
      if (validation.solverAnalysis?.reason) {
        console.log(`    Ambiguity Note: ${validation.solverAnalysis.reason}`);
      }
      console.log(`    Format Compat: practice=${formatCheck.practice_format_compatible}, exam=${formatCheck.exam_format_compatible}`);
      console.log(`    Operational Serving Eligible: ${formatCheck.operational_serving_eligible ? 'YES' : 'NO (FAIL-CLOSED)'}`);

      results.push({
        provider: 'groq',
        modelUsed: 'qwen/qwen3.8-27b',
        testCase: target.caseId,
        level: target.level,
        skill: target.skill,
        partType: target.part_type,
        targetGrammar: target.target_grammar,
        topic: target.topic,
        candidate,
        sixGates,
        validation,
        formatCheck,
        vocabCheck,
        dbStatus: 'pending',
        questionId: qId,
        contentHash,
        durationMs,
        httpStatus: 200,
        tokenUsage: (genRes as any).tokenUsage,
      });

      existingStems.push(candidate.stem);
      existingContentHashes.add(contentHash);
      existingNearDupSignatures.add(nearDup);

      // Insert candidate into staging db strictly in pending status
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
          ?, ?, 0, ?
        )
      `);

      insertStmt.run(
        qId,
        candidate.stem,
        JSON.stringify(candidate.options || []),
        Number(candidate.answer_idx ?? 0),
        candidate.pinyin || '',
        candidate.explanation_vi || 'Giải thích chuẩn',
        target.level,
        target.skill,
        target.part_type,
        candidate.illustration_theme || null,
        'groq/qwen3.8-27b',
        contentHash,
        target.topic || null,
        'trial_groq_1',
        nearDup,
        JSON.stringify(vocabCheck.tested || []),
        candidate.passage || null,
        candidate.options_images ? JSON.stringify(candidate.options_images) : null
      );
    } catch (err: any) {
      groqFailed++;
      console.log(`  ❌ Groq Request Error: ${err.message}`);
      results.push({
        provider: 'groq',
        modelUsed: 'qwen/qwen3.8-27b',
        testCase: target.caseId,
        level: target.level,
        skill: target.skill,
        partType: target.part_type,
        targetGrammar: target.target_grammar,
        topic: target.topic,
        dbStatus: 'pending',
        durationMs: Date.now() - start,
        httpStatus: 500,
        error: err.message,
      });
    }
  }

  providerSummaries.push({
    provider: 'Groq Cloud',
    model: 'qwen/qwen3.8-27b',
    totalRequests: groqRequestsMade,
    successfulRequests: groqSuccess,
    failedRequests: groqFailed,
    status: groqSuccess > 0 ? 'COMPLETED' : 'FAILED',
    notes: `Successfully executed ${groqSuccess}/${groqRequestsMade} requests under Free Tier.`,
  });

  // Re-verify Operational DB Hashes
  const opQBankHashAfter = getFileSha256(opQBank);
  const opHskHashAfter = getFileSha256(opHsk);
  console.log(`\n✓ Operational QBank DB Hash After:  ${opQBankHashAfter}`);
  console.log(`✓ Operational HSK DB Hash After:    ${opHskHashAfter}`);

  if (opQBankHashAfter !== expectedQBankHash || opHskHashAfter !== expectedHskHash) {
    throw new Error('CRITICAL VIOLATION: Operational database modified during trial!');
  }

  // Save Telemetry
  const telemetryOutput = {
    batchId: `trial_compare_${Date.now()}`,
    timestamp: new Date().toISOString(),
    operationalDbHashes: {
      expected: { qbank: expectedQBankHash, hsk_exam: expectedHskHash },
      before: { qbank: opQBankHashBefore, hsk_exam: opHskHashBefore },
      after: { qbank: opQBankHashAfter, hsk_exam: opHskHashAfter },
      invariantMatch: true,
    },
    providerSummaries,
    results,
  };

  const outPath = path.resolve('artifacts/audit/groq_google_ai_studio_trial_data.json');
  fs.writeFileSync(outPath, JSON.stringify(telemetryOutput, null, 2), 'utf8');
  console.log(`\n✓ Comparative Trial Data written to: ${outPath}`);
  console.log('=== TRIAL COMPLETED SUCCESSFULLY ===');
}

runGroqAndGoogleAiStudioTrial().catch((err) => {
  console.error('Fatal Trial Error:', err);
  process.exit(1);
});
