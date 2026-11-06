import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  examRouter,
  clearAllSessionsForTesting,
  assembleBlueprintExamFromDb,
  ExamQuestionItem,
  createTestExamDb,
  setExamDbForTesting,
} from '../src/server/examRoutes';
import {
  validateGeneratedQuestion,
  getExpectedOptionCount,
} from '../src/server/llm/questionValidator';
import {
  isOpenEndedWritingTask,
  buildHskPrompt,
} from '../src/server/llm/promptTemplates';
import { ensureEligiblePoolSchema, loadBlueprintData } from '../src/server/qbankFormatSync';
import { getMockExamQuestions } from '../src/data/hskMockExamFixtures';

describe('Phase 6 Milestone M2: Special Question Structures & Strict Mock Exam Generation', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;
  let memDb: DatabaseSync;

  const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');

  beforeAll(async () => {
    memDb = createTestExamDb({ seedPool: true });
    setExamDbForTesting(memDb);

    app = express();
    app.use(express.json());
    app.use('/api/exam', examRouter);

    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address() as any;
    baseUrl = `http://127.0.0.1:${address.port}/api/exam`;
  });

  afterAll(async () => {
    clearAllSessionsForTesting();
    setExamDbForTesting(null);
    try {
      memDb.close();
    } catch {}
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  async function postJson(endpoint: string, body: any) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const status = res.status;
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status, json };
  }

  // =========================================================================
  // 1. STRICT BLUEPRINT ENFORCEMENT & SHORTAGE REJECTION (NO SILENT FALLBACK)
  // =========================================================================
  describe('1. Official Mock Shortage Rejection (HTTP 400 & Structured Breakdown)', () => {
    it('rejects official mock exam request with HTTP 400 when DB pool is insufficient', async () => {
      // Level 1 requires 40 questions (20 Listening, 20 Reading). DB pool has insufficient approved exam-eligible items.
      const { status, json } = await postJson('/generate-mock', { level: 1, mode: 'mock' });

      expect(status).toBe(400);
      expect(json).toBeDefined();
      expect(json.success).toBe(false);
      expect(json.mode).toBe('mock');
      expect(json.level).toBe(1);
      expect(json.is_fully_eligible).toBe(false);
      expect(typeof json.total_required).toBe('number');
      expect(typeof json.total_available).toBe('number');
      expect(typeof json.total_missing).toBe('number');
      expect(json.total_missing).toBeGreaterThan(0);
      expect(json.sections).toBeDefined();
      expect(json.error).toBe(
        `Kho câu hỏi HSK 1 chưa đủ điều kiện tạo đề thi chính thức: còn thiếu ${json.total_missing} câu theo chuẩn blueprint.`
      );
    });

    it('rejects mock mode across levels 2 to 6 with structured shortages', async () => {
      for (const lvl of [2, 3, 4, 5, 6]) {
        const { status, json } = await postJson('/generate-mock', { level: lvl, mode: 'mock' });
        expect(status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.mode).toBe('mock');
        expect(json.level).toBe(lvl);
        expect(json.is_fully_eligible).toBe(false);
        expect(json.error).toContain(`Kho câu hỏi HSK ${lvl} chưa đủ điều kiện tạo đề thi chính thức`);
      }
    });

    it('never blends DB questions with fixture items to disguise shortages in mock mode', async () => {
      const { status, json } = await postJson('/generate-mock', { level: 1, mode: 'mock', strict: false });
      // Even with strict: false passed, mode === 'mock' must strictly reject rather than mixing fixtures
      expect(status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. EXPLICIT FIXTURE DEMO / FALLBACK MODE
  // =========================================================================
  describe('2. Explicit Fixture Demo / Fallback Mode with Metadata Labels', () => {
    it('allows fixture fallback ONLY when explicitly requested with allowFixtures: true', async () => {
      const { status, json } = await postJson('/generate-mock', {
        level: 1,
        mode: 'mock',
        allowFixtures: true,
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dataSource).toBe('fixture');
      expect(json.usingFixtureFallback).toBe(true);
      expect(json.isFixtureDemo).toBe(true);
      expect(typeof json.fallbackNotice).toBe('string');
      expect(json.fallbackNotice).toContain('Đề thi mẫu demo');
      expect(Array.isArray(json.questions)).toBe(true);
      expect(json.questions.length).toBe(40);
    });

    it('generates fixture exam when mode === "fixture_demo"', async () => {
      const { status, json } = await postJson('/generate-mock', {
        level: 2,
        mode: 'fixture_demo',
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dataSource).toBe('fixture');
      expect(json.usingFixtureFallback).toBe(true);
      expect(json.isFixtureDemo).toBe(true);
      expect(Array.isArray(json.questions)).toBe(true);
      expect(json.questions.length).toBe(60);
    });
  });

  // =========================================================================
  // 3. SHARED-PASSAGE GROUPS (HSK 5-6) ATOMIC ASSEMBLY
  // =========================================================================
  describe('3. Shared-Passage Question Groups (HSK 5-6) Atomic Assembly', () => {
    it('assembles shared-passage sub-questions atomically without splitting them', () => {
      const bp5 = loadBlueprintData(5);
      expect(bp5).toBeDefined();

      const candidateQuestions: ExamQuestionItem[] = [];

      // 1. Listening Part 1 (19 questions) & Part 2 (16 questions)
      for (let i = 1; i <= 19; i++) {
        candidateQuestions.push({
          id: `h5-L1-${i}`,
          level: 5,
          section: 'listening',
          part_type: 'listen_dialogue_qa_4opt',
          item_number: 0,
          stem: `听力第一部分第${i}题题干`,
          options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
          answer_index: 0,
          explanation_vi: 'Giải thích câu nghe 1',
        });
      }
      for (let i = 1; i <= 16; i++) {
        candidateQuestions.push({
          id: `h5-L2-${i}`,
          level: 5,
          section: 'listening',
          part_type: 'listen_talks_qa_4opt',
          item_number: 0,
          stem: `听力第二部分第${i}题题干`,
          options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
          answer_index: 1,
          explanation_vi: 'Giải thích câu nghe 2',
        });
      }

      // 2. Reading Part 1 (10 questions) & Part 2 (10 questions)
      for (let i = 1; i <= 10; i++) {
        candidateQuestions.push({
          id: `h5-R1-${i}`,
          level: 5,
          section: 'reading',
          part_type: 'read_cloze_passages_4opt',
          item_number: 0,
          stem: `阅读完形填空第${i}题`,
          options: ['A. 调查', 'B. 坚持', 'C. 考虑', 'D. 决定'],
          answer_index: 2,
          explanation_vi: 'Giải thích điền từ',
        });
      }
      for (let i = 1; i <= 10; i++) {
        candidateQuestions.push({
          id: `h5-R2-${i}`,
          level: 5,
          section: 'reading',
          part_type: 'read_paragraph_sentence_ordering',
          item_number: 0,
          stem: `段落语句排序第${i}题`,
          options: ['A. 句1', 'B. 句2', 'C. 句3', 'D. 句4', 'E. 句5'],
          answer_index: 0,
          explanation_vi: 'Giải thích sắp xếp câu',
        });
      }

      // 3. Reading Part 3 (15 questions across 4 shared-passage groups)
      const p3Type = 'read_comprehension_long_articles_4opt';
      const passageA = '篇章A：关于人工智能在医学影像诊断中的前沿突破与临床转化路径探讨。';
      const passageB = '篇章B：中国传统茶文化在现代都市生活中的演进与青年群体的认同重塑。';
      const passageC = '篇章C：深海生态系统中的热液生物群落生存机制与生物多样性保护策略。';
      const passageD = '篇章D：数字化时代纸质阅读与电子阅读在认知心理学层面的深度对比。';

      const passAQuestions: ExamQuestionItem[] = [1, 2, 3, 4].map((idx) => ({
        id: `h5-passA-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章A关于人工智能的问题第${idx}题`,
        passage: passageA,
        options: ['A. 诊断效率', 'B. 医疗费用', 'C. 医生培训', 'D. 药品研发'],
        answer_index: (idx - 1) % 4,
        explanation_vi: `Giải thích đoạn A câu ${idx}`,
      }));

      const passBQuestions: ExamQuestionItem[] = [1, 2, 3, 4].map((idx) => ({
        id: `h5-passB-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章B关于茶文化的问题第${idx}题`,
        passage: passageB,
        options: ['A. 自然和谐', 'B. 商业贸易', 'C. 种植技术', 'D. 国际出口'],
        answer_index: (idx - 1) % 4,
        explanation_vi: `Giải thích đoạn B câu ${idx}`,
      }));

      const passCQuestions: ExamQuestionItem[] = [1, 2, 3, 4].map((idx) => ({
        id: `h5-passC-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章C关于深海探测的问题第${idx}题`,
        passage: passageC,
        options: ['A. 地壳运动', 'B. 洋流变化', 'C. 矿产开发', 'D. 航运交通'],
        answer_index: (idx - 1) % 4,
        explanation_vi: `Giải thích đoạn C câu ${idx}`,
      }));

      const passDQuestions: ExamQuestionItem[] = [1, 2, 3].map((idx) => ({
        id: `h5-passD-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章D关于数字阅读的问题第${idx}题`,
        passage: passageD,
        options: ['A. 深度理解', 'B. 携带方便', 'C. 购买快捷', 'D. 环保节省'],
        answer_index: (idx - 1) % 4,
        explanation_vi: `Giải thích đoạn D câu ${idx}`,
      }));

      // 4. Writing Tasks (2 questions)
      const writingQuestions: ExamQuestionItem[] = [
        {
          id: 'h5-W1-1',
          level: 5,
          section: 'writing',
          part_type: 'write_story_from_4pictures_100chars',
          item_number: 0,
          stem: '结合4幅连环画写短文',
          options: [],
          answer_index: 0,
          explanation_vi: 'Viết truyện 100 chữ',
        },
        {
          id: 'h5-W2-1',
          level: 5,
          section: 'writing',
          part_type: 'write_topic_essay_200chars',
          item_number: 0,
          stem: '根据【经验、坚持、挑战、成功】写议论文',
          options: [],
          answer_index: 0,
          explanation_vi: 'Viết bài luận 200 chữ',
        },
      ];

      // Deliberately interleave Reading 3 sub-questions from different passages
      const interleavedPassages = [
        passAQuestions[0],
        passBQuestions[0],
        passCQuestions[0],
        passDQuestions[0],
        passAQuestions[1],
        passBQuestions[1],
        passCQuestions[1],
        passDQuestions[1],
        passAQuestions[2],
        passBQuestions[2],
        passCQuestions[2],
        passDQuestions[2],
        passAQuestions[3],
        passBQuestions[3],
        passCQuestions[3],
      ];

      const allCandidates = [
        ...candidateQuestions,
        ...interleavedPassages,
        ...writingQuestions,
      ];

      // Create authentic in-memory SQLite database populated with exam_eligible_pool records
      const mockDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(mockDb);

      const insertStmt = mockDb.prepare(`
        INSERT INTO exam_eligible_pool (
          question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats
        ) VALUES (?, ?, ?, ?, ?, 1, 1, '[]')
      `);

      for (const q of allCandidates) {
        insertStmt.run(q.id, q.level, q.section.toLowerCase(), q.part_type, q.stem);
      }

      // AUTHENTICALLY invoke assembleBlueprintExamFromDb
      const assemblyResult = assembleBlueprintExamFromDb(5, allCandidates, mockDb);

      // Verify complete full mock exam generated
      expect(assemblyResult.isComplete).toBe(true);
      expect(assemblyResult.questions.length).toBe(72);

      // Verify each passage group is assembled contiguously and atomically
      for (const [passName, passText, expectedCount] of [
        ['Passage A', passageA, 4],
        ['Passage B', passageB, 4],
        ['Passage C', passageC, 4],
        ['Passage D', passageD, 3],
      ] as const) {
        const assembledGroup = assemblyResult.questions.filter((q) => q.passage === passText);
        expect(assembledGroup.length).toBe(expectedCount);

        const indices = assembledGroup.map((q) => assemblyResult.questions.indexOf(q));
        for (let k = 0; k < indices.length - 1; k++) {
          expect(indices[k + 1]).toBe(indices[k] + 1);
        }
      }

      mockDb.close();
    });
  });

  // =========================================================================
  // 4. 5-QUESTION SHARED 6-WORD BANK A-F (HSK 1-4)
  // =========================================================================
  describe('4. 5-Question Shared 6-Word Bank A-F Structure (HSK 1-4)', () => {
    it('verifies HSK 1 Part 3 6-word bank fixtures have 6 cohesive options (A-F)', () => {
      const hsk1Questions = getMockExamQuestions(1);
      const wordBankQuestions = hsk1Questions.filter(
        (q) => q.part_type === 'read_fill_blank_word_bank_6opt'
      );

      expect(wordBankQuestions.length).toBe(5);
      for (const q of wordBankQuestions) {
        expect(q.options.length).toBe(6);
        expect(q.options[0]).toMatch(/^A\./);
        expect(q.options[1]).toMatch(/^B\./);
        expect(q.options[2]).toMatch(/^C\./);
        expect(q.options[3]).toMatch(/^D\./);
        expect(q.options[4]).toMatch(/^E\./);
        expect(q.options[5]).toMatch(/^F\./);
        expect(q.answer_index).toBeGreaterThanOrEqual(0);
        expect(q.answer_index).toBeLessThanOrEqual(5);
      }
    });

    it('scores student answer correctly whether passed as letter string or numeric index', async () => {
      // Generate a demo session to test scoring on word bank
      const { json: session } = await postJson('/generate-mock', {
        level: 1,
        mode: 'fixture_demo',
      });
      expect(session.sessionId).toBeDefined();

      const q31 = session.questions.find((q: any) => q.item_number === 31);
      expect(q31).toBeDefined();
      expect(q31.options.length).toBe(6);

      // Check answer with letter string (e.g. 'C')
      const origQ31 = getMockExamQuestions(1).find((q) => q.item_number === 31 || q.id === q31.id)!;
      const correctLetter = String.fromCharCode(65 + origQ31.answer_index);
      const { status: checkStatus, json: checkResult } = await postJson('/check-answer', {
        sessionId: session.sessionId,
        questionId: q31.id,
        userAnswer: correctLetter,
      });

      expect(checkStatus).toBe(200);
      expect(checkResult.success).toBe(true);
      expect(checkResult.isCorrect).toBe(true);
      expect(checkResult.correctAnswer).toBe(origQ31.answer_index);
    });
  });

  // =========================================================================
  // 5. WRITING TASKS (HSK 1-6) DE-COERCION & 0-OPTION SUPPORT
  // =========================================================================
  describe('5. Writing Tasks De-coercion & Zero-Option Support', () => {
    it('getExpectedOptionCount returns 0 for all open-ended writing types', () => {
      const writingTypes = [
        'write_tianzige_from_pinyin',
        'write_sentence_from_picture_word',
        'write_short_essay_80chars',
        'write_topic_essay_200chars',
        'write_topic_essay_300chars',
        'write_story_from_4pictures_100chars',
        'write_summary_shortening_400chars',
      ];

      for (const pt of writingTypes) {
        expect(getExpectedOptionCount(pt)).toBe(0);
      }
    });

    it('isOpenEndedWritingTask correctly identifies all writing types and rejects MCQs', () => {
      expect(isOpenEndedWritingTask('write_tianzige_from_pinyin')).toBe(true);
      expect(isOpenEndedWritingTask('write_topic_essay_200chars')).toBe(true);
      expect(isOpenEndedWritingTask('write_summary_shortening_400chars')).toBe(true);
      expect(isOpenEndedWritingTask('read_comprehension_short_3opt')).toBe(false);
      expect(isOpenEndedWritingTask('listen_sentence_true_false')).toBe(false);
      expect(isOpenEndedWritingTask(undefined)).toBe(false);
    });

    it('questionValidator validates open-ended writing task with 0 options cleanly', () => {
      const essayQuestion = {
        id: 'val-writing-01',
        level: 5,
        skill: 'writing' as const,
        part_type: 'write_topic_essay_200chars',
        stem: '请结合所给词语写一篇200字左右的短文：【成功、坚持、经验、挑战】',
        options: [],
        answer_idx: 0,
        explanation_vi: 'Viết bài văn ngắn 200 chữ kết hợp 4 từ khóa đã cho.',
        tested_vocab: ['成功', '坚持', '经验', '挑战'],
      };

      const result = validateGeneratedQuestion(essayQuestion, {
        level: 5,
        skill: 'writing',
        part_type: 'write_topic_essay_200chars',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('buildHskPrompt does not coerce 4 options for open-ended writing tasks', () => {
      const prompt = buildHskPrompt(
        5,
        'writing',
        1,
        [{ id: '1', word: '成功', pinyin: 'chénggōng', level: 5 }],
        'write_topic_essay_200chars',
        'life_attitude'
      );

      expect(prompt).toContain('"options" MUST be an empty array []');
      expect(prompt).not.toContain('tạo chính xác 4 phương án lựa chọn');
      expect(prompt).not.toContain('3 phương án nhiễu');
    });

    it('exam submission scores student writing draft without requiring studentAns === q.answer_index', async () => {
      // Create session in demo mode
      const { json: session } = await postJson('/generate-mock', {
        level: 2,
        mode: 'fixture_demo',
      });

      const writingQ = session.questions.find((q: any) => q.section === 'writing');
      expect(writingQ).toBeDefined();

      // Submit exam with typed text draft for writing task
      const answers: Record<string, any> = {};
      const origLevel2 = getMockExamQuestions(2);
      session.questions.forEach((q: any) => {
        if (q.section === 'writing') {
          answers[q.id] = '爸爸去商店买苹果。';
        } else {
          const orig = origLevel2.find((o) => o.id === q.id);
          answers[q.id] = orig ? orig.answer_index : 0;
        }
      });

      const { status: submitStatus, json: submitResult } = await postJson('/submit', {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: 600,
      });

      expect(submitStatus).toBe(200);
      expect(submitResult.success).toBe(true);
      expect(submitResult.scoreResult).toBeDefined();
      expect(submitResult.scoreResult.sectionScores.writing).toBeDefined();
      expect(submitResult.scoreResult.sectionScores.writing.score).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 6. DATABASE INTEGRITY INVARIANTS
  // =========================================================================
  describe('6. Database Integrity Invariants (Zero Corruption / Zero Rogue Migrations)', () => {
    it('data/hsk_exam.db SHA-256 hash strictly matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      expect(fs.existsSync(hskExamDbPath)).toBe(true);
      const buffer = fs.readFileSync(hskExamDbPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('data/qbank/qbank.db table count remains strictly 12 (11 user tables + sqlite_sequence)', () => {
      expect(fs.existsSync(qbankDbPath)).toBe(true);
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC")
        .all() as { name: string }[];
      db.close();

      expect(tables.length).toBe(12);
      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toEqual([
        'exam_eligible_pool',
        'exam_sessions',
        'generation_history',
        'generation_runs',
        'pending_questions',
        'qb_export_log',
        'qb_questions',
        'qb_reports',
        'qb_sync_log',
        'qbank_tasks',
        'questions',
        'sqlite_sequence',
      ]);
    });
  });
});
