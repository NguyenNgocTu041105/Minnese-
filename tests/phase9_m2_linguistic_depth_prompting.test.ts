/**
 * tests/phase9_m2_linguistic_depth_prompting.test.ts
 *
 * Phase 9 / Milestone 2 Verification Suite: Linguistic Depth Prompting,
 * Difficulty Tiers, Grammar Benchmarks, and Distractor Rationales Normalization.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import {
  buildHskPrompt,
  HSK_GRAMMAR_LEVEL_GUIDELINES,
  getDifficultyTierInstructions,
  getTrapTypeInstructions,
} from '../src/server/llm/promptTemplates.js';
import {
  normalizeQuestionAliases,
} from '../src/server/llm/jsonParser.js';
import {
  parseExplanationDistractorRationales,
  parseExplanationMetadata,
} from '../src/server/qbankCoverageEngine.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Phase 9 Milestone 2: Linguistic Depth & Distractor Prompting', () => {
  describe('Suite 1: buildHskPrompt Linguistic Depth & Grammar Guidelines', () => {
    it('1.1 includes HSK 1-6 core grammar guidelines by level', () => {
      const p1 = buildHskPrompt(1, 'reading', 3);
      expect(p1).toContain(HSK_GRAMMAR_LEVEL_GUIDELINES[1]);
      expect(p1).toContain('Basic SVO word order');

      const p3 = buildHskPrompt(3, 'reading', 3);
      expect(p3).toContain('Disposal 把-construction');

      const p4 = buildHskPrompt(4, 'reading', 3);
      expect(p4).toContain('Passive 被-construction');

      const p5 = buildHskPrompt(5, 'reading', 3);
      expect(p5).toContain('Nuanced chengyu');

      const p6 = buildHskPrompt(6, 'reading', 3);
      expect(p6).toContain('Faulty sentence patterns');
    });

    it('1.2 incorporates Difficulty Tier instructions properly', () => {
      const pTier1 = buildHskPrompt(2, 'reading', 3, [], 'read_fill_blank_4opt', undefined, 'tier1_difficult');
      expect(pTier1).toContain('DIFFICULTY TIER: Tier 1 (Difficult - Contextual Collocation)');

      const pTier2 = buildHskPrompt(3, 'reading', 3, [], 'read_fill_blank_4opt', undefined, 'tier2_very_difficult');
      expect(pTier2).toContain('DIFFICULTY TIER: Tier 2 (Very Difficult - Near-Synonym & Structural Discrimination)');
      expect(pTier2).toContain('disambiguating context token');

      const pTier3 = buildHskPrompt(4, 'reading', 3, [], 'read_fill_blank_4opt', undefined, 'tier3_challenge');
      expect(pTier3).toContain('DIFFICULTY TIER: Tier 3 (Challenge - Deep Grammar & Multi-Clause Logic)');
      expect(pTier3).toContain('把/被 constructions');
    });

    it('1.3 incorporates Trap Strategy instructions and target grammar focus', () => {
      const pTrap = buildHskPrompt(
        3,
        'reading',
        3,
        [],
        'read_fill_blank_4opt',
        'Du lịch',
        'tier2_very_difficult',
        '把字句',
        'near_synonym'
      );
      expect(pTrap).toContain('TRAP STRATEGY: Near-Synonym Discrimination');
      expect(pTrap).toContain('Explicit Target Grammar Focus: You MUST construct questions specifically testing "把字句"');
      expect(pTrap).toContain('Contextual Topic / Thematic Focus: All questions and scenarios MUST focus on the theme "Du lịch"');
      expect(pTrap).toContain('distractor_rationales');
    });

    it('1.4 preserves 100% backwards compatibility when called with 6 parameters', () => {
      const legacyPrompt = buildHskPrompt(2, 'reading', 5, [], 'read_fill_blank_4opt', 'Shopping');
      expect(legacyPrompt).toBeDefined();
      expect(legacyPrompt).toContain('HSK Level 2 exam questions');
      expect(legacyPrompt).toContain('Shopping');
      expect(legacyPrompt).toContain('SAME PART-OF-SPEECH (POS) DISTRACTORS');
    });

    it('1.5 clamps levels safely between 1 and 6 for out-of-range inputs', () => {
      const pLow = buildHskPrompt(0, 'reading', 1);
      expect(pLow).toContain('HSK LEVEL 1 SPECIFICATIONS');

      const pNegative = buildHskPrompt(-5, 'reading', 1);
      expect(pNegative).toContain('HSK LEVEL 1 SPECIFICATIONS');

      const pHigh = buildHskPrompt(7, 'reading', 1);
      expect(pHigh).toContain('HSK LEVEL 6 SPECIFICATIONS');

      const pHuge = buildHskPrompt(999, 'reading', 1);
      expect(pHuge).toContain('HSK LEVEL 6 SPECIFICATIONS');
    });

    it('1.6 enforces 0 options for open-ended writing tasks without distractor instructions', () => {
      const pWriting = buildHskPrompt(
        4,
        'writing',
        1,
        [],
        'write_sentence_from_picture_word',
        undefined,
        'tier2_very_difficult'
      );
      expect(pWriting).toContain('OPEN-ENDED WRITING (0 OPTIONS)');
      expect(pWriting).toContain('"options": []');
      expect(pWriting).not.toContain('The 3 distractors MUST belong to the SAME Part of Speech');
    });
  });

  describe('Suite 2: normalizeQuestionAliases & Distractor Rationales Normalization', () => {
    it('2.1 extracts difficulty_tier, trap_type, target_grammar, target_vocabulary', () => {
      const raw = {
        stem: '他在医院工作，他是一名____。',
        options: ['医生', '老师', '司机', '工人'],
        answer_idx: 0,
        explanation_vi: 'Dịch nghĩa: Anh ấy làm việc ở bệnh viện, anh ấy là bác sĩ.',
        difficulty_tier: 'tier2_very_difficult',
        trap_type: 'near_synonym_collocation',
        target_grammar: '处所与职业搭配',
        target_vocabulary: '医生',
      };

      const normalized = normalizeQuestionAliases(raw, 2, 'reading');
      expect(normalized).toBeDefined();
      expect(normalized?.difficulty_tier).toBe('tier2_very_difficult');
      expect(normalized?.trap_type).toBe('near_synonym_collocation');
      expect(normalized?.target_grammar).toBe('处所与职业搭配');
      expect(normalized?.target_vocabulary).toBe('医生');
    });

    it('2.2 automatically enriches explanation_vi with distractor rationales when provided as object', () => {
      const raw = {
        stem: '桌子上有三个____。',
        options: ['苹果', '包子', '米饭', '饺子'],
        answer_idx: 0,
        explanation_vi: 'Dịch: Trên bàn có ba quả táo.',
        difficulty_tier: 'tier1_difficult',
        trap_type: 'collocation',
        target_grammar: '量词与名词搭配',
        distractor_rationales: {
          '1': 'Phương án B (包子): Bánh bao thường dùng lượng từ 个 hoặc 笼 nhưng không phù hợp ngữ cảnh hoa quả.',
          '2': 'Phương án C (米饭): Cơm dùng lượng từ 碗 (bát).',
          '3': 'Phương án D (饺子): Sủi cảo dùng lượng từ 个 hoặc 盘.',
        },
      };

      const normalized = normalizeQuestionAliases(raw, 1, 'reading');
      expect(normalized).toBeDefined();
      expect(normalized?.explanation_vi).toContain('- Phân tích phương án nhiễu:');
      expect(normalized?.explanation_vi).toContain('Phương án B (包子)');
      expect(normalized?.explanation_vi).toContain('[Cấu trúc bẫy: collocation | Độ khó: tier1_difficult | Ngữ pháp: 量词与名词搭配]');
      expect(normalized?.distractor_rationales).toBeDefined();
    });

    it('2.3 automatically extracts distractor_rationales from explanation_vi if already present in text', () => {
      const raw = {
        stem: '今天天气很好，我想去____借两本书。',
        options: ['学校', '医院', '机场', '商店'],
        answer_idx: 0,
        explanation_vi: `Dịch nghĩa: Hôm nay thời tiết rất tốt, tôi muốn đến trường học mượn hai cuốn sách.
- Đáp án đúng: Đi với hành động mượn sách ('借两本书') thì địa điểm phù hợp nhất là '学校' (trường học).
- Phân tích phương án nhiễu:
  + Phương án B (医院): Là bệnh viện, nơi khám chữa bệnh, không thể mượn sách.
  + Phương án C (机场): Là sân bay, không phù hợp.
  + Phương án D (商店): Là cửa hàng buôn bán, không dùng để mượn sách.
[Cấu trúc bẫy: collocation | Độ khó: tier1_difficult | Ngữ pháp: 基本SVO与处所词]`,
      };

      const normalized = normalizeQuestionAliases(raw, 1, 'reading');
      expect(normalized).toBeDefined();
      expect(normalized?.difficulty_tier).toBe('tier1_difficult');
      expect(normalized?.trap_type).toBe('collocation');
      expect(normalized?.target_grammar).toBe('基本SVO与处所词');
      expect(normalized?.distractor_rationales).toBeDefined();
      expect((normalized?.distractor_rationales as any)['1']).toContain('bệnh viện');
    });
  });

  describe('Suite 3: Coverage Engine Distractor Rationales & Metadata Parsing', () => {
    it('3.1 parseExplanationDistractorRationales parses both standard and bracketed variants', () => {
      const textStandard = `
        - Đáp án đúng: A là đáp án đúng.
        - Phân tích phương án nhiễu:
          + Phương án B (亲切): Dùng miêu tả thái độ, không dùng cho cảnh quan.
          + Phương án C (热烈): Dùng cho không khí, hội trường.
          + Phương án D (平静): Miêu tả mặt nước hoặc tâm trạng.
      `;
      const res1 = parseExplanationDistractorRationales(textStandard, ['美丽', '亲切', '热烈', '平静'], 0);
      expect(res1.hasDistractorRationales).toBe(true);
      expect(res1.distractors.length).toBe(3);
      expect(res1.distractors[0].optionIdx).toBe(1);
      expect(res1.distractors[0].rationaleVi).toContain('thái độ');

      const textBracketed = `
        [Phương án sai B]: Từ này sai ngữ pháp.
        [Phương án sai C]: Từ này trái nghĩa với ngữ cảnh.
        [Phương án sai D]: Từ này dùng lượng từ khác.
      `;
      const res2 = parseExplanationDistractorRationales(textBracketed, ['A', 'B', 'C', 'D'], 0);
      expect(res2.hasDistractorRationales).toBe(true);
      expect(res2.distractors.length).toBe(3);
      expect(res2.distractors[0].optionIdx).toBe(1);
    });

    it('3.2 parseExplanationMetadata parses structured tag blocks and fallback regexes', () => {
      const textWithBlock = `Giải thích toàn câu. [Cấu trúc bẫy: ba_bei_structure | Độ khó: tier3_challenge | Ngữ pháp: 把字句处理式]`;
      const meta1 = parseExplanationMetadata(textWithBlock);
      expect(meta1.difficulty_tier).toBe('tier3_challenge');
      expect(meta1.trap_type).toBe('ba_bei_structure');
      expect(meta1.target_grammar).toBe('把字句处理式');

      const textFallback = `Độ khó: tier2_very_difficult. Cấu trúc bẫy: near_synonym. Ngữ pháp: 连词配对.`;
      const meta2 = parseExplanationMetadata(textFallback);
      expect(meta2.difficulty_tier).toBe('tier2_very_difficult');
      expect(meta2.trap_type).toBe('near_synonym');
      expect(meta2.target_grammar).toBe('连词配对');
    });
  });

  describe('Suite 4: Database Safety & Bit-for-Bit Hash Invariants', () => {
    it('4.1 verifies data/hsk_exam.db hash remains immutable', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
