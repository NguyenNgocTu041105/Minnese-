# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Search for word dictionary in hskVocabulary.ts or fullHskSyllabusVocab.ts
def scan_vocab(path):
    dict_map = {}
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches: hanzi: "...", pinyin: "...", hanViet: "...", vietnamese: "..."
    # or similar
    pattern = re.compile(
        r'hanzi:\s*[\'"]([^\'"]+)[\'"].*?'
        r'pinyin:\s*[\'"]([^\'"]+)[\'"].*?'
        r'(?:hanViet:\s*[\'"]([^\'"]+)[\'"].*?)?'
        r'(?:vietnamese:\s*[\'"]([^\'"]+)[\'"].*?)?'
        r'(?:radical:\s*[\'"]([^\'"]+)[\'"].*?)?'
        r'(?:strokeCount:\s*(\d+))?',
        re.DOTALL
    )
    for m in pattern.finditer(content):
        hz = m.group(1)
        py = m.group(2)
        hv = m.group(3) or ''
        vi = m.group(4) or ''
        rad = m.group(5) or ''
        strokes = int(m.group(6)) if m.group(6) else 0
        if hz not in dict_map or (hv and not dict_map[hz].get('hanViet')):
            dict_map[hz] = {
                'hanzi': hz,
                'pinyin': py,
                'hanViet': hv,
                'vietnamese': vi,
                'radical': rad,
                'strokeCount': strokes
            }
    return dict_map

d1 = scan_vocab('src/data/hskVocabulary.ts')
print(f"hskVocabulary loaded: {len(d1)} words")
d2 = scan_vocab('src/data/fullHskSyllabusVocab.ts')
print(f"fullHskSyllabusVocab loaded: {len(d2)} words")

# Also check newHsk2BookData.ts
d3 = scan_vocab('src/data/newHsk2BookData.ts')
print(f"newHsk2BookData loaded: {len(d3)} words")
