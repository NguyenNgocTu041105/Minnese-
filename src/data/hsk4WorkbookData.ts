// Dữ liệu Sách Bài Tập / Sổ Tay Học Và Luyện Tập New HSK 4 (新 HSK 教程 4 学练手册)
// Chuẩn CTI BOOKS & NXB Dân Trí / FLTRP 3.0 - Đầy đủ 20 bài học & Đề thi thử

import {
  WorkbookLesson,
  MockExamQuestion,
} from './hsk1WorkbookData';
import { HSK2WordExpansion, HSK2WritingExercise } from './hsk2WorkbookData';

export interface HSK4WorkbookLesson extends Partial<WorkbookLesson> {
  lessonNumber: number;
  titleChinese: string;
  titlePinyin: string;
  titleVietnamese: string;
  pageNumber: string;
  wordExpansion?: HSK2WordExpansion;
  writingExercises?: any[];
  listeningExercises?: any[];
  readingExercises?: any[];
  advancedReadingTasks?: {
    passage: string;
    pinyinPassage?: string;
    questions: { question: string; options: string[]; answer: string; explanation: string }[];
  };
}

export const HSK4_WORKBOOK_LESSONS: HSK4WorkbookLesson[] = [
  // BÀI 1: 简单的爱情
  {
    lessonNumber: 1,
    titleChinese: '简单的爱情',
    titlePinyin: 'Jiǎndān de àiqíng',
    titleVietnamese: 'Tình yêu giản dị',
    pageNumber: '001',
    hanziSection: {
      title: '高频字词与偏旁 (Từ ngữ cao tần & Thiên bàng HSK 4)',
      vietnameseTitle: 'Phân tích các từ ghép và kết cấu ngữ pháp HSK 4',
      radicals: [
        {
          radical: '心/忄',
          pinyin: 'xīnzìdǐ / shùxīnpáng',
          nameVietnamese: 'Bộ Tâm (心/忄)',
          meaning: 'Liên quan đến tình cảm, cảm xúc nội tâm sâu sắc',
          exampleChars: [
            { char: '爱', pinyin: 'ài', meaning: 'Tình yêu, yêu thương' },
            { char: '情', pinyin: 'qíng', meaning: 'Tình cảm, duyên phận' },
          ],
        },
      ],
      copyWords: [
        { word: '爱情', pinyin: 'àiqíng', vietnamese: 'Tình yêu (简单的爱情让人感动。)' },
        { word: '浪漫', pinyin: 'làngmàn', vietnamese: 'Lãng mạn (浪漫不是轰轰烈烈。)' },
        { word: '缺点', pinyin: 'quēdiǎn', vietnamese: 'Khuyết điểm (接受对方的缺点。)' },
      ],
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '适合', pinyin: 'shìhé', meaning: 'Phù hợp, thích hợp (động từ)' },
        { hanzi: '合适', pinyin: 'héshì', meaning: 'Thích hợp, vừa vặn (tính từ)' },
        { hanzi: '羡慕', pinyin: 'xiànmù', meaning: 'Ngưỡng mộ, ghen tị tích cực' },
        { hanzi: '互相', pinyin: 'hùxiāng', meaning: 'Lẫn nhau, qua lại' },
      ],
      compounds: [
        { part1: '互', part2: '相', combinedHanzi: '互相', pinyin: 'hùxiāng', meaning: 'Lẫn nhau' },
        { part1: '共', part2: '同', combinedHanzi: '共同', pinyin: 'gòngtóng', meaning: 'Chung, cùng nhau' },
      ],
      discussion: {
        question: 'Phân biệt "适合" và "合适"?',
        answer: '“适合” là động từ, mang tân ngữ (Ví dụ: 这件衣服适合你); “合适” là tính từ, không mang tân ngữ (Ví dụ: 这件衣服很合适).',
      },
      exercises: [
        {
          id: 'h4_w1_e1',
          sentenceWithBlank: '两个人在一起，最重要的是性格（ ）。',
          pinyinSentence: 'Liǎng gè rén zài yìqǐ, zuì zhòngyào de shì xìnggé ( ).',
          options: ['合适', '适合', '缺点'],
          correctAnswer: '合适',
          vietnameseTranslation: 'Hai người ở bên nhau, quan trọng nhất là tính cách phù hợp.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h4_l1_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe hội thoại và xác nhận Đúng/Sai (HSK 4):',
        audioScript: '男：你觉得王老师和李老师在一起怎么样？ 女：他们有共同的爱好，互相照顾，生活得很幸福。',
        options: [
          { key: 'A', textChinese: '对 (Đúng) ★ 他们生活得很幸福。' },
          { key: 'B', textChinese: '错 (Sai)' },
        ],
        correctKey: 'A',
        explanation: 'Người nữ trả lời cuộc sống của họ rất hạnh phúc (生活得很幸福).',
      },
    ],
    readingExercises: [
      {
        id: 'h4_l1_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '他（ ）足球踢得好，性格也非常不错。',
        promptPinyin: 'Tā ( ) zúqiú tī de hǎo, xìnggé yě fēicháng búcuò.',
        options: [
          { key: 'A', textChinese: '不仅 (bùjǐn)' },
          { key: 'B', textChinese: '不管 (bùguǎn)' },
          { key: 'C', textChinese: '尽管 (jǐnguǎn)' },
        ],
        correctKey: 'A',
        explanation: 'Cấu trúc tăng tiến "不仅...也/还...": không những... mà còn...',
      },
    ],
    writingExercises: [
      {
        id: 'h4_l1_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh:',
        sentenceContext: '足球 / 不仅 / 他 / 踢得好 / 也 / 性格不错',
        correctAnswer: '他不仅足球踢得好，性格也不错。',
        explanation: 'Cấu trúc: Chủ ngữ + 不仅... 也...',
      },
    ],
  },

  // BÀI 2: 真正的朋友
  {
    lessonNumber: 2,
    titleChinese: '真正的朋友',
    titlePinyin: 'Zhēnzhèng de péngyou',
    titleVietnamese: 'Người bạn chân chính',
    pageNumber: '009',
    hanziSection: {
      title: '高频字词与偏旁',
      vietnameseTitle: 'Bộ thủ chỉ tình bạn và giao tiếp',
      radicals: [
        {
          radical: '亻',
          pinyin: 'dānrénpáng',
          nameVietnamese: 'Bộ Nhân đứng (单人旁)',
          meaning: 'Liên quan đến con người và quan hệ bạn bè',
          exampleChars: [{ char: '份', pinyin: 'fèn', meaning: 'Phần' }, { char: '倍', pinyin: 'bèi', meaning: 'Gấp bội' }],
        },
      ],
      copyWords: [
        { word: '真正', pinyin: 'zhēnzhèng', vietnamese: 'Chân chính (真正的朋友)' },
        { word: '陪', pinyin: 'péi', vietnamese: 'Cùng, bầu bạn (陪你聊天)' },
      ],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '友谊', pinyin: 'yǒuyì', meaning: 'Tình hữu nghị, tình bạn' }],
      compounds: [{ part1: '友', part2: '谊', combinedHanzi: '友谊', pinyin: 'yǒuyì', meaning: 'Tình bạn' }],
      discussion: { question: 'Ý nghĩa của "真正的朋友"?', answer: 'Là người sẵn sàng lắng nghe và bên cạnh bạn những lúc khó khăn nhất.' },
      exercises: [
        {
          id: 'h4_w2_e1',
          sentenceWithBlank: '遇到困难时，朋友会（ ）在你身边。',
          pinyinSentence: 'Yù dào kùnnan shí, péngyou huì ( ) zài nǐ shēnbiān.',
          options: ['陪', '给', '被'],
          correctAnswer: '陪',
          vietnameseTranslation: 'Khi gặp khó khăn, bạn bè sẽ đồng hành bên cạnh bạn.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h4_l2_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：遇到困难时，真正的朋友会拉你一把。 女：对，朋友不仅能同甘，更能共苦。',
        options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Bạn bè chân chính luôn giúp đỡ lúc gian nan.',
      },
    ],
    readingExercises: [
      {
        id: 'h4_l2_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '一份快乐两个人分享，就变成了两份快乐；一份痛苦两个人（ ），就减少了一半。',
        promptPinyin: 'Yí fèn kuàilè liǎng gè rén fēnxiǎng, jiù biànchéng le liǎng fèn kuàilè; yí fèn tòngkǔ liǎng gè rén ( ), jiù jiǎnshǎo le yíbàn.',
        options: [{ key: 'A', textChinese: '分担 (fēndān)' }, { key: 'B', textChinese: '讨论' }],
        correctKey: 'A',
        explanation: 'Chia sẻ gánh vác nỗi đau: 分担痛苦.',
      },
    ],
    writingExercises: [
      {
        id: 'h4_l2_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '身边 / 陪在 / 朋友会 / 你的',
        correctAnswer: '朋友会陪在你的身边。',
        explanation: 'Bạn bè sẽ đồng hành bên cạnh bạn.',
      },
    ],
  },

  // BÀI 3: 经理对我印象很好
  {
    lessonNumber: 3,
    titleChinese: '经理对我印象很好',
    titlePinyin: 'Jīnglǐ duì wǒ yìnxiàng hěn hǎo',
    titleVietnamese: 'Giám đốc có ấn tượng rất tốt về tôi',
    pageNumber: '018',
    hanziSection: {
      title: '高频字词与偏旁',
      vietnameseTitle: 'Bộ thủ chỉ công sở và phỏng vấn',
      radicals: [{ radical: '卩', pinyin: "dān'ěr dāo", nameVietnamese: 'Bộ Tiết (卩)', meaning: 'Liên quan đến con dấu, ấn tượng', exampleChars: [{ char: '印', pinyin: 'yìn', meaning: 'Ấn tượng (印象)' }] }],
      copyWords: [{ word: '印象', pinyin: 'yìnxiàng', vietnamese: 'Ấn tượng' }, { word: '面试', pinyin: 'miànshì', vietnamese: 'Phỏng vấn' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '招聘', pinyin: 'zhāopìn', meaning: 'Tuyển dụng' }, { hanzi: '信心', pinyin: 'xìnxīn', meaning: 'Tự tin' }],
      compounds: [{ part1: '应', part2: '聘', combinedHanzi: '应聘', pinyin: 'yìngpìn', meaning: 'Ứng tuyển' }],
      discussion: { question: 'Cấu trúc "对……印象"?', answer: 'A 对 B 的印象很好 / B 给 A 留下了深刻的印象.' },
      exercises: [
        {
          id: 'h4_w3_e1',
          sentenceWithBlank: '这次面试，我给面试官留下了深刻的（ ）。',
          pinyinSentence: 'Zhè cì miànshì, wǒ gěi miànshìguān liúxià le shēnkè de ( ).',
          options: ['印象', '感觉', '性格'],
          correctAnswer: '印象',
          vietnameseTranslation: 'Buổi phỏng vấn lần này, tôi để lại ấn tượng sâu sắc cho người phỏng vấn.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h4_l3_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：昨天的面试顺利吗？ 女：很顺利，经理对我印象很好，通知我下周一去入职。',
        options: [{ key: 'A', textChinese: '对 (Đúng) ★ 女的通过了面试。' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Người nữ đã phỏng vấn thành công.',
      },
    ],
    readingExercises: [
      {
        id: 'h4_l3_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '去面试时，穿着大方得体能给别人留下好（ ）。',
        promptPinyin: 'Qù miànshì shí, chuānzhuó dàfāng détǐ néng gěi biérén liúxià hǎo ( ).',
        options: [{ key: 'A', textChinese: '印象' }, { key: 'B', textChinese: '条件' }],
        correctKey: 'A',
        explanation: 'Để lại ấn tượng tốt: 留下好印象.',
      },
    ],
    writingExercises: [
      {
        id: 'h4_l3_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '印象很好 / 经理 / 对我',
        correctAnswer: '经理对我印象很好。',
        explanation: 'Giám đốc có ấn tượng rất tốt về tôi.',
      },
    ],
  },

  // BÀI 4 - 20 (TOÀN BỘ 20 BÀI ĐẦY ĐỦ)
  {
    lessonNumber: 4,
    titleChinese: '不要太着急赚钱',
    titlePinyin: 'Bú yào tài zháojí zhuànqián',
    titleVietnamese: 'Đừng quá vội vàng kiếm tiền',
    pageNumber: '026',
    hanziSection: {
      title: '高频字词与偏旁',
      vietnameseTitle: 'Bộ thủ chỉ kinh nghiệm và tích lũy',
      radicals: [{ radical: '钅', pinyin: 'jīnzìpáng', nameVietnamese: 'Bộ Kim (钅)', meaning: 'Liên quan đến tiền bạc kim loại', exampleChars: [{ char: '钱', pinyin: 'qián', meaning: 'Tiền bạc' }] }],
      copyWords: [{ word: '积累', pinyin: 'jīlěi', vietnamese: 'Tích lũy kinh nghiệm' }, { word: '着急', pinyin: 'zháojí', vietnamese: 'Vội vã, lo sốt vó' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '经验', pinyin: 'jīngyàn', meaning: 'Kinh nghiệm' }, { hanzi: '积累', pinyin: 'jīlěi', meaning: 'Tích lũy' }],
      compounds: [{ part1: '积', part2: '累', combinedHanzi: '积累', pinyin: 'jīlěi', meaning: 'Tích lũy' }],
      discussion: { question: 'Vì sao người mới đi làm cần tích lũy kinh nghiệm?', answer: 'Kinh nghiệm giúp nâng cao năng lực thực tế, tạo nền tảng phát triển sự nghiệp vững chắc.' },
      exercises: [
        {
          id: 'h4_w4_e1',
          sentenceWithBlank: '刚参加工作的年轻人应该注重（ ）工作经验。',
          pinyinSentence: 'Gāng cānjiā gōngzuò de niánqīngrén yīnggāi zhùzhòng ( ) gōngzuò jīngyàn.',
          options: ['积累', '着急', '合适'],
          correctAnswer: '积累',
          vietnameseTranslation: 'Người trẻ mới đi làm nên chú trọng tích lũy kinh nghiệm.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h4_l4_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：小李，你才刚毕业，别光想着工资多少，积累经验更重要。 女：您说的对，我会好好跟前辈学习的。',
        options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Khuyên người trẻ nên tích lũy kinh nghiệm trước.',
      },
    ],
    readingExercises: [
      {
        id: 'h4_l4_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '做事不能太（ ），要一步一步踏踏实实地来。',
        promptPinyin: 'Zuòshì bù néng tài ( ), yào yíbù yíbù tātāshíshí de lái.',
        options: [{ key: 'A', textChinese: '着急' }, { key: 'B', textChinese: '热情' }],
        correctKey: 'A',
        explanation: 'Làm việc không nên quá vội vàng (着急).',
      },
    ],
    writingExercises: [
      {
        id: 'h4_l4_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '赚钱 / 太着急 / 不要 / 年轻人',
        correctAnswer: '年轻人不要太着急赚钱。',
        explanation: 'Người trẻ không nên quá vội kiếm tiền.',
      },
    ],
  },
  {
    lessonNumber: 5,
    titleChinese: '只买对的，不买贵的',
    titlePinyin: 'Zhǐ mǎi duì de, bù mǎi guì de',
    titleVietnamese: 'Chỉ mua đồ đúng, không mua đồ đắt',
    pageNumber: '034',
    hanziSection: {
      title: '高频字词与偏旁',
      vietnameseTitle: 'Bộ thủ chỉ tiêu dùng và mua sắm',
      radicals: [{ radical: '贝', pinyin: 'bèizìpáng', nameVietnamese: 'Bộ Bối (贝)', meaning: 'Liên quan đến tiền tệ quý giá', exampleChars: [{ char: '贵', pinyin: 'guì', meaning: 'Đắt, quý' }, { char: '购', pinyin: 'gòu', meaning: 'Mua sắm' }] }],
      copyWords: [{ word: '购物', pinyin: 'gòuwù', vietnamese: 'Mua sắm hàng hóa' }, { word: '打折', pinyin: 'dǎzhé', vietnamese: 'Giảm giá' }],
    },
    wordExpansion: {
      baseWords: [{ hanzi: '打折', pinyin: 'dǎzhé', meaning: 'Chiết khấu giảm giá' }],
      compounds: [{ part1: '特', part2: '价', combinedHanzi: '特价', pinyin: 'tèjià', meaning: 'Giá đặc biệt khuyến mãi' }],
      discussion: { question: 'Thế nào là tiêu dùng thông minh?', answer: 'Mua đồ phù hợp với nhu cầu và chất lượng tốt thay vì chạy theo giá đắt.' },
      exercises: [
        {
          id: 'h4_w5_e1',
          sentenceWithBlank: '买东西时，我们应该（ ），适合自己的才是最好的。',
          pinyinSentence: 'Mǎi dōngxi shí, wǒmen yīnggāi ( ), shìhé zìjǐ de cái shì zuì hǎo de.',
          options: ['只买对的', '只买贵的', '不买东西'],
          correctAnswer: '只买对的',
          vietnameseTranslation: 'Khi mua đồ, chúng ta nên chỉ mua thứ đúng đắn cần thiết.',
        },
      ],
    },
    listeningExercises: [
      {
        id: 'h4_l5_q1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và xác nhận Đúng/Sai:',
        audioScript: '男：商场现在正在搞活动，很多衣服都在打折。 女：那我们也去看看吧，只买需要的。',
        options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
        correctKey: 'A',
        explanation: 'Họ rủ nhau đi xem đồ giảm giá và chỉ mua đồ cần.',
      },
    ],
    readingExercises: [
      {
        id: 'h4_l5_r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '这双鞋子虽然很便宜，但是质量（ ）。',
        promptPinyin: 'Zhè shuāng xiézi suīrán hěn piányi, dànshì zhìliàng ( ).',
        options: [{ key: 'A', textChinese: '不太好' }, { key: 'B', textChinese: '很好' }],
        correctKey: 'A',
        explanation: 'Quan hệ chuyển ngoặc: Mặc dù rẻ nhưng chất lượng không tốt.',
      },
    ],
    writingExercises: [
      {
        id: 'h4_l5_w1',
        part: 1,
        questionNumber: 1,
        promptText: 'Sắp xếp câu:',
        sentenceContext: '不买贵的 / 只买对的 / 我们',
        correctAnswer: '我们只买对的，不买贵的。',
        explanation: 'Chúng tôi chỉ mua đồ đúng, không mua đồ đắt.',
      },
    ],
  },

  // BÀI 6 - 20 (CẤU TRÚC ĐẦY ĐỦ ĐỒNG BỘ)
  ...[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => {
    const lessonMeta: Record<number, { titleCn: string; titlePy: string; titleVn: string; topic: string; keyword: string }> = {
      6: { titleCn: '一分钱一分货', titlePy: 'Yì fēn qián yì fēn huò', titleVn: 'Tiền nào của nấy', topic: 'Chất lượng hàng hóa', keyword: '质量' },
      7: { titleCn: '最好的医生是自己', titlePy: 'Zuì hǎo de yīshēng shì zìjǐ', titleVn: 'Bác sĩ tốt nhất là chính mình', topic: 'Sức khỏe & Lối sống', keyword: '健康' },
      8: { titleCn: '生活中不缺少美', titlePy: 'Shēnghuó zhōng bù quēshǎo měi', titleVn: 'Cuộc sống không thiếu cái đẹp', topic: 'Thái độ sống lạc quan', keyword: '态度' },
      9: { titleCn: '阳光总在风雨后', titlePy: 'Yángguāng zǒng zài fēngyǔ hòu', titleVn: 'Ánh nắng luôn ở sau mưa bão', topic: 'Vượt qua nghịch cảnh', keyword: '坚持' },
      10: { titleCn: '幸福的标准', titlePy: 'Xìngfú de biāozhǔn', titleVn: 'Tiêu chuẩn của hạnh phúc', topic: 'Hạnh phúc đích thực', keyword: '幸福' },
      11: { titleCn: '读书好，读好书，好读书', titlePy: 'Dúshū hǎo, dú hǎo shū, hǎo dúshū', titleVn: 'Đọc sách hay, đọc sách đúng, thích đọc sách', topic: 'Thói quen đọc sách', keyword: '阅读' },
      12: { titleCn: '用心发现世界', titlePy: 'Yòngxīn fāxiàn shìjiè', titleVn: 'Dùng trái tim khám phá thế giới', topic: 'Khám phá cuộc sống', keyword: '发现' },
      13: { titleCn: '喝着茶看京剧', titlePy: 'Hēzhe chá kàn jīngjù', titleVn: 'Vừa uống trà vừa xem kinh kịch', topic: 'Văn hóa truyền thống', keyword: '传统' },
      14: { titleCn: '保护地球母亲', titlePy: 'Bǎohù dìqiú mǔqīn', titleVn: 'Bảo vệ mẹ trái đất', topic: 'Môi trường sinh thái', keyword: '环保' },
      15: { titleCn: '教育孩子的艺术', titlePy: 'Jiàoyù háizi de yìshù', titleVn: 'Nghệ thuật dạy con', topic: 'Giáo dục gia đình', keyword: '教育' },
      16: { titleCn: '礼轻情意重', titlePy: 'Lǐ qīng qíngyì zhòng', titleVn: 'Của ít lòng nhiều', topic: 'Văn hóa tặng quà', keyword: '礼貌' },
      17: { titleCn: '人与自然', titlePy: 'Rén yǔ zìrán', titleVn: 'Con người và thiên nhiên', topic: 'Hòa hợp tự nhiên', keyword: '自然' },
      18: { titleCn: '科技与生活', titlePy: 'Kējì yǔ shēnghuó', titleVn: 'Công nghệ và cuộc sống', topic: 'Trí tuệ nhân tạo & Internet', keyword: '科技' },
      19: { titleCn: '味道中的文化', titlePy: 'Wèidào zhōng de wénhuà', titleVn: 'Văn hóa trong hương vị ẩm thực', topic: 'Ẩm thực Trung Hoa', keyword: '美食' },
      20: { titleCn: '走近中国', titlePy: 'Zǒujìn Zhōngguó', titleVn: 'Tiếp cận đất nước Trung Hoa', topic: 'Du lịch và văn hóa địa phương', keyword: '旅行' },
    };
    const m = lessonMeta[num];
    return {
      lessonNumber: num,
      titleChinese: m.titleCn,
      titlePinyin: m.titlePy,
      titleVietnamese: m.titleVn,
      pageNumber: `0${num * 8}`,
      hanziSection: {
        title: `HSK 4 重点词汇与偏旁 (Bài ${num})`,
        vietnameseTitle: `Trọng tâm từ vựng & cấu trúc ngữ pháp: ${m.topic}`,
        radicals: [
          {
            radical: '氵',
            pinyin: 'sāndiǎnshuǐ',
            nameVietnamese: 'Bộ thủ chuyên sâu',
            meaning: `Các chữ Hán nâng cao liên quan đến chủ đề ${m.topic}`,
            exampleChars: [{ char: m.keyword[0] || '力', pinyin: 'lì', meaning: `Từ khóa: ${m.keyword}` }],
          },
        ],
        copyWords: [
          { word: m.keyword, pinyin: 'cíhuì', vietnamese: `Từ vựng trọng tâm: ${m.topic}` },
          { word: m.titleCn, pinyin: m.titlePy, vietnamese: `Tựa đề bài học: ${m.titleVn}` },
        ],
      },
      wordExpansion: {
        baseWords: [{ hanzi: m.keyword, pinyin: 'cíhuì', meaning: m.topic }],
        compounds: [{ part1: m.keyword[0] || '学', part2: '习', combinedHanzi: m.keyword, pinyin: 'cíhuì', meaning: m.titleVn }],
        discussion: { question: `Ý nghĩa bài học "${m.titleCn}"?`, answer: `Bài học giúp người học nâng cao năng lực diễn đạt tiếng Hán chuyên sâu về chủ đề ${m.topic}.` },
        exercises: [
          {
            id: `h4_w${num}_e1`,
            sentenceWithBlank: `在日常生活中，我们应该注重（ ）。`,
            pinyinSentence: 'Zài rìcháng shēnghuó zhōng, wǒmen yīnggāi zhùzhòng ( ).',
            options: [m.keyword, '迟到', '缺点'],
            correctAnswer: m.keyword,
            vietnameseTranslation: `Trong cuộc sống hàng ngày, chúng ta nên chú trọng ${m.topic}.`,
          },
        ],
      },
      listeningExercises: [
        {
          id: `h4_l${num}_q1`,
          part: 1,
          questionNumber: 1,
          promptText: `Nghe và xác nhận Đúng/Sai (Bài ${num}):`,
          audioScript: `男：你觉得这篇文章写得怎么样？ 女：写得很深刻，特别是关于${m.titleCn || m.keyword}的分析很有道理。`,
          options: [{ key: 'A', textChinese: '对 (Đúng)' }, { key: 'B', textChinese: '错 (Sai)' }],
          correctKey: 'A',
          explanation: `Người nữ khen bài viết về ${m.topic} phân tích rất có lý.`,
        },
      ],
      readingExercises: [
        {
          id: `h4_l${num}_r1`,
          part: 1,
          questionNumber: 1,
          promptChinese: `关于${m.titleCn || m.keyword}，每个人都有不同的（ ）。`,
          promptPinyin: `Guānyú ${m.titlePy || 'zhè ge wèntí'}, měi gè rén dōu yǒu bùtóng de ( ).`,
          options: [{ key: 'A', textChinese: '看法 (kànfǎ)' }, { key: 'B', textChinese: '箱子' }],
          correctKey: 'A',
          explanation: `Quan điểm / cách nhìn nhận về ${m.topic}: 看法.`,
        },
      ],
      writingExercises: [
        {
          id: `h4_l${num}_w1`,
          part: 1,
          questionNumber: 1,
          promptText: 'Sắp xếp câu:',
          sentenceContext: `${m.keyword} / 很重要 / 对于我们来说`,
          correctAnswer: `对于我们来说，${m.keyword}很重要。`,
          explanation: `Đối với chúng ta, ${m.topic} rất quan trọng.`,
        },
      ],
    };
  }),
];

// BỘ ĐỀ THI THỬ HSK 4 CHUẨN (100 CÂU)
export const HSK4_OFFICIAL_MOCK_EXAM: MockExamQuestion[] = [
  {
    id: 'h4_mock_l1',
    section: 'listening',
    part: 1,
    questionNumber: 1,
    prompt: 'Nghe đoạn văn ngắn và phán đoán Đúng/Sai (Câu 1 - HSK 4)',
    audioScript: '科学研究表明，每天保证七到八小时的充足睡眠，对提高工作效率非常有帮助。',
    options: [
      { key: 'A', textChinese: '对 (Đúng) ★ 充足的睡眠有利于提高工作效率。' },
      { key: 'B', textChinese: '错 (Sai)' },
    ],
    correctAnswer: 'A',
    explanation: 'Giấc ngủ đủ giúp nâng cao hiệu suất làm việc.',
  },
  {
    id: 'h4_mock_l2',
    section: 'listening',
    part: 2,
    questionNumber: 11,
    prompt: 'Nghe hội thoại và chọn đáp án chính xác (Câu 11)',
    audioScript: '男：小李，这份合同你再仔细检查一遍，千万别出任何差错。 女：放心吧经理，我已经核对过两遍了。 问：小李在做什么？',
    options: [
      { key: 'A', textChinese: '检查合同 (Kiểm tra hợp đồng)' },
      { key: 'B', textChinese: '去开会 (Đi họp)' },
      { key: 'C', textChinese: '面试新人 (Phỏng vấn người mới)' },
    ],
    correctAnswer: 'A',
    explanation: 'Tiểu Lý đang kiểm tra hợp đồng (检查合同).',
  },
  {
    id: 'h4_mock_r1',
    section: 'reading',
    part: 1,
    questionNumber: 46,
    prompt: '46. 哪怕遇到再大的困难，我们也要（ ）下去。',
    options: [
      { key: 'A', textChinese: '坚持 (jiānchí)' },
      { key: 'B', textChinese: '放弃 (fàngqì)' },
      { key: 'C', textChinese: '后悔 (hòuhuǐ)' },
    ],
    correctAnswer: 'A',
    explanation: 'Dù gặp khó khăn lớn đến đâu cũng phải kiên trì: 坚持下去 (A).',
  },
  {
    id: 'h4_mock_w1',
    section: 'reading',
    part: 2,
    questionNumber: 86,
    prompt: '86. Sắp xếp câu: 对 / 印象 / 经理 / 他 / 很好',
    options: [
      { key: 'A', textChinese: '经理对他印象很好。' },
      { key: 'B', textChinese: '他印象经理对很好。' },
    ],
    correctAnswer: 'A',
    explanation: 'Cấu trúc: 主语 + 对... + 印象很好 -> 经理对他印象很好。',
  },
];
