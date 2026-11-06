import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { getQBankDbPath } from '../src/server/dbPaths.js';
import dotenv from 'dotenv';
import { generateWaterfallQuestions } from '../src/server/llm/waterfallGenerator.js';
import {
  computeContentHash,
  getComparableStem,
  loadExistingStemsFromDb,
  validateCandidate,
} from '../src/server/llm/questionValidator.js';
import { BatchRunSummary, CandidateQuestion } from '../src/server/llm/types.js';

// Load environment variables from .env
dotenv.config();

const DB_PATH = getQBankDbPath();

/**
 * Ensures required pending_questions, generation_runs, and generation_history tables exist
 */
function ensureSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_questions (
      id TEXT PRIMARY KEY,
      stem TEXT NOT NULL,
      options TEXT NOT NULL,
      answer_idx INTEGER NOT NULL,
      pinyin TEXT,
      explanation_vi TEXT NOT NULL,
      level INTEGER NOT NULL,
      skill TEXT NOT NULL,
      part_type TEXT NOT NULL,
      illustration_theme TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      provider_used TEXT,
      rejection_note TEXT,
      content_hash TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_pending_status_level ON pending_questions(status, level);
    CREATE INDEX IF NOT EXISTS idx_pending_skill ON pending_questions(skill);
    CREATE INDEX IF NOT EXISTS idx_pending_created ON pending_questions(created_at);
    CREATE INDEX IF NOT EXISTS idx_pending_hash ON pending_questions(content_hash);

    CREATE TABLE IF NOT EXISTS generation_runs (
      id TEXT PRIMARY KEY,
      batch_id TEXT,
      level INTEGER NOT NULL,
      skill TEXT,
      count_requested INTEGER NOT NULL,
      count_generated INTEGER NOT NULL,
      count_saved_pending INTEGER DEFAULT 0,
      count_rejected_validator INTEGER DEFAULT 0,
      provider_used TEXT NOT NULL,
      model_name TEXT,
      status TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_gen_runs_created ON generation_runs(created_at);

    CREATE TABLE IF NOT EXISTS generation_history (
      id TEXT PRIMARY KEY,
      batch_id TEXT,
      level INTEGER NOT NULL,
      skill TEXT,
      count_requested INTEGER NOT NULL,
      count_generated INTEGER NOT NULL,
      count_saved_pending INTEGER DEFAULT 0,
      count_rejected_validator INTEGER DEFAULT 0,
      provider_used TEXT NOT NULL,
      model_name TEXT,
      status TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_gen_hist_created ON generation_history(created_at);
  `);

  try {
    const pendCols = (db.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
    if (!pendCols.includes('topic')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN topic TEXT;');
      db.exec('CREATE INDEX IF NOT EXISTS idx_pending_topic ON pending_questions(topic);');
    }
  } catch {}
  try {
    db.exec('ALTER TABLE generation_runs ADD COLUMN token_usage TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE generation_history ADD COLUMN token_usage TEXT;');
  } catch {}
}

/**
 * Parses command-line arguments (--level=1, --count=5, --skill=all, --provider=auto, --topic=technology, --mock)
 */
function parseArgs(): {
  level: number;
  skill: 'listening' | 'reading' | 'writing' | 'all';
  count: number;
  provider: string;
  topic?: string;
  mock: boolean;
  loop: number;
  delay: number;
} {
  const args = process.argv.slice(2);
  let level = 1;
  let skill: 'listening' | 'reading' | 'writing' | 'all' = 'all';
  let count = 5;
  let provider = 'auto';
  let topic: string | undefined = undefined;
  let mock = process.env.QBANK_BRIDGE_MOCK === '1';
  let loop = 1;
  let delay = 15;

  for (const arg of args) {
    if (arg.startsWith('--level=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val >= 1 && val <= 6) level = val;
    } else if (arg.startsWith('--skill=')) {
      const val = arg.split('=')[1].toLowerCase().trim();
      if (['listening', 'reading', 'writing', 'all'].includes(val)) {
        skill = val as any;
      }
    } else if (arg.startsWith('--count=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) count = val;
    } else if (arg.startsWith('--provider=')) {
      provider = arg.split('=')[1].trim();
    } else if (arg.startsWith('--topic=')) {
      topic = arg.split('=')[1].trim();
    } else if (arg.startsWith('--loop=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) loop = val;
    } else if (arg.startsWith('--delay=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val >= 0) delay = val;
    } else if (arg === '--mock') {
      mock = true;
    }
  }

  return { level, skill, count, provider, topic, mock, loop, delay };
}

/**
 * Main batch question generator execution
 */
export async function runBatchGeneration(customArgs?: Partial<ReturnType<typeof parseArgs>>): Promise<BatchRunSummary> {
  const startTime = Date.now();
  const parsed = parseArgs();
  const level = customArgs?.level ?? parsed.level;
  const skill = customArgs?.skill ?? parsed.skill;
  const count = customArgs?.count ?? parsed.count;
  const provider = customArgs?.provider ?? parsed.provider;
  const topic = customArgs?.topic ?? parsed.topic;
  const mock = customArgs?.mock ?? parsed.mock;

  const timestampStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const batchId = `batch_${timestampStr}_${randomSuffix}`;

  console.log('======================================================================');
  console.log('          KHỞI ĐỘNG BATCH GENERATOR HSK 3.0');
  console.log('======================================================================');
  console.log(`  Mã lô (Batch ID):         ${batchId}`);
  console.log(`  Cấp độ HSK:               HSK ${level}`);
  console.log(`  Kỹ năng:                  ${skill}`);
  console.log(`  Số lượng yêu cầu:         ${count} câu`);
  console.log(`  Chủ đề (Topic):           ${topic || 'Tự do / Chung'}`);
  console.log(`  Chế độ hoạt động:         ${mock ? 'Mock Simulation' : 'Multi-LLM Waterfall'}`);
  console.log('----------------------------------------------------------------------');

  // 1. Connect to SQLite database
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 10000;');
  } catch {}
  ensureSchema(db);

  // 2. Load existing stems for deduplication
  const existingStems = loadExistingStemsFromDb(DB_PATH);
  console.log(`[Validator] Đã tải ${existingStems.length} câu hỏi hiện có trong DB để kiểm tra trùng lặp.`);

  // 3. Invoke Waterfall Generator
  console.log('[Waterfall] Bắt đầu tiến trình sinh câu hỏi qua chuỗi fallback...');
  let waterfallResult: any;
  try {
    waterfallResult = await generateWaterfallQuestions({
      level,
      skill,
      count,
      provider,
      topic,
      mock,
    });
  } catch (err: any) {
    if (err.message === 'LLM_ALL_PROVIDERS_EXHAUSTED' || err.message?.includes('LLM_ALL_PROVIDERS_EXHAUSTED')) {
      console.error('\n======================================================================');
      console.error('  [THẤT BẠI] LLM_ALL_PROVIDERS_EXHAUSTED: Toàn bộ LLM provider đã offline hoặc hết hạn mức.');
      console.error('  Bảo toàn tính toàn vẹn: KHÔNG chèn bất kỳ câu hỏi nào vào pending_questions.');
      console.error('======================================================================\n');

      const runId = `run_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const detailsJson = JSON.stringify({
        batch_id: batchId,
        error: 'LLM_ALL_PROVIDERS_EXHAUSTED',
        message: err.message,
        questions_saved: 0,
        questions_generated: 0,
      });

      try {
        const insertRunStmt = db.prepare(`
          INSERT INTO generation_runs (
            id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
          ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, 'none', 'failed', ?)
        `);
        insertRunStmt.run(runId, batchId, level, skill, count, provider !== 'auto' ? provider : 'all-providers-exhausted', detailsJson);

        const insertHistStmt = db.prepare(`
          INSERT INTO generation_history (
            id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
          ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, 'none', 'failed', ?)
        `);
        insertHistStmt.run(runId, batchId, level, skill, count, provider !== 'auto' ? provider : 'all-providers-exhausted', detailsJson);
      } catch (dbErr) {
        console.error('[Database Error] Không thể ghi nhận lịch sử thất bại:', dbErr);
      } finally {
        db.close();
      }

      process.exit(1);
    }

    db.close();
    throw err;
  }

  const generatedQuestions = waterfallResult.questions;
  console.log(`[Waterfall] Nhận được ${generatedQuestions.length} câu hỏi từ ${waterfallResult.providerUsed} (${waterfallResult.modelUsed}).`);

  // 4. Validate and filter candidates
  const validCandidates: CandidateQuestion[] = [];
  const rejectedReasons: Record<string, number> = {};
  let countRejected = 0;

  for (let i = 0; i < generatedQuestions.length; i++) {
    const q = generatedQuestions[i];
    const valResult = validateCandidate(q, existingStems, { requireLanguageQuality: true, requireDistractorRationales: true });

    if (valResult.valid) {
      validCandidates.push(q);
      // Add newly accepted stem to existing stems to prevent intra-batch duplicates
      existingStems.push(getComparableStem(q.stem, q.options, q.answer_idx));
    } else {
      countRejected++;
      console.warn(`[Validator Rejected] Câu #${i + 1}: ${valResult.errors.join('; ')}`);
      for (const err of valResult.errors) {
        const key = err.includes('similarity')
          ? 'Trùng lặp (>85% stem)'
          : err.includes('Latin or Vietnamese')
          ? 'Chứa chữ Latin/Việt'
          : err.includes('answer_idx')
          ? 'Lỗi chỉ số answer_idx'
          : err.includes('Options must be unique')
          ? 'Trùng lặp phương án'
          : err.includes('vocabulary exceeding') || err.includes('out-of-syllabus')
          ? 'Từ vựng vượt cấp HSK'
          : 'Lỗi schema cấu trúc';
        rejectedReasons[key] = (rejectedReasons[key] || 0) + 1;
      }
    }
  }

  // 5. Persist valid candidates into pending_questions table
  let countSaved = 0;
  db.exec('BEGIN IMMEDIATE;');
  try {
    const insertStmt = db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, topic, status, provider_used, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      ON CONFLICT(content_hash) DO NOTHING
    `);

    for (const q of validCandidates) {
      const qId = `pend_${level}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const contentHash = computeContentHash(q.stem, q.options, q.answer_idx);
      const optionsJson = JSON.stringify(q.options);

      const info = insertStmt.run(
        qId,
        q.stem,
        optionsJson,
        q.answer_idx,
        q.pinyin || null,
        q.explanation_vi,
        q.level,
        q.skill,
        q.part_type,
        q.illustration_theme || null,
        q.topic || topic || null,
        waterfallResult.providerUsed,
        contentHash
      );

      if ((info as any)?.changes > 0) {
        countSaved++;
      }
    }

    // 6. Record batch execution audit in generation_runs and generation_history
    const runId = `run_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const status = countSaved > 0 ? (countRejected === 0 ? 'success' : 'partial') : 'failed';
    const detailsJson = JSON.stringify({
      batch_id: batchId,
      fallback_occurred: waterfallResult.fallbackOccurred,
      fallback_log: waterfallResult.fallbackLog,
      token_usage: waterfallResult.tokenUsage || null,
      rejected_reasons: rejectedReasons,
      valid_saved_count: countSaved,
      rejected_count: countRejected,
    });

    const insertRunStmt = db.prepare(`
      INSERT INTO generation_runs (
        id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRunStmt.run(
      runId,
      batchId,
      level,
      skill,
      count,
      generatedQuestions.length,
      countSaved,
      countRejected,
      waterfallResult.providerUsed,
      waterfallResult.modelUsed,
      status,
      detailsJson
    );

    const insertHistStmt = db.prepare(`
      INSERT INTO generation_history (
        id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertHistStmt.run(
      runId,
      batchId,
      level,
      skill,
      count,
      generatedQuestions.length,
      countSaved,
      countRejected,
      waterfallResult.providerUsed,
      waterfallResult.modelUsed,
      status,
      detailsJson
    );

    db.exec('COMMIT;');
  } catch (txErr) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    console.error('[Database Error] Lỗi ghi pending_questions:', txErr);
  } finally {
    db.close();
  }

  const executionTimeMs = Date.now() - startTime;
  const summary: BatchRunSummary = {
    batchId,
    level,
    skill,
    countRequested: count,
    countGenerated: generatedQuestions.length,
    countSavedPending: countSaved,
    countRejectedValidator: countRejected,
    providerUsed: waterfallResult.providerUsed,
    modelUsed: waterfallResult.modelUsed,
    fallbackOccurred: waterfallResult.fallbackOccurred,
    fallbackLog: waterfallResult.fallbackLog,
    executionTimeMs,
    rejectedReasons,
    timestamp: new Date().toISOString(),
  };

  // 7. Output Console Summary Report
  console.log('\n======================================================================');
  console.log('         BÁO CÁO KẾT QUẢ BATCH GENERATION HSK 3.0');
  console.log('======================================================================');
  console.log(`  Mã lô (Batch ID):         ${summary.batchId}`);
  console.log(`  Cấp độ HSK:               HSK ${summary.level} (Kỹ năng: ${summary.skill})`);
  console.log(`  Số lượng yêu cầu:         ${summary.countRequested} câu`);
  console.log(`  Provider sử dụng:         ${summary.providerUsed} (model: ${summary.modelUsed})`);
  console.log(`  Fallback đã diễn ra:      ${summary.fallbackOccurred ? 'Có (Chuyển đổi provider)' : 'Không'}`);
  if (summary.fallbackLog.length > 0) {
    summary.fallbackLog.forEach((log) => console.log(`    -> ${log}`));
  }
  console.log('  --------------------------------------------------------------------');
  console.log(`  Tổng số câu sinh ra:      ${summary.countGenerated} câu`);
  console.log(`  Số câu hợp lệ (Vào DB):   ${summary.countSavedPending} câu (Trạng thái: pending)`);
  console.log(`  Số câu bị loại:           ${summary.countRejectedValidator} câu`);
  for (const [reason, countVal] of Object.entries(summary.rejectedReasons)) {
    console.log(`    - ${reason}: ${countVal} câu`);
  }
  console.log(`  Thời gian thực thi:       ${(summary.executionTimeMs / 1000).toFixed(1)} giây`);
  console.log('======================================================================\n');

  return summary;
}

// Auto-run if invoked directly via CLI
if (process.argv[1] && process.argv[1].endsWith('generate-questions.ts')) {
  (async () => {
    const args = parseArgs();
    const totalLoops = Math.max(1, args.loop || 1);
    const delaySec = Math.max(1, args.delay || 15);

    let totalSaved = 0;
    let totalGenerated = 0;

    for (let loopIdx = 1; loopIdx <= totalLoops; loopIdx++) {
      if (totalLoops > 1) {
        console.log(`\n>>> [TIẾN TRÌNH TỰ ĐỘNG] Đang chạy vòng lặp ${loopIdx}/${totalLoops}...`);
      }
      try {
        const res = await runBatchGeneration(args);
        totalSaved += res.countSavedPending;
        totalGenerated += res.countGenerated;
      } catch (err: any) {
        console.error(`[Lỗi vòng lặp ${loopIdx}]:`, err?.message || err);
      }

      if (loopIdx < totalLoops) {
        console.log(`[Pacing Rate Limit] Chờ ${delaySec} giây trước đợt tiếp theo để đảm bảo hạn mức Free Tier Groq...`);
        await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
      }
    }

    if (totalLoops > 1) {
      console.log('\n======================================================================');
      console.log('       TỔNG KẾT TIẾN TRÌNH TỰ ĐỘNG SINH ĐỀ');
      console.log('======================================================================');
      console.log(`  Tổng số vòng đã chạy:     ${totalLoops}`);
      console.log(`  Tổng số câu sinh ra:      ${totalGenerated} câu`);
      console.log(`  Tổng số câu hợp lệ (DB):  ${totalSaved} câu`);
      console.log('======================================================================\n');
    }
  })().catch((err) => {
    console.error('Fatal batch generation error:', err);
    process.exit(1);
  });
}
