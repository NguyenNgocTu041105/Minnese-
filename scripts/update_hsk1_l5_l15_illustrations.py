"""Rewrite HSK1 lesson 5-15 entries of LESSON_ILLUSTRATIONS in CoursebookView.tsx
so every image/caption matches its dialogue content."""
import io
import re

PATH = "src/components/Coursebook/CoursebookView.tsx"

# id -> (image file, caption)
DATA = [
    ("hsk1-l5-t1", "l5_t1", "在学校，安妮和陈天中聊家庭。(Ở trường, Annie và Trần Thiên Trung xem ảnh gia đình: \"你家有几口人？- 我家有三口人。\")"),
    ("hsk1-l5-t2", "l5_t2", "过生日，小女孩今年四岁了。(Sinh nhật bé gái, bé năm nay bốn tuổi: \"她今年四岁了。\")"),
    ("hsk1-l5-t3", "l5_t3", "在学校走廊，学生们问李老师多大了。(Ở hành lang, sinh viên tò mò hỏi: \"李老师多大了？\")"),
    ("hsk1-l6-t1", "l6_t1", "在校园里，李文和白家月谈论语言技能。(Trên sân trường: \"你会说汉语吗？- 我会说汉语。\")"),
    ("hsk1-l6-t2", "l6_t2", "在厨房里谈论中国菜。(Trong bếp: \"中国菜好吃吗？- 很好吃。你会做吗？- 我不会做。\")"),
    ("hsk1-l6-t3", "l6_t3", "在办公室写汉字。(Trong văn phòng: \"这个字怎么写？- 这个字我会读，不会写。\")"),
    ("hsk1-l7-t1", "l7_t1", "看日历问日期。(Xem lịch hỏi ngày: \"今天几号？- 9月1号。今天星期几？- 星期三。\")"),
    ("hsk1-l7-t2", "l7_t2", "谈论昨天与明天。(Lên kế hoạch ngày mai: \"明天是9月2号，星期四。\")"),
    ("hsk1-l8-t1", "l8_t1", "在餐厅点饮品和饭菜。(Trong nhà hàng: \"你想喝什么？- 我想喝茶。你想吃什么？- 我想吃米饭。\")"),
    ("hsk1-l8-t2", "l8_t2", "在商店买杯子。(Trong cửa hàng: \"这个杯子多少钱？- 28块。那个杯子18块。\")"),
    ("hsk1-l9-t1", "l9_t1", "在客厅谈论宠物的位置。(Ở phòng khách: \"小猫在椅子下面，小狗在椅子上面。\")"),
    ("hsk1-l9-t2", "l9_t2", "谈论工作单位。(Nói về nơi làm việc: \"我在学校工作，我儿子在医院工作。\")"),
    ("hsk1-l10-t1", "l10_t1", "在图书馆找座位。(Trong thư viện: \"这儿有人吗？- 没有。- 我能坐这儿吗？- 请坐。\")"),
    ("hsk1-l11-t1", "l11_t1", "看手表问时间。(Xem đồng hồ: \"现在几点？- 现在十点十分。\")"),
    ("hsk1-l11-t2", "l11_t2", "安排日程。(Gia đình sắp xếp lịch: \"爸爸下午五点回家，六点三十分看电影。\")"),
    ("hsk1-l12-t1", "l12_t1", "谈论天气。(Trò chuyện về thời tiết: \"昨天北京的天气怎么样？\")"),
    ("hsk1-l12-t2", "l12_t2", "关心天气与身体。(Hỏi thời tiết: \"今天会下雨吗？- 天气太冷了。\")"),
    ("hsk1-l13-t1", "l13_t1", "打电话。(Gọi điện thoại: \"你在做什么呢？- 我在看书呢。\")"),
    ("hsk1-l14-t1", "l14_t1", "昨天上午去商店买东西。(Trước ký túc xá: \"我去商店买东西了。\")"),
    ("hsk1-l14-t2", "l14_t2", "谈论朋友去学开车。(Nói về bạn: \"他去学开车了，40分钟后回来。\")"),
    ("hsk1-l15-t1", "l15_t1", "谈论出行方式。(Nói về phương tiện: \"你是怎么来的？- 我是坐飞机来的。\")"),
    ("hsk1-l15-t2", "l15_t2", "谈论是怎么认识的。(Kể lần đầu quen nhau: \"我们是2011年9月在大学认识的。\")"),
]

block = ["  // Bài 5-15 (khớp nội dung hội thoại)"]
for key, img, cap in DATA:
    cap = cap.replace("'", "\\'")
    block.append(f"  '{key}': {{\n    src: '/textbook_art/cartoon_hsk1_{img}.jpg',\n    caption: '{cap}',\n  }},")
new_block = "\n".join(block) + "\n\n"

with io.open(PATH, encoding="utf8", newline="") as f:
    text = f.read()
nl = "\r\n" if "\r\n" in text else "\n"
text = text.replace("\r\n", "\n")
start = text.index("  // Bài 5\n")
end = text.index("  // HSK 2 - Bài 1")
text = text[:start] + new_block + text[end:]
if nl == "\r\n":
    text = text.replace("\n", "\r\n")
with io.open(PATH, "w", encoding="utf8", newline="") as f:
    f.write(text)
print("updated", len(DATA))
