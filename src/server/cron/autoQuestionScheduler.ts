import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { pinyin as getPinyinPro } from 'pinyin-pro';
import { generateAccuratePinyin } from '../../utils/pinyinEngine.js';
import { getQBankDbPath } from '../dbPaths.js';
import { generateWaterfallQuestions, classifyLLMError } from '../llm/waterfallGenerator.js';
import { validateCandidate, loadExistingStemsFromDb, computeContentHash, isVisualQuestionType } from '../llm/questionValidator.js';
import { isOpenEndedWritingTask, isValidIllustrationTheme, inferThemeFromText, normalizeDialogueSpeakers } from '../llm/promptTemplates.js';
import { CandidateQuestion } from '../llm/types.js';
import {
  getPriorityDeficitGroup,
  planBatchVocab,
  verifyQuestionVocab,
  computeNearDuplicateSignature,
  applyAdditiveQBankMigrations,
  HskLevel,
} from '../qbankCoverageEngine.js';
import {
  ensureEligiblePoolSchema,
  createPersistentTask,
  completePersistentTask,
  failPersistentTask,
  releaseStaleTasks,
  acquireGenerationLock,
  recoverStartupStaleTasks,
} from '../qbankFormatSync.js';

export type SchedulerPreferredProvider = 'auto' | 'ollama' | 'gemini' | 'groq' | 'deepseek';

export interface SchedulerConfig {
  enabled: boolean;
  intervalHours: number;
  batchSize: number;
  maxQuestionsPerDay: number;
  unlimitedDaily?: boolean;
  preferredProvider?: SchedulerPreferredProvider;
  freeOnly: boolean;
  targetLevel: number;
  maxCallsPerTask?: number;
  maxDurationMs?: number;
}

export interface SchedulerStatus {
  enabled: boolean;
  isRunning: boolean;
  running?: boolean;
  lastRunTime: string | null;
  nextRunTime: string | null;
  generatedToday: number;
  maxQuestionsPerDay: number;
  unlimitedDaily?: boolean;
  preferredProvider?: SchedulerPreferredProvider;
  intervalHours: number;
  batchSize: number;
  targetLevel: number;
  lastBatchId: string | null;
  lastError: string | null;
  activeTaskId?: string | null;
}

const getDbPath = getQBankDbPath;
let timerHandle: NodeJS.Timeout | null = null;
let lastRunTimestamp: string | null = null;
let scheduledNextRunTimestamp: string | null = null;
let lastBatchId: string | null = null;
let lastJobError: string | null = null;
let isRunningInMemory: boolean = false;

function normalizePreferredProvider(raw?: string | null): SchedulerPreferredProvider {
  const val = (raw || 'auto').toLowerCase().trim();
  if (val === 'ollama' || val === 'gemini' || val === 'groq' || val === 'deepseek') {
    return val;
  }
  return 'auto';
}

export function getSchedulerConfig(): SchedulerConfig {
  const enabled = (process.env.ENABLE_AUTO_QUESTION_GENERATION || 'false').toLowerCase().trim() === 'true';
  const preferredProvider = normalizePreferredProvider(process.env.QUESTION_GENERATION_PREFERRED_PROVIDER);
  const rawInterval = parseFloat(process.env.QUESTION_GENERATION_INTERVAL_HOURS || '2');
  const intervalHours = Math.max(0.016, isNaN(rawInterval) ? 2 : rawInterval);
  const rawBatchSize = parseInt(process.env.QUESTION_GENERATION_BATCH_SIZE || '3', 10);
  const batchSize = Math.max(1, Math.min(50, isNaN(rawBatchSize) ? 3 : rawBatchSize));

  const rawMaxEnv = process.env.QUESTION_GENERATION_MAX_QUESTIONS_PER_DAY;
  const parsedMax = rawMaxEnv !== undefined ? parseInt(rawMaxEnv, 10) : 20;
  const explicitUnlimited =
    (process.env.QUESTION_GENERATION_UNLIMITED_DAILY || '').toLowerCase().trim() === 'true' ||
    (!isNaN(parsedMax) && parsedMax <= 0);
  const unlimitedDaily = explicitUnlimited || preferredProvider === 'ollama';
  const maxQuestionsPerDay = unlimitedDaily
    ? 0
    : Math.max(5, isNaN(parsedMax) ? 20 : parsedMax);

  const freeOnly = (process.env.QBANK_LLM_FREE_ONLY || 'true').toLowerCase().trim() !== 'false';
  const targetLevel = Math.max(0, Math.min(6, parseInt(process.env.QUESTION_GENERATION_TARGET_LEVEL || '0', 10)));
  const maxCallsPerTask = Math.max(1, parseInt(process.env.QBANK_MAX_CALLS_PER_TASK || '10', 10));
  const maxDurationMs = Math.max(5000, parseInt(process.env.QBANK_MAX_DURATION_MS || '60000', 10));

  return {
    enabled,
    intervalHours,
    batchSize,
    maxQuestionsPerDay,
    unlimitedDaily,
    preferredProvider,
    freeOnly,
    targetLevel,
    maxCallsPerTask,
    maxDurationMs,
  };
}

export function getQuestionsGeneratedToday(db: DatabaseSync): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row: any = db.prepare(
      `SELECT COUNT(*) as cnt FROM pending_questions WHERE date(created_at) = date(?)`
    ).get(today);
    return Number(row?.cnt || 0);
  } catch {
    return 0;
  }
}

/**
 * Executes a single scheduled generation batch with deterministic deficit prioritization,
 * SQLite qbank_tasks concurrency locking, stale recovery, and partial batch accounting.
 */
export async function runScheduledBatch(
  force: boolean = false,
  options: {
    mock?: boolean;
    batchSizeOverride?: number;
    targetLevelOverride?: number;
    preferredProviderOverride?: SchedulerPreferredProvider;
    unlimitedDailyOverride?: boolean;
    maxCallsPerTask?: number;
    maxDurationMs?: number;
    db?: DatabaseSync;
  } = {}
): Promise<{
  success: boolean;
  batchId?: string;
  savedCount: number;
  requestedCount?: number;
  remainingDeficit?: number;
  deficitRetained?: number;
  targetGroup?: { level: number; skill: string; part_type: string };
  error?: string;
  errorCategory?: string;
  details?: any;
}> {
  const config = getSchedulerConfig();
  if (!config.enabled && !force) {
    console.log('[Scheduler] Auto question generation is disabled.');
    return { success: false, savedCount: 0, error: 'Scheduler is disabled' };
  }

  const effectiveProvider: SchedulerPreferredProvider =
    options.preferredProviderOverride || config.preferredProvider || 'auto';
  const isUnlimited =
    options.unlimitedDailyOverride === true ||
    effectiveProvider === 'ollama' ||
    config.unlimitedDaily === true ||
    config.maxQuestionsPerDay <= 0;

  let db: DatabaseSync | null = options.db || null;
  let shouldCloseDb = false;
  let taskId: string | null = null;
  const maxDurationMs =
    options.maxDurationMs ||
    (effectiveProvider === 'ollama'
      ? Math.max(config.maxDurationMs || 60000, 180000)
      : config.maxDurationMs || 60000);

  try {
    isRunningInMemory = true;
    if (!db) {
      const dbPath = getDbPath();
      const normalizedPath = path.resolve(dbPath).replace(/\\/g, '/');
      const isOperationalDb = normalizedPath.endsWith('/data/qbank/qbank.db');
      const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
      const isNonProd = process.env.NODE_ENV !== 'production';
      const allowOperationalWrite = process.env.ALLOW_OPERATIONAL_CRON_WRITE === 'true';

      if (isOperationalDb && (isTestEnv || (isNonProd && !allowOperationalWrite))) {
        console.warn(`[Scheduler] Refusing to execute scheduled batch against operational database ${dbPath} in non-production environment (${process.env.NODE_ENV || 'development'}).`);
        return {
          success: false,
          savedCount: 0,
          error: 'Scheduler refused to mutate operational database in non-production environment',
        };
      }

      if (!fs.existsSync(dbPath)) {
        throw new Error(`Database not found at ${dbPath}`);
      }
      db = new DatabaseSync(dbPath);
      shouldCloseDb = true;
    }

    ensureEligiblePoolSchema(db);
    applyAdditiveQBankMigrations(db);

    db.exec(`
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
    `);

    // 1. Concurrency Lock & Stale Task Recovery via atomic acquireGenerationLock
    const timestampStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const batchId = `sched_${timestampStr}_${randomSuffix}`;
    taskId = `task_${batchId}`;
    lastBatchId = batchId;
    lastRunTimestamp = new Date().toISOString();
    lastJobError = null;

    const payloadHash = crypto.createHash('sha256').update(batchId).digest('hex');

    const lockRes = acquireGenerationLock(db, {
      taskType: 'auto_question_scheduler',
      idempotencyKey: taskId,
      payloadHash,
      maxDurationMs,
    });

    if (!lockRes.acquired) {
      console.log(`[Scheduler] Another scheduler job is currently running (${lockRes.activeTask?.idempotency_key}). Skipping.`);
      return { success: false, savedCount: 0, error: 'Job already in progress (qbank_tasks lock)', details: lockRes.activeTask };
    }

    // 2. Daily quota check (bypassed when running in Local GPU / Ollama mode or when unlimitedDaily / maxQuestionsPerDay <= 0)
    const generatedToday = getQuestionsGeneratedToday(db);
    if (!isUnlimited && generatedToday >= config.maxQuestionsPerDay) {
      failPersistentTask(db, taskId, 'Daily question generation quota reached');
      console.log(`[Scheduler] Daily quota limit reached (${generatedToday}/${config.maxQuestionsPerDay}). Halting.`);
      return { success: false, savedCount: 0, error: 'Daily question generation quota reached' };
    }

    // 3. Deterministic Deficit Target Selection via qbankCoverageEngine
    const effectiveTargetLevel = options.targetLevelOverride !== undefined
      ? options.targetLevelOverride
      : config.targetLevel;

    // Check if the most recent run for this level ended in a partial state with remaining deficit to resume
    let deficitGroup: { level: number; skill: string; part_type: string; deficit: number } | null = null;
    try {
      const latestRun: any = db.prepare(`
        SELECT status, details FROM generation_runs
        WHERE level = ?
        ORDER BY created_at DESC LIMIT 1
      `).get(effectiveTargetLevel > 0 ? effectiveTargetLevel : 1);
      if (latestRun?.status === 'partial' && latestRun?.details) {
        const parsed = JSON.parse(latestRun.details);
        if (parsed.remainingDeficit > 0 && parsed.part_type) {
          deficitGroup = {
            level: parsed.level || effectiveTargetLevel || 1,
            skill: parsed.skill || 'listening',
            part_type: parsed.part_type,
            deficit: parsed.remainingDeficit,
          };
        }
      }
    } catch {}

    if (!deficitGroup) {
      deficitGroup = getPriorityDeficitGroup(
        db,
        undefined,
        effectiveTargetLevel > 0 ? effectiveTargetLevel : undefined
      );
    }

    if (!deficitGroup) {
      completePersistentTask(db, taskId, { message: 'All coverage targets and blueprint quotas met' });
      console.log('[Scheduler] All coverage targets and blueprint quotas are met! No deficit group found.');
      return {
        success: true,
        savedCount: 0,
        details: { message: 'All coverage targets and blueprint quotas met' },
      };
    }

    const level = deficitGroup.level as HskLevel;
    const skill = deficitGroup.skill as 'listening' | 'reading' | 'writing';
    const part_type = deficitGroup.part_type;
    const batchSize = Math.max(1, options.batchSizeOverride || config.batchSize);

    // 4. Pre-Generation Vocabulary Planning (60% Tier 0/1, 25% Tier 2, 15% Review)
    const plannedVocab = planBatchVocab(level, batchSize, db);

    const difficultyTier = level >= 5 ? 'tier2_very_difficult' : (level >= 3 ? 'tier1_difficult' : undefined);
    const trapType = (part_type === 'listen_dialogue_qa_4opt' || part_type === 'listen_talks_qa_4opt')
      ? 'anti_verbatim'
      : (part_type === 'read_comprehension_4opt' ? (level >= 5 ? 'anti_verbatim' : 'context_scope') : undefined);

    console.log(`[Scheduler] Starting batch ${batchId} for HSK ${level} ${skill} [${part_type}] (Count: ${batchSize}, Provider: ${effectiveProvider}, UnlimitedDaily: ${isUnlimited}, Tier: ${difficultyTier || 'default'}, Trap: ${trapType || 'default'}). Deficit: ${deficitGroup.deficit}`);

    // 7. Call Multi-LLM Waterfall Generator
    let waterfallResult;
    try {
      waterfallResult = await generateWaterfallQuestions({
        level,
        skill,
        part_type,
        count: batchSize,
        batchSize,
        targetVocabs: plannedVocab.targets,
        difficulty_tier: difficultyTier,
        trap_type: trapType,
        preferredProvider: effectiveProvider !== 'auto' ? effectiveProvider : undefined,
        mock: options.mock,
        maxCallsPerTask: options.maxCallsPerTask || config.maxCallsPerTask,
        maxDurationMs,
      });
    } catch (llmErr: any) {
      const classified = classifyLLMError(llmErr);
      const errorCategory = llmErr.category || classified.category || 'transient_error';
      failPersistentTask(db, taskId, `${errorCategory}: ${llmErr.message}`);

      // Record failure audit in generation_runs
      try {
        db.prepare(`
          INSERT INTO generation_runs (
            id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
          ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'none', 'none', ?, ?)
        `).run(
          `run_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          batchId,
          level,
          skill,
          batchSize,
          errorCategory === 'quota_exhausted' ? 'quota_exhausted' : 'failed',
          JSON.stringify({
            error: llmErr.message,
            category: errorCategory,
            part_type,
            requested: batchSize,
            saved: 0,
            remainingDeficit: batchSize,
          })
        );
      } catch {}

      lastJobError = llmErr.message;
      return {
        success: false,
        batchId,
        savedCount: 0,
        requestedCount: batchSize,
        remainingDeficit: batchSize,
        deficitRetained: batchSize,
        targetGroup: { level, skill, part_type },
        error: llmErr.message,
        errorCategory,
      };
    }

    const generated = waterfallResult.questions || [];
    let existingStems: string[] = [];
    const existingHashes = new Set<string>();
    const existingNearDupSigs = new Set<string>();
    try {
      const rows: any[] = db.prepare(`
        SELECT stem, content_hash, near_duplicate_signature FROM questions
        UNION
        SELECT stem, content_hash, near_duplicate_signature FROM pending_questions
      `).all() as any[];
      for (const r of rows) {
        if (r.stem) existingStems.push(r.stem);
        if (r.content_hash) existingHashes.add(r.content_hash);
        if (r.near_duplicate_signature) existingNearDupSigs.add(r.near_duplicate_signature);
      }
    } catch {
      existingStems = loadExistingStemsFromDb(getDbPath());
    }

    // 8. Multi-Layer Validation & Actual Text Syllabus Verification
    const validCandidates: {
      q: CandidateQuestion;
      contentHash: string;
      nearDupSig: string;
      testedVocabJson: string;
    }[] = [];

    for (const q of generated) {
      // 8a. Pre-validation auto-enrichment for intake queue
      if (!q.explanation_vi || q.explanation_vi.trim().length < 5) {
        const correctOpt = Array.isArray(q.options) && typeof q.answer_idx === 'number' && q.answer_idx >= 0 && q.answer_idx < q.options.length
          ? q.options[q.answer_idx]
          : '';
        q.explanation_vi = correctOpt
          ? `Đáp án đúng là ${correctOpt}. Phù hợp ngữ cảnh câu.`
          : 'Đáp án chính xác theo ngữ cảnh câu.';
      }

      // Compute completed_stem FIRST so full sentence pinyin matches
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

      // Always generate standardized, accurate Pinyin from completed_stem (or stem) and options via pinyin-pro engine
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

      // For open-ended writing tasks: options must be empty
      if (isOpenEndedWritingTask(q.part_type || part_type)) {
        q.options = [];
        q.answer_idx = 0;
        (q as any).distractor_rationales = [];
      }

      // If visual question needs an illustration theme, ensure a valid fallback
      const effectivePartType = String(q.part_type || part_type || '');
      const imageOptionPartTypes = new Set([
        'listen_picture_match_3opt',
        'listen_picture_match_4opt',
        'listen_dialogue_picture_match_6opt',
        'listen_dialogue_picture_match_split',
        'read_sentence_picture_match_6opt',
      ]);
      // Strip accidental blanks in stem for listening and picture-matching tasks
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

      if (!Array.isArray((q as any).distractor_rationales) && Array.isArray(q.options) && typeof q.answer_idx === 'number') {
        (q as any).distractor_rationales = q.options
          .map((opt, idx) => {
            if (idx === q.answer_idx) return null;
            return {
              option_idx: idx,
              option_text: opt,
              rationale_vi: `${opt}: Không phù hợp ngữ cảnh hoặc từ loại trong câu.`,
            };
          })
          .filter(Boolean);
      }

      // 8b. Two-phase validation: Try strict first; if strict fails on minor distractor formatting or strict tone alignment,
      // fallback to lenient check so questions reach pending_questions for teacher review
      let val = validateCandidate(q, existingStems, {
        existingContentHashes: existingHashes,
        existingNearDupSignatures: existingNearDupSigs,
        requireLanguageQuality: true,
        requireDistractorRationales: true,
      });

      if (!val.valid) {
        const lenientVal = validateCandidate(q, existingStems, {
          existingContentHashes: existingHashes,
          existingNearDupSignatures: existingNearDupSigs,
          requireLanguageQuality: false,
          requireDistractorRationales: false,
          lenientImport: true,
        });
        if (lenientVal.valid) {
          val = lenientVal;
        } else {
          console.warn('[Scheduler Validation Rejected]', val.errors, {
            part_type: q.part_type,
            stem: q.stem,
            options: q.options,
            options_images: q.options_images,
          });
        }
      }

      if (val.valid) {
        // Verify actual text against HSK 1–6 syllabus
        const verified = verifyQuestionVocab(q, level);
        const testedVocabJson = JSON.stringify(verified.tested);
        const nearDupSig = val.nearDuplicateSignature || computeNearDuplicateSignature(q.stem, q.options);
        const contentHash = val.contentHash || computeContentHash(q.stem, q.options, q.answer_idx, q.options_images);

        validCandidates.push({
          q,
          contentHash,
          nearDupSig,
          testedVocabJson,
        });
        existingStems.push(q.stem);
        existingHashes.add(contentHash);
        existingNearDupSigs.add(nearDupSig);
      }
    }

    // 9. Atomic Transactional Insert into pending_questions
    let savedCount = 0;
    if (validCandidates.length > 0) {
      db.exec('BEGIN IMMEDIATE;');
      try {
        const checkDupStmt = db.prepare(`
          SELECT 1 FROM pending_questions WHERE content_hash = ? OR near_duplicate_signature = ?
          UNION
          SELECT 1 FROM questions WHERE content_hash = ? OR near_duplicate_signature = ?
          LIMIT 1
        `);

        const insertStmt = db.prepare(`
          INSERT INTO pending_questions (
            id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, options_images, topic, status, provider_used, content_hash, near_duplicate_signature, tested_vocab, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, 1)
        `);

        for (const item of validCandidates) {
          const isDup = checkDupStmt.get(item.contentHash, item.nearDupSig, item.contentHash, item.nearDupSig);
          if (isDup) {
            continue;
          }

          const qId = `pend_${level}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          const optJson = JSON.stringify(item.q.options);

          const res: any = insertStmt.run(
            qId,
            batchId,
            item.q.stem,
            optJson,
            item.q.answer_idx,
            item.q.pinyin || null,
            item.q.explanation_vi,
            item.q.level,
            item.q.skill,
            item.q.part_type,
            item.q.illustration_theme || null,
            JSON.stringify(item.q.options_images || []),
            item.q.topic || null,
            waterfallResult.providerUsed,
            item.contentHash,
            item.nearDupSig,
            item.testedVocabJson
          );
          if (res?.changes > 0) savedCount++;
        }
        db.exec('COMMIT;');
      } catch (txErr) {
        try { db.exec('ROLLBACK;'); } catch {}
        throw txErr;
      }
    }

    // 10. Partial Batch Accounting
    const requestedCount = batchSize;
    const remainingDeficit = Math.max(0, requestedCount - savedCount);
    const isPartial = savedCount > 0 && savedCount < requestedCount;
    const runStatus = savedCount >= requestedCount ? 'success' : isPartial ? 'partial' : 'failed';

    const runDetails = {
      batchId,
      level,
      skill,
      part_type,
      requestedCount,
      generatedCount: generated.length,
      validCount: validCandidates.length,
      savedCount,
      remainingDeficit,
      deficitRetained: remainingDeficit,
      providerUsed: waterfallResult.providerUsed,
      modelUsed: waterfallResult.modelUsed,
      fallbackOccurred: waterfallResult.fallbackOccurred,
      fallbackLog: waterfallResult.fallbackLog,
    };

    // Record in generation_runs
    try {
      db.prepare(`
        INSERT INTO generation_runs (
          id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `run_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        batchId,
        level,
        skill,
        requestedCount,
        generated.length,
        savedCount,
        generated.length - validCandidates.length,
        waterfallResult.providerUsed,
        waterfallResult.modelUsed,
        runStatus,
        JSON.stringify(runDetails)
      );
    } catch {}

    // Complete task in SQLite qbank_tasks table (with partial status if K < N)
    completePersistentTask(db, taskId, runDetails, isPartial ? 'partial' : 'completed');

    console.log(`[Scheduler] Batch ${batchId} completed. Status: ${runStatus}. Saved: ${savedCount}/${requestedCount}. Deficit retained for next cycle: ${remainingDeficit}.`);

    return {
      success: savedCount > 0,
      batchId,
      savedCount,
      requestedCount,
      remainingDeficit,
      deficitRetained: remainingDeficit,
      targetGroup: { level, skill, part_type },
      details: runDetails,
    };
  } catch (err: any) {
    if (db && taskId) {
      failPersistentTask(db, taskId, err.message || 'Unknown error');
    }
    lastJobError = err.message || 'Unknown scheduler error';
    console.error('[Scheduler Error]', err.message);
    return {
      success: false,
      savedCount: 0,
      error: err.message,
    };
  } finally {
    isRunningInMemory = false;
    if (shouldCloseDb && db) {
      try { db.close(); } catch {}
    }
  }
}

export function getAutoSchedulerStatus(): SchedulerStatus {
  const config = getSchedulerConfig();
  let generatedToday = 0;
  let isRunning = isRunningInMemory;
  let activeTaskId: string | null = null;

  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const db = new DatabaseSync(dbPath, { readOnly: true });
      generatedToday = getQuestionsGeneratedToday(db);
      const row: any = db.prepare(`
        SELECT idempotency_key
        FROM qbank_tasks
        WHERE status = 'running'
          AND task_type IN ('auto_question_scheduler', 'admin_generate', 'exam_supplement')
        LIMIT 1
      `).get();
      if (row) {
        isRunning = true;
        activeTaskId = row.idempotency_key;
      }
      db.close();
    }
  } catch {}

  const nextRunTime = config.enabled && timerHandle
    ? scheduledNextRunTimestamp || new Date(Date.now() + config.intervalHours * 60 * 60 * 1000).toISOString()
    : null;

  return {
    enabled: config.enabled,
    isRunning,
    running: isRunning,
    lastRunTime: lastRunTimestamp,
    nextRunTime,
    generatedToday,
    maxQuestionsPerDay: config.maxQuestionsPerDay,
    unlimitedDaily: config.unlimitedDaily,
    preferredProvider: config.preferredProvider,
    intervalHours: config.intervalHours,
    batchSize: config.batchSize,
    targetLevel: config.targetLevel,
    lastBatchId,
    lastError: lastJobError,
    activeTaskId,
  };
}

export function updateSchedulerConfig(updates: Partial<SchedulerConfig>): SchedulerStatus {
  if (typeof updates.targetLevel === 'number') {
    process.env.QUESTION_GENERATION_TARGET_LEVEL = String(Math.max(0, Math.min(6, updates.targetLevel)));
  }
  if (typeof updates.preferredProvider === 'string' && updates.preferredProvider.trim()) {
    const normProv = normalizePreferredProvider(updates.preferredProvider);
    process.env.QUESTION_GENERATION_PREFERRED_PROVIDER = normProv;
    if (normProv === 'ollama' && updates.unlimitedDaily === undefined && (updates.maxQuestionsPerDay === undefined || updates.maxQuestionsPerDay <= 0)) {
      process.env.QUESTION_GENERATION_UNLIMITED_DAILY = 'true';
      process.env.QUESTION_GENERATION_MAX_QUESTIONS_PER_DAY = '0';
    }
  }
  if (typeof updates.unlimitedDaily === 'boolean') {
    process.env.QUESTION_GENERATION_UNLIMITED_DAILY = updates.unlimitedDaily ? 'true' : 'false';
    if (updates.unlimitedDaily) {
      process.env.QUESTION_GENERATION_MAX_QUESTIONS_PER_DAY = '0';
    }
  }
  if (typeof updates.intervalHours === 'number' && !isNaN(updates.intervalHours)) {
    process.env.QUESTION_GENERATION_INTERVAL_HOURS = String(Math.max(0.016, updates.intervalHours));
  }
  if (typeof updates.batchSize === 'number' && !isNaN(updates.batchSize)) {
    process.env.QUESTION_GENERATION_BATCH_SIZE = String(Math.max(1, Math.min(50, updates.batchSize)));
  }
  if (typeof updates.maxQuestionsPerDay === 'number' && !isNaN(updates.maxQuestionsPerDay)) {
    if (updates.maxQuestionsPerDay <= 0) {
      process.env.QUESTION_GENERATION_MAX_QUESTIONS_PER_DAY = '0';
      process.env.QUESTION_GENERATION_UNLIMITED_DAILY = 'true';
    } else {
      process.env.QUESTION_GENERATION_MAX_QUESTIONS_PER_DAY = String(Math.max(5, updates.maxQuestionsPerDay));
      if (updates.unlimitedDaily !== true && normalizePreferredProvider(process.env.QUESTION_GENERATION_PREFERRED_PROVIDER) !== 'ollama') {
        process.env.QUESTION_GENERATION_UNLIMITED_DAILY = 'false';
      }
    }
  }

  const current = getSchedulerConfig();
  if (current.enabled) {
    initAutoQuestionScheduler();
  }

  return getAutoSchedulerStatus();
}

function scheduleNextBatchRun(delayMs: number): void {
  if (timerHandle) {
    clearTimeout(timerHandle as any);
    clearInterval(timerHandle as any);
    timerHandle = null;
  }
  const config = getSchedulerConfig();
  if (
    !config.enabled ||
    process.env.NODE_ENV === 'test' ||
    Boolean(process.env.VITEST) ||
    process.env.DISABLE_AUTO_SCHEDULER === 'true'
  ) {
    scheduledNextRunTimestamp = null;
    return;
  }

  scheduledNextRunTimestamp = new Date(Date.now() + delayMs).toISOString();

  timerHandle = setTimeout(async () => {
    timerHandle = null;
    const currentConfig = getSchedulerConfig();
    if (!currentConfig.enabled) return;

    try {
      const res = await runScheduledBatch();
      if (!getSchedulerConfig().enabled) return;

      // In continuous unlimited mode (or when intervalHours is short):
      const isUnlimited = currentConfig.unlimitedDaily || currentConfig.maxQuestionsPerDay <= 0;
      if (isUnlimited) {
        // Continuous mode: if there are still questions needed, generate next batch in 5 seconds!
        // If all deficits met, check again in 30 seconds.
        const hasDeficit = typeof res.remainingDeficit === 'number' ? res.remainingDeficit > 0 : true;
        const nextDelay = hasDeficit ? 5000 : 30000;
        scheduleNextBatchRun(nextDelay);
      } else {
        // Standard interval mode
        scheduleNextBatchRun(Math.round(currentConfig.intervalHours * 3600 * 1000));
      }
    } catch (err: any) {
      console.error('[Scheduler Continuous Error]', err?.message);
      if (getSchedulerConfig().enabled) {
        // On transient error, cool down 15 seconds then resume
        scheduleNextBatchRun(15000);
      }
    }
  }, delayMs);

  if (timerHandle && typeof (timerHandle as any).unref === 'function') {
    (timerHandle as any).unref();
  }
}

export function initAutoQuestionScheduler(runImmediately: boolean = false): void {
  const config = getSchedulerConfig();
  if (timerHandle) {
    clearTimeout(timerHandle as any);
    clearInterval(timerHandle as any);
    timerHandle = null;
  }

  if (!config.enabled || process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST) || process.env.DISABLE_AUTO_SCHEDULER === 'true') {
    scheduledNextRunTimestamp = null;
    console.log('[Scheduler] Auto question generation is disabled.');
    return;
  }

  // 1. Startup Stale Task Recovery
  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const db = new DatabaseSync(dbPath);
      ensureEligiblePoolSchema(db);
      const recovered = recoverStartupStaleTasks(db);
      if (recovered > 0) {
        console.log(`[Scheduler] Startup stale task recovery: cleaned up ${recovered} orphaned running tasks.`);
      }
      db.close();
    }
  } catch (err: any) {
    console.warn('[Scheduler] Warning in startup recovery:', err.message);
  }

  const isUnlimited = config.unlimitedDaily || config.maxQuestionsPerDay <= 0;
  console.log(`[Scheduler] Initializing auto question generator (Continuous unlimited: ${isUnlimited}, Provider: ${config.preferredProvider || 'auto'}).`);

  const startDelay = runImmediately ? 1000 : (isUnlimited ? 5000 : Math.round(config.intervalHours * 3600 * 1000));
  scheduleNextBatchRun(startDelay);
}

export function stopAutoQuestionScheduler(): void {
  if (timerHandle) {
    clearTimeout(timerHandle as any);
    clearInterval(timerHandle as any);
    timerHandle = null;
  }
  scheduledNextRunTimestamp = null;
  console.log('[Scheduler] Auto question generator stopped.');
}

export function toggleAutoScheduler(enable?: boolean): SchedulerStatus {
  const current = getSchedulerConfig();
  const target = enable !== undefined ? enable : !current.enabled;
  process.env.ENABLE_AUTO_QUESTION_GENERATION = target ? 'true' : 'false';
  if (target) {
    // When user turns on the Robot, allow operational DB write and enforce unlimited continuous generation
    process.env.ALLOW_OPERATIONAL_CRON_WRITE = 'true';
    process.env.QUESTION_GENERATION_UNLIMITED_DAILY = 'true';
    process.env.QUESTION_GENERATION_MAX_QUESTIONS_PER_DAY = '0';
    initAutoQuestionScheduler(true);
  } else {
    stopAutoQuestionScheduler();
  }
  return getAutoSchedulerStatus();
}
