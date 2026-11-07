import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

lessons = text.split('lessonNumber:')
for l in lessons[1:]:
    num = l.split(',')[0].strip()
    title_m = re.search(r'titleHanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', l)
    title = title_m.group(1) if title_m else '?'
    
    # texts
    texts_m = re.findall(r'id:\s*[\x22\x27](hsk1-l\d+-t\d+)[\x22\x27].*?title:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', l)
    
    # check first line of text 1
    first_line_m = re.search(r'lines:\s*\[\s*\{\s*speaker:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27].*?hanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', l)
    first_line = f"{first_line_m.group(1)}: {first_line_m.group(2)}" if first_line_m else 'No line'
    
    print(f"Lesson {num}: Title='{title}' | Texts={len(texts_m)} | Sample: {first_line}")
