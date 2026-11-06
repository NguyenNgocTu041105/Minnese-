import sys
import os
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

pdf_path = r"D:\giáo trình hsk\新HSK1教程3.0.pdf"
doc = pymupdf.open(pdf_path)
print(f"Total pages: {len(doc)}")

# Search for "第一课" or "你好" or "谢谢"
for page_num in range(min(30, len(doc))):
    text = doc[page_num].get_text()
    if "你好" in text or "第一课" in text or "第1课" in text or "谢谢" in text:
        print(f"\n--- Page {page_num + 1} ---")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for l in lines[:10]:
            print("  ", l)
