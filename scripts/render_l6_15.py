import sys
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

doc = pymupdf.open(r"D:\giáo trình hsk\新HSK1教程3.0.pdf")

# Notice the pattern in every lesson:
# Lesson Start (Warmup/Goals) -> Text 1 (usually page 1 or 2 of lesson) -> Text 2 (usually page 3 of lesson)
# Let's inspect pages for Lessons 6 to 15
lesson_starts = [
    (6, 49),   # Lesson 6 starts at doc index 49 (page 50)
    (7, 59),   # Lesson 7 starts at doc index 59 (page 60)
    (8, 68),   # Lesson 8 starts at doc index 68 (page 69)
    (9, 75),   # Lesson 9 starts at doc index 75 (page 76)
    (10, 84),  # Lesson 10 starts at doc index 84 (page 85)
    (11, 92),  # Lesson 11 starts at doc index 92 (page 93)
    (12, 100), # Lesson 12 starts at doc index 100 (page 101)
    (13, 109), # Lesson 13 starts at doc index 109 (page 110)
    (14, 117), # Lesson 14 starts at doc index 117 (page 118)
    (15, 126), # Lesson 15 starts at doc index 126 (page 127)
]

for l_num, start_idx in lesson_starts:
    print(f"\nLesson {l_num}:")
    for offset in range(1, 5):
        p_idx = start_idx + offset
        if p_idx < len(doc):
            page = doc[p_idx]
            pix = page.get_pixmap(dpi=80)
            pix.save(f"scratch/pdf_pages/l{l_num}_off{offset}.jpg")
    print(f"  Rendered offsets 1..4 for Lesson {l_num}")

print("\nDone rendering lessons 6 to 15 offsets")
