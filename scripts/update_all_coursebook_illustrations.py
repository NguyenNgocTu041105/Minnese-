import re

illustrations_dict = """const LESSON_ILLUSTRATIONS: Record<string, { src: string; caption: string }> = {
  // Bài 1
  'hsk1-l1-t1': {
    src: '/textbook_art/official_l1_t1.jpg',
    caption: '开学第一天，在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: "AI小语，你好！")',
  },
  'hsk1-l1-t2': {
    src: '/textbook_art/official_l1_t2.jpg',
    caption: '开学第一天，课堂上，学生们向老师问好。(Trong lớp học, các bạn sinh viên chào cô giáo: "老师，您好！")',
  },
  'hsk1-l1-t3': {
    src: '/textbook_art/official_l1_t3.jpg',
    caption: '开学第一天，课堂上，学生们致谢与告别。(Cuối buổi học, sinh viên cảm ơn và chào tạm biệt: "谢谢！- 不客气！- 老师，再见！")',
  },

  // Bài 2
  'hsk1-l2-t1': {
    src: '/textbook_art/official_l2_t1.jpg',
    caption: '在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi thăm các bạn sinh viên).',
  },
  'hsk1-l2-t2': {
    src: '/textbook_art/official_l2_t2.jpg',
    caption: '在教室里，王一飞询问陈天中的名字。(Cô giáo hỏi tên bạn sinh viên: "请问，你叫什么名字？ - 我叫陈天中。")',
  },

  // Bài 3
  'hsk1-l3-t1': {
    src: '/textbook_art/official_l3_t1.jpg',
    caption: '在校园里，李文和白家月第一次相遇，两人继续聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt uống trà trò chuyện: "我是中国人。- 我是法国人。")',
  },
  'hsk1-l3-t2': {
    src: '/textbook_art/official_l3_t2.jpg',
    caption: '在教室里，下课后，安妮在看陈天中手机里的照片。(Sau giờ học, Annie và Trần Thiên Trung vui vẻ xem ảnh bạn gái trên điện thoại).',
  },
  'hsk1-l3-t3': {
    src: '/textbook_art/official_l3_t1.jpg',
    caption: '在校园里，朋友互相询问国籍。(Các bạn sinh viên giao lưu làm quen và hỏi quốc tịch).',
  },

  // Bài 4
  'hsk1-l4-t1': {
    src: '/textbook_art/official_l4_t1.jpg',
    caption: '在家里，刘明和王一雪在聊天儿。(Tại phòng khách ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện về công việc giảng dạy của cô Nhất Phi).',
  },
  'hsk1-l4-t2': {
    src: '/textbook_art/official_l4_t1.jpg',
    caption: '在公司里，王一雪和杨同乐休息时聊天儿。(Tại công ty, các đồng nghiệp nghỉ giải lao trò chuyện về gia đình).',
  },

  // Bài 5
  'hsk1-l5-t1': {
    src: '/textbook_art/official_l5_t1.jpg',
    caption: '在家里，刘明和王一雪看日历聊天儿。(Hai vợ chồng xem lịch và hỏi ngày tháng: "今天几号？- 今天9月8号。")',
  },
  'hsk1-l5-t2': {
    src: '/textbook_art/official_l5_t1.jpg',
    caption: '询问年龄与休息日安排。(Hỏi thăm về tuổi và lịch nghỉ ngơi).',
  },
  'hsk1-l5-t3': {
    src: '/textbook_art/official_l5_t1.jpg',
    caption: '询问老师的年龄。(Trò chuyện về tuổi tác của thầy cô giáo).',
  },

  // Bài 6
  'hsk1-l6-t1': {
    src: '/textbook_art/official_l6_t1.jpg',
    caption: '在校园里，李文向白家月要手机号。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt trao đổi số điện thoại liên lạc).',
  },
  'hsk1-l6-t2': {
    src: '/textbook_art/official_l6_t1.jpg',
    caption: '在餐馆里，询问中国菜与烹饪。(Trò chuyện về món ăn Trung Quốc: "你会做中国菜吗？")',
  },
  'hsk1-l6-t3': {
    src: '/textbook_art/official_l6_t1.jpg',
    caption: '在教室里，学习写汉字。(Học cách đọc và viết chữ Hán trong lớp).',
  },

  // Bài 7
  'hsk1-l7-t1': {
    src: '/textbook_art/official_l7_t1.jpg',
    caption: '白家月和安妮在打电话。(Bạch Gia Nguyệt và Annie gọi điện thoại hẹn giờ gặp mặt: "现在几点？- 早上八点四十。")',
  },
  'hsk1-l7-t2': {
    src: '/textbook_art/official_l7_t1.jpg',
    caption: '询问昨天的日期与明天的安排。(Hỏi ngày tháng và lịch trình học tập).',
  },

  // Bài 8
  'hsk1-l8-t1': {
    src: '/textbook_art/official_l8_t1.jpg',
    caption: '在王一飞家，白家月和陈天中来做客。(Đến chơi nhà cô giáo, các bạn thích thú nhìn chú mèo mướp ngủ ngoan dưới bàn).',
  },
  'hsk1-l8-t2': {
    src: '/textbook_art/official_l8_t1.jpg',
    caption: '在商店里买杯子。(Hỏi giá tiền khi mua sắm đồ dùng).',
  },

  // Bài 9
  'hsk1-l9-t1': {
    src: '/textbook_art/official_l9_t1.jpg',
    caption: '在校园里，询问宠物和物品的位置。(Hỏi vị trí của đồ vật và thú cưng: "小猫在哪儿？")',
  },
  'hsk1-l9-t2': {
    src: '/textbook_art/official_l9_t1.jpg',
    caption: '询问工作单位与职业。(Hỏi nơi công tác: làm việc ở bệnh viện, trường học).',
  },

  // Bài 10
  'hsk1-l10-t1': {
    src: '/textbook_art/official_l10_t1.jpg',
    caption: '在水果店买苹果。(Đi mua hoa quả tươi: "这儿的苹果真便宜！")',
  },

  // Bài 11
  'hsk1-l11-t1': {
    src: '/textbook_art/official_l11_t1.jpg',
    caption: '在大学图书馆学习与询问时间。(Sinh viên trao đổi lịch học và giờ ăn trưa: "现在几点？")',
  },
  'hsk1-l11-t2': {
    src: '/textbook_art/official_l11_t1.jpg',
    caption: '询问爸爸回家的时间与看电影安排。(Hỏi giờ xem phim và sinh hoạt gia đình).',
  },

  // Bài 12
  'hsk1-l12-t1': {
    src: '/textbook_art/official_l12_t1.jpg',
    caption: '询问北京的天气与季节变化。(Hỏi thăm thời tiết: "昨天北京的天气怎么样？")',
  },
  'hsk1-l12-t2': {
    src: '/textbook_art/official_l12_t1.jpg',
    caption: '询问今天是否会下雨。(Trò chuyện về dự báo thời tiết có mưa hay không).',
  },

  // Bài 13
  'hsk1-l13-t1': {
    src: '/textbook_art/official_l13_t1.jpg',
    caption: '在茶馆里点茶。(Gọi đồ uống truyền thống Trung Hoa: "请给我一杯茶。")',
  },

  // Bài 14
  'hsk1-l14-t1': {
    src: '/textbook_art/official_l14_t1.jpg',
    caption: '昨天上午去商店买东西。(Kể về việc đi mua sắm quần áo và đồ dùng).',
  },
  'hsk1-l14-t2': {
    src: '/textbook_art/official_l14_t1.jpg',
    caption: '询问朋友什么时候回来。(Hỏi thời gian bạn học đi học lái xe trở về).',
  },

  // Bài 15
  'hsk1-l15-t1': {
    src: '/textbook_art/official_l15_t1.jpg',
    caption: '在大兴国际机场接机。(Đón bạn tại Sân bay Quốc tế Đại Hưng Bắc Kinh: "大兴机场见！- 我是坐飞机来的。")',
  },
  'hsk1-l15-t2': {
    src: '/textbook_art/official_l15_t1.jpg',
    caption: '回忆当初相识的时间与地点。(Nhắc lại kỷ niệm quen nhau thời đại học).',
  },
};"""

with open("src/components/Coursebook/CoursebookView.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Replace LESSON_ILLUSTRATIONS block
pattern = r"const LESSON_ILLUSTRATIONS: Record<string, \{ src: string; caption: string \}> = \{.*?\};\n"
match = re.search(pattern, text, flags=re.DOTALL)
if match:
    text = text[:match.start()] + illustrations_dict + "\n" + text[match.end():]
    with open("src/components/Coursebook/CoursebookView.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated all 15 lessons in LESSON_ILLUSTRATIONS successfully!")
else:
    print("Could not match LESSON_ILLUSTRATIONS pattern")
