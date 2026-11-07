import re, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(
    r'id:\s*[\'"]hsk1-l(\d+)-t(\d+)[\'"].*?title:\s*[\'"]([^\'"]+)[\'"].*?context:\s*[\'"]([^\'"]+)[\'"]',
    re.DOTALL
)

for m in pattern.finditer(text):
    l, t, title, ctx = m.group(1), m.group(2), m.group(3), m.group(4)
    print(f"HSK 1 L{l} T{t}: {title} | {ctx}")
