# -*- coding: utf-8 -*-

def patch():
    path = 'src/data/newHsk1BookData.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    lesson4_code = '''  // LESSON 4
  {
    lessonNumber: 4,
    titleHanzi: "我有两个孩子",
    titlePinyin: "Wǒ yǒu liǎng gè háizi",
    titleVietnamese: "Tôi có hai đứa con",
    pageStart: 18,
    objectives: [
      "能听懂并使用“有”字句（1）表达领有人或物品。(Biết nghe hiểu và sử dụng câu chữ '有' biểu đạt sở hữu người hoặc đồ vật).",
      "掌握“A……，B呢？”的用法。(Nắm vững cách dùng câu hỏi tỉnh lược 'A..., B呢?').",
      "掌握本课数词、量词的用法 (Nắm vững cách dùng số từ và lượng từ trong bài, đặc biệt là cách dùng '两' trước lượng từ).",
      "了解中国人如何问答年龄，能使用合适的词语进行年龄问答 (Biết cách hỏi tuổi: trẻ em dưới 10 tuổi dùng '几岁', trên 10 tuổi dùng '多大')."
    ],
    texts: [
      {
        id: "hsk1-l4-t1",
        title: "课文 1: 在家里 (Bài khóa 1: Ở nhà)",
        context: "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
        lines: [
          { speaker: "刘明", hanzi: "一飞忙吗？", pinyin: "Yīfēi máng ma?", vietnamese: "Nhất Phi có bận không?" },
          { speaker: "王一雪", hanzi: "她很忙。", pinyin: "Tā hěn máng.", vietnamese: "Em ấy rất bận." },
          { speaker: "刘明", hanzi: "她有多少个学生？", pinyin: "Tā yǒu duōshao gè xuésheng?", vietnamese: "Em ấy có bao nhiêu học sinh?" },
          { speaker: "王一雪", hanzi: "她有二十个学生。", pinyin: "Tā yǒu èrshí gè xuésheng.", vietnamese: "Em ấy có hai mươi học sinh." }
        ]
      },
      {
        id: "hsk1-l4-t2",
        title: "课文 2: 在公司里 (Bài khóa 2: Ở công ty)",
        context: "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Lạc nghỉ giải lao trò chuyện).",
        lines: [
          { speaker: "王一雪", hanzi: "我有两个哥哥，你呢？", pinyin: "Wǒ yǒu liǎng gè gēge, nǐ ne?", vietnamese: "Chị có hai người anh trai, còn em thì sao?" },
          { speaker: "杨同乐", hanzi: "我没有哥哥。", pinyin: "Wǒ méiyǒu gēge.", vietnamese: "Em không có anh trai." },
          { speaker: "王一雪", hanzi: "你家有几口人？", pinyin: "Nǐ jiā yǒu jǐ kǒu rén?", vietnamese: "Nhà em có mấy người?" },
          { speaker: "杨同乐", hanzi: "我家有四口人，爸爸、妈妈、妹妹和我。", pinyin: "Wǒ jiā yǒu sì kǒu rén, bàba, māma, mèimei hé wǒ.", vietnamese: "Nhà em có bốn người: bố, mẹ, em gái và em." }
        ]
      },
      {
        id: "hsk1-l4-t3",
        title: "课文 3: 在街上 (Bài khóa 3: Trên đường phố)",
        context: "在街上，王一雪带着儿子偶遇杨同乐。(Trên đường, Vương Nhất Tuyết dắt con trai tình cờ gặp Dương Đồng Lạc).",
        lines: [
          { speaker: "杨同乐", hanzi: "这是您儿子吗？", pinyin: "Zhè shì nín érzi ma?", vietnamese: "Đây là con trai chị phải không ạ?" },
          { speaker: "王一雪", hanzi: "是的。我有两个孩子，一个儿子，一个女儿。", pinyin: "Shì de. Wǒ yǒu liǎng gè háizi, yí gè érzi, yí gè nǚ'ér.", vietnamese: "Đúng vậy. Chị có hai đứa con, một con trai, một con gái." },
          { speaker: "杨同乐", hanzi: "您儿子几岁？", pinyin: "Nín érzi jǐ suì?", vietnamese: "Cháu trai năm nay mấy tuổi rồi ạ?" },
          { speaker: "王一雪", hanzi: "他今年五岁。", pinyin: "Tā jīnnián wǔ suì.", vietnamese: "Cháu năm nay năm tuổi." },
          { speaker: "杨同乐", hanzi: "您女儿多大？", pinyin: "Nín nǚ'ér duō dà?", vietnamese: "Con gái chị bao nhiêu tuổi rồi ạ?" },
          { speaker: "王一雪", hanzi: "她今年十二。", pinyin: "Tā jīnnián shí'èr.", vietnamese: "Cháu năm nay mười hai tuổi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l4-g1",
        title: "1. “有”字句（1）(Cấu trúc câu chữ '有' biểu thị sở hữu)",
        explanation: "Biểu thị sự sở hữu người hoặc vật. Dạng khẳng định: Chủ ngữ + 有 + Tân ngữ. Dạng phủ định: Chủ ngữ + 没有 + Tân ngữ (LƯU Ý: Không dùng '不有').",
        examples: [
          { hanzi: "她有二十个学生。", pinyin: "Tā yǒu èrshí gè xuésheng.", vietnamese: "Cô ấy có hai mươi học sinh." },
          { hanzi: "我有两个孩子。", pinyin: "Wǒ yǒu liǎng gè háizi.", vietnamese: "Tôi có hai đứa con." },
          { hanzi: "我没有哥哥。", pinyin: "Wǒ méiyǒu gēge.", vietnamese: "Tôi không có anh trai." }
        ]
      },
      {
        id: "hsk1-l4-g2",
        title: "2. 数词与量词结构 (Số từ và lượng từ: '两' vs '二')",
        explanation: "Khi biểu thị số lượng 2 đứng trước lượng từ, bắt buộc dùng '两' (liǎng), không dùng '二' (èr). Cấu trúc: 两 + Lượng từ + Danh từ (ví dụ: 两个孩子, 两口人, 两本书). Chỉ dùng '二' khi đếm số thứ tự hoặc số ghép (ví dụ: 第二, 十二, 二十).",
        examples: [
          { hanzi: "我有两个哥哥。", pinyin: "Wǒ yǒu liǎng gè gēge.", vietnamese: "Tôi có hai người anh trai." },
          { hanzi: "她今年十二岁。", pinyin: "Tā jīnnián shí'èr suì.", vietnamese: "Năm nay cô bé 12 tuổi." }
        ]
      },
      {
        id: "hsk1-l4-g3",
        title: "3. 语气助词“呢”（1）(Trợ từ ngữ khí '呢' trong câu hỏi tỉnh lược)",
        explanation: "Dùng ở cuối câu để hỏi về tình huống của đối tượng khác dựa trên ngữ cảnh vừa nhắc đến. Cấu trúc: A……，B呢？",
        examples: [
          { hanzi: "我有两个哥哥，你呢？", pinyin: "Wǒ yǒu liǎng gè gēge, nǐ ne?", vietnamese: "Tôi có hai người anh trai, còn bạn thì sao?" },
          { hanzi: "我是中国人，你呢？", pinyin: "Wǒ shì Zhōngguó rén, nǐ ne?", vietnamese: "Tôi là người Trung Quốc, còn bạn thì sao?" }
        ]
      },
      {
        id: "hsk1-l4-g4",
        title: "4. 年龄的问答 (Hỏi và trả lời tuổi tác)",
        explanation: "Đối với trẻ em dưới 10 tuổi: dùng '几岁？' (Nín érzi jǐ suì?). Đối với người từ 10 tuổi trở lên hoặc người lớn: dùng '多大？' (Nín nǚ'ér duō dà?).",
        examples: [
          { hanzi: "您儿子几岁？ - 他今年五岁。", pinyin: "Nín érzi jǐ suì? - Tā jīnnián wǔ suì.", vietnamese: "Cháu trai mấy tuổi? - Cháu năm nay 5 tuổi." },
          { hanzi: "您女儿多大？ - 她今年十二。", pinyin: "Nín nǚ'ér duō dà? - Tā jīnnián shí'èr.", vietnamese: "Con gái chị bao nhiêu tuổi? - Cháu năm nay 12 tuổi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l4-w1", hanzi: "有", pinyin: "yǒu", hanViet: "hữu", vietnamese: "có", hskLevel: 1, radical: "月", strokeCount: 6, example: "有学生", exampleTranslation: "có học sinh", tags: ["Bài 4", "Động từ"] },
      { id: "hsk1-l4-w2", hanzi: "多少", pinyin: "duōshao", hanViet: "đa thiểu", vietnamese: "bao nhiêu", hskLevel: 1, radical: "夕", strokeCount: 9, example: "多少个学生？", exampleTranslation: "Bao nhiêu học sinh?", tags: ["Bài 4", "Đại từ nghi vấn"] },
      { id: "hsk1-l4-w3", hanzi: "个", pinyin: "gè", hanViet: "cá", vietnamese: "cái, người (lượng từ chung)", hskLevel: 1, radical: "人", strokeCount: 3, example: "两个孩子", exampleTranslation: "hai đứa con", tags: ["Bài 4", "Lượng từ"] },
      { id: "hsk1-l4-w4", hanzi: "两", pinyin: "liǎng", hanViet: "lưỡng", vietnamese: "hai (dùng trước lượng từ)", hskLevel: 1, radical: "一", strokeCount: 7, example: "两个哥哥", exampleTranslation: "hai người anh trai", tags: ["Bài 4", "Số từ"] },
      { id: "hsk1-l4-w5", hanzi: "哥哥", pinyin: "gēge", hanViet: "ca ca", vietnamese: "anh trai", hskLevel: 1, radical: "口", strokeCount: 10, example: "我哥哥", exampleTranslation: "anh trai tôi", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w6", hanzi: "呢", pinyin: "ne", hanViet: "ni", vietnamese: "còn... thì sao? (trợ từ ngữ khí)", hskLevel: 1, radical: "口", strokeCount: 8, example: "你呢？", exampleTranslation: "Còn bạn thì sao?", tags: ["Bài 4", "Trợ từ"] },
      { id: "hsk1-l4-w7", hanzi: "没有", pinyin: "méiyǒu", hanViet: "một hữu", vietnamese: "không có", hskLevel: 1, radical: "氵", strokeCount: 10, example: "我没有哥哥。", exampleTranslation: "Tôi không có anh trai.", tags: ["Bài 4", "Động từ"] },
      { id: "hsk1-l4-w8", hanzi: "家", pinyin: "jiā", hanViet: "gia", vietnamese: "nhà, gia đình", hskLevel: 1, radical: "宀", strokeCount: 10, example: "我家", exampleTranslation: "nhà tôi", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w9", hanzi: "几", pinyin: "jǐ", hanViet: "kỷ", vietnamese: "mấy", hskLevel: 1, radical: "几", strokeCount: 2, example: "几口人？", exampleTranslation: "Mấy người?", tags: ["Bài 4", "Đại từ nghi vấn"] },
      { id: "hsk1-l4-w10", hanzi: "口", pinyin: "kǒu", hanViet: "khẩu", vietnamese: "người (lượng từ nhân khẩu gia đình)", hskLevel: 1, radical: "口", strokeCount: 3, example: "四口人", exampleTranslation: "bốn người", tags: ["Bài 4", "Lượng từ"] },
      { id: "hsk1-l4-w11", hanzi: "爸爸", pinyin: "bàba", hanViet: "ba ba", vietnamese: "bố, ba", hskLevel: 1, radical: "父", strokeCount: 8, example: "我爸爸", exampleTranslation: "bố tôi", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w12", hanzi: "妈妈", pinyin: "māma", hanViet: "ma ma", vietnamese: "mẹ, má", hskLevel: 1, radical: "女", strokeCount: 6, example: "我妈妈", exampleTranslation: "mẹ tôi", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w13", hanzi: "妹妹", pinyin: "mèimei", hanViet: "muội muội", vietnamese: "em gái", hskLevel: 1, radical: "女", strokeCount: 8, example: "我妹妹", exampleTranslation: "em gái tôi", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w14", hanzi: "和", pinyin: "hé", hanViet: "hòa", vietnamese: "và, cùng", hskLevel: 1, radical: "口", strokeCount: 8, example: "妹妹和我", exampleTranslation: "em gái và tôi", tags: ["Bài 4", "Liên từ"] },
      { id: "hsk1-l4-w15", hanzi: "儿子", pinyin: "érzi", hanViet: "nhi tử", vietnamese: "con trai", hskLevel: 1, radical: "儿", strokeCount: 5, example: "您儿子", exampleTranslation: "con trai của chị", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w16", hanzi: "孩子", pinyin: "háizi", hanViet: "hài tử", vietnamese: "con cái, trẻ em", hskLevel: 1, radical: "子", strokeCount: 12, example: "两个孩子", exampleTranslation: "hai đứa con", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w17", hanzi: "女儿", pinyin: "nǚ'ér", hanViet: "nữ nhi", vietnamese: "con gái", hskLevel: 1, radical: "女", strokeCount: 5, example: "一个女儿", exampleTranslation: "một cô con gái", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w18", hanzi: "岁", pinyin: "suì", hanViet: "tuế", vietnamese: "tuổi", hskLevel: 1, radical: "山", strokeCount: 6, example: "五岁", exampleTranslation: "năm tuổi", tags: ["Bài 4", "Lượng từ"] },
      { id: "hsk1-l4-w19", hanzi: "今年", pinyin: "jīnnián", hanViet: "kim niên", vietnamese: "năm nay", hskLevel: 1, radical: "人", strokeCount: 10, example: "今年五岁", exampleTranslation: "năm nay 5 tuổi", tags: ["Bài 4", "Danh từ thời gian"] },
      { id: "hsk1-l4-w20", hanzi: "多大", pinyin: "duō dà", hanViet: "đa đại", vietnamese: "bao nhiêu tuổi (trên 10 tuổi)", hskLevel: 1, radical: "大", strokeCount: 9, example: "您女儿多大？", exampleTranslation: "Con gái chị bao nhiêu tuổi?", tags: ["Bài 4", "Cụm nghi vấn"] }
    ],
    exercises: [
      {
        id: "hsk1-l4-ex1",
        type: "fill_blank",
        question: "Chọn từ phủ định chính xác cho câu chữ '有': '我 ______ 哥哥。'",
        hanziPrompt: "我 ______ 哥哥。",
        pinyinPrompt: "Wǒ ______ gēge.",
        vietnamesePrompt: "Tôi không có anh trai.",
        options: ["A. 没有", "B. 不有", "C. 没", "D. 不"],
        correctAnswer: "A. 没有",
        explanation: "Phủ định của động từ '有' (có) bắt buộc dùng '没有' (hoặc '没'), tuyệt đối không dùng '不有'.",
        grammarFocus: "Phủ định của động từ 有",
        audioText: "我没有哥哥。"
      },
      {
        id: "hsk1-l4-ex2",
        type: "fill_blank",
        question: "Chọn số từ biểu thị số lượng hai trước lượng từ '个': '我有 ______ 个孩子。'",
        hanziPrompt: "我有 ______ 个孩子。",
        pinyinPrompt: "Wǒ yǒu ______ gè háizi.",
        vietnamesePrompt: "Tôi có hai đứa con.",
        options: ["A. 两", "B. 二", "C. 几", "D. 俩个"],
        correctAnswer: "A. 两",
        explanation: "Trước lượng từ chỉ số lượng phải dùng '两' (liǎng), không dùng '二' (èr).",
        grammarFocus: "Quy tắc dùng 两 trước lượng từ",
        audioText: "我有两个孩子。"
      },
      {
        id: "hsk1-l4-ex3",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu hoàn chỉnh:",
        hanziPrompt: "[ 四口人 / 我家 / 有 / 。 ]",
        vietnamesePrompt: "Nhà tôi có bốn người.",
        scrambleSegments: ["我家", "有", "四口人", "。"],
        options: [
          "我家有四口人。",
          "有四口人我家。",
          "四口人有我家。",
          "我家四口人有。"
        ],
        correctAnswer: "我家有四口人。",
        explanation: "Trật tự câu chữ 有: Chủ ngữ (我家) + 有 + Số lượng từ (四口人).",
        grammarFocus: "Cấu trúc câu chữ 有 biểu thị số thành viên gia đình",
        audioText: "我家有四口人。"
      },
      {
        id: "hsk1-l4-ex4",
        type: "dialogue_match",
        question: "Chọn câu hỏi tuổi thích hợp cho một em bé 5 tuổi:",
        hanziPrompt: "A: ______ ？ — B: 他今年五岁。",
        pinyinPrompt: "A: ______ ? — B: Tā jīnnián wǔ suì.",
        vietnamesePrompt: "A: Cháu trai mấy tuổi? — B: Cháu năm nay năm tuổi.",
        options: [
          "您儿子几岁",
          "您儿子多大",
          "这是谁",
          "你家有几口人"
        ],
        correctAnswer: "您儿子几岁",
        explanation: "Đối với trẻ nhỏ dưới 10 tuổi, người Trung Quốc dùng '几岁？' để hỏi tuổi.",
        grammarFocus: "Cách hỏi tuổi trẻ em với 几岁",
        audioText: "您儿子几岁？"
      }
    ]
  },'''

    l4_start = content.find('  // LESSON 4')
    l5_start = content.find('  // LESSON 5')

    if l4_start != -1 and l5_start != -1:
        new_content = content[:l4_start] + lesson4_code.strip() + '\n\n' + content[l5_start:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Updated Lesson 4 in newHsk1BookData.ts successfully!")
    else:
        print("Could not find Lesson 4 or Lesson 5 markers!")

if __name__ == '__main__':
    patch()
