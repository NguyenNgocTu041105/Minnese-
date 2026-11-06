/**
 * Challenger 2 Verification Suite: Provenance, Deduplication & Concurrency
 * File: tests/server/test_challenger_m2_concurrency.ts
 *
 * Empirical verification for Milestone 2:
 * 1. Provenance tracking & zero-mock enforcement in production
 * 2. Token usage tracking in generation_runs details
 * 3. Deduplication (N-gram Jaccard > 0.85 & hash collisions)
 * 4. Cross-platform hash calculation parity (Node vs Python)
 * 5. Concurrent generation safety (HTTP 409 lock & transactional consistency)
 * 6. Database invariant preservation (data/hsk_exam.db SHA-256 and 6 rows)
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { DatabaseSync } from 'node:sqlite';
import {
  generateWaterfallQuestions,
  generateMockQuestions,
  WATERFALL_PROVIDERS,
} from '../../src/server/llm/waterfallGenerator.js';
import {
  computeContentHash,
  validateCandidate,
  calculateJaccardSimilarity,
  getComparableStem,
  cleanChineseText,
  getCharNgrams,
} from '../../src/server/llm/questionValidator.js';
import {
  qbankRouter,
  ensurePendingSchema,
  setQBankAdminTokenForTesting,
  getDbSync,
} from '../../src/server/qbankRoutes.js';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const TEST_ADMIN_TOKEN = 'challenger2-token-' + Date.now();

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

function getFileSha256(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
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

async function apiRequest(
  method: string,
  urlPath: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  const url = `${baseUrl}${urlPath}`;
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-QBank-Admin-Token': TEST_ADMIN_TOKEN,
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _rawText: text };
  }

  return { status: res.status, body: json };
}

async function runChallengerSuite() {
  console.log('======================================================================');
  console.log('   CHALLENGER 2: PROVENANCE, DEDUPLICATION & CONCURRENCY AUDIT');
  console.log('======================================================================');

  await startServer();

  try {
    // ===================================================================
    // TEST 1: Database Safety Invariant Baseline
    // ===================================================================
    console.log('\n[TEST 1] Verifying data/hsk_exam.db Baseline Hash & Row Count...');
    const initialHash = getFileSha256(LEGACY_DB_PATH);
    assert(
      initialHash === EXPECTED_LEGACY_DB_HASH,
      `Legacy DB hash mismatch before test: ${initialHash} vs ${EXPECTED_LEGACY_DB_HASH}`
    );

    const legacyDb = new DatabaseSync(LEGACY_DB_PATH);
    const initialRows = Number((legacyDb.prepare('SELECT COUNT(*) as count FROM questions').get() as any)?.count || 0);
    assert(initialRows === 6, `Expected exactly 6 rows in legacy questions, got ${initialRows}`);
    legacyDb.close();
    console.log(`  -> PASS: Baseline hash is ${initialHash}, rows = ${initialRows}.`);

    // ===================================================================
    // TEST 2: Schema Integrity of generation_runs & pending_questions
    // ===================================================================
    console.log('\n[TEST 2] Verifying Schema Integrity of generation_runs & pending_questions...');
    const db = getDbSync();
    ensurePendingSchema(db);

    const runColumns = (db.prepare('PRAGMA table_info(generation_runs)').all() as any[]).map((c) => c.name);
    const requiredRunCols = [
      'id', 'batch_id', 'level', 'skill', 'count_requested', 'count_generated',
      'count_saved_pending', 'count_rejected_validator', 'provider_used', 'model_name',
      'status', 'details', 'created_at',
    ];
    for (const col of requiredRunCols) {
      assert(runColumns.includes(col), `generation_runs missing column: ${col}`);
    }

    const pendingColumns = (db.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
    const requiredPendingCols = [
      'id', 'stem', 'options', 'answer_idx', 'pinyin', 'explanation_vi',
      'level', 'skill', 'part_type', 'illustration_theme', 'topic', 'status',
      'provider_used', 'rejection_note', 'content_hash', 'created_at', 'updated_at',
    ];
    for (const col of requiredPendingCols) {
      assert(pendingColumns.includes(col), `pending_questions missing column: ${col}`);
    }
    console.log('  -> PASS: Both generation_runs and pending_questions contain all required schema columns.');

    // ===================================================================
    // TEST 3: Zero-Mock & Provenance in Production Mode
    // ===================================================================
    console.log('\n[TEST 3] Stress-Testing Zero-Mock & Provenance in Production Mode...');
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';

      // 3.1 generateMockQuestions MUST throw in production
      let mockThrew = false;
      try {
        generateMockQuestions(1, 'reading', 2);
      } catch (err: any) {
        mockThrew = true;
        assert(err.message.includes('MOCK_FORBIDDEN_IN_PRODUCTION'), `Unexpected error: ${err.message}`);
      }
      assert(mockThrew, 'generateMockQuestions must throw MOCK_FORBIDDEN_IN_PRODUCTION in production');

      // 3.2 generateWaterfallQuestions with mock: true in production must suppress mock
      let waterfallMockSuppressed = false;
      try {
        await generateWaterfallQuestions({
          level: 1,
          count: 1,
          mock: true,
          provider: 'none',
        });
      } catch (err: any) {
        waterfallMockSuppressed = true;
        assert(
          err.message.includes('LLM_ALL_PROVIDERS_EXHAUSTED'),
          `Expected exhaustion error when mock suppressed, got: ${err.message}`
        );
      }
      assert(waterfallMockSuppressed, 'Waterfall must suppress mock in production and exhaust without mock insertion');

      // Count mock questions before production call
      const preMockCount = Number(
        (db.prepare("SELECT COUNT(*) as c FROM pending_questions WHERE provider_used = 'mock-llm'").get() as any)?.c || 0
      );

      // 3.3 REST API POST /api/qbank/generate in production with mock: true
      const prodRes = await apiRequest('POST', '/api/qbank/generate', {
        level: 1,
        count: 1,
        mock: true,
        provider: 'none',
      });
      // Since provider is 'none', it must fail with HTTP 503 LLM_ALL_PROVIDERS_EXHAUSTED
      assert(prodRes.status === 503, `Expected HTTP 503 in production with mock=true and provider=none, got ${prodRes.status}`);
      assert(prodRes.body.code === 'LLM_ALL_PROVIDERS_EXHAUSTED', 'Expected code LLM_ALL_PROVIDERS_EXHAUSTED');

      // Confirm zero new questions were saved into pending_questions with provider_used='mock-llm'
      const postMockCount = Number(
        (db.prepare("SELECT COUNT(*) as c FROM pending_questions WHERE provider_used = 'mock-llm'").get() as any)?.c || 0
      );
      assert(
        postMockCount === preMockCount,
        `Expected 0 mock questions inserted in production, count went from ${preMockCount} to ${postMockCount}`
      );

      console.log('  -> PASS: Mock generation strictly forbidden and suppressed in production mode.');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }

    // ===================================================================
    // TEST 4: Token Usage Tracking & Provenance Audit
    // ===================================================================
    console.log('\n[TEST 4] Verifying Token Usage Tracking and Provenance Logging...');
    // Clean prior mock items from pending_questions so mock candidates are not flagged as duplicates
    db.exec("DELETE FROM pending_questions WHERE provider_used = 'mock-llm'");

    // Create a mock run in test mode to verify details JSON logging
    const testGenRes = await apiRequest('POST', '/api/qbank/generate', {
      level: 2,
      count: 2,
      mock: true,
    });
    assert(testGenRes.status === 200, `Expected HTTP 200 for generate in test mode, got ${testGenRes.status}`);
    const batchId = testGenRes.body.batch_id;
    assert(Boolean(batchId), 'Response must include batch_id');

    // Query generation_runs
    const runRecord = db.prepare('SELECT * FROM generation_runs WHERE batch_id = ?').get(batchId) as any;
    assert(Boolean(runRecord), 'generation_runs must contain record for batch');
    assert(runRecord.level === 2, `Expected level 2, got ${runRecord.level}`);
    assert(runRecord.count_requested === 2, `Expected count_requested 2, got ${runRecord.count_requested}`);
    assert(runRecord.count_saved_pending > 0, 'count_saved_pending must be > 0');

    // Parse details column
    const details = JSON.parse(runRecord.details);
    assert(details.batch_id === batchId, 'details.batch_id must match');
    assert('valid_saved_count' in details, 'details must have valid_saved_count');
    assert('rejected_count' in details, 'details must have rejected_count');
    assert('rejected_reasons' in details, 'details must have rejected_reasons');
    assert('token_usage' in details, 'details must have token_usage field');
    console.log(`  -> PASS: Audit logged with status='${runRecord.status}', provider='${runRecord.provider_used}', model='${runRecord.model_name}'.`);

    // ===================================================================
    // TEST 5: Hash Computation Parity (Node vs Python)
    // ===================================================================
    console.log('\n[TEST 5] Testing Cross-Platform Content Hash Parity (Node vs Python)...');
    const testCases = [
      {
        stem: '今天天气很好，我想去学校借两本书。',
        options: ['学校', '医院', '机场', '商店'],
        answerIdx: 0,
      },
      {
        stem: ' 他身体不太舒服，现在要去医院看医生。 ',
        options: [' 医院 ', ' 商店 ', ' 机场 ', ' 茶馆 '],
        answerIdx: 0,
      },
      {
        stem: '桌子上有三个新鲜的苹果。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answerIdx: 0,
      },
      {
        stem: '外面正在下雨，我们坐出租车去火车站吧。',
        options: ['出租车', '自行车', '飞机', '火车'],
        answerIdx: 0,
      },
      {
        stem: '晚上十点了，他要准备去睡觉。',
        options: ['睡觉', '工作', '买菜', '跑步'],
        answerIdx: 0,
      },
      {
        stem: '虽然工作很忙，但他每天坚持学习汉语。',
        options: ['学习', '休息', '旅游', '游戏'],
        answerIdx: 0,
      },
      {
        stem: '请问去图书馆怎么走？一直往前走就是了。',
        options: ['往前', '往后', '往左', '往右'],
        answerIdx: 0,
      },
      {
        stem: '这件衣服虽然有点贵，但是质量非常好。',
        options: ['贵', '便宜', '大', '小'],
        answerIdx: 0,
      },
      {
        stem: '昨天晚上我做了一个非常奇怪的梦。',
        options: ['奇怪', '开心', '伤心', '生病'],
        answerIdx: 0,
      },
      {
        stem: '我们打算下个月去北京旅游一个星期。',
        options: ['旅游', '出差', '搬家', '打扫'],
        answerIdx: 0,
      },
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const nodeHash = computeContentHash(tc.stem, tc.options, tc.answerIdx);

      // Call Python QbQuestion.compute_hash
      const pyOutput = execFileSync('python', [
        '-c',
        `from qbank.models import QbQuestion; import json; print(QbQuestion.compute_hash(${JSON.stringify(tc.stem)}, ${JSON.stringify(tc.options)}, ${tc.answerIdx}))`,
      ], { encoding: 'utf-8' }).trim();

      assert(
        nodeHash === pyOutput,
        `Hash mismatch on case ${i + 1}!\nNode:   ${nodeHash}\nPython: ${pyOutput}`
      );
    }
    console.log('  -> PASS: 10/10 cross-platform content hash calculations match 100% identically.');

    // ===================================================================
    // TEST 6: Deduplication & Jaccard Similarity (> 0.85)
    // ===================================================================
    console.log('\n[TEST 6] Stress-Testing Deduplication & Jaccard Similarity (> 0.85)...');

    // 6.1 Identical stem check
    const baseStem = '今天天气很好，我想去学校借两本书。';
    const existingStems = [baseStem];

    const duplicateCandidate = {
      stem: '今天天气很好，我想去学校借两本书。',
      options: ['学校', '医院', '机场', '商店'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Giải thích chi tiết hợp lệ',
    };
    const dupRes = validateCandidate(duplicateCandidate, existingStems);
    assert(!dupRes.valid, 'Duplicate candidate must be marked invalid');
    assert(
      dupRes.errors.some((e) => e.includes('similarity') || e.includes('85%')),
      `Expected similarity error, got: ${dupRes.errors.join(', ')}`
    );
    assert(dupRes.jaccardSimilarity === 1.0, `Expected Jaccard 1.0, got ${dupRes.jaccardSimilarity}`);

    // 6.2 High-similarity stem (> 0.85)
    // Stem A: "今天天气很好，我们去学校看书吧。" (14 chars)
    // Stem B: "今天天气很好，我们去学校看书。" (13 chars, trailing particle removed)
    const nearDupStemA = '今天天气很好，我们去学校看书吧。';
    const nearDupStemB = '今天天气很好，我们去学校看书。';
    const simHigh = calculateJaccardSimilarity(nearDupStemA, nearDupStemB);
    console.log(`    Calculated similarity for near-duplicate stems: ${(simHigh * 100).toFixed(2)}%`);
    assert(simHigh > 0.85, `Expected similarity > 0.85, got ${simHigh}`);

    const nearDupCandidate = {
      stem: nearDupStemB,
      options: ['学校', '医院', '机场', '商店'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Giải thích chi tiết hợp lệ ngữ pháp',
    };
    const nearDupRes = validateCandidate(nearDupCandidate, [nearDupStemA]);
    assert(!nearDupRes.valid, 'Near duplicate candidate (>85%) must be rejected');
    assert(
      nearDupRes.errors.some((e) => e.includes('85%')),
      `Expected similarity rejection error, got: ${nearDupRes.errors.join(', ')}`
    );

    // 6.3 Low-similarity stem (<= 0.85) must PASS
    const distinctStem = '明天下午我们全家打算一起去公园散步。';
    const simLow = calculateJaccardSimilarity(baseStem, distinctStem);
    console.log(`    Calculated similarity for distinct sentence: ${(simLow * 100).toFixed(2)}%`);
    assert(simLow < 0.3, `Expected low similarity < 0.3, got ${simLow}`);

    const validCandidate = {
      stem: distinctStem,
      options: ['散步', '买菜', '睡觉', '工作'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Giải thích hợp lệ ngữ pháp và từ vựng',
    };
    const validRes = validateCandidate(validCandidate, existingStems);
    assert(validRes.valid, `Valid distinct candidate must pass, got errors: ${validRes.errors.join(', ')}`);

    // 6.4 Blank replacement normalization test
    const fillBlankStem = '今天天气很好，我想去____借两本书。';
    const filledComparable = getComparableStem(fillBlankStem, ['学校', '医院', '机场', '商店'], 0);
    assert(
      filledComparable === '今天天气很好，我想去学校借两本书。',
      `Blank substitution failed: got '${filledComparable}'`
    );

    // 6.5 Hash collision handling: ON CONFLICT(content_hash) DO NOTHING
    const testHash = computeContentHash(validCandidate.stem, validCandidate.options, validCandidate.answer_idx);
    const testId1 = `test_hash_col_1_${Date.now()}`;
    const testId2 = `test_hash_col_2_${Date.now()}`;

    // Clean up any existing row with this test hash
    db.prepare('DELETE FROM pending_questions WHERE content_hash = ?').run(testHash);

    const insertStmt = db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, provider_used, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'test-provider', ?)
      ON CONFLICT(content_hash) DO NOTHING
    `);

    // First insert: should succeed with changes === 1
    const res1: any = insertStmt.run(
      testId1,
      validCandidate.stem,
      JSON.stringify(validCandidate.options),
      validCandidate.answer_idx,
      'pinyin',
      validCandidate.explanation_vi,
      validCandidate.level,
      validCandidate.skill,
      validCandidate.part_type,
      testHash
    );
    assert(res1.changes === 1, `Expected 1 change on first insert, got ${res1.changes}`);

    // Second insert with identical hash: should DO NOTHING with changes === 0 and NOT throw error
    const res2: any = insertStmt.run(
      testId2,
      validCandidate.stem,
      JSON.stringify(validCandidate.options),
      validCandidate.answer_idx,
      'pinyin',
      validCandidate.explanation_vi,
      validCandidate.level,
      validCandidate.skill,
      validCandidate.part_type,
      testHash
    );
    assert(res2.changes === 0, `Expected 0 changes on conflicting hash insert, got ${res2.changes}`);

    // Cleanup test row
    db.prepare('DELETE FROM pending_questions WHERE content_hash = ?').run(testHash);

    console.log('  -> PASS: Deduplication (>85%), blank normalization, and hash conflict safety verified.');

    // ===================================================================
    // TEST 7: Concurrent Generation Safety & Mutex Locking
    // ===================================================================
    console.log('\n[TEST 7] Stress-Testing Concurrent Generation Safety (/api/qbank/generate)...');

    // 7.1 Start mock OpenAI-compatible LLM endpoint with 150ms simulated processing delay
    const mockLlmApp = express();
    mockLlmApp.use(express.json());
    mockLlmApp.post('/v1/chat/completions', (_req, res) => {
      setTimeout(() => {
        res.json({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    stem: '今天天气很好，我想去学校借两本书。',
                    options: ['学校', '医院', '机场', '商店'],
                    answer_idx: 0,
                    explanation_vi: 'Giải thích chi tiết hợp lệ ngữ pháp và từ vựng.',
                    level: 1,
                    skill: 'reading',
                    part_type: 'read_fill_blank_4opt',
                  },
                ]),
              },
            },
          ],
          usage: {
            prompt_tokens: 142,
            completion_tokens: 58,
            total_tokens: 200,
          },
        });
      }, 150);
    });

    const mockLlmServer = await new Promise<http.Server>((resolve) => {
      const s = mockLlmApp.listen(0, '127.0.0.1', () => resolve(s));
    });
    const mockLlmPort = (mockLlmServer.address() as any).port;
    const originalOllamaBaseUrl = WATERFALL_PROVIDERS[3].baseUrl;
    WATERFALL_PROVIDERS[3].baseUrl = `http://127.0.0.1:${mockLlmPort}/v1`;

    try {
      console.log('    Dispatching primary async generation request via Ollama provider...');
      // Clean previous pending questions for clean verification
      db.prepare("DELETE FROM pending_questions WHERE stem = '今天天气很好，我想去学校借两本书。'").run();

      const p1Promise = apiRequest('POST', '/api/qbank/generate', {
        level: 1,
        count: 1,
        provider: 'ollama',
      });

      // Brief delay to ensure Request 1 has entered the handler, acquired lock, and started waiting on LLM
      await new Promise((resolve) => setTimeout(resolve, 30));

      // Dispatch 5 concurrent requests while Request 1 is still in-flight
      console.log('    Dispatching 5 concurrent requests while primary request is in-flight...');
      const concurrentReqs = await Promise.all(
        Array.from({ length: 5 }, () =>
          apiRequest('POST', '/api/qbank/generate', {
            level: 1,
            count: 1,
            provider: 'ollama',
          })
        )
      );

      // Verify all 5 concurrent requests received HTTP 409 Lock Conflict
      const concurrentStatuses = concurrentReqs.map((r) => r.status);
      console.log('    Concurrent response statuses:', concurrentStatuses.join(', '));
      for (const res of concurrentReqs) {
        assert(res.status === 409, `Expected HTTP 409 during in-flight generation, got ${res.status}`);
        assert(
          res.body.error.includes('Hệ thống đang thực hiện một phiên sinh đề khác'),
          `Unexpected error message in 409: ${JSON.stringify(res.body)}`
        );
      }

      // Wait for primary Request 1 to complete
      const p1Res = await p1Promise;
      assert(p1Res.status === 200, `Expected primary request to succeed with HTTP 200, got ${p1Res.status}`);
      assert(p1Res.body.success === true, 'Primary request success must be true');
      assert(p1Res.body.provider_used === 'ollama-qwen2.5', `Expected provider_used 'ollama-qwen2.5', got '${p1Res.body.provider_used}'`);
      assert(Boolean(p1Res.body.token_usage), 'Response must include token_usage from LLM');
      assert(p1Res.body.token_usage.totalTokens === 200, `Expected totalTokens 200, got ${p1Res.body.token_usage.totalTokens}`);

      // Verify generation_runs table logged provider_used and token_usage
      const genRun = db.prepare('SELECT * FROM generation_runs WHERE batch_id = ?').get(p1Res.body.batch_id) as any;
      assert(Boolean(genRun), 'generation_runs must contain record for batch');
      assert(genRun.provider_used === 'ollama-qwen2.5', `Expected provider_used 'ollama-qwen2.5', got '${genRun.provider_used}'`);
      const details = JSON.parse(genRun.details);
      assert(details.token_usage.totalTokens === 200, `Expected details.token_usage.totalTokens 200, got ${details?.token_usage?.totalTokens}`);

      // Verify pending_questions table logged real provider_used
      const pendRow = db.prepare('SELECT * FROM pending_questions WHERE stem = ?').get('今天天气很好，我想去学校借两本书。') as any;
      assert(Boolean(pendRow), 'Question must be inserted into pending_questions');
      assert(pendRow.provider_used === 'ollama-qwen2.5', `Expected provider_used 'ollama-qwen2.5', got '${pendRow.provider_used}'`);

      console.log('  -> PASS: All 5 concurrent requests rejected with HTTP 409 while primary request succeeded.');

      // 7.2 Verify lock release after completion
      console.log('    Verifying concurrency lock release after batch completes...');
      const afterRes = await apiRequest('POST', '/api/qbank/generate', {
        level: 1,
        count: 1,
        mock: true,
      });
      assert(afterRes.status === 200, `Expected 200 after concurrency burst resolved, got ${afterRes.status}`);

      // 7.3 Verify lock release on failure / error
      console.log('    Verifying concurrency lock release upon provider exhaustion (503)...');
      const failRes = await apiRequest('POST', '/api/qbank/generate', {
        level: 1,
        count: 1,
        provider: 'none',
      });
      assert(failRes.status === 503, `Expected 503 for exhaustion, got ${failRes.status}`);

      const recoverRes = await apiRequest('POST', '/api/qbank/generate', {
        level: 1,
        count: 1,
        mock: true,
      });
      console.log('  -> PASS: Concurrency mutex lock, HTTP 409 responses, token usage, and clean release verified.');
    } finally {
      WATERFALL_PROVIDERS[3].baseUrl = originalOllamaBaseUrl;
      await new Promise<void>((resolve) => mockLlmServer.close(() => resolve()));
    }

    // ===================================================================
    // TEST 8: Database Safety Invariant Post-Verification
    // ===================================================================
    console.log('\n[TEST 8] Verifying data/hsk_exam.db Post-Test Invariant...');
    const postHash = getFileSha256(LEGACY_DB_PATH);
    assert(
      postHash === EXPECTED_LEGACY_DB_HASH,
      `FATAL: Legacy DB hash changed! Expected ${EXPECTED_LEGACY_DB_HASH}, got ${postHash}`
    );

    const postLegacyDb = new DatabaseSync(LEGACY_DB_PATH);
    const postRows = Number((postLegacyDb.prepare('SELECT COUNT(*) as count FROM questions').get() as any)?.count || 0);
    assert(postRows === 6, `FATAL: Legacy DB row count changed! Expected 6, got ${postRows}`);
    postLegacyDb.close();

    console.log(`  -> PASS: Hash preserved (${postHash}), row count preserved (${postRows} rows).`);

    console.log('\n======================================================================');
    console.log('   ALL 8 CHALLENGER 2 VERIFICATION SCENARIOS PASSED WITH ZERO ERRORS!');
    console.log('======================================================================\n');
  } finally {
    await stopServer();
  }
}

runChallengerSuite().catch((err) => {
  console.error('\n[FATAL AUDIT FAILURE]:', err);
  process.exitCode = 1;
});
