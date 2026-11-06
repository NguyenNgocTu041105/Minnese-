import { describe, it, expect } from 'vitest';
import {
  validateCandidate,
  getExpectedOptionCount,
  getBlueprintPartSpec,
  loadAllBlueprintSpecs,
} from '../src/server/llm/questionValidator.js';
import {
  getSyllabusCatalog,
  verifyQuestionVocab,
  loadApprovedNames,
} from '../src/server/qbankCoverageEngine.js';
import { CandidateQuestion } from '../src/server/llm/types.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

describe('Adversarial Challenge M1-1: questionValidator.ts & qbankCoverageEngine.ts', () => {
  // =========================================================================
  // 1. Stem Answer Leakage Edge Cases
  // =========================================================================
  describe('1. Adversarial Stem Answer Leakage Edge Cases', () => {
    it('should detect leakage when correct option is enclosed in full-width Chinese quotation marks', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '在句子里，“北京”是中国的首都。请问：中国的首都是____？',
        options: ['北京', '上海', '广州', '深圳'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A (北京).',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_4opt',
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Stem answer leakage detected'))).toBe(true);
      expect(res.actionRecommendation).toBe('quarantine');
    });

    it('should detect leakage when correct option is followed by punctuation or colon', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '北京：这是一座美丽的城市。今年我想去____旅游。',
        options: ['北京', '上海', '南京', '武汉'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_4opt',
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Stem answer leakage detected'))).toBe(true);
    });

    it('should detect leakage when blank is at the very beginning of the stem', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '____ 是中国的首都，我非常喜欢北京这座城市。',
        options: ['北京', '上海', '广州', '深圳'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_4opt',
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Stem answer leakage detected'))).toBe(true);
    });

    it('should detect leakage across different blank placeholder syntax ((), （）, [], 【】, ____)', () => {
      const formats = ['()', '（）', '[]', '【】', '____', '______'];
      for (const fmt of formats) {
        const q: Partial<CandidateQuestion> = {
          stem: `北京是中国的首都，我想去${fmt}旅游。`,
          options: ['北京', '上海', '广州', '深圳'],
          answer_idx: 0,
          explanation_vi: 'Đáp án đúng là A.',
          level: 1,
          skill: 'reading',
          part_type: 'read_comprehension_short_4opt',
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes('Stem answer leakage detected'))).toBe(true);
      }
    });

    it('should reject underspecified stems with fewer than 4 Hanzi outside the blank', () => {
      const shortStems = ['他____。', '去____？', '好____！'];
      for (const stem of shortStems) {
        const q: Partial<CandidateQuestion> = {
          stem,
          options: ['看书', '工作', '喝水', '吃饭'],
          answer_idx: 0,
          explanation_vi: 'Chọn từ phù hợp điền vào chỗ trống.',
          level: 1,
          skill: 'reading',
          part_type: 'reading_cloze',
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes('Stem context is underspecified'))).toBe(true);
      }
    });

    it('should pass cleanly when stem has sufficient context and zero answer leakage', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想在家里____。',
        options: ['看书', '工作', '学习', '睡觉'],
        answer_idx: 0,
        explanation_vi: 'Từ "看书" (đọc sách) rất phù hợp với ngữ cảnh ở nhà khi thời tiết đẹp. Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.actionRecommendation).toBe('accept');
    });
  });

  // =========================================================================
  // 2. Option Counts Across Blueprints (0, 3, 4, 5, 6 options)
  // =========================================================================
  describe('2. Adversarial Option Counts Across Blueprints', () => {
    // 0 options (writing tasks)
    it('should strictly require 0 options for write_tianzige_from_pinyin and write_sentence_from_picture_word', () => {
      const taskTypes = ['write_tianzige_from_pinyin', 'write_sentence_from_picture_word'];
      for (const part_type of taskTypes) {
        // Valid 0 options
        const isPinyin = part_type.includes('pinyin');
        const validQ: Partial<CandidateQuestion> = {
          stem: isPinyin ? '看拼音写汉字：hǎo (____)' : '请看图写句子：他在写字。',
          options: [],
          answer_idx: 0,
          illustration_theme: part_type.includes('picture') ? 'writing' : undefined,
          explanation_vi: 'Chữ viết tương ứng hoặc câu mô tả chính xác bức tranh.',
          level: 1,
          skill: 'writing',
          part_type,
        };
        const res = validateCandidate(validQ);
        expect(res.valid).toBe(true);

        // Invalid 1 option
        const invalid1: Partial<CandidateQuestion> = {
          ...validQ,
          options: ['好'],
        };
        const res1 = validateCandidate(invalid1);
        expect(res1.valid).toBe(false);
        expect(res1.errors.some((e) => e.includes('Options must be empty for writing task type'))).toBe(true);

        // Invalid 4 options
        const invalid4: Partial<CandidateQuestion> = {
          ...validQ,
          options: ['好', '你', '我', '他'],
        };
        const res4 = validateCandidate(invalid4);
        expect(res4.valid).toBe(false);
        expect(res4.errors.some((e) => e.includes('Options must be empty for writing task type'))).toBe(true);
      }
    });

    // 3 options (read_comprehension_short_3opt)
    it('should strictly enforce exactly 3 options for read_comprehension_short_3opt', () => {
      const countsToTest = [0, 1, 2, 4, 5, 6];
      for (const count of countsToTest) {
        const opts = Array.from({ length: count }, (_, i) => `选项${i + 1}`);
        const q: Partial<CandidateQuestion> = {
          stem: '李华在图书馆看书，张明在操场打篮球。问题：李华在哪里？',
          options: opts,
          answer_idx: 0,
          explanation_vi: 'Theo ngữ cảnh đoạn văn, Lý Hoa ở thư viện (图书馆). Đáp án đúng là A.',
          level: 1,
          skill: 'reading',
          part_type: 'read_comprehension_short_3opt',
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes('Options must contain exactly 3 items'))).toBe(true);
      }
    });

    // 5 options (read_paragraph_sentence_ordering)
    it('should strictly enforce exactly 5 options for read_paragraph_sentence_ordering', () => {
      const countsToTest = [0, 2, 3, 4, 6];
      for (const count of countsToTest) {
        const opts = Array.from({ length: count }, (_, i) => `句子${i + 1}。`);
        const q: Partial<CandidateQuestion> = {
          stem: '请将下列句子重新排列成通顺的段落：',
          options: opts,
          answer_idx: 0,
          explanation_vi: 'Thứ tự logic của các câu theo tiến trình thời gian.',
          level: 2,
          skill: 'reading',
          part_type: 'read_paragraph_sentence_ordering',
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes('Options must contain exactly 5 items'))).toBe(true);
      }

      // Valid 5 options
      const validQ: Partial<CandidateQuestion> = {
        stem: '请将下列句子重新排列成通顺的段落：',
        options: ['早上我起床。', '然后我吃早饭。', '八点我去上学。', '下午我和同学踢球。', '晚上回家做作业。'],
        answer_idx: 0,
        explanation_vi: 'Thứ tự thời gian hợp lý từ sáng đến tối.',
        level: 2,
        skill: 'reading',
        part_type: 'read_paragraph_sentence_ordering',
      };
      expect(validateCandidate(validQ).valid).toBe(true);
    });

    // 6 options (read_sentence_picture_match_6opt)
    it('should strictly require 6 options for read_sentence_picture_match_6opt and reject 4 options', () => {
      const invalid4: Partial<CandidateQuestion> = {
        stem: '他们在操场上跑步。',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        illustration_theme: 'classroom',
        explanation_vi: 'Hình ảnh tương ứng là bức tranh A. Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
      };
      const res4 = validateCandidate(invalid4);
      expect(res4.valid).toBe(false);
      expect(res4.errors.some((e) => e.includes('Options must contain exactly 6 items'))).toBe(true);

      const valid6: Partial<CandidateQuestion> = {
        stem: '我们在看书。',
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        options_images: ['reading', 'tea', 'coffee', 'apple', 'banana', 'taxi'],
        answer_idx: 0,
        illustration_theme: 'reading',
        explanation_vi: 'Hình ảnh tương ứng là bức tranh A. Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
      };
      const resValid6 = validateCandidate(valid6);
      expect(resValid6.valid).toBe(true);
    });

    it('should reject questions with duplicate or blank options', () => {
      const dupQ: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去公园____。',
        options: ['散步', '散步', '看书', '买东西'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      const resDup = validateCandidate(dupQ);
      expect(resDup.valid).toBe(false);
      expect(resDup.errors.some((e) => e.includes('Options must be unique'))).toBe(true);

      const emptyQ: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去公园____。',
        options: ['散步', '   ', '看书', '买东西'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      const resEmpty = validateCandidate(emptyQ);
      expect(resEmpty.valid).toBe(false);
      expect(resEmpty.errors.some((e) => e.includes('Option at index 1 is empty'))).toBe(true);
    });
  });

  // =========================================================================
  // 3. Polyphones and Multi-Level Resolution
  // =========================================================================
  describe('3. Adversarial Polyphones and Multi-Level Resolution', () => {
    it('should not flag polyphone word 还 at HSK 1, HSK 2, or HSK 3', () => {
      // '还' is HSK 1 (hái) and HSK 3 (huán)
      for (const lvl of [1, 2, 3]) {
        const res = verifyQuestionVocab(
          {
            stem: '我今天去了图书馆，____去了商店买东西。',
            options: ['还', '不', '很', '太'],
            answer_idx: 0,
          },
          lvl
        );
        expect(res.aboveLevel.some((a) => a.word === '还')).toBe(false);
      }
    });

    it('should not flag multi-level word 点 at HSK 1 or HSK 2', () => {
      // '点' appears at HSK 1 and HSK 2 (点2 in restored)
      for (const lvl of [1, 2]) {
        const res = verifyQuestionVocab(
          {
            stem: '现在是上午八____三十分。',
            options: ['点', '分', '时', '秒'],
            answer_idx: 0,
          },
          lvl
        );
        expect(res.aboveLevel.some((a) => a.word === '点')).toBe(false);
      }
    });

    it('should accurately flag truly above-level words with correct level attribution', () => {
      // HSK 4 word '丰富' tested at HSK 1
      const resHsk1 = verifyQuestionVocab(
        {
          stem: '图书馆里的藏书非常____。',
          options: ['丰富', '好', '多', '大'],
          answer_idx: 0,
        },
        1
      );
      expect(resHsk1.aboveLevel.some((a) => a.word === '丰富' && a.wordLevel === 4)).toBe(true);

      // HSK 5 word '犹豫' tested at HSK 2
      const resHsk2 = verifyQuestionVocab(
        {
          stem: '面对这个选择，他显得非常____。',
          options: ['犹豫', '高兴', '难过', '着急'],
          answer_idx: 0,
        },
        2
      );
      expect(resHsk2.aboveLevel.some((a) => a.word === '犹豫' && a.wordLevel === 5)).toBe(true);

      // HSK 6 word '一律' tested at HSK 3
      const resHsk3 = verifyQuestionVocab(
        {
          stem: '参加这次会议的人员，要求____穿正装。',
          options: ['一律', '意思', '文字', '结构'],
          answer_idx: 0,
        },
        3
      );
      expect(resHsk3.aboveLevel.some((a) => a.word === '一律' && a.wordLevel === 6)).toBe(true);
    });
  });

  // =========================================================================
  // 4. Proper Nouns Exemption (names.txt) vs Out-of-Syllabus
  // =========================================================================
  describe('4. Adversarial Proper Nouns Exemption vs Out-of-Syllabus Words', () => {
    it('should exempt all approved proper nouns in stem, options, and transcript', () => {
      const approvedNames = loadApprovedNames();
      expect(approvedNames.size).toBeGreaterThanOrEqual(20);

      // Test multiple approved proper nouns in a single question
      const res = verifyQuestionVocab(
        {
          stem: '李华、王明和张伟在北京学习，李娜和刘洋在上海工作。小明问王老师关于中国和越南的问题。',
          options: ['北京', '上海', '广州', '深圳'],
          answer_idx: 0,
          transcript: '陈晨和小红明天从河内出发去广州。',
        },
        1
      );

      // None of the approved names should appear in outOfSyllabus
      for (const name of ['李华', '王明', '张伟', '李娜', '刘洋', '北京', '上海', '小明', '王老师', '中国', '越南', '陈晨', '小红', '河内', '广州']) {
        expect(res.outOfSyllabus.includes(name)).toBe(false);
      }
    });

    it('should detect true out-of-syllabus rare/archaic characters in stem and options', () => {
      const rareChars = ['魑魅魍魉', '饕餮', '龘'];
      for (const rare of rareChars) {
        const res = verifyQuestionVocab(
          {
            stem: `这个句子包含生僻未列入大纲的汉字：${rare}。`,
            options: ['测试', '汉字', '词汇', '句子'],
            answer_idx: 0,
          },
          1
        );
        expect(res.outOfSyllabus.length).toBeGreaterThan(0);
      }
    });

    it('should detect out-of-syllabus option when option is a non-syllabus word', () => {
      const res = verifyQuestionVocab(
        {
          stem: '今天天气很好，我们一起去学校。',
          options: ['饕餮', '学校', '医院', '商店'],
          answer_idx: 0,
        },
        1
      );
      expect(res.outOfSyllabus.includes('饕餮')).toBe(true);
    });
  });

  // =========================================================================
  // 5. Explanation Contradictions & Misattributions
  // =========================================================================
  describe('5. Adversarial Explanation Contradictions & Misattributions', () => {
    it('should detect explicit option letter contradictions (A, B, C, D, E, F)', () => {
      const options = ['苹果', '香蕉', '西瓜', '草莓'];
      // answer_idx = 0 -> Option A
      const contradictions = [
        'Đáp án đúng là B vì quả chuối có vị ngọt.',
        'Chọn C vì quả dưa hấu giải nhiệt rất tốt.',
        'Phương án đúng là: D.',
        'B là đáp án đúng trong trường hợp này.',
        'đáp án đúng là b', // lowercase b
      ];

      for (const explanation_vi of contradictions) {
        const q: Partial<CandidateQuestion> = {
          stem: '他喜欢吃的水果是____。',
          options,
          answer_idx: 0, // Option A
          explanation_vi,
          level: 1,
          skill: 'reading',
          part_type: 'reading_cloze',
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes('Explanation contradicts answer_idx'))).toBe(true);
        expect(res.actionRecommendation).toBe('quarantine');
      }
    });

    it('should detect when an explanation designates a distractor as correct', () => {
      const options = ['天气', '医生', '桌子', '苹果'];
      // answer_idx = 0 ('天气'). Distractors: 医生, 桌子, 苹果
      const distractorExps = [
        'Theo ngữ cảnh sức khỏe, đáp án đúng là "医生".',
        'Vì vậy chọn "桌子" là chính xác nhất.',
        'Đáp án đúng là: "苹果".',
        'Chọn “医生” vì đây là danh từ chỉ người.',
      ];

      for (const explanation_vi of distractorExps) {
        const q: Partial<CandidateQuestion> = {
          stem: '今天____真好，我们去公园散步。',
          options,
          answer_idx: 0,
          explanation_vi,
          level: 1,
          skill: 'reading',
          part_type: 'reading_cloze',
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes('Explanation designates distractor'))).toBe(true);
        expect(res.actionRecommendation).toBe('quarantine');
      }
    });

    it('should accept coherent explanations that support the correct option and letter', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '今天____很好，我们去学校。',
        options: ['天气', '医生', '桌子', '苹果'],
        answer_idx: 0,
        explanation_vi: 'Từ "天气" (thời tiết) kết hợp tự nhiên với "很好". Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.actionRecommendation).toBe('accept');
    });
  });

  // =========================================================================
  // 5b. Extended Multi-Layer Invariant Stress Tests
  // =========================================================================
  describe('5b. Extended Multi-Layer Invariant Stress Tests', () => {
    it('should NOT flag reading passage containing the answer as stem leakage', () => {
      // In reading comprehension, the passage SHOULD contain the answer
      const q: Partial<CandidateQuestion> = {
        passage: '北京是中国的首都，也是一座历史悠久的文化名城。',
        stem: '中国的首都是哪个城市？',
        options: ['北京', '上海', '广州', '深圳'],
        answer_idx: 0,
        explanation_vi: 'Theo đoạn văn, Bắc Kinh (北京) là thủ đô của Trung Quốc. Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_4opt',
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(true);
      expect(res.errors.some((e) => e.includes('Stem answer leakage detected'))).toBe(false);
    });

    it('should exempt word-bank task types from single blank limitation', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '小明在学校____，小红在家里____。',
        options: ['学习', '看书', '工作', '睡觉'],
        answer_idx: 0,
        explanation_vi: 'Điền các từ thích hợp từ ngân hàng từ vào chỗ trống.',
        level: 1,
        skill: 'reading',
        part_type: 'read_cloze_word_bank',
      };
      const res = validateCandidate(q);
      // Should not complain about multiple blanks because part_type contains 'bank'
      expect(res.errors.some((e) => e.includes('must contain exactly one blank placeholder'))).toBe(false);
    });

    it('should verify listening dialogue turn format with 男 and 女', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '男：请问图书馆在哪里？女：在前面教学楼的二楼。问：图书馆在几楼？',
        options: ['一楼', '二楼', '三楼', '四楼'],
        answer_idx: 1,
        explanation_vi: 'Người nữ nói thư viện ở tầng hai (二楼). Đáp án đúng là B.',
        level: 1,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(true);
      expect(res.warnings.some((w) => w.includes('should contain spoken dialogue turns'))).toBe(false);
    });

    it('should promote over-level tested vocab to error when strictLevel option is enabled', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '图书馆里的藏书非常____。',
        options: ['丰富', '好', '多', '大'], // '丰富' is HSK 4
        answer_idx: 0,
        explanation_vi: 'Từ phong phú phù hợp nhất.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      // Normal validation -> warning
      const resNormal = validateCandidate(q);
      expect(resNormal.valid).toBe(true);
      expect(resNormal.warnings.some((w) => w.includes('Tested vocabulary exceeds HSK Level 1'))).toBe(true);
      expect(resNormal.actionRecommendation).toBe('needs_admin_review');

      // Strict level validation -> error!
      const resStrict = validateCandidate(q, [], { strictLevel: true });
      expect(resStrict.valid).toBe(false);
      expect(resStrict.errors.some((e) => e.includes('Tested vocabulary exceeds HSK Level 1'))).toBe(true);
      expect(resStrict.actionRecommendation).toBe('quarantine');
    });

    it('should detect declared tested vocabulary false claims when absent from text', () => {
      const res = verifyQuestionVocab(
        {
          stem: '今天天气很好，我们在家里看书。',
          options: ['看书', '工作', '学习', '睡觉'],
          answer_idx: 0,
          tested_vocab: ['看书', '苹果', '飞机'], // '苹果' and '飞机' do not appear in question!
        },
        1
      );
      expect(res.discrepancies.falseClaims).toContain('苹果');
      expect(res.discrepancies.falseClaims).toContain('飞机');
    });
  });

  // =========================================================================
  // 6. Database SHA-256 Hash Invariant
  // =========================================================================
  describe('6. Database SHA-256 Hash Invariant Check', () => {
    it('should preserve data/hsk_exam.db hash exactly unchanged', () => {
      const dbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      expect(fs.existsSync(dbPath)).toBe(true);
      const hash = crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });
  });
});
