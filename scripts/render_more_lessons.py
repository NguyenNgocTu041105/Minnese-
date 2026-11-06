import sys
import os
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

doc = pymupdf.open(r"D:\giáo trình hsk\新HSK1教程3.0.pdf")

# Let's render pages around Lesson 3, 4, 5, 6, 7
# Lesson 3: 25, 26, 27
# Lesson 4: 33, 34, 35, 36
# Lesson 5: 42, 43, 44, 45
# Lesson 6: 50, 51, 52, 53
# Lesson 7: 60, 61, 62, 63

pages_to_render = [
    25, 26, 27,       # Lesson 3 (0-based 24, 25, 26)
    33, 34, 35, 36,   # Lesson 4 (0-based 32, 33, 34, 35)
    42, 43, 44, 45,   # Lesson 5 (0-based 41, 42, 43, 44)
    50, 51, 52, 53,   # Lesson 6 (0-based 49, 50, 51, 52)
    60, 61, 62, 63,   # Lesson 7 (0-based 59, 60, 61, 62)
]

for p in pages_to_render:
    page = doc[p-1]
    pix = page.get_pixmap(dpi=120)
    pix.save(f"scratch/pdf_pages/page_{p}.jpg")

print(f"Rendered {len(pages_to_render)} pages to scratch/pdf_pages/")
