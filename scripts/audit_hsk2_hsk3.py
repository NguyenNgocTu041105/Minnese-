# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

def audit_file(fn, expected_lessons=15):
    print(f"==================================================")
    print(f"AUDITING: {fn}")
    print(f"==================================================")
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract lessons
    lesson_blocks = re.findall(r'lessonNumber:\s*(\d+).*?titleHanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27].*?titlePinyin:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27].*?titleVietnamese:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', content, re.DOTALL)
    print(f"Found {len(lesson_blocks)} lessons.")
    
    # Check sample lines in texts for each lesson
    lessons = re.split(r'lessonNumber:\s*(\d+),', content)
    for i in range(1, len(lessons), 2):
        lnum = int(lessons[i])
        body = lessons[i+1]
        
        # title
        tm = re.search(r'titleHanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
        title = tm.group(1) if tm else '?'
        
        # texts count
        texts_m = re.findall(r'id:\s*[\x22\x27]hsk\d+-l\d+-t\d+[\x22\x27]', body)
        
        # first line in text 1
        line1_m = re.search(r'speaker:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27].*?hanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body, re.DOTALL)
        sample = f"{line1_m.group(1)}: {line1_m.group(2)}" if line1_m else "No text"
        
        # grammar count
        gps = re.findall(r'id:\s*[\x22\x27]hsk\d+-l\d+-g\d+[\x22\x27]', body)
        
        # vocab count
        vsec = re.search(r'vocabulary:\s*\[(.*?)\]\s*,\s*\n\s*exercises', body, re.DOTALL)
        vwords = re.findall(r'hanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', vsec.group(1)) if vsec else []
        
        print(f"L{lnum:2d}: {title:<20s} | Texts: {len(texts_m)} | Grammar: {len(gps)} | Vocab: {len(vwords):2d} | Sample: {sample[:40]}")

audit_file('src/data/newHsk2BookData.ts')
audit_file('src/data/newHsk3BookData.ts')
