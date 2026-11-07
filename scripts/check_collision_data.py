import re
import json

with open('tests/hsk1_bubble_collision_data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

meta_keys = re.findall(r"HSK1_SCENE_METADATA\['(hsk1-l\d+-t\d+)'\]", content)
box_keys = re.findall(r"HSK1_CHARACTER_BOUNDING_BOXES\['(hsk1-l\d+-t\d+)'\]", content)

print(f"Meta keys: {len(meta_keys)}, Box keys: {len(box_keys)}")
