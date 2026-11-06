/**
 * Milestone 3 Test Suite: Multi-Layer Quality Validation & Visual Workflow Decoupling
 * File: tests/server/test_validator_m3.ts
 *
 * Verifies:
 * - Group 1: Structural Validation (Bounds, Types, Options Uniqueness, Level 1-6 Integer, Skill)
 * - Group 2: Semantic Chinese Quality (Hanzi Presence, Language Purity, Meaningful Explanation)
 * - Group 3: Visual Workflow Decoupling (illustration_theme=null for non-visual; SVG check for visual)
 * - Group 4: Deduplication & Blank-Filling Normalization (Jaccard > 0.85, getComparableStem, Intra-batch)
 * - Group 5: REST API /api/qbank/generate Audit Logging for 0-valid Candidate Runs
 * - Group 6: Database Safety Invariant (data/hsk_exam.db SHA-256 & 6 rows intact)
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  validateCandidate,
  getComparableStem,
  calculateJaccardSimilarity,
  cleanChineseText,
  isVisualQuestionType,
  computeContentHash,
} from '../../src/server/llm/questionValidator.js';
import {
  qbankRouter,
  ensurePendingSchema,
  setQBankAdminTokenForTesting,
  getDbSync,
} from '../../src/server/qbankRoutes.js';
import { CandidateQuestion } from '../../src/server/llm/types.js';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const TEST_ADMIN_TOKEN = 'test-token-m3-' + Date.now();

let server: http.Server;
let baseUrl: string;
let totalChecks = 0;
let passedChecks = 0;

function assert(condition: boolean, msg: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${msg}`);
  } else {
    console.error(`  [FAIL] ${msg}`);
    process.exitCode = 1;
  }
}

function getDbHash(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Database file not found: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

async function startTestServer(): Promise<void> {
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

async function stopTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runM3TestSuite() {
  console.log('======================================================================');
  console.log('   MILESTONE 3: MULTI-LAYER VALIDATION & VISUAL WORKFLOW TEST SUITE   ');
  console.log('======================================================================\n');

  await startTestServer();

  try {
    // ------------------------------------------------------------------
    // Group 1: Structural Validation Layer
    // ------------------------------------------------------------------
    console.log('--- Group 1: Structural Validation Layer ---');

    // TC1.1: Null or non-object candidate
    const res1 = validateCandidate(null as any);
    assert(!res1.valid && res1.errors.some((e) => e.includes('non-null object')), 'TC1.1: Rejects null candidate object');

    // TC1.2: Empty or missing stem (< 2 chars)
    const res2 = validateCandidate({ stem: '', options: ['学校', '医院'], answer_idx: 0, explanation_vi: 'Giải thích tiếng Việt', level: 1, skill: 'reading' });
    assert(!res2.valid && res2.errors.some((e) => e.includes('Missing or empty stem')), 'TC1.2a: Rejects empty stem');
    const res2b = validateCandidate({ stem: '字', options: ['学校', '医院'], answer_idx: 0, explanation_vi: 'Giải thích tiếng Việt', level: 1, skill: 'reading' });
    assert(!res2b.valid && res2b.errors.some((e) => e.includes('at least 2 characters')), 'TC1.2b: Rejects stem shorter than 2 characters');

    // TC1.3: Options not an array / length < 2 or > 6
    const res3 = validateCandidate({ stem: '你好中国', options: ['学校'], answer_idx: 0, explanation_vi: 'Giải thích tiếng Việt', level: 1, skill: 'reading' });
    assert(!res3.valid && res3.errors.some((e) => e.includes('2 to 6 items')), 'TC1.3: Rejects options length < 2');

    // TC1.4: Strict 4 options for 4opt part types
    const res4 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['学校', '医院', '商店'],
      answer_idx: 0,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
      level: 1,
      skill: 'reading',
    });
    assert(!res4.valid && res4.errors.some((e) => e.includes('exactly 4 items')), 'TC1.4: Rejects 3 options for read_fill_blank_4opt');

    // TC1.5: Empty option string
    const res5 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['学校', '', '商店', '机场'],
      answer_idx: 0,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
      level: 1,
      skill: 'reading',
    });
    assert(!res5.valid && res5.errors.some((e) => e.includes('Option at index 1 is empty')), 'TC1.5: Rejects empty option string');

    // TC1.6: Duplicate options
    const res6 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['学校', '学校', '商店', '机场'],
      answer_idx: 0,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
      level: 1,
      skill: 'reading',
    });
    assert(!res6.valid && res6.errors.some((e) => e.includes('Options must be unique')), 'TC1.6: Rejects duplicate options');

    // TC1.7: answer_idx out of bounds
    const res7 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 4,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
      level: 1,
      skill: 'reading',
    });
    assert(!res7.valid && res7.errors.some((e) => e.includes('answer_idx must be an integer between 0 and 3')), 'TC1.7: Rejects answer_idx out of bounds');

    // TC1.8: Level out of bounds or float
    const res8 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 7,
      skill: 'reading',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
    });
    assert(!res8.valid && res8.errors.some((e) => e.includes('level must be an integer between 1 and 6')), 'TC1.8: Rejects level > 6');

    // TC1.9: Invalid skill
    const res9 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'speaking' as any,
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
    });
    assert(!res9.valid && res9.errors.some((e) => e.includes("skill must be 'listening', 'reading', or 'writing'")), 'TC1.9: Rejects invalid skill');

    // ------------------------------------------------------------------
    // Group 2: Semantic Chinese Quality Layer
    // ------------------------------------------------------------------
    console.log('\n--- Group 2: Semantic Chinese Quality Layer ---');

    // TC2.1: Stem with NO Hanzi
    const res2_1 = validateCandidate({
      stem: '1. (   ) ? 123456.',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
    });
    assert(!res2_1.valid && res2_1.errors.some((e) => e.includes('stem must contain at least one Chinese character (Hanzi)')), 'TC2.1: Rejects stem without Hanzi characters');

    // TC2.2: Stem with Latin/Vietnamese characters
    const res2_2 = validateCandidate({
      stem: 'Hôm nay 今天天气很好，我想去____借书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
    });
    assert(!res2_2.valid && res2_2.errors.some((e) => e.includes('stem contains invalid Latin or Vietnamese characters')), 'TC2.2: Rejects Latin/Vietnamese in stem');

    // TC2.3: Option with Latin/Vietnamese characters
    const res2_3 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['School', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
    });
    assert(!res2_3.valid && res2_3.errors.some((e) => e.includes('invalid Latin or Vietnamese characters')), 'TC2.3: Rejects Latin in option');

    // TC2.4: Prohibited bracketed hint
    const res2_4 = validateCandidate({
      stem: '今天天气很好，我想去____借书。（答案：学校）',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      explanation_vi: 'Giải thích ngữ pháp chi tiết.',
    });
    assert(!res2_4.valid && res2_4.errors.some((e) => e.includes('prohibited bracketed hint')), 'TC2.4: Rejects bracketed answer hint');

    // TC2.5: Meaningless explanation
    const res2_5 = validateCandidate({
      stem: '今天天气很好，我想去____借书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      explanation_vi: '1234567890..??',
    });
    assert(!res2_5.valid && res2_5.errors.some((e) => e.includes('meaningful Vietnamese text')), 'TC2.5: Rejects explanation lacking Vietnamese words');

    // ------------------------------------------------------------------
    // Group 3: Visual Workflow Decoupling
    // ------------------------------------------------------------------
    console.log('\n--- Group 3: Visual Workflow Decoupling ---');

    // TC3.1: Non-visual question with illustration_theme = null passes cleanly
    const res3_1 = validateCandidate({
      stem: '今天天气很好，我想去____借两本书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      illustration_theme: null,
      explanation_vi: 'Trong ngữ cảnh mượn sách, trường học là đáp án chính xác nhất.',
    });
    assert(res3_1.valid && res3_1.errors.length === 0, 'TC3.1: Non-visual question with illustration_theme = null passes cleanly');

    // TC3.2: Non-visual question with omitted illustration_theme passes
    const res3_2 = validateCandidate({
      stem: '今天天气很好，我想去____借两本书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_comprehension_4opt',
      explanation_vi: 'Trong ngữ cảnh mượn sách, trường học là đáp án chính xác nhất.',
    });
    assert(res3_2.valid, 'TC3.2: Non-visual question with omitted illustration_theme passes');

    // TC3.3: Non-visual question with illustration_theme = "none" passes
    const res3_3 = validateCandidate({
      stem: '今天天气很好，我想去____借两本书。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 3,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      illustration_theme: 'none',
      topic: 'Education and Campus Life',
      explanation_vi: 'Trường học là nơi phù hợp nhất để mượn sách học tập.',
    });
    assert(res3_3.valid, 'TC3.3: Non-visual question with illustration_theme = "none" passes cleanly');

    // TC3.4: Visual question requiring illustration_theme fails when null
    const res3_4 = validateCandidate({
      stem: '请看图片，选出相符的一项。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'listening',
      part_type: 'listen_picture_match_4opt',
      illustration_theme: null,
      explanation_vi: 'Hình vẽ minh họa trường học.',
    });
    assert(!res3_4.valid && res3_4.errors.some((e) => e.includes('illustration_theme is required')), 'TC3.4: Visual question rejects null illustration_theme');

    // TC3.5: Visual question rejects invalid SVG theme
    const res3_5 = validateCandidate({
      stem: '请看图片，选出相符的一项。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'listening',
      part_type: 'listen_picture_match_4opt',
      illustration_theme: 'spaceship',
      explanation_vi: 'Hình vẽ minh họa phương tiện.',
    });
    assert(!res3_5.valid && res3_5.errors.some((e) => e.includes('not one of the 27 supported SVG scenes')), 'TC3.5: Visual question rejects non-27 SVG theme');

    // TC3.6: Visual question passes with valid 27 SVG theme
    const res3_6 = validateCandidate({
      stem: '请看图片，选出相符的一项。',
      options: ['出租车', '飞机', '火车', '公共汽车'],
      answer_idx: 0,
      level: 1,
      skill: 'listening',
      part_type: 'listen_picture_match_4opt',
      illustration_theme: 'taxi',
      explanation_vi: 'Hình ảnh vẽ chiếc xe taxi màu vàng.',
    });
    assert(res3_6.valid, 'TC3.6: Visual question passes with valid SVG theme (taxi)');

    // TC3.7: Custom educational topic string passes
    const res3_7 = validateCandidate({
      stem: '我们在讨论关于旅行的计划。',
      options: ['计划', '作业', '问题', '决定'],
      answer_idx: 0,
      level: 3,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      topic: 'Du lịch và Đời sống',
      illustration_theme: null,
      explanation_vi: 'Kế hoạch du lịch là sự kết hợp từ vựng tự nhiên.',
    });
    assert(res3_7.valid, 'TC3.7: Custom educational topic string passes');

    // ------------------------------------------------------------------
    // Group 4: Deduplication & Blank-Filling Normalization
    // ------------------------------------------------------------------
    console.log('\n--- Group 4: Deduplication & Blank-Filling Normalization ---');

    // TC4.1: getComparableStem normalizes diverse blank variants
    const stem4_1 = '王老师在____上课。';
    const stem4_2 = '王老师在___上课。';
    const stem4_3 = '王老师在__上课。';
    const stem4_4 = '王老师在（ ）上课。';
    const stem4_5 = '王老师在()上课。';
    const stem4_6 = '王老师在（___）上课。';
    const opts4 = ['学校', '医院', '商店', '机场'];

    const comp1 = getComparableStem(stem4_1, opts4, 0);
    const comp2 = getComparableStem(stem4_2, opts4, 0);
    const comp3 = getComparableStem(stem4_3, opts4, 0);
    const comp4 = getComparableStem(stem4_4, opts4, 0);
    const comp5 = getComparableStem(stem4_5, opts4, 0);
    const comp6 = getComparableStem(stem4_6, opts4, 0);

    assert(comp1 === '王老师在学校上课。', 'TC4.1a: Standard 4-underscore replaced');
    assert(comp2 === comp1, 'TC4.1b: 3-underscore matches standard');
    assert(comp3 === comp1, 'TC4.1c: 2-underscore matches standard');
    assert(comp4 === comp1, 'TC4.1d: Chinese full-width bracket blank matches standard');
    assert(comp5 === comp1, 'TC4.1e: Half-width bracket blank matches standard');
    assert(comp6 === comp1, 'TC4.1f: Bracketed underscore blank matches standard');

    // TC4.2: Jaccard similarity > 0.85 rejection
    const existingPool = ['王老师在学校上课。'];
    const candDup = {
      stem: '王老师在（ ）上课。',
      options: ['学校', '医院', '商店', '机场'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      explanation_vi: 'Giải thích chi tiết ngữ pháp tiếng Việt.',
    };
    const resDup = validateCandidate(candDup, existingPool);
    assert(!resDup.valid && resDup.errors.some((e) => e.includes('exceeds 85% threshold')), 'TC4.2: Flags near-duplicate question with similarity > 85%');

    // TC4.3: Distinct question passes
    const candDistinct = {
      stem: '我想买一部新手机。',
      options: ['手机', '电脑', '电视', '相机'],
      answer_idx: 0,
      level: 2,
      skill: 'reading' as const,
      explanation_vi: 'Ngữ cảnh nói về thiết bị liên lạc cá nhân.',
    };
    const resDistinct = validateCandidate(candDistinct, existingPool);
    assert(resDistinct.valid, 'TC4.3: Distinct question passes deduplication check');

    // TC4.4: High similarity variation (>85%) flagged
    const candHighSim = {
      stem: '王老师在（____）上课。',
      options: ['学校', '医院', '商店', '北京'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      explanation_vi: 'Giải thích ngữ pháp địa điểm trường học.',
    };
    const resHighSim = validateCandidate(candHighSim, existingPool);
    assert(!resHighSim.valid && resHighSim.errors.some((e) => e.includes('exceeds 85% threshold')), 'TC4.4: Flags high similarity variation > 85%');

    // TC4.5: Intra-batch deduplication
    const batchStems: string[] = [];
    const item1 = {
      stem: '李明在____工作。',
      options: ['银行', '医院', '学校', '商店'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      explanation_vi: 'Giải thích ngữ cảnh nghề nghiệp.',
    };
    const item2 = {
      stem: '李明在（ ）工作。',
      options: ['银行', '医院', '学校', '商店'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      explanation_vi: 'Giải thích ngữ cảnh nghề nghiệp tương tự.',
    };
    const val1 = validateCandidate(item1, batchStems);
    assert(val1.valid, 'TC4.5a: First batch item passes validation');
    if (val1.valid) {
      batchStems.push(getComparableStem(item1.stem, item1.options, item1.answer_idx));
    }
    const val2 = validateCandidate(item2, batchStems);
    assert(!val2.valid && val2.errors.some((e) => e.includes('exceeds 85% threshold')), 'TC4.5b: Second intra-batch duplicate item is rejected');

    // ------------------------------------------------------------------
    // Group 5: REST API Audit Logging for 0-Valid Candidates
    // ------------------------------------------------------------------
    console.log('\n--- Group 5: REST API Audit Logging for 0-Valid Candidates ---');

    const db = getDbSync();
    ensurePendingSchema(db);

    const initialRunsCount = (db.prepare('SELECT COUNT(*) as cnt FROM generation_runs').get() as any).cnt;
    const initialPendingCount = (db.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;

    // Call POST /api/qbank/generate with mock generation
    // Since '今天天气很好，我想去____借两本书。' or '今天天气很好，我想去学校借两本书。' exists in DB,
    // mock candidate 0 will be flagged as duplicate (>85% similarity) and rejected.
    const genRes = await fetch(`${baseUrl}/api/qbank/generate`, {
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
        dryRun: false,
      }),
    });

    const genData = await genRes.json();
    assert(genRes.status === 200, 'TC5.1a: /api/qbank/generate responds with HTTP 200');
    assert(genData.count_saved_pending === 0, 'TC5.1b: count_saved_pending is 0 when all candidates rejected');
    assert(genData.count_rejected_validator > 0, 'TC5.1c: count_rejected_validator reflects rejected items');

    const afterRunsCount = (db.prepare('SELECT COUNT(*) as cnt FROM generation_runs').get() as any).cnt;
    assert(afterRunsCount > initialRunsCount, 'TC5.2a: generation_runs record created even if 0 valid candidates');

    const latestRun = db.prepare('SELECT * FROM generation_runs ORDER BY created_at DESC LIMIT 1').get() as any;
    assert(latestRun && latestRun.status === 'all_rejected', `TC5.2b: Latest generation run status is 'all_rejected' (status: ${latestRun?.status})`);

    const afterPendingCount = (db.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    assert(afterPendingCount === initialPendingCount, 'TC5.3: pending_questions preserves zero-insert invariant when 0 valid candidates');

    // ------------------------------------------------------------------
    // Group 6: Database Safety Invariant
    // ------------------------------------------------------------------
    console.log('\n--- Group 6: Database Safety Invariant ---');
    const legacyHash = getDbHash(LEGACY_DB_PATH);
    assert(legacyHash === EXPECTED_LEGACY_DB_HASH, `TC6.1: data/hsk_exam.db hash preserved (${legacyHash})`);

    const legacyDb = new DatabaseSync(LEGACY_DB_PATH, { readOnly: true });
    const legacyCount = (legacyDb.prepare('SELECT COUNT(*) as cnt FROM questions').get() as any).cnt;
    legacyDb.close();
    assert(legacyCount === 6, `TC6.2: data/hsk_exam.db row count preserved (exactly ${legacyCount} rows)`);

  } finally {
    await stopTestServer();
  }

  console.log('\n======================================================================');
  console.log(`  RESULTS: ${passedChecks}/${totalChecks} checks passed.`);
  console.log('======================================================================\n');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runM3TestSuite().catch((err) => {
  console.error('[FATAL TEST ERROR]:', err);
  process.exit(1);
});
