import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    c2 = f.read()

lessons = re.findall(r'lessonNumber:\s*(\d+),\s*titleHanzi:\s*"([^"]+)"', c2)
print(f"Total in newHsk2BookData.ts: {len(lessons)}")
for num, title in lessons:
    # find block for this lesson
    start_match = re.search(r'lessonNumber:\s*' + num + r',', c2)
    next_num = str(int(num) + 1)
    next_match = re.search(r'lessonNumber:\s*' + next_num + r',', c2)
    start_pos = start_match.start()
    end_pos = next_match.start() if next_match else len(c2)
    l_str = c2[start_pos:end_pos]
    
    texts = len(re.findall(r'id:\s*"hsk2-l\d+-t\d+"', l_str))
    grammar = len(re.findall(r'id:\s*"hsk2-l\d+-g\d+"', l_str))
    vocab = len(re.findall(r'id:\s*"hsk2-l\d+-w\d+"', l_str))
    print(f"Lesson {num.zfill(2)}: {title:35} | Texts: {texts} | Grammar: {grammar} | Vocab: {vocab}")
