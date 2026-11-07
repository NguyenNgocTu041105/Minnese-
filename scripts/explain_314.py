# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/fullHskSyllabusVocab.json', 'r', encoding='utf-8') as f:
    syllabus = json.load(f)

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    c = f.read()

vsec = re.findall(r'vocabulary:\s*\[(.*?)\]\s*,\s*\n\s*exercises', c, re.DOTALL)
book_words = set()
for vb in vsec:
    hzs = re.findall(r'\"hanzi\":\s*\"([^\"]+)\"', vb)
    book_words.update(hzs)

syl_map = {w['hanzi']: w for w in syllabus}

# Which words from book_words have hskLevel != 1 in syllabus?
higher_level_words = []
for bw in book_words:
    if bw in syl_map and syl_map[bw].get('hskLevel') != 1:
        higher_level_words.append((bw, syl_map[bw].get('hskLevel')))

print("Words in book that exist in syllabus at a higher level:", higher_level_words)

# Which words in book are not in syllabus at all?
not_in_syl = [bw for bw in book_words if bw not in syl_map]
print("Words in book not in standard syllabus:", not_in_syl)
