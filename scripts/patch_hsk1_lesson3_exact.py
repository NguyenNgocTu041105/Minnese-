# -*- coding: utf-8 -*-
import sys

def patch():
    path = 'src/data/newHsk1BookData.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    lesson3_code = '''  // LESSON 3
  {
    lessonNumber: 3,
    titleHanzi: "我是中国人",
    titlePinyin: "Wǒ shì Zhōngguó rén",
    titleVietnamese: "Tôi là người Trung Quốc",
    pageStart: 10,
    objectives: [
      "能听懂并使用“是”字句表达等同或类属。(Biết nghe hiểu và sử dụng câu chữ '是' để biểu đạt quan hệ bằng nhau hoặc thuộc chủng loại).",
      "掌握结构助词“的”的用法。(Nắm vững cách dùng trợ từ kết cấu '的' biểu thị quan hệ sở hữu).",
      "掌握用“吗”的是非问句的用法。(Nắm vững câu hỏi đúng - sai dùng trợ từ ngữ khí '吗')."
    ],
    texts: [
      {
        id: "hsk1-l3-t1",
        title: "课文 1: 在校园里 (Bài khóa 1: Trên sân trường)",
        context: "在校园里，李文和白家月第一次相遇，两人继续聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau, hai người tiếp tục trò chuyện).",
        lines: [
          { speaker: "李文", hanzi: "我是中国人。", pinyin: "Wǒ shì Zhōngguó rén.", vietnamese: "Tôi là người Trung Quốc." },
          { speaker: "白家月", hanzi: "我是法国人。我的中文老师也是中国人。", pinyin: "Wǒ shì Fǎguó rén. Wǒ de Zhōngwén lǎoshī yě shì Zhōngguó rén.", vietnamese: "Tôi là người Pháp. Giáo viên tiếng Trung của tôi cũng là người Trung Quốc." }
        ]
      },
      {
        id: "hsk1-l3-t2",
        title: "课文 2: 在教室里 (Bài khóa 2: Trong lớp học)",
        context: "在教室里，下课后，安妮在看陈天中手机里的照片。(Trong lớp học, sau giờ học, Annie xem ảnh trên điện thoại của Trần Thiên Trung).",
        lines: [
          { speaker: "安妮", hanzi: "这是谁？", pinyin: "Zhè shì shéi?", vietnamese: "Đây là ai?" },
          { speaker: "陈天中", hanzi: "这是我女朋友。", pinyin: "Zhè shì wǒ nǚpéngyou.", vietnamese: "Đây là bạn gái của tôi." },
          { speaker: "安妮", hanzi: "你女朋友是哪国人？", pinyin: "Nǐ nǚpéngyou shì nǎ guó rén?", vietnamese: "Bạn gái của bạn là người nước nào?" },
          { speaker: "陈天中", hanzi: "她也是泰国人。", pinyin: "Tā yě shì Tàiguó rén.", vietnamese: "Cô ấy cũng là người Thái Lan." }
        ]
      },
      {
        id: "hsk1-l3-t3",
        title: "课文 3: 在家里 (Bài khóa 3: Ở nhà)",
        context: "在家里，王一雪给王一飞打视频电话。(Ở nhà, Vương Nhất Tuyết gọi điện thoại video cho cô giáo Vương Nhất Phi).",
        lines: [
          { speaker: "王一雪", hanzi: "喂，一飞！", pinyin: "Wèi, Yīfēi!", vietnamese: "A lô, Nhất Phi à!" },
          { speaker: "王一飞", hanzi: "姐姐！", pinyin: "Jiějie!", vietnamese: "Chị gái!" },
          { speaker: "王一雪", hanzi: "你工作还忙吗？", pinyin: "Nǐ gōngzuò hái máng ma?", vietnamese: "Công việc của em còn bận không?" },
          { speaker: "王一飞", hanzi: "对，还很忙。你也很忙吗？", pinyin: "Duì, hái hěn máng. Nǐ yě hěn máng ma?", vietnamese: "Vâng, vẫn bận lắm ạ. Chị cũng bận lắm ạ?" },
          { speaker: "王一雪", hanzi: "我不太忙。我们很想你。", pinyin: "Wǒ bú tài máng. Wǒmen hěn xiǎng nǐ.", vietnamese: "Chị không bận lắm. Cả nhà nhớ em lắm đấy." },
          { speaker: "王一飞", hanzi: "我也很想你们。", pinyin: "Wǒ yě hěn xiǎng nǐmen.", vietnamese: "Em cũng rất nhớ mọi người ạ." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l3-g1",
        title: "1. “是”字句 (Cấu trúc câu chữ '是')",
        explanation: "Biểu thị người hoặc sự vật đồng nhất với cái gì hoặc thuộc về chủng loại gì. Dạng khẳng định: A 是 B (Ví dụ: 我是法国人 / 她是中文老师). Dạng phủ định: A 不是 B (Ví dụ: 我老师不是法国人).",
        examples: [
          { hanzi: "我是法国人。", pinyin: "Wǒ shì Fǎguó rén.", vietnamese: "Tôi là người Pháp." },
          { hanzi: "她是中文老师。", pinyin: "Tā shì Zhōngwén lǎoshī.", vietnamese: "Cô ấy là giáo viên tiếng Trung." },
          { hanzi: "我老师不是法国人。", pinyin: "Wǒ lǎoshī bú shì Fǎguó rén.", vietnamese: "Thầy giáo của tôi không phải là người Pháp." }
        ]
      },
      {
        id: "hsk1-l3-g2",
        title: "2. 结构助词“的” (Trợ từ kết cấu '的')",
        explanation: "Đặt giữa định ngữ và trung tâm ngữ biểu thị quan hệ sở hữu. Cấu trúc: Định ngữ + 的 + Trung tâm ngữ. Lưu ý: Khi định ngữ là đại từ nhân xưng và trung tâm ngữ chỉ quan hệ thân tộc hoặc người thân thiết, chữ '的' thường có thể lược bỏ (ví dụ: 我老师, 我妈妈, 我女朋友).",
        examples: [
          { hanzi: "白家月的中文老师", pinyin: "Bái Jiāyuè de Zhōngwén lǎoshī.", vietnamese: "Giáo viên tiếng Trung của Bạch Gia Nguyệt." },
          { hanzi: "这是我女朋友。", pinyin: "Zhè shì wǒ nǚpéngyou.", vietnamese: "Đây là bạn gái của tôi (lược bỏ '的')." },
          { hanzi: "我妈妈也是中国人。", pinyin: "Wǒ māma yě shì Zhōngguó rén.", vietnamese: "Mẹ tôi cũng là người Trung Quốc (lược bỏ '的')." }
        ]
      },
      {
        id: "hsk1-l3-g3",
        title: "3. 用“吗”的是非问句 (Câu hỏi đúng - sai dùng '吗')",
        explanation: "Trợ từ ngữ khí '吗' đặt ở cuối câu trần thuật để biến câu đó thành câu nghi vấn đúng-sai. Trả lời khẳng định thường dùng động từ/tính từ chính hoặc '对' / '是', phủ định dùng '不'.",
        examples: [
          { hanzi: "你工作还忙吗？", pinyin: "Nǐ gōngzuò hái máng ma?", vietnamese: "Công việc của bạn còn bận không?" },
          { hanzi: "你也很忙吗？", pinyin: "Nǐ yě hěn máng ma?", vietnamese: "Bạn cũng rất bận à?" },
          { hanzi: "他是中国人吗？", pinyin: "Tā shì Zhōngguó rén ma?", vietnamese: "Anh ấy là người Trung Quốc phải không?" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l3-w1", hanzi: "人", pinyin: "rén", hanViet: "nhân", vietnamese: "người", hskLevel: 1, radical: "人", strokeCount: 2, example: "中国人", exampleTranslation: "người Trung Quốc", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w2", hanzi: "的", pinyin: "de", hanViet: "đích", vietnamese: "của (trợ từ sở hữu)", hskLevel: 1, radical: "白", strokeCount: 8, example: "我的老师", exampleTranslation: "thầy giáo của tôi", tags: ["Bài 3", "Trợ từ"] },
      { id: "hsk1-l3-w3", hanzi: "这", pinyin: "zhè", hanViet: "giá", vietnamese: "đây, này", hskLevel: 1, radical: "辶", strokeCount: 7, example: "这是谁？", exampleTranslation: "Đây là ai?", tags: ["Bài 3", "Đại từ chỉ thị"] },
      { id: "hsk1-l3-w4", hanzi: "谁", pinyin: "shéi / shuí", hanViet: "thùy", vietnamese: "ai", hskLevel: 1, radical: "讠", strokeCount: 10, example: "他是谁？", exampleTranslation: "Anh ấy là ai?", tags: ["Bài 3", "Đại từ nghi vấn"] },
      { id: "hsk1-l3-w5", hanzi: "女朋友", pinyin: "nǚpéngyou", hanViet: "nữ bằng hữu", vietnamese: "bạn gái", hskLevel: 1, radical: "女", strokeCount: 15, example: "我女朋友", exampleTranslation: "bạn gái tôi", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w6", hanzi: "哪", pinyin: "nǎ", hanViet: "na", vietnamese: "nào", hskLevel: 1, radical: "口", strokeCount: 9, example: "哪国人？", exampleTranslation: "người nước nào?", tags: ["Bài 3", "Đại từ nghi vấn"] },
      { id: "hsk1-l3-w7", hanzi: "国", pinyin: "guó", hanViet: "quốc", vietnamese: "nước, quốc gia", hskLevel: 1, radical: "囗", strokeCount: 8, example: "中国", exampleTranslation: "Trung Quốc", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w8", hanzi: "她", pinyin: "tā", hanViet: "tha", vietnamese: "cô ấy, bà ấy", hskLevel: 1, radical: "女", strokeCount: 6, example: "她也是泰国人。", exampleTranslation: "Cô ấy cũng là người Thái Lan.", tags: ["Bài 3", "Đại từ"] },
      { id: "hsk1-l3-w9", hanzi: "喂", pinyin: "wèi", hanViet: "ủy", vietnamese: "a lô, này", hskLevel: 1, radical: "口", strokeCount: 12, example: "喂，一飞！", exampleTranslation: "A lô, Nhất Phi à!", tags: ["Bài 3", "Thán từ"] },
      { id: "hsk1-l3-w10", hanzi: "姐姐", pinyin: "jiějie", hanViet: "tỷ tỷ", vietnamese: "chị gái", hskLevel: 1, radical: "女", strokeCount: 8, example: "我姐姐", exampleTranslation: "chị gái tôi", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w11", hanzi: "工作", pinyin: "gōngzuò", hanViet: "công tác", vietnamese: "công việc, làm việc", hskLevel: 1, radical: "亻", strokeCount: 7, example: "你工作忙吗？", exampleTranslation: "Công việc của bạn có bận không?", tags: ["Bài 3", "Danh từ", "Động từ"] },
      { id: "hsk1-l3-w12", hanzi: "还", pinyin: "hái", hanViet: "hoàn", vietnamese: "vẫn, còn", hskLevel: 1, radical: "辶", strokeCount: 7, example: "还很忙", exampleTranslation: "vẫn rất bận", tags: ["Bài 3", "Phó từ"] },
      { id: "hsk1-l3-w13", hanzi: "忙", pinyin: "máng", hanViet: "mang", vietnamese: "bận", hskLevel: 1, radical: "忄", strokeCount: 6, example: "很忙", exampleTranslation: "rất bận", tags: ["Bài 3", "Tính từ"] },
      { id: "hsk1-l3-w14", hanzi: "吗", pinyin: "ma", hanViet: "ma", vietnamese: "không, hả (hỏi)", hskLevel: 1, radical: "口", strokeCount: 6, example: "忙吗？", exampleTranslation: "Bận không?", tags: ["Bài 3", "Trợ từ"] },
      { id: "hsk1-l3-w15", hanzi: "对", pinyin: "duì", hanViet: "đối", vietnamese: "đúng, vâng", hskLevel: 1, radical: "寸", strokeCount: 5, example: "对，还很忙。", exampleTranslation: "Đúng, vẫn bận lắm.", tags: ["Bài 3", "Tính từ"] },
      { id: "hsk1-l3-w16", hanzi: "太", pinyin: "tài", hanViet: "thái", vietnamese: "quá, lắm", hskLevel: 1, radical: "大", strokeCount: 4, example: "不太忙", exampleTranslation: "không bận lắm", tags: ["Bài 3", "Phó từ"] },
      { id: "hsk1-l3-w17", hanzi: "我们", pinyin: "wǒmen", hanViet: "ngã môn", vietnamese: "chúng tôi, chúng ta", hskLevel: 1, radical: "亻", strokeCount: 12, example: "我们很想你。", exampleTranslation: "Chúng tôi rất nhớ bạn.", tags: ["Bài 3", "Đại từ"] },
      { id: "hsk1-l3-w18", hanzi: "想", pinyin: "xiǎng", hanViet: "tưởng", vietnamese: "nhớ, muốn, nghĩ", hskLevel: 1, radical: "心", strokeCount: 13, example: "很想你", exampleTranslation: "rất nhớ bạn", tags: ["Bài 3", "Động từ"] },
      { id: "hsk1-l3-w19", hanzi: "中国", pinyin: "Zhōngguó", hanViet: "Trung Quốc", vietnamese: "Trung Quốc", hskLevel: 1, radical: "囗", strokeCount: 12, example: "中国人", exampleTranslation: "người Trung Quốc", tags: ["Bài 3", "Địa danh"] },
      { id: "hsk1-l3-w20", hanzi: "法国", pinyin: "Fǎguó", hanViet: "Pháp Quốc", vietnamese: "Nước Pháp", hskLevel: 1, radical: "氵", strokeCount: 16, example: "法国人", exampleTranslation: "người Pháp", tags: ["Bài 3", "Địa danh"] },
      { id: "hsk1-l3-w21", hanzi: "中文", pinyin: "Zhōngwén", hanViet: "Trung Văn", vietnamese: "Tiếng Trung", hskLevel: 1, radical: "文", strokeCount: 8, example: "中文老师", exampleTranslation: "giáo viên tiếng Trung", tags: ["Bài 3", "Ngôn ngữ"] },
      { id: "hsk1-l3-w22", hanzi: "泰国", pinyin: "Tàiguó", hanViet: "Thái Quốc", vietnamese: "Thái Lan", hskLevel: 1, radical: "艹", strokeCount: 17, example: "泰国人", exampleTranslation: "người Thái Lan", tags: ["Bài 3", "Địa danh"] }
    ],
    exercises: [
      {
        id: "hsk1-l3-ex1",
        type: "fill_blank",
        question: "Điền phó từ thích hợp vào chỗ trống: '我是法国人。我的中文老师 ______ 是中国人。'",
        hanziPrompt: "我是法国人。我的中文老师 ______ 是中国人。",
        pinyinPrompt: "Wǒ shì Fǎguó rén. Wǒ de Zhōngwén lǎoshī ______ shì Zhōngguó rén.",
        vietnamesePrompt: "Tôi là người Pháp. Giáo viên tiếng Trung của tôi ______ là người Trung Quốc.",
        options: ["A. 也", "B. 都", "C. 吗", "D. 不"],
        correctAnswer: "A. 也",
        explanation: "Phó từ '也' (cũng) biểu thị sự tương đồng, đứng trước động từ '是'.",
        grammarFocus: "Phó từ biểu thị tương đồng 也",
        audioText: "我是法国人。我的中文老师也是中国人。"
      },
      {
        id: "hsk1-l3-ex2",
        type: "dialogue_match",
        question: "Chọn câu trả lời thích hợp cho câu hỏi: '这是谁？'",
        hanziPrompt: "A: 这是谁？ — B: ______",
        pinyinPrompt: "A: Zhè shì shéi? — B: ______",
        vietnamesePrompt: "A: Đây là ai? — B: Đây là bạn gái của tôi.",
        options: [
          "这是我女朋友。",
          "她也是泰国人。",
          "我是中国人。",
          "我不太忙。"
        ],
        correctAnswer: "这是我女朋友。",
        explanation: "Câu hỏi đại từ chỉ người '这是谁？' (Đây là ai?) trả lời bằng câu giới thiệu người: '这是我女朋友。'",
        grammarFocus: "Đại từ nghi vấn 谁",
        audioText: "这是我女朋友。"
      },
      {
        id: "hsk1-l3-ex3",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu hỏi quốc tịch hoàn chỉnh:",
        hanziPrompt: "[ 你女朋友 / 哪国人 / 是 / ？ ]",
        vietnamesePrompt: "Bạn gái bạn là người nước nào?",
        scrambleSegments: ["你女朋友", "是", "哪国人", "？"],
        options: [
          "你女朋友是哪国人？",
          "哪国人是你女朋友？",
          "你女朋友哪国人是？",
          "是哪国人你女朋友？"
        ],
        correctAnswer: "你女朋友是哪国人？",
        explanation: "Trật tự câu hỏi chữ 是: Chủ ngữ (你女朋友) + 是 + Đại từ nghi vấn quốc tịch (哪国人) + ？",
        grammarFocus: "Câu hỏi quốc tịch với 哪国人",
        audioText: "你女朋友是哪国人？"
      },
      {
        id: "hsk1-l3-ex4",
        type: "translation",
        question: "Dịch sang tiếng Trung: 'Chúng tôi rất nhớ bạn.'",
        vietnamesePrompt: "Chúng tôi rất nhớ bạn.",
        options: [
          "我们很想你。",
          "我很想你们。",
          "我们不太忙。",
          "我也很忙。"
        ],
        correctAnswer: "我们很想你。",
        explanation: "Chủ ngữ số nhiều '我们' (chúng tôi) + phó từ '很' + động từ '想' (nhớ) + tân ngữ '你' (bạn).",
        grammarFocus: "Cấu trúc Chủ ngữ + 很 + Động từ tâm lý + Tân ngữ",
        audioText: "我们很想你。"
      }
    ]
  },'''

    l3_start = content.find('  // LESSON 3')
    l4_start = content.find('  // LESSON 4')

    if l3_start != -1 and l4_start != -1:
        new_content = content[:l3_start] + lesson3_code.strip() + '\n\n' + content[l4_start:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Updated Lesson 3 in newHsk1BookData.ts successfully!")
    else:
        print("Could not find Lesson 3 or Lesson 4 markers!")

if __name__ == '__main__':
    patch()
