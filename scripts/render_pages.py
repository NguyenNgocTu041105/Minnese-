import sys
import os
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

os.makedirs("scratch/pdf_pages", exist_ok=True)
pdf_path = r"D:\giáo trình hsk\新HSK1教程3.0.pdf"
doc = pymupdf.open(pdf_path)

print("Rendering table of contents / first 25 pages...")
# Table of contents is usually around page 4-8.
# Lesson 1 usually starts after phonetics (around page 10-20).
for p in range(5, 25):
    page = doc[p]
    pix = page.get_pixmap(dpi=100)
    out_path = f"scratch/pdf_pages/page_{p+1}.jpg"
    pix.save(out_path)

print("Saved pages 6 to 25 to scratch/pdf_pages/")
