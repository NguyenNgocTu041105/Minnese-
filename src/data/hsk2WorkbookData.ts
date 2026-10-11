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
    titleChinese: '她请我们吃了北京烤鸭',
    titlePinyin: 'Tā qǐng wǒmen chīle Běijīng kǎoyā',
    titleVietnamese: 'Chị ấy đã mời chúng em ăn vịt quay Bắc Kinh',
    pageNumber: '001',
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
        id: 'h2_l1_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và chọn hình ảnh phù hợp (Câu 1)',
        audioScript: '我们一起坐出租车去学校吧。',
        options: [
          { key: 'A', textChinese: 'Xe buýt / Tàu điện', imageEmoji: '🚊' },
          { key: 'B', textChinese: 'Taxi vàng đón khách', imageEmoji: '🚕' },
          { key: 'C', textChinese: 'Xe buýt 2 tầng', imageEmoji: '🚌' },
        ],
        correctKey: 'B',
        explanation: 'Khóa từ 出租车 (taxi) tương ứng với hình B.',
      },
      {
        id: 'h2_l1_q2',
        part: 1,
        questionNumber: 2,
        promptText: 'Nghe và chọn hình ảnh phù hợp (Câu 2)',
        audioScript: '她请我们吃好吃的北京烤鸭。',
        options: [
          { key: 'A', textChinese: 'Bàn tiệc ăn uống đông vui', imageEmoji: '🍲' },
          { key: 'B', textChinese: 'Ăn vịt quay nướng giòn', imageEmoji: '🍗' },
          { key: 'C', textChinese: 'Đang mở cửa tiệm', imageEmoji: '🚪' },
        ],
        correctKey: 'B',
        explanation: 'Khóa từ 北京烤鸭 (vịt quay Bắc Kinh) -> Đáp án B.',
      },
      {
        id: 'h2_l1_q7',
        part: 3,
        questionNumber: 7,
        promptText: 'Nghe hội thoại, chọn đáp án đúng (Câu 7)',
        audioScript: '男：今天晚上我们去哪儿吃饭？ 女：去学校前面的饭店吧。 问：他们要去哪儿？',
        options: [
          { key: 'A', textChinese: '饭店', textPinyin: 'fàndiàn', textVietnamese: 'Nhà hàng' },
          { key: 'B', textChinese: '超市', textPinyin: 'chāoshì', textVietnamese: 'Siêu thị' },
          { key: 'C', textChinese: '学校', textPinyin: 'xuéxiào', textVietnamese: 'Trường học' },
        ],
        correctKey: 'A',
        explanation: 'Người nữ nói "去学校前面的饭店吧" (Đến nhà hàng trước trường học nhé) -> Đáp án A.',
      },
    ],
    readingExercises: [
      {
        id: 'h2_l1_r14',
        part: 2,
        questionNumber: 14,
        promptChinese: '我是昨天（ ）妈妈打的电话。',
        promptPinyin: 'Wǒ shì zuótiān ( ) māma dǎ de diànhuà.',
        options: [
          { key: 'A', textChinese: '次 (cì)' },
          { key: 'B', textChinese: '懂 (dǒng)' },
          { key: 'C', textChinese: '给 (gěi)' },
          { key: 'D', textChinese: '不好意思 (bù hǎoyìsi)' },
          { key: 'E', textChinese: '完 (wán)' },
        ],
        correctKey: 'C',
        explanation: 'Cấu trúc "给...打电话" (gọi điện thoại cho ai). Điền 给 (C).',
      },
      {
        id: 'h2_l1_r15',
        part: 2,
        questionNumber: 15,
        promptChinese: '这已经是我第三（ ）来西安旅游了。',
        promptPinyin: 'Zhè yǐjīng shì wǒ dì-sān ( ) lái Xī’ān lǚyóu le.',
        options: [
          { key: 'A', textChinese: '次 (cì)' },
          { key: 'B', textChinese: '懂 (dǒng)' },
          { key: 'C', textChinese: '给 (gěi)' },
          { key: 'D', textChinese: '不好意思 (bù hǎoyìsi)' },
          { key: 'E', textChinese: '完 (wán)' },
        ],
        correctKey: 'A',
        explanation: 'Lượng từ chỉ số lần: 第三次 (lần thứ ba) -> Điền 次 (A).',
      },
      {
        id: 'h2_l1_r22',
        part: 4,
        questionNumber: 22,
        promptChinese: '到了西安，朋友来接我们，还给我们介绍了一家饭店。我们开车去了那里，菜都很好吃。★ 朋友介绍了什么？',
        promptPinyin: 'Dàole Xī’ān, péngyou lái jiē wǒmen, hái gěi wǒmen jièshàole yì jiā fàndiàn... ★ Péngyou jièshàole shénme?',
        options: [
          { key: 'A', textChinese: '车', textPinyin: 'chē' },
          { key: 'B', textChinese: '饭店', textPinyin: 'fàndiàn' },
          { key: 'C', textChinese: '西安', textPinyin: 'Xī’ān' },
        ],
        correctKey: 'B',
        explanation: 'Đoạn văn viết "还给我们介绍了一家饭店" -> Bạn giới thiệu nhà hàng (饭店 B).',
      },
    ],
    writingExercises: [
      {
        id: 'h2_l1_w25',
        part: 1,
        questionNumber: 25,
        promptText: 'Ghép bộ kiện với chữ Không: [ 不 + 董 ]',
        targetComponents: [
          { key: 'A', radical: '忄' },
          { key: 'B', radical: '纟' },
          { key: 'C', radical: '忄' },
          { key: 'D', radical: '十' },
        ],
        correctAnswer: 'A',
        explanation: 'Chữ 懂 (hiểu) = 忄+ 董 (hoặc 不懂).',
      },
      {
        id: 'h2_l1_w28',
        part: 2,
        questionNumber: 28,
        promptText: 'Điền chữ Hán: 他（ yǒushíhou ）不吃晚饭。',
        pinyinGuide: 'yǒushíhou',
        correctAnswer: '有时候',
        explanation: 'yǒu shíhou -> 有时候 (Có đôi khi).',
      },
    ],
  },
  {
    lessonNumber: 2,
    titleChinese: '还是打车去北大吧',
    titlePinyin: 'Háishì dǎchē qù Běidà ba',
    titleVietnamese: 'Chúng ta vẫn nên gọi taxi đi Đại học Bắc Kinh nhé',
    pageNumber: '011',
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
      ],
    },
    listeningExercises: [
      {
        id: 'h2_l2_q7',
        part: 3,
        questionNumber: 7,
        promptText: 'Nghe hội thoại, chọn đáp án đúng (Câu 7)',
        audioScript: '男：你在哪儿呢？怎么还没到？ 女：我在出租车里呢，快到了。 问：女的在哪儿？',
        options: [
          { key: 'A', textChinese: '公交站', textPinyin: 'gōngjiāozhàn', textVietnamese: 'Trạm xe buýt' },
          { key: 'B', textChinese: '出租车里', textPinyin: 'chūzūchē lǐ', textVietnamese: 'Trong taxi' },
          { key: 'C', textChinese: '公交车上', textPinyin: 'gōngjiāochē shang', textVietnamese: 'Trên xe buýt' },
        ],
        correctKey: 'B',
        explanation: 'Người nữ trả lời "我在出租车里呢" -> Đáp án B.',
      },
    ],
    readingExercises: [
      {
        id: 'h2_l2_r14',
        part: 2,
        questionNumber: 14,
        promptChinese: '下课了，但外边下雨了，我还是在（ ）里看书吧。',
        promptPinyin: 'Xiàkè le, dàn wàibian xiàyǔ le, wǒ háishi zài ( ) lǐ kàn shū ba.',
        options: [
          { key: 'A', textChinese: '万 (wàn)' },
          { key: 'B', textChinese: '远 (yuǎn)' },
          { key: 'C', textChinese: '教室 (jiàoshì)' },
          { key: 'D', textChinese: '车站 (chēzhàn)' },
          { key: 'E', textChinese: '完 (wán)' },
        ],
        correctKey: 'C',
        explanation: 'Trong phòng học đọc sách: 教室 (C).',
      },
    ],
    writingExercises: [
      {
        id: 'h2_l2_w28',
        part: 2,
        questionNumber: 28,
        promptText: 'Điền chữ Hán: 我是在（ wǎng ）上买的电影票。',
        pinyinGuide: 'wǎng',
        correctAnswer: '网',
        explanation: 'wǎng shang -> 网上 (trên mạng Internet).',
      },
    ],
  },
  {
    lessonNumber: 3,
    titleChinese: '我想去西安旅游',
    titlePinyin: 'Wǒ xiǎng qù Xī’ān lǚyóu',
    titleVietnamese: 'Em muốn đi Tây An du lịch',
    pageNumber: '021',
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
      ],
    },
    listeningExercises: [
      {
        id: 'h2_l3_q7',
        part: 3,
        questionNumber: 7,
        promptText: 'Nghe hội thoại, chọn đáp án đúng (Câu 7)',
        audioScript: '男：你想去哪儿买那本书？ 女：去书店吧。 问：他们要去哪儿？',
        options: [
          { key: 'A', textChinese: '书店', textPinyin: 'shūdiàn', textVietnamese: 'Hiệu sách' },
          { key: 'B', textChinese: '教室', textPinyin: 'jiàoshì', textVietnamese: 'Lớp học' },
          { key: 'C', textChinese: '家里', textPinyin: 'jiā lǐ', textVietnamese: 'Ở nhà' },
        ],
        correctKey: 'A',
        explanation: 'Mua sách tại hiệu sách (书店 A).',
      },
    ],
    readingExercises: [
      {
        id: 'h2_l3_r14',
        part: 2,
        questionNumber: 14,
        promptChinese: '学校里（ ）间教室都有学生在上课。',
        promptPinyin: 'Xuéxiào lǐ ( ) jiān jiàoshì dōu yǒu xuésheng zài shàngkè.',
        options: [
          { key: 'A', textChinese: '每 (měi)' },
          { key: 'B', textChinese: '自己 (zìjǐ)' },
          { key: 'C', textChinese: '这么 (zhème)' },
          { key: 'D', textChinese: '出去 (chūqù)' },
          { key: 'E', textChinese: '完 (wán)' },
        ],
        correctKey: 'A',
        explanation: 'Mỗi phòng học: 每间教室 -> Điền 每 (A).',
      },
    ],
    writingExercises: [
      {
        id: 'h2_l3_w28',
        part: 2,
        questionNumber: 28,
        promptText: 'Điền chữ Hán: 你今天（ wèishénme ）来晚了？',
        pinyinGuide: 'wèishénme',
        correctAnswer: '为什么',
        explanation: 'wèi shénme -> 为什么 (Tại sao).',
      },
    ],
  },
  {
    lessonNumber: 4,
    titleChinese: '你穿红色的很好看',
    titlePinyin: 'Nǐ chuān hóngsè de hěn hǎokàn',
    titleVietnamese: 'Con mặc đồ màu đỏ rất đẹp',
    pageNumber: '031',
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
      ],
    },
  },
  {
    lessonNumber: 5,
    titleChinese: '第一次去中国朋友家',
    titlePinyin: 'Dì-yī cì qù Zhōngguó péngyou jiā',
    titleVietnamese: 'Lần đầu đến thăm nhà bạn người Trung Quốc',
    pageNumber: '041',
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
      ],
    },
  },
  {
    lessonNumber: 6,
    titleChinese: '小雪，生日快乐！',
    titlePinyin: 'Xiǎoxuě, shēngrì kuàilè!',
    titleVietnamese: 'Chúc mừng sinh nhật Tiểu Tuyết!',
    pageNumber: '051',
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
      ],
    },
  },
  {
    lessonNumber: 7,
    titleChinese: '他篮球打得很好',
    titlePinyin: 'Tā lánqiú dǎ de hěn hǎo',
    titleVietnamese: 'Bạn ấy chơi bóng rổ rất hay',
    pageNumber: '061',
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
      ],
    },
  },
  {
    lessonNumber: 8,
    titleChinese: '虽然你忘了，但是我记得',
    titlePinyin: 'Suīrán nǐ wàng le, dànshì wǒ jìde',
    titleVietnamese: 'Mặc dù em quên, nhưng anh vẫn nhớ',
    pageNumber: '071',
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
      ],
    },
  },
  {
    lessonNumber: 9,
    titleChinese: '我去买杯奶茶',
    titlePinyin: 'Wǒ qù mǎi bēi nǎichá',
    titleVietnamese: 'Em đi mua một cốc trà sữa',
    pageNumber: '081',
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
      ],
    },
  },
  {
    lessonNumber: 10,
    titleChinese: '就要考试了',
    titlePinyin: 'Jiù yào kǎoshì le',
    titleVietnamese: 'Sắp thi rồi',
    pageNumber: '091',
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
      ],
    },
  },
  {
    lessonNumber: 11,
    titleChinese: '我最喜欢吃中国菜',
    titlePinyin: 'Wǒ zuì xǐhuan chī Zhōngguócài',
    titleVietnamese: 'Em thích ăn món Trung Quốc nhất',
    pageNumber: '101',
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
      ],
    },
  },
  {
    lessonNumber: 12,
    titleChinese: '这里比北京冷多了',
    titlePinyin: 'Zhèlǐ bǐ Běijīng lěng duō le',
    titleVietnamese: 'Ở đây lạnh hơn Bắc Kinh nhiều',
    pageNumber: '111',
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
      ],
    },
  },
  {
    lessonNumber: 13,
    titleChinese: '我们爱上中文课',
    titlePinyin: 'Wǒmen ài shàng Zhōngwén kè',
    titleVietnamese: 'Chúng tôi yêu thích môn tiếng Trung Quốc',
    pageNumber: '121',
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
      ],
    },
  },
  {
    lessonNumber: 14,
    titleChinese: '一个人过年多没意思啊',
    titlePinyin: 'Yí gè rén guònián duō méi yìsi a',
    titleVietnamese: 'Một mình đón năm mới thì thật vô vị',
    pageNumber: '131',
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
      ],
    },
  },
  {
    lessonNumber: 15,
    titleChinese: '我想再去一次中国',
    titlePinyin: 'Wǒ xiǎng zài qù yí cì Zhōngguó',
    titleVietnamese: 'Em muốn đi Trung Quốc một lần nữa',
    pageNumber: '141',
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
      ],
    },
  },
];

// ==========================================
// ĐỀ THI THỬ HSK (CẤP 2) MÔ PHỎNG CHUẨN (HSK 二级 模拟试卷)
// 60 CÂU: 25 NGHE + 25 ĐỌC + 10 VIẾT (Trang 151 - 177)
// ==========================================

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
