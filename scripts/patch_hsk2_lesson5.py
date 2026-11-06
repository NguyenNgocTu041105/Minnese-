# -*- coding: utf-8 -*-
import re

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

l5_replacement = """  // LESSON 5
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
  },"""

pattern = r"\s*// LESSON 5.*?(?=\s*// LESSON 6)"
replacement = "\n" + l5_replacement + "\n"

if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Replaced Lesson 5 successfully with regex!")
else:
    p1 = content.find("// LESSON 5")
    p2 = content.find("// LESSON 6")
    if p1 != -1 and p2 != -1:
        content = content[:p1] + l5_replacement + "\n\n  " + content[p2:]
        print("Replaced Lesson 5 with substring slicing!")

with open(r'd:\minnese\src\data\newHsk2BookData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated newHsk2BookData.ts for Lesson 5!")
