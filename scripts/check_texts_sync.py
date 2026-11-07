import json
import re

with open("scripts/parsed_hsk1_texts.json", "r", encoding="utf-8") as f:
    parsed = json.load(f)

# Parse from src/data/newHsk1BookData.ts
with open("src/data/newHsk1BookData.ts", "r", encoding="utf-8") as f:
    ts_content = f.read()

# Let's check if the texts in parsed_hsk1_texts.json match what's in newHsk1BookData.ts
print(f"Parsed has {len(parsed)} texts.")

for item in parsed:
    tid = item["id"]
    # search for tid in ts_content
    if f'id: "{tid}"' not in ts_content and f'id: \'{tid}\'' not in ts_content:
        print(f"Warning: {tid} not found in newHsk1BookData.ts")

print("Check completed.")
