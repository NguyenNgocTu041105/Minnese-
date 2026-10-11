import { WordItem } from '../types';
import { DetailedTextbookLesson } from './newHsk1BookData';

export const NEW_HSK2_FULL_LESSONS: DetailedTextbookLesson[] = [
  // LESSON 1
  {
    lessonNumber: 1,
    titleHanzi: "九月去北京旅游最好",
    titlePinyin: "Jiǔyuè qù Běijīng lǚyóu zuì hǎo",
    titleVietnamese: "Đi Bắc Kinh du lịch vào tháng chín là tốt nhất",
    pageStart: 1,
    objectives: [
      "Dùng phó từ '最 (zuì)' biểu thị mức độ cao nhất.",
      "Dùng '几' hoặc '多' để biểu thị số ước lượng.",
      "Luyện tập cách đưa ra gợi ý, đề xuất về kế hoạch du lịch."
    ],
    texts: [
      {
        id: "hsk2-l1-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在学校商量旅游。(Bàn bạc về chuyến du lịch ở trường).",
        lines: [
          { speaker: "A", hanzi: "我要去北京旅游，你觉得什么时候去最好？", pinyin: "Wǒ yào qù Běijīng lǚyóu, nǐ juéde shénme shíhou qù zuì hǎo?", vietnamese: "Tôi muốn đi Bắc Kinh du lịch, bạn thấy đi khi nào là tốt nhất?" },
          { speaker: "B", hanzi: "九月去北京旅游最好。", pinyin: "Jiǔyuè qù Běijīng lǚyóu zuì hǎo.", vietnamese: "Tháng chín đi Bắc Kinh du lịch là đẹp nhất." },
          { speaker: "A", hanzi: "为什么？", pinyin: "Wèishénme?", vietnamese: "Tại sao vậy?" },
          { speaker: "B", hanzi: "因为九月的北京天气不冷也不热。", pinyin: "Yīnwèi jiǔyuè de Běijīng tiānqì bù lěng yě bú rè.", vietnamese: "Bởi vì tháng chín thời tiết ở Bắc Kinh không lạnh cũng không nóng." }
        ]
      },
      {
        id: "hsk2-l1-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在运动场。(Ở sân vận động).",
        lines: [
          { speaker: "A", hanzi: "你喜欢什么运动？", pinyin: "Nǐ xǐhuan shénme yùndòng?", vietnamese: "Bạn thích môn thể thao nào?" },
          { speaker: "B", hanzi: "我最喜欢踢足球。", pinyin: "Wǒ zuì xǐhuan tī zúqiú.", vietnamese: "Tôi thích nhất là đá bóng." },
          { speaker: "A", hanzi: "下午我们一起去踢足球吧。", pinyin: "Xiàwǔ wǒmen yìqǐ qù tī zúqiú ba.", vietnamese: "Chiều nay chúng ta cùng đi đá bóng nhé." },
          { speaker: "B", hanzi: "好啊！", pinyin: "Hǎo a!", vietnamese: "Được thôi!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l1-g1",
        title: "1. Phó từ chỉ mức độ '最' (Nhất)",
        explanation: "Cấu trúc: 最 + Tính từ / Động từ tâm lý (最喜欢, 最好, 最大).",
        examples: [
          { hanzi: "我最喜欢吃米饭。", pinyin: "Wǒ zuì xǐhuan chī mǐfàn.", vietnamese: "Tôi thích ăn cơm nhất." },
          { hanzi: "他的汉语最好。", pinyin: "Tā de Hànyǔ zuì hǎo.", vietnamese: "Tiếng Trung của anh ấy là giỏi nhất." }
        ]
      },
      {
        id: "hsk2-l1-g2",
        title: "2. Liên từ nguyên nhân - kết quả: '因为……所以……'",
        explanation: "Biểu thị quan hệ nhân quả: Vì... nên...",
        examples: [
          { hanzi: "因为天气不好，所以我们没去。", pinyin: "Yīnwèi tiānqì bù hǎo, suǒyǐ wǒmen méi qù.", vietnamese: "Vì thời tiết không tốt nên chúng tôi không đi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l1-w1", hanzi: "旅游", pinyin: "lǚyóu", hanViet: "lữ du", vietnamese: "du lịch", hskLevel: 2, radical: "方", strokeCount: 16, example: "去中国旅游", exampleTranslation: "đi du lịch Trung Quốc", tags: ["Bài 1", "Du lịch"] },
      { id: "hsk2-l1-w2", hanzi: "觉得", pinyin: "juéde", hanViet: "giác đắc", vietnamese: "cảm thấy, nghĩ rằng", hskLevel: 2, radical: "见", strokeCount: 20, example: "我觉得很好。", exampleTranslation: "Tôi thấy rất tốt.", tags: ["Bài 1", "Tâm lý"] },
      { id: "hsk2-l1-w3", hanzi: "最", pinyin: "zuì", hanViet: "tối", vietnamese: "nhất", hskLevel: 2, radical: "日", strokeCount: 12, example: "最喜欢", exampleTranslation: "thích nhất", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk2-l1-w4", hanzi: "为什么", pinyin: "wèishénme", hanViet: "vị thập ma", vietnamese: "tại sao, vì sao", hskLevel: 2, radical: "丶", strokeCount: 11, example: "为什么不去？", exampleTranslation: "Tại sao không đi?", tags: ["Bài 1", "Nghi vấn"] },
      { id: "hsk2-l1-w5", hanzi: "也", pinyin: "yě", hanViet: "dã", vietnamese: "cũng", hskLevel: 2, radical: "乙", strokeCount: 3, example: "我也去。", exampleTranslation: "Tôi cũng đi.", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk2-l1-w6", hanzi: "运动", pinyin: "yùndòng", hanViet: "vận động", vietnamese: "vận động, thể thao", hskLevel: 2, radical: "辶", strokeCount: 13, example: "做运动", exampleTranslation: "tập thể dục thể thao", tags: ["Bài 1", "Thể thao"] },
      { id: "hsk2-l1-w7", hanzi: "踢足球", pinyin: "tī zúqiú", hanViet: "thích túc cầu", vietnamese: "đá bóng, đá bóng đá", hskLevel: 2, radical: "足", strokeCount: 26, example: "一起踢足球", exampleTranslation: "cùng đá bóng", tags: ["Bài 1", "Thể thao"] }
    ],
    exercises: [
      {
        id: "hsk2-l1-ex1",
        type: "fill_blank",
        question: "Điền phó từ chỉ mức độ cao nhất vào câu: '在这些水果中，我 ______ 喜欢吃西瓜。'",
        hanziPrompt: "在这些水果中，我 ______ 喜欢吃西瓜。",
        pinyinPrompt: "Zài zhèxiē shuǐguǒ zhōng, wǒ ______ xǐhuan chī xīguā.",
        vietnamesePrompt: "Trong số các loại hoa quả này, tôi thích ăn dưa hấu nhất.",
        options: ["A. 最", "B. 太", "C. 很", "D. 真"],
        correctAnswer: "A. 最",
        explanation: "So sánh trong một phạm vi lựa chọn 'trong số các hoa quả này', dùng '最' (nhất). Cấu trúc: 最 + Động từ tâm lý (最喜欢).",
        grammarFocus: "Phó từ chỉ mức độ 最",
        audioText: "在这些水果中，我最喜欢吃西瓜。"
      },
      {
        id: "hsk2-l1-ex2",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu đề xuất thời gian du lịch hợp lý:",
        hanziPrompt: "[ 九月 / 去北京 / 旅游 / 最好 / 。 ]",
        vietnamesePrompt: "Tháng chín đi Bắc Kinh du lịch là tốt nhất.",
        scrambleSegments: ["九月", "去北京", "旅游", "最好", "。"],
        options: [
          "九月去北京旅游最好。",
          "去北京九月旅游最好。",
          "最好九月旅游去北京。",
          "九月旅游最好去北京。"
        ],
        correctAnswer: "九月去北京旅游最好。",
        explanation: "Trạng ngữ thời gian (九月) đứng đầu câu hoặc trước vị ngữ, tiếp theo là cụm liên động (去北京旅游) + tính từ (最好).",
        grammarFocus: "Trật tự câu liên động và thời gian",
        audioText: "九月去北京旅游最好。"
      },
      {
        id: "hsk2-l1-ex3",
        type: "dialogue_match",
        question: "Chọn câu giải thích nguyên nhân phù hợp cho câu hỏi: '为什么九月去北京最好？'",
        hanziPrompt: "A: 为什么九月去北京最好？ — B: ______",
        pinyinPrompt: "A: Wèishénme jiǔyuè qù Běijīng zuì hǎo? — B: ______",
        vietnamesePrompt: "A: Tại sao tháng chín đi Bắc Kinh là tốt nhất? — B: Vì thời tiết tháng chín không lạnh cũng không nóng.",
        options: [
          "因为九月的天气不冷也不热。",
          "因为我最不喜欢踢足球。",
          "因为九月有很多考试。",
          "因为我们要去学校上课。"
        ],
        correctAnswer: "因为九月的天气不冷也不热。",
        explanation: "Đáp lại câu hỏi nguyên nhân '为什么' dùng liên từ '因为' (bởi vì) giải thích điều kiện thời tiết lý tưởng.",
        grammarFocus: "Cấu trúc liên từ 因果 因为……",
        audioText: "因为九月的天气不冷也不热。"
      },
      {
        id: "hsk2-l1-ex4",
        type: "translation",
        question: "Dịch sang tiếng Trung: 'Chiều nay chúng ta cùng nhau đi đá bóng nhé.'",
        vietnamesePrompt: "Chiều nay chúng ta cùng nhau đi đá bóng nhé.",
        options: [
          "下午我们一起去踢足球吧。",
          "上午他们一起去旅游吧。",
          "明天我们喜欢打篮球吧。",
          "下午我在家看电视吧。"
        ],
        correctAnswer: "下午我们一起去踢足球吧。",
        explanation: "Cấu trúc đề nghị: [Thời gian: 下午] + [Chủ ngữ: 我们] + 一起 + [Động từ: 去踢足球] + 吧。",
        grammarFocus: "Phó từ 一起 và trợ từ ngữ khí 吧",
        audioText: "下午我们一起去踢足球吧。"
      }
    ]
  },

  // LESSON 2
  {
    lessonNumber: 2,
    titleHanzi: "我每天六点起床",
    titlePinyin: "Wǒ měitiān liù diǎn qǐchuáng",
    titleVietnamese: "Tôi thức dậy lúc sáu giờ mỗi ngày",
    pageStart: 8,
    objectives: [
      "Kể về thói quen sinh hoạt và thời gian biểu hàng ngày.",
      "Dùng đại từ '每 (měi)' biểu thị từng cá thể.",
      "Dùng đại từ nghi vấn '多 (duō)' để hỏi mức độ (多高, 多大)."
    ],
    texts: [
      {
        id: "hsk2-l2-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在运动场谈论作息。(Ở sân vận động nói về thời gian nghỉ ngơi biểu).",
        lines: [
          { speaker: "A", hanzi: "你很少生病，是不是喜欢运动？", pinyin: "Nǐ hěn shǎo shēngbìng, shì bu shì xǐhuan yùndòng?", vietnamese: "Bạn rất ít khi bị ốm, có phải vì thích thể thao không?" },
          { speaker: "B", hanzi: "是啊，我每天早上都要出去跑步。", pinyin: "Shì a, wǒ měitiān zǎoshang dōu yào chūqù pǎobù.", vietnamese: "Đúng vậy, mỗi sáng tôi đều phải ra ngoài chạy bộ." },
          { speaker: "A", hanzi: "你每天几点起床？", pinyin: "Nǐ měitiān jǐ diǎn qǐchuáng?", vietnamese: "Mỗi ngày bạn dậy lúc mấy giờ?" },
          { speaker: "B", hanzi: "我每天六点起床。", pinyin: "Wǒ měitiān liù diǎn qǐchuáng.", vietnamese: "Tôi dậy lúc sáu giờ mỗi ngày." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l2-g1",
        title: "1. Đại từ '每' (Mỗi)",
        explanation: "Cấu trúc: 每 + Lượng từ + Danh từ ... 都 ... (Mỗi ngày, mỗi người...).",
        examples: [
          { hanzi: "他每天都去图书馆。", pinyin: "Tā měitiān dōu qù túshūguǎn.", vietnamese: "Anh ấy ngày nào cũng đến thư viện." }
        ]
      },
      {
        id: "hsk2-l2-g2",
        title: "2. Hỏi mức độ với '多 + Tính từ'",
        explanation: "Ví dụ: 多高 (cao bao nhiêu), 多大 (lớn bao nhiêu), 多长 (dài bao lâu).",
        examples: [
          { hanzi: "你多高？ - 我一米八。", pinyin: "Nǐ duō gāo? - Wǒ yì mǐ bā.", vietnamese: "Bạn cao bao nhiêu? - Tôi 1m80." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l2-w1", hanzi: "生病", pinyin: "shēngbìng", hanViet: "sinh bệnh", vietnamese: "bị ốm, bị bệnh", hskLevel: 2, radical: "疒", strokeCount: 15, example: "他生病了。", exampleTranslation: "Anh ấy bị ốm rồi.", tags: ["Bài 2", "Sức khỏe"] },
      { id: "hsk2-l2-w2", hanzi: "每", pinyin: "měi", hanViet: "mỗi", vietnamese: "mỗi, từng", hskLevel: 2, radical: "母", strokeCount: 7, example: "每天", exampleTranslation: "mỗi ngày", tags: ["Bài 2", "Đại từ"] },
      { id: "hsk2-l2-w3", hanzi: "早上", pinyin: "zǎoshang", hanViet: "tảo thượng", vietnamese: "buổi sáng sớm", hskLevel: 2, radical: "日", strokeCount: 9, example: "早上好！", exampleTranslation: "Chào buổi sáng!", tags: ["Bài 2", "Thời gian"] },
      { id: "hsk2-l2-w4", hanzi: "跑步", pinyin: "pǎobù", hanViet: "bào bộ", vietnamese: "chạy bộ", hskLevel: 2, radical: "足", strokeCount: 19, example: "去跑步", exampleTranslation: "đi chạy bộ", tags: ["Bài 2", "Thể thao"] },
      { id: "hsk2-l2-w5", hanzi: "起床", pinyin: "qǐchuáng", hanViet: "khởi sàng", vietnamese: "thức dậy, rời giường", hskLevel: 2, radical: "走", strokeCount: 17, example: "早点儿起床", exampleTranslation: "dậy sớm một chút", tags: ["Bài 2", "Sinh hoạt"] }
    ],
    exercises: [
      {
        id: "hsk2-l2-ex1",
        type: "multiple_choice",
        question: "Điền vào chỗ trống: '他 ______ 早上六点都去跑步。'",
        options: ["A. 每", "B. 每天", "C. 很多", "D. 常常"],
        correctAnswer: "B. 每天",
        explanation: "'每天' biểu thị mỗi ngày, kết hợp với '都'."
      }
    ]
  },

  // LESSON 3
  {
    lessonNumber: 3,
    titleHanzi: "左边那个红色的是我的",
    titlePinyin: "Zuǒbian nàge hóngsè de shì wǒ de",
    titleVietnamese: "Cái màu đỏ bên trái là của tôi",
    pageStart: 15,
    objectives: [
      "Dùng cụm từ chữ '的' (cụm danh từ rút gọn).",
      "Nắm vững các phương vị từ: 左边 (trái), 右边 (phải).",
      "Học các từ vựng chỉ màu sắc cơ bản."
    ],
    texts: [
      {
        id: "hsk2-l3-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在操场找杯子。(Tìm cốc nước ở sân thể thao).",
        lines: [
          { speaker: "A", hanzi: "这本红色的书是谁的？", pinyin: "Zhè běn hóngsè de shū shì shéi de?", vietnamese: "Quyển sách màu đỏ này là của ai thế?" },
          { speaker: "B", hanzi: "是我的。", pinyin: "Shì wǒ de.", vietnamese: "Là của tôi." },
          { speaker: "A", hanzi: "那个红色的杯子呢？", pinyin: "Nà gè hóngsè de bēizi ne?", vietnamese: "Còn cái cốc màu đỏ kia thì sao?" },
          { speaker: "B", hanzi: "左边那个红色的是我的，右边那个是小丽的。", pinyin: "Zuǒbian nàge hóngsè de shì wǒ de, yòubian nàge shì Xiǎolì de.", vietnamese: "Cái màu đỏ bên trái là của tôi, cái bên phải là của Tiểu Lệ." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l3-g1",
        title: "1. Cụm từ chữ '的' (Đại từ hóa cụm danh từ)",
        explanation: "Khi danh từ trung tâm đã rõ ràng, có thể lược bỏ và chỉ giữ lại 'Định ngữ + 的'.",
        examples: [
          { hanzi: "这本书不是我的 (书)。", pinyin: "Zhè běn shū bú shì wǒ de.", vietnamese: "Quyển sách này không phải của tôi." },
          { hanzi: "我要买红色的 (衣服)。", pinyin: "Wǒ yào mǎi hóngsè de.", vietnamese: "Tôi muốn mua cái màu đỏ." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l3-w1", hanzi: "左边", pinyin: "zuǒbian", hanViet: "tả biên", vietnamese: "bên trái, phía bên trái", hskLevel: 2, radical: "工", strokeCount: 14, example: "在左边", exampleTranslation: "ở bên trái", tags: ["Bài 3", "Phương vị"] },
      { id: "hsk2-l3-w2", hanzi: "右边", pinyin: "yòubian", hanViet: "hữu biên", vietnamese: "bên phải, phía bên phải", hskLevel: 2, radical: "口", strokeCount: 14, example: "往右边走", exampleTranslation: "đi về phía bên phải", tags: ["Bài 3", "Phương vị"] },
      { id: "hsk2-l3-w3", hanzi: "红色", pinyin: "hóngsè", hanViet: "hồng sắc", vietnamese: "màu đỏ", hskLevel: 2, radical: "纟", strokeCount: 12, example: "红色的苹果", exampleTranslation: "quả táo màu đỏ", tags: ["Bài 3", "Màu sắc"] },
      { id: "hsk2-l3-w4", hanzi: "手表", pinyin: "shǒubiǎo", hanViet: "thủ biểu", vietnamese: "đồng hồ đeo tay", hskLevel: 2, radical: "手", strokeCount: 12, example: "一块手表", exampleTranslation: "một chiếc đồng hồ", tags: ["Bài 3", "Đồ vật"] }
    ],
    exercises: [
      {
        id: "hsk2-l3-ex1",
        type: "multiple_choice",
        question: "Chọn câu có cấu trúc chữ '的' chuẩn nghĩa: 'Chiếc xe đạp màu đen là của anh ấy.'",
        options: [
          "A. 黑色的自行车是他的。",
          "B. 自行车黑色是他。",
          "C. 他是黑色自行车。",
          "D. 黑色的自行车是他有。"
        ],
        correctAnswer: "A. 黑色的自行车是他的。",
        explanation: "黑色的 (màu đen) và 他的 (của anh ấy) dùng cụm chữ 的 chuẩn xác."
      }
    ]
  },

  // LESSON 4
  {
    lessonNumber: 4,
    titleHanzi: "这个工作是他帮我介绍的",
    titlePinyin: "Zhège gōngzuò shì tā bāng wǒ jièshào de",
    titleVietnamese: "Công việc này là anh ấy giới thiệu cho tôi",
    pageStart: 22,
    objectives: [
      "Dùng cấu trúc nhấn mạnh '是……的' để nhấn mạnh người thực hiện hành động.",
      "Dùng giới từ '帮 (bāng)' và '给 (gěi)'.",
      "Luyện tập giao tiếp về nơi làm việc và giới thiệu bạn bè."
    ],
    texts: [
      {
        id: "hsk2-l4-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在办公室。(Trong văn phòng).",
        lines: [
          { speaker: "A", hanzi: "你喜欢现在的工作吗？", pinyin: "Nǐ xǐhuan xiànzài de gōngzuò ma?", vietnamese: "Bạn có thích công việc hiện tại không?" },
          { speaker: "B", hanzi: "非常喜欢。这个工作是他帮我介绍的。", pinyin: "Fēicháng xǐhuan. Zhège gōngzuò shì tā bāng wǒ jièshào de.", vietnamese: "Cực kỳ thích. Công việc này là do anh ấy giới thiệu cho tôi đấy." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l4-g1",
        title: "1. Cấu trúc '是……的' nhấn mạnh chủ thể",
        explanation: "Nhấn mạnh ai là người đã làm việc đó trong quá khứ.",
        examples: [
          { hanzi: "这封信是他写的。", pinyin: "Zhè fēng xìn shì tā xiě de.", vietnamese: "Bức thư này là do anh ấy viết." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l4-w1", hanzi: "介绍", pinyin: "jièshào", hanViet: "giới thiệu", vietnamese: "giới thiệu", hskLevel: 2, radical: "人", strokeCount: 12, example: "介绍一下", exampleTranslation: "giới thiệu một chút", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w2", hanzi: "帮", pinyin: "bāng", hanViet: "bang", vietnamese: "giúp, giúp đỡ", hskLevel: 2, radical: "巾", strokeCount: 9, example: "帮我买书", exampleTranslation: "giúp tôi mua sách", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w3", hanzi: "非常", pinyin: "fēicháng", hanViet: "phi thường", vietnamese: "vô cùng, cực kỳ", hskLevel: 2, radical: "非", strokeCount: 19, example: "非常高兴", exampleTranslation: "vô cùng vui mừng", tags: ["Bài 4", "Phó từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l4-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Món ăn này do mẹ tôi nấu.'",
        options: ["A. 这个菜是我妈妈做的。", "B. 这个菜我妈妈做。", "C. 是做我妈妈这个菜。", "D. 这个菜我妈妈是做。"],
        correctAnswer: "A. 这个菜是我妈妈做的。",
        explanation: "Cấu trúc nhấn mạnh người thực hiện: 是 + Ai + Động từ + 的."
      }
    ]
  },

  // LESSON 5
  {
    lessonNumber: 5,
    titleHanzi: "就买这件吧",
    titlePinyin: "Jiù mǎi zhè jiàn ba",
    titleVietnamese: "Mua chiếc này đi",
    pageStart: 29,
    objectives: [
      "Dùng lượng từ '件 (jiàn)' cho quần áo và '条 (tiáo)' cho váy, quần.",
      "Dùng phó từ '就 (jiù)' để biểu thị sự quyết định dứt khoát.",
      "Luyện tập giao tiếp khi đi mua sắm quần áo thời trang."
    ],
    texts: [
      {
        id: "hsk2-l5-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在商场买衣服。(Trong trung tâm thương mại mua quần áo).",
        lines: [
          { speaker: "A", hanzi: "你看这件衣服怎么样？", pinyin: "Nǐ kàn zhè jiàn yīfu zěnmeyàng?", vietnamese: "Bạn xem chiếc áo này thế nào?" },
          { speaker: "B", hanzi: "颜色很好，就是有点儿贵。", pinyin: "Yánsè hěn hǎo, jiùshì yǒudiǎnr guì.", vietnamese: "Màu sắc rất đẹp, chỉ là hơi đắt một chút." },
          { speaker: "A", hanzi: "那买这件红色的吧，这件很便宜。", pinyin: "Nà mǎi zhè jiàn hóngsè de ba, zhè jiàn hěn piányi.", vietnamese: "Thế mua chiếc màu đỏ này đi, chiếc này rất rẻ." },
          { speaker: "B", hanzi: "好，就买这件吧！", pinyin: "Hǎo, jiù mǎi zhè jiàn ba!", vietnamese: "Được, vậy mua chiếc này đi!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l5-g1",
        title: "1. Lượng từ '件' (jiàn) và '条' (tiáo)",
        explanation: "'件' dùng cho áo, áo khoác (一件衣服). '条' dùng cho vật dài mềm như quần, váy, cá, đường (一条裤子, 一条鱼).",
        examples: [
          { hanzi: "这件衬衫很好看。", pinyin: "Zhè jiàn chènshān hěn hǎokàn.", vietnamese: "Chiếc áo sơ mi này rất đẹp." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l5-w1", hanzi: "件", pinyin: "jiàn", hanViet: "kiện", vietnamese: "chiếc, cái (lượng từ áo)", hskLevel: 2, radical: "亻", strokeCount: 6, example: "一件衣服", exampleTranslation: "một chiếc áo", tags: ["Bài 5", "Lượng từ"] },
      { id: "hsk2-l5-w2", hanzi: "颜色", pinyin: "yánsè", hanViet: "nhan sắc", vietnamese: "màu sắc", hskLevel: 2, radical: "页", strokeCount: 21, example: "好看的颜色", exampleTranslation: "màu sắc đẹp", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk2-l5-w3", hanzi: "贵", pinyin: "guì", hanViet: "quý", vietnamese: "đắt, quý", hskLevel: 2, radical: "贝", strokeCount: 9, example: "太贵了", exampleTranslation: "đắt quá", tags: ["Bài 5", "Tính từ"] },
      { id: "hsk2-l5-w4", hanzi: "便宜", pinyin: "piányi", hanViet: "tiện nghi", vietnamese: "rẻ", hskLevel: 2, radical: "亻", strokeCount: 17, example: "很便宜", exampleTranslation: "rất rẻ", tags: ["Bài 5", "Tính từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l5-ex1",
        type: "multiple_choice",
        question: "Lượng từ thích hợp cho 'áo' (衣服) là:",
        options: ["A. 本", "B. 个", "C. 件", "D. 张"],
        correctAnswer: "C. 件",
        explanation: "Lượng từ chuẩn cho áo quần là '件' (一件衣服)."
      }
    ]
  },

  // LESSON 6
  {
    lessonNumber: 6,
    titleHanzi: "你怎么不吃了",
    titlePinyin: "Nǐ zěnme bù chī le",
    titleVietnamese: "Sao bạn không ăn nữa?",
    pageStart: 36,
    objectives: [
      "Dùng '怎么' biểu thị sự ngạc nhiên hoặc hỏi nguyên nhân.",
      "Dùng '别……了' để khuyên can hoặc ngăn cản hành động.",
      "Dùng phó từ '还' biểu thị hành động vẫn còn tiếp tục."
    ],
    texts: [
      {
        id: "hsk2-l6-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在饭馆吃饭。(Ăn cơm ở quán ăn).",
        lines: [
          { speaker: "A", hanzi: "你怎么不吃了？", pinyin: "Nǐ zěnme bù chī le?", vietnamese: "Sao bạn không ăn nữa thế?" },
          { speaker: "B", hanzi: "我吃饱了，真的吃不下了。", pinyin: "Wǒ chībǎo le, zhēnde chībuxià le.", vietnamese: "Tôi no rồi, thật sự không ăn nổi nữa." },
          { speaker: "A", hanzi: "那别吃了，喝点儿茶吧。", pinyin: "Nà bié chī le, hē diǎnr chá ba.", vietnamese: "Thế đừng ăn nữa, uống chút trà nhé." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l6-g1",
        title: "1. Cấu trúc khuyên can: '别……了'",
        explanation: "Biểu thị đừng tiếp tục làm một hành động nào đó nữa: 别 + Động từ + 了.",
        examples: [
          { hanzi: "别看了，快睡觉吧！", pinyin: "Bié kàn le, kuài shuìjiào ba!", vietnamese: "Đừng xem nữa, mau đi ngủ đi!" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l6-w1", hanzi: "别", pinyin: "bié", hanViet: "biệt", vietnamese: "đừng (khuyên can)", hskLevel: 2, radical: "刂", strokeCount: 7, example: "别去", exampleTranslation: "đừng đi", tags: ["Bài 6", "Phó từ"] },
      { id: "hsk2-l6-w2", hanzi: "饱", pinyin: "bǎo", hanViet: "bão", vietnamese: "no (ăn no)", hskLevel: 2, radical: "饣", strokeCount: 13, example: "吃饱了", exampleTranslation: "ăn no rồi", tags: ["Bài 6", "Tính từ"] },
      { id: "hsk2-l6-w3", hanzi: "真", pinyin: "zhēn", hanViet: "chân", vietnamese: "thật, thực sự", hskLevel: 2, radical: "目", strokeCount: 10, example: "真的吗？", exampleTranslation: "Thật không?", tags: ["Bài 6", "Phó từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l6-ex1",
        type: "multiple_choice",
        question: "Muốn khuyên 'Đừng nói nữa!', ta nói:",
        options: ["A. 别说了！", "B. 不说了！", "C. 没说了！", "D. 要说了！"],
        correctAnswer: "A. 别说了！",
        explanation: "Cấu trúc khuyên can là '别……了'."
      }
    ]
  },

  // LESSON 7
  {
    lessonNumber: 7,
    titleHanzi: "差不多",
    titlePinyin: "Chàbuduō",
    titleVietnamese: "Gần như / Xấp xỉ",
    pageStart: 43,
    objectives: [
      "Dùng '差不多 (chàbuduō)' biểu thị sự tương tự, xấp xỉ.",
      "Dùng '已经……了' để chỉ sự việc đã hoàn thành.",
      "Mở rộng vốn từ vựng thời gian và hoạt động hàng ngày."
    ],
    texts: [
      {
        id: "hsk2-l7-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在图书馆复习。(Ôn bài trong thư viện).",
        lines: [
          { speaker: "A", hanzi: "你准备得怎么样了？", pinyin: "Nǐ zhǔnbèi de zěnmeyàng le?", vietnamese: "Bạn chuẩn bị thế nào rồi?" },
          { speaker: "B", hanzi: "差不多都复习完了。", pinyin: "Chàbuduō dōu fùxí wán le.", vietnamese: "Gần như ôn tập xong hết rồi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l7-g1",
        title: "1. Cách dùng từ '差不多'",
        explanation: "Làm vị ngữ hoặc phó từ: 'Gần như, xấp xỉ'.",
        examples: [
          { hanzi: "我们俩差不多大。", pinyin: "Wǒmen liǎ chàbuduō dà.", vietnamese: "Hai đứa mình trạc tuổi nhau." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l7-w1", hanzi: "差不多", pinyin: "chàbuduō", hanViet: "sai bất đa", vietnamese: "gần như, xấp xỉ", hskLevel: 2, radical: "工", strokeCount: 19, example: "差不多好了", exampleTranslation: "gần xong rồi", tags: ["Bài 7", "Phó từ"] },
      { id: "hsk2-l7-w2", hanzi: "已经", pinyin: "yǐjīng", hanViet: "dĩ kinh", vietnamese: "đã... rồi", hskLevel: 2, radical: "己", strokeCount: 11, example: "已经走了", exampleTranslation: "đã đi rồi", tags: ["Bài 7", "Phó từ"] },
      { id: "hsk2-l7-w3", hanzi: "准备", pinyin: "zhǔnbèi", hanViet: "chuẩn bị", vietnamese: "chuẩn bị", hskLevel: 2, radical: "冫", strokeCount: 20, example: "准备考试", exampleTranslation: "chuẩn bị thi", tags: ["Bài 7", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l7-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Tôi đã làm xong bài kiểm tra rồi.'",
        options: ["A. 我已经做完考试了。", "B. 我差不多做考试。", "C. 我做考试已经。", "D. 我在做完考试。"],
        correctAnswer: "A. 我已经做完考试了。",
        explanation: "Dùng '已经 + Động từ + 了'."
      }
    ]
  },

  // LESSON 8
  {
    lessonNumber: 8,
    titleHanzi: "让我想想再告诉你",
    titlePinyin: "Ràng wǒ xiǎngxiang zài gàosu nǐ",
    titleVietnamese: "Để tôi suy nghĩ rồi nói cho bạn biết",
    pageStart: 50,
    objectives: [
      "Dùng câu kiêm ngữ với '让 (ràng)' hoặc '叫 (jiào)' biểu thị sự cho phép, sai khiến.",
      "Dùng phó từ '再 (zài)' biểu thị hành động tiếp theo trong tương lai.",
      "Nắm vững hiện tượng trùng điệp động từ (想想, 看看)."
    ],
    texts: [
      {
        id: "hsk2-l8-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在教室商量周末计划。(Trong lớp bàn kế hoạch cuối tuần).",
        lines: [
          { speaker: "A", hanzi: "周末我们去爬山，好吗？", pinyin: "Zhōumò wǒmen qù páshān, hǎo ma?", vietnamese: "Cuối tuần tụi mình đi leo núi được không?" },
          { speaker: "B", hanzi: "让我想想再告诉你吧。", pinyin: "Ràng wǒ xiǎngxiang zài gàosu nǐ ba.", vietnamese: "Để tôi suy nghĩ một chút rồi báo bạn sau nhé." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l8-g1",
        title: "1. Câu kiêm ngữ với '让' (Để / Cho phép / Bảo)",
        explanation: "Chủ ngữ + 让 + Tân ngữ + Động từ.",
        examples: [
          { hanzi: "老师让我读生词。", pinyin: "Lǎoshī ràng wǒ dú shēngcí.", vietnamese: "Cô giáo bảo tôi đọc từ mới." }
        ]
      },
      {
        id: "hsk2-l8-g2",
        title: "2. Phó từ '再' chỉ hành động kế tiếp",
        explanation: "Làm xong A rồi mới làm B: A ... 再 + B.",
        examples: [
          { hanzi: "吃完饭再去。", pinyin: "Chīwán fàn zài qù.", vietnamese: "Ăn cơm xong rồi hãy đi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l8-w1", hanzi: "让", pinyin: "ràng", hanViet: "nhượng", vietnamese: "để cho, bảo, nhường", hskLevel: 2, radical: "讠", strokeCount: 5, example: "让我看看", exampleTranslation: "để tôi xem xem", tags: ["Bài 8", "Động từ"] },
      { id: "hsk2-l8-w2", hanzi: "再", pinyin: "zài", hanViet: "tái", vietnamese: "lại, sau đó mới", hskLevel: 2, radical: "冂", strokeCount: 6, example: "再见 / 再想一想", exampleTranslation: "hẹn gặp lại / nghĩ lại xem sao", tags: ["Bài 8", "Phó từ"] },
      { id: "hsk2-l8-w3", hanzi: "告诉", pinyin: "gàosu", hanViet: "cáo tố", vietnamese: "bảo cho, nói cho biết", hskLevel: 2, radical: "口", strokeCount: 14, example: "告诉我", exampleTranslation: "nói cho tôi biết", tags: ["Bài 8", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l8-ex1",
        type: "multiple_choice",
        question: "Điền từ: '你等我一下，我洗完手 ______ 吃饭。'",
        options: ["A. 再", "B. 又", "C. 还", "D. 也"],
        correctAnswer: "A. 再",
        explanation: "'再' biểu thị hành động xảy ra sau khi hành động trước hoàn tất."
      }
    ]
  },

  // LESSON 9
  {
    lessonNumber: 9,
    titleHanzi: "题太多，我没做完",
    titlePinyin: "Tí tài duō, wǒ méi zuòwán",
    titleVietnamese: "Đề nhiều quá, tôi chưa làm hết",
    pageStart: 57,
    objectives: [
      "Nắm vững bổ ngữ kết quả: 完 (xong), 懂 (hiểu), 对 (đúng), 错 (sai).",
      "Dùng thể phủ định của bổ ngữ kết quả: 没 + Động từ + Bổ ngữ.",
      "Học cách diễn đạt cảm nghĩ sau các kỳ thi."
    ],
    texts: [
      {
        id: "hsk2-l9-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "考试后谈论考试。(Nói về bài kiểm tra sau khi thi xong).",
        lines: [
          { speaker: "A", hanzi: "今天的考试怎么样？你做完了吗？", pinyin: "Jīntiān de kǎoshì zěnmeyàng? Nǐ zuòwán le ma?", vietnamese: "Bài thi hôm nay thế nào? Bạn làm xong hết chưa?" },
          { speaker: "B", hanzi: "题太多了，我没做完。", pinyin: "Tí tài duō le, wǒ méi zuòwán.", vietnamese: "Câu hỏi nhiều quá, tôi chưa làm hết." },
          { speaker: "A", hanzi: "听力你听懂了吗？", pinyin: "Tīnglì nǐ tīngdǒng le ma?", vietnamese: "Phần nghe bạn có nghe hiểu không?" },
          { speaker: "B", hanzi: "听懂了，但是写得慢。", pinyin: "Tīngdǒng le, dànshì xiě de màn.", vietnamese: "Nghe hiểu, nhưng mà viết chậm quá." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l9-g1",
        title: "1. Bổ ngữ kết quả (Resultative Complement)",
        explanation: "Động từ + 完 / 懂 / 对 / 错 / 见. Phủ định dùng '没', KHÔNG dùng '不' hoặc '了'.",
        examples: [
          { hanzi: "我做完了作业。", pinyin: "Wǒ zuòwán le zuòyè.", vietnamese: "Tôi đã làm xong bài tập." },
          { hanzi: "我没看懂。", pinyin: "Wǒ méi kàndǒng.", vietnamese: "Tôi chưa đọc hiểu." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l9-w1", hanzi: "题", pinyin: "tí", hanViet: "đề", vietnamese: "đề bài, câu hỏi", hskLevel: 2, radical: "页", strokeCount: 18, example: "做题", exampleTranslation: "làm bài tập/đề", tags: ["Bài 9", "Giáo dục"] },
      { id: "hsk2-l9-w2", hanzi: "完", pinyin: "wán", hanViet: "hoàn", vietnamese: "xong, hết", hskLevel: 2, radical: "宀", strokeCount: 7, example: "做完 / 吃完", exampleTranslation: "làm xong / ăn xong", tags: ["Bài 9", "Bổ ngữ"] },
      { id: "hsk2-l9-w3", hanzi: "懂", pinyin: "dǒng", hanViet: "đổng", vietnamese: "hiểu, hiểu rõ", hskLevel: 2, radical: "忄", strokeCount: 15, example: "听懂了", exampleTranslation: "nghe hiểu rồi", tags: ["Bài 9", "Bổ ngữ"] },
      { id: "hsk2-l9-w4", hanzi: "慢", pinyin: "màn", hanViet: "mạn", vietnamese: "chậm", hskLevel: 2, radical: "忄", strokeCount: 14, example: "慢走", exampleTranslation: "đi thong thả", tags: ["Bài 9", "Tính từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l9-ex1",
        type: "multiple_choice",
        question: "Phủ định của câu '我听懂了' là:",
        options: ["A. 我没听懂", "B. 我不听懂了", "C. 我听不懂了", "D. 我没听懂了"],
        correctAnswer: "A. 我没听懂",
        explanation: "Phủ định bổ ngữ kết quả dùng '没 + V + Bổ ngữ kết quả', bỏ '了'."
      }
    ]
  },

  // LESSON 10
  {
    lessonNumber: 10,
    titleHanzi: "别找了，手机在桌子上呢",
    titlePinyin: "Bié zhǎo le, shǒujī zài zhuōzi shang ne",
    titleVietnamese: "Đừng tìm nữa, điện thoại ở trên bàn kìa",
    pageStart: 64,
    objectives: [
      "Sử dụng các giới từ phương hướng và trợ từ ngữ khí '呢'.",
      "Luyện tập tìm kiếm đồ đạc thất lạc hàng ngày (chìa khóa, điện thoại).",
      "Dùng '从 (cóng) ... 到 (dào) ...' chỉ khoảng cách và thời gian."
    ],
    texts: [
      {
        id: "hsk2-l10-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在家里找手机。(Tìm điện thoại ở nhà).",
        lines: [
          { speaker: "A", hanzi: "你在找什么呢？", pinyin: "Nǐ zài zhǎo shénme ne?", vietnamese: "Bạn đang tìm cái gì thế?" },
          { speaker: "B", hanzi: "我的手机不见了。", pinyin: "Wǒ de shǒujī bújiàn le.", vietnamese: "Điện thoại của tôi biến đâu mất rồi." },
          { speaker: "A", hanzi: "别找了，手机在桌子上呢。", pinyin: "Bié zhǎo le, shǒujī zài zhuōzi shang ne.", vietnamese: "Đừng tìm nữa, điện thoại ở trên bàn kìa." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l10-g1",
        title: "1. Cấu trúc '从……到……' (Từ... đến...)",
        explanation: "Chỉ khoảng cách không gian hoặc thời gian: 从 A 到 B.",
        examples: [
          { hanzi: "从北京到上海", pinyin: "cóng Běijīng dào Shànghǎi", vietnamese: "từ Bắc Kinh đến Thượng Hải" },
          { hanzi: "从早上到晚上", pinyin: "cóng zǎoshang dào wǎnshang", vietnamese: "từ sáng đến tối" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l10-w1", hanzi: "手机", pinyin: "shǒujī", hanViet: "thủ cơ", vietnamese: "điện thoại di động", hskLevel: 2, radical: "手", strokeCount: 10, example: "买新手机", exampleTranslation: "mua điện thoại mới", tags: ["Bài 10", "Công nghệ"] },
      { id: "hsk2-l10-w2", hanzi: "找", pinyin: "zhǎo", hanViet: "trảo", vietnamese: "tìm kiếm, thối lại tiền", hskLevel: 2, radical: "扌", strokeCount: 7, example: "找东西", exampleTranslation: "tìm đồ", tags: ["Bài 10", "Động từ"] },
      { id: "hsk2-l10-w3", hanzi: "从", pinyin: "cóng", hanViet: "tòng", vietnamese: "từ", hskLevel: 2, radical: "人", strokeCount: 4, example: "从这里开始", exampleTranslation: "bắt đầu từ đây", tags: ["Bài 10", "Giới từ"] },
      { id: "hsk2-l10-w4", hanzi: "到", pinyin: "dào", hanViet: "đáo", vietnamese: "đến, tới", hskLevel: 2, radical: "刂", strokeCount: 8, example: "到了", exampleTranslation: "đến nơi rồi", tags: ["Bài 10", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l10-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Từ nhà tôi đến trường rất gần.'",
        options: [
          "A. 从我家到学校很近。",
          "B. 到我家从学校很近。",
          "C. 我家从学校到近。",
          "D. 从学校很近到我家。"
        ],
        correctAnswer: "A. 从我家到学校很近。",
        explanation: "Cấu trúc: 从 + Nơi xuất phát + 到 + Nơi đến + Tính từ."
      }
    ]
  },

  // LESSON 11
  {
    lessonNumber: 11,
    titleHanzi: "他比我大三岁",
    titlePinyin: "Tā bǐ wǒ dà sān suì",
    titleVietnamese: "Anh ấy lớn hơn tôi ba tuổi",
    pageStart: 71,
    objectives: [
      "Nắm vững câu so sánh chữ '比 (bǐ)': A 比 B + Tính từ + (Số lượng/一点儿/得多).",
      "Dùng câu so sánh phủ định với '没有 (méiyǒu)'.",
      "So sánh chiều cao, tuổi tác, thời tiết và năng lực."
    ],
    texts: [
      {
        id: "hsk2-l11-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在学校谈论朋友。(Nói về bạn bè ở trường).",
        lines: [
          { speaker: "A", hanzi: "王朋和李友谁大？", pinyin: "Wáng Péng hé Lǐ Yǒu shéi dà?", vietnamese: "Vương Bằng và Lý Hữu ai lớn tuổi hơn?" },
          { speaker: "B", hanzi: "王朋比李友大三岁。", pinyin: "Wáng Péng bǐ Lǐ Yǒu dà sān suì.", vietnamese: "Vương Bằng lớn hơn Lý Hữu ba tuổi." },
          { speaker: "A", hanzi: "今天比昨天冷吗？", pinyin: "Jīntiān bǐ zuótiān lěng ma?", vietnamese: "Hôm nay có lạnh hơn hôm qua không?" },
          { speaker: "B", hanzi: "今天比昨天冷得多。", pinyin: "Jīntiān bǐ zuótiān lěng de duō.", vietnamese: "Hôm nay lạnh hơn hôm qua nhiều." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l11-g1",
        title: "1. Câu so sánh chữ '比' (A hơn B)",
        explanation: "Cấu trúc cơ bản: A + 比 + B + Tính từ. Có mức độ cụ thể: A + 比 + B + Tính từ + (一点儿 / 得多 / Số lượng).",
        examples: [
          { hanzi: "他比我高一点儿。", pinyin: "Tā bǐ wǒ gāo yìdiǎnr.", vietnamese: "Anh ấy cao hơn tôi một chút." },
          { hanzi: "西瓜比苹果贵得多。", pinyin: "Xīguā bǐ píngguǒ guì de duō.", vietnamese: "Dưa hấu đắt hơn táo nhiều." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l11-w1", hanzi: "比", pinyin: "bǐ", hanViet: "tỉ", vietnamese: "so với, hơn (so sánh)", hskLevel: 2, radical: "比", strokeCount: 4, example: "A 比 B 好", exampleTranslation: "A tốt hơn B", tags: ["Bài 11", "So sánh"] },
      { id: "hsk2-l11-w2", hanzi: "高", pinyin: "gāo", hanViet: "cao", vietnamese: "cao", hskLevel: 2, radical: "高", strokeCount: 10, example: "个子很高", exampleTranslation: "dáng người rất cao", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk2-l11-w3", hanzi: "得多", pinyin: "de duō", hanViet: "đắc đa", vietnamese: "hơn nhiều", hskLevel: 2, radical: "彳", strokeCount: 17, example: "好得多", exampleTranslation: "tốt hơn nhiều", tags: ["Bài 11", "Mức độ"] }
    ],
    exercises: [
      {
        id: "hsk2-l11-ex1",
        type: "multiple_choice",
        question: "Dịch chuẩn: 'Hôm nay trời lạnh hơn hôm qua nhiều.'",
        options: [
          "A. 今天比昨天冷得多。",
          "B. 今天比昨天很冷。",
          "C. 今天很比昨天冷。",
          "D. 今天比冷昨天得多。"
        ],
        correctAnswer: "A. 今天比昨天冷得多。",
        explanation: "Trong câu so sánh chữ '比', không dùng '很', muốn biểu thị chênh lệch lớn dùng '得多'."
      }
    ]
  },

  // LESSON 12
  {
    lessonNumber: 12,
    titleHanzi: "你穿得太少了",
    titlePinyin: "Nǐ chuān de tài shǎo le",
    titleVietnamese: "Bạn mặc ít áo quá",
    pageStart: 78,
    objectives: [
      "Nắm vững bổ ngữ trạng thái / bổ ngữ khả năng với '得 (de)'.",
      "Cấu trúc đánh giá hành động: Động từ + 得 + Tính từ / Cụm tính từ.",
      "Quan tâm đến sức khỏe và cách ăn mặc theo thời tiết."
    ],
    texts: [
      {
        id: "hsk2-l12-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在门外。(Trước cửa nhà).",
        lines: [
          { speaker: "A", hanzi: "外面很冷，你穿得太少了！", pinyin: "Wàimiàn hěn lěng, nǐ chuān de tài shǎo le!", vietnamese: "Bên ngoài lạnh lắm, bạn mặc ít áo quá!" },
          { speaker: "B", hanzi: "没关系，我跑得快，一会儿就热了。", pinyin: "Méi guānxi, wǒ pǎo de kuài, yíhuìr jiù rè le.", vietnamese: "Không sao đâu, tôi chạy nhanh, một lát là ấm người ngay." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l12-g1",
        title: "1. Bổ ngữ trạng thái với trợ từ '得'",
        explanation: "Dùng để đánh giá hoặc miêu tả kết quả, trình độ, trạng thái của một động tác: Động từ + 得 + Tính từ.",
        examples: [
          { hanzi: "她说得很好。", pinyin: "Tā shuō de hěn hǎo.", vietnamese: "Cô ấy nói rất hay." },
          { hanzi: "他起得很早。", pinyin: "Tā qǐ de hěn zǎo.", vietnamese: "Anh ấy dậy rất sớm." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l12-w1", hanzi: "穿", pinyin: "chuān", hanViet: "xuyên", vietnamese: "mặc (quần áo), đi (giày)", hskLevel: 2, radical: "穴", strokeCount: 9, example: "穿衣服", exampleTranslation: "mặc quần áo", tags: ["Bài 12", "Động từ"] },
      { id: "hsk2-l12-w2", hanzi: "得", pinyin: "de", hanViet: "đắc", vietnamese: "trợ từ kết cấu bổ ngữ", hskLevel: 2, radical: "彳", strokeCount: 11, example: "跑得快", exampleTranslation: "chạy nhanh", tags: ["Bài 12", "Trợ từ"] },
      { id: "hsk2-l12-w3", hanzi: "少", pinyin: "shǎo", hanViet: "thiểu", vietnamese: "ít", hskLevel: 2, radical: "小", strokeCount: 4, example: "很少", exampleTranslation: "rất ít", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk2-l12-w4", hanzi: "快", pinyin: "kuài", hanViet: "khoái", vietnamese: "nhanh", hskLevel: 2, radical: "忄", strokeCount: 7, example: "快点儿", exampleTranslation: "nhanh lên một chút", tags: ["Bài 12", "Tính từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l12-ex1",
        type: "multiple_choice",
        question: "Chọn trợ từ đúng: '他的汉语说 ______ 非常好。'",
        options: ["A. 的", "B. 得", "C. 地", "D. 了"],
        correctAnswer: "B. 得",
        explanation: "Sau động từ (说) để đánh giá trạng thái hành động (非常好) phải dùng trợ từ '得'."
      }
    ]
  },

  // LESSON 13
  {
    lessonNumber: 13,
    titleHanzi: "门开着呢",
    titlePinyin: "Mén kāizhe ne",
    titleVietnamese: "Cửa đang mở",
    pageStart: 85,
    objectives: [
      "Dùng trợ từ động thái '着 (zhe)' biểu thị sự duy trì của trạng thái.",
      "Phân biệt giữa hành động đang tiếp diễn (在...呢) và trạng thái tĩnh đang duy trì (V + 着).",
      "Miêu tả đặc điểm trang phục và tư thế của nhân vật."
    ],
    texts: [
      {
        id: "hsk2-l13-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在办公室门口。(Ở cửa văn phòng).",
        lines: [
          { speaker: "A", hanzi: "门开着呢，请进吧。", pinyin: "Mén kāizhe ne, qǐng jìn ba.", vietnamese: "Cửa đang mở đấy, mời vào đi ạ." },
          { speaker: "B", hanzi: "请问，张老师在吗？", pinyin: "Qǐngwèn, Zhāng lǎoshī zài ma?", vietnamese: "Xin hỏi thầy Trương có ở đây không?" },
          { speaker: "A", hanzi: "他穿着白衬衫，正在打电话呢。", pinyin: "Tā chuānzhe bái chènshān, zhèngzài dǎ diànhuà ne.", vietnamese: "Thầy ấy đang mặc áo sơ mi trắng, đang gọi điện thoại kìa." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l13-g1",
        title: "1. Trợ từ động thái '着' (Duy trì trạng thái)",
        explanation: "Cấu trúc: Động từ + 着 (+ 呢). Biểu thị trạng thái kết quả của động tác vẫn đang tiếp tục tồn tại.",
        examples: [
          { hanzi: "门开着呢。", pinyin: "Mén kāizhe ne.", vietnamese: "Cửa đang mở (trạng thái mở duy trì)." },
          { hanzi: "她戴着眼镜。", pinyin: "Tā dàizhe yǎnjìng.", vietnamese: "Cô ấy đang đeo kính." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l13-w1", hanzi: "门", pinyin: "mén", hanViet: "môn", vietnamese: "cửa, cổng", hskLevel: 2, radical: "门", strokeCount: 3, example: "开门 / 关门", exampleTranslation: "mở cửa / đóng cửa", tags: ["Bài 13", "Đồ vật"] },
      { id: "hsk2-l13-w2", hanzi: "着", pinyin: "zhe", hanViet: "trước", vietnamese: "đang (trợ từ trạng thái)", hskLevel: 2, radical: "目", strokeCount: 11, example: "看着 / 拿着", exampleTranslation: "đang nhìn / đang cầm", tags: ["Bài 13", "Trợ từ"] },
      { id: "hsk2-l13-w3", hanzi: "进", pinyin: "jìn", hanViet: "tiến", vietnamese: "vào, tiến vào", hskLevel: 2, radical: "辶", strokeCount: 7, example: "请进", exampleTranslation: "mời vào", tags: ["Bài 13", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l13-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Trên bàn có để một tách trà.'",
        options: ["A. 桌子上放着一杯茶。", "B. 桌子上放在一杯茶。", "C. 桌子上是一杯茶放。", "D. 桌子上一杯茶放着。"],
        correctAnswer: "A. 桌子上放着一杯茶。",
        explanation: "Cấu trúc tồn hiện: Nơi chốn + Động từ + 着 + Danh từ."
      }
    ]
  },

  // LESSON 14
  {
    lessonNumber: 14,
    titleHanzi: "你看过那个电影没有",
    titlePinyin: "Nǐ kànguo nàge diànyǐng méiyǒu",
    titleVietnamese: "Bạn đã xem bộ phim đó chưa?",
    pageStart: 92,
    objectives: [
      "Dùng trợ từ động thái '过 (guo)' biểu thị kinh nghiệm hoặc trải nghiệm trong quá khứ.",
      "Phủ định của trải nghiệm: 没(有) + Động từ + 过.",
      "Hỏi nghi vấn chính phản: Động từ + 过 ... 没有?"
    ],
    texts: [
      {
        id: "hsk2-l14-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在电影院门口。(Trước cửa rạp chiếu phim).",
        lines: [
          { speaker: "A", hanzi: "你看过那个中国电影没有？", pinyin: "Nǐ kànguo nàge Zhōngguó diànyǐng méiyǒu?", vietnamese: "Bạn đã từng xem bộ phim Trung Quốc đó chưa?" },
          { speaker: "B", hanzi: "没看过，听说很有意思。", pinyin: "Méi kànguo, tīngshuō hěn yǒu yìsi.", vietnamese: "Chưa từng xem, nghe nói rất hay và thú vị." },
          { speaker: "A", hanzi: "我们明天一起去看吧！", pinyin: "Wǒmen míngtiān yìqǐ qù kàn ba!", vietnamese: "Ngày mai tụi mình cùng đi xem nhé!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l14-g1",
        title: "1. Trợ từ động thái '过' (Đã từng)",
        explanation: "Biểu thị đã từng có trải nghiệm trong quá khứ. Phủ định: 没 + Động từ + 过 (chưa từng).",
        examples: [
          { hanzi: "我去过北京。", pinyin: "Wǒ qùguo Běijīng.", vietnamese: "Tôi đã từng đến Bắc Kinh." },
          { hanzi: "我没吃过北京烤鸭。", pinyin: "Wǒ méi chīguo Běijīng kǎoyā.", vietnamese: "Tôi chưa từng ăn vịt quay Bắc Kinh." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l14-w1", hanzi: "过", pinyin: "guo", hanViet: "quá", vietnamese: "đã từng (trợ từ trải nghiệm)", hskLevel: 2, radical: "辶", strokeCount: 6, example: "去过", exampleTranslation: "từng đi", tags: ["Bài 14", "Trợ từ"] },
      { id: "hsk2-l14-w2", hanzi: "听说", pinyin: "tīngshuō", hanViet: "thính thuyết", vietnamese: "nghe nói", hskLevel: 2, radical: "口", strokeCount: 16, example: "听说很好", exampleTranslation: "nghe nói rất tốt", tags: ["Bài 14", "Động từ"] },
      { id: "hsk2-l14-w3", hanzi: "意思", pinyin: "yìsi", hanViet: "ý tứ", vietnamese: "ý nghĩa, thú vị", hskLevel: 2, radical: "心", strokeCount: 22, example: "有意思", exampleTranslation: "thú vị, hay", tags: ["Bài 14", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l14-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Tôi chưa từng đi Trung Quốc.'",
        options: ["A. 我没去过中国。", "B. 我不去过中国。", "C. 我不去了中国。", "D. 我没有去中国了。"],
        correctAnswer: "A. 我没去过中国。",
        explanation: "Phủ định của trải nghiệm dùng '没 + V + 过'."
      }
    ]
  },

  // LESSON 15
  {
    lessonNumber: 15,
    titleHanzi: "新年就要到了",
    titlePinyin: "Xīnnián jiù yào dào le",
    titleVietnamese: "Năm mới sắp đến rồi",
    pageStart: 99,
    objectives: [
      "Dùng '快要……了' hoặc '就要……了' để biểu thị hành động sắp sửa xảy ra trong tương lai gần.",
      "Gửi lời chúc mừng năm mới (新年快乐) và ngày lễ tết.",
      "Tổng kết và ôn tập trọn vẹn 300 từ vựng New HSK 2 chuẩn 3.0."
    ],
    texts: [
      {
        id: "hsk2-l15-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在车站。(Ở nhà ga).",
        lines: [
          { speaker: "A", hanzi: "新年就要到了，你打算去哪儿旅游？", pinyin: "Xīnnián jiù yào dào le, nǐ dǎsuàn qù nǎr lǚyóu?", vietnamese: "Năm mới sắp đến rồi, bạn dự định đi đâu du lịch?" },
          { speaker: "B", hanzi: "我想回家看爸爸妈妈。火车快要开了，我先走了！", pinyin: "Wǒ xiǎng huí jiā kàn bàba māma. Huǒchē kuàiyào kāi le, wǒ xiān zǒu le!", vietnamese: "Tôi muốn về nhà thăm bố mẹ. Xe lửa sắp chạy rồi, tôi đi trước nhé!" },
          { speaker: "A", hanzi: "祝你一路平安，新年快乐！", pinyin: "Zhù nǐ yílù píng'ān, xīnnián kuàilè!", vietnamese: "Chúc bạn thượng lộ bình an, năm mới vui vẻ!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l15-g1",
        title: "1. Cấu trúc sắp xảy ra: '就要……了 / 快要……了'",
        explanation: "Biểu thị sự việc sắp sửa xảy ra trong tương lai gần. Nếu có mốc thời gian cụ thể phía trước, BẮT BUỘC dùng '就要……了', không dùng '快要……了'.",
        examples: [
          { hanzi: "飞机快要起飞了。", pinyin: "Fēijī kuàiyào qǐfēi le.", vietnamese: "Máy bay sắp cất cánh rồi." },
          { hanzi: "下个月我们就要毕业了。", pinyin: "Xià gè yuè wǒmen jiù yào bìyè le.", vietnamese: "Tháng sau chúng tôi sẽ tốt nghiệp rồi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l15-w1", hanzi: "新年", pinyin: "xīnnián", hanViet: "tân niên", vietnamese: "năm mới", hskLevel: 2, radical: "斤", strokeCount: 19, example: "新年快乐！", exampleTranslation: "Năm mới vui vẻ!", tags: ["Bài 15", "Ngày lễ"] },
      { id: "hsk2-l15-w2", hanzi: "快要", pinyin: "kuàiyào", hanViet: "khoái yếu", vietnamese: "sắp sửa", hskLevel: 2, radical: "忄", strokeCount: 16, example: "快要下雨了", exampleTranslation: "trời sắp mưa rồi", tags: ["Bài 15", "Phó từ"] },
      { id: "hsk2-l15-w3", hanzi: "火车站", pinyin: "huǒchēzhàn", hanViet: "hỏa xa trạm", vietnamese: "ga xe lửa, ga tàu", hskLevel: 2, radical: "火", strokeCount: 18, example: "去火车站", exampleTranslation: "đến ga tàu", tags: ["Bài 15", "Giao thông"] },
      { id: "hsk2-l15-w4", hanzi: "打算", pinyin: "dǎsuan", hanViet: "đả toán", vietnamese: "dự định, tính toán", hskLevel: 2, radical: "扌", strokeCount: 19, example: "有什么打算？", exampleTranslation: "Có dự định gì?", tags: ["Bài 15", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l15-ex1",
        type: "multiple_choice",
        question: "Điền vào chỗ trống: '明天上午十点，火车 ______ 开了。'",
        options: ["A. 就要", "B. 快要", "C. 正在", "D. 已经"],
        correctAnswer: "A. 就要",
        explanation: "Khi có mốc thời gian cụ thể (明天上午十点), phải dùng '就要……了'."
      }
    ],
    cultureBonus: {
      title: "HSK 2 结业证书寄语 (Lời chúc hoàn thành New HSK 2)",
      summary: "Chúc mừng bạn đã hoàn thành trọn vẹn 15 bài học chuẩn HSK 2!",
      content: "Với vốn 300 từ vựng và toàn bộ các bổ ngữ, câu so sánh, câu chữ 的, trợ từ động thái... bạn đã sẵn sàng tự tin chinh phục New HSK 3!"
    }
  }
];

export function getAllNewHsk2Vocabulary(): WordItem[] {
  const allVocab: WordItem[] = [];
  const seen = new Set<string>();
  for (const lesson of NEW_HSK2_FULL_LESSONS) {
    for (const word of lesson.vocabulary) {
      if (!seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        allVocab.push(word);
      }
    }
  }
  return allVocab;
}
