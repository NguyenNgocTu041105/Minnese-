import { WordItem } from '../types';
import { DetailedTextbookLesson } from './newHsk1BookData';

export const NEW_HSK3_FULL_LESSONS: DetailedTextbookLesson[] = [
  // LESSON 1
  {
    lessonNumber: 1,
    titleHanzi: "我们去机场接你们",
    titlePinyin: "Wǒmen qù jīchǎng jiē nǐmen",
    titleVietnamese: "Chúng tôi đến sân bay đón các bạn",
    pageStart: 1,
    objectives: [
      "Nghe hiểu và dùng đa tầng định ngữ để miêu tả người hoặc sự vật.",
      "Dùng '看上去 / 看起来' để miêu tả ấn tượng ngoại quan.",
      "Nắm vững cách dùng phi nghi vấn của đại từ nghi vấn (哪儿, 什么, 谁)."
    ],
    texts: [
      {
        id: "hsk3-l1-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在机场接朋友。(Đón bạn tại sân bay).",
        lines: [
          { speaker: "A", hanzi: "李文，你的行李箱是什么样的？", pinyin: "Lǐ Wén, nǐ de xínglixiāng shì shénmeyàng de?", vietnamese: "Lý Văn, vali hành lý của bạn trông như thế nào?" },
          { speaker: "B", hanzi: "是一个黑色的箱子，上面写着我的名字和电话。", pinyin: "Shì yí gè hēisè de xiāngzi, shàngmiàn xiězhe wǒ de míngzi hé diànhuà.", vietnamese: "Là một chiếc vali màu đen, bên trên có viết tên và số điện thoại của tôi." },
          { speaker: "A", hanzi: "看起来和同乐的有点儿像。", pinyin: "Kànqǐlái hé Tónglè de yǒudiǎnr xiàng.", vietnamese: "Trông có vẻ hơi giống của Đồng Lạc đấy." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l1-g1",
        title: "1. Cụm '看上去 / 看起来' (Trông có vẻ)",
        explanation: "Dùng để diễn đạt phán đoán dựa trên quan sát trực quan bên ngoài.",
        examples: [
          { hanzi: "这些菜看起来都很好吃。", pinyin: "Zhèxiē cài kànqǐlái dōu hěn hǎochī.", vietnamese: "Những món này trông có vẻ đều rất ngon." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l1-w1", hanzi: "行李箱", pinyin: "xínglixiāng", hanViet: "hành lý tương", vietnamese: "vali hành lý", hskLevel: 3, radical: "木", strokeCount: 26, example: "一个大行李箱", exampleTranslation: "một chiếc vali to", tags: ["Bài 1", "Du lịch"] },
      { id: "hsk3-l1-w2", hanzi: "接", pinyin: "jiē", hanViet: "tiếp", vietnamese: "đón, nhận (điện thoại)", hskLevel: 3, radical: "扌", strokeCount: 11, example: "去机场接人", exampleTranslation: "ra sân bay đón người", tags: ["Bài 1", "Động từ"] },
      { id: "hsk3-l1-w3", hanzi: "看起来", pinyin: "kànqǐlái", hanViet: "khán khởi lai", vietnamese: "trông có vẻ, nhìn qua", hskLevel: 3, radical: "目", strokeCount: 21, example: "看起来不错", exampleTranslation: "trông có vẻ khá tốt", tags: ["Bài 1", "Cụm từ"] }
    ],
    exercises: [
      {
        id: "hsk3-l1-ex1",
        type: "multiple_choice",
        question: "Điền từ: '这位新来的老师 ______ 很年轻。'",
        options: ["A. 看起来", "B. 听起来", "C. 拿起来", "D. 想起来"],
        correctAnswer: "A. 看起来",
        explanation: "Dựa vào ngoại hình trực quan để phán đoán ta dùng '看起来' (Trông có vẻ)."
      }
    ]
  },

  // LESSON 2
  {
    lessonNumber: 2,
    titleHanzi: "他什么时候回来",
    titlePinyin: "Tā shénme shíhou huílái",
    titleVietnamese: "Khi nào anh ấy về?",
    pageStart: 8,
    objectives: [
      "Nắm vững Bổ ngữ xu hướng đơn (Simple Directional Complement): 上来, 下去, 进来, 出去, 回来...",
      "Phân biệt '来' (hướng về người nói) và '去' (rời xa người nói).",
      "Phân biệt cách dùng '又 (yòu)' (đã lặp lại) và '再 (zài)' (sắp lặp lại)."
    ],
    texts: [
      {
        id: "hsk3-l2-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在楼下打电话。(Dưới lầu gọi điện thoại).",
        lines: [
          { speaker: "A", hanzi: "你在楼上吗？快下来吧！", pinyin: "Nǐ zài lóushàng ma? Kuài xiàlai ba!", vietnamese: "Bạn ở trên lầu à? Mau xuống đây đi!" },
          { speaker: "B", hanzi: "等我一分钟，我马上拿伞下去。", pinyin: "Děng wǒ yì fēnzhōng, wǒ mǎshàng ná sǎn xiàqù.", vietnamese: "Đợi tôi một phút, tôi mang ô xuống ngay đây." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l2-g1",
        title: "1. Bổ ngữ xu hướng đơn (Động từ + 来 / 去)",
        explanation: "Nếu hành động hướng về phía người nói thì dùng '来', rời xa người nói thì dùng '去'. Nếu có tân ngữ chỉ nơi chốn, tân ngữ phải đứng TRƯỚC 来/去 (Ví dụ: 回家去, 进房间来).",
        examples: [
          { hanzi: "你快上来吧。(Người nói ở trên lầu)", pinyin: "Nǐ kuài shànglai ba.", vietnamese: "Bạn mau lên đây đi." },
          { hanzi: "他跑进图书馆去了。", pinyin: "Tā pǎo jìn túshūguǎn qù le.", vietnamese: "Anh ấy chạy vào trong thư viện rồi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l2-w1", hanzi: "楼", pinyin: "lóu", hanViet: "lâu", vietnamese: "tòa nhà, lầu, tầng", hskLevel: 3, radical: "木", strokeCount: 13, example: "上楼 / 下楼", exampleTranslation: "lên lầu / xuống lầu", tags: ["Bài 2", "Địa điểm"] },
      { id: "hsk3-l2-w2", hanzi: "马上", pinyin: "mǎshàng", hanViet: "mã thượng", vietnamese: "ngay lập tức", hskLevel: 3, radical: "马", strokeCount: 6, example: "马上就来", exampleTranslation: "đến ngay lập tức", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk3-l2-w3", hanzi: "伞", pinyin: "sǎn", hanViet: "tản", vietnamese: "cái ô, cái dù", hskLevel: 3, radical: "人", strokeCount: 12, example: "带一把伞", exampleTranslation: "mang một chiếc ô", tags: ["Bài 2", "Đồ vật"] }
    ],
    exercises: [
      {
        id: "hsk3-l2-ex1",
        type: "multiple_choice",
        question: "Người nói đang ở trong phòng và bảo bạn vào phòng, câu chuẩn là:",
        options: ["A. 快进房间来吧！", "B. 快进房间去吧！", "C. 快来进房间吧！", "D. 快房间进来吧！"],
        correctAnswer: "A. 快进房间来吧！",
        explanation: "Người nói ở trong phòng (hướng về phía người nói) và có nơi chốn (房间) -> 进 + 房间 + 来."
      }
    ]
  },

  // LESSON 3
  {
    lessonNumber: 3,
    titleHanzi: "桌子上放着一杯咖啡",
    titlePinyin: "Zhuōzi shang fàngzhe yì bēi kāfēi",
    titleVietnamese: "Trên bàn có để một tách cà phê",
    pageStart: 15,
    objectives: [
      "Nắm vững Câu tồn hiện (Cụm từ nơi chốn + Động từ + 着 + Danh từ tân ngữ).",
      "Phân biệt '还是 (háishì)' (câu hỏi lựa chọn) và '或者 (huòzhě)' (câu trần thuật).",
      "Luyện tập miêu tả không gian quán cà phê hoặc phòng ốc."
    ],
    texts: [
      {
        id: "hsk3-l3-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在咖啡馆。(Trong quán cà phê).",
        lines: [
          { speaker: "A", hanzi: "你想喝咖啡还是茶？", pinyin: "Nǐ xiǎng hē kāfēi háishì chá?", vietnamese: "Bạn muốn uống cà phê hay là trà?" },
          { speaker: "B", hanzi: "喝咖啡吧。你看，桌子上放着一杯新鲜的咖啡呢。", pinyin: "Hē kāfēi ba. Nǐ kàn, zhuōzi shang fàngzhe yì bēi xīnxiān de kāfēi ne.", vietnamese: "Uống cà phê đi. Bạn nhìn xem, trên bàn có để một tách cà phê thơm lừng kìa." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l3-g1",
        title: "1. Câu tồn hiện với trợ từ '着'",
        explanation: "Biểu thị ở một địa điểm nào đó đang tồn tại hoặc duy trì một trạng thái của vật thể: Nơi chốn + Động từ + 着 + Tân ngữ.",
        examples: [
          { hanzi: "墙上挂着一张中国地图。", pinyin: "Qiáng shang guàzhe yì zhāng Zhōngguó dìtú.", vietnamese: "Trên tường có treo một tấm bản đồ Trung Quốc." },
          { hanzi: "门前站着一个人。", pinyin: "Mén qián zhànzhe yí gè rén.", vietnamese: "Trước cửa có một người đang đứng." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l3-w1", hanzi: "放", pinyin: "fàng", hanViet: "phóng", vietnamese: "đặt, để, thả", hskLevel: 3, radical: "攵", strokeCount: 8, example: "放在桌子上", exampleTranslation: "để trên bàn", tags: ["Bài 3", "Động từ"] },
      { id: "hsk3-l3-w2", hanzi: "咖啡", pinyin: "kāfēi", hanViet: "cà phê", vietnamese: "cà phê", hskLevel: 3, radical: "口", strokeCount: 16, example: "喝黑咖啡", exampleTranslation: "uống cà phê đen", tags: ["Bài 3", "Đồ uống"] },
      { id: "hsk3-l3-w3", hanzi: "新鲜", pinyin: "xīnxiān", hanViet: "tân tiên", vietnamese: "tươi mới, trong lành", hskLevel: 3, radical: "鱼", strokeCount: 22, example: "新鲜水果", exampleTranslation: "hoa quả tươi", tags: ["Bài 3", "Tính từ"] }
    ],
    exercises: [
      {
        id: "hsk3-l3-ex1",
        type: "multiple_choice",
        question: "Điền liên từ: '明天你去 ______ 我去都可以。'",
        options: ["A. 或者", "B. 还是", "C. 但是", "D. 所以"],
        correctAnswer: "A. 或者",
        explanation: "Trong câu trần thuật biểu thị sự lựa chọn 'hoặc là', ta dùng '或者'."
      }
    ]
  },

  // LESSON 4
  {
    lessonNumber: 4,
    titleHanzi: "她总是笑着跟客人说话",
    titlePinyin: "Tā zǒngshì xiàozhe gēn kèrén shuōhuà",
    titleVietnamese: "Cô ấy luôn cười nói với khách",
    pageStart: 22,
    objectives: [
      "Dùng cấu trúc: Động từ 1 + 着 + Động từ 2 (biểu thị phương thức hoặc hai hành động diễn ra song song).",
      "Dùng phó từ tần suất '总是 (zǒngshì)' (luôn luôn).",
      "Học các từ vựng chỉ biểu cảm và thái độ phục vụ."
    ],
    texts: [
      {
        id: "hsk3-l4-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在酒店前台。(Tại quầy lễ tân khách sạn).",
        lines: [
          { speaker: "A", hanzi: "那个服务员真热情！", pinyin: "Nàge fúwùyuán zhēn rèqíng!", vietnamese: "Nhân viên phục vụ kia thật nhiệt tình!" },
          { speaker: "B", hanzi: "是啊，她总是笑着跟客人说话，大家都喜欢她。", pinyin: "Shì a, tā zǒngshì xiàozhe gēn kèrén shuōhuà, dàjiā dōu xǐhuan tā.", vietnamese: "Đúng vậy, cô ấy luôn cười khi nói chuyện với khách, ai cũng quý mến cô ấy." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l4-g1",
        title: "1. Cấu trúc: V1 + 着 + V2 (Phương thức thực hiện)",
        explanation: "Động tác 1 (kèm 着) biểu thị tư thế, phương thức hoặc trạng thái mà qua đó động tác 2 được tiến hành.",
        examples: [
          { hanzi: "他站着听老师讲课。", pinyin: "Tā zhànzhe tīng lǎoshī jiǎngkè.", vietnamese: "Anh ấy đứng nghe cô giáo giảng bài." },
          { hanzi: "弟弟常常躺着看书。", pinyin: "Dìdi chángcháng tǎngzhe kàn shū.", vietnamese: "Em trai thường nằm đọc sách." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l4-w1", hanzi: "总是", pinyin: "zǒngshì", hanViet: "tổng thị", vietnamese: "luôn luôn, lúc nào cũng", hskLevel: 3, radical: "心", strokeCount: 18, example: "总是迟到", exampleTranslation: "luôn luôn đến muộn", tags: ["Bài 4", "Phó từ"] },
      { id: "hsk3-l4-w2", hanzi: "笑", pinyin: "xiào", hanViet: "tiếu", vietnamese: "cười", hskLevel: 3, radical: "竹", strokeCount: 10, example: "笑着说", exampleTranslation: "cười nói", tags: ["Bài 4", "Động từ"] },
      { id: "hsk3-l4-w3", hanzi: "客人", pinyin: "kèrén", hanViet: "khách nhân", vietnamese: "khách, khách hàng", hskLevel: 3, radical: "宀", strokeCount: 11, example: "接待客人", exampleTranslation: "tiếp đón khách", tags: ["Bài 4", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk3-l4-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Bọn trẻ vừa cười vừa chạy vào trong sân.'",
        options: [
          "A. 孩子们笑着跑进了院子。",
          "B. 孩子们跑着笑进了院子。",
          "C. 孩子们笑跑进院子了。",
          "D. 孩子们院子笑着跑进。"
        ],
        correctAnswer: "A. 孩子们笑着跑进了院子。",
        explanation: "Phương thức là cười (笑着), động tác chính là chạy (跑进)."
      }
    ]
  },

  // LESSON 5
  {
    lessonNumber: 5,
    titleHanzi: "我最近越来越胖了",
    titlePinyin: "Wǒ zuìjìn yuè lái yuè pàng le",
    titleVietnamese: "Gần đây tôi ngày càng béo lên",
    pageStart: 29,
    objectives: [
      "Dùng cấu trúc '越来越……' (ngày càng...) biểu thị sự biến đổi theo thời gian.",
      "Dùng cấu trúc tương quan '越 A 越 B' (càng A càng B).",
      "Phân biệt phó từ '刚 (gāng)' và danh từ thời gian '刚才 (gāngcái)'."
    ],
    texts: [
      {
        id: "hsk3-l5-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在试衣间。(Trong phòng thử đồ).",
        lines: [
          { speaker: "A", hanzi: "这条裤子你怎么穿不下了？", pinyin: "Zhè tiáo kùzi nǐ zěnme chuānbuxià le?", vietnamese: "Chiếc quần này sao bạn mặc không vừa nữa rồi?" },
          { speaker: "B", hanzi: "我最近越来越胖了，每天都吃甜食。", pinyin: "Wǒ zuìjìn yuè lái yuè pàng le, měitiān dōu chī tiánshí.", vietnamese: "Gần đây tôi ngày càng béo lên, ngày nào cũng ăn đồ ngọt." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l5-g1",
        title: "1. Cấu trúc '越来越 + Tính từ / Động từ'",
        explanation: "Biểu thị mức độ biến đổi tăng dần theo thời gian. Phía sau KHÔNG được thêm các phó từ chỉ mức độ như '很', '非常'.",
        examples: [
          { hanzi: "天气越来越冷了。", pinyin: "Tiānqì yuè lái yuè lěng le.", vietnamese: "Thời tiết ngày càng lạnh rồi." },
          { hanzi: "我的中文越来越流利了。", pinyin: "Wǒ de Zhōngwén yuè lái yuè liúlì le.", vietnamese: "Tiếng Trung của tôi ngày càng trôi chảy rồi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l5-w1", hanzi: "越来越", pinyin: "yuè lái yuè", hanViet: "việt lai việt", vietnamese: "ngày càng...", hskLevel: 3, radical: "走", strokeCount: 23, example: "越来越好", exampleTranslation: "ngày càng tốt", tags: ["Bài 5", "Cấu trúc"] },
      { id: "hsk3-l5-w2", hanzi: "胖", pinyin: "pàng", hanViet: "bàng", vietnamese: "béo, mập", hskLevel: 3, radical: "月", strokeCount: 9, example: "长胖了", exampleTranslation: "béo lên rồi", tags: ["Bài 5", "Tính từ"] },
      { id: "hsk3-l5-w3", hanzi: "最近", pinyin: "zuìjìn", hanViet: "tối cận", vietnamese: "dạo này, gần đây", hskLevel: 3, radical: "日", strokeCount: 19, example: "最近忙吗？", exampleTranslation: "Dạo này bận không?", tags: ["Bài 5", "Thời gian"] }
    ],
    exercises: [
      {
        id: "hsk3-l5-ex1",
        type: "multiple_choice",
        question: "Chọn câu viết chuẩn ngữ pháp nhất:",
        options: [
          "A. 他的汉语越来越好。",
          "B. 他的汉语越来越很好。",
          "C. 他的汉语很越来越好。",
          "D. 他的汉语越来越非常流利。"
        ],
        correctAnswer: "A. 他的汉语越来越好。",
        explanation: "Sau '越来越' không được dùng các phó từ chỉ mức độ như '很', '非常'."
      }
    ]
  },

  // LESSON 6
  {
    lessonNumber: 6,
    titleHanzi: "怎么突然找不到了",
    titlePinyin: "Zěnme tūrán zhǎobudào le",
    titleVietnamese: "Sao đột nhiên lại không tìm thấy?",
    pageStart: 36,
    objectives: [
      "Nắm vững Bổ ngữ khả năng (Potential Complement): V + 得 / 不 + Bổ ngữ (看得懂 / 看不懂, 找得到 / 找不到).",
      "Dùng '突然 (tūrán)' chỉ sự việc bất ngờ, đột ngột.",
      "Luyện tập xử lý các tình huống khẩn cấp, mất đồ."
    ],
    texts: [
      {
        id: "hsk3-l6-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在客厅找眼镜。(Tìm kính mắt ở phòng khách).",
        lines: [
          { speaker: "A", hanzi: "我的眼镜刚才还在这里，怎么突然找不到了？", pinyin: "Wǒ de yǎnjìng gāngcái hái zài zhèlǐ, zěnme tūrán zhǎobudào le?", vietnamese: "Kính của tôi vừa nãy còn ở đây, sao đột nhiên không tìm thấy nữa rồi?" },
          { speaker: "B", hanzi: "你离得太远了，看不清楚吧？", pinyin: "Nǐ lí de tài yuǎn le, kànbuqīngchu ba?", vietnamese: "Bạn đứng xa quá, nhìn không rõ đúng không?" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l6-g1",
        title: "1. Bổ ngữ khả năng (V + 得 / 不 + Kết quả/Xu hướng)",
        explanation: "Khẳng định: V + 得 + Bổ ngữ (Làm được). Phủ định: V + 不 + Bổ ngữ (Không làm được).",
        examples: [
          { hanzi: "你能听得懂吗？ - 听不懂。", pinyin: "Nǐ néng tīngdedǒng ma? - Tīngbudǒng.", vietnamese: "Bạn có nghe hiểu được không? - Nghe không hiểu." },
          { hanzi: "作业太多，我做不完。", pinyin: "Zuòyè tài duō, wǒ zuòbuwán.", vietnamese: "Bài tập nhiều quá, tôi không làm hết nổi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l6-w1", hanzi: "突然", pinyin: "tūrán", hanViet: "đột nhiên", vietnamese: "đột nhiên, bất ngờ", hskLevel: 3, radical: "穴", strokeCount: 16, example: "突然下雨", exampleTranslation: "đột nhiên đổ mưa", tags: ["Bài 6", "Phó từ"] },
      { id: "hsk3-l6-w2", hanzi: "清楚", pinyin: "qīngchu", hanViet: "thanh sở", vietnamese: "rõ ràng, rành mạch", hskLevel: 3, radical: "氵", strokeCount: 24, example: "看清楚", exampleTranslation: "nhìn rõ ràng", tags: ["Bài 6", "Tính từ"] },
      { id: "hsk3-l6-w3", hanzi: "眼镜", pinyin: "yǎnjìng", hanViet: "nhãn kính", vietnamese: "kính mắt", hskLevel: 3, radical: "目", strokeCount: 22, example: "一副眼镜", exampleTranslation: "một chiếc kính mắt", tags: ["Bài 6", "Đồ vật"] }
    ],
    exercises: [
      {
        id: "hsk3-l6-ex1",
        type: "multiple_choice",
        question: "Muốn nói 'Chữ này viết nhỏ quá, tôi nhìn không rõ', ta dùng:",
        options: ["A. 我看不清楚", "B. 我没看清楚", "C. 我看不懂", "D. 我没看懂"],
        correctAnswer: "A. 我看不清楚",
        explanation: "Bổ ngữ khả năng phủ định biểu thị không đủ khả năng nhìn rõ là '看不清楚'."
      }
    ]
  },

  // LESSON 7
  {
    lessonNumber: 7,
    titleHanzi: "我跟你一起去",
    titlePinyin: "Wǒ gēn nǐ yìqǐ qù",
    titleVietnamese: "Tôi đi cùng với bạn",
    pageStart: 43,
    objectives: [
      "Dùng trợ từ kết cấu '地 (de)' đặt sau tính từ/phó từ làm trạng ngữ bổ nghĩa cho động từ.",
      "Dùng cấu trúc liên kết '跟 / 和……一起'.",
      "Luyện tập lên kế hoạch giải trí cuối tuần cùng bạn bè."
    ],
    texts: [
      {
        id: "hsk3-l7-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在图书馆门前。(Trước cửa thư viện).",
        lines: [
          { speaker: "A", hanzi: "你打算去超市买东西吗？", pinyin: "Nǐ dǎsuan qù chāoshì mǎi dōngxi ma?", vietnamese: "Bạn dự định đi siêu thị mua đồ à?" },
          { speaker: "B", hanzi: "对，你要一起去吗？", pinyin: "Duì, nǐ yào yìqǐ qù ma?", vietnamese: "Đúng vậy, bạn muốn đi cùng không?" },
          { speaker: "A", hanzi: "好啊，我跟你一起去，我们高高兴兴地去吧！", pinyin: "Hǎo a, wǒ gēn nǐ yìqǐ qù, wǒmen gāogāoxìngxìng de qù ba!", vietnamese: "Được thôi, tôi đi cùng bạn, tụi mình vui vẻ cùng đi nào!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l7-g1",
        title: "1. Trợ từ kết cấu '地' (Trạng ngữ + 地 + Động từ)",
        explanation: "Đặt giữa tính từ (thường lặp lại hoặc có phó từ) và động từ để miêu tả cách thức hành động diễn ra.",
        examples: [
          { hanzi: "他快快地跑了过来。", pinyin: "Tā kuàikuài de pǎo le guòlai.", vietnamese: "Anh ấy chạy nhanh sang đây." },
          { hanzi: "大家认真地听老师讲课。", pinyin: "Dàjiā rènzhēn de tīng lǎoshī jiǎngkè.", vietnamese: "Mọi người chăm chú lắng nghe cô giáo giảng bài." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l7-w1", hanzi: "地", pinyin: "de", hanViet: "địa", vietnamese: "trợ từ tạo trạng ngữ (một cách...)", hskLevel: 3, radical: "土", strokeCount: 6, example: "慢慢地走", exampleTranslation: "đi một cách từ từ", tags: ["Bài 7", "Trợ từ"] },
      { id: "hsk3-l7-w2", hanzi: "超市", pinyin: "chāoshì", hanViet: "siêu thị", vietnamese: "siêu thị", hskLevel: 3, radical: "走", strokeCount: 17, example: "逛超市", exampleTranslation: "đi dạo siêu thị", tags: ["Bài 7", "Địa điểm"] },
      { id: "hsk3-l7-w3", hanzi: "认真", pinyin: "rènzhēn", hanViet: "nhận chân", vietnamese: "chăm chỉ, nghiêm túc", hskLevel: 3, radical: "讠", strokeCount: 14, example: "认真学习", exampleTranslation: "chăm chỉ học tập", tags: ["Bài 7", "Tính từ"] }
    ],
    exercises: [
      {
        id: "hsk3-l7-ex1",
        type: "multiple_choice",
        question: "Phân biệt 3 trợ từ '的, 得, 地': '学生们认真 ______ 听课。'",
        options: ["A. 的", "B. 得", "C. 地", "D. 了"],
        correctAnswer: "C. 地",
        explanation: "Trước động từ (听课), sau tính từ trạng thái (认真) bắt buộc dùng '地'."
      }
    ]
  },

  // LESSON 8
  {
    lessonNumber: 8,
    titleHanzi: "你去哪儿我就去哪儿",
    titlePinyin: "Nǐ qù nǎr wǒ jiù qù nǎr",
    titleVietnamese: "Bạn đi đâu tôi đi đó",
    pageStart: 50,
    objectives: [
      "Nắm vững Đại từ nghi vấn dùng tương ứng vô điều kiện: …… Đại từ …… 就 …… Đại từ.",
      "Dùng '只要……就……' biểu thị điều kiện đủ.",
      "Luyện tập giao tiếp thể hiện sự đồng thuận, gắn kết tình cảm."
    ],
    texts: [
      {
        id: "hsk3-l8-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在家里商量吃什么。(Ở nhà bàn chuyện ăn gì).",
        lines: [
          { speaker: "A", hanzi: "今天晚上我们吃什么？", pinyin: "Jīntiān wǎnshang wǒmen chī shénme?", vietnamese: "Tối nay chúng ta ăn món gì nhỉ?" },
          { speaker: "B", hanzi: "你想吃什么我就吃什么。", pinyin: "Nǐ xiǎng chī shénme wǒ jiù chī shénme.", vietnamese: "Bạn muốn ăn gì thì tôi ăn món đó." },
          { speaker: "A", hanzi: "那我们去吃火锅吧！", pinyin: "Nà wǒmen qù chī huǒguō ba!", vietnamese: "Vậy tụi mình đi ăn lẩu nhé!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l8-g1",
        title: "1. Đại từ nghi vấn dùng tương ứng: '…… nghi vấn …… 就 …… nghi vấn'",
        explanation: "Đại từ nghi vấn (什么, 哪儿, 谁, 怎么) xuất hiện 2 lần trong 2 phân câu để biểu thị sự phụ thuộc hoặc tương ứng hoàn toàn.",
        examples: [
          { hanzi: "你怎么说，我就怎么做。", pinyin: "Nǐ zěnme shuō, wǒ jiù zěnme zuò.", vietnamese: "Bạn bảo sao thì tôi làm vậy." },
          { hanzi: "谁赢了，谁就请客。", pinyin: "Shéi yíng le, shéi jiù qǐngkè.", vietnamese: "Ai thắng thì người đó khao." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l8-w1", hanzi: "火锅", pinyin: "huǒguō", hanViet: "hỏa oa", vietnamese: "lẩu, món lẩu", hskLevel: 3, radical: "火", strokeCount: 15, example: "吃四川火锅", exampleTranslation: "ăn lẩu Tứ Xuyên", tags: ["Bài 8", "Ẩm thực"] },
      { id: "hsk3-l8-w2", hanzi: "只要", pinyin: "zhǐyào", hanViet: "chỉ yếu", vietnamese: "chỉ cần", hskLevel: 3, radical: "口", strokeCount: 14, example: "只要努力", exampleTranslation: "chỉ cần nỗ lực", tags: ["Bài 8", "Liên từ"] }
    ],
    exercises: [
      {
        id: "hsk3-l8-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Cái gì ngon thì tôi mua cái đó.'",
        options: [
          "A. 什么好吃我就买什么。",
          "B. 我买什么就什么好吃。",
          "C. 好吃什么我就买什么。",
          "D. 什么我买就什么好吃。"
        ],
        correctAnswer: "A. 什么好吃我就买什么。",
        explanation: "Cấu trúc tương ứng chuẩn: 什么 + Tính từ + 就 + Động từ + 什么."
      }
    ]
  },

  // LESSON 9
  {
    lessonNumber: 9,
    titleHanzi: "她的汉语说得跟中国人一样好",
    titlePinyin: "Tā de Hànyǔ shuō de gēn Zhōngguórén yíyàng hǎo",
    titleVietnamese: "Tiếng Trung của cô ấy nói hay như người Trung Quốc",
    pageStart: 57,
    objectives: [
      "Dùng cấu trúc so sánh ngang bằng: A 跟 / 和 B 一样 (+ Tính từ / Động từ).",
      "Thể phủ định so sánh ngang bằng: A 跟 B 不一样.",
      "Khen ngợi trình độ ngoại ngữ và kỹ năng của người khác."
    ],
    texts: [
      {
        id: "hsk3-l9-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "谈论中文水平。(Nói về trình độ tiếng Trung).",
        lines: [
          { speaker: "A", hanzi: "你听，玛丽的中文发音真标准！", pinyin: "Nǐ tīng, Mǎlì de Zhōngwén fāyīn zhēn biāozhǔn!", vietnamese: "Bạn nghe kìa, phát âm tiếng Trung của Mary thật chuẩn!" },
          { speaker: "B", hanzi: "是啊，她的汉语说得跟中国人一样好。", pinyin: "Shì a, tā de Hànyǔ shuō de gēn Zhōngguórén yíyàng hǎo.", vietnamese: "Đúng vậy, tiếng Trung của cô ấy nói hay hệt như người Trung Quốc." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l9-g1",
        title: "1. Cấu trúc so sánh ngang bằng: 'A 跟 B 一样 (+ Tính từ)'",
        explanation: "Biểu thị sự đồng nhất hoặc ngang bằng về đặc điểm, tính chất giữa A và B.",
        examples: [
          { hanzi: "我跟你一样高。", pinyin: "Wǒ gēn nǐ yíyàng gāo.", vietnamese: "Tôi cao bằng bạn." },
          { hanzi: "这件衣服跟那件颜色不一样。", pinyin: "Zhè jiàn yīfu gēn nà jiàn yánsè bù yíyàng.", vietnamese: "Chiếc áo này có màu sắc không giống chiếc kia." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l9-w1", hanzi: "一样", pinyin: "yíyàng", hanViet: "nhất dạng", vietnamese: "giống nhau, như nhau", hskLevel: 3, radical: "一", strokeCount: 16, example: "跟……一样", exampleTranslation: "giống như...", tags: ["Bài 9", "So sánh"] },
      { id: "hsk3-l9-w2", hanzi: "标准", pinyin: "biāozhǔn", hanViet: "tiêu chuẩn", vietnamese: "tiêu chuẩn, chuẩn mực", hskLevel: 3, radical: "木", strokeCount: 13, example: "发音很标准", exampleTranslation: "phát âm rất chuẩn", tags: ["Bài 9", "Tính từ"] }
    ],
    exercises: [
      {
        id: "hsk3-l9-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Quyển sách này dày bằng quyển sách kia.'",
        options: [
          "A. 这本书跟那本书一样厚。",
          "B. 这本书跟那本书厚一样。",
          "C. 这本书一样跟那本书厚。",
          "D. 这本书比那本书一样厚。"
        ],
        correctAnswer: "A. 这本书跟那本书一样厚。",
        explanation: "Cấu trúc: A 跟 B 一样 + Tính từ (厚 - dày)."
      }
    ]
  },

  // LESSON 10
  {
    lessonNumber: 10,
    titleHanzi: "请把空调关上",
    titlePinyin: "Qǐng bǎ kōngtiáo guānshang",
    titleVietnamese: "Xin hãy tắt máy điều hòa",
    pageStart: 64,
    objectives: [
      "Nắm vững Câu chữ '把 (bǎ)' (Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác/Bổ ngữ).",
      "Hiểu bản chất của câu chữ 把: Tác động làm thay đổi vị trí, trạng thái của đối tượng đã xác định.",
      "Luyện tập đưa ra yêu cầu lịch sự trong văn phòng và nơi công cộng."
    ],
    texts: [
      {
        id: "hsk3-l10-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "离开教室前。(Trước khi rời khỏi lớp học).",
        lines: [
          { speaker: "A", hanzi: "我们要离开了，请把灯和空调关上。", pinyin: "Wǒmen yào líkāi le, qǐng bǎ dēng hé kōngtiáo guānshang.", vietnamese: "Chúng ta sắp rời đi rồi, xin hãy tắt đèn và điều hòa." },
          { speaker: "B", hanzi: "好的，我已经把窗户关好了。", pinyin: "Hǎo de, wǒ yǐjīng bǎ chuānghu guānhǎo le.", vietnamese: "Được rồi, tôi đã đóng chặt cửa sổ rồi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk3-l10-g1",
        title: "1. Câu chữ '把' (Ba Construction)",
        explanation: "Cấu trúc cơ bản: Chủ ngữ + (没/别/想) + 把 + Đối tượng xác định + Động từ + Thành phần khác (Bổ ngữ / 了 / Trùng điệp). Động từ trong câu chữ 把 không bao giờ đứng đơn độc.",
        examples: [
          { hanzi: "请把书放在桌子上。", pinyin: "Qǐng bǎ shū fàng zài zhuōzi shang.", vietnamese: "Xin hãy đặt sách lên trên bàn." },
          { hanzi: "我把衣服洗干净了。", pinyin: "Wǒ bǎ yīfu xǐ gānjìng le.", vietnamese: "Tôi đã giặt sạch quần áo rồi." },
          { hanzi: "别把钥匙忘了！", pinyin: "Bié bǎ yàoshi wàng le!", vietnamese: "Đừng để quên chìa khóa nhé!" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk3-l10-w1", hanzi: "把", pinyin: "bǎ", hanViet: "bả", vietnamese: "giới từ chữ 把, lượng từ chiếc/cái", hskLevel: 3, radical: "扌", strokeCount: 7, example: "一把伞 / 把门关上", exampleTranslation: "một chiếc ô / đóng cửa lại", tags: ["Bài 10", "Ngữ pháp"] },
      { id: "hsk3-l10-w2", hanzi: "空调", pinyin: "kōngtiáo", hanViet: "không điều", vietnamese: "máy điều hòa nhiệt độ", hskLevel: 3, radical: "穴", strokeCount: 18, example: "开空调", exampleTranslation: "bật điều hòa", tags: ["Bài 10", "Thiết bị"] },
      { id: "hsk3-l10-w3", hanzi: "关", pinyin: "guān", hanViet: "quan", vietnamese: "đóng, tắt", hskLevel: 3, radical: "丷", strokeCount: 6, example: "关门 / 关灯", exampleTranslation: "đóng cửa / tắt đèn", tags: ["Bài 10", "Động từ"] },
      { id: "hsk3-l10-w4", hanzi: "灯", pinyin: "dēng", hanViet: "đăng", vietnamese: "cái đèn", hskLevel: 3, radical: "火", strokeCount: 6, example: "开灯", exampleTranslation: "bật đèn", tags: ["Bài 10", "Đồ vật"] }
    ],
    exercises: [
      {
        id: "hsk3-l10-ex1",
        type: "multiple_choice",
        question: "Chọn câu chữ '把' đúng ngữ pháp nhất:",
        options: [
          "A. 我把衣服洗干净了。",
          "B. 我洗把衣服干净了。",
          "C. 我把衣服洗。",
          "D. 我把干净洗衣服了。"
        ],
        correctAnswer: "A. 我把衣服洗干净了。",
        explanation: "Cấu trúc chuẩn: Chủ ngữ (我) + 把 + Đối tượng (衣服) + Động từ (洗) + Bổ ngữ kết quả (干净) + 了."
      }
    ],
    cultureBonus: {
      title: "HSK 3 结业寄语 (Lời chúc tốt nghiệp HSK 3)",
      summary: "Chúc mừng bạn đã chinh phục thành công 10 bài học trọng điểm HSK 3!",
      content: "Bạn đã làm chủ câu chữ 把, các bổ ngữ xu hướng/khả năng, so sánh ngang bằng và hơn 600 từ vựng cốt lõi. Đây là bệ phóng vững chắc để bạn tiếp tục tự tin bước vào cấp độ Trung cấp HSK 4!"
    }
  }
];

export function getAllNewHsk3Vocabulary(): WordItem[] {
  const allVocab: WordItem[] = [];
  const seen = new Set<string>();
  for (const lesson of NEW_HSK3_FULL_LESSONS) {
    for (const word of lesson.vocabulary) {
      if (!seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        allVocab.push(word);
      }
    }
  }
  return allVocab;
}
