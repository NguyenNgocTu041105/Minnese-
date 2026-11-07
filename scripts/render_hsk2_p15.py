import fitz
import os

pdf_path = r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf"
doc = fitz.open(pdf_path)
out_dir = r"C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\temp_inspect"

page = doc[14] # page 15 (0-indexed 14)
pix = page.get_pixmap(dpi=150)
pix.save(os.path.join(out_dir, "hsk2_page_15.png"))
print("Saved page 15")
