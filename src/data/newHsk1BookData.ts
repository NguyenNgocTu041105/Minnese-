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
  speakerAnchors?: Record<string, number>;
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
  warmUp?: any;
  exercises: ExerciseItem[];
  tongueTwister?: TongueTwister;
  cultureBonus?: CultureBonus;
}

export const NEW_HSK1_FULL_LESSONS: DetailedTextbookLesson[] = [
  // ==========================================================================
  // LESSON 1: AI小语，你好！ (Chào AI Tiểu Ngữ!)
  // ==========================================================================
  {
    lessonNumber: 1,
    titleHanzi: "AI小语，你好！",
    titlePinyin: "AI Xiǎoyǔ, nǐ hǎo!",
    titleVietnamese: "Chào AI Tiểu Ngữ!",
    pageStart: 1,
    objectives: [
      "能听懂并使用礼貌用语打招呼、致谢、告别 (Nghe hiểu và sử dụng lời nói lịch sự để chào hỏi, cảm ơn, tạm biệt).",
      "了解中文交际礼仪，能听懂并使用第二人称代词敬称“您” (Hiểu về nghi thức giao tiếp tiếng Trung, nghe hiểu và dùng đại từ tôn kính “您”).",
    ],
    texts: [
      {
        id: "hsk1-l1-t1",
        title: "课文 1: 在办公室 (Trong văn phòng)",
        context: "开学第一天，在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: 'AI小语，你好！')",
        speakerAnchors: { "王一飞": 40, "小语": 73 },
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "AI小语，你好！", pinyin: "AI Xiǎoyǔ, nǐ hǎo!", vietnamese: "Chào trợ lý AI Tiểu Ngữ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "王老师，你好！", pinyin: "Wáng lǎoshī, nǐ hǎo!", vietnamese: "Em chào cô giáo Vương ạ!" }
        ]
      },
      {
        id: "hsk1-l1-t2",
        title: "课文 2: 在课堂上 (Trong lớp học)",
        context: "开学第一天，课堂上，学生们学习打招呼用语。(Trong lớp học, các bạn học sinh học cách chào hỏi).",
        speakerAnchors: { "学生们": 38, "王一飞": 66, "小语": 81 },
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "大家好！", pinyin: "Dàjiā hǎo!", vietnamese: "Cô chào cả lớp!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "老师，您好！", pinyin: "Lǎoshī, nín hǎo!", vietnamese: "Chúng em kính chào cô giáo ạ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "你们好！", pinyin: "Nǐmen hǎo!", vietnamese: "Chào các bạn học sinh!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "你好，小语！", pinyin: "Nǐ hǎo, Xiǎoyǔ!", vietnamese: "Chào bạn Tiểu Ngữ nhé!" }
        ]
      },
      {
        id: "hsk1-l1-t3",
        title: "课文 3: 课堂致谢与告别 (Cảm ơn và Tạm biệt)",
        context: "开学第一天，课堂上，学生们学习致谢语、告别语。(Cuối buổi học, học sinh nói lời cảm ơn và chào tạm biệt).",
        speakerAnchors: { "学生们": 42, "王一飞": 74, "小语": 85 },
        lines: [
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "谢谢！", pinyin: "Xièxie!", vietnamese: "Chúng em cảm ơn cô ạ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "不客气！", pinyin: "Bú kèqi!", vietnamese: "Không có chi đâu các bạn!" },
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "同学们，再见！", pinyin: "Tóngxuémen, zàijiàn!", vietnamese: "Tạm biệt các em nhé!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "老师，再见！", pinyin: "Lǎoshī, zàijiàn!", vietnamese: "Chúng em chào cô ạ!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l1-g1",
        title: "1. 问候与礼貌表达 (Câu chào hỏi và cách xưng hô lịch sự)",
        explanation: "Trong tiếng Trung, chào hỏi cơ bản nhất là dùng đại từ nhân xưng hoặc danh xưng + '好' (hǎo). Để thể hiện sự tôn trọng, lịch sự với người lớn tuổi, thầy cô giáo hoặc cấp trên, dùng đại từ kính trọng '您' (nín) thay cho '你' (nǐ). Khi chào nhiều người, dùng '你们' (nǐmen) hoặc '大家' (dàjiā).",
        examples: [
          {
            hanzi: "你好！",
            pinyin: "Nǐ hǎo!",
            vietnamese: "Chào bạn!"
          },
          {
            hanzi: "老师，您好！",
            pinyin: "Lǎoshī, nín hǎo!",
            vietnamese: "Em chào thầy/cô ạ!"
          },
          {
            hanzi: "同学们好！",
            pinyin: "Tóngxuémen hǎo!",
            vietnamese: "Chào các em học sinh!"
          },
          {
            hanzi: "大家好！",
            pinyin: "Dàjiā hǎo!",
            vietnamese: "Chào mọi người!"
          },
        ]
      },
      {
        id: "hsk1-l1-g2",
        title: "2. Quy tắc biến điệu hai thanh 3 (Tone Sandhi)",
        explanation: "Khi hai âm tiết mang thanh 3 (thanh hỏi) đi liền nhau, âm tiết thứ nhất sẽ biến điệu đọc thành thanh 2 (thanh sắc), âm tiết thứ hai vẫn giữ nguyên thanh 3. Ký hiệu phiên âm vẫn giữ nguyên thanh 3 gốc trên chữ viết. Công thức: 3 + 3 -> 2 + 3.",
        examples: [
          {
            hanzi: "你好 (nǐ + hǎo)",
            pinyin: "ní hǎo",
            vietnamese: "Xin chào (nǐ đổi thành ní)"
          },
          {
            hanzi: "很好 (hěn + hǎo)",
            pinyin: "hén hǎo",
            vietnamese: "Rất tốt (hěn đổi thành hén)"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l1-w1", "hanzi": "不客气", "pinyin": "bú kèqi", "hanViet": "bất khách khí", "vietnamese": "không có gì, đừng khách sáo", "hskLevel": 1, "radical": "一", "strokeCount": 17, "example": "谢谢你！——不客气！", "exampleTranslation": "Cảm ơn bạn! —— Không có gì!", "tags": ["Bài 1", "Giao tiếp"]},
      {"id": "hsk1-l1-w2", "hanzi": "大家", "pinyin": "dàjiā", "hanViet": "đại gia", "vietnamese": "mọi người, cả nhà", "hskLevel": 1, "radical": "大", "strokeCount": 13, "example": "大家好！", "exampleTranslation": "Chào mọi người!", "tags": ["Bài 1", "Đại từ"]},
      {"id": "hsk1-l1-w3", "hanzi": "好", "pinyin": "hǎo", "hanViet": "hảo", "vietnamese": "tốt, khỏe, đẹp, ngon", "hskLevel": 1, "radical": "女", "strokeCount": 6, "example": "你好！", "exampleTranslation": "Chào bạn!", "tags": ["Bài 1", "Tính từ"]},
      {"id": "hsk1-l1-w4", "hanzi": "老师", "pinyin": "lǎoshī", "hanViet": "lão sư", "vietnamese": "thầy giáo, cô giáo, giáo viên", "hskLevel": 1, "radical": "耂", "strokeCount": 12, "example": "王老师好！", "exampleTranslation": "Em chào cô Vương ạ!", "tags": ["Bài 1", "Danh từ"]},
      {"id": "hsk1-l1-w5", "hanzi": "们", "pinyin": "men", "hanViet": "môn", "vietnamese": "các, chúng (hậu tố chỉ số nhiều)", "hskLevel": 1, "radical": "亻", "strokeCount": 5, "example": "同学们好！", "exampleTranslation": "Chào các em học sinh!", "tags": ["Bài 1", "Hậu tố"]},
      {"id": "hsk1-l1-w6", "hanzi": "你好", "pinyin": "nǐ hǎo", "hanViet": "nhĩ hảo", "vietnamese": "xin chào, chào bạn", "hskLevel": 1, "radical": "亻", "strokeCount": 13, "example": "你好，李文！", "exampleTranslation": "Chào bạn, Lý Văn!", "tags": ["Bài 1", "Giao tiếp"]},
      {"id": "hsk1-l1-w7", "hanzi": "你们", "pinyin": "nǐmen", "hanViet": "nhĩ môn", "vietnamese": "các bạn, các anh chị", "hskLevel": 1, "radical": "亻", "strokeCount": 12, "example": "你们好！", "exampleTranslation": "Chào các bạn học sinh!", "tags": ["Bài 1", "Đại từ"]},
      {"id": "hsk1-l1-w8", "hanzi": "您", "pinyin": "nín", "hanViet": "nẫm", "vietnamese": "ông, ngài, thầy (kính ngữ của 你)", "hskLevel": 1, "radical": "心", "strokeCount": 11, "example": "老师，您好！", "exampleTranslation": "Em kính chào thầy cô ạ!", "tags": ["Bài 1", "Đại từ"]},
      {"id": "hsk1-l1-w9", "hanzi": "同学", "pinyin": "tóngxué", "hanViet": "đồng học", "vietnamese": "bạn cùng lớp, bạn học", "hskLevel": 1, "radical": "口", "strokeCount": 14, "example": "同学们好！", "exampleTranslation": "Chào các bạn học sinh!", "tags": ["Bài 1", "Danh từ"]},
      {"id": "hsk1-l1-w10", "hanzi": "谢谢", "pinyin": "xièxie", "hanViet": "tạ tạ", "vietnamese": "cảm ơn", "hskLevel": 1, "radical": "讠", "strokeCount": 24, "example": "谢谢你！", "exampleTranslation": "Cảm ơn bạn!", "tags": ["Bài 1", "Động từ / Giao tiếp"]},
      {"id": "hsk1-l1-w11", "hanzi": "学生", "pinyin": "xuésheng", "hanViet": "học sinh", "vietnamese": "học sinh, học trò", "hskLevel": 1, "radical": "子", "strokeCount": 13, "example": "王老师有很多学生。", "exampleTranslation": "Cô Vương có rất nhiều học sinh.", "tags": ["Bài 1", "Danh từ"]},
      {"id": "hsk1-l1-w12", "hanzi": "再见", "pinyin": "zàijiàn", "hanViet": "tái kiến", "vietnamese": "tạm biệt, hẹn gặp lại", "hskLevel": 1, "radical": "冂", "strokeCount": 10, "example": "王老师，再见！", "exampleTranslation": "Chào cô Vương, hẹn gặp lại ạ!", "tags": ["Bài 1", "Giao tiếp"]},
      {"id": "hsk1-l1-w13", "hanzi": "王老师", "pinyin": "Wáng lǎoshī", "hanViet": "vương lão sư", "vietnamese": "thầy/cô Vương", "hskLevel": 1, "radical": "王", "strokeCount": 16, "example": "王老师是我们的中文老师。", "exampleTranslation": "Cô Vương là giáo viên tiếng Trung của chúng tôi.", "tags": ["Bài 1", "Danh từ riêng"]},
    ],
    exercises: [
      {
        id: "hsk1-l1-ex1",
        type: "multiple_choice",
        question: "Khi chào thầy cô giáo hoặc người lớn tuổi hơn mình một cách tôn kính, nên nói thế nào?",
        options: ["A. 你好！", "B. 您好！", "C. 你们好！", "D. 大家好！"],
        correctAnswer: "B. 您好！",
        explanation: "Dùng '您好！' (nín hǎo) để thể hiện sự kính trọng, lịch sự với người trên, thầy cô giáo."
      },
      {
        id: "hsk1-l1-ex2",
        type: "multiple_choice",
        question: "Khi người khác nói '谢谢你！' (Cảm ơn bạn!), bạn nên đáp lại như thế nào?",
        options: ["A. 再见！", "B. 不客气！", "C. 你好！", "D. 对不起！"],
        correctAnswer: "B. 不客气！",
        explanation: "Khi được cảm ơn ('谢谢'), ta đáp lại bằng '不客气！' (Đừng khách sáo / Không có chi)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 2: 我叫李文 (Tôi tên là Lý Văn)
  // ==========================================================================
  {
    lessonNumber: 2,
    titleHanzi: "我叫李文",
    titlePinyin: "Wǒ jiào Lǐ Wén",
    titleVietnamese: "Tôi tên là Lý Văn",
    pageStart: 5,
    objectives: [
      "能听懂并使用中文姓名自我介绍 (Nghe hiểu và sử dụng tên tiếng Trung để tự giới thiệu bản thân).",
      "能听懂并使用致歉语，用“对不起”和“没关系”表达歉意和回应 (Nghe hiểu và dùng “对不起” xin lỗi, “没关系” đáp lại).",
      "掌握汉语的基本语序 (Nắm vững trật tự từ cơ bản trong câu tiếng Trung).",
      "了解中文姓名的构成 (Hiểu rõ về cấu tạo họ và tên trong tiếng Trung).",
    ],
    texts: [
      {
        id: "hsk1-l2-t1",
        title: "课文 1: 在教室里 (Trong lớp học)",
        context: "在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi tên học sinh).",
        speakerAnchors: { "陈天中": 26, "王一飞": 75 },
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "请问，你叫什么名字？", pinyin: "Qǐngwèn, nǐ jiào shénme míngzi?", vietnamese: "Xin hỏi em tên là gì nào?" },
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "我叫陈天中。", pinyin: "Wǒ jiào Chén Tiānzhōng.", vietnamese: "Dạ thưa cô, em tên là Trần Thiên Trung ạ." }
        ]
      },
      {
        id: "hsk1-l2-t2",
        title: "课文 2: 在校园里 (Trên sân trường)",
        context: "在校园里，陈天中和白家月打招呼时认错了人。(Trên sân trường, Trần Thiên Trung chào nhầm Bạch Gia Nguyệt thành Annie).",
        speakerAnchors: { "陈天中": 39, "白家月": 66 },
        lines: [
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "你好，安妮！", pinyin: "Nǐ hǎo, Ānnī!", vietnamese: "Chào Annie nhé!" },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "你好，陈天中！我不是安妮，我是白家月。", pinyin: "Nǐ hǎo, Chén Tiānzhōng! Wǒ bú shì Ānnī, wǒ shì Bái Jiāyuè.", vietnamese: "Chào cậu, Trần Thiên Trung! Tớ không phải Annie đâu, tớ là Bạch Gia Nguyệt cơ." },
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "对不起！", pinyin: "Duìbuqǐ!", vietnamese: "Ôi tớ xin lỗi cậu nhé!" },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "没关系！", pinyin: "Méi guānxi!", vietnamese: "Không sao đâu cậu!" }
        ]
      },
      {
        id: "hsk1-l2-t3",
        title: "课文 3: 初次相遇 (Lần đầu gặp mặt)",
        context: "在校园里，李文和白家月第一次相遇。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau).",
        speakerAnchors: { "李文": 28, "白家月": 77 },
        lines: [
          { speaker: "李文 (Lý Văn)", avatar: "👨‍🎓", hanzi: "你好！我叫李文。", pinyin: "Nǐ hǎo! Wǒ jiào Lǐ Wén.", vietnamese: "Chào bạn! Mình tên là Lý Văn." },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "你好！我叫白家月。", pinyin: "Nǐ hǎo! Wǒ jiào Bái Jiāyuè.", vietnamese: "Chào bạn! Mình là Bạch Gia Nguyệt." },
          { speaker: "李文 (Lý Văn)", avatar: "👨‍🎓", hanzi: "很高兴认识你。", pinyin: "Hěn gāoxìng rènshi nǐ.", vietnamese: "Rất vui được làm quen với bạn nhé." },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "认识你我也很高兴。", pinyin: "Rènshi nǐ wǒ yě hěn gāoxìng.", vietnamese: "Mình cũng rất vui được làm quen với bạn!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l2-g1",
        title: "1. 汉语的基本语序 (Trật tự từ cơ bản trong tiếng Trung)",
        explanation: "Trật tự từ cơ bản trong câu tiếng Trung tương tự tiếng Việt: Chủ ngữ (S) + Vị ngữ (V) + Tân ngữ (O). Khi hỏi tên hoặc giới thiệu tên, dùng động từ '叫' (jiào): 'Chủ ngữ + 叫 + Tên'. Khi hỏi thông tin dùng đại từ nghi vấn '什么' (shénme): '你叫什么名字？'.",
        examples: [
          {
            hanzi: "我叫李文。",
            pinyin: "Wǒ jiào Lǐ Wén.",
            vietnamese: "Tôi tên là Lý Văn."
          },
          {
            hanzi: "请问，你叫什么名字？",
            pinyin: "Qǐngwèn, nǐ jiào shénme míngzi?",
            vietnamese: "Xin hỏi, bạn tên là gì?"
          },
          {
            hanzi: "很高兴认识你！",
            pinyin: "Hěn gāoxìng rènshi nǐ!",
            vietnamese: "Rất vui được làm quen với bạn!"
          },
        ]
      },
      {
        id: "hsk1-l2-g2",
        title: "2. Lời xin lỗi và đáp lại (对不起 / 没关系 / 没事)",
        explanation: "Khi cần xin lỗi vì làm phiền hoặc làm sai điều gì, ta nói '对不起' (duìbuqǐ). Người đối diện đáp lại sự tha thứ bằng '没关系' (méi guānxi) hoặc '没事' (méishì - không sao đâu).",
        examples: [
          {
            hanzi: "对不起，我迟到了。",
            pinyin: "Duìbuqǐ, wǒ chídào le.",
            vietnamese: "Xin lỗi, tôi đến muộn."
          },
          {
            hanzi: "没关系，请坐。",
            pinyin: "Méi guānxi, qǐng zuò.",
            vietnamese: "Không sao đâu, mời ngồi."
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l2-w1", "hanzi": "不", "pinyin": "bù", "hanViet": "bất", "vietnamese": "không (phó từ phủ định)", "hskLevel": 1, "radical": "一", "strokeCount": 4, "example": "我不是老师，我是学生。", "exampleTranslation": "Tôi không phải giáo viên, tôi là học sinh.", "tags": ["Bài 2", "Phó từ"]},
      {"id": "hsk1-l2-w2", "hanzi": "对不起", "pinyin": "duìbuqǐ", "hanViet": "đối bất khởi", "vietnamese": "xin lỗi", "hskLevel": 1, "radical": "寸", "strokeCount": 17, "example": "对不起，我迟到了。", "exampleTranslation": "Xin lỗi, tôi đến muộn.", "tags": ["Bài 2", "Giao tiếp"]},
      {"id": "hsk1-l2-w3", "hanzi": "高兴", "pinyin": "gāoxìng", "hanViet": "cao hưng", "vietnamese": "vui vẻ, phấn khởi", "hskLevel": 1, "radical": "高", "strokeCount": 16, "example": "很高兴认识你！", "exampleTranslation": "Rất vui được làm quen với bạn!", "tags": ["Bài 2", "Tính từ"]},
      {"id": "hsk1-l2-w4", "hanzi": "很", "pinyin": "hěn", "hanViet": "khẩn", "vietnamese": "rất, lắm", "hskLevel": 1, "radical": "彳", "strokeCount": 9, "example": "我很好，谢谢！", "exampleTranslation": "Tôi rất khỏe, cảm ơn bạn!", "tags": ["Bài 2", "Phó từ"]},
      {"id": "hsk1-l2-w5", "hanzi": "叫", "pinyin": "jiào", "hanViet": "khiếu", "vietnamese": "tên là, gọi là, gọi", "hskLevel": 1, "radical": "口", "strokeCount": 5, "example": "我叫李文。", "exampleTranslation": "Tôi tên là Lý Văn.", "tags": ["Bài 2", "Động từ"]},
      {"id": "hsk1-l2-w6", "hanzi": "没关系", "pinyin": "méi guānxi", "hanViet": "một quan hệ", "vietnamese": "không sao đâu, không có chi", "hskLevel": 1, "radical": "氵", "strokeCount": 17, "example": "对不起！——没关系！", "exampleTranslation": "Xin lỗi! —— Không sao đâu cậu!", "tags": ["Bài 2", "Giao tiếp"]},
      {"id": "hsk1-l2-w7", "hanzi": "没事", "pinyin": "méishì", "hanViet": "một sự", "vietnamese": "không có việc gì, không sao cả", "hskLevel": 1, "radical": "氵", "strokeCount": 15, "example": "没事，不要紧。", "exampleTranslation": "Không sao cả, đừng bận tâm.", "tags": ["Bài 2", "Giao tiếp"]},
      {"id": "hsk1-l2-w8", "hanzi": "名字", "pinyin": "míngzi", "hanViet": "danh tự", "vietnamese": "tên gọi, họ tên", "hskLevel": 1, "radical": "夕", "strokeCount": 12, "example": "你叫什么名字？", "exampleTranslation": "Bạn tên là gì?", "tags": ["Bài 2", "Danh từ"]},
      {"id": "hsk1-l2-w9", "hanzi": "你", "pinyin": "nǐ", "hanViet": "nhĩ", "vietnamese": "bạn, anh, chị (ngôi thứ 2 số ít)", "hskLevel": 1, "radical": "亻", "strokeCount": 7, "example": "你好！", "exampleTranslation": "Chào bạn!", "tags": ["Bài 2", "Đại từ"]},
      {"id": "hsk1-l2-w10", "hanzi": "请问", "pinyin": "qǐngwèn", "hanViet": "thỉnh vấn", "vietnamese": "xin hỏi, làm phiền cho hỏi", "hskLevel": 1, "radical": "讠", "strokeCount": 16, "example": "请问，你叫什么名字？", "exampleTranslation": "Xin hỏi, bạn tên là gì?", "tags": ["Bài 2", "Giao tiếp"]},
      {"id": "hsk1-l2-w11", "hanzi": "认识", "pinyin": "rènshi", "hanViet": "nhận thức", "vietnamese": "quen biết, nhận biết", "hskLevel": 1, "radical": "讠", "strokeCount": 11, "example": "很高兴认识你！", "exampleTranslation": "Rất vui được quen biết bạn!", "tags": ["Bài 2", "Động từ"]},
      {"id": "hsk1-l2-w12", "hanzi": "什么", "pinyin": "shénme", "hanViet": "thập ma", "vietnamese": "cái gì, gì", "hskLevel": 1, "radical": "亻", "strokeCount": 7, "example": "你叫什么名字？", "exampleTranslation": "Bạn tên là gì?", "tags": ["Bài 2", "Đại từ"]},
      {"id": "hsk1-l2-w13", "hanzi": "是", "pinyin": "shì", "hanViet": "thị", "vietnamese": "là, đúng (động từ phán đoán)", "hskLevel": 1, "radical": "日", "strokeCount": 9, "example": "我是中国人。", "exampleTranslation": "Mình là người Trung Quốc.", "tags": ["Bài 2", "Động từ"]},
      {"id": "hsk1-l2-w14", "hanzi": "我", "pinyin": "wǒ", "hanViet": "ngã", "vietnamese": "tôi, mình, tớ", "hskLevel": 1, "radical": "戈", "strokeCount": 7, "example": "我叫李文。", "exampleTranslation": "Tôi tên là Lý Văn.", "tags": ["Bài 2", "Đại từ"]},
      {"id": "hsk1-l2-w15", "hanzi": "也", "pinyin": "yě", "hanViet": "dã", "vietnamese": "cũng (phó từ biểu thị sự tương đồng)", "hskLevel": 1, "radical": "乙", "strokeCount": 3, "example": "我爸爸也在医院工作。", "exampleTranslation": "Bố tôi cũng làm việc ở bệnh viện.", "tags": ["Bài 2", "Phó từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l2-ex1",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu hoàn chỉnh giới thiệu tên:",
        scrambleSegments: ["李文", "叫", "我"],
        options: ["我叫李文", "李文叫我", "叫我李文"],
        correctAnswer: "我叫李文",
        explanation: "Trật tự câu giới thiệu tên: Chủ ngữ (我) + Động từ (叫) + Tên riêng (李文)."
      },
      {
        id: "hsk1-l2-ex2",
        type: "multiple_choice",
        question: "Khi vô tình va vào ai đó, bạn nói '对不起！', người kia sẽ đáp lại:",
        options: ["A. 不客气", "B. 没关系", "C. 谢谢", "D. 再见"],
        correctAnswer: "B. 没关系",
        explanation: "Đáp lại lời xin lỗi '对不起' là '没关系' (Không sao đâu)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 3: 我是中国人 (Tôi là người Trung Quốc)
  // ==========================================================================
  {
    lessonNumber: 3,
    titleHanzi: "我是中国人",
    titlePinyin: "Wǒ shì Zhōngguó rén",
    titleVietnamese: "Tôi là người Trung Quốc",
    pageStart: 10,
    objectives: [
      "能听懂并使用“是”字句表达等同或类属 (Nghe hiểu và sử dụng câu chữ “是” biểu đạt phán đoán, phân loại hoặc khẳng định quốc tịch).",
      "掌握结构助词“的”的用法 (Nắm vững cách dùng của trợ từ kết cấu “的”).",
      "掌握用“吗”的是非问句的用法 (Nắm vững cách dùng câu hỏi đúng-sai dùng “吗”).",
    ],
    texts: [
      {
        id: "hsk1-l3-t1",
        title: "课文 1: 在校园里 (Bài khóa 1: Trên sân trường)",
        context: "在校园里，李文和白家月第一次相遇，两人继续聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau, hai người tiếp tục trò chuyện).",
        speakerAnchors: { "李文": 31, "白家月": 79 },
        lines: [
          { speaker: "李文", hanzi: "我是中国人。", pinyin: "Wǒ shì Zhōngguó rén.", vietnamese: "Mình là người Trung Quốc." },
          { speaker: "白家月", hanzi: "我是法国人。我的中文老师也是中国人。", pinyin: "Wǒ shì Fǎguó rén. Wǒ de Zhōngwén lǎoshī yě shì Zhōngguó rén.", vietnamese: "Còn mình là người Pháp. Cô giáo dạy tiếng Trung của mình cũng là người Trung Quốc đấy." }
        ]
      },
      {
        id: "hsk1-l3-t2",
        title: "课文 2: 在教室里 (Bài khóa 2: Trong lớp học)",
        context: "在教室里，下课后，安妮在看陈天中手机里的照片。(Trong lớp học, sau giờ học, Annie xem ảnh trên điện thoại của Trần Thiên Trung).",
        speakerAnchors: { "陈天中": 42, "安妮": 64 },
        lines: [
          { speaker: "安妮", hanzi: "这是谁？", pinyin: "Zhè shì shéi?", vietnamese: "Ai đây hả cậu?" },
          { speaker: "陈天中", hanzi: "这是我女朋友。", pinyin: "Zhè shì wǒ nǚpéngyou.", vietnamese: "Bạn gái tớ đấy." },
          { speaker: "安妮", hanzi: "你女朋友是哪国人？", pinyin: "Nǐ nǚpéngyou shì nǎ guó rén?", vietnamese: "Bạn gái cậu là người nước nào thế?" },
          { speaker: "陈天中", hanzi: "她也是泰国人。", pinyin: "Tā yě shì Tàiguó rén.", vietnamese: "Cô ấy cũng là người Thái Lan giống tớ." }
        ]
      },
      {
        id: "hsk1-l3-t3",
        title: "课文 3: 在家里 (Bài khóa 3: Ở nhà)",
        context: "在家里，王一雪给王一飞打视频电话。(Ở nhà, Vương Nhất Tuyết gọi điện thoại video cho cô giáo Vương Nhất Phi).",
        speakerAnchors: { "王一雪": 70, "王一飞": 45 },
        lines: [
          { speaker: "王一雪", hanzi: "喂，一飞！", pinyin: "Wèi, Yīfēi!", vietnamese: "A lô, Nhất Phi à em!" },
          { speaker: "王一飞", hanzi: "姐姐！", pinyin: "Jiějie!", vietnamese: "Dạ, em nghe đây chị!" },
          { speaker: "王一雪", hanzi: "你工作还忙吗？", pinyin: "Nǐ gōngzuò hái máng ma?", vietnamese: "Dạo này công việc của em còn bận lắm không?" },
          { speaker: "王一飞", hanzi: "对，还很忙。你也很忙吗？", pinyin: "Duì, hái hěn máng. Nǐ yě hěn máng ma?", vietnamese: "Dạ vâng, em vẫn bận lắm chị ạ. Chị dạo này cũng bận lắm hả chị?" },
          { speaker: "王一雪", hanzi: "我不太忙。我们很想你。", pinyin: "Wǒ bú tài máng. Wǒmen hěn xiǎng nǐ.", vietnamese: "Chị không bận lắm. Cả nhà mình ai cũng nhớ em nhiều lắm đấy." },
          { speaker: "王一飞", hanzi: "我也很想你们。", pinyin: "Wǒ yě hěn xiǎng nǐmen.", vietnamese: "Em cũng nhớ mọi người nhiều lắm chị ạ." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l3-g1",
        title: "1. “是”字句 (Cấu trúc câu phán đoán chữ “是”)",
        explanation: "Câu chữ “是” (shì) biểu thị sự phán đoán, đồng nhất hoặc phân loại người/vật. Khẳng định: 'A 是 B'. Phủ định: 'A 不是 B'.",
        examples: [
          {
            hanzi: "我是中国人。",
            pinyin: "Wǒ shì Zhōngguó rén.",
            vietnamese: "Mình là người Trung Quốc."
          },
          {
            hanzi: "我不是法国人。",
            pinyin: "Wǒ bú shì Fǎguó rén.",
            vietnamese: "Tôi không phải người Pháp."
          },
          {
            hanzi: "他是我的中文老师。",
            pinyin: "Tā shì wǒ de Zhōngwén lǎoshī.",
            vietnamese: "Thầy ấy là giáo viên tiếng Trung của tôi."
          },
        ]
      },
      {
        id: "hsk1-l3-g2",
        title: "2. 结构助词“的” (Trợ từ kết cấu “的”)",
        explanation: "Trợ từ '的' (de) dùng để nối định ngữ và trung tâm ngữ. Công thức: 'Định ngữ (người/vật sở hữu hoặc tính chất) + 的 + Trung tâm ngữ'. Khi biểu thị quan hệ họ hàng thân thuộc hoặc đơn vị gắn bó mật thiết, '的' có thể được lược bỏ.",
        examples: [
          {
            hanzi: "这是我的书。",
            pinyin: "Zhè shì wǒ de shū.",
            vietnamese: "Đây là sách của tôi."
          },
          {
            hanzi: "我的女朋友是泰国人。",
            pinyin: "Wǒ de nǚpéngyou shì Tàiguó rén.",
            vietnamese: "Bạn gái tôi là người Thái Lan."
          },
        ]
      },
      {
        id: "hsk1-l3-g3",
        title: "3. 用“吗”的是非问句 (Câu hỏi đúng - sai dùng “吗”)",
        explanation: "Thêm trợ từ nghi vấn '吗' (ma) vào cuối câu trần thuật để chuyển thành câu hỏi Có/Không (Yes-No Question). Trật tự từ trong câu không thay đổi.",
        examples: [
          {
            hanzi: "你是中国人吗？",
            pinyin: "Nǐ shì Zhōngguó rén ma?",
            vietnamese: "Bạn là người Trung Quốc phải không?"
          },
          {
            hanzi: "你工作忙吗？",
            pinyin: "Nǐ gōngzuò máng ma?",
            vietnamese: "Công việc của bạn bận không?"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l3-w1", "hanzi": "的", "pinyin": "de", "hanViet": "đích", "vietnamese": "của (trợ từ kết cấu biểu thị sở hữu hoặc bổ nghĩa)", "hskLevel": 1, "radical": "白", "strokeCount": 8, "example": "这是我的汉语书。", "exampleTranslation": "Đây là sách tiếng Trung của tôi.", "tags": ["Bài 3", "Trợ từ"]},
      {"id": "hsk1-l3-w2", "hanzi": "对", "pinyin": "duì", "hanViet": "đối", "vietnamese": "đúng, chính xác", "hskLevel": 1, "radical": "寸", "strokeCount": 5, "example": "对，我是中国人。", "exampleTranslation": "Đúng vậy, tôi là người Trung Quốc.", "tags": ["Bài 3", "Tính từ"]},
      {"id": "hsk1-l3-w3", "hanzi": "工作", "pinyin": "gōngzuò", "hanViet": "công tác", "vietnamese": "làm việc, công việc", "hskLevel": 1, "radical": "工", "strokeCount": 10, "example": "你在哪儿工作？", "exampleTranslation": "Bạn làm việc ở đâu?", "tags": ["Bài 3", "Động từ / Danh từ"]},
      {"id": "hsk1-l3-w4", "hanzi": "国", "pinyin": "guó", "hanViet": "quốc", "vietnamese": "đất nước, quốc gia", "hskLevel": 1, "radical": "囗", "strokeCount": 8, "example": "你是哪国人？", "exampleTranslation": "Bạn là người nước nào?", "tags": ["Bài 3", "Danh từ"]},
      {"id": "hsk1-l3-w5", "hanzi": "还", "pinyin": "hái", "hanViet": "hoàn", "vietnamese": "còn, vẫn, ngoài ra", "hskLevel": 1, "radical": "辶", "strokeCount": 7, "example": "我想去北京，还想去西安。", "exampleTranslation": "Tôi muốn đi Bắc Kinh, còn muốn đi Tây An nữa.", "tags": ["Bài 3", "Phó từ"]},
      {"id": "hsk1-l3-w6", "hanzi": "姐姐", "pinyin": "jiějie", "hanViet": "tỷ tỷ", "vietnamese": "chị gái", "hskLevel": 1, "radical": "女", "strokeCount": 8, "example": "我姐姐也是大学生。", "exampleTranslation": "Chị gái tôi cũng là sinh viên đại học.", "tags": ["Bài 3", "Danh từ"]},
      {"id": "hsk1-l3-w7", "hanzi": "吗", "pinyin": "ma", "hanViet": "ma", "vietnamese": "không, à, ư, hả (trợ từ nghi vấn cuối câu)", "hskLevel": 1, "radical": "口", "strokeCount": 6, "example": "你是中国人吗？", "exampleTranslation": "Bạn là người Trung Quốc phải không?", "tags": ["Bài 3", "Trợ từ"]},
      {"id": "hsk1-l3-w8", "hanzi": "忙", "pinyin": "máng", "hanViet": "mang", "vietnamese": "bận, bận rộn", "hskLevel": 1, "radical": "忄", "strokeCount": 6, "example": "你工作忙吗？", "exampleTranslation": "Công việc của bạn bận không?", "tags": ["Bài 3", "Tính từ"]},
      {"id": "hsk1-l3-w9", "hanzi": "哪", "pinyin": "nǎ", "hanViet": "nả", "vietnamese": "nào (đại từ nghi vấn)", "hskLevel": 1, "radical": "口", "strokeCount": 9, "example": "你是哪国人？", "exampleTranslation": "Bạn là người nước nào?", "tags": ["Bài 3", "Đại từ"]},
      {"id": "hsk1-l3-w10", "hanzi": "女朋友", "pinyin": "nǚpéngyou", "hanViet": "nữ bằng hữu", "vietnamese": "bạn gái, người yêu nữ", "hskLevel": 1, "radical": "女", "strokeCount": 15, "example": "李文有女朋友吗？", "exampleTranslation": "Lý Văn có bạn gái chưa?", "tags": ["Bài 3", "Danh từ"]},
      {"id": "hsk1-l3-w11", "hanzi": "人", "pinyin": "rén", "hanViet": "nhân", "vietnamese": "người, loài người", "hskLevel": 1, "radical": "人", "strokeCount": 2, "example": "我是中国人。", "exampleTranslation": "Mình là người Trung Quốc.", "tags": ["Bài 3", "Danh từ"]},
      {"id": "hsk1-l3-w12", "hanzi": "谁", "pinyin": "shéi", "hanViet": "thùy", "vietnamese": "ai (đại từ nghi vấn)", "hskLevel": 1, "radical": "讠", "strokeCount": 10, "example": "他是谁？", "exampleTranslation": "Anh ấy là ai?", "tags": ["Bài 3", "Đại từ"]},
      {"id": "hsk1-l3-w13", "hanzi": "她", "pinyin": "tā", "hanViet": "tha", "vietnamese": "cô ấy, bà ấy, chị ấy", "hskLevel": 1, "radical": "女", "strokeCount": 6, "example": "她是我的中文老师。", "exampleTranslation": "Cô ấy là giáo viên tiếng Trung của tôi.", "tags": ["Bài 3", "Đại từ"]},
      {"id": "hsk1-l3-w14", "hanzi": "太", "pinyin": "tài", "hanViet": "thái", "vietnamese": "quá, lắm", "hskLevel": 1, "radical": "大", "strokeCount": 4, "example": "今天天气太冷了！", "exampleTranslation": "Thời tiết hôm nay lạnh quá!", "tags": ["Bài 3", "Phó từ"]},
      {"id": "hsk1-l3-w15", "hanzi": "喂", "pinyin": "wèi", "hanViet": "ủy", "vietnamese": "alo (tiếng chào qua điện thoại)", "hskLevel": 1, "radical": "口", "strokeCount": 12, "example": "喂，李文，你在哪儿？", "exampleTranslation": "Alo, Lý Văn, bạn đang ở đâu thế?", "tags": ["Bài 3", "Thán từ"]},
      {"id": "hsk1-l3-w16", "hanzi": "我们", "pinyin": "wǒmen", "hanViet": "ngã môn", "vietnamese": "chúng tôi, chúng mình", "hskLevel": 1, "radical": "戈", "strokeCount": 12, "example": "我们都是中国人。", "exampleTranslation": "Chúng tôi đều là người Trung Quốc.", "tags": ["Bài 3", "Đại từ"]},
      {"id": "hsk1-l3-w17", "hanzi": "想", "pinyin": "xiǎng", "hanViet": "tưởng", "vietnamese": "muốn, nhớ, suy nghĩ", "hskLevel": 1, "radical": "心", "strokeCount": 13, "example": "我想去超市买东西。", "exampleTranslation": "Mình định ghé siêu thị mua ít đồ.", "tags": ["Bài 3", "Động từ / Động từ năng nguyện"]},
      {"id": "hsk1-l3-w18", "hanzi": "这", "pinyin": "zhè", "hanViet": "giá", "vietnamese": "đây, này", "hskLevel": 1, "radical": "辶", "strokeCount": 7, "example": "这是我的中文老师。", "exampleTranslation": "Đây là giáo viên tiếng Trung của tôi.", "tags": ["Bài 3", "Đại từ"]},
      {"id": "hsk1-l3-w19", "hanzi": "法国", "pinyin": "Fǎguó", "hanViet": "pháp quốc", "vietnamese": "nước Pháp", "hskLevel": 1, "radical": "氵", "strokeCount": 16, "example": "白家月是法国人。", "exampleTranslation": "Bạch Gia Nguyệt là người Pháp.", "tags": ["Bài 3", "Danh từ riêng"]},
      {"id": "hsk1-l3-w20", "hanzi": "泰国", "pinyin": "Tàiguó", "hanViet": "thái quốc", "vietnamese": "nước Thái Lan", "hskLevel": 1, "radical": "氺", "strokeCount": 17, "example": "她是泰国人。", "exampleTranslation": "Cô ấy là người Thái Lan.", "tags": ["Bài 3", "Danh từ riêng"]},
      {"id": "hsk1-l3-w21", "hanzi": "中国", "pinyin": "Zhōngguó", "hanViet": "trung quốc", "vietnamese": "nước Trung Quốc", "hskLevel": 1, "radical": "丨", "strokeCount": 12, "example": "我是中国人。", "exampleTranslation": "Mình là người Trung Quốc.", "tags": ["Bài 3", "Danh từ riêng"]},
      {"id": "hsk1-l3-w22", "hanzi": "中文", "pinyin": "Zhōngwén", "hanViet": "trung văn", "vietnamese": "tiếng Trung, văn học tiếng Trung", "hskLevel": 1, "radical": "丨", "strokeCount": 8, "example": "李文是我的中文老师。", "exampleTranslation": "Lý Văn là giáo viên tiếng Trung của tôi.", "tags": ["Bài 3", "Danh từ riêng"]},
    ],
    exercises: [
      {
        id: "hsk1-l3-ex1",
        type: "multiple_choice",
        question: "Chuyển câu '他是中国人。' thành câu hỏi Có/Không bằng cách thêm từ nào vào cuối câu?",
        options: ["A. 呢", "B. 吗", "C. 吧", "D. 的"],
        correctAnswer: "B. 吗",
        explanation: "Thêm '吗' vào cuối câu khẳng định để tạo câu hỏi nghi vấn đúng sai: 他是中国人吗？"
      },
      {
        id: "hsk1-l3-ex2",
        type: "fill_blank",
        question: "Điền trợ từ thích hợp vào chỗ trống: 这是我___中文老师。",
        options: ["A. 的", "B. 吗", "C. 呢", "D. 个"],
        correctAnswer: "A. 的",
        explanation: "Dùng trợ từ kết cấu '的' biểu thị quan hệ sở hữu/xác định: 我的中文老师."
      },
    ],
  },
  // ==========================================================================
  // LESSON 4: 我有两个孩子 (Tôi có hai đứa con)
  // ==========================================================================
  {
    lessonNumber: 4,
    titleHanzi: "我有两个孩子",
    titlePinyin: "Wǒ yǒu liǎng gè háizi",
    titleVietnamese: "Tôi có hai đứa con",
    pageStart: 18,
    objectives: [
      "能听懂并使用“有”字句（1）表达领有人或物品 (Nghe hiểu và dùng câu chữ “有” biểu đạt sự sở hữu người hoặc đồ vật).",
      "掌握“A……，B呢？”的用法 (Nắm vững cấu trúc hỏi tỉnh lược “A..., B呢?”).",
      "掌握本课数词、量词的用法 (Nắm vững cách dùng số từ và lượng từ).",
      "了解中国人如何问答年龄，能使用合适的词语进行年龄问答 (Biết cách hỏi và trả lời tuổi tác trong tiếng Trung).",
    ],
    texts: [
      {
        id: "hsk1-l4-t1",
        title: "课文 1: 在家里 (Bài khóa 1: Ở nhà)",
        context: "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
        speakerAnchors: { "刘明": 37, "王一雪": 65 },
        lines: [
          { speaker: "刘明", hanzi: "一飞忙吗？", pinyin: "Yīfēi máng ma?", vietnamese: "Dạo này Nhất Phi có bận không em?" },
          { speaker: "王一雪", hanzi: "她很忙。", pinyin: "Tā hěn máng.", vietnamese: "Dạ con bé bận lắm anh ạ." },
          { speaker: "刘明", hanzi: "她有多少个学生？", pinyin: "Tā yǒu duōshao gè xuésheng?", vietnamese: "Nó dạy bao nhiêu học sinh thế em?" },
          { speaker: "王一雪", hanzi: "她有二十个学生。", pinyin: "Tā yǒu èrshí gè xuésheng.", vietnamese: "Lớp em ấy có hai mươi học sinh anh ạ." }
        ]
      },
      {
        id: "hsk1-l4-t2",
        title: "课文 2: 在公司里 (Bài khóa 2: Ở công ty)",
        context: "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Lạc nghỉ giải lao trò chuyện).",
        speakerAnchors: { "王一雪": 30, "杨同乐": 72 },
        lines: [
          { speaker: "王一雪", hanzi: "我有两个哥哥，你呢？", pinyin: "Wǒ yǒu liǎng gè gēge, nǐ ne?", vietnamese: "Chị có hai người anh trai, còn em thì sao?" },
          { speaker: "杨同乐", hanzi: "我没有哥哥。", pinyin: "Wǒ méiyǒu gēge.", vietnamese: "Dạ em không có anh trai chị ạ." },
          { speaker: "王一雪", hanzi: "你家有几口人？", pinyin: "Nǐ jiā yǒu jǐ kǒu rén?", vietnamese: "Nhà em có mấy người thế?" },
          { speaker: "杨同乐", hanzi: "我家有四口人，爸爸、妈妈、妹妹和我。", pinyin: "Wǒ jiā yǒu sì kǒu rén, bàba, māma, mèimei hé wǒ.", vietnamese: "Dạ nhà em có bốn người: bố, mẹ, em gái và em." }
        ]
      },
      {
        id: "hsk1-l4-t3",
        title: "课文 3: 在街上 (Bài khóa 3: Trên đường phố)",
        context: "在街上，王一雪带着儿子偶遇杨同乐。(Trên đường, Vương Nhất Tuyết dắt con trai tình cờ gặp Dương Đồng Lạc).",
        speakerAnchors: { "刘小明": 22, "王一雪": 41, "杨同乐": 69 },
        lines: [
          { speaker: "杨同乐", hanzi: "这是您儿子吗？", pinyin: "Zhè shì nín érzi ma?", vietnamese: "Bé này là con trai chị phải không ạ?" },
          { speaker: "王一雪", hanzi: "是的。我有两个孩子，一个儿子，一个女儿。", pinyin: "Shì de. Wǒ yǒu liǎng gè háizi, yí gè érzi, yí gè nǚ'ér.", vietnamese: "Ừ đúng rồi em. Chị có hai đứa con, một bé trai với một bé gái." },
          { speaker: "杨同乐", hanzi: "您儿子几岁？", pinyin: "Nín érzi jǐ suì?", vietnamese: "Cháu trai năm nay mấy tuổi rồi hả chị?" },
          { speaker: "王一雪", hanzi: "他今年五岁。", pinyin: "Tā jīnnián wǔ suì.", vietnamese: "Cháu năm nay năm tuổi rồi em." },
          { speaker: "杨同乐", hanzi: "您女儿多大？", pinyin: "Nín nǚ'ér duō dà?", vietnamese: "Thế bé gái nhà chị bao nhiêu tuổi rồi ạ?" },
          { speaker: "王一雪", hanzi: "她今年十二。", pinyin: "Tā jīnnián shí'èr.", vietnamese: "Bé lớn năm nay mười hai tuổi rồi em." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l4-g1",
        title: "1. “有”字句（1）(Cấu trúc câu biểu đạt sự sở hữu với “有”)",
        explanation: "Động từ '有' (yǒu) dùng để biểu thị sự sở hữu (có ai/cái gì). Thể phủ định bắt buộc dùng '没有' (méiyǒu), tuyệt đối không dùng *不有.",
        examples: [
          {
            hanzi: "我有两个孩子。",
            pinyin: "Wǒ yǒu liǎng gè háizi.",
            vietnamese: "Tôi có hai đứa con."
          },
          {
            hanzi: "我没有哥哥。",
            pinyin: "Wǒ méiyǒu gēge.",
            vietnamese: "Tôi không có anh trai."
          },
          {
            hanzi: "你有儿子吗？",
            pinyin: "Nǐ yǒu érzi ma?",
            vietnamese: "Bạn có con trai không?"
          },
        ]
      },
      {
        id: "hsk1-l4-g2",
        title: "2. 数字的表达与“两”和“二”的区别 (Cách dùng số đếm, '两' và '二')",
        explanation: "Khi đứng trước lượng từ để chỉ số lượng 2 người/vật, ta dùng '两' (liǎng) chứ không dùng '二' (èr). '二' dùng khi đếm số thứ tự hoặc số nhà, số điện thoại.",
        examples: [
          {
            hanzi: "两个孩子",
            pinyin: "liǎng gè háizi",
            vietnamese: "hai đứa con (dùng 两)"
          },
          {
            hanzi: "一、二、三",
            pinyin: "yī, èr, sān",
            vietnamese: "1, 2, 3 (đếm số dùng 二)"
          },
        ]
      },
      {
        id: "hsk1-l4-g3",
        title: "3. 语气助词“呢”（1）(Trợ từ ngữ khí “呢” hỏi tỉnh lược)",
        explanation: "Khi ngữ cảnh đã rõ ràng, ta dùng cấu trúc 'A……, B 呢？' để hỏi lại về đối tượng B mà không cần lặp lại câu hỏi trước đó.",
        examples: [
          {
            hanzi: "我有两个孩子，你呢？",
            pinyin: "Wǒ yǒu liǎng gè háizi, nǐ ne?",
            vietnamese: "Tôi có hai đứa con, còn bạn thì sao?"
          },
          {
            hanzi: "我很好，你呢？",
            pinyin: "Wǒ hěn hǎo, nǐ ne?",
            vietnamese: "Tôi rất khỏe, còn bạn?"
          },
        ]
      },
      {
        id: "hsk1-l4-g4",
        title: "4. 名量词和名量结构 (Danh lượng từ và kết cấu Số + Lượng + Danh)",
        explanation: "Trong tiếng Trung, giữa số từ và danh từ bắt buộc phải có lượng từ: Số từ + Lượng từ + Danh từ. '个' (gè) là lượng từ thông dụng nhất; '口' (kǒu) dùng cho số nhân khẩu trong gia đình; '岁' (suì) dùng chỉ số tuổi.",
        examples: [
          {
            hanzi: "我家有三口人。",
            pinyin: "Wǒ jiā yǒu sān kǒu rén.",
            vietnamese: "Nhà tôi có 3 người."
          },
          {
            hanzi: "他今年十岁。",
            pinyin: "Tā jīnnián shí suì.",
            vietnamese: "Năm nay cậu bé 10 tuổi."
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l4-w1", "hanzi": "八", "pinyin": "bā", "hanViet": "bát", "vietnamese": "số 8", "hskLevel": 1, "radical": "八", "strokeCount": 2, "example": "我家有八口人。", "exampleTranslation": "Nhà tôi có 8 người.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w2", "hanzi": "爸爸", "pinyin": "bàba", "hanViet": "bà ba", "vietnamese": "bố, ba, cha", "hskLevel": 1, "radical": "父", "strokeCount": 8, "example": "我爸爸也在医院工作。", "exampleTranslation": "Bố tôi cũng làm việc ở bệnh viện.", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w3", "hanzi": "百", "pinyin": "bǎi", "hanViet": "bách", "vietnamese": "trăm, một trăm", "hskLevel": 1, "radical": "白", "strokeCount": 6, "example": "这件衣服一百块。", "exampleTranslation": "Chiếc áo này 100 tệ.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w4", "hanzi": "大", "pinyin": "dà", "hanViet": "đại", "vietnamese": "lớn, to, nhiều (tuổi)", "hskLevel": 1, "radical": "大", "strokeCount": 3, "example": "这个苹果很大。", "exampleTranslation": "Quả táo này rất to.", "tags": ["Bài 4", "Tính từ"]},
      {"id": "hsk1-l4-w5", "hanzi": "多", "pinyin": "duō", "hanViet": "đa", "vietnamese": "nhiều, bao nhiêu (hỏi mức độ)", "hskLevel": 1, "radical": "夕", "strokeCount": 6, "example": "你的学生多吗？", "exampleTranslation": "Học sinh của bạn có đông không?", "tags": ["Bài 4", "Tính từ / Phó từ"]},
      {"id": "hsk1-l4-w6", "hanzi": "多少", "pinyin": "duōshao", "hanViet": "đa thiểu", "vietnamese": "bao nhiêu", "hskLevel": 1, "radical": "夕", "strokeCount": 10, "example": "你的手机号是多少？", "exampleTranslation": "Số điện thoại của bạn là bao nhiêu?", "tags": ["Bài 4", "Đại từ"]},
      {"id": "hsk1-l4-w7", "hanzi": "儿子", "pinyin": "érzi", "hanViet": "nhi tử", "vietnamese": "con trai", "hskLevel": 1, "radical": "儿", "strokeCount": 5, "example": "他有一个儿子。", "exampleTranslation": "Anh ấy có một cậu con trai.", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w8", "hanzi": "二", "pinyin": "èr", "hanViet": "nhị", "vietnamese": "số 2", "hskLevel": 1, "radical": "二", "strokeCount": 2, "example": "一、二、三、四、五。", "exampleTranslation": "1, 2, 3, 4, 5.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w9", "hanzi": "哥哥", "pinyin": "gēge", "hanViet": "ca ca", "vietnamese": "anh trai", "hskLevel": 1, "radical": "口", "strokeCount": 10, "example": "我哥哥在医院工作。", "exampleTranslation": "Anh trai tôi làm việc ở bệnh viện.", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w10", "hanzi": "个", "pinyin": "gè", "hanViet": "cá", "vietnamese": "cái, chiếc, người (lượng từ đa năng phổ biến)", "hskLevel": 1, "radical": "人", "strokeCount": 3, "example": "我有两个孩子。", "exampleTranslation": "Tôi có hai đứa con.", "tags": ["Bài 4", "Lượng từ"]},
      {"id": "hsk1-l4-w11", "hanzi": "孩子", "pinyin": "háizi", "hanViet": "hài tử", "vietnamese": "đứa con, trẻ con", "hskLevel": 1, "radical": "子", "strokeCount": 8, "example": "你有几个孩子？", "exampleTranslation": "Bạn có mấy đứa con?", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w12", "hanzi": "和", "pinyin": "hé", "hanViet": "hòa", "vietnamese": "và, với, cùng", "hskLevel": 1, "radical": "口", "strokeCount": 8, "example": "我和李文是好朋友。", "exampleTranslation": "Tôi và Lý Văn là bạn tốt.", "tags": ["Bài 4", "Liên từ / Giới từ"]},
      {"id": "hsk1-l4-w13", "hanzi": "几", "pinyin": "jǐ", "hanViet": "kỷ", "vietnamese": "mấy (hỏi số lượng dưới 10)", "hskLevel": 1, "radical": "几", "strokeCount": 2, "example": "你有几个苹果？", "exampleTranslation": "Bạn có mấy quả táo?", "tags": ["Bài 4", "Số từ / Đại từ"]},
      {"id": "hsk1-l4-w14", "hanzi": "家", "pinyin": "jiā", "hanViet": "gia", "vietnamese": "nhà, gia đình; lượng từ cho công ty, cửa hàng", "hskLevel": 1, "radical": "宀", "strokeCount": 10, "example": "我家有四口人。", "exampleTranslation": "Nhà tôi có 4 người.", "tags": ["Bài 4", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l4-w15", "hanzi": "今年", "pinyin": "jīnnián", "hanViet": "kim niên", "vietnamese": "năm nay", "hskLevel": 1, "radical": "人", "strokeCount": 10, "example": "他今年二十岁。", "exampleTranslation": "Năm nay cậu ấy 20 tuổi.", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w16", "hanzi": "九", "pinyin": "jiǔ", "hanViet": "cửu", "vietnamese": "số 9", "hskLevel": 1, "radical": "丿", "strokeCount": 2, "example": "一个星期有七天，九月有三十天。", "exampleTranslation": "Một tuần có 7 ngày, tháng 9 có 30 ngày.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w17", "hanzi": "口", "pinyin": "kǒu", "hanViet": "khẩu", "vietnamese": "miệng; lượng từ nhân khẩu gia đình", "hskLevel": 1, "radical": "口", "strokeCount": 3, "example": "我家有三口人。", "exampleTranslation": "Nhà tôi có 3 người.", "tags": ["Bài 4", "Lượng từ / Danh từ"]},
      {"id": "hsk1-l4-w18", "hanzi": "两", "pinyin": "liǎng", "hanViet": "lưỡng", "vietnamese": "hai (dùng trước lượng từ)", "hskLevel": 1, "radical": "一", "strokeCount": 7, "example": "我有两只猫。", "exampleTranslation": "Tôi có hai chú mèo.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w19", "hanzi": "零", "pinyin": "líng", "hanViet": "linh", "vietnamese": "số 0", "hskLevel": 1, "radical": "雨", "strokeCount": 13, "example": "二零二六年。", "exampleTranslation": "Năm 2026.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w20", "hanzi": "六", "pinyin": "liù", "hanViet": "lục", "vietnamese": "số 6", "hskLevel": 1, "radical": "八", "strokeCount": 4, "example": "六点半下班。", "exampleTranslation": "6 rưỡi tan làm.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w21", "hanzi": "妈妈", "pinyin": "māma", "hanViet": "ma ma", "vietnamese": "mẹ, má", "hskLevel": 1, "radical": "女", "strokeCount": 6, "example": "我妈妈是医生。", "exampleTranslation": "Mẹ tôi là bác sĩ.", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w22", "hanzi": "没有", "pinyin": "méiyǒu", "hanViet": "một hữu", "vietnamese": "không có, chưa", "hskLevel": 1, "radical": "氵", "strokeCount": 13, "example": "我没有哥哥。", "exampleTranslation": "Tôi không có anh trai.", "tags": ["Bài 4", "Động từ / Phó từ"]},
      {"id": "hsk1-l4-w23", "hanzi": "妹妹", "pinyin": "mèimei", "hanViet": "muội muội", "vietnamese": "em gái", "hskLevel": 1, "radical": "女", "strokeCount": 8, "example": "我妹妹今年八岁。", "exampleTranslation": "Em gái tôi năm nay 8 tuổi.", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w24", "hanzi": "呢", "pinyin": "ne", "hanViet": "ni", "vietnamese": "thế, thì sao (trợ từ ngữ khí)", "hskLevel": 1, "radical": "口", "strokeCount": 8, "example": "我很好，你呢？", "exampleTranslation": "Tôi rất khỏe, còn bạn thì sao?", "tags": ["Bài 4", "Trợ từ"]},
      {"id": "hsk1-l4-w25", "hanzi": "女儿", "pinyin": "nǚ'ér", "hanViet": "nữ nhi", "vietnamese": "con gái (con của cha mẹ)", "hskLevel": 1, "radical": "女", "strokeCount": 5, "example": "他女儿今年读大学。", "exampleTranslation": "Con gái anh ấy năm nay học đại học.", "tags": ["Bài 4", "Danh từ"]},
      {"id": "hsk1-l4-w26", "hanzi": "七", "pinyin": "qī", "hanViet": "thất", "vietnamese": "số 7", "hskLevel": 1, "radical": "一", "strokeCount": 2, "example": "七点半上课。", "exampleTranslation": "7 rưỡi vào lớp học.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w27", "hanzi": "千", "pinyin": "qiān", "hanViet": "thiên", "vietnamese": "nghìn, ngàn", "hskLevel": 1, "radical": "十", "strokeCount": 3, "example": "一千块钱。", "exampleTranslation": "Một nghìn tệ.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w28", "hanzi": "三", "pinyin": "sān", "hanViet": "tam", "vietnamese": "số 3", "hskLevel": 1, "radical": "一", "strokeCount": 3, "example": "我有三个朋友。", "exampleTranslation": "Tôi có 3 người bạn.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w29", "hanzi": "十", "pinyin": "shí", "hanViet": "thập", "vietnamese": "số 10", "hskLevel": 1, "radical": "十", "strokeCount": 2, "example": "十月一号是国庆节。", "exampleTranslation": "Ngày 1 tháng 10 là ngày Quốc khánh.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w30", "hanzi": "四", "pinyin": "sì", "hanViet": "tứ", "vietnamese": "số 4", "hskLevel": 1, "radical": "囗", "strokeCount": 5, "example": "我有四个同学。", "exampleTranslation": "Tôi có 4 người bạn học.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w31", "hanzi": "岁", "pinyin": "suì", "hanViet": "tuế", "vietnamese": "tuổi (lượng từ tuổi tác)", "hskLevel": 1, "radical": "山", "strokeCount": 6, "example": "他今年二十岁。", "exampleTranslation": "Năm nay cậu ấy 20 tuổi.", "tags": ["Bài 4", "Lượng từ"]},
      {"id": "hsk1-l4-w32", "hanzi": "他", "pinyin": "tā", "hanViet": "tha", "vietnamese": "anh ấy, cậu ấy, ông ấy", "hskLevel": 1, "radical": "亻", "strokeCount": 5, "example": "他是我的好朋友。", "exampleTranslation": "Cậu ấy là bạn tốt của tôi.", "tags": ["Bài 4", "Đại từ"]},
      {"id": "hsk1-l4-w33", "hanzi": "五", "pinyin": "wǔ", "hanViet": "ngũ", "vietnamese": "số 5", "hskLevel": 1, "radical": "二", "strokeCount": 4, "example": "五月二十号。", "exampleTranslation": "Ngày 20 tháng 5.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w34", "hanzi": "一", "pinyin": "yī", "hanViet": "nhất", "vietnamese": "số 1", "hskLevel": 1, "radical": "一", "strokeCount": 1, "example": "一个星期。", "exampleTranslation": "Một tuần.", "tags": ["Bài 4", "Số từ"]},
      {"id": "hsk1-l4-w35", "hanzi": "有", "pinyin": "yǒu", "hanViet": "hữu", "vietnamese": "có, tồn tại", "hskLevel": 1, "radical": "月", "strokeCount": 6, "example": "我有两个孩子。", "exampleTranslation": "Tôi có hai đứa con.", "tags": ["Bài 4", "Động từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l4-ex1",
        type: "multiple_choice",
        question: "Điền từ thích hợp vào chỗ trống để nói 'Tôi có hai người con': 我有___个孩子。",
        options: ["A. 二", "B. 两", "C. 几", "D. 多少"],
        correctAnswer: "B. 两",
        explanation: "Đứng trước lượng từ '个' để chỉ số lượng 2, bắt buộc dùng '两' (liǎng gè)."
      },
      {
        id: "hsk1-l4-ex2",
        type: "multiple_choice",
        question: "Câu phủ định của '我有哥哥。' (Tôi có anh trai) là:",
        options: ["A. 我不有哥哥。", "B. 我没有哥哥。", "C. 我不哥哥。", "D. 我没哥哥有。"],
        correctAnswer: "B. 我没有哥哥。",
        explanation: "Phủ định của '有' bắt buộc là '没有' (méiyǒu)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 5: 今天我休息 (Hôm nay tôi nghỉ ngơi)
  // ==========================================================================
  {
    lessonNumber: 5,
    titleHanzi: "今天我休息",
    titlePinyin: "Jīntiān wǒ xiūxi",
    titleVietnamese: "Hôm nay tôi nghỉ ngơi",
    pageStart: 27,
    objectives: [
      "能听懂、看懂并按照中文习惯描述事件、行为发生的日期 (Nghe hiểu, đọc hiểu và mô tả ngày tháng theo thói quen tiếng Trung).",
      "能听懂并使用能愿动词“会”表达懂得或有能力做事情 (Nghe hiểu và dùng động từ năng nguyện “会” biểu đạt kỹ năng, năng lực).",
      "掌握名词谓语句的用法 (Nắm vững cách dùng câu vị ngữ danh từ).",
    ],
    texts: [
      {
        id: "hsk1-l5-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang trò chuyện.)",
        speakerAnchors: { "王一雪": 39, "刘明": 66 },
        lines: [
          { speaker: "王一雪", hanzi: "今天几号？", pinyin: "Jīntiān jǐ hào?", vietnamese: "Hôm nay ngày mấy rồi anh nhỉ?" },
          { speaker: "刘明", hanzi: "今天9月8号。", pinyin: "Jīntiān jiǔ yuè bā hào.", vietnamese: "Hôm nay mùng 8 tháng 9 em à." },
          { speaker: "王一雪", hanzi: "星期几？", pinyin: "Xīngqī jǐ?", vietnamese: "Thế là thứ mấy hả anh?" },
          { speaker: "刘明", hanzi: "星期日。今天我休息。", pinyin: "Xīngqīrì. Jīntiān wǒ xiūxi.", vietnamese: "Chủ nhật đấy em. Hôm nay anh được nghỉ ở nhà với vợ con." }
        ]
      },
      {
        id: "hsk1-l5-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao.)",
        speakerAnchors: { "王一雪": 30, "杨同乐": 72 },
        lines: [
          { speaker: "王一雪", hanzi: "你会做饭吗？", pinyin: "Nǐ huì zuòfàn ma?", vietnamese: "Em có biết nấu ăn không Đồng Lạc?" },
          { speaker: "杨同乐", hanzi: "我会做。", pinyin: "Wǒ huì zuò.", vietnamese: "Dạ em biết nấu chứ chị." },
          { speaker: "王一雪", hanzi: "你会做什么？", pinyin: "Nǐ huì zuò shénme?", vietnamese: "Thế em biết làm những món gì nào?" },
          { speaker: "杨同乐", hanzi: "我会做面条儿、饺子，也会做一些菜。星期天我也做饭。", pinyin: "Wǒ huì zuò miàntiáor, jiǎozi, yě huì zuò yìxiē cài. Xīngqītiān wǒ yě zuòfàn.", vietnamese: "Dạ em biết làm mì sợi, gói sủi cảo và nấu vài món ăn thường ngày ạ. Chủ nhật nào em cũng tự vào bếp nấu ăn." }
        ]
      },
      {
        id: "hsk1-l5-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在公司里，王一雪和杨同乐下班时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc nói chuyện lúc tan ca.)",
        speakerAnchors: { "王一雪": 29, "杨同乐": 71 },
        lines: [
          { speaker: "王一雪", hanzi: "同乐，下班吗？", pinyin: "Tónglè, xiàbān ma?", vietnamese: "Đồng Lạc, tan ca chuẩn bị về hả em?" },
          { speaker: "杨同乐", hanzi: "下班。", pinyin: "Xiàbān.", vietnamese: "Dạ vâng, em tan ca rồi chị ạ." },
          { speaker: "王一雪", hanzi: "这是你的新电脑吗？", pinyin: "Zhè shì nǐ de xīn diànnǎo ma?", vietnamese: "Đây là chiếc máy tính mới của em đấy à?" },
          { speaker: "杨同乐", hanzi: "是的，是我的新电脑。", pinyin: "Shì de, shì wǒ de xīn diànnǎo.", vietnamese: "Dạ vâng, máy tính mới của em đấy chị." },
          { speaker: "王一雪", hanzi: "真好看！", pinyin: "Zhēn hǎokàn!", vietnamese: "Trông đẹp và xịn ghê!" },
          { speaker: "杨同乐", hanzi: "我也很喜欢它。", pinyin: "Wǒ yě hěn xǐhuan tā.", vietnamese: "Dạ vâng, em cũng ưng ý nó lắm." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l5-g1",
        title: "1. 时间的表达（1）(Cách biểu đạt ngày tháng trong tiếng Trung)",
        explanation: "Trong tiếng Trung, trật tự biểu đạt thời gian luôn đi từ lớn đến nhỏ: Năm (年 nián) -> Tháng (月 yuè) -> Ngày (日 rì / 号 hào) -> Thứ trong tuần (星期 xīngqī). Trong khẩu ngữ hàng ngày, người ta thường dùng '号' thay cho '日'.",
        examples: [
          {
            hanzi: "今天5月20号。",
            pinyin: "Jīntiān wǔ yuè èrshí hào.",
            vietnamese: "Hôm nay là ngày 20 tháng 5."
          },
          {
            hanzi: "今天星期日，我休息。",
            pinyin: "Jīntiān Xīngqīrì, wǒ xiūxi.",
            vietnamese: "Hôm nay Chủ nhật, tôi nghỉ ngơi."
          },
        ]
      },
      {
        id: "hsk1-l5-g2",
        title: "2. 名词谓语句 (Câu vị ngữ danh từ)",
        explanation: "Câu vị ngữ danh từ là câu mà vị ngữ trực tiếp do danh từ, số từ hoặc cụm danh từ đảm nhiệm mà không cần dùng động từ '是'. Thường dùng để biểu thị ngày tháng, thời gian, thời tiết, tuổi tác hoặc giá cả.",
        examples: [
          {
            hanzi: "今天星期几？",
            pinyin: "Jīntiān xīngqī jǐ?",
            vietnamese: "Hôm nay thứ mấy?"
          },
          {
            hanzi: "今天星期日。",
            pinyin: "Jīntiān Xīngqīrì.",
            vietnamese: "Hôm nay Chủ nhật."
          },
          {
            hanzi: "今天5月20号。",
            pinyin: "Jīntiān wǔ yuè èrshí hào.",
            vietnamese: "Hôm nay ngày 20 tháng 5."
          },
        ]
      },
      {
        id: "hsk1-l5-g3",
        title: "3. 能愿动词“会” (Động từ năng nguyện “会”)",
        explanation: "Động từ năng nguyện '会' (huì) đứng trước động từ để biểu thị năng lực, kỹ năng có được thông qua quá trình học tập, rèn luyện. Dạng phủ định là '不会' (bú huì).",
        examples: [
          {
            hanzi: "你会做饭吗？",
            pinyin: "Nǐ huì zuò fàn ma?",
            vietnamese: "Bạn biết nấu cơm không?"
          },
          {
            hanzi: "我会做中国菜。",
            pinyin: "Wǒ huì zuò Zhōngguó cài.",
            vietnamese: "Tôi biết nấu món ăn Trung Quốc."
          },
          {
            hanzi: "我不会包饺子。",
            pinyin: "Wǒ bú huì bāo jiǎozi.",
            vietnamese: "Tôi không biết gói sủi cảo."
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l5-w1", "hanzi": "菜", "pinyin": "cài", "hanViet": "thái", "vietnamese": "món ăn, rau", "hskLevel": 1, "radical": "艹", "strokeCount": 11, "example": "你会做中国菜吗？", "exampleTranslation": "Bạn biết nấu món ăn Trung Quốc không?", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w2", "hanzi": "电脑", "pinyin": "diànnǎo", "hanViet": "điện não", "vietnamese": "máy vi tính, máy tính", "hskLevel": 1, "radical": "田", "strokeCount": 18, "example": "这是新买的电脑。", "exampleTranslation": "Đây là máy tính mới mua.", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w3", "hanzi": "好看", "pinyin": "hǎokàn", "hanViet": "hảo khán", "vietnamese": "đẹp, ưa nhìn, hay (phim)", "hskLevel": 1, "radical": "女", "strokeCount": 15, "example": "这本画册真好看。", "exampleTranslation": "Cuốn tranh này thật đẹp mắt.", "tags": ["Bài 5", "Tính từ"]},
      {"id": "hsk1-l5-w4", "hanzi": "号", "pinyin": "hào", "hanViet": "hiệu", "vietnamese": "ngày (trong tháng), số (điện thoại, phòng)", "hskLevel": 1, "radical": "口", "strokeCount": 5, "example": "今天5月20号。", "exampleTranslation": "Hôm nay ngày 20 tháng 5.", "tags": ["Bài 5", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l5-w5", "hanzi": "会", "pinyin": "huì", "hanViet": "hội", "vietnamese": "biết (qua học tập), có thể", "hskLevel": 1, "radical": "人", "strokeCount": 6, "example": "我会说一点儿汉语。", "exampleTranslation": "Tôi biết nói một chút tiếng Trung.", "tags": ["Bài 5", "Động từ năng nguyện"]},
      {"id": "hsk1-l5-w6", "hanzi": "饺子", "pinyin": "jiǎozi", "hanViet": "kiểu tử", "vietnamese": "bánh sủi cảo", "hskLevel": 1, "radical": "饣", "strokeCount": 12, "example": "你会包饺子吗？", "exampleTranslation": "Bạn biết gói sủi cảo không?", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w7", "hanzi": "今天", "pinyin": "jīntiān", "hanViet": "kim thiên", "vietnamese": "hôm nay", "hskLevel": 1, "radical": "人", "strokeCount": 8, "example": "今天我休息。", "exampleTranslation": "Hôm nay tôi nghỉ ngơi.", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w8", "hanzi": "面条儿", "pinyin": "miàntiáor", "hanViet": "miến điều nhi", "vietnamese": "mì sợi, tô mì", "hskLevel": 1, "radical": "面", "strokeCount": 18, "example": "今天的面条儿真好吃！", "exampleTranslation": "Mì sợi hôm nay ngon thật đấy!", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w9", "hanzi": "日", "pinyin": "rì", "hanViet": "nhật", "vietnamese": "ngày, mặt trời", "hskLevel": 1, "radical": "日", "strokeCount": 4, "example": "今天是五月二十日。", "exampleTranslation": "Hôm nay là ngày 20 tháng 5.", "tags": ["Bài 5", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l5-w10", "hanzi": "它", "pinyin": "tā", "hanViet": "tha", "vietnamese": "nó (chỉ con vật hoặc đồ vật)", "hskLevel": 1, "radical": "宀", "strokeCount": 5, "example": "这是一只小猫，它真可爱。", "exampleTranslation": "Đây là một chú mèo con, nó thật dễ thương.", "tags": ["Bài 5", "Đại từ"]},
      {"id": "hsk1-l5-w11", "hanzi": "喜欢", "pinyin": "xǐhuan", "hanViet": "hỷ hoan", "vietnamese": "thích, yêu thích", "hskLevel": 1, "radical": "士", "strokeCount": 18, "example": "我喜欢吃中国菜。", "exampleTranslation": "Tôi thích ăn món ăn Trung Quốc.", "tags": ["Bài 5", "Động từ"]},
      {"id": "hsk1-l5-w12", "hanzi": "下班", "pinyin": "xiàbān", "hanViet": "hạ ban", "vietnamese": "tan làm, hết giờ làm", "hskLevel": 1, "radical": "一", "strokeCount": 13, "example": "我晚上六点半下班。", "exampleTranslation": "Buổi tối 6 rưỡi tôi tan làm.", "tags": ["Bài 5", "Động từ"]},
      {"id": "hsk1-l5-w13", "hanzi": "新", "pinyin": "xīn", "hanViet": "tân", "vietnamese": "mới", "hskLevel": 1, "radical": "斤", "strokeCount": 13, "example": "这是我的新手机。", "exampleTranslation": "Đây là chiếc điện thoại mới của tôi.", "tags": ["Bài 5", "Tính từ"]},
      {"id": "hsk1-l5-w14", "hanzi": "星期", "pinyin": "xīngqī", "hanViet": "tinh kỳ", "vietnamese": "tuần, thứ trong tuần", "hskLevel": 1, "radical": "日", "strokeCount": 21, "example": "一个星期有七天。", "exampleTranslation": "Một tuần có 7 ngày.", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w15", "hanzi": "星期日", "pinyin": "Xīngqīrì", "hanViet": "tinh kỳ nhật", "vietnamese": "Chủ nhật", "hskLevel": 1, "radical": "日", "strokeCount": 25, "example": "今天星期日，我休息。", "exampleTranslation": "Hôm nay Chủ nhật, tôi nghỉ ngơi.", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w16", "hanzi": "星期天", "pinyin": "Xīngqītiān", "hanViet": "tinh kỳ thiên", "vietnamese": "Chủ nhật", "hskLevel": 1, "radical": "日", "strokeCount": 25, "example": "星期天我们去北京玩吧。", "exampleTranslation": "Chủ nhật chúng mình đi Bắc Kinh chơi nhé.", "tags": ["Bài 5", "Danh từ"]},
      {"id": "hsk1-l5-w17", "hanzi": "休息", "pinyin": "xiūxi", "hanViet": "hưu tức", "vietnamese": "nghỉ ngơi, nghỉ phép", "hskLevel": 1, "radical": "亻", "strokeCount": 16, "example": "今天我休息。", "exampleTranslation": "Hôm nay tôi nghỉ ngơi.", "tags": ["Bài 5", "Động từ"]},
      {"id": "hsk1-l5-w18", "hanzi": "一些", "pinyin": "yìxiē", "hanViet": "nhất tỉ", "vietnamese": "một số, một vài", "hskLevel": 1, "radical": "一", "strokeCount": 9, "example": "我想买一些新衣服。", "exampleTranslation": "Tôi muốn mua một số quần áo mới.", "tags": ["Bài 5", "Số từ"]},
      {"id": "hsk1-l5-w19", "hanzi": "月", "pinyin": "yuè", "hanViet": "nguyệt", "vietnamese": "tháng, mặt trăng", "hskLevel": 1, "radical": "月", "strokeCount": 4, "example": "今天5月20号。", "exampleTranslation": "Hôm nay ngày 20 tháng 5.", "tags": ["Bài 5", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l5-w20", "hanzi": "真", "pinyin": "zhēn", "hanViet": "chân", "vietnamese": "thật, thực sự", "hskLevel": 1, "radical": "目", "strokeCount": 10, "example": "这儿的苹果真便宜！", "exampleTranslation": "Táo ở đây rẻ thật đấy!", "tags": ["Bài 5", "Phó từ"]},
      {"id": "hsk1-l5-w21", "hanzi": "做", "pinyin": "zuò", "hanViet": "tác", "vietnamese": "làm, nấu", "hskLevel": 1, "radical": "亻", "strokeCount": 11, "example": "你会做饭吗？", "exampleTranslation": "Bạn biết nấu ăn không?", "tags": ["Bài 5", "Động từ"]},
      {"id": "hsk1-l5-w22", "hanzi": "做饭", "pinyin": "zuò fàn", "hanViet": "tác phạn", "vietnamese": "nấu cơm, nấu ăn", "hskLevel": 1, "radical": "亻", "strokeCount": 18, "example": "妈妈在厨房做饭呢。", "exampleTranslation": "Mẹ đang nấu cơm trong bếp.", "tags": ["Bài 5", "Động từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l5-ex1",
        type: "multiple_choice",
        question: "Hỏi 'Hôm nay thứ mấy?', ta nói:",
        options: ["A. 今天几号？", "B. 今天星期几？", "C. 今天几月？", "D. 今天多少号？"],
        correctAnswer: "B. 今天星期几？",
        explanation: "Hỏi thứ trong tuần dùng '星期几' (xīngqī jǐ). Còn '几号' dùng hỏi ngày trong tháng."
      },
      {
        id: "hsk1-l5-ex2",
        type: "fill_blank",
        question: "Điền từ phủ định thích hợp: 我___会做饭。(Tôi không biết nấu ăn)",
        options: ["A. 没", "B. 不", "C. 别", "D. 无"],
        correctAnswer: "B. 不",
        explanation: "Phủ định của động từ năng nguyện '会' luôn là '不会' (bú huì)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 6: 你的手机号是多少？ (Số điện thoại của bạn là bao nhiêu?)
  // ==========================================================================
  {
    lessonNumber: 6,
    titleHanzi: "你的手机号是多少？",
    titlePinyin: "Nǐ de shǒujīhào shì duōshao?",
    titleVietnamese: "Số điện thoại của bạn là bao nhiêu?",
    pageStart: 35,
    objectives: [
      "能听懂手机号码并使用号码拨打手机 (Nghe hiểu số điện thoại và dùng số quay cuộc gọi).",
      "能听懂并使用两个或多个动词性短语表达动作的目的或方式 (Nghe hiểu và dùng cụm liên động biểu đạt mục đích, cách thức).",
      "掌握能愿动词“想”的用法 (Nắm vững cách dùng động từ năng nguyện “想”).",
      "掌握疑问代词“怎么”询问方式的用法 (Nắm vững cách dùng đại từ nghi vấn “怎么” hỏi cách thức).",
    ],
    texts: [
      {
        id: "hsk1-l6-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在校园里，李文向白家月要手机号。(Trong khuôn viên trường, Lý Văn hỏi xin số điện thoại của Bạch Gia Nguyệt.)",
        speakerAnchors: { "李文": 33, "白家月": 78 },
        lines: [
          { speaker: "李文", hanzi: "家月，你的手机号是多少？", pinyin: "Jiāyuè, nǐ de shǒujīhào shì duōshao?", vietnamese: "Gia Nguyệt ơi, số điện thoại của cậu là bao nhiêu thế?" },
          { speaker: "白家月", hanzi: "我的手机号是+33 601493190。", pinyin: "Wǒ de shǒujīhào shì +33 601493190.", vietnamese: "Số của mình là +33 601493190 nhé." },
          { speaker: "李文", hanzi: "我的手机号是+86 13552721160。", pinyin: "Wǒ de shǒujīhào shì +86 13552721160.", vietnamese: "Còn số của mình là +86 13552721160." },
          { speaker: "白家月", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Ok, mình lưu lại rồi nhé." }
        ]
      },
      {
        id: "hsk1-l6-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
        speakerAnchors: { "白家月": 31, "陈天中": 65 },
        lines: [
          { speaker: "陈天中", hanzi: "家月，明天你去哪儿？", pinyin: "Jiāyuè, míngtiān nǐ qù nǎr?", vietnamese: "Gia Nguyệt, mai cậu có đi đâu không?" },
          { speaker: "白家月", hanzi: "我想去超市买东西。", pinyin: "Wǒ xiǎng qù chāoshì mǎi dōngxi.", vietnamese: "Mình định ghé siêu thị mua ít đồ." },
          { speaker: "陈天中", hanzi: "你去超市买什么？", pinyin: "Nǐ qù chāoshì mǎi shénme?", vietnamese: "Cậu đi siêu thị mua gì thế?" },
          { speaker: "白家月", hanzi: "我想买些牛奶。", pinyin: "Wǒ xiǎng mǎi xiē niúnǎi.", vietnamese: "Mình muốn mua thêm ít sữa tươi." }
        ]
      },
      {
        id: "hsk1-l6-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在家里，王一雪全家在讨论周末晚餐安排。(Ở nhà, cả gia đình Vương Nhất Tuyết bàn về kế hoạch ăn tối cuối tuần.)",
        speakerAnchors: { "刘小明": 22, "刘明": 38, "王一雪": 61, "刘小雪": 81 },
        lines: [
          { speaker: "王一雪", hanzi: "星期天我们去哪儿吃晚饭？", pinyin: "Xīngqītiān wǒmen qù nǎr chī wǎnfàn?", vietnamese: "Chủ nhật này nhà mình đi đâu ăn tối anh nhỉ?" },
          { speaker: "刘明", hanzi: "我还想去西安饭店。", pinyin: "Wǒ hái xiǎng qù Xī'ān fàndiàn.", vietnamese: "Anh vẫn muốn cả nhà đến nhà hàng Tây An." },
          { speaker: "刘小雪", hanzi: "那边的包子非常好吃，我想吃包子。", pinyin: "Nà biān de bāozi fēicháng hǎochī, wǒ xiǎng chī bāozi.", vietnamese: "Bánh bao ở đó ngon tuyệt đỉnh luôn bố mẹ ơi, con muốn ăn bánh bao cơ!" },
          { speaker: "刘小明", hanzi: "妈妈，我想吃米饭，不想吃包子。", pinyin: "Māma, wǒ xiǎng chī mǐfàn, bù xiǎng chī bāozi.", vietnamese: "Mẹ ơi, con thích ăn cơm cơ, con không muốn ăn bánh bao đâu." },
          { speaker: "王一雪", hanzi: "好的。我们怎么去？", pinyin: "Hǎo de. Wǒmen zěnme qù?", vietnamese: "Được rồi, chiều cả hai con. Thế nhà mình đi bằng gì hả anh?" },
          { speaker: "刘明", hanzi: "坐出租车去。", pinyin: "Zuò chūzūchē qù.", vietnamese: "Nhà mình bắt taxi đi cho tiện và thoải mái em nhé." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk1-l6-g1",
        title: "1. 能愿动词“想” (Động từ năng nguyện “想”)",
        explanation: "'想' (xiǎng) đứng trước động từ biểu thị nguyện vọng, ý muốn hoặc dự định chủ quan (muốn làm gì). Thể phủ định là '不想' (bù xiǎng).",
        examples: [
          {
            hanzi: "我想去超市买东西。",
            pinyin: "Wǒ xiǎng qù chāoshì mǎi dōngxi.",
            vietnamese: "Mình định ghé siêu thị mua ít đồ."
          },
          {
            hanzi: "你晚饭想吃什么？",
            pinyin: "Nǐ wǎnfàn xiǎng chī shénme?",
            vietnamese: "Cơm tối bạn muốn ăn gì?"
          },
        ]
      },
      {
        id: "hsk1-l6-g2",
        title: "2. 连动句（1）(Câu liên động chỉ mục đích / phương thức)",
        explanation: "Câu liên động gồm hai hành động liên tiếp nhau: Hành động 1 biểu thị phương thức hoặc đi đến đâu, hành động 2 biểu thị mục đích. Cấu trúc phổ biến: 'Chủ ngữ + 去 / 坐... + Nơi chốn + Động từ 2'.",
        examples: [
          {
            hanzi: "我去超市买东西。",
            pinyin: "Wǒ qù chāoshì mǎi dōngxi.",
            vietnamese: "Tôi đi siêu thị mua đồ (đi siêu thị để mua đồ)."
          },
          {
            hanzi: "我们坐出租车去西安饭店。",
            pinyin: "Wǒmen zuò chūzūchē qù Xī'ān Fàndiàn.",
            vietnamese: "Chúng tôi đi taxi đến khách sạn Tây An."
          },
        ]
      },
      {
        id: "hsk1-l6-g3",
        title: "3. 疑问代词“怎么” (Đại từ nghi vấn “怎么” hỏi cách thức)",
        explanation: "Đại từ '怎么' (zěnme) đứng trước động từ để hỏi về phương thức hoặc cách thức thực hiện hành động: '怎么 + Động từ?' (Làm thế nào?).",
        examples: [
          {
            hanzi: "怎么去西安饭店？",
            pinyin: "Zěnme qù Xī'ān Fàndiàn?",
            vietnamese: "Đi đến nhà hàng Tây An như thế nào?"
          },
          {
            hanzi: "这个字怎么读？",
            pinyin: "Zhè ge zì zěnme dú?",
            vietnamese: "Chữ này đọc như thế nào?"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l6-w1", "hanzi": "包子", "pinyin": "bāozi", "hanViet": "bao tử", "vietnamese": "bánh bao", "hskLevel": 1, "radical": "勹", "strokeCount": 8, "example": "我想吃包子。", "exampleTranslation": "Tôi muốn ăn bánh bao.", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w2", "hanzi": "超市", "pinyin": "chāoshì", "hanViet": "siêu thị", "vietnamese": "siêu thị", "hskLevel": 1, "radical": "走", "strokeCount": 17, "example": "我去超市买东西。", "exampleTranslation": "Tôi đi siêu thị mua đồ.", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w3", "hanzi": "吃", "pinyin": "chī", "hanViet": "ngật", "vietnamese": "ăn", "hskLevel": 1, "radical": "口", "strokeCount": 6, "example": "你喜欢吃什么？", "exampleTranslation": "Bạn thích ăn cái gì?", "tags": ["Bài 6", "Động từ"]},
      {"id": "hsk1-l6-w4", "hanzi": "出租车", "pinyin": "chūzūchē", "hanViet": "xuất tô xa", "vietnamese": "xe taxi", "hskLevel": 1, "radical": "刀", "strokeCount": 19, "example": "我们坐出租车去吧。", "exampleTranslation": "Chúng ta đi xe taxi đi nhé.", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w5", "hanzi": "电话", "pinyin": "diànhuà", "hanViet": "điện thoại", "vietnamese": "điện thoại, cuộc gọi", "hskLevel": 1, "radical": "田", "strokeCount": 13, "example": "家月，你的电话是多少？", "exampleTranslation": "Gia Nguyệt ơi, số điện thoại của cậu là bao nhiêu thế?", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w6", "hanzi": "东西", "pinyin": "dōngxi", "hanViet": "đông tây", "vietnamese": "đồ vật, đồ đạc", "hskLevel": 1, "radical": "一", "strokeCount": 14, "example": "你想买什么东西？", "exampleTranslation": "Bạn muốn mua đồ gì?", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w7", "hanzi": "非常", "pinyin": "fēicháng", "hanViet": "phi thường", "vietnamese": "vô cùng, rất, hết sức", "hskLevel": 1, "radical": "非", "strokeCount": 19, "example": "这里的苹果非常便宜！", "exampleTranslation": "Táo ở đây vô cùng rẻ!", "tags": ["Bài 6", "Phó từ"]},
      {"id": "hsk1-l6-w8", "hanzi": "好吃", "pinyin": "hǎochī", "hanViet": "hảo ngật", "vietnamese": "ngon (ăn ngon)", "hskLevel": 1, "radical": "女", "strokeCount": 12, "example": "妈妈做的菜真好吃！", "exampleTranslation": "Món mẹ nấu thật là ngon!", "tags": ["Bài 6", "Tính từ"]},
      {"id": "hsk1-l6-w9", "hanzi": "号", "pinyin": "hào", "hanViet": "hiệu", "vietnamese": "ngày (trong tháng), số (điện thoại, phòng)", "hskLevel": 1, "radical": "口", "strokeCount": 5, "example": "今天5月20号。", "exampleTranslation": "Hôm nay ngày 20 tháng 5.", "tags": ["Bài 6", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l6-w10", "hanzi": "买", "pinyin": "mǎi", "hanViet": "mãi", "vietnamese": "mua", "hskLevel": 1, "radical": "乙", "strokeCount": 6, "example": "我想买一些水果。", "exampleTranslation": "Tôi muốn mua một ít hoa quả.", "tags": ["Bài 6", "Động từ"]},
      {"id": "hsk1-l6-w11", "hanzi": "米饭", "pinyin": "mǐfàn", "hanViet": "mễ phạn", "vietnamese": "cơm trắng, cơm", "hskLevel": 1, "radical": "米", "strokeCount": 13, "example": "我要一碗米饭。", "exampleTranslation": "Cho tôi một bát cơm trắng.", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w12", "hanzi": "明天", "pinyin": "míngtiān", "hanViet": "minh thiên", "vietnamese": "ngày mai", "hskLevel": 1, "radical": "日", "strokeCount": 12, "example": "明天上午见！", "exampleTranslation": "Hẹn gặp vào sáng mai!", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w13", "hanzi": "哪儿", "pinyin": "nǎr", "hanViet": "nả nhi", "vietnamese": "ở đâu, đâu", "hskLevel": 1, "radical": "口", "strokeCount": 11, "example": "洗手间在哪儿？", "exampleTranslation": "Nhà vệ sinh ở đâu?", "tags": ["Bài 6", "Đại từ"]},
      {"id": "hsk1-l6-w14", "hanzi": "那边", "pinyin": "nàbiān", "hanViet": "na biên", "vietnamese": "phía bên kia, đằng kia", "hskLevel": 1, "radical": "阝", "strokeCount": 11, "example": "超市在那边。", "exampleTranslation": "Siêu thị ở đằng kia.", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w15", "hanzi": "牛奶", "pinyin": "niúnǎi", "hanViet": "ngưu nãi", "vietnamese": "sữa bò, sữa tươi", "hskLevel": 1, "radical": "牛", "strokeCount": 9, "example": "我每天早上喝牛奶。", "exampleTranslation": "Mỗi sáng tôi đều uống sữa bò.", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w16", "hanzi": "去", "pinyin": "qù", "hanViet": "khứ", "vietnamese": "đi, đến", "hskLevel": 1, "radical": "厶", "strokeCount": 5, "example": "我想去超市买东西。", "exampleTranslation": "Mình định ghé siêu thị mua ít đồ.", "tags": ["Bài 6", "Động từ"]},
      {"id": "hsk1-l6-w17", "hanzi": "手机", "pinyin": "shǒujī", "hanViet": "thủ cơ", "vietnamese": "điện thoại di động", "hskLevel": 1, "radical": "手", "strokeCount": 8, "example": "你的手机号是多少？", "exampleTranslation": "Số điện thoại của bạn là bao nhiêu?", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w18", "hanzi": "晚饭", "pinyin": "wǎnfàn", "hanViet": "vãn phạn", "vietnamese": "bữa tối, cơm tối", "hskLevel": 1, "radical": "日", "strokeCount": 18, "example": "你晚饭想吃什么？", "exampleTranslation": "Cơm tối bạn muốn ăn gì?", "tags": ["Bài 6", "Danh từ"]},
      {"id": "hsk1-l6-w19", "hanzi": "想", "pinyin": "xiǎng", "hanViet": "tưởng", "vietnamese": "muốn, nhớ, suy nghĩ", "hskLevel": 1, "radical": "心", "strokeCount": 13, "example": "我想去超市买东西。", "exampleTranslation": "Mình định ghé siêu thị mua ít đồ.", "tags": ["Bài 6", "Động từ / Động từ năng nguyện"]},
      {"id": "hsk1-l6-w20", "hanzi": "些", "pinyin": "xiē", "hanViet": "tỉ", "vietnamese": "một vài, vài, một ít (lượng từ số lượng ít)", "hskLevel": 1, "radical": "二", "strokeCount": 8, "example": "我想买一些水果。", "exampleTranslation": "Tôi muốn mua một ít trái cây.", "tags": ["Bài 6", "Lượng từ"]},
      {"id": "hsk1-l6-w21", "hanzi": "怎么", "pinyin": "zěnme", "hanViet": "chẩm ma", "vietnamese": "như thế nào, làm sao", "hskLevel": 1, "radical": "心", "strokeCount": 12, "example": "怎么去西安饭店？", "exampleTranslation": "Đi đến khách sạn Tây An như thế nào?", "tags": ["Bài 6", "Đại từ"]},
      {"id": "hsk1-l6-w22", "hanzi": "坐", "pinyin": "zuò", "hanViet": "tọa", "vietnamese": "ngồi, đi (tàu, xe, máy bay)", "hskLevel": 1, "radical": "土", "strokeCount": 7, "example": "我们坐出租车去吧。", "exampleTranslation": "Chúng ta đi xe taxi đi nhé.", "tags": ["Bài 6", "Động từ"]},
      {"id": "hsk1-l6-w23", "hanzi": "西安饭店", "pinyin": "Xī'ān Fàndiàn", "hanViet": "tây an phạn điếm", "vietnamese": "khách sạn/nhà hàng Tây An", "hskLevel": 1, "radical": "覀", "strokeCount": 27, "example": "我们坐出租车去西安饭店。", "exampleTranslation": "Chúng tôi đi taxi đến khách sạn Tây An.", "tags": ["Bài 6", "Danh từ riêng"]},
    ],
    exercises: [
      {
        id: "hsk1-l6-ex1",
        type: "multiple_choice",
        question: "Hỏi số điện thoại của người khác, ta nói:",
        options: ["A. 你的手机号是几？", "B. 你的手机号是多少？", "C. 你的手机号怎么？", "D. 你的手机号哪儿？"],
        correctAnswer: "B. 你的手机号是多少？",
        explanation: "Hỏi dãy số dài (như số điện thoại, số phòng lớn) dùng '是多少？' (shì duōshao)."
      },
      {
        id: "hsk1-l6-ex2",
        type: "sentence_scramble",
        question: "Sắp xếp câu liên động sau: 去 / 买东西 / 超市 / 我",
        scrambleSegments: ["我", "去超市", "买东西"],
        options: ["我去超市买东西", "我买东西去超市", "超市我去买东西"],
        correctAnswer: "我去超市买东西",
        explanation: "Cấu trúc câu liên động: Chủ ngữ (我) + Đến địa điểm (去超市) + Làm gì (买东西)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 7: 我晚上六点半下班 (Buổi tối 6 rưỡi tôi tan làm)
  // ==========================================================================
  {
    lessonNumber: 7,
    titleHanzi: "我晚上六点半下班",
    titlePinyin: "Wǒ wǎnshang liù diǎn bàn xiàbān",
    titleVietnamese: "Buổi tối 6 rưỡi tôi tan làm",
    pageStart: 45,
    objectives: [
      "能听懂并描述事情发生的时间 (Nghe hiểu và miêu tả thời gian diễn ra sự việc).",
      "掌握语气助词“吧”（1）表达建议、商量等的用法 (Nắm vững cách dùng trợ từ “吧” biểu thị đề xuất, thương lượng).",
      "掌握语气助词“呢”（2）表达确认的事实的用法 (Nắm vững cách dùng trợ từ “呢” khẳng định sự thật xác thực).",
      "掌握副词、时间词语作状语的位置 (Nắm vững vị trí của phó từ, trạng từ chỉ thời gian trong câu).",
    ],
    texts: [
      {
        id: "hsk1-l7-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "白家月和安妮在打电话。(Bạch Gia Nguyệt và An Ni đang gọi điện thoại cho nhau.)",
        speakerAnchors: { "白家月": 25, "安妮": 74 },
        lines: [
          { speaker: "白家月", hanzi: "现在几点？", pinyin: "Xiànzài jǐ diǎn?", vietnamese: "Mấy giờ rồi cậu ơi?" },
          { speaker: "安妮", hanzi: "早上八点四十。", pinyin: "Zǎoshang bā diǎn sìshí.", vietnamese: "Tám giờ bốn mươi phút sáng rồi nè." },
          { speaker: "白家月", hanzi: "我上午十点十分有课。", pinyin: "Wǒ shàngwǔ shí diǎn shí fēn yǒu kè.", vietnamese: "Mười giờ mười sáng nay tớ có tiết học đấy." },
          { speaker: "安妮", hanzi: "好的，我们下午两点见吧。", pinyin: "Hǎo de, wǒmen xiàwǔ liǎng diǎn jiàn ba.", vietnamese: "Ừ thế à, vậy hai giờ chiều chúng mình gặp nhau nhé!" }
        ]
      },
      {
        id: "hsk1-l7-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在校园里，李文遇到白家月。(Trong khuôn viên trường, Lý Văn tình cờ gặp Bạch Gia Nguyệt.)",
        speakerAnchors: { "李文": 25, "白家月": 75 },
        lines: [
          { speaker: "李文", hanzi: "下午我想去电影院看电影，你去吗？", pinyin: "Xiàwǔ wǒ xiǎng qù diànyǐngyuàn kàn diànyǐng, nǐ qù ma?", vietnamese: "Chiều nay tớ định ra rạp xem phim, cậu có đi cùng không?" },
          { speaker: "白家月", hanzi: "我不想去，下午还有事。", pinyin: "Wǒ bù xiǎng qù, xiàwǔ hái yǒu shì.", vietnamese: "Tớ không đi được rồi, chiều nay tớ còn có việc bận mất." },
          { speaker: "李文", hanzi: "好的。明天呢？", pinyin: "Hǎo de. Míngtiān ne?", vietnamese: "Ừ thế à. Thế còn ngày mai thì sao cậu?" },
          { speaker: "白家月", hanzi: "我明天下午两点还上课呢，四点半下课。", pinyin: "Wǒ míngtiān xiàwǔ liǎng diǎn hái shàngkè ne, sì diǎn bàn xiàkè.", vietnamese: "Chiều mai hai giờ tớ vẫn phải lên lớp, tận bốn rưỡi mới tan học cơ." }
        ]
      }
    ,
      {
        id: "hsk1-l7-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "王一雪给丈夫刘明打电话。(Vương Nhất Tuyết gọi điện cho chồng là Lưu Minh.)",
        speakerAnchors: { "王一雪": 25, "刘明": 76 },
        lines: [
          { speaker: "王一雪", hanzi: "喂，你在哪儿呢？", pinyin: "Wèi, nǐ zài nǎr ne?", vietnamese: "A lô, anh đang ở đâu đấy?" },
          { speaker: "刘明", hanzi: "我在家里呢。", pinyin: "Wǒ zài jiā li ne.", vietnamese: "Anh đang ở nhà đây em." },
          { speaker: "王一雪", hanzi: "我晚上六点半下班。", pinyin: "Wǒ wǎnshang liù diǎn bàn xiàbān.", vietnamese: "Tối nay sáu rưỡi em mới tan làm cơ." },
          { speaker: "刘明", hanzi: "我八点去医院上班。", pinyin: "Wǒ bā diǎn qù yīyuàn shàngbān.", vietnamese: "Ừ, tám giờ tối anh phải đến bệnh viện trực rồi." },
          { speaker: "王一雪", hanzi: "好的，你去店里买些菜吧。", pinyin: "Hǎo de, nǐ qù diàn lǐ mǎi xiē cài ba.", vietnamese: "Dạ vâng, thế anh ghé qua cửa hàng mua ít rau củ ăn tối nhé." },
          { speaker: "刘明", hanzi: "好，我十分钟后去。", pinyin: "Hǎo, wǒ shí fēnzhōng hòu qù.", vietnamese: "Được rồi em, khoảng mười phút nữa anh đi mua ngay." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l7-g1",
        title: "1. 时间的表达（2）(Cách biểu đạt giờ giấc trong tiếng Trung)",
        explanation: "Cách nói giờ: 'Số + 点 (diǎn)' (giờ), 'Số + 分 (fēn)' (phút). Nửa giờ (30 phút) dùng '半 (bàn)'. Khi biểu đạt thời điểm có cả buổi trong ngày, từ chỉ buổi (早上, 上午, 下午, 晚上) đứng trước giờ.",
        examples: [
          {
            hanzi: "现在几点？",
            pinyin: "Xiànzài jǐ diǎn?",
            vietnamese: "Mấy giờ rồi cậu ơi?"
          },
          {
            hanzi: "晚上六点半",
            pinyin: "wǎnshang liù diǎn bàn",
            vietnamese: "6 rưỡi tối (18:30)"
          },
          {
            hanzi: "上午八点十分",
            pinyin: "shàngwǔ bā diǎn shí fēn",
            vietnamese: "8 giờ 10 phút sáng"
          },
        ]
      },
      {
        id: "hsk1-l7-g2",
        title: "2. 语气助词“吧”（1）(Trợ từ ngữ khí “吧” biểu thị đề nghị)",
        explanation: "Trợ từ '吧' (ba) đặt ở cuối câu trần thuật hoặc cầu khiến nhằm đưa ra lời đề nghị, gợi ý, rủ rê hoặc thương lượng một cách hòa nhã.",
        examples: [
          {
            hanzi: "我们看电影吧！",
            pinyin: "Wǒmen kàn diànyǐng ba!",
            vietnamese: "Chúng mình đi xem phim đi!"
          },
          {
            hanzi: "我们走吧。",
            pinyin: "Wǒmen zǒu ba.",
            vietnamese: "Chúng ta đi thôi nào."
          },
        ]
      },
      {
        id: "hsk1-l7-g3",
        title: "3. 副词、时间词语作状语的位置 (Vị trí của từ chỉ thời gian làm trạng ngữ)",
        explanation: "Từ chỉ thời gian khi làm trạng ngữ có thể đứng trước hoặc ngay sau chủ ngữ, nhưng luôn đứng TRƯỚC vị ngữ (động từ/tính từ). Tuyệt đối không đặt từ chỉ thời gian ở cuối câu như tiếng Anh hay tiếng Việt.",
        examples: [
          {
            hanzi: "我晚上六点半下班。",
            pinyin: "Wǒ wǎnshang liù diǎn bàn xiàbān.",
            vietnamese: "Buổi tối 6 rưỡi tôi tan làm."
          },
          {
            hanzi: "晚上六点半我下班。",
            pinyin: "Wǎnshang liù diǎn bàn wǒ xiàbān.",
            vietnamese: "6 rưỡi tối tôi tan làm."
          },
        ]
      },
      {
        id: "hsk1-l7-g4",
        title: "4. 语气助词“呢”（2）(Trợ từ ngữ khí “呢” khẳng định sự việc)",
        explanation: "Trợ từ '呢' (ne) đặt ở cuối câu để khẳng định một sự việc, thông tin xác thực với ngữ khí quả quyết hoặc vui tươi nhẹ nhàng.",
        examples: [
          {
            hanzi: "我下午有课呢。",
            pinyin: "Wǒ xiàwǔ yǒu kè ne.",
            vietnamese: "Buổi chiều tôi có tiết học đấy."
          },
          {
            hanzi: "他在家呢。",
            pinyin: "Tā zài jiā ne.",
            vietnamese: "Anh ấy đang ở nhà đấy."
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l7-w1", "hanzi": "吧", "pinyin": "ba", "hanViet": "ba", "vietnamese": "nhé, đi, thôi (trợ từ ngữ khí gợi ý, thương lượng)", "hskLevel": 1, "radical": "口", "strokeCount": 7, "example": "我们去看电影吧！", "exampleTranslation": "Chúng mình đi xem phim đi!", "tags": ["Bài 7", "Trợ từ"]},
      {"id": "hsk1-l7-w2", "hanzi": "半", "pinyin": "bàn", "hanViet": "bán", "vietnamese": "nửa, rưỡi", "hskLevel": 1, "radical": "十", "strokeCount": 5, "example": "我晚上六点半下班。", "exampleTranslation": "Buổi tối 6 rưỡi tôi tan làm.", "tags": ["Bài 7", "Số từ"]},
      {"id": "hsk1-l7-w3", "hanzi": "菜", "pinyin": "cài", "hanViet": "thái", "vietnamese": "món ăn, rau", "hskLevel": 1, "radical": "艹", "strokeCount": 11, "example": "你会做中国菜吗？", "exampleTranslation": "Bạn biết nấu món ăn Trung Quốc không?", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w4", "hanzi": "点", "pinyin": "diǎn", "hanViet": "điểm", "vietnamese": "giờ, điểm", "hskLevel": 1, "radical": "灬", "strokeCount": 9, "example": "现在几点？——现在八点。", "exampleTranslation": "Bây giờ mấy giờ? —— Bây giờ 8 giờ.", "tags": ["Bài 7", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l7-w5", "hanzi": "电影", "pinyin": "diànyǐng", "hanViet": "điện ảnh", "vietnamese": "phim, điện ảnh", "hskLevel": 1, "radical": "田", "strokeCount": 20, "example": "我看了一个电影。", "exampleTranslation": "Tớ xem hết cả một bộ phim hay tuyệt.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w6", "hanzi": "电影院", "pinyin": "diànyǐngyuàn", "hanViet": "điện ảnh viện", "vietnamese": "rạp chiếu phim", "hskLevel": 1, "radical": "田", "strokeCount": 29, "example": "学校前边有一家电影院。", "exampleTranslation": "Phía trước trường học có một rạp chiếu phim.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w7", "hanzi": "店", "pinyin": "diàn", "hanViet": "điếm", "vietnamese": "cửa hàng, quán", "hskLevel": 1, "radical": "广", "strokeCount": 8, "example": "这是一家水果店。", "exampleTranslation": "Đây là một tiệm bán hoa quả.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w8", "hanzi": "分", "pinyin": "fēn", "hanViet": "phân", "vietnamese": "phút, xu, điểm", "hskLevel": 1, "radical": "刀", "strokeCount": 4, "example": "现在八点十分。", "exampleTranslation": "Bây giờ là 8 giờ 10 phút.", "tags": ["Bài 7", "Lượng từ"]},
      {"id": "hsk1-l7-w9", "hanzi": "分钟", "pinyin": "fēnzhōng", "hanViet": "phân chung", "vietnamese": "phút (khoảng thời gian)", "hskLevel": 1, "radical": "刀", "strokeCount": 13, "example": "请等十分钟。", "exampleTranslation": "Xin vui lòng đợi 10 phút.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w10", "hanzi": "后", "pinyin": "hòu", "hanViet": "hậu", "vietnamese": "sau, sau khi, phía sau", "hskLevel": 1, "radical": "口", "strokeCount": 6, "example": "上火车后，我看见了王老师。", "exampleTranslation": "Sau khi lên tàu, tôi đã nhìn thấy cô Vương.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w11", "hanzi": "家", "pinyin": "jiā", "hanViet": "gia", "vietnamese": "nhà, gia đình; lượng từ cho công ty, cửa hàng", "hskLevel": 1, "radical": "宀", "strokeCount": 10, "example": "我家有四口人。", "exampleTranslation": "Nhà tôi có 4 người.", "tags": ["Bài 7", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l7-w12", "hanzi": "见", "pinyin": "jiàn", "hanViet": "kiến", "vietnamese": "gặp, thấy", "hskLevel": 1, "radical": "见", "strokeCount": 4, "example": "明天见！", "exampleTranslation": "Hẹn ngày mai gặp lại!", "tags": ["Bài 7", "Động từ"]},
      {"id": "hsk1-l7-w13", "hanzi": "看", "pinyin": "kàn", "hanViet": "khán", "vietnamese": "xem, nhìn, đọc (sách)", "hskLevel": 1, "radical": "目", "strokeCount": 9, "example": "我们在看电影呢。", "exampleTranslation": "Chúng tôi đang xem phim đấy.", "tags": ["Bài 7", "Động từ"]},
      {"id": "hsk1-l7-w14", "hanzi": "课", "pinyin": "kè", "hanViet": "khóa", "vietnamese": "bài học, tiết học, môn học", "hskLevel": 1, "radical": "讠", "strokeCount": 10, "example": "今天下午我有两节课。", "exampleTranslation": "Chiều nay tôi có hai tiết học.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w15", "hanzi": "里", "pinyin": "lǐ", "hanViet": "lý", "vietnamese": "trong, bên trong", "hskLevel": 1, "radical": "里", "strokeCount": 7, "example": "学校里有很多学生。", "exampleTranslation": "Trong trường có rất nhiều học sinh.", "tags": ["Bài 7", "Danh từ phương vị"]},
      {"id": "hsk1-l7-w16", "hanzi": "呢", "pinyin": "ne", "hanViet": "ni", "vietnamese": "thế, thì sao (trợ từ ngữ khí)", "hskLevel": 1, "radical": "口", "strokeCount": 8, "example": "我很好，你呢？", "exampleTranslation": "Tôi rất khỏe, còn bạn thì sao?", "tags": ["Bài 7", "Trợ từ"]},
      {"id": "hsk1-l7-w17", "hanzi": "上班", "pinyin": "shàngbān", "hanViet": "thượng ban", "vietnamese": "đi làm, vào ca làm việc", "hskLevel": 1, "radical": "一", "strokeCount": 13, "example": "我爸爸八点上班。", "exampleTranslation": "Bố tôi đi làm lúc 8 giờ.", "tags": ["Bài 7", "Động từ"]},
      {"id": "hsk1-l7-w18", "hanzi": "上课", "pinyin": "shàngkè", "hanViet": "thượng khóa", "vietnamese": "vào lớp, lên lớp, có tiết học", "hskLevel": 1, "radical": "一", "strokeCount": 13, "example": "老师，什么时候上课？", "exampleTranslation": "Thưa thầy, khi nào vào lớp học ạ?", "tags": ["Bài 7", "Động từ"]},
      {"id": "hsk1-l7-w19", "hanzi": "上午", "pinyin": "shàngwǔ", "hanViet": "thượng ngọ", "vietnamese": "buổi sáng (nửa đầu ngày)", "hskLevel": 1, "radical": "一", "strokeCount": 7, "example": "我明天上午在学校学习。", "exampleTranslation": "Sáng mai tôi học ở trường.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w20", "hanzi": "事", "pinyin": "shì", "hanViet": "sự", "vietnamese": "việc, sự việc, chuyện", "hskLevel": 1, "radical": "一", "strokeCount": 8, "example": "今天下午我有很多事。", "exampleTranslation": "Chiều nay tôi có rất nhiều việc.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w21", "hanzi": "晚上", "pinyin": "wǎnshang", "hanViet": "vãn thượng", "vietnamese": "buổi tối", "hskLevel": 1, "radical": "日", "strokeCount": 14, "example": "我晚上六点半下班。", "exampleTranslation": "Buổi tối 6 rưỡi tôi tan làm.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w22", "hanzi": "下课", "pinyin": "xiàkè", "hanViet": "hạ khóa", "vietnamese": "tan học, hết tiết học", "hskLevel": 1, "radical": "一", "strokeCount": 13, "example": "下课后我们去喝茶吧。", "exampleTranslation": "Tan học xong chúng mình đi uống trà nhé.", "tags": ["Bài 7", "Động từ"]},
      {"id": "hsk1-l7-w23", "hanzi": "下午", "pinyin": "xiàwǔ", "hanViet": "hạ ngọ", "vietnamese": "buổi chiều", "hskLevel": 1, "radical": "一", "strokeCount": 7, "example": "我下午有课呢。", "exampleTranslation": "Buổi chiều tôi có tiết học đấy.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w24", "hanzi": "现在", "pinyin": "xiànzài", "hanViet": "hiện tại", "vietnamese": "bây giờ, hiện nay", "hskLevel": 1, "radical": "王", "strokeCount": 14, "example": "现在几点？", "exampleTranslation": "Mấy giờ rồi cậu ơi?", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w25", "hanzi": "医院", "pinyin": "yīyuàn", "hanViet": "y viện", "vietnamese": "bệnh viện", "hskLevel": 1, "radical": "匚", "strokeCount": 16, "example": "我爸爸在医院工作。", "exampleTranslation": "Bố tôi làm việc ở bệnh viện.", "tags": ["Bài 7", "Danh từ"]},
      {"id": "hsk1-l7-w26", "hanzi": "在", "pinyin": "zài", "hanViet": "tại", "vietnamese": "ở, tại, đang (giới từ / phó từ)", "hskLevel": 1, "radical": "土", "strokeCount": 6, "example": "我明天上午在学校学习。", "exampleTranslation": "Sáng mai tôi học ở trường.", "tags": ["Bài 7", "Giới từ / Phó từ"]},
      {"id": "hsk1-l7-w27", "hanzi": "早上", "pinyin": "zǎoshang", "hanViet": "tảo thượng", "vietnamese": "buổi sáng sớm", "hskLevel": 1, "radical": "日", "strokeCount": 9, "example": "我早上七点起床。", "exampleTranslation": "Buổi sáng tôi thức dậy lúc 7 giờ.", "tags": ["Bài 7", "Danh từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l7-ex1",
        type: "multiple_choice",
        question: "Diễn đạt '6 giờ 30 phút tối' trong tiếng Trung chuẩn là:",
        options: ["A. 六点半晚上", "B. 晚上六点半", "C. 半六点晚上", "D. 晚上半六点"],
        correctAnswer: "B. 晚上六点半",
        explanation: "Quy tắc thời gian lớn trước, nhỏ sau: Buổi (晚上) + Giờ (六点) + Phút/Rưỡi (半)."
      },
      {
        id: "hsk1-l7-ex2",
        type: "fill_blank",
        question: "Điền trợ từ thích hợp vào câu rủ bạn bè: 我们去看电影___！",
        options: ["A. 吗", "B. 呢", "C. 吧", "D. 的"],
        correctAnswer: "C. 吧",
        explanation: "Dùng trợ từ ngữ khí '吧' ở cuối câu để gợi ý, rủ rê."
      },
    ],
  },
  // ==========================================================================
  // LESSON 8: 我爸爸也在医院工作 (Bố tôi cũng làm việc ở bệnh viện)
  // ==========================================================================
  {
    lessonNumber: 8,
    titleHanzi: "我爸爸也在医院工作",
    titlePinyin: "Wǒ bàba yě zài yīyuàn gōngzuò",
    titleVietnamese: "Bố tôi cũng làm việc ở bệnh viện",
    pageStart: 54,
    objectives: [
      "能听懂并描述处所、位置等信息 (Nghe hiểu và miêu tả thông tin về nơi chốn, vị trí).",
      "掌握介词“在”表示方位的用法 (Nắm vững cách dùng giới từ “在” biểu thị phương vị, nơi chốn).",
      "掌握能愿动词“能”的用法 (Nắm vững cách dùng động từ năng nguyện “能”).",
    ],
    texts: [
      {
        id: "hsk1-l8-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在王一飞家，白家月和陈天中来做客。(Ở nhà Vương Nhất Phi, Bạch Gia Nguyệt và Trần Thiên Trung đến thăm.)",
        speakerAnchors: { "白家月": 34, "王一飞": 58, "陈天中": 72 },
        lines: [
          { speaker: "白家月", hanzi: "房间外有一只小猫。", pinyin: "Fángjiān wài yǒu yì zhī xiǎo māo.", vietnamese: "Ngoài phòng có một chú mèo con kìa." },
          { speaker: "陈天中", hanzi: "我没看见，它在哪儿呢？", pinyin: "Wǒ méi kànjiàn, tā zài nǎr ne?", vietnamese: "Tớ chưa thấy, nó đang nấp ở đâu thế cậu?" },
          { speaker: "白家月", hanzi: "它在桌子下呢。", pinyin: "Tā zài zhuōzi xià ne.", vietnamese: "Nó đang nằm ở dưới gầm bàn kìa." },
          { speaker: "陈天中", hanzi: "这只小猫真漂亮！", pinyin: "Zhè zhī xiǎo māo zhēn piàoliang!", vietnamese: "Ôi chú mèo con này xinh xắn đáng yêu quá đi mất!" }
        ]
      },
      {
        id: "hsk1-l8-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在教室里，下课后，白家月给李文打电话。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt gọi điện cho Lý Văn.)",
        speakerAnchors: { "白家月": 27, "李文": 75 },
        lines: [
          { speaker: "白家月", hanzi: "我们在哪儿见呢？", pinyin: "Wǒmen zài nǎr jiàn ne?", vietnamese: "Chiều nay chúng mình hẹn gặp ở đâu bây giờ cậu nhỉ?" },
          { speaker: "李文", hanzi: "在学校书店前见吧。", pinyin: "Zài xuéxiào shūdiàn qián jiàn ba.", vietnamese: "Hẹn gặp trước hiệu sách của trường mình nhé." },
          { speaker: "白家月", hanzi: "好的。下午两点你能到吗？", pinyin: "Hǎo de. Xiàwǔ liǎng diǎn nǐ néng dào ma?", vietnamese: "Ừ được đấy. Hai giờ chiều cậu đến kịp không?" },
          { speaker: "李文", hanzi: "我能到。我在学校吃午饭。", pinyin: "Wǒ néng dào. Wǒ zài xuéxiào chī wǔfàn.", vietnamese: "Tớ đến kịp chứ. Trưa nay tớ ăn cơm luôn ở trường mà." }
        ]
      }
    ,
      {
        id: "hsk1-l8-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在医院里，刘明和同事小胡聊天儿。(Ở bệnh viện, Lưu Minh trò chuyện với đồng nghiệp là tiểu Hồ.)",
        speakerAnchors: { "刘明": 36, "小胡": 67 },
        lines: [
          { speaker: "刘明", hanzi: "小胡，还没吃饭呢？", pinyin: "Xiǎo Hú, hái méi chīfàn ne?", vietnamese: "Tiểu Hồ, em vẫn chưa kịp ăn cơm à?" },
          { speaker: "小胡", hanzi: "没吃呢。", pinyin: "Méi chī ne.", vietnamese: "Dạ em chưa kịp ăn miếng nào anh ạ." },
          { speaker: "刘明", hanzi: "大医院病人多，医生非常忙。", pinyin: "Dà yīyuàn bìngrén duō, yīshēng fēicháng máng.", vietnamese: "Bệnh viện tuyến đầu đông bệnh nhân quá, bác sĩ chúng mình bận tối mắt tối mũi." },
          { speaker: "小胡", hanzi: "是的。我爸爸也在医院工作，他也非常忙。", pinyin: "Shì de. Wǒ bàba yě zài yīyuàn gōngzuò, tā yě fēicháng máng.", vietnamese: "Dạ đúng thế anh ạ. Bố em cũng công tác trong ngành y, ông cũng bận rộn suốt ngày đêm." },
          { speaker: "刘明", hanzi: "你家有两个医生？", pinyin: "Nǐ jiā yǒu liǎng gè yīshēng?", vietnamese: "Ồ, vậy tính ra nhà em có tận hai bác sĩ cơ à?" },
          { speaker: "小胡", hanzi: "对。", pinyin: "Duì.", vietnamese: "Dạ vâng, đúng rồi anh ạ." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l8-g1",
        title: "1. 方位词 (Từ chỉ phương vị)",
        explanation: "Từ chỉ phương vị là những từ chỉ vị trí, phương hướng như: 上 (shàng - trên), 下 (xià - dưới), 前 (qián - trước), 后 (hòu - sau), 里 (lǐ - trong), 外 (wài - ngoài). Cấu trúc: 'Danh từ + Phương vị từ'.",
        examples: [
          {
            hanzi: "房间外有一只小猫。",
            pinyin: "Fángjiān wài yǒu yì zhī xiǎomāo.",
            vietnamese: "Bên ngoài phòng có một chú mèo nhỏ."
          },
          {
            hanzi: "桌子上有两本书。",
            pinyin: "Zhuōzi shang yǒu liǎng běn shū.",
            vietnamese: "Trên bàn có hai quyển sách."
          },
        ]
      },
      {
        id: "hsk1-l8-g2",
        title: "2. 介词“在” (Giới từ “在” chỉ địa điểm hành động)",
        explanation: "Giới từ '在' kết hợp với từ chỉ nơi chốn tạo thành cụm giới từ làm trạng ngữ, đứng trước động từ: 'Chủ ngữ + 在 + Nơi chốn + Động từ' (Ai làm việc gì ở đâu).",
        examples: [
          {
            hanzi: "我爸爸在医院工作。",
            pinyin: "Wǒ bàba zài yīyuàn gōngzuò.",
            vietnamese: "Bố tôi làm việc ở bệnh viện."
          },
          {
            hanzi: "他在书店看书。",
            pinyin: "Tā zài shūdiàn kàn shū.",
            vietnamese: "Anh ấy đọc sách ở hiệu sách."
          },
        ]
      },
      {
        id: "hsk1-l8-g3",
        title: "3. 能愿动词“能” (Động từ năng nguyện “能”)",
        explanation: "'能' (néng) đứng trước động từ biểu thị có đủ năng lực, điều kiện khách quan hoặc hoàn cảnh cho phép để thực hiện hành động. Phủ định là '不能' (bù néng).",
        examples: [
          {
            hanzi: "你能来吗？",
            pinyin: "Nǐ néng lái ma?",
            vietnamese: "Bạn có thể đến không?"
          },
          {
            hanzi: "我明天能去学校。",
            pinyin: "Wǒ míngtiān néng qù xuéxiào.",
            vietnamese: "Ngày mai tôi có thể đến trường."
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l8-w1", "hanzi": "病人", "pinyin": "bìngrén", "hanViet": "bệnh nhân", "vietnamese": "bệnh nhân, người bệnh", "hskLevel": 1, "radical": "疒", "strokeCount": 12, "example": "医院里有很多病人。", "exampleTranslation": "Trong bệnh viện có rất nhiều bệnh nhân.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w2", "hanzi": "大", "pinyin": "dà", "hanViet": "đại", "vietnamese": "lớn, to, nhiều (tuổi)", "hskLevel": 1, "radical": "大", "strokeCount": 3, "example": "这个苹果很大。", "exampleTranslation": "Quả táo này rất to.", "tags": ["Bài 8", "Tính từ"]},
      {"id": "hsk1-l8-w3", "hanzi": "到", "pinyin": "dào", "hanViet": "đáo", "vietnamese": "đến, tới", "hskLevel": 1, "radical": "刂", "strokeCount": 8, "example": "你什么时候能到饭店？", "exampleTranslation": "Khi nào bạn có thể đến nhà hàng?", "tags": ["Bài 8", "Động từ"]},
      {"id": "hsk1-l8-w4", "hanzi": "多", "pinyin": "duō", "hanViet": "đa", "vietnamese": "nhiều, bao nhiêu (hỏi mức độ)", "hskLevel": 1, "radical": "夕", "strokeCount": 6, "example": "你的学生多吗？", "exampleTranslation": "Học sinh của bạn có đông không?", "tags": ["Bài 8", "Tính từ / Phó từ"]},
      {"id": "hsk1-l8-w5", "hanzi": "饭", "pinyin": "fàn", "hanViet": "phạn", "vietnamese": "cơm, bữa ăn", "hskLevel": 1, "radical": "饣", "strokeCount": 7, "example": "我们去吃午饭吧。", "exampleTranslation": "Chúng ta đi ăn cơm trưa đi.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w6", "hanzi": "房间", "pinyin": "fángjiān", "hanViet": "phòng gian", "vietnamese": "căn phòng", "hskLevel": 1, "radical": "户", "strokeCount": 15, "example": "房间外有一只小猫。", "exampleTranslation": "Bên ngoài phòng có một chú mèo nhỏ.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w7", "hanzi": "工作", "pinyin": "gōngzuò", "hanViet": "công tác", "vietnamese": "làm việc, công việc", "hskLevel": 1, "radical": "工", "strokeCount": 10, "example": "你在哪儿工作？", "exampleTranslation": "Bạn làm việc ở đâu?", "tags": ["Bài 8", "Động từ / Danh từ"]},
      {"id": "hsk1-l8-w8", "hanzi": "看见", "pinyin": "kànjiàn", "hanViet": "khán kiến", "vietnamese": "nhìn thấy, trông thấy", "hskLevel": 1, "radical": "目", "strokeCount": 13, "example": "你看见我的手机了吗？", "exampleTranslation": "Bạn có nhìn thấy điện thoại của tôi không?", "tags": ["Bài 8", "Động từ"]},
      {"id": "hsk1-l8-w9", "hanzi": "猫", "pinyin": "māo", "hanViet": "miêu", "vietnamese": "con mèo", "hskLevel": 1, "radical": "犭", "strokeCount": 11, "example": "房间外有一只小猫。", "exampleTranslation": "Bên ngoài phòng có một chú mèo con.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w10", "hanzi": "没", "pinyin": "méi", "hanViet": "một", "vietnamese": "không, chưa (phủ định)", "hskLevel": 1, "radical": "氵", "strokeCount": 7, "example": "我没去学校。", "exampleTranslation": "Tôi không đi học.", "tags": ["Bài 8", "Phó từ"]},
      {"id": "hsk1-l8-w11", "hanzi": "能", "pinyin": "néng", "hanViet": "năng", "vietnamese": "có thể, có khả năng", "hskLevel": 1, "radical": "月", "strokeCount": 10, "example": "你能帮我一下吗？", "exampleTranslation": "Bạn có thể giúp tôi một chút không?", "tags": ["Bài 8", "Động từ năng nguyện"]},
      {"id": "hsk1-l8-w12", "hanzi": "漂亮", "pinyin": "piàoliang", "hanViet": "phiêu lượng", "vietnamese": "xinh đẹp, đẹp đẽ", "hskLevel": 1, "radical": "氵", "strokeCount": 23, "example": "这件衣服真漂亮！", "exampleTranslation": "Chiếc áo này thật đẹp!", "tags": ["Bài 8", "Tính từ"]},
      {"id": "hsk1-l8-w13", "hanzi": "前", "pinyin": "qián", "hanViet": "tiền", "vietnamese": "trước, phía trước, trước đây", "hskLevel": 1, "radical": "刀", "strokeCount": 9, "example": "学校前有一家书店。", "exampleTranslation": "Trước trường có một hiệu sách.", "tags": ["Bài 8", "Danh từ phương vị"]},
      {"id": "hsk1-l8-w14", "hanzi": "书店", "pinyin": "shūdiàn", "hanViet": "thư điếm", "vietnamese": "hiệu sách, nhà sách", "hskLevel": 1, "radical": "乛", "strokeCount": 12, "example": "我想去书店买汉语书。", "exampleTranslation": "Tôi muốn đi nhà sách mua sách tiếng Trung.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w15", "hanzi": "外", "pinyin": "wài", "hanViet": "ngoại", "vietnamese": "ngoài, bên ngoài", "hskLevel": 1, "radical": "夕", "strokeCount": 5, "example": "房间外有一只小狗。", "exampleTranslation": "Bên ngoài phòng có một chú cún con.", "tags": ["Bài 8", "Danh từ phương vị"]},
      {"id": "hsk1-l8-w16", "hanzi": "午饭", "pinyin": "wǔfàn", "hanViet": "ngọ phạn", "vietnamese": "cơm trưa, bữa trưa", "hskLevel": 1, "radical": "十", "strokeCount": 11, "example": "我们一起吃午饭吧。", "exampleTranslation": "Chúng mình cùng đi ăn cơm trưa đi.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w17", "hanzi": "下", "pinyin": "xià", "hanViet": "hạ", "vietnamese": "dưới, phía dưới; xuống, tan (ca, lớp); rơi (mưa, tuyết)", "hskLevel": 1, "radical": "一", "strokeCount": 3, "example": "下午我们去看电影吧。", "exampleTranslation": "Buổi chiều chúng mình đi xem phim đi.", "tags": ["Bài 8", "Động từ / Danh từ"]},
      {"id": "hsk1-l8-w18", "hanzi": "小", "pinyin": "xiǎo", "hanViet": "tiểu", "vietnamese": "nhỏ, bé, ít tuổi", "hskLevel": 1, "radical": "小", "strokeCount": 3, "example": "房间外有一只小猫。", "exampleTranslation": "Bên ngoài phòng có một chú mèo nhỏ.", "tags": ["Bài 8", "Tính từ"]},
      {"id": "hsk1-l8-w19", "hanzi": "学校", "pinyin": "xuéxiào", "hanViet": "học hiệu", "vietnamese": "trường học", "hskLevel": 1, "radical": "子", "strokeCount": 18, "example": "学校前边有一家电影院。", "exampleTranslation": "Phía trước trường học có một rạp chiếu phim.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w20", "hanzi": "医生", "pinyin": "yīshēng", "hanViet": "y sinh", "vietnamese": "bác sĩ", "hskLevel": 1, "radical": "匚", "strokeCount": 12, "example": "胡医生在医院工作。", "exampleTranslation": "Bác sĩ Hồ làm việc ở bệnh viện.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w21", "hanzi": "在", "pinyin": "zài", "hanViet": "tại", "vietnamese": "ở, tại, đang (giới từ / phó từ)", "hskLevel": 1, "radical": "土", "strokeCount": 6, "example": "我明天上午在学校学习。", "exampleTranslation": "Sáng mai tôi học ở trường.", "tags": ["Bài 8", "Giới từ / Phó từ"]},
      {"id": "hsk1-l8-w22", "hanzi": "只", "pinyin": "zhī", "hanViet": "chích", "vietnamese": "con (lượng từ cho động vật)", "hskLevel": 1, "radical": "口", "strokeCount": 5, "example": "房间外有一只小猫。", "exampleTranslation": "Bên ngoài phòng có một chú mèo nhỏ.", "tags": ["Bài 8", "Lượng từ"]},
      {"id": "hsk1-l8-w23", "hanzi": "桌子", "pinyin": "zhuōzi", "hanViet": "trác tử", "vietnamese": "cái bàn", "hskLevel": 1, "radical": "木", "strokeCount": 13, "example": "桌子上有一本书。", "exampleTranslation": "Trên bàn có một cuốn sách.", "tags": ["Bài 8", "Danh từ"]},
      {"id": "hsk1-l8-w24", "hanzi": "胡医生", "pinyin": "Hú yīshēng", "hanViet": "hồ y sinh", "vietnamese": "bác sĩ Hồ", "hskLevel": 1, "radical": "月", "strokeCount": 21, "example": "胡医生是北京人。", "exampleTranslation": "Bác sĩ Hồ là người Bắc Kinh.", "tags": ["Bài 8", "Danh từ riêng"]},
    ],
    exercises: [
      {
        id: "hsk1-l8-ex1",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu đúng ngữ pháp: 在 / 工作 / 爸爸 / 我 / 医院",
        scrambleSegments: ["我爸爸", "在医院", "工作"],
        options: ["我爸爸在医院工作", "我爸爸工作在医院", "在医院我爸爸工作"],
        correctAnswer: "我爸爸在医院工作",
        explanation: "Quy tắc nơi chốn: Chủ ngữ (我爸爸) + Ở đâu (在医院) + Làm gì (工作)."
      },
      {
        id: "hsk1-l8-ex2",
        type: "multiple_choice",
        question: "Để nói 'Bên ngoài phòng', ta nói thế nào trong tiếng Trung?",
        options: ["A. 外房间", "B. 房间外", "C. 房间在", "D. 房间里"],
        correctAnswer: "B. 房间外",
        explanation: "Từ chỉ phương vị đứng sau danh từ: 房间 (phòng) + 外 (ngoài) = 房间外."
      },
    ],
  },
  // ==========================================================================
  // LESSON 9: 我明天上午在学校学习 (Sáng mai tôi học ở trường)
  // ==========================================================================
  {
    lessonNumber: 9,
    titleHanzi: "我明天上午在学校学习",
    titlePinyin: "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí",
    titleVietnamese: "Sáng mai tôi học ở trường",
    pageStart: 61,
    objectives: [
      "能听懂并使用“有/是”表达存在 (Nghe hiểu và dùng “有/是” biểu đạt sự tồn tại của người/vật).",
      "掌握时间词语和处所词语同现时的顺序 (Nắm vững trật tự sắp xếp khi từ chỉ thời gian và địa điểm cùng xuất hiện).",
      "掌握“第”的用法 (Nắm vững cách dùng của tiền tố số thứ tự “第”).",
      "了解当代中国人的休闲活动 (Tìm hiểu các hoạt động giải trí của người Trung Quốc hiện đại).",
    ],
    texts: [
      {
        id: "hsk1-l9-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在校园里，李文和白家月在聊天儿。(Trong khuôn viên trường, Lý Văn và Bạch Gia Nguyệt đang trò chuyện.)",
        speakerAnchors: { "李文": 26, "白家月": 74 },
        lines: [
          { speaker: "李文", hanzi: "学校前边有一家电影院。", pinyin: "Xuéxiào qiánbian yǒu yī jiā diànyǐngyuàn.", vietnamese: "Phía trước trường mình có một rạp chiếu phim đấy cậu." },
          { speaker: "白家月", hanzi: "对。我们晚上去那个电影院看电影吧。", pinyin: "Duì. Wǒmen wǎnshang qù nàge diànyǐngyuàn kàn diànyǐng ba.", vietnamese: "Ừ đúng rồi. Hay tối nay hai đứa mình ra rạp đó xem phim đi!" },
          { speaker: "李文", hanzi: "好！我们七点在电影院外边见，好吗？", pinyin: "Hǎo! Wǒmen qī diǎn zài diànyǐngyuàn wàibian jiàn, hǎo ma?", vietnamese: "Nhất trí luôn! Bảy giờ tối chúng mình hẹn gặp ở trước cửa rạp nhé, được không cậu?" },
          { speaker: "白家月", hanzi: "好的，晚上七点见！", pinyin: "Hǎo de, wǎnshang qī diǎn jiàn!", vietnamese: "Ok cậu, hẹn cậu đúng bảy giờ tối nhé!" }
        ]
      },
      {
        id: "hsk1-l9-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
        speakerAnchors: { "白家月": 36, "陈天中": 61 },
        lines: [
          { speaker: "陈天中", hanzi: "椅子上有一本中文书，那是谁的书？", pinyin: "Yǐzi shang yǒu yì běn Zhōngwén shū, nà shì shéi de shū?", vietnamese: "Trên ghế có một quyển sách tiếng Trung kìa, sách của ai thế nhỉ?" },
          { speaker: "白家月", hanzi: "是我的书，谢谢。这是我的第二本中文书。", pinyin: "Shì wǒ de shū, xièxie. Zhè shì wǒ de dì-èr běn Zhōngwén shū.", vietnamese: "Sách của tớ đấy, cảm ơn cậu nhiều nhé! Đây là quyển sách tiếng Trung thứ hai của tớ rồi đấy." },
          { speaker: "陈天中", hanzi: "不客气。你明天上午在哪儿？", pinyin: "Bú kèqi. Nǐ míngtiān shàngwǔ zài nǎr?", vietnamese: "Khách sáo làm gì. Sáng mai cậu ở đâu thế?" },
          { speaker: "白家月", hanzi: "我明天上午在学校学习。", pinyin: "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí.", vietnamese: "Sáng mai tớ ở trường tự học bài." }
        ]
      }
    ,
      {
        id: "hsk1-l9-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在公司里，王一雪和杨同乐休息时聊天儿，谈论周末生活。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao về cuộc sống cuối tuần.)",
        speakerAnchors: { "王一雪": 32, "杨同乐": 67 },
        lines: [
          { speaker: "王一雪", hanzi: "明天星期六，你做什么？", pinyin: "Míngtiān Xīngqīliù, nǐ zuò shénme?", vietnamese: "Mai thứ Bảy rồi, em có kế hoạch gì chưa Đồng Lạc?" },
          { speaker: "杨同乐", hanzi: "我白天在家里读书，晚上和朋友们去外边唱歌。", pinyin: "Wǒ báitiān zài jiā lǐ dúshū, wǎnshang hé péngyoumen qù wàibian chàng gē.", vietnamese: "Dạ ban ngày em ở nhà đọc sách, tối thì rủ bạn bè đi hát hò xả hơi chị ạ." },
          { speaker: "王一雪", hanzi: "你唱歌很好听。", pinyin: "Nǐ chànggē hěn hǎotīng.", vietnamese: "Chị nghe nói em hát hay lắm đấy nha!" },
          { speaker: "杨同乐", hanzi: "谢谢！您星期六做什么？", pinyin: "Xièxie! Nín Xīngqīliù zuò shénme?", vietnamese: "Dạ em cảm ơn chị! Thế thứ Bảy chị làm gì ạ?" },
          { speaker: "王一雪", hanzi: "我在家里做饭，看电视，和孩子们、小狗玩。", pinyin: "Wǒ zài jiā lǐ zuòfàn, kàn diànshì, hé háizimen, xiǎo gǒu wán.", vietnamese: "Chị ở nhà nấu nướng, xem TV, rồi chơi đùa với mấy đứa nhỏ và chú cún con thôi em." },
          { speaker: "杨同乐", hanzi: "我也有一只小狗。", pinyin: "Wǒ yě yǒu yì zhī xiǎo gǒu.", vietnamese: "Dạ nhà em cũng có nuôi một chú cún con đấy chị." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l9-g1",
        title: "1. 存现句（1）(Câu tồn hiện chỉ sự tồn tại với “有/是”)",
        explanation: "Câu tồn hiện dùng để biểu thị ở một địa điểm nào đó có người hoặc sự vật xuất hiện. Cấu trúc: 'Nơi chốn / Phương vị + 有 / 是 + Danh từ'. '有' nhấn mạnh sự tồn tại khách quan, '是' nhấn mạnh sự xác định duy nhất.",
        examples: [
          {
            hanzi: "学校前边有一家电影院。",
            pinyin: "Xuéxiào qiánbian yǒu yì jiā diànyǐngyuàn.",
            vietnamese: "Phía trước trường học có một rạp chiếu phim."
          },
          {
            hanzi: "桌子上是一本书。",
            pinyin: "Zhuōzi shang shì yì běn shū.",
            vietnamese: "Trên bàn là một cuốn sách."
          },
        ]
      },
      {
        id: "hsk1-l9-g2",
        title: "2. 时间词语和处所词语同时作状语的顺序 (Trật tự Thời gian & Địa điểm cùng làm trạng ngữ)",
        explanation: "Khi trong câu có cả trạng ngữ chỉ thời gian và trạng ngữ chỉ nơi chốn, quy tắc bất di bất dịch của tiếng Trung là: THỜI GIAN ĐỨNG TRƯỚC NƠI CHỐN. Công thức: 'Chủ ngữ + Thời gian + Tại nơi chốn + Làm gì'.",
        examples: [
          {
            hanzi: "我明天上午在学校学习。",
            pinyin: "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí.",
            vietnamese: "Sáng mai tôi học ở trường."
          },
          {
            hanzi: "他今天晚上在家里看电视。",
            pinyin: "Tā jīntiān wǎnshang zài jiā lǐ kàn diànshì.",
            vietnamese: "Tối nay anh ấy xem ti vi ở nhà."
          },
        ]
      },
      {
        id: "hsk1-l9-g3",
        title: "3. 表示序数的“第” (Tiền tố chỉ số thứ tự “第”)",
        explanation: "Thêm tiền tố '第' (dì) vào trước số từ để biểu thị thứ tự: '第 + Số từ [+ Lượng từ + Danh từ]'.",
        examples: [
          {
            hanzi: "第一",
            pinyin: "dì-yī",
            vietnamese: "thứ nhất, số một"
          },
          {
            hanzi: "第一本书",
            pinyin: "dì-yī běn shū",
            vietnamese: "cuốn sách đầu tiên"
          },
          {
            hanzi: "第二只猫",
            pinyin: "dì-èr zhī māo",
            vietnamese: "con mèo thứ hai"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l9-w1", "hanzi": "白天", "pinyin": "báitiān", "hanViet": "bạch thiên", "vietnamese": "ban ngày", "hskLevel": 1, "radical": "白", "strokeCount": 9, "example": "他白天在学校学习。", "exampleTranslation": "Ban ngày anh ấy học ở trường.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w2", "hanzi": "本", "pinyin": "běn", "hanViet": "bản", "vietnamese": "quyển, cuốn (lượng từ cho sách vở)", "hskLevel": 1, "radical": "木", "strokeCount": 5, "example": "桌子上有一本书。", "exampleTranslation": "Trên bàn có một cuốn sách.", "tags": ["Bài 9", "Lượng từ"]},
      {"id": "hsk1-l9-w3", "hanzi": "边", "pinyin": "bian", "hanViet": "biên", "vietnamese": "bên, phía, mặt", "hskLevel": 1, "radical": "辶", "strokeCount": 5, "example": "学校旁边有一家书店。", "exampleTranslation": "Bên cạnh trường học có một hiệu sách.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w4", "hanzi": "唱", "pinyin": "chàng", "hanViet": "xướng", "vietnamese": "hát", "hskLevel": 1, "radical": "口", "strokeCount": 11, "example": "她喜欢唱歌。", "exampleTranslation": "Cô ấy thích ca hát.", "tags": ["Bài 9", "Động từ"]},
      {"id": "hsk1-l9-w5", "hanzi": "第", "pinyin": "dì", "hanViet": "đệ", "vietnamese": "thứ (tiền tố chỉ số thứ tự)", "hskLevel": 1, "radical": "竹", "strokeCount": 11, "example": "这是我第一天来学校。", "exampleTranslation": "Đây là ngày đầu tiên tôi đến trường.", "tags": ["Bài 9", "Tiền tố"]},
      {"id": "hsk1-l9-w6", "hanzi": "电视", "pinyin": "diànshì", "hanViet": "điện thị", "vietnamese": "ti vi, truyền hình", "hskLevel": 1, "radical": "田", "strokeCount": 13, "example": "他晚上喜欢看电视。", "exampleTranslation": "Buổi tối anh ấy thích xem ti vi.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w7", "hanzi": "读书", "pinyin": "dúshū", "hanViet": "độc thư", "vietnamese": "đọc sách, đi học", "hskLevel": 1, "radical": "讠", "strokeCount": 14, "example": "他在房间里读书呢。", "exampleTranslation": "Anh ấy đang đọc sách trong phòng.", "tags": ["Bài 9", "Động từ"]},
      {"id": "hsk1-l9-w8", "hanzi": "歌", "pinyin": "gē", "hanViet": "ca", "vietnamese": "bài hát, ca khúc", "hskLevel": 1, "radical": "欠", "strokeCount": 14, "example": "这首歌真好听！", "exampleTranslation": "Bài hát này thật hay!", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w9", "hanzi": "狗", "pinyin": "gǒu", "hanViet": "cẩu", "vietnamese": "con chó", "hskLevel": 1, "radical": "犭", "strokeCount": 8, "example": "房间里有一只小狗。", "exampleTranslation": "Trong phòng có một chú cún con.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w10", "hanzi": "好听", "pinyin": "hǎotīng", "hanViet": "hảo thính", "vietnamese": "hay, êm tai (nhạc, giọng nói)", "hskLevel": 1, "radical": "女", "strokeCount": 13, "example": "这首中文歌真好听！", "exampleTranslation": "Bài hát tiếng Trung này nghe thật hay!", "tags": ["Bài 9", "Tính từ"]},
      {"id": "hsk1-l9-w11", "hanzi": "和", "pinyin": "hé", "hanViet": "hòa", "vietnamese": "và, với, cùng", "hskLevel": 1, "radical": "口", "strokeCount": 8, "example": "我和李文是好朋友。", "exampleTranslation": "Tôi và Lý Văn là bạn tốt.", "tags": ["Bài 9", "Liên từ / Giới từ"]},
      {"id": "hsk1-l9-w12", "hanzi": "家", "pinyin": "jiā", "hanViet": "gia", "vietnamese": "nhà, gia đình; lượng từ cho công ty, cửa hàng", "hskLevel": 1, "radical": "宀", "strokeCount": 10, "example": "我家有四口人。", "exampleTranslation": "Nhà tôi có 4 người.", "tags": ["Bài 9", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l9-w13", "hanzi": "那", "pinyin": "nà", "hanViet": "na", "vietnamese": "kia, đó, ấy", "hskLevel": 1, "radical": "阝", "strokeCount": 6, "example": "那是谁的电脑？", "exampleTranslation": "Kia là máy tính của ai?", "tags": ["Bài 9", "Đại từ"]},
      {"id": "hsk1-l9-w14", "hanzi": "那个", "pinyin": "nàge", "hanViet": "na cá", "vietnamese": "cái đó, người kia", "hskLevel": 1, "radical": "阝", "strokeCount": 9, "example": "那个苹果很大。", "exampleTranslation": "Quả táo đó rất to.", "tags": ["Bài 9", "Đại từ"]},
      {"id": "hsk1-l9-w15", "hanzi": "朋友", "pinyin": "péngyou", "hanViet": "bằng hữu", "vietnamese": "bạn bè, người bạn", "hskLevel": 1, "radical": "月", "strokeCount": 12, "example": "我们是好朋友。", "exampleTranslation": "Chúng tôi là bạn tốt.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w16", "hanzi": "前边", "pinyin": "qiánbian", "hanViet": "tiền biên", "vietnamese": "phía trước, đằng trước", "hskLevel": 1, "radical": "刀", "strokeCount": 14, "example": "学校前边有一家电影院。", "exampleTranslation": "Phía trước trường học có một rạp chiếu phim.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w17", "hanzi": "上", "pinyin": "shàng", "hanViet": "thượng", "vietnamese": "lên, trên; vào (học, ca làm)", "hskLevel": 1, "radical": "一", "strokeCount": 3, "example": "桌子上有两本书。", "exampleTranslation": "Trên bàn có hai cuốn sách.", "tags": ["Bài 9", "Động từ / Danh từ phương vị"]},
      {"id": "hsk1-l9-w18", "hanzi": "书", "pinyin": "shū", "hanViet": "thư", "vietnamese": "sách, cuốn sách", "hskLevel": 1, "radical": "乛", "strokeCount": 4, "example": "他在看书呢。", "exampleTranslation": "Anh ấy đang đọc sách đấy.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w19", "hanzi": "外边", "pinyin": "wàibian", "hanViet": "ngoại biên", "vietnamese": "phía ngoài, bên ngoài", "hskLevel": 1, "radical": "夕", "strokeCount": 10, "example": "外边下雨了。", "exampleTranslation": "Bên ngoài trời mưa rồi.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w20", "hanzi": "玩", "pinyin": "wán", "hanViet": "ngoạn", "vietnamese": "chơi, vui chơi", "hskLevel": 1, "radical": "王", "strokeCount": 8, "example": "周末你想去哪儿玩？", "exampleTranslation": "Cuối tuần bạn muốn đi đâu chơi?", "tags": ["Bài 9", "Động từ"]},
      {"id": "hsk1-l9-w21", "hanzi": "学习", "pinyin": "xuéxí", "hanViet": "học tập", "vietnamese": "học tập, học rèn luyện", "hskLevel": 1, "radical": "子", "strokeCount": 11, "example": "我明天上午在学校学习。", "exampleTranslation": "Sáng mai tôi học tập ở trường.", "tags": ["Bài 9", "Động từ"]},
      {"id": "hsk1-l9-w22", "hanzi": "椅子", "pinyin": "yǐzi", "hanViet": "ỷ tử", "vietnamese": "cái ghế", "hskLevel": 1, "radical": "木", "strokeCount": 15, "example": "椅子上有两本书。", "exampleTranslation": "Trên ghế có hai cuốn sách.", "tags": ["Bài 9", "Danh từ"]},
      {"id": "hsk1-l9-w23", "hanzi": "做", "pinyin": "zuò", "hanViet": "tác", "vietnamese": "làm, nấu", "hskLevel": 1, "radical": "亻", "strokeCount": 11, "example": "你会做饭吗？", "exampleTranslation": "Bạn biết nấu ăn không?", "tags": ["Bài 9", "Động từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l9-ex1",
        type: "sentence_scramble",
        question: "Sắp xếp câu đúng trật tự thời gian và địa điểm: 在学校 / 我 / 明天上午 / 学习",
        scrambleSegments: ["我", "明天上午", "在学校", "学习"],
        options: ["我明天上午在学校学习", "我在学校明天上午学习", "明天上午学习我在学校"],
        correctAnswer: "我明天上午在学校学习",
        explanation: "Quy tắc vàng tiếng Trung: Thời gian (明天上午) đứng TRƯỚC địa điểm (在学校)."
      },
      {
        id: "hsk1-l9-ex2",
        type: "multiple_choice",
        question: "Để nói 'bài hát thứ nhất', ta dùng:",
        options: ["A. 一首歌", "B. 第一首歌", "C. 歌第一", "D. 头一首歌"],
        correctAnswer: "B. 第一首歌",
        explanation: "Tiền tố chỉ số thứ tự '第': 第 + 一 +  lượng từ 首 + danh từ 歌."
      },
    ],
  },
  // ==========================================================================
  // LESSON 10: 这儿的苹果真便宜！ (Táo ở đây thật rẻ!)
  // ==========================================================================
  {
    lessonNumber: 10,
    titleHanzi: "这儿的苹果真便宜！",
    titlePinyin: "Zhèr de píngguǒ zhēn piányi!",
    titleVietnamese: "Táo ở đây thật rẻ!",
    pageStart: 70,
    objectives: [
      "能听懂、看懂并简单谈论商品价格 (Nghe hiểu, đọc hiểu và trao đổi đơn giản về giá cả hàng hóa).",
      "掌握形容词谓语句的用法 (Nắm vững cách dùng câu vị ngữ tính từ).",
      "掌握疑问代词“怎么样”的用法 (Nắm vững cách dùng đại từ nghi vấn “怎么样”).",
      "认识人民币 (Làm quen và nhận biết đồng Nhân dân tệ).",
    ],
    texts: [
      {
        id: "hsk1-l10-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在小店里，王一雪在买杯子。(Ở cửa hàng nhỏ, Vương Nhất Tuyết đang mua cốc.)",
        speakerAnchors: { "王一雪": 35, "店员": 77 },
        lines: [
          { speaker: "王一雪", hanzi: "请问，有杯子吗？", pinyin: "Qǐngwèn, yǒu bēizi ma?", vietnamese: "Em ơi cho chị hỏi, ở đây có bán cốc uống nước không em?" },
          { speaker: "店员", hanzi: "有，杯子在这边。", pinyin: "Yǒu, bēizi zài zhèbian.", vietnamese: "Dạ có chị ơi, các mẫu cốc ở ngay bên này ạ." },
          { speaker: "王一雪", hanzi: "多少钱一个？", pinyin: "Duōshao qián yí gè?", vietnamese: "Mỗi chiếc này giá bao nhiêu tiền thế em?" },
          { speaker: "店员", hanzi: "这些五块钱一个，那些十块钱一个。", pinyin: "Zhèxiē wǔ kuài qián yí gè, nàxiē shí kuài qián yí gè.", vietnamese: "Dạ mấy chiếc này 5 tệ một chiếc, còn mấy mẫu đằng kia thì 10 tệ một chiếc chị ạ." },
          { speaker: "王一雪", hanzi: "我买这个吧。", pinyin: "Wǒ mǎi zhège ba.", vietnamese: "Thế gói cho chị chiếc này nhé." }
        ]
      }
    ,
      {
        id: "hsk1-l10-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在集市上，王一雪在买水果。(Ở chợ, Vương Nhất Tuyết đang mua hoa quả.)",
        speakerAnchors: { "王一雪": 33, "摊主": 77 },
        lines: [
          { speaker: "王一雪", hanzi: "这儿的水果真不少！", pinyin: "Zhèr de shuǐguǒ zhēn bù shǎo!", vietnamese: "Hoa quả ở sạp bác nhìn tươi ngon và phong phú quá chừng!" },
          { speaker: "摊主", hanzi: "您想买什么？", pinyin: "Nín xiǎng mǎi shénme?", vietnamese: "Chị muốn chọn mua loại quả nào ạ?" },
          { speaker: "王一雪", hanzi: "我想买两斤苹果。", pinyin: "Wǒ xiǎng mǎi liǎng jīn píngguǒ.", vietnamese: "Cho tôi mua hai cân táo nhé bác." },
          { speaker: "摊主", hanzi: "苹果三块五一斤。这些七块二，七块钱吧。", pinyin: "Píngguǒ sān kuài wǔ yī jīn. Zhèxiē qī kuài èr, qī kuài qián ba.", vietnamese: "Táo ba tệ rưỡi một cân chị nhé. Của chị hết bảy tệ hai hào, tính chẵn cho chị bảy tệ thôi!" },
          { speaker: "王一雪", hanzi: "好的，这儿的苹果真便宜！", pinyin: "Hǎo de, zhèr de píngguǒ zhēn piányí!", vietnamese: "Vâng cảm ơn bác, táo ở sạp bác vừa tươi giòn lại vừa rẻ thật đấy!" }
        ]
      },
      {
        id: "hsk1-l10-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在商场里，刘明和王一雪在给孩子们买衣服。(Ở trung tâm thương mại, Lưu Minh và Vương Nhất Tuyết đang mua quần áo cho các con.)",
        speakerAnchors: { "王一雪": 41, "刘明": 66 },
        lines: [
          { speaker: "王一雪", hanzi: "这家商店衣服真多！这件一百元，怎么样？", pinyin: "Zhè jiā shāngdiàn yīfu zhēn duō! Zhè jiàn yī bǎi yuán, zěnmeyàng?", vietnamese: "Cửa hàng này nhiều mẫu quần áo đẹp ghê! Chiếc áo này một trăm tệ, anh thấy thế nào?" },
          { speaker: "刘明", hanzi: "好看，也不贵。", pinyin: "Hǎokàn, yě bú guì.", vietnamese: "Đẹp đấy em, giá cả cũng rất phải chăng." },
          { speaker: "王一雪", hanzi: "小雪能穿，买一件吧。", pinyin: "Xiǎo Xuě néng chuān, mǎi yī jiàn ba.", vietnamese: "Bé Tuyết mặc vừa xinh đấy, mình mua cho con một chiếc anh nhé." },
          { speaker: "刘明", hanzi: "好的。小明能穿吗？", pinyin: "Hǎo de. Xiǎo Míng néng chuān ma?", vietnamese: "Ừ mua đi em. Thế cu Minh có mặc vừa kiểu này không?" },
          { speaker: "王一雪", hanzi: "不能。这些是女孩子穿的衣服，男孩子的衣服在那儿。", pinyin: "Bù néng. Zhèxiē shì nǚ háizi chuān de yīfu, nán háizi de yīfu zài nàr.", vietnamese: "Không anh ơi. Mấy mẫu này là dành cho bé gái, đồ cho bé trai ở tít góc đằng kia cơ." },
          { speaker: "刘明", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Ok, mình lưu lại rồi nhé." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l10-g1",
        title: "1. 钱数的表达 (Cách biểu đạt số tiền trong tiếng Trung)",
        explanation: "Tiền tệ Trung Quốc (Nhân dân tệ RMB) có 3 đơn vị: Khẩu ngữ dùng 块 (kuài - đồng) / 毛 (máo - hào) / 分 (fēn - xu). Văn viết dùng 元 (yuán) / 角 (jiǎo) / 分 (fēn). Khi hỏi giá tiền, dùng '多少钱？' (duōshao qián?).",
        examples: [
          {
            hanzi: "苹果多少钱一斤？",
            pinyin: "Píngguǒ duōshao qián yì jīn?",
            vietnamese: "Táo bao nhiêu tiền một cân (500g)?"
          },
          {
            hanzi: "三块五毛",
            pinyin: "sān kuài wǔ máo",
            vietnamese: "3 tệ 5 hào (3.5 RMB)"
          },
          {
            hanzi: "这件衣服一百元。",
            pinyin: "Zhè jiàn yīfu yìbǎi yuán.",
            vietnamese: "Bộ quần áo này 100 tệ."
          },
        ]
      },
      {
        id: "hsk1-l10-g2",
        title: "2. 形容词谓语句 (Câu vị ngữ tính từ)",
        explanation: "Câu có vị ngữ do tính từ đảm nhiệm dùng để miêu tả đặc điểm, tính chất. Giữa chủ ngữ và tính từ KHÔNG dùng '是'. Thông thường, tính từ đi kèm các phó từ chỉ mức độ như '很' (rất), '真' (thật là), '非常' (vô cùng).",
        examples: [
          {
            hanzi: "这儿的苹果真便宜！",
            pinyin: "Zhèr de píngguǒ zhēn piányi!",
            vietnamese: "Táo ở đây thật rẻ!"
          },
          {
            hanzi: "那件衣服非常贵。",
            pinyin: "Nà jiàn yīfu fēicháng guì.",
            vietnamese: "Chiếc áo kia vô cùng đắt."
          },
        ]
      },
      {
        id: "hsk1-l10-g3",
        title: "3. 疑问代词“怎么样” (Đại từ nghi vấn “怎么样”)",
        explanation: "'怎么样' (zěnmeyàng) dùng để hỏi về tính chất, tình hình của người/vật hoặc trưng cầu ý kiến đề xuất của người khác.",
        examples: [
          {
            hanzi: "这件衣服怎么样？",
            pinyin: "Zhè jiàn yīfu zěnmeyàng?",
            vietnamese: "Chiếc áo này thế nào?"
          },
          {
            hanzi: "我们去买水果，怎么样？",
            pinyin: "Wǒmen qù mǎi shuǐguǒ, zěnmeyàng?",
            vietnamese: "Chúng mình đi mua hoa quả nhé, thấy sao?"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l10-w1", "hanzi": "杯子", "pinyin": "bēizi", "hanViet": "bôi tử", "vietnamese": "cái cốc, cái ly, cái chén", "hskLevel": 1, "radical": "木", "strokeCount": 11, "example": "请问，有杯子吗？", "exampleTranslation": "Xin hỏi, có cái cốc không?", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w2", "hanzi": "穿", "pinyin": "chuān", "hanViet": "xuyên", "vietnamese": "mặc, đi (quần áo, giày dép)", "hskLevel": 1, "radical": "穴", "strokeCount": 9, "example": "她穿这件衣服真漂亮！", "exampleTranslation": "Cô ấy mặc chiếc áo này thật đẹp!", "tags": ["Bài 10", "Động từ"]},
      {"id": "hsk1-l10-w3", "hanzi": "贵", "pinyin": "guì", "hanViet": "quý", "vietnamese": "đắt, quý", "hskLevel": 1, "radical": "贝", "strokeCount": 9, "example": "这件衣服太贵了！", "exampleTranslation": "Chiếc áo này đắt quá!", "tags": ["Bài 10", "Tính từ"]},
      {"id": "hsk1-l10-w4", "hanzi": "件", "pinyin": "jiàn", "hanViet": "kiện", "vietnamese": "chiếc, cái, vụ (lượng từ cho quần áo, sự việc)", "hskLevel": 1, "radical": "亻", "strokeCount": 6, "example": "这件衣服真漂亮！", "exampleTranslation": "Chiếc áo này thật đẹp!", "tags": ["Bài 10", "Lượng từ"]},
      {"id": "hsk1-l10-w5", "hanzi": "斤", "pinyin": "jīn", "hanViet": "cân", "vietnamese": "cân (đơn vị đo Trung Quốc = 500g)", "hskLevel": 1, "radical": "斤", "strokeCount": 4, "example": "苹果三块钱一斤。", "exampleTranslation": "Táo 3 tệ một cân (500g).", "tags": ["Bài 10", "Lượng từ"]},
      {"id": "hsk1-l10-w6", "hanzi": "块", "pinyin": "kuài", "hanViet": "khối", "vietnamese": "đồng, tệ (đơn vị tiền tệ khẩu ngữ); miếng", "hskLevel": 1, "radical": "土", "strokeCount": 7, "example": "这个面包五块钱。", "exampleTranslation": "Cái bánh mì này 5 tệ.", "tags": ["Bài 10", "Lượng từ"]},
      {"id": "hsk1-l10-w7", "hanzi": "那儿", "pinyin": "nàr", "hanViet": "na nhi", "vietnamese": "ở đó, chỗ đó", "hskLevel": 1, "radical": "阝", "strokeCount": 8, "example": "我的书在那儿。", "exampleTranslation": "Sách của tôi ở đằng đó.", "tags": ["Bài 10", "Đại từ"]},
      {"id": "hsk1-l10-w8", "hanzi": "那些", "pinyin": "nàxiē", "hanViet": "na tỉ", "vietnamese": "những cái kia, những thứ ấy", "hskLevel": 1, "radical": "阝", "strokeCount": 17, "example": "那些衣服真好看！", "exampleTranslation": "Những bộ quần áo đó thật đẹp!", "tags": ["Bài 10", "Đại từ"]},
      {"id": "hsk1-l10-w9", "hanzi": "男", "pinyin": "nán", "hanViet": "nam", "vietnamese": "nam, đàn ông, con trai", "hskLevel": 1, "radical": "田", "strokeCount": 7, "example": "他是我们班的男同学。", "exampleTranslation": "Cậu ấy là bạn nam lớp chúng tôi.", "tags": ["Bài 10", "Danh từ / Tính từ"]},
      {"id": "hsk1-l10-w10", "hanzi": "女", "pinyin": "nǚ", "hanViet": "nữ", "vietnamese": "nữ, phụ nữ, con gái", "hskLevel": 1, "radical": "女", "strokeCount": 3, "example": "她是一位女医生。", "exampleTranslation": "Cô ấy là một nữ bác sĩ.", "tags": ["Bài 10", "Danh từ / Tính từ"]},
      {"id": "hsk1-l10-w11", "hanzi": "便宜", "pinyin": "piányi", "hanViet": "tiện nghi", "vietnamese": "rẻ, giá rẻ", "hskLevel": 1, "radical": "亻", "strokeCount": 17, "example": "这儿的苹果真便宜！", "exampleTranslation": "Táo ở đây rẻ thật đấy!", "tags": ["Bài 10", "Tính từ"]},
      {"id": "hsk1-l10-w12", "hanzi": "苹果", "pinyin": "píngguǒ", "hanViet": "bình quả", "vietnamese": "quả táo", "hskLevel": 1, "radical": "艹", "strokeCount": 16, "example": "我想买两斤苹果。", "exampleTranslation": "Cho tôi mua hai cân táo nhé bác.", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w13", "hanzi": "钱", "pinyin": "qián", "hanViet": "tiền", "vietnamese": "tiền bạc, tiền", "hskLevel": 1, "radical": "钅", "strokeCount": 10, "example": "请问，这个多少钱？", "exampleTranslation": "Xin hỏi, cái này bao nhiêu tiền?", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w14", "hanzi": "商店", "pinyin": "shāngdiàn", "hanViet": "thương điếm", "vietnamese": "cửa hàng, tiệm buôn", "hskLevel": 1, "radical": "口", "strokeCount": 19, "example": "这家商店有很多好看的衣服。", "exampleTranslation": "Cửa hàng này có rất nhiều quần áo đẹp.", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w15", "hanzi": "少", "pinyin": "shǎo", "hanViet": "thiểu", "vietnamese": "ít, thiếu", "hskLevel": 1, "radical": "小", "strokeCount": 4, "example": "这里的苹果不少。", "exampleTranslation": "Táo ở đây không hề ít.", "tags": ["Bài 10", "Tính từ"]},
      {"id": "hsk1-l10-w16", "hanzi": "售货员", "pinyin": "shòuhuòyuán", "hanViet": "thọ hóa viên", "vietnamese": "nhân viên bán hàng", "hskLevel": 1, "radical": "口", "strokeCount": 26, "example": "售货员很有礼貌。", "exampleTranslation": "Nhân viên bán hàng rất lịch sự.", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w17", "hanzi": "水果", "pinyin": "shuǐguǒ", "hanViet": "thủy quả", "vietnamese": "trái cây, hoa quả", "hskLevel": 1, "radical": "水", "strokeCount": 12, "example": "你想吃什么水果？", "exampleTranslation": "Bạn muốn ăn hoa quả gì?", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w18", "hanzi": "衣服", "pinyin": "yīfu", "hanViet": "y phục", "vietnamese": "quần áo, y phục", "hskLevel": 1, "radical": "衤", "strokeCount": 14, "example": "这件衣服真漂亮！", "exampleTranslation": "Chiếc áo này thật đẹp!", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w19", "hanzi": "元", "pinyin": "yuán", "hanViet": "nguyên", "vietnamese": "đồng, tệ (đơn vị tiền tệ văn viết)", "hskLevel": 1, "radical": "二", "strokeCount": 4, "example": "这本书二十元。", "exampleTranslation": "Cuốn sách này 20 tệ.", "tags": ["Bài 10", "Lượng từ"]},
      {"id": "hsk1-l10-w20", "hanzi": "怎么样", "pinyin": "zěnmeyàng", "hanViet": "chẩm ma dạng", "vietnamese": "như thế nào, thấy sao", "hskLevel": 1, "radical": "心", "strokeCount": 21, "example": "这件衣服怎么样？", "exampleTranslation": "Chiếc áo này thấy thế nào?", "tags": ["Bài 10", "Đại từ"]},
      {"id": "hsk1-l10-w21", "hanzi": "这边", "pinyin": "zhèbiān", "hanViet": "giá biên", "vietnamese": "phía bên này, đằng này", "hskLevel": 1, "radical": "辶", "strokeCount": 12, "example": "请这边走。", "exampleTranslation": "Xin mời đi lối bên này.", "tags": ["Bài 10", "Danh từ"]},
      {"id": "hsk1-l10-w22", "hanzi": "这儿", "pinyin": "zhèr", "hanViet": "giá nhi", "vietnamese": "ở đây, chỗ này", "hskLevel": 1, "radical": "辶", "strokeCount": 9, "example": "这儿的苹果真便宜！", "exampleTranslation": "Táo ở đây thật rẻ!", "tags": ["Bài 10", "Đại từ"]},
      {"id": "hsk1-l10-w23", "hanzi": "这些", "pinyin": "zhèxiē", "hanViet": "giá tỉ", "vietnamese": "những cái này, các thứ này", "hskLevel": 1, "radical": "辶", "strokeCount": 15, "example": "这些书都是我的。", "exampleTranslation": "Những cuốn sách này đều là của tôi.", "tags": ["Bài 10", "Đại từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l10-ex1",
        type: "multiple_choice",
        question: "Hỏi giá của một cân táo, câu nào chuẩn nhất?",
        options: ["A. 苹果几钱？", "B. 苹果怎么钱？", "C. 苹果多少钱一斤？", "D. 苹果什么钱？"],
        correctAnswer: "C. 苹果多少钱一斤？",
        explanation: "Hỏi giá tiền trong tiếng Trung dùng '多少钱' (duōshao qián)."
      },
      {
        id: "hsk1-l10-ex2",
        type: "fill_blank",
        question: "Chọn phó từ cảm thán: 这儿的水果___便宜！(Hoa quả ở đây thật là rẻ!)",
        options: ["A. 是", "B. 真", "C. 个", "D. 吗"],
        correctAnswer: "B. 真",
        explanation: "'真' (zhēn) đứng trước tính từ biểu thị cảm thán: 真便宜 (thật là rẻ)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 11: 我读大学呢 (Tôi đang học đại học đấy)
  // ==========================================================================
  {
    lessonNumber: 11,
    titleHanzi: "我读大学呢",
    titlePinyin: "Wǒ dú dàxué ne",
    titleVietnamese: "Tôi đang học đại học đấy",
    pageStart: 78,
    objectives: [
      "能听懂并使用三种结构表达正在做的事情 (Nghe hiểu và dùng 3 cấu trúc biểu đạt hành động đang tiếp diễn).",
      "能听懂并使用正反问格式进行提问 (Nghe hiểu và đặt câu hỏi theo thể chính phản).",
      "掌握能愿动词“要”表达想做、打算做的用法 (Nắm vững cách dùng động từ năng nguyện “要” biểu thị ý muốn, dự định).",
    ],
    texts: [
      {
        id: "hsk1-l11-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在路上，李文正在找饭店，王一飞给他打电话。(Trên đường, Lý Văn đang tìm nhà hàng, Vương Nhất Phi gọi điện cho anh.)",
        speakerAnchors: { "王一飞": 25, "李文": 75 },
        lines: [
          { speaker: "王一飞", hanzi: "喂，李文，你什么时候能到饭店？", pinyin: "Wèi, Lǐ Wén, nǐ shénme shíhou néng dào fàndiàn?", vietnamese: "A lô Lý Văn à, khoảng mấy giờ em mới đến được nhà hàng thế?" },
          { speaker: "李文", hanzi: "还不知道，正在找呢。它是不是在超市后边？", pinyin: "Hái bù zhīdào, zhèngzài zhǎo ne. Tā shì bu shì zài chāoshì hòubian?", vietnamese: "Dạ em cũng chưa rõ nữa, em đang tìm đường đây ạ. Có phải nhà hàng nằm ở ngay phía sau siêu thị không cô?" },
          { speaker: "王一飞", hanzi: "是的。你开车没开车？", pinyin: "Shì de. Nǐ kāichē méi kāichē?", vietnamese: "Đúng rồi em. Em có tự lái xe đi không đấy?" },
          { speaker: "李文", hanzi: "我没开车，坐车呢。", pinyin: "Wǒ méi kāichē, zuò chē ne.", vietnamese: "Dạ em không lái xe, em đang đi xe buýt ạ." }
        ]
      },
      {
        id: "hsk1-l11-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在饭店里，王一飞和李文见面后聊天儿。(Ở nhà hàng, Vương Nhất Phi và Lý Văn gặp nhau và trò chuyện.)",
        speakerAnchors: { "王一飞": 33, "李文": 73 },
        lines: [
          { speaker: "王一飞", hanzi: "你还在上大学吗？", pinyin: "Nǐ hái zài shàng dàxué ma?", vietnamese: "Hiện giờ em vẫn đang học đại học đúng không?" },
          { speaker: "李文", hanzi: "对，我上大学呢，还是大学生。", pinyin: "Duì, wǒ shàng dàxué ne, hái shì dàxuéshēng.", vietnamese: "Dạ vâng thưa cô, em đang học đại học, vẫn là cậu sinh viên thôi ạ." },
          { speaker: "王一飞", hanzi: "你们学习忙不忙？", pinyin: "Nǐmen xuéxí máng bu máng?", vietnamese: "Chương trình học của các em có bận rộn lắm không?" },
          { speaker: "李文", hanzi: "非常忙，我学语言，我们的课很多。", pinyin: "Fēicháng máng, wǒ xué yǔyán, wǒmen de kè hěn duō.", vietnamese: "Dạ bận lắm cô ạ, em học chuyên ngành ngôn ngữ nên số tiết học nhiều vô kể." }
        ]
      }
    ,
      {
        id: "hsk1-l11-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "星期六早上，刘明要去医院加班，出门前和女儿聊天儿。(Sáng thứ Bảy, Lưu Minh sắp đi làm thêm giờ ở bệnh viện, trước khi ra ngoài trò chuyện với con gái.)",
        speakerAnchors: { "刘明": 37, "刘小雪": 75 },
        lines: [
          { speaker: "刘明", hanzi: "弟弟起床没起床呢？", pinyin: "Dìdi qǐchuáng méi qǐchuáng ne?", vietnamese: "Em trai con đã chịu thức dậy chưa đấy?" },
          { speaker: "刘小雪", hanzi: "没起床呢，还在睡觉。", pinyin: "Méi qǐchuáng ne, hái zài shuìjiào.", vietnamese: "Dạ nó chưa dậy đâu bố ơi, vẫn đang cuộn tròn ngủ say sưa kìa." },
          { speaker: "刘明", hanzi: "还睡呢？他今天去不去哪里？", pinyin: "Hái shuì ne? Tā jīntiān qù bu qù nǎlǐ?", vietnamese: "Vẫn còn ngủ cơ à? Hôm nay nó có kế hoạch đi đâu không con?" },
          { speaker: "刘小雪", hanzi: "去哪里？", pinyin: "Qù nǎlǐ?", vietnamese: "Đi đâu hả bố?" },
          { speaker: "刘明", hanzi: "去超市。", pinyin: "Qù chāoshì.", vietnamese: "Đi siêu thị mua đồ với bố." },
          { speaker: "刘小雪", hanzi: "我昨天晚问他，他对我说，他不去，他今天要和小朋友玩。", pinyin: "Wǒ zuótiān wǎn wèn tā, tā duì wǒ shuō, tā bú qù, tā jīntiān yào hé xiǎopéngyou wán.", vietnamese: "Tối qua con có hỏi nó rồi, nó bảo với con là nó không đi đâu, hôm nay nó hẹn đi chơi với các bạn cùng xóm rồi ạ." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l11-g1",
        title: "1. 正反问 (Câu hỏi chính phản)",
        explanation: "Câu hỏi chính phản kết hợp dạng khẳng định và phủ định của động từ hoặc tính từ: 'V + 不 + V?' hoặc 'A + 不 + A?'. Với '有' ta dùng '有没有?'. Khi dùng câu hỏi chính phản thì KHÔNG dùng '吗' ở cuối câu nữa.",
        examples: [
          {
            hanzi: "你去不去学校？",
            pinyin: "Nǐ qù bu qù xuéxiào?",
            vietnamese: "Bạn có đi trường không?"
          },
          {
            hanzi: "你想不想吃中国菜？",
            pinyin: "Nǐ xiǎng bu xiǎng chī Zhōngguó cài?",
            vietnamese: "Bạn có muốn ăn món Trung Quốc không?"
          },
          {
            hanzi: "你有没有手机？",
            pinyin: "Nǐ yǒu méiyǒu shǒujī?",
            vietnamese: "Bạn có điện thoại di động không?"
          },
        ]
      },
      {
        id: "hsk1-l11-g2",
        title: "2. 时间副词“在/正在”与“呢” (Biểu đạt hành động đang tiếp diễn)",
        explanation: "Có 3 cấu trúc biểu thị hành động đang diễn ra tại một thời điểm: (1) 在 + V; (2) 正在 + V; (3) [在/正在] + V + 呢. Thể phủ định dùng '没在 + V'.",
        examples: [
          {
            hanzi: "我正在开车呢。",
            pinyin: "Wǒ zhèngzài kāichē ne.",
            vietnamese: "Tôi đang lái xe đây này."
          },
          {
            hanzi: "他在睡觉。",
            pinyin: "Tā zài shuìjiào.",
            vietnamese: "Anh ấy đang ngủ."
          },
          {
            hanzi: "我读大学呢。",
            pinyin: "Wǒ dú dàxué ne.",
            vietnamese: "Tôi đang học đại học đấy."
          },
        ]
      },
      {
        id: "hsk1-l11-g3",
        title: "3. 能愿动词“要” (Động từ năng nguyện “要”)",
        explanation: "'要' (yào) đứng trước động từ biểu thị ý muốn, quyết tâm hoặc dự định cần làm điều gì đó (muốn / cần / sắp).",
        examples: [
          {
            hanzi: "我要去饭店。",
            pinyin: "Wǒ yào qù fàndiàn.",
            vietnamese: "Tôi muốn / cần đi đến nhà hàng."
          },
          {
            hanzi: "你要喝水吗？",
            pinyin: "Nǐ yào hē shuǐ ma?",
            vietnamese: "Bạn có muốn uống nước không?"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l11-w1", "hanzi": "车", "pinyin": "chē", "hanViet": "xa", "vietnamese": "xe cộ, ô tô, xe", "hskLevel": 1, "radical": "车", "strokeCount": 4, "example": "路上有很多车。", "exampleTranslation": "Trên đường có rất nhiều xe cộ.", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w2", "hanzi": "大学", "pinyin": "dàxué", "hanViet": "đại học", "vietnamese": "đại học, trường đại học", "hskLevel": 1, "radical": "大", "strokeCount": 11, "example": "我读大学呢。", "exampleTranslation": "Tôi đang học đại học đấy.", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w3", "hanzi": "大学生", "pinyin": "dàxuéshēng", "hanViet": "đại học sinh", "vietnamese": "sinh viên đại học", "hskLevel": 1, "radical": "大", "strokeCount": 16, "example": "我们都是大学生。", "exampleTranslation": "Tất cả chúng tôi đều là sinh viên đại học.", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w4", "hanzi": "弟弟", "pinyin": "dìdi", "hanViet": "đệ đệ", "vietnamese": "em trai", "hskLevel": 1, "radical": "弓", "strokeCount": 7, "example": "我弟弟今年十岁。", "exampleTranslation": "Em trai tôi năm nay 10 tuổi.", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w5", "hanzi": "读", "pinyin": "dú", "hanViet": "độc", "vietnamese": "đọc, học (đại học)", "hskLevel": 1, "radical": "讠", "strokeCount": 10, "example": "我读大学呢。", "exampleTranslation": "Tôi đang học đại học đấy.", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w6", "hanzi": "对", "pinyin": "duì", "hanViet": "đối", "vietnamese": "đúng, chính xác", "hskLevel": 1, "radical": "寸", "strokeCount": 5, "example": "对，我是中国人。", "exampleTranslation": "Đúng vậy, tôi là người Trung Quốc.", "tags": ["Bài 11", "Tính từ"]},
      {"id": "hsk1-l11-w7", "hanzi": "饭店", "pinyin": "fàndiàn", "hanViet": "phạn điếm", "vietnamese": "nhà hàng, quán ăn, khách sạn", "hskLevel": 1, "radical": "饣", "strokeCount": 15, "example": "怎么去西安饭店？", "exampleTranslation": "Đi đến khách sạn Tây An như thế nào?", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w8", "hanzi": "开车", "pinyin": "kāichē", "hanViet": "khai xa", "vietnamese": "lái xe ô tô", "hskLevel": 1, "radical": "廾", "strokeCount": 8, "example": "我正在开车呢。", "exampleTranslation": "Tôi đang lái xe đây.", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w9", "hanzi": "哪里", "pinyin": "nǎlǐ", "hanViet": "nả lý", "vietnamese": "ở đâu, chỗ nào (đồng nghĩa 哪儿)", "hskLevel": 1, "radical": "口", "strokeCount": 16, "example": "你在哪里工作？", "exampleTranslation": "Bạn làm việc ở đâu?", "tags": ["Bài 11", "Đại từ"]},
      {"id": "hsk1-l11-w10", "hanzi": "那里", "pinyin": "nàlǐ", "hanViet": "na lý", "vietnamese": "chỗ kia, nơi đó", "hskLevel": 1, "radical": "阝", "strokeCount": 13, "example": "那里是电影院。", "exampleTranslation": "Nơi đó là rạp chiếu phim.", "tags": ["Bài 11", "Đại từ"]},
      {"id": "hsk1-l11-w11", "hanzi": "起床", "pinyin": "qǐchuáng", "hanViet": "khởi sàng", "vietnamese": "thức dậy, ngủ dậy", "hskLevel": 1, "radical": "走", "strokeCount": 14, "example": "你早上几点起床？", "exampleTranslation": "Buổi sáng bạn dậy lúc mấy giờ?", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w12", "hanzi": "时候", "pinyin": "shíhou", "hanViet": "thời hậu", "vietnamese": "lúc, khi (thời điểm)", "hskLevel": 1, "radical": "日", "strokeCount": 20, "example": "你什么时候能到饭店？", "exampleTranslation": "Khi nào bạn có thể tới nhà hàng?", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w13", "hanzi": "睡", "pinyin": "shuì", "hanViet": "thụy", "vietnamese": "ngủ", "hskLevel": 1, "radical": "目", "strokeCount": 13, "example": "他睡了八个小时。", "exampleTranslation": "Cậu ấy đã ngủ 8 tiếng.", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w14", "hanzi": "睡觉", "pinyin": "shuìjiào", "hanViet": "thụy giác", "vietnamese": "đi ngủ, ngủ", "hskLevel": 1, "radical": "目", "strokeCount": 22, "example": "他正在睡觉呢。", "exampleTranslation": "Anh ấy đang ngủ đấy.", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w15", "hanzi": "说", "pinyin": "shuō", "hanViet": "thuyết", "vietnamese": "nói, bảo", "hskLevel": 1, "radical": "讠", "strokeCount": 9, "example": "他会说汉语。", "exampleTranslation": "Anh ấy biết nói tiếng Trung.", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w16", "hanzi": "问", "pinyin": "wèn", "hanViet": "vấn", "vietnamese": "hỏi", "hskLevel": 1, "radical": "门", "strokeCount": 6, "example": "我可以问您一个问题吗？", "exampleTranslation": "Em có thể hỏi cô một câu hỏi được không ạ?", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w17", "hanzi": "小朋友", "pinyin": "xiǎopéngyou", "hanViet": "tiểu bằng hữu", "vietnamese": "em nhỏ, bé con, trẻ em", "hskLevel": 1, "radical": "小", "strokeCount": 15, "example": "小朋友真可爱！", "exampleTranslation": "Em bé thật đáng yêu!", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w18", "hanzi": "学", "pinyin": "xué", "hanViet": "học", "vietnamese": "học tập, học hỏi", "hskLevel": 1, "radical": "子", "strokeCount": 8, "example": "他在学汉语呢。", "exampleTranslation": "Anh ấy đang học tiếng Trung đấy.", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w19", "hanzi": "要", "pinyin": "yào", "hanViet": "yếu", "vietnamese": "muốn, cần, phải, sắp", "hskLevel": 1, "radical": "覀", "strokeCount": 9, "example": "我要买两斤苹果。", "exampleTranslation": "Cho tôi mua hai cân táo nhé bác.", "tags": ["Bài 11", "Động từ / Động từ năng nguyện"]},
      {"id": "hsk1-l11-w20", "hanzi": "医", "pinyin": "yī", "hanViet": "y", "vietnamese": "y học, chữa bệnh", "hskLevel": 1, "radical": "匚", "strokeCount": 7, "example": "他在学医。", "exampleTranslation": "Anh ấy đang học ngành y.", "tags": ["Bài 11", "Danh từ"]},
      {"id": "hsk1-l11-w21", "hanzi": "在", "pinyin": "zài", "hanViet": "tại", "vietnamese": "ở, tại, đang (giới từ / phó từ)", "hskLevel": 1, "radical": "土", "strokeCount": 6, "example": "我明天上午在学校学习。", "exampleTranslation": "Sáng mai tôi học ở trường.", "tags": ["Bài 11", "Giới từ / Phó từ"]},
      {"id": "hsk1-l11-w22", "hanzi": "找", "pinyin": "zhǎo", "hanViet": "trảo", "vietnamese": "tìm kiếm; trả lại tiền thừa", "hskLevel": 1, "radical": "扌", "strokeCount": 7, "example": "找你五块钱。", "exampleTranslation": "Trả lại bạn 5 tệ tiền thừa.", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w23", "hanzi": "正在", "pinyin": "zhèngzài", "hanViet": "chính tại", "vietnamese": "đang, đang trong lúc", "hskLevel": 1, "radical": "止", "strokeCount": 11, "example": "我正在开车呢。", "exampleTranslation": "Tôi đang lái xe đây.", "tags": ["Bài 11", "Phó từ"]},
      {"id": "hsk1-l11-w24", "hanzi": "知道", "pinyin": "zhīdào", "hanViet": "tri đạo", "vietnamese": "biết, hiểu rõ", "hskLevel": 1, "radical": "矢", "strokeCount": 20, "example": "你知道李文的手机号吗？", "exampleTranslation": "Bạn có biết số điện thoại của Lý Văn không?", "tags": ["Bài 11", "Động từ"]},
      {"id": "hsk1-l11-w25", "hanzi": "昨天", "pinyin": "zuótiān", "hanViet": "tạc thiên", "vietnamese": "hôm qua", "hskLevel": 1, "radical": "日", "strokeCount": 13, "example": "昨天下雪了。", "exampleTranslation": "Hôm qua tuyết rơi rồi.", "tags": ["Bài 11", "Danh từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l11-ex1",
        type: "multiple_choice",
        question: "Câu nào sau đây là câu hỏi chính phản đúng ngữ pháp?",
        options: ["A. 你去不去学校吗？", "B. 你去不去学校？", "C. 你去学校不？", "D. 你去吗不？"],
        correctAnswer: "B. 你去不去学校？",
        explanation: "Câu hỏi chính phản (去不去) không được dùng thêm trợ từ '吗' ở cuối câu."
      },
      {
        id: "hsk1-l11-ex2",
        type: "fill_blank",
        question: "Điền từ thích hợp để biểu thị hành động đang tiếp diễn: 他___在睡觉呢。",
        options: ["A. 正", "B. 了", "C. 过", "D. 都"],
        correctAnswer: "A. 正",
        explanation: "Cụm '正在...呢' biểu thị hành động đang diễn ra."
      },
    ],
  },
  // ==========================================================================
  // LESSON 12: 昨天下雪了 (Hôm qua tuyết rơi rồi)
  // ==========================================================================
  {
    lessonNumber: 12,
    titleHanzi: "昨天下雪了",
    titlePinyin: "Zuótiān xiàxuě le",
    titleVietnamese: "Hôm qua tuyết rơi rồi",
    pageStart: 86,
    objectives: [
      "能听懂并描述天气情况 (Nghe hiểu và miêu tả tình hình thời tiết).",
      "能听懂并简单描述病情 (Nghe hiểu và miêu tả đơn giản tình trạng bệnh tật, ốm đau).",
      "掌握语气助词“了（1）”的用法 (Nắm vững cách dùng trợ từ ngữ khí “了” (1) ở cuối câu).",
      "掌握“太……了”格式的用法 (Nắm vững cách dùng cấu trúc cảm thán “太……了”).",
      "了解生病时中国人建议“喝些热水”的好处 (Tìm hiểu thói quen và lời khuyên uống nước ấm của người Trung Quốc khi bị ốm).",
    ],
    texts: [
      {
        id: "hsk1-l12-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "王一雪给王一飞打电话，问那边的情况。(Vương Nhất Tuyết gọi điện cho Vương Nhất Phi, hỏi về tình hình bên đó.)",
        speakerAnchors: { "王一雪": 28, "王一飞": 73 },
        lines: [
          { speaker: "王一雪", hanzi: "今天天气怎么样？", pinyin: "Jīntiān tiānqì zěnmeyàng?", vietnamese: "Thời tiết chỗ em hôm nay thế nào rồi Nhất Phi?" },
          { speaker: "王一飞", hanzi: "这里的天不太好，下雨了。", pinyin: "Zhèlǐ de tiān bú tài hǎo, xià yǔ le.", vietnamese: "Chỗ em trời xấu lắm chị ơi, đang mưa tầm tã rồi ạ." },
          { speaker: "王一雪", hanzi: "雨大吗？", pinyin: "Yǔ dà ma?", vietnamese: "Mưa có to lắm không em?" },
          { speaker: "王一飞", hanzi: "有点儿大，我觉得很冷。", pinyin: "Yǒudiǎnr dà, wǒ juéde hěn lěng.", vietnamese: "Mưa khá to chị ạ, gió lùa buốt giá cả người." }
        ]
      },
      {
        id: "hsk1-l12-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在公司电梯里，王一雪和杨同乐在聊天儿。(Trong thang máy công ty, Vương Nhất Tuyết và Dương Đồng Nhạc đang trò chuyện.)",
        speakerAnchors: { "王一雪": 31, "杨同乐": 71 },
        lines: [
          { speaker: "王一雪", hanzi: "昨天下雪了。", pinyin: "Zuótiān xià xuě le.", vietnamese: "Hôm qua tuyết rơi dày quá em nhỉ." },
          { speaker: "杨同乐", hanzi: "是的，太冷了。", pinyin: "Shì de, tài lěng le.", vietnamese: "Dạ vâng chị, trời rét buốt cả người." },
          { speaker: "王一雪", hanzi: "你昨天没来公司，生病了？", pinyin: "Nǐ zuótiān méi lái gōngsī, shēngbìng le?", vietnamese: "Hôm qua chị không thấy em đến công ty, bị ốm hả em?" },
          { speaker: "杨同乐", hanzi: "对，我昨天去医院看病了。", pinyin: "Duì, wǒ zuótiān qù yīyuàn kànbìng le.", vietnamese: "Dạ vâng, hôm qua người em mệt lả nên phải vào viện khám chị ạ." }
        ]
      }
    ,
      {
        id: "hsk1-l12-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "昨天在医院里，医生给杨同乐看病。(Hôm qua ở bệnh viện, bác sĩ khám bệnh cho Dương Đồng Nhạc.)",
        speakerAnchors: { "杨同乐": 30, "医生": 74 },
        lines: [
          { speaker: "杨同乐", hanzi: "医生，我病了。", pinyin: "Yīshēng, wǒ bìng le.", vietnamese: "Bác sĩ ơi, cháu thấy trong người mệt và khó chịu quá." },
          { speaker: "医生", hanzi: "我看看。你觉得怎么样？", pinyin: "Wǒ kànkan. Nǐ juéde zěnmeyàng?", vietnamese: "Để bác khám xem nào. Cháu cảm thấy cơ thể thế nào?" },
          { speaker: "杨同乐", hanzi: "我很冷。", pinyin: "Wǒ hěn lěng.", vietnamese: "Dạ người cháu gai lạnh và run rẩy." },
          { speaker: "医生", hanzi: "好的，吃一点儿药，今天休息半天吧。", pinyin: "Hǎo de, chī yīdiǎnr yào, jīntiān xiūxi bàn tiān ba.", vietnamese: "Được rồi, cháu uống chút thuốc này vào nhé, hôm nay xin nghỉ nửa ngày để tĩnh dưỡng." },
          { speaker: "杨同乐", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Ok, mình lưu lại rồi nhé." },
          { speaker: "医生", hanzi: "回家后再喝些热水。", pinyin: "Huí jiā hòu zài hē xiē rè shuǐ.", vietnamese: "Về đến nhà nhớ uống thật nhiều nước ấm vào nhé." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l12-g1",
        title: "1. 非主谓句 (Câu không chủ vị miêu tả hiện tượng tự nhiên)",
        explanation: "Câu không chủ vị là câu do một cụm từ biểu thị mà không cần chủ ngữ, thường dùng khi nói về thời tiết, tự nhiên hoặc lời gọi, cảm thán.",
        examples: [
          {
            hanzi: "下雨了。",
            pinyin: "Xiàyǔ le.",
            vietnamese: "Mưa rồi."
          },
          {
            hanzi: "昨天下雪了。",
            pinyin: "Zuótiān xiàxuě le.",
            vietnamese: "Hôm qua tuyết rơi rồi."
          },
        ]
      },
      {
        id: "hsk1-l12-g2",
        title: "2. 语气助词“了（1）” (Trợ từ ngữ khí “了” chỉ sự biến đổi trạng thái)",
        explanation: "Trợ từ '了' đặt ở cuối câu biểu thị một tình huống, trạng thái mới xuất hiện hoặc có sự thay đổi so với trước đó.",
        examples: [
          {
            hanzi: "天气冷了。",
            pinyin: "Tiānqì lěng le.",
            vietnamese: "Trời trở lạnh rồi (trước đây không lạnh)."
          },
          {
            hanzi: "我生病了。",
            pinyin: "Wǒ shēngbìng le.",
            vietnamese: "Tôi bị ốm rồi."
          },
        ]
      },
      {
        id: "hsk1-l12-g3",
        title: "3. “太……了”格式 (Cấu trúc cảm thán “太……了”)",
        explanation: "Cấu trúc '太 + Tính từ / Tâm lý + 了' biểu thị mức độ cực kỳ cao, thường dùng để khen ngợi, cảm thán hoặc phàn nàn.",
        examples: [
          {
            hanzi: "今天天气太好了！",
            pinyin: "Jīntiān tiānqì tài hǎo le!",
            vietnamese: "Hôm nay thời tiết đẹp quá!"
          },
          {
            hanzi: "外面太冷了！",
            pinyin: "Wàimiàn tài lěng le!",
            vietnamese: "Bên ngoài lạnh quá!"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l12-w1", "hanzi": "病", "pinyin": "bìng", "hanViet": "bệnh", "vietnamese": "bệnh, ốm, đau", "hskLevel": 1, "radical": "疒", "strokeCount": 10, "example": "他生病了，在看病。", "exampleTranslation": "Anh ấy bị bệnh rồi, đang khám bệnh.", "tags": ["Bài 12", "Danh từ / Động từ"]},
      {"id": "hsk1-l12-w2", "hanzi": "公司", "pinyin": "gōngsī", "hanViet": "công ty", "vietnamese": "công ty", "hskLevel": 1, "radical": "八", "strokeCount": 7, "example": "他在一家大公司工作。", "exampleTranslation": "Anh ấy làm việc ở một công ty lớn.", "tags": ["Bài 12", "Danh từ"]},
      {"id": "hsk1-l12-w3", "hanzi": "喝", "pinyin": "hē", "hanViet": "hát", "vietnamese": "uống", "hskLevel": 1, "radical": "口", "strokeCount": 12, "example": "医生让我多喝热水。", "exampleTranslation": "Bác sĩ dặn tôi uống nhiều nước ấm.", "tags": ["Bài 12", "Động từ"]},
      {"id": "hsk1-l12-w4", "hanzi": "回", "pinyin": "huí", "hanViet": "hồi", "vietnamese": "trở về, về lại", "hskLevel": 1, "radical": "囗", "strokeCount": 6, "example": "我要回家了。", "exampleTranslation": "Tôi phải về nhà rồi.", "tags": ["Bài 12", "Động từ"]},
      {"id": "hsk1-l12-w5", "hanzi": "觉得", "pinyin": "juéde", "hanViet": "giác đắc", "vietnamese": "cảm thấy, thấy rằng, nghĩ rằng", "hskLevel": 1, "radical": "见", "strokeCount": 18, "example": "我觉得今天有点儿冷。", "exampleTranslation": "Tôi cảm thấy hôm nay hơi lạnh.", "tags": ["Bài 12", "Động từ"]},
      {"id": "hsk1-l12-w6", "hanzi": "看病", "pinyin": "kànbìng", "hanViet": "khán bệnh", "vietnamese": "khám bệnh, đi khám bác sĩ", "hskLevel": 1, "radical": "目", "strokeCount": 19, "example": "他今天去医院看病了。", "exampleTranslation": "Hôm nay anh ấy đi bệnh viện khám bệnh rồi.", "tags": ["Bài 12", "Động từ"]},
      {"id": "hsk1-l12-w7", "hanzi": "来", "pinyin": "lái", "hanViet": "lai", "vietnamese": "đến, tới", "hskLevel": 1, "radical": "木", "strokeCount": 7, "example": "王老师来了。", "exampleTranslation": "Cô Vương đến rồi.", "tags": ["Bài 12", "Động từ"]},
      {"id": "hsk1-l12-w8", "hanzi": "了", "pinyin": "le", "hanViet": "liễu", "vietnamese": "rồi (trợ từ ngữ khí cuối câu / trợ từ động thái sau động từ)", "hskLevel": 1, "radical": "乙", "strokeCount": 2, "example": "昨天下雪了。", "exampleTranslation": "Hôm qua tuyết rơi rồi.", "tags": ["Bài 12", "Trợ từ"]},
      {"id": "hsk1-l12-w9", "hanzi": "冷", "pinyin": "lěng", "hanViet": "lãnh", "vietnamese": "lạnh, rét", "hskLevel": 1, "radical": "冫", "strokeCount": 7, "example": "今天天气太冷了！", "exampleTranslation": "Thời tiết hôm nay lạnh quá!", "tags": ["Bài 12", "Tính từ"]},
      {"id": "hsk1-l12-w10", "hanzi": "热", "pinyin": "rè", "hanViet": "nhiệt", "vietnamese": "nóng, ấm nóng", "hskLevel": 1, "radical": "灬", "strokeCount": 10, "example": "今天天气很热。", "exampleTranslation": "Hôm nay trời rất nóng.", "tags": ["Bài 12", "Tính từ"]},
      {"id": "hsk1-l12-w11", "hanzi": "生病", "pinyin": "shēngbìng", "hanViet": "sinh bệnh", "vietnamese": "bị ốm, bị bệnh", "hskLevel": 1, "radical": "生", "strokeCount": 15, "example": "他生病了，在家休息。", "exampleTranslation": "Anh ấy bị ốm rồi, đang nghỉ ngơi ở nhà.", "tags": ["Bài 12", "Động từ"]},
      {"id": "hsk1-l12-w12", "hanzi": "水", "pinyin": "shuǐ", "hanViet": "thủy", "vietnamese": "nước, nước lọc", "hskLevel": 1, "radical": "水", "strokeCount": 4, "example": "请喝水。", "exampleTranslation": "Mời uống nước.", "tags": ["Bài 12", "Danh từ"]},
      {"id": "hsk1-l12-w13", "hanzi": "天", "pinyin": "tiān", "hanViet": "thiên", "vietnamese": "ngày, trời", "hskLevel": 1, "radical": "一", "strokeCount": 4, "example": "今天星期日。", "exampleTranslation": "Hôm nay Chủ nhật.", "tags": ["Bài 12", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l12-w14", "hanzi": "天气", "pinyin": "tiānqì", "hanViet": "thiên khí", "vietnamese": "thời tiết", "hskLevel": 1, "radical": "一", "strokeCount": 8, "example": "今天天气怎么样？", "exampleTranslation": "Thời tiết chỗ em hôm nay thế nào rồi Nhất Phi?", "tags": ["Bài 12", "Danh từ"]},
      {"id": "hsk1-l12-w15", "hanzi": "下", "pinyin": "xià", "hanViet": "hạ", "vietnamese": "dưới, phía dưới; xuống, tan (ca, lớp); rơi (mưa, tuyết)", "hskLevel": 1, "radical": "一", "strokeCount": 3, "example": "下午我们去看电影吧。", "exampleTranslation": "Buổi chiều chúng mình đi xem phim đi.", "tags": ["Bài 12", "Động từ / Danh từ"]},
      {"id": "hsk1-l12-w16", "hanzi": "下雨", "pinyin": "xiàyǔ", "hanViet": "hạ vũ", "vietnamese": "trời mưa, mưa rơi", "hskLevel": 1, "radical": "一", "strokeCount": 11, "example": "今天下雨了，不能出去玩。", "exampleTranslation": "Hôm nay trời mưa rồi, không thể ra ngoài chơi.", "tags": ["Bài 12", "Động từ"]},
      {"id": "hsk1-l12-w17", "hanzi": "雪", "pinyin": "xuě", "hanViet": "tuyết", "vietnamese": "tuyết", "hskLevel": 1, "radical": "雨", "strokeCount": 11, "example": "昨天下雪了。", "exampleTranslation": "Hôm qua tuyết rơi rồi.", "tags": ["Bài 12", "Danh từ"]},
      {"id": "hsk1-l12-w18", "hanzi": "药", "pinyin": "yào", "hanViet": "dược", "vietnamese": "thuốc", "hskLevel": 1, "radical": "艹", "strokeCount": 9, "example": "医生，这个药怎么吃？", "exampleTranslation": "Thưa bác sĩ, thuốc này uống như thế nào?", "tags": ["Bài 12", "Danh từ"]},
      {"id": "hsk1-l12-w19", "hanzi": "一点儿", "pinyin": "yìdiǎnr", "hanViet": "nhất điểm nhi", "vietnamese": "một chút, một ít", "hskLevel": 1, "radical": "一", "strokeCount": 12, "example": "我会说一点儿汉语。", "exampleTranslation": "Tôi biết nói một chút tiếng Trung.", "tags": ["Bài 12", "Số từ"]},
      {"id": "hsk1-l12-w20", "hanzi": "有点儿", "pinyin": "yǒudiǎnr", "hanViet": "hữu điểm nhi", "vietnamese": "hơi, có chút (thường tiêu cực)", "hskLevel": 1, "radical": "月", "strokeCount": 17, "example": "今天有点儿冷。", "exampleTranslation": "Hôm nay trời hơi lạnh.", "tags": ["Bài 12", "Phó từ"]},
      {"id": "hsk1-l12-w21", "hanzi": "雨", "pinyin": "yǔ", "hanViet": "vũ", "vietnamese": "mưa, cơn mưa", "hskLevel": 1, "radical": "雨", "strokeCount": 8, "example": "外面下雨了。", "exampleTranslation": "Bên ngoài trời mưa rồi.", "tags": ["Bài 12", "Danh từ"]},
      {"id": "hsk1-l12-w22", "hanzi": "再", "pinyin": "zài", "hanViet": "tái", "vietnamese": "lại, nữa (hành động lặp lại trong tương lai)", "hskLevel": 1, "radical": "冂", "strokeCount": 6, "example": "明天再见！", "exampleTranslation": "Ngày mai gặp lại nhé!", "tags": ["Bài 12", "Phó từ"]},
      {"id": "hsk1-l12-w23", "hanzi": "这里", "pinyin": "zhèlǐ", "hanViet": "giá lý", "vietnamese": "ở đây, chỗ này (đồng nghĩa 这儿)", "hskLevel": 1, "radical": "辶", "strokeCount": 14, "example": "这里的天气真好。", "exampleTranslation": "Thời tiết ở đây thật đẹp.", "tags": ["Bài 12", "Đại từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l12-ex1",
        type: "multiple_choice",
        question: "Để cảm thán 'Trời lạnh quá!', câu nào chuẩn nhất?",
        options: ["A. 天气很大冷。", "B. 天气太冷了！", "C. 天气太冷吗？", "D. 天气了太冷。"],
        correctAnswer: "B. 天气太冷了！",
        explanation: "Cấu trúc cảm thán chuẩn: '太 + Tính từ + 了' (太冷了)."
      },
      {
        id: "hsk1-l12-ex2",
        type: "fill_blank",
        question: "Điền từ vào chỗ trống: 昨天___雪了。(Hôm qua có tuyết rơi rồi)",
        options: ["A. 上", "B. 下", "C. 出", "D. 来"],
        correctAnswer: "B. 下",
        explanation: "Rơi tuyết, rơi mưa trong tiếng Trung dùng động từ '下' (下雪, 下雨)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 13: 请给我一杯茶 (Xin cho tôi một tách trà)
  // ==========================================================================
  {
    lessonNumber: 13,
    titleHanzi: "请给我一杯茶",
    titlePinyin: "Qǐng gěi wǒ yì bēi chá",
    titleVietnamese: "Xin cho tôi một tách trà",
    pageStart: 95,
    objectives: [
      "能听懂并使用双宾语句（1）表示向别人提问或给予别人东西等 (Nghe hiểu và dùng câu hai tân ngữ để hỏi hoặc cho/đưa đồ).",
      "掌握能愿动词“可以”的用法 (Nắm vững cách dùng động từ năng nguyện “可以”).",
      "掌握“动词+一下”结构的用法 (Nắm vững cấu trúc “Động từ + 一下”).",
      "了解点餐常用语 (Hiểu và nắm được các mẫu câu gọi món ăn trong nhà hàng).",
    ],
    texts: [
      {
        id: "hsk1-l13-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在教室里，下课后，白家月向王老师问问题。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt hỏi cô giáo Vương một câu hỏi.)",
        speakerAnchors: { "白家月": 35, "王一飞": 74 },
        lines: [
          { speaker: "白家月", hanzi: "王老师，我可以再问您一个问题吗？", pinyin: "Wáng lǎoshī, wǒ kěyǐ zài wèn nín yí gè wèntí ma?", vietnamese: "Thưa cô Vương, em xin phép hỏi cô thêm một câu được không ạ?" },
          { speaker: "王一飞", hanzi: "可以。你有什么问题？", pinyin: "Kěyǐ. Nǐ yǒu shénme wèntí?", vietnamese: "Được chứ em. Em có thắc mắc gì nào?" },
          { speaker: "白家月", hanzi: "那个小店买不买手机？", pinyin: "Nàge xiǎo diàn mǎi bu mǎi shǒujī?", vietnamese: "Dạ cửa hàng nhỏ bên kia đường có bán điện thoại di động không cô nhỉ?" },
          { speaker: "王一飞", hanzi: "我不知道。你可以打电话问一下。", pinyin: "Wǒ bù zhīdào. Nǐ kěyǐ dǎ diànhuà wèn yīxià.", vietnamese: "Cái này cô cũng không rõ lắm. Em thử gọi điện thoại hỏi trực tiếp xem sao nhé." }
        ]
      }
    ,
      {
        id: "hsk1-l13-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在咖啡馆里，王一雪想吃早饭。(Ở quán cà phê, Vương Nhất Tuyết muốn ăn sáng.)",
        speakerAnchors: { "王一雪": 28, "服务员": 70 },
        lines: [
          { speaker: "服务员", hanzi: "女士，请坐！您喝什么？", pinyin: "Nǚshì, qǐng zuò! Nín hē shénme?", vietnamese: "Dạ em chào chị, mời chị ngồi ạ! Chị muốn dùng đồ uống gì ạ?" },
          { speaker: "王一雪", hanzi: "我看一下。请给我一杯牛奶。", pinyin: "Wǒ kàn yíxià. Qǐng gěi wǒ yì bēi niúnǎi.", vietnamese: "Để chị xem thực đơn nhé... Làm ơn cho chị một ly sữa tươi nóng." },
          { speaker: "服务员", hanzi: "好的。您还要什么？", pinyin: "Hǎo de. Nín hái yào shénme?", vietnamese: "Dạ vâng ạ. Chị có muốn dùng thêm món gì nữa không ạ?" },
          { speaker: "王一雪", hanzi: "我还没吃早饭，再要这个面包和鸡蛋吧。", pinyin: "Wǒ hái méi chī zǎofàn, zài yào zhège miànbāo hé jīdàn ba.", vietnamese: "Chị chưa kịp ăn sáng, cho chị thêm phần bánh mì kẹp trứng này nhé." }
        ]
      },
      {
        id: "hsk1-l13-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在餐厅里，刘明在点餐。(Ở nhà hàng, Lưu Minh đang gọi đồ ăn.)",
        speakerAnchors: { "刘明": 37, "服务员": 69 },
        lines: [
          { speaker: "服务员", hanzi: "先生，请坐！您要什么？", pinyin: "Xiānsheng, qǐng zuò! Nín yào shénme?", vietnamese: "Dạ chào anh, mời anh ngồi ạ! Anh muốn dùng món gì ạ?" },
          { speaker: "刘明", hanzi: "我要一斤饺子。", pinyin: "Wǒ yào yī jīn jiǎozi.", vietnamese: "Cho tôi một cân sủi cảo nhé." },
          { speaker: "服务员", hanzi: "好的。一斤饺子40个。", pinyin: "Hǎo de. Yī jīn jiǎozi sìshí gè.", vietnamese: "Dạ vâng. Một cân sủi cảo là 40 chiếc đấy ạ." },
          { speaker: "刘明", hanzi: "40个太多了，我要一半吧。", pinyin: "Sìshí gè tài duō le, wǒ yào yībàn ba.", vietnamese: "40 chiếc thì nhiều quá tôi ăn không hết, lấy cho tôi nửa cân thôi nhé." },
          { speaker: "服务员", hanzi: "半斤20个。您想喝什么？", pinyin: "Bàn jīn èrshí gè. Nín xiǎng hē shénme?", vietnamese: "Dạ nửa cân là 20 chiếc ạ. Anh có muốn dùng thêm đồ uống gì không ạ?" },
          { speaker: "刘明", hanzi: "请给我一杯茶吧。", pinyin: "Qǐng gěi wǒ yì bēi chá ba.", vietnamese: "Làm ơn cho tôi xin một chén trà ấm nhé." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l13-g1",
        title: "1. 能愿动词“可以” (Động từ năng nguyện “可以”)",
        explanation: "'可以' (kěyǐ) biểu thị sự cho phép, đồng ý hoặc khả năng được làm điều gì đó một cách lịch sự.",
        examples: [
          {
            hanzi: "我可以再问您一个问题吗？",
            pinyin: "Wǒ kěyǐ zài wèn nín yí gè wèntí ma?",
            vietnamese: "Em có thể hỏi cô thêm một câu hỏi nữa được không ạ?"
          },
          {
            hanzi: "你可以坐这儿。",
            pinyin: "Nǐ kěyǐ zuò zhèr.",
            vietnamese: "Bạn có thể ngồi ở đây."
          },
        ]
      },
      {
        id: "hsk1-l13-g2",
        title: "2. “动词+一下”结构 (Cấu trúc “Động từ + 一下”)",
        explanation: "Đặt '一下' (yíxià) ngay sau động từ để biểu thị hành động diễn ra trong thời gian ngắn hoặc làm thử, giúp ngữ khí câu trở nên nhẹ nhàng, lịch sự.",
        examples: [
          {
            hanzi: "请等一下。",
            pinyin: "Qǐng děng yíxià.",
            vietnamese: "Xin vui lòng chờ một lát."
          },
          {
            hanzi: "我想看一下。",
            pinyin: "Wǒ xiǎng kàn yíxià.",
            vietnamese: "Tôi muốn xem thử một chút."
          },
        ]
      },
      {
        id: "hsk1-l13-g3",
        title: "3. 双宾语句（1）(Câu mang hai tân ngữ)",
        explanation: "Một số động từ như '给' (cho), '问' (hỏi), '送' (tặng) có thể mang cùng lúc hai tân ngữ: Tân ngữ gián tiếp (Người) đứng trước, Tân ngữ trực tiếp (Vật) đứng sau: 'Chủ ngữ + V + Người + Vật'.",
        examples: [
          {
            hanzi: "请给我一杯茶。",
            pinyin: "Qǐng gěi wǒ yì bēi chá.",
            vietnamese: "Xin cho tôi một tách trà."
          },
          {
            hanzi: "王老师问我一个问题。",
            pinyin: "Wáng lǎoshī wèn wǒ yí gè wèntí.",
            vietnamese: "Cô Vương hỏi tôi một câu hỏi."
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l13-w1", "hanzi": "杯", "pinyin": "bēi", "hanViet": "bôi", "vietnamese": "ly, cốc, tách (lượng từ)", "hskLevel": 1, "radical": "木", "strokeCount": 8, "example": "请给我一杯茶。", "exampleTranslation": "Xin cho tôi một tách trà.", "tags": ["Bài 13", "Lượng từ"]},
      {"id": "hsk1-l13-w2", "hanzi": "茶", "pinyin": "chá", "hanViet": "trà", "vietnamese": "trà, chè", "hskLevel": 1, "radical": "艹", "strokeCount": 9, "example": "请喝茶。", "exampleTranslation": "Mời uống trà.", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w3", "hanzi": "打电话", "pinyin": "dǎ diànhuà", "hanViet": "đả điện thoại", "vietnamese": "gọi điện thoại", "hskLevel": 1, "radical": "扌", "strokeCount": 21, "example": "他在给妈妈打电话呢。", "exampleTranslation": "Anh ấy đang gọi điện thoại cho mẹ.", "tags": ["Bài 13", "Động từ"]},
      {"id": "hsk1-l13-w4", "hanzi": "服务员", "pinyin": "fúwùyuán", "hanViet": "phục vụ viên", "vietnamese": "nhân viên phục vụ, bồi bàn", "hskLevel": 1, "radical": "亻", "strokeCount": 21, "example": "服务员，请给我一杯水。", "exampleTranslation": "Phục vụ ơi, xin cho tôi một cốc nước.", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w5", "hanzi": "给", "pinyin": "gěi", "hanViet": "kỷ", "vietnamese": "cho, đưa cho", "hskLevel": 1, "radical": "纟", "strokeCount": 9, "example": "请给我一杯茶。", "exampleTranslation": "Xin cho tôi một tách trà.", "tags": ["Bài 13", "Động từ / Giới từ"]},
      {"id": "hsk1-l13-w6", "hanzi": "鸡蛋", "pinyin": "jīdàn", "hanViet": "kê đản", "vietnamese": "trứng gà", "hskLevel": 1, "radical": "鸟", "strokeCount": 18, "example": "我想买几个鸡蛋。", "exampleTranslation": "Tôi muốn mua mấy quả trứng gà.", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w7", "hanzi": "可以", "pinyin": "kěyǐ", "hanViet": "khả dĩ", "vietnamese": "có thể, được phép", "hskLevel": 1, "radical": "口", "strokeCount": 9, "example": "我可以坐这儿吗？", "exampleTranslation": "Tôi có thể ngồi ở đây không?", "tags": ["Bài 13", "Động từ năng nguyện"]},
      {"id": "hsk1-l13-w8", "hanzi": "卖", "pinyin": "mài", "hanViet": "mại", "vietnamese": "bán", "hskLevel": 1, "radical": "十", "strokeCount": 8, "example": "这里卖面包吗？", "exampleTranslation": "Ở đây có bán bánh mì không?", "tags": ["Bài 13", "Động từ"]},
      {"id": "hsk1-l13-w9", "hanzi": "面包", "pinyin": "miànbāo", "hanViet": "miến bao", "vietnamese": "bánh mì", "hskLevel": 1, "radical": "面", "strokeCount": 14, "example": "我想吃面包。", "exampleTranslation": "Tôi muốn ăn bánh mì.", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w10", "hanzi": "女士", "pinyin": "nǚshì", "hanViet": "nữ sĩ", "vietnamese": "bà, cô, quý bà, quý cô", "hskLevel": 1, "radical": "女", "strokeCount": 6, "example": "王女士，您好！", "exampleTranslation": "Chào bà Vương ạ!", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w11", "hanzi": "请", "pinyin": "qǐng", "hanViet": "thỉnh", "vietnamese": "xin, mời, làm ơn", "hskLevel": 1, "radical": "讠", "strokeCount": 10, "example": "请进，请坐，请喝茶。", "exampleTranslation": "Mời vào, mời ngồi, mời uống trà.", "tags": ["Bài 13", "Động từ"]},
      {"id": "hsk1-l13-w12", "hanzi": "问题", "pinyin": "wèntí", "hanViet": "vấn đề", "vietnamese": "câu hỏi, vấn đề", "hskLevel": 1, "radical": "门", "strokeCount": 17, "example": "老师，我有一个问题。", "exampleTranslation": "Thưa cô, em có một câu hỏi ạ.", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w13", "hanzi": "先生", "pinyin": "xiānsheng", "hanViet": "tiên sinh", "vietnamese": "ông, ngài, thầy, chồng", "hskLevel": 1, "radical": "儿", "strokeCount": 11, "example": "先生，您喝什么？", "exampleTranslation": "Thưa ông, ông muốn uống gì ạ?", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w14", "hanzi": "要", "pinyin": "yào", "hanViet": "yếu", "vietnamese": "muốn, cần, phải, sắp", "hskLevel": 1, "radical": "覀", "strokeCount": 9, "example": "我要买两斤苹果。", "exampleTranslation": "Cho tôi mua hai cân táo nhé bác.", "tags": ["Bài 13", "Động từ / Động từ năng nguyện"]},
      {"id": "hsk1-l13-w15", "hanzi": "一半", "pinyin": "yíbàn", "hanViet": "nhất bán", "vietnamese": "một nửa", "hskLevel": 1, "radical": "一", "strokeCount": 6, "example": "这个西瓜我吃了一半。", "exampleTranslation": "Quả dưa hấu này tôi ăn mất một nửa rồi.", "tags": ["Bài 13", "Số từ"]},
      {"id": "hsk1-l13-w16", "hanzi": "一下", "pinyin": "yíxià", "hanViet": "nhất hạ", "vietnamese": "một chút, một lát, một tí", "hskLevel": 1, "radical": "一", "strokeCount": 4, "example": "请等一下。", "exampleTranslation": "Xin đợi một lát.", "tags": ["Bài 13", "Cụm từ"]},
      {"id": "hsk1-l13-w17", "hanzi": "再", "pinyin": "zài", "hanViet": "tái", "vietnamese": "lại, nữa (hành động lặp lại trong tương lai)", "hskLevel": 1, "radical": "冂", "strokeCount": 6, "example": "明天再见！", "exampleTranslation": "Ngày mai gặp lại nhé!", "tags": ["Bài 13", "Phó từ"]},
      {"id": "hsk1-l13-w18", "hanzi": "早饭", "pinyin": "zǎofàn", "hanViet": "tảo phạn", "vietnamese": "bữa sáng, cơm sáng", "hskLevel": 1, "radical": "日", "strokeCount": 13, "example": "你吃早饭了吗？", "exampleTranslation": "Bạn đã ăn sáng chưa?", "tags": ["Bài 13", "Danh từ"]},
      {"id": "hsk1-l13-w19", "hanzi": "这个", "pinyin": "zhège", "hanViet": "giá cá", "vietnamese": "cái này, người này", "hskLevel": 1, "radical": "辶", "strokeCount": 10, "example": "这个苹果真大！", "exampleTranslation": "Quả táo này to thật!", "tags": ["Bài 13", "Đại từ"]},
      {"id": "hsk1-l13-w20", "hanzi": "坐", "pinyin": "zuò", "hanViet": "tọa", "vietnamese": "ngồi, đi (tàu, xe, máy bay)", "hskLevel": 1, "radical": "土", "strokeCount": 7, "example": "我们坐出租车去吧。", "exampleTranslation": "Chúng ta đi xe taxi đi nhé.", "tags": ["Bài 13", "Động từ"]},
    ],
    exercises: [
      {
        id: "hsk1-l13-ex1",
        type: "sentence_scramble",
        question: "Sắp xếp câu hai tân ngữ sau: 一杯茶 / 请 / 我 / 给",
        scrambleSegments: ["请", "给我", "一杯茶"],
        options: ["请给我一杯茶", "请一杯茶给我", "给我请一杯茶"],
        correctAnswer: "请给我一杯茶",
        explanation: "Cấu trúc hai tân ngữ: Động từ (给) + Tân ngữ người (我) + Tân ngữ vật (一杯茶)."
      },
      {
        id: "hsk1-l13-ex2",
        type: "multiple_choice",
        question: "Để xin phép ai đó xem thử đồ vật một cách lịch sự, bạn nói:",
        options: ["A. 我看一下。", "B. 我看了一点儿。", "C. 我看太好了。", "D. 我看不到。"],
        correctAnswer: "A. 我看一下。",
        explanation: "Cấu trúc 'Động từ + 一下' biểu thị làm thử động tác trong thời gian ngắn: 看一下 (xem một chút)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 14: 我看了一个电影 (Tôi đã xem một bộ phim)
  // ==========================================================================
  {
    lessonNumber: 14,
    titleHanzi: "我看了一个电影",
    titlePinyin: "Wǒ kànle yí gè diànyǐng",
    titleVietnamese: "Tôi đã xem một bộ phim",
    pageStart: 103,
    objectives: [
      "能听懂并使用动态助词“了（2）”表示动作行为已经发生或完成 (Nghe hiểu và dùng trợ từ động thái “了” (2) sau động từ biểu thị hành động đã hoàn thành).",
      "掌握范围副词“都”的用法 (Nắm vững cách dùng phó từ phạm vi “都”).",
      "掌握部分离合词的基本用法 (Nắm vững cách dùng cơ bản của một số từ ly hợp).",
      "了解并能描述学习情况 (Hiểu và có thể miêu tả tình hình học tập).",
    ],
    texts: [
      {
        id: "hsk1-l14-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang nói về chuyến dã ngoại vừa rồi.)",
        speakerAnchors: { "白家月": 35, "陈天中": 73 },
        lines: [
          { speaker: "白家月", hanzi: "你们上火车后看见王老师了吗？", pinyin: "Nǐmen shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?", vietnamese: "Lúc lên tàu các cậu có nhìn thấy cô Vương ở toa nào không?" },
          { speaker: "陈天中", hanzi: "没看见。中午车开后，有些人在看书，有些人睡觉了。", pinyin: "Méi kànjiàn. Zhōngwǔ chē kāi hòu, yǒuxiē rén zài kàn shū, yǒuxiē rén shuìjiào le.", vietnamese: "Tớ không thấy. Buổi trưa tàu chạy rồi thì có bạn ngồi đọc sách, có bạn thì lăn ra ngủ mất." },
          { speaker: "白家月", hanzi: "你呢？", pinyin: "Nǐ ne?", vietnamese: "Thế còn cậu thì sao?" },
          { speaker: "陈天中", hanzi: "我看了一个电影。", pinyin: "Wǒ kànle yí gè diànyǐng.", vietnamese: "Tớ xem hết cả một bộ phim hay tuyệt." }
        ]
      },
      {
        id: "hsk1-l14-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在课堂上，王一飞在询问学生们的学习情况。(Trong lớp học, Vương Nhất Phi đang hỏi về tình hình học tập của học sinh.)",
        speakerAnchors: { "陈天中": 35, "白家月": 48, "王一飞": 60 },
        lines: [
          { speaker: "王一飞", hanzi: "你们会说汉语了，也会写汉字了吗？", pinyin: "Nǐmen huì shuō Hànyǔ le, yě huì xiě Hànzì le ma?", vietnamese: "Các em đã biết nói tiếng Trung rồi, thế đã biết viết chữ Hán thành thạo chưa nào?" },
          { speaker: "白家月", hanzi: "我们都会写了。", pinyin: "Wǒmen dōu huì xiě le.", vietnamese: "Dạ thưa cô, chúng em đều biết viết cả rồi ạ!" },
          { speaker: "陈天中", hanzi: "老师，我听不见。", pinyin: "Lǎoshī, wǒ tīng bu jiàn.", vietnamese: "Thưa cô, em ngồi dưới nghe không rõ ạ." },
          { speaker: "王一飞", hanzi: "请大家不要说话！请听老师的问题：你们都会写哪些汉字了？", pinyin: "Qǐng dàjiā bùyào shuōhuà! Qǐng tīng lǎoshī de wèntí: Nǐmen dōu huì xiě nǎxiē Hànzì le?", vietnamese: "Cả lớp trật tự nào các em! Hãy nghe rõ câu hỏi của cô nhé: Các em đã biết viết những chữ Hán nào rồi?" },
          { speaker: "陈天中", hanzi: "我会写这些字了，您看！", pinyin: "Wǒ huì xiě zhèxiē zì le, nín kàn!", vietnamese: "Dạ em đã viết được những chữ này rồi đây này, cô xem giúp em với ạ!" }
        ]
      }
    ,
      {
        id: "hsk1-l14-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在家里，刘明和王一雪在谈论孩子的升学情况。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang nói về việc con cái lên cấp học mới.)",
        speakerAnchors: { "刘明": 33, "王一雪": 56 },
        lines: [
          { speaker: "刘明", hanzi: "明年女儿上中学。", pinyin: "Míngnián nǚ'ér shàng zhōngxué.", vietnamese: "Năm sau con gái mình lên cấp hai rồi em nhỉ." },
          { speaker: "王一雪", hanzi: "对。儿子也上小学了。", pinyin: "Duì. Érzi yě shàng xiǎoxué le.", vietnamese: "Dạ đúng rồi anh. Cu con cũng chuẩn bị vào lớp một nữa." },
          { speaker: "刘明", hanzi: "我们家有了一个中学生。", pinyin: "Wǒmen jiā yǒule yí gè zhōngxuéshēng.", vietnamese: "Thế là nhà mình sắp có một cô học sinh cấp hai rồi đấy." },
          { speaker: "王一雪", hanzi: "还有了一个小学生。", pinyin: "Hái yǒule yí gè xiǎoxuéshēng.", vietnamese: "Lại có thêm một cậu học trò tiểu học nữa chứ." },
          { speaker: "刘明", hanzi: "上学后，他们都忙了。", pinyin: "Shàngxué hòu, tāmen dōu máng le.", vietnamese: "Tụi nhỏ đi học vào là hai vợ chồng mình lại bận rộn suốt ngày cho xem." },
          { speaker: "王一雪", hanzi: "是的。太晚了，睡觉吧。", pinyin: "Shì de. Tài wǎn le, shuìjiào ba.", vietnamese: "Dạ đúng thế anh ạ. Thôi muộn rồi, hai vợ chồng mình đi ngủ thôi anh." }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l14-g1",
        title: "1. 动态助词“了（2）” (Trợ từ động thái “了” biểu thị hành động hoàn thành)",
        explanation: "Trợ từ '了' đặt ngay sau động từ để biểu thị hành động đã hoàn thành hoặc đã thực hiện. Khi tân ngữ có số lượng từ hoặc định ngữ bổ nghĩa, cấu trúc chuẩn là: 'Chủ ngữ + Động từ + 了 + Số lượng + Tân ngữ'. Phủ định dùng '没 + Động từ', tuyệt đối bỏ '了'.",
        examples: [
          {
            hanzi: "我看了一个电影。",
            pinyin: "Wǒ kànle yí gè diànyǐng.",
            vietnamese: "Tớ xem hết cả một bộ phim hay tuyệt."
          },
          {
            hanzi: "我买了一本汉字书。",
            pinyin: "Wǒ mǎile yì běn hànzì shū.",
            vietnamese: "Tôi đã mua một cuốn sách chữ Hán."
          },
          {
            hanzi: "我没看电影。",
            pinyin: "Wǒ méi kàn diànyǐng.",
            vietnamese: "Tôi chưa xem phim (phủ định bỏ 了)."
          },
        ]
      },
      {
        id: "hsk1-l14-g2",
        title: "2. 离合词（1）(Khái niệm và cách dùng từ ly hợp)",
        explanation: "Từ ly hợp là những từ gồm 2 âm tiết có kết cấu Động từ + Tân ngữ (như 上学, 睡觉, 说话, 唱歌, 上班). Khi cần thêm trợ từ '了' hoặc số lượng từ, ta chen chúng vào giữa hai âm tiết: '上 + 了 + 学', '睡 + 了一个好 + 觉'.",
        examples: [
          {
            hanzi: "他们上学了。",
            pinyin: "Tāmen shàngxué le.",
            vietnamese: "Họ đã đi học rồi."
          },
          {
            hanzi: "上火车后看见王老师了吗？",
            pinyin: "Shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?",
            vietnamese: "Sau khi lên tàu bạn có nhìn thấy cô Vương không?"
          },
        ]
      },
      {
        id: "hsk1-l14-g3",
        title: "3. 范围副词“都” (Phó từ phạm vi “都”)",
        explanation: "'都' (dōu) là phó từ biểu thị toàn bộ mọi thành viên hoặc sự vật trong phạm vi được nói đến đều có chung tính chất, hành động. '都' luôn đứng TRƯỚC vị ngữ động từ hoặc tính từ.",
        examples: [
          {
            hanzi: "我们都是中学生。",
            pinyin: "Wǒmen dōu shì zhōngxuéshēng.",
            vietnamese: "Tất cả chúng tôi đều là học sinh trung học."
          },
          {
            hanzi: "那些汉字我都认识。",
            pinyin: "Nàxiē hànzì wǒ dōu rènshi.",
            vietnamese: "Những chữ Hán kia tôi đều nhận biết được."
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l14-w1", "hanzi": "不要", "pinyin": "búyào", "hanViet": "bất yếu", "vietnamese": "đừng, không được", "hskLevel": 1, "radical": "一", "strokeCount": 13, "example": "上课时不要说话。", "exampleTranslation": "Trong giờ học đừng nói chuyện.", "tags": ["Bài 14", "Phó từ"]},
      {"id": "hsk1-l14-w2", "hanzi": "都", "pinyin": "dōu", "hanViet": "đô", "vietnamese": "đều, tất cả", "hskLevel": 1, "radical": "阝", "strokeCount": 10, "example": "我们都是学生。", "exampleTranslation": "Tất cả chúng tôi đều là học sinh.", "tags": ["Bài 14", "Phó từ"]},
      {"id": "hsk1-l14-w3", "hanzi": "火车", "pinyin": "huǒchē", "hanViet": "hỏa xa", "vietnamese": "tàu hỏa, xe lửa", "hskLevel": 1, "radical": "火", "strokeCount": 8, "example": "我们坐火车去北京。", "exampleTranslation": "Chúng tôi đi tàu hỏa đến Bắc Kinh.", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w4", "hanzi": "开", "pinyin": "kāi", "hanViet": "khai", "vietnamese": "mở, lái (xe), khởi hành (tàu)", "hskLevel": 1, "radical": "廾", "strokeCount": 4, "example": "火车上午九点开。", "exampleTranslation": "Tàu hỏa chạy lúc 9 giờ sáng.", "tags": ["Bài 14", "Động từ"]},
      {"id": "hsk1-l14-w5", "hanzi": "了", "pinyin": "le", "hanViet": "liễu", "vietnamese": "rồi (trợ từ ngữ khí cuối câu / trợ từ động thái sau động từ)", "hskLevel": 1, "radical": "乙", "strokeCount": 2, "example": "昨天下雪了。", "exampleTranslation": "Hôm qua tuyết rơi rồi.", "tags": ["Bài 14", "Trợ từ"]},
      {"id": "hsk1-l14-w6", "hanzi": "明年", "pinyin": "míngnián", "hanViet": "minh niên", "vietnamese": "năm sau, sang năm", "hskLevel": 1, "radical": "日", "strokeCount": 14, "example": "我明年去中国留学。", "exampleTranslation": "Năm sau tôi sẽ sang Trung Quốc du học.", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w7", "hanzi": "哪些", "pinyin": "nǎxiē", "hanViet": "nả tỉ", "vietnamese": "những cái nào, những ai", "hskLevel": 1, "radical": "口", "strokeCount": 20, "example": "这些书哪些是你的？", "exampleTranslation": "Những cuốn sách này cuốn nào là của bạn?", "tags": ["Bài 14", "Đại từ"]},
      {"id": "hsk1-l14-w8", "hanzi": "上", "pinyin": "shàng", "hanViet": "thượng", "vietnamese": "lên, trên; vào (học, ca làm)", "hskLevel": 1, "radical": "一", "strokeCount": 3, "example": "桌子上有两本书。", "exampleTranslation": "Trên bàn có hai cuốn sách.", "tags": ["Bài 14", "Động từ / Danh từ phương vị"]},
      {"id": "hsk1-l14-w9", "hanzi": "上学", "pinyin": "shàngxué", "hanViet": "thượng học", "vietnamese": "đi học, tới trường học", "hskLevel": 1, "radical": "一", "strokeCount": 11, "example": "孩子们都去上学了。", "exampleTranslation": "Lũ trẻ đều đi học rồi.", "tags": ["Bài 14", "Động từ"]},
      {"id": "hsk1-l14-w10", "hanzi": "说话", "pinyin": "shuōhuà", "hanViet": "thuyết thoại", "vietnamese": "nói chuyện, trò chuyện", "hskLevel": 1, "radical": "讠", "strokeCount": 17, "example": "上课请不要说话。", "exampleTranslation": "Trong giờ học xin đừng nói chuyện riêng.", "tags": ["Bài 14", "Động từ"]},
      {"id": "hsk1-l14-w11", "hanzi": "他们", "pinyin": "tāmen", "hanViet": "tha môn", "vietnamese": "họ, bọn họ, các anh ấy", "hskLevel": 1, "radical": "亻", "strokeCount": 10, "example": "他们都是大学生。", "exampleTranslation": "Họ đều là sinh viên đại học.", "tags": ["Bài 14", "Đại từ"]},
      {"id": "hsk1-l14-w12", "hanzi": "它们", "pinyin": "tāmen", "hanViet": "tha môn", "vietnamese": "chúng nó (chỉ đồ vật, động vật)", "hskLevel": 1, "radical": "宀", "strokeCount": 10, "example": "那些小鸟真好看，它们在唱歌。", "exampleTranslation": "Những chú chim kia thật đẹp, chúng đang hót.", "tags": ["Bài 14", "Đại từ"]},
      {"id": "hsk1-l14-w13", "hanzi": "她们", "pinyin": "tāmen", "hanViet": "tha môn", "vietnamese": "các cô ấy, các bà ấy, họ (nữ)", "hskLevel": 1, "radical": "女", "strokeCount": 11, "example": "她们都是中学生。", "exampleTranslation": "Các bạn ấy đều là học sinh trung học.", "tags": ["Bài 14", "Đại từ"]},
      {"id": "hsk1-l14-w14", "hanzi": "听", "pinyin": "tīng", "hanViet": "thính", "vietnamese": "nghe", "hskLevel": 1, "radical": "口", "strokeCount": 7, "example": "他在听歌呢。", "exampleTranslation": "Anh ấy đang nghe nhạc đấy.", "tags": ["Bài 14", "Động từ"]},
      {"id": "hsk1-l14-w15", "hanzi": "听见", "pinyin": "tīngjiàn", "hanViet": "thính kiến", "vietnamese": "nghe thấy", "hskLevel": 1, "radical": "口", "strokeCount": 11, "example": "我听见了敲门声。", "exampleTranslation": "Tôi đã nghe thấy tiếng gõ cửa.", "tags": ["Bài 14", "Động từ"]},
      {"id": "hsk1-l14-w16", "hanzi": "晚", "pinyin": "wǎn", "hanViet": "vãn", "vietnamese": "muộn, tối", "hskLevel": 1, "radical": "日", "strokeCount": 11, "example": "今天晚上去看电影吧。", "exampleTranslation": "Tối nay đi xem phim đi nhé.", "tags": ["Bài 14", "Tính từ"]},
      {"id": "hsk1-l14-w17", "hanzi": "小学", "pinyin": "xiǎoxué", "hanViet": "tiểu học", "vietnamese": "trường tiểu học, trường cấp 1", "hskLevel": 1, "radical": "小", "strokeCount": 11, "example": "我家旁边有一所小学。", "exampleTranslation": "Cạnh nhà tôi có một trường tiểu học.", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w18", "hanzi": "小学生", "pinyin": "xiǎoxuéshēng", "hanViet": "tiểu học sinh", "vietnamese": "học sinh tiểu học", "hskLevel": 1, "radical": "小", "strokeCount": 16, "example": "他是一名小学生。", "exampleTranslation": "Cậu bé là một học sinh tiểu học.", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w19", "hanzi": "写", "pinyin": "xiě", "hanViet": "tả", "vietnamese": "viết", "hskLevel": 1, "radical": "冖", "strokeCount": 5, "example": "这个汉字怎么写？", "exampleTranslation": "Chữ Hán này viết như thế nào?", "tags": ["Bài 14", "Động từ"]},
      {"id": "hsk1-l14-w20", "hanzi": "有的", "pinyin": "yǒude", "hanViet": "hữu đích", "vietnamese": "có cái, có người (một số)", "hskLevel": 1, "radical": "月", "strokeCount": 14, "example": "有的学生喜欢看书，有的喜欢唱歌。", "exampleTranslation": "Có học sinh thích đọc sách, có người lại thích hát.", "tags": ["Bài 14", "Đại từ"]},
      {"id": "hsk1-l14-w21", "hanzi": "有些", "pinyin": "yǒuxiē", "hanViet": "hữu tỉ", "vietnamese": "có một số, vài phần, hơi", "hskLevel": 1, "radical": "月", "strokeCount": 14, "example": "有些人喜欢喝茶。", "exampleTranslation": "Có một số người thích uống trà.", "tags": ["Bài 14", "Đại từ"]},
      {"id": "hsk1-l14-w22", "hanzi": "中午", "pinyin": "zhōngwǔ", "hanViet": "trung ngọ", "vietnamese": "buổi trưa", "hskLevel": 1, "radical": "丨", "strokeCount": 8, "example": "中午我们在饭店吃午饭。", "exampleTranslation": "Buổi trưa chúng tôi ăn cơm ở nhà hàng.", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w23", "hanzi": "中学", "pinyin": "zhōngxué", "hanViet": "trung học", "vietnamese": "trường trung học (cấp 2, 3)", "hskLevel": 1, "radical": "丨", "strokeCount": 12, "example": "这是一所中学。", "exampleTranslation": "Đây là một trường trung học.", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w24", "hanzi": "中学生", "pinyin": "zhōngxuéshēng", "hanViet": "trung học sinh", "vietnamese": "học sinh trung học", "hskLevel": 1, "radical": "丨", "strokeCount": 17, "example": "我们都是中学生。", "exampleTranslation": "Tất cả chúng tôi đều là học sinh trung học.", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w25", "hanzi": "字", "pinyin": "zì", "hanViet": "tự", "vietnamese": "chữ, chữ Hán", "hskLevel": 1, "radical": "子", "strokeCount": 6, "example": "这个字怎么读？", "exampleTranslation": "Chữ này đọc như thế nào?", "tags": ["Bài 14", "Danh từ"]},
      {"id": "hsk1-l14-w26", "hanzi": "汉语", "pinyin": "Hànyǔ", "hanViet": "hán ngữ", "vietnamese": "tiếng Hán, tiếng Trung", "hskLevel": 1, "radical": "氵", "strokeCount": 23, "example": "他在大学学习汉语。", "exampleTranslation": "Anh ấy học tiếng Trung ở trường đại học.", "tags": ["Bài 14", "Danh từ riêng"]},
      {"id": "hsk1-l14-w27", "hanzi": "汉字", "pinyin": "Hànzì", "hanViet": "hán tự", "vietnamese": "chữ Hán", "hskLevel": 1, "radical": "氵", "strokeCount": 11, "example": "汉字很有意思。", "exampleTranslation": "Chữ Hán rất thú vị.", "tags": ["Bài 14", "Danh từ riêng"]},
    ],
    exercises: [
      {
        id: "hsk1-l14-ex1",
        type: "fill_blank",
        question: "Điền trợ từ thích hợp vào câu diễn đạt hành động đã làm: 我看___一个电影。",
        options: ["A. 的", "B. 了", "C. 呢", "D. 吧"],
        correctAnswer: "B. 了",
        explanation: "Trợ từ động thái '了' đứng sau động từ (看了) biểu thị hành động xem đã diễn ra."
      },
      {
        id: "hsk1-l14-ex2",
        type: "sentence_scramble",
        question: "Sắp xếp câu dùng phó từ phạm vi '都': 都是 / 我们 / 中学生",
        scrambleSegments: ["我们", "都是", "中学生"],
        options: ["我们都是中学生", "都是我们中学生", "中学生我们都是"],
        correctAnswer: "Chúng tôi đều là học sinh trung học",
        explanation: "Phó từ '都' đứng trước vị ngữ: 我们 (Chủ ngữ) + 都是 (Phó từ + Động từ) + 中学生 (Tân ngữ)."
      },
    ],
  },
  // ==========================================================================
  // LESSON 15: 大兴机场见！ (Hẹn gặp ở sân bay Đại Hưng!)
  // ==========================================================================
  {
    lessonNumber: 15,
    titleHanzi: "大兴机场见！",
    titlePinyin: "Dàxīng Jīchǎng jiàn!",
    titleVietnamese: "Hẹn gặp ở sân bay Đại Hưng!",
    pageStart: 112,
    objectives: [
      "能听懂并使用相关词语表达旅行意愿、计划 (Nghe hiểu và sử dụng từ ngữ biểu đạt nguyện vọng, kế hoạch đi du lịch).",
      "掌握并列复句“……，还/也……” (Nắm vững câu phức đẳng lập “..., 还/也...”).",
      "了解中国餐桌文化、待客礼仪 (Tìm hiểu văn hóa bàn ăn và nghi thức tiếp đãi khách của người Trung Quốc).",
      "了解中国的首都——北京 (Tìm hiểu về thủ đô Bắc Kinh của Trung Quốc).",
    ],
    texts: [
      {
        id: "hsk1-l15-t1",
        title: "课文 1 (Bài khóa 1)",
        context: "在李文家，李文邀请陈天中、白家月等朋友品尝中餐。(Ở nhà Lý Văn, Lý Văn mời Trần Thiên Trung, Bạch Gia Nguyệt và các bạn thưởng thức ẩm thực Trung Quốc.)",
        speakerAnchors: { "白家月": 22, "李文": 36, "安妮": 72, "陈天中": 80 },
        lines: [
          { speaker: "李文", hanzi: "你们爱吃哪个菜？", pinyin: "Nǐmen ài chī nǎge cài?", vietnamese: "Các cậu thích ăn món nào nhất nào?" },
          { speaker: "白家月", hanzi: "我喜欢这个，也喜欢那个。", pinyin: "Wǒ xǐhuan zhège, yě xǐhuan nàge.", vietnamese: "Món này tớ thích, mà món kia tớ cũng mê nữa cơ." },
          { speaker: "陈天中", hanzi: "这些菜都好吃，还很好看。", pinyin: "Zhèxiē cài dōu hǎochī, hái hěn hǎokàn.", vietnamese: "Món nào trông cũng ngon mắt và đậm đà hấp dẫn cả." },
          { speaker: "李文", hanzi: "我爱吃中国菜，也喜欢做。大家多吃点儿。", pinyin: "Wǒ ài chī Zhōngguó cài, yě xǐhuan zuò. Dàjiā duō chī diǎnr.", vietnamese: "Tớ mê đồ ăn Trung Hoa mà cũng thích tự tay xuống bếp nấu nướng nữa. Các cậu cứ tự nhiên ăn thật nhiều vào nhé!" }
        ]
      },
      {
        id: "hsk1-l15-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在李文家，大家边吃饭边谈论假期计划。(Ở nhà Lý Văn, mọi người vừa ăn vừa bàn về kế hoạch nghỉ lễ.)",
        speakerAnchors: { "白家月": 23, "李文": 50, "安妮": 71, "陈天中": 80 },
        lines: [
          { speaker: "李文", hanzi: "你们都想去哪儿？", pinyin: "Nǐmen dōu xiǎng qù nǎr?", vietnamese: "Kỳ nghỉ này các cậu dự định đi chơi ở đâu?" },
          { speaker: "安妮", hanzi: "去年我和男朋友去了西安，今年我想去北京。", pinyin: "Qùnián wǒ hé nánpéngyou qùle Xī'ān, jīnnián wǒ xiǎng qù Běijīng.", vietnamese: "Năm ngoái tớ với bạn trai đi Tây An rồi, năm nay tớ đang tính làm một chuyến ra Bắc Kinh đây." },
          { speaker: "白家月", hanzi: "前几年我去了西安，非常好玩儿。今年我也想去北京。", pinyin: "Qián jǐ nián wǒ qùle Xī'ān, fēicháng hǎowánr. Jīnnián wǒ yě xiǎng qù Běijīng.", vietnamese: "Mấy năm trước tớ cũng từng đến Tây An, vui cực kỳ luôn. Năm nay tớ cũng rất muốn đến Bắc Kinh một chuyến." },
          { speaker: "李文", hanzi: "我和王老师都是北京人，北京非常漂亮。", pinyin: "Wǒ hé Wáng lǎoshī dōu shì Běijīng rén, Běijīng fēicháng piàoliang.", vietnamese: "Tớ với cô giáo Vương đều là người gốc Bắc Kinh đấy, Bắc Kinh mùa này đẹp mê hồn luôn các cậu ạ." }
        ]
      }
    ,
      {
        id: "hsk1-l15-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在教室外，白家月、安妮和王老师在谈论去北京旅游的事。(Ngoài lớp học, Bạch Gia Nguyệt, An Ni và cô giáo Vương đang nói về chuyện đi du lịch Bắc Kinh.)",
        speakerAnchors: { "白家月": 26, "王一飞": 52, "安妮": 76 },
        lines: [
          { speaker: "王一飞", hanzi: "你们的飞机到北京要几个小时？", pinyin: "Nǐmen de fēijī dào Běijīng yào jǐ gè xiǎoshí?", vietnamese: "Chuyến bay của các em sang Bắc Kinh mất mấy tiếng đồng hồ thế?" },
          { speaker: "白家月", hanzi: "九个小时。", pinyin: "Jiǔ gè xiǎoshí.", vietnamese: "Dạ mất chín tiếng cô ạ." },
          { speaker: "王一飞", hanzi: "我家人都在北京，星期天我姐姐也有时间，她可以去机场接你们，你们也可以住我家。", pinyin: "Wǒ jiārén dōu zài Běijīng, Xīngqītiān wǒ jiějie yě yǒu shíjiān, tā kěyǐ qù jīchǎng jiē nǐmen, nǐmen yě kěyǐ zhù wǒ jiā.", vietnamese: "Cả nhà cô đều ở Bắc Kinh, Chủ nhật chị gái cô cũng rảnh rỗi, chị ấy có thể ra sân bay đón các em, các em cũng có thể đến ở nhà cô cho ấm cúng." },
          { speaker: "安妮", hanzi: "我们星期日早上八点到大兴机场，早不早？", pinyin: "Wǒmen Xīngqīrì zǎoshang bā diǎn dào Dàxīng Jīchǎng, zǎo bu zǎo?", vietnamese: "Dạ chúng em hạ cánh ở sân bay Đại Hưng lúc tám giờ sáng Chủ nhật, có bị sớm quá làm phiền chị không cô?" },
          { speaker: "王一飞", hanzi: "不早。", pinyin: "Bù zǎo.", vietnamese: "Không sớm đâu em, giờ đó vừa đẹp." },
          { speaker: "白家月", hanzi: "谢谢老师！那我们和您姐姐在大兴机场见！", pinyin: "Xièxie lǎoshī! Nà wǒmen hé nín jiějie zài Dàxīng Jīchǎng jiàn!", vietnamese: "Ôi chúng em cảm ơn cô nhiều lắm ạ! Vậy chúng em hẹn gặp chị gái của cô ở sân bay Đại Hưng nhé!" }
        ]
      }
],
    grammarPoints: [
      {
        id: "hsk1-l15-g1",
        title: "1. 并列复句“……，还/也……” (Câu phức đẳng lập “..., 还/也...”)",
        explanation: "Câu phức đẳng lập nối hai phân câu có mối quan hệ song song, bổ sung thông tin cho nhau. '还' (hái) nhấn mạnh sự tăng tiến bổ sung (ngoài ra còn), '也' (yě) nhấn mạnh tính tương đồng (cũng).",
        examples: [
          {
            hanzi: "我想去北京，还想去西安。",
            pinyin: "Wǒ xiǎng qù Běijīng, hái xiǎng qù Xī'ān.",
            vietnamese: "Tôi muốn đi Bắc Kinh, còn muốn đi cả Tây An nữa."
          },
          {
            hanzi: "他喜欢吃饺子，也喜欢吃米饭。",
            pinyin: "Tā xǐhuan chī jiǎozi, yě xǐhuan chī mǐfàn.",
            vietnamese: "Anh ấy thích ăn sủi cảo, cũng thích ăn cả cơm nữa."
          },
        ]
      },
      {
        id: "hsk1-l15-g2",
        title: "2. Cấu trúc hẹn gặp: Địa điểm / Thời gian + 见",
        explanation: "Trong tiếng Trung, để hẹn gặp ai ở một địa điểm hoặc vào một thời gian nào đó, ta đặt từ chỉ địa điểm/thời gian trước động từ '见' (jiàn).",
        examples: [
          {
            hanzi: "大兴机场见！",
            pinyin: "Dàxīng Jīchǎng jiàn!",
            vietnamese: "Hẹn gặp ở sân bay Đại Hưng nhé!"
          },
          {
            hanzi: "明天见！",
            pinyin: "Míngtiān jiàn!",
            vietnamese: "Hẹn ngày mai gặp lại!"
          },
          {
            hanzi: "学校见！",
            pinyin: "Xuéxiào jiàn!",
            vietnamese: "Hẹn gặp ở trường nhé!"
          },
        ]
      },
    ],
    vocabulary: [
      {"id": "hsk1-l15-w1", "hanzi": "爱", "pinyin": "ài", "hanViet": "ái", "vietnamese": "yêu, thích", "hskLevel": 1, "radical": "爫", "strokeCount": 10, "example": "你们爱吃哪个菜？", "exampleTranslation": "Các cậu thích ăn món nào nhất nào?", "tags": ["Bài 15", "Động từ"]},
      {"id": "hsk1-l15-w2", "hanzi": "飞机", "pinyin": "fēijī", "hanViet": "phi cơ", "vietnamese": "máy bay", "hskLevel": 1, "radical": "飞", "strokeCount": 7, "example": "大兴机场有很多飞机。", "exampleTranslation": "Sân bay Đại Hưng có rất nhiều máy bay.", "tags": ["Bài 15", "Danh từ"]},
      {"id": "hsk1-l15-w3", "hanzi": "好玩儿", "pinyin": "hǎowánr", "hanViet": "hảo ngoạn nhi", "vietnamese": "vui vẻ, thú vị, vui nhộn", "hskLevel": 1, "radical": "女", "strokeCount": 14, "example": "北京好玩儿吗？", "exampleTranslation": "Bắc Kinh chơi có vui không?", "tags": ["Bài 15", "Tính từ"]},
      {"id": "hsk1-l15-w4", "hanzi": "机场", "pinyin": "jīchǎng", "hanViet": "cơ trường", "vietnamese": "sân bay, phi trường", "hskLevel": 1, "radical": "木", "strokeCount": 13, "example": "大兴机场见！", "exampleTranslation": "Hẹn gặp ở sân bay Đại Hưng nhé!", "tags": ["Bài 15", "Danh từ"]},
      {"id": "hsk1-l15-w5", "hanzi": "几", "pinyin": "jǐ", "hanViet": "kỷ", "vietnamese": "mấy (hỏi số lượng dưới 10)", "hskLevel": 1, "radical": "几", "strokeCount": 2, "example": "你有几个苹果？", "exampleTranslation": "Bạn có mấy quả táo?", "tags": ["Bài 15", "Số từ / Đại từ"]},
      {"id": "hsk1-l15-w6", "hanzi": "家人", "pinyin": "jiārén", "hanViet": "gia nhân", "vietnamese": "người nhà, thành viên gia đình", "hskLevel": 1, "radical": "宀", "strokeCount": 12, "example": "我的家人都在北京。", "exampleTranslation": "Người nhà tôi đều ở Bắc Kinh.", "tags": ["Bài 15", "Danh từ"]},
      {"id": "hsk1-l15-w7", "hanzi": "接", "pinyin": "jiē", "hanViet": "tiếp", "vietnamese": "đón (người), nhận (điện thoại)", "hskLevel": 1, "radical": "扌", "strokeCount": 11, "example": "我明天去机场接你。", "exampleTranslation": "Ngày mai tôi sẽ ra sân bay đón bạn.", "tags": ["Bài 15", "Động từ"]},
      {"id": "hsk1-l15-w8", "hanzi": "哪个", "pinyin": "nǎge", "hanViet": "nả cá", "vietnamese": "cái nào, người nào", "hskLevel": 1, "radical": "口", "strokeCount": 12, "example": "你喜欢哪个菜？", "exampleTranslation": "Bạn thích món ăn nào?", "tags": ["Bài 15", "Đại từ"]},
      {"id": "hsk1-l15-w9", "hanzi": "那", "pinyin": "nà", "hanViet": "na", "vietnamese": "kia, đó, ấy", "hskLevel": 1, "radical": "阝", "strokeCount": 6, "example": "那是谁的电脑？", "exampleTranslation": "Kia là máy tính của ai?", "tags": ["Bài 15", "Đại từ"]},
      {"id": "hsk1-l15-w10", "hanzi": "男朋友", "pinyin": "nánpéngyou", "hanViet": "nam bằng hữu", "vietnamese": "bạn trai, người yêu nam", "hskLevel": 1, "radical": "田", "strokeCount": 19, "example": "她男朋友是北京人。", "exampleTranslation": "Bạn trai của cô ấy là người Bắc Kinh.", "tags": ["Bài 15", "Danh từ"]},
      {"id": "hsk1-l15-w11", "hanzi": "年", "pinyin": "nián", "hanViet": "niên", "vietnamese": "năm", "hskLevel": 1, "radical": "干", "strokeCount": 6, "example": "我在中国住了三年。", "exampleTranslation": "Tôi sống ở Trung Quốc 3 năm.", "tags": ["Bài 15", "Danh từ / Lượng từ"]},
      {"id": "hsk1-l15-w12", "hanzi": "去年", "pinyin": "qùnián", "hanViet": "khứ niên", "vietnamese": "năm ngoái", "hskLevel": 1, "radical": "厶", "strokeCount": 11, "example": "我是去年来北京的。", "exampleTranslation": "Tôi đến Bắc Kinh vào năm ngoái.", "tags": ["Bài 15", "Danh từ"]},
      {"id": "hsk1-l15-w13", "hanzi": "时间", "pinyin": "shíjiān", "hanViet": "thời gian", "vietnamese": "thời gian, thời khắc", "hskLevel": 1, "radical": "日", "strokeCount": 16, "example": "你有时间吗？", "exampleTranslation": "Bạn có thời gian rảnh không?", "tags": ["Bài 15", "Danh từ"]},
      {"id": "hsk1-l15-w14", "hanzi": "小时", "pinyin": "xiǎoshí", "hanViet": "tiểu thời", "vietnamese": "tiếng đồng hồ, giờ đồng hồ", "hskLevel": 1, "radical": "小", "strokeCount": 10, "example": "从北京坐高铁到西安要四个小时。", "exampleTranslation": "Từ Bắc Kinh đi tàu cao tốc đến Tây An mất 4 tiếng.", "tags": ["Bài 15", "Danh từ"]},
      {"id": "hsk1-l15-w15", "hanzi": "要", "pinyin": "yào", "hanViet": "yếu", "vietnamese": "muốn, cần, phải, sắp", "hskLevel": 1, "radical": "覀", "strokeCount": 9, "example": "我要买两斤苹果。", "exampleTranslation": "Cho tôi mua hai cân táo nhé bác.", "tags": ["Bài 15", "Động từ / Động từ năng nguyện"]},
      {"id": "hsk1-l15-w16", "hanzi": "早", "pinyin": "zǎo", "hanViet": "tảo", "vietnamese": "sớm; chào buổi sáng", "hskLevel": 1, "radical": "日", "strokeCount": 6, "example": "早上好！", "exampleTranslation": "Chào buổi sáng!", "tags": ["Bài 15", "Tính từ"]},
      {"id": "hsk1-l15-w17", "hanzi": "住", "pinyin": "zhù", "hanViet": "trú", "vietnamese": "ở, cư trú, sống tại", "hskLevel": 1, "radical": "亻", "strokeCount": 7, "example": "你住在哪里？", "exampleTranslation": "Bạn sống ở đâu?", "tags": ["Bài 15", "Động từ"]},
      {"id": "hsk1-l15-w18", "hanzi": "北京", "pinyin": "Běijīng", "hanViet": "bắc kinh", "vietnamese": "Bắc Kinh (thủ đô Trung Quốc)", "hskLevel": 1, "radical": "亠", "strokeCount": 13, "example": "大兴机场在北京市。", "exampleTranslation": "Sân bay Đại Hưng nằm ở thành phố Bắc Kinh.", "tags": ["Bài 15", "Danh từ riêng"]},
      {"id": "hsk1-l15-w19", "hanzi": "大兴机场", "pinyin": "Dàxīng Jīchǎng", "hanViet": "đại hưng cơ trường", "vietnamese": "Sân bay Quốc tế Đại Hưng", "hskLevel": 1, "radical": "大", "strokeCount": 22, "example": "大兴机场见！", "exampleTranslation": "Hẹn gặp ở sân bay Đại Hưng nhé!", "tags": ["Bài 15", "Danh từ riêng"]},
      {"id": "hsk1-l15-w20", "hanzi": "西安", "pinyin": "Xī'ān", "hanViet": "tây an", "vietnamese": "thành phố Tây An", "hskLevel": 1, "radical": "覀", "strokeCount": 12, "example": "我想去西安旅游。", "exampleTranslation": "Tôi muốn đi du lịch Tây An.", "tags": ["Bài 15", "Danh từ riêng"]},
    ],
    exercises: [
      {
        id: "hsk1-l15-ex1",
        type: "multiple_choice",
        question: "Để nói 'Hẹn gặp ở sân bay Đại Hưng!', câu nào chuẩn nhất?",
        options: ["A. 见大兴机场！", "B. 大兴机场见！", "C. 去大兴机场！", "D. 大兴机场到了！"],
        correctAnswer: "B. 大兴机场见！",
        explanation: "Cấu trúc hẹn gặp: Địa điểm + 见 (Dàxīng Jīchǎng jiàn)."
      },
      {
        id: "hsk1-l15-ex2",
        type: "fill_blank",
        question: "Điền liên từ bổ sung thích hợp: 我想去北京，___想去西安。",
        options: ["A. 还", "B. 吗", "C. 了", "D. 呢"],
        correctAnswer: "A. 还",
        explanation: "Câu phức đẳng lập bổ sung: '..., 还想...' (ngoài ra còn muốn...)."
      },
    ],
    cultureBonus: {
      title: "HSK 1 结业寄语 (Lời chúc tốt nghiệp HSK 1)",
      summary: "Chúc mừng bạn đã hoàn thành trọn vẹn 15 bài học chuẩn Tân HSK 1 (HSK 3.0)!",
      content: "Bạn đã làm chủ 319 từ vựng và toàn bộ các điểm ngữ pháp nền tảng của bộ giáo trình Tân HSK 1 3.0. Hãy sẵn sàng tiến bước lên Tân HSK 2 để chinh phục thêm nhiều chủ đề giao tiếp phong phú hơn nữa!"
    }
  },
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
