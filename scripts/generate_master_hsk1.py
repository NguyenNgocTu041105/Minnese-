# -*- coding: utf-8 -*-
import sys, os, re, json
sys.path.append('scripts')
sys.stdout.reconfigure(encoding='utf-8')

from generate_hsk1_vocab_map import VOCAB_INDEX, PROPER_NOUNS
from build_hsk1_vocab_data import WORD_METADATA
from hsk1_grammar_exercises import LESSON_CONFIG

# Sample sentences map for words to give rich, natural sentences
WORD_EXAMPLES = {
    "爱": ("你们爱吃哪个菜？", "Các bạn thích ăn món nào?"),
    "八": ("我家有八口人。", "Nhà tôi có 8 người."),
    "爸爸": ("我爸爸也在医院工作。", "Bố tôi cũng làm việc ở bệnh viện."),
    "吧": ("我们去看电影吧！", "Chúng mình đi xem phim đi!"),
    "白天": ("他白天在学校学习。", "Ban ngày anh ấy học ở trường."),
    "百": ("这件衣服一百块。", "Chiếc áo này 100 tệ."),
    "半": ("我晚上六点半下班。", "Buổi tối 6 rưỡi tôi tan làm."),
    "包子": ("我想吃包子。", "Tôi muốn ăn bánh bao."),
    "杯": ("请给我一杯茶。", "Xin cho tôi một tách trà."),
    "杯子": ("请问，有杯子吗？", "Xin hỏi, có cái cốc không?"),
    "本": ("桌子上有一本书。", "Trên bàn có một cuốn sách."),
    "边": ("学校旁边有一家书店。", "Bên cạnh trường học có một hiệu sách."),
    "病": ("他生病了，在看病。", "Anh ấy bị bệnh rồi, đang khám bệnh."),
    "病人": ("医院里有很多病人。", "Trong bệnh viện có rất nhiều bệnh nhân."),
    "不客气": ("谢谢你！——不客气！", "Cảm ơn bạn! —— Không có gì!"),
    "不要": ("上课时不要说话。", "Trong giờ học đừng nói chuyện."),
    "不": ("我不是老师，我是学生。", "Tôi không phải giáo viên, tôi là học sinh."),
    "菜": ("你会做中国菜吗？", "Bạn biết nấu món ăn Trung Quốc không?"),
    "茶": ("请喝茶。", "Mời uống trà."),
    "唱": ("她喜欢唱歌。", "Cô ấy thích ca hát."),
    "超市": ("我去超市买东西。", "Tôi đi siêu thị mua đồ."),
    "车": ("路上有很多车。", "Trên đường có rất nhiều xe cộ."),
    "吃": ("你喜欢吃什么？", "Bạn thích ăn cái gì?"),
    "出租车": ("我们坐出租车去吧。", "Chúng ta đi xe taxi đi nhé."),
    "穿": ("她穿这件衣服真漂亮！", "Cô ấy mặc chiếc áo này thật đẹp!"),
    "打电话": ("他在给妈妈打电话呢。", "Anh ấy đang gọi điện thoại cho mẹ."),
    "大": ("这个苹果很大。", "Quả táo này rất to."),
    "大家": ("大家好！", "Chào mọi người!"),
    "大学": ("我读大学呢。", "Tôi đang học đại học đấy."),
    "大学生": ("我们都是大学生。", "Tất cả chúng tôi đều là sinh viên đại học."),
    "到": ("你什么时候能到饭店？", "Khi nào bạn có thể đến nhà hàng?"),
    "的": ("这是我的汉语书。", "Đây là sách tiếng Trung của tôi."),
    "弟弟": ("我弟弟今年十岁。", "Em trai tôi năm nay 10 tuổi."),
    "第": ("这是我第一天来学校。", "Đây là ngày đầu tiên tôi đến trường."),
    "点": ("现在几点？——现在八点。", "Bây giờ mấy giờ? —— Bây giờ 8 giờ."),
    "电话": ("家月，你的电话是多少？", "Gia Nguyệt, số điện thoại của bạn là bao nhiêu?"),
    "电脑": ("这是新买的电脑。", "Đây là máy tính mới mua."),
    "电视": ("他晚上喜欢看电视。", "Buổi tối anh ấy thích xem ti vi."),
    "电影": ("我看了一个电影。", "Tôi đã xem một bộ phim."),
    "电影院": ("学校前边有一家电影院。", "Phía trước trường học có một rạp chiếu phim."),
    "店": ("这是一家水果店。", "Đây là một tiệm bán hoa quả."),
    "东西": ("你想买什么东西？", "Bạn muốn mua đồ gì?"),
    "都": ("我们都是学生。", "Tất cả chúng tôi đều là học sinh."),
    "读": ("我读大学呢。", "Tôi đang học đại học đấy."),
    "读书": ("他在房间里读书呢。", "Anh ấy đang đọc sách trong phòng."),
    "对": ("对，我是中国人。", "Đúng vậy, tôi là người Trung Quốc."),
    "对不起": ("对不起，我迟到了。", "Xin lỗi, tôi đến muộn."),
    "多": ("你的学生多吗？", "Học sinh của bạn có đông không?"),
    "多少": ("你的手机号是多少？", "Số điện thoại của bạn là bao nhiêu?"),
    "儿子": ("他有一个儿子。", "Anh ấy có một cậu con trai."),
    "二": ("一、二、三、四、五。", "1, 2, 3, 4, 5."),
    "饭": ("我们去吃午饭吧。", "Chúng ta đi ăn cơm trưa đi."),
    "饭店": ("怎么去西安饭店？", "Đi đến khách sạn Tây An như thế nào?"),
    "房间": ("房间外有一只小猫。", "Bên ngoài phòng có một chú mèo nhỏ."),
    "飞机": ("大兴机场有很多飞机。", "Sân bay Đại Hưng có rất nhiều máy bay."),
    "非常": ("这里的苹果非常便宜！", "Táo ở đây vô cùng rẻ!"),
    "分": ("现在八点十分。", "Bây giờ là 8 giờ 10 phút."),
    "分钟": ("请等十分钟。", "Xin vui lòng đợi 10 phút."),
    "服务员": ("服务员，请给我一杯水。", "Phục vụ ơi, xin cho tôi một cốc nước."),
    "高兴": ("很高兴认识你！", "Rất vui được làm quen với bạn!"),
    "哥哥": ("我哥哥在医院工作。", "Anh trai tôi làm việc ở bệnh viện."),
    "歌": ("这首歌真好听！", "Bài hát này thật hay!"),
    "个": ("我有两个孩子。", "Tôi có hai đứa con."),
    "给": ("请给我一杯茶。", "Xin cho tôi một tách trà."),
    "工作": ("你在哪儿工作？", "Bạn làm việc ở đâu?"),
    "公司": ("他在一家大公司工作。", "Anh ấy làm việc ở một công ty lớn."),
    "狗": ("房间里有一只小狗。", "Trong phòng có một chú cún con."),
    "贵": ("这件衣服太贵了！", "Chiếc áo này đắt quá!"),
    "国": ("你是哪国人？", "Bạn là người nước nào?"),
    "还": ("我想去北京，还想去西安。", "Tôi muốn đi Bắc Kinh, còn muốn đi Tây An nữa."),
    "孩子": ("你有几个孩子？", "Bạn có mấy đứa con?"),
    "好": ("你好！", "Chào bạn!"),
    "好吃": ("妈妈做的菜真好吃！", "Món mẹ nấu thật là ngon!"),
    "好看": ("这本画册真好看。", "Cuốn tranh này thật đẹp mắt."),
    "好听": ("这首中文歌真好听！", "Bài hát tiếng Trung này nghe thật hay!"),
    "好玩儿": ("北京好玩儿吗？", "Bắc Kinh chơi có vui không?"),
    "号": ("今天5月20号。", "Hôm nay ngày 20 tháng 5."),
    "喝": ("医生让我多喝热水。", "Bác sĩ dặn tôi uống nhiều nước ấm."),
    "和": ("我和李文是好朋友。", "Tôi và Lý Văn là bạn tốt."),
    "很": ("我很好，谢谢！", "Tôi rất khỏe, cảm ơn bạn!"),
    "后": ("上火车后，我看见了王老师。", "Sau khi lên tàu, tôi đã nhìn thấy cô Vương."),
    "回": ("我要回家了。", "Tôi phải về nhà rồi."),
    "会": ("我会说一点儿汉语。", "Tôi biết nói một chút tiếng Trung."),
    "火车": ("我们坐火车去北京。", "Chúng tôi đi tàu hỏa đến Bắc Kinh."),
    "机场": ("大兴机场见！", "Hẹn gặp ở sân bay Đại Hưng nhé!"),
    "鸡蛋": ("我想买几个鸡蛋。", "Tôi muốn mua mấy quả trứng gà."),
    "几": ("你有几个苹果？", "Bạn có mấy quả táo?"),
    "家": ("我家有四口人。", "Nhà tôi có 4 người."),
    "家人": ("我的家人都在北京。", "Người nhà tôi đều ở Bắc Kinh."),
    "见": ("明天见！", "Hẹn ngày mai gặp lại!"),
    "件": ("这件衣服真漂亮！", "Chiếc áo này thật đẹp!"),
    "饺子": ("你会包饺子吗？", "Bạn biết gói sủi cảo không?"),
    "叫": ("我叫李文。", "Tôi tên là Lý Văn."),
    "接": ("我明天去机场接你。", "Ngày mai tôi sẽ ra sân bay đón bạn."),
    "姐姐": ("我姐姐也是大学生。", "Chị gái tôi cũng là sinh viên đại học."),
    "斤": ("苹果三块钱一斤。", "Táo 3 tệ một cân (500g)."),
    "今年": ("他今年二十岁。", "Năm nay cậu ấy 20 tuổi."),
    "今天": ("今天我休息。", "Hôm nay tôi nghỉ ngơi."),
    "九": ("一个星期有七天，九月有三十天。", "Một tuần có 7 ngày, tháng 9 có 30 ngày."),
    "觉得": ("我觉得今天有点儿冷。", "Tôi cảm thấy hôm nay hơi lạnh."),
    "开": ("火车上午九点开。", "Tàu hỏa chạy lúc 9 giờ sáng."),
    "开车": ("我正在开车呢。", "Tôi đang lái xe đây."),
    "看": ("我们在看电影呢。", "Chúng tôi đang xem phim đấy."),
    "看病": ("他今天去医院看病了。", "Hôm nay anh ấy đi bệnh viện khám bệnh rồi."),
    "看见": ("你看见我的手机了吗？", "Bạn có nhìn thấy điện thoại của tôi không?"),
    "可以": ("我可以坐这儿吗？", "Tôi có thể ngồi ở đây không?"),
    "课": ("今天下午我有两节课。", "Chiều nay tôi có hai tiết học."),
    "口": ("我家有三口人。", "Nhà tôi có 3 người."),
    "块": ("这个面包五块钱。", "Cái bánh mì này 5 tệ."),
    "来": ("王老师来了。", "Cô Vương đến rồi."),
    "老师": ("王老师好！", "Em chào cô Vương ạ!"),
    "了": ("昨天下雪了。", "Hôm qua tuyết rơi rồi."),
    "冷": ("今天天气太冷了！", "Thời tiết hôm nay lạnh quá!"),
    "里": ("学校里有很多学生。", "Trong trường có rất nhiều học sinh."),
    "两": ("我有两只猫。", "Tôi có hai chú mèo."),
    "零": ("二零二六年。", "Năm 2026."),
    "六": ("六点半下班。", "6 rưỡi tan làm."),
    "妈妈": ("我妈妈是医生。", "Mẹ tôi là bác sĩ."),
    "吗": ("你是中国人吗？", "Bạn là người Trung Quốc phải không?"),
    "买": ("我想买一些水果。", "Tôi muốn mua một ít hoa quả."),
    "卖": ("这里卖面包吗？", "Ở đây có bán bánh mì không?"),
    "忙": ("你工作忙吗？", "Công việc của bạn bận không?"),
    "猫": ("房间外有一只小猫。", "Bên ngoài phòng có một chú mèo con."),
    "没": ("我没去学校。", "Tôi không đi học."),
    "没关系": ("对不起！——没关系！", "Xin lỗi! —— Không sao đâu!"),
    "没事": ("没事，不要紧。", "Không sao cả, đừng bận tâm."),
    "没有": ("我没有哥哥。", "Tôi không có anh trai."),
    "妹妹": ("我妹妹今年八岁。", "Em gái tôi năm nay 8 tuổi."),
    "们": ("同学们好！", "Chào các em học sinh!"),
    "米饭": ("我要一碗米饭。", "Cho tôi một bát cơm trắng."),
    "面包": ("我想吃面包。", "Tôi muốn ăn bánh mì."),
    "面条儿": ("今天的面条儿真好吃！", "Mì sợi hôm nay ngon thật đấy!"),
    "名字": ("你叫什么名字？", "Bạn tên là gì?"),
    "明年": ("我明年去中国留学。", "Năm sau tôi sẽ sang Trung Quốc du học."),
    "明天": ("明天上午见！", "Hẹn gặp vào sáng mai!"),
    "哪": ("你是哪国人？", "Bạn là người nước nào?"),
    "哪个": ("你喜欢哪个菜？", "Bạn thích món ăn nào?"),
    "哪里": ("你在哪里工作？", "Bạn làm việc ở đâu?"),
    "哪儿": ("洗手间在哪儿？", "Nhà vệ sinh ở đâu?"),
    "哪些": ("这些书哪些是你的？", "Những cuốn sách này cuốn nào là của bạn?"),
    "那": ("那是谁的电脑？", "Kia là máy tính của ai?"),
    "那边": ("超市在那边。", "Siêu thị ở đằng kia."),
    "那个": ("那个苹果很大。", "Quả táo đó rất to."),
    "那里": ("那里是电影院。", "Nơi đó là rạp chiếu phim."),
    "那儿": ("我的书在那儿。", "Sách của tôi ở đằng đó."),
    "那些": ("那些衣服真好看！", "Những bộ quần áo đó thật đẹp!"),
    "男": ("他是我们班的男同学。", "Cậu ấy là bạn nam lớp chúng tôi."),
    "男朋友": ("她男朋友是北京人。", "Bạn trai của cô ấy là người Bắc Kinh."),
    "呢": ("我很好，你呢？", "Tôi rất khỏe, còn bạn thì sao?"),
    "能": ("你能帮我一下吗？", "Bạn có thể giúp tôi một chút không?"),
    "你": ("你好！", "Chào bạn!"),
    "你好": ("你好，李文！", "Chào bạn, Lý Văn!"),
    "你们": ("你们好！", "Chào các bạn!"),
    "年": ("我在中国住了三年。", "Tôi sống ở Trung Quốc 3 năm."),
    "您": ("老师，您好！", "Em kính chào thầy cô ạ!"),
    "牛奶": ("我每天早上喝牛奶。", "Mỗi sáng tôi đều uống sữa bò."),
    "女": ("她是一位女医生。", "Cô ấy là một nữ bác sĩ."),
    "女儿": ("他女儿今年读大学。", "Con gái anh ấy năm nay học đại học."),
    "女朋友": ("李文有女朋友吗？", "Lý Văn có bạn gái chưa?"),
    "女士": ("王女士，您好！", "Chào bà Vương ạ!"),
    "朋友": ("我们是好朋友。", "Chúng tôi là bạn tốt."),
    "便宜": ("这儿的苹果真便宜！", "Táo ở đây rẻ thật đấy!"),
    "漂亮": ("这件衣服真漂亮！", "Chiếc áo này thật đẹp!"),
    "苹果": ("我想买两斤苹果。", "Tôi muốn mua hai cân táo."),
    "七": ("七点半上课。", "7 rưỡi vào lớp học."),
    "起床": ("你早上几点起床？", "Buổi sáng bạn dậy lúc mấy giờ?"),
    "千": ("一千块钱。", "Một nghìn tệ."),
    "前": ("学校前有一家书店。", "Trước trường có một hiệu sách."),
    "前边": ("学校前边有一家电影院。", "Phía trước trường học có một rạp chiếu phim."),
    "钱": ("请问，这个多少钱？", "Xin hỏi, cái này bao nhiêu tiền?"),
    "请": ("请进，请坐，请喝茶。", "Mời vào, mời ngồi, mời uống trà."),
    "请问": ("请问，你叫什么名字？", "Xin hỏi, bạn tên là gì?"),
    "去": ("我想去超市买东西。", "Tôi muốn đi siêu thị mua đồ."),
    "去年": ("我是去年来北京的。", "Tôi đến Bắc Kinh vào năm ngoái."),
    "热": ("今天天气很热。", "Hôm nay trời rất nóng."),
    "人": ("我是中国人。", "Tôi là người Trung Quốc."),
    "认识": ("很高兴认识你！", "Rất vui được quen biết bạn!"),
    "日": ("今天是五月二十日。", "Hôm nay là ngày 20 tháng 5."),
    "三": ("我有三个朋友。", "Tôi có 3 người bạn."),
    "商店": ("这家商店有很多好看的衣服。", "Cửa hàng này có rất nhiều quần áo đẹp."),
    "上": ("桌子上有两本书。", "Trên bàn có hai cuốn sách."),
    "上班": ("我爸爸八点上班。", "Bố tôi đi làm lúc 8 giờ."),
    "上课": ("老师，什么时候上课？", "Thưa thầy, khi nào vào lớp học ạ?"),
    "上午": ("我明天上午在学校学习。", "Sáng mai tôi học ở trường."),
    "上学": ("孩子们都去上学了。", "Lũ trẻ đều đi học rồi."),
    "少": ("这里的苹果不少。", "Táo ở đây không hề ít."),
    "谁": ("他是谁？", "Anh ấy là ai?"),
    "什么": ("你叫什么名字？", "Bạn tên là gì?"),
    "生病": ("他生病了，在家休息。", "Anh ấy bị ốm rồi, đang nghỉ ngơi ở nhà."),
    "十": ("十月一号是国庆节。", "Ngày 1 tháng 10 là ngày Quốc khánh."),
    "时候": ("你什么时候能到饭店？", "Khi nào bạn có thể tới nhà hàng?"),
    "时间": ("你有时间吗？", "Bạn có thời gian rảnh không?"),
    "事": ("今天下午我有很多事。", "Chiều nay tôi có rất nhiều việc."),
    "是": ("我是中国人。", "Tôi là người Trung Quốc."),
    "手机": ("你的手机号是多少？", "Số điện thoại của bạn là bao nhiêu?"),
    "售货员": ("售货员很有礼貌。", "Nhân viên bán hàng rất lịch sự."),
    "书": ("他在看书呢。", "Anh ấy đang đọc sách đấy."),
    "书店": ("我想去书店买汉语书。", "Tôi muốn đi nhà sách mua sách tiếng Trung."),
    "水": ("请喝水。", "Mời uống nước."),
    "水果": ("你想吃什么水果？", "Bạn muốn ăn hoa quả gì?"),
    "睡": ("他睡了八个小时。", "Cậu ấy đã ngủ 8 tiếng."),
    "睡觉": ("他正在睡觉呢。", "Anh ấy đang ngủ đấy."),
    "说": ("他会说汉语。", "Anh ấy biết nói tiếng Trung."),
    "说话": ("上课请不要说话。", "Trong giờ học xin đừng nói chuyện riêng."),
    "四": ("我有四个同学。", "Tôi có 4 người bạn học."),
    "岁": ("他今年二十岁。", "Năm nay cậu ấy 20 tuổi."),
    "他": ("他是我的好朋友。", "Cậu ấy là bạn tốt của tôi."),
    "他们": ("他们都是大学生。", "Họ đều là sinh viên đại học."),
    "它": ("这是一只小猫，它真可爱。", "Đây là một chú mèo con, nó thật dễ thương."),
    "它们": ("那些小鸟真好看，它们在唱歌。", "Những chú chim kia thật đẹp, chúng đang hót."),
    "她": ("她是我的中文老师。", "Cô ấy là giáo viên tiếng Trung của tôi."),
    "她们": ("她们都是中学生。", "Các bạn ấy đều là học sinh trung học."),
    "太": ("今天天气太冷了！", "Thời tiết hôm nay lạnh quá!"),
    "天": ("今天星期日。", "Hôm nay Chủ nhật."),
    "天气": ("今天天气怎么样？", "Hôm nay thời tiết thế nào?"),
    "听": ("他在听歌呢。", "Anh ấy đang nghe nhạc đấy."),
    "听见": ("我听见了敲门声。", "Tôi đã nghe thấy tiếng gõ cửa."),
    "同学": ("同学们好！", "Chào các bạn học sinh!"),
    "外": ("房间外有一只小狗。", "Bên ngoài phòng có một chú cún con."),
    "外边": ("外边下雨了。", "Bên ngoài trời mưa rồi."),
    "玩": ("周末你想去哪儿玩？", "Cuối tuần bạn muốn đi đâu chơi?"),
    "晚": ("今天晚上去看电影吧。", "Tối nay đi xem phim đi nhé."),
    "晚饭": ("你晚饭想吃什么？", "Cơm tối bạn muốn ăn gì?"),
    "晚上": ("我晚上六点半下班。", "Buổi tối 6 rưỡi tôi tan làm."),
    "喂": ("喂，李文，你在哪儿？", "Alo, Lý Văn, bạn đang ở đâu thế?"),
    "问": ("我可以问您一个问题吗？", "Em có thể hỏi cô một câu hỏi được không ạ?"),
    "问题": ("老师，我有一个问题。", "Thưa cô, em có một câu hỏi ạ."),
    "我": ("我叫李文。", "Tôi tên là Lý Văn."),
    "我们": ("我们都是中国人。", "Chúng tôi đều là người Trung Quốc."),
    "五": ("五月二十号。", "Ngày 20 tháng 5."),
    "午饭": ("我们一起吃午饭吧。", "Chúng mình cùng đi ăn cơm trưa đi."),
    "喜欢": ("我喜欢吃中国菜。", "Tôi thích ăn món ăn Trung Quốc."),
    "下": ("下午我们去看电影吧。", "Buổi chiều chúng mình đi xem phim đi."),
    "下班": ("我晚上六点半下班。", "Buổi tối 6 rưỡi tôi tan làm."),
    "下课": ("下课后我们去喝茶吧。", "Tan học xong chúng mình đi uống trà nhé."),
    "下午": ("我下午有课呢。", "Buổi chiều tôi có tiết học đấy."),
    "下雨": ("今天下雨了，不能出去玩。", "Hôm nay trời mưa rồi, không thể ra ngoài chơi."),
    "先生": ("先生，您喝什么？", "Thưa ông, ông muốn uống gì ạ?"),
    "现在": ("现在几点？", "Bây giờ là mấy giờ?"),
    "想": ("我想去超市买东西。", "Tôi muốn đi siêu thị mua đồ."),
    "小": ("房间外有一只小猫。", "Bên ngoài phòng có một chú mèo nhỏ."),
    "小朋友": ("小朋友真可爱！", "Em bé thật đáng yêu!"),
    "小时": ("从北京坐高铁到西安要四个小时。", "Từ Bắc Kinh đi tàu cao tốc đến Tây An mất 4 tiếng."),
    "小学": ("我家旁边有一所小学。", "Cạnh nhà tôi có một trường tiểu học."),
    "小学生": ("他是一名小学生。", "Cậu bé là một học sinh tiểu học."),
    "些": ("我想买一些水果。", "Tôi muốn mua một ít trái cây."),
    "写": ("这个汉字怎么写？", "Chữ Hán này viết như thế nào?"),
    "谢谢": ("谢谢你！", "Cảm ơn bạn!"),
    "新": ("这是我的新手机。", "Đây là chiếc điện thoại mới của tôi."),
    "星期": ("一个星期有七天。", "Một tuần có 7 ngày."),
    "星期日": ("今天星期日，我休息。", "Hôm nay Chủ nhật, tôi nghỉ ngơi."),
    "星期天": ("星期天我们去北京玩吧。", "Chủ nhật chúng mình đi Bắc Kinh chơi nhé."),
    "休息": ("今天我休息。", "Hôm nay tôi nghỉ ngơi."),
    "学": ("他在学汉语呢。", "Anh ấy đang học tiếng Trung đấy."),
    "学生": ("王老师有很多学生。", "Cô Vương có rất nhiều học sinh."),
    "学习": ("我明天上午在学校学习。", "Sáng mai tôi học tập ở trường."),
    "学校": ("学校前边有一家电影院。", "Phía trước trường học có một rạp chiếu phim."),
    "雪": ("昨天下雪了。", "Hôm qua tuyết rơi rồi."),
    "药": ("医生，这个药怎么吃？", "Thưa bác sĩ, thuốc này uống như thế nào?"),
    "要": ("我要买两斤苹果。", "Tôi muốn mua hai cân táo."),
    "也": ("我爸爸也在医院工作。", "Bố tôi cũng làm việc ở bệnh viện."),
    "一": ("一个星期。", "Một tuần."),
    "一半": ("这个西瓜我吃了一半。", "Quả dưa hấu này tôi ăn mất một nửa rồi."),
    "一下": ("请等一下。", "Xin đợi một lát."),
    "一点儿": ("我会说一点儿汉语。", "Tôi biết nói một chút tiếng Trung."),
    "一些": ("我想买一些新衣服。", "Tôi muốn mua một số quần áo mới."),
    "衣服": ("这件衣服真漂亮！", "Chiếc áo này thật đẹp!"),
    "医": ("他在学医。", "Anh ấy đang học ngành y."),
    "医生": ("胡医生在医院工作。", "Bác sĩ Hồ làm việc ở bệnh viện."),
    "医院": ("我爸爸在医院工作。", "Bố tôi làm việc ở bệnh viện."),
    "椅子": ("椅子上有两本书。", "Trên ghế có hai cuốn sách."),
    "有": ("我有两个孩子。", "Tôi có hai đứa con."),
    "有的": ("有的学生喜欢看书，有的喜欢唱歌。", "Có học sinh thích đọc sách, có người lại thích hát."),
    "有点儿": ("今天有点儿冷。", "Hôm nay trời hơi lạnh."),
    "有些": ("有些人喜欢喝茶。", "Có một số người thích uống trà."),
    "雨": ("外面下雨了。", "Bên ngoài trời mưa rồi."),
    "元": ("这本书二十元。", "Cuốn sách này 20 tệ."),
    "月": ("今天5月20号。", "Hôm nay ngày 20 tháng 5."),
    "再": ("明天再见！", "Ngày mai gặp lại nhé!"),
    "再见": ("王老师，再见！", "Chào cô Vương, hẹn gặp lại ạ!"),
    "在": ("我明天上午在学校学习。", "Sáng mai tôi học ở trường."),
    "早": ("早上好！", "Chào buổi sáng!"),
    "早饭": ("你吃早饭了吗？", "Bạn đã ăn sáng chưa?"),
    "早上": ("我早上七点起床。", "Buổi sáng tôi thức dậy lúc 7 giờ."),
    "怎么": ("怎么去西安饭店？", "Đi đến khách sạn Tây An như thế nào?"),
    "怎么样": ("这件衣服怎么样？", "Chiếc áo này thấy thế nào?"),
    "找": ("找你五块钱。", "Trả lại bạn 5 tệ tiền thừa."),
    "这": ("这是我的中文老师。", "Đây là giáo viên tiếng Trung của tôi."),
    "这边": ("请这边走。", "Xin mời đi lối bên này."),
    "这个": ("这个苹果真大！", "Quả táo này to thật!"),
    "这里": ("这里的天气真好。", "Thời tiết ở đây thật đẹp."),
    "这儿": ("这儿的苹果真便宜！", "Táo ở đây thật rẻ!"),
    "这些": ("这些书都是我的。", "Những cuốn sách này đều là của tôi."),
    "真": ("这儿的苹果真便宜！", "Táo ở đây rẻ thật đấy!"),
    "正在": ("我正在开车呢。", "Tôi đang lái xe đây."),
    "只": ("房间外有一只小猫。", "Bên ngoài phòng có một chú mèo nhỏ."),
    "知道": ("你知道李文的手机号吗？", "Bạn có biết số điện thoại của Lý Văn không?"),
    "中午": ("中午我们在饭店吃午饭。", "Buổi trưa chúng tôi ăn cơm ở nhà hàng."),
    "中学": ("这是一所中学。", "Đây là một trường trung học."),
    "中学生": ("我们都是中学生。", "Tất cả chúng tôi đều là học sinh trung học."),
    "住": ("你住在哪里？", "Bạn sống ở đâu?"),
    "桌子": ("桌子上有一本书。", "Trên bàn có một cuốn sách."),
    "字": ("这个字怎么读？", "Chữ này đọc như thế nào?"),
    "昨天": ("昨天下雪了。", "Hôm qua tuyết rơi rồi."),
    "坐": ("我们坐出租车去吧。", "Chúng ta đi xe taxi đi nhé."),
    "做": ("你会做饭吗？", "Bạn biết nấu ăn không?"),
    "做饭": ("妈妈在厨房做饭呢。", "Mẹ đang nấu cơm trong bếp."),
    # Proper Nouns
    "北京": ("大兴机场在北京市。", "Sân bay Đại Hưng nằm ở thành phố Bắc Kinh."),
    "大兴机场": ("大兴机场见！", "Hẹn gặp ở sân bay Đại Hưng nhé!"),
    "法国": ("白家月是法国人。", "Bạch Gia Nguyệt là người Pháp."),
    "汉语": ("他在大学学习汉语。", "Anh ấy học tiếng Trung ở trường đại học."),
    "汉字": ("汉字很有意思。", "Chữ Hán rất thú vị."),
    "胡医生": ("胡医生是北京人。", "Bác sĩ Hồ là người Bắc Kinh."),
    "泰国": ("她是泰国人。", "Cô ấy là người Thái Lan."),
    "王老师": ("王老师是我们的中文老师。", "Cô Vương là giáo viên tiếng Trung của chúng tôi."),
    "西安": ("我想去西安旅游。", "Tôi muốn đi du lịch Tây An."),
    "西安饭店": ("我们坐出租车去西安饭店。", "Chúng tôi đi taxi đến khách sạn Tây An."),
    "中国": ("我是中国人。", "Tôi là người Trung Quốc."),
    "中文": ("李文是我的中文老师。", "Lý Văn là giáo viên tiếng Trung của tôi."),
}

# Group all words by lesson number
lessons_words = {i: [] for i in range(1, 16)}

for hanzi, pinyin, l_list in VOCAB_INDEX:
    for l in l_list:
        lessons_words[l].append((hanzi, pinyin, False))

for hanzi, pinyin, l_list in PROPER_NOUNS:
    for l in l_list:
        lessons_words[l].append((hanzi, pinyin, True))

# Load extracted texts from backup
with open('src/data/newHsk1BookData.ts.bak', 'r', encoding='utf-8') as f:
    orig_content = f.read()

pattern = re.compile(
    r'lessonNumber:\s*(\d+).*?texts:\s*(\[\s*\{.*?\}\s*\])\s*,\s*\n\s*grammarPoints:',
    re.DOTALL
)
extracted_texts = {}
for m in pattern.finditer(orig_content):
    lnum = int(m.group(1))
    extracted_texts[lnum] = m.group(2)

print(f"Extracted texts for {len(extracted_texts)} lessons.")

# Assemble the whole TypeScript file
lines = []
lines.append("import { WordItem } from '../types';\n")
lines.append("export interface DialogueLine {")
lines.append("  speaker: string;")
lines.append("  avatar?: string;")
lines.append("  hanzi: string;")
lines.append("  pinyin: string;")
lines.append("  vietnamese: string;")
lines.append("}\n")
lines.append("export interface LessonText {")
lines.append("  id: string;")
lines.append("  title: string;")
lines.append("  context: string;")
lines.append("  lines: DialogueLine[];")
lines.append("}\n")
lines.append("export interface GrammarPoint {")
lines.append("  id: string;")
lines.append("  title: string;")
lines.append("  explanation: string;")
lines.append("  examples: {")
lines.append("    hanzi: string;")
lines.append("    pinyin: string;")
lines.append("    vietnamese: string;")
lines.append("  }[];")
lines.append("  tip?: string;")
lines.append("}\n")
lines.append("export type ExerciseType =")
lines.append("  | 'fill_blank'")
lines.append("  | 'multiple_choice'")
lines.append("  | 'sentence_scramble'")
lines.append("  | 'translation'")
lines.append("  | 'dialogue_match'")
lines.append("  | 'error_spotting';\n")
lines.append("export interface ExerciseItem {")
lines.append("  id: string;")
lines.append("  type: ExerciseType;")
lines.append("  question: string;")
lines.append("  hanziPrompt?: string;")
lines.append("  pinyinPrompt?: string;")
lines.append("  vietnamesePrompt?: string;")
lines.append("  options: string[];")
lines.append("  scrambleSegments?: string[];")
lines.append("  correctAnswer: string;")
lines.append("  explanation: string;")
lines.append("  grammarFocus?: string;")
lines.append("  audioText?: string;")
lines.append("}\n")
lines.append("export interface TongueTwister {")
lines.append("  title: string;")
lines.append("  hanzi: string;")
lines.append("  pinyin: string;")
lines.append("  vietnamese: string;")
lines.append("}\n")
lines.append("export interface CultureBonus {")
lines.append("  title: string;")
lines.append("  summary: string;")
lines.append("  content: string;")
lines.append("}\n")
lines.append("export interface DetailedTextbookLesson {")
lines.append("  lessonNumber: number;")
lines.append("  titleHanzi: string;")
lines.append("  titlePinyin: string;")
lines.append("  titleVietnamese: string;")
lines.append("  pageStart: number;")
lines.append("  objectives: string[];")
lines.append("  texts: LessonText[];")
lines.append("  grammarPoints: GrammarPoint[];")
lines.append("  vocabulary: WordItem[];")
lines.append("  exercises: ExerciseItem[];")
lines.append("  tongueTwister?: TongueTwister;")
lines.append("  cultureBonus?: CultureBonus;")
lines.append("}\n")
lines.append("export const NEW_HSK1_FULL_LESSONS: DetailedTextbookLesson[] = [")

for lnum in range(1, 16):
    cfg = LESSON_CONFIG[lnum]
    lines.append(f"  // ==========================================================================")
    lines.append(f"  // LESSON {lnum}: {cfg['titleHanzi']} ({cfg['titleVietnamese']})")
    lines.append(f"  // ==========================================================================")
    lines.append("  {")
    lines.append(f"    lessonNumber: {lnum},")
    lines.append(f"    titleHanzi: {json.dumps(cfg['titleHanzi'], ensure_ascii=False)},")
    lines.append(f"    titlePinyin: {json.dumps(cfg['titlePinyin'], ensure_ascii=False)},")
    lines.append(f"    titleVietnamese: {json.dumps(cfg['titleVietnamese'], ensure_ascii=False)},")
    lines.append(f"    pageStart: {cfg['pageStart']},")
    
    # objectives
    lines.append("    objectives: [")
    for obj in cfg["objectives"]:
        lines.append(f"      {json.dumps(obj, ensure_ascii=False)},")
    lines.append("    ],")
    
    # texts
    texts_body = extracted_texts[lnum]
    lines.append(f"    texts: {texts_body},")
    
    # grammarPoints
    lines.append("    grammarPoints: [")
    for gp in cfg["grammarPoints"]:
        lines.append("      {")
        lines.append(f"        id: {json.dumps(gp['id'], ensure_ascii=False)},")
        lines.append(f"        title: {json.dumps(gp['title'], ensure_ascii=False)},")
        lines.append(f"        explanation: {json.dumps(gp['explanation'], ensure_ascii=False)},")
        lines.append("        examples: [")
        for ex in gp["examples"]:
            lines.append("          {")
            lines.append(f"            hanzi: {json.dumps(ex['hanzi'], ensure_ascii=False)},")
            lines.append(f"            pinyin: {json.dumps(ex['pinyin'], ensure_ascii=False)},")
            lines.append(f"            vietnamese: {json.dumps(ex['vietnamese'], ensure_ascii=False)}")
            lines.append("          },")
        lines.append("        ]")
        lines.append("      },")
    lines.append("    ],")
    
    # vocabulary
    lines.append("    vocabulary: [")
    vocab_items = lessons_words[lnum]
    for widx, (hz, py, is_proper) in enumerate(vocab_items, 1):
        meta = WORD_METADATA.get(hz, (py, "", "", "", 0, "Từ vựng"))
        ex_pair = WORD_EXAMPLES.get(hz, (hz, meta[2]))
        
        item_id = f"hsk1-l{lnum}-w{widx}"
        tag_cat = "Danh từ riêng" if is_proper else meta[5]
        
        word_obj = {
            "id": item_id,
            "hanzi": hz,
            "pinyin": meta[0],
            "hanViet": meta[1].lower(),
            "vietnamese": meta[2],
            "hskLevel": 1,
            "radical": meta[3],
            "strokeCount": meta[4],
            "example": ex_pair[0],
            "exampleTranslation": ex_pair[1],
            "tags": [f"Bài {lnum}", tag_cat]
        }
        lines.append(f"      {json.dumps(word_obj, ensure_ascii=False)},")
    lines.append("    ],")
    
    # exercises
    lines.append("    exercises: [")
    for ex in cfg["exercises"]:
        lines.append("      {")
        lines.append(f"        id: {json.dumps(ex['id'], ensure_ascii=False)},")
        lines.append(f"        type: {json.dumps(ex['type'], ensure_ascii=False)},")
        lines.append(f"        question: {json.dumps(ex['question'], ensure_ascii=False)},")
        if "scrambleSegments" in ex:
            lines.append(f"        scrambleSegments: {json.dumps(ex['scrambleSegments'], ensure_ascii=False)},")
        lines.append(f"        options: {json.dumps(ex['options'], ensure_ascii=False)},")
        lines.append(f"        correctAnswer: {json.dumps(ex['correctAnswer'], ensure_ascii=False)},")
        lines.append(f"        explanation: {json.dumps(ex['explanation'], ensure_ascii=False)}")
        lines.append("      },")
    lines.append("    ],")
    
    if lnum == 15:
        lines.append("    cultureBonus: {")
        lines.append('      title: "HSK 1 结业寄语 (Lời chúc tốt nghiệp HSK 1)",')
        lines.append('      summary: "Chúc mừng bạn đã hoàn thành trọn vẹn 15 bài học chuẩn Tân HSK 1 (HSK 3.0)!",')
        lines.append('      content: "Bạn đã làm chủ 319 từ vựng và toàn bộ các điểm ngữ pháp nền tảng của bộ giáo trình Tân HSK 1 3.0. Hãy sẵn sàng tiến bước lên Tân HSK 2 để chinh phục thêm nhiều chủ đề giao tiếp phong phú hơn nữa!"')
        lines.append("    }")
    
    lines.append("  },")

lines.append("];\n")

lines.append("""export const getAllNewHsk1Vocabulary = (): WordItem[] => {
  const map = new Map<string, WordItem>();
  NEW_HSK1_FULL_LESSONS.forEach((lesson) => {
    lesson.vocabulary.forEach((w) => {
      if (!map.has(w.hanzi)) {
        map.set(w.hanzi, w);
      }
    });
  });
  return Array.from(map.values());
};
""")

output_path = 'src/data/newHsk1BookData.ts'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(lines))

print(f"Generated {output_path} successfully! Total lines: {len(lines)}")
