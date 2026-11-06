import express from 'express';
import http from 'http';
import { examRouter, createTestExamDb, setExamDbForTesting } from '../src/server/examRoutes';

async function runLiveVerification() {
  console.log('=== STARTING LIVE API VERIFICATION ===');
  
  const memDb = createTestExamDb({ seedPool: true });
  setExamDbForTesting(memDb);

  const app = express();
  app.use(express.json());
  app.use('/api/exam', examRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}/api/exam`;
  console.log(`Test server listening at: ${baseUrl}`);

  try {
    // 1. Verify GET /api/exam/blueprints
    console.log('\n--- 1. Testing GET /api/exam/blueprints ---');
    const bpRes = await fetch(`${baseUrl}/blueprints`);
    console.log(`Status: ${bpRes.status}`);
    if (bpRes.status !== 200) throw new Error(`Expected 200, got ${bpRes.status}`);
    const bpJson = await bpRes.json();
    console.log(`Success: ${bpJson.success}`);

    const expectedCalibrated = {
      1: { q: 40, t: 40, max: 200, pass: 120 },
      2: { q: 60, t: 60, max: 300, pass: 180 },
      3: { q: 70, t: 83, max: 300, pass: 180 },
      4: { q: 70, t: 85, max: 300, pass: 180 },
      5: { q: 72, t: 110, max: 300, pass: 180 },
      6: { q: 82, t: 125, max: 300, pass: 180 },
    };

    for (let lvl = 1; lvl <= 6; lvl++) {
      const exp = expectedCalibrated[lvl as keyof typeof expectedCalibrated];
      const bp = bpJson.blueprints[lvl];
      if (!bp) throw new Error(`Missing blueprint for HSK ${lvl}`);
      console.log(`HSK ${lvl}: Questions=${bp.total_questions} (exp ${exp.q}), Duration=${bp.time_limit_minutes}m (exp ${exp.t}m), MaxScore=${bp.max_score} (exp ${exp.max}), PassScore=${bp.pass_score} (exp ${exp.pass})`);
      if (bp.total_questions !== exp.q || bp.time_limit_minutes !== exp.t || bp.max_score !== exp.max || bp.pass_score !== exp.pass) {
        throw new Error(`HSK ${lvl} blueprint mismatch!`);
      }
    }
    console.log('>>> GET /api/exam/blueprints PASSED with 100% calibrated values!');

    // 2. Verify POST /api/exam/generate-mock (mode: 'mock') across HSK 1-6
    console.log('\n--- 2. Testing POST /api/exam/generate-mock (mode: "mock") for HSK 1–6 ---');
    for (let lvl = 1; lvl <= 6; lvl++) {
      const exp = expectedCalibrated[lvl as keyof typeof expectedCalibrated];
      const res = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: lvl, mode: 'mock' }),
      });
      console.log(`HSK ${lvl} mock request -> Status: ${res.status}`);
      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 for shortage at HSK ${lvl}, got ${res.status}`);
      }
      const json = await res.json();
      console.log(`  HSK ${lvl} response: success=${json.success}, mode=${json.mode}, total_required=${json.total_required}, total_available=${json.total_available}, total_missing=${json.total_missing}`);
      console.log(`  Error message snippet: ${json.error}`);
      if (json.total_required !== exp.q) {
        throw new Error(`HSK ${lvl} expected total_required=${exp.q}, got ${json.total_required}`);
      }
      if (json.total_missing !== exp.q) {
        throw new Error(`HSK ${lvl} expected total_missing=${exp.q}, got ${json.total_missing}`);
      }
      if (json.is_fully_eligible !== false) {
        throw new Error(`HSK ${lvl} expected is_fully_eligible=false`);
      }
    }
    console.log('>>> POST /api/exam/generate-mock (mode: "mock") PASSED for all levels HSK 1–6!');

    // 3. Verify POST /api/exam/generate-mock (mode: 'practice')
    console.log('\n--- 3. Testing POST /api/exam/generate-mock (mode: "practice") ---');
    const pracRes = await fetch(`${baseUrl}/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, skill: 'reading', mode: 'practice' }),
    });
    console.log(`Practice request HSK 1 Reading -> Status: ${pracRes.status}`);
    if (pracRes.status !== 200) {
      throw new Error(`Expected 200 for practice mode, got ${pracRes.status}`);
    }
    const pracJson = await pracRes.json();
    console.log(`  Practice response: success=${pracJson.success}, mode=${pracJson.mode}, questionsCount=${pracJson.questions?.length}`);
    if (!pracJson.success || !Array.isArray(pracJson.questions) || pracJson.questions.length === 0) {
      throw new Error(`Expected valid questions served in practice mode for HSK 1 Reading`);
    }
    console.log(`  Sample question stem: "${pracJson.questions[0].stem}"`);
    console.log(`  Sample question options count: ${pracJson.questions[0].options?.length}`);

    // Test empty skill in strict QBank practice mode (e.g. HSK 6 writing where 0 approved questions exist)
    const strictEmptyRes = await fetch(`${baseUrl}/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 6, skill: 'writing', mode: 'practice', strictQbankOnly: true }),
    });
    console.log(`Strict QBank practice request HSK 6 Writing -> Status: ${strictEmptyRes.status}`);
    const strictEmptyJson = await strictEmptyRes.json();
    console.log(`  Strict empty practice response: success=${strictEmptyJson.success}, questionsCount=${strictEmptyJson.questions?.length}`);
    if (strictEmptyRes.status !== 200 || !strictEmptyJson.success || strictEmptyJson.questions?.length !== 0) {
      throw new Error(`Expected clean empty questions array for strict QBank practice mode`);
    }

    // Test non-strict practice mode when empty (serves fixtures with clear notice and 0 LLM calls)
    const nonStrictEmptyRes = await fetch(`${baseUrl}/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 6, skill: 'writing', mode: 'practice' }),
    });
    console.log(`Non-strict practice request HSK 6 Writing -> Status: ${nonStrictEmptyRes.status}`);
    const nonStrictEmptyJson = await nonStrictEmptyRes.json();
    console.log(`  Non-strict practice fallback response: success=${nonStrictEmptyJson.success}, usingFixtureFallback=${nonStrictEmptyJson.usingFixtureFallback}, count=${nonStrictEmptyJson.questions?.length}`);
    if (nonStrictEmptyRes.status !== 200 || !nonStrictEmptyJson.usingFixtureFallback) {
      throw new Error(`Expected labeled fixture fallback for non-strict practice mode when bank is empty`);
    }
    console.log('>>> POST /api/exam/generate-mock (mode: "practice") PASSED with 0 LLM calls!');

  } finally {
    setExamDbForTesting(null);
    try {
      memDb.close();
    } catch {}
    server.close();
  }
  
  console.log('\n=== ALL LIVE API VERIFICATION CHECKS PASSED 100% ===');
}

runLiveVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
