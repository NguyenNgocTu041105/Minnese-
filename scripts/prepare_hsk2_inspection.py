# -*- coding: utf-8 -*-
import json
import os
import re
import sys
from PIL import Image, ImageDraw, ImageFont

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def parse_all_hsk2_texts():
    with open("src/data/newHsk2BookData.ts", "r", encoding="utf-8") as f:
        content = f.read()

    # Match each text object in newHsk2BookData.ts
    text_blocks = re.findall(
        r'\{\s*id:\s*["\'](hsk2-l(\d+)-t(\d+))["\']\s*,\s*title:\s*["\']([^"\']+)["\']\s*,\s*context:\s*["\']([^"\']+)["\'](.*?)\n\s*\}',
        content,
        re.DOTALL
    )
    # Better parser: use manifest + newHsk2BookData.ts
    with open("src/data/coursebookAudioManifest.json", "r", encoding="utf-8") as mf:
        manifest = json.load(mf)

    texts = []
    for l in range(1, 16):
        for t in range(1, 5):
            tid = f"hsk2-l{l}-t{t}"
            entry = manifest.get(tid)
            if entry:
                texts.append({
                    "id": tid,
                    "lesson": l,
                    "textIndex": t,
                    "title": entry["title"],
                    "context": entry["context"],
                    "lines": [
                        {
                            "speaker": ln["speaker"].split("(")[0].strip(),
                            "rawSpeaker": ln["speaker"],
                            "hanzi": ln["hanzi"],
                            "pinyin": ln["pinyin"],
                            "vietnamese": ln["vietnamese"]
                        }
                        for ln in entry["lines"]
                    ]
                })
    return texts

def draw_grids():
    grid_dir = os.path.join("scratch", "hsk2_grids")
    os.makedirs(grid_dir, exist_ok=True)
    for l in range(1, 16):
        for t in range(1, 5):
            src = os.path.join("public", "textbook_art", f"hsk2_30_l{l}_t{t}.png")
            if not os.path.exists(src):
                continue
            im = Image.open(src).convert("RGB")
            w, h = im.size
            draw = ImageDraw.Draw(im)
            for pct in range(10, 100, 10):
                x = int(w * pct / 100)
                y = int(h * pct / 100)
                color = (255, 50, 50) if pct == 50 else (0, 220, 255)
                draw.line([(x, 0), (x, h)], fill=color, width=2 if pct == 50 else 1)
                draw.line([(0, y), (w, y)], fill=color, width=2 if pct == 50 else 1)
                draw.rectangle([x + 2, 2, x + 28, 18], fill=(0, 0, 0))
                draw.text((x + 4, 3), f"{pct}", fill=(255, 255, 0))
                draw.rectangle([2, y + 2, 28, y + 18], fill=(0, 0, 0))
                draw.text((4, y + 3), f"{pct}", fill=(255, 255, 0))
            out_path = os.path.join(grid_dir, f"hsk2-l{l}-t{t}_grid.jpg")
            im.save(out_path, "JPEG", quality=85)

if __name__ == "__main__":
    texts = parse_all_hsk2_texts()
    with open("scripts/parsed_hsk2_texts.json", "w", encoding="utf-8") as f:
        json.dump(texts, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(texts)} HSK 2 texts to scripts/parsed_hsk2_texts.json")

    speakers = {}
    for t in texts:
        spks = sorted(list({ln["speaker"] for ln in t["lines"]}))
        for ln in t["lines"]:
            speakers[ln["speaker"]] = speakers.get(ln["speaker"], 0) + 1
        print(f"{t['id']} ({len(t['lines'])} lines): speakers={spks} | {t['context'][:60]}")

    print("\nAll HSK 2 Unique Speakers:")
    for k, v in sorted(speakers.items(), key=lambda x: -x[1]):
        print(f"  - {k}: {v} lines")

    draw_grids()
    print("Generated 60 grid images in scratch/hsk2_grids/")
