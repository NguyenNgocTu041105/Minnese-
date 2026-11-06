# -*- coding: utf-8 -*-
import re

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Lesson 2 with full 3.0 curriculum data
l2_replacement = """  // LESSON 2
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
  },"""

# Regex match from // LESSON 2 to // LESSON 3
pattern = r"  // LESSON 2\s*\{.*?  // LESSON 3"
replacement = l2_replacement + "\n\n  // LESSON 3"

if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Replaced Lesson 2 successfully with regex!")
else:
    print("Pattern not matched, searching fallback...")
    # fallback find
    p1 = content.find("// LESSON 2")
    p2 = content.find("// LESSON 3")
    if p1 != -1 and p2 != -1:
        content = content[:p1] + l2_replacement + "\n\n" + content[p2:]
        print("Replaced Lesson 2 with substring slicing!")

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated newHsk2BookData.ts!")
