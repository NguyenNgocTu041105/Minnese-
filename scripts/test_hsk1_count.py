# -*- coding: utf-8 -*-
import json, re

with open('src/data/fullHskSyllabusVocab.json', 'r', encoding='utf-8') as f:
    syllabus = json.load(f)

hsk1_syllabus = [w for w in syllabus if w.get('hskLevel') == 1]
print("HSK 1 words in FULL_HSK_SYLLABUS_VOCAB:", len(hsk1_syllabus))

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    c = f.read()

vsec = re.findall(r'vocabulary:\s*\[(.*?)\]\s*,\s*\n\s*exercises', c, re.DOTALL)
book_words = set()
for vb in vsec:
    hzs = re.findall(r'\"hanzi\":\s*\"([^\"]+)\"', vb)
    book_words.update(hzs)

print("Unique words in newHsk1BookData:", len(book_words))

# Now let's simulate the merge in getUnifiedVocabularyList:
syl_map = {w['hanzi']: w for w in syllabus}
for bw in book_words:
    if bw in syl_map:
        pass
    else:
        # Extra word not in syllabus:
        syl_map[bw] = {'hanzi': bw, 'hskLevel': 1}

hsk1_after_merge = [w for w in syl_map.values() if w.get('hskLevel') == 1]
print("Total HSK 1 words in getUnifiedVocabularyList():", len(hsk1_after_merge))
