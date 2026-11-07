import pymupdf

doc2 = pymupdf.open(r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf")

for p in [12, 13, 14]:
    pix = doc2[p].get_pixmap(dpi=150)
    pix.save(f"scratch/hsk2_toc_p{p+1}.png")
    print(f"Rendered hsk2 toc p{p+1}")
