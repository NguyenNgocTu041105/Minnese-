# -*- coding: utf-8 -*-
import json
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def get_hsk2_texts_l1_to_l5():
    with open('d:/minnese/src/data/newHsk2BookData.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    texts = []
    
    text_pattern = re.compile(
        r'\{\s*id:\s*["\'](hsk2-l(\d+)-t(\d+))["\'],\s*title:\s*["\']([^"\']+)["\'],\s*context:\s*["\']([^"\']+)["\'],\s*lines:\s*\[(.*?)\]\s*\}',
        re.DOTALL
    )

    line_pattern = re.compile(
        r'\{\s*speaker:\s*"([^"]+)",\s*hanzi:\s*"([^"]+)",\s*pinyin:\s*"([^"]+)",\s*vietnamese:\s*"([^"]+)"\s*\}',
        re.DOTALL
    )

    for match in text_pattern.finditer(content):
        tid, lesson, text_idx, title, context, lines_str = match.groups()
        lesson_num = int(lesson)
        if lesson_num > 15:
            continue
        
        lines = []
        for lmatch in line_pattern.finditer(lines_str):
            speaker, hanzi, pinyin, vietnamese = lmatch.groups()
            lines.append({
                "speaker": speaker,
                "hanzi": hanzi,
                "pinyin": pinyin,
                "vietnamese": vietnamese
            })

        texts.append({
            "id": tid,
            "lesson": lesson_num,
            "textIndex": int(text_idx),
            "title": title,
            "context": context,
            "lines": lines
        })

    return texts

if __name__ == '__main__':
    texts = get_hsk2_texts_l1_to_l5()
    print(f"Extracted {len(texts)} texts from HSK 2")
    for t in texts:
        print(f" - {t['id']}: {t['title']} ({len(t['lines'])} lines)")
