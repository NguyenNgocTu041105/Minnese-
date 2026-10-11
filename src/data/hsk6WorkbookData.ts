// Dữ liệu Sách Bài Tập HSK 6 (HSK 标准教程 6 练习册)
// Được trích xuất đầy đủ từ Sách bài tập HSK 6 Tập 1 và Tập 2 chuẩn bản quyền NXB Tổng Hợp TP.HCM / Nhân Trí Việt / Hanban

import { MockExamQuestion } from './hsk1WorkbookData';
import { HSK4WorkbookLesson } from './hsk4WorkbookData';

export const HSK6_WORKBOOK_LESSONS: HSK4WorkbookLesson[] = [
  // BÀI 1: 孩子给我们的启示 (Bài học con trẻ cho chúng ta) - Trang 8-15
  {
    lessonNumber: 1,
    titleChinese: '孩子给我们的启示',
    titlePinyin: 'Háizi gěi wǒmen de qǐshì',
    titleVietnamese: 'Bài học con trẻ mang lại cho chúng ta',
    pageNumber: '008',
    hanziSection: {
      title: 'HSK 6 核心词汇与高级成语',
      vietnameseTitle: 'Chữ Hán & Thành ngữ cao cấp Bài 1',
      copyWords: [
        { word: '启示', pinyin: 'qǐshì', vietnamese: 'Gợi mở, bài học truyền cảm hứng' },
        { word: '督促', pinyin: 'dūcù', vietnamese: 'Đốc thúc, nhắc nhở' },
        { word: '溺爱', pinyin: 'nì\'ài', vietnamese: 'Nuông chiều quá mức' },
        { word: '扼杀', pinyin: 'èshā', vietnamese: 'Bóp nghẹt, triệt tiêu' },
        { word: '包办代替', pinyin: 'bāobàn dàitì', vietnamese: 'Làm thay bao biện mọi việc' }
      ]
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '启示', pinyin: 'qǐshì', meaning: 'Khơi gợi, sự gợi ý sâu sắc' },
        { hanzi: '包办', pinyin: 'bāobàn', meaning: 'Bao biện, làm thay tất cả' },
        { hanzi: '自立', pinyin: 'zìlì', meaning: 'Tự lập, tự cường' }
      ],
      compounds: [
        { part1: '启', part2: '示', combinedHanzi: '启示', pinyin: 'qǐshì', meaning: 'Bài học gợi mở' },
        { part1: '督', part2: '促', combinedHanzi: '督促', pinyin: 'dūcù', meaning: 'Đôn đốc, thúc giục' }
      ],
      discussion: {
        question: 'Thành ngữ "包办代替" trong giáo dục gia đình có tác hại gì?',
        answer: 'Nó tước đoạt cơ hội tự lập, rèn luyện kỹ năng thực tế và tư duy chủ động của con trẻ (扼杀孩子的成长动力).'
      },
      exercises: [
        {
          id: 'h6_l1_we1',
          sentenceWithBlank: '父母过度的（ ）和包办，往往会扼杀孩子独立生活的能力。',
          pinyinSentence: 'Fùmǔ guòdù de ( ) hé bāobàn, wǎngwǎng huì èshā háizi dúlì shēnghuó de nénglì.',
          options: ['溺爱', '启示', '督促'],
          correctAnswer: '溺爱',
          vietnameseTranslation: 'Sự nuông chiều quá mức và làm thay mọi việc của cha mẹ thường bóp nghẹt tính tự lập của trẻ.'
        }
      ]
    },
    listeningExercises: [
      {
        id: 'h6_l1_l1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe đoạn văn ngắn và chọn câu có ý nghĩa đúng nhất:',
        audioScript: '阿姨去明明家做客，明明主动倒茶给阿姨喝，阿姨夸明明懂事，明明自豪地说这是他自己学会的。 问：下列哪项与听力内容一致？',
        options: [
          { key: 'A', textChinese: '阿姨特别喜欢孩子' },
          { key: 'B', textChinese: '阿姨去明明家做客' },
          { key: 'C', textChinese: '明明很喜欢喝凉茶' },
          { key: 'D', textChinese: '明明自己喝茶自己倒' }
        ],
        correctKey: 'B',
        explanation: 'Dì tới nhà bé Minh làm khách.'
      },
      {
        id: 'h6_l1_l2',
        part: 2,
        questionNumber: 8,
        promptText: 'Nghe phỏng vấn chuyên gia và chọn đáp án đúng:',
        audioScript: '记者：很多家长习惯替孩子做所有决定，您怎么看？ 专家：家长不要太能干，更不要包办代替，要学会放手让孩子承担责任。 问：专家对家长提出了什么建议？',
        options: [
          { key: 'A', textChinese: '家长不要太能干了' },
          { key: 'B', textChinese: '家长不要包办代替' },
          { key: 'C', textChinese: '要让孩子懂得负责' },
          { key: 'D', textChinese: '要多给孩子一些爱' }
        ],
        correctKey: 'B',
        explanation: 'Chuyên gia nhấn mạnh cha mẹ không nên làm thay bao biện tất cả cho trẻ.'
      }
    ],
    readingExercises: [
      {
        id: 'h6_l1_r1',
        part: 1,
        questionNumber: 18,
        promptChinese: '请选出有语病的一项 (Tìm câu có lỗi ngữ pháp):',
        promptPinyin: 'Qǐng xuǎnchū yǒu yǔbìng de yí xiàng:',
        options: [
          { key: 'A', textChinese: '明清时期，这里成了旅游胜地。' },
          { key: 'B', textChinese: '我约好了，下午去见面的朋友。' },
          { key: 'C', textChinese: '他人倒是挺好，就是有时候太任性，也不够宽容。' },
          { key: 'D', textChinese: '如果你想听清别人说什么话，就别急着嚷嚷，耐心听别人把话说完。' }
        ],
        correctKey: 'B',
        explanation: 'Câu B sai ngữ pháp do "见面" là động từ ly hợp không thể mang trực tiếp định ngữ "见面的朋友", sửa thành "去见我的朋友" hoặc "去和朋友见面".'
      },
      {
        id: 'h6_l1_r2',
        part: 4,
        questionNumber: 29,
        promptChinese: '阅读短文回答问题：许多孩子一放假就整天坐在电视机前打游戏，家长应当如何科学引导？',
        promptPinyin: 'Xǔduō háizi yí fàngjià jiù zhěngtiān zuò zài diànshìjī qián...',
        options: [
          { key: 'A', textChinese: '不做假期作业' },
          { key: 'B', textChinese: '不愿意再上学' },
          { key: 'C', textChinese: '有奖励才学习' },
          { key: 'D', textChinese: '玩儿命打游戏' }
        ],
        correctKey: 'D',
        explanation: 'Nhiều trẻ nhỏ kỳ nghỉ chỉ mải mê chơi game không màng xung quanh.'
      }
    ],
    writingExercises: [
      {
        id: 'h6_l1_w1',
        part: 1,
        questionNumber: 37,
        promptText: 'Rút gọn văn bản (缩写) khoảng 400 chữ:',
        sentenceContext: '1910年华罗庚出生在江苏省金坛市。家境清贫的他刻苦钻研数学，在王维克老师的资助与引导下自学成才，终成世界著名数学家……',
        correctAnswer: '华罗庚克服贫困残疾，在王维克老师帮助下刻苦自学数学，发表论文获清华破格聘用，终成享誉世界的数学大师。',
        explanation: 'Tóm tắt bài văn trần thuật theo mạch: Hoàn cảnh -> Nghị lực học tập -> Cơ duyên gặp ân sư -> Thành tựu đạt được.'
      }
    ]
  },

  // BÀI 2: 父母之爱 (Tình yêu thương của cha mẹ) - Trang 16-23
  {
    lessonNumber: 2,
    titleChinese: '父母之爱',
    titlePinyin: 'Fùmǔ zhī ài',
    titleVietnamese: 'Tình yêu thương của cha mẹ',
    pageNumber: '016',
    hanziSection: {
      title: 'HSK 6 核心词汇与句型',
      vietnameseTitle: 'Chữ Hán & Cụm từ chuyên sâu Bài 2',
      copyWords: [
        { word: '啃老族', pinyin: 'kěnlǎozú', vietnamese: 'Giới trẻ ăn bám cha mẹ' },
        { word: '摩擦', pinyin: 'mócā', vietnamese: 'Ma sát, xích mích va chạm' },
        { word: '叛逆', pinyin: 'pànnì', vietnamese: 'Nổi loạn, chống đối' },
        { word: '自立门户', pinyin: 'zìlì ménhù', vietnamese: 'Tự lập riêng, gây dựng cơ đồ' }
      ]
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '摩擦', pinyin: 'mócā', meaning: 'Va chạm, mâu thuẫn' },
        { hanzi: '沟通', pinyin: 'gōutōng', meaning: 'Giao tiếp thấu hiểu' }
      ],
      compounds: [
        { part1: '叛', part2: '逆', combinedHanzi: '叛逆', pinyin: 'pànnì', meaning: 'Nổi loạn thời dậy thì' }
      ],
      discussion: {
        question: 'Làm thế nào hóa giải mâu thuẫn tuổi dậy thì giữa cha mẹ và con cái?',
        answer: 'Tôn trọng quyền độc lập của trẻ, bình đẳng lắng nghe và tăng cường giao lưu thấu hiểu (平等沟通，理解尊重).'
      },
      exercises: [
        {
          id: 'h6_l2_we1',
          sentenceWithBlank: '青春期的孩子心理变化大，家长应多与他们进行平等的（ ）。',
          pinyinSentence: 'Qīngchūnqī de háizi xīnlǐ biànhuà dà, jiāzhǎng yīng duō yǔ tāmen jìnxíng píngděng de ( ).',
          options: ['沟通', '摩擦', '包办'],
          correctAnswer: '沟通',
          vietnameseTranslation: 'Trẻ trong giai đoạn dậy thì tâm lý biến đổi lớn, cha mẹ nên giao tiếp bình đẳng nhiều hơn cùng con.'
        }
      ]
    },
    listeningExercises: [
      {
        id: 'h6_l2_l1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe đoạn văn và chọn đáp án đúng:',
        audioScript: '爸爸每天晚上都会给我热一杯牛奶，虽然话不多，但他总是默默关心我的起居。 问：关于爸爸，下列哪项正确？',
        options: [
          { key: 'A', textChinese: '爸爸为人很和气' },
          { key: 'B', textChinese: '爸爸也喜欢夜读' },
          { key: 'C', textChinese: '爸爸非常关心我' },
          { key: 'D', textChinese: '睡前应该喝牛奶' }
        ],
        correctKey: 'C',
        explanation: 'Người cha luôn thầm lặng quan tâm, chăm sóc con cái chu đáo.'
      }
    ],
    readingExercises: [
      {
        id: 'h6_l2_r1',
        part: 1,
        questionNumber: 18,
        promptChinese: '请选出有语病的一项 (Tìm câu có lỗi ngữ pháp):',
        promptPinyin: 'Qǐng xuǎnchū yǒu yǔbìng de yí xiàng:',
        options: [
          { key: 'A', textChinese: '看似简单的藤椅，其实制作起来却并不难。' },
          { key: 'B', textChinese: '真是瞎折腾，这条路刚开通几天又被挖了，这不是浪费钱嘛！' },
          { key: 'C', textChinese: '民宿作为中国旅游的新业态，一经出现便受到了很多人的关注。' },
          { key: 'D', textChinese: '有了政府支持、社会保障、科技助力，智能养老产业一定能不断发展壮大。' }
        ],
        correctKey: 'A',
        explanation: 'Câu A mắc lỗi logic lặp thừa từ: "其实……却" bị trùng lặp sắc thái chuyển ngoặt, bỏ "却" thành "其实制作起来并不难".'
      }
    ],
    writingExercises: [
      {
        id: 'h6_l2_w1',
        part: 1,
        questionNumber: 37,
        promptText: 'Thu gọn bài văn "Tình mẹ" (400 chữ):',
        sentenceContext: '20岁瘫痪的史铁生在母亲无微不至的鼓励与陪伴下走上文学创作之路，当第一篇小说发表时母亲却已离世……',
        correctAnswer: '史铁生双腿瘫痪后脾气暴躁，母亲忍着重病悉心呵护并鼓励他写作。最终史铁生成为杰出作家，深情怀念伟大的母亲。',
        explanation: 'Tóm lược cảm động tình mẫu tử cao cả nâng đỡ số phận người con.'
      }
    ]
  }
];

export const HSK6_OFFICIAL_MOCK_EXAM: MockExamQuestion[] = [
  {
    id: 'hsk6_mock_q1',
    section: 'listening',
    part: 1,
    questionNumber: 1,
    audioScript: '男：你觉得对于现代企业来说，最核心的竞争优势是什么？ 女：毫无疑问是创新能力和掌握核心技术的高素质人才。 问：女的认为企业的核心优势是什么？',
    promptChinese: '女的认为企业的核心优势是什么？',
    options: [
      { key: 'A', textChinese: '充足的资金' },
      { key: 'B', textChinese: '庞大的厂房' },
      { key: 'C', textChinese: '创新能力与核心人才' },
      { key: 'D', textChinese: '政府的政策扶持' }
    ],
    correctKey: 'C',
    correctAnswer: 'C. 创新能力与核心人才',
    explanation: 'Doanh nghiệp phát triển bền vững phụ thuộc cốt lõi vào sáng tạo đổi mới và nhân tài.'
  }
];
