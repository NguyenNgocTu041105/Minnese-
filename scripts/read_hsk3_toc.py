import pypdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader(r"D:\giáo trình hsk\新hsk3.pdf")
print("Num pages:", len(reader.pages))

# Print pages 5 to 11 (TOC area)
for i in range(5, 12):
    txt = reader.pages[i].extract_text()
    if "目录" in txt or "第一单元" in txt or "第1课" in txt or "第 1 课" in txt or "Lesson" in txt or "机场" in txt:
        print(f"--- Page {i+1} ---")
        print(txt[:1000])
