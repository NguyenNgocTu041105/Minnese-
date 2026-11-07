# -*- coding: utf-8 -*-
import docx
import re
import io
import os
import sys
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

doc = docx.Document(r"D:\Ảnh bài khóa\hsk 2 3.0.docx")

out_dir = os.path.join("public", "textbook_art")
os.makedirs(out_dir, exist_ok=True)

cur_lesson = 0
cur_text = 0
extracted = []

for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    m_lesson = re.match(r"^Bài\s*(\d+)", text, re.IGNORECASE)
    if m_lesson:
        cur_lesson = int(m_lesson.group(1))
        cur_text = 0

    m_text = re.search(r"(?:课文|Bài khóa|文)\s*(\d+)", text, re.IGNORECASE)
    if m_text:
        cur_text = int(m_text.group(1))

    xml = p._p.xml
    rids = re.findall(r'r:embed="(rId\d+)"', xml)
    if rids:
        info = []
        for rid in rids:
            part = doc.part.rels[rid].target_part
            im = Image.open(io.BytesIO(part.blob))
            info.append((rid, im.size, len(part.blob), im))
        print(f"P{i:03d} [L{cur_lesson} T{cur_text}]: { [(r, sz, b//1024) for r, sz, b, _ in info] }")
        # Save the largest/main illustration if multiple blips exist, or inspect what the 2 blips are
        # Wait: let's save all blips for inspection first, and also pick the main illustration
        for idx, (rid, sz, b_len, im) in enumerate(info):
            if sz[0] >= 300 and sz[1] >= 200:
                tid = f"hsk2-l{cur_lesson}-t{cur_text}"
                fn = f"hsk2_30_l{cur_lesson}_t{cur_text}.png"
                if any(x[0] == tid for x in extracted):
                    fn_alt = f"hsk2_30_l{cur_lesson}_t{cur_text}_alt{idx}.png"
                    im.save(os.path.join(out_dir, fn_alt), "PNG")
                    print(f"   -> Also saved alt image {fn_alt} ({sz[0]}x{sz[1]})")
                else:
                    im.save(os.path.join(out_dir, fn), "PNG")
                    extracted.append((tid, fn, sz))
                    print(f"   -> Saved {fn} ({sz[0]}x{sz[1]})")

print(f"\nTotal distinct HSK 2 scene images extracted: {len(extracted)}")
