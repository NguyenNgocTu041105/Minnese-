import fitz

doc = fitz.open(r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf")
print("Total pages in HSK2:", len(doc))

# Search for "词语表" or page number in text / or check page index
# Book page 141 was listed in TOC as 词语表
# Let's find book page 141:
for i in range(140, len(doc)):
    # Render small thumbnail or check
    pass
