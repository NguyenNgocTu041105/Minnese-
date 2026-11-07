import fitz
import os

pdf_path = r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf"
doc = fitz.open(pdf_path)
out_dir = r"C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\temp_hsk2_l5_l7"
os.makedirs(out_dir, exist_ok=True)

# Find where book page 37 is
# Book page 1 was PDF page 23 (index 22). Let's check index 55-65 for Lesson 5
for idx in range(len(doc)):
    # Let's save pages around index 55-62 (Lesson 5)
    # around index 65-72 (Lesson 6)
    # around index 75-82 (Lesson 7)
    # around index 120-128 (Lesson 12)
    # around index 155-163 (Vocab list)
    pass

print(f"Total pages in HSK2: {len(doc)}")
# Let's render sample pages to locate Lesson 5
for p in [56, 57, 58, 59, 60, 61, 62, 63, 64, 65]:
    pix = doc[p].get_pixmap(dpi=100)
    pix.save(os.path.join(out_dir, f"page_{p+1}.png"))
