import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open("scripts/parsed_hsk1_texts.json", "r", encoding="utf-8") as f:
    hsk1 = json.load(f)

hsk1_speakers = set()
for t in hsk1:
    for l in t["lines"]:
        hsk1_speakers.add(l["speaker"])

print("HSK 1 Speakers:")
for s in sorted(hsk1_speakers):
    print(" ", s)

with open("src/data/coursebookAudioManifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

all_speakers = set()
for tid, t in manifest.items():
    for l in t.get("lines", []):
        all_speakers.add(l.get("speaker", ""))

print("\nAll Speakers in Manifest:")
for s in sorted(all_speakers):
    print(" ", s)
