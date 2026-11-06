# -*- coding: utf-8 -*-
import fitz # PyMuPDF
import sys, os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

pdf_path = r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf"
doc = fitz.open(pdf_path)
print("Total pages in HSK 2 PDF:", len(doc))

out_dir = r"scratch\pdf_pages_hsk2"
os.makedirs(out_dir, exist_ok=True)

# Render pages 1 to 10 to inspect table of contents
for p in range(min(10, len(doc))):
    page = doc[p]
    pix = page.get_pixmap(dpi=150)
    out_path = os.path.join(out_dir, f"page_{p+1}.jpg")
    pix.save(out_path)
    print(f"Rendered page {p+1} -> {out_path}")
