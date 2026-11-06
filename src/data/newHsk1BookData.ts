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
        title: "课文 1: 在办公室 (Trong văn phòng)",
        context: "开学第一天，在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: 'AI小语，你好！')",
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "AI小语，你好！", pinyin: "AI Xiǎoyǔ, nǐ hǎo!", vietnamese: "Chào trợ lý AI Tiểu Ngữ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "王老师，你好！", pinyin: "Wáng lǎoshī, nǐ hǎo!", vietnamese: "Chào cô giáo Vương ạ!" }
        ]
      },
      {
        id: "hsk1-l1-t2",
        title: "课文 2: 在课堂上 (Trong lớp học)",
        context: "开学第一天，课堂上，学生们学习打招呼用语。(Trong lớp học, các bạn học sinh học cách chào hỏi).",
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "大家好！", pinyin: "Dàjiā hǎo!", vietnamese: "Chào cả lớp!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "老师，您好！", pinyin: "Lǎoshī, nín hǎo!", vietnamese: "Chúng em kính chào cô giáo ạ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "你们好！", pinyin: "Nǐmen hǎo!", vietnamese: "Chào các bạn!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "你好，小语！", pinyin: "Nǐ hǎo, Xiǎoyǔ!", vietnamese: "Chào bạn Tiểu Ngữ!" }
        ]
      },
      {
        id: "hsk1-l1-t3",
        title: "课文 3: 课堂致谢与告别 (Cảm ơn và Tạm biệt)",
        context: "开学第一天，课堂上，学生们学习致谢语、告别语。(Cuối buổi học, học sinh nói lời cảm ơn và chào tạm biệt).",
        lines: [
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "谢谢！", pinyin: "Xièxie!", vietnamese: "Cảm ơn ạ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "不客气！", pinyin: "Bú kèqi!", vietnamese: "Không có chi!" },
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "同学们，再见！", pinyin: "Tóngxuémen, zàijiàn!", vietnamese: "Tạm biệt các em!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "老师，再见！", pinyin: "Lǎoshī, zàijiàn!", vietnamese: "Chúng em chào cô ạ!" }
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
    titleHanzi: "我叫李文",
    titlePinyin: "Wǒ jiào Lǐ Wén",
    titleVietnamese: "Tên tôi là Lý Văn",
    pageStart: 8,
    objectives: [
      "Học cách cảm ơn (谢谢) và đáp lại lời cảm ơn (不客气).",
      "Học cách xin lỗi (对不起) và đáp lại lời xin lỗi (没关系).",
      "Nắm vững các nét cơ bản và quy tắc viết chữ Hán."
    ],
    texts: [
      {
        id: "hsk1-l2-t1",
        title: "课文 1: 在教室里 (Trong lớp học)",
        context: "在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi tên học sinh).",
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "请问，你叫什么名字？", pinyin: "Qǐngwèn, nǐ jiào shénme míngzi?", vietnamese: "Xin hỏi, em tên là gì?" },
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "我叫陈天中。", pinyin: "Wǒ jiào Chén Tiānzhōng.", vietnamese: "Em tên là Trần Thiên Trung ạ." }
        ]
      },
      {
        id: "hsk1-l2-t2",
        title: "课文 2: 在校园里 (Trên sân trường)",
        context: "在校园里，陈天中和白家月打招呼时认错了人。(Trên sân trường, Trần Thiên Trung chào nhầm Bạch Gia Nguyệt thành Annie).",
        lines: [
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "你好，安妮！", pinyin: "Nǐ hǎo, Ānnī!", vietnamese: "Chào Annie!" },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "你好，陈天中！我不是安妮，我是白家月。", pinyin: "Nǐ hǎo, Chén Tiānzhōng! Wǒ bú shì Ānnī, wǒ shì Bái Jiāyuè.", vietnamese: "Chào Trần Thiên Trung! Mình không phải Annie, mình là Bạch Gia Nguyệt." },
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "对不起！", pinyin: "Duìbuqǐ!", vietnamese: "Xin lỗi bạn nhé!" },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "没关系！", pinyin: "Méi guānxi!", vietnamese: "Không sao đâu!" }
        ]
      },
      {
        id: "hsk1-l2-t3",
        title: "课文 3: 初次相遇 (Lần đầu gặp mặt)",
        context: "在校园里，李文和白家月第一次相遇。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau).",
        lines: [
          { speaker: "李文 (Lý Văn)", avatar: "👨‍🎓", hanzi: "你好！我叫李文。", pinyin: "Nǐ hǎo! Wǒ jiào Lǐ Wén.", vietnamese: "Chào bạn! Tôi tên là Lý Văn." },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "你好！我叫白家月。", pinyin: "Nǐ hǎo! Wǒ jiào Bái Jiāyuè.", vietnamese: "Chào bạn! Tôi tên là Bạch Gia Nguyệt." },
          { speaker: "李文 (Lý Văn)", avatar: "👨‍🎓", hanzi: "很高兴认识你。", pinyin: "Hěn gāoxìng rènshi nǐ.", vietnamese: "Rất vui được làm quen với bạn." },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "认识你我也很高兴。", pinyin: "Rènshi nǐ wǒ yě hěn gāoxìng.", vietnamese: "Tôi cũng rất vui được làm quen với bạn." }
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
  },

// LESSON 4
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
        context: "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang trò chuyện.)",
        lines: [
          { speaker: "王一雪", hanzi: "今天几号？", pinyin: "Jīntiān jǐ hào?", vietnamese: "Hôm nay ngày mấy?" },
          { speaker: "刘明", hanzi: "今天9月8号。", pinyin: "Jīntiān jiǔ yuè bā hào.", vietnamese: "Hôm nay ngày 8 tháng 9." },
          { speaker: "王一雪", hanzi: "星期几？", pinyin: "Xīngqī jǐ?", vietnamese: "Thứ mấy?" },
          { speaker: "刘明", hanzi: "星期日。今天我休息。", pinyin: "Xīngqīrì. Jīntiān wǒ xiūxi.", vietnamese: "Chủ nhật. Hôm nay tôi nghỉ." }
        ]
      },
      {
        id: "hsk1-l5-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao.)",
        lines: [
          { speaker: "王一雪", hanzi: "你会做饭吗？", pinyin: "Nǐ huì zuòfàn ma?", vietnamese: "Bạn có biết nấu ăn không?" },
          { speaker: "杨同乐", hanzi: "我会做。", pinyin: "Wǒ huì zuò.", vietnamese: "Tôi biết nấu." },
          { speaker: "王一雪", hanzi: "你会做什么？", pinyin: "Nǐ huì zuò shénme?", vietnamese: "Bạn biết làm món gì?" },
          { speaker: "杨同乐", hanzi: "我会做面条儿、饺子，也会做一些菜。星期天我也做饭。", pinyin: "Wǒ huì zuò miàntiáor, jiǎozi, yě huì zuò yīxiē cài. Xīngqītiān wǒ yě zuòfàn.", vietnamese: "Tôi biết làm mì, sủi cảo và cũng biết làm một số món. Chủ nhật tôi cũng nấu ăn." }
        ]
      },
      {
        id: "hsk1-l5-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在公司里，王一雪和杨同乐下班时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc nói chuyện lúc tan ca.)",
        lines: [
          { speaker: "王一雪", hanzi: "同乐，下班吗？", pinyin: "Tónglè, xiàbān ma?", vietnamese: "Đồng Nhạc, tan ca rồi à?" },
          { speaker: "杨同乐", hanzi: "下班。", pinyin: "Xiàbān.", vietnamese: "Tan ca rồi." },
          { speaker: "王一雪", hanzi: "这是你的新电脑吗？", pinyin: "Zhè shì nǐ de xīn diànnǎo ma?", vietnamese: "Đây là máy tính mới của bạn à?" },
          { speaker: "杨同乐", hanzi: "是的，是我的新电脑。", pinyin: "Shì de, shì wǒ de xīn diànnǎo.", vietnamese: "Vâng, đây là máy tính mới của tôi." },
          { speaker: "王一雪", hanzi: "真好看！", pinyin: "Zhēn hǎokàn!", vietnamese: "Đẹp thật!" },
          { speaker: "杨同乐", hanzi: "我也很喜欢它。", pinyin: "Wǒ yě hěn xǐhuan tā.", vietnamese: "Tôi cũng rất thích nó." }
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
        context: "在校园里，李文向白家月要手机号。(Trong khuôn viên trường, Lý Văn hỏi xin số điện thoại của Bạch Gia Nguyệt.)",
        lines: [
          { speaker: "李文", hanzi: "家月，你的手机号是多少？", pinyin: "Jiāyuè, nǐ de shǒujīhào shì duōshao?", vietnamese: "Gia Nguyệt, số điện thoại của bạn là bao nhiêu?" },
          { speaker: "白家月", hanzi: "我的手机号是+33 601493190。", pinyin: "Wǒ de shǒujīhào shì +33 601493190.", vietnamese: "Số điện thoại của tôi là +33 601493190." },
          { speaker: "李文", hanzi: "我的手机号是+86 13552721160。", pinyin: "Wǒ de shǒujīhào shì +86 13552721160.", vietnamese: "Số điện thoại của tôi là +86 13552721160." },
          { speaker: "白家月", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Được rồi." }
        ]
      },
      {
        id: "hsk1-l6-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
        lines: [
          { speaker: "陈天中", hanzi: "家月，明天你去哪儿？", pinyin: "Jiāyuè, míngtiān nǐ qù nǎr?", vietnamese: "Gia Nguyệt, ngày mai bạn đi đâu?" },
          { speaker: "白家月", hanzi: "我想去超市买东西。", pinyin: "Wǒ xiǎng qù chāoshì mǎi dōngxi.", vietnamese: "Tôi muốn đi siêu thị mua đồ." },
          { speaker: "陈天中", hanzi: "你去超市买什么？", pinyin: "Nǐ qù chāoshì mǎi shénme?", vietnamese: "Bạn đi siêu thị mua gì vậy?" },
          { speaker: "白家月", hanzi: "我想买些牛奶。", pinyin: "Wǒ xiǎng mǎi xiē niúnǎi.", vietnamese: "Tôi muốn mua sữa." }
        ]
      },
      {
        id: "hsk1-l6-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在家里，王一雪全家在讨论周末晚餐安排。(Ở nhà, cả gia đình Vương Nhất Tuyết bàn về kế hoạch ăn tối cuối tuần.)",
        lines: [
          { speaker: "王一雪", hanzi: "星期天我们去哪儿吃晚饭？", pinyin: "Xīngqītiān wǒmen qù nǎr chī wǎnfàn?", vietnamese: "Chủ nhật chúng ta đi đâu ăn tối?" },
          { speaker: "刘明", hanzi: "我还想去西安饭店。", pinyin: "Wǒ hái xiǎng qù Xī'ān fàndiàn.", vietnamese: "Anh vẫn muốn đến nhà hàng Tây An." },
          { speaker: "刘小雪", hanzi: "那边的包子非常好吃，我想吃包子。", pinyin: "Nà biān de bāozi fēicháng hǎochī, wǒ xiǎng chī bāozi.", vietnamese: "Bánh bao ở đó ngon lắm, con muốn ăn bánh bao." },
          { speaker: "刘小明", hanzi: "妈妈，我想吃米饭，不想吃包子。", pinyin: "Māma, wǒ xiǎng chī mǐfàn, bù xiǎng chī bāozi.", vietnamese: "Mẹ ơi, con muốn ăn cơm, không muốn ăn bánh bao." },
          { speaker: "王一雪", hanzi: "好的。我们怎么去？", pinyin: "Hǎo de. Wǒmen zěnme qù?", vietnamese: "Được rồi. Chúng ta đi thế nào?" },
          { speaker: "刘明", hanzi: "坐出租车去。", pinyin: "Zuò chūzūchē qù.", vietnamese: "Đi taxi đi." }
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
        context: "白家月和安妮在打电话。(Bạch Gia Nguyệt và An Ni đang gọi điện thoại cho nhau.)",
        lines: [
          { speaker: "白家月", hanzi: "现在几点？", pinyin: "Xiànzài jǐ diǎn?", vietnamese: "Bây giờ là mấy giờ?" },
          { speaker: "安妮", hanzi: "早上八点四十。", pinyin: "Zǎoshang bā diǎn sìshí.", vietnamese: "Sáng tám giờ bốn mươi phút." },
          { speaker: "白家月", hanzi: "我上午十点十分有课。", pinyin: "Wǒ shàngwǔ shí diǎn shí fēn yǒu kè.", vietnamese: "Tôi có lớp học lúc mười giờ mười phút sáng." },
          { speaker: "安妮", hanzi: "好的，我们下午两点见吧。", pinyin: "Hǎo de, wǒmen xiàwǔ liǎng diǎn jiàn ba.", vietnamese: "Được rồi, chúng ta gặp nhau lúc hai giờ chiều nhé." }
        ]
      },
      {
        id: "hsk1-l7-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在校园里，李文遇到白家月。(Trong khuôn viên trường, Lý Văn tình cờ gặp Bạch Gia Nguyệt.)",
        lines: [
          { speaker: "李文", hanzi: "下午我想去电影院看电影，你去吗？", pinyin: "Xiàwǔ wǒ xiǎng qù diànyǐngyuàn kàn diànyǐng, nǐ qù ma?", vietnamese: "Chiều nay tôi muốn đi rạp xem phim, bạn có đi không?" },
          { speaker: "白家月", hanzi: "我不想去，下午还有事。", pinyin: "Wǒ bù xiǎng qù, xiàwǔ hái yǒu shì.", vietnamese: "Tôi không muốn đi, chiều còn có việc." },
          { speaker: "李文", hanzi: "好的。明天呢？", pinyin: "Hǎo de. Míngtiān ne?", vietnamese: "Được rồi. Còn ngày mai thì sao?" },
          { speaker: "白家月", hanzi: "我明天下午两点还上课呢，四点半下课。", pinyin: "Wǒ míngtiān xiàwǔ liǎng diǎn hái shàngkè ne, sì diǎn bàn xiàkè.", vietnamese: "Ngày mai chiều hai giờ tôi vẫn còn học, bốn rưỡi mới tan học." }
        ]
      }
    ,
      {
        id: "hsk1-l7-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "王一雪给丈夫刘明打电话。(Vương Nhất Tuyết gọi điện cho chồng là Lưu Minh.)",
        lines: [
          { speaker: "王一雪", hanzi: "喂，你在哪儿呢？", pinyin: "Wèi, nǐ zài nǎr ne?", vietnamese: "A-lô, anh đang ở đâu vậy?" },
          { speaker: "刘明", hanzi: "我在家里呢。", pinyin: "Wǒ zài jiā li ne.", vietnamese: "Anh đang ở nhà." },
          { speaker: "王一雪", hanzi: "我晚上六点半下班。", pinyin: "Wǒ wǎnshang liù diǎn bàn xiàbān.", vietnamese: "Em tan ca lúc sáu rưỡi tối." },
          { speaker: "刘明", hanzi: "我八点去医院上班。", pinyin: "Wǒ bā diǎn qù yīyuàn shàngbān.", vietnamese: "Anh đi làm ở bệnh viện lúc tám giờ." },
          { speaker: "王一雪", hanzi: "好的，你去店里买些菜吧。", pinyin: "Hǎo de, nǐ qù diàn lǐ mǎi xiē cài ba.", vietnamese: "Được rồi, anh ra cửa hàng mua ít rau nhé." },
          { speaker: "刘明", hanzi: "好，我十分钟后去。", pinyin: "Hǎo, wǒ shí fēnzhōng hòu qù.", vietnamese: "Được, mười phút nữa anh đi." }
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
        context: "在王一飞家，白家月和陈天中来做客。(Ở nhà Vương Nhất Phi, Bạch Gia Nguyệt và Trần Thiên Trung đến thăm.)",
        lines: [
          { speaker: "白家月", hanzi: "房间外有一只小猫。", pinyin: "Fángjiān wài yǒu yī zhī xiǎo māo.", vietnamese: "Ngoài phòng có một con mèo nhỏ." },
          { speaker: "陈天中", hanzi: "我没看见，它在哪儿呢？", pinyin: "Wǒ méi kànjiàn, tā zài nǎr ne?", vietnamese: "Tôi không thấy, nó đang ở đâu vậy?" },
          { speaker: "白家月", hanzi: "它在桌子下呢。", pinyin: "Tā zài zhuōzi xià ne.", vietnamese: "Nó đang ở dưới bàn." },
          { speaker: "陈天中", hanzi: "这只小猫真漂亮！", pinyin: "Zhè zhī xiǎo māo zhēn piàoliang!", vietnamese: "Con mèo nhỏ này đẹp quá!" }
        ]
      },
      {
        id: "hsk1-l8-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在教室里，下课后，白家月给李文打电话。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt gọi điện cho Lý Văn.)",
        lines: [
          { speaker: "白家月", hanzi: "我们在哪儿见呢？", pinyin: "Wǒmen zài nǎr jiàn ne?", vietnamese: "Chúng ta gặp nhau ở đâu nhỉ?" },
          { speaker: "李文", hanzi: "在学校书店前见吧。", pinyin: "Zài xuéxiào shūdiàn qián jiàn ba.", vietnamese: "Gặp nhau trước nhà sách trường nhé." },
          { speaker: "白家月", hanzi: "好的。下午两点你能到吗？", pinyin: "Hǎo de. Xiàwǔ liǎng diǎn nǐ néng dào ma?", vietnamese: "Được. Hai giờ chiều bạn đến được không?" },
          { speaker: "李文", hanzi: "我能到。我在学校吃午饭。", pinyin: "Wǒ néng dào. Wǒ zài xuéxiào chī wǔfàn.", vietnamese: "Tôi đến được. Tôi ăn trưa ở trường." }
        ]
      }
    ,
      {
        id: "hsk1-l8-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在医院里，刘明和同事小胡聊天儿。(Ở bệnh viện, Lưu Minh trò chuyện với đồng nghiệp là tiểu Hồ.)",
        lines: [
          { speaker: "刘明", hanzi: "小胡，还没吃饭呢？", pinyin: "Xiǎo Hú, hái méi chīfàn ne?", vietnamese: "Tiểu Hồ, chưa ăn cơm à?" },
          { speaker: "小胡", hanzi: "没吃呢。", pinyin: "Méi chī ne.", vietnamese: "Chưa ăn." },
          { speaker: "刘明", hanzi: "大医院病人多，医生非常忙。", pinyin: "Dà yīyuàn bìngrén duō, yīshēng fēicháng máng.", vietnamese: "Bệnh viện lớn bệnh nhân nhiều, bác sĩ rất bận." },
          { speaker: "小胡", hanzi: "是的。我爸爸也在医院工作，他也非常忙。", pinyin: "Shì de. Wǒ bàba yě zài yīyuàn gōngzuò, tā yě fēicháng máng.", vietnamese: "Đúng vậy. Bố tôi cũng làm ở bệnh viện, ông ấy cũng rất bận." },
          { speaker: "刘明", hanzi: "你家有两个医生？", pinyin: "Nǐ jiā yǒu liǎng gè yīshēng?", vietnamese: "Nhà bạn có hai bác sĩ à?" },
          { speaker: "小胡", hanzi: "对。", pinyin: "Duì.", vietnamese: "Đúng vậy." }
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
        context: "在校园里，李文和白家月在聊天儿。(Trong khuôn viên trường, Lý Văn và Bạch Gia Nguyệt đang trò chuyện.)",
        lines: [
          { speaker: "李文", hanzi: "学校前边有一家电影院。", pinyin: "Xuéxiào qiánbian yǒu yī jiā diànyǐngyuàn.", vietnamese: "Phía trước trường có một rạp chiếu phim." },
          { speaker: "白家月", hanzi: "对。我们晚上去那个电影院看电影吧。", pinyin: "Duì. Wǒmen wǎnshang qù nàge diànyǐngyuàn kàn diànyǐng ba.", vietnamese: "Đúng rồi. Tối nay chúng ta đến rạp đó xem phim nhé." },
          { speaker: "李文", hanzi: "好！我们七点在电影院外边见，好吗？", pinyin: "Hǎo! Wǒmen qī diǎn zài diànyǐngyuàn wàibian jiàn, hǎo ma?", vietnamese: "Tốt! Bảy giờ chúng ta gặp nhau bên ngoài rạp, được không?" },
          { speaker: "白家月", hanzi: "好的，晚上七点见！", pinyin: "Hǎo de, wǎnshang qī diǎn jiàn!", vietnamese: "Được rồi, tối bảy giờ gặp nhau!" }
        ]
      },
      {
        id: "hsk1-l9-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
        lines: [
          { speaker: "陈天中", hanzi: "椅子上有一本中文书，那是谁的书？", pinyin: "Yǐzi shang yǒu yī běn Zhōngwén shū, nà shì shéi de shū?", vietnamese: "Trên ghế có một quyển sách tiếng Trung, đó là sách của ai?" },
          { speaker: "白家月", hanzi: "是我的书，谢谢。这是我的第二本中文书。", pinyin: "Shì wǒ de shū, xièxie. Zhè shì wǒ de dì-èr běn Zhōngwén shū.", vietnamese: "Là sách của tôi, cảm ơn. Đây là quyển sách tiếng Trung thứ hai của tôi." },
          { speaker: "陈天中", hanzi: "不客气。你明天上午在哪儿？", pinyin: "Bù kèqi. Nǐ míngtiān shàngwǔ zài nǎr?", vietnamese: "Không có gì. Sáng mai bạn ở đâu?" },
          { speaker: "白家月", hanzi: "我明天上午在学校学习。", pinyin: "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí.", vietnamese: "Sáng mai tôi ở trường học bài." }
        ]
      }
    ,
      {
        id: "hsk1-l9-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在公司里，王一雪和杨同乐休息时聊天儿，谈论周末生活。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao về cuộc sống cuối tuần.)",
        lines: [
          { speaker: "王一雪", hanzi: "明天星期六，你做什么？", pinyin: "Míngtiān Xīngqīliù, nǐ zuò shénme?", vietnamese: "Ngày mai thứ Bảy, bạn làm gì?" },
          { speaker: "杨同乐", hanzi: "我白天在家里读书，晚上和朋友们去外边唱歌。", pinyin: "Wǒ báitiān zài jiā lǐ dúshū, wǎnshang hé péngyoumen qù wàibian chàng gē.", vietnamese: "Tôi ban ngày ở nhà đọc sách, tối đi hát với bạn bè." },
          { speaker: "王一雪", hanzi: "你唱歌很好听。", pinyin: "Nǐ chànggē hěn hǎotīng.", vietnamese: "Bạn hát rất hay." },
          { speaker: "杨同乐", hanzi: "谢谢！您星期六做什么？", pinyin: "Xièxie! Nín Xīngqīliù zuò shénme?", vietnamese: "Cảm ơn! Thứ Bảy chị làm gì?" },
          { speaker: "王一雪", hanzi: "我在家里做饭，看电视，和孩子们、小狗玩。", pinyin: "Wǒ zài jiā lǐ zuòfàn, kàn diànshì, hé háizimen, xiǎo gǒu wán.", vietnamese: "Tôi ở nhà nấu ăn, xem TV, chơi với các con và cún nhỏ." },
          { speaker: "杨同乐", hanzi: "我也有一只小狗。", pinyin: "Wǒ yě yǒu yī zhī xiǎo gǒu.", vietnamese: "Tôi cũng có một con cún nhỏ." }
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
        context: "在小店里，王一雪在买杯子。(Ở cửa hàng nhỏ, Vương Nhất Tuyết đang mua cốc.)",
        lines: [
          { speaker: "王一雪", hanzi: "请问，有杯子吗？", pinyin: "Qǐngwèn, yǒu bēizi ma?", vietnamese: "Cho hỏi, có cốc không ạ?" },
          { speaker: "店员", hanzi: "有，杯子在这边。", pinyin: "Yǒu, bēizi zài zhèbian.", vietnamese: "Có ạ, cốc ở phía này." },
          { speaker: "王一雪", hanzi: "多少钱一个？", pinyin: "Duōshao qián yī gè?", vietnamese: "Mỗi cái bao nhiêu tiền?" },
          { speaker: "店员", hanzi: "这些五块钱一个，那些十块钱一个。", pinyin: "Zhèxiē wǔ kuài qián yī gè, nàxiē shí kuài qián yī gè.", vietnamese: "Những cái này năm tệ một cái, những cái kia mười tệ một cái." },
          { speaker: "王一雪", hanzi: "我买这个吧。", pinyin: "Wǒ mǎi zhège ba.", vietnamese: "Tôi mua cái này nhé." }
        ]
      }
    ,
      {
        id: "hsk1-l10-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在集市上，王一雪在买水果。(Ở chợ, Vương Nhất Tuyết đang mua hoa quả.)",
        lines: [
          { speaker: "王一雪", hanzi: "这儿的水果真不少！", pinyin: "Zhèr de shuǐguǒ zhēn bù shǎo!", vietnamese: "Hoa quả ở đây thật là nhiều!" },
          { speaker: "摊主", hanzi: "您想买什么？", pinyin: "Nín xiǎng mǎi shénme?", vietnamese: "Bà muốn mua gì ạ?" },
          { speaker: "王一雪", hanzi: "我想买两斤苹果。", pinyin: "Wǒ xiǎng mǎi liǎng jīn píngguǒ.", vietnamese: "Tôi muốn mua hai cân táo." },
          { speaker: "摊主", hanzi: "苹果三块五一斤。这些七块二，七块钱吧。", pinyin: "Píngguǒ sān kuài wǔ yī jīn. Zhèxiē qī kuài èr, qī kuài qián ba.", vietnamese: "Táo ba phẩy năm tệ một cân. Những quả này bảy phẩy hai tệ, bảy tệ thôi nhé." },
          { speaker: "王一雪", hanzi: "好的，这儿的苹果真便宜！", pinyin: "Hǎo de, zhèr de píngguǒ zhēn piányí!", vietnamese: "Được rồi, táo ở đây thật rẻ!" }
        ]
      },
      {
        id: "hsk1-l10-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在商场里，刘明和王一雪在给孩子们买衣服。(Ở trung tâm thương mại, Lưu Minh và Vương Nhất Tuyết đang mua quần áo cho các con.)",
        lines: [
          { speaker: "王一雪", hanzi: "这家商店衣服真多！这件一百元，怎么样？", pinyin: "Zhè jiā shāngdiàn yīfu zhēn duō! Zhè jiàn yī bǎi yuán, zěnmeyàng?", vietnamese: "Cửa hàng này quần áo thật nhiều! Cái này một trăm tệ, thế nào?" },
          { speaker: "刘明", hanzi: "好看，也不贵。", pinyin: "Hǎokàn, yě bù guì.", vietnamese: "Đẹp, cũng không đắt." },
          { speaker: "王一雪", hanzi: "小雪能穿，买一件吧。", pinyin: "Xiǎo Xuě néng chuān, mǎi yī jiàn ba.", vietnamese: "Tiểu Tuyết mặc được, mua một cái nhé." },
          { speaker: "刘明", hanzi: "好的。小明能穿吗？", pinyin: "Hǎo de. Xiǎo Míng néng chuān ma?", vietnamese: "Được. Tiểu Minh mặc được không?" },
          { speaker: "王一雪", hanzi: "不能。这些是女孩子穿的衣服，男孩子的衣服在那儿。", pinyin: "Bù néng. Zhèxiē shì nǚ háizi chuān de yīfu, nán háizi de yīfu zài nàr.", vietnamese: "Không được. Những cái này là quần áo con gái, quần áo con trai ở kia." },
          { speaker: "刘明", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Được rồi." }
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
        context: "在路上，李文正在找饭店，王一飞给他打电话。(Trên đường, Lý Văn đang tìm nhà hàng, Vương Nhất Phi gọi điện cho anh.)",
        lines: [
          { speaker: "王一飞", hanzi: "喂，李文，你什么时候能到饭店？", pinyin: "Wèi, Lǐ Wén, nǐ shénme shíhou néng dào fàndiàn?", vietnamese: "A-lô, Lý Văn, bao giờ bạn đến nhà hàng được?" },
          { speaker: "李文", hanzi: "还不知道，正在找呢。它是不是在超市后边？", pinyin: "Hái bù zhīdào, zhèngzài zhǎo ne. Tā shì bu shì zài chāoshì hòubian?", vietnamese: "Chưa biết, đang tìm. Nó có phải ở phía sau siêu thị không?" },
          { speaker: "王一飞", hanzi: "是的。你开车没开车？", pinyin: "Shì de. Nǐ kāichē méi kāichē?", vietnamese: "Đúng rồi. Bạn có lái xe không?" },
          { speaker: "李文", hanzi: "我没开车，坐车呢。", pinyin: "Wǒ méi kāichē, zuò chē ne.", vietnamese: "Tôi không lái xe, đang đi xe buýt." }
        ]
      },
      {
        id: "hsk1-l11-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在饭店里，王一飞和李文见面后聊天儿。(Ở nhà hàng, Vương Nhất Phi và Lý Văn gặp nhau và trò chuyện.)",
        lines: [
          { speaker: "王一飞", hanzi: "你还在上大学吗？", pinyin: "Nǐ hái zài shàng dàxué ma?", vietnamese: "Bạn có vẫn đang học đại học không?" },
          { speaker: "李文", hanzi: "对，我上大学呢，还是大学生。", pinyin: "Duì, wǒ shàng dàxué ne, hái shì dàxuéshēng.", vietnamese: "Đúng vậy, tôi đang học đại học, vẫn còn là sinh viên." },
          { speaker: "王一飞", hanzi: "你们学习忙不忙？", pinyin: "Nǐmen xuéxí máng bu máng?", vietnamese: "Các bạn có bận học không?" },
          { speaker: "李文", hanzi: "非常忙，我学语言，我们的课很多。", pinyin: "Fēicháng máng, wǒ xué yǔyán, wǒmen de kè hěn duō.", vietnamese: "Rất bận, tôi học ngôn ngữ, chúng tôi có rất nhiều tiết học." }
        ]
      }
    ,
      {
        id: "hsk1-l11-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "星期六早上，刘明要去医院加班，出门前和女儿聊天儿。(Sáng thứ Bảy, Lưu Minh sắp đi làm thêm giờ ở bệnh viện, trước khi ra ngoài trò chuyện với con gái.)",
        lines: [
          { speaker: "刘明", hanzi: "弟弟起床没起床呢？", pinyin: "Dìdi qǐchuáng méi qǐchuáng ne?", vietnamese: "Em trai dậy chưa?" },
          { speaker: "刘小雪", hanzi: "没起床呢，还在睡觉。", pinyin: "Méi qǐchuáng ne, hái zài shuìjiào.", vietnamese: "Chưa dậy, vẫn còn ngủ." },
          { speaker: "刘明", hanzi: "还睡呢？他今天去不去哪里？", pinyin: "Hái shuì ne? Tā jīntiān qù bu qù nǎlǐ?", vietnamese: "Còn ngủ à? Hôm nay nó có đi đâu không?" },
          { speaker: "刘小雪", hanzi: "去哪里？", pinyin: "Qù nǎlǐ?", vietnamese: "Đi đâu ấy?" },
          { speaker: "刘明", hanzi: "去超市。", pinyin: "Qù chāoshì.", vietnamese: "Đi siêu thị." },
          { speaker: "刘小雪", hanzi: "我昨天晚问他，他对我说，他不去，他今天要和小朋友玩。", pinyin: "Wǒ zuótiān wǎn wèn tā, tā duì wǒ shuō, tā bù qù, tā jīntiān yào hé xiǎopéngyou wán.", vietnamese: "Tối qua tôi có hỏi nó, nó nói với tôi rằng nó không đi, hôm nay nó muốn chơi với bạn nhỏ." }
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
        context: "王一雪给王一飞打电话，问那边的情况。(Vương Nhất Tuyết gọi điện cho Vương Nhất Phi, hỏi về tình hình bên đó.)",
        lines: [
          { speaker: "王一雪", hanzi: "今天天气怎么样？", pinyin: "Jīntiān tiānqì zěnmeyàng?", vietnamese: "Hôm nay thời tiết thế nào?" },
          { speaker: "王一飞", hanzi: "这里的天不太好，下雨了。", pinyin: "Zhèlǐ de tiān bù tài hǎo, xià yǔ le.", vietnamese: "Thời tiết ở đây không tốt lắm, trời mưa rồi." },
          { speaker: "王一雪", hanzi: "雨大吗？", pinyin: "Yǔ dà ma?", vietnamese: "Mưa to không?" },
          { speaker: "王一飞", hanzi: "有点儿大，我觉得很冷。", pinyin: "Yǒudiǎnr dà, wǒ juéde hěn lěng.", vietnamese: "Hơi to, tôi thấy rất lạnh." }
        ]
      },
      {
        id: "hsk1-l12-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在公司电梯里，王一雪和杨同乐在聊天儿。(Trong thang máy công ty, Vương Nhất Tuyết và Dương Đồng Nhạc đang trò chuyện.)",
        lines: [
          { speaker: "王一雪", hanzi: "昨天下雪了。", pinyin: "Zuótiān xià xuě le.", vietnamese: "Hôm qua có tuyết rơi." },
          { speaker: "杨同乐", hanzi: "是的，太冷了。", pinyin: "Shì de, tài lěng le.", vietnamese: "Đúng vậy, lạnh quá." },
          { speaker: "王一雪", hanzi: "你昨天没来公司，生病了？", pinyin: "Nǐ zuótiān méi lái gōngsī, shēngbìng le?", vietnamese: "Hôm qua bạn không đến công ty, bị ốm à?" },
          { speaker: "杨同乐", hanzi: "对，我昨天去医院看病了。", pinyin: "Duì, wǒ zuótiān qù yīyuàn kànbìng le.", vietnamese: "Đúng vậy, hôm qua tôi đi bệnh viện khám bệnh." }
        ]
      }
    ,
      {
        id: "hsk1-l12-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "昨天在医院里，医生给杨同乐看病。(Hôm qua ở bệnh viện, bác sĩ khám bệnh cho Dương Đồng Nhạc.)",
        lines: [
          { speaker: "杨同乐", hanzi: "医生，我病了。", pinyin: "Yīshēng, wǒ bìng le.", vietnamese: "Bác sĩ ơi, tôi bị ốm rồi." },
          { speaker: "医生", hanzi: "我看看。你觉得怎么样？", pinyin: "Wǒ kànkan. Nǐ juéde zěnmeyàng?", vietnamese: "Để tôi xem. Bạn cảm thấy thế nào?" },
          { speaker: "杨同乐", hanzi: "我很冷。", pinyin: "Wǒ hěn lěng.", vietnamese: "Tôi rất lạnh." },
          { speaker: "医生", hanzi: "好的，吃一点儿药，今天休息半天吧。", pinyin: "Hǎo de, chī yīdiǎnr yào, jīntiān xiūxi bàn tiān ba.", vietnamese: "Được rồi, uống một ít thuốc, hôm nay nghỉ nửa ngày nhé." },
          { speaker: "杨同乐", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Được rồi." },
          { speaker: "医生", hanzi: "回家后再喝些热水。", pinyin: "Huí jiā hòu zài hē xiē rè shuǐ.", vietnamese: "Về nhà nhớ uống thêm nước ấm nhé." }
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
        context: "在教室里，下课后，白家月向王老师问问题。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt hỏi thầy Vương một câu hỏi.)",
        lines: [
          { speaker: "白家月", hanzi: "王老师，我可以再问您一个问题吗？", pinyin: "Wáng lǎoshī, wǒ kěyǐ zài wèn nín yī gè wèntí ma?", vietnamese: "Thầy Vương ơi, em có thể hỏi thầy thêm một câu không?" },
          { speaker: "王一飞", hanzi: "可以。你有什么问题？", pinyin: "Kěyǐ. Nǐ yǒu shénme wèntí?", vietnamese: "Được. Em có câu hỏi gì?" },
          { speaker: "白家月", hanzi: "那个小店买不买手机？", pinyin: "Nàge xiǎo diàn mǎi bu mǎi shǒujī?", vietnamese: "Cái cửa hàng nhỏ đó có bán điện thoại không ạ?" },
          { speaker: "王一飞", hanzi: "我不知道。你可以打电话问一下。", pinyin: "Wǒ bù zhīdào. Nǐ kěyǐ dǎ diànhuà wèn yīxià.", vietnamese: "Thầy không biết. Em có thể gọi điện hỏi xem." }
        ]
      }
    ,
      {
        id: "hsk1-l13-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在咖啡馆里，王一雪想吃早饭。(Ở quán cà phê, Vương Nhất Tuyết muốn ăn sáng.)",
        lines: [
          { speaker: "服务员", hanzi: "女士，请坐！您喝什么？", pinyin: "Nǚshì, qǐng zuò! Nín hē shénme?", vietnamese: "Thưa cô, mời ngồi! Cô muốn uống gì?" },
          { speaker: "王一雪", hanzi: "我看一下。请给我一杯牛奶。", pinyin: "Wǒ kàn yīxià. Qǐng gěi wǒ yī bēi niúnǎi.", vietnamese: "Để tôi xem đã. Làm ơn cho tôi một ly sữa." },
          { speaker: "服务员", hanzi: "好的。您还要什么？", pinyin: "Hǎo de. Nín hái yào shénme?", vietnamese: "Được ạ. Cô còn muốn gì nữa không?" },
          { speaker: "王一雪", hanzi: "我还没吃早饭，再要这个面包和鸡蛋吧。", pinyin: "Wǒ hái méi chī zǎofàn, zài yào zhège miànbāo hé jīdàn ba.", vietnamese: "Tôi chưa ăn sáng, cho thêm bánh mì và trứng này nhé." }
        ]
      },
      {
        id: "hsk1-l13-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在餐厅里，刘明在点餐。(Ở nhà hàng, Lưu Minh đang gọi đồ ăn.)",
        lines: [
          { speaker: "服务员", hanzi: "先生，请坐！您要什么？", pinyin: "Xiānsheng, qǐng zuò! Nín yào shénme?", vietnamese: "Thưa anh, mời ngồi! Anh muốn gì ạ?" },
          { speaker: "刘明", hanzi: "我要一斤饺子。", pinyin: "Wǒ yào yī jīn jiǎozi.", vietnamese: "Cho tôi một cân sủi cảo." },
          { speaker: "服务员", hanzi: "好的。一斤饺子40个。", pinyin: "Hǎo de. Yī jīn jiǎozi sìshí gè.", vietnamese: "Vâng. Một cân sủi cảo là 40 cái." },
          { speaker: "刘明", hanzi: "40个太多了，我要一半吧。", pinyin: "Sìshí gè tài duō le, wǒ yào yībàn ba.", vietnamese: "40 cái nhiều quá, cho tôi một nửa thôi." },
          { speaker: "服务员", hanzi: "半斤20个。您想喝什么？", pinyin: "Bàn jīn èrshí gè. Nín xiǎng hē shénme?", vietnamese: "Nửa cân 20 cái. Anh muốn uống gì?" },
          { speaker: "刘明", hanzi: "请给我一杯茶吧。", pinyin: "Qǐng gěi wǒ yī bēi chá ba.", vietnamese: "Làm ơn cho tôi một chén trà nhé." }
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
        context: "在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang nói về chuyến dã ngoại vừa rồi.)",
        lines: [
          { speaker: "白家月", hanzi: "你们上火车后看见王老师了吗？", pinyin: "Nǐmen shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?", vietnamese: "Các bạn sau khi lên tàu có thấy thầy Vương không?" },
          { speaker: "陈天中", hanzi: "没看见。中午车开后，有些人在看书，有些人睡觉了。", pinyin: "Méi kànjiàn. Zhōngwǔ chē kāi hòu, yǒuxiē rén zài kàn shū, yǒuxiē rén shuìjiào le.", vietnamese: "Không thấy. Trưa tàu chạy rồi, có người đang đọc sách, có người ngủ." },
          { speaker: "白家月", hanzi: "你呢？", pinyin: "Nǐ ne?", vietnamese: "Còn bạn thì sao?" },
          { speaker: "陈天中", hanzi: "我看了一个电影。", pinyin: "Wǒ kànle yī gè diànyǐng.", vietnamese: "Tôi đã xem một bộ phim." }
        ]
      },
      {
        id: "hsk1-l14-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在课堂上，王一飞在询问学生们的学习情况。(Trong lớp học, Vương Nhất Phi đang hỏi về tình hình học tập của học sinh.)",
        lines: [
          { speaker: "王一飞", hanzi: "你们会说汉语了，也会写汉字了吗？", pinyin: "Nǐmen huì shuō Hànyǔ le, yě huì xiě Hànzì le ma?", vietnamese: "Các em bây giờ đã biết nói tiếng Trung, vậy đã biết viết chữ Hán chưa?" },
          { speaker: "白家月", hanzi: "我们都会写了。", pinyin: "Wǒmen dōu huì xiě le.", vietnamese: "Chúng em đều đã biết viết rồi ạ." },
          { speaker: "陈天中", hanzi: "老师，我听不见。", pinyin: "Lǎoshī, wǒ tīng bu jiàn.", vietnamese: "Thưa thầy, em không nghe thấy ạ." },
          { speaker: "王一飞", hanzi: "请大家不要说话！请听老师的问题：你们都会写哪些汉字了？", pinyin: "Qǐng dàjiā bùyào shuōhuà! Qǐng tīng lǎoshī de wèntí: Nǐmen dōu huì xiě nǎxiē Hànzì le?", vietnamese: "Mọi người không được nói chuyện! Hãy nghe câu hỏi của thầy: Các em đã biết viết những chữ Hán nào rồi?" },
          { speaker: "陈天中", hanzi: "我会写这些字了，您看！", pinyin: "Wǒ huì xiě zhèxiē zì le, nín kàn!", vietnamese: "Em đã biết viết những chữ này rồi, thầy xem này!" }
        ]
      }
    ,
      {
        id: "hsk1-l14-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在家里，刘明和王一雪在谈论孩子的升学情况。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang nói về việc con cái lên cấp học mới.)",
        lines: [
          { speaker: "刘明", hanzi: "明年女儿上中学。", pinyin: "Míngnián nǚ'ér shàng zhōngxué.", vietnamese: "Năm sau con gái lên trung học." },
          { speaker: "王一雪", hanzi: "对。儿子也上小学了。", pinyin: "Duì. Érzi yě shàng xiǎoxué le.", vietnamese: "Đúng rồi. Con trai cũng vào tiểu học rồi." },
          { speaker: "刘明", hanzi: "我们家有了一个中学生。", pinyin: "Wǒmen jiā yǒule yī gè zhōngxuéshēng.", vietnamese: "Nhà mình có một học sinh trung học rồi." },
          { speaker: "王一雪", hanzi: "还有了一个小学生。", pinyin: "Hái yǒule yī gè xiǎoxuéshēng.", vietnamese: "Còn thêm một học sinh tiểu học nữa." },
          { speaker: "刘明", hanzi: "上学后，他们都忙了。", pinyin: "Shàngxué hòu, tāmen dōu máng le.", vietnamese: "Sau khi đi học, chúng đều bận rồi." },
          { speaker: "王一雪", hanzi: "是的。太晚了，睡觉吧。", pinyin: "Shì de. Tài wǎn le, shuìjiào ba.", vietnamese: "Đúng vậy. Muộn rồi, đi ngủ thôi." }
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
        context: "在李文家，李文邀请陈天中、白家月等朋友品尝中餐。(Ở nhà Lý Văn, Lý Văn mời Trần Thiên Trung, Bạch Gia Nguyệt và các bạn thưởng thức ẩm thực Trung Quốc.)",
        lines: [
          { speaker: "李文", hanzi: "你们爱吃哪个菜？", pinyin: "Nǐmen ài chī nǎge cài?", vietnamese: "Các bạn thích ăn món nào?" },
          { speaker: "白家月", hanzi: "我喜欢这个，也喜欢那个。", pinyin: "Wǒ xǐhuan zhège, yě xǐhuan nàge.", vietnamese: "Tôi thích cái này, cũng thích cái kia." },
          { speaker: "陈天中", hanzi: "这些菜都好吃，还很好看。", pinyin: "Zhèxiē cài dōu hǎochī, hái hěn hǎokàn.", vietnamese: "Những món này đều ngon, lại còn rất đẹp mắt." },
          { speaker: "李文", hanzi: "我爱吃中国菜，也喜欢做。大家多吃点儿。", pinyin: "Wǒ ài chī Zhōngguó cài, yě xǐhuan zuò. Dàjiā duō chī diǎnr.", vietnamese: "Tôi thích ăn món Trung Quốc, cũng thích nấu. Mọi người ăn nhiều vào nhé." }
        ]
      },
      {
        id: "hsk1-l15-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在李文家，大家边吃饭边谈论假期计划。(Ở nhà Lý Văn, mọi người vừa ăn vừa bàn về kế hoạch nghỉ lễ.)",
        lines: [
          { speaker: "李文", hanzi: "你们都想去哪儿？", pinyin: "Nǐmen dōu xiǎng qù nǎr?", vietnamese: "Mọi người muốn đi đâu?" },
          { speaker: "安妮", hanzi: "去年我和男朋友去了西安，今年我想去北京。", pinyin: "Qùnián wǒ hé nánpéngyou qùle Xī'ān, jīnnián wǒ xiǎng qù Běijīng.", vietnamese: "Năm ngoái tôi và bạn trai đã đến Tây An, năm nay tôi muốn đến Bắc Kinh." },
          { speaker: "白家月", hanzi: "前几年我去了西安，非常好玩儿。今年我也想去北京。", pinyin: "Qián jǐ nián wǒ qùle Xī'ān, fēicháng hǎowánr. Jīnnián wǒ yě xiǎng qù Běijīng.", vietnamese: "Vài năm trước tôi đã đến Tây An, vui lắm. Năm nay tôi cũng muốn đến Bắc Kinh." },
          { speaker: "李文", hanzi: "我和王老师都是北京人，北京非常漂亮。", pinyin: "Wǒ hé Wáng lǎoshī dōu shì Běijīng rén, Běijīng fēicháng piàoliang.", vietnamese: "Tôi và thầy Vương đều là người Bắc Kinh, Bắc Kinh rất đẹp." }
        ]
      }
    ,
      {
        id: "hsk1-l15-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在教室外，白家月、安妮和王老师在谈论去北京旅游的事。(Ngoài lớp học, Bạch Gia Nguyệt, An Ni và thầy Vương đang nói về chuyện đi du lịch Bắc Kinh.)",
        lines: [
          { speaker: "王一飞", hanzi: "你们的飞机到北京要几个小时？", pinyin: "Nǐmen de fēijī dào Běijīng yào jǐ gè xiǎoshí?", vietnamese: "Chuyến bay của các em đến Bắc Kinh mất mấy tiếng?" },
          { speaker: "白家月", hanzi: "九个小时。", pinyin: "Jiǔ gè xiǎoshí.", vietnamese: "Chín tiếng ạ." },
          { speaker: "王一飞", hanzi: "我家人都在北京，星期天我姐姐也有时间，她可以去机场接你们，你们也可以住我家。", pinyin: "Wǒ jiārén dōu zài Běijīng, Xīngqītiān wǒ jiějie yě yǒu shíjiān, tā kěyǐ qù jīchǎng jiē nǐmen, nǐmen yě kěyǐ zhù wǒ jiā.", vietnamese: "Gia đình thầy đều ở Bắc Kinh, Chủ nhật chị gái thầy cũng có thời gian, chị ấy có thể ra sân bay đón các em, các em cũng có thể ở nhà thầy." },
          { speaker: "安妮", hanzi: "我们星期日早上八点到大兴机场，早不早？", pinyin: "Wǒmen Xīngqīrì zǎoshang bā diǎn dào Dàxīng Jīchǎng, zǎo bu zǎo?", vietnamese: "Chúng em đến sân bay Đại Hưng lúc tám giờ sáng Chủ nhật, có sớm không ạ?" },
          { speaker: "王一飞", hanzi: "不早。", pinyin: "Bù zǎo.", vietnamese: "Không sớm đâu." },
          { speaker: "白家月", hanzi: "谢谢老师！那我们和您姐姐在大兴机场见！", pinyin: "Xièxie lǎoshī! Nà wǒmen hé nín jiějie zài Dàxīng Jīchǎng jiàn!", vietnamese: "Cảm ơn thầy! Vậy chúng em sẽ gặp chị thầy ở sân bay Đại Hưng!" }
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
