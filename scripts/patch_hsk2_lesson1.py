# -*- coding: utf-8 -*-
import sys

def patch():
    lesson1_code = '''  // LESSON 1
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
  },'''

    with open('src/data/newHsk2BookData.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find start of Lesson 1 and start of Lesson 2
    l1_start = content.find('  // LESSON 1')
    l2_start = content.find('  // LESSON 2')

    if l1_start != -1 and l2_start != -1:
        new_content = content[:l1_start] + lesson1_code.strip() + '\n\n' + content[l2_start:]
        with open('src/data/newHsk2BookData.ts', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Updated Lesson 1 in newHsk2BookData.ts successfully!")
    else:
        print("Could not find lesson markers in newHsk2BookData.ts")

if __name__ == '__main__':
    patch()
