// Dữ liệu Sách Bài Tập / Sổ Tay Học Và Luyện Tập New HSK 2 (新 HSK 教程 2 学练手册)
// Bản quyền CTI BOOKS & NXB Dân Trí / FLTRP

import {
  WorkbookLesson,
  MockExamQuestion,
} from './hsk1WorkbookData';

export interface HSK2WordExpansion {
  baseWords: { hanzi: string; pinyin: string; meaning: string }[];
  compounds: {
    part1: string;
    part2: string;
    combinedHanzi: string;
    pinyin: string;
    meaning: string;
  }[];
  discussion: { question: string; answer: string };
  exercises: {
    id: string;
    sentenceWithBlank: string;
    pinyinSentence: string;
    options: string[];
    correctAnswer: string;
    vietnameseTranslation: string;
  }[];
}

export interface HSK2WritingExercise {
  id: string;
  part: 1 | 2; // 1: Ghép bộ kiện, 2: Viết chữ theo pinyin
  questionNumber: number;
  promptText: string;
  pinyinGuide?: string;
  givenComponent?: string; // e.g., '扌', '讠', etc.
  targetComponents?: { key: string; radical: string }[];
  correctAnswer: string;
  explanation: string;
  sentenceContext?: string;
}

export interface HSK2WorkbookLesson extends Partial<WorkbookLesson> {
  lessonNumber: number;
  titleChinese: string;
  titlePinyin: string;
  titleVietnamese: string;
  pageNumber: string;
  wordExpansion?: HSK2WordExpansion;
  writingExercises?: any[];
  listeningExercises?: any[];
  readingExercises?: any[];
}

export const HSK2_WORKBOOK_LESSONS: HSK2WorkbookLesson[] = [
  {
    lessonNumber: 1,
    titleChinese: "她请我们吃了北京烤鸭",
    titlePinyin: "Tā qǐng wǒmen chīle Běijīng kǎoyā",
    titleVietnamese: "Chị ấy đã mời chúng em ăn vịt quay Bắc Kinh",
    pageNumber: "001",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '扌',
          pinyin: 'tíshǒupáng',
          nameVietnamese: 'Bộ Thủ / Tay gảy (提手旁)',
          meaning: 'Liên quan đến động tác của bàn tay',
          exampleChars: [
            { char: '打', pinyin: 'dǎ', meaning: 'Đánh, gọi điện' },
            { char: '接', pinyin: 'jiē', meaning: 'Đón, tiếp nhận' },
          ],
        },
        {
          radical: '冫',
          pinyin: 'liǎngdiǎnshuǐ',
          nameVietnamese: 'Bộ Băng / Hai chấm nước (两点水)',
          meaning: 'Liên quan đến nước đá, hàn lạnh',
          exampleChars: [
            { char: '冷', pinyin: 'lěng', meaning: 'Lạnh' },
            { char: '次', pinyin: 'cì', meaning: 'Lần, thứ tự' },
          ],
        },
      ],
      copyWords: [
        { word: '打电话', pinyin: 'dǎ diànhuà', vietnamese: 'Gọi điện thoại (请你给她打个电话。)' },
        { word: '接人', pinyin: 'jiē rén', vietnamese: 'Đón người (他让我去接一个人。)' },
        { word: '很冷', pinyin: 'hěn lěng', vietnamese: 'Rất lạnh (北京现在很冷吧？)' },
        { word: '这次', pinyin: 'zhè cì', vietnamese: 'Lần này (我这次是一个人来的。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '好吃', pinyin: 'hǎochī', meaning: 'Ngon (ăn)' },
        { hanzi: '喝', pinyin: 'hē', meaning: 'Uống' },
        { hanzi: '茶', pinyin: 'chá', meaning: 'Trà' },
        { hanzi: '杯子', pinyin: 'bēizi', meaning: 'Cốc, ly' },
        { hanzi: '雨', pinyin: 'yǔ', meaning: 'Mưa' },
        { hanzi: '衣服', pinyin: 'yīfu', meaning: 'Quần áo' },
      ],
      compounds: [
        { part1: '好 (tốt)', part2: '喝 (uống)', combinedHanzi: '好喝', pinyin: 'hǎohē', meaning: 'Ngon (uống ngon)' },
        { part1: '茶 (trà)', part2: '杯 (cốc)', combinedHanzi: '茶杯', pinyin: 'chábēi', meaning: 'Cốc uống trà' },
        { part1: '雨 (mưa)', part2: '衣 (áo)', combinedHanzi: '雨衣', pinyin: 'yǔyī', meaning: 'Áo mưa' },
      ],
      discussion: {
        question: '“好喝”、“茶杯” và “雨衣” có nghĩa là gì?',
        answer: 'Tạo từ mới bằng cách ghép các yếu tố ý nghĩa: 好 + 喝 = 好喝 (ngon miệng khi uống); 茶 + 杯 = 茶杯 (tách trà); 雨 + 衣 = 雨衣 (áo đi mưa).',
      },
      exercises: [
        {
          id: 'w1_e1',
          sentenceWithBlank: '他喜欢喝茶，我就给他买了个（ ）。',
          pinyinSentence: 'Tā xǐhuan hē chá, wǒ jiù gěi tā mǎile gè ( ).',
          options: ['茶杯', '雨衣', '好喝'],
          correctAnswer: '茶杯',
          vietnameseTranslation: 'Anh ấy thích uống trà, nên tôi đã mua cho anh ấy một cái tách trà.',
        },
        {
          id: 'w1_e2',
          sentenceWithBlank: '下雨了，她穿了一件（ ）。',
          pinyinSentence: 'Xià yǔ le, tā chuānle yí jiàn ( ).',
          options: ['好喝', '雨衣', '茶杯'],
          correctAnswer: '雨衣',
          vietnameseTranslation: 'Trời mưa rồi, cô ấy mặc một chiếc áo mưa.',
        },
        {
          id: 'w1_e3',
          sentenceWithBlank: '牛奶很（ ），你是在哪儿买的？',
          pinyinSentence: 'Niúnǎi hěn ( ), nǐ shì zài nǎr mǎi de?',
          options: ['好喝', '茶杯', '雨衣'],
          correctAnswer: '好喝',
          vietnameseTranslation: 'Sữa bò rất ngon, bạn mua ở đâu vậy?',
        },
      ],
    },
    listeningExercises: [
      {
        id: "h2-l01-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zuò gāotiě lái Xī’ān lǚyóu.",
        options: [
          {key: "A", textChinese: "高铁 (tàu cao tốc)", imageEmoji: "🚄"},
          {key: "B", textChinese: "出租车 (taxi)", imageEmoji: "🚕"},
          {key: "C", textChinese: "公交车 (xe buýt)", imageEmoji: "🚌"}
        ],
        correctKey: "A",
        explanation: "Nghe được tàu cao tốc (高铁) -> Tranh A.",
      },
      {
        id: "h2-l01-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā qǐng wǒmen chīle Běijīng kǎoyā.",
        options: [
          {key: "A", textChinese: "敬酒聚餐 (mời ăn cơm chúc rượu)", imageEmoji: "🥂"},
          {key: "B", textChinese: "过生日 (thổi nến sinh nhật)", imageEmoji: "🎂"},
          {key: "C", textChinese: "打扫房间 (lau dọn nhà cửa)", imageEmoji: "🧹"}
        ],
        correctKey: "A",
        explanation: "Mời ăn vịt quay Bắc Kinh chúc rượu (请我们吃了烤鸭) -> Tranh A.",
      },
      {
        id: "h2-l01-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen dàjiā yìqǐ chī dōngxi ba.",
        options: [
          {key: "A", textChinese: "骑自行车 (đạp xe)", imageEmoji: "🚴"},
          {key: "B", textChinese: "一起吃东西 (mọi người cùng ăn uống)", imageEmoji: "🍱"},
          {key: "C", textChinese: "草地上玩 (chơi đùa trên cỏ)", imageEmoji: "🏕️"}
        ],
        correctKey: "B",
        explanation: "Mọi người cùng nhau ăn uống (一起吃东西) -> Tranh B.",
      },
      {
        id: "h2-l01-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Qǐngwèn nǐmen yào diǎn shénme cài? Nǚ: Gěi wǒmen yí gè kǎoyā ba.",
        options: [
          {key: "A", textChinese: "Nhân viên phục vụ ghi món", imageEmoji: "🧑‍🍳"},
          {key: "B", textChinese: "Chụp ảnh phong cảnh", imageEmoji: "📸"},
          {key: "C", textChinese: "Bắt tay giới thiệu bạn bè", imageEmoji: "🤝"}
        ],
        correctKey: "A",
        explanation: "Nhân viên hỏi gọi món gì (点什么菜) -> Tranh A.",
      },
      {
        id: "h2-l01-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ zài nǎr ne? Nǚ: Wǒ zài Shànghǎi wàitān pāi zhàopiàn ne.",
        options: [
          {key: "A", textChinese: "Phục vụ ghi món", imageEmoji: "🧑‍🍳"},
          {key: "B", textChinese: "Chụp ảnh du lịch tại Bến Thượng Hải", imageEmoji: "📸"},
          {key: "C", textChinese: "Bắt tay", imageEmoji: "🤝"}
        ],
        correctKey: "B",
        explanation: "Chụp ảnh tại Bến Thượng Hải (拍照片) -> Tranh B.",
      },
      {
        id: "h2-l01-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒ gěi nǐ jièshào yíxià, zhè shì Wáng lǎoshī. Nǚ: Nín hǎo, Wáng lǎoshī!",
        options: [
          {key: "A", textChinese: "Ghi món", imageEmoji: "🧑‍🍳"},
          {key: "B", textChinese: "Chụp ảnh", imageEmoji: "📸"},
          {key: "C", textChinese: "Bắt tay giới thiệu làm quen thầy Vương", imageEmoji: "🤝"}
        ],
        correctKey: "C",
        explanation: "Giới thiệu làm quen bắt tay (给你介绍一下) -> Tranh C.",
      },
      {
        id: "h2-l01-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn đáp án đúng:",
        audioScript: "Nán: Wǒmen zài nǎr jiàn? Nǚ: Zài Běijīng kǎoyā fàndiàn jiàn ba. (Hỏi: 他们在哪里见？)",
        options: [
          {key: "A", textChinese: "饭店 (fàndiàn)", textVietnamese: "Nhà hàng"},
          {key: "B", textChinese: "超市 (chāoshì)", textVietnamese: "Siêu thị"},
          {key: "C", textChinese: "学校 (xuéxiào)", textVietnamese: "Trường học"}
        ],
        correctKey: "A",
        explanation: "Gặp nhau ở nhà hàng vịt quay Bắc Kinh (在饭店见) -> Đáp án A.",
      },
      {
        id: "h2-l01-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn đáp án đúng:",
        audioScript: "Nán: Nǐ bàba zài nǎr gōngzuò? Nǚ: Tā zài Shànghǎi gōngzuò. (Hỏi: 爸爸在哪里工作？)",
        options: [
          {key: "A", textChinese: "北京 (Běijīng)", textVietnamese: "Bắc Kinh"},
          {key: "B", textChinese: "上海 (Shànghǎi)", textVietnamese: "Thượng Hải"},
          {key: "C", textChinese: "西安 (Xī’ān)", textVietnamese: "Tây An"}
        ],
        correctKey: "B",
        explanation: "Bố làm việc ở Thượng Hải (在上海工作) -> Đáp án B.",
      },
      {
        id: "h2-l01-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và chọn đáp án đúng:",
        audioScript: "Nán: Nǐ jīntiān xiàwǔ yào qù zuò shénme? Nǚ: Wǒ yào qù túshūguǎn xuéxí. (Hỏi: 女的下午要做什么？)",
        options: [
          {key: "A", textChinese: "学习 (xuéxí)", textVietnamese: "Học bài"},
          {key: "B", textChinese: "下班 (xiàbān)", textVietnamese: "Tan làm"},
          {key: "C", textChinese: "买菜 (mǎi cài)", textVietnamese: "Đi chợ mua rau"}
        ],
        correctKey: "A",
        explanation: "Đến thư viện học tập (去图书馆学习) -> Đáp án A.",
      },
      {
        id: "h2-l01-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và chọn đáp án đúng:",
        audioScript: "Nán: Nǐ shénme shíhou lái Běijīng? Nǚ: Míngtiān wǒ zuò huǒchē qù. (Hỏi: 她什么时候去北京？)",
        options: [
          {key: "A", textChinese: "今天 (jīntiān)", textVietnamese: "Hôm nay"},
          {key: "B", textChinese: "明天 (míngtiān)", textVietnamese: "Ngày mai"},
          {key: "C", textChinese: "星期天 (Xīngqītiān)", textVietnamese: "Chủ nhật"}
        ],
        correctKey: "B",
        explanation: "Ngày mai đi tàu hỏa (明天我坐火车去) -> Đáp án B.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l01-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "我们是来旅游的。",
        promptPinyin: "Wǒmen shì lái lǚyóu de.",
        promptVietnamese: "Chúng tôi đến đây để du lịch.",
        options: [
          {key: "A", textChinese: "Thư pháp chữ Phúc", imageEmoji: "🧧"},
          {key: "B", textChinese: "Gia đình kéo vali đi du lịch sân bay", imageEmoji: "🧳"},
          {key: "C", textChinese: "Giới thiệu bắt tay bạn mới", imageEmoji: "🤝"},
          {key: "D", textChinese: "Chơi bóng rổ", imageEmoji: "🏀"}
        ],
        correctKey: "B",
        explanation: "Đi du lịch kéo vali (来旅游的) -> Tranh B.",
      },
      {
        id: "h2-l01-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "我给你介绍几个新朋友。",
        promptPinyin: "Wǒ gěi nǐ jièshào jǐ gè xīn péngyou.",
        promptVietnamese: "Tôi giới thiệu với bạn mấy người bạn mới.",
        options: [
          {key: "A", textChinese: "Chữ Phúc", imageEmoji: "🧧"},
          {key: "B", textChinese: "Gia đình đi du lịch", imageEmoji: "🧳"},
          {key: "C", textChinese: "Giới thiệu bạn mới bắt tay giao lưu", imageEmoji: "🤝"},
          {key: "D", textChinese: "Chơi bóng rổ", imageEmoji: "🏀"}
        ],
        correctKey: "C",
        explanation: "Giới thiệu bạn bè mới (介绍几个新朋友) -> Tranh C.",
      },
      {
        id: "h2-l01-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "天中，请你说一下这个字的意思。",
        promptPinyin: "Tiānzhōng, qǐng nǐ shuō yíxià zhège zì de yìsi.",
        promptVietnamese: "Thiên Trung, xin bạn hãy nói ý nghĩa của chữ này một chút.",
        options: [
          {key: "A", textChinese: "Dùng bút lông viết chữ Phúc thư pháp", imageEmoji: "🧧"},
          {key: "B", textChinese: "Kéo vali", imageEmoji: "🧳"},
          {key: "C", textChinese: "Bắt tay", imageEmoji: "🤝"},
          {key: "D", textChinese: "Chơi bóng rổ", imageEmoji: "🏀"}
        ],
        correctKey: "A",
        explanation: "Nói ý nghĩa của chữ Hán thư pháp (这个字的意思) -> Tranh A.",
      },
      {
        id: "h2-l01-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "我是昨天（    ）妈妈打的电话。",
        promptPinyin: "Wǒ shì zuótiān (    ) māma dǎ de diànhuà.",
        promptVietnamese: "Tôi là hôm qua gọi điện thoại cho mẹ.",
        options: [
          {key: "A", textChinese: "次 (cì)", textVietnamese: "lần, lượt"},
          {key: "B", textChinese: "懂 (dǒng)", textVietnamese: "hiểu"},
          {key: "C", textChinese: "给 (gěi)", textVietnamese: "cho, đưa cho"},
          {key: "D", textChinese: "不好意思 (bù hǎoyìsi)", textVietnamese: "ngại quá, xin lỗi"},
          {key: "E", textChinese: "完 (wán)", textVietnamese: "xong, hết"}
        ],
        correctKey: "C",
        explanation: "Cấu trúc \"给 + ai đó + 打电话\" -> Điền 给 (C).",
      },
      {
        id: "h2-l01-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这已经是我第三（    ）来西安旅游了。",
        promptPinyin: "Zhè yǐjīng shì wǒ dì-sān (    ) lái Xī’ān lǚyóu le.",
        promptVietnamese: "Đây đã là lần thứ ba tôi đến Tây An du lịch rồi.",
        options: [
          {key: "A", textChinese: "次 (cì)", textVietnamese: "lần, lượt"},
          {key: "B", textChinese: "懂 (dǒng)", textVietnamese: "hiểu"},
          {key: "C", textChinese: "给 (gěi)", textVietnamese: "cho"},
          {key: "D", textChinese: "不好意思 (bù hǎoyìsi)", textVietnamese: "ngại quá"},
          {key: "E", textChinese: "完 (wán)", textVietnamese: "xong"}
        ],
        correctKey: "A",
        explanation: "Lần thứ ba (第三次) -> Điền 次 (A).",
      },
      {
        id: "h2-l01-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "女：这几个字的意思我都不（    ）。 男：我们去找老师问一下吧。",
        promptPinyin: "Nǚ: Zhè jǐ gè zì de yìsi wǒ dōu bù (    ). Nán: Wǒmen qù zhǎo lǎoshī wèn yíxià ba.",
        promptVietnamese: "Nữ: Ý nghĩa của mấy chữ này tôi đều không hiểu. Nam: Chúng ta đi hỏi thầy giáo một chút nhé.",
        options: [
          {key: "A", textChinese: "次 (cì)", textVietnamese: "lần"},
          {key: "B", textChinese: "懂 (dǒng)", textVietnamese: "hiểu"},
          {key: "C", textChinese: "给 (gěi)", textVietnamese: "cho"},
          {key: "D", textChinese: "不好意思 (bù hǎoyìsi)", textVietnamese: "ngại quá"},
          {key: "E", textChinese: "完 (wán)", textVietnamese: "xong"}
        ],
        correctKey: "B",
        explanation: "Không hiểu ý nghĩa (都不懂) -> Điền 懂 (B).",
      },
      {
        id: "h2-l01-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "男：（    ），我家里有点儿事，今天不能去了。 女：好的，那你明天再来吧。",
        promptPinyin: "Nán: (    ), wǒ jiā li yǒu diǎnr shì, jīntiān bù néng qù le. Nǚ: Hǎo de, nà nǐ míngtiān zài lái ba.",
        promptVietnamese: "Nam: Ngại quá, nhà tôi có chút việc, hôm nay không thể đi được rồi. Nữ: Được rồi, vậy ngày mai bạn lại đến nhé.",
        options: [
          {key: "A", textChinese: "次 (cì)", textVietnamese: "lần"},
          {key: "B", textChinese: "懂 (dǒng)", textVietnamese: "hiểu"},
          {key: "C", textChinese: "给 (gěi)", textVietnamese: "cho"},
          {key: "D", textChinese: "不好意思 (bù hǎoyìsi)", textVietnamese: "ngại quá, xin lỗi"},
          {key: "E", textChinese: "完 (wán)", textVietnamese: "xong"}
        ],
        correctKey: "D",
        explanation: "Lời xin lỗi lịch sự vì bận việc đột xuất -> Điền 不好意思 (D).",
      },
      {
        id: "h2-l01-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你是来旅游的吧？",
        promptPinyin: "Nǐ shì lái lǚyóu de ba?",
        promptVietnamese: "Bạn đến đây du lịch phải không?",
        options: [
          {key: "A", textChinese: "不是，我是来上学的。", textVietnamese: "Không phải, tôi đến để đi học."},
          {key: "B", textChinese: "不客气，有事就给我打电话。", textVietnamese: "Đừng khách sáo, có việc cứ gọi điện cho tôi."},
          {key: "C", textChinese: "王老师，她说这儿的饺子非常好吃。", textVietnamese: "Cô giáo Vương, cô ấy bảo sủi cảo ở đây rất ngon."},
          {key: "D", textChinese: "我爸爸，他是中国人。", textVietnamese: "Bố tôi, ông ấy là người Trung Quốc."}
        ],
        correctKey: "A",
        explanation: "Hỏi mục đích đến có phải du lịch không -> Đáp A (不是，我是来上学的).",
      },
      {
        id: "h2-l01-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "是谁给你介绍的这家饭店？",
        promptPinyin: "Shì shéi gěi nǐ jièshào de zhè jiā fàndiàn?",
        promptVietnamese: "Ai đã giới thiệu cho bạn nhà hàng này vậy?",
        options: [
          {key: "A", textChinese: "不是，我是来上学的。", textVietnamese: "Không phải, tôi đến để đi học."},
          {key: "B", textChinese: "不客气，有事就给我打电话。", textVietnamese: "Đừng khách sáo, có việc cứ gọi cho tôi."},
          {key: "C", textChinese: "王老师，她说这儿的饺子非常好吃。", textVietnamese: "Cô giáo Vương, cô ấy bảo sủi cảo ở đây rất ngon."},
          {key: "D", textChinese: "我爸爸，他是中国人。", textVietnamese: "Bố tôi, ông ấy là người Trung Quốc."}
        ],
        correctKey: "C",
        explanation: "Hỏi ai giới thiệu quán ăn -> Đáp C (王老师，她说这儿的饺子非常好吃).",
      },
      {
        id: "h2-l01-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "谢谢你这几天都来帮忙。",
        promptPinyin: "Xièxie nǐ zhè jǐ tiān dōu lái bāngmáng.",
        promptVietnamese: "Cảm ơn bạn mấy ngày nay đều đến giúp đỡ.",
        options: [
          {key: "A", textChinese: "不是，我是来上学的。", textVietnamese: "Không phải, tôi đến để đi học."},
          {key: "B", textChinese: "不客气，有事就给我打电话。", textVietnamese: "Không có chi, có việc cứ gọi cho tôi nhé."},
          {key: "C", textChinese: "王老师，她说这儿的饺子非常好吃。", textVietnamese: "Cô giáo Vương."},
          {key: "D", textChinese: "我爸爸，他是中国人。", textVietnamese: "Bố tôi."}
        ],
        correctKey: "B",
        explanation: "Đáp lại lời cảm ơn giúp đỡ -> Đáp B (不客气，有事就给我打电话).",
      },
      {
        id: "h2-l01-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "是谁让你学中文的？",
        promptPinyin: "Shì shéi ràng nǐ xué Zhōngwén de?",
        promptVietnamese: "Ai đã bảo/khuyên bạn học tiếng Trung vậy?",
        options: [
          {key: "A", textChinese: "不是，我是来上学的。", textVietnamese: "Không phải, tôi đến để đi học."},
          {key: "B", textChinese: "不客气，有事就给我打电话。", textVietnamese: "Đừng khách sáo."},
          {key: "C", textChinese: "王老师，她说这儿的饺子非常好吃。", textVietnamese: "Cô giáo Vương."},
          {key: "D", textChinese: "我爸爸，他是中国人。", textVietnamese: "Bố tôi, ông ấy là người Trung Quốc."}
        ],
        correctKey: "D",
        explanation: "Hỏi ai bảo học tiếng Trung -> Đáp D (我爸爸，他是中国人).",
      },
      {
        id: "h2-l01-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "到了西安，朋友来接我们，还给我们介绍了一家饭店。我们开车去了那里，菜都很好吃。",
        promptPinyin: "Dàole Xī’ān, péngyou lái jiē wǒmen, hái gěi wǒmen jièshàole yì jiā fàndiàn. Wǒmen kāichē qùle nàlǐ, cài dōu hěn hǎochī.",
        promptVietnamese: "Đến Tây An, bạn bè đến đón chúng tôi, lại còn giới thiệu cho chúng tôi một nhà hàng. Chúng tôi lái xe đến đó, món ăn đều rất ngon.",
        subPrompt: "★ 朋友介绍了什么？ (Bạn bè đã giới thiệu cái gì?)",
        options: [
          {key: "A", textChinese: "车 (chē)", textVietnamese: "Chiếc xe"},
          {key: "B", textChinese: "饭店 (fàndiàn)", textVietnamese: "Nhà hàng"},
          {key: "C", textChinese: "西安 (Xī’ān)", textVietnamese: "Tây An"}
        ],
        correctKey: "B",
        explanation: "Bạn giới thiệu một nhà hàng (介绍了一家饭店) -> Đáp án B (饭店).",
      },
      {
        id: "h2-l01-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "我在北京旅游的时候，一雪姐请我吃了烤鸭，还给我介绍了很多东西。现在，我们已经是好朋友了。",
        promptPinyin: "Wǒ zài Běijīng lǚyóu de shíhou, Yīxuě jiě qǐng wǒ chīle kǎoyā, hái gěi wǒ jièshàole hěn duō dōngxi. Xiànzài, wǒmen yǐjīng shì hǎo péngyou le.",
        promptVietnamese: "Lúc tôi đi du lịch Bắc Kinh, chị Nhất Tuyết mời tôi ăn vịt quay, còn giới thiệu cho tôi nhiều thứ. Bây giờ, chúng tôi đã là bạn tốt rồi.",
        subPrompt: "★ 他在北京旅游时，一雪： (Khi anh ấy du lịch Bắc Kinh, Nhất Tuyết...)",
        options: [
          {key: "A", textChinese: "请他吃饭", textVietnamese: "Mời anh ấy ăn cơm (ăn vịt quay)"},
          {key: "B", textChinese: "开车接他", textVietnamese: "Lái xe đón anh ấy"},
          {key: "C", textChinese: "不在北京", textVietnamese: "Không ở Bắc Kinh"}
        ],
        correctKey: "A",
        explanation: "Chị Nhất Tuyết mời ăn vịt quay (请我吃了烤鸭) -> Đáp án A (请他吃饭).",
      },
      {
        id: "h2-l01-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "我家在北京，我爸爸现在在上海工作，他让我和妈妈这个星期六坐火车去上海看他。爸爸说，他会接我们。",
        promptPinyin: "Wǒ jiā zài Běijīng, wǒ bàba xiànzài zài Shànghǎi gōngzuò, tā ràng wǒ hé māma zhège Xīngqīliù zuò huǒchē qù Shànghǎi kàn tā. Bàba shuō, tā huì jiē wǒmen.",
        promptVietnamese: "Nhà tôi ở Bắc Kinh, bố tôi hiện đang làm việc ở Thượng Hải, bố bảo tôi và mẹ thứ bảy này đi tàu hỏa tới Thượng Hải thăm bố. Bố nói bố sẽ đón chúng tôi.",
        subPrompt: "★ 爸爸现在在哪儿工作？ (Bố hiện tại làm việc ở đâu?)",
        options: [
          {key: "A", textChinese: "北京 (Běijīng)", textVietnamese: "Bắc Kinh"},
          {key: "B", textChinese: "上海 (Shànghǎi)", textVietnamese: "Thượng Hải"},
          {key: "C", textChinese: "西安 (Xī’ān)", textVietnamese: "Tây An"}
        ],
        correctKey: "B",
        explanation: "Bố hiện đang làm việc ở Thượng Hải (爸爸现在在上海工作) -> Đáp án B (上海).",
      }
    ],
    writingExercises: [
      {
        id: "h2-l01-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: 不 [ 忄 + 董 ]",
        givenComponent: "忄",
        targetComponents: [
          { key: "A", radical: "冫" },
          { key: "B", radical: "纟" },
          { key: "C", radical: "忄" },
          { key: "D", radical: "十" }
        ],
        correctAnswer: "懂",
        hanzi: "懂",
        explanation: "忄 (tâm đứng) + 董 = 懂 (dǒng - hiểu, biết).",
      },
      {
        id: "h2-l01-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 纟 + 合 ] 他",
        givenComponent: "纟",
        targetComponents: [
          { key: "A", radical: "冫" },
          { key: "B", radical: "纟" },
          { key: "C", radical: "忄" },
          { key: "D", radical: "十" }
        ],
        correctAnswer: "给",
        hanzi: "给",
        explanation: "纟 (mịch) + 合 = 给 (gěi - cho, đưa cho).",
      },
      {
        id: "h2-l01-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: 两 [ 冫 + 欠 ]",
        givenComponent: "冫",
        targetComponents: [
          { key: "A", radical: "冫" },
          { key: "B", radical: "纟" },
          { key: "C", radical: "忄" },
          { key: "D", radical: "十" }
        ],
        correctAnswer: "次",
        hanzi: "次",
        explanation: "冫 (băng) + 欠 = 次 (cì - lần, lượt).",
      },
      {
        id: "h2-l01-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他（    ）时候不吃晚饭。",
        pinyinGuide: "yǒu",
        correctAnswer: "有",
        hanzi: "有",
        explanation: "有时候 (yǒushíhou) nghĩa là có lúc, thỉnh thoảng.",
      },
      {
        id: "h2-l01-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "我现在（    ）经到北京了。",
        pinyinGuide: "yǐ",
        correctAnswer: "已",
        hanzi: "已",
        explanation: "已经 (yǐjīng) nghĩa là đã, rồi.",
      },
      {
        id: "h2-l01-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "这个不太贵，（    ）我们买这个吧。",
        pinyinGuide: "nà",
        correctAnswer: "那",
        hanzi: "那",
        explanation: "那 (nà) dùng biểu thị sự suy đoán, vậy thì.",
      }
    ],
  },
  {
    lessonNumber: 2,
    titleChinese: "还是打车去北大吧",
    titlePinyin: "Háishì dǎchē qù Běidà ba",
    titleVietnamese: "Chúng ta vẫn nên gọi taxi đi Đại học Bắc Kinh nhé",
    pageNumber: "011",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '门',
          pinyin: 'ménzìkuāng',
          nameVietnamese: 'Khung Môn / Bộ Môn (门字框)',
          meaning: 'Liên quan đến cửa ra vào, khoảng cách giữa các phòng',
          exampleChars: [
            { char: '间', pinyin: 'jiān', meaning: 'Gian, phòng' },
            { char: '问', pinyin: 'wèn', meaning: 'Hỏi' },
          ],
        },
        {
          radical: '辶',
          pinyin: 'zǒuzhīpáng',
          nameVietnamese: 'Bộ Quai xước / Tẩu chi (走之旁)',
          meaning: 'Liên quan đến đi lại, khoảng cách di chuyển',
          exampleChars: [
            { char: '过', pinyin: 'guò', meaning: 'Qua, từng' },
            { char: '远', pinyin: 'yuǎn', meaning: 'Xa' },
          ],
        },
      ],
      copyWords: [
        { word: '二十间', pinyin: 'èrshí jiān', vietnamese: '20 phòng (这儿有二十多间教室。)' },
        { word: '问一下', pinyin: 'wèn yíxià', vietnamese: 'Hỏi một chút (你还是问一下老师吧。)' },
        { word: '过来', pinyin: 'guòlái', vietnamese: 'Qua đây (你还是过来吧。)' },
        { word: '不远', pinyin: 'bù yuǎn', vietnamese: 'Không xa (不远，十多分钟就到了。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '公交车', pinyin: 'gōngjiāochē', meaning: 'Xe buýt' },
        { hanzi: '车站', pinyin: 'chēzhàn', meaning: 'Bến xe, trạm' },
        { hanzi: '火车', pinyin: 'huǒchē', meaning: 'Tàu hỏa' },
        { hanzi: '下', pinyin: 'xià', meaning: 'Dưới, tiếp theo' },
        { hanzi: '次', pinyin: 'cì', meaning: 'Lần' },
      
        { hanzi: "车", pinyin: "chē", meaning: "Xe cộ" },
      ],
      compounds: [
        { part1: '公交车', part2: '站', combinedHanzi: '公交站', pinyin: 'gōngjiāozhàn', meaning: 'Trạm xe buýt' },
        { part1: '火车', part2: '站', combinedHanzi: '火车站', pinyin: 'huǒchēzhàn', meaning: 'Ga tàu hỏa' },
        { part1: '下', part2: '次', combinedHanzi: '下次', pinyin: 'xiàcì', meaning: 'Lần sau' },
      ],
      discussion: {
        question: '“公交站”、“火车站” và “下次” có nghĩa là gì?',
        answer: 'Ghép từ gốc: trạm đón xe buýt (公交站), nhà ga tàu lửa (火车站), và lần kế tiếp (下次).',
      },
      exercises: [
        {
          id: 'w2_e1',
          sentenceWithBlank: '我们还是（ ）再去饭店吃饭吧。',
          pinyinSentence: 'Wǒmen háishi ( ) zài qù fàndiàn chī fàn ba.',
          options: ['下次', '公交站', '火车站'],
          correctAnswer: '下次',
          vietnameseTranslation: 'Chúng ta hay là để lần sau hãy đến nhà hàng ăn cơm nhé.',
        },
        {
          id: 'w2_e2',
          sentenceWithBlank: '前面有个（ ），我们去看一下有没有到学校的车。',
          pinyinSentence: 'Qiánbian yǒu gè ( ), wǒmen qù kàn yíxià yǒu méiyǒu dào xuéxiào de chē.',
          options: ['公交站', '下次', '火车站'],
          correctAnswer: '公交站',
          vietnameseTranslation: 'Phía trước có trạm xe buýt, chúng ta qua xem có xe tới trường không.',
        },
        {
          id: "w2_e3",
          sentenceWithBlank: "我们的火车是十点的，现在九点多了，打车去（ ）吧。",
          pinyinSentence: "Wǒmen de huǒchē shì shí diǎn de, xiànzài jiǔ diǎn duō le, dǎchē qù ( ) ba.",
          options: ["火车站", "公交站", "下次"],
          correctAnswer: "火车站",
          vietnameseTranslation: "Chuyến tàu của chúng ta là 10 giờ, bây giờ hơn 9 giờ rồi, bắt taxi ra ga tàu hỏa đi.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l02-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Lí zhèr bù yuǎn, zǒu wǔ fēnzhōng jiù dào.",
        options: [
          {key: "A", textChinese: "走路五分钟", textVietnamese: "Khoảng cách gần đi bộ 5 phút", imageEmoji: "🚶"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Lí zhèr bù yuǎn, zǒu wǔ fēnzhōng jiù dào.\" phù hợp với hình ảnh 走路五分钟 (A).",
      },
      {
        id: "h2-l02-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā měitiān zuò gōngjiāochē qù gōngsī.",
        options: [
          {key: "A", textChinese: "坐公交车", textVietnamese: "Đi làm bằng xe buýt", imageEmoji: "🚌"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā měitiān zuò gōngjiāochē qù gōngsī.\" phù hợp với hình ảnh 坐公交车 (A).",
      },
      {
        id: "h2-l02-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Huǒchēzhàn zài qiánbian liǎng gōnglǐ.",
        options: [
          {key: "A", textChinese: "火车站", textVietnamese: "Nhà ga xe lửa lớn", imageEmoji: "🚉"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Huǒchēzhàn zài qiánbian liǎng gōnglǐ.\" phù hợp với hình ảnh 火车站 (A).",
      },
      {
        id: "h2-l02-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Qǐngwèn yīyuàn lí zhèr yuǎn ma? Nǚ: Bù tài yuǎn, wǎng qián zǒu jiù shì.",
        options: [
          {key: "A", textChinese: "Bệnh viện ở phía trước không xa", textVietnamese: "Bệnh viện ở phía trước không xa", imageEmoji: "🏥"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Bệnh viện ở phía trước không xa (A).",
      },
      {
        id: "h2-l02-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ zěnme lái de? Nǚ: Wǒ zuò dìtiě lái de, hěn kuài.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm rất nhanh", textVietnamese: "Đi tàu điện ngầm rất nhanh", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm rất nhanh (A).",
      },
      {
        id: "h2-l02-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Chēzhàn zài nǎr? Nǚ: Jiù zài shāngdiàn duìmiàn.",
        options: [
          {key: "A", textChinese: "Trạm xe buýt đối diện cửa hàng", textVietnamese: "Trạm xe buýt đối diện cửa hàng", imageEmoji: "🚏"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Trạm xe buýt đối diện cửa hàng (A).",
      },
      {
        id: "h2-l02-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Dào túshūguǎn yào duō cháng shíjiān? Nǚ: Zǒu lù yào bàn gè xiǎoshí. (Hỏi: 去图书馆需要多长时间？)",
        options: [
          {key: "A", textChinese: "半个小时", textPinyin: "Bàn gè xiǎoshí", textVietnamese: "Nửa tiếng"},
          {key: "B", textChinese: "十分钟", textPinyin: "Shí fēnzhōng", textVietnamese: "10 phút"},
          {key: "C", textChinese: "两个小时", textPinyin: "Liǎng gè xiǎoshí", textVietnamese: "2 tiếng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l02-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ jiā lí xuéxiào yuǎn bu yuǎn? Nǚ: Fēicháng jìn, jiù zài xuéxiào pángbiān. (Hỏi: 她家离学校远吗？)",
        options: [
          {key: "A", textChinese: "非常近", textPinyin: "Fēicháng jìn", textVietnamese: "Rất gần"},
          {key: "B", textChinese: "很远", textPinyin: "Hěn yuǎn", textVietnamese: "Rất xa"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l02-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Wǒmen dǎ chē qù ba? Nǚ: Bù yòng, zuò gōngjiāochē hěn fāngbiàn. (Hỏi: 女的想怎么去？)",
        options: [
          {key: "A", textChinese: "坐公交车", textPinyin: "Zuò gōngjiāochē", textVietnamese: "Đi xe buýt"},
          {key: "B", textChinese: "打车", textPinyin: "Dǎ chē", textVietnamese: "Bắt taxi"},
          {key: "C", textChinese: "走路", textPinyin: "Zǒu lù", textVietnamese: "Đi bộ"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l02-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Huǒchē jǐ diǎn kāi? Nǚ: Xiàwǔ liǎng diǎn bàn. (Hỏi: 火车几点开？)",
        options: [
          {key: "A", textChinese: "2:30", textPinyin: "2:30", textVietnamese: "2 giờ rưỡi chiều"},
          {key: "B", textChinese: "3:00", textPinyin: "3:00", textVietnamese: "3 giờ"},
          {key: "C", textChinese: "1:30", textPinyin: "1:30", textVietnamese: "1 giờ rưỡi"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l02-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "我家离学校很近，每天走路去。",
        promptPinyin: "Wǒ jiā lí xuéxiào hěn jìn, měitiān zǒu lù qù.",
        promptVietnamese: "Nhà tôi cách trường rất gần, mỗi ngày đều đi bộ đi học.",
        options: [
          {key: "A", textChinese: "Đi bộ gần trường học", textVietnamese: "Nhà tôi cách trường rất gần, mỗi ngày đều đi bộ đi học.", imageEmoji: "🏫🚶"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"我家离学校很近，每天走路去。\" mô tả chính xác nội dung tranh A (Đi bộ gần trường học).",
      },
      {
        id: "h2-l02-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "去火车站可以坐这路公交车。",
        promptPinyin: "Qù huǒchēzhàn kěyǐ zuò zhè lù gōngjiāochē.",
        promptVietnamese: "Đến ga xe lửa có thể đi tuyến xe buýt này.",
        options: [
          {key: "A", textChinese: "Xe buýt đến ga tàu", textVietnamese: "Đến ga xe lửa có thể đi tuyến xe buýt này.", imageEmoji: "🚌🚉"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"去火车站可以坐这路公交车。\" mô tả chính xác nội dung tranh A (Xe buýt đến ga tàu).",
      },
      {
        id: "h2-l02-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "前边那个大楼就是中国银行。",
        promptPinyin: "Qiánbian nàge dàlóu jiù shì Zhōngguó Yínháng.",
        promptVietnamese: "Tòa nhà lớn phía trước chính là Ngân hàng Trung Quốc.",
        options: [
          {key: "A", textChinese: "Tòa nhà ngân hàng", textVietnamese: "Tòa nhà lớn phía trước chính là Ngân hàng Trung Quốc.", imageEmoji: "🏦🏢"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"前边那个大楼就是中国银行。\" mô tả chính xác nội dung tranh A (Tòa nhà ngân hàng).",
      },
      {
        id: "h2-l02-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "学校（    ）我家只有五百米。",
        promptPinyin: "xuéxiào (    ) wǒ jiā zhǐ yǒu wǔbǎi mǐ.",
        promptVietnamese: "Trường cách nhà tôi chỉ 500m.",
        options: [
          {key: "A", textChinese: "远", textVietnamese: "xa"},
          {key: "B", textChinese: "近", textVietnamese: "gần"},
          {key: "C", textChinese: "离", textVietnamese: "cách"},
          {key: "D", textChinese: "慢", textVietnamese: "chậm"},
          {key: "E", textChinese: "快", textVietnamese: "nhanh"}
        ],
        correctKey: "C",
        explanation: "Điền từ 离 (lí) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l02-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "公共汽车开得很（    ），大家别着急。",
        promptPinyin: "gōnggòng qìchē kāi de hěn (    ), dàjiā bié zháojí.",
        promptVietnamese: "Xe buýt chạy chậm, mọi người đừng vội.",
        options: [
          {key: "A", textChinese: "远", textVietnamese: "xa"},
          {key: "B", textChinese: "近", textVietnamese: "gần"},
          {key: "C", textChinese: "离", textVietnamese: "cách"},
          {key: "D", textChinese: "慢", textVietnamese: "chậm"},
          {key: "E", textChinese: "快", textVietnamese: "nhanh"}
        ],
        correctKey: "D",
        explanation: "Điền từ 慢 (màn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l02-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "那个饭店离这儿太（    ）了，我们开车去吧。",
        promptPinyin: "nàge fàndiàn lí zhèr tài (    ) le, wǒmen kāichē qù ba.",
        promptVietnamese: "Nhà hàng đó xa quá, đi xe hơi nhé.",
        options: [
          {key: "A", textChinese: "远", textVietnamese: "xa"},
          {key: "B", textChinese: "近", textVietnamese: "gần"},
          {key: "C", textChinese: "离", textVietnamese: "cách"},
          {key: "D", textChinese: "慢", textVietnamese: "chậm"},
          {key: "E", textChinese: "快", textVietnamese: "nhanh"}
        ],
        correctKey: "A",
        explanation: "Điền từ 远 (yuǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l02-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "现在走过去已经来不（    ）了。",
        promptPinyin: "xiànzài zǒu guòqù yǐjīng lái bu (    ) le.",
        promptVietnamese: "Bây giờ đi bộ qua đó không kịp nữa rồi.",
        options: [
          {key: "A", textChinese: "远", textVietnamese: "xa"},
          {key: "B", textChinese: "近", textVietnamese: "gần"},
          {key: "C", textChinese: "离", textVietnamese: "cách"},
          {key: "D", textChinese: "慢", textVietnamese: "chậm"},
          {key: "E", textChinese: "快", textVietnamese: "nhanh"}
        ],
        correctKey: "B",
        explanation: "Điền từ 及 (jí) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l02-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "去机场坐地铁方便吗？",
        promptPinyin: "Qù jīchǎng zuò dìtiě fāngbiàn ma?",
        promptVietnamese: "Đi sân bay bằng tàu điện ngầm có tiện không?",
        options: [
          {key: "A", textChinese: "很方便，半小时就到了。", textPinyin: "Hěn fāngbiàn, bàn xiǎoshí jiù dào le.", textVietnamese: "Rất tiện lợi, nửa tiếng là đến."},
          {key: "B", textChinese: "往前走，在左边第二间。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "路上车太多，堵车了。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "太远了，我们骑自行车吧。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"去机场坐地铁方便吗？\" đối đáp phù hợp nhất với phương án A: \"很方便，半小时就到了。\".",
      },
      {
        id: "h2-l02-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "请问，洗手间在哪里？",
        promptPinyin: "Qǐngwèn, xǐshǒujiān zài nǎlǐ?",
        promptVietnamese: "Xin hỏi, nhà vệ sinh ở đâu?",
        options: [
          {key: "A", textChinese: "往前走，在左边第二间。", textPinyin: "Wǎng qián zǒu, zài zuǒbian dì-èr jiān.", textVietnamese: "Đi thẳng về phía trước, ở phòng thứ 2 bên trái."},
          {key: "B", textChinese: "路上车太多，堵车了。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "太远了，我们骑自行车吧。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "很方便，半小时就到了。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"请问，洗手间在哪里？\" đối đáp phù hợp nhất với phương án A: \"往前走，在左边第二间。\".",
      },
      {
        id: "h2-l02-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "你今天怎么迟到了？",
        promptPinyin: "Nǐ jīntiān zěnme chídào le?",
        promptVietnamese: "Sao hôm nay bạn đến muộn vậy?",
        options: [
          {key: "A", textChinese: "路上车太多，堵车了。", textPinyin: "Lù shang chē tài duō, dǔchē le.", textVietnamese: "Trên đường đông xe quá, bị kẹt xe."},
          {key: "B", textChinese: "太远了，我们骑自行车吧。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "很方便，半小时就到了。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "往前走，在左边第二间。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你今天怎么迟到了？\" đối đáp phù hợp nhất với phương án A: \"路上车太多，堵车了。\".",
      },
      {
        id: "h2-l02-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "我们跑步去公园好吗？",
        promptPinyin: "Wǒmen pǎobù qù gōngyuán hǎo ma?",
        promptVietnamese: "Chúng ta chạy bộ đến công viên được không?",
        options: [
          {key: "A", textChinese: "太远了，我们骑自行车吧。", textPinyin: "Tài yuǎn le, wǒmen qí zìxíngchē ba.", textVietnamese: "Xa quá, chúng ta đạp xe đạp đi."},
          {key: "B", textChinese: "很方便，半小时就到了。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "往前走，在左边第二间。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "路上车太多，堵车了。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"我们跑步去公园好吗？\" đối đáp phù hợp nhất với phương án A: \"太远了，我们骑自行车吧。\".",
      },
      {
        id: "h2-l02-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "我家离公司比较远，坐公交车要一个小时。为了不迟到，我每天早上六点半就得起床。虽然很辛苦，但是我很喜欢现在的工作。",
        promptPinyin: "",
        subPrompt: "★ 说话人每天几点起床？",
        options: [
          {key: "A", textChinese: "6:30", textVietnamese: "6 giờ rưỡi sáng"},
          {key: "B", textChinese: "7:00", textVietnamese: "7 giờ sáng"},
          {key: "C", textChinese: "8:00", textVietnamese: "8 giờ sáng"}
        ],
        correctKey: "A",
        explanation: "Sáng 6:30 dậy để đi làm kịp (六点半起床) -> Đáp án A.",
      },
      {
        id: "h2-l02-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "大卫想买一辆自行车，因为他的学校很大，从宿舍到教室要走二十分钟。有了自行车，五分钟就能到教室。",
        promptPinyin: "",
        subPrompt: "★ 大卫为什么要买自行车？",
        options: [
          {key: "A", textChinese: "去教室更快", textVietnamese: "Đến lớp học nhanh hơn"},
          {key: "B", textChinese: "喜欢运动", textVietnamese: "Thích vận động thể thao"},
          {key: "C", textChinese: "朋友送的", textVietnamese: "Bạn bè tặng"}
        ],
        correctKey: "A",
        explanation: "Có xe đạp đi học nhanh hơn (五分钟就能到) -> Đáp án A.",
      },
      {
        id: "h2-l02-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "北京的地铁非常方便，去哪儿都能坐地铁。地铁票也不贵，很多人出门都喜欢坐地铁，不经常开自己的车。",
        promptPinyin: "",
        subPrompt: "★ 为什么很多人喜欢坐地铁？",
        options: [
          {key: "A", textChinese: "又方便又便宜", textVietnamese: "Vừa tiện vừa rẻ"},
          {key: "B", textChinese: "北京没有公交车", textVietnamese: "Bắc Kinh không có xe buýt"},
          {key: "C", textChinese: "大家都不会开车", textVietnamese: "Mọi người không biết lái xe"}
        ],
        correctKey: "A",
        explanation: "Tàu điện ngầm tiện lợi và giá rẻ (方便也不贵) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l02-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 辶 + 元 ]",
        givenComponent: "辶",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "攵" },
          { key: "C", radical: "刂" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "远",
        hanzi: "远",
        explanation: "辶 (quai xước) + 元 = 远 (yuǎn - xa).",
      },
      {
        id: "h2-l02-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 孝 + 攵 ]",
        givenComponent: "攵",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "攵" },
          { key: "C", radical: "刂" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "教",
        hanzi: "教",
        explanation: "孝 + 攵 (phộc) = 教 (jiāo/jiào - dạy, giáo dục).",
      },
      {
        id: "h2-l02-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 另 + 刂 ]",
        givenComponent: "刂",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "攵" },
          { key: "C", radical: "刂" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "别",
        hanzi: "别",
        explanation: "另 + 刂 (đao đứng) = 别 (bié - đừng, biệt).",
      },
      {
        id: "h2-l02-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "我们可以在（    ）上买票。",
        pinyinGuide: "wǎng",
        correctAnswer: "网",
        hanzi: "网",
        explanation: "网上 (wǎngshang) nghĩa là trên mạng internet.",
      },
      {
        id: "h2-l02-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "这一（    ）教室很大。",
        pinyinGuide: "jiān",
        correctAnswer: "间",
        hanzi: "间",
        explanation: "一间教室 (yì jiān jiàoshì) - 间 là lượng từ cho phòng học.",
      },
      {
        id: "h2-l02-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "你快点儿（    ）来吧。",
        pinyinGuide: "guò",
        correctAnswer: "过",
        hanzi: "过",
        explanation: "过来 (guòlái) nghĩa là qua đây, đến đây.",
      }
    ],
  },
  {
    lessonNumber: 3,
    titleChinese: "我想去西安旅游",
    titlePinyin: "Wǒ xiǎng qù Xī’ān lǚyóu",
    titleVietnamese: "Em muốn đi Tây An du lịch",
    pageNumber: "021",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '氵',
          pinyin: 'sāndiǎnshuǐ',
          nameVietnamese: 'Bộ Tam điểm thủy (三点水)',
          meaning: 'Liên quan đến nước, sông ngòi, chất lỏng',
          exampleChars: [
            { char: '汉', pinyin: 'hàn', meaning: 'Hán (sông Hán, Hán tộc)' },
            { char: '洗', pinyin: 'xǐ', meaning: 'Rửa, giặt' },
          ],
        },
        {
          radical: '宀',
          pinyin: 'bǎogàitóu',
          nameVietnamese: 'Bộ Miên / Bảo cái đầu (宝盖头)',
          meaning: 'Mái nhà, nơi cư ngụ',
          exampleChars: [
            { char: '家', pinyin: 'jiā', meaning: 'Nhà, gia đình' },
            { char: '完', pinyin: 'wán', meaning: 'Xong, hoàn thành' },
          ],
        },
      ],
      copyWords: [
        { word: '汉字', pinyin: 'hànzì', vietnamese: 'Chữ Hán (我每天都会写写汉字。)' },
        { word: '洗手', pinyin: 'xǐshǒu', vietnamese: 'Rửa tay (饭前要洗洗手。)' },
        { word: '在家', pinyin: 'zài jiā', vietnamese: 'Ở nhà (你在家休息休息吧。)' },
        { word: '做完', pinyin: 'zuòwán', vietnamese: 'Làm xong (我的工作做完了。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '书', pinyin: 'shū', meaning: 'Sách' },
        { hanzi: '桌子', pinyin: 'zhuōzi', meaning: 'Cái bàn' },
        { hanzi: '洗', pinyin: 'xǐ', meaning: 'Rửa' },
        { hanzi: '公交车', pinyin: 'gōngjiāochē', meaning: 'Xe buýt' },
        { hanzi: '回来', pinyin: 'huílái', meaning: 'Về lại' },
        { hanzi: '中国', pinyin: 'Zhōngguó', meaning: 'Trung Quốc' },
      ],
      compounds: [
        { part1: '书', part2: '桌', combinedHanzi: '书桌', pinyin: 'shūzhuō', meaning: 'Bàn học, bàn đọc sách' },
        { part1: '洗', part2: '车', combinedHanzi: '洗车', pinyin: 'xǐchē', meaning: 'Rửa xe' },
        { part1: '回', part2: '国', combinedHanzi: '回国', pinyin: 'huíguó', meaning: 'Về nước' },
      ],
      discussion: {
        question: '“书桌”、“洗车” và “回国” có nghĩa là gì?',
        answer: 'Bàn làm việc để sách (书桌), hành động rửa xe hơi/phương tiện (洗车), trở về tổ quốc (回国).',
      },
      exercises: [
        {
          id: 'w3_e1',
          sentenceWithBlank: '明天有雨，你别去（ ）了。',
          pinyinSentence: 'Míngtiān yǒu yǔ, nǐ bié qù ( ) le.',
          options: ['洗车', '书桌', '回国'],
          correctAnswer: '洗车',
          vietnameseTranslation: 'Ngày mai có mưa, bạn đừng đi rửa xe nữa.',
        },
        {
          id: "w3_e2",
          sentenceWithBlank: "坚持（ ）是一个非常好的健康生活习惯。",
          pinyinSentence: "Jiānchí ( ) shì yí gè fēicháng hǎo de jiànkāng shēnghuó xíguàn.",
          options: ["早起", "跑步", "洗完"],
          correctAnswer: "早起",
          vietnameseTranslation: "Kiên trì dậy sớm là một thói quen sinh hoạt rất tốt cho sức khỏe.",
        },
        {
          id: "w3_e3",
          sentenceWithBlank: "他把所有衣服都（ ）了。",
          pinyinSentence: "Tā bǎ suǒyǒu yīfu dōu ( ) le.",
          options: ["洗完", "早起", "跑步"],
          correctAnswer: "洗完",
          vietnameseTranslation: "Anh ấy đã giặt xong toàn bộ quần áo rồi.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l03-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒ jīntiān zǎoshang qī diǎn jiù qǐchuáng le.",
        options: [
          {key: "A", textChinese: "早上七点起床", textVietnamese: "Thức dậy lúc 7 giờ sáng", imageEmoji: "⏰"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒ jīntiān zǎoshang qī diǎn jiù qǐchuáng le.\" phù hợp với hình ảnh 早上七点起床 (A).",
      },
      {
        id: "h2-l03-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Gēge měitiān bàngwǎn dōu qù cāochǎng pǎobù.",
        options: [
          {key: "A", textChinese: "操场跑步", textVietnamese: "Chạy bộ sân vận động", imageEmoji: "🏃"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Gēge měitiān bàngwǎn dōu qù cāochǎng pǎobù.\" phù hợp với hình ảnh 操场跑步 (A).",
      },
      {
        id: "h2-l03-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǎnshang chī wán fàn, wǒ xǐ le yí gè rèshuǐ zǎo.",
        options: [
          {key: "A", textChinese: "洗热水澡", textVietnamese: "Tắm nước nóng sảng khoái", imageEmoji: "🚿"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǎnshang chī wán fàn, wǒ xǐ le yí gè rèshuǐ zǎo.\" phù hợp với hình ảnh 洗热水澡 (A).",
      },
      {
        id: "h2-l03-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ jǐ diǎn shuìjiào? Nǚ: Wǒ shí diǎn bàn jiù shuì le.",
        options: [
          {key: "A", textChinese: "Ngủ sớm lúc 10 rưỡi", textVietnamese: "Ngủ sớm lúc 10 rưỡi", imageEmoji: "🛌"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Ngủ sớm lúc 10 rưỡi (A).",
      },
      {
        id: "h2-l03-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zǎoshang chī shénme? Nǚ: Hē niúnǎi, chī miànbāo.",
        options: [
          {key: "A", textChinese: "Uống sữa ăn bánh mì sáng", textVietnamese: "Uống sữa ăn bánh mì sáng", imageEmoji: "🥛🍞"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Uống sữa ăn bánh mì sáng (A).",
      },
      {
        id: "h2-l03-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Jīntiān yùndòng le ma? Nǚ: Pǎole sān gōnglǐ.",
        options: [
          {key: "A", textChinese: "Chạy bộ 3 cây số thể thao", textVietnamese: "Chạy bộ 3 cây số thể thao", imageEmoji: "🏃‍♀️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Chạy bộ 3 cây số thể thao (A).",
      },
      {
        id: "h2-l03-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ píngshí jǐ diǎn qǐchuáng? Nǚ: Píngshí bā diǎn, jīntiān qī diǎn jiù qǐ le. (Hỏi: 她平时几点起床？)",
        options: [
          {key: "A", textChinese: "8:00", textPinyin: "8:00", textVietnamese: "8 giờ"},
          {key: "B", textChinese: "7:00", textPinyin: "7:00", textVietnamese: "7 giờ"},
          {key: "C", textChinese: "6:30", textPinyin: "6:30", textVietnamese: "6 giờ rưỡi"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l03-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ zuótiān jǐ diǎn shuì de? Nǚ: Zuótiān gōngzuò máng, shí’èr diǎn cái shuì. (Hỏi: 她昨晚几点睡觉？)",
        options: [
          {key: "A", textChinese: "12:00", textPinyin: "12:00", textVietnamese: "12 giờ đêm"},
          {key: "B", textChinese: "10:00", textPinyin: "10:00", textVietnamese: "10 giờ tối"},
          {key: "C", textChinese: "11:00", textPinyin: "11:00", textVietnamese: "11 giờ đêm"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l03-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zǎofàn zuò hǎo le ma? Nǚ: Yǐjīng zuò hǎo le, kuài lái chī ba. (Hỏi: 早饭怎么样了？)",
        options: [
          {key: "A", textChinese: "已经做好了", textPinyin: "Yǐjīng zuò hǎo le", textVietnamese: "Đã nấu xong rồi"},
          {key: "B", textChinese: "还没做", textPinyin: "Hái méi zuò", textVietnamese: "Chưa nấu"},
          {key: "C", textChinese: "不想吃", textPinyin: "Bù xiǎng chī", textVietnamese: "Không muốn ăn"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l03-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ měitiān dōu duànliàn shēntǐ ma? Nǚ: Shì de, wǒ xǐhuan dǎ lánqiú. (Hỏi: 女的喜欢什么运动？)",
        options: [
          {key: "A", textChinese: "打篮球", textPinyin: "Dǎ lánqiú", textVietnamese: "Bóng rổ"},
          {key: "B", textChinese: "踢足球", textPinyin: "Tī zúqiú", textVietnamese: "Bóng đá"},
          {key: "C", textChinese: "游泳", textPinyin: "Yóuyǒng", textVietnamese: "Bơi lội"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l03-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "早上起床后，他先喝了一杯温水。",
        promptPinyin: "Zǎoshang qǐchuáng hòu, tā xiān hēle yì bēi wēnshuǐ.",
        promptVietnamese: "Sáng thức dậy, anh ấy uống trước một cốc nước ấm.",
        options: [
          {key: "A", textChinese: "Uống nước ấm sau khi ngủ dậy", textVietnamese: "Sáng thức dậy, anh ấy uống trước một cốc nước ấm.", imageEmoji: "🥛🌅"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"早上起床后，他先喝了一杯温水。\" mô tả chính xác nội dung tranh A (Uống nước ấm sau khi ngủ dậy).",
      },
      {
        id: "h2-l03-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "爷爷每天早上去公园打太极拳。",
        promptPinyin: "Yéye měitiān zǎoshang qù gōngyuán dǎ tàijíquán.",
        promptVietnamese: "Ông nội mỗi sáng đều ra công viên tập thái cực quyền.",
        options: [
          {key: "A", textChinese: "Ông cụ tập dưỡng sinh công viên", textVietnamese: "Ông nội mỗi sáng đều ra công viên tập thái cực quyền.", imageEmoji: "👴🌳"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"爷爷每天早上去公园打太极拳。\" mô tả chính xác nội dung tranh A (Ông cụ tập dưỡng sinh công viên).",
      },
      {
        id: "h2-l03-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "晚上九点，小明在房间里认真写作业。",
        promptPinyin: "Wǎnshang jiǔ diǎn, Xiǎomíng zài fángjiān li rènzhēn xiě zuòyè.",
        promptVietnamese: "9 giờ tối, Tiểu Minh chăm chỉ làm bài tập trong phòng.",
        options: [
          {key: "A", textChinese: "Học sinh làm bài tập buổi tối", textVietnamese: "9 giờ tối, Tiểu Minh chăm chỉ làm bài tập trong phòng.", imageEmoji: "👦✍️"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"晚上九点，小明在房间里认真写作业。\" mô tả chính xác nội dung tranh A (Học sinh làm bài tập buổi tối).",
      },
      {
        id: "h2-l03-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "今天星期天，他八点（    ）起床。",
        promptPinyin: "jīntiān Xīngqītiān, tā bā diǎn (    ) qǐchuáng.",
        promptVietnamese: "Hôm nay chủ nhật, anh ấy 8 giờ mới dậy.",
        options: [
          {key: "A", textChinese: "早", textVietnamese: "sớm"},
          {key: "B", textChinese: "晚", textVietnamese: "muộn"},
          {key: "C", textChinese: "就", textVietnamese: "đã, liền"},
          {key: "D", textChinese: "才", textVietnamese: "mới"},
          {key: "E", textChinese: "运动", textVietnamese: "vận động"}
        ],
        correctKey: "D",
        explanation: "Điền từ 才 (cái) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l03-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "老师说我们要早睡（    ）起。",
        promptPinyin: "lǎoshī shuō wǒmen yào zǎo shuì (    ) qǐ.",
        promptVietnamese: "Thầy bảo chúng ta phải ngủ sớm dậy sớm.",
        options: [
          {key: "A", textChinese: "早", textVietnamese: "sớm"},
          {key: "B", textChinese: "晚", textVietnamese: "muộn"},
          {key: "C", textChinese: "就", textVietnamese: "đã, liền"},
          {key: "D", textChinese: "才", textVietnamese: "mới"},
          {key: "E", textChinese: "运动", textVietnamese: "vận động"}
        ],
        correctKey: "A",
        explanation: "Điền từ 早 (zǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l03-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "他昨天晚上睡得很（    ），今天有点儿累。",
        promptPinyin: "tā zuótiān wǎnshang shuì de hěn (    ), jīntiān yǒudiǎnr lèi.",
        promptVietnamese: "Tối qua anh ấy ngủ muộn nên nay hơi mệt.",
        options: [
          {key: "A", textChinese: "早", textVietnamese: "sớm"},
          {key: "B", textChinese: "晚", textVietnamese: "muộn"},
          {key: "C", textChinese: "就", textVietnamese: "đã, liền"},
          {key: "D", textChinese: "才", textVietnamese: "mới"},
          {key: "E", textChinese: "运动", textVietnamese: "vận động"}
        ],
        correctKey: "B",
        explanation: "Điền từ 晚 (wǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l03-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "运动（    ）后要多喝水。",
        promptPinyin: "yùndòng (    ) hòu yào duō hē shuǐ.",
        promptVietnamese: "Vận động xong cần uống nhiều nước.",
        options: [
          {key: "A", textChinese: "早", textVietnamese: "sớm"},
          {key: "B", textChinese: "晚", textVietnamese: "muộn"},
          {key: "C", textChinese: "就", textVietnamese: "đã, liền"},
          {key: "D", textChinese: "才", textVietnamese: "mới"},
          {key: "E", textChinese: "运动", textVietnamese: "vận động"}
        ],
        correctKey: "C",
        explanation: "Điền từ 完 (wán) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l03-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你怎么起得这么早？",
        promptPinyin: "Nǐ zěnme qǐ de zhème zǎo?",
        promptVietnamese: "Sao bạn dậy sớm thế này?",
        options: [
          {key: "A", textChinese: "今天上午有汉语考试，我想复习一下。", textPinyin: "Jīntiān shàngwǔ yǒu Hànyǔ kǎoshì, wǒ xiǎng fùxí yíxià.", textVietnamese: "Sáng nay có thi tiếng Hán, tớ muốn ôn lại một chút."},
          {key: "B", textChinese: "我看书看到十二点多才睡。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "刚开始有点儿累，现在习惯了。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "好啊，七点半在学校南门见。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你怎么起得这么早？\" đối đáp phù hợp nhất với phương án A: \"今天上午有汉语考试，我想复习一下。\".",
      },
      {
        id: "h2-l03-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "你昨天晚上几点睡的？",
        promptPinyin: "Nǐ zuótiān wǎnshang jǐ diǎn shuì de?",
        promptVietnamese: "Tối qua mấy giờ bạn ngủ?",
        options: [
          {key: "A", textChinese: "我看书看到十二点多才睡。", textPinyin: "Wǒ kàn shū kàn dào shí’èr diǎn duō cái shuì.", textVietnamese: "Tớ đọc sách đến hơn 12 giờ mới ngủ."},
          {key: "B", textChinese: "刚开始有点儿累，现在习惯了。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "好啊，七点半在学校南门见。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "今天上午有汉语考试，我想复习一下。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你昨天晚上几点睡的？\" đối đáp phù hợp nhất với phương án A: \"我看书看到十二点多才睡。\".",
      },
      {
        id: "h2-l03-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "跑步累不累？",
        promptPinyin: "Pǎobù lèi bu lèi?",
        promptVietnamese: "Chạy bộ có mệt không?",
        options: [
          {key: "A", textChinese: "刚开始有点儿累，现在习惯了。", textPinyin: "Gāng kāishǐ yǒudiǎnr lèi, xiànzài xíguàn le.", textVietnamese: "Mới đầu hơi mệt, giờ quen rồi."},
          {key: "B", textChinese: "好啊，七点半在学校南门见。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "今天上午有汉语考试，我想复习一下。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我看书看到十二点多才睡。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"跑步累不累？\" đối đáp phù hợp nhất với phương án A: \"刚开始有点儿累，现在习惯了。\".",
      },
      {
        id: "h2-l03-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "明天早上一起去吃早饭吧？",
        promptPinyin: "Míngtiān zǎoshang yìqǐ qù chī zǎofàn ba?",
        promptVietnamese: "Mai cùng đi ăn sáng nhé?",
        options: [
          {key: "A", textChinese: "好啊，七点半在学校南门见。", textPinyin: "Hǎo a, qī diǎn bàn zài xuéxiào nánmén jiàn.", textVietnamese: "Được thôi, 7 rưỡi gặp ở cổng nam trường nhé."},
          {key: "B", textChinese: "今天上午有汉语考试，我想复习一下。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我看书看到十二点多才睡。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "刚开始有点儿累，现在习惯了。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"明天早上一起去吃早饭吧？\" đối đáp phù hợp nhất với phương án A: \"好啊，七点半在学校南门见。\".",
      },
      {
        id: "h2-l03-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "王老师每天早晨六点就去公园跑步，跑完步再去学校上班。他说坚持运动不仅让身体更健康，而且一天都很有精神。",
        promptPinyin: "",
        subPrompt: "★ 王老师跑完步去哪里？",
        options: [
          {key: "A", textChinese: "去学校上班", textVietnamese: "Đến trường đi làm"},
          {key: "B", textChinese: "回家睡觉", textVietnamese: "Về nhà ngủ"},
          {key: "C", textChinese: "去医院", textVietnamese: "Đi bệnh viện"}
        ],
        correctKey: "A",
        explanation: "Chạy bộ xong đi làm ở trường (跑完步再去学校上班) -> Đáp án A.",
      },
      {
        id: "h2-l03-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "小李平时喜欢晚上看电影，经常一点才睡觉。最近他生病了，医生建议他每天晚上十点前睡觉，养成良好的作息习惯。",
        promptPinyin: "",
        subPrompt: "★ 医生建议小李几点前睡觉？",
        options: [
          {key: "A", textChinese: "十点前", textVietnamese: "Trước 10 giờ đêm"},
          {key: "B", textChinese: "十二点前", textVietnamese: "Trước 12 giờ"},
          {key: "C", textChinese: "一点后", textVietnamese: "Sau 1 giờ"}
        ],
        correctKey: "A",
        explanation: "Bác sĩ khuyên ngủ trước 10h (十点前睡觉) -> Đáp án A.",
      },
      {
        id: "h2-l03-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "中国人常说：“早饭要吃好，午饭要吃饱，晚饭要吃少。”这句话告诉我们，每天的三餐都应该有科学的安排。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要讲什么？",
        options: [
          {key: "A", textChinese: "健康饮食的习惯", textVietnamese: "Thói quen ăn uống lành mạnh"},
          {key: "B", textChinese: "做饭的方法", textVietnamese: "Cách nấu ăn"},
          {key: "C", textChinese: "晚饭最重要", textVietnamese: "Bữa tối quan trọng nhất"}
        ],
        correctKey: "A",
        explanation: "Sắp xếp 3 bữa ăn khoa học tốt cho sức khỏe (健康饮食习惯) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l03-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 辶 + 关 ]",
        givenComponent: "辶",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "氵" },
          { key: "C", radical: "宀" },
          { key: "D", radical: "扌" }
        ],
        correctAnswer: "送",
        hanzi: "送",
        explanation: "辶 + 关 = 送 (sòng - tặng, tiễn đưa).",
      },
      {
        id: "h2-l03-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 氵 + 先 ]",
        givenComponent: "氵",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "氵" },
          { key: "C", radical: "宀" },
          { key: "D", radical: "扌" }
        ],
        correctAnswer: "洗",
        hanzi: "洗",
        explanation: "氵 (ba chấm thủy) + 先 = 洗 (xǐ - rửa, giặt).",
      },
      {
        id: "h2-l03-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 宀 + 元 ]",
        givenComponent: "宀",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "氵" },
          { key: "C", radical: "宀" },
          { key: "D", radical: "扌" }
        ],
        correctAnswer: "完",
        hanzi: "完",
        explanation: "宀 (miên) + 元 = 完 (wán - xong, hoàn thành).",
      },
      {
        id: "h2-l03-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "（    ）什么你今天没去？",
        pinyinGuide: "wèi",
        correctAnswer: "为",
        hanzi: "为",
        explanation: "为什么 (wèishénme) nghĩa là tại sao.",
      },
      {
        id: "h2-l03-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他（    ）么高兴。",
        pinyinGuide: "zhè",
        correctAnswer: "这",
        hanzi: "这",
        explanation: "这么 (zhème) nghĩa là như thế này, thế này.",
      },
      {
        id: "h2-l03-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "这个地方（    ）错。",
        pinyinGuide: "bù",
        correctAnswer: "不",
        hanzi: "不",
        explanation: "不错 (búcuò) nghĩa là không tệ, rất tốt.",
      }
    ],
  },
  {
    lessonNumber: 4,
    titleChinese: "你穿红色的很好看",
    titlePinyin: "Nǐ chuān hóngsè de hěn hǎokàn",
    titleVietnamese: "Con mặc đồ màu đỏ rất đẹp",
    pageNumber: "031",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '纟',
          pinyin: 'jiāosīpáng',
          nameVietnamese: 'Bộ Mịch / Dây tơ (绞丝旁)',
          meaning: 'Liên quan đến tơ lụa, màu sắc dệt may',
          exampleChars: [
            { char: '红', pinyin: 'hóng', meaning: 'Đỏ' },
            { char: '绿', pinyin: 'lǜ', meaning: 'Xanh lục' },
          ],
        },
        {
          radical: '土',
          pinyin: 'títǔpáng',
          nameVietnamese: 'Bộ Thổ (提土旁)',
          meaning: 'Liên quan đến đất đai, địa điểm xây dựng',
          exampleChars: [
            { char: '场', pinyin: 'chǎng', meaning: 'Trường, sân bãi' },
            { char: '块', pinyin: 'kuài', meaning: 'Khối, đồng tiền tệ' },
          ],
        },
      ],
      copyWords: [
        { word: '红色', pinyin: 'hóngsè', vietnamese: 'Màu đỏ (我没买过红色的。)' },
        { word: '绿色', pinyin: 'lǜsè', vietnamese: 'Màu xanh lục (绿色的书包很好看。)' },
        { word: '商场', pinyin: 'shāngchǎng', vietnamese: 'Trung tâm thương mại (你去没去过那家商场？)' },
        { word: '十块钱', pinyin: 'shí kuài qián', vietnamese: '10 tệ (还是买那个十块钱的吧。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '休息', pinyin: 'xiūxi', meaning: 'Nghỉ ngơi' },
        { hanzi: '教室', pinyin: 'jiàoshì', meaning: 'Phòng học' },
        { hanzi: '米饭', pinyin: 'mǐfàn', meaning: 'Cơm trắng' },
        { hanzi: '菜', pinyin: 'cài', meaning: 'Món ăn, rau' },
        { hanzi: '白色', pinyin: 'báisè', meaning: 'Màu trắng' },
        { hanzi: '猫', pinyin: 'māo', meaning: 'Con mèo' },
      ],
      compounds: [
        { part1: '休息', part2: '室', combinedHanzi: '休息室', pinyin: 'xiūxishì', meaning: 'Phòng nghỉ ngơi' },
        { part1: '饭', part2: '菜', combinedHanzi: '饭菜', pinyin: 'fàncài', meaning: 'Cơm canh, đồ ăn' },
        { part1: '白', part2: '猫', combinedHanzi: '白猫', pinyin: 'báimāo', meaning: 'Mèo trắng' },
      ],
      discussion: {
        question: '“休息室”、“饭菜” và “白猫” có nghĩa là gì?',
        answer: 'Phòng dành để nghỉ ngơi (休息室), các món ăn thường nhật (饭菜), và mèo có lông màu trắng (白猫).',
      },
      exercises: [
        {
          id: 'w4_e1',
          sentenceWithBlank: '我很喜欢吃你做的（ ）。',
          pinyinSentence: 'Wǒ hěn xǐhuan chī nǐ zuò de ( ).',
          options: ['饭菜', '休息室', '白猫'],
          correctAnswer: '饭菜',
          vietnameseTranslation: 'Tôi rất thích ăn cơm canh do bạn nấu.',
        },
        {
          id: "w4_e2",
          sentenceWithBlank: "早上妈妈去菜市场（ ）。",
          pinyinSentence: "Zǎoshang māma qù càishìchǎng ( ).",
          options: ["买菜", "商场", "新衣服"],
          correctAnswer: "买菜",
          vietnameseTranslation: "Buổi sáng mẹ đi chợ mua thức ăn.",
        },
        {
          id: "w4_e3",
          sentenceWithBlank: "过年的时候大家都穿上了（ ）。",
          pinyinSentence: "Guònián de shíhou dàjiā dōu chuān shang le ( ).",
          options: ["新衣服", "买菜", "商场"],
          correctAnswer: "新衣服",
          vietnameseTranslation: "Khi đón tết mọi người đều mặc quần áo mới.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l04-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 4 kè: 这个商店的衣服真漂亮.",
        options: [
          {key: "A", textChinese: "Bài học 4", textVietnamese: "Nội dung bài 4", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 4 kè: 这个商店的衣服真漂亮.\" phù hợp với hình ảnh Bài học 4 (A).",
      },
      {
        id: "h2-l04-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l04-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l04-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l04-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l04-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l04-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l04-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l04-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l04-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l04-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l04-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l04-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l04-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l04-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l04-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l04-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l04-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l04-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l04-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l04-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l04-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l04-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l04-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l04-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 辶 + 井 ]",
        givenComponent: "辶",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "衤" },
          { key: "C", radical: "纟" },
          { key: "D", radical: "门" }
        ],
        correctAnswer: "进",
        hanzi: "进",
        explanation: "辶 + 井 = 进 (jìn - vào, tiến).",
      },
      {
        id: "h2-l04-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 衤 + 库 ]",
        givenComponent: "衤",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "衤" },
          { key: "C", radical: "纟" },
          { key: "D", radical: "门" }
        ],
        correctAnswer: "裤",
        hanzi: "裤",
        explanation: "衤 (bộ y) + 库 = 裤 (kù - quần).",
      },
      {
        id: "h2-l04-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 纟 + 工 ]",
        givenComponent: "纟",
        targetComponents: [
          { key: "A", radical: "辶" },
          { key: "B", radical: "衤" },
          { key: "C", radical: "纟" },
          { key: "D", radical: "门" }
        ],
        correctAnswer: "红",
        hanzi: "红",
        explanation: "纟 + 工 = 红 (hóng - màu đỏ).",
      },
      {
        id: "h2-l04-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "我去（    ）那个商场。",
        pinyinGuide: "guò",
        correctAnswer: "过",
        hanzi: "过",
        explanation: "去过 (qù guò) nghĩa là đã từng đi qua.",
      },
      {
        id: "h2-l04-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "这个（    ）场很大。",
        pinyinGuide: "shāng",
        correctAnswer: "商",
        hanzi: "商",
        explanation: "商场 (shāngchǎng) nghĩa là trung tâm thương mại.",
      },
      {
        id: "h2-l04-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "（    ）以他没去。",
        pinyinGuide: "suǒ",
        correctAnswer: "所",
        hanzi: "所",
        explanation: "所以 (suǒyǐ) nghĩa là cho nên, vì vậy.",
      }
    ],
  },
  {
    lessonNumber: 5,
    titleChinese: "第一次去中国朋友家",
    titlePinyin: "Dì-yī cì qù Zhōngguó péngyou jiā",
    titleVietnamese: "Lần đầu đến thăm nhà bạn người Trung Quốc",
    pageNumber: "041",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '艹',
          pinyin: 'cǎozìtóu',
          nameVietnamese: 'Bộ Thảo đầu (草字头)',
          meaning: 'Liên quan đến cây cỏ thực vật, hoa lá rau củ',
          exampleChars: [
            { char: '茶', pinyin: 'chá', meaning: 'Trà' },
            { char: '菜', pinyin: 'cài', meaning: 'Rau, món ăn' },
          ],
        },
        {
          radical: '广',
          pinyin: 'guǎngzìtóu',
          nameVietnamese: 'Bộ Quảng (广字头)',
          meaning: 'Liên quan đến nhà cửa, phòng ốc rộng rãi',
          exampleChars: [
            { char: '店', pinyin: 'diàn', meaning: 'Cửa hàng, tiệm' },
            { char: '床', pinyin: 'chuáng', meaning: 'Cái giường' },
          ],
        },
      ],
      copyWords: [
        { word: '红茶', pinyin: 'hóngchá', vietnamese: 'Hồng trà (红茶是朋友送来的。)' },
        { word: '中国菜', pinyin: 'Zhōngguócài', vietnamese: 'Món ăn Trung Quốc (我喜欢吃中国菜。)' },
        { word: '酒店', pinyin: 'jiǔdiàn', vietnamese: 'Khách sạn (我们走回酒店吧。)' },
        { word: '起床', pinyin: 'qǐchuáng', vietnamese: 'Thức dậy (都八点了，起床吧。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '等', pinyin: 'děng', meaning: 'Đợi' },
        { hanzi: '公交车', pinyin: 'gōngjiāochē', meaning: 'Xe buýt' },
        { hanzi: '请', pinyin: 'qǐng', meaning: 'Mời' },
        { hanzi: '进来', pinyin: 'jìnlái', meaning: 'Vào đây' },
        { hanzi: '奶茶', pinyin: 'nǎichá', meaning: 'Trà sữa' },
        { hanzi: '商店', pinyin: 'shāngdiàn', meaning: 'Cửa hàng' },
      ],
      compounds: [
        { part1: '等', part2: '车', combinedHanzi: '等车', pinyin: 'děngchē', meaning: 'Đợi xe' },
        { part1: '请', part2: '进', combinedHanzi: '请进', pinyin: 'qǐngjìn', meaning: 'Mời vào' },
        { part1: '奶茶', part2: '店', combinedHanzi: '奶茶店', pinyin: 'nǎichádiàn', meaning: 'Quán trà sữa' },
      ],
      discussion: {
        question: '“等车”、“请进” và “奶茶店” có nghĩa là gì?',
        answer: 'Chờ đợi xe đến (等车), lời mời khách vào nhà lịch sự (请进), và cửa tiệm bán thức uống trà sữa (奶茶店).',
      },
      exercises: [
        {
          id: 'w5_e1',
          sentenceWithBlank: '这就是我的家，（ ）！',
          pinyinSentence: 'Zhè jiù shì wǒ de jiā, ( )!',
          options: ['请进', '等车', '奶茶店'],
          correctAnswer: '请进',
          vietnameseTranslation: 'Đây chính là nhà của tôi, mời vào!',
        },
        {
          id: "w5_e2",
          sentenceWithBlank: "下午放学后我们去踢（ ）吧。",
          pinyinSentence: "Xiàwǔ fàngxué hòu wǒmen qù tī ( ) ba.",
          options: ["足球", "跑步", "准备"],
          correctAnswer: "足球",
          vietnameseTranslation: "Chiều tan học chúng ta cùng đi đá bóng nhé.",
        },
        {
          id: "w5_e3",
          sentenceWithBlank: "明天的考试你（ ）得怎么样了？",
          pinyinSentence: "Míngtiān de kǎoshì nǐ ( ) de zěnmeyàng le?",
          options: ["准备", "足球", "跑步"],
          correctAnswer: "准备",
          vietnameseTranslation: "Kỳ thi ngày mai bạn chuẩn bị đến đâu rồi?",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l05-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 5 kè: 咱们一起去跑步吧.",
        options: [
          {key: "A", textChinese: "Bài học 5", textVietnamese: "Nội dung bài 5", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 5 kè: 咱们一起去跑步吧.\" phù hợp với hình ảnh Bài học 5 (A).",
      },
      {
        id: "h2-l05-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l05-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l05-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l05-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l05-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l05-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l05-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l05-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l05-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l05-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l05-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l05-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l05-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l05-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l05-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l05-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l05-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l05-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l05-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l05-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l05-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l05-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l05-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l05-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 竹 + 寺 ]",
        givenComponent: "竹",
        targetComponents: [
          { key: "A", radical: "竹" },
          { key: "B", radical: "女" },
          { key: "C", radical: "冫" },
          { key: "D", radical: "扌" }
        ],
        correctAnswer: "等",
        hanzi: "等",
        explanation: "竹 (trúc) + 寺 = 等 (děng - đợi, chờ).",
      },
      {
        id: "h2-l05-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 女 + 乃 ]",
        givenComponent: "女",
        targetComponents: [
          { key: "A", radical: "竹" },
          { key: "B", radical: "女" },
          { key: "C", radical: "冫" },
          { key: "D", radical: "扌" }
        ],
        correctAnswer: "奶",
        hanzi: "奶",
        explanation: "女 (nữ) + 乃 = 奶 (nǎi - bà nội, sữa).",
      },
      {
        id: "h2-l05-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 冫 + 隹 ]",
        givenComponent: "冫",
        targetComponents: [
          { key: "A", radical: "竹" },
          { key: "B", radical: "女" },
          { key: "C", radical: "冫" },
          { key: "D", radical: "扌" }
        ],
        correctAnswer: "准",
        hanzi: "准",
        explanation: "冫 + 隹 = 准 (zhǔn - chuẩn bị).",
      },
      {
        id: "h2-l05-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "从车上（    ）来。",
        pinyinGuide: "xià",
        correctAnswer: "下",
        hanzi: "下",
        explanation: "下来 (xiàlái) nghĩa là bước xuống.",
      },
      {
        id: "h2-l05-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "你（    ）我一起去。",
        pinyinGuide: "gēn",
        correctAnswer: "跟",
        hanzi: "跟",
        explanation: "跟我 (gēn wǒ) nghĩa là cùng tôi đi.",
      },
      {
        id: "h2-l05-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "请等（    ）会儿。",
        pinyinGuide: "yī",
        correctAnswer: "一",
        hanzi: "一",
        explanation: "一会儿 (yíhuìr) nghĩa là một lát, một chốc.",
      }
    ],
  },
  {
    lessonNumber: 6,
    titleChinese: "小雪，生日快乐！",
    titlePinyin: "Xiǎoxuě, shēngrì kuàilè!",
    titleVietnamese: "Chúc mừng sinh nhật Tiểu Tuyết!",
    pageNumber: "051",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '⺮',
          pinyin: 'zhúzìtóu',
          nameVietnamese: 'Bộ Trúc đầu (竹字头)',
          meaning: 'Liên quan đến tre trúc, đồ vật làm từ tre (bút, sách thẻ tre)',
          exampleChars: [
            { char: '笔', pinyin: 'bǐ', meaning: 'Cây bút' },
            { char: '第', pinyin: 'dì', meaning: 'Thứ tự (thứ nhất, thứ nhì)' },
          ],
        },
        {
          radical: '忄',
          pinyin: 'shùxīnpáng',
          nameVietnamese: 'Bộ Tâm đứng / Th竖 tâm bàng (竖心旁)',
          meaning: 'Liên quan đến tâm tư, cảm xúc, tâm trạng',
          exampleChars: [
            { char: '快', pinyin: 'kuài', meaning: 'Nhanh, vui vẻ (hân hoan)' },
            { char: '忙', pinyin: 'máng', meaning: 'Bận rộn' },
          ],
        },
      ],
      copyWords: [
        { word: '画笔', pinyin: 'huàbǐ', vietnamese: 'Cọ vẽ (桌子上有书、画笔什么的。)' },
        { word: '第二', pinyin: 'dì-èr', vietnamese: 'Thứ hai (你再好好地写一下第二个字。)' },
        { word: '快乐', pinyin: 'kuàilè', vietnamese: 'Vui vẻ (我们每天都要快快乐乐的。)' },
        { word: '很忙', pinyin: 'hěn máng', vietnamese: 'Rất bận (他很忙，早早地去工作了。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '打开', pinyin: 'dǎkāi', meaning: 'Mở ra' },
        { hanzi: '手机', pinyin: 'shǒujī', meaning: 'Điện thoại' },
        { hanzi: '鸡蛋', pinyin: 'jīdàn', meaning: 'Trứng gà' },
        { hanzi: '肉', pinyin: 'ròu', meaning: 'Thịt' },
        { hanzi: '红色', pinyin: 'hóngsè', meaning: 'Màu đỏ' },
        { hanzi: '画笔', pinyin: 'huàbǐ', meaning: 'Cây bút vẽ' },
      ],
      compounds: [
        { part1: '开', part2: '机', combinedHanzi: '开机', pinyin: 'kāijī', meaning: 'Mở máy, bật nguồn thiết bị' },
        { part1: '鸡', part2: '肉', combinedHanzi: '鸡肉', pinyin: 'jīròu', meaning: 'Thịt gà' },
        { part1: '红', part2: '笔', combinedHanzi: '红笔', pinyin: 'hóngbǐ', meaning: 'Cây bút đỏ' },
      ],
      discussion: {
        question: '“开机”、“鸡肉” và “红笔” có nghĩa là gì?',
        answer: 'Khởi động máy (开机), thịt của con gà (鸡肉), bút viết mực đỏ (红笔).',
      },
      exercises: [
        {
          id: 'w6_e1',
          sentenceWithBlank: '我很喜欢吃（ ），你呢？',
          pinyinSentence: 'Wǒ hěn xǐhuan chī ( ), nǐ ne?',
          options: ['鸡肉', '开机', '红笔'],
          correctAnswer: '鸡肉',
          vietnameseTranslation: 'Tôi rất thích ăn thịt gà, còn bạn thì sao?',
        },
        {
          id: "w6_e2",
          sentenceWithBlank: "多吃水果和蔬菜让身体更（ ）。",
          pinyinSentence: "Duō chī shuǐguǒ hé shūcài ràng shēntǐ gèng ( ).",
          options: ["健康", "快乐", "长大"],
          correctAnswer: "健康",
          vietnameseTranslation: "Ăn nhiều hoa quả và rau xanh giúp cơ thể thêm khỏe mạnh.",
        },
        {
          id: "w6_e3",
          sentenceWithBlank: "祝你生日（ ），天天开心！",
          pinyinSentence: "Zhù nǐ shēngrì ( ), tiāntiān kāixīn!",
          options: ["快乐", "健康", "长大"],
          correctAnswer: "快乐",
          vietnameseTranslation: "Chúc bạn sinh nhật vui vẻ, mỗi ngày đều tươi vui!",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l06-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 6 kè: 他比我大两岁.",
        options: [
          {key: "A", textChinese: "Bài học 6", textVietnamese: "Nội dung bài 6", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 6 kè: 他比我大两岁.\" phù hợp với hình ảnh Bài học 6 (A).",
      },
      {
        id: "h2-l06-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l06-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l06-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l06-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l06-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l06-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l06-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l06-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l06-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l06-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l06-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l06-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l06-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l06-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l06-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l06-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l06-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l06-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l06-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l06-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l06-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l06-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l06-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l06-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 忄 + 夬 ]",
        givenComponent: "忄",
        targetComponents: [
          { key: "A", radical: "忄" },
          { key: "B", radical: "辶" },
          { key: "C", radical: "月" },
          { key: "D", radical: "口" }
        ],
        correctAnswer: "快",
        hanzi: "快",
        explanation: "忄 + 夬 = 快 (kuài - nhanh, vui vẻ).",
      },
      {
        id: "h2-l06-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 辶 + 寸 ]",
        givenComponent: "辶",
        targetComponents: [
          { key: "A", radical: "忄" },
          { key: "B", radical: "辶" },
          { key: "C", radical: "月" },
          { key: "D", radical: "口" }
        ],
        correctAnswer: "过",
        hanzi: "过",
        explanation: "辶 + 寸 = 过 (guò - qua, từng).",
      },
      {
        id: "h2-l06-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 月 + ⺋ ]",
        givenComponent: "月",
        targetComponents: [
          { key: "A", radical: "忄" },
          { key: "B", radical: "辶" },
          { key: "C", radical: "月" },
          { key: "D", radical: "口" }
        ],
        correctAnswer: "服",
        hanzi: "服",
        explanation: "月 + ⺋ = 服 (fú - y phục, thoải mái).",
      },
      {
        id: "h2-l06-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "（    ）服地坐在椅子上。",
        pinyinGuide: "shū",
        correctAnswer: "舒",
        hanzi: "舒",
        explanation: "舒服 (shūfu) nghĩa là thoải mái, dễ chịu.",
      },
      {
        id: "h2-l06-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "今天的（    ）肉很好吃。",
        pinyinGuide: "jī",
        correctAnswer: "鸡",
        hanzi: "鸡",
        explanation: "鸡肉 (jīròu) nghĩa là thịt gà.",
      },
      {
        id: "h2-l06-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他的头发很（    ）。",
        pinyinGuide: "cháng",
        correctAnswer: "长",
        hanzi: "长",
        explanation: "长 (cháng) nghĩa là dài.",
      }
    ],
  },
  {
    lessonNumber: 7,
    titleChinese: "他篮球打得很好",
    titlePinyin: "Tā lánqiú dǎ de hěn hǎo",
    titleVietnamese: "Bạn ấy chơi bóng rổ rất hay",
    pageNumber: "061",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '⻊',
          pinyin: 'zúzìpáng',
          nameVietnamese: 'Bộ Túc (足字旁)',
          meaning: 'Liên quan đến chân và các động tác đá, chạy nhảy',
          exampleChars: [
            { char: '跑', pinyin: 'pǎo', meaning: 'Chạy' },
            { char: '踢', pinyin: 'tī', meaning: 'Đá (bóng)' },
          ],
        },
        {
          radical: '彳',
          pinyin: 'shuāngrénpáng',
          nameVietnamese: 'Bộ Song nhân / Hai người (双人旁)',
          meaning: 'Liên quan đến đường đi bộ, hành động đi lại',
          exampleChars: [
            { char: '往', pinyin: 'wǎng', meaning: 'Hướng về, đi tới' },
            { char: '很', pinyin: 'hěn', meaning: 'Rất (mức độ)' },
          ],
        },
      ],
      copyWords: [
        { word: '跑步', pinyin: 'pǎobù', vietnamese: 'Chạy bộ (他跑步跑得很快。)' },
        { word: '踢球', pinyin: 'tīqiú', vietnamese: 'Đá bóng (他一到星期天就去踢球。)' },
        { word: '往外', pinyin: 'wǎngwài', vietnamese: 'Ra ngoài (你怎么一下课就往外跑？)' },
        { word: '很好', pinyin: 'hěnhǎo', vietnamese: 'Rất tốt (我写汉字写得很好。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '鱼', pinyin: 'yú', meaning: 'Cá' },
        { hanzi: '肉', pinyin: 'ròu', meaning: 'Thịt' },
        { hanzi: '运动', pinyin: 'yùndòng', meaning: 'Vận động, thể thao' },
        { hanzi: '衣服', pinyin: 'yīfu', meaning: 'Quần áo' },
        { hanzi: '画', pinyin: 'huà', meaning: 'Tranh, vẽ' },
        { hanzi: '老师', pinyin: 'lǎoshī', meaning: 'Thầy cô giáo' },
      ],
      compounds: [
        { part1: '鱼', part2: '肉', combinedHanzi: '鱼肉', pinyin: 'yúròu', meaning: 'Thịt cá' },
        { part1: '运动', part2: '服', combinedHanzi: '运动服', pinyin: 'yùndòngfú', meaning: 'Bộ đồ thể thao' },
        { part1: '画', part2: '师', combinedHanzi: '画师', pinyin: 'huàshī', meaning: 'Họa sĩ' },
      ],
      discussion: {
        question: '“鱼肉”、“运动服” và “画师” có nghĩa là gì?',
        answer: 'Thực phẩm từ cá (鱼肉), trang phục dùng khi tập thể thao (运动服), người họa sĩ chuyên vẽ tranh (画师).',
      },
      exercises: [
        {
          id: 'w7_e1',
          sentenceWithBlank: '今天吃（ ）饺子，好不好？',
          pinyinSentence: 'Jīntiān chī ( ) jiǎozi, hǎobuhǎo?',
          options: ['鱼肉', '运动服', '画师'],
          correctAnswer: '鱼肉',
          vietnameseTranslation: 'Hôm nay ăn sủi cảo nhân thịt cá, được không?',
        },
        {
          id: "w7_e2",
          sentenceWithBlank: "他喜欢骑（ ）去上班。",
          pinyinSentence: "Tā xǐhuan qí ( ) qù shàngbān.",
          options: ["自行车", "地铁", "走路"],
          correctAnswer: "自行车",
          vietnameseTranslation: "Anh ấy thích đạp xe đạp đi làm.",
        },
        {
          id: "w7_e3",
          sentenceWithBlank: "坐（ ）去机场又快又便宜。",
          pinyinSentence: "Zuò ( ) qù jīchǎng yòu kuài yòu piányi.",
          options: ["地铁", "自行车", "走路"],
          correctAnswer: "地铁",
          vietnameseTranslation: "Đi tàu điện ngầm ra sân bay vừa nhanh vừa rẻ.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l07-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 7 kè: 你怎么去学校？.",
        options: [
          {key: "A", textChinese: "Bài học 7", textVietnamese: "Nội dung bài 7", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 7 kè: 你怎么去学校？.\" phù hợp với hình ảnh Bài học 7 (A).",
      },
      {
        id: "h2-l07-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l07-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l07-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l07-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l07-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l07-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l07-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l07-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l07-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l07-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l07-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l07-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l07-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l07-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l07-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l07-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l07-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l07-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l07-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l07-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l07-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l07-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l07-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l07-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 彳 + 主 ]",
        givenComponent: "彳",
        targetComponents: [
          { key: "A", radical: "彳" },
          { key: "B", radical: "足" },
          { key: "C", radical: "王" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "往",
        hanzi: "往",
        explanation: "彳 + 主 = 往 (wǎng - hướng về, đi).",
      },
      {
        id: "h2-l07-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 足 + 包 ]",
        givenComponent: "足",
        targetComponents: [
          { key: "A", radical: "彳" },
          { key: "B", radical: "足" },
          { key: "C", radical: "王" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "跑",
        hanzi: "跑",
        explanation: "足 (túc) + 包 = 跑 (pǎo - chạy).",
      },
      {
        id: "h2-l07-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 王 + 求 ]",
        givenComponent: "王",
        targetComponents: [
          { key: "A", radical: "彳" },
          { key: "B", radical: "足" },
          { key: "C", radical: "王" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "球",
        hanzi: "球",
        explanation: "王 + 求 = 球 (qiú - quả bóng, trái cầu).",
      },
      {
        id: "h2-l07-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他（    ）得非常好。",
        pinyinGuide: "xiě",
        correctAnswer: "写",
        hanzi: "写",
        explanation: "写得好 (xiě de hǎo) nghĩa là viết rất tốt.",
      },
      {
        id: "h2-l07-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "我的（    ）好是唱歌。",
        pinyinGuide: "ài",
        correctAnswer: "爱",
        hanzi: "爱",
        explanation: "爱好 (àihào) nghĩa là sở thích.",
      },
      {
        id: "h2-l07-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "我们去（    ）球吧。",
        pinyinGuide: "tī",
        correctAnswer: "踢",
        hanzi: "踢",
        explanation: "踢球 (tī qiú) nghĩa là đá bóng.",
      }
    ],
  },
  {
    lessonNumber: 8,
    titleChinese: "虽然你忘了，但是我记得",
    titlePinyin: "Suīrán nǐ wàng le, dànshì wǒ jìde",
    titleVietnamese: "Mặc dù em quên, nhưng anh vẫn nhớ",
    pageNumber: "071",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '饣',
          pinyin: 'shízìpáng',
          nameVietnamese: 'Bộ Thực (食字旁)',
          meaning: 'Liên quan đến thức ăn, ăn uống lương thực',
          exampleChars: [
            { char: '饭', pinyin: 'fàn', meaning: 'Cơm, bữa ăn' },
            { char: '饺', pinyin: 'jiǎo', meaning: 'Bánh chẻo, sủi cảo' },
          ],
        },
        {
          radical: '灬',
          pinyin: 'huǒzìdǐ',
          nameVietnamese: 'Bộ Hỏa dưới / Bốn chấm lửa (火字底)',
          meaning: 'Liên quan đến lửa, nhiệt độ nóng, đun nấu',
          exampleChars: [
            { char: '点', pinyin: 'diǎn', meaning: 'Điểm, gọi món, chấm' },
            { char: '热', pinyin: 'rè', meaning: 'Nóng' },
          ],
        },
      ],
      copyWords: [
        { word: '饭馆', pinyin: 'fànguǎn', vietnamese: 'Quán ăn (这家饭馆的菜很好吃。)' },
        { word: '饺子', pinyin: 'jiǎozi', vietnamese: 'Sủi cảo (我觉得饺子比包子好吃。)' },
        { word: '点菜', pinyin: 'diǎncài', vietnamese: 'Gọi món (我点了几个菜。)' },
        { word: '很热', pinyin: 'hěnrè', vietnamese: 'Rất nóng (房间里边很热，比外边还热。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '丈夫', pinyin: 'zhàngfu', meaning: 'Chồng' },
        { hanzi: '妻子', pinyin: 'qīzi', meaning: 'Vợ' },
        { hanzi: '桌子', pinyin: 'zhuōzi', meaning: 'Cái bàn' },
        { hanzi: '椅子', pinyin: 'yǐzi', meaning: 'Cái ghế' },
        { hanzi: '茶', pinyin: 'chá', meaning: 'Trà' },
        { hanzi: '饭馆', pinyin: 'fànguǎn', meaning: 'Quán ăn' },
      ],
      compounds: [
        { part1: '夫妻', part2: '', combinedHanzi: '夫妻', pinyin: 'fūqī', meaning: 'Vợ chồng' },
        { part1: '桌椅', part2: '', combinedHanzi: '桌椅', pinyin: 'zhuōyǐ', meaning: 'Bàn ghế' },
        { part1: '茶馆', part2: '', combinedHanzi: '茶馆', pinyin: 'cháguǎn', meaning: 'Quán trà' },
      ],
      discussion: {
        question: '“夫妻”、“桌椅” và “茶馆” có nghĩa là gì?',
        answer: 'Cặp vợ chồng (夫妻), tổ hợp bàn và ghế (桌椅), quán thưởng thức trà (茶馆).',
      },
      exercises: [
        {
          id: 'w8_e1',
          sentenceWithBlank: '今天下午我们去（ ）喝茶吧。',
          pinyinSentence: 'Jīntiān xiàwǔ wǒmen qù ( ) hē chá ba.',
          options: ['茶馆', '夫妻', '桌椅'],
          correctAnswer: '茶馆',
          vietnameseTranslation: 'Chiều nay chúng ta đến quán trà uống trà nhé.',
        },
        {
          id: "w8_e2",
          sentenceWithBlank: "这道题太难了，我没做（ ）。",
          pinyinSentence: "Zhè dào tí tài nán le, wǒ méi zuò ( ).",
          options: ["对", "错", "懂"],
          correctAnswer: "对",
          vietnameseTranslation: "Câu hỏi này khó quá, tôi làm chưa đúng.",
        },
        {
          id: "w8_e3",
          sentenceWithBlank: "老师讲的内容大家都听（ ）了。",
          pinyinSentence: "Lǎoshī jiǎng de nèiróng dàjiā dōu tīng ( ) le.",
          options: ["懂", "对", "错"],
          correctAnswer: "懂",
          vietnameseTranslation: "Nội dung cô giáo giảng mọi người đều đã hiểu rồi.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l08-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 8 kè: 昨天的考试怎么样？.",
        options: [
          {key: "A", textChinese: "Bài học 8", textVietnamese: "Nội dung bài 8", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 8 kè: 昨天的考试怎么样？.\" phù hợp với hình ảnh Bài học 8 (A).",
      },
      {
        id: "h2-l08-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l08-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l08-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l08-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l08-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l08-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l08-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l08-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l08-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l08-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l08-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l08-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l08-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l08-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l08-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l08-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l08-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l08-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l08-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l08-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l08-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l08-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l08-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l08-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 月 + 犬 + 灬 ]",
        givenComponent: "灬",
        targetComponents: [
          { key: "A", radical: "灬" },
          { key: "B", radical: "艹" },
          { key: "C", radical: "饣" },
          { key: "D", radical: "钅" }
        ],
        correctAnswer: "然",
        hanzi: "然",
        explanation: "月 + 犬 + 灬 = 然 (rán - dĩ nhiên, sau đó).",
      },
      {
        id: "h2-l08-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 艹 + 化 ]",
        givenComponent: "艹",
        targetComponents: [
          { key: "A", radical: "灬" },
          { key: "B", radical: "艹" },
          { key: "C", radical: "饣" },
          { key: "D", radical: "钅" }
        ],
        correctAnswer: "花",
        hanzi: "花",
        explanation: "艹 (thảo) + 化 = 花 (huā - hoa, tiêu xài).",
      },
      {
        id: "h2-l08-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 饣 + 反 ]",
        givenComponent: "饣",
        targetComponents: [
          { key: "A", radical: "灬" },
          { key: "B", radical: "艹" },
          { key: "C", radical: "饣" },
          { key: "D", radical: "钅" }
        ],
        correctAnswer: "饭",
        hanzi: "饭",
        explanation: "饣 (thực) + 反 = 饭 (fàn - cơm, bữa ăn).",
      },
      {
        id: "h2-l08-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "医院在学校（    ）边。",
        pinyinGuide: "zuǒ",
        correctAnswer: "左",
        hanzi: "左",
        explanation: "左边 (zuǒbian) nghĩa là bên trái.",
      },
      {
        id: "h2-l08-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他（    ）了几个菜。",
        pinyinGuide: "diǎn",
        correctAnswer: "点",
        hanzi: "点",
        explanation: "点菜 (diǎn cài) nghĩa là gọi món.",
      },
      {
        id: "h2-l08-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他（    ）我大两岁。",
        pinyinGuide: "bǐ",
        correctAnswer: "比",
        hanzi: "比",
        explanation: "比 (bǐ) nghĩa là so với.",
      }
    ],
  },
  {
    lessonNumber: 9,
    titleChinese: "我去买杯奶茶",
    titlePinyin: "Wǒ qù mǎi bēi nǎichá",
    titleVietnamese: "Em đi mua một cốc trà sữa",
    pageNumber: "081",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '木',
          pinyin: 'mùzìpáng',
          nameVietnamese: 'Bộ Mộc (木字旁)',
          meaning: 'Liên quan đến cây cối, gỗ',
          exampleChars: [
            { char: '校', pinyin: 'xiào', meaning: 'Trường học' },
            { char: '样', pinyin: 'yàng', meaning: 'Dáng vẻ, mẫu mã' },
          ],
        },
        {
          radical: '口',
          pinyin: 'kǒuzìpáng',
          nameVietnamese: 'Bộ Khẩu (口字旁)',
          meaning: 'Liên quan đến miệng, âm thanh nói cười ăn uống',
          exampleChars: [
            { char: '吃', pinyin: 'chī', meaning: 'Ăn' },
            { char: '喝', pinyin: 'hē', meaning: 'Uống' },
          ],
        },
      ],
      copyWords: [
        { word: '学校', pinyin: 'xuéxiào', vietnamese: 'Trường học (我家离学校不远。)' },
        { word: '这样', pinyin: 'zhèyàng', vietnamese: 'Thế này (我没穿过这样的衣服。)' },
        { word: '好吃', pinyin: 'hǎochī', vietnamese: 'Ngon ăn (我觉得饺子没有包子好吃。)' },
        { word: '好喝', pinyin: 'hǎohē', vietnamese: 'Ngon uống (我觉得奶茶没有咖啡好喝。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '咖啡', pinyin: 'kāfēi', meaning: 'Cà phê' },
        { hanzi: '商店', pinyin: 'shāngdiàn', meaning: 'Cửa hàng' },
        { hanzi: '男孩子', pinyin: 'nánháizi', meaning: 'Bé trai' },
        { hanzi: '学生', pinyin: 'xuésheng', meaning: 'Học sinh' },
        { hanzi: '杯子', pinyin: 'bēizi', meaning: 'Cốc ly' },
      
        { hanzi: "男", pinyin: "nán", meaning: "Nam giới, đàn ông" },
      ],
      compounds: [
        { part1: '咖啡', part2: '店', combinedHanzi: '咖啡店', pinyin: 'kāfēidiàn', meaning: 'Quán cà phê' },
        { part1: '男', part2: '生', combinedHanzi: '男生', pinyin: 'nánshēng', meaning: 'Nam sinh, bạn nam' },
        { part1: '咖啡', part2: '杯', combinedHanzi: '咖啡杯', pinyin: 'kāfēibēi', meaning: 'Tách cà phê' },
      ],
      discussion: {
        question: '“咖啡店”、“男生” và “咖啡杯” có nghĩa là gì?',
        answer: 'Quán phục vụ cà phê (咖啡店), học sinh là nam giới (男生), ly chuyên uống cà phê (咖啡杯).',
      },
      exercises: [
        {
          id: 'w9_e1',
          sentenceWithBlank: '您好，这个（ ）多少钱？',
          pinyinSentence: 'Nínhǎo, zhège ( ) duōshao qián?',
          options: ['咖啡杯', '咖啡店', '男生'],
          correctAnswer: '咖啡杯',
          vietnameseTranslation: 'Xin chào, chiếc tách cà phê này bao nhiêu tiền?',
        },
        {
          id: "w9_e2",
          sentenceWithBlank: "我们班有十五个（ ）。",
          pinyinSentence: "Wǒmen bān yǒu shíwǔ gè ( ).",
          options: ["男生", "咖啡店", "咖啡杯"],
          correctAnswer: "男生",
          vietnameseTranslation: "Lớp chúng tôi có 15 học sinh nam.",
        },
        {
          id: "w9_e3",
          sentenceWithBlank: "学校前边有一家新开的（ ）。",
          pinyinSentence: "Xuéxiào qiánbian yǒu yì jiā xīn kāi de ( ).",
          options: ["咖啡店", "男生", "咖啡杯"],
          correctAnswer: "咖啡店",
          vietnameseTranslation: "Phía trước trường học có một quán cà phê mới mở.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l09-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 9 kè: 我想请假.",
        options: [
          {key: "A", textChinese: "Bài học 9", textVietnamese: "Nội dung bài 9", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 9 kè: 我想请假.\" phù hợp với hình ảnh Bài học 9 (A).",
      },
      {
        id: "h2-l09-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l09-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l09-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l09-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l09-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l09-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l09-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l09-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l09-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l09-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l09-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l09-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l09-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l09-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l09-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l09-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l09-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l09-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l09-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l09-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l09-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l09-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l09-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l09-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 足 + 各 ]",
        givenComponent: "足",
        targetComponents: [
          { key: "A", radical: "足" },
          { key: "B", radical: "木" },
          { key: "C", radical: "广" },
          { key: "D", radical: "亻" }
        ],
        correctAnswer: "路",
        hanzi: "路",
        explanation: "足 + 各 = 路 (lù - đường đi).",
      },
      {
        id: "h2-l09-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 木 + 羊 ]",
        givenComponent: "木",
        targetComponents: [
          { key: "A", radical: "足" },
          { key: "B", radical: "木" },
          { key: "C", radical: "广" },
          { key: "D", radical: "亻" }
        ],
        correctAnswer: "样",
        hanzi: "样",
        explanation: "木 + 羊 = 样 (yàng - dáng vẻ, loại).",
      },
      {
        id: "h2-l09-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 广 + 旁 ]",
        givenComponent: "广",
        targetComponents: [
          { key: "A", radical: "足" },
          { key: "B", radical: "木" },
          { key: "C", radical: "广" },
          { key: "D", radical: "亻" }
        ],
        correctAnswer: "旁",
        hanzi: "旁",
        explanation: "旁 (páng - bên cạnh).",
      },
      {
        id: "h2-l09-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他的（    ）子很高。",
        pinyinGuide: "gè",
        correctAnswer: "个",
        hanzi: "个",
        explanation: "个子 (gèzi) nghĩa là vóc dáng, chiều cao.",
      },
      {
        id: "h2-l09-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "手机（    ）了。",
        pinyinGuide: "huài",
        correctAnswer: "坏",
        hanzi: "坏",
        explanation: "坏了 (huài le) nghĩa là bị hỏng rồi.",
      },
      {
        id: "h2-l09-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "这（    ）天我很忙。",
        pinyinGuide: "liǎng",
        correctAnswer: "两",
        hanzi: "两",
        explanation: "这两天 (zhè liǎng tiān) nghĩa là hai ngày nay.",
      }
    ],
  },
  {
    lessonNumber: 10,
    titleChinese: "就要考试了",
    titlePinyin: "Jiù yào kǎoshì le",
    titleVietnamese: "Sắp thi rồi",
    pageNumber: "091",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '讠',
          pinyin: 'yánzìpáng',
          nameVietnamese: 'Bộ Ngôn (言字旁)',
          meaning: 'Liên quan đến lời nói, ngôn ngữ, thi cử',
          exampleChars: [
            { char: '词', pinyin: 'cí', meaning: 'Từ ngữ' },
            { char: '试', pinyin: 'shì', meaning: 'Thi cử, thử nghiệm' },
          ],
        },
        {
          radical: '日',
          pinyin: 'rìzìpáng',
          nameVietnamese: 'Bộ Nhật (日字旁)',
          meaning: 'Liên quan đến mặt trời, thời gian ngày tháng',
          exampleChars: [
            { char: '昨', pinyin: 'zuó', meaning: 'Hôm qua' },
            { char: '明', pinyin: 'míng', meaning: 'Sáng tỏ, ngày mai' },
          ],
        },
      ],
      copyWords: [
        { word: '生词', pinyin: 'shēngcí', vietnamese: 'Từ mới (要学习生词了，请打开书。)' },
        { word: '考试', pinyin: 'kǎoshì', vietnamese: 'Thi cử (我们快要考试了。)' },
        { word: '昨天', pinyin: 'zuótiān', vietnamese: 'Hôm qua (昨天天气很好。)' },
        { word: '明天', pinyin: 'míngtiān', vietnamese: 'Ngày mai (你今天去还是明天去？)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '说话', pinyin: 'shuōhuà', meaning: 'Nói chuyện' },
        { hanzi: '错', pinyin: 'cuò', meaning: 'Sai' },
        { hanzi: '门', pinyin: 'mén', meaning: 'Cửa' },
        { hanzi: '后面', pinyin: 'hòumiàn', meaning: 'Phía sau' },
        { hanzi: '汉字', pinyin: 'hànzì', meaning: 'Chữ Hán' },
        { hanzi: '本子', pinyin: 'běnzi', meaning: 'Quyển vở' },
      ],
      compounds: [
        { part1: '说', part2: '错', combinedHanzi: '说错', pinyin: 'shuōcuò', meaning: 'Nói sai' },
        { part1: '门', part2: '后', combinedHanzi: '门后', pinyin: 'ménhòu', meaning: 'Sau cánh cửa' },
        { part1: '汉字', part2: '本', combinedHanzi: '汉字本', pinyin: 'hànzìběn', meaning: 'Vở tập viết chữ Hán' },
      ],
      discussion: {
        question: '“说错”、“门后” và “汉字本” có nghĩa là gì?',
        answer: 'Nói nhầm lời (说错), vị trí nấp phía sau cửa (门后), tập vở kẻ ô luyện chữ Hán (汉字本).',
      },
      exercises: [
        {
          id: 'w10_e1',
          sentenceWithBlank: '你看得见我的（ ）了吗？',
          pinyinSentence: 'Nǐ kàndejiàn wǒ de ( ) le ma?',
          options: ['汉字本', '门后', '说错'],
          correctAnswer: '汉字本',
          vietnameseTranslation: 'Bạn có thấy quyển vở viết chữ Hán của tôi không?',
        },
        {
          id: "w10_e2",
          sentenceWithBlank: "她有一双大大的（ ），非常漂亮。",
          pinyinSentence: "Tā yǒu yì shuāng dàdà de ( ), fēicháng piàoliang.",
          options: ["眼睛", "头发", "笑容"],
          correctAnswer: "眼睛",
          vietnameseTranslation: "Cô ấy có một đôi mắt to tròn, vô cùng xinh đẹp.",
        },
        {
          id: "w10_e3",
          sentenceWithBlank: "妹妹留着长长的黑（ ）。",
          pinyinSentence: "Mèimei liú zhe chángcháng de hēi ( ).",
          options: ["头发", "眼睛", "笑容"],
          correctAnswer: "头发",
          vietnameseTranslation: "Em gái để mái tóc đen dài.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l10-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 10 kè: 他长得什么样？.",
        options: [
          {key: "A", textChinese: "Bài học 10", textVietnamese: "Nội dung bài 10", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 10 kè: 他长得什么样？.\" phù hợp với hình ảnh Bài học 10 (A).",
      },
      {
        id: "h2-l10-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l10-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l10-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l10-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l10-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l10-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l10-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l10-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l10-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l10-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l10-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l10-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l10-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l10-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l10-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l10-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l10-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l10-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l10-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l10-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l10-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l10-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l10-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l10-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 钅 + 昔 ]",
        givenComponent: "钅",
        targetComponents: [
          { key: "A", radical: "钅" },
          { key: "B", radical: "页" },
          { key: "C", radical: "竹" },
          { key: "D", radical: "氵" }
        ],
        correctAnswer: "错",
        hanzi: "错",
        explanation: "钅 + 昔 = 错 (cuò - sai, lỗi).",
      },
      {
        id: "h2-l10-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 日 + 一 + 页 ]",
        givenComponent: "页",
        targetComponents: [
          { key: "A", radical: "钅" },
          { key: "B", radical: "页" },
          { key: "C", radical: "竹" },
          { key: "D", radical: "氵" }
        ],
        correctAnswer: "题",
        hanzi: "题",
        explanation: "是 + 页 = 题 (tí - câu hỏi, đề bài).",
      },
      {
        id: "h2-l10-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 竹 + 夭 ]",
        givenComponent: "竹",
        targetComponents: [
          { key: "A", radical: "钅" },
          { key: "B", radical: "页" },
          { key: "C", radical: "竹" },
          { key: "D", radical: "氵" }
        ],
        correctAnswer: "笑",
        hanzi: "笑",
        explanation: "竹 + 夭 = 笑 (xiào - cười).",
      },
      {
        id: "h2-l10-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "学校在超市（    ）面。",
        pinyinGuide: "hòu",
        correctAnswer: "后",
        hanzi: "后",
        explanation: "后面 (hòumiàn) nghĩa là phía sau.",
      },
      {
        id: "h2-l10-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "下周就（    ）学了。",
        pinyinGuide: "kāi",
        correctAnswer: "开",
        hanzi: "开",
        explanation: "开学 (kāixué) nghĩa là khai giảng, bắt đầu kỳ học.",
      },
      {
        id: "h2-l10-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "记不住这个生（    ）。",
        pinyinGuide: "cí",
        correctAnswer: "词",
        hanzi: "词",
        explanation: "生词 (shēngcí) nghĩa là từ mới.",
      }
    ],
  },
  {
    lessonNumber: 11,
    titleChinese: "我最喜欢吃中国菜",
    titlePinyin: "Wǒ zuì xǐhuan chī Zhōngguócài",
    titleVietnamese: "Em thích ăn món Trung Quốc nhất",
    pageNumber: "101",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '亻',
          pinyin: 'dānrénpáng',
          nameVietnamese: 'Bộ Nhân đứng (单人旁)',
          meaning: 'Liên quan đến con người, cơ thể và hành vi con người',
          exampleChars: [
            { char: '他', pinyin: 'tā', meaning: 'Anh ấy' },
            { char: '体', pinyin: 'tǐ', meaning: 'Thân thể, thể thao' },
          ],
        },
        {
          radical: '疒',
          pinyin: 'bìngzìtóu',
          nameVietnamese: 'Bộ Bệnh đầu (病字头)',
          meaning: 'Liên quan đến tật bệnh, đau ốm',
          exampleChars: [
            { char: '病', pinyin: 'bìng', meaning: 'Bệnh tật' },
            { char: '疼', pinyin: 'téng', meaning: 'Đau' },
          ],
        },
      ],
      copyWords: [
        { word: '他们', pinyin: 'tāmen', vietnamese: 'Họ (他们穿着黑色的衣服。)' },
        { word: '身体', pinyin: 'shēntǐ', vietnamese: 'Sức khỏe, thân thể (爷爷身体很好。)' },
        { word: '生病', pinyin: 'shēngbìng', vietnamese: 'Bị ốm (你生病了，坐着吧。)' },
        { word: '头疼', pinyin: 'tóuténg', vietnamese: 'Đau đầu (我头疼，不能动，一动就疼。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '身体', pinyin: 'shēntǐ', meaning: 'Cơ thể' },
        { hanzi: '旁边', pinyin: 'pángbiān', meaning: 'Bên cạnh' },
        { hanzi: '水果', pinyin: 'shuǐguǒ', meaning: 'Hoa quả' },
        { hanzi: '药店', pinyin: 'yàodiàn', meaning: 'Tiệm thuốc' },
        { hanzi: '游泳', pinyin: 'yóuyǒng', meaning: 'Bơi lội' },
        { hanzi: '裤子', pinyin: 'kùzi', meaning: 'Quần' },
      ],
      compounds: [
        { part1: '身', part2: '旁', combinedHanzi: '身旁', pinyin: 'shēnpáng', meaning: 'Bên mình, cạnh bên' },
        { part1: '水果', part2: '店', combinedHanzi: '水果店', pinyin: 'shuǐguǒdiàn', meaning: 'Cửa hàng hoa quả' },
        { part1: '泳', part2: '裤', combinedHanzi: '泳裤', pinyin: 'yǒngkù', meaning: 'Quần bơi' },
      ],
      discussion: {
        question: '“身旁”、“水果店” và “泳裤” có nghĩa là gì?',
        answer: 'Vị trí ở bên người (身旁), tiệm chuyên bán trái cây (水果店), quần chuyên dụng đi bơi (泳裤).',
      },
      exercises: [
        {
          id: 'w11_e1',
          sentenceWithBlank: '妈妈给小明买了一条黑色的（ ），他很喜欢。',
          pinyinSentence: 'Māma gěi Xiǎomíng mǎile yì tiáo hēisè de ( ), tā hěn xǐhuan.',
          options: ['泳裤', '身旁', '水果店'],
          correctAnswer: '泳裤',
          vietnameseTranslation: 'Mẹ mua cho Tiểu Minh một chiếc quần bơi màu đen, cậu rất thích.',
        },
        {
          id: "w11_e2",
          sentenceWithBlank: "我们已经在网上订好了（ ）。",
          pinyinSentence: "Wǒmen yǐjīng zài wǎngshang dìng hǎo le ( ).",
          options: ["机票", "机场", "宾馆"],
          correctAnswer: "机票",
          vietnameseTranslation: "Chúng tôi đã đặt xong vé máy bay trên mạng rồi.",
        },
        {
          id: "w11_e3",
          sentenceWithBlank: "下了飞机，我们先去（ ）休息。",
          pinyinSentence: "Xià le fēijī, wǒmen xiān qù ( ) xiūxi.",
          options: ["宾馆", "机票", "机场"],
          correctAnswer: "宾馆",
          vietnameseTranslation: "Xuống máy bay, chúng tôi đến khách sạn nghỉ ngơi trước.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l11-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 11 kè: 我们坐飞机去.",
        options: [
          {key: "A", textChinese: "Bài học 11", textVietnamese: "Nội dung bài 11", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 11 kè: 我们坐飞机去.\" phù hợp với hình ảnh Bài học 11 (A).",
      },
      {
        id: "h2-l11-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l11-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l11-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l11-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l11-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l11-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l11-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l11-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l11-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l11-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l11-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l11-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l11-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l11-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l11-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l11-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l11-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l11-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l11-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l11-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l11-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l11-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l11-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l11-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 疒 + 冬 ]",
        givenComponent: "疒",
        targetComponents: [
          { key: "A", radical: "疒" },
          { key: "B", radical: "纟" },
          { key: "C", radical: "艹" },
          { key: "D", radical: "心" }
        ],
        correctAnswer: "疼",
        hanzi: "疼",
        explanation: "疒 (nạch) + 冬 = 疼 (téng - đau).",
      },
      {
        id: "h2-l11-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 纟 + 𢀖 ]",
        givenComponent: "纟",
        targetComponents: [
          { key: "A", radical: "疒" },
          { key: "B", radical: "纟" },
          { key: "C", radical: "艹" },
          { key: "D", radical: "心" }
        ],
        correctAnswer: "经",
        hanzi: "经",
        explanation: "纟 + 𢀖 = 经 (jīng - qua, kinh).",
      },
      {
        id: "h2-l11-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 艹 + 约 ]",
        givenComponent: "艹",
        targetComponents: [
          { key: "A", radical: "疒" },
          { key: "B", radical: "纟" },
          { key: "C", radical: "艹" },
          { key: "D", radical: "心" }
        ],
        correctAnswer: "药",
        hanzi: "药",
        explanation: "艹 + 约 = 药 (yào - thuốc uống).",
      },
      {
        id: "h2-l11-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "（    ）进，请坐。",
        pinyinGuide: "qǐng",
        correctAnswer: "请",
        hanzi: "请",
        explanation: "请进 (qǐng jìn) nghĩa là xin mời vào.",
      },
      {
        id: "h2-l11-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "到（    ）时已经很晚了。",
        pinyinGuide: "jiā",
        correctAnswer: "家",
        hanzi: "家",
        explanation: "到家 (dào jiā) nghĩa là về đến nhà.",
      },
      {
        id: "h2-l11-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "走得很（    ）。",
        pinyinGuide: "màn",
        correctAnswer: "慢",
        hanzi: "慢",
        explanation: "慢 (màn) nghĩa là chậm.",
      }
    ],
  },
  {
    lessonNumber: 12,
    titleChinese: "这里比北京冷多了",
    titlePinyin: "Zhèlǐ bǐ Běijīng lěng duō le",
    titleVietnamese: "Ở đây lạnh hơn Bắc Kinh nhiều",
    pageNumber: "111",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '钅',
          pinyin: 'jīnzìpáng',
          nameVietnamese: 'Bộ Kim (金字旁)',
          meaning: 'Liên quan đến kim loại, tiền bạc, sắt thép',
          exampleChars: [
            { char: '铁', pinyin: 'tiě', meaning: 'Sắt, đường sắt (tàu điện ngầm)' },
            { char: '钱', pinyin: 'qián', meaning: 'Tiền bạc' },
          ],
        },
        {
          radical: '阝(trái)',
          pinyin: 'zuǒ’ěrpáng',
          nameVietnamese: 'Bộ Phụ / Tai trái (左耳旁)',
          meaning: 'Liên quan đến địa thế đồi núi, che khuất, viện sở',
          exampleChars: [
            { char: '阴', pinyin: 'yīn', meaning: 'Âm u, trời râm' },
            { char: '院', pinyin: 'yuàn', meaning: 'Viện (bệnh viện, sân viện)' },
          ],
        },
      ],
      copyWords: [
        { word: '地铁', pinyin: 'dìtiě', vietnamese: 'Tàu điện ngầm (坐地铁比坐公交车快多了。)' },
        { word: '我的钱', pinyin: 'wǒ de qián', vietnamese: 'Tiền của tôi (我的钱都花完了。)' },
        { word: '阴天', pinyin: 'yīntiān', vietnamese: 'Trời râm âm u (今天是阴天，天气比昨天舒服得多。)' },
        { word: '医院', pinyin: 'yīyuàn', vietnamese: 'Bệnh viện (那家医院最近。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '阴', pinyin: 'yīn', meaning: 'Âm râm' },
        { hanzi: '天气', pinyin: 'tiānqì', meaning: 'Thời tiết' },
        { hanzi: '晴', pinyin: 'qíng', meaning: 'Nắng ráo' },
        { hanzi: '地铁', pinyin: 'dìtiě', meaning: 'Tàu điện ngầm' },
        { hanzi: '车站', pinyin: 'chēzhàn', meaning: 'Trạm ga' },
      
        { hanzi: "天", pinyin: "tiān", meaning: "Trời, ngày" },
      ],
      compounds: [
        { part1: '阴', part2: '天', combinedHanzi: '阴天', pinyin: 'yīntiān', meaning: 'Ngày nhiều mây/râm mát' },
        { part1: '晴', part2: '天', combinedHanzi: '晴天', pinyin: 'qíngtiān', meaning: 'Ngày nắng đẹp' },
        { part1: '地铁', part2: '站', combinedHanzi: '地铁站', pinyin: 'dìtiězhàn', meaning: 'Ga tàu điện ngầm' },
      ],
      discussion: {
        question: '“阴天”、“晴天” và “地铁站” có nghĩa là gì?',
        answer: 'Thời tiết không có nắng (阴天), ngày trời quang đãng có nắng ấm (晴天), ga trung chuyển tàu điện ngầm (地铁站).',
      },
      exercises: [
        {
          id: 'w12_e1',
          sentenceWithBlank: '今天是（ ），我们出去玩吧。',
          pinyinSentence: 'Jīntiān shì ( ), wǒmen chūqù wán ba.',
          options: ['晴天', '阴天', '地铁站'],
          correctAnswer: '晴天',
          vietnameseTranslation: 'Hôm nay là ngày nắng đẹp, chúng ta ra ngoài chơi đi.',
        },
        {
          id: "w12_e2",
          sentenceWithBlank: "今天一直都是（ ），好像要下雨。",
          pinyinSentence: "Jīntiān yìzhí dōu shì ( ), hǎoxiàng yào xià yǔ.",
          options: ["阴天", "晴天", "地铁站"],
          correctAnswer: "阴天",
          vietnameseTranslation: "Hôm nay trời râm mát/nhiều mây suốt, hình như sắp mưa.",
        },
        {
          id: "w12_e3",
          sentenceWithBlank: "你出了（ ）就能看见那座大楼。",
          pinyinSentence: "Nǐ chū le ( ) jiù néng kànjiàn nà zuò dàlóu.",
          options: ["地铁站", "晴天", "阴天"],
          correctAnswer: "地铁站",
          vietnameseTranslation: "Bạn ra khỏi ga tàu điện ngầm là có thể nhìn thấy tòa nhà lớn đó.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l12-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 12 kè: 今天天气怎么样？.",
        options: [
          {key: "A", textChinese: "Bài học 12", textVietnamese: "Nội dung bài 12", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 12 kè: 今天天气怎么样？.\" phù hợp với hình ảnh Bài học 12 (A).",
      },
      {
        id: "h2-l12-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l12-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l12-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l12-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l12-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l12-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l12-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l12-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l12-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l12-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l12-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l12-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l12-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l12-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l12-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l12-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l12-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l12-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l12-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l12-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l12-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l12-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l12-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l12-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 阝 + 月 ]",
        givenComponent: "阝",
        targetComponents: [
          { key: "A", radical: "阝" },
          { key: "B", radical: "木" },
          { key: "C", radical: "日" },
          { key: "D", radical: "氵" }
        ],
        correctAnswer: "阴",
        hanzi: "阴",
        explanation: "阝 + 月 = 阴 (yīn - râm, âm u).",
      },
      {
        id: "h2-l12-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 木 + 娄 ]",
        givenComponent: "木",
        targetComponents: [
          { key: "A", radical: "阝" },
          { key: "B", radical: "木" },
          { key: "C", radical: "日" },
          { key: "D", radical: "氵" }
        ],
        correctAnswer: "楼",
        hanzi: "楼",
        explanation: "木 + 娄 = 楼 (lóu - tòa nhà, tầng lầu).",
      },
      {
        id: "h2-l12-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 日 + 寸 ]",
        givenComponent: "日",
        targetComponents: [
          { key: "A", radical: "阝" },
          { key: "B", radical: "木" },
          { key: "C", radical: "日" },
          { key: "D", radical: "氵" }
        ],
        correctAnswer: "时",
        hanzi: "时",
        explanation: "日 + 寸 = 时 (shí - thời gian, lúc).",
      },
      {
        id: "h2-l12-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "（    ）小他就喜欢画画。",
        pinyinGuide: "cóng",
        correctAnswer: "从",
        hanzi: "从",
        explanation: "从小 (cóng xiǎo) nghĩa là từ nhỏ.",
      },
      {
        id: "h2-l12-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "坐（    ）铁去机场。",
        pinyinGuide: "dì",
        correctAnswer: "地",
        hanzi: "地",
        explanation: "地铁 (dìtiě) nghĩa là tàu điện ngầm.",
      },
      {
        id: "h2-l12-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "那座楼（    ）高啊。",
        pinyinGuide: "hǎo",
        correctAnswer: "好",
        hanzi: "好",
        explanation: "好高 (hǎo gāo) nghĩa là thật là cao.",
      }
    ],
  },
  {
    lessonNumber: 13,
    titleChinese: "我们爱上中文课",
    titlePinyin: "Wǒmen ài shàng Zhōngwén kè",
    titleVietnamese: "Chúng tôi yêu thích môn tiếng Trung Quốc",
    pageNumber: "121",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '阝(phải)',
          pinyin: 'yòu’ěrpáng',
          nameVietnamese: 'Bộ Ấp / Tai phải (右耳旁)',
          meaning: 'Liên quan đến thành ấp, ranh giới, thủ đô',
          exampleChars: [
            { char: '都', pinyin: 'dōu / dū', meaning: 'Đều, đô thị' },
            { char: '那', pinyin: 'nà', meaning: 'Đó, kia' },
          ],
        },
        {
          radical: '攵',
          pinyin: 'fǎnwénpáng',
          nameVietnamese: 'Bộ Phản văn (反文旁)',
          meaning: 'Liên quan đến gõ nhẹ, hành vi thúc đẩy, giáo hóa',
          exampleChars: [
            { char: '教', pinyin: 'jiāo / jiào', meaning: 'Dạy học, giáo dục' },
          ],
        },
      ],
      copyWords: [
        { word: '都来了', pinyin: 'dōu lái le', vietnamese: 'Đều đến rồi (我们班同学都来了。)' },
        { word: '那件', pinyin: 'nà jiàn', vietnamese: 'Chiếc đó (这件衣服比那件好看一些。)' },
        { word: '教中文', pinyin: 'jiāo Zhōngwén', vietnamese: 'Dạy tiếng Trung (王老师教我们中文。)' },
        { word: '教室', pinyin: 'jiàoshì', vietnamese: 'Phòng học (这间教室比那间大一点儿。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '上网', pinyin: 'shàngwǎng', meaning: 'Lên mạng' },
        { hanzi: '名字', pinyin: 'míngzi', meaning: 'Tên' },
        { hanzi: '红色', pinyin: 'hóngsè', meaning: 'Màu đỏ' },
        { hanzi: '花', pinyin: 'huā', meaning: 'Hoa' },
        { hanzi: '大', pinyin: 'dà', meaning: 'To lớn' },
        { hanzi: '楼', pinyin: 'lóu', meaning: 'Tòa nhà' },
      ],
      compounds: [
        { part1: '网', part2: '名', combinedHanzi: '网名', pinyin: 'wǎngmíng', meaning: 'Tên mạng, nickname' },
        { part1: '红', part2: '花', combinedHanzi: '红花', pinyin: 'hónghuā', meaning: 'Bông hoa đỏ' },
        { part1: '大', part2: '楼', combinedHanzi: '大楼', pinyin: 'dàlóu', meaning: 'Tòa nhà cao tầng' },
      ],
      discussion: {
        question: '“网名”、“红花” và “大楼” có nghĩa là gì?',
        answer: 'Biệt danh sử dụng khi trực tuyến (网名), đóa hoa sắc đỏ (红花), cao ốc nhiều tầng đồ sộ (大楼).',
      },
      exercises: [
        {
          id: 'w13_e1',
          sentenceWithBlank: '这些（ ）真漂亮，你想不想买一些？',
          pinyinSentence: 'Zhèxiē ( ) zhēn piàoliang, nǐ xiǎng bu xiǎng mǎi yìxiē?',
          options: ['红花', '网名', '大楼'],
          correctAnswer: '红花',
          vietnameseTranslation: 'Những bông hoa đỏ này thật đẹp, bạn có muốn mua một ít không?',
        },
        {
          id: "w13_e2",
          sentenceWithBlank: "这是朋友送给我的生日（ ）。",
          pinyinSentence: "Zhè shì péngyou sòng gěi wǒ de shēngrì ( ).",
          options: ["礼物", "新年", "快乐"],
          correctAnswer: "礼物",
          vietnameseTranslation: "Đây là món quà sinh nhật bạn bè tặng tôi.",
        },
        {
          id: "w13_e3",
          sentenceWithBlank: "晚会上大家一起唱歌（ ），非常热闹。",
          pinyinSentence: "Wǎnhuì shang dàjiā yìqǐ chànggē ( ), fēicháng rènao.",
          options: ["跳舞", "礼物", "新年"],
          correctAnswer: "跳舞",
          vietnameseTranslation: "Trong buổi dạ hội mọi người cùng nhau ca hát khiêu vũ, vô cùng náo nhiệt.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l13-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 13 kè: 新年快乐！.",
        options: [
          {key: "A", textChinese: "Bài học 13", textVietnamese: "Nội dung bài 13", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 13 kè: 新年快乐！.\" phù hợp với hình ảnh Bài học 13 (A).",
      },
      {
        id: "h2-l13-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l13-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l13-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l13-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l13-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l13-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l13-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l13-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l13-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l13-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l13-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l13-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l13-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l13-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l13-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l13-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l13-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l13-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l13-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l13-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l13-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l13-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l13-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l13-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 竹 + 毛 ]",
        givenComponent: "竹",
        targetComponents: [
          { key: "A", radical: "竹" },
          { key: "B", radical: "阝" },
          { key: "C", radical: "讠" },
          { key: "D", radical: "宀" }
        ],
        correctAnswer: "笔",
        hanzi: "笔",
        explanation: "竹 + 毛 = 笔 (bǐ - cây bút).",
      },
      {
        id: "h2-l13-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 阝 + 那 ]",
        givenComponent: "阝",
        targetComponents: [
          { key: "A", radical: "竹" },
          { key: "B", radical: "阝" },
          { key: "C", radical: "讠" },
          { key: "D", radical: "宀" }
        ],
        correctAnswer: "那",
        hanzi: "那",
        explanation: "那 (nà - kia, đó).",
      },
      {
        id: "h2-l13-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 讠 + 斥 ]",
        givenComponent: "讠",
        targetComponents: [
          { key: "A", radical: "竹" },
          { key: "B", radical: "阝" },
          { key: "C", radical: "讠" },
          { key: "D", radical: "宀" }
        ],
        correctAnswer: "诉",
        hanzi: "诉",
        explanation: "讠 + 斥 = 诉 (sù - nói, bảo, tố).",
      },
      {
        id: "h2-l13-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "（    ）望明天不下雨。",
        pinyinGuide: "xī",
        correctAnswer: "希",
        hanzi: "希",
        explanation: "希望 (xīwàng) nghĩa là hy vọng, mong muốn.",
      },
      {
        id: "h2-l13-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "（    ）年快乐！",
        pinyinGuide: "xīn",
        correctAnswer: "新",
        hanzi: "新",
        explanation: "新年快乐 (Xīnnián kuàilè) nghĩa là chúc mừng năm mới!",
      },
      {
        id: "h2-l13-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "今天（    ）能会下雪。",
        pinyinGuide: "kě",
        correctAnswer: "可",
        hanzi: "可",
        explanation: "可能 (kěnéng) nghĩa là có thể, có khả năng.",
      }
    ],
  },
  {
    lessonNumber: 14,
    titleChinese: "一个人过年多没意思啊",
    titlePinyin: "Yí gè rén guònián duō méi yìsi a",
    titleVietnamese: "Một mình đón năm mới thì thật vô vị",
    pageNumber: "131",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '目',
          pinyin: 'mùzìpáng',
          nameVietnamese: 'Bộ Mục (目字旁)',
          meaning: 'Liên quan đến mắt, nhìn ngắm, thị giác',
          exampleChars: [
            { char: '眼', pinyin: 'yǎn', meaning: 'Mắt' },
            { char: '睡', pinyin: 'shuì', meaning: 'Ngủ' },
          ],
        },
        {
          radical: '立',
          pinyin: 'lìzìpáng',
          nameVietnamese: 'Bộ Lập (立字旁)',
          meaning: 'Liên quan đến đứng thẳng, vững chãi',
          exampleChars: [
            { char: '站', pinyin: 'zhàn', meaning: 'Đứng, trạm xe' },
          ],
        },
      ],
      copyWords: [
        { word: '眼睛', pinyin: 'yǎnjing', vietnamese: 'Đôi mắt (你看，那个女孩儿的眼睛多大啊！)' },
        { word: '睡觉', pinyin: 'shuìjiào', vietnamese: 'Đi ngủ (她睡觉睡得很晚。)' },
        { word: '站着', pinyin: 'zhànzhe', vietnamese: 'Đang đứng (门口站着一个人。)' },
        { word: '火车站', pinyin: 'huǒchēzhàn', vietnamese: 'Ga tàu hỏa (火车站里有很多人。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '女孩儿', pinyin: 'nǚháir', meaning: 'Bé gái' },
        { hanzi: '学生', pinyin: 'xuésheng', meaning: 'Học sinh' },
        { hanzi: '楼', pinyin: 'lóu', meaning: 'Tòa nhà' },
        { hanzi: '前面', pinyin: 'qiánmiàn', meaning: 'Phía trước' },
        { hanzi: '钱', pinyin: 'qián', meaning: 'Tiền' },
        { hanzi: '包', pinyin: 'bāo', meaning: 'Túi xách, ví' },
      ],
      compounds: [
        { part1: '女', part2: '生', combinedHanzi: '女生', pinyin: 'nǚshēng', meaning: 'Nữ sinh' },
        { part1: '楼', part2: '前', combinedHanzi: '楼前', pinyin: 'lóuqián', meaning: 'Trước tòa nhà' },
        { part1: '钱', part2: '包', combinedHanzi: '钱包', pinyin: 'qiánbāo', meaning: 'Ví tiền' },
      ],
      discussion: {
        question: '“女生”、“楼前” và “钱包” có nghĩa là gì?',
        answer: 'Học sinh là nữ giới (女生), khoảng sân phía trước tòa nhà (楼前), túi nhỏ để giữ tiền và thẻ (钱包).',
      },
      exercises: [
        {
          id: 'w14_e1',
          sentenceWithBlank: '你们班有多少个（ ）？',
          pinyinSentence: 'Nǐmen bān yǒu duōshao gè ( )?',
          options: ['女生', '楼前', '钱包'],
          correctAnswer: '女生',
          vietnameseTranslation: 'Lớp của các bạn có bao nhiêu bạn nữ sinh?',
        },
        {
          id: "w14_e2",
          sentenceWithBlank: "我最大的（ ）就是旅行和看书。",
          pinyinSentence: "Wǒ zuì dà de ( ) jiù shì lǚxíng hé kàn shū.",
          options: ["爱好", "音乐", "运动"],
          correctAnswer: "爱好",
          vietnameseTranslation: "Sở thích lớn nhất của tôi chính là du lịch và đọc sách.",
        },
        {
          id: "w14_e3",
          sentenceWithBlank: "做完作业后，他喜欢听听（ ）。",
          pinyinSentence: "Zuò wán zuòyè hòu, tā xǐhuan tīngting ( ).",
          options: ["音乐", "爱好", "运动"],
          correctAnswer: "音乐",
          vietnameseTranslation: "Làm xong bài tập về nhà, cậu ấy thích nghe một chút âm nhạc.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l14-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 14 kè: 你有什么爱好？.",
        options: [
          {key: "A", textChinese: "Bài học 14", textVietnamese: "Nội dung bài 14", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 14 kè: 你有什么爱好？.\" phù hợp với hình ảnh Bài học 14 (A).",
      },
      {
        id: "h2-l14-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l14-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l14-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l14-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l14-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l14-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l14-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l14-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l14-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l14-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l14-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l14-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l14-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l14-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l14-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l14-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l14-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l14-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l14-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l14-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l14-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l14-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l14-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l14-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 亻 + 立 ]",
        givenComponent: "亻",
        targetComponents: [
          { key: "A", radical: "亻" },
          { key: "B", radical: "目" },
          { key: "C", radical: "足" },
          { key: "D", radical: "口" }
        ],
        correctAnswer: "位",
        hanzi: "位",
        explanation: "亻 + 立 = 位 (wèi - vị trí, lượng từ cho người kính trọng).",
      },
      {
        id: "h2-l14-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 目 + 青 ]",
        givenComponent: "目",
        targetComponents: [
          { key: "A", radical: "亻" },
          { key: "B", radical: "目" },
          { key: "C", radical: "足" },
          { key: "D", radical: "口" }
        ],
        correctAnswer: "睛",
        hanzi: "睛",
        explanation: "目 + 青 = 睛 (jing - mắt).",
      },
      {
        id: "h2-l14-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 足 + 兆 ]",
        givenComponent: "足",
        targetComponents: [
          { key: "A", radical: "亻" },
          { key: "B", radical: "目" },
          { key: "C", radical: "足" },
          { key: "D", radical: "口" }
        ],
        correctAnswer: "跳",
        hanzi: "跳",
        explanation: "足 + 兆 = 跳 (tiào - nhảy, khiêu vũ).",
      },
      {
        id: "h2-l14-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "那位老师（    ）王。",
        pinyinGuide: "xìng",
        correctAnswer: "姓",
        hanzi: "姓",
        explanation: "姓 (xìng) nghĩa là họ.",
      },
      {
        id: "h2-l14-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "那个（    ）孩儿真可爱。",
        pinyinGuide: "nǚ",
        correctAnswer: "女",
        hanzi: "女",
        explanation: "女孩儿 (nǚháir) nghĩa là bé gái, cô bé.",
      },
      {
        id: "h2-l14-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "这个电影（    ）意思。",
        pinyinGuide: "méi",
        correctAnswer: "没",
        hanzi: "没",
        explanation: "没意思 (méi yìsi) nghĩa là không thú vị, vô vị.",
      }
    ],
  },
  {
    lessonNumber: 15,
    titleChinese: "我想再去一次中国",
    titlePinyin: "Wǒ xiǎng zài qù yí cì Zhōngguó",
    titleVietnamese: "Em muốn đi Trung Quốc một lần nữa",
    pageNumber: "141",
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Làm quen với thiên bàng, đọc chữ Hán',
      radicals: [
        {
          radical: '女',
          pinyin: 'nǚzìpáng',
          nameVietnamese: 'Bộ Nữ (女字旁)',
          meaning: 'Liên quan đến phụ nữ, quan hệ họ hàng mẫu hệ',
          exampleChars: [
            { char: '姐', pinyin: 'jiě', meaning: 'Chị gái' },
            { char: '姓', pinyin: 'xìng', meaning: 'Họ tên' },
          ],
        },
        {
          radical: '月',
          pinyin: 'yuèzìpáng',
          nameVietnamese: 'Bộ Nguyệt / Bộ Nhục (月字旁)',
          meaning: 'Liên quan đến mặt trăng thời gian hoặc cơ quan cơ thể',
          exampleChars: [
            { char: '期', pinyin: 'qī', meaning: 'Kỳ hạn, tuần lễ' },
            { char: '脑', pinyin: 'nǎo', meaning: 'Bộ não, trí tuệ' },
          ],
        },
      ],
      copyWords: [
        { word: '姐姐', pinyin: 'jiějie', vietnamese: 'Chị gái (姐姐昨天去了两次超市。)' },
        { word: '姓名', pinyin: 'xìngmíng', vietnamese: 'Họ và tên (请再说一下您的姓名。)' },
        { word: '星期', pinyin: 'xīngqī', vietnamese: 'Tuần (我在北京玩了一个星期。)' },
        { word: '电脑', pinyin: 'diànnǎo', vietnamese: 'Máy vi tính (她左手拿着手机，右手拿着电脑。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '车', pinyin: 'chē', meaning: 'Xe' },
        { hanzi: '机票', pinyin: 'jīpiào', meaning: 'Vé máy bay' },
        { hanzi: '书', pinyin: 'shū', meaning: 'Sách' },
        { hanzi: '姓名', pinyin: 'xìngmíng', meaning: 'Họ tên' },
        { hanzi: '高中', pinyin: 'gāozhōng', meaning: 'Cấp ba / THPT' },
        { hanzi: '学生', pinyin: 'xuésheng', meaning: 'Học sinh' },
      ],
      compounds: [
        { part1: '车', part2: '票', combinedHanzi: '车票', pinyin: 'chēpiào', meaning: 'Vé xe / Vé tàu' },
        { part1: '书', part2: '名', combinedHanzi: '书名', pinyin: 'shūmíng', meaning: 'Tựa đề sách' },
        { part1: '高中', part2: '生', combinedHanzi: '高中生', pinyin: 'gāozhōngshēng', meaning: 'Học sinh cấp 3' },
      ],
      discussion: {
        question: '“车票”、“书名” và “高中生” có nghĩa là gì?',
        answer: 'Vé đi các loại xe/tàu (车票), tên của một cuốn sách (书名), học sinh đang học bậc trung học phổ thông (高中生).',
      },
      exercises: [
        {
          id: 'w15_e1',
          sentenceWithBlank: '你记得那本书的（ ）吗？',
          pinyinSentence: 'Nǐ jìde nà běn shū de ( ) ma?',
          options: ['书名', '车票', '高中生'],
          correctAnswer: '书名',
          vietnameseTranslation: 'Bạn có nhớ tựa đề của cuốn sách đó là gì không?',
        },
        {
          id: "w15_e2",
          sentenceWithBlank: "非常（ ）各位老师对我的耐心帮助。",
          pinyinSentence: "Fēicháng ( ) gèwèi lǎoshī duì wǒ de nàixīn bāngzhù.",
          options: ["感谢", "欢迎", "留学"],
          correctAnswer: "感谢",
          vietnameseTranslation: "Vô cùng cảm ơn các thầy cô giáo đã tận tình giúp đỡ em.",
        },
        {
          id: "w15_e3",
          sentenceWithBlank: "他打算明年去中国（ ）。",
          pinyinSentence: "Tā dǎsuan míngnián qù Zhōngguó ( ).",
          options: ["留学", "感谢", "欢迎"],
          correctAnswer: "留学",
          vietnameseTranslation: "Anh ấy dự định năm sau sẽ sang Trung Quốc du học.",
        }
      ],
    },
    listeningExercises: [
      {
        id: "h2-l15-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Wǒmen jīntiān xuéxí dì 15 kè: 欢迎你来我们学校.",
        options: [
          {key: "A", textChinese: "Bài học 15", textVietnamese: "Nội dung bài 15", imageEmoji: "📖"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Wǒmen jīntiān xuéxí dì 15 kè: 欢迎你来我们学校.\" phù hợp với hình ảnh Bài học 15 (A).",
      },
      {
        id: "h2-l15-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.",
        options: [
          {key: "A", textChinese: "Mua sắm", textVietnamese: "Đi mua đồ", imageEmoji: "🛍️"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Tā zài shāngdiàn lǐ mǎi le hěn duō dōngxi.\" phù hợp với hình ảnh Mua sắm (A).",
      },
      {
        id: "h2-l15-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe câu và chọn hình ảnh phù hợp:",
        audioScript: "Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.",
        options: [
          {key: "A", textChinese: "Thư viện", textVietnamese: "Gặp nhau tại thư viện", imageEmoji: "📚"},
          {key: "B", textChinese: "其他选项", textVietnamese: "Khác", imageEmoji: "❓"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không liên quan", imageEmoji: "❌"}
        ],
        correctKey: "A",
        explanation: "Nội dung nghe được \"Míngtiān xiàwǔ wǒmen zài túshūguǎn jiàn.\" phù hợp với hình ảnh Thư viện (A).",
      },
      {
        id: "h2-l15-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhège zěnmeyàng? Nǚ: Fēicháng hǎo, wǒ hěn xǐhuan.",
        options: [
          {key: "A", textChinese: "Khen ngợi rất thích", textVietnamese: "Khen ngợi rất thích", imageEmoji: "👍"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Khen ngợi rất thích (A).",
      },
      {
        id: "h2-l15-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ shénme shíhou dào? Nǚ: Wǒ shí fēnzhōng hòu dào.",
        options: [
          {key: "A", textChinese: "10 phút nữa sẽ đến", textVietnamese: "10 phút nữa sẽ đến", imageEmoji: "⏱️"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh 10 phút nữa sẽ đến (A).",
      },
      {
        id: "h2-l15-l06",
        part: 2,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zěnme qù? Nǚ: Zuò dìtiě zuì fāngbiàn.",
        options: [
          {key: "A", textChinese: "Đi tàu điện ngầm tiện nhất", textVietnamese: "Đi tàu điện ngầm tiện nhất", imageEmoji: "🚇"},
          {key: "B", textChinese: "不符合", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "C", textChinese: "其他场景", textVietnamese: "Ngữ cảnh khác", imageEmoji: "🔄"}
        ],
        correctKey: "A",
        explanation: "Hội thoại nghe được phù hợp với hình ảnh Đi tàu điện ngầm tiện nhất (A).",
      },
      {
        id: "h2-l15-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Zhè jiàn yīfu duōshao qián? Nǚ: Yìbǎi bāshí kuài. (Hỏi: 这件衣服多少钱？)",
        options: [
          {key: "A", textChinese: "180块", textPinyin: "180 kuài", textVietnamese: "180 đồng"},
          {key: "B", textChinese: "150块", textPinyin: "150 kuài", textVietnamese: "150 đồng"},
          {key: "C", textChinese: "200块", textPinyin: "200 kuài", textVietnamese: "200 đồng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l15-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Nǐ míngtiān yǒu kòng ma? Nǚ: Yǒu kòng, wǒmen yìqǐ qù ba. (Hỏi: 女的明天有空吗？)",
        options: [
          {key: "A", textChinese: "有空", textPinyin: "Yǒu kòng", textVietnamese: "Có rảnh"},
          {key: "B", textChinese: "没空", textPinyin: "Méi kòng", textVietnamese: "Bận việc"},
          {key: "C", textChinese: "不知道", textPinyin: "Bù zhīdào", textVietnamese: "Không biết"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l15-l09",
        part: 3,
        questionNumber: 9,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Tā zài nǎr ne? Nǚ: Tā zài jiàoshì lǐ xuéxí ne. (Hỏi: 他在做什么？)",
        options: [
          {key: "A", textChinese: "在教室学习", textPinyin: "Zài jiàoshì xuéxí", textVietnamese: "Đang học trong lớp"},
          {key: "B", textChinese: "在睡觉", textPinyin: "Zài shuìjiào", textVietnamese: "Đang ngủ"},
          {key: "C", textChinese: "在打球", textPinyin: "Zài dǎqiú", textVietnamese: "Đang chơi bóng"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      },
      {
        id: "h2-l15-l10",
        part: 3,
        questionNumber: 10,
        promptText: "Nghe hội thoại và trả lời câu hỏi:",
        audioScript: "Nán: Jīntiān tiānqì zěnmeyàng? Nǚ: Tiānqì hěn hǎo, bù lěng yě bù rè. (Hỏi: 今天天气好吗？)",
        options: [
          {key: "A", textChinese: "很好", textPinyin: "Hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "B", textChinese: "很冷", textPinyin: "Hěn lěng", textVietnamese: "Rất lạnh"},
          {key: "C", textChinese: "下大雨", textPinyin: "Xià dà yǔ", textVietnamese: "Mưa to"}
        ],
        correctKey: "A",
        explanation: "Nội dung hội thoại xác nhận đáp án đúng là A.",
      }
    ],
    readingExercises: [
      {
        id: "h2-l15-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "这是我们今天学的新课文。",
        promptPinyin: "Zhè shì wǒmen jīntiān xué de xīn kèwén.",
        promptVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.",
        options: [
          {key: "A", textChinese: "Bài đọc sách giáo khoa", textVietnamese: "Đây là bài khóa mới chúng tôi học hôm nay.", imageEmoji: "📖✨"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"这是我们今天学的新课文。\" mô tả chính xác nội dung tranh A (Bài đọc sách giáo khoa).",
      },
      {
        id: "h2-l15-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "商店里有很多漂亮的水果和蔬菜。",
        promptPinyin: "Shāngdiàn li yǒu hěn duō piàoliang de shuǐguǒ hé shūcài.",
        promptVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.",
        options: [
          {key: "A", textChinese: "Cửa hàng rau quả tươi ngon", textVietnamese: "Trong cửa hàng có rất nhiều hoa quả và rau tươi.", imageEmoji: "🍎🥬"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"商店里有很多漂亮的水果和蔬菜。\" mô tả chính xác nội dung tranh A (Cửa hàng rau quả tươi ngon).",
      },
      {
        id: "h2-l15-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "周末和好朋友一起去爬山真开心。",
        promptPinyin: "Zhōumò hé hǎo péngyou yìqǐ qù páshān zhēn kāixīn.",
        promptVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.",
        options: [
          {key: "A", textChinese: "Leo núi dã ngoại ngày nghỉ", textVietnamese: "Cuối tuần cùng bạn tốt leo núi thật vui.", imageEmoji: "⛰️😄"},
          {key: "B", textChinese: "其他图片", textVietnamese: "Tranh khác", imageEmoji: "🖼️"},
          {key: "C", textChinese: "不相符", textVietnamese: "Không khớp", imageEmoji: "❌"},
          {key: "D", textChinese: "无关内容", textVietnamese: "Không liên quan", imageEmoji: "⚪"}
        ],
        correctKey: "A",
        explanation: "Câu \"周末和好朋友一起去爬山真开心。\" mô tả chính xác nội dung tranh A (Leo núi dã ngoại ngày nghỉ).",
      },
      {
        id: "h2-l15-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "请问这（    ）衣服多少钱？",
        promptPinyin: "qǐngwèn zhè (    ) yīfu duōshao qián?",
        promptVietnamese: "Xin hỏi chiếc áo này bao nhiêu tiền?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "A",
        explanation: "Điền từ 件 (jiàn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l15-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "这双鞋子有点儿（    ），有大一点儿的吗？",
        promptPinyin: "zhè shuāng xiézi yǒudiǎnr (    ), yǒu dà yìdiǎnr de ma?",
        promptVietnamese: "Đôi giày này hơi chật, có số to hơn không?",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "B",
        explanation: "Điền từ 小 (xiǎo) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l15-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "外面下雨了，出门记得带（    ）。",
        promptPinyin: "wàimiàn xià yǔ le, chūmén jìde dài (    ).",
        promptVietnamese: "Bên ngoài mưa rồi, ra cửa nhớ mang ô dù.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "C",
        explanation: "Điền từ 伞 (sǎn) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l15-r17",
        part: 2,
        questionNumber: 17,
        promptChinese: "今天我们班来了两位新（    ）。",
        promptPinyin: "jīntiān wǒmen bān lái le liǎng wèi xīn (    ).",
        promptVietnamese: "Hôm nay lớp chúng ta có 2 bạn học mới.",
        options: [
          {key: "A", textChinese: "件", textVietnamese: "chiếc áo"},
          {key: "B", textChinese: "双", textVietnamese: "đôi giày"},
          {key: "C", textChinese: "条", textVietnamese: "chiếc quần"},
          {key: "D", textChinese: "块", textVietnamese: "đồng tiền"},
          {key: "E", textChinese: "百", textVietnamese: "trăm"}
        ],
        correctKey: "D",
        explanation: "Điền từ 同学 (tóngxué) vào chỗ trống tạo thành câu hoàn chỉnh và đúng ngữ cảnh.",
      },
      {
        id: "h2-l15-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "你喜欢什么颜色的衣服？",
        promptPinyin: "Nǐ xǐhuan shénme yánsè de yīfu?",
        promptVietnamese: "Bạn thích quần áo màu gì?",
        options: [
          {key: "A", textChinese: "我最喜欢白色和蓝色的。", textPinyin: "Wǒ zuì xǐhuan báisè hé lánsè de.", textVietnamese: "Tôi thích nhất màu trắng và xanh lam."},
          {key: "B", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你喜欢什么颜色的衣服？\" đối đáp phù hợp nhất với phương án A: \"我最喜欢白色和蓝色的。\".",
      },
      {
        id: "h2-l15-r19",
        part: 3,
        questionNumber: 19,
        promptChinese: "周末打算去哪里玩？",
        promptPinyin: "Zhōumò dǎsuan qù nǎlǐ wán?",
        promptVietnamese: "Cuối tuần dự định đi đâu chơi?",
        options: [
          {key: "A", textChinese: "我想和家人去动物园看大熊猫。", textPinyin: "Wǒ xiǎng hé jiārén qù dòngwùyuán kàn dàxióngmāo.", textVietnamese: "Tôi muốn cùng gia đình đi sở thú xem gấu trúc."},
          {key: "B", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"周末打算去哪里玩？\" đối đáp phù hợp nhất với phương án A: \"我想和家人去动物园看大熊猫。\".",
      },
      {
        id: "h2-l15-r20",
        part: 3,
        questionNumber: 20,
        promptChinese: "这道数学题怎么做？",
        promptPinyin: "Zhè dào shùxué tí zěnme zuò?",
        promptVietnamese: "Bài toán này làm thế nào vậy?",
        options: [
          {key: "A", textChinese: "来，我给你讲一下步骤。", textPinyin: "Lái, wǒ gěi nǐ jiǎng yíxià bùzhòu.", textVietnamese: "Lại đây, tớ giảng các bước cho cậu nghe."},
          {key: "B", textChinese: "下个月放假的时候就回去。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"这道数学题怎么做？\" đối đáp phù hợp nhất với phương án A: \"来，我给你讲一下步骤。\".",
      },
      {
        id: "h2-l15-r21",
        part: 3,
        questionNumber: 21,
        promptChinese: "你什么时候回国？",
        promptPinyin: "Nǐ shénme shíhou huí guó?",
        promptVietnamese: "Khi nào bạn về nước?",
        options: [
          {key: "A", textChinese: "下个月放假的时候就回去。", textPinyin: "Xià gè yuè fàngjià de shíhou jiù huíqù.", textVietnamese: "Tháng sau nghỉ lễ là tớ về rồi."},
          {key: "B", textChinese: "我最喜欢白色和蓝色的。", textVietnamese: "Câu trả lời khác"},
          {key: "C", textChinese: "我想和家人去动物园看大熊猫。", textVietnamese: "Câu trả lời khác"},
          {key: "D", textChinese: "来，我给你讲一下步骤。", textVietnamese: "Câu trả lời khác"}
        ],
        correctKey: "A",
        explanation: "Câu hỏi/nói \"你什么时候回国？\" đối đáp phù hợp nhất với phương án A: \"下个月放假的时候就回去。\".",
      },
      {
        id: "h2-l15-r22",
        part: 4,
        questionNumber: 22,
        promptChinese: "学好汉语需要多听、多说、多读、多写。每天坚持练习半小时，日积月累，汉语水平就会不断提高。",
        promptPinyin: "",
        subPrompt: "★ 怎样才能学好汉语？",
        options: [
          {key: "A", textChinese: "每天坚持练习", textVietnamese: "Mỗi ngày kiên trì luyện tập"},
          {key: "B", textChinese: "只要看电影就行", textVietnamese: "Chỉ cần xem phim là được"},
          {key: "C", textChinese: "不用每天学习", textVietnamese: "Không cần học mỗi ngày"}
        ],
        correctKey: "A",
        explanation: "Học tốt tiếng Hán cần kiên trì luyện tập mỗi ngày (每天坚持练习) -> Đáp án A.",
      },
      {
        id: "h2-l15-r23",
        part: 4,
        questionNumber: 23,
        promptChinese: "中国有很多美丽的旅游城市，比如北京、上海、西安和成都。每个城市都有独特的文化和美味的特色小吃。",
        promptPinyin: "",
        subPrompt: "★ 这段话主要介绍了什么？",
        options: [
          {key: "A", textChinese: "中国的旅游城市", textVietnamese: "Các thành phố du lịch Trung Quốc"},
          {key: "B", textChinese: "中国的天气", textVietnamese: "Thời tiết Trung Quốc"},
          {key: "C", textChinese: "怎么坐火车", textVietnamese: "Cách đi tàu hỏa"}
        ],
        correctKey: "A",
        explanation: "Giới thiệu các thành phố du lịch đẹp ở Trung Quốc (中国的旅游城市) -> Đáp án A.",
      },
      {
        id: "h2-l15-r24",
        part: 4,
        questionNumber: 24,
        promptChinese: "友谊是人生中最宝贵的东西之一。在朋友遇到困难时给予帮助，不仅能让对方感到温暖，也能让彼此的友谊更加深厚。",
        promptPinyin: "",
        subPrompt: "★ 朋友遇到困难时应该怎么做？",
        options: [
          {key: "A", textChinese: "给予真诚帮助", textVietnamese: "Giúp đỡ chân thành"},
          {key: "B", textChinese: "假装不知道", textVietnamese: "Giả vờ không biết"},
          {key: "C", textChinese: "离开他", textVietnamese: "Bỏ rơi bạn bè"}
        ],
        correctKey: "A",
        explanation: "Giúp đỡ bạn khi khó khăn (给予帮助) -> Đáp án A.",
      }
    ],
    writingExercises: [
      {
        id: "h2-l15-w25",
        part: 1,
        questionNumber: 25,
        promptText: "根据部件组字: [ 覀 + 示 ]",
        givenComponent: "覀",
        targetComponents: [
          { key: "A", radical: "覀" },
          { key: "B", radical: "木" },
          { key: "C", radical: "夕" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "票",
        hanzi: "票",
        explanation: "覀 + 示 = 票 (piào - vé).",
      },
      {
        id: "h2-l15-w26",
        part: 1,
        questionNumber: 26,
        promptText: "根据部件组字: [ 木 + 几 ]",
        givenComponent: "木",
        targetComponents: [
          { key: "A", radical: "覀" },
          { key: "B", radical: "木" },
          { key: "C", radical: "夕" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "机",
        hanzi: "机",
        explanation: "木 + 几 = 机 (jī - máy móc, phi cơ).",
      },
      {
        id: "h2-l15-w27",
        part: 1,
        questionNumber: 27,
        promptText: "根据部件组字: [ 夕 + 口 ]",
        givenComponent: "夕",
        targetComponents: [
          { key: "A", radical: "覀" },
          { key: "B", radical: "木" },
          { key: "C", radical: "夕" },
          { key: "D", radical: "讠" }
        ],
        correctAnswer: "名",
        hanzi: "名",
        explanation: "夕 + 口 = 名 (míng - tên).",
      },
      {
        id: "h2-l15-w28",
        part: 2,
        questionNumber: 28,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他读（    ）中了。",
        pinyinGuide: "gāo",
        correctAnswer: "高",
        hanzi: "高",
        explanation: "高中 (gāozhōng) nghĩa là trường cấp 3 (trung học phổ thông).",
      },
      {
        id: "h2-l15-w29",
        part: 2,
        questionNumber: 29,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "走这条（    ）比较近。",
        pinyinGuide: "lù",
        correctAnswer: "路",
        hanzi: "路",
        explanation: "路 (lù) nghĩa là con đường.",
      },
      {
        id: "h2-l15-w30",
        part: 2,
        questionNumber: 30,
        promptText: "根据拼音写汉字 (Điền chữ Hán tương ứng với phiên âm):",
        sentenceContext: "他准备（    ）国留学。",
        pinyinGuide: "chū",
        correctAnswer: "出",
        hanzi: "出",
        explanation: "出国 (chūguó) nghĩa là ra nước ngoài.",
      }
    ],
  }
];

export const HSK2_OFFICIAL_MOCK_EXAM: MockExamQuestion[] = [
  // --- PHẦN 1: NGHE HIỂU (25 CÂU) ---
  {
    id: 'hsk2_mock_l1',
    section: 'listening',
    part: 1,
    questionNumber: 1,
    prompt: 'Nghe và chọn hình ảnh phù hợp (Câu 1)',
    audioScript: '这支笔是我昨天买的。',
    options: [
      { key: 'A', textChinese: 'Cây bút máy viết', imageEmoji: '🖊️' },
      { key: 'B', textChinese: 'Cốc gốm uống trà', imageEmoji: '🍵' },
      { key: 'C', textChinese: 'Cuốn sổ tay đỏ', imageEmoji: '📕' },
    ],
    correctAnswer: 'A',
    explanation: 'Khóa từ "这支笔" (Cây bút này) -> Hình A.',
  },
  {
    id: 'hsk2_mock_l2',
    section: 'listening',
    part: 1,
    questionNumber: 2,
    prompt: 'Nghe và chọn hình ảnh phù hợp (Câu 2)',
    audioScript: '他们两个都很喜欢跑步。',
    options: [
      { key: 'A', textChinese: 'Cậu bé dang hai tay chạy', imageEmoji: '🏃' },
      { key: 'B', textChinese: 'Bé gái đang vẽ tranh', imageEmoji: '🎨' },
      { key: 'C', textChinese: 'Bé gái múa ba lê', imageEmoji: '🩰' },
    ],
    correctAnswer: 'A',
    explanation: 'Khóa từ "喜欢跑步" (Thích chạy bộ) -> Hình A.',
  },
  {
    id: 'hsk2_mock_l3',
    section: 'listening',
    part: 1,
    questionNumber: 3,
    prompt: 'Nghe và chọn hình ảnh phù hợp (Câu 3)',
    audioScript: '他们一家人拿着行李去坐飞机。',
    options: [
      { key: 'A', textChinese: 'Mọi người đang họp máy tính', imageEmoji: '💻' },
      { key: 'B', textChinese: 'Gia đình kéo vali hành lý', imageEmoji: '🧳' },
      { key: 'C', textChinese: 'Làm việc nhóm thảo luận', imageEmoji: '👥' },
    ],
    correctAnswer: 'B',
    explanation: 'Khóa từ "行李" (hành lý) + "坐飞机" -> Hình B.',
  },
  {
    id: 'hsk2_mock_l4',
    section: 'listening',
    part: 1,
    questionNumber: 4,
    prompt: 'Nghe và chọn hình ảnh phù hợp (Câu 4)',
    audioScript: '小狗在桌子下面睡觉呢。',
    options: [
      { key: 'A', textChinese: 'Hai bé học bài', imageEmoji: '📚' },
      { key: 'B', textChinese: 'Hai người chạy bộ', imageEmoji: '🏃‍♂️' },
      { key: 'C', textChinese: 'Hai bé bơi phao', imageEmoji: '🏊' },
    ],
    correctAnswer: 'B',
    explanation: 'Khớp với hình vận động chạy thể thao.',
  },
  {
    id: 'hsk2_mock_l5',
    section: 'listening',
    part: 1,
    questionNumber: 5,
    prompt: 'Nghe và chọn hình ảnh phù hợp (Câu 5)',
    audioScript: '医生让他吃完药多喝水。',
    options: [
      { key: 'A', textChinese: 'Cầm thuốc uống nước', imageEmoji: '💊' },
      { key: 'B', textChinese: 'Bánh kem sinh nhật', imageEmoji: '🎂' },
      { key: 'C', textChinese: 'Đĩa sủi cảo nóng', imageEmoji: '🥟' },
    ],
    correctAnswer: 'A',
    explanation: 'Khóa từ "吃药" (uống thuốc) + "喝水" (uống nước) -> Hình A.',
  },
  {
    id: 'hsk2_mock_l16',
    section: 'listening',
    part: 3,
    questionNumber: 16,
    prompt: 'Nghe hội thoại, chọn đáp án đúng (Câu 16)',
    audioScript: '男：今天晚上你想去哪儿吃饭？ 女：家里还有菜，就在家里吃吧。 问：女的想在哪儿吃饭？',
    options: [
      { key: 'A', textChinese: '家里', textPinyin: 'jiā lǐ', textVietnamese: 'Ở nhà' },
      { key: 'B', textChinese: '饭馆', textPinyin: 'fànguǎn', textVietnamese: 'Quán ăn' },
      { key: 'C', textChinese: '电影院', textPinyin: 'diànyǐngyuàn', textVietnamese: 'Rạp chiếu phim' },
    ],
    correctAnswer: 'A',
    explanation: 'Người nữ trả lời "就在家里吃吧" (Ăn ở nhà đi) -> Đáp án A.',
  },

  // --- PHẦN 2: ĐỌC HIỂU (25 CÂU) ---
  {
    id: 'hsk2_mock_r26',
    section: 'reading',
    part: 1,
    questionNumber: 26,
    prompt: '26. 这家饭馆的鱼做得真不错！ (Món cá ở nhà hàng này nấu thực sự rất ngon!)',
    options: [
      { key: 'A', textChinese: 'Đồng hồ đeo tay sang trọng', imageEmoji: '⌚' },
      { key: 'B', textChinese: 'Người ốm nằm trên giường', imageEmoji: '🛌' },
      { key: 'C', textChinese: 'Đĩa cá hấp sốt ngon miệng', imageEmoji: '🐟' },
      { key: 'D', textChinese: 'Chơi bóng rổ', imageEmoji: '🏀' },
      { key: 'E', textChinese: 'Toa tàu điện ngầm', imageEmoji: '🚇' },
    ],
    correctAnswer: 'C',
    explanation: 'Khóa từ "饭馆的鱼" (Món cá nhà hàng) -> Hình C.',
  },
  {
    id: 'hsk2_mock_r27',
    section: 'reading',
    part: 1,
    questionNumber: 27,
    prompt: '27. 这间教室里没有人，我们进去学习吧。 (Phòng học này không có ai, chúng ta vào học đi.)',
    options: [
      { key: 'A', textChinese: 'Đồng hồ đeo tay', imageEmoji: '⌚' },
      { key: 'B', textChinese: 'Người ốm nằm', imageEmoji: '🛌' },
      { key: 'C', textChinese: 'Món cá', imageEmoji: '🐟' },
      { key: 'D', textChinese: 'Chơi bóng rổ', imageEmoji: '🏀' },
      { key: 'E', textChinese: 'Lớp học bàn ghế trống', imageEmoji: '🏫' },
    ],
    correctAnswer: 'E',
    explanation: 'Khóa từ "这间教室" (Phòng học này) -> Hình E.',
  },
  {
    id: 'hsk2_mock_r31',
    section: 'reading',
    part: 2,
    questionNumber: 31,
    prompt: '31. 你手里（ ）的是什么？',
    options: [
      { key: 'A', textChinese: '长 (cháng)' },
      { key: 'B', textChinese: '拿 (ná)' },
      { key: 'C', textChinese: '丈夫 (zhàngfu)' },
      { key: 'D', textChinese: '高中 (gāozhōng)' },
      { key: 'E', textChinese: '完 (wán)' },
      { key: 'F', textChinese: '告诉 (gàosu)' },
    ],
    correctAnswer: 'B',
    explanation: 'Trong tay cầm cái gì: 手里拿的 -> Điền 拿 (B).',
  },
  {
    id: 'hsk2_mock_r36',
    section: 'reading',
    part: 3,
    questionNumber: 36,
    prompt: '36. 请问，洗手间在哪儿？ (Xin hỏi nhà vệ sinh ở đâu?)',
    options: [
      { key: 'A', textChinese: '回来，我就回去过个年。' },
      { key: 'B', textChinese: '您出门往左走，很快就能看到。' },
      { key: 'C', textChinese: '我也做错了，我们一起去问老师吧。' },
      { key: 'D', textChinese: '这几天没有好看的电影，还是别去了吧。' },
      { key: 'E', textChinese: '他出去了，一会儿就回来。' },
    ],
    correctAnswer: 'B',
    explanation: 'Chỉ đường đến nhà vệ sinh: 您出门往左走... (B).',
  },
  {
    id: 'hsk2_mock_r46',
    section: 'reading',
    part: 4,
    questionNumber: 46,
    prompt: '虽然左边的花比右边的贵一些，但是颜色很好看，还是买左边的吧。 ★ 为什么买左边的花？',
    options: [
      { key: 'A', textChinese: '很便宜', textPinyin: 'hěn piányi' },
      { key: 'B', textChinese: '颜色多', textPinyin: 'yánsè duō' },
      { key: 'C', textChinese: '好看', textPinyin: 'hǎokàn' },
    ],
    correctAnswer: 'C',
    explanation: 'Trong đoạn văn: "但是颜色很好看" -> Chọn 好看 (C).',
  },

  // --- PHẦN 3: VIẾT (书写 - 10 CÂU) ---
  {
    id: 'hsk2_mock_w51',
    section: 'reading', // classified under mock test
    part: 1,
    questionNumber: 51,
    prompt: '51. Ghép bộ kiện tạo chữ Hán: [ 邦 + 忙 -> 帮忙 (帮: 邦 + 巾) ]',
    options: [
      { key: 'A', textChinese: '灬' },
      { key: 'B', textChinese: '纟' },
      { key: 'C', textChinese: '亻' },
      { key: 'D', textChinese: '巾' },
      { key: 'E', textChinese: '十' },
      { key: 'F', textChinese: '忄' },
    ],
    correctAnswer: 'D',
    explanation: 'Chữ 帮 gồm bộ kiện 邦 ở trên và 巾 ở dưới -> Đáp án D.',
  },
  {
    id: 'hsk2_mock_w56',
    section: 'reading',
    part: 2,
    questionNumber: 56,
    prompt: '56. 我到（ xué ）校门口了，你呢？ (Viết chữ Hán thay cho phiên âm xué)',
    options: [
      { key: 'A', textChinese: '学 (xué)' },
      { key: 'B', textChinese: '雪 (xuě)' },
      { key: 'C', textChinese: '写 (xiě)' },
    ],
    correctAnswer: 'A',
    explanation: 'xué xiào -> 学校 (Trường học) -> Chữ 学 (A).',
  },
  {
    id: 'hsk2_mock_w57',
    section: 'reading',
    part: 2,
    questionNumber: 57,
    prompt: '57. 这次考试他考了第一（ míng ）。 (Viết chữ Hán thay cho phiên âm míng)',
    options: [
      { key: 'A', textChinese: '名 (míng)' },
      { key: 'B', textChinese: '明 (míng)' },
      { key: 'C', textChinese: '民 (mín)' },
    ],
    correctAnswer: 'A',
    explanation: 'dì-yī míng -> 第一名 (Hạng nhất) -> Chữ 名 (A).',
  },
];
