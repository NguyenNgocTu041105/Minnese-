import fitz # PyMuPDF
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc2 = fitz.open(r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf")
print("HSK 2 total pages:", len(doc2))

# Let's inspect TOC pages (usually pages 6 to 15)
for i in range(5, 16):
    text = doc2[i].get_text()
    if "第" in text or "课" in text or "目录" in text:
        print(f"--- HSK2 Page {i+1} ---")
        print(text[:500])
