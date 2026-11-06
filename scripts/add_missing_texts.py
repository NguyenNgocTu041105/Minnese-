# -*- coding: utf-8 -*-
"""
Add missing lesson texts (t3 for L7-L14, t2+t3 for L10/L13, t3 for L15)
to newHsk1BookData.ts. These texts didn't exist in the old data.
"""
import sys

TARGET = r"d:\minnese\src\data\newHsk1BookData.ts"

# New text blocks to inject, keyed by (lesson, insert_after_id)
# Format: (after_id, new_text_ts_string)
NEW_TEXTS = [
    # L7 - add t3 after t2
    ("hsk1-l7-t2", """      {
        id: "hsk1-l7-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "王一雪给丈夫刘明打电话。(Vương Nhất Tuyết gọi điện cho chồng là Lưu Minh.)",
        lines: [
          { speaker: "王一雪", hanzi: "喂，你在哪儿呢？", pinyin: "Wèi, nǐ zài nǎr ne?", vietnamese: "A-lô, anh đang ở đâu vậy?" },
          { speaker: "刘明", hanzi: "我在家里呢。", pinyin: "Wǒ zài jiā li ne.", vietnamese: "Anh đang ở nhà." },
          { speaker: "王一雪", hanzi: "我晚上六点半下班。", pinyin: "Wǒ wǎnshang liù diǎn bàn xiàbān.", vietnamese: "Em tan ca lúc sáu rưỡi tối." },
          { speaker: "刘明", hanzi: "我八点去医院上班。", pinyin: "Wǒ bā diǎn qù yīyuàn shàngbān.", vietnamese: "Anh đi làm ở bệnh viện lúc tám giờ." },
          { speaker: "王一雪", hanzi: "好的，你去店里买些菜吧。", pinyin: "Hǎo de, nǐ qù diàn lǐ mǎi xiē cài ba.", vietnamese: "Được rồi, anh ra cửa hàng mua ít rau nhé." },
          { speaker: "刘明", hanzi: "好，我十分钟后去。", pinyin: "Hǎo, wǒ shí fēnzhōng hòu qù.", vietnamese: "Được, mười phút nữa anh đi." }
        ]
      }"""),

    # L8 - add t3 after t2
    ("hsk1-l8-t2", """      {
        id: "hsk1-l8-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在医院里，刘明和同事小胡聊天儿。(Ở bệnh viện, Lưu Minh trò chuyện với đồng nghiệp là tiểu Hồ.)",
        lines: [
          { speaker: "刘明", hanzi: "小胡，还没吃饭呢？", pinyin: "Xiǎo Hú, hái méi chīfàn ne?", vietnamese: "Tiểu Hồ, chưa ăn cơm à?" },
          { speaker: "小胡", hanzi: "没吃呢。", pinyin: "Méi chī ne.", vietnamese: "Chưa ăn." },
          { speaker: "刘明", hanzi: "大医院病人多，医生非常忙。", pinyin: "Dà yīyuàn bìngrén duō, yīshēng fēicháng máng.", vietnamese: "Bệnh viện lớn bệnh nhân nhiều, bác sĩ rất bận." },
          { speaker: "小胡", hanzi: "是的。我爸爸也在医院工作，他也非常忙。", pinyin: "Shì de. Wǒ bàba yě zài yīyuàn gōngzuò, tā yě fēicháng máng.", vietnamese: "Đúng vậy. Bố tôi cũng làm ở bệnh viện, ông ấy cũng rất bận." },
          { speaker: "刘明", hanzi: "你家有两个医生？", pinyin: "Nǐ jiā yǒu liǎng gè yīshēng?", vietnamese: "Nhà bạn có hai bác sĩ à?" },
          { speaker: "小胡", hanzi: "对。", pinyin: "Duì.", vietnamese: "Đúng vậy." }
        ]
      }"""),

    # L9 - add t3 after t2
    ("hsk1-l9-t2", """      {
        id: "hsk1-l9-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在公司里，王一雪和杨同乐休息时聊天儿，谈论周末生活。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao về cuộc sống cuối tuần.)",
        lines: [
          { speaker: "王一雪", hanzi: "明天星期六，你做什么？", pinyin: "Míngtiān Xīngqīliù, nǐ zuò shénme?", vietnamese: "Ngày mai thứ Bảy, bạn làm gì?" },
          { speaker: "杨同乐", hanzi: "我白天在家里读书，晚上和朋友们去外边唱歌。", pinyin: "Wǒ báitiān zài jiā lǐ dúshū, wǎnshang hé péngyoumen qù wàibian chàng gē.", vietnamese: "Tôi ban ngày ở nhà đọc sách, tối đi hát với bạn bè." },
          { speaker: "王一雪", hanzi: "你唱歌很好听。", pinyin: "Nǐ chànggē hěn hǎotīng.", vietnamese: "Bạn hát rất hay." },
          { speaker: "杨同乐", hanzi: "谢谢！您星期六做什么？", pinyin: "Xièxie! Nín Xīngqīliù zuò shénme?", vietnamese: "Cảm ơn! Thứ Bảy chị làm gì?" },
          { speaker: "王一雪", hanzi: "我在家里做饭，看电视，和孩子们、小狗玩。", pinyin: "Wǒ zài jiā lǐ zuòfàn, kàn diànshì, hé háizimen, xiǎo gǒu wán.", vietnamese: "Tôi ở nhà nấu ăn, xem TV, chơi với các con và cún nhỏ." },
          { speaker: "杨同乐", hanzi: "我也有一只小狗。", pinyin: "Wǒ yě yǒu yī zhī xiǎo gǒu.", vietnamese: "Tôi cũng có một con cún nhỏ." }
        ]
      }"""),

    # L10 - add t2 and t3 after t1
    ("hsk1-l10-t1", """      {
        id: "hsk1-l10-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在集市上，王一雪在买水果。(Ở chợ, Vương Nhất Tuyết đang mua hoa quả.)",
        lines: [
          { speaker: "王一雪", hanzi: "这儿的水果真不少！", pinyin: "Zhèr de shuǐguǒ zhēn bù shǎo!", vietnamese: "Hoa quả ở đây thật là nhiều!" },
          { speaker: "摊主", hanzi: "您想买什么？", pinyin: "Nín xiǎng mǎi shénme?", vietnamese: "Bà muốn mua gì ạ?" },
          { speaker: "王一雪", hanzi: "我想买两斤苹果。", pinyin: "Wǒ xiǎng mǎi liǎng jīn píngguǒ.", vietnamese: "Tôi muốn mua hai cân táo." },
          { speaker: "摊主", hanzi: "苹果三块五一斤。这些七块二，七块钱吧。", pinyin: "Píngguǒ sān kuài wǔ yī jīn. Zhèxiē qī kuài èr, qī kuài qián ba.", vietnamese: "Táo ba phẩy năm tệ một cân. Những quả này bảy phẩy hai tệ, bảy tệ thôi nhé." },
          { speaker: "王一雪", hanzi: "好的，这儿的苹果真便宜！", pinyin: "Hǎo de, zhèr de píngguǒ zhēn piányí!", vietnamese: "Được rồi, táo ở đây thật rẻ!" }
        ]
      },
      {
        id: "hsk1-l10-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在商场里，刘明和王一雪在给孩子们买衣服。(Ở trung tâm thương mại, Lưu Minh và Vương Nhất Tuyết đang mua quần áo cho các con.)",
        lines: [
          { speaker: "王一雪", hanzi: "这家商店衣服真多！这件一百元，怎么样？", pinyin: "Zhè jiā shāngdiàn yīfu zhēn duō! Zhè jiàn yī bǎi yuán, zěnmeyàng?", vietnamese: "Cửa hàng này quần áo thật nhiều! Cái này một trăm tệ, thế nào?" },
          { speaker: "刘明", hanzi: "好看，也不贵。", pinyin: "Hǎokàn, yě bù guì.", vietnamese: "Đẹp, cũng không đắt." },
          { speaker: "王一雪", hanzi: "小雪能穿，买一件吧。", pinyin: "Xiǎo Xuě néng chuān, mǎi yī jiàn ba.", vietnamese: "Tiểu Tuyết mặc được, mua một cái nhé." },
          { speaker: "刘明", hanzi: "好的。小明能穿吗？", pinyin: "Hǎo de. Xiǎo Míng néng chuān ma?", vietnamese: "Được. Tiểu Minh mặc được không?" },
          { speaker: "王一雪", hanzi: "不能。这些是女孩子穿的衣服，男孩子的衣服在那儿。", pinyin: "Bù néng. Zhèxiē shì nǚ háizi chuān de yīfu, nán háizi de yīfu zài nàr.", vietnamese: "Không được. Những cái này là quần áo con gái, quần áo con trai ở kia." },
          { speaker: "刘明", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Được rồi." }
        ]
      }"""),

    # L11 - add t3 after t2
    ("hsk1-l11-t2", """      {
        id: "hsk1-l11-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "星期六早上，刘明要去医院加班，出门前和女儿聊天儿。(Sáng thứ Bảy, Lưu Minh sắp đi làm thêm giờ ở bệnh viện, trước khi ra ngoài trò chuyện với con gái.)",
        lines: [
          { speaker: "刘明", hanzi: "弟弟起床没起床呢？", pinyin: "Dìdi qǐchuáng méi qǐchuáng ne?", vietnamese: "Em trai dậy chưa?" },
          { speaker: "刘小雪", hanzi: "没起床呢，还在睡觉。", pinyin: "Méi qǐchuáng ne, hái zài shuìjiào.", vietnamese: "Chưa dậy, vẫn còn ngủ." },
          { speaker: "刘明", hanzi: "还睡呢？他今天去不去哪里？", pinyin: "Hái shuì ne? Tā jīntiān qù bu qù nǎlǐ?", vietnamese: "Còn ngủ à? Hôm nay nó có đi đâu không?" },
          { speaker: "刘小雪", hanzi: "去哪里？", pinyin: "Qù nǎlǐ?", vietnamese: "Đi đâu ấy?" },
          { speaker: "刘明", hanzi: "去超市。", pinyin: "Qù chāoshì.", vietnamese: "Đi siêu thị." },
          { speaker: "刘小雪", hanzi: "我昨天晚问他，他对我说，他不去，他今天要和小朋友玩。", pinyin: "Wǒ zuótiān wǎn wèn tā, tā duì wǒ shuō, tā bù qù, tā jīntiān yào hé xiǎopéngyou wán.", vietnamese: "Tối qua tôi có hỏi nó, nó nói với tôi rằng nó không đi, hôm nay nó muốn chơi với bạn nhỏ." }
        ]
      }"""),

    # L12 - add t3 after t2
    ("hsk1-l12-t2", """      {
        id: "hsk1-l12-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "昨天在医院里，医生给杨同乐看病。(Hôm qua ở bệnh viện, bác sĩ khám bệnh cho Dương Đồng Nhạc.)",
        lines: [
          { speaker: "杨同乐", hanzi: "医生，我病了。", pinyin: "Yīshēng, wǒ bìng le.", vietnamese: "Bác sĩ ơi, tôi bị ốm rồi." },
          { speaker: "医生", hanzi: "我看看。你觉得怎么样？", pinyin: "Wǒ kànkan. Nǐ juéde zěnmeyàng?", vietnamese: "Để tôi xem. Bạn cảm thấy thế nào?" },
          { speaker: "杨同乐", hanzi: "我很冷。", pinyin: "Wǒ hěn lěng.", vietnamese: "Tôi rất lạnh." },
          { speaker: "医生", hanzi: "好的，吃一点儿药，今天休息半天吧。", pinyin: "Hǎo de, chī yīdiǎnr yào, jīntiān xiūxi bàn tiān ba.", vietnamese: "Được rồi, uống một ít thuốc, hôm nay nghỉ nửa ngày nhé." },
          { speaker: "杨同乐", hanzi: "好的。", pinyin: "Hǎo de.", vietnamese: "Được rồi." },
          { speaker: "医生", hanzi: "回家后再喝些热水。", pinyin: "Huí jiā hòu zài hē xiē rè shuǐ.", vietnamese: "Về nhà nhớ uống thêm nước ấm nhé." }
        ]
      }"""),

    # L13 - add t2 and t3 after t1
    ("hsk1-l13-t1", """      {
        id: "hsk1-l13-t2",
        title: "课文 2 (Bài khóa 2)",
        context: "在咖啡馆里，王一雪想吃早饭。(Ở quán cà phê, Vương Nhất Tuyết muốn ăn sáng.)",
        lines: [
          { speaker: "服务员", hanzi: "女士，请坐！您喝什么？", pinyin: "Nǚshì, qǐng zuò! Nín hē shénme?", vietnamese: "Thưa cô, mời ngồi! Cô muốn uống gì?" },
          { speaker: "王一雪", hanzi: "我看一下。请给我一杯牛奶。", pinyin: "Wǒ kàn yīxià. Qǐng gěi wǒ yī bēi niúnǎi.", vietnamese: "Để tôi xem đã. Làm ơn cho tôi một ly sữa." },
          { speaker: "服务员", hanzi: "好的。您还要什么？", pinyin: "Hǎo de. Nín hái yào shénme?", vietnamese: "Được ạ. Cô còn muốn gì nữa không?" },
          { speaker: "王一雪", hanzi: "我还没吃早饭，再要这个面包和鸡蛋吧。", pinyin: "Wǒ hái méi chī zǎofàn, zài yào zhège miànbāo hé jīdàn ba.", vietnamese: "Tôi chưa ăn sáng, cho thêm bánh mì và trứng này nhé." }
        ]
      },
      {
        id: "hsk1-l13-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在餐厅里，刘明在点餐。(Ở nhà hàng, Lưu Minh đang gọi đồ ăn.)",
        lines: [
          { speaker: "服务员", hanzi: "先生，请坐！您要什么？", pinyin: "Xiānsheng, qǐng zuò! Nín yào shénme?", vietnamese: "Thưa anh, mời ngồi! Anh muốn gì ạ?" },
          { speaker: "刘明", hanzi: "我要一斤饺子。", pinyin: "Wǒ yào yī jīn jiǎozi.", vietnamese: "Cho tôi một cân sủi cảo." },
          { speaker: "服务员", hanzi: "好的。一斤饺子40个。", pinyin: "Hǎo de. Yī jīn jiǎozi sìshí gè.", vietnamese: "Vâng. Một cân sủi cảo là 40 cái." },
          { speaker: "刘明", hanzi: "40个太多了，我要一半吧。", pinyin: "Sìshí gè tài duō le, wǒ yào yībàn ba.", vietnamese: "40 cái nhiều quá, cho tôi một nửa thôi." },
          { speaker: "服务员", hanzi: "半斤20个。您想喝什么？", pinyin: "Bàn jīn èrshí gè. Nín xiǎng hē shénme?", vietnamese: "Nửa cân 20 cái. Anh muốn uống gì?" },
          { speaker: "刘明", hanzi: "请给我一杯茶吧。", pinyin: "Qǐng gěi wǒ yī bēi chá ba.", vietnamese: "Làm ơn cho tôi một chén trà nhé." }
        ]
      }"""),

    # L14 - add t3 after t2
    ("hsk1-l14-t2", """      {
        id: "hsk1-l14-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在家里，刘明和王一雪在谈论孩子的升学情况。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang nói về việc con cái lên cấp học mới.)",
        lines: [
          { speaker: "刘明", hanzi: "明年女儿上中学。", pinyin: "Míngnián nǚ'ér shàng zhōngxué.", vietnamese: "Năm sau con gái lên trung học." },
          { speaker: "王一雪", hanzi: "对。儿子也上小学了。", pinyin: "Duì. Érzi yě shàng xiǎoxué le.", vietnamese: "Đúng rồi. Con trai cũng vào tiểu học rồi." },
          { speaker: "刘明", hanzi: "我们家有了一个中学生。", pinyin: "Wǒmen jiā yǒule yī gè zhōngxuéshēng.", vietnamese: "Nhà mình có một học sinh trung học rồi." },
          { speaker: "王一雪", hanzi: "还有了一个小学生。", pinyin: "Hái yǒule yī gè xiǎoxuéshēng.", vietnamese: "Còn thêm một học sinh tiểu học nữa." },
          { speaker: "刘明", hanzi: "上学后，他们都忙了。", pinyin: "Shàngxué hòu, tāmen dōu máng le.", vietnamese: "Sau khi đi học, chúng đều bận rồi." },
          { speaker: "王一雪", hanzi: "是的。太晚了，睡觉吧。", pinyin: "Shì de. Tài wǎn le, shuìjiào ba.", vietnamese: "Đúng vậy. Muộn rồi, đi ngủ thôi." }
        ]
      }"""),

    # L15 - add t3 after t2
    ("hsk1-l15-t2", """      {
        id: "hsk1-l15-t3",
        title: "课文 3 (Bài khóa 3)",
        context: "在教室外，白家月、安妮和王老师在谈论去北京旅游的事。(Ngoài lớp học, Bạch Gia Nguyệt, An Ni và thầy Vương đang nói về chuyện đi du lịch Bắc Kinh.)",
        lines: [
          { speaker: "王一飞", hanzi: "你们的飞机到北京要几个小时？", pinyin: "Nǐmen de fēijī dào Běijīng yào jǐ gè xiǎoshí?", vietnamese: "Chuyến bay của các em đến Bắc Kinh mất mấy tiếng?" },
          { speaker: "白家月", hanzi: "九个小时。", pinyin: "Jiǔ gè xiǎoshí.", vietnamese: "Chín tiếng ạ." },
          { speaker: "王一飞", hanzi: "我家人都在北京，星期天我姐姐也有时间，她可以去机场接你们，你们也可以住我家。", pinyin: "Wǒ jiārén dōu zài Běijīng, Xīngqītiān wǒ jiějie yě yǒu shíjiān, tā kěyǐ qù jīchǎng jiē nǐmen, nǐmen yě kěyǐ zhù wǒ jiā.", vietnamese: "Gia đình thầy đều ở Bắc Kinh, Chủ nhật chị gái thầy cũng có thời gian, chị ấy có thể ra sân bay đón các em, các em cũng có thể ở nhà thầy." },
          { speaker: "安妮", hanzi: "我们星期日早上八点到大兴机场，早不早？", pinyin: "Wǒmen Xīngqīrì zǎoshang bā diǎn dào Dàxīng Jīchǎng, zǎo bu zǎo?", vietnamese: "Chúng em đến sân bay Đại Hưng lúc tám giờ sáng Chủ nhật, có sớm không ạ?" },
          { speaker: "王一飞", hanzi: "不早。", pinyin: "Bù zǎo.", vietnamese: "Không sớm đâu." },
          { speaker: "白家月", hanzi: "谢谢老师！那我们和您姐姐在大兴机场见！", pinyin: "Xièxie lǎoshī! Nà wǒmen hé nín jiějie zài Dàxīng Jīchǎng jiàn!", vietnamese: "Cảm ơn thầy! Vậy chúng em sẽ gặp chị thầy ở sân bay Đại Hưng!" }
        ]
      }"""),
]

def main():
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    inserted = 0

    for after_id, new_text_block in NEW_TEXTS:
        # Find the closing brace of the text with this id
        marker = f'id: "{after_id}"'
        pos = content.find(marker)
        if pos < 0:
            print(f"WARNING: '{after_id}' not found, skipping!")
            continue

        # Find the end of this object: look for the matching closing brace
        # The text block starts with { and ends with }
        # Find the { before the id: marker (going backwards)
        brace_open = content.rfind("{", 0, pos)
        depth = 0
        i = brace_open
        while i < len(content):
            if content[i] == "{":
                depth += 1
            elif content[i] == "}":
                depth -= 1
                if depth == 0:
                    brace_close = i
                    break
            i += 1

        # Insert new text after brace_close
        insert_pos = brace_close + 1
        # Check if next significant char is a comma (then we just add after)
        # We want: ...existing_text},\n      new_text,\n...
        # Find next non-whitespace after brace_close
        j = insert_pos
        while j < len(content) and content[j] in " \t\r\n":
            j += 1

        if content[j] == ",":
            # Already has comma, insert after the comma
            insert_at = j + 1
            new_insertion = "\n" + new_text_block + ","
        elif content[j] == "]":
            # Last item in array, need to add comma to existing, then new item (no trailing comma)
            # Insert before the ]
            insert_at = j
            new_insertion = ",\n" + new_text_block + "\n"
        else:
            insert_at = insert_pos
            new_insertion = ",\n" + new_text_block

        content = content[:insert_at] + new_insertion + content[insert_at:]
        print(f"  Inserted text after {after_id}")
        inserted += 1

    if inserted == 0:
        print("No insertions made!")
    else:
        with open(TARGET, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"\nDone! Inserted {inserted} new text blocks into {TARGET}")

if __name__ == "__main__":
    main()
