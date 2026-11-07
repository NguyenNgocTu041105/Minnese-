import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    c = f.read()

for lnum in [5, 6, 7, 12]:
    m = re.search(r'lessonNumber:\s*' + str(lnum) + r',.*?(?=lessonNumber|\Z)', c, re.DOTALL)
    if m:
        block = m.group(0)
        v_m = re.search(r'vocabulary:\s*\[(.*?)\]\s*,', block, re.DOTALL)
        if v_m:
            words = re.findall(r'hanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', v_m.group(1))
            print(f"Lesson {lnum} words ({len(words)}): {', '.join(words)}")
