# -*- coding: utf-8 -*-
"""
Patch newHsk1BookData.ts with correct dialogue data for lessons 5-15
extracted directly from the HSK1 textbook PDF pages.
"""
import re, sys, os

TARGET = r"d:\minnese\src\data\newHsk1BookData.ts"

# ============================================================
# CORRECT DATA from PDF (verified against actual book pages)
# ============================================================

# Each entry: id -> (context, lines)
# lines: list of (speaker, hanzi, pinyin, vietnamese)
CORRECT_TEXTS = {
    # ----- LESSON 5 -----
    "hsk1-l5-t1": {
        "context": "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang trò chuyện.)",
        "lines": [
            ("王一雪", "今天几号？", "Jīntiān jǐ hào?", "Hôm nay ngày mấy?"),
            ("刘明", "今天9月8号。", "Jīntiān jiǔ yuè bā hào.", "Hôm nay ngày 8 tháng 9."),
            ("王一雪", "星期几？", "Xīngqī jǐ?", "Thứ mấy?"),
            ("刘明", "星期日。今天我休息。", "Xīngqīrì. Jīntiān wǒ xiūxi.", "Chủ nhật. Hôm nay tôi nghỉ."),
        ],
    },
    "hsk1-l5-t2": {
        "context": "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao.)",
        "lines": [
            ("王一雪", "你会做饭吗？", "Nǐ huì zuòfàn ma?", "Bạn có biết nấu ăn không?"),
            ("杨同乐", "我会做。", "Wǒ huì zuò.", "Tôi biết nấu."),
            ("王一雪", "你会做什么？", "Nǐ huì zuò shénme?", "Bạn biết làm món gì?"),
            ("杨同乐", "我会做面条儿、饺子，也会做一些菜。星期天我也做饭。",
             "Wǒ huì zuò miàntiáor, jiǎozi, yě huì zuò yīxiē cài. Xīngqītiān wǒ yě zuòfàn.",
             "Tôi biết làm mì, sủi cảo và cũng biết làm một số món. Chủ nhật tôi cũng nấu ăn."),
        ],
    },
    "hsk1-l5-t3": {
        "context": "在公司里，王一雪和杨同乐下班时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc nói chuyện lúc tan ca.)",
        "lines": [
            ("王一雪", "同乐，下班吗？", "Tónglè, xiàbān ma?", "Đồng Nhạc, tan ca rồi à?"),
            ("杨同乐", "下班。", "Xiàbān.", "Tan ca rồi."),
            ("王一雪", "这是你的新电脑吗？", "Zhè shì nǐ de xīn diànnǎo ma?", "Đây là máy tính mới của bạn à?"),
            ("杨同乐", "是的，是我的新电脑。", "Shì de, shì wǒ de xīn diànnǎo.", "Vâng, đây là máy tính mới của tôi."),
            ("王一雪", "真好看！", "Zhēn hǎokàn!", "Đẹp thật!"),
            ("杨同乐", "我也很喜欢它。", "Wǒ yě hěn xǐhuan tā.", "Tôi cũng rất thích nó."),
        ],
    },
    # ----- LESSON 6 -----
    "hsk1-l6-t1": {
        "context": "在校园里，李文向白家月要手机号。(Trong khuôn viên trường, Lý Văn hỏi xin số điện thoại của Bạch Gia Nguyệt.)",
        "lines": [
            ("李文", "家月，你的手机号是多少？", "Jiāyuè, nǐ de shǒujīhào shì duōshao?", "Gia Nguyệt, số điện thoại của bạn là bao nhiêu?"),
            ("白家月", "我的手机号是+33 601493190。", "Wǒ de shǒujīhào shì +33 601493190.", "Số điện thoại của tôi là +33 601493190."),
            ("李文", "我的手机号是+86 13552721160。", "Wǒ de shǒujīhào shì +86 13552721160.", "Số điện thoại của tôi là +86 13552721160."),
            ("白家月", "好的。", "Hǎo de.", "Được rồi."),
        ],
    },
    "hsk1-l6-t2": {
        "context": "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
        "lines": [
            ("陈天中", "家月，明天你去哪儿？", "Jiāyuè, míngtiān nǐ qù nǎr?", "Gia Nguyệt, ngày mai bạn đi đâu?"),
            ("白家月", "我想去超市买东西。", "Wǒ xiǎng qù chāoshì mǎi dōngxi.", "Tôi muốn đi siêu thị mua đồ."),
            ("陈天中", "你去超市买什么？", "Nǐ qù chāoshì mǎi shénme?", "Bạn đi siêu thị mua gì vậy?"),
            ("白家月", "我想买些牛奶。", "Wǒ xiǎng mǎi xiē niúnǎi.", "Tôi muốn mua sữa."),
        ],
    },
    "hsk1-l6-t3": {
        "context": "在家里，王一雪全家在讨论周末晚餐安排。(Ở nhà, cả gia đình Vương Nhất Tuyết bàn về kế hoạch ăn tối cuối tuần.)",
        "lines": [
            ("王一雪", "星期天我们去哪儿吃晚饭？", "Xīngqītiān wǒmen qù nǎr chī wǎnfàn?", "Chủ nhật chúng ta đi đâu ăn tối?"),
            ("刘明", "我还想去西安饭店。", "Wǒ hái xiǎng qù Xī'ān fàndiàn.", "Anh vẫn muốn đến nhà hàng Tây An."),
            ("刘小雪", "那边的包子非常好吃，我想吃包子。", "Nà biān de bāozi fēicháng hǎochī, wǒ xiǎng chī bāozi.", "Bánh bao ở đó ngon lắm, con muốn ăn bánh bao."),
            ("刘小明", "妈妈，我想吃米饭，不想吃包子。", "Māma, wǒ xiǎng chī mǐfàn, bù xiǎng chī bāozi.", "Mẹ ơi, con muốn ăn cơm, không muốn ăn bánh bao."),
            ("王一雪", "好的。我们怎么去？", "Hǎo de. Wǒmen zěnme qù?", "Được rồi. Chúng ta đi thế nào?"),
            ("刘明", "坐出租车去。", "Zuò chūzūchē qù.", "Đi taxi đi."),
        ],
    },
    # ----- LESSON 7 -----
    "hsk1-l7-t1": {
        "context": "白家月和安妮在打电话。(Bạch Gia Nguyệt và An Ni đang gọi điện thoại cho nhau.)",
        "lines": [
            ("白家月", "现在几点？", "Xiànzài jǐ diǎn?", "Bây giờ là mấy giờ?"),
            ("安妮", "早上八点四十。", "Zǎoshang bā diǎn sìshí.", "Sáng tám giờ bốn mươi phút."),
            ("白家月", "我上午十点十分有课。", "Wǒ shàngwǔ shí diǎn shí fēn yǒu kè.", "Tôi có lớp học lúc mười giờ mười phút sáng."),
            ("安妮", "好的，我们下午两点见吧。", "Hǎo de, wǒmen xiàwǔ liǎng diǎn jiàn ba.", "Được rồi, chúng ta gặp nhau lúc hai giờ chiều nhé."),
        ],
    },
    "hsk1-l7-t2": {
        "context": "在校园里，李文遇到白家月。(Trong khuôn viên trường, Lý Văn tình cờ gặp Bạch Gia Nguyệt.)",
        "lines": [
            ("李文", "下午我想去电影院看电影，你去吗？", "Xiàwǔ wǒ xiǎng qù diànyǐngyuàn kàn diànyǐng, nǐ qù ma?", "Chiều nay tôi muốn đi rạp xem phim, bạn có đi không?"),
            ("白家月", "我不想去，下午还有事。", "Wǒ bù xiǎng qù, xiàwǔ hái yǒu shì.", "Tôi không muốn đi, chiều còn có việc."),
            ("李文", "好的。明天呢？", "Hǎo de. Míngtiān ne?", "Được rồi. Còn ngày mai thì sao?"),
            ("白家月", "我明天下午两点还上课呢，四点半下课。", "Wǒ míngtiān xiàwǔ liǎng diǎn hái shàngkè ne, sì diǎn bàn xiàkè.", "Ngày mai chiều hai giờ tôi vẫn còn học, bốn rưỡi mới tan học."),
        ],
    },
    "hsk1-l7-t3": {
        "context": "王一雪给丈夫刘明打电话。(Vương Nhất Tuyết gọi điện cho chồng là Lưu Minh.)",
        "lines": [
            ("王一雪", "喂，你在哪儿呢？", "Wèi, nǐ zài nǎr ne?", "A-lô, anh đang ở đâu vậy?"),
            ("刘明", "我在家里呢。", "Wǒ zài jiā li ne.", "Anh đang ở nhà."),
            ("王一雪", "我晚上六点半下班。", "Wǒ wǎnshang liù diǎn bàn xiàbān.", "Em tan ca lúc sáu rưỡi tối."),
            ("刘明", "我八点去医院上班。", "Wǒ bā diǎn qù yīyuàn shàngbān.", "Anh đi làm ở bệnh viện lúc tám giờ."),
            ("王一雪", "好的，你去店里买些菜吧。", "Hǎo de, nǐ qù diàn lǐ mǎi xiē cài ba.", "Được rồi, anh ra cửa hàng mua ít rau nhé."),
            ("刘明", "好，我十分钟后去。", "Hǎo, wǒ shí fēnzhōng hòu qù.", "Được, mười phút nữa anh đi."),
        ],
    },
    # ----- LESSON 8 -----
    "hsk1-l8-t1": {
        "context": "在王一飞家，白家月和陈天中来做客。(Ở nhà Vương Nhất Phi, Bạch Gia Nguyệt và Trần Thiên Trung đến thăm.)",
        "lines": [
            ("白家月", "房间外有一只小猫。", "Fángjiān wài yǒu yī zhī xiǎo māo.", "Ngoài phòng có một con mèo nhỏ."),
            ("陈天中", "我没看见，它在哪儿呢？", "Wǒ méi kànjiàn, tā zài nǎr ne?", "Tôi không thấy, nó đang ở đâu vậy?"),
            ("白家月", "它在桌子下呢。", "Tā zài zhuōzi xià ne.", "Nó đang ở dưới bàn."),
            ("陈天中", "这只小猫真漂亮！", "Zhè zhī xiǎo māo zhēn piàoliang!", "Con mèo nhỏ này đẹp quá!"),
        ],
    },
    "hsk1-l8-t2": {
        "context": "在教室里，下课后，白家月给李文打电话。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt gọi điện cho Lý Văn.)",
        "lines": [
            ("白家月", "我们在哪儿见呢？", "Wǒmen zài nǎr jiàn ne?", "Chúng ta gặp nhau ở đâu nhỉ?"),
            ("李文", "在学校书店前见吧。", "Zài xuéxiào shūdiàn qián jiàn ba.", "Gặp nhau trước nhà sách trường nhé."),
            ("白家月", "好的。下午两点你能到吗？", "Hǎo de. Xiàwǔ liǎng diǎn nǐ néng dào ma?", "Được. Hai giờ chiều bạn đến được không?"),
            ("李文", "我能到。我在学校吃午饭。", "Wǒ néng dào. Wǒ zài xuéxiào chī wǔfàn.", "Tôi đến được. Tôi ăn trưa ở trường."),
        ],
    },
    "hsk1-l8-t3": {
        "context": "在医院里，刘明和同事小胡聊天儿。(Ở bệnh viện, Lưu Minh trò chuyện với đồng nghiệp là tiểu Hồ.)",
        "lines": [
            ("刘明", "小胡，还没吃饭呢？", "Xiǎo Hú, hái méi chīfàn ne?", "Tiểu Hồ, chưa ăn cơm à?"),
            ("小胡", "没吃呢。", "Méi chī ne.", "Chưa ăn."),
            ("刘明", "大医院病人多，医生非常忙。", "Dà yīyuàn bìngrén duō, yīshēng fēicháng máng.", "Bệnh viện lớn bệnh nhân nhiều, bác sĩ rất bận."),
            ("小胡", "是的。我爸爸也在医院工作，他也非常忙。", "Shì de. Wǒ bàba yě zài yīyuàn gōngzuò, tā yě fēicháng máng.", "Đúng vậy. Bố tôi cũng làm ở bệnh viện, ông ấy cũng rất bận."),
            ("刘明", "你家有两个医生？", "Nǐ jiā yǒu liǎng gè yīshēng?", "Nhà bạn có hai bác sĩ à?"),
            ("小胡", "对。", "Duì.", "Đúng vậy."),
        ],
    },
    # ----- LESSON 9 -----
    "hsk1-l9-t1": {
        "context": "在校园里，李文和白家月在聊天儿。(Trong khuôn viên trường, Lý Văn và Bạch Gia Nguyệt đang trò chuyện.)",
        "lines": [
            ("李文", "学校前边有一家电影院。", "Xuéxiào qiánbian yǒu yī jiā diànyǐngyuàn.", "Phía trước trường có một rạp chiếu phim."),
            ("白家月", "对。我们晚上去那个电影院看电影吧。", "Duì. Wǒmen wǎnshang qù nàge diànyǐngyuàn kàn diànyǐng ba.", "Đúng rồi. Tối nay chúng ta đến rạp đó xem phim nhé."),
            ("李文", "好！我们七点在电影院外边见，好吗？", "Hǎo! Wǒmen qī diǎn zài diànyǐngyuàn wàibian jiàn, hǎo ma?", "Tốt! Bảy giờ chúng ta gặp nhau bên ngoài rạp, được không?"),
            ("白家月", "好的，晚上七点见！", "Hǎo de, wǎnshang qī diǎn jiàn!", "Được rồi, tối bảy giờ gặp nhau!"),
        ],
    },
    "hsk1-l9-t2": {
        "context": "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
        "lines": [
            ("陈天中", "椅子上有一本中文书，那是谁的书？", "Yǐzi shang yǒu yī běn Zhōngwén shū, nà shì shéi de shū?", "Trên ghế có một quyển sách tiếng Trung, đó là sách của ai?"),
            ("白家月", "是我的书，谢谢。这是我的第二本中文书。", "Shì wǒ de shū, xièxie. Zhè shì wǒ de dì-èr běn Zhōngwén shū.", "Là sách của tôi, cảm ơn. Đây là quyển sách tiếng Trung thứ hai của tôi."),
            ("陈天中", "不客气。你明天上午在哪儿？", "Bù kèqi. Nǐ míngtiān shàngwǔ zài nǎr?", "Không có gì. Sáng mai bạn ở đâu?"),
            ("白家月", "我明天上午在学校学习。", "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí.", "Sáng mai tôi ở trường học bài."),
        ],
    },
    "hsk1-l9-t3": {
        "context": "在公司里，王一雪和杨同乐休息时聊天儿，谈论周末生活。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao về cuộc sống cuối tuần.)",
        "lines": [
            ("王一雪", "明天星期六，你做什么？", "Míngtiān Xīngqīliù, nǐ zuò shénme?", "Ngày mai thứ Bảy, bạn làm gì?"),
            ("杨同乐", "我白天在家里读书，晚上和朋友们去外边唱歌。", "Wǒ báitiān zài jiā lǐ dúshū, wǎnshang hé péngyoumen qù wàibian chàng gē.", "Tôi ban ngày ở nhà đọc sách, tối đi hát với bạn bè."),
            ("王一雪", "你唱歌很好听。", "Nǐ chànggē hěn hǎotīng.", "Bạn hát rất hay."),
            ("杨同乐", "谢谢！您星期六做什么？", "Xièxie! Nín Xīngqīliù zuò shénme?", "Cảm ơn! Thứ Bảy chị làm gì?"),
            ("王一雪", "我在家里做饭，看电视，和孩子们、小狗玩。", "Wǒ zài jiā lǐ zuòfàn, kàn diànshì, hé háizimen, xiǎo gǒu wán.", "Tôi ở nhà nấu ăn, xem TV, chơi với các con và cún nhỏ."),
            ("杨同乐", "我也有一只小狗。", "Wǒ yě yǒu yī zhī xiǎo gǒu.", "Tôi cũng có một con cún nhỏ."),
        ],
    },
    # ----- LESSON 10 -----
    "hsk1-l10-t1": {
        "context": "在小店里，王一雪在买杯子。(Ở cửa hàng nhỏ, Vương Nhất Tuyết đang mua cốc.)",
        "lines": [
            ("王一雪", "请问，有杯子吗？", "Qǐngwèn, yǒu bēizi ma?", "Cho hỏi, có cốc không ạ?"),
            ("店员", "有，杯子在这边。", "Yǒu, bēizi zài zhèbian.", "Có ạ, cốc ở phía này."),
            ("王一雪", "多少钱一个？", "Duōshao qián yī gè?", "Mỗi cái bao nhiêu tiền?"),
            ("店员", "这些五块钱一个，那些十块钱一个。", "Zhèxiē wǔ kuài qián yī gè, nàxiē shí kuài qián yī gè.", "Những cái này năm tệ một cái, những cái kia mười tệ một cái."),
            ("王一雪", "我买这个吧。", "Wǒ mǎi zhège ba.", "Tôi mua cái này nhé."),
        ],
    },
    "hsk1-l10-t2": {
        "context": "在集市上，王一雪在买水果。(Ở chợ, Vương Nhất Tuyết đang mua hoa quả.)",
        "lines": [
            ("王一雪", "这儿的水果真不少！", "Zhèr de shuǐguǒ zhēn bù shǎo!", "Hoa quả ở đây thật là nhiều!"),
            ("摊主", "您想买什么？", "Nín xiǎng mǎi shénme?", "Bà muốn mua gì ạ?"),
            ("王一雪", "我想买两斤苹果。", "Wǒ xiǎng mǎi liǎng jīn píngguǒ.", "Tôi muốn mua hai cân táo."),
            ("摊主", "苹果三块五一斤。这些七块二，七块钱吧。", "Píngguǒ sān kuài wǔ yī jīn. Zhèxiē qī kuài èr, qī kuài qián ba.", "Táo ba phẩy năm tệ một cân. Những quả này bảy phẩy hai tệ, bảy tệ thôi nhé."),
            ("王一雪", "好的，这儿的苹果真便宜！", "Hǎo de, zhèr de píngguǒ zhēn piányí!", "Được rồi, táo ở đây thật rẻ!"),
        ],
    },
    "hsk1-l10-t3": {
        "context": "在商场里，刘明和王一雪在给孩子们买衣服。(Ở trung tâm thương mại, Lưu Minh và Vương Nhất Tuyết đang mua quần áo cho các con.)",
        "lines": [
            ("王一雪", "这家商店衣服真多！这件一百元，怎么样？", "Zhè jiā shāngdiàn yīfu zhēn duō! Zhè jiàn yī bǎi yuán, zěnmeyàng?", "Cửa hàng này quần áo thật nhiều! Cái này một trăm tệ, thế nào?"),
            ("刘明", "好看，也不贵。", "Hǎokàn, yě bù guì.", "Đẹp, cũng không đắt."),
            ("王一雪", "小雪能穿，买一件吧。", "Xiǎo Xuě néng chuān, mǎi yī jiàn ba.", "Tiểu Tuyết mặc được, mua một cái nhé."),
            ("刘明", "好的。小明能穿吗？", "Hǎo de. Xiǎo Míng néng chuān ma?", "Được. Tiểu Minh mặc được không?"),
            ("王一雪", "不能。这些是女孩子穿的衣服，男孩子的衣服在那儿。", "Bù néng. Zhèxiē shì nǚ háizi chuān de yīfu, nán háizi de yīfu zài nàr.", "Không được. Những cái này là quần áo con gái, quần áo con trai ở kia."),
            ("刘明", "好的。", "Hǎo de.", "Được rồi."),
        ],
    },
    # ----- LESSON 11 -----
    "hsk1-l11-t1": {
        "context": "在路上，李文正在找饭店，王一飞给他打电话。(Trên đường, Lý Văn đang tìm nhà hàng, Vương Nhất Phi gọi điện cho anh.)",
        "lines": [
            ("王一飞", "喂，李文，你什么时候能到饭店？", "Wèi, Lǐ Wén, nǐ shénme shíhou néng dào fàndiàn?", "A-lô, Lý Văn, bao giờ bạn đến nhà hàng được?"),
            ("李文", "还不知道，正在找呢。它是不是在超市后边？", "Hái bù zhīdào, zhèngzài zhǎo ne. Tā shì bu shì zài chāoshì hòubian?", "Chưa biết, đang tìm. Nó có phải ở phía sau siêu thị không?"),
            ("王一飞", "是的。你开车没开车？", "Shì de. Nǐ kāichē méi kāichē?", "Đúng rồi. Bạn có lái xe không?"),
            ("李文", "我没开车，坐车呢。", "Wǒ méi kāichē, zuò chē ne.", "Tôi không lái xe, đang đi xe buýt."),
        ],
    },
    "hsk1-l11-t2": {
        "context": "在饭店里，王一飞和李文见面后聊天儿。(Ở nhà hàng, Vương Nhất Phi và Lý Văn gặp nhau và trò chuyện.)",
        "lines": [
            ("王一飞", "你还在上大学吗？", "Nǐ hái zài shàng dàxué ma?", "Bạn có vẫn đang học đại học không?"),
            ("李文", "对，我上大学呢，还是大学生。", "Duì, wǒ shàng dàxué ne, hái shì dàxuéshēng.", "Đúng vậy, tôi đang học đại học, vẫn còn là sinh viên."),
            ("王一飞", "你们学习忙不忙？", "Nǐmen xuéxí máng bu máng?", "Các bạn có bận học không?"),
            ("李文", "非常忙，我学语言，我们的课很多。", "Fēicháng máng, wǒ xué yǔyán, wǒmen de kè hěn duō.", "Rất bận, tôi học ngôn ngữ, chúng tôi có rất nhiều tiết học."),
        ],
    },
    "hsk1-l11-t3": {
        "context": "星期六早上，刘明要去医院加班，出门前和女儿聊天儿。(Sáng thứ Bảy, Lưu Minh sắp đi làm thêm giờ ở bệnh viện, trước khi ra ngoài trò chuyện với con gái.)",
        "lines": [
            ("刘明", "弟弟起床没起床呢？", "Dìdi qǐchuáng méi qǐchuáng ne?", "Em trai dậy chưa?"),
            ("刘小雪", "没起床呢，还在睡觉。", "Méi qǐchuáng ne, hái zài shuìjiào.", "Chưa dậy, vẫn còn ngủ."),
            ("刘明", "还睡呢？他今天去不去哪里？", "Hái shuì ne? Tā jīntiān qù bu qù nǎlǐ?", "Còn ngủ à? Hôm nay nó có đi đâu không?"),
            ("刘小雪", "去哪里？", "Qù nǎlǐ?", "Đi đâu ấy?"),
            ("刘明", "去超市。", "Qù chāoshì.", "Đi siêu thị."),
            ("刘小雪", "我昨天晚问他，他对我说，他不去，他今天要和小朋友玩。", "Wǒ zuótiān wǎn wèn tā, tā duì wǒ shuō, tā bù qù, tā jīntiān yào hé xiǎopéngyou wán.", "Tối qua tôi có hỏi nó, nó nói với tôi rằng nó không đi, hôm nay nó muốn chơi với bạn nhỏ."),
        ],
    },
    # ----- LESSON 12 -----
    "hsk1-l12-t1": {
        "context": "王一雪给王一飞打电话，问那边的情况。(Vương Nhất Tuyết gọi điện cho Vương Nhất Phi, hỏi về tình hình bên đó.)",
        "lines": [
            ("王一雪", "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?", "Hôm nay thời tiết thế nào?"),
            ("王一飞", "这里的天不太好，下雨了。", "Zhèlǐ de tiān bù tài hǎo, xià yǔ le.", "Thời tiết ở đây không tốt lắm, trời mưa rồi."),
            ("王一雪", "雨大吗？", "Yǔ dà ma?", "Mưa to không?"),
            ("王一飞", "有点儿大，我觉得很冷。", "Yǒudiǎnr dà, wǒ juéde hěn lěng.", "Hơi to, tôi thấy rất lạnh."),
        ],
    },
    "hsk1-l12-t2": {
        "context": "在公司电梯里，王一雪和杨同乐在聊天儿。(Trong thang máy công ty, Vương Nhất Tuyết và Dương Đồng Nhạc đang trò chuyện.)",
        "lines": [
            ("王一雪", "昨天下雪了。", "Zuótiān xià xuě le.", "Hôm qua có tuyết rơi."),
            ("杨同乐", "是的，太冷了。", "Shì de, tài lěng le.", "Đúng vậy, lạnh quá."),
            ("王一雪", "你昨天没来公司，生病了？", "Nǐ zuótiān méi lái gōngsī, shēngbìng le?", "Hôm qua bạn không đến công ty, bị ốm à?"),
            ("杨同乐", "对，我昨天去医院看病了。", "Duì, wǒ zuótiān qù yīyuàn kànbìng le.", "Đúng vậy, hôm qua tôi đi bệnh viện khám bệnh."),
        ],
    },
    "hsk1-l12-t3": {
        "context": "昨天在医院里，医生给杨同乐看病。(Hôm qua ở bệnh viện, bác sĩ khám bệnh cho Dương Đồng Nhạc.)",
        "lines": [
            ("杨同乐", "医生，我病了。", "Yīshēng, wǒ bìng le.", "Bác sĩ ơi, tôi bị ốm rồi."),
            ("医生", "我看看。你觉得怎么样？", "Wǒ kànkan. Nǐ juéde zěnmeyàng?", "Để tôi xem. Bạn cảm thấy thế nào?"),
            ("杨同乐", "我很冷。", "Wǒ hěn lěng.", "Tôi rất lạnh."),
            ("医生", "好的，吃一点儿药，今天休息半天吧。", "Hǎo de, chī yīdiǎnr yào, jīntiān xiūxi bàn tiān ba.", "Được rồi, uống một ít thuốc, hôm nay nghỉ nửa ngày nhé."),
            ("杨同乐", "好的。", "Hǎo de.", "Được rồi."),
            ("医生", "回家后再喝些热水。", "Huí jiā hòu zài hē xiē rè shuǐ.", "Về nhà nhớ uống thêm nước ấm nhé."),
        ],
    },
    # ----- LESSON 13 -----
    "hsk1-l13-t1": {
        "context": "在教室里，下课后，白家月向王老师问问题。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt hỏi thầy Vương một câu hỏi.)",
        "lines": [
            ("白家月", "王老师，我可以再问您一个问题吗？", "Wáng lǎoshī, wǒ kěyǐ zài wèn nín yī gè wèntí ma?", "Thầy Vương ơi, em có thể hỏi thầy thêm một câu không?"),
            ("王一飞", "可以。你有什么问题？", "Kěyǐ. Nǐ yǒu shénme wèntí?", "Được. Em có câu hỏi gì?"),
            ("白家月", "那个小店买不买手机？", "Nàge xiǎo diàn mǎi bu mǎi shǒujī?", "Cái cửa hàng nhỏ đó có bán điện thoại không ạ?"),
            ("王一飞", "我不知道。你可以打电话问一下。", "Wǒ bù zhīdào. Nǐ kěyǐ dǎ diànhuà wèn yīxià.", "Thầy không biết. Em có thể gọi điện hỏi xem."),
        ],
    },
    "hsk1-l13-t2": {
        "context": "在咖啡馆里，王一雪想吃早饭。(Ở quán cà phê, Vương Nhất Tuyết muốn ăn sáng.)",
        "lines": [
            ("服务员", "女士，请坐！您喝什么？", "Nǚshì, qǐng zuò! Nín hē shénme?", "Thưa cô, mời ngồi! Cô muốn uống gì?"),
            ("王一雪", "我看一下。请给我一杯牛奶。", "Wǒ kàn yīxià. Qǐng gěi wǒ yī bēi niúnǎi.", "Để tôi xem đã. Làm ơn cho tôi một ly sữa."),
            ("服务员", "好的。您还要什么？", "Hǎo de. Nín hái yào shénme?", "Được ạ. Cô còn muốn gì nữa không?"),
            ("王一雪", "我还没吃早饭，再要这个面包和鸡蛋吧。", "Wǒ hái méi chī zǎofàn, zài yào zhège miànbāo hé jīdàn ba.", "Tôi chưa ăn sáng, cho thêm bánh mì và trứng này nhé."),
        ],
    },
    "hsk1-l13-t3": {
        "context": "在餐厅里，刘明在点餐。(Ở nhà hàng, Lưu Minh đang gọi đồ ăn.)",
        "lines": [
            ("服务员", "先生，请坐！您要什么？", "Xiānsheng, qǐng zuò! Nín yào shénme?", "Thưa anh, mời ngồi! Anh muốn gì ạ?"),
            ("刘明", "我要一斤饺子。", "Wǒ yào yī jīn jiǎozi.", "Cho tôi một cân sủi cảo."),
            ("服务员", "好的。一斤饺子40个。", "Hǎo de. Yī jīn jiǎozi sìshí gè.", "Vâng. Một cân sủi cảo là 40 cái."),
            ("刘明", "40个太多了，我要一半吧。", "Sìshí gè tài duō le, wǒ yào yībàn ba.", "40 cái nhiều quá, cho tôi một nửa thôi."),
            ("服务员", "半斤20个。您想喝什么？", "Bàn jīn èrshí gè. Nín xiǎng hē shénme?", "Nửa cân 20 cái. Anh muốn uống gì?"),
            ("刘明", "请给我一杯茶吧。", "Qǐng gěi wǒ yī bēi chá ba.", "Làm ơn cho tôi một chén trà nhé."),
        ],
    },
    # ----- LESSON 14 -----
    "hsk1-l14-t1": {
        "context": "在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang nói về chuyến dã ngoại vừa rồi.)",
        "lines": [
            ("白家月", "你们上火车后看见王老师了吗？", "Nǐmen shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?", "Các bạn sau khi lên tàu có thấy thầy Vương không?"),
            ("陈天中", "没看见。中午车开后，有些人在看书，有些人睡觉了。", "Méi kànjiàn. Zhōngwǔ chē kāi hòu, yǒuxiē rén zài kàn shū, yǒuxiē rén shuìjiào le.", "Không thấy. Trưa tàu chạy rồi, có người đang đọc sách, có người ngủ."),
            ("白家月", "你呢？", "Nǐ ne?", "Còn bạn thì sao?"),
            ("陈天中", "我看了一个电影。", "Wǒ kànle yī gè diànyǐng.", "Tôi đã xem một bộ phim."),
        ],
    },
    "hsk1-l14-t2": {
        "context": "在课堂上，王一飞在询问学生们的学习情况。(Trong lớp học, Vương Nhất Phi đang hỏi về tình hình học tập của học sinh.)",
        "lines": [
            ("王一飞", "你们会说汉语了，也会写汉字了吗？", "Nǐmen huì shuō Hànyǔ le, yě huì xiě Hànzì le ma?", "Các em bây giờ đã biết nói tiếng Trung, vậy đã biết viết chữ Hán chưa?"),
            ("白家月", "我们都会写了。", "Wǒmen dōu huì xiě le.", "Chúng em đều đã biết viết rồi ạ."),
            ("陈天中", "老师，我听不见。", "Lǎoshī, wǒ tīng bu jiàn.", "Thưa thầy, em không nghe thấy ạ."),
            ("王一飞", "请大家不要说话！请听老师的问题：你们都会写哪些汉字了？", "Qǐng dàjiā bùyào shuōhuà! Qǐng tīng lǎoshī de wèntí: Nǐmen dōu huì xiě nǎxiē Hànzì le?", "Mọi người không được nói chuyện! Hãy nghe câu hỏi của thầy: Các em đã biết viết những chữ Hán nào rồi?"),
            ("陈天中", "我会写这些字了，您看！", "Wǒ huì xiě zhèxiē zì le, nín kàn!", "Em đã biết viết những chữ này rồi, thầy xem này!"),
        ],
    },
    "hsk1-l14-t3": {
        "context": "在家里，刘明和王一雪在谈论孩子的升学情况。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang nói về việc con cái lên cấp học mới.)",
        "lines": [
            ("刘明", "明年女儿上中学。", "Míngnián nǚ'ér shàng zhōngxué.", "Năm sau con gái lên trung học."),
            ("王一雪", "对。儿子也上小学了。", "Duì. Érzi yě shàng xiǎoxué le.", "Đúng rồi. Con trai cũng vào tiểu học rồi."),
            ("刘明", "我们家有了一个中学生。", "Wǒmen jiā yǒule yī gè zhōngxuéshēng.", "Nhà mình có một học sinh trung học rồi."),
            ("王一雪", "还有了一个小学生。", "Hái yǒule yī gè xiǎoxuéshēng.", "Còn thêm một học sinh tiểu học nữa."),
            ("刘明", "上学后，他们都忙了。", "Shàngxué hòu, tāmen dōu máng le.", "Sau khi đi học, chúng đều bận rồi."),
            ("王一雪", "是的。太晚了，睡觉吧。", "Shì de. Tài wǎn le, shuìjiào ba.", "Đúng vậy. Muộn rồi, đi ngủ thôi."),
        ],
    },
    # ----- LESSON 15 -----
    "hsk1-l15-t1": {
        "context": "在李文家，李文邀请陈天中、白家月等朋友品尝中餐。(Ở nhà Lý Văn, Lý Văn mời Trần Thiên Trung, Bạch Gia Nguyệt và các bạn thưởng thức ẩm thực Trung Quốc.)",
        "lines": [
            ("李文", "你们爱吃哪个菜？", "Nǐmen ài chī nǎge cài?", "Các bạn thích ăn món nào?"),
            ("白家月", "我喜欢这个，也喜欢那个。", "Wǒ xǐhuan zhège, yě xǐhuan nàge.", "Tôi thích cái này, cũng thích cái kia."),
            ("陈天中", "这些菜都好吃，还很好看。", "Zhèxiē cài dōu hǎochī, hái hěn hǎokàn.", "Những món này đều ngon, lại còn rất đẹp mắt."),
            ("李文", "我爱吃中国菜，也喜欢做。大家多吃点儿。", "Wǒ ài chī Zhōngguó cài, yě xǐhuan zuò. Dàjiā duō chī diǎnr.", "Tôi thích ăn món Trung Quốc, cũng thích nấu. Mọi người ăn nhiều vào nhé."),
        ],
    },
    "hsk1-l15-t2": {
        "context": "在李文家，大家边吃饭边谈论假期计划。(Ở nhà Lý Văn, mọi người vừa ăn vừa bàn về kế hoạch nghỉ lễ.)",
        "lines": [
            ("李文", "你们都想去哪儿？", "Nǐmen dōu xiǎng qù nǎr?", "Mọi người muốn đi đâu?"),
            ("安妮", "去年我和男朋友去了西安，今年我想去北京。", "Qùnián wǒ hé nánpéngyou qùle Xī'ān, jīnnián wǒ xiǎng qù Běijīng.", "Năm ngoái tôi và bạn trai đã đến Tây An, năm nay tôi muốn đến Bắc Kinh."),
            ("白家月", "前几年我去了西安，非常好玩儿。今年我也想去北京。", "Qián jǐ nián wǒ qùle Xī'ān, fēicháng hǎowánr. Jīnnián wǒ yě xiǎng qù Běijīng.", "Vài năm trước tôi đã đến Tây An, vui lắm. Năm nay tôi cũng muốn đến Bắc Kinh."),
            ("李文", "我和王老师都是北京人，北京非常漂亮。", "Wǒ hé Wáng lǎoshī dōu shì Běijīng rén, Běijīng fēicháng piàoliang.", "Tôi và thầy Vương đều là người Bắc Kinh, Bắc Kinh rất đẹp."),
        ],
    },
    "hsk1-l15-t3": {
        "context": "在教室外，白家月、安妮和王老师在谈论去北京旅游的事。(Ngoài lớp học, Bạch Gia Nguyệt, An Ni và thầy Vương đang nói về chuyện đi du lịch Bắc Kinh.)",
        "lines": [
            ("王一飞", "你们的飞机到北京要几个小时？", "Nǐmen de fēijī dào Běijīng yào jǐ gè xiǎoshí?", "Chuyến bay của các em đến Bắc Kinh mất mấy tiếng?"),
            ("白家月", "九个小时。", "Jiǔ gè xiǎoshí.", "Chín tiếng ạ."),
            ("王一飞", "我家人都在北京，星期天我姐姐也有时间，她可以去机场接你们，你们也可以住我家。", "Wǒ jiārén dōu zài Běijīng, Xīngqītiān wǒ jiějie yě yǒu shíjiān, tā kěyǐ qù jīchǎng jiē nǐmen, nǐmen yě kěyǐ zhù wǒ jiā.", "Gia đình thầy đều ở Bắc Kinh, Chủ nhật chị gái thầy cũng có thời gian, chị ấy có thể ra sân bay đón các em, các em cũng có thể ở nhà thầy."),
            ("安妮", "我们星期日早上八点到大兴机场，早不早？", "Wǒmen Xīngqīrì zǎoshang bā diǎn dào Dàxīng Jīchǎng, zǎo bu zǎo?", "Chúng em đến sân bay Đại Hưng lúc tám giờ sáng Chủ nhật, có sớm không ạ?"),
            ("王一飞", "不早。", "Bù zǎo.", "Không sớm đâu."),
            ("白家月", "谢谢老师！那我们和您姐姐在大兴机场见！", "Xièxie lǎoshī! Nà wǒmen hé nín jiějie zài Dàxīng Jīchǎng jiàn!", "Cảm ơn thầy! Vậy chúng em sẽ gặp chị thầy ở sân bay Đại Hưng!"),
        ],
    },
}

def build_lines_ts(lines):
    parts = []
    for spk, hanzi, pinyin, viet in lines:
        parts.append(
            f'          {{ speaker: "{spk}", hanzi: "{hanzi}", pinyin: "{pinyin}", vietnamese: "{viet}" }}'
        )
    return ",\n".join(parts)

def main():
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    for text_id, data in CORRECT_TEXTS.items():
        context = data["context"]
        lines = data["lines"]

        # Pattern to find the LessonText block by id
        # We'll find id: "hsk1-lX-tY" and then update context and lines within that block
        
        # Find the id marker
        id_pat = re.compile(
            rf'(id:\s*"{re.escape(text_id)}",\s*\n\s*title:[^\n]+\n\s*context:\s*")[^"]*(")',
            re.DOTALL
        )
        
        def replace_context(m):
            return m.group(1) + context + m.group(2)
        
        new_content, n = id_pat.subn(replace_context, content)
        if n == 0:
            print(f"WARNING: id {text_id} context pattern not found!")
        else:
            content = new_content
            print(f"  Updated context for {text_id}")

        # Now update lines block: find lines: [ ... ] after the id
        # Strategy: find the lines array within this text block
        # We'll look for the section starting at id: "hsk1-lX-tY" and find lines: [
        lines_new_str = "[\n" + build_lines_ts(lines) + "\n        ]"
        
        # Find id marker position in current content
        id_search = f'id: "{text_id}"'
        pos = content.find(id_search)
        if pos < 0:
            print(f"WARNING: id {text_id} not found for lines update!")
            continue
        
        # Find "lines: [" after pos
        lines_start = content.find("lines: [", pos)
        if lines_start < 0:
            print(f"WARNING: lines: [ not found for {text_id}!")
            continue
        
        # Find matching closing bracket - count brackets
        bracket_start = content.index("[", lines_start)
        depth = 0
        i = bracket_start
        while i < len(content):
            if content[i] == "[":
                depth += 1
            elif content[i] == "]":
                depth -= 1
                if depth == 0:
                    bracket_end = i
                    break
            i += 1
        
        # Find where "lines: " prefix starts 
        lines_prefix = "lines: "
        content = (
            content[:lines_start + len(lines_prefix)] +
            lines_new_str +
            content[bracket_end + 1:]
        )
        print(f"  Updated lines for {text_id}")

    if content == original:
        print("No changes made — check patterns!")
    else:
        with open(TARGET, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"\nDone! Updated {TARGET}")

if __name__ == "__main__":
    main()
