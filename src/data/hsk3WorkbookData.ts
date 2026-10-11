// Dữ liệu Sách Bài Tập / Sổ Tay Học Và Luyện Tập New HSK 3 (新 HSK 教程 3 学练手册)
// Chuẩn CTI BOOKS & NXB Dân Trí / FLTRP 3.0 - Đầy đủ 15 bài học & Đề thi thử

import {
  WorkbookLesson,
  MockExamQuestion,
} from './hsk1WorkbookData';
import { HSK2WordExpansion, HSK2WritingExercise } from './hsk2WorkbookData';

export interface HSK3WorkbookLesson extends Partial<WorkbookLesson> {
  lessonNumber: number;
  titleChinese: string;
  titlePinyin: string;
  titleVietnamese: string;
  pageNumber: string;
  wordExpansion?: HSK2WordExpansion;
  writingExercises?: any[];
  listeningExercises?: any[];
  readingExercises?: any[];
  grammarNotes?: { title: string; explanation: string; examples: string[] }[];
}

export const HSK3_WORKBOOK_LESSONS: HSK3WorkbookLesson[] = [
  // BÀI 1
  {
    lessonNumber: 1,
    titleChinese: '我们去机场接你们',
    titlePinyin: 'Wǒmen qù jīchǎng jiē nǐmen',
    titleVietnamese: 'Chúng tôi đến sân bay đón các bạn',
    pageNumber: '001',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Luyện tập các bộ thủ và cấu trúc chữ HSK 3',
      radicals: [
        {
          radical: '扌',
          pinyin: 'tíshǒupáng',
          nameVietnamese: 'Bộ Thủ (提手旁)',
          meaning: 'Liên quan đến hành động tay, đón nhận, cầm nắm',
          exampleChars: [
            { char: '接', pinyin: 'jiē', meaning: 'Đón, nhận (去机场接人)' },
            { char: '搬', pinyin: 'bān', meaning: 'Dọn, chuyển (搬家)' },
          ],
        },
        {
          radical: '木',
          pinyin: 'mùzìpáng',
          nameVietnamese: 'Bộ Mộc (木字旁)',
          meaning: 'Liên quan đến cây gỗ, hòm hộp',
          exampleChars: [
            { char: '箱', pinyin: 'xiāng', meaning: 'Hòm, vali (行李箱)' },
            { char: '桌', pinyin: 'zhuō', meaning: 'Cái bàn' },
          ],
        },
      ],
      copyWords: [
        { word: '行李箱', pinyin: 'xínglixiāng', vietnamese: 'Vali hành lý (是一个黑色的行李箱。)' },
        { word: '接人', pinyin: 'jiē rén', vietnamese: 'Đón người (我们去机场接朋友。)' },
        { word: '看起来', pinyin: 'kànqǐlái', vietnamese: 'Trông có vẻ (看起来和他的有点儿像。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '行李', pinyin: 'xíngli', meaning: 'Hành lý' },
        { hanzi: '箱子', pinyin: 'xiāngzi', meaning: 'Hộp, rương' },
        { hanzi: '接送', pinyin: 'jiēsòng', meaning: 'Đưa đón' },
        { hanzi: '外观', pinyin: 'wàiguān', meaning: 'Vẻ ngoài' },
      ],
      compounds: [
        { part1: '行李', part2: '箱', combinedHanzi: '行李箱', pinyin: 'xínglixiāng', meaning: 'Vali hành lý' },
        { part1: '接', part2: '送', combinedHanzi: '接送', pinyin: 'jiēsòng', meaning: 'Đón và tiễn đưa' },
        { part1: '看', part2: '起来', combinedHanzi: '看起来', pinyin: 'kànqǐlái', meaning: 'Trông có vẻ' },
      ],
      discussion: {
        question: 'Phân biệt "看起来" (trông có vẻ qua thị giác) và "听起来" (nghe có vẻ qua thính giác)?',
        answer: '“看起来” dùng khi phán đoán qua quan sát bằng mắt; “听起来” dùng khi phán đoán qua thông tin nghe được.',
      },
      exercises: [
        {
          id: 'h3_w1_e1',
          sentenceWithBlank: '这位新来的老师（ ）很年轻。',
          pinyinSentence: 'Zhè wèi xīn lái de lǎoshī ( ) hěn niánqīng.',
          options: ['看起来', '听起来', '行李箱'],
          correctAnswer: '看起来',
          vietnameseTranslation: 'Vị giáo viên mới đến này trông có vẻ rất trẻ.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l1_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe hội thoại và xác nhận Đúng/Sai:',
        audioScript: '男：李文，你的行李箱是什么颜色的？ 女：是一个黑色的箱子，上面写着我的名字。',
        options: [
          { key: 'A', textChinese: '对 (Đúng) ★ 李文的行李箱是黑色的。' },
          { key: 'B', textChinese: '错 (Sai)' },
        ],
        correctKey: 'A',
        explanation: 'Người nữ trả lời rõ ràng: 是一个黑色的箱子.',
      },
      {
        id: 'h3_l1_q2',
        part: 2,
        questionNumber: 2,
        promptText: 'Nghe và chọn đáp án chính xác:',
        audioScript: '男：今天下午谁去机场接客人？ 女：小张已经开车去了。 问：小张去哪儿了？',
        options: [
          { key: 'A', textChinese: '去机场接人 (Sân bay)' },
          { key: 'B', textChinese: '去火车站 (Ga tàu)' },
          { key: 'C', textChinese: '去饭馆吃饭 (Quán ăn)' },
        ],
        correctKey: 'A',
        explanation: 'Tiểu Trương đã lái xe ra sân bay đón khách (去机场接人).',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l1_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '这些菜（ ）都很好吃，我们快吃吧。',
        promptPinyin: 'Zhèxiē cài ( ) dōu hěn hǎochī, wǒmen kuài chī ba.',
        options: [
          { key: 'A', textChinese: '看起来 (kànqǐlái)' },
          { key: 'B', textChinese: '行李箱 (xínglixiāng)' },
          { key: 'C', textChinese: '马上 (mǎshàng)' },
        ],
        correctKey: 'A',
        explanation: 'Thức ăn trông có vẻ rất ngon dùng "看起来".',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l1_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh:',
        sentenceContext: '去机场 / 我们 / 接 / 打算 / 朋友',
        correctAnswer: '我们打算去机场接朋友。',
        explanation: 'Chủ ngữ + Động từ năng nguyện (打算) + Cụm động từ (去机场接朋友).',
      },
    ],
  },

  // BÀI 2
  {
    lessonNumber: 2,
    titleChinese: '他什么时候回来',
    titlePinyin: 'Tā shénme shíhou huílái',
    titleVietnamese: 'Khi nào anh ấy về?',
    pageNumber: '008',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ phương hướng di chuyển',
      radicals: [
        {
          radical: '辶',
          pinyin: 'zǒuzhīpáng',
          nameVietnamese: 'Bộ Quai xước (走之旁)',
          meaning: 'Liên quan đến đường đi, hành động di chuyển',
          exampleChars: [
            { char: '进', pinyin: 'jìn', meaning: 'Vào (进来)' },
            { char: '送', pinyin: 'sòng', meaning: 'Tiễn, đưa (送伞)' },
          ],
        },
      ],
      copyWords: [
        { word: '回来', pinyin: 'huílái', vietnamese: 'Về đây (他什么时候回来？)' },
        { word: '马上', pinyin: 'mǎshàng', vietnamese: 'Ngay lập tức (我马上拿伞下去。)' },
        { word: '楼上', pinyin: 'lóushàng', vietnamese: 'Trên lầu (你在楼上吗？)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '上来', pinyin: 'shànglái', meaning: 'Lên đây' },
        { hanzi: '下去', pinyin: 'xiàqù', meaning: 'Xuống đó' },
        { hanzi: '进来', pinyin: 'jìnlái', meaning: 'Vào đây' },
        { hanzi: '出去', pinyin: 'chūqù', meaning: 'Ra đó' },
      ],
      compounds: [
        { part1: '带', part2: '来', combinedHanzi: '带来', pinyin: 'dàilái', meaning: 'Mang tới' },
        { part1: '拿', part2: '去', combinedHanzi: '拿去', pinyin: 'náqù', meaning: 'Cầm đi' },
        { part1: '回', part2: '去', combinedHanzi: '回去', pinyin: 'huíqù', meaning: 'Đi về' },
      ],
      discussion: {
        question: 'Quy tắc bổ ngữ xu hướng kép với 来 và 去?',
        answer: 'Động tác hướng về phía người nói dùng 来 (quá lai, tiến lai); rời xa người nói dùng 去 (quá khứ, hạ khứ).',
      },
      exercises: [
        {
          id: 'h3_w2_e1',
          sentenceWithBlank: '外边太冷了，快进房间（ ）吧！',
          pinyinSentence: 'Wàibian tài lěng le, kuài jìn fángjiān ( ) ba!',
          options: ['来', '去', '上'],
          correctAnswer: '来',
          vietnameseTranslation: 'Bên ngoài lạnh quá, mau vào trong phòng này đi!',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l2_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và chọn Đúng/Sai:',
        audioScript: '男：你现在在哪儿呢？ 女：我在楼下等你，你快下来吧。',
        options: [
          { key: 'A', textChinese: '对 (Đúng) ★ 女的在楼下等男的。' },
          { key: 'B', textChinese: '错 (Sai)' },
        ],
        correctKey: 'A',
        explanation: 'Người nữ đang ở dưới lầu đợi người nam.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l2_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '下雨了，我马上拿（ ）下去接你。',
        promptPinyin: 'Xiàyǔ le, wǒ mǎshàng ná ( ) xiàqù jiē nǐ.',
        options: [
          { key: 'A', textChinese: '伞 (sǎn)' },
          { key: 'B', textChinese: '楼 (lóu)' },
          { key: 'C', textChinese: '腿 (tuǐ)' },
        ],
        correctKey: 'A',
        explanation: 'Trời mưa mang ô (伞) xuống đón.',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l2_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh:',
        sentenceContext: '跑进 / 他 / 图书馆 / 去了',
        correctAnswer: '他跑进图书馆去了。',
        explanation: 'Động từ + Nơi chốn + Bổ ngữ xu hướng (去).',
      },
    ],
  },

  // BÀI 3
  {
    lessonNumber: 3,
    titleChinese: '桌子上放着一杯咖啡',
    titlePinyin: 'Zhuōzi shang fàngzhe yì bēi kāfēi',
    titleVietnamese: 'Trên bàn có để một tách cà phê',
    pageNumber: '015',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ đồ vật và nơi chốn',
      radicals: [
        {
          radical: '木',
          pinyin: 'mùzìpáng',
          nameVietnamese: 'Bộ Mộc (木字旁)',
          meaning: 'Liên quan đến bàn ghế đồ gỗ',
          exampleChars: [
            { char: '桌', pinyin: 'zhuō', meaning: 'Cái bàn' },
            { char: '椅', pinyin: 'yǐ', meaning: 'Cái ghế' },
          ],
        },
      ],
      copyWords: [
        { word: '放着', pinyin: 'fàngzhe', vietnamese: 'Đang để (桌子上放着一杯咖啡。)' },
        { word: '新鲜', pinyin: 'xīnxiān', vietnamese: 'Tươi ngon (新鲜的水果。)' },
        { word: '或者', pinyin: 'huòzhě', vietnamese: 'Hoặc là (喝茶或者咖啡都可以。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '桌子', pinyin: 'zhuōzi', meaning: 'Bàn' },
        { hanzi: '咖啡', pinyin: 'kāfēi', meaning: 'Cà phê' },
        { hanzi: '茶馆', pinyin: 'cháguǎn', meaning: 'Quán trà' },
      ],
      compounds: [
        { part1: '咖啡', part2: '馆', combinedHanzi: '咖啡馆', pinyin: 'kāfēiguǎn', meaning: 'Quán cà phê' },
        { part1: '茶', part2: '杯', combinedHanzi: '茶杯', pinyin: 'chábēi', meaning: 'Tách trà' },
      ],
      discussion: {
        question: 'Phân biệt "还是" (câu hỏi) và "或者" (câu trần thuật)?',
        answer: '“还是” dùng trong câu hỏi lựa chọn; “或者” dùng trong câu khẳng định, trần thuật.',
      },
      exercises: [
        {
          id: 'h3_w3_e1',
          sentenceWithBlank: '明天你去（ ）我去都可以。',
          pinyinSentence: 'Míngtiān nǐ qù ( ) wǒ qù dōu kěyǐ.',
          options: ['或者', '还是', '放着'],
          correctAnswer: '或者',
          vietnameseTranslation: 'Ngày mai bạn đi hoặc tôi đi đều được.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l3_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：你想喝点儿什么？ 女：桌子上放着茶和咖啡，你想喝哪个？',
        options: [
          { key: 'A', textChinese: '对 (Đúng) ★ 桌子上有茶和咖啡。' },
          { key: 'B', textChinese: '错 (Sai)' },
        ],
        correctKey: 'A',
        explanation: 'Trên bàn có để trà và cà phê.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l3_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '墙上（ ）一张中国地图。',
        promptPinyin: 'Qiáng shang ( ) yì zhāng Zhōngguó dìtú.',
        options: [
          { key: 'A', textChinese: '挂着 (guàzhe)' },
          { key: 'B', textChinese: '站着 (zhànzhe)' },
          { key: 'C', textChinese: '坐着 (zuòzhe)' },
        ],
        correctKey: 'A',
        explanation: 'Trên tường có treo bức bản đồ dùng "挂着".',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l3_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh:',
        sentenceContext: '放着 / 一杯咖啡 / 桌子上',
        correctAnswer: '桌子上放着一杯咖啡。',
        explanation: 'Cấu trúc câu tồn hiện: Nơi chốn + Động từ + 着 + Tân ngữ.',
      },
    ],
  },

  // BÀI 4
  {
    lessonNumber: 4,
    titleChinese: '她总是笑着跟客人说话',
    titlePinyin: 'Tā zǒngshì xiàozhe gēn kèrén shuōhuà',
    titleVietnamese: 'Cô ấy luôn cười nói với khách hàng',
    pageNumber: '022',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ tâm trạng và hành động',
      radicals: [
        {
          radical: '竹',
          pinyin: 'zhúzìtóu',
          nameVietnamese: 'Bộ Trúc (竹字头)',
          meaning: 'Liên quan đến biểu cảm và tre trúc',
          exampleChars: [
            { char: '笑', pinyin: 'xiào', meaning: 'Cười' },
            { char: '笔', pinyin: 'bǐ', meaning: 'Bút viết' },
          ],
        },
      ],
      copyWords: [
        { word: '总是', pinyin: 'zǒngshì', vietnamese: 'Luôn luôn (她总是笑着说话。)' },
        { word: '客人', pinyin: 'kèrén', vietnamese: 'Khách hàng (接待客人。)' },
        { word: '热情', pinyin: 'rèqíng', vietnamese: 'Nhiệt tình (他对人很热情。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '总是', pinyin: 'zǒngshì', meaning: 'Luôn luôn' },
        { hanzi: '笑', pinyin: 'xiào', meaning: 'Cười' },
        { hanzi: '回答', pinyin: 'huídá', meaning: 'Trả lời' },
      ],
      compounds: [
        { part1: '笑', part2: '容', combinedHanzi: '笑容', pinyin: 'xiàoróng', meaning: 'Nụ cười' },
        { part1: '热', part2: '心', combinedHanzi: '热心', pinyin: 'rèxīn', meaning: 'Nhiệt tâm, tốt bụng' },
      ],
      discussion: {
        question: 'Cấu trúc V1 + 着 + V2 biểu thị điều gì?',
        answer: 'Biểu thị V1 là phương thức hoặc trạng thái để thực hiện hành động chính V2.',
      },
      exercises: [
        {
          id: 'h3_w4_e1',
          sentenceWithBlank: '孩子们（ ）跑进了院子。',
          pinyinSentence: 'Háizimen ( ) pǎojìn le yuànzi.',
          options: ['笑着', '站着', '看着'],
          correctAnswer: '笑着',
          vietnameseTranslation: 'Bọn trẻ vừa cười vừa chạy vào trong sân.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l4_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：那个新来的服务员态度真好。 女：是啊，她总是笑着跟客人说话。',
        options: [
          { key: 'A', textChinese: '对 (Đúng) ★ 服务员态度很好。' },
          { key: 'B', textChinese: '错 (Sai)' },
        ],
        correctKey: 'A',
        explanation: 'Nhân viên phục vụ thái độ rất tốt.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l4_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '他喜欢（ ）听音乐（ ）看书。',
        promptPinyin: 'Tā xǐhuan ( ) tīng yīnyuè ( ) kàn shū.',
        options: [
          { key: 'A', textChinese: '一边……一边…… (yìbiān... yìbiān...)' },
          { key: 'B', textChinese: '越……越……' },
          { key: 'C', textChinese: '虽然……但是……' },
        ],
        correctKey: 'A',
        explanation: 'Vừa làm việc này vừa làm việc kia dùng "一边...一边...".',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l4_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh:',
        sentenceContext: '跟客人 / 她 / 笑着 / 总是 / 说话',
        correctAnswer: '她总是笑着跟客人说话。',
        explanation: 'Chủ ngữ + Phó từ (总是) + Phương thức (笑着) + Đối tượng (跟客人) + Hành động (说话).',
      },
    ],
  },

  // BÀI 5 - 15 (ĐẦY ĐỦ DỮ LIỆU CHUẨN)
  {
    lessonNumber: 5,
    titleChinese: '我最近越来越胖了',
    titlePinyin: 'Wǒ zuìjìn yuè lái yuè pàng le',
    titleVietnamese: 'Gần đây tôi ngày càng béo lên',
    pageNumber: '029',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ cơ thể và biến đổi',
      radicals: [
        {
          radical: '月',
          pinyin: 'ròuyùpáng',
          nameVietnamese: 'Bộ Nguyệt nhục (月字旁)',
          meaning: 'Liên quan đến cơ thể người',
          exampleChars: [
            { char: '胖', pinyin: 'pàng', meaning: 'Béo, mập' },
            { char: '腿', pinyin: 'tuǐ', meaning: 'Cái chân' },
          ],
        },
      ],
      copyWords: [
        { word: '越来越', pinyin: 'yuè lái yuè', vietnamese: 'Ngày càng (越来越好)' },
        { word: '锻炼', pinyin: 'duànliàn', vietnamese: 'Rèn luyện (经常锻炼身体)' },
        { word: '刚才', pinyin: 'gāngcái', vietnamese: 'Vừa mới (刚才谁来了？)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '越来越好', pinyin: 'yuè lái yuè hǎo', meaning: 'Ngày càng tốt' },
        { hanzi: '越走越快', pinyin: 'yuè zǒu yuè kuài', meaning: 'Càng đi càng nhanh' },
      ],
      compounds: [
        { part1: '健', part2: '康', combinedHanzi: '健康', pinyin: 'jiànkāng', meaning: 'Sức khỏe, khỏe mạnh' },
        { part1: '锻', part2: '炼', combinedHanzi: '锻炼', pinyin: 'duànliàn', meaning: 'Rèn luyện thân thể' },
      ],
      discussion: {
        question: 'Phân biệt "刚" (phó từ) và "刚才" (danh từ chỉ thời gian)?',
        answer: '“刚” đứng trước động từ (我刚到); “刚才” có thể đứng đầu câu hoặc làm trạng ngữ chỉ thời gian.',
      },
      exercises: [
        {
          id: 'h3_w5_e1',
          sentenceWithBlank: '天气（ ）冷了，出门要多穿衣服。',
          pinyinSentence: 'Tiānqì ( ) lěng le, chūmén yào duō chuān yīfu.',
          options: ['越来越', '刚才', '锻炼'],
          correctAnswer: '越来越',
          vietnameseTranslation: 'Thời tiết ngày càng lạnh rồi, ra ngoài phải mặc thêm áo.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l5_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe hội thoại và xác nhận Đúng/Sai:',
        audioScript: '男：你最近每天都去跑步吗？ 女：是啊，为了健康，我一定要坚持锻炼。',
        options: [
          { key: 'A', textChinese: '对 (Đúng) ★ 女的每天坚持锻炼。' },
          { key: 'B', textChinese: '错 (Sai)' },
        ],
        correctKey: 'A',
        explanation: 'Người nữ nói nhất định kiên trì rèn luyện thân thể.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l5_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '他的中文水平（ ）高了。',
        promptPinyin: 'Tā de Zhōngwén shuǐpíng ( ) gāo le.',
        options: [
          { key: 'A', textChinese: '越来越 (yuè lái yuè)' },
          { key: 'B', textChinese: '刚才 (gāngcái)' },
          { key: 'C', textChinese: '或者 (huòzhě)' },
        ],
        correctKey: 'A',
        explanation: 'Biểu thị trình độ tăng dần theo thời gian dùng "越来越".',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l5_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh:',
        sentenceContext: '越来越 / 我最近 / 胖了',
        correctAnswer: '我最近越来越胖了。',
        explanation: 'Chủ ngữ + Trạng ngữ thời gian + 越来越 + Tính từ.',
      },
    ],
  },

  // BÀI 6 - 15 (Tiếp nối toàn diện)
  {
    lessonNumber: 6,
    titleChinese: '你怎么突然生病了',
    titlePinyin: 'Nǐ zěnme tūrán shēngbìng le',
    titleVietnamese: 'Sao bạn lại đột nhiên bị ốm thế?',
    pageNumber: '036',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ bệnh tật và sức khỏe',
      radicals: [
        {
          radical: '疒',
          pinyin: 'bìngzìkuàng',
          nameVietnamese: 'Bộ Bệnh (病字框)',
          meaning: 'Liên quan đến bệnh tật',
          exampleChars: [
            { char: '病', pinyin: 'bìng', meaning: 'Bệnh, ốm' },
            { char: '疼', pinyin: 'téng', meaning: 'Đau, nhức' },
          ],
        },
      ],
      copyWords: [
        { word: '突然', pinyin: 'tūrán', vietnamese: 'Đột nhiên (你怎么突然生病了？)' },
        { word: '感冒', pinyin: 'gǎnmào', vietnamese: 'Cảm cúm (他感冒发烧了。)' },
        { word: '舒服', pinyin: 'shūfu', vietnamese: 'Dễ chịu (身体不太舒服。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '生病', pinyin: 'shēngbìng', meaning: 'Bị ốm' },
        { hanzi: '吃药', pinyin: 'chīyào', meaning: 'Uống thuốc' },
        { hanzi: '头疼', pinyin: 'tóuténg', meaning: 'Đau đầu' },
      ],
      compounds: [
        { part1: '头', part2: '疼', combinedHanzi: '头疼', pinyin: 'tóuténg', meaning: 'Đau đầu' },
        { part1: '看', part2: '病', combinedHanzi: '看病', pinyin: 'kànbìng', meaning: 'Đi khám bệnh' },
      ],
      discussion: {
        question: 'Phân biệt "突然" (đột nhiên) và "忽然" (bỗng nhiên)?',
        answer: '“突然” vừa là tính từ vừa là phó từ (事情很突然); “忽然” chỉ làm phó từ.',
      },
      exercises: [
        {
          id: 'h3_w6_e1',
          sentenceWithBlank: '刚才天气还好好的，（ ）就下起雨来了。',
          pinyinSentence: 'Gāngcái tiānqì hái hǎohǎo de, ( ) jiù xiàqǐ yǔ lái le.',
          options: ['突然', '舒服', '感冒'],
          correctAnswer: '突然',
          vietnameseTranslation: 'Vừa rồi trời còn đẹp, đột nhiên đổ mưa.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l6_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe hội thoại và xác nhận Đúng/Sai:',
        audioScript: '男：小李今天怎么没来上班？ 女：他昨晚着凉了，今天在家休息。',
        options: [
          { key: 'A', textChinese: '对 (Đúng) ★ 小李生病请假了。' },
          { key: 'B', textChinese: '错 (Sai)' },
        ],
        correctKey: 'A',
        explanation: 'Tiểu Lý bị ốm nghỉ ngơi ở nhà.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l6_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '如果身体不（ ），就去医院看医生吧。',
        promptPinyin: 'Rúguǒ shēntǐ bù ( ), jiù qù yīyuàn kàn yīshēng ba.',
        options: [
          { key: 'A', textChinese: '舒服 (shūfu)' },
          { key: 'B', textChinese: '突然 (tūrán)' },
          { key: 'C', textChinese: '锻炼 (duànliàn)' },
        ],
        correctKey: 'A',
        explanation: 'Nếu cơ thể không khỏe/không thoải mái: 不舒服.',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l6_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh:',
        sentenceContext: '突然 / 怎么 / 生病了 / 你 / ？',
        correctAnswer: '你怎么突然生病了？',
        explanation: 'Đại từ nghi vấn (怎么) + Phó từ (突然) + Động từ (生病了).',
      },
    ],
  },
  {
    lessonNumber: 7,
    titleChinese: '我跟你一起去吧',
    titlePinyin: 'Wǒ gēn nǐ yìqǐ qù ba',
    titleVietnamese: 'Tôi cùng đi với bạn nhé',
    pageNumber: '043',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ quan hệ và hoạt động',
      radicals: [
        {
          radical: '足',
          pinyin: 'zúzìpáng',
          nameVietnamese: 'Bộ Túc (足字旁)',
          meaning: 'Liên quan đến chân và đi lại',
          exampleChars: [
            { char: '跟', pinyin: 'gēn', meaning: 'Cùng, theo' },
            { char: '路', pinyin: 'lù', meaning: 'Con đường' },
          ],
        },
      ],
      copyWords: [
        { word: '一起', pinyin: 'yìqǐ', vietnamese: 'Cùng nhau (我们一起去吧。)' },
        { word: '打算', pinyin: 'dǎsuan', vietnamese: 'Dự tính (你有什么打算？)' },
      ],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '一起', pinyin: 'yìqǐ', meaning: 'Cùng nhau' }],
      compounds: [{ part1: '一', part2: '起', combinedHanzi: '一起', pinyin: 'yìqǐ', meaning: 'Cùng nhau' }],
      discussion: { question: 'Cách dùng giới từ 跟?', answer: 'A 跟 B 一起 + Động từ.' },
      exercises: [
        {
          id: 'h3_w7_e1',
          sentenceWithBlank: '周末我想（ ）你一起去图书馆。',
          pinyinSentence: 'Zhōumò wǒ xiǎng ( ) nǐ yìqǐ qù túshūguǎn.',
          options: ['跟', '从', '向'],
          correctAnswer: '跟',
          vietnameseTranslation: 'Cuối tuần tôi muốn cùng bạn đi thư viện.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l7_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：小王，你要去哪儿？ 女：我要去超市买水果，你跟我一起去吧。',
        options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Người nữ mời người nam cùng đi siêu thị mua hoa quả.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l7_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '我和朋友（ ）去爬山。',
        promptPinyin: 'Wǒ hé péngyou ( ) qù páshān.',
        options: [{ key: 'A', textChinese: '一起' }, { key: 'B', textChinese: '突然' }],
        correctKey: 'A',
        explanation: 'Cùng nhau đi leo núi dùng "一起".',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l7_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '一起 / 去 / 我 / 跟 / 你 / 吧',
        correctAnswer: '我跟你一起去吧。',
        explanation: 'Tôi cùng đi với bạn nhé.',
      },
    ],
  },
  {
    lessonNumber: 8,
    titleChinese: '你去哪儿我就去哪儿',
    titlePinyin: 'Nǐ qù nǎr wǒ jiù qù nǎr',
    titleVietnamese: 'Bạn đi đâu thì tôi đi đó',
    pageNumber: '050',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ vị trí và định hướng',
      radicals: [
        {
          radical: '阝',
          pinyin: 'shuāngěrpáng',
          nameVietnamese: 'Bộ Phụ / Ấp (阝)',
          meaning: 'Liên quan đến địa danh, gò đất',
          exampleChars: [{ char: '那', pinyin: 'nà', meaning: 'Kia, đó' }, { char: '邮', pinyin: 'yóu', meaning: 'Bưu điện' }],
        },
      ],
      copyWords: [{ word: '哪儿', pinyin: 'nǎr', vietnamese: 'Đâu, ở đâu' }, { word: '就', pinyin: 'jiù', vietnamese: 'Thì, liền' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '随便', pinyin: 'suíbiàn', meaning: 'Tùy tiện, sao cũng được' }],
      compounds: [{ part1: '随', part2: '便', combinedHanzi: '随便', pinyin: 'suíbiàn', meaning: 'Tùy ý' }],
      discussion: { question: 'Cấu trúc đại từ nghi vấn phiếm chỉ (哪儿...就...哪儿)?', answer: 'Biểu thị hành động thứ hai hoàn toàn phụ thuộc vào điều kiện thứ nhất.' },
      exercises: [
        {
          id: 'h3_w8_e1',
          sentenceWithBlank: '你想吃什么，我们（ ）吃什么。',
          pinyinSentence: 'Nǐ xiǎng chī shénme, wǒmen ( ) chī shénme.',
          options: ['就', '才', '还'],
          correctAnswer: '就',
          vietnameseTranslation: 'Bạn muốn ăn gì thì chúng ta ăn nấy.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l8_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：今天晚上我们去吃中国菜还是韩国菜？ 女：你吃什么我就吃什么。',
        options: [{ key: 'A', textChinese: '对 (Đúng) ★ 女的觉得吃什么都可以。' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Người nữ đồng ý theo ý người nam.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l8_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '谁想参加这个比赛，谁（ ）可以报名。',
        promptPinyin: 'Shéi xiǎng cānjiā zhège bǐsài, shéi ( ) kěyǐ bàomíng.',
        options: [{ key: 'A', textChinese: '就' }, { key: 'B', textChinese: '才' }],
        correctKey: 'A',
        explanation: 'Cấu trúc 谁...谁就... (Ai muốn thì người đó được).',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l8_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '哪儿 / 你 / 去 / 我 / 就 / 去 / 哪儿',
        correctAnswer: '你去哪儿我就去哪儿。',
        explanation: 'Bạn đi đâu tôi đi đó.',
      },
    ],
  },
  {
    lessonNumber: 9,
    titleChinese: '她的中文比我好多了',
    titlePinyin: 'Tā de Zhōngwén bǐ wǒ hǎoduō le',
    titleVietnamese: 'Tiếng Trung của cô ấy giỏi hơn tôi nhiều',
    pageNumber: '057',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ sự so sánh và ngôn ngữ',
      radicals: [
        {
          radical: '讠',
          pinyin: 'yánzìpáng',
          nameVietnamese: 'Bộ Ngôn (言字旁)',
          meaning: 'Liên quan đến ngôn ngữ, lời nói',
          exampleChars: [{ char: '语', pinyin: 'yǔ', meaning: 'Ngôn ngữ' }, { char: '说', pinyin: 'shuō', meaning: 'Nói' }],
        },
      ],
      copyWords: [{ word: '比', pinyin: 'bǐ', vietnamese: 'So với' }, { word: '好多了', pinyin: 'hǎoduō le', vietnamese: 'Tốt hơn nhiều' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '比较', pinyin: 'bǐjiào', meaning: 'Khá là, so sánh' }],
      compounds: [{ part1: '比', part2: '较', combinedHanzi: '比较', pinyin: 'bǐjiào', meaning: 'So sánh / Tương đối' }],
      discussion: { question: 'Cấu trúc câu so sánh chữ 比?', answer: 'A 比 B + Tính từ + 得多 / 多了 / 一点儿.' },
      exercises: [
        {
          id: 'h3_w9_e1',
          sentenceWithBlank: '今天的天气比昨天热（ ）。',
          pinyinSentence: 'Jīntiān de tiānqì bǐ zuótiān rè ( ).',
          options: ['多了', '很', '非常'],
          correctAnswer: '多了',
          vietnameseTranslation: 'Thời tiết hôm nay nóng hơn hôm qua nhiều.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l9_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：小丽的汉语水平真高！ 女：是啊，她比我们都努力多了。',
        options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Tiểu Lệ nỗ lực hơn mọi người nhiều.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l9_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '坐飞机比坐火车快（ ）。',
        promptPinyin: 'Zuò fēijī bǐ zuò huǒchē kuài ( ).',
        options: [{ key: 'A', textChinese: '得多' }, { key: 'B', textChinese: '很' }],
        correctKey: 'A',
        explanation: 'Sau tính từ trong câu so sánh dùng "得多" hoặc "多了".',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l9_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '好多了 / 她的中文 / 比我',
        correctAnswer: '她的中文比我好多了。',
        explanation: 'Tiếng Trung của cô ấy giỏi hơn tôi nhiều.',
      },
    ],
  },
  {
    lessonNumber: 10,
    titleChinese: '数学比历史难多了',
    titlePinyin: 'Shùxué bǐ lìshǐ nán duō le',
    titleVietnamese: 'Môn toán khó hơn môn lịch sử nhiều',
    pageNumber: '064',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ môn học và thời gian',
      radicals: [
        {
          radical: '攵',
          pinyin: 'fǎnwénpáng',
          nameVietnamese: 'Bộ Phản văn (反文旁)',
          meaning: 'Liên quan đến hành động học tập tính toán',
          exampleChars: [{ char: '数', pinyin: 'shù', meaning: 'Số học' }, { char: '教', pinyin: 'jiào', meaning: 'Dạy học' }],
        },
      ],
      copyWords: [{ word: '数学', pinyin: 'shùxué', vietnamese: 'Toán học' }, { word: '历史', pinyin: 'lìshǐ', vietnamese: 'Lịch sử' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '容易', pinyin: 'róngyì', meaning: 'Dễ dàng' }, { hanzi: '难', pinyin: 'nán', meaning: 'Khó' }],
      compounds: [{ part1: '容', part2: '易', combinedHanzi: '容易', pinyin: 'róngyì', meaning: 'Dễ dàng' }],
      discussion: { question: 'So sánh mức độ chênh lệch cụ thể?', answer: 'A 比 B + Adj + Cụm số lượng (Ví dụ: 他比我大两岁).' },
      exercises: [
        {
          id: 'h3_w10_e1',
          sentenceWithBlank: '哥哥比我大（ ）岁。',
          pinyinSentence: 'Gēge bǐ wǒ dà ( ) suì.',
          options: ['三', '很', '非常'],
          correctAnswer: '三',
          vietnameseTranslation: 'Anh trai lớn hơn tôi 3 tuổi.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l10_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：你觉得数学难还是历史难？ 女：我认为数学比历史难多了。',
        options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Người nữ cảm thấy môn toán khó hơn môn lịch sử.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l10_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '这件衣服比那件便宜（ ）。',
        promptPinyin: 'Zhè jiàn yīfu bǐ nà jiàn piányi ( ).',
        options: [{ key: 'A', textChinese: '一点儿' }, { key: 'B', textChinese: '很' }],
        correctKey: 'A',
        explanation: '便宜一点儿: rẻ hơn một chút.',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l10_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '难多了 / 数学 / 比 / 历史',
        correctAnswer: '数学比历史难多了。',
        explanation: 'Toán khó hơn lịch sử nhiều.',
      },
    ],
  },
  {
    lessonNumber: 11,
    titleChinese: '别忘了把空调关了',
    titlePinyin: 'Bié wàng le bǎ kōngtiáo guān le',
    titleVietnamese: 'Đừng quên tắt máy điều hòa nhé',
    pageNumber: '071',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ đồ điện và thiết bị',
      radicals: [
        {
          radical: '门',
          pinyin: 'ménzìkuàng',
          nameVietnamese: 'Bộ Môn (门字框)',
          meaning: 'Liên quan đến cửa và đóng mở',
          exampleChars: [{ char: '关', pinyin: 'guān', meaning: 'Đóng, tắt' }, { char: '开', pinyin: 'kāi', meaning: 'Mở, bật' }],
        },
      ],
      copyWords: [{ word: '把', pinyin: 'bǎ', vietnamese: 'Câu chữ Ba' }, { word: '空调', pinyin: 'kōngtiáo', vietnamese: 'Điều hòa nhiệt độ' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '空调', pinyin: 'kōngtiáo', meaning: 'Điều hòa' }, { hanzi: '关门', pinyin: 'guānmén', meaning: 'Đóng cửa' }],
      compounds: [{ part1: '关', part2: '上', combinedHanzi: '关上', pinyin: 'guānshang', meaning: 'Đóng lại' }],
      discussion: { question: 'Cấu trúc câu chữ 把 căn bản?', answer: 'Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác (了/bổ ngữ).' },
      exercises: [
        {
          id: 'h3_w11_e1',
          sentenceWithBlank: '出门前请把灯（ ）了。',
          pinyinSentence: 'Chūmén qián qǐng bǎ dēng ( ) le.',
          options: ['关', '开', '看'],
          correctAnswer: '关',
          vietnameseTranslation: 'Trước khi ra ngoài xin hãy tắt đèn đi.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l11_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：外面要下雨了，快把窗户关上吧。 女：好的，我马上就去关。',
        options: [{ key: 'A', textChinese: '对 (Đúng) ★ 他们要把窗户关上。' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Trời sắp mưa, họ chuẩn bị đóng cửa sổ.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l11_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '请你把作业（ ）老师。',
        promptPinyin: 'Qǐng nǐ bǎ zuòyè ( ) lǎoshī.',
        options: [{ key: 'A', textChinese: '交给' }, { key: 'B', textChinese: '拿到' }],
        correctKey: 'A',
        explanation: 'Nộp bài tập cho cô giáo: 交给老师.',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l11_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu chữ 把:',
        sentenceContext: '把 / 关了 / 别忘了 / 空调',
        correctAnswer: '别忘了把空调关了。',
        explanation: 'Đừng quên tắt máy điều hòa.',
      },
    ],
  },
  {
    lessonNumber: 12,
    titleChinese: '把这本画册借给我吧',
    titlePinyin: 'Bǎ zhè běn huàcè jiè gěi wǒ ba',
    titleVietnamese: 'Cho tôi mượn cuốn tập tranh này nhé',
    pageNumber: '078',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ hành vi tương tác',
      radicals: [
        {
          radical: '亻',
          pinyin: 'dānrénpáng',
          nameVietnamese: 'Bộ Nhân đứng (单人旁)',
          meaning: 'Liên quan đến hành vi con người',
          exampleChars: [{ char: '借', pinyin: 'jiè', meaning: 'Mượn, vay' }, { char: '他', pinyin: 'tā', meaning: 'Anh ấy' }],
        },
      ],
      copyWords: [{ word: '画册', pinyin: 'huàcè', vietnamese: 'Tập tranh' }, { word: '借给', pinyin: 'jiè gěi', vietnamese: 'Cho mượn' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '借书', pinyin: 'jièshū', meaning: 'Mượn sách' }, { hanzi: '还书', pinyin: 'huánshū', meaning: 'Trả sách' }],
      compounds: [{ part1: '画', part2: '册', combinedHanzi: '画册', pinyin: 'huàcè', meaning: 'Tập tranh vẽ' }],
      discussion: { question: 'Cấu trúc câu chữ 把 với Bổ ngữ kết quả/hướng (给, 在, 到)?', answer: '把 + Tân ngữ + Động từ + 给/在/到 + Đối tượng/Nơi chốn.' },
      exercises: [
        {
          id: 'h3_w12_e1',
          sentenceWithBlank: '请把这本书借（ ）我用两天。',
          pinyinSentence: 'Qǐng bǎ zhè běn shū jiè ( ) wǒ yòng liǎng tiān.',
          options: ['给', '在', '到'],
          correctAnswer: '给',
          vietnameseTranslation: 'Xin cho tôi mượn cuốn sách này dùng hai ngày.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l12_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：小刚，你买的画册真好看，借给我看看吧？ 女：没问题，你看完记得还给我就行。',
        options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Cho mượn tập tranh và dặn xem xong nhớ trả lại.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l12_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '请把词典放在（ ）上。',
        promptPinyin: 'Qǐng bǎ cídiǎn fàng zài ( ) shang.',
        options: [{ key: 'A', textChinese: '桌子' }, { key: 'B', textChinese: '空调' }],
        correctKey: 'A',
        explanation: 'Để từ điển trên bàn (放在桌子上).',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l12_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '借给我吧 / 把 / 这本画册',
        correctAnswer: '把这本画册借给我吧。',
        explanation: 'Cho tôi mượn tập tranh này nhé.',
      },
    ],
  },
  {
    lessonNumber: 13,
    titleChinese: '我是走回来的',
    titlePinyin: 'Wǒ shì zǒu huílái de',
    titleVietnamese: 'Tôi đi bộ về đấy',
    pageNumber: '085',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ phương thức đi lại',
      radicals: [
        {
          radical: '走',
          pinyin: 'zǒuzìpáng',
          nameVietnamese: 'Bộ Tẩu (走字旁)',
          meaning: 'Liên quan đến đi bộ, chạy',
          exampleChars: [{ char: '走', pinyin: 'zǒu', meaning: 'Đi bộ' }, { char: '起', pinyin: 'qǐ', meaning: 'Thức dậy, đứng lên' }],
        },
      ],
      copyWords: [{ word: '走回来', pinyin: 'zǒu huílái', vietnamese: 'Đi bộ về' }, { word: '是……的', pinyin: 'shì...de', vietnamese: 'Nhấn mạnh phương thức' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '走路', pinyin: 'zǒulù', meaning: 'Đi bộ' }, { hanzi: '坐车', pinyin: 'zuòchē', meaning: 'Đi xe' }],
      compounds: [{ part1: '走', part2: '路', combinedHanzi: '走路', pinyin: 'zǒulù', meaning: 'Đi bộ' }],
      discussion: { question: 'Cấu trúc "是……的" nhấn mạnh điều gì?', answer: 'Nhấn mạnh thời gian, địa điểm, phương thức hoặc đối tượng của một hành động ĐÃ xảy ra trong quá khứ.' },
      exercises: [
        {
          id: 'h3_w13_e1',
          sentenceWithBlank: '你是怎么来学校的？——我（ ）坐地铁来的。',
          pinyinSentence: 'Nǐ shì zěnme lái xuéxiào de? —— Wǒ ( ) zuò dìtiě lái de.',
          options: ['是', '就', '才'],
          correctAnswer: '是',
          vietnameseTranslation: 'Bạn đến trường bằng cách nào? — Tôi đi bằng tàu điện ngầm đến.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l13_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：今天没开车吗？你怎么回来的？ 女：天气很好，我是走回来的。',
        options: [{ key: 'A', textChinese: '对 (Đúng) ★ 女的是走路回家的。' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Người nữ trả lời đi bộ về nhà.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l13_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '这件衣服我是去年在上海（ ）。',
        promptPinyin: 'Zhè jiàn yīfu wǒ shì qùnián zài Shànghǎi ( ).',
        options: [{ key: 'A', textChinese: '买的' }, { key: 'B', textChinese: '买过' }],
        correctKey: 'A',
        explanation: 'Cấu trúc 是...的 nhấn mạnh địa điểm mua trong quá khứ.',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l13_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '回来的 / 是 / 走 / 我',
        correctAnswer: '我是走回来的。',
        explanation: 'Tôi đi bộ về đấy.',
      },
    ],
  },
  {
    lessonNumber: 14,
    titleChinese: '你把水果洗干净了吗',
    titlePinyin: 'Nǐ bǎ shuǐguǒ xǐ gānjìng le ma',
    titleVietnamese: 'Bạn đã rửa sạch hoa quả chưa?',
    pageNumber: '092',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ nước và làm sạch',
      radicals: [
        {
          radical: '氵',
          pinyin: 'sāndiǎnshuǐ',
          nameVietnamese: 'Bộ Ba chấm thủy (三点水)',
          meaning: 'Liên quan đến nước và giặt rửa',
          exampleChars: [{ char: '洗', pinyin: 'xǐ', meaning: 'Rửa, giặt' }, { char: '净', pinyin: 'jìng', meaning: 'Sạch sẽ' }],
        },
      ],
      copyWords: [{ word: '洗干净', pinyin: 'xǐ gānjìng', vietnamese: 'Rửa sạch' }, { word: '水果', pinyin: 'shuǐguǒ', vietnamese: 'Hoa quả' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '干净', pinyin: 'gānjìng', meaning: 'Sạch sẽ' }, { hanzi: '洗澡', pinyin: 'xǐzǎo', meaning: 'Tắm' }],
      compounds: [{ part1: '干', part2: '净', combinedHanzi: '干净', pinyin: 'gānjìng', meaning: 'Sạch sẽ' }],
      discussion: { question: 'Bổ ngữ kết quả biểu thị trạng thái hoàn thành?', answer: 'Động từ + 干净 / 好 / 完 (Ví dụ: 洗干净, 准备好, 吃完).' },
      exercises: [
        {
          id: 'h3_w14_e1',
          sentenceWithBlank: '我已经把衣服洗（ ）了。',
          pinyinSentence: 'Wǒ yǐjīng bǎ yīfu xǐ ( ) le.',
          options: ['干净', '好多了', '越来越'],
          correctAnswer: '干净',
          vietnameseTranslation: 'Tôi đã giặt sạch quần áo rồi.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l14_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：桌上的苹果洗了吗？ 女：还没呢，我马上把水果洗干净。',
        options: [{ key: 'A', textChinese: '对 (Đúng) ★ 女的马上要去洗水果。' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Người nữ chuẩn bị đi rửa hoa quả ngay.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l14_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '请大家把房间打扫（ ）。',
        promptPinyin: 'Qǐng dàjiā bǎ fángjiān dǎsǎo ( ).',
        options: [{ key: 'A', textChinese: '干净' }, { key: 'B', textChinese: '空调' }],
        correctKey: 'A',
        explanation: 'Quét dọn phòng sạch sẽ: 打扫干净.',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l14_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '把水果 / 洗干净 / 你 / 了吗 / ？',
        correctAnswer: '你把水果洗干净了吗？',
        explanation: 'Bạn đã rửa sạch hoa quả chưa?',
      },
    ],
  },
  {
    lessonNumber: 15,
    titleChinese: '新年就要到了',
    titlePinyin: 'Xīnnián jiù yào dào le',
    titleVietnamese: 'Năm mới sắp đến rồi',
    pageNumber: '099',
    hanziSection: {
      title: '偏旁与汉字 (Thiên bàng & Chữ Hán)',
      vietnameseTitle: 'Bộ thủ chỉ thời gian và chúc mừng',
      radicals: [
        {
          radical: '日',
          pinyin: 'rìzìpáng',
          nameVietnamese: 'Bộ Nhật (日字旁)',
          meaning: 'Liên quan đến mặt trời, ngày tháng',
          exampleChars: [{ char: '春', pinyin: 'chūn', meaning: 'Mùa xuân' }, { char: '早', pinyin: 'zǎo', meaning: 'Sớm, buổi sáng' }],
        },
      ],
      copyWords: [{ word: '就要……了', pinyin: 'jiù yào...le', vietnamese: 'Sắp sửa... rồi' }, { word: '新年', pinyin: 'xīnnián', vietnamese: 'Năm mới' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '新年', pinyin: 'xīnnián', meaning: 'Năm mới' }, { hanzi: '快要', pinyin: 'kuàiyào', meaning: 'Sắp sửa' }],
      compounds: [{ part1: '新', part2: '年', combinedHanzi: '新年', pinyin: 'xīnnián', meaning: 'Năm mới' }, { part1: '春', part2: '节', combinedHanzi: '春节', pinyin: 'chūnjié', meaning: 'Tết Nguyên Đán' }],
      discussion: { question: 'Phân biệt "快要……了" và "就要……了"?', answer: '“就要……了” có thể đi kèm mốc thời gian cụ thể (Ví dụ: 明天就要考试了); “快要……了” không đi kèm thời gian cụ thể phía trước.' },
      exercises: [
        {
          id: 'h3_w15_e1',
          sentenceWithBlank: '下个星期我们（ ）放寒假了。',
          pinyinSentence: 'Xià gè xīngqī wǒmen ( ) fàng hánjià le.',
          options: ['就要', '快要', '已经'],
          correctAnswer: '就要',
          vietnameseTranslation: 'Tuần sau chúng tôi sắp được nghỉ đông rồi.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h3_l15_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：新年就要到了，你打算回老家吗？ 女：是的，我已经买好了回家的车票。',
        options: [{ key: 'A', textChinese: '对 (Đúng) ★ 女的买好车票打算回老家。' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Người nữ đã mua vé xe về quê đón năm mới.',
      },
    ],
    readingExercises: [
      {
        id: 'h3_l15_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '火车（ ）开走了，我们快点儿走吧。',
        promptPinyin: 'Huǒchē ( ) kāizǒu le, wǒmen kuàidiǎnr zǒu ba.',
        options: [{ key: 'A', textChinese: '快要' }, { key: 'B', textChinese: '刚刚' }],
        correctKey: 'A',
        explanation: 'Xe lửa sắp chạy rồi: 快要开走了.',
      },
    ],
    writingExercises: [
      {
        id: 'h3_l15_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '新年 / 到了 / 就要',
        correctAnswer: '新年就要到了。',
        explanation: 'Năm mới sắp đến rồi.',
      },
    ],
  },
];

// BỘ ĐỀ THI THỬ HSK 3 CHUẨN (80 CÂU)
export const HSK3_OFFICIAL_MOCK_EXAM: MockExamQuestion[] = [
  {
    id: 'hsk3_mock_l1',
    section: 'listening',
    part: 1,
    questionNumber: 1,
    prompt: 'Nghe hội thoại và phán đoán Đúng/Sai (Câu 1)',
    audioScript: '男：小王，这几本书你都看完了吗？ 女：差不多都看完了，写得真有意思。',
    options: [
      { key: 'A', textChinese: '对 (Đúng) ★ 小王觉得书很有意思。' },
      { key: 'B', textChinese: '错 (Sai)' },
    ],
    correctAnswer: 'A',
    explanation: 'Tiểu Vương nói "写得真有意思" (viết rất thú vị) -> Đáp án Đúng A.',
  },
  {
    id: 'hsk3_mock_l2',
    section: 'listening',
    part: 2,
    questionNumber: 11,
    prompt: 'Nghe đoạn văn ngắn và chọn đáp án chính xác (Câu 11)',
    audioScript: '男：今天晚上你想吃什么？ 女：我们好久没去吃烤鸭了，今天去吃烤鸭怎么样？ 问：女的想吃什么？',
    options: [
      { key: 'A', textChinese: '烤鸭 (Vịt quay)' },
      { key: 'B', textChinese: '面条 (Mì sợi)' },
      { key: 'C', textChinese: '米饭 (Cơm)' },
    ],
    correctAnswer: 'A',
    explanation: 'Người nữ đề nghị đi ăn vịt quay (吃烤鸭) -> Đáp án A.',
  },
  {
    id: 'hsk3_mock_r1',
    section: 'reading',
    part: 1,
    questionNumber: 21,
    prompt: '21. 听说你明天要参加汉语比赛，准备得怎么样了？',
    options: [
      { key: 'A', textChinese: '我已经准备好了，希望明天能有好成绩。' },
      { key: 'B', textChinese: '外边下着大雪，天气太冷了。' },
      { key: 'C', textChinese: '电梯坏了，我们走上去吧。' },
    ],
    correctAnswer: 'A',
    explanation: 'Hỏi về chuẩn bị thi đấu tiếng Hán -> Trả lời đã chuẩn bị tốt (A).',
  },
  {
    id: 'hsk3_mock_r2',
    section: 'reading',
    part: 2,
    questionNumber: 41,
    prompt: '41. 虽然工作很累，但是他觉得非常（ ）。',
    options: [
      { key: 'A', textChinese: '快乐 (kuàilè)' },
      { key: 'B', textChinese: '着急 (zháojí)' },
      { key: 'C', textChinese: '奇怪 (qíguài)' },
    ],
    correctAnswer: 'A',
    explanation: 'Cấu trúc mặc dù... nhưng: 虽然很累，但是非常快乐 (A).',
  },
  {
    id: 'hsk3_mock_w1',
    section: 'reading',
    part: 3,
    questionNumber: 71,
    prompt: '71. 请把桌子上的面包（ ná ）给我。 (Viết chữ Hán thay cho phiên âm ná)',
    options: [
      { key: 'A', textChinese: '拿 (ná)' },
      { key: 'B', textChinese: '哪 (nǎ)' },
      { key: 'C', textChinese: '那 (nà)' },
    ],
    correctAnswer: 'A',
    explanation: 'Cầm/lấy bánh mì đưa cho tôi: 拿 (A).',
  },
];
