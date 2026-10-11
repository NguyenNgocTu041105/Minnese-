import { DetailedTextbookLesson } from './newHsk1BookData';

export const HSK4_LESSONS_PART1: DetailedTextbookLesson[] = [
  // LESSON 1: 简单的爱情
  {
    lessonNumber: 1,
    titleHanzi: "简单的爱情",
    titlePinyin: "Jiǎndān de àiqíng",
    titleVietnamese: "Tình yêu giản đơn",
    pageStart: 2,
    objectives: [
      "Nắm vững cấu trúc liên từ '不仅……也/还/而且……' biểu thị mức độ tăng tiến.",
      "Sử dụng phó từ '从来' (luôn luôn, từ trước tới nay) trong câu phủ định.",
      "Phân biệt cách dùng của '刚' (phó từ) và '刚才' (danh từ thời gian).",
      "Sử dụng liên từ '即使……也……' biểu thị quan hệ giả thiết nhượng bộ.",
      "Hiểu và diễn đạt phạm vi bằng kết cấu '(在)……上'."
    ],
    texts: [
      {
        id: "hsk4-l1-t1",
        title: "课文 1 (孙月和王静聊王静的男朋友)",
        context: "Tôn Nguyệt và Vương Tĩnh trò chuyện về bạn trai của Vương Tĩnh.",
        lines: [
          { speaker: "孙月", hanzi: "听说你男朋友李进跟你是同一个学校的，是你同学吗？", pinyin: "Tīngshuō nǐ nánpéngyou Lǐ Jìn gēn nǐ shì yí ge xuéxiào de, shì nǐ tóngxué ma?", vietnamese: "Nghe nói bạn trai Lý Tiến của cậu cùng trường với cậu, là bạn cùng lớp hả?" },
          { speaker: "王静", hanzi: "是的，他学的是新闻，我学的是法律，我和他不是一个班。", pinyin: "Shì de, tā xué de shì xīnwén, wǒ xué de shì fǎlǜ, wǒ hé tā bú shì yí ge bān.", vietnamese: "Đúng vậy, anh ấy học báo chí, mình học luật, mình với anh ấy không cùng lớp." },
          { speaker: "孙月", hanzi: "那你们俩是怎么认识的？", pinyin: "Nà nǐmen liǎ shì zěnme rènshi de?", vietnamese: "Thế hai người quen nhau như thế nào?" },
          { speaker: "王静", hanzi: "我们是在一次足球比赛中认识的。我们班跟他们班比赛，他一个人踢进两个球，我对他的印象很深，后来就慢慢熟悉了。", pinyin: "Wǒmen shì zài yí cì zúqiú bǐsài zhōng rènshi de. Wǒmen bān gēn tāmen bān bǐsài, tā yí ge rén tī jìn liǎng ge qiú, wǒ duì tā de yìnxiàng hěn shēn, hòulái jiù mànmàn shúxi le.", vietnamese: "Tụi mình quen nhau trong một trận đấu bóng đá. Lớp mình đấu với lớp anh ấy, một mình anh ấy đá vào hai quả, mình ấn tượng rất sâu sắc, về sau dần dần quen thân." },
          { speaker: "孙月", hanzi: "你为什么喜欢他？", pinyin: "Nǐ wèishénme xǐhuan tā?", vietnamese: "Vì sao cậu thích anh ấy?" },
          { speaker: "王静", hanzi: "他不仅足球踢得好，性格也不错。", pinyin: "Tā bùjǐn zúqiú tī de hǎo, xìnggé yě búcuò.", vietnamese: "Anh ấy không chỉ đá bóng giỏi mà tính cách cũng rất tốt." }
        ]
      },
      {
        id: "hsk4-l1-t2",
        title: "课文 2 (王静跟李老师聊她要结婚的事情)",
        context: "Vương Tĩnh nói chuyện với thầy Lý về chuyện sắp kết hôn.",
        lines: [
          { speaker: "王静", hanzi: "李老师，我下个月5号就要结婚了。", pinyin: "Lǐ lǎoshī, wǒ xià ge yuè wǔ hào jiù yào jiéhūn le.", vietnamese: "Thầy Lý ơi, ngày 5 tháng sau em kết hôn rồi ạ." },
          { speaker: "李老师", hanzi: "你是在开玩笑吧？你们不是才认识一个月？", pinyin: "Nǐ shì zài kāiwánxiào ba? Nǐmen bú shì cái rènshi yí ge yuè?", vietnamese: "Em đùa đấy à? Chẳng phải hai đứa mới quen nhau có một tháng thôi sao?" },
          { speaker: "王静", hanzi: "虽然我们认识的时间不长，但我从来没这么快乐过。", pinyin: "Suīrán wǒmen rènshi de shíjiān bù cháng, dàn wǒ cónglái méi zhème kuàilè guo.", vietnamese: "Tuy thời gian quen nhau chưa lâu, nhưng từ trước tới nay em chưa từng thấy vui vẻ như vậy." },
          { speaker: "李老师", hanzi: "两个人在一起，最好能有共同的兴趣和爱好。", pinyin: "Liǎng ge rén zài yìqǐ, zuìhǎo néng yǒu gòngtóng de xìngqù hé àihào.", vietnamese: "Hai người ở bên nhau, tốt nhất là nên có sở thích và hứng thú chung." },
          { speaker: "王静", hanzi: "我们有很多共同的爱好，经常一起打球、唱歌、做菜。", pinyin: "Wǒmen yǒu hěn duō gòngtóng de àihào, jīngcháng yìqǐ dǎqiú, chànggē, zuòcài.", vietnamese: "Chúng em có rất nhiều sở thích chung, thường xuyên cùng nhau chơi bóng, ca hát, nấu ăn." },
          { speaker: "李老师", hanzi: "看来你真的找到适合你的人了。祝你们幸福！", pinyin: "Kànlái nǐ zhēnde zhǎodào shìhé nǐ de rén le. Zhù nǐmen xìngfú!", vietnamese: "Xem ra em thực sự đã tìm được người phù hợp với mình rồi. Chúc hai em hạnh phúc!" }
        ]
      },
      {
        id: "hsk4-l1-t3",
        title: "课文 3 (高老师和李老师聊结婚后的生活)",
        context: "Cô Cao và thầy Lý trò chuyện về cuộc sống sau hôn nhân.",
        lines: [
          { speaker: "高老师", hanzi: "听说您跟妻子结婚快二十年了？", pinyin: "Tīngshuō nín gēn qīzi jiéhūn kuài èrshí nián le?", vietnamese: "Nghe nói thầy và phu nhân kết hôn sắp được 20 năm rồi ạ?" },
          { speaker: "李老师", hanzi: "到6月9号，我们就结婚二十年了。这么多年，我们的生活一直挺幸福的。", pinyin: "Dào liù yuè jiǔ hào, wǒmen jiù jiéhūn èrshí nián le. Zhème duō nián, wǒmen de shēnghuó yìzhí tǐng xìngfú de.", vietnamese: "Đến mùng 9 tháng 6 là chúng tôi kết hôn tròn hai mươi năm. Bao năm qua, cuộc sống của chúng tôi luôn rất hạnh phúc." },
          { speaker: "高老师", hanzi: "我和丈夫刚结婚的时候，每天都觉得很新鲜，在一起有说不完的话。但是现在……", pinyin: "Wǒ hé zhàngfu gāng jiéhūn de shíhou, měi tiān dōu juéde hěn xīnxiān, zài yìqǐ yǒu shuō bù wán de huà. Dànshì xiànzài...", vietnamese: "Tôi và chồng hồi mới cưới, ngày nào cũng thấy thật mới mẻ, ở bên nhau có bao nhiêu chuyện nói không hết. Nhưng bây giờ..." },
          { speaker: "李老师", hanzi: "两个人共同生活，只有浪漫和新鲜感是不够的。", pinyin: "Liǎng ge rén gòngtóng shēnghuó, zhǐyǒu làngmàn hé xīnxiāngǎn shì bú gòu de.", vietnamese: "Hai người cùng chung sống, chỉ có lãng mạn và cảm giác mới mẻ là không đủ đâu." },
          { speaker: "高老师", hanzi: "您说的对！我现在每天看到的都是他的缺点。", pinyin: "Nín shuō de duì! Wǒ xiànzài měi tiān kàndào de dōu shì tā de quēdiǎn.", vietnamese: "Thầy nói chí phải! Bây giờ ngày nào tôi cũng chỉ nhìn thấy khuyết điểm của anh ấy." },
          { speaker: "李老师", hanzi: "两个人在一起时间长了，就会有很多问题。只有接受了他的缺点，你们才能更好地一起生活。", pinyin: "Liǎng ge rén zài yìqǐ shíjiān cháng le, jiù huì yǒu hěn duō wèntí. Zhǐyǒu jiēshòu le tā de quēdiǎn, nǐmen cái néng gèng hǎo de yìqǐ shēnghuó.", vietnamese: "Hai người ở bên nhau lâu ngày sẽ nảy sinh nhiều vấn đề. Chỉ khi chấp nhận khuyết điểm của đối phương thì hai người mới sống tốt bên nhau được." }
        ]
      },
      {
        id: "hsk4-l1-t4",
        title: "课文 4 (短文)",
        context: "很多人羡慕浪漫的爱情。(Đoạn văn ngắn về tình yêu lãng mạn).",
        lines: [
          { speaker: "讲述人", hanzi: "很多女孩子羡慕浪漫的爱情。那什么是浪漫呢？年轻人说：浪漫是她想要月亮时，你不会给她星星；中年人说：浪漫是即使晚上加班到零点，到家时，自己家里也还亮着灯；老年人说：浪漫其实就像歌中唱的那样，“我能想到最浪漫的事，就是和你一起慢慢变老。” 其实，让我们感动的，就是生活中简单的爱情。有时候，简单就是最大的幸福。", pinyin: "Hěn duō nǚ háizi xiànmù làngmàn de àiqíng. Nà shénme shì làngmàn ne? Niánqīng rén shuō: Làngmàn shì tā xiǎng yào yuèliang shí, nǐ bú huì gěi tā xīngxing; zhōngnián rén shuō: Làngmàn shì jíshǐ wǎnshang jiābān dào língdiǎn, dào jiā shí, zìjǐ jiā lǐ yě hái liàngzhe dēng; lǎonián rén shuō: Làngmàn qíshí jiù xiàng gē zhōng chàng de nàyàng, \"Wǒ néng xiǎngdào zuì làngmàn de shì, jiù shì hé nǐ yìqǐ mànmàn biàn lǎo.\" Qíshí, ràng wǒmen gǎndòng de, jiù shì shēnghuó zhōng jiǎndān de àiqíng. Yǒu shíhou, jiǎndān jiù shì zuì dà de xìngfú.", vietnamese: "Rất nhiều cô gái ngưỡng mộ tình yêu lãng mạn. Vậy thế nào là lãng mạn? Người trẻ nói: Lãng mạn là khi cô ấy muốn vầng trăng, bạn sẽ không đưa cho ngôi sao; người trung niên nói: Lãng mạn là dẫu đêm tăng ca đến 0 giờ, lúc về nhà trong nhà vẫn sáng đèn; người già nói: Lãng mạn thực ra như câu hát, 'Điều lãng mạn nhất tôi có thể nghĩ tới chính là cùng em già đi theo năm tháng.' Thực ra, điều làm ta cảm động chính là tình yêu mộc mạc trong cuộc sống. Đôi khi, đơn giản chính là hạnh phúc lớn nhất." }
        ]
      },
      {
        id: "hsk4-l1-t5",
        title: "课文 5 (短文)",
        context: "说到结婚，人们就会很自然地想起爱情。(Về hôn nhân và tính cách).",
        lines: [
          { speaker: "讲述人", hanzi: "说到结婚，人们就会很自然地想起爱情。爱情是结婚的重要原因，但两个人共同生活，不仅需要浪漫的爱情，更需要性格上互相吸引。我丈夫是个很幽默的人。即使是很普通的事情，从他嘴里说出来也会变得很有意思。在我难过的时候，他总是有办法让我高兴起来。而且他的脾气也不错，结婚十年了，我们俩几乎没因为什么事红过脸，很多人都特别羡慕我们。", pinyin: "Shuō dào jiéhūn, rénmen jiù huì hěn zìrán de xiǎngqǐ àiqíng. Àiqíng shì jiéhūn de zhòngyào yuányīn, dàn liǎng ge rén gòngtóng shēnghuó, bùjǐn xūyào làngmàn de àiqíng, gèng xūyào xìnggé shang hùxiāng xīyǐn. Wǒ zhàngfu shì ge hěn yōumò de rén. Jíshǐ shì hěn pǔtōng de shìqing, cóng tā zuǐ lǐ shuō chūlai yě huì biànde hěn yǒu yìsi. Zài wǒ nánguò de shíhou, tā zǒngshì yǒu bànfǎ ràng wǒ gāoxìng qǐlai. Érqiě tā de píqi yě búcuò, jiéhūn shí nián le, wǒmen liǎ jīhū méi yīnwèi shénme shì hóng guo liǎn, hěn duō rén dōu tèbié xiànmù wǒmen.", vietnamese: "Nói đến kết hôn, mọi người thường tự nhiên liên tưởng tới tình yêu. Tình yêu là nguyên nhân quan trọng để kết hôn, nhưng hai người chung sống không chỉ cần tình yêu lãng mạn mà còn cần sự thu hút lẫn nhau về tính cách. Chồng tôi là người rất hài hước. Dù là việc rất đỗi bình thường, qua miệng anh ấy kể cũng trở nên vô cùng thú vị. Những lúc tôi buồn phiền, anh ấy luôn có cách làm tôi vui lên. Tính nết anh cũng rất hiền hòa, kết hôn mười năm rồi hai đứa hầu như chưa từng to tiếng đỏ mặt với nhau, rất nhiều người đều đặc biệt ngưỡng mộ chúng tôi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l1-g1",
        title: "1. Liên từ '不仅……也/还/而且……' (Không những... mà còn...)",
        explanation: "Dùng ở phân câu thứ nhất, phân câu thứ hai phối hợp với '也/还/而且' để biểu thị quan hệ tăng tiến. Nếu hai phân câu cùng chủ ngữ, '不仅' đứng SAU chủ ngữ; nếu khác chủ ngữ, '不仅' đứng TRƯỚC chủ ngữ thứ nhất.",
        examples: [
          { hanzi: "他不仅足球踢得好，性格也不错。", pinyin: "Tā bùjǐn zúqiú tī de hǎo, xìnggé yě búcuò.", vietnamese: "Anh ấy không chỉ đá bóng giỏi, mà tính cách cũng rất tốt." },
          { hanzi: "不仅我会做中国菜，而且我妻子也会做。", pinyin: "Bùjǐn wǒ huì zuò Zhōngguó cài, érqiě wǒ qīzi yě huì zuò.", vietnamese: "Không những tôi biết nấu món Trung Quốc, mà vợ tôi cũng biết nấu." }
        ]
      },
      {
        id: "hsk4-l1-g2",
        title: "2. Phó từ '从来' (Từ trước tới nay)",
        explanation: "Biểu thị từ trước đến nay đều như vậy, thường dùng trong câu phủ định '从来没/不'.",
        examples: [
          { hanzi: "虽然我们认识的时间不长，但我从来没这么快乐过。", pinyin: "Suīrán wǒmen rènshi de shíjiān bù cháng, dàn wǒ cónglái méi zhème kuàilè guo.", vietnamese: "Tuy thời gian quen nhau chưa lâu, nhưng tôi chưa bao giờ thấy vui như thế này." },
          { hanzi: "老张这个人开会从来不迟到。", pinyin: "Lǎo Zhāng zhè ge rén kāihuì cónglái bù chídào.", vietnamese: "Bác Trương xưa nay họp hành chưa bao giờ đến muộn." }
        ]
      },
      {
        id: "hsk4-l1-g3",
        title: "3. So sánh: 刚 (Phó từ) vs 刚才 (Danh từ thời gian)",
        explanation: "• '刚' là phó từ, chỉ đứng sau chủ ngữ trước động từ (我刚借的书).\n• '刚才' là danh từ thời gian (vừa mới đây), có thể đứng trước hoặc sau chủ ngữ (刚才他来了 / 他刚才来了). Ngoài ra '刚' có thể kết hợp số từ chỉ thời lượng (刚来一会儿), còn '刚才' thì không.",
        examples: [
          { hanzi: "我刚才去洗手间了，你给我打电话了？", pinyin: "Wǒ gāngcái qù xǐshǒujiān le, nǐ gěi wǒ dǎ diànhuà le?", vietnamese: "Vừa nãy tôi đi vệ sinh, bạn gọi điện cho tôi à?" },
          { hanzi: "他刚来一会儿。", pinyin: "Tā gāng lái yí huìr.", vietnamese: "Anh ấy vừa mới đến được một lát." }
        ]
      },
      {
        id: "hsk4-l1-g4",
        title: "4. Liên từ '即使……也……' (Dù cho... cũng...)",
        explanation: "Biểu thị điều kiện giả thiết nhượng bộ, dù tình huống cực đoan có xảy ra thì kết quả vẫn không thay đổi.",
        examples: [
          { hanzi: "浪漫是即使晚上加班到零点，到家时家里也还亮着灯。", pinyin: "Làngmàn shì jíshǐ wǎnshang jiābān dào língdiǎn, dào jiā shí jiā lǐ yě hái liàngzhe dēng.", vietnamese: "Lãng mạn là dẫu đêm tăng ca đến 12h, khi về nhà vẫn thấy đèn sáng." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l1-w1", hanzi: "法律", pinyin: "fǎlǜ", hanViet: "pháp luật", vietnamese: "pháp luật", hskLevel: 4, radical: "氵", strokeCount: 17, example: "学法律", exampleTranslation: "học ngành luật", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w2", hanzi: "俩", pinyin: "liǎ", hanViet: "lưỡng", vietnamese: "hai người, hai đứa (cả hai)", hskLevel: 4, radical: "亻", strokeCount: 9, example: "他们俩", exampleTranslation: "hai người bọn họ", tags: ["Bài 1", "Số từ"] },
      { id: "hsk4-l1-w3", hanzi: "印象", pinyin: "yìnxiàng", hanViet: "ấn tượng", vietnamese: "ấn tượng", hskLevel: 4, radical: "卩", strokeCount: 16, example: "印象很深", exampleTranslation: "ấn tượng rất sâu sắc", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w4", hanzi: "深", pinyin: "shēn", hanViet: "thâm", vietnamese: "sâu, đậm", hskLevel: 4, radical: "氵", strokeCount: 11, example: "水很深", exampleTranslation: "nước rất sâu", tags: ["Bài 1", "Tính từ"] },
      { id: "hsk4-l1-w5", hanzi: "熟悉", pinyin: "shúxi", hanViet: "thục tất", vietnamese: "quen thuộc, am hiểu", hskLevel: 4, radical: "灬", strokeCount: 23, example: "慢慢熟悉", exampleTranslation: "dần dần quen thuộc", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w6", hanzi: "不仅", pinyin: "bùjǐn", hanViet: "bất cận", vietnamese: "không chỉ, không những", hskLevel: 4, radical: "一", strokeCount: 8, example: "不仅……而且……", exampleTranslation: "không chỉ... mà còn...", tags: ["Bài 1", "Liên từ"] },
      { id: "hsk4-l1-w7", hanzi: "性格", pinyin: "xìnggé", hanViet: "tính cách", vietnamese: "tính cách, tính tình", hskLevel: 4, radical: "忄", strokeCount: 18, example: "性格好", exampleTranslation: "tính tình tốt", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w8", hanzi: "开玩笑", pinyin: "kāi wánxiào", hanViet: "khai ngoạn tiếu", vietnamese: "nói đùa, trêu đùa", hskLevel: 4, radical: "廾", strokeCount: 21, example: "别开玩笑了", exampleTranslation: "đừng đùa nữa", tags: ["Bài 1", "Cụm từ"] },
      { id: "hsk4-l1-w9", hanzi: "从来", pinyin: "cónglái", hanViet: "tùng lai", vietnamese: "từ trước tới nay (luôn luôn)", hskLevel: 4, radical: "人", strokeCount: 12, example: "从来没迟到", exampleTranslation: "chưa bao giờ muộn", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk4-l1-w10", hanzi: "最好", pinyin: "zuìhǎo", hanViet: "tối hảo", vietnamese: "tốt nhất là, nên", hskLevel: 4, radical: "日", strokeCount: 18, example: "最好多休息", exampleTranslation: "tốt nhất nên nghỉ ngơi nhiều", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk4-l1-w11", hanzi: "共同", pinyin: "gòngtóng", hanViet: "cộng đồng", vietnamese: "chung, cùng nhau", hskLevel: 4, radical: "八", strokeCount: 12, example: "共同爱好", exampleTranslation: "sở thích chung", tags: ["Bài 1", "Tính từ"] },
      { id: "hsk4-l1-w12", hanzi: "适合", pinyin: "shìhé", hanViet: "thích hợp", vietnamese: "phù hợp, hợp với", hskLevel: 4, radical: "辶", strokeCount: 17, example: "适合你", exampleTranslation: "hợp với bạn", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w13", hanzi: "幸福", pinyin: "xìngfú", hanViet: "hạnh phúc", vietnamese: "hạnh phúc", hskLevel: 4, radical: "干", strokeCount: 22, example: "生活幸福", exampleTranslation: "cuộc sống hạnh phúc", tags: ["Bài 1", "Tính từ"] },
      { id: "hsk4-l1-w14", hanzi: "生活", pinyin: "shēnghuó", hanViet: "sinh hoạt", vietnamese: "cuộc sống; sinh sống", hskLevel: 4, radical: "生", strokeCount: 14, example: "幸福的生活", exampleTranslation: "cuộc sống hạnh phúc", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w15", hanzi: "刚", pinyin: "gāng", hanViet: "cương", vietnamese: "vừa mới, mới", hskLevel: 4, radical: "刂", strokeCount: 6, example: "刚来", exampleTranslation: "vừa mới tới", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk4-l1-w16", hanzi: "浪漫", pinyin: "làngmàn", hanViet: "lãng mạn", vietnamese: "lãng mạn", hskLevel: 4, radical: "氵", strokeCount: 24, example: "浪漫的爱情", exampleTranslation: "tình yêu lãng mạn", tags: ["Bài 1", "Tính từ"] },
      { id: "hsk4-l1-w17", hanzi: "够", pinyin: "gòu", hanViet: "cấu", vietnamese: "đủ", hskLevel: 4, radical: "夕", strokeCount: 11, example: "不够好", exampleTranslation: "chưa đủ tốt", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w18", hanzi: "缺点", pinyin: "quēdiǎn", hanViet: "khuyết điểm", vietnamese: "khuyết điểm, điểm yếu", hskLevel: 4, radical: "缶", strokeCount: 19, example: "他的缺点", exampleTranslation: "khuyết điểm của anh ấy", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w19", hanzi: "接受", pinyin: "jiēshòu", hanViet: "tiếp thụ", vietnamese: "tiếp nhận, chấp nhận", hskLevel: 4, radical: "扌", strokeCount: 19, example: "接受意见", exampleTranslation: "tiếp thu ý kiến", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w20", hanzi: "羡慕", pinyin: "xiànmù", hanViet: "tiện mộ", vietnamese: "ngưỡng mộ, ghen tị", hskLevel: 4, radical: "羊", strokeCount: 26, example: "让人羡慕", exampleTranslation: "khiến người khác ngưỡng mộ", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w21", hanzi: "爱情", pinyin: "àiqíng", hanViet: "ái tình", vietnamese: "tình yêu", hskLevel: 4, radical: "心", strokeCount: 21, example: "简单的爱情", exampleTranslation: "tình yêu giản đơn", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w22", hanzi: "星星", pinyin: "xīngxing", hanViet: "tinh tinh", vietnamese: "ngôi sao", hskLevel: 4, radical: "日", strokeCount: 18, example: "天上的星星", exampleTranslation: "ngôi sao trên trời", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w23", hanzi: "即使", pinyin: "jíshǐ", hanViet: "tức sử", vietnamese: "cho dù, dẫu cho", hskLevel: 4, radical: "亻", strokeCount: 15, example: "即使下雨", exampleTranslation: "cho dù trời mưa", tags: ["Bài 1", "Liên từ"] },
      { id: "hsk4-l1-w24", hanzi: "加班", pinyin: "jiābān", hanViet: "gia ban", vietnamese: "tăng ca, làm thêm giờ", hskLevel: 4, radical: "力", strokeCount: 15, example: "经常加班", exampleTranslation: "thường xuyên tăng ca", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w25", hanzi: "亮", pinyin: "liàng", hanViet: "lượng", vietnamese: "sáng; phát sáng", hskLevel: 4, radical: "亠", strokeCount: 9, example: "天亮了 / 灯亮着", exampleTranslation: "trời sáng rồi / đèn đang sáng", tags: ["Bài 1", "Tính từ"] },
      { id: "hsk4-l1-w26", hanzi: "感动", pinyin: "gǎndòng", hanViet: "cảm động", vietnamese: "cảm động", hskLevel: 4, radical: "心", strokeCount: 19, example: "很感动", exampleTranslation: "rất cảm động", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w27", hanzi: "自然", pinyin: "zìrán", hanViet: "tự nhiên", vietnamese: "tự nhiên; thiên nhiên", hskLevel: 4, radical: "自", strokeCount: 18, example: "自然想起", exampleTranslation: "tự nhiên nhớ tới", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk4-l1-w28", hanzi: "原因", pinyin: "yuányīn", hanViet: "nguyên nhân", vietnamese: "nguyên nhân, lý do", hskLevel: 4, radical: "厂", strokeCount: 16, example: "重要原因", exampleTranslation: "nguyên nhân quan trọng", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk4-l1-w29", hanzi: "互相", pinyin: "hùxiāng", hanViet: "hỗ tương", vietnamese: "lẫn nhau", hskLevel: 4, radical: "一", strokeCount: 13, example: "互相帮助", exampleTranslation: "giúp đỡ lẫn nhau", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk4-l1-w30", hanzi: "吸引", pinyin: "xīyǐn", hanViet: "hấp dẫn", vietnamese: "thu hút, lôi cuốn", hskLevel: 4, radical: "口", strokeCount: 10, example: "互相吸引", exampleTranslation: "thu hút lẫn nhau", tags: ["Bài 1", "Động từ"] },
      { id: "hsk4-l1-w31", hanzi: "幽默", pinyin: "yōumò", hanViet: "u mặc", vietnamese: "hài hước, hóm hỉnh", hskLevel: 4, radical: "幺", strokeCount: 26, example: "很幽默", exampleTranslation: "rất hài hước", tags: ["Bài 1", "Tính từ"] },
      { id: "hsk4-l1-w32", hanzi: "脾气", pinyin: "píqi", hanViet: "tỳ khí", vietnamese: "tính khí, tính nết", hskLevel: 4, radical: "月", strokeCount: 22, example: "发脾气", exampleTranslation: "nổi nóng, cáu kỉnh", tags: ["Bài 1", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l1-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '他______足球踢得好，性格也很温和。'",
        options: ["A. 不仅", "B. 即使", "C. 从来", "D. 刚"],
        correctAnswer: "A. 不仅",
        explanation: "Cấu trúc '不仅……也/还……' biểu thị ý nghĩa tăng tiến (không những... mà còn...)."
      },
      {
        id: "hsk4-l1-ex2",
        type: "multiple_choice",
        question: "Chọn từ đúng: '我______没去过那么远的地方。'",
        options: ["A. 刚才", "B. 从来", "C. 刚", "D. 共同"],
        correctAnswer: "B. 从来",
        explanation: "'从来没/不' diễn tả từ trước đến nay chưa từng làm việc gì."
      }
    ],
    cultureBonus: {
      title: "中国的情人节——七夕节 (Lễ Thất Tịch - Valentine phương Đông)",
      summary: "Ngày 7 tháng 7 âm lịch hàng năm là ngày hội truyền thống gắn liền với thiên tình sử Ngưu Lang - Chức Nữ.",
      content: "Tương truyền vào ngày 7 tháng 7 âm lịch hàng năm, đàn chim hỷ thước sẽ bắc thành cầu Ngân Hà để Ngưu Lang và Chức Nữ gặp lại nhau. Trong văn hóa Trung Hoa, ngày này được coi là ngày lễ tình nhân lãng mạn nhất, tượng trưng cho tình yêu chân thành và bền chặt."
    }
  },

  // LESSON 2: 真正的朋友
  {
    lessonNumber: 2,
    titleHanzi: "真正的朋友",
    titlePinyin: "Zhēnzhèng de péngyou",
    titleVietnamese: "Người bạn chân chính",
    pageStart: 14,
    objectives: [
      "Sử dụng '正好' biểu thị thời cơ, số lượng hoặc kích cỡ vừa vặn.",
      "Phân biệt cặp từ dễ nhầm lẫn '差不多' (xấp xỉ) và '几乎' (hầu như).",
      "Nắm vững liên từ nhượng bộ '尽管……却/但是……'.",
      "Sử dụng phó từ chuyển hướng nhẹ '却' đứng sau chủ ngữ.",
      "Sử dụng liên từ '而' biểu thị so sánh đối chiếu hoặc tăng tiến."
    ],
    texts: [
      {
        id: "hsk4-l2-t1",
        title: "课文 1 (小夏和马克聊马克的中国朋友)",
        context: "Tiểu Hạ và Mark trò chuyện về người bạn Trung Quốc của Mark.",
        lines: [
          { speaker: "小夏", hanzi: "来中国快一年了，你适应这儿的生活了吗？", pinyin: "Lái Zhōngguó kuài yì nián le, nǐ shìyìng zhèr de shēnghuó le ma?", vietnamese: "Đến Trung Quốc gần một năm rồi, cậu đã thích nghi với cuộc sống ở đây chưa?" },
          { speaker: "马克", hanzi: "开始有点儿不习惯，后来就慢慢适应了，最近我还交了一个中国朋友。", pinyin: "Kāishǐ yǒudiǎnr bù xíguàn, hòulái jiù mànmàn shìyìng le, zuìjìn wǒ hái jiāo le yí ge Zhōngguó péngyou.", vietnamese: "Mới đầu có chút chưa quen, sau đó dần dần thích nghi, dạo gần đây mình còn kết bạn với một người bạn Trung Quốc." },
          { speaker: "小夏", hanzi: "那正好，快给我讲讲你新交的中国朋友。", pinyin: "Nà zhènghǎo, kuài gěi wǒ jiǎngjiang nǐ xīn jiāo de Zhōngguó péngyou.", vietnamese: "Thế thì vừa hay quá, mau kể cho mình nghe về người bạn Trung Quốc mới quen của cậu đi." },
          { speaker: "马克", hanzi: "我们是在图书馆认识的。平时我们常常一起看书、逛街、踢足球。有时候他还给我发一些幽默短信。", pinyin: "Wǒmen shì zài túshūguǎn rènshi de. Píngshí wǒmen chángcháng yìqǐ kànshū, guàngjiē, tī zúqiú. Yǒu shíhou tā hái gěi wǒ fā yìxiē yōumò duǎnxìn.", vietnamese: "Tụi mình quen nhau ở thư viện. Bình thường chúng mình hay cùng đọc sách, dạo phố, đá bóng. Đôi khi cậu ấy còn gửi cho mình mấy tin nhắn hài hước." },
          { speaker: "小夏", hanzi: "你的这个朋友真不错！下次介绍我们认识认识，怎么样？", pinyin: "Nǐ de zhè ge péngyou zhēn búcuò! Xià cì jièshào wǒmen rènshi renshi, zěnmeyàng?", vietnamese: "Người bạn này của cậu tốt thật đấy! Lần sau giới thiệu cho tụi mình làm quen với nhé, được không?" },
          { speaker: "马克", hanzi: "没问题！我们下午要去踢足球，正好一起去吧。", pinyin: "Méi wèntí! Wǒmen xiàwǔ yào qù tī zúqiú, zhènghǎo yìqǐ qù ba.", vietnamese: "Không vấn đề gì! Chiều nay tụi mình đi đá bóng đấy, vừa hay cùng đi luôn nhé." }
        ]
      },
      {
        id: "hsk4-l2-t2",
        title: "课文 2 (小李和小林聊同学聚会的事情)",
        context: "Tiểu Lý và Tiểu Lâm bàn về buổi họp lớp.",
        lines: [
          { speaker: "小李", hanzi: "星期天同学聚会，你能来吗？", pinyin: "Xīngqītiān tóngxué jùhuì, nǐ néng lái ma?", vietnamese: "Chủ nhật họp lớp, cậu đến được không?" },
          { speaker: "小林", hanzi: "能来。班里同学你联系得怎么样了？来多少人？", pinyin: "Néng lái. Bān lǐ tóngxué nǐ liánxì de zěnmeyàng le? Lái duōshao rén?", vietnamese: "Đến được chứ. Các bạn trong lớp cậu liên lạc đến đâu rồi? Đến được bao nhiêu người?" },
          { speaker: "小李", hanzi: "差不多一半儿吧，张远还专门从国外飞回来呢。", pinyin: "Chàbuduō yíbànr ba, Zhāng Yuǎn hái zhuānmén cóng guówài fēi huílái ne.", vietnamese: "Khoảng chừng một nửa đấy, Trương Viễn còn đặc biệt bay từ nước ngoài về cơ mà." },
          { speaker: "小林", hanzi: "是吗？毕业都快十年了，真想大家啊！对了，今天早上，我在地铁站遇到了王静，她毕业后就去上海工作了，她这次是来旅游的。", pinyin: "Shì ma? Bìyè dōu kuài shí nián le, zhēn xiǎng dàjiā a! Duì le, jīntiān zǎoshang, wǒ zài dìtiězhàn yùdào le Wáng Jìng, tā bìyè hòu jiù qù Shànghǎi gōngzuò le, tā zhè cì shì lái lǚyóu de.", vietnamese: "Thế á? Tốt nghiệp sắp mười năm rồi, nhớ mọi người thật! À đúng rồi, sáng nay mình gặp Vương Tĩnh ở ga tàu điện ngầm, cậu ấy tốt nghiệp xong là đi Thượng Hải làm việc, lần này đến đây du lịch." },
          { speaker: "小李", hanzi: "那太好了！麻烦你跟她联系一下，请她一起来参加同学聚会。聚会就在学校门口那个饭店，六点半。别迟到啊！", pinyin: "Nà tài hǎo le! Máfan nǐ gēn tā liánxì yíxià, qǐng tā yìqǐ lái cānjiā tóngxué jùhuì. Jùhuì jiù zài xuéxiào ménkǒu nà ge fàndiàn, liù diǎn bàn. Bié chídào a!", vietnamese: "Thế thì tốt quá! Làm phiền cậu liên lạc với cậu ấy một tiếng, mời cậu ấy cùng tới họp lớp nhé. Tụ tập ở ngay nhà hàng trước cổng trường, sáu rưỡi. Đừng đến muộn đấy!" }
        ]
      },
      {
        id: "hsk4-l2-t3",
        title: "课文 3 (孙月和王静聊她们的朋友)",
        context: "Tôn Nguyệt và Vương Tĩnh trò chuyện về tình bạn.",
        lines: [
          { speaker: "孙月", hanzi: "这是什么时候的照片？你真年轻！", pinyin: "Zhè shì shénme shíhou de zhàopiàn? Nǐ zhēn niánqīng!", vietnamese: "Đây là ảnh chụp lúc nào vậy? Cậu trẻ trung quá!" },
          { speaker: "王静", hanzi: "这是上大学时的照片。一看到这张照片，我就想起过去那段快乐的日子，好像重新回到了校园。", pinyin: "Zhè shì shàng dàxué shí de zhàopiàn. Yí kàndào zhè zhāng zhàopiàn, wǒ jiù xiǎngqǐ guòqù nà duàn kuàilè de rìzi, hǎoxiàng chóngxīn huídào le xiàoyuán.", vietnamese: "Đây là ảnh hồi học đại học đấy. Cứ nhìn bức ảnh này là mình lại nhớ về chuỗi ngày vui vẻ đã qua, như thể được trở lại sân trường vậy." },
          { speaker: "孙月", hanzi: "旁边这个人一定是你的好朋友吧？你们现在还联系吗？", pinyin: "Pángbiān zhè ge rén yídìng shì nǐ de hǎo péngyou ba? Nǐmen xiànzài hái liánxì ma?", vietnamese: "Người bên cạnh chắc chắn là bạn thân của cậu nhỉ? Giờ hai người còn liên lạc không?" },
          { speaker: "王静", hanzi: "当然了，尽管已经毕业这么多年，我们还是经常联系的，每次都有说不完的话。", pinyin: "Dāngrán le, jǐnguǎn yǐjīng bìyè zhème duō nián, wǒmen háishi jīngcháng liánxì de, měi cì dōu yǒu shuō bù wán de huà.", vietnamese: "Đương nhiên rồi, dẫu cho tốt nghiệp bao nhiêu năm nay, tụi mình vẫn thường xuyên liên lạc, lần nào gặp nhau cũng nói không hết chuyện." },
          { speaker: "王静", hanzi: "要知道，能有一个真正的朋友，有一段真正的友谊，是多么不容易！", pinyin: "Yào zhīdào, néng yǒu yí ge zhēnzhèng de péngyou, yǒu yí duàn zhēnzhèng de yǒuyì, shì duōme bù róngyì!", vietnamese: "Phải biết rằng, có thể có một người bạn chân chính, có một đoạn tình bạn chân thực khó khăn biết dường nào!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l2-g1",
        title: "1. Tính từ / Phó từ '正好' (Vừa hay, vừa vặn)",
        explanation: "• Làm tính từ: Đúng lúc, vừa vặn về kích cỡ hoặc số lượng (苹果八块五，西瓜十一块五，正好二十块).\n• Làm phó từ: Đúng lúc gặp cơ hội thuận tiện (我们下午要去踢球，正好一起去吧).",
        examples: [
          { hanzi: "你来得正好，帮我拿一下东西吧。", pinyin: "Nǐ lái de zhènghǎo, bāng wǒ ná yíxià dōngxi ba.", vietnamese: "Bạn đến vừa hay lúc quá, giúp tôi cầm đồ một chút." }
        ]
      },
      {
        id: "hsk4-l2-g2",
        title: "2. So sánh: 差不多 vs 几乎",
        explanation: "• '差不多' có thể làm vị ngữ độc lập (他们俩差不多 - Hai đứa tương đương nhau) hoặc đứng trước số từ chỉ số lượng xấp xỉ (差不多五十个人).\n• '几乎' chỉ là phó từ, thường diễn tả sự việc suýt nữa thì xảy ra (差点儿, ví dụ: 几乎迟到了).",
        examples: [
          { hanzi: "来参加聚会的人差不多有一半儿。", pinyin: "Lái cānjiā jùhuì de rén chàbuduō yǒu yíbànr.", vietnamese: "Số người đến dự họp lớp xấp xỉ một nửa." },
          { hanzi: "今天早上我几乎迟到了。", pinyin: "Jīntiān zǎoshang wǒ jīhū chídào le.", vietnamese: "Sáng nay tôi suýt nữa thì đi muộn." }
        ]
      },
      {
        id: "hsk4-l2-g3",
        title: "3. Liên từ '尽管' (Cho dù, dẫu rằng)",
        explanation: "Đứng đầu phân câu để nêu lên một sự thật khách quan, phân câu sau thường có '但是 / 可是 / 却 / 还是' biểu thị sự chuyển ngoặt.",
        examples: [
          { hanzi: "尽管已经毕业这么多年，我们还是经常联系。", pinyin: "Jǐnguǎn yǐjīng bìyè zhème duō nián, wǒmen háishi jīngcháng liánxì.", vietnamese: "Dẫu cho đã tốt nghiệp bấy nhiêu năm, chúng tôi vẫn thường xuyên liên lạc." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l2-w1", hanzi: "适应", pinyin: "shìyìng", hanViet: "thích ứng", vietnamese: "thích ứng, quen với", hskLevel: 4, radical: "辶", strokeCount: 19, example: "适应生活", exampleTranslation: "thích nghi với cuộc sống", tags: ["Bài 2", "Động từ"] },
      { id: "hsk4-l2-w2", hanzi: "交", pinyin: "jiāo", hanViet: "giao", vietnamese: "kết giao (bạn bè), nộp", hskLevel: 4, radical: "亠", strokeCount: 6, example: "交朋友", exampleTranslation: "kết bạn", tags: ["Bài 2", "Động từ"] },
      { id: "hsk4-l2-w3", hanzi: "平时", pinyin: "píngshí", hanViet: "bình thời", vietnamese: "bình thường, ngày thường", hskLevel: 4, radical: "干", strokeCount: 15, example: "平时很少出门", exampleTranslation: "bình thường ít khi ra ngoài", tags: ["Bài 2", "Danh từ"] },
      { id: "hsk4-l2-w4", hanzi: "逛", pinyin: "guàng", hanViet: "cuống", vietnamese: "đi dạo, đi chơi lòng vòng", hskLevel: 4, radical: "辶", strokeCount: 13, example: "逛街", exampleTranslation: "dạo phố mua sắm", tags: ["Bài 2", "Động từ"] },
      { id: "hsk4-l2-w5", hanzi: "短信", pinyin: "duǎnxìn", hanViet: "đoản tín", vietnamese: "tin nhắn (điện thoại)", hskLevel: 4, radical: "矢", strokeCount: 21, example: "发短信", exampleTranslation: "gửi tin nhắn", tags: ["Bài 2", "Danh từ"] },
      { id: "hsk4-l2-w6", hanzi: "正好", pinyin: "zhènghǎo", hanViet: "chính hảo", vietnamese: "vừa hay, đúng lúc, vừa vặn", hskLevel: 4, radical: "止", strokeCount: 11, example: "来得正好", exampleTranslation: "đến vừa đúng lúc", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk4-l2-w7", hanzi: "聚会", pinyin: "jùhuì", hanViet: "tụ hội", vietnamese: "tụ tập, họp mặt", hskLevel: 4, radical: "耳", strokeCount: 18, example: "同学聚会", exampleTranslation: "họp mặt bạn học", tags: ["Bài 2", "Động từ"] },
      { id: "hsk4-l2-w8", hanzi: "联系", pinyin: "liánxì", hanViet: "liên hệ", vietnamese: "liên hệ, liên lạc", hskLevel: 4, radical: "糸", strokeCount: 17, example: "常联系", exampleTranslation: "thường xuyên liên lạc", tags: ["Bài 2", "Động từ"] },
      { id: "hsk4-l2-w9", hanzi: "差不多", pinyin: "chàbuduō", hanViet: "sai bất đa", vietnamese: "xấp xỉ, tương đương, gần như", hskLevel: 4, radical: "工", strokeCount: 19, example: "差不多一半", exampleTranslation: "xấp xỉ một nửa", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk4-l2-w10", hanzi: "专门", pinyin: "zhuānmén", hanViet: "chuyên môn", vietnamese: "đặc biệt, chuyên biệt", hskLevel: 4, radical: "一", strokeCount: 7, example: "专门去北京", exampleTranslation: "đặc biệt đi Bắc Kinh", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk4-l2-w11", hanzi: "毕业", pinyin: "bì yè", hanViet: "tất nghiệp", vietnamese: "tốt nghiệp", hskLevel: 4, radical: "十", strokeCount: 17, example: "大学毕业", exampleTranslation: "tốt nghiệp đại học", tags: ["Bài 2", "Động từ"] },
      { id: "hsk4-l2-w12", hanzi: "麻烦", pinyin: "máfan", hanViet: "ma phiền", vietnamese: "phiền hà; làm phiền", hskLevel: 4, radical: "麻", strokeCount: 21, example: "麻烦你", exampleTranslation: "làm phiền bạn", tags: ["Bài 2", "Tính từ"] },
      { id: "hsk4-l2-w13", hanzi: "好像", pinyin: "hǎoxiàng", hanViet: "hảo tượng", vietnamese: "dường như, hình như", hskLevel: 4, radical: "女", strokeCount: 17, example: "好像在哪见过", exampleTranslation: "hình như gặp ở đâu rồi", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk4-l2-w14", hanzi: "重新", pinyin: "chóngxīn", hanViet: "trùng tân", vietnamese: "lại từ đầu, làm lại", hskLevel: 4, radical: "里", strokeCount: 22, example: "重新开始", exampleTranslation: "bắt đầu lại từ đầu", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk4-l2-w15", hanzi: "尽管", pinyin: "jǐnguǎn", hanViet: "tẫn quản", vietnamese: "cho dù, dẫu cho", hskLevel: 4, radical: "尸", strokeCount: 22, example: "尽管很累", exampleTranslation: "dẫu cho rất mệt", tags: ["Bài 2", "Liên từ"] },
      { id: "hsk4-l2-w16", hanzi: "真正", pinyin: "zhēnzhèng", hanViet: "chân chính", vietnamese: "chân chính, thực sự", hskLevel: 4, radical: "目", strokeCount: 15, example: "真正的朋友", exampleTranslation: "người bạn chân chính", tags: ["Bài 2", "Tính từ"] },
      { id: "hsk4-l2-w17", hanzi: "友谊", pinyin: "yǒuyì", hanViet: "hữu nghị", vietnamese: "tình bạn, tình hữu nghị", hskLevel: 4, radical: "又", strokeCount: 19, example: "珍贵的友谊", exampleTranslation: "tình bạn quý giá", tags: ["Bài 2", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l2-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '他虽然是外国人，但中文说得______跟中国人一样。'",
        options: ["A. 几乎", "B. 专门", "C. 重新", "D. 麻烦"],
        correctAnswer: "A. 几乎",
        explanation: "'几乎' biểu thị mức độ xấp xỉ rất cao, thường tu từ cho tính từ hoặc động từ."
      }
    ],
    cultureBonus: {
      title: "在家靠父母，出门靠朋友 (Ở nhà nhờ cha mẹ, ra ngoài cậy bạn bè)",
      summary: "Câu thành ngữ khắc họa sâu sắc tầm quan trọng của các mối quan hệ xã hội và tình bạn chân thành trong văn hóa Trung Hoa.",
      content: "Người Trung Quốc từ xưa đã đặc biệt trân trọng tri kỷ. 'Tại gia kháo phụ mẫu, xuất môn kháo bằng hữu' khuyên răn con người khi bước chân ra xã hội cần biết đối nhân xử thế hòa nhã, tương trợ lẫn nhau để cùng phát triển và vượt qua thử thách."
    }
  },

  // LESSON 3: 经理对我印象不错
  {
    lessonNumber: 3,
    titleHanzi: "经理对我印象不错",
    titlePinyin: "Jīnglǐ duì wǒ yìnxiàng búcuò",
    titleVietnamese: "Giám đốc có ấn tượng tốt về tôi",
    pageStart: 26,
    objectives: [
      "Nắm vững phó từ '挺……的' trong khẩu ngữ biểu thị mức độ cao.",
      "Sử dụng phó từ '本来' chỉ tình huống vốn có ban đầu.",
      "Phân biệt '另外' (đại từ/liên từ) và '另' (phó từ/đại từ đứng trước danh/động từ).",
      "Sử dụng kết cấu trình tự văn phong trang trọng '首先……其次……'.",
      "Sử dụng liên từ điều kiện vô điều kiện '不管……都……'."
    ],
    texts: [
      {
        id: "hsk4-l3-t1",
        title: "课文 1 (小夏和小雨聊小雨面试的情况)",
        context: "Tiểu Hạ và Tiểu Vũ trò chuyện về buổi phỏng vấn xin việc của Tiểu Vũ.",
        lines: [
          { speaker: "小夏", hanzi: "你上午的面试怎么样？", pinyin: "Nǐ shàngwǔ de miànshì zěnmeyàng?", vietnamese: "Buổi phỏng vấn sáng nay của cậu thế nào rồi?" },
          { speaker: "小雨", hanzi: "还可以，他们问的问题都挺容易的，就是我有点儿紧张。", pinyin: "Hái kěyǐ, tāmen wèn de wèntí dōu tǐng róngyì de, jiùshì wǒ yǒudiǎnr jǐnzhāng.", vietnamese: "Cũng tàm tạm, các câu hỏi họ hỏi đều khá dễ, chỉ là mình hơi bị căng thẳng chút." },
          { speaker: "小夏", hanzi: "面试的时候，一定要对自己有信心，要相信自己的能力。", pinyin: "Miànshì de shíhou, yídìng yào duì zìjǐ yǒu xìnxīn, yào xiāngxìn zìjǐ de nénglì.", vietnamese: "Lúc phỏng vấn nhất định phải tự tin vào bản thân, phải tin vào năng lực của mình." },
          { speaker: "小雨", hanzi: "你说得对！3月15号上午8点在学校体育馆还有一个招聘会，你去吗？", pinyin: "Nǐ shuō de duì! Sān yuè shíwǔ hào shàngwǔ bā diǎn zài xuéxiào tǐyùguǎn hái yǒu yí ge zhāopìnhuì, nǐ qù ma?", vietnamese: "Cậu nói đúng! Sáng 8 giờ ngày 15 tháng 3 ở nhà thi đấu trường có hội chợ việc làm nữa đấy, cậu đi không?" },
          { speaker: "小夏", hanzi: "我还没决定呢。", pinyin: "Wǒ hái méi juédìng ne.", vietnamese: "Mình vẫn chưa quyết định." },
          { speaker: "小雨", hanzi: "听说这次招聘会提供的工作机会很多，我们一起去看看吧。", pinyin: "Tīngshuō zhè cì zhāopìnhuì tígōng de gōngzuò jīhuì hěn duō, wǒmen yìqǐ qù kànkan ba.", vietnamese: "Nghe nói hội chợ tuyển dụng lần này cung cấp rất nhiều cơ hội việc làm, tụi mình cùng đi xem thử đi." }
        ]
      },
      {
        id: "hsk4-l3-t2",
        title: "课文 2 (马经理和小林聊招聘的事情)",
        context: "Giám đốc Mã và Tiểu Lâm thảo luận về việc tuyển dụng nhân sự.",
        lines: [
          { speaker: "马经理", hanzi: "小林，这次招聘不是小李负责吗？", pinyin: "Xiǎo Lín, zhè cì zhāopìn bú shì Xiǎo Lǐ fùzé ma?", vietnamese: "Tiểu Lâm, lần tuyển dụng này không phải do Tiểu Lý phụ trách sao?" },
          { speaker: "小林", hanzi: "本来是小李负责的，但是他突然生病住院了，所以就交给我来做了。", pinyin: "Běnlái shì Xiǎo Lǐ fùzé de, dànshì tā tūrán shēngbìng zhùyuàn le, suǒyǐ jiù jiāo gěi wǒ lái zuò le.", vietnamese: "Vốn dĩ là Tiểu Lý phụ trách ạ, nhưng cậu ấy đột nhiên bị bệnh phải nằm viện, cho nên đã giao lại cho em làm ạ." },
          { speaker: "马经理", hanzi: "哦，这次应聘的人多吗？", pinyin: "Ò, zhè cì yìngpìn de rén duō ma?", vietnamese: "À, đợt ứng tuyển này người nộp đông không?" },
          { speaker: "小林", hanzi: "经理，这次来应聘的一共有15人。经过笔试和面试，有两个不错。这是他们的材料，您看看。", pinyin: "Jīnglǐ, zhè cì lái yìngpìn de yígòng yǒu shíwǔ rén. Jīngguò bǐshì hé miànshì, yǒu liǎng ge búcuò. Zhè shì tāmen de cáiliào, nín kànkan.", vietnamese: "Thưa giám đốc, đợt ứng tuyển lần này có tổng cộng 15 người. Qua thi viết và phỏng vấn thì có 2 người khá tốt ạ. Đây là hồ sơ của họ, mời giám đốc xem qua." },
          { speaker: "马经理", hanzi: "这两个人的能力都比较符合我们的要求。你通知他们下周一上午九点来我办公室吧。", pinyin: "Zhè liǎng ge rén de nénglì dōu bǐjiào fúhé wǒmen de yāoqiú. Nǐ tōngzhī tāmen xià zhōuyī shàngwǔ jiǔ diǎn lái wǒ bàngōngshì ba.", vietnamese: "Năng lực của hai người này đều tương đối phù hợp với yêu cầu của chúng ta. Cậu thông báo cho họ 9h sáng thứ Hai tuần sau đến văn phòng tôi nhé." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l3-g1",
        title: "1. Kết cấu '挺……的' (Rất, khá)",
        explanation: "Dùng rộng rãi trong văn khẩu ngữ để biểu thị mức độ cao, tương đương với '很'.",
        examples: [
          { hanzi: "他们问的问题都挺容易的。", pinyin: "Tāmen wèn de wèntí dōu tǐng róngyì de.", vietnamese: "Các câu hỏi họ hỏi đều khá là dễ." }
        ]
      },
      {
        id: "hsk4-l3-g2",
        title: "2. Cặp từ liên kết '首先……其次……' (Trước hết... tiếp theo...)",
        explanation: "Dùng để liệt kê sự việc theo thứ tự logic hoặc tầm quan trọng.",
        examples: [
          { hanzi: "不管做什么事情，首先应该明白你为什么要做，其次要知道怎么做。", pinyin: "Bùguǎn zuò shénme shìqing, shǒuxiān yīnggāi míngbai nǐ wèishénme yào zuò, qícì yào zhīdào zěnme zuò.", vietnamese: "Bất kể làm việc gì, trước hết phải hiểu vì sao mình làm, tiếp theo là biết làm thế nào." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l3-w1", hanzi: "挺", pinyin: "tǐng", hanViet: "đĩnh", vietnamese: "rất, khá", hskLevel: 4, radical: "扌", strokeCount: 9, example: "挺好的", exampleTranslation: "khá tốt", tags: ["Bài 3", "Phó từ"] },
      { id: "hsk4-l3-w2", hanzi: "紧张", pinyin: "jǐnzhāng", hanViet: "khẩn trương", vietnamese: "căng thẳng, hồi hộp", hskLevel: 4, radical: "糹", strokeCount: 22, example: "别紧张", exampleTranslation: "đừng căng thẳng", tags: ["Bài 3", "Tính từ"] },
      { id: "hsk4-l3-w3", hanzi: "信心", pinyin: "xìnxīn", hanViet: "tín tâm", vietnamese: "sự tự tin, lòng tin", hskLevel: 4, radical: "亻", strokeCount: 13, example: "有信心", exampleTranslation: "có lòng tự tin", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk4-l3-w4", hanzi: "能力", pinyin: "nénglì", hanViet: "năng lực", vietnamese: "năng lực, khả năng", hskLevel: 4, radical: "力", strokeCount: 12, example: "工作能力", exampleTranslation: "năng lực làm việc", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk4-l3-w5", hanzi: "招聘", pinyin: "zhāopìn", hanViet: "chiêu sính", vietnamese: "tuyển dụng, chiêu mộ", hskLevel: 4, radical: "扌", strokeCount: 20, example: "招聘员工", exampleTranslation: "tuyển dụng nhân viên", tags: ["Bài 3", "Động từ"] },
      { id: "hsk4-l3-w6", hanzi: "提供", pinyin: "tígōng", hanViet: "đề cung", vietnamese: "cung cấp", hskLevel: 4, radical: "扌", strokeCount: 20, example: "提供帮助", exampleTranslation: "cung cấp giúp đỡ", tags: ["Bài 3", "Động từ"] },
      { id: "hsk4-l3-w7", hanzi: "负责", pinyin: "fùzé", hanViet: "phụ trách", vietnamese: "phụ trách, chịu trách nhiệm", hskLevel: 4, radical: "贝", strokeCount: 20, example: "对工作负责", exampleTranslation: "có trách nhiệm với công việc", tags: ["Bài 3", "Động từ"] },
      { id: "hsk4-l3-w8", hanzi: "本来", pinyin: "běnlái", hanViet: "bản lai", vietnamese: "vốn dĩ, ban đầu", hskLevel: 4, radical: "木", strokeCount: 13, example: "本来打算去", exampleTranslation: "vốn dĩ định đi", tags: ["Bài 3", "Phó từ"] },
      { id: "hsk4-l3-w9", hanzi: "应聘", pinyin: "yìngpìn", hanViet: "ứng sính", vietnamese: "ứng tuyển, xin việc", hskLevel: 4, radical: "广", strokeCount: 19, example: "来应聘", exampleTranslation: "đến ứng tuyển", tags: ["Bài 3", "Động từ"] },
      { id: "hsk4-l3-w10", hanzi: "材料", pinyin: "cáiliào", hanViet: "tài liệu", vietnamese: "tài liệu, vật liệu", hskLevel: 4, radical: "木", strokeCount: 13, example: "准备材料", exampleTranslation: "chuẩn bị tài liệu", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk4-l3-w11", hanzi: "符合", pinyin: "fúhé", hanViet: "phù hợp", vietnamese: "phù hợp với, đáp ứng", hskLevel: 4, radical: "竹", strokeCount: 17, example: "符合要求", exampleTranslation: "phù hợp yêu cầu", tags: ["Bài 3", "Động từ"] },
      { id: "hsk4-l3-w12", hanzi: "通知", pinyin: "tōngzhī", hanViet: "thông tri", vietnamese: "thông báo", hskLevel: 4, radical: "辶", strokeCount: 18, example: "接到通知", exampleTranslation: "nhận được thông báo", tags: ["Bài 3", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l3-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '这两个人的能力都比较______公司的招聘要求。'",
        options: ["A. 符合", "B. 熟悉", "C. 挺", "D. 负责"],
        correctAnswer: "A. 符合",
        explanation: "'符合要求' (phù hợp với yêu cầu) là cụm kết hợp cố định thường gặp trong tuyển dụng và công việc."
      }
    ],
    cultureBonus: {
      title: "中山装和旗袍 (Âu phục Tôn Trung Sơn và Áo dài Sườn Xám)",
      summary: "Hai trang phục mang tính biểu tượng văn hóa đặc sắc trong lịch sử trang phục hiện đại của Trung Hoa.",
      content: "Trung Sơn trang kết hợp tinh hoa giữa âu phục phương Tây với văn hóa truyền thống Trung Quốc, bốn chiếc túi áo đại diện cho Lễ, Nghĩa, Liêm, Sỉ. Trong khi đó, Sườn Xám (Kỳ bào) tôn vinh nét đẹp thanh nhã, quý phái của người phụ nữ phương Đông."
    }
  },

  // LESSON 4: 不要太着急赚钱
  {
    lessonNumber: 4,
    titleHanzi: "不要太着急赚钱",
    titlePinyin: "Bú yào tài zháojí zhuànqián",
    titleVietnamese: "Đừng vội vàng kiếm tiền",
    pageStart: 40,
    objectives: [
      "Sử dụng động từ '以为' (tưởng rằng, cứ ngỡ rằng) chỉ nhận thức trước đây không đúng với thực tế.",
      "Phân biệt '原来' (hóa ra, vốn dĩ) và '本来' (vốn dĩ lúc đầu).",
      "Sử dụng phó từ '并' đặt trước từ phủ định để nhấn mạnh giọng điệu.",
      "Sử dụng giới từ '按照' (dựa theo, chiểu theo).",
      "Sử dụng phó từ '甚至' (thậm chí) diễn tả mức độ tăng tiến vượt trội."
    ],
    texts: [
      {
        id: "hsk4-l4-t1",
        title: "课文 1 (小林和小李聊小李的工作)",
        context: "Tiểu Lâm và Tiểu Lý trò chuyện về việc thay đổi công việc của Tiểu Lý.",
        lines: [
          { speaker: "小林", hanzi: "听说你又换工作了？今年已经换了三次工作了吧？", pinyin: "Tīngshuō nǐ yòu huàn gōngzuò le? Jīnnián yǐjīng huàn le sān cì gōngzuò le ba?", vietnamese: "Nghe nói cậu lại đổi việc à? Năm nay đã đổi việc tới 3 lần rồi phải không?" },
          { speaker: "小李", hanzi: "别提了！我以为新工作比以前的好，没想到还没有以前好呢。", pinyin: "Biétí le! Wǒ yǐwéi xīn gōngzuò bǐ yǐqián de hǎo, méi xiǎngdào hái méiyǒu yǐqián hǎo ne.", vietnamese: "Đừng nhắc nữa! Mình cứ ngỡ công việc mới tốt hơn trước, ai ngờ còn chẳng bằng việc cũ." },
          { speaker: "小林", hanzi: "上次那份工作你只做了两个月就离开了，其实，完全适应一个新的工作需要一年时间，所以，经常换工作不一定好。", pinyin: "Shàng cì nà fèn gōngzuò nǐ zhǐ zuò le liǎng ge yuè jiù líkāi le, qíshí, wánquán shìyìng yí ge xīn de gōngzuò xūyào yì nián shíjiān, suǒyǐ, jīngcháng huàn gōngzuò bù yídìng hǎo.", vietnamese: "Lần trước công việc đó cậu chỉ làm 2 tháng đã nghỉ, thật ra để thích nghi hoàn toàn với công việc mới cần cả năm trời, thế nên nhảy việc liên tục chưa chắc đã tốt đâu." },
          { speaker: "小李", hanzi: "我也明白。但是那份工作的收入太少了！", pinyin: "Wǒ yě míngbai. Dànshì nà fèn gōngzuò de shōurù tài shǎo le!", vietnamese: "Mình cũng hiểu chứ. Nhưng thu nhập chỗ đó thấp quá!" },
          { speaker: "小林", hanzi: "你才到新公司，不要太着急赚钱，多学习才是最重要的。", pinyin: "Nǐ cái dào xīn gōngsī, bú yào tài zháojí zhuànqián, duō xuéxí cái shì zuì zhòngyào de.", vietnamese: "Cậu mới vào công ty mới, đừng nóng vội kiếm tiền quá, học hỏi thật nhiều mới là quan trọng nhất." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l4-g1",
        title: "1. Động từ '以为' (Cứ ngỡ rằng, cứ tưởng là)",
        explanation: "Diễn tả phán đoán trong quá khứ của người nói không phù hợp với sự thực khách quan.",
        examples: [
          { hanzi: "我以为新工作比以前的好，没想到还没有以前好呢。", pinyin: "Wǒ yǐwéi xīn gōngzuò bǐ yǐqián de hǎo, méi xiǎngdào hái méiyǒu yǐqián hǎo ne.", vietnamese: "Tôi cứ tưởng công việc mới tốt hơn trước, ngờ đâu còn không bằng." }
        ]
      },
      {
        id: "hsk4-l4-g2",
        title: "2. Giới từ '按照' (Theo như, căn cứ theo)",
        explanation: "Biểu thị lấy một tiêu chuẩn, quy tắc hoặc kế hoạch nào đó làm căn cứ hành động.",
        examples: [
          { hanzi: "我们今年的工作都已经按照计划完成了。", pinyin: "Wǒmen jīnnián de gōngzuò dōu yǐjīng ànzhào jìhuà wánchéng le.", vietnamese: "Công việc năm nay của chúng tôi đều đã hoàn thành theo kế hoạch." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l4-w1", hanzi: "以为", pinyin: "yǐwéi", hanViet: "dĩ vi", vietnamese: "tưởng rằng, ngỡ là", hskLevel: 4, radical: "人", strokeCount: 13, example: "自以为是", exampleTranslation: "tự cho mình là đúng", tags: ["Bài 4", "Động từ"] },
      { id: "hsk4-l4-w2", hanzi: "这份", pinyin: "zhè fèn", hanViet: "giá phần", vietnamese: "phần này, công việc này (lượng từ 份)", hskLevel: 4, radical: "亻", strokeCount: 13, example: "一份工作", exampleTranslation: "một công việc", tags: ["Bài 4", "Lượng từ"] },
      { id: "hsk4-l4-w3", hanzi: "完全", pinyin: "wánquán", hanViet: "hoàn toàn", vietnamese: "hoàn toàn", hskLevel: 4, radical: "宀", strokeCount: 13, example: "完全同意", exampleTranslation: "hoàn toàn đồng ý", tags: ["Bài 4", "Phó từ"] },
      { id: "hsk4-l4-w4", hanzi: "赚", pinyin: "zhuàn", hanViet: "khoán", vietnamese: "kiếm (tiền), sinh lời", hskLevel: 4, radical: "贝", strokeCount: 14, example: "赚钱", exampleTranslation: "kiếm tiền", tags: ["Bài 4", "Động từ"] },
      { id: "hsk4-l4-w5", hanzi: "调查", pinyin: "diàochá", hanViet: "điều tra", vietnamese: "điều tra, khảo sát", hskLevel: 4, radical: "讠", strokeCount: 22, example: "做调查", exampleTranslation: "làm khảo sát", tags: ["Bài 4", "Động từ"] },
      { id: "hsk4-l4-w6", hanzi: "原来", pinyin: "yuánlái", hanViet: "nguyên lai", vietnamese: "hóa ra, vốn dĩ", hskLevel: 4, radical: "厂", strokeCount: 17, example: "原来是你", exampleTranslation: "hóa ra là bạn", tags: ["Bài 4", "Phó từ"] },
      { id: "hsk4-l4-w7", hanzi: "计划", pinyin: "jìhuà", hanViet: "kế hoạch", vietnamese: "kế hoạch; lên kế hoạch", hskLevel: 4, radical: "讠", strokeCount: 17, example: "按照计划", exampleTranslation: "theo đúng kế hoạch", tags: ["Bài 4", "Danh từ"] },
      { id: "hsk4-l4-w8", hanzi: "提前", pinyin: "tíqián", hanViet: "đề tiền", vietnamese: "sớm hơn, trước thời hạn", hskLevel: 4, radical: "扌", strokeCount: 21, example: "提前完成", exampleTranslation: "hoàn thành trước thời hạn", tags: ["Bài 4", "Động từ"] },
      { id: "hsk4-l4-w9", hanzi: "保证", pinyin: "bǎozhèng", hanViet: "bảo chứng", vietnamese: "đảm bảo, bảo đảm", hskLevel: 4, radical: "亻", strokeCount: 21, example: "保证质量", exampleTranslation: "đảm bảo chất lượng", tags: ["Bài 4", "Động từ"] },
      { id: "hsk4-l4-w10", hanzi: "按照", pinyin: "ànzhào", hanViet: "án chiếu", vietnamese: "theo, căn cứ theo", hskLevel: 4, radical: "扌", strokeCount: 22, example: "按照规定", exampleTranslation: "theo quy định", tags: ["Bài 4", "Giới từ"] },
      { id: "hsk4-l4-w11", hanzi: "甚至", pinyin: "shènzhì", hanViet: "thậm chí", vietnamese: "thậm chí, ngay cả", hskLevel: 4, radical: "甘", strokeCount: 15, example: "甚至不知道", exampleTranslation: "thậm chí không biết", tags: ["Bài 4", "Phó từ"] },
      { id: "hsk4-l4-w12", hanzi: "责任", pinyin: "zérèn", hanViet: "trách nhiệm", vietnamese: "trách nhiệm", hskLevel: 4, radical: "贝", strokeCount: 17, example: "有责任心", exampleTranslation: "có tinh thần trách nhiệm", tags: ["Bài 4", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l4-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '我们必须______公司的规定来办事。'",
        options: ["A. 按照", "B. 以为", "C. 甚至", "D. 原来"],
        correctAnswer: "A. 按照",
        explanation: "'按照规定' nghĩa là 'làm việc theo đúng quy định'."
      }
    ],
    cultureBonus: {
      title: "授人以鱼不如授人以渔 (Cho cá không bằng dạy câu cá)",
      summary: "Triết lý giáo dục sâu sắc: Trao cho ai đó kỹ năng sống còn giá trị hơn việc chỉ cho họ của cải tạm thời.",
      content: "Câu danh ngôn cổ xuất phát từ 'Hoài Nam Tử'. 'Ngư' thứ nhất là con cá (kết quả trước mắt), 'ngư' thứ hai là phương pháp đánh cá (năng lực tự thân). Trong học tập và sự nghiệp, trau dồi tri thức cốt lõi mới là chìa khóa thành công lâu dài."
    }
  },

  // LESSON 5: 只买对的，不买贵的
  {
    lessonNumber: 5,
    titleHanzi: "只买对的，不买贵的",
    titlePinyin: "Zhǐ mǎi duì de, bù mǎi guì de",
    titleVietnamese: "Chỉ mua đồ phù hợp, không mua đồ đắt tiền",
    pageStart: 52,
    objectives: [
      "Sử dụng phó từ '肯定' (chắc chắn, nhất định) để khẳng định mức độ tin cậy.",
      "Sử dụng liên từ '再说' (hơn nữa, vả lại) bổ sung thêm lý do thuyết phục.",
      "Phân biệt '实际' (thực tế) và phó từ chuyển ý '实际上' (trên thực tế).",
      "Sử dụng cấu trúc '对……来说' (đối với... mà nói) nêu góc nhìn chủ quan.",
      "Phân biệt phó từ chỉ mức độ đặc biệt '尤其' và '特别'."
    ],
    texts: [
      {
        id: "hsk4-l5-t1",
        title: "课文 1 (王静在家具店买沙发)",
        context: "Vương Tĩnh mua ghế sô pha tại cửa hàng nội thất.",
        lines: [
          { speaker: "售货员", hanzi: "小姐，您好！您想买什么家具？需要我为您介绍一下吗？", pinyin: "Xiǎojiě, nín hǎo! Nín xiǎng mǎi shénme jiājù? Xūyào wǒ wèi nín jièshào yíxià ma?", vietnamese: "Chào cô! Cô muốn mua đồ nội thất gì ạ? Cần tôi giới thiệu cho cô không?" },
          { speaker: "王静", hanzi: "谢谢，我想买沙发。您看这个沙发怎么样？现在正在打折，比平时便宜了一千块。", pinyin: "Xièxie, wǒ xiǎng mǎi shāfā. Nín kàn zhè ge shāfā zěnmeyàng? Xiànzài zhèngzài dǎzhé, bǐ píngshí piányi le yìqiān kuài.", vietnamese: "Cảm ơn, tôi muốn mua sô pha. Chị xem bộ sô pha này thế nào? Đang giảm giá, rẻ hơn ngày thường một nghìn tệ đấy." },
          { speaker: "售货员", hanzi: "您放心，质量肯定不“打折”，这种沙发是今年最流行的，有很多颜色可以选择。", pinyin: "Nín fàngxīn, zhìliàng kěndìng bù \"dǎzhé\", zhè zhǒng shāfā shì jīnnián zuì liúxíng de, yǒu hěn duō yánsè kěyǐ xuǎnzé.", vietnamese: "Cô yên tâm, chất lượng chắc chắn không bị 'giảm giá' đâu ạ. Kiểu sô pha này đang thịnh hành nhất năm nay, có rất nhiều màu sắc để chọn lựa." },
          { speaker: "王静", hanzi: "这个蓝色的看上去不错，就要这个吧。", pinyin: "Zhè ge lánsè de kàn shàngqu búcuò, jiù yào zhè ge ba.", vietnamese: "Bộ màu xanh lam này trông khá đẹp, lấy bộ này đi." }
        ]
      },
      {
        id: "hsk4-l5-t2",
        title: "课文 2 (王静和李进在商场买东西)",
        context: "Vương Tĩnh và Lý Tiến đi sắm đồ gia dụng.",
        lines: [
          { speaker: "王静", hanzi: "咱们家的冰箱太旧了，商场正好打折，我们顺便也买一台吧。", pinyin: "Zánmen jiā de bīngxiāng tài jiù le, shāngchǎng zhènghǎo dǎzhé, wǒmen shùnbiàn yě mǎi yì tái ba.", vietnamese: "Tủ lạnh nhà mình cũ quá rồi, trung tâm thương mại vừa hay đang giảm giá, tiện thể tụi mình mua một chiếc nhé." },
          { speaker: "李进", hanzi: "今天买的东西太多了。再说，这个月家里已经花了五千多了。", pinyin: "Jīntiān mǎi de dōngxi tài duō le. Zàishuō, zhè ge yuè jiā lǐ yǐjīng huā le wǔqiān duō le.", vietnamese: "Hôm nay mua nhiều đồ quá rồi. Vả lại, tháng này trong nhà đã tiêu hơn năm nghìn tệ rồi đấy." },
          { speaker: "王静", hanzi: "这么多？你不会是记错了吧？", pinyin: "Zhème duō? Nǐ bú huì shì jì cuò le ba?", vietnamese: "Nhiều thế á? Không phải là anh nhớ nhầm chứ?" },
          { speaker: "李进", hanzi: "没错。上个星期光买沙发就花了两千多。", pinyin: "Méi cuò. Shàng ge xīngqī guāng mǎi shāfā jiù huā le liǎngqiān duō.", vietnamese: "Không nhầm đâu. Tuần trước riêng tiền mua sô pha đã mất hơn hai nghìn tệ rồi." },
          { speaker: "王静", hanzi: "但是咱们家的冰箱实在太旧了，制冷效果也不太好了，还是买个新的吧。", pinyin: "Dànshì zánmen jiā de bīngxiāng shízài tài jiù le, zhìlěng xiàoguǒ yě bú tài hǎo le, háishi mǎi ge xīn de ba.", vietnamese: "Nhưng tủ lạnh nhà mình cũ thật rồi, hiệu quả làm lạnh không còn tốt nữa, hay là mua chiếc mới đi anh." },
          { speaker: "李进", hanzi: "那好吧，我带的现金不够，用你的信用卡吧。", pinyin: "Nà hǎo ba, wǒ dài de xiànjīn bú gòu, yòng nǐ de xìnyòngkǎ ba.", vietnamese: "Thôi được rồi, tiền mặt anh mang không đủ, quẹt thẻ tín dụng của em nhé." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk4-l5-g1",
        title: "1. Liên từ '再说' (Hơn nữa, vả lại)",
        explanation: "Dùng để bổ sung thêm một lý do hoặc điều kiện nữa bên cạnh lý do trước đó.",
        examples: [
          { hanzi: "今天买的东西太多了。再说，这个月已经花很多钱了。", pinyin: "Jīntiān mǎi de dōngxi tài duō le. Zàishuō, zhè ge yuè yǐjīng huā hěn duō qián le.", vietnamese: "Hôm nay mua nhiều đồ quá. Hơn nữa tháng này đã tiêu rất nhiều tiền rồi." }
        ]
      },
      {
        id: "hsk4-l5-g2",
        title: "2. Cấu trúc '对……来说' (Đối với... mà nói)",
        explanation: "Nêu lên góc nhìn hoặc tiêu chuẩn từ lập trường của một đối tượng cụ thể.",
        examples: [
          { hanzi: "对我来说，衣服的样式流不流行并不是最重要的。", pinyin: "Duì wǒ lái shuō, yīfu de yàngshì liú bù liúxíng bìng bú shì zuì zhòngyào de.", vietnamese: "Đối với tôi mà nói, kiểu dáng quần áo có mốt hay không chẳng phải là quan trọng nhất." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk4-l5-w1", hanzi: "家具", pinyin: "jiājù", hanViet: "gia cụ", vietnamese: "đồ nội thất, đồ đạc trong nhà", hskLevel: 4, radical: "宀", strokeCount: 18, example: "买家具", exampleTranslation: "mua đồ gỗ nội thất", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk4-l5-w2", hanzi: "沙发", pinyin: "shāfā", hanViet: "sa phát", vietnamese: "ghế sô pha", hskLevel: 4, radical: "氵", strokeCount: 16, example: "坐在沙发上", exampleTranslation: "ngồi trên ghế sô pha", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk4-l5-w3", hanzi: "打折", pinyin: "dǎzhé", hanViet: "đả chiết", vietnamese: "giảm giá, chiết khấu", hskLevel: 4, radical: "扌", strokeCount: 12, example: "商场打折", exampleTranslation: "trung tâm thương mại giảm giá", tags: ["Bài 5", "Động từ"] },
      { id: "hsk4-l5-w4", hanzi: "价格", pinyin: "jiàgé", hanViet: "giá cách", vietnamese: "giá cả, mức giá", hskLevel: 4, radical: "亻", strokeCount: 25, example: "价格合理", exampleTranslation: "giá cả hợp lý", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk4-l5-w5", hanzi: "质量", pinyin: "zhìliàng", hanViet: "chất lượng", vietnamese: "chất lượng", hskLevel: 4, radical: "贝", strokeCount: 21, example: "质量保证", exampleTranslation: "bảo đảm chất lượng", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk4-l5-w6", hanzi: "肯定", pinyin: "kěndìng", hanViet: "khẳng định", vietnamese: "chắc chắn, nhất định", hskLevel: 4, radical: "日", strokeCount: 14, example: "肯定没问题", exampleTranslation: "chắc chắn không vấn đề gì", tags: ["Bài 5", "Phó từ"] },
      { id: "hsk4-l5-w7", hanzi: "流行", pinyin: "liúxíng", hanViet: "lưu hành", vietnamese: "thịnh hành, mốt, phổ biến", hskLevel: 4, radical: "氵", strokeCount: 16, example: "今年最流行", exampleTranslation: "thịnh hành nhất năm nay", tags: ["Bài 5", "Tính từ"] },
      { id: "hsk4-l5-w8", hanzi: "顺便", pinyin: "shùnbiàn", hanViet: "thuận tiện", vietnamese: "nhân tiện, tiện thể", hskLevel: 4, radical: "页", strokeCount: 20, example: "顺便去买菜", exampleTranslation: "tiện thể đi mua thức ăn", tags: ["Bài 5", "Phó từ"] },
      { id: "hsk4-l5-w9", hanzi: "台", pinyin: "tái", hanViet: "đài", vietnamese: "chiếc, máy (lượng từ đồ điện, máy móc)", hskLevel: 4, radical: "口", strokeCount: 5, example: "一台电脑 / 一台冰箱", exampleTranslation: "một chiếc máy tính / tủ lạnh", tags: ["Bài 5", "Lượng từ"] },
      { id: "hsk4-l5-w10", hanzi: "实在", pinyin: "shízài", hanViet: "thực tại", vietnamese: "thực sự, thật tình", hskLevel: 4, radical: "宀", strokeCount: 16, example: "实在太贵了", exampleTranslation: "thực sự quá đắt", tags: ["Bài 5", "Phó từ"] },
      { id: "hsk4-l5-w11", hanzi: "效果", pinyin: "xiàoguǒ", hanViet: "hiệu quả", vietnamese: "hiệu quả, tác dụng", hskLevel: 4, radical: "力", strokeCount: 19, example: "效果很好", exampleTranslation: "hiệu quả rất tốt", tags: ["Bài 5", "Danh từ"] },
      { id: "hsk4-l5-w12", hanzi: "现金", pinyin: "xiànjīn", hanViet: "hiện kim", vietnamese: "tiền mặt", hskLevel: 4, radical: "王", strokeCount: 16, example: "付现金", exampleTranslation: "trả tiền mặt", tags: ["Bài 5", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk4-l5-ex1",
        type: "multiple_choice",
        question: "Chọn câu có cấu trúc đúng: '______，健康比什么都重要。'",
        options: ["A. 按照我来说", "B. 对我来说", "C. 即使我来说", "D. 本来我来说"],
        correctAnswer: "B. 对我来说",
        explanation: "Cấu trúc đúng để diễn đạt quan điểm cá nhân là '对……来说' (đối với ai mà nói)."
      }
    ],
    cultureBonus: {
      title: "中国人的购物习惯 (Thói quen mua sắm của người Trung Quốc)",
      summary: "Sự chuyển mình từ văn hóa mặc cả truyền thống tại chợ truyền thống sang thương mại điện tử trực tuyến bùng nổ.",
      content: "Trước đây người tiêu dùng Trung Quốc có thói quen 'hàng so ba nhà' (货比三家) và mặc cả giá. Ngày nay, nền tảng số hóa và thanh toán di động (WeChat Pay, Alipay) đã biến Trung Quốc thành quốc gia mua sắm trực tuyến phát triển bậc nhất toàn cầu."
    }
  }
];
