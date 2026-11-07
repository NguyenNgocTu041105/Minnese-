# -*- coding: utf-8 -*-
import fitz, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open(r'D:\giáo trình hsk\新hsk3.pdf')
print(f"Total pages: {len(doc)}")

# Render first 10 pages or search for table of contents
for i in range(min(15, len(doc))):
    text = doc[i].get_text('text')
    if text.strip():
        print(f"=== Page {i+1} has text ===")
        print(text[:300])
    else:
        print(f"Page {i+1} is image/scanned.")
