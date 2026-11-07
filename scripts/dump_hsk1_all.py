import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

lessons = content.split('lessonNumber:')
for l in lessons[1:]:
    num = l.split(',')[0].strip()
    th = re.search(r'titleHanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', l)
    th_val = th.group(1) if th else '?'
    gps = re.findall(r'title:\s*[\x22\x27](\d+\.[^\x22\x27]+)[\x22\x27]', l)
    words = re.findall(r'hanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', l)
    # filter words inside vocabulary section
    vocab_sec = re.search(r'vocabulary:\s*\[(.*?)\]\s*,\s*\n\s*exercises', l, re.DOTALL)
    vocab_words = []
    if vocab_sec:
        vocab_words = re.findall(r'hanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', vocab_sec.group(1))
    
    print(f"=== Lesson {num}: {th_val} ===")
    print(f"   Grammar: {gps}")
    print(f"   Vocab ({len(vocab_words)} words): {', '.join(vocab_words[:8])}...")
