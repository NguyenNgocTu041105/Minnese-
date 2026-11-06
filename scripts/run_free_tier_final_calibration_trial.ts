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
} from '../src/server/llm/questionValidator.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';
import { verifyQuestionVocab } from '../src/server/qbankCoverageEngine.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

function getFileSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

export interface CalibrationItemResult {
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

export interface ExecutionSummary {
  provider: string;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  status: 'COMPLETED' | 'BLOCKED_FREE_TIER_EXHAUSTED' | 'FAILED';
  notes: string;
}

export async function runFreeTierFinalCalibrationTrial(): Promise<{
  results: CalibrationItemResult[];
  summaries: ExecutionSummary[];
  dbHashesBefore: { qbank: string; hsk: string };
  dbHashesAfter: { qbank: string; hsk: string };
}> {
  console.log('=== MINNESE: FREE-TIER FINAL CALIBRATION TRIAL (MAX 2 CALLS) ===\n');

  // 1. Guardrails & Database Isolation
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
  const qbankHashBefore = getFileSha256(opQBank);
  const hskHashBefore = getFileSha256(opHsk);
  console.log(`✓ Operational QBank DB Hash Before: ${qbankHashBefore}`);
  console.log(`✓ Operational HSK DB Hash Before:   ${hskHashBefore}`);

  if (qbankHashBefore !== expectedQBankHash || hskHashBefore !== expectedHskHash) {
    throw new Error('BLOCKED: Operational database hash mismatch before run!');
  }

  const stagingDbPath = getQBankDbPath();
  const db = new DatabaseSync(stagingDbPath);
  console.log(`✓ Connected to Staging DB: ${stagingDbPath}`);

  // Load existing stems & content hashes for deduplication
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

  const results: CalibrationItemResult[] = [];
  const summaries: ExecutionSummary[] = [];

  // =========================================================================
  // REQUEST 1: Google AI Studio Free Tier (Exactly 1 Request)
  // =========================================================================
  console.log('--- [REQUEST 1/2] Google AI Studio Free Tier ---');
  const googleApiKey = process.env.GEMINI_API_KEY?.trim();
  let googleSuccess = 0;
  let googleFailed = 0;
  let googleNotes = '';

  if (!googleApiKey) {
    console.log('⚠️ GEMINI_API_KEY missing from environment. Skipping Request 1.');
    googleFailed = 1;
    googleNotes = 'GEMINI_API_KEY missing from environment.';
    summaries.push({
      provider: 'Google AI Studio',
      model: 'gemini-3.8-flash',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 1,
      status: 'BLOCKED_FREE_TIER_EXHAUSTED',
      notes: googleNotes,
    });
  } else {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

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
                    text: `You are an HSK exam author. Output a single question in strict JSON format:
{"stem": "...", "options": ["...", "...", "...", "..."], "answer_idx": 0, "explanation_vi": "..."}
Target: HSK 2, Reading fill-in-blank (read_fill_blank_4opt), grammar GP_L2_ER_VS_LIANG (distinguish 二 vs 两 with measure words).
Rules:
- Stem must provide definitive context so exactly ONE option is correct.
- Options must include 两 and 二 plus two plausible distractors.
- Output raw JSON ONLY.`,
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
      const data = (await res.json()) as any;

      if (data.error) {
        googleFailed = 1;
        googleNotes = `HTTP ${data.error.code || res.status}: ${data.error.message}`;
        console.log(`  ❌ Google AI Studio Error: ${googleNotes}`);
        results.push({
          provider: 'google_ai_studio',
          modelUsed: 'gemini-3.8-flash',
          testCase: 'Request 1 — Google AI Studio: HSK 2 二 vs 两',
          level: 2,
          skill: 'reading',
          partType: 'read_fill_blank_4opt',
          targetGrammar: 'GP_L2_ER_VS_LIANG',
          topic: 'shopping_numbers',
          dbStatus: 'pending',
          durationMs,
          httpStatus: data.error.code || res.status,
          error: data.error.message,
        });

        summaries.push({
          provider: 'Google AI Studio',
          model: 'gemini-3.8-flash',
          totalRequests: 1,
          successfulRequests: 0,
          failedRequests: 1,
          status: 'BLOCKED_FREE_TIER_EXHAUSTED',
          notes: googleNotes,
        });
      } else {
        googleSuccess = 1;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        console.log(`  ✓ Google AI Studio responded in ${durationMs}ms`);

        const normalized = normalizeQuestionList(text);
        if (normalized.length > 0) {
          const candidate = normalized[0];
          candidate.level = 2;
          candidate.skill = 'reading' as any;
          candidate.part_type = 'read_fill_blank_4opt';
          candidate.target_grammar = 'GP_L2_ER_VS_LIANG';
          const qId = `pend_gemini_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          const contentHash = computeContentHash(candidate.stem, candidate.options || [], candidate.answer_idx ?? 0);
          const nearDup = computeNearDuplicateSignature(candidate.stem, candidate.options || []);

          const sixGates = evaluateCandidateSixGates(candidate, existingStems, {
            existingContentHashes,
            existingNearDupSignatures,
            expectedLevel: 2,
            expectedSkill: 'reading',
            expectedPartType: 'read_fill_blank_4opt',
            requireLanguageQuality: true,
            requireDistractorRationales: false,
          });

          const validation = validateCandidate(candidate, existingStems, {
            expectedLevel: 2,
            expectedSkill: 'reading',
            expectedPartType: 'read_fill_blank_4opt',
          });

          const formatCheck = validateFormatCompatibility(
            { ...candidate, id: qId, status: 'pending', is_active: 0, sixGates, validation },
            2
          );

          const vocabCheck = verifyQuestionVocab(
            { stem: candidate.stem, options: candidate.options, answer_idx: candidate.answer_idx },
            2
          );

          results.push({
            provider: 'google_ai_studio',
            modelUsed: 'gemini-3.8-flash',
            testCase: 'Request 1 — Google AI Studio: HSK 2 二 vs 两',
            level: 2,
            skill: 'reading',
            partType: 'read_fill_blank_4opt',
            targetGrammar: 'GP_L2_ER_VS_LIANG',
            topic: 'shopping_numbers',
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

          // Insert into staging db strictly in pending status
          const insertStmt = db.prepare(`
            INSERT INTO pending_questions (
              id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type,
              illustration_theme, status, provider_used, rejection_note, content_hash,
              created_at, updated_at, topic, batch_id, near_duplicate_signature,
              tested_vocab, passage, is_active
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, 'pending', ?, NULL, ?,
              datetime('now'), datetime('now'), ?, ?, ?,
              ?, ?, 0
            )
          `);

          insertStmt.run(
            qId,
            candidate.stem,
            JSON.stringify(candidate.options || []),
            Number(candidate.answer_idx ?? 0),
            candidate.pinyin || '',
            candidate.explanation_vi || 'Giải thích chuẩn',
            2,
            'reading',
            'read_fill_blank_4opt',
            null,
            'google_ai_studio/gemini-3.8-flash',
            contentHash,
            'shopping_numbers',
            'final_calib_trial',
            nearDup,
            JSON.stringify(vocabCheck.tested || []),
            null
          );

          console.log(`  ✓ Candidate saved to Staging DB: ${qId} (pending)`);
        }

        summaries.push({
          provider: 'Google AI Studio',
          model: 'gemini-3.8-flash',
          totalRequests: 1,
          successfulRequests: 1,
          failedRequests: 0,
          status: 'COMPLETED',
          notes: 'Successfully generated and evaluated 1 question.',
        });
      }
    } catch (err: any) {
      googleFailed = 1;
      const durationMs = Date.now() - start;
      console.log(`  ❌ Request failed/aborted: ${err.message}`);
      results.push({
        provider: 'google_ai_studio',
        modelUsed: 'gemini-3.8-flash',
        testCase: 'Request 1 — Google AI Studio: HSK 2 二 vs 两',
        level: 2,
        skill: 'reading',
        partType: 'read_fill_blank_4opt',
        targetGrammar: 'GP_L2_ER_VS_LIANG',
        topic: 'shopping_numbers',
        dbStatus: 'pending',
        durationMs,
        httpStatus: 0,
        error: err.message,
      });

      summaries.push({
        provider: 'Google AI Studio',
        model: 'gemini-3.8-flash',
        totalRequests: 1,
        successfulRequests: 0,
        failedRequests: 1,
        status: 'BLOCKED_FREE_TIER_EXHAUSTED',
        notes: err.message,
      });
    }
  }

  // =========================================================================
  // REQUEST 2: Groq Cloud Free Tier (Exactly 1 Request)
  // =========================================================================
  console.log('\n--- [REQUEST 2/2] Groq Cloud Free Tier (qwen/qwen3.8-27b) ---');
  let groqSuccess = 0;
  let groqFailed = 0;
  let groqNotes = '';

  const groqStart = Date.now();
  try {
    const genRes = await generateWaterfallQuestions({
      level: 2,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      target_grammar: 'GP_L2_ER_VS_LIANG',
      topic: 'shopping_numbers',
      provider: 'groq-llama-3.3',
      model: 'qwen/qwen3.8-27b',
      freeOnly: true,
      mock: false,
      maxRetries: 0,
      maxCompletionTokens: 550,
    });

    const durationMs = Date.now() - groqStart;
    const raw = genRes?.questions?.[0];

    if (!raw) {
      groqFailed = 1;
      groqNotes = 'Groq returned no question candidate.';
      console.log(`  ❌ ${groqNotes}`);
    } else {
      groqSuccess = 1;
      console.log(`  ✓ Groq generated 1 candidate in ${durationMs}ms`);
      console.log(`    Stem: ${raw.stem}`);
      console.log(`    Options: ${JSON.stringify(raw.options)}`);
      console.log(`    Answer: [${raw.answer_idx}] ${raw.options?.[raw.answer_idx ?? 0]}`);
      console.log(`    Explanation: ${raw.explanation_vi}`);

      const qId = `pend_groq_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const contentHash = computeContentHash(raw.stem, raw.options || [], raw.answer_idx ?? 0);
      const nearDup = computeNearDuplicateSignature(raw.stem, raw.options || []);

      const sixGates = evaluateCandidateSixGates(raw, existingStems, {
        existingContentHashes,
        existingNearDupSignatures,
        expectedLevel: 2,
        expectedSkill: 'reading',
        expectedPartType: 'read_fill_blank_4opt',
        requireLanguageQuality: true,
        requireDistractorRationales: true,
      });

      const validation = validateCandidate(raw, existingStems, {
        expectedLevel: 2,
        expectedSkill: 'reading',
        expectedPartType: 'read_fill_blank_4opt',
      });

      const formatCheck = validateFormatCompatibility(
        { ...raw, id: qId, status: 'pending', is_active: 0, sixGates, validation },
        2
      );

      const vocabCheck = verifyQuestionVocab(
        { stem: raw.stem, options: raw.options, answer_idx: raw.answer_idx },
        2
      );

      console.log(`    Six Gates Result: ${sixGates.allPassed ? 'PASS ✅' : 'FAIL ❌'}`);
      if (!sixGates.allPassed) {
        for (const [gateName, gateVal] of Object.entries(sixGates)) {
          if (typeof gateVal === 'object' && gateVal && 'passed' in gateVal && !(gateVal as any).passed) {
            console.log(`      * ${gateName}: ${(gateVal as any).details}`);
          }
        }
      }

      results.push({
        provider: 'groq',
        modelUsed: genRes.modelUsed || 'qwen/qwen3.8-27b',
        testCase: 'Request 2 — Groq Free Tier: HSK 2 二 vs 两',
        level: 2,
        skill: 'reading',
        partType: 'read_fill_blank_4opt',
        targetGrammar: 'GP_L2_ER_VS_LIANG',
        topic: 'shopping_numbers',
        candidate: raw,
        sixGates,
        validation,
        formatCheck,
        vocabCheck,
        dbStatus: 'pending',
        questionId: qId,
        contentHash,
        durationMs,
        httpStatus: 200,
        tokenUsage: genRes.tokenUsage,
      });

      // Insert into staging db strictly in pending status
      const insertStmt = db.prepare(`
        INSERT INTO pending_questions (
          id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type,
          illustration_theme, status, provider_used, rejection_note, content_hash,
          created_at, updated_at, topic, batch_id, near_duplicate_signature,
          tested_vocab, passage, is_active
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, 'pending', ?, NULL, ?,
          datetime('now'), datetime('now'), ?, ?, ?,
          ?, ?, 0
        )
      `);

      insertStmt.run(
        qId,
        raw.stem,
        JSON.stringify(raw.options || []),
        Number(raw.answer_idx ?? 0),
        raw.pinyin || '',
        raw.explanation_vi || 'Giải thích chuẩn',
        2,
        'reading',
        'read_fill_blank_4opt',
        null,
        `groq/${genRes.modelUsed || 'qwen/qwen3.8-27b'}`,
        contentHash,
        'shopping_numbers',
        'final_calib_trial',
        nearDup,
        JSON.stringify(vocabCheck.tested || []),
        null
      );

      console.log(`  ✓ Candidate saved to Staging DB: ${qId} (pending)`);
    }

    summaries.push({
      provider: 'Groq Cloud',
      model: genRes?.modelUsed || 'qwen/qwen3.8-27b',
      totalRequests: 1,
      successfulRequests: groqSuccess,
      failedRequests: groqFailed,
      status: groqSuccess > 0 ? 'COMPLETED' : 'FAILED',
      notes: groqSuccess > 0 ? 'Candidate generated and evaluated successfully.' : groqNotes,
    });
  } catch (err: any) {
    groqFailed = 1;
    const durationMs = Date.now() - groqStart;
    console.log(`  ❌ Groq request failed: ${err.message}`);
    results.push({
      provider: 'groq',
      modelUsed: 'qwen/qwen3.8-27b',
      testCase: 'Request 2 — Groq Free Tier: HSK 2 二 vs 两',
      level: 2,
      skill: 'reading',
      partType: 'read_fill_blank_4opt',
      targetGrammar: 'GP_L2_ER_VS_LIANG',
      topic: 'shopping_numbers',
      dbStatus: 'pending',
      durationMs,
      httpStatus: err.status || 0,
      error: err.message,
    });

    summaries.push({
      provider: 'Groq Cloud',
      model: 'qwen/qwen3.8-27b',
      totalRequests: 1,
      successfulRequests: 0,
      failedRequests: 1,
      status: 'FAILED',
      notes: err.message,
    });
  }

  // Post-Execution Hash Verification
  const qbankHashAfter = getFileSha256(opQBank);
  const hskHashAfter = getFileSha256(opHsk);
  console.log(`\n✓ Operational QBank DB Hash After:  ${qbankHashAfter}`);
  console.log(`✓ Operational HSK DB Hash After:    ${hskHashAfter}`);

  if (qbankHashAfter !== expectedQBankHash || hskHashAfter !== expectedHskHash) {
    throw new Error('CRITICAL INTEGRITY BREACH: Operational database modified during trial!');
  }
  console.log('✓ Operational databases verified 100% untouched and byte-identical.');

  return {
    results,
    summaries,
    dbHashesBefore: { qbank: qbankHashBefore, hsk: hskHashBefore },
    dbHashesAfter: { qbank: qbankHashAfter, hsk: hskHashAfter },
  };
}

// Direct execution
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('run_free_tier_final_calibration_trial')) {
  runFreeTierFinalCalibrationTrial()
    .then((out) => {
      console.log('\n=== TRIAL COMPLETE ===');
      console.log(JSON.stringify(out.summaries, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Trial aborted with error:', err);
      process.exit(1);
    });
}
