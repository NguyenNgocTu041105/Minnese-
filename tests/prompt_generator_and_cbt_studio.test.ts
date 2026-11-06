import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildExternalAiPrompt,
  EXTERNAL_MODEL_LABELS,
  EXTERNAL_PROMPT_FORMAT_LABELS,
  type ExternalAiModelTarget,
  type ExternalPromptFormatType,
} from '../src/utils/externalAiPromptBuilder';
import {
  convertImportedToCbtQuestion,
  createCustomExamSet,
  loadCustomExamSets,
  saveCustomExamSetToStorage,
  deleteCustomExamSetFromStorage,
  STORAGE_KEY_CUSTOM_EXAM_SETS,
} from '../src/utils/customExamSetManager';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser';

describe('M4 & M5: 1-Click External AI Prompt Builder & Instant CBT Custom Exam Studio', () => {
  describe('M4: External AI Prompt Builder (Gemini, DeepSeek, Claude, Grok, ChatGPT)', () => {
    const models: ExternalAiModelTarget[] = ['gemini', 'deepseek', 'claude', 'grok', 'chatgpt'];
    const formats: ExternalPromptFormatType[] = [
      'multi_part_20q',
      'ielts_listening_traps',
      'shared_word_bank_cloze',
      'reading_passage_multi_qa',
      'json_strict',
    ];

    it('generates valid prompts for all 5 AI models and all 5 exam formats', () => {
      for (const modelTarget of models) {
        expect(EXTERNAL_MODEL_LABELS[modelTarget]).toBeTruthy();
        for (const formatType of formats) {
          expect(EXTERNAL_PROMPT_FORMAT_LABELS[formatType].title).toBeTruthy();
          const prompt = buildExternalAiPrompt({
            level: 2,
            formatType,
            modelTarget,
            questionCount: 20,
            topic: 'Du lịch Bắc Kinh',
            includePinyin: true,
          });
          expect(prompt).toContain('HSK 2');
          expect(prompt).toContain('Du lịch Bắc Kinh');
          expect(prompt).toContain('GIỚI HẠN TỪ VỰNG BẮT BUỘC');
        }
      }
    });

    it('enforces level-specific vocabulary ceilings and forbidden over-level words for HSK 1-6', () => {
      for (let level = 1; level <= 6; level++) {
        const prompt = buildExternalAiPrompt({
          level,
          formatType: 'multi_part_20q',
          modelTarget: 'deepseek',
          questionCount: 20,
        });
        expect(prompt).toContain(`HSK ${level}`);
        expect(prompt).toContain('第一部分');
        expect(prompt).toContain('第二部分');
        expect(prompt).toContain('第三部分');
        expect(prompt).toContain('第四部分');
        expect(prompt).toContain('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT');
      }
    });

    it('builds IELTS Listening Trap prompt with Male/Female speakers and self-correction rules', () => {
      const prompt = buildExternalAiPrompt({
        level: 3,
        formatType: 'ielts_listening_traps',
        modelTarget: 'claude',
        questionCount: 10,
      });
      expect(prompt).toContain('Nam (男)');
      expect(prompt).toContain('Nữ (女)');
      expect(prompt).toContain('Self-Correction');
    });
  });

  describe('M5: Custom Exam Sets & Instant CBT Conversion', () => {
    const mockStorage: Record<string, string> = {};
    const storageAdapter = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => {
        mockStorage[k] = v;
      },
    };

    beforeEach(() => {
      delete mockStorage[STORAGE_KEY_CUSTOM_EXAM_SETS];
    });

    it('converts True/False (2-opt), Standard (4-opt), and Shared Pool/Word Bank (5-opt) questions into CBT HSKExamQuestion format', () => {
      const tfQ = convertImportedToCbtQuestion(
        {
          stem: '苹果 (píngguǒ) — 桌子上有一本书。(Zhuōzi shang yǒu yì běn shū.)',
          options: ['Đúng (√)', 'Sai (×)'],
          answer_idx: 1,
          explanation_vi: 'Từ vựng là quả táo nhưng câu nói là quyển sách nên Sai.',
          level: 1,
          skill: 'reading',
          part_type: 'read_pic_TF',
        },
        0,
        1
      );
      expect(tfQ.options).toEqual(['✓ 对 (Đúng)', '✗ 错 (Sai)']);
      expect(tfQ.answer_index).toBe(1);
      expect(tfQ.stem).not.toContain('píngguǒ');
      expect(tfQ.pinyin_stem).toContain('píngguǒ');

      const fiveOptQ = convertImportedToCbtQuestion(
        {
          stem: '我非常 ______ 吃中国米饭。(Wǒ fēicháng ______ chī Zhōngguó mǐfàn.)',
          options: ['多少 (duōshao)', '听 (tīng)', '喜欢 (xǐhuan)', '里 (lǐ)', '怎么 (zěnme)'],
          answer_idx: 2,
          explanation_vi: 'Điền 喜欢 (thích).',
          level: 1,
          skill: 'reading',
          part_type: 'read_word_bank_5opt',
        },
        15,
        1
      );
      expect(fiveOptQ.options).toHaveLength(5);
      expect(fiveOptQ.options[2]).toBe('C. 喜欢');
      expect(fiveOptQ.options_pinyin?.[2]).toBe('xǐhuan');
      expect(fiveOptQ.answer_index).toBe(2);
    });

    it('parses the 20-question 4-part HSK paper and converts all 20 questions into a playable CustomExamSet', () => {
      const sample20Q = `第一部分: 第 1 - 5 题 (Phần 1: Câu 1 - 5)Quy tắc: Đọc từ vựng và câu tương ứng, xác định xem nội dung hai bên có đồng nhất ý nghĩa hay không. Điền đúng (√) hoặc sai (×).苹果 (píngguǒ)桌子上有一本书。(Zhuōzi shang yǒu yì běn shū.)→ [ ]喝水 (hē shuǐ)天气很热，我想喝水。(Tiānqì hěn rè, wǒ xiǎng hē shuǐ.)→ [ ]打电话 (dǎ diànhuà)他在睡觉，没打电话。(Tā zài shuìjiào, méi dǎ diànhuà.)→ [ ]看电影 (kàn diànyǐng)星期天我和朋友去电影院看电影。(Xīngqītiān wǒ hé péngyou qù diànyǐngyuàn kàn diànyǐng.)→ [ ]飞机 (fēijī)那是李老师的自行车。(Nà shì Lǐ lǎoshī de zìxíngchē.)→ [ ]第二部分: 第 6 - 10 题 (Phần 2: Câu 6 - 10)Quy tắc: Chọn một phương án phù hợp nhất từ A đến E để ghép với từng câu ngữ cảnh (mỗi phương án chỉ dùng một lần).Ký hiệuCâu lựa chọnA不客气。(Bú kèqi.)B她去医院看医生了。(Tā qù yīyuàn kàn yīshēng le.)C好的，明天见。(Hǎo de, míngtiān jiàn.)D没关系，请坐。(Méi guānxi, qǐng zuò.)E我在看书呢。(Wǒ zài kàn shū ne.)谢谢你的帮助！(Xièxie nǐ de bāngzhù!)→ [ ]对不起，我来晚了。(Duìbuqǐ, wǒ lái wǎn le.)→ [ ]你妈妈不在家吗？(Nǐ māma bú zài jiā ma?)→ [ ]你在做什么呢？(Nǐ zài zuò shénme ne?)→ [ ]明天上午八点见。(Míngtiān shàngwǔ bā diǎn jiàn.)→ [ ]第三部分: 第 11 - 15 题 (Phần 3: Câu 11 - 15)Quy tắc: Chọn chữ cái từ A đến E tương ứng với câu trả lời đúng cho từng câu hỏi.Ký hiệuCâu phản hồiA我是坐出租车去的。(Wǒ shì zuò chūzūchē qù de.)B他今年二十五岁。(Tā jīnnián èrshíwǔ suì.)C今天冷，明天不冷。(Jīntiān lěng, míngtiān bù lěng.)D我会写一点儿。(Wǒ huì xiě yìdiǎnr.)E里面有三个苹果。(Lǐmian yǒu sān ge píngguǒ.)你认识那个汉字吗？你会写吗？(Nǐ rènshi nà ge hànzì ma? Nǐ huì xiě ma?)→ [ ]你哥哥多大了？(Nǐ gēge duō dà le?)→ [ ]你怎么去火车站的？(Nǐ zěnme qù huǒchēzhàn de?)→ [ ]书包里面有什么？(Shūbāo lǐmian yǒu shénme?)→ [ ]北京今天天气冷不冷？(Běijīng jīntiān tiānqì lěng bù lěng?)→ [ ]第四部分: 第 16 - 20 题 (Phần 4: Câu 16 - 20)Quy tắc: Chọn từ thích hợp trong bảng để điền vào chỗ trống trong mỗi câu.ABCDE多少 (duōshao)听 (tīng)喜欢 (xǐhuan)里 (lǐ)怎么 (zěnme)我非常 ______ 吃中国米饭。(Wǒ fēicháng ______ chī Zhōngguó mǐfàn.)→ [ ]请问，这个大苹果 ______ 钱一个？(Qǐngwèn, zhè ge dà píngguǒ ______ qián yí ge?)→ [ ]他在房间 ______ 睡觉。(Tā zài fángjiān ______ shuìjiào.)→ [ ]你想 ______ 音乐还是看电视？(Nǐ xiǎng ______ yīnyuè háishi kàn diànshì?)→ [ ]医院在哪儿？请问我 ______ 走？(Yīyuàn zài nǎr? Qǐngwèn wǒ ______ zǒu?)→ [ ]ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT`;

      const parsed = parseUniversalQuestions(sample20Q, { default_level: 1 });
      expect(parsed).toHaveLength(20);

      const examSet = createCustomExamSet({
        title: 'Đề HSK 1 Đa Nguồn 20 Câu',
        level: 1,
        sourceLabel: 'DeepSeek AI',
        rawQuestions: parsed,
      });

      expect(examSet.questions).toHaveLength(20);
      // Part 1: 2 options
      for (let i = 0; i < 5; i++) {
        expect(examSet.questions[i].options).toHaveLength(2);
      }
      // Part 2, 3, 4: 5 options
      for (let i = 5; i < 20; i++) {
        expect(examSet.questions[i].options).toHaveLength(5);
      }

      // Save, load, and delete from storage
      const afterSave = saveCustomExamSetToStorage(examSet, storageAdapter);
      expect(afterSave).toHaveLength(1);
      expect(loadCustomExamSets(storageAdapter)[0].title).toBe('Đề HSK 1 Đa Nguồn 20 Câu');

      const afterDelete = deleteCustomExamSetFromStorage(examSet.id, storageAdapter);
      expect(afterDelete).toHaveLength(0);
    });
  });
});
