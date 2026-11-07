# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/fullHskSyllabusVocab.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '314' in line:
        print(f"fullHskSyllabusVocab.ts line {i+1}: {line.strip()[:100]}")
