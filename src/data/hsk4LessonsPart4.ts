import { DetailedTextbookLesson } from './newHsk1BookData';

export const HSK4_LESSONS_PART4: DetailedTextbookLesson[] = [
  // LESSON 16: 生活可以更美好
  {
    lessonNumber: 16,
    titleHanzi: "生活可以更美好",
    titlePinyin: "Shēnghuó kěyǐ gèng měihǎo",
    titleVietnamese: "Cuộc sống có thể tốt đẹp hơn",
    pageStart: 72,
    objectives: [
      "Sử dụng phó từ '可' trong câu trần thuật hoặc phản vấn để nhấn mạnh ngữ khí.",
      "Sử dụng '恐怕' biểu thị sự lo lắng, e ngại hoặc phỏng đoán.",
      "Sử dụng phó từ '到底' trong câu hỏi để truy cứu bản chất sự việc.",
      "Kết cấu '拿……来说' (lấy... làm ví dụ).",
      "Động từ năng nguyện '敢' (dám làm gì)."
    ],
    texts: [
      {
        id: "hsk4-l16-t1",
        title: "课文 1 (小夏出国留学遇到了问题)",
        context: "Tiểu Hạ chuẩn bị hồ sơ xin thị thực du học tiến sĩ.",
        lines: [
          { speaker: "小雨", hanzi: "你马上就要硕士毕业了吧？将来有什么打算？", pinyin: "Nǐ mǎshàng jiù yào shuòshì bìyè le ba? Jiānglái yǒu shénme dǎsuan?", vietnamese: "Cậu sắp tốt nghiệp thạc sĩ rồi đúng không? Tương lai có dự định gì chưa?" },
          { speaker: "小夏", hanzi: "我想出国读博士，一直在准备办签证需要的材料。", pinyin: "Wǒ xiǎng chūguó dú bóshì, yìzhí zài zhǔnbèi bàn qiānzhèng xūyào de cáiliào.", vietnamese: "Mình muốn ra nước ngoài học tiến sĩ, đang chuẩn bị các giấy tờ xin visa." },
          { speaker: "小雨", hanzi: "现在材料准备得怎么样了？", pinyin: "Xiànzài cáiliào zhǔnbèi de zěnmeyàng le?", vietnamese: "Giờ giấy tờ chuẩn bị đến đâu rồi?" },
          { speaker: "小夏", hanzi: "成绩证明和护照已经准备好了，另外，还跟国外的大学取得了联系，填写了报名表格。", pinyin: "Chéngjì zhèngmíng hé hùzhào yǐjīng zhǔnbèi hǎo le, lìngwài, hái gēn guówài de dàxué qǔdé le liánxì, tiánxiě le bàomíng biǎogé.", vietnamese: "Bảng điểm và hộ chiếu đã chuẩn bị xong, ngoài ra cũng đã liên hệ với trường đại học ở nước ngoài và điền mẫu đơn đăng ký." },
          { speaker: "小雨", hanzi: "还应该有国外大学给你的邀请信吧？他们把邀请信传真给你了吗？", pinyin: "Hái yīnggāi yǒu guówài dàxué gěi nǐ de yāoqǐngxìn ba? Tāmen bǎ yāoqǐngxìn chuánzhēn gěi nǐ le ma?", vietnamese: "Còn phải có thư mời của trường đại học nước ngoài nữa chứ? Họ đã gửi fax thư mời cho cậu chưa?" },
          { speaker: "小夏", hanzi: "没有啊，下个星期我就要去使馆办签证了，这可怎么办？", pinyin: "Méiyǒu a, xià ge xīngqī wǒ jiù yào qù shǐguǎn bàn qiānzhèng le, zhè kě zěnme bàn?", vietnamese: "Chưa có, tuần sau mình phải đến đại sứ quán làm visa rồi, việc này biết tính sao đây?" }
        ]
      },
      {
        id: "hsk4-l16-t2",
        title: "课文 2 (王老板告诉李进自己成功的经验)",
        context: "Ông chủ Vương chia sẻ bài học khởi nghiệp sâu sắc từ câu chuyện chia dưa hấu.",
        lines: [
          { speaker: "李进", hanzi: "谢谢您带我参观您的公司。在参观过程中我很激动，有个问题一直想问您。", pinyin: "Xièxie nín dài wǒ cānguān nín de gōngsī. Zài cānguān guòchéng zhōng wǒ hěn jīdòng, yǒu ge wèntí yìzhí xiǎng wèn nín.", vietnamese: "Cảm ơn bác đã dẫn cháu tham quan công ty. Trong lúc tham quan cháu rất xúc động, có một câu hỏi cháu muốn hỏi bác từ lâu." },
          { speaker: "王老板", hanzi: "好啊！小伙子，咱们一边吃西瓜，一边聊。", pinyin: "Hǎo a! Xiǎohuǒzi, zánmen yìbiān chī xīguā, yìbiān liáo.", vietnamese: "Được chứ! Chàng trai trẻ, chúng ta vừa ăn dưa hấu vừa trò chuyện nào." },
          { speaker: "李进", hanzi: "您从大学毕业开始工作，到现在才十年时间，怎么给公司赚了这么多钱？我想向您学习一下成功的经验。", pinyin: "Nín cóng dàxué bìyè kāishǐ gōngzuò, dào xiànzài cái shí nián shíjiān, zěnme gěi gōngsī zhuàn le zhème duō qián? Wǒ xiǎng xiàng nín xuéxí yíxià chénggōng de jīngyàn.", vietnamese: "Bác tốt nghiệp đại học đi làm đến nay mới mười năm, làm sao kiếm được nhiều tiền cho công ty như thế ạ? Cháu muốn học hỏi kinh nghiệm thành công của bác." },
          { speaker: "王老板", hanzi: "做生意时虽然会遇到各种压力和困难，但是大家的机会都是相同的。你看，这里有三块大小不同的西瓜，要是我们一起开始吃，你会先选哪块？", pinyin: "Zuò shēngyi shí suīrán huì yùdào gè zhǒng yālì hé kùnnan, dànshì dàjiā de jīhuì dōu shì xiāngtóng de. Nǐ kàn, zhèlǐ yǒu sān kuài dàxiǎo bù tóng de xīguā, yàoshi wǒmen yìqǐ kāishǐ chī, nǐ huì xiān xuǎn nǎ kuài?", vietnamese: "Làm kinh doanh tuy gặp nhiều áp lực và trắc trở, nhưng cơ hội của mọi người là như nhau. Cháu nhìn xem, ở đây có 3 miếng dưa hấu lớn nhỏ khác nhau, nếu chúng ta cùng ăn thì cháu chọn miếng nào trước?" },
          { speaker: "李进", hanzi: "我肯定先吃最大的一块，难道您会先吃小的？", pinyin: "Wǒ kěndìng xiān chī zuì dà de yí kuài, nándào nín huì xiān chī xiǎo de?", vietnamese: "Cháu chắc chắn ăn miếng to nhất trước ạ, lẽ nào bác lại ăn miếng nhỏ trước?" },
          { speaker: "王老板", hanzi: "我会先吃最小的一块，因为在你没吃完最大的那块时，我还有时间再多吃一块，最后一定比你吃的多。听完我的回答，恐怕你已经知道我的答案了吧。", pinyin: "Wǒ huì xiān chī zuì xiǎo de yí kuài, yīnwèi zài nǐ méi chī wán zuì dà de nà kuài shí, wǒ hái yǒu shíjiān zài duō chī yí kuài, zuìhòu yídìng bǐ nǐ chī de duō. Tīng wán wǒ de huídá, kǒngpà nǐ yǐjīng zhīdào wǒ de dá'àn le ba.", vietnamese: "Bác sẽ ăn miếng nhỏ nhất trước, bởi vì trong lúc cháu chưa ăn xong miếng to nhất thì bác đã kịp ăn thêm miếng nữa, kết quả bác ăn được nhiều dưa hơn cháu. Nghe xong câu trả lời này, e rằng cháu đã hiểu đáp án của bác rồi chứ." }
        ]
      },
      {
        id: "hsk4-l16-t3",
        title: "课文 3 (小林不好意思拒绝朋友)",
        context: "Học cách từ chối khéo léo và chân thành trong quan hệ bạn bè.",
        lines: [
          { speaker: "小林", hanzi: "今年放假我又回不了家了，这次我父母又要失望了。你有什么计划？", pinyin: "Jīnnián fàngjià wǒ yòu huí bù liǎo jiā le, zhè cì wǒ fùmǔ yòu yào shīwàng le. Nǐ yǒu shénme jìhuà?", vietnamese: "Kỳ nghỉ năm nay mình lại không về nhà được, lần này bố mẹ lại thất vọng rồi. Cậu có kế hoạch gì chưa?" },
          { speaker: "小李", hanzi: "我计划去郊区住一个月。你不是已经买好火车票了吗？你到底怎么打算的呀？", pinyin: "Wǒ jìhuà qù jiāoqū zhù yí ge yuè. Nǐ bú shì yǐjīng mǎihǎo huǒchēpiào le ma? Nǐ dàodǐ zěnme dǎsuan de ya?", vietnamese: "Mình định về vùng ngoại ô ở một tháng. Cậu chẳng phải đã mua vé tàu rồi sao? Rốt cuộc cậu tính thế nào vậy?" },
          { speaker: "小林", hanzi: "昨天一个外地的好朋友打电话说要来旅游，让我当导游，我实在不好意思拒绝。", pinyin: "Zuótiān yí ge wàidì de hǎo péngyou dǎ diànhuà shuō yào lái lǚyóu, ràng wǒ dāng dǎoyóu, wǒ shízài bù hǎoyìsi jùjué.", vietnamese: "Hôm qua một người bạn thân ở xa gọi điện bảo muốn tới đây du lịch nhờ mình làm hướng dẫn viên, mình thật sự ngại không nỡ từ chối." },
          { speaker: "小李", hanzi: "其实拒绝并不表示不愿意帮忙。遇到解决不了的问题或者无法完成的任务时，拒绝正好说明你对朋友负责。", pinyin: "Qíshí jùjué bìng bù biǎoshì bú yuànyì bāngmáng. Yùdào jiějué bù liǎo de wèntí huòzhě wúfǎ wánchéng de rènwu shí, jùjué zhènghǎo shuōmíng nǐ duì péngyou fùzé.", vietnamese: "Thực ra từ chối không có nghĩa là không muốn giúp. Khi gặp vấn đề không giải quyết nổi hoặc nhiệm vụ không thể hoàn thành, việc từ chối chính là thể hiện trách nhiệm với bạn bè." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l16-g1",
        title: "1. Phó từ '恐怕' (E rằng, sợ rằng)",
        explanation: "Biểu thị sự phỏng đoán kèm theo tâm lý e ngại, lo lắng một kết quả không như ý.",
        examples: [
          { hanzi: "听完我的回答，恐怕你已经知道了答案。", pinyin: "Tīng wán wǒ de huídá, kǒngpà nǐ yǐjīng zhīdào le dá'àn.", vietnamese: "Nghe xong câu trả lời của tôi, e rằng bạn đã biết đáp án rồi." }
        ]
      },
      {
        id: "hsk4-l16-g2",
        title: "2. Phó từ '到底' (Rốt cuộc, cuối cùng)",
        explanation: "Dùng trong câu hỏi nghi vấn để truy hỏi đến cùng bản chất của sự việc.",
        examples: [
          { hanzi: "你到底怎么打算的呀？", pinyin: "Nǐ dàodǐ zěnme dǎsuan de ya?", vietnamese: "Rốt cuộc cậu dự tính như thế nào vậy?" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l16-w1", hanzi: "博士", pinyin: "bóshì", hanViet: "bác sĩ", vietnamese: "tiến sĩ", hskLevel: 4, radical: "十", strokeCount: 15, example: "读博士", exampleTranslation: "học tiến sĩ", tags: ["Bài 16", "Danh từ"] },
      { id: "hsk4-l16-w2", hanzi: "签证", pinyin: "qiānzhèng", hanViet: "thiêm chứng", vietnamese: "thị thực, visa", hskLevel: 4, radical: "讠", strokeCount: 24, example: "办签证", exampleTranslation: "làm visa", tags: ["Bài 16", "Danh từ"] },
      { id: "hsk4-l16-w3", hanzi: "报名", pinyin: "bàomíng", hanViet: "báo danh", vietnamese: "đăng ký, ghi danh", hskLevel: 4, radical: "扌", strokeCount: 14, example: "报名参加", exampleTranslation: "đăng ký tham gia", tags: ["Bài 16", "Động từ"] },
      { id: "hsk4-l16-w4", hanzi: "表格", pinyin: "biǎogé", hanViet: "biểu cách", vietnamese: "biểu mẫu, tờ khai", hskLevel: 4, radical: "衣", strokeCount: 18, example: "填写表格", exampleTranslation: "điền vào biểu mẫu", tags: ["Bài 16", "Danh từ"] },
      { id: "hsk4-l16-w5", hanzi: "传真", pinyin: "chuánzhēn", hanViet: "truyền chân", vietnamese: "gửi fax, bản fax", hskLevel: 4, radical: "亻", strokeCount: 16, example: "发传真", exampleTranslation: "gửi bản fax", tags: ["Bài 16", "Động từ"] },
      { id: "hsk4-l16-w6", hanzi: "参观", pinyin: "cānguān", hanViet: "tham quan", vietnamese: "tham quan", hskLevel: 4, radical: "厶", strokeCount: 14, example: "参观公司", exampleTranslation: "tham quan công ty", tags: ["Bài 16", "Động từ"] },
      { id: "hsk4-l16-w7", hanzi: "激动", pinyin: "jīdòng", hanViet: "kích động", vietnamese: "xúc động, kích động", hskLevel: 4, radical: "氵", strokeCount: 15, example: "非常激动", exampleTranslation: "vô cùng xúc động", tags: ["Bài 16", "Tính từ"] },
      { id: "hsk4-l16-w8", hanzi: "记者", pinyin: "jìzhě", hanViet: "ký giả", vietnamese: "nhà báo, phóng viên", hskLevel: 4, radical: "讠", strokeCount: 14, example: "著名记者", exampleTranslation: "phóng viên nổi tiếng", tags: ["Bài 16", "Danh từ"] },
      { id: "hsk4-l16-w9", hanzi: "恐怕", pinyin: "kǒngpà", hanViet: "khủng phạ", vietnamese: "e rằng, sợ rằng", hskLevel: 4, radical: "心", strokeCount: 18, example: "恐怕不行", exampleTranslation: "e rằng không được", tags: ["Bài 16", "Phó từ"] },
      { id: "hsk4-l16-w10", hanzi: "失望", pinyin: "shīwàng", hanViet: "thất vọng", vietnamese: "thất vọng", hskLevel: 4, radical: "大", strokeCount: 16, example: "感到失望", exampleTranslation: "cảm thấy thất vọng", tags: ["Bài 16", "Tính từ"] },
      { id: "hsk4-l16-w11", hanzi: "郊区", pinyin: "jiāoqū", hanViet: "giao khu", vietnamese: "ngoại ô, vùng ven", hskLevel: 4, radical: "阝", strokeCount: 12, example: "住在郊区", exampleTranslation: "sống ở vùng ngoại ô", tags: ["Bài 16", "Danh từ"] },
      { id: "hsk4-l16-w12", hanzi: "到底", pinyin: "dàodǐ", hanViet: "đáo để", vietnamese: "rốt cuộc, cuối cùng", hskLevel: 4, radical: "刂", strokeCount: 16, example: "到底去不去", exampleTranslation: "rốt cuộc có đi hay không", tags: ["Bài 16", "Phó từ"] },
      { id: "hsk4-l16-w13", hanzi: "导游", pinyin: "dǎoyóu", hanViet: "đạo du", vietnamese: "hướng dẫn viên du lịch", hskLevel: 4, radical: "寸", strokeCount: 18, example: "当导游", exampleTranslation: "làm hướng dẫn viên", tags: ["Bài 16", "Danh từ"] },
      { id: "hsk4-l16-w14", hanzi: "礼貌", pinyin: "lǐmào", hanViet: "lễ mạo", vietnamese: "lịch sự, lễ phép", hskLevel: 4, radical: "礻", strokeCount: 19, example: "很有礼貌", exampleTranslation: "rất lịch sự", tags: ["Bài 16", "Danh từ"] },
      { id: "hsk4-l16-w15", hanzi: "原谅", pinyin: "yuánliàng", hanViet: "nguyên lượng", vietnamese: "tha thứ, lượng thứ", hskLevel: 4, radical: "厂", strokeCount: 22, example: "请原谅", exampleTranslation: "xin hãy tha thứ", tags: ["Bài 16", "Động từ"] },
      { id: "hsk4-l16-w16", hanzi: "尊重", pinyin: "zūnzhòng", hanViet: "tôn trọng", vietnamese: "tôn trọng, kính trọng", hskLevel: 4, radical: "寸", strokeCount: 21, example: "互相尊重", exampleTranslation: "tôn trọng lẫn nhau", tags: ["Bài 16", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l16-ex1",
        type: "multiple_choice",
        question: "Chọn từ thích hợp: '大家都等了你半天，你______去不去啊？'",
        options: ["A. 到底", "B. 恐怕", "C. 左右", "D. 随着"],
        correctAnswer: "A. 到底",
        explanation: "'到底' dùng trong câu hỏi để nhấn mạnh 'rốt cuộc có đi hay không'."
      }
    ],
    cultureBonus: {
      title: "只要功夫深，铁杵磨成针 (Có công mài sắt, có ngày nên kim)",
      summary: "Điển tích thời thơ ấu của đại thi hào Lý Bạch.",
      content: "Chuyện kể thi tiên Lý Bạch khi còn nhỏ lười học, một hôm thấy bà lão đang miệt mài mài một thanh xà beng bằng sắt to tướng thành cây kim thêu hoa nhỏ bé. Tấm gương kiên định ấy đã đánh thức ý chí của Lý Bạch, giúp ông học tập chuyên cần thành tài."
    }
  },

  // LESSON 17: 人与自然
  {
    lessonNumber: 17,
    titleHanzi: "人与自然",
    titlePinyin: "Rén yǔ zìrán",
    titleVietnamese: "Con người và tự nhiên",
    pageStart: 86,
    objectives: [
      "Sử dụng phó từ '倒' biểu thị sự nhượng bộ, nghịch lý hoặc trách móc nhẹ nhàng.",
      "Sử dụng động từ '干' và phân biệt đọc âm 'gàn' (làm việc) với tính từ 'gān' (khô ráo).",
      "Sử dụng lượng từ '趟' và phân biệt với '次'.",
      "Cấu trúc mục đích '为了……而……'.",
      "Sử dụng phó từ '仍然' (vẫn, vẫn cứ)."
    ],
    texts: [
      {
        id: "hsk4-l17-t1",
        title: "课文 1 (小夏和安娜在聊天气)",
        context: "Tiểu Hạ và Anna nói về thời tiết mùa thu Bắc Kinh và kế hoạch ngắm lá đỏ Hương Sơn.",
        lines: [
          { speaker: "小夏", hanzi: "最近天气越来越凉快了，风一刮，草地上就会有一层厚厚的黄叶，看来秋天已经到了。", pinyin: "Zuìjìn tiānqì yuè lái yuè liángkuai le, fēng yì guā, cǎodì shang jiù huì yǒu yì céng hòuhòu de huáng yè, kànlái qiūtiān yǐjīng dào le.", vietnamese: "Dạo này trời ngày càng mát mẻ, gió thổi một cái là trên bãi cỏ phủ một lớp lá vàng dày cộm, xem ra mùa thu đã về rồi." },
          { speaker: "安娜", hanzi: "这几天香山特别热闹，随着气温的降低，那里许多植物的叶子都由绿变黄或者变红，吸引了很多游客参观，咱们今天也去看看吧。", pinyin: "Zhè jǐ tiān Xiāngshān tèbié rènao, suízhe qìwēn de jiàngdī, nàlǐ xǔduō zhíwù de yèzi dōu yóu lǜ biàn huáng huòzhě biàn hóng, xīyǐn le hěn duō yóukè cānguān, zánmen jīntiān yě qù kànkan ba.", vietnamese: "Mấy hôm nay núi Hương Sơn nhộn nhịp lắm, theo đà nhiệt độ giảm, lá cây ở đó chuyển từ xanh sang vàng hoặc đỏ rực, thu hút rất nhiều du khách, hôm nay chúng mình cũng đi ngắm đi." },
          { speaker: "小夏", hanzi: "你看天上的云，今天肯定有大雨。再说，香山上看红叶的人太多了。咱们改天去长城吧，广播里说那里也有不少专门看红叶的好地方。", pinyin: "Nǐ kàn tiān shang de yún, jīntiān kěndìng yǒu dàyǔ. Zàishuō, Xiāngshān shang kàn hóngyè de rén tài duō le. Zánmen gǎitiān qù Chángchéng ba, guǎngbō li shuō nàlǐ yě yǒu bù shǎo zhuānmén kàn hóngyè de hǎo dìfang.", vietnamese: "Cậu nhìn mây trên trời kìa, hôm nay chắc chắn có mưa to. Hơn nữa người lên Hương Sơn ngắm lá đỏ đông nghịt. Chúng mình hôm khác đi Vạn Lý Trường Thành đi, đài phát thanh bảo ở đó cũng nhiều chỗ ngắm lá đỏ đẹp lắm." }
        ]
      },
      {
        id: "hsk4-l17-t2",
        title: "课文 2 (小林和小李在聊小李的狗)",
        context: "Kinh nghiệm huấn luyện cún cưng và tình bạn đặc biệt giữa người và động vật.",
        lines: [
          { speaker: "小林", hanzi: "你的这只大黑狗毛真漂亮，而且这么聪明，每次见了都想抱一抱它。", pinyin: "Nǐ de zhè zhī dà hēi gǒu máo zhēn piàoliang, érqiě zhème cōngming, měi cì jiàn le dōu xiǎng bào yí bào tā.", vietnamese: "Bộ lông của chú chó đen to này đẹp quá, lại còn thông minh nữa, lần nào gặp mình cũng muốn ôm một cái." },
          { speaker: "小李", hanzi: "狗是很聪明的动物，只要稍微花点儿时间教教它，它就能学会很多东西。要让它完成一些任务，只教一次是不够的，应该耐心地一遍一遍地教给它，使它熟悉，然后它就会严格按照你的要求做了。", pinyin: "Gǒu shì hěn cōngming de dòngwù, zhǐyào shāowēi huā diǎnr shíjiān jiāojiao tā, tā jiù néng xuéhuì hěn duō dōngxi. Yào ràng tā wánchéng yìxiē rènwu, zhǐ jiāo yí cì shì bú gòu de, yīnggāi nàixīn de yí biàn yí biàn de jiāo gěi tā, shǐ tā shúxī, ránhòu tā jiù huì yángé ànzhào nǐ de yāoqiú zuò le.", vietnamese: "Chó là loài vật rất thông minh, chỉ cần dành chút ít thời gian dạy dỗ là nó có thể học được nhiều điều. Để nó thực hiện nhiệm vụ thì dạy một lần là chưa đủ, phải kiên nhẫn dạy đi dạy lại từng lượt cho nó quen, sau đó nó sẽ làm răm rắp theo đúng yêu cầu của bạn." },
          { speaker: "小李", hanzi: "狗是我们最好的朋友，它能听懂人的话，明白人的心情。在你心里难受的时候，它会一直陪着你。", pinyin: "Gǒu shì wǒmen zuì hǎo de péngyou, tā néng tīngdǒng rén de huà, míngbai rén de xīnqíng. Zài nǐ xīnli nánshòu de shíhou, tā huì yìzhí péizhe nǐ.", vietnamese: "Chó là người bạn tốt nhất của chúng ta, nó hiểu được tiếng người và thấu tỏ tâm trạng của chủ. Những lúc trong lòng bạn buồn bã đau khổ, nó sẽ luôn ở bên cạnh bầu bạn cùng bạn." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l17-g1",
        title: "1. Lượng từ '趟' (Chuyến đi về) & So sánh với '次'",
        explanation: "'趟' nhấn mạnh hành trình có đi có về ('去了一趟北京'); '次' chỉ số lần lặp lại hành động nói chung.",
        examples: [
          { hanzi: "上个月我去了一趟北京动物园。", pinyin: "Shàng ge yuè wǒ qù le yí tàng Běijīng Dòngwùyuán.", vietnamese: "Tháng trước tôi đã đi một chuyến đến Vườn bách thú Bắc Kinh." }
        ]
      },
      {
        id: "hsk4-l17-g2",
        title: "2. Cấu trúc '为了……而……' (Vì... mà...)",
        explanation: "Dùng để biểu thị mục đích cao đẹp hoặc lý tưởng dẫn dắt hành động.",
        examples: [
          { hanzi: "植物会为了阳光、空气和水而竞争。", pinyin: "Zhíwù huì wèile yángguāng, kōngqì hé shuǐ ér jìngzhēng.", vietnamese: "Cây cỏ sẽ vì ánh nắng, không khí và nguồn nước mà cạnh tranh." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l17-w1", hanzi: "凉快", pinyin: "liángkuai", hanViet: "lương khoái", vietnamese: "mát mẻ, dễ chịu", hskLevel: 4, radical: "冫", strokeCount: 17, example: "秋天很凉快", exampleTranslation: "mùa thu rất mát mẻ", tags: ["Bài 17", "Tính từ"] },
      { id: "hsk4-l17-w2", hanzi: "热闹", pinyin: "rènao", hanViet: "nhiệt náo", vietnamese: "náo nhiệt, tấp nập", hskLevel: 4, radical: "灬", strokeCount: 15, example: "大街上很热闹", exampleTranslation: "trên phố rất náo nhiệt", tags: ["Bài 17", "Tính từ"] },
      { id: "hsk4-l17-w3", hanzi: "广播", pinyin: "guǎngbō", hanViet: "quảng bá", vietnamese: "phát thanh, truyền thanh", hskLevel: 4, radical: "广", strokeCount: 18, example: "收音机广播", exampleTranslation: "phát thanh radio", tags: ["Bài 17", "Danh từ"] },
      { id: "hsk4-l17-w4", hanzi: "抱", pinyin: "bào", hanViet: "bão", vietnamese: "ôm, ẵm", hskLevel: 4, radical: "扌", strokeCount: 8, example: "抱一抱", exampleTranslation: "ôm một cái", tags: ["Bài 17", "Động từ"] },
      { id: "hsk4-l17-w5", hanzi: "严格", pinyin: "yángé", hanViet: "nghiêm cách", vietnamese: "nghiêm khắc, nghiêm ngặt", hskLevel: 4, radical: "一", strokeCount: 20, example: "严格要求", exampleTranslation: "yêu cầu nghiêm ngặt", tags: ["Bài 17", "Tính từ"] },
      { id: "hsk4-l17-w6", hanzi: "难受", pinyin: "nánshòu", hanViet: "nan thụ", vietnamese: "khó chịu, đau lòng", hskLevel: 4, radical: "又", strokeCount: 17, example: "心里很难受", exampleTranslation: "trong lòng rất khó chịu", tags: ["Bài 17", "Tính từ"] },
      { id: "hsk4-l17-w7", hanzi: "趟", pinyin: "tàng", hanViet: "thảng", vietnamese: "chuyến, lượt đi về", hskLevel: 4, radical: "走", strokeCount: 15, example: "去一趟医院", exampleTranslation: "đi một chuyến bệnh viện", tags: ["Bài 17", "Lượng từ"] },
      { id: "hsk4-l17-w8", hanzi: "老虎", pinyin: "lǎohǔ", hanViet: "lão hổ", vietnamese: "con hổ, cọp", hskLevel: 4, radical: "虍", strokeCount: 14, example: "凶猛的老虎", exampleTranslation: "con hổ hung dữ", tags: ["Bài 17", "Danh từ"] },
      { id: "hsk4-l17-w9", hanzi: "排队", pinyin: "pái duì", hanViet: "bài đội", vietnamese: "xếp hàng", hskLevel: 4, radical: "扌", strokeCount: 17, example: "排队买票", exampleTranslation: "xếp hàng mua vé", tags: ["Bài 17", "Động từ"] },
      { id: "hsk4-l17-w10", hanzi: "活泼", pinyin: "huópo", hanViet: "hoạt bát", vietnamese: "hoạt bát, sinh động", hskLevel: 4, radical: "氵", strokeCount: 18, example: "活泼可爱", exampleTranslation: "hoạt bát đáng yêu", tags: ["Bài 17", "Tính từ"] },
      { id: "hsk4-l17-w11", hanzi: "森林", pinyin: "sēnlín", hanViet: "sâm lâm", vietnamese: "rừng rậm", hskLevel: 4, radical: "木", strokeCount: 20, example: "保护森林", exampleTranslation: "bảo vệ rừng", tags: ["Bài 17", "Danh từ"] },
      { id: "hsk4-l17-w12", hanzi: "海洋", pinyin: "hǎiyáng", hanViet: "hải dương", vietnamese: "biển cả, đại dương", hskLevel: 4, radical: "氵", strokeCount: 19, example: "广阔的海洋", exampleTranslation: "đại dương bao la", tags: ["Bài 17", "Danh từ"] },
      { id: "hsk4-l17-w13", hanzi: "仍然", pinyin: "réngrán", hanViet: "vẫn nhiên", vietnamese: "vẫn cứ, vẫn như cũ", hskLevel: 4, radical: "亻", strokeCount: 16, example: "仍然坚持", exampleTranslation: "vẫn kiên trì", tags: ["Bài 17", "Phó từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l17-ex1",
        type: "multiple_choice",
        question: "Chọn từ thích hợp: '下个月我要回老家一______探望爷爷奶奶。'",
        options: ["A. 趟", "B. 遍", "C. 辆", "D. 本"],
        correctAnswer: "A. 趟",
        explanation: "'一趟' dùng để chỉ một chuyến đi về."
      }
    ],
    cultureBonus: {
      title: "中国国宝大熊猫 (Quốc bảo Trung Hoa - Gấu Trúc)",
      summary: "Biểu tượng hòa bình và sứ giả ngoại giao của Trung Quốc.",
      content: "Gấu trúc lớn sinh sống trên Trái Đất hơn 8 triệu năm, được ví như 'hóa thạch sống'. Thức ăn chủ yếu là tre trúc, tính cách hiền hòa, là báu vật quốc gia được bảo tồn nghiêm ngặt."
    }
  },

  // LESSON 18: 科技与世界
  {
    lessonNumber: 18,
    titleHanzi: "科技与世界",
    titlePinyin: "Kējì yǔ shìjiè",
    titleVietnamese: "Khoa học công nghệ và thế giới",
    pageStart: 100,
    objectives: [
      "Sử dụng phó từ '是否' (có hay không / liệu có).",
      "Thành ngữ/cụm từ '受不了' biểu thị không chịu đựng nổi.",
      "Sử dụng phó từ '接着' và phân biệt với '然后'.",
      "Kết cấu liên kết '除此之外' (ngoài ra, bên cạnh đó).",
      "Cấu trúc định danh '把……叫作……' (gọi... là...)."
    ],
    texts: [
      {
        id: "hsk4-l18-t1",
        title: "课文 1 (王静给孙月推荐一本书)",
        context: "Vương Tĩnh giới thiệu cuốn bách khoa tri thức 《Mười vạn câu hỏi vì sao mới》 cho trẻ em.",
        lines: [
          { speaker: "孙月", hanzi: "上次女儿问我飞机是怎么起飞和降落的，真不知道怎么回答她，她现在总是有各种各样的“为什么”。", pinyin: "Shàng cì nǚ'ér wèn wǒ fēijī shì zěnme qǐfēi hé jiàngluò de, zhēn bù zhīdào zěnme huídá tā, tā xiànzài zǒngshì yǒu gè zhǒng gè yàng de \"wèishénme\".", vietnamese: "Lần trước con gái hỏi mình máy bay cất cánh và hạ cánh thế nào, thật sự không biết trả lời con sao nữa, dạo này bé luôn có đủ mọi câu hỏi 'vì sao'." },
          { speaker: "王静", hanzi: "孩子眼中的世界是美丽和奇特的。有一本书叫《新十万个为什么》，现在卖得非常火。书里的内容都是儿童想知道的科学知识，相信你女儿一定喜欢读。", pinyin: "Háizi yǎn zhōng de shìjiè shì měilì hé qítè de. Yǒu yì běn shū jiào 《Xīn Shíwàn ge Wèishénme》, xiànzài mài de fēicháng huǒ. Shū li de nèiróng dōu shì értóng xiǎng zhīdào de kēxué zhīshi, xiāngxìn nǐ nǚ'ér yídìng xǐhuan dú.", vietnamese: "Thế giới trong mắt trẻ thơ rất tươi đẹp và kỳ thú. Có cuốn sách tên là 《Mười vạn câu hỏi vì sao mới》 bán rất chạy. Nội dung cuốn sách là tri thức khoa học các bé muốn khám phá, mình tin chắc con gái cậu sẽ rất thích đọc." }
        ]
      },
      {
        id: "hsk4-l18-t2",
        title: "课文 2 (李老师和高老师在聊电脑和互联网技术的发展)",
        context: "Tác động của công nghệ số và mạng Internet đối với học tập và đời sống sinh viên.",
        lines: [
          { speaker: "李老师", hanzi: "现在的大学生一遇到不明白的问题，就可以马上在网上查答案，几秒钟就把问题解决了，这比我们上学的时候方便多了。", pinyin: "Xiànzài de dàxuésheng yí yùdào bù míngbai de wèntí, jiù kěyǐ mǎshàng zài wǎngshang chá dá'àn, jǐ miǎo zhōng jiù bǎ wèntí jiějué le, zhè bǐ wǒmen shàngxué de shíhou fāngbiàn duō le.", vietnamese: "Sinh viên bây giờ hễ gặp câu hỏi không hiểu là có thể lập tức tra đáp án trên mạng, vài giây là giải quyết xong, tiện lợi hơn thời chúng ta đi học nhiều lắm." },
          { speaker: "高老师", hanzi: "现在的人们，尤其是大学生开始普遍使用电脑，他们的生活已经离不开电脑。互联网技术的发展使学生们的学习方式发生了很大改变。", pinyin: "Xiànzài de rénmen, yóuqí shì dàxuésheng kāishǐ pǔbiàn shǐyòng diànnǎo, tāmen de shēnghuó yǐjīng lí bù kāi diànnǎo. Hùliánwǎng jìshù de fāzhǎn shǐ xuéshengmen de xuéxí fāngshì fāshēng le hěn dà gǎibiàn.", vietnamese: "Mọi người bây giờ, đặc biệt là sinh viên đều phổ biến dùng máy tính, cuộc sống dường như không thể tách rời máy tính. Sự phát triển của công nghệ Internet đã làm thay đổi sâu sắc phương thức học tập của các em." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l18-g1",
        title: "1. Liên kết '除此之外' (Bên cạnh đó, ngoài ra)",
        explanation: "Dùng để chuyển ý, bổ sung thêm các khía cạnh khác ngoài điều vừa đề cập.",
        examples: [
          { hanzi: "除此之外，你还可以用手机听音乐、看电影。", pinyin: "Chú cǐ zhī wài, nǐ hái kěyǐ yòng shǒujī tīng yīnyuè, kàn diànyǐng.", vietnamese: "Ngoài ra, bạn còn có thể dùng điện thoại nghe nhạc, xem phim." }
        ]
      },
      {
        id: "hsk4-l18-g2",
        title: "2. Cấu trúc '把……叫作……' (Gọi... là...)",
        explanation: "Dùng để gán tên gọi hoặc định danh khái niệm cho một sự vật.",
        examples: [
          { hanzi: "现在人们都把地球叫作“地球村”。", pinyin: "Xiànzài rénmen dōu bǎ dìqiú jiàozuò \"Dìqiúcūn\".", vietnamese: "Ngày nay mọi người đều gọi Trái Đất là 'ngôi làng địa cầu'." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l18-w1", hanzi: "降落", pinyin: "jiàngluò", hanViet: "giáng lạc", vietnamese: "hạ cánh, đáp xuống", hskLevel: 4, radical: "阝", strokeCount: 20, example: "飞机降落", exampleTranslation: "máy bay hạ cánh", tags: ["Bài 18", "Động từ"] },
      { id: "hsk4-l18-w2", hanzi: "火", pinyin: "huǒ", hanViet: "hỏa", vietnamese: "nóng hổi, bán chạy, thịnh hành", hskLevel: 4, radical: "火", strokeCount: 4, example: "卖得非常火", exampleTranslation: "bán cực kỳ chạy", tags: ["Bài 18", "Tính từ"] },
      { id: "hsk4-l18-w3", hanzi: "作者", pinyin: "zuòzhě", hanViet: "tác giả", vietnamese: "tác giả", hskLevel: 4, radical: "亻", strokeCount: 15, example: "著名作者", exampleTranslation: "tác giả nổi tiếng", tags: ["Bài 18", "Danh từ"] },
      { id: "hsk4-l18-w4", hanzi: "技术", pinyin: "jìshù", hanViet: "kỹ thuật", vietnamese: "công nghệ, kỹ thuật", hskLevel: 4, radical: "扌", strokeCount: 15, example: "科学技术", exampleTranslation: "khoa học kỹ thuật", tags: ["Bài 18", "Danh từ"] },
      { id: "hsk4-l18-w5", hanzi: "是否", pinyin: "shìfǒu", hanViet: "thị phủ", vietnamese: "liệu có... hay không", hskLevel: 4, radical: "日", strokeCount: 17, example: "是否同意", exampleTranslation: "có đồng ý hay không", tags: ["Bài 18", "Phó từ"] },
      { id: "hsk4-l18-w6", hanzi: "受不了", pinyin: "shòu bu liǎo", hanViet: "thụ bất liễu", vietnamese: "không chịu đựng nổi", hskLevel: 4, radical: "又", strokeCount: 13, example: "眼睛受不了", exampleTranslation: "mắt chịu không nổi", tags: ["Bài 18", "Cụm từ"] },
      { id: "hsk4-l18-w7", hanzi: "密码", pinyin: "mìmǎ", hanViet: "mật mã", vietnamese: "mật khẩu, mật mã", hskLevel: 4, radical: "宀", strokeCount: 20, example: "输入密码", exampleTranslation: "nhập mật khẩu", tags: ["Bài 18", "Danh từ"] },
      { id: "hsk4-l18-w8", hanzi: "危险", pinyin: "wēixiǎn", hanViet: "nguy hiểm", vietnamese: "nguy hiểm", hskLevel: 4, radical: "厄", strokeCount: 16, example: "非常危险", exampleTranslation: "rất nguy hiểm", tags: ["Bài 18", "Tính từ"] },
      { id: "hsk4-l18-w9", hanzi: "警察", pinyin: "jǐngchá", hanViet: "cảnh sát", vietnamese: "cảnh sát, công an", hskLevel: 4, radical: "讠", strokeCount: 26, example: "求助警察", exampleTranslation: "nhờ cảnh sát giúp đỡ", tags: ["Bài 18", "Danh từ"] },
      { id: "hsk4-l18-w10", hanzi: "付款", pinyin: "fù kuǎn", hanViet: "phó khoản", vietnamese: "thanh toán tiền", hskLevel: 4, radical: "亻", strokeCount: 17, example: "扫码付款", exampleTranslation: "quét mã thanh toán", tags: ["Bài 18", "Động từ"] },
      { id: "hsk4-l18-w11", hanzi: "网站", pinyin: "wǎngzhàn", hanViet: "võng trạm", vietnamese: "trang web, website", hskLevel: 4, radical: "纟", strokeCount: 16, example: "打开网站", exampleTranslation: "mở trang web", tags: ["Bài 18", "Danh từ"] },
      { id: "hsk4-l18-w12", hanzi: "信息", pinyin: "xìnxī", hanViet: "tín tức", vietnamese: "thông tin", hskLevel: 4, radical: "亻", strokeCount: 16, example: "获取信息", exampleTranslation: "thu nhận thông tin", tags: ["Bài 18", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l18-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '他每天跑步锻炼身体，______，还经常去游泳。'",
        options: ["A. 除此之外", "B. 即使", "C. 随着", "D. 左右"],
        correctAnswer: "A. 除此之外",
        explanation: "'除此之外' dùng để bổ sung thêm hành vi khác ngoài việc chạy bộ."
      }
    ],
    cultureBonus: {
      title: "微博与微信 (Weibo và WeChat trong đời sống số Trung Quốc)",
      summary: "Hai trụ cột mạng xã hội và phương tiện thanh toán quyền năng.",
      content: "WeChat và Weibo đã định hình lại toàn bộ lối sống hiện đại tại Trung Quốc từ giao tiếp, tin tức thời sự đến mua sắm và thanh toán không tiền mặt."
    }
  },

  // LESSON 19: 生活的味道
  {
    lessonNumber: 19,
    titleHanzi: "生活的味道",
    titlePinyin: "Shēnghuó de wèidào",
    titleVietnamese: "Hương vị của cuộc sống",
    pageStart: 114,
    objectives: [
      "Đại từ nghi vấn biểu thị ý nghĩa phiếm chỉ (ai cũng, cái gì cũng...).",
      "Bổ ngữ xu hướng '上' chỉ kết quả đạt được mục tiêu.",
      "Bổ ngữ '出来' chỉ sự phát hiện hoặc làm hiển lộ rõ ràng.",
      "Quán ngữ mở đoạn '总的来说' (nhìn chung mà nói).",
      "Động từ '在于' (nằm ở chỗ, cốt ở chỗ)."
    ],
    texts: [
      {
        id: "hsk4-l19-t1",
        title: "课文 1 (马克申请下个学期继续在学校学习)",
        context: "Mã Khắc hoàn thiện thủ tục đăng ký học kỳ tiếp theo.",
        lines: [
          { speaker: "马克", hanzi: "老师，您好！我希望下个学期在这里继续学习，请问还需要重新申请吗？", pinyin: "Lǎoshī, nín hǎo! Wǒ xīwàng xià ge xuéqī zài zhèlǐ jìxù xuéxí, qǐngwèn hái xūyào chóngxīn shēnqǐng ma?", vietnamese: "Thưa cô, em muốn học kỳ sau tiếp tục học tại đây, xin hỏi có cần phải nộp đơn lại từ đầu không ạ?" },
          { speaker: "高老师", hanzi: "是的。给你表格，出生年月、性别、护照号码都要填，还有联系地址、联系电话。", pinyin: "Shì de. Gěi nǐ biǎogé, chūshēng niányuè, xìngbié, hùzhào hàomǎ dōu yào tián, hái yǒu liánxì dìzhǐ, liánxì diànhuà.", vietnamese: "Có em nhé. Đưa em tờ khai này, ngày tháng năm sinh, giới tính, số hộ chiếu đều phải điền đủ, còn cả địa chỉ và số điện thoại liên hệ nữa." }
        ]
      },
      {
        id: "hsk4-l19-t2",
        title: "课文 2 (王静做饺子时手受伤了)",
        context: "Nấu sủi cảo cừu và tình cảm sẻ chia đầm ấm trong gia đình.",
        lines: [
          { speaker: "李进", hanzi: "呀，你的手怎么流血了？等一下，我给你包起来。", pinyin: "Ya, nǐ de shǒu zěnme liúxiě le? Děng yíxià, wǒ gěi nǐ bāo qǐlai.", vietnamese: "Ôi, tay em sao lại chảy máu thế này? Đợi chút, anh băng lại cho em nhé." },
          { speaker: "王静", hanzi: "没关系，我想给你做点儿羊肉饺子，刚才用刀切肉的时候把手弄破了。", pinyin: "Méi guānxi, wǒ xiǎng gěi nǐ zuò diǎnr yángròu jiǎozi, gāngcái yòng dāo qiē ròu de shíhou bǎ shǒu nòng pò le.", vietnamese: "Không sao đâu anh, em định làm chút sủi cảo thịt cừu cho anh, vừa nãy dùng dao thái thịt sơ ý làm đứt tay." },
          { speaker: "李进", hanzi: "你也太不小心了。看来今天吃不上羊肉饺子了，那我们就吃点儿别的吧。", pinyin: "Nǐ yě tài bù xiǎoxīn le. Kànlái jīntiān chī bú shàng yángròu jiǎozi le, nà wǒmen jiù chī diǎnr bié de ba.", vietnamese: "Em bất cẩn quá. Xem ra hôm nay không được ăn sủi cảo cừu rồi, thế thì chúng ta đi ăn món khác nhé." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l19-g1",
        title: "1. Động từ '在于' (Cốt ở chỗ, nằm ở chỗ)",
        explanation: "Dùng để chỉ ra thực chất hoặc mấu chốt then chốt của một vấn đề.",
        examples: [
          { hanzi: "生命在于运动。", pinyin: "Shēngmìng zàiyú yùndòng.", vietnamese: "Sự sống cốt ở sự vận động." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l19-w1", hanzi: "学期", pinyin: "xuéqī", hanViet: "học kỳ", vietnamese: "học kỳ", hskLevel: 4, radical: "子", strokeCount: 20, example: "新学期", exampleTranslation: "học kỳ mới", tags: ["Bài 19", "Danh từ"] },
      { id: "hsk4-l19-w2", hanzi: "出生", pinyin: "chūshēng", hanViet: "xuất sinh", vietnamese: "sinh ra, chào đời", hskLevel: 4, radical: "凵", strokeCount: 10, example: "出生年月", exampleTranslation: "ngày tháng năm sinh", tags: ["Bài 19", "Động từ"] },
      { id: "hsk4-l19-w3", hanzi: "性别", pinyin: "xìngbié", hanViet: "tính biệt", vietnamese: "giới tính", hskLevel: 4, radical: "忄", strokeCount: 15, example: "填写性别", exampleTranslation: "điền giới tính", tags: ["Bài 19", "Danh từ"] },
      { id: "hsk4-l19-w4", hanzi: "道歉", pinyin: "dàoqiàn", hanViet: "đạo khiểm", vietnamese: "xin lỗi, tạ lỗi", hskLevel: 4, radical: "辶", strokeCount: 26, example: "真诚道歉", exampleTranslation: "chân thành xin lỗi", tags: ["Bài 19", "Động từ"] },
      { id: "hsk4-l19-w5", hanzi: "打印", pinyin: "dǎyìn", hanViet: "đả ấn", vietnamese: "in ấn, in ra", hskLevel: 4, radical: "扌", strokeCount: 11, example: "打印文件", exampleTranslation: "in tài liệu", tags: ["Bài 19", "Động từ"] },
      { id: "hsk4-l19-w6", hanzi: "复印", pinyin: "fùyìn", hanViet: "phức ấn", vietnamese: "photocopy, sao chụp", hskLevel: 4, radical: "夂", strokeCount: 15, example: "复印护照", exampleTranslation: "photocopy hộ chiếu", tags: ["Bài 19", "Động từ"] },
      { id: "hsk4-l19-w7", hanzi: "饺子", pinyin: "jiǎozi", hanViet: "sủi cảo", vietnamese: "bánh sủi cảo", hskLevel: 4, radical: "饣", strokeCount: 14, example: "吃饺子", exampleTranslation: "ăn sủi cảo", tags: ["Bài 19", "Danh từ"] },
      { id: "hsk4-l19-w8", hanzi: "刀", pinyin: "dāo", hanViet: "đao", vietnamese: "con dao", hskLevel: 4, radical: "刀", strokeCount: 2, example: "一把刀", exampleTranslation: "một con dao", tags: ["Bài 19", "Danh từ"] },
      { id: "hsk4-l19-w9", hanzi: "破", pinyin: "pò", hanViet: "phá", vietnamese: "rách, đứt, vỡ", hskLevel: 4, radical: "石", strokeCount: 10, example: "弄破了", exampleTranslation: "làm rách rồi", tags: ["Bài 19", "Tính từ"] },
      { id: "hsk4-l19-w10", hanzi: "功夫", pinyin: "gōngfu", hanViet: "công phu", vietnamese: "võ thuật kungfu, công phu", hskLevel: 4, radical: "工", strokeCount: 7, example: "中国功夫", exampleTranslation: "kungfu Trung Hoa", tags: ["Bài 19", "Danh từ"] },
      { id: "hsk4-l19-w11", hanzi: "乒乓球", pinyin: "pīngpāngqiú", hanViet: "binh bàng cầu", vietnamese: "bóng bàn", hskLevel: 4, radical: "丿", strokeCount: 22, example: "打乒乓球", exampleTranslation: "chơi bóng bàn", tags: ["Bài 19", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l19-ex1",
        type: "multiple_choice",
        question: "Chọn đáp án đúng: '俗话说“生命______运动”，大家要多锻炼。'",
        options: ["A. 在于", "B. 按照", "C. 随着", "D. 难道"],
        correctAnswer: "A. 在于",
        explanation: "Thành ngữ '生命在于运动' (Sự sống cốt ở vận động)."
      }
    ],
    cultureBonus: {
      title: "舌尖上的中国——饺子 (Hương vị sủi cảo ngày Tết)",
      summary: "Món ăn quốc hồn quốc túy tượng trưng cho sự sum vầy và phát tài.",
      content: "Sủi cảo có hình dáng giống thỏi vàng nén (nguyên bảo), ăn vào đêm Giao thừa (từ giờ Tý chuyển giao năm mới) biểu trưng cho may mắn cát tường và gia đình đoàn tụ sum vầy."
    }
  },

  // LESSON 20: 路上的风景
  {
    lessonNumber: 20,
    titleHanzi: "路上的风景",
    titlePinyin: "Lù shang de fēngjǐng",
    titleVietnamese: "Phong cảnh trên đường đi",
    pageStart: 127,
    objectives: [
      "Cấu trúc hành động song hành lặp lại 'V+着+V+着'.",
      "Kết cấu liên từ điều kiện thời gian '一……就……'.",
      "Sử dụng phó từ truy vấn '究竟' (rốt cuộc) và phân biệt với '到底'.",
      "Bổ ngữ xu hướng '起来' biểu thị bắt đầu hành động.",
      "Cấu trúc nhắc tới chủ đề 'V+起' (nói đến, nhắc đến)."
    ],
    texts: [
      {
        id: "hsk4-l20-t1",
        title: "课文 1 (小张去北京，朋友送小张去机场)",
        context: "Hành trình ra sân bay Thủ đô và lịch trình chuyến bay.",
        lines: [
          { speaker: "朋友", hanzi: "该加油了，去机场的路上有加油站吗？", pinyin: "Gāi jiāyóu le, qù jīchǎng de lù shang yǒu jiāyóuzhàn ma?", vietnamese: "Phải đổ xăng rồi, trên đường ra sân bay có cây xăng nào không?" },
          { speaker: "小张", hanzi: "我记得过了长江大桥往右一拐就有一个，大概有四五公里远。", pinyin: "Wǒ jìde guò le Chángjiāng Dàqiáo wǎng yòu yì guǎi jiù yǒu yí ge, dàgài yǒu sì-wǔ gōnglǐ yuǎn.", vietnamese: "Mình nhớ qua cầu lớn Trường Giang rẽ phải một đoạn là có một cây xăng, cách tầm 4 - 5 cây số." },
          { speaker: "朋友", hanzi: "好，那我就放心了，别开着开着没油了。你去北京的航班是几点的？时间来得及吗？", pinyin: "Hǎo, nà wǒ jiù fàngxīn le, bié kāizhe kāizhe méi yóu le. Nǐ qù Běijīng de hángbān shì jǐ diǎn de? Shíjiān láidejí ma?", vietnamese: "Thế thì mình yên tâm rồi, kẻo đang lái lại hết xăng giữa đường. Chuyến bay đi Bắc Kinh của cậu mấy giờ? Thời gian có kịp không?" },
          { speaker: "小张", hanzi: "航班本来是十点的，后来机场网站上通知推迟了一个小时，所以九点半以前到就应该没问题。", pinyin: "Hángbān běnlái shì shí diǎn de, hòulái jīchǎng wǎngzhàn shang tōngzhī tuīchí le yí ge xiǎoshí, suǒyǐ jiǔ diǎn bàn yǐqián dào jiù yīnggāi méi wèntí.", vietnamese: "Chuyến bay vốn là 10 giờ, sau đó website sân bay thông báo hoãn lại một tiếng, nên trước 9 giờ rưỡi đến là ổn thỏa." }
        ]
      },
      {
        id: "hsk4-l20-t2",
        title: "课文 2 (孙月和丈夫计划放寒假带女儿去旅行)",
        context: "Lên kế hoạch du lịch mùa đông ấm áp tại Quảng Tây cùng gia đình.",
        lines: [
          { speaker: "孙月", hanzi: "女儿下个星期就要放寒假了，到时候咱们带她去旅游，放宽松松，怎么样？", pinyin: "Nǚ'ér xià ge xīngqī jiù yào fàng hánjià le, dào shíhou zánmen dài tā qù lǚyóu, fàngsōng fàngsōng, zěnmeyàng?", vietnamese: "Tuần sau con gái được nghỉ đông rồi, đến lúc đó chúng mình đưa con đi du lịch thư giãn nhé?" },
          { speaker: "丈夫", hanzi: "平时女儿那么多课，总是说想去旅行，但是没时间，怪可怜的。这次放假咱们带她去哪儿玩儿比较好呢？", pinyin: "Píngshí nǚ'ér nàme duō kè, zǒngshì shuō xiǎng qù lǚxíng, dànshì méi shíjiān, guài kělián de. Zhè cì fàngjià zánmen dài tā qù nǎr wánr bǐjiào hǎo ne?", vietnamese: "Bình thường con học nhiều quá, cứ bảo muốn đi chơi mà không có thời gian, tội nghiệp thật. Kỳ nghỉ này đưa con đi đâu chơi thì hợp nhỉ?" },
          { speaker: "孙月", hanzi: "去年我同事带她儿子去广西玩儿了一趟，听说很不错，我们就去广西吧。那里即使是冬天也十分暖和，还能吃到许多新鲜的水果。", pinyin: "Qùnián wǒ tóngshì dài tā érzi qù Guǎngxī wánr le yí tàng, tīngshuō hěn búcuò, wǒmen jiù qù Guǎngxī ba. Nàlǐ jíshǐ shì dōngtiān yě shífēn nuǎnhuo, hái néng chīdào xǔduō xīnxiān de shuǐguǒ.", vietnamese: "Năm ngoái đồng nghiệp em đưa con trai đi Quảng Tây chơi một chuyến, nghe bảo thích lắm, mình đi Quảng Tây nhé. Ở đó dù mùa đông cũng rất ấm áp, lại được ăn nhiều trái cây tươi ngon." }
        ]
      },
      {
        id: "hsk4-l20-t3",
        title: "课文 3 (安娜向马克介绍去丽江旅行的经验)",
        context: "Kinh nghiệm khám phá phố cổ Lệ Giang và phong tục các dân tộc thiểu số.",
        lines: [
          { speaker: "马克", hanzi: "这么多照片，都是你这次去丽江旅行时照的？那里的自然风景可真美！", pinyin: "Zhè me duō zhàopiàn, dōu shì nǐ zhè cì qù Lìjiāng lǚxíng shí zhào de? Nàlǐ de zìrán fēngjǐng kě zhēn měi!", vietnamese: "Nhiều ảnh thế này, đều là ảnh cậu chụp trong chuyến đi Lệ Giang lần này hả? Cảnh quan thiên nhiên ở đó đẹp tuyệt vời!" },
          { speaker: "安娜", hanzi: "是啊，小城四季的风景都很美，而且环境保护得也很好，因此每年都吸引着成千上万的游客去那儿旅游。明年的春季和秋季去丽江最合适不过了。", pinyin: "Shì a, xiǎochéng sìjì de fēngjǐng dōu hěn měi, érqiě huánjìng bǎohù de yě hěn hǎo, yīncǐ měi nián dōu xīyǐnzhe chéngqiān-shàngwàn de yóukè qù nàr lǚyóu. Míngnián de chūnjì hé qiūjì qù Lìjiāng zuì héshì búguò le.", vietnamese: "Đúng vậy, bốn mùa nơi phố nhỏ đều đẹp như tranh, môi trường bảo tồn rất tốt nên hàng năm thu hút hàng vạn lượt du khách. Mùa xuân và mùa thu năm sau là thời điểm lý tưởng nhất để tới Lệ Giang đấy." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l20-g1",
        title: "1. Cấu trúc lặp hành động 'V+着+V+着' (Đang... thì bỗng...)",
        explanation: "Biểu thị trong quá trình một hành động đang liên tục diễn ra thì phát sinh một trạng thái hoặc hành động mới.",
        examples: [
          { hanzi: "别开着开着没油了。", pinyin: "Bié kāizhe kāizhe méi yóu le.", vietnamese: "Đừng để đang lái xe lại hết xăng giữa chừng." }
        ]
      },
      {
        id: "hsk4-l20-g2",
        title: "2. Cấu trúc chủ đề 'V+起' (Nhắc đến, bàn về...)",
        explanation: "Thường dùng với các động từ: 说起, 提起, 聊起, 想起... để dẫn ra chủ đề bắt đầu bàn luận.",
        examples: [
          { hanzi: "说起吃的东西，给我印象最深的是湖南菜。", pinyin: "Shuōqǐ chī de dōngxi, gěi wǒ yìnxiàng zuì shēn de shì Húnán cài.", vietnamese: "Nói đến đồ ăn, món để lại ấn tượng sâu đậm nhất cho tôi là ẩm thực Hồ Nam." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l20-w1", hanzi: "加油站", pinyin: "jiāyóuzhàn", hanViet: "gia du trạm", vietnamese: "cây xăng, trạm đổ xăng", hskLevel: 4, radical: "力", strokeCount: 22, example: "去加油站", exampleTranslation: "đến cây xăng", tags: ["Bài 20", "Danh từ"] },
      { id: "hsk4-l20-w2", hanzi: "航班", pinyin: "hángbān", hanViet: "hàng ban", vietnamese: "chuyến bay", hskLevel: 4, radical: "舟", strokeCount: 20, example: "乘坐航班", exampleTranslation: "đi chuyến bay", tags: ["Bài 20", "Danh từ"] },
      { id: "hsk4-l20-w3", hanzi: "推迟", pinyin: "tuīchí", hanViet: "thôi trì", vietnamese: "trì hoãn, lùi lại", hskLevel: 4, radical: "扌", strokeCount: 23, example: "航班推迟", exampleTranslation: "chuyến bay bị hoãn", tags: ["Bài 20", "Động từ"] },
      { id: "hsk4-l20-w4", hanzi: "高速公路", pinyin: "gāosù gōnglù", hanViet: "cao tốc công lộ", vietnamese: "đường cao tốc", hskLevel: 4, radical: "高", strokeCount: 41, example: "上高速公路", exampleTranslation: "lên đường cao tốc", tags: ["Bài 20", "Danh từ"] },
      { id: "hsk4-l20-w5", hanzi: "登机牌", pinyin: "dēngjīpái", hanViet: "đăng cơ bài", vietnamese: "thẻ lên máy bay, boarding pass", hskLevel: 4, radical: "癶", strokeCount: 30, example: "换登机牌", exampleTranslation: "đổi thẻ lên máy bay", tags: ["Bài 20", "Danh từ"] },
      { id: "hsk4-l20-w6", hanzi: "首都", pinyin: "shǒudū", hanViet: "thủ đô", vietnamese: "thủ đô", hskLevel: 4, radical: "首", strokeCount: 20, example: "中国首都", exampleTranslation: "thủ đô Trung Quốc", tags: ["Bài 20", "Danh từ"] },
      { id: "hsk4-l20-w7", hanzi: "烤鸭", pinyin: "kǎoyā", hanViet: "khảo áp", vietnamese: "vịt quay", hskLevel: 4, radical: "火", strokeCount: 20, example: "北京烤鸭", exampleTranslation: "vịt quay Bắc Kinh", tags: ["Bài 20", "Danh từ"] },
      { id: "hsk4-l20-w8", hanzi: "究竟", pinyin: "jiūjìng", hanViet: "cứu cánh", vietnamese: "rốt cuộc, suy cho cùng", hskLevel: 4, radical: "穴", strokeCount: 16, example: "究竟怎么回事", exampleTranslation: "rốt cuộc là chuyện gì", tags: ["Bài 20", "Phó từ"] },
      { id: "hsk4-l20-w9", hanzi: "小吃", pinyin: "xiǎochī", hanViet: "tiểu ngật", vietnamese: "món ăn vặt, đồ ăn nhẹ", hskLevel: 4, radical: "小", strokeCount: 9, example: "地方小吃", exampleTranslation: "món ăn vặt địa phương", tags: ["Bài 20", "Danh từ"] },
      { id: "hsk4-l20-w10", hanzi: "收拾", pinyin: "shōushi", hanViet: "thu thập", vietnamese: "dọn dẹp, thu xếp hành lý", hskLevel: 4, radical: "扌", strokeCount: 15, example: "收拾行李", exampleTranslation: "thu dọn hành lý", tags: ["Bài 20", "Động từ"] },
      { id: "hsk4-l20-w11", hanzi: "出发", pinyin: "chūfā", hanViet: "xuất phát", vietnamese: "xuất phát, lên đường", hskLevel: 4, radical: "凵", strokeCount: 10, example: "准时出发", exampleTranslation: "xuất phát đúng giờ", tags: ["Bài 20", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l20-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '他太累了，看着书看______就睡着了。'",
        options: ["A. 着看着", "B. 了看了", "C. 过去", "D. 起来"],
        correctAnswer: "A. 着看着",
        explanation: "Cấu trúc '看着书看着' (đang đọc sách đọc sách thì bỗng ngủ thiếp đi)."
      }
    ],
    cultureBonus: {
      title: "中国的少数民族 (55 Dân tộc thiểu số Trung Hoa)",
      summary: "Bức tranh văn hóa đa sắc màu của 56 dân tộc anh em.",
      content: "Trung Quốc là quốc gia thống nhất gồm 56 dân tộc, trong đó người Hán chiếm trên 90%. 55 dân tộc thiểu số mang đến kho tàng trang phục, âm nhạc, vũ điệu và ngôn ngữ chữ viết phong phú (tiêu biểu như chữ Tạng, Mông Cổ, Choang, Duy Ngô Nhĩ in trên tờ tiền Nhân dân tệ)."
    }
  }
];
