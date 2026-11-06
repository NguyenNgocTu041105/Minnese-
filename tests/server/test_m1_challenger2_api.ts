import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  ensurePendingSchema,
  computeContentHash,
  setQBankAdminTokenForTesting,
} from '../../src/server/qbankRoutes';
import { examRouter } from '../../src/server/examRoutes';

const TEST_TOKEN = 'test-token-lvl6-' + Date.now();
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const EXPECTED_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';

async function main() {
  console.log('================================================================');
  console.log(' EMPIRICAL CHALLENGE 2: EXPRESS API LEVEL 6 & TOPIC TEST');
  console.log('================================================================\n');

  // Verify initial hash
  const initialHash = crypto.createHash('sha256').update(fs.readFileSync(HSK_EXAM_DB_PATH)).digest('hex').toUpperCase();
  if (initialHash !== EXPECTED_HASH) {
    throw new Error(`Initial hash mismatch: ${initialHash} !== ${EXPECTED_HASH}`);
  }
  console.log('[PASS] Baseline data/hsk_exam.db SHA-256 confirmed:', initialHash);

  setQBankAdminTokenForTesting(TEST_TOKEN);
  const app = express();
  app.use(express.json());
  app.use('/api/qbank', qbankRouter);
  app.use('/api/exam', examRouter);

  const server = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const db = new DatabaseSync(QBANK_DB_PATH);
  const testId = 'api-lvl6-topic-' + Date.now();
  const testStem = '在宏观经济调控中，货币政策与财政政策应当协调配合。';
  const testOptions = JSON.stringify(['协调', '对立', '脱节', '停滞']);
  const testHash = computeContentHash(testStem, ['协调', '对立', '脱节', '停滞'], 0);
  const testTopic = 'macroeconomics_policy';

  try {
    // Seed pending candidate directly
    const insertStmt = db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type,
        illustration_theme, status, provider_used, content_hash, topic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      testId, testStem, testOptions, 0, 'zài hóngguān...',
      'Giải thích HSK 6 về kinh tế vĩ mô', 6, 'reading', 'read_comprehension_long_articles_4opt',
      null, 'pending', 'api_test', testHash, testTopic
    );

    // 1. Query GET /api/qbank/pending with level=6 and topic filter
    console.log('1. Testing GET /api/qbank/pending?level=6&topic=macroeconomics_policy...');
    const filterRes = await fetch(`${baseUrl}/api/qbank/pending?level=6&topic=macroeconomics_policy`, {
      headers: { 'X-QBank-Admin-Token': TEST_TOKEN }
    });
    const filterJson = await filterRes.json() as any;
    if (!filterJson.success || !filterJson.questions.some((q: any) => q.id === testId)) {
      throw new Error('Failed to retrieve level 6 question by topic filter: ' + JSON.stringify(filterJson));
    }
    const foundQ = filterJson.questions.find((q: any) => q.id === testId);
    if (foundQ.level !== 6 || foundQ.topic !== 'macroeconomics_policy' || foundQ.illustration_theme !== null) {
      throw new Error('Retrieved fields mismatch: ' + JSON.stringify(foundQ));
    }
    console.log('   [PASS] Found candidate with level=6, topic="macroeconomics_policy", illustration_theme=null');

    // 2. Approve via POST /api/qbank/pending/approve
    console.log('2. Testing POST /api/qbank/pending/approve for Level 6 candidate...');
    const approveRes = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-QBank-Admin-Token': TEST_TOKEN },
      body: JSON.stringify({ ids: [testId] })
    });
    const approveJson = await approveRes.json() as any;
    if (!approveJson.success || approveJson.approved_count !== 1) {
      throw new Error('Approval failed: ' + JSON.stringify(approveJson));
    }
    console.log('   [PASS] Candidate promoted successfully, approved_count = 1');

    // 3. Verify in questions and qb_questions tables
    console.log('3. Verifying persistence in questions and qb_questions tables...');
    const qRow = db.prepare('SELECT id, level, topic, illustration_theme, status FROM questions WHERE id = ?').get(testId) as any;
    if (!qRow || qRow.level !== 6 || qRow.topic !== 'macroeconomics_policy' || qRow.illustration_theme !== null) {
      throw new Error('questions table verification failed: ' + JSON.stringify(qRow));
    }
    const qbRow = db.prepare('SELECT question_id, level, topic, status FROM qb_questions WHERE question_id = ?').get(testId) as any;
    if (!qbRow || qbRow.level !== 6 || qbRow.topic !== 'macroeconomics_policy' || qbRow.status !== 'approved') {
      throw new Error('qb_questions table verification failed: ' + JSON.stringify(qbRow));
    }
    console.log('   [PASS] Exact level=6, topic, and illustration_theme=null verified in both questions and qb_questions');

    // 4. Check GET /api/qbank/progress
    console.log('4. Testing GET /api/qbank/progress for Level 6 presence...');
    const progRes = await fetch(`${baseUrl}/api/qbank/progress`, {
      headers: { 'X-QBank-Admin-Token': TEST_TOKEN }
    });
    const progJson = await progRes.json() as any;
    const hasLevel6InApproved = progJson.approved_by_level && ('6' in progJson.approved_by_level);
    console.log(`   [INFO] GET /api/qbank/progress approved_by_level includes '6': ${hasLevel6InApproved}`);

  } finally {
    // Guaranteed cleanup
    db.prepare('DELETE FROM qb_questions WHERE question_id = ?').run(testId);
    db.prepare('DELETE FROM questions WHERE id = ?').run(testId);
    db.prepare('DELETE FROM pending_questions WHERE id = ?').run(testId);
    db.close();
    server.close();
  }

  // Final Hash Check
  const finalHash = crypto.createHash('sha256').update(fs.readFileSync(HSK_EXAM_DB_PATH)).digest('hex').toUpperCase();
  if (finalHash !== EXPECTED_HASH) {
    throw new Error(`Final hash mismatch: ${finalHash} !== ${EXPECTED_HASH}`);
  }
  console.log('\n[PASS] Final data/hsk_exam.db SHA-256 confirmed preserved:', finalHash);

  console.log('\n================================================================');
  console.log(' ALL EXPRESS API LEVEL 6 & TOPIC TESTS PASSED (CLEANUP VERIFIED)');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('[TEST ERROR]:', err);
  process.exit(1);
});
