// Dữ liệu Sách Bài Tập / Sổ Tay Học Và Luyện Tập New HSK 1 (新HSK教程1 学练手册)
// Nhà xuất bản Dân Trí & CTI BOOKS / FLTRP

export interface PhoneticPoint {
  title: string;
  vietnameseTitle: string;
  rules: string[];
  tableHeaders?: string[];
  tableRows?: { [key: string]: string }[];
  audioDrillList?: {
    label: string;
    hanzi?: string;
    pinyin: string;
    vietnamese?: string;
    audioText: string;
  }[];
  explanation?: string;
}

export interface HanziWritingPoint {
  title: string;
  vietnameseTitle: string;
  overview?: string;
  strokes?: {
    shape: string;
    name: string;
    pinyin: string;
    vietnameseName: string;
    direction: string;
    exampleChar: string;
  }[];
  strokeOrderRules?: {
    ruleChinese: string;
    ruleVietnamese: string;
    exampleChar: string;
    pinyin: string;
    meaning: string;
    strokeSequence: string[];
  }[];
  structureTypes?: {
    typeChinese: string;
    typeVietnamese: string;
    exampleChar: string;
    explanation: string;
  }[];
  radicals?: {
    radical: string;
    pinyin: string;
    nameVietnamese: string;
    meaning: string;
    exampleChars: { char: string; pinyin: string; meaning: string }[];
  }[];
  copyWords?: {
    word: string;
    pinyin: string;
    vietnamese: string;
  }[];
}

export interface WorkbookListeningExercise {
  id: string;
  part: 1 | 2 | 3 | 4;
  questionNumber: number;
  promptText: string;
  audioScript: string;
  imageUrl?: string;
  imageEmoji?: string;
  options: {
    key: string;
    textChinese?: string;
    textPinyin?: string;
    textVietnamese?: string;
    imageUrl?: string;
    imageEmoji?: string;
  }[];
  correctKey: string;
  explanation: string;
}

export interface WorkbookReadingExercise {
  id: string;
  part: 1 | 2 | 3 | 4;
  questionNumber: number;
  promptChinese: string;
  promptPinyin: string;
  promptVietnamese?: string;
  subPrompt?: string;
  options: {
    key: string;
    textChinese?: string;
    textPinyin?: string;
    textVietnamese?: string;
    imageEmoji?: string;
  }[];
  correctKey: string;
  explanation: string;
}

export interface WorkbookLesson {
  lessonNumber: number;
  titleChinese: string;
  titlePinyin: string;
  titleVietnamese: string;
  pageNumber: string;
  // Phần 1: Tiểu Ngữ giảng đường (小语讲堂)
  phonetics?: PhoneticPoint[];
  hanziSection?: HanziWritingPoint;
  // Phần 2: Nghe đọc luyện (听读练)
  listenAndReadDrills?: {
    title: string;
    instruction: string;
    type: 'tone' | 'initial' | 'final' | 'dialogue_match' | 'discrimination';
    items: {
      id: string;
      audioText: string;
      options: string[];
      correctAnswer: string;
      pinyinPrompt?: string;
      vietnamesePrompt?: string;
    }[];
  }[];
  // Phần 3: Luyện tập mô phỏng HSK theo bài (模拟训练)
  hskMockListening: WorkbookListeningExercise[];
  hskMockReading: WorkbookReadingExercise[];
}

export const HSK1_WORKBOOK_LESSONS: WorkbookLesson[] = [
  // BÀI 1
  {
    lessonNumber: 1,
    titleChinese: 'AI小语，你好！',
    titlePinyin: 'AI Xiǎoyǔ, nǐ hǎo!',
    titleVietnamese: 'Xin chào AI Tiểu Ngữ!',
    pageNumber: '001',
    phonetics: [
      {
        title: '汉语音节 (Âm tiết tiếng Trung Quốc)',
        vietnameseTitle: 'Cấu tạo âm tiết trong tiếng Hán',
        rules: [
          'Mỗi chữ Hán thường tương ứng với một âm tiết.',
          'Một âm tiết tiếng Trung Quốc gồm: Thanh mẫu (phụ âm đầu), Vận mẫu (nguyên âm) và Thanh điệu (dấu thanh).',
          'Đôi khi có những âm tiết không có thanh mẫu (gọi là âm tiết mở đầu bằng nguyên âm).',
        ],
        tableHeaders: ['Thanh mẫu (声母)', 'Vận mẫu (韵母)', 'Thanh điệu (声调)', 'Âm tiết (音节)', 'Chữ Hán ví dụ (例字)'],
        tableRows: [
          { initial: 'b', final: 'a', tone: '1 (—)', pinyin: 'bā', hanzi: '八 (Tám)' },
          { initial: 'b', final: 'a', tone: '2 (ˊ)', pinyin: 'bá', hanzi: '拔 (Nhổ/Rút)' },
          { initial: 'b', final: 'a', tone: '3 (ˇ)', pinyin: 'bǎ', hanzi: '把 (Cầm/Nắm)' },
          { initial: 'b', final: 'a', tone: '4 (ˋ)', pinyin: 'bà', hanzi: '爸 (Bố/Ba)' },
          { initial: '—', final: 'a', tone: '1 (—)', pinyin: 'ā', hanzi: '阿 (A)' },
          { initial: '—', final: 'a', tone: '2 (ˊ)', pinyin: 'á', hanzi: '啊 (A/Á)' },
        ],
        audioDrillList: [
          { label: 'Trà', hanzi: '茶', pinyin: 'chá', audioText: 'chá' },
          { label: 'Chó', hanzi: '狗', pinyin: 'gǒu', audioText: 'gǒu' },
          { label: 'Mèo', hanzi: '猫', pinyin: 'māo', audioText: 'māo' },
          { label: 'Món ăn / Rau', hanzi: '菜', pinyin: 'cài', audioText: 'cài' },
          { label: 'Cốc, ly', hanzi: '杯子', pinyin: 'bēizi', audioText: 'bēizi' },
          { label: 'Học sinh', hanzi: '学生', pinyin: 'xuésheng', audioText: 'xuésheng' },
          { label: 'Giáo viên', hanzi: '老师', pinyin: 'lǎoshī', audioText: 'lǎoshī' },
          { label: 'Trứng gà', hanzi: '鸡蛋', pinyin: 'jīdàn', audioText: 'jīdàn' },
        ],
      },
      {
        title: '声母和韵母 (1) (Thanh mẫu và Vận mẫu 1)',
        vietnameseTitle: 'Quy tắc ghép âm b, p, m, f, d, t, n, l, g, k, h',
        rules: [
          'Thanh mẫu: b, p, m, f, d, t, n, l, g, k, h.',
          'Vận mẫu: a, o, e, i, u, er, ai, ei, ao, ou, an, en, ang, eng, ong.',
          'Vận mẫu "er" không kết hợp với bất kỳ thanh mẫu nào mà đứng độc lập tạo thành một âm tiết.',
          'Thanh điệu tiếng Hán có 4 thanh cơ bản: Thanh 1 (55), Thanh 2 (35), Thanh 3 (214), Thanh 4 (51).',
        ],
      },
    ],
    listenAndReadDrills: [
      {
        title: 'Nghe ghi âm và phân biệt thanh điệu',
        instruction: 'Nghe âm thanh và chọn phiên âm có thanh điệu chính xác:',
        type: 'tone',
        items: [
          { id: 'l1-d1', audioText: 'mō', options: ['mō', 'mó', 'mǒ', 'mò'], correctAnswer: 'mō' },
          { id: 'l1-d2', audioText: 'fú', options: ['fū', 'fú', 'fǔ', 'fù'], correctAnswer: 'fú' },
          { id: 'l1-d3', audioText: 'dǐ', options: ['dī', 'dí', 'dǐ', 'dì'], correctAnswer: 'dǐ' },
          { id: 'l1-d4', audioText: 'tào', options: ['tāo', 'táo', 'tǎo', 'tào'], correctAnswer: 'tào' },
        ],
      },
      {
        title: 'Chọn hội thoại phù hợp với ngữ cảnh tranh',
        instruction: 'Nhìn tình huống và chọn câu đối thoại chính xác:',
        type: 'dialogue_match',
        items: [
          {
            id: 'l1-d5',
            audioText: 'A: 你好！ B: 你好！',
            vietnamesePrompt: 'Tình huống 1: Hai người bạn lần đầu gặp nhau chào hỏi',
            options: ['A: 你好！ B: 你好！', 'A: 谢谢！ B: 不客气！', 'A: 再见！ B: 再见！'],
            correctAnswer: 'A: 你好！ B: 你好！',
          },
          {
            id: 'l1-d6',
            audioText: 'A: 谢谢！ B: 不客气！',
            vietnamesePrompt: 'Tình huống 2: Người khác giúp bạn và bạn cảm ơn',
            options: ['A: 谢谢！ B: 不客气！', 'A: 对不起！ B: 没关系！', 'A: 你们好！ B: 老师好！'],
            correctAnswer: 'A: 谢谢！ B: 不客气！',
          },
        ],
      },
    ],
    hskMockListening: [
      {
        id: 'hsk1-l1-mock-l1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và chọn hình ảnh phù hợp với nội dung:',
        audioScript: 'sān gè píngguǒ (ba quả táo)',
        options: [
          { key: 'A', imageEmoji: '📚', textVietnamese: 'Sách vở' },
          { key: 'B', imageEmoji: '💻', textVietnamese: 'Máy tính' },
          { key: 'C', imageEmoji: '🍎', textVietnamese: 'Ba quả táo' },
        ],
        correctKey: 'C',
        explanation: 'Từ khóa "三个苹果" nghĩa là ba quả táo -> Đáp án C.',
      },
      {
        id: 'hsk1-l1-mock-l2',
        part: 2,
        questionNumber: 2,
        promptText: 'Nghe câu hỏi và chọn câu trả lời đúng:',
        audioScript: 'Nǐ hǎo ma? (Bạn có khỏe không?)',
        options: [
          { key: 'A', textChinese: '我很好。', textPinyin: 'Wǒ hěn hǎo.', textVietnamese: 'Tôi rất khỏe.' },
          { key: 'B', textChinese: '不客气。', textPinyin: 'Bú kèqi.', textVietnamese: 'Không có gì.' },
          { key: 'C', textChinese: '再见。', textPinyin: 'Zàijiàn.', textVietnamese: 'Tạm biệt.' },
        ],
        correctKey: 'A',
        explanation: 'Câu hỏi "你好吗？" (Bạn khỏe không?) đáp lại là "我很好。" (Tôi rất khỏe).',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l1-mock-r1',
        part: 1,
        questionNumber: 1,
        promptChinese: '老师，您好！',
        promptPinyin: 'Lǎoshī, nín hǎo!',
        promptVietnamese: 'Em kính chào thầy/cô giáo ạ!',
        options: [
          { key: 'A', imageEmoji: '👩‍🏫', textVietnamese: 'Học sinh chào cô giáo' },
          { key: 'B', imageEmoji: '🍎', textVietnamese: 'Quả táo' },
          { key: 'C', imageEmoji: '🚗', textVietnamese: 'Xe hơi' },
        ],
        correctKey: 'A',
        explanation: 'Câu "老师，您好！" diễn tả học sinh chào cô giáo kính cẩn -> Tranh A.',
      },
      {
        id: 'hsk1-l1-mock-r2',
        part: 2,
        questionNumber: 2,
        promptChinese: '谢谢你！',
        promptPinyin: 'Xièxie nǐ!',
        promptVietnamese: 'Cảm ơn bạn!',
        options: [
          { key: 'A', textChinese: '不客气！', textPinyin: 'Bú kèqi!', textVietnamese: 'Không có gì!' },
          { key: 'B', textChinese: '他是学生。', textPinyin: 'Tā shì xuésheng.', textVietnamese: 'Anh ấy là học sinh.' },
          { key: 'C', textChinese: '很好。', textPinyin: 'Hěn hǎo.', textVietnamese: 'Rất tốt.' },
        ],
        correctKey: 'A',
        explanation: 'Khi người khác nói "谢谢你！" (Cảm ơn bạn), câu đáp lịch sự là "不客气！" (Không có gì).',
      },
    ],
  },

  // BÀI 2
  {
    lessonNumber: 2,
    titleChinese: '我叫李文',
    titlePinyin: 'Wǒ jiào Lǐ Wén',
    titleVietnamese: 'Mình tên là Lý Văn',
    pageNumber: '005',
    phonetics: [
      {
        title: '声母和韵母 (2) (Thanh mẫu và Vận mẫu 2)',
        vietnameseTitle: 'Thanh mẫu j, q, x và các vận mẫu nhóm i, ü',
        rules: [
          'Thanh mẫu "j, q, x" chỉ ghép với các vận mẫu "i", "ü" và các vận mẫu bắt đầu bằng "i", "ü". Không ghép trực tiếp với "a, o, u".',
          'Quy tắc viết phiên âm: Khi các vận mẫu "i, u, ü" đứng độc lập tạo thành âm tiết, chúng được viết thành "yi, wu, yu".',
          'Quy tắc ghép j, q, x với "ü": Khi "j, q, x" ghép với "ü", hai dấu chấm trên đầu chữ "ü" sẽ được lược bỏ (viết là ju, qu, xu nhưng vẫn đọc là âm ü).',
          'Vận mẫu "iou" khi ghép với thanh mẫu (m, d, n, l, j, q, x) viết thành "iu" (vd: miu, diu, niu, liu, jiu, qiu, xiu), dấu thanh điệu đặt trên "u".',
        ],
        audioDrillList: [
          { label: 'Gà', hanzi: '鸡', pinyin: 'jī', audioText: 'jī' },
          { label: 'Số 7', hanzi: '七', pinyin: 'qī', audioText: 'qī' },
          { label: 'Viết', hanzi: '写', pinyin: 'xiě', audioText: 'xiě' },
          { label: 'Mời / Xin', hanzi: '请', pinyin: 'qǐng', audioText: 'qǐng' },
          { label: 'Tạm biệt', hanzi: '再见', pinyin: 'zàijiàn', audioText: 'zàijiàn' },
          { label: 'Cảm ơn', hanzi: '谢谢', pinyin: 'xièxie', audioText: 'xièxie' },
          { label: 'Tuần / Thứ', hanzi: '星期', pinyin: 'xīngqī', audioText: 'xīngqī' },
          { label: 'Vui mừng', hanzi: '高兴', pinyin: 'gāoxìng', audioText: 'gāoxìng' },
          { label: 'Mưa', hanzi: '雨', pinyin: 'yǔ', audioText: 'yǔ' },
          { label: 'Số 5', hanzi: '五', pinyin: 'wǔ', audioText: 'wǔ' },
          { label: 'Số 1', hanzi: '一', pinyin: 'yī', audioText: 'yī' },
          { label: 'Cái ghế', hanzi: '椅子', pinyin: 'yǐzi', audioText: 'yǐzi' },
        ],
      },
    ],
    listenAndReadDrills: [
      {
        title: 'Nghe và nhận diện âm tiết j, q, x',
        instruction: 'Nghe ghi âm và chọn phụ âm đầu đúng:',
        type: 'initial',
        items: [
          { id: 'l2-d1', audioText: 'jiā', options: ['j', 'q', 'x'], correctAnswer: 'j' },
          { id: 'l2-d2', audioText: 'qǐng', options: ['j', 'q', 'x'], correctAnswer: 'q' },
          { id: 'l2-d3', audioText: 'xiè', options: ['j', 'q', 'x'], correctAnswer: 'x' },
        ],
      },
    ],
    hskMockListening: [
      {
        id: 'hsk1-l2-mock-l1',
        part: 1,
        questionNumber: 1,
        promptText: 'Nghe và chọn hình ảnh phù hợp:',
        audioScript: 'Nǐ jiào shénme míngzi? (Bạn tên là gì?)',
        options: [
          { key: 'A', imageEmoji: '🪪', textVietnamese: 'Thẻ tên / Giới thiệu bản thân' },
          { key: 'B', imageEmoji: '🍜', textVietnamese: 'Bát mì' },
          { key: 'C', imageEmoji: '🚕', textVietnamese: 'Taxi' },
        ],
        correctKey: 'A',
        explanation: 'Câu hỏi về tên gọi và giới thiệu bản thân -> Tranh A.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l2-mock-r1',
        part: 2,
        questionNumber: 1,
        promptChinese: '很高兴认识你！',
        promptPinyin: 'Hěn gāoxìng rènshi nǐ!',
        promptVietnamese: 'Rất vui được quen biết bạn!',
        options: [
          { key: 'A', textChinese: '认识你我也很高兴！', textPinyin: 'Rènshi nǐ wǒ yě hěn gāoxìng!', textVietnamese: 'Quen biết bạn tôi cũng rất vui!' },
          { key: 'B', textChinese: '我不喝水。', textPinyin: 'Wǒ bù hē shuǐ.', textVietnamese: 'Tôi không uống nước.' },
        ],
        correctKey: 'A',
        explanation: 'Khi đối phương chào mừng làm quen, câu đối đáp chuẩn là "认识你我也很高兴！".',
      },
    ],
  },

  // BÀI 3
  {
    lessonNumber: 3,
    titleChinese: '我是中国人',
    titlePinyin: 'Wǒ shì Zhōngguó rén',
    titleVietnamese: 'Mình là người Trung Quốc',
    pageNumber: '009',
    phonetics: [
      {
        title: '声母和韵母 (3) (Thanh mẫu uốn lưỡi zh, ch, sh, r và đầu lưỡi z, c, s)',
        vietnameseTitle: 'Thanh mẫu âm đầu lưỡi và âm cuốn lưỡi',
        rules: [
          'Âm uốn lưỡi: zh, ch, sh, r (đầu lưỡi cong lên chạm vòm họng cứng).',
          'Âm đầu lưỡi trước: z, c, s (đầu lưỡi thẳng chạm mặt sau răng trên).',
          'Quy tắc nhóm vận mẫu bắt đầu bằng "u": khi đứng độc lập viết thành "w" (wa, wo, wai, wei, wan, wen, wang, weng).',
          'Vận mẫu "uei, uen" khi ghép với thanh mẫu viết gọn thành "ui, un" (vd: shuí, chǔn, suì, cūn).',
        ],
        audioDrillList: [
          { label: 'Người', hanzi: '人', pinyin: 'rén', audioText: 'rén' },
          { label: 'Ngồi', hanzi: '坐', pinyin: 'zuò', audioText: 'zuò' },
          { label: 'Sách', hanzi: '书', pinyin: 'shū', audioText: 'shū' },
          { label: 'Điện thoại di động', hanzi: '手机', pinyin: 'shǒujī', audioText: 'shǒujī' },
          { label: 'Bác sĩ', hanzi: '医生', pinyin: 'yīshēng', audioText: 'yīshēng' },
          { label: 'Bàn', hanzi: '桌子', pinyin: 'zhuōzi', audioText: 'zhuōzi' },
          { label: 'Xe taxi', hanzi: '出租车', pinyin: 'chūzūchē', audioText: 'chūzūchē' },
        ],
      },
    ],
    listenAndReadDrills: [
      {
        title: 'Phân biệt zh/ch/sh vs z/c/s',
        instruction: 'Nghe và chọn thanh mẫu đúng:',
        type: 'initial',
        items: [
          { id: 'l3-d1', audioText: 'shū', options: ['s', 'sh'], correctAnswer: 'sh' },
          { id: 'l3-d2', audioText: 'zuò', options: ['z', 'zh'], correctAnswer: 'z' },
          { id: 'l3-d3', audioText: 'chūn', options: ['c', 'ch'], correctAnswer: 'ch' },
        ],
      },
    ],
    hskMockListening: [
      {
        id: 'hsk1-l3-mock-l1',
        part: 4,
        questionNumber: 1,
        promptText: 'Nghe đoạn hội thoại và trả lời câu hỏi:',
        audioScript: 'Nán: Wáng lǎoshī shì nǐ de Zhōngwén lǎoshī ma? Nǚ: Shì de. (Hỏi: 王老师是哪国人/做什么工作的？)',
        options: [
          { key: 'A', textChinese: '老师', textPinyin: 'lǎoshī', textVietnamese: 'Giáo viên' },
          { key: 'B', textChinese: '医生', textPinyin: 'yīshēng', textVietnamese: 'Bác sĩ' },
          { key: 'C', textChinese: '学生', textPinyin: 'xuésheng', textVietnamese: 'Học sinh' },
        ],
        correctKey: 'A',
        explanation: 'Trong bài nghe xác nhận Vương Lão Sư là giáo viên tiếng Trung -> Đáp án A.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l3-mock-r1',
        part: 4,
        questionNumber: 1,
        promptChinese: '我是中国人，他是法国人。',
        promptPinyin: 'Wǒ shì Zhōngguó rén, tā shì Fǎguó rén.',
        subPrompt: '★ 他是：',
        options: [
          { key: 'A', textChinese: '中国人', textVietnamese: 'Người Trung Quốc' },
          { key: 'B', textChinese: '法国人', textVietnamese: 'Người Pháp' },
          { key: 'C', textChinese: '泰国人', textVietnamese: 'Người Thái Lan' },
        ],
        correctKey: 'B',
        explanation: 'Câu văn nêu rõ: 他是法国人 (Anh ấy là người Pháp) -> Đáp án B.',
      },
    ],
  },

  // BÀI 4
  {
    lessonNumber: 4,
    titleChinese: '我有两个孩子',
    titlePinyin: 'Wǒ yǒu liǎng gè háizi',
    titleVietnamese: 'Chị có hai con',
    pageNumber: '013',
    phonetics: [
      {
        title: '两个三声音节的连读变调 (Biến điệu hai thanh 3 đi liền nhau)',
        vietnameseTitle: 'Quy tắc 2 thanh 3 liền kề: 214 + 214 -> 35 + 214',
        rules: [
          'Khi 2 âm tiết mang thanh 3 đi liền nhau, âm tiết thứ nhất sẽ đọc thành thanh 2 (tức là 214 + 214 -> 35 + 214).',
          'Ví dụ: nǐ + hǎo -> ní hǎo (你好); kě + yǐ -> ké yǐ (可以); hěn + hǎo -> hén hǎo (很好); shuǐ + guǒ -> shuí guǒ (水果); shǒu + biǎo -> shóu biǎo (手表).',
        ],
        audioDrillList: [
          { label: 'Xin chào', hanzi: '你好', pinyin: 'ní hǎo', audioText: 'nǐ hǎo' },
          { label: 'Có thể', hanzi: '可以', pinyin: 'ké yǐ', audioText: 'kě yǐ' },
          { label: 'Rất tốt', hanzi: '很好', pinyin: 'hén hǎo', audioText: 'hěn hǎo' },
          { label: 'Hoa quả', hanzi: '水果', pinyin: 'shuí guǒ', audioText: 'shuǐ guǒ' },
          { label: 'Đồng hồ đeo tay', hanzi: '手表', pinyin: 'shóu biǎo', audioText: 'shǒu biǎo' },
        ],
      },
      {
        title: '轻声 (Thanh nhẹ trong tiếng Trung)',
        vietnameseTitle: 'Cách phát âm âm tiết nhẹ và ngắn',
        rules: [
          'Ngoài 4 thanh điệu cơ bản, một số âm tiết không mang thanh điệu, đọc vừa nhẹ vừa ngắn, gọi là thanh nhẹ (không đánh dấu thanh).',
          'Một số từ khi đọc thanh nhẹ sẽ thay đổi nghĩa: 东西 dōngxi (đồ vật) vs dōngxī (phía đông và tây); 买卖 mǎimai (buôn bán kinh doanh) vs mǎi mài (mua và bán); 孙子 sūnzi (cháu nội) vs Sūnzǐ (Tôn Tử - nhà quân sự).',
        ],
        audioDrillList: [
          { label: 'Mẹ', hanzi: '妈妈', pinyin: 'māma', audioText: 'māma' },
          { label: 'Bố', hanzi: '爸爸', pinyin: 'bàba', audioText: 'bàba' },
          { label: 'Ghế', hanzi: '椅子', pinyin: 'yǐzi', audioText: 'yǐzi' },
          { label: 'Sủi cảo', hanzi: '饺子', pinyin: 'jiǎozi', audioText: 'jiǎozi' },
          { label: 'Quần áo', hanzi: '衣服', pinyin: 'yīfu', audioText: 'yīfu' },
          { label: 'Xinh đẹp', hanzi: '漂亮', pinyin: 'piàoliang', audioText: 'piàoliang' },
          { label: 'Buổi sáng', hanzi: '早上', pinyin: 'zǎoshang', audioText: 'zǎoshang' },
        ],
      },
    ],
    hskMockListening: [
      {
        id: 'hsk1-l4-mock-l1',
        part: 2,
        questionNumber: 4,
        promptText: 'Nghe câu hỏi và chọn câu trả lời đúng:',
        audioScript: 'Nǐ jiā yǒu jǐ kǒu rén? (Nhà bạn có mấy người?)',
        options: [
          { key: 'A', textChinese: '十人', textPinyin: 'shí rén', textVietnamese: 'Mười người' },
          { key: 'B', textChinese: '20个', textPinyin: '20 gè', textVietnamese: '20 cái' },
          { key: 'C', textChinese: '三口人', textPinyin: 'sān kǒu rén', textVietnamese: 'Ba người' },
        ],
        correctKey: 'C',
        explanation: 'Hỏi số lượng thành viên trong gia đình dùng lượng từ "口" -> Đáp án C (三口人).',
      },
      {
        id: 'hsk1-l4-mock-l2',
        part: 4,
        questionNumber: 9,
        promptText: 'Nghe và chọn đáp án đúng:',
        audioScript: 'Tā bú shì Zhōngguó rén, tā shì Fǎguó rén. (Cô ấy không phải người TQ, cô ấy là người Pháp).',
        options: [
          { key: 'A', textChinese: '中国人', textVietnamese: 'Người Trung Quốc' },
          { key: 'B', textChinese: '泰国人', textVietnamese: 'Người Thái Lan' },
          { key: 'C', textChinese: '法国人', textVietnamese: 'Người Pháp' },
        ],
        correctKey: 'C',
        explanation: 'Người được nói đến là người Pháp (法国人) -> Đáp án C.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l4-mock-r1',
        part: 2,
        questionNumber: 14,
        promptChinese: '她是誰？',
        promptPinyin: 'Tā shì shéi?',
        promptVietnamese: 'Cô ấy là ai?',
        options: [
          { key: 'A', textChinese: '好的，谢谢！', textVietnamese: 'Được rồi, cảm ơn!' },
          { key: 'B', textChinese: '他今年5岁。', textVietnamese: 'Nó năm nay 5 tuổi.' },
          { key: 'C', textChinese: '我女朋友。', textVietnamese: 'Bạn gái của tôi.' },
          { key: 'D', textChinese: '是的。', textVietnamese: 'Vâng đúng vậy.' },
        ],
        correctKey: 'C',
        explanation: 'Hỏi "她是誰？" (Cô ấy là ai?) nối với câu trả lời danh tính "我女朋友。" (Bạn gái tôi).',
      },
      {
        id: 'hsk1-l4-mock-r2',
        part: 3,
        questionNumber: 17,
        promptChinese: '她工作很 (   )。',
        promptPinyin: 'Tā gōngzuò hěn (   ).',
        promptVietnamese: 'Công việc của cô ấy rất ( ... ).',
        options: [
          { key: 'A', textChinese: '想 (xiǎng)', textVietnamese: 'nhớ / muốn' },
          { key: 'B', textChinese: '忙 (máng)', textVietnamese: 'bận rộn' },
          { key: 'C', textChinese: '名字 (míngzi)', textVietnamese: 'tên gọi' },
        ],
        correctKey: 'B',
        explanation: 'Tính từ miêu tả công việc: "很忙" (rất bận) -> Đáp án B.',
      },
    ],
  },

  // BÀI 5
  {
    lessonNumber: 5,
    titleChinese: '今天我休息',
    titlePinyin: 'Jīntiān wǒ xiūxi',
    titleVietnamese: 'Hôm nay anh được nghỉ',
    pageNumber: '022',
    phonetics: [
      {
        title: '“不” 的变调 (Biến điệu của chữ 不)',
        vietnameseTitle: 'Quy tắc biến điệu bù -> bú',
        rules: [
          '“不” (bù) dùng đơn hoặc đứng trước âm tiết thanh 1, 2, 3 thì GIỮ NGUYÊN thanh 4 (bù).',
          'Khi đứng trước âm tiết mang THANH 4, “不” đổi thành THANH 2 (bú).',
          '不 (bù) + 四声 -> 不 (bú) + 四声. Ví dụ: 不是 bú shì, 不会 bú huì, 不大 bú dà, 不对 bú duì.',
        ],
        audioDrillList: [
          { label: 'Không phải', hanzi: '不是', pinyin: 'bú shì', audioText: 'bú shì' },
          { label: 'Không biết làm', hanzi: '不会', pinyin: 'bú huì', audioText: 'bú huì' },
          { label: 'Không to', hanzi: '不大', pinyin: 'bú dà', audioText: 'bú dà' },
          { label: 'Không đúng', hanzi: '不对', pinyin: 'bú duì', audioText: 'bú duì' },
        ],
      },
      {
        title: '“一” 的变调 (Biến điệu của chữ 一)',
        vietnameseTitle: 'Quy tắc biến điệu yī -> yí / yì',
        rules: [
          '“一” (yī) đọc độc lập hoặc chỉ số thứ tự thì giữ thanh 1 (yī).',
          'Đứng trước âm tiết mang THANH 1, 2, 3: “一” đổi thành THANH 4 (yì). Ví dụ: 一些 yìxiē, 一年 yìnián, 一口 yìkǒu.',
          'Đứng trước âm tiết mang THANH 4: “一” đổi thành THANH 2 (yí). Ví dụ: 一个 yígè, 一日 yírì, 一岁 yísuì.',
        ],
        audioDrillList: [
          { label: 'Một vài', hanzi: '一些', pinyin: 'yìxiē', audioText: 'yìxiē' },
          { label: 'Một năm', hanzi: '一年', pinyin: 'yìnián', audioText: 'yìnián' },
          { label: 'Một cái', hanzi: '一个', pinyin: 'yígè', audioText: 'yígè' },
          { label: 'Một tuổi', hanzi: '一岁', pinyin: 'yísuì', audioText: 'yísuì' },
        ],
      },
    ],
    hskMockListening: [
      {
        id: 'hsk1-l5-mock-l1',
        part: 4,
        questionNumber: 9,
        promptText: 'Nghe đoạn văn và chọn đáp án:',
        audioScript: 'Xiàwǔ wǒ qù chāoshì, wǒ xiǎng mǎi yíxiē shuǐguǒ. (Chiều nay tôi đi siêu thị mua hoa quả).',
        options: [
          { key: 'A', textChinese: '超市', textVietnamese: 'Siêu thị' },
          { key: 'B', textChinese: '医院', textVietnamese: 'Bệnh viện' },
          { key: 'C', textChinese: '学校', textVietnamese: 'Trường học' },
        ],
        correctKey: 'A',
        explanation: 'Người nói đến siêu thị (超市) -> Đáp án A.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l5-mock-r1',
        part: 1,
        questionNumber: 12,
        promptChinese: '今天我休息。',
        promptPinyin: 'Jīntiān wǒ xiūxi.',
        promptVietnamese: 'Hôm nay tôi được nghỉ ngơi.',
        options: [
          { key: 'A', imageEmoji: '🛋️', textVietnamese: 'Người nằm thư giãn nghỉ ngơi trên sofa' },
          { key: 'B', imageEmoji: '💼', textVietnamese: 'Đang làm việc' },
        ],
        correctKey: 'A',
        explanation: 'Câu "今天我休息" thể hiện sự nghỉ ngơi -> Tranh A.',
      },
    ],
  },

  // BÀI 6
  {
    lessonNumber: 6,
    titleChinese: '你的手机号是多少？',
    titlePinyin: 'Nǐ de shǒujīhào shì duōshao?',
    titleVietnamese: 'Số điện thoại di động của bạn là bao nhiêu?',
    pageNumber: '031',
    phonetics: [
      {
        title: '儿化 (Âm uốn lưỡi "r" trong tiếng Trung)',
        vietnameseTitle: 'Cách phát âm âm uốn lưỡi và ý nghĩa biểu cảm',
        rules: [
          'Thêm âm uốn lưỡi "儿" (r) vào sau từ để biểu thị "nhỏ bé", "yêu thích" hoặc chuyển đổi từ loại (động từ -> danh từ).',
          'Ví dụ thêm "儿": 这儿 zhèr (ở đây), 那儿 nàr (ở kia), 面条儿 miàntiáor (sợi mì), 画儿 huàr (bức tranh), 一点儿 yìdiǎnr (một chút), 好玩儿 hǎowánr (vui nhộn).',
        ],
        audioDrillList: [
          { label: 'Ở đây', hanzi: '这儿', pinyin: 'zhèr', audioText: 'zhèr' },
          { label: 'Ở kia', hanzi: '那儿', pinyin: 'nàr', audioText: 'nàr' },
          { label: 'Một chút', hanzi: '一点儿', pinyin: 'yìdiǎnr', audioText: 'yìdiǎnr' },
          { label: 'Quán ăn', hanzi: '饭馆儿', pinyin: 'fànguǎnr', audioText: 'fànguǎnr' },
        ],
      },
      {
        title: '隔音符号 (Dấu cách âm trong phiên âm)',
        vietnameseTitle: 'Dấu cách âm (\') tránh nhầm lẫn ranh giới âm tiết',
        rules: [
          'Khi âm tiết bắt đầu bằng nguyên âm "a, o, e" nối liền sau một âm tiết khác, cần dùng dấu cách âm (\') ở giữa hai âm tiết.',
          'Ví dụ: shí\'èr (mười hai), Xī\'ān (Tây An), Tiān\'ān Mén (Thiên An Môn).',
        ],
      },
    ],
    hskMockListening: [
      {
        id: 'hsk1-l6-mock-l1',
        part: 4,
        questionNumber: 9,
        promptText: 'Nghe số điện thoại và chọn đáp án:',
        audioScript: 'Wǒ de shǒujīhào shì 53626085. (Số điện thoại của tôi là 53626085).',
        options: [
          { key: 'A', textChinese: '5362805', textVietnamese: '5362805' },
          { key: 'B', textChinese: '5398205', textVietnamese: '5398205' },
          { key: 'C', textChinese: '53626085', textVietnamese: '53626085' },
        ],
        correctKey: 'C',
        explanation: 'Chuỗi số đọc chuẩn là 53626085 -> Đáp án C.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l6-mock-r1',
        part: 2,
        questionNumber: 14,
        promptChinese: '你吃什么？',
        promptPinyin: 'Nǐ chī shénme?',
        promptVietnamese: 'Bạn ăn cái gì?',
        options: [
          { key: 'A', textChinese: '坐出租车。', textVietnamese: 'Đi xe taxi.' },
          { key: 'B', textChinese: '包子。', textVietnamese: 'Bánh bao.' },
          { key: 'C', textChinese: '真好看！', textVietnamese: 'Đẹp thật!' },
        ],
        correctKey: 'B',
        explanation: 'Hỏi về đồ ăn "你吃什么？" đáp lại là món ăn "包子。" (Bánh bao).',
      },
    ],
  },

  // BÀI 7
  {
    lessonNumber: 7,
    titleChinese: '我晚上六点半下班',
    titlePinyin: 'Wǒ wǎnshang liù diǎn bàn xiàbān',
    titleVietnamese: 'Em tan làm lúc 6 rưỡi tối',
    pageNumber: '039',
    phonetics: [
      {
        title: '送气与不送气声母 (Thanh mẫu bật hơi và không bật hơi)',
        vietnameseTitle: '6 cặp thanh mẫu bật hơi đối lập',
        rules: [
          'Tiếng Trung có 6 cặp thanh mẫu phân biệt bằng luồng hơi: b - p, d - t, g - k, j - q, zh - ch, z - c.',
          'Vận mẫu âm mũi trước (-n) vs âm mũi sau (-ng): an/ang, en/eng, in/ing, on/ong.',
        ],
        audioDrillList: [
          { label: 'Cổ / Khổ', hanzi: '古 / 苦', pinyin: 'gǔ / kǔ', audioText: 'gǔ kǔ' },
          { label: 'Chín / Chín (chín mùi)', hanzi: '熟 / 迟', pinyin: 'zhī / chí', audioText: 'zhī chí' },
          { label: 'Trắng / Phái', hanzi: '白 / 拍', pinyin: 'bái / pái', audioText: 'bái pái' },
        ],
      },
    ],
    hanziSection: {
      title: '汉字简介 (Giới thiệu khái quát về chữ Hán)',
      vietnameseTitle: 'Lịch sử chữ Hán & Chữ hình thanh 90%',
      overview: 'Chữ Hán là một trong những hệ thống chữ viết cổ nhất thế giới, phát triển qua Giáp cốt văn (chữ khắc trên mai rùa), Kim văn (khắc trên chuông đồng), Triện thư, Lệ thư, Khải thư, Thảo thư và Hành thư. Hiện đại có hơn 90% là chữ hình thanh (gồm Phần Biểu Ý + Phần Biểu Âm).',
      structureTypes: [
        { typeChinese: '形声字 (Chữ hình thanh)', typeVietnamese: 'Gồm Hình bàng (nghĩa) + Thanh bàng (âm đọc)', exampleChar: '材 (Mộc 木 = gỗ; Tài 才 = gợi âm đọc cái tài)', explanation: 'Dựa vào bộ thủ đoán ý nghĩa, dựa vào thanh bàng đoán âm đọc.' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l7-mock-l1',
        part: 2,
        questionNumber: 4,
        promptText: 'Nghe và chọn giờ chính xác:',
        audioScript: 'Xiànzài jǐ diǎn? - Shí\'èr diǎn. (Bây giờ là mấy giờ? - 12 giờ).',
        options: [
          { key: 'A', textChinese: '10:00' },
          { key: 'B', textChinese: '12:00' },
          { key: 'C', textChinese: '12号' },
        ],
        correctKey: 'B',
        explanation: 'Thời gian nghe được là 12:00 (十二点) -> Đáp án B.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l7-mock-r1',
        part: 4,
        questionNumber: 19,
        promptChinese: '我今天早上八点半上课，十点十分下课。',
        promptPinyin: 'Wǒ jīntiān zǎoshang bā diǎn bàn shàngkè, shí diǎn shí fēn xiàkè.',
        subPrompt: '★ 说话人今天几点下课？ (Người nói hôm nay mấy giờ tan học?)',
        options: [
          { key: 'A', textChinese: '8:30' },
          { key: 'B', textChinese: '10:10' },
          { key: 'C', textChinese: '10:20' },
        ],
        correctKey: 'B',
        explanation: 'Giờ tan học (下课) là 10 giờ 10 phút (十点十分) -> Đáp án B.',
      },
    ],
  },

  // BÀI 8
  {
    lessonNumber: 8,
    titleChinese: '我爸爸也在医院工作',
    titlePinyin: 'Wǒ bàba yě zài yīyuàn gōngzuò',
    titleVietnamese: 'Bố em cũng làm việc ở bệnh viện',
    pageNumber: '048',
    phonetics: [
      {
        title: '音节辨析与重叠式 (Phân biệt âm tiết tương cận & Từ lặp lại)',
        vietnameseTitle: 'Luyện nghe âm tương cận: lián/nián, diē/tiē...',
        rules: ['Luyện nghe các từ lặp lại trong gia đình: 爸爸 bàba, 妈妈 māma, 哥哥 gēge, 姐姐 jiějie, 妹妹 mèimei, 弟弟 dìdi.'],
      },
    ],
    hanziSection: {
      title: '汉字书写 (一) (Viết chữ Hán 1: Nét & Bút thuận cơ bản)',
      vietnameseTitle: 'Nét Ngang (横) & Nét Sổ (竖) và Quy tắc Ngang trước sổ sau',
      strokes: [
        { shape: '一', name: '横', pinyin: 'héng', vietnameseName: 'Nét Ngang', direction: 'Từ trái sang phải (→)', exampleChar: '一, 二, 三' },
        { shape: '丨', name: '竖', pinyin: 'shù', vietnameseName: 'Nét Sổ', direction: 'Từ trên xuống dưới (↓)', exampleChar: '十, 工' },
      ],
      strokeOrderRules: [
        { ruleChinese: '先横后竖', ruleVietnamese: 'Ngang trước sổ sau', exampleChar: '十', pinyin: 'shí', meaning: 'Số mười', strokeSequence: ['一 (Ngang)', '十 (Sổ cắt qua)'] },
      ],
      copyWords: [
        { word: '二十', pinyin: 'èrshí', vietnamese: 'Hai mươi' },
        { word: '工作', pinyin: 'gōngzuò', vietnamese: 'Công việc / Làm việc' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l8-mock-l1',
        part: 4,
        questionNumber: 9,
        promptText: 'Nghe đoạn văn chọn đáp án:',
        audioScript: 'Bàba zài yīyuàn gōngzuò, māma zài xuéxiào. (Bố làm việc ở BV, mẹ ở trường học).',
        options: [
          { key: 'A', textChinese: '超市', textVietnamese: 'Siêu thị' },
          { key: 'B', textChinese: '医院', textVietnamese: 'Bệnh viện' },
          { key: 'C', textChinese: '学校', textVietnamese: 'Trường học' },
        ],
        correctKey: 'B',
        explanation: 'Bố làm việc ở bệnh viện (医院) -> Đáp án B.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l8-mock-r1',
        part: 4,
        questionNumber: 19,
        promptChinese: '昨天爸爸在医院工作，哥哥在家里休息，没去书店。',
        promptPinyin: 'Zuótiān bàba zài yīyuàn gōngzuò, gēge zài jiā lǐ xiūxi, méi qù shūdiàn.',
        subPrompt: '★ 说话人的哥哥昨天： (Anh trai của người nói hôm qua...)',
        options: [
          { key: 'A', textChinese: '在家里', textVietnamese: 'Ở nhà' },
          { key: 'B', textChinese: '在书店', textVietnamese: 'Ở hiệu sách' },
          { key: 'C', textChinese: '在医院工作', textVietnamese: 'Làm việc ở bệnh viện' },
        ],
        correctKey: 'A',
        explanation: 'Anh trai ở nhà nghỉ ngơi (哥哥在家里休息) -> Đáp án A.',
      },
    ],
  },

  // BÀI 9
  {
    lessonNumber: 9,
    titleChinese: '我明天上午在学校学习',
    titlePinyin: 'Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí',
    titleVietnamese: 'Sáng mai mình học ở trường',
    pageNumber: '057',
    phonetics: [
      {
        title: '声调标写与辨析 (Quy tắc đánh dấu thanh điệu)',
        vietnameseTitle: 'Quy tắc thứ tự ưu tiên: a > o > e > i/u',
        rules: [
          'Đánh dấu thanh điệu trên nguyên âm chính theo thứ tự: a, o, e, i, u, ü.',
          'Khi i và u đi cùng nhau (iu, ui), dấu thanh điệu đặt trên nguyên âm đứng sau.',
        ],
      },
    ],
    hanziSection: {
      title: '汉字书写 (二) (Viết chữ Hán 2: Phẩy, Mác, Chấm, Hất)',
      vietnameseTitle: '4 nét cơ bản: 撇 piě, 捺 nà, 点 diǎn, 提 tí',
      strokes: [
        { shape: '丿', name: '撇', pinyin: 'piě', vietnameseName: 'Nét Phẩy', direction: 'Từ trên xiên xuống trái', exampleChar: '人, 八' },
        { shape: '乀', name: '捺', pinyin: 'nà', vietnameseName: 'Nét Mác', direction: 'Từ trên xiên xuống phải', exampleChar: '人, 大' },
        { shape: '丶', name: '点', pinyin: 'diǎn', vietnameseName: 'Nét Chấm', direction: 'Chấm nhẹ từ trên xuống phải', exampleChar: '文, 六' },
        { shape: '𠀁', name: '提', pinyin: 'tí', vietnameseName: 'Nét Hất', direction: 'Từ dưới hất chếch lên phải', exampleChar: '地, 我' },
      ],
      strokeOrderRules: [
        { ruleChinese: '先撇后捺', ruleVietnamese: 'Phẩy trước mác sau', exampleChar: '人', pinyin: 'rén', meaning: 'Người', strokeSequence: ['丿 (Phẩy)', '人 (Mác)'] },
        { ruleChinese: '从上到下', ruleVietnamese: 'Trên trước dưới sau', exampleChar: '文', pinyin: 'wén', meaning: 'Văn hóa / Văn tự', strokeSequence: ['丶 (Chấm trên)', '一 (Ngang)', '丿 (Phẩy)', '文 (Mác)'] },
      ],
      copyWords: [
        { word: '那个', pinyin: 'nàge', vietnamese: 'Cái kia' },
        { word: '今天', pinyin: 'jīntiān', vietnamese: 'Hôm nay' },
        { word: '认识', pinyin: 'rènshi', vietnamese: 'Quen biết' },
        { word: '打电话', pinyin: 'dǎ diànhuà', vietnamese: 'Gọi điện thoại' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l9-mock-l1',
        part: 4,
        questionNumber: 9,
        promptText: 'Nghe giờ và chọn đáp án:',
        audioScript: 'Wǒmen shàngwǔ 8:00 zài xuéxiào jiàn. (Chúng ta gặp nhau ở trường lúc 8 giờ sáng).',
        options: [
          { key: 'A', textChinese: '上午 8:00' },
          { key: 'B', textChinese: '上午 10:00' },
          { key: 'C', textChinese: '晚上 8:00' },
        ],
        correctKey: 'A',
        explanation: 'Thời gian hẹn là 8:00 sáng (上午 8:00) -> Đáp án A.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l9-mock-r1',
        part: 4,
        questionNumber: 19,
        promptChinese: '我有一只小狗，很漂亮，它是我的好朋友。',
        promptPinyin: 'Wǒ yǒu yì zhī xiǎo gǒu, hěn piàoliang, tā shì wǒ de hǎo péngyou.',
        subPrompt: '★ 说话人有几只小狗？ (Người nói có mấy con chó con?)',
        options: [
          { key: 'A', textChinese: '一 (Một)' },
          { key: 'B', textChinese: '四 (Bốn)' },
          { key: 'C', textChinese: '十一 (Mười một)' },
        ],
        correctKey: 'A',
        explanation: 'Câu văn ghi: "我有一只小狗" (Tôi có 1 chú chó nhỏ) -> Đáp án A.',
      },
    ],
  },

  // BÀI 10
  {
    lessonNumber: 10,
    titleChinese: '这儿的苹果真便宜！',
    titlePinyin: 'Zhèr de píngguǒ zhēn piányi!',
    titleVietnamese: 'Táo ở đây rẻ thật!',
    pageNumber: '066',
    phonetics: [
      {
        title: '声调强化辨析 (Phân biệt thanh điệu mua bán & tiền tệ)',
        vietnameseTitle: 'Luyện nghe phân biệt giá cả, tính từ: piányi, guì, kuài...',
        rules: ['Phân biệt các âm tiết: shuǐ/shuì, zuò/zì, zhuō/chá, wàibian/zhège...'],
      },
    ],
    hanziSection: {
      title: '汉字书写 (三) (Viết chữ Hán 3: Nét gập & Quy tắc Trái trước phải sau)',
      vietnameseTitle: '横折, 横撇, 竖折, 竖提 & Quy tắc bút thuận',
      strokes: [
        { shape: '𠃍', name: '横折', pinyin: 'héngzhé', vietnameseName: 'Ngang gập', direction: 'Ngang rồi gập thẳng xuống', exampleChar: '口, 日' },
        { shape: '㇇', name: '横撇', pinyin: 'héngpiě', vietnameseName: 'Ngang phẩy', direction: 'Ngang rồi phẩy cong', exampleChar: '水, 又' },
        { shape: '𠃊', name: '竖折', pinyin: 'shùzhé', vietnameseName: 'Sổ gập', direction: 'Sổ xuống rồi gập ngang sang phải', exampleChar: '山, 出' },
        { shape: '𠃋', name: '竖提', pinyin: 'shùtí', vietnameseName: 'Sổ hất', direction: 'Sổ xuống rồi hất nhọn lên', exampleChar: '长, 很' },
      ],
      strokeOrderRules: [
        { ruleChinese: '从左到右', ruleVietnamese: 'Trái trước phải sau', exampleChar: '的', pinyin: 'de', meaning: 'Của / Trợ từ', strokeSequence: ['白 (Trái)', '勺 (Phải)'] },
        { ruleChinese: '先外后里', ruleVietnamese: 'Ngoài trước trong sau', exampleChar: '月', pinyin: 'yuè', meaning: 'Tháng / Trăng', strokeSequence: ['丿 (Ngoài)', '冂 (Bao)', '二 (Ruột trong)'] },
      ],
      copyWords: [
        { word: '星期日', pinyin: 'xīngqīrì', vietnamese: 'Chủ nhật' },
        { word: '朋友', pinyin: 'péngyou', vietnamese: 'Bạn bè' },
        { word: '医生', pinyin: 'yīshēng', vietnamese: 'Bác sĩ' },
        { word: '可以', pinyin: 'kěyǐ', vietnamese: 'Có thể' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l10-mock-l1',
        part: 4,
        questionNumber: 9,
        promptText: 'Nghe và chọn số lượng/giá cả:',
        audioScript: 'Zhèr de píngguǒ zhēn piányi, mǎi de rén hěn duō. (Táo ở đây rẻ thật, người mua rất đông).',
        options: [
          { key: 'A', textChinese: '很多', textVietnamese: 'Rất nhiều' },
          { key: 'B', textChinese: '真贵', textVietnamese: 'Đắt thật' },
          { key: 'C', textChinese: '不好看', textVietnamese: 'Không đẹp' },
        ],
        correctKey: 'A',
        explanation: 'Người mua rất nhiều (很多) -> Đáp án A.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l10-mock-r1',
        part: 4,
        questionNumber: 20,
        promptChinese: '这件衣服很好看，你也能穿，买一件吧。',
        promptPinyin: 'Zhè jiàn yīfu hěn hǎokàn, nǐ yě néng chuān, mǎi yí jiàn ba.',
        subPrompt: '★ 那件衣服： (Chiếc áo đó...)',
        options: [
          { key: 'A', textChinese: '好看', textVietnamese: 'Đẹp' },
          { key: 'B', textChinese: '便宜', textVietnamese: 'Rẻ' },
          { key: 'C', textChinese: '很贵', textVietnamese: 'Rất đắt' },
        ],
        correctKey: 'A',
        explanation: 'Chiếc áo được khen là rất đẹp (很好看) -> Đáp án A.',
      },
    ],
  },

  // BÀI 11 - 15 TỔNG HỢP VỚI ĐỦ CẤU TRÚC
  {
    lessonNumber: 11,
    titleChinese: '我读大学呢',
    titlePinyin: 'Wǒ dú dàxué ne',
    titleVietnamese: 'Em đang học đại học',
    pageNumber: '075',
    phonetics: [
      {
        title: '声调与语调 (Ngữ điệu câu tiếp diễn “呢”)',
        vietnameseTitle: 'Thanh điệu và ngữ khí tiếp diễn “呢”',
        rules: ['Ngữ khí “呢” ở cuối câu biểu thị hành động đang diễn ra nhẹ nhàng.'],
      },
    ],
    hanziSection: {
      title: '汉字书写 (四) (Viết chữ Hán 4: Các loại Nét Móc 钩)',
      vietnameseTitle: 'Nét móc: 横钩, 竖钩, 斜钩, 弯钩, 卧钩 & Quy tắc Vào trước đóng sau',
      strokes: [
        { shape: '乛', name: '横钩', pinyin: 'hénggōu', vietnameseName: 'Ngang móc', direction: 'Ngang rồi móc nhọn xuống', exampleChar: '买, 卖' },
        { shape: '亅', name: '竖钩', pinyin: 'shùgōu', vietnameseName: 'Sổ móc', direction: 'Sổ thẳng rồi móc lên trái', exampleChar: '小, 水' },
        { shape: '㇂', name: '斜钩', pinyin: 'xiégōu', vietnameseName: 'Nghiêng móc', direction: 'Nghiêng cong rồi móc lên', exampleChar: '我, 钱' },
        { shape: '㇁', name: '弯钩', pinyin: 'wāngōu', vietnameseName: 'Cong móc', direction: 'Cong nhẹ rồi móc lên', exampleChar: '狗, 狐' },
        { shape: '㇃', name: '卧钩', pinyin: 'wògōu', vietnameseName: 'Nằm móc', direction: 'Nằm ngang uốn lượn móc lên', exampleChar: '心, 必' },
      ],
      strokeOrderRules: [
        { ruleChinese: '先外后里再封口', ruleVietnamese: 'Vào trước đóng sau (Khung bao)', exampleChar: '日', pinyin: 'rì', meaning: 'Mặt trời / Ngày', strokeSequence: ['丨 (Sổ trái)', '𠃍 (Ngang gập)', '一 (Ngang trong)', '一 (Đóng đáy)'] },
      ],
      copyWords: [
        { word: '买卖', pinyin: 'mǎimai', vietnamese: 'Buôn bán' },
        { word: '小学', pinyin: 'xiǎoxué', vietnamese: 'Tiểu học' },
        { word: '飞机', pinyin: 'fēijī', vietnamese: 'Máy bay' },
        { word: '小狗', pinyin: 'xiǎogǒu', vietnamese: 'Chó con' },
        { word: '怎么样', pinyin: 'zěnmeyàng', vietnamese: 'Như thế nào' },
        { word: '中国', pinyin: 'Zhōngguó', vietnamese: 'Trung Quốc' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l11-mock-l1',
        part: 4,
        questionNumber: 19,
        promptText: 'Nghe đoạn văn chọn nghề nghiệp:',
        audioScript: 'Wǒ jiějie jīnnián 20 suì, zhèngzài dú dàxué ne, tā xué yī. (Chị tôi 20 tuổi, đang học ĐH, học ngành Y).',
        options: [
          { key: 'A', textChinese: '老师', textVietnamese: 'Giáo viên' },
          { key: 'B', textChinese: '医生', textVietnamese: 'Bác sĩ' },
          { key: 'C', textChinese: '大学生', textVietnamese: 'Sinh viên đại học' },
        ],
        correctKey: 'C',
        explanation: 'Người chị đang học đại học (读大学) nên là sinh viên đại học (大学生) -> Đáp án C.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l11-mock-r1',
        part: 1,
        questionNumber: 11,
        promptChinese: '妈妈正在做饭呢。',
        promptPinyin: 'Māma zhèngzài zuò fàn ne.',
        promptVietnamese: 'Mẹ đang nấu cơm kìa.',
        options: [
          { key: 'A', imageEmoji: '👩‍🍳', textVietnamese: 'Người phụ nữ đang nấu ăn trong bếp' },
          { key: 'B', imageEmoji: '📖', textVietnamese: 'Đang đọc sách' },
        ],
        correctKey: 'A',
        explanation: 'Câu "妈妈正在做饭呢" tương ứng với tranh người đang nấu cơm -> Tranh A.',
      },
    ],
  },

  // BÀI 12 - 15 (TRỌNG TÂM HOÀN CHỈNH)
  {
    lessonNumber: 12,
    titleChinese: '昨天下了雪',
    titlePinyin: 'Zuótiān xià le xuě',
    titleVietnamese: 'Hôm qua tuyết rơi rồi',
    pageNumber: '084',
    phonetics: [
      {
        title: '声调与语调 (Ngữ khí biến đổi “了”)',
        vietnameseTitle: 'Phân biệt thanh điệu thời tiết: xuě, yǔ, lěng, rè',
        rules: ['Chữ “了” (le) đọc thanh nhẹ biểu thị sự việc đã hoàn thành hoặc có sự thay đổi trạng thái.'],
      },
    ],
    hanziSection: {
      title: '汉字书写 (五) (Viết chữ Hán 5: Nét gập móc phức hợp & Quy tắc Giữa trước hai bên sau)',
      vietnameseTitle: '横折钩, 竖弯钩, 横折弯钩, 竖折折钩',
      strokes: [
        { shape: '𠃌', name: '横折钩', pinyin: 'héngzhégōu', vietnameseName: 'Ngang gập móc', direction: 'Ngang gập rồi móc trái', exampleChar: '月, 同' },
        { shape: '乚', name: '竖弯钩', pinyin: 'shùwāngōu', vietnameseName: 'Sổ uốn móc', direction: 'Sổ xuống uốn cong móc lên', exampleChar: '儿, 七' },
        { shape: '乙', name: '横折弯钩', pinyin: 'héngzhéwāngōu', vietnameseName: 'Ngang gập uốn móc', direction: 'Ngang gập uốn móc', exampleChar: '九, 几' },
        { shape: 'ㄅ', name: '竖折折钩', pinyin: 'shùzhézhégōu', vietnameseName: 'Sổ gập gập móc', direction: 'Sổ gập đôi rồi móc', exampleChar: '马, 鸟' },
      ],
      strokeOrderRules: [
        { ruleChinese: '先中间后两边', ruleVietnamese: 'Giữa trước hai bên sau', exampleChar: '水', pinyin: 'shuǐ', meaning: 'Nước', strokeSequence: ['亅 (Sổ móc giữa)', '㇇ (Ngang phẩy trái)', '丿 (Phẩy phải)', '乀 (Mác phải)'] },
      ],
      copyWords: [
        { word: '读书', pinyin: 'dúshū', vietnamese: 'Đọc sách' },
        { word: '几岁', pinyin: 'jǐ suì', vietnamese: 'Mấy tuổi' },
        { word: '吃饭', pinyin: 'chīfàn', vietnamese: 'Ăn cơm' },
        { word: '妈妈', pinyin: 'māma', vietnamese: 'Mẹ' },
        { word: '多少', pinyin: 'duōshao', vietnamese: 'Bao nhiêu' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l12-mock-l1',
        part: 4,
        questionNumber: 20,
        promptText: 'Nghe lời khuyên bác sĩ:',
        audioScript: 'Yīshēng shuō Lǎo Zhāng yào chī sān tiān yào. (Bác sĩ nói Lão Trương phải uống thuốc 3 ngày).',
        options: [
          { key: 'A', textChinese: '要吃药', textVietnamese: 'Phải uống thuốc' },
          { key: 'B', textChinese: '要多睡觉', textVietnamese: 'Cần ngủ nhiều' },
          { key: 'C', textChinese: '要多喝水', textVietnamese: 'Cần uống nhiều nước' },
        ],
        correctKey: 'A',
        explanation: 'Bác sĩ dặn phải uống thuốc (要吃药) -> Đáp án A.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l12-mock-r1',
        part: 4,
        questionNumber: 19,
        promptChinese: '昨天的天气很好，我和朋友们去外边玩了。',
        promptPinyin: 'Zuótiān de tiānqì hěn hǎo, wǒ hé péngyoumen qù wàibian wán le.',
        subPrompt: '★ 说话人觉得昨天： (Người nói cảm thấy hôm qua...)',
        options: [
          { key: 'A', textChinese: '天气好', textVietnamese: 'Thời tiết đẹp' },
          { key: 'B', textChinese: '雨不大', textVietnamese: 'Mưa không to' },
          { key: 'C', textChinese: '有点儿冷', textVietnamese: 'Hơi lạnh' },
        ],
        correctKey: 'A',
        explanation: 'Hôm qua thời tiết rất tốt (昨天的天气很好) -> Đáp án A.',
      },
    ],
  },

  // BÀI 13
  {
    lessonNumber: 13,
    titleChinese: '请给我一杯茶',
    titlePinyin: 'Qǐng gěi wǒ yì bēi chá',
    titleVietnamese: 'Cho tôi một cốc trà',
    pageNumber: '093',
    phonetics: [
      {
        title: '语调辨析 (Ngữ điệu câu cầu khiến lịch sự “请”)',
        vietnameseTitle: 'Ngữ điệu êm ái, lịch thiệp khi đưa ra yêu cầu',
        rules: ['Khi dùng từ “请” (qǐng) đứng đầu câu, hạ thấp cao độ giọng để thể hiện sự nhã nhặn tôn trọng.'],
      },
    ],
    hanziSection: {
      title: '汉字书写 (六) (Chữ Độc thể & Chữ Hợp thể; Kết cấu Trái - Phải)',
      vietnameseTitle: 'Kết cấu Trái-Phải (左右结构) & Trái-Giữa-Phải (左中右结构)',
      overview: 'Chữ độc thể gồm một khối nét đơn lẻ (人, 口, 日). Chữ hợp thể ghép từ nhiều bộ phận. Kết cấu Trái-Phải chiếm tỉ lệ rất lớn trong chữ Hán.',
      structureTypes: [
        { typeChinese: '左右结构 (Trái - Phải)', typeVietnamese: 'Bộ phận trái viết trước, bộ phận phải viết sau', exampleChar: '和 (hé: 禾 + 口)', explanation: 'Hai bên cân đối, thường bộ bên trái nhỏ hơn để nhường không gian cho bên phải.' },
        { typeChinese: '左中右结构 (Trái - Giữa - Phải)', typeVietnamese: 'Viết lần lượt từ trái sang giữa rồi sang phải', exampleChar: '做 (zuò: 亻 + 古 + 攵)', explanation: 'Ba bộ phận ghép ngang, cần viết hẹp và gọn để chữ nằm vừa vặn trong ô vuông.' },
      ],
      copyWords: [
        { word: '女儿', pinyin: 'nǚ\'ér', vietnamese: 'Con gái' },
        { word: '弟弟', pinyin: 'dìdi', vietnamese: 'Em trai' },
        { word: '汉语', pinyin: 'Hànyǔ', vietnamese: 'Tiếng Hán' },
        { word: '谢谢', pinyin: 'xièxie', vietnamese: 'Cảm ơn' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l13-mock-l1',
        part: 2,
        questionNumber: 4,
        promptText: 'Nghe câu hỏi và chọn đáp án đúng:',
        audioScript: 'Qǐngzuò, nín yào shénme? - Qǐng gěi wǒ yì bēi chá. (Xin mời ngồi, ngài cần gì? - Cho tôi 1 cốc trà).',
        options: [
          { key: 'A', textChinese: '给你', textVietnamese: 'Gửi bạn' },
          { key: 'B', textChinese: '吃早饭', textVietnamese: 'Ăn sáng' },
          { key: 'C', textChinese: '要一杯茶', textVietnamese: 'Muốn một cốc trà' },
        ],
        correctKey: 'C',
        explanation: 'Khách yêu cầu một cốc trà (要一杯茶) -> Đáp án C.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l13-mock-r1',
        part: 4,
        questionNumber: 19,
        promptChinese: '明天星期天，我们可以去饭店吃饺子吗？',
        promptPinyin: 'Míngtiān Xīngqītiān, wǒmen kěyǐ qù fàndiàn chī jiǎozi ma?',
        subPrompt: '★ 明天是： (Ngày mai là...)',
        options: [
          { key: 'A', textChinese: '星期五', textVietnamese: 'Thứ 6' },
          { key: 'B', textChinese: '星期六', textVietnamese: 'Thứ 7' },
          { key: 'C', textChinese: '星期日', textVietnamese: 'Chủ nhật' },
        ],
        correctKey: 'C',
        explanation: 'Ngày mai là Chủ nhật (星期天 / 星期日) -> Đáp án C.',
      },
    ],
  },

  // BÀI 14
  {
    lessonNumber: 14,
    titleChinese: '我看了一个电影',
    titlePinyin: 'Wǒ kànle yí gè diànyǐng',
    titleVietnamese: 'Mình đã xem một bộ phim',
    pageNumber: '102',
    phonetics: [
      {
        title: '语调与句型功能 (Ngữ điệu 4 loại câu: Trần thuật, Nghi vấn, Cảm thán, Cầu khiến)',
        vietnameseTitle: 'Ngữ điệu 4 loại câu cơ bản',
        rules: [
          'Câu trần thuật (陈述句): ngữ điệu đi ngang hoặc hạ nhẹ ở đuôi câu.',
          'Câu nghi vấn (疑问句): ngữ điệu nâng cao dần ở cuối câu.',
          'Câu cảm thán (感叹句): ngữ điệu kéo dài, cảm xúc mạnh mẽ.',
          'Câu cầu khiến (祈使句): ngữ điệu dứt khoát, đi xuống ở cuối câu.',
        ],
      },
    ],
    hanziSection: {
      title: '汉字书写 (七) (Kết cấu Trên - Dưới & Kết cấu Bao Vây)',
      vietnameseTitle: '上下, 上中下, 半包围, 全包围',
      structureTypes: [
        { typeChinese: '上下结构 (Trên - Dưới)', typeVietnamese: 'Phần trên viết trước, phần dưới viết sau', exampleChar: '分 (fēn: 八 + 刀)', explanation: 'Nửa trên che chở nửa dưới, trục giữa cân đối.' },
        { typeChinese: '上中下结构 (Trên - Giữa - Dưới)', typeVietnamese: 'Lần lượt trên -> giữa -> dưới', exampleChar: '爱 (ài: 爫 + 冖 + 友)', explanation: 'Ba tầng xếp chồng, viết dẹt và vừa vặn.' },
        { typeChinese: '半包围结构 (Bán bao vây)', typeVietnamese: 'Bao 2 hoặc 3 phía', exampleChar: '同 (tóng: 冂 + 一 + 口)', explanation: 'Viết khung ngoài trước, viết phần ruột trong sau.' },
        { typeChinese: '全包围结构 (Toàn bao vây)', typeVietnamese: 'Bao trọn 4 phía', exampleChar: '国 (guó: 囗 + 玉)', explanation: 'Vào trước đóng sau: Viết khung 3 cạnh ngoài -> viết chữ 玉 bên trong -> gạch nét đáy đóng lại.' },
      ],
      copyWords: [
        { word: '苹果', pinyin: 'píngguǒ', vietnamese: 'Quả táo' },
        { word: '爱读书', pinyin: 'ài dúshū', vietnamese: 'Thích đọc sách' },
        { word: '看病', pinyin: 'kànbìng', vietnamese: 'Khám bệnh' },
        { word: '回家', pinyin: 'huíjiā', vietnamese: 'Về nhà' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l14-mock-l1',
        part: 4,
        questionNumber: 19,
        promptText: 'Nghe và chọn số phòng:',
        audioScript: 'Fúwùyuán, wǒ xiǎng wèn yíxià, wǒmen de fángjiānhào shì duōshao? (Phục vụ ơi, số phòng của chúng tôi là bao nhiêu?)',
        options: [
          { key: 'A', textChinese: '时间', textVietnamese: 'Thời gian' },
          { key: 'B', textChinese: '电话号', textVietnamese: 'Số điện thoại' },
          { key: 'C', textChinese: '房间号', textVietnamese: 'Số phòng' },
        ],
        correctKey: 'C',
        explanation: 'Người nói muốn biết số phòng (房间号) -> Đáp án C.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l14-mock-r1',
        part: 4,
        questionNumber: 20,
        promptChinese: '儿子和女儿都上小学了，他们会写很多字了。',
        promptPinyin: 'Érzi hé nǚ\'ér dōu shàng xiǎoxué le, tāmen huì xiě hěn duō zì le.',
        subPrompt: '★ 说话人的两个孩子是： (Hai đứa con của người nói là...)',
        options: [
          { key: 'A', textChinese: '小学生', textVietnamese: 'Học sinh tiểu học' },
          { key: 'B', textChinese: '中学生', textVietnamese: 'Học sinh trung học' },
          { key: 'C', textChinese: '大学生', textVietnamese: 'Sinh viên đại học' },
        ],
        correctKey: 'A',
        explanation: 'Hai con đều học tiểu học (上小学) nên là học sinh tiểu học (小学生) -> Đáp án A.',
      },
    ],
  },

  // BÀI 15
  {
    lessonNumber: 15,
    titleChinese: '大兴机场见！',
    titlePinyin: 'Dàxīng Jīchǎng jiàn!',
    titleVietnamese: 'Hẹn gặp ở sân bay Đại Hưng!',
    pageNumber: '111',
    phonetics: [
      {
        title: '综合语调与听辨 (Ngữ điệu tổng hợp & Phân biệt câu trần thuật/nghi vấn/cảm thán)',
        vietnameseTitle: 'Luyện nghe phản xạ phân biệt 4 loại câu',
        rules: ['Nghe và phân biệt câu: Trần thuật (A), Nghi vấn (B), Cảm thán (C), Cầu khiến (D).'],
      },
    ],
    hanziSection: {
      title: '汉字书写 (八) (6 Thiên bàng / Bộ thủ HSK 1 quan trọng)',
      vietnameseTitle: 'Bộ Khẩu (口), Nhân đứng (亻), Ngôn (讠), Nhật (日), Mộc (木), Nữ (女)',
      radicals: [
        { radical: '口 (kǒuzìpáng)', pinyin: 'kǒu', nameVietnamese: 'Bộ Khẩu (Miệng)', meaning: 'Liên quan đến miệng, ăn uống, nói năng', exampleChars: [{ char: '喝', pinyin: 'hē', meaning: 'Uống' }, { char: '吃', pinyin: 'chī', meaning: 'Ăn' }, { char: '叫', pinyin: 'jiào', meaning: 'Kêu/Gọi' }] },
        { radical: '亻 (dānrénpáng)', pinyin: 'rén', nameVietnamese: 'Bộ Nhân đứng (Người)', meaning: 'Liên quan đến con người, hành vi của người', exampleChars: [{ char: '你', pinyin: 'nǐ', meaning: 'Bạn' }, { char: '他', pinyin: 'tā', meaning: 'Anh ấy' }, { char: '们', pinyin: 'men', meaning: 'Các' }] },
        { radical: '讠 (yánzìpáng)', pinyin: 'yán', nameVietnamese: 'Bộ Ngôn (Lời nói)', meaning: 'Liên quan đến ngôn ngữ, lời nói, nhận thức', exampleChars: [{ char: '认', pinyin: 'rèn', meaning: 'Nhận biết' }, { char: '识', pinyin: 'shí', meaning: 'Hiểu biết' }, { char: '话', pinyin: 'huà', meaning: 'Lời nói' }] },
        { radical: '日 (rìzìpáng)', pinyin: 'rì', nameVietnamese: 'Bộ Nhật (Mặt trời/Ngày)', meaning: 'Liên quan đến thời gian, ánh sáng', exampleChars: [{ char: '明', pinyin: 'míng', meaning: 'Sáng/Ngày mai' }, { char: '昨', pinyin: 'zuó', meaning: 'Hôm qua' }, { char: '时', pinyin: 'shí', meaning: 'Thời gian' }] },
        { radical: '木 (mùzìpáng)', pinyin: 'mù', nameVietnamese: 'Bộ Mộc (Cây/Gỗ)', meaning: 'Liên quan đến cây cối, gỗ, đồ dùng bằng gỗ', exampleChars: [{ char: '杯', pinyin: 'bēi', meaning: 'Cốc/Ly' }, { char: '桌', pinyin: 'zhuō', meaning: 'Bàn' }, { char: '校', pinyin: 'xiào', meaning: 'Trường học' }] },
        { radical: '女 (nǚzìpáng)', pinyin: 'nǚ', nameVietnamese: 'Bộ Nữ (Phụ nữ)', meaning: 'Liên quan đến giới tính nữ, quan hệ phụ nữ', exampleChars: [{ char: '姐', pinyin: 'jiě', meaning: 'Chị gái' }, { char: '妹', pinyin: 'mèi', meaning: 'Em gái' }, { char: '妈', pinyin: 'mā', meaning: 'Mẹ' }] },
      ],
      copyWords: [
        { word: '喝茶', pinyin: 'hēchá', vietnamese: 'Uống trà' },
        { word: '你们', pinyin: 'nǐmen', vietnamese: 'Các bạn' },
        { word: '认识', pinyin: 'rènshi', vietnamese: 'Quen biết' },
        { word: '明天', pinyin: 'míngtiān', vietnamese: 'Ngày mai' },
        { word: '杯子', pinyin: 'bēizi', vietnamese: 'Cốc chén' },
        { word: '姐姐', pinyin: 'jiějie', vietnamese: 'Chị gái' },
      ],
    },
    hskMockListening: [
      {
        id: 'hsk1-l15-mock-l1',
        part: 4,
        questionNumber: 10,
        promptText: 'Nghe và chọn phương tiện:',
        audioScript: 'Wǒmen zuò fēijī qù Běijīng. (Chúng tôi đi máy bay đến Bắc Kinh).',
        options: [
          { key: 'A', textChinese: '坐飞机', textVietnamese: 'Đi máy bay' },
          { key: 'B', textChinese: '坐火车', textVietnamese: 'Đi tàu hỏa' },
          { key: 'C', textChinese: '坐出租车', textVietnamese: 'Đi taxi' },
        ],
        correctKey: 'A',
        explanation: 'Phương tiện là máy bay (坐飞机) -> Đáp án A.',
      },
    ],
    hskMockReading: [
      {
        id: 'hsk1-l15-mock-r1',
        part: 4,
        questionNumber: 19,
        promptChinese: '明天星期天，儿子想去看一个电影。',
        promptPinyin: 'Míngtiān Xīngqītiān, érzi xiǎng qù kàn yí gè diànyǐng.',
        subPrompt: '★ 儿子明天想： (Con trai ngày mai muốn...)',
        options: [
          { key: 'A', textChinese: '买电脑', textVietnamese: 'Mua máy tính' },
          { key: 'B', textChinese: '打电话', textVietnamese: 'Gọi điện' },
          { key: 'C', textChinese: '看电影', textVietnamese: 'Xem phim' },
        ],
        correctKey: 'C',
        explanation: 'Con trai muốn đi xem phim (看电影) -> Đáp án C.',
      },
      {
        id: 'hsk1-l15-mock-r2',
        part: 4,
        questionNumber: 20,
        promptChinese: '下小雨了，小狗非常高兴，它喜欢小雨。',
        promptPinyin: 'Xià xiǎoyǔ le, xiǎo gǒu fēicháng gāoxìng, tā xǐhuan xiǎoyǔ.',
        subPrompt: '★ 小狗喜欢： (Chú cún thích...)',
        options: [
          { key: 'A', textChinese: '下小雨', textVietnamese: 'Trời mưa nhỏ' },
          { key: 'B', textChinese: '下大雨', textVietnamese: 'Trời mưa to' },
          { key: 'C', textChinese: '下小雪', textVietnamese: 'Tuyết rơi nhỏ' },
        ],
        correctKey: 'A',
        explanation: 'Chú cún thích trời mưa nhỏ (喜欢小雨) -> Đáp án A.',
      },
    ],
  },
];

// BỘ ĐỀ THI MÔ PHỎNG HSK 1 CHUẨN TOÀN DIỆN (Trang 121 - 131 trong Sách Bài Tập)
export interface MockExamQuestion {
  id: string;
  section: 'listening' | 'reading';
  part: 1 | 2 | 3 | 4;
  questionNumber: number;
  prompt?: string;
  promptChinese?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  subPrompt?: string;
  audioScript?: string;
  imageEmoji?: string;
  options: {
    key: string;
    textChinese?: string;
    textPinyin?: string;
    textVietnamese?: string;
    imageEmoji?: string;
  }[];
  correctKey?: string;
  correctAnswer?: string;
  explanation: string;
}

export const HSK1_OFFICIAL_MOCK_EXAM: MockExamQuestion[] = [
  // PHẦN NGHE (20 câu)
  // Phần 1: 1-5 Nghe chọn tranh
  {
    id: 'mock-q1',
    section: 'listening',
    part: 1,
    questionNumber: 1,
    promptChinese: '包子 (bāozi)',
    audioScript: 'bāozi (bánh bao)',
    options: [
      { key: 'A', imageEmoji: '🥟', textVietnamese: 'Bánh bao nóng hổi' },
      { key: 'B', imageEmoji: '🍵', textVietnamese: 'Chén trà' },
      { key: 'C', imageEmoji: '🥢', textVietnamese: 'Sủi cảo' },
    ],
    correctKey: 'A',
    explanation: 'Từ nghe được là "包子" (bánh bao) -> Tranh A.',
  },
  {
    id: 'mock-q2',
    section: 'listening',
    part: 1,
    questionNumber: 2,
    promptChinese: '喝茶 (hē chá)',
    audioScript: 'hē chá (uống trà)',
    options: [
      { key: 'A', imageEmoji: '⚽', textVietnamese: 'Đá bóng' },
      { key: 'B', imageEmoji: '🍳', textVietnamese: 'Nấu ăn' },
      { key: 'C', imageEmoji: '🍵', textVietnamese: 'Thưởng trà / Uống trà' },
    ],
    correctKey: 'C',
    explanation: 'Từ nghe được là "喝茶" (uống trà) -> Tranh C.',
  },
  {
    id: 'mock-q3',
    section: 'listening',
    part: 1,
    questionNumber: 3,
    promptChinese: '踢足球 (tī zúqiú)',
    audioScript: 'tī zúqiú (đá bóng)',
    options: [
      { key: 'A', imageEmoji: '⚽', textVietnamese: 'Hai bạn nhỏ đá bóng' },
      { key: 'B', imageEmoji: '☕', textVietnamese: 'Uống cà phê' },
      { key: 'C', imageEmoji: '📖', textVietnamese: 'Đọc sách' },
    ],
    correctKey: 'A',
    explanation: 'Từ nghe được là "踢足球" (đá bóng) -> Tranh A.',
  },
  {
    id: 'mock-q4',
    section: 'listening',
    part: 1,
    questionNumber: 4,
    promptChinese: '七点 (qī diǎn)',
    audioScript: 'qī diǎn (7 giờ)',
    options: [
      { key: 'A', imageEmoji: '🕖', textVietnamese: 'Đồng hồ chỉ 7:00' },
      { key: 'B', imageEmoji: '🕙', textVietnamese: 'Đồng hồ chỉ 10:00' },
      { key: 'C', imageEmoji: '🕠', textVietnamese: 'Đồng hồ chỉ 5:30' },
    ],
    correctKey: 'A',
    explanation: 'Giờ nghe được là 7 giờ đúng (七点) -> Tranh A.',
  },
  {
    id: 'mock-q5',
    section: 'listening',
    part: 1,
    questionNumber: 5,
    promptChinese: '小狗 (xiǎo gǒu)',
    audioScript: 'xiǎo gǒu (chú chó nhỏ)',
    options: [
      { key: 'A', imageEmoji: '🐕', textVietnamese: 'Em bé ôm chú cún cưng' },
      { key: 'B', imageEmoji: '👶', textVietnamese: 'Mẹ bế em bé' },
      { key: 'C', imageEmoji: '👯', textVietnamese: 'Hai chị em nhảy múa' },
    ],
    correctKey: 'A',
    explanation: 'Từ nghe được là "小狗" (chú chó con) -> Tranh A.',
  },

  // Phần 2: 6-10 Nghe câu hỏi chọn đáp án
  {
    id: 'mock-q6',
    section: 'listening',
    part: 2,
    questionNumber: 6,
    audioScript: 'Nǐ zài zuò shénme ne? (Bạn đang làm gì thế?)',
    options: [
      { key: 'A', textChinese: '哪里', textPinyin: 'nǎlǐ', textVietnamese: 'Ở đâu' },
      { key: 'B', textChinese: '打电话', textPinyin: 'dǎ diànhuà', textVietnamese: 'Đang gọi điện thoại' },
      { key: 'C', textChinese: '做饭好吃', textPinyin: 'zuò fàn hǎochī', textVietnamese: 'Nấu cơm ngon' },
    ],
    correctKey: 'B',
    explanation: 'Hỏi hành động đang làm "你在做什么呢？" -> Trả lời hành động "打电话" (Đang gọi điện thoại).',
  },
  {
    id: 'mock-q7',
    section: 'listening',
    part: 2,
    questionNumber: 7,
    audioScript: 'Tā zěnme méi lái shàngbān? (Sao anh ấy không đến đi làm?)',
    options: [
      { key: 'A', textChinese: '白天', textPinyin: 'báitiān', textVietnamese: 'Ban ngày' },
      { key: 'B', textChinese: '生病了', textPinyin: 'shēngbìng le', textVietnamese: 'Bị ốm rồi' },
      { key: 'C', textChinese: '水果店', textPinyin: 'shuǐguǒdiàn', textVietnamese: 'Cửa hàng hoa quả' },
    ],
    correctKey: 'B',
    explanation: 'Hỏi lý do vắng mặt "怎么没来？" -> Trả lời lý do "生病了" (Bị ốm).',
  },
  {
    id: 'mock-q8',
    section: 'listening',
    part: 2,
    questionNumber: 8,
    audioScript: 'Zhè běn shū duōshao qián? (Cuốn sách này bao nhiêu tiền?)',
    options: [
      { key: 'A', textChinese: '八元', textPinyin: 'bā yuán', textVietnamese: '8 tệ' },
      { key: 'B', textChinese: '不是', textPinyin: 'bú shì', textVietnamese: 'Không phải' },
      { key: 'C', textChinese: '便宜', textPinyin: 'piányi', textVietnamese: 'Rẻ' },
    ],
    correctKey: 'A',
    explanation: 'Hỏi giá tiền "多少钱？" -> Trả lời số tiền cụ thể "八元" (8 tệ).',
  },
  {
    id: 'mock-q9',
    section: 'listening',
    part: 2,
    questionNumber: 9,
    audioScript: 'Tā shì nǐ de péngyou ma? (Cậu ấy là bạn của bạn à?)',
    options: [
      { key: 'A', textChinese: '去年', textPinyin: 'qùnián', textVietnamese: 'Năm ngoái' },
      { key: 'B', textChinese: '很漂亮', textPinyin: 'hěn piàoliang', textVietnamese: 'Rất xinh đẹp' },
      { key: 'C', textChinese: '我弟弟', textPinyin: 'wǒ dìdi', textVietnamese: 'Là em trai tôi' },
    ],
    correctKey: 'C',
    explanation: 'Xác nhận danh tính người đó: "我弟弟" (Em trai tôi).',
  },
  {
    id: 'mock-q10',
    section: 'listening',
    part: 2,
    questionNumber: 10,
    audioScript: 'Míngtiān jiàn! (Ngày mai gặp lại nhé!)',
    options: [
      { key: 'A', textChinese: '没有', textPinyin: 'méiyǒu', textVietnamese: 'Không có' },
      { key: 'B', textChinese: '再见', textPinyin: 'zàijiàn', textVietnamese: 'Tạm biệt' },
      { key: 'C', textChinese: '不要', textPinyin: 'búyào', textVietnamese: 'Đừng / Không muốn' },
    ],
    correctKey: 'B',
    explanation: 'Khi chào tạm biệt "明天见！" -> Đáp lại "再见" (Tạm biệt).',
  },

  // Phần 3: 11-15 Nghe hội thoại chọn tranh A-F
  {
    id: 'mock-q11',
    section: 'listening',
    part: 3,
    questionNumber: 11,
    audioScript: 'Nán: Wǒ xiǎng qù yīyuàn kànkan. Nǚ: Hǎo de, wǒ péi nǐ qù. (Nam: Tôi muốn đi bệnh viện khám. Nữ: Được, tôi đi cùng bạn).',
    options: [
      { key: 'A', imageEmoji: '👨‍⚕️', textVietnamese: 'Bác sĩ đang khám bệnh' },
      { key: 'B', imageEmoji: '🪑', textVietnamese: 'Cái ghế' },
      { key: 'C', imageEmoji: '🤝', textVietnamese: 'Bắt tay chào hỏi' },
    ],
    correctKey: 'A',
    explanation: 'Hội thoại nhắc đến việc đi bệnh viện khám (去医院看看) -> Tranh bác sĩ A.',
  },
  {
    id: 'mock-q12',
    section: 'listening',
    part: 3,
    questionNumber: 12,
    audioScript: 'Nán: Qǐngzuò, hē diǎnr chá ba. Nǚ: Xièxie! (Nam: Xin mời ngồi, uống chút trà nhé. Nữ: Cảm ơn!)',
    options: [
      { key: 'A', imageEmoji: '👨‍⚕️', textVietnamese: 'Bác sĩ' },
      { key: 'B', imageEmoji: '🪑', textVietnamese: 'Mời ngồi ghế' },
      { key: 'C', imageEmoji: '🤝', textVietnamese: 'Bắt tay' },
    ],
    correctKey: 'B',
    explanation: 'Mời ngồi xuống (请坐) -> Tranh cái ghế B.',
  },

  // Phần 4: 16-20 Nghe đoạn ngắn & câu hỏi chọn A-C
  {
    id: 'mock-q16',
    section: 'listening',
    part: 4,
    questionNumber: 16,
    audioScript: 'Wǒ yéye jīnnián 60 duō suì le. (Hỏi: 爷爷今年多大了？)',
    options: [
      { key: 'A', textChinese: '60岁', textVietnamese: '60 tuổi' },
      { key: 'B', textChinese: '60多岁', textVietnamese: 'Hơn 60 tuổi' },
      { key: 'C', textChinese: '70岁', textVietnamese: '70 tuổi' },
    ],
    correctKey: 'B',
    explanation: 'Độ tuổi nghe được là hơn 60 tuổi (60多岁) -> Đáp án B.',
  },
  {
    id: 'mock-q17',
    section: 'listening',
    part: 4,
    questionNumber: 17,
    audioScript: 'Wǒ de shǒujī zài zhuōzi shang. (Hỏi: 什么在桌子上？)',
    options: [
      { key: 'A', textChinese: '电脑', textVietnamese: 'Máy tính' },
      { key: 'B', textChinese: '杯子', textVietnamese: 'Cái cốc' },
      { key: 'C', textChinese: '手机', textVietnamese: 'Điện thoại' },
    ],
    correctKey: 'C',
    explanation: 'Đồ vật ở trên bàn là điện thoại (手机) -> Đáp án C.',
  },
  {
    id: 'mock-q18',
    section: 'listening',
    part: 4,
    questionNumber: 18,
    audioScript: 'Gāo nǚshì de nǚ\'ér zhēn piàoliang. (Hỏi: 谁真漂亮？)',
    options: [
      { key: 'A', textChinese: '女儿', textVietnamese: 'Con gái' },
      { key: 'B', textChinese: '妹妹', textVietnamese: 'Em gái' },
      { key: 'C', textChinese: '高女士', textVietnamese: 'Cô Cao' },
    ],
    correctKey: 'A',
    explanation: 'Người được khen đẹp là con gái của cô Cao (女儿) -> Đáp án A.',
  },
  {
    id: 'mock-q19',
    section: 'listening',
    part: 4,
    questionNumber: 19,
    audioScript: 'Zǎoshang wǒ chīle liǎng gè miànbāo. (Hỏi: 早上吃了什么？)',
    options: [
      { key: 'A', textChinese: '包子', textVietnamese: 'Bánh bao' },
      { key: 'B', textChinese: '面包', textVietnamese: 'Bánh mì' },
      { key: 'C', textChinese: '面条儿', textVietnamese: 'Mì sợi' },
    ],
    correctKey: 'B',
    explanation: 'Món ăn sáng là bánh mì (面包) -> Đáp án B.',
  },
  {
    id: 'mock-q20',
    section: 'listening',
    part: 4,
    questionNumber: 20,
    audioScript: 'Míngtiān Xīngqītiān, wǒmen bú qù shàngbān. (Hỏi: 哪天不去上班？)',
    options: [
      { key: 'A', textChinese: '早上', textVietnamese: 'Buổi sáng' },
      { key: 'B', textChinese: '中午', textVietnamese: 'Buổi trưa' },
      { key: 'C', textChinese: '星期天', textVietnamese: 'Chủ nhật' },
    ],
    correctKey: 'C',
    explanation: 'Ngày không đi làm là Chủ nhật (星期天) -> Đáp án C.',
  },

  // PHẦN ĐỌC (20 câu)
  // Phần 1: 21-25 Đọc câu chọn tranh
  {
    id: 'mock-q21',
    section: 'reading',
    part: 1,
    questionNumber: 21,
    promptChinese: '王先生是医生。',
    promptPinyin: 'Wáng xiānsheng shì yīshēng.',
    promptVietnamese: 'Ông Vương là bác sĩ.',
    options: [
      { key: 'A', imageEmoji: '👨‍⚕️', textVietnamese: 'Bác sĩ áo blouse trắng' },
      { key: 'B', imageEmoji: '🛒', textVietnamese: 'Đi siêu thị mua rau' },
      { key: 'C', imageEmoji: '🥛', textVietnamese: 'Sữa tươi và trứng' },
    ],
    correctKey: 'A',
    explanation: 'Nghề nghiệp "医生" (bác sĩ) tương ứng với tranh A.',
  },
  {
    id: 'mock-q22',
    section: 'reading',
    part: 1,
    questionNumber: 22,
    promptChinese: '姐姐上午去超市买了菜。',
    promptPinyin: 'Jiějie shàngwǔ qù chāoshì mǎi le cài.',
    promptVietnamese: 'Chị gái buổi sáng đi siêu thị mua rau.',
    options: [
      { key: 'A', imageEmoji: '👨‍⚕️', textVietnamese: 'Bác sĩ' },
      { key: 'B', imageEmoji: '🛒', textVietnamese: 'Cô gái mua rau ở siêu thị' },
      { key: 'C', imageEmoji: '🎤', textVietnamese: 'Ca hát' },
    ],
    correctKey: 'B',
    explanation: 'Đi siêu thị mua rau (去超市买了菜) -> Tranh B.',
  },
  {
    id: 'mock-q23',
    section: 'reading',
    part: 1,
    questionNumber: 23,
    promptChinese: '今天的早饭是牛奶和鸡蛋。',
    promptPinyin: 'Jīntiān de zǎofàn shì niúnǎi hé jīdàn.',
    promptVietnamese: 'Bữa sáng hôm nay là sữa bò và trứng gà.',
    options: [
      { key: 'A', imageEmoji: '🥛', textVietnamese: 'Ly sữa tươi và quả trứng gà' },
      { key: 'B', imageEmoji: '👨‍👩‍👦', textVietnamese: 'Gia đình' },
      { key: 'C', imageEmoji: '🎤', textVietnamese: 'Hát' },
    ],
    correctKey: 'A',
    explanation: 'Bữa sáng có sữa bò và trứng gà (牛奶和鸡蛋) -> Tranh A.',
  },
  {
    id: 'mock-q24',
    section: 'reading',
    part: 1,
    questionNumber: 24,
    promptChinese: '我家有四口人，爸爸、妈妈、弟弟和我。',
    promptPinyin: 'Wǒ jiā yǒu sì kǒu rén, bàba, māma, dìdi hé wǒ.',
    promptVietnamese: 'Nhà tôi có 4 người: bố, mẹ, em trai và tôi.',
    options: [
      { key: 'A', imageEmoji: '👨‍👩‍👦‍👦', textVietnamese: 'Bức ảnh gia đình 4 người ấm cúng' },
      { key: 'B', imageEmoji: '🎤', textVietnamese: 'Hát' },
    ],
    correctKey: 'A',
    explanation: 'Gia đình có 4 người (四口人) -> Tranh A.',
  },
  {
    id: 'mock-q25',
    section: 'reading',
    part: 1,
    questionNumber: 25,
    promptChinese: '她和好朋友都爱唱歌。',
    promptPinyin: 'Tā hé hǎo péngyou dōu ài chànggē.',
    promptVietnamese: 'Cô ấy và bạn thân đều thích ca hát.',
    options: [
      { key: 'A', imageEmoji: '🎤', textVietnamese: 'Hai cô bạn cầm mic hát say mê' },
      { key: 'B', imageEmoji: '🚗', textVietnamese: 'Đi xe' },
    ],
    correctKey: 'A',
    explanation: 'Thích ca hát (爱唱歌) -> Tranh A.',
  },

  // Phần 2: 26-30 Nối câu
  {
    id: 'mock-q26',
    section: 'reading',
    part: 2,
    questionNumber: 26,
    promptChinese: '这是我的书，你的呢？',
    promptPinyin: 'Zhè shì wǒ de shū, nǐ de ne?',
    promptVietnamese: 'Đây là sách của tôi, còn của bạn đâu?',
    options: [
      { key: 'A', textChinese: '商店。', textVietnamese: 'Cửa hàng.' },
      { key: 'B', textChinese: '我学生。', textVietnamese: 'Học sinh của tôi.' },
      { key: 'C', textChinese: '在桌子上。', textVietnamese: 'Ở trên bàn.' },
      { key: 'D', textChinese: '还没有。', textVietnamese: 'Vẫn chưa có.' },
      { key: 'E', textChinese: '下雪了。', textVietnamese: 'Tuyết rơi rồi.' },
    ],
    correctKey: 'C',
    explanation: 'Hỏi vị trí cuốn sách "你的呢？" -> Trả lời "在桌子上。" (Ở trên bàn).',
  },
  {
    id: 'mock-q27',
    section: 'reading',
    part: 2,
    questionNumber: 27,
    promptChinese: '你去哪儿买苹果？',
    promptPinyin: 'Nǐ qù nǎr mǎi píngguǒ?',
    promptVietnamese: 'Bạn đi đâu mua táo?',
    options: [
      { key: 'A', textChinese: '商店。', textVietnamese: 'Cửa hàng.' },
      { key: 'B', textChinese: '我学生。', textVietnamese: 'Học sinh của tôi.' },
      { key: 'C', textChinese: '在桌子上。', textVietnamese: 'Ở trên bàn.' },
    ],
    correctKey: 'A',
    explanation: 'Hỏi địa điểm mua sắm "去哪儿买？" -> Trả lời "商店。" (Cửa hàng).',
  },
  {
    id: 'mock-q28',
    section: 'reading',
    part: 2,
    questionNumber: 28,
    promptChinese: '昨天天气怎么样？',
    promptPinyin: 'Zuótiān tiānqì zěnmeyàng?',
    promptVietnamese: 'Hôm qua thời tiết thế nào?',
    options: [
      { key: 'A', textChinese: '在桌子上。', textVietnamese: 'Ở trên bàn.' },
      { key: 'B', textChinese: '我学生。', textVietnamese: 'Học sinh của tôi.' },
      { key: 'C', textChinese: '下雪了。', textVietnamese: 'Tuyết rơi rồi.' },
    ],
    correctKey: 'C',
    explanation: 'Hỏi thời tiết "天气怎么样？" -> Trả lời "下雪了。" (Tuyết rơi rồi).',
  },
  {
    id: 'mock-q29',
    section: 'reading',
    part: 2,
    questionNumber: 29,
    promptChinese: '你和谁打电话呢？',
    promptPinyin: 'Nǐ hé shéi dǎ diànhuà ne?',
    promptVietnamese: 'Bạn đang gọi điện thoại với ai đấy?',
    options: [
      { key: 'A', textChinese: '我学生。', textVietnamese: 'Học sinh của tôi.' },
      { key: 'B', textChinese: '商店。', textVietnamese: 'Cửa hàng.' },
      { key: 'C', textChinese: '下雪了。', textVietnamese: 'Tuyết rơi rồi.' },
    ],
    correctKey: 'A',
    explanation: 'Hỏi đối tượng gọi điện "和谁？" -> Trả lời "我学生。" (Học sinh của tôi).',
  },
  {
    id: 'mock-q30',
    section: 'reading',
    part: 2,
    questionNumber: 30,
    promptChinese: '你下班了吗？',
    promptPinyin: 'Nǐ xiàbān le ma?',
    promptVietnamese: 'Bạn tan làm chưa?',
    options: [
      { key: 'A', textChinese: '在桌子上。', textVietnamese: 'Ở trên bàn.' },
      { key: 'B', textChinese: '还没有。', textVietnamese: 'Vẫn chưa.' },
      { key: 'C', textChinese: '下雪了。', textVietnamese: 'Tuyết rơi rồi.' },
    ],
    correctKey: 'B',
    explanation: 'Hỏi trạng thái đã làm xong chưa "下班了吗？" -> Trả lời "还没有。" (Vẫn chưa).',
  },

  // Phần 3: 31-35 Điền từ vào chỗ trống
  {
    id: 'mock-q31',
    section: 'reading',
    part: 3,
    questionNumber: 31,
    promptChinese: '大家都没吃 (   ) 呢。',
    promptPinyin: 'Dàjiā dōu méi chī (   ) ne.',
    promptVietnamese: 'Mọi người đều chưa ăn ( ... ) kìa.',
    options: [
      { key: 'A', textChinese: '认识 (rènshi)', textVietnamese: 'Quen biết' },
      { key: 'B', textChinese: '住 (zhù)', textVietnamese: 'Ở/Sinh sống' },
      { key: 'C', textChinese: '晚饭 (wǎnfàn)', textVietnamese: 'Cơm tối' },
      { key: 'D', textChinese: '叫 (jiào)', textVietnamese: 'Tên là' },
      { key: 'E', textChinese: '汉字 (Hànzì)', textVietnamese: 'Chữ Hán' },
      { key: 'F', textChinese: '块 (kuài)', textVietnamese: 'Đồng/Tệ' },
    ],
    correctKey: 'C',
    explanation: 'Hành động ăn (吃) đi kèm bữa cơm: 吃晚饭 (ăn cơm tối) -> Đáp án C.',
  },
  {
    id: 'mock-q32',
    section: 'reading',
    part: 3,
    questionNumber: 32,
    promptChinese: '在今天的中文课上，我学了很多 (   )。',
    promptPinyin: 'Zài jīntiān de Zhōngwén kè shang, wǒ xuéle hěn duō (   ).',
    promptVietnamese: 'Trong giờ tiếng Trung hôm nay, tôi đã học được rất nhiều ( ... ).',
    options: [
      { key: 'A', textChinese: '认识 (rènshi)' },
      { key: 'B', textChinese: '住 (zhù)' },
      { key: 'C', textChinese: '晚饭 (wǎnfàn)' },
      { key: 'E', textChinese: '汉字 (Hànzì)', textVietnamese: 'Chữ Hán' },
    ],
    correctKey: 'E',
    explanation: 'Học tiếng Trung thì học nhiều chữ Hán (学了很多汉字) -> Đáp án E.',
  },
  {
    id: 'mock-q33',
    section: 'reading',
    part: 3,
    questionNumber: 33,
    promptChinese: '对不起，我不 (   ) 这个人。',
    promptPinyin: 'Duìbuqǐ, wǒ bù (   ) zhège rén.',
    promptVietnamese: 'Xin lỗi, tôi không ( ... ) người này.',
    options: [
      { key: 'A', textChinese: '认识 (rènshi)', textVietnamese: 'quen biết' },
      { key: 'B', textChinese: '住 (zhù)', textVietnamese: 'ở' },
      { key: 'C', textChinese: '晚饭 (wǎnfàn)' },
    ],
    correctKey: 'A',
    explanation: 'Không quen biết người này: "我不认识这个人" -> Đáp án A.',
  },
  {
    id: 'mock-q34',
    section: 'reading',
    part: 3,
    questionNumber: 34,
    promptChinese: '我和家人 (   ) 在北京。',
    promptPinyin: 'Wǒ hé jiārén (   ) zài Běijīng.',
    promptVietnamese: 'Tôi và gia đình ( ... ) ở Bắc Kinh.',
    options: [
      { key: 'A', textChinese: '认识 (rènshi)' },
      { key: 'B', textChinese: '住 (zhù)', textVietnamese: 'Sinh sống / Ở' },
      { key: 'C', textChinese: '晚饭 (wǎnfàn)' },
    ],
    correctKey: 'B',
    explanation: 'Động từ cư trú ở Bắc Kinh: "住在北京" -> Đáp án B.',
  },
  {
    id: 'mock-q35',
    section: 'reading',
    part: 3,
    questionNumber: 35,
    promptChinese: '这些东西可以卖多少钱？- 80 (   )。',
    promptPinyin: 'Zhèxiē dōngxi kěyǐ mài duōshao qián? - 80 (   ).',
    promptVietnamese: 'Mấy món này bán được bao nhiêu tiền? - 80 ( ... ).',
    options: [
      { key: 'A', textChinese: '认识 (rènshi)' },
      { key: 'E', textChinese: '汉字 (Hànzì)' },
      { key: 'F', textChinese: '块 (kuài)', textVietnamese: 'Tệ / Đồng' },
    ],
    correctKey: 'F',
    explanation: 'Đơn vị tiền tệ khẩu ngữ: "80块" (80 tệ) -> Đáp án F.',
  },

  // Phần 4: 36-40 Đọc đoạn ngắn trả lời câu hỏi
  {
    id: 'mock-q36',
    section: 'reading',
    part: 4,
    questionNumber: 36,
    promptChinese: '下雨了，我们坐出租车回家吧。',
    promptPinyin: 'Xiàyǔ le, wǒmen zuò chūzūchē huíjiā ba.',
    subPrompt: '★ 说话人想怎么回家？ (Người nói muốn về nhà bằng cách nào?)',
    options: [
      { key: 'A', textChinese: '开车', textVietnamese: 'Lái xe' },
      { key: 'B', textChinese: '坐飞机', textVietnamese: 'Đi máy bay' },
      { key: 'C', textChinese: '坐出租车', textVietnamese: 'Đi taxi' },
    ],
    correctKey: 'C',
    explanation: 'Người nói đề nghị đi taxi về nhà (坐出租车回家) -> Đáp án C.',
  },
  {
    id: 'mock-q37',
    section: 'reading',
    part: 4,
    questionNumber: 37,
    promptChinese: '我儿子今年16岁了，正在上中学。',
    promptPinyin: 'Wǒ érzi jīnnián 16 suì le, zhèngzài shàng zhōngxué.',
    subPrompt: '★ 说话人的儿子是： (Con trai người nói là...)',
    options: [
      { key: 'A', textChinese: '小学生', textVietnamese: 'Học sinh tiểu học' },
      { key: 'B', textChinese: '中学生', textVietnamese: 'Học sinh trung học' },
      { key: 'C', textChinese: '大学生', textVietnamese: 'Sinh viên đại học' },
    ],
    correctKey: 'B',
    explanation: 'Con trai đang học cấp 2/trung học (正在上中学) nên là học sinh trung học (中学生) -> Đáp án B.',
  },
  {
    id: 'mock-q38',
    section: 'reading',
    part: 4,
    questionNumber: 38,
    promptChinese: '小猫和小狗都在房间外睡觉呢。',
    promptPinyin: 'Xiǎo māo hé xiǎo gǒu dōu zài fángjiān wài shuìjiào ne.',
    subPrompt: '★ 小狗在： (Chú cún đang ở...)',
    options: [
      { key: 'A', textChinese: '桌子下', textVietnamese: 'Dưới bàn' },
      { key: 'B', textChinese: '房间里', textVietnamese: 'Trong phòng' },
      { key: 'C', textChinese: '房间外', textVietnamese: 'Ngoài phòng' },
    ],
    correctKey: 'C',
    explanation: 'Mèo và chó đều ngủ ở ngoài phòng (都在房间外) -> Đáp án C.',
  },
  {
    id: 'mock-q39',
    section: 'reading',
    part: 4,
    questionNumber: 39,
    promptChinese: '我同学在这个学校工作很多年了，你有问题可以问他。',
    promptPinyin: 'Wǒ tóngxué zài zhège xuéxiào gōngzuò hěn duō nián le, nǐ yǒu wèntí kěyǐ wèn tā.',
    subPrompt: '★ 说话人的同学在哪儿上班？ (Bạn học người nói làm việc ở đâu?)',
    options: [
      { key: 'A', textChinese: '饭店', textVietnamese: 'Nhà hàng' },
      { key: 'B', textChinese: '医院', textVietnamese: 'Bệnh viện' },
      { key: 'C', textChinese: '学校', textVietnamese: 'Trường học' },
    ],
    correctKey: 'C',
    explanation: 'Bạn học làm việc ở trường học (在这个学校工作) -> Đáp án C.',
  },
  {
    id: 'mock-q40',
    section: 'reading',
    part: 4,
    questionNumber: 40,
    promptChinese: '这个小朋友写字真好看。',
    promptPinyin: 'Zhège xiǎopéngyou xiě zì zhēn hǎokàn.',
    subPrompt: '★ 那个小朋友： (Bạn nhỏ đó...)',
    options: [
      { key: 'A', textChinese: '名字好听', textVietnamese: 'Tên hay' },
      { key: 'B', textChinese: '写字好看', textVietnamese: 'Viết chữ đẹp' },
      { key: 'C', textChinese: '正在读书', textVietnamese: 'Đang đọc sách' },
    ],
    correctKey: 'B',
    explanation: 'Khen bạn nhỏ viết chữ rất đẹp (写字真好看) -> Đáp án B.',
  },
];
