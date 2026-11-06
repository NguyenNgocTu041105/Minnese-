# -*- coding: utf-8 -*-
import re

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

l3_replacement = """  // LESSON 3
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
  },"""

pattern = r"  // LESSON 3\s*\{.*?  // LESSON 4"
replacement = l3_replacement + "\n\n  // LESSON 4"

if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Replaced Lesson 3 successfully with regex!")
else:
    p1 = content.find("// LESSON 3")
    p2 = content.find("// LESSON 4")
    if p1 != -1 and p2 != -1:
        content = content[:p1] + l3_replacement + "\n\n" + content[p2:]
        print("Replaced Lesson 3 with substring slicing!")

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated newHsk2BookData.ts for Lesson 3!")
