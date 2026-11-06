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
        id: "hsk1-l04-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Lǎoshī (thầy cô giáo)",
        options: [
          {key: "A", textChinese: "工人", textVietnamese: "Công nhân", imageEmoji: "👷"},
          {key: "B", textChinese: "老师", textVietnamese: "Giáo viên", imageEmoji: "👩‍🏫"},
          {key: "C", textChinese: "孩子", textVietnamese: "Trẻ em", imageEmoji: "👶"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"老师\" (thầy cô giáo) -> Tranh B.",
      },
      {
        id: "hsk1-l04-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Nǚ xuésheng (nữ sinh)",
        options: [
          {key: "A", textChinese: "女学生", textVietnamese: "Nữ sinh", imageEmoji: "👧"},
          {key: "B", textChinese: "男孩儿", textVietnamese: "Bé trai", imageEmoji: "👦"},
          {key: "C", textChinese: "两个朋友", textVietnamese: "Hai người bạn", imageEmoji: "👭"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"女学生\" (nữ sinh) -> Tranh A.",
      },
      {
        id: "hsk1-l04-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Liǎng gè háizi (hai đứa con)",
        options: [
          {key: "A", textChinese: "三个学生", textVietnamese: "Ba học sinh", imageEmoji: "👨‍👩‍👧"},
          {key: "B", textChinese: "两个孩子", textVietnamese: "Hai đứa trẻ", imageEmoji: "👦👧"},
          {key: "C", textChinese: "两个杯子", textVietnamese: "Hai cái cốc", imageEmoji: "🥛🥛"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"两个孩子\" (hai đứa con) -> Tranh B.",
      },
      {
        id: "hsk1-l04-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ jiā yǒu jǐ kǒu rén? (Nhà bạn có mấy người?)",
        options: [
          {key: "A", textChinese: "十人", textPinyin: "shí rén", textVietnamese: "10 người"},
          {key: "B", textChinese: "20个", textPinyin: "20 gè", textVietnamese: "20 cái"},
          {key: "C", textChinese: "三口人", textPinyin: "sān kǒu rén", textVietnamese: "3 người"}
        ],
        correctKey: "C",
        explanation: "Hỏi số thành viên gia đình \"几口人\" -> Trả lời \"三口人\" (3 người).",
      },
      {
        id: "hsk1-l04-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ nǚ'ér jīnnián duō dà le? (Con gái bạn năm nay bao nhiêu tuổi rồi?)",
        options: [
          {key: "A", textChinese: "大", textPinyin: "dà", textVietnamese: "Lớn"},
          {key: "B", textChinese: "12岁", textPinyin: "12 suì", textVietnamese: "12 tuổi"},
          {key: "C", textChinese: "两千", textPinyin: "liǎngqiān", textVietnamese: "Hai nghìn"}
        ],
        correctKey: "B",
        explanation: "Hỏi tuổi \"多大\" -> Trả lời số tuổi \"12岁\" (12 tuổi).",
      },
      {
        id: "hsk1-l04-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ hǎo! Hěn gāoxìng rènshi nǐ. Nǚ: Nǐ hǎo! Wǒ yě hěn gāoxìng rènshi nǐ.",
        options: [
          {key: "A", textChinese: "Hai người bắt tay chào hỏi", imageEmoji: "🤝"},
          {key: "B", textChinese: "Bé gái ngồi ghế", imageEmoji: "👧"},
          {key: "C", textChinese: "Ba người bạn chụp ảnh", imageEmoji: "👥"}
        ],
        correctKey: "A",
        explanation: "Hai người chào hỏi làm quen và bắt tay nhau -> Tranh A.",
      },
      {
        id: "hsk1-l04-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Zhè shì nǐ nǚ'ér ma? Nǚ: Shì de, tā jīnnián wǔ suì le.",
        options: [
          {key: "A", textChinese: "Hai người bắt tay", imageEmoji: "🤝"},
          {key: "B", textChinese: "Bé gái nhỏ đáng yêu", imageEmoji: "👧"},
          {key: "C", textChinese: "Ba người bạn", imageEmoji: "👥"}
        ],
        correctKey: "B",
        explanation: "Nhắc đến con gái 5 tuổi (五岁) -> Tranh B.",
      },
      {
        id: "hsk1-l04-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐmen dōu shì xuésheng ma? Nǚ: Shì de, wǒmen sān gè dōu shì xuésheng.",
        options: [
          {key: "A", textChinese: "Bắt tay", imageEmoji: "🤝"},
          {key: "B", textChinese: "Bé gái", imageEmoji: "👧"},
          {key: "C", textChinese: "Ba sinh viên cùng nhau", imageEmoji: "🧑‍🤝‍🧑"}
        ],
        correctKey: "C",
        explanation: "Cả ba người đều là học sinh/sinh viên -> Tranh C.",
      },
      {
        id: "hsk1-l04-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wǒ gēge bú shì Fǎguó rén, tā shì Zhōngguó rén. (Hỏi: 哥哥是哪国人？)",
        options: [
          {key: "A", textChinese: "中国人", textPinyin: "Zhōngguó rén", textVietnamese: "Người Trung Quốc"},
          {key: "B", textChinese: "泰国人", textPinyin: "Tàiguó rén", textVietnamese: "Người Thái Lan"},
          {key: "C", textChinese: "法国人", textPinyin: "Fǎguó rén", textVietnamese: "Người Pháp"}
        ],
        correctKey: "A",
        explanation: "Anh trai là người Trung Quốc (中国人) -> Đáp án A.",
      },
      {
        id: "hsk1-l04-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Zhè shì wǒ de péngyou, tā jiào Wáng Yīfēi. (Hỏi: 朋友叫什么名字？)",
        options: [
          {key: "A", textChinese: "安妮", textPinyin: "Ānnī", textVietnamese: "Annie"},
          {key: "B", textChinese: "王一飞", textPinyin: "Wáng Yīfēi", textVietnamese: "Vương Nhất Phi"},
          {key: "C", textChinese: "白家月", textPinyin: "Bái Jiāyuè", textVietnamese: "Bạch Gia Nguyệt"}
        ],
        correctKey: "B",
        explanation: "Bạn tên là Vương Nhất Phi (王一飞) -> Đáp án B.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l04-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "老师，您好！",
        promptPinyin: "Lǎoshī, nín hǎo!",
        promptVietnamese: "Em chào thầy ạ!",
        options: [
          {key: "A", textVietnamese: "Cô gái đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Chàng trai 20 tuổi", imageEmoji: "👦"},
          {key: "C", textVietnamese: "Học sinh chào thầy giáo", imageEmoji: "👨‍🏫"},
          {key: "D", textVietnamese: "Gia đình 4 người", imageEmoji: "👨‍👩‍👧‍👦"}
        ],
        correctKey: "C",
        explanation: "Chào thầy giáo \"老师，您好！\" -> Tranh C.",
      },
      {
        id: "hsk1-l04-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "我家有四口人。",
        promptPinyin: "Wǒ jiā yǒu sì kǒu rén.",
        promptVietnamese: "Nhà tôi có 4 người.",
        options: [
          {key: "A", textVietnamese: "Cô gái đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Chàng trai 20 tuổi", imageEmoji: "👦"},
          {key: "C", textVietnamese: "Chào thầy giáo", imageEmoji: "👨‍🏫"},
          {key: "D", textVietnamese: "Bức ảnh gia đình 4 người", imageEmoji: "👨‍👩‍👧‍👦"}
        ],
        correctKey: "D",
        explanation: "Gia đình có 4 người \"我家有四口人\" -> Tranh D.",
      },
      {
        id: "hsk1-l04-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "我哥哥今年20岁。",
        promptPinyin: "Wǒ gēge jīnnián 20 suì.",
        promptVietnamese: "Anh trai tôi năm nay 20 tuổi.",
        options: [
          {key: "A", textVietnamese: "Cô gái đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Chàng trai trẻ 20 tuổi ôm tập tài liệu", imageEmoji: "👦"},
          {key: "C", textVietnamese: "Chào thầy giáo", imageEmoji: "👨‍🏫"},
          {key: "D", textVietnamese: "Gia đình 4 người", imageEmoji: "👨‍👩‍👧‍👦"}
        ],
        correctKey: "B",
        explanation: "Anh trai 20 tuổi \"哥哥今年20岁\" -> Tranh B.",
      },
      {
        id: "hsk1-l04-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "她是谁？",
        promptPinyin: "Tā shì shéi?",
        promptVietnamese: "Cô ấy là ai vậy?",
        options: [
          {key: "A", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"},
          {key: "B", textChinese: "他今年5岁。", textVietnamese: "Cháu năm nay 5 tuổi."},
          {key: "C", textChinese: "我女朋友。", textVietnamese: "Bạn gái của tôi."},
          {key: "D", textChinese: "是的。", textVietnamese: "Đúng vậy."}
        ],
        correctKey: "C",
        explanation: "Hỏi người \"她是谁？\" -> Trả lời \"我女朋友\" (Bạn gái tôi).",
      },
      {
        id: "hsk1-l04-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "你是法国人吗？",
        promptPinyin: "Nǐ shì Fǎguó rén ma?",
        promptVietnamese: "Bạn là người Pháp phải không?",
        options: [
          {key: "A", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"},
          {key: "B", textChinese: "他今年5岁。", textVietnamese: "Cháu năm nay 5 tuổi."},
          {key: "C", textChinese: "我女朋友。", textVietnamese: "Bạn gái của tôi."},
          {key: "D", textChinese: "是的。", textVietnamese: "Đúng vậy."}
        ],
        correctKey: "D",
        explanation: "Hỏi nghi vấn 是...吗 -> Trả lời khẳng định \"是的\" (Đúng vậy).",
      },
      {
        id: "hsk1-l04-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "您儿子多大？",
        promptPinyin: "Nín érzi duō dà?",
        promptVietnamese: "Con trai của bạn bao nhiêu tuổi rồi?",
        options: [
          {key: "A", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"},
          {key: "B", textChinese: "他今年5岁。", textVietnamese: "Cháu năm nay 5 tuổi."},
          {key: "C", textChinese: "我女朋友。", textVietnamese: "Bạn gái của tôi."},
          {key: "D", textChinese: "是的。", textVietnamese: "Đúng vậy."}
        ],
        correctKey: "B",
        explanation: "Hỏi tuổi con trai \"多大？\" -> Trả lời \"他今年5岁\" (Cháu năm nay 5 tuổi).",
      },
      {
        id: "hsk1-l04-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "她工作很（    ）。",
        promptPinyin: "Tā gōngzuò hěn (    ).",
        promptVietnamese: "Công việc của cô ấy rất...",
        options: [
          {key: "A", textChinese: "想 (xiǎng)", textVietnamese: "muốn, nhớ"},
          {key: "B", textChinese: "忙 (máng)", textVietnamese: "bận rộn"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Công việc bận rộn \"工作很忙\" -> Điền 忙 (B).",
      },
      {
        id: "hsk1-l04-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "男：你们好吗？\n女：很好，我们很（    ）你。",
        promptPinyin: "Nán: Nǐmen hǎo ma?\nNǚ: Hěn hǎo, wǒmen hěn (    ) nǐ.",
        promptVietnamese: "Nam: Các bạn khỏe không? / Nữ: Rất khỏe, chúng tôi rất...",
        options: [
          {key: "A", textChinese: "想 (xiǎng)", textVietnamese: "muốn, nhớ"},
          {key: "B", textChinese: "忙 (máng)", textVietnamese: "bận rộn"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Biểu đạt tình cảm \"很想你\" (rất nhớ bạn) -> Điền 想 (A).",
      },
      {
        id: "hsk1-l04-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我家有三口人，爸爸、妈妈和我。",
        promptPinyin: "Wǒ jiā yǒu sān kǒu rén, bàba, māma hé wǒ.",
        promptVietnamese: "Nhà tôi có 3 người: bố, mẹ và tôi.",
        subPrompt: "★ 说话人家里有： (Gia đình người nói có...)",
        options: [
          {key: "A", textChinese: "姐姐", textVietnamese: "Chị gái"},
          {key: "B", textChinese: "三口人", textVietnamese: "Ba người"},
          {key: "C", textChinese: "四口人", textVietnamese: "Bốn người"}
        ],
        correctKey: "B",
        explanation: "Đoạn văn nêu rõ \"我家有三口人\" -> Đáp án B.",
      },
      {
        id: "hsk1-l04-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "她是法国人，我不是。",
        promptPinyin: "Tā shì Fǎguó rén, wǒ bú shì.",
        promptVietnamese: "Cô ấy là người Pháp, tôi không phải.",
        subPrompt: "★ “她”是： (\"Cô ấy\" là...)",
        options: [
          {key: "A", textChinese: "法国人", textVietnamese: "Người Pháp"},
          {key: "B", textChinese: "中国人", textVietnamese: "Người Trung Quốc"},
          {key: "C", textChinese: "泰国人", textVietnamese: "Người Thái Lan"}
        ],
        correctKey: "A",
        explanation: "Cô ấy là người Pháp (她是法国人) -> Đáp án A.",
      }
    ],
  },
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
        id: "hsk1-l05-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Xīngqītiān (chủ nhật)",
        options: [
          {key: "A", textChinese: "日历", textVietnamese: "Tờ lịch để bàn", imageEmoji: "📅"},
          {key: "B", textChinese: "钟表", textVietnamese: "Đồng hồ treo tường", imageEmoji: "⏰"},
          {key: "C", textChinese: "电脑", textVietnamese: "Máy tính xách tay", imageEmoji: "💻"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"星期天\" (Chủ nhật) tương ứng với tờ lịch -> Tranh A.",
      },
      {
        id: "hsk1-l05-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Zuò fàn (nấu cơm)",
        options: [
          {key: "A", textChinese: "做饭", textVietnamese: "Nấu ăn trong bếp", imageEmoji: "🍳"},
          {key: "B", textChinese: "睡觉", textVietnamese: "Ngủ trên giường", imageEmoji: "🛏️"},
          {key: "C", textChinese: "喝水", textVietnamese: "Uống nước", imageEmoji: "🥛"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"做饭\" (nấu cơm) -> Tranh A.",
      },
      {
        id: "hsk1-l05-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Chāoshì (siêu thị)",
        options: [
          {key: "A", textChinese: "超市", textVietnamese: "Đi siêu thị mua đồ", imageEmoji: "🛒"},
          {key: "B", textChinese: "学校", textVietnamese: "Trường học", imageEmoji: "🏫"},
          {key: "C", textChinese: "医院", textVietnamese: "Bệnh viện", imageEmoji: "🏥"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"超市\" (siêu thị) -> Tranh A.",
      },
      {
        id: "hsk1-l05-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Jīntiān jǐ hào? (Hôm nay ngày mấy?)",
        options: [
          {key: "A", textChinese: "10号", textPinyin: "shí hào", textVietnamese: "Ngày 10"},
          {key: "B", textChinese: "星期三", textPinyin: "Xīngqīsān", textVietnamese: "Thứ tư"},
          {key: "C", textChinese: "2026年", textPinyin: "2026 nián", textVietnamese: "Năm 2026"}
        ],
        correctKey: "A",
        explanation: "Hỏi ngày mấy \"几号\" -> Trả lời ngày \"10号\" (ngày 10).",
      },
      {
        id: "hsk1-l05-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ míngtiān shàngbān ma? (Ngày mai bạn có đi làm không?)",
        options: [
          {key: "A", textChinese: "会", textPinyin: "huì", textVietnamese: "Biết"},
          {key: "B", textChinese: "休息", textPinyin: "xiūxi", textVietnamese: "Tôi nghỉ"},
          {key: "C", textChinese: "很好", textPinyin: "hěn hǎo", textVietnamese: "Rất tốt"}
        ],
        correctKey: "B",
        explanation: "Hỏi ngày mai đi làm không -> Trả lời ngày mai nghỉ ngơi (休息).",
      },
      {
        id: "hsk1-l05-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Míngtiān nǐ shàngbān ma? Nǚ: Bú shàngbān, wǒ zài jiā xiūxi.",
        options: [
          {key: "A", textChinese: "Đi làm ở văn phòng", imageEmoji: "💼"},
          {key: "B", textChinese: "Ở nhà nghỉ ngơi thảnh thơi", imageEmoji: "🛋️"},
          {key: "C", textChinese: "Đang nấu cơm", imageEmoji: "🍲"}
        ],
        correctKey: "B",
        explanation: "Người nữ nói ở nhà nghỉ ngơi (在家休息) -> Tranh B.",
      },
      {
        id: "hsk1-l05-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ qù chāoshì mǎi shénme? Nǚ: Wǒ mǎi yìxiē píngguǒ.",
        options: [
          {key: "A", textChinese: "Táo tươi ngon", imageEmoji: "🍎"},
          {key: "B", textChinese: "Máy tính mới", imageEmoji: "💻"},
          {key: "C", textChinese: "Bộ quần áo", imageEmoji: "👗"}
        ],
        correctKey: "A",
        explanation: "Mua táo ở siêu thị (买一些苹果) -> Tranh A.",
      },
      {
        id: "hsk1-l05-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ huì zuò Zhōngguó cài ma? Nǚ: Huì, wǒ huì zuò jīdàn chǎofàn.",
        options: [
          {key: "A", textChinese: "Cơm chiên trứng thơm ngon", imageEmoji: "🍳"},
          {key: "B", textChinese: "Tách cà phê", imageEmoji: "☕"},
          {key: "C", textChinese: "Chai nước lọc", imageEmoji: "🍶"}
        ],
        correctKey: "A",
        explanation: "Biết làm món Trung Quốc là cơm chiên trứng (鸡蛋炒饭) -> Tranh A.",
      },
      {
        id: "hsk1-l05-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Míngtiān 9 yuè 5 hào, wǒ hé péngyou qù chāoshì. (Hỏi: 明天几月几号？)",
        options: [
          {key: "A", textChinese: "9月5号", textPinyin: "9 yuè 5 hào", textVietnamese: "Ngày 5 tháng 9"},
          {key: "B", textChinese: "星期一", textPinyin: "Xīngqīyī", textVietnamese: "Thứ hai"},
          {key: "C", textChinese: "早上", textPinyin: "zǎoshang", textVietnamese: "Buổi sáng"}
        ],
        correctKey: "A",
        explanation: "Ngày mai là ngày 5 tháng 9 (9月5号) -> Đáp án A.",
      },
      {
        id: "hsk1-l05-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Māma jīntiān xiūxi, tā zài jiā zuò fàn ne. (Hỏi: 谁今天休息？)",
        options: [
          {key: "A", textChinese: "妈妈", textPinyin: "māma", textVietnamese: "Mẹ"},
          {key: "B", textChinese: "爸爸", textPinyin: "bàba", textVietnamese: "Bố"},
          {key: "C", textChinese: "姐姐", textPinyin: "jiějie", textVietnamese: "Chị gái"}
        ],
        correctKey: "A",
        explanation: "Người hôm nay được nghỉ là mẹ (妈妈) -> Đáp án A.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l05-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "今天星期五，明天我休息。",
        promptPinyin: "Jīntiān Xīngqīwǔ, míngtiān wǒ xiūxi.",
        promptVietnamese: "Hôm nay thứ sáu, ngày mai tôi được nghỉ.",
        options: [
          {key: "A", textVietnamese: "Tờ lịch để bàn ngày thứ sáu", imageEmoji: "📅"},
          {key: "B", textVietnamese: "Nấu ăn", imageEmoji: "🍳"},
          {key: "C", textVietnamese: "Táo đỏ", imageEmoji: "🍎"}
        ],
        correctKey: "A",
        explanation: "Thứ sáu và ngày nghỉ tương ứng lịch -> Tranh A.",
      },
      {
        id: "hsk1-l05-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "妈妈在厨房做饭呢。",
        promptPinyin: "Māma zài chúfáng zuò fàn ne.",
        promptVietnamese: "Mẹ đang nấu cơm trong bếp.",
        options: [
          {key: "A", textVietnamese: "Tờ lịch", imageEmoji: "📅"},
          {key: "B", textVietnamese: "Mẹ đang đeo tạp dề nấu ăn", imageEmoji: "🍳"},
          {key: "C", textVietnamese: "Táo đỏ", imageEmoji: "🍎"}
        ],
        correctKey: "B",
        explanation: "Mẹ nấu cơm (做饭) -> Tranh B.",
      },
      {
        id: "hsk1-l05-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "这里的苹果真大真甜。",
        promptPinyin: "Zhèlǐ de píngguǒ zhēn dà zhēn tián.",
        promptVietnamese: "Táo ở đây thật to và ngọt.",
        options: [
          {key: "A", textVietnamese: "Tờ lịch", imageEmoji: "📅"},
          {key: "B", textVietnamese: "Nấu ăn", imageEmoji: "🍳"},
          {key: "C", textVietnamese: "Quả táo đỏ mọng", imageEmoji: "🍎"}
        ],
        correctKey: "C",
        explanation: "Táo to ngọt (苹果) -> Tranh C.",
      },
      {
        id: "hsk1-l05-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "你去超市买什么？",
        promptPinyin: "Nǐ qù chāoshì mǎi shénme?",
        promptVietnamese: "Bạn đi siêu thị mua gì thế?",
        options: [
          {key: "A", textChinese: "会一点儿。", textVietnamese: "Biết một chút."},
          {key: "B", textChinese: "今天8号。", textVietnamese: "Hôm nay mùng 8."},
          {key: "C", textChinese: "一些水果。", textVietnamese: "Một ít hoa quả."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi mua gì \"买什么？\" -> Trả lời \"一些水果\" (Một ít hoa quả).",
      },
      {
        id: "hsk1-l05-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "你会做饭吗？",
        promptPinyin: "Nǐ huì zuò fàn ma?",
        promptVietnamese: "Bạn biết nấu cơm không?",
        options: [
          {key: "A", textChinese: "会一点儿。", textVietnamese: "Biết một chút."},
          {key: "B", textChinese: "今天8号。", textVietnamese: "Hôm nay mùng 8."},
          {key: "C", textChinese: "一些水果。", textVietnamese: "Một ít hoa quả."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi kỹ năng \"你会...吗？\" -> Trả lời \"会一点儿\" (Biết một chút).",
      },
      {
        id: "hsk1-l05-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "今天几号？",
        promptPinyin: "Jīntiān jǐ hào?",
        promptVietnamese: "Hôm nay ngày mấy?",
        options: [
          {key: "A", textChinese: "会一点儿。", textVietnamese: "Biết một chút."},
          {key: "B", textChinese: "今天8号。", textVietnamese: "Hôm nay mùng 8."},
          {key: "C", textChinese: "一些水果。", textVietnamese: "Một ít hoa quả."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi ngày tháng \"今天几号？\" -> Trả lời \"今天8号\" (Hôm nay ngày 8).",
      },
      {
        id: "hsk1-l05-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "今天（    ）号？",
        promptPinyin: "Jīntiān (    ) hào?",
        promptVietnamese: "Hôm nay ngày mấy?",
        options: [
          {key: "A", textChinese: "几 (jǐ)", textVietnamese: "mấy"},
          {key: "B", textChinese: "好看 (hǎokàn)", textVietnamese: "đẹp"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Hỏi ngày trong tháng \"几号\" -> Điền 几 (A).",
      },
      {
        id: "hsk1-l05-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "男：你的新电脑真（    ）！\n女：谢谢，我也很喜欢。",
        promptPinyin: "Nán: Nǐ de xīn diànnǎo zhēn (    )!\nNǚ: Xièxie, wǒ yě hěn xǐhuan.",
        promptVietnamese: "Nam: Máy tính mới của bạn thật đẹp! / Nữ: Cảm ơn, mình cũng rất thích.",
        options: [
          {key: "A", textChinese: "几 (jǐ)", textVietnamese: "mấy"},
          {key: "B", textChinese: "好看 (hǎokàn)", textVietnamese: "đẹp"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Khen máy tính đẹp \"真好看\" -> Điền 好看 (B).",
      },
      {
        id: "hsk1-l05-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我非常喜欢我的中文名字。",
        promptPinyin: "Wǒ fēicháng xǐhuan wǒ de Zhōngwén míngzi.",
        promptVietnamese: "Tôi rất thích tên tiếng Trung của tôi.",
        subPrompt: "★ 说话人喜欢什么？ (Người nói thích cái gì?)",
        options: [
          {key: "A", textChinese: "新电脑", textVietnamese: "Máy tính mới"},
          {key: "B", textChinese: "中国菜", textVietnamese: "Món ăn Trung Quốc"},
          {key: "C", textChinese: "中文名字", textVietnamese: "Tên tiếng Trung"}
        ],
        correctKey: "C",
        explanation: "Người nói thích tên tiếng Trung của mình (中文名字) -> Đáp án C.",
      },
      {
        id: "hsk1-l05-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "今天8号，你几号休息？",
        promptPinyin: "Jīntiān 8 hào, nǐ jǐ hào xiūxi?",
        promptVietnamese: "Hôm nay ngày 8, bạn ngày mấy được nghỉ?",
        subPrompt: "★ 说话人想知道什么？ (Người nói muốn biết điều gì?)",
        options: [
          {key: "A", textChinese: "今天几号", textVietnamese: "Hôm nay ngày mấy"},
          {key: "B", textChinese: "哪天休息", textVietnamese: "Ngày nào được nghỉ"},
          {key: "C", textChinese: "星期几上班", textVietnamese: "Thứ mấy đi làm"}
        ],
        correctKey: "B",
        explanation: "Người nói muốn biết bạn ngày nào nghỉ (几号休息 -> 哪天休息) -> Đáp án B.",
      }
    ],
  },
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
        id: "hsk1-l06-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Shǒujī (điện thoại di động)",
        options: [
          {key: "A", textChinese: "手机", textVietnamese: "Điện thoại di động", imageEmoji: "📱"},
          {key: "B", textChinese: "电脑", textVietnamese: "Máy tính", imageEmoji: "💻"},
          {key: "C", textChinese: "书本", textVietnamese: "Cuốn sách", imageEmoji: "📖"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"手机\" (điện thoại di động) -> Tranh A.",
      },
      {
        id: "hsk1-l06-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Dǎ diànhuà (gọi điện thoại)",
        options: [
          {key: "A", textChinese: "打电话", textVietnamese: "Gọi điện thoại", imageEmoji: "📞"},
          {key: "B", textChinese: "写字", textVietnamese: "Viết chữ", imageEmoji: "✍️"},
          {key: "C", textChinese: "喝茶", textVietnamese: "Uống trà", imageEmoji: "🍵"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"打电话\" (gọi điện thoại) -> Tranh A.",
      },
      {
        id: "hsk1-l06-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Fángjiān (căn phòng)",
        options: [
          {key: "A", textChinese: "房间", textVietnamese: "Căn phòng ấm cúng", imageEmoji: "🏠"},
          {key: "B", textChinese: "医院", textVietnamese: "Bệnh viện", imageEmoji: "🏥"},
          {key: "C", textChinese: "学校", textVietnamese: "Trường học", imageEmoji: "🏫"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"房间\" (căn phòng) -> Tranh A.",
      },
      {
        id: "hsk1-l06-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ de shǒujīhào shì duōshao? (Số điện thoại của bạn là bao nhiêu?)",
        options: [
          {key: "A", textChinese: "13812345678", textPinyin: "138...", textVietnamese: "Dãy số điện thoại"},
          {key: "B", textChinese: "808房间", textPinyin: "808 fángjiān", textVietnamese: "Phòng 808"},
          {key: "C", textChinese: "3个人", textPinyin: "3 gè rén", textVietnamese: "3 người"}
        ],
        correctKey: "A",
        explanation: "Hỏi số điện thoại -> Trả lời dãy số điện thoại (A).",
      },
      {
        id: "hsk1-l06-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Lǐ lǎoshī zài fángjiān li ma? (Thầy Lý có trong phòng không?)",
        options: [
          {key: "A", textChinese: "他在上课。", textPinyin: "Tā zài shàngkè.", textVietnamese: "Thầy đang lên lớp."},
          {key: "B", textChinese: "很小。", textPinyin: "Hěn xiǎo.", textVietnamese: "Rất nhỏ."},
          {key: "C", textChinese: "不是。", textPinyin: "Bú shì.", textVietnamese: "Không phải."}
        ],
        correctKey: "A",
        explanation: "Hỏi vị trí của thầy -> Trả lời thầy đang lên lớp (他在上课).",
      },
      {
        id: "hsk1-l06-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Qǐngwèn, zhè shì nǐ de shǒujī ma? Nǚ: Bú shì, zhè shì Wáng xiānsheng de.",
        options: [
          {key: "A", textChinese: "Chiếc điện thoại di động màu đen", imageEmoji: "📱"},
          {key: "B", textChinese: "Máy tính bảng", imageEmoji: "💻"},
          {key: "C", textChinese: "Chiếc cốc uống nước", imageEmoji: "🥛"}
        ],
        correctKey: "A",
        explanation: "Nội dung nói về chiếc điện thoại (手机) -> Tranh A.",
      },
      {
        id: "hsk1-l06-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ zhù zài nǎr? Nǚ: Wǒ zhù zài 502 fángjiān.",
        options: [
          {key: "A", textChinese: "Cửa phòng có số 502", imageEmoji: "🚪"},
          {key: "B", textChinese: "Cổng trường", imageEmoji: "🏫"},
          {key: "C", textChinese: "Bến xe buýt", imageEmoji: "🚏"}
        ],
        correctKey: "A",
        explanation: "Sống ở phòng 502 (502房间) -> Tranh A.",
      },
      {
        id: "hsk1-l06-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Wèi, nǐ zài zuò shénme ne? Nǚ: Wǒ zài dǎ diànhuà gěi māma ne.",
        options: [
          {key: "A", textChinese: "Cô gái vui vẻ gọi điện cho mẹ", imageEmoji: "📞"},
          {key: "B", textChinese: "Ăn cơm trưa", imageEmoji: "🍚"},
          {key: "C", textChinese: "Xem phim", imageEmoji: "🎬"}
        ],
        correctKey: "A",
        explanation: "Đang gọi điện cho mẹ (打电话) -> Tranh A.",
      },
      {
        id: "hsk1-l06-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wǒ de diànhuàhào shì 88236688. (Hỏi: 他的电话号是多少？)",
        options: [
          {key: "A", textChinese: "88236688", textPinyin: "88236688", textVietnamese: "88236688"},
          {key: "B", textChinese: "88326688", textPinyin: "88326688", textVietnamese: "88326688"},
          {key: "C", textChinese: "88236868", textPinyin: "88236868", textVietnamese: "88236868"}
        ],
        correctKey: "A",
        explanation: "Số điện thoại nghe được là 88236688 -> Đáp án A.",
      },
      {
        id: "hsk1-l06-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Zhāng yīshēng bú zài 301 fángjiān, tā zài 305. (Hỏi: 张医生在哪个房间？)",
        options: [
          {key: "A", textChinese: "301", textPinyin: "301", textVietnamese: "301"},
          {key: "B", textChinese: "305", textPinyin: "305", textVietnamese: "305"},
          {key: "C", textChinese: "308", textPinyin: "308", textVietnamese: "308"}
        ],
        correctKey: "B",
        explanation: "Bác sĩ Trương ở phòng 305 (在305) -> Đáp án B.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l06-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "请问，这是李老师的电话吗？",
        promptPinyin: "Qǐngwèn, zhè shì Lǐ lǎoshī de diànhuà ma?",
        promptVietnamese: "Xin hỏi, đây có phải số điện thoại của thầy Lý không?",
        options: [
          {key: "A", textVietnamese: "Điện thoại bàn liên lạc", imageEmoji: "📞"},
          {key: "B", textVietnamese: "Căn phòng", imageEmoji: "🚪"},
          {key: "C", textVietnamese: "Sách vở", imageEmoji: "📖"}
        ],
        correctKey: "A",
        explanation: "Nói về số điện thoại (电话) -> Tranh A.",
      },
      {
        id: "hsk1-l06-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "我的手机在桌子上呢。",
        promptPinyin: "Wǒ de shǒujī zài zhuōzi shang ne.",
        promptVietnamese: "Điện thoại của tôi ở trên bàn.",
        options: [
          {key: "A", textVietnamese: "Điện thoại di động đặt trên bàn", imageEmoji: "📱"},
          {key: "B", textVietnamese: "Căn phòng", imageEmoji: "🚪"},
          {key: "C", textVietnamese: "Sách vở", imageEmoji: "📖"}
        ],
        correctKey: "A",
        explanation: "Điện thoại ở trên bàn (手机在桌子上) -> Tranh A.",
      },
      {
        id: "hsk1-l06-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "808房间在八楼。",
        promptPinyin: "808 fángjiān zài bā lóu.",
        promptVietnamese: "Phòng 808 ở trên tầng tám.",
        options: [
          {key: "A", textVietnamese: "Điện thoại", imageEmoji: "📞"},
          {key: "B", textVietnamese: "Cửa phòng có số phòng", imageEmoji: "🚪"},
          {key: "C", textVietnamese: "Sách", imageEmoji: "📖"}
        ],
        correctKey: "B",
        explanation: "Phòng 808 (808房间) -> Tranh B.",
      },
      {
        id: "hsk1-l06-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "你的手机号是多少？",
        promptPinyin: "Nǐ de shǒujīhào shì duōshao?",
        promptVietnamese: "Số điện thoại của bạn là bao nhiêu?",
        options: [
          {key: "A", textChinese: "他是我的同学。", textVietnamese: "Anh ấy là bạn học của tôi."},
          {key: "B", textChinese: "13912345678。", textVietnamese: "13912345678."},
          {key: "C", textChinese: "他去上课了。", textVietnamese: "Thầy đi lên lớp rồi."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi số điện thoại -> Đáp án B (13912345678).",
      },
      {
        id: "hsk1-l06-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "李老师在房间里吗？",
        promptPinyin: "Lǐ lǎoshī zài fángjiān li ma?",
        promptVietnamese: "Thầy Lý có trong phòng không?",
        options: [
          {key: "A", textChinese: "他是我的同学。", textVietnamese: "Anh ấy là bạn học của tôi."},
          {key: "B", textChinese: "13912345678。", textVietnamese: "13912345678."},
          {key: "C", textChinese: "他不在，他去上课了。", textVietnamese: "Thầy không có ở đây, thầy đi lên lớp rồi."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi thầy Lý trong phòng không -> Trả lời thầy đi lên lớp rồi (C).",
      },
      {
        id: "hsk1-l06-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你认识他吗？",
        promptPinyin: "Nǐ rènshi tā ma?",
        promptVietnamese: "Bạn có quen biết anh ấy không?",
        options: [
          {key: "A", textChinese: "认识，他是我的同学。", textVietnamese: "Quen chứ, anh ấy là bạn học của tôi."},
          {key: "B", textChinese: "13912345678。", textVietnamese: "13912345678."},
          {key: "C", textChinese: "他去上课了。", textVietnamese: "Thầy đi lên lớp rồi."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi quen biết không \"你认识他吗？\" -> Trả lời \"认识，他是我的同学\" (A).",
      },
      {
        id: "hsk1-l06-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "请问，你的（    ）号是多少？",
        promptPinyin: "Qǐngwèn, nǐ de (    ) hào shì duōshao?",
        promptVietnamese: "Xin hỏi, số... của bạn là bao nhiêu?",
        options: [
          {key: "A", textChinese: "电话 (diànhuà)", textVietnamese: "điện thoại"},
          {key: "B", textChinese: "房间 (fángjiān)", textVietnamese: "phòng"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Hỏi số điện thoại \"电话号\" -> Điền 电话 (A).",
      },
      {
        id: "hsk1-l06-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "我不知道李老师住在哪个（    ）。",
        promptPinyin: "Wǒ bù zhīdào Lǐ lǎoshī zhù zài nǎge (    ).",
        promptVietnamese: "Tôi không biết thầy Lý ở phòng nào.",
        options: [
          {key: "A", textChinese: "电话 (diànhuà)", textVietnamese: "điện thoại"},
          {key: "B", textChinese: "房间 (fángjiān)", textVietnamese: "phòng"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Ở phòng nào \"住在哪个房间\" -> Điền 房间 (B).",
      },
      {
        id: "hsk1-l06-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我爸爸是医生，他的电话经常响。",
        promptPinyin: "Wǒ bàba shì yīshēng, tā de diànhuà jīngcháng xiǎng.",
        promptVietnamese: "Bố tôi là bác sĩ, điện thoại của ông ấy thường xuyên reo chuông.",
        subPrompt: "★ 爸爸的电话： (Điện thoại của bố...)",
        options: [
          {key: "A", textChinese: "经常响", textVietnamese: "Thường reo"},
          {key: "B", textChinese: "坏了", textVietnamese: "Bị hỏng rồi"},
          {key: "C", textChinese: "不见了", textVietnamese: "Bị mất rồi"}
        ],
        correctKey: "A",
        explanation: "Điện thoại thường xuyên reo (经常响) -> Đáp án A.",
      },
      {
        id: "hsk1-l06-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "这是王老师的手机，不是李老师的。",
        promptPinyin: "Zhè shì Wáng lǎoshī de shǒujī, bú shì Lǐ lǎoshī de.",
        promptVietnamese: "Đây là điện thoại của thầy Vương, không phải của thầy Lý.",
        subPrompt: "★ 这部手机是谁的？ (Chiếc điện thoại này của ai?)",
        options: [
          {key: "A", textChinese: "李老师", textVietnamese: "Thầy Lý"},
          {key: "B", textChinese: "王老师", textVietnamese: "Thầy Vương"},
          {key: "C", textChinese: "张医生", textVietnamese: "Bác sĩ Trương"}
        ],
        correctKey: "B",
        explanation: "Điện thoại là của thầy Vương (王老师的手机) -> Đáp án B.",
      }
    ],
  },
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
        id: "hsk1-l07-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Liù diǎn bàn (6 rưỡi)",
        options: [
          {key: "A", textChinese: "6:30", textVietnamese: "Đồng hồ chỉ 6:30", imageEmoji: "🕡"},
          {key: "B", textChinese: "8:00", textVietnamese: "Đồng hồ chỉ 8:00", imageEmoji: "🕗"},
          {key: "C", textChinese: "12:00", textVietnamese: "Đồng hồ chỉ 12:00", imageEmoji: "🕛"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là 6 giờ rưỡi (六点半) -> Tranh A.",
      },
      {
        id: "hsk1-l07-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Xiàbān (tan làm)",
        options: [
          {key: "A", textChinese: "上班", textVietnamese: "Đi làm", imageEmoji: "🏢"},
          {key: "B", textChinese: "下班", textVietnamese: "Tan làm xách cặp về", imageEmoji: "🚶"},
          {key: "C", textChinese: "吃饭", textVietnamese: "Ăn cơm", imageEmoji: "🍚"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"下班\" (tan làm) -> Tranh B.",
      },
      {
        id: "hsk1-l07-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Pǎobù (chạy bộ thể dục)",
        options: [
          {key: "A", textChinese: "跑步", textVietnamese: "Chạy bộ thể dục", imageEmoji: "🏃"},
          {key: "B", textChinese: "看电视", textVietnamese: "Xem tivi", imageEmoji: "📺"},
          {key: "C", textChinese: "睡觉", textVietnamese: "Đi ngủ", imageEmoji: "🛌"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"跑步\" (chạy bộ) -> Tranh A.",
      },
      {
        id: "hsk1-l07-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ jǐ diǎn xiàbān? (Bạn mấy giờ tan làm?)",
        options: [
          {key: "A", textChinese: "6点半", textPinyin: "6 diǎn bàn", textVietnamese: "6 giờ rưỡi"},
          {key: "B", textChinese: "晚上", textPinyin: "wǎnshang", textVietnamese: "Buổi tối"},
          {key: "C", textChinese: "星期天", textPinyin: "Xīngqītiān", textVietnamese: "Chủ nhật"}
        ],
        correctKey: "A",
        explanation: "Hỏi mấy giờ \"几点\" -> Trả lời giờ cụ thể \"6点半\" (6 rưỡi).",
      },
      {
        id: "hsk1-l07-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ xiànzài zài nǎr? (Bây giờ bạn đang ở đâu?)",
        options: [
          {key: "A", textChinese: "在家", textPinyin: "zài jiā", textVietnamese: "Ở nhà"},
          {key: "B", textChinese: "很好", textPinyin: "hěn hǎo", textVietnamese: "Rất tốt"},
          {key: "C", textChinese: "去吧", textPinyin: "qù ba", textVietnamese: "Đi thôi"}
        ],
        correctKey: "A",
        explanation: "Hỏi ở đâu \"在哪儿\" -> Trả lời nơi chốn \"在家\" (ở nhà).",
      },
      {
        id: "hsk1-l07-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ jǐ diǎn chī zǎofàn? Nǚ: Wǒ měitiān qī diǎn chī zǎofàn.",
        options: [
          {key: "A", textChinese: "7:00 sáng ăn sáng", imageEmoji: "🥣"},
          {key: "B", textChinese: "12:00 trưa", imageEmoji: "🍱"},
          {key: "C", textChinese: "6:00 chiều", imageEmoji: "🍲"}
        ],
        correctKey: "A",
        explanation: "7 giờ ăn sáng (七点吃早饭) -> Tranh A.",
      },
      {
        id: "hsk1-l07-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Wǎnshang nǐmen zuò shénme? Nǚ: Wǒmen yìqǐ kàn diànshì.",
        options: [
          {key: "A", textChinese: "Gia đình cùng xem tivi", imageEmoji: "📺"},
          {key: "B", textChinese: "Đi bơi lội", imageEmoji: "🏊"},
          {key: "C", textChinese: "Đi siêu thị", imageEmoji: "🛒"}
        ],
        correctKey: "A",
        explanation: "Cùng nhau xem tivi (一起看电视) -> Tranh A.",
      },
      {
        id: "hsk1-l07-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ jǐ diǎn shuìjiào? Nǚ: Wǒ shí diǎn bàn shuìjiào.",
        options: [
          {key: "A", textChinese: "10:30 đêm ngủ say", imageEmoji: "😴"},
          {key: "B", textChinese: "Đọc sách", imageEmoji: "📖"},
          {key: "C", textChinese: "Làm việc", imageEmoji: "💻"}
        ],
        correctKey: "A",
        explanation: "10 giờ rưỡi đi ngủ (十点半睡觉) -> Tranh A.",
      },
      {
        id: "hsk1-l07-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wǒ měitiān zǎoshang qī diǎn qǐchuáng. (Hỏi: 说话人几点起床？)",
        options: [
          {key: "A", textChinese: "6点", textPinyin: "liù diǎn", textVietnamese: "6 giờ"},
          {key: "B", textChinese: "7点", textPinyin: "qī diǎn", textVietnamese: "7 giờ"},
          {key: "C", textChinese: "8点", textPinyin: "bā diǎn", textVietnamese: "8 giờ"}
        ],
        correctKey: "B",
        explanation: "Mỗi sáng 7 giờ thức dậy (七点起床) -> Đáp án B.",
      },
      {
        id: "hsk1-l07-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Bàba wǎnshang liù diǎn bàn xiàbān huí jiā. (Hỏi: 爸爸几点下班？)",
        options: [
          {key: "A", textChinese: "6点半", textPinyin: "liù diǎn bàn", textVietnamese: "6 giờ rưỡi"},
          {key: "B", textChinese: "7点半", textPinyin: "qī diǎn bàn", textVietnamese: "7 giờ rưỡi"},
          {key: "C", textChinese: "8点", textPinyin: "bā diǎn", textVietnamese: "8 giờ"}
        ],
        correctKey: "A",
        explanation: "Bố 6 giờ rưỡi tan làm (六点半下班) -> Đáp án A.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l07-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "我爸爸每天早上七点去上班。",
        promptPinyin: "Wǒ bàba měitiān zǎoshang qī diǎn qù shàngbān.",
        promptVietnamese: "Bố tôi mỗi sáng 7 giờ đi làm.",
        options: [
          {key: "A", textVietnamese: "Bố đi làm vào buổi sáng", imageEmoji: "💼"},
          {key: "B", textVietnamese: "Xem tivi", imageEmoji: "📺"},
          {key: "C", textVietnamese: "Đồng hồ", imageEmoji: "⏰"}
        ],
        correctKey: "A",
        explanation: "Bố đi làm (去上班) -> Tranh A.",
      },
      {
        id: "hsk1-l07-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "晚上我们全家一起看电视。",
        promptPinyin: "Wǎnshang wǒmen quán jiā yìqǐ kàn diànshì.",
        promptVietnamese: "Buổi tối cả nhà chúng tôi cùng xem tivi.",
        options: [
          {key: "A", textVietnamese: "Đi làm", imageEmoji: "💼"},
          {key: "B", textVietnamese: "Cả nhà quây quần xem tivi", imageEmoji: "📺"},
          {key: "C", textVietnamese: "Đồng hồ", imageEmoji: "⏰"}
        ],
        correctKey: "B",
        explanation: "Cùng xem tivi (看电视) -> Tranh B.",
      },
      {
        id: "hsk1-l07-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "现在是下午三点半。",
        promptPinyin: "Xiànzài shì xiàwǔ sān diǎn bàn.",
        promptVietnamese: "Bây giờ là 3 giờ rưỡi chiều.",
        options: [
          {key: "A", textVietnamese: "Đi làm", imageEmoji: "💼"},
          {key: "B", textVietnamese: "Xem tivi", imageEmoji: "📺"},
          {key: "C", textVietnamese: "Đồng hồ hiển thị 3:30", imageEmoji: "⏰"}
        ],
        correctKey: "C",
        explanation: "Đồng hồ chỉ thời gian (三点半) -> Tranh C.",
      },
      {
        id: "hsk1-l07-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "你几点下班？",
        promptPinyin: "Nǐ jǐ diǎn xiàbān?",
        promptVietnamese: "Bạn mấy giờ tan làm?",
        options: [
          {key: "A", textChinese: "晚上六点半。", textVietnamese: "6 giờ rưỡi tối."},
          {key: "B", textChinese: "面包和牛奶。", textVietnamese: "Bánh mì và sữa."},
          {key: "C", textChinese: "他正在睡觉呢。", textVietnamese: "Anh ấy đang ngủ."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi mấy giờ tan làm -> Đáp án A (晚上六点半).",
      },
      {
        id: "hsk1-l07-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "你早上吃什么？",
        promptPinyin: "Nǐ zǎoshang chī shénme?",
        promptVietnamese: "Buổi sáng bạn ăn gì?",
        options: [
          {key: "A", textChinese: "晚上六点半。", textVietnamese: "6 giờ rưỡi tối."},
          {key: "B", textChinese: "面包和牛奶。", textVietnamese: "Bánh mì và sữa bò."},
          {key: "C", textChinese: "他正在睡觉呢。", textVietnamese: "Anh ấy đang ngủ."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi ăn gì sáng \"吃什么？\" -> Đáp án B (面包和牛奶).",
      },
      {
        id: "hsk1-l07-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "他现在在做什么？",
        promptPinyin: "Tā xiànzài zài zuò shénme?",
        promptVietnamese: "Bây giờ anh ấy đang làm gì?",
        options: [
          {key: "A", textChinese: "晚上六点半。", textVietnamese: "6 giờ rưỡi tối."},
          {key: "B", textChinese: "面包和牛奶。", textVietnamese: "Bánh mì và sữa."},
          {key: "C", textChinese: "他正在睡觉呢。", textVietnamese: "Anh ấy đang ngủ."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi đang làm gì \"在做什么？\" -> Đáp án C (他正在睡觉呢).",
      },
      {
        id: "hsk1-l07-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "我明天下午两（    ）半有课。",
        promptPinyin: "Wǒ míngtiān xiàwǔ liǎng (    ) bàn yǒu kè.",
        promptVietnamese: "Chiều mai tôi có tiết học lúc 2 rưỡi.",
        options: [
          {key: "A", textChinese: "点 (diǎn)", textVietnamese: "giờ"},
          {key: "B", textChinese: "下班 (xiàbān)", textVietnamese: "tan làm"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Chỉ giờ giấc \"两点半\" -> Điền 点 (A).",
      },
      {
        id: "hsk1-l07-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "他每天晚上都（    ）很晚。",
        promptPinyin: "Tā měitiān wǎnshang dōu (    ) hěn wǎn.",
        promptVietnamese: "Anh ấy mỗi tối đều tan làm rất muộn.",
        options: [
          {key: "A", textChinese: "点 (diǎn)", textVietnamese: "giờ"},
          {key: "B", textChinese: "下班 (xiàbān)", textVietnamese: "tan làm"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Tan làm muộn \"下班很晚\" -> Điền 下班 (B).",
      },
      {
        id: "hsk1-l07-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我每天早上六点起床，七点吃早饭，八点去上学。",
        promptPinyin: "Wǒ měitiān zǎoshang liù diǎn qǐchuáng, qī diǎn chī zǎofàn, bā diǎn qù shàngxué.",
        promptVietnamese: "Tôi mỗi sáng 6 giờ dậy, 7 giờ ăn sáng, 8 giờ đi học.",
        subPrompt: "★ 说话人几点去上学？ (Người nói mấy giờ đi học?)",
        options: [
          {key: "A", textChinese: "六点", textVietnamese: "6 giờ"},
          {key: "B", textChinese: "七点", textVietnamese: "7 giờ"},
          {key: "C", textChinese: "八点", textVietnamese: "8 giờ"}
        ],
        correctKey: "C",
        explanation: "8 giờ đi học (八点去上学) -> Đáp án C.",
      },
      {
        id: "hsk1-l07-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "哥哥今天晚上八点才下班回家。",
        promptPinyin: "Gēge jīntiān wǎnshang bā diǎn cái xiàbān huí jiā.",
        promptVietnamese: "Anh trai tối nay 8 giờ mới tan làm về nhà.",
        subPrompt: "★ 哥哥什么时候回家？ (Anh trai khi nào về nhà?)",
        options: [
          {key: "A", textChinese: "晚上八点", textVietnamese: "8 giờ tối"},
          {key: "B", textChinese: "下午两点", textVietnamese: "2 giờ chiều"},
          {key: "C", textChinese: "早上七点", textVietnamese: "7 giờ sáng"}
        ],
        correctKey: "A",
        explanation: "8 giờ tối mới tan làm về nhà (晚上八点) -> Đáp án A.",
      }
    ],
  },
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
        id: "hsk1-l08-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Yīyuàn (bệnh viện)",
        options: [
          {key: "A", textChinese: "医院", textVietnamese: "Bệnh viện chữ thập đỏ", imageEmoji: "🏥"},
          {key: "B", textChinese: "学校", textVietnamese: "Trường học", imageEmoji: "🏫"},
          {key: "C", textChinese: "超市", textVietnamese: "Siêu thị", imageEmoji: "🛒"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"医院\" (bệnh viện) -> Tranh A.",
      },
      {
        id: "hsk1-l08-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Yīshēng (bác sĩ)",
        options: [
          {key: "A", textChinese: "医生", textVietnamese: "Bác sĩ áo blouse", imageEmoji: "👨‍⚕️"},
          {key: "B", textChinese: "老师", textVietnamese: "Giáo viên", imageEmoji: "👩‍🏫"},
          {key: "C", textChinese: "司机", textVietnamese: "Tài xế", imageEmoji: "🚕"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"医生\" (bác sĩ) -> Tranh A.",
      },
      {
        id: "hsk1-l08-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ/cụm từ và chọn hình ảnh phù hợp:",
        audioScript: "Kànbìng (khám bệnh)",
        options: [
          {key: "A", textChinese: "看病", textVietnamese: "Bác sĩ đang khám bệnh cho bệnh nhân", imageEmoji: "🩺"},
          {key: "B", textChinese: "买药", textVietnamese: "Mua thuốc", imageEmoji: "💊"},
          {key: "C", textChinese: "跑步", textVietnamese: "Chạy bộ", imageEmoji: "🏃"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"看病\" (khám bệnh) -> Tranh A.",
      },
      {
        id: "hsk1-l08-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ bàba zài nǎr gōngzuò? (Bố bạn làm việc ở đâu?)",
        options: [
          {key: "A", textChinese: "在医院", textPinyin: "zài yīyuàn", textVietnamese: "Ở bệnh viện"},
          {key: "B", textChinese: "是医生", textPinyin: "shì yīshēng", textVietnamese: "Là bác sĩ"},
          {key: "C", textChinese: "很好", textPinyin: "hěn hǎo", textVietnamese: "Rất tốt"}
        ],
        correctKey: "A",
        explanation: "Hỏi nơi làm việc \"在哪儿工作\" -> Trả lời \"在医院\" (ở bệnh viện).",
      },
      {
        id: "hsk1-l08-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Tā shì yīshēng ma? (Cô ấy là bác sĩ phải không?)",
        options: [
          {key: "A", textChinese: "是的，她是医生。", textPinyin: "Shì de, tā shì yīshēng.", textVietnamese: "Đúng vậy, cô ấy là bác sĩ."},
          {key: "B", textChinese: "在看病。", textPinyin: "Zài kànbìng.", textVietnamese: "Đang khám bệnh."},
          {key: "C", textChinese: "很大。", textPinyin: "Hěn dà.", textVietnamese: "Rất to."}
        ],
        correctKey: "A",
        explanation: "Khẳng định nghề nghiệp -> Đáp án A.",
      },
      {
        id: "hsk1-l08-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ māma yě zài zhège yīyuàn ma? Nǚ: Shì de, tā yě shì yīshēng.",
        options: [
          {key: "A", textChinese: "Nữ bác sĩ vui vẻ", imageEmoji: "👩‍⚕️"},
          {key: "B", textChinese: "Học sinh đi học", imageEmoji: "🎒"},
          {key: "C", textChinese: "Đầu bếp", imageEmoji: "👨‍🍳"}
        ],
        correctKey: "A",
        explanation: "Mẹ cũng là bác sĩ ở bệnh viện (也是医生) -> Tranh A.",
      },
      {
        id: "hsk1-l08-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Nǐ qù nǎr? Nǚ: Wǒ qù yīyuàn kàn péngyou.",
        options: [
          {key: "A", textChinese: "Đến bệnh viện thăm bạn", imageEmoji: "🏥"},
          {key: "B", textChinese: "Đến quán ăn", imageEmoji: "🍜"},
          {key: "C", textChinese: "Đến công viên", imageEmoji: "🌳"}
        ],
        correctKey: "A",
        explanation: "Đi bệnh viện thăm bạn (去医院) -> Tranh A.",
      },
      {
        id: "hsk1-l08-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn đáp án phù hợp:",
        audioScript: "Nán: Jīntiān yīyuàn rén duō ma? Nǚ: Hěn duō, dàjiā dōu lái kànbìng.",
        options: [
          {key: "A", textChinese: "Bệnh nhân chờ khám bệnh", imageEmoji: "🩺"},
          {key: "B", textChinese: "Sân bóng đá", imageEmoji: "⚽"},
          {key: "C", textChinese: "Phòng ngủ", imageEmoji: "🛏️"}
        ],
        correctKey: "A",
        explanation: "Đông người đến khám bệnh (来看病) -> Tranh A.",
      },
      {
        id: "hsk1-l08-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wǒ bàba zài Běijīng de yīyuàn gōngzuò. (Hỏi: 爸爸在哪儿工作？)",
        options: [
          {key: "A", textChinese: "医院", textPinyin: "yīyuàn", textVietnamese: "Bệnh viện"},
          {key: "B", textChinese: "学校", textPinyin: "xuéxiào", textVietnamese: "Trường học"},
          {key: "C", textChinese: "公司", textPinyin: "gōngsī", textVietnamese: "Công ty"}
        ],
        correctKey: "A",
        explanation: "Bố làm việc ở bệnh viện (医院) -> Đáp án A.",
      },
      {
        id: "hsk1-l08-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wáng yīshēng jīnnián 45 suì le. (Hỏi: 王医生多大？)",
        options: [
          {key: "A", textChinese: "35岁", textPinyin: "35 suì", textVietnamese: "35 tuổi"},
          {key: "B", textChinese: "45岁", textPinyin: "45 suì", textVietnamese: "45 tuổi"},
          {key: "C", textChinese: "50岁", textPinyin: "50 suì", textVietnamese: "50 tuổi"}
        ],
        correctKey: "B",
        explanation: "Bác sĩ Vương 45 tuổi (45岁) -> Đáp án B.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l08-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "我妈妈是这家医院的医生。",
        promptPinyin: "Wǒ māma shì zhè jiā yīyuàn de yīshēng.",
        promptVietnamese: "Mẹ tôi là bác sĩ của bệnh viện này.",
        options: [
          {key: "A", textVietnamese: "Bác sĩ khám chữa bệnh", imageEmoji: "👩‍⚕️"},
          {key: "B", textVietnamese: "Trường học", imageEmoji: "🏫"},
          {key: "C", textVietnamese: "Thuốc uống", imageEmoji: "💊"}
        ],
        correctKey: "A",
        explanation: "Bác sĩ bệnh viện (医生) -> Tranh A.",
      },
      {
        id: "hsk1-l08-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "哥哥在大学里学习汉语。",
        promptPinyin: "Gēge zài dàxué li xuéxí Hànyǔ.",
        promptVietnamese: "Anh trai học tiếng Hán ở trường đại học.",
        options: [
          {key: "A", textVietnamese: "Bác sĩ", imageEmoji: "👩‍⚕️"},
          {key: "B", textVietnamese: "Giảng đường đại học", imageEmoji: "🏫"},
          {key: "C", textVietnamese: "Thuốc", imageEmoji: "💊"}
        ],
        correctKey: "B",
        explanation: "Học tiếng Hán ở đại học (在大学里学习) -> Tranh B.",
      },
      {
        id: "hsk1-l08-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "医生说他明天就可以出院了。",
        promptPinyin: "Yīshēng shuō tā míngtiān jiù kěyǐ chūyuàn le.",
        promptVietnamese: "Bác sĩ nói anh ấy ngày mai có thể xuất viện rồi.",
        options: [
          {key: "A", textVietnamese: "Bác sĩ", imageEmoji: "👩‍⚕️"},
          {key: "B", textVietnamese: "Đại học", imageEmoji: "🏫"},
          {key: "C", textVietnamese: "Bệnh viện xuất viện", imageEmoji: "🏥"}
        ],
        correctKey: "C",
        explanation: "Xuất viện (出院) -> Tranh C.",
      },
      {
        id: "hsk1-l08-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "你爸爸在哪儿工作？",
        promptPinyin: "Nǐ bàba zài nǎr gōngzuò?",
        promptVietnamese: "Bố bạn làm việc ở đâu?",
        options: [
          {key: "A", textChinese: "他在医院工作。", textVietnamese: "Bố làm việc ở bệnh viện."},
          {key: "B", textChinese: "不，他是护士。", textVietnamese: "Không, anh ấy là y tá."},
          {key: "C", textChinese: "我身体有点儿不舒服。", textVietnamese: "Tôi hơi khó chịu trong người."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi nơi làm việc -> Đáp án A (他在医院工作).",
      },
      {
        id: "hsk1-l08-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "他也是医生吗？",
        promptPinyin: "Tā yě shì yīshēng ma?",
        promptVietnamese: "Anh ấy cũng là bác sĩ à?",
        options: [
          {key: "A", textChinese: "他在医院工作。", textVietnamese: "Bố làm việc ở bệnh viện."},
          {key: "B", textChinese: "不，他是护士。", textVietnamese: "Không, anh ấy là y tá."},
          {key: "C", textChinese: "我身体有点儿不舒服。", textVietnamese: "Tôi hơi khó chịu trong người."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi nghề nghiệp -> Đáp án B (不，他是护士).",
      },
      {
        id: "hsk1-l08-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你今天怎么没去上班？",
        promptPinyin: "Nǐ jīntiān zěnme méi qù shàngbān?",
        promptVietnamese: "Sao hôm nay bạn không đi làm?",
        options: [
          {key: "A", textChinese: "他在医院工作。", textVietnamese: "Bố làm việc ở bệnh viện."},
          {key: "B", textChinese: "不，他是护士。", textVietnamese: "Không, anh ấy là y tá."},
          {key: "C", textChinese: "我身体有点儿不舒服。", textVietnamese: "Tôi trong người hơi không khỏe."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi lý do vắng mặt -> Đáp án C (我身体有点儿不舒服).",
      },
      {
        id: "hsk1-l08-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "我哥哥也是一名（    ）。",
        promptPinyin: "Wǒ gēge yě shì yì míng (    ).",
        promptVietnamese: "Anh trai tôi cũng là một...",
        options: [
          {key: "A", textChinese: "医生 (yīshēng)", textVietnamese: "bác sĩ"},
          {key: "B", textChinese: "医院 (yīyuàn)", textVietnamese: "bệnh viện"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Chỉ người/nghề nghiệp sau lượng từ 一名 -> Điền 医生 (A).",
      },
      {
        id: "hsk1-l08-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "他在那个大（    ）上班。",
        promptPinyin: "Tā zài nàge dà (    ) shàngbān.",
        promptVietnamese: "Anh ấy đi làm ở bệnh viện lớn đó.",
        options: [
          {key: "A", textChinese: "医生 (yīshēng)", textVietnamese: "bác sĩ"},
          {key: "B", textChinese: "医院 (yīyuàn)", textVietnamese: "bệnh viện"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Nơi chốn đi làm sau từ \"大\" -> Điền 医院 (B).",
      },
      {
        id: "hsk1-l08-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我爸爸和妈妈都是医生，他们工作非常忙。",
        promptPinyin: "Wǒ bàba hé māma dōu shì yīshēng, tāmen gōngzuò fēicháng máng.",
        promptVietnamese: "Bố và mẹ tôi đều là bác sĩ, công việc của họ vô cùng bận rộn.",
        subPrompt: "★ 说话人的父母： (Bố mẹ người nói...)",
        options: [
          {key: "A", textChinese: "都是医生", textVietnamese: "Đều là bác sĩ"},
          {key: "B", textChinese: "都是老师", textVietnamese: "Đều là giáo viên"},
          {key: "C", textChinese: "都不工作", textVietnamese: "Đều không đi làm"}
        ],
        correctKey: "A",
        explanation: "Bố mẹ đều là bác sĩ (都是医生) -> Đáp án A.",
      },
      {
        id: "hsk1-l08-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "李阿姨在医院工作二十年了，大家都认识她。",
        promptPinyin: "Lǐ āyí zài yīyuàn gōngzuò èrshí nián le, dàjiā dōu rènshi tā.",
        promptVietnamese: "Dì Lý làm việc ở bệnh viện 20 năm rồi, mọi người đều quen biết dì.",
        subPrompt: "★ 大家为什么认识李阿姨？ (Vì sao mọi người quen dì Lý?)",
        options: [
          {key: "A", textChinese: "她是病人", textVietnamese: "Dì là bệnh nhân"},
          {key: "B", textChinese: "她在医院工作很久了", textVietnamese: "Dì làm ở bệnh viện rất lâu rồi"},
          {key: "C", textChinese: "她不在医院", textVietnamese: "Dì không ở bệnh viện"}
        ],
        correctKey: "B",
        explanation: "Làm việc 20 năm nên ai cũng quen biết (在医院工作很久了) -> Đáp án B.",
      }
    ],
  },
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
        id: "hsk1-l09-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Xuéxiào (Trường học)",
        options: [
          {key: "A", textChinese: "学校", textVietnamese: "Trường học", imageEmoji: "🏫"},
          {key: "B", textChinese: "电脑", textVietnamese: "Máy vi tính", imageEmoji: "💻"},
          {key: "C", textChinese: "小狗", textVietnamese: "Chú chó nhỏ", imageEmoji: "🐶"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"学校\" (trường học) -> Tranh A.",
      },
      {
        id: "hsk1-l09-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Diànnǎo (Máy vi tính laptop)",
        options: [
          {key: "A", textChinese: "学校", textVietnamese: "Trường học", imageEmoji: "🏫"},
          {key: "B", textChinese: "电脑", textVietnamese: "Máy vi tính", imageEmoji: "💻"},
          {key: "C", textChinese: "小狗", textVietnamese: "Chú chó nhỏ", imageEmoji: "🐶"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"电脑\" (máy tính) -> Tranh B.",
      },
      {
        id: "hsk1-l09-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Xiǎo māo (Mèo con)",
        options: [
          {key: "A", textChinese: "小猫", textVietnamese: "Mèo con", imageEmoji: "🐱"},
          {key: "B", textChinese: "小狗", textVietnamese: "Chó con", imageEmoji: "🐶"},
          {key: "C", textChinese: "书", textVietnamese: "Sách vở", imageEmoji: "📖"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"小猫\" (mèo con) -> Tranh A.",
      },
      {
        id: "hsk1-l09-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ de shū ne? (Sách của bạn đâu rồi?)",
        options: [
          {key: "A", textChinese: "书", textPinyin: "shū", textVietnamese: "Sách"},
          {key: "B", textChinese: "我的", textPinyin: "wǒ de", textVietnamese: "Của tôi"},
          {key: "C", textChinese: "他的电脑", textPinyin: "tā de diànnǎo", textVietnamese: "Máy tính của anh ấy"}
        ],
        correctKey: "B",
        explanation: "Hỏi sách của bạn đâu -> Trả lời câu hỏi sở hữu \"我的\" (sách của tôi ở kia/của tôi).",
      },
      {
        id: "hsk1-l09-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Xīngqītiān nǐ zuò shénme? (Chủ nhật bạn làm gì?)",
        options: [
          {key: "A", textChinese: "星期天", textPinyin: "Xīngqītiān", textVietnamese: "Chủ nhật"},
          {key: "B", textChinese: "孩子们", textPinyin: "háizimen", textVietnamese: "Những đứa trẻ"},
          {key: "C", textChinese: "去外边唱歌", textPinyin: "qù wàibian chàng gē", textVietnamese: "Ra ngoài hát ca"}
        ],
        correctKey: "C",
        explanation: "Hỏi hoạt động làm gì \"做什么\" -> Trả lời hành động \"去外边唱歌\" (ra ngoài hát ca).",
      },
      {
        id: "hsk1-l09-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ hǎo! Hěn gāoxìng rènshi nǐ. Nǚ: Nǐ hǎo! Wǒ yě shì.",
        options: [
          {key: "A", textChinese: "Bắt tay chào hỏi làm quen", imageEmoji: "🤝"},
          {key: "B", textChinese: "Đọc sách thư viện", imageEmoji: "📖"},
          {key: "C", textChinese: "Mua hoa quả siêu thị", imageEmoji: "🛒"}
        ],
        correctKey: "A",
        explanation: "Chào hỏi làm quen bắt tay (认识你) -> Tranh A.",
      },
      {
        id: "hsk1-l09-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ zài túshūguǎn ma? Nǚ: Duì, wǒ zài kàn shū.",
        options: [
          {key: "A", textChinese: "Bắt tay", imageEmoji: "🤝"},
          {key: "B", textChinese: "Đọc sách thư viện", imageEmoji: "📖"},
          {key: "C", textChinese: "Chó con", imageEmoji: "🐶"}
        ],
        correctKey: "B",
        explanation: "Ở thư viện đọc sách (在看书) -> Tranh B.",
      },
      {
        id: "hsk1-l09-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ jiā de xiǎo gǒu zhēn kě’ài! Nǚ: Xièxie, tā shì wǒ de hǎo péngyou.",
        options: [
          {key: "A", textChinese: "Bắt tay", imageEmoji: "🤝"},
          {key: "B", textChinese: "Đọc sách", imageEmoji: "📖"},
          {key: "C", textChinese: "Chú cún nhỏ trắng dễ thương", imageEmoji: "🐶"}
        ],
        correctKey: "C",
        explanation: "Chó con đáng yêu (小狗) -> Tranh C.",
      },
      {
        id: "hsk1-l09-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wǒ měitiān shàngwǔ bā diǎn zài xuéxiào xuéxí. (Hỏi: 说话人几点在学校学习？)",
        options: [
          {key: "A", textChinese: "上午 8:00", textPinyin: "shàngwǔ 8:00", textVietnamese: "Buổi sáng 8:00"},
          {key: "B", textChinese: "上午 10:00", textPinyin: "shàngwǔ 10:00", textVietnamese: "Buổi sáng 10:00"},
          {key: "C", textChinese: "晚上 8:00", textPinyin: "wǎnshang 8:00", textVietnamese: "Buổi tối 8:00"}
        ],
        correctKey: "A",
        explanation: "Sáng 8 giờ học ở trường (上午八点) -> Đáp án A.",
      },
      {
        id: "hsk1-l09-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Míngtiān xiàwǔ wǒ qù shūdiàn mǎi shū. (Hỏi: 说话人明天下午去哪里？)",
        options: [
          {key: "A", textChinese: "菜店", textPinyin: "càidiàn", textVietnamese: "Cửa hàng rau"},
          {key: "B", textChinese: "书店", textPinyin: "shūdiàn", textVietnamese: "Hiệu sách"},
          {key: "C", textChinese: "超市", textPinyin: "chāoshì", textVietnamese: "Siêu thị"}
        ],
        correctKey: "B",
        explanation: "Đi hiệu sách mua sách (去书店买书) -> Đáp án B.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l09-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "妹妹和小狗今天在家里玩。",
        promptPinyin: "Mèimei hé xiǎo gǒu jīntiān zài jiā li wán.",
        promptVietnamese: "Em gái và chú chó nhỏ hôm nay chơi ở nhà.",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Máy vi tính laptop", imageEmoji: "💻"},
          {key: "C", textVietnamese: "Mèo nhỏ bên cửa sổ", imageEmoji: "🐱"},
          {key: "D", textVietnamese: "Em bé gái ôm chú chó nhỏ", imageEmoji: "👧🐕"}
        ],
        correctKey: "D",
        explanation: "Em gái và chú chó nhỏ (妹妹和小狗) -> Tranh D.",
      },
      {
        id: "hsk1-l09-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "房间外有一只小猫。",
        promptPinyin: "Fángjiān wài yǒu yì zhī xiǎo māo.",
        promptVietnamese: "Bên ngoài phòng có một chú mèo con.",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Máy vi tính laptop", imageEmoji: "💻"},
          {key: "C", textVietnamese: "Mèo con bên cửa sổ phòng", imageEmoji: "🐱"},
          {key: "D", textVietnamese: "Em gái và chó con", imageEmoji: "👧🐕"}
        ],
        correctKey: "C",
        explanation: "Chú mèo nhỏ ngoài phòng (有一只小猫) -> Tranh C.",
      },
      {
        id: "hsk1-l09-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "这是我的第三个电脑。",
        promptPinyin: "Zhè shì wǒ de dì-sān gè diànnǎo.",
        promptVietnamese: "Đây là chiếc máy tính thứ ba của tôi.",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Cầm máy tính laptop mới", imageEmoji: "💻"},
          {key: "C", textVietnamese: "Mèo nhỏ", imageEmoji: "🐱"},
          {key: "D", textVietnamese: "Chó con", imageEmoji: "👧🐕"}
        ],
        correctKey: "B",
        explanation: "Máy tính laptop (电脑) -> Tranh B.",
      },
      {
        id: "hsk1-l09-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "桌子上有什么？",
        promptPinyin: "Zhuōzi shang yǒu shénme?",
        promptVietnamese: "Trên bàn có cái gì?",
        options: [
          {key: "A", textChinese: "在家里。", textVietnamese: "Ở trong nhà."},
          {key: "B", textChinese: "我女朋友。", textVietnamese: "Bạn gái của tôi."},
          {key: "C", textChinese: "一只小猫。", textVietnamese: "Một chú mèo nhỏ."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi trên bàn có cái gì -> Đáp án C (一只小猫).",
      },
      {
        id: "hsk1-l09-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "你今天下午在哪儿？",
        promptPinyin: "Nǐ jīntiān xiàwǔ zài nǎr?",
        promptVietnamese: "Chiều nay bạn ở đâu?",
        options: [
          {key: "A", textChinese: "在家里。", textVietnamese: "Ở trong nhà."},
          {key: "B", textChinese: "我女朋友。", textVietnamese: "Bạn gái của tôi."},
          {key: "C", textChinese: "一只小猫。", textVietnamese: "Một chú mèo nhỏ."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi ở đâu -> Đáp án A (在家里).",
      },
      {
        id: "hsk1-l09-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你和谁在超市呢？",
        promptPinyin: "Nǐ hé shéi zài chāoshì ne?",
        promptVietnamese: "Bạn đang ở siêu thị cùng ai thế?",
        options: [
          {key: "A", textChinese: "在家里。", textVietnamese: "Ở trong nhà."},
          {key: "B", textChinese: "我女朋友。", textVietnamese: "Bạn gái của tôi."},
          {key: "C", textChinese: "一只小猫。", textVietnamese: "Một chú mèo nhỏ."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi đi cùng ai (和谁) -> Đáp án B (我女朋友).",
      },
      {
        id: "hsk1-l09-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "我上午在学校（    ），我们下午去看电影吧。",
        promptPinyin: "Wǒ shàngwǔ zài xuéxiào (    ), wǒmen xiàwǔ qù kàn diànyǐng ba.",
        promptVietnamese: "Buổi sáng tôi lên lớp ở trường, buổi chiều chúng ta đi xem phim nhé.",
        options: [
          {key: "A", textChinese: "2:00", textVietnamese: "2 giờ"},
          {key: "B", textChinese: "上课 (shàngkè)", textVietnamese: "lên lớp học"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên gọi"}
        ],
        correctKey: "B",
        explanation: "Hành động ở trường buổi sáng -> Điền 上课 (B).",
      },
      {
        id: "hsk1-l09-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "男：我们下午几点在学校见？ 女：下午（    ）吧。",
        promptPinyin: "Nán: Wǒmen xiàwǔ jǐ diǎn zài xuéxiào jiàn? Nǚ: Xiàwǔ (    ) ba.",
        promptVietnamese: "Nam: Chiều nay mấy giờ chúng ta gặp ở trường? Nữ: Chiều 2 giờ đi.",
        options: [
          {key: "A", textChinese: "2:00", textVietnamese: "2 giờ"},
          {key: "B", textChinese: "上课 (shàngkè)", textVietnamese: "lên lớp học"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên gọi"}
        ],
        correctKey: "A",
        explanation: "Hỏi mấy giờ (几点) -> Điền thời gian 2:00 (A).",
      },
      {
        id: "hsk1-l09-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我有一只小狗，很漂亮，它是我的好朋友。",
        promptPinyin: "Wǒ yǒu yì zhī xiǎo gǒu, hěn piàoliang, tā shì wǒ de hǎo péngyou.",
        promptVietnamese: "Tôi có một chú cún nhỏ, rất đẹp, nó là người bạn tốt của tôi.",
        subPrompt: "★ 说话人有几只小狗？ (Người nói có mấy con chó con?)",
        options: [
          {key: "A", textChinese: "一 (yī)", textVietnamese: "1 con"},
          {key: "B", textChinese: "四 (sì)", textVietnamese: "4 con"},
          {key: "C", textChinese: "十一 (shíyī)", textVietnamese: "11 con"}
        ],
        correctKey: "A",
        explanation: "Một chú cún nhỏ (一只小狗) -> Đáp án A (一).",
      },
      {
        id: "hsk1-l09-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "星期天中午妈妈在做饭，我和妹妹在房间里玩。",
        promptPinyin: "Xīngqītiān zhōngwǔ māma zài zuò fàn, wǒ hé mèimei zài fángjiān li wán.",
        promptVietnamese: "Trưa chủ nhật mẹ đang nấu cơm, tôi và em gái chơi ở trong phòng.",
        subPrompt: "★ 说话人和妹妹在哪儿？ (Người nói và em gái đang ở đâu?)",
        options: [
          {key: "A", textChinese: "外边 (wàibian)", textVietnamese: "Bên ngoài"},
          {key: "B", textChinese: "房间里 (fángjiān li)", textVietnamese: "Ở trong phòng"},
          {key: "C", textChinese: "超市里 (chāoshì li)", textVietnamese: "Trong siêu thị"}
        ],
        correctKey: "B",
        explanation: "Ở trong phòng chơi (在房间里玩) -> Đáp án B (房间里).",
      }
    ],
  },
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
        id: "hsk1-l10-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Píngguǒ (Quả táo)",
        options: [
          {key: "A", textChinese: "苹果", textVietnamese: "Quả táo tươi", imageEmoji: "🍎"},
          {key: "B", textChinese: "衣服", textVietnamese: "Quần áo", imageEmoji: "👕"},
          {key: "C", textChinese: "包子", textVietnamese: "Bánh bao nóng hổi", imageEmoji: "🥟"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"苹果\" (quả táo) -> Tranh A.",
      },
      {
        id: "hsk1-l10-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Yīfu (Quần áo)",
        options: [
          {key: "A", textChinese: "苹果", textVietnamese: "Quả táo", imageEmoji: "🍎"},
          {key: "B", textChinese: "衣服", textVietnamese: "Quần áo treo giá", imageEmoji: "👕"},
          {key: "C", textChinese: "包子", textVietnamese: "Bánh bao", imageEmoji: "🥟"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"衣服\" (quần áo) -> Tranh B.",
      },
      {
        id: "hsk1-l10-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Bēizi (Cái cốc ly nước)",
        options: [
          {key: "A", textChinese: "杯子", textVietnamese: "Cái cốc uống nước", imageEmoji: "🥛"},
          {key: "B", textChinese: "苹果", textVietnamese: "Quả táo", imageEmoji: "🍎"},
          {key: "C", textChinese: "衣服", textVietnamese: "Quần áo", imageEmoji: "👕"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"杯子\" (cái cốc) -> Tranh A.",
      },
      {
        id: "hsk1-l10-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Zhège bēizi duōshao qián? (Cái cốc này bao nhiêu tiền?)",
        options: [
          {key: "A", textChinese: "5块", textPinyin: "5 kuài", textVietnamese: "5 đồng"},
          {key: "B", textChinese: "商店", textPinyin: "shāngdiàn", textVietnamese: "Cửa hàng"},
          {key: "C", textChinese: "很好", textPinyin: "hěn hǎo", textVietnamese: "Rất tốt"}
        ],
        correctKey: "A",
        explanation: "Hỏi giá tiền \"多少钱\" -> Trả lời số tiền \"5块\" (5 đồng).",
      },
      {
        id: "hsk1-l10-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Zhè jiàn yīfu zěnmeyàng? (Bộ quần áo này thế nào?)",
        options: [
          {key: "A", textChinese: "很漂亮", textPinyin: "hěn piàoliang", textVietnamese: "Rất đẹp"},
          {key: "B", textChinese: "20岁", textPinyin: "20 suì", textVietnamese: "20 tuổi"},
          {key: "C", textChinese: "不去", textPinyin: "bú qù", textVietnamese: "Không đi"}
        ],
        correctKey: "A",
        explanation: "Hỏi nhận xét \"怎么样\" -> Trả lời tính từ \"很漂亮\" (rất đẹp).",
      },
      {
        id: "hsk1-l10-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zhèxiē píngguǒ duōshao qián yì jīn? Nǚ: Liǎng kuài qián yì jīn, hěn piányi.",
        options: [
          {key: "A", textChinese: "Giỏ táo đỏ tươi", imageEmoji: "🍎"},
          {key: "B", textChinese: "Quần áo", imageEmoji: "👕"},
          {key: "C", textChinese: "Bánh bao", imageEmoji: "🥟"}
        ],
        correctKey: "A",
        explanation: "Táo rẻ 2 đồng một cân (苹果两块钱一斤) -> Tranh A.",
      },
      {
        id: "hsk1-l10-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ kàn, zhè jiàn yīfu duō hǎokàn! Nǚ: Shì a, gěi nǚ’ér mǎi yí jiàn ba.",
        options: [
          {key: "A", textChinese: "Giỏ táo", imageEmoji: "🍎"},
          {key: "B", textChinese: "Gian hàng quần áo đẹp", imageEmoji: "👗"},
          {key: "C", textChinese: "Cốc nước", imageEmoji: "🥛"}
        ],
        correctKey: "B",
        explanation: "Quần áo đẹp cho con gái (这件衣服) -> Tranh B.",
      },
      {
        id: "hsk1-l10-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Shàngwǔ wǒ chī le liǎng gè bāozi. Nǚ: Zhèr de bāozi zhēn hǎochī!",
        options: [
          {key: "A", textChinese: "Táo", imageEmoji: "🍎"},
          {key: "B", textChinese: "Quần áo", imageEmoji: "👗"},
          {key: "C", textChinese: "Xửng bánh bao nóng hổi", imageEmoji: "🥟"}
        ],
        correctKey: "C",
        explanation: "Bánh bao thơm ngon (包子真好吃) -> Tranh C.",
      },
      {
        id: "hsk1-l10-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Zhèxiē píngguǒ liǎng kuài qián yì jīn, zhēn piányi. (Hỏi: 苹果多少钱一斤？)",
        options: [
          {key: "A", textChinese: "两块 (2块)", textPinyin: "liǎng kuài", textVietnamese: "2 đồng"},
          {key: "B", textChinese: "五块 (5块)", textPinyin: "wǔ kuài", textVietnamese: "5 đồng"},
          {key: "C", textChinese: "十块 (10块)", textPinyin: "shí kuài", textVietnamese: "10 đồng"}
        ],
        correctKey: "A",
        explanation: "Táo 2 đồng một cân (两块钱一斤) -> Đáp án A.",
      },
      {
        id: "hsk1-l10-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Māma qù shāngdiàn mǎi le yí gè bēizi. (Hỏi: 妈妈买了什么？)",
        options: [
          {key: "A", textChinese: "苹果", textPinyin: "píngguǒ", textVietnamese: "Táo"},
          {key: "B", textChinese: "衣服", textPinyin: "yīfu", textVietnamese: "Quần áo"},
          {key: "C", textChinese: "杯子", textPinyin: "bēizi", textVietnamese: "Cái cốc"}
        ],
        correctKey: "C",
        explanation: "Mẹ mua một cái cốc (买了一个杯子) -> Đáp án C.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l10-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "请问，包子多少钱一个？",
        promptPinyin: "Qǐngwèn, bāozi duōshao qián yí gè?",
        promptVietnamese: "Xin hỏi, bánh bao bao nhiêu tiền một cái?",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Giỏ táo đỏ", imageEmoji: "🍎"},
          {key: "C", textVietnamese: "Xửng bánh bao nóng", imageEmoji: "🥟"},
          {key: "D", textVietnamese: "Quần áo trẻ em", imageEmoji: "👕"}
        ],
        correctKey: "C",
        explanation: "Bánh bao (包子) -> Tranh C.",
      },
      {
        id: "hsk1-l10-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "这边的苹果真便宜。",
        promptPinyin: "Zhèbiān de píngguǒ zhēn piányi.",
        promptVietnamese: "Táo bên này thật là rẻ.",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Giỏ táo đỏ chín mọng", imageEmoji: "🍎"},
          {key: "C", textVietnamese: "Bánh bao", imageEmoji: "🥟"},
          {key: "D", textVietnamese: "Quần áo", imageEmoji: "👕"}
        ],
        correctKey: "B",
        explanation: "Táo quả (苹果) -> Tranh B.",
      },
      {
        id: "hsk1-l10-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "这些是男孩子穿的衣服。",
        promptPinyin: "Zhèxiē shì nán háizi chuān de yīfu.",
        promptVietnamese: "Đây là quần áo bé trai mặc.",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Giỏ táo", imageEmoji: "🍎"},
          {key: "C", textVietnamese: "Bánh bao", imageEmoji: "🥟"},
          {key: "D", textVietnamese: "Cậu bé chọn quần áo trên giá", imageEmoji: "👕"}
        ],
        correctKey: "D",
        explanation: "Quần áo bé trai mặc (衣服) -> Tranh D.",
      },
      {
        id: "hsk1-l10-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "女孩子的衣服在哪儿？",
        promptPinyin: "Nǚ háizi de yīfu zài nǎr?",
        promptVietnamese: "Quần áo của bé gái ở đâu?",
        options: [
          {key: "A", textChinese: "十块钱。", textVietnamese: "10 đồng."},
          {key: "B", textChinese: "对不起，没有。", textVietnamese: "Xin lỗi, không có."},
          {key: "C", textChinese: "在那边。", textVietnamese: "Ở đằng kia."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi vị trí在哪儿 -> Đáp án C (在那边).",
      },
      {
        id: "hsk1-l10-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "杯子多少钱一个？",
        promptPinyin: "Bēizi duōshao qián yí gè?",
        promptVietnamese: "Cốc bao nhiêu tiền một cái?",
        options: [
          {key: "A", textChinese: "十块钱。", textVietnamese: "10 đồng."},
          {key: "B", textChinese: "对不起，没有。", textVietnamese: "Xin lỗi, không có."},
          {key: "C", textChinese: "在那边。", textVietnamese: "Ở đằng kia."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi giá tiền 多少钱 -> Đáp án A (十块钱).",
      },
      {
        id: "hsk1-l10-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "请问这儿有牛奶吗？",
        promptPinyin: "Qǐngwèn zhèr yǒu niúnǎi ma?",
        promptVietnamese: "Xin hỏi ở đây có sữa bò không?",
        options: [
          {key: "A", textChinese: "十块钱。", textVietnamese: "10 đồng."},
          {key: "B", textChinese: "对不起，没有。", textVietnamese: "Xin lỗi, không có."},
          {key: "C", textChinese: "在那边。", textVietnamese: "Ở đằng kia."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi có sữa không -> Đáp án B (对不起，没有).",
      },
      {
        id: "hsk1-l10-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "那些苹果两（    ）钱一斤，很便宜。",
        promptPinyin: "Nàxiē píngguǒ liǎng (    ) qián yì jīn, hěn piányi.",
        promptVietnamese: "Những quả táo kia 2 đồng một cân, rất rẻ.",
        options: [
          {key: "A", textChinese: "穿 (chuān)", textVietnamese: "mặc quần áo"},
          {key: "B", textChinese: "块 (kuài)", textVietnamese: "đồng (tiền tệ)"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên gọi"}
        ],
        correctKey: "B",
        explanation: "Đơn vị tiền sau số đếm \"两\" -> Điền 块 (B).",
      },
      {
        id: "hsk1-l10-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "男：这件衣服怎么样？ 女：很好看，10岁的男孩子能（    ）。",
        promptPinyin: "Nán: Zhè jiàn yīfu zěnmeyàng? Nǚ: Hěn hǎokàn, 10 suì de nán háizi néng (    ).",
        promptVietnamese: "Nam: Chiếc áo này thế nào? Nữ: Rất đẹp, cậu bé 10 tuổi có thể mặc được.",
        options: [
          {key: "A", textChinese: "穿 (chuān)", textVietnamese: "mặc (áo quần)"},
          {key: "B", textChinese: "块 (kuài)", textVietnamese: "đồng"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Động từ mang/mặc y phục sau \"能\" -> Điền 穿 (A).",
      },
      {
        id: "hsk1-l10-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我没有手机，今天想去商店买一个。",
        promptPinyin: "Wǒ méiyǒu shǒujī, jīntiān xiǎng qù shāngdiàn mǎi yí gè.",
        promptVietnamese: "Tôi không có điện thoại, hôm nay muốn đi cửa hàng mua một cái.",
        subPrompt: "★ 说话人想买什么？ (Người nói muốn mua gì?)",
        options: [
          {key: "A", textChinese: "杯子 (bēizi)", textVietnamese: "Cái cốc"},
          {key: "B", textChinese: "手机 (shǒujī)", textVietnamese: "Điện thoại di động"},
          {key: "C", textChinese: "水果 (shuǐguǒ)", textVietnamese: "Hoa quả trái cây"}
        ],
        correctKey: "B",
        explanation: "Muốn đi mua điện thoại (想去商店买手机) -> Đáp án B (手机).",
      },
      {
        id: "hsk1-l10-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "这件衣服很好看，你也能穿，买一件吧。",
        promptPinyin: "Zhè jiàn yīfu hěn hǎokàn, nǐ yě néng chuān, mǎi yí jiàn ba.",
        promptVietnamese: "Chiếc áo này rất đẹp, bạn cũng mặc vừa đấy, mua một chiếc đi.",
        subPrompt: "★ 那件衣服： (Chiếc áo đó...)",
        options: [
          {key: "A", textChinese: "好看 (hǎokàn)", textVietnamese: "Đẹp mắt"},
          {key: "B", textChinese: "便宜 (piányi)", textVietnamese: "Rẻ"},
          {key: "C", textChinese: "很贵 (hěn guì)", textVietnamese: "Rất đắt"}
        ],
        correctKey: "A",
        explanation: "Chiếc áo rất đẹp (衣服很好看) -> Đáp án A (好看).",
      }
    ],
  },
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
        id: "hsk1-l11-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Shuìjiào (Đi ngủ)",
        options: [
          {key: "A", textChinese: "睡觉", textVietnamese: "Nằm ngủ say", imageEmoji: "🛌"},
          {key: "B", textChinese: "做饭", textVietnamese: "Nấu cơm", imageEmoji: "🍳"},
          {key: "C", textChinese: "开车", textVietnamese: "Lái xe ô tô", imageEmoji: "🚗"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"睡觉\" (đi ngủ) -> Tranh A.",
      },
      {
        id: "hsk1-l11-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Zuò fàn (Nấu ăn)",
        options: [
          {key: "A", textChinese: "睡觉", textVietnamese: "Nằm ngủ", imageEmoji: "🛌"},
          {key: "B", textChinese: "做饭", textVietnamese: "Đang nấu cơm", imageEmoji: "🍳"},
          {key: "C", textChinese: "开车", textVietnamese: "Lái xe ô tô", imageEmoji: "🚗"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"做饭\" (nấu cơm) -> Tranh B.",
      },
      {
        id: "hsk1-l11-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Kāichē (Lái xe hơi)",
        options: [
          {key: "A", textChinese: "睡觉", textVietnamese: "Đi ngủ", imageEmoji: "🛌"},
          {key: "B", textChinese: "做饭", textVietnamese: "Nấu ăn", imageEmoji: "🍳"},
          {key: "C", textChinese: "开车", textVietnamese: "Đang lái xe", imageEmoji: "🚗"}
        ],
        correctKey: "C",
        explanation: "Từ nghe được là \"开车\" (lái xe) -> Tranh C.",
      },
      {
        id: "hsk1-l11-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ zài zuò shénme ne? (Bạn đang làm gì thế?)",
        options: [
          {key: "A", textChinese: "我在做饭呢", textPinyin: "wǒ zài zuò fàn ne", textVietnamese: "Tôi đang nấu cơm nè"},
          {key: "B", textChinese: "学校", textPinyin: "xuéxiào", textVietnamese: "Trường học"},
          {key: "C", textChinese: "明天", textPinyin: "míngtiān", textVietnamese: "Ngày mai"}
        ],
        correctKey: "A",
        explanation: "Hỏi đang làm gì -> Trả lời hành động đang diễn ra \"我在做饭呢\".",
      },
      {
        id: "hsk1-l11-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Tā kāichē qù xuéxiào ma? (Anh ấy lái xe đi học à?)",
        options: [
          {key: "A", textChinese: "是的", textPinyin: "shì de", textVietnamese: "Đúng vậy"},
          {key: "B", textChinese: "很忙", textPinyin: "hěn máng", textVietnamese: "Rất bận"},
          {key: "C", textChinese: "20岁", textPinyin: "20 suì", textVietnamese: "20 tuổi"}
        ],
        correctKey: "A",
        explanation: "Hỏi nghi vấn ngữ khí \"吗\" -> Trả lời khẳng định \"是的\" (đúng vậy).",
      },
      {
        id: "hsk1-l11-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Māma zài zuò shénme? Nǚ: Māma zhèngzài zuò fàn ne.",
        options: [
          {key: "A", textChinese: "Mẹ đang nấu nướng trong bếp", imageEmoji: "🍳"},
          {key: "B", textChinese: "Lái xe", imageEmoji: "🚗"},
          {key: "C", textChinese: "Cắm trại", imageEmoji: "⛺"}
        ],
        correctKey: "A",
        explanation: "Mẹ đang nấu cơm (正在做饭呢) -> Tranh A.",
      },
      {
        id: "hsk1-l11-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ zěnme qù shàngbān? Nǚ: Jīntiān wǒ kāichē qù.",
        options: [
          {key: "A", textChinese: "Nấu ăn", imageEmoji: "🍳"},
          {key: "B", textChinese: "Lái xe ô tô đi làm", imageEmoji: "🚗"},
          {key: "C", textChinese: "Đi ngủ", imageEmoji: "🛌"}
        ],
        correctKey: "B",
        explanation: "Lái xe đi làm (开车去) -> Tranh B.",
      },
      {
        id: "hsk1-l11-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Xīngqītiān wǒmen qù wàibian wán ba. Nǚ: Hǎo a, qù gōngyuán yěyíng.",
        options: [
          {key: "A", textChinese: "Nấu ăn", imageEmoji: "🍳"},
          {key: "B", textChinese: "Lái xe", imageEmoji: "🚗"},
          {key: "C", textChinese: "Dã ngoại ngoài trời cùng bạn bè", imageEmoji: "⛺"}
        ],
        correctKey: "C",
        explanation: "Ra ngoài trời chơi dã ngoại (在外边玩) -> Tranh C.",
      },
      {
        id: "hsk1-l11-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Jiějie jīnnián èrshí suì, zhèngzài dú dàxué ne. (Hỏi: 姐姐在做什么？)",
        options: [
          {key: "A", textChinese: "读大学", textPinyin: "dú dàxué", textVietnamese: "Học đại học"},
          {key: "B", textChinese: "开车", textPinyin: "kāichē", textVietnamese: "Lái xe"},
          {key: "C", textChinese: "睡觉", textPinyin: "shuìjiào", textVietnamese: "Đi ngủ"}
        ],
        correctKey: "A",
        explanation: "Chị gái đang học đại học (正在读大学呢) -> Đáp án A.",
      },
      {
        id: "hsk1-l11-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Dìdi méi qǐchuáng, hái zài jiā li shuìjiào ne. (Hỏi: 弟弟在做什么？)",
        options: [
          {key: "A", textChinese: "睡觉", textPinyin: "shuìjiào", textVietnamese: "Ngủ"},
          {key: "B", textChinese: "做饭", textPinyin: "zuò fàn", textVietnamese: "Nấu cơm"},
          {key: "C", textChinese: "上课", textPinyin: "shàngkè", textVietnamese: "Lên lớp"}
        ],
        correctKey: "A",
        explanation: "Em trai vẫn đang ngủ ở nhà (还在睡觉呢) -> Đáp án A.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l11-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "妈妈正在做饭呢。",
        promptPinyin: "Māma zhèngzài zuò fàn ne.",
        promptVietnamese: "Mẹ đang nấu cơm nè.",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Mẹ dặn dò con trai đi học", imageEmoji: "👩‍👦"},
          {key: "C", textVietnamese: "Mẹ con cùng nhau nấu nướng", imageEmoji: "👩‍🍳"},
          {key: "D", textVietnamese: "Bạn bè cắm trại ngoài trời", imageEmoji: "⛺"}
        ],
        correctKey: "C",
        explanation: "Mẹ đang nấu ăn (正在做饭呢) -> Tranh C.",
      },
      {
        id: "hsk1-l11-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "你今天不想去学校吗？",
        promptPinyin: "Nǐ jīntiān bù xiǎng qù xuéxiào ma?",
        promptVietnamese: "Hôm nay con không muốn đến trường à?",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Mẹ khuyên nhủ con trai đeo cặp đi học", imageEmoji: "👩‍👦"},
          {key: "C", textVietnamese: "Nấu ăn", imageEmoji: "👩‍🍳"},
          {key: "D", textVietnamese: "Cắm trại", imageEmoji: "⛺"}
        ],
        correctKey: "B",
        explanation: "Hỏi con không muốn đến trường à (不想去学校吗) -> Tranh B.",
      },
      {
        id: "hsk1-l11-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "我和朋友们在外边玩呢。",
        promptPinyin: "Wǒ hé péngyoumen zài wàibian wán ne.",
        promptVietnamese: "Tôi và các bạn đang chơi đùa ở ngoài trời.",
        options: [
          {key: "A", textVietnamese: "Đọc sách", imageEmoji: "📖"},
          {key: "B", textVietnamese: "Mẹ và con", imageEmoji: "👩‍👦"},
          {key: "C", textVietnamese: "Nấu ăn", imageEmoji: "👩‍🍳"},
          {key: "D", textVietnamese: "Cả nhóm bạn cắm trại chơi đùa ngoài trời", imageEmoji: "⛺"}
        ],
        correctKey: "D",
        explanation: "Chơi ở bên ngoài trời (在外边玩呢) -> Tranh D.",
      },
      {
        id: "hsk1-l11-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "你开车去吗？",
        promptPinyin: "Nǐ kāichē qù ma?",
        promptVietnamese: "Bạn lái xe đi à?",
        options: [
          {key: "A", textChinese: "不，我坐出租车。", textVietnamese: "Không, tôi đi taxi."},
          {key: "B", textChinese: "非常忙。", textVietnamese: "Vô cùng bận."},
          {key: "C", textChinese: "没有，我在开车呢。", textVietnamese: "Không có, tôi đang lái xe nè."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi phương tiện -> Đáp án A (不，我坐出租车).",
      },
      {
        id: "hsk1-l11-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "你们学习忙不忙？",
        promptPinyin: "Nǐmen xuéxí máng bu máng?",
        promptVietnamese: "Các bạn học tập có bận không?",
        options: [
          {key: "A", textChinese: "不，我坐出租车。", textVietnamese: "Không, tôi đi taxi."},
          {key: "B", textChinese: "非常忙。", textVietnamese: "Vô cùng bận rộn."},
          {key: "C", textChinese: "没有，我在开车呢。", textVietnamese: "Không có, tôi đang lái xe nè."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi mức độ bận 忙不忙 -> Đáp án B (非常忙).",
      },
      {
        id: "hsk1-l11-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你在吃午饭吗？",
        promptPinyin: "Nǐ zài chī wǔfàn ma?",
        promptVietnamese: "Bạn đang ăn trưa à?",
        options: [
          {key: "A", textChinese: "不，我坐出租车。", textVietnamese: "Không, tôi đi taxi."},
          {key: "B", textChinese: "非常忙。", textVietnamese: "Vô cùng bận."},
          {key: "C", textChinese: "没有，我在开车呢。", textVietnamese: "Không có, tôi đang lái xe nè."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi đang ăn trưa à -> Đáp án C (没有，我在开车呢).",
      },
      {
        id: "hsk1-l11-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "弟弟没起床，还在（    ）呢。",
        promptPinyin: "Dìdi méi qǐchuáng, hái zài (    ) ne.",
        promptVietnamese: "Em trai chưa dậy, vẫn đang ngủ nè.",
        options: [
          {key: "A", textChinese: "找 (zhǎo)", textVietnamese: "tìm kiếm"},
          {key: "B", textChinese: "睡觉 (shuìjiào)", textVietnamese: "ngủ"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên gọi"}
        ],
        correctKey: "B",
        explanation: "Chưa dậy \"没起床\" nên vẫn đang ngủ -> Điền 睡觉 (B).",
      },
      {
        id: "hsk1-l11-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "男：喂，你到没到饭店呢？ 女：没到呢，我正在（    ）饭店在哪里呢。",
        promptPinyin: "Nán: Wèi, nǐ dào méi dào fàndiàn ne? Nǚ: Méi dào ne, wǒ zhèngzài (    ) fàndiàn zài nǎlǐ ne.",
        promptVietnamese: "Nam: Alo, cậu đã đến quán ăn chưa? Nữ: Chưa đến, tớ đang tìm quán ăn ở chỗ nào nè.",
        options: [
          {key: "A", textChinese: "找 (zhǎo)", textVietnamese: "tìm kiếm"},
          {key: "B", textChinese: "睡觉 (shuìjiào)", textVietnamese: "ngủ"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Đang tìm kiếm quán ăn \"正在找\" -> Điền 找 (A).",
      },
      {
        id: "hsk1-l11-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "我姐姐今年20岁，正在读大学呢，她学医。",
        promptPinyin: "Wǒ jiějie jīnnián 20 suì, zhèngzài dú dàxué ne, tā xué yī.",
        promptVietnamese: "Chị gái tôi năm nay 20 tuổi, đang học đại học, chị ấy học y khoa.",
        subPrompt: "★ 说话人的姐姐是： (Chị gái người nói là...)",
        options: [
          {key: "A", textChinese: "老师 (lǎoshī)", textVietnamese: "Giáo viên"},
          {key: "B", textChinese: "医生 (yīshēng)", textVietnamese: "Bác sĩ"},
          {key: "C", textChinese: "大学生 (dàxuéshēng)", textVietnamese: "Sinh viên đại học"}
        ],
        correctKey: "C",
        explanation: "Đang học đại học (正在读大学) -> Là sinh viên đại học (大学生, C).",
      },
      {
        id: "hsk1-l11-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "我明天有事，要去学校找老师，不知道老师在不在。",
        promptPinyin: "Wǒ míngtiān yǒu shì, yào qù xuéxiào zhǎo lǎoshī, bù zhīdào lǎoshī zài bu zài.",
        promptVietnamese: "Ngày mai tôi có việc, phải đến trường tìm thầy giáo, không biết thầy có ở đó không.",
        subPrompt: "★ 说话人明天要去学校见： (Người nói ngày mai đến trường gặp ai?)",
        options: [
          {key: "A", textChinese: "朋友 (péngyou)", textVietnamese: "Bạn bè"},
          {key: "B", textChinese: "学生 (xuésheng)", textVietnamese: "Học sinh"},
          {key: "C", textChinese: "老师 (lǎoshī)", textVietnamese: "Thầy giáo"}
        ],
        correctKey: "C",
        explanation: "Đến trường tìm thầy giáo (去找老师) -> Đáp án C (老师).",
      }
    ],
  },
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
        id: "hsk1-l12-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Xiàxuě (Tuyết rơi)",
        options: [
          {key: "A", textChinese: "下雪", textVietnamese: "Tuyết rơi mùa đông", imageEmoji: "❄️"},
          {key: "B", textChinese: "喝水", textVietnamese: "Uống nước ấm", imageEmoji: "☕"},
          {key: "C", textChinese: "看病", textVietnamese: "Bác sĩ khám bệnh", imageEmoji: "👨‍⚕️"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"下雪\" (tuyết rơi) -> Tranh A.",
      },
      {
        id: "hsk1-l12-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Shēngbìng (Bị ốm nằm giường)",
        options: [
          {key: "A", textChinese: "下雪", textVietnamese: "Tuyết rơi", imageEmoji: "❄️"},
          {key: "B", textChinese: "生病", textVietnamese: "Bị ốm nằm nghỉ", imageEmoji: "🤒"},
          {key: "C", textChinese: "看电视", textVietnamese: "Xem tivi", imageEmoji: "📺"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"生病\" (bị ốm) -> Tranh B.",
      },
      {
        id: "hsk1-l12-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Kàn yīshēng (Khám bác sĩ)",
        options: [
          {key: "A", textChinese: "下雪", textVietnamese: "Tuyết rơi", imageEmoji: "❄️"},
          {key: "B", textChinese: "生病", textVietnamese: "Bị ốm", imageEmoji: "🤒"},
          {key: "C", textChinese: "看医生", textVietnamese: "Gặp bác sĩ khám bệnh", imageEmoji: "👨‍⚕️"}
        ],
        correctKey: "C",
        explanation: "Từ nghe được là \"看医生\" (khám bác sĩ) -> Tranh C.",
      },
      {
        id: "hsk1-l12-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Jīntiān tiānqì zěnmeyàng? (Thời tiết hôm nay thế nào?)",
        options: [
          {key: "A", textChinese: "下雪了，很冷", textPinyin: "xiàxuě le, hěn lěng", textVietnamese: "Tuyết rơi rồi, rất lạnh"},
          {key: "B", textChinese: "很好吃", textPinyin: "hěn hǎochī", textVietnamese: "Rất ngon miệng"},
          {key: "C", textChinese: "在医院", textPinyin: "zài yīyuàn", textVietnamese: "Ở bệnh viện"}
        ],
        correctKey: "A",
        explanation: "Hỏi thời tiết \"天气怎么样\" -> Trả lời \"下雪了，很冷\" (tuyết rơi rồi, rất lạnh).",
      },
      {
        id: "hsk1-l12-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ zěnme le? (Bạn bị làm sao thế?)",
        options: [
          {key: "A", textChinese: "我生病了", textPinyin: "wǒ shēngbìng le", textVietnamese: "Tôi bị ốm rồi"},
          {key: "B", textChinese: "昨天", textPinyin: "zuótiān", textVietnamese: "Hôm qua"},
          {key: "C", textChinese: "谢谢", textPinyin: "xièxie", textVietnamese: "Cảm ơn"}
        ],
        correctKey: "A",
        explanation: "Hỏi tình trạng \"你怎么了\" -> Trả lời sức khỏe \"我生病了\" (tôi ốm rồi).",
      },
      {
        id: "hsk1-l12-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wàibian tiānqì zěnmeyàng? Nǚ: Xià dà xuě le, hěn lěng.",
        options: [
          {key: "A", textChinese: "Tuyết rơi phủ trắng xóa ngoài trời", imageEmoji: "❄️"},
          {key: "B", textChinese: "Xem tivi", imageEmoji: "📺"},
          {key: "C", textChinese: "Lái xe", imageEmoji: "🚗"}
        ],
        correctKey: "A",
        explanation: "Tuyết rơi lớn rất lạnh (下大雪了) -> Tranh A.",
      },
      {
        id: "hsk1-l12-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Tā zěnme méi lái shàngbān? Nǚ: Tā shēngbìng zài jiā xiūxi ne.",
        options: [
          {key: "A", textChinese: "Tuyết rơi", imageEmoji: "❄️"},
          {key: "B", textChinese: "Người ốm nằm nghỉ đo nhiệt độ", imageEmoji: "🤒"},
          {key: "C", textChinese: "Trường học", imageEmoji: "🏫"}
        ],
        correctKey: "B",
        explanation: "Bị ốm nghỉ ngơi ở nhà (生病在家休息) -> Tranh B.",
      },
      {
        id: "hsk1-l12-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Shí’èr diǎn le, nǐmen zěnme hái zài kàn diànshì? Nǚ: Zhège diànyǐng tài hǎokàn le.",
        options: [
          {key: "A", textChinese: "Tuyết rơi", imageEmoji: "❄️"},
          {key: "B", textChinese: "Đêm 12 giờ vẫn ngồi xem tivi", imageEmoji: "📺"},
          {key: "C", textChinese: "Bác sĩ", imageEmoji: "👨‍⚕️"}
        ],
        correctKey: "B",
        explanation: "12 giờ đêm vẫn xem tivi (还在看电视) -> Tranh B.",
      },
      {
        id: "hsk1-l12-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Tā jīntiān shēntǐ bù shūfu, yào qù yīyuàn kàn yīshēng. (Hỏi: 他要去医院做什么？)",
        options: [
          {key: "A", textChinese: "看医生", textPinyin: "kàn yīshēng", textVietnamese: "Khám bác sĩ"},
          {key: "B", textChinese: "看朋友", textPinyin: "kàn péngyou", textVietnamese: "Thăm bạn bè"},
          {key: "C", textChinese: "看病人", textPinyin: "kàn bìngrén", textVietnamese: "Thăm người bệnh"}
        ],
        correctKey: "A",
        explanation: "Đi viện khám bác sĩ (看医生) -> Đáp án A.",
      },
      {
        id: "hsk1-l12-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Bàba jīntiān gǎnmào shēngbìng le, bù néng qù gōngzuò. (Hỏi: 爸爸今天没去作什么？)",
        options: [
          {key: "A", textChinese: "工作", textPinyin: "gōngzuò", textVietnamese: "Đi làm"},
          {key: "B", textChinese: "休息", textPinyin: "xiūxi", textVietnamese: "Nghỉ ngơi"},
          {key: "C", textChinese: "读书", textPinyin: "dú shū", textVietnamese: "Đọc sách"}
        ],
        correctKey: "A",
        explanation: "Hôm nay không thể đi làm (不能去工作) -> Đáp án A.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l12-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "我女儿生病了。",
        promptPinyin: "Wǒ nǚ’ér shēngbìng le.",
        promptVietnamese: "Con gái tôi bị ốm rồi.",
        options: [
          {key: "A", textVietnamese: "Con gái bị sốt nằm trên giường bệnh", imageEmoji: "🤒"},
          {key: "B", textVietnamese: "Trời nhiều mây tuyết rơi", imageEmoji: "❄️"},
          {key: "C", textVietnamese: "Đồng hồ chỉ 12:00 đang xem tivi", imageEmoji: "📺"}
        ],
        correctKey: "A",
        explanation: "Con gái bị ốm (女儿生病了) -> Tranh A.",
      },
      {
        id: "hsk1-l12-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "今天天不太好，下雪了。",
        promptPinyin: "Jīntiān tiān bú tài hǎo, xiàxuě le.",
        promptVietnamese: "Hôm nay trời không tốt lắm, tuyết rơi rồi.",
        options: [
          {key: "A", textVietnamese: "Con gái bị ốm", imageEmoji: "🤒"},
          {key: "B", textVietnamese: "Trời xám xịt tuyết rơi dày", imageEmoji: "❄️"},
          {key: "C", textVietnamese: "Xem tivi ban đêm", imageEmoji: "📺"}
        ],
        correctKey: "B",
        explanation: "Tuyết rơi (下雪了) -> Tranh B.",
      },
      {
        id: "hsk1-l12-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "12:00了，你们怎么还在看电视？",
        promptPinyin: "12:00 le, nǐmen zěnme hái zài kàn diànshì?",
        promptVietnamese: "12:00 rồi, sao các con vẫn còn xem tivi thế?",
        options: [
          {key: "A", textVietnamese: "Bị ốm", imageEmoji: "🤒"},
          {key: "B", textVietnamese: "Tuyết rơi", imageEmoji: "❄️"},
          {key: "C", textVietnamese: "Đồng hồ điểm 12:00 đêm vẫn dán mắt vào tivi", imageEmoji: "📺"}
        ],
        correctKey: "C",
        explanation: "12 giờ đêm vẫn xem tivi (12:00了还在看电视) -> Tranh C.",
      },
      {
        id: "hsk1-l12-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "你怎么了？",
        promptPinyin: "Nǐ zěnme le?",
        promptVietnamese: "Bạn bị làm sao thế?",
        options: [
          {key: "A", textChinese: "热水。", textVietnamese: "Nước nóng."},
          {key: "B", textChinese: "我病了。", textVietnamese: "Tôi bị ốm rồi."},
          {key: "C", textChinese: "对。", textVietnamese: "Đúng vậy."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi tình trạng bạn bị sao -> Đáp án B (我病了).",
      },
      {
        id: "hsk1-l12-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "你想喝点儿什么？",
        promptPinyin: "Nǐ xiǎng hē diǎnr shénme?",
        promptVietnamese: "Bạn muốn uống chút gì không?",
        options: [
          {key: "A", textChinese: "热水。", textVietnamese: "Nước nóng."},
          {key: "B", textChinese: "我病了。", textVietnamese: "Tôi bị ốm rồi."},
          {key: "C", textChinese: "对。", textVietnamese: "Đúng vậy."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi muốn uống gì (喝点儿什么) -> Đáp án A (热水).",
      },
      {
        id: "hsk1-l12-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你开车了？",
        promptPinyin: "Nǐ kāichē le?",
        promptVietnamese: "Bạn lái xe đến à?",
        options: [
          {key: "A", textChinese: "热水。", textVietnamese: "Nước nóng."},
          {key: "B", textChinese: "我病了。", textVietnamese: "Tôi bị ốm rồi."},
          {key: "C", textChinese: "对。", textVietnamese: "Đúng vậy."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Câu hỏi xác nhận -> Đáp án C (对).",
      },
      {
        id: "hsk1-l12-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "昨天下雪了，今天非常（    ）。",
        promptPinyin: "Zuótiān xiàxuě le, jīntiān fēicháng (    ).",
        promptVietnamese: "Hôm qua tuyết rơi rồi, hôm nay vô cùng lạnh.",
        options: [
          {key: "A", textChinese: "冷 (lěng)", textVietnamese: "lạnh"},
          {key: "B", textChinese: "生病 (shēngbìng)", textVietnamese: "bị ốm"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên gọi"}
        ],
        correctKey: "A",
        explanation: "Tuyết rơi nên thời tiết rất lạnh -> Điền 冷 (A).",
      },
      {
        id: "hsk1-l12-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "他（    ）了，要去医院看医生。",
        promptPinyin: "Tā (    ) le, yào qù yīyuàn kàn yīshēng.",
        promptVietnamese: "Anh ấy bị ốm rồi, cần đi bệnh viện khám bác sĩ.",
        options: [
          {key: "A", textChinese: "冷 (lěng)", textVietnamese: "lạnh"},
          {key: "B", textChinese: "生病 (shēngbìng)", textVietnamese: "bị ốm"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Cần đi khám bác sĩ vì bị ốm -> Điền 生病 (B).",
      },
      {
        id: "hsk1-l12-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "昨天的天气很好，我和朋友们去外边玩了。",
        promptPinyin: "Zuótiān de tiānqì hěn hǎo, wǒ hé péngyoumen qù wàibian wán le.",
        promptVietnamese: "Thời tiết hôm qua rất đẹp, tôi và các bạn đã ra ngoài chơi.",
        subPrompt: "★ 说话人觉得昨天: (Người nói cảm thấy hôm qua...)",
        options: [
          {key: "A", textChinese: "天气好", textVietnamese: "Thời tiết đẹp"},
          {key: "B", textChinese: "下雪了", textVietnamese: "Tuyết rơi"},
          {key: "C", textChinese: "很冷", textVietnamese: "Rất lạnh"}
        ],
        correctKey: "A",
        explanation: "Thời tiết hôm qua rất đẹp (天气很好) -> Đáp án A (天气好).",
      },
      {
        id: "hsk1-l12-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "老张去看病，医生说他要吃三天药。",
        promptPinyin: "Lǎo Zhāng qù kàn bìng, yīshēng shuō tā yào chī sān tiān yào.",
        promptVietnamese: "Bác Trương đi khám bệnh, bác sĩ bảo bác ấy phải uống thuốc 3 ngày.",
        subPrompt: "★ 医生说老张: (Bác sĩ nói bác Trương...)",
        options: [
          {key: "A", textChinese: "要吃药", textVietnamese: "Cần phải uống thuốc"},
          {key: "B", textChinese: "不用吃药", textVietnamese: "Không cần uống thuốc"},
          {key: "C", textChinese: "去工作", textVietnamese: "Đi làm việc"}
        ],
        correctKey: "A",
        explanation: "Bác sĩ bảo phải uống 3 ngày thuốc (要吃三天药) -> Đáp án A (要吃药).",
      }
    ],
  },
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
        id: "hsk1-l13-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Hē chá (Uống trà)",
        options: [
          {key: "A", textChinese: "喝茶", textVietnamese: "Tách trà nóng", imageEmoji: "🍵"},
          {key: "B", textChinese: "手机", textVietnamese: "Điện thoại smartphone", imageEmoji: "📱"},
          {key: "C", textChinese: "面包", textVietnamese: "Bánh mì nướng", imageEmoji: "🍞"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"喝茶\" (uống trà) -> Tranh A.",
      },
      {
        id: "hsk1-l13-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Shǒujī (Điện thoại di động)",
        options: [
          {key: "A", textChinese: "喝茶", textVietnamese: "Tách trà", imageEmoji: "🍵"},
          {key: "B", textChinese: "手机", textVietnamese: "Điện thoại di động", imageEmoji: "📱"},
          {key: "C", textChinese: "面包", textVietnamese: "Bánh mì", imageEmoji: "🍞"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"手机\" (điện thoại) -> Tranh B.",
      },
      {
        id: "hsk1-l13-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Miànbāo (Ổ bánh mì thơm ngon)",
        options: [
          {key: "A", textChinese: "喝茶", textVietnamese: "Tách trà", imageEmoji: "🍵"},
          {key: "B", textChinese: "手机", textVietnamese: "Điện thoại", imageEmoji: "📱"},
          {key: "C", textChinese: "面包", textVietnamese: "Bánh mì thơm ngon", imageEmoji: "🍞"}
        ],
        correctKey: "C",
        explanation: "Từ nghe được là \"面包\" (bánh mì) -> Tranh C.",
      },
      {
        id: "hsk1-l13-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Qǐng gěi wǒ yì bēi chá. (Làm ơn cho tôi một tách trà.)",
        options: [
          {key: "A", textChinese: "好的，请喝", textPinyin: "hǎo de, qǐng hē", textVietnamese: "Được rồi, mời uống"},
          {key: "B", textChinese: "谢谢", textPinyin: "xièxie", textVietnamese: "Cảm ơn"},
          {key: "C", textChinese: "没有", textPinyin: "méiyǒu", textVietnamese: "Không có"}
        ],
        correctKey: "A",
        explanation: "Yêu cầu gọi trà -> Phục vụ đáp \"好的，请喝\" (vâng, mời bạn dùng trà).",
      },
      {
        id: "hsk1-l13-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Zhèr mài bù mài shǒujī? (Chỗ này có bán điện thoại không?)",
        options: [
          {key: "A", textChinese: "不卖", textPinyin: "bú mài", textVietnamese: "Không bán"},
          {key: "B", textChinese: "很漂亮", textPinyin: "hěn piàoliang", textVietnamese: "Rất đẹp"},
          {key: "C", textChinese: "10点", textPinyin: "10 diǎn", textVietnamese: "10 giờ"}
        ],
        correctKey: "A",
        explanation: "Hỏi bán hay không -> Đáp \"不卖\" (không bán).",
      },
      {
        id: "hsk1-l13-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ xiǎng hē diǎnr shénme? Nǚ: Qǐng gěi wǒ yì bēi rè chá ba.",
        options: [
          {key: "A", textChinese: "Ly trà nóng bốc khói", imageEmoji: "🍵"},
          {key: "B", textChinese: "Điện thoại", imageEmoji: "📱"},
          {key: "C", textChinese: "Bánh mì", imageEmoji: "🍞"}
        ],
        correctKey: "A",
        explanation: "Uống một ly trà nóng (一杯热茶) -> Tranh A.",
      },
      {
        id: "hsk1-l13-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒ xiǎng dǎ diànhuà wèn yíxià. Nǚ: Gěi nǐ shǒujī.",
        options: [
          {key: "A", textChinese: "Trà", imageEmoji: "🍵"},
          {key: "B", textChinese: "Đưa điện thoại di động gọi", imageEmoji: "📱"},
          {key: "C", textChinese: "Bánh mì", imageEmoji: "🍞"}
        ],
        correctKey: "B",
        explanation: "Đưa điện thoại di động (给你手机) -> Tranh B.",
      },
      {
        id: "hsk1-l13-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zǎoshang nǐ chī shénme le? Nǚ: Wǒ chī le yí gè miànbāo, hē le yì bēi niúnǎi.",
        options: [
          {key: "A", textChinese: "Trà", imageEmoji: "🍵"},
          {key: "B", textChinese: "Điện thoại", imageEmoji: "📱"},
          {key: "C", textChinese: "Bánh mì và sữa tươi", imageEmoji: "🍞🥛"}
        ],
        correctKey: "C",
        explanation: "Ăn một ổ bánh mì (吃了一个面包) -> Tranh C.",
      },
      {
        id: "hsk1-l13-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wǒ de shǒujī huài le, jīntiān xiǎng qù mǎi yí gè xīn shǒujī. (Hỏi: 说话人想买什么？)",
        options: [
          {key: "A", textChinese: "手机", textPinyin: "shǒujī", textVietnamese: "Điện thoại di động"},
          {key: "B", textChinese: "茶", textPinyin: "chá", textVietnamese: "Trà"},
          {key: "C", textChinese: "电脑", textPinyin: "diànnǎo", textVietnamese: "Máy vi tính"}
        ],
        correctKey: "A",
        explanation: "Muốn đi mua điện thoại mới (买一个新手机) -> Đáp án A.",
      },
      {
        id: "hsk1-l13-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Míngtiān Xīngqītiān, wǒmen qù fàndiàn chī jiǎozi ba. (Hỏi: 明天是星期几？)",
        options: [
          {key: "A", textChinese: "星期天 (星期日)", textPinyin: "Xīngqītiān", textVietnamese: "Chủ nhật"},
          {key: "B", textChinese: "星期六", textPinyin: "Xīngqīliù", textVietnamese: "Thứ bảy"},
          {key: "C", textChinese: "星期五", textPinyin: "Xīngqīwǔ", textVietnamese: "Thứ sáu"}
        ],
        correctKey: "A",
        explanation: "Ngày mai là chủ nhật (明天星期天) -> Đáp án A.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l13-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "她太小了，这个苹果给她一半。",
        promptPinyin: "Tā tài xiǎo le, zhège píngguǒ gěi tā yíbàn.",
        promptVietnamese: "Bé còn quá nhỏ, quả táo này chia cho bé một nửa.",
        options: [
          {key: "A", textVietnamese: "Bổ đôi chia nửa quả táo cho em bé", imageEmoji: "🍎"},
          {key: "B", textVietnamese: "Ly sữa tươi trắng thơm ngon", imageEmoji: "🥛"},
          {key: "C", textVietnamese: "Bấm điện thoại gọi hỏi thăm", imageEmoji: "📞"}
        ],
        correctKey: "A",
        explanation: "Chia nửa quả táo cho em bé (苹果给她一半) -> Tranh A.",
      },
      {
        id: "hsk1-l13-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "请给我一杯牛奶。",
        promptPinyin: "Qǐng gěi wǒ yì bēi niúnǎi.",
        promptVietnamese: "Làm ơn cho tôi một ly sữa bò.",
        options: [
          {key: "A", textVietnamese: "Chia táo", imageEmoji: "🍎"},
          {key: "B", textVietnamese: "Ly sữa bò tươi", imageEmoji: "🥛"},
          {key: "C", textVietnamese: "Gọi điện thoại", imageEmoji: "📞"}
        ],
        correctKey: "B",
        explanation: "Một ly sữa tươi (一杯牛奶) -> Tranh B.",
      },
      {
        id: "hsk1-l13-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "我打电话问一下。",
        promptPinyin: "Wǒ dǎ diànhuà wèn yíxià.",
        promptVietnamese: "Để tôi gọi điện thoại hỏi một chút.",
        options: [
          {key: "A", textVietnamese: "Chia táo", imageEmoji: "🍎"},
          {key: "B", textVietnamese: "Ly sữa", imageEmoji: "🥛"},
          {key: "C", textVietnamese: "Nhấc máy gọi điện thoại", imageEmoji: "📞"}
        ],
        correctKey: "C",
        explanation: "Gọi điện thoại hỏi (打电话问一下) -> Tranh C.",
      },
      {
        id: "hsk1-l13-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "那里卖不卖手机？",
        promptPinyin: "Nàlǐ mài bu mài shǒujī?",
        promptVietnamese: "Chỗ kia có bán điện thoại di động không?",
        options: [
          {key: "A", textChinese: "不客气。", textVietnamese: "Không có gì."},
          {key: "B", textChinese: "一个面包。", textVietnamese: "Một chiếc bánh mì."},
          {key: "C", textChinese: "不知道。", textVietnamese: "Tôi không biết."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi thông tin bán điện thoại -> Đáp án C (不知道).",
      },
      {
        id: "hsk1-l13-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "我会写了，谢谢老师。",
        promptPinyin: "Wǒ huì xiě le, xièxie lǎoshī.",
        promptVietnamese: "Em biết viết rồi, cảm ơn thầy cô.",
        options: [
          {key: "A", textChinese: "不客气。", textVietnamese: "Không có chi."},
          {key: "B", textChinese: "一个面包。", textVietnamese: "Một chiếc bánh mì."},
          {key: "C", textChinese: "不知道。", textVietnamese: "Tôi không biết."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Đáp lại lời cảm ơn \"谢谢老师\" -> Đáp án A (不客气).",
      },
      {
        id: "hsk1-l13-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你要什么？",
        promptPinyin: "Nǐ yào shénme?",
        promptVietnamese: "Bạn muốn lấy cái gì?",
        options: [
          {key: "A", textChinese: "不客气。", textVietnamese: "Không có gì."},
          {key: "B", textChinese: "一个面包。", textVietnamese: "Một chiếc bánh mì."},
          {key: "C", textChinese: "不知道。", textVietnamese: "Tôi không biết."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi mua gì -> Đáp án B (一个面包).",
      },
      {
        id: "hsk1-l13-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "请（    ）我一杯茶。",
        promptPinyin: "Qǐng (    ) wǒ yì bēi chá.",
        promptVietnamese: "Làm ơn đưa/cho tôi một tách trà.",
        options: [
          {key: "A", textChinese: "给 (gěi)", textVietnamese: "cho, đưa cho"},
          {key: "B", textChinese: "一下 (yíxià)", textVietnamese: "một chút"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Đưa đồ vật cho ai đó -> Điền 给 (A).",
      },
      {
        id: "hsk1-l13-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "我想问（    ），这个字怎么读？",
        promptPinyin: "Wǒ xiǎng wèn (    ), zhège zì zěnme dú?",
        promptVietnamese: "Tôi muốn hỏi một chút, chữ này đọc thế nào?",
        options: [
          {key: "A", textChinese: "给 (gěi)", textVietnamese: "cho, đưa"},
          {key: "B", textChinese: "一下 (yíxià)", textVietnamese: "một chút, một lát"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Cụm từ \"问一下\" (hỏi một chút) -> Điền 一下 (B).",
      },
      {
        id: "hsk1-l13-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "明天星期天，我们可以去饭店吃饺子吗？",
        promptPinyin: "Míngtiān Xīngqītiān, wǒmen kěyǐ qù fàndiàn chī jiǎozi ma?",
        promptVietnamese: "Ngày mai là chủ nhật, chúng ta có thể đến quán ăn sủi cảo không?",
        subPrompt: "★ 明天是: (Ngày mai là...)",
        options: [
          {key: "A", textChinese: "星期五", textVietnamese: "Thứ sáu"},
          {key: "B", textChinese: "星期六", textVietnamese: "Thứ bảy"},
          {key: "C", textChinese: "星期日", textVietnamese: "Chủ nhật (星期天 = 星期日)"}
        ],
        correctKey: "C",
        explanation: "Ngày mai là chủ nhật (明天星期天 = 星期日) -> Đáp án C (星期日).",
      },
      {
        id: "hsk1-l13-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "爸爸今天在家里工作，我们不要去他的房间。",
        promptPinyin: "Bàba jīntiān zài jiā li gōngzuò, wǒmen bú yào qù tā de fángjiān.",
        promptVietnamese: "Hôm nay bố làm việc ở nhà, chúng ta đừng vào phòng của bố nhé.",
        subPrompt: "★ 爸爸今天: (Hôm nay bố...)",
        options: [
          {key: "A", textChinese: "在家里工作", textVietnamese: "Làm việc ở trong nhà"},
          {key: "B", textChinese: "去公司", textVietnamese: "Đến công ty"},
          {key: "C", textChinese: "去医院", textVietnamese: "Đi bệnh viện"}
        ],
        correctKey: "A",
        explanation: "Bố hôm nay làm việc ở nhà (在家里工作) -> Đáp án A (在家里工作).",
      }
    ],
  },
  {
    lessonNumber: 14,
    titleChinese: '她买了不少衣服',
    titlePinyin: 'Tā mǎile bù shǎo yīfu',
    titleVietnamese: 'Cô ấy đã mua không ít quần áo',
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
        id: "hsk1-l14-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Kàn diànyǐng (Xem phim chiếu rạp)",
        options: [
          {key: "A", textChinese: "看电影", textVietnamese: "Rạp chiếu phim", imageEmoji: "🎬"},
          {key: "B", textChinese: "买衣服", textVietnamese: "Mua sắm quần áo", imageEmoji: "🛍️"},
          {key: "C", textChinese: "坐火车", textVietnamese: "Đoàn tàu hỏa", imageEmoji: "🚆"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"看电影\" (xem phim) -> Tranh A.",
      },
      {
        id: "hsk1-l14-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Mǎi yīfu (Mua quần áo sắm đồ)",
        options: [
          {key: "A", textChinese: "看电影", textVietnamese: "Rạp phim", imageEmoji: "🎬"},
          {key: "B", textChinese: "买衣服", textVietnamese: "Túi xách mua sắm quần áo", imageEmoji: "🛍️"},
          {key: "C", textChinese: "坐火车", textVietnamese: "Tàu hỏa", imageEmoji: "🚆"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"买衣服\" (mua quần áo) -> Tranh B.",
      },
      {
        id: "hsk1-l14-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Zuò huǒchē (Đi tàu hỏa)",
        options: [
          {key: "A", textChinese: "看电影", textVietnamese: "Xem phim", imageEmoji: "🎬"},
          {key: "B", textChinese: "买衣服", textVietnamese: "Mua quần áo", imageEmoji: "🛍️"},
          {key: "C", textChinese: "坐火车", textVietnamese: "Ngồi trên tàu hỏa", imageEmoji: "🚆"}
        ],
        correctKey: "C",
        explanation: "Từ nghe được là \"坐火车\" (đi tàu hỏa) -> Tranh C.",
      },
      {
        id: "hsk1-l14-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ mǎi shénme le? (Bạn đã mua cái gì thế?)",
        options: [
          {key: "A", textChinese: "我买了不少衣服", textPinyin: "wǒ mǎi le bù shǎo yīfu", textVietnamese: "Tôi mua không ít quần áo"},
          {key: "B", textChinese: "电影", textPinyin: "diànyǐng", textVietnamese: "Bộ phim"},
          {key: "C", textChinese: "很好", textPinyin: "hěn hǎo", textVietnamese: "Rất tốt"}
        ],
        correctKey: "A",
        explanation: "Hỏi mua gì \"买什么了\" -> Trả lời \"我买了不少衣服\" (tôi mua không ít quần áo).",
      },
      {
        id: "hsk1-l14-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Huǒchē jǐ diǎn dào? (Tàu hỏa mấy giờ đến?)",
        options: [
          {key: "A", textChinese: "下午 3:00", textPinyin: "xiàwǔ 3:00", textVietnamese: "3 giờ chiều"},
          {key: "B", textChinese: "昨天", textPinyin: "zuótiān", textVietnamese: "Hôm qua"},
          {key: "C", textChinese: "很多", textPinyin: "hěn duō", textVietnamese: "Rất nhiều"}
        ],
        correctKey: "A",
        explanation: "Hỏi thời gian tàu đến \"几点到\" -> Trả lời giờ giấc \"下午 3:00\".",
      },
      {
        id: "hsk1-l14-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Zuótiān nǐ qù kàn diànyǐng le ma? Nǚ: Qù le, diànyǐng fēicháng hǎokàn.",
        options: [
          {key: "A", textChinese: "Rạp chiếu phim màn hình lớn", imageEmoji: "🎬"},
          {key: "B", textChinese: "Mua quần áo", imageEmoji: "🛍️"},
          {key: "C", textChinese: "Tàu hỏa", imageEmoji: "🚆"}
        ],
        correctKey: "A",
        explanation: "Xem phim rạp chiếu phim (看电影) -> Tranh A.",
      },
      {
        id: "hsk1-l14-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ zài nǎr mǎi de zhè jiàn yīfu? Nǚ: Zài shāngdiàn mǎi de, hěn piányi.",
        options: [
          {key: "A", textChinese: "Xem phim", imageEmoji: "🎬"},
          {key: "B", textChinese: "Thử và mua quần áo ở cửa hàng", imageEmoji: "👗"},
          {key: "C", textChinese: "Tàu hỏa", imageEmoji: "🚆"}
        ],
        correctKey: "B",
        explanation: "Mua quần áo ở cửa hàng (买这件衣服) -> Tranh B.",
      },
      {
        id: "hsk1-l14-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ zěnme huí jiā? Nǚ: Wǒ zuò huǒchē huí jiā.",
        options: [
          {key: "A", textChinese: "Xem phim", imageEmoji: "🎬"},
          {key: "B", textChinese: "Mua quần áo", imageEmoji: "👗"},
          {key: "C", textChinese: "Đi tàu hỏa về nhà", imageEmoji: "🚆"}
        ],
        correctKey: "C",
        explanation: "Đi tàu hỏa về nhà (坐火车回家) -> Tranh C.",
      },
      {
        id: "hsk1-l14-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Zuótiān xiàwǔ wǒ hé péngyou qù kàn le yí gè diànyǐng. (Hỏi: 说话人昨天下午做了什么？)",
        options: [
          {key: "A", textChinese: "看电影", textPinyin: "kàn diànyǐng", textVietnamese: "Xem phim"},
          {key: "B", textChinese: "买衣服", textPinyin: "mǎi yīfu", textVietnamese: "Mua quần áo"},
          {key: "C", textChinese: "上学", textPinyin: "shàngxué", textVietnamese: "Đi học"}
        ],
        correctKey: "A",
        explanation: "Chiều qua đi xem một bộ phim (看了一个电影) -> Đáp án A.",
      },
      {
        id: "hsk1-l14-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Māma zài shāngdiàn lǐ mǎi le bù shǎo piàoliang yīfu. (Hỏi: 妈妈买了什么？)",
        options: [
          {key: "A", textChinese: "衣服", textPinyin: "yīfu", textVietnamese: "Quần áo"},
          {key: "B", textChinese: "电脑", textPinyin: "diànnǎo", textVietnamese: "Máy tính"},
          {key: "C", textChinese: "书", textPinyin: "shū", textVietnamese: "Sách"}
        ],
        correctKey: "A",
        explanation: "Mẹ mua không ít quần áo (买了不少衣服) -> Đáp án A.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l14-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "王先生今天生病了。",
        promptPinyin: "Wáng xiānsheng jīntiān shēngbìng le.",
        promptVietnamese: "Ông Vương hôm nay bị ốm rồi.",
        options: [
          {key: "A", textVietnamese: "Ông Vương bị cảm sốt nằm nghỉ", imageEmoji: "👨‍💼🤒"},
          {key: "B", textVietnamese: "Hành khách đọc sách trên tàu hỏa", imageEmoji: "🚆📖"},
          {key: "C", textVietnamese: "Mọi người tụ tập đến chơi nhà", imageEmoji: "🏠👋"}
        ],
        correctKey: "A",
        explanation: "Ông Vương bị ốm (王先生今天生病了) -> Tranh A.",
      },
      {
        id: "hsk1-l14-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "火车上有人读书。",
        promptPinyin: "Huǒchē shang yǒu rén dú shū.",
        promptVietnamese: "Trên tàu hỏa có người đang đọc sách.",
        options: [
          {key: "A", textVietnamese: "Bị ốm", imageEmoji: "👨‍💼🤒"},
          {key: "B", textVietnamese: "Hành khách chăm chú đọc sách trên tàu", imageEmoji: "🚆📖"},
          {key: "C", textVietnamese: "Đến chơi nhà", imageEmoji: "🏠👋"}
        ],
        correctKey: "B",
        explanation: "Trên tàu hỏa đọc sách (火车上有人读书) -> Tranh B.",
      },
      {
        id: "hsk1-l14-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "喂，他们都来我家了。",
        promptPinyin: "Wèi, tāmen dōu lái wǒ jiā le.",
        promptVietnamese: "Alo, mọi người đều đã đến nhà tôi rồi.",
        options: [
          {key: "A", textVietnamese: "Bị ốm", imageEmoji: "👨‍💼🤒"},
          {key: "B", textVietnamese: "Đọc sách trên tàu", imageEmoji: "🚆📖"},
          {key: "C", textVietnamese: "Các bạn đều đã tụ tập đông đủ tại nhà tôi", imageEmoji: "🏠👋"}
        ],
        correctKey: "C",
        explanation: "Đều đến nhà tôi rồi (他们都来我家了) -> Tranh C.",
      },
      {
        id: "hsk1-l14-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "谁去学校了？",
        promptPinyin: "Shéi qù xuéxiào le?",
        promptVietnamese: "Ai đã đến trường học thế?",
        options: [
          {key: "A", textChinese: "王老师去学校了。", textVietnamese: "Thầy giáo Vương đã đến trường rồi."},
          {key: "B", textChinese: "没有，我今天没空。", textVietnamese: "Không, hôm nay tôi không rảnh."},
          {key: "C", textChinese: "我今天上午看了一本书。", textVietnamese: "Sáng nay tôi đã đọc một cuốn sách."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi ai đến trường -> Đáp án A (王老师去学校了).",
      },
      {
        id: "hsk1-l14-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "你下午没去医院吗？",
        promptPinyin: "Nǐ xiàwǔ méi qù yīyuàn ma?",
        promptVietnamese: "Chiều nay bạn không đi bệnh viện à?",
        options: [
          {key: "A", textChinese: "王老师去学校了。", textVietnamese: "Thầy giáo Vương đã đến trường rồi."},
          {key: "B", textChinese: "没有，我今天没空。", textVietnamese: "Không đi, hôm nay tôi không có rảnh."},
          {key: "C", textChinese: "我今天上午看了一本书。", textVietnamese: "Sáng nay tôi đã đọc một cuốn sách."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi sao không đi viện -> Đáp án B (没有，我今天没空).",
      },
      {
        id: "hsk1-l14-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你今天上午都忙了些什么？",
        promptPinyin: "Nǐ jīntiān shàngwǔ dōu máng le xiē shénme?",
        promptVietnamese: "Sáng nay bạn bận rộn những việc gì thế?",
        options: [
          {key: "A", textChinese: "王老师去学校了。", textVietnamese: "Thầy giáo Vương đã đến trường rồi."},
          {key: "B", textChinese: "没有，我今天没空。", textVietnamese: "Không, hôm nay tôi không rảnh."},
          {key: "C", textChinese: "我今天上午看了一本书。", textVietnamese: "Sáng nay tôi bận đọc một cuốn sách."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi sáng nay bận làm gì -> Đáp án C (我今天上午看了一本书).",
      },
      {
        id: "hsk1-l14-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "朋友们（    ）来我家玩了。",
        promptPinyin: "Péngyoumen (    ) lái wǒ jiā wán le.",
        promptVietnamese: "Các bạn đều đã đến nhà tôi chơi rồi.",
        options: [
          {key: "A", textChinese: "茶 (chá)", textVietnamese: "trà"},
          {key: "B", textChinese: "都 (dōu)", textVietnamese: "đều, tất cả"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Phó từ chỉ toàn thể trước động từ \"来\" -> Điền 都 (B).",
      },
      {
        id: "hsk1-l14-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "请喝一杯热（    ）吧。",
        promptPinyin: "Qǐng hē yì bēi rè (    ) ba.",
        promptVietnamese: "Mời uống một tách trà nóng nhé.",
        options: [
          {key: "A", textChinese: "茶 (chá)", textVietnamese: "trà"},
          {key: "B", textChinese: "都 (dōu)", textVietnamese: "đều"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "A",
        explanation: "Đồ uống nóng sau lượng từ \"一杯热\" -> Điền 茶 (A).",
      },
      {
        id: "hsk1-l14-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "服务员，我想问一下，我们的房间号是多少？",
        promptPinyin: "Fúwùyuán, wǒ xiǎng wèn yíxià, wǒmen de fángjiān hào shì duōshao?",
        promptVietnamese: "Bồi bàn ơi, tôi muốn hỏi một chút, số phòng của chúng tôi là bao nhiêu?",
        subPrompt: "★ 说话人想知道什么？ (Người nói muốn biết điều gì?)",
        options: [
          {key: "A", textChinese: "饭店在哪儿", textVietnamese: "Quán ăn/khách sạn ở đâu"},
          {key: "B", textChinese: "怎么坐车", textVietnamese: "Đi xe như thế nào"},
          {key: "C", textChinese: "房间号", textVietnamese: "Số phòng của mình"}
        ],
        correctKey: "C",
        explanation: "Hỏi số phòng của chúng tôi là bao nhiêu (房间号是多少) -> Đáp án C (房间号).",
      },
      {
        id: "hsk1-l14-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "儿子和女儿都上小学了，他们会写很多字了。",
        promptPinyin: "Érzi hé nǚ’ér dōu shàng xiǎoxué le, tāmen huì xiě hěn duō zì le.",
        promptVietnamese: "Con trai và con gái đều đã học tiểu học rồi, chúng nó biết viết rất nhiều chữ.",
        subPrompt: "★ 说话人的两个孩子是： (Hai đứa con của người nói là...)",
        options: [
          {key: "A", textChinese: "小学生", textVietnamese: "Học sinh tiểu học"},
          {key: "B", textChinese: "大学生", textVietnamese: "Sinh viên đại học"},
          {key: "C", textChinese: "医生", textVietnamese: "Bác sĩ"}
        ],
        correctKey: "A",
        explanation: "Đều đã lên tiểu học (都上小学了) -> Là học sinh tiểu học (小学生, A).",
      }
    ],
  },
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
        id: "hsk1-l15-l01",
        part: 1,
        questionNumber: 1,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Fēijīchǎng (Sân bay máy bay)",
        options: [
          {key: "A", textChinese: "飞机场", textVietnamese: "Sân bay máy bay", imageEmoji: "✈️"},
          {key: "B", textChinese: "出租车", textVietnamese: "Xe taxi", imageEmoji: "🚕"},
          {key: "C", textChinese: "北京", textVietnamese: "Quảng trường Bắc Kinh", imageEmoji: "🏛️"}
        ],
        correctKey: "A",
        explanation: "Từ nghe được là \"飞机场\" (sân bay) -> Tranh A.",
      },
      {
        id: "hsk1-l15-l02",
        part: 1,
        questionNumber: 2,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Chūzūchē (Xe taxi)",
        options: [
          {key: "A", textChinese: "飞机场", textVietnamese: "Sân bay", imageEmoji: "✈️"},
          {key: "B", textChinese: "出租车", textVietnamese: "Xe taxi vàng", imageEmoji: "🚕"},
          {key: "C", textChinese: "北京", textVietnamese: "Bắc Kinh", imageEmoji: "🏛️"}
        ],
        correctKey: "B",
        explanation: "Từ nghe được là \"出租车\" (taxi) -> Tranh B.",
      },
      {
        id: "hsk1-l15-l03",
        part: 1,
        questionNumber: 3,
        promptText: "Nghe từ và chọn hình ảnh phù hợp:",
        audioScript: "Běijīng (Thủ đô Bắc Kinh)",
        options: [
          {key: "A", textChinese: "飞机场", textVietnamese: "Sân bay", imageEmoji: "✈️"},
          {key: "B", textChinese: "出租车", textVietnamese: "Taxi", imageEmoji: "🚕"},
          {key: "C", textChinese: "北京", textVietnamese: "Thủ đô Bắc Kinh", imageEmoji: "🏛️"}
        ],
        correctKey: "C",
        explanation: "Từ nghe được là \"北京\" (Bắc Kinh) -> Tranh C.",
      },
      {
        id: "hsk1-l15-l04",
        part: 2,
        questionNumber: 4,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Nǐ jǐ diǎn dào jīchǎng? (Mấy giờ bạn đến sân bay?)",
        options: [
          {key: "A", textChinese: "下午 2:30", textPinyin: "xiàwǔ 2:30", textVietnamese: "2 giờ rưỡi chiều"},
          {key: "B", textChinese: "很高兴", textPinyin: "hěn gāoxìng", textVietnamese: "Rất vui mừng"},
          {key: "C", textChinese: "出租车", textPinyin: "chūzūchē", textVietnamese: "Taxi"}
        ],
        correctKey: "A",
        explanation: "Hỏi thời gian đến sân bay -> Đáp án A (下午 2:30).",
      },
      {
        id: "hsk1-l15-l05",
        part: 2,
        questionNumber: 5,
        promptText: "Nghe câu hỏi và chọn câu trả lời đúng:",
        audioScript: "Wǒmen zěnme qù? (Chúng ta đi bằng cách nào?)",
        options: [
          {key: "A", textChinese: "坐出租车去", textPinyin: "zuò chūzūchē qù", textVietnamese: "Đi taxi đến"},
          {key: "B", textChinese: "见", textPinyin: "jiàn", textVietnamese: "Gặp"},
          {key: "C", textChinese: "很好", textPinyin: "hěn hǎo", textVietnamese: "Rất tốt"}
        ],
        correctKey: "A",
        explanation: "Hỏi phương tiện cách đi -> Đáp án A (坐出租车去).",
      },
      {
        id: "hsk1-l15-l06",
        part: 3,
        questionNumber: 6,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Wǒmen zài nǎr jiàn? Nǚ: Zài Dàxīng jīchǎng jiàn ba.",
        options: [
          {key: "A", textChinese: "Hẹn gặp nhau tại sân bay Đại Hưng", imageEmoji: "✈️"},
          {key: "B", textChinese: "Đi taxi", imageEmoji: "🚕"},
          {key: "C", textChinese: "Ăn cơm", imageEmoji: "🍚"}
        ],
        correctKey: "A",
        explanation: "Hẹn gặp ở sân bay Đại Hưng (大兴机场见) -> Tranh A.",
      },
      {
        id: "hsk1-l15-l07",
        part: 3,
        questionNumber: 7,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Nǐ zěnme qù jīchǎng? Nǚ: Wǒ zuò chūzūchē qù.",
        options: [
          {key: "A", textChinese: "Sân bay", imageEmoji: "✈️"},
          {key: "B", textChinese: "Đi taxi ra sân bay", imageEmoji: "🚕"},
          {key: "C", textChinese: "Xem phim", imageEmoji: "🎬"}
        ],
        correctKey: "B",
        explanation: "Đi taxi (坐出租车去) -> Tranh B.",
      },
      {
        id: "hsk1-l15-l08",
        part: 3,
        questionNumber: 8,
        promptText: "Nghe hội thoại và chọn hình ảnh phù hợp:",
        audioScript: "Nán: Míngtiān nǐ qù nǎr? Nǚ: Wǒ qù Běijīng kàn péngyou.",
        options: [
          {key: "A", textChinese: "Sân bay", imageEmoji: "✈️"},
          {key: "B", textChinese: "Taxi", imageEmoji: "🚕"},
          {key: "C", textChinese: "Thăm thủ đô Bắc Kinh", imageEmoji: "🏛️"}
        ],
        correctKey: "C",
        explanation: "Đến Bắc Kinh thăm bạn bè (去北京看朋友) -> Tranh C.",
      },
      {
        id: "hsk1-l15-l09",
        part: 4,
        questionNumber: 9,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Wǒmen xiàwǔ liǎng diǎn bàn zài Dàxīng jīchǎng jiàn. (Hỏi: 他们在哪里见？)",
        options: [
          {key: "A", textChinese: "大兴机场", textPinyin: "Dàxīng jīchǎng", textVietnamese: "Sân bay Đại Hưng"},
          {key: "B", textChinese: "火车站", textPinyin: "huǒchēzhàn", textVietnamese: "Ga xe lửa"},
          {key: "C", textChinese: "学校", textPinyin: "xuéxiào", textVietnamese: "Trường học"}
        ],
        correctKey: "A",
        explanation: "Hẹn gặp ở sân bay Đại Hưng (大兴机场) -> Đáp án A.",
      },
      {
        id: "hsk1-l15-l10",
        part: 4,
        questionNumber: 10,
        promptText: "Nghe câu và câu hỏi, chọn đáp án đúng:",
        audioScript: "Tā zuò chūzūchē qù jīchǎng le. (Hỏi: 他怎么去机场？)",
        options: [
          {key: "A", textChinese: "坐出租车", textPinyin: "zuò chūzūchē", textVietnamese: "Đi xe taxi"},
          {key: "B", textChinese: "坐火车", textPinyin: "zuò huǒchē", textVietnamese: "Đi tàu hỏa"},
          {key: "C", textChinese: "开车", textPinyin: "kāichē", textVietnamese: "Tự lái xe"}
        ],
        correctKey: "A",
        explanation: "Đi taxi ra sân bay (坐出租车去) -> Đáp án A.",
      }
    ],
    hskMockReading: [
      {
        id: "hsk1-l15-r11",
        part: 1,
        questionNumber: 11,
        promptChinese: "我家有五口人。",
        promptPinyin: "Wǒ jiā yǒu wǔ kǒu rén.",
        promptVietnamese: "Nhà tôi có 5 miệng ăn (5 người).",
        options: [
          {key: "A", textVietnamese: "Cả gia đình 5 người sum vầy", imageEmoji: "👨‍👩‍👧‍👦👶"},
          {key: "B", textVietnamese: "Món ăn sơn hào hải vị ngon", imageEmoji: "🥟🍜"},
          {key: "C", textVietnamese: "Tập nói tiếng Hán", imageEmoji: "🗣️🇨🇳"}
        ],
        correctKey: "A",
        explanation: "Nhà có 5 người (五口人) -> Tranh A.",
      },
      {
        id: "hsk1-l15-r12",
        part: 1,
        questionNumber: 12,
        promptChinese: "这里有好吃的。",
        promptPinyin: "Zhèlǐ yǒu hǎochī de.",
        promptVietnamese: "Ở đây có đồ ăn ngon.",
        options: [
          {key: "A", textVietnamese: "Gia đình 5 người", imageEmoji: "👨‍👩‍👧‍👦👶"},
          {key: "B", textVietnamese: "Bàn đồ ăn ngon lành", imageEmoji: "🥟🍜"},
          {key: "C", textVietnamese: "Tập nói tiếng Hán", imageEmoji: "🗣️🇨🇳"}
        ],
        correctKey: "B",
        explanation: "Đồ ăn ngon (有好吃的) -> Tranh B.",
      },
      {
        id: "hsk1-l15-r13",
        part: 1,
        questionNumber: 13,
        promptChinese: "现在我会说一点儿汉语。",
        promptPinyin: "Xiànzài wǒ huì shuō yìdiǎnr Hànyǔ.",
        promptVietnamese: "Bây giờ tôi có thể nói một chút tiếng Hán.",
        options: [
          {key: "A", textVietnamese: "Gia đình 5 người", imageEmoji: "👨‍👩‍👧‍👦👶"},
          {key: "B", textVietnamese: "Đồ ăn ngon", imageEmoji: "🥟🍜"},
          {key: "C", textVietnamese: "Tự tin nói tiếng Hán giao tiếp", imageEmoji: "🗣️🇨🇳"}
        ],
        correctKey: "C",
        explanation: "Biết nói một chút tiếng Hán (会说一点儿汉语) -> Tranh C.",
      },
      {
        id: "hsk1-l15-r14",
        part: 2,
        questionNumber: 14,
        promptChinese: "你会写几个汉字？",
        promptPinyin: "Nǐ huì xiě jǐ gè Hànzì?",
        promptVietnamese: "Bạn biết viết mấy chữ Hán?",
        options: [
          {key: "A", textChinese: "三十多个。", textVietnamese: "Hơn ba mươi chữ."},
          {key: "B", textChinese: "我弟弟。", textVietnamese: "Em trai tôi."},
          {key: "C", textChinese: "我爱吃米饭。", textVietnamese: "Tôi thích ăn cơm."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "A",
        explanation: "Hỏi số lượng chữ Hán biết viết -> Đáp án A (三十多个).",
      },
      {
        id: "hsk1-l15-r15",
        part: 2,
        questionNumber: 15,
        promptChinese: "谁上中学了？",
        promptPinyin: "Shéi shàng zhōngxué le?",
        promptVietnamese: "Ai đã học lên trung học rồi?",
        options: [
          {key: "A", textChinese: "三十多个。", textVietnamese: "Hơn ba mươi chữ."},
          {key: "B", textChinese: "我弟弟。", textVietnamese: "Em trai tôi."},
          {key: "C", textChinese: "我爱吃米饭。", textVietnamese: "Tôi thích ăn cơm."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "B",
        explanation: "Hỏi ai học trung học -> Đáp án B (我弟弟).",
      },
      {
        id: "hsk1-l15-r16",
        part: 2,
        questionNumber: 16,
        promptChinese: "你爱吃什么？",
        promptPinyin: "Nǐ ài chī shénme?",
        promptVietnamese: "Bạn thích ăn món gì?",
        options: [
          {key: "A", textChinese: "三十多个。", textVietnamese: "Hơn ba mươi chữ."},
          {key: "B", textChinese: "我弟弟。", textVietnamese: "Em trai tôi."},
          {key: "C", textChinese: "我爱吃米饭。", textVietnamese: "Tôi thích ăn cơm trắng."},
          {key: "D", textChinese: "好的，谢谢！", textVietnamese: "Được rồi, cảm ơn!"}
        ],
        correctKey: "C",
        explanation: "Hỏi thích ăn gì -> Đáp án C (我爱吃米饭).",
      },
      {
        id: "hsk1-l15-r17",
        part: 3,
        questionNumber: 17,
        promptChinese: "我们明天一起去（    ）吧。",
        promptPinyin: "Wǒmen míngtiān yìqǐ qù (    ) ba.",
        promptVietnamese: "Ngày mai chúng ta cùng nhau đi Bắc Kinh nhé.",
        options: [
          {key: "A", textChinese: "北京 (Běijīng)", textVietnamese: "Bắc Kinh"},
          {key: "B", textChinese: "电视 (diànshì)", textVietnamese: "tivi"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên gọi"}
        ],
        correctKey: "A",
        explanation: "Địa danh nơi chốn sau \"去\" -> Điền 北京 (A).",
      },
      {
        id: "hsk1-l15-r18",
        part: 3,
        questionNumber: 18,
        promptChinese: "晚上我们在家里看（    ）。",
        promptPinyin: "Wǎnshang wǒmen zài jiā li kàn (    ).",
        promptVietnamese: "Buổi tối chúng tôi ở nhà xem tivi.",
        options: [
          {key: "A", textChinese: "北京 (Běijīng)", textVietnamese: "Bắc Kinh"},
          {key: "B", textChinese: "电视 (diànshì)", textVietnamese: "tivi truyền hình"},
          {key: "C", textChinese: "名字 (míngzi)", textVietnamese: "tên"}
        ],
        correctKey: "B",
        explanation: "Xem truyền hình \"看电视\" -> Điền 电视 (B).",
      },
      {
        id: "hsk1-l15-r19",
        part: 4,
        questionNumber: 19,
        promptChinese: "明天星期天，儿子想去看一个电影。",
        promptPinyin: "Míngtiān Xīngqītiān, érzi xiǎng qù kàn yí gè diànyǐng.",
        promptVietnamese: "Ngày mai là chủ nhật, con trai muốn đi xem một bộ phim.",
        subPrompt: "★ 儿子明天想去： (Con trai ngày mai muốn đi...)",
        options: [
          {key: "A", textChinese: "踢足球", textVietnamese: "Đá bóng"},
          {key: "B", textChinese: "去学校", textVietnamese: "Đến trường"},
          {key: "C", textChinese: "看电影", textVietnamese: "Xem phim"}
        ],
        correctKey: "C",
        explanation: "Muốn đi xem phim (想去看一个电影) -> Đáp án C (看电影).",
      },
      {
        id: "hsk1-l15-r20",
        part: 4,
        questionNumber: 20,
        promptChinese: "下小雨了，小狗非常高兴。",
        promptPinyin: "Xià xiǎoyǔ le, xiǎo gǒu fēicháng gāoxìng.",
        promptVietnamese: "Trời mưa nhỏ rồi, chú chó con vô cùng vui mừng.",
        subPrompt: "★ 今天天气： (Thời tiết hôm nay...)",
        options: [
          {key: "A", textChinese: "下小雨", textVietnamese: "Mưa nhỏ"},
          {key: "B", textChinese: "很热", textVietnamese: "Rất nóng"},
          {key: "C", textChinese: "下大雪", textVietnamese: "Tuyết rơi dày"}
        ],
        correctKey: "A",
        explanation: "Trời mưa nhỏ (下小雨了) -> Đáp án A (下小雨).",
      }
    ],
  }
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
