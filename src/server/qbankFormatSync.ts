import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { isValidIllustrationTheme } from './llm/promptTemplates.js';
import { isVisualQuestionType } from './llm/questionValidator.js';
import { isCompatiblePartType } from './qbankCoverageEngine.js';

export { isCompatiblePartType };

export type QualityValidationStatus = 'PASS' | 'FAIL' | 'REVIEW' | 'UNKNOWN';

export interface FormatCheckResult {
  /**
   * Structural format compatibility with practice mode.
   * NOTE: Purely structural format; does NOT imply operational serving eligibility or quality approval.
   */
  practice_eligible: boolean;
  /**
   * Structural format compatibility with official mock exam blueprint.
   * NOTE: Purely structural format; does NOT imply operational serving eligibility or quality approval.
   */
  exam_eligible: boolean;
  /**
   * Pure structural format compatibility flags (independent of review/serving status).
   */
  practice_format_compatible: boolean;
  exam_format_compatible: boolean;
  blueprint_format_compatible: boolean;

  /**
   * Quality validation status of the question ('PASS' | 'FAIL' | 'REVIEW' | 'UNKNOWN').
   */
  quality_validation_status: QualityValidationStatus;

  /**
   * Operational serving eligibility:
   * TRUE strictly when status === 'approved', is_active === 1, quality is NOT failed,
   * and structural format is compatible with the target flow.
   */
  operational_serving_eligible: boolean;
  operational_serving_practice_eligible: boolean;
  operational_serving_exam_eligible: boolean;

  compatible_formats: string[];
  ineligible_reasons: string[];
  matched_blueprint_part?: string;
}

export interface SyncQuestionResult {
  questionId: string;
  level: number;
  skill: string;
  part_type: string;
  practice_eligible: boolean;
  exam_eligible: boolean;
  compatible_formats: string[];
  ineligible_reasons: string[];
}

/**
 * Cache for loaded blueprints
 */
const blueprintCache = new Map<number, any>();

export function loadBlueprintData(level: number): any {
  if (blueprintCache.has(level)) {
    return blueprintCache.get(level);
  }
  const bpPath = path.resolve(process.cwd(), `data/qbank/blueprint/level${level}.json`);
  if (fs.existsSync(bpPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(bpPath, 'utf-8'));
      blueprintCache.set(level, data);
      return data;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Ensures table exam_eligible_pool and qbank_tasks exist in qbank.db
 */
export function ensureEligiblePoolSchema(db: DatabaseSync): void {
  try {
    db.exec('PRAGMA busy_timeout = 5000;');
  } catch {}
  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_pool_level_skill ON exam_eligible_pool(level, skill);
    CREATE INDEX IF NOT EXISTS idx_pool_exam_eligible ON exam_eligible_pool(exam_eligible, level);
    CREATE INDEX IF NOT EXISTS idx_pool_practice ON exam_eligible_pool(practice_eligible, level, skill);

    -- Persistent Idempotency & Task Tracking table
    CREATE TABLE IF NOT EXISTS qbank_tasks (
      idempotency_key TEXT PRIMARY KEY,
      task_type TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      status TEXT NOT NULL, -- 'running' | 'completed' | 'failed'
      result_json TEXT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_qbank_tasks_status ON qbank_tasks(status, updated_at);
  `);
}

/**
 * Helper for pedagogical option-count flexibility between generated questions and blueprint parts.
 * Rules:
 * - 4 options acceptable for 3-option parts (listening QA, picture match, reading comprehension)
 * - 4 or 5 options acceptable for 6-word-bank parts (read_fill_blank_word_bank_6opt, read_fill_blank_word_bank_split)
 * - 4 options acceptable for 6-option picture match
 * - 0 options acceptable for open-ended writing tasks
 */
export function isOptionCountCompatible(bpType: string, requiredOptions: number, actualOptions: number): boolean {
  if (requiredOptions === 0) {
    return actualOptions === 0;
  }
  if (bpType.includes('reorder') || bpType.includes('ordering')) return true;
  if (actualOptions === requiredOptions) return true;

  // Pedagogical equivalence rules:
  // 1. 4-option questions are valid substitutes for 3-option parts (listening QA, picture match, reading comprehension)
  if (requiredOptions === 3 && actualOptions === 4) return true;

  // 2. 4 or 5 options acceptable for 6-word-bank or 6-option picture match parts
  if (requiredOptions === 6 && (actualOptions === 4 || actualOptions === 5)) {
    if (bpType.includes('picture') || bpType.includes('word_bank') || bpType.includes('fill_blank')) {
      return true;
    }
  }

  return false;
}

/**
 * Validates whether a question meets the technical criteria for:
 * 1. Basic Practice Flow (Luồng luyện tập căn bản)
 * 2. Official HSK Exam Flow (Luồng luyện đề theo format HSK)
 *
 * Clearly distinguishes:
 * - Structural format compatibility (practice_format_compatible, exam_format_compatible, blueprint_format_compatible)
 * - Quality validation verdict (quality_validation_status: 'PASS' | 'FAIL' | 'REVIEW' | 'UNKNOWN')
 * - Operational serving authorization (operational_serving_eligible, requiring status === 'approved' AND is_active === 1)
 */
export function validateFormatCompatibility(q: any, level?: number): FormatCheckResult {
  const targetLevel = level || Number(q.level) || 1;
  const ineligible_reasons: string[] = [];
  const compatible_formats: string[] = [];

  // Determine quality validation status
  let quality_validation_status: QualityValidationStatus = 'UNKNOWN';

  const rawQualityStatus = String(q.quality_validation_status || q.quality_status || '').toUpperCase().trim();
  let explicitQualityProvided = false;
  if (rawQualityStatus === 'PASS') {
    quality_validation_status = 'PASS';
    explicitQualityProvided = true;
  } else if (rawQualityStatus === 'FAIL') {
    quality_validation_status = 'FAIL';
    explicitQualityProvided = true;
  } else if (rawQualityStatus === 'REVIEW') {
    quality_validation_status = 'REVIEW';
    explicitQualityProvided = true;
  } else if (rawQualityStatus === 'UNKNOWN') {
    quality_validation_status = 'UNKNOWN';
    explicitQualityProvided = true;
  }

  // If not explicitly provided, derive from validation results / gates / rejection signals
  if (!explicitQualityProvided) {
    const solverStatus =
      q.solverAnalysis?.semantic_uniqueness_status ||
      q.validation?.solverAnalysis?.semantic_uniqueness_status;

    if (
      q.valid === false ||
      (q.sixGates && !q.sixGates.allPassed) ||
      (q.validation && !q.validation.valid) ||
      q.validation_status === 'failed' ||
      q.status === 'rejected' ||
      q.status === 'validation_failed' ||
      solverStatus === 'MULTIPLE_VALID_OPTIONS' ||
      solverStatus === 'INVALID'
    ) {
      quality_validation_status = 'FAIL';
    } else if (
      q.actionRecommendation === 'needs_admin_review' ||
      q.validation?.actionRecommendation === 'needs_admin_review' ||
      q.validation_status === 'review' ||
      solverStatus === 'INSUFFICIENT_CONTEXT' ||
      solverStatus === 'UNRESOLVED_SEMANTICS'
    ) {
      quality_validation_status = 'REVIEW';
    } else if (
      (q.valid === true || (q.validation && q.validation.valid)) &&
      (!q.sixGates || q.sixGates.allPassed) &&
      (!solverStatus || solverStatus === 'UNIQUE_ANSWER_CONFIRMED')
    ) {
      quality_validation_status = 'PASS';
    }
  }

  // --- Check 1: Structural Practice Format Compatibility ---
  let practice_format_compatible = true;

  const rawSkill = String(q.skill || q.section || 'reading').toLowerCase().trim();

  if (!q.stem || typeof q.stem !== 'string' || q.stem.trim().length < 2) {
    practice_format_compatible = false;
    ineligible_reasons.push('Nội dung câu hỏi (stem) quá ngắn hoặc trống');
  }

  // Check listening audio resource availability (audio_text, audio_url, audio_playback, or valid spoken stem)
  const hasValidStem = typeof q.stem === 'string' && q.stem.trim().length >= 2;
  const hasAudioResource = Boolean(
    q.audio_text || q.audio_url || q.audio_playback || (rawSkill === 'listening' && hasValidStem)
  );
  if (rawSkill === 'listening' && !hasAudioResource) {
    practice_format_compatible = false;
    if (!ineligible_reasons.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')) {
      ineligible_reasons.push('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)');
    }
  }

  let optionsArr: string[] = [];
  try {
    optionsArr = Array.isArray(q.options)
      ? q.options
      : typeof q.options === 'string'
      ? JSON.parse(q.options)
      : [];
  } catch {
    optionsArr = [];
  }

  const rawPartTypeForOpts = String(q.part_type || '').toLowerCase().trim();
  const isZeroOptionWritingTask =
    rawPartTypeForOpts.startsWith('write_') &&
    !rawPartTypeForOpts.includes('6opt') &&
    !rawPartTypeForOpts.includes('4opt') &&
    !rawPartTypeForOpts.includes('3opt');

  if (isZeroOptionWritingTask && optionsArr.length > 0) {
    practice_format_compatible = false;
    ineligible_reasons.push('Dạng bài viết tự luận yêu cầu 0 phương án (options phải rỗng)');
  }

  if (!isZeroOptionWritingTask && optionsArr.length < 2) {
    practice_format_compatible = false;
    ineligible_reasons.push('Số lượng phương án trả lời phải từ 2 trở lên');
  }

  const answerIdx = typeof q.answer_idx === 'number'
    ? q.answer_idx
    : typeof q.answer_index === 'number'
    ? q.answer_index
    : -1;

  if (!isZeroOptionWritingTask && (answerIdx < 0 || answerIdx >= optionsArr.length)) {
    practice_format_compatible = false;
    ineligible_reasons.push('Chỉ số đáp án đúng (answer_index) không hợp lệ');
  }

  if (targetLevel < 1 || targetLevel > 6) {
    practice_format_compatible = false;
    ineligible_reasons.push('Cấp độ HSK phải từ 1 đến 6');
  }

  // Format practice compatibility (fails if format broken or quality status is explicitly FAIL)
  const practice_eligible = practice_format_compatible && quality_validation_status !== 'FAIL';
  if (quality_validation_status === 'FAIL') {
    ineligible_reasons.push(
      'Câu hỏi không đạt các cổng kiểm định chất lượng (validation quality gates failed)'
    );
  }

  // --- Check 2: Exam Blueprint Compatibility ---
  let exam_format_compatible = false;
  let matched_blueprint_part: string | undefined;

  const blueprint = loadBlueprintData(targetLevel);
  if (blueprint && practice_format_compatible) {
    const rawPartType = (q.part_type || '').toLowerCase().trim();

    // Check if blueprint contains this section
    const section = blueprint.sections?.[rawSkill];
    if (section && section.parts) {
      let foundMatchingType = false;
      // Find matching part in blueprint
      for (const [partKey, partDef] of Object.entries<any>(section.parts)) {
        const bpType = (partDef.type || '').toLowerCase().trim();

        // Match either exact type or verified compatible type
        const isTypeMatch = bpType === rawPartType || isCompatiblePartType(bpType, rawPartType);

        if (isTypeMatch) {
          foundMatchingType = true;
          if (!compatible_formats.includes(bpType)) {
            compatible_formats.push(bpType);
          }
          if (rawPartType && !compatible_formats.includes(rawPartType)) {
            compatible_formats.push(rawPartType);
          }

          // Check options count constraint if specified in blueprint with pedagogical flexibility
          const optMatch = /_(\d+)opt$/.exec(bpType);
          const requiredOptions = partDef.n_options ?? (optMatch ? parseInt(optMatch[1], 10) : 0);
          // In HSK 1, 2, 3: Word bank parts require at least 5 options; 4-option MCQs (read_fill_blank_4opt) are practice-only
          const isWordBankWithWrongOptions = targetLevel <= 3 && bpType.includes('word_bank') && (rawPartType.includes('4opt') || optionsArr.length < 5);
          const isWordBankSplitWithWrongOptions = bpType.includes('split') && optionsArr.length !== requiredOptions && rawPartType.includes('4opt');

          if (!isOptionCountCompatible(bpType, requiredOptions, optionsArr.length) || isWordBankWithWrongOptions || isWordBankSplitWithWrongOptions) {
            ineligible_reasons.push(
              isWordBankWithWrongOptions || isWordBankSplitWithWrongOptions
                ? `Dạng bài ${bpType} yêu cầu chính xác 6 phương án (câu hiện có ${optionsArr.length})`
                : `Dạng bài ${bpType} yêu cầu chính xác ${requiredOptions} phương án (câu hiện có ${optionsArr.length})`
            );
            continue;
          }

          // Check Audio requirement for listening (exam blueprint requires audio_text, audio_url, audio_playback, or dialogue script in stem)
          let hasAudioDeficit = false;
          if (rawSkill === 'listening') {
            const hasDialogueAudio = typeof q.stem === 'string' && /(?:男|女|甲|乙|A|B)\s*[:：]|问[：:]/.test(q.stem);
            const hasExamAudio = Boolean(q.audio_text || q.audio_url || q.audio_playback || hasDialogueAudio);
            if (!hasExamAudio) {
              hasAudioDeficit = true;
              if (!ineligible_reasons.some((r) => r.includes('audio_text') || r.includes('âm thanh'))) {
                ineligible_reasons.push('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc audio_url)');
              }
            }
          }

          // Check Passage requirement for cloze passages in higher HSK levels
          if (bpType.includes('cloze_passages') || (targetLevel >= 5 && rawSkill === 'reading' && !bpType.includes('ordering') && !rawPartType.includes('sentence_ordering'))) {
            const hasPassage = Boolean(
              (q.passage && q.passage.trim().length >= 20) ||
              (typeof q.stem === 'string' && q.stem.trim().length >= 25 && (!q.id || (!String(q.id).startsWith('pend_5_') && !String(q.id).startsWith('pend_6_'))))
            );
            if (!hasPassage) {
              ineligible_reasons.push(`Dạng bài ${bpType} yêu cầu bài đọc văn bản (passage)`);
              continue;
            }
          }

          // Check Visual requirement
          let hasVisualDeficit = false;
          if (isVisualQuestionType(rawPartType) || isVisualQuestionType(bpType)) {
            const theme = q.illustration_theme || q.illustration;
            let hasImageBank = false;
            if (Array.isArray(q.options_images) && q.options_images.length > 0) {
              hasImageBank = true;
            } else if (typeof q.options_images === 'string') {
              try {
                const parsed = JSON.parse(q.options_images);
                if (Array.isArray(parsed) && parsed.length > 0) hasImageBank = true;
              } catch {}
            }
            const hasTheme = isValidIllustrationTheme(theme) || hasImageBank;
            if (!hasTheme) {
              hasVisualDeficit = true;
              if (!ineligible_reasons.some((r) => r.includes('hình minh họa'))) {
                ineligible_reasons.push('Dạng bài nhìn tranh thiếu chủ đề hình minh họa SVG hợp lệ');
              }
            }
          }

          if (hasAudioDeficit || hasVisualDeficit) {
            continue;
          }

          // If all technical conditions pass:
          exam_format_compatible = true;
          matched_blueprint_part = partKey;
          compatible_formats.push(bpType);
          if (rawPartType && !compatible_formats.includes(rawPartType)) {
            compatible_formats.push(rawPartType);
          }
          compatible_formats.push(`hsk${targetLevel}_official_mock:${rawSkill}:${partKey}`);
          compatible_formats.push(`hsk${targetLevel}_section_${rawSkill}`);
          break;
        }
      }

      if (!foundMatchingType) {
        if (targetLevel === 1 && rawPartType === 'read_fill_blank_4opt') {
          ineligible_reasons.push(
            `Loại bài ${q.part_type} không thuộc bất kỳ phần nào trong blueprint HSK 1 (dạng bài đọc điền từ yêu cầu chính xác 6 phương án theo định dạng word bank)`
          );
        } else {
          ineligible_reasons.push(
            `Loại bài ${q.part_type || 'không xác định'} không thuộc bất kỳ phần nào trong blueprint HSK ${targetLevel}`
          );
        }
      }
    } else {
      ineligible_reasons.push(`Blueprint HSK ${targetLevel} không có phần thi kỹ năng '${rawSkill}'`);
    }
  } else if (!blueprint) {
    ineligible_reasons.push(`Chưa có tệp blueprint xác minh cho HSK ${targetLevel}`);
  }

  // Diagnostic safeguard: If not exam eligible, ensure at least one reason is recorded
  let exam_eligible = exam_format_compatible && quality_validation_status !== 'FAIL';

  if (!exam_eligible && ineligible_reasons.length === 0) {
    ineligible_reasons.push(
      `Loại bài ${q.part_type || 'không xác định'} không thuộc bất kỳ phần nào trong blueprint HSK ${targetLevel}`
    );
  }

  // Operational serving status: FAIL-CLOSED policy.
  // ONLY permitted when ALL of the following conditions hold simultaneously:
  // 1. Candidate status is strictly 'approved'
  // 2. Candidate is strictly active (is_active === 1 or default active)
  // 3. quality_validation_status is strictly 'PASS' ('FAIL', 'REVIEW', 'UNKNOWN', or missing/null are all BLOCKED)
  // 4. Structural format is compatible with the target flow (practice_format_compatible or exam_format_compatible)
  const isApproved = String(q.status || '').toLowerCase() === 'approved';
  const isActive = q.is_active === undefined || q.is_active === null || Number(q.is_active) === 1;
  const isQualityPassed = quality_validation_status === 'PASS';

  const operational_serving_practice_eligible = Boolean(
    isApproved && isActive && isQualityPassed && practice_format_compatible
  );
  const operational_serving_exam_eligible = Boolean(
    isApproved && isActive && isQualityPassed && exam_format_compatible
  );
  const operational_serving_eligible = Boolean(
    operational_serving_practice_eligible || operational_serving_exam_eligible
  );

  return {
    practice_eligible,
    exam_eligible,
    practice_format_compatible,
    exam_format_compatible,
    blueprint_format_compatible: Boolean(practice_format_compatible || exam_format_compatible),
    quality_validation_status,
    operational_serving_eligible,
    operational_serving_practice_eligible,
    operational_serving_exam_eligible,
    compatible_formats,
    ineligible_reasons,
    matched_blueprint_part,
  };
}

/**
 * Synchronizes an approved question into both the Practice Pool and Exam Pool automatically.
 * Idempotent: can be safely re-run multiple times without duplicate records.
 */
export function syncApprovedQuestion(
  questionId: string,
  db: DatabaseSync
): SyncQuestionResult | null {
  ensureEligiblePoolSchema(db);

  // 1. Fetch question from pending_questions or questions
  let q: any = null;
  try {
    q = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
  } catch {}

  if (!q) {
    try {
      q = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get(questionId);
    } catch {}
  }

  if (!q) {
    try {
      q = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(questionId);
    } catch {}
  }

  if (!q) {
    return null;
  }

  const level = Number(q.level) || 1;
  const skill = (q.skill || q.section || 'reading').toLowerCase();
  const partType = q.part_type || 'read_fill_blank_4opt';
  const stem = q.stem || '';

  // 2. Validate format compatibility
  const check = validateFormatCompatibility(q, level);

  const isApproved = (q.status || '').toLowerCase() === 'approved' && (q.is_active === undefined || q.is_active === null || Number(q.is_active) === 1);
  const practiceEligible = Boolean(isApproved && check.practice_eligible);
  const examEligible = Boolean(isApproved && check.exam_eligible);
  const ineligibleReasons = [...check.ineligible_reasons];
  if (!isApproved) {
    ineligibleReasons.unshift(`Question status is '${q.status || 'unknown'}' (must be 'approved' and active to be eligible)`);
  }

  // 3. Upsert into exam_eligible_pool table
  const upsertStmt = db.prepare(`
    INSERT INTO exam_eligible_pool (
      question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats, ineligible_reasons, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(question_id) DO UPDATE SET
      level = excluded.level,
      skill = excluded.skill,
      part_type = excluded.part_type,
      stem = excluded.stem,
      practice_eligible = excluded.practice_eligible,
      exam_eligible = excluded.exam_eligible,
      compatible_formats = excluded.compatible_formats,
      ineligible_reasons = excluded.ineligible_reasons,
      updated_at = CURRENT_TIMESTAMP
  `);

  upsertStmt.run(
    questionId,
    level,
    skill,
    partType,
    stem,
    practiceEligible ? 1 : 0,
    examEligible ? 1 : 0,
    JSON.stringify(check.compatible_formats),
    JSON.stringify(ineligibleReasons)
  );

  return {
    questionId,
    level,
    skill,
    part_type: partType,
    practice_eligible: practiceEligible,
    exam_eligible: examEligible,
    compatible_formats: check.compatible_formats,
    ineligible_reasons: ineligibleReasons,
  };
}

/**
 * Synchronizes an approved question into both practice and exam pools.
 * Polymorphic wrapper supporting both (db, id) and (id, db) calling conventions.
 */
export function syncApprovedQuestionToPool(db: DatabaseSync, id: string): SyncQuestionResult | null;
export function syncApprovedQuestionToPool(id: string, db: DatabaseSync): SyncQuestionResult | null;
export function syncApprovedQuestionToPool(first: any, second: any): SyncQuestionResult | null {
  if (typeof first === 'string') {
    return syncApprovedQuestion(first, second);
  }
  return syncApprovedQuestion(second, first);
}

/**
 * Re-evaluates all approved active questions in questions table,
 * re-running validateFormatCompatibility and updating exam_eligible_pool.
 * Guarantees accurate diagnostic reasons for practice_eligible and exam_eligible.
 */
export function reEvaluateApprovedQuestions(db: DatabaseSync): {
  total: number;
  practice_eligible_count: number;
  exam_eligible_count: number;
  reasons_recorded_count: number;
  still_ineligible_count: number;
  details: SyncQuestionResult[];
} {
  ensureEligiblePoolSchema(db);

  let rows: any[] = [];
  try {
    rows = db.prepare(`
      SELECT id FROM questions 
      WHERE status = 'approved' AND COALESCE(is_active, 1) = 1
      ORDER BY rowid ASC
    `).all() as any[];
  } catch {
    rows = [];
  }

  const details: SyncQuestionResult[] = [];
  let practiceCount = 0;
  let examCount = 0;
  let reasonsRecorded = 0;

  db.exec('BEGIN IMMEDIATE;');
  try {
    // 1. Sync all approved active questions
    for (const row of rows) {
      const res = syncApprovedQuestion(row.id, db);
      if (res) {
        details.push(res);
        if (res.practice_eligible) practiceCount++;
        if (res.exam_eligible) examCount++;
        if (res.ineligible_reasons && res.ineligible_reasons.length > 0) reasonsRecorded++;
      }
    }

    // 2. Clean up orphaned pool rows (e.g. deleted or deactivated questions)
    try {
      db.prepare(`
        DELETE FROM exam_eligible_pool
        WHERE question_id NOT IN (
          SELECT id FROM questions WHERE status = 'approved' AND COALESCE(is_active, 1) = 1
        )
      `).run();
    } catch {}

    db.exec('COMMIT;');
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch {}
    throw err;
  }

  return {
    total: rows.length,
    practice_eligible_count: practiceCount,
    exam_eligible_count: examCount,
    reasons_recorded_count: reasonsRecorded,
    still_ineligible_count: rows.length - examCount,
    details,
  };
}

/**
 * Returns statistics of the Exam-Eligible Pool and Practice Pool by level
 */
export function getEligiblePoolStats(db: DatabaseSync): Record<string, any> {
  ensureEligiblePoolSchema(db);
  const stats: Record<string, any> = {};

  for (let lvl = 1; lvl <= 6; lvl++) {
    let practiceRow: any;
    let examRow: any;

    try {
      practiceRow = db.prepare(`
        SELECT COUNT(*) as cnt 
        FROM exam_eligible_pool p
        INNER JOIN questions q ON p.question_id = q.id
        WHERE p.level = ? AND p.practice_eligible = 1 AND q.status = 'approved' AND COALESCE(q.is_active, 1) = 1
      `).get(lvl);

      examRow = db.prepare(`
        SELECT COUNT(*) as cnt 
        FROM exam_eligible_pool p
        INNER JOIN questions q ON p.question_id = q.id
        WHERE p.level = ? AND p.exam_eligible = 1 AND q.status = 'approved' AND COALESCE(q.is_active, 1) = 1
      `).get(lvl);
    } catch {
      // Fallback if questions table does not exist in isolated unit test databases
      practiceRow = db.prepare(
        'SELECT COUNT(*) as cnt FROM exam_eligible_pool WHERE level = ? AND practice_eligible = 1'
      ).get(lvl);

      examRow = db.prepare(
        'SELECT COUNT(*) as cnt FROM exam_eligible_pool WHERE level = ? AND exam_eligible = 1'
      ).get(lvl);
    }

    stats[String(lvl)] = {
      level: lvl,
      practice_count: Number(practiceRow?.cnt || 0),
      exam_count: Number(examRow?.cnt || 0),
    };
  }

  return stats;
}

export interface BlueprintPartStatus {
  partKey: string;
  name: string;
  partType: string;
  skill: string;
  nQuestionsRequired: number;
  nAvailable: number;
  nMissing: number;
  availableQuestionIds: string[];
}

export interface SectionInspection {
  name: string;
  skill: string;
  totalRequired: number;
  totalAvailable: number;
  totalMissing: number;
  parts: BlueprintPartStatus[];
}

export interface ExamPoolInspectionResult {
  level: number;
  blueprintFound: boolean;
  totalRequired: number;
  totalAvailable: number;
  totalMissing: number;
  isFullyEligible: boolean;
  sections: Record<string, SectionInspection>;
}

/**
 * Detailed section-by-section audit of Exam-Eligible Pool vs official HSK Blueprint
 */
export function inspectExamPoolBySections(
  db: DatabaseSync,
  level: number,
  excludeQuestionIds?: Set<string> | string[]
): ExamPoolInspectionResult {
  ensureEligiblePoolSchema(db);
  const bp = loadBlueprintData(level);

  if (!bp || !bp.sections || level < 1 || level > 6) {
    return {
      level,
      blueprintFound: false,
      totalRequired: 0,
      totalAvailable: 0,
      totalMissing: 0,
      isFullyEligible: false,
      sections: {},
    };
  }

  // Fetch all exam_eligible questions for this level (excluding any disabled/rejected rows in questions if table exists)
  let eligibleRows: any[] = [];
  try {
    eligibleRows = db.prepare(`
      SELECT p.question_id, p.skill, p.part_type, p.compatible_formats
      FROM exam_eligible_pool p
      INNER JOIN questions q ON p.question_id = q.id
      WHERE p.level = ? AND p.exam_eligible = 1
        AND q.status = 'approved' AND COALESCE(q.is_active, 1) = 1
    `).all(level) as any[] || [];
  } catch {
    eligibleRows = db.prepare(`
      SELECT question_id, skill, part_type, compatible_formats
      FROM exam_eligible_pool
      WHERE level = ? AND exam_eligible = 1
    `).all(level) as any[] || [];
  }

  const usedQuestionIds = new Set<string>(
    excludeQuestionIds
      ? (excludeQuestionIds instanceof Set ? Array.from(excludeQuestionIds) : excludeQuestionIds)
      : []
  );
  const sectionsResult: Record<string, SectionInspection> = {};
  let grandTotalRequired = 0;
  let grandTotalAvailable = 0;
  let grandTotalMissing = 0;

  for (const [secKey, secData] of Object.entries<any>(bp.sections)) {
    const secSkill = (secData.skill || secKey).toLowerCase();
    const partsArray: BlueprintPartStatus[] = [];
    let secReq = 0;
    let secAvail = 0;
    let secMiss = 0;

    if (secData.parts) {
      for (const [pKey, pVal] of Object.entries<any>(secData.parts)) {
        const pRequired = Number(pVal.n_questions) || 0;
        const pType = pVal.type || '';
        secReq += pRequired;

        // Find matching available questions in the eligible pool for this specific part
        const matchingIds: string[] = [];
        for (const row of eligibleRows) {
          if (usedQuestionIds.has(row.question_id)) continue;

          const rowSkill = (row.skill || '').toLowerCase();
          if (rowSkill !== secSkill) continue;

          let matches = false;
          if (row.part_type === pType) {
            matches = true;
          } else {
            try {
              const compFormats = JSON.parse(row.compatible_formats || '[]');
              if (Array.isArray(compFormats) && compFormats.includes(pType)) {
                matches = true;
              }
            } catch {}
            if (!matches && isCompatiblePartType(pType, row.part_type)) {
              matches = true;
            }
          }

          if (matches) {
            matchingIds.push(row.question_id);
            usedQuestionIds.add(row.question_id);
            if (matchingIds.length >= pRequired) {
              break;
            }
          }
        }

        const pAvailable = matchingIds.length;
        const pMissing = Math.max(0, pRequired - pAvailable);
        secAvail += pAvailable;
        secMiss += pMissing;

        partsArray.push({
          partKey: pKey,
          name: pVal.name || pKey,
          partType: pType,
          skill: secSkill,
          nQuestionsRequired: pRequired,
          nAvailable: pAvailable,
          nMissing: pMissing,
          availableQuestionIds: matchingIds,
        });
      }
    }

    grandTotalRequired += secReq;
    grandTotalAvailable += secAvail;
    grandTotalMissing += secMiss;

    sectionsResult[secKey] = {
      name: secData.name || secKey,
      skill: secSkill,
      totalRequired: secReq,
      totalAvailable: secAvail,
      totalMissing: secMiss,
      parts: partsArray,
    };
  }

  return {
    level,
    blueprintFound: true,
    totalRequired: grandTotalRequired,
    totalAvailable: grandTotalAvailable,
    totalMissing: grandTotalMissing,
    isFullyEligible: grandTotalMissing === 0,
    sections: sectionsResult,
  };
}

export interface PersistentTaskRow {
  idempotency_key: string;
  task_type: string;
  payload_hash: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  result_json?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Task Idempotency: Retrieves existing task with stale recovery
 */
export function getPersistentTask(db: DatabaseSync, idempotencyKey: string): PersistentTaskRow | null {
  ensureEligiblePoolSchema(db);
  const row: any = db.prepare('SELECT * FROM qbank_tasks WHERE idempotency_key = ?').get(idempotencyKey);
  if (!row) return null;

  // Stale recovery: If status has been 'running' for more than 3 minutes, treat as failed/stale
  if (row.status === 'running') {
    const rawTime = (row.updated_at || row.created_at || '').trim();
    const utcTimeStr = rawTime.includes('Z') || rawTime.includes('+') ? rawTime : rawTime.replace(' ', 'T') + 'Z';
    const updatedAt = new Date(utcTimeStr).getTime();
    if (!isNaN(updatedAt) && Date.now() - updatedAt > 3 * 60 * 1000) {
      db.prepare(`
        UPDATE qbank_tasks SET status = 'failed', error_message = 'Task timed out or server restarted', updated_at = CURRENT_TIMESTAMP
        WHERE idempotency_key = ?
      `).run(idempotencyKey);
      row.status = 'failed';
      row.error_message = 'Task timed out or server restarted';
    }
  }

  return row as PersistentTaskRow;
}

/**
 * Task Idempotency: Creates a new running task
 */
export function createPersistentTask(
  db: DatabaseSync,
  idempotencyKey: string,
  taskType: string,
  payloadHash: string
): void {
  ensureEligiblePoolSchema(db);
  db.prepare(`
    INSERT INTO qbank_tasks (idempotency_key, task_type, payload_hash, status, updated_at)
    VALUES (?, ?, ?, 'running', CURRENT_TIMESTAMP)
    ON CONFLICT(idempotency_key) DO UPDATE SET
      status = 'running',
      error_message = null,
      updated_at = CURRENT_TIMESTAMP
  `).run(idempotencyKey, taskType, payloadHash);
}

export interface GenerationLockResult {
  acquired: boolean;
  taskId?: string;
  activeTask?: PersistentTaskRow;
  error?: string;
}

/**
 * Unified Concurrency Lock: Acquires an exclusive generation lock in SQLite qbank_tasks table.
 * Proactively purges stale tasks older than maxDurationMs.
 * Prevents concurrent runs between Cron, Admin Manual Generate, and Exam Supplement.
 */
export function acquireGenerationLock(
  db: DatabaseSync,
  params: {
    taskType: 'auto_question_scheduler' | 'admin_generate' | 'exam_supplement' | string;
    idempotencyKey: string;
    payloadHash: string;
    maxDurationMs?: number;
  }
): GenerationLockResult {
  ensureEligiblePoolSchema(db);
  const maxDurationMs = params.maxDurationMs || 60000;

  db.exec('BEGIN IMMEDIATE;');
  try {
    // 1. Proactively release any stale tasks older than maxDurationMs
    const now = Date.now();
    const runningTasks: any[] = db.prepare(`
      SELECT idempotency_key, task_type, created_at, updated_at
      FROM qbank_tasks
      WHERE status = 'running'
    `).all() as any[];

    for (const task of runningTasks) {
      const rawTime = (task.updated_at || task.created_at || '').trim();
      const utcTimeStr = rawTime.includes('Z') || rawTime.includes('+') ? rawTime : rawTime.replace(' ', 'T') + 'Z';
      const updatedAt = new Date(utcTimeStr).getTime();
      if (isNaN(updatedAt) || (now - updatedAt > maxDurationMs)) {
        db.prepare(`
          UPDATE qbank_tasks
          SET status = 'failed', error_message = 'Task timed out (stale lock released)', updated_at = CURRENT_TIMESTAMP
          WHERE idempotency_key = ?
        `).run(task.idempotency_key);
      }
    }

    // 2. Check if ANY generation task is currently running
    const activeLock: any = db.prepare(`
      SELECT idempotency_key, task_type, payload_hash, status, created_at, updated_at
      FROM qbank_tasks
      WHERE status = 'running'
        AND task_type IN ('auto_question_scheduler', 'admin_generate', 'exam_supplement')
        AND idempotency_key != ?
      LIMIT 1
    `).get(params.idempotencyKey);

    if (activeLock) {
      db.exec('ROLLBACK;');
      return {
        acquired: false,
        activeTask: activeLock as PersistentTaskRow,
        error: `Hệ thống đang thực hiện một phiên sinh câu hỏi khác (${activeLock.task_type}: ${activeLock.idempotency_key}). Vui lòng đợi trong giây lát.`,
      };
    }

    // 3. Insert or update current task as 'running'
    db.prepare(`
      INSERT INTO qbank_tasks (idempotency_key, task_type, payload_hash, status, created_at, updated_at)
      VALUES (?, ?, ?, 'running', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(idempotency_key) DO UPDATE SET
        task_type = excluded.task_type,
        payload_hash = excluded.payload_hash,
        status = 'running',
        error_message = null,
        result_json = null,
        updated_at = CURRENT_TIMESTAMP
    `).run(params.idempotencyKey, params.taskType, params.payloadHash);

    db.exec('COMMIT;');
    return { acquired: true, taskId: params.idempotencyKey };
  } catch (err: any) {
    try { db.exec('ROLLBACK;'); } catch {}
    return { acquired: false, error: err.message };
  }
}

/**
 * Task Idempotency: Marks task completed or partial with result
 */
export function completePersistentTask(
  db: DatabaseSync,
  idempotencyKey: string,
  result: any,
  status: 'completed' | 'partial' = 'completed'
): void {
  ensureEligiblePoolSchema(db);
  db.prepare(`
    UPDATE qbank_tasks
    SET status = ?, result_json = ?, error_message = null, updated_at = CURRENT_TIMESTAMP
    WHERE idempotency_key = ?
  `).run(status, JSON.stringify(result), idempotencyKey);
}

/**
 * Task Idempotency: Marks task failed
 */
export function failPersistentTask(db: DatabaseSync, idempotencyKey: string, errorMessage: string): void {
  ensureEligiblePoolSchema(db);
  db.prepare(`
    UPDATE qbank_tasks
    SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE idempotency_key = ?
  `).run(errorMessage, idempotencyKey);
}

/**
 * Task Idempotency: Proactively cleans up stale tasks that have been running longer than timeoutMs
 */
export function releaseStaleTasks(db: DatabaseSync, timeoutMs: number = 3 * 60 * 1000): number {
  ensureEligiblePoolSchema(db);
  const rows: any[] = db.prepare("SELECT idempotency_key, created_at, updated_at FROM qbank_tasks WHERE status = 'running'").all() as any[];
  let releasedCount = 0;
  const now = Date.now();
  const updateStmt = db.prepare(`
    UPDATE qbank_tasks
    SET status = 'failed', error_message = 'Task timed out or server restarted', updated_at = CURRENT_TIMESTAMP
    WHERE idempotency_key = ?
  `);

  for (const row of rows) {
    const rawTime = (row.updated_at || row.created_at || '').trim();
    const utcTimeStr = rawTime.includes('Z') || rawTime.includes('+') ? rawTime : rawTime.replace(' ', 'T') + 'Z';
    const updatedAt = new Date(utcTimeStr).getTime();
    if (isNaN(updatedAt) || (now - updatedAt > timeoutMs)) {
      updateStmt.run(row.idempotency_key);
      releasedCount++;
    }
  }
  return releasedCount;
}

/**
 * Startup Recovery: Cleans up any orphaned running tasks left over from unexpected server restarts
 */
export function recoverStartupStaleTasks(db: DatabaseSync): number {
  ensureEligiblePoolSchema(db);
  const result: any = db.prepare(`
    UPDATE qbank_tasks
    SET status = 'failed', error_message = 'Task aborted due to server restart', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'running'
  `).run();
  return result?.changes || 0;
}

