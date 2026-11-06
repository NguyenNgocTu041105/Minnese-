import sys
import re
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open('src/data/newHsk1BookData.ts', encoding='utf-8') as f:
    content = f.read()

# Match text blocks
text_blocks = re.findall(
    r'id:\s*["\'](hsk1-l(\d+)-t(\d+))["\'],\s*title:\s*["\']([^"\']+)["\'],\s*context:\s*["\']([^"\']+)["\'],\s*lines:\s*\[(.*?)\]\s*\}',
    content,
    re.DOTALL
)

print(f"Found {len(text_blocks)} text blocks")
results = []
for block_id, lesson_num, text_num, title, context, lines_str in text_blocks:
    lines = []
    line_matches = re.findall(
        r'speaker:\s*["\']([^"\']+)["\'],\s*hanzi:\s*["\']([^"\']+)["\'],\s*pinyin:\s*["\']([^"\']+)["\'],\s*vietnamese:\s*["\']([^"\']+)["\']',
        lines_str
    )
    for spk, hz, py, vi in line_matches:
        lines.append({
            "speaker": spk,
            "hanzi": hz,
            "pinyin": py,
            "vietnamese": vi
        })
    results.append({
        "id": block_id,
        "lesson": int(lesson_num),
        "textIndex": int(text_num),
        "title": title,
        "context": context,
        "lines": lines
    })

print(f"Parsed {len(results)} lesson texts:")
for r in results[:6]:
    print(f"Lesson {r['lesson']} Text {r['textIndex']}: {r['title']} ({len(r['lines'])} lines)")
    for l in r['lines']:
        print(f"  {l['speaker']}: {l['hanzi']}")

with open('scripts/parsed_hsk1_texts.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("Saved to scripts/parsed_hsk1_texts.json")
