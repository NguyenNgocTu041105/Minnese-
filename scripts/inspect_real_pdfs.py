import sys, pymupdf

sys.stdout.reconfigure(encoding="utf-8")

doc1 = pymupdf.open(r"D:\giáo trình hsk\新HSK1教程3.0.pdf")
print("=== HSK 1 Pages 4 to 8 ===")
for p in range(3, 8):
    print(f"\n--- Page {p+1} ---")
    print(doc1[p].get_text()[:600])

doc2 = pymupdf.open(r"D:\giáo trình hsk\[Xixi 3.0] GTC HSK2.pdf")
print("\n=== HSK 2 Pages 4 to 8 ===")
for p in range(3, 8):
    print(f"\n--- Page {p+1} ---")
    print(doc2[p].get_text()[:600])
