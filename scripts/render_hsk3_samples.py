import fitz
import os

pdf_path = r"D:\giáo trình hsk\新hsk3.pdf"
doc = fitz.open(pdf_path)
out_dir = r"C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\temp_hsk3_sample_pages"
os.makedirs(out_dir, exist_ok=True)

# Book page 1 is PDF page 13 (index 12)
# Book page 2 is PDF page 14 (index 13)
# Let's render PDF pages 13, 14, 15, 16, 17, 18, 19, 20
for p in range(12, 22):
    page = doc[p]
    pix = page.get_pixmap(dpi=150)
    pix.save(os.path.join(out_dir, f"hsk3_p{p+1}.png"))

print("Rendered Lesson 1 and 2 pages")
