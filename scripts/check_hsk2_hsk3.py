import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    c2 = f.read()

with open('src/data/newHsk3BookData.ts', 'r', encoding='utf-8') as f:
    c3 = f.read()

print('=== HSK 2 STATS ===')
lessons2 = re.findall(r'id:\s*(\d+),\s*title:\s*[\'"]([^\'"]+)[\'"]', c2)
print(f'Total Lessons: {len(lessons2)}')
for lid, title in lessons2:
    # count texts, grammar, vocab
    block = c2[c2.find(f'id: {lid},'):]
    next_lid = int(lid) + 1
    next_idx = c2.find(f'id: {next_lid},') if next_lid <= len(lessons2) else len(c2)
    l_str = block[:next_idx - c2.find(f'id: {lid},')] if next_idx != -1 else block
    texts = len(re.findall(r'title:\s*[\'"]Bài khóa', l_str))
    grammar = len(re.findall(r'point:\s*[\'"]', l_str))
    vocab = len(re.findall(r'word:\s*[\'"]', l_str))
    print(f'  L{lid.zfill(2)}: {title:30} | Texts: {texts} | Grammar: {grammar} | Vocab: {vocab}')

print('\n=== HSK 3 STATS ===')
lessons3 = re.findall(r'id:\s*(\d+),\s*title:\s*[\'"]([^\'"]+)[\'"]', c3)
print(f'Total Lessons: {len(lessons3)}')
for lid, title in lessons3:
    block = c3[c3.find(f'id: {lid},'):]
    next_lid = int(lid) + 1
    next_idx = c3.find(f'id: {next_lid},') if next_lid <= len(lessons3) else len(c3)
    l_str = block[:next_idx - c3.find(f'id: {lid},')] if next_idx != -1 else block
    texts = len(re.findall(r'title:\s*[\'"]Bài khóa', l_str))
    grammar = len(re.findall(r'point:\s*[\'"]', l_str))
    vocab = len(re.findall(r'word:\s*[\'"]', l_str))
    print(f'  L{lid.zfill(2)}: {title:30} | Texts: {texts} | Grammar: {grammar} | Vocab: {vocab}')
