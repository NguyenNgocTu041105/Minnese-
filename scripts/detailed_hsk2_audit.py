import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/newHsk2BookData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

lessons = re.split(r'lessonNumber:\s*(\d+),', content)
print("=== DETAILED HSK 2 LESSON AUDIT ===")
for i in range(1, len(lessons), 2):
    lnum = int(lessons[i])
    body = lessons[i+1]
    
    # Title
    tm = re.search(r'titleHanzi:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    title = tm.group(1) if tm else '?'
    
    # Texts
    texts = re.findall(r'id:\s*[\x22\x27]hsk2-l\d+-t\d+[\x22\x27]', body)
    
    # Grammar
    has_gp = 'grammarPoints:' in body
    gp_count = len(re.findall(r'title:\s*[\x22\x27]', body[body.find('grammarPoints:'):body.find('vocabulary:')])) if has_gp else 0
    gp_ids = len(re.findall(r'id:\s*[\x22\x27]hsk2-l\d+-g\d+[\x22\x27]', body))
    
    # Vocab
    has_vocab = 'vocabulary:' in body
    vocab_sec = body[body.find('vocabulary:'):body.find('exercises:')] if 'exercises:' in body else body[body.find('vocabulary:'):]
    vocab_items = len(re.findall(r'hanzi:\s*[\x22\x27]', vocab_sec))
    vocab_full = len(re.findall(r'strokeCount:', vocab_sec))
    
    # Exercises
    has_ex = 'exercises:' in body
    ex_sec = body[body.find('exercises:'):body.find('cultureBonus:')] if 'cultureBonus:' in body else body[body.find('exercises:'):]
    ex_items = len(re.findall(r'question:\s*[\x22\x27]', ex_sec))
    ex_ids = len(re.findall(r'id:\s*[\x22\x27]hsk2-l\d+-ex\d+[\x22\x27]', ex_sec))
    
    print(f"Lesson {lnum:2d}: {title:<25} | Texts: {len(texts)} | GP: {gp_count} (ids: {gp_ids}) | Vocab: {vocab_items} (full: {vocab_full}) | Ex: {ex_items} (ids: {ex_ids})")
