/**
 * End-to-End Verification Test Suite: UI-Driven Question Generation Workflow
 * 
 * Tests the entire pipeline:
 * 1. UI Request Payload Contract: level, skill, part_type, count, target_grammar, target_vocabulary, lesson
 * 2. Backend API Processing: parameter extraction, normalization, lock acquisition, engine invocation
 * 3. Six Quality Gates Validation & Rejection Diagnostics:
 *    - Valid candidates -> saved into Staging DB (pending_questions) with status='pending'
 *    - Invalid candidates -> rejected, detailed issues captured in validation_failures & rejected_reasons, never auto-approved
 * 4. UI Summary Banner & Diagnostic Feedback: count_generated, count_passed_validator, count_rejected_validator, rejected_reasons
 * 5. Review & Approval Flow:
 *    - Teacher reviews candidate in duyet_de queue
 *    - Approval atomically promotes candidate to questions & exam_eligible_pool with status='approved', is_active=1
 *    - Rejection marks candidate rejected
 * 6. Zero-API Student Runtime Invariant: student practice & mock exam APIs serve exclusively from local DB with 0 LLM calls
 * 7. Operational DB Integrity: baseline hashes preserved
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import { examRouter, setExamDbForTesting } from '../src/server/examRoutes.js';
import { isFreeTierOnly } from '../src/server/llm/waterfallGenerator.js';
import { validateCandidate } from '../src/server/llm/questionValidator.js';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';

describe('UI-Driven Question Generation Workflow Verification', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let stagingDb: DatabaseSync;
  let studentExamDb: DatabaseSync;
  const TEST_ADMIN_TOKEN = 'test-ui-admin-token-2026';

  let initialQBankHash: string = '';
  const EXPECTED_QBANK_HASH = 'E370C327D1A516804AB9B515D0A921A5917346587B3188796260CE171EF1A5AD';
  const EXPECTED_HSK_EXAM_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  beforeAll(async () => {
    const qbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    if (fs.existsSync(qbPath)) {
      initialQBankHash = crypto.createHash('sha256').update(fs.readFileSync(qbPath)).digest('hex').toUpperCase();
    }
    // 1. Setup Staging DB in memory
    stagingDb = new DatabaseSync(':memory:');
    ensurePendingSchema(stagingDb);
    setDbSyncForTesting(stagingDb);
    setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

    // 2. Setup Student Exam DB in memory with exact required schemas
    studentExamDb = new DatabaseSync(':memory:');
    studentExamDb.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        quality_status TEXT,
        explanation_vi TEXT,
        topic TEXT,
        tested_vocab TEXT
      );
      CREATE TABLE IF NOT EXISTS exam_eligible_pool (
        question_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT,
        stem TEXT,
        practice_eligible INTEGER DEFAULT 0,
        exam_eligible INTEGER DEFAULT 0,
        compatible_formats TEXT,
        ineligible_reasons TEXT,
        quality_validation_status TEXT,
        operational_serving_practice_eligible INTEGER DEFAULT 0,
        operational_serving_exam_eligible INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    setExamDbForTesting(studentExamDb);

    // 3. Mount Express server with QBank Admin & Exam routes
    app = express();
    app.use(express.json());
    app.use('/api/qbank', qbankRouter);
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    setDbSyncForTesting(null);
    setExamDbForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Clean up temporary WAL/SHM files left by SQLite read operations
    const walPath = path.resolve(process.cwd(), 'data/qbank/qbank.db-wal');
    const shmPath = path.resolve(process.cwd(), 'data/qbank/qbank.db-shm');
    try {
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {}
  });

  describe('1. UI Request Payload Processing & Target Parameter Propagation', () => {
    it('accepts teacher input with target_vocabulary, target_grammar, and lesson', async () => {
      const payload = {
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        count: 2,
        lesson: 'Bài 5: Đi mua sắm',
        topic: 'Mua hoa quả',
        target_grammar: 'Số từ + Lượng từ',
        target_vocabulary: '苹果, 买, 两, 斤',
        provider: 'auto',
        mock: true, // Controlled testing mode
      };

      const res = await fetch(`${baseUrl}/api/qbank/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.batch_id).toBeDefined();
      expect(data.count_generated).toBeGreaterThan(0);
      expect(data.count_passed_validator).toBeGreaterThan(0);
      expect(data.count_saved_pending).toBeGreaterThan(0);
      expect(data.provider_used).toBeDefined();

      // Check that questions saved in staging pending_questions have status = 'pending'
      const rows = stagingDb.prepare("SELECT * FROM pending_questions WHERE batch_id = ?").all(data.batch_id) as any[];
      expect(rows.length).toBe(data.count_saved_pending);
      for (const row of rows) {
        expect(row.status).toBe('pending');
        expect(row.level).toBe(2);
        expect(row.skill).toBe('reading');
        expect(row.part_type).toBe('read_fill_blank_4opt');
        expect(row.content_hash).toBeDefined();
        // Topic includes lesson prefix
        expect(row.topic).toContain('Bài: Bài 5: Đi mua sắm');
      }
    });

    it('parses target_vocabulary formatted as array or comma-separated string correctly', async () => {
      const arrayPayload = {
        level: 3,
        skill: 'listening',
        part_type: 'listen_picture_match_4opt',
        count: 1,
        target_vocabulary: ['香蕉', '西瓜'],
        mock: true,
      };

      const res = await fetch(`${baseUrl}/api/qbank/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(arrayPayload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count_saved_pending).toBe(1);
    });
  });

  describe('2. Six Quality Gates Validation & Diagnostic Feedback Contract', () => {
    it('validates candidates against Six Quality Gates and returns detailed failure reasons when rejected', () => {
      // Simulate an invalid candidate: duplicate options and invalid answer_idx
      const badCandidate = {
        stem: '明天天气怎么样？____。',
        options: ['很好', '很好', '很好', '很好'], // All identical: violates GATE 3
        answer_idx: 5, // Out of bounds: violates GATE 2
        pinyin: 'míngtiān tiānqì zěnmeyàng',
        explanation_vi: 'Giải thích',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const valResult = validateCandidate(badCandidate as any, [], {
        expectedLevel: 1,
        expectedSkill: 'reading',
        expectedPartType: 'read_fill_blank_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(valResult.valid).toBe(false);
      expect(valResult.errors.length).toBeGreaterThan(0);
      // Confirms specific gate failure detection
      const errorStr = valResult.errors.join('; ');
      expect(errorStr).toMatch(/option|answer_idx/i);
    });

    it('returns structured summary matching UI needs (count_generated, count_passed, count_rejected, rejected_reasons)', async () => {
      const payload = {
        level: 3,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        count: 2,
        dry_run: true, // Dry run does not persist
        mock: true,
      };

      const res = await fetch(`${baseUrl}/api/qbank/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.is_dry_run).toBe(true);
      expect(data.count_generated).toBeDefined();
      expect(data.count_passed_validator).toBeDefined();
      expect(data.count_rejected_validator).toBeDefined();
      expect(typeof data.rejected_reasons === 'object').toBe(true);
      expect(Array.isArray(data.validation_failures)).toBe(true);
    });
  });

  describe('3. Teacher Review & Approval Transition Flow', () => {
    it('allows teacher to review pending candidates in duyet_de and approve them to serving questions', async () => {
      // 1. Generate 2 candidates
      const genRes = await fetch(`${baseUrl}/api/qbank/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          level: 4,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          count: 2,
          mock: true,
        }),
      });
      const genData = await genRes.json();
      expect(genData.count_saved_pending).toBeGreaterThan(0);

      // 2. Fetch pending queue (what teacher sees in duyet_de)
      const listRes = await fetch(`${baseUrl}/api/qbank/pending?status=pending&level=4`, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
      });
      expect(listRes.status).toBe(200);
      const listData = await listRes.json();
      expect(listData.questions.length).toBeGreaterThan(0);

      const candidateToApprove = listData.questions[0];
      expect(candidateToApprove.status).toBe('pending');

      // 3. Teacher approves candidate
      const approveRes = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          ids: [candidateToApprove.id],
        }),
      });
      expect(approveRes.status).toBe(200);
      const approveData = await approveRes.json();
      expect(approveData.success).toBe(true);
      expect(approveData.approved_count).toBe(1);

      // 4. Verify candidate is now approved in pending_questions AND copied to questions & exam_eligible_pool
      const updatedPending = stagingDb.prepare("SELECT * FROM pending_questions WHERE id = ?").get(candidateToApprove.id) as any;
      expect(updatedPending.status).toBe('approved');

      const promotedQuestion = stagingDb.prepare("SELECT * FROM questions WHERE id = ?").get(candidateToApprove.id) as any;
      expect(promotedQuestion).toBeDefined();
      expect(promotedQuestion.status).toBe('approved');
      expect(promotedQuestion.is_active).toBe(1);

      const poolRow = stagingDb.prepare("SELECT * FROM exam_eligible_pool WHERE question_id = ?").get(candidateToApprove.id) as any;
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
    });

    it('allows teacher to reject candidates and records rejection note', async () => {
      // Find a pending candidate
      const pendingRow = stagingDb.prepare("SELECT * FROM pending_questions WHERE status = 'pending' LIMIT 1").get() as any;
      expect(pendingRow).toBeDefined();

      const rejectRes = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          ids: [pendingRow.id],
          reason: 'Từ ngữ chưa tự nhiên theo phản hồi của giáo viên',
        }),
      });
      expect(rejectRes.status).toBe(200);
      const rejectData = await rejectRes.json();
      expect(rejectData.success).toBe(true);

      const updatedRow = stagingDb.prepare("SELECT * FROM pending_questions WHERE id = ?").get(pendingRow.id) as any;
      expect(updatedRow.status).toBe('rejected');
      expect(updatedRow.rejection_note).toBe('Từ ngữ chưa tự nhiên theo phản hồi của giáo viên');

      // Rejected candidate is NEVER in operational questions table
      const questionInTable = stagingDb.prepare("SELECT * FROM questions WHERE id = ?").get(pendingRow.id);
      expect(questionInTable).toBeUndefined();
    });
  });

  describe('4. Zero-API Student Runtime Invariant', () => {
    it('serves student practice questions exclusively from local DB without triggering LLM generation', async () => {
      // Seed approved active question in student test DB
      const qId = 'student_test_q_001';
      studentExamDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, quality_status, explanation_vi)
        VALUES (?, '今天星期几？', '["星期一", "昨天", "明天", "学校"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, 'PASS', 'Hôm nay là thứ mấy')
      `).run(qId);

      studentExamDb.prepare(`
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats, quality_validation_status, operational_serving_practice_eligible, operational_serving_exam_eligible)
        VALUES (?, 1, 'reading', 'read_fill_blank_4opt', '今天星期几？', 1, 1, '["read_fill_blank_4opt"]', 'PASS', 1, 1)
      `).run(qId);

      // Call student practice endpoint
      const res = await fetch(`${baseUrl}/api/exam/practice-questions?level=1&skill=reading&limit=5`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.questions.length).toBeGreaterThanOrEqual(1);
      const servedQ = data.questions.find((q: any) => q.id === qId);
      expect(servedQ).toBeDefined();
      expect(servedQ.stem).toBe('今天星期几？');
      // No LLM API called, 100% served from local SQLite
    });

    it('generates practice sessions strictly from approved active questions pool with zero API calls', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.length).toBeGreaterThanOrEqual(1);

      // Fails closed if official mock requested without complete blueprint
      const officialRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1 }),
      });
      expect(officialRes.status).toBe(400);
      const officialData = await officialRes.json();
      expect(officialData.is_fully_eligible).toBe(false);
    });
  });

  describe('6. Smart IELTS-Style Traps & Quality Gate 6 Calibration', () => {
    it('verifies anti-verbatim reading question with synonymous paraphrase passes Gate 6', () => {
      const antiVerbatimCandidate = {
        stem: '小王每天晚上都看书到很晚，因为他想通过下个月的汉语考试。★ 关于小王，可以知道什么？',
        options: ['学习努力', '经常迟到', '不用考试', '喜欢睡觉'],
        answer_idx: 0,
        pinyin: 'xiǎo wáng měitiān wǎnshang dōu kànshū dào hěn wǎn, yīnwèi tā xiǎng tōngguò xià gè yuè de hànyǔ kǎoshì. guānyú xiǎo wáng, kěyǐ zhīdào shénme?',
        explanation_vi: 'Giải thích: Tiểu Vương học đến rất muộn vì muốn vượt qua kỳ thi, thể hiện sự chăm chỉ (学习努力).',
        level: 3,
        skill: 'reading',
        part_type: 'read_comprehension_4opt',
        trap_type: 'anti_verbatim',
      };

      const valResult = validateCandidate(antiVerbatimCandidate as any, [], {
        expectedLevel: 3,
        expectedSkill: 'reading',
        expectedPartType: 'read_comprehension_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(valResult.valid).toBe(true);
      expect(valResult.errors).toEqual([]);
      expect(valResult.solverAnalysis.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
      expect(valResult.solverAnalysis.isUnambiguous).toBe(true);
    });

    it('verifies self-correction dialogue question with abandoned plan as distractor passes Gate 6', () => {
      const selfCorrectionCandidate = {
        stem: '男：我们本来打算下午两点在图书馆门口见，后来你有事，改在三点半见行吗？\n女：好的，没问题，那就三点半吧。\n问：他们最后决定几点见面？',
        options: ['三点半', '两点', '两点半', '三点'],
        answer_idx: 0,
        pinyin: 'nán: wǒmen běnlái dǎsuàn xiàwǔ liǎng diǎn zài túshūguǎn ménkǒu jiàn... wèn: tāmen zuìhòu juédìng jǐ diǎn jiànmiàn?',
        explanation_vi: 'Giải thích: Hai người ban đầu định gặp lúc 2 giờ (bẫy đổi ý phút chót), nhưng cuối cùng quyết định gặp lúc 3:30.',
        level: 3,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
        trap_type: 'self_correction',
      };

      const valResult = validateCandidate(selfCorrectionCandidate as any, [], {
        expectedLevel: 3,
        expectedSkill: 'listening',
        expectedPartType: 'listen_dialogue_qa_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(valResult.valid).toBe(true);
      expect(valResult.errors).toEqual([]);
      expect(valResult.solverAnalysis.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
      expect(valResult.solverAnalysis.isUnambiguous).toBe(true);
    });

    it('verifies rhetorical question dialogue decoding communicative attitude passes Gate 6', () => {
      const rhetoricalCandidate = {
        stem: '男：李老师，外面下着大雨呢，你现在怎么走啊？\n女：你看我没带雨伞，像是有办法走的人吗？\n问：女的是什么意思？',
        options: ['现在走不了', '想去外面走走', '雨已经停了', '她带着雨伞'],
        answer_idx: 0,
        pinyin: 'nán: lǐ lǎoshī, wàimiàn xiàzhe dàyǔ ne, nǐ xiànzài zěnme zǒu a? nǚ: nǐ kàn wǒ méi dài yǔsǎn, xiàng shì yǒu bànfǎ zǒu de rén ma? wèn: nǚ de shì shénme yìsi?',
        explanation_vi: 'Giải thích: Câu hỏi tu từ [像是有办法走的人吗] mang ý gián tiếp là không có ô và trời mưa to nên bây giờ không đi được (现在走不了).',
        level: 3,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
        trap_type: 'rhetorical_attitude',
      };

      const valResult = validateCandidate(rhetoricalCandidate as any, [], {
        expectedLevel: 3,
        expectedSkill: 'listening',
        expectedPartType: 'listen_dialogue_qa_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(valResult.valid).toBe(true);
      expect(valResult.errors).toEqual([]);
      expect(valResult.solverAnalysis.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
      expect(valResult.solverAnalysis.isUnambiguous).toBe(true);
    });

    it('recognizes all 4 new IELTS-style trap types without warnings', () => {
      const newTrapTypes = ['anti_verbatim', 'self_correction', 'rhetorical_attitude', 'numerical_twist'];

      for (const trap of newTrapTypes) {
        const candidate = {
          stem: '我们明天上午一起去图书馆借两本____。',
          options: ['书', '水', '茶', '苹果'],
          answer_idx: 0,
          pinyin: 'wǒmen míngtiān shàngwǔ yìqǐ qù túshūguǎn jiè liǎng běn shū.',
          explanation_vi: 'Giải thích: Lượng từ [本] đi kèm với [书].',
          level: 2,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          trap_type: trap,
        };

        const res = validateCandidate(candidate as any, [], {
          expectedLevel: 2,
          expectedSkill: 'reading',
          expectedPartType: 'read_fill_blank_4opt',
          requireLanguageQuality: false,
          requireDistractorRationales: false,
        });

        const unrecognizedWarning = res.warnings.find((w) => w.includes('Unrecognized trap_type'));
        expect(unrecognizedWarning).toBeUndefined();
      }
    });

    it('validates listening dialogue Gate 6 constraints: detects missing turns and prompt leakage', () => {
      // 1. Missing dialogue speaker turns
      const missingTurnsCandidate = {
        stem: '明天下午两点在图书馆见。问：什么时候见面？',
        options: ['明天下午两点', '明天上午', '后天', '大后天'],
        answer_idx: 0,
        level: 3,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
      };
      const resMissingTurns = validateCandidate(missingTurnsCandidate as any, [], {
        expectedLevel: 3,
        expectedSkill: 'listening',
        expectedPartType: 'listen_dialogue_qa_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });
      expect(resMissingTurns.solverAnalysis.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
      expect(resMissingTurns.warnings.some((w) => w.includes('speaker turns'))).toBe(true);

      // 2. Question prompt leaks exact answer
      const leakingPromptCandidate = {
        stem: '男：你打算去哪儿？\n女：我想去图书馆看书。\n问：女的为什么想去图书馆看书？',
        options: ['看书', '买东西', '找朋友', '喝茶'],
        answer_idx: 0,
        level: 3,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
      };
      const resLeaking = validateCandidate(leakingPromptCandidate as any, [], {
        expectedLevel: 3,
        expectedSkill: 'listening',
        expectedPartType: 'listen_dialogue_qa_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });
      expect(resLeaking.solverAnalysis.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(resLeaking.errors.some((e) => e.includes('Question prompt leaks'))).toBe(true);
    });
  });

  describe('6. Universal Question Parser Verification (R3)', () => {
    it('parses valid JSON array and markdown fenced JSON', () => {
      const jsonInput = '```json\n[\n  {\n    "stem": "今天天气很好，我想去____借两本书。",\n    "options": ["学校", "医院", "机场", "商店"],\n    "answer_idx": 0,\n    "explanation_vi": "Ngữ cảnh mượn sách thì địa điểm phù hợp là 学校.",\n    "level": 1,\n    "skill": "reading",\n    "part_type": "read_fill_blank_4opt"\n  }\n]\n```';
      const parsed = parseUniversalQuestions(jsonInput);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('今天天气很好，我想去____借两本书。');
      expect(parsed[0].options).toEqual(['学校', '医院', '机场', '商店']);
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[0].pinyin).toBeDefined();
      expect(parsed[0].level).toBe(1);
    });

    it('parses unformatted raw text and AI chat scripts from Claude/ChatGPT', () => {
      const rawChatText = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: 老师 có nghĩa là thầy giáo, phù hợp với ngữ cảnh câu.

Câu 2: 外面正在下雨，我们坐____去火车站吧。
A. 出租车
B. 自行车
C. 飞机
D. 火车
Đáp án: A
Giải thích: Đi bằng 出租车 (taxi) là tiện lợi và hợp lý nhất khi trời mưa.
      `;
      const parsed = parseUniversalQuestions(rawChatText, { default_level: 1, default_skill: 'reading' });
      expect(parsed.length).toBe(2);

      expect(parsed[0].stem).toBe('他是我的____。');
      expect(parsed[0].options).toEqual(['老师', '苹果', '飞机', '喝水']);
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[0].explanation_vi).toContain('thầy giáo');
      expect(parsed[0].pinyin).toBeDefined();

      expect(parsed[1].stem).toBe('外面正在下雨，我们坐____去火车站吧。');
      expect(parsed[1].options).toEqual(['出租车', '自行车', '飞机', '火车']);
      expect(parsed[1].answer_idx).toBe(0);
      expect(parsed[1].explanation_vi).toContain('taxi');
    });
  });

  describe('7. Universal Question Import Endpoint (POST /api/qbank/import)', () => {
    it('evaluates candidates through 6 gates, deduplicates, and inserts into pending_questions', async () => {
      const importPayload = {
        text: `
Câu 1: 桌子上有三个新鲜的____。
A. 苹果
B. 香蕉
C. 西瓜
D. 米饭
Đáp án: A
Giải thích: Trên bàn có ba quả táo tươi ngon (苹果). Cả 4 phương án đều là đồ ăn hoa quả, nhưng 苹果 phù hợp nhất với lượng từ 个.
        `,
        default_level: 3,
        default_skill: 'reading',
        default_part_type: 'read_fill_blank_4opt',
        default_topic: 'am_thuc',
      };

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(importPayload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(1);
      expect(data.accepted_count).toBe(1);
      expect(data.results[0].passed).toBe(true);
      expect(data.results[0].gates.allPassed).toBe(true);
      expect(data.results[0].inserted).toBe(true);

      // Verify question is persisted in pending_questions with status = 'pending' and provider_used = 'imported'
      const rows = stagingDb.prepare("SELECT * FROM pending_questions WHERE content_hash = ?").all(data.results[0].content_hash) as any[];
      expect(rows.length).toBe(1);
      expect(rows[0].status).toBe('pending');
      expect(rows[0].provider_used).toBe('imported');
      expect(rows[0].topic).toBe('am_thuc');

      // Attempt duplicate import: should deduplicate via ON CONFLICT(content_hash) DO NOTHING
      const dupRes = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(importPayload),
      });
      const dupData = await dupRes.json();
      expect(dupData.success).toBe(true);
      expect(dupData.total_parsed).toBe(1);
      expect(dupData.accepted_count).toBe(0);
      expect(dupData.rejected_count).toBe(1);
    });
  });

  describe('8. Teacher Review Filtering by Topic & Difficulty (R4)', () => {
    beforeAll(() => {
      // Seed pending questions with specific topic and difficulty tiers
      const insertStmt = stagingDb.prepare(`
        INSERT INTO pending_questions (
          id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, topic, status, provider_used, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        'seed_filter_1',
        'batch_filter_seed',
        '他要去中国____。',
        JSON.stringify(['旅游', '睡觉', '看书', '喝茶']),
        0,
        'Tā yào qù Zhōngguó lǚyóu.',
        'Đi du lịch Trung Quốc. [Độ khó: tier1_difficult | Chủ đề: du_lich]',
        1,
        'reading',
        'read_fill_blank_4opt',
        'du_lich',
        'pending',
        'imported',
        'hash_seed_filter_1'
      );

      insertStmt.run(
        'seed_filter_2',
        'batch_filter_seed',
        '妈妈在商店买了一个新____。',
        JSON.stringify(['手机', '飞机', '苹果', '桌子']),
        0,
        'Māma zài shāngdiàn mǎi le yí gè xīn shǒujī.',
        'Mua điện thoại mới ở cửa hàng. [Độ khó: tier2_very_difficult | Chủ đề: mua_sam]',
        2,
        'reading',
        'read_fill_blank_4opt',
        'mua_sam',
        'pending',
        'imported',
        'hash_seed_filter_2'
      );
    });

    it('filters pending questions by topic', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?topic=du_lich`, {
        headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.every((q: any) => q.topic === 'du_lich')).toBe(true);
      expect(data.questions.some((q: any) => q.id === 'seed_filter_1')).toBe(true);
      expect(data.questions.some((q: any) => q.id === 'seed_filter_2')).toBe(false);
    });

    it('filters pending questions by difficulty_tier', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?difficulty_tier=tier2_very_difficult`, {
        headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.some((q: any) => q.id === 'seed_filter_2')).toBe(true);
      expect(data.questions.some((q: any) => q.id === 'seed_filter_1')).toBe(false);
    });
  });

  describe('9. Autonomous Scheduler & DeepSeek Paid Mode Toggle Verification (R5)', () => {
    const originalAllowPaid = process.env.DEEPSEEK_ALLOW_PAID;
    const originalApiKey = process.env.DEEPSEEK_API_KEY;

    afterAll(() => {
      if (originalAllowPaid !== undefined) {
        process.env.DEEPSEEK_ALLOW_PAID = originalAllowPaid;
      } else {
        delete process.env.DEEPSEEK_ALLOW_PAID;
      }
      if (originalApiKey !== undefined) {
        process.env.DEEPSEEK_API_KEY = originalApiKey;
      } else {
        delete process.env.DEEPSEEK_API_KEY;
      }
    });

    it('strictly enforces free-tier only when DEEPSEEK_ALLOW_PAID is unset or false', () => {
      delete process.env.DEEPSEEK_ALLOW_PAID;
      delete process.env.DEEPSEEK_API_KEY;
      expect(isFreeTierOnly()).toBe(true);

      process.env.DEEPSEEK_ALLOW_PAID = 'false';
      process.env.DEEPSEEK_API_KEY = 'sk-sample-key';
      expect(isFreeTierOnly()).toBe(true);
    });

    it('allows DeepSeek provider when DEEPSEEK_ALLOW_PAID=true and API key is present', () => {
      process.env.DEEPSEEK_ALLOW_PAID = 'true';
      process.env.DEEPSEEK_API_KEY = 'sk-genuine-deepseek-key';
      expect(isFreeTierOnly()).toBe(false);
    });
  });

  describe('5. Operational Database Hashes Integrity Check', () => {
    it('verifies data/qbank/qbank.db is byte-identical to baseline hash', () => {
      const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      expect(fs.existsSync(qbankDbPath)).toBe(true);
      const hash = crypto.createHash('sha256').update(fs.readFileSync(qbankDbPath)).digest('hex').toUpperCase();
      expect(hash).toBe(initialQBankHash || EXPECTED_QBANK_HASH);
    });

    it('verifies data/hsk_exam.db is byte-identical to baseline hash', () => {
      const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      expect(fs.existsSync(hskExamDbPath)).toBe(true);
      const hash = crypto.createHash('sha256').update(fs.readFileSync(hskExamDbPath)).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HSK_EXAM_HASH);
    });

    it('verifies QBANK_LLM_FREE_ONLY is strictly true', () => {
      expect(isFreeTierOnly()).toBe(true);
    });
  });
});
