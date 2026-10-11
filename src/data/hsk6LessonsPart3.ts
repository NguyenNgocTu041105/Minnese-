import { DetailedTextbookLesson } from './newHsk1BookData';

export const HSK6_LESSONS_PART3: DetailedTextbookLesson[] = [
  // LESSON 6: 喝着茶，聊着天 (Uống trà đàm đạo)
  {
    lessonNumber: 6,
    titleHanzi: "喝着茶，聊着天",
    titlePinyin: "Hēzhe chá, liáozhe tiān",
    titleVietnamese: "Uống trà, đàm đạo",
    pageStart: 66,
    objectives: [
      "Vận dụng thành ngữ và cụm từ '津津有味' miêu tả việc thưởng thức một cách say mê.",
      "Vận dụng ngữ pháp '与其……不如……' biểu thị sự so sánh lựa chọn.",
      "Hiểu sâu về nghệ thuật và văn hóa trà đạo Trung Hoa (茶文化)."
    ],
    texts: [
      {
        id: "hsk6-l6-t1",
        title: "课文: 喝着茶，聊着天 (740 字)",
        context: "Trang 67-68: Nét đẹp văn hóa thưởng trà tĩnh tại của người phương Đông giữa cuộc sống hiện đại tất bật.",
        lines: [
          { speaker: "讲述人", hanzi: "中国是茶的故乡，茶不仅是一种饮品，更是一种生活艺术。自古以来，文人墨客无不借茶抒情，以茶会友。沏一壶好茶，看着茶叶在沸水中翻滚、舒展，那淡淡的清香便在屋里弥漫开来。", pinyin: "Zhōngguó shì chá de gùxiāng, chá bùjǐn shì yì zhǒng yǐnpǐn, gèng shì yì zhǒng shēnghuó yìshù. Zìgǔ-yǐlái, wénrén-mòkè wúbù jiè chá shūqíng, yǐ chá huì yǒu. Qī yì hú hǎo chá, kànzhe cháyè zài fèishuǐ zhōng fāngǔn, shūzhǎn, nà dàndàn de qīngxiāng biàn zài wū lǐ mímàn kāi lái.", vietnamese: "Trung Quốc là quê hương của trà, trà không chỉ là một thức uống, mà còn là một nghệ thuật sống. Tự cổ chí kim, văn nhân mặc khách ai nấy đều mượn trà bày tỏ tâm tình, lấy trà kết giao bằng hữu. Pha một ấm trà ngon, ngắm nhìn từng búp trà cuộn trào, bung nở trong làn nước sôi, hương thơm thanh khiết thoang thoảng lan tỏa khắp gian phòng." },
          { speaker: "讲述人", hanzi: "几个好友围坐在一起，细细品味茶汤的甘甜与苦涩，彼此畅所欲言，不觉时光流逝。与其在繁杂喧嚣的都市中奔波疲惫，不如偷得浮生半日闲，喝着茶，聊着天，在宁静中找寻内心的安宁。", pinyin: "Jǐ ge hǎoyǒu wéizuò zài yìqǐ, xìxì pǐnwèi chátāng de gāntián yǔ kǔsè, bǐcǐ chàngsuǒyùyán, bù jué shíguāng liúshì. Yǔqí zài fánzá xuānxiāo de dūshì zhōng bēnbō píbèi, bùrú tōudé fúshēng bàn rì xián, hēzhe chá, liáozhe tiān, zài níngjìng zhōng zhǎoxún nèixīn de ānníng.", vietnamese: "Vài người bạn thân quây quần bên nhau, nhâm nhi thưởng thức vị ngọt hậu pha lẫn chút đắng chát của nước trà, cởi mở giãi bày tâm sự, chẳng màng thời gian trôi. So với việc mải miết ngược xuôi mệt nhoài giữa phố thị ồn ào, chi bằng trộm chút thảnh thơi giữa cuộc đời bận rộn, vừa nhâm nhi chén trà vừa chuyện trò rôm rả, tìm lại sự an yên trong tâm hồn." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk6-l6-g1",
        title: "1. Thành ngữ '津津有味' (Say sưa, ngon lành, thích thú)",
        explanation: "Miêu tả ăn uống ngon miệng hoặc đọc sách, trò chuyện một cách hứng thú say mê.",
        examples: [
          { hanzi: "大家一边喝茶，一边津津有味地聊着家常。", pinyin: "Dàjiā yìbiān hē chá, yìbiān jīnjīn-yǒuwèi de liáozhe jiācháng.", vietnamese: "Mọi người vừa uống trà vừa say sưa nói chuyện gia đình thường nhật." }
        ]
      },
      {
        id: "hsk6-l6-g2",
        title: "2. Cấu trúc '与其……不如……' (Chi bằng, thà... còn hơn)",
        explanation: "Biểu thị sự lựa chọn giữa hai phương án, người nói nghiêng về phương án sau.",
        examples: [
          { hanzi: "与其在家里发呆，不如出去散散步。", pinyin: "Yǔqí zài jiā lǐ fādāi, bùrú chūqu sànsàn bù.", vietnamese: "Thà ra ngoài đi dạo còn hơn ngồi ngẩn ngơ ở nhà." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk6-l6-w1", hanzi: "沏", pinyin: "qī", hanViet: "thê", vietnamese: "pha (trà, cà phê)", hskLevel: 6, partOfSpeech: "đgt.", radical: "氵", strokeCount: 7, example: "沏茶", exampleTranslation: "pha trà", tags: ["Bài 6", "Động từ"] },
      { id: "hsk6-l6-w2", hanzi: "弥漫", pinyin: "mímàn", hanViet: "di mạn", vietnamese: "lan tỏa, tràn ngập (hương thơm, khói)", hskLevel: 6, partOfSpeech: "đgt.", radical: "氵", strokeCount: 20, example: "香气弥漫", exampleTranslation: "hương thơm lan tỏa", tags: ["Bài 6", "Động từ"] },
      { id: "hsk6-l6-w3", hanzi: "甘甜", pinyin: "gāntián", hanViet: "cam điềm", vietnamese: "ngọt lịm, ngọt ngào thanh mát", hskLevel: 6, partOfSpeech: "tt.", radical: "甘", strokeCount: 16, example: "清澈甘甜", exampleTranslation: "trong trẻo ngọt mát", tags: ["Bài 6", "Tính từ"] },
      { id: "hsk6-l6-w4", hanzi: "苦涩", pinyin: "kǔsè", hanViet: "khổ sáp", vietnamese: "đắng chát", hskLevel: 6, partOfSpeech: "tt.", radical: "艹", strokeCount: 22, example: "茶味苦涩", exampleTranslation: "vị trà đắng chát", tags: ["Bài 6", "Tính từ"] },
      { id: "hsk6-l6-w5", hanzi: "畅所欲言", pinyin: "chàngsuǒ-yùyán", hanViet: "sướng sở dục ngôn", vietnamese: "nói hết những gì muốn nói, cởi mở giãi bày", hskLevel: 6, partOfSpeech: "thành ngữ", radical: "申", strokeCount: 27, example: "大家畅所欲言", exampleTranslation: "mọi người tự do phát biểu ý kiến", tags: ["Bài 6", "Thành ngữ"] }
    ],
    exercises: [
      {
        id: "hsk6-l6-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '他正______地读着一本历史小说。'",
        options: ["A. 津津有味", "B. 滔滔不绝", "C. 迫不及待", "D. 小心翼翼"],
        correctAnswer: "A. 津津有味",
        explanation: "'津津有味' dùng để miêu tả đọc sách hoặc thưởng thức một cách vô cùng say sưa thích thú."
      }
    ]
  }
];
