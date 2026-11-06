import sys
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

doc = pymupdf.open(r"D:\giáo trình hsk\新HSK1教程3.0.pdf")

for p_num in [16, 17, 20, 21, 25, 27, 34, 43]:
    page = doc[p_num - 1]
    images = page.get_images()
    print(f"Page {p_num}: {len(images)} images")
    for img in images:
        xref = img[0]
        base_img = doc.extract_image(xref)
        print(f"  xref {xref}: {base_img['width']}x{base_img['height']}, ext: {base_img['ext']}")
