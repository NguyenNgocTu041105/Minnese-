# -*- coding: utf-8 -*-
"""
Robustly extract all lesson texts from src/data/newHsk1BookData.ts and save to scripts/parsed_hsk1_texts.json.
Handles optional fields like avatar.
"""
import re, json

SOURCE = r"d:\minnese\src\data\newHsk1BookData.ts"
OUTPUT = r"d:\minnese\scripts\parsed_hsk1_texts.json"

def main():
    with open(SOURCE, "r", encoding="utf-8") as f:
        content = f.read()

    lesson_splits = re.split(r'lessonNumber:\s*(\d+)', content)
    parsed_texts = []

    for i in range(1, len(lesson_splits), 2):
        lesson_num = int(lesson_splits[i])
        lesson_body = lesson_splits[i+1]

        text_id_matches = list(re.finditer(r'id:\s*"(hsk1-l\d+-t\d+)"', lesson_body))
        
        for idx, tm in enumerate(text_id_matches):
            text_id = tm.group(1)
            start_pos = tm.start()
            if idx + 1 < len(text_id_matches):
                end_pos = text_id_matches[idx+1].start()
            else:
                gp = lesson_body.find('grammarPoints:', start_pos)
                end_pos = gp if gp > 0 else len(lesson_body)

            chunk = lesson_body[start_pos:end_pos]
            
            title_m = re.search(r'title:\s*"([^"]+)"', chunk)
            title = title_m.group(1) if title_m else ""

            ctx_m = re.search(r'context:\s*"([^"]*)"', chunk)
            context = ctx_m.group(1) if ctx_m else ""

            lines = []
            lines_m = re.search(r'lines:\s*\[(.*?)\]\s*(?:,|\})', chunk, re.DOTALL)
            if lines_m:
                lines_str = lines_m.group(1)
                for line_obj in re.finditer(r'\{\s*(.*?)\s*\}', lines_str, re.DOTALL):
                    props = line_obj.group(1)
                    spk_m = re.search(r'speaker:\s*"([^"]+)"', props)
                    han_m = re.search(r'hanzi:\s*"([^"]+)"', props)
                    pin_m = re.search(r'pinyin:\s*"([^"]+)"', props)
                    vie_m = re.search(r'vietnamese:\s*"([^"]+)"', props)
                    ava_m = re.search(r'avatar:\s*"([^"]+)"', props)

                    if spk_m and han_m:
                        line_data = {
                            "speaker": spk_m.group(1),
                            "hanzi": han_m.group(1),
                            "pinyin": pin_m.group(1) if pin_m else "",
                            "vietnamese": vie_m.group(1) if vie_m else ""
                        }
                        if ava_m:
                            line_data["avatar"] = ava_m.group(1)
                        lines.append(line_data)

            t_idx_m = re.search(r'-t(\d+)', text_id)
            t_idx = int(t_idx_m.group(1)) if t_idx_m else (idx + 1)

            parsed_texts.append({
                "id": text_id,
                "lesson": lesson_num,
                "textIndex": t_idx,
                "title": title,
                "context": context,
                "lines": lines
            })

    print(f"Extracted {len(parsed_texts)} texts across all lessons.")
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(parsed_texts, f, ensure_ascii=False, indent=2)
    print("Done!")

if __name__ == "__main__":
    main()
