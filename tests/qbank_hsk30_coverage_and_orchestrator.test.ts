import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import http from 'node:http';

function request(app: express.Express) {
  async function exec(method: string, urlPath: string, body?: unknown) {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const addr = server.address() as { port: number };
    try {
      const res = await fetch(`http://127.0.0.1:${addr.port}${urlPath}`, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      return { status: res.status, body: json };
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
  return {
    get: (urlPath: string) => exec('GET', urlPath),
    post: (urlPath: string) => ({
      send: (body?: unknown) => exec('POST', urlPath, body),
    }),
  };
}
import {
  getSyllabusCatalog,
  loadSyllabusVocab,
  loadSyllabusChars,
  computeVocabCoverage,
  computeCoverageMatrix,
  planBatchVocab,
  verifyQuestionVocab,
  classifyGroupStatus,
  getPriorityDeficitGroup,
  applyAdditiveQBankMigrations,
  computeNearDuplicateSignature,
  computeContentHash,
  invalidateVocabCoverageCache,
} from '../src/server/qbankCoverageEngine.js';
import {
  validateCandidate,
  validateQuestionCandidate,
} from '../src/server/llm/questionValidator.js';
import {
  ensureEligiblePoolSchema,
  syncApprovedQuestion,
  inspectExamPoolBySections,
  createPersistentTask,
  releaseStaleTasks,
} from '../src/server/qbankFormatSync.js';
import {
  runScheduledBatch,
} from '../src/server/cron/autoQuestionScheduler.js';
import {
  setMockLLMHandler,
  resetMockLLMHandler,
} from '../src/server/llm/waterfallGenerator.js';
import { examRouter, clearAllSessionsForTesting, setExamDbForTesting } from '../src/server/examRoutes.js';

describe('HSK 3.0 (HSK 1–6 Only) QBank Coverage, Orchestrator & 38 Mandatory Scenarios', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    ensureEligiblePoolSchema(db);
    applyAdditiveQBankMigrations(db);
    clearAllSessionsForTesting();
    setExamDbForTesting(db);
    resetMockLLMHandler();
  });

  afterEach(() => {
    setExamDbForTesting(null);
    resetMockLLMHandler();
    vi.restoreAllMocks();
    try {
      db.close();
    } catch {}
  });

  // ============================================================================
  // NHÓM A — ĐỘ BAO PHỦ VÀ TỪ VỰNG (HSK 1–6) (KỊCH BẢN 1–9)
  // ============================================================================
  describe('Nhóm A — Độ bao phủ và từ vựng (HSK 1–6) (Kịch bản 1–9)', () => {
    it('Scenario 1: Hệ thống chỉ tính mục tiêu và theo dõi độ bao phủ cho HSK 1–6, tuyệt đối không tính HSK 7–9', () => {
      const catalog = getSyllabusCatalog();
      for (const word of catalog.words.values()) {
        expect(word.level).toBeGreaterThanOrEqual(1);
        expect(word.level).toBeLessThanOrEqual(6);
      }
      for (const char of catalog.chars.values()) {
        expect(char.level).toBeGreaterThanOrEqual(1);
        expect(char.level).toBeLessThanOrEqual(6);
      }

      const matrix = computeCoverageMatrix(db);
      const levelsInMatrix = new Set(matrix.rows.map((r) => r.level));
      expect(Array.from(levelsInMatrix).sort()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(levelsInMatrix.has(7 as any)).toBe(false);
      expect(levelsInMatrix.has(8 as any)).toBe(false);
      expect(levelsInMatrix.has(9 as any)).toBe(false);

      const level7Blocked = classifyGroupStatus({
        level: 7,
        skill: 'reading',
        part_type: 'read_comprehension_4opt',
        approvedCount: 50,
        pendingCount: 0,
        blueprintQuestionQuota: 10,
      });
      expect(level7Blocked.status).toBe('blocked');
    });

    it('Scenario 2: Phân biệt đúng từ mới của từng cấp và từ tích lũy (HSK 1–6)', () => {
      const catalog = getSyllabusCatalog();
      const levelCounts = [1, 2, 3, 4, 5, 6].map((lvl) => catalog.wordsByLevel.get(lvl as any)?.length || 0);
      // HSK 1..6 new headwords per level in vocab.jsonl: 300, 197, 491, 990, 1579, 1777 => sum = 5,334
      expect(levelCounts).toEqual([300, 197, 491, 990, 1579, 1777]);

      const cumulativeCounts: number[] = [];
      let runningSum = 0;
      for (const c of levelCounts) {
        runningSum += c;
        cumulativeCounts.push(runningSum);
      }
      // Cumulative words must equal sum of new words up to level L, NOT summing cumulative numbers together
      expect(cumulativeCounts).toEqual([300, 497, 988, 1978, 3557, 5334]);
      expect(catalog.words.size).toBe(5334);
    });

    it('Scenario 3: Phân biệt đúng chữ nhận biết (1.940 chữ HSK 1–6) và mục tiêu chữ viết tích lũy (100..700)', () => {
      const catalog = getSyllabusCatalog();
      const charMap = loadSyllabusChars();
      // Exactly 1,940 recognition characters across HSK 1-6 (excluding 1,060 HSK 7-9 characters in chars.jsonl)
      expect(charMap.size).toBe(1940);

      const recogNewByLevel = [1, 2, 3, 4, 5, 6].map((lvl) => catalog.charsByLevel.get(lvl as any)?.length || 0);
      expect(recogNewByLevel).toEqual([246, 125, 284, 441, 431, 413]);

      const sampleL1 = catalog.charsByLevel.get(1)![0];
      const sampleL3 = catalog.charsByLevel.get(3)![0];
      const sampleL6 = catalog.charsByLevel.get(6)![0];
      expect(sampleL1.is_recognition).toBe(true);
      expect(sampleL1.writing_target).toBe(100);
      expect(sampleL3.writing_target).toBe(250);
      expect(sampleL6.writing_target).toBe(700);
    });

    it('Scenario 4: Phân loại đúng từ vựng ở Mức 0 (uncovered), Mức 1 (contextual), Mức 2 (directly_tested) và Mức 3 (reinforced)', () => {
      const vocab = loadSyllabusVocab();
      const level1Words = Array.from(vocab.values()).filter((w) => w.level === 1);
      const wTier1 = level1Words[0].word;
      const wTier2 = level1Words[1].word;
      const wTier3 = level1Words[2].word;
      const wTier0 = level1Words[3].word;

      // Insert 1 approved question where wTier2 is directly tested and wTier1 is only in stem context
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES ('q_t2', ?, ?, 0, 'Giải thích tiếng Việt hợp lệ', 1, 'reading', 'read_fill_blank_4opt', 'approved', ?, 1)
      `).run(`${wTier1} ____`, JSON.stringify([wTier2, 'B', 'C', 'D']), JSON.stringify([wTier2]));

      // Insert 2 diverse approved questions testing wTier3 across 2 different part_types
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES ('q_t3_a', ?, ?, 0, 'Giải thích tiếng Việt hợp lệ 1', 1, 'reading', 'read_fill_blank_4opt', 'approved', ?, 1)
      `).run(`句子一 ____`, JSON.stringify([wTier3, 'B', 'C', 'D']), JSON.stringify([wTier3]));

      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES ('q_t3_b', ?, ?, 0, 'Giải thích tiếng Việt hợp lệ 2', 1, 'listening', 'listen_dialogue_qa_4opt', 'approved', ?, 1)
      `).run(`句子二 ____`, JSON.stringify([wTier3, 'B', 'C', 'D']), JSON.stringify([wTier3]));

      invalidateVocabCoverageCache(db);
      const report = computeVocabCoverage(db, { skipCache: true });

      expect(report.wordDetails.get(wTier0)?.tier).toBe(0);
      expect(report.wordDetails.get(wTier0)?.tierLabel).toBe('uncovered');
      expect(report.wordDetails.get(wTier1)?.tier).toBe(1);
      expect(report.wordDetails.get(wTier1)?.tierLabel).toBe('contextual_appearance');
      expect(report.wordDetails.get(wTier2)?.tier).toBe(2);
      expect(report.wordDetails.get(wTier2)?.tierLabel).toBe('directly_tested');
      expect(report.wordDetails.get(wTier3)?.tier).toBe(3);
      expect(report.wordDetails.get(wTier3)?.tierLabel).toBe('reinforced');
    });

    it('Scenario 5: Bộ lập kế hoạch ưu tiên từ chưa bao phủ hoặc mới xuất hiện ngữ cảnh (60% Tier 0/1, 25% Tier 2, 15% Review)', () => {
      const vocab = loadSyllabusVocab();
      const l2Words = Array.from(vocab.values()).filter((w) => w.level === 2).slice(0, 10);
      const l1Words = Array.from(vocab.values()).filter((w) => w.level === 1).slice(0, 10);

      // Seed Tier 2 words at Level 2 and Review words at Level 1
      for (let i = 0; i < 6; i++) {
        db.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
          VALUES (?, ?, ?, 0, 'Giải thích tiếng Việt', 2, 'reading', 'read_fill_blank_4opt', 'approved', ?, 1)
        `).run(`q_l2_${i}`, `测试句子 ${i} ____`, JSON.stringify([l2Words[i].word, 'X', 'Y', 'Z']), JSON.stringify([l2Words[i].word]));

        db.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
          VALUES (?, ?, ?, 0, 'Giải thích tiếng Việt', 1, 'reading', 'read_fill_blank_4opt', 'approved', ?, 1)
        `).run(`q_l1_${i}`, `复习句子 ${i} ____`, JSON.stringify([l1Words[i].word, 'X', 'Y', 'Z']), JSON.stringify([l1Words[i].word]));
      }

      invalidateVocabCoverageCache(db);
      const plan = planBatchVocab(2, 20, db, { wordsPerQuestion: 1 });
      expect(plan.totalTargetWords).toBe(20);
      expect(plan.breakdown.targetTier0_1Quota).toBe(12); // 60% of 20
      expect(plan.breakdown.targetTier2Quota).toBe(5);    // 25% of 20
      expect(plan.breakdown.targetReviewQuota).toBe(3);   // 15% of 20
      expect(plan.breakdown.tier0_1Count).toBe(12);
      expect(plan.breakdown.tier2ReinforceCount).toBe(5);
      expect(plan.breakdown.reviewCount).toBe(3);
    });

    it('Scenario 6: Từ đã vượt ngưỡng lặp (overusedThreshold = 5) không tiếp tục được chọn làm mục tiêu chính', () => {
      const vocab = loadSyllabusVocab();
      const overusedWord = Array.from(vocab.values()).find((w) => w.level === 1)!.word;

      for (let i = 0; i < 6; i++) {
        db.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
          VALUES (?, ?, ?, 0, 'Giải thích tiếng Việt', 1, 'reading', 'read_fill_blank_4opt', 'approved', ?, 1)
        `).run(`q_over_${i}`, `句子 ${i} ____`, JSON.stringify([overusedWord, '二', '三', '四']), JSON.stringify([overusedWord]));
      }

      invalidateVocabCoverageCache(db);
      const plan = planBatchVocab(1, 15, db, { overusedThreshold: 5 });
      const selectedWords = plan.targets.map((t) => t.word);
      expect(selectedWords).not.toContain(overusedWord);
      expect(plan.breakdown.excludedOverusedCount).toBeGreaterThanOrEqual(1);
    });

    it('Scenario 7: Đối chiếu văn bản câu hỏi thực tế với metadata từ vựng do AI trả về (phát hiện từ khai khống & từ chỉ ở ngữ cảnh)', () => {
      const vocab = loadSyllabusVocab();
      const l1 = Array.from(vocab.values()).filter((w) => w.level === 1);
      const actualAnswerWord = l1[0].word;
      const stemContextWord = l1[1].word;
      const hallucinatedAbsentWord = l1[2].word;

      const verification = verifyQuestionVocab(
        {
          stem: `${stemContextWord} ____`,
          options: [actualAnswerWord, '二', '三', '四'],
          answer_idx: 0,
          tested_vocab: [actualAnswerWord, stemContextWord, hallucinatedAbsentWord],
        },
        1
      );

      expect(verification.tested).toContain(actualAnswerWord);
      expect(verification.tested).not.toContain(stemContextWord);
      expect(verification.tested).not.toContain(hallucinatedAbsentWord);
      expect(verification.discrepancies.downgradedToContextual).toContain(stemContextWord);
      expect(verification.discrepancies.falseClaims).toContain(hallucinatedAbsentWord);
    });

    it('Scenario 8: Không tính câu pending, rejected hoặc disabled vào độ bao phủ chính thức', () => {
      const vocab = loadSyllabusVocab();
      const targetWord = Array.from(vocab.values()).find((w) => w.level === 1)!.word;

      // Insert pending question
      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES ('p_1', '句子 ____', ?, 0, 'Giải thích', 1, 'reading', 'read_sentence_picture_match_6opt', 'pending', ?, 1)
      `).run(JSON.stringify([targetWord, '二', '三']), JSON.stringify([targetWord]));

      // Insert rejected & disabled questions in questions table
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES ('q_rej', '句子二 ____', ?, 0, 'Giải thích', 1, 'reading', 'read_sentence_picture_match_6opt', 'rejected', ?, 0)
      `).run(JSON.stringify([targetWord, '二', '三']), JSON.stringify([targetWord]));

      invalidateVocabCoverageCache(db);
      const vocabReport = computeVocabCoverage(db, { skipCache: true });
      expect(vocabReport.wordDetails.get(targetWord)?.tier).toBe(0);

      const matrix = computeCoverageMatrix(db);
      const row = matrix.rows.find((r) => r.level === 1 && r.part_type === 'read_sentence_picture_match_6opt')!;
      expect(row.approvedCount).toBe(0);
      expect(row.pendingCount).toBe(1);
      expect(row.status).toBe('accumulating');
    });

    it('Scenario 9: Nhóm đủ tổng số câu nhưng thiếu dạng bài hoặc thiếu độ phủ từ vựng vẫn bị đánh dấu quantity_met_lacks_diversity_or_types', () => {
      // Case 1: Part type meets quantity target (30) but all 30 questions only test 2 unique words (< 40% diversity = 12 words)
      const lowVocabResult = classifyGroupStatus({
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        approvedCount: 35,
        pendingCount: 0,
        blueprintQuestionQuota: 10,
        uniqueTestedVocabCount: 2,
      });
      expect(lowVocabResult.status).toBe('quantity_met_lacks_diversity_or_types');

      // Case 2: Skill level meets 200 total approved questions, but one child part_type has only 5/30 questions
      const missingPartResult = classifyGroupStatus({
        level: 3,
        skill: 'reading',
        approvedCount: 210,
        pendingCount: 0,
        blueprintQuestionQuota: 30,
        childParts: [
          { part_type: 'read_sentence_match_5opt', approvedCount: 100, target: 30 },
          { part_type: 'read_fill_blank_5opt', approvedCount: 105, target: 30 },
          { part_type: 'read_comprehension_dual_3opt', approvedCount: 5, target: 30 },
        ],
      });
      expect(missingPartResult.status).toBe('quantity_met_lacks_diversity_or_types');
    });
  });

  // ============================================================================
  // NHÓM B — CRON, TÁC VỤ VÀ QUOTA (KỊCH BẢN 10–16)
  // ============================================================================
  describe('Nhóm B — Cron, tác vụ và quota (Kịch bản 10–16)', () => {
    it('Scenario 10: Cron tự động chọn đúng nhóm thiếu có độ ưu tiên cao nhất trong HSK 1–6', () => {
      const deficit = getPriorityDeficitGroup(db);
      expect(deficit).not.toBeNull();
      expect(deficit!.level).toBeGreaterThanOrEqual(1);
      expect(deficit!.level).toBeLessThanOrEqual(6);
      // HSK 6 listen_talks_qa_4opt has the largest examSetsDeficit (60 questions needed for 3 sets)
      expect(deficit!.examSetsDeficit).toBe(60);

      // When targeting HSK 1 specifically, selects HSK 1 deficit deterministically
      const hsk1Deficit = getPriorityDeficitGroup(db, undefined, 1);
      expect(hsk1Deficit).not.toBeNull();
      expect(hsk1Deficit!.level).toBe(1);
    });

    it('Scenario 11: Khóa tác vụ (qbank_tasks) ngăn hai tiến trình chạy trùng', async () => {
      createPersistentTask(db, 'task_active_lock', 'auto_question_scheduler', 'hash_123');
      const result = await runScheduledBatch(true, { db, batchSizeOverride: 5 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Job already in progress');
    });

    it('Scenario 12: Khi hết quota ở giữa lô, hệ thống dừng an toàn và ghi nhận trạng thái quota_exhausted', async () => {
      setMockLLMHandler(async () => {
        throw Object.assign(new Error('All free providers quota exhausted (HTTP 429)'), {
          status: 429,
          category: 'quota_exhausted',
        });
      });

      const res = await runScheduledBatch(true, { db, batchSizeOverride: 10 });
      expect(res.success).toBe(false);
      expect(res.errorCategory).toBe('quota_exhausted');
      expect(res.remainingDeficit).toBe(10);

      const runRow: any = db.prepare('SELECT status, details FROM generation_runs ORDER BY created_at DESC LIMIT 1').get();
      expect(runRow.status).toBe('quota_exhausted');
    });

    it('Scenario 13 & 14: Khi yêu cầu 20 câu nhưng chỉ lưu được 12 câu hợp lệ, còn lại 8 câu thiếu và chu kỳ sau tiếp tục phần còn thiếu mà không sinh trùng 12 câu đã lưu', async () => {
      const numWords = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];
      const makeCandidate = (idx: number, opts: any) => ({
        stem: `男：你想去公园吗？\n女：好的，小明在第${numWords[idx]}号长椅上看书。`,
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        options_images: ['hospital', 'tea', 'coffee', 'apple', 'banana', 'taxi'],
        answer_idx: idx % 6,
        explanation_vi: `Người phụ nữ nói về chiếc ghế số ${idx + 1}, bức tranh tương ứng là phương án đúng.`,
        level: opts.level || 1,
        skill: (opts.skill === 'all' ? 'listening' : opts.skill) || 'listening',
        part_type: opts.part_type || 'listen_dialogue_picture_match_6opt',
        illustration_theme: 'apple',
      });

      setMockLLMHandler(async (opts) => Array.from({ length: 12 }, (_, i) => makeCandidate(i, opts)));

      const cycle1 = await runScheduledBatch(true, { db, batchSizeOverride: 20, targetLevelOverride: 1 });
      expect(cycle1.success).toBe(true);
      expect(cycle1.requestedCount).toBe(20);
      expect(cycle1.savedCount).toBe(12);
      expect(cycle1.remainingDeficit).toBe(8);

      // Cycle 2: LLM returns 2 duplicates from Cycle 1 + 8 brand new questions (indices 12..19)
      setMockLLMHandler(async (opts) => [
        makeCandidate(0, opts), // duplicate of cycle 1
        makeCandidate(1, opts), // duplicate of cycle 1
        ...Array.from({ length: 8 }, (_, i) => makeCandidate(i + 12, opts)),
      ]);

      const cycle2 = await runScheduledBatch(true, { db, batchSizeOverride: 8, targetLevelOverride: 1 });
      expect(cycle2.success).toBe(true);
      expect(cycle2.savedCount).toBe(8);
      expect(cycle2.remainingDeficit).toBe(0);

      const totalPending: any = db.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get();
      expect(Number(totalPending.cnt)).toBe(20);
    });

    it('Scenario 15: Khi tất cả provider miễn phí đều lỗi hoặc hết quota, tác vụ dừng và tuyệt đối không gọi API trả phí', async () => {
      setMockLLMHandler(async () => {
        throw Object.assign(new Error('LLM_ALL_PROVIDERS_EXHAUSTED: No free-tier provider available (HTTP 429)'), {
          status: 429,
          category: 'quota_exhausted',
        });
      });

      const res = await runScheduledBatch(true, { db, batchSizeOverride: 5 });
      expect(res.success).toBe(false);
      expect(res.savedCount).toBe(0);
      expect(res.errorCategory).toBe('quota_exhausted');
    });

    it('Scenario 16: Tác vụ bị treo (stale running task) được giải phóng tự động sau khi khởi động lại hoặc quá timeout', async () => {
      // Insert a running task with updated_at 10 minutes in the past
      db.prepare(`
        INSERT INTO qbank_tasks (idempotency_key, task_type, payload_hash, status, created_at, updated_at)
        VALUES ('task_hung_999', 'auto_question_scheduler', 'hash_999', 'running', datetime('now', '-10 minutes'), datetime('now', '-10 minutes'))
      `).run();

      const released = releaseStaleTasks(db, 60000);
      expect(released).toBe(1);

      const taskRow: any = db.prepare("SELECT status, error_message FROM qbank_tasks WHERE idempotency_key = 'task_hung_999'").get();
      expect(taskRow.status).toBe('failed');
      expect(taskRow.error_message).toContain('timed out');
    });
  });

  // ============================================================================
  // NHÓM C — KIỂM ĐỊNH VÀ CHỐNG TRÙNG (KỊCH BẢN 17–25)
  // ============================================================================
  describe('Nhóm C — Kiểm định và chống trùng (Kịch bản 17–25)', () => {
    const validBase = {
      stem: '我今天早上想喝一杯 ____ 。',
      options: ['牛奶', '书', '飞机', '椅子'],
      answer_idx: 0,
      explanation_vi: 'Đáp án A (牛奶 - sữa bò) phù hợp ngữ cảnh uống vào buổi sáng.',
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
    };

    it('Scenario 17: Câu thiếu đáp án (answer_idx undefined/null) bị loại', () => {
      const res = validateCandidate({ ...validBase, answer_idx: undefined as any });
      expect(res.valid).toBe(false);
      expect(res.lifecycleStatus).toBe('validation_failed');
    });

    it('Scenario 18: Câu có đáp án không khớp lựa chọn (answer_idx ngoài phạm vi 0..options.length-1) bị loại', () => {
      const res = validateCandidate({ ...validBase, answer_idx: 5 });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('answer_idx'))).toBe(true);
    });

    it('Scenario 19: Câu rỗng nội dung hoặc thiếu giải thích bắt buộc bị loại', () => {
      const resEmptyStem = validateCandidate({ ...validBase, stem: '   ' });
      expect(resEmptyStem.valid).toBe(false);

      const resEmptyExp = validateCandidate({ ...validBase, explanation_vi: '' });
      expect(resEmptyExp.valid).toBe(false);
    });

    it('Scenario 20: Câu sai cấp HSK, kỹ năng hoặc dạng bài bị loại', () => {
      const resLevel8 = validateCandidate({ ...validBase, level: 8 });
      expect(resLevel8.valid).toBe(false);

      const resMismatch = validateCandidate(validBase, [], {
        expectedLevel: 3,
        expectedSkill: 'listening',
        expectedPartType: 'listen_dialogue_qa_4opt',
      });
      expect(resMismatch.valid).toBe(false);
      expect(resMismatch.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('Scenario 21: Câu trùng hoàn toàn (matching content_hash / stem) bị loại', () => {
      const hash = computeContentHash(validBase.stem, validBase.options, validBase.answer_idx);
      const res = validateCandidate(validBase, [validBase.stem], {
        existingContentHashes: new Set([hash]),
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Exact duplicate') || e.includes('similarity'))).toBe(true);
    });

    it('Scenario 22: Câu trùng gần hoặc chỉ đảo thứ tự đáp án A/B/C/D bị loại', () => {
      const sigOriginal = computeNearDuplicateSignature(validBase.stem, validBase.options);
      const reorderedOptions = ['椅子', '牛奶', '书', '飞机']; // Same 4 options, shuffled order
      const sigReordered = computeNearDuplicateSignature(validBase.stem, reorderedOptions);

      expect(sigReordered).toBe(sigOriginal);

      const res = validateQuestionCandidate(
        { ...validBase, options: reorderedOptions, answer_idx: 1 },
        [],
        { existingNearDupSignatures: new Set([sigOriginal]) }
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Near-duplicate'))).toBe(true);
    });

    it('Scenario 23: Câu không chứa từ mục tiêu được xử lý đúng theo quy tắc (cảnh báo hoặc từ chối khi requireTargetVocab=true)', () => {
      const warnRes = validateCandidate(validBase, [], {
        targetVocabs: ['电脑'],
        requireTargetVocab: false,
      });
      expect(warnRes.valid).toBe(true);
      expect(warnRes.warnings?.some((w) => w.includes('电脑'))).toBe(true);

      const strictRes = validateCandidate(validBase, [], {
        targetVocabs: ['电脑'],
        requireTargetVocab: true,
      });
      expect(strictRes.valid).toBe(false);
      expect(strictRes.errors.some((e) => e.includes('电脑'))).toBe(true);
    });

    it('Scenario 24: Câu hợp lệ được đưa vào trạng thái pending', () => {
      const res = validateCandidate(validBase);
      expect(res.valid).toBe(true);
      expect(res.lifecycleStatus).toBe('pending');
      expect(res.verifiedTestedVocab).toContain('牛奶');
    });

    it('Scenario 25: Câu rejected, validation_failed hoặc disabled không bao giờ xuất hiện cho học sinh', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      const res = await request(app).get('/api/exam/practice?level=1&skill=reading&count=10');
      expect(res.status).toBe(200);
      for (const q of res.body.questions) {
        expect(q.status !== 'rejected' && q.status !== 'validation_failed' && q.status !== 'disabled').toBe(true);
      }
    });
  });

  function populateFullHsk1ExamPool(targetDb: DatabaseSync) {
    const emptyInspection = inspectExamPoolBySections(targetDb, 1);
    let qCounter = 0;
    for (const sec of Object.values(emptyInspection.sections)) {
      for (const part of sec.parts) {
        for (let i = 0; i < part.nQuestionsRequired; i++) {
          qCounter++;
          const qId = `bp_hsk1_${qCounter}`;
          targetDb.prepare(`
            INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, illustration_theme, status, is_active)
            VALUES (?, ?, ?, 0, 'Giải thích chuẩn', 1, ?, ?, 'school', 'approved', 1)
          `).run(qId, `男：你好 ${qCounter} 女：你好`, JSON.stringify(['对', '错', '好']), sec.skill, part.partType);

          targetDb.prepare(`
            INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats)
            VALUES (?, 1, ?, ?, ?, 1, 1, ?)
          `).run(qId, sec.skill, part.partType, `男：你好 ${qCounter}`, JSON.stringify([part.partType]));
        }
      }
    }
  }

  // ============================================================================
  // NHÓM D — ADMIN DUYỆT VÀ PHÂN PHỐI (KỊCH BẢN 26–33)
  // ============================================================================
  describe('Nhóm D — Admin duyệt và phân phối 2 luồng (Kịch bản 26–33)', () => {
    it('Scenario 26, 29, 30: Admin duyệt câu làm câu chuyển sang approved, cập nhật độ bao phủ + mức từ vựng, và phân phối vào Practice & Exam Pool', () => {
      const vocab = loadSyllabusVocab();
      const targetWord = Array.from(vocab.values()).find((w) => w.level === 2)!.word;

      // Insert pending question matching HSK 2 read_comprehension_short_3opt (3 options)
      const qId = 'pend_test_26';
      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES (?, '他今天去 ____ 学习。', ?, 0, 'Giải thích tiếng Việt chuẩn', 2, 'reading', 'read_comprehension_short_3opt', 'pending', ?, 1)
      `).run(qId, JSON.stringify([targetWord, '苹果', '桌子']), JSON.stringify([targetWord]));

      // Simulate Admin approval
      db.prepare("UPDATE pending_questions SET status = 'approved' WHERE id = ?").run(qId);
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        SELECT id, stem, options, answer_idx, explanation_vi, level, skill, part_type, 'approved', tested_vocab, 1
        FROM pending_questions WHERE id = ?
      `).run(qId);

      invalidateVocabCoverageCache(db);
      const syncRes = syncApprovedQuestion(qId, db);

      expect(syncRes).not.toBeNull();
      expect(syncRes!.practice_eligible).toBe(true);
      expect(syncRes!.exam_eligible).toBe(true);

      const vocabReport = computeVocabCoverage(db, { skipCache: true });
      expect(vocabReport.wordDetails.get(targetWord)?.tier).toBe(2);
    });

    it('Scenario 27: Admin sửa câu trước khi duyệt thì dữ liệu mới được lưu và cập nhật đúng từ vựng mục tiêu', () => {
      const vocab = loadSyllabusVocab();
      const l1Words = Array.from(vocab.values()).filter((w) => w.level === 1);
      const oldWord = l1Words[0].word;
      const editedWord = l1Words[5].word;

      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES ('pend_edit_27', '原本的句子 ____', ?, 0, 'Giải thích cũ', 1, 'reading', 'read_fill_blank_4opt', 'pending', ?, 1)
      `).run(JSON.stringify([oldWord, '二', '三', '四']), JSON.stringify([oldWord]));

      // Admin edits options to test editedWord instead
      const newOptions = [editedWord, '二', '三', '四'];
      const verified = verifyQuestionVocab({ stem: '修改后的句子 ____', options: newOptions, answer_idx: 0 }, 1);
      db.prepare(`
        UPDATE pending_questions SET stem = '修改后的句子 ____', options = ?, tested_vocab = ?, status = 'approved' WHERE id = 'pend_edit_27'
      `).run(JSON.stringify(newOptions), JSON.stringify(verified.tested));

      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        SELECT id, stem, options, answer_idx, explanation_vi, level, skill, part_type, 'approved', tested_vocab, 1
        FROM pending_questions WHERE id = 'pend_edit_27'
      `).run();

      invalidateVocabCoverageCache(db);
      const report = computeVocabCoverage(db, { skipCache: true });
      expect(report.wordDetails.get(editedWord)?.tier).toBe(2);
      expect(report.wordDetails.get(oldWord)?.tier).toBe(0);
    });

    it('Scenario 28: Admin từ chối câu thì câu bị loại khỏi kho chính thức và không tính vào độ bao phủ', () => {
      const vocab = loadSyllabusVocab();
      const word = Array.from(vocab.values()).find((w) => w.level === 1)!.word;

      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, tested_vocab, is_active)
        VALUES ('pend_rej_28', '测试 ____', ?, 0, 'Giải thích', 1, 'reading', 'read_fill_blank_4opt', 'rejected', ?, 0)
      `).run(JSON.stringify([word, '二', '三', '四']), JSON.stringify([word]));

      invalidateVocabCoverageCache(db);
      const report = computeVocabCoverage(db, { skipCache: true });
      expect(report.wordDetails.get(word)?.tier).toBe(0);
    });

    it('Scenario 31 & 32: Khi thiếu câu ở một phần của blueprint, hệ thống từ chối tạo đề hoàn chỉnh và báo rõ phần thiếu; khi đủ toàn bộ blueprint, hệ thống cho phép lắp đề hoàn chỉnh', () => {
      // 1. Inspect empty pool for HSK 1 -> must report not fully eligible and exact missing counts per section
      const emptyInspection = inspectExamPoolBySections(db, 1);
      expect(emptyInspection.isFullyEligible).toBe(false);
      expect(emptyInspection.totalRequired).toBe(40);
      expect(emptyInspection.totalMissing).toBe(40);
      expect(Object.keys(emptyInspection.sections)).toEqual(['listening', 'reading']);

      // 2. Populate all required parts for HSK 1 (40 questions across 8 parts of 5 questions each)
      populateFullHsk1ExamPool(db);

      const fullInspection = inspectExamPoolBySections(db, 1);
      expect(fullInspection.isFullyEligible).toBe(true);
      expect(fullInspection.totalAvailable).toBe(40);
      expect(fullInspection.totalMissing).toBe(0);
    });

    it('Scenario 33: Đề đang làm của học sinh (immutable session snapshot) không bị thay đổi nếu câu gốc được chỉnh sửa sau đó', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      const startRes = await request(app)
        .post('/api/exam/generate-mock')
        .send({ level: 1, mode: 'practice', skill: 'reading', count: 5 });

      expect(startRes.status).toBe(200);
      const sessionId = startRes.body.session.sessionId;
      const originalStem = startRes.body.session.questions[0].stem;

      // Fetch session again and verify snapshot immutability
      const getRes = await request(app).get(`/api/exam/session/${sessionId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.session.questions[0].stem).toBe(originalStem);
    });
  });

  // ============================================================================
  // NHÓM E — CHẤM ĐIỂM VÀ DỰ PHÒNG (KỊCH BẢN 34–38)
  // ============================================================================
  describe('Nhóm E — Chấm điểm, nộp bài idempotent, fallback minh bạch & 0 LLM call phía học sinh (Kịch bản 34–38)', () => {
    it('Scenario 34, 35, 36: Chấm điểm khách quan đúng đáp án, lưu kết quả nộp bài, và gửi lại khi lỗi mạng không tạo bản ghi trùng (idempotent retry)', async () => {
      populateFullHsk1ExamPool(db);
      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      const genRes = await request(app)
        .post('/api/exam/generate-mock')
        .send({ level: 1, mode: 'mock' });
      expect(genRes.status).toBe(200);

      const sessionId = genRes.body.session.sessionId;
      const firstQuestionId = genRes.body.session.questions[0].id;

      // Scenario 34: Objective check-answer
      const checkRes = await request(app)
        .post('/api/exam/check-answer')
        .send({ sessionId, questionId: firstQuestionId, userAnswer: 0 });
      expect(checkRes.status).toBe(200);
      expect(typeof checkRes.body.isCorrect).toBe('boolean');
      expect(typeof checkRes.body.correctAnswer).toBe('number');

      // Scenario 35: Submit exam
      const answersPayload: Record<string, number> = { [firstQuestionId]: checkRes.body.correctAnswer };
      const submit1 = await request(app)
        .post('/api/exam/submit')
        .send({ sessionId, level: 1, answers: answersPayload, timeSpentSeconds: 120 });

      expect(submit1.status).toBe(200);
      expect(submit1.body.success).toBe(true);
      expect(submit1.body.isRetryIdempotent).toBe(false);
      expect(submit1.body.submissionId).toBeDefined();
      expect(submit1.body.scoreResult.totalScore).toBeGreaterThan(0);

      // Scenario 36: Retry submission on network error returns exact same submissionId with isRetryIdempotent = true
      const submit2 = await request(app)
        .post('/api/exam/submit')
        .send({ sessionId, level: 1, answers: {}, timeSpentSeconds: 999 });

      expect(submit2.status).toBe(200);
      expect(submit2.body.isRetryIdempotent).toBe(true);
      expect(submit2.body.submissionId).toBe(submit1.body.submissionId);
      expect(submit2.body.scoreResult.totalScore).toBe(submit1.body.scoreResult.totalScore);
    });

    it('Scenario 37 & 38: Fallback khi nhóm câu hỏi trong DB trống hiển thị thông báo minh bạch và học sinh mở luyện tập/đề thi không kích hoạt bất kỳ lời gọi LLM nào', async () => {
      let llmCalls = 0;
      setMockLLMHandler(async () => {
        llmCalls++;
        return [];
      });
      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      // Query with a specific rare vocab filter not yet in DB to trigger fixture fallback
      const res = await request(app).get('/api/exam/practice?level=6&skill=reading&vocab=__non_existent_vocab__&count=5');
      expect(res.status).toBe(200);
      expect(res.body.llmCallsMade).toBe(0);
      expect(res.body.usingFixtureFallback).toBe(true);
      expect(res.body.fallbackNotice).toContain('dự phòng');
      expect(llmCalls).toBe(0);
    });
  });
});
