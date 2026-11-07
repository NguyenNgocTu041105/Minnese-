import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open("src/data/coursebookAudioManifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

dialect_count = 0
total_lines = 0
by_voice = {}

for tid, text_entry in manifest.items():
    for line in text_entry.get("lines", []):
        total_lines += 1
        voice = line.get("voice", "")
        by_voice[voice] = by_voice.get(voice, 0) + 1
        if "shaanxi" in voice or "liaoning" in voice:
            dialect_count += 1
            # print first 5 examples
            if dialect_count <= 10:
                print(f"Dialect in {tid} Line {line.get('lineIndex')}: {line.get('speaker')} ({voice}) -> {line.get('hanzi')}")

print(f"\nTotal lines: {total_lines}")
print(f"Dialect lines: {dialect_count}")
print("Voice distribution:")
for v, c in by_voice.items():
    print(f"  {v}: {c} lines")
