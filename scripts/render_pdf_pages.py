import pymupdf

doc = pymupdf.open(r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf")

# Lesson 1 starts around page 15-25
for p in range(16, 26):
    pix = doc[p].get_pixmap(dpi=150)
    pix.save(f"scratch/hsk2_l1_p{p+1}.png")
    print(f"Rendered hsk2 p{p+1}")
