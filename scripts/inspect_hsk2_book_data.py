# -*- coding: utf-8 -*-
import sys, re
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open('src/data/newHsk2BookData.ts', encoding='utf-8') as f:
    text = f.read()

lessons = re.findall(r'lessonNumber:\s*(\d+).*?titleHanzi:\s*"([^"]+)"', text, re.DOTALL)
print(f"Total lessons in newHsk2BookData.ts: {len(lessons)}")
for num, title in lessons:
    # count texts
    parts = text.split(f"lessonNumber: {num}")
    if len(parts) > 1:
        sub = parts[1]
        next_num = int(num) + 1
        if f"lessonNumber: {next_num}" in sub:
            sub = sub.split(f"lessonNumber: {next_num}")[0]
        texts = re.findall(r'id:\s*"(hsk2-l\d+-t\d+)"', sub)
        titles = re.findall(r'title:\s*"([^"]+)"', sub)
        print(f"\n--- LESSON {num}: {title} ({len(texts)} bài khóa) ---")
        for tid, ttitle in zip(texts, titles):
            print(f"  * {tid}: {ttitle}")
