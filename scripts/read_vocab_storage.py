# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/utils/vocabStorage.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines[40:120], 41):
    print(f"{i}: {l}", end='')
