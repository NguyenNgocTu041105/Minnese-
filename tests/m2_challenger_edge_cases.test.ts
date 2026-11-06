import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  isOptionCountCompatible,
  validateFormatCompatibility,
  reEvaluateApprovedQuestions,
} from '../src/server/qbankFormatSync.js';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  setDbSyncForTesting,
} from '../src/server/qbankRoutes.js';

describe('Challenger M2-2: Empirical Stress-Testing for Milestone M2 Edge Cases', () => {
  // -------------------------------------------------------------------------
  // 1. OPTION COUNT EDGE CASES
  // -------------------------------------------------------------------------
  describe('1. Option Count Edge Cases', () => {
    it('1.1: Rejects a question with 2 options for a 3-option blueprint part', () => {
      // Direct helper check
      const compatible = isOptionCountCompatible('listen_dialogue_qa_3opt', 3, 2);
      expect(compatible).toBe(false);

      // Full validateFormatCompatibility check
      const q = {
        stem: '请听录音选择正确答案。',
        options: ['选项A', '选项B'], // only 2 options for a 3-option part
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        level: 2,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 2);
      expect(result.exam_eligible).toBe(false);
      expect(result.exam_format_compatible).toBe(false);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('yêu cầu chính xác 3 phương án')
        )
      ).toBe(true);
    });

    it('1.2: Rejects a question with 7 options for a 6-option blueprint part', () => {
      // Direct helper check
      const compatible = isOptionCountCompatible('read_fill_blank_word_bank_6opt', 6, 7);
      expect(compatible).toBe(false);

      // Full validateFormatCompatibility check
      const q = {
        stem: '他身体不太舒服，现在要去____看医生。',
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], // 7 options for 6-option part
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        level: 1,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 1);
      expect(result.exam_eligible).toBe(false);
      expect(result.exam_format_compatible).toBe(false);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('yêu cầu chính xác 6 phương án')
        )
      ).toBe(true);
    });

    it('1.3a: Tests write_sentence_from_picture_word (HSK 4) with 0, 1, 2, 4 options (only 0 options eligible)', () => {
      // 0 options -> ELIGIBLE
      const q0 = {
        stem: '看图，用给出的词语造句：高兴。',
        options: [],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        level: 4,
        status: 'approved',
      };
      const res0 = validateFormatCompatibility(q0, 4);
      expect(isOptionCountCompatible('write_sentence_from_picture_word', 0, 0)).toBe(true);
      expect(res0.practice_format_compatible).toBe(true);
      expect(res0.practice_eligible).toBe(true);
      expect(res0.exam_format_compatible).toBe(true);
      expect(res0.exam_eligible).toBe(true);
      expect(res0.ineligible_reasons).toHaveLength(0);
      expect(res0.matched_blueprint_part).toBe('writing_1');

      // 1 option -> INELIGIBLE
      const q1 = {
        stem: '看图，用给出的词语造句：高兴。',
        options: ['高兴'],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        level: 4,
        status: 'approved',
      };
      const res1 = validateFormatCompatibility(q1, 4);
      expect(isOptionCountCompatible('write_sentence_from_picture_word', 0, 1)).toBe(false);
      expect(res1.practice_format_compatible).toBe(false);
      expect(res1.practice_eligible).toBe(false);
      expect(res1.exam_format_compatible).toBe(false);
      expect(res1.exam_eligible).toBe(false);
      expect(
        res1.ineligible_reasons.some((r) =>
          r.includes('Dạng bài viết tự luận yêu cầu 0 phương án (options phải rỗng)')
        )
      ).toBe(true);

      // 2 options -> INELIGIBLE
      const q2 = {
        stem: '看图，用给出的词语造句：高兴。',
        options: ['高兴', '伤心'],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        level: 4,
        status: 'approved',
      };
      const res2 = validateFormatCompatibility(q2, 4);
      expect(isOptionCountCompatible('write_sentence_from_picture_word', 0, 2)).toBe(false);
      expect(res2.practice_format_compatible).toBe(false);
      expect(res2.practice_eligible).toBe(false);
      expect(res2.exam_format_compatible).toBe(false);
      expect(res2.exam_eligible).toBe(false);
      expect(
        res2.ineligible_reasons.some((r) =>
          r.includes('Dạng bài viết tự luận yêu cầu 0 phương án (options phải rỗng)')
        )
      ).toBe(true);

      // 4 options -> INELIGIBLE
      const q4 = {
        stem: '看图，用给出的词语造句：高兴。',
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        level: 4,
        status: 'approved',
      };
      const res4 = validateFormatCompatibility(q4, 4);
      expect(isOptionCountCompatible('write_sentence_from_picture_word', 0, 4)).toBe(false);
      expect(res4.practice_format_compatible).toBe(false);
      expect(res4.practice_eligible).toBe(false);
      expect(res4.exam_format_compatible).toBe(false);
      expect(res4.exam_eligible).toBe(false);
      expect(
        res4.ineligible_reasons.some((r) =>
          r.includes('Dạng bài viết tự luận yêu cầu 0 phương án (options phải rỗng)')
        )
      ).toBe(true);
    });

    it('1.3b: Tests write_short_essay_80chars (HSK 4 Part 2) with 0 vs 4 options', () => {
      // 0 options -> ELIGIBLE
      const qEssay0 = {
        stem: '请写一篇80字左右的短文：介绍你最喜欢的一个季节。',
        options: [],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        level: 4,
        status: 'approved',
      };
      const resEssay0 = validateFormatCompatibility(qEssay0, 4);
      expect(isOptionCountCompatible('write_short_essay_80chars', 0, 0)).toBe(true);
      expect(resEssay0.practice_format_compatible).toBe(true);
      expect(resEssay0.practice_eligible).toBe(true);
      expect(resEssay0.exam_format_compatible).toBe(true);
      expect(resEssay0.exam_eligible).toBe(true);
      expect(resEssay0.ineligible_reasons).toHaveLength(0);
      expect(resEssay0.matched_blueprint_part).toBe('writing_2');

      // 4 options -> INELIGIBLE
      const qEssay4 = {
        stem: '请写一篇80字左右的短文：介绍你最喜欢的一个季节。',
        options: ['春天', '夏天', '秋天', '冬天'],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        level: 4,
        status: 'approved',
      };
      const resEssay4 = validateFormatCompatibility(qEssay4, 4);
      expect(isOptionCountCompatible('write_short_essay_80chars', 0, 4)).toBe(false);
      expect(resEssay4.practice_format_compatible).toBe(false);
      expect(resEssay4.practice_eligible).toBe(false);
      expect(resEssay4.exam_format_compatible).toBe(false);
      expect(resEssay4.exam_eligible).toBe(false);
      expect(
        resEssay4.ineligible_reasons.some((r) =>
          r.includes('Dạng bài viết tự luận yêu cầu 0 phương án (options phải rỗng)')
        )
      ).toBe(true);
    });

    it('1.3c: Tests write_component_assembly_6opt: verifies 6 options is REQUIRED and preserved', () => {
      // 6 options -> ELIGIBLE in HSK 2 Writing Part 1
      const qComp6 = {
        stem: '请将下列部件组合成汉字并组词。',
        options: ['氵', '木', '口', '日', '月', '女'],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
        level: 2,
        status: 'approved',
      };
      expect(isOptionCountCompatible('write_component_assembly_6opt', 6, 6)).toBe(true);
      const res6 = validateFormatCompatibility(qComp6, 2);
      expect(res6.practice_format_compatible).toBe(true);
      expect(res6.practice_eligible).toBe(true);
      expect(res6.exam_format_compatible).toBe(true);
      expect(res6.exam_eligible).toBe(true);
      expect(res6.ineligible_reasons).toHaveLength(0);
      expect(res6.matched_blueprint_part).toBe('writing_1');

      // 0 options -> REJECTED (component assembly requires 6 options, not open-ended 0)
      const qComp0 = {
        stem: '请将下列部件组合成汉字并组词。',
        options: [],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
        level: 2,
        status: 'approved',
      };
      expect(isOptionCountCompatible('write_component_assembly_6opt', 6, 0)).toBe(false);
      const res0 = validateFormatCompatibility(qComp0, 2);
      expect(res0.practice_format_compatible).toBe(false);
      expect(res0.exam_eligible).toBe(false);
      expect(
        res0.ineligible_reasons.some((r) =>
          r.includes('Số lượng phương án trả lời phải từ 2 trở lên')
        )
      ).toBe(true);

      // 4 options -> REJECTED for exam eligibility (must have strictly 6 options)
      const qComp4 = {
        stem: '请将下列部件组合成汉字并组词。',
        options: ['氵', '木', '口', '日'],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
        level: 2,
        status: 'approved',
      };
      expect(isOptionCountCompatible('write_component_assembly_6opt', 6, 4)).toBe(false);
      const res4 = validateFormatCompatibility(qComp4, 2);
      expect(res4.practice_format_compatible).toBe(true); // practice allows >= 2 options
      expect(res4.exam_format_compatible).toBe(false);
      expect(res4.exam_eligible).toBe(false);
      expect(
        res4.ineligible_reasons.some((r) =>
          r.includes('Dạng bài write_component_assembly_6opt yêu cầu chính xác 6 phương án (câu hiện có 4)')
        )
      ).toBe(true);

      // Verify that write_component_assembly_6opt does NOT match HSK 4 Writing Part 1
      // (HSK 4 Writing Part 1 is write_sentence_from_picture_word with 0 options)
      const qCompHSK4 = {
        stem: '请将下列部件组合成汉字并组词。',
        options: ['氵', '木', '口', '日', '月', '女'],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
        level: 4,
        status: 'approved',
      };
      const resHSK4 = validateFormatCompatibility(qCompHSK4, 4);
      expect(resHSK4.practice_format_compatible).toBe(true);
      expect(resHSK4.exam_eligible).toBe(false);
      expect(
        resHSK4.ineligible_reasons.some((r) =>
          r.includes('không thuộc bất kỳ phần nào trong blueprint HSK 4')
        )
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. LISTENING AUDIO EDGE CASES
  // -------------------------------------------------------------------------
  describe('2. Listening Audio Edge Cases', () => {
    it('2.1: Rejects listening question with empty stem and no audio_text/url/playback', () => {
      const qEmptyStem = {
        stem: '',
        options: ['选项A', '选项B', '选项C'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        level: 2,
        status: 'approved',
      };
      const result = validateFormatCompatibility(qEmptyStem, 2);
      expect(result.exam_eligible).toBe(false);
      expect(result.practice_format_compatible).toBe(false);

      // Verify exact diagnostic reasons recorded
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(true);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);
    });

    it('2.2: Accepts listening question with valid Chinese stem without "男：" or "女：" markers for practice, but flags audio deficit for exam', () => {
      const qValidNoMarker = {
        stem: '妹妹在房间里睡觉。', // Valid Chinese stem without dialogue markers
        options: ['睡觉', '看书', '去学校'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        level: 2,
        status: 'approved',
      };
      const result = validateFormatCompatibility(qValidNoMarker, 2);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.some((r) => r.includes('âm thanh'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 3. ADMIN ENDPOINT AUTHORIZATION
  // -------------------------------------------------------------------------
  describe('3. Admin Endpoint Authorization: POST /api/qbank/pools/re-evaluate', () => {
    let app: Express;
    let server: http.Server;
    let baseUrl: string;
    const testAdminToken = 'test_token_min_32_characters_secret_key_12345';

    beforeAll(async () => {
      setQBankAdminTokenForTesting(testAdminToken);
      const testDb = new DatabaseSync(':memory:');
      testDb.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      setDbSyncForTesting(testDb);

      app = express();
      app.use(express.json());
      app.use('/api/qbank', qbankRouter);

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address() as any;
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => {
        if (server) server.close(() => resolve());
        else resolve();
      });
    });

    it('3.1: Returns 401 when request has no token', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pools/re-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization or X-QBank-Token header
        },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Thiếu token quản trị QBank');
      console.log('3.1 No-token response:', { status: res.status, body });
    });

    it('3.2: Returns 403 when request uses revoked weak token "admin123456"', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pools/re-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin123456',
        },
      });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Token "admin123456" đã bị thu hồi');
      console.log('3.2 admin123456 token response:', { status: res.status, body });
    });

    it('3.3: Returns 200 when request uses valid admin token', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pools/re-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAdminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.summary).toBeDefined();
      console.log('3.3 Valid token response:', { status: res.status, summary: body.summary });
    });
  });

  // -------------------------------------------------------------------------
  // 4. READING & LISTENING OPTION COMPATIBILITY PRESERVATION
  // -------------------------------------------------------------------------
  describe('4. Reading & Listening Option Compatibility Preservation', () => {
    it('4.1: Preserves 4-option and 5-option pedagogical flexibility for 6-word-bank reading parts', () => {
      // 6 options -> ELIGIBLE
      expect(isOptionCountCompatible('read_fill_blank_word_bank_split', 6, 6)).toBe(true);
      // 5 options -> ELIGIBLE (pedagogical standalone substitute)
      expect(isOptionCountCompatible('read_fill_blank_word_bank_split', 6, 5)).toBe(true);
      // 4 options -> ELIGIBLE (pedagogical standalone substitute)
      expect(isOptionCountCompatible('read_fill_blank_word_bank_split', 6, 4)).toBe(true);
      // 3 options -> INELIGIBLE
      expect(isOptionCountCompatible('read_fill_blank_word_bank_split', 6, 3)).toBe(false);

      const qReadingBank4 = {
        stem: '虽然工作很忙，但他____坚持每天晚上阅读一小时。',
        options: ['常常', '仍然', '偶尔', '从来'],
        answer_idx: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_split',
        level: 4,
        status: 'approved',
      };
      const res4 = validateFormatCompatibility(qReadingBank4, 4);
      expect(res4.practice_format_compatible).toBe(true);
      expect(res4.exam_format_compatible).toBe(true);
      expect(res4.exam_eligible).toBe(true);
      expect(res4.matched_blueprint_part).toBe('reading_1');
    });

    it('4.2: Preserves 4-option pedagogical substitute for 3-option reading comprehension parts', () => {
      expect(isOptionCountCompatible('read_comprehension_short_and_medium_3opt', 3, 3)).toBe(true);
      expect(isOptionCountCompatible('read_comprehension_short_and_medium_3opt', 3, 4)).toBe(true);
      expect(isOptionCountCompatible('read_comprehension_short_and_medium_3opt', 3, 2)).toBe(false);

      const qReadingComp4 = {
        stem: '根据这段短文，作者最喜欢什么活动？',
        options: ['爬山', '游泳', '打网球', '骑自行车'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_comprehension_short_and_medium_3opt',
        level: 3,
        status: 'approved',
      };
      const res = validateFormatCompatibility(qReadingComp4, 3);
      expect(res.practice_format_compatible).toBe(true);
      expect(res.exam_format_compatible).toBe(true);
      expect(res.exam_eligible).toBe(true);
      expect(res.matched_blueprint_part).toBe('reading_3');
    });

    it('4.3: Preserves 4-option pedagogical substitute for 3-option listening QA parts', () => {
      expect(isOptionCountCompatible('listen_dialogue_qa_3opt', 3, 3)).toBe(true);
      expect(isOptionCountCompatible('listen_dialogue_qa_3opt', 3, 4)).toBe(true);

      const qListeningQA4 = {
        stem: '男：今天晚上你想吃什么？\n女：我们去吃火锅吧。',
        options: ['米饭', '面条', '火锅', '烤鸭'],
        answer_idx: 2,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        level: 2,
        status: 'approved',
      };
      const res = validateFormatCompatibility(qListeningQA4, 2);
      expect(res.practice_format_compatible).toBe(true);
      expect(res.exam_format_compatible).toBe(true);
      expect(res.exam_eligible).toBe(true);
      expect(res.matched_blueprint_part).toBe('listening_3');
    });

    it('4.4: Confirms reading questions do NOT require audio text/resources', () => {
      const qReadingNoAudio = {
        stem: '阅读短文回答问题：春天的天气非常暖和。',
        options: ['很冷', '很热', '暖和', '下雪'],
        answer_idx: 2,
        skill: 'reading',
        part_type: 'read_comprehension_passages_4opt',
        level: 4,
        status: 'approved',
      };
      const res = validateFormatCompatibility(qReadingNoAudio, 4);
      expect(res.practice_format_compatible).toBe(true);
      expect(res.practice_eligible).toBe(true);
      expect(res.exam_format_compatible).toBe(true);
      expect(res.exam_eligible).toBe(true);
      expect(res.ineligible_reasons).toHaveLength(0);
    });

    it('4.5: Confirms reading and listening MCQs with 0 options are rejected (cannot bypass >= 2 options rule)', () => {
      // Reading MCQ with 0 options -> REJECTED
      const qReadingZeroOpt = {
        stem: '根据短文选出正确答案。',
        options: [],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_comprehension_passages_4opt',
        level: 4,
        status: 'approved',
      };
      const resReading = validateFormatCompatibility(qReadingZeroOpt, 4);
      expect(resReading.practice_format_compatible).toBe(false);
      expect(resReading.practice_eligible).toBe(false);
      expect(resReading.exam_eligible).toBe(false);
      expect(
        resReading.ineligible_reasons.some((r) =>
          r.includes('Số lượng phương án trả lời phải từ 2 trở lên')
        )
      ).toBe(true);

      // Listening MCQ with 0 options -> REJECTED
      const qListeningZeroOpt = {
        stem: '请听录音选择正确答案。',
        options: [],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
        level: 4,
        status: 'approved',
      };
      const resListening = validateFormatCompatibility(qListeningZeroOpt, 4);
      expect(resListening.practice_format_compatible).toBe(false);
      expect(resListening.practice_eligible).toBe(false);
      expect(resListening.exam_eligible).toBe(false);
      expect(
        resListening.ineligible_reasons.some((r) =>
          r.includes('Số lượng phương án trả lời phải từ 2 trở lên')
        )
      ).toBe(true);
    });
  });
});
