# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts.bak', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to extract texts block for each lesson:
# lessonNumber: X ... texts: [ ... ], grammarPoints:
pattern = re.compile(
    r'lessonNumber:\s*(\d+).*?texts:\s*(\[\s*\{.*?\}\s*\])\s*,\s*\n\s*grammarPoints:',
    re.DOTALL
)

extracted_texts = {}
for m in pattern.finditer(content):
    lnum = int(m.group(1))
    texts_block = m.group(2)
    extracted_texts[lnum] = texts_block
    # count how many text items
    t_count = len(re.findall(r'id:\s*[\x22\x27]hsk1-l\d+-t\d+[\x22\x27]', texts_block))
    print(f"Extracted L{lnum}: {t_count} texts, block length = {len(texts_block)}")

print(f"Total lessons with texts extracted: {len(extracted_texts)}")
