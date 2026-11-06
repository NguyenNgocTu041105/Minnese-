/**
 * Challenger 2 (M3 Decoupling & 0-Valid Audit Logging Challenger)
 * Empirical Challenge Harness
 * File: tests/server/test_challenge_m3_2.ts
 *
 * Scenarios tested:
 * 1. Visual Workflow Decoupling Tests:
 *    - Non-visual question types (read_fill_blank_4opt, read_comprehension_4opt, etc.)
 *    - illustration_theme variants on non-visual: null, undefined, "", "none", "NONE", "None", "null", "NULL", "Null", "   " -> ALL PASS
 *    - Explicit valid SVG theme on non-visual: "taxi", "reading" -> PASS
 *    - Explicit invalid theme on non-visual: "spaceship" -> REJECT
 *    - isVisualQuestionType() mapping check across all question types
 *    - Visual question types (listen_choose_pic, listen_picture_match_4opt, etc.)
 *    - illustration_theme variants on visual: null, undefined, "", "none", "null", "   " -> ALL REJECT (required)
 *    - Visual question with non-27 theme "classroom": EMPIRICALLY TESTED AND ANALYZED (classroom not in 27 SVG scenes)
 *    - Visual question with valid 27 SVG themes: "taxi", "reading", "apple", "hospital", "bookshelf", "airplane", "TAXI" -> ALL PASS
 *    - Visual question with valid theme AND topic: illustration_theme="reading", topic="classroom" -> PASS
 * 2. 0-Valid Candidate Audit Logging Tests:
 *    - POST /api/qbank/generate with 0 valid candidates (100% rejected):
 *      a. EXACTLY 0 rows inserted into pending_questions (Zero-insert invariant)
 *      b. EXACTLY 1 row inserted into generation_runs with count_saved_pending=0, status='all_rejected', details containing failure reasons
 *      c. EXACTLY 1 row inserted into generation_history with corresponding metrics
 *    - dryRun=true mode: 0 rows in pending_questions, 0 rows in generation_runs, 0 rows in generation_history
 *    - Concurrency lock release verification after 0-valid run
 * 3. Database Safety Invariant:
 *    - Confirm data/hsk_exam.db SHA-256 = 10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD (6 rows)
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  validateCandidate,
  isVisualQuestionType,
  getComparableStem,
  computeContentHash,
} from '../../src/server/llm/questionValidator.js';
import {
  VALID_ILLUSTRATION_THEMES,
  isValidIllustrationTheme,
} from '../../src/server/llm/promptTemplates.js';
import {
  qbankRouter,
  ensurePendingSchema,
  setQBankAdminTokenForTesting,
  getDbSync,
} from '../../src/server/qbankRoutes.js';
import { CandidateQuestion } from '../../src/server/llm/types.js';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const TEST_ADMIN_TOKEN = 'test-token-challenger-m3-2-' + Date.now();

let server: http.Server;
let baseUrl: string;

interface ChallengeResult {
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: any;
}

const challengeResults: ChallengeResult[] = [];

function recordChallenge(
  category: string,
  name: string,
  passed: boolean,
  expected: string,
  actual: string,
  details?: any
) {
  challengeResults.push({ category, name, passed, expected, actual, details });
  const tag = passed ? '[PASS]' : '[FAIL]';
  console.log(`  ${tag} [${category}] ${name}`);
  if (!passed) {
    console.error(`         Expected: ${expected}`);
    console.error(`         Actual:   ${actual}`);
  }
}

function getDbHash(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Database file not found: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

async function startServer(): Promise<void> {
  process.env.QBANK_ADMIN_ENABLED = 'true';
  setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

  const app = express();
  app.use(express.json());
  app.use('/api/qbank', qbankRouter);

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}

async function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

// Baseline valid non-visual candidate
function makeNonVisualCandidate(overrides: Partial<CandidateQuestion> = {}): Partial<CandidateQuestion> {
  return {
    stem: '今天天气很好，我想去____借两本书。',
    options: ['学校', '医院', '商店', '机场'],
    answer_idx: 0,
    level: 1,
    skill: 'reading',
    part_type: 'read_fill_blank_4opt',
    explanation_vi: 'Trong ngữ cảnh mượn sách, trường học là địa điểm phù hợp nhất.',
    ...overrides,
  };
}

// Baseline valid visual candidate
function makeVisualCandidate(overrides: Partial<CandidateQuestion> = {}): Partial<CandidateQuestion> {
  return {
    stem: '请听录音并看图片，选出相符的一项。',
    options: ['出租车', '飞机', '火车', '公共汽车'],
    answer_idx: 0,
    level: 1,
    skill: 'listening',
    part_type: 'listen_choose_pic',
    illustration_theme: 'taxi',
    explanation_vi: 'Hình ảnh chiếc xe taxi màu vàng đang di chuyển trên đường.',
    ...overrides,
  };
}

async function runEmpiricalChallenges() {
  console.log('======================================================================');
  console.log('   CHALLENGER 2: M3 DECOUPLING & 0-VALID AUDIT LOGGING HARNESS       ');
  console.log('======================================================================\n');

  // Initial DB invariant check
  const preTestDbHash = getDbHash(LEGACY_DB_PATH);
  recordChallenge(
    'Database Invariant',
    'Pre-test data/hsk_exam.db SHA-256 matches expected',
    preTestDbHash === EXPECTED_LEGACY_DB_HASH,
    EXPECTED_LEGACY_DB_HASH,
    preTestDbHash
  );

  // ------------------------------------------------------------------
  // 1. Visual Workflow Decoupling Tests
  // ------------------------------------------------------------------
  console.log('\n--- 1. Visual Workflow Decoupling Tests ---');

  // 1.1 Non-visual with null
  const rNull = validateCandidate(makeNonVisualCandidate({ illustration_theme: null }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: null MUST pass',
    rNull.valid && rNull.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rNull.valid}, errors: ${rNull.errors.join('; ')}`
  );

  // 1.2 Non-visual with undefined (omitted)
  const candUndef = makeNonVisualCandidate();
  delete candUndef.illustration_theme;
  const rUndef = validateCandidate(candUndef);
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: undefined (omitted) MUST pass',
    rUndef.valid && rUndef.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rUndef.valid}, errors: ${rUndef.errors.join('; ')}`
  );

  // 1.3 Non-visual with "" (empty string)
  const rEmpty = validateCandidate(makeNonVisualCandidate({ illustration_theme: '' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: "" MUST pass',
    rEmpty.valid && rEmpty.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rEmpty.valid}, errors: ${rEmpty.errors.join('; ')}`
  );

  // 1.4 Non-visual with "none"
  const rNone = validateCandidate(makeNonVisualCandidate({ illustration_theme: 'none' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: "none" MUST pass',
    rNone.valid && rNone.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rNone.valid}, errors: ${rNone.errors.join('; ')}`
  );

  // 1.5 Non-visual with "null" string
  const rNullStr = validateCandidate(makeNonVisualCandidate({ illustration_theme: 'null' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: "null" (string) MUST pass',
    rNullStr.valid && rNullStr.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rNullStr.valid}, errors: ${rNullStr.errors.join('; ')}`
  );

  // 1.6 Non-visual with "NONE" (uppercase)
  const rNoneUpper = validateCandidate(makeNonVisualCandidate({ illustration_theme: 'NONE' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: "NONE" (uppercase) MUST pass',
    rNoneUpper.valid && rNoneUpper.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rNoneUpper.valid}, errors: ${rNoneUpper.errors.join('; ')}`
  );

  // 1.7 Non-visual with "NULL" (uppercase)
  const rNullUpper = validateCandidate(makeNonVisualCandidate({ illustration_theme: 'NULL' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: "NULL" (uppercase) MUST pass',
    rNullUpper.valid && rNullUpper.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rNullUpper.valid}, errors: ${rNullUpper.errors.join('; ')}`
  );

  // 1.8 Non-visual with "   " (whitespace only)
  const rWhitespace = validateCandidate(makeNonVisualCandidate({ illustration_theme: '   ' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with illustration_theme: "   " (whitespace) MUST pass',
    rWhitespace.valid && rWhitespace.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rWhitespace.valid}, errors: ${rWhitespace.errors.join('; ')}`
  );

  // 1.9 Non-visual question with valid SVG theme (allowed if provided)
  const rNonVisSvg = validateCandidate(makeNonVisualCandidate({ illustration_theme: 'reading' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with valid SVG theme "reading" MUST pass',
    rNonVisSvg.valid && rNonVisSvg.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rNonVisSvg.valid}, errors: ${rNonVisSvg.errors.join('; ')}`
  );

  // 1.10 Non-visual question with invalid theme MUST be rejected
  const rNonVisInvalid = validateCandidate(makeNonVisualCandidate({ illustration_theme: 'spaceship' }));
  recordChallenge(
    'Decoupling: Non-Visual',
    'Non-visual question with invalid theme "spaceship" MUST be rejected',
    !rNonVisInvalid.valid && rNonVisInvalid.errors.some((e) => e.includes('not one of the 27 supported SVG scenes')),
    'valid: false (rejected)',
    `valid: ${rNonVisInvalid.valid}, errors: ${rNonVisInvalid.errors.join('; ')}`
  );

  // 1.11 isVisualQuestionType predicate tests
  const visualTypes = [
    'listen_choose_pic',
    'listen_picture_match_4opt',
    'listen_picture_match_3opt',
    'read_sentence_picture_match_6opt',
    'listen_dialogue_picture_match_6opt',
    'tranh_chon_dapan',
    'look_image_choose',
  ];
  const nonVisualTypes = [
    'read_fill_blank_4opt',
    'read_comprehension_4opt',
    'write_sentence_reorder_4opt',
    'read_choose_answer',
    null,
    undefined,
    '',
    '   ',
  ];

  let allVisualMatch = true;
  for (const vt of visualTypes) {
    if (!isVisualQuestionType(vt)) {
      allVisualMatch = false;
      console.error(`      isVisualQuestionType failed for visual type: ${vt}`);
    }
  }
  recordChallenge(
    'Decoupling: Predicate',
    'isVisualQuestionType returns true for all visual part_types',
    allVisualMatch,
    'true for all visual types',
    allVisualMatch ? 'true for all' : 'failed for some'
  );

  let allNonVisualMatch = true;
  for (const nvt of nonVisualTypes) {
    if (isVisualQuestionType(nvt)) {
      allNonVisualMatch = false;
      console.error(`      isVisualQuestionType failed for non-visual type: ${nvt}`);
    }
  }
  recordChallenge(
    'Decoupling: Predicate',
    'isVisualQuestionType returns false for non-visual and null/empty types',
    allNonVisualMatch,
    'false for all non-visual types',
    allNonVisualMatch ? 'false for all' : 'failed for some'
  );

  // 1.12 Visual question (listen_choose_pic) with illustration_theme: null -> MUST FAIL
  const rVisNull = validateCandidate(makeVisualCandidate({ illustration_theme: null }));
  recordChallenge(
    'Decoupling: Visual',
    'Visual question (listen_choose_pic) with illustration_theme: null MUST FAIL',
    !rVisNull.valid && rVisNull.errors.some((e) => e.includes('illustration_theme is required')),
    'valid: false with illustration_theme required error',
    `valid: ${rVisNull.valid}, errors: ${rVisNull.errors.join('; ')}`
  );

  // 1.13 Visual question with illustration_theme: undefined -> MUST FAIL
  const candVisUndef = makeVisualCandidate();
  delete candVisUndef.illustration_theme;
  const rVisUndef = validateCandidate(candVisUndef);
  recordChallenge(
    'Decoupling: Visual',
    'Visual question (listen_choose_pic) with illustration_theme: undefined MUST FAIL',
    !rVisUndef.valid && rVisUndef.errors.some((e) => e.includes('illustration_theme is required')),
    'valid: false with illustration_theme required error',
    `valid: ${rVisUndef.valid}, errors: ${rVisUndef.errors.join('; ')}`
  );

  // 1.14 Visual question with illustration_theme: "" -> MUST FAIL
  const rVisEmpty = validateCandidate(makeVisualCandidate({ illustration_theme: '' }));
  recordChallenge(
    'Decoupling: Visual',
    'Visual question (listen_choose_pic) with illustration_theme: "" MUST FAIL',
    !rVisEmpty.valid && rVisEmpty.errors.some((e) => e.includes('illustration_theme is required')),
    'valid: false with illustration_theme required error',
    `valid: ${rVisEmpty.valid}, errors: ${rVisEmpty.errors.join('; ')}`
  );

  // 1.15 Visual question with illustration_theme: "none" -> MUST FAIL
  const rVisNone = validateCandidate(makeVisualCandidate({ illustration_theme: 'none' }));
  recordChallenge(
    'Decoupling: Visual',
    'Visual question (listen_choose_pic) with illustration_theme: "none" MUST FAIL',
    !rVisNone.valid && rVisNone.errors.some((e) => e.includes('illustration_theme is required')),
    'valid: false with illustration_theme required error',
    `valid: ${rVisNone.valid}, errors: ${rVisNone.errors.join('; ')}`
  );

  // 1.16 Visual question with illustration_theme: "null" -> MUST FAIL
  const rVisNullStr = validateCandidate(makeVisualCandidate({ illustration_theme: 'null' }));
  recordChallenge(
    'Decoupling: Visual',
    'Visual question (listen_choose_pic) with illustration_theme: "null" (string) MUST FAIL',
    !rVisNullStr.valid && rVisNullStr.errors.some((e) => e.includes('illustration_theme is required')),
    'valid: false with illustration_theme required error',
    `valid: ${rVisNullStr.valid}, errors: ${rVisNullStr.errors.join('; ')}`
  );

  // 1.17 Visual question with illustration_theme: "spaceship" (non-27 SVG theme) -> MUST FAIL
  const rVisSpaceship = validateCandidate(makeVisualCandidate({ illustration_theme: 'spaceship' }));
  recordChallenge(
    'Decoupling: Visual',
    'Visual question with unsupported theme "spaceship" MUST FAIL',
    !rVisSpaceship.valid && rVisSpaceship.errors.some((e) => e.includes('not one of the 27 supported SVG scenes')),
    'valid: false with not 27 supported SVG scenes error',
    `valid: ${rVisSpaceship.valid}, errors: ${rVisSpaceship.errors.join('; ')}`
  );

  // 1.18 EMPIRICAL ADVERSARIAL CHALLENGE: Visual question with illustration_theme: "classroom"
  // Note: Is "classroom" in the 27 supported SVG scenes? Let's check!
  const isClassroomSupported = isValidIllustrationTheme('classroom');
  const rVisClassroom = validateCandidate(makeVisualCandidate({ illustration_theme: 'classroom' }));
  recordChallenge(
    'Decoupling: Visual (Adversarial)',
    'Empirically evaluate illustration_theme: "classroom" against 27 SVG scenes',
    !isClassroomSupported && !rVisClassroom.valid && rVisClassroom.errors.some((e) => e.includes('not one of the 27 supported SVG scenes')),
    'classroom is NOT in 27 supported SVG scenes -> correctly rejected by validator',
    `isValidIllustrationTheme("classroom"): ${isClassroomSupported}, validator errors: ${rVisClassroom.errors.join('; ')}`,
    {
      finding: 'The 27 supported SVG scenes in HSKIllustrationCanvas.tsx and promptTemplates.ts do NOT include "classroom". Valid educational themes are "reading", "writing", "bookshelf", or "classroom" can be specified in the topic field.',
      supportedScenesCount: VALID_ILLUSTRATION_THEMES.length,
      sampleSupportedScenes: VALID_ILLUSTRATION_THEMES.slice(0, 10),
    }
  );

  // 1.19 Visual question with valid 27 SVG themes: "taxi", "reading", "apple", "hospital", "bookshelf"
  const testScenes = ['taxi', 'reading', 'apple', 'hospital', 'bookshelf', 'airplane', 'TAXI'];
  let allValidScenesPass = true;
  for (const sc of testScenes) {
    const rSc = validateCandidate(makeVisualCandidate({ illustration_theme: sc }));
    if (!rSc.valid || rSc.errors.length > 0) {
      allValidScenesPass = false;
      console.error(`      Valid SVG theme failed: ${sc}, errors: ${rSc.errors.join('; ')}`);
    }
  }
  recordChallenge(
    'Decoupling: Visual',
    'Visual question with valid 27 SVG themes (taxi, reading, apple, hospital, bookshelf, airplane, TAXI) MUST pass',
    allValidScenesPass,
    'valid: true for all 27 SVG scenes',
    allValidScenesPass ? 'all passed' : 'some failed'
  );

  // 1.20 Visual question with valid theme AND topic: "reading" + topic="classroom"
  const rVisTopic = validateCandidate(
    makeVisualCandidate({
      illustration_theme: 'reading',
      topic: 'classroom',
    })
  );
  recordChallenge(
    'Decoupling: Visual',
    'Visual question with valid SVG theme ("reading") and topic ("classroom") MUST pass',
    rVisTopic.valid && rVisTopic.errors.length === 0,
    'valid: true, errors: 0',
    `valid: ${rVisTopic.valid}, errors: ${rVisTopic.errors.join('; ')}`
  );

  // ------------------------------------------------------------------
  // 2. 0-Valid Candidate Audit Logging & Zero-Insert Invariant Tests
  // ------------------------------------------------------------------
  console.log('\n--- 2. 0-Valid Candidate Audit Logging & Zero-Insert Tests ---');

  await startServer();

  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    // Initial baseline counts in SQLite
    const prePendingCount = (db.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    const preRunsCount = (db.prepare('SELECT COUNT(*) as cnt FROM generation_runs').get() as any).cnt;
    const preHistoryCount = (db.prepare('SELECT COUNT(*) as cnt FROM generation_history').get() as any).cnt;

    // Trigger POST /api/qbank/generate where all generated mock candidates are deliberate duplicates (>85% similarity)
    // The mock template has '今天天气很好，我想去____借两本书。'
    // Let's call /api/qbank/generate with count: 2, mock: true, dryRun: false
    const genRes = await fetch(`${baseUrl}/api/qbank/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-QBank-Admin-Token': TEST_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        level: 1,
        skill: 'reading',
        count: 2,
        mock: true,
        dryRun: false,
      }),
    });

    const genData = await genRes.json();

    // Check HTTP status and JSON response contract
    recordChallenge(
      '0-Valid Audit: HTTP',
      'POST /api/qbank/generate responds with HTTP 200 on 0-valid run',
      genRes.status === 200,
      'HTTP 200',
      `HTTP ${genRes.status}`
    );

    recordChallenge(
      '0-Valid Audit: Response Contract',
      'Response reports count_saved_pending === 0 and count_rejected_validator > 0',
      genData.success === true && genData.count_saved_pending === 0 && genData.count_rejected_validator > 0,
      'success: true, count_saved_pending: 0, count_rejected_validator > 0',
      `success: ${genData.success}, count_saved_pending: ${genData.count_saved_pending}, count_rejected: ${genData.count_rejected_validator}`
    );

    recordChallenge(
      '0-Valid Audit: Questions Array',
      'Response questions array is empty (0 valid candidates returned)',
      Array.isArray(genData.questions) && genData.questions.length === 0,
      'questions: []',
      `questions length: ${genData.questions?.length}`
    );

    // Query SQLite database counts immediately after execution
    const postPendingCount = (db.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    const postRunsCount = (db.prepare('SELECT COUNT(*) as cnt FROM generation_runs').get() as any).cnt;
    const postHistoryCount = (db.prepare('SELECT COUNT(*) as cnt FROM generation_history').get() as any).cnt;

    // 2.a Zero-Insert Invariant: EXACTLY 0 rows inserted into pending_questions
    const deltaPending = postPendingCount - prePendingCount;
    recordChallenge(
      '0-Valid Audit: Zero-Insert Invariant',
      'EXACTLY 0 rows inserted into pending_questions (Zero-Insert Invariant)',
      deltaPending === 0,
      'delta pending_questions = 0',
      `delta pending_questions = ${deltaPending} (pre: ${prePendingCount}, post: ${postPendingCount})`
    );

    // 2.b EXACTLY 1 row inserted into generation_runs
    const deltaRuns = postRunsCount - preRunsCount;
    recordChallenge(
      '0-Valid Audit: generation_runs Row Count',
      'EXACTLY 1 row inserted into generation_runs',
      deltaRuns === 1,
      'delta generation_runs = 1',
      `delta generation_runs = ${deltaRuns} (pre: ${preRunsCount}, post: ${postRunsCount})`
    );

    // 2.c EXACTLY 1 row inserted into generation_history
    const deltaHistory = postHistoryCount - preHistoryCount;
    recordChallenge(
      '0-Valid Audit: generation_history Row Count',
      'EXACTLY 1 row inserted into generation_history',
      deltaHistory === 1,
      'delta generation_history = 1',
      `delta generation_history = ${deltaHistory} (pre: ${preHistoryCount}, post: ${postHistoryCount})`
    );

    // 2.d Inspect generation_runs audit record
    const latestRun = db.prepare('SELECT * FROM generation_runs ORDER BY created_at DESC, rowid DESC LIMIT 1').get() as any;
    recordChallenge(
      '0-Valid Audit: generation_runs Status',
      'generation_runs status is strictly "all_rejected"',
      latestRun && latestRun.status === 'all_rejected',
      'status === "all_rejected"',
      `status = "${latestRun?.status}"`
    );

    recordChallenge(
      '0-Valid Audit: generation_runs Metrics',
      'generation_runs count_saved_pending is 0 and count_rejected_validator matches generated count',
      latestRun && latestRun.count_saved_pending === 0 && latestRun.count_rejected_validator === latestRun.count_generated,
      'count_saved_pending = 0, count_rejected_validator = count_generated',
      `saved = ${latestRun?.count_saved_pending}, rejected = ${latestRun?.count_rejected_validator}, generated = ${latestRun?.count_generated}`
    );

    // 2.e Inspect generation_runs details JSON
    let runDetails: any = null;
    try {
      runDetails = JSON.parse(latestRun?.details || '{}');
    } catch {}

    recordChallenge(
      '0-Valid Audit: generation_runs Details Payload',
      'generation_runs details contains structured rejected_reasons and metrics',
      runDetails &&
        runDetails.valid_saved_count === 0 &&
        runDetails.rejected_count > 0 &&
        typeof runDetails.rejected_reasons === 'object',
      'valid_saved_count=0, rejected_count>0, rejected_reasons object present',
      `valid_saved_count=${runDetails?.valid_saved_count}, rejected_count=${runDetails?.rejected_count}, reasons=${JSON.stringify(runDetails?.rejected_reasons)}`
    );

    // 2.f Inspect generation_history audit record
    const latestHistory = db.prepare('SELECT * FROM generation_history ORDER BY created_at DESC, rowid DESC LIMIT 1').get() as any;
    recordChallenge(
      '0-Valid Audit: generation_history Parity',
      'generation_history matches generation_runs with status "all_rejected" and count_saved_pending 0',
      latestHistory && latestHistory.status === 'all_rejected' && latestHistory.count_saved_pending === 0,
      'status === "all_rejected", count_saved_pending === 0',
      `status = "${latestHistory?.status}", saved = ${latestHistory?.count_saved_pending}`
    );

    // 2.g Dry-Run Mode Stress Test: dryRun=true MUST NOT write to pending_questions, generation_runs, or generation_history
    const preDryPending = (db.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    const preDryRuns = (db.prepare('SELECT COUNT(*) as cnt FROM generation_runs').get() as any).cnt;
    const preDryHistory = (db.prepare('SELECT COUNT(*) as cnt FROM generation_history').get() as any).cnt;

    const dryRes = await fetch(`${baseUrl}/api/qbank/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-QBank-Admin-Token': TEST_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        level: 1,
        skill: 'reading',
        count: 2,
        mock: true,
        dryRun: true,
      }),
    });
    const dryData = await dryRes.json();

    const postDryPending = (db.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    const postDryRuns = (db.prepare('SELECT COUNT(*) as cnt FROM generation_runs').get() as any).cnt;
    const postDryHistory = (db.prepare('SELECT COUNT(*) as cnt FROM generation_history').get() as any).cnt;

    recordChallenge(
      '0-Valid Audit: dryRun Isolation',
      'dryRun=true persists 0 rows in pending_questions, generation_runs, and generation_history',
      postDryPending === preDryPending && postDryRuns === preDryRuns && postDryHistory === preDryHistory && dryData.is_dry_run === true,
      'All 3 tables delta = 0, is_dry_run = true',
      `deltaPending: ${postDryPending - preDryPending}, deltaRuns: ${postDryRuns - preDryRuns}, deltaHistory: ${postDryHistory - preDryHistory}`
    );

    // 2.h Concurrency Lock Release Stress Test:
    // Verify that after 0-valid run, another generate request does NOT get 409 Conflict
    const followUpRes = await fetch(`${baseUrl}/api/qbank/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-QBank-Admin-Token': TEST_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        level: 1,
        skill: 'reading',
        count: 1,
        mock: true,
        dryRun: true,
      }),
    });
    recordChallenge(
      '0-Valid Audit: Concurrency Lock Release',
      'Concurrency lock is cleanly released after 0-valid candidate generation',
      followUpRes.status === 200,
      'HTTP 200 (lock released)',
      `HTTP ${followUpRes.status}`
    );

  } finally {
    await stopServer();
  }

  // ------------------------------------------------------------------
  // 3. Database Safety Invariant Verification
  // ------------------------------------------------------------------
  console.log('\n--- 3. Database Safety Invariant Verification ---');

  const postTestDbHash = getDbHash(LEGACY_DB_PATH);
  recordChallenge(
    'Database Invariant',
    'Post-test data/hsk_exam.db SHA-256 hash invariant preserved',
    postTestDbHash === EXPECTED_LEGACY_DB_HASH,
    EXPECTED_LEGACY_DB_HASH,
    postTestDbHash
  );

  const legacyDb = new DatabaseSync(LEGACY_DB_PATH, { readOnly: true });
  const rowCount = (legacyDb.prepare('SELECT COUNT(*) as cnt FROM questions').get() as any).cnt;
  legacyDb.close();

  recordChallenge(
    'Database Invariant',
    'data/hsk_exam.db row count strictly preserved (exactly 6 rows)',
    rowCount === 6,
    '6 rows',
    `${rowCount} rows`
  );

  // Summary
  const total = challengeResults.length;
  const passed = challengeResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n======================================================================');
  console.log(`   CHALLENGE HARNESS SUMMARY: ${passed}/${total} passed (${failed} failed)`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEmpiricalChallenges().catch((err) => {
  console.error('[FATAL CHALLENGE HARNESS ERROR]:', err);
  process.exit(1);
});
