import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk3BookData.ts', 'r', encoding='utf-8') as f:
    c3 = f.read()

lessons = re.findall(r'lessonNumber:\s*(\d+),\s*titleHanzi:\s*"([^"]+)"', c3)
print(f"Total in newHsk3BookData.ts: {len(lessons)}")
for num, title in lessons:
    print(f"Lesson {num}: {title}")
