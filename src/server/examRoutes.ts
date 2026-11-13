import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import {
  HSKExamQuestion,
  HSKBlueprintSummary,
  HSK_BLUEPRINT_SUMMARIES,
  getMockExamQuestions,
  getPracticeQuestions,
} from '../data/hskMockExamFixtures';
import { inspectExamPoolBySections, loadBlueprintData, isCompatiblePartType } from './qbankFormatSync.js';
import {
  isServingAnswerShuffleEnabled,
  canShuffle,
  shuffleQuestionAnswers,
} from './utils/answerShuffle.js';

export const examRouter = Router();

// Defense-in-depth: enforce UTF-8 charset on all JSON responses
examRouter.use((_req: Request, res: Response, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// =========================================================================
// Server-side In-Memory Session Storage with TTL Cleanup
// =========================================================================
export interface ExamQuestionItem extends HSKExamQuestion {
  passage?: string;
  group_id?: string;
  shuffled?: boolean;
  shuffle_reason?: string;
  answer_idx?: number;
  compatible_formats?: string[];
}

export interface ExamOverlapMetrics {
  questionSetHash: string;
  maxOverlapRatio: number;
  overlappingQuestionCount: number;
  isDuplicateQuestionSet: boolean;
  comparedSessionId: string | null;
}

export interface ActiveExamSession {
  sessionId: string;
  level: number;
  mode: 'mock' | 'practice';
  skill?: string;
  part_type?: string;
  totalQuestions: number;
  requestedCount?: number;
  actualCount?: number;
  isShortage?: boolean;
  usingFixtureFallback?: boolean;
  isFixtureDemo?: boolean;
  dataSource?: 'qbank' | 'fixture';
  fallbackNotice?: string | null;
  timeLimitMinutes: number;
  maxScore: number;
  passScore: number;
  hasPinyin: boolean;
  audioPlayback: number;
  createdAt: number;
  expiresAt: number;
  questions: ExamQuestionItem[]; // Immutable snapshot of full questions with answer_index and explanation_vi
  questionSetHash?: string;
  overlapMetrics?: ExamOverlapMetrics;
  submittedResult?: any;
  submissionId?: string;
}

// Map sessionId -> ActiveExamSession
const activeExamSessions = new Map<string, ActiveExamSession>();

// TTL: 24 hours
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Periodically purge expired sessions to prevent memory leaks
 */
function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of activeExamSessions.entries()) {
    if (session.expiresAt < now) {
      activeExamSessions.delete(id);
    }
  }
}

// Run prune every 15 minutes
setInterval(pruneExpiredSessions, 15 * 60 * 1000).unref();

/**
 * Helper to get active session count (for telemetry and test verification)
 */
export function getActiveSessionCount(): number {
  pruneExpiredSessions();
  return activeExamSessions.size;
}

/**
 * Helper to get a session by ID (internal or test use), falling back to persistent SQLite snapshot
 */
export function getSessionDirect(sessionId: string): ActiveExamSession | undefined {
  const mem = activeExamSessions.get(sessionId);
  if (mem) return mem;
  return loadSessionSnapshotFromDb(sessionId);
}

/**
 * Helper to clear sessions (for testing)
 */
export function clearAllSessionsForTesting(): void {
  activeExamSessions.clear();
}

/**
 * =========================================================================
 * Database Safeguards & In-Memory Isolation for Tests
 * =========================================================================
 */

export class DatabaseGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseGuardError';
  }
}

let explicitTestMode = false;
let qbankDbInstance: DatabaseSync | null = null;
let readOnlyDbInstance: DatabaseSync | null = null;

export function enableTestMode(enabled: boolean = true): void {
  explicitTestMode = enabled;
}

export function isTestEnv(): boolean {
  if (explicitTestMode) return true;
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') return true;
  if (process.env.VITEST_WORKER_ID !== undefined || process.env.JEST_WORKER_ID !== undefined) return true;
  if (typeof (globalThis as any).__vitest_worker__ !== 'undefined') return true;
  if (typeof (globalThis as any).describe === 'function' && typeof (globalThis as any).it === 'function') return true;
  if (Array.isArray(process.argv) && process.argv.some((arg) => /vitest|jest|mocha|\.test\.|\.spec\./i.test(arg))) {
    return true;
  }
  return false;
}

export function isOperationalDbPath(dbPath?: string): boolean {
  if (!dbPath || dbPath === ':memory:') return false;
  const normalized = path.resolve(process.cwd(), dbPath).toLowerCase().replace(/\\/g, '/');
  const operationalQBank = path.resolve(process.cwd(), 'data/qbank/qbank.db').toLowerCase().replace(/\\/g, '/');
  const operationalHsk = path.resolve(process.cwd(), 'data/hsk_exam.db').toLowerCase().replace(/\\/g, '/');
  return normalized === operationalQBank || normalized === operationalHsk;
}

export function assertSafeTestDb(dbPath?: string): void {
  const target = dbPath || process.env.QBANK_DB_PATH || 'data/qbank/qbank.db';
  if (isOperationalDbPath(target)) {
    throw new DatabaseGuardError(
      `[DatabaseGuard] Operational database write/mutation blocked: "${target}". ` +
      `Test suites and test environments must never use operational database for writes. ` +
      `Use an isolated in-memory database (":memory:") or temporary test DB.`
    );
  }
}

/**
 * Creates an isolated in-memory SQLite database for testing, with exam_sessions schema.
 * Optionally seeds approved questions & pool from operational DB in read-only mode.
 */
export function createTestExamDb(options?: { seedPool?: boolean }): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_sessions (
      session_id TEXT PRIMARY KEY,
      level INTEGER NOT NULL,
      mode TEXT NOT NULL,
      skill TEXT,
      part_type TEXT,
      session_json TEXT NOT NULL,
      score_result_json TEXT,
      submission_id TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_exam_sessions_expires ON exam_sessions(expires_at);
  `);

  if (options?.seedPool !== false) {
    const operationalPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    if (fs.existsSync(operationalPath)) {
      try {
        const readOnlyDb = new DatabaseSync(operationalPath, { readOnly: true });
        db.exec(`
          CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            stem TEXT NOT NULL,
            options TEXT NOT NULL,
            answer_idx INTEGER NOT NULL,
            pinyin TEXT,
            explanation_vi TEXT,
            level INTEGER NOT NULL,
            skill TEXT NOT NULL,
            part_type TEXT NOT NULL,
            illustration_theme TEXT,
            status TEXT NOT NULL DEFAULT 'approved',
            is_active INTEGER NOT NULL DEFAULT 1,
            topic TEXT,
            tested_vocab TEXT,
            passage TEXT
          );
          CREATE TABLE IF NOT EXISTS exam_eligible_pool (
            question_id TEXT PRIMARY KEY,
            level INTEGER NOT NULL,
            skill TEXT NOT NULL,
            part_type TEXT NOT NULL,
            stem TEXT NOT NULL,
            practice_eligible INTEGER NOT NULL DEFAULT 1,
            exam_eligible INTEGER NOT NULL DEFAULT 0,
            compatible_formats TEXT,
            ineligible_reasons TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        const questions = readOnlyDb.prepare('SELECT * FROM questions').all() as any[];
        const insertQ = db.prepare(`
          INSERT OR REPLACE INTO questions (
            id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, is_active, topic, tested_vocab, passage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const q of questions) {
          insertQ.run(
            q.id,
            q.stem,
            q.options,
            q.answer_idx,
            q.pinyin ?? null,
            q.explanation_vi ?? null,
            q.level,
            q.skill,
            q.part_type,
            q.illustration_theme ?? null,
            q.status ?? 'approved',
            q.is_active ?? 1,
            q.topic ?? null,
            q.tested_vocab ?? null,
            q.passage ?? null
          );
        }

        const poolRows = readOnlyDb.prepare('SELECT * FROM exam_eligible_pool').all() as any[];
        const insertP = db.prepare(`
          INSERT OR REPLACE INTO exam_eligible_pool (
            question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats, ineligible_reasons
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of poolRows) {
          insertP.run(
            p.question_id,
            p.level,
            p.skill,
            p.part_type,
            p.stem,
            p.practice_eligible ?? 1,
            p.exam_eligible ?? 0,
            p.compatible_formats ?? null,
            p.ineligible_reasons ?? null
          );
        }
        readOnlyDb.close();
      } catch (err) {
        console.warn('[createTestExamDb] Could not seed pool from operational DB:', err);
      }
    }
  }

  return db;
}

/**
 * Helper to inject or reset database instance for testing.
 * Enforces test environment mode and ensures passing null in test mode
 * does not inadvertently open and write to operational data/qbank/qbank.db.
 */
export function setExamDbForTesting(db: DatabaseSync | null): void {
  explicitTestMode = true;
  qbankDbInstance = db;
}

export function getExamDbForTesting(): DatabaseSync | null {
  return qbankDbInstance;
}

export function closeReadOnlyDbForTesting(): void {
  if (readOnlyDbInstance) {
    try {
      readOnlyDbInstance.close();
    } catch {}
    readOnlyDbInstance = null;
  }
}

function getQBankDb(): DatabaseSync | null {
  if (qbankDbInstance) {
    return qbankDbInstance;
  }

  const rawPath = process.env.QBANK_DB_PATH || 'data/qbank/qbank.db';
  if (rawPath === ':memory:') {
    qbankDbInstance = createTestExamDb({ seedPool: false });
    return qbankDbInstance;
  }

  // Guard rail: in test environment, abort immediately if target is operational DB
  if (isTestEnv() && isOperationalDbPath(rawPath)) {
    assertSafeTestDb(rawPath);
  }

  const dbPath = path.resolve(process.cwd(), rawPath);
  if (fs.existsSync(dbPath)) {
    try {
      qbankDbInstance = new DatabaseSync(dbPath);
      try {
        qbankDbInstance.exec('PRAGMA journal_mode = WAL;');
      qbankDbInstance.exec('PRAGMA synchronous = NORMAL;');
      qbankDbInstance.exec('PRAGMA cache_size = -64000;');
      qbankDbInstance.exec('PRAGMA temp_store = MEMORY;');
        qbankDbInstance.exec('PRAGMA busy_timeout = 5000;');
        qbankDbInstance.exec(`
          CREATE TABLE IF NOT EXISTS exam_sessions (
            session_id TEXT PRIMARY KEY,
            level INTEGER NOT NULL,
            mode TEXT NOT NULL,
            skill TEXT,
            part_type TEXT,
            session_json TEXT NOT NULL,
            score_result_json TEXT,
            submission_id TEXT,
            status TEXT NOT NULL DEFAULT 'in_progress',
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_exam_sessions_expires ON exam_sessions(expires_at);
        `);
      } catch {
        // ignore pragma or schema failure on read-only fs
      }
    } catch (err) {
      console.warn('[ExamRouter] Could not open database:', err);
      return null;
    }
  }
  return qbankDbInstance;
}

function getQBankDbReadOnly(): DatabaseSync | null {
  if (qbankDbInstance) {
    try {
      const check = qbankDbInstance.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='questions'").get();
      if (check) {
        return qbankDbInstance;
      }
    } catch {}
  }

  const rawPath = process.env.QBANK_DB_PATH && process.env.QBANK_DB_PATH !== ':memory:'
    ? process.env.QBANK_DB_PATH
    : 'data/qbank/qbank.db';
  const resolvedPath = path.resolve(process.cwd(), rawPath);

  if (!readOnlyDbInstance && fs.existsSync(resolvedPath)) {
    try {
      readOnlyDbInstance = new DatabaseSync(resolvedPath, { readOnly: true });
    } catch (err) {
      console.warn('[ExamRouter] Could not open database in read-only mode:', err);
      return null;
    }
  }
  return readOnlyDbInstance;
}

function saveSessionSnapshotToDb(session: ActiveExamSession): void {
  // Guard rail: if running in test environment and target is operational DB, abort & throw immediately
  if (isTestEnv()) {
    if (!qbankDbInstance) {
      assertSafeTestDb(process.env.QBANK_DB_PATH || 'data/qbank/qbank.db');
    }
  }

  const db = getQBankDb();
  if (!db) return;
  try {
    // Strict immutability: on conflict, preserve original exam_sessions.session_json snapshot,
    // only updating score_result_json, submission_id, and status upon exam submission.
    db.prepare(`
      INSERT INTO exam_sessions (
        session_id, level, mode, skill, part_type, session_json, score_result_json, submission_id, status, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        score_result_json = COALESCE(excluded.score_result_json, exam_sessions.score_result_json),
        submission_id = COALESCE(excluded.submission_id, exam_sessions.submission_id),
        status = excluded.status
    `).run(
      session.sessionId,
      session.level,
      session.mode,
      session.skill || 'all',
      session.part_type || null,
      JSON.stringify(session),
      session.submittedResult ? JSON.stringify(session.submittedResult) : null,
      session.submissionId || null,
      session.submittedResult ? 'submitted' : 'in_progress',
      session.createdAt,
      session.expiresAt
    );
  } catch (err) {
    if (err instanceof DatabaseGuardError) throw err;
    // Best-effort persistence
  }
}

/**
 * Counts how many times each question ID has appeared in recent sessions for a level & mode
 * so exam assembly can prefer unused/less-used questions first.
 */
export function getRecentSessionQuestionUsageCounts(
  level: number,
  mode: 'mock' | 'practice' = 'mock'
): Map<string, number> {
  const usage = new Map<string, number>();
  const seenSessions = new Set<string>();

  for (const s of activeExamSessions.values()) {
    if (s.level === level && s.mode === mode && Array.isArray(s.questions)) {
      seenSessions.add(s.sessionId);
      for (const q of s.questions) {
        if (q?.id) usage.set(q.id, (usage.get(q.id) || 0) + 1);
      }
    }
  }

  const db = getQBankDbReadOnly();
  if (db) {
    try {
      const rows: any[] = db
        .prepare(
          'SELECT session_id, session_json FROM exam_sessions WHERE level = ? AND mode = ? ORDER BY created_at DESC LIMIT 50'
        )
        .all(level, mode);
      for (const row of rows) {
        if (!row?.session_id || seenSessions.has(String(row.session_id))) continue;
        seenSessions.add(String(row.session_id));
        try {
          const parsed = JSON.parse(row.session_json);
          if (Array.isArray(parsed?.questions)) {
            for (const q of parsed.questions) {
              if (q?.id) usage.set(q.id, (usage.get(q.id) || 0) + 1);
            }
          }
        } catch {}
      }
    } catch {}
  }

  return usage;
}

/**
 * Computes deterministic question-set hash and overlap ratio against previously generated sessions
 * so identical question sets are never falsely claimed as independent unique exams.
 */
export function computeExamOverlapMetrics(
  level: number,
  mode: 'mock' | 'practice',
  questions: HSKExamQuestion[],
  currentSessionId?: string
): ExamOverlapMetrics {
  const ids = questions.map((q) => String(q.id)).filter(Boolean);
  const sortedIds = [...ids].sort();
  const questionSetHash = crypto.createHash('sha256').update(sortedIds.join('|')).digest('hex');

  if (ids.length === 0) {
    return {
      questionSetHash,
      maxOverlapRatio: 0,
      overlappingQuestionCount: 0,
      isDuplicateQuestionSet: false,
      comparedSessionId: null,
    };
  }

  const idSet = new Set(ids);
  let maxOverlapRatio = 0;
  let maxOverlapCount = 0;
  let isDuplicateQuestionSet = false;
  let comparedSessionId: string | null = null;
  const checkedSessions = new Set<string>();

  const evaluateCandidateSession = (candId: string, candQuestions: any[]) => {
    if (!candId || candId === currentSessionId || checkedSessions.has(candId)) return;
    checkedSessions.add(candId);
    if (!Array.isArray(candQuestions) || candQuestions.length === 0) return;

    const candIds = candQuestions.map((q) => String(q?.id || '')).filter(Boolean);
    if (candIds.length === 0) return;

    let overlapCount = 0;
    for (const cid of candIds) {
      if (idSet.has(cid)) overlapCount++;
    }
    const denom = Math.max(ids.length, candIds.length, 1);
    const ratio = Number((overlapCount / denom).toFixed(4));
    const candSortedHash = crypto.createHash('sha256').update([...candIds].sort().join('|')).digest('hex');
    const exactMatch = candSortedHash === questionSetHash;

    if (exactMatch || ratio > maxOverlapRatio) {
      maxOverlapRatio = exactMatch ? 1 : ratio;
      maxOverlapCount = overlapCount;
      comparedSessionId = candId;
      if (exactMatch) {
        isDuplicateQuestionSet = true;
      }
    }
  };

  for (const s of activeExamSessions.values()) {
    if (s.level === level && s.mode === mode) {
      evaluateCandidateSession(s.sessionId, s.questions);
    }
  }

  const db = getQBankDbReadOnly();
  if (db) {
    try {
      const rows: any[] = db
        .prepare(
          'SELECT session_id, session_json FROM exam_sessions WHERE level = ? AND mode = ? ORDER BY created_at DESC LIMIT 50'
        )
        .all(level, mode);
      for (const row of rows) {
        if (!row?.session_id || !row?.session_json) continue;
        try {
          const parsed = JSON.parse(row.session_json);
          evaluateCandidateSession(String(row.session_id), parsed?.questions || []);
        } catch {}
      }
    } catch {}
  }

  return {
    questionSetHash,
    maxOverlapRatio,
    overlappingQuestionCount: maxOverlapCount,
    isDuplicateQuestionSet,
    comparedSessionId,
  };
}

function loadSessionSnapshotFromDb(sessionId: string): ActiveExamSession | undefined {
  const db = qbankDbInstance || getQBankDbReadOnly();
  if (!db) return undefined;
  try {
    const row: any = db.prepare('SELECT session_json, score_result_json, submission_id, expires_at FROM exam_sessions WHERE session_id = ?').get(sessionId);
    if (!row || !row.session_json) return undefined;
    if (Number(row.expires_at) < Date.now()) return undefined;
    const parsed: ActiveExamSession = JSON.parse(row.session_json);
    if (row.score_result_json && !parsed.submittedResult) {
      try {
        parsed.submittedResult = JSON.parse(row.score_result_json);
      } catch {}
    }
    if (row.submission_id) {
      parsed.submissionId = row.submission_id;
    }
    activeExamSessions.set(sessionId, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Loads approved active questions from data/qbank/qbank.db for a given level (strictly HSK 1–6)
 */
export function loadApprovedQuestionsFromDb(
  level: number,
  options?: {
    mode?: 'mock' | 'practice';
    skill?: string;
    part_type?: string;
    topic?: string;
    vocab?: string;
  },
  dbInstance?: any
): ExamQuestionItem[] {
  if (level < 1 || level > 6) return [];
  const db = dbInstance || getQBankDbReadOnly();
  if (!db) return [];

  const mode = options?.mode;
  const filterSkill = typeof options?.skill === 'string' && options.skill.trim().toLowerCase() !== 'all'
    ? options.skill.trim().toLowerCase()
    : undefined;
  const filterPartType = typeof options?.part_type === 'string' && options.part_type.trim()
    ? options.part_type.trim().toLowerCase()
    : undefined;
  const filterTopic = typeof options?.topic === 'string' && options.topic.trim()
    ? options.topic.trim().toLowerCase()
    : undefined;
  const filterVocab = typeof options?.vocab === 'string' && options.vocab.trim()
    ? options.vocab.trim()
    : undefined;

  try {
    // 1. Primary source: questions joined with exam_eligible_pool (strict status='approved' AND is_active=1)
    const stmt = db.prepare(`
      SELECT 
        q.*,
        COALESCE(q.is_active, 1) as is_active,
        COALESCE(p.exam_eligible, 0) as exam_eligible, 
        COALESCE(p.practice_eligible, 1) as practice_eligible, 
        p.compatible_formats
      FROM questions q
      LEFT JOIN exam_eligible_pool p ON q.id = p.question_id
      WHERE q.level = ? AND q.status = 'approved' AND COALESCE(q.is_active, 1) = 1
      ORDER BY q.rowid ASC
    `);
    let rows: any[] = stmt.all(level);

    // 2. Fallback: If table questions returns 0 rows, fallback to qb_questions
    if (rows.length === 0) {
      try {
        const fallbackStmt = db.prepare(
          `SELECT * FROM qb_questions WHERE level = ? AND status = 'approved' AND COALESCE(is_active, 1) = 1 ORDER BY rowid ASC`
        );
        rows = fallbackStmt.all(level);
      } catch {
        rows = [];
      }
    }

    // Strict invariant: exclude pending, rejected, and disabled questions.
    // Enforce practice_eligible in practice mode, and exam_eligible === 1 in mock mode.
    rows = rows.filter((row) => {
      const isApproved = String(row.status || '').toLowerCase() === 'approved';
      const isActive = Number(row.is_active ?? 1) === 1;
      if (!isApproved || !isActive) return false;

      // Fail-closed quality validation check:
      // If quality status is tracked on the row (quality_validation_status or quality_status exists),
      // only strict 'PASS' is eligible for serving.
      // 'FAIL', 'REVIEW', 'UNKNOWN', or missing/null/empty when quality column is present must be blocked.
      const hasQualityCol = 'quality_validation_status' in row || 'quality_status' in row;
      if (hasQualityCol) {
        const rawQuality = row.quality_validation_status ?? row.quality_status;
        if (!rawQuality || String(rawQuality).trim().toUpperCase() !== 'PASS') {
          return false;
        }
      }

      if (mode === 'practice') {
        const practiceEligible =
          row.practice_eligible === undefined || row.practice_eligible === null
            ? 1
            : Number(row.practice_eligible);
        if (practiceEligible !== 1) return false;
      } else if (mode === 'mock') {
        const examEligible = Number(row.exam_eligible ?? 0);
        if (examEligible !== 1) return false;
      }
      return true;
    });

    if (filterTopic) {
      rows = rows.filter((row) => String(row.topic || '').toLowerCase().includes(filterTopic));
    }

    if (filterVocab) {
      rows = rows.filter((row) => {
        const tv = String(row.tested_vocab || row.vocab_tags || '');
        const st = String(row.stem || '');
        const op = String(row.options || '');
        return tv.includes(filterVocab) || st.includes(filterVocab) || op.includes(filterVocab);
      });
    }

    const mapped = rows.map((row, idx) => {
      let optionsArr: string[] = [];
      try {
        if (typeof row.options === 'string') {
          optionsArr = JSON.parse(row.options);
        } else if (Array.isArray(row.options)) {
          optionsArr = row.options;
        }
      } catch {
        optionsArr = [];
      }
      if (!Array.isArray(optionsArr)) optionsArr = [];
      let optionImages: string[] = [];
      try {
        optionImages = typeof row.options_images === 'string' ? JSON.parse(row.options_images) : (row.options_images || []);
      } catch {
        optionImages = [];
      }
      if (!Array.isArray(optionImages)) optionImages = [];

      const rawSection = (row.section || row.skill || 'reading').toLowerCase();
      const validSection = (rawSection === 'listening' || rawSection === 'reading' || rawSection === 'writing')
        ? rawSection
        : 'reading';

      const answerIdx = typeof row.answer_index === 'number'
        ? row.answer_index
        : (typeof row.answer_idx === 'number' ? row.answer_idx : 0);

      const passageVal = typeof row.passage === 'string' && row.passage.trim().length > 0
        ? row.passage.trim()
        : undefined;

      let compatibleFormatsArr: string[] = [];
      try {
        if (typeof row.compatible_formats === 'string') {
          compatibleFormatsArr = JSON.parse(row.compatible_formats);
        } else if (Array.isArray(row.compatible_formats)) {
          compatibleFormatsArr = row.compatible_formats;
        }
      } catch {
        compatibleFormatsArr = [];
      }
      if (!Array.isArray(compatibleFormatsArr)) compatibleFormatsArr = [];

      return {
        id: row.id || row.question_id || `qbank-approved-${row.level || level}-${idx + 1}`,
        level: Number(row.level) || level,
        section: validSection as 'listening' | 'reading' | 'writing',
        part_type: row.part_type || 'read_comprehension_short_3opt',
        item_number: idx + 1,
        stem: row.stem || '',
        pinyin_stem: row.pinyin_stem || row.pinyin || '',
        options: optionsArr,
        options_images: optionImages,
        answer_index: answerIdx,
        explanation_vi: row.explanation_vi || 'Đáp án chính xác theo ngân hàng đề thi HSK chuẩn.',
        audio_text: row.audio_text || (validSection === 'listening' ? row.stem : undefined),
        audio_url: row.audio_url || undefined,
        illustration: row.illustration || row.illustration_theme || row.media_url || undefined,
        audio_playback: level <= 3 ? 2 : 1,
        passage: passageVal,
        compatible_formats: compatibleFormatsArr,
      };
    });

    let filtered = mapped;
    if (filterSkill) {
      filtered = filtered.filter((q) => q.section.toLowerCase() === filterSkill);
    }
    if (filterPartType) {
      filtered = filtered.filter((q) => {
        if (q.part_type.toLowerCase() === filterPartType) return true;
        if (Array.isArray(q.compatible_formats)) {
          return q.compatible_formats.some(
            (fmt) => typeof fmt === 'string' && fmt.toLowerCase() === filterPartType
          );
        }
        return false;
      });
    }

    return filtered;
  } catch (err) {
    console.warn('[ExamRouter] Error reading approved questions from qbank.db:', err);
    return [];
  }
}

/**
 * Assembles a full official mock exam strictly from approved, exam-eligible database questions
 * according to the official level blueprint.
 * Preserves shared-passage groups (HSK 5-6) as atomic units.
 */
export function assembleBlueprintExamFromDb(
  level: number,
  approvedDbQuestions: ExamQuestionItem[],
  db: DatabaseSync,
  excludeQuestionIds: Set<string> = new Set()
): { questions: ExamQuestionItem[]; isComplete: boolean; shortageDetails?: any } {
  const bpData = loadBlueprintData(level);
  if (!bpData || !bpData.sections) {
    return { questions: [], isComplete: false };
  }

  const inspection = inspectExamPoolBySections(db, level, excludeQuestionIds);
  if (!inspection.isFullyEligible) {
    return { questions: [], isComplete: false, shortageDetails: inspection };
  }

  const usedIds = new Set<string>(excludeQuestionIds);
  const finalQuestions: ExamQuestionItem[] = [];
  const usageMap = getRecentSessionQuestionUsageCounts(level, 'mock');

  // Prefer least-recently-used candidate questions across generated sessions while preserving order within passage groups
  const sortedCandidates = [...approvedDbQuestions].sort(
    (a, b) => (usageMap.get(a.id) || 0) - (usageMap.get(b.id) || 0)
  );

  // Group candidate questions by passage for shared-passage integrity (HSK 5-6)
  const passageGroups = new Map<string, ExamQuestionItem[]>();
  for (const q of approvedDbQuestions) {
    if (q.passage && q.passage.trim().length > 0) {
      const key = `${q.level}:${q.section}:${q.passage.trim()}`;
      if (!passageGroups.has(key)) {
        passageGroups.set(key, []);
      }
      passageGroups.get(key)!.push(q);
    }
  }

  // Sort passage groups by average prior usage so fresh passages are chosen first when surplus groups exist
  const sortedPassageGroupEntries = Array.from(passageGroups.entries()).sort(([, groupA], [, groupB]) => {
    const usageA = groupA.reduce((acc, q) => acc + (usageMap.get(q.id) || 0), 0) / Math.max(1, groupA.length);
    const usageB = groupB.reduce((acc, q) => acc + (usageMap.get(q.id) || 0), 0) / Math.max(1, groupB.length);
    return usageA - usageB;
  });

  for (const [secKey, secData] of Object.entries<any>(bpData.sections)) {
    const secSkill = (secData.skill || secKey).toLowerCase();
    if (!secData.parts) continue;

    for (const [pKey, pVal] of Object.entries<any>(secData.parts)) {
      const pRequired = Number(pVal.n_questions) || 0;
      const pType = pVal.type || pKey;
      let partCollected = 0;

      // 1. Try to fulfill using complete shared-passage groups if questions in this part use passages
      for (const [groupKey, groupQuestions] of sortedPassageGroupEntries) {
        if (partCollected >= pRequired) break;
        if (!groupKey.startsWith(`${level}:${secSkill}:`)) continue;

        const unusedInGroup = groupQuestions.filter(
          (q) =>
            !usedIds.has(q.id) &&
            (q.part_type === pType ||
              (Array.isArray(q.compatible_formats) && q.compatible_formats.includes(pType)) ||
              isCompatiblePartType(pType, q.part_type) ||
              (pType.includes('comprehension') && q.part_type.includes('comprehension')))
        );
        if (unusedInGroup.length > 0 && unusedInGroup.length === groupQuestions.length) {
          if (partCollected + unusedInGroup.length <= pRequired) {
            for (const q of unusedInGroup) {
              usedIds.add(q.id);
              finalQuestions.push({
                ...q,
                item_number: finalQuestions.length + 1,
                section: secSkill as 'listening' | 'reading' | 'writing',
              });
              partCollected++;
            }
          }
        }
      }

      // 2. Fulfill remaining slots with individual eligible questions (preferring least-recently-used)
      if (partCollected < pRequired) {
        const candidates = sortedCandidates.filter((q) => {
          if (usedIds.has(q.id)) return false;
          if (q.section.toLowerCase() !== secSkill) return false;
          if (q.part_type === pType) return true;
          if (Array.isArray(q.compatible_formats) && q.compatible_formats.includes(pType)) return true;
          if (isCompatiblePartType(pType, q.part_type)) return true;
          if (q.part_type.includes('picture_match') && pType.includes('picture_match')) return true;
          if (q.part_type.includes('comprehension') && pType.includes('comprehension')) return true;
          if (q.part_type.includes('fill_blank') && pType.includes('fill_blank')) return true;
          return false;
        });

        for (const candidate of candidates) {
          if (partCollected >= pRequired) break;
          // Do not break a shared-passage group by taking an isolated sub-question
          if (candidate.passage && candidate.passage.trim().length > 0) {
            const groupKey = `${level}:${secSkill}:${candidate.passage.trim()}`;
            const group = passageGroups.get(groupKey);
            if (group && group.length > 1 && group.some((gq) => !usedIds.has(gq.id) && gq.id !== candidate.id)) {
              continue;
            }
          }

          usedIds.add(candidate.id);
          finalQuestions.push({
            ...candidate,
            item_number: finalQuestions.length + 1,
            section: secSkill as 'listening' | 'reading' | 'writing',
          });
          partCollected++;
        }
      }
    }
  }

  const isComplete = finalQuestions.length >= inspection.totalRequired;
  return { questions: finalQuestions, isComplete, shortageDetails: inspection };
}

/**
 * Sanitizes question for student client by stripping answer and explanation (Phase 8.4 R3 & Phase 8.6 R1 anti-cheat)
 */
export function stripAnswerFromQuestion(q: HSKExamQuestion): Omit<HSKExamQuestion, 'answer_index' | 'answer_idx' | 'explanation_vi'> {
  const { answer_index, answer_idx, explanation_vi, explanation, ...safeQuestion } = q as any;
  return safeQuestion;
}

// =========================================================================
// 1. GET /api/exam/blueprints
// Returns summary metadata for HSK 1..5 blueprints
// =========================================================================
examRouter.get('/blueprints', (_req: Request, res: Response) => {
  try {
    const blueprints: Record<number, HSKBlueprintSummary> = {};

    for (let lvl = 1; lvl <= 6; lvl++) {
      const blueprintFilePath = path.resolve(process.cwd(), `data/qbank/blueprint/level${lvl}.json`);
      if (fs.existsSync(blueprintFilePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(blueprintFilePath, 'utf-8'));
          blueprints[lvl] = {
            level: content.level || lvl,
            name: content.name || `HSK ${lvl} 考试大纲与试卷结构`,
            total_questions: content.total_questions || 40,
            time_limit_minutes: content.total_time_min || 40,
            max_score: content.max_score || (lvl === 1 ? 200 : 300),
            pass_score: content.passing_score || (lvl === 1 ? 120 : 180),
            has_pinyin: Boolean(content.has_pinyin),
            audio_playback: content.audio_playback || (lvl <= 3 ? 2 : 1),
            sections: content.sections || {},
            verification: content.verification,
          };
          continue;
        } catch {
          // Fall back to embedded summaries
        }
      }

      // Default fallback from embedded constants
      blueprints[lvl] = HSK_BLUEPRINT_SUMMARIES[lvl] || HSK_BLUEPRINT_SUMMARIES[1];
    }

    return res.json({
      success: true,
      blueprints,
    });
  } catch (err: any) {
    console.error('[ExamRouter] Error fetching blueprints:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể tải thông tin cấu trúc đề thi HSK.',
    });
  }
});

// =========================================================================
// 2. GET /api/exam/practice & /api/exam/practice-questions
// Retrieves practice questions by level, skill, part_type, topic, vocab, count (unmasked, 0 LLM calls)
// NOTE (Phase 8.4 R5 Audit): This endpoint returns canonical unmasked questions without
// session snapshot backing. As mandated by Requirement R5, we do NOT shuffle answers here
// to prevent answer desynchronization. Practice shuffling is strictly session-bound via POST /api/exam/generate-mock.
// =========================================================================
examRouter.get(['/practice', '/practice-questions'], (req: Request, res: Response) => {
  try {
    const rawLevel = parseInt(req.query.level as string, 10);
    const level = isNaN(rawLevel) || rawLevel < 1 || rawLevel > 6 ? 1 : rawLevel;
    const rawSkill = typeof req.query.skill === 'string' && req.query.skill.trim()
      ? req.query.skill.trim().toLowerCase()
      : undefined;
    const skill = rawSkill && rawSkill !== 'all'
      ? (rawSkill as 'listening' | 'reading' | 'writing')
      : undefined;
    const part_type = typeof req.query.part_type === 'string' && req.query.part_type.trim()
      ? req.query.part_type.trim()
      : undefined;
    const topic = typeof req.query.topic === 'string' && req.query.topic.trim()
      ? req.query.topic.trim()
      : undefined;
    const vocab = typeof req.query.vocab === 'string' && req.query.vocab.trim()
      ? req.query.vocab.trim()
      : undefined;
    const rawCount = parseInt(req.query.count as string, 10);
    const count = !isNaN(rawCount) && rawCount > 0 ? rawCount : 10;
    const isStrict =
      req.query.strict === 'true' ||
      req.query.strict === '1' ||
      req.query.strictQbankOnly === 'true' ||
      req.query.strictQbankOnly === '1' ||
      process.env.PRACTICE_STRICT_DB_ONLY === 'true';

    const approvedDb = loadApprovedQuestionsFromDb(level, { mode: 'practice', skill, part_type, topic, vocab });
    let combined = [...approvedDb];
    if (skill) {
      combined = combined.filter((q) => q.section?.toLowerCase() === skill);
    }
    if (part_type) {
      combined = combined.filter((q) => q.part_type?.toLowerCase() === part_type.toLowerCase());
    }

    const dbMatchedCount = combined.length;
    let usingFixtureFallback = false;

    if (!isStrict) {
      if (dbMatchedCount === 0) {
        usingFixtureFallback = true;
      }

      const allFixtures = getPracticeQuestions(level, skill, part_type, 999);
      for (const fq of allFixtures) {
        if (combined.length >= count) break;
        const isDuplicate = combined.some(
          (q) => q.id === fq.id || (q.stem === fq.stem && (Array.isArray(q.options) ? q.options.join('|') : '') === (Array.isArray(fq.options) ? fq.options.join('|') : ''))
        );
        if (!isDuplicate) {
          combined.push(fq);
        }
      }
    }

    let questions = combined.slice(0, count);

    // STRICT PURITY ENFORCEMENT: Never borrow questions from other skills
    if (skill) {
      questions = questions.filter((q) => q.section?.toLowerCase() === skill);
    }

    // Ensure strictly sequential item numbers 1..N and strip answers/explanations (anti-leak / anti-cheat)
    const finalQuestions = questions.map((q, idx) => ({
      ...stripAnswerFromQuestion(q),
      item_number: idx + 1,
    }));

    const actualCount = finalQuestions.length;
    const isShortage = actualCount < count;

    return res.json({
      success: true,
      llmCallsMade: 0,
      count: actualCount,
      requestedCount: count,
      actualCount,
      dbMatchedCount,
      usingFixtureFallback,
      fallbackNotice: usingFixtureFallback
        ? 'Đang hiển thị bộ câu hỏi mẫu dự phòng do kho câu hỏi chính thức của nhóm này đang được cập nhật.'
        : null,
      isShortage,
      skill: skill || 'all',
      level,
      questions: finalQuestions,
      sessionId: null,
      sessionRequiredForScoring: true,
      antiCheatProtected: true,
    });
  } catch (err: any) {
    console.error('[ExamRouter] Error fetching practice questions:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể tải câu hỏi luyện tập.',
    });
  }
});

/**
 * Strict boolean parser that prevents falsey-string bypass vulnerabilities.
 * "false", "0", false, 0, null, undefined, "" are strictly false.
 * Only true, 1, "true", "1" are strictly true.
 */
export function isTruthy(val: unknown): boolean {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === '1';
  }
  return false;
}

// =========================================================================
// 3. POST /api/exam/generate-mock
// Assembles mock exam or practice session according to official blueprint (0 LLM calls)
// =========================================================================
examRouter.post('/generate-mock', (req: Request, res: Response) => {
  try {
    pruneExpiredSessions();

    const body = req.body || {};
    const rawMode = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : '';
    const mode: 'mock' | 'practice' = rawMode === 'practice' ? 'practice' : 'mock';
    const strictQbankOnly = Boolean(
      body.strictQbankOnly ||
      body.strict_qbank_only ||
      body.strict ||
      req.query.strict === 'true' ||
      req.query.strict === '1' ||
      req.query.strictQbankOnly === 'true' ||
      req.query.strictQbankOnly === '1' ||
      process.env.PRACTICE_STRICT_DB_ONLY === 'true'
    );
    const rawLevel = parseInt(body.level, 10);
    if (isNaN(rawLevel) || rawLevel < 1 || rawLevel > 6) {
      if (strictQbankOnly && mode === 'practice') {
        const sessionId = `practice_boundary_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        return res.status(200).json({
          success: true,
          sessionId,
          llmCallsMade: 0,
          session: {
            sessionId,
            mode: 'practice',
            level: rawLevel || 1,
            questions: [],
            totalQuestions: 0,
            actualCount: 0,
            isShortage: true,
            strictQbankOnly: true,
          },
          questions: [],
          actualCount: 0,
          isShortage: true,
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Cấp độ HSK không hợp lệ (yêu cầu từ 1 đến 6).',
      });
    }
    const level = rawLevel;
    const isExplicitFixtureRequest =
      isTruthy(body.allowFixtures) ||
      isTruthy(body.allow_fixtures) ||
      isTruthy(body.isFixtureDemo) ||
      rawMode === 'fixture_demo';
    const rawSkill = typeof body.skill === 'string' && body.skill.trim() ? body.skill.trim().toLowerCase() : undefined;
    const skill: string | undefined = rawSkill && rawSkill !== 'all' ? rawSkill : undefined;
    const part_type: string | undefined = typeof body.part_type === 'string' && body.part_type.trim() ? body.part_type.trim() : undefined;
    const topic: string | undefined = typeof body.topic === 'string' && body.topic.trim() ? body.topic.trim() : undefined;
    const vocab: string | undefined = typeof body.vocab === 'string' && body.vocab.trim() ? body.vocab.trim() : undefined;
    const excludeQuestionIds = new Set<string>(Array.isArray(body.excludeQuestionIds) ? body.excludeQuestionIds.map(String) : []);
    const requestedCount = parseInt(body.count, 10);
    const loadedBp = loadBlueprintData(level);
    const bp: HSKBlueprintSummary = loadedBp
      ? {
          level: loadedBp.level || level,
          name: loadedBp.name || `HSK ${level} 考试大纲与试卷结构`,
          total_questions: loadedBp.total_questions || (level === 6 ? 82 : 40),
          time_limit_minutes: loadedBp.total_time_min || (level === 6 ? 125 : 40),
          max_score: loadedBp.max_score || (level === 1 ? 200 : 300),
          pass_score: loadedBp.passing_score || (level === 1 ? 120 : 180),
          has_pinyin: Boolean(loadedBp.has_pinyin),
          audio_playback: loadedBp.audio_playback || (level <= 3 ? 2 : 1),
          sections: loadedBp.sections || {},
          verification: loadedBp.verification,
        }
      : (HSK_BLUEPRINT_SUMMARIES[level] || HSK_BLUEPRINT_SUMMARIES[1]);

    let questions: HSKExamQuestion[] = [];
    let usingFixtureFallback = false;
    let isFixtureDemo = false;

    if (mode === 'practice') {
      const targetCount = !isNaN(requestedCount) && requestedCount > 0 ? requestedCount : 10;

      const approvedDb = loadApprovedQuestionsFromDb(level, { mode: 'practice', skill, part_type, topic, vocab })
        .filter((q) => !excludeQuestionIds.has(q.id));
      let combined = [...approvedDb];
      if (skill) {
        combined = combined.filter((q) => q.section?.toLowerCase() === skill);
      }
      if (part_type) {
        combined = combined.filter((q) => q.part_type?.toLowerCase() === part_type.toLowerCase());
      }

      if (!strictQbankOnly) {
        if (combined.length === 0) {
          usingFixtureFallback = true;
        }

        const allFixtures = getPracticeQuestions(level, skill, part_type, 999);
        for (const fq of allFixtures) {
          if (combined.length >= targetCount) break;
          const isDuplicate = combined.some(
            (q) => q.id === fq.id || (q.stem === fq.stem && (Array.isArray(q.options) ? q.options.join('|') : '') === (Array.isArray(fq.options) ? fq.options.join('|') : ''))
          );
          if (!isDuplicate) {
            combined.push(fq);
          }
        }
      }

      questions = combined.slice(0, targetCount);

      // STRICT PURITY ENFORCEMENT: Never borrow questions from other skills
      if (skill) {
        questions = questions.filter((q) => q.section?.toLowerCase() === skill);
      }

      // Phase 8.4 R3: In-memory answer shuffle for session-based practice
      const shuffleEnabled =
        isServingAnswerShuffleEnabled() ||
        isTruthy(body.shuffle) ||
        isTruthy(body.shuffleAnswers) ||
        isTruthy(body.enableShuffle);
      if (shuffleEnabled) {
        questions = questions.map((q) => {
          const qClone = JSON.parse(JSON.stringify(q));
          const guard = canShuffle(qClone);
          if (!guard.canShuffle) {
            return {
              ...qClone,
              shuffled: false,
              shuffle_reason: guard.reason,
            };
          }
          const shuffled = shuffleQuestionAnswers(qClone);
          return {
            ...qClone,
            options: shuffled.question.options,
            answer_index: shuffled.question.answer_index,
            answer_idx: shuffled.question.answer_idx,
            explanation_vi: shuffled.question.explanation_vi,
            shuffled: true,
          };
        });
      } else {
        questions = questions.map((q) => ({
          ...q,
          shuffled: false,
        }));
      }
    } else {
      // Mock Exam Mode: Full Official Blueprint Exam
      if (isExplicitFixtureRequest) {
        // Fixture Demo Mode: Allowed ONLY when explicitly requested by client
        usingFixtureFallback = true;
        isFixtureDemo = true;
        questions = getMockExamQuestions(level);
      } else {
        // Official Mock Exam Mode: Strict Blueprint Enforcement (NO silent fallback, NO fixture mixing)
        const db = qbankDbInstance || getQBankDbReadOnly();
        if (!db) {
          return res.status(503).json({
            success: false,
            error: 'Không thể kết nối cơ sở dữ liệu ngân hàng câu hỏi.',
          });
        }

        const inspection = inspectExamPoolBySections(db, level, excludeQuestionIds);
        if (!inspection.isFullyEligible) {
          return res.status(400).json({
            success: false,
            mode: 'mock',
            level,
            is_fully_eligible: false,
            total_required: inspection.totalRequired,
            total_available: inspection.totalAvailable,
            total_missing: inspection.totalMissing,
            sections: inspection.sections,
            error: `Kho câu hỏi HSK ${level} chưa đủ điều kiện tạo đề thi chính thức: còn thiếu ${inspection.totalMissing} câu theo chuẩn blueprint.`,
          });
        }

        // Fetch exam_eligible approved questions and assemble strictly from DB
        const approvedDbQuestions = loadApprovedQuestionsFromDb(level, { mode: 'mock' }).filter((q) => !excludeQuestionIds.has(q.id));
        const assembly = assembleBlueprintExamFromDb(level, approvedDbQuestions, db, excludeQuestionIds);

        if (!assembly.isComplete || assembly.questions.length < inspection.totalRequired) {
          const missing = inspection.totalRequired - assembly.questions.length;
          return res.status(400).json({
            success: false,
            mode: 'mock',
            level,
            is_fully_eligible: false,
            total_required: inspection.totalRequired,
            total_available: assembly.questions.length,
            total_missing: missing,
            sections: inspection.sections,
            error: `Kho câu hỏi HSK ${level} chưa đủ điều kiện tạo đề thi chính thức: còn thiếu ${missing} câu theo chuẩn blueprint.`,
          });
        }

        questions = assembly.questions;
        usingFixtureFallback = false;
        isFixtureDemo = false;
      }
    }

    // Ensure strictly sequential item numbers 1..N & deep-clone snapshot so DB mutations never affect in-progress sessions
    const finalQuestions: HSKExamQuestion[] = JSON.parse(
      JSON.stringify(
        questions.map((q, idx) => ({
          ...q,
          item_number: idx + 1,
        }))
      )
    );

    // Create session & compute cross-exam overlap / deduplication telemetry
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const actualCount = finalQuestions.length;
    const overlapMetrics = computeExamOverlapMetrics(level, mode, finalQuestions, sessionId);
    const strictUniqueExam = isTruthy(body.strictUniqueExam) || isTruthy(body.rejectDuplicateExam);

    if (strictUniqueExam && overlapMetrics.isDuplicateQuestionSet && finalQuestions.length > 0) {
      return res.status(409).json({
        success: false,
        mode,
        level,
        isDuplicateQuestionSet: true,
        questionSetHash: overlapMetrics.questionSetHash,
        overlapMetrics,
        error: `Bộ câu hỏi đề thi HSK ${level} trùng lặp 100% với một phiên thi đã tạo trước đó (${overlapMetrics.comparedSessionId}). Hệ thống từ chối công nhận là đề thi độc lập mới.`,
      });
    }

    const isShortage = mode === 'mock'
      ? actualCount < bp.total_questions
      : (!isNaN(requestedCount) && requestedCount > 0 ? actualCount < requestedCount : actualCount < 10);
    const effRequestedCount = mode === 'practice'
      ? (!isNaN(requestedCount) && requestedCount > 0 ? requestedCount : 10)
      : bp.total_questions;
    const dataSource: 'qbank' | 'fixture' = usingFixtureFallback ? 'fixture' : 'qbank';
    const fallbackNotice = usingFixtureFallback
      ? (isFixtureDemo
          ? 'Đề thi mẫu demo (Fixtures) cho mục đích minh họa giao diện. Không phải đề thi từ kho câu hỏi chính thức.'
          : 'Đang sử dụng bộ câu hỏi chuẩn dự phòng do kho câu hỏi chính thức của phần này đang được bổ sung.')
      : null;

    const session: ActiveExamSession = {
      sessionId,
      level,
      mode,
      skill: skill || 'all',
      part_type,
      totalQuestions: actualCount,
      requestedCount: effRequestedCount,
      actualCount,
      isShortage,
      usingFixtureFallback,
      isFixtureDemo,
      dataSource,
      fallbackNotice,
      timeLimitMinutes: mode === 'mock' ? bp.time_limit_minutes : 0,
      maxScore: mode === 'mock' ? bp.max_score : finalQuestions.length * 5,
      passScore: mode === 'mock' ? bp.pass_score : Math.round(finalQuestions.length * 5 * 0.6),
      hasPinyin: bp.has_pinyin,
      audioPlayback: bp.audio_playback,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
      questions: finalQuestions,
      questionSetHash: overlapMetrics.questionSetHash,
      overlapMetrics,
    };

    activeExamSessions.set(sessionId, session);
    saveSessionSnapshotToDb(session);

    // Client-safe questions (anti-cheat: answer_index and explanation_vi stripped)
    const clientQuestions = finalQuestions.map(stripAnswerFromQuestion);

    return res.json({
      success: true,
      sessionId: session.sessionId,
      questions: clientQuestions,
      totalQuestions: session.totalQuestions,
      dataSource,
      usingFixtureFallback,
      isFixtureDemo,
      llmCallsMade: 0,
      requestedCount: session.requestedCount,
      actualCount: session.actualCount,
      isShortage: session.isShortage,
      fallbackNotice,
      questionSetHash: overlapMetrics.questionSetHash,
      isDuplicateQuestionSet: overlapMetrics.isDuplicateQuestionSet,
      overlapMetrics,
      skill: session.skill,
      level: session.level,
      mode: session.mode,
      session: {
        sessionId: session.sessionId,
        level: session.level,
        mode: session.mode,
        dataSource,
        usingFixtureFallback,
        isFixtureDemo,
        skill: session.skill,
        part_type: session.part_type,
        totalQuestions: session.totalQuestions,
        requestedCount: session.requestedCount,
        actualCount: session.actualCount,
        isShortage: session.isShortage,
        fallbackNotice,
        questionSetHash: overlapMetrics.questionSetHash,
        isDuplicateQuestionSet: overlapMetrics.isDuplicateQuestionSet,
        overlapMetrics,
        timeLimitMinutes: session.timeLimitMinutes,
        maxScore: session.maxScore,
        passScore: session.passScore,
        hasPinyin: session.hasPinyin,
        audioPlayback: session.audioPlayback,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        questions: clientQuestions,
      },
    });
  } catch (err: any) {
    if (err instanceof DatabaseGuardError) throw err;
    console.error('[ExamRouter] Error generating exam session:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo phòng thi thử HSK.',
    });
  }
});

// =========================================================================
// 3. GET /api/exam/session/:sessionId
// Retrieves active exam session from immutable snapshot without exposing answers
// =========================================================================
examRouter.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    pruneExpiredSessions();
    const sessionId = req.params.sessionId;

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Mã phiên làm bài không hợp lệ.',
      });
    }

    const session = getSessionDirect(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Phiên làm bài thi không tồn tại hoặc đã hết hạn.',
      });
    }

    // Anti-cheat: strip answers
    const clientQuestions = session.questions.map(stripAnswerFromQuestion);

    return res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        level: session.level,
        mode: session.mode,
        skill: session.skill,
        part_type: session.part_type,
        totalQuestions: session.totalQuestions,
        requestedCount: session.requestedCount,
        actualCount: session.actualCount,
        isShortage: session.isShortage,
        usingFixtureFallback: session.usingFixtureFallback,
        fallbackNotice: session.fallbackNotice,
        timeLimitMinutes: session.timeLimitMinutes,
        maxScore: session.maxScore,
        passScore: session.passScore,
        hasPinyin: session.hasPinyin,
        audioPlayback: session.audioPlayback,
        questions: clientQuestions,
      },
    });
  } catch (err: any) {
    console.error('[ExamRouter] Error retrieving session:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi truy vấn phiên làm bài.',
    });
  }
});

// =========================================================================
// 4. POST /api/exam/check-answer
// For Practice Mode: Instant answer validation & rich Vietnamese explanation
// Phase 8.4 R4: Strict Session-Bound Scoring (No cross-session loop, no fixture/raw DB fallback)
// =========================================================================
examRouter.post('/check-answer', (req: Request, res: Response) => {
  try {
    const { questionId, userAnswer, sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required for check-answer',
        code: 'SESSION_REQUIRED',
      });
    }

    if (!questionId || (typeof userAnswer !== 'number' && typeof userAnswer !== 'string')) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu mã câu hỏi (questionId) hoặc câu trả lời (userAnswer).',
        code: 'INVALID_INPUT',
      });
    }

    const session = getSessionDirect(String(sessionId));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired',
        code: 'SESSION_NOT_FOUND',
      });
    }

    const foundQuestion = session.questions?.find((item) => item.id === questionId);
    if (!foundQuestion) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy câu hỏi trong phiên thi (Question not found in session)',
        code: 'QUESTION_NOT_IN_SESSION',
      });
    }

    const isWritingTask =
      foundQuestion.section === 'writing' &&
      (!foundQuestion.options || foundQuestion.options.length === 0 || /^write_/i.test(foundQuestion.part_type || ''));
    let isCorrect = false;
    let numericAnswer: number | null = null;
    if (typeof userAnswer === 'number') {
      numericAnswer = userAnswer;
    } else if (typeof userAnswer === 'string') {
      const trimmed = userAnswer.trim().toUpperCase();
      if (/^[A-Z]$/.test(trimmed)) {
        numericAnswer = trimmed.charCodeAt(0) - 65;
      } else if (/^\d+$/.test(trimmed)) {
        numericAnswer = parseInt(trimmed, 10);
      }
    }

    if (isWritingTask) {
      isCorrect =
        typeof userAnswer === 'string'
          ? userAnswer.trim().length > 0
          : typeof userAnswer === 'number' && userAnswer >= 0;
    } else {
      isCorrect =
        (numericAnswer !== null && foundQuestion.answer_index === numericAnswer) ||
        foundQuestion.answer_index === userAnswer;
    }

    const safeIdx =
      typeof foundQuestion.answer_index === 'number' && foundQuestion.answer_index >= 0
        ? foundQuestion.answer_index
        : 0;
    const letter = String.fromCharCode(65 + safeIdx);
    const rawOption = Array.isArray(foundQuestion.options) && foundQuestion.options.length > safeIdx
      ? foundQuestion.options[safeIdx] || ''
      : '';
    const cleanOption = rawOption.replace(/^[A-Z][.:\s]\s*/i, '').trim();
    const correctAnswerText = isWritingTask
      ? (foundQuestion.explanation_vi || 'Xem bài viết mẫu tham khảo')
      : cleanOption ? `${letter}. ${cleanOption}` : rawOption.trim() || letter;

    return res.json({
      success: true,
      isCorrect,
      correctAnswer: foundQuestion.answer_index,
      correctAnswerText,
      explanation_vi: foundQuestion.explanation_vi || '',
    });
  } catch (err: any) {
    console.error('[ExamRouter] Error checking answer:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể kiểm tra đáp án.',
    });
  }
});

// =========================================================================
// 5. POST /api/exam/submit
// Scores submitted exam from immutable session snapshot, supports idempotent retry, and returns full review
// =========================================================================
examRouter.post('/submit', (req: Request, res: Response) => {
  try {
    const { sessionId, level: reqLevel, answers: reqAnswers, userAnswers: reqUserAnswers, timeSpentSeconds = 0 } = req.body || {};
    const answers = (reqAnswers && typeof reqAnswers === 'object' && Object.keys(reqAnswers).length > 0)
      ? reqAnswers
      : (reqUserAnswers && typeof reqUserAnswers === 'object')
      ? reqUserAnswers
      : (reqAnswers || {});

    const session = sessionId ? getSessionDirect(String(sessionId)) : undefined;

    // Idempotent retry check: if this session was already submitted, return the exact stored scoreResult without duplicate records
    if (session && session.submittedResult) {
      return res.json({
        success: true,
        submissionId: session.submissionId,
        isRetryIdempotent: true,
        scoreResult: session.submittedResult,
      });
    }

    const level = session ? session.level : (parseInt(reqLevel, 10) || 1);
    const loadedBp = loadBlueprintData(level);
    const bp: HSKBlueprintSummary = loadedBp
      ? {
          level: loadedBp.level || level,
          name: loadedBp.name || `HSK ${level} 考试大纲与试卷结构`,
          total_questions: loadedBp.total_questions || (level === 6 ? 82 : 40),
          time_limit_minutes: loadedBp.total_time_min || (level === 6 ? 125 : 40),
          max_score: loadedBp.max_score || (level === 1 ? 200 : 300),
          pass_score: loadedBp.passing_score || (level === 1 ? 120 : 180),
          has_pinyin: Boolean(loadedBp.has_pinyin),
          audio_playback: loadedBp.audio_playback || (level <= 3 ? 2 : 1),
          sections: loadedBp.sections || {},
          verification: loadedBp.verification,
        }
      : (HSK_BLUEPRINT_SUMMARIES[level] || HSK_BLUEPRINT_SUMMARIES[1]);

    let questions: HSKExamQuestion[] = [];
    if (session && session.questions.length > 0) {
      questions = session.questions;
    } else {
      questions = getMockExamQuestions(level);
    }

    // Categorize by sections (listening, reading, writing)
    const sectionCategories: ('listening' | 'reading' | 'writing')[] =
      level === 1 ? ['listening', 'reading'] : ['listening', 'reading', 'writing'];

    const sectionScores: Record<
      string,
      { score: number; maxScore: number; correct: number; total: number; percentage: number }
    > = {};

    let totalScore = 0;
    const maxScore = session && session.maxScore > 0 ? session.maxScore : bp.max_score;
    const passScore = session && session.passScore > 0 ? session.passScore : bp.pass_score; // 120 for HSK 1; 180 for HSK 2-6

    for (const sec of sectionCategories) {
      const secQuestions = questions.filter(q => q.section === sec);
      const secTotal = secQuestions.length;
      let secCorrect = 0;

      for (const q of secQuestions) {
        const studentAns = answers[q.id];
        const isWritingTask = q.section === 'writing' && (!q.options || q.options.length === 0 || /^write_/i.test(q.part_type || ''));
        if (isWritingTask) {
          // Open-ended writing tasks do not coerce to answer_index integer
          if (typeof studentAns === 'string' && studentAns.trim().length > 0) {
            secCorrect++;
          } else if (typeof studentAns === 'number' && studentAns >= 0) {
            secCorrect++;
          }
        } else {
          let numAns: number | null = null;
          if (typeof studentAns === 'number') {
            numAns = studentAns;
          } else if (typeof studentAns === 'string') {
            const tr = studentAns.trim().toUpperCase();
            if (/^[A-Z]$/.test(tr)) numAns = tr.charCodeAt(0) - 65;
            else if (/^\d+$/.test(tr)) numAns = parseInt(tr, 10);
          }
          if ((numAns !== null && numAns === q.answer_index) || studentAns === q.answer_index) {
            secCorrect++;
          }
        }
      }

      const secWeight = bp.sections[sec]?.score_weight || 100;
      const secScore = secTotal > 0 ? Math.round((secCorrect / secTotal) * secWeight) : 0;
      const secPercentage = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 0;

      sectionScores[sec] = {
        score: secScore,
        maxScore: secWeight,
        correct: secCorrect,
        total: secTotal,
        percentage: secPercentage,
      };

      totalScore += secScore;
    }

    // Normalization safeguard so totalScore never exceeds maxScore
    totalScore = Math.min(totalScore, maxScore);

    const passed = totalScore >= passScore;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Build comprehensive detailed review
    const detailedReview = questions.map(q => {
      const studentAns = answers[q.id];
      const isWritingTask = q.section === 'writing' && (!q.options || q.options.length === 0 || /^write_/i.test(q.part_type || ''));
      let isCorrect = false;
      let userAnswer: any = -1;

      if (isWritingTask) {
        userAnswer = studentAns !== undefined ? studentAns : '';
        isCorrect = typeof studentAns === 'string'
          ? studentAns.trim().length > 0
          : (typeof studentAns === 'number' && studentAns >= 0);
      } else {
        let numAns: number | null = null;
        if (typeof studentAns === 'number') {
          numAns = studentAns;
        } else if (typeof studentAns === 'string') {
          const tr = studentAns.trim().toUpperCase();
          if (/^[A-Z]$/.test(tr)) numAns = tr.charCodeAt(0) - 65;
          else if (/^\d+$/.test(tr)) numAns = parseInt(tr, 10);
        }
        userAnswer = numAns !== null ? numAns : (studentAns !== undefined ? studentAns : -1);
        isCorrect = (numAns !== null && numAns === q.answer_index) || studentAns === q.answer_index;
      }

      return {
        id: q.id,
        item_number: q.item_number,
        stem: q.stem,
        pinyin_stem: q.pinyin_stem,
        options: q.options,
        options_images: q.options_images,
        userAnswer,
        correctAnswer: q.answer_index,
        isCorrect,
        explanation_vi: q.explanation_vi,
        section: q.section,
        part_type: q.part_type,
        audio_text: q.audio_text,
        illustration: q.illustration,
        passage: (q as any).passage,
      };
    });

    const submissionId = sessionId ? `sub_${sessionId}` : `sub_${crypto.randomUUID()}`;
    const scoreResult = {
      submissionId,
      totalScore,
      maxScore,
      passScore,
      percentage,
      passed,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      sectionScores,
      detailedReview,
      review: detailedReview,
    };

    if (session) {
      session.submittedResult = scoreResult;
      session.submissionId = submissionId;
      saveSessionSnapshotToDb(session);
    }

    return res.json({
      success: true,
      submissionId,
      isRetryIdempotent: false,
      scoreResult,
    });
  } catch (err: any) {
    if (err instanceof DatabaseGuardError) throw err;
    console.error('[ExamRouter] Error scoring exam:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể chấm điểm và tổng kết bài thi.',
    });
  }
});

// =========================================================================
// 6. POST /api/exam/evaluate-writing
// Evaluates candidate's open-ended writing response against CTI HSK rubric
// =========================================================================
examRouter.post('/evaluate-writing', (req: Request, res: Response) => {
  try {
    const { questionId, essayText, level: reqLevel, part_type, sessionId, keywords: reqKeywords, stem: reqStem, maxScore: reqMaxScore } = req.body || {};
    const text = typeof essayText === 'string' ? essayText.trim() : '';
    const level = parseInt(reqLevel, 10) || 5;
    const partType = String(part_type || '').toLowerCase();

    // 1. Determine target length from partType hint, with level-based fallback
    let targetCharCount = 80;
    const partMatch = /(?:_)?(\d+)(?:chars|words)/i.exec(partType);
    if (partMatch) {
      targetCharCount = parseInt(partMatch[1], 10);
    } else if (partType.includes('sentence_from_picture') || partType.includes('picture_word')) {
      targetCharCount = 20;
    } else if (level === 4) {
      targetCharCount = 25;
    } else if (level === 5) {
      targetCharCount = 80;
    } else if (level === 6) {
      targetCharCount = 400;
    }

    // 2. Determine maxScore from request, partType, or level fallback
    let maxScore = 30;
    if (typeof reqMaxScore === 'number' && reqMaxScore > 0) {
      maxScore = reqMaxScore;
    } else if (level === 6) {
      maxScore = 100;
    } else if (level === 5) {
      maxScore = targetCharCount >= 200 ? 60 : targetCharCount >= 100 ? 40 : 30;
    } else if (level === 4) {
      maxScore = targetCharCount >= 80 ? 30 : 15;
    }

    // 3. Count Chinese characters (Hanzi)
    const hanziMatches = text.match(/[\u4e00-\u9fa5]/g) || [];
    const charCount = hanziMatches.length;

    // 4. Extract target keywords (from request, stem, active session, or database)
    let targetKeywords: string[] = [];
    if (Array.isArray(reqKeywords)) {
      targetKeywords = reqKeywords.map((k) => String(k).trim()).filter(Boolean);
    } else if (typeof reqKeywords === 'string' && reqKeywords.trim()) {
      targetKeywords = reqKeywords.split(/[,，、\s]+/).map((k) => k.trim()).filter(Boolean);
    } else {
      let stem = typeof reqStem === 'string' ? reqStem : '';
      let testedVocab = '';

      if (!stem && questionId) {
        if (sessionId) {
          const session = getSessionDirect(String(sessionId));
          const q = session?.questions?.find((item) => item.id === questionId);
          if (q) {
            stem = q.stem || '';
            testedVocab = (q as any).tested_vocab || '';
          }
        }
        if (!stem) {
          try {
            const db = getQBankDb();
            if (db) {
              const row: any = db.prepare('SELECT stem, tested_vocab FROM questions WHERE id = ?').get(questionId);
              if (row) {
                stem = row.stem || '';
                testedVocab = row.tested_vocab || '';
              }
            }
          } catch {}
        }
      }

      if (stem) {
        const kwMatch = stem.match(/\[(.*?)\]|【(.*?)】/);
        if (kwMatch) {
          const raw = kwMatch[1] || kwMatch[2] || '';
          targetKeywords = raw.split(/[,，、\s]+/).map((k) => k.trim()).filter(Boolean);
        } else {
          const colonMatch = stem.match(/(?:词语|词|关键词)[：:]([\u4e00-\u9fa5、\s,，]+)/);
          if (colonMatch) {
            targetKeywords = colonMatch[1].split(/[,，、\s]+/).map((k) => k.trim()).filter(Boolean);
          }
        }
      }
      if (targetKeywords.length === 0 && testedVocab) {
        targetKeywords = testedVocab.split(/[,，|、\s]+/).map((k) => k.trim()).filter(Boolean);
      }
    }

    // 5. Match keywords used vs missing
    const keywordsUsed = targetKeywords.filter((kw) => text.includes(kw));
    const keywordsMissing = targetKeywords.filter((kw) => !text.includes(kw));

    // Rubric max points (ensuring exact mathematical sum === maxScore)
    const maxLengthPoints = Math.round(maxScore * 0.3);
    const maxGrammarPoints = Math.round(maxScore * 0.3);
    const maxRelevancePoints = maxScore - maxLengthPoints - maxGrammarPoints;

    // 6. Handle empty text submission
    if (!text || charCount === 0) {
      return res.json({
        success: true,
        score: 0,
        maxScore,
        charCount: 0,
        targetCharCount,
        keywordsUsed: [],
        keywordsMissing: targetKeywords,
        feedbackVi: 'Thí sinh chưa nhập nội dung bài viết bằng chữ Hán.',
        rubricCriteria: [
          {
            name: 'Độ dài bài viết (Length)',
            maxPoints: maxLengthPoints,
            awardedPoints: 0,
            note: 'Chưa đạt độ dài tối thiểu',
          },
          {
            name: 'Ngữ pháp & Cấu trúc câu (Grammar)',
            maxPoints: maxGrammarPoints,
            awardedPoints: 0,
            note: 'Chưa có nội dung',
          },
          {
            name: 'Từ vựng & Bám sát chủ đề (Vocabulary & Relevance)',
            maxPoints: maxRelevancePoints,
            awardedPoints: 0,
            note: 'Chưa có từ vựng',
          },
        ],
      });
    }

    // 7. Punctuation & Sentence structure analysis
    const punctuationMatches = text.match(/[。！？；，、：]/g) || [];
    const sentenceEndings = text.match(/[。！？]/g) || [];
    const sentenceCount = Math.max(1, sentenceEndings.length);

    const CONNECTORS = [
      '因为', '所以', '不但', '而且', '虽然', '但是', '然而', '不仅',
      '此外', '另外', '因此', '由于', '只要', '只有', '无论', '如果',
      '要是', '首先', '其次', '最后', '总之', '一方面', '另一方面',
    ];
    const connectorsUsed = CONNECTORS.filter((c) => text.includes(c));

    // 8. Rubric Scoring Calculations
    // Criterion 1: Length (30%)
    const lengthRatio = Math.min(1.2, charCount / targetCharCount);
    let lengthPoints = 0;
    let lengthNote = '';

    if (charCount >= targetCharCount) {
      lengthPoints = maxLengthPoints;
      lengthNote = 'Đạt chuẩn số lượng chữ';
    } else if (charCount >= targetCharCount * 0.8) {
      lengthPoints = Math.round(maxLengthPoints * 0.85);
      lengthNote = `Đạt ${charCount}/${targetCharCount} chữ (gần đủ độ dài yêu cầu)`;
    } else if (charCount >= targetCharCount * 0.5) {
      lengthPoints = Math.round(maxLengthPoints * 0.6);
      lengthNote = `Đạt ${charCount}/${targetCharCount} chữ (dung lượng còn thiếu)`;
    } else {
      lengthPoints = Math.round(maxLengthPoints * Math.min(1.0, charCount / targetCharCount));
      lengthNote = `Đạt ${charCount}/${targetCharCount} chữ`;
    }
    lengthPoints = Math.min(maxLengthPoints, Math.max(0, lengthPoints));

    // Criterion 2: Grammar & Sentence Structure (30%)
    let grammarRatio = 0.5 + Math.min(0.5, charCount / (targetCharCount * 0.8));
    let grammarNote = 'Cấu trúc câu hoàn chỉnh, logic diễn đạt mạch lạc';

    if (charCount >= 25 && punctuationMatches.length === 0) {
      grammarRatio *= 0.6;
      grammarNote = 'Thiếu dấu ngắt câu tiếng Trung chuẩn xác (。！？，)';
    } else if (connectorsUsed.length > 0) {
      grammarRatio = Math.min(1.0, grammarRatio + 0.1);
      grammarNote = `Cấu trúc câu hoàn chỉnh (${sentenceCount} câu), có liên từ kết nối ("${connectorsUsed.slice(0, 2).join('", "')}")`;
    }
    let grammarPoints = Math.round(Math.min(1.0, grammarRatio) * maxGrammarPoints);
    grammarPoints = Math.min(maxGrammarPoints, Math.max(0, grammarPoints));

    // Criterion 3: Vocabulary & Relevance (Remainder ~40%)
    let relevancePoints = 0;
    let relevanceNote = 'Bám sát ngữ cảnh đề tài và yêu cầu diễn đạt';

    if (targetKeywords.length > 0) {
      const kwRatio = keywordsUsed.length / targetKeywords.length;
      const relRatio = (kwRatio * 0.6) + (Math.min(1.0, lengthRatio) * 0.4);
      relevancePoints = Math.round(relRatio * maxRelevancePoints);
      if (keywordsMissing.length === 0) {
        relevanceNote = `Sử dụng đầy đủ ${keywordsUsed.length}/${targetKeywords.length} từ khóa bắt buộc`;
      } else {
        relevanceNote = `Đạt ${keywordsUsed.length}/${targetKeywords.length} từ khóa (thiếu: ${keywordsMissing.join(', ')})`;
      }
    } else {
      relevancePoints = Math.round(
        maxRelevancePoints * (lengthRatio >= 0.8 ? 0.9 : lengthRatio >= 0.5 ? 0.7 : 0.4)
      );
    }
    relevancePoints = Math.min(maxRelevancePoints, Math.max(0, relevancePoints));

    const totalScore = Math.min(maxScore, Math.max(0, lengthPoints + grammarPoints + relevancePoints));

    // 9. Generate Pedagogical Vietnamese Diagnostic Feedback
    let feedbackVi = `Bài viết đạt ${charCount}/${targetCharCount} chữ Hán (${Math.round((charCount / targetCharCount) * 100)}%). `;
    if (charCount >= targetCharCount) {
      feedbackVi += 'Đạt yêu cầu về dung lượng chữ theo barem chuẩn CTI. ';
    } else if (charCount >= targetCharCount * 0.7) {
      feedbackVi += 'Dung lượng hơi ngắn so với tiêu chuẩn, nên bổ sung thêm 1–2 câu mở rộng ý và liên từ. ';
    } else {
      feedbackVi += 'Dung lượng chưa đạt tiêu chuẩn quy định, cần chú ý phân bổ thời gian viết dài hơn. ';
    }

    if (targetKeywords.length > 0) {
      if (keywordsMissing.length === 0) {
        feedbackVi += `Đã kết hợp chính xác toàn bộ từ khóa bắt buộc (${keywordsUsed.join(', ')}). `;
      } else {
        feedbackVi += `Lưu ý: Chưa sử dụng các từ khóa bắt buộc: ${keywordsMissing.join(', ')}. `;
      }
    }

    if (connectorsUsed.length > 0) {
      feedbackVi += `Diễn đạt mạch lạc, sử dụng hiệu quả liên từ (${connectorsUsed.slice(0, 3).join(', ')}).`;
    } else if (punctuationMatches.length === 0 && charCount >= 25) {
      feedbackVi += 'Cần bổ sung dấu câu chuẩn tiếng Trung (như dấu chấm 。, dấu phẩy ，) để bài viết phân đoạn rõ ràng.';
    } else {
      feedbackVi += 'Cấu trúc ngữ pháp cơ bản mạch lạc.';
    }

    return res.json({
      success: true,
      score: totalScore,
      maxScore,
      charCount,
      targetCharCount,
      keywordsUsed,
      keywordsMissing,
      feedbackVi,
      rubricCriteria: [
        {
          name: 'Độ dài bài viết (Length)',
          maxPoints: maxLengthPoints,
          awardedPoints: lengthPoints,
          note: lengthNote,
        },
        {
          name: 'Ngữ pháp & Cấu trúc câu (Grammar)',
          maxPoints: maxGrammarPoints,
          awardedPoints: grammarPoints,
          note: grammarNote,
        },
        {
          name: 'Từ vựng & Bám sát đề tài (Relevance)',
          maxPoints: maxRelevancePoints,
          awardedPoints: relevancePoints,
          note: relevanceNote,
        },
      ],
    });
  } catch (err: any) {
    console.error('[ExamRouter] Error evaluating writing:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể đánh giá bài viết.',
    });
  }
});

