# -*- coding: utf-8 -*-
import re

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

l6_replacement = """  // LESSON 6
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
  },"""

pattern = r"\s*// LESSON 6.*?(?=\s*// LESSON 7)"
replacement = "\n" + l6_replacement + "\n"

if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Replaced Lesson 6 successfully with regex!")
else:
    p1 = content.find("// LESSON 6")
    p2 = content.find("// LESSON 7")
    if p1 != -1 and p2 != -1:
        content = content[:p1] + l6_replacement + "\n\n  " + content[p2:]
        print("Replaced Lesson 6 with substring slicing!")

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated newHsk2BookData.ts for Lesson 6!")
