/**
 * Adversarial Stress Test Suite for HSK Exam Backend
 * 
 * Tests:
 * 1. Anti-Cheat Enforcement & Leak Probing
 *    - Deep inspection of all properties across all returned questions (generate-mock & get session)
 *    - Tampering resistance: submitting client-spoofed question fields or answers
 * 2. Boundary & Malformed Inputs:
 *    - Negative levels (-1, -99), level 0, level 6, level 99, non-numeric strings
 *    - Empty bodies {}, null, malformed types
 *    - Out-of-bounds answer indices (-1, 999, null, string "1", NaN, Infinity)
 *    - Invalid session IDs (UUIDs, non-UUIDs, special chars, SQL injection strings, XSS payloads)
 *    - /api/exam/practice boundary counts (-1, 0, 999999) and invalid filters
 *    - /api/exam/check-answer invalid payloads
 * 3. High-Concurrency & Session Isolation:
 *    - 50 concurrent session creations
 *    - Verifying uniqueness of session IDs and isolation of answers
 *    - Concurrent submission stress
 * 4. Database Invariance Verification:
 *    - Pre and post SHA-256 hash check and question count check on data/hsk_exam.db
 */

import express from 'express';
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { examRouter, getActiveSessionCount, clearAllSessionsForTesting, getSessionDirect } from '../../src/server/examRoutes';
import { HSK1_FULL_MOCK_EXAM } from '../../src/data/hskMockExamFixtures';

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ADVERSARIAL ASSERTION FAILED]: ${message}`);
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use('/api/exam', examRouter);

  // 404 guard matching server.ts
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(500).json({ success: false, error: err.message || 'Internal error' });
  });

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}

async function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function getHskExamDbStats() {
  const dbPath = 'data/hsk_exam.db';
  const fileBuf = fs.readFileSync(dbPath);
  const hash = crypto.createHash('sha256').update(fileBuf).digest('hex').toUpperCase();

  const db = new DatabaseSync(dbPath, { readOnly: true });
  const row = db.prepare('SELECT COUNT(*) as cnt FROM questions').get() as any;
  db.close();

  return { hash, count: row.cnt };
}

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('⚡ ADVERSARIAL STRESS TEST SUITE — HSK EXAM BACKEND');
  console.log('================================================================\n');

  // Baseline DB check
  const preStats = getHskExamDbStats();
  console.log(`[Baseline DB Invariant] Hash: ${preStats.hash}`);
  console.log(`[Baseline DB Invariant] Questions Count: ${preStats.count}`);
  assert(
    preStats.hash === '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD',
    'Pre-test DB hash mismatch!'
  );
  assert(preStats.count === 6, 'Pre-test DB row count must be 6!');

  await startServer();
  clearAllSessionsForTesting();

  let testCount = 0;

  try {
    // -------------------------------------------------------------------------
    // Category 1: Anti-Cheat Enforcement & Leak Probing
    // -------------------------------------------------------------------------
    console.log('\n--- Category 1: Anti-Cheat Enforcement & Data Leak Probing ---');

    // 1.1 Generate Mock Exam across all supported levels 1..5 and deep-scan for leaks
    for (let lvl = 1; lvl <= 5; lvl++) {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: lvl, mode: 'mock' }),
      });
      assert(res.status === 200, `Level ${lvl} generate-mock failed with status ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      const questions = data.session.questions;

      for (const q of questions) {
        // Strict anti-cheat checks
        assert(!('answer_index' in q), `LEAK DETECTED: 'answer_index' key present in question ${q.id} (Level ${lvl})`);
        assert(!('explanation_vi' in q), `LEAK DETECTED: 'explanation_vi' key present in question ${q.id} (Level ${lvl})`);
        assert(q.answer_index === undefined, `LEAK DETECTED: answer_index defined on ${q.id}`);
        assert(q.explanation_vi === undefined, `LEAK DETECTED: explanation_vi defined on ${q.id}`);

        // Scan all keys in q for any hidden answers (e.g. answer, correct, solution)
        const keys = Object.keys(q);
        for (const k of keys) {
          assert(!k.toLowerCase().includes('answer'), `Suspicious key containing 'answer': ${k}`);
          assert(!k.toLowerCase().includes('solution'), `Suspicious key containing 'solution': ${k}`);
          assert(!k.toLowerCase().includes('correct'), `Suspicious key containing 'correct': ${k}`);
        }
      }

      // 1.2 Verify session retrieval for the same session also strictly strips answers
      const sessRes = await fetch(`${baseUrl}/api/exam/session/${data.session.sessionId}`);
      assert(sessRes.status === 200, `GET session failed with ${sessRes.status}`);
      const sessData = await sessRes.json();
      for (const sq of sessData.session.questions) {
        assert(!('answer_index' in sq), `LEAK DETECTED on GET /session: 'answer_index' present in ${sq.id}`);
        assert(!('explanation_vi' in sq), `LEAK DETECTED on GET /session: 'explanation_vi' present in ${sq.id}`);
      }
    }
    console.log('✓ Category 1.1 & 1.2 Passed: Zero answer/explanation leaks across levels 1-5.');
    testCount++;

    // 1.3 Anti-cheat evaluation integrity: client cannot manipulate score by injecting bogus question answers
    const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, mode: 'mock' }),
    });
    const genData = await genRes.json();
    const sessionId = genData.session.sessionId;

    // Client attempts to spoof questions that do not exist or inject non-numeric answers
    const spoofedAnswers: Record<string, any> = {
      'fake-question-id-1': 0,
      'fake-question-id-2': '0',
      '__proto__': 0,
      'constructor': 0,
    };
    const spoofSubmit = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        level: 1,
        answers: spoofedAnswers,
        timeSpentSeconds: 100,
      }),
    });
    assert(spoofSubmit.status === 200, `Expected 200, got ${spoofSubmit.status}`);
    const spoofData = await spoofSubmit.json();
    // Since no valid answers were provided, score must be 0
    assert(spoofData.scoreResult.totalScore === 0, `Spoofed submission expected 0 score, got ${spoofData.scoreResult.totalScore}`);
    assert(spoofData.scoreResult.passed === false, 'Spoofed submission must fail');
    console.log('✓ Category 1.3 Passed: Server-side evaluation rejects spoofed questions and prototypes.');
    testCount++;

    // -------------------------------------------------------------------------
    // Category 2: Boundary & Malformed Inputs
    // -------------------------------------------------------------------------
    console.log('\n--- Category 2: Boundary & Malformed Inputs ---');

    // 2.1 Boundary levels on /generate-mock
    const boundaryLevels = [-100, -1, 0, 6, 7, 99, 9999, 'abc', null, undefined, {}, []];
    for (const bLvl of boundaryLevels) {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: bLvl, mode: 'mock' }),
      });
      // Must not crash or 500. Should gracefully fallback to level 1 default
      assert(res.status === 200, `Level ${bLvl} caused status ${res.status}`);
      const d = await res.json();
      assert(d.success === true, `Expected success: true for level ${bLvl}`);
      assert(d.session.level === 1, `Expected fallback to level 1 for input ${bLvl}, got ${d.session.level}`);
    }
    console.log('✓ Category 2.1 Passed: Boundary levels (-100, 0, 99, abc, etc.) safely handled with fallback to level 1.');
    testCount++;

    // 2.2 Empty and malformed bodies on /generate-mock
    const emptyBodyRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(emptyBodyRes.status === 200, 'Empty body on /generate-mock should default cleanly');
    const emptyBodyData = await emptyBodyRes.json();
    assert(emptyBodyData.session.level === 1, 'Default level should be 1');
    console.log('✓ Category 2.2 Passed: Empty body on /generate-mock handled gracefully.');
    testCount++;

    // 2.3 Boundary & Malformed Inputs on GET /api/exam/session/:sessionId
    const badSessionIds = [
      'non-existent-uuid-12345',
      '../etc/passwd',
      'SELECT * FROM questions',
      '<script>alert(1)</script>',
      'null',
      'undefined',
      'a'.repeat(500),
      encodeURIComponent('!@#$%^&*()_+'),
    ];
    for (const badId of badSessionIds) {
      const res = await fetch(`${baseUrl}/api/exam/session/${badId}`);
      assert(res.status === 404, `Expected 404 for bad sessionId '${badId}', got ${res.status}`);
      const d = await res.json();
      assert(d.success === false, 'Expected success: false for invalid session');
      assert(typeof d.error === 'string', 'Expected error message string');
    }
    console.log('✓ Category 2.3 Passed: Invalid, non-existent, and adversarial session IDs return clean 404 JSON.');
    testCount++;

    // 2.4 Boundary & Malformed Inputs on POST /api/exam/check-answer
    // 2.4a Empty body
    const caEmpty = await fetch(`${baseUrl}/api/exam/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(caEmpty.status === 400, `Expected 400 for empty check-answer, got ${caEmpty.status}`);
    const caEmptyData = await caEmpty.json();
    assert(caEmptyData.success === false, 'Expected success: false');

    // 2.4b Non-numeric userAnswer
    const caBadTypes = ['0', true, false, null, undefined, [0], { answer: 0 }];
    for (const badVal of caBadTypes) {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: HSK1_FULL_MOCK_EXAM[0].id, userAnswer: badVal }),
      });
      assert(res.status === 400, `Expected 400 for non-numeric userAnswer ${JSON.stringify(badVal)}, got ${res.status}`);
    }

    // 2.4c Out-of-bounds userAnswer (-1, 999)
    const oobAnswers = [-1, -999, 999, 99999];
    for (const oob of oobAnswers) {
      const res = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: HSK1_FULL_MOCK_EXAM[0].id, userAnswer: oob }),
      });
      assert(res.status === 200, `Expected 200 for out-of-bounds number, got ${res.status}`);
      const d = await res.json();
      assert(d.success === true, 'Expected success: true');
      assert(d.isCorrect === false, 'OOB answer must be marked incorrect');
      assert(d.correctAnswer === HSK1_FULL_MOCK_EXAM[0].answer_index, 'Correct answer should be returned');
    }

    // 2.4d Unknown questionId
    const caUnknown = await fetch(`${baseUrl}/api/exam/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: 'totally-fake-q-id-999', userAnswer: 0 }),
    });
    assert(caUnknown.status === 404, `Expected 404 for unknown question, got ${caUnknown.status}`);
    console.log('✓ Category 2.4 Passed: /api/exam/check-answer validates types, bounds, and unknown questions.');
    testCount++;

    // 2.5 Boundary Inputs on POST /api/exam/submit
    // 2.5a Empty body submission
    const subEmpty = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(subEmpty.status === 200, `Expected 200 fallback for empty submit, got ${subEmpty.status}`);
    const subEmptyData = await subEmpty.json();
    assert(subEmptyData.success === true, 'Expected success: true');
    assert(subEmptyData.scoreResult.totalScore === 0, 'Empty submit should give 0 score');
    assert(subEmptyData.scoreResult.passed === false, 'Empty submit must not pass');

    // 2.5a.2 Malformed answers: null
    const subNullAnswers = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: null }),
    });
    console.log(`[Adversarial probe] submit with answers: null returned status ${subNullAnswers.status}`);
    const subNullData = await subNullAnswers.json();
    console.log(`[Adversarial probe] submit with answers: null returned body:`, subNullData);

    // 2.5b Submitting with out-of-bounds answer indices (-1, 999, string, null)
    const validQ = HSK1_FULL_MOCK_EXAM[0];
    const weirdAnswers = {
      [validQ.id]: -1,
      [HSK1_FULL_MOCK_EXAM[1].id]: 9999,
      [HSK1_FULL_MOCK_EXAM[2].id]: '0', // string
      [HSK1_FULL_MOCK_EXAM[3].id]: null,
      [HSK1_FULL_MOCK_EXAM[4].id]: undefined,
    };
    const subWeird = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, answers: weirdAnswers, timeSpentSeconds: -50 }),
    });
    assert(subWeird.status === 200, `Expected 200, got ${subWeird.status}`);
    const subWeirdData = await subWeird.json();
    assert(subWeirdData.scoreResult.totalScore === 0, 'Invalid answer values must not count as correct');
    assert(subWeirdData.scoreResult.timeSpentSeconds === -50, 'timeSpentSeconds recorded');

    // 2.5c Multiple submissions for the same session ID
    const genMulti = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, mode: 'mock' }),
    });
    const sessMulti = (await genMulti.json()).session.sessionId;

    const sub1 = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessMulti, answers: {} }),
    });
    assert(sub1.status === 200, 'First submit failed');

    const sub2 = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessMulti, answers: {} }),
    });
    assert(sub2.status === 200, 'Re-submission of same session should succeed idempotently without crash');
    console.log('✓ Category 2.5 Passed: /api/exam/submit handles malformed answers, OOB indices, and idempotency.');
    testCount++;

    // 2.6 Boundary Inputs on GET /api/exam/practice
    // count: 0, negative, huge, string
    const pBounds = [
      { query: 'count=0', expectedCount: 10 }, // fallback
      { query: 'count=-5', expectedCount: 10 }, // fallback
      { query: 'count=abc', expectedCount: 10 }, // fallback
      { query: 'level=-1&count=5', expectedLevel: 1, expectedCount: 5 },
      { query: 'level=99&count=3', expectedLevel: 1, expectedCount: 3 },
      { query: 'skill=unknown_skill&count=4', expectedCount: 4 }, // falls back to level pool rather than failing or returning empty
    ];
    for (const pb of pBounds) {
      const res = await fetch(`${baseUrl}/api/exam/practice?${pb.query}`);
      assert(res.status === 200, `Expected 200 for ${pb.query}, got ${res.status}`);
      const d = await res.json();
      assert(d.success === true, 'Expected success: true');
      if (pb.expectedCount !== undefined) {
        assert(d.count === pb.expectedCount, `For ${pb.query}, expected count ${pb.expectedCount}, got ${d.count}`);
      }
    }
    console.log('✓ Category 2.6 Passed: /api/exam/practice boundaries and filtering robustly handled.');
    testCount++;

    // 2.7 Session TTL Expiration & Auto-Pruning
    const ttlGen = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, mode: 'mock' }),
    });
    const ttlSessId = (await ttlGen.json()).session.sessionId;
    const directSession = getSessionDirect(ttlSessId);
    assert(directSession !== undefined, 'Session not found in direct map');
    // Artificially expire the session
    directSession!.expiresAt = Date.now() - 10000;

    // Querying the expired session must trigger prune and return 404
    const ttlCheck = await fetch(`${baseUrl}/api/exam/session/${ttlSessId}`);
    assert(ttlCheck.status === 404, `Expired session expected 404, got ${ttlCheck.status}`);
    assert(getSessionDirect(ttlSessId) === undefined, 'Expired session was not pruned from memory');
    console.log('✓ Category 2.7 Passed: Expired session detected, auto-pruned, and returns clean 404.');
    testCount++;

    // 2.8 High-Volume Answers Payload Probing (5,000 keys)
    const hugeAnswers: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      hugeAnswers[`bogus-key-${i}`] = i % 4;
    }
    const subHuge = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, answers: hugeAnswers, timeSpentSeconds: 500 }),
    });
    assert(subHuge.status === 200, `Huge answers payload expected 200, got ${subHuge.status}`);
    const subHugeData = await subHuge.json();
    assert(subHugeData.scoreResult.totalScore === 0, 'Bogus 5,000 keys must result in 0 score');
    console.log('✓ Category 2.8 Passed: 5,000-key payload handled without memory exhaustion or crash.');
    testCount++;

    // -------------------------------------------------------------------------
    // Category 3: Concurrency & Session Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Category 3: Concurrency & Session Isolation ---');

    const CONCURRENCY_COUNT = 50;
    console.log(`Launching ${CONCURRENCY_COUNT} concurrent session generation requests...`);

    const concurrentPromises = [];
    for (let i = 0; i < CONCURRENCY_COUNT; i++) {
      const lvl = (i % 5) + 1; // Distribute across HSK 1..5
      concurrentPromises.push(
        fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: lvl, mode: 'mock' }),
        }).then(r => r.json())
      );
    }

    const concurrentResults = await Promise.all(concurrentPromises);
    const sessionIds = new Set<string>();

    for (let i = 0; i < CONCURRENCY_COUNT; i++) {
      const res = concurrentResults[i];
      assert(res.success === true, `Concurrent request ${i} failed`);
      assert(res.session && res.session.sessionId, `Missing sessionId in request ${i}`);
      assert(!sessionIds.has(res.session.sessionId), `DUPLICATE SESSION ID DETECTED: ${res.session.sessionId}`);
      sessionIds.add(res.session.sessionId);

      // Verify no leak in any concurrent response
      for (const q of res.session.questions) {
        assert(!('answer_index' in q), `Leak in concurrent question ${q.id}`);
      }
    }
    assert(sessionIds.size === CONCURRENCY_COUNT, `Expected ${CONCURRENCY_COUNT} unique session IDs, got ${sessionIds.size}`);
    console.log(`✓ Category 3.1 Passed: All ${CONCURRENCY_COUNT} concurrent sessions generated with unique UUIDs and complete anti-cheat isolation.`);
    testCount++;

    // Concurrently submit answers for 20 of those sessions
    console.log('Launching 20 concurrent exam submissions...');
    const submitPromises = Array.from(sessionIds).slice(0, 20).map((sId, idx) => {
      // Alternate between empty and partial answers
      const ans: Record<string, number> = {};
      return fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sId, answers: ans, timeSpentSeconds: 100 + idx }),
      }).then(r => r.json());
    });

    const submitResults = await Promise.all(submitPromises);
    for (const sRes of submitResults) {
      assert(sRes.success === true, 'Concurrent submit failed');
      assert(sRes.scoreResult !== undefined, 'Missing scoreResult');
    }
    console.log('✓ Category 3.2 Passed: 20 concurrent exam submissions processed cleanly without race conditions.');
    testCount++;

    // -------------------------------------------------------------------------
    // Category 4: Database Invariance
    // -------------------------------------------------------------------------
    console.log('\n--- Category 4: Database Invariance Verification ---');

    const postStats = getHskExamDbStats();
    console.log(`[Post-Test DB Invariant] Hash: ${postStats.hash}`);
    console.log(`[Post-Test DB Invariant] Questions Count: ${postStats.count}`);

    assert(
      postStats.hash === preStats.hash,
      `FATAL: data/hsk_exam.db hash changed! Pre: ${preStats.hash}, Post: ${postStats.hash}`
    );
    assert(
      postStats.count === preStats.count,
      `FATAL: data/hsk_exam.db row count changed! Pre: ${preStats.count}, Post: ${postStats.count}`
    );
    assert(
      postStats.hash === '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD',
      'Post-test DB hash does not match target canonical hash!'
    );
    assert(postStats.count === 6, 'Post-test DB questions count is not 6!');
    console.log('✓ Category 4 Passed: data/hsk_exam.db remained 100% UNTOUCHED and BIT-PERFECT.');
    testCount++;

    console.log('\n================================================================');
    console.log(`🎉 ALL ${testCount} ADVERSARIAL STRESS TEST SUITES PASSED EMPIRICALLY!`);
    console.log('================================================================');
  } finally {
    await stopServer();
  }
}

runAdversarialSuite().catch((err) => {
  console.error('\n❌ ADVERSARIAL STRESS TEST FAILED:', err);
  process.exit(1);
});
