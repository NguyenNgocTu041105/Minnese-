import { WordItem } from '../types';
import { DetailedTextbookLesson } from './newHsk1BookData';

export const NEW_HSK2_FULL_LESSONS: DetailedTextbookLesson[] = [
// LESSON 1
  {
    lessonNumber: 1,
    titleHanzi: "她请我们吃了北京烤鸭",
    titlePinyin: "Tā qǐng wǒmen chīle Běijīng Kǎoyā",
    titleVietnamese: "Chị ấy đã mời chúng tôi ăn vịt quay Bắc Kinh",
    pageStart: 1,
    objectives: [
      "能听懂并使用“请”“让”“叫”表达请求 (Hiểu và sử dụng câu kiêm ngữ với '请', '让', '叫' để biểu đạt yêu cầu).",
      "掌握语气助词“吧”（2）的用法，能表达揣测、估计的语气 (Nắm vững cách dùng trợ từ ngữ khí '吧' biểu thị phán đoán, ước lượng).",
      "掌握“是……的”句，能以此强调事情发生的时间、地点、方式等信息 (Nắm vững cấu trúc câu '是……的' để nhấn mạnh thời gian, địa điểm, phương thức).",
      "了解北京名菜烤鸭及其吃法 (Tìm hiểu về món vịt quay Bắc Kinh nổi tiếng và cách thưởng thức)."
    ],
    texts: [
      {
        id: "hsk2-l1-t1",
        title: "课文 1: 在机场 (Bài khóa 1: Ở sân bay)",
        context: "在机场，王一雪接到了白家月和安妮。(Ở sân bay, Vương Nhất Tuyết đón Bạch Gia Nguyệt và Annie).",
        lines: [
          { speaker: "白家月", hanzi: "请问，您是王一飞老师的姐姐吗？", pinyin: "Qǐngwèn, nín shì Wáng Yīfēi lǎoshī de jiějie ma?", vietnamese: "Xin hỏi, chị có phải là chị gái của cô giáo Vương Nhất Phi không ạ?" },
          { speaker: "王一雪", hanzi: "是的，你们就是她的学生吧？", pinyin: "Shì de, nǐmen jiù shì tā de xuésheng ba?", vietnamese: "Đúng vậy, các em chắc hẳn là học sinh của cô ấy đúng không?" },
          { speaker: "白家月", hanzi: "对。我是白家月，她是安妮。", pinyin: "Duì. Wǒ shì Bái Jiāyuè, tā shì Ānnī.", vietnamese: "Vâng ạ. Em là Bạch Gia Nguyệt, đây là Annie." },
          { speaker: "王一雪", hanzi: "你们好，我叫王一雪。一飞给我打电话了，让我来接你们。", pinyin: "Nǐmen hǎo, wǒ jiào Wáng Yīxuě. Yīfēi gěi wǒ dǎ diànhuà le, ràng wǒ lái jiē nǐmen.", vietnamese: "Chào các em, chị là Vương Nhất Tuyết. Nhất Phi đã gọi điện cho chị, bảo chị đến đón các em." },
          { speaker: "白家月 & 安妮", hanzi: "谢谢您。", pinyin: "Xièxie nín.", vietnamese: "Cảm ơn chị ạ." },
          { speaker: "王一雪", hanzi: "不客气。", pinyin: "Bú kèqi.", vietnamese: "Không có gì đâu." }
        ]
      },
      {
        id: "hsk2-l1-t2",
        title: "课文 2: 在王一雪的车里 (Bài khóa 2: Trong xe của Vương Nhất Tuyết)",
        context: "在王一雪的车里，白家月、安妮和王一雪在聊天儿。(Trong xe của Vương Nhất Tuyết, Bạch Gia Nguyệt, Annie và Vương Nhất Tuyết trò chuyện).",
        lines: [
          { speaker: "王一雪", hanzi: "你们是第一次来北京吗？", pinyin: "Nǐmen shì dì-yī cì lái Běijīng ma?", vietnamese: "Các em là lần đầu tiên đến Bắc Kinh à?" },
          { speaker: "白家月", hanzi: "是的，我们都是第一次来。", pinyin: "Shì de, wǒmen dōu shì dì-yī cì lái.", vietnamese: "Vâng ạ, chúng em đều là lần đầu tiên tới." },
          { speaker: "王一雪", hanzi: "你们是来学中文的吗？", pinyin: "Nǐmen shì lái xué Zhōngwén de ma?", vietnamese: "Các em đến để học tiếng Trung à?" },
          { speaker: "安妮", hanzi: "不是，我们是来旅游的。", pinyin: "Bú shì, wǒmen shì lái lǚyóu de.", vietnamese: "Không ạ, chúng em đến để du lịch." },
          { speaker: "王一雪", hanzi: "我这几天都不忙，你们有事就找我。", pinyin: "Wǒ zhè jǐ tiān dōu bù máng, nǐmen yǒu shì jiù zhǎo wǒ.", vietnamese: "Chị mấy ngày này đều không bận, các em có việc gì cứ tìm chị nhé." },
          { speaker: "白家月", hanzi: "好的，谢谢您。", pinyin: "Hǎo de, xièxie nín.", vietnamese: "Vâng ạ, cảm ơn chị nhiều." }
        ]
      },
      {
        id: "hsk2-l1-t3",
        title: "课文 3: 在王一雪的车里，白家月接电话 (Bài khóa 3: Bạch Gia Nguyệt nghe điện thoại)",
        context: "在王一雪的车里，白家月接了个电话。(Trong xe của Vương Nhất Tuyết, Bạch Gia Nguyệt nhận một cuộc điện thoại).",
        lines: [
          { speaker: "陈天中", hanzi: "喂，家月，你明天有时间吗？我想请你帮个忙。", pinyin: "Wèi, Jiāyuè, nǐ míngtiān yǒu shíjiān ma? Wǒ xiǎng qǐng nǐ bāng gè máng.", vietnamese: "A lô, Gia Nguyệt, ngày mai cậu có thời gian không? Mình muốn nhờ cậu giúp một việc." },
          { speaker: "白家月", hanzi: "不好意思，天中，我已经到北京了。", pinyin: "Bù hǎoyìsi, Tiānzhōng, wǒ yǐjīng dào Běijīng le.", vietnamese: "Ngại quá, Thiên Trung, mình đã tới Bắc Kinh rồi." },
          { speaker: "陈天中", hanzi: "你是什么时候到的？", pinyin: "Nǐ shì shénme shíhou dào de?", vietnamese: "Cậu tới lúc nào vậy?" },
          { speaker: "白家月", hanzi: "我是今天早上到的。你有事可以叫李文帮忙，他还在学校呢。", pinyin: "Wǒ shì jīntiān zǎoshang dào de. Nǐ yǒu shì kěyǐ jiào Lǐ Wén bāngmáng, tā hái zài xuéxiào ne.", vietnamese: "Mình tới sáng nay. Cậu có việc có thể nhờ Lý Văn giúp, cậu ấy vẫn còn ở trường đấy." },
          { speaker: "陈天中", hanzi: "好的，那我给他打个电话。", pinyin: "Hǎo de, nà wǒ gěi tā dǎ gè diànhuà.", vietnamese: "Được rồi, thế để mình gọi cho cậu ấy." },
          { speaker: "白家月", hanzi: "好，再见！", pinyin: "Hǎo, zàijiàn!", vietnamese: "Ừ, tạm biệt nhé!" }
        ]
      },
      {
        id: "hsk2-l1-t4",
        title: "课文 4: 在酒店 (Bài khóa 4: Ở khách sạn)",
        context: "在酒店，白家月给王一飞发信息。(Ở khách sạn, Bạch Gia Nguyệt gửi tin nhắn cho cô Vương Nhất Phi).",
        lines: [
          { speaker: "白家月", hanzi: "王老师，我们已经到北京了，是您姐姐来接的我们。她请我们吃了北京烤鸭，还给我们介绍了很多东西。我们的中文不太好，有时不太懂她的意思。", pinyin: "Wáng lǎoshī, wǒmen yǐjīng dào Běijīng le, shì nín jiějie lái jiē de wǒmen. Tā qǐng wǒmen chīle Běijīng Kǎoyā, hái gěi wǒmen jièshào le hěn duō dōngxi. Wǒmen de Zhōngwén bú tài hǎo, yǒushí bú tài dǒng tā de yìsi.", vietnamese: "Thưa cô Vương, chúng em đã đến Bắc Kinh rồi, là chị gái của cô đến đón chúng em. Chị ấy đã mời chúng em ăn vịt quay Bắc Kinh, còn giới thiệu cho chúng em rất nhiều điều. Tiếng Trung của chúng em chưa tốt lắm, đôi khi không hiểu lắm ý của chị ấy." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l1-g1",
        title: "1. 语气助词“吧”（2）(Trợ từ ngữ khí '吧' biểu thị phán đoán, ước lượng)",
        explanation: "Dùng ở cuối câu nghi vấn để biểu thị ngữ khí suy đoán, ước lượng (The modal particle '吧' is used at the end of an interrogative sentence to express speculation or estimation).",
        examples: [
          { hanzi: "你们就是她的学生吧？", pinyin: "Nǐmen jiù shì tā de xuésheng ba?", vietnamese: "Các em chắc hẳn là học sinh của cô ấy đúng không?" },
          { hanzi: "她唱歌很好听吧？", pinyin: "Tā chànggē hěn hǎotīng ba?", vietnamese: "Cô ấy hát rất hay đúng không?" },
          { hanzi: "陈天中是泰国人吧？", pinyin: "Chén Tiānzhōng shì Tàiguórén ba?", vietnamese: "Trần Thiên Trung là người Thái Lan đúng không?" }
        ]
      },
      {
        id: "hsk2-l1-g2",
        title: "2. “是……的”句 (Cấu trúc câu '是……的')",
        explanation: "Dùng để nhấn mạnh thời gian, địa điểm, phương thức, người thực hiện hoặc mục đích của hành động đã xảy ra trong quá khứ. Trong câu khẳng định và nghi vấn có thể lược bỏ '是', nhưng trong câu phủ định bắt buộc phải có '不是……的'.",
        examples: [
          { hanzi: "我们是来旅游的。", pinyin: "Wǒmen shì lái lǚyóu de.", vietnamese: "Chúng em đến là để đi du lịch (nhấn mạnh mục đích)." },
          { hanzi: "我是今天早上到的。", pinyin: "Wǒ shì jīntiān zǎoshang dào de.", vietnamese: "Tôi đến vào sáng nay (nhấn mạnh thời gian)." },
          { hanzi: "是您姐姐来接的我们。", pinyin: "Shì nín jiějie lái jiē de wǒmen.", vietnamese: "Chính là chị gái cô đến đón chúng em (nhấn mạnh người thực hiện)." },
          { hanzi: "我们不是坐出租车去的。", pinyin: "Wǒmen bú shì zuò chūzūchē qù de.", vietnamese: "Chúng tôi không phải đi bằng taxi (phủ định phương thức)." }
        ]
      },
      {
        id: "hsk2-l1-g3",
        title: "3. 兼语句 (Câu kiêm ngữ - Pivotal Sentences: 请 / 让 / 叫)",
        explanation: "Câu kiêm ngữ có vị ngữ gồm hai cụm động từ, trong đó tân ngữ của động từ thứ nhất đồng thời là chủ ngữ của động từ thứ hai. Khi động từ đầu tiên là '请' (mời, nhờ), '让' (cho phép, bảo), '叫' (bảo, gọi) biểu thị yêu cầu hoặc nhờ vả ai làm việc gì. Cấu trúc: Chủ ngữ + 请/让/叫 + Tân ngữ (kiêm Chủ ngữ 2) + Động từ 2.",
        examples: [
          { hanzi: "一飞给我打电话了，让我来接你们。", pinyin: "Yīfēi gěi wǒ dǎ diànhuà le, ràng wǒ lái jiē nǐmen.", vietnamese: "Nhất Phi gọi điện cho tôi, bảo tôi đến đón các bạn." },
          { hanzi: "我想请你帮个忙。", pinyin: "Wǒ xiǎng qǐng nǐ bāng gè máng.", vietnamese: "Mình muốn nhờ cậu giúp một việc." },
          { hanzi: "你有事可以叫李文帮忙。", pinyin: "Nǐ yǒu shì kěyǐ jiào Lǐ Wén bāngmáng.", vietnamese: "Cậu có việc có thể bảo Lý Văn giúp." },
          { hanzi: "王老师让我们说中文。", pinyin: "Wáng lǎoshī ràng wǒmen shuō Zhōngwén.", vietnamese: "Cô Vương bảo chúng tôi nói tiếng Trung." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l1-w1", hanzi: "就", pinyin: "jiù", hanViet: "tựu", vietnamese: "chính là, ngay", hskLevel: 2, radical: "亠", strokeCount: 12, example: "你们就是她的学生吧？", exampleTranslation: "Các em chính là học sinh của cô ấy đúng không?", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk2-l1-w2", hanzi: "给", pinyin: "gěi", hanViet: "cấp", vietnamese: "cho, đối với", hskLevel: 2, radical: "纟", strokeCount: 9, example: "一飞给我打电话了。", exampleTranslation: "Nhất Phi đã gọi điện cho tôi.", tags: ["Bài 1", "Giới từ"] },
      { id: "hsk2-l1-w3", hanzi: "让", pinyin: "ràng", hanViet: "nhượng", vietnamese: "để, bảo, cho phép", hskLevel: 2, radical: "讠", strokeCount: 5, example: "让我来接你们。", exampleTranslation: "Bảo tôi đến đón các em.", tags: ["Bài 1", "Động từ"] },
      { id: "hsk2-l1-w4", hanzi: "接", pinyin: "jiē", hanViet: "tiếp", vietnamese: "đón, nhận", hskLevel: 2, radical: "扌", strokeCount: 11, example: "去机场接朋友", exampleTranslation: "ra sân bay đón bạn", tags: ["Bài 1", "Động từ"] },
      { id: "hsk2-l1-w5", hanzi: "次", pinyin: "cì", hanViet: "thứ", vietnamese: "lần, lượt (lượng từ)", hskLevel: 2, radical: "欠", strokeCount: 6, example: "第一次来北京", exampleTranslation: "lần đầu tiên đến Bắc Kinh", tags: ["Bài 1", "Lượng từ"] },
      { id: "hsk2-l1-w6", hanzi: "旅游", pinyin: "lǚyóu", hanViet: "lữ du", vietnamese: "du lịch", hskLevel: 2, radical: "方", strokeCount: 16, example: "我们是来旅游的。", exampleTranslation: "Chúng tôi đến để du lịch.", tags: ["Bài 1", "Du lịch"] },
      { id: "hsk2-l1-w7", hanzi: "帮忙", pinyin: "bāngmáng", hanViet: "bang mang", vietnamese: "giúp đỡ", hskLevel: 2, radical: "巾", strokeCount: 12, example: "我想请你帮个忙。", exampleTranslation: "Tôi muốn nhờ bạn giúp một việc.", tags: ["Bài 1", "Động từ li hợp"] },
      { id: "hsk2-l1-w8", hanzi: "不好意思", pinyin: "bù hǎoyìsi", hanViet: "bất hảo ý tư", vietnamese: "ngại quá, xin lỗi", hskLevel: 2, radical: "心", strokeCount: 22, example: "不好意思，我已经到北京了。", exampleTranslation: "Ngại quá, tôi đã tới Bắc Kinh rồi.", tags: ["Bài 1", "Khẩu ngữ"] },
      { id: "hsk2-l1-w9", hanzi: "已经", pinyin: "yǐjīng", hanViet: "dĩ kinh", vietnamese: "đã, rồi", hskLevel: 2, radical: "己", strokeCount: 11, example: "我已经到北京了。", exampleTranslation: "Tôi đã đến Bắc Kinh rồi.", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk2-l1-w10", hanzi: "那", pinyin: "nà", hanViet: "na", vietnamese: "vậy thì, thế thì", hskLevel: 2, radical: "阝", strokeCount: 6, example: "好的，那我给他打个电话。", exampleTranslation: "Được, vậy để tôi gọi cho cậu ấy.", tags: ["Bài 1", "Liên từ"] },
      { id: "hsk2-l1-w11", hanzi: "介绍", pinyin: "jièshào", hanViet: "giới thiệu", vietnamese: "giới thiệu", hskLevel: 2, radical: "人", strokeCount: 12, example: "介绍了很多东西", exampleTranslation: "giới thiệu rất nhiều điều", tags: ["Bài 1", "Động từ"] },
      { id: "hsk2-l1-w12", hanzi: "有时", pinyin: "yǒushí", hanViet: "hữu thời", vietnamese: "có lúc, đôi khi", hskLevel: 2, radical: "日", strokeCount: 11, example: "有时不太懂她的意思", exampleTranslation: "đôi khi không hiểu lắm ý của chị ấy", tags: ["Bài 1", "Phó từ"] },
      { id: "hsk2-l1-w13", hanzi: "懂", pinyin: "dǒng", hanViet: "đổng", vietnamese: "hiểu, biết", hskLevel: 2, radical: "忄", strokeCount: 15, example: "听懂中文", exampleTranslation: "nghe hiểu tiếng Trung", tags: ["Bài 1", "Động từ"] },
      { id: "hsk2-l1-w14", hanzi: "意思", pinyin: "yìsi", hanViet: "ý tư", vietnamese: "ý, ý nghĩa", hskLevel: 2, radical: "心", strokeCount: 22, example: "不懂她的意思", exampleTranslation: "không hiểu ý của chị ấy", tags: ["Bài 1", "Danh từ"] },
      { id: "hsk2-l1-w15", hanzi: "北京烤鸭", pinyin: "Běijīng Kǎoyā", hanViet: "Bắc Kinh khảo áp", vietnamese: "Vịt quay Bắc Kinh", hskLevel: 2, radical: "鸟", strokeCount: 29, example: "请我们吃北京烤鸭", exampleTranslation: "mời chúng tôi ăn vịt quay Bắc Kinh", tags: ["Bài 1", "Món ăn"] }
    ],
    exercises: [
      {
        id: "hsk2-l1-ex1",
        type: "fill_blank",
        question: "Chọn từ thích hợp điền vào câu phán đoán: '你们 ______ 是她的学生吧？'",
        hanziPrompt: "你们 ______ 是她的学生吧？",
        pinyinPrompt: "Nǐmen ______ shì tā de xuésheng ba?",
        vietnamesePrompt: "Các em chính là học sinh của cô ấy đúng không?",
        options: ["A. 就", "B. 也", "C. 还", "D. 都"],
        correctAnswer: "A. 就",
        explanation: "Phó từ '就' dùng trước vị ngữ để nhấn mạnh hoặc khẳng định chắc chắn: '你们就是……吧？'.",
        grammarFocus: "Phó từ nhấn mạnh 就",
        audioText: "你们就是她的学生吧？"
      },
      {
        id: "hsk2-l1-ex2",
        type: "dialogue_match",
        question: "Chọn câu trả lời phù hợp trong câu kiêm ngữ: '喂，家月，你明天有时间吗？我想请你帮个忙。'",
        hanziPrompt: "A: 喂，家月，你明天有时间吗？我想请你帮个忙。 — B: ______",
        pinyinPrompt: "A: Wèi, Jiāyuè, nǐ míngtiān yǒu shíjiān ma? Wǒ xiǎng qǐng nǐ bāng gè máng. — B: ______",
        vietnamesePrompt: "A: A lô, Gia Nguyệt, mai cậu có rảnh không? Mình muốn nhờ cậu giúp một việc. — B: Ngại quá, Thiên Trung, mình đã tới Bắc Kinh rồi.",
        options: [
          "不好意思，天中，我已经到北京了。",
          "不用谢，我们是第一次来。",
          "没关系，他是泰国人吧。",
          "不客气，那是我的手机。"
        ],
        correctAnswer: "不好意思，天中，我已经到北京了。",
        explanation: "Lời từ chối lịch sự bằng '不好意思' kèm lý do '我已经到北京了'.",
        grammarFocus: "Giao tiếp lịch sự và phó từ 已经",
        audioText: "不好意思，天中，我已经到北京了。"
      },
      {
        id: "hsk2-l1-ex3",
        type: "sentence_scramble",
        question: "Sắp xếp các từ sau thành câu nhấn mạnh cấu trúc '是……的':",
        hanziPrompt: "[ 我们 / 来旅游 / 是 / 的 / 。 ]",
        vietnamesePrompt: "Chúng tôi đến đây là để đi du lịch.",
        scrambleSegments: ["我们", "是", "来旅游", "的", "。"],
        options: [
          "我们是来旅游的。",
          "我们来旅游的是。",
          "是来旅游的我们。",
          "我们的来旅游是。"
        ],
        correctAnswer: "我们是来旅游的。",
        explanation: "Cấu trúc nhấn mạnh mục đích: Chủ ngữ + 是 + Cụm động từ mục đích (来旅游) + 的。",
        grammarFocus: "Cấu trúc nhấn mạnh 是……的",
        audioText: "我们是来旅游的。"
      },
      {
        id: "hsk2-l1-ex4",
        type: "translation",
        question: "Dịch sang tiếng Trung sử dụng câu kiêm ngữ: 'Chị ấy đã mời chúng tôi ăn vịt quay Bắc Kinh.'",
        vietnamesePrompt: "Chị ấy đã mời chúng tôi ăn vịt quay Bắc Kinh.",
        options: [
          "她请我们吃了北京烤鸭。",
          "我们请她吃了北京烤鸭。",
          "她叫我们买了北京烤鸭。",
          "她让我们看北京烤鸭。"
        ],
        correctAnswer: "她请我们吃了北京烤鸭。",
        explanation: "Cấu trúc kiêm ngữ với động từ '请' (mời): Chủ ngữ (她) + 请 + Tân ngữ kiêm Chủ ngữ 2 (我们) + Động từ 2 (吃了北京烤鸭).",
        grammarFocus: "Câu kiêm ngữ với 请",
        audioText: "她请我们吃了北京烤鸭。"
      }
    ]
  },

  // LESSON 2
  {
    lessonNumber: 2,
    titleHanzi: "还是打车去北大吧",
    titlePinyin: "Háishi dǎchē qù Běidà ba",
    titleVietnamese: "Hay là đi taxi đến Đại học Bắc Kinh đi",
    pageStart: 10,
    objectives: [
      "能听懂并介绍学校的基本情况 (Hiểu và giới thiệu được tình hình cơ bản của trường học).",
      "能听懂并使用“多”表达大概的数量 (Hiểu và sử dụng '多' biểu thị số lượng xấp xỉ, ước lượng).",
      "掌握固定格式“还是……吧”的用法，能表达选择 (Nắm vững cấu trúc '还是……吧' để diễn đạt sự lựa chọn phù hợp hơn).",
      "了解中国著名学府——北京大学 (Tìm hiểu về ngôi trường danh tiếng hàng đầu Trung Quốc - Đại học Bắc Kinh)."
    ],
    texts: [
      {
        id: "hsk2-l2-t1",
        title: "课文 1: 在宾馆前台 (Bài khóa 1: Ở quầy lễ tân khách sạn)",
        context: "在宾馆前台，白家月和安妮向服务员咨询。(Ở quầy lễ tân khách sạn, Bạch Gia Nguyệt và Annie hỏi thăm nhân viên phục vụ).",
        lines: [
          { speaker: "白家月", hanzi: "请问，这儿有到北京大学的公交车吗？", pinyin: "Qǐngwèn, zhèr yǒu dào Běijīng Dàxué de gōngjiāochē ma?", vietnamese: "Xin hỏi, ở đây có xe buýt đi đến Đại học Bắc Kinh không ạ?" },
          { speaker: "服务员", hanzi: "有，但车站有点儿远。", pinyin: "Yǒu, dàn chēzhàn yǒudiǎnr yuǎn.", vietnamese: "Có, nhưng trạm xe buýt hơi xa một chút." },
          { speaker: "白家月", hanzi: "这儿好打车吗？", pinyin: "Zhèr hǎo dǎchē ma?", vietnamese: "Ở đây có dễ bắt taxi không ạ?" },
          { speaker: "服务员", hanzi: "好打车。", pinyin: "Hǎo dǎchē.", vietnamese: "Dễ bắt taxi lắm ạ." },
          { speaker: "白家月", hanzi: "谢谢。安妮，我们还是打车去吧。", pinyin: "Xièxie. Ānnī, wǒmen háishi dǎchē qù ba.", vietnamese: "Cảm ơn chị. Annie, chúng mình hay là đi taxi đi." },
          { speaker: "安妮", hanzi: "好，没问题。", pinyin: "Hǎo, méi wèntí.", vietnamese: "Được, không thành vấn đề." }
        ]
      },
      {
        id: "hsk2-l2-t2",
        title: "课文 2: 在北京大学 (Bài khóa 2: Ở Đại học Bắc Kinh)",
        context: "在北京大学，白家月和安妮在参观校园。(Ở Đại học Bắc Kinh, Bạch Gia Nguyệt và Annie đi tham quan khuôn viên trường).",
        lines: [
          { speaker: "白家月", hanzi: "学校里人真多啊！", pinyin: "Xuéxiào li rén zhēn duō a!", vietnamese: "Trong trường đông người thật đấy!" },
          { speaker: "安妮", hanzi: "是啊，北京大学有四万多名学生呢！", pinyin: "Shì a, Běijīng Dàxué yǒu sìwàn duō míng xuésheng ne!", vietnamese: "Đúng vậy, Đại học Bắc Kinh có hơn bốn vạn sinh viên lận đó!" },
          { speaker: "白家月", hanzi: "你是怎么知道的？", pinyin: "Nǐ shì zěnme zhīdào de?", vietnamese: "Sao cậu biết được vậy?" },
          { speaker: "安妮", hanzi: "是网上说的，网上还说北京大学有三千多名外国学生。", pinyin: "Shì wǎngshang shuō de, wǎngshang hái shuō Běijīng Dàxué yǒu sānqiān duō míng wàiguó xuésheng.", vietnamese: "Là trên mạng nói đó, trên mạng còn nói Đại học Bắc Kinh có hơn ba nghìn lưu học sinh nước ngoài." },
          { speaker: "白家月", hanzi: "我也想来这儿学习。", pinyin: "Wǒ yě xiǎng lái zhèr xuéxí.", vietnamese: "Mình cũng muốn đến đây học ghê." },
          { speaker: "安妮", hanzi: "那边就有一间教室，我们去看一下吧。", pinyin: "Nàbian jiù yǒu yì jiān jiàoshì, wǒmen qù kàn yíxià ba.", vietnamese: "Đằng kia có một phòng học kìa, chúng mình qua xem thử đi." }
        ]
      },
      {
        id: "hsk2-l2-t3",
        title: "课文 3: 在北京大学 (Bài khóa 3: Ở Đại học Bắc Kinh)",
        context: "在北京大学，白家月和安妮在参观校园。(Ở Đại học Bắc Kinh, Bạch Gia Nguyệt và Annie tham quan khuôn viên trường).",
        lines: [
          { speaker: "安妮", hanzi: "家月，你看，学校里有家电影院！", pinyin: "Jiāyuè, nǐ kàn, xuéxiào li yǒu jiā diànyǐngyuàn!", vietnamese: "Gia Nguyệt, cậu nhìn kìa, trong trường có cả rạp chiếu phim này!" },
          { speaker: "白家月", hanzi: "是啊，电影院还不小。", pinyin: "Shì a, diànyǐngyuàn hái bù xiǎo.", vietnamese: "Đúng thế, rạp chiếu phim này cũng không hề nhỏ đâu." },
          { speaker: "安妮", hanzi: "他们卖的电影票也很便宜。", pinyin: "Tāmen mài de diànyǐngpiào yě hěn piányi.", vietnamese: "Vé xem phim họ bán cũng rẻ lắm." },
          { speaker: "白家月", hanzi: "天啊！有的还不到二十块钱。", pinyin: "Tiān a! Yǒude hái bú dào èrshí kuài qián.", vietnamese: "Trời ơi! Có vé còn chưa tới hai mươi tệ nữa." },
          { speaker: "安妮", hanzi: "那你想不想去看个电影？", pinyin: "Nà nǐ xiǎng bu xiǎng qù kàn gè diànyǐng?", vietnamese: "Thế cậu có muốn đi xem một bộ phim không?" },
          { speaker: "白家月", hanzi: "还是别看电影了，北京大学就很好看！", pinyin: "Háishi bié kàn diànyǐng le, Běijīng Dàxué jiù hěn hǎokàn!", vietnamese: "Thôi đừng xem phim nữa, chỉ riêng Đại học Bắc Kinh thôi đã ngắm mê ly rồi!" }
        ]
      },
      {
        id: "hsk2-l2-t4",
        title: "课文 4: 在北京大学门口 (Bài khóa 4: Trước cổng Đại học Bắc Kinh)",
        context: "在北京大学门口，白家月给陈天中发信息。(Ở cổng Đại học Bắc Kinh, Bạch Gia Nguyệt gửi tin nhắn cho Trần Thiên Trung).",
        lines: [
          { speaker: "白家月", hanzi: "北京大学很大，有四万多名学生。学校很漂亮，里边还有家电影院，电影票也不贵，我们有时间还想再过来看个电影。", pinyin: "Běijīng Dàxué hěn dà, yǒu sìwàn duō míng xuésheng. Xuéxiào hěn piàoliang, lǐbian hái yǒu jiā diànyǐngyuàn, diànyǐngpiào yě bú guì, wǒmen yǒu shíjiān hái xiǎng zài guòlái kàn gè diànyǐng.", vietnamese: "Đại học Bắc Kinh rất rộng lớn, có hơn bốn vạn sinh viên. Trường rất đẹp, bên trong còn có rạp chiếu phim, vé phim cũng không đắt, chúng tớ nếu có thời gian còn muốn quay lại đây xem một bộ phim." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l2-g1",
        title: "1. 固定格式“还是……吧” (Cấu trúc '还是……吧' biểu thị sự lựa chọn)",
        explanation: "Biểu thị xu hướng lựa chọn sau khi cân nhắc, cho rằng phương án này tốt hơn phương án khác (Used to express a preferential choice, with the connotation that 'this way is better').",
        examples: [
          { hanzi: "我们还是打车去吧。", pinyin: "Wǒmen háishi dǎchē qù ba.", vietnamese: "Chúng mình hay là đi taxi đi." },
          { hanzi: "那件衣服很好看，还是买那件吧。", pinyin: "Nà jiàn yīfu hěn hǎokàn, háishi mǎi nà jiàn ba.", vietnamese: "Bộ quần áo đó rất đẹp, hay là mua bộ đó đi." },
          { hanzi: "你第一次去北京，还是找个人接你吧。", pinyin: "Nǐ dì-yī cì qù Běijīng, háishi zhǎo gè rén jiē nǐ ba.", vietnamese: "Bạn lần đầu đến Bắc Kinh, hay là tìm người ra đón đi." }
        ]
      },
      {
        id: "hsk2-l2-g2",
        title: "2. 用“多”表达概数 (Dùng '多' biểu thị số lượng xấp xỉ, ước lượng)",
        explanation: "Khi đứng sau số từ tròn chục, trăm, nghìn (10, 20, 100, 1000...), '多' đứng trước lượng từ (Số từ + 多 + Lượng từ + Danh từ). Khi số từ không tròn chục (1-9), '多' đứng sau lượng từ (Số từ + Lượng từ + 多 + Danh từ).",
        examples: [
          { hanzi: "北京大学有四万多名学生呢！", pinyin: "Běijīng Dàxué yǒu sìwàn duō míng xuésheng ne!", vietnamese: "Đại học Bắc Kinh có hơn 4 vạn sinh viên lận đó!" },
          { hanzi: "教室里有二十多个学生。", pinyin: "Jiàoshì li yǒu èrshí duō gè xuésheng.", vietnamese: "Trong phòng học có hơn 20 sinh viên." },
          { hanzi: "这两个苹果五块多钱。", pinyin: "Zhè liǎng gè píngguǒ wǔ kuài duō qián.", vietnamese: "Hai quả táo này năm đồng mấy (hơn 5 đồng)." }
        ]
      },
      {
        id: "hsk2-l2-g3",
        title: "3. 动词/动词短语作定语 (Động từ hoặc cụm động từ làm định ngữ)",
        explanation: "Động từ hoặc cụm động từ có thể đứng trước trợ từ kết cấu '的' để làm định ngữ bổ nghĩa cho danh từ phía sau (Verbs, verbal phrases, and subject-predicate phrases as attributives).",
        examples: [
          { hanzi: "他们卖的电影票也很便宜。", pinyin: "Tāmen mài de diànyǐngpiào yě hěn piányi.", vietnamese: "Vé xem phim họ bán cũng rất rẻ." },
          { hanzi: "现在学中文的学生很多。", pinyin: "Xiànzài xué Zhōngwén de xuésheng hěn duō.", vietnamese: "Sinh viên học tiếng Trung bây giờ rất nhiều." },
          { hanzi: "这是朋友给我的杯子。", pinyin: "Zhè shì péngyou gěi wǒ de bēizi.", vietnamese: "Đây là chiếc cốc bạn tặng tôi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l2-w1", hanzi: "公交车", pinyin: "gōngjiāochē", hanViet: "công giao xa", vietnamese: "xe buýt", hskLevel: 2, radical: "车", strokeCount: 14, example: "坐公交车去学校", exampleTranslation: "đi xe buýt đến trường", tags: ["Bài 2", "Giao thông"] },
      { id: "hsk2-l2-w2", hanzi: "但", pinyin: "dàn", hanViet: "đãn", vietnamese: "nhưng, nhưng mà", hskLevel: 2, radical: "亻", strokeCount: 7, example: "有，但车站有点儿远。", exampleTranslation: "Có, nhưng trạm xe hơi xa.", tags: ["Bài 2", "Liên từ"] },
      { id: "hsk2-l2-w3", hanzi: "车站", pinyin: "chēzhàn", hanViet: "xa trạm", vietnamese: "trạm xe, bến xe", hskLevel: 2, radical: "车", strokeCount: 12, example: "车站有点儿远", exampleTranslation: "trạm xe hơi xa", tags: ["Bài 2", "Giao thông"] },
      { id: "hsk2-l2-w4", hanzi: "远", pinyin: "yuǎn", hanViet: "viễn", vietnamese: "xa", hskLevel: 2, radical: "辶", strokeCount: 7, example: "家离学校很远", exampleTranslation: "nhà cách trường rất xa", tags: ["Bài 2", "Tính từ"] },
      { id: "hsk2-l2-w5", hanzi: "打车", pinyin: "dǎchē", hanViet: "đả xa", vietnamese: "bắt taxi", hskLevel: 2, radical: "扌", strokeCount: 9, example: "我们还是打车去吧。", exampleTranslation: "Chúng mình hay là đi taxi đi.", tags: ["Bài 2", "Động từ"] },
      { id: "hsk2-l2-w6", hanzi: "还是", pinyin: "háishi", hanViet: "hoàn thị", vietnamese: "hay là, tốt nhất là", hskLevel: 2, radical: "日", strokeCount: 18, example: "还是打车去吧", exampleTranslation: "hay là đi taxi đi", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk2-l2-w7", hanzi: "啊", pinyin: "a", hanViet: "a", vietnamese: "a, chà (trợ từ ngữ khí)", hskLevel: 2, radical: "口", strokeCount: 11, example: "学校里人真多啊！", exampleTranslation: "Trong trường đông người thật đấy!", tags: ["Bài 2", "Trợ từ"] },
      { id: "hsk2-l2-w8", hanzi: "万", pinyin: "wàn", hanViet: "vạn", vietnamese: "vạn (mười nghìn)", hskLevel: 2, radical: "一", strokeCount: 3, example: "四万多名学生", exampleTranslation: "hơn bốn vạn sinh viên", tags: ["Bài 2", "Số từ"] },
      { id: "hsk2-l2-w9", hanzi: "名", pinyin: "míng", hanViet: "danh", vietnamese: "người (lượng từ trang trọng)", hskLevel: 2, radical: "口", strokeCount: 6, example: "四万多名学生", exampleTranslation: "hơn 4 vạn sinh viên", tags: ["Bài 2", "Lượng từ"] },
      { id: "hsk2-l2-w10", hanzi: "网上", pinyin: "wǎngshang", hanViet: "võng thượng", vietnamese: "trên mạng", hskLevel: 2, radical: "冂", strokeCount: 9, example: "是网上说的", exampleTranslation: "là trên mạng nói", tags: ["Bài 2", "Danh từ"] },
      { id: "hsk2-l2-w11", hanzi: "外国", pinyin: "wàiguó", hanViet: "ngoại quốc", vietnamese: "nước ngoài", hskLevel: 2, radical: "夕", strokeCount: 13, example: "三千多名外国学生", exampleTranslation: "hơn ba nghìn sinh viên nước ngoài", tags: ["Bài 2", "Danh từ"] },
      { id: "hsk2-l2-w12", hanzi: "间", pinyin: "jiān", hanViet: "gian", vietnamese: "gian, phòng (lượng từ)", hskLevel: 2, radical: "门", strokeCount: 7, example: "一间教室", exampleTranslation: "một phòng học", tags: ["Bài 2", "Lượng từ"] },
      { id: "hsk2-l2-w13", hanzi: "教室", pinyin: "jiàoshì", hanViet: "giáo thất", vietnamese: "phòng học", hskLevel: 2, radical: "攵", strokeCount: 19, example: "那儿有一间教室", exampleTranslation: "đằng kia có một phòng học", tags: ["Bài 2", "Địa điểm"] },
      { id: "hsk2-l2-w14", hanzi: "票", pinyin: "piào", hanViet: "phiếu", vietnamese: "vé", hskLevel: 2, radical: "示", strokeCount: 11, example: "买电影票", exampleTranslation: "mua vé xem phim", tags: ["Bài 2", "Danh từ"] },
      { id: "hsk2-l2-w15", hanzi: "别", pinyin: "bié", hanViet: "biệt", vietnamese: "đừng, không nên", hskLevel: 2, radical: "刂", strokeCount: 7, example: "还是别看电影了", exampleTranslation: "hay là đừng xem phim nữa", tags: ["Bài 2", "Phó từ"] },
      { id: "hsk2-l2-w16", hanzi: "过来", pinyin: "guòlái", hanViet: "quá lai", vietnamese: "qua đây, lại đây", hskLevel: 2, radical: "辶", strokeCount: 13, example: "再过来看个电影", exampleTranslation: "lại qua đây xem phim", tags: ["Bài 2", "Động từ"] },
      { id: "hsk2-l2-w17", hanzi: "北京大学", pinyin: "Běijīng Dàxué", hanViet: "Bắc Kinh Đại học", vietnamese: "Đại học Bắc Kinh", hskLevel: 2, radical: "大", strokeCount: 22, example: "去北京大学参观", exampleTranslation: "đến Đại học Bắc Kinh tham quan", tags: ["Bài 2", "Địa danh"] }
    ],
    exercises: [
      {
        id: "hsk2-l2-ex1",
        type: "fill_blank",
        question: "Chọn từ thích hợp biểu thị phương án tốt hơn: '车站有点儿远，我们 ______ 打车去吧。'",
        hanziPrompt: "车站有点儿远，我们 ______ 打车去吧。",
        pinyinPrompt: "Chēzhàn yǒudiǎnr yuǎn, wǒmen ______ dǎchē qù ba.",
        vietnamesePrompt: "Trạm xe hơi xa, chúng mình hay là đi taxi đi.",
        options: ["A. 还是", "B. 还有", "C. 可以", "D. 也要"],
        correctAnswer: "A. 还是",
        explanation: "Cấu trúc cố định '还是……吧' dùng để đưa ra sự lựa chọn hợp lý hơn.",
        grammarFocus: "Cấu trúc 还是……吧",
        audioText: "我们还是打车去吧。"
      }
    ]
  },

  // LESSON 3
  {
    lessonNumber: 3,
    titleHanzi: "我想去西安旅游",
    titlePinyin: "Wǒ xiǎng qù Xī'ān lǚyóu",
    titleVietnamese: "Tôi muốn đi du lịch Tây An",
    pageStart: 19,
    objectives: [
      "能听懂并询问事情的原因 (Hiểu và hỏi được nguyên nhân của sự việc).",
      "掌握结果补语的用法，能描述动作的结果 (Nắm vững cách dùng bổ ngữ kết quả, miêu tả kết quả của động tác: 做完, 做好, 想好...).",
      "掌握动词重叠的用法，能用来表达动作时间短、数量少、尝试等意义 (Nắm vững trùng điệp động từ: 想一想, 休息休息, 洗洗手...).",
      "了解西安的旅游景点 (Tìm hiểu về các danh lam thắng cảnh du lịch nổi tiếng ở Tây An)."
    ],
    texts: [
      {
        id: "hsk2-l3-t1",
        title: "课文 1: 在家门口 (Bài khóa 1: Ở cửa nhà)",
        context: "在家门口，刘明开门进到家里。(Ở cửa nhà, Lưu Minh mở cửa bước vào nhà).",
        lines: [
          { speaker: "王一雪", hanzi: "今天回来这么晚啊！", pinyin: "Jīntiān huílái zhème wǎn a!", vietnamese: "Hôm nay anh về muộn thế này à!" },
          { speaker: "刘明", hanzi: "工作太多了，下班的时候没做完。", pinyin: "Gōngzuò tài duō le, xiàbān de shíhou méi zuòwán.", vietnamese: "Công việc nhiều quá, lúc tan làm chưa làm xong." },
          { speaker: "王一雪", hanzi: "菜都做好了，过来吃饭吧。", pinyin: "Cài dōu zuòhǎo le, guòlái chī fàn ba.", vietnamese: "Cơm canh nấu xong hết cả rồi, anh qua ăn cơm đi." },
          { speaker: "刘明", hanzi: "我想休息一下，喝杯水。", pinyin: "Wǒ xiǎng xiūxi yíxià, hē bēi shuǐ.", vietnamese: "Anh muốn nghỉ ngơi một lát, uống cốc nước đã." },
          { speaker: "王一雪", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Vâng ạ." }
        ]
      },
      {
        id: "hsk2-l3-t2",
        title: "课文 2: 在客厅 (Bài khóa 2: Ở phòng khách)",
        context: "在客厅，刘明和王一雪在聊天儿。(Ở phòng khách, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
        lines: [
          { speaker: "刘明", hanzi: "我们找个时间去旅游，怎么样？", pinyin: "Wǒmen zhǎo gè shíjiān qù lǚyóu, zěnmeyàng?", vietnamese: "Chúng mình tìm thời gian đi du lịch đi, thấy thế nào?" },
          { speaker: "王一雪", hanzi: "好啊，我也很想一起出去玩。", pinyin: "Hǎo a, wǒ yě hěn xiǎng yìqǐ chūqù wán.", vietnamese: "Hay quá, em cũng rất muốn cùng nhau ra ngoài đi chơi." },
          { speaker: "刘明", hanzi: "你想去哪儿？", pinyin: "Nǐ xiǎng qù nǎr?", vietnamese: "Em muốn đi đâu?" },
          { speaker: "王一雪", hanzi: "我还没想好呢。", pinyin: "Wǒ hái méi xiǎnghǎo ne.", vietnamese: "Em vẫn chưa nghĩ xong nữa." },
          { speaker: "刘明", hanzi: "那你再想一想，你想好了，我来买票。", pinyin: "Nà nǐ zài xiǎng yi xiǎng, nǐ xiǎnghǎo le, wǒ lái mǎi piào.", vietnamese: "Thế em nghĩ thêm xem sao, em nghĩ xong rồi thì để anh mua vé." }
        ]
      },
      {
        id: "hsk2-l3-t3",
        title: "课文 3: 在客厅 (Bài khóa 3: Ở phòng khách)",
        context: "在客厅，刘明和王一雪在聊天儿。(Ở phòng khách, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
        lines: [
          { speaker: "刘明", hanzi: "吃个苹果吧，我都洗好了。", pinyin: "Chī gè píngguǒ ba, wǒ dōu xǐhǎo le.", vietnamese: "Ăn quả táo đi, anh rửa sạch cả rồi." },
          { speaker: "王一雪", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Vâng." },
          { speaker: "刘明", hanzi: "就在桌子上，你自己拿。", pinyin: "Jiù zài zhuōzi shang, nǐ zìjǐ ná.", vietnamese: "Ở ngay trên bàn đấy, em tự lấy nhé." },
          { speaker: "王一雪", hanzi: "我去洗洗手。对了，我们去西安旅游，怎么样？", pinyin: "Wǒ qù xǐxishǒu. Duìle, wǒmen qù Xī'ān lǚyóu, zěnmeyàng?", vietnamese: "Em đi rửa tay đã. Đúng rồi, chúng mình đi Tây An du lịch nhé, thấy sao anh?" },
          { speaker: "刘明", hanzi: "为什么想去西安？", pinyin: "Wèi shénme xiǎng qù Xī'ān?", vietnamese: "Sao lại muốn đi Tây An?" },
          { speaker: "王一雪", hanzi: "我看了看网上的介绍，这个时候去西安很不错！", pinyin: "Wǒ kànle kàn wǎngshang de jièshào, zhège shíhou qù Xī'ān hěn búcuò!", vietnamese: "Em vừa xem qua lời giới thiệu trên mạng, tầm này đi Tây An tuyệt lắm!" }
        ]
      },
      {
        id: "hsk2-l3-t4",
        title: "课文 4: 在家里 (Bài khóa 4: Ở nhà)",
        context: "在家里，王一雪给好朋友打电话。(Ở nhà, Vương Nhất Tuyết gọi điện thoại cho bạn thân).",
        lines: [
          { speaker: "王一雪", hanzi: "早上，刘明开车送孩子去学校，送完孩子回家后，医院就来电话了，让他回去上班。我觉得他这个月每天都很累，真想让他休息休息。", pinyin: "Zǎoshang, Liú Míng kāichē sòng háizi qù xuéxiào, sòngwán háizi huí jiā hòu, yīyuàn jiù lái diànhuà le, ràng tā huíqù shàngbān. Wǒ juéde tā zhège yuè měitiān dōu hěn lèi, zhēn xiǎng ràng tā xiūxi xiūxi.", vietnamese: "Buổi sáng, Lưu Minh lái xe đưa các con đi học, đưa con xong về tới nhà thì bệnh viện lại gọi điện bảo anh ấy quay lại làm việc. Em thấy tháng này ngày nào anh ấy cũng rất mệt, thật sự muốn anh ấy được nghỉ ngơi một chút." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l3-g1",
        title: "1. 结果补语 (Bổ ngữ kết quả: 完 / 好)",
        explanation: "Động từ hoặc tính từ đứng ngay sau động từ để biểu thị kết quả của động tác. Ví dụ: 做完 (làm xong), 做好 (làm xong chu đáo/sẵn sàng), 想好 (nghĩ kĩ/quyết định xong), 洗好 (rửa sạch sẽ). Dạng phủ định là thêm '没' trước động từ và bỏ '了'.",
        examples: [
          { hanzi: "工作太多了，下班的时候没做完。", pinyin: "Gōngzuò tài duō le, xiàbān de shíhou méi zuòwán.", vietnamese: "Công việc nhiều quá, lúc tan làm chưa làm xong." },
          { hanzi: "菜都做好了，过来吃饭吧。", pinyin: "Cài dōu zuòhǎo le, guòlái chī fàn ba.", vietnamese: "Cơm canh đã nấu xong cả rồi, qua ăn cơm đi." },
          { hanzi: "吃个苹果吧，我都洗好了。", pinyin: "Chī gè píngguǒ ba, wǒ dōu xǐhǎo le.", vietnamese: "Ăn táo đi, anh rửa sạch cả rồi." }
        ]
      },
      {
        id: "hsk2-l3-g2",
        title: "2. 动词重叠（1）（2）(Trùng điệp động từ)",
        explanation: "Động từ trùng điệp dùng để biểu thị động tác diễn ra trong thời gian ngắn, số lượng ít, mang tính thử nghiệm, giúp ngữ khí nhẹ nhàng, tự nhiên: 单音节 A(一)A (想一想, 看一看), 双音节 ABAB (休息休息, 介绍介绍), 离合词 AAB (洗洗手). Đã xảy ra: A了A (看了看, 想了想).",
        examples: [
          { hanzi: "那你再想一想，你想好了，我来买票。", pinyin: "Nà nǐ zài xiǎng yi xiǎng, nǐ xiǎnghǎo le, wǒ lái mǎi piào.", vietnamese: "Thế em nghĩ thêm xem sao, em nghĩ xong rồi thì để anh mua vé." },
          { hanzi: "我去洗洗手。", pinyin: "Wǒ qù xǐxishǒu.", vietnamese: "Em đi rửa tay đã." },
          { hanzi: "真想让他休息休息。", pinyin: "Zhēn xiǎng ràng tā xiūxi xiūxi.", vietnamese: "Thật sự muốn anh ấy được nghỉ ngơi một chút." },
          { hanzi: "我看了看网上的介绍。", pinyin: "Wǒ kànle kàn wǎngshang de jièshào.", vietnamese: "Em vừa xem qua lời giới thiệu trên mạng." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l3-w1", hanzi: "回来", pinyin: "huílái", hanViet: "hồi lai", vietnamese: "trở về, về đây", hskLevel: 2, radical: "囗", strokeCount: 6, example: "今天回来这么晚", exampleTranslation: "hôm nay về muộn thế", tags: ["Bài 3", "Động từ"] },
      { id: "hsk2-l3-w2", hanzi: "这么", pinyin: "zhème", hanViet: "giá ma", vietnamese: "thế này, như thế này", hskLevel: 2, radical: "辶", strokeCount: 7, example: "这么晚", exampleTranslation: "muộn thế này", tags: ["Bài 3", "Đại từ"] },
      { id: "hsk2-l3-w3", hanzi: "完", pinyin: "wán", hanViet: "hoàn", vietnamese: "xong, hết", hskLevel: 2, radical: "宀", strokeCount: 7, example: "没做完", exampleTranslation: "chưa làm xong", tags: ["Bài 3", "Động từ"] },
      { id: "hsk2-l3-w4", hanzi: "一起", pinyin: "yìqǐ", hanViet: "nhất khởi", vietnamese: "cùng nhau", hskLevel: 2, radical: "一", strokeCount: 11, example: "一起出去玩", exampleTranslation: "cùng nhau ra ngoài chơi", tags: ["Bài 3", "Phó từ"] },
      { id: "hsk2-l3-w5", hanzi: "出去", pinyin: "chūqù", hanViet: "xuất khứ", vietnamese: "ra ngoài", hskLevel: 2, radical: "凵", strokeCount: 5, example: "出去玩", exampleTranslation: "ra ngoài chơi", tags: ["Bài 3", "Động từ"] },
      { id: "hsk2-l3-w6", hanzi: "洗", pinyin: "xǐ", hanViet: "tẩy", vietnamese: "rửa, giặt", hskLevel: 2, radical: "氵", strokeCount: 9, example: "洗好了", exampleTranslation: "rửa sạch rồi", tags: ["Bài 3", "Động từ"] },
      { id: "hsk2-l3-w7", hanzi: "自己", pinyin: "zìjǐ", hanViet: "tự kỷ", vietnamese: "tự mình, bản thân", hskLevel: 2, radical: "自", strokeCount: 6, example: "你自己拿", exampleTranslation: "bạn tự lấy nhé", tags: ["Bài 3", "Đại từ"] },
      { id: "hsk2-l3-w8", hanzi: "拿", pinyin: "ná", hanViet: "nã", vietnamese: "cầm, lấy", hskLevel: 2, radical: "手", strokeCount: 10, example: "自己拿", exampleTranslation: "tự cầm lấy", tags: ["Bài 3", "Động từ"] },
      { id: "hsk2-l3-w9", hanzi: "手", pinyin: "shǒu", hanViet: "thủ", vietnamese: "tay, bàn tay", hskLevel: 2, radical: "手", strokeCount: 4, example: "洗洗手", exampleTranslation: "rửa tay", tags: ["Bài 3", "Danh từ"] },
      { id: "hsk2-l3-w10", hanzi: "为什么", pinyin: "wèi shénme", hanViet: "vi thập ma", vietnamese: "tại sao, vì sao", hskLevel: 2, radical: "丶", strokeCount: 4, example: "为什么想去西安？", exampleTranslation: "Sao lại muốn đi Tây An?", tags: ["Bài 3", "Đại từ"] },
      { id: "hsk2-l3-w11", hanzi: "不错", pinyin: "búcuò", hanViet: "bất thác", vietnamese: "rất tốt, khá tốt", hskLevel: 2, radical: "钅", strokeCount: 16, example: "很不错", exampleTranslation: "rất tuyệt", tags: ["Bài 3", "Tính từ"] },
      { id: "hsk2-l3-w12", hanzi: "送", pinyin: "sòng", hanViet: "tống", vietnamese: "tiễn, đưa, tặng", hskLevel: 2, radical: "辶", strokeCount: 9, example: "开车送孩子去学校", exampleTranslation: "lái xe đưa con đến trường", tags: ["Bài 3", "Động từ"] },
      { id: "hsk2-l3-w13", hanzi: "回去", pinyin: "huíqù", hanViet: "hồi khứ", vietnamese: "quay về, trở về", hskLevel: 2, radical: "囗", strokeCount: 6, example: "回去上班", exampleTranslation: "quay lại làm việc", tags: ["Bài 3", "Động từ"] },
      { id: "hsk2-l3-w14", hanzi: "每", pinyin: "měi", hanViet: "mỗi", vietnamese: "mỗi, từng", hskLevel: 2, radical: "母", strokeCount: 7, example: "每天都很累", exampleTranslation: "ngày nào cũng rất mệt", tags: ["Bài 3", "Đại từ"] },
      { id: "hsk2-l3-w15", hanzi: "累", pinyin: "lèi", hanViet: "luy", vietnamese: "mệt mỏi", hskLevel: 2, radical: "田", strokeCount: 11, example: "觉得很累", exampleTranslation: "cảm thấy rất mệt", tags: ["Bài 3", "Tính từ"] },
      { id: "hsk2-l3-w16", hanzi: "西安", pinyin: "Xī'ān", hanViet: "Tây An", vietnamese: "Tây An (cố đô lịch sử)", hskLevel: 2, radical: "西", strokeCount: 12, example: "去西安旅游", exampleTranslation: "đi du lịch Tây An", tags: ["Bài 3", "Địa danh"] }
    ],
    exercises: [
      {
        id: "hsk2-l3-ex1",
        type: "fill_blank",
        question: "Điền bổ ngữ kết quả thích hợp: '工作太忙了，下班的时候没做 ______。'",
        hanziPrompt: "工作太忙了，下班的时候没做 ______。",
        pinyinPrompt: "Gōngzuò tài máng le, xiàbān de shíhou méi zuò ______.",
        vietnamesePrompt: "Công việc bận quá, lúc tan làm chưa làm xong.",
        options: ["A. 完", "B. 懂", "C. 对", "D. 见"],
        correctAnswer: "A. 完",
        explanation: "Bổ ngữ kết quả '完' biểu thị hành động đã hoàn tất: 做完 (làm xong).",
        grammarFocus: "Bổ ngữ kết quả 完",
        audioText: "工作太忙了，下班的时候没做完。"
      }
    ]
  },

  // LESSON 4
  {
    lessonNumber: 4,
    titleHanzi: "你穿红色的很好看",
    titlePinyin: "Nǐ chuān hóngsè de hěn hǎokàn",
    titleVietnamese: "Bạn mặc màu đỏ rất đẹp",
    pageStart: 29,
    objectives: [
      "能听懂并询问过去的经历 (Hiểu và hỏi về trải nghiệm, kinh nghiệm trong quá khứ).",
      "能听懂并使用描述的方式指称事物 (Hiểu và dùng cụm chữ '的' để chỉ sự vật).",
      "掌握因果复句“因为……，所以……”的用法，能表达事情的原因和结果 (Nắm vững câu phức nguyên nhân - kết quả '因为……，所以……')."
    ],
    texts: [
      {
        id: "hsk2-l4-t1",
        title: "课文 1: 在商场门口 (Bài khóa 1: Ở cửa trung tâm thương mại)",
        context: "在商场门口，王一雪和刘小雪在聊天儿。(Ở cửa trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết trò chuyện).",
        lines: [
          { speaker: "刘小雪", hanzi: "妈妈，我们来过这家商场吗？", pinyin: "Māma, wǒmen láiguo zhè jiā shāngchǎng ma?", vietnamese: "Mẹ ơi, chúng ta đã từng đến trung tâm thương mại này chưa?" },
          { speaker: "王一雪", hanzi: "没来过，这是新开的。", pinyin: "Méi láiguo, zhè shì xīn kāi de.", vietnamese: "Chưa từng đến, đây là chỗ mới mở." },
          { speaker: "刘小雪", hanzi: "我们进去看看吧。", pinyin: "Wǒmen jìnqù kànkan ba.", vietnamese: "Chúng mình vào trong xem thử đi mẹ." },
          { speaker: "王一雪", hanzi: "好啊！你想买点儿什么？", pinyin: "Hǎo a! Nǐ xiǎng mǎi diǎnr shénme?", vietnamese: "Được chứ! Con muốn mua gì nào?" },
          { speaker: "刘小雪", hanzi: "我想买条裤子。", pinyin: "Wǒ xiǎng mǎi tiáo kùzi.", vietnamese: "Con muốn mua một chiếc quần dài." },
          { speaker: "王一雪", hanzi: "没问题。", pinyin: "Méi wèntí.", vietnamese: "Không vấn đề gì." }
        ]
      },
      {
        id: "hsk2-l4-t2",
        title: "课文 2: 在商场 (Bài khóa 2: Ở trung tâm thương mại)",
        context: "在商场，王一雪和刘小雪在看衣服。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết chọn quần áo).",
        lines: [
          { speaker: "刘小雪", hanzi: "妈妈，我想买这条白色的裤子。", pinyin: "Māma, wǒ xiǎng mǎi zhè tiáo báisè de kùzi.", vietnamese: "Mẹ ơi, con muốn mua chiếc quần màu trắng này." },
          { speaker: "王一雪", hanzi: "你有很多白色的衣服，为什么还买白色的？", pinyin: "Nǐ yǒu hěn duō báisè de yīfu, wèi shénme hái mǎi báisè de?", vietnamese: "Con có rất nhiều quần áo màu trắng rồi, sao lại mua màu trắng nữa?" },
          { speaker: "刘小雪", hanzi: "因为我喜欢白色啊！", pinyin: "Yīnwèi wǒ xǐhuan báisè a!", vietnamese: "Bởi vì con thích màu trắng mà mẹ!" },
          { speaker: "王一雪", hanzi: "我觉得这条白色的不太好看，你试试那条红色的吧。", pinyin: "Wǒ juéde zhè tiáo báisè de bú tài hǎokàn, nǐ shìshi nà tiáo hóngsè de ba.", vietnamese: "Mẹ thấy chiếc màu trắng này không được đẹp lắm, con thử chiếc màu đỏ kia xem sao." },
          { speaker: "刘小雪", hanzi: "我没穿过红色的，红色的好看吗？", pinyin: "Wǒ méi chuānguo hóngsè de, hóngsè de hǎokàn ma?", vietnamese: "Con chưa từng mặc màu đỏ, màu đỏ có đẹp không mẹ?" },
          { speaker: "王一雪", hanzi: "就是因为没穿过，所以要试试啊！", pinyin: "Jiù shì yīnwèi méi chuānguo, suǒyǐ yào shìshi a!", vietnamese: "Chính vì chưa từng mặc nên mới cần thử chứ!" }
        ]
      },
      {
        id: "hsk2-l4-t3",
        title: "课文 3: 在商场 (Bài khóa 3: Ở trung tâm thương mại)",
        context: "在商场，王一雪和刘小雪在看书包。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết chọn ba lô).",
        lines: [
          { speaker: "刘小雪", hanzi: "妈妈，我想买个新书包。", pinyin: "Māma, wǒ xiǎng mǎi gè xīn shūbāo.", vietnamese: "Mẹ ơi, con muốn mua một chiếc ba lô mới." },
          { speaker: "王一雪", hanzi: "好，那边卖书包，我们过去看看吧。", pinyin: "Hǎo, nàbian mài shūbāo, wǒmen guòqù kànkan ba.", vietnamese: "Được, đằng kia bán ba lô, chúng mình qua xem thử nhé." },
          { speaker: "刘小雪", hanzi: "这么多漂亮的书包！", pinyin: "Zhème duō piàoliang de shūbāo!", vietnamese: "Nhiều ba lô đẹp quá chừng!" },
          { speaker: "王一雪", hanzi: "红色的、绿色的、黑色的，你想买哪个？", pinyin: "Hóngsè de, lǜsè de, hēisè de, nǐ xiǎng mǎi nǎge?", vietnamese: "Cái màu đỏ, cái màu xanh lá, cái màu đen, con muốn mua cái nào?" },
          { speaker: "刘小雪", hanzi: "绿色的吧。", pinyin: "Lǜsè de ba.", vietnamese: "Cái màu xanh lá đi mẹ." },
          { speaker: "王一雪", hanzi: "不错，我也觉得绿色的更好看。", pinyin: "Búcuò, wǒ yě juéde lǜsè de gèng hǎokàn.", vietnamese: "Tốt đấy, mẹ cũng thấy cái màu xanh lá đẹp hơn." }
        ]
      },
      {
        id: "hsk2-l4-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
        context: "在房间，刘小雪在写日记。(Trong phòng, Lưu Tiểu Tuyết viết nhật ký).",
        lines: [
          { speaker: "刘小雪", hanzi: "我和妈妈去了一家商场。因为是新开的，所以这几天东西很便宜。商场里的衣服颜色很多。我没穿过红色的裤子，妈妈让我试了试，我觉得我穿红色的也很好看。", pinyin: "Wǒ hé māma qùle yì jiā shāngchǎng. Yīnwèi shì xīn kāi de, suǒyǐ zhè jǐ tiān dōngxi hěn piányi. Shāngchǎng li de yīfu yánsè hěn duō. Wǒ méi chuānguo hóngsè de kùzi, māma ràng wǒ shìleshì, wǒ juéde wǒ chuān hóngsè de yě hěn hǎokàn.", vietnamese: "Tôi cùng mẹ đến một trung tâm thương mại. Vì mới khai trương nên mấy hôm nay đồ đạc rất rẻ. Quần áo trong đó màu sắc rất đa dạng. Tôi chưa từng mặc quần màu đỏ bao giờ, mẹ bảo tôi thử một chút, tôi thấy mình mặc màu đỏ cũng rất đẹp." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l4-g1",
        title: "1. 动态助词“过” (Trợ từ động thái '过' biểu thị từng trải qua)",
        explanation: "Đứng sau động từ để biểu thị một hành động hoặc trải nghiệm đã từng xảy ra trong quá khứ nhưng không kéo dài đến hiện tại. Khẳng định: Động từ + 过. Phủ định: 没(有) + Động từ + 过.",
        examples: [
          { hanzi: "妈妈，我们来过这家商场吗？", pinyin: "Māma, wǒmen láiguo zhè jiā shāngchǎng ma?", vietnamese: "Mẹ ơi, chúng ta đã từng đến trung tâm thương mại này chưa?" },
          { hanzi: "我没穿过红色的裤子。", pinyin: "Wǒ méi chuānguo hóngsè de kùzi.", vietnamese: "Con chưa từng mặc quần màu đỏ." },
          { hanzi: "我吃过饺子，很好吃。", pinyin: "Wǒ chīguo jiǎozi, hěn hǎochī.", vietnamese: "Tôi đã từng ăn sủi cảo, rất ngon." }
        ]
      },
      {
        id: "hsk2-l4-g2",
        title: "2. 因果复句“因为……，所以……” (Câu phức 'Bởi vì... cho nên...')",
        explanation: "Biểu thị quan hệ nhân quả. '因为' dẫn ra nguyên nhân, '所以' dẫn ra kết quả. Có thể dùng đồng thời hoặc dùng riêng lẻ.",
        examples: [
          { hanzi: "就是因为没穿过，所以要试试啊！", pinyin: "Jiù shì yīnwèi méi chuānguo, suǒyǐ yào shìshi a!", vietnamese: "Chính vì chưa từng mặc nên mới cần thử chứ!" },
          { hanzi: "因为是新开的，所以这几天东西很便宜。", pinyin: "Yīnwèi shì xīn kāi de, suǒyǐ zhè jǐ tiān dōngxi hěn piányi.", vietnamese: "Bởi vì mới mở nên mấy ngày này đồ đạc rất rẻ." }
        ]
      },
      {
        id: "hsk2-l4-g3",
        title: "3. “的”字短语 (Cụm chữ '的')",
        explanation: "Trợ từ kết cấu '的' đặt sau tính từ, danh từ hoặc đại từ để tạo thành cụm danh từ tĩnh lược, dùng để chỉ người hoặc sự vật được nhắc đến trước đó: 红色的 (cái màu đỏ), 白色的 (cái màu trắng), 绿色的 (cái màu xanh lá).",
        examples: [
          { hanzi: "红色的、绿色的、黑色的，你想买哪个？", pinyin: "Hóngsè de, lǜsè de, hēisè de, nǐ xiǎng mǎi nǎge?", vietnamese: "Cái màu đỏ, cái màu xanh lá, cái màu đen, con muốn mua cái nào?" },
          { hanzi: "我也觉得绿色的更好看。", pinyin: "Wǒ yě juéde lǜsè de gèng hǎokàn.", vietnamese: "Mẹ cũng thấy cái màu xanh lá đẹp hơn." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l4-w1", hanzi: "过", pinyin: "guo", hanViet: "quá", vietnamese: "qua, từng (trợ từ)", hskLevel: 2, radical: "辶", strokeCount: 6, example: "来过这家商场", exampleTranslation: "đã từng đến trung tâm này", tags: ["Bài 4", "Trợ từ"] },
      { id: "hsk2-l4-w2", hanzi: "商场", pinyin: "shāngchǎng", hanViet: "thương trường", vietnamese: "trung tâm thương mại", hskLevel: 2, radical: "口", strokeCount: 17, example: "去商场买东西", exampleTranslation: "đến trung tâm thương mại mua sắm", tags: ["Bài 4", "Địa điểm"] },
      { id: "hsk2-l4-w3", hanzi: "进去", pinyin: "jìnqù", hanViet: "tiến khứ", vietnamese: "đi vào, vào trong", hskLevel: 2, radical: "辶", strokeCount: 12, example: "我们进去看看吧", exampleTranslation: "chúng mình vào xem thử đi", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w4", hanzi: "条", pinyin: "tiáo", hanViet: "điều", vietnamese: "chiếc, cái (lượng từ quần, cá, đường)", hskLevel: 2, radical: "木", strokeCount: 7, example: "买条裤子", exampleTranslation: "mua chiếc quần", tags: ["Bài 4", "Lượng từ"] },
      { id: "hsk2-l4-w5", hanzi: "裤子", pinyin: "kùzi", hanViet: "khố tử", vietnamese: "quần, quần dài", hskLevel: 2, radical: "衤", strokeCount: 15, example: "白色的裤子", exampleTranslation: "chiếc quần màu trắng", tags: ["Bài 4", "Trang phục"] },
      { id: "hsk2-l4-w6", hanzi: "白色", pinyin: "báisè", hanViet: "bạch sắc", vietnamese: "màu trắng", hskLevel: 2, radical: "白", strokeCount: 11, example: "喜欢白色", exampleTranslation: "thích màu trắng", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w7", hanzi: "因为", pinyin: "yīnwèi", hanViet: "nhân vi", vietnamese: "bởi vì", hskLevel: 2, radical: "囗", strokeCount: 10, example: "因为我喜欢白色", exampleTranslation: "bởi vì con thích màu trắng", tags: ["Bài 4", "Liên từ"] },
      { id: "hsk2-l4-w8", hanzi: "试", pinyin: "shì", hanViet: "thí", vietnamese: "thử", hskLevel: 2, radical: "讠", strokeCount: 8, example: "试了试", exampleTranslation: "đã thử", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w9", hanzi: "红色", pinyin: "hóngsè", hanViet: "hồng sắc", vietnamese: "màu đỏ", hskLevel: 2, radical: "纟", strokeCount: 12, example: "穿红色的很好看", exampleTranslation: "mặc màu đỏ rất đẹp", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w10", hanzi: "所以", pinyin: "suǒyǐ", hanViet: "sở dĩ", vietnamese: "cho nên, vì vậy", hskLevel: 2, radical: "户", strokeCount: 8, example: "所以要试试", exampleTranslation: "cho nên cần phải thử", tags: ["Bài 4", "Liên từ"] },
      { id: "hsk2-l4-w11", hanzi: "书包", pinyin: "shūbāo", hanViet: "thư bao", vietnamese: "ba lô, cặp sách", hskLevel: 2, radical: "勹", strokeCount: 9, example: "买个新书包", exampleTranslation: "mua chiếc cặp sách mới", tags: ["Bài 4", "Đồ dùng"] },
      { id: "hsk2-l4-w12", hanzi: "过去", pinyin: "guòqù", hanViet: "quá khứ", vietnamese: "đi qua, qua bên kia", hskLevel: 2, radical: "辶", strokeCount: 11, example: "我们过去看看", exampleTranslation: "chúng ta qua đó xem xem", tags: ["Bài 4", "Động từ"] },
      { id: "hsk2-l4-w13", hanzi: "绿色", pinyin: "lǜsè", hanViet: "lục sắc", vietnamese: "màu xanh lá", hskLevel: 2, radical: "纟", strokeCount: 17, example: "绿色的书包", exampleTranslation: "chiếc cặp màu xanh lá", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w14", hanzi: "黑色", pinyin: "hēisè", hanViet: "hắc sắc", vietnamese: "màu đen", hskLevel: 2, radical: "黑", strokeCount: 18, example: "黑色的鞋子", exampleTranslation: "chiếc giày màu đen", tags: ["Bài 4", "Màu sắc"] },
      { id: "hsk2-l4-w15", hanzi: "更", pinyin: "gèng", hanViet: "canh", vietnamese: "càng, hơn", hskLevel: 2, radical: "曰", strokeCount: 7, example: "更好看", exampleTranslation: "đẹp hơn", tags: ["Bài 4", "Phó từ"] },
      { id: "hsk2-l4-w16", hanzi: "颜色", pinyin: "yánsè", hanViet: "nhan sắc", vietnamese: "màu sắc", hskLevel: 2, radical: "色", strokeCount: 18, example: "颜色很多", exampleTranslation: "màu sắc rất nhiều", tags: ["Bài 4", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l4-ex1",
        type: "fill_blank",
        question: "Điền trợ từ động thái biểu thị kinh nghiệm quá khứ: '妈妈，我们来 ______ 这家商场吗？'",
        hanziPrompt: "妈妈，我们来 ______ 这家商场吗？",
        pinyinPrompt: "Māma, wǒmen lái ______ zhè jiā shāngchǎng ma?",
        vietnamesePrompt: "Mẹ ơi, chúng ta đã từng đến trung tâm thương mại này chưa?",
        options: ["A. 过", "B. 了", "C. 着", "D. 去"],
        correctAnswer: "A. 过",
        explanation: "Trợ từ động thái '过' đứng sau động từ biểu thị hành động từng xảy ra trong quá khứ.",
        grammarFocus: "Trợ từ động thái 过",
        audioText: "妈妈，我们来过这家商场吗？"
      }
    ]
  },
  // LESSON 5
  {
    lessonNumber: 5,
    titleHanzi: "第一次去中国朋友家",
    titlePinyin: "Dì-yī cì qù Zhōngguó péngyou jiā",
    titleVietnamese: "Lần đầu tiên đến nhà bạn Trung Quốc",
    pageStart: 37,
    objectives: [
      "能听懂并使用趋向补语表达动作的方向 (Hiểu và dùng bổ ngữ xu hướng biểu thị phương hướng của động tác).",
      "掌握固定格式“都……了”，能表达已经或者达到的意思 (Nắm vững cấu trúc cố định '都……了' biểu thị đã hoặc đạt tới).",
      "了解中国人见面时的称呼方式 (Tìm hiểu cách xưng hô khi người Trung Quốc gặp mặt)."
    ],
    texts: [
      {
        id: "hsk2-l5-t1",
        title: "课文 1: 在宾馆楼下 (Bài khóa 1: Ở dưới tầng khách sạn)",
        context: "在宾馆楼下，安妮给白家月打电话。(Ở dưới tầng khách sạn, Annie gọi điện thoại cho Bạch Gia Nguyệt).",
        lines: [
          { speaker: "安妮", hanzi: "家月，快下来吧，第一次去中国朋友家，别晚了。", pinyin: "Jiāyuè, kuài xiàlái ba, dì-yī cì qù Zhōngguó péngyou jiā, bié wǎn le.", vietnamese: "Gia Nguyệt, mau xuống đi thôi, lần đầu tiên đến nhà bạn Trung Quốc chơi, đừng để muộn nhé." },
          { speaker: "白家月", hanzi: "还有时间，你上来吧。", pinyin: "Hái yǒu shíjiān, nǐ shànglái ba.", vietnamese: "Vẫn còn thời gian mà, bạn lên đây đi." },
          { speaker: "安妮", hanzi: "我不上去了，就在下面等你。", pinyin: "Wǒ bú shàngqù le, jiù zài xiàmiàn děng nǐ.", vietnamese: "Mình không lên đâu, mình đứng dưới này đợi bạn." },
          { speaker: "白家月", hanzi: "那我一会儿就下去。", pinyin: "Nà wǒ yíhuìr jiù xiàqù.", vietnamese: "Thế lát nữa mình xuống ngay." },
          { speaker: "安妮", hanzi: "你快点儿吧。", pinyin: "Nǐ kuài diǎnr ba.", vietnamese: "Bạn nhanh lên một chút nhé." },
          { speaker: "白家月", hanzi: "没事，一雪姐说11点前到就可以。", pinyin: "Méishì, Yīxué jiě shuō shíyī diǎn qián dào jiù kěyǐ.", vietnamese: "Không sao đâu, chị Nhất Tuyết bảo trước 11 giờ đến là được rồi." }
        ]
      },
      {
        id: "hsk2-l5-t2",
        title: "课文 2: 在王一雪家 (Bài khóa 2: Tại nhà Vương Nhất Tuyết)",
        context: "在王一雪家，白家月和安妮来做客。(Tại nhà Vương Nhất Tuyết, Bạch Gia Nguyệt và Annie đến làm khách).",
        lines: [
          { speaker: "王一雪", hanzi: "家月、安妮，快进来！我给你们介绍一下，这是孩子们的爷爷、奶奶。", pinyin: "Jiāyuè, Ānnī, kuài jìnlái! Wǒ gěi nǐmen jièshào yíxià, zhè shì háizimen de yéye, nǎinai.", vietnamese: "Gia Nguyệt, Annie, mau vào đi! Chị giới thiệu với các em một chút, đây là ông nội, bà nội của bọn trẻ." },
          { speaker: "白家月 & 安妮", hanzi: "你们好！", pinyin: "Nǐmen hǎo!", vietnamese: "Cháu chào hai bác ạ!" },
          { speaker: "王一雪", hanzi: "爸、妈，这是白家月，这是安妮。她们都是一飞的学生。", pinyin: "Bà, mā, zhè shì Bái Jiāyuè, zhè shì Ānnī. Tāmen dōu shì Yīfēi de xuésheng.", vietnamese: "Bố, mẹ, đây là Bạch Gia Nguyệt, còn đây là Annie. Hai em ấy đều là học sinh của Nhất Phi." },
          { speaker: "刘爷爷", hanzi: "家月、安妮，你们好！", pinyin: "Jiāyuè, Ānnī, nǐmen hǎo!", vietnamese: "Chào Gia Nguyệt, chào Annie nhé!" },
          { speaker: "白家月", hanzi: "这是送你们的礼物。", pinyin: "Zhè shì sòng nǐmen de lǐwù.", vietnamese: "Đây là quà chúng cháu biếu hai bác ạ." },
          { speaker: "刘爷爷", hanzi: "你们太客气了，还拿这么多礼物来！", pinyin: "Nǐmen tài kèqi le, hái ná zhème duō lǐwù lái!", vietnamese: "Các cháu khách khí quá, lại còn mang nhiều quà đến thế này!" },
          { speaker: "白家月", hanzi: "一雪姐，这是给孩子们准备的礼物。", pinyin: "Yīxué jiě, zhè shì gěi háizimen zhǔnbèi de lǐwù.", vietnamese: "Chị Nhất Tuyết ơi, đây là quà chúng em chuẩn bị cho các bé ạ." },
          { speaker: "王一雪", hanzi: "谢谢！你们别客气，快坐吧！", pinyin: "Xièxie! Nǐmen bié kèqi, kuài zuò ba!", vietnamese: "Cảm ơn các em nhé! Các em đừng khách sáo, mau ngồi xuống đi!" }
        ]
      },
      {
        id: "hsk2-l5-t3",
        title: "课文 3: 在王一雪家 (Bài khóa 3: Tại nhà Vương Nhất Tuyết)",
        context: "在王一雪家，白家月和安妮在吃饭。(Tại nhà Vương Nhất Tuyết, Bạch Gia Nguyệt và Annie đang ăn cơm).",
        lines: [
          { speaker: "王一雪", hanzi: "都12点了，我们吃饭吧。", pinyin: "Dōu shí'èr diǎn le, wǒmen chī fàn ba.", vietnamese: "Đã 12 giờ rồi, chúng ta ăn cơm thôi nào." },
          { speaker: "白家月", hanzi: "这么多好吃的，您太客气了！", pinyin: "Zhème duō hǎochī de, nín tài kèqi le!", vietnamese: "Nhiều món ngon thế này, chị chu đáo và khách sáo quá ạ!" },
          { speaker: "王一雪", hanzi: "都是我自己做的，你们多吃点儿。", pinyin: "Dōu shì wǒ zìjǐ zuò de, nǐmen duō chī diǎnr.", vietnamese: "Đều là chị tự tay nấu đấy, các em ăn nhiều vào nhé." },
          { speaker: "白家月", hanzi: "奶茶也很好喝，是您自己做的吗？", pinyin: "Nǎichá yě hěn hǎohē, shì nín zìjǐ zuò de ma?", vietnamese: "Trà sữa cũng ngon tuyệt, là chị tự pha đấy ạ?" },
          { speaker: "王一雪", hanzi: "不是，奶茶是爷爷买的。", pinyin: "Bú shì, nǎichá shì yéye mǎi de.", vietnamese: "Không phải đâu, trà sữa là ông nội mua đấy." },
          { speaker: "白家月", hanzi: "在哪儿买的？我还没喝过这么好喝的奶茶。", pinyin: "Zài nǎr mǎi de? Wǒ hái méi hēguo zhème hǎohē de nǎichá.", vietnamese: "Mua ở đâu vậy ạ? Em chưa từng được uống trà sữa nào ngon đến thế." },
          { speaker: "王一雪", hanzi: "就在前边的商场，吃完饭你们可以跟我去看看。", pinyin: "Jiù zài qiánbian de shāngchǎng, chīwán fàn nǐmen kěyǐ gēn wǒ qù kànkan.", vietnamese: "Ngay trung tâm thương mại phía trước thôi, ăn xong các em có thể đi cùng chị ra xem." }
        ]
      },
      {
        id: "hsk2-l5-t4",
        title: "课文 4: 在宾馆 (Bài khóa 4: Tại khách sạn)",
        context: "在宾馆，白家月给李文发信息。(Ở khách sạn, Bạch Gia Nguyệt gửi tin nhắn cho Lý Văn).",
        lines: [
          { speaker: "白家月", hanzi: "回国前一天，我们去一雪姐家了。到她家的时候，饭菜都做好了。刘爷爷还准备了奶茶。因为吃了太多东西，我们吃完饭是走回酒店的。", pinyin: "Huí guó qián yì tiān, wǒmen qù Yīxué jiě jiā le. Dào tā jiā de shíhou, fàncài dōu zuòhǎo le. Liú yéye hái zhǔnbèile nǎichá. Yīnwèi chīle tài duō dōngxi, wǒmen chīwán fàn shì zǒuhuí jiǔdiàn de.", vietnamese: "Một ngày trước khi về nước, chúng mình đã đến nhà chị Nhất Tuyết chơi. Lúc đến nhà chị ấy, cơm canh đã được nấu xong tinh tươm rồi. Ông nội Lưu còn chuẩn bị cả trà sữa nữa. Vì ăn quá nhiều đồ ngon, nên ăn cơm xong bọn mình đã đi bộ về khách sạn." }
        ]
      }
    ],
    grammarPoints: [
      {
        title: "简单趋向补语 (1) Bổ ngữ xu hướng đơn (1)",
        explanation: "Cấu trúc cơ bản: Động từ + 来 / 去. Dùng '来' khi động tác hướng về phía người nói, dùng '去' khi động tác rời xa phía người nói. Thường dùng với các động từ: 上, 下, 进, 出, 回, 过, 起.",
        examples: [
          { hanzi: "我不上去了，就在下面等你。", pinyin: "Wǒ bú shàngqù le, jiù zài xiàmiàn děng nǐ.", vietnamese: "Mình không lên đâu, mình ở dưới này đợi bạn (người nói ở dưới)." },
          { hanzi: "家月到下边了，你下去接她吧。", pinyin: "Jiāyuè dào xiàbian le, nǐ xiàqù jiē tā ba.", vietnamese: "Gia Nguyệt xuống dưới rồi, bạn xuống đón bạn ấy đi (người nói ở trên)." },
          { hanzi: "今天早上5点她就起来了。", pinyin: "Jīntiān zǎoshang wǔ diǎn tā jiù qǐlái le.", vietnamese: "Sáng sớm hôm nay 5 giờ cô ấy đã thức dậy rồi." }
        ]
      },
      {
        title: "简单趋向补语 (2) Vị trí tân ngữ trong bổ ngữ xu hướng",
        explanation: "Khi động từ vừa có bổ ngữ xu hướng vừa có tân ngữ: Nếu tân ngữ là nơi chốn thì bắt buộc đặt TRƯỚC '来/去' (Động từ + Nơi chốn + 来/去); nếu tân ngữ là sự vật/đồ vật thì có thể đặt trước hoặc sau '来/去'.",
        examples: [
          { hanzi: "上课了，你们快进教室来吧。", pinyin: "Shàngkè le, nǐmen kuài jìn jiàoshì lái ba.", vietnamese: "Vào học rồi, các bạn mau vào lớp đi (nơi chốn: 教室 đặt trước 来)." },
          { hanzi: "你们太客气了，还拿这么多礼物来！", pinyin: "Nǐmen tài kèqi le, hái ná zhème duō lǐwù lái!", vietnamese: "Các bạn khách sáo quá, lại còn mang nhiều quà đến thế!" },
          { hanzi: "爸爸今天买回了很多水果。", pinyin: "Bàba jīntiān mǎihuíle hěn duō shuǐguǒ.", vietnamese: "Hôm nay bố mua về rất nhiều hoa quả." }
        ]
      },
      {
        title: "固定格式“都……了” (Cấu trúc cố định 'Đã... rồi')",
        explanation: "Biểu thị sự việc đã diễn ra hoặc đạt đến một mức độ/thời gian nào đó, thường mang ngữ khí nhấn mạnh hoặc giục giã, nhắc nhở.",
        examples: [
          { hanzi: "都12点了，我们吃饭吧。", pinyin: "Dōu shí'èr diǎn le, wǒmen chī fàn ba.", vietnamese: "Đã 12 giờ rồi, chúng ta ăn cơm thôi nào." },
          { hanzi: "都8点半了，你还不起床吗？", pinyin: "Dōu bā diǎn bàn le, nǐ hái bù qǐchuáng ma?", vietnamese: "Đã 8 rưỡi rồi, con còn chưa dậy à?" },
          { hanzi: "我都去过北京了，不想再去了。", pinyin: "Wǒ dōu qùguo Běijīng le, bù xiǎng zài qù le.", vietnamese: "Tôi đã đi Bắc Kinh rồi, không muốn đi nữa đâu." }
        ]
      }
    ],
    vocabulary: [
      { hanzi: "快", pinyin: "kuài", vietnamese: "nhanh, mau chóng", type: "adv./adj." },
      { hanzi: "下来", pinyin: "xiàlái", vietnamese: "xuống đây", type: "v." },
      { hanzi: "上来", pinyin: "shànglái", vietnamese: "lên đây", type: "v." },
      { hanzi: "上去", pinyin: "shàngqù", vietnamese: "lên đó", type: "v." },
      { hanzi: "下面", pinyin: "xiàmiàn", vietnamese: "phía dưới, tầng dưới", type: "n." },
      { hanzi: "面", pinyin: "miàn", vietnamese: "mặt, phía, hướng", type: "suf." },
      { hanzi: "等", pinyin: "děng", vietnamese: "chờ, đợi", type: "v." },
      { hanzi: "一会儿", pinyin: "yíhuìr", vietnamese: "một lát, chốc lát", type: "num.-m." },
      { hanzi: "下去", pinyin: "xiàqù", vietnamese: "xuống dưới đó", type: "v." },
      { hanzi: "进来", pinyin: "jìnlái", vietnamese: "vào đây", type: "v." },
      { hanzi: "爷爷", pinyin: "yéye", vietnamese: "ông nội", type: "n." },
      { hanzi: "奶奶", pinyin: "nǎinai", vietnamese: "bà nội", type: "n." },
      { hanzi: "礼物", pinyin: "lǐwù", vietnamese: "quà tặng, món quà", type: "n." },
      { hanzi: "准备", pinyin: "zhǔnbèi", vietnamese: "chuẩn bị", type: "v." },
      { hanzi: "奶茶", pinyin: "nǎichá", vietnamese: "trà sữa", type: "n." },
      { hanzi: "跟", pinyin: "gēn", vietnamese: "cùng, với", type: "prep./conj." },
      { hanzi: "走", pinyin: "zǒu", vietnamese: "đi bộ, đi", type: "v." },
      { hanzi: "酒店", pinyin: "jiǔdiàn", vietnamese: "khách sạn", type: "n." }
    ],
    exercises: [
      {
        question: "用“下来 / 上去 / 进来 / 走”选词填空 (Chọn từ điền vào chỗ trống):",
        options: ["快下来吧", "我不上去了", "快进来", "走回酒店"],
        answer: "快下来吧"
      },
      {
        question: "根据课文，白家月和安妮回国前一天去谁家做客了？",
        options: ["王一雪家", "王一飞家", "李文家", "刘医生医院"],
        answer: "王一雪家"
      },
      {
        question: "在王一雪家，是谁给客人们准备了美味的奶茶？",
        options: ["刘爷爷", "王一雪", "刘奶奶", "白家月"],
        answer: "刘爷爷"
      }
    ]
  },
  // LESSON 6
  {
    lessonNumber: 6,
    titleHanzi: "小雪，生日快乐！",
    titlePinyin: "Xiǎoxuě, shēngrì kuàilè!",
    titleVietnamese: "Tiểu Tuyết, chúc mừng sinh nhật!",
    pageStart: 46,
    objectives: [
      "能听懂并使用形容词重叠形式描述性质或状态 (Hiểu và dùng hình thức trùng điệp của tính từ để miêu tả tính chất, trạng thái).",
      "掌握固定短语“什么的”的用法，能表达列举未尽的意思 (Nắm vững cách dùng đoản ngữ cố định '什么的' để biểu thị liệt kê chưa hết).",
      "掌握结构助词“地”的用法，能描述动作进行的方式或状态 (Nắm vững cách dùng trợ từ kết cấu '地' để miêu tả cách thức, trạng thái của hành động).",
      "了解中国人庆祝生日的习俗 (Tìm hiểu phong tục mừng sinh nhật của người Trung Quốc)."
    ],
    warmUp: [
      {
        type: "match",
        question: "给下面的词语选择对应的图片 (Nối từ ngữ với hình ảnh tương ứng):",
        options: [
          { pinyin: "yú", hanzi: "鱼", vietnamese: "cá" },
          { pinyin: "huàbǐ", hanzi: "画笔", vietnamese: "bút vẽ" },
          { pinyin: "chuáng", hanzi: "床", vietnamese: "giường" },
          { pinyin: "kuàilè", hanzi: "快乐", vietnamese: "vui vẻ, hạnh phúc" }
        ]
      },
      {
        type: "actions",
        question: "给下面的短语选择对应的图片 (Nối cụm từ với hình ảnh tương ứng):",
        options: [
          { pinyin: "huà huà", hanzi: "画画", vietnamese: "vẽ tranh" },
          { pinyin: "guò shēngrì", hanzi: "过生日", vietnamese: "đón sinh nhật" },
          { pinyin: "hěn shūfu", hanzi: "很舒服", vietnamese: "rất thoải mái" },
          { pinyin: "dǎkāi lǐwù", hanzi: "打开礼物", vietnamese: "mở quà" }
        ]
      }
    ],
    texts: [
      {
        id: "hsk2-l6-t1",
        title: "课文 1: 在家里 (Bài khóa 1: Ở nhà)",
        context: "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
        lines: [
          { speaker: "王一雪", hanzi: "明天就是女儿的生日了。", pinyin: "Míngtiān jiù shì nǚ'ér de shēngrì le.", vietnamese: "Ngày mai là sinh nhật con gái rồi đấy." },
          { speaker: "刘明", hanzi: "你不说，我还真忘了。我们给她准备个什么礼物呢？", pinyin: "Nǐ bù shuō, wǒ hái zhēn wàng le. Wǒmen gěi tā zhǔnbèi gè shénme lǐwù ne?", vietnamese: "Em không nhắc thì anh suýt quên mất. Chúng mình chuẩn bị món quà gì cho con bé nhỉ?" },
          { speaker: "王一雪", hanzi: "她喜欢画画，你觉得画笔怎么样？", pinyin: "Tā xǐhuan huà huà, nǐ juéde huàbǐ zěnmeyàng?", vietnamese: "Con thích vẽ tranh, anh thấy tặng bút vẽ được không?" },
          { speaker: "刘明", hanzi: "就送画笔吧！", pinyin: "Jiù sòng huàbǐ ba!", vietnamese: "Tặng bút vẽ đi em!" },
          { speaker: "王一雪", hanzi: "那我明天上午就去买。", pinyin: "Nà wǒ míngtiān shàngwǔ jiù qù mǎi.", vietnamese: "Thế sáng mai em sẽ đi mua." },
          { speaker: "刘明", hanzi: "好的！我再给她买个大大的生日蛋糕。", pinyin: "Hǎo de! Wǒ zài gěi tā mǎi gè dàdà de shēngrì dàngāo.", vietnamese: "Được rồi! Anh sẽ mua thêm cho con một chiếc bánh sinh nhật thật to." }
        ]
      },
      {
        id: "hsk2-l6-t2",
        title: "课文 2: 在客厅 (Bài khóa 2: Ở phòng khách)",
        context: "在客厅，刘明一家人在聊天儿。(Ở phòng khách, cả nhà Lưu Minh trò chuyện mở quà).",
        lines: [
          { speaker: "刘明", hanzi: "小雪，生日快乐！", pinyin: "Xiǎoxuě, shēngrì kuàilè!", vietnamese: "Tiểu Tuyết, sinh nhật vui vẻ con nhé!" },
          { speaker: "刘小明", hanzi: "姐姐，生日快乐！", pinyin: "Jiějie, shēngrì kuàilè!", vietnamese: "Chị ơi, chúc mừng sinh nhật chị!" },
          { speaker: "王一雪", hanzi: "小雪，这是爸爸、妈妈送你的礼物。", pinyin: "Xiǎoxuě, zhè shì bàba, māma sòng nǐ de lǐwù.", vietnamese: "Tiểu Tuyết, đây là quà bố mẹ tặng con." },
          { speaker: "刘明", hanzi: "你打开看看喜欢不喜欢。", pinyin: "Nǐ dǎkāi kànkan xǐhuan bù xǐhuan.", vietnamese: "Con mở ra xem có thích không nào." },
          { speaker: "刘小雪", hanzi: "画笔！我很喜欢！", pinyin: "Huàbǐ! Wǒ hěn xǐhuan!", vietnamese: "Bút vẽ màu! Con thích lắm ạ!" },
          { speaker: "王一雪", hanzi: "那你想画点儿什么？", pinyin: "Nà nǐ xiǎng huà diǎnr shénme?", vietnamese: "Thế con muốn vẽ gì nào?" },
          { speaker: "刘小雪", hanzi: "画我们的家！有爸爸、妈妈、弟弟，还有黑色的狗、白色的猫什么的。", pinyin: "Huà wǒmen de jiā! Yǒu bàba, māma, dìdi, hái yǒu hēisè de gǒu, báisè de māo shénmede.", vietnamese: "Vẽ ngôi nhà của chúng mình ạ! Có bố, mẹ, em trai, và cả chú chó đen, chú mèo trắng nữa." },
          { speaker: "刘小明", hanzi: "那我要画一个穿白色衣服的姐姐。", pinyin: "Nà wǒ yào huà yí gè chuān báisè yīfu de jiějie.", vietnamese: "Thế em muốn vẽ chị gái mặc chiếc áo màu trắng." }
        ]
      },
      {
        id: "hsk2-l6-t3",
        title: "课文 3: 在客厅 (Bài khóa 3: Ở phòng khách)",
        context: "在客厅，刘明一家人在给刘小雪过生日。(Ở phòng khách, cả nhà Lưu Minh chúc mừng sinh nhật Lưu Tiểu Tuyết).",
        lines: [
          { speaker: "刘明", hanzi: "小雪，看看今天有什么好吃的。", pinyin: "Xiǎoxuě, kànkan jīntiān yǒu shénme hǎochī de.", vietnamese: "Tiểu Tuyết, xem hôm nay có món gì ngon nào." },
          { speaker: "刘小雪", hanzi: "长长的面条儿，大大的蛋糕。", pinyin: "Chángcháng de miàntiáor, dàdà de dàngāo.", vietnamese: "Bát mì trường thọ thật dài, chiếc bánh kem thật to." },
          { speaker: "刘明", hanzi: "你看，还有鱼啊肉啊什么的，都是你喜欢吃的。", pinyin: "Nǐ kàn, hái yǒu yú a ròu a shénmede, dōu shì nǐ xǐhuan chī de.", vietnamese: "Con xem, còn có cả cá cả thịt này, đều là món con thích ăn nhất." },
          { speaker: "刘小雪", hanzi: "谢谢爸爸、妈妈！", pinyin: "Xièxie bàba, māma!", vietnamese: "Con cảm ơn bố, cảm ơn mẹ!" },
          { speaker: "王一雪", hanzi: "快去叫弟弟过来吃饭吧，吃完饭我们还要出去玩呢。", pinyin: "Kuài qù jiào dìdi guòlái chī fàn ba, chīwán fàn wǒmen hái yào chūqù wán ne.", vietnamese: "Con mau gọi em trai qua ăn cơm đi, ăn xong cả nhà mình còn đi chơi nữa đấy." },
          { speaker: "刘小雪", hanzi: "过生日真好啊！", pinyin: "Guò shēngrì zhēn hǎo a!", vietnamese: "Được đón sinh nhật thích thật đấy ạ!" },
          { speaker: "王一雪", hanzi: "是的，过生日就要吃好吃的，还要高高兴兴地玩。", pinyin: "Shì de, guò shēngrì jiù yào chī hǎochī de, hái yào gāogāoxìngxìng de wán.", vietnamese: "Đúng vậy, sinh nhật là phải ăn món ngon, và phải vui chơi thật là thỏa thích." }
        ]
      },
      {
        id: "hsk2-l6-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
        context: "在房间，王一雪在写日记。(Trong phòng ngủ, Vương Nhất Tuyết viết nhật ký).",
        lines: [
          { speaker: "王一雪", hanzi: "今天是女儿的生日。我们买了蛋糕，做了面条儿，还做了鱼啊肉啊什么的。吃完晚饭，一家人去看了个电影。回家后，孩子们早早地就上床了。明天不上学，他们说要舒舒服服地睡一觉，让我们晚点儿叫他们起床。这是很忙、很累，但很快乐的一天。", pinyin: "Jīntiān shì nǚ'ér de shēngrì. Wǒmen mǎile dàngāo, zuòle miàntiáor, hái zuòle yú a ròu a shénmede. Chīwán wǎnfàn, yì jiā rén qù kànle gè diànyǐng. Huí jiā hòu, háizimen zǎozǎo de jiù shàng chuáng le. Míngtiān bú shàngxué, tāmen shuō yào shūshūfúfú de shuì yí jiào, ràng wǒmen wǎn diǎnr jiào tāmen qǐchuáng. Zhè shì hěn máng, hěn lèi, dàn hěn kuàilè de yì tiān.", vietnamese: "Hôm nay là sinh nhật của con gái. Bố mẹ đã mua bánh kem, nấu mì, lại còn làm cả cá và thịt nữa. Ăn tối xong, cả nhà cùng nhau đi xem một bộ phim. Về đến nhà, bọn trẻ đã lên giường đi ngủ từ rất sớm. Ngày mai không phải đi học, chúng bảo muốn ngủ một giấc thật thoải mái, dặn bố mẹ hãy gọi chúng dậy muộn một chút. Đây quả là một ngày bận rộn, thấm mệt, nhưng ngập tràn niềm vui." }
        ]
      }
    ],
    grammarPoints: [
      {
        title: "形容词重叠 (Hình thức trùng điệp của tính từ)",
        explanation: "Tính từ đơn âm tiết lặp lại dạng 'AA' (大大的, 小小的, 长长的), tính từ hai âm tiết lặp lại dạng 'AABB' (高高兴兴, 漂漂亮亮, 舒舒服服). Dùng để nhấn mạnh mức độ sâu hơn hoặc biểu thị tình cảm yêu thích, trìu mến.",
        examples: [
          { hanzi: "我再给她买个大大的生日蛋糕。", pinyin: "Wǒ zài gěi tā mǎi gè dàdà de shēngrì dàngāo.", vietnamese: "Anh sẽ mua thêm cho con một chiếc bánh sinh nhật thật to." },
          { hanzi: "这只猫小小的，真让人喜欢。", pinyin: "Zhè zhī māo xiǎoxiǎo de, zhēn ràng rén xǐhuan.", vietnamese: "Chú mèo này bé xíu xiu, thật khiến người ta yêu thích." },
          { hanzi: "一雪的女儿每天都漂漂亮亮的。", pinyin: "Yīxué de nǚ'ér měitiān dōu piàopiaoliàngliàng de.", vietnamese: "Con gái của Nhất Tuyết ngày nào cũng xinh xắn rạng ngời." }
        ]
      },
      {
        title: "固定短语“什么的” (Đoản ngữ cố định 'Gì gì đó / Vân vân')",
        explanation: "Đặt sau các danh từ hoặc cụm từ được liệt kê để biểu thị các sự vật cùng loại chưa được kể hết (tương đương 'vân vân', 'những thứ như thế').",
        examples: [
          { hanzi: "画我们的家！有爸爸、妈妈、弟弟，还有黑色的狗、白色的猫什么的。", pinyin: "Huà wǒmen de jiā! Yǒu bàba, māma, dìdi, hái yǒu hēisè de gǒu, báisè de māo shénmede.", vietnamese: "Vẽ ngôi nhà chúng mình! Có bố, mẹ, em trai, và cả chó đen, mèo trắng này nọ." },
          { hanzi: "桌子上有电脑、杯子、书和画笔什么的。", pinyin: "Zhuōzi shang yǒu diànnǎo, bēizi, shū hé huàbǐ shénmede.", vietnamese: "Trên bàn có máy tính, cốc nước, sách và bút vẽ vân vân." }
        ]
      },
      {
        title: "结构助词“地” (Trợ từ kết cấu '地')",
        explanation: "Đứng giữa tính từ (hoặc ngữ tính từ) và động từ: [Tính từ / Cụm tính từ + 地 + Động từ] để miêu tả phương thức, trạng thái tiến hành của hành động.",
        examples: [
          { hanzi: "过生日就要吃好吃的，还要高高兴兴地玩。", pinyin: "Guò shēngrì jiù yào chī hǎochī de, hái yào gāogāoxìngxìng de wán.", vietnamese: "Sinh nhật là phải ăn ngon, và còn phải vui chơi thật là vui vẻ." },
          { hanzi: "回家后，孩子们早早地就上床了。", pinyin: "Huí jiā hòu, háizimen zǎozǎo de jiù shàng chuáng le.", vietnamese: "Về đến nhà, các con đã lên giường ngủ từ rất sớm." },
          { hanzi: "他们说要舒舒服服地睡一觉。", pinyin: "Tāmen shuō yào shūshūfúfú de shuì yí jiào.", vietnamese: "Chúng nói muốn ngủ một giấc thật là thoải mái." }
        ]
      }
    ],
    vocabulary: [
      { hanzi: "生日", pinyin: "shēngrì", vietnamese: "sinh nhật", type: "n." },
      { hanzi: "忘", pinyin: "wàng", vietnamese: "quên", type: "v." },
      { hanzi: "画", pinyin: "huà", vietnamese: "vẽ, bức tranh", type: "v./n." },
      { hanzi: "画笔", pinyin: "huàbǐ", vietnamese: "bút vẽ, cọ vẽ màu", type: "n." },
      { hanzi: "蛋糕", pinyin: "dàngāo", vietnamese: "bánh kem, bánh gato", type: "n." },
      { hanzi: "快乐", pinyin: "kuàilè", vietnamese: "vui vẻ, hạnh phúc", type: "adj." },
      { hanzi: "打开", pinyin: "dǎkāi", vietnamese: "mở ra", type: "v." },
      { hanzi: "长", pinyin: "cháng", vietnamese: "dài", type: "adj." },
      { hanzi: "鱼", pinyin: "yú", vietnamese: "cá", type: "n." },
      { hanzi: "肉", pinyin: "ròu", vietnamese: "thịt", type: "n." },
      { hanzi: "过", pinyin: "guò", vietnamese: "đón (sinh nhật, tết), trải qua", type: "v." },
      { hanzi: "地", pinyin: "de", vietnamese: "trợ từ kết cấu (dùng trước động từ)", type: "part." },
      { hanzi: "床", pinyin: "chuáng", vietnamese: "giường", type: "n." },
      { hanzi: "舒服", pinyin: "shūfu", vietnamese: "thoải mái, dễ chịu", type: "adj." }
    ],
    exercises: [
      {
        question: "用“忘 / 快乐 / 打开 / 画 / 床”选词填空 (Chọn từ điền vào chỗ trống):",
        options: ["祝你生日快乐", "别忘了买画笔", "打开礼物看看", "早早地上床睡觉"],
        answer: "祝你生日快乐"
      },
      {
        question: "爸爸妈妈送给刘小雪什么生日礼物？",
        options: ["画笔", "衣服", "书包", "手机"],
        answer: "画笔"
      },
      {
        question: "中国人过生日的时候一般吃什么寓意长寿？",
        options: ["长长的面条儿", "蛋糕", "鱼", "苹果"],
        answer: "长长的面条儿"
      }
    ]
  },
  // LESSON 7
  {
    lessonNumber: 7,
    titleHanzi: "他篮球打得很好",
    titlePinyin: "Tā lánqiú dǎ de hěn hǎo",
    titleVietnamese: "Cậu ấy chơi bóng rổ rất cừ",
    pageStart: 56,
    objectives: [
      "能听懂并描述动作进行的状态 (Hiểu và miêu tả được trạng thái tiến hành của động tác).",
      "掌握紧缩复句“一……就……”的用法，能表达动作接连发生的意思 (Nắm vững câu phức rút gọn '一……就……' biểu thị các hành động diễn ra liên tiếp).",
      "能谈论常做的运动 (Có thể trò chuyện, trao đổi về các môn thể thao thường chơi)."
    ],
    warmUp: [
      {
        type: "match",
        question: "给下面的词语选择对应的图片 (Nối từ ngữ với hình ảnh tương ứng):",
        options: [
          { pinyin: "pǎobù", hanzi: "跑步", vietnamese: "chạy bộ" },
          { pinyin: "lánqiú", hanzi: "篮球", vietnamese: "bóng rổ" },
          { pinyin: "yóuyǒng", hanzi: "游泳", vietnamese: "bơi lội" },
          { pinyin: "zúqiú", hanzi: "足球", vietnamese: "bóng đá" }
        ]
      },
      {
        type: "actions",
        question: "说说你做完下列事情后马上会做什么 (Nói xem sau khi làm xong việc này bạn sẽ làm gì ngay):",
        options: [
          { pinyin: "chīwán zǎofàn", hanzi: "吃完早饭", vietnamese: "ăn xong bữa sáng" },
          { pinyin: "xiàkè", hanzi: "下课", vietnamese: "tan học" },
          { pinyin: "huí jiā", hanzi: "回家", vietnamese: "về nhà" }
        ]
      }
    ],
    texts: [
      {
        id: "hsk2-l7-t1",
        title: "课文 1: 在教室 (Bài khóa 1: Ở trong lớp học)",
        context: "在教室，安妮和陈天中在聊天儿。(Trong lớp học, Annie và Trần Thiên Trung trò chuyện).",
        lines: [
          { speaker: "陈天中", hanzi: "安妮，你是什么时候从北京回来的？", pinyin: "Ānnī, nǐ shì shénme shíhou cóng Běijīng huílái de?", vietnamese: "Annie, cậu từ Bắc Kinh về lúc nào thế?" },
          { speaker: "安妮", hanzi: "昨天下午。天中，你怎么一下课就往外跑？", pinyin: "Zuótiān xiàwǔ. Tiānzhōng, nǐ zěnme yí xiàkè jiù wǎng wài pǎo?", vietnamese: "Chiều hôm qua. Thiên Trung, sao cậu vừa tan học là chạy tót ra ngoài thế?" },
          { speaker: "陈天中", hanzi: "我跟同学说好了，一起去打篮球。", pinyin: "Wǒ gēn tóngxué shuōhǎo le, yìqǐ qù dǎ lánqiú.", vietnamese: "Tớ hẹn với các bạn cùng lớp rồi, cùng nhau đi chơi bóng rổ." },
          { speaker: "安妮", hanzi: "我也想跟你们一起玩。", pinyin: "Wǒ yě xiǎng gēn nǐmen yìqǐ wán.", vietnamese: "Tớ cũng muốn đi chơi cùng các cậu." },
          { speaker: "陈天中", hanzi: "没问题，走吧。", pinyin: "Méi wèntí, zǒu ba.", vietnamese: "Không vấn đề gì, đi thôi nào." }
        ]
      },
      {
        id: "hsk2-l7-t2",
        title: "课文 2: 在校园 (Bài khóa 2: Trong khuôn viên trường)",
        context: "在校园，安妮和陈天中边走边聊。(Trong khuôn viên trường, Annie và Trần Thiên Trung vừa đi vừa trò chuyện).",
        lines: [
          { speaker: "安妮", hanzi: "天中，你是不是很喜欢打篮球？", pinyin: "Tiānzhōng, nǐ shì bu shì hěn xǐhuan dǎ lánqiú?", vietnamese: "Thiên Trung, có phải cậu thích chơi bóng rổ lắm đúng không?" },
          { speaker: "陈天中", hanzi: "没错。", pinyin: "Méi cuò.", vietnamese: "Đúng thế đấy." },
          { speaker: "安妮", hanzi: "你还喜欢什么运动？", pinyin: "Nǐ hái xǐhuan shénme yùndòng?", vietnamese: "Cậu còn thích môn thể thao nào nữa?" },
          { speaker: "陈天中", hanzi: "我还喜欢踢足球，一到星期天就跟朋友们去踢球。", pinyin: "Wǒ hái xǐhuan tī zúqiú, yí dào Xīngqītiān jiù gēn péngyoumen qù tī qiú.", vietnamese: "Tớ còn thích đá bóng nữa, cứ hễ đến chủ nhật là đi đá bóng với bạn bè." },
          { speaker: "安妮", hanzi: "你踢得怎么样？", pinyin: "Nǐ tī de zěnmeyàng?", vietnamese: "Cậu đá bóng thế nào?" },
          { speaker: "陈天中", hanzi: "我踢得还可以。", pinyin: "Wǒ tī de hái kěyǐ.", vietnamese: "Tớ đá cũng tạm ổn." }
        ]
      },
      {
        id: "hsk2-l7-t3",
        title: "课文 3: 在校园 (Bài khóa 3: Trong khuôn viên trường)",
        context: "在校园，安妮和陈天中边走边聊。(Trong khuôn viên trường, Annie và Trần Thiên Trung vừa đi vừa trò chuyện).",
        lines: [
          { speaker: "陈天中", hanzi: "你篮球打得怎么样？", pinyin: "Nǐ lánqiú dǎ de zěnmeyàng?", vietnamese: "Cậu chơi bóng rổ thế nào?" },
          { speaker: "安妮", hanzi: "打得还可以。", pinyin: "Dǎ de hái kěyǐ.", vietnamese: "Chơi cũng tạm được." },
          { speaker: "陈天中", hanzi: "跑步呢？你跑得快不快？", pinyin: "Pǎobù ne? Nǐ pǎo de kuài bu kuài?", vietnamese: "Thế còn chạy bộ? Cậu chạy có nhanh không?" },
          { speaker: "安妮", hanzi: "我跑得不快，也不太喜欢跑步。", pinyin: "Wǒ pǎo de bú kuài, yě bú tài xǐhuan pǎobù.", vietnamese: "Tớ chạy không nhanh, cũng chẳng thích chạy bộ lắm." },
          { speaker: "陈天中", hanzi: "那你喜欢游泳吗？", pinyin: "Nà nǐ xǐhuan yóuyǒng ma?", vietnamese: "Thế cậu có thích bơi lội không?" },
          { speaker: "安妮", hanzi: "喜欢，但我游泳游得不快。", pinyin: "Xǐhuan, dàn wǒ yóuyǒng yóu de bú kuài.", vietnamese: "Thích chứ, nhưng tớ bơi không được nhanh." }
        ]
      },
      {
        id: "hsk2-l7-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng ký túc xá)",
        context: "在房间，陈天中在写日记。(Trong phòng, Trần Thiên Trung viết nhật ký).",
        lines: [
          { speaker: "陈天中", hanzi: "我的爱好是运动。从上小学开始，我每天都跟爸爸去运动。现在我篮球打得很好，足球踢得不错，游泳游得也很快。我一有时间就去运动。", pinyin: "Wǒ de àihào shì yùndòng. Cóng shàng xiǎoxué kāishǐ, wǒ měi tiān dōu gēn bàba qù yùndòng. Xiànzài wǒ lánqiú dǎ de hěn hǎo, zúqiú tī de búcuò, yóuyǒng yóu de yě hěn kuài. Wǒ yí yǒu shíjiān jiù qù yùndòng.", vietnamese: "Sở thích của tôi là thể thao. Từ khi bắt đầu học tiểu học, ngày nào tôi cũng cùng bố đi rèn luyện thân thể. Hiện giờ tôi chơi bóng rổ rất cừ, đá bóng khá cừ, bơi cũng rất nhanh. Hễ có thời gian rảnh là tôi lại đi chơi thể thao." }
        ]
      }
    ],
    grammarPoints: [
      {
        title: "紧缩复句“一……就……” (Câu phức rút gọn 'Hễ... là... / Vừa... đã...')",
        explanation: "Biểu thị hành động thứ hai diễn ra ngay tiếp sau hành động thứ nhất; cũng có thể biểu thị hành động thứ nhất là điều kiện, nguyên nhân, hành động thứ hai là kết quả. Cấu trúc: [Chủ ngữ + 一 + Động từ 1 + 就 + Động từ 2].",
        examples: [
          { hanzi: "你怎么一下课就往外跑？", pinyin: "Nǐ zěnme yí xiàkè jiù wǎng wài pǎo?", vietnamese: "Sao cậu vừa tan học là chạy tót ra ngoài thế?" },
          { hanzi: "我一到家，妈妈就打来电话了。", pinyin: "Wǒ yí dào jiā, māma jiù dǎlai diànhuà le.", vietnamese: "Tôi vừa về đến nhà là mẹ đã gọi điện tới rồi." },
          { hanzi: "一到星期六，陈天中就跟同学去打篮球。", pinyin: "Yí dào Xīngqīliù, Chén Tiānzhōng jiù gēn tóngxué qù dǎ lánqiú.", vietnamese: "Cứ đến thứ bảy là Trần Thiên Trung lại đi chơi bóng rổ với bạn học." }
        ]
      },
      {
        title: "状态补语 (1) Bổ ngữ trạng thái (1)",
        explanation: "Bổ ngữ trạng thái đứng sau động từ để miêu tả, đánh giá kết quả hoặc mức độ của hành động. Cấu trúc cơ bản: [Động từ + 得 + Cụm tính từ]. Phủ định: [Động từ + 得 + 不 + Tính từ]. Nghi vấn: [Động từ + 得 + Tính từ + 不 + Tính từ] hoặc [Động từ + 得 + 怎么样].",
        examples: [
          { hanzi: "我踢得还可以。", pinyin: "Wǒ tī de hái kěyǐ.", vietnamese: "Tớ đá bóng cũng tạm được." },
          { hanzi: "白家月跑得不快。", pinyin: "Bái Jiāyuè pǎo de bú kuài.", vietnamese: "Bạch Gia Nguyệt chạy không nhanh." },
          { hanzi: "你跑得快不快？", pinyin: "Nǐ pǎo de kuài bu kuài?", vietnamese: "Cậu chạy có nhanh không?" }
        ]
      },
      {
        title: "状态补语 (2) Bổ ngữ trạng thái khi động từ mang tân ngữ hoặc là từ ly hợp",
        explanation: "Khi động từ là từ ly hợp hoặc mang tân ngữ: Bắt buộc lặp lại động từ [Động từ + Tân ngữ + Động từ + 得 + Bổ ngữ], hoặc đưa tân ngữ lên trước động từ [Tân ngữ + Động từ + 得 + Bổ ngữ].",
        examples: [
          { hanzi: "我游泳游得不快。", pinyin: "Wǒ yóuyǒng yóu de bú kuài.", vietnamese: "Tôi bơi lội bơi không được nhanh (lặp lại động từ 游)." },
          { hanzi: "你篮球打得怎么样？", pinyin: "Nǐ lánqiú dǎ de zěnmeyàng?", vietnamese: "Cậu chơi bóng rổ thế nào (đưa tân ngữ 篮球 lên trước 打)?" },
          { hanzi: "白家月写汉字写得很好看。", pinyin: "Bái Jiāyuè xiě hànzì xiě de hěn hǎokàn.", vietnamese: "Bạch Gia Nguyệt viết chữ Hán viết rất đẹp mắt." }
        ]
      }
    ],
    vocabulary: [
      { hanzi: "从", pinyin: "cóng", vietnamese: "từ (địa điểm, thời gian)", type: "prep." },
      { hanzi: "往", pinyin: "wǎng", vietnamese: "hướng về, đi về phía", type: "prep./v." },
      { hanzi: "跑", pinyin: "pǎo", vietnamese: "chạy", type: "v." },
      { hanzi: "打", pinyin: "dǎ", vietnamese: "chơi (bóng rổ, bóng bàn), đánh", type: "v." },
      { hanzi: "篮球", pinyin: "lánqiú", vietnamese: "bóng rổ", type: "n." },
      { hanzi: "运动", pinyin: "yùndòng", vietnamese: "thể thao, vận động", type: "n./v." },
      { hanzi: "踢", pinyin: "tī", vietnamese: "đá", type: "v." },
      { hanzi: "足球", pinyin: "zúqiú", vietnamese: "bóng đá", type: "n." },
      { hanzi: "球", pinyin: "qiú", vietnamese: "quả bóng", type: "n." },
      { hanzi: "得", pinyin: "de", vietnamese: "trợ từ kết cấu (dùng sau động từ dẫn ra bổ ngữ trạng thái)", type: "part." },
      { hanzi: "跑步", pinyin: "pǎobù", vietnamese: "chạy bộ", type: "v." },
      { hanzi: "游泳", pinyin: "yóuyǒng", vietnamese: "bơi lội", type: "v." },
      { hanzi: "游", pinyin: "yóu", vietnamese: "bơi", type: "v." },
      { hanzi: "爱好", pinyin: "àihào", vietnamese: "sở thích", type: "n./v." },
      { hanzi: "开始", pinyin: "kāishǐ", vietnamese: "bắt đầu", type: "v./n." }
    ],
    exercises: [
      {
        question: "用“从 / 运动 / 跑步 / 开始 / 游泳”选词填空 (Chọn từ điền vào chỗ trống):",
        options: ["一有时间就去运动", "你跑得快不快", "从8岁开始学中文", "游泳游得很快"],
        answer: "一有时间就去运动"
      },
      {
        question: "陈天中一到星期天就去跟朋友们做什么？",
        options: ["踢足球", "看电影", "游泳", "买东西"],
        answer: "踢足球"
      },
      {
        question: "陈天中从什么时候开始每天跟爸爸去运动？",
        options: ["上小学开始", "上中学开始", "上大学开始", "工作以后"],
        answer: "上小学开始"
      }
    ]
  },


  // LESSON 8
  {
    lessonNumber: 8,
    titleHanzi: "虽然你忘了，但是我记得",
    titlePinyin: "Suīrán nǐ wàng le, dànshì wǒ jìde",
    titleVietnamese: "Tuy em quên rồi, nhưng anh vẫn nhớ",
    pageStart: 65,
    objectives: [
      "Nắm vững câu phức chuyển ngoặt biểu thị sự nhượng bộ và đối lập: '虽然……，但是……' (Tuy rằng... nhưng mà...).",
      "Sử dụng thành thạo câu so sánh cơ bản với '比' (A 比 B + Tính từ / Tân ngữ) trong sinh hoạt hàng ngày.",
      "Vận dụng từ chỉ vị trí, phương hướng '左边 (bên trái)', '右边 (bên phải)' và từ vựng mua sắm, chọn lựa."
    ],
    texts: [
      {
        id: "hsk2-l8-t1",
        title: "课文 1: 在商场 (Bài khóa 1: Ở trung tâm thương mại)",
        context: "在商场，王一雪和刘明在购物。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Minh đang mua sắm).",
        lines: [
          { speaker: "王一雪", hanzi: "你看，这两块手表怎么样？", pinyin: "Nǐ kàn, zhè liǎng kuài shǒubiǎo zěnmeyàng?", vietnamese: "Anh nhìn xem, hai chiếc đồng hồ này thế nào?" },
          { speaker: "刘明", hanzi: "都不错！", pinyin: "Dōu búcuò!", vietnamese: "Đều đẹp cả!" },
          { speaker: "王一雪", hanzi: "我喜欢左边这个。", pinyin: "Wǒ xǐhuan zuǒbian zhège.", vietnamese: "Em thích cái bên trái này." },
          { speaker: "刘明", hanzi: "我也觉得左边的比右边的好看。", pinyin: "Wǒ yě juéde zuǒbian de bǐ yòubian de hǎokàn.", vietnamese: "Anh cũng thấy cái bên trái đẹp hơn cái bên phải." },
          { speaker: "王一雪", hanzi: "你看看要多少钱！", pinyin: "Nǐ kànkan yào duōshao qián!", vietnamese: "Anh xem thử giá bao nhiêu tiền kìa!" },
          { speaker: "刘明", hanzi: "真不便宜！八千八！", pinyin: "Zhēn bù piányi! Bā qiān bā!", vietnamese: "Thật chẳng rẻ chút nào! Tận tám nghìn tám trăm tệ!" }
        ]
      },
      {
        id: "hsk2-l8-t2",
        title: "课文 2: 在电影院外 (Bài khóa 2: Ngoài rạp chiếu phim)",
        context: "在电影院外，刘明和王一雪在商量看电影。(Trước rạp chiếu phim, Lưu Minh và Vương Nhất Tuyết bàn nhau xem phim gì).",
        lines: [
          { speaker: "刘明", hanzi: "今天有不少电影，我们看个电影吧。", pinyin: "Jīntiān yǒu bù shǎo diànyǐng, wǒmen kàn gè diànyǐng ba.", vietnamese: "Hôm nay có khá nhiều phim, chúng ta xem một bộ phim đi." },
          { speaker: "王一雪", hanzi: "好啊！我们看哪个？", pinyin: "Hǎo a! Wǒmen kàn nǎge?", vietnamese: "Được thôi! Mình xem phim nào đây anh?" },
          { speaker: "刘明", hanzi: "我记得你喜欢看爱情片，我们看那个爱情片，怎么样？", pinyin: "Wǒ jìde nǐ xǐhuan kàn àiqíngpiān, wǒmen kàn nàge àiqíngpiān, zěnmeyàng?", vietnamese: "Anh nhớ em thích xem phim tình cảm, chúng ta xem bộ phim tình cảm kia thế nào?" },
          { speaker: "王一雪", hanzi: "还是看这个吧，我看网上说这个电影比那个爱情片更有意思。", pinyin: "Háishi kàn zhège ba, wǒ kàn wǎngshang shuō zhège diànyǐng bǐ nàge àiqíngpiān gèng yǒu yìsi.", vietnamese: "Hay là xem phim này đi, em thấy trên mạng bảo phim này hay hơn phim tình cảm kia đấy." },
          { speaker: "刘明", hanzi: "好。我去买票。", pinyin: "Hǎo. Wǒ qù mǎi piào.", vietnamese: "Được, để anh đi mua vé." },
          { speaker: "王一雪", hanzi: "到网上买吧，网上买比在这里买便宜。", pinyin: "Dào wǎngshang mǎi ba, wǎngshang mǎi bǐ zài zhèlǐ mǎi piányi.", vietnamese: "Lên mạng mua đi anh, mua trên mạng rẻ hơn mua ở đây đấy." }
        ]
      },
      {
        id: "hsk2-l8-t3",
        title: "课文 3: 在饭馆 (Bài khóa 3: Ở nhà hàng)",
        context: "在饭馆，刘明给王一雪庆祝生日。(Ở nhà hàng ấm cúng, Lưu Minh bất ngờ tặng đồng hồ chúc mừng sinh nhật Vương Nhất Tuyết).",
        lines: [
          { speaker: "刘明", hanzi: "您好！就要这几个菜吧，谢谢！", pinyin: "Nínhǎo! Jiù yào zhè jǐ gè cài ba, xièxie!", vietnamese: "Chào anh/chị! Chúng tôi lấy mấy món này nhé, cảm ơn!" },
          { speaker: "王一雪", hanzi: "怎么点这么多菜？", pinyin: "Zěnme diǎn zhème duō cài?", vietnamese: "Sao anh lại gọi nhiều món thế này?" },
          { speaker: "刘明", hanzi: "你想想，今天是几月几号？", pinyin: "Nǐ xiǎngxiang, jīntiān shì jǐ yuè jǐ hào?", vietnamese: "Em nghĩ xem, hôm nay là ngày mấy tháng mấy nào?" },
          { speaker: "王一雪", hanzi: "8月27号。啊！我的生日！", pinyin: "Bā yuè èrshíqī hào. À! Wǒ de shēngrì!", vietnamese: "Ngày 27 tháng 8. A! Sinh nhật của em!" },
          { speaker: "刘明", hanzi: "生日快乐！虽然你忘了，但是我记得。看看这是什么？", pinyin: "Shēngrì kuàilè! Suīrán nǐ wàng le, dànshì wǒ jìde. Kànkan zhè shì shénme?", vietnamese: "Sinh nhật vui vẻ em nhé! Tuy em quên rồi, nhưng anh vẫn luôn nhớ. Em xem đây là cái gì này?" },
          { speaker: "王一雪", hanzi: "手表！吃饭、看电影、买手表，今天花了不少钱吧？", pinyin: "Shǒubiǎo! Chī fàn, kàn diànyǐng, mǎi shǒubiǎo, jīntiān huāle bù shǎo qián ba?", vietnamese: "Đồng hồ đeo tay! Ăn cơm, xem phim, lại còn mua đồng hồ, hôm nay tiêu tốn không ít tiền rồi nhỉ anh?" },
          { speaker: "刘明", hanzi: "虽然花了一些钱，但是我们过了一个快乐的生日。", pinyin: "Suīrán huāle yìxiē qián, dànshì wǒmen guòle yí gè kuàilè de shēngrì.", vietnamese: "Tuy tốn một chút tiền, nhưng chúng ta đã đón một ngày sinh nhật thật hạnh phúc." }
        ]
      },
      {
        id: "hsk2-l8-t4",
        title: "课文 4: 小语讲述 (Bài khóa 4: Tiểu Ngữ kể chuyện)",
        context: "小语在讲述王一雪和刘明的一天。(Trợ lý Tiểu Ngữ kể lại một ngày đầy bất ngờ và ấm áp của vợ chồng Lưu Minh - Vương Nhất Tuyết).",
        lines: [
          { speaker: "小语", hanzi: "虽然妻子忘了今天是自己的生日，但是丈夫记得。丈夫请妻子去饭馆吃饭、去电影院看电影，还给妻子买了一块非常漂亮的手表。妻子觉得今天很快乐。", pinyin: "Suīrán qīzi wàngle jīntiān shì zìjǐ de shēngrì, dànshì zhàngfu jìde. Zhàngfu qǐng qīzi qù fànguǎn chī fàn, qù diànyǐngyuàn kàn diànyǐng, hái gěi qīzi mǎile yí kuài fēicháng piàoliang de shǒubiǎo. Qīzi juéde jīntiān hěn kuàilè.", vietnamese: "Tuy người vợ quên mất hôm nay là sinh nhật mình, nhưng người chồng vẫn nhớ. Chồng mời vợ đi nhà hàng ăn cơm, đi rạp chiếu phim xem phim, lại còn mua tặng vợ một chiếc đồng hồ đeo tay rất đẹp. Người vợ cảm thấy hôm nay vô cùng vui vẻ và hạnh phúc." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l8-g1",
        title: "1. Câu so sánh với chữ '比' (A 比 B + Tính từ)",
        explanation: "Cấu trúc cơ bản dùng để so sánh giữa hai đối tượng: A 比 B + Tính từ (A hơn B về mặt nào đó). Để nhấn mạnh 'hơn nữa/hơn rất nhiều', có thể thêm '更' trước tính từ hoặc thêm '得多/多了' phía sau.",
        examples: [
          { hanzi: "左边的比右边的好看。", pinyin: "Zuǒbian de bǐ yòubian de hǎokàn.", vietnamese: "Cái bên trái đẹp hơn cái bên phải." },
          { hanzi: "网上买比在这里买便宜。", pinyin: "Wǎngshang mǎi bǐ zài zhèlǐ mǎi piányi.", vietnamese: "Mua trên mạng rẻ hơn mua ở đây." },
          { hanzi: "这个电影比那个爱情片更有意思。", pinyin: "Zhège diànyǐng bǐ nàge àiqíngpiān gèng yǒu yìsi.", vietnamese: "Bộ phim này hay hơn bộ phim tình cảm kia nhiều." }
        ]
      },
      {
        id: "hsk2-l8-g2",
        title: "2. Câu phức chuyển ngoặt: '虽然……，但是……' (Tuy rằng... nhưng...)",
        explanation: "Dùng để nối hai phân câu biểu thị quan hệ nhượng bộ và chuyển ý ngược lại. '虽然' (suīrán) đứng ở phân câu đầu nêu sự thật/nhượng bộ, '但是' (dànshì) đứng ở phân câu sau đưa ra kết quả hoặc nhận định trái ngược.",
        examples: [
          { hanzi: "虽然你忘了，但是我记得。", pinyin: "Suīrán nǐ wàng le, dànshì wǒ jìde.", vietnamese: "Tuy em quên rồi, nhưng anh vẫn nhớ." },
          { hanzi: "虽然花了一些钱，但是我们过了一个快乐的生日。", pinyin: "Suīrán huāle yìxiē qián, dànshì wǒmen guòle yí gè kuàilè de shēngrì.", vietnamese: "Tuy có tốn một ít tiền, nhưng chúng ta đã có một ngày sinh nhật thật hạnh phúc." },
          { hanzi: "外边下雪了，但是不太冷。", pinyin: "Wàibian xiàxuě le, dànshì bú tài lěng.", vietnamese: "Bên ngoài có tuyết rơi, nhưng không lạnh lắm." }
        ]
      },
      {
        id: "hsk2-l8-g3",
        title: "3. Cách dùng '请' với nghĩa thiết đãi / mời khách",
        explanation: "Trong khẩu ngữ, '请' ngoài nghĩa lịch sự 'xin mời', còn có nghĩa là 'bao/mời khách' (chi trả chi phí cho người khác đi ăn, uống trà hoặc xem phim).",
        examples: [
          { hanzi: "丈夫请妻子去饭馆吃饭。", pinyin: "Zhàngfu qǐng qīzi qù fànguǎn chī fàn.", vietnamese: "Người chồng mời vợ đi ăn cơm ở nhà hàng." },
          { hanzi: "今天我请客！", pinyin: "Jīntiān wǒ qǐngkè!", vietnamese: "Hôm nay tôi bao/tôi đãi khách nhé!" }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l8-w1", hanzi: "手表", pinyin: "shǒubiǎo", hanViet: "thủ biểu", vietnamese: "đồng hồ đeo tay", hskLevel: 2, radical: "手", strokeCount: 14, example: "一块手表", exampleTranslation: "một chiếc đồng hồ", tags: ["Bài 8", "Danh từ"] },
      { id: "hsk2-l8-w2", hanzi: "左边", pinyin: "zuǒbian", hanViet: "tả biên", vietnamese: "bên trái", hskLevel: 2, radical: "工", strokeCount: 10, example: "左边那个", exampleTranslation: "cái ở bên trái", tags: ["Bài 8", "Danh từ chỉ phương vị"] },
      { id: "hsk2-l8-w3", hanzi: "比", pinyin: "bǐ", hanViet: "tỷ", vietnamese: "so với, hơn", hskLevel: 2, radical: "比", strokeCount: 4, example: "A 比 B 好", exampleTranslation: "A tốt hơn B", tags: ["Bài 8", "Giới từ"] },
      { id: "hsk2-l8-w4", hanzi: "右边", pinyin: "yòubian", hanViet: "hữu biên", vietnamese: "bên phải", hskLevel: 2, radical: "口", strokeCount: 10, example: "在右边", exampleTranslation: "ở phía bên phải", tags: ["Bài 8", "Danh từ chỉ phương vị"] },
      { id: "hsk2-l8-w5", hanzi: "记得", pinyin: "jìde", hanViet: "ký đắc", vietnamese: "nhớ, còn nhớ", hskLevel: 2, radical: "讠", strokeCount: 20, example: "我还记得", exampleTranslation: "tôi vẫn nhớ", tags: ["Bài 8", "Động từ"] },
      { id: "hsk2-l8-w6", hanzi: "爱情片", pinyin: "àiqíngpiān", hanViet: "ái tình phiến", vietnamese: "phim tình cảm lãng mạn", hskLevel: 2, radical: "片", strokeCount: 25, example: "喜欢看爱情片", exampleTranslation: "thích xem phim tình cảm", tags: ["Bài 8", "Danh từ"] },
      { id: "hsk2-l8-w7", hanzi: "有意思", pinyin: "yǒu yìsi", hanViet: "hữu ý tư", vietnamese: "thú vị, hay ho, có ý nghĩa", hskLevel: 2, radical: "月", strokeCount: 28, example: "这个电影很有意思", exampleTranslation: "bộ phim này rất thú vị", tags: ["Bài 8", "Tính từ"] },
      { id: "hsk2-l8-w8", hanzi: "点", pinyin: "diǎn", hanViet: "điểm", vietnamese: "gọi (món ăn)", hskLevel: 2, radical: "灬", strokeCount: 9, example: "点菜", exampleTranslation: "gọi món", tags: ["Bài 8", "Động từ"] },
      { id: "hsk2-l8-w9", hanzi: "虽然", pinyin: "suīrán", hanViet: "tuy nhiên", vietnamese: "tuy rằng, mặc dù", hskLevel: 2, radical: "虫", strokeCount: 21, example: "虽然累，但是高兴", exampleTranslation: "tuy mệt nhưng vui", tags: ["Bài 8", "Liên từ"] },
      { id: "hsk2-l8-w10", hanzi: "但是", pinyin: "dànshì", hanViet: "đãn thị", vietnamese: "nhưng, nhưng mà", hskLevel: 2, radical: "亻", strokeCount: 16, example: "但是我知道", exampleTranslation: "nhưng tôi biết", tags: ["Bài 8", "Liên từ"] },
      { id: "hsk2-l8-w11", hanzi: "花", pinyin: "huā", hanViet: "hoa", vietnamese: "tiêu tốn (tiền, thời gian)", hskLevel: 2, radical: "艹", strokeCount: 7, example: "花钱 / 花时间", exampleTranslation: "tiêu tiền / tốn thời gian", tags: ["Bài 8", "Động từ"] },
      { id: "hsk2-l8-w12", hanzi: "妻子", pinyin: "qīzi", hanViet: "thê tử", vietnamese: "người vợ", hskLevel: 2, radical: "女", strokeCount: 11, example: "他的妻子", exampleTranslation: "vợ của anh ấy", tags: ["Bài 8", "Danh từ"] },
      { id: "hsk2-l8-w13", hanzi: "丈夫", pinyin: "zhàngfu", hanViet: "trượng phu", vietnamese: "người chồng", hskLevel: 2, radical: "一", strokeCount: 8, example: "爱她的丈夫", exampleTranslation: "yêu thương chồng cô ấy", tags: ["Bài 8", "Danh từ"] },
      { id: "hsk2-l8-w14", hanzi: "饭馆", pinyin: "fànguǎn", hanViet: "phạn quán", vietnamese: "quán ăn, nhà hàng", hskLevel: 2, radical: "饣", strokeCount: 18, example: "去饭馆吃饭", exampleTranslation: "đến nhà hàng dùng bữa", tags: ["Bài 8", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l8-ex1",
        type: "multiple_choice",
        question: "Chọn từ thích hợp: '这件衣服 ______ 那件衣服贵得多。'",
        options: ["A. 比", "B. 和", "C. 跟", "D. 也"],
        correctAnswer: "A. 比",
        explanation: "Cấu trúc so sánh hơn: A + 比 + B + Tính từ (贵得多)."
      },
      {
        id: "hsk2-l8-ex2",
        type: "multiple_choice",
        question: "Chọn cặp liên từ thích hợp: '______ 他很忙，______ 还是来参加了我的生日会。'",
        options: ["A. 虽然……但是……", "B. 因为……所以……", "C. 不但……而且……", "D. 如果……就……"],
        correctAnswer: "A. 虽然……但是……",
        explanation: "Câu biểu thị quan hệ chuyển ngoặt (nhượng bộ đối lập): 虽然 (tuy) ... 但是 (nhưng)."
      },
      {
        id: "hsk2-l8-ex3",
        type: "fill_blank",
        question: "Hoàn thành câu: '网上买票比在电影院买 ______ (rẻ hơn).' (Điền chữ Hán)",
        options: ["便宜", "贵", "多", "少"],
        correctAnswer: "便宜",
        explanation: "便宜 (piányi) mang nghĩa 'rẻ'."
      }
    ]
  },

  // LESSON 9
  {
    lessonNumber: 9,
    titleHanzi: "我去买杯奶茶",
    titlePinyin: "Wǒ qù mǎi bēi nǎichá",
    titleVietnamese: "Tôi đi mua một ly trà sữa",
    pageStart: 73,
    objectives: [
      "Nắm vững câu so sánh phủ định với '没有' (A 没有 B + Tính từ / Tân ngữ) để miêu tả sự khác biệt giữa hai sự vật.",
      "Sử dụng động từ '离' (lí) biểu thị khoảng cách không gian hoặc thời gian (离……很近 / 很远).",
      "Vận dụng bổ ngữ thời lượng cơ bản (走半个多小时, 坐了坐) để diễn tả khoảng thời gian duy trì của hành động."
    ],
    texts: [
      {
        id: "hsk2-l9-t1",
        title: "课文 1: 在商店 (Bài khóa 1: Ở cửa hàng quần áo)",
        context: "在商店，王一雪和刘明在看裤子。(Trong cửa hàng, Vương Nhất Tuyết và Lưu Minh đang xem quần cho con trai).",
        lines: [
          { speaker: "王一雪", hanzi: "儿子的裤子坏了，我们给他买条新的吧。", pinyin: "Érzi de kùzi huài le, wǒmen gěi tā mǎi tiáo xīn de ba.", vietnamese: "Quần của con trai bị rách rồi, chúng ta mua cho con một chiếc mới nhé." },
          { speaker: "刘明", hanzi: "好啊。", pinyin: "Hǎo a.", vietnamese: "Được thôi." },
          { speaker: "王一雪", hanzi: "你看这条黑色的怎么样？", pinyin: "Nǐ kàn zhè tiáo hēisè de zěnmeyàng?", vietnamese: "Anh nhìn chiếc màu đen này thế nào?" },
          { speaker: "刘明", hanzi: "没有你上次买的那条好看。", pinyin: "Méiyǒu nǐ shàngcì mǎi de nà tiáo hǎokàn.", vietnamese: "Không đẹp bằng chiếc lần trước em mua đâu." },
          { speaker: "王一雪", hanzi: "旁边那个男孩儿就穿了这样的裤子，我觉得很好看啊！", pinyin: "Pángbiān nàge nánháir jiù chuānle zhèyàng de kùzi, wǒ juéde hěn hǎokàn a!", vietnamese: "Cậu bé bên cạnh đang mặc chiếc quần như thế này này, em thấy rất đẹp mà!" },
          { speaker: "刘明", hanzi: "儿子的个子没有他那么高，穿上就不会太好看。", pinyin: "Érzi de gèzi méiyǒu tā nàme gāo, chuānshang jiù bú huì tài hǎokàn.", vietnamese: "Vóc dáng con trai mình không cao bằng cậu ấy, mặc vào sẽ không được đẹp lắm." },
          { speaker: "王一雪", hanzi: "好吧，我们再去那边看看。", pinyin: "Hǎo ba, wǒmen zài qù nàbiān kànkan.", vietnamese: "Thôi được, chúng mình sang bên kia xem thử tiếp nhé." }
        ]
      },
      {
        id: "hsk2-l9-t2",
        title: "课文 2: 在商店门口 (Bài khóa 2: Trước cửa tiệm)",
        context: "在商店门口，王一雪和刘明往外走。(Trước cửa tiệm, Vương Nhất Tuyết và Lưu Minh vừa bước ra ngoài vừa trò chuyện).",
        lines: [
          { speaker: "王一雪", hanzi: "门口有家奶茶店。你想喝杯奶茶吗？", pinyin: "Ménkǒu yǒu jiā nǎichádiàn. Nǐ xiǎng hē bēi nǎichá ma?", vietnamese: "Trước cổng có một quán trà sữa. Anh có muốn uống một ly trà sữa không?" },
          { speaker: "刘明", hanzi: "我想喝咖啡，还是去咖啡店吧。", pinyin: "Wǒ xiǎng hē kāfēi, háishi qù kāfēidiàn ba.", vietnamese: "Anh muốn uống cà phê hơn, hay là đến quán cà phê đi." },
          { speaker: "王一雪", hanzi: "咖啡店离这儿有点儿远。", pinyin: "Kāfēidiàn lí zhèr yǒudiǎnr yuǎn.", vietnamese: "Quán cà phê cách đây hơi xa đấy." },
          { speaker: "刘明", hanzi: "没关系，那家店的咖啡很好喝。", pinyin: "Méi guānxi, nà jiā diàn de kāfēi hěn hǎohē.", vietnamese: "Không sao, cà phê ở quán đó ngon lắm." },
          { speaker: "王一雪", hanzi: "那你等一下，我去买杯奶茶。", pinyin: "Nà nǐ děng yíxià, wǒ qù mǎi bēi nǎichá.", vietnamese: "Vậy anh đợi em một chút, em đi mua ly trà sữa nhé." },
          { speaker: "刘明", hanzi: "你不想喝咖啡吗？", pinyin: "Nǐ bù xiǎng hē kāfēi ma?", vietnamese: "Em không muốn uống cà phê à?" },
          { speaker: "王一雪", hanzi: "喝了咖啡，晚上就别想睡觉了。", pinyin: "Hēle kāfēi, wǎnshang jiù bié xiǎng shuìjiào le.", vietnamese: "Uống cà phê vào thì tối nay khỏi nghĩ đến chuyện ngủ luôn." }
        ]
      },
      {
        id: "hsk2-l9-t3",
        title: "课文 3: 在路上 (Bài khóa 3: Trên đường về nhà)",
        context: "在路上，刘明和王一雪在散步。(Trên con đường rợp bóng cây, Lưu Minh và Vương Nhất Tuyết vừa đi dạo vừa trò chuyện về việc đi bộ về nhà).",
        lines: [
          { speaker: "刘明", hanzi: "我们打车回去吧。", pinyin: "Wǒmen dǎchē huíqù ba.", vietnamese: "Chúng ta bắt taxi về nhé." },
          { speaker: "王一雪", hanzi: "这里离家很近，还是走路吧。", pinyin: "Zhèlǐ lí jiā hěn jìn, háishi zǒulù ba.", vietnamese: "Chỗ này cách nhà rất gần, hay là mình đi bộ đi." },
          { speaker: "刘明", hanzi: "要走多长时间？", pinyin: "Yào zǒu duō cháng shíjiān?", vietnamese: "Đi bộ mất bao lâu em?" },
          { speaker: "王一雪", hanzi: "走半个多小时就到了。", pinyin: "Zǒu bàn gè duō xiǎoshí jiù dào le.", vietnamese: "Đi bộ hơn nửa tiếng là tới nơi rồi." },
          { speaker: "刘明", hanzi: "好的。每天上下班都坐车，今天运动运动吧。", pinyin: "Hǎo de. Měi tiān shàng xià bān dōu zuò chē, jīntiān yùndòng yùndòng ba.", vietnamese: "Được thôi. Ngày nào đi làm cũng đi xe, hôm nay tranh thủ vận động rèn luyện một chút." }
        ]
      },
      {
        id: "hsk2-l9-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
        context: "在房间，王一雪在写日记。(Trong phòng ngủ bên bàn viết, Vương Nhất Tuyết nắn nót ghi nhật ký).",
        lines: [
          { speaker: "王一雪", hanzi: "这周刘明休息，我下班后跟他去了一家商店。商店里边的衣服没有大商场里好看。我们没有买到喜欢的衣服，从商店出来就到咖啡店坐了坐。因为想运动运动，所以喝完东西，我们就走回家了。", pinyin: "Zhè zhōu Liú Míng xiūxi, wǒ xiàbān hòu gēn tā qùle yì jiā shāngdiàn. Shāngdiàn lǐbian de yīfu méiyǒu dà shāngchǎng lǐ hǎokàn. Wǒmen méiyǒu mǎidào xǐhuan de yīfu, cóng shāngdiàn chūlái jiù dào kāfēidiàn zuòle zuò. Yīnwèi xiǎng yùndòng yùndòng, suǒyǐ hēwán dōngxi, wǒmen jiù zǒu huí jiā le.", vietnamese: "Tuần này Lưu Minh được nghỉ ngơi, sau khi tan làm tôi cùng anh ấy đến một cửa hàng. Quần áo trong tiệm không đẹp bằng trong trung tâm thương mại lớn. Chúng tôi không mua được bộ nào ưng ý, vừa ra khỏi tiệm liền ghé quán cà phê ngồi một lúc. Vì muốn vận động một chút nên sau khi uống đồ xong, hai vợ chồng liền cùng nhau đi bộ về nhà." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l9-g1",
        title: "1. Câu so sánh dùng '没有' (A 没有 B + [那么/这么] + Tính từ)",
        explanation: "Biểu thị sự so sánh dạng phủ định: A không bằng B về mặt tính chất, đặc điểm nào đó.",
        examples: [
          { hanzi: "没有你上次买的那条好看。", pinyin: "Méiyǒu nǐ shàngcì mǎi de nà tiáo hǎokàn.", vietnamese: "Không đẹp bằng chiếc lần trước em mua." },
          { hanzi: "儿子的个子没有他那么高。", pinyin: "Érzi de gèzi méiyǒu tā nàme gāo.", vietnamese: "Vóc dáng con trai mình không cao bằng cậu ấy." },
          { hanzi: "今天没有昨天那么热。", pinyin: "Jīntiān méiyǒu zuótiān nàme rè.", vietnamese: "Hôm nay không nóng bằng hôm qua." }
        ]
      },
      {
        id: "hsk2-l9-g2",
        title: "2. Giới từ '离' (A 离 B + 近 / 远 / Khoảng cách)",
        explanation: "Dùng để biểu thị khoảng cách về không gian hoặc thời gian giữa hai điểm A và B: A cách B...",
        examples: [
          { hanzi: "咖啡店离这儿有点儿远。", pinyin: "Kāfēidiàn lí zhèr yǒudiǎnr yuǎn.", vietnamese: "Quán cà phê cách đây hơi xa." },
          { hanzi: "这里离家很近。", pinyin: "Zhèlǐ lí jiā hěn jìn.", vietnamese: "Ở đây cách nhà rất gần." },
          { hanzi: "学校离车站不太远。", pinyin: "Xuéxiào lí chēzhàn bú tài yuǎn.", vietnamese: "Trường học cách bến xe không xa lắm." }
        ]
      },
      {
        id: "hsk2-l9-g3",
        title: "3. Bổ ngữ thời lượng cơ bản (Động từ + Khoảng thời gian)",
        explanation: "Biểu thị khoảng thời gian mà một hành động diễn ra hoặc kéo dài. Công thức: Chủ ngữ + Động từ + (Tân ngữ) + Thời lượng, hoặc lặp lại động từ.",
        examples: [
          { hanzi: "走半个多小时就到了。", pinyin: "Zǒu bàn gè duō xiǎoshí jiù dào le.", vietnamese: "Đi bộ hơn nửa tiếng là đến rồi." },
          { hanzi: "李文等了她一个小时。", pinyin: "Lǐ Wén děngle tā yí gè xiǎoshí.", vietnamese: "Lý Văn đã đợi cô ấy suốt một tiếng đồng hồ." },
          { hanzi: "我们休息十分钟。", pinyin: "Wǒmen xiūxi shí fēnzhōng.", vietnamese: "Chúng ta nghỉ ngơi mười phút nhé." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l9-w1", hanzi: "坏", pinyin: "huài", hanViet: "hoại", vietnamese: "hỏng, rách, xấu", hskLevel: 2, radical: "土", strokeCount: 7, example: "裤子坏了", exampleTranslation: "quần bị rách/hỏng", tags: ["Bài 9", "Tính từ"] },
      { id: "hsk2-l9-w2", hanzi: "旁边", pinyin: "pángbiān", hanViet: "bàng biên", vietnamese: "bên cạnh", hskLevel: 2, radical: "方", strokeCount: 15, example: "旁边的人", exampleTranslation: "người ở bên cạnh", tags: ["Bài 9", "Danh từ chỉ vị trí"] },
      { id: "hsk2-l9-w3", hanzi: "男孩儿", pinyin: "nánháir", hanViet: "nam hài nhi", vietnamese: "bé trai, cậu bé", hskLevel: 2, radical: "田", strokeCount: 15, example: "小男孩儿", exampleTranslation: "cậu bé con", tags: ["Bài 9", "Danh từ"] },
      { id: "hsk2-l9-w4", hanzi: "这样", pinyin: "zhèyàng", hanViet: "giá dạng", vietnamese: "như thế này", hskLevel: 2, radical: "木", strokeCount: 15, example: "这样的人 / 这样的裤子", exampleTranslation: "người như thế này / quần như thế này", tags: ["Bài 9", "Đại từ"] },
      { id: "hsk2-l9-w5", hanzi: "个子", pinyin: "gèzi", hanViet: "cá tử", vietnamese: "vóc dáng, chiều cao", hskLevel: 2, radical: "亻", strokeCount: 6, example: "高个子", exampleTranslation: "dáng người cao", tags: ["Bài 9", "Danh từ"] },
      { id: "hsk2-l9-w6", hanzi: "那么", pinyin: "nàme", hanViet: "na ma", vietnamese: "đến mức ấy, như thế kia", hskLevel: 2, radical: "阝", strokeCount: 9, example: "那么高", exampleTranslation: "cao đến như vậy", tags: ["Bài 9", "Đại từ"] },
      { id: "hsk2-l9-w7", hanzi: "高", pinyin: "gāo", hanViet: "cao", vietnamese: "cao", hskLevel: 2, radical: "高", strokeCount: 10, example: "很高", exampleTranslation: "rất cao", tags: ["Bài 9", "Tính từ"] },
      { id: "hsk2-l9-w8", hanzi: "门口", pinyin: "ménkǒu", hanViet: "môn khẩu", vietnamese: "cổng, cửa ra vào", hskLevel: 2, radical: "门", strokeCount: 6, example: "在门口等我", exampleTranslation: "chờ tôi ở trước cổng", tags: ["Bài 9", "Danh từ"] },
      { id: "hsk2-l9-w9", hanzi: "咖啡", pinyin: "kāfēi", hanViet: "cà phê", vietnamese: "cà phê", hskLevel: 2, radical: "口", strokeCount: 16, example: "喝咖啡", exampleTranslation: "uống cà phê", tags: ["Bài 9", "Danh từ"] },
      { id: "hsk2-l9-w10", hanzi: "离", pinyin: "lí", hanViet: "ly", vietnamese: "cách, rời khỏi", hskLevel: 2, radical: "亠", strokeCount: 11, example: "离这里不远", exampleTranslation: "cách đây không xa", tags: ["Bài 9", "Giới từ"] },
      { id: "hsk2-l9-w11", hanzi: "近", pinyin: "jìn", hanViet: "cận", vietnamese: "gần", hskLevel: 2, radical: "辶", strokeCount: 7, example: "很近", exampleTranslation: "rất gần", tags: ["Bài 9", "Tính từ"] },
      { id: "hsk2-l9-w12", hanzi: "走路", pinyin: "zǒulù", hanViet: "tẩu lộ", vietnamese: "đi bộ", hskLevel: 2, radical: "走", strokeCount: 20, example: "走路回家", exampleTranslation: "đi bộ về nhà", tags: ["Bài 9", "Động từ"] },
      { id: "hsk2-l9-w13", hanzi: "周", pinyin: "zhōu", hanViet: "chu", vietnamese: "tuần (lễ)", hskLevel: 2, radical: "冂", strokeCount: 8, example: "这周 / 下周", exampleTranslation: "tuần này / tuần sau", tags: ["Bài 9", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l9-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống: '我家 ______ 公司很近，我每天都走路去上班。'",
        options: ["A. 离", "B. 比", "C. 从", "D. 往"],
        correctAnswer: "A. 离",
        explanation: "Cấu trúc biểu thị khoảng cách không gian: A + 离 + B + 近 / 远."
      },
      {
        id: "hsk2-l9-ex2",
        type: "multiple_choice",
        question: "Chọn câu có ý nghĩa tương đương: '今天没有昨天热。'",
        options: [
          "A. 昨天比今天热。",
          "B. 今天比昨天热。",
          "C. 昨天没有今天热。",
          "D. 今天和昨天一样热。"
        ],
        correctAnswer: "A. 昨天比今天热。",
        explanation: "'A 没有 B + Tính từ' tương đương với 'B 比 A + Tính từ'. 'Hôm nay không nóng bằng hôm qua' = 'Hôm qua nóng hơn hôm nay'."
      },
      {
        id: "hsk2-l9-ex3",
        type: "fill_blank",
        question: "Điền từ: '走半个多 ______ 就到了。' (Điền chữ Hán chỉ đơn vị thời gian 'tiếng đồng hồ')",
        options: ["小时", "分钟", "天", "年"],
        correctAnswer: "小时",
        explanation: "半个多小时: hơn nửa tiếng đồng hồ."
      }
    ]
  },

  // LESSON 10
  {
    lessonNumber: 10,
    titleHanzi: "就要考试了",
    titlePinyin: "Jiù yào kǎoshì le",
    titleVietnamese: "Sắp thi rồi",
    pageStart: 84,
    objectives: [
      "Nắm vững câu có cụm chủ-vị làm vị ngữ để miêu tả, nhận xét người và sự vật.",
      "Sử dụng câu hỏi lựa chọn với '还是' (háishi: A 还是 B?) để hỏi han, trao đổi trong học tập và đời sống.",
      "Nắm vững kết cấu cố định biểu thị sự việc sắp sửa xảy ra: '要 / 快 / 快要 / 就要……了' (Sắp... rồi)."
    ],
    texts: [
      {
        id: "hsk2-l10-t1",
        title: "课文 1: 在房间 (Bài khóa 1: Ở trong phòng)",
        context: "在房间，刘明在帮刘小明准备东西。(Trong phòng ngủ, Lưu Minh đang giúp con trai Lưu Tiểu Minh chuẩn bị đồ dùng đi học).",
        lines: [
          { speaker: "刘明", hanzi: "小明，你们明天开学，你准备好了吗？", pinyin: "Xiǎomíng, nǐmen míngtiān kāixué, nǐ zhǔnbèi hǎo le ma?", vietnamese: "Tiểu Minh, ngày mai các con khai giảng rồi, con đã chuẩn bị xong chưa?" },
          { speaker: "刘小明", hanzi: "明天就开学啊？爸爸，我的书包你看见了吗？", pinyin: "Míngtiān jiù kāixué a? Bàba, wǒ de shūbāo nǐ kànjiàn le ma?", vietnamese: "Mai đã khai giảng rồi ạ? Bố ơi, bố có thấy cặp sách của con ở đâu không?" },
          { speaker: "刘明", hanzi: "书包在门后面。", pinyin: "Shūbāo zài mén hòumiàn.", vietnamese: "Cặp sách ở phía sau cánh cửa kìa." },
          { speaker: "刘小明", hanzi: "书在哪儿呢？笔呢？", pinyin: "Shū zài nǎr ne? Bǐ ne?", vietnamese: "Sách ở đâu thế ạ? Còn bút đâu rồi ạ?" },
          { speaker: "刘明", hanzi: "书在床上，笔在桌子上。", pinyin: "Shū zài chuáng shang, bǐ zài zhuōzi shang.", vietnamese: "Sách ở trên giường, bút ở trên bàn học." },
          { speaker: "刘小明", hanzi: "太好了！现在都准备好了。", pinyin: "Tài hǎo le! Xiànzài dōu zhǔnbèi hǎo le.", vietnamese: "Tuyệt quá! Bây giờ mọi thứ đều chuẩn bị xong xuôi rồi." },
          { speaker: "刘明", hanzi: "这次爸爸帮你，下次你自己准备，好不好？", pinyin: "Zhè cì bàba bāng nǐ, xià cì nǐ zìjǐ zhǔnbèi, hǎo bu hǎo?", vietnamese: "Lần này bố giúp con, lần sau con tự mình chuẩn bị nhé, được không?" },
          { speaker: "刘小明", hanzi: "好！", pinyin: "Hǎo!", vietnamese: "Dạ được ạ!" }
        ]
      },
      {
        id: "hsk2-l10-t2",
        title: "课文 2: 在房间 (Bài khóa 2: Trong phòng học)",
        context: "在房间，王一雪和刘小雪在聊学习。(Trong phòng học, Vương Nhất Tuyết và con gái Lưu Tiểu Tuyết trò chuyện về việc ôn thi).",
        lines: [
          { speaker: "王一雪", hanzi: "小雪，你在做什么呢？", pinyin: "Xiǎoxuě, nǐ zài zuò shénme ne?", vietnamese: "Tiểu Tuyết, con đang làm gì đấy?" },
          { speaker: "刘小雪", hanzi: "明天考试，我在看书呢。", pinyin: "Míngtiān kǎoshì, wǒ zài kàn shū ne.", vietnamese: "Ngày mai thi rồi, con đang đọc sách ôn bài đây ạ." },
          { speaker: "王一雪", hanzi: "这些词要好好看看。", pinyin: "Zhèxiē cí yào hǎohǎo kànkan.", vietnamese: "Mấy từ vựng này con phải xem lại cho thật kỹ nhé." },
          { speaker: "刘小雪", hanzi: "我看过了，意思也都懂了。", pinyin: "Wǒ kànguo le, yìsi yě dōu dǒng le.", vietnamese: "Con xem qua rồi, ý nghĩa cũng đều hiểu hết rồi ạ." },
          { speaker: "王一雪", hanzi: "你的本子呢？本子上做错的题也要看一看。", pinyin: "Nǐ de běnzi ne? Běnzi shang zuòcuò de tí yě yào kàn yi kàn.", vietnamese: "Vở của con đâu? Những bài làm sai trong vở cũng phải xem lại đấy nhé." },
          { speaker: "刘小雪", hanzi: "妈妈，是您准备考试还是我准备考试？", pinyin: "Māma, shì nín zhǔnbèi kǎoshì háishi wǒ zhǔnbèi kǎoshì?", vietnamese: "Mẹ ơi, là mẹ chuẩn bị đi thi hay con chuẩn bị đi thi thế ạ?" }
        ]
      },
      {
        id: "hsk2-l10-t3",
        title: "课文 3: 在家里 (Bài khóa 3: Ở nhà)",
        context: "在家里，王一雪和孩子们在聊天儿。(Ở nhà, Vương Nhất Tuyết trò chuyện cùng hai con khi Tiểu Tuyết vừa thi xong về).",
        lines: [
          { speaker: "刘小雪", hanzi: "妈妈，我回来了！", pinyin: "Māma, wǒ huílái le!", vietnamese: "Mẹ ơi, con về rồi ạ!" },
          { speaker: "王一雪", hanzi: "我买了奶茶，就在桌子上，自己去拿吧。", pinyin: "Wǒ mǎile nǎichá, jiù zài zhuōzi shang, zìjǐ qù ná ba.", vietnamese: "Mẹ có mua trà sữa để trên bàn đấy, con tự ra lấy uống nhé." },
          { speaker: "刘小雪", hanzi: "谢谢妈妈！", pinyin: "Xièxie māma!", vietnamese: "Con cảm ơn mẹ!" },
          { speaker: "王一雪", hanzi: "今天考试考得怎么样？", pinyin: "Jīntiān kǎoshì kǎo de zěnmeyàng?", vietnamese: "Hôm nay con thi cử làm bài thế nào?" },
          { speaker: "刘小雪", hanzi: "我觉得比上次好。", pinyin: "Wǒ juéde bǐ shàng cì hǎo.", vietnamese: "Con thấy làm tốt hơn lần trước ạ." },
          { speaker: "王一雪", hanzi: "真不错！饭菜快要做好了，你叫弟弟一起去洗手吧。", pinyin: "Zhēn búcuò! Fàncài kuàiyào zuòhǎo le, nǐ jiào dìdi yìqǐ qù xǐshǒu ba.", vietnamese: "Giỏi lắm! Cơm canh mẹ sắp nấu xong rồi, con gọi em trai cùng đi rửa tay nhé." },
          { speaker: "刘小明", hanzi: "妈妈，我是第一名，姐姐还没洗完呢。", pinyin: "Māma, wǒ shì dì-yī míng, jiějie hái méi xǐwán ne.", vietnamese: "Mẹ ơi, con về nhất nhé, chị vẫn chưa rửa tay xong đâu." },
          { speaker: "王一雪", hanzi: "你洗得真快啊！", pinyin: "Nǐ xǐ de zhēn kuài a!", vietnamese: "Con rửa tay nhanh thật đấy!" }
        ]
      },
      {
        id: "hsk2-l10-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
        context: "在房间，刘小雪在写日记。(Trong phòng ngủ, Lưu Tiểu Tuyết nắn nót viết nhật ký kể về gia đình).",
        lines: [
          { speaker: "刘小雪", hanzi: "快要开学了，爸爸帮弟弟准备书包、本子和笔。我就要考试了，妈妈让我看书、看做错的题。我们上学，爸爸、妈妈比我们还忙。我问他们：“是我和弟弟上学还是你们上学？”我问完，他们都笑了。", pinyin: "Kuàiyào kāixué le, bàba bāng dìdi zhǔnbèi shūbāo, běnzi hé bǐ. Wǒ jiù yào kǎoshì le, māma ràng wǒ kàn shū, kàn zuòcuò de tí. Wǒmen shàngxué, bàba, māma bǐ wǒmen hái máng. Wǒ wèn tāmen: “Shì wǒ hé dìdi shàngxué háishi nǐmen shàngxué?” Wǒ wènwán, tāmen dōu xiào le.", vietnamese: "Sắp khai giảng rồi, bố giúp em trai chuẩn bị cặp sách, tập vở và bút. Tôi thì sắp thi, mẹ bảo tôi đọc sách, xem lại các bài đã làm sai. Tụi con đi học mà bố mẹ còn bận rộn hơn cả tụi con. Tôi liền hỏi bố mẹ: 'Là con với em đi học hay là bố mẹ đi học thế ạ?' Tôi vừa hỏi xong, cả nhà đều bật cười." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l10-g1",
        title: "1. Câu hỏi lựa chọn với '还是' (A 还是 B?)",
        explanation: "Dùng '还是' (háishi) nối hai phương án lựa chọn trong câu nghi vấn để người nghe chọn một trong hai.",
        examples: [
          { hanzi: "是您准备考试还是我准备考试？", pinyin: "Shì nín zhǔnbèi kǎoshì háishi wǒ zhǔnbèi kǎoshì?", vietnamese: "Là mẹ chuẩn bị đi thi hay con chuẩn bị đi thi ạ?" },
          { hanzi: "是我和弟弟上学还是你们上学？", pinyin: "Shì wǒ hé dìdi shàngxué háishi nǐmen shàngxué?", vietnamese: "Là con với em đi học hay bố mẹ đi học?" },
          { hanzi: "你想喝茶还是喝咖啡？", pinyin: "Nǐ xiǎng hē chá háishi hē kāfēi?", vietnamese: "Bạn muốn uống trà hay uống cà phê?" }
        ]
      },
      {
        id: "hsk2-l10-g2",
        title: "2. Cấu trúc cố định '要 / 快 / 快要 / 就要……了' (Sắp... rồi)",
        explanation: "Biểu thị một hành động hoặc trạng thái sắp sửa xảy ra trong tương lai gần. Lưu ý: nếu trong câu có trạng ngữ chỉ thời gian xác định (ví dụ: 明天, 下星期) thì chỉ dùng '就要……了', không dùng '快要……了'.",
        examples: [
          { hanzi: "饭菜快要做好了。", pinyin: "Fàncài kuàiyào zuòhǎo le.", vietnamese: "Cơm canh sắp sửa nấu xong rồi." },
          { hanzi: "快要开学了。", pinyin: "Kuàiyào kāixué le.", vietnamese: "Sắp sửa khai giảng rồi." },
          { hanzi: "我们下星期就要考试了。", pinyin: "Wǒmen xià xīngqī jiù yào kǎoshì le.", vietnamese: "Tuần sau chúng tôi sắp thi rồi." }
        ]
      },
      {
        id: "hsk2-l10-g3",
        title: "3. Câu vị ngữ chủ-vị",
        explanation: "Phần vị ngữ của câu là một cụm chủ-vị nhỏ giải thích, bổ sung ý nghĩa chi tiết cho chủ ngữ lớn.",
        examples: [
          { hanzi: "今天考试考得怎么样？", pinyin: "Jīntiān kǎoshì kǎo de zěnmeyàng?", vietnamese: "Hôm nay thi cử làm bài thế nào?" },
          { hanzi: "我身体很好。", pinyin: "Wǒ shēntǐ hěn hǎo.", vietnamese: "Sức khỏe của tôi rất tốt." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l10-w1", hanzi: "开学", pinyin: "kāixué", hanViet: "khai học", vietnamese: "khai giảng, bắt đầu kỳ học", hskLevel: 2, radical: "廾", strokeCount: 12, example: "明天开学", exampleTranslation: "ngày mai khai giảng", tags: ["Bài 10", "Động từ"] },
      { id: "hsk2-l10-w2", hanzi: "门", pinyin: "mén", hanViet: "môn", vietnamese: "cửa, cổng", hskLevel: 2, radical: "门", strokeCount: 3, example: "开门 / 关门", exampleTranslation: "mở cửa / đóng cửa", tags: ["Bài 10", "Danh từ"] },
      { id: "hsk2-l10-w3", hanzi: "后面", pinyin: "hòumiàn", hanViet: "hậu diện", vietnamese: "phía sau, đằng sau", hskLevel: 2, radical: "口", strokeCount: 15, example: "在门后面", exampleTranslation: "ở sau cánh cửa", tags: ["Bài 10", "Danh từ chỉ phương vị"] },
      { id: "hsk2-l10-w4", hanzi: "笔", pinyin: "bǐ", hanViet: "bút", vietnamese: "bút viết", hskLevel: 2, radical: "竹", strokeCount: 10, example: "一只笔", exampleTranslation: "một cây bút", tags: ["Bài 10", "Danh từ"] },
      { id: "hsk2-l10-w5", hanzi: "帮", pinyin: "bāng", hanViet: "bang", vietnamese: "giúp, giúp đỡ", hskLevel: 2, radical: "巾", strokeCount: 9, example: "爸爸帮我", exampleTranslation: "bố giúp tôi", tags: ["Bài 10", "Động từ"] },
      { id: "hsk2-l10-w6", hanzi: "考试", pinyin: "kǎoshì", hanViet: "khảo thí", vietnamese: "thi, kỳ thi, kiểm tra", hskLevel: 2, radical: "耂", strokeCount: 14, example: "准备考试", exampleTranslation: "chuẩn bị ôn thi", tags: ["Bài 10", "Động từ", "Danh từ"] },
      { id: "hsk2-l10-w7", hanzi: "词", pinyin: "cí", hanViet: "từ", vietnamese: "từ ngữ, từ vựng", hskLevel: 2, radical: "讠", strokeCount: 7, example: "生词 / 这些词", exampleTranslation: "từ mới / những từ này", tags: ["Bài 10", "Danh từ"] },
      { id: "hsk2-l10-w8", hanzi: "本子", pinyin: "běnzi", hanViet: "bản tử", vietnamese: "quyển vở, cuốn sổ", hskLevel: 2, radical: "木", strokeCount: 8, example: "买本子", exampleTranslation: "mua vở", tags: ["Bài 10", "Danh từ"] },
      { id: "hsk2-l10-w9", hanzi: "错", pinyin: "cuò", hanViet: "thác", vietnamese: "sai, nhầm lẫn", hskLevel: 2, radical: "钅", strokeCount: 13, example: "做错了", exampleTranslation: "làm sai rồi", tags: ["Bài 10", "Tính từ"] },
      { id: "hsk2-l10-w10", hanzi: "题", pinyin: "tí", hanViet: "đề", vietnamese: "câu hỏi, đề bài, bài tập", hskLevel: 2, radical: "页", strokeCount: 15, example: "做题", exampleTranslation: "làm bài tập", tags: ["Bài 10", "Danh từ"] },
      { id: "hsk2-l10-w11", hanzi: "还是", pinyin: "háishi", hanViet: "hoàn thị", vietnamese: "hay là (câu hỏi lựa chọn)", hskLevel: 2, radical: "日", strokeCount: 18, example: "去还是不去", exampleTranslation: "đi hay là không đi", tags: ["Bài 10", "Liên từ"] },
      { id: "hsk2-l10-w12", hanzi: "考", pinyin: "kǎo", hanViet: "khảo", vietnamese: "thi cử, làm bài thi", hskLevel: 2, radical: "耂", strokeCount: 6, example: "考得很好", exampleTranslation: "thi rất tốt", tags: ["Bài 10", "Động từ"] },
      { id: "hsk2-l10-w13", hanzi: "快要", pinyin: "kuàiyào", hanViet: "khoái yếu", vietnamese: "sắp sửa", hskLevel: 2, radical: "心", strokeCount: 16, example: "快要开始了", exampleTranslation: "sắp bắt đầu rồi", tags: ["Bài 10", "Phó từ"] },
      { id: "hsk2-l10-w14", hanzi: "笑", pinyin: "xiào", hanViet: "tiếu", vietnamese: "cười", hskLevel: 2, radical: "竹", strokeCount: 10, example: "笑了", exampleTranslation: "cười rồi", tags: ["Bài 10", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l10-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào câu nghi vấn lựa chọn: '你想今天去 ______ 明天去？'",
        options: ["A. 还是", "B. 或者", "C. 但是", "D. 虽然"],
        correctAnswer: "A. 还是",
        explanation: "Trong câu hỏi lựa chọn 'A hay là B', dùng '还是' (háishi). ('或者' chỉ dùng trong câu trần thuật)."
      },
      {
        id: "hsk2-l10-ex2",
        type: "multiple_choice",
        question: "Chọn câu đúng biểu thị hành động sắp xảy ra khi có thời gian xác định '明天':",
        options: [
          "A. 我们明天就要开学了。",
          "B. 我们明天快要开学了。",
          "C. 我们明天快开学了。",
          "D. 我们明天要开学。"
        ],
        correctAnswer: "A. 我们明天就要开学了。",
        explanation: "Khi có mốc thời gian cụ thể (như '明天'), chỉ được dùng '就要……了', không dùng '快要……了' hay '快……了'."
      },
      {
        id: "hsk2-l10-ex3",
        type: "fill_blank",
        question: "Điền từ: '这些词我已经看过了，意思也都 ______ (hiểu) 了。' (Điền chữ Hán)",
        options: ["懂", "看", "想", "做"],
        correctAnswer: "懂",
        explanation: "懂 (dǒng) nghĩa là hiểu."
      }
    ]
  },

  // LESSON 11
  {
    lessonNumber: 11,
    titleHanzi: "我最喜欢吃中国菜",
    titlePinyin: "Wǒ zuì xǐhuan chī Zhōngguó cài",
    titleVietnamese: "Tôi thích ăn món Trung Quốc nhất",
    pageStart: 93,
    objectives: [
      "Nghe hiểu và miêu tả được tình trạng sức khỏe, bệnh tình (头疼, 不舒服, 吃药).",
      "Sử dụng trợ từ động thái '着' (zhe) để biểu thị sự tiếp diễn của động tác hoặc trạng thái (坐着, 开着车, 下着雪).",
      "Nắm vững phó từ chỉ mức độ '最' (zuì) để biểu thị thuộc tính vượt trội nhất (最喜欢, 最高, 最好)."
    ],
    texts: [
      {
        id: "hsk2-l11-t1",
        title: "课文 1: 在教室 (Bài khóa 1: Ở trong lớp học)",
        context: "在教室，王一飞和白家月在聊天儿。(Trong lớp học, cô Vương Nhất Phi và Bạch Gia Nguyệt trò chuyện).",
        lines: [
          { speaker: "王一飞", hanzi: "家月，都下课了，你怎么还不回家？", pinyin: "Jiāyuè, dōu xiàkè le, nǐ zěnme hái bù huí jiā?", vietnamese: "Gia Nguyệt, tan học rồi, sao em vẫn chưa về nhà thế?" },
          { speaker: "白家月", hanzi: "我头疼，不太舒服。", pinyin: "Wǒ tóu téng, bú tài shūfu.", vietnamese: "Em bị đau đầu, trong người không được khỏe lắm cô ạ." },
          { speaker: "王一飞", hanzi: "你这几天经常头疼，去医院看看吧。", pinyin: "Nǐ zhè jǐ tiān jīngcháng tóu téng, qù yīyuàn kànkan ba.", vietnamese: "Mấy hôm nay em thường xuyên đau đầu, đi bệnh viện khám xem sao nhé." },
          { speaker: "白家月", hanzi: "我想休息一下，现在不能动，一动就疼。", pinyin: "Wǒ xiǎng xiūxi yíxià, xiànzài bù néng dòng, yí dòng jiù téng.", vietnamese: "Em muốn nghỉ một chút, giờ em không cử động được, hễ động đậy là lại đau." },
          { speaker: "王一飞", hanzi: "那你在这儿坐着，我去开车，一会儿送你去医院。", pinyin: "Nà nǐ zài zhèr zuòzhe, wǒ qù kāichē, yíhuìr sòng nǐ qù yīyuàn.", vietnamese: "Vậy em cứ ngồi đây nhé, cô đi lấy xe ô tô, lát nữa cô chở em đến bệnh viện." },
          { speaker: "白家月", hanzi: "谢谢王老师。", pinyin: "Xièxie Wáng lǎoshī.", vietnamese: "Em cảm ơn cô Vương ạ." }
        ]
      },
      {
        id: "hsk2-l11-t2",
        title: "课文 2: 在车上 (Bài khóa 2: Trên xe ô tô)",
        context: "在车上，王一飞、白家月和李文在打电话。(Trên xe ô tô đi bệnh viện, Bạch Gia Nguyệt nghe điện thoại của Lý Văn).",
        lines: [
          { speaker: "王一飞", hanzi: "现在路上车多，还下着雪，我开慢一点儿。", pinyin: "Xiànzài lùshang chē duō, hái xiàzhe xuě, wǒ kāi màn yìdiǎnr.", vietnamese: "Bây giờ trên đường đông xe, trời lại đang có tuyết rơi, cô lái chậm một chút nhé." },
          { speaker: "白家月", hanzi: "没问题，现在头没那么疼了。", pinyin: "Méi wèntí, xiànzài tóu méi nàme téng le.", vietnamese: "Dạ vâng ạ, giờ đầu em cũng không đau nhiều như lúc nãy nữa." },
          { speaker: "王一飞", hanzi: "好。李文来电话了，你帮我接一下。", pinyin: "Hǎo. Lǐ Wén lái diànhuà le, nǐ bāng wǒ jiē yíxià.", vietnamese: "Được rồi. Lý Văn gọi điện đến kìa, em nghe máy giúp cô nhé." },
          { speaker: "白家月", hanzi: "喂，李文，王老师开着车呢，你找她有事吗？", pinyin: "Wèi, Lǐ Wén, Wáng lǎoshī kāizhe chē ne, nǐ zhǎo tā yǒu shì ma?", vietnamese: "Alo, Lý Văn à, cô Vương đang lái xe, cậu tìm cô có việc gì không?" },
          { speaker: "李文", hanzi: "没什么事。今天雪这么大，你们开车去哪儿啊？", pinyin: "Méi shénme shì. Jīntiān xuě zhème dà, nǐmen kāichē qù nǎr a?", vietnamese: "Không có chuyện gì gấp đâu. Hôm nay tuyết rơi to thế này, mọi người lái xe đi đâu đấy?" },
          { speaker: "白家月", hanzi: "去医院，我头有点儿疼。", pinyin: "Qù yīyuàn, wǒ tóu yǒudiǎnr téng.", vietnamese: "Đi bệnh viện, đầu tớ hơi bị đau một chút." },
          { speaker: "李文", hanzi: "那我一会儿去看看你。", pinyin: "Nà wǒ yíhuìr qù kànkan nǐ.", vietnamese: "Vậy lát nữa tớ qua thăm cậu nhé." }
        ]
      },
      {
        id: "hsk2-l11-t3",
        title: "课文 3: 在王老师家 (Bài khóa 3: Tại nhà cô Vương)",
        context: "在王老师家，白家月、李文和王一飞在聊天儿。(Tại nhà cô Vương Nhất Phi sau khi đi viện về, mọi người trò chuyện ấm cúng).",
        lines: [
          { speaker: "白家月", hanzi: "李文，快请进！", pinyin: "Lǐ Wén, kuài qǐng jìn!", vietnamese: "Lý Văn, mau vào nhà đi!" },
          { speaker: "李文", hanzi: "家月，你怎么样了？头还疼吗？", pinyin: "Jiāyuè, nǐ zěnmeyàng le? Tóu hái téng ma?", vietnamese: "Gia Nguyệt, cậu thấy sao rồi? Đầu còn đau không?" },
          { speaker: "白家月", hanzi: "不那么疼了。医生开了一些药，吃完就好多了。", pinyin: "Bú nàme téng le. Yīshēng kāile yìxiē yào, chīwán jiù hǎoduō le.", vietnamese: "Không đau lắm nữa rồi. Bác sĩ kê cho ít thuốc, uống xong tớ thấy đỡ nhiều rồi." },
          { speaker: "李文", hanzi: "那就好！", pinyin: "Nà jiù hǎo!", vietnamese: "Thế thì tốt quá!" },
          { speaker: "王一飞", hanzi: "家月，你想不想吃点儿东西？", pinyin: "Jiāyuè, nǐ xiǎng bu xiǎng chī diǎnr dōngxi?", vietnamese: "Gia Nguyệt, em có muốn ăn chút gì không?" },
          { speaker: "李文", hanzi: "吃点儿吧，身体不舒服时更要好好吃饭。", pinyin: "Chī diǎnr ba, shēntǐ bù shūfu shí gèng yào hǎohǎo chī fàn.", vietnamese: "Cậu ăn chút đi, lúc người không khỏe thì càng phải ăn uống đầy đủ." },
          { speaker: "白家月", hanzi: "吃点儿什么呢？", pinyin: "Chī diǎnr shénme ne?", vietnamese: "Ăn món gì bây giờ nhỉ?" },
          { speaker: "王一飞", hanzi: "你最喜欢吃中国菜，我做几个中国菜吧。", pinyin: "Nǐ zuì xǐhuan chī Zhōngguó cài, wǒ zuò jǐ gè Zhōngguó cài ba.", vietnamese: "Em thích ăn món ăn Trung Quốc nhất, để cô nấu vài món Trung Quốc nhé." },
          { speaker: "白家月", hanzi: "好的，谢谢王老师。", pinyin: "Hǎo de, xièxie Wáng lǎoshī.", vietnamese: "Vâng ạ, em cảm ơn cô Vương nhiều." }
        ]
      },
      {
        id: "hsk2-l11-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
        context: "在房间，白家月在写日记。(Trong phòng ngủ, Bạch Gia Nguyệt cảm động ghi nhật ký).",
        lines: [
          { speaker: "白家月", hanzi: "我这几天经常头疼，从药店买了点儿药，没去医院。今天下课后，王老师看我不舒服，就送我去医院了。从医院回来，李文也来看我了。现在他们都回去了，我也要睡觉了。", pinyin: "Wǒ zhè jǐ tiān jīngcháng tóu téng, cóng yàodiàn mǎile diǎnr yào, méi qù yīyuàn. Jīntiān xiàkè hòu, Wáng lǎoshī kàn wǒ bù shūfu, jiù sòng wǒ qù yīyuàn le. Cóng yīyuàn huílái, Lǐ Wén yě lái kàn wǒ le. Xiànzài tāmen dōu huíqù le, wǒ yě yào shuìjiào le.", vietnamese: "Mấy hôm nay tôi thường xuyên đau đầu, có mua ít thuốc ở hiệu thuốc chứ chưa đi bệnh viện. Hôm nay sau khi tan học, cô giáo Vương thấy tôi mệt mỏi liền chở tôi đến bệnh viện khám. Từ bệnh viện trở về, Lý Văn cũng qua thăm tôi. Bây giờ mọi người đều về rồi, tôi cũng chuẩn bị đi ngủ đây." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l11-g1",
        title: "1. Trợ từ động thái '着' (zhe) biểu thị trạng thái tiếp diễn",
        explanation: "Đứng sau động từ biểu thị động tác hoặc trạng thái đang duy trì, tiếp diễn: Động từ + 着 (+ Tân ngữ).",
        examples: [
          { hanzi: "你在这儿坐着。", pinyin: "Nǐ zài zhèr zuòzhe.", vietnamese: "Em cứ ngồi ở đây nhé." },
          { hanzi: "还下着雪。", pinyin: "Hái xiàzhe xuě.", vietnamese: "Trời vẫn còn đang có tuyết rơi." },
          { hanzi: "王老师开着车呢。", pinyin: "Wáng lǎoshī kāizhe chē ne.", vietnamese: "Cô Vương đang lái xe đấy." }
        ]
      },
      {
        id: "hsk2-l11-g2",
        title: "2. Phó từ chỉ mức độ '最' (zuì - Nhất)",
        explanation: "Dùng trước tính từ hoặc động từ tâm lý để biểu thị mức độ cao nhất, vượt trội hơn tất cả các đối tượng khác cùng loại.",
        examples: [
          { hanzi: "你最喜欢吃中国菜。", pinyin: "Nǐ zuì xǐhuan chī Zhōngguó cài.", vietnamese: "Em thích ăn món Trung Quốc nhất." },
          { hanzi: "在我们家，爸爸最高。", pinyin: "Zài wǒmen jiā, bàba zuì gāo.", vietnamese: "Trong nhà tôi, bố là người cao nhất." },
          { hanzi: "你们班谁说中文说得最好？", pinyin: "Nǐmen bān shuí shuō Zhōngwén shuō de zuì hǎo?", vietnamese: "Lớp các bạn ai nói tiếng Trung giỏi nhất?" }
        ]
      },
      {
        id: "hsk2-l11-g3",
        title: "3. '时' biểu thị thời điểm / khi...",
        explanation: "'……时' là dạng rút gọn của '……的时候', biểu thị lúc, khi diễn ra một trạng thái hay hành động nào đó.",
        examples: [
          { hanzi: "身体不舒服时更要好好吃饭。", pinyin: "Shēntǐ bù shūfu shí gèng yào hǎohǎo chī fàn.", vietnamese: "Lúc cơ thể không khỏe càng phải ăn uống đầy đủ." },
          { hanzi: "生病时要多喝水。", pinyin: "Shēngbìng shí yào duō hē shuǐ.", vietnamese: "Lúc ốm phải uống nhiều nước." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l11-w1", hanzi: "头", pinyin: "tóu", hanViet: "đầu", vietnamese: "đầu", hskLevel: 2, radical: "大", strokeCount: 5, example: "头疼", exampleTranslation: "đau đầu", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk2-l11-w2", hanzi: "疼", pinyin: "téng", hanViet: "đông", vietnamese: "đau, đau nhức", hskLevel: 2, radical: "疒", strokeCount: 10, example: "很疼", exampleTranslation: "rất đau", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk2-l11-w3", hanzi: "经常", pinyin: "jīngcháng", hanViet: "kinh thường", vietnamese: "thường xuyên, luôn", hskLevel: 2, radical: "纟", strokeCount: 19, example: "经常去", exampleTranslation: "thường xuyên đi", tags: ["Bài 11", "Phó từ"] },
      { id: "hsk2-l11-w4", hanzi: "动", pinyin: "dòng", hanViet: "động", vietnamese: "cử động, nhúc nhích", hskLevel: 2, radical: "力", strokeCount: 6, example: "不能动", exampleTranslation: "không cử động được", tags: ["Bài 11", "Động từ"] },
      { id: "hsk2-l11-w5", hanzi: "着", pinyin: "zhe", hanViet: "trước", vietnamese: "đang (trợ từ động thái)", hskLevel: 2, radical: "目", strokeCount: 11, example: "坐着 / 看着", exampleTranslation: "đang ngồi / đang nhìn", tags: ["Bài 11", "Trợ từ"] },
      { id: "hsk2-l11-w6", hanzi: "路上", pinyin: "lùshang", hanViet: "lộ thượng", vietnamese: "trên đường", hskLevel: 2, radical: "足", strokeCount: 16, example: "在路上", exampleTranslation: "ở trên đường", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk2-l11-w7", hanzi: "慢", pinyin: "màn", hanViet: "mạn", vietnamese: "chậm", hskLevel: 2, radical: "忄", strokeCount: 14, example: "慢走 / 慢点儿", exampleTranslation: "đi thong thả / chậm một chút", tags: ["Bài 11", "Tính từ"] },
      { id: "hsk2-l11-w8", hanzi: "进", pinyin: "jìn", hanViet: "tiến", vietnamese: "vào, tiến vào", hskLevel: 2, radical: "辶", strokeCount: 7, example: "请进", exampleTranslation: "mời vào", tags: ["Bài 11", "Động từ"] },
      { id: "hsk2-l11-w9", hanzi: "药", pinyin: "yào", hanViet: "dược", vietnamese: "thuốc", hskLevel: 2, radical: "艹", strokeCount: 9, example: "吃药", exampleTranslation: "uống thuốc", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk2-l11-w10", hanzi: "身体", pinyin: "shēntǐ", hanViet: "thân thể", vietnamese: "cơ thể, sức khỏe", hskLevel: 2, radical: "身", strokeCount: 14, example: "身体好", exampleTranslation: "sức khỏe tốt", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk2-l11-w11", hanzi: "时", pinyin: "shí", hanViet: "thời", vietnamese: "khi, lúc", hskLevel: 2, radical: "日", strokeCount: 7, example: "有空时", exampleTranslation: "lúc rảnh rỗi", tags: ["Bài 11", "Danh từ"] },
      { id: "hsk2-l11-w12", hanzi: "最", pinyin: "zuì", hanViet: "tối", vietnamese: "nhất", hskLevel: 2, radical: "日", strokeCount: 12, example: "最好 / 最多", exampleTranslation: "tốt nhất / nhiều nhất", tags: ["Bài 11", "Phó từ"] },
      { id: "hsk2-l11-w13", hanzi: "药店", pinyin: "yàodiàn", hanViet: "dược điếm", vietnamese: "hiệu thuốc, tiệm thuốc", hskLevel: 2, radical: "艹", strokeCount: 17, example: "去药店买药", exampleTranslation: "đến hiệu thuốc mua thuốc", tags: ["Bài 11", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l11-ex1",
        type: "multiple_choice",
        question: "Chọn trợ từ thích hợp biểu thị trạng thái tiếp diễn: '外面正下 ______ 雪呢，你多穿点儿衣服。'",
        options: ["A. 着", "B. 了", "C. 过", "D. 的"],
        correctAnswer: "A. 着",
        explanation: "'下着雪' biểu thị tuyết đang tiếp tục rơi (trợ từ động thái '着')."
      },
      {
        id: "hsk2-l11-ex2",
        type: "multiple_choice",
        question: "Điền từ: '在我们家，妈妈做饭做得 ______ 好吃。'",
        options: ["A. 最", "B. 太", "C. 真", "D. 都"],
        correctAnswer: "A. 最",
        explanation: "Phó từ chỉ mức độ cao nhất trong phạm vi ('在我们家'): 最 (nhất)."
      },
      {
        id: "hsk2-l11-ex3",
        type: "fill_blank",
        question: "Điền từ: '李文，快请 ______ (vào)！' (Điền chữ Hán)",
        options: ["进", "出", "回", "去"],
        correctAnswer: "进",
        explanation: "请进 (qǐng jìn): mời vào."
      }
    ]
  },

  // LESSON 12
  {
    lessonNumber: 12,
    titleHanzi: "这里比北京冷多了",
    titlePinyin: "Zhèlǐ bǐ Běijīng lěngduō le",
    titleVietnamese: "Ở đây lạnh hơn Bắc Kinh nhiều",
    pageStart: 102,
    objectives: [
      "Nghe hiểu và đàm thoại về tình hình thời tiết, khí hậu (晴天, 阴天, 下雪, 冷, 热).",
      "Miêu tả và so sánh sự chênh lệch lớn giữa các trạng thái hoặc tính chất (A 比 B + Tính từ + 多了).",
      "Sử dụng câu so sánh kết hợp bổ ngữ trạng thái để so sánh trình độ, tốc độ thực hiện động tác (跑步跑得比我快)."
    ],
    texts: [
      {
        id: "hsk2-l12-t1",
        title: "课文 1: 在房间 (Bài khóa 1: Ở trong phòng)",
        context: "在房间，王一雪接到白家月的电话。(Trong phòng, Vương Nhất Tuyết nhận điện thoại của Bạch Gia Nguyệt hỏi thăm thời tiết).",
        lines: [
          { speaker: "王一雪", hanzi: "喂，家月，是你啊！有什么事情吗？", pinyin: "Wèi, Jiāyuè, shì nǐ a! Yǒu shénme shìqing ma?", vietnamese: "Alo, Gia Nguyệt, là em đấy à! Có chuyện gì thế em?" },
          { speaker: "白家月", hanzi: "没什么事，就想跟您说说话。", pinyin: "Méi shénme shì, jiù xiǎng gēn nín shuōshuo huà.", vietnamese: "Dạ không có chuyện gì đâu ạ, em chỉ muốn gọi điện trò chuyện với chị thôi." },
          { speaker: "王一雪", hanzi: "好啊。你今天没课吗？", pinyin: "Hǎo a. Nǐ jīntiān méi kè ma?", vietnamese: "Được chứ. Hôm nay em không có tiết học à?" },
          { speaker: "白家月", hanzi: "下午有课。您那里天气怎么样？", pinyin: "Xiàwǔ yǒu kè. Nín nàlǐ tiānqì zěnmeyàng?", vietnamese: "Dạ buổi chiều em mới có tiết. Thời tiết chỗ chị dạo này thế nào ạ?" },
          { speaker: "王一雪", hanzi: "北京这几天虽然是晴天，但是有点儿冷。", pinyin: "Běijīng zhè jǐ tiān suīrán shì qíngtiān, dànshì yǒudiǎnr lěng.", vietnamese: "Mấy hôm nay ở Bắc Kinh tuy trời nắng nhưng hơi lạnh em ạ." },
          { speaker: "白家月", hanzi: "我这里比北京冷多了，外边还正下着雪呢！", pinyin: "Wǒ zhèlǐ bǐ Běijīng lěngduō le, wàibian hái zhèng xiàzhe xuě ne!", vietnamese: "Chỗ em ở đây lạnh hơn Bắc Kinh nhiều, bên ngoài trời còn đang rơi tuyết nữa cơ!" }
        ]
      },
      {
        id: "hsk2-l12-t2",
        title: "课文 2: 在客厅 (Bài khóa 2: Ở phòng khách)",
        context: "在客厅，王一雪给王一飞打电话。(Tại phòng khách, Vương Nhất Tuyết gọi điện cho em gái Vương Nhất Phi dặn dò giữ ấm).",
        lines: [
          { speaker: "王一雪", hanzi: "喂，一飞，听家月说你那边下雪了，下得大不大？", pinyin: "Wèi, Yīfēi, tīng Jiāyuè shuō nǐ nàbiān xià xuě le, xià de dà bu dà?", vietnamese: "Alo, Nhất Phi à, chị nghe Gia Nguyệt bảo bên em tuyết rơi rồi, tuyết rơi có to không em?" },
          { speaker: "王一飞", hanzi: "今天不大，昨天比今天下得大。", pinyin: "Jīntiān bú dà, zuótiān bǐ jīntiān xià de dà.", vietnamese: "Hôm nay không to lắm chị, hôm qua rơi to hơn hôm nay nhiều." },
          { speaker: "王一雪", hanzi: "天气不好，你去外面的时候多穿点儿衣服。", pinyin: "Tiānqì bù hǎo, nǐ qù wàimiàn de shíhou duō chuān diǎnr yīfu.", vietnamese: "Thời tiết không tốt, lúc ra ngoài em nhớ mặc thêm nhiều áo ấm nhé." },
          { speaker: "王一飞", hanzi: "这几天我在网上上课，没出去过。", pinyin: "Zhè jǐ tiān wǒ zài wǎngshang shàngkè, méi chūqu guo.", vietnamese: "Mấy ngày nay em toàn dạy học trên mạng, chưa có bước chân ra ngoài ạ." },
          { speaker: "王一雪", hanzi: "那就好，有事记得给我打电话。", pinyin: "Nà jiù hǎo, yǒu shì jìde gěi wǒ dǎ diànhuà.", vietnamese: "Thế thì tốt rồi, có việc gì thì nhớ gọi điện thoại cho chị nhé." },
          { speaker: "王一飞", hanzi: "好的。现在不下雪了，我出去买点儿吃的。", pinyin: "Hǎo de. Xiànzài bú xià xuě le, wǒ chūqu mǎi diǎnr chī de.", vietnamese: "Dạ vâng. Bây giờ tạnh tuyết rồi, em tranh thủ ra ngoài mua chút đồ ăn." },
          { speaker: "王一雪", hanzi: "一次多买点儿，阴天下雪什么的就少出去吧。", pinyin: "Yí cì duō mǎi diǎnr, yīntiān xià xuě shénmede jiù shǎo chūqu ba.", vietnamese: "Một lần mua nhiều một chút, trời âm u tuyết rơi các thứ thì bớt ra ngoài đi em." }
        ]
      },
      {
        id: "hsk2-l12-t3",
        title: "课文 3: 在电话里 (Bài khóa 3: Qua điện thoại)",
        context: "在电话里，李文和白家月在聊天儿。(Qua điện thoại, Lý Văn rủ Bạch Gia Nguyệt cùng đi chạy bộ nâng cao sức khỏe).",
        lines: [
          { speaker: "李文", hanzi: "喂，家月，今天天气不错，我们去跑步吧！", pinyin: "Wèi, Jiāyuè, jīntiān tiānqì búcuò, wǒmen qù pǎobù ba!", vietnamese: "Alo, Gia Nguyệt, hôm nay thời tiết đẹp lắm, chúng mình đi chạy bộ đi!" },
          { speaker: "白家月", hanzi: "你跑步跑得比我快，我们能一起跑吗？", pinyin: "Nǐ pǎobù pǎo de bǐ wǒ kuài, wǒmen néng yìqǐ pǎo ma?", vietnamese: "Cậu chạy nhanh hơn tớ nhiều, hai đứa mình có chạy cùng nhau được không?" },
          { speaker: "李文", hanzi: "可以的，我慢慢跑，等着你。", pinyin: "Kěyǐ de, wǒ mànmàn pǎo, děngzhe nǐ.", vietnamese: "Được chứ, tớ sẽ chạy chậm chậm chờ cậu mà." },
          { speaker: "白家月", hanzi: "好吧。你真爱跑步啊！", pinyin: "Hǎo ba. Nǐ zhēn ài pǎobù a!", vietnamese: "Được rồi. Cậu mê chạy bộ thật đấy!" },
          { speaker: "李文", hanzi: "我从小就经常跟爸爸跑步，跑步能让人快乐！", pinyin: "Wǒ cóngxiǎo jiù jīngcháng gēn bàba pǎobù, pǎobù néng ràng rén kuàilè!", vietnamese: "Từ nhỏ tớ đã hay chạy bộ cùng bố rồi, chạy bộ làm cho con người ta vui vẻ yêu đời lắm!" },
          { speaker: "白家月", hanzi: "好，那我准备一下。", pinyin: "Hǎo, nà wǒ zhǔnbèi yíxià.", vietnamese: "Được, vậy để tớ chuẩn bị một chút nhé." },
          { speaker: "李文", hanzi: "我现在坐地铁去找你，一会儿楼下见。", pinyin: "Wǒ xiànzài zuò dìtiě qù zhǎo nǐ, yíhuìr lóu xià jiàn.", vietnamese: "Bây giờ tớ đi tàu điện ngầm qua tìm cậu, lát nữa gặp nhau dưới sảnh tòa nhà nhé." }
        ]
      },
      {
        id: "hsk2-l12-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
        context: "在房间，白家月在写日记。(Trong phòng ngủ, Bạch Gia Nguyệt vui vẻ viết nhật ký).",
        lines: [
          { speaker: "白家月", hanzi: "前几天天气不好，我没走路，每天坐两站地铁去学校。今天是个大晴天，李文让我跟他去外面跑步。他小时候经常跑步，跑得比我快，但是他会等我。跟李文一起跑步，我好高兴啊！", pinyin: "Qián jǐ tiān tiānqì bù hǎo, wǒ méi zǒulù, měi tiān zuò liǎng zhàn dìtiě qù xuéxiào. Jīntiān shì gè dà qíngtiān, Lǐ Wén ràng wǒ gēn tā qù wàimiàn pǎobù. Tā xiǎoshíhou jīngcháng pǎobù, pǎo de bǐ wǒ kuài, dànshì tā huì děng wǒ. Gēn Lǐ Wén yìqǐ pǎobù, wǒ hǎo gāoxìng a!", vietnamese: "Mấy hôm trước thời tiết xấu, tôi không đi bộ mà mỗi ngày đều đi hai trạm tàu điện ngầm đến trường. Hôm nay là một ngày nắng rực rỡ, Lý Văn rủ tôi cùng ra ngoài chạy bộ. Cậu ấy từ nhỏ đã hay chạy bộ nên chạy nhanh hơn tôi, nhưng cậu ấy luôn chạy chậm chờ tôi. Được chạy bộ cùng Lý Văn, tôi cảm thấy thật là vui sướng!" }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l12-g1",
        title: "1. Câu so sánh hơn biểu thị mức độ chênh lệch lớn ('多了')",
        explanation: "Cấu trúc: A + 比 + B + Tính từ + 多了 (hoặc 得多), biểu thị sự chênh lệch rất lớn về mức độ, tính chất giữa hai đối tượng.",
        examples: [
          { hanzi: "我这里比北京冷多了。", pinyin: "Wǒ zhèlǐ bǐ Běijīng lěngduō le.", vietnamese: "Chỗ em lạnh hơn Bắc Kinh nhiều." },
          { hanzi: "这件衣服比那件贵多了。", pinyin: "Zhè jiàn yīfu bǐ nà jiàn guìduō le.", vietnamese: "Bộ quần áo này đắt hơn bộ kia nhiều." }
        ]
      },
      {
        id: "hsk2-l12-g2",
        title: "2. Câu so sánh kết hợp bổ ngữ trạng thái",
        explanation: "Khi động từ mang cả tân ngữ và bổ ngữ trạng thái '得', ta có thể lặp lại động từ hoặc đưa tân ngữ lên trước: Chủ ngữ + Động từ + Tân ngữ + Động từ + 得 + 比 B + Tính từ (hoặc Chủ ngữ + Tân ngữ + Động từ + 得 + 比 B + Tính từ).",
        examples: [
          { hanzi: "你跑步跑得比我快。", pinyin: "Nǐ pǎobù pǎo de bǐ wǒ kuài.", vietnamese: "Cậu chạy bộ nhanh hơn tớ." },
          { hanzi: "昨天比今天下得大。", pinyin: "Zuótiān bǐ jīntiān xià de dà.", vietnamese: "Hôm qua tuyết rơi to hơn hôm nay." },
          { hanzi: "白家月汉字写得比陈天中好。", pinyin: "Bái Jiāyuè Hànzì xiě de bǐ Chén Tiānzhōng hǎo.", vietnamese: "Bạch Gia Nguyệt viết chữ Hán đẹp hơn Trần Thiên Trung." }
        ]
      },
      {
        id: "hsk2-l12-g3",
        title: "3. Phó từ '正' biểu thị hành động đang tiến hành",
        explanation: "'正' hoặc '正……呢' dùng trước động từ biểu thị một hành động hoặc trạng thái đang diễn ra đúng vào thời điểm được đề cập.",
        examples: [
          { hanzi: "外边还正下着雪呢！", pinyin: "Wàibian hái zhèng xiàzhe xuě ne!", vietnamese: "Bên ngoài trời vẫn còn đang rơi tuyết cơ!" },
          { hanzi: "我们正吃饭呢。", pinyin: "Wǒmen zhèng chī fàn ne.", vietnamese: "Chúng tôi đang dùng bữa." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l12-w1", hanzi: "事情", pinyin: "shìqing", hanViet: "sự tình", vietnamese: "sự việc, công việc, chuyện", hskLevel: 2, radical: "亅", strokeCount: 19, example: "有什么事 / 很多事情", exampleTranslation: "có việc gì / rất nhiều việc", tags: ["Bài 12", "Danh từ"] },
      { id: "hsk2-l12-w2", hanzi: "晴", pinyin: "qíng", hanViet: "tình", vietnamese: "nắng, trời quang", hskLevel: 2, radical: "日", strokeCount: 12, example: "晴天 / 大晴天", exampleTranslation: "ngày nắng / ngày đại nắng đẹp", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk2-l12-w3", hanzi: "正", pinyin: "zhèng", hanViet: "chính", vietnamese: "đang, chính (lúc)", hskLevel: 2, radical: "止", strokeCount: 5, example: "正下着雪", exampleTranslation: "đang rơi tuyết", tags: ["Bài 12", "Phó từ"] },
      { id: "hsk2-l12-w4", hanzi: "外面", pinyin: "wàimiàn", hanViet: "ngoại diện", vietnamese: "bên ngoài, phía ngoài", hskLevel: 2, radical: "夕", strokeCount: 14, example: "去外面", exampleTranslation: "ra ngoài", tags: ["Bài 12", "Danh từ chỉ phương vị"] },
      { id: "hsk2-l12-w5", hanzi: "阴", pinyin: "yīn", hanViet: "âm", vietnamese: "âm u, nhiều mây", hskLevel: 2, radical: "阝", strokeCount: 6, example: "阴天", exampleTranslation: "ngày trời âm u", tags: ["Bài 12", "Tính từ"] },
      { id: "hsk2-l12-w6", hanzi: "从小", pinyin: "cóngxiǎo", hanViet: "tòng tiểu", vietnamese: "từ nhỏ", hskLevel: 2, radical: "人", strokeCount: 7, example: "从小就喜欢", exampleTranslation: "từ nhỏ đã thích", tags: ["Bài 12", "Phó từ"] },
      { id: "hsk2-l12-w7", hanzi: "地铁", pinyin: "dìtiě", hanViet: "địa thiết", vietnamese: "tàu điện ngầm", hskLevel: 2, radical: "土", strokeCount: 16, example: "坐地铁", exampleTranslation: "đi tàu điện ngầm", tags: ["Bài 12", "Danh từ"] },
      { id: "hsk2-l12-w8", hanzi: "楼", pinyin: "lóu", hanViet: "lâu", vietnamese: "tòa nhà, tầng gác", hskLevel: 2, radical: "木", strokeCount: 13, example: "楼下见 / 上楼", exampleTranslation: "gặp dưới tầng / lên lầu", tags: ["Bài 12", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l12-ex1",
        type: "multiple_choice",
        question: "Chọn từ điền vào chỗ trống để biểu thị mức độ chênh lệch rất lớn: '哈尔滨比三亚冷 ______。'",
        options: ["A. 多了", "B. 很多", "C. 太了", "D. 非常"],
        correctAnswer: "A. 多了",
        explanation: "Trong câu so sánh '比', để diễn tả sự chênh lệch nhiều, dùng '多了' hoặc '得多' ở cuối tính từ (không dùng '很多' hay '非常')."
      },
      {
        id: "hsk2-l12-ex2",
        type: "multiple_choice",
        question: "Chọn câu có cấu trúc so sánh đúng ngữ pháp:",
        options: [
          "A. 他跑得比我快。",
          "B. 他跑步比我快得跑。",
          "C. 他跑得比我很客气。",
          "D. 他跑步跑得很比我快。"
        ],
        correctAnswer: "A. 他跑得比我快。",
        explanation: "Cấu trúc so sánh kèm bổ ngữ trạng thái: Chủ ngữ + (Động từ + Tân ngữ) + Động từ + 得 + 比 B + Tính từ."
      },
      {
        id: "hsk2-l12-ex3",
        type: "fill_blank",
        question: "Điền từ: '我坐 ______ (tàu điện ngầm) 去学校。' (Điền chữ Hán)",
        options: ["地铁", "飞机", "出租车", "公共汽车"],
        correctAnswer: "地铁",
        explanation: "地铁 (dìtiě): tàu điện ngầm."
      }
    ]
  },

  // LESSON 13
  {
    lessonNumber: 13,
    titleHanzi: "我们爱上中文课",
    titlePinyin: "Wǒmen ài shàng Zhōngwén kè",
    titleVietnamese: "Chúng tôi yêu thích giờ học tiếng Trung",
    pageStart: 112,
    objectives: [
      "Nghe hiểu và sử dụng câu so sánh biểu thị mức độ chênh lệch cụ thể giữa các sự vật (A 比 B + Tính từ + Cụm số lượng).",
      "Nghe hiểu và sử dụng câu so sánh biểu thị sự chênh lệch nhỏ (A 比 B + Tính từ + 一点儿 / 一些).",
      "Nắm vững cách dùng câu hai tân ngữ (双宾语句) với các động từ biểu thị sự trao tặng (送给, 拿给, 卖给, 教)."
    ],
    texts: [
      {
        id: "hsk2-l13-t1",
        title: "课文 1: 在教室 (Bài khóa 1: Trong lớp học)",
        context: "在教室，白家月和陈天中在聊天儿。(Trong lớp học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện về cô giáo Vương và chuẩn bị quà năm mới).",
        lines: [
          { speaker: "白家月", hanzi: "时间过得真快啊！新年就要到了。", pinyin: "Shíjiān guò de zhēn kuài a! Xīnnián jiù yào dào le.", vietnamese: "Thời gian trôi qua nhanh thật đấy! Năm mới sắp đến rồi." },
          { speaker: "陈天中", hanzi: "这一年王老师教我们中文，每天工作都很累。", pinyin: "Zhè yì nián Wáng lǎoshī jiāo wǒmen Zhōngwén, měitiān gōngzuò dōu hěn lèi.", vietnamese: "Năm nay cô Vương dạy chúng mình tiếng Trung, mỗi ngày làm việc đều rất vất vả." },
          { speaker: "白家月", hanzi: "是啊，她教得很好。因为她，我们都非常爱上中文课。", pinyin: "Shì a, tā jiāo de hěn hǎo. Yīnwèi tā, wǒmen dōu fēicháng ài shàng Zhōngwén kè.", vietnamese: "Đúng vậy, cô dạy hay lắm. Nhờ có cô, chúng mình ai cũng vô cùng thích giờ học tiếng Trung." },
          { speaker: "陈天中", hanzi: "我们给她准备个新年礼物吧。你觉得送给她什么好呢？", pinyin: "Wǒmen gěi tā zhǔnbèi gè xīnnián lǐwù ba. Nǐ juéde sòng gěi tā shénme hǎo ne?", vietnamese: "Chúng mình chuẩn bị món quà năm mới tặng cô đi. Cậu thấy tặng cô món gì thì hay nhỉ?" },
          { speaker: "白家月", hanzi: "王老师喜欢花，就送给她花吧。", pinyin: "Wáng lǎoshī xǐhuan huā, jiù sòng gěi tā huā ba.", vietnamese: "Cô Vương thích hoa, hay là tặng cô hoa đi." },
          { speaker: "陈天中", hanzi: "那我们去花店看看，现在买花的人多，希望花店还有漂亮的花。", pinyin: "Nà wǒmen qù huādiàn kànkan, xiànzài mǎi huā de rén duō, xīwàng huādiàn hái yǒu piàoliang de huā.", vietnamese: "Thế chúng mình ra tiệm hoa xem thử, bây giờ người mua hoa đông lắm, hy vọng tiệm hoa vẫn còn hoa đẹp." }
        ]
      },
      {
        id: "hsk2-l13-t2",
        title: "课文 2: 在教室 (Bài khóa 2: Trong lớp học)",
        context: "在教室，王一飞在上课。(Trong lớp học, cô Vương Nhất Phi đang hướng dẫn luyện viết chữ Hán).",
        lines: [
          { speaker: "白家月", hanzi: "王老师，今天的词比昨天多了十个。", pinyin: "Wáng lǎoshī, jīntiān de cí bǐ zuótiān duōle shí gè.", vietnamese: "Cô Vương ơi, từ vựng hôm nay nhiều hơn hôm qua tận mười từ ạ." },
          { speaker: "王一飞", hanzi: "是啊！你们都学会了吗？", pinyin: "Shì a! Nǐmen dōu xuéhuì le ma?", vietnamese: "Đúng vậy! Các em đều đã học thuộc hết chưa nào?" },
          { speaker: "安妮", hanzi: "学会了，没有问题。", pinyin: "Xuéhuì le, méiyǒu wèntí.", vietnamese: "Bọn em học thuộc rồi ạ, không có vấn đề gì đâu cô." },
          { speaker: "王一飞", hanzi: "好。现在我来说，你们在本子上面写。", pinyin: "Hǎo. Xiànzài wǒ lái shuō, nǐmen zài běnzi shàngmiàn xiě.", vietnamese: "Tốt lắm. Bây giờ cô đọc, các em viết vào trong vở nhé." },
          { speaker: "王一飞", hanzi: "同学们，“洗手间”的“间”字写错了，它的里面是“日”，不是“口”。", pinyin: "Tóngxuémen, 'xǐshǒujiān' de 'jiān' zì xiěcuò le, tā de lǐmiàn shì 'rì', bú shì 'kǒu'.", vietnamese: "Các em ơi, chữ 'Gian' trong 'nhà vệ sinh' viết sai rồi nhé, bên trong nó là chữ 'Nhật - 日', không phải chữ 'Khẩu - 口' đâu." },
          { speaker: "白家月", hanzi: "“日”比“口”多一笔，写“口”就是“问题”的“问”了。", pinyin: "'Rì' bǐ 'kǒu' duō yì bǐ, xiě 'kǒu' jiù shì 'wèntí' de 'wèn' le.", vietnamese: "Chữ 'Nhật' nhiều hơn chữ 'Khẩu' một nét, nếu viết chữ 'Khẩu' thì thành chữ 'Vấn - 问' trong 'vấn đề' mất rồi ạ." },
          { speaker: "王一飞", hanzi: "没错，你说得很对。", pinyin: "Méi cuò, nǐ shuō de hěn duì.", vietnamese: "Đúng rồi, em nói rất chính xác." }
        ]
      },
      {
        id: "hsk2-l13-t3",
        title: "课文 3: 在教室 (Bài khóa 3: Trong lớp học)",
        context: "在教室，安妮和白家月在聊天儿。(Trong lớp học, Annie và Bạch Gia Nguyệt khoe nhau cuốn sổ tay gấu trúc mua trên mạng và hẹn tặng quà).",
        lines: [
          { speaker: "安妮", hanzi: "家月，你觉得这个本子怎么样？", pinyin: "Jiāyuè, nǐ juéde zhèige běnzi zěnmeyàng?", vietnamese: "Gia Nguyệt ơi, cậu thấy quyển sổ này thế nào?" },
          { speaker: "白家月", hanzi: "很漂亮，多少钱一个？", pinyin: "Hěn piàoliang, duōshao qián yí gè?", vietnamese: "Đẹp lắm, bao nhiêu tiền một quyển thế?" },
          { speaker: "安妮", hanzi: "比我们一起买的那个本子贵一点儿。", pinyin: "Bǐ wǒmen yìqǐ mǎi de nàge běnzi guì yìdiǎnr.", vietnamese: "Đắt hơn quyển sổ hôm trước hai đứa mình cùng mua một chút." },
          { speaker: "白家月", hanzi: "这么漂亮的本子，不可能贵一点儿吧？", pinyin: "Zhème piàoliang de běnzi, bù kěnéng guì yìdiǎnr ba?", vietnamese: "Quyển sổ xinh xắn thế này, làm sao mà chỉ đắt hơn có một chút được?" },
          { speaker: "安妮", hanzi: "我是上网买的，真没那么贵。我买了两个，送你一个。", pinyin: "Wǒ shì shàngwǎng mǎi de, zhēn méi nàme guì. Wǒ mǎile liǎng gè, sòng nǐ yí gè.", vietnamese: "Tớ mua trên mạng đấy, thật sự không đắt đến thế đâu. Tớ mua hai quyển, tặng cậu một quyển này." },
          { speaker: "白家月", hanzi: "谢谢！那我送给你什么呢？", pinyin: "Xièxie! Nà wǒ sòng gěi nǐ shénme ne?", vietnamese: "Cảm ơn cậu nhé! Thế tớ tặng lại cậu cái gì đây nhỉ?" },
          { speaker: "安妮", hanzi: "咖啡杯吧，我最喜欢喝咖啡了。", pinyin: "Kāfēibēi ba, wǒ zuì xǐhuan hē kāfēi le.", vietnamese: "Tặng ly cà phê đi, tớ thích uống cà phê nhất trần đời." },
          { speaker: "白家月", hanzi: "好，那样我们就有新年礼物了！", pinyin: "Hǎo, nàyàng wǒmen jiù dōu yǒu xīnnián lǐwù le!", vietnamese: "Được thôi, thế thì cả hai đứa mình đều có quà năm mới rồi!" }
        ]
      },
      {
        id: "hsk2-l13-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
        context: "在房间，白家月在写日记。(Trong phòng, Bạch Gia Nguyệt viết nhật ký ghi lại niềm vui nhận quà năm mới và tặng hoa cho cô giáo).",
        lines: [
          { speaker: "白家月", hanzi: "新年就要到了，安妮送给我一个新本子。她告诉我是在网上买的，比我的本子贵一点儿。我们班同学也送了王老师漂亮的花，希望她高高兴兴地过个新年。", pinyin: "Xīnnián jiù yào dào le, Ānnī sòng gěi wǒ yí gè xīn běnzi. Tā gàosu wǒ shì zài wǎngshang mǎi de, bǐ wǒ de běnzi guì yìdiǎnr. Wǒmen bān tóngxué yě sòngle Wáng lǎoshī piàoliang de huā, xīwàng tā gāogāoxìngxìng de guò gè xīnnián.", vietnamese: "Năm mới sắp đến rồi, Annie đã tặng cho mình một quyển sổ mới. Cậu ấy bảo với mình là mua trên mạng, đắt hơn quyển sổ của mình một chút. Cả lớp chúng mình cũng tặng cô giáo Vương bó hoa tươi thắm, hy vọng cô sẽ đón một năm mới thật vui vẻ." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l13-g1",
        title: "1. 双宾语句 (2) - Câu hai tân ngữ với 送给, 拿给, 卖给",
        explanation: "Câu hai tân ngữ là câu có một động từ mang theo hai tân ngữ: tân ngữ thứ nhất (tân ngữ gián tiếp) chỉ người, tân ngữ thứ hai (tân ngữ trực tiếp) chỉ sự vật. Trong bài này, học các động từ như 拿 (cầm, lấy), 送 (tặng), 卖 (bán), 教 (dạy) kết hợp cùng từ 给 để chỉ hành động trao tặng, chuyển giao cho ai cái gì.",
        examples: [
          { hanzi: "王老师喜欢花，就送给她花吧。", pinyin: "Wáng lǎoshī xǐhuan huā, jiù sòng gěi tā huā ba.", vietnamese: "Cô Vương thích hoa, hay là tặng cô hoa đi." },
          { hanzi: "她拿给我一杯水。", pinyin: "Tā ná gěi wǒ yì bēi shuǐ.", vietnamese: "Cô ấy đưa cho tôi một cốc nước." },
          { hanzi: "他卖给我一本中文书。", pinyin: "Tā mài gěi wǒ yì běn Zhōngwén shū.", vietnamese: "Anh ấy bán cho tôi một cuốn sách tiếng Trung." },
          { hanzi: "王老师教我们中文。", pinyin: "Wáng lǎoshī jiāo wǒmen Zhōngwén.", vietnamese: "Cô Vương dạy chúng tôi tiếng Trung." }
        ]
      },
      {
        id: "hsk2-l13-g2",
        title: "2. 比较句 (7) - Câu so sánh biểu thị mức độ chênh lệch cụ thể",
        explanation: "Trong câu so sánh dùng '比', cụm số lượng (số từ + lượng từ) được đặt ở sau tính từ để biểu thị con số chênh lệch cụ thể giữa hai đối tượng. Cấu trúc: A + 比 + B + Tính từ + Cụm số lượng.",
        examples: [
          { hanzi: "今天的词比昨天多了十个。", pinyin: "Jīntiān de cí bǐ zuótiān duōle shí gè.", vietnamese: "Từ vựng hôm nay nhiều hơn hôm qua 10 từ." },
          { hanzi: "姐姐比我大三岁。", pinyin: "Jiějie bǐ wǒ dà sān suì.", vietnamese: "Chị gái lớn hơn tôi 3 tuổi." },
          { hanzi: "坐飞机比坐火车快五个多小时。", pinyin: "Zuò fēijī bǐ zuò huǒchē kuài wǔ gè duō xiǎoshí.", vietnamese: "Đi máy bay nhanh hơn đi tàu hỏa hơn 5 tiếng đồng hồ." }
        ]
      },
      {
        id: "hsk2-l13-g3",
        title: "3. 比较句 (8) - Câu so sánh biểu thị sự chênh lệch nhỏ",
        explanation: "Trong câu so sánh dùng '比', cụm từ '一点儿' hoặc '一些' được đặt sau tính từ để biểu thị mức độ chênh lệch giữa hai đối tượng là không đáng kể (chỉ một chút, một ít). Cấu trúc: A + 比 + B + Tính từ + 一点儿 / 一些.",
        examples: [
          { hanzi: "比我们一起买的那个本子贵一点儿。", pinyin: "Bǐ wǒmen yìqǐ mǎi de nàge běnzi guì yìdiǎnr.", vietnamese: "Đắt hơn cuốn sổ mà chúng ta cùng mua hôm trước một chút." },
          { hanzi: "姐姐比我高一点儿。", pinyin: "Jiějie bǐ wǒ gāo yìdiǎnr.", vietnamese: "Chị gái cao hơn tôi một chút." },
          { hanzi: "那间教室比这间大一些。", pinyin: "Nà jiān jiàoshì bǐ zhè jiān dà yìxiē.", vietnamese: "Phòng học kia rộng hơn phòng học này một chút." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l13-w1", hanzi: "新年", pinyin: "xīnnián", hanViet: "tân niên", vietnamese: "năm mới", hskLevel: 2, radical: "斤", strokeCount: 13, example: "新年快乐", exampleTranslation: "chúc mừng năm mới", tags: ["Bài 13", "Thời gian"] },
      { id: "hsk2-l13-w2", hanzi: "教", pinyin: "jiāo", hanViet: "giáo", vietnamese: "dạy, dạy học", hskLevel: 2, radical: "攵", strokeCount: 11, example: "教中文", exampleTranslation: "dạy tiếng Trung", tags: ["Bài 13", "Động từ"] },
      { id: "hsk2-l13-w3", hanzi: "花", pinyin: "huā", hanViet: "hoa", vietnamese: "hoa, bông hoa", hskLevel: 2, radical: "艹", strokeCount: 7, example: "买花 / 送花", exampleTranslation: "mua hoa / tặng hoa", tags: ["Bài 13", "Danh từ"] },
      { id: "hsk2-l13-w4", hanzi: "希望", pinyin: "xīwàng", hanViet: "hy vọng", vietnamese: "hy vọng, mong ước", hskLevel: 2, radical: "月", strokeCount: 11, example: "我希望你好", exampleTranslation: "tôi mong bạn mạnh khỏe", tags: ["Bài 13", "Động từ"] },
      { id: "hsk2-l13-w5", hanzi: "上面", pinyin: "shàngmiàn", hanViet: "thượng diện", vietnamese: "phía trên, bên trên", hskLevel: 2, radical: "一", strokeCount: 3, example: "桌子上面", exampleTranslation: "trên mặt bàn", tags: ["Bài 13", "Phương vị"] },
      { id: "hsk2-l13-w6", hanzi: "洗手间", pinyin: "xǐshǒujiān", hanViet: "tẩy thủ gian", vietnamese: "nhà vệ sinh, phòng rửa tay", hskLevel: 2, radical: "氵", strokeCount: 9, example: "去洗手间", exampleTranslation: "đi nhà vệ sinh", tags: ["Bài 13", "Địa điểm"] },
      { id: "hsk2-l13-w7", hanzi: "里面", pinyin: "lǐmiàn", hanViet: "lý diện", vietnamese: "bên trong, phía trong", hskLevel: 2, radical: "里", strokeCount: 7, example: "教室里面", exampleTranslation: "bên trong lớp học", tags: ["Bài 13", "Phương vị"] },
      { id: "hsk2-l13-w8", hanzi: "笔", pinyin: "bǐ", hanViet: "bút", vietnamese: "nét chữ (lượng từ) / cây bút", hskLevel: 2, radical: "⺮", strokeCount: 10, example: "多一笔", exampleTranslation: "nhiều hơn một nét", tags: ["Bài 13", "Lượng từ"] },
      { id: "hsk2-l13-w9", hanzi: "可能", pinyin: "kěnéng", hanViet: "khả năng", vietnamese: "có thể, có khả năng", hskLevel: 2, radical: "口", strokeCount: 5, example: "不可能", exampleTranslation: "không thể nào", tags: ["Bài 13", "Động từ"] },
      { id: "hsk2-l13-w10", hanzi: "上网", pinyin: "shàngwǎng", hanViet: "thượng võng", vietnamese: "lên mạng, lướt internet", hskLevel: 2, radical: "一", strokeCount: 3, example: "上网买东西", exampleTranslation: "lên mạng mua đồ", tags: ["Bài 13", "Động từ"] },
      { id: "hsk2-l13-w11", hanzi: "那样", pinyin: "nàyàng", hanViet: "na dạng", vietnamese: "như thế, như vậy", hskLevel: 2, radical: "木", strokeCount: 6, example: "像那样", exampleTranslation: "giống như thế", tags: ["Bài 13", "Đại từ"] },
      { id: "hsk2-l13-w12", hanzi: "告诉", pinyin: "gàosu", hanViet: "cáo tố", vietnamese: "bảo cho biết, nói cho", hskLevel: 2, radical: "口", strokeCount: 7, example: "告诉我", exampleTranslation: "nói cho tôi biết", tags: ["Bài 13", "Động từ"] },
      { id: "hsk2-l13-w13", hanzi: "班", pinyin: "bān", hanViet: "ban", vietnamese: "lớp học, ca làm việc", hskLevel: 2, radical: "王", strokeCount: 10, example: "我们班", exampleTranslation: "lớp chúng tôi", tags: ["Bài 13", "Danh từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l13-ex1",
        type: "multiple_choice",
        question: "Chọn từ/cụm từ thích hợp điền vào chỗ trống để chỉ sự chênh lệch cụ thể: '今天的词比昨天 ______。'",
        options: ["A. 多了十个", "B. 很多", "C. 非常多", "D. 很有意思"],
        correctAnswer: "A. 多了十个",
        explanation: "Trong câu so sánh biểu thị mức độ chênh lệch cụ thể, cấu trúc là: A + 比 + B + Tính từ + Cụm số lượng (多了十个)."
      },
      {
        id: "hsk2-l13-ex2",
        type: "multiple_choice",
        question: "Chọn câu có cấu trúc câu hai tân ngữ (双宾语句) đúng ngữ pháp:",
        options: [
          "A. 安妮送给我一个新本子。",
          "B. 安妮一个新本子送给我。",
          "C. 安妮送给一个新本子我。",
          "D. 安妮我送给一个新本子。"
        ],
        correctAnswer: "A. 安妮送给我一个新本子。",
        explanation: "Cấu trúc hai tân ngữ chuẩn: Chủ ngữ + Động từ (送给) + Tân ngữ 1 chỉ người (我) + Tân ngữ 2 chỉ vật (一个新本子)."
      },
      {
        id: "hsk2-l13-ex3",
        type: "multiple_choice",
        question: "Điền vào chỗ trống để diễn tả sự chênh lệch nhỏ: '这个本子比那个 ______。'",
        options: ["A. 贵一点儿", "B. 贵很", "C. 很贵", "D. 贵太了"],
        correctAnswer: "A. 贵一点儿",
        explanation: "Cấu trúc biểu thị mức độ chênh lệch nhỏ: A + 比 + B + Tính từ + 一点儿 / 一些."
      },
      {
        id: "hsk2-l13-ex4",
        type: "fill_blank",
        question: "Điền từ thích hợp: '洗手间的“间”字里面是 ______，不是“口”。' (Điền chữ Hán)",
        options: ["日", "月", "木", "田"],
        correctAnswer: "日",
        explanation: "Chữ 间 (gian) gồm bộ môn 门 và chữ nhật 日 ở bên trong. Nếu bên trong là chữ khẩu 口 thì sẽ là chữ 问 (vấn/hỏi)."
      }
    ]
  },

  // LESSON 14
  {
    lessonNumber: 14,
    titleHanzi: "一个人过年多没意思啊",
    titlePinyin: "Yí gè rén guònián duō méi yìsi a",
    titleVietnamese: "Một mình đón Tết chán biết bao",
    pageStart: 121,
    objectives: [
      "Nghe hiểu và miêu tả sự tồn hiện của người hoặc vật ở một nơi chốn nào đó (Câu tồn hiện: Nơi chốn + Động từ + 着 + Danh từ).",
      "Nghe hiểu và sử dụng bổ ngữ xu hướng kép để biểu đạt phương hướng dịch chuyển của động tác (V + 上来 / 下去 / 出来 / 过去...).",
      "Nắm vững cách dùng phó từ chỉ mức độ '多' trong câu cảm thán để biểu đạt mức độ rất cao (多 + Tính từ + 啊!)."
    ],
    texts: [
      {
        id: "hsk2-l14-t1",
        title: "课文 1: 在回家路上 (Bài khóa 1: Trên đường về nhà)",
        context: "在回家路上，李文和王一飞边走边聊。(Trên đường về nhà, Lý Văn và cô Vương Nhất Phi vừa đi vừa trò chuyện).",
        lines: [
          { speaker: "李文", hanzi: "王老师，你家楼下站着一个人。", pinyin: "Wáng lǎoshī, nǐ jiā lóu xià zhànzhe yí gè rén.", vietnamese: "Cô Vương ơi, dưới chân tòa nhà của cô có một người đang đứng kìa." },
          { speaker: "王一飞", hanzi: "我家楼下？我看看。", pinyin: "Wǒ jiā lóu xià? Wǒ kànkan.", vietnamese: "Dưới nhà cô á? Để cô xem nào." },
          { speaker: "李文", hanzi: "那个人穿着黑色的裤子，手里还拿着一个黑色的包。", pinyin: "Nàge rén chuānzhe hēisè de kùzi, shǒuli hái názhe yí gè hēisè de bāo.", vietnamese: "Người đó mặc quần màu đen, trên tay còn đang xách một chiếc túi màu đen nữa." },
          { speaker: "王一飞", hanzi: "我看见那个人了，他是我男朋友。", pinyin: "Wǒ kànjiàn nàge rén le, tā shì wǒ nánpéngyou.", vietnamese: "Cô nhìn thấy người đó rồi, anh ấy là bạn trai cô." },
          { speaker: "李文", hanzi: "那我们快过去吧。", pinyin: "Nà wǒmen kuài guòqù ba.", vietnamese: "Thế thì chúng ta mau qua đó đi ạ." }
        ]
      },
      {
        id: "hsk2-l14-t2",
        title: "课文 2: 在楼下 (Bài khóa 2: Dưới chân tòa nhà)",
        context: "在楼下，王一飞见到杨同乐。(Ở dưới sảnh, cô Vương Nhất Phi gặp bạn trai Dương Đồng Nhạc và giới thiệu với Lý Văn).",
        lines: [
          { speaker: "王一飞", hanzi: "同乐，真是你啊！上次打电话，你说有时间过来看我，没想到这么快就来了！", pinyin: "Tónglè, zhēn shì nǐ a! Shàng cì dǎ diànhuà, nǐ shuō yǒu shíjiān guòlái kàn wǒ, méi xiǎngdào zhème kuài jiù lái le!", vietnamese: "Đồng Nhạc, đúng là anh thật này! Lần trước gọi điện, anh bảo khi nào rảnh sẽ qua thăm em, không ngờ lại đến nhanh thế!" },
          { speaker: "杨同乐", hanzi: "就要过年了，你一个人在这儿多没意思啊，所以我就早早过来了。", pinyin: "Jiù yào guònián le, nǐ yí gè rén zài zhèr duō méi yìsi a, suǒyǐ wǒ jiù zǎozǎo guòlái le.", vietnamese: "Sắp đến Tết rồi, em thui thủi một mình ở đây buồn chán biết bao, thế nên anh mới tranh thủ sang đây thật sớm." },
          { speaker: "王一飞", hanzi: "你能来，我太高兴了！", pinyin: "Nǐ néng lái, wǒ tài gāoxìng le!", vietnamese: "Anh sang được là em vui lắm rồi!" },
          { speaker: "杨同乐", hanzi: "一飞，你旁边这位是？", pinyin: "Yīfēi, nǐ pángbiān zhè wèi shì?", vietnamese: "Nhất Phi à, người bên cạnh em đây là ai thế?" },
          { speaker: "王一飞", hanzi: "同乐，这是李文，他在我们学校学医。李文，这是我男朋友杨同乐。", pinyin: "Tónglè, zhè shì Lǐ Wén, tā zài wǒmen xuéxiào xué yī. Lǐ Wén, zhè shì wǒ nánpéngyou Yáng Tónglè.", vietnamese: "Đồng Nhạc, đây là Lý Văn, em ấy học y ở trường em. Lý Văn, đây là bạn trai cô, anh Dương Đồng Nhạc." },
          { speaker: "杨同乐", hanzi: "李文，很高兴认识你！", pinyin: "Lǐ Wén, hěn gāoxìng rènshi nǐ!", vietnamese: "Chào Lý Văn, rất vui được làm quen với em nhé!" },
          { speaker: "李文", hanzi: "认识你我也很高兴！我家就在前面那个楼，有时间来玩。", pinyin: "Rènshi nǐ wǒ yě hěn gāoxìng! Wǒ jiā jiù zài qiánmiàn nàge lóu, yǒu shíjiān lái wán.", vietnamese: "Làm quen với anh em cũng rất vui! Nhà em ở ngay tòa nhà phía trước kia, khi nào rảnh mời anh qua chơi ạ." }
        ]
      },
      {
        id: "hsk2-l14-t3",
        title: "课文 3: 在王一飞家里 (Bài khóa 3: Tại nhà cô Vương Nhất Phi)",
        context: "在王一飞家里，王一飞和杨同乐在客厅聊天儿。(Tại nhà của Vương Nhất Phi, cô và Dương Đồng Nhạc đang ngồi trò chuyện ở phòng khách).",
        lines: [
          { speaker: "杨同乐", hanzi: "一飞，你住的房子真不错，很大，离学校也不远。", pinyin: "Yīfēi, nǐ zhù de fángzi zhēn búcuò, hěn dà, lí xuéxiào yě bù yuǎn.", vietnamese: "Nhất Phi ơi, căn nhà em thuê thích thật đấy, vừa rộng lại còn gần trường nữa." },
          { speaker: "王一飞", hanzi: "是啊！我楼下还住着一家中国人，他们人很好。", pinyin: "Shì a! Wǒ lóu xià hái zhùzhe yì jiā Zhōngguó rén, tāmen rén hěn hǎo.", vietnamese: "Vâng anh! Dưới tầng nhà em còn có một gia đình người Trung Quốc sinh sống, mọi người tốt bụng lắm." },
          { speaker: "杨同乐", hanzi: "这样你有事情就可以找他们帮忙。", pinyin: "Zhèyàng nǐ yǒu shìqing jiù kěyǐ zhǎo tāmen bāngmáng.", vietnamese: "Như thế em có việc gì cần thì có thể nhờ họ giúp đỡ." },
          { speaker: "王一飞", hanzi: "对，我也帮他们家的小孩儿学中文。", pinyin: "Duì, wǒ yě bāng tāmen jiā de xiǎoháir xué Zhōngwén.", vietnamese: "Vâng, em cũng thỉnh thoảng kèm con của họ học tiếng Trung nữa." },
          { speaker: "杨同乐", hanzi: "我记得你跟我说过，是个女孩子，学得也很好。", pinyin: "Wǒ jìde nǐ gēn wǒ shuōguo, shì gè nǚháir, xué de yě hěn hǎo.", vietnamese: "Anh nhớ em từng kể với anh rồi, là một bé gái, học cũng giỏi lắm đúng không." },
          { speaker: "王一飞", hanzi: "没错，她经常跑上来找我玩。", pinyin: "Méi cuò, tā jīngcháng pǎo shànglái zhǎo wǒ wán.", vietnamese: "Đúng rồi anh, bé hay chạy tót lên nhà tìm em chơi đùa." },
          { speaker: "杨同乐", hanzi: "你问问他们什么时候有时间，我请他们吃个饭。", pinyin: "Nǐ wènwen tāmen shénme shíhou yǒu shíjiān, wǒ qǐng tāmen chī gè fàn.", vietnamese: "Em hỏi xem khi nào họ rảnh rỗi, anh mời cả nhà họ đi ăn một bữa cơm nhé." }
        ]
      },
      {
        id: "hsk2-l14-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
        context: "在房间，王一飞在写日记。(Trong phòng, cô Vương Nhất Phi viết nhật ký chia sẻ về bạn trai Dương Đồng Nhạc).",
        lines: [
          { speaker: "王一飞", hanzi: "我男朋友姓杨，叫杨同乐。他高个子、大眼睛，唱歌唱得很好，跳舞跳得也不错。他和我姐姐一起工作，是姐姐介绍我们认识的。他告诉我，从见到我的第一天开始，他就喜欢上我了。", pinyin: "Wǒ nánpéngyou xìng Yáng, jiào Yáng Tónglè. Tā gāo gèzi, dà yǎnjing, chànggē chàng de hěn hǎo, tiàowǔ tiào de yě búcuò. Tā hé wǒ jiějie yìqǐ gōngzuò, shì jiějie jièshào wǒmen rènshi de. Tā gàosu wǒ, cóng jiàndào wǒ de dì-yī tiān kāishǐ, tā jiù xǐhuan shàng wǒ le.", vietnamese: "Bạn trai của mình họ Dương, tên là Dương Đồng Nhạc. Anh ấy dáng người cao ráo, đôi mắt to sáng, hát rất hay và khiêu vũ cũng rất cừ. Anh ấy làm việc chung công ty với chị gái mình, và chính chị gái là người se duyên cho hai đứa quen nhau. Anh ấy thổ lộ rằng, ngay từ khoảnh khắc đầu tiên nhìn thấy mình, anh ấy đã đem lòng yêu mình rồi." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l14-g1",
        title: "1. 存现句 (2) - Câu tồn hiện với trợ từ động thái '着'",
        explanation: "Trợ từ động thái '着' được đặt sau động từ để cấu tạo câu tồn hiện, dùng để miêu tả tại một nơi chốn nào đó đang có sự hiện diện của một người hoặc sự vật cụ thể. Cấu trúc cơ bản: Từ chỉ nơi chốn + Động từ + 着 + Người/Sự vật chưa xác định (thường có cụm số lượng).",
        examples: [
          { hanzi: "你家楼下站着一个人。", pinyin: "Nǐ jiā lóu xià zhànzhe yí gè rén.", vietnamese: "Dưới chân tòa nhà bạn đang có một người đứng." },
          { hanzi: "爸爸手里拿着一杯咖啡。", pinyin: "Bàba shǒuli názhe yì bēi kāfēi.", vietnamese: "Trong tay bố đang cầm một cốc cà phê." },
          { hanzi: "我楼下还住着一家中国人。", pinyin: "Wǒ lóu xià hái zhùzhe yì jiā Zhōngguó rén.", vietnamese: "Dưới tầng nhà tôi còn có một gia đình người Trung Quốc đang sinh sống." }
        ]
      },
      {
        id: "hsk2-l14-g2",
        title: "2. 程度副词 '多' - Phó từ chỉ mức độ '多' trong câu cảm thán",
        explanation: "Phó từ '多' được dùng trong các câu cảm thán để biểu thị mức độ rất cao của tính chất hoặc trạng thái (nhiều biết bao, nhường nào). Thường đi kèm trợ từ ngữ khí '啊' ở cuối câu. Cấu trúc: 多 + Tính từ (+ 啊)!",
        examples: [
          { hanzi: "你一个人在这儿多没意思啊！", pinyin: "Nǐ yí gè rén zài zhèr duō méi yìsi a!", vietnamese: "Bạn ở đây một mình buồn chán biết bao nhiêu!" },
          { hanzi: "我们一起去多好啊！", pinyin: "Wǒmen yìqǐ qù duō hǎo a!", vietnamese: "Chúng ta cùng đi thì tốt biết mấy!" },
          { hanzi: "多好看啊！买这件吧。", pinyin: "Duō hǎokàn a! Mǎi zhè jiàn ba.", vietnamese: "Đẹp biết bao! Mua chiếc này đi." }
        ]
      },
      {
        id: "hsk2-l14-g3",
        title: "3. 复合趋向补语 - Bổ ngữ xu hướng kép",
        explanation: "Các động từ như '上, 下, 进, 出, 回, 过' kết hợp với '来' hoặc '去', cùng với '起来', được đặt sau động từ chính để tạo thành bổ ngữ xu hướng kép, biểu thị phương hướng di chuyển cụ thể của hành động. Khi động từ mang tân ngữ chỉ địa điểm thì tân ngữ BẮT BUỘC phải đặt trước '来/去' (ví dụ: 走出教室去). Nếu tân ngữ chỉ sự vật thì có thể đặt trước hoặc sau '来/去'.",
        examples: [
          { hanzi: "她经常跑上来找我玩。", pinyin: "Tā jīngcháng pǎo shànglái zhǎo wǒ wán.", vietnamese: "Bé hay chạy tót lên tìm tôi chơi." },
          { hanzi: "楼不高，我们走上去吧。", pinyin: "Lóu bù gāo, wǒmen zǒu shàngqu ba.", vietnamese: "Tòa nhà không cao lắm, chúng mình đi bộ lên đi." },
          { hanzi: "同学们都走出教室去了。", pinyin: "Tóngxuémen dōu zǒuchū jiàoshì qu le.", vietnamese: "Các bạn học đều đã bước ra khỏi lớp học rồi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l14-w1", hanzi: "站", pinyin: "zhàn", hanViet: "trạm", vietnamese: "đứng (động từ) / trạm xe", hskLevel: 2, radical: "立", strokeCount: 10, example: "站着 / 车站", exampleTranslation: "đang đứng / bến xe", tags: ["Bài 14", "Động từ"] },
      { id: "hsk2-l14-w2", hanzi: "包", pinyin: "bāo", hanViet: "bao", vietnamese: "túi, túi xách, bọc", hskLevel: 2, radical: "勹", strokeCount: 5, example: "书包 / 黑色的包", exampleTranslation: "cặp sách / túi xách màu đen", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk2-l14-w3", hanzi: "过年", pinyin: "guònián", hanViet: "quá niên", vietnamese: "đón Tết, ăn Tết", hskLevel: 2, radical: "辶", strokeCount: 6, example: "回国过年", exampleTranslation: "về nước đón Tết", tags: ["Bài 14", "Động từ"] },
      { id: "hsk2-l14-w4", hanzi: "没意思", pinyin: "méi yìsi", hanViet: "một ý tư", vietnamese: "buồn chán, tẻ nhạt, không thú vị", hskLevel: 2, radical: "氵", strokeCount: 7, example: "真没意思", exampleTranslation: "thật là tẻ nhạt", tags: ["Bài 14", "Tính từ"] },
      { id: "hsk2-l14-w5", hanzi: "位", pinyin: "wèi", hanViet: "vị", vietnamese: "vị, ngài (lượng từ lịch sự chỉ người)", hskLevel: 2, radical: "亻", strokeCount: 7, example: "这位老师", exampleTranslation: "vị giáo viên này", tags: ["Bài 14", "Lượng từ"] },
      { id: "hsk2-l14-w6", hanzi: "前面", pinyin: "qiánmiàn", hanViet: "tiền diện", vietnamese: "phía trước, đằng trước", hskLevel: 2, radical: "刂", strokeCount: 9, example: "走在前面", exampleTranslation: "đi ở phía trước", tags: ["Bài 14", "Phương vị"] },
      { id: "hsk2-l14-w7", hanzi: "房子", pinyin: "fángzi", hanViet: "phòng tử", vietnamese: "ngôi nhà, căn nhà, căn hộ", hskLevel: 2, radical: "户", strokeCount: 8, example: "大房子", exampleTranslation: "ngôi nhà lớn", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk2-l14-w8", hanzi: "小孩儿", pinyin: "xiǎoháir", hanViet: "tiểu hài nhi", vietnamese: "trẻ em, trẻ con", hskLevel: 2, radical: "小", strokeCount: 3, example: "他们家的小孩儿", exampleTranslation: "đứa con nhà họ", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk2-l14-w9", hanzi: "女孩儿", pinyin: "nǚháir", hanViet: "nữ hài nhi", vietnamese: "bé gái, cô gái", hskLevel: 2, radical: "女", strokeCount: 3, example: "漂亮的女孩儿", exampleTranslation: "bé gái xinh xắn", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk2-l14-w10", hanzi: "姓", pinyin: "xìng", hanViet: "tính", vietnamese: "mang họ (động từ) / họ", hskLevel: 2, radical: "女", strokeCount: 8, example: "姓王 / 贵姓", exampleTranslation: "họ Vương / quý tính", tags: ["Bài 14", "Động từ"] },
      { id: "hsk2-l14-w11", hanzi: "眼睛", pinyin: "yǎnjing", hanViet: "nhãn tình", vietnamese: "mắt, đôi mắt", hskLevel: 2, radical: "目", strokeCount: 11, example: "大眼睛", exampleTranslation: "đôi mắt to", tags: ["Bài 14", "Danh từ"] },
      { id: "hsk2-l14-w12", hanzi: "跳舞", pinyin: "tiàowǔ", hanViet: "khiêu vũ", vietnamese: "khiêu vũ, nhảy múa", hskLevel: 2, radical: "足", strokeCount: 13, example: "唱歌跳舞", exampleTranslation: "ca hát nhảy múa", tags: ["Bài 14", "Động từ"] }
    ],
    exercises: [
      {
        id: "hsk2-l14-ex1",
        type: "multiple_choice",
        question: "Chọn câu có cấu trúc câu tồn hiện (存现句) đúng ngữ pháp:",
        options: [
          "A. 楼下站着一个人。",
          "B. 楼下一个人站着呢。",
          "C. 一个人在楼下站。",
          "D. 站着一个人在楼下。"
        ],
        correctAnswer: "A. 楼下站着一个人。",
        explanation: "Cấu trúc câu tồn hiện: Nơi chốn (楼下) + Động từ + 着 (站着) + Người/vật tồn tại (一个人)."
      },
      {
        id: "hsk2-l14-ex2",
        type: "multiple_choice",
        question: "Chọn câu cảm thán đúng khi sử dụng phó từ chỉ mức độ '多':",
        options: [
          "A. 你一个人在这儿多没意思啊！",
          "B. 你一个人在这儿很大没意思啊！",
          "C. 你一个人在这儿多非常有意思！",
          "D. 你一个人在这儿太没意思多！"
        ],
        correctAnswer: "A. 你一个人在这儿多没意思啊！",
        explanation: "Cấu trúc câu cảm thán: 多 + Tính từ/Cụm tính từ + (啊)!"
      },
      {
        id: "hsk2-l14-ex3",
        type: "multiple_choice",
        question: "Điền bổ ngữ xu hướng kép đúng: '孩子们都走出教室 ______ 了。'",
        options: ["A. 去", "B. 跑", "C. 走", "D. 来去"],
        correctAnswer: "A. 去",
        explanation: "Khi động từ mang tân ngữ nơi chốn (教室), tân ngữ phải đứng giữa động từ xu hướng kép: 出 + 教室 + 去."
      },
      {
        id: "hsk2-l14-ex4",
        type: "fill_blank",
        question: "Điền từ thích hợp: '我男朋友 ______ 杨，叫杨同乐。' (Điền chữ Hán chỉ mang họ)",
        options: ["姓", "叫", "是", "名"],
        correctAnswer: "姓",
        explanation: "姓 (xìng): mang họ (ví dụ: 姓杨 - họ Dương)."
      }
    ]
  },

  // LESSON 15
  {
    lessonNumber: 15,
    titleHanzi: "我想再去一次中国",
    titlePinyin: "Wǒ xiǎng zài qù yí cì Zhōngguó",
    titleVietnamese: "Tôi muốn đi Trung Quốc một lần nữa",
    pageStart: 130,
    objectives: [
      "Nghe hiểu và đàm thoại về kế hoạch du lịch (出国, 旅游, 门票, 机票).",
      "Nghe hiểu và sử dụng bổ ngữ động lượng biểu thị số lần xảy ra của hành động (Động từ + 数词 + 次).",
      "Nắm vững cách dùng câu chữ '有' (2) biểu thị đạt đến một số lượng hoặc khoảng thời gian nhất định (有 + Cụm số lượng)."
    ],
    texts: [
      {
        id: "hsk2-l15-t1",
        title: "课文 1: 在教室 (Bài khóa 1: Trong lớp học)",
        context: "在教室，同学们在考试。(Trong lớp học, các bạn học sinh đang thi và chia sẻ dự định sau kỳ thi).",
        lines: [
          { speaker: "王一飞", hanzi: "考试就要开始了，请大家写上姓名，写好后就可以做题了。", pinyin: "Kǎoshì jiù yào kāishǐ le, qǐng dàjiā xiěshàng xìngmíng, xiěhǎo hòu jiù kěyǐ zuò tí le.", vietnamese: "Giờ thi sắp bắt đầu rồi, mời các em ghi rõ họ tên, ghi xong là có thể bắt đầu làm bài nhé." },
          { speaker: "白家月", hanzi: "老师，我做完了。", pinyin: "Lǎoshī, wǒ zuòwán le.", vietnamese: "Thưa cô, em làm bài xong rồi ạ." },
          { speaker: "陈天中", hanzi: "老师，我也做完了。", pinyin: "Lǎoshī, wǒ yě zuòwán le.", vietnamese: "Thưa cô, em cũng làm xong rồi ạ." },
          { speaker: "王一飞", hanzi: "对了，你们考完试想做什么？", pinyin: "Duìle, nǐmen kǎowán shì xiǎng zuò shénme?", vietnamese: "Đúng rồi, thi cử xong xuôi các em định làm gì thế?" },
          { speaker: "白家月", hanzi: "我很想去中国，虽然去过一次，但是很想再去一次。", pinyin: "Wǒ hěn xiǎng qù Zhōngguó, suīrán qùguo yí cì, dànshì hěn xiǎng zài qù yí cì.", vietnamese: "Em rất muốn đi Trung Quốc ạ, tuy đã từng đi một lần nhưng em vẫn rất muốn được đến đó thêm một lần nữa." },
          { speaker: "王一飞", hanzi: "不错，到中国后你就可以经常说中文了。", pinyin: "Búcuò, dào Zhōngguó hòu nǐ jiù kěyǐ jīngcháng shuō Zhōngwén le.", vietnamese: "Ý kiến hay đó, sang tới Trung Quốc rồi em sẽ có nhiều cơ hội thường xuyên rèn luyện nói tiếng Trung." }
        ]
      },
      {
        id: "hsk2-l15-t2",
        title: "课文 2: 在咖啡店 (Bài khóa 2: Ở quán cà phê)",
        context: "在咖啡店，李文和白家月在聊天儿。(Tại quán cà phê, Lý Văn và Bạch Gia Nguyệt đang trò chuyện về kế hoạch du lịch Bắc Kinh sau kỳ thi).",
        lines: [
          { speaker: "白家月", hanzi: "考完试了，我现在可以出国旅游了。", pinyin: "Kǎowán shì le, wǒ xiànzài kěyǐ chūguó lǚyóu le.", vietnamese: "Thi xong rồi, bây giờ tớ có thể đi du lịch nước ngoài rồi." },
          { speaker: "李文", hanzi: "你要去哪儿？", pinyin: "Nǐ yào qù nǎr?", vietnamese: "Cậu định đi đâu thế?" },
          { speaker: "白家月", hanzi: "我要再去一次北京。", pinyin: "Wǒ yào zài qù yí cì Běijīng.", vietnamese: "Tớ muốn đi Bắc Kinh thêm một lần nữa." },
          { speaker: "李文", hanzi: "为什么还去北京？", pinyin: "Wèishénme hái qù Běijīng?", vietnamese: "Sao cậu lại muốn đi Bắc Kinh tiếp thế?" },
          { speaker: "白家月", hanzi: "因为我想再吃一次烤鸭，再喝一次奶茶，再去北京大学看一次电影……", pinyin: "Yīnwèi wǒ xiǎng zài chī yí cì kǎoyā, zài hē yí cì nǎichá, zài qù Běijīng Dàxué kàn yí cì diànyǐng...", vietnamese: "Bởi vì tớ muốn được ăn vịt quay Bắc Kinh một lần nữa, muốn uống trà sữa một lần nữa, và muốn vào Đại học Bắc Kinh xem phim thêm lần nữa..." },
          { speaker: "李文", hanzi: "你想做的事情很多啊！", pinyin: "Nǐ xiǎng zuò de shìqing hěn duō a!", vietnamese: "Những việc cậu muốn làm nhiều thật đấy!" },
          { speaker: "白家月", hanzi: "是啊，你看，我还在网上买好颐和园的门票了呢。", pinyin: "Shì a, nǐ kàn, wǒ hái zài wǎngshang mǎihǎo Yíhé Yuán de ménpiào le ne.", vietnamese: "Đúng vậy, cậu nhìn xem, tớ còn mua xong cả vé tham quan Di Hòa Viên trên mạng rồi kìa." },
          { speaker: "李文", hanzi: "我的高中同学就在颐和园上班，可以让他给你好好介绍介绍。", pinyin: "Wǒ de gāozhōng tóngxué jiù zài Yíhé Yuán shàngbān, kěyǐ ràng tā gěi nǐ hǎohāo jièshào jièshao.", vietnamese: "Bạn học cấp ba của tớ đang làm việc ở Di Hòa Viên đấy, để tớ nhờ cậu ấy hướng dẫn giới thiệu cặn kẽ cho cậu." },
          { speaker: "白家月", hanzi: "太好了！出门旅游，多个朋友多条路。", pinyin: "Tài hǎo le! Chūmén lǚyóu, duō gè péngyou duō tiáo lù.", vietnamese: "Tuyệt vời quá! Ra ngoài đi du lịch, có thêm một người bạn là có thêm một lối đi mà." }
        ]
      },
      {
        id: "hsk2-l15-t3",
        title: "课文 3: 在咖啡店 (Bài khóa 3: Ở quán cà phê)",
        context: "在咖啡店，李文和白家月在聊天儿。(Tại quán cà phê, Lý Văn và Bạch Gia Nguyệt bàn về chuyện mua vé máy bay bay về Bắc Kinh).",
        lines: [
          { speaker: "白家月", hanzi: "李文，你有一年没回国了吧？", pinyin: "Lǐ Wén, nǐ yǒu yì nián méi huíguó le ba?", vietnamese: "Lý Văn, cậu có đến một năm chưa về nước rồi nhỉ?" },
          { speaker: "李文", hanzi: "不到一年。我六月的时候回去了一次。", pinyin: "Bú dào yì nián. Wǒ Liùyuè de shíhou huíqùle yí cì.", vietnamese: "Chưa đến một năm đâu. Hồi tháng sáu tớ có bay về một lần rồi." },
          { speaker: "白家月", hanzi: "我怎么忘了？还是我送你去的机场呢。", pinyin: "Wǒ zěnme wàng le? Hái shì wǒ sòng nǐ qù de jīchǎng ne.", vietnamese: "Sao tớ lại quên mất nhỉ? Hôm đó chính tớ là người tiễn cậu ra tận sân bay mà." },
          { speaker: "李文", hanzi: "是啊。", pinyin: "Shì a.", vietnamese: "Đúng thế mà." },
          { speaker: "白家月", hanzi: "我记得你那次的机票很便宜。", pinyin: "Wǒ jìde nǐ nà cì de jīpiào hěn piányi.", vietnamese: "Tớ nhớ vé máy bay đợt đấy của cậu rẻ lắm." },
          { speaker: "李文", hanzi: "没错，可能因为那个时候去北京的人不多吧。", pinyin: "Méi cuò, kěnéng yīnwèi nàge shíhou qù Běijīng de rén bù duō ba.", vietnamese: "Đúng vậy, chắc là vì đợt đó ít người bay đến Bắc Kinh." },
          { speaker: "白家月", hanzi: "这次的机票虽然有点儿贵，但想到就要飞北京了，我还是很高兴的。", pinyin: "Zhè cì de jīpiào suīrán yǒudiǎnr guì, dàn xiǎngdào jiù yào fēi Běijīng le, wǒ hái shì hěn gāoxìng de.", vietnamese: "Vé máy bay đợt này tuy hơi đắt một chút, nhưng cứ nghĩ sắp được bay đến Bắc Kinh là tớ lại thấy vui phơi phới rồi." }
        ]
      },
      {
        id: "hsk2-l15-t4",
        title: "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
        context: "在房间，李文在写日记。(Trong phòng, Lý Văn viết nhật ký về cảm xúc nhớ nhà và kế hoạch cùng Bạch Gia Nguyệt bay về Bắc Kinh đón Tết).",
        lines: [
          { speaker: "李文", hanzi: "我六月的时候回过一次北京，现在有半年多没回去了，我有点儿想家。就要过年了，我要回家过年。家月这次也要去北京，我们都是星期五的飞机。家月说我们好像小鸟，一起飞到北京，再一起飞回这里。", pinyin: "Wǒ Liùyuè de shíhou huíguo yí cì Běijīng, xiànzài yǒu bàn nián duō méi huíqù le, wǒ yǒudiǎnr xiǎng jiā. Jiù yào guònián le, wǒ yào huí jiā guònián. Jiāyuè zhè cì yě yào qù Běijīng, wǒmen dōu shì Xīngqīwǔ de fēijī. Jiāyuè shuō wǒmen hǎoxiàng xiǎoniǎo, yìqǐ fēidào Běijīng, zài yìqǐ fēihuí zhèlǐ.", vietnamese: "Hồi tháng sáu mình từng về Bắc Kinh một lần, đến nay đã hơn nửa năm chưa về lại rồi, mình thấy hơi nhớ nhà. Sắp đến Tết rồi, mình sẽ về quê ăn Tết. Đợt này Gia Nguyệt cũng đi Bắc Kinh, cả hai đứa mình đều bay chuyến thứ Sáu. Gia Nguyệt bảo tụi mình giống như đôi chim nhỏ, cùng bay tới Bắc Kinh rồi lại cùng nhau bay về lại nơi đây." }
        ]
      }
    ],
    grammarPoints: [
      {
        id: "hsk2-l15-g1",
        title: "1. 动量补语 (1) & (2) - Bổ ngữ động lượng chỉ tần suất",
        explanation: "Cụm 'Số từ + 次' đứng sau động từ để biểu thị số lần thực hiện hành động. Về vị trí của tân ngữ khi câu có bổ ngữ động lượng: (1) Nếu tân ngữ là danh từ chỉ sự vật (烤鸭, 奶茶, 电影), tân ngữ thường đứng sau bổ ngữ động lượng (ví dụ: 吃一次烤鸭). (2) Nếu tân ngữ là đại từ (他, 我, 这儿), tân ngữ bắt buộc đứng trước bổ ngữ động lượng (ví dụ: 找他一次, 来过这儿两次). (3) Nếu tân ngữ là tên người hoặc địa danh (北京, 中国), có thể đặt trước hoặc sau bổ ngữ động lượng đều được (ví dụ: 去过一次北京 / 去过北京一次).",
        examples: [
          { hanzi: "我想去中国，虽然去过一次，但是很想再去一次。", pinyin: "Wǒ xiǎng qù Zhōngguó, suīrán qùguo yí cì, dànshì hěn xiǎng zài qù yí cì.", vietnamese: "Tôi muốn đi Trung Quốc, tuy đã từng đi một lần nhưng rất muốn đi thêm một lần nữa." },
          { hanzi: "我想再吃一次烤鸭，再喝一次奶茶。", pinyin: "Wǒ xiǎng zài chī yí cì kǎoyā, zài hē yí cì nǎichá.", vietnamese: "Tôi muốn ăn vịt quay một lần nữa, uống trà sữa một lần nữa." },
          { hanzi: "我想找他一次。", pinyin: "Wǒ xiǎng zhǎo tā yí cì.", vietnamese: "Tôi muốn tìm anh ấy một lần." },
          { hanzi: "安妮来过这儿两次。", pinyin: "Ānnī láiguo zhèr liǎng cì.", vietnamese: "Annie từng đến đây hai lần." }
        ]
      },
      {
        id: "hsk2-l15-g2",
        title: "2. '有' 字句 (2) - Câu chữ '有' biểu thị đạt đến số lượng/thời gian nhất định",
        explanation: "Cấu trúc '有 + Cụm số lượng' dùng để biểu thị số lượng hoặc khoảng thời gian đã đạt đến một mức độ đáng kể nào đó. Thường dùng trong câu hỏi nghi vấn hoặc câu miêu tả thời gian đã trôi qua.",
        examples: [
          { hanzi: "李文，你有一年没回国了吧？", pinyin: "Lǐ Wén, nǐ yǒu yì nián méi huíguó le ba?", vietnamese: "Lý Văn, cậu có đến một năm chưa về nước rồi nhỉ?" },
          { hanzi: "你女儿今年有10岁了吗？", pinyin: "Nǐ nǚ'ér jīnnián yǒu shí suì le ma?", vietnamese: "Con gái bạn năm nay đã được 10 tuổi chưa?" },
          { hanzi: "现在有半年多没回去了。", pinyin: "Xiànzài yǒu bàn nián duō méi huíqù le.", vietnamese: "Bây giờ đã có hơn nửa năm chưa trở về rồi." }
        ]
      }
    ],
    vocabulary: [
      { id: "hsk2-l15-w1", hanzi: "姓名", pinyin: "xìngmíng", hanViet: "tính danh", vietnamese: "họ và tên", hskLevel: 2, radical: "女", strokeCount: 8, example: "写上姓名", exampleTranslation: "viết họ tên vào", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk2-l15-w2", hanzi: "出国", pinyin: "chūguó", hanViet: "xuất quốc", vietnamese: "ra nước ngoài, xuất ngoại", hskLevel: 2, radical: "凵", strokeCount: 5, example: "出国旅游", exampleTranslation: "đi du lịch nước ngoài", tags: ["Bài 15", "Động từ"] },
      { id: "hsk2-l15-w3", hanzi: "门票", pinyin: "ménpiào", hanViet: "môn phiếu", vietnamese: "vé vào cửa, vé tham quan", hskLevel: 2, radical: "门", strokeCount: 3, example: "公园门票", exampleTranslation: "vé vào công viên", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk2-l15-w4", hanzi: "高中", pinyin: "gāozhōng", hanViet: "cao trung", vietnamese: "trường cấp ba, trường THPT", hskLevel: 2, radical: "高", strokeCount: 10, example: "高中同学", exampleTranslation: "bạn học cấp ba", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk2-l15-w5", hanzi: "出门", pinyin: "chūmén", hanViet: "xuất môn", vietnamese: "ra khỏi nhà, đi xa", hskLevel: 2, radical: "凵", strokeCount: 5, example: "出门旅游", exampleTranslation: "ra ngoài đi du lịch", tags: ["Bài 15", "Động từ"] },
      { id: "hsk2-l15-w6", hanzi: "路", pinyin: "lù", hanViet: "lộ", vietnamese: "con đường, tuyến đường", hskLevel: 2, radical: "足", strokeCount: 13, example: "多条路 / 走路", exampleTranslation: "nhiều lối đi / đi bộ", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk2-l15-w7", hanzi: "机场", pinyin: "jīchǎng", hanViet: "cơ trường", vietnamese: "sân bay, phi trường", hskLevel: 2, radical: "木", strokeCount: 4, example: "去机场接人", exampleTranslation: "đến sân bay đón người", tags: ["Bài 15", "Địa điểm"] },
      { id: "hsk2-l15-w8", hanzi: "机票", pinyin: "jīpiào", hanViet: "cơ phiếu", vietnamese: "vé máy bay", hskLevel: 2, radical: "木", strokeCount: 4, example: "买机票", exampleTranslation: "mua vé máy bay", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk2-l15-w9", hanzi: "飞", pinyin: "fēi", hanViet: "phi", vietnamese: "bay (động từ)", hskLevel: 2, radical: "飞", strokeCount: 3, example: "飞北京 / 飞回这里", exampleTranslation: "bay đến Bắc Kinh / bay về lại đây", tags: ["Bài 15", "Động từ"] },
      { id: "hsk2-l15-w10", hanzi: "好像", pinyin: "hǎoxiàng", hanViet: "hảo tượng", vietnamese: "dường như, giống như", hskLevel: 2, radical: "女", strokeCount: 6, example: "好像小鸟", exampleTranslation: "giống như chú chim nhỏ", tags: ["Bài 15", "Phó từ"] },
      { id: "hsk2-l15-w11", hanzi: "鸟", pinyin: "niǎo", hanViet: "điểu", vietnamese: "con chim", hskLevel: 2, radical: "鸟", strokeCount: 5, example: "小鸟", exampleTranslation: "chú chim nhỏ", tags: ["Bài 15", "Danh từ"] },
      { id: "hsk2-l15-w12", hanzi: "颐和园", pinyin: "Yíhé Yuán", hanViet: "Di Hòa Viên", vietnamese: "Di Hòa Viên (Cung điện Mùa Hè ở Bắc Kinh)", hskLevel: 2, radical: "页", strokeCount: 13, example: "逛颐和园", exampleTranslation: "dạo chơi Di Hòa Viên", tags: ["Bài 15", "Địa danh"] }
    ],
    exercises: [
      {
        id: "hsk2-l15-ex1",
        type: "multiple_choice",
        question: "Chọn trật tự đúng của tân ngữ chỉ sự vật với bổ ngữ động lượng:",
        options: [
          "A. 我想再吃一次烤鸭。",
          "B. 我想再吃烤鸭一次。",
          "C. 我想一次吃再烤鸭。",
          "D. 烤鸭我想再吃一次。"
        ],
        correctAnswer: "A. 我想再吃一次烤鸭。",
        explanation: "Khi tân ngữ là danh từ chỉ sự vật thông thường (烤鸭), tân ngữ thường đứng sau bổ ngữ động lượng (吃一次烤鸭)."
      },
      {
        id: "hsk2-l15-ex2",
        type: "multiple_choice",
        question: "Chọn trật tự đúng của tân ngữ là đại từ với bổ ngữ động lượng:",
        options: [
          "A. 安妮来过这儿两次。",
          "B. 安妮来过两次这儿。",
          "C. 安妮两次来过这儿。",
          "D. 这儿安妮两次来过。"
        ],
        correctAnswer: "A. 安妮来过这儿两次。",
        explanation: "Khi tân ngữ là đại từ (这儿, 他, 我), tân ngữ bắt buộc đứng trước bổ ngữ động lượng (来过这儿两次, 找他一次)."
      },
      {
        id: "hsk2-l15-ex3",
        type: "multiple_choice",
        question: "Điền từ thích hợp vào câu chữ '有' biểu thị đạt đến thời gian nhất định: '李文，你 ______ 一年没回国了吧？'",
        options: ["A. 有", "B. 在", "C. 是", "D. 会"],
        correctAnswer: "A. 有",
        explanation: "Cấu trúc '有 + Cụm số lượng' dùng để biểu thị đạt tới một khoảng thời gian nhất định (有一年没回国了)."
      },
      {
        id: "hsk2-l15-ex4",
        type: "fill_blank",
        question: "Điền từ thích hợp: '考试就要开始了，请大家写上 ______ (họ tên)。' (Điền chữ Hán)",
        options: ["姓名", "名字", "同学", "老师"],
        correctAnswer: "姓名",
        explanation: "姓名 (xìngmíng): họ và tên."
      }
    ],
    cultureBonus: {
      title: "🎉 祝贺完成新 HSK 2 全部 15 课！ (Chúc mừng hoàn thành toàn bộ 15 bài HSK 2!)",
      summary: "Bạn đã xuất sắc chinh phục trọn vẹn 15 bài học chuẩn giáo trình Bắc Ngữ BLCUP!",
      content: "Với vốn từ vựng nền tảng vững chắc, toàn bộ các điểm ngữ pháp trọng yếu (câu chữ 比, câu chữ 有, câu tồn hiện, câu hai tân ngữ, bổ ngữ xu hướng kép, bổ ngữ động lượng...) cùng phát âm chuẩn studio voice, bạn đã hoàn toàn sẵn sàng tự tin bước tiếp lên hành trình New HSK 3!"
    }
  }

];

export function getAllNewHsk2Vocabulary(): WordItem[] {
  const allVocab: WordItem[] = [];
  const seen = new Set<string>();
  for (const lesson of NEW_HSK2_FULL_LESSONS) {
    for (const word of lesson.vocabulary) {
      if (!seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        allVocab.push(word);
      }
    }
  }
  return allVocab;
}
