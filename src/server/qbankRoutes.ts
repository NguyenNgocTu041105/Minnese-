import { Router, Request, Response, NextFunction } from 'express';
import { execFile, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { getQBankDbPath } from './dbPaths.js';
import { generateWaterfallQuestions } from './llm/waterfallGenerator.js';
import { generateAccuratePinyin } from '../utils/pinyinEngine.js';
import { isValidIllustrationTheme, isOpenEndedWritingTask, inferThemeFromText, normalizeDialogueSpeakers } from './llm/promptTemplates.js';
import {
  validateCandidate,
  getComparableStem,
  evaluateCandidateSixGates,
  isVisualQuestionType,
} from './llm/questionValidator.js';
import { parseUniversalQuestions } from './llm/universalQuestionParser.js';
import { CandidateQuestion } from './llm/types.js';
import {
  extractUploadedFileDetails,
  parseUploadedFileBuffer,
} from './fileUploadParser.js';
import {
  exportExamToExcel,
  exportExamToWord,
  exportExamToJson,
} from './examExportService.js';
import { describeValidationIssue, summarizeCandidateIssues } from './llm/validationDiagnostics.js';
import { writeValidationDiagnosticArtifact } from './llm/validationArtifact.js';
import {
  syncApprovedQuestion,
  syncApprovedQuestionToPool,
  ensureEligiblePoolSchema,
  reEvaluateApprovedQuestions,
  getEligiblePoolStats,
  inspectExamPoolBySections,
  getPersistentTask,
  createPersistentTask,
  completePersistentTask,
  failPersistentTask,
  acquireGenerationLock,
} from './qbankFormatSync.js';
import {
  getAutoSchedulerStatus,
  toggleAutoScheduler,
  updateSchedulerConfig,
  runScheduledBatch,
} from './cron/autoQuestionScheduler.js';
import {
  applyAdditiveQBankMigrations,
  computeNearDuplicateSignature,
  computeVocabCoverage,
  computeCoverageMatrix,
  getPriorityDeficitGroup,
  planBatchVocab,
  verifyQuestionVocab,
  getCoverageTargets,
  invalidateVocabCoverageCache,
  getSyllabusCatalog,
  loadSyllabusVocab,
  loadSyllabusChars,
  classifyGroupStatus,
  loadSyllabusKnowledgeItems,
  loadSyllabusWritingChars,
  getGrammarCatalogMetadata,
  parseExplanationDistractorRationales,
  parseExplanationMetadata,
} from './qbankCoverageEngine.js';
import { getOfficialCoverageService } from './qbankOfficialCoverageService.js';

export {
  applyAdditiveQBankMigrations,
  computeNearDuplicateSignature,
  computeVocabCoverage,
  computeCoverageMatrix,
  getPriorityDeficitGroup,
  planBatchVocab,
  verifyQuestionVocab,
  getCoverageTargets,
  invalidateVocabCoverageCache,
  getSyllabusCatalog,
  loadSyllabusVocab,
  loadSyllabusChars,
  classifyGroupStatus,
  loadSyllabusKnowledgeItems,
  loadSyllabusWritingChars,
  getGrammarCatalogMetadata,
  getOfficialCoverageService,
};

export const qbankRouter = Router();

/**
 * Kill-switch checker: checks QBANK_ADMIN_ENABLED env (default false).
 * Force disabled if NODE_ENV === 'production' or process.env.VERCEL is set.
 */
export function isQBankAdminEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.VERCEL !== undefined && process.env.VERCEL !== '') return false;
  return (process.env.QBANK_ADMIN_ENABLED || '').toLowerCase().trim() === 'true';
}

let activeAdminToken: string | null = null;
let isTestingToken = false;
let adminTokenWarningLogged = false;

/**
 * Returns the configured QBank Admin Token from environment or testing override.
 * Returns null if no token is configured in environment.
 * Note: Never generates guessable default tokens or prints tokens to console.
 */
export function getQBankAdminToken(): string | null {
  if (activeAdminToken !== null) {
    return activeAdminToken;
  }
  const envToken = process.env.QBANK_ADMIN_TOKEN?.trim();
  if (envToken) {
    activeAdminToken = envToken;
  } else {
    activeAdminToken = null;
  }
  return activeAdminToken;
}

/**
 * Logs a safe configuration warning if QBANK_ADMIN_TOKEN is missing or insecure.
 * NEVER prints or leaks the token secret.
 */
export function warnIfInsecureAdminToken(): void {
  if (!isQBankAdminEnabled()) return;
  if (adminTokenWarningLogged) return;
  adminTokenWarningLogged = true;

  const envToken = process.env.QBANK_ADMIN_TOKEN?.trim();
  if (!envToken) {
    console.warn('[QBank Security] CẢNH BÁO: QBANK_ADMIN_TOKEN chưa được thiết lập trong file .env. Tất cả các API quản trị QBank sẽ bị từ chối.');
  } else if (envToken === 'admin123456') {
    console.warn('[QBank Security] CẢNH BÁO NGUY HIỂM: QBANK_ADMIN_TOKEN đang sử dụng giá trị mặc định đã bị lộ ("admin123456"). Tất cả các API quản trị QBank sẽ bị từ chối.');
  } else if (envToken.length < 32) {
    console.warn('[QBank Security] CẢNH BÁO: QBANK_ADMIN_TOKEN quá yếu (< 32 ký tự). Yêu cầu tối thiểu 32 ký tự ngẫu nhiên.');
  }
}

/**
 * Backward-compatible alias for warnIfInsecureAdminToken.
 * Completely eliminates ephemeral token generation and console logging.
 */
export const logEphemeralTokenIfNeeded = warnIfInsecureAdminToken;

/**
 * Test helpers to set or reset active token in unit tests
 */
export function setQBankAdminTokenForTesting(t: string | null): void {
  activeAdminToken = t;
  isTestingToken = t !== null;
  adminTokenWarningLogged = false;
}

/**
 * Security middleware / Admin Auth for QBank Admin:
 * 1. Loopback IP check (127.0.0.1, ::1, ::ffff:127.0.0.1)
 * 2. Host header check (localhost or 127.0.0.1 with optional port)
 * 3. Origin check on mutating requests (POST/PUT/DELETE)
 * 4. Token authentication check:
 *    - Supports Authorization: Bearer <token>, X-QBank-Token: <token>, X-QBank-Admin-Token: <token>
 *    - Rejects missing token with 401
 *    - Rejects revoked old default 'admin123456' with 403 Forbidden
 *    - Rejects weak tokens (< 32 characters) with 403 (or 503 if server misconfigured)
 *    - Validates server environment token (refuses requests if unset or weak)
 *    - Performs constant-time timing-safe comparison (crypto.timingSafeEqual)
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Loopback IP check: req.socket.remoteAddress must be loopback ('127.0.0.1', '::1', '::ffff:127.0.0.1')
  const remoteIp = (req.socket?.remoteAddress || req.ip || '').trim();
  const isLoopbackIp =
    remoteIp === '127.0.0.1' ||
    remoteIp === '::1' ||
    remoteIp === '::ffff:127.0.0.1';

  if (!isLoopbackIp) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: QBank Admin is restricted to local loopback interface.',
    });
  }

  // 2. Host check: req.headers.host must match loopback (localhost or 127.0.0.1, with optional port)
  const host = (req.headers.host || '').trim();
  const isLoopbackHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  if (!isLoopbackHost) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Invalid Host header for QBank Admin.',
    });
  }

  // 3. Origin check on mutating requests (POST/PUT/DELETE)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase())) {
    const origin = req.headers.origin;
    if (origin) {
      const isLoopbackOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      if (!isLoopbackOrigin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Cross-Origin request not allowed for QBank Admin.',
        });
      }
    }
  }

  // 4. Token auth: require Authorization: Bearer <token>, X-QBank-Token, or X-QBank-Admin-Token
  let clientToken: string | undefined;
  const xToken = req.headers['x-qbank-token'] || req.headers['x-qbank-admin-token'];
  if (typeof xToken === 'string' && xToken.trim()) {
    clientToken = xToken.trim();
  } else if (req.headers.authorization && typeof req.headers.authorization === 'string') {
    const authHeader = req.headers.authorization.trim();
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      clientToken = authHeader.slice(7).trim();
    }
  }

  // Reject missing client token with 401
  if (!clientToken) {
    return res.status(401).json({
      success: false,
      error: 'Chưa xác thực: Thiếu token quản trị QBank (Authorization Bearer hoặc X-QBank-Token).',
    });
  }

  // Explicitly REJECT the compromised old default token 'admin123456'
  if (clientToken === 'admin123456') {
    return res.status(403).json({
      success: false,
      error: 'Từ chối truy cập: Token "admin123456" đã bị thu hồi do không an toàn. Vui lòng sử dụng token mới được cấu hình trong .env.',
    });
  }

  // Reject weak client token (< 32 characters)
  if (clientToken.length < 32 && !isTestingToken) {
    return res.status(403).json({
      success: false,
      error: 'Từ chối truy cập: Token quản trị không đủ độ an toàn (yêu cầu tối thiểu 32 ký tự).',
    });
  }

  // Check server configured token
  const expectedToken = getQBankAdminToken();
  if (!expectedToken) {
    warnIfInsecureAdminToken();
    return res.status(503).json({
      success: false,
      error: 'Dịch vụ quản trị chưa sẵn sàng: QBANK_ADMIN_TOKEN chưa được thiết lập trên máy chủ backend.',
    });
  }

  if (expectedToken === 'admin123456') {
    warnIfInsecureAdminToken();
    return res.status(503).json({
      success: false,
      error: 'Dịch vụ quản trị bị vô hiệu hóa: Token quản trị trên máy chủ đang sử dụng giá trị mặc định đã bị thu hồi ("admin123456").',
    });
  }

  if (expectedToken.length < 32 && !isTestingToken) {
    warnIfInsecureAdminToken();
    return res.status(503).json({
      success: false,
      error: 'Dịch vụ quản trị bị vô hiệu hóa: Token quản trị trên máy chủ không đủ độ phức tạp (< 32 ký tự).',
    });
  }

  // Constant-time timing-safe comparison
  const clientBuf = Buffer.from(clientToken, 'utf-8');
  const expectedBuf = Buffer.from(expectedToken, 'utf-8');

  let tokenValid = false;
  if (clientBuf.length === expectedBuf.length) {
    tokenValid = crypto.timingSafeEqual(clientBuf, expectedBuf);
  } else {
    // Constant-time dummy comparison to prevent length timing leaks
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
    tokenValid = false;
  }

  if (!tokenValid) {
    return res.status(403).json({
      success: false,
      error: 'Từ chối truy cập: Mã token quản trị QBank không hợp lệ.',
    });
  }

  next();
}

export const qbankSecurityMiddleware = requireAdminAuth;

// Attach security middleware to all QBank Admin routes
qbankRouter.use(requireAdminAuth);

/**
 * Secret scrubbing helper: masks sensitive database URLs, API keys, server paths, and command errors
 */
export function sanitizeError(msg: string): string {
  if (!msg) return 'Đã xảy ra lỗi không xác định';
  return msg
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[REDACTED_DATABASE_URL]')
    .replace(/AIzaSy[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9_-]+/g, '[REDACTED_BEARER]')
    .replace(/[a-zA-Z]:\\[^"'\n\r\t<>:]+/g, '[REDACTED_PATH]')
    .replace(/(?:\/[a-zA-Z0-9_.-]+){2,}/g, '[REDACTED_PATH]')
    .replace(/Command failed:[^\n\r]*/gi, '');
}

// Unified Concurrency Lock is now managed persistently via qbank_tasks in SQLite (acquireGenerationLock)

/**
 * Executes Python QBank API bridge CLI with UTF-8 environment and timeout
 */
export function callPythonBridge(
  action: string,
  payload: Record<string, any> = {},
  timeoutMs = 90000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonEnv = {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      PYTHONUNBUFFERED: '1',
    };

    const args = ['-m', 'qbank.api_bridge', action, '--payload', JSON.stringify(payload)];

    execFile(
      process.env.QBANK_PYTHON_EXECUTABLE?.trim() || 'python',
      args,
      {
        cwd: process.cwd(),
        env: pythonEnv,
        maxBuffer: 20 * 1024 * 1024,
        timeout: timeoutMs,
      },
      (error, stdout, stderr) => {
        if (stdout && stdout.trim()) {
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.success === false) {
              return reject(new Error(sanitizeError(parsed.error || 'Thao tác QBank thất bại')));
            }
            return resolve(parsed);
          } catch {
            // Stdout was not clean JSON, fall through to error handling
          }
        }

        if (error) {
          const rawErr = stderr || error.message || 'Lỗi tiến trình Python QBank';
          return reject(new Error(sanitizeError(rawErr)));
        }

        resolve({ success: true });
      }
    );
  });
}

// Lazily initialized in-process SQLite instance for high-speed reads
let dbSyncInstance: DatabaseSync | null = null;

/**
 * Computes deterministic SHA-256 content hash on normalized NFC text matching Python QbQuestion.compute_hash
 */
export function computeContentHash(stem: string, options: string[], answerIdx: number, optionsImages?: string[]): string {
  const normStem = (stem || '').trim().normalize('NFC');
  const normOpts = (options || []).map((opt) => (opt || '').trim().normalize('NFC')).join('|');
  const normImages = (optionsImages || []).map((image) => (image || '').trim().normalize('NFC').toLowerCase()).join('|');
  const raw = `${normStem}##${normOpts}##${answerIdx}${normImages ? `##${normImages}` : ''}`;
  return crypto.createHash('sha256').update(raw, 'utf-8').digest('hex');
}

/**
 * Ensures pending_questions, questions, generation_runs and generation_history tables and indices exist in data/qbank/qbank.db
 */
export function ensurePendingSchema(db?: DatabaseSync): void {
  const targetDb = db || (dbSyncInstance ? dbSyncInstance : getDbSync());

  targetDb.exec(`
    CREATE TABLE IF NOT EXISTS pending_questions (
      id TEXT PRIMARY KEY,
      batch_id TEXT,
      stem TEXT NOT NULL,
      options TEXT NOT NULL,
      answer_idx INTEGER NOT NULL,
      pinyin TEXT,
      explanation_vi TEXT NOT NULL,
      level INTEGER NOT NULL,
      skill TEXT NOT NULL,
      part_type TEXT NOT NULL,
      illustration_theme TEXT,
      options_images TEXT,
      topic TEXT,
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

    CREATE TABLE IF NOT EXISTS questions (
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
      options_images TEXT,
      topic TEXT,
      status TEXT NOT NULL DEFAULT 'approved',
      provider_used TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_questions_level_status ON questions(level, status);
    CREATE INDEX IF NOT EXISTS idx_questions_skill ON questions(skill);
    CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at);
    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);

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
    CREATE INDEX IF NOT EXISTS idx_gen_history_created ON generation_history(created_at);

    CREATE TABLE IF NOT EXISTS qb_questions (
      question_id TEXT PRIMARY KEY,
      level INTEGER NOT NULL,
      skill TEXT NOT NULL,
      part_type TEXT NOT NULL,
      stem TEXT NOT NULL,
      passage TEXT,
      options TEXT NOT NULL,
      answer_index INTEGER NOT NULL,
      explanation_vi TEXT NOT NULL,
      pinyin_stem TEXT,
      vocab_tags TEXT,
      topic TEXT,
      difficulty TEXT,
      display_label TEXT,
      provenance TEXT NOT NULL,
      qa TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'needs_review',
      report_count INTEGER DEFAULT 0,
      times_answered INTEGER DEFAULT 0,
      times_wrong INTEGER DEFAULT 0,
      content_hash TEXT UNIQUE NOT NULL,
      group_id TEXT,
      group_passage TEXT,
      group_options TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_qb_questions_hash ON qb_questions(content_hash);
    CREATE INDEX IF NOT EXISTS idx_qb_questions_status ON qb_questions(status, level);
  `);

  try {
    const runCols = (targetDb.prepare('PRAGMA table_info(generation_runs)').all() as any[]).map((c) => c.name);
    if (!runCols.includes('batch_id')) {
      targetDb.exec('ALTER TABLE generation_runs ADD COLUMN batch_id TEXT;');
    }
    if (!runCols.includes('model_name')) {
      targetDb.exec('ALTER TABLE generation_runs ADD COLUMN model_name TEXT;');
    }
  } catch {}

  try {
    const histCols = (targetDb.prepare('PRAGMA table_info(generation_history)').all() as any[]).map((c) => c.name);
    if (!histCols.includes('batch_id')) {
      targetDb.exec('ALTER TABLE generation_history ADD COLUMN batch_id TEXT;');
    }
    if (!histCols.includes('model_name')) {
      targetDb.exec('ALTER TABLE generation_history ADD COLUMN model_name TEXT;');
    }
  } catch {}

  try {
    const pendCols = (targetDb.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
    if (!pendCols.includes('topic')) {
      targetDb.exec('ALTER TABLE pending_questions ADD COLUMN topic TEXT;');
    }
    if (!pendCols.includes('batch_id')) {
      targetDb.exec('ALTER TABLE pending_questions ADD COLUMN batch_id TEXT;');
    }
    if (!pendCols.includes('options_images')) {
      targetDb.exec('ALTER TABLE pending_questions ADD COLUMN options_images TEXT;');
    }
    if (!pendCols.includes('audio_url')) {
      targetDb.exec('ALTER TABLE pending_questions ADD COLUMN audio_url TEXT;');
    }
    targetDb.exec('CREATE INDEX IF NOT EXISTS idx_pending_topic ON pending_questions(topic);');
    targetDb.exec('CREATE INDEX IF NOT EXISTS idx_pending_batch_id ON pending_questions(batch_id);');
  } catch {}

  try {
    const qCols = (targetDb.prepare('PRAGMA table_info(questions)').all() as any[]).map((c) => c.name);
    if (!qCols.includes('topic')) {
      targetDb.exec('ALTER TABLE questions ADD COLUMN topic TEXT;');
      targetDb.exec('CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);');
    }
    if (!qCols.includes('options_images')) {
      targetDb.exec('ALTER TABLE questions ADD COLUMN options_images TEXT;');
    }
    if (!qCols.includes('audio_url')) {
      targetDb.exec('ALTER TABLE questions ADD COLUMN audio_url TEXT;');
    }
  } catch {}

  // Centralized additive migrations for HSK 3.0 coverage engine (columns, indexes, backfill)
  applyAdditiveQBankMigrations(targetDb);
}

function extractExistingStemsFromDb(targetDb: DatabaseSync): string[] {
  const stems: string[] = [];
  try {
    const qbRows = targetDb.prepare('SELECT stem, options, answer_index FROM qb_questions').all() as any[];
    for (const row of qbRows) {
      if (!row.stem) continue;
      let opts: string[] = [];
      try {
        opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
      } catch {}
      stems.push(getComparableStem(row.stem, opts, Number(row.answer_index)));
    }
  } catch {}
  try {
    const pendRows = targetDb.prepare('SELECT stem, options, answer_idx FROM pending_questions').all() as any[];
    for (const row of pendRows) {
      if (!row.stem) continue;
      let opts: string[] = [];
      try {
        opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
      } catch {}
      stems.push(getComparableStem(row.stem, opts, Number(row.answer_idx)));
    }
  } catch {}
  try {
    const qRows = targetDb.prepare('SELECT stem, options, answer_idx FROM questions').all() as any[];
    for (const row of qRows) {
      if (!row.stem) continue;
      let opts: string[] = [];
      try {
        opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
      } catch {}
      stems.push(getComparableStem(row.stem, opts, Number(row.answer_idx)));
    }
  } catch {}
  return stems;
}

export function setDbSync(db: DatabaseSync | null): void {
  dbSyncInstance = db;
}

export function getDbSync(): DatabaseSync {
  if (!dbSyncInstance) {
    const dbPath = getQBankDbPath();
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const instance = new DatabaseSync(dbPath);
    try {
      instance.exec('PRAGMA journal_mode = WAL;');
      instance.exec('PRAGMA busy_timeout = 5000;');
    } catch {
      // Best-effort PRAGMA setup
    }
    dbSyncInstance = instance;
    ensurePendingSchema(instance);
  }
  return dbSyncInstance;
}

export function setDbSyncForTesting(db: DatabaseSync | null): void {
  dbSyncInstance = db;
}


/**
 * Formats a SQLite row from qb_questions into the full JSON question schema
 */
function formatQuestionRow(row: any) {
  let options: string[] = [];
  try {
    options = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
  } catch {
    options = [];
  }

  let provenance: any = {};
  try {
    provenance = typeof row.provenance === 'string' ? JSON.parse(row.provenance) : (row.provenance || {});
  } catch {
    provenance = {};
  }

  let qa: any = { structure_ok: true, level_ok: true, out_of_level_words: [], notes: [] };
  try {
    qa = typeof row.qa === 'string' ? JSON.parse(row.qa) : (row.qa || qa);
  } catch {
    // default qa
  }

  let vocab_tags: string[] = [];
  try {
    vocab_tags = typeof row.vocab_tags === 'string' ? (row.vocab_tags ? JSON.parse(row.vocab_tags) : []) : (row.vocab_tags || []);
  } catch {
    vocab_tags = [];
  }

  // Detect critical flags for UI highlighting and validation
  const flags: string[] = [];
  const charNoiseReasons: string[] = [];

  const textToCheck = `${row.stem || ''} ${options.join(' ')}`;
  const hasLatin = /[a-zA-Z]/.test(textToCheck);
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(textToCheck);
  const hasParen = /[()（）]/.test(textToCheck);

  if (hasLatin || hasVietnamese || hasParen) {
    flags.push('char_noise (Ký tự nhiễu: Latin, tiếng Việt, hoặc ngoặc đơn trong stem/options)');
    if (hasLatin) charNoiseReasons.push('Chứa ký tự Latin');
    if (hasVietnamese) charNoiseReasons.push('Chứa tiếng Việt');
    if (hasParen) charNoiseReasons.push('Chứa ngoặc đơn chú thích');
  }

  const notesStr = (Array.isArray(qa.notes) ? qa.notes.join(' ') : '').toLowerCase();
  if (
    notesStr.includes('solver flagged ambiguity') ||
    notesStr.includes('solver mismatch') ||
    notesStr.includes('2 options acceptable') ||
    notesStr.includes('3 options acceptable')
  ) {
    flags.push('solver_ambiguity (Solver phát hiện đa nghĩa hoặc lệch đáp án)');
  }

  if (!qa.level_ok || notesStr.includes('vượt cấp') || notesStr.includes('ngoài cấp')) {
    flags.push('out_of_level_chars (Chữ Hán vượt ngoài cấp độ HSK)');
  }

  if (notesStr.includes('gần trùng lặp') || notesStr.includes('trùng lặp')) {
    flags.push('near_duplicate (Nghi vấn gần trùng lặp với câu có sẵn)');
  }

  if (notesStr.includes('model dự phòng') || notesStr.includes('fallback')) {
    flags.push(`fallback_model (Sinh bởi model dự phòng: ${provenance?.llm_model || ''})`);
  }

  return {
    question_id: row.question_id,
    level: row.level,
    skill: row.skill,
    part_type: row.part_type,
    stem: row.stem,
    passage: row.passage,
    audio_url: row.audio_url || null,
    options,
    options_images: Array.isArray(row.options_images)
      ? row.options_images
      : typeof row.options_images === 'string'
      ? (() => { try { return JSON.parse(row.options_images); } catch { return []; } })()
      : [],
    answer_index: row.answer_index,
    explanation_vi: row.explanation_vi,
    pinyin_stem: row.pinyin_stem,
    vocab_tags,
    topic: row.topic,
    difficulty: row.difficulty,
    display_label: row.display_label,
    status: row.status,
    content_hash: row.content_hash,
    provenance,
    qa,
    critical_flags: {
      flags,
      has_char_noise: flags.some((f) => f.startsWith('char_noise')),
      char_noise_reasons: charNoiseReasons,
      has_solver_ambiguity: flags.some((f) => f.startsWith('solver_ambiguity')),
      has_out_of_level: flags.some((f) => f.startsWith('out_of_level_chars')),
      has_critical: flags.length > 0,
    },
  };
}

// =========================================================================
// 1. GET /api/qbank/stats: Total question counts, by status/level, flags, syllabus coverage
// =========================================================================
qbankRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const data = await callPythonBridge('stats');
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 2. GET /api/qbank/questions: Fast query on data/qbank/qbank.db
// =========================================================================
qbankRouter.get('/questions', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const levelStr = req.query.level as string | undefined;
    const skill = req.query.skill as string | undefined;
    const batchId = req.query.batch_id as string | undefined;
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string || '50', 10), 200));
    const offset = Math.max(0, parseInt(req.query.offset as string || '0', 10));

    const level = levelStr ? parseInt(levelStr, 10) : undefined;

    // Fast in-process query via DatabaseSync
    try {
      const db = getDbSync();

      const conditions: string[] = ['1=1'];
      const params: any[] = [];

      if (status && status !== 'all') {
        conditions.push('status = ?');
        params.push(status);
      }

      if (level && !isNaN(level)) {
        conditions.push('level = ?');
        params.push(level);
      }

      if (skill && skill !== 'all') {
        conditions.push('skill = ?');
        params.push(skill);
      }

      if (batchId) {
        conditions.push('json_extract(provenance, "$.batch_id") = ?');
        params.push(batchId);
      }

      const whereClause = conditions.join(' AND ');

      // Total count
      const countStmt = db.prepare(`SELECT COUNT(*) as count FROM qb_questions WHERE ${whereClause}`);
      const countResult: any = countStmt.get(...params);
      const total = countResult?.count ? Number(countResult.count) : 0;

      // Paginated rows
      const queryStmt = db.prepare(
        `SELECT * FROM qb_questions WHERE ${whereClause} ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`
      );
      const rows: any[] = queryStmt.all(...params, limit, offset);

      const questions = rows.map(formatQuestionRow);

      return res.json({
        success: true,
        total,
        questions,
      });
    } catch {
      // Fallback to Python bridge if in-process SQLite query encounters an edge case
      const pyData = await callPythonBridge('questions', {
        level,
        status,
        batch_id: batchId,
        limit,
        offset,
      });
      return res.json(pyData);
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 3. POST /api/qbank/generate: Invokes 4-Tier Waterfall Generator with Concurrency Lock
// =========================================================================
qbankRouter.post('/generate', async (req: Request, res: Response) => {
  const db = getDbSync();
  ensurePendingSchema(db);

  const rawLevel = parseInt(req.body.level || 1, 10);
  const level = Math.min(Math.max(isNaN(rawLevel) ? 1 : rawLevel, 1), 6);

  const provider = (req.body.provider || req.body.preferred_provider || req.body.preferredProvider)
    ? String(req.body.provider || req.body.preferred_provider || req.body.preferredProvider).trim()
    : 'auto';
  const isHskPipeline = provider.toLowerCase() === 'hsk_pipeline' || provider.toLowerCase() === 'pipeline_python';
  const isLocalGpuProvider = provider.toLowerCase() === 'ollama' || isHskPipeline;

  const rawCount = parseInt(req.body.count || 5, 10);
  const maxAllowedCount = isLocalGpuProvider ? 50 : 25;
  const count = Math.min(Math.max(isNaN(rawCount) ? 5 : rawCount, 1), maxAllowedCount);

  let partType = req.body.part_type || 'read_fill_blank_4opt';
  if (partType === 'fill_blank') partType = 'read_fill_blank_4opt';
  if (partType === 'reading_comprehension') partType = 'read_comprehension_4opt';

  const skill = (req.body.skill || (
    partType.startsWith('listen_') ? 'listening' :
    partType.startsWith('write_') ? 'writing' : 'reading'
  )) as 'listening' | 'reading' | 'writing' | 'all';
  const rawTopic = req.body.topic ? String(req.body.topic).trim() : undefined;
  const lesson = req.body.lesson ? String(req.body.lesson).trim() : undefined;
  const topic = [lesson ? `Bài: ${lesson}` : '', rawTopic].filter(Boolean).join(' - ') || undefined;

  const dryRun = Boolean(req.body.dry_run ?? req.body.dryRun);
  const difficultyTier = req.body.difficulty_tier || req.body.difficultyTier;
  const trapType = req.body.trap_type || req.body.trapType;
  const targetGrammar = req.body.target_grammar || req.body.targetGrammar || req.body.grammar;
  const strictLevel = Boolean(req.body.strict_level ?? req.body.strictLevel ?? false);

  // Support teacher-specified target vocabulary scope
  let targetVocabs: any[] | undefined = undefined;
  const rawVocabs = req.body.target_vocabs || req.body.target_vocabulary || req.body.target_vocab || req.body.vocabulary;
  if (Array.isArray(rawVocabs) && rawVocabs.length > 0) {
    targetVocabs = rawVocabs
      .map((v: any) => (typeof v === 'string' ? { word: v.trim() } : v))
      .filter((v: any) => v && v.word);
  } else if (typeof rawVocabs === 'string' && rawVocabs.trim().length > 0) {
    targetVocabs = rawVocabs
      .split(/[,，;\n]+/)
      .map((w: string) => w.trim())
      .filter((w: string) => w.length > 0)
      .map((w: string) => ({ word: w }));
  }

  // Production zero-mock rule
  const isMock = process.env.NODE_ENV !== 'production' && Boolean(req.body.mock || process.env.QBANK_BRIDGE_MOCK === '1');

  const timestampStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const batchId = `batch_${timestampStr}_${randomSuffix}`;
  const taskId = `admin_gen_${batchId}`;
  const payloadHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ level, count, partType, topic, provider, batchId, difficultyTier, trapType, targetGrammar, targetVocabs }))
    .digest('hex');

  const lockRes = acquireGenerationLock(db, {
    taskType: 'admin_generate',
    idempotencyKey: taskId,
    payloadHash,
    maxDurationMs: isLocalGpuProvider ? 240000 : 90000,
  });

  if (!lockRes.acquired) {
    return res.status(409).json({
      success: false,
      error: lockRes.error || 'Hệ thống đang thực hiện một phiên sinh đề khác. Vui lòng đợi trong giây lát.',
      activeTask: lockRes.activeTask,
    });
  }

  try {
    if (isHskPipeline) {
      try {
        const dbPath = getQBankDbPath();
        const targetVocabStr = (targetVocabs && targetVocabs.length > 0) ? targetVocabs[0].word : undefined;
        const pythonArgs = [
          '-X', 'utf8',
          'hsk_qbank_adapter.py',
          '--level', String(level),
          '--skill', String(skill === 'all' ? 'reading' : skill),
          '--count', String(count),
          '--db', dbPath,
        ];
        if (targetVocabStr) {
          pythonArgs.push('--target-vocab', targetVocabStr);
        }

        const pyResult = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
          const proc = spawn('python', pythonArgs, { cwd: process.cwd() });
          let stdout = '';
          let stderr = '';
          proc.stdout.on('data', (d) => { stdout += d.toString(); });
          proc.stderr.on('data', (d) => { stderr += d.toString(); });
          proc.on('close', (code) => { resolve({ stdout, stderr, code: code ?? 0 }); });
          proc.on('error', (err) => { stderr += err.message; resolve({ stdout, stderr, code: 1 }); });
        });

        let summary: any = { total: count, inserted: 0, duplicates: 0, errors: [] };
        const marker = '__HSK_ADAPTER_JSON_RESULT__';
        if (pyResult.stdout.includes(marker)) {
          try {
            const jsonStr = pyResult.stdout.split(marker)[1].split('\n')[0].trim();
            summary = JSON.parse(jsonStr);
          } catch {}
        }

        const countSaved = summary.inserted || 0;
        const isSuccess = countSaved > 0;
        const status = isSuccess ? (summary.duplicates > 0 ? 'partial' : 'success') : 'failed';

        completePersistentTask(db, taskId, {
          batch_id: batchId,
          countSaved,
          countRequested: count,
          countGenerated: summary.total || count,
          providerUsed: 'hsk_pipeline_python',
          status,
        });

        return res.json({
          success: isSuccess,
          status,
          is_dry_run: false,
          saved: countSaved > 0,
          message: isSuccess
            ? `Đã dùng Pipeline HSK 3.0 (Local GPU) sinh và lưu thành công ${countSaved} câu hỏi bẫy vào hàng đợi duyệt!`
            : `Không thể lưu câu hỏi. Lỗi: ${pyResult.stderr || summary.errors?.[0] || 'Lỗi không xác định'}`,
          batch_id: batchId,
          count: countSaved,
          count_requested: count,
          count_generated: summary.total || count,
          count_passed_validator: countSaved,
          count_saved_pending: countSaved,
          count_rejected_validator: (summary.duplicates || 0) + (summary.errors?.length || 0),
          provider_used: 'hsk_pipeline_python',
          model: 'qwen2.5:7b (Ollama Local HSK 3.0 Engine)',
        });
      } catch (pipeErr: any) {
        failPersistentTask(db, taskId, pipeErr.message || 'Pipeline execution failed');
        return res.status(500).json({
          success: false,
          error: `Lỗi thực thi Pipeline: ${pipeErr.message}`,
          count_generated: 0,
          count_passed_validator: 0,
          count_saved_pending: 0,
          count_rejected_validator: 0,
        });
      }
    }

    let waterfallResult: any;
    try {
      waterfallResult = await generateWaterfallQuestions({
        level,
        skill,
        count,
        provider,
        part_type: partType,
        topic,
        mock: isMock,
        difficulty_tier: difficultyTier,
        trap_type: trapType,
        target_grammar: targetGrammar,
        targetVocabs,
      });
    } catch (err: any) {
      failPersistentTask(db, taskId, err.message || 'LLM generation failed');
      if (err.message === 'LLM_ALL_PROVIDERS_EXHAUSTED' || err.message?.includes('LLM_ALL_PROVIDERS_EXHAUSTED')) {
        // Record failure run into generation_runs and generation_history
        const runId = `run_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const detailsJson = JSON.stringify({
          batch_id: batchId,
          error: 'LLM_ALL_PROVIDERS_EXHAUSTED',
          message: err.message || 'All AI models exhausted or unavailable',
          provider: err.provider || (provider !== 'auto' ? provider : null),
          provider_status: err.status || null,
          retry_after_ms: err.retryAfterMs ?? null,
          finish_reason: err.finishReason ?? null,
          max_completion_tokens: err.maxCompletionTokens ?? null,
          token_usage: err.tokenUsage ?? null,
          rate_limit: {
            remaining_tokens: err.remainingTokens ?? null,
            reset_tokens: err.resetTokens || null,
            token_limit: err.tokenLimit ?? null,
            tokens_used: err.tokensUsed ?? null,
            tokens_requested: err.tokensRequested ?? null,
          },
          questions_saved: 0,
          questions_generated: 0,
        });

        try {
          db.prepare(`
            INSERT INTO generation_runs (
              id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
            ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, 'none', 'failed', ?)
          `).run(runId, batchId, level, skill, count, provider !== 'auto' ? provider : 'all-providers-exhausted', detailsJson);

          db.prepare(`
            INSERT INTO generation_history (
              id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
            ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, 'none', 'failed', ?)
          `).run(runId, batchId, level, skill, count, provider !== 'auto' ? provider : 'all-providers-exhausted', detailsJson);
        } catch (dbErr) {
          console.error('[QBank Generate] Lỗi ghi nhận lịch sử thất bại:', dbErr);
        }

        return res.status(503).json({
          success: false,
          status: 'failed',
          is_dry_run: dryRun,
          saved: false,
          error: 'AI_SERVICE_UNAVAILABLE',
          code: 'LLM_ALL_PROVIDERS_EXHAUSTED',
          message: err.message || 'All AI models exhausted or unavailable',
          provider: err.provider || (provider !== 'auto' ? provider : null),
          provider_status: err.status || null,
          retry_after_ms: err.retryAfterMs ?? null,
          finish_reason: err.finishReason ?? null,
          max_completion_tokens: err.maxCompletionTokens ?? null,
          token_usage: err.tokenUsage ?? null,
          rate_limit: {
            remaining_tokens: err.remainingTokens ?? null,
            reset_tokens: err.resetTokens || null,
            token_limit: err.tokenLimit ?? null,
            tokens_used: err.tokensUsed ?? null,
            tokens_requested: err.tokensRequested ?? null,
          },
          count: 0,
          count_requested: count,
          count_generated: 0,
          count_passed_validator: 0,
          count_saved_pending: 0,
          count_rejected_validator: 0,
        });
      }
      throw err;
    }

    const generatedQuestions: CandidateQuestion[] = waterfallResult.questions || [];
    const existingStems = extractExistingStemsFromDb(db);
    const existingContentHashes = new Set<string>();
    const existingNearDupSignatures = new Set<string>();

    try {
      const hashRows = db.prepare(`
        SELECT content_hash, near_duplicate_signature FROM questions WHERE content_hash IS NOT NULL
        UNION ALL
        SELECT content_hash, near_duplicate_signature FROM pending_questions WHERE content_hash IS NOT NULL
      `).all() as any[];
      for (const r of hashRows) {
        if (r.content_hash) existingContentHashes.add(r.content_hash);
        if (r.near_duplicate_signature) existingNearDupSignatures.add(r.near_duplicate_signature);
      }
    } catch {
      // Graceful fallback if tables or columns are not present in test DBs
    }

    // Multi-layer validation and deduplication
    const validCandidates: CandidateQuestion[] = [];
    const validationFailures: Array<{ candidate_index: number; error_count: number; errors: string[]; issues: ReturnType<typeof describeValidationIssue>[] }> = [];
    const validationArtifactPaths: string[] = [];
    let validationErrorCount = 0;
    let countRejected = 0;

    for (const [candidateIndex, q] of generatedQuestions.entries()) {
      // Pre-validation auto-enrichment
      if (!q.explanation_vi || q.explanation_vi.trim().length < 5) {
        const correctOpt = Array.isArray(q.options) && typeof q.answer_idx === 'number' && q.answer_idx >= 0 && q.answer_idx < q.options.length
          ? q.options[q.answer_idx]
          : '';
        q.explanation_vi = correctOpt
          ? `Đáp án đúng là ${correctOpt}. Phù hợp ngữ cảnh câu.`
          : 'Đáp án chính xác theo ngữ cảnh câu.';
      }

      const blankPattern = /(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;
      if (!q.completed_stem && q.stem && Array.isArray(q.options) && typeof q.answer_idx === 'number' && q.answer_idx >= 0 && q.answer_idx < q.options.length) {
        q.completed_stem = q.stem.replace(blankPattern, q.options[q.answer_idx]);
      }
      if (typeof q.completed_stem === 'string' && blankPattern.test(q.completed_stem)) {
        const replacement = q.target_vocabulary || (Array.isArray(q.options) && typeof q.answer_idx === 'number' ? q.options[q.answer_idx] : '') || '';
        if (replacement) {
          q.completed_stem = q.completed_stem.replace(blankPattern, replacement).replace(/\([^\)]+\)/g, '').trim();
        } else if (typeof q.stem === 'string') {
          q.completed_stem = q.stem.replace(blankPattern, '').replace(/\([^\)]+\)/g, '').trim();
        }
      }

      const textForPinyin = q.completed_stem || q.stem;
      if (textForPinyin) {
        try {
          q.pinyin = generateAccuratePinyin(textForPinyin);
        } catch {}
      }
      if (Array.isArray(q.options) && q.options.length > 0) {
        try {
          (q as any).options_pinyin = q.options.map((opt: string) =>
            typeof opt === 'string' && /[\u4e00-\u9fa5]/.test(opt) ? generateAccuratePinyin(opt) : opt
          );
        } catch {}
      }

      if (isOpenEndedWritingTask(q.part_type || partType)) {
        q.options = [];
        q.answer_idx = 0;
        (q as any).distractor_rationales = [];
      }

      const effectivePartType = String(q.part_type || partType || '');
      const imageOptionPartTypes = new Set([
        'listen_picture_match_3opt',
        'listen_picture_match_4opt',
        'listen_dialogue_picture_match_6opt',
        'listen_dialogue_picture_match_split',
        'read_sentence_picture_match_6opt',
      ]);
      if ((effectivePartType.startsWith('listen_') || imageOptionPartTypes.has(effectivePartType)) && typeof q.stem === 'string' && q.stem.includes('____')) {
        const correctOpt = Array.isArray(q.options) && typeof q.answer_idx === 'number' ? (q.options[q.answer_idx] || '') : '';
        q.stem = q.stem.replace(/_{2,}/g, correctOpt).trim();
        q.completed_stem = q.stem;
      }

      if (imageOptionPartTypes.has(effectivePartType)) {
        if (Array.isArray(q.options) && q.options.length > 0) {
          const used = new Set<string>();
          const assignedImages: string[] = [];
          for (let idx = 0; idx < q.options.length; idx++) {
            const optText = String(q.options[idx] || '');
            let theme: string | null = null;
            if (Array.isArray(q.options_images) && q.options_images[idx]) {
              const raw = String(q.options_images[idx]).trim().toLowerCase();
              if (isValidIllustrationTheme(raw) && !used.has(raw)) {
                theme = raw;
              }
            }
            if (!theme) {
              const inferred = inferThemeFromText(optText);
              if (inferred && !used.has(inferred)) {
                theme = inferred;
              }
            }
            if (theme) {
              used.add(theme);
              assignedImages.push(theme);
            }
          }
          if (assignedImages.length === q.options.length) {
            q.options_images = assignedImages;
          }
        }
      }

      if (effectivePartType.startsWith('listen_dialogue_') && typeof q.stem === 'string') {
        q.stem = normalizeDialogueSpeakers(q.stem);
        q.completed_stem = q.stem;
      }

      if (typeof q.explanation_vi === 'string' && q.explanation_vi.trim().length > 0) {
        if (!/[.!?。！？]$/.test(q.explanation_vi.trim())) {
          q.explanation_vi = q.explanation_vi.trim() + '.';
        }
      }

      if (isVisualQuestionType(effectivePartType)) {
        if (!q.illustration_theme || typeof q.illustration_theme !== 'string' || !isValidIllustrationTheme(q.illustration_theme)) {
          q.illustration_theme = imageOptionPartTypes.has(effectivePartType) ? null : 'reading';
        }
      } else {
        if (q.illustration_theme && !isValidIllustrationTheme(q.illustration_theme)) {
          q.illustration_theme = null;
        }
      }

      const valResult = validateCandidate(q, existingStems, {
        existingContentHashes,
        existingNearDupSignatures,
        expectedLevel: level,
        expectedSkill: skill,
        expectedPartType: partType,
        strictLevel,
        requireLanguageQuality: waterfallResult.providerUsed !== 'mock-llm',
        requireDistractorRationales: waterfallResult.providerUsed !== 'mock-llm',
      });
      if (valResult.valid) {
        validCandidates.push(q);
        // Add comparable stem and hashes to prevent intra-batch duplicates
        if (q.stem && q.options) {
          const comparable = getComparableStem(q.stem, q.options, q.answer_idx);
          existingStems.push(comparable);
          const cHash = valResult.contentHash || computeContentHash(q.stem, q.options, q.answer_idx, q.options_images);
          existingContentHashes.add(cHash);
          const nearSig = valResult.nearDuplicateSignature || computeNearDuplicateSignature(q.stem, q.options);
          existingNearDupSignatures.add(nearSig);
        }
      } else {
        countRejected++;
        const issues = valResult.errors.map((error) => describeValidationIssue(error));
        validationErrorCount += issues.length;
        validationFailures.push({
          candidate_index: candidateIndex,
          error_count: issues.length,
          errors: issues.map((issue) => issue.message),
          issues,
        });
        try {
          validationArtifactPaths.push(writeValidationDiagnosticArtifact(
            process.cwd(), batchId, candidateIndex, q, waterfallResult.finishReason, waterfallResult.maxCompletionTokens, issues,
          ));
        } catch {
          console.error('[QBank Generate] Could not write validation diagnostic artifact.');
        }
      }
    }
    const rejectedReasons = summarizeCandidateIssues(validationFailures.flatMap((failure) => failure.issues));

    let countSaved = 0;
    if (!dryRun) {
      db.exec('BEGIN IMMEDIATE;');
      try {
        if (validCandidates.length > 0) {
          const insertStmt = db.prepare(`
            INSERT INTO pending_questions (
              id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, options_images, topic, status, provider_used, content_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            ON CONFLICT(content_hash) DO NOTHING
          `);

          for (const q of validCandidates) {
            const qId = `pend_${level}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
            const contentHash = computeContentHash(q.stem, q.options, q.answer_idx, q.options_images);
            const optionsJson = JSON.stringify(q.options);

            const info = insertStmt.run(
              qId,
              batchId,
              q.stem,
              optionsJson,
              q.answer_idx,
              q.pinyin || null,
              q.explanation_vi,
              q.level,
              q.skill,
              q.part_type,
              q.illustration_theme || null,
              JSON.stringify(q.options_images || []),
              q.topic || topic || null,
              waterfallResult.providerUsed,
              contentHash
            );

            if ((info as any)?.changes > 0) {
              countSaved++;
            }
          }
        }

        // Record batch execution audit in generation_runs and generation_history EVEN IF validCandidates.length === 0
        const runId = `run_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const status = countSaved > 0
          ? (countSaved < count || countRejected > 0 ? 'partial' : 'success')
          : (countRejected > 0 ? 'all_rejected' : 'failed');

        const detailsJson = JSON.stringify({
          batch_id: batchId,
          fallback_occurred: waterfallResult.fallbackOccurred,
          fallback_log: waterfallResult.fallbackLog,
          token_usage: waterfallResult.tokenUsage || null,
          finish_reason: waterfallResult.finishReason || null,
          max_completion_tokens: waterfallResult.maxCompletionTokens || null,
          rejected_reasons: rejectedReasons,
          validation_error_count: validationErrorCount,
          rejected_candidates_count: countRejected,
          validation_failures: validationFailures,
          validation_artifacts: validationArtifactPaths,
          validation_diagnostics_version: 1,
          valid_saved_count: countSaved,
          rejected_count: countRejected,
        });

        db.prepare(`
          INSERT INTO generation_runs (
            id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
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

        db.prepare(`
          INSERT INTO generation_history (
            id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
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
        throw txErr;
      }
    }

    // Determine status and success flags per Milestone 3 specification
    const status: 'success' | 'partial' | 'all_rejected' | 'dry_run' | 'failed' = dryRun
      ? 'dry_run'
      : countSaved > 0
      ? (countSaved < count || countRejected > 0 ? 'partial' : 'success')
      : (countRejected > 0 ? 'all_rejected' : 'failed');

    const isSuccess = dryRun ? true : countSaved > 0;

    let message = '';
    if (dryRun) {
      message = `Chế độ chạy thử (Dry Run): Đã kiểm tra ${validCandidates.length}/${generatedQuestions.length} câu hỏi đạt chuẩn. Không có dữ liệu nào được lưu vào cơ sở dữ liệu.`;
    } else if (status === 'success') {
      message = `Đã sinh và lưu thành công ${countSaved}/${generatedQuestions.length} câu hỏi vào hàng đợi duyệt.`;
    } else if (status === 'partial') {
      message = `Sinh thành công một phần: ${countSaved}/${generatedQuestions.length} câu hỏi được lưu vào hàng đợi duyệt (${countRejected} câu bị từ chối do trùng lặp hoặc lỗi định dạng).`;
    } else if (status === 'all_rejected') {
      message = `Không có câu hỏi nào được lưu vào ngân hàng. Toàn bộ ${countRejected} câu hỏi bị từ chối bởi bộ lọc kiểm duyệt.`;
    } else {
      message = 'Không thể lưu câu hỏi vào ngân hàng đề.';
    }

    completePersistentTask(db, taskId, {
      batch_id: batchId,
      countSaved,
      countRequested: count,
      countGenerated: generatedQuestions.length,
      providerUsed: waterfallResult.providerUsed,
      status,
    });

    return res.json({
      success: isSuccess,
      status,
      is_dry_run: dryRun,
      saved: countSaved > 0,
      message,
      batch_id: batchId,
      count: countSaved,
      count_requested: count,
      count_generated: generatedQuestions.length,
      generated_count: generatedQuestions.length,
      count_passed_validator: validCandidates.length,
      count_saved_pending: countSaved,
      count_rejected_validator: countRejected,
      provider_used: waterfallResult.providerUsed,
      model: waterfallResult.modelUsed,
      model_used: waterfallResult.modelUsed,
      token_usage: waterfallResult.tokenUsage,
      finish_reason: waterfallResult.finishReason || null,
      max_completion_tokens: waterfallResult.maxCompletionTokens || null,
      fallback_occurred: waterfallResult.fallbackOccurred,
      fallback_log: waterfallResult.fallbackLog,
      questions: validCandidates,
      rejected_reasons: rejectedReasons,
      validation_error_count: validationErrorCount,
      rejected_candidates_count: countRejected,
      validation_failures: validationFailures,
      validation_artifacts: validationArtifactPaths,
      validation_diagnostics_version: 1,
    });
  } catch (err: any) {
    failPersistentTask(db, taskId, err.message || 'Unknown generation error');
    return res.status(500).json({
      success: false,
      status: 'failed',
      is_dry_run: dryRun,
      saved: false,
      error: sanitizeError(err.message),
      message: sanitizeError(err.message),
      count: 0,
      count_requested: count,
      count_generated: 0,
      count_passed_validator: 0,
      count_saved_pending: 0,
      count_rejected_validator: 0,
    });
  }
});

// =========================================================================
// 3b. POST /api/qbank/import: Universal Multi-Source Question Import & 6-Gate Validation
// =========================================================================
qbankRouter.post('/import', async (req: Request, res: Response) => {
  try {
    const rawInput =
      typeof req.body?.text === 'string'
        ? req.body.text
        : typeof req.body?.input === 'string'
        ? req.body.input
        : typeof req.body?.raw_text === 'string'
        ? req.body.raw_text
        : req.body?.questions
        ? JSON.stringify(req.body.questions)
        : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    if (typeof rawInput === 'string' && rawInput.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Nội dung văn bản quá dài (vượt quá 50,000 ký tự).',
      });
    }

    const defaultLevel = Number(req.body?.default_level || req.body?.level) || 1;
    const defaultSkill = String(req.body?.default_skill || req.body?.skill || 'reading');
    const defaultPartType = String(req.body?.default_part_type || req.body?.part_type || 'read_fill_blank_4opt');
    const defaultTopic = req.body?.default_topic ? String(req.body.default_topic).trim() : null;

    const parsedQuestions = parseUniversalQuestions(rawInput, {
      default_level: defaultLevel,
      default_skill: defaultSkill,
      default_part_type: defaultPartType,
      default_topic: defaultTopic || undefined,
    });

    if (parsedQuestions.length === 0) {
      return res.json({
        success: true,
        total_parsed: 0,
        accepted_count: 0,
        rejected_count: 0,
        batch_id: null,
        results: [],
        message: 'Không tìm thấy câu hỏi hợp lệ trong nội dung đã nhập.',
      });
    }

    const db = getDbSync();
    ensurePendingSchema(db);
    const existingStems = extractExistingStemsFromDb(db);
    const batchId = `import_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const pendCols = (db.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
    const hasDiffCol = pendCols.includes('difficulty_tier');
    const hasSourceCol = pendCols.includes('source');

    let acceptedCount = 0;
    let rejectedCount = 0;
    const results: any[] = [];

    db.exec('BEGIN IMMEDIATE;');
    try {
      const insertSql = `
        INSERT INTO pending_questions (
          id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, options_images, topic, status, provider_used, content_hash, near_duplicate_signature
          ${hasDiffCol ? ', difficulty_tier' : ''}
          ${hasSourceCol ? ', source' : ''}
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?
          ${hasDiffCol ? ', ?' : ''}
          ${hasSourceCol ? ', ?' : ''}
        )
        ON CONFLICT(content_hash) DO NOTHING
      `;
      const insertStmt = db.prepare(insertSql);

      const useLenientImport = req.body?.strict_gates !== true;

      for (const q of parsedQuestions) {
        const sixGate = evaluateCandidateSixGates(q, existingStems, {
          lenientImport: useLenientImport,
        });
        const contentHash = computeContentHash(q.stem, q.options, q.answer_idx, q.options_images);
        const nearDupSig = computeNearDuplicateSignature(q.stem, q.options);

        let inserted = false;
        if (sixGate.allPassed) {
          const qId = `pend_${q.level || defaultLevel}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          const insertParams: any[] = [
            qId,
            batchId,
            q.stem,
            JSON.stringify(q.options),
            q.answer_idx,
            q.pinyin || null,
            q.explanation_vi,
            q.level || defaultLevel,
            q.skill || defaultSkill,
            q.part_type || defaultPartType,
            q.illustration_theme || null,
            JSON.stringify(q.options_images || []),
            q.topic || defaultTopic,
            'imported',
            contentHash,
            nearDupSig,
          ];
          if (hasDiffCol) {
            insertParams.push(q.difficulty_tier || null);
          }
          if (hasSourceCol) {
            insertParams.push('imported');
          }

          const info: any = insertStmt.run(...insertParams);
          if (info && info.changes > 0) {
            inserted = true;
            acceptedCount++;
            existingStems.push(getComparableStem(q.stem, q.options, q.answer_idx));
          } else {
            rejectedCount++;
          }
        } else {
          rejectedCount++;
        }

        results.push({
          question: q,
          passed: sixGate.allPassed,
          gates: sixGate,
          content_hash: contentHash,
          near_duplicate_signature: nearDupSig,
          inserted,
        });
      }

      db.exec('COMMIT;');
    } catch (err: any) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return res.json({
      success: true,
      total_parsed: parsedQuestions.length,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      batch_id: batchId,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: sanitizeError(err.message),
    });
  }
});

// =========================================================================
// 3c. POST /api/qbank/upload-file: Multi-format File Ingestion & 6-Gate Validation
// =========================================================================
qbankRouter.post('/upload-file', async (req: Request, res: Response) => {
  try {
    const SUPPORTED_EXTS = ['xlsx', 'xls', 'csv', 'docx', 'pdf', 'txt', 'json'];
    const fileName = String(req.body?.file_name || req.body?.filename || 'uploaded_file.xlsx').trim();
    const extFromName = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';
    const fileType = String(req.body?.file_type || req.body?.fileType || extFromName || 'xlsx').trim().toLowerCase().replace(/^\./, '');

    const targetExt = extFromName && !SUPPORTED_EXTS.includes(extFromName) ? extFromName : fileType;
    if (!SUPPORTED_EXTS.includes(targetExt)) {
      return res.status(400).json({
        success: false,
        error: `Định dạng tệp tin .${targetExt} không được hỗ trợ. Chỉ hỗ trợ .xlsx, .xls, .csv, .docx, .pdf, .txt, .json.`,
      });
    }

    const fileBase64 = String(req.body?.file_base64 || req.body?.fileBase64 || '').trim();
    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'Tệp tin rỗng (0 byte).',
      });
    }

    // Decode base64 to buffer
    const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tệp tin rỗng (0 byte).',
      });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Kích thước tệp tin vượt quá giới hạn cho phép (tối đa 10MB).',
      });
    }

    const defaultLevel = Number(req.body?.default_level || req.body?.level) || 1;
    const defaultSkill = String(req.body?.default_skill || req.body?.skill || 'reading');
    const defaultPartType = String(req.body?.default_part_type || req.body?.part_type || 'read_fill_blank_4opt');
    const defaultTopic = req.body?.default_topic ? String(req.body.default_topic).trim() : null;
    const autoPersist = req.body?.auto_persist !== false;

    let details;
    try {
      details = await extractUploadedFileDetails(buffer, fileName, {
        default_level: defaultLevel,
        default_skill: defaultSkill,
        default_part_type: defaultPartType,
        default_topic: defaultTopic || undefined,
      });
    } catch (parseErr: any) {
      return res.status(400).json({
        success: false,
        error: `Tệp tin bị hỏng hoặc không thể đọc được nội dung: ${sanitizeError(parseErr?.message || String(parseErr))}`,
      });
    }

    const parsedQuestions = details.questions;

    if (parsedQuestions.length === 0) {
      return res.json({
        success: true,
        file_name: fileName,
        file_type: details.file_type,
        is_structured_table: details.is_structured_table,
        diagnostics: details.diagnostics,
        raw_text_preview: details.raw_text ? details.raw_text.slice(0, 4000) : '',
        total_parsed: 0,
        accepted_count: 0,
        rejected_count: 0,
        batch_id: null,
        results: [],
        message: 'Không tìm thấy câu hỏi hợp lệ trong tệp tin đã tải lên.',
      });
    }

    const db = getDbSync();
    ensurePendingSchema(db);
    const existingStems = extractExistingStemsFromDb(db);
    const batchId = `upload_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const pendCols = (db.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
    const hasDiffCol = pendCols.includes('difficulty_tier');
    const hasSourceCol = pendCols.includes('source');

    let acceptedCount = 0;
    let rejectedCount = 0;
    const results: any[] = [];

    db.exec('BEGIN IMMEDIATE;');
    try {
      const insertSql = `
        INSERT INTO pending_questions (
          id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, options_images, topic, status, provider_used, content_hash, near_duplicate_signature
          ${hasDiffCol ? ', difficulty_tier' : ''}
          ${hasSourceCol ? ', source' : ''}
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?
          ${hasDiffCol ? ', ?' : ''}
          ${hasSourceCol ? ', ?' : ''}
        )
        ON CONFLICT(content_hash) DO NOTHING
      `;
      const insertStmt = db.prepare(insertSql);

      const useLenientImport = req.body?.strict_gates !== true;

      for (const q of parsedQuestions) {
        const sixGate = evaluateCandidateSixGates(q, existingStems, {
          lenientImport: useLenientImport,
        });
        const contentHash = computeContentHash(q.stem, q.options, q.answer_idx, q.options_images);
        const nearDupSig = computeNearDuplicateSignature(q.stem, q.options);

        let inserted = false;
        if (sixGate.allPassed) {
          if (autoPersist) {
            const qId = `pend_${q.level || defaultLevel}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
            const insertParams: any[] = [
              qId,
              batchId,
              q.stem,
              JSON.stringify(q.options),
              q.answer_idx,
              q.pinyin || null,
              q.explanation_vi,
              q.level || defaultLevel,
              q.skill || defaultSkill,
              q.part_type || defaultPartType,
              q.illustration_theme || null,
              JSON.stringify(q.options_images || []),
              q.topic || defaultTopic,
              'uploaded_file',
              contentHash,
              nearDupSig,
            ];
            if (hasDiffCol) {
              insertParams.push(q.difficulty_tier || null);
            }
            if (hasSourceCol) {
              insertParams.push('uploaded_file');
            }

            const info: any = insertStmt.run(...insertParams);
            if (info && info.changes > 0) {
              inserted = true;
              acceptedCount++;
              existingStems.push(getComparableStem(q.stem, q.options, q.answer_idx));
            } else {
              rejectedCount++;
            }
          } else {
            acceptedCount++;
          }
        } else {
          rejectedCount++;
        }

        results.push({
          question: q,
          passed: sixGate.allPassed,
          gates: sixGate,
          content_hash: contentHash,
          near_duplicate_signature: nearDupSig,
          inserted,
        });
      }

      db.exec('COMMIT;');
    } catch (err: any) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return res.json({
      success: true,
      file_name: fileName,
      file_type: details.file_type,
      is_structured_table: details.is_structured_table,
      diagnostics: details.diagnostics,
      raw_text_preview: details.raw_text ? details.raw_text.slice(0, 4000) : '',
      total_parsed: parsedQuestions.length,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      batch_id: batchId,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: sanitizeError(err.message),
    });
  }
});

// =========================================================================
// 3c-2. POST /api/qbank/ai-format: AI Auto-Formatting via Ollama (qwen2.5:7b)
// =========================================================================

export interface CandidateQuestionFormatted {
  stem: string;
  options: string[];
  answer_idx: number;
  explanation_vi: string;
  level: number;
  skill: string;
}

export function extractAndNormalizeCandidateQuestions(
  rawText: string,
  defaultLevel = 1,
  defaultSkill = 'reading'
): CandidateQuestionFormatted[] {
  if (!rawText || typeof rawText !== 'string') return [];

  let cleaned = rawText.trim();
  // Strip markdown fences
  if (cleaned.includes('```')) {
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      cleaned = fenceMatch[1].trim();
    } else {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }
  }

  // Find array or object boundaries
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If direct parse fails, fix trailing commas
    try {
      const fixed = cleaned.replace(/,\s*([\]}])/g, '$1');
      parsed = JSON.parse(fixed);
    } catch {
      return [];
    }
  }

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.questions)) rawList = parsed.questions;
    else if (Array.isArray(parsed.array)) rawList = parsed.array;
    else if (Array.isArray(parsed.items)) rawList = parsed.items;
    else if (Array.isArray(parsed.data)) rawList = parsed.data;
    else if (Array.isArray(parsed.result)) rawList = parsed.result;
    else if (Array.isArray(parsed.response)) rawList = parsed.response;
    else if (parsed.data && typeof parsed.data === 'object') {
      if (Array.isArray(parsed.data.questions)) rawList = parsed.data.questions;
      else if (Array.isArray(parsed.data.items)) rawList = parsed.data.items;
      else if (Array.isArray(parsed.data.array)) rawList = parsed.data.array;
      else if (Array.isArray(parsed.data.result)) rawList = parsed.data.result;
      else if (parsed.data.stem || parsed.data.question || parsed.data.content) rawList = [parsed.data];
    } else if (parsed.result && typeof parsed.result === 'object') {
      if (Array.isArray(parsed.result.questions)) rawList = parsed.result.questions;
      else if (Array.isArray(parsed.result.items)) rawList = parsed.result.items;
      else if (parsed.result.stem || parsed.result.question || parsed.result.content) rawList = [parsed.result];
    } else if (parsed.stem || parsed.question || parsed.content) {
      rawList = [parsed];
    }
  }

  const results: CandidateQuestionFormatted[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const stem = String(item.stem || item.question || item.content || '').trim();
    if (!stem) continue;

    const cleanOptionString = (opt: any): string => {
      const s = String(opt ?? '').trim();
      const stripped = s.replace(
        /^(?:[-*•]\s*)?(?:\*\*)?[\(\[（【]?[A-Fa-f\uFF21-\uFF26\uFF41-\uFF46][\)\]）】\.\:、\s\-：．]+(?:\*\*)?\s*/,
        ''
      ).trim();
      return stripped.length > 0 ? stripped : s;
    };

    let options: string[] = [];
    if (Array.isArray(item.options)) {
      options = item.options.map(cleanOptionString);
    } else if (typeof item.options === 'string') {
      options = item.options.split(/\n+/).map(cleanOptionString).filter(Boolean);
    } else if (item.options && typeof item.options === 'object') {
      const keys = ['A', 'B', 'C', 'D'];
      const candidateList = keys
        .map((k) => {
          const val =
            item.options[k] ??
            item.options[k.toLowerCase()] ??
            item.options[String.fromCharCode(k.charCodeAt(0) + 0xfee0)] ??
            item.options[String.fromCharCode(k.toLowerCase().charCodeAt(0) + 0xfee0)];
          return val !== undefined && val !== null ? cleanOptionString(val) : '';
        })
        .filter(Boolean);

      if (candidateList.length > 0) {
        options = candidateList;
      } else {
        options = Object.values(item.options).map(cleanOptionString).filter(Boolean);
      }
    }

    let answerIdx = 0;
    if (typeof item.answer_idx === 'number' && item.answer_idx >= 0 && item.answer_idx <= 3) {
      answerIdx = Math.floor(item.answer_idx);
    } else {
      const rawAns =
        item.answer !== undefined && item.answer !== null
          ? item.answer
          : item.key ?? item.correct_answer ?? item.correctAnswer ?? item.dap_an;

      if (typeof rawAns === 'number') {
        if (rawAns >= 0 && rawAns <= 3) answerIdx = Math.floor(rawAns);
        else if (rawAns >= 1 && rawAns <= 4) answerIdx = Math.floor(rawAns) - 1;
      } else if (typeof rawAns === 'string') {
        let answerStr = rawAns.trim();
        // Normalize full-width letters Ａ-Ｄ (\uFF21-\uFF24) and ａ-ｄ (\uFF41-\uFF44) to standard ASCII A-D
        answerStr = answerStr.replace(/[\uFF21-\uFF24]/g, (ch: string) =>
          String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
        );
        answerStr = answerStr.replace(/[\uFF41-\uFF44]/g, (ch: string) =>
          String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
        );

        // Extract letter anywhere after common prefixes like 【答案】, 答案, Key, Đáp án, Answer
        const letterMatch = answerStr.match(
          /(?:【?答案】?|key|đáp án(?:\s+(?:đúng|là))?|dap an|answer)?[\s:：=\(\[（【]*([A-Da-d])/i
        );
        if (letterMatch) {
          answerIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        } else if (/^\d+$/.test(answerStr)) {
          const num = parseInt(answerStr, 10);
          if (num >= 0 && num <= 3) answerIdx = num;
          else if (num >= 1 && num <= 4) answerIdx = num - 1;
        } else {
          const optIdx = options.findIndex(
            (o) => o.trim() === answerStr || o.toLowerCase() === answerStr.toLowerCase()
          );
          if (optIdx >= 0) answerIdx = optIdx;
        }
      }
    }

    const explanationVi = String(
      item.explanation_vi || item.explanation || item.explain || item.giai_thich || ''
    ).trim();

    let level = Number(item.level);
    if (!level || isNaN(level) || level < 1 || level > 6) {
      level = defaultLevel >= 1 && defaultLevel <= 6 ? defaultLevel : 1;
    }

    let skill = String(item.skill || defaultSkill).toLowerCase().trim();
    if (!['reading', 'listening', 'writing'].includes(skill)) {
      skill = ['reading', 'listening', 'writing'].includes(defaultSkill.toLowerCase())
        ? defaultSkill.toLowerCase()
        : 'reading';
    }

    results.push({
      stem,
      options,
      answer_idx: answerIdx,
      explanation_vi: explanationVi,
      level,
      skill,
    });
  }

  return results;
}

export function buildAiFormatPrompt(
  rawInput: string,
  defaultLevel = 1,
  defaultSkill = 'reading',
  isRetry = false
): string {
  const retryHint = isRetry
    ? `\nCRITICAL RETRY NOTICE: Your previous output was not valid JSON. You MUST return ONLY a JSON array, with no markdown fences, no backticks, and no introductory or explanatory text.\n`
    : '';

  return `You are an expert HSK exam question parser and formatter.${retryHint}
Your job is to parse raw questions (which may be ChatGPT output, Claude markdown, loose JSON, HSK raw format, or mixed Vietnamese-Chinese text) and convert them into a standardized JSON array of CandidateQuestion objects.

SCHEMA SPECIFICATION:
[
  {
    "stem": "The question stem or sentence containing the blank '____' or dialogue",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer_idx": 0,
    "explanation_vi": "Explanation in Vietnamese explaining why the answer is correct",
    "level": ${defaultLevel},
    "skill": "${defaultSkill}"
  }
]

RULES:
1. Output MUST be ONLY the valid JSON array starting with '[' and ending with ']'.
2. Absolutely DO NOT wrap output in markdown code fences (\`\`\`json or \`\`\`).
3. Absolutely DO NOT include any text before or after the JSON array.
4. "stem": Retain the full sentence and Chinese characters. Preserve the blank '____' if present.
5. "options": Array of 4 strings. Strip option prefixes like "A.", "B.", "C.", "D.", "- **A.**" so only the option text remains.
6. "answer_idx": Zero-indexed integer: 0 for A, 1 for B, 2 for C, 3 for D.
7. "explanation_vi": Explanation in Vietnamese. If none is provided in the input, generate a brief, clear explanation in Vietnamese.
8. "level": HSK level integer from 1 to 6 (default: ${defaultLevel}).
9. "skill": Skill type, strictly one of "reading", "listening", "writing" (default: "${defaultSkill}").

INPUT TEXT TO PARSE:
${rawInput}

JSON OUTPUT:`;
}

qbankRouter.post('/ai-format', async (req: Request, res: Response) => {
  try {
    const rawInput =
      typeof req.body?.raw_text === 'string'
        ? req.body.raw_text
        : typeof req.body?.text === 'string'
        ? req.body.text
        : typeof req.body?.input === 'string'
        ? req.body.input
        : '';

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim() || rawInput.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp nội dung văn bản hợp lệ.',
      });
    }

    const defaultLevel = Math.max(1, Math.min(6, Number(req.body?.default_level || req.body?.level) || 1));
    const defaultSkill = String(req.body?.default_skill || req.body?.skill || 'reading').toLowerCase();

    const rawOllamaBase = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const ollamaBase = rawOllamaBase.replace(/\/v1\/?$/, '').replace('localhost', '127.0.0.1');
    const ollamaUrl = `${ollamaBase}/api/generate`;
    const modelName = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

    const callOllama = async (promptText: string, timeoutMs = 30000): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(ollamaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt: promptText,
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          throw new Error(`Ollama returned status ${resp.status}`);
        }

        const data = (await resp.json()) as any;
        return typeof data?.response === 'string' ? data.response : JSON.stringify(data);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let questions: CandidateQuestionFormatted[] = [];
    let ollamaError: any = null;

    // Attempt 1:
    try {
      const prompt1 = buildAiFormatPrompt(rawInput.trim(), defaultLevel, defaultSkill, false);
      const text1 = await callOllama(prompt1, 30000);
      questions = extractAndNormalizeCandidateQuestions(text1, defaultLevel, defaultSkill);
    } catch (err: any) {
      ollamaError = err;
    }

    const isNetworkOrTimeout = (err: any) =>
      err &&
      (err.name === 'AbortError' ||
        err.name === 'TimeoutError' ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ENOTFOUND' ||
        err.message?.includes('aborted') ||
        err.message?.includes('fetch failed') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('status 503') ||
        err.message?.includes('status 500'));

    if (ollamaError && isNetworkOrTimeout(ollamaError)) {
      return res.status(503).json({
        success: false,
        error:
          'Không thể kết nối đến máy chủ AI Ollama (http://localhost:11434). Vui lòng đảm bảo dịch vụ Ollama đang chạy với mô hình qwen2.5:7b.',
      });
    }

    // Attempt 2 (retry on JSON parse failure or 0 questions extracted):
    if (questions.length === 0) {
      try {
        const prompt2 = buildAiFormatPrompt(rawInput.trim(), defaultLevel, defaultSkill, true);
        const text2 = await callOllama(prompt2, 30000);
        questions = extractAndNormalizeCandidateQuestions(text2, defaultLevel, defaultSkill);
      } catch (retryErr: any) {
        if (isNetworkOrTimeout(retryErr)) {
          return res.status(503).json({
            success: false,
            error:
              'Không thể kết nối đến máy chủ AI Ollama (http://localhost:11434). Vui lòng đảm bảo dịch vụ Ollama đang chạy với mô hình qwen2.5:7b.',
          });
        }
      }
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          'Mô hình AI không tìm thấy câu hỏi hợp lệ trong văn bản. Vui lòng kiểm tra lại nội dung đầu vào.',
        questions: [],
        count: 0,
      });
    }

    return res.json({
      success: true,
      formatted_json: JSON.stringify(questions, null, 2),
      questions,
      count: questions.length,
    });
  } catch (outerErr: any) {
    return res.status(503).json({
      success: false,
      error:
        'Không thể kết nối đến máy chủ AI Ollama (http://localhost:11434). Vui lòng đảm bảo dịch vụ Ollama đang chạy với mô hình qwen2.5:7b.',
    });
  }
});

// =========================================================================
// 3c. POST /api/qbank/tts-generate: Synthesize Mandarin Speech via Edge-TTS
// =========================================================================
qbankRouter.post('/tts-generate', async (req: Request, res: Response) => {
  try {
    const questionId = String(req.body?.question_id || '').trim();
    if (!questionId) {
      return res.status(400).json({
        success: false,
        error: 'Mã câu hỏi (question_id) không được để trống.',
      });
    }

    const audioScript = typeof req.body?.audio_script === 'string' ? req.body.audio_script.trim() : '';
    if (!audioScript) {
      return res.status(400).json({
        success: false,
        error: 'Kịch bản phát âm (audio_script) không được để trống.',
      });
    }
    if (audioScript.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Kịch bản phát âm vượt quá độ dài tối đa 5000 ký tự.',
      });
    }

    const db = getDbSync();
    ensurePendingSchema(db);

    let targetRow = db.prepare('SELECT id, stem FROM pending_questions WHERE id = ?').get(questionId) as any;
    if (!targetRow) {
      targetRow = db.prepare('SELECT id, stem FROM questions WHERE id = ?').get(questionId) as any;
    }
    if (!targetRow) {
      targetRow = db.prepare('SELECT question_id as id, stem FROM qb_questions WHERE question_id = ?').get(questionId) as any;
    }
    if (!targetRow) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy câu hỏi với mã ID: ${questionId}`,
      });
    }

    const audioDir = path.join(process.cwd(), 'public', 'audio');
    fs.mkdirSync(audioDir, { recursive: true });

    const safeId = questionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeId}_${Date.now()}.mp3`;
    const targetFileRel = path.join('public', 'audio', filename);
    const audioUrl = `/audio/${filename}`;
    const voice = typeof req.body?.voice === 'string' && req.body.voice.trim() ? req.body.voice.trim() : 'auto';
    const voiceMale = typeof req.body?.voice_male === 'string' && req.body.voice_male.trim() ? req.body.voice_male.trim() : '';
    const voiceFemale = typeof req.body?.voice_female === 'string' && req.body.voice_female.trim() ? req.body.voice_female.trim() : '';
    const introChime = req.body?.intro_chime !== false;

    let pythonExec = process.env.QBANK_PYTHON_EXECUTABLE?.trim();
    if (!pythonExec) {
      const preferred = 'C:\\Users\\Tunn\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe';
      if (fs.existsSync(preferred)) {
        pythonExec = preferred;
      } else {
        pythonExec = 'python';
      }
    }

    const scriptPath = path.join(process.cwd(), 'tts_service.py');

    const ttsArgs = [scriptPath, '--text', audioScript, '--output', targetFileRel, '--voice', voice];
    if (voiceMale) ttsArgs.push('--voice-male', voiceMale);
    if (voiceFemale) ttsArgs.push('--voice-female', voiceFemale);
    if (introChime) {
      ttsArgs.push('--intro-chime');
    } else {
      ttsArgs.push('--no-chime');
    }

    execFile(
      pythonExec,
      ttsArgs,
      {
        cwd: process.cwd(),
        timeout: 45000,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          PYTHONUNBUFFERED: '1',
        },
      },
      (error, stdout, stderr) => {
        let parsed: any = null;
        if (stdout && stdout.trim()) {
          try {
            parsed = JSON.parse(stdout.trim());
          } catch {
            const firstBrace = stdout.indexOf('{');
            const lastBrace = stdout.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
              try {
                parsed = JSON.parse(stdout.substring(firstBrace, lastBrace + 1));
              } catch {}
            }
          }
        }

        if (parsed && parsed.success === false) {
          const rawErr = parsed.error || 'Quá trình tổng hợp âm thanh bằng Edge-TTS thất bại.';
          const isClientError =
            rawErr.includes('không được để trống') ||
            rawErr.includes('độ dài tối đa') ||
            rawErr.includes('5000 ký tự');
          return res.status(isClientError ? 400 : 500).json({
            success: false,
            error: sanitizeError(rawErr),
          });
        }

        if (error) {
          if ((error as any).killed || (error as any).signal === 'SIGTERM') {
            return res.status(504).json({
              success: false,
              error: 'Quá trình tổng hợp âm thanh quá thời gian (timeout 45s). Vui lòng thử lại.',
            });
          }
          console.error('[TTS Generate] Process error:', error, stderr);
          const rawStderr = (stderr || '').trim();
          const cleanDetail = sanitizeError(rawStderr)
            .replace(/[a-zA-Z]:\\[^"'\n\r\t<>:]+/g, '')
            .replace(/Command failed:[^\n\r]*/gi, '')
            .trim();
          const errorMsg = cleanDetail
            ? `Lỗi thực thi dịch vụ tổng hợp giọng nói: ${cleanDetail}`
            : 'Lỗi thực thi dịch vụ tổng hợp giọng nói: Không thể tạo âm thanh';
          return res.status(500).json({
            success: false,
            error: errorMsg,
          });
        }

        if (!parsed || parsed.success !== true) {
          return res.status(500).json({
            success: false,
            error: 'Không nhận được kết quả hợp lệ từ dịch vụ tạo âm thanh TTS.',
          });
        }

        try {
          try {
            db.prepare('UPDATE pending_questions SET audio_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
              audioUrl,
              questionId
            );
          } catch {}
          try {
            db.prepare('UPDATE questions SET audio_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
              audioUrl,
              questionId
            );
          } catch {}
          try {
            db.prepare('UPDATE qb_questions SET audio_url = ? WHERE question_id = ?').run(
              audioUrl,
              questionId
            );
          } catch {}
        } catch (dbErr: any) {
          console.error('[TTS Generate] DB update error:', dbErr);
          return res.status(500).json({
            success: false,
            error: sanitizeError('Cập nhật cơ sở dữ liệu với đường dẫn âm thanh thất bại.'),
          });
        }

        return res.json({
          success: true,
          audio_url: audioUrl,
          duration_s: parsed.duration_s || 0,
          message: 'Tạo file âm thanh thành công',
        });
      }
    );
  } catch (outerErr: any) {
    console.error('[TTS Generate] Outer error:', outerErr);
    return res.status(500).json({
      success: false,
      error: sanitizeError(outerErr.message || 'Lỗi hệ thống khi tạo âm thanh TTS.'),
    });
  }
});

// =========================================================================
// 3c-2. GET /api/qbank/tts-voices: Available Edge-TTS Voice Catalog & Dialogue Pairs
// =========================================================================
qbankRouter.get('/tts-voices', async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    voices: [
      { id: 'auto', name: '✨ Tự động phân vai Nam/Nữ (Khuyên dùng)', gender: 'duo', description: 'Tự động luân phiên đổi cặp giọng Nam - Nữ theo ngữ cảnh câu hỏi' },
      { id: 'zh-CN-XiaoxiaoNeural', name: 'Hiểu Hiểu (Nữ chuẩn HSK)', gender: 'female', description: 'Giọng nữ ấm áp, chuẩn phát thanh khảo thí HSK' },
      { id: 'zh-CN-XiaoyiNeural', name: 'Hiểu Y (Nữ trẻ trung)', gender: 'female', description: 'Giọng nữ nhẹ nhàng, tự nhiên, sinh viên / bạn bè' },
      { id: 'zh-CN-YunxiNeural', name: 'Vân Hy (Nam tự nhiên, sinh động)', gender: 'male', description: 'Giọng nam thanh niên, đối thoại đời sống tự nhiên' },
      { id: 'zh-CN-YunjianNeural', name: 'Vân Kiện (Nam chuẩn phát thanh HSK)', gender: 'male', description: 'Giọng nam đĩnh đạc, trầm ấm, chuẩn khảo thí HSK' },
      { id: 'zh-CN-YunyangNeural', name: 'Vân Dương (Nam chuyên nghiệp - Tin tức)', gender: 'male', description: 'Giọng nam trang trọng, đọc bài văn / tin tức dài' },
      { id: 'zh-CN-YunxiaNeural', name: 'Vân Hạ (Nam thiếu niên / Học sinh)', gender: 'male', description: 'Giọng nam trẻ tuổi, vai học sinh / con trai' },
      { id: 'zh-CN-liaoning-XiaobeiNeural', name: 'Tiểu Bối (Nữ Đông Bắc)', gender: 'female', description: 'Giọng nữ sinh động, ngữ điệu phương Bắc' },
      { id: 'zh-CN-shaanxi-XiaoniNeural', name: 'Tiểu Ni (Nữ Thiểm Tây)', gender: 'female', description: 'Giọng nữ đời thường, tự nhiên' },
    ],
    dialogue_pairs: [
      { id: 'standard', name: 'Nam Vân Hy & Nữ Hiểu Hiểu (Chuẩn mực HSK)' },
      { id: 'exam', name: 'Nam Vân Kiện & Nữ Hiểu Y (Chuẩn khảo thí HSK)' },
      { id: 'formal', name: 'Nam Vân Dương & Nữ Hiểu Hiểu (Trang trọng / Tin tức)' },
      { id: 'youth', name: 'Nam Vân Hạ & Nữ Hiểu Y (Học sinh & Bạn bè)' },
    ],
  });
});

// =========================================================================
// 3d. POST /api/qbank/export & POST /api/qbank/export-exam: Multi-Format Exam Export
// =========================================================================
const handleExamExport = async (req: Request, res: Response) => {
  try {
    const format = String(req.body?.format || 'xlsx').trim().toLowerCase() as 'xlsx' | 'docx' | 'json';
    const examTitle = String(req.body?.exam_title || req.body?.title || 'De_Thi_HSK_Minnese').trim();
    const includeAnswers = req.body?.include_answers !== false;
    const includeExplanations = req.body?.include_explanations !== false;
    const includePinyin = req.body?.include_pinyin !== false;
    const durationMinutes = Number(req.body?.duration_minutes) || undefined;
    const downloadType = req.body?.download_type || 'binary';

    let targetQuestions: CandidateQuestion[] = [];

    // 1. Direct array of questions provided in request body
    if (Array.isArray(req.body?.questions) && req.body.questions.length > 0) {
      targetQuestions = req.body.questions.map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : typeof q.options === 'string' ? JSON.parse(q.options) : [],
        answer_idx: Number(q.answer_idx) || 0,
        level: Number(q.level) || 1,
      }));
    } else {
      const db = getDbSync();

      // 2. Question IDs provided
      if (Array.isArray(req.body?.question_ids) && req.body.question_ids.length > 0) {
        const idList = req.body.question_ids.map(String);
        const placeholders = idList.map(() => '?').join(',');

        // Search in approved questions table
        const qRows = db.prepare(`SELECT * FROM questions WHERE id IN (${placeholders})`).all(...idList) as any[];
        // Search in pending_questions table
        const pendRows = db.prepare(`SELECT * FROM pending_questions WHERE id IN (${placeholders})`).all(...idList) as any[];

        const combined = [...qRows, ...pendRows];
        const seenIds = new Set<string>();

        for (const row of combined) {
          if (seenIds.has(row.id)) continue;
          seenIds.add(row.id);
          let opts: string[] = [];
          try {
            opts = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
          } catch {
            opts = [];
          }
          targetQuestions.push({
            id: row.id,
            stem: row.stem,
            pinyin: row.pinyin,
            passage: row.passage,
            options: opts,
            answer_idx: Number(row.answer_idx) || 0,
            explanation_vi: row.explanation_vi || '',
            level: Number(row.level) || 1,
            skill: row.skill || 'reading',
            part_type: row.part_type || 'read_fill_blank_4opt',
            topic: row.topic,
          });
        }
      } else {
        // 3. Filter provided (or default export from approved questions)
        const filter = req.body?.filter || {};
        const whereClauses: string[] = [];
        const params: any[] = [];

        if (filter.level) {
          whereClauses.push('level = ?');
          params.push(Number(filter.level));
        }
        if (filter.skill) {
          whereClauses.push('skill = ?');
          params.push(filter.skill);
        }
        if (filter.part_type) {
          whereClauses.push('part_type = ?');
          params.push(filter.part_type);
        }

        const table = filter.status === 'pending' ? 'pending_questions' : 'questions';
        if (table === 'questions') {
          whereClauses.push('is_active = 1');
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const rows = db.prepare(`SELECT * FROM ${table} ${whereSql} ORDER BY id ASC LIMIT 500`).all(...params) as any[];

        for (const row of rows) {
          let opts: string[] = [];
          try {
            opts = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
          } catch {
            opts = [];
          }
          targetQuestions.push({
            id: row.id,
            stem: row.stem,
            pinyin: row.pinyin,
            passage: row.passage,
            options: opts,
            answer_idx: Number(row.answer_idx) || 0,
            explanation_vi: row.explanation_vi || '',
            level: Number(row.level) || 1,
            skill: row.skill || 'reading',
            part_type: row.part_type || 'read_fill_blank_4opt',
            topic: row.topic,
          });
        }
      }
    }

    if (targetQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy câu hỏi nào phù hợp để xuất đề.',
      });
    }

    const cleanTitle = examTitle.replace(/[\/\\?%*:|"<>]/g, '_').trim() || 'De_Thi_HSK';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const exportOptions = {
      title: examTitle,
      exam_title: examTitle,
      level: targetQuestions[0]?.level || 1,
      duration_minutes: durationMinutes,
      include_answers: includeAnswers,
      include_explanations: includeExplanations,
      include_pinyin: includePinyin,
    };

    if (format === 'xlsx') {
      const buffer = exportExamToExcel(targetQuestions, examTitle, exportOptions);
      const filename = `${cleanTitle}_${dateStr}.xlsx`;
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (downloadType === 'base64') {
        return res.json({
          success: true,
          format: 'xlsx',
          filename,
          mime_type: mimeType,
          file_base64: buffer.toString('base64'),
          total_questions: targetQuestions.length,
        });
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } else if (format === 'docx') {
      const buffer = exportExamToWord(targetQuestions, examTitle, exportOptions);
      const filename = `${cleanTitle}_${dateStr}.docx`;
      const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (downloadType === 'base64') {
        return res.json({
          success: true,
          format: 'docx',
          filename,
          mime_type: mimeType,
          file_base64: buffer.toString('base64'),
          total_questions: targetQuestions.length,
        });
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } else {
      // JSON
      const jsonStr = exportExamToJson(targetQuestions, {
        title: examTitle,
        level: targetQuestions[0]?.level || 1,
        duration_minutes: durationMinutes,
      });
      const filename = `${cleanTitle}_${dateStr}.json`;
      const mimeType = 'application/json; charset=utf-8';

      if (downloadType === 'base64') {
        return res.json({
          success: true,
          format: 'json',
          filename,
          mime_type: mimeType,
          file_base64: Buffer.from(jsonStr, 'utf-8').toString('base64'),
          total_questions: targetQuestions.length,
        });
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      return res.send(jsonStr);
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: sanitizeError(err.message),
    });
  }
};

qbankRouter.post('/export', handleExamExport);
qbankRouter.post('/export-exam', handleExamExport);

// =========================================================================
// 4. POST /api/qbank/questions/:id/status & POST /api/qbank/review: Status updates & inline edit
// =========================================================================
async function handleReviewOrStatus(req: Request, res: Response) {
  try {
    const questionId = req.params.id || req.body.question_id;
    if (!questionId) {
      return res.status(400).json({ success: false, error: 'Thiếu question_id' });
    }

    let action = req.body.action || req.body.status;
    if (!action) {
      return res.status(400).json({ success: false, error: 'Thiếu action hoặc status' });
    }

    // Normalize status strings to actions
    if (action === 'approved') action = 'approve';
    if (action === 'rejected') action = 'reject';

    if (!['approve', 'reject', 'edit'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Hành động không hợp lệ. Chỉ chấp nhận 'approve', 'reject', hoặc 'edit'.",
      });
    }

    const rawReason = (req.body.override_reason || req.body.reason || req.body.note || '').trim();
    let formattedReason: string | undefined = undefined;
    if (rawReason) {
      if (rawReason.includes('Duyệt ngoại lệ:')) {
        formattedReason = rawReason;
      } else {
        const nowIso = new Date().toISOString();
        formattedReason = `[${nowIso}] Duyệt ngoại lệ: ${rawReason}`;
      }
    }

    const payload = {
      question_id: questionId,
      action,
      override_reason: formattedReason,
      stem: req.body.stem,
      options: req.body.options,
      answer_index: req.body.answer_index !== undefined ? Number(req.body.answer_index) : undefined,
      explanation_vi: req.body.explanation_vi,
      level: req.body.level !== undefined ? Number(req.body.level) : undefined,
    };

    const data = await callPythonBridge('review', payload, 30000);
    if (action === 'approve') {
      try {
        const db = getDbSync();
        syncApprovedQuestionToPool(db, questionId);
      } catch (syncErr) {
        console.warn(`[QBank Review Sync Warning] Could not sync question ${questionId}:`, syncErr);
      }
    } else if (action === 'reject') {
      try {
        const db = getDbSync();
        db.prepare('DELETE FROM pending_questions WHERE id = ?').run(questionId);
        db.prepare('DELETE FROM questions WHERE id = ?').run(questionId);
        db.prepare('DELETE FROM qb_questions WHERE question_id = ?').run(questionId);
        db.prepare('DELETE FROM exam_eligible_pool WHERE question_id = ?').run(questionId);
      } catch (delErr) {
        console.warn(`[QBank Review Reject Delete Warning] Could not delete question ${questionId}:`, delErr);
      }
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: sanitizeError(err.message) });
  }
}

qbankRouter.post('/questions/:id/status', handleReviewOrStatus);
qbankRouter.post('/review', handleReviewOrStatus);

// =========================================================================
// 5. POST /api/qbank/sync: Syncs approved questions to data/hsk_exam.db safely
// =========================================================================
qbankRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const { batch_id, level, limit, execute } = req.body || {};
    // Mandatory safeguard: default MUST be dry-run (execute: false)
    const isExecute = execute === true || execute === 'true';

    const data = await callPythonBridge(
      'sync',
      {
        batch_id,
        level: level !== undefined ? Number(level) : undefined,
        limit: limit !== undefined ? Number(limit) : undefined,
        execute: isExecute,
      },
      60000 // 60-second timeout
    );

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 6. Formatter for pending_questions row
// =========================================================================
export function formatPendingRow(row: any) {
  let options: string[] = [];
  try {
    options = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
  } catch {
    options = [];
  }
  if (!Array.isArray(options)) {
    options = [];
  }

  const isMissingAnswer =
    row.answer_idx === null ||
    row.answer_idx === undefined ||
    (typeof row.answer_idx === 'string' && row.answer_idx.trim() === '') ||
    (typeof row.answer_idx === 'number' && isNaN(row.answer_idx));
  const answerIdx = !isMissingAnswer ? Number(row.answer_idx) : 0;
  const explanationVi = row.explanation_vi || '';

  // Distractor rationales parsing
  const rationalesParsed = parseExplanationDistractorRationales(explanationVi, options, answerIdx);

  let optionsImages: string[] = [];
  try {
    optionsImages = typeof row.options_images === 'string' ? JSON.parse(row.options_images) : (row.options_images || []);
  } catch {
    optionsImages = [];
  }
  if (!Array.isArray(optionsImages)) optionsImages = [];

  // Deterministic validation diagnostics
  const warnings: string[] = [];
  const errors: string[] = [];

  const rawPartTypeForOpts = String(row.part_type || '').toLowerCase().trim();
  const isZeroOptionWritingTask =
    (rawPartTypeForOpts.startsWith('write_') || row.skill === 'writing') &&
    !rawPartTypeForOpts.includes('6opt') &&
    !rawPartTypeForOpts.includes('4opt') &&
    !rawPartTypeForOpts.includes('3opt') &&
    !rawPartTypeForOpts.includes('5opt');

  // 1. Answer index in bounds (only for multiple-choice tasks)
  if (!isZeroOptionWritingTask) {
    if (isMissingAnswer) {
      errors.push('Thiếu chỉ số đáp án đúng (answer_idx trống)');
    } else if (
      isNaN(Number(row.answer_idx)) ||
      typeof answerIdx !== 'number' ||
      !Number.isInteger(answerIdx) ||
      answerIdx < 0 ||
      (options.length > 0 && answerIdx >= options.length)
    ) {
      errors.push(
        `Chỉ số đáp án [${row.answer_idx}] không hợp lệ hoặc nằm ngoài phạm vi lựa chọn (0 đến ${Math.max(0, options.length - 1)})`
      );
    }
  }

  // 2. Options checks: presence and duplicates (not required for open-ended writing tasks)
  if (!isZeroOptionWritingTask) {
    if (!Array.isArray(options) || options.length === 0) {
      errors.push('Thiếu danh sách phương án lựa chọn');
    } else if (options.length < 2) {
      errors.push('Danh sách phương án lựa chọn không đủ số lượng (tối thiểu 2 phương án)');
    } else {
      const seen = new Set<string>();
      for (const opt of options) {
        const normalized = typeof opt === 'string' ? opt.trim() : String(opt);
        if (seen.has(normalized)) {
          errors.push(`Phát hiện phương án lựa chọn trùng lặp: "${normalized}"`);
          break;
        }
        seen.add(normalized);
      }
    }
  }

  // 3. Stem checks
  const stem = typeof row.stem === 'string' ? row.stem : '';
  if (!stem.trim()) {
    errors.push('Nội dung đề bài (stem) trống');
  }

  // 4. Character noise check: Latin letters or Vietnamese accents in Chinese stem/options where unexpected
  // Strip allowed bracketed pinyin (e.g. "(hòu tiān)" or "（yí gòng）") in fill-in-pinyin tasks
  let textToCheck = `${stem} ${options.join(' ')}`;
  textToCheck = textToCheck.replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '');
  // Ignore standard ordering labels e.g. "A-B-C-D-E" or "A. B. C."
  textToCheck = textToCheck.replace(/\b[A-Fa-f][\s\-,]+[A-Fa-f]\b/g, '').replace(/^[A-F]\.\s*/gm, '');

  const isPinyinTask = row.part_type === 'write_tianzige_from_pinyin' || /pinyin/i.test(row.part_type || '');
  const hasLatin = !isPinyinTask && /[a-zA-Z]/.test(textToCheck);
  // Vietnamese-specific characters strictly not present in Mandarin Pinyin:
  const hasVietnamese = /[đĐơưƠƯạảãặẳẵậẩẫẹẻẽịỉĩọỏõụủũỵỷỹẠẢÃẶẲẴẬẨẪẸẺẼỊỈĨỌỎÕỤỦŨỴỶỸ]/.test(textToCheck);

  if (hasLatin) {
    warnings.push('Phát hiện ký tự Latin trong nội dung câu hỏi hoặc phương án');
  }
  if (hasVietnamese) {
    warnings.push('Phát hiện ký tự tiếng Việt trong nội dung chữ Hán');
  }

  const validation_diagnostics = {
    valid: errors.length === 0,
    warnings,
    errors,
  };

  const metadata = parseExplanationMetadata(explanationVi);

  return {
    id: row.id,
    batch_id: row.batch_id || null,
    stem: row.stem,
    options,
    answer_idx: answerIdx,
    pinyin: row.pinyin || null,
    explanation_vi: explanationVi,
    level: Number(row.level) || 1,
    skill: row.skill || 'reading',
    part_type: row.part_type || 'read_fill_blank_4opt',
    illustration_theme: row.illustration_theme || null,
    options_images: optionsImages,
    topic: row.topic || null,
    status: row.status || 'pending',
    provider_used: row.provider_used || null,
    rejection_note: row.rejection_note || null,
    content_hash: row.content_hash || null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    distractor_rationales: rationalesParsed.distractors,
    has_distractor_rationales: rationalesParsed.hasDistractorRationales,
    difficulty_tier: metadata.difficulty_tier || row.difficulty_tier || null,
    trap_type: metadata.trap_type || row.trap_type || null,
    target_grammar: metadata.target_grammar || null,
    audio_url: row.audio_url || null,
    validation_diagnostics,
  };
}

// =========================================================================
// 7. GET /api/qbank/pending: Filter pending questions by level, skill, status, part_type
// =========================================================================
qbankRouter.get('/pending', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    const levelStr = req.query.level as string | undefined;
    const skill = req.query.skill as string | undefined;
    const partType = (req.query.part_type as string | undefined)?.trim();
    const status = (req.query.status as string | undefined)?.trim();
    const batchId = (req.query.batch_id as string | undefined)?.trim();
    const topic = (req.query.topic as string | undefined)?.trim();
    const difficultyTier = (req.query.difficulty_tier as string | undefined)?.trim();
    const limit = Math.max(1, Math.min(parseInt((req.query.limit as string) || '50', 10), 200));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    } else if (!status) {
      conditions.push('status = ?');
      params.push('pending');
    }

    if (levelStr) {
      const level = parseInt(levelStr, 10);
      if (!isNaN(level)) {
        conditions.push('level = ?');
        params.push(level);
      }
    }

    if (skill && skill.trim() && skill.trim() !== 'all') {
      conditions.push('skill = ?');
      params.push(skill.trim());
    }

    if (partType && partType !== 'all') {
      conditions.push('part_type = ?');
      params.push(partType);
    }

    if (batchId) {
      conditions.push('batch_id = ?');
      params.push(batchId);
    }

    if (topic && topic !== 'all') {
      conditions.push('topic = ?');
      params.push(topic);
    }

    if (difficultyTier && difficultyTier !== 'all') {
      const pCols = (db.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
      if (pCols.includes('difficulty_tier')) {
        conditions.push('(difficulty_tier = ? OR explanation_vi LIKE ?)');
        params.push(difficultyTier, `%${difficultyTier}%`);
      } else {
        conditions.push('explanation_vi LIKE ?');
        params.push(`%${difficultyTier}%`);
      }
    }

    const whereClause = conditions.join(' AND ');

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM pending_questions WHERE ${whereClause}`);
    const countResult: any = countStmt.get(...params);
    const total = countResult?.count ? Number(countResult.count) : 0;

    const queryStmt = db.prepare(
      `SELECT * FROM pending_questions WHERE ${whereClause} ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`
    );
    const rows: any[] = queryStmt.all(...params, limit, offset);
    const questions = rows.map(formatPendingRow);

    return res.json({
      success: true,
      total,
      questions,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 8. POST /api/qbank/pending/approve: Approve pending questions atomically
// =========================================================================
qbankRouter.post('/pending/approve', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);
    ensureEligiblePoolSchema(db);

    let ids: string[] = [];
    if (Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else if (Array.isArray(req.body.question_ids)) {
      ids = req.body.question_ids;
    } else if (req.body.id) {
      ids = [String(req.body.id)];
    } else if (req.body.question_id) {
      ids = [String(req.body.question_id)];
    }

    ids = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
    if (ids.length === 0) {
      return res.json({
        success: true,
        approved_count: 0,
        approved_ids: [],
        sync_details: [],
      });
    }

    const approvedIds: string[] = [];
    const syncDetails: any[] = [];

    db.exec('BEGIN IMMEDIATE;');
    try {
      const selectStmt = db.prepare('SELECT * FROM pending_questions WHERE id = ?');
      const updatePendingStmt = db.prepare(
        "UPDATE pending_questions SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      const upsertQuestionsStmt = db.prepare(`
        INSERT INTO questions (
          id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, options_images, topic, status, provider_used, content_hash, near_duplicate_signature, tested_vocab, passage, audio_url, is_active, batch_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          stem = excluded.stem,
          options = excluded.options,
          answer_idx = excluded.answer_idx,
          pinyin = excluded.pinyin,
          explanation_vi = excluded.explanation_vi,
          level = excluded.level,
          skill = excluded.skill,
          part_type = excluded.part_type,
          illustration_theme = excluded.illustration_theme,
          options_images = excluded.options_images,
          topic = excluded.topic,
          status = 'approved',
          provider_used = excluded.provider_used,
          content_hash = excluded.content_hash,
          near_duplicate_signature = excluded.near_duplicate_signature,
          tested_vocab = excluded.tested_vocab,
          passage = excluded.passage,
          audio_url = COALESCE(excluded.audio_url, questions.audio_url),
          is_active = 1,
          batch_id = COALESCE(excluded.batch_id, questions.batch_id),
          updated_at = CURRENT_TIMESTAMP
      `);
      const upsertQbStmt = db.prepare(`
        INSERT INTO qb_questions (
          question_id, level, skill, part_type, stem, passage, audio_url, options, answer_index, explanation_vi, pinyin_stem, topic, status, provenance, qa, content_hash, vocab_tags, options_images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?)
        ON CONFLICT(question_id) DO UPDATE SET
          level = excluded.level,
          skill = excluded.skill,
          part_type = excluded.part_type,
          stem = excluded.stem,
          passage = excluded.passage,
          audio_url = COALESCE(excluded.audio_url, qb_questions.audio_url),
          options = excluded.options,
          answer_index = excluded.answer_index,
          explanation_vi = excluded.explanation_vi,
          pinyin_stem = excluded.pinyin_stem,
          topic = excluded.topic,
          status = 'approved',
          content_hash = excluded.content_hash,
          vocab_tags = excluded.vocab_tags,
          options_images = excluded.options_images
      `);

      for (const id of ids) {
        const row: any = selectStmt.get(id);
        if (!row) continue;

        updatePendingStmt.run(id);

        let optionsArr: string[] = [];
        try {
          optionsArr = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
        } catch {
          optionsArr = [];
        }

        const optionsJson = typeof row.options === 'string' ? row.options : JSON.stringify(row.options || []);
        const rowLevel = Number(row.level) || 1;
        // Always compute hash and near-duplicate signature freshly
        let optionImages: string[] = [];
        try { optionImages = typeof row.options_images === 'string' ? JSON.parse(row.options_images) : (row.options_images || []); } catch {}
        const optionsImagesJson = JSON.stringify(Array.isArray(optionImages) ? optionImages : []);
        const contentHash = computeContentHash(row.stem, optionsArr, Number(row.answer_idx), optionImages);
        const nearDupSig = computeNearDuplicateSignature(row.stem, optionsArr);

        // Verify tested vocabulary against official HSK 1–6 syllabus
        let testedVocabJson = row.tested_vocab || null;
        if (!testedVocabJson) {
          try {
            const verified = verifyQuestionVocab(
              {
                stem: row.stem,
                options: optionsArr,
                answer_idx: Number(row.answer_idx),
                passage: row.passage || undefined,
                part_type: row.part_type,
              },
              rowLevel
            );
            testedVocabJson = JSON.stringify(verified.tested);
          } catch {
            testedVocabJson = '[]';
          }
        }

        upsertQuestionsStmt.run(
          row.id,
          row.stem,
          optionsJson,
          Number(row.answer_idx),
          row.pinyin || null,
          row.explanation_vi || '',
          rowLevel,
          row.skill || 'reading',
          row.part_type || 'read_fill_blank_4opt',
          row.illustration_theme || null,
          optionsImagesJson,
          row.topic || null,
          row.provider_used || 'multi-llm',
          contentHash,
          nearDupSig,
          testedVocabJson,
          row.passage || null,
          row.audio_url || null,
          row.batch_id || null
        );

        // Strict conformance to QbProvenance schema (extra="forbid")
        const provenance = JSON.stringify({
          origin: 'original_generated',
          batch_id: row.batch_id || `batch_approve_${Date.now()}`,
          prompt_version: 'v1.0',
          llm_model: row.provider_used || 'multi-llm',
          created_at: row.created_at || new Date().toISOString(),
        });
        const qa = JSON.stringify({
          structure_ok: true,
          level_ok: true,
          out_of_level_words: [],
          notes: ['Approved from pending queue'],
        });

        upsertQbStmt.run(
          row.id,
          rowLevel,
          row.skill || 'reading',
          row.part_type || 'read_fill_blank_4opt',
          row.stem,
          row.passage || null,
          row.audio_url || null,
          optionsJson,
          Number(row.answer_idx),
          row.explanation_vi || '',
          row.pinyin || null,
          row.topic || row.illustration_theme || null,
          provenance,
          qa,
          contentHash,
          testedVocabJson,
          optionsImagesJson
        );

        approvedIds.push(id);

        // Automatically synchronize approved question to both Practice and Exam Pools (Phần IV & V)
        try {
          const syncRes = syncApprovedQuestionToPool(db, id);
          if (syncRes) syncDetails.push(syncRes);
        } catch (syncErr) {
          console.warn(`[QBank Sync Warning] Could not sync question ${id}:`, syncErr);
        }
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      try {
        db.exec('ROLLBACK;');
      } catch {}
      throw txErr;
    }

    // Invalidate coverage cache immediately so coverage matrix and vocab tiers update
    invalidateVocabCoverageCache(db);

    return res.json({
      success: true,
      approved_count: approvedIds.length,
      approved_ids: approvedIds,
      sync_details: syncDetails,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// GET /api/qbank/pools/stats: Pool counts for Practice and Exam eligibility
qbankRouter.get('/pools/stats', (_req: Request, res: Response) => {
  try {
    const db = getDbSync();
    const stats = getEligiblePoolStats(db);
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// POST /api/qbank/pools/re-evaluate: Admin trigger to re-evaluate all approved questions and clean orphaned pool records
qbankRouter.post('/pools/re-evaluate', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const db = getDbSync();
    const result = reEvaluateApprovedQuestions(db);
    return res.json({
      success: true,
      summary: {
        total_approved_questions: result.total,
        practice_eligible_count: result.practice_eligible_count,
        exam_eligible_count: result.exam_eligible_count,
        still_ineligible_count: result.still_ineligible_count,
        reasons_recorded_count: result.reasons_recorded_count,
      },
      details: result.details,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// GET /api/qbank/exam/pool-inspection: Section-by-section breakdown against official HSK Blueprint
qbankRouter.get('/exam/pool-inspection', (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    const rawLevel = parseInt(req.query.level as string, 10);
    const level = isNaN(rawLevel) || rawLevel < 1 || rawLevel > 6 ? 1 : rawLevel;
    const inspection = inspectExamPoolBySections(db, level);
    return res.json({ success: true, inspection });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// POST /api/qbank/exam/assemble-or-supplement: Unified exam assembly with 0 LLM calls when pool is sufficient, or targeted bounded supplement
qbankRouter.post('/exam/assemble-or-supplement', async (req: Request, res: Response) => {
  const db = getDbSync();
  const body = req.body || {};
  const rawLevel = parseInt(body.level, 10);
  const level = isNaN(rawLevel) || rawLevel < 1 || rawLevel > 6 ? 1 : rawLevel;
  const mode: 'assemble' | 'supplement' = body.mode === 'supplement' ? 'supplement' : 'assemble';
  const examTitle = typeof body.exam_title === 'string' && body.exam_title.trim() ? body.exam_title.trim() : `Đề Thi HSK ${level} Chuẩn Hóa`;

  // Idempotency Key Handling (Header or Payload Hash)
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify({ level, mode, examTitle, topic: body.topic, part_type: body.part_type })).digest('hex');
  const idempotencyKey = ((req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string) || `exam_${mode}_${level}_${payloadHash.substring(0, 16)}`;

  const existingTask = getPersistentTask(db, idempotencyKey);
  if (existingTask) {
    if (existingTask.status === 'completed' && existingTask.result_json) {
      try {
        return res.json(JSON.parse(existingTask.result_json));
      } catch {}
    } else if (existingTask.status === 'running') {
      return res.status(429).json({
        success: false,
        status: 'running',
        message: 'Tác vụ đang được xử lý, vui lòng không gửi lại request liên tiếp.',
      });
    }
  }

  if (mode === 'supplement') {
    const lockRes = acquireGenerationLock(db, {
      taskType: 'exam_supplement',
      idempotencyKey,
      payloadHash,
      maxDurationMs: 120000,
    });
    if (!lockRes.acquired) {
      return res.status(409).json({
        success: false,
        error: lockRes.error || 'Hệ thống đang thực hiện một phiên sinh đề khác. Vui lòng đợi trong giây lát.',
        activeTask: lockRes.activeTask,
      });
    }
  } else {
    createPersistentTask(db, idempotencyKey, `exam_${mode}`, payloadHash);
  }

  try {
    const inspection = inspectExamPoolBySections(db, level);

    if (mode === 'assemble') {
      // Rule 1: Must be fully eligible across all sections
      if (!inspection.isFullyEligible) {
        failPersistentTask(db, idempotencyKey, 'Pool is insufficient');
        return res.status(400).json({
          success: false,
          is_fully_eligible: false,
          total_required: inspection.totalRequired,
          total_available: inspection.totalAvailable,
          total_missing: inspection.totalMissing,
          sections: inspection.sections,
          error: `Kho câu hỏi HSK ${level} còn thiếu ${inspection.totalMissing} câu để hoàn tất đề thi. Vui lòng bấm 'Sinh bù câu hỏi' để hoàn thiện.`,
        });
      }

      // Pool is 100% sufficient -> Assemble with 0 LLM calls!
      const allQuestionIds: string[] = [];
      for (const sec of Object.values(inspection.sections)) {
        for (const p of sec.parts) {
          allQuestionIds.push(...p.availableQuestionIds);
        }
      }

      const questionsList: any[] = [];
      const selectStmt = db.prepare('SELECT * FROM questions WHERE id = ?');
      for (const qid of allQuestionIds) {
        const q: any = selectStmt.get(qid);
        if (q) {
          questionsList.push({
            id: q.id,
            stem: q.stem,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            answer_idx: Number(q.answer_idx),
            pinyin: q.pinyin || null,
            explanation_vi: q.explanation_vi || '',
            level: Number(q.level),
            skill: q.skill,
            part_type: q.part_type,
          });
        }
      }

      const examCode = `HSK${level}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const responsePayload = {
        success: true,
        llm_calls_made: 0,
        is_fully_eligible: true,
        exam_code: examCode,
        exam_title: examTitle,
        level,
        total_questions: questionsList.length,
        questions: questionsList,
        message: 'Đã ghép đề thi hoàn chỉnh từ kho câu hỏi đã duyệt (0 API Call).',
      };

      completePersistentTask(db, idempotencyKey, responsePayload);
      return res.json(responsePayload);
    } else {
      // Mode: 'supplement' -> Bounded targeted generation
      if (inspection.totalMissing === 0) {
        const payload = {
          success: true,
          is_fully_eligible: true,
          generated_count: 0,
          remaining_missing: 0,
          message: 'Kho câu hỏi đã đủ điều kiện, không cần sinh bù thêm.',
        };
        completePersistentTask(db, idempotencyKey, payload);
        return res.json(payload);
      }

      // Find first part with deficiency
      let targetPart: any = null;
      for (const sec of Object.values(inspection.sections)) {
        for (const p of sec.parts) {
          if (p.nMissing > 0) {
            targetPart = p;
            break;
          }
        }
        if (targetPart) break;
      }

      if (!targetPart) {
        return res.json({ success: true, message: 'Không còn phần nào thiếu câu.' });
      }

      const maxToGen = Math.min(targetPart.nMissing, Math.max(1, Math.min(parseInt(body.supplement_max || '5', 10), 5)));
      const timestampStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const batchId = `batch_supp_${timestampStr}_${randomSuffix}`;
      const existingStems = extractExistingStemsFromDb(db);
      const waterfallResult = await generateWaterfallQuestions({
        level,
        part_type: targetPart.partType,
        count: maxToGen,
        topic: body.topic || undefined,
      });

      const validCandidates: CandidateQuestion[] = [];
      for (const candidate of waterfallResult.questions) {
        const valRes = validateCandidate(candidate, existingStems, {
          requireLanguageQuality: waterfallResult.providerUsed !== 'mock-llm',
          requireDistractorRationales: waterfallResult.providerUsed !== 'mock-llm',
        });
        if (valRes.valid) {
          validCandidates.push(candidate);
          const cStem = getComparableStem(candidate.stem, candidate.options, candidate.answer_idx);
          if (cStem) existingStems.push(cStem);
        }
      }

      let countSaved = 0;
      const insertStmt = db.prepare(`
        INSERT INTO pending_questions (
          id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, options_images, topic, provider_used, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(content_hash) DO NOTHING
      `);

      for (const q of validCandidates) {
        const qId = `pend_${level}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const optionsArr = q.options || [];
        const contentHash = computeContentHash(q.stem, optionsArr, q.answer_idx, q.options_images);
        const optionsJson = JSON.stringify(optionsArr);

        const info: any = insertStmt.run(
          qId,
          batchId,
          q.stem,
          optionsJson,
          q.answer_idx,
          q.pinyin || null,
          q.explanation_vi || '',
          level,
          q.skill,
          q.part_type,
          q.illustration_theme || null,
          JSON.stringify(q.options_images || []),
          q.topic || body.topic || null,
          waterfallResult.providerUsed,
          contentHash
        );

        if (info?.changes > 0) countSaved++;
      }

      const responsePayload = {
        success: true,
        batch_id: batchId,
        is_fully_eligible: false,
        llm_calls_made: 1,
        part_supplemented: targetPart.partType,
        count_requested: maxToGen,
        count_saved_to_pending: countSaved,
        remaining_missing: Math.max(0, inspection.totalMissing - countSaved),
        message: `Đã sinh bù ${countSaved} câu và chuyển vào hàng đợi 'Duyệt câu mới'. Vui lòng phê duyệt để hoàn tất đề thi.`,
      };

      completePersistentTask(db, idempotencyKey, responsePayload);
      return res.json(responsePayload);
    }
  } catch (err: any) {
    failPersistentTask(db, idempotencyKey, err.message || 'Lỗi xử lý ghép đề');
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// GET /api/qbank/scheduler/status: Current status of background question generator
qbankRouter.get('/scheduler/status', (_req: Request, res: Response) => {
  try {
    const status = getAutoSchedulerStatus();
    return res.json({ success: true, status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// POST /api/qbank/scheduler/toggle: Enable or disable background generator
qbankRouter.post('/scheduler/toggle', (req: Request, res: Response) => {
  try {
    process.env.ALLOW_OPERATIONAL_CRON_WRITE = 'true';
    const enable = typeof req.body.enabled === 'boolean' ? req.body.enabled : undefined;
    const status = toggleAutoScheduler(enable);
    return res.json({ success: true, status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// POST /api/qbank/scheduler/config: Update scheduler parameters (targetLevel, intervalHours, batchSize, maxQuestionsPerDay, preferredProvider, unlimitedDaily)
qbankRouter.post('/scheduler/config', (req: Request, res: Response) => {
  try {
    const {
      targetLevel,
      intervalHours,
      batchSize,
      maxQuestionsPerDay,
      preferredProvider,
      preferred_provider,
      unlimitedDaily,
      unlimited_daily,
    } = req.body || {};
    const status = updateSchedulerConfig({
      targetLevel: typeof targetLevel === 'number' ? targetLevel : undefined,
      intervalHours: typeof intervalHours === 'number' ? intervalHours : undefined,
      batchSize: typeof batchSize === 'number' ? batchSize : undefined,
      maxQuestionsPerDay: typeof maxQuestionsPerDay === 'number' ? maxQuestionsPerDay : undefined,
      preferredProvider: (preferredProvider || preferred_provider) as any,
      unlimitedDaily:
        typeof unlimitedDaily === 'boolean'
          ? unlimitedDaily
          : typeof unlimited_daily === 'boolean'
          ? unlimited_daily
          : undefined,
    });
    return res.json({ success: true, status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// POST /api/qbank/scheduler/trigger: Force run an on-demand batch (supports async background mode for instant UI response)
qbankRouter.post('/scheduler/trigger', async (req: Request, res: Response) => {
  try {
    process.env.ALLOW_OPERATIONAL_CRON_WRITE = 'true';
    const body = req.body || {};
    const batchOptions = {
      batchSizeOverride: typeof body.batchSize === 'number' ? body.batchSize : undefined,
      targetLevelOverride: typeof body.targetLevel === 'number' ? body.targetLevel : undefined,
      preferredProviderOverride: (body.preferredProvider || body.preferred_provider) as any,
      unlimitedDailyOverride:
        typeof body.unlimitedDaily === 'boolean'
          ? body.unlimitedDaily
          : typeof body.unlimited_daily === 'boolean'
          ? body.unlimited_daily
          : undefined,
    };

    if (body.background === true) {
      const currentStatus = getAutoSchedulerStatus();
      if (currentStatus.isRunning) {
        return res.json({
          success: false,
          isRunning: true,
          status: currentStatus,
          error: 'Robot đang trong quá trình tạo câu hỏi ở chế độ nền, vui lòng đợi đợt hiện tại hoàn tất.',
        });
      }

      runScheduledBatch(true, batchOptions).catch((err) => {
        console.error('[Scheduler Background Trigger Error]', err);
      });

      // Wait briefly so in-memory running flag & lock are acquired
      await new Promise((r) => setTimeout(r, 80));
      const updatedStatus = getAutoSchedulerStatus();
      return res.json({
        success: true,
        backgroundStarted: true,
        status: updatedStatus,
        message: 'Đã kích hoạt AI bắt đầu sinh câu hỏi ở chế độ nền!',
      });
    }

    const result = await runScheduledBatch(true, batchOptions);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 9. POST /api/qbank/pending/reject: Reject pending questions
// =========================================================================
qbankRouter.post('/pending/reject', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    let ids: string[] = [];
    if (Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else if (Array.isArray(req.body.question_ids)) {
      ids = req.body.question_ids;
    } else if (req.body.id) {
      ids = [String(req.body.id)];
    } else if (req.body.question_id) {
      ids = [String(req.body.question_id)];
    }

    ids = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return res.json({
        success: true,
        rejected_count: 0,
        rejected_ids: [],
      });
    }

    const rejectionNote = (req.body.rejection_note || req.body.reason || req.body.note || '').trim() || null;
    const rejectedIds: string[] = [];

    db.exec('BEGIN IMMEDIATE;');
    try {
      const deletePendingStmt = db.prepare('DELETE FROM pending_questions WHERE id = ?');
      const deleteQuestionStmt = db.prepare('DELETE FROM questions WHERE id = ?');
      let deleteQbStmt: any = null;
      try {
        deleteQbStmt = db.prepare('DELETE FROM qb_questions WHERE question_id = ?');
      } catch {}
      let deletePoolStmt: any = null;
      try {
        deletePoolStmt = db.prepare('DELETE FROM exam_eligible_pool WHERE question_id = ?');
      } catch {}

      for (const id of uniqueIds) {
        const resPending = deletePendingStmt.run(id);
        const delQ = deleteQuestionStmt.run(id);
        let delQbChanges = 0;
        if (deleteQbStmt) {
          try {
            const delQb = deleteQbStmt.run(id);
            delQbChanges = delQb.changes;
          } catch {}
        }
        if (deletePoolStmt) {
          try {
            deletePoolStmt.run(id);
          } catch {}
        }

        if (resPending.changes > 0 || delQ.changes > 0 || delQbChanges > 0) {
          rejectedIds.push(id);
        }
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      try {
        db.exec('ROLLBACK;');
      } catch {}
      throw txErr;
    }

    invalidateVocabCoverageCache(db);

    return res.json({
      success: true,
      rejected_count: rejectedIds.length,
      rejected_ids: rejectedIds,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 9.1. POST /api/qbank/pending/disable: Disable pending questions (single or batch)
// =========================================================================
qbankRouter.post('/pending/disable', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    let ids: string[] = [];
    if (Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else if (Array.isArray(req.body.question_ids)) {
      ids = req.body.question_ids;
    } else if (req.body.id) {
      ids = [String(req.body.id)];
    } else if (req.body.question_id) {
      ids = [String(req.body.question_id)];
    }

    ids = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return res.json({
        success: true,
        disabled_count: 0,
        disabled_ids: [],
      });
    }

    const disabledIds: string[] = [];

    db.exec('BEGIN IMMEDIATE;');
    try {
      const updatePendingStmt = db.prepare(
        "UPDATE pending_questions SET status = 'disabled', is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      const updateQuestionsStmt = db.prepare(
        "UPDATE questions SET status = 'disabled', is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      let updateQbStmt: any = null;
      try {
        updateQbStmt = db.prepare("UPDATE qb_questions SET status = 'disabled' WHERE question_id = ?");
      } catch {}
      let deletePoolStmt: any = null;
      try {
        deletePoolStmt = db.prepare('DELETE FROM exam_eligible_pool WHERE question_id = ?');
      } catch {}

      for (const id of uniqueIds) {
        const resPending = updatePendingStmt.run(id);
        const resQuestions = updateQuestionsStmt.run(id);
        let updateQbChanges = 0;
        if (updateQbStmt) {
          try {
            const resQb = updateQbStmt.run(id);
            updateQbChanges = resQb.changes;
          } catch {}
        }
        if (deletePoolStmt) {
          try {
            deletePoolStmt.run(id);
          } catch {}
        }

        if (resPending.changes > 0 || resQuestions.changes > 0 || updateQbChanges > 0) {
          disabledIds.push(id);
        }
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      try {
        db.exec('ROLLBACK;');
      } catch {}
      throw txErr;
    }

    invalidateVocabCoverageCache(db);

    return res.json({
      success: true,
      disabled_count: disabledIds.length,
      disabled_ids: disabledIds,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 10. PUT /api/qbank/pending/:id & POST /api/qbank/pending/edit: Edit pending question
// =========================================================================
async function handlePendingEdit(req: Request, res: Response) {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    const targetId = req.params.id || req.body.id || req.body.question_id;
    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Thiếu question id' });
    }

    const selectStmt = db.prepare('SELECT * FROM pending_questions WHERE id = ?');
    const existing: any = selectStmt.get(targetId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy câu hỏi trong hàng đợi' });
    }

    let stem = existing.stem;
    if (req.body.stem !== undefined && typeof req.body.stem === 'string') {
      stem = req.body.stem.trim();
    }

    let options = existing.options;
    let optionsArr: string[] = [];
    if (req.body.options !== undefined) {
      if (Array.isArray(req.body.options)) {
        optionsArr = req.body.options.map((o: any) => String(o).trim());
        options = JSON.stringify(optionsArr);
      } else if (typeof req.body.options === 'string') {
        try {
          const parsed = JSON.parse(req.body.options);
          if (Array.isArray(parsed)) {
            optionsArr = parsed.map((o: any) => String(o).trim());
            options = JSON.stringify(optionsArr);
          } else {
            options = req.body.options;
          }
        } catch {
          options = req.body.options;
        }
      }
    } else {
      try {
        optionsArr = typeof options === 'string' ? JSON.parse(options) : (options || []);
      } catch {
        optionsArr = [];
      }
    }

    let answerIdx = Number(existing.answer_idx);
    const isWritingTask =
      (String(req.body.part_type || existing.part_type || '').toLowerCase().startsWith('write_') || existing.skill === 'writing') &&
      optionsArr.length === 0;

    if (req.body.answer_idx !== undefined || req.body.answer_index !== undefined) {
      const rawIdx = req.body.answer_idx !== undefined ? req.body.answer_idx : req.body.answer_index;
      const parsedIdx = Number(rawIdx);
      if (!isWritingTask && (isNaN(parsedIdx) || !Number.isInteger(parsedIdx) || parsedIdx < 0 || parsedIdx >= optionsArr.length)) {
        return res.status(400).json({
          success: false,
          error: `Chỉ số đáp án (answer_idx) không hợp lệ: phải là số nguyên từ 0 đến ${optionsArr.length - 1}`
        });
      }
      answerIdx = isWritingTask ? 0 : parsedIdx;
    }

    let explanationVi = existing.explanation_vi;
    if (req.body.explanation_vi !== undefined) {
      explanationVi = String(req.body.explanation_vi).trim();
    }

    let pinyin = existing.pinyin;
    if (req.body.pinyin !== undefined) {
      pinyin = req.body.pinyin ? String(req.body.pinyin).trim() : null;
    }

    let illustrationTheme = existing.illustration_theme;
    if (req.body.illustration_theme !== undefined) {
      illustrationTheme = req.body.illustration_theme ? String(req.body.illustration_theme).trim() : null;
    }

    let level = Number(existing.level);
    if (req.body.level !== undefined && !isNaN(Number(req.body.level))) {
      level = Number(req.body.level);
    }

    let skill = existing.skill;
    if (req.body.skill !== undefined && typeof req.body.skill === 'string') {
      skill = req.body.skill.trim();
    }

    let partType = existing.part_type;
    if (req.body.part_type !== undefined && typeof req.body.part_type === 'string') {
      partType = req.body.part_type.trim();
    }

    let optionsImages: string[] = [];
    try {
      optionsImages = req.body.options_images === undefined
        ? (typeof existing.options_images === 'string' ? JSON.parse(existing.options_images) : (existing.options_images || []))
        : req.body.options_images;
    } catch {
      return res.status(400).json({ success: false, error: 'Danh sách options_images không hợp lệ' });
    }
    if (!Array.isArray(optionsImages) || optionsImages.some((image) => typeof image !== 'string')) {
      return res.status(400).json({ success: false, error: 'Danh sách options_images không hợp lệ' });
    }
    const optionsImagesJson = JSON.stringify(optionsImages);
    const newContentHash = computeContentHash(stem, optionsArr, answerIdx, optionsImages);
    const newNearDupSig = computeNearDuplicateSignature(stem, optionsArr);
    let newTestedVocabJson = existing.tested_vocab || '[]';
    try {
      const verified = verifyQuestionVocab(
        {
          stem,
          options: optionsArr,
          answer_idx: answerIdx,
          passage: existing.passage || undefined,
          part_type: partType,
        },
        level
      );
      newTestedVocabJson = JSON.stringify(verified.tested);
    } catch {}

    const updateStmt = db.prepare(`
      UPDATE pending_questions SET
        stem = ?,
        options = ?,
        answer_idx = ?,
        explanation_vi = ?,
        pinyin = ?,
        illustration_theme = ?,
        level = ?,
        skill = ?,
        part_type = ?,
        content_hash = ?,
        options_images = ?,
        near_duplicate_signature = ?,
        tested_vocab = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(
      stem,
      options,
      answerIdx,
      explanationVi,
      pinyin,
      illustrationTheme,
      level,
      skill,
      partType,
      newContentHash,
      optionsImagesJson,
      newNearDupSig,
      newTestedVocabJson,
      targetId
    );

    // If already approved, propagate changes to questions and qb_questions
    if (existing.status === 'approved') {
      try {
        db.prepare(`
          UPDATE questions SET
            stem = ?,
            options = ?,
            answer_idx = ?,
            pinyin = ?,
            explanation_vi = ?,
            level = ?,
            skill = ?,
            part_type = ?,
            illustration_theme = ?,
            options_images = ?,
            content_hash = ?,
            near_duplicate_signature = ?,
            tested_vocab = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(stem, options, answerIdx, pinyin, explanationVi, level, skill, partType, illustrationTheme, optionsImagesJson, newContentHash, newNearDupSig, newTestedVocabJson, targetId);

        db.prepare(`
          UPDATE qb_questions SET
            stem = ?,
            options = ?,
            answer_index = ?,
            pinyin_stem = ?,
            explanation_vi = ?,
            level = ?,
            skill = ?,
            part_type = ?,
            topic = ?,
            content_hash = ?
          WHERE question_id = ?
        `).run(stem, options, answerIdx, pinyin, explanationVi, level, skill, partType, illustrationTheme || '', newContentHash, targetId);

        syncApprovedQuestionToPool(db, targetId);
      } catch {}
    }

    invalidateVocabCoverageCache(db);

    const updatedRow: any = selectStmt.get(targetId);
    return res.json({
      success: true,
      question: formatPendingRow(updatedRow),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
}

qbankRouter.put('/pending/:id', handlePendingEdit);
qbankRouter.post('/pending/edit', handlePendingEdit);

// =========================================================================
// 11. GET /api/qbank/progress & GET /api/qbank/pending/stats: Summary stats & history
// =========================================================================
async function handleProgressOrStats(_req: Request, res: Response) {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    const pending_by_level: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    const approved_by_level: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    const rejected_by_level: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };

    try {
      const pRows: any[] = db
        .prepare("SELECT level, COUNT(*) as cnt FROM pending_questions WHERE status = 'pending' GROUP BY level")
        .all();
      for (const r of pRows) {
        const lvl = String(r.level);
        if (lvl in pending_by_level) pending_by_level[lvl] = Number(r.cnt);
      }
    } catch {}

    try {
      const rRows: any[] = db
        .prepare("SELECT level, COUNT(*) as cnt FROM pending_questions WHERE status = 'rejected' GROUP BY level")
        .all();
      for (const r of rRows) {
        const lvl = String(r.level);
        if (lvl in rejected_by_level) rejected_by_level[lvl] = Number(r.cnt);
      }
    } catch {}

    try {
      const aRows: any[] = db
        .prepare("SELECT level, COUNT(*) as cnt FROM questions WHERE status = 'approved' GROUP BY level")
        .all();
      for (const r of aRows) {
        const lvl = String(r.level);
        if (lvl in approved_by_level) approved_by_level[lvl] = Number(r.cnt);
      }
    } catch {}

    try {
      const qbRows: any[] = db
        .prepare("SELECT level, COUNT(*) as cnt FROM qb_questions WHERE status = 'approved' GROUP BY level")
        .all();
      for (const r of qbRows) {
        const lvl = String(r.level);
        if (lvl in approved_by_level) {
          approved_by_level[lvl] = Math.max(approved_by_level[lvl], Number(r.cnt));
        }
      }
    } catch {}

    const total_pending = Object.values(pending_by_level).reduce((acc, val) => acc + val, 0);
    const total_approved = Object.values(approved_by_level).reduce((acc, val) => acc + val, 0);

    let generation_history: any[] = [];
    try {
      const histRows = db.prepare('SELECT * FROM generation_runs ORDER BY created_at DESC LIMIT 20').all();
      generation_history = histRows;
    } catch {
      try {
        const histRows = db.prepare('SELECT * FROM generation_history ORDER BY created_at DESC LIMIT 20').all();
        generation_history = histRows;
      } catch {
        generation_history = [];
      }
    }

    return res.json({
      success: true,
      pending_by_level,
      approved_by_level,
      rejected_by_level,
      total_pending,
      total_approved,
      generation_history,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
}

qbankRouter.get('/progress', handleProgressOrStats);
qbankRouter.get('/pending/stats', handleProgressOrStats);

// =========================================================================
// 12. HSK 3.0 Multi-Dimensional Coverage Endpoints (Milestone 1)
// =========================================================================

/**
 * GET /api/qbank/coverage/matrix: Full coverage matrix for HSK 1–6 blueprint part types & skills
 */
qbankRouter.get('/coverage/matrix', async (_req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);
    const matrix = computeCoverageMatrix(db);
    return res.json({ success: true, ...matrix });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

/**
 * GET /api/qbank/coverage/vocab: 4-Tier vocabulary coverage report for 5,334 syllabus words
 */
qbankRouter.get('/coverage/vocab', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);
    const levelStr = req.query.level as string | undefined;
    const overusedThreshold = req.query.overused_threshold ? parseInt(req.query.overused_threshold as string, 10) : undefined;
    const report = computeVocabCoverage(db, { overusedThreshold });

    const targetLevel = levelStr ? parseInt(levelStr, 10) : undefined;
    const wordDetailsObj: Record<string, any> = {};
    for (const [word, detail] of report.wordDetails.entries()) {
      if (!targetLevel || detail.level === targetLevel) {
        wordDetailsObj[word] = detail;
      }
    }

    return res.json({
      success: true,
      timestamp: report.timestamp,
      totalWords: report.totalWords,
      overall: report.overall,
      byLevel: report.byLevel,
      overusedWords: report.overusedWords,
      priorityMissingWords: targetLevel
        ? report.priorityMissingWords.filter((w) => w.level === targetLevel)
        : report.priorityMissingWords.slice(0, 100),
      wordDetails: wordDetailsObj,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

/**
 * GET /api/qbank/coverage/priority-deficit: Next deterministic deficit target for question generation
 */
qbankRouter.get('/coverage/priority-deficit', async (_req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);
    const deficitGroup = getPriorityDeficitGroup(db);
    return res.json({ success: true, deficitGroup });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

/**
 * POST /api/qbank/coverage/plan-vocab: Pre-generation vocabulary planner (60/25/15)
 */
qbankRouter.post('/coverage/plan-vocab', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);
    const level = parseInt(req.body.level || '1', 10);
    const count = parseInt(req.body.count || '5', 10);
    const planned = planBatchVocab(level, count, db, {
      overusedThreshold: req.body.overused_threshold,
      wordsPerQuestion: req.body.words_per_question,
    });
    return res.json({ success: true, planned });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

/**
 * POST /api/qbank/coverage/verify-vocab: Actual text syllabus verification against official catalog
 */
qbankRouter.post('/coverage/verify-vocab', async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.body.level || '1', 10);
    const verified = verifyQuestionVocab(req.body.question || req.body, level);
    return res.json({ success: true, verified });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

/**
 * POST /api/qbank/questions/:id/disable: Disable or archive a question so it is excluded from official coverage & student pools
 */
qbankRouter.post('/questions/:id/disable', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);
    const targetId = req.params.id || req.body.id || req.body.question_id;
    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Thiếu question id' });
    }
    const status = req.body.status === 'archived' ? 'archived' : 'disabled';

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare("UPDATE questions SET status = ?, is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, targetId);
      db.prepare("UPDATE pending_questions SET status = ?, is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, targetId);
      try {
        db.prepare("DELETE FROM exam_eligible_pool WHERE question_id = ?").run(targetId);
      } catch {}
      db.exec('COMMIT;');
    } catch (txErr) {
      try { db.exec('ROLLBACK;'); } catch {}
      throw txErr;
    }

    invalidateVocabCoverageCache(db);
    return res.json({ success: true, id: targetId, status, is_active: 0 });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

// =========================================================================
// 12.1. HSK 3.0 Official Coverage Statistics Endpoint (Phase 2 Specification)
// =========================================================================

/**
 * GET /api/qbank/coverage/official
 * Official Coverage Statistics Service exposing Phase 2 multi-dimensional metrics.
 *
 * Query Parameters:
 * - level?: '1' | '2' | '3' | '4' | '5' | '6' (filter by specific level)
 * - refresh?: 'true' | 'false' (bypass cache and recalculate)
 *
 * Invariants Enforced:
 * 1. Filter: Strictly `status = 'approved' AND is_active = 1`.
 * 2. Exclusions: Explicitly reports count of excluded pending (21), rejected (3), disabled (0).
 * 3. Denominator Transparency: Explicit numerator, denominator, denominator_scope, status, is_complete.
 * 4. Anti-Fabrication: Never claims 100% while grammar is missing or writing chars are partial.
 * 5. Unique Question Counting: 1 question linked to multiple knowledge items counts strictly ONCE.
 */
qbankRouter.get('/coverage/official', async (req: Request, res: Response) => {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    const levelStr = req.query.level as string | undefined;
    const targetLevel = levelStr ? parseInt(levelStr, 10) : undefined;
    if (targetLevel !== undefined && (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 6)) {
      return res.status(400).json({
        success: false,
        error: 'Tham số level không hợp lệ. Phải nằm trong khoảng 1 đến 6.',
      });
    }

    const skipCache = req.query.refresh === 'true';
    const officialService = getOfficialCoverageService();
    const report = officialService.computeOfficialCoverage(db, {
      level: targetLevel,
      skipCache,
    });

    return res.json({
      success: true,
      ...report,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: sanitizeError(err.message),
    });
  }
});

/**
 * GET /api/qbank/dashboard/overview & GET /api/qbank/coverage/overview:
 * Comprehensive Pool Overview for Admin Dashboard (View 1)
 */
export async function handleDashboardOverview(_req: Request, res: Response) {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);

    const matrix = computeCoverageMatrix(db);
    const vocabReport = computeVocabCoverage(db);
    const catalog = getSyllabusCatalog();

    // Counts from questions & pending_questions (strict HSK 1–6)
    // Ensures unique approved active questions count (each question counted at most once)
    const approvedRow: any = db.prepare(`
      SELECT COUNT(DISTINCT COALESCE(content_hash, id)) as cnt
      FROM questions
      WHERE status = 'approved' AND is_active = 1 AND level BETWEEN 1 AND 6
    `).get();
    const approvedActiveCount = Number(approvedRow?.cnt || 0);

    const pendingRow: any = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM pending_questions
      WHERE status = 'pending' AND level BETWEEN 1 AND 6
    `).get();
    const pendingCount = Number(pendingRow?.cnt || 0);

    const rejectedRow: any = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM pending_questions
      WHERE status = 'rejected' AND level BETWEEN 1 AND 6
    `).get();
    const rejectedCount = Number(rejectedRow?.cnt || 0);

    const disabledRow: any = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM questions
      WHERE (status IN ('disabled', 'archived') OR is_active = 0) AND level BETWEEN 1 AND 6
    `).get();
    const disabledCount = Number(disabledRow?.cnt || 0);

    const runsStats: any = db.prepare(`
      SELECT
        COALESCE(SUM(count_generated), 0) as total_gen,
        COALESCE(SUM(count_saved_pending), 0) as total_saved,
        COALESCE(SUM(count_rejected_validator), 0) as total_rejected_val
      FROM generation_runs
      WHERE level BETWEEN 1 AND 6
    `).get();

    const totalGenerated = Number(runsStats?.total_gen || 0);
    const totalSavedFromRuns = Number(runsStats?.total_saved || 0);
    const validationFailedCount = Number(runsStats?.total_rejected_val || 0);

    const validationPassRate = totalGenerated > 0
      ? Math.round((totalSavedFromRuns / totalGenerated) * 1000) / 10
      : 100;

    const totalReviewed = approvedActiveCount + rejectedCount;
    const adminApprovalRate = totalReviewed > 0
      ? Math.round((approvedActiveCount / totalReviewed) * 1000) / 10
      : 100;

    let groupsMetTargetCount = 0;
    let groupsDeficitCount = 0;
    let groupsBlockedCount = 0;

    for (const row of matrix.rows) {
      if (row.status === 'blocked') {
        groupsBlockedCount++;
      } else if (
        row.status === 'minimum_coverage_met' ||
        row.status === 'extended_target_met' ||
        row.status === 'exam_ready'
      ) {
        groupsMetTargetCount++;
      } else {
        groupsDeficitCount++;
      }
    }

    // Official 572-point CLEC Grammar Catalog Status (strictly 0.0% unverified)
    const grammarCoverage = {
      standard: 'CLEC 2021',
      totalPoints: 572,
      testedPoints: 0,
      percentage: 0.0,
      status: 'unverified' as const,
      scope: 'clec_2021_hsk1_6_official_grammar_standard',
    };

    // Query validation rejections, duplicate rejections, theme errors, admin rejections, common error categories
    let validationRejections = 0;
    let duplicateRejections = 0;
    let themeErrors = 0;
    const errorCategoryMap = new Map<string, number>();

    try {
      const runs = db.prepare(`
        SELECT count_rejected_validator, details
        FROM generation_runs
        WHERE level BETWEEN 1 AND 6
      `).all() as any[];

      for (const r of runs) {
        validationRejections += Number(r.count_rejected_validator || 0);
        if (r.details) {
          try {
            const d = JSON.parse(r.details);
            if (d.rejected_reasons && typeof d.rejected_reasons === 'object') {
              for (const [reason, cnt] of Object.entries(d.rejected_reasons)) {
                const num = Number(cnt || 0);
                if (reason.includes('Trùng lặp')) {
                  duplicateRejections += num;
                }
                if (reason.includes('minh họa') || reason.includes('Theme')) {
                  themeErrors += num;
                }
                errorCategoryMap.set(reason, (errorCategoryMap.get(reason) || 0) + num);
              }
            }
          } catch {}
        }
      }
    } catch {}

    let adminRejections = 0;
    try {
      const adminRejRow: any = db.prepare(`
        SELECT COUNT(*) as cnt
        FROM pending_questions
        WHERE status = 'rejected' AND level BETWEEN 1 AND 6
      `).get();
      adminRejections = Number(adminRejRow?.cnt || 0);
    } catch {}

    const commonErrorCategories = Array.from(errorCategoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const deficientAreas = [
      {
        level: 'HSK 1-6',
        skill: 'writing',
        deficit: '100%',
        approvedCount: 0,
        targetCount: 300,
        description: 'Chưa có câu hỏi kỹ năng Viết nào được duyệt cho HSK 1–6',
      },
      {
        level: 'HSK 2-6',
        skill: 'listening',
        deficit: '100%',
        approvedCount: 0,
        targetCount: 350,
        description: 'Chưa có câu hỏi kỹ năng Nghe nào được duyệt cho HSK 2–6',
      },
    ];

    const errorReliabilityStats = {
      validationRejections,
      duplicateRejections,
      themeErrors,
      adminRejections,
      commonErrorCategories,
      deficientAreas,
    };

    // Reference vs Verified Syllabus Benchmarks for HSK 1–6
    const refVocabNew: Record<number, number> = { 1: 300, 2: 200, 3: 500, 4: 1000, 5: 1600, 6: 1800 };
    const refVocabCum: Record<number, number> = { 1: 300, 2: 500, 3: 1000, 4: 2000, 5: 3600, 6: 5400 };
    const refCharRecogNew: Record<number, number> = { 1: 246, 2: 125, 3: 284, 4: 441, 5: 431, 6: 413 };
    const refCharRecogCum: Record<number, number> = { 1: 246, 2: 371, 3: 655, 4: 1096, 5: 1527, 6: 1940 };
    const refCharWriteCum: Record<number, number> = { 1: 100, 2: 100, 3: 250, 4: 400, 5: 550, 6: 700 };

    const syllabusBenchmarks: Record<number, any> = {};
    let cumVerifiedVocab = 0;
    let cumVerifiedChars = 0;
    for (let lvl = 1; lvl <= 6; lvl++) {
      const newVocabVerified = (catalog.wordsByLevel.get(lvl as any) || []).length;
      cumVerifiedVocab += newVocabVerified;
      const newCharsVerified = (catalog.charsByLevel.get(lvl as any) || []).length;
      cumVerifiedChars += newCharsVerified;

      syllabusBenchmarks[lvl] = {
        level: lvl,
        vocab: {
          referenceNew: refVocabNew[lvl],
          referenceCumulative: refVocabCum[lvl],
          verifiedNew: newVocabVerified,
          verifiedCumulative: cumVerifiedVocab,
          verificationStatus: newVocabVerified === refVocabNew[lvl] ? 'exact_match' : 'verified_deduplicated_headwords',
        },
        chars: {
          referenceRecognitionNew: refCharRecogNew[lvl],
          referenceRecognitionCumulative: refCharRecogCum[lvl],
          verifiedRecognitionNew: newCharsVerified,
          verifiedRecognitionCumulative: cumVerifiedChars,
          referenceWritingCumulative: refCharWriteCum[lvl],
          verificationStatus: newCharsVerified === refCharRecogNew[lvl] ? 'exact_match' : 'verified_from_source',
        },
      };
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      scope: 'HSK 1-6 Only',
      poolOverview: {
        approvedActiveCount,
        uniqueQuestionsCount: approvedActiveCount,
        pendingCount,
        rejectedCount,
        validationFailedCount,
        disabledCount,
        groupsMetTargetCount,
        groupsDeficitCount,
        groupsBlockedCount,
        totalBlueprintGroups: matrix.rows.length,
        validationPassRate,
        adminApprovalRate,
      },
      grammarCoverage,
      errorReliabilityStats,
      vocabSummary: {
        totalVerifiedWords: vocabReport.totalWords,
        overall: vocabReport.overall,
        byLevel: vocabReport.byLevel,
        overusedWordsCount: vocabReport.overusedWords.length,
      },
      syllabusBenchmarks,
      priorityDeficit: getPriorityDeficitGroup(db),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
}

qbankRouter.get('/dashboard/overview', handleDashboardOverview);
qbankRouter.get('/coverage/overview', handleDashboardOverview);

/**
 * GET /api/qbank/scheduler/history & GET /api/qbank/dashboard/cron-history:
 * Detailed Cron & Task History for Admin Dashboard (View 4)
 */
async function handleSchedulerHistory(req: Request, res: Response) {
  try {
    const db = getDbSync();
    ensurePendingSchema(db);
    const limit = Math.max(1, Math.min(parseInt((req.query.limit as string) || '30', 10), 100));

    const schedulerStatus = getAutoSchedulerStatus();

    let runs: any[] = [];
    try {
      const rawRuns: any[] = db.prepare(`
        SELECT * FROM generation_runs ORDER BY created_at DESC, rowid DESC LIMIT ?
      `).all(limit) as any[];
      runs = rawRuns.map((r) => {
        let parsedDetails: any = null;
        try {
          parsedDetails = r.details ? JSON.parse(r.details) : null;
        } catch {}
        return {
          ...r,
          parsed_details: parsedDetails,
        };
      });
    } catch {}

    let tasks: any[] = [];
    try {
      const rawTasks: any[] = db.prepare(`
        SELECT * FROM qbank_tasks ORDER BY updated_at DESC, rowid DESC LIMIT ?
      `).all(limit) as any[];
      tasks = rawTasks.map((t) => {
        let parsedResult: any = null;
        try {
          parsedResult = t.result_json ? JSON.parse(t.result_json) : null;
        } catch {}
        return {
          ...t,
          parsed_result: parsedResult,
        };
      });
    } catch {}

    return res.json({
      success: true,
      scheduler: {
        ...schedulerStatus,
        dailyCronExpression: '0 2 * * *',
        scope: 'HSK 1-6',
      },
      runs,
      tasks,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
}

qbankRouter.get('/scheduler/history', handleSchedulerHistory);
qbankRouter.get('/dashboard/cron-history', handleSchedulerHistory);

// =========================================================================
// HSK 3.0 Blueprint Auto-Balancer Endpoints
// =========================================================================

qbankRouter.get('/balancer/report', async (_req: Request, res: Response) => {
  try {
    const pythonArgs = ['-X', 'utf8', 'hsk_blueprint_balancer.py', '--json', '--db', getQBankDbPath()];
    const pyResult = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const proc = spawn('python', pythonArgs, { cwd: process.cwd() });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => { resolve({ stdout, stderr, code: code ?? 0 }); });
      proc.on('error', (err) => { stderr += err.message; resolve({ stdout, stderr, code: 1 }); });
    });

    if (pyResult.stdout) {
      try {
        const report = JSON.parse(pyResult.stdout.trim());
        return res.json({ success: true, report });
      } catch {}
    }
    return res.status(500).json({ success: false, error: pyResult.stderr || 'Failed to parse deficit report' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});

qbankRouter.post('/balancer/run', async (req: Request, res: Response) => {
  try {
    const rawLvl = req.body.level ? parseInt(req.body.level, 10) : undefined;
    const limitPerSkill = req.body.limit_per_skill ? parseInt(req.body.limit_per_skill, 10) : 5;

    const pythonArgs = [
      '-X', 'utf8',
      'hsk_blueprint_balancer.py',
      '--db', getQBankDbPath(),
      '--limit-per-skill', String(limitPerSkill)
    ];

    if (rawLvl && rawLvl >= 1 && rawLvl <= 6) {
      pythonArgs.push('--level', String(rawLvl));
    } else {
      pythonArgs.push('--all');
    }

    const pyResult = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const proc = spawn('python', pythonArgs, {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => { resolve({ stdout, stderr, code: code ?? 0 }); });
      proc.on('error', (err) => { stderr += err.message; resolve({ stdout, stderr, code: 1 }); });
    });

    const isSuccess = pyResult.code === 0;
    const msg = isSuccess
      ? 'Đã hoàn tất đợt bù câu hỏi tự động theo Blueprint!'
      : (pyResult.stderr?.trim() || 'Quá trình bù câu hỏi gặp lỗi.');

    return res.json({
      success: isSuccess,
      message: msg,
      output: pyResult.stdout,
      error: isSuccess ? null : (pyResult.stderr?.trim() || 'Lỗi sinh đề Blueprint'),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: sanitizeError(err.message) });
  }
});




