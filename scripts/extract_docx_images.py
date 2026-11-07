import docx
import os

doc = docx.Document(r'D:\Ảnh bài khóa\hsk 1 3.0.docx')

os.makedirs('scripts/docx_extracted', exist_ok=True)
count = 0
for rel in doc.part.rels.values():
    if "image" in rel.target_ref:
        img_part = rel.target_part
        count += 1
        fn = f"scripts/docx_extracted/img_{count:03d}.png"
        with open(fn, "wb") as f:
            f.write(img_part.blob)
        print(f"Extracted {fn}, size: {len(img_part.blob)} bytes")

print(f"Total extracted: {count}")
