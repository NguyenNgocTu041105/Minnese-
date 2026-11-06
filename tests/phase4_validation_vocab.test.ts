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

describe('Phase 4 Milestone 1: Dynamic Question Validation & Verified Vocab Checking', () => {
  // =========================================================================
  // 1. Dynamic Blueprint Option Matching
  // =========================================================================
  describe('1. Dynamic Blueprint Option Matching (R1)', () => {
    it('should correctly load blueprint specs from level1..level6.json', () => {
      const specs = loadAllBlueprintSpecs();
      expect(specs.size).toBeGreaterThan(10);

      // Verify specific blueprint specs
      const read3opt = getBlueprintPartSpec(1, 'read_comprehension_short_3opt');
      expect(read3opt).not.toBeNull();
      expect(read3opt?.n_options).toBe(3);

      const writeTianzige = getBlueprintPartSpec(1, 'write_tianzige_from_pinyin');
      expect(writeTianzige).not.toBeNull();
      expect(writeTianzige?.n_options).toBe(0);

      const readOrder5opt = getBlueprintPartSpec(2, 'read_paragraph_sentence_ordering');
      expect(readOrder5opt).not.toBeNull();
      expect(readOrder5opt?.n_options).toBe(5);

      const readPic6opt = getBlueprintPartSpec(1, 'read_sentence_picture_match_6opt');
      expect(readPic6opt).not.toBeNull();
      expect(readPic6opt?.n_options).toBe(6);
    });

    it('should correctly determine expected option count for various task types', () => {
      expect(getExpectedOptionCount(1, 'write_tianzige_from_pinyin')).toBe(0);
      expect(getExpectedOptionCount(1, 'write_sentence_from_picture_word')).toBe(0);
      expect(getExpectedOptionCount(1, 'read_comprehension_short_3opt')).toBe(3);
      expect(getExpectedOptionCount(2, 'read_paragraph_sentence_ordering')).toBe(5);
      expect(getExpectedOptionCount(1, 'read_sentence_picture_match_6opt')).toBe(6);
      expect(getExpectedOptionCount(1, 'listen_dialogue_qa_4opt')).toBe(4);
    });

    it('should enforce 0 options for writing task types and reject options if present', () => {
      const validWriting: Partial<CandidateQuestion> = {
        stem: '看这儿写字：wǒ (____)',
        options: [],
        answer_idx: 0,
        explanation_vi: 'Chữ viết tương ứng với pinyin wǒ là 我.',
        level: 1,
        skill: 'writing',
        part_type: 'write_tianzige_from_pinyin',
      };
      const resValid = validateCandidate(validWriting);
      expect(resValid.valid).toBe(true);

      const invalidWriting: Partial<CandidateQuestion> = {
        ...validWriting,
        options: ['我', '你', '他'],
      };
      const resInvalid = validateCandidate(invalidWriting);
      expect(resInvalid.valid).toBe(false);
      expect(resInvalid.errors.some((e) => e.includes('Options must be empty for writing task type'))).toBe(true);
    });

    it('should enforce 3 options for read_comprehension_short_3opt', () => {
      const valid3opt: Partial<CandidateQuestion> = {
        stem: '他在学校学习汉语。★ 他在哪里学习？',
        options: ['学校', '医院', '商店'],
        answer_idx: 0,
        explanation_vi: 'Theo đoạn văn, anh ấy học tiếng Hán ở trường học (学校).',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };
      const resValid = validateCandidate(valid3opt);
      expect(resValid.valid).toBe(true);

      const invalid4opt: Partial<CandidateQuestion> = {
        ...valid3opt,
        options: ['学校', '医院', '商店', '饭店'],
      };
      const resInvalid = validateCandidate(invalid4opt);
      expect(resInvalid.valid).toBe(false);
      expect(resInvalid.errors.some((e) => e.includes('Options must contain exactly 3 items'))).toBe(true);
    });

    it('should enforce 5 options for read_paragraph_sentence_ordering', () => {
      const valid5opt: Partial<CandidateQuestion> = {
        stem: '请将下列句子排列成一段通顺的短文：',
        options: ['今天天气很好。', '我和朋友去公园。', '我们在公园散步。', '下午我们一起喝茶。', '大家都非常高兴。'],
        answer_idx: 0,
        explanation_vi: 'Thứ tự logic của các câu theo diễn biến thời gian và cảm xúc.',
        level: 2,
        skill: 'reading',
        part_type: 'read_paragraph_sentence_ordering',
      };
      const resValid = validateCandidate(valid5opt);
      expect(resValid.valid).toBe(true);

      const invalid4opt: Partial<CandidateQuestion> = {
        ...valid5opt,
        options: valid5opt.options!.slice(0, 4),
      };
      const resInvalid = validateCandidate(invalid4opt);
      expect(resInvalid.valid).toBe(false);
      expect(resInvalid.errors.some((e) => e.includes('Options must contain exactly 5 items'))).toBe(true);
    });

    it('should enforce 6 options for read_sentence_picture_match_6opt', () => {
      const valid6opt: Partial<CandidateQuestion> = {
        stem: '他在看书。',
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        options_images: ['reading', 'tea', 'coffee', 'apple', 'banana', 'taxi'],
        answer_idx: 0,
        illustration_theme: 'reading',
        explanation_vi: 'Hình ảnh tương ứng là bức tranh A. Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
      };
      const resValid = validateCandidate(valid6opt);
      expect(resValid.valid).toBe(true);

      const invalid4opt: Partial<CandidateQuestion> = {
        ...valid6opt,
        options: ['A', 'B', 'C', 'D'],
      };
      const resInvalid = validateCandidate(invalid4opt);
      expect(resInvalid.valid).toBe(false);
      expect(resInvalid.errors.some((e) => e.includes('Options must contain exactly 6 items'))).toBe(true);
    });
  });

  // =========================================================================
  // 2. Deterministic Single-Answer & MCQ Quality Checks
  // =========================================================================
  describe('2. Deterministic Single-Answer & MCQ Quality Checks (R1)', () => {
    it('should reject questions with stem answer leakage', () => {
      const leakedCandidate: Partial<CandidateQuestion> = {
        stem: '北京是中国的首都，我非常喜欢北京这座漂亮的城市，我想去____。',
        options: ['北京', '学校', '医院', '商店'],
        answer_idx: 0, // Correct option '北京' already appears multiple times in stem outside blank!
        explanation_vi: 'Đáp án đúng là A (北京).',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };
      const res = validateCandidate(leakedCandidate);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Stem answer leakage detected'))).toBe(true);
    });

    it('should reject underspecified stem context (<4 Hanzi outside blank)', () => {
      const underspecifiedCandidate: Partial<CandidateQuestion> = {
        stem: '他____。',
        options: ['去', '看', '吃', '喝'],
        answer_idx: 0,
        explanation_vi: 'Chọn từ phù hợp vào chỗ trống.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      const res = validateCandidate(underspecifiedCandidate);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Stem context is underspecified'))).toBe(true);
    });

    it('should enforce exactly one blank placeholder for fill-in-the-blank questions', () => {
      const multiBlankCandidate: Partial<CandidateQuestion> = {
        stem: '今天天气____，我们一起去____玩。',
        options: ['很好', '不好', '不行', '可以'],
        answer_idx: 0,
        explanation_vi: 'Điền từ thích hợp vào chỗ trống.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      const res = validateCandidate(multiBlankCandidate);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must contain exactly one blank placeholder'))).toBe(true);
    });
  });

  // =========================================================================
  // 3. Explanation-to-Answer Consistency
  // =========================================================================
  describe('3. Explanation-to-Answer Consistency (R1)', () => {
    it('should reject explanations that contradict answer_idx by option letter', () => {
      const contradictingCandidate: Partial<CandidateQuestion> = {
        stem: '今天天气真好，我们一起去公园散步吧。',
        options: ['天气', '医生', '桌子', '苹果'],
        answer_idx: 0, // Option A is correct
        explanation_vi: 'Trong câu này ngữ cảnh nói về thời tiết, do đó đáp án đúng là B.', // Contradicts answer_idx 0!
        level: 1,
        skill: 'reading',
      };
      const res = validateCandidate(contradictingCandidate);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Explanation contradicts answer_idx'))).toBe(true);
    });

    it('should reject explanations that designate a distractor as correct', () => {
      const distractorCandidate: Partial<CandidateQuestion> = {
        stem: '今天天气真好，我们一起去公园散步吧。',
        options: ['天气', '医生', '桌子', '苹果'],
        answer_idx: 0, // Option 0 '天气'
        explanation_vi: 'Trong câu này nói về sức khỏe nên đáp án đúng là "医生".', // Designates distractor '医生' as correct!
        level: 1,
        skill: 'reading',
      };
      const res = validateCandidate(distractorCandidate);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("Explanation designates distractor '医生' as correct"))).toBe(true);
    });

    it('should accept consistent explanations matching answer_idx and correct option', () => {
      const validCandidate: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想在家里看书。',
        options: ['天气', '医生', '桌子', '苹果'],
        answer_idx: 0, // Option 0 '天气'
        explanation_vi: 'Từ "天气" (thời tiết) phù hợp với ngữ cảnh ở nhà khi thời tiết đẹp. Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
      };
      const res = validateCandidate(validCandidate);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });
  });

  // =========================================================================
  // 4. Listening Audio & Transcript Verification
  // =========================================================================
  describe('4. Listening Audio & Transcript Verification (R1)', () => {
    it('should reject listening question with missing audio text or transcript', () => {
      const missingAudio: Partial<CandidateQuestion> = {
        stem: ' ',
        options: ['高兴', '难过', '生气', '着急'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết về cảm xúc trong bài nghe.',
        level: 1,
        skill: 'listening',
      };
      const res = validateCandidate(missingAudio);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Listening question requires audio text'))).toBe(true);
    });

    it('should warn when listening dialogue lacks spoken dialogue turns', () => {
      const dialogueNoTurns: Partial<CandidateQuestion> = {
        stem: '他们打算明天上午去学校看书。',
        options: ['学校', '医院', '商店', '家'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết về địa điểm trong đoạn hội thoại.',
        level: 1,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
      };
      const res = validateCandidate(dialogueNoTurns);
      expect(res.warnings.some((w) => w.includes('should contain spoken dialogue turns'))).toBe(true);
    });

    it('should accept listening dialogue with proper dialogue turns', () => {
      const validDialogue: Partial<CandidateQuestion> = {
        stem: '女：明天上午我们去哪里？男：我们去学校看书吧。问：他们打算去哪里？',
        options: ['学校', '医院', '商店', '家'],
        answer_idx: 0,
        explanation_vi: 'Trong đoạn hội thoại, người nam đề xuất đi trường học (学校). Đáp án đúng là A.',
        level: 1,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
      };
      const res = validateCandidate(validDialogue);
      expect(res.valid).toBe(true);
      expect(res.warnings.some((w) => w.includes('should contain spoken dialogue turns'))).toBe(false);
    });
  });

  // =========================================================================
  // 5. Verified Catalog Loading & Vocab Checking (R2)
  // =========================================================================
  describe('5. Verified Catalog Loading & Vocab Level Checking (R2)', () => {
    it('should load restored items from vocab_restored.jsonl into catalog.words', () => {
      const catalog = getSyllabusCatalog();
      expect(catalog.words.size).toBeGreaterThanOrEqual(5334);

      // Verify that restored items exist in catalog.words
      // E.g. '一下儿', '一会儿', etc.
      const yiKuair = catalog.words.get('一块儿') || catalog.words.get('一会儿');
      expect(yiKuair).toBeDefined();

      // Verify allWordLevels map exists
      expect(catalog.allWordLevels).toBeDefined();
      expect(catalog.allWordLevels!.size).toBeGreaterThan(0);
    });

    it('should load approved proper nouns from names.txt', () => {
      const names = loadApprovedNames();
      expect(names.size).toBeGreaterThanOrEqual(20);
      expect(names.has('李华')).toBe(true);
      expect(names.has('北京')).toBe(true);
      expect(names.has('上海')).toBe(true);
    });

    it('should detect above-level tested words and issue an appropriate warning', () => {
      // Testing HSK 3 word '世界' in an HSK 1 question
      const res = verifyQuestionVocab(
        {
          stem: '这是我们的 ____。',
          options: ['世界', '学校', '医院', '商店'],
          answer_idx: 0, // '世界' is HSK 3!
        },
        1
      );

      expect(res.aboveLevel).toBeDefined();
      expect(res.aboveLevel.length).toBeGreaterThan(0);
      expect(res.aboveLevel.some((a) => a.word === '世界' && a.wordLevel === 3)).toBe(true);
    });

    it('should not flag approved proper nouns as out-of-syllabus', () => {
      const res = verifyQuestionVocab(
        {
          stem: '李华在北京学习汉语，张明在上海工作。',
          options: ['汉语', '英语', '法语', '德语'],
          answer_idx: 0,
        },
        1
      );

      // '李华', '北京', '上海' should NOT be in outOfSyllabus
      expect(res.outOfSyllabus).toBeDefined();
      expect(res.outOfSyllabus.includes('李华')).toBe(false);
      expect(res.outOfSyllabus.includes('北京')).toBe(false);
      expect(res.outOfSyllabus.includes('上海')).toBe(false);
    });

    it('should flag true out-of-syllabus words requiring review', () => {
      // Contains rare archaic character not in HSK 1-6 syllabus
      const res = verifyQuestionVocab(
        {
          stem: '这是一个测试句子，包含生僻字：魑魅魍魉。',
          options: ['测试', '句子', '包含', '汉字'],
          answer_idx: 0,
        },
        1
      );

      expect(res.outOfSyllabus).toBeDefined();
      expect(res.outOfSyllabus.length).toBeGreaterThan(0);
    });

    it('should correctly scan words from transcript/audio_text as contextual vocabulary', () => {
      const res = verifyQuestionVocab(
        {
          stem: '问：他们打算去哪里？',
          options: ['学校', '商店', '医院', '饭馆'],
          answer_idx: 0,
          transcript: '女：明天我们去学校上课。男：好的，我们八点见。',
        },
        1
      );

      expect(res.tested).toContain('学校');
      expect(res.contextual).toContain('上课');
      expect(res.contextual).toContain('明天');
    });
  });

  // =========================================================================
  // 6. Issue Classification and Action Recommendations
  // =========================================================================
  describe('6. Issue Classification and Action Recommendations (R1 & R2)', () => {
    it('should recommend quarantine for critical errors like answer leakage or contradiction', () => {
      const leaked: Partial<CandidateQuestion> = {
        stem: '北京是中国的首都，北京 ____。',
        options: ['北京', '上海', '广州', '深圳'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A.',
        level: 1,
        skill: 'reading',
      };
      const res = validateCandidate(leaked);
      expect(res.valid).toBe(false);
      expect(res.actionRecommendation).toBe('quarantine');
      expect(res.issues?.some((i) => i.classification === 'invalid_quarantine')).toBe(true);
    });

    it('should recommend regenerate for structural option count mismatch', () => {
      const wrongCount: Partial<CandidateQuestion> = {
        stem: '他在学校学习汉语。★ 他在哪里学习？',
        options: ['学校', '医院'], // Needs 3 options for read_comprehension_short_3opt
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết theo chuẩn sư phạm.',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };
      const res = validateCandidate(wrongCount);
      expect(res.valid).toBe(false);
      expect(res.actionRecommendation).toBe('regenerate');
      expect(res.issues?.some((i) => i.classification === 'regenerate')).toBe(true);
    });

    it('should recommend needs_admin_review when question has over-level vocabulary or out-of-syllabus warnings', () => {
      const overLevel: Partial<CandidateQuestion> = {
        stem: '今天我们在学校看书，小明在家里看书。',
        options: ['介绍', '工作', '学习', '看书'],
        answer_idx: 0, // '介绍' is HSK 2 in an HSK 1 question -> over-level warning!
        explanation_vi: 'Từ "介绍" (giới thiệu) vượt quá trình độ HSK 1.',
        level: 1,
        skill: 'reading',
      };
      const res = validateCandidate(overLevel);
      expect(res.valid).toBe(true); // Valid candidate with warning
      expect(res.warnings.some((w) => w.includes('Tested vocabulary exceeds HSK Level 1'))).toBe(true);
      expect(res.actionRecommendation).toBe('needs_admin_review');
    });

    it('should recommend accept for completely valid and clean candidate questions', () => {
      const cleanCandidate: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想在家里____。',
        options: ['看书', '工作', '学习', '睡觉'],
        answer_idx: 0,
        explanation_vi: 'Từ "看书" (đọc sách) rất phù hợp với ngữ cảnh ở nhà khi thời tiết đẹp.',
        level: 1,
        skill: 'reading',
        part_type: 'reading_cloze',
      };
      const res = validateCandidate(cleanCandidate);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.warnings.length).toBe(0);
      expect(res.actionRecommendation).toBe('accept');
    });
  });
});
