import fitz
import os

# HSK 2 Vocab pages (from book page 141 to end of vocab)
doc2 = fitz.open(r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf")
out_dir2 = r"C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\hsk2_vocab_pages"
os.makedirs(out_dir2, exist_ok=True)

# Book page 1 is PDF page 17 or so (let's check where page 141 is: around 155-164)
for p in range(150, len(doc2)):
    doc2[p].get_pixmap(dpi=150).save(os.path.join(out_dir2, f"hsk2_p{p+1}.png"))

print(f"Rendered HSK2 vocab pages: {len(doc2) - 150} pages")

# HSK 3 Vocab pages (book page 174-182, PDF has 212 pages, book p1 is PDF p13, so 174 is around 185-196)
doc3 = fitz.open(r"D:\giáo trình hsk\新hsk3.pdf")
out_dir3 = r"C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\hsk3_vocab_pages"
os.makedirs(out_dir3, exist_ok=True)

for p in range(180, 200):
    doc3[p].get_pixmap(dpi=150).save(os.path.join(out_dir3, f"hsk3_p{p+1}.png"))

print("Rendered HSK3 vocab pages: 20 pages")
