import { describe, it, expect } from 'vitest';
import {
  buildGoldenPrompt,
  GOLDEN_PROMPT_FORMATS,
  HSK_LEVEL_META,
  QUICK_TOPIC_SUGGESTIONS,
  type GoldenPromptFormatKey,
} from '../src/components/Admin/GoldenPromptLibraryModal';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser';

describe('Milestone 3 (R3): Golden Standard Prompt Library & Universal Ingestion Guarantee', () => {
  describe('1. Catalog & Metadata Integrity', () => {
    it('defines exactly 6 standardized prompt formats across HSK 1-6', () => {
      expect(GOLDEN_PROMPT_FORMATS).toHaveLength(6);
      const keys = GOLDEN_PROMPT_FORMATS.map((f) => f.key);
      expect(keys).toEqual([
        'reading_mcq',
        'listening_dialogue',
        'dialogue_matching',
        'fill_in_blank',
        'true_false',
        'json_strict',
      ]);
    });

    it('has complete metadata for each format with icons, descriptions, and level coverage', () => {
      for (const fmt of GOLDEN_PROMPT_FORMATS) {
        expect(fmt.label).toBeTruthy();
        expect(fmt.shortLabel).toBeTruthy();
        expect(fmt.description).toBeTruthy();
        expect(fmt.icon).toBeTruthy();
        expect(fmt.supportedLevels).toEqual([1, 2, 3, 4, 5, 6]);
      }
    });

    it('provides rich HSK Level definitions for HSK 1 through 6', () => {
      for (let level = 1; level <= 6; level++) {
        const meta = HSK_LEVEL_META[level];
        expect(meta).toBeDefined();
        expect(meta.label).toBe(`HSK ${level}`);
        expect(meta.vocabTarget).toBeTruthy();
        expect(meta.grammarFocus).toBeTruthy();
      }
    });

    it('supplies quick topic suggestions for teacher convenience', () => {
      expect(QUICK_TOPIC_SUGGESTIONS.length).toBeGreaterThanOrEqual(5);
      expect(QUICK_TOPIC_SUGGESTIONS).toContain('Trường học & Thi cử HSK');
    });
  });

  describe('2. Prompt Matrix Generation: 6 Formats x HSK 1-6 (36 combinations)', () => {
    const formats: GoldenPromptFormatKey[] = [
      'reading_mcq',
      'listening_dialogue',
      'dialogue_matching',
      'fill_in_blank',
      'true_false',
      'json_strict',
    ];

    it('generates valid non-empty structured prompts for all 36 combinations', () => {
      for (const format of formats) {
        for (let level = 1; level <= 6; level++) {
          const prompt = buildGoldenPrompt({
            level,
            format,
            questionCount: 5,
            topic: 'Gia đình và bạn bè',
            includePinyin: level <= 3,
          });

          expect(prompt).toBeTruthy();
          expect(typeof prompt).toBe('string');
          expect(prompt.length).toBeGreaterThan(150);
          expect(prompt).toContain(`HSK ${level}`);

          if (format === 'json_strict') {
            expect(prompt).toContain('```json');
            expect(prompt).toContain('"answer_idx"');
            expect(prompt).toContain('"explanation_vi"');
          } else {
            // All human-readable formats MUST guarantee the canonical footer
            expect(prompt).toContain('ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:');
            expect(prompt).toContain('Câu 1:');
          }
        }
      }
    });
  });

  describe('3. Parameter Customization & Placeholder Replacement', () => {
    it('replaces questionCount correctly', () => {
      for (const count of [3, 5, 10, 15, 20]) {
        const prompt = buildGoldenPrompt({
          level: 3,
          format: 'reading_mcq',
          questionCount: count,
        });
        expect(prompt).toContain(`biên soạn ${count} câu hỏi`);
      }
    });

    it('replaces custom topic correctly', () => {
      const customTopic = 'Ẩm thực Tứ Xuyên và Văn hóa Trà đạo';
      const prompt = buildGoldenPrompt({
        level: 4,
        format: 'reading_mcq',
        questionCount: 5,
        topic: customTopic,
      });
      expect(prompt).toContain(customTopic);
    });

    it('falls back to default topic when topic is blank or undefined', () => {
      const prompt = buildGoldenPrompt({
        level: 2,
        format: 'reading_mcq',
        questionCount: 5,
        topic: '   ',
      });
      expect(prompt).toContain('Đời sống hàng ngày, gia đình, bạn bè, học tập, du lịch, công việc');
    });

    it('respects includePinyin toggle', () => {
      const withPinyin = buildGoldenPrompt({
        level: 1,
        format: 'fill_in_blank',
        includePinyin: true,
      });
      expect(withPinyin).toContain('BẮT BUỘC có phiên âm Pinyin');
      expect(withPinyin).toContain('([Phiên âm Pinyin có thanh điệu])');

      const withoutPinyin = buildGoldenPrompt({
        level: 5,
        format: 'fill_in_blank',
        includePinyin: false,
      });
      expect(withoutPinyin).toContain('KHÔNG cần viết phiên âm Pinyin');
      expect(withoutPinyin).not.toContain('([Phiên âm Pinyin có thanh điệu])');
    });

    it('handles format alias normalization safely', () => {
      const promptListening = buildGoldenPrompt({
        level: 2,
        format: 'listening',
      });
      expect(promptListening).toContain('Nghe hiểu');
      expect(promptListening).toContain('男：');
      expect(promptListening).toContain('女：');

      const promptMatching = buildGoldenPrompt({
        level: 1,
        format: 'dialogue_match',
      });
      expect(promptMatching).toContain('ghép nối hội thoại');

      const promptBlank = buildGoldenPrompt({
        level: 2,
        format: 'blank',
      });
      expect(promptBlank).toContain('____');

      const promptTF = buildGoldenPrompt({
        level: 3,
        format: 'tf',
      });
      expect(promptTF).toContain('Đúng / Sai');
      expect(promptTF).toContain('A. 对');
      expect(promptTF).toContain('B. 错');
    });
  });

  describe('4. Universal Parser Verification: 100% Ingestion Guarantee Across All Formats', () => {
    it('simulates and parses Format 1 (Reading MCQ) with 100% clean accuracy', () => {
      const aiResponse = `Dưới đây là các câu hỏi trắc nghiệm Đọc hiểu HSK 1:

Câu 1: 我每天早上七点起床，然后去学校。他每天几点起床？(Wǒ měitiān zǎoshang qī diǎn qǐchuáng, ránhòu qù xuéxiào. Tā měitiān jǐ diǎn qǐchuáng?)
A. 六点
B. 七点
C. 八点
D. 九点

Câu 2: 昨天北京的天气很好，不冷也不热。昨天北京天气怎么样？(Zuótiān Běijīng de tiānqì hěn hǎo, bù lěng yě bú rè. Zuótiān Běijīng tiānqì zěnmeyàng?)
A. 很冷
B. 很热
C. 很好
D. 不太好

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: B. Giải thích: Dịch nghĩa: Tôi thức dậy lúc 7 giờ mỗi sáng rồi đi học. Câu hỏi hỏi anh ấy thức dậy mấy giờ, phương án B (七点 - 7 giờ) là chính xác.
Câu 2: C. Giải thích: Dịch nghĩa: Hôm qua thời tiết Bắc Kinh rất tốt, không lạnh cũng không nóng. Đáp án đúng là C (很好).`;

      const questions = parseUniversalQuestions(aiResponse, { default_level: 1 });
      expect(questions).toHaveLength(2);

      // Question 1
      expect(questions[0].stem).toContain('七点起床');
      expect(questions[0].options).toHaveLength(4);
      expect(questions[0].options[0]).toBe('六点');
      expect(questions[0].options[1]).toBe('七点');
      expect(questions[0].answer_idx).toBe(1); // B
      expect(questions[0].explanation_vi).toContain('Dịch nghĩa: Tôi thức dậy lúc 7 giờ');
      expect(questions[0].skill).toBe('reading');

      // Question 2
      expect(questions[1].stem).toContain('北京的天气很好');
      expect(questions[1].options).toHaveLength(4);
      expect(questions[1].answer_idx).toBe(2); // C
      expect(questions[1].explanation_vi).toContain('Hôm qua thời tiết Bắc Kinh rất tốt');
      expect(questions[1].skill).toBe('reading');
    });

    it('simulates and parses Format 2 (Listening Dialogue with speaker turns) & auto-infers listening skill', () => {
      const aiResponse = `Dưới đây là các câu hỏi Nghe hiểu hội thoại HSK 2:

Câu 1:
男：请问，图书馆几点关门？(Qǐngwèn, túshūguǎn jǐ diǎn guānmén?)
女：下午五点半。(Xiàwǔ wǔ diǎn bàn.)
问：图书馆什么时候关门？
A. 五点
B. 五点半
C. 六点
D. 六点半

Câu 2:
男：你想喝茶还是喝咖啡？(Nǐ xiǎng hē chá háishì hē kāfēi?)
女：给我一杯热茶吧，谢谢。(Gěi wǒ yì bēi rè chá ba, xièxie.)
问：女的想喝什么？
A. 牛奶
B. 咖啡
C. 水
D. 茶

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: B. Giải thích: Nam hỏi mấy giờ thư viện đóng cửa, Nữ trả lời 5 giờ rưỡi chiều. Đáp án B là chính xác.
Câu 2: D. Giải thích: Nữ chọn uống một cốc trà nóng, do đó đáp án đúng là D.`;

      const questions = parseUniversalQuestions(aiResponse, { default_level: 2 });
      expect(questions).toHaveLength(2);

      // Question 1
      expect(questions[0].stem).toMatch(/男[:：]/);
      expect(questions[0].stem).toMatch(/女[:：]/);
      expect(questions[0].stem).toMatch(/问[:：]/);
      expect(questions[0].options).toHaveLength(4);
      expect(questions[0].answer_idx).toBe(1); // B
      expect(questions[0].skill).toBe('listening'); // Auto-inferred!
      expect(questions[0].explanation_vi).toContain('5 giờ rưỡi chiều');

      // Question 2
      expect(questions[1].stem).toContain('你想喝茶还是喝咖啡');
      expect(questions[1].options).toHaveLength(4);
      expect(questions[1].answer_idx).toBe(3); // D
      expect(questions[1].skill).toBe('listening');
    });

    it('simulates and parses Format 3 (Dialogue Matching 5-opt) into individual questions with shared options', () => {
      const aiResponse = `第二部分: 第 1 - 5 题 (Phần 2: Câu 1 - 5)
Quy tắc: Chọn một phương án phù hợp nhất từ A đến E để ghép với từng câu ngữ cảnh (mỗi phương án chỉ dùng một lần).
Ký hiệu Câu lựa chọn
A 不客气。(Bú kèqi.)
B 她去医院看医生了。(Tā qù yīyuàn kàn yīshēng le.)
C 好的，明天见。(Hǎo de, míngtiān jiàn.)
D 没关系，请坐。(Méi guānxi, qǐng zuò.)
E 我在看书呢。(Wǒ zài kàn shū ne.)

谢谢你的帮助！(Xièxie nǐ de bāngzhù!) → [ ]
对不起，我来晚了。(Duìbuqǐ, wǒ lái wǎn le.) → [ ]
你妈妈不在家吗？(Nǐ māma bú zài jiā ma?) → [ ]
你在做什么呢？(Nǐ zài zuò shénme ne?) → [ ]
明天上午八点见。(Míngtiān shàngwǔ bā diǎn jiàn.) → [ ]

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: A. Giải thích: Đáp lại lời cảm ơn bằng "Không có gì".
Câu 2: D. Giải thích: Đáp lại lời xin lỗi đến muộn bằng "Không sao, mời ngồi".
Câu 3: B. Giải thích: Trả lời về mẹ bằng "Bà ấy đi viện khám bác sĩ rồi".
Câu 4: E. Giải thích: Trả lời đang làm gì bằng "Tôi đang đọc sách này".
Câu 5: C. Giải thích: Đáp lại hẹn ngày mai bằng "Được, ngày mai gặp".`;

      const questions = parseUniversalQuestions(aiResponse, { default_level: 1 });
      expect(questions).toHaveLength(5);

      // Question 1: A (idx 0)
      expect(questions[0].stem).toContain('谢谢你的帮助');
      expect(questions[0].options).toHaveLength(5);
      expect(questions[0].answer_idx).toBe(0); // A
      expect(questions[0].explanation_vi).toContain('Không có gì');

      // Question 2: D (idx 3)
      expect(questions[1].stem).toContain('我来晚了');
      expect(questions[1].options).toHaveLength(5);
      expect(questions[1].answer_idx).toBe(3); // D

      // Question 3: B (idx 1)
      expect(questions[2].stem).toContain('你妈妈不在家吗');
      expect(questions[2].answer_idx).toBe(1); // B

      // Question 4: E (idx 4)
      expect(questions[3].answer_idx).toBe(4); // E

      // Question 5: C (idx 2)
      expect(questions[4].answer_idx).toBe(2); // C
    });

    it('simulates and parses Format 4 (Fill-in-the-Blank with ____ token)', () => {
      const aiResponse = `Câu 1: 我想买一____苹果。(Wǒ xiǎng mǎi yì ____ píngguǒ.)
A. 个
B. 斤
C. 杯
D. 张

Câu 2: 他每天晚上都____看书。(Tā měitiān wǎnshang dōu ____ kànshū.)
A. 喜欢
B. 常常
C. 已经
D. 一边

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: B. Giải thích: Mua táo tính theo đơn vị cân (斤 - jīn), đáp án B đúng ngữ cảnh mua sắm thực phẩm.
Câu 2: A. Giải thích: Thích đọc sách (喜欢看书), vị ngữ chỉ sở thích phù hợp nhất.`;

      const questions = parseUniversalQuestions(aiResponse, { default_level: 2 });
      expect(questions).toHaveLength(2);

      // Question 1
      expect(questions[0].stem).toContain('____');
      expect(questions[0].options).toHaveLength(4);
      expect(questions[0].options[1]).toBe('斤');
      expect(questions[0].answer_idx).toBe(1); // B
      expect(questions[0].explanation_vi).toContain('Mua táo tính theo đơn vị cân');

      // Question 2
      expect(questions[1].stem).toContain('____');
      expect(questions[1].options).toHaveLength(4);
      expect(questions[1].answer_idx).toBe(0); // A
      expect(questions[1].explanation_vi).toContain('Thích đọc sách');
    });

    it('simulates and parses Format 5 (True / False with 对 and 错)', () => {
      const aiResponse = `Câu 1: 北京是中国的首都。(Běijīng shì Zhōngguó de shǒudū.)
A. 对
B. 错

Câu 2: 喝茶对身体不好。(Hē chá duì shēntǐ bù hǎo.)
A. 对
B. 错

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: A. Giải thích: Bắc Kinh là thủ đô của Trung Quốc, khẳng định hoàn toàn đúng.
Câu 2: B. Giải thích: Uống trà có lợi cho sức khỏe, nhận định trên là sai.`;

      const questions = parseUniversalQuestions(aiResponse, { default_level: 1 });
      expect(questions).toHaveLength(2);

      // Question 1: True (A / 0)
      expect(questions[0].stem).toContain('北京是中国的首都');
      expect(questions[0].options).toHaveLength(2);
      expect(questions[0].options[0]).toBe('对');
      expect(questions[0].options[1]).toBe('错');
      expect(questions[0].answer_idx).toBe(0); // A
      expect(questions[0].explanation_vi).toContain('Bắc Kinh là thủ đô của Trung Quốc');

      // Question 2: False (B / 1)
      expect(questions[1].stem).toContain('喝茶对身体不好');
      expect(questions[1].options).toHaveLength(2);
      expect(questions[1].answer_idx).toBe(1); // B
      expect(questions[1].explanation_vi).toContain('nhận định trên là sai');
    });

    it('simulates and parses Format 6 (Strict JSON CandidateQuestion schema)', () => {
      const aiResponse = `Dưới đây là dữ liệu câu hỏi HSK 3:
\`\`\`json
[
  {
    "stem": "今天天气非常晴朗，我们去公园散步吧。(Jīntiān tiānqì fēicháng qínglǎng, wǒmen qù gōngyuán sànbù ba.)",
    "options": ["去公园", "去商店", "在家睡觉", "去工作"],
    "answer_idx": 0,
    "pinyin": "Jīntiān tiānqì fēicháng qínglǎng",
    "explanation_vi": "Câu rủ đi dạo công viên vì thời tiết đẹp, đáp án đúng là A.",
    "level": 3,
    "skill": "reading",
    "part_type": "read_mcq_4opt"
  },
  {
    "stem": "男：你什么时候去上海？\\n女：下个星期一。\\n问：女的哪天去上海？",
    "options": ["这个星期天", "下个星期一", "下个星期五", "下个月"],
    "answer_idx": 1,
    "pinyin": "Nǐ shénme shíhou qù Shànghǎi",
    "explanation_vi": "Nhân vật nữ trả lời thứ hai tuần sau (下个星期一), đáp án đúng là B.",
    "level": 3,
    "skill": "listening",
    "part_type": "listen_dialogue_qa_4opt"
  }
]
\`\`\``;

      const questions = parseUniversalQuestions(aiResponse);
      expect(questions).toHaveLength(2);

      // Question 1
      expect(questions[0].stem).toContain('今天天气非常晴朗');
      expect(questions[0].options).toHaveLength(4);
      expect(questions[0].answer_idx).toBe(0);
      expect(questions[0].level).toBe(3);
      expect(questions[0].skill).toBe('reading');

      // Question 2
      expect(questions[1].stem).toMatch(/男[:：]/);
      expect(questions[1].stem).toMatch(/女[:：]/);
      expect(questions[1].options).toHaveLength(4);
      expect(questions[1].answer_idx).toBe(1);
      expect(questions[1].level).toBe(3);
      expect(questions[1].skill).toBe('listening');
    });
  });

  describe('5. Robustness & Tolerance to Formatting Variations', () => {
    it('handles full-width Latin letters (Ａ, Ｂ, Ｃ, Ｄ) from Chinese IME keyboard input', () => {
      const aiResponse = `Câu 1: 他是我的汉语老师。
Ａ. 老师
Ｂ. 苹果
Ｃ. 飞机
Ｄ. 喝水

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: Ａ. Giải thích: 老师 có nghĩa là giáo viên.`;

      const questions = parseUniversalQuestions(aiResponse);
      expect(questions).toHaveLength(1);
      expect(questions[0].options).toHaveLength(4);
      expect(questions[0].options[0]).toBe('老师');
      expect(questions[0].answer_idx).toBe(0);
    });

    it('handles alternative answer key header labels seamlessly', () => {
      const headers = [
        'BẢNG ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:',
        'ANSWER KEY:',
        '参考答案:',
        'LỜI GIẢI CHI TIẾT:',
      ];

      for (const hdr of headers) {
        const text = `Câu 1: 苹果很好吃。
A. 苹果
B. 衣服
C. 飞机
D. 电脑

${hdr}
Câu 1: A. Giải thích: 苹果 nghĩa là quả táo.`;

        const parsed = parseUniversalQuestions(text);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].answer_idx).toBe(0);
        expect(parsed[0].explanation_vi).toContain('quả táo');
      }
    });

    it('guarantees that no literal unreplaced placeholders [CẤP ĐỘ], [SỐ LƯỢNG], [CHỦ ĐỀ] remain in any generated prompt', () => {
      const formats: GoldenPromptFormatKey[] = [
        'reading_mcq',
        'listening_dialogue',
        'dialogue_matching',
        'fill_in_blank',
        'true_false',
        'json_strict',
      ];

      for (const format of formats) {
        for (let level = 1; level <= 6; level++) {
          const prompt = buildGoldenPrompt({
            level,
            format,
            questionCount: 8,
            topic: 'Công nghệ thông tin và AI',
          });

          expect(prompt).not.toContain('[CẤP ĐỘ]');
          expect(prompt).not.toContain('[SỐ LƯỢNG]');
          expect(prompt).not.toContain('[CHỦ ĐỀ]');
        }
      }
    });

    it('safely clamps out-of-range levels and question counts', () => {
      const clampedLow = buildGoldenPrompt({
        level: -5,
        format: 'reading_mcq',
        questionCount: -10,
      });
      expect(clampedLow).toContain('HSK 1');
      expect(clampedLow).toContain('1 câu hỏi');

      const clampedHigh = buildGoldenPrompt({
        level: 99,
        format: 'reading_mcq',
        questionCount: 50,
      });
      expect(clampedHigh).toContain('HSK 6');
      expect(clampedHigh).toContain('50 câu hỏi');
    });
  });
});
