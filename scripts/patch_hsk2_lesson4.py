# -*- coding: utf-8 -*-
import re

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

l4_replacement = """  // LESSON 4
  {
    lessonNumber: 4,
    titleHanzi: "你穿红色的很好看",
    titlePinyin: "Nǐ chuān hóngsè de hěn hǎokàn",
    titleVietnamese: "Bạn mặc màu đỏ rất đẹp",
    pageStart: 29,
    objectives: [
      "能听懂并询问过去的经历 (Hiểu và hỏi về trải nghiệm, kinh nghiệm trong quá khứ).",
      "能听懂并使用描述的方式指称事物 (Hiểu và dùng cụm chữ '的' để chỉ sự vật).",
      "掌握因果复句“因为……，所以……”的用法，能表达事情的原因和结果 (Nắm vững câu phức nguyên nhân - kết quả '因为……，所以……')."
    ],
    texts: [
      {
        id: "hsk2-l4-t1",
        title: "课文 1: 在商场门口 (Bài khóa 1: Ở cửa trung tâm thương mại)",
        context: "在商场门口，王一雪和刘小雪在聊天儿。(Ở cửa trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết trò chuyện).",
        lines: [
          { speaker: "刘小雪", hanzi: "妈妈，我们来过这家商场吗？", pinyin: "Māma, wǒmen láiguo zhè jiā shāngchǎng ma?", vietnamese: "Mẹ ơi, chúng ta đã từng đến trung tâm thương mại này chưa?" },
          { speaker: "王一雪", hanzi: "没来过，这是新开的。", pinyin: "Méi láiguo, zhè shì xīn kāi de.", vietnamese: "Chưa từng đến, đây là chỗ mới mở." },
          { speaker: "刘小雪", hanzi: "我们进去看看吧。", pinyin: "Wǒmen jìnqù kànkan ba.", vietnamese: "Chúng mình vào trong xem thử đi mẹ." },
          { speaker: "王一雪", hanzi: "好啊！你想买点儿什么？", pinyin: "Hǎo a! Nǐ xiǎng mǎi diǎnr shénme?", vietnamese: "Được chứ! Con muốn mua gì nào?" },
          { speaker: "刘小雪", hanzi: "我想买条裤子。", pinyin: "Wǒ xiǎng mǎi tiáo kùzi.", vietnamese: "Con muốn mua một chiếc quần dài." },
          { speaker: "王一雪", hanzi: "没问题。", pinyin: "Méi wèntí.", vietnamese: "Không vấn đề gì." }
        ]
      },
      {
        id: "hsk2-l4-t2",
        title: "课文 2: 在商场 (Bài khóa 2: Ở trung tâm thương mại)",
        context: "在商场，王一雪和刘小雪在看衣服。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết chọn quần áo).",
        lines: [
          { speaker: "刘小雪", hanzi: "妈妈，我想买这条白色的裤子。", pinyin: "Māma, wǒ xiǎng mǎi zhè tiáo báisè de kùzi.", vietnamese: "Mẹ ơi, con muốn mua chiếc quần màu trắng này." },
          { speaker: "王一雪", hanzi: "你有很多白色的衣服，为什么还买白色的？", pinyin: "Nǐ yǒu hěn duō báisè de yīfu, wèi shénme hái mǎi báisè de?", vietnamese: "Con có rất nhiều quần áo màu trắng rồi, sao lại mua màu trắng nữa?" },
          { speaker: "刘小雪", hanzi: "因为我喜欢白色啊！", pinyin: "Yīnwèi wǒ xǐhuan báisè a!", vietnamese: "Bởi vì con thích màu trắng mà mẹ!" },
          { speaker: "王一雪", hanzi: "我觉得这条白色的不太好看，你试试那条红色的吧。", pinyin: "Wǒ juéde zhè tiáo báisè de bú tài hǎokàn, nǐ shìshi nà tiáo hóngsè de ba.", vietnamese: "Mẹ thấy chiếc màu trắng này không được đẹp lắm, con thử chiếc màu đỏ kia xem sao." },
          { speaker: "刘小雪", hanzi: "我没穿过红色的，红色的好看吗？", pinyin: "Wǒ méi chuānguo hóngsè de, hóngsè de hǎokàn ma?", vietnamese: "Con chưa từng mặc màu đỏ, màu đỏ có đẹp không mẹ?" },
          { speaker: "王一雪", hanzi: "就是因为没穿过，所以要试试啊！", pinyin: "Jiù shì yīnwèi méi chuānguo, suǒyǐ yào shìshi a!", vietnamese: "Chính vì chưa từng mặc nên mới cần thử chứ!" }
        ]
      },
      {
        id: "hsk2-l4-t3",
        title: "课文 3: 在商场 (Bài khóa 3: Ở trung tâm thương mại)",
        context: "在商场，王一雪和刘小雪在看书包。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết chọn ba lô).",
        lines: [
          { speaker: "刘小雪", hanzi: "妈妈，我想买个新书包。", pinyin: "Māma, wǒ xiǎng mǎi gè xīn shūbāo.", vietnamese: "Mẹ ơi, con muốn mua một chiếc ba lô mới." },
          { speaker: "王一雪", hanzi: "好，那边卖书包，我们过去看看吧。", pinyin: "Hǎo, nàbian mài shūbāo, wǒmen guòqù kànkan ba.", vietnamese: "Được, đằng kia bán ba lô, chúng mình qua xem thử nhé." },
          { speaker: "刘小雪", hanzi: "这么多漂亮的书包！", pinyin: "Zhème duō piàoliang de shūbāo!", vietnamese: "Nhiều ba lô đẹp quá chừng!" },
          { speaker: "王一雪", hanzi: "红色的、绿色的、黑色的，你想买哪个？", pinyin: "Hóngsè de, lǜsè de, hēisè de, nǐ xiǎng mǎi nǎge?", vietnamese: "Cái màu đỏ, cái màu xanh lá, cái màu đen, con muốn mua cái nào?" },
          { speaker: "刘小雪", hanzi: "绿色的吧。", pinyin: "Lǜsè de ba.", vietnamese: "Cái màu xanh lá đi mẹ." },
          { speaker: "王一雪", hanzi: "不错，我也觉得绿色的更好看。", pinyin: "Búcuò, wǒ yě juéde lǜsè de gèng hǎokàn.", vietnamese: "Tốt đấy, mẹ cũng thấy cái màu xanh lá đẹp hơn." }
        ]
      },
      {
        id: "hsk2-l4-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
        context: "在房间，刘小雪在写日记。(Trong phòng, Lưu Tiểu Tuyết viết nhật ký).",
        lines: [
          { speaker: "刘小雪", hanzi: "我和妈妈去了一家商场。因为是新开的，所以这几天东西很便宜。商场里的衣服颜色很多。我没穿过红色的裤子，妈妈让我试了试，我觉得我穿红色的也很好看。", pinyin: "Wǒ hé māma qùle yì jiā shāngchǎng. Yīnwèi shì xīn kāi de, suǒyǐ zhè jǐ tiān dōngxi hěn piányi. Shāngchǎng li de yīfu yánsè hěn duō. Wǒ méi chuānguo hóngsè de kùzi, māma ràng wǒ shìleshì, wǒ juéde wǒ chuān hóngsè de yě hěn hǎokàn.", vietnamese: "Tôi cùng mẹ đến một trung tâm thương mại. Vì mới khai trương nên mấy hôm nay đồ đạc rất rẻ. Quần áo trong đó màu sắc rất đa dạng. Tôi chưa từng mặc quần màu đỏ bao giờ, mẹ bảo tôi thử một chút, tôi thấy mình mặc màu đỏ cũng rất đẹp." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l4-g1",
        title: "1. 动态助词“过” (Trợ từ động thái '过' biểu thị từng trải qua)",
        explanation: "Đứng sau động từ để biểu thị một hành động hoặc trải nghiệm đã từng xảy ra trong quá khứ nhưng không kéo dài đến hiện tại. Khẳng định: Động từ + 过. Phủ định: 没(有) + Động từ + 过.",
        examples: [
          { hanzi: "妈妈，我们来过这家商场吗？", pinyin: "Māma, wǒmen láiguo zhè jiā shāngchǎng ma?", vietnamese: "Mẹ ơi, chúng ta đã từng đến trung tâm thương mại này chưa?" },
          { hanzi: "我没穿过红色的裤子。", pinyin: "Wǒ méi chuānguo hóngsè de kùzi.", vietnamese: "Con chưa từng mặc quần màu đỏ." },
          { hanzi: "我吃过饺子，很好吃。", pinyin: "Wǒ chīguo jiǎozi, hěn hǎochī.", vietnamese: "Tôi đã từng ăn sủi cảo, rất ngon." }
        ]
      },
      {
        id: "hsk2-l4-g2",
        title: "2. 因果复句“因为……，所以……” (Câu phức 'Bởi vì... cho nên...')",
        explanation: "Biểu thị quan hệ nhân quả. '因为' dẫn ra nguyên nhân, '所以' dẫn ra kết quả. Có thể dùng đồng thời hoặc dùng riêng lẻ.",
        examples: [
          { hanzi: "就是因为没穿过，所以要试试啊！", pinyin: "Jiù shì yīnwèi méi chuānguo, suǒyǐ yào shìshi a!", vietnamese: "Chính vì chưa từng mặc nên mới cần thử chứ!" },
          { hanzi: "因为是新开的，所以这几天东西很便宜。", pinyin: "Yīnwèi shì xīn kāi de, suǒyǐ zhè jǐ tiān dōngxi hěn piányi.", vietnamese: "Bởi vì mới mở nên mấy ngày này đồ đạc rất rẻ." }
        ]
      },
      {
        id: "hsk2-l4-g3",
        title: "3. “的”字短语 (Cụm chữ '的')",
        explanation: "Trợ từ kết cấu '的' đặt sau tính từ, danh từ hoặc đại từ để tạo thành cụm danh từ tĩnh lược, dùng để chỉ người hoặc sự vật được nhắc đến trước đó: 红色的 (cái màu đỏ), 白色的 (cái màu trắng), 绿色的 (cái màu xanh lá).",
        examples: [
          { hanzi: "红色的、绿色的、黑色的，你想买哪个？", pinyin: "Hóngsè de, lǜsè de, hēisè de, nǐ xiǎng mǎi nǎge?", vietnamese: "Cái màu đỏ, cái màu xanh lá, cái màu đen, con muốn mua cái nào?" },
          { hanzi: "我也觉得绿色的更好看。", pinyin: "Wǒ yě juéde lǜsè de gèng hǎokàn.", vietnamese: "Mẹ cũng thấy cái màu xanh lá đẹp hơn." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l4-w1", hanzi: "过", pinyin: "guo", hanViet: "quá", vietnamese: "qua, từng (trợ từ)", hskLevel: 2, radical: "辶", strokeCount: 6, example: "来过这家商场", exampleTranslation: "đã từng đến trung tâm này", tags: ["Bài 4", "Trợ từ"] },
      { id: "hsk2-l4-w2", hanzi: "商场", pinyin: "shāngchǎng", hanViet: "thương trường", vietnamese: "trung tâm thương mại", hskLevel: 2, radical: "口", strokeCount: 17, example: "去商场买东西", exampleTranslation: "đến trung tâm thương mại mua sắm", tags: ["Bài 4", "Địa điểm"] },
      { id: "hsk2-l4-w3", hanzi: "进去", pinyin: "jìnqù", hanViet: "tiến khứ", vietnamese: "đi vào, vào trong", hskLevel: 2, radical: "辶", strokeCount: 12, example: "我们进去看看吧", exampleTranslation: "chúng mình vào xem thử đi", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w4", hanzi: "条", pinyin: "tiáo", hanViet: "điều", vietnamese: "chiếc, cái (lượng từ quần, cá, đường)", hskLevel: 2, radical: "木", strokeCount: 7, example: "买条裤子", exampleTranslation: "mua chiếc quần", tags: ["Bài 4", "Lượng từ"] },
      { id: "hsk2-l4-w5", hanzi: "裤子", pinyin: "kùzi", hanViet: "khố tử", vietnamese: "quần, quần dài", hskLevel: 2, radical: "衤", strokeCount: 15, example: "白色的裤子", exampleTranslation: "chiếc quần màu trắng", tags: ["Bài 4", "Trang phục"] },
      { id: "hsk2-l4-w6", hanzi: "白色", pinyin: "báisè", hanViet: "bạch sắc", vietnamese: "màu trắng", hskLevel: 2, radical: "白", strokeCount: 11, example: "喜欢白色", exampleTranslation: "thích màu trắng", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w7", hanzi: "因为", pinyin: "yīnwèi", hanViet: "nhân vi", vietnamese: "bởi vì", hskLevel: 2, radical: "囗", strokeCount: 10, example: "因为我喜欢白色", exampleTranslation: "bởi vì con thích màu trắng", tags: ["Bài 4", "Liên từ"] },
      { id: "hsk2-l4-w8", hanzi: "试", pinyin: "shì", hanViet: "thí", vietnamese: "thử", hskLevel: 2, radical: "讠", strokeCount: 8, example: "试了试", exampleTranslation: "đã thử", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w9", hanzi: "红色", pinyin: "hóngsè", hanViet: "hồng sắc", vietnamese: "màu đỏ", hskLevel: 2, radical: "纟", strokeCount: 12, example: "穿红色的很好看", exampleTranslation: "mặc màu đỏ rất đẹp", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w10", hanzi: "所以", pinyin: "suǒyǐ", hanViet: "sở dĩ", vietnamese: "cho nên, vì vậy", hskLevel: 2, radical: "户", strokeCount: 8, example: "所以要试试", exampleTranslation: "cho nên cần phải thử", tags: ["Bài 4", "Liên từ"] },
      { id: "hsk2-l4-w11", hanzi: "书包", pinyin: "shūbāo", hanViet: "thư bao", vietnamese: "ba lô, cặp sách", hskLevel: 2, radical: "勹", strokeCount: 9, example: "买个新书包", exampleTranslation: "mua chiếc cặp sách mới", tags: ["Bài 4", "Đồ dùng"] },
      { id: "hsk2-l4-w12", hanzi: "过去", pinyin: "guòqù", hanViet: "quá khứ", vietnamese: "đi qua, qua bên kia", hskLevel: 2, radical: "辶", strokeCount: 11, example: "我们过去看看", exampleTranslation: "chúng ta qua đó xem xem", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w13", hanzi: "绿色", pinyin: "lǜsè", hanViet: "lục sắc", vietnamese: "màu xanh lá", hskLevel: 2, radical: "纟", strokeCount: 17, example: "绿色的书包", exampleTranslation: "chiếc cặp màu xanh lá", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w14", hanzi: "黑色", pinyin: "hēisè", hanViet: "hắc sắc", vietnamese: "màu đen", hskLevel: 2, radical: "黑", strokeCount: 18, example: "黑色的鞋子", exampleTranslation: "chiếc giày màu đen", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w15", hanzi: "更", pinyin: "gèng", hanViet: "canh", vietnamese: "càng, hơn", hskLevel: 2, radical: "曰", strokeCount: 7, example: "更好看", exampleTranslation: "đẹp hơn", tags: ["Bài 4", "Phó từ"] },
      { id: "hsk2-l4-w16", hanzi: "颜色", pinyin: "yánsè", hanViet: "nhan sắc", vietnamese: "màu sắc", hskLevel: 2, radical: "色", strokeCount: 18, example: "颜色很多", exampleTranslation: "màu sắc rất nhiều", tags: ["Bài 4", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l4-ex1",
        type: "fill_blank",
        question: "Điền trợ từ động thái biểu thị kinh nghiệm quá khứ: '妈妈，我们来 ______ 这家商场吗？'",
        hanziPrompt: "妈妈，我们来 ______ 这家商场吗？",
        pinyinPrompt: "Māma, wǒmen lái ______ zhè jiā shāngchǎng ma?",
        vietnamesePrompt: "Mẹ ơi, chúng ta đã từng đến trung tâm thương mại này chưa?",
        options: ["A. 过", "B. 了", "C. 着", "D. 去"],
        correctAnswer: "A. 过",
        explanation: "Trợ từ động thái '过' đứng sau động từ biểu thị hành động từng xảy ra trong quá khứ.",
        grammarFocus: "Trợ từ động thái 过",
        audioText: "妈妈，我们来过这家商场吗？"
      }
    ]
  },"""

pattern = r"  // LESSON 4\s*\{.*?  // LESSON 5"
replacement = l4_replacement + "\n\n  // LESSON 5"

if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Replaced Lesson 4 successfully with regex!")
else:
    p1 = content.find("// LESSON 4")
    p2 = content.find("// LESSON 5")
    if p1 != -1 and p2 != -1:
        content = content[:p1] + l4_replacement + "\n\n" + content[p2:]
        print("Replaced Lesson 4 with substring slicing!")

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated newHsk2BookData.ts for Lesson 4!")
