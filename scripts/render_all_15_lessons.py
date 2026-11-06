import sys
import os
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

doc = pymupdf.open(r"D:\giáo trình hsk\新HSK1教程3.0.pdf")

# Lessons 1 to 15 start pages from TOC:
# Lesson 1: book p.1 -> doc p.15 (16)
# Lesson 2: book p.5 -> doc p.19 (20)
# Lesson 3: book p.10 -> doc p.24 (25)
# Lesson 4: book p.18 -> doc p.32 (33)
# Lesson 5: book p.27 -> doc p.41 (42)
# Lesson 6: book p.35 -> doc p.49 (50)
# Lesson 7: book p.45 -> doc p.59 (60)
# Lesson 8: book p.54 -> doc p.68 (69)
# Lesson 9: book p.61 -> doc p.75 (76)
# Lesson 10: book p.70 -> doc p.84 (85)
# Lesson 11: book p.78 -> doc p.92 (93)
# Lesson 12: book p.86 -> doc p.100 (101)
# Lesson 13: book p.95 -> doc p.109 (110)
# Lesson 14: book p.103 -> doc p.117 (118)
# Lesson 15: book p.112 -> doc p.126 (127)

lesson_starts = [
    (1, 15, "AI小语，你好！"),
    (2, 19, "我叫李文"),
    (3, 24, "我是中国人"),
    (4, 32, "我有两个孩子"),
    (5, 41, "今天我休息"),
    (6, 49, "你的手机号是多少？"),
    (7, 59, "我晚上六点半下班"),
    (8, 68, "我爸爸也在医院工作"),
    (9, 75, "我明天上午在学校学习"),
    (10, 84, "这儿的苹果真便宜！"),
    (11, 92, "我读大学呢"),
    (12, 100, "昨天下了雪"),
    (13, 109, "请给我一杯茶"),
    (14, 117, "我看了一个电影"),
    (15, 126, "大兴机场见！"),
]

for l_num, start_idx, title in lesson_starts:
    # Render the first 2 pages of each lesson
    p1 = doc[start_idx]
    pix1 = p1.get_pixmap(dpi=100)
    pix1.save(f"scratch/pdf_pages/l{l_num}_p1.jpg")
    if start_idx + 1 < len(doc):
        p2 = doc[start_idx + 1]
        pix2 = p2.get_pixmap(dpi=100)
        pix2.save(f"scratch/pdf_pages/l{l_num}_p2.jpg")
    print(f"Rendered Lesson {l_num}: {title} (doc pages {start_idx+1}, {start_idx+2})")

print("All 15 lessons preview rendered to scratch/pdf_pages/")
