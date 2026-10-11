import { DetailedTextbookLesson } from './newHsk1BookData';

export const HSK4_LESSONS_PART3: DetailedTextbookLesson[] = [
  // LESSON 11: 读书好，读好书，好读书
  {
    lessonNumber: 11,
    titleHanzi: "读书好，读好书，好读书",
    titlePinyin: "Dú shū hǎo, dú hǎo shū, hào dú shū",
    titleVietnamese: "Đọc sách tốt, đọc sách hay, thích đọc sách",
    pageStart: 2,
    objectives: [
      "Sử dụng kết cấu nhấn mạnh với giới từ '连……都/也……'.",
      "Nắm vững liên từ '否则' (nếu không thì / bằng không).",
      "Sử dụng liên từ '无论……都/也……' diễn đạt điều kiện vô điều kiện.",
      "Phân biệt cách dùng giữa '无论' và '不管'.",
      "Sử dụng liên từ chuyển ngoặt '然而' và quan hệ tăng tiến '同时'."
    ],
    texts: [
      {
        id: "hsk4-l11-t1",
        title: "课文 1 (马克介绍自己学习汉语的方法)",
        context: "Đại Vệ và Mã Khắc nói về kinh nghiệm học tiếng Trung trôi chảy.",
        lines: [
          { speaker: "大卫", hanzi: "你来中国才一年，汉语就说得这么流利，真厉害！", pinyin: "Nǐ lái Zhōngguó cái yì nián, Hànyǔ jiù shuō de zhème liúlì, zhēn lìhai!", vietnamese: "Cậu đến Trung Quốc mới một năm mà tiếng Trung nói lưu loát thế, cừ thật đấy!" },
          { speaker: "马克", hanzi: "谢谢！其实我的语法不太好，很多句子说得都不太准确。", pinyin: "Xièxie! Qíshí wǒ de yǔfǎ bú tài hǎo, hěn duō jùzi shuō de dōu bú tài zhǔnquè.", vietnamese: "Cảm ơn nhé! Thực ra ngữ pháp của mình không tốt lắm, nhiều câu nói chưa chuẩn xác." },
          { speaker: "大卫", hanzi: "但是我看你跟中国人交流没什么问题，你是怎么做到的？", pinyin: "Dànshì wǒ kàn nǐ gēn Zhōngguórén jiāoliú méi shénme wèntí, nǐ shì zěnme zuòdào de?", vietnamese: "Nhưng mình thấy cậu giao tiếp với người Trung Quốc chẳng có vấn đề gì cả, cậu làm thế nào vậy?" },
          { speaker: "马克", hanzi: "平时多交一些中国朋友，经常和他们聊天儿，听说能力自然就能得到很大的提高。另外，我建议你坚持看中文报纸，这样能学到很多新词语。", pinyin: "Píngshí duō jiāo yìxiē Zhōngguó péngyou, jīngcháng hé tāmen liáotiānr, tīngshuō nénglì zìrán jiù néng dédào hěn dà de tígāo. Lìngwài, wǒ jiànyì nǐ jiānchí kàn Zhōngwén bàozhǐ, zhèyàng néng xuédào hěn duō xīn cíyǔ.", vietnamese: "Bình thường kết bạn nhiều với người Trung Quốc, thường xuyên nói chuyện với họ, khả năng nghe nói tự nhiên sẽ tiến bộ vượt bậc. Ngoài ra, mình khuyên cậu kiên trì đọc báo tiếng Trung, như vậy học được rất nhiều từ mới." },
          { speaker: "大卫", hanzi: "你太厉害了！连中文报纸都看得懂。", pinyin: "Nǐ tài lìhai le! Lián Zhōngwén bàozhǐ dōu kàn de dǒng.", vietnamese: "Cậu giỏi quá! Ngay cả báo tiếng Trung cũng đọc hiểu được." },
          { speaker: "马克", hanzi: "刚开始肯定有困难，不过遇到不认识的词语，你可以查词典，然后写在本子上，有空儿就拿出来复习一下，慢慢地就会发现中文报纸也没那么难了。", pinyin: "Gāng kāishǐ kěndìng yǒu kùnnan, búguò yùdào bú rènshi de cíyǔ, nǐ kěyǐ chá cídiǎn, ránhòu xiě zài běnzi shang, yǒu kòngr jiù ná chūlai fùxí yíxià, mànmàn de jiù huì fāxiàn Zhōngwén bàozhǐ yě méi nàme nán le.", vietnamese: "Lúc đầu chắc chắn có khó khăn, nhưng gặp từ mới thì cậu tra từ điển rồi ghi vào sổ tay, rảnh rỗi lấy ra ôn lại một chút, dần dần sẽ thấy đọc báo tiếng Trung không khó đến vậy đâu." }
        ]
      },
      {
        id: "hsk4-l11-t2",
        title: "课文 2 (小夏和小雨聊考试的情况)",
        context: "Tiểu Hạ và Tiểu Vũ trao đổi sau khi làm bài thi.",
        lines: [
          { speaker: "小夏", hanzi: "考试结束了，你对自己的成绩满意吗？", pinyin: "Kǎoshì jiéshù le, nǐ duì zìjǐ de chéngjì mǎnyì ma?", vietnamese: "Thi xong rồi, cậu có hài lòng với điểm số của mình không?" },
          { speaker: "小雨", hanzi: "说真的，我不太满意。这次阅读考试的题太多了，我没做完。", pinyin: "Shuō zhēn de, wǒ bú tài mǎnyì. Zhè cì yuèdú kǎoshì de tí tài duō le, wǒ méi zuò wán.", vietnamese: "Nói thật lòng thì mình không hài lòng lắm. Đề thi đọc hiểu lần này nhiều câu quá, mình chưa làm xong." },
          { speaker: "小夏", hanzi: "两个小时的时间应该来得及吧？", pinyin: "Liǎng ge xiǎoshí de shíjiān yīnggāi láidejí ba?", vietnamese: "Thời gian hai tiếng chắc là kịp chứ?" },
          { speaker: "小雨", hanzi: "这次主要是因为我先做了比较难、比较复杂的题，结果花了太多时间，后面简单的题我虽然会，可是时间来不及，最后只好放弃了。", pinyin: "Zhè cì zhǔyào shì yīnwèi wǒ xiān zuò le bǐjiào nán, bǐjiào fùzá de tí, jiéguǒ huā le tài duō shíjiān, hòumiàn jiǎndān de tí wǒ suīrán huì, kěshì shíjiān láibují, zuìhòu zhǐhǎo fàngqì le.", vietnamese: "Lần này chủ yếu là vì mình làm trước những câu khó và phức tạp, kết quả tốn quá nhiều thời gian. Những câu đơn giản phía sau tuy mình biết làm nhưng thời gian không kịp, cuối cùng đành phải bỏ qua." },
          { speaker: "小夏", hanzi: "其实我也考得不怎么样。有几个填空题不会做，有几个选择题，实在想不出来该选哪个，就随便猜了一个答案，结果一个都没猜对。", pinyin: "Qíshí wǒ yě kǎo de bù zěnmeyàng. Yǒu jǐ ge tiánkòng tí bú huì zuò, yǒu jǐ ge xuǎnzé tí, shízài xiǎng bù chūlai gāi xuǎn nǎge, jiù suíbiàn cāi le yí ge dá'àn, jiéguǒ yí ge dōu méi cāi duì.", vietnamese: "Thực ra mình thi cũng chẳng ra sao. Có mấy câu điền từ không biết làm, mấy câu trắc nghiệm nghĩ mãi không ra nên chọn cái nào đành đoán bừa một đáp án, kết quả chẳng trúng câu nào." },
          { speaker: "小雨", hanzi: "看来要想考好，不但要认真复习，还得注意考试的方法，否则，会做的题也没时间做了。", pinyin: "Kànlái yào xiǎng kǎohǎo, búdàn yào rènzhēn fùxí, hái děi zhùyì kǎoshì de fāngfǎ, fǒuzé, huì zuò de tí yě méi shíjiān zuò le.", vietnamese: "Xem ra muốn thi tốt thì không chỉ phải chăm chỉ ôn tập mà còn cần chú ý phương pháp làm bài, nếu không thì câu biết làm cũng chẳng còn thời gian để làm." }
        ]
      },
      {
        id: "hsk4-l11-t3",
        title: "课文 3 (小李告诉小林阅读的好处)",
        context: "Tiểu Lý giải thích cho Tiểu Lâm về lợi ích tuyệt vời của việc đọc sách hàng ngày.",
        lines: [
          { speaker: "小林", hanzi: "你的客厅里怎么到处是书啊？这些书你都喜欢看吗？", pinyin: "Nǐ de kètīng li zěnme dàochù shì shū a? Zhèxiē shū nǐ dōu xǐhuan kàn ma?", vietnamese: "Phòng khách nhà cậu sao đâu đâu cũng thấy sách thế? Những cuốn này cậu đều thích đọc à?" },
          { speaker: "小李", hanzi: "当然，我每天都要看书。无论是普通杂志，还是著名小说，只要打开它们，就会发现，世界上有那么多有意思的事情，有那么多不一样的生活。", pinyin: "Dāngrán, wǒ měi tiān dōu yào kàn shū. Wúlùn shì pǔtōng zázhì, háishi zhùmíng xiǎoshuō, zhǐyào dǎkāi tāmen, jiù huì fāxiàn, shìjiè shang yǒu nàme duō yǒuyìsi de shìqing, yǒu nàme duō bù yíyàng de shēnghuó.", vietnamese: "Đương nhiên rồi, mỗi ngày mình đều đọc sách. Bất kể là tạp chí bình thường hay tiểu thuyết nổi tiếng, chỉ cần mở sách ra sẽ nhận thấy thế giới có biết bao điều thú vị và những mảnh đời muôn màu muôn vẻ." },
          { speaker: "小林", hanzi: "想不到你工作那么忙，还能每天坚持阅读。", pinyin: "Xiǎngbúdào nǐ gōngzuò nàme máng, hái néng měi tiān jiānchí yuèdú.", vietnamese: "Không ngờ công việc bận rộn như thế mà cậu vẫn duy trì thói quen đọc sách mỗi ngày." },
          { speaker: "小李", hanzi: "如果3分钟读一页书，半个小时就可以读10页。每天花半个小时来读书，一个月就可以读300页，差不多就是一本书了。", pinyin: "Rúguǒ sān fēnzhōng dú yí yè shū, bàn ge xiǎoshí jiù kěyǐ dú shí yè. Měi tiān huā bàn ge xiǎoshí lái dú shū, yí ge yuè jiù kěyǐ dú sānbǎi yè, chàbuduō jiù shì yì běn shū le.", vietnamese: "Nếu 3 phút đọc 1 trang sách thì nửa tiếng có thể đọc 10 trang. Mỗi ngày dành nửa tiếng đọc sách, một tháng sẽ đọc được 300 trang, xấp xỉ bằng một cuốn sách rồi." },
          { speaker: "小林", hanzi: "是啊，一个真正爱看书的人总能找出时间来阅读。", pinyin: "Shì a, yí ge zhēnzhèng ài kàn shū de rén zǒng néng zhǎochū shíjiān lái yuèdú.", vietnamese: "Đúng vậy, một người thực sự yêu sách luôn luôn tìm ra thời gian để đọc." },
          { speaker: "小李", hanzi: "坚持阅读，除了能增加知识外，还能帮助我减轻压力，人也会变得轻松起来。", pinyin: "Jiānchí yuèdú, chúle néng zēngjiā zhīshi wài, hái néng bāngzhù wǒ jiǎnqīng yālì, rén yě huì biàn de qīngsōng qǐlai.", vietnamese: "Kiên trì đọc sách ngoài việc bồi dưỡng kiến thức còn giúp mình giảm bớt căng thẳng, con người cũng trở nên thư thái hơn." }
        ]
      },
      {
        id: "hsk4-l11-t4",
        title: "课文 4 (短文：如何提高阅读能力)",
        context: "Bí quyết nâng cao năng lực đọc và phương pháp ghi chép nhật ký đọc sách.",
        lines: [
          { speaker: "讲述人", hanzi: "根据调查，阅读能力好的人，不但容易找到工作，而且工资也比较高。怎么才能有效提高自己的阅读能力呢？做读书笔记就是其中一种好方法。读书笔记有很多种，最简单的就是把自己喜欢或者觉得有用的词语和句子记下来。另外，在看完一篇文章或一本书之后，还可以把它的主要内容和自己的想法写下来。然而，你不能完全相信书本上的内容，要有自己的看法和判断。坚持做读书笔记，对提高阅读能力有很大帮助。", pinyin: "Gēnjù diàochá, yuèdú nénglì hǎo de rén, búdàn róngyì zhǎodào gōngzuò, érqiě gōngzī yě bǐjiào gāo. Zěnme cái néng yǒuxiào tígāo zìjǐ de yuèdú nénglì ne? Zuò dūshū bǐjì jiù shì qízhōng yì zhǒng hǎo fāngfǎ. Dúshū bǐjì yǒu hěn duō zhǒng, zuì jiǎndān de jiù shì bǎ zìjǐ xǐhuan huòzhě juéde yǒuyòng de cíyǔ hé jùzi jì xiàlai. Lìngwài, zài kàn wán yì piān wénzhāng huò yì běn shū zhīhòu, hái kěyǐ bǎ tā de zhǔyào nèiróng hé zìjǐ de xiǎngfǎ xiě xiàlai. Rán'ér, nǐ bù néng wánquán xiāngxìn shūběn shang de nèiróng, yào yǒu zìjǐ de kànfǎ hé pànduàn. Jiānchí zuò dúshū bǐjì, duì tígāo yuèdú nénglì yǒu hěn dà bāngzhù.", vietnamese: "Theo khảo sát, người có năng lực đọc hiểu tốt không chỉ dễ tìm việc làm mà mức lương cũng cao hơn. Làm sao để nâng cao năng lực đọc một cách hiệu quả? Ghi chép sổ tay đọc sách là một phương pháp rất hay. Có nhiều cách ghi chép, đơn giản nhất là ghi lại những từ ngữ và câu văn mình yêu thích hoặc hữu ích. Ngoài ra, sau khi đọc xong một bài viết hay cuốn sách, còn có thể ghi lại nội dung chính cùng suy nghĩ của bản thân. Tuy nhiên, bạn không nên tin hoàn toàn vào sách vở, cần có góc nhìn và sự phán đoán riêng. Kiên trì ghi chép đọc sách sẽ giúp ích rất lớn cho việc nâng cao khả năng đọc hiểu." }
        ]
      },
      {
        id: "hsk4-l11-t5",
        title: "课文 5 (短文：读书好，读好书，好读书)",
        context: "Giải mã ý nghĩa triết lý ba tầng của câu thành ngữ kinh điển về đọc sách.",
        lines: [
          { speaker: "讲述人", hanzi: "“读书好(hǎo)，读好(hǎo)书，好(hào)读书”。虽然这句话只用了三个相同的汉字，但是不同的顺序却表示了不同的意思。首先，“读书好”说的是读书有很多好处；其次，每个人的时间都是有限的，不可能把世界上每一本书都读完，所以要读好的书；最后，“好读书”就是要养成阅读的习惯，使读书真正成为自己的兴趣爱好。阅读有许多好处，它能丰富你的知识，让你找到解决问题的办法；同时，它还会丰富你的情感，使你的生活更精彩。所以，让阅读成为你的习惯吧！", pinyin: "\"Dú shū hǎo, dú hǎo shū, hào dú shū\". Suīrán zhè jù huà zhǐ yòng le sān ge xiāngtóng de Hànzì, dànshì bù tóng de shùnxù què biǎoshì le bù tóng de yìsi. Shǒuxiān, \"dú shū hǎo\" shuō de shì dú shū yǒu hěn duō hǎochu; qícì, měi ge rén de shíjiān dōu shì yǒuxiàn de, bù kěnéng bǎ shìjiè shang měi yì běn shū dōu dú wán, suǒyǐ yào dú hǎo de shū; zuìhòu, \"hào dú shū\" jiù shì yào yǎngchéng yuèdú de xíguàn, shǐ dú shū zhēnzhèng chéngwéi zìjǐ de xìngqù àihào. Yuèdú yǒu xǔduō hǎochu, tā néng fēngfù nǐ de zhīshi, ràng nǐ zhǎodào jiějué wèntí de bànfǎ; tóngshí, tā hái huì fēngfù nǐ de qínggǎn, shǐ nǐ de shēnghuó gèng jīngcǎi. Suǒyǐ, ràng yuèdú chéngwéi nǐ de xíguàn ba!", vietnamese: "'Đọc sách tốt, đọc sách hay, say mê đọc sách'. Tuy câu nói này chỉ dùng ba chữ Hán giống nhau, nhưng thứ tự khác nhau lại biểu đạt ý nghĩa khác nhau. Đầu tiên, 'đọc sách tốt' nói rằng đọc sách đem lại rất nhiều lợi ích; thứ hai, thời gian của mỗi người đều có hạn, không thể đọc hết mọi cuốn sách trên đời, vì thế phải chọn sách hay mà đọc; cuối cùng, 'say mê đọc sách' tức là rèn luyện thói quen đọc sách để việc đọc trở thành niềm đam mê đích thực. Đọc sách mở rộng tri thức, chỉ đường giải quyết vấn đề, đồng thời bồi đắp tâm hồn, giúp cuộc sống thêm muôn phần rực rỡ. Vì thế, hãy biến việc đọc sách thành thói quen mỗi ngày của bạn!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l11-g1",
        title: "1. Giới từ '连……都/也……' (Ngay cả... cũng...)",
        explanation: "Dùng để nhấn mạnh một trường hợp điển hình hoặc cực đoan để làm nổi bật tình huống chung.",
        examples: [
          { hanzi: "你太厉害了！连中文报纸都看得懂。", pinyin: "Nǐ tài lìhai le! Lián Zhōngwén bàozhǐ dōu kàn de dǒng.", vietnamese: "Cậu giỏi quá! Ngay cả báo tiếng Trung cũng đọc hiểu được." },
          { hanzi: "如果连你自己都不喜欢自己，怎么能让别人喜欢你呢？", pinyin: "Rúguǒ lián nǐ zìjǐ dōu bù xǐhuan zìjǐ, zěnme néng ràng biérén xǐhuan nǐ ne?", vietnamese: "Nếu ngay cả chính bản thân cậu cũng không yêu quý mình thì làm sao người khác yêu quý cậu được?" }
        ]
      },
      {
        id: "hsk4-l11-g2",
        title: "2. Liên từ '否则' (Nếu không thì, bằng không)",
        explanation: "Dùng ở vế câu sau biểu thị kết quả suy đoán nếu không thực hiện điều kiện ở vế câu trước.",
        examples: [
          { hanzi: "看来要想考好，不但要认真复习，还得注意考试的方法，否则，会做的题也没时间做了。", pinyin: "Kànlái yào xiǎng kǎohǎo, búdàn yào rènzhēn fùxí, hái děi zhùyì kǎoshì de fāngfǎ, fǒuzé, huì zuò de tí yě méi shíjiān zuò le.", vietnamese: "Xem ra muốn thi tốt cần chú ý phương pháp làm bài, nếu không câu biết làm cũng không kịp giờ." },
          { hanzi: "你最好下午四点前去公司找她，否则就明天早上去吧。", pinyin: "Nǐ zuìhǎo xiàwǔ sì diǎn qián qù gōngsī zhǎo tā, fǒuzé jiù míngtiān zǎoshang qù ba.", vietnamese: "Tốt nhất cậu đến công ty tìm cô ấy trước 4 giờ chiều, bằng không thì sáng mai hãy đi." }
        ]
      },
      {
        id: "hsk4-l11-g3",
        title: "3. Liên từ '无论……都/也……' & So sánh với '不管'",
        explanation: "'无论' mang tính văn viết, trang trọng hơn '不管'. Sau '无论' thường là các từ phiếm chỉ (什么, 怎么...) hoặc kết cấu lựa chọn (A还是B).",
        examples: [
          { hanzi: "无论是普通杂志，还是著名小说，只要打开它们，就会发现许多乐趣。", pinyin: "Wúlùn shì pǔtōng zázhì, háishi zhùmíng xiǎoshuō, zhǐyào dǎkāi tāmen, jiù huì fāxiàn xǔduō lèqù.", vietnamese: "Bất kể là tạp chí thường hay tiểu thuyết danh tiếng, chỉ cần mở ra là tìm thấy nhiều niềm vui." }
        ]
      },
      {
        id: "hsk4-l11-g4",
        title: "4. Liên từ chuyển ý '然而' (Tuy nhiên, thế nhưng)",
        explanation: "Thường đứng ở đầu vế câu sau để biểu thị sự chuyển ngoặt nghĩa rõ rệt, tính chất văn viết cao.",
        examples: [
          { hanzi: "他虽然失败了很多次，然而一直没有放弃。", pinyin: "Tā suīrán shībài le hěn duō cì, rán'ér yìzhí méiyǒu fàngqì.", vietnamese: "Tuy anh ấy thất bại nhiều lần, thế nhưng chưa từng từ bỏ." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l11-w1", hanzi: "流利", pinyin: "liúlì", hanViet: "lưu lợi", vietnamese: "lưu loát, trôi chảy", hskLevel: 4, radical: "氵", strokeCount: 10, example: "汉语说得很流利", exampleTranslation: "tiếng Trung nói rất lưu loát", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk4-l11-w2", hanzi: "厉害", pinyin: "lìhai", hanViet: "lợi hại", vietnamese: "lợi hại, giỏi giang, dữ dội", hskLevel: 4, radical: "刂", strokeCount: 12, example: "真厉害", exampleTranslation: "thực sự lợi hại", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk4-l11-w3", hanzi: "语法", pinyin: "yǔfǎ", hanViet: "ngữ pháp", vietnamese: "ngữ pháp", hskLevel: 4, radical: "讠", strokeCount: 14, example: "汉语语法", exampleTranslation: "ngữ pháp tiếng Trung", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk4-l11-w4", hanzi: "准确", pinyin: "zhǔnquè", hanViet: "chuẩn xác", vietnamese: "chính xác, chuẩn xác", hskLevel: 4, radical: "冫", strokeCount: 10, example: "发音很准确", exampleTranslation: "phát âm rất chuẩn xác", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk4-l11-w5", hanzi: "词语", pinyin: "cíyǔ", hanViet: "từ ngữ", vietnamese: "từ ngữ", hskLevel: 4, radical: "讠", strokeCount: 14, example: "学习新词语", exampleTranslation: "học từ ngữ mới", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk4-l11-w6", hanzi: "连", pinyin: "lián", hanViet: "liên", vietnamese: "ngay cả, đến cả", hskLevel: 4, radical: "辶", strokeCount: 7, example: "连报纸都看懂", exampleTranslation: "ngay cả báo cũng đọc hiểu", tags: ["Bài 11", "Giới từ"] },
      { id: "hsk4-l11-w7", hanzi: "阅读", pinyin: "yuèdú", hanViet: "duyệt độc", vietnamese: "đọc hiểu, đọc sách", hskLevel: 4, radical: "门", strokeCount: 18, example: "阅读能力", exampleTranslation: "khả năng đọc hiểu", tags: ["Bài 11", "Động từ"] },
      { id: "hsk4-l11-w8", hanzi: "来得及", pinyin: "láidejí", hanViet: "lai đắc cập", vietnamese: "kịp giờ, còn kịp", hskLevel: 4, radical: "木", strokeCount: 16, example: "时间还来得及", exampleTranslation: "thời gian vẫn còn kịp", tags: ["Bài 11", "Động từ"] },
      { id: "hsk4-l11-w9", hanzi: "复杂", pinyin: "fùzá", hanViet: "phức tạp", vietnamese: "phức tạp, rắc rối", hskLevel: 4, radical: "夂", strokeCount: 16, example: "情况很复杂", exampleTranslation: "tình hình rất phức tạp", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk4-l11-w10", hanzi: "只好", pinyin: "zhǐhǎo", hanViet: "chỉ hảo", vietnamese: "đành phải, buộc phải", hskLevel: 4, radical: "口", strokeCount: 11, example: "只好放弃", exampleTranslation: "đành phải từ bỏ", tags: ["Bài 11", "Phó từ"] },
      { id: "hsk4-l11-w11", hanzi: "填空", pinyin: "tiánkòng", hanViet: "điền không", vietnamese: "điền vào chỗ trống", hskLevel: 4, radical: "土", strokeCount: 21, example: "填空题", exampleTranslation: "câu hỏi điền từ", tags: ["Bài 11", "Động từ"] },
      { id: "hsk4-l11-w12", hanzi: "猜", pinyin: "cāi", hanViet: "sai", vietnamese: "đoán, phỏng đoán", hskLevel: 4, radical: "犭", strokeCount: 11, example: "猜谜语", exampleTranslation: "đoán câu đố", tags: ["Bài 11", "Động từ"] },
      { id: "hsk4-l11-w13", hanzi: "否则", pinyin: "fǒuzé", hanViet: "phủ tắc", vietnamese: "nếu không thì, bằng không", hskLevel: 4, radical: "口", strokeCount: 13, example: "快点，否则迟到了", exampleTranslation: "nhanh lên kẻo muộn", tags: ["Bài 11", "Liên từ"] },
      { id: "hsk4-l11-w14", hanzi: "客厅", pinyin: "kètīng", hanViet: "khách sảnh", vietnamese: "phòng khách", hskLevel: 4, radical: "宀", strokeCount: 13, example: "打扫客厅", exampleTranslation: "dọn dẹp phòng khách", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk4-l11-w15", hanzi: "无论", pinyin: "wúlùn", hanViet: "vô luận", vietnamese: "bất kể, bất luận", hskLevel: 4, radical: "无", strokeCount: 10, example: "无论如何", exampleTranslation: "bất luận thế nào", tags: ["Bài 11", "Liên từ"] },
      { id: "hsk4-l11-w16", hanzi: "杂志", pinyin: "zázhì", hanViet: "tạp chí", vietnamese: "tạp chí", hskLevel: 4, radical: "木", strokeCount: 14, example: "时尚杂志", exampleTranslation: "tạp chí thời trang", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk4-l11-w17", hanzi: "著名", pinyin: "zhùmíng", hanViet: "trứ danh", vietnamese: "nổi tiếng, trứ danh", hskLevel: 4, radical: "艹", strokeCount: 14, example: "著名作家", exampleTranslation: "nhà văn nổi tiếng", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk4-l11-w18", hanzi: "增加", pinyin: "zēngjiā", hanViet: "tăng gia", vietnamese: "tăng thêm, gia tăng", hskLevel: 4, radical: "土", strokeCount: 20, example: "增加知识", exampleTranslation: "tăng thêm tri thức", tags: ["Bài 11", "Động từ"] },
      { id: "hsk4-l11-w19", hanzi: "文章", pinyin: "wénzhāng", hanViet: "văn chương", vietnamese: "bài văn, bài báo", hskLevel: 4, radical: "文", strokeCount: 15, example: "写文章", exampleTranslation: "viết bài văn", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk4-l11-w20", hanzi: "精彩", pinyin: "jīngcǎi", hanViet: "tinh thải", vietnamese: "đặc sắc, tuyệt vời", hskLevel: 4, radical: "米", strokeCount: 28, example: "表演很精彩", exampleTranslation: "biểu diễn rất đặc sắc", tags: ["Bài 11", "Tính từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l11-ex1",
        type: "multiple_choice",
        question: "Điền từ thích hợp: '平时要多加练习，______到考试的时候就会很紧张。'",
        options: ["A. 否则", "B. 即使", "C. 无论", "D. 难道"],
        correctAnswer: "A. 否则",
        explanation: "'否则' nghĩa là 'nếu không thì', phù hợp diễn tả hệ quả nếu không luyện tập thường xuyên."
      }
    ],
    cultureBonus: {
      title: "中国古典文学名著——《西游记》 (Tây Du Ký)",
      summary: "Một trong Tứ đại danh tác của văn học cổ điển Trung Quốc.",
      content: "《Tây Du Ký》 sáng tác vào thời nhà Minh bởi tác giả Ngô Thừa Ân. Tác phẩm kể về hành trình thầy trò Đường Tăng, Tôn Ngộ Không, Trư Bát Giới và Sa Tăng trải qua 81 kiếp nạn sang Tây Thiên thỉnh kinh, biểu trưng cho lòng kiên trì và tinh thần vượt khó."
    }
  },

  // LESSON 12: 用心发现世界
  {
    lessonNumber: 12,
    titleHanzi: "用心发现世界",
    titlePinyin: "Yòng xīn fāxiàn shìjiè",
    titleVietnamese: "Dùng trái tim khám phá thế giới",
    pageStart: 15,
    objectives: [
      "Sử dụng liên từ '并且' biểu thị hai hành động/tính chất cùng tồn tại hoặc tăng tiến.",
      "Cấu trúc giả thiết nhượng bộ '再……也……' (dù có... thế nào đi nữa).",
      "Sử dụng giới từ '对于' và phân biệt với '关于'.",
      "Nắm vững hiện tượng trùng điệp lượng từ (名量词重叠: 人人, 天天, 本本).",
      "Sử dụng từ '相反' biểu thị tính tương phản."
    ],
    texts: [
      {
        id: "hsk4-l12-t1",
        title: "课文 1 (王经理做生意遇到了困难)",
        context: "Vương giám đốc và Mã giám đốc trao đổi về kinh nghiệm giải quyết bế tắc kinh doanh.",
        lines: [
          { speaker: "王经理", hanzi: "听说这次生意你到现在还没谈成。", pinyin: "Tīngshuō zhè cì shēngyi nǐ dào xiànzài hái méi tánchéng.", vietnamese: "Nghe nói vụ làm ăn lần này anh đến giờ vẫn chưa đàm phán thành công." },
          { speaker: "马经理", hanzi: "按我以前的经验，早应该谈成了，这次我也不知道哪儿出了问题。", pinyin: "Àn wǒ yǐqián de jīngyàn, zǎo yīnggāi tánchéng le, zhè cì wǒ yě bù zhīdào nǎr chū le wèntí.", vietnamese: "Theo kinh nghiệm trước đây của tôi thì đáng lẽ phải xong từ sớm rồi, lần này tôi cũng chẳng biết trục trặc ở đâu." },
          { speaker: "王经理", hanzi: "有句话叫“规定和经验是死的，人是活的”。当“规定”和“经验”不能解决问题时，建议你改变一下自己的态度和想法。", pinyin: "Yǒu jù huà jiào \"guīdìng hé jīngyàn shì sǐ de, rén shì huó de\". Dāng \"guīdìng\" hé \"jīngyàn\" bù néng jiějué wèntí shí, jiànyì nǐ gǎibiàn yíxià zìjǐ de tàidu hé xiǎngfǎ.", vietnamese: "Có câu nói rằng 'quy định và kinh nghiệm là chết, con người mới là sống'. Khi quy định và kinh nghiệm không giải quyết được vấn đề, tôi khuyên anh nên thay đổi thái độ và cách nghĩ của mình." },
          { speaker: "马经理", hanzi: "很多时候，我都习惯根据过去的经验做事，可惜，经验不是全部都是对的。", pinyin: "Hěn duō shíhou, wǒ dōu xíguàn gēnjù guòqù de jīngyàn zuò shì, kěxī, jīngyàn bú shì quánbù dōu shì duì de.", vietnamese: "Nhiều lúc tôi quen làm việc dựa trên kinh nghiệm cũ, đáng tiếc là kinh nghiệm không phải lúc nào cũng đúng hoàn toàn." },
          { speaker: "王经理", hanzi: "遇到不能解决的问题时，我们应该试着走走以前从来没走过的路，也许这样就能找到解决问题的方法了。", pinyin: "Yùdào bù néng jiějué de wèntí shí, wǒmen yīnggāi shìzhe zǒuzhou yǐqián cónglái méi zǒuguo de lù, yěxǔ zhèyàng jiù néng zhǎodào jiějué wèntí de fāngfǎ le.", vietnamese: "Khi gặp vấn đề nan giải, chúng ta nên thử đi trên con đường chưa từng đi bao giờ, có lẽ như thế sẽ tìm ra lối thoát." }
        ]
      },
      {
        id: "hsk4-l12-t2",
        title: "课文 2 (高老师告诉女儿洗衣服的方法)",
        context: "Cô Cao chia sẻ mẹo vặt cuộc sống giúp quần áo không phai màu.",
        lines: [
          { speaker: "女儿", hanzi: "妈，您看我刚买的裤子，洗完以后颜色怎么变得这么难看呢？", pinyin: "Mā, nín kàn wǒ gāng mǎi de kùzi, xǐ wán yǐhòu yánsè zěnme biàn de zhème nánkàn ne?", vietnamese: "Mẹ ơi, mẹ xem chiếc quần con vừa mua, giặt xong sao màu sắc lại biến thành xấu thế này ạ?" },
          { speaker: "高老师", hanzi: "看来是掉颜色了，你洗的时候在水里加点儿盐就不会这样了。", pinyin: "Kànlái shì diào yánsè le, nǐ xǐ de shíhou zài shuǐ li jiā diǎnr yán jiù bú huì zhèyàng le.", vietnamese: "Xem ra bị phai màu rồi, lúc giặt con cho thêm chút muối vào nước thì sẽ không bị như vậy." },
          { speaker: "女儿", hanzi: "放盐？！盐不是用来做饭的吗？难道它还能让衣服不掉颜色？", pinyin: "Fàng yán?! Yán bú shì yòng lái zuò fàn de ma? Nándào tā hái néng ràng yīfu bù diào yánsè?", vietnamese: "Cho muối ạ?! Muối không phải dùng để nấu ăn sao mẹ? Lẽ nào muối còn giữ cho áo quần không phai màu?" },
          { speaker: "高老师", hanzi: "当然。有些衣服第一次洗的时候会掉颜色，其实有很多方法可以解决。在水里加勺盐再洗是最简单的方法。实际上很多问题的答案都可以从生活中找到，这需要你用眼睛去发现，用心去总结。", pinyin: "Dāngrán. Yǒuxiē yīfu dì-yī cì xǐ de shíhou huì diào yánsè, qíshí yǒu hěn duō fāngfǎ kěyǐ jiějué. Zài shuǐ li jiā sháo yán zài xǐ shì zuì jiǎndān de fāngfǎ. Shíjì shang hěn duō wèntí de dá'àn dōu kěyǐ cóng shēnghuó zhōng zhǎodào, zhè xūyào nǐ yòng yǎnjing qù fāxiàn, yòng xīn qù zǒngjié.", vietnamese: "Đương nhiên rồi. Quần áo mới giặt lần đầu rất dễ phai màu, thực ra có nhiều mẹo để giải quyết. Thêm một thìa muối vào nước là cách giản tiện nhất. Thực tế đáp án của nhiều vấn đề đều bắt nguồn từ đời sống, chỉ cần con dùng mắt để quan sát và dùng tâm để đúc kết." }
        ]
      },
      {
        id: "hsk4-l12-t3",
        title: "课文 3 (高老师学习王教授的教育方法)",
        context: "Thảo luận về nghệ thuật giáo dục 'nhân tài thi giáo' của Khổng Tử.",
        lines: [
          { speaker: "高老师", hanzi: "王教授，今天听完您的这节课，我终于明白为什么您的课那么受学生欢迎了。", pinyin: "Wáng jiàoshòu, jīntiān tīng wán nín de zhè jié kè, wǒ zhōngyú míngbai wèishénme nín de kè nàme shòu xuésheng huānyíng le.", vietnamese: "Giáo sư Vương, hôm nay dự xong tiết học của thầy, em đã hiểu vì sao bài giảng của thầy lại được học trò đón nhận nồng nhiệt đến vậy." },
          { speaker: "王教授", hanzi: "哪里哪里，这只是因为我对每个学生的能力水平比较了解。", pinyin: "Nǎlǐ nǎlǐ, zhè zhǐ shì yīnwèi wǒ duì měi ge xuésheng de nénglì shuǐpíng bǐjiào liǎojiě.", vietnamese: "Đâu có đâu có, đó chỉ là vì tôi khá thấu hiểu trình độ và năng lực của từng học sinh thôi." },
          { speaker: "高老师", hanzi: "那您认为对于老师来说，什么是最难做到的？", pinyin: "Nà nín rènwéi duìyú lǎoshī lái shuō, shénme shì zuì nán zuòdào de?", vietnamese: "Vậy theo thầy, đối với người làm giáo viên, điều gì là khó thực hiện nhất ạ?" },
          { speaker: "王教授", hanzi: "世界上没有完全相同的叶子，同样地，世界上也没有完全一样的人。所以，在教育学生时，要根据学生的特点选择不同的方法，我想这应该最不容易做到的。", pinyin: "Shìjiè shang méiyǒu wánquán xiāngtóng de yèzi, tóngyàng de, shìjiè shang yě méiyǒu wánquán yíyàng de rén. Suǒyǐ, zài jiàoyù xuésheng shí, yào gēnjù xuésheng de tèdiǎn xuǎnzé bù tóng de fāngfǎ, wǒ xiǎng zhè yīnggāi zuì bù róngyì zuòdào de.", vietnamese: "Trên thế giới không có hai chiếc lá hoàn toàn giống nhau, cũng như không có hai con người hoàn toàn y hệt. Vì vậy khi dạy dỗ học sinh, phải căn cứ vào tính cách và năng khiếu của từng em để chọn phương pháp, đây chính là điều khó làm nhất." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l12-g1",
        title: "1. Liên từ '并且' (Đồng thời, và lại)",
        explanation: "Dùng nối các động từ hoặc tính từ song song, biểu thị hành động xảy ra cùng lúc hoặc mức độ bổ sung thêm một bậc.",
        examples: [
          { hanzi: "他做事很认真，并且有丰富的经验。", pinyin: "Tā zuò shì hěn rènzhēn, bìngqiě yǒu fēngfù de jīngyàn.", vietnamese: "Anh ấy làm việc rất chăm chỉ, lại còn có kinh nghiệm phong phú." }
        ]
      },
      {
        id: "hsk4-l12-g2",
        title: "2. Cấu trúc '再……也……' (Dù có... đến mấy cũng...)",
        explanation: "Biểu thị giả thiết nhượng bộ ở mức độ cực đoan nhưng kết quả vẫn không đổi.",
        examples: [
          { hanzi: "事情已经发生了，你再后悔也无法改变，别伤心了。", pinyin: "Shìqing yǐjīng fāshēng le, nǐ zài hòuhuǐ yě wúfǎ gǎibiàn, bié shāngxīn le.", vietnamese: "Chuyện đã xảy ra rồi, cậu có hối hận đến mấy cũng không thể thay đổi, đừng buồn nữa." }
        ]
      },
      {
        id: "hsk4-l12-g3",
        title: "3. Giới từ '对于' & Phân biệt với '关于'",
        explanation: "'对于' chỉ đối tượng hướng tới của hành vi hoặc thái độ; '关于' nêu ra phạm vi chủ đề của sự việc.",
        examples: [
          { hanzi: "对于这件事，我跟大家的看法不同。", pinyin: "Duìyú zhè jiàn shì, wǒ gēn dàjiā de kànfǎ bù tóng.", vietnamese: "Đối với sự việc này, quan điểm của tôi khác với mọi người." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l12-w1", hanzi: "规定", pinyin: "guīdìng", hanViet: "quy định", vietnamese: "quy định, nguyên tắc", hskLevel: 4, radical: "讠", strokeCount: 16, example: "遵守规定", exampleTranslation: "tuân thủ quy định", tags: ["Bài 12", "Danh từ"] },
      { id: "hsk4-l12-w2", hanzi: "死", pinyin: "sǐ", hanViet: "tử", vietnamese: "chết, cứng nhắc", hskLevel: 4, radical: "歹", strokeCount: 6, example: "规定是死的", exampleTranslation: "quy định là cứng nhắc", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk4-l12-w3", hanzi: "可惜", pinyin: "kěxī", hanViet: "khả tích", vietnamese: "đáng tiếc", hskLevel: 4, radical: "口", strokeCount: 13, example: "真可惜", exampleTranslation: "thật đáng tiếc", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk4-l12-w4", hanzi: "商量", pinyin: "shāngliang", hanViet: "thương lượng", vietnamese: "bàn bạc, thảo luận", hskLevel: 4, radical: "口", strokeCount: 23, example: "商量一下", exampleTranslation: "bàn bạc một chút", tags: ["Bài 12", "Động từ"] },
      { id: "hsk4-l12-w5", hanzi: "并且", pinyin: "bìngqiě", hanViet: "tịnh thả", vietnamese: "đồng thời, hơn nữa", hskLevel: 4, radical: "一", strokeCount: 13, example: "认真并且努力", exampleTranslation: "chăm chỉ và nỗ lực", tags: ["Bài 12", "Liên từ"] },
      { id: "hsk4-l12-w6", hanzi: "盐", pinyin: "yán", hanViet: "diêm", vietnamese: "muối ăn", hskLevel: 4, radical: "皿", strokeCount: 11, example: "放点儿盐", exampleTranslation: "cho chút muối", tags: ["Bài 12", "Danh từ"] },
      { id: "hsk4-l12-w7", hanzi: "勺子", pinyin: "sháozi", hanViet: "chước tử", vietnamese: "cái thìa, cái muỗng", hskLevel: 4, radical: "勹", strokeCount: 6, example: "一勺盐", exampleTranslation: "một thìa muối", tags: ["Bài 12", "Danh từ"] },
      { id: "hsk4-l12-w8", hanzi: "保护", pinyin: "bǎohù", hanViet: "bảo hộ", vietnamese: "bảo vệ, gìn giữ", hskLevel: 4, radical: "亻", strokeCount: 16, example: "保护环境", exampleTranslation: "bảo vệ môi trường", tags: ["Bài 12", "Động từ"] },
      { id: "hsk4-l12-w9", hanzi: "作用", pinyin: "zuòyòng", hanViet: "tác dụng", vietnamese: "tác dụng, công dụng", hskLevel: 4, radical: "亻", strokeCount: 12, example: "起很大作用", exampleTranslation: "phát huy tác dụng lớn", tags: ["Bài 12", "Danh từ"] },
      { id: "hsk4-l12-w10", hanzi: "无法", pinyin: "wúfǎ", hanViet: "vô pháp", vietnamese: "không thể, bất lực", hskLevel: 4, radical: "无", strokeCount: 12, example: "无法改变", exampleTranslation: "không thể thay đổi", tags: ["Bài 12", "Động từ"] },
      { id: "hsk4-l12-w11", hanzi: "详细", pinyin: "xiángxì", hanViet: "tường tế", vietnamese: "chi tiết, tường tận", hskLevel: 4, radical: "讠", strokeCount: 21, example: "详细解释", exampleTranslation: "giải thích chi tiết", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk4-l12-w12", hanzi: "解释", pinyin: "jiěshì", hanViet: "giải thích", vietnamese: "giải thích", hskLevel: 4, radical: "角", strokeCount: 21, example: "向大家解释", exampleTranslation: "giải thích cho mọi người", tags: ["Bài 12", "Động từ"] },
      { id: "hsk4-l12-w13", hanzi: "对于", pinyin: "duìyú", hanViet: "đối vu", vietnamese: "đối với, về phía", hskLevel: 4, radical: "寸", strokeCount: 8, example: "对于这个问题", exampleTranslation: "đối với vấn đề này", tags: ["Bài 12", "Giới từ"] },
      { id: "hsk4-l12-w14", hanzi: "叶子", pinyin: "yèzi", hanViet: "diệp tử", vietnamese: "lá cây", hskLevel: 4, radical: "口", strokeCount: 8, example: "绿色的叶子", exampleTranslation: "lá cây màu xanh", tags: ["Bài 12", "Danh từ"] },
      { id: "hsk4-l12-w15", hanzi: "教育", pinyin: "jiàoyù", hanViet: "giáo dục", vietnamese: "giáo dục, dạy dỗ", hskLevel: 4, radical: "攵", strokeCount: 19, example: "教育孩子", exampleTranslation: "giáo dục con trẻ", tags: ["Bài 12", "Động từ"] },
      { id: "hsk4-l12-w16", hanzi: "事半功倍", pinyin: "shì bàn gōng bèi", hanViet: "sự bán công bội", vietnamese: "làm chơi ăn thật, nửa công gấp đôi quả", hskLevel: 4, radical: "亅", strokeCount: 24, example: "事半功倍的效果", exampleTranslation: "hiệu quả gấp đôi tốn nửa công", tags: ["Bài 12", "Thành ngữ"] },
      { id: "hsk4-l12-w17", hanzi: "相反", pinyin: "xiāngfǎn", hanViet: "tương phản", vietnamese: "trái lại, ngược lại", hskLevel: 4, radical: "目", strokeCount: 13, example: "结果相反", exampleTranslation: "kết quả trái ngược", tags: ["Bài 12", "Liên từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l12-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '______这个问题，我们明天开会详细讨论。'",
        options: ["A. 对于", "B. 即使", "C. 无论", "D. 并且"],
        correctAnswer: "A. 对于",
        explanation: "'对于' dùng ở đầu câu để dẫn ra đối tượng được thảo luận."
      }
    ],
    cultureBonus: {
      title: "孔子“因材施教” (Khổng Tử dạy học theo năng khiếu)",
      summary: "Triết lý giáo dục vĩ đại của Vạn thế sư biểu Khổng Tử.",
      content: "Khổng Tử căn cứ vào sở trường, tính cách của Tử Lộ và Nhiễm Hữu để đưa ra hai lời khuyên hoàn toàn khác nhau cho cùng một câu hỏi, đặt nền móng cho phương pháp sư phạm cá nhân hóa."
    }
  },

  // LESSON 13: 喝着茶看京剧
  {
    lessonNumber: 13,
    titleHanzi: "喝着茶看京剧",
    titlePinyin: "Hēzhe chá kàn jīngjù",
    titleVietnamese: "Uống trà thưởng thức kinh kịch",
    pageStart: 28,
    objectives: [
      "Sử dụng phó từ '大概' biểu thị sự ước lượng và khả năng cao.",
      "Sử dụng phó từ chỉ tần suất '偶尔' (thỉnh thoảng, đôi khi).",
      "Giới từ '由' chỉ người phụ trách thực hiện công việc.",
      "Động từ '进行' kết hợp với danh từ hai âm tiết trang trọng.",
      "Giới từ '随着' biểu thị sự biến chuyển theo thời gian hoặc hoàn cảnh."
    ],
    texts: [
      {
        id: "hsk4-l13-t1",
        title: "课文 1 (小雨和小夏在聊小夏的爷爷表演京剧的情况)",
        context: "Tiểu Vũ trò chuyện cùng Tiểu Hạ về niềm đam mê Kinh kịch của người ông.",
        lines: [
          { speaker: "小雨", hanzi: "小夏，你爷爷京剧唱得真专业，我还以为他是京剧演员呢。", pinyin: "Xiǎoyǔ: Xiǎoxià, nǐ yéye jīngjù chàng de zhēn zhuānyè, wǒ hái yǐwéi tā shì jīngjù yǎnyuán ne.", vietnamese: "Tiểu Hạ ơi, ông nội cậu hát Kinh kịch chuyên nghiệp thật đấy, mình cứ tưởng ông là diễn viên kịch chuyên nghiệp cơ." },
          { speaker: "小夏", hanzi: "对啊，他本来就是京剧演员，年轻时在我们那儿很有名，深受观众们的喜爱。", pinyin: "Xiǎoxià: Duì a, tā běnlái jiù shì jīngjù yǎnyuán, niánqīng shí zài wǒmen nàr hěn yǒumíng, shēn shòu guānzhòngmen de xǐ'ài.", vietnamese: "Đúng rồi, ông vốn là nghệ sĩ Kinh kịch mà, thời trẻ ở quê mình ông nổi tiếng lắm, được đông đảo khán giả mến mộ." },
          { speaker: "小雨", hanzi: "你爷爷一定对京剧有着很深厚的感情。", pinyin: "Xiǎoyǔ: Nǐ yéye yídìng duì jīngjù yǒuzhe hěn shēnhòu de gǎnqíng.", vietnamese: "Ông nội cậu chắc hẳn có tình cảm vô cùng sâu nặng với Kinh kịch." },
          { speaker: "小夏", hanzi: "是呀，他8岁就开始上台演出，到现在大概唱了60多年了，他对这门艺术的喜爱从来没有改变过。", pinyin: "Xiǎoxià: Shì ya, tā bā suì jiù kāishǐ shàngtái yǎnchū, dào xiànzài dàgài chàng le liùshí duō nián le, tā duì zhè mén yìshù de xǐ'ài cónglái méiyǒu gǎibiàn guo.", vietnamese: "Đúng thế, ông 8 tuổi đã bắt đầu lên sân khấu biểu diễn, đến nay xấp xỉ hát hơn 60 năm rồi, tình yêu của ông với môn nghệ thuật này chưa từng đổi thay." }
        ]
      },
      {
        id: "hsk4-l13-t2",
        title: "课文 2 (小雨和马克在聊京剧)",
        context: "Mã Khắc chia sẻ trải nghiệm học hát Kinh kịch độc đáo của mình.",
        lines: [
          { speaker: "小雨", hanzi: "真没想到你一个来自美国的外国留学生，能把京剧唱得这么好。", pinyin: "Xiǎoyǔ: Zhēn méi xiǎngdào nǐ yí ge láizì Měiguó de wàiguó liúxuéshēng, néng bǎ jīngjù chàng de zhème hǎo.", vietnamese: "Thật không ngờ một lưu học sinh người Mỹ như cậu lại có thể hát Kinh kịch hay đến thế." },
          { speaker: "马克", hanzi: "我常常跟着电视学唱京剧，然后一遍一遍地练习，偶尔跟中国人一起唱上几句。", pinyin: "Mǎkè: Wǒ chángcháng gēnzhe diànshì xué chàng jīngjù, ránhòu yí biàn yí biàn de liànxí, ǒu'ěr gēn Zhōngguórén yìqǐ chàng shang jǐ jù.", vietnamese: "Mình thường học hát theo ti vi, sau đó luyện tập từng lượt từng lượt một, thỉnh thoảng hát giao lưu vài câu với người Trung Quốc." },
          { speaker: "小雨", hanzi: "难道你从来没有接受过京剧方面的专门教育吗？", pinyin: "Xiǎoyǔ: Nándào nǐ cónglái méiyǒu jiēshòuguo jīngjù fāngmiàn de zhuānmén jiàoyù ma?", vietnamese: "Chẳng lẽ cậu chưa từng qua trường lớp đào tạo chuyên môn nào về Kinh kịch ư?" },
          { speaker: "马克", hanzi: "别吃惊，因为我以前学习过音乐，有一些音乐基础，又对京剧这种表演艺术非常感兴趣，所以能比较容易地学会它的唱法。", pinyin: "Mǎkè: Bié chījīng, yīnwèi wǒ yǐqián xuéxíguo yīnyuè, yǒu yìxiē yīnyuè jīchǔ, yòu duì jīngjù zhè zhǒng biǎoyǎn yìshù fēicháng gǎn xìngqù, suǒyǐ néng bǐjiào róngyì de xuéhuì tā de chàngfǎ.", vietnamese: "Đừng ngạc nhiên, vì trước đây mình từng học âm nhạc, có sẵn nền tảng và lại cực kỳ hứng thú với nghệ thuật biểu diễn Kinh kịch nên học hát tương đối nhanh." }
        ]
      },
      {
        id: "hsk4-l13-t3",
        title: "课文 3 (李老师和校长在谈工作)",
        context: "Thầy Lý đề xuất tổ chức ngày hội văn hóa truyền thống Trung Hoa.",
        lines: [
          { speaker: "李老师", hanzi: "校长，因为外国留学生不了解中国文化，有时候会影响他们和中国人之间的正常交流，甚至还可能引起误会，所以我们想申请举办一次中国传统文化节活动。", pinyin: "Lǐ lǎoshī: Xiàozhǎng, yīnwèi wàiguó liúxuéshēng bù liǎojiě Zhōngguó wénhuà, yǒushíhou huì yǐngxiǎng tāmen hé Zhōngguórén zhījiān de zhèngcháng jiāoliú, shènzhì hái kěnéng yǐnqǐ wùhuì, suǒyǐ wǒmen xiǎng shēnqǐng jǔbàn yí cì Zhōngguó chuántǒng wénhuà jié huódòng.", vietnamese: "Thưa Hiệu trưởng, vì du học sinh nước ngoài chưa hiểu nhiều về văn hóa Trung Quốc nên đôi khi ảnh hưởng đến việc giao tiếp và có thể gây hiểu lầm, vì vậy chúng em muốn xin phép tổ chức Lễ hội Văn hóa Truyền thống Trung Hoa ạ." },
          { speaker: "校长", hanzi: "你们的想法很好，举办文化节活动，一方面能让各国学生更好地了解中国，另一方面也能为学生们提供相互交流和学习的机会。这次活动继续由你负责，相信也一定会很成功。", pinyin: "Xiàozhǎng: Nǐmen de xiǎngfǎ hěn hǎo, jǔbàn wénhuà jié huódòng, yì fāngmiàn néng ràng gè guó xuésheng gèng hǎo de liǎojiě Zhōngguó, lìng yì fāngmiàn yě néng wèi xuéshengmen tígōng xiānghù jiāoliú hé xuéxí de jīhuì. Zhè cì huódòng jìxù yóu nǐ fùzé, xiāngxìn yě yídìng huì hěn chénggōng.", vietnamese: "Ý tưởng của các thầy cô rất tốt. Tổ chức lễ hội văn hóa một mặt giúp sinh viên các nước hiểu hơn về Trung Quốc, mặt khác tạo cơ hội giao lưu học hỏi lẫn nhau. Sự kiện lần này tiếp tục do thầy phụ trách nhé, tôi tin chắc sẽ rất thành công." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l13-g1",
        title: "1. Giới từ '由' (Do ai đảm nhiệm/chịu trách nhiệm)",
        explanation: "Dẫn ra người hoặc đơn vị trực tiếp phụ trách thực hiện công việc.",
        examples: [
          { hanzi: "这次活动继续由你负责。", pinyin: "Zhè cì huódòng jìxù yóu nǐ fùzé.", vietnamese: "Hoạt động lần này tiếp tục do thầy phụ trách." }
        ]
      },
      {
        id: "hsk4-l13-g2",
        title: "2. Giới từ '随着' (Cùng với, theo đà...)",
        explanation: "Biểu thị sự việc xảy ra theo sau sự biến đổi của hoàn cảnh.",
        examples: [
          { hanzi: "随着社会的发展，人们的生活水平越来越高。", pinyin: "Suízhe shèhuì de fāzhǎn, rénmen de shēnghuó shuǐpíng yuè lái yuè gāo.", vietnamese: "Cùng với sự phát triển của xã hội, mức sống con người ngày càng cao." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l13-w1", hanzi: "京剧", pinyin: "jīngjù", hanViet: "kinh kịch", vietnamese: "Kinh kịch Bắc Kinh", hskLevel: 4, radical: "亠", strokeCount: 22, example: "看京剧", exampleTranslation: "xem kinh kịch", tags: ["Bài 13", "Danh từ"] },
      { id: "hsk4-l13-w2", hanzi: "演员", pinyin: "yǎnyuán", hanViet: "diễn viên", vietnamese: "diễn viên", hskLevel: 4, radical: "氵", strokeCount: 23, example: "著名演员", exampleTranslation: "diễn viên nổi tiếng", tags: ["Bài 13", "Danh từ"] },
      { id: "hsk4-l13-w3", hanzi: "观众", pinyin: "guānzhòng", hanViet: "quan chúng", vietnamese: "khán giả, người xem", hskLevel: 4, radical: "见", strokeCount: 12, example: "热情的观众", exampleTranslation: "khán giả nhiệt tình", tags: ["Bài 13", "Danh từ"] },
      { id: "hsk4-l13-w4", hanzi: "厚", pinyin: "hòu", hanViet: "hậu", vietnamese: "dày, sâu đậm", hskLevel: 4, radical: "厂", strokeCount: 9, example: "感情深厚", exampleTranslation: "tình cảm sâu đậm", tags: ["Bài 13", "Tính từ"] },
      { id: "hsk4-l13-w5", hanzi: "演出", pinyin: "yǎnchū", hanViet: "diễn xuất", vietnamese: "biểu diễn, buổi diễn", hskLevel: 4, radical: "氵", strokeCount: 19, example: "精彩演出", exampleTranslation: "buổi diễn đặc sắc", tags: ["Bài 13", "Động từ"] },
      { id: "hsk4-l13-w6", hanzi: "大概", pinyin: "dàgài", hanViet: "đại khái", vietnamese: "khoảng chừng, có lẽ", hskLevel: 4, radical: "大", strokeCount: 18, example: "大概需要一个小时", exampleTranslation: "khoảng chừng cần 1 tiếng", tags: ["Bài 13", "Phó từ"] },
      { id: "hsk4-l13-w7", hanzi: "来自", pinyin: "láizì", hanViet: "lai tự", vietnamese: "đến từ, xuất xứ từ", hskLevel: 4, radical: "木", strokeCount: 13, example: "来自北京", exampleTranslation: "đến từ Bắc Kinh", tags: ["Bài 13", "Động từ"] },
      { id: "hsk4-l13-w8", hanzi: "遍", pinyin: "biàn", hanViet: "biến", vietnamese: "lần, lượt (từ đầu đến cuối)", hskLevel: 4, radical: "辶", strokeCount: 12, example: "读三遍", exampleTranslation: "đọc ba lượt", tags: ["Bài 13", "Lượng từ"] },
      { id: "hsk4-l13-w9", hanzi: "偶尔", pinyin: "ǒu'ěr", hanViet: "ngẫu nhĩ", vietnamese: "thỉnh thoảng, đôi khi", hskLevel: 4, radical: "亻", strokeCount: 20, example: "偶尔去喝咖啡", exampleTranslation: "thỉnh thoảng đi uống cà phê", tags: ["Bài 13", "Phó từ"] },
      { id: "hsk4-l13-w10", hanzi: "吃惊", pinyin: "chījīng", hanViet: "ngật kinh", vietnamese: "kinh ngạc, giật mình", hskLevel: 4, radical: "口", strokeCount: 18, example: "令人吃惊", exampleTranslation: "khiến người ta kinh ngạc", tags: ["Bài 13", "Động từ"] },
      { id: "hsk4-l13-w11", hanzi: "基础", pinyin: "jīchǔ", hanViet: "cơ sở", vietnamese: "nền tảng, căn bản", hskLevel: 4, radical: "土", strokeCount: 22, example: "汉语基础", exampleTranslation: "nền tảng tiếng Trung", tags: ["Bài 13", "Danh từ"] },
      { id: "hsk4-l13-w12", hanzi: "申请", pinyin: "shēnqǐng", hanViet: "thân thỉnh", vietnamese: "nộp đơn xin, đăng ký", hskLevel: 4, radical: "申", strokeCount: 15, example: "申请奖学金", exampleTranslation: "xin học bổng", tags: ["Bài 13", "Động từ"] },
      { id: "hsk4-l13-w13", hanzi: "由", pinyin: "yóu", hanViet: "do", vietnamese: "do, bởi", hskLevel: 4, radical: "田", strokeCount: 5, example: "由他负责", exampleTranslation: "do anh ấy chịu trách nhiệm", tags: ["Bài 13", "Giới từ"] },
      { id: "hsk4-l13-w14", hanzi: "讨论", pinyin: "tǎolùn", hanViet: "thảo luận", vietnamese: "thảo luận, bàn bạc", hskLevel: 4, radical: "讠", strokeCount: 11, example: "开会讨论", exampleTranslation: "họp thảo luận", tags: ["Bài 13", "Động từ"] },
      { id: "hsk4-l13-w15", hanzi: "随着", pinyin: "suízhe", hanViet: "tùy trứ", vietnamese: "cùng với, theo đà", hskLevel: 4, radical: "阝", strokeCount: 22, example: "随着时间过去", exampleTranslation: "theo thời gian trôi qua", tags: ["Bài 13", "Giới từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l13-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '这项研究工作______李教授全权负责。'",
        options: ["A. 由", "B. 被", "C. 给", "D. 把"],
        correctAnswer: "A. 由",
        explanation: "'由' biểu thị người chịu trách nhiệm trực tiếp ('由李教授负责')."
      }
    ],
    cultureBonus: {
      title: "中国的筷子文化 (Văn hóa đũa của người Trung Hoa)",
      summary: "Biểu tượng văn hóa ẩm thực truyền thống hơn 3000 năm.",
      content: "Đũa tượng trưng cho đạo lý Âm - Dương hài hòa, thẳng thắn, chính trực và tinh thần đoàn kết trong bữa cơm gia đình truyền thống Trung Hoa."
    }
  },

  // LESSON 14: 保护地球母亲
  {
    lessonNumber: 14,
    titleHanzi: "保护地球母亲",
    titlePinyin: "Bǎohù dìqiú mǔqīn",
    titleVietnamese: "Bảo vệ mẹ Trái Đất",
    pageStart: 42,
    objectives: [
      "Nắm vững tính từ/động từ '够' biểu thị sự đủ đầy hoặc mức độ.",
      "Sử dụng giới từ '以' (lấy, bằng cách / để mà).",
      "Sử dụng liên từ nhân quả '既然……就……' (đã... thì...).",
      "Sử dụng liên từ '于是' và phân biệt với '因此'.",
      "Sử dụng trợ từ liệt kê '什么的' trong khẩu ngữ."
    ],
    texts: [
      {
        id: "hsk4-l14-t1",
        title: "课文 1 (李进要出差，王静和李进在聊天儿)",
        context: "Vương Tĩnh nhắc nhở Lý Tiến chuẩn bị hành lý và ý thức bảo vệ môi trường.",
        lines: [
          { speaker: "王静", hanzi: "这是明天你出差要带的毛巾、牙膏和牙刷，把它们放到箱子里吧。", pinyin: "Zhè shì míngtiān nǐ chūchāi yào dài de máojīn, yágāo hé yáshuā, bǎ tāmen fàng dào xiāngzi li ba.", vietnamese: "Đây là khăn mặt, kem đánh răng và bàn chải ngày mai anh đi công tác mang theo, cho vào vali nhé." },
          { speaker: "李进", hanzi: "不用拿这些，宾馆都会免费提供的。再说，箱子已经够重的了！", pinyin: "Bú yòng ná zhèxiē, bīnguǎn dōu huì miǎnfèi tígōng de. Zàishuō, xiāngzi yǐjīng gòu zhòng de le!", vietnamese: "Không cần mang mấy thứ này đâu, khách sạn đều cung cấp miễn phí mà. Hơn nữa, vali đã đủ nặng rồi!" },
          { speaker: "王静", hanzi: "我当然知道宾馆里有。你不是一直说要保护环境吗？现在就从身边的小事做起吧。", pinyin: "Wǒ dāngrán zhīdào bīnguǎn li yǒu. Nǐ bú shì yìzhí shuō yào bǎohù huánjìng ma? Xiànzài jiù cóng shēnbiān de xiǎoshì zuò qǐ ba.", vietnamese: "Em đương nhiên biết khách sạn có. Chẳng phải anh luôn miệng nói muốn bảo vệ môi trường sao? Bây giờ hãy bắt đầu làm từ những việc nhỏ quanh mình đi." }
        ]
      },
      {
        id: "hsk4-l14-t2",
        title: "课文 2 (经理和服务员在谈工作)",
        context: "Quản lý nhắc nhở nhân viên phục vụ về vệ sinh nhà hàng và tốc độ làm việc.",
        lines: [
          { speaker: "经理", hanzi: "小王，卫生间怎么那么脏啊？这会给客人留下不好的印象，快去打扫一下。", pinyin: "Jīnglǐ: Xiǎowáng, wèishēngjiān zěnme nàme zāng a? Zhè huì gěi kèrén liúxià bù hǎo de yìnxiàng, kuài qù dǎsǎo yíxià.", vietnamese: "Tiểu Vương, nhà vệ sinh sao bẩn thế? Thế này sẽ để lại ấn tượng xấu cho khách đấy, mau đi dọn dẹp đi." },
          { speaker: "服务员", hanzi: "经理，实在抱歉。今天店里太忙了，我还没来得及打扫。", pinyin: "Fúwùyuán: Jīnglǐ, shízài bàoqiàn. Jīntiān diàn li tài máng le, wǒ hái méi láidejí dǎsǎo.", vietnamese: "Giám đốc, thật sự xin lỗi ạ. Hôm nay quán đông khách quá, em chưa kịp dọn." },
          { speaker: "经理", hanzi: "那张桌子下面还有一些空饮料瓶子和纸盒子。", pinyin: "Jīnglǐ: Nà zhāng zhuōzi xiàmiàn hái yǒu yìxiē kōng yǐnliào píngzi hé zhǐ hézi.", vietnamese: "Dưới gầm bàn kia vẫn còn mấy vỏ chai nước ngọt rỗng và hộp giấy đấy." },
          { speaker: "服务员", hanzi: "好的，我马上就去把它们扔掉。我一定以最快的速度完成。", pinyin: "Fúwùyuán: Hǎo de, wǒ mǎshàng jiù qù bǎ tāmen rēngdiào. Wǒ yídìng yǐ zuì kuài de sùdù wánchéng.", vietnamese: "Vâng, em lập tức đi vứt ngay. Em nhất định sẽ hoàn thành với tốc độ nhanh nhất ạ." }
        ]
      },
      {
        id: "hsk4-l14-t3",
        title: "课文 3 (孙月和王静在聊关于环保的事情)",
        context: "Tôn Nguyệt và Vương Tĩnh nói về chiến dịch Giờ Trái Đất (地球一小时).",
        lines: [
          { speaker: "孙月", hanzi: "早上听新闻说明天有一个叫“地球一小时”的活动，你对这个活动了解吗？", pinyin: "Sūnyuè: Zǎoshang tīng xīnwén shuō míngtiān yǒu yí ge jiào \"Dìqiú Yì Xiǎoshí\" de huódòng, nǐ duì zhè ge huódòng liǎojiě ma?", vietnamese: "Sáng nay nghe thời sự nói ngày mai có sự kiện 'Giờ Trái Đất', cậu có biết sự kiện này không?" },
          { speaker: "王静", hanzi: "这个活动年年都有，最早是从2007年开始的。明天晚上很多人都会关灯一小时，支持这个活动。你没看到门口的通知吗？我们公司也参加。", pinyin: "Wángjìng: Zhè ge huódòng niánnián dōu yǒu, zuì zǎo shì cóng èr líng líng qī nián kāishǐ de. Míngtiān wǎnshang hěn duō rén dōu huì guāndēng yì xiǎoshí, zhīchí zhè ge huódòng. Nǐ méi kàndào ménkǒu de tōngzhī ma? Wǒmen gōngsī yě cānjiā.", vietnamese: "Sự kiện này năm nào cũng có, sớm nhất bắt đầu từ năm 2007. Tối mai rất nhiều người sẽ tắt đèn 1 tiếng để ủng hộ. Cậu không thấy thông báo ở cửa à? Công ty chúng mình cũng tham gia đấy." },
          { speaker: "孙月", hanzi: "真的吗？太好了！既然明天晚上公司会关灯停电，那么我们肯定不用加班了。", pinyin: "Sūnyuè: Zhēn de ma? Tài hǎo le! Jìrán míngtiān wǎnshang gōngsī huì guāndēng tíngdiàn, nàme wǒmen kěndìng bú yòng jiābān le.", vietnamese: "Thật hả? Tuyệt quá! Đã là tối mai công ty tắt đèn cúp điện thì chắc chắn chúng mình không phải làm thêm giờ rồi!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l14-g1",
        title: "1. Liên từ '既然……就/那么……' (Đã... thì...)",
        explanation: "Dùng để nêu ra một tiền đề/hiện thực đã rõ ràng ở vế đầu, từ đó suy ra hành động hoặc kết luận tất yếu ở vế sau.",
        examples: [
          { hanzi: "既然你不想去，那就别去了。", pinyin: "Jìrán nǐ bù xiǎng qù, nà jiù bié qù le.", vietnamese: "Đã không muốn đi thì đừng đi nữa." }
        ]
      },
      {
        id: "hsk4-l14-g2",
        title: "2. Liên từ '于是' & Phân biệt với '因此'",
        explanation: "'于是' nhấn mạnh sự kiện B diễn ra nối tiếp ngay sau sự kiện A theo logic thời gian; '因此' nhấn mạnh nguyên nhân - kết quả.",
        examples: [
          { hanzi: "下雨了，于是大家都跑进了屋子。", pinyin: "Xiàyǔ le, yúshì dàjiā dōu pǎojìn le wūzi.", vietnamese: "Trời đổ mưa, thế là mọi người đều chạy ùa vào trong nhà." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l14-w1", hanzi: "出差", pinyin: "chūchāi", hanViet: "xuất sai", vietnamese: "đi công tác", hskLevel: 4, radical: "凵", strokeCount: 15, example: "去上海出差", exampleTranslation: "đi công tác Thượng Hải", tags: ["Bài 14", "Động từ"] },
      { id: "hsk4-l14-w2", hanzi: "毛巾", pinyin: "máojīn", hanViet: "mao cân", vietnamese: "khăn mặt", hskLevel: 4, radical: "毛", strokeCount: 7, example: "一条毛巾", exampleTranslation: "một chiếc khăn mặt", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk4-l14-w3", hanzi: "牙膏", pinyin: "yágāo", hanViet: "nha cao", vietnamese: "kem đánh răng", hskLevel: 4, radical: "牙", strokeCount: 18, example: "买牙膏", exampleTranslation: "mua kem đánh răng", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk4-l14-w4", hanzi: "污染", pinyin: "wūrǎn", hanViet: "ô nhiễm", vietnamese: "ô nhiễm", hskLevel: 4, radical: "氵", strokeCount: 15, example: "空气污染", exampleTranslation: "ô nhiễm không khí", tags: ["Bài 14", "Động từ"] },
      { id: "hsk4-l14-w5", hanzi: "卫生间", pinyin: "wèishēngjiān", hanViet: "vệ sinh gian", vietnamese: "nhà vệ sinh, phòng vệ sinh", hskLevel: 4, radical: "卫", strokeCount: 16, example: "打扫卫生间", exampleTranslation: "dọn phòng vệ sinh", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk4-l14-w6", hanzi: "脏", pinyin: "zāng", hanViet: "tạng", vietnamese: "bẩn, dơ", hskLevel: 4, radical: "月", strokeCount: 10, example: "衣服很脏", exampleTranslation: "quần áo rất bẩn", tags: ["Bài 14", "Tính từ"] },
      { id: "hsk4-l14-w7", hanzi: "抱歉", pinyin: "bàoqiàn", hanViet: "bão khiểm", vietnamese: "xin lỗi, áy náy", hskLevel: 4, radical: "扌", strokeCount: 18, example: "感到抱歉", exampleTranslation: "cảm thấy áy náy", tags: ["Bài 14", "Động từ"] },
      { id: "hsk4-l14-w8", hanzi: "空", pinyin: "kōng", hanViet: "không", vietnamese: "rỗng, trống không", hskLevel: 4, radical: "穴", strokeCount: 8, example: "空盒子", exampleTranslation: "hộp rỗng", tags: ["Bài 14", "Tính từ"] },
      { id: "hsk4-l14-w9", hanzi: "盒子", pinyin: "hézi", hanViet: "hạp tử", vietnamese: "cái hộp", hskLevel: 4, radical: "皿", strokeCount: 11, example: "纸盒子", exampleTranslation: "hộp giấy", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk4-l14-w10", hanzi: "扔", pinyin: "rēng", hanViet: "nhưng", vietnamese: "ném, vứt", hskLevel: 4, radical: "扌", strokeCount: 5, example: "扔垃圾", exampleTranslation: "vứt rác", tags: ["Bài 14", "Động từ"] },
      { id: "hsk4-l14-w11", hanzi: "速度", pinyin: "sùdù", hanViet: "tốc độ", vietnamese: "tốc độ", hskLevel: 4, radical: "辶", strokeCount: 20, example: "速度很快", exampleTranslation: "tốc độ rất nhanh", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk4-l14-w12", hanzi: "地球", pinyin: "dìqiú", hanViet: "địa cầu", vietnamese: "Trái Đất, quả địa cầu", hskLevel: 4, radical: "土", strokeCount: 17, example: "保护地球", exampleTranslation: "bảo vệ Trái Đất", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk4-l14-w13", hanzi: "既然", pinyin: "jìrán", hanViet: "ký nhiên", vietnamese: "đã... (thì...)", hskLevel: 4, radical: "旡", strokeCount: 19, example: "既然来了", exampleTranslation: "đã đến rồi", tags: ["Bài 14", "Liên từ"] },
      { id: "hsk4-l14-w14", hanzi: "塑料袋", pinyin: "sùliàodài", hanViet: "tố liêu đại", vietnamese: "túi ni-lông", hskLevel: 4, radical: "土", strokeCount: 30, example: "减少使用塑料袋", exampleTranslation: "giảm sử dụng túi ni-lông", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk4-l14-w15", hanzi: "垃圾桶", pinyin: "lājītǒng", hanViet: "lạp tạp thống", vietnamese: "thùng rác", hskLevel: 4, radical: "土", strokeCount: 28, example: "扔进垃圾桶", exampleTranslation: "vứt vào thùng rác", tags: ["Bài 14", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l14-ex1",
        type: "multiple_choice",
        question: "Chọn từ đúng: '______大家都同意去旅行，那我们就开始订车票吧。'",
        options: ["A. 既然", "B. 尽管", "C. 即使", "D. 无论"],
        correctAnswer: "A. 既然",
        explanation: "'既然' đi kèm tiền đề rõ ràng ('既然大家都同意...')."
      }
    ],
    cultureBonus: {
      title: "“天人合一”——中国人的“人与自然观” (Thiên nhân hợp nhất)",
      summary: "Tư tưởng triết học hòa hợp giữa con người và tự nhiên trong văn hóa Đạo gia.",
      content: "Trang Tử đề xuất tư tưởng con người hòa mình làm một với thiên nhiên vĩ đại, tôn trọng quy luật sinh thái, làm nền tảng cho ý thức bảo vệ môi trường bền vững."
    }
  },

  // LESSON 15: 教育孩子的艺术
  {
    lessonNumber: 15,
    titleHanzi: "教育孩子的艺术",
    titlePinyin: "Jiàoyù háizi de yìshù",
    titleVietnamese: "Nghệ thuật nuôi dạy con trẻ",
    pageStart: 56,
    objectives: [
      "Sử dụng bổ ngữ xu hướng '想起来' chỉ sự hồi tưởng kí ức.",
      "Sử dụng động từ '弄' thay thế nhiều hành động thông tục trong khẩu ngữ.",
      "Sử dụng phó từ dặn dò '千万' (nhất thiết, tuyệt đối) và phân biệt với '一定'.",
      "Sử dụng từ chỉ phạm vi xấp xỉ '左右' sau số lượng từ."
    ],
    texts: [
      {
        id: "hsk4-l15-t1",
        title: "课文 1 (李老师建议王静让孩子养成好习惯)",
        context: "Thầy Lý chia sẻ phương pháp rèn luyện thói quen tự lập và học đàn cho trẻ.",
        lines: [
          { speaker: "王静", hanzi: "那个一边弹钢琴一边唱歌的男孩子是谁？表演得真棒！", pinyin: "Nàge yìbiān tán gāngqín yìbiān chànggē de nánháizi shì shéi? Biǎoyǎn de zhēn bàng!", vietnamese: "Cậu bé vừa chơi đàn piano vừa hát kia là ai thế? Biểu diễn cừ thật đấy!" },
          { speaker: "李老师", hanzi: "是我孙子。去年寒假前的新年晚会他也表演过一次。", pinyin: "Shì wǒ sūnzi. Qùnián hánjià qián de xīnnián wǎnhuì tā yě biǎoyǎnguo yí cì.", vietnamese: "Là cháu nội tôi đấy. Đêm hội mừng năm mới trước kỳ nghỉ đông năm ngoái cháu cũng từng biểu diễn một lần." },
          { speaker: "王静", hanzi: "我想起来了，这孩子又聪明又可爱，你们教育得真好！", pinyin: "Wǒ xiǎng qǐlai le, zhè háizi yòu cōngming yòu kě'ài, nǐmen jiàoyù de zhēn hǎo!", vietnamese: "Em nhớ ra rồi, đứa bé này vừa thông minh vừa đáng yêu, gia đình dạy dỗ khéo quá!" },
          { speaker: "李老师", hanzi: "是他父母教育得好。父母是孩子最重要的老师。如果希望有一个优秀的孩子，你就要先成为一位优秀的父亲或者母亲。", pinyin: "Shì tā fùmǔ jiàoyù de hǎo. Fùmǔ shì háizi zuì zhòngyào de lǎoshī. Rúguǒ xīwàng yǒu yí ge yōuxiù de háizi, nǐ jiù yào xiān chéngwéi yí wèi yōuxiù de fùqīn huòzhě mǔqīn.", vietnamese: "Là do cha mẹ cháu dạy tốt đấy. Cha mẹ là người thầy quan trọng nhất của con trẻ. Nếu mong muốn có một đứa con ưu tú, trước hết bạn phải trở thành một người cha hoặc người mẹ ưu tú." }
        ]
      },
      {
        id: "hsk4-l15-t2",
        title: "课文 2 (王静建议孙月教育孩子学会安排时间)",
        context: "Lời khuyên giúp trẻ em tự giác quản lý thời gian sinh hoạt.",
        lines: [
          { speaker: "王静", hanzi: "看你脸色不太好，是不是昨晚没休息好？", pinyin: "Kàn nǐ liǎnsè bú tài hǎo, shì bú shì zuówǎn méi xiūxi hǎo?", vietnamese: "Thấy sắc mặt cậu không được tốt, có phải tối qua ngủ không ngon không?" },
          { speaker: "孙月", hanzi: "别提了。我女儿昨晚做作业又做到11点。每天因为这些小事批评她，弄得我俩心情都不好。", pinyin: "Bié tí le. Wǒ nǚ'ér zuówǎn zuò zuòyè yòu zuò dào shíyī diǎn. Měi tiān yīnwèi zhèxiē xiǎoshì pīpíng tā, nòng de wǒ liǎ xīnqíng dōu bù hǎo.", vietnamese: "Đừng nhắc nữa. Tối qua con gái mình làm bài tập đến tận 11 giờ đêm. Ngày nào cũng vì mấy chuyện lặt vặt này mà mắng con, làm cả hai mẹ con đều bực mình." },
          { speaker: "王静", hanzi: "孩子做事慢，往往是因为他们不会安排自己的时间。你应该让孩子学会管理时间，自己的事情自己做。", pinyin: "Háizi zuò shì màn, wǎngwǎng shì yīnwèi tāmen bú huì ānpái zìjǐ de shíjiān. Nǐ yīnggāi ràng háizi xuéhuì guǎnlǐ shíjiān, zìjǐ de shìqing zìjǐ zuò.", vietnamese: "Trẻ con làm việc chậm chạp thường là do chưa biết cách sắp xếp thời gian. Cậu nên dạy con học cách quản lý thời gian, việc của mình tự mình làm." }
        ]
      },
      {
        id: "hsk4-l15-t3",
        title: "课文 3 (王静和孙月讨论表扬孩子的方法)",
        context: "Phương pháp khen ngợi đúng mực để khích lệ sự tự tin của trẻ.",
        lines: [
          { speaker: "孙月", hanzi: "表扬也是一门艺术，表扬千万不要太多，过多的表扬可能会给孩子带来压力。不仅起不到鼓励的作用，还可能让孩子怀疑自己的能力。", pinyin: "Biǎoyáng yě shì yì mén yìshù, biǎoyáng qiānwàn bú yào tài duō, guòduō de biǎoyáng kěnéng huì gěi háizi dàilái yālì. Bùjǐn qǐ búdào gǔlì de zuòyòng, hái kěnéng ràng háizi huáiyí zìjǐ de nénglì.", vietnamese: "Khen ngợi cũng là một nghệ thuật, tuyệt đối đừng khen quá đà, khen nhiều quá có thể tạo áp lực cho trẻ. Không những không phát huy tác dụng khích lệ mà còn làm trẻ hoài nghi năng lực của bản thân." },
          { speaker: "王静", hanzi: "那怎么表扬孩子才会有效果呢？", pinyin: "Nà zěnme biǎoyáng háizi cái huì yǒu xiàoguǒ ne?", vietnamese: "Thế phải khen thế nào mới đem lại hiệu quả?" },
          { speaker: "孙月", hanzi: "我认为表扬要及时，而且表扬不仅要看结果，更要看过程，这样才能鼓励他的积极性，让他变得勇敢，不怕困难。", pinyin: "Wǒ rènwéi biǎoyáng yào jíshí, érqiě biǎoyáng bùjǐn yào kàn jiéguǒ, gèng yào kàn guòchéng, zhèyàng cái néng gǔlì tā de jījíxìng, ràng tā biàn de yǒnggǎn, bú pà kùnnan.", vietnamese: "Mình cho rằng khen ngợi cần kịp thời, hơn nữa không chỉ nhìn vào kết quả mà phải nhìn vào cả quá trình nỗ lực, như thế mới khơi dậy tính tích cực, giúp con dũng cảm và không ngại khó khăn." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l15-g1",
        title: "1. Động từ '弄' (Làm, khiến cho)",
        explanation: "Thường dùng trong khẩu ngữ biểu thị thực hiện hành vi hoặc gây ra một kết quả, trạng thái cụ thể.",
        examples: [
          { hanzi: "每天批评她，弄得我俩心情都不好。", pinyin: "Měi tiān pīpíng tā, nòng de wǒ liǎ xīnqíng dōu bù hǎo.", vietnamese: "Ngày nào cũng mắng con, làm cho tâm trạng cả hai mẹ con đều tồi tệ." }
        ]
      },
      {
        id: "hsk4-l15-g2",
        title: "2. Phó từ '千万' (Nhất thiết, tuyệt đối) & So sánh với '一定'",
        explanation: "'千万' dùng nhiều trong câu phủ định dặn dò, khuyên can ('千万别/千万不要'); '一定' dùng trong cả khẳng định và phủ định ('一定要/不一定').",
        examples: [
          { hanzi: "表扬千万不要太多。", pinyin: "Biǎoyáng qiānwàn bú yào tài duō.", vietnamese: "Khen ngợi tuyệt đối đừng quá nhiều." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l15-w1", hanzi: "弹钢琴", pinyin: "tán gāngqín", hanViet: "đàn cương cầm", vietnamese: "chơi đàn piano", hskLevel: 4, radical: "弓", strokeCount: 30, example: "学会弹钢琴", exampleTranslation: "học chơi đàn piano", tags: ["Bài 15", "Cụm từ"] },
      { id: "hsk4-l15-w2", hanzi: "棒", pinyin: "bàng", hanViet: "bổng", vietnamese: "giỏi, cừ khôi, tuyệt", hskLevel: 4, radical: "木", strokeCount: 12, example: "你真棒", exampleTranslation: "cậu giỏi thật đấy", tags: ["Bài 15", "Tính từ"] },
      { id: "hsk4-l15-w3", hanzi: "孙子", pinyin: "sūnzi", hanViet: "tôn tử", vietnamese: "cháu nội", hskLevel: 4, radical: "子", strokeCount: 9, example: "李老师的孙子", exampleTranslation: "cháu nội thầy Lý", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk4-l15-w4", hanzi: "寒假", pinyin: "hánjià", hanViet: "hàn giả", vietnamese: "kỳ nghỉ đông", hskLevel: 4, radical: "宀", strokeCount: 18, example: "放寒假", exampleTranslation: "nghỉ đông", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk4-l15-w5", hanzi: "父亲", pinyin: "fùqīn", hanViet: "phụ thân", vietnamese: "người cha, phụ thân", hskLevel: 4, radical: "父", strokeCount: 20, example: "亲爱的父亲", exampleTranslation: "người cha kính yêu", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk4-l15-w6", hanzi: "闹钟", pinyin: "nàozhōng", hanViet: "náo chung", vietnamese: "đồng hồ báo thức", hskLevel: 4, radical: "门", strokeCount: 20, example: "定闹钟", exampleTranslation: "đặt báo thức", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk4-l15-w7", hanzi: "响", pinyin: "xiǎng", hanViet: "hưởng", vietnamese: "kêu vang, reo chuông", hskLevel: 4, radical: "口", strokeCount: 9, example: "闹钟响了", exampleTranslation: "đồng hồ reo rồi", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w8", hanzi: "醒", pinyin: "xǐng", hanViet: "tỉnh", vietnamese: "thức giấc, tỉnh dậy", hskLevel: 4, radical: "酉", strokeCount: 16, example: "睡醒了", exampleTranslation: "ngủ dậy rồi", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w9", hanzi: "赶", pinyin: "gǎn", hanViet: "cản", vietnamese: "vội vã, đuổi theo, kịp", hskLevel: 4, radical: "走", strokeCount: 10, example: "赶时间", exampleTranslation: "vội vàng vì sợ muộn", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w10", hanzi: "批评", pinyin: "pīpíng", hanViet: "phê bình", vietnamese: "phê bình, chỉ trích", hskLevel: 4, radical: "扌", strokeCount: 15, example: "受到批评", exampleTranslation: "bị phê bình", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w11", hanzi: "弄", pinyin: "nòng", hanViet: "lộng", vietnamese: "làm, khiến cho", hskLevel: 4, radical: "廾", strokeCount: 7, example: "弄坏了", exampleTranslation: "làm hỏng rồi", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w12", hanzi: "管理", pinyin: "guǎnlǐ", hanViet: "quản lý", vietnamese: "quản lý", hskLevel: 4, radical: "竹", strokeCount: 25, example: "管理时间", exampleTranslation: "quản lý thời gian", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w13", hanzi: "打针", pinyin: "dǎzhēn", hanViet: "đả châm", vietnamese: "tiêm thuốc", hskLevel: 4, radical: "扌", strokeCount: 15, example: "去医院打针", exampleTranslation: "đến bệnh viện tiêm thuốc", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w14", hanzi: "护士", pinyin: "hùshi", hanViet: "hộ sĩ", vietnamese: "y tá, điều dưỡng", hskLevel: 4, radical: "扌", strokeCount: 12, example: "温柔的护士", exampleTranslation: "cô y tá dịu dàng", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk4-l15-w15", hanzi: "表扬", pinyin: "biǎoyáng", hanViet: "biểu dương", vietnamese: "khen ngợi, biểu dương", hskLevel: 4, radical: "衣", strokeCount: 14, example: "得到老师表扬", exampleTranslation: "được cô giáo khen ngợi", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w16", hanzi: "千万", pinyin: "qiānwàn", hanViet: "thiên vạn", vietnamese: "nhất thiết, tuyệt đối", hskLevel: 4, radical: "十", strokeCount: 6, example: "千万别迟到", exampleTranslation: "tuyệt đối đừng đến muộn", tags: ["Bài 15", "Phó từ"] },
      { id: "hsk4-l15-w17", hanzi: "怀疑", pinyin: "huáiyí", hanViet: "hoài nghi", vietnamese: "hoài nghi, nghi ngờ", hskLevel: 4, radical: "忄", strokeCount: 22, example: "怀疑自己", exampleTranslation: "hoài nghi bản thân", tags: ["Bài 15", "Động từ"] },
      { id: "hsk4-l15-w18", hanzi: "左右", pinyin: "zuǒyòu", hanViet: "tả hữu", vietnamese: "khoảng chừng, xấp xỉ", hskLevel: 4, radical: "工", strokeCount: 10, example: "十岁左右", exampleTranslation: "khoảng 10 tuổi", tags: ["Bài 15", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l15-ex1",
        type: "multiple_choice",
        question: "Chọn từ đúng: '天气很冷，出门前______要多穿点儿衣服。'",
        options: ["A. 千万", "B. 偶尔", "C. 左右", "D. 否则"],
        correctAnswer: "A. 千万",
        explanation: "'千万' dùng để dặn dò khuyên bảo chân thành ('千万要多穿点衣服')."
      }
    ],
    cultureBonus: {
      title: "孟母三迁的故事 (Điển tích Mẹ Mạnh Tử ba lần chuyển nhà)",
      summary: "Gương sáng nuôi dạy con vĩ đại trong lịch sử Trung Hoa.",
      content: "Mẹ của Mạnh Tử đã ba lần dời nhà từ gần nghĩa địa, đến gần khu chợ và cuối cùng đến cạnh trường học, để tạo dựng môi trường học tập và tu dưỡng đạo đức tốt nhất cho con trai trở thành bậc Á thánh lưu danh sử sách."
    }
  }
];
