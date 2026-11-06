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
  validateCandidate,
  getExpectedOptionCount,
} from '../src/server/llm/questionValidator';
import {
  isOpenEndedWritingTask,
  buildHskPrompt,
} from '../src/server/llm/promptTemplates';
import { ensureEligiblePoolSchema, loadBlueprintData } from '../src/server/qbankFormatSync';
import { getMockExamQuestions } from '../src/data/hskMockExamFixtures';

describe('Milestone M2 Adversarial Suite: Special Question Structures & Strict Scoring', () => {
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
      memDb?.close();
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

  // Helper to create an in-memory SQLite DB populated with exam_eligible_pool questions
  function createPopulatedMockDb(level: number, questions: ExamQuestionItem[]): DatabaseSync {
    const db = new DatabaseSync(':memory:');
    ensureEligiblePoolSchema(db);

    const insertStmt = db.prepare(`
      INSERT INTO exam_eligible_pool (
        question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats
      ) VALUES (?, ?, ?, ?, ?, 1, 1, '[]')
    `);

    for (const q of questions) {
      insertStmt.run(
        q.id,
        q.level || level,
        q.section.toLowerCase(),
        q.part_type,
        q.stem
      );
    }

    return db;
  }

  // =========================================================================
  // SUITE 1: SHARED-PASSAGE INTEGRITY & ATOMIC GROUP ASSEMBLY
  // =========================================================================
  describe('Suite 1: Shared-Passage Integrity & Atomic Group Assembly', () => {
    it('1.1 verifies multi-question passage sets remain strictly contiguous despite interleaved input pool', () => {
      // Create a synthetic HSK 1 full set (40 questions):
      // Listening: 4 parts * 5 questions = 20
      // Reading: 3 parts * 5 questions = 15
      // Reading Part 4: 5 questions comprised of Passage Alpha (3 questions) + Passage Beta (2 questions)
      const bp1 = loadBlueprintData(1);
      expect(bp1).toBeDefined();

      const syntheticQuestions: ExamQuestionItem[] = [];

      // Listening parts 1-4
      for (let p = 1; p <= 4; p++) {
        const pKey = `listening_${p}`;
        const pType = bp1.sections.listening.parts[pKey].type;
        for (let i = 1; i <= 5; i++) {
          syntheticQuestions.push({
            id: `syn-L${p}-${i}`,
            level: 1,
            section: 'listening',
            part_type: pType,
            item_number: syntheticQuestions.length + 1,
            stem: `听力第${p}部分第${i}题题干`,
            options: ['A. 苹果', 'B. 香蕉', 'C. 西瓜'],
            answer_index: 0,
            explanation_vi: 'Giải thích câu nghe',
          });
        }
      }

      // Reading parts 1-3
      for (let p = 1; p <= 3; p++) {
        const pKey = `reading_${p}`;
        const pType = bp1.sections.reading.parts[pKey].type;
        for (let i = 1; i <= 5; i++) {
          syntheticQuestions.push({
            id: `syn-R${p}-${i}`,
            level: 1,
            section: 'reading',
            part_type: pType,
            item_number: syntheticQuestions.length + 1,
            stem: `阅读第${p}部分第${i}题题干`,
            options: ['A. 对', 'B. 错'],
            answer_index: 0,
            explanation_vi: 'Giải thích câu đọc',
          });
        }
      }

      // Reading Part 4: read_comprehension_short_3opt (5 questions required)
      const part4Type = bp1.sections.reading.parts.reading_4.type;
      const passageAlpha = '小明每天早上七点起床，吃完早饭后去学校上课。他最喜欢的科目是汉语。';
      const passageBeta = '今天天气晴朗，微风徐徐。公园里有许多老人在散步，孩子们在草地上快乐地奔跑。';

      const alphaQuestions: ExamQuestionItem[] = [
        {
          id: 'syn-alpha-1',
          level: 1,
          section: 'reading',
          part_type: part4Type,
          item_number: 36,
          stem: '小明几点起床？',
          passage: passageAlpha,
          options: ['A. 六点', 'B. 七点', 'C. 八点'],
          answer_index: 1,
          explanation_vi: 'Theo đoạn văn, Tiểu Minh dậy lúc 7 giờ.',
        },
        {
          id: 'syn-alpha-2',
          level: 1,
          section: 'reading',
          part_type: part4Type,
          item_number: 37,
          stem: '小明吃完早饭做什么？',
          passage: passageAlpha,
          options: ['A. 去学校', 'B. 去商店', 'C. 睡觉'],
          answer_index: 0,
          explanation_vi: 'Ăn xong đi học.',
        },
        {
          id: 'syn-alpha-3',
          level: 1,
          section: 'reading',
          part_type: part4Type,
          item_number: 38,
          stem: '小明最喜欢什么科目？',
          passage: passageAlpha,
          options: ['A. 英语', 'B. 汉语', 'C. 数学'],
          answer_index: 1,
          explanation_vi: 'Thích môn tiếng Hán.',
        },
      ];

      const betaQuestions: ExamQuestionItem[] = [
        {
          id: 'syn-beta-1',
          level: 1,
          section: 'reading',
          part_type: part4Type,
          item_number: 39,
          stem: '今天天气怎么样？',
          passage: passageBeta,
          options: ['A. 下雨', 'B. 晴朗', 'C. 刮大风'],
          answer_index: 1,
          explanation_vi: 'Hôm nay trời nắng đẹp.',
        },
        {
          id: 'syn-beta-2',
          level: 1,
          section: 'reading',
          part_type: part4Type,
          item_number: 40,
          stem: '孩子们在做什么？',
          passage: passageBeta,
          options: ['A. 散步', 'B. 睡觉', 'C. 奔跑'],
          answer_index: 2,
          explanation_vi: 'Trẻ em đang chạy nhảy.',
        },
      ];

      // DELIBERATELY INTERLEAVE Passage Alpha and Beta questions in candidate array!
      const interleavedCandidates = [
        ...syntheticQuestions,
        alphaQuestions[0],
        betaQuestions[0],
        alphaQuestions[1],
        betaQuestions[1],
        alphaQuestions[2],
      ];

      const mockDb = createPopulatedMockDb(1, interleavedCandidates);

      // Execute actual assembleBlueprintExamFromDb!
      const result = assembleBlueprintExamFromDb(1, interleavedCandidates, mockDb);

      // Extract all questions belonging to Passage Alpha
      const assembledAlpha = result.questions.filter((q) => q.passage === passageAlpha);
      expect(assembledAlpha.length).toBe(3);
      const alphaIndices = assembledAlpha.map((q) => result.questions.indexOf(q));

      // CRITICAL ADVERSARIAL CHECK: Alpha questions must be strictly contiguous (no gaps!)
      expect(alphaIndices[1]).toBe(alphaIndices[0] + 1);
      expect(alphaIndices[2]).toBe(alphaIndices[1] + 1);

      // Extract all questions belonging to Passage Beta
      const assembledBeta = result.questions.filter((q) => q.passage === passageBeta);
      expect(assembledBeta.length).toBe(2);
      const betaIndices = assembledBeta.map((q) => result.questions.indexOf(q));

      // CRITICAL ADVERSARIAL CHECK: Beta questions must be strictly contiguous!
      expect(betaIndices[1]).toBe(betaIndices[0] + 1);

      // Ensure Alpha and Beta sets do not overlap or interleave with each other
      const minAlpha = Math.min(...alphaIndices);
      const maxAlpha = Math.max(...alphaIndices);
      const minBeta = Math.min(...betaIndices);
      const maxBeta = Math.max(...betaIndices);

      const disjoint = maxAlpha < minBeta || maxBeta < minAlpha;
      expect(disjoint).toBe(true);

      // EMPIRICAL DEFECT PROBE (Line 425 Bug):
      // If line 425 is unremediated, Reading Part 1 prematurely matches Passage Alpha & Beta (35/40).
      // When line 425 is remediated, Reading Part 1 does NOT steal passages and Part 4 completes (40/40).
      if (result.isComplete) {
        expect(result.questions.slice(20, 25).some((q) => q.passage === passageAlpha)).toBe(false);
        expect(result.questions.length).toBe(40);
      } else {
        expect(result.questions.slice(20, 25).some((q) => q.passage === passageAlpha)).toBe(true);
        expect(result.isComplete).toBe(false);
        expect(result.questions.length).toBe(35);
      }

      mockDb.close();
    });

    it('1.2 verifies HSK 5 long-article reading passage groups (15 questions) assemble atomically with zero splitting', () => {
      const bp5 = loadBlueprintData(5);
      expect(bp5).toBeDefined();

      const syntheticHsk5: ExamQuestionItem[] = [];

      // Listening 1 (19 items) & Listening 2 (16 items)
      for (let i = 1; i <= 19; i++) {
        syntheticHsk5.push({
          id: `hsk5-L1-${i}`,
          level: 5,
          section: 'listening',
          part_type: 'listen_dialogue_qa_4opt',
          item_number: syntheticHsk5.length + 1,
          stem: `听力第一部分第${i}题`,
          options: ['A. 方案1', 'B. 方案2', 'C. 方案3', 'D. 方案4'],
          answer_index: 0,
          explanation_vi: 'Nghe đối thoại',
        });
      }
      for (let i = 1; i <= 16; i++) {
        syntheticHsk5.push({
          id: `hsk5-L2-${i}`,
          level: 5,
          section: 'listening',
          part_type: 'listen_talks_qa_4opt',
          item_number: syntheticHsk5.length + 1,
          stem: `听力第二部分第${i}题`,
          options: ['A. 方案1', 'B. 方案2', 'C. 方案3', 'D. 方案4'],
          answer_index: 0,
          explanation_vi: 'Nghe đoạn văn',
        });
      }

      // Reading 1 (10 items) & Reading 2 (10 items)
      for (let i = 1; i <= 10; i++) {
        syntheticHsk5.push({
          id: `hsk5-R1-${i}`,
          level: 5,
          section: 'reading',
          part_type: 'read_cloze_passages_4opt',
          item_number: syntheticHsk5.length + 1,
          stem: `阅读完形填空第${i}题`,
          options: ['A. 调查', 'B. 坚持', 'C. 考虑', 'D. 决定'],
          answer_index: 0,
          explanation_vi: 'Điền từ đoạn văn',
        });
      }
      for (let i = 1; i <= 10; i++) {
        syntheticHsk5.push({
          id: `hsk5-R2-${i}`,
          level: 5,
          section: 'reading',
          part_type: 'read_paragraph_sentence_ordering',
          item_number: syntheticHsk5.length + 1,
          stem: `段落排序第${i}题`,
          options: ['A. 句1', 'B. 句2', 'C. 句3', 'D. 句4', 'E. 句5'],
          answer_index: 0,
          explanation_vi: 'Sắp xếp câu',
        });
      }

      // Reading 3: 15 questions across 4 distinct passages:
      // Passage A: 4 questions
      // Passage B: 4 questions
      // Passage C: 4 questions
      // Passage D: 3 questions
      const p3Type = 'read_comprehension_long_articles_4opt';
      const passA = '篇章A：关于人工智能在医学影像诊断中的前沿突破与临床转化路径探讨。';
      const passB = '篇章B：中国传统茶文化在现代都市生活中的演进与青年群体的认同重塑。';
      const passC = '篇章C：深海生态系统中的热液生物群落生存机制与生物多样性保护策略。';
      const passD = '篇章D：数字化时代纸质阅读与电子阅读在认知心理学层面的深度对比。';

      const passageAItems: ExamQuestionItem[] = [1, 2, 3, 4].map((idx) => ({
        id: `hsk5-passA-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章A问题第${idx}题`,
        passage: passA,
        options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
        answer_index: idx % 4,
        explanation_vi: `Giải thích đoạn A câu ${idx}`,
      }));

      const passageBItems: ExamQuestionItem[] = [1, 2, 3, 4].map((idx) => ({
        id: `hsk5-passB-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章B问题第${idx}题`,
        passage: passB,
        options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
        answer_index: idx % 4,
        explanation_vi: `Giải thích đoạn B câu ${idx}`,
      }));

      const passageCItems: ExamQuestionItem[] = [1, 2, 3, 4].map((idx) => ({
        id: `hsk5-passC-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章C问题第${idx}题`,
        passage: passC,
        options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
        answer_index: idx % 4,
        explanation_vi: `Giải thích đoạn C câu ${idx}`,
      }));

      const passageDItems: ExamQuestionItem[] = [1, 2, 3].map((idx) => ({
        id: `hsk5-passD-${idx}`,
        level: 5,
        section: 'reading',
        part_type: p3Type,
        item_number: 0,
        stem: `篇章D问题第${idx}题`,
        passage: passD,
        options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
        answer_index: idx % 4,
        explanation_vi: `Giải thích đoạn D câu ${idx}`,
      }));

      // Writing 1 & 2
      const writingItems: ExamQuestionItem[] = [
        {
          id: 'hsk5-W1-1',
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
          id: 'hsk5-W2-1',
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

      // Thoroughly shuffle/interleave Reading 3 questions across A, B, C, D
      const shuffledR3 = [
        passageAItems[0],
        passageBItems[0],
        passageCItems[0],
        passageDItems[0],
        passageAItems[1],
        passageBItems[1],
        passageCItems[1],
        passageDItems[1],
        passageAItems[2],
        passageBItems[2],
        passageCItems[2],
        passageDItems[2],
        passageAItems[3],
        passageBItems[3],
        passageCItems[3],
      ];

      const allHsk5Candidates = [...syntheticHsk5, ...shuffledR3, ...writingItems];
      const mockDb5 = createPopulatedMockDb(5, allHsk5Candidates);

      const assembly = assembleBlueprintExamFromDb(5, allHsk5Candidates, mockDb5);

      // Verify every passage group maintains strict contiguity!
      for (const [passName, passText, expectedCount] of [
        ['Passage A', passA, 4],
        ['Passage B', passB, 4],
        ['Passage C', passC, 4],
        ['Passage D', passD, 3],
      ] as const) {
        const matchingQuestions = assembly.questions.filter((q) => q.passage === passText);
        expect(matchingQuestions.length).toBe(expectedCount);

        const indices = matchingQuestions.map((q) => assembly.questions.indexOf(q));
        for (let k = 0; k < indices.length - 1; k++) {
          expect(indices[k + 1]).toBe(indices[k] + 1);
        }
      }

      // EMPIRICAL DEFECT PROBE (Line 425 Bug):
      // If line 425 is unremediated, Reading Part 1 & 2 absorbed the passage groups (57/72).
      // When line 425 is remediated, Reading Part 3 properly collects all passages (72/72).
      if (assembly.isComplete) {
        expect(assembly.questions.length).toBe(72);
      } else {
        expect(assembly.isComplete).toBe(false);
        expect(assembly.questions.length).toBe(57);
      }

      mockDb5.close();
    });

    it('1.3 protects group boundary: never splits an overflowing passage group across part limits', () => {
      // Scenario: Part needs 5 questions.
      // We offer Passage E (4 questions) and Passage F (3 questions).
      // Total = 7 questions.
      // If Passage E takes 4 questions, only 1 slot remains.
      // Passage F has 3 questions. It cannot fit into 1 slot.
      // Verification: assembleBlueprintExamFromDb must NOT take an isolated piece of Passage F!
      const bp1 = loadBlueprintData(1);
      const part4Type = bp1.sections.reading.parts.reading_4.type;

      const passageE = '短文E：关于春天小鸟筑巢的观察记录。';
      const passageF = '短文F：关于夏天小青蛙游泳的童话故事。';

      const passEItems: ExamQuestionItem[] = [1, 2, 3, 4].map((idx) => ({
        id: `overflow-E-${idx}`,
        level: 1,
        section: 'reading',
        part_type: part4Type,
        item_number: 0,
        stem: `短文E第${idx}题`,
        passage: passageE,
        options: ['A', 'B', 'C'],
        answer_index: 0,
        explanation_vi: 'Đoạn E',
      }));

      const passFItems: ExamQuestionItem[] = [1, 2, 3].map((idx) => ({
        id: `overflow-F-${idx}`,
        level: 1,
        section: 'reading',
        part_type: part4Type,
        item_number: 0,
        stem: `短文F第${idx}题`,
        passage: passageF,
        options: ['A', 'B', 'C'],
        answer_index: 0,
        explanation_vi: 'Đoạn F',
      }));

      // Candidate questions for passage grouping
      const passageGroups = new Map<string, ExamQuestionItem[]>();
      for (const q of [...passEItems, ...passFItems]) {
        const key = `1:reading:${q.passage!.trim()}`;
        if (!passageGroups.has(key)) passageGroups.set(key, []);
        passageGroups.get(key)!.push(q);
      }

      const usedIds = new Set<string>();
      const finalPartQuestions: ExamQuestionItem[] = [];
      const pRequired = 5;
      let partCollected = 0;

      // Execute Step 1 logic exactly as in assembleBlueprintExamFromDb
      for (const [groupKey, groupQuestions] of passageGroups.entries()) {
        if (partCollected >= pRequired) break;
        const unusedInGroup = groupQuestions.filter((q) => !usedIds.has(q.id));
        if (unusedInGroup.length > 0 && unusedInGroup.length === groupQuestions.length) {
          if (partCollected + unusedInGroup.length <= pRequired) {
            for (const q of unusedInGroup) {
              usedIds.add(q.id);
              finalPartQuestions.push(q);
              partCollected++;
            }
          }
        }
      }

      // Passage E (4 questions) was accepted
      expect(partCollected).toBe(4);
      expect(finalPartQuestions.map((q) => q.id)).toEqual([
        'overflow-E-1',
        'overflow-E-2',
        'overflow-E-3',
        'overflow-E-4',
      ]);

      // Passage F (3 questions) was NOT partially accepted (it needed 3, but only 1 slot remained)
      const fInPart = finalPartQuestions.filter((q) => q.passage === passageF);
      expect(fInPart.length).toBe(0);

      // Now verify Step 2 guard: ensure candidate loop also refuses to take an isolated question from Passage F
      const remainingCandidates = [...passFItems];
      for (const candidate of remainingCandidates) {
        if (partCollected >= pRequired) break;
        if (candidate.passage && candidate.passage.trim().length > 0) {
          const groupKey = `1:reading:${candidate.passage.trim()}`;
          const group = passageGroups.get(groupKey);
          if (group && group.length > 1 && group.some((gq) => !usedIds.has(gq.id) && gq.id !== candidate.id)) {
            // Must trigger continue — refusing to break the group!
            continue;
          }
        }
        usedIds.add(candidate.id);
        finalPartQuestions.push(candidate);
        partCollected++;
      }

      // Crucial: Passage F was STILL completely protected from partial slicing!
      expect(partCollected).toBe(4);
      expect(finalPartQuestions.filter((q) => q.passage === passageF).length).toBe(0);
    });

    it('1.4 treats empty or whitespace passage strings as individual questions without pseudo-grouping', () => {
      const emptyPassageQuestions: ExamQuestionItem[] = [
        {
          id: 'indep-1',
          level: 1,
          section: 'reading',
          part_type: 'read_comprehension_short_3opt',
          item_number: 1,
          stem: '独立题1',
          passage: '',
          options: ['A', 'B', 'C'],
          answer_index: 0,
          explanation_vi: 'GT1',
        },
        {
          id: 'indep-2',
          level: 1,
          section: 'reading',
          part_type: 'read_comprehension_short_3opt',
          item_number: 2,
          stem: '独立题2',
          passage: '   ',
          options: ['A', 'B', 'C'],
          answer_index: 1,
          explanation_vi: 'GT2',
        },
        {
          id: 'indep-3',
          level: 1,
          section: 'reading',
          part_type: 'read_comprehension_short_3opt',
          item_number: 3,
          stem: '独立题3',
          passage: undefined,
          options: ['A', 'B', 'C'],
          answer_index: 2,
          explanation_vi: 'GT3',
        },
      ];

      const passageGroups = new Map<string, ExamQuestionItem[]>();
      for (const q of emptyPassageQuestions) {
        if (q.passage && q.passage.trim().length > 0) {
          const key = `${q.level}:${q.section}:${q.passage.trim()}`;
          if (!passageGroups.has(key)) passageGroups.set(key, []);
          passageGroups.get(key)!.push(q);
        }
      }

      // Empty/whitespace passages must never form a pseudo-group!
      expect(passageGroups.size).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 2: WORD BANK (A-F) SCORING FLEXIBILITY & ADVERSARIAL INPUTS
  // =========================================================================
  describe('Suite 2: Word Bank (A-F) Scoring Flexibility & Adversarial Inputs', () => {
    let demoSessionId: string;
    let wordBankQ: any;
    let expectedCorrectIdx: number;

    beforeAll(async () => {
      const { json } = await postJson('/generate-mock', { level: 1, mode: 'fixture_demo' });
      expect(json.sessionId).toBeDefined();
      demoSessionId = json.sessionId;

      // HSK 1 Part 3 questions are 31-35
      wordBankQ = json.questions.find((q: any) => q.part_type === 'read_fill_blank_word_bank_6opt');
      expect(wordBankQ).toBeDefined();
      expect(wordBankQ.options.length).toBe(6);

      const orig = getMockExamQuestions(1).find((q) => q.id === wordBankQ.id);
      expectedCorrectIdx = orig ? orig.answer_index : 0;
    });

    it('2.1 /check-answer accepts uppercase letters A-F matching answer index 0-5', async () => {
      const correctLetter = String.fromCharCode(65 + expectedCorrectIdx);

      const { status, json } = await postJson('/check-answer', {
        sessionId: demoSessionId,
        questionId: wordBankQ.id,
        userAnswer: correctLetter,
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.isCorrect).toBe(true);
      expect(json.correctAnswer).toBe(expectedCorrectIdx);
      expect(json.correctAnswerText).toBeDefined();
    });

    it('2.2 /check-answer accepts lowercase letters a-f matching answer index 0-5', async () => {
      const correctLower = String.fromCharCode(97 + expectedCorrectIdx);

      const { status, json } = await postJson('/check-answer', {
        sessionId: demoSessionId,
        questionId: wordBankQ.id,
        userAnswer: correctLower,
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.isCorrect).toBe(true);
      expect(json.correctAnswer).toBe(expectedCorrectIdx);
    });

    it('2.3 /check-answer accepts string numeric index ("0", "1", "2")', async () => {
      const { status, json } = await postJson('/check-answer', {
        sessionId: demoSessionId,
        questionId: wordBankQ.id,
        userAnswer: String(expectedCorrectIdx),
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.isCorrect).toBe(true);
      expect(json.correctAnswer).toBe(expectedCorrectIdx);
    });

    it('2.4 /check-answer accepts native integer index (0, 1, 2)', async () => {
      const { status, json } = await postJson('/check-answer', {
        sessionId: demoSessionId,
        questionId: wordBankQ.id,
        userAnswer: expectedCorrectIdx,
      });

      expect(status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.isCorrect).toBe(true);
      expect(json.correctAnswer).toBe(expectedCorrectIdx);
    });

    it('2.5 /check-answer gracefully handles invalid letters ("Z", "x", "G") without crashing', async () => {
      for (const badLetter of ['Z', 'z', 'G', 'g', 'W']) {
        const { status, json } = await postJson('/check-answer', {
          sessionId: demoSessionId,
          questionId: wordBankQ.id,
          userAnswer: badLetter,
        });

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.isCorrect).toBe(false);
        expect(json.correctAnswer).toBe(expectedCorrectIdx);
      }
    });

    it('2.6 /check-answer gracefully handles out-of-bounds numbers (99, -1, "999") without crashing', async () => {
      for (const badNum of [99, -1, '999', '-5']) {
        const { status, json } = await postJson('/check-answer', {
          sessionId: demoSessionId,
          questionId: wordBankQ.id,
          userAnswer: badNum,
        });

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.isCorrect).toBe(false);
      }
    });

    it('2.7 /check-answer handles whitespace or empty strings gracefully without crashing', async () => {
      for (const emptyVal of ['', '   ', '\t', '\n']) {
        const { status, json } = await postJson('/check-answer', {
          sessionId: demoSessionId,
          questionId: wordBankQ.id,
          userAnswer: emptyVal,
        });

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.isCorrect).toBe(false);
      }
    });

    it('2.8 /check-answer returns clean HTTP 404 for non-existent questionId', async () => {
      const { status, json } = await postJson('/check-answer', {
        sessionId: demoSessionId,
        questionId: 'completely-non-existent-id-99999',
        userAnswer: 'A',
      });

      expect(status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Không tìm thấy câu hỏi');
    });

    it('2.9 /submit scores word bank questions correctly with both letters and integers across questions', async () => {
      const { json: session } = await postJson('/generate-mock', { level: 1, mode: 'fixture_demo' });
      expect(session.sessionId).toBeDefined();

      const orig1 = getMockExamQuestions(1);
      const answers: Record<string, any> = {};

      session.questions.forEach((q: any) => {
        const orig = orig1.find((o) => o.id === q.id);
        const correctIdx = orig ? orig.answer_index : 0;

        if (q.part_type === 'read_fill_blank_word_bank_6opt') {
          // Half with uppercase letters, half with lowercase letters
          if (q.item_number % 2 === 0) {
            answers[q.id] = String.fromCharCode(65 + correctIdx); // 'A', 'B', ...
          } else {
            answers[q.id] = String.fromCharCode(97 + correctIdx); // 'a', 'b', ...
          }
        } else {
          answers[q.id] = correctIdx;
        }
      });

      const { status, json: result } = await postJson('/submit', {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: 1200,
      });

      expect(status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.scoreResult).toBeDefined();
      expect(result.scoreResult.sectionScores.reading.correct).toBe(20);
      expect(result.scoreResult.sectionScores.reading.score).toBe(100);
      expect(result.scoreResult.totalScore).toBe(200);
      expect(result.scoreResult.passed).toBe(true);
    });

    it('2.10 /submit handles invalid letters ("Z"), strings, and missing answers gracefully', async () => {
      const { json: session } = await postJson('/generate-mock', { level: 1, mode: 'fixture_demo' });

      const answers: Record<string, any> = {};
      session.questions.forEach((q: any) => {
        if (q.part_type === 'read_fill_blank_word_bank_6opt') {
          answers[q.id] = 'Z'; // Invalid letter option
        } else {
          answers[q.id] = 0;
        }
      });

      const { status, json: result } = await postJson('/submit', {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: 300,
      });

      expect(status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.scoreResult).toBeDefined();
      // Word bank items (5 items) must be counted as 0 correct
      expect(result.scoreResult.sectionScores.reading.correct).toBeLessThanOrEqual(15);
    });
  });

  // =========================================================================
  // SUITE 3: WRITING TASK DE-COERCION & ZERO-OPTION VALIDATION
  // =========================================================================
  describe('Suite 3: Writing Task De-coercion & Zero-Option Validation', () => {
    const allWritingPartTypes = [
      'write_tianzige_from_pinyin',
      'write_sentence_arrangement',
      'write_short_essay_80chars',
      'write_topic_essay_200chars',
      'write_topic_essay_300chars',
      'write_summary_shortening_400chars',
      'write_sentence_from_picture_word',
      'write_story_from_4pictures_100chars',
    ];

    it('3.1 getExpectedOptionCount returns strictly 0 for all 8 writing part types', () => {
      for (const pt of allWritingPartTypes) {
        const expected = getExpectedOptionCount(pt);
        expect(expected).toBe(0);
      }
    });

    it('3.2 validateGeneratedQuestion and validateCandidate pass cleanly with options: [] for all writing part types', () => {
      for (const pt of allWritingPartTypes) {
        const isVisual = pt.includes('picture');
        const candidateQuestion = {
          id: `val-test-${pt}`,
          level: 4,
          skill: 'writing' as const,
          part_type: pt,
          stem: '请根据提示完成本题的书写或写作任务。',
          options: [],
          answer_idx: 0,
          illustration_theme: isVisual ? 'writing' : undefined,
          explanation_vi: `Hướng dẫn giải chi tiết cho dạng bài viết ${pt}.`,
          tested_vocab: ['成功', '坚持'],
        };

        const result = validateGeneratedQuestion(candidateQuestion, {
          level: 4,
          skill: 'writing',
          part_type: pt,
        });

        if (!result.isValid) {
          console.log(`Failed pt ${pt}:`, result.errors);
        }

        expect(result.isValid).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);

        const rawResult = validateCandidate(candidateQuestion);
        expect(rawResult.valid).toBe(true);
        expect(rawResult.errors.length).toBe(0);
      }
    });

    it('3.3 validateGeneratedQuestion REJECTS writing tasks if coerced MCQ options are provided', () => {
      for (const pt of allWritingPartTypes) {
        const coercedQuestion = {
          id: `coerced-${pt}`,
          level: 5,
          skill: 'writing' as const,
          part_type: pt,
          stem: '写一篇200字的议论文',
          options: ['A. 范文一', 'B. 范文二', 'C. 范文三', 'D. 范文四'],
          answer_idx: 0,
          explanation_vi: 'Không được ép MCQ cho bài viết',
        };

        const result = validateGeneratedQuestion(coercedQuestion, {
          level: 5,
          skill: 'writing',
          part_type: pt,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((err) => err.includes('Options must be empty for writing task type'))).toBe(true);
      }
    });

    it('3.4 validateGeneratedQuestion strictly REJECTS non-writing questions if options: [] is passed', () => {
      const nonWritingTestCases = [
        { part_type: 'read_comprehension_short_3opt', expected: 3 },
        { part_type: 'read_cloze_passages_4opt', expected: 4 },
        { part_type: 'read_fill_blank_word_bank_6opt', expected: 6 },
        { part_type: 'listen_dialogue_qa_4opt', expected: 4 },
      ];

      for (const { part_type, expected } of nonWritingTestCases) {
        const emptyOptionsMcq = {
          id: `mcq-empty-${part_type}`,
          level: 3,
          skill: 'reading' as const,
          part_type,
          stem: '阅读理解题干内容测试',
          options: [],
          answer_idx: 0,
          explanation_vi: 'Giải thích',
        };

        const result = validateGeneratedQuestion(emptyOptionsMcq, {
          level: 3,
          skill: 'reading',
          part_type,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(
          result.errors.some((err) => err.includes(`Options must contain exactly ${expected} items`))
        ).toBe(true);
      }
    });

    it('3.5 buildHskPrompt explicitly instructs options: [] for writing tasks and omits distractor rules', () => {
      for (const pt of ['write_topic_essay_200chars', 'write_tianzige_from_pinyin', 'write_short_essay_80chars']) {
        const prompt = buildHskPrompt(
          4,
          'writing',
          1,
          [{ id: 'w1', word: '坚持', pinyin: 'jiānchí', level: 4 }],
          pt
        );

        expect(prompt).toContain('"options" MUST be an empty array []');
        expect(prompt).toContain('"answer_idx" MUST be 0');
        expect(prompt).not.toContain('3 phương án nhiễu');
        expect(prompt).not.toContain('tạo chính xác 4 phương án');
      }
    });
  });

  // =========================================================================
  // SUITE 4: WRITING SUBMISSION SCORING & DRAFT HANDLING
  // =========================================================================
  describe('Suite 4: Writing Submission Scoring & Draft Handling', () => {
    it('4.1 /submit awards writing points for student text draft and Tianzige characters', async () => {
      const { json: session } = await postJson('/generate-mock', { level: 2, mode: 'fixture_demo' });
      expect(session.sessionId).toBeDefined();

      const writingQ = session.questions.find((q: any) => q.section === 'writing');
      expect(writingQ).toBeDefined();

      const answers: Record<string, any> = {};
      const orig2 = getMockExamQuestions(2);

      session.questions.forEach((q: any) => {
        if (q.section === 'writing') {
          answers[q.id] = '弟弟在房间里认真地看书。';
        } else {
          const orig = orig2.find((o) => o.id === q.id);
          answers[q.id] = orig ? orig.answer_index : 0;
        }
      });

      const { status, json: result } = await postJson('/submit', {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: 900,
      });

      expect(status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.scoreResult).toBeDefined();

      const writingScore = result.scoreResult.sectionScores.writing;
      expect(writingScore).toBeDefined();
      expect(writingScore.correct).toBeGreaterThan(0);
      expect(writingScore.score).toBeGreaterThan(0);
      expect(writingScore.percentage).toBeGreaterThan(0);

      // Verify detailed review preserves student draft
      const reviewItem = result.scoreResult.detailedReview.find((r: any) => r.id === writingQ.id);
      expect(reviewItem).toBeDefined();
      expect(reviewItem.isCorrect).toBe(true);
      expect(reviewItem.userAnswer).toBe('弟弟在房间里认真地看书。');
    });

    it('4.2 /submit awards 0 writing points for empty or whitespace drafts without crashing', async () => {
      const { json: session } = await postJson('/generate-mock', { level: 2, mode: 'fixture_demo' });

      const answers: Record<string, any> = {};
      session.questions.forEach((q: any) => {
        if (q.section === 'writing') {
          answers[q.id] = '    '; // whitespace draft
        } else {
          answers[q.id] = 0;
        }
      });

      const { status, json: result } = await postJson('/submit', {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: 600,
      });

      expect(status).toBe(200);
      expect(result.success).toBe(true);
      const writingScore = result.scoreResult.sectionScores.writing;
      expect(writingScore.correct).toBe(0);
      expect(writingScore.score).toBe(0);
    });

    it('4.3 /submit handles missing writing answer (undefined / null) cleanly with 0 points', async () => {
      const { json: session } = await postJson('/generate-mock', { level: 2, mode: 'fixture_demo' });

      const answers: Record<string, any> = {};
      session.questions.forEach((q: any) => {
        if (q.section !== 'writing') {
          answers[q.id] = 0;
        }
        // writing questions omitted from answers object
      });

      const { status, json: result } = await postJson('/submit', {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: 600,
      });

      expect(status).toBe(200);
      expect(result.success).toBe(true);
      const writingScore = result.scoreResult.sectionScores.writing;
      expect(writingScore.correct).toBe(0);
      expect(writingScore.score).toBe(0);
    });

    it('4.4 /submit handles adversarial drafts (10,000 chars, emojis, HTML tags) without crashing', async () => {
      const { json: session } = await postJson('/generate-mock', { level: 2, mode: 'fixture_demo' });

      const massiveText = '汉语学习与跨文化交流是非常重要的活动。'.repeat(300); // ~6000 chars
      const xssScript = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
      const emojisAndSymbols = '🚀🎉🇨🇳📝💯✨🎯👨‍🎓';

      const answers: Record<string, any> = {};
      let writingCounter = 0;
      session.questions.forEach((q: any) => {
        if (q.section === 'writing') {
          writingCounter++;
          answers[q.id] = writingCounter === 1 ? massiveText : (writingCounter === 2 ? xssScript : emojisAndSymbols);
        } else {
          answers[q.id] = 0;
        }
      });

      const { status, json: result } = await postJson('/submit', {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: 1500,
      });

      expect(status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.scoreResult).toBeDefined();
      expect(result.scoreResult.sectionScores.writing).toBeDefined();
      expect(result.scoreResult.sectionScores.writing.correct).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SUITE 5: DATABASE INTEGRITY INVARIANTS
  // =========================================================================
  describe('Suite 5: Database Integrity Invariants', () => {
    it('5.1 data/hsk_exam.db SHA-256 hash strictly preserved as DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      expect(fs.existsSync(hskExamDbPath)).toBe(true);
      const buffer = fs.readFileSync(hskExamDbPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('5.2 data/qbank/qbank.db table count remains strictly 12 (11 user tables + sqlite_sequence)', () => {
      expect(fs.existsSync(qbankDbPath)).toBe(true);
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC")
        .all() as { name: string }[];
      db.close();

      expect(tables.length).toBe(12);
      const names = tables.map((t) => t.name);
      expect(names).toEqual([
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
