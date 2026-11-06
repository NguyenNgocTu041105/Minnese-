import sys
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

pdf_path = r"D:\giáo trình hsk\新HSK1教程3.0.pdf"
doc = pymupdf.open(pdf_path)

found = []
for page_num in range(len(doc)):
    text = doc[page_num].get_text()
    if "你好" in text or "谢谢" in text:
        found.append(page_num + 1)

print(f"Pages with '你好' or '谢谢': {found}")

# If not found via text, let's check image count on pages 1-20
if not found:
    print("Checking images on pages 1-20...")
    for p in range(15):
        images = doc[p].get_images()
        print(f"Page {p+1}: {len(images)} images, text length: {len(doc[p].get_text())}")
