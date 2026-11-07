# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Filter only words inside vocabulary: [ ... ]
vocab_blocks = re.findall(r'vocabulary:\s*\[(.*?)\]\s*,\s*\n\s*exercises', c, re.DOTALL)
all_words = []
for vb in vocab_blocks:
    hzs = re.findall(r'\"hanzi\":\s*\"([^\"]+)\"', vb)
    all_words.extend(hzs)

unique_words = set(all_words)
print("Total occurrences:", len(all_words))
print("Unique words count in newHsk1BookData.ts:", len(unique_words))

# Now let's check fullHskSyllabusVocab.ts or vocabStorage.ts
with open('src/data/fullHskSyllabusVocab.ts', 'r', encoding='utf-8') as f:
    syl = f.read()

hsk1_in_syl = re.findall(r'\"hskLevel\":\s*1\b', syl)
print("HSK 1 words in fullHskSyllabusVocab.ts (if json):", len(hsk1_in_syl))

# Check raw count in fullHskSyllabusVocab
hsk1_pattern = re.findall(r'hskLevel:\s*1\b', syl)
print("HSK 1 occurrences in fullHskSyllabusVocab.ts:", len(hsk1_pattern))
