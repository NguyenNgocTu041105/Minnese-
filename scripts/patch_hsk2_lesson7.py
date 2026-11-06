# -*- coding: utf-8 -*-
import re

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

l7_replacement = """  // LESSON 7
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
  },"""

pattern = r"\s*// LESSON 7.*?(?=\s*// LESSON 8)"
replacement = "\n" + l7_replacement + "\n"

if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Replaced Lesson 7 successfully with regex!")
else:
    p1 = content.find("// LESSON 7")
    p2 = content.find("// LESSON 8")
    if p1 != -1 and p2 != -1:
        content = content[:p1] + l7_replacement + "\n\n  " + content[p2:]
        print("Replaced Lesson 7 with substring slicing!")

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated newHsk2BookData.ts for Lesson 7!")
