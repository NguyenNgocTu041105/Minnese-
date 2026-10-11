import { WordItem } from '../types';

export interface DialogueLine {
  speaker: string;
  avatar?: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface LessonText {
  id: string;
  title: string;
  context: string;
  lines: DialogueLine[];
}

export interface GrammarPoint {
  id: string;
  title: string;
  explanation: string;
  examples: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  }[];
  tip?: string;
}

export type ExerciseType =
  | 'fill_blank'
  | 'multiple_choice'
  | 'sentence_scramble'
  | 'translation'
  | 'dialogue_match'
  | 'error_spotting';

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  question: string;
  hanziPrompt?: string;
  pinyinPrompt?: string;
  vietnamesePrompt?: string;
  options: string[];
  scrambleSegments?: string[];
  correctAnswer: string;
  explanation: string;
  grammarFocus?: string;
  audioText?: string;
}

export interface TongueTwister {
  title: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface CultureBonus {
  title: string;
  summary: string;
  content: string;
}

export interface DetailedTextbookLesson {
  lessonNumber: number;
  titleHanzi: string;
  titlePinyin: string;
  titleVietnamese: string;
  pageStart: number;
  objectives: string[];
  texts: LessonText[];
  grammarPoints: GrammarPoint[];
  vocabulary: WordItem[];
  exercises: ExerciseItem[];
  tongueTwister?: TongueTwister;
  cultureBonus?: CultureBonus;
}

export const NEW_HSK1_FULL_LESSONS: DetailedTextbookLesson[] = [
  // LESSON 1
  {
    lessonNumber: 1,
    titleHanzi: "你好",
    titlePinyin: "Nǐ hǎo",
    titleVietnamese: "Xin chào",
    pageStart: 1,
    objectives: [
      "Nghe hiểu và dùng các biểu đạt lễ phép: chào hỏi, cảm ơn, cáo biệt.",
      "Hiểu nghi thức giao tiếp tiếng Trung, dùng đại từ xưng hô tôn kính '您 (nín)'."
    ],
    texts: [
      {
        id: "hsk1-l1-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在教室里，两个朋友互相打招呼。(Trong lớp học, hai người bạn chào nhau).",
        lines: [
          { speaker: "A", hanzi: "你好！", pinyin: "Nǐ hǎo!", vietnamese: "Chào bạn!" },
          { speaker: "B", hanzi: "你好！", pinyin: "Nǐ hǎo!", vietnamese: "Chào bạn!" }
        ]
      },
      {
        id: "hsk1-l1-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在办公室，学生向老师问好。(Trong văn phòng, học sinh chào cô giáo).",
        lines: [
          { speaker: "学生 (Học sinh)", hanzi: "老师，您好！", pinyin: "Lǎoshī, nín hǎo!", vietnamese: "Chúng em kính chào cô giáo ạ!" },
          { speaker: "老师 (Cô giáo)", hanzi: "你们好！", pinyin: "Nǐmen hǎo!", vietnamese: "Chào các em!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l1-g1",
        title: "1. Câu chào hỏi '你好' và '您好'",
        explanation: "'你好' dùng để chào bạn bè, người cùng trang lứa. '您好' dùng '您 (nín)' thể hiện sự tôn trọng với thầy cô, người lớn tuổi.",
        examples: [
          { hanzi: "你好！", pinyin: "Nǐ hǎo!", vietnamese: "Chào bạn!" },
          { hanzi: "老师，您好！", pinyin: "Lǎoshī, nín hǎo!", vietnamese: "Chào cô giáo ạ!" }
        ]
      },
      {
        id: "hsk1-l1-g2",
        title: "2. Quy tắc biến điệu hai thanh 3 (Tone Sandhi)",
        explanation: "Khi hai thanh 3 đi liền nhau (như 'nǐ' + 'hǎo'), thanh 3 thứ nhất sẽ phát âm biến thành thanh 2 ('ní hǎo').",
        examples: [
          { hanzi: "你好", pinyin: "nǐ + hǎo -> ní hǎo", vietnamese: "Xin chào" },
          { hanzi: "可以", pinyin: "kě + yǐ -> ké yǐ", vietnamese: "Có thể" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l1-w1", hanzi: "你", pinyin: "nǐ", hanViet: "nhĩ", vietnamese: "bạn, anh, chị", hskLevel: 1, radical: "亻", strokeCount: 7, example: "你好！", exampleTranslation: "Chào bạn!", tags: ["Bài 1", "Đại từ"] },
      { id: "hsk1-l1-w2", hanzi: "好", pinyin: "hǎo", hanViet: "hảo", vietnamese: "tốt, đẹp, khỏe", hskLevel: 1, radical: "女", strokeCount: 6, example: "很好。", exampleTranslation: "Rất tốt.", tags: ["Bài 1", "Tính từ"] },
      { id: "hsk1-l1-w3", hanzi: "您", pinyin: "nín", hanViet: "nẫm", vietnamese: "ông, ngài (kính ngữ của 你)", hskLevel: 1, radical: "心", strokeCount: 11, example: "您好！", exampleTranslation: "Kính chào ngài!", tags: ["Bài 1", "Kính ngữ"] },
      { id: "hsk1-l1-w4", hanzi: "你们", pinyin: "nǐmen", hanViet: "nhĩ môn", vietnamese: "các bạn", hskLevel: 1, radical: "亻", strokeCount: 9, example: "你们好！", exampleTranslation: "Chào các bạn!", tags: ["Bài 1", "Đại từ"] }
    ],
    exercises: [
      {
        id: "hsk1-l1-ex1",
        type: "multiple_choice",
        question: "Khi chào thầy cô hoặc người lớn tuổi một cách tôn trọng, ta dùng câu nào?",
        hanziPrompt: "您好，老师！",
        pinyinPrompt: "Nín hǎo, lǎoshī!",
        options: ["A. 你好", "B. 您好", "C. 再见", "D. 对不起"],
        correctAnswer: "B. 您好",
        explanation: "'您好' dùng đại từ kính ngữ 您 (nín) dành cho thầy cô, người lớn tuổi để biểu thị sự tôn trọng.",
        grammarFocus: "Đại từ nhân xưng kính ngữ",
        audioText: "您好！"
      },
      {
        id: "hsk1-l1-ex2",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu chào nhiều người chuẩn xác:",
        hanziPrompt: "[ 你们 / 好 / ！ ]",
        vietnamesePrompt: "Chào các bạn!",
        scrambleSegments: ["你们", "好", "！"],
        options: ["你们好！", "好你们！", "你好们！", "你们好吗？"],
        correctAnswer: "你们好！",
        explanation: "Trật tự câu chào trong tiếng Trung là [Chủ thể được chào] + [好], số nhiều '你们' đứng trước '好'.",
        grammarFocus: "Trật tự câu chào hỏi",
        audioText: "你们好！"
      },
      {
        id: "hsk1-l1-ex3",
        type: "fill_blank",
        question: "Điền từ thích hợp vào chỗ trống: 李老师，______好！",
        hanziPrompt: "李老师，______好！",
        pinyinPrompt: "Lǐ lǎoshī, ______ hǎo!",
        vietnamesePrompt: "Thầy Lý, em chào thầy ạ!",
        options: ["您", "我", "他", "不"],
        correctAnswer: "您",
        explanation: "Khi xưng hô với thầy cô giáo (李老师), ta dùng đại từ kính ngữ '您' để thể hiện sự lễ phép.",
        grammarFocus: "Kính ngữ trong giao tiếp",
        audioText: "李老师，您好！"
      },
      {
        id: "hsk1-l1-ex4",
        type: "error_spotting",
        question: "Phát hiện lỗi sai trong câu chào sau: '好你！'",
        hanziPrompt: "好你！",
        vietnamesePrompt: "Chào bạn! (Đang bị đảo trật tự từ)",
        options: [
          "Trật tự từ sai: Phải là '你好'",
          "Thiếu dấu chấm hỏi",
          "Dùng sai chữ '好'",
          "Phải đổi thành '再见'"
        ],
        correctAnswer: "Trật tự từ sai: Phải là '你好'",
        explanation: "Tiếng Trung không nói '好你', trật tự cố định luôn là '你好' (Đối tượng + 好).",
        grammarFocus: "Quy tắc trật tự từ",
        audioText: "你好！"
      },
      {
        id: "hsk1-l1-ex5",
        type: "translation",
        question: "Dịch câu sau sang tiếng Trung: 'Chào các bạn, tôi là học sinh.'",
        vietnamesePrompt: "Chào các bạn, tôi là học sinh.",
        options: [
          "你们好，我是学生。",
          "你好，他是老师。",
          "您好，我是中国人。",
          "你们好，他是朋友。"
        ],
        correctAnswer: "你们好，我是学生。",
        explanation: "'你们好' (Chào các bạn) + '我是学生' (Tôi là học sinh).",
        grammarFocus: "Cấu trúc câu khẳng định với 是",
        audioText: "你们好，我是学生。"
      }
    ],
    tongueTwister: {
      title: "四和十 (Bốn và Mười)",
      hanzi: "四是四，十是十，十四是十四，四十是四十。",
      pinyin: "Sì shì sì, shí shì shí, shísì shì shísì, sìshí shì sìshí.",
      vietnamese: "Bốn là bốn, mười là mười, mười bốn là mười bốn, bốn mươi là bốn mươi."
    }
  },

  // LESSON 2
  {
    lessonNumber: 2,
    titleHanzi: "谢谢你",
    titlePinyin: "Xièxie nǐ",
    titleVietnamese: "Cảm ơn bạn",
    pageStart: 8,
    objectives: [
      "Học cách cảm ơn (谢谢) và đáp lại lời cảm ơn (不客气).",
      "Học cách xin lỗi (对不起) và đáp lại lời xin lỗi (没关系).",
      "Nắm vững các nét cơ bản và quy tắc viết chữ Hán."
    ],
    texts: [
      {
        id: "hsk1-l2-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "朋友给你倒茶。(Bạn rót trà cho bạn).",
        lines: [
          { speaker: "A", hanzi: "谢谢你！", pinyin: "Xièxie nǐ!", vietnamese: "Cảm ơn bạn!" },
          { speaker: "B", hanzi: "不客气！", pinyin: "Bú kèqi!", vietnamese: "Không có gì đâu!" }
        ]
      },
      {
        id: "hsk1-l2-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在路上不小心撞到人。(Vô tình va vào người khác trên đường).",
        lines: [
          { speaker: "A", hanzi: "对不起！", pinyin: "Duìbuqǐ!", vietnamese: "Xin lỗi bạn!" },
          { speaker: "B", hanzi: "没关系！", pinyin: "Méi guānxi!", vietnamese: "Không sao đâu!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l2-g1",
        title: "1. Lời cảm ơn và đáp lại",
        explanation: "Khi ai đó nói '谢谢' hoặc '谢谢你', câu đáp lịch sự là '不客气' (bú kèqi) hoặc '不用谢' (bú yòng xiè).",
        examples: [
          { hanzi: "谢谢！ - 不客气！", pinyin: "Xièxie! - Bú kèqi!", vietnamese: "Cảm ơn! - Không có chi!" }
        ]
      },
      {
        id: "hsk1-l2-g2",
        title: "2. Lời xin lỗi và đáp lại",
        explanation: "Khi xin lỗi '对不起' (duìbuqǐ), người đối diện thường an ủi bằng '没关系' (méi guānxi - không sao cả).",
        examples: [
          { hanzi: "对不起！ - 没关系！", pinyin: "Duìbuqǐ! - Méi guānxi!", vietnamese: "Xin lỗi! - Không sao đâu!" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l2-w1", hanzi: "谢谢", pinyin: "xièxie", hanViet: "tạ tạ", vietnamese: "cảm ơn", hskLevel: 1, radical: "讠", strokeCount: 12, example: "谢谢你！", exampleTranslation: "Cảm ơn bạn!", tags: ["Bài 2", "Giao tiếp"] },
      { id: "hsk1-l2-w2", hanzi: "不", pinyin: "bù", hanViet: "bất", vietnamese: "không (phủ định)", hskLevel: 1, radical: "一", strokeCount: 4, example: "我不去。", exampleTranslation: "Tôi không đi.", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk1-l2-w3", hanzi: "不客气", pinyin: "bú kèqi", hanViet: "bất khách khí", vietnamese: "đừng khách sáo, không có chi", hskLevel: 1, radical: "一", strokeCount: 17, example: "不客气！", exampleTranslation: "Không có gì!", tags: ["Bài 2", "Giao tiếp"] },
      { id: "hsk1-l2-w4", hanzi: "对不起", pinyin: "duìbuqǐ", hanViet: "đối bất khởi", vietnamese: "xin lỗi", hskLevel: 1, radical: "寸", strokeCount: 17, example: "对不起，我迟到了。", exampleTranslation: "Xin lỗi, tôi đến muộn.", tags: ["Bài 2", "Giao tiếp"] },
      { id: "hsk1-l2-w5", hanzi: "没关系", pinyin: "méi guānxi", hanViet: "một quan hệ", vietnamese: "không sao, không hề gì", hskLevel: 1, radical: "氵", strokeCount: 17, example: "没关系！", exampleTranslation: "Không sao đâu!", tags: ["Bài 2", "Giao tiếp"] },
      { id: "hsk1-l2-w6", hanzi: "再见", pinyin: "zàijiàn", hanViet: "tái kiến", vietnamese: "tạm biệt, hẹn gặp lại", hskLevel: 1, radical: "冂", strokeCount: 10, example: "明天再见！", exampleTranslation: "Ngày mai gặp lại nhé!", tags: ["Bài 2", "Giao tiếp"] }
    ],
    exercises: [
      {
        id: "hsk1-l2-ex1",
        type: "dialogue_match",
        question: "Khi người khác nói '对不起' (Xin lỗi!), câu đáp lại lịch sự và chuẩn xác là gì?",
        hanziPrompt: "A: 对不起！ — B: ______！",
        pinyinPrompt: "A: Duìbuqǐ! — B: ______!",
        options: ["A. 谢谢", "B. 不客气", "C. 没关系", "D. 再见"],
        correctAnswer: "C. 没关系",
        explanation: "Đáp lại lời xin lỗi '对不起' bằng '没关系' (Không sao đâu/Không hề gì).",
        grammarFocus: "Phản xạ hội thoại xin lỗi",
        audioText: "没关系！"
      },
      {
        id: "hsk1-l2-ex2",
        type: "fill_blank",
        question: "Điền từ thích hợp vào chỗ trống: 谢谢你！ — 不______！",
        hanziPrompt: "谢谢你！ — 不______！",
        pinyinPrompt: "Xièxie nǐ! — Bú ______!",
        vietnamesePrompt: "Cảm ơn bạn! — Không có gì!",
        options: ["客气", "起", "见", "好"],
        correctAnswer: "客气",
        explanation: "'不客气' (bú kèqi) là cách đáp chuẩn mực khi nhận được lời cảm ơn.",
        grammarFocus: "Cụm từ giao tiếp cố định",
        audioText: "不客气！"
      },
      {
        id: "hsk1-l2-ex3",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu cảm ơn hoàn chỉnh:",
        hanziPrompt: "[ 谢谢 / 你 / ！ ]",
        vietnamesePrompt: "Cảm ơn bạn!",
        scrambleSegments: ["谢谢", "你", "！"],
        options: ["谢谢你！", "你谢谢！", "谢你谢！", "不客气！"],
        correctAnswer: "谢谢你！",
        explanation: "Cấu trúc lời cảm ơn: Động từ '谢谢' đứng trước tân ngữ chỉ người '你'.",
        grammarFocus: "Cấu trúc động tân cảm ơn",
        audioText: "谢谢你！"
      },
      {
        id: "hsk1-l2-ex4",
        type: "translation",
        question: "Chọn câu tiếng Trung chính xác cho: 'Ngày mai gặp lại nhé!'",
        vietnamesePrompt: "Ngày mai gặp lại nhé!",
        options: [
          "明天见！",
          "再见！",
          "你好！",
          "对不起！"
        ],
        correctAnswer: "明天见！",
        explanation: "'明天' (ngày mai) + '见' (gặp) = '明天见！' (Ngày mai gặp lại).",
        grammarFocus: "Cách nói hẹn gặp lại theo thời gian",
        audioText: "明天见！"
      }
    ]
  },

  // LESSON 3
  {
    lessonNumber: 3,
    titleHanzi: "你叫什么名字",
    titlePinyin: "Nǐ jiào shénme míngzi",
    titleVietnamese: "Bạn tên là gì?",
    pageStart: 15,
    objectives: [
      "Hỏi và giới thiệu tên tuổi, quốc tịch.",
      "Dùng đại từ nghi vấn '什么' (gì, cái gì).",
      "Dùng câu vị ngữ động từ với '叫' và '是'."
    ],
    texts: [
      {
        id: "hsk1-l3-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在学校，两个新同学初次见面。(Ở trường, hai bạn học mới lần đầu gặp mặt).",
        lines: [
          { speaker: "李月 (Li Yue)", hanzi: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzi?", vietnamese: "Bạn tên là gì?" },
          { speaker: "大卫 (David)", hanzi: "我叫大卫。", pinyin: "Wǒ jiào Dàwèi.", vietnamese: "Tôi tên là David." }
        ]
      },
      {
        id: "hsk1-l3-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "谈论老师。(Trò chuyện về giáo viên).",
        lines: [
          { speaker: "大卫 (David)", hanzi: "她是老师吗？", pinyin: "Tā shì lǎoshī ma?", vietnamese: "Cô ấy là giáo viên phải không?" },
          { speaker: "李月 (Li Yue)", hanzi: "她不是老师，她是学生。", pinyin: "Tā bú shì lǎoshī, tā shì xuésheng.", vietnamese: "Cô ấy không phải là giáo viên, cô ấy là học sinh." }
        ]
      },
      {
        id: "hsk1-l3-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "问国籍。(Hỏi về quốc tịch).",
        lines: [
          { speaker: "李月 (Li Yue)", hanzi: "你是中国人吗？", pinyin: "Nǐ shì Zhōngguó rén ma?", vietnamese: "Bạn là người Trung Quốc à?" },
          { speaker: "大卫 (David)", hanzi: "我不是中国人，我是美国人。", pinyin: "Wǒ bú shì Zhōngguó rén, wǒ shì Měiguó rén.", vietnamese: "Tôi không phải người Trung Quốc, tôi là người Mỹ." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l3-g1",
        title: "1. Đại từ nghi vấn '什么' (Cái gì)",
        explanation: "'什么' dùng để hỏi sự vật, đồ vật, tên gọi. Cấu trúc: Động từ + 什么 (+ Danh từ)?",
        examples: [
          { hanzi: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzi?", vietnamese: "Bạn tên là gì?" },
          { hanzi: "这是什么？", pinyin: "Zhè shì shénme?", vietnamese: "Đây là cái gì?" }
        ]
      },
      {
        id: "hsk1-l3-g2",
        title: "2. Câu chữ '是' (Là) và câu hỏi '吗'",
        explanation: "Cấu trúc khẳng định: A + 是 + B. Phủ định: A + 不是 + B. Nghi vấn: A + 是 + B + 吗?",
        examples: [
          { hanzi: "我是学生。", pinyin: "Wǒ shì xuésheng.", vietnamese: "Tôi là học sinh." },
          { hanzi: "你是中国人吗？", pinyin: "Nǐ shì Zhōngguó rén ma?", vietnamese: "Bạn là người Trung Quốc à?" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l3-w1", hanzi: "叫", pinyin: "jiào", hanViet: "khiếu", vietnamese: "gọi là, tên là", hskLevel: 1, radical: "口", strokeCount: 5, example: "我叫李月。", exampleTranslation: "Tôi tên là Lý Nguyệt.", tags: ["Bài 3", "Động từ"] },
      { id: "hsk1-l3-w2", hanzi: "什么", pinyin: "shénme", hanViet: "thập ma", vietnamese: "gì, cái gì", hskLevel: 1, radical: "亻", strokeCount: 7, example: "这是什么书？", exampleTranslation: "Đây là sách gì?", tags: ["Bài 3", "Đại từ nghi vấn"] },
      { id: "hsk1-l3-w3", hanzi: "名字", pinyin: "míngzi", hanViet: "danh tự", vietnamese: "tên", hskLevel: 1, radical: "夕", strokeCount: 12, example: "我的名字叫大卫。", exampleTranslation: "Tên của tôi là David.", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w4", hanzi: "我", pinyin: "wǒ", hanViet: "ngã", vietnamese: "tôi, mình", hskLevel: 1, radical: "戈", strokeCount: 7, example: "我是中国人。", exampleTranslation: "Tôi là người Trung Quốc.", tags: ["Bài 3", "Đại từ"] },
      { id: "hsk1-l3-w5", hanzi: "是", pinyin: "shì", hanViet: "thị", vietnamese: "là (động từ)", hskLevel: 1, radical: "日", strokeCount: 9, example: "他是老师。", exampleTranslation: "Anh ấy là giáo viên.", tags: ["Bài 3", "Động từ"] },
      { id: "hsk1-l3-w6", hanzi: "老师", pinyin: "lǎoshī", hanViet: "lão sư", vietnamese: "thầy giáo, cô giáo", hskLevel: 1, radical: "耂", strokeCount: 16, example: "王老师很好。", exampleTranslation: "Cô giáo Vương rất tốt.", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w7", hanzi: "学生", pinyin: "xuésheng", hanViet: "học sinh", vietnamese: "học sinh, sinh viên", hskLevel: 1, radical: "子", strokeCount: 13, example: "我们都是学生。", exampleTranslation: "Chúng tôi đều là học sinh.", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w8", hanzi: "人", pinyin: "rén", hanViet: "nhân", vietnamese: "người", hskLevel: 1, radical: "人", strokeCount: 2, example: "中国人 / 越南人", exampleTranslation: "Người Trung Quốc / Người Việt Nam", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk1-l3-w9", hanzi: "中国", pinyin: "Zhōngguó", hanViet: "Trung Quốc", vietnamese: "nước Trung Quốc", hskLevel: 1, radical: "丨", strokeCount: 12, example: "我去中国。", exampleTranslation: "Tôi đi Trung Quốc.", tags: ["Bài 3", "Địa danh"] },
      { id: "hsk1-l3-w10", hanzi: "美国", pinyin: "Měiguó", hanViet: "Mỹ Quốc", vietnamese: "nước Mỹ", hskLevel: 1, radical: "八", strokeCount: 17, example: "美国人", exampleTranslation: "người Mỹ", tags: ["Bài 3", "Địa danh"] }
    ],
    exercises: [
      {
        id: "hsk1-l3-ex1",
        type: "multiple_choice",
        question: "Chọn câu tiếng Trung chính xác cho: 'Tôi không phải là người Mỹ, tôi là người Việt Nam.'",
        hanziPrompt: "我不是美国人，我是越南人。",
        pinyinPrompt: "Wǒ bú shì Měiguó rén, wǒ shì Yuènán rén.",
        options: [
          "A. 我不是美国人，我是越南人。",
          "B. 我是美国人，我不是越南人。",
          "C. 我不叫美国人，我叫越南人。",
          "D. 他不是美国人，他是越南人。"
        ],
        correctAnswer: "A. 我不是美国人，我是越南人。",
        explanation: "Phủ định của 是 là 不是 (bú shì). Cấu trúc: [Chủ ngữ] + 不是 + [Danh từ], [Chủ ngữ] + 是 + [Danh từ].",
        grammarFocus: "Cấu trúc phủ định với 不是",
        audioText: "我不是美国人，我是越南人。"
      },
      {
        id: "hsk1-l3-ex2",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu hỏi tên người khác:",
        hanziPrompt: "[ 你 / 叫 / 什么 / 名字 / ？ ]",
        vietnamesePrompt: "Bạn tên là gì?",
        scrambleSegments: ["你", "叫", "什么", "名字", "？"],
        options: [
          "你叫什么名字？",
          "什么名字你叫？",
          "你名字叫什么？",
          "名字叫你什么？"
        ],
        correctAnswer: "你叫什么名字？",
        explanation: "Cấu trúc hỏi tên: [Chủ ngữ] + 叫 (tên là/gọi là) + 什么 + 名字 (tên gì).",
        grammarFocus: "Đại từ nghi vấn 什么",
        audioText: "你叫什么名字？"
      },
      {
        id: "hsk1-l3-ex3",
        type: "fill_blank",
        question: "Điền từ thích hợp vào chỗ trống để hỏi quốc tịch: 你是______人？",
        hanziPrompt: "你是______国人？",
        pinyinPrompt: "Nǐ shì ______ guó rén?",
        vietnamesePrompt: "Bạn là người nước nào?",
        options: ["哪", "什么", "谁", "吗"],
        correctAnswer: "哪",
        explanation: "Đại từ '哪' (nǎ) kết hợp với lượng từ hoặc danh từ '国' (nước) để hỏi 'nước nào' (哪国人).",
        grammarFocus: "Đại từ nghi vấn 哪",
        audioText: "你是哪国人？"
      },
      {
        id: "hsk1-l3-ex4",
        type: "dialogue_match",
        question: "Chọn câu đáp lại tự nhiên nhất cho câu hỏi: '你是中国人吗？'",
        hanziPrompt: "A: 你是中国人吗？ — B: ______",
        pinyinPrompt: "A: Nǐ shì Zhōngguó rén ma? — B: ______",
        vietnamesePrompt: "A: Bạn là người Trung Quốc à? — B: Tôi không phải, tôi là người Việt Nam.",
        options: [
          "我不是中国人，我是越南人。",
          "我是老师，他是学生。",
          "我叫李月，你呢？",
          "不客气，谢谢你。"
        ],
        correctAnswer: "我不是中国人，我是越南人。",
        explanation: "Khi hỏi nghi vấn '...吗', câu trả lời phủ định cần xác nhận lại danh tính chính xác.",
        grammarFocus: "Câu hỏi nghi vấn với trợ từ 吗",
        audioText: "我不是中国人，我是越南人。"
      }
    ]
  },

  // LESSON 4
  {
    lessonNumber: 4,
    titleHanzi: "她是我的汉语老师",
    titlePinyin: "Tā shì wǒ de Hànyǔ lǎoshī",
    titleVietnamese: "Cô ấy là giáo viên tiếng Trung của tôi",
    pageStart: 22,
    objectives: [
      "Dùng đại từ nghi vấn '谁' (ai) và '哪' (nào).",
      "Dùng trợ từ kết cấu '的' để biểu thị quan hệ sở hữu.",
      "Phân biệt 他 (anh ấy), 她 (cô ấy), 它 (nó)."
    ],
    texts: [
      {
        id: "hsk1-l4-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在教室，看着照片问人。(Trong lớp học, nhìn ảnh hỏi về người).",
        lines: [
          { speaker: "A", hanzi: "她是哪国人？", pinyin: "Tā shì nǎ guó rén?", vietnamese: "Cô ấy là người nước nào?" },
          { speaker: "B", hanzi: "她是美国人。她是我的汉语老师，她叫王老师。", pinyin: "Tā shì Měiguó rén. Tā shì wǒ de Hànyǔ lǎoshī, tā jiào Wáng lǎoshī.", vietnamese: "Cô ấy là người Mỹ. Cô ấy là giáo viên tiếng Trung của tôi, cô ấy tên là cô Vương." }
        ]
      },
      {
        id: "hsk1-l4-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在图书馆。(Trong thư viện).",
        lines: [
          { speaker: "A", hanzi: "他是谁？", pinyin: "Tā shì shéi?", vietnamese: "Anh ấy là ai?" },
          { speaker: "B", hanzi: "他是我的同学，他叫大卫。", pinyin: "Tā shì wǒ de tóngxué, tā jiào Dàwèi.", vietnamese: "Anh ấy là bạn học của tôi, anh ấy tên là David." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l4-g1",
        title: "1. Đại từ nghi vấn '谁' (Ai)",
        explanation: "'谁' dùng để hỏi về người hoặc thân phận. Ví dụ: 他是谁？ (Anh ấy là ai?)",
        examples: [
          { hanzi: "他是谁？ - 他是我的朋友。", pinyin: "Tā shì shéi? - Tā shì wǒ de péngyou.", vietnamese: "Anh ấy là ai? - Anh ấy là bạn của tôi." }
        ]
      },
      {
        id: "hsk1-l4-g2",
        title: "2. Trợ từ kết cấu '的' (Của)",
        explanation: "Biểu thị quan hệ sở hữu hoặc định ngữ hạn định. Cấu trúc: Người sở hữu + 的 + Danh từ.",
        examples: [
          { hanzi: "我的汉语老师", pinyin: "wǒ de Hànyǔ lǎoshī", vietnamese: "giáo viên tiếng Trung của tôi" },
          { hanzi: "他的同学", pinyin: "tā de tóngxué", vietnamese: "bạn học của anh ấy" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l4-w1", hanzi: "她", pinyin: "tā", hanViet: "tha", vietnamese: "cô ấy, bà ấy, chị ấy", hskLevel: 1, radical: "女", strokeCount: 6, example: "她是老师。", exampleTranslation: "Cô ấy là giáo viên.", tags: ["Bài 4", "Đại từ"] },
      { id: "hsk1-l4-w2", hanzi: "谁", pinyin: "shéi / shuí", hanViet: "thùy", vietnamese: "ai (đại từ nghi vấn)", hskLevel: 1, radical: "讠", strokeCount: 10, example: "他是谁？", exampleTranslation: "Anh ấy là ai?", tags: ["Bài 4", "Nghi vấn"] },
      { id: "hsk1-l4-w3", hanzi: "的", pinyin: "de", hanViet: "đích", vietnamese: "của (trợ từ sở hữu)", hskLevel: 1, radical: "白", strokeCount: 8, example: "我的书", exampleTranslation: "sách của tôi", tags: ["Bài 4", "Trợ từ"] },
      { id: "hsk1-l4-w4", hanzi: "汉语", pinyin: "Hànyǔ", hanViet: "Hán ngữ", vietnamese: "tiếng Trung, tiếng Hán", hskLevel: 1, radical: "氵", strokeCount: 19, example: "学汉语", exampleTranslation: "học tiếng Trung", tags: ["Bài 4", "Ngôn ngữ"] },
      { id: "hsk1-l4-w5", hanzi: "哪", pinyin: "nǎ / něi", hanViet: "na", vietnamese: "nào (đại từ nghi vấn)", hskLevel: 1, radical: "口", strokeCount: 9, example: "哪国人？", exampleTranslation: "người nước nào?", tags: ["Bài 4", "Nghi vấn"] },
      { id: "hsk1-l4-w6", hanzi: "国", pinyin: "guó", hanViet: "quốc", vietnamese: "nước, quốc gia", hskLevel: 1, radical: "囗", strokeCount: 8, example: "国家 / 哪个国家", exampleTranslation: "quốc gia / quốc gia nào", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w7", hanzi: "同学", pinyin: "tóngxué", hanViet: "đồng học", vietnamese: "bạn học, bạn cùng lớp", hskLevel: 1, radical: "口", strokeCount: 14, example: "我的大学同学", exampleTranslation: "bạn đại học của tôi", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk1-l4-w8", hanzi: "朋友", pinyin: "péngyou", hanViet: "bằng hữu", vietnamese: "bạn bè", hskLevel: 1, radical: "月", strokeCount: 12, example: "好朋友", exampleTranslation: "bạn tốt, bạn thân", tags: ["Bài 4", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk1-l4-ex1",
        type: "multiple_choice",
        question: "Chọn từ đúng: '李月是 ______ 汉语老师。'",
        options: ["A. 我", "B. 我的", "C. 我在", "D. 我吗"],
        correctAnswer: "B. 我的",
        explanation: "Dùng trợ từ '的' để biểu thị quan hệ sở hữu: 我的汉语老师 (cô giáo tiếng Trung của tôi)."
      }
    ]
  },

  // LESSON 5
  {
    lessonNumber: 5,
    titleHanzi: "她女儿今年二十岁",
    titlePinyin: "Tā nǚ'ér jīnnián èrshí suì",
    titleVietnamese: "Con gái cô ấy năm nay 20 tuổi",
    pageStart: 29,
    objectives: [
      "Hỏi và trả lời về tuổi tác bằng '多大' và '几岁'.",
      "Học số đếm từ 1 đến 100 bằng tiếng Trung.",
      "Hỏi số thành viên trong gia đình với lượng từ '口 (kǒu)'."
    ],
    texts: [
      {
        id: "hsk1-l5-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在学校问家庭。(Ở trường hỏi về gia đình).",
        lines: [
          { speaker: "A", hanzi: "你家有几口人？", pinyin: "Nǐ jiā yǒu jǐ kǒu rén?", vietnamese: "Nhà bạn có mấy người?" },
          { speaker: "B", hanzi: "我家有三口人：爸爸、妈妈和我。", pinyin: "Wǒ jiā yǒu sān kǒu rén: bàba, māma hé wǒ.", vietnamese: "Nhà tôi có ba người: bố, mẹ và tôi." }
        ]
      },
      {
        id: "hsk1-l5-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "问年龄。(Hỏi về tuổi tác).",
        lines: [
          { speaker: "A", hanzi: "你女儿几岁了？", pinyin: "Nǐ nǚ'ér jǐ suì le?", vietnamese: "Con gái bạn mấy tuổi rồi?" },
          { speaker: "B", hanzi: "她今年四岁了。", pinyin: "Tā jīnnián sì suì le.", vietnamese: "Bé năm nay bốn tuổi rồi." }
        ]
      },
      {
        id: "hsk1-l5-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "问成年人的年龄。(Hỏi tuổi người lớn).",
        lines: [
          { speaker: "A", hanzi: "李老师多大了？", pinyin: "Lǐ lǎoshī duō dà le?", vietnamese: "Cô giáo Lý bao nhiêu tuổi rồi?" },
          { speaker: "B", hanzi: "她今年五十岁了。她女儿今年二十岁。", pinyin: "Tā jīnnián wǔshí suì le. Tā nǚ'ér jīnnián èrshí suì.", vietnamese: "Cô ấy năm nay năm mươi tuổi rồi. Con gái cô ấy năm nay hai mươi tuổi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l5-g1",
        title: "1. Hỏi tuổi: '几岁' vs '多大'",
        explanation: "'几岁' thường hỏi trẻ em dưới 10 tuổi. '多大' dùng để hỏi người lớn, thanh niên.",
        examples: [
          { hanzi: "你几岁了？ (hỏi trẻ em)", pinyin: "Nǐ jǐ suì le?", vietnamese: "Cháu mấy tuổi rồi?" },
          { hanzi: "你多大了？ (hỏi người lớn)", pinyin: "Nǐ duō dà le?", vietnamese: "Bạn bao nhiêu tuổi rồi?" }
        ]
      },
      {
        id: "hsk1-l5-g2",
        title: "2. Số đếm từ 11 đến 99",
        explanation: "11-19: 十一, 十二... 20, 30: 二十, 三十... 25: 二十五.",
        examples: [
          { hanzi: "二十岁", pinyin: "èrshí suì", vietnamese: "20 tuổi" },
          { hanzi: "五十岁", pinyin: "wǔshí suì", vietnamese: "50 tuổi" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l5-w1", hanzi: "家", pinyin: "jiā", hanViet: "gia", vietnamese: "nhà, gia đình", hskLevel: 1, radical: "宀", strokeCount: 10, example: "我家有四口人。", exampleTranslation: "Nhà tôi có 4 người.", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk1-l5-w2", hanzi: "有", pinyin: "yǒu", hanViet: "hữu", vietnamese: "có", hskLevel: 1, radical: "月", strokeCount: 6, example: "我有汉语书。", exampleTranslation: "Tôi có sách tiếng Trung.", tags: ["Bài 5", "Động từ"] },
      { id: "hsk1-l5-w3", hanzi: "口", pinyin: "kǒu", hanViet: "khẩu", vietnamese: "miệng, lượng từ người trong gia đình", hskLevel: 1, radical: "口", strokeCount: 3, example: "三口人", exampleTranslation: "3 người", tags: ["Bài 5", "Lượng từ"] },
      { id: "hsk1-l5-w4", hanzi: "女儿", pinyin: "nǚ'ér", hanViet: "nữ nhi", vietnamese: "con gái", hskLevel: 1, radical: "女", strokeCount: 5, example: "她女儿很漂亮。", exampleTranslation: "Con gái cô ấy rất xinh.", tags: ["Bài 5", "Gia đình"] },
      { id: "hsk1-l5-w5", hanzi: "几", pinyin: "jǐ", hanViet: "kỷ", vietnamese: "mấy (hỏi số lượng < 10)", hskLevel: 1, radical: "几", strokeCount: 2, example: "几个人？", exampleTranslation: "Mấy người?", tags: ["Bài 5", "Nghi vấn"] },
      { id: "hsk1-l5-w6", hanzi: "岁", pinyin: "suì", hanViet: "tuế", vietnamese: "tuổi", hskLevel: 1, radical: "山", strokeCount: 6, example: "二十岁", exampleTranslation: "20 tuổi", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk1-l5-w7", hanzi: "今年", pinyin: "jīnnián", hanViet: "kim niên", vietnamese: "năm nay", hskLevel: 1, radical: "人", strokeCount: 10, example: "我今年二十岁。", exampleTranslation: "Tôi năm nay 20 tuổi.", tags: ["Bài 5", "Thời gian"] },
      { id: "hsk1-l5-w8", hanzi: "多大", pinyin: "duō dà", hanViet: "đa đại", vietnamese: "bao nhiêu tuổi", hskLevel: 1, radical: "夕", strokeCount: 9, example: "你多大了？", exampleTranslation: "Bạn bao nhiêu tuổi rồi?", tags: ["Bài 5", "Hỏi tuổi"] }
    ],
    exercises: [
      {
        id: "hsk1-l5-ex1",
        type: "multiple_choice",
        question: "Muốn hỏi tuổi người lớn bằng tuổi mình một cách lịch sự, ta nói:",
        options: ["A. 你几岁？", "B. 你多大？", "C. 你是谁？", "D. 你叫什么？"],
        correctAnswer: "B. 你多大？",
        explanation: "Hỏi tuổi người trưởng thành dùng '你多大了？'."
      }
    ]
  },

  // LESSON 6
  {
    lessonNumber: 6,
    titleHanzi: "我会说汉语",
    titlePinyin: "Wǒ huì shuō Hànyǔ",
    titleVietnamese: "Tôi biết nói tiếng Trung",
    pageStart: 36,
    objectives: [
      "Dùng động từ năng nguyện '会 (huì)' biểu thị kỹ năng do học tập mà biết.",
      "Dùng '怎么 (zěnme)' để hỏi cách thức thực hiện hành động.",
      "Dùng câu hỏi ngữ điệu nhẹ với '怎么样 (zěnmeyàng)'."
    ],
    texts: [
      {
        id: "hsk1-l6-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在学校谈论语言技能。(Ở trường nói về khả năng ngôn ngữ).",
        lines: [
          { speaker: "A", hanzi: "你会说汉语吗？", pinyin: "Nǐ huì shuō Hànyǔ ma?", vietnamese: "Bạn biết nói tiếng Trung không?" },
          { speaker: "B", hanzi: "我会说汉语。我妈妈也会说汉语。", pinyin: "Wǒ huì shuō Hànyǔ. Wǒ māma yě huì shuō Hànyǔ.", vietnamese: "Tôi biết nói tiếng Trung. Mẹ tôi cũng biết nói tiếng Trung." }
        ]
      },
      {
        id: "hsk1-l6-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在厨房谈论中国菜。(Trong bếp trò chuyện về món ăn Trung Quốc).",
        lines: [
          { speaker: "A", hanzi: "中国菜好吃吗？", pinyin: "Zhōngguó cài hǎochī ma?", vietnamese: "Món ăn Trung Quốc có ngon không?" },
          { speaker: "B", hanzi: "中国菜很好吃。", pinyin: "Zhōngguó cài hěn hǎochī.", vietnamese: "Món ăn Trung Quốc rất ngon." },
          { speaker: "A", hanzi: "你会做中国菜吗？", pinyin: "Nǐ huì zuò Zhōngguó cài ma?", vietnamese: "Bạn biết nấu món ăn Trung Quốc không?" },
          { speaker: "B", hanzi: "我不会做。", pinyin: "Wǒ bú huì zuò.", vietnamese: "Tôi không biết nấu." }
        ]
      },
      {
        id: "hsk1-l6-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在办公室写汉字。(Trong văn phòng viết chữ Hán).",
        lines: [
          { speaker: "A", hanzi: "你会写汉字吗？", pinyin: "Nǐ huì xiě Hànzì ma?", vietnamese: "Bạn biết viết chữ Hán không?" },
          { speaker: "B", hanzi: "我会写。", pinyin: "Wǒ huì xiě.", vietnamese: "Tôi biết viết." },
          { speaker: "A", hanzi: "这个字怎么写？", pinyin: "Zhè gè zì zěnme xiě?", vietnamese: "Chữ này viết như thế nào?" },
          { speaker: "B", hanzi: "对不起，这个字我会读，不会写。", pinyin: "Duìbuqǐ, zhè gè zì wǒ huì dú, bú huì xiě.", vietnamese: "Xin lỗi, chữ này tôi biết đọc nhưng không biết viết." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l6-g1",
        title: "1. Động từ năng nguyện '会' (Biết qua rèn luyện)",
        explanation: "Khẳng định: Chủ ngữ + 会 + Động từ. Phủ định: 主语 + 不会 + Động từ.",
        examples: [
          { hanzi: "我会说汉语。", pinyin: "Wǒ huì shuō Hànyǔ.", vietnamese: "Tôi biết nói tiếng Trung." },
          { hanzi: "我不会做中国菜。", pinyin: "Wǒ bú huì zuò Zhōngguó cài.", vietnamese: "Tôi không biết nấu món ăn Trung Quốc." }
        ]
      },
      {
        id: "hsk1-l6-g2",
        title: "2. Đại từ nghi vấn '怎么' (Làm sao, thế nào)",
        explanation: "Dùng hỏi cách thức của hành động: 怎么 + Động từ?",
        examples: [
          { hanzi: "这个字怎么读？", pinyin: "Zhè gè zì zěnme dú?", vietnamese: "Chữ này đọc thế nào?" },
          { hanzi: "这个汉字怎么写？", pinyin: "Zhè gè Hànzì zěnme xiě?", vietnamese: "Chữ Hán này viết như thế nào?" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l6-w1", hanzi: "会", pinyin: "huì", hanViet: "hội", vietnamese: "biết (qua học tập)", hskLevel: 1, radical: "人", strokeCount: 6, example: "我会开车。", exampleTranslation: "Tôi biết lái xe.", tags: ["Bài 6", "Năng nguyện"] },
      { id: "hsk1-l6-w2", hanzi: "说", pinyin: "shuō", hanViet: "thuyết", vietnamese: "nói", hskLevel: 1, radical: "讠", strokeCount: 9, example: "说汉语", exampleTranslation: "nói tiếng Trung", tags: ["Bài 6", "Động từ"] },
      { id: "hsk1-l6-w3", hanzi: "妈妈", pinyin: "māma", hanViet: "ma ma", vietnamese: "mẹ", hskLevel: 1, radical: "女", strokeCount: 12, example: "我妈妈很好。", exampleTranslation: "Mẹ tôi rất tốt.", tags: ["Bài 6", "Gia đình"] },
      { id: "hsk1-l6-w4", hanzi: "菜", pinyin: "cài", hanViet: "thái", vietnamese: "món ăn, rau", hskLevel: 1, radical: "艹", strokeCount: 11, example: "中国菜", exampleTranslation: "món ăn Trung Quốc", tags: ["Bài 6", "Ẩm thực"] },
      { id: "hsk1-l6-w5", hanzi: "很", pinyin: "hěn", hanViet: "hẩn", vietnamese: "rất", hskLevel: 1, radical: "彳", strokeCount: 9, example: "很好吃", exampleTranslation: "rất ngon", tags: ["Bài 6", "Phó từ"] },
      { id: "hsk1-l6-w6", hanzi: "好吃", pinyin: "hǎochī", hanViet: "hảo cật", vietnamese: "ngon (ăn ngon)", hskLevel: 1, radical: "女", strokeCount: 12, example: "这道菜很好吃。", exampleTranslation: "Món này rất ngon.", tags: ["Bài 6", "Tính từ"] },
      { id: "hsk1-l6-w7", hanzi: "做", pinyin: "zuò", hanViet: "tác", vietnamese: "làm, nấu", hskLevel: 1, radical: "亻", strokeCount: 11, example: "做饭 / 做菜", exampleTranslation: "nấu cơm / nấu món ăn", tags: ["Bài 6", "Động từ"] },
      { id: "hsk1-l6-w8", hanzi: "写", pinyin: "xiě", hanViet: "tả", vietnamese: "viết", hskLevel: 1, radical: "冖", strokeCount: 5, example: "写字", exampleTranslation: "viết chữ", tags: ["Bài 6", "Động từ"] },
      { id: "hsk1-l6-w9", hanzi: "汉字", pinyin: "Hànzì", hanViet: "Hán tự", vietnamese: "chữ Hán", hskLevel: 1, radical: "氵", strokeCount: 11, example: "学汉字", exampleTranslation: "học chữ Hán", tags: ["Bài 6", "Danh từ"] },
      { id: "hsk1-l6-w10", hanzi: "字", pinyin: "zì", hanViet: "tự", vietnamese: "chữ", hskLevel: 1, radical: "宀", strokeCount: 6, example: "写字", exampleTranslation: "viết chữ", tags: ["Bài 6", "Danh từ"] },
      { id: "hsk1-l6-w11", hanzi: "怎么", pinyin: "zěnme", hanViet: "chẩm ma", vietnamese: "thế nào, làm sao", hskLevel: 1, radical: "心", strokeCount: 9, example: "怎么去？", exampleTranslation: "Đi bằng cách nào?", tags: ["Bài 6", "Nghi vấn"] },
      { id: "hsk1-l6-w12", hanzi: "读", pinyin: "dú", hanViet: "độc", vietnamese: "đọc", hskLevel: 1, radical: "讠", strokeCount: 10, example: "读书", exampleTranslation: "đọc sách", tags: ["Bài 6", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk1-l6-ex1",
        type: "multiple_choice",
        question: "Muốn hỏi 'Chữ Hán này đọc như thế nào?', ta nói:",
        options: ["A. 这个汉字怎么读？", "B. 这个汉字什么读？", "C. 这个汉字谁读？", "D. 这个汉字哪读？"],
        correctAnswer: "A. 这个汉字怎么读？",
        explanation: "Dùng '怎么 + 动词' để hỏi cách thức hành động."
      }
    ]
  },

  // LESSON 7
  {
    lessonNumber: 7,
    titleHanzi: "今天几号",
    titlePinyin: "Jīntiān jǐ hào",
    titleVietnamese: "Hôm nay ngày mấy?",
    pageStart: 43,
    objectives: [
      "Hỏi và diễn đạt ngày tháng năm, các thứ trong tuần.",
      "Nắm vững trật tự thời gian tiếng Trung từ lớn đến nhỏ (Năm -> Tháng -> Ngày -> Thứ).",
      "Dùng câu vị ngữ danh từ biểu thị thời gian."
    ],
    texts: [
      {
        id: "hsk1-l7-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "看日历问日期。(Xem lịch hỏi ngày tháng).",
        lines: [
          { speaker: "A", hanzi: "请问，今天几号？", pinyin: "Qǐngwèn, jīntiān jǐ hào?", vietnamese: "Xin hỏi, hôm nay ngày mấy?" },
          { speaker: "B", hanzi: "今天9月1号。", pinyin: "Jīntiān jiǔ yuè yī hào.", vietnamese: "Hôm nay ngày 1 tháng 9." },
          { speaker: "A", hanzi: "今天星期几？", pinyin: "Jīntiān xīngqī jǐ?", vietnamese: "Hôm nay thứ mấy?" },
          { speaker: "B", hanzi: "星期三。", pinyin: "Xīngqīsān.", vietnamese: "Thứ tư." }
        ]
      },
      {
        id: "hsk1-l7-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "谈论昨天与明天。(Nói về hôm qua và ngày mai).",
        lines: [
          { speaker: "A", hanzi: "昨天是几月几号？", pinyin: "Zuótiān shì jǐ yuè jǐ hào?", vietnamese: "Hôm qua là ngày mấy tháng mấy?" },
          { speaker: "B", hanzi: "昨天是8月31号，星期二。", pinyin: "Zuótiān shì bā yuè sānshíyī hào, xīngqī'èr.", vietnamese: "Hôm qua là ngày 31 tháng 8, thứ ba." },
          { speaker: "A", hanzi: "明天呢？", pinyin: "Míngtiān ne?", vietnamese: "Còn ngày mai thì sao?" },
          { speaker: "B", hanzi: "明天是9月2号，星期四。", pinyin: "Míngtiān shì jiǔ yuè èr hào, xīngqīsì.", vietnamese: "Ngày mai là ngày 2 tháng 9, thứ năm." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l7-g1",
        title: "1. Trật tự biểu đạt ngày tháng (Lớn trước, nhỏ sau)",
        explanation: "Quy tắc: Năm (年) -> Tháng (月) -> Ngày (日/号) -> Thứ (星期). Khác hoàn toàn với tiếng Việt.",
        examples: [
          { hanzi: "2026年8月22日 星期六", pinyin: "èr líng èr liù nián bā yuè èrshí'èr rì, xīngqīliù", vietnamese: "Thứ bảy, ngày 22 tháng 8 năm 2026" }
        ]
      },
      {
        id: "hsk1-l7-g2",
        title: "2. Cách gọi các thứ trong tuần (星期一 đến 星期天/日)",
        explanation: "Thứ hai là 星期一, Thứ ba là 星期二... Chủ nhật là 星期天 hoặc 星期日.",
        examples: [
          { hanzi: "星期一 (Thứ 2)", pinyin: "xīngqīyī", vietnamese: "Thứ hai" },
          { hanzi: "星期日 (Chủ nhật)", pinyin: "xīngqīrì", vietnamese: "Chủ nhật" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l7-w1", hanzi: "请问", pinyin: "qǐngwèn", hanViet: "thỉnh vấn", vietnamese: "xin hỏi", hskLevel: 1, radical: "讠", strokeCount: 15, example: "请问，您叫什么？", exampleTranslation: "Xin hỏi, ngài tên là gì?", tags: ["Bài 7", "Lễ phép"] },
      { id: "hsk1-l7-w2", hanzi: "今天", pinyin: "jīntiān", hanViet: "kim thiên", vietnamese: "hôm nay", hskLevel: 1, radical: "人", strokeCount: 8, example: "今天星期五。", exampleTranslation: "Hôm nay thứ sáu.", tags: ["Bài 7", "Thời gian"] },
      { id: "hsk1-l7-w3", hanzi: "月", pinyin: "yuè", hanViet: "nguyệt", vietnamese: "tháng, mặt trăng", hskLevel: 1, radical: "月", strokeCount: 4, example: "五月", exampleTranslation: "tháng năm", tags: ["Bài 7", "Thời gian"] },
      { id: "hsk1-l7-w4", hanzi: "号", pinyin: "hào", hanViet: "hiệu", vietnamese: "ngày, số", hskLevel: 1, radical: "口", strokeCount: 5, example: "十号", exampleTranslation: "ngày 10", tags: ["Bài 7", "Thời gian"] },
      { id: "hsk1-l7-w5", hanzi: "星期", pinyin: "xīngqī", hanViet: "tinh kỳ", vietnamese: "tuần, thứ", hskLevel: 1, radical: "日", strokeCount: 21, example: "星期天", exampleTranslation: "Chủ nhật", tags: ["Bài 7", "Thời gian"] },
      { id: "hsk1-l7-w6", hanzi: "昨天", pinyin: "zuótiān", hanViet: "tạc thiên", vietnamese: "hôm qua", hskLevel: 1, radical: "日", strokeCount: 13, example: "昨天很好。", exampleTranslation: "Hôm qua rất vui.", tags: ["Bài 7", "Thời gian"] },
      { id: "hsk1-l7-w7", hanzi: "明天", pinyin: "míngtiān", hanViet: "minh thiên", vietnamese: "ngày mai", hskLevel: 1, radical: "日", strokeCount: 12, example: "明天见！", exampleTranslation: "Ngày mai gặp!", tags: ["Bài 7", "Thời gian"] }
    ],
    exercises: [
      {
        id: "hsk1-l7-ex1",
        type: "multiple_choice",
        question: "Trong tiếng Trung, 'Thứ tư' được gọi là:",
        options: ["A. 星期二", "B. 星期三", "C. 星期四", "D. 星期五"],
        correctAnswer: "B. 星期三",
        explanation: "Thứ trong tiếng Trung đếm lùi 1 số so với tiếng Việt: Thứ 2 = 星期一, Thứ 3 = 星期二, Thứ 4 = 星期三."
      }
    ]
  },

  // LESSON 8
  {
    lessonNumber: 8,
    titleHanzi: "我想喝茶",
    titlePinyin: "Wǒ xiǎng hē chá",
    titleVietnamese: "Tôi muốn uống trà",
    pageStart: 50,
    objectives: [
      "Dùng động từ năng nguyện '想 (xiǎng)' biểu thị nguyện vọng, ý muốn.",
      "Hỏi số lượng và giá tiền với '多少 (duōshao)' và '块 (kuài)'.",
      "Luyện tập giao tiếp khi mua sắm, gọi đồ uống tại quán."
    ],
    texts: [
      {
        id: "hsk1-l8-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在餐厅点饮品。(Trong nhà hàng gọi đồ uống).",
        lines: [
          { speaker: "服务员", hanzi: "你想喝什么？", pinyin: "Nǐ xiǎng hē shénme?", vietnamese: "Bạn muốn uống gì?" },
          { speaker: "客人", hanzi: "我想喝茶。", pinyin: "Wǒ xiǎng hē chá.", vietnamese: "Tôi muốn uống trà." },
          { speaker: "服务员", hanzi: "你想吃什么？", pinyin: "Nǐ xiǎng chī shénme?", vietnamese: "Bạn muốn ăn gì?" },
          { speaker: "客人", hanzi: "我想吃米饭。", pinyin: "Wǒ xiǎng chī mǐfàn.", vietnamese: "Tôi muốn ăn cơm." }
        ]
      },
      {
        id: "hsk1-l8-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在商店买东西。(Trong cửa hàng mua đồ).",
        lines: [
          { speaker: "客人", hanzi: "你好！这个杯子多少钱？", pinyin: "Nǐ hǎo! Zhè gè bēizi duōshao qián?", vietnamese: "Xin chào! Chiếc cốc này bao nhiêu tiền?" },
          { speaker: "售货员", hanzi: "28块。", pinyin: "Èrshíbā kuài.", vietnamese: "28 tệ." },
          { speaker: "客人", hanzi: "那个杯子呢？", pinyin: "Nà gè bēizi ne?", vietnamese: "Còn chiếc cốc kia thì sao?" },
          { speaker: "售货员", hanzi: "那个杯子18块。", pinyin: "Nà gè bēizi shíbā kuài.", vietnamese: "Chiếc cốc kia 18 tệ." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l8-g1",
        title: "1. Động từ năng nguyện '想' (Muốn / Nghĩ)",
        explanation: "Chủ ngữ + 想 + Động từ: Biểu thị dự định hoặc mong muốn làm một việc gì đó.",
        examples: [
          { hanzi: "我想买一个杯子。", pinyin: "Wǒ xiǎng mǎi yí gè bēizi.", vietnamese: "Tôi muốn mua một chiếc cốc." },
          { hanzi: "我想学汉语。", pinyin: "Wǒ xiǎng xué Hànyǔ.", vietnamese: "Tôi muốn học tiếng Trung." }
        ]
      },
      {
        id: "hsk1-l8-g2",
        title: "2. Hỏi giá tiền: '多少钱' và đơn vị '块'",
        explanation: "Hỏi giá: Cái này / Cái kia + 多少钱? Đơn vị tiền tệ khẩu ngữ là '块 (kuài)' (tệ).",
        examples: [
          { hanzi: "这个多少钱？ - 十块。", pinyin: "Zhè gè duōshao qián? - Shí kuài.", vietnamese: "Cái này bao nhiêu tiền? - 10 tệ." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l8-w1", hanzi: "想", pinyin: "xiǎng", hanViet: "tưởng", vietnamese: "muốn, nhớ, nghĩ", hskLevel: 1, radical: "心", strokeCount: 13, example: "我想你。", exampleTranslation: "Tôi nhớ bạn.", tags: ["Bài 8", "Năng nguyện"] },
      { id: "hsk1-l8-w2", hanzi: "喝", pinyin: "hē", hanViet: "hát", vietnamese: "uống", hskLevel: 1, radical: "口", strokeCount: 12, example: "喝水 / 喝茶", exampleTranslation: "uống nước / uống trà", tags: ["Bài 8", "Động từ"] },
      { id: "hsk1-l8-w3", hanzi: "茶", pinyin: "chá", hanViet: "trà", vietnamese: "trà, chè", hskLevel: 1, radical: "艹", strokeCount: 9, example: "中国茶", exampleTranslation: "trà Trung Quốc", tags: ["Bài 8", "Đồ uống"] },
      { id: "hsk1-l8-w4", hanzi: "吃", pinyin: "chī", hanViet: "cật", vietnamese: "ăn", hskLevel: 1, radical: "口", strokeCount: 6, example: "吃饭", exampleTranslation: "ăn cơm", tags: ["Bài 8", "Động từ"] },
      { id: "hsk1-l8-w5", hanzi: "米饭", pinyin: "mǐfàn", hanViet: "mễ phạn", vietnamese: "cơm trắng", hskLevel: 1, radical: "米", strokeCount: 13, example: "吃米饭", exampleTranslation: "ăn cơm", tags: ["Bài 8", "Ẩm thực"] },
      { id: "hsk1-l8-w6", hanzi: "商店", pinyin: "shāngdiàn", hanViet: "thương điếm", vietnamese: "cửa hàng", hskLevel: 1, radical: "广", strokeCount: 19, example: "去商店", exampleTranslation: "đi cửa hàng", tags: ["Bài 8", "Địa điểm"] },
      { id: "hsk1-l8-w7", hanzi: "买", pinyin: "mǎi", hanViet: "mãi", vietnamese: "mua", hskLevel: 1, radical: "乙", strokeCount: 6, example: "买东西", exampleTranslation: "mua sắm đồ đạc", tags: ["Bài 8", "Động từ"] },
      { id: "hsk1-l8-w8", hanzi: "杯子", pinyin: "bēizi", hanViet: "bôi tử", vietnamese: "cái cốc, cái ly", hskLevel: 1, radical: "木", strokeCount: 11, example: "一个杯子", exampleTranslation: "một chiếc cốc", tags: ["Bài 8", "Đồ vật"] },
      { id: "hsk1-l8-w9", hanzi: "块", pinyin: "kuài", hanViet: "khối", vietnamese: "đồng, tệ (đơn vị tiền tệ)", hskLevel: 1, radical: "土", strokeCount: 7, example: "五块钱", exampleTranslation: "5 tệ", tags: ["Bài 8", "Lượng từ"] }
    ],
    exercises: [
      {
        id: "hsk1-l8-ex1",
        type: "multiple_choice",
        question: "Điền từ thích hợp: '我想 ______ 一杯中国茶。'",
        options: ["A. 喝", "B. 吃", "C. 看", "D. 读"],
        correctAnswer: "A. 喝",
        explanation: "Đối với trà (茶), dùng động từ '喝' (uống)."
      }
    ]
  },

  // LESSON 9
  {
    lessonNumber: 9,
    titleHanzi: "你儿子在哪儿工作",
    titlePinyin: "Nǐ érzi zài nǎr gōngzuò",
    titleVietnamese: "Con trai bạn làm việc ở đâu?",
    pageStart: 57,
    objectives: [
      "Hỏi và diễn đạt vị trí nơi chốn với giới từ '在 (zài)' và '哪儿 (nǎr)'.",
      "Nói về nghề nghiệp (bác sĩ, giáo viên) và địa điểm làm việc (bệnh viện, trường học).",
      "Dùng câu chữ '在' biểu thị sự tồn tại."
    ],
    texts: [
      {
        id: "hsk1-l9-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在客厅谈论宠物。(Ở phòng khách nói về thú cưng).",
        lines: [
          { speaker: "A", hanzi: "小猫在哪儿？", pinyin: "Xiǎomāo zài nǎr?", vietnamese: "Mèo con ở đâu thế?" },
          { speaker: "B", hanzi: "小猫在那儿，在椅子下面。", pinyin: "Xiǎomāo zài nàr, zài yǐzi xiàmiàn.", vietnamese: "Mèo con ở đằng kia, ở dưới gầm ghế." },
          { speaker: "A", hanzi: "小狗在哪儿？", pinyin: "Xiǎogǒu zài nǎr?", vietnamese: "Chó con ở đâu?" },
          { speaker: "B", hanzi: "小狗在椅子上面。", pinyin: "Xiǎogǒu zài yǐzi shàngmiàn.", vietnamese: "Chó con ở trên ghế." }
        ]
      },
      {
        id: "hsk1-l9-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "谈论工作。(Nói về công việc).",
        lines: [
          { speaker: "A", hanzi: "你在哪儿工作？", pinyin: "Nǐ zài nǎr gōngzuò?", vietnamese: "Bạn làm việc ở đâu?" },
          { speaker: "B", hanzi: "我在学校工作。你儿子在哪儿工作？", pinyin: "Wǒ zài xuéxiào gōngzuò. Nǐ érzi zài nǎr gōngzuò?", vietnamese: "Tôi làm việc ở trường học. Con trai bạn làm việc ở đâu?" },
          { speaker: "A", hanzi: "我儿子在医院工作，他是医生。", pinyin: "Wǒ érzi zài yīyuàn gōngzuò, tā shì yīshēng.", vietnamese: "Con trai tôi làm việc ở bệnh viện, nó là bác sĩ." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l9-g1",
        title: "1. Giới từ '在' chỉ địa điểm hành động",
        explanation: "Cấu trúc: Chủ ngữ + 在 + Địa điểm + Động từ. (Làm việc gì ở đâu).",
        examples: [
          { hanzi: "我在学校学汉语。", pinyin: "Wǒ zài xuéxiào xué Hànyǔ.", vietnamese: "Tôi học tiếng Trung ở trường." },
          { hanzi: "他在医院工作。", pinyin: "Tā zài yīyuàn gōngzuò.", vietnamese: "Anh ấy làm việc ở bệnh viện." }
        ]
      },
      {
        id: "hsk1-l9-g2",
        title: "2. Phương vị từ '上' (trên) và '下' (dưới)",
        explanation: "Danh từ + 上 / 下 biểu thị vị trí trên hoặc dưới của vật thể.",
        examples: [
          { hanzi: "桌子上", pinyin: "zhuōzi shang", vietnamese: "trên bàn" },
          { hanzi: "椅子下", pinyin: "yǐzi xia", vietnamese: "dưới ghế" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l9-w1", hanzi: "小", pinyin: "xiǎo", hanViet: "tiểu", vietnamese: "nhỏ, bé", hskLevel: 1, radical: "小", strokeCount: 3, example: "小猫", exampleTranslation: "mèo con", tags: ["Bài 9", "Tính từ"] },
      { id: "hsk1-l9-w2", hanzi: "猫", pinyin: "māo", hanViet: "miêu", vietnamese: "con mèo", hskLevel: 1, radical: "犭", strokeCount: 11, example: "一只猫", exampleTranslation: "một con mèo", tags: ["Bài 9", "Động vật"] },
      { id: "hsk1-l9-w3", hanzi: "在", pinyin: "zài", hanViet: "tại", vietnamese: "ở, tại", hskLevel: 1, radical: "土", strokeCount: 6, example: "在家", exampleTranslation: "ở nhà", tags: ["Bài 9", "Giới từ"] },
      { id: "hsk1-l9-w4", hanzi: "哪儿", pinyin: "nǎr", hanViet: "na nhi", vietnamese: "ở đâu, chỗ nào", hskLevel: 1, radical: "口", strokeCount: 11, example: "你在哪儿？", exampleTranslation: "Bạn ở đâu?", tags: ["Bài 9", "Nghi vấn"] },
      { id: "hsk1-l9-w5", hanzi: "那儿", pinyin: "nàr", hanViet: "na nhi", vietnamese: "ở đó, chỗ đó", hskLevel: 1, radical: "阝", strokeCount: 8, example: "他在那儿。", exampleTranslation: "Anh ấy ở đằng kia.", tags: ["Bài 9", "Chỉ định"] },
      { id: "hsk1-l9-w6", hanzi: "狗", pinyin: "gǒu", hanViet: "cẩu", vietnamese: "con chó", hskLevel: 1, radical: "犭", strokeCount: 8, example: "小狗", exampleTranslation: "chó con", tags: ["Bài 9", "Động vật"] },
      { id: "hsk1-l9-w7", hanzi: "椅子", pinyin: "yǐzi", hanViet: "ỷ tử", vietnamese: "cái ghế", hskLevel: 1, radical: "木", strokeCount: 12, example: "一把椅子", exampleTranslation: "một chiếc ghế", tags: ["Bài 9", "Đồ vật"] },
      { id: "hsk1-l9-w8", hanzi: "下面", pinyin: "xiàmiàn", hanViet: "hạ diện", vietnamese: "bên dưới, phía dưới", hskLevel: 1, radical: "一", strokeCount: 12, example: "桌子下面", exampleTranslation: "dưới gầm bàn", tags: ["Bài 9", "Phương vị"] },
      { id: "hsk1-l9-w9", hanzi: "上面", pinyin: "shàngmiàn", hanViet: "thượng diện", vietnamese: "bên trên, phía trên", hskLevel: 1, radical: "一", strokeCount: 12, example: "书上面", exampleTranslation: "trên quyển sách", tags: ["Bài 9", "Phương vị"] },
      { id: "hsk1-l9-w10", hanzi: "工作", pinyin: "gōngzuò", hanViet: "công tác", vietnamese: "làm việc, công việc", hskLevel: 1, radical: "工", strokeCount: 10, example: "找工作", exampleTranslation: "tìm việc làm", tags: ["Bài 9", "Động từ"] },
      { id: "hsk1-l9-w11", hanzi: "儿子", pinyin: "érzi", hanViet: "nhi tử", vietnamese: "con trai", hskLevel: 1, radical: "儿", strokeCount: 5, example: "他儿子很聪明。", exampleTranslation: "Con trai anh ấy rất thông minh.", tags: ["Bài 9", "Gia đình"] },
      { id: "hsk1-l9-w12", hanzi: "医院", pinyin: "yīyuàn", hanViet: "y viện", vietnamese: "bệnh viện", hskLevel: 1, radical: "匚", strokeCount: 16, example: "去医院看病", exampleTranslation: "đi bệnh viện khám bệnh", tags: ["Bài 9", "Địa điểm"] },
      { id: "hsk1-l9-w13", hanzi: "医生", pinyin: "yīshēng", hanViet: "y sinh", vietnamese: "bác sĩ", hskLevel: 1, radical: "匚", strokeCount: 12, example: "我是医生。", exampleTranslation: "Tôi là bác sĩ.", tags: ["Bài 9", "Nghề nghiệp"] }
    ],
    exercises: [
      {
        id: "hsk1-l9-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Anh ấy làm việc ở bệnh viện.'",
        options: ["A. 他在医院工作。", "B. 他工作在医院。", "C. 他是医院工作。", "D. 他在工作医院。"],
        correctAnswer: "A. 他在医院工作。",
        explanation: "Trong tiếng Trung, trạng từ chỉ địa điểm '在 + Địa điểm' bắt buộc phải đứng trước động từ: 他在医院工作."
      }
    ]
  },

  // LESSON 10
  {
    lessonNumber: 10,
    titleHanzi: "我能坐这儿吗",
    titlePinyin: "Wǒ néng zuò zhèr ma",
    titleVietnamese: "Tôi có thể ngồi ở đây không?",
    pageStart: 64,
    objectives: [
      "Dùng động từ năng nguyện '能 (néng)' để xin phép và biểu đạt khả năng.",
      "Miêu tả sự tồn tại của đồ vật trên bàn bằng câu vị ngữ chữ '有'.",
      "Dùng '前 (qián)' và '后 (hòu)' chỉ vị trí trước sau."
    ],
    texts: [
      {
        id: "hsk1-l10-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在图书馆找座位。(Tìm chỗ ngồi trong thư viện).",
        lines: [
          { speaker: "A", hanzi: "桌子上有什么？", pinyin: "Zhuōzi shang yǒu shénme?", vietnamese: "Trên bàn có cái gì thế?" },
          { speaker: "B", hanzi: "桌子上有一个电脑和一本书。", pinyin: "Zhuōzi shang yǒu yí gè diànnǎo hé yì běn shū.", vietnamese: "Trên bàn có một chiếc máy tính và một quyển sách." },
          { speaker: "A", hanzi: "这儿有人吗？", pinyin: "Zhèr yǒu rén ma?", vietnamese: "Ở đây có người ngồi không?" },
          { speaker: "B", hanzi: "没有。", pinyin: "Méiyǒu.", vietnamese: "Không có ai cả." },
          { speaker: "A", hanzi: "我能坐这儿吗？", pinyin: "Wǒ néng zuò zhèr ma?", vietnamese: "Tôi có thể ngồi đây được không?" },
          { speaker: "B", hanzi: "请坐。", pinyin: "Qǐng zuò.", vietnamese: "Xin mời ngồi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l10-g1",
        title: "1. Động từ năng nguyện '能' (Có thể)",
        explanation: "Dùng để xin phép hoặc biểu đạt năng lực: 能 + Động từ?",
        examples: [
          { hanzi: "我能坐这儿吗？", pinyin: "Wǒ néng zuò zhèr ma?", vietnamese: "Tôi có thể ngồi ở đây không?" },
          { hanzi: "你能来吗？ - 能。", pinyin: "Nǐ néng lái ma? - Néng.", vietnamese: "Bạn có thể đến không? - Có thể." }
        ]
      },
      {
        id: "hsk1-l10-g2",
        title: "2. Câu biểu đạt sự tồn tại: 'Địa điểm + 有 + Sự vật'",
        explanation: "Cấu trúc miêu tả nơi nào có vật gì.",
        examples: [
          { hanzi: "桌子上有一本书。", pinyin: "Zhuōzi shang yǒu yì běn shū.", vietnamese: "Trên bàn có một quyển sách." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l10-w1", hanzi: "桌子", pinyin: "zhuōzi", hanViet: "trác tử", vietnamese: "cái bàn", hskLevel: 1, radical: "木", strokeCount: 13, example: "一张桌子", exampleTranslation: "một chiếc bàn", tags: ["Bài 10", "Đồ vật"] },
      { id: "hsk1-l10-w2", hanzi: "电脑", pinyin: "diànnǎo", hanViet: "điện não", vietnamese: "máy tính", hskLevel: 1, radical: "雨", strokeCount: 18, example: "一台电脑", exampleTranslation: "một chiếc máy tính", tags: ["Bài 10", "Đồ vật"] },
      { id: "hsk1-l10-w3", hanzi: "本", pinyin: "běn", hanViet: "bản", vietnamese: "quyển, cuốn (lượng từ sách)", hskLevel: 1, radical: "木", strokeCount: 5, example: "一本书", exampleTranslation: "một cuốn sách", tags: ["Bài 10", "Lượng từ"] },
      { id: "hsk1-l10-w4", hanzi: "里", pinyin: "lǐ", hanViet: "lý", vietnamese: "trong, bên trong", hskLevel: 1, radical: "里", strokeCount: 7, example: "学校里", exampleTranslation: "trong trường", tags: ["Bài 10", "Phương vị"] },
      { id: "hsk1-l10-w5", hanzi: "这儿", pinyin: "zhèr", hanViet: "giá nhi", vietnamese: "ở đây, chỗ này", hskLevel: 1, radical: "辶", strokeCount: 9, example: "在这儿", exampleTranslation: "ở đây", tags: ["Bài 10", "Chỉ định"] },
      { id: "hsk1-l10-w6", hanzi: "没有", pinyin: "méiyǒu", hanViet: "một hữu", vietnamese: "không có", hskLevel: 1, radical: "氵", strokeCount: 13, example: "没有钱", exampleTranslation: "không có tiền", tags: ["Bài 10", "Phủ định"] },
      { id: "hsk1-l10-w7", hanzi: "能", pinyin: "néng", hanViet: "năng", vietnamese: "có thể", hskLevel: 1, radical: "月", strokeCount: 10, example: "我能去。", exampleTranslation: "Tôi có thể đi.", tags: ["Bài 10", "Năng nguyện"] },
      { id: "hsk1-l10-w8", hanzi: "坐", pinyin: "zuò", hanViet: "tọa", vietnamese: "ngồi", hskLevel: 1, radical: "土", strokeCount: 7, example: "请坐！", exampleTranslation: "Xin mời ngồi!", tags: ["Bài 10", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk1-l10-ex1",
        type: "multiple_choice",
        question: "Khi muốn xin phép ngồi xuống cạnh ai đó, bạn nói lịch sự:",
        options: ["A. 我能坐这儿吗？", "B. 我要坐这儿。", "C. 你坐哪儿？", "D. 这是谁的桌子？"],
        correctAnswer: "A. 我能坐这儿吗？",
        explanation: "Dùng '我能……吗？' để xin phép lịch sự."
      }
    ]
  },

  // LESSON 11
  {
    lessonNumber: 11,
    titleHanzi: "现在几点",
    titlePinyin: "Xiànzài jǐ diǎn",
    titleVietnamese: "Bây giờ là mấy giờ?",
    pageStart: 71,
    objectives: [
      "Hỏi và diễn đạt thời gian chính xác (giờ, phút, phân buổi).",
      "Sắp xếp lịch trình sinh hoạt hàng ngày (sáng, trưa, tối).",
      "Nắm vững vị trí của trạng ngữ chỉ thời gian trong câu."
    ],
    texts: [
      {
        id: "hsk1-l11-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "看手表问时间。(Xem đồng hồ hỏi giờ).",
        lines: [
          { speaker: "A", hanzi: "现在几点？", pinyin: "Xiànzài jǐ diǎn?", vietnamese: "Bây giờ là mấy giờ rồi?" },
          { speaker: "B", hanzi: "现在十点十分。", pinyin: "Xiànzài shí diǎn shí fēn.", vietnamese: "Bây giờ là 10 giờ 10 phút." },
          { speaker: "A", hanzi: "我们中午几点吃饭？", pinyin: "Wǒmen zhōngwǔ jǐ diǎn chīfàn?", vietnamese: "Buổi trưa tụi mình ăn cơm lúc mấy giờ?" },
          { speaker: "B", hanzi: "十二点吃饭。", pinyin: "Shí'èr diǎn chīfàn.", vietnamese: "Mười hai giờ ăn cơm." }
        ]
      },
      {
        id: "hsk1-l11-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "安排日程。(Sắp xếp lịch trình đi xem phim).",
        lines: [
          { speaker: "A", hanzi: "爸爸什么时候回家？", pinyin: "Bàba shénme shíhou huí jiā?", vietnamese: "Bố khi nào thì về nhà?" },
          { speaker: "B", hanzi: "下午五点。", pinyin: "Xiàwǔ wǔ diǎn.", vietnamese: "Năm giờ chiều." },
          { speaker: "A", hanzi: "我们什么时候去看电影？", pinyin: "Wǒmen shénme shíhou qù kàn diànyǐng?", vietnamese: "Khi nào thì chúng ta đi xem phim?" },
          { speaker: "B", hanzi: "六点三十分。", pinyin: "Liù diǎn sānshí fēn.", vietnamese: "Sáu giờ ba mươi phút." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l11-g1",
        title: "1. Cách nói giờ và phút trong tiếng Trung",
        explanation: "Giờ: 点 (diǎn). Phút: 分 (fēn). Ví dụ: 8:15 -> 八点十五分.",
        examples: [
          { hanzi: "十点十分", pinyin: "shí diǎn shí fēn", vietnamese: "10 giờ 10 phút" },
          { hanzi: "上午八点", pinyin: "shàngwǔ bā diǎn", vietnamese: "8 giờ sáng" }
        ]
      },
      {
        id: "hsk1-l11-g2",
        title: "2. Trạng từ chỉ thời gian trong câu",
        explanation: "Thời gian đứng trước động từ, có thể đứng đầu câu hoặc sau chủ ngữ: (Thời gian) + Chủ ngữ + (Thời gian) + Động từ.",
        examples: [
          { hanzi: "我下午五点回学校。", pinyin: "Wǒ xiàwǔ wǔ diǎn huí xuéxiào.", vietnamese: "Tôi về trường lúc 5 giờ chiều." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l11-w1", hanzi: "现在", pinyin: "xiànzài", hanViet: "hiện tại", vietnamese: "bây giờ, hiện nay", hskLevel: 1, radical: "王", strokeCount: 8, example: "现在几点？", exampleTranslation: "Bây giờ mấy giờ?", tags: ["Bài 11", "Thời gian"] },
      { id: "hsk1-l11-w2", hanzi: "点", pinyin: "diǎn", hanViet: "điểm", vietnamese: "giờ", hskLevel: 1, radical: "灬", strokeCount: 9, example: "三点", exampleTranslation: "3 giờ", tags: ["Bài 11", "Thời gian"] },
      { id: "hsk1-l11-w3", hanzi: "分", pinyin: "fēn", hanViet: "phân", vietnamese: "phút", hskLevel: 1, radical: "刀", strokeCount: 4, example: "十分钟", exampleTranslation: "10 phút", tags: ["Bài 11", "Thời gian"] },
      { id: "hsk1-l11-w4", hanzi: "中午", pinyin: "zhōngwǔ", hanViet: "trung ngọ", vietnamese: "buổi trưa", hskLevel: 1, radical: "丨", strokeCount: 8, example: "中午吃饭", exampleTranslation: "ăn cơm trưa", tags: ["Bài 11", "Thời gian"] },
      { id: "hsk1-l11-w5", hanzi: "吃饭", pinyin: "chīfàn", hanViet: "cật phạn", vietnamese: "ăn cơm", hskLevel: 1, radical: "口", strokeCount: 13, example: "一起吃饭", exampleTranslation: "cùng nhau ăn cơm", tags: ["Bài 11", "Động từ"] },
      { id: "hsk1-l11-w6", hanzi: "什么时候", pinyin: "shénme shíhou", hanViet: "thập ma thời hậu", vietnamese: "khi nào, bao giờ", hskLevel: 1, radical: "日", strokeCount: 22, example: "你什么时候来？", exampleTranslation: "Khi nào bạn đến?", tags: ["Bài 11", "Nghi vấn"] },
      { id: "hsk1-l11-w7", hanzi: "回", pinyin: "huí", hanViet: "hồi", vietnamese: "về, trở về", hskLevel: 1, radical: "囗", strokeCount: 6, example: "回家", exampleTranslation: "về nhà", tags: ["Bài 11", "Động từ"] },
      { id: "hsk1-l11-w8", hanzi: "我们", pinyin: "wǒmen", hanViet: "ngã môn", vietnamese: "chúng tôi, chúng ta", hskLevel: 1, radical: "戈", strokeCount: 12, example: "我们都是朋友。", exampleTranslation: "Chúng tôi đều là bạn bè.", tags: ["Bài 11", "Đại từ"] },
      { id: "hsk1-l11-w9", hanzi: "电影", pinyin: "diànyǐng", hanViet: "điện ảnh", vietnamese: "phim, điện ảnh", hskLevel: 1, radical: "雨", strokeCount: 20, example: "看电影", exampleTranslation: "xem phim", tags: ["Bài 11", "Giải trí"] }
    ],
    exercises: [
      {
        id: "hsk1-l11-ex1",
        type: "multiple_choice",
        question: "Muốn nói 'Chúng tôi xem phim lúc 7 giờ tối', câu nào đúng?",
        options: [
          "A. 我们晚上七点看电影。",
          "B. 我们看电影晚上七点。",
          "C. 晚上看电影我们七点。",
          "D. 七点我们看电影晚上。"
        ],
        correctAnswer: "A. 我们晚上七点看电影。",
        explanation: "Trạng từ chỉ thời gian (晚上七点) phải đặt trước động từ (看电影)."
      }
    ]
  },

  // LESSON 12
  {
    lessonNumber: 12,
    titleHanzi: "明天天气怎么样",
    titlePinyin: "Míngtiān tiānqì zěnmeyàng",
    titleVietnamese: "Thời tiết ngày mai thế nào?",
    pageStart: 78,
    objectives: [
      "Hỏi và miêu tả thời tiết (nóng, lạnh, mưa).",
      "Dùng '太……了' biểu thị mức độ quá mức.",
      "Dùng đại từ nghi vấn '怎么样' để hỏi ý kiến hoặc tình trạng."
    ],
    texts: [
      {
        id: "hsk1-l12-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "谈论天气。(Trò chuyện về thời tiết).",
        lines: [
          { speaker: "A", hanzi: "昨天北京的天气怎么样？", pinyin: "Zuótiān Běijīng de tiānqì zěnmeyàng?", vietnamese: "Hôm qua thời tiết Bắc Kinh thế nào?" },
          { speaker: "B", hanzi: "太热了。", pinyin: "Tài rè le.", vietnamese: "Nóng quá đi mất." },
          { speaker: "A", hanzi: "明天天气怎么样？", pinyin: "Míngtiān tiānqì zěnmeyàng?", vietnamese: "Thời tiết ngày mai thế nào?" },
          { speaker: "B", hanzi: "明天天气很好，不冷也不热。", pinyin: "Míngtiān tiānqì hěn hǎo, bù lěng yě bú rè.", vietnamese: "Thời tiết ngày mai rất đẹp, không lạnh cũng không nóng." }
        ]
      },
      {
        id: "hsk1-l12-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "关心身体。(Hỏi thăm sức khỏe).",
        lines: [
          { speaker: "A", hanzi: "今天会下雨吗？", pinyin: "Jīntiān huì xiàyǔ ma?", vietnamese: "Hôm nay trời có mưa không nhỉ?" },
          { speaker: "B", hanzi: "今天不会下雨。", pinyin: "Jīntiān bú huì xiàyǔ.", vietnamese: "Hôm nay trời sẽ không mưa đâu." },
          { speaker: "A", hanzi: "王小姐今天会来吗？", pinyin: "Wáng xiǎojiě jīntiān huì lái ma?", vietnamese: "Cô Vương hôm nay có đến không?" },
          { speaker: "B", hanzi: "不会来，天气太冷了。", pinyin: "Bú huì lái, tiānqì tài lěng le.", vietnamese: "Sẽ không đến đâu, thời tiết lạnh quá." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l12-g1",
        title: "1. Cấu trúc cảm thán: '太……了' (Quá, lắm)",
        explanation: "Biểu thị mức độ cao hoặc sự cảm thán của người nói: 太 + Tính từ + 了.",
        examples: [
          { hanzi: "太好了！", pinyin: "Tài hǎo le!", vietnamese: "Tốt quá rồi!" },
          { hanzi: "太冷了！", pinyin: "Tài lěng le!", vietnamese: "Lạnh quá!" }
        ]
      },
      {
        id: "hsk1-l12-g2",
        title: "2. '会' biểu thị khả năng sự việc sẽ xảy ra",
        explanation: "Biểu thị khả năng tương lai: Sẽ xảy ra.",
        examples: [
          { hanzi: "明天会下雨。", pinyin: "Míngtiān huì xiàyǔ.", vietnamese: "Ngày mai trời sẽ mưa." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l12-w1", hanzi: "天气", pinyin: "tiānqì", hanViet: "thiên khí", vietnamese: "thời tiết", hskLevel: 1, radical: "大", strokeCount: 10, example: "好天气", exampleTranslation: "thời tiết đẹp", tags: ["Bài 12", "Thời tiết"] },
      { id: "hsk1-l12-w2", hanzi: "怎么样", pinyin: "zěnmeyàng", hanViet: "chẩm ma dạng", vietnamese: "thế nào, ra sao", hskLevel: 1, radical: "心", strokeCount: 23, example: "你怎么样？", exampleTranslation: "Bạn thế nào rồi?", tags: ["Bài 12", "Nghi vấn"] },
      { id: "hsk1-l12-w3", hanzi: "太", pinyin: "tài", hanViet: "thái", vietnamese: "quá, lắm", hskLevel: 1, radical: "大", strokeCount: 4, example: "太大 / 太好", exampleTranslation: "quá to / quá tốt", tags: ["Bài 12", "Phó từ"] },
      { id: "hsk1-l12-w4", hanzi: "热", pinyin: "rè", hanViet: "nhiệt", vietnamese: "nóng", hskLevel: 1, radical: "灬", strokeCount: 10, example: "今天很热。", exampleTranslation: "Hôm nay rất nóng.", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk1-l12-w5", hanzi: "冷", pinyin: "lěng", hanViet: "lãnh", vietnamese: "lạnh", hskLevel: 1, radical: "冫", strokeCount: 7, example: "冬天很冷。", exampleTranslation: "Mùa đông rất lạnh.", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk1-l12-w6", hanzi: "下雨", pinyin: "xiàyǔ", hanViet: "hạ vũ", vietnamese: "trời mưa, đổ mưa", hskLevel: 1, radical: "雨", strokeCount: 11, example: "外面下雨了。", exampleTranslation: "Bên ngoài trời mưa rồi.", tags: ["Bài 12", "Thời tiết"] },
      { id: "hsk1-l12-w7", hanzi: "小姐", pinyin: "xiǎojiě", hanViet: "tiểu thư", vietnamese: "cô, tiểu thư", hskLevel: 1, radical: "女", strokeCount: 11, example: "王小姐", exampleTranslation: "Cô Vương", tags: ["Bài 12", "Xưng hô"] },
      { id: "hsk1-l12-w8", hanzi: "来", pinyin: "lái", hanViet: "lai", vietnamese: "đến, tới", hskLevel: 1, radical: "木", strokeCount: 7, example: "请来我家。", exampleTranslation: "Mời đến nhà tôi.", tags: ["Bài 12", "Động từ"] },
      { id: "hsk1-l12-w9", hanzi: "身体", pinyin: "shēntǐ", hanViet: "thân thể", vietnamese: "sức khỏe, cơ thể", hskLevel: 1, radical: "身", strokeCount: 14, example: "身体很好", exampleTranslation: "sức khỏe rất tốt", tags: ["Bài 12", "Sức khỏe"] }
    ],
    exercises: [
      {
        id: "hsk1-l12-ex1",
        type: "multiple_choice",
        question: "Cụm từ cảm thán 'Tốt quá rồi!' trong tiếng Trung là:",
        options: ["A. 太好！", "B. 太好了！", "C. 很好了！", "D. 好极！"],
        correctAnswer: "B. 太好了！",
        explanation: "Cấu trúc chuẩn là '太……了': 太好了！"
      }
    ]
  },

  // LESSON 13
  {
    lessonNumber: 13,
    titleHanzi: "他在学做中国菜呢",
    titlePinyin: "Tā zài xué zuò Zhōngguó cài ne",
    titleVietnamese: "Anh ấy đang học nấu món ăn Trung Quốc",
    pageStart: 85,
    objectives: [
      "Dùng '在……呢 (zài... ne)' để diễn đạt hành động đang tiếp diễn.",
      "Giao tiếp qua điện thoại (喂 - Alo, 打电话 - Gọi điện thoại).",
      "Đọc dãy số điện thoại với số 1 đọc là 'yāo'."
    ],
    texts: [
      {
        id: "hsk1-l13-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "打电话。(Gọi điện thoại).",
        lines: [
          { speaker: "A", hanzi: "喂，你在做什么呢？", pinyin: "Wèi, nǐ zài zuò shénme ne?", vietnamese: "Alo, bạn đang làm gì thế?" },
          { speaker: "B", hanzi: "我在看书呢。", pinyin: "Wǒ zài kàn shū ne.", vietnamese: "Tôi đang đọc sách nè." },
          { speaker: "A", hanzi: "大卫在做什么呢？", pinyin: "Dàwèi zài zuò shénme ne?", vietnamese: "David đang làm gì vậy?" },
          { speaker: "B", hanzi: "他在学做中国菜呢。", pinyin: "Tā zài xué zuò Zhōngguó cài ne.", vietnamese: "Anh ấy đang học nấu món ăn Trung Quốc." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l13-g1",
        title: "1. Câu biểu thị hành động đang tiếp diễn: '在……呢'",
        explanation: "Cấu trúc: Chủ ngữ + 在 / 正在 + Động từ + (呢). Phủ định: 没在 + Động từ.",
        examples: [
          { hanzi: "我正在听音乐呢。", pinyin: "Wǒ zhèngzài tīng yīnyuè ne.", vietnamese: "Tôi đang nghe nhạc nè." },
          { hanzi: "他没在看电视。", pinyin: "Tā méi zài kàn diànshì.", vietnamese: "Anh ấy không có đang xem ti vi." }
        ]
      },
      {
        id: "hsk1-l13-g2",
        title: "2. Số 1 trong số điện thoại đọc là 'yāo'",
        explanation: "Khi đọc số điện thoại, số phòng hoặc số xe buýt, chữ số 1 đọc là 'yāo' để tránh nhầm lẫn với số 7 (qī).",
        examples: [
          { hanzi: "138-1111-0000", pinyin: "yāo sān bā, yāo yāo yāo yāo...", vietnamese: "Đọc 'yāo' thay vì 'yī'." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l13-w1", hanzi: "喂", pinyin: "wèi / wéi", hanViet: "uy", vietnamese: "alo (nghe điện thoại)", hskLevel: 1, radical: "口", strokeCount: 12, example: "喂，你好！", exampleTranslation: "Alo, xin chào!", tags: ["Bài 13", "Giao tiếp"] },
      { id: "hsk1-l13-w2", hanzi: "在", pinyin: "zài", hanViet: "tại", vietnamese: "đang (phó từ tiếp diễn)", hskLevel: 1, radical: "土", strokeCount: 6, example: "在学习", exampleTranslation: "đang học tập", tags: ["Bài 13", "Phó từ"] },
      { id: "hsk1-l13-w3", hanzi: "学习", pinyin: "xuéxí", hanViet: "học tập", vietnamese: "học tập, học", hskLevel: 1, radical: "子", strokeCount: 11, example: "学习汉语", exampleTranslation: "học tiếng Trung", tags: ["Bài 13", "Động từ"] },
      { id: "hsk1-l13-w4", hanzi: "学", pinyin: "xué", hanViet: "học", vietnamese: "học", hskLevel: 1, radical: "子", strokeCount: 8, example: "学中文", exampleTranslation: "học tiếng Trung", tags: ["Bài 13", "Động từ"] },
      { id: "hsk1-l13-w5", hanzi: "上午", pinyin: "shàngwǔ", hanViet: "thượng ngọ", vietnamese: "buổi sáng", hskLevel: 1, radical: "一", strokeCount: 7, example: "今天上午", exampleTranslation: "sáng hôm nay", tags: ["Bài 13", "Thời gian"] },
      { id: "hsk1-l13-w6", hanzi: "睡觉", pinyin: "shuìjiào", hanViet: "thụy giác", vietnamese: "ngủ, đi ngủ", hskLevel: 1, radical: "目", strokeCount: 20, example: "想睡觉", exampleTranslation: "muốn đi ngủ", tags: ["Bài 13", "Động từ"] },
      { id: "hsk1-l13-w7", hanzi: "电视", pinyin: "diànshì", hanViet: "điện thị", vietnamese: "ti vi, truyền hình", hskLevel: 1, radical: "雨", strokeCount: 18, example: "看电视", exampleTranslation: "xem ti vi", tags: ["Bài 13", "Đồ vật"] },
      { id: "hsk1-l13-w8", hanzi: "打电话", pinyin: "dǎ diànhuà", hanViet: "đả điện thoại", vietnamese: "gọi điện thoại", hskLevel: 1, radical: "扌", strokeCount: 18, example: "给他打电话", exampleTranslation: "gọi điện thoại cho anh ấy", tags: ["Bài 13", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk1-l13-ex1",
        type: "multiple_choice",
        question: "Dịch: 'Anh ấy đang đọc sách ở trong phòng.'",
        options: [
          "A. 他在房间看书呢。",
          "B. 他看书在房间呢。",
          "C. 他是在房间看书。",
          "D. 他看在房间书。"
        ],
        correctAnswer: "A. 他在房间看书呢。",
        explanation: "Cấu trúc tiếp diễn: 他在 + Địa điểm (房间) + Động từ (看书) + 呢."
      }
    ]
  },

  // LESSON 14
  {
    lessonNumber: 14,
    titleHanzi: "她买了不少衣服",
    titlePinyin: "Tā mǎile bù shǎo yīfu",
    titleVietnamese: "Cô ấy đã mua không ít quần áo",
    pageStart: 92,
    objectives: [
      "Dùng trợ từ động thái '了 (le)' biểu thị hành động đã hoàn thành.",
      "Dùng danh từ chỉ khoảng thời gian '……后 (hòu)'.",
      "Học từ vựng mua sắm, trang phục và phương tiện giao thông."
    ],
    texts: [
      {
        id: "hsk1-l14-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在宿舍门前。(Trước cửa ký túc xá).",
        lines: [
          { speaker: "A", hanzi: "昨天上午你去哪儿了？", pinyin: "Zuótiān shàngwǔ nǐ qù nǎr le?", vietnamese: "Sáng hôm qua bạn đã đi đâu thế?" },
          { speaker: "B", hanzi: "我去商店买东西了。", pinyin: "Wǒ qù shāngdiàn mǎi dōngxi le.", vietnamese: "Tôi đã đến cửa hàng mua đồ." },
          { speaker: "A", hanzi: "你买什么了？", pinyin: "Nǐ mǎi shénme le?", vietnamese: "Bạn đã mua những gì?" },
          { speaker: "B", hanzi: "我买了一点儿苹果和不少衣服。", pinyin: "Wǒ mǎile yìdiǎnr píngguǒ hé bù shǎo yīfu.", vietnamese: "Tôi đã mua một ít táo và không ít quần áo." }
        ]
      },
      {
        id: "hsk1-l14-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "谈论朋友。(Trò chuyện về bạn bè).",
        lines: [
          { speaker: "A", hanzi: "你看见张先生了吗？", pinyin: "Nǐ kànjiàn Zhāng xiānsheng le ma?", vietnamese: "Bạn có nhìn thấy ông Trương không?" },
          { speaker: "B", hanzi: "看见了，他去学开车了。", pinyin: "Kànjiàn le, tā qù xué kāichē le.", vietnamese: "Thấy rồi, ông ấy đi học lái xe rồi." },
          { speaker: "A", hanzi: "他什么时候能回来？", pinyin: "Tā shénme shíhou néng huílái?", vietnamese: "Khi nào ông ấy có thể về?" },
          { speaker: "B", hanzi: "40分钟后回来。", pinyin: "Sìshí fēnzhōng hòu huílái.", vietnamese: "Sau 40 phút nữa sẽ về." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l14-g1",
        title: "1. Trợ từ động thái '了' chỉ sự hoàn thành",
        explanation: "Động từ + 了 + Tân ngữ (thường có số lượng từ): Biểu thị hành động đã xảy ra và hoàn tất.",
        examples: [
          { hanzi: "我买了一本书。", pinyin: "Wǒ mǎile yì běn shū.", vietnamese: "Tôi đã mua một cuốn sách." },
          { hanzi: "他喝了两杯茶。", pinyin: "Tā hēle liǎng bēi chá.", vietnamese: "Anh ấy đã uống hai tách trà." }
        ]
      },
      {
        id: "hsk1-l14-g2",
        title: "2. Khoảng thời gian + '后' (Sau...)",
        explanation: "Biểu thị một mốc thời gian sau đó. Ví dụ: 三天后 (sau 3 ngày), 40分钟后 (sau 40 phút).",
        examples: [
          { hanzi: "十分钟后见。", pinyin: "Shí fēnzhōng hòu jiàn.", vietnamese: "Hẹn gặp lại sau 10 phút." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l14-w1", hanzi: "东西", pinyin: "dōngxi", hanViet: "đông tây", vietnamese: "đồ vật, đồ đạc", hskLevel: 1, radical: "木", strokeCount: 14, example: "买东西", exampleTranslation: "mua đồ", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk1-l14-w2", hanzi: "一点儿", pinyin: "yìdiǎnr", hanViet: "nhất điểm nhi", vietnamese: "một ít, một chút", hskLevel: 1, radical: "一", strokeCount: 12, example: "吃一点儿", exampleTranslation: "ăn một chút", tags: ["Bài 14", "Số lượng"] },
      { id: "hsk1-l14-w3", hanzi: "苹果", pinyin: "píngguǒ", hanViet: "bình quả", vietnamese: "quả táo", hskLevel: 1, radical: "艹", strokeCount: 16, example: "红苹果", exampleTranslation: "táo đỏ", tags: ["Bài 14", "Hoa quả"] },
      { id: "hsk1-l14-w4", hanzi: "看见", pinyin: "kànjiàn", hanViet: "khán kiến", vietnamese: "nhìn thấy, trông thấy", hskLevel: 1, radical: "目", strokeCount: 12, example: "你看见他了吗？", exampleTranslation: "Bạn có nhìn thấy anh ấy không?", tags: ["Bài 14", "Động từ"] },
      { id: "hsk1-l14-w5", hanzi: "先生", pinyin: "xiānsheng", hanViet: "tiên sinh", vietnamese: "ông, ngài, chồng", hskLevel: 1, radical: "生", strokeCount: 11, example: "张先生", exampleTranslation: "Ông Trương", tags: ["Bài 14", "Xưng hô"] },
      { id: "hsk1-l14-w6", hanzi: "开", pinyin: "kāi", hanViet: "khai", vietnamese: "mở, lái (xe)", hskLevel: 1, radical: "廾", strokeCount: 4, example: "开门 / 开车", exampleTranslation: "mở cửa / lái xe", tags: ["Bài 14", "Động từ"] },
      { id: "hsk1-l14-w7", hanzi: "车", pinyin: "chē", hanViet: "xa", vietnamese: "xe, xe cộ", hskLevel: 1, radical: "车", strokeCount: 4, example: "坐车 / 开车", exampleTranslation: "đi xe / lái xe", tags: ["Bài 14", "Phương tiện"] },
      { id: "hsk1-l14-w8", hanzi: "回来", pinyin: "huílái", hanViet: "hồi lai", vietnamese: "trở về, về", hskLevel: 1, radical: "囗", strokeCount: 13, example: "快回来！", exampleTranslation: "Mau về đi!", tags: ["Bài 14", "Động từ"] },
      { id: "hsk1-l14-w9", hanzi: "分钟", pinyin: "fēnzhōng", hanViet: "phân chung", vietnamese: "phút (khoảng thời gian)", hskLevel: 1, radical: "刀", strokeCount: 10, example: "五分钟", exampleTranslation: "5 phút", tags: ["Bài 14", "Thời gian"] },
      { id: "hsk1-l14-w10", hanzi: "后", pinyin: "hòu", hanViet: "hậu", vietnamese: "sau, sau này", hskLevel: 1, radical: "口", strokeCount: 6, example: "三天后", exampleTranslation: "sau ba ngày", tags: ["Bài 14", "Thời gian"] },
      { id: "hsk1-l14-w11", hanzi: "衣服", pinyin: "yīfu", hanViet: "y phục", vietnamese: "quần áo, y phục", hskLevel: 1, radical: "衣", strokeCount: 14, example: "买新衣服", exampleTranslation: "mua quần áo mới", tags: ["Bài 14", "Trang phục"] }
    ],
    exercises: [
      {
        id: "hsk1-l14-ex1",
        type: "multiple_choice",
        question: "Chọn câu đúng để diễn đạt 'Tôi đã mua một chiếc cốc mới':",
        options: [
          "A. 我买了一个新杯子。",
          "B. 我买一个新杯子了没有。",
          "C. 我在一个新杯子买。",
          "D. 我是个新杯子买了。"
        ],
        correctAnswer: "A. 我买了一个新杯子。",
        explanation: "Dùng trợ từ '了' ngay sau động từ để chỉ hành động hoàn tất: 买了一个新杯子."
      }
    ]
  },

  // LESSON 15
  {
    lessonNumber: 15,
    titleHanzi: "我是坐飞机来的",
    titlePinyin: "Wǒ shì zuò fēijī lái de",
    titleVietnamese: "Tôi đến đây bằng máy bay",
    pageStart: 99,
    objectives: [
      "Nắm vững cấu trúc nhấn mạnh '是……的' (thời gian, địa điểm, phương thức thực hiện).",
      "Kể về cách quen biết bạn bè (认识) và trải nghiệm đi lại.",
      "Ôn tập toàn diện chuẩn đầu ra HSK 1 (150 từ vựng và ngữ pháp trọng tâm)."
    ],
    texts: [
      {
        id: "hsk1-l15-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在学校谈论出行方式。(Ở trường nói về phương tiện đến đây).",
        lines: [
          { speaker: "A", hanzi: "你是什么时候来的？", pinyin: "Nǐ shì shénme shíhou lái de?", vietnamese: "Bạn đến từ lúc nào thế?" },
          { speaker: "B", hanzi: "我是昨天早上来的。", pinyin: "Wǒ shì zuótiān zǎoshang lái de.", vietnamese: "Tôi đến sáng hôm qua." },
          { speaker: "A", hanzi: "你是怎么来的？", pinyin: "Nǐ shì zěnme lái de?", vietnamese: "Bạn đến đây bằng cách nào?" },
          { speaker: "B", hanzi: "我是坐飞机来的。", pinyin: "Wǒ shì zuò fēijī lái de.", vietnamese: "Tôi đến bằng máy bay." }
        ]
      },
      {
        id: "hsk1-l15-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "谈论相识。(Kể về lần đầu quen nhau).",
        lines: [
          { speaker: "A", hanzi: "你和李小姐是什么时候认识的？", pinyin: "Nǐ hé Lǐ xiǎojiě shì shénme shíhou rènshi de?", vietnamese: "Bạn và cô Lý quen nhau khi nào thế?" },
          { speaker: "B", hanzi: "我们是2011年9月认识的。", pinyin: "Wǒmen shì èr líng yī yī nián jiǔ yuè rènshi de.", vietnamese: "Chúng tôi quen nhau vào tháng 9 năm 2011." },
          { speaker: "A", hanzi: "你们是在哪儿认识的？", pinyin: "Nǐmen shì zài nǎr rènshi de?", vietnamese: "Các bạn quen nhau ở đâu?" },
          { speaker: "B", hanzi: "我们是在大学认识的，她是我的大学同学。", pinyin: "Wǒmen shì zài dàxué rènshi de, tā shì wǒ de dàxué tóngxué.", vietnamese: "Chúng tôi quen nhau ở trường đại học, cô ấy là bạn đại học của tôi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l15-g1",
        title: "1. Cấu trúc nhấn mạnh '是……的'",
        explanation: "Khi sự việc đã xảy ra trong quá khứ, dùng '是……的' để nhấn mạnh thời gian, địa điểm hoặc phương thức thực hiện hành động. Phủ định: 不是……的.",
        examples: [
          { hanzi: "我是坐飞机来的。(Nhấn mạnh phương tiện)", pinyin: "Wǒ shì zuò fēijī lái de.", vietnamese: "Tôi đến bằng máy bay đấy." },
          { hanzi: "我们是在北京认识的。(Nhấn mạnh địa điểm)", pinyin: "Wǒmen shì zài Běijīng rènshi de.", vietnamese: "Chúng tôi quen nhau ở Bắc Kinh." },
          { hanzi: "他不是今天来的。(Phủ định)", pinyin: "Tā bú shì jīntiān lái de.", vietnamese: "Anh ấy không phải đến hôm nay." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk1-l15-w1", hanzi: "认识", pinyin: "rènshi", hanViet: "nhận thức", vietnamese: "quen biết, nhận ra", hskLevel: 1, radical: "讠", strokeCount: 19, example: "很高兴认识你！", exampleTranslation: "Rất vui được quen biết bạn!", tags: ["Bài 15", "Động từ"] },
      { id: "hsk1-l15-w2", hanzi: "年", pinyin: "nián", hanViet: "niên", vietnamese: "năm", hskLevel: 1, radical: "干", strokeCount: 6, example: "去年 / 今年", exampleTranslation: "năm ngoái / năm nay", tags: ["Bài 15", "Thời gian"] },
      { id: "hsk1-l15-w3", hanzi: "大学", pinyin: "dàxué", hanViet: "đại học", vietnamese: "trường đại học", hskLevel: 1, radical: "大", strokeCount: 11, example: "读大学", exampleTranslation: "học đại học", tags: ["Bài 15", "Giáo dục"] },
      { id: "hsk1-l15-w4", hanzi: "饭店", pinyin: "fàndiàn", hanViet: "phạn điếm", vietnamese: "nhà hàng, khách sạn", hskLevel: 1, radical: "饣", strokeCount: 16, example: "去饭店吃饭", exampleTranslation: "đến nhà hàng ăn cơm", tags: ["Bài 15", "Địa điểm"] },
      { id: "hsk1-l15-w5", hanzi: "出租车", pinyin: "chūzūchē", hanViet: "xuất tô xa", vietnamese: "xe taxi", hskLevel: 1, radical: "车", strokeCount: 19, example: "坐出租车", exampleTranslation: "đi xe taxi", tags: ["Bài 15", "Phương tiện"] },
      { id: "hsk1-l15-w6", hanzi: "一起", pinyin: "yìqǐ", hanViet: "nhất khởi", vietnamese: "cùng nhau", hskLevel: 1, radical: "一", strokeCount: 11, example: "一起去", exampleTranslation: "cùng nhau đi", tags: ["Bài 15", "Phó từ"] },
      { id: "hsk1-l15-w7", hanzi: "高兴", pinyin: "gāoxìng", hanViet: "cao hứng", vietnamese: "vui vẻ, phấn khởi", hskLevel: 1, radical: "高", strokeCount: 16, example: "今天很高兴。", exampleTranslation: "Hôm nay rất vui.", tags: ["Bài 15", "Tính từ"] },
      { id: "hsk1-l15-w8", hanzi: "听", pinyin: "tīng", hanViet: "thính", vietnamese: "nghe", hskLevel: 1, radical: "口", strokeCount: 7, example: "听音乐", exampleTranslation: "nghe nhạc", tags: ["Bài 15", "Động từ"] },
      { id: "hsk1-l15-w9", hanzi: "飞机", pinyin: "fēijī", hanViet: "phi cơ", vietnamese: "máy bay", hskLevel: 1, radical: "飞", strokeCount: 9, example: "坐飞机去中国", exampleTranslation: "đi máy bay đến Trung Quốc", tags: ["Bài 15", "Phương tiện"] }
    ],
    exercises: [
      {
        id: "hsk1-l15-ex1",
        type: "multiple_choice",
        question: "Muốn nhấn mạnh 'Tôi đến Bắc Kinh bằng máy bay', câu chuẩn ngữ pháp là:",
        options: [
          "A. 我是坐飞机来北京的。",
          "B. 我做飞机来了北京。",
          "C. 我坐飞机是在北京来。",
          "D. 是我坐飞机北京来。"
        ],
        correctAnswer: "A. 我是坐飞机来北京的。",
        explanation: "Cấu trúc nhấn mạnh phương thức: 我是 + 坐飞机 + 来北京 + 的."
      }
    ],
    cultureBonus: {
      title: "HSK 1 结业寄语 (Lời chúc tốt nghiệp HSK 1)",
      summary: "Chúc mừng bạn đã hoàn thành trọn vẹn 15 bài học chuẩn HSK 1!",
      content: "Bạn đã làm chủ 150 từ vựng cốt lõi và các mẫu câu cơ bản nhất để giao tiếp hàng ngày bằng tiếng Hán. Hãy tiến bước lên New HSK 2 để mở khóa thêm nhiều chủ đề thú vị!"
    }
  }
];

export const getAllNewHsk1Vocabulary = (): WordItem[] => {
  const map = new Map<string, WordItem>();
  NEW_HSK1_FULL_LESSONS.forEach((lesson) => {
    lesson.vocabulary.forEach((w) => {
      if (!map.has(w.hanzi)) {
        map.set(w.hanzi, w);
      }
    });
  });
  return Array.from(map.values());
};
