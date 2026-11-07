import fitz
import os

pdf_path = r"D:\giáo trình hsk\新hsk3.pdf"
doc = fitz.open(pdf_path)
out_dir = r"C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\temp_inspect_hsk3"
os.makedirs(out_dir, exist_ok=True)

for p in range(5, 13):
    page = doc[p]
    pix = page.get_pixmap(dpi=150)
    pix.save(os.path.join(out_dir, f"hsk3_page_{p+1}.png"))

print("Saved HSK3 TOC pages")
