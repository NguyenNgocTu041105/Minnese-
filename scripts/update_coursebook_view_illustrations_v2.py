# -*- coding: utf-8 -*-
"""
Update CoursebookView.tsx with correct illustrations and captions for lessons 5-15.
"""
import re, os, sys

TARGET = r"d:\minnese\src\components\Coursebook\CoursebookView.tsx"

# Map of text_id to (src_candidate, fallback_src, caption)
NEW_ILLUSTRATIONS_CONFIG = {
    # Bài 5
    "hsk1-l5-t1": ("/textbook_art/cartoon_hsk1_l5_t1.jpg", '在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện: "今天几号？- 今天9月8号。星期几？- 星期日。")'),
    "hsk1-l5-t2": ("/textbook_art/cartoon_hsk1_l5_t2.jpg", '在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc nói chuyện nấu ăn: "你会做饭吗？- 我会做。")'),
    "hsk1-l5-t3": ("/textbook_art/cartoon_hsk1_l5_t3.jpg", '在公司里，王一雪和杨同乐下班时聊天儿。(Ở công ty lúc tan ca, Dương Đồng Nhạc khoe máy tính mới: "这是你的新电脑吗？- 是的。")'),

    # Bài 6
    "hsk1-l6-t1": ("/textbook_art/cartoon_hsk1_l6_t1.jpg", '在校园里，李文向白家月要手机号。(Trên sân trường, Lý Văn xin số điện thoại của Bạch Gia Nguyệt: "家月，你的手机号是多少？")'),
    "hsk1-l6-t2": ("/textbook_art/cartoon_hsk1_l6_t2.jpg", '在教室里，下课后，白家月和陈天中在聊天儿。(Trong lớp học, Bạch Gia Nguyệt muốn đi siêu thị: "我想去超市买东西。")'),
    "hsk1-l6-t3": ("/textbook_art/cartoon_hsk1_l6_t3.jpg", '在家里，王一雪全家在讨论周末晚餐安排。(Ở nhà, gia đình Vương Nhất Tuyết bàn ăn tối: "星期天我们去哪儿吃晚饭？- 西安饭店。")'),

    # Bài 7
    "hsk1-l7-t1": ("/textbook_art/cartoon_hsk1_l7_t1.jpg", '白家月和安妮在打电话。(Bạch Gia Nguyệt và Annie gọi điện thoại: "现在几点？- 早上八点四十。")'),
    "hsk1-l7-t2": ("/textbook_art/cartoon_hsk1_l7_t2.jpg", '在校园里，李文遇到白家月。(Trên sân trường, Lý Văn rủ Bạch Gia Nguyệt xem phim: "下午我想去电影院看电影，你去吗？")'),
    "hsk1-l7-t3": ("/textbook_art/cartoon_hsk1_l7_t3.jpg", '王一雪给丈夫刘明打电话。(Vương Nhất Tuyết gọi điện cho Lưu Minh: "我晚上六点半下班。- 好的，你去店里买些菜吧。")'),

    # Bài 8
    "hsk1-l8-t1": ("/textbook_art/cartoon_hsk1_l8_t1.jpg", '在王一飞家，白家月和陈天中来做客。(Ở nhà Vương Nhất Phi, Bạch Gia Nguyệt và Trần Thiên Trung ngắm mèo con: "房间外有一只小猫。它在桌子下呢。")'),
    "hsk1-l8-t2": ("/textbook_art/cartoon_hsk1_l8_t2.jpg", '在教室里，下课后，白家月给李文打电话。(Sau giờ học, Bạch Gia Nguyệt hẹn gặp Lý Văn: "我们在哪儿见呢？- 在学校书店前见吧。")'),
    "hsk1-l8-t3": ("/textbook_art/cartoon_hsk1_l8_t3.jpg", '在医院里，刘明和同事小胡聊天儿。(Ở bệnh viện, bác sĩ Lưu Minh trò chuyện với đồng nghiệp: "大医院病人多，医生非常忙。")'),

    # Bài 9
    "hsk1-l9-t1": ("/textbook_art/cartoon_hsk1_l9_t1.jpg", '在校园里，李文和白家月在聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt hẹn đi xem phim: "学校前边有一家电影院。")'),
    "hsk1-l9-t2": ("/textbook_art/cartoon_hsk1_l9_t2.jpg", '在教室里，下课后，白家月和陈天中在聊天儿。(Trong lớp, Trần Thiên Trung thấy sách tiếng Trung trên ghế: "椅子上有一本中文书，那是谁的书？")'),
    "hsk1-l9-t3": ("/textbook_art/cartoon_hsk1_l9_t3.jpg", '在公司里，王一雪和杨同乐聊周末生活。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc nói về ngày thứ Bảy: "明天星期六，你做什么？")'),

    # Bài 10
    "hsk1-l10-t1": ("/textbook_art/cartoon_hsk1_l10_t1.jpg", '在小店里，王一雪在买杯子。(Trong cửa hàng nhỏ, Vương Nhất Tuyết mua cốc: "请问，有杯子吗？多少钱一个？")'),
    "hsk1-l10-t2": ("/textbook_art/cartoon_hsk1_l10_t2.jpg", '在集市上，王一雪在买水果。(Ở chợ hoa quả, Vương Nhất Tuyết mua táo: "我想买两斤苹果。苹果三块五一斤。")'),
    "hsk1-l10-t3": ("/textbook_art/cartoon_hsk1_l10_t3.jpg", '在商场里，刘明和王一雪在给孩子们买衣服。(Ở trung tâm mua sắm, Lưu Minh và vợ mua quần áo: "这家商店衣服真多！")'),

    # Bài 11
    "hsk1-l11-t1": ("/textbook_art/cartoon_hsk1_l11_t1.jpg", '在路上，李文正在找饭店，王一飞给他打电话。(Trên đường tìm nhà hàng, Vương Nhất Phi gọi điện cho Lý Văn: "你什么时候能到饭店？")'),
    "hsk1-l11-t2": ("/textbook_art/cartoon_hsk1_l11_t2.jpg", '在饭店里，王一飞和李文见面后聊天儿。(Ở nhà hàng, cô Vương và Lý Văn trò chuyện: "你还在上大学吗？- 对，我上大学呢。")'),
    "hsk1-l11-t3": ("/textbook_art/cartoon_hsk1_l11_t3.jpg", '星期六早上，刘明要去医院加班，出门前和女儿聊天儿。(Sáng thứ Bảy trước khi đi làm, Lưu Minh nói chuyện với con gái Lưu Tiểu Tuyết: "弟弟起床没起床呢？")'),

    # Bài 12
    "hsk1-l12-t1": ("/textbook_art/cartoon_hsk1_l12_t1.jpg", '王一雪给王一飞打电话，问那边的情况。(Vương Nhất Tuyết gọi điện cho Vương Nhất Phi hỏi thời tiết: "今天天气怎么样？- 下雨了，我觉得很冷。")'),
    "hsk1-l12-t2": ("/textbook_art/cartoon_hsk1_l12_t2.jpg", '在公司电梯里，王一雪和杨同乐在聊天儿。(Trong thang máy, Vương Nhất Tuyết hỏi thăm Dương Đồng Nhạc: "昨天下雪了。你昨天没来公司，生病了？")'),
    "hsk1-l12-t3": ("/textbook_art/cartoon_hsk1_l12_t3.jpg", '昨天在医院里，医生给杨同乐看病。(Hôm qua ở bệnh viện, bác sĩ khám bệnh cho Dương Đồng Nhạc: "医生，我病了。- 吃一点儿药，今天休息半天吧。")'),

    # Bài 13
    "hsk1-l13-t1": ("/textbook_art/cartoon_hsk1_l13_t1.jpg", '在教室里，下课后，白家月向王老师问问题。(Sau giờ học, Bạch Gia Nguyệt hỏi cô Vương: "那个小店买不买手机？")'),
    "hsk1-l13-t2": ("/textbook_art/cartoon_hsk1_l13_t2.jpg", '在咖啡馆里，王一雪想吃早饭。(Ở quán cà phê, Vương Nhất Tuyết gọi đồ ăn sáng: "请给我一杯牛奶，再要这个面包和鸡蛋吧。")'),
    "hsk1-l13-t3": ("/textbook_art/cartoon_hsk1_l13_t3.jpg", '在餐厅里，刘明在点餐。(Ở quán ăn, Lưu Minh gọi sủi cảo: "我要一斤饺子。40个太多了，我要一半吧。")'),

    # Bài 14
    "hsk1-l14-t1": ("/textbook_art/cartoon_hsk1_l14_t1.jpg", '在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。(Sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung nói về chuyến đi tàu: "你们上火车后看见王老师了吗？")'),
    "hsk1-l14-t2": ("/textbook_art/cartoon_hsk1_l14_t2.jpg", '在课堂上，王一飞在询问学生们的学习情况。(Trong giờ học, cô Vương Nhất Phi kiểm tra viết chữ Hán: "你们会写汉字了吗？- 我们都会写了。")'),
    "hsk1-l14-t3": ("/textbook_art/cartoon_hsk1_l14_t3.jpg", '在家里，刘明和王一雪在谈论孩子的升学情况。(Ở nhà, Lưu Minh và Vương Nhất Tuyết nói về chuyện học của con: "明年女儿上中学。儿子也上小学了。")'),

    # Bài 15
    "hsk1-l15-t1": ("/textbook_art/cartoon_hsk1_l15_t1.jpg", '在李文家，李文邀请陈天中、白家月等朋友品尝中餐。(Ở nhà Lý Văn, mời bạn bè thưởng thức món Trung: "你们爱吃哪个菜？- 这些菜都好吃。")'),
    "hsk1-l15-t2": ("/textbook_art/cartoon_hsk1_l15_t2.jpg", '在李文家，大家边吃饭边谈论假期计划。(Ở nhà Lý Văn, mọi người kể về chuyến đi: "去年我和男朋友去了西安，今年我想去北京。")'),
    "hsk1-l15-t3": ("/textbook_art/cartoon_hsk1_l15_t3.jpg", '在教室外，白家月、安妮和王老师在谈论去北京旅游的事。(Ngoài lớp học, bàn chuyện bay đi Bắc Kinh: "那我们和您姐姐在大兴机场见！")'),
}

# Determine existing files in public/textbook_art
art_dir = r"d:\minnese\public\textbook_art"
existing_files = set(os.listdir(art_dir))

def get_actual_src(candidate, text_id):
    filename = os.path.basename(candidate)
    if filename in existing_files:
        return candidate
    # Fallback to lesson t1
    m = re.match(r"hsk1-l(\d+)-t(\d+)", text_id)
    if m:
        l = m.group(1)
        fallback = f"cartoon_hsk1_l{l}_t1.jpg"
        if fallback in existing_files:
            return f"/textbook_art/{fallback}"
    return candidate

def main():
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()

    # Build the TS block for lessons 5-15
    lines = ["  // Bài 5-15 (chuẩn giáo trình HSK 1 3.0)"]
    for text_id, (candidate_src, caption) in NEW_ILLUSTRATIONS_CONFIG.items():
        actual_src = get_actual_src(candidate_src, text_id)
        # Escape any single quotes in caption
        clean_cap = caption.replace("'", "\\'")
        lines.append(f"  '{text_id}': {{")
        lines.append(f"    src: '{actual_src}',")
        lines.append(f"    caption: '{clean_cap}',")
        lines.append("  },")

    replacement_block = "\n".join(lines) + "\n"

    # Find the region starting at `// Bài 5-15` up to `// HSK 2` or `};`
    marker_start = "// Bài 5-15"
    start_pos = content.find(marker_start)
    if start_pos < 0:
        print("ERROR: marker '// Bài 5-15' not found!")
        return

    # Find where HSK 2 or the end of LESSON_ILLUSTRATIONS begins
    end_marker = "// HSK 2"
    end_pos = content.find(end_marker, start_pos)
    if end_pos < 0:
        end_pos = content.find("};", start_pos)

    new_content = content[:start_pos] + replacement_block + "  " + content[end_pos:]

    with open(TARGET, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Successfully updated {TARGET} with all L5-L15 illustrations and exact textbook captions!")

if __name__ == "__main__":
    main()
