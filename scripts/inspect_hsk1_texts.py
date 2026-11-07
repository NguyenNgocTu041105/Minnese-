import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's inspect each lesson's titleHanzi and text titles / first lines
lessons = content.split('lessonNumber:')
for l in lessons[1:]:
    num = l.split(',')[0].strip()
    title_hanzi = re.search(r'titleHanzi:\s*[\'"]([^\'"]+)[\'"]', l)
    th = title_hanzi.group(1) if title_hanzi else '?'
    print(f"=== Lesson {num}: {th} ===")
    text_matches = re.findall(r'title:\s*[\'"](课文\s*\d+:[^\'"]+)[\'"]', l)
    for tm in text_matches:
        print(f"  {tm}")
    lines = re.findall(r'hanzi:\s*[\'"]([^\'"]+)[\'"]', l)
    if lines:
        print(f"  Sample line: {lines[0]}")
