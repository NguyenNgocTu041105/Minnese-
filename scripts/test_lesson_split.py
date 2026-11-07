# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's verify we can extract texts and exercises for each lesson
# Lesson blocks are separated by comments or lessonNumber
lesson_chunks = re.split(r'\{\s*lessonNumber:\s*(\d+),', content)
print(f"Header length: {len(lesson_chunks[0])}")
print(f"Number of chunks: {len(lesson_chunks)}")

for i in range(1, len(lesson_chunks), 2):
    lnum = int(lesson_chunks[i])
    body = lesson_chunks[i+1]
    
    # check texts
    texts_m = re.search(r'texts:\s*(\[.*?\])\s*,\s*\n\s*grammarPoints:', body, re.DOTALL)
    ex_m = re.search(r'exercises:\s*(\[.*?\])(?:\s*,\s*\n\s*tongueTwister|\s*,\s*\n\s*cultureBonus|\s*\}\s*,|\s*\}\s*\])', body, re.DOTALL)
    tt_m = re.search(r'tongueTwister:\s*(\{.*?\})\s*,\s*\n\s*cultureBonus', body, re.DOTALL)
    cb_m = re.search(r'cultureBonus:\s*(\{.*?\})\s*\}\s*(?:,|\s*\])', body, re.DOTALL)
    
    print(f"Lesson {lnum:2d}: texts={bool(texts_m)}, exercises={bool(ex_m)}, tt={bool(tt_m)}, cb={bool(cb_m)}")
