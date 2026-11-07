import docx
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document(r'D:\Ảnh bài khóa\hsk 1 3.0.docx')

print(f"Total paragraphs: {len(doc.paragraphs)}")
for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    # Check if has images (blip)
    has_image = "blip" in p._p.xml
    if text or has_image:
        print(f"P{i:03d} (img={has_image}): {text}")
