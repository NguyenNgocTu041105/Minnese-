import { QuizQuestion, HSKLevel } from '../types';

// ==========================================
// HSK 1: PINYIN & GRAMMAR QUESTIONS
// ==========================================
export const HSK1_PINYIN_GRAMMAR: QuizQuestion[] = [
  {
    id: 'pg-hsk1-1',
    type: 'pinyin',
    hskLevel: 1,
    prompt: 'Xác định quy tắc biến điệu thanh 3 chính xác khi hai thanh 3 đi liền nhau trong từ "你好":',
    questionChinese: '你好',
    options: [
      'ní hǎo (thanh 2 + thanh 3)',
      'nǐ hǎo (thanh 3 + thanh 3)',
      'nì hǎo (thanh 4 + thanh 3)',
      'nǐ hào (thanh 3 + thanh 4)',
    ],
    correctAnswer: 'ní hǎo (thanh 2 + thanh 3)',
    explanation: 'Khi hai âm mang thanh 3 (hạ xuống rồi lên) đi liền nhau, âm tiết thứ nhất sẽ tự động biến thành thanh 2 (hướng lên trên), âm tiết thứ hai giữ nguyên thanh 3.',
    usageNotes: 'Quy tắc 3 + 3 -> 2 + 3 áp dụng cho mọi từ 2 âm tiết như: 很好 (hén hǎo), 了解 (liáo jiě), 可以 (ké yǐ). Khi viết Pinyin trên sách chuẩn vẫn ghi dấu gốc (nǐ hǎo) nhưng đọc là (ní hǎo).',
    exampleSentence: {
      chinese: '你好，很高兴认识你！',
      pinyin: 'Ní hǎo, hěn gāoxìng rènshi nǐ!',
      vietnamese: 'Xin chào, rất vui được làm quen với bạn!',
    },
  },
  {
    id: 'pg-hsk1-2',
    type: 'pinyin',
    hskLevel: 1,
    prompt: 'Từ "不是" (không phải) phát âm biến điệu của chữ "不" như thế nào?',
    questionChinese: '不是',
    options: [
      'bú shì (biến thành thanh 2)',
      'bù shì (giữ nguyên thanh 4)',
      'bǔ shì (biến thành thanh 3)',
      'bu shì (thanh nhẹ)',
    ],
    correctAnswer: 'bú shì (biến thành thanh 2)',
    explanation: 'Chữ "不" (bù) vốn mang thanh 4. Khi đứng trước một âm tiết cũng mang thanh 4 (như 是 shì, 对 duì, 要 yào), "不" sẽ biến đổi thành thanh 2 (bú).',
    usageNotes: 'Trước thanh 1, 2, 3 thì "不" giữ nguyên thanh 4 (bù gāo, bù lái, bù hǎo). Chỉ biến thành "bú" khi đứng trước thanh 4: 不是 (bú shì), 不要 (bú yào), 不对 (bú duì).',
    exampleSentence: {
      chinese: '我不是美国人，我是越南人。',
      pinyin: 'Wǒ bú shì Měiguórén, wǒ shì Yuènánrén.',
      vietnamese: 'Tôi không phải người Mỹ, tôi là người Việt Nam.',
    },
  },
  {
    id: 'pg-hsk1-3',
    type: 'pinyin',
    hskLevel: 1,
    prompt: 'Chữ số "一" trong cụm từ "一起" (cùng nhau) và "一个" (một cái) biến điệu như thế nào?',
    questionChinese: '一起 vs 一个',
    options: [
      'yìqǐ (thanh 4) và yí gè (thanh 2)',
      'yīqǐ (thanh 1) và yì gè (thanh 4)',
      'yíqǐ (thanh 2) và yí gè (thanh 2)',
      'yìqǐ (thanh 4) và yī gè (thanh 1)',
    ],
    correctAnswer: 'yìqǐ (thanh 4) và yí gè (thanh 2)',
    explanation: 'Số "一" (yī): Khi đứng trước thanh 1, 2, 3 thì biến thành thanh 4 (yìqǐ, yìtiān, yìnián). Khi đứng trước thanh 4 thì biến thành thanh 2 (yí gè, yíyàng).',
    usageNotes: 'Đọc số đếm nguyên bản (1, 2, 3...) hoặc số thứ tự/số điện thoại thì giữ nguyên thanh 1 (yī, èr, sān...). Khi ghép danh từ/phó từ thì tuân theo biến điệu.',
    exampleSentence: {
      chinese: '我们一起去买一个大西瓜吧。',
      pinyin: 'Wǒmen yìqǐ qù mǎi yí gè dà xīguā ba.',
      vietnamese: 'Chúng ta cùng đi mua một quả dưa hấu lớn nhé.',
    },
  },
  {
    id: 'pg-hsk1-4',
    type: 'pinyin',
    hskLevel: 1,
    prompt: 'Khi viết Pinyin, nguyên âm "ü" đi sau các âm đầu (thanh mẫu) j, q, x, y sẽ được viết như thế nào?',
    questionChinese: '居, 趣, 需, 月',
    options: [
      'Bỏ hai dấu chấm trên đầu, viết thành u (ju, qu, xu, yu)',
      'Giữ nguyên hai dấu chấm (jü, qü, xü, yü)',
      'Đổi thành w (jw, qw, xw, yw)',
      'Bỏ hẳn nguyên âm chỉ giữ thanh mẫu',
    ],
    correctAnswer: 'Bỏ hai dấu chấm trên đầu, viết thành u (ju, qu, xu, yu)',
    explanation: 'Quy tắc chính tả Pinyin: Các thanh mẫu j, q, x và bán nguyên âm y không bao giờ kết hợp với âm u (u uốn môi tròn), mà chỉ đi với ü. Do đó khi viết được lược bỏ hai chấm (ju, qu, xu, yu) nhưng vẫn đọc là ü tròn môi.',
    usageNotes: 'Lưu ý: Với n và l thì vẫn giữ hai chấm (nǚ: 女, lǜ: 绿) để phân biệt với nu và lu (nù: 怒, lù: 路).',
    exampleSentence: {
      chinese: '今天星期六，我们去公园散步。',
      pinyin: 'Jīntiān xīngqīliù, wǒmen qù gōngyuán sànbù.',
      vietnamese: 'Hôm nay thứ Bảy, chúng ta đi công viên dạo bộ.',
    },
  },
  {
    id: 'pg-hsk1-5',
    type: 'pinyin',
    hskLevel: 1,
    prompt: 'Vị trí đặt dấu thanh điệu trong vần có chứa nguyên âm đôi "ui" (như 对 duì) và "iu" (như 六 liù) là ở đâu?',
    questionChinese: '对 (duì) / 六 (liù)',
    options: [
      'Đánh vào nguyên âm đứng sau cùng (ui đánh trên i, iu đánh trên u)',
      'Luôn đánh vào chữ cái đầu tiên',
      'Đánh vào chữ cái ở giữa',
      'Đánh vào chữ cái có âm lượng phát ra dài hơn',
    ],
    correctAnswer: 'Đánh vào nguyên âm đứng sau cùng (ui đánh trên i, iu đánh trên u)',
    explanation: 'Khẩu quyết đánh dấu thanh điệu: "Có a thì đánh trên a, không a tìm o, e; i, u đi liền nhau thì dấu nằm trên chữ đứng sau" (ui đánh trên i -> duì; iu đánh trên u -> liù).',
    usageNotes: 'Thứ tự ưu tiên nguyên âm: a > o > e > i / u / ü. Riêng hai cặp song hành iu và ui thì cứ chữ nào đứng sau thì nhận dấu thanh.',
    exampleSentence: {
      chinese: '你说得很对，六点我们在门口见。',
      pinyin: 'Nǐ shuō de hěn duì, liù diǎn wǒmen zài ménkǒu jiàn.',
      vietnamese: 'Bạn nói rất đúng, 6 giờ chúng ta gặp nhau ở cửa.',
    },
  },
  {
    id: 'pg-hsk1-6',
    type: 'grammar',
    hskLevel: 1,
    prompt: 'Chọn trợ từ kết cấu thích hợp để điền vào chỗ trống: "这___我妈妈送给我的礼物。"',
    questionChinese: '这是我妈妈送给___的礼物。',
    options: ['的', '得', '地', '着'],
    correctAnswer: '的',
    explanation: 'Trợ từ kết cấu "的" (de) dùng giữa Định ngữ và Trung tâm ngữ để biểu thị quan hệ sở hữu hoặc tính chất tu sức (A 的 B: B của A).',
    usageNotes: 'Cấu trúc: Định ngữ + 的 + Danh từ trung tâm. Ví dụ: 我的书 (sách của tôi), 漂亮的衣服 (quần áo đẹp).',
    exampleSentence: {
      chinese: '这是我妈妈送给我的生日礼物。',
      pinyin: 'Zhè shì wǒ māma sòng gěi wǒ de shēngrì lǐwù.',
      vietnamese: 'Đây là món quà sinh nhật mẹ tặng cho tôi.',
    },
  },
  {
    id: 'pg-hsk1-7',
    type: 'grammar',
    hskLevel: 1,
    prompt: 'Trật tự câu hỏi nghi vấn với trợ từ "吗" (ma) trong tiếng Trung như thế nào?',
    questionChinese: '你是老师吗？',
    options: [
      'Câu khẳng định + 吗？ (Đặt ở cuối câu trần thuật)',
      'Đặt "吗" ở đầu câu như chữ "Is/Are" trong tiếng Anh',
      'Đặt "吗" ngay sau đại từ chủ ngữ',
      'Đặt "吗" ở giữa động từ và tân ngữ',
    ],
    correctAnswer: 'Câu khẳng định + 吗？ (Đặt ở cuối câu trần thuật)',
    explanation: 'Trợ từ nghi vấn "吗" luôn đứng ở cuối câu khẳng định để biến cả câu thành câu hỏi Yes/No (Đúng/Không).',
    usageNotes: 'Khi câu đã có đại từ nghi vấn (什么, 谁, 哪儿, 几...) thì tuyệt đối KHÔNG thêm "吗".',
    exampleSentence: {
      chinese: '你是中国留学生吗？',
      pinyin: 'Nǐ shì Zhōngguó liúxuéshēng ma?',
      vietnamese: 'Bạn có phải là du học sinh Trung Quốc không?',
    },
  },
  {
    id: 'pg-hsk1-8',
    type: 'grammar',
    hskLevel: 1,
    prompt: 'Chọn câu phủ định đúng với động từ "有" (có):',
    questionChinese: '我 / 有 / 电脑',
    options: [
      '我没有电脑。(Dùng 没有 để phủ định 有)',
      '我不有电脑。',
      '我不电脑有。',
      '我没是电脑。',
    ],
    correctAnswer: '我没有电脑。(Dùng 没有 để phủ định 有)',
    explanation: 'Động từ "有" chỉ có một dạng phủ định duy nhất là "没有" (hoặc rút gọn là 没). Tuyệt đối không bao giờ nói "不有".',
    usageNotes: 'Ví dụ: 没有钱 (không có tiền), 没有时间 (không có thời gian), 没问题 (không có vấn đề gì).',
    exampleSentence: {
      chinese: '我今天没有课，我们一起去打球吧。',
      pinyin: 'Wǒ jīntiān méiyǒu kè, wǒmen yìqǐ qù dǎqiú ba.',
      vietnamese: 'Hôm nay tôi không có tiết học, chúng mình cùng đi chơi bóng nhé.',
    },
  },
  {
    id: 'pg-hsk1-9',
    type: 'grammar',
    hskLevel: 1,
    prompt: 'Trật tự chỉ thời gian và địa điểm trong câu tiếng Trung tuân theo quy tắc nào?',
    questionChinese: '我昨天在学校学习汉语。',
    options: [
      'Chủ ngữ + Thời gian + Địa điểm + Động từ + Tân ngữ',
      'Chủ ngữ + Động từ + Tân ngữ + Địa điểm + Thời gian',
      'Địa điểm + Động từ + Thời gian + Chủ ngữ',
      'Thời gian + Địa điểm + Tân ngữ + Động từ',
    ],
    correctAnswer: 'Chủ ngữ + Thời gian + Địa điểm + Động từ + Tân ngữ',
    explanation: 'Quy tắc vàng ngữ pháp tiếng Trung: "Làm gì ở đâu khi nào" -> Trạng ngữ thời gian và địa điểm luôn đứng TRƯỚC động từ chính.',
    usageNotes: 'Thời gian có thể đứng trước hoặc sau chủ ngữ (昨天我在学校... / 我昨天在学校...).',
    exampleSentence: {
      chinese: '我们明天上午在图书馆看书。',
      pinyin: 'Wǒmen míngtiān shàngwǔ zài túshūguǎn kànshū.',
      vietnamese: 'Sáng mai chúng tôi đọc sách ở thư viện.',
    },
  },
  {
    id: 'pg-hsk1-10',
    type: 'grammar',
    hskLevel: 1,
    prompt: 'Trợ từ ngữ khí "呢" (ne) trong câu "我喝茶，你呢？" dùng để làm gì?',
    questionChinese: '你呢？',
    options: [
      'Hỏi lại đối phương về cùng một chủ đề (còn... thì sao?)',
      'Hỏi về thời gian',
      'Hỏi về giá tiền',
      'Khẳng định chắc chắn một sự việc',
    ],
    correctAnswer: 'Hỏi lại đối phương về cùng một chủ đề (còn... thì sao?)',
    explanation: 'Trợ từ "呢" theo sau danh từ/đại từ để tạo câu hỏi rút gọn phản hồi ngữ cảnh (Ví dụ: "你呢？" = Còn bạn thì sao?).',
    usageNotes: 'Còn dùng để hỏi vị trí: "我的书呢？" = Sách của tôi đâu rồi?',
    exampleSentence: {
      chinese: '我是越南人，李老师呢？',
      pinyin: 'Wǒ shì Yuènánrén, Lǐ lǎoshī ne?',
      vietnamese: 'Em là người Việt Nam, còn thầy Lý thì sao ạ?',
    },
  },
];

// ==========================================
// HSK 2: PINYIN & GRAMMAR QUESTIONS
// ==========================================
export const HSK2_PINYIN_GRAMMAR: QuizQuestion[] = [
  {
    id: 'pg-hsk2-1',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Chọn trợ từ kết cấu thích hợp: "他跑___非常快，拿了第一名。"',
    questionChinese: '他跑___非常快，拿了第一名。',
    options: ['得', '的', '地', '了'],
    correctAnswer: '得',
    explanation: 'Trợ từ "得" (de) đứng sau Động từ hoặc Tính từ để nối với Bổ ngữ chỉ trạng thái / trình độ (跑得很快, 唱得很好听).',
    usageNotes: 'Công thức: Động từ/Tính từ + 得 + Bổ ngữ trạng thái (rất nhanh, vô cùng tốt...). Không được nhầm với "的" (bổ nghĩa danh từ) và "地" (bổ nghĩa hành động).',
    exampleSentence: {
      chinese: '他汉字写得非常工整漂亮。',
      pinyin: 'Tā hànzì xiě de fēicháng gōngzhěng piàoliang.',
      vietnamese: 'Anh ấy viết chữ Hán vô cùng ngay ngắn và đẹp đẽ.',
    },
  },
  {
    id: 'pg-hsk2-2',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Chọn trợ từ kết cấu thích hợp: "小雨慢慢___走回了家。"',
    questionChinese: '小雨慢慢___走回了家。',
    options: ['地', '的', '得', '过'],
    correctAnswer: '地',
    explanation: 'Trợ từ "地" (de) đứng trước Động từ, làm cầu nối giữa Trạng ngữ chỉ phương thức/tâm trạng với Động từ chính (慢慢地走, 认真地学习).',
    usageNotes: 'Công thức: Tính từ/Trạng từ + 地 + Động từ. Tương đương với đuôi "-ly" trong tiếng Anh hoặc từ "một cách..." trong tiếng Việt.',
    exampleSentence: {
      chinese: '同学们认真地听老师讲课。',
      pinyin: 'Tóngxuémen rènzhēn de tīng lǎoshī jiǎngkè.',
      vietnamese: 'Các bạn học sinh chăm chú chăm chỉ nghe thầy giảng bài.',
    },
  },
  {
    id: 'pg-hsk2-3',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Chọn cặp liên từ biểu thị quan hệ nhượng bộ (mặc dù... nhưng...):',
    questionChinese: '___下着大雨，___他依然按时到校。',
    options: [
      '虽然 ... 但是 ... (Mặc dù ... nhưng mà ...)',
      '因为 ... 所以 ... (Bởi vì ... cho nên ...)',
      '不但 ... 而且 ... (Không những ... mà còn ...)',
      '如果 ... 就 ... (Nếu như ... thì ...)',
    ],
    correctAnswer: '虽然 ... 但是 ... (Mặc dù ... nhưng mà ...)',
    explanation: '"虽然...但是..." là cặp liên từ biểu thị quan hệ chuyển ngoặt / nhượng bộ: Mặc dù vế trước đưa ra tình huống bất lợi nhưng vế sau vẫn đạt được kết quả.',
    usageNotes: 'Vế trước có thể dùng 虽然 hoặc 尽管, vế sau đi kèm 但是, 可是 hoặc 但.',
    exampleSentence: {
      chinese: '虽然汉语很难，但是我非常喜欢学习。',
      pinyin: 'Suīrán Hànyǔ hěn nán, dànshì wǒ fēicháng xǐhuan xuéxí.',
      vietnamese: 'Mặc dù tiếng Hán rất khó, nhưng tôi vô cùng thích học.',
    },
  },
  {
    id: 'pg-hsk2-4',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Chọn cấu trúc câu so sánh hơn chữ "比" (bǐ) chuẩn xác:',
    questionChinese: '他 / 比 / 我 / 高 / 五厘米',
    options: [
      '他比我高五厘米。(A 比 B + Tính từ + Mức chênh lệch)',
      '他比我很高五厘米。',
      '他很高比我五厘米。',
      '比他我高五厘米。',
    ],
    correctAnswer: '他比我高五厘米。(A 比 B + Tính từ + Mức chênh lệch)',
    explanation: 'Cấu trúc câu so sánh chữ 比: A 比 B + Tính từ (+ Bổ ngữ số lượng chỉ mức chênh lệch cụ thể / 一点儿 / 得多). Tuyệt đối KHÔNG dùng các phó từ chỉ mức độ như 很, 非常, 极了 trước tính từ trong câu chữ 比.',
    usageNotes: 'Sai: 他比我很高 (X). Đúng: 他比我高 (V) hoặc 他比我高得多 (V).',
    exampleSentence: {
      chinese: '北京冬天的气温比河内低得多。',
      pinyin: 'Běijīng dōngtiān de qìwēn bǐ Hénèi dī de duō.',
      vietnamese: 'Nhiệt độ mùa đông ở Bắc Kinh thấp hơn Hà Nội rất nhiều.',
    },
  },
  {
    id: 'pg-hsk2-5',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Chọn lượng từ chính xác để điền vào câu: "桌子上放着三___书和两___纸。"',
    questionChinese: '三___书 / 两___纸',
    options: [
      '本 (cuốn/quyển) / 张 (tờ/trang)',
      '个 / 支',
      '条 / 块',
      '件 / 双',
    ],
    correctAnswer: '本 (cuốn/quyển) / 张 (tờ/trang)',
    explanation: 'Lượng từ tiếng Trung đi theo đặc tính hình dạng của danh từ: "本" (běn) dùng cho sách vở có gáy đóng; "张" (zhāng) dùng cho vật có bề mặt phẳng mỏng (giấy, bàn, giường, ảnh, vé).',
    usageNotes: 'Một số lượng từ cốt lõi: 一条鱼/裤子 (vật dài uốn lượn), 一件衣服 (quần áo), 一辆车 (xe cộ), 一支笔 (bút viết).',
    exampleSentence: {
      chinese: '我买了三本书和两张世界地图。',
      pinyin: 'Wǒ mǎi le sān běn shū hé liǎng zhāng shìjiè dìtú.',
      vietnamese: 'Tôi đã mua 3 cuốn sách và 2 tờ bản đồ thế giới.',
    },
  },
  {
    id: 'pg-hsk2-6',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Bổ ngữ kết quả nào biểu thị việc nghe và hiểu được ý nghĩa: "老师说的话你听___了吗？"',
    questionChinese: '你听___了吗？',
    options: ['懂 (hiểu)', '完 (xong)', '到 (được/thấy)', '对 (đúng)'],
    correctAnswer: '懂 (hiểu)',
    explanation: 'Bổ ngữ kết quả "懂" (dǒng) ghép sau động từ 听 (nghe), 看 (nhìn/đọc) để biểu thị việc tiếp thu và thấu hiểu được nội dung (听懂, 看懂).',
    usageNotes: 'Phủ định của bổ ngữ kết quả dùng 没 (hoặc 没有): 没听懂 (chưa nghe hiểu), 没看完 (chưa xem xong). Tuyệt đối không dùng 不.',
    exampleSentence: {
      chinese: '他的发音非常标准，大家都听懂了。',
      pinyin: 'Tā de fāyīn fēicháng biāozhǔn, dàjiā dōu tīngdǒng le.',
      vietnamese: 'Phát âm của anh ấy rất chuẩn, mọi người đều đã nghe hiểu.',
    },
  },
  {
    id: 'pg-hsk2-7',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Trợ từ động thái "过" (guo) trong câu "我去过北京" diễn tả điều gì?',
    questionChinese: '我去过北京。',
    options: [
      'Trải nghiệm / từng làm trong quá khứ',
      'Hành động đang diễn ra',
      'Hành động sắp sửa xảy ra trong tương lai',
      'Mệnh lệnh yêu cầu ai đó làm gì',
    ],
    correctAnswer: 'Trải nghiệm / từng làm trong quá khứ',
    explanation: 'Trợ từ "过" đứng sau động từ để nhấn mạnh một trải nghiệm đã từng xảy ra ít nhất một lần trong quá khứ (từng đi, từng ăn, từng học).',
    usageNotes: 'Phủ định dùng "没(有) + Động từ + 过": 我没去过中国 (Tôi chưa từng đi Trung Quốc).',
    exampleSentence: {
      chinese: '你吃过北京烤鸭吗？味道怎么样？',
      pinyin: 'Nǐ chī guo Běijīng kǎoyā ma? Wèidào zěnmeyàng?',
      vietnamese: 'Bạn đã từng ăn vịt quay Bắc Kinh chưa? Mùi vị thế nào?',
    },
  },
  {
    id: 'pg-hsk2-8',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Cấu trúc biểu thị hành động sắp sửa xảy ra trong tương lai gần:',
    questionChinese: '火车快要开了。',
    options: [
      '快要……了 / 要……了 (Sắp... rồi)',
      '正在……呢',
      '已经……了',
      '一边……一边……',
    ],
    correctAnswer: '快要……了 / 要……了 (Sắp... rồi)',
    explanation: '"快要/就要/要 + Động từ + 了" biểu thị sự việc sắp xảy ra trong thời gian rất ngắn tới.',
    usageNotes: 'Nếu câu có trạng ngữ thời gian cụ thể (ví dụ: 明天, 下周) thì chỉ được dùng "就要...了", KHÔNG dùng "快要...了".',
    exampleSentence: {
      chinese: '天阴了，快要下雨了，我们快回家吧。',
      pinyin: 'Tiān yīn le, kuàiyào xiàyǔ le, wǒmen kuài huíjiā ba.',
      vietnamese: 'Trời râm rồi, sắp mưa rồi, chúng mình mau về nhà thôi.',
    },
  },
  {
    id: 'pg-hsk2-9',
    type: 'pinyin',
    hskLevel: 2,
    prompt: 'Xác định từ có âm uốn lưỡi "er" (儿化 âm) trong khẩu ngữ Bắc Kinh:',
    questionChinese: '哪儿, 这儿, 一点儿',
    options: [
      'Nǎr, zhèr, yìdiǎnr (gắn đuôi r uốn cong lưỡi)',
      'Nǎ er, zhè er, yìdiǎn er (đọc tách rời 2 âm riêng biệt)',
      'Nǎ ren, zhè ren, yìdiǎn ren',
      'Không uốn lưỡi',
    ],
    correctAnswer: 'Nǎr, zhèr, yìdiǎnr (gắn đuôi r uốn cong lưỡi)',
    explanation: 'Âm uốn lưỡi 儿化 (érhuà) trong tiếng Hán kết hợp âm tiết đứng trước với động tác uốn cong đầu lưỡi lên vòm họng trên, tạo thành một âm tiết liền mạch.',
    usageNotes: 'Thường gặp trong các từ chỉ phương vị (这儿, 那儿, 哪儿) hoặc số lượng nhỏ bé, thân mật (一点儿, 玩儿, 花儿).',
    exampleSentence: {
      chinese: '请问，洗手间在哪儿？',
      pinyin: 'Qǐngwèn, xǐshǒujiān zài nǎr?',
      vietnamese: 'Xin hỏi, nhà vệ sinh ở đâu ạ?',
    },
  },
  {
    id: 'pg-hsk2-10',
    type: 'grammar',
    hskLevel: 2,
    prompt: 'Điền liên từ quan hệ nhân quả: "___今天天气很好，___我们去公园野餐。"',
    questionChinese: '___今天天气很好，___我们去公园野餐。',
    options: [
      '因为……所以…… (Bởi vì... cho nên...)',
      '虽然……但是……',
      '如果……就……',
      '不但……而且……',
    ],
    correctAnswer: '因为……所以…… (Bởi vì... cho nên...)',
    explanation: 'Cặp liên từ "因为……所以……" dùng để liên kết vế nguyên nhân (vì sao) và vế kết quả tương ứng.',
    usageNotes: 'Trong khẩu ngữ có thể lược bỏ một trong hai từ (chỉ dùng 因为 hoặc chỉ dùng 所以).',
    exampleSentence: {
      chinese: '因为下大雨，所以运动会推迟了。',
      pinyin: 'Yīnwèi xià dàyǔ, suǒyǐ yùndònghuì tuīchí le.',
      vietnamese: 'Bởi vì trời mưa to, cho nên đại hội thể thao bị hoãn lại.',
    },
  },
];

// ==========================================
// HSK 3: PINYIN & GRAMMAR QUESTIONS
// ==========================================
export const HSK3_PINYIN_GRAMMAR: QuizQuestion[] = [
  {
    id: 'pg-hsk3-1',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Xác định trật tự câu chữ "把" (bǎ) chính xác:',
    questionChinese: '我 / 把 / 作业 / 做完了',
    options: [
      '我把作业做完了。(Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác)',
      '我做完了把作业。',
      '把作业我做完了。',
      '我作业把做完了。',
    ],
    correctAnswer: '我把作业做完了。(Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác)',
    explanation: 'Cấu trúc câu chữ 把: Chủ ngữ + 把 + Đối tượng bị tác động (Tân ngữ) + Động từ + Kết quả/Thay đổi (Bổ ngữ/Thành phần khác). Dùng để nhấn mạnh hành động xử lý và làm thay đổi trạng thái của tân ngữ.',
    usageNotes: 'Lưu ý: Tân ngữ trong câu chữ 把 phải là vật xác định cụ thể. Sau động từ bắt buộc phải có thành phần khác (như 了, 完, 好, 在, 到...).',
    exampleSentence: {
      chinese: '请大家把房间打扫干净。',
      pinyin: 'Qǐng dàjiā bǎ fángjiān dǎsǎo gānjìng.',
      vietnamese: 'Xin mời mọi người dọn dẹp phòng ốc cho sạch sẽ.',
    },
  },
  {
    id: 'pg-hsk3-2',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Chọn câu bị động chữ "被" (bèi) đúng ngữ pháp:',
    questionChinese: '蛋糕 / 被 / 弟弟 / 吃了',
    options: [
      '蛋糕被弟弟吃了。 (Vật bị tác động + 被 + Tác nhân + Động từ + 了)',
      '弟弟被蛋糕吃了。',
      '蛋糕吃了被弟弟。',
      '被弟弟蛋糕吃了。',
    ],
    correctAnswer: '蛋糕被弟弟吃了。 (Vật bị tác động + 被 + Tác nhân + Động từ + 了)',
    explanation: 'Câu bị động chữ 被: Đối tượng chịu tác động (Chủ ngữ) + 被 + Tác nhân thực hiện + Động từ + Kết quả. Tác nhân có thể lược bỏ (蛋糕被吃了).',
    usageNotes: 'Thường dùng để diễn tả sự việc không mong muốn hoặc nhấn mạnh kết quả của đối tượng tiếp nhận hành động.',
    exampleSentence: {
      chinese: '他的手机在公共汽车上被偷了。',
      pinyin: 'Tā de shǒujī zài gōnggòng qìchē shàng bèi tōu le.',
      vietnamese: 'Điện thoại của anh ấy đã bị trộm trên xe buýt công cộng.',
    },
  },
  {
    id: 'pg-hsk3-3',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Phân biệt cách dùng phó từ "又" (yòu) và "再" (zài): Câu nào dùng đúng?',
    questionChinese: '昨天他来了一次，今天___来了。 / 明天请你___来一次。',
    options: [
      'Hành động lặp lại đã xảy ra dùng 又, hành động lặp lại trong tương lai dùng 再',
      'Cả hai đều dùng lẫn lộn không phân biệt',
      'Hành động quá khứ dùng 再, tương lai dùng 又',
      'Chỉ dùng 又 trong câu phủ định',
    ],
    correctAnswer: 'Hành động lặp lại đã xảy ra dùng 又, hành động lặp lại trong tương lai dùng 再',
    explanation: 'Quy tắc vàng: "又" dùng cho hành vi lặp lại ĐÃ XẢY RA (ví dụ: 他又迟到了 - Anh ấy lại đi muộn rồi). "再" dùng cho hành vi lặp lại SẼ XẢY RA ở tương lai (ví dụ: 明天再见 - Ngày mai gặp lại, 请再说一遍 - Xin nhắc lại lần nữa).',
    usageNotes: 'Tránh nhầm lẫn: 又 + Động từ + 了 (đã lặp lại) vs 再 + Động từ (lặp lại sau này).',
    exampleSentence: {
      chinese: '昨天买了一本书，今天他又去书店了。欢迎明天再来！',
      pinyin: 'Zuótiān mǎi le yì běn shū, jīntiān tā yòu qù shūdiàn le. Huānyíng míngtiān zài lái!',
      vietnamese: 'Hôm qua mua 1 cuốn sách, hôm nay anh ấy lại đến hiệu sách. Hoan nghênh mai lại đến!',
    },
  },
  {
    id: 'pg-hsk3-4',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Phân biệt "就" (jiù) và "才" (cái) khi biểu thị thời gian:',
    questionChinese: '他八点上课，七点___到了。/ 他九点___到。',
    options: [
      '就: biểu thị việc xảy ra sớm, nhanh, thuận lợi; 才: biểu thị việc xảy ra muộn, chậm, tốn nhiều thời gian',
      '就 và 才 mang ý nghĩa hoàn toàn giống nhau',
      '就 chỉ dùng cho tương lai, 才 chỉ dùng cho quá khứ',
      '才 biểu thị việc sớm hơn dự định',
    ],
    correctAnswer: '就: biểu thị việc xảy ra sớm, nhanh, thuận lợi; 才: biểu thị việc xảy ra muộn, chậm, tốn nhiều thời gian',
    explanation: 'Phó từ "就" (jiù) mang sắc thái: sớm, mau lẹ, dễ dàng (kèm 了). Phó từ "才" (cái) mang sắc thái: muộn, chậm chạp, vất vả, muộn màng (không đi với 了).',
    usageNotes: 'Ví dụ: 我坐飞机两个小时就到了 (2 tiếng là tới nơi rồi - nhanh). 我坐火车十个小时才到 (10 tiếng mới tới - muộn/lâu).',
    exampleSentence: {
      chinese: '他早上六点就起床了，我八点半才醒。',
      pinyin: 'Tā zǎoshang liù diǎn jiù qǐchuáng le, wǒ bā diǎn bàn cái xǐng.',
      vietnamese: 'Anh ấy 6 giờ sáng đã dậy rồi, còn tôi 8 rưỡi mới tỉnh.',
    },
  },
  {
    id: 'pg-hsk3-5',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Xác định bổ ngữ xu hướng kép đúng để chỉ hành động di chuyển ra phía ngoài về phía người nói:',
    questionChinese: '他从教室里走___了。',
    options: ['出来 (ra ngoài hướng lại gần)', '出去 (ra ngoài hướng ra xa)', '进来 (vào trong)', '回去 (quay về)'],
    correctAnswer: '出来 (ra ngoài hướng lại gần)',
    explanation: 'Bổ ngữ xu hướng kép kết hợp giữa phương hướng (上, 下, 进, 出, 回, 过, 起) và vị trí người nói (来: lại gần người nói, 去: đi xa người nói). Người nói đang ở ngoài phòng nên dùng "出来".',
    usageNotes: 'Nếu người nói ở trong phòng nhìn thấy ai đó đi ra xa thì dùng "走出去". Nếu người nói ở bên ngoài thấy ai đó bước ra thì dùng "走出来".',
    exampleSentence: {
      chinese: '太阳从东方的地平线上升起来了。',
      pinyin: 'Tàiyáng cóng dōngfāng de dìpíngxiàn shàng shēng qǐlai le.',
      vietnamese: 'Mặt trời từ đường chân trời phía đông đã mọc nhô lên.',
    },
  },
  {
    id: 'pg-hsk3-6',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Trong câu có động từ kèm theo tân ngữ, khi dùng bổ ngữ trình độ "得", cần lặp lại động từ như thế nào?',
    questionChinese: '他 / 游泳 / 游得很快',
    options: [
      '他游泳游得很快。(Chủ ngữ + [Động từ + Tân ngữ] + Lặp lại Động từ + 得 + Bổ ngữ)',
      '他游得游泳很快。',
      '他游泳很快得游。',
      '他得游泳游很快。',
    ],
    correctAnswer: '他游泳游得很快。(Chủ ngữ + [Động từ + Tân ngữ] + Lặp lại Động từ + 得 + Bổ ngữ)',
    explanation: 'Khi động từ mang tân ngữ (như 游泳, 唱歌, 跑步, 说汉语), muốn thêm bổ ngữ trình độ "得", bắt buộc phải lặp lại động từ ngay trước "得": Động từ + Tân ngữ + Động từ + 得 + Tính từ/Bổ ngữ.',
    usageNotes: 'Có thể đưa tân ngữ lên đầu làm chủ đề: 汉语他说得非常好.',
    exampleSentence: {
      chinese: '妹妹唱歌唱得非常好听，像百灵鸟一样。',
      pinyin: 'Mèimei chànggē chàng de fēicháng hǎotīng, xiàng bǎilíngniǎo yíyàng.',
      vietnamese: 'Em gái hát bài hát rất hay, giống như chú chim họa mi vậy.',
    },
  },
  {
    id: 'pg-hsk3-7',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Cấu trúc "一边……一边……" (yìbiān... yìbiān...) dùng để biểu thị điều gì?',
    questionChinese: '他一边听音乐，一边做作业。',
    options: [
      'Hai hành động diễn ra song song cùng một thời điểm',
      'Hành động trước sau theo thứ tự',
      'Hành động nguyên nhân kết quả',
      'Hành động so sánh hơn thua',
    ],
    correctAnswer: 'Hai hành động diễn ra song song cùng một thời điểm',
    explanation: '"一边...一边..." nối hai động từ để biểu thị cùng một chủ thể đang tiến hành đồng thời hai hành động cùng lúc.',
    usageNotes: 'Động từ đi sau 一边 thường có độ dài thời gian tương đương nhau (一边吃饭一边聊天).',
    exampleSentence: {
      chinese: '爷爷喜欢一边喝茶一边看早报。',
      pinyin: 'Yéye xǐhuan yìbiān hēchá yìbiān kàn zǎobào.',
      vietnamese: 'Ông nội thích vừa uống trà vừa đọc báo sáng.',
    },
  },
  {
    id: 'pg-hsk3-8',
    type: 'grammar',
    hskLevel: 3,
    prompt: 'Phân biệt cách dùng đại từ nghi vấn "怎么" (zěnme) và "怎么样" (zěnmeyàng):',
    questionChinese: '这个汉字___写？ / 这件衣服___？',
    options: [
      '怎么: hỏi cách thức hành động / nguyên nhân; 怎么样: hỏi tính chất, tình hình hoặc xin ý kiến',
      'Cả hai từ dùng thay thế cho nhau hoàn toàn',
      '怎么 dùng ở cuối câu, 怎么样 dùng trước động từ',
      '怎么样 chỉ dùng để hỏi thời gian',
    ],
    correctAnswer: '怎么: hỏi cách thức hành động / nguyên nhân; 怎么样: hỏi tính chất, tình hình hoặc xin ý kiến',
    explanation: '"怎么 + Động từ" hỏi phương thức (怎么去, 怎么写, 怎么读) hoặc nguyên nhân (你怎么没来?). "怎么样" đứng cuối câu hỏi tính trạng (最近怎么样?) hoặc xin ý kiến (我们去吃火锅，怎么样?).',
    usageNotes: 'Tránh nhầm: 怎么走 (đi đường nào) vs 走得怎么样 (đi thế nào rồi).',
    exampleSentence: {
      chinese: '请问去故宫怎么走？你觉得故宫怎么样？',
      pinyin: 'Qǐngwèn qù Gùgōng zěnme zǒu? Nǐ juéde Gùgōng zěnmeyàng?',
      vietnamese: 'Xin hỏi đi Cố Cung đi đường nào? Bạn thấy Cố Cung thế nào?',
    },
  },
];

// ==========================================
// HSK 4: PINYIN & GRAMMAR QUESTIONS
// ==========================================
export const HSK4_PINYIN_GRAMMAR: QuizQuestion[] = [
  {
    id: 'pg-hsk4-1',
    type: 'grammar',
    hskLevel: 4,
    prompt: 'Chọn từ nối thích hợp chỉ sự tích lũy tăng tiến (không những... mà còn...):',
    questionChinese: '他___汉语说得流利，___还会写一手好书法。',
    options: [
      '不仅 / 不但 ... 而且 / 还 ...',
      '虽然 ... 但是 ...',
      '宁可 ... 也不 ...',
      '一边 ... 一边 ...',
    ],
    correctAnswer: '不仅 / 不但 ... 而且 / 还 ...',
    explanation: 'Cấu trúc "不仅/不但...而且/还..." (Bùjǐn/búdàn... érqiě/hái...) biểu thị mối quan hệ tăng tiến nhiều bậc giữa hai vế câu: vế sau bổ sung một ưu điểm/tính chất vượt trội hơn vế trước.',
    usageNotes: 'Khi hai vế cùng một chủ ngữ, 不但 đặt sau chủ ngữ: 他不但...而且... Khi hai vế khác chủ ngữ, 不但 đặt trước chủ ngữ vế 1.',
    exampleSentence: {
      chinese: '多吃水果蔬菜不仅对身体好，而且能美容养颜。',
      pinyin: 'Duō chī shuǐguǒ shūcài bùjǐn duì shēntǐ hǎo, érqiě néng měiróng yǎngyán.',
      vietnamese: 'Ăn nhiều rau quả trái cây không những tốt cho cơ thể mà còn làm đẹp dưỡng nhan.',
    },
  },
  {
    id: 'pg-hsk4-2',
    type: 'grammar',
    hskLevel: 4,
    prompt: 'Cấu trúc nhấn mạnh "连……都 / 也……" (Lián... dōu/yě...) trong câu "这个问题连小孩子都知道" mang ý nghĩa gì?',
    questionChinese: '连小孩子都知道。',
    options: [
      'Nhấn mạnh trường hợp cực đoan (ngay cả... cũng...)',
      'Nối quan hệ nhân quả',
      'Diễn tả thứ tự thời gian',
      'So sánh ngang bằng',
    ],
    correctAnswer: 'Nhấn mạnh trường hợp cực đoan (ngay cả... cũng...)',
    explanation: '"连 + Thành phần nhấn mạnh + 都/也 + Vị ngữ": Đưa ra một ví dụ cực đoan, điển hình nhất để suy ra những đối tượng thông thường khác đương nhiên cũng như vậy.',
    usageNotes: 'Thường kết hợp với câu phủ định: "他忙得连饭都没时间吃" (Anh ấy bận đến mức ngay cả cơm cũng không có thời gian ăn).',
    exampleSentence: {
      chinese: '这件事太简单了，连初学者都能轻松掌握。',
      pinyin: 'Zhè jiàn shì tài jiǎndān le, lián chūxuézhě dōu néng qīngsōng zhǎngwò.',
      vietnamese: 'Việc này quá đơn giản, ngay cả người mới bắt đầu cũng có thể nắm bắt dễ dàng.',
    },
  },
  {
    id: 'pg-hsk4-3',
    type: 'grammar',
    hskLevel: 4,
    prompt: 'Xác định bổ ngữ khả năng dạng khẳng định và phủ định chính xác của động từ "看懂" (hiểu khi đọc):',
    questionChinese: '看懂 -> Khẳng định vs Phủ định',
    options: [
      '看得懂 (có thể hiểu) / 看不懂 (không thể hiểu)',
      '不看懂 / 能看懂',
      '看不懂 / 看没懂',
      '看懂得 / 看懂不',
    ],
    correctAnswer: '看得懂 (có thể hiểu) / 看不懂 (không thể hiểu)',
    explanation: 'Cấu trúc Bổ ngữ khả năng: Khẳng định = [Động từ + 得 + Bổ ngữ kết quả/xu hướng] (看得懂); Phủ định = [Động từ + 不 + Bổ ngữ kết quả/xu hướng] (看不懂).',
    usageNotes: 'Tuyệt đối KHÔNG dùng "不能看懂" hay "没看懂" để diễn đạt ý năng lực khách quan ở hiện tại/tương lai.',
    exampleSentence: {
      chinese: '这本全中文的小说字太密了，我看不懂。',
      pinyin: 'Zhè běn quán Zhōngwén de xiǎoshuō zì tài mì le, wǒ kàn bu dǒng.',
      vietnamese: 'Cuốn tiểu thuyết toàn tiếng Trung này chữ dày quá, tôi đọc không hiểu được.',
    },
  },
  {
    id: 'pg-hsk4-4',
    type: 'grammar',
    hskLevel: 4,
    prompt: 'Thành ngữ "坚持不懈" (jiānchí bú xiè) có nghĩa là gì?',
    questionChinese: '坚持不懈',
    options: [
      'Kiên trì bền bỉ, không nản lòng thoái chí',
      'Nhìn xa trông rộng, tính toán chu toàn',
      'Bất ngờ bừng tỉnh, hiểu ra chân lý',
      'Tùy cơ ứng biến, biến hóa khôn lường',
    ],
    correctAnswer: 'Kiên trì bền bỉ, không nản lòng thoái chí',
    explanation: '"坚持不懈" (jiānchí bú xiè): 坚持 là giữ vững kiên định, 不懈 là không lơi lỏng, không mệt mỏi buông xuôi. Thành ngữ ca ngợi tinh thần kiên trì học tập và làm việc liên tục đến cùng.',
    usageNotes: 'Thường dùng làm vị ngữ, định ngữ hoặc trạng ngữ trong văn viết và phát biểu trang trọng.',
    exampleSentence: {
      chinese: '经过三年坚持不懈的努力，他终于通过了HSK 6级考试。',
      pinyin: 'Jīngguò sān nián jiānchí bú xiè de nǔlì, tā zhōngyú tōngguò le HSK 6 jí kǎoshì.',
      vietnamese: 'Trải qua 3 năm nỗ lực kiên trì bền bỉ, anh ấy cuối cùng đã đỗ kỳ thi HSK cấp 6.',
    },
  },
  {
    id: 'pg-hsk4-5',
    type: 'grammar',
    hskLevel: 4,
    prompt: 'Phó từ "究竟" (jiūjìng) trong câu "你究竟去不去？" mang sắc thái ngữ khí gì?',
    questionChinese: '你究竟去不去？',
    options: [
      'Rốt cuộc / rốt cục (Truy cứu tận cùng, nhấn mạnh sắc thái bức bách muốn biết rõ câu trả lời)',
      'Có lẽ / chắc là',
      'Đột nhiên / bất ngờ',
      'Thường xuyên / định kỳ',
    ],
    correctAnswer: 'Rốt cuộc / rốt cục (Truy cứu tận cùng, nhấn mạnh sắc thái bức bách muốn biết rõ câu trả lời)',
    explanation: '"究竟" (jiūjìng) đồng nghĩa với "到底", dùng trong câu nghi vấn để nhấn mạnh sự truy cứu đến cùng chân tướng sự việc.',
    usageNotes: 'Lưu ý: "究竟" không dùng trong câu hỏi lựa chọn không xác định nếu không mang ngữ khí truy hỏi.',
    exampleSentence: {
      chinese: '这台机器究竟出了什么故障？我们必须尽快查明。',
      pinyin: 'Zhè tái jīqì jiūjìng chū le shénme gùzhàng? Wǒmen bìxū jǐnkuài chámíng.',
      vietnamese: 'Cỗ máy này rốt cuộc đã gặp phải sự cố gì? Chúng ta phải nhanh chóng làm rõ.',
    },
  },
];

// ==========================================
// HSK 5: PINYIN & GRAMMAR QUESTIONS
// ==========================================
export const HSK5_PINYIN_GRAMMAR: QuizQuestion[] = [
  {
    id: 'pg-hsk5-1',
    type: 'grammar',
    hskLevel: 5,
    prompt: 'Cặp liên từ "哪怕……也……" (Nǎpà... yě...) biểu thị mối quan hệ gì?',
    questionChinese: '哪怕遇到再大的困难，我们也要勇往直前。',
    options: [
      'Giả thiết nhượng bộ tột cùng (Cho dù / dẫu cho... thì cũng...)',
      'Điều kiện duy nhất (Chỉ khi... mới...)',
      'Nguyên nhân và kết quả chắc chắn',
      'Lựa chọn loại trừ lẫn nhau',
    ],
    correctAnswer: 'Giả thiết nhượng bộ tột cùng (Cho dù / dẫu cho... thì cũng...)',
    explanation: '"哪怕……也……" đưa ra một giả thiết trong tình huống xấu nhất, khắc nghiệt nhất, nhưng vế sau vẫn khẳng định hành động và quyết tâm không hề thay đổi.',
    usageNotes: 'Đồng nghĩa với "即使……也……", "就算……也……".',
    exampleSentence: {
      chinese: '哪怕只有百分之一的希望，我们也要尽百分之百的努力。',
      pinyin: 'Nǎpà zhǐyǒu bǎifēnzhīyī de xīwàng, wǒmen yě yào jìn bǎifēnzhībǎi de nǔlì.',
      vietnamese: 'Dẫu cho chỉ có 1% hy vọng, chúng ta cũng phải dốc 100% nỗ lực.',
    },
  },
  {
    id: 'pg-hsk5-2',
    type: 'grammar',
    hskLevel: 5,
    prompt: 'Phân biệt cặp từ gần nghĩa "考查" (kǎochá) và "考察" (kǎochá):',
    questionChinese: '考查 vs 考察',
    options: [
      '考查: khảo sát kiểm tra trình độ/kiến thức; 考察: khảo sát thực địa/thực tế hoặc quan sát đánh giá cán bộ',
      'Cả hai từ đồng nghĩa hoàn toàn không có điểm khác biệt',
      '考查 chỉ dùng cho địa lý, 考察 chỉ dùng cho trường học',
      '考察 dùng cho thi cử trên giấy',
    ],
    correctAnswer: '考查: khảo sát kiểm tra trình độ/kiến thức; 考察: khảo sát thực địa/thực tế hoặc quan sát đánh giá cán bộ',
    explanation: '"考查" (bộ Khảo + Tra): Dùng tiêu chuẩn quy định để kiểm tra năng lực, kết quả học tập (考查学生成绩). "考察" (bộ Khảo + Sát): Đến tận nơi thực tế điều tra, nghiên cứu khoa học hoặc theo dõi phẩm chất (考察市场, 实地考察).',
    usageNotes: 'Mẹo nhớ: Có chữ 察 (quan sát) -> Đến tận nơi nhìn tận mắt.',
    exampleSentence: {
      chinese: '专家组前往当地考察生态环境，并考查了相关技术人员的专业水平。',
      pinyin: 'Zhuānjiāzǔ qiánwǎng dāngdì kǎochá shēngtài huánjìng, bìng kǎochá le xiāngguān jìshù rényuán de zhuānyè shuǐpíng.',
      vietnamese: 'Đoàn chuyên gia đã đến địa phương khảo sát môi trường sinh thái, đồng thời kiểm tra trình độ chuyên môn của các kỹ thuật viên liên quan.',
    },
  },
  {
    id: 'pg-hsk5-3',
    type: 'grammar',
    hskLevel: 5,
    prompt: 'Liên từ "从而" (cóng\'ér) trong văn viết tiếng Hán dùng để làm gì?',
    questionChinese: '我们改进了生产工艺，从而大幅降低了能耗。',
    options: [
      'Biểu thị từ tiền đề vế trước mà dẫn đến kết quả hoặc mục đích ở vế sau (Do đó / từ đó mà)',
      'Biểu thị quan hệ nhượng bộ trái ngược',
      'Biểu thị sự lựa chọn giữa hai phương án',
      'Chỉ thời gian trong quá khứ',
    ],
    correctAnswer: 'Biểu thị từ tiền đề vế trước mà dẫn đến kết quả hoặc mục đích ở vế sau (Do đó / từ đó mà)',
    explanation: '"从而" là liên từ văn viết cao cấp nối hai vế câu: vế trước nêu phương pháp/hành động, vế sau nêu kết quả tất yếu hoặc mục tiêu đạt được.',
    usageNotes: 'Không đứng ở đầu câu tuyệt đối; thường đứng đầu vế câu thứ hai.',
    exampleSentence: {
      chinese: '合理规划时间不仅能提高工作效率，从而减轻心理压力。',
      pinyin: 'Hélǐ guīhuà shíjiān bùjǐn néng tígāo gōngzuò xiàolǜ, cóng\'ér jiǎnqīng xīnlǐ yālì.',
      vietnamese: 'Quy hoạch thời gian hợp lý không những nâng cao hiệu suất làm việc mà từ đó còn giảm bớt áp lực tâm lý.',
    },
  },
  {
    id: 'pg-hsk5-4',
    type: 'grammar',
    hskLevel: 5,
    prompt: 'Thành ngữ "迫不及待" (pò bù jí dài) mang ý nghĩa chính xác là:',
    questionChinese: '迫不及待',
    options: [
      'Nôn nóng, vội vã không thể chờ đợi thêm được nữa',
      'Bị ép buộc làm việc trái ý muốn',
      'Bình tĩnh ung dung tự tại',
      'Dừng lại nghỉ ngơi giữa chừng',
    ],
    correctAnswer: 'Nôn nóng, vội vã không thể chờ đợi thêm được nữa',
    explanation: '"迫不及待" (pò bù jí dài): 迫 là cấp bách, 及 là kịp, 待 là chờ đợi. Miêu tả tâm trạng quá hào hứng, nôn nóng muốn thực hiện ngay việc gì đó mà không thể trì hoãn.',
    usageNotes: 'Thường làm trạng ngữ: 迫不及待地打开礼物 (Nôn nóng mở món quà ra).',
    exampleSentence: {
      chinese: '一放学，孩子们就迫不及待地跑向游乐场。',
      pinyin: 'Yí fàngxué, háizimen jiù pòbùjídài de pǎoxiàng yóulèchǎng.',
      vietnamese: 'Vừa tan học, bọn trẻ đã nôn nóng không chờ nổi chạy ngay về phía sân chơi.',
    },
  },
];

// ==========================================
// HSK 6: PINYIN & GRAMMAR QUESTIONS
// ==========================================
export const HSK6_PINYIN_GRAMMAR: QuizQuestion[] = [
  {
    id: 'pg-hsk6-1',
    type: 'grammar',
    hskLevel: 6,
    prompt: 'Cấu trúc cổ văn "固然……但是 / 也……" (Gùrán... dànshì...) diễn đạt ý nghĩa gì?',
    questionChinese: '物质生活固然重要，但精神世界的丰富同样不可或缺。',
    options: [
      'Thừa nhận một sự thật hiển nhiên ở vế trước nhưng nhấn mạnh trọng điểm đối lập ở vế sau (Dẫu rằng / vốn dĩ... nhưng mà...)',
      'Khẳng định vế trước sai hoàn toàn',
      'Giải thích nguồn gốc lịch sử',
      'Nêu điều kiện bắt buộc',
    ],
    correctAnswer: 'Thừa nhận một sự thật hiển nhiên ở vế trước nhưng nhấn mạnh trọng điểm đối lập ở vế sau (Dẫu rằng / vốn dĩ... nhưng mà...)',
    explanation: '"固然" (gùrán) biểu thị sự thừa nhận tính hợp lý của một sự thật trước, sau đó dùng "但是/可是" để chuyển ý nhấn mạnh khía cạnh quan trọng hơn.',
    usageNotes: 'Sắc thái trang trọng, thường xuất hiện trong các bài bình luận thời sự, xã luận và đề thi HSK 6.',
    exampleSentence: {
      chinese: '追求经济效益固然必要，但绝不能以牺牲生态环境为代价。',
      pinyin: 'Zhuīqiú jīngjì xiàoyì gùrán bìyào, dàn jué bùnéng yǐ xīshēng shēngtài huánjìng wéi dàijià.',
      vietnamese: 'Mưu cầu hiệu quả kinh tế dẫu rằng cần thiết, nhưng tuyệt đối không thể đánh đổi bằng sự hy sinh môi trường sinh thái.',
    },
  },
  {
    id: 'pg-hsk6-2',
    type: 'grammar',
    hskLevel: 6,
    prompt: 'Thành ngữ "潜移默化" (qián yí mò huà) miêu tả hiện tượng gì?',
    questionChinese: '潜移默化',
    options: [
      'Sự ảnh hưởng, thấm nhuần một cách tự nhiên, âm thầm và vô hình theo thời gian',
      'Sự thay đổi đột ngột chớp nhoáng',
      'Che giấu tội lỗi một cách kín đáo',
      'Học vẹt không hiểu bản chất',
    ],
    correctAnswer: 'Sự ảnh hưởng, thấm nhuần một cách tự nhiên, âm thầm và vô hình theo thời gian',
    explanation: '"潜移默化" (qián yí mò huà): 潜 là ngầm, 默 là lặng lẽ. Miêu tả tư tưởng, phẩm chất hay tính cách của con người bị môi trường xung quanh hun đúc và thay đổi một cách tinh tế không tự nhận biết.',
    usageNotes: 'Ví dụ: 优秀的文艺作品对青少年的品格塑造起着潜移默化的作用。',
    exampleSentence: {
      chinese: '良好的家庭环境对孩子的性格成长有着潜移默化的深远影响。',
      pinyin: 'Liánghǎo de jiātíng huánjìng duì háizi de xìnggé chéngzhǎng yǒuzhe qiányímòhuà de shēnyuǎn yǐngxiǎng.',
      vietnamese: 'Môi trường gia đình tốt có ảnh hưởng sâu sắc, thấm nhuần tự nhiên đối với sự trưởng thành nhân cách của trẻ.',
    },
  },
  {
    id: 'pg-hsk6-3',
    type: 'grammar',
    hskLevel: 6,
    prompt: 'Cụm từ "毋庸置疑" (wú yōng zhì yí) tương đương với nghĩa nào sau đây?',
    questionChinese: '毋庸置疑',
    options: [
      'Không cần phải nghi ngờ, rõ ràng rành rành chắc chắn 100%',
      'Cần phải xem xét thêm nhiều khía cạnh',
      'Còn nhiều điểm đáng ngờ chưa rõ',
      'Tùy thuộc vào may rủi',
    ],
    correctAnswer: 'Không cần phải nghi ngờ, rõ ràng rành rành chắc chắn 100%',
    explanation: '"毋庸置疑" (wú yōng zhì yí): 毋庸 là không cần, 置疑 là hoài nghi. Diễn tả một chân lý hoặc sự thật hiển nhiên không còn bất kỳ kẽ hở nào để nghi ngờ.',
    usageNotes: 'Thường dùng làm trạng ngữ hoặc vị ngữ mở đầu luận điểm đanh thép.',
    exampleSentence: {
      chinese: '科技创新对推动人类文明进步的作用是毋庸置疑的。',
      pinyin: 'Kējì chuàngxīn duì tuīdòng rénlèi wénmíng jìnbù de zuòyòng shì wúyōngzhìyí de.',
      vietnamese: 'Vai trò của đổi mới công nghệ đối với việc thúc đẩy tiến bộ văn minh nhân loại là điều không thể nghi ngờ.',
    },
  },
];

// Combine all Pinyin & Grammar into HSK mapping
export const CURATED_PINYIN_GRAMMAR_BY_HSK: Record<HSKLevel, QuizQuestion[]> = {
  1: HSK1_PINYIN_GRAMMAR,
  2: HSK2_PINYIN_GRAMMAR,
  3: HSK3_PINYIN_GRAMMAR,
  4: HSK4_PINYIN_GRAMMAR,
  5: HSK5_PINYIN_GRAMMAR,
  6: HSK6_PINYIN_GRAMMAR,
};

export const CURATED_PINYIN_GRAMMAR_QUESTIONS: QuizQuestion[] = [
  ...HSK1_PINYIN_GRAMMAR,
  ...HSK2_PINYIN_GRAMMAR,
  ...HSK3_PINYIN_GRAMMAR,
  ...HSK4_PINYIN_GRAMMAR,
  ...HSK5_PINYIN_GRAMMAR,
  ...HSK6_PINYIN_GRAMMAR,
];

// ==========================================
// LISTENING QUESTIONS BY HSK LEVEL
// ==========================================
export const HSK1_LISTENING: QuizQuestion[] = [
  {
    id: 'list-hsk1-1',
    type: 'listening',
    hskLevel: 1,
    prompt: 'Nghe đoạn âm thanh và chọn chữ Hán có phiên âm tương ứng:',
    audioText: '谢谢你',
    options: ['谢谢你 (xièxie nǐ)', '对不起 (duìbuqǐ)', '没关系 (méi guānxi)', '不客气 (bú kèqi)'],
    correctAnswer: '谢谢你 (xièxie nǐ)',
    explanation: 'Âm đọc chuẩn là "xièxie nǐ" (Cảm ơn bạn). "谢谢" là động từ cảm ơn mang thanh 4 + thanh nhẹ.',
    usageNotes: 'Khi ai đó nói "谢谢你", cách đáp lại lịch sự là "不客气" (bú kèqi - đừng khách khí) hoặc "不用谢" (bú yòng xiè - không cần cảm ơn).',
    exampleSentence: {
      chinese: '谢谢你帮我借这本书。',
      pinyin: 'Xièxie nǐ bāng wǒ jiè zhè běn shū.',
      vietnamese: 'Cảm ơn bạn đã giúp tôi mượn cuốn sách này.',
    },
  },
  {
    id: 'list-hsk1-2',
    type: 'listening',
    hskLevel: 1,
    prompt: 'Nghe âm thanh và xác định cụm từ chỉ thời gian:',
    audioText: '明天上午九点',
    options: ['明天上午九点 (9 giờ sáng mai)', '昨天下午九点 (9 giờ tối qua)', '今天中午十二点 (12 giờ trưa nay)', '明天晚上八点 (8 giờ tối mai)'],
    correctAnswer: '明天上午九点 (9 giờ sáng mai)',
    explanation: 'Đoạn audio đọc: "明天 (míngtiān - ngày mai) 上午 (shàngwǔ - buổi sáng) 九点 (jiǔ diǎn - 9 giờ)".',
    usageNotes: 'Trật tự biểu đạt thời gian tiếng Trung luôn đi từ đơn vị LỚN đến đơn vị NHỎ: Năm -> Tháng -> Ngày -> Buổi -> Giờ -> Phút.',
    exampleSentence: {
      chinese: '我们约定明天上午九点在图书馆见。',
      pinyin: 'Wǒmen yuēdìng míngtiān shàngwǔ jiǔ diǎn zài túshūguǎn jiàn.',
      vietnamese: 'Chúng tôi hẹn 9 giờ sáng mai gặp nhau ở thư viện.',
    },
  },
  {
    id: 'list-hsk1-3',
    type: 'listening',
    hskLevel: 1,
    prompt: 'Nghe phát âm và chọn số điện thoại chính xác:',
    audioText: '一三八零一二三四五六七',
    options: [
      '138-0123-4567 (yī sān bā líng yāo èr sān sì wǔ liù qī)',
      '138-0123-8888',
      '139-0123-4567',
      '138-9999-4567',
    ],
    correctAnswer: '138-0123-4567 (yī sān bā líng yāo èr sān sì wǔ liù qī)',
    explanation: 'Trong số điện thoại hoặc số phòng, số 1 thường được đọc là "yāo" để tránh nhầm lẫn âm thanh với số 7 (qī).',
    usageNotes: 'Quy tắc đọc dãy số: Số 1 = yāo, Số 0 = líng, Số 2 = èr (không dùng liǎng khi đọc số điện thoại).',
    exampleSentence: {
      chinese: '请记一下我的手机号码：13801234567。',
      pinyin: 'Qǐng jì yíxià wǒ de shǒujī hàomǎ: yīsānbā líng yāo èr sān sì wǔ liù qī.',
      vietnamese: 'Xin hãy ghi lại số điện thoại của tôi: 138-0123-4567.',
    },
  },
  {
    id: 'list-hsk1-4',
    type: 'listening',
    hskLevel: 1,
    prompt: 'Nghe đoạn hội thoại và chọn nghề nghiệp được nhắc tới:',
    audioText: '他是李老师，他是中国人。',
    options: ['Giáo viên (老师)', 'Bác sĩ (医生)', 'Học sinh (学生)', 'Tài xế (司机)'],
    correctAnswer: 'Giáo viên (老师)',
    explanation: 'Đoạn audio đọc: "李老师" (Thầy giáo Lý), nghề nghiệp là 老师 (giáo viên).',
    usageNotes: 'Trong tiếng Trung, chức danh hoặc nghề nghiệp đặt sau họ: 李老师, 王医生, 张经理.',
    exampleSentence: {
      chinese: '李老师教我们汉语口语。',
      pinyin: 'Lǐ lǎoshī jiāo wǒmen Hànyǔ kǒuyǔ.',
      vietnamese: 'Thầy Lý dạy chúng tôi khẩu ngữ tiếng Hán.',
    },
  },
];

export const HSK2_LISTENING: QuizQuestion[] = [
  {
    id: 'list-hsk2-1',
    type: 'listening',
    hskLevel: 2,
    prompt: 'Nghe đoạn hội thoại và chọn phản xạ trả lời thích hợp:',
    audioText: '请问，去火车站怎么走？',
    options: [
      '一直往前走，在红绿灯处右拐。(Đi thẳng về phía trước, ở ngã rẽ đèn xanh đỏ rẽ phải)',
      '今天天气非常好。',
      '我已经吃过早饭了。',
      '这件衣服两百块钱。',
    ],
    correctAnswer: '一直往前走，在红绿灯处右拐。(Đi thẳng về phía trước, ở ngã rẽ đèn xanh đỏ rẽ phải)',
    explanation: 'Câu hỏi là "请问，去火车站怎么走？" (Xin hỏi, đi đến ga xe lửa đi như thế nào?). Câu trả lời phù hợp nhất là chỉ đường dẫn lối.',
    usageNotes: 'Từ khóa chỉ đường: 一直 (cứ, thẳng), 往前走 (đi về phía trước), 往右拐 (rẽ phải), 往左拐 (rẽ trái), 红绿灯 (đèn giao thông).',
    exampleSentence: {
      chinese: '往前直走两百米就是地铁站。',
      pinyin: 'Wǎng qián zhí zǒu liǎng bǎi mǐ jiù shì dìtiězhàn.',
      vietnamese: 'Đi thẳng về phía trước 200m là trạm tàu điện ngầm.',
    },
  },
  {
    id: 'list-hsk2-2',
    type: 'listening',
    hskLevel: 2,
    prompt: 'Nghe đoạn hội thoại mua sắm và xác định giá tiền:',
    audioText: '这件苹果多少钱一斤？五块钱一斤，买三斤算你十三块。',
    options: [
      '1 cân giá 5 tệ, mua 3 cân tính 13 tệ',
      '1 cân giá 13 tệ, mua 3 cân 5 tệ',
      '1 cân giá 50 tệ',
      '3 cân giá 30 tệ',
    ],
    correctAnswer: '1 cân giá 5 tệ, mua 3 cân tính 13 tệ',
    explanation: 'Người bán nói: "五块钱一斤 (5 tệ/cân), 买三斤算你十三块 (mua 3 cân tính bạn 13 tệ - bớt 2 tệ)".',
    usageNotes: 'Trong khẩu ngữ buôn bán ở Trung Quốc, 1 cân (一斤 - yì jīn) bằng 500 gram (nửa kg). Tiền tệ khẩu ngữ dùng "块" (kuài) thay vì "元" (yuán).',
    exampleSentence: {
      chinese: '老板，西瓜怎么卖？便宜一点吧！',
      pinyin: 'Lǎobǎn, xīguā zěnme mài? Piányi yìdiǎnr ba!',
      vietnamese: 'Ông chủ, dưa hấu bán thế nào? Rẻ một chút đi!',
    },
  },
  {
    id: 'list-hsk2-3',
    type: 'listening',
    hskLevel: 2,
    prompt: 'Nghe và xác định hoạt động đang diễn ra:',
    audioText: '妈妈正在厨房里准备丰盛的晚餐。',
    options: [
      'Mẹ đang ở trong bếp chuẩn bị bữa tối thịnh soạn',
      'Mẹ đang ở ngoài sân tưới hoa',
      'Mẹ đang đi siêu thị mua sắm',
      'Mẹ đang xem tivi trong phòng khách',
    ],
    correctAnswer: 'Mẹ đang ở trong bếp chuẩn bị bữa tối thịnh soạn',
    explanation: 'Từ khóa: "厨房" (chúfáng - nhà bếp), "准备" (zhǔnbèi - chuẩn bị), "丰盛的晚餐" (fēngshèng de wǎncān - bữa tối thịnh soạn phong phú).',
    usageNotes: '"正在... (zhèngzài)" là phó từ chỉ hành động đang tiếp diễn trong hiện tại.',
    exampleSentence: {
      chinese: '爸爸正在书房里聚精会神地看书。',
      pinyin: 'Bàba zhèngzài shūfáng lǐ jùjīnghuìshén de kànshū.',
      vietnamese: 'Bố đang ở trong phòng đọc sách chăm chú theo dõi cuốn sách.',
    },
  },
  {
    id: 'list-hsk2-4',
    type: 'listening',
    hskLevel: 2,
    prompt: 'Nghe câu cảm thán và chọn thái độ của người nói:',
    audioText: '太棒了！我们终于赢得了足球比赛的冠军！',
    options: [
      'Vô cùng phấn khích, hào hứng và tự hào vì vô địch giải bóng đá',
      'Thất vọng vì bị thua trận đấu',
      'Tức giận vì trọng tài xử ép',
      'Thờ ơ không quan tâm kết quả',
    ],
    correctAnswer: 'Vô cùng phấn khích, hào hứng và tự hào vì vô địch giải bóng đá',
    explanation: 'Cụm từ cảm thán: "太棒了" (tài bàng le - quá tuyệt vời!), "赢得了冠军" (yíngdé le guànjūn - đã giành được ngôi vô địch).',
    usageNotes: 'Cấu trúc "太...了" (tài... le) thường dùng để biểu thị sự tán thưởng và cảm xúc mãnh liệt.',
    exampleSentence: {
      chinese: '这次旅行太棒了，我们玩得非常开心！',
      pinyin: 'Zhè cì lǚxíng tài bàng le, wǒmen wán de fēicháng kāixīn!',
      vietnamese: 'Chuyến du lịch này quá tuyệt vời, chúng tôi chơi rất vui vẻ!',
    },
  },
];

export const HSK3_LISTENING: QuizQuestion[] = [
  {
    id: 'list-hsk3-1',
    type: 'listening',
    hskLevel: 3,
    prompt: 'Nghe câu thành ngữ và chọn ý nghĩa tương ứng:',
    audioText: '胸有成竹',
    options: [
      'Tự tin, đã có kế hoạch trù tính sẵn và nắm chắc phần thắng trong lòng',
      'Lo lắng bồn chồn đứng ngồi không yên',
      'Bất ngờ bừng tỉnh ngộ',
      'Chăm chỉ ngày đêm không ngừng nghỉ',
    ],
    correctAnswer: 'Tự tin, đã có kế hoạch trù tính sẵn và nắm chắc phần thắng trong lòng',
    explanation: '"胸有成竹" (xiōng yǒu chéng zhú): Nghĩa đen là trước khi vẽ cây trúc thì trong lồng ngực đã có hình ảnh hoàn chỉnh của cây trúc. Nghĩa bóng là đã chuẩn bị kỹ lưỡng và đầy tự tin.',
    usageNotes: 'Thường dùng để mô tả phong thái bình tĩnh, nắm chắc chiến thắng trước khi bước vào kỳ thi, phỏng vấn hoặc đàm phán quan trọng.',
    exampleSentence: {
      chinese: '对于这次演讲比赛，他早已胸有成竹。',
      pinyin: 'Duìyú zhè cì yǎnjiǎng bǐsài, tā zǎoyǐ xiōngyǒuchéngzhú.',
      vietnamese: 'Đối với cuộc thi hùng biện lần này, anh ấy đã chuẩn bị đầy tự tin trong lòng.',
    },
  },
  {
    id: 'list-hsk3-2',
    type: 'listening',
    hskLevel: 3,
    prompt: 'Nghe đoạn thông báo tại sân bay và chọn nội dung thông báo:',
    audioText: '各位旅客请注意，飞往北京的CA1234次航班现在开始登机。',
    options: [
      'Chuyến bay CA1234 bay đến Bắc Kinh bắt đầu cho hành khách lên máy bay',
      'Chuyến bay CA1234 bị hoãn do thời tiết xấu',
      'Chuyến bay CA1234 đã hạ cánh an toàn',
      'Hành khách hủy vé chuyến bay CA1234',
    ],
    correctAnswer: 'Chuyến bay CA1234 bay đến Bắc Kinh bắt đầu cho hành khách lên máy bay',
    explanation: 'Các từ khóa quan trọng: "飞往" (bay đến), "航班" (chuyến bay), "登机" (lên máy bay, boarding).',
    usageNotes: 'Mẫu câu phát thanh sân bay tiêu chuẩn: 各位旅客请注意 (Xin quý hành khách chú ý) ... 请带好随身物品 (Xin mang theo đồ dùng cá nhân) 到 X 号登机口登机 (đến cửa khởi hành số X lên máy bay).',
    exampleSentence: {
      chinese: '请各位乘客出示登机牌和护照。',
      pinyin: 'Qǐng gèwèi chéngkè chūshì dēngjīpái hé hùzhào.',
      vietnamese: 'Xin mời quý hành khách xuất trình thẻ lên máy bay và hộ chiếu.',
    },
  },
  {
    id: 'list-hsk3-3',
    type: 'listening',
    hskLevel: 3,
    prompt: 'Nghe đoạn khám bệnh tại bệnh viện và xác định lời dặn của bác sĩ:',
    audioText: '你只是普通感冒，多喝温水，按时吃药，好好休息几天就会好的。',
    options: [
      'Chỉ bị cảm cúm thông thường, uống nhiều nước ấm, uống thuốc đúng giờ và nghỉ ngơi',
      'Cần phải làm phẫu thuật gấp',
      'Không được uống nước trong 3 ngày',
      'Bệnh nhân phải nhập viện theo dõi 2 tuần',
    ],
    correctAnswer: 'Chỉ bị cảm cúm thông thường, uống nhiều nước ấm, uống thuốc đúng giờ và nghỉ ngơi',
    explanation: 'Từ khóa: "普通感冒" (cảm thông thường), "多喝温水" (uống nhiều nước ấm), "按时吃药" (uống thuốc đúng giờ).',
    usageNotes: '"按时" (ànshí) là phó từ mang nghĩa đúng giờ, đúng cữ quy định.',
    exampleSentence: {
      chinese: '生病了要遵从医嘱，按时服药。',
      pinyin: 'Shēngbìng le yào zūncóng yīzhǔ, ànshí fúyào.',
      vietnamese: 'Khi bị bệnh cần tuân theo lời dặn của bác sĩ, uống thuốc đúng giờ.',
    },
  },
  {
    id: 'list-hsk3-4',
    type: 'listening',
    hskLevel: 3,
    prompt: 'Nghe đoạn đặt bàn nhà hàng và chọn số lượng người cùng thời gian:',
    audioText: '您好，我想预订今晚七点半的一张四人餐桌，靠窗户的位置。',
    options: [
      'Đặt bàn 4 người vào lúc 7:30 tối nay, vị trí cạnh cửa sổ',
      'Đặt bàn 2 người vào lúc 6:00 tối mai',
      'Đặt phòng riêng 10 người vào bữa trưa',
      'Đặt bàn 4 người ở giữa sảnh lúc 8:00',
    ],
    correctAnswer: 'Đặt bàn 4 người vào lúc 7:30 tối nay, vị trí cạnh cửa sổ',
    explanation: 'Từ khóa: "今晚七点半" (7:30 tối nay), "四人餐桌" (bàn ăn 4 người), "靠窗户的位置" (vị trí gần cửa sổ).',
    usageNotes: '"预订" (yùdìng) nghĩa là đặt trước phòng, bàn ăn hoặc vé tàu xe.',
    exampleSentence: {
      chinese: '周末餐厅人很多，建议提前打电话预订座位。',
      pinyin: 'Zhōumò cāntīng rén hěn duō, jiànyì tíqián dǎ diànhuà yùdìng zuòwèi.',
      vietnamese: 'Cuối tuần nhà hàng rất đông người, khuyên bạn nên gọi điện đặt trước chỗ ngồi.',
    },
  },
];

export const HSK4_LISTENING: QuizQuestion[] = [
  {
    id: 'list-hsk4-1',
    type: 'listening',
    hskLevel: 4,
    prompt: 'Nghe đoạn thảo luận công việc và xác định quyết định của nhóm:',
    audioText: '虽然方案还有些小细节需要调整，但总体思路非常好，我们决定采纳。',
    options: [
      'Tuy còn một số chi tiết nhỏ cần điều chỉnh nhưng quyết định tiếp nhận phương án',
      'Từ chối hoàn toàn phương án vì quá nhiều lỗi',
      'Hủy bỏ dự án không thực hiện nữa',
      'Chuyển giao cho bộ phận khác xử lý',
    ],
    correctAnswer: 'Tuy còn một số chi tiết nhỏ cần điều chỉnh nhưng quyết định tiếp nhận phương án',
    explanation: 'Vế trước: "有些小细节需要调整" (có một số chi tiết nhỏ cần chỉnh), vế chuyển ý quyết định: "决定采纳" (quyết định tiếp nhận/thông qua).',
    usageNotes: '"采纳" (cǎinà) là động từ cao cấp mang nghĩa chấp nhận, thông qua ý kiến hoặc phương án.',
    exampleSentence: {
      chinese: '经理采纳了小王提出的合理化建议。',
      pinyin: 'Jīnglǐ cǎinà le Xiǎo Wáng tíchū de hélǐhuà jiànyì.',
      vietnamese: 'Giám đốc đã tiếp thu kiến nghị hợp lý hóa do Tiểu Vương đề xuất.',
    },
  },
  {
    id: 'list-hsk4-2',
    type: 'listening',
    hskLevel: 4,
    prompt: 'Nghe đoạn phỏng vấn xin việc và xác định câu hỏi của nhà tuyển dụng:',
    audioText: '请用两分钟时间做个简短的自我介绍，并谈谈你对这个岗位的理解。',
    options: [
      'Yêu cầu ứng viên giới thiệu ngắn về bản thân trong 2 phút và nêu hiểu biết về vị trí ứng tuyển',
      'Hỏi ứng viên về mức lương mong muốn ngay lập tức',
      'Yêu cầu ứng viên bắt đầu đi làm vào sáng mai',
      'Hỏi về thành tích thời học cấp 3 của ứng viên',
    ],
    correctAnswer: 'Yêu cầu ứng viên giới thiệu ngắn về bản thân trong 2 phút và nêu hiểu biết về vị trí ứng tuyển',
    explanation: 'Từ khóa phỏng vấn: "自我介绍" (zìwǒ jièshào - tự giới thiệu), "岗位" (gǎngwèi - vị trí công tác), "理解" (lǐjiě - sự thấu hiểu/cảm nhận).',
    usageNotes: 'Mẫu câu mở đầu phỏng vấn thường gặp: 请做自我介绍 (Xin mời tự giới thiệu).',
    exampleSentence: {
      chinese: '面试时，自信流畅的自我介绍能给考官留下深刻印象。',
      pinyin: 'Miànshì shí, zìxìn liúchàng de zìwǒ jièshào néng gěi kǎoguān liúxià shēnkè yìnxiàng.',
      vietnamese: 'Khi phỏng vấn, màn tự giới thiệu tự tin lưu loát có thể để lại ấn tượng sâu sắc cho người phỏng vấn.',
    },
  },
  {
    id: 'list-hsk4-3',
    type: 'listening',
    hskLevel: 4,
    prompt: 'Nghe câu thành ngữ triết lý và chọn nội dung truyền tải:',
    audioText: '千里之行，始于足下。',
    options: [
      'Hành trình vạn dặm bắt đầu từ bước chân đầu tiên (Muốn làm việc lớn phải bắt đầu từ việc nhỏ ngay trước mắt)',
      'Đi một ngày đàng học một sàng khôn',
      'Nước chảy đá mòn',
      'Có công mài sắt có ngày nên kim',
    ],
    correctAnswer: 'Hành trình vạn dặm bắt đầu từ bước chân đầu tiên (Muốn làm việc lớn phải bắt đầu từ việc nhỏ ngay trước mắt)',
    explanation: '"千里之行，始于足下" (Qiān lǐ zhī xíng, shǐ yú zú xià): Câu ngạn ngữ nổi tiếng của Lão Tử, nhắc nhở chúng ta rằng mục tiêu dù to lớn đến đâu cũng phải bắt đầu từ những hành động nhỏ cụ thể từng bước một.',
    usageNotes: 'Thường dùng để khích lệ người học không nên nản chí trước chặng đường dài mà hãy kiên trì tích lũy từng ngày.',
    exampleSentence: {
      chinese: '学习外语不要怕困难，千里之行始于足下，每天背五个单词就是进步。',
      pinyin: 'Xuéxí wàiyǔ búyào pà kùnnan, qiān lǐ zhī xíng shǐ yú zú xià, měitiān bèi wǔ gè dāncí jiù shì jìnbù.',
      vietnamese: 'Học ngoại ngữ đừng sợ khó khăn, hành trình vạn dặm khởi đầu từ bước chân, mỗi ngày thuộc 5 từ vựng chính là tiến bộ.',
    },
  },
  {
    id: 'list-hsk4-4',
    type: 'listening',
    hskLevel: 4,
    prompt: 'Nghe đoạn bình luận văn hóa và xác định chủ đề được ca ngợi:',
    audioText: '中国茶文化历史悠久，品茶不仅是解渴，更是一种修身养性的生活艺术。',
    options: [
      'Văn hóa thưởng trà Trung Hoa: Vừa giải khát vừa là nghệ thuật tu tâm dưỡng tính',
      'Nghệ thuật thư pháp chữ Hán',
      'Ẩm thực cay Tứ Xuyên',
      'Kiến trúc Tử Cấm Thành',
    ],
    correctAnswer: 'Văn hóa thưởng trà Trung Hoa: Vừa giải khát vừa là nghệ thuật tu tâm dưỡng tính',
    explanation: 'Từ khóa: "茶文化" (chá wénhuà - văn hóa trà), "品茶" (pǐn chá - thưởng thức trà), "修身养性" (xiūshēn yǎngxìng - tu tâm dưỡng tính).',
    usageNotes: 'Cấu trúc "不仅是... 更是..." (không chỉ là... mà càng là/hơn nữa là...).',
    exampleSentence: {
      chinese: '在闲暇时光泡一壶清茶，品味宁静淡雅。',
      pinyin: 'Zài xiánxiá shíguāng pào yì hú qīngchá, pǐnwèi níngjìng dànyǎ.',
      vietnamese: 'Vào những lúc rảnh rỗi pha một ấm trà thanh, thưởng thức sự tĩnh lặng tao nhã.',
    },
  },
];

export const HSK5_LISTENING: QuizQuestion[] = [
  {
    id: 'list-hsk5-1',
    type: 'listening',
    hskLevel: 5,
    prompt: 'Nghe đoạn phân tích xu hướng kinh tế và chọn kết luận:',
    audioText: '随着数字经济的蓬勃发展，人工智能正逐渐成为推动产业转型升级的核心引擎。',
    options: [
      'Kinh tế số phát triển mạnh mẽ, AI trở thành động cơ cốt lõi thúc đẩy chuyển đổi và nâng cấp ngành nghề',
      'Trí tuệ nhân tạo bị suy thoái hoàn toàn',
      'Nền kinh tế quay trở lại mô hình nông nghiệp truyền thống',
      'Không nên ứng dụng công nghệ mới vào sản xuất',
    ],
    correctAnswer: 'Kinh tế số phát triển mạnh mẽ, AI trở thành động cơ cốt lõi thúc đẩy chuyển đổi và nâng cấp ngành nghề',
    explanation: 'Từ khóa kinh tế cao cấp: "数字经济" (kinh tế số), "蓬勃发展" (phát triển phồn thịnh), "产业转型升级" (chuyển đổi nâng cấp ngành nghề), "核心引擎" (động cơ cốt lõi).',
    usageNotes: 'Mẫu câu chuyên đề phân tích xu thế thời sự kinh tế HSK 5.',
    exampleSentence: {
      chinese: '科技创新为企业注入了源源不断的发展活力。',
      pinyin: 'Kējì chuàngxīn wèi qǐyè zhùrù le yuányuánbúduàn de fāzhǎn huólì.',
      vietnamese: 'Đổi mới công nghệ truyền nguồn sức sống phát triển không ngừng cho doanh nghiệp.',
    },
  },
  {
    id: 'list-hsk5-2',
    type: 'listening',
    hskLevel: 5,
    prompt: 'Nghe lời khuyên sức khỏe tâm lý và chọn thông điệp cốt lõi:',
    audioText: '面对生活中的挫折与压力，适时调整心态，学会倾诉与释放，是保持心理健康的关键所在。',
    options: [
      'Đối mặt với áp lực và trắc trở, kịp thời điều chỉnh tâm lý, học cách giãi bày và giải tỏa là chìa khóa giữ sức khỏe tinh thần',
      'Phải giữ kín mọi áp lực trong lòng một mình chịu đựng',
      'Không nên tâm sự với bất kỳ ai',
      'Từ bỏ công việc ngay khi gặp khó khăn nhỏ',
    ],
    correctAnswer: 'Đối mặt với áp lực và trắc trở, kịp thời điều chỉnh tâm lý, học cách giãi bày và giải tỏa là chìa khóa giữ sức khỏe tinh thần',
    explanation: 'Từ khóa: "挫折与压力" (trắc trở và áp lực), "调整心态" (điều chỉnh tâm thái), "倾诉与释放" (giãi bày và giải phóng), "关键所在" (chìa khóa cốt lõi).',
    usageNotes: '"关键所在" nghĩa là mấu chốt trọng yếu nhất.',
    exampleSentence: {
      chinese: '学会与压力和解，才能拥有更加坚韧的内心。',
      pinyin: 'Xuéhuì yǔ yālì héjiě, cáinéng yǒngyǒu gèngjiā jiānrèn de nèixīn.',
      vietnamese: 'Học cách hòa giải với áp lực mới có thể sở hữu nội tâm kiên cường hơn.',
    },
  },
];

export const HSK6_LISTENING: QuizQuestion[] = [
  {
    id: 'list-hsk6-1',
    type: 'listening',
    hskLevel: 6,
    prompt: 'Nghe đoạn luận bàn triết học văn hóa và xác định tư tưởng chủ đạo:',
    audioText: '中华文明之所以历经数千年而绵延不绝，正是因其具备海纳百川的包容性与革故鼎新的自我革新精神。',
    options: [
      'Văn minh Trung Hoa trường tồn ngàn năm là nhờ tính bao dung "trăm sông đổ về biển" và tinh thần tự đổi mới "bỏ cũ lập mới"',
      'Chỉ duy trì bảo thủ không tiếp thu văn hóa bên ngoài',
      'Nền văn minh cổ đại đã bị ngắt quãng hoàn toàn',
      'Chối bỏ mọi giá trị văn hóa truyền thống',
    ],
    correctAnswer: 'Văn minh Trung Hoa trường tồn ngàn năm là nhờ tính bao dung "trăm sông đổ về biển" và tinh thần tự đổi mới "bỏ cũ lập mới"',
    explanation: 'Thành ngữ bác học cao cấp: "绵延不绝" (trải dài bất tận), "海纳百川" (biển dung nạp trăm sông - tinh thần bao dung), "革故鼎新" (đổi mới canh tân, phá bỏ hủ tục xây dựng cái mới tiến bộ).',
    usageNotes: 'Cấu trúc "...之所以...，正是因其..." (Sở dĩ... chính là do...).',
    exampleSentence: {
      chinese: '博大精深的中华文化在传承中创新，在交流中互鉴。',
      pinyin: 'Bódàjīngshēn de Zhōnghuá wénhuà zài chuánchéng zhōng chuàngxīn, zài jiāoliú zhōng hùjiàn.',
      vietnamese: 'Văn hóa Trung Hoa uyên bác sâu sắc đổi mới trong kế thừa, học hỏi lẫn nhau trong giao lưu.',
    },
  },
];

export const CURATED_LISTENING_BY_HSK: Record<HSKLevel, QuizQuestion[]> = {
  1: HSK1_LISTENING,
  2: HSK2_LISTENING,
  3: HSK3_LISTENING,
  4: HSK4_LISTENING,
  5: HSK5_LISTENING,
  6: HSK6_LISTENING,
};

export const CURATED_LISTENING_QUESTIONS: QuizQuestion[] = [
  ...HSK1_LISTENING,
  ...HSK2_LISTENING,
  ...HSK3_LISTENING,
  ...HSK4_LISTENING,
  ...HSK5_LISTENING,
  ...HSK6_LISTENING,
];

// ==========================================
// UTILITY FUNCTION FOR FLEXIBLE FILTERING
// ==========================================
export function getCuratedQuestions(
  category: 'pinyin_grammar' | 'listening',
  hskLevel: HSKLevel | 'all' = 'all',
  subType: 'all' | 'pinyin' | 'grammar' = 'all'
): QuizQuestion[] {
  let list: QuizQuestion[] = [];

  if (category === 'pinyin_grammar') {
    if (hskLevel === 'all') {
      list = CURATED_PINYIN_GRAMMAR_QUESTIONS;
    } else {
      list = CURATED_PINYIN_GRAMMAR_BY_HSK[hskLevel] || [];
    }

    if (subType === 'pinyin') {
      list = list.filter((q) => q.type === 'pinyin');
    } else if (subType === 'grammar') {
      list = list.filter((q) => q.type === 'grammar');
    }
  } else if (category === 'listening') {
    if (hskLevel === 'all') {
      list = CURATED_LISTENING_QUESTIONS;
    } else {
      list = CURATED_LISTENING_BY_HSK[hskLevel] || [];
    }
  }

  return list;
}
