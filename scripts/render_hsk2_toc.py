import fitz
import os

pdf_path = r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf"
doc = fitz.open(pdf_path)

out_dir = r"C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\temp_inspect"
os.makedirs(out_dir, exist_ok=True)

# Save TOC pages (pages 8, 9, 10, 11, 12, 13, 14 in 0-indexed: 7, 8, 9, 10, 11, 12, 13)
for p in range(7, 14):
    page = doc[p]
    pix = page.get_pixmap(dpi=150)
    pix.save(os.path.join(out_dir, f"hsk2_page_{p+1}.png"))

print("Saved HSK2 TOC pages to temp_inspect")
