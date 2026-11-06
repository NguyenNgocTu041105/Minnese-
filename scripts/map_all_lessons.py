import sys
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

doc = pymupdf.open(r"D:\giáo trình hsk\新HSK1教程3.0.pdf")

# Page 12 and 13 contain TOC
# Let's inspect where each lesson is
# In the book:
# Page 16 (0-based 15) is Lesson 1 (book page 001)
# Offset between PDF page and book page: 15 (PDF page = book page + 15)

# Let's list the 15 lessons from the TOC:
# Lesson 1: 001 -> PDF 16
# Lesson 2: 005 -> PDF 20
# Lesson 3: 010 -> PDF 25
# Lesson 4: 018 -> PDF 33
# Lesson 5: 027 -> PDF 42
# Lesson 6: 035 -> PDF 50
# Let's verify by rendering the first page of Lesson 4, 5, 6, 7...
lessons_info = [
    (1, 1),
    (2, 5),
    (3, 10),
    (4, 18),
    (5, 27),
    (6, 35),
]

for l_num, book_page in lessons_info:
    pdf_p = book_page + 14  # roughly
    print(f"Lesson {l_num}: Book page {book_page} -> checking PDF page around {pdf_p+1}")
