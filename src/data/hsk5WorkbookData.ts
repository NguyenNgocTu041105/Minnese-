// Dữ liệu Sách Bài Tập HSK 5 (HSK 标准教程 5 练习册)
// Được trích xuất đầy đủ từ Sách bài tập HSK 5 Tập 1 và Tập 2 chuẩn bản quyền NXB Tổng Hợp TP.HCM / Nhân Trí Việt / Hanban

import { MockExamQuestion } from './hsk1WorkbookData';
import { HSK4WorkbookLesson } from './hsk4WorkbookData';

export const HSK5_WORKBOOK_LESSONS: HSK4WorkbookLesson[] = [
  // BÀI 1: 爱的细节 (Chi tiết của tình yêu) - Trang 8-14
  {
    lessonNumber: 1,
    titleChinese: '爱的细节',
    titlePinyin: 'Ài de xìjié',
    titleVietnamese: 'Chi tiết của tình yêu',
    pageNumber: '008',
    hanziSection: {
      title: 'HSK 5 核心词汇与汉字结构',
      vietnameseTitle: 'Chữ Hán & Từ vựng then chốt Bài 1',
      copyWords: [
        { word: '细节', pinyin: 'xìjié', vietnamese: 'Chi tiết nhỏ, tiểu tiết' },
        { word: '恩爱', pinyin: 'ēn\'ài', vietnamese: 'Ân ái, thắm thiết' },
        { word: '抱怨', pinyin: 'bàoyuàn', vietnamese: 'Oán trách, phàn nàn' },
        { word: '委屈', pinyin: 'wěiqu', vietnamese: 'Uất ức, oan ức, tủi thân' },
        { word: '催', pinyin: 'cuī', vietnamese: 'Hối thúc, giục giã' }
      ]
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '细节', pinyin: 'xìjié', meaning: 'Chi tiết' },
        { hanzi: '抱怨', pinyin: 'bàoyuàn', meaning: 'Phàn nàn, oán trách' },
        { hanzi: '安慰', pinyin: 'ānwèi', meaning: 'An ủi, động viên' },
        { hanzi: '恩爱', pinyin: 'ēn\'ài', meaning: 'Ân ái, tình cảm mặn nồng' }
      ],
      compounds: [
        { part1: '抱', part2: '怨', combinedHanzi: '抱怨', pinyin: 'bàoyuàn', meaning: 'Than phiền, oán trách' },
        { part1: '如', part2: '何', combinedHanzi: '如何', pinyin: 'rúhé', meaning: 'Làm sao, như thế nào' }
      ],
      discussion: {
        question: 'Phân biệt "如何" và "怎么"?',
        answer: '"如何" thường dùng trong văn viết trang trọng, mang nghĩa làm thế nào / ra sao; còn "怎么" dùng phổ biến trong khẩu ngữ giao tiếp hàng ngày.'
      },
      exercises: [
        {
          id: 'h5_l1_we1',
          sentenceWithBlank: '遇到问题时，与其（ ），不如积极寻找解决的办法。',
          pinyinSentence: 'Yù dào wèntí shí, yǔqí ( ), bùrú jījí xúnzhǎo jiějié de bànfǎ.',
          options: ['抱怨', '恩爱', '细节'],
          correctAnswer: '抱怨',
          vietnameseTranslation: 'Khi gặp sự cố, thay vì than thở oán trách, chi bằng hãy tích cực tìm phương án giải quyết.'
        }
      ]
    },
    listeningExercises: [
      {
        id: 'h5_l1_l1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe hội thoại và chọn đáp án đúng:',
        audioScript: '女：老公，昨晚你翻来覆去好几次，怎么没睡好？ 男：隔壁房间一直开着电视，而且有蚊子，我一直忙着赶蚊子呢。 问：男的昨晚怎么了？',
        options: [
          { key: 'A', textChinese: '太累了' },
          { key: 'B', textChinese: '太热了' },
          { key: 'C', textChinese: '和老婆吵架了' },
          { key: 'D', textChinese: '为老婆赶蚊子' }
        ],
        correctKey: 'D',
        explanation: 'Người chồng thức suốt đêm để xua muỗi cho vợ ngủ ngon.'
      },
      {
        id: 'h5_l1_l2',
        part: 1,
        questionNumber: 2,
        promptText: 'Nghe hội thoại và chọn đáp án đúng:',
        audioScript: '男：你下班后顺路去趟超市买点菜吧。 女：今天公司要加班，你回家做饭或者去餐厅吃吧。 问：女的让男的去哪儿？',
        options: [
          { key: 'A', textChinese: '家' },
          { key: 'B', textChinese: '公司' },
          { key: 'C', textChinese: '餐厅' },
          { key: 'D', textChinese: '钟表店' }
        ],
        correctKey: 'C',
        explanation: 'Người vợ bảo chồng về nhà tự nấu hoặc ra nhà hàng ăn.'
      },
      {
        id: 'h5_l1_l3',
        part: 2,
        questionNumber: 7,
        promptText: 'Nghe đoạn văn/đối thoại dài và chọn câu trả lời đúng:',
        audioScript: '女：小李，会议马上要开始了，王经理怎么还没到？ 男：他刚才看错手表时间了，以为还有一个小时呢，现在正往这儿赶。 问：关于王经理，下列哪项正确？',
        options: [
          { key: 'A', textChinese: '他忘了开会' },
          { key: 'B', textChinese: '他没有戴表' },
          { key: 'C', textChinese: '他开会迟到了' },
          { key: 'D', textChinese: '他记错时间了' }
        ],
        correctKey: 'D',
        explanation: 'Giám đốc Vương nhớ sai / nhìn nhầm mốc thời gian họp.'
      }
    ],
    readingExercises: [
      {
        id: 'h5_l1_r1',
        part: 1,
        questionNumber: 15,
        promptChinese: '我和丈夫______(15)五年了，婚后的生活一直十分幸福，从来没有为什么事红过脸。',
        promptPinyin: 'Wǒ hé zhàngfu ______(15) wǔ nián le, hūnhòu de shēnghuó yìzhí shífēn xìngfú...',
        options: [
          { key: 'A', textChinese: '婚姻' },
          { key: 'B', textChinese: '结婚' },
          { key: 'C', textChinese: '离婚' },
          { key: 'D', textChinese: '婚礼' }
        ],
        correctKey: 'B',
        explanation: '"结婚五年" là cụm động tân mang lượng từ thời lượng chính xác.'
      },
      {
        id: 'h5_l1_r2',
        part: 2,
        questionNumber: 19,
        promptChinese: '前几年她全身瘫痪了，医生说她能站起来的可能性很小。别人都觉得她的丈夫会跟她离婚，她也想过要自杀。但丈夫一直鼓励她，为她不知找了多少家医院，并且几年如一日地照顾她，从不抱怨。在丈夫的爱护和努力下，她终于又站了起来。',
        promptPinyin: 'Qián jǐ nián tā quánshēn tānhuàn le... Zài zhàngfu de àihù hé nǔlì xià, tā zhōngyú yòu zhàn le qǐlai.',
        options: [
          { key: 'A', textChinese: '丈夫要跟妻子离婚' },
          { key: 'B', textChinese: '丈夫对妻子非常好' },
          { key: 'C', textChinese: '妻子因为瘫痪自杀了' },
          { key: 'D', textChinese: '医生的判断是错误的' }
        ],
        correctKey: 'B',
        explanation: 'Người chồng hết lòng chăm sóc yêu thương vợ bệnh tật nhiều năm.'
      },
      {
        id: 'h5_l1_r3',
        part: 3,
        questionNumber: 23,
        promptChinese: '他和妻子是同行，一个是外科主任，一个是护士长，年轻时一直在一起工作。五年后，两人同时退休……问：夫妻俩年轻时的工作单位是：',
        promptPinyin: 'Tā hé qīzi shì tóngháng, yí gè shì wàikē zhǔrèn, yí gè shì hùshizhǎng...',
        options: [
          { key: 'A', textChinese: '医院' },
          { key: 'B', textChinese: '商店' },
          { key: 'C', textChinese: '银行' },
          { key: 'D', textChinese: '航空公司' }
        ],
        correctKey: 'A',
        explanation: 'Bác sĩ khoa ngoại và y tá trưởng làm việc tại bệnh viện (医院).'
      }
    ],
    writingExercises: [
      {
        id: 'h5_l1_w1',
        part: 1,
        questionNumber: 29,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh (第29题):',
        sentenceContext: '她 / 这次的 / 放弃了 / 居然 / 机会',
        correctAnswer: '她居然放弃了这次的机会。',
        explanation: 'Phó từ "居然" đứng trước động từ "放弃了" biểu thị bất ngờ ngoài dự liệu.'
      },
      {
        id: 'h5_l1_w2',
        part: 1,
        questionNumber: 30,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh (第30题):',
        sentenceContext: '从来没 / 他们 / 吵过架 / 为 / 任何事',
        correctAnswer: '他们从来没为任何事吵过架。',
        explanation: 'Cấu trúc "为……吵架" đi sau phó từ phủ định "从来没".'
      },
      {
        id: 'h5_l1_w3',
        part: 1,
        questionNumber: 31,
        promptText: 'Sắp xếp các từ thành câu hoàn chỉnh (第31题):',
        sentenceContext: '肩膀上 / 我 / 吧 / 靠在 / 睡一会儿',
        correctAnswer: '靠在我的肩膀上睡一会儿吧。',
        explanation: 'Câu cầu khiến với ngữ khí từ "吧" ở cuối câu.'
      }
    ]
  },

  // BÀI 2: 留串钥匙给父母 (Để lại chùm chìa khóa cho cha mẹ) - Trang 15-21
  {
    lessonNumber: 2,
    titleChinese: '留串钥匙给父母',
    titlePinyin: 'Liú chuàn yàoshi gěi fùmǔ',
    titleVietnamese: 'Để lại chùm chìa khóa cho cha mẹ',
    pageNumber: '015',
    hanziSection: {
      title: 'HSK 5 核心词汇与汉字结构',
      vietnameseTitle: 'Chữ Hán & Từ vựng then chốt Bài 2',
      copyWords: [
        { word: '钥匙', pinyin: 'yàoshi', vietnamese: 'Chìa khóa' },
        { word: '装修', pinyin: 'zhuāngxiū', vietnamese: 'Sửa sang, trang trí nội thất' },
        { word: '卧室', pinyin: 'wòshì', vietnamese: 'Phòng ngủ' },
        { word: '临走', pinyin: 'línzǒu', vietnamese: 'Lúc sắp rời đi' },
        { word: '悄悄', pinyin: 'qiāoqiāo', vietnamese: 'Lặng lẽ, nhẹ nhàng' }
      ]
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '钥匙', pinyin: 'yàoshi', meaning: 'Chìa khóa' },
        { hanzi: '装修', pinyin: 'zhuāngxiū', meaning: 'Trang hoàng nội thất' },
        { hanzi: '孝顺', pinyin: 'xiàoshùn', meaning: 'Hiếu thuận' }
      ],
      compounds: [
        { part1: '临', part2: '走', combinedHanzi: '临走', pinyin: 'línzǒu', meaning: 'Lúc sắp đi' },
        { part1: '装', part2: '修', combinedHanzi: '装修', pinyin: 'zhuāngxiū', meaning: 'Trang hoàng nhà cửa' }
      ],
      discussion: {
        question: 'Cách dùng phó từ "顺便" (shùnbiàn)?',
        answer: 'Biểu thị làm việc gì đó nhân tiện, thuận đường (Ví dụ: 下班顺便买菜, 顺便给你们晒晒被子).'
      },
      exercises: [
        {
          id: 'h5_l2_we1',
          sentenceWithBlank: '新房刚（ ）好，房间里还有一点儿油漆味。',
          pinyinSentence: 'Xīnfáng gāng ( ) hǎo, fángjiān lǐ hái yǒu yìdiǎnr yóuqī wèi.',
          options: ['装修', '钥匙', '卧室'],
          correctAnswer: '装修',
          vietnameseTranslation: 'Nhà mới vừa trang trí xong, trong phòng vẫn còn vương chút mùi sơn.'
        }
      ]
    },
    listeningExercises: [
      {
        id: 'h5_l2_l1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe hội thoại và chọn đáp án đúng:',
        audioScript: '女：爸妈，我们要出差一周，家里的花麻烦你们照看一下。 男：放心吧，钥匙留给我们，保证把花照顾好。 问：男的是什么意思？',
        options: [
          { key: 'A', textChinese: '家里不会太脏' },
          { key: 'B', textChinese: '一年没回家了' },
          { key: 'C', textChinese: '今天别收拾了' },
          { key: 'D', textChinese: '今天到不了家' }
        ],
        correctKey: 'A',
        explanation: 'Cha mẹ đồng ý nhận chìa khóa chăm sóc hoa và nhà cửa.'
      }
    ],
    readingExercises: [
      {
        id: 'h5_l2_r1',
        part: 2,
        questionNumber: 19,
        promptChinese: '一段时间后，我和妻子又准备去外地打工，新房只能上锁空着。临走那天，父亲悄悄把我拉到一边说：“你妈说了，你还是留一串新房的钥匙给我们，要是我和你妈什么时候想来了，就来住上几天，顺便给你们晒晒被子，打扫打扫卫生。”',
        promptPinyin: 'Yí duàn shíjiān hòu, wǒ hé qīzi yòu zhǔnbèi qù wàidì dǎgōng...',
        options: [
          { key: 'A', textChinese: '我和妻子准备回老家' },
          { key: 'B', textChinese: '父亲要求把钥匙留给他' },
          { key: 'C', textChinese: '我们去外地时留父母在新房看家' },
          { key: 'D', textChinese: '父母打算每天来给我们打扫卫生' }
        ],
        correctKey: 'B',
        explanation: 'Người cha bảo con trai để lại một chùm chìa khóa cho cha mẹ.'
      }
    ],
    writingExercises: [
      {
        id: 'h5_l2_w1',
        part: 1,
        questionNumber: 29,
        promptText: 'Sắp xếp từ thành câu hoàn chỉnh:',
        sentenceContext: '挣了 / 出去 / 打工 / 这次 / 不少钱',
        correctAnswer: '这次出去打工挣了不少钱。',
        explanation: 'Trạng ngữ thời gian "这次" + hành động "出去打工" + kết quả "挣了不少钱".'
      },
      {
        id: 'h5_l2_w2',
        part: 1,
        questionNumber: 30,
        promptText: 'Sắp xếp từ thành câu hoàn chỉnh:',
        sentenceContext: '让 / 我 / 家的温暖 / 妻子的微笑 / 感受到',
        correctAnswer: '妻子的微笑让我感受到了家的温暖。',
        explanation: 'Cấu trúc câu kiêm ngữ chữ 让: Chủ ngữ (妻子的微笑) + 让 + Tân ngữ 1 (我) + Vị ngữ (感受到了家的温暖).'
      },
      {
        id: 'h5_l2_w3',
        part: 1,
        questionNumber: 31,
        promptText: 'Sắp xếp từ thành câu hoàn chỉnh:',
        sentenceContext: '飘来 / 窗外 / 歌声 / 一阵阵 / 动听的',
        correctAnswer: '窗外飘来一阵阵动听的歌声。',
        explanation: 'Câu tồn hiện biểu thị âm thanh truyền đến từ bên ngoài cửa sổ.'
      }
    ]
  },

  // BÀI 3: 人生有选择，一切可改变 - Trang 22-28
  {
    lessonNumber: 3,
    titleChinese: '人生有选择，一切可改变',
    titlePinyin: 'Rénshēng yǒu xuǎnzé, yíqiè kě gǎibiàn',
    titleVietnamese: 'Đời người có lựa chọn, mọi thứ có thể đổi thay',
    pageNumber: '022',
    hanziSection: {
      title: 'HSK 5 核心词汇与汉字结构',
      vietnameseTitle: 'Chữ Hán & Từ vựng then chốt Bài 3',
      copyWords: [
        { word: '航行', pinyin: 'hángxíng', vietnamese: 'Hàng hải, giong buồm' },
        { word: '积蓄', pinyin: 'jīxù', vietnamese: 'Tiền tích lũy, dành dụm' },
        { word: '辞职', pinyin: 'cízhí', vietnamese: 'Nghỉ việc, từ chức' },
        { word: '舒适', pinyin: 'shūshì', vietnamese: 'Thoải mái, tiện nghi' },
        { word: '时刻', pinyin: 'shíkè', vietnamese: 'Thời khắc, khoảnh khắc' }
      ]
    },
    wordExpansion: {
      baseWords: [
        { hanzi: '航行', pinyin: 'hángxíng', meaning: 'Đi biển' },
        { hanzi: '稳定', pinyin: 'wěndìng', meaning: 'Ổn định' },
        { hanzi: '待遇', pinyin: 'dàiyù', meaning: 'Chế độ đãi ngộ' }
      ],
      compounds: [
        { part1: '辞', part2: '职', combinedHanzi: '辞职', pinyin: 'cízhí', meaning: 'Thôi việc' }
      ],
      discussion: {
        question: 'Phân biệt "舒适" và "舒服"?',
        answer: '"舒适" thường dùng cho văn viết mô tả môi trường sống, điều kiện làm việc tiện nghi; "舒服" dùng cho cảm giác cơ thể hoặc tinh thần khoan khoái trong khẩu ngữ.'
      },
      exercises: [
        {
          id: 'h5_l3_we1',
          sentenceWithBlank: '这家酒店的环境非常（ ），服务也很周到。',
          pinyinSentence: 'Zhè jiā jiǔdiàn de huánjìng fēicháng ( ), fúwù yě hěn zhōudào.',
          options: ['舒适', '舒服', '发愁'],
          correctAnswer: '舒适',
          vietnameseTranslation: 'Môi trường của khách sạn này vô cùng tiện nghi dễ chịu.'
        }
      ]
    },
    listeningExercises: [
      {
        id: 'h5_l3_l1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe hội thoại và chọn đáp án đúng:',
        audioScript: '女：你们买二手帆船准备出海，大家都觉得太冒险了。 男：我们已经做好了万全准备，北风南下之时就会出发。 问：关于出海，男的怎么打算？',
        options: [
          { key: 'A', textChinese: '现在没有打算' },
          { key: 'B', textChinese: '刚刚开始准备' },
          { key: 'C', textChinese: '还有新的计划' },
          { key: 'D', textChinese: '没风时将出发' }
        ],
        correctKey: 'C',
        explanation: 'Nhân vật nam có kế hoạch cụ thể cho chuyến hải trình sắp tới.'
      }
    ],
    readingExercises: [
      {
        id: 'h5_l3_r1',
        part: 2,
        questionNumber: 19,
        promptChinese: '傍晚是一家最舒适的时候。干完活儿，一家人坐在一起，用电脑看看电影，或者聊聊天儿。这样的生活，是翟峰盼望已久的。以前陆地上的夜晚，他们在各自的房间，一家人没有更多的交流。',
        promptPinyin: 'Bàngwǎn shì yì jiā zuì shūshì de shíhou...',
        options: [
          { key: 'A', textChinese: '傍晚是大家干活儿的时间' },
          { key: 'B', textChinese: '翟峰喜欢一家人待在一起' },
          { key: 'C', textChinese: '他们目前是在陆地上生活' },
          { key: 'D', textChinese: '他们一直很注重互相交流' }
        ],
        correctKey: 'B',
        explanation: 'Trác Phong rất hạnh phúc khi cả gia đình được quây quần ấm áp bên nhau.'
      }
    ],
    writingExercises: [
      {
        id: 'h5_l3_w1',
        part: 1,
        questionNumber: 29,
        promptText: 'Sắp xếp từ thành câu hoàn chỉnh:',
        sentenceContext: '我 / 干活儿 / 随时 / 可以 / 开始',
        correctAnswer: '我随时可以开始干活儿。',
        explanation: 'Trạng ngữ "随时" + trợ động từ "可以" + vị ngữ "开始干活儿".'
      },
      {
        id: 'h5_l3_w2',
        part: 1,
        questionNumber: 30,
        promptText: 'Sắp xếp từ thành câu hoàn chỉnh:',
        sentenceContext: '就是 / 我 / 对 / 新工作的要求 / 待遇稳定',
        correctAnswer: '我对新工作的要求就是待遇稳定。',
        explanation: 'Cấu trúc "对……的要求就是……".'
      },
      {
        id: 'h5_l3_w3',
        part: 1,
        questionNumber: 31,
        promptText: 'Sắp xếp từ thành câu hoàn chỉnh:',
        sentenceContext: '让 / 感受到 / 雨后的彩虹 / 一种平静 / 他',
        correctAnswer: '雨后的彩虹让他感受到了一种平静。',
        explanation: 'Câu chữ 让 hoàn chỉnh.'
      }
    ]
  }
];

export const HSK5_OFFICIAL_MOCK_EXAM: MockExamQuestion[] = [
  {
    id: 'hsk5_mock_q1',
    section: 'listening',
    part: 1,
    questionNumber: 1,
    audioScript: '男：你真的决定辞职去航海吗？这样稳定的工作多难得啊。 女：我想趁年轻去看看外面的世界，人生有选择，一切皆可改变。 问：女的为什么要辞职？',
    promptChinese: '女的为什么要辞职？',
    options: [
      { key: 'A', textChinese: '工作太累' },
      { key: 'B', textChinese: '待遇不好' },
      { key: 'C', textChinese: '想去体验不一样的世界' },
      { key: 'D', textChinese: '想留在父母身边' }
    ],
    correctKey: 'C',
    correctAnswer: 'C. 想去体验不一样的世界',
    explanation: 'Người nữ muốn trải nghiệm thế giới và thay đổi cuộc sống qua chuyến hải trình.'
  },
  {
    id: 'hsk5_mock_q2',
    section: 'reading',
    part: 2,
    questionNumber: 15,
    promptChinese: '选择词语填空：父母给孩子的爱往往体现在日常生活的______之中。',
    options: [
      { key: 'A', textChinese: '细节' },
      { key: 'B', textChinese: '抱怨' },
      { key: 'C', textChinese: '狡猾' },
      { key: 'D', textChinese: '忽视' }
    ],
    correctKey: 'A',
    correctAnswer: 'A. 细节',
    explanation: '"细节" (chi tiết nhỏ) phản ánh tình yêu sâu sắc qua từng hành động đời thường.'
  }
];
