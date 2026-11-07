import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

for fn in ['src/data/newHsk1BookData.ts', 'src/data/newHsk2BookData.ts']:
    print('=== ' + fn + ' ===')
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    
    matches = re.findall(r'lessonNumber:\s*(\d+).*?titleHanzi:\s*[\'"]([^\'"]+)[\'"].*?titlePinyin:\s*[\'"]([^\'"]+)[\'"].*?titleVietnamese:\s*[\'"]([^\'"]+)[\'"]', content, re.DOTALL)
    for m in matches:
        print(f"Lesson {m[0]}: {m[1]} ({m[2]}) - {m[3]}")
