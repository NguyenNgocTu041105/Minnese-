import sys
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

pdf_path = r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf"
doc = pymupdf.open(pdf_path)
print(f"Total pages in GTC HSK2: {len(doc)}")

# Render first 5 pages
for p in range(min(5, len(doc))):
    page = doc[p]
    pix = page.get_pixmap(dpi=100)
    pix.save(f"scratch/pdf_pages/gtc_hsk2_p{p+1}.jpg")

print("Saved GTC HSK2 first 5 pages")
