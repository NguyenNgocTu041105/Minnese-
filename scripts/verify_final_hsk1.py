# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    c = f.read()

lessons = re.split(r'// =+\s*\n\s*// LESSON (\d+):', c)

total_vocab = 0
for i in range(1, len(lessons), 2):
    lnum = int(lessons[i])
    body = lessons[i+1]
    
    # title
    tm = re.search(r'titleHanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    title = tm.group(1) if tm else '?'
    
    # objectives
    obj_m = re.findall(r'objectives:\s*\[(.*?)\]', body, re.DOTALL)
    obj_count = len(re.findall(r'[\x22\x27]([^\x22\x27]+)[\x22\x27]', obj_m[0])) if obj_m else 0
    
    # texts
    texts_m = re.findall(r'id:\s*[\x22\x27](hsk1-l\d+-t\d+)[\x22\x27]', body)
    
    # grammar
    gps = re.findall(r'title:\s*[\x22\x27](\d+\.[^\x22\x27]+)[\x22\x27]', body)
    
    # vocab
    vsec = re.search(r'vocabulary:\s*\[(.*?)\]\s*,\s*\n\s*exercises', body, re.DOTALL)
    vwords = []
    if vsec:
        vwords = re.findall(r'\"hanzi\":\s*\"([^\"]+)\"', vsec.group(1))
    total_vocab += len(vwords)
    
    # exercises
    exsec = re.search(r'exercises:\s*\[(.*?)\](?:\s*,\s*\n\s*cultureBonus|\s*\}\s*,|\s*\}\s*\])', body, re.DOTALL)
    exs = []
    if exsec:
        exs = re.findall(r'id:\s*[\x22\x27](hsk1-l\d+-ex\d+)[\x22\x27]', exsec.group(1))
    
    print(f"L{lnum:2d}: {title:<18s} | Obj: {obj_count} | Texts: {len(texts_m)} | Grammar: {len(gps)} | Vocab: {len(vwords):2d} | Ex: {len(exs)}")

print(f"\nTotal vocabulary entries across all 15 lessons: {total_vocab}")
