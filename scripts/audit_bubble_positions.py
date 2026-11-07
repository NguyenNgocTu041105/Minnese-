import json
import re
from PIL import Image

# Read newHsk1BookData.ts
with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    book_content = f.read()

# Extract texts
text_blocks = re.findall(r'id:\s*"(hsk1-l\d+-t\d+)",.*?lines:\s*\[(.*?)\]\s*\}', book_content, re.DOTALL)
print(f'Total texts in newHsk1BookData: {len(text_blocks)}')

for tid, lines_str in text_blocks:
    speakers = re.findall(r'speaker:\s*"([^"]+)"', lines_str)
    # clean speaker name
    clean_speakers = list(dict.fromkeys([s.split('(')[0].strip() for s in speakers]))
    
    # image path
    img_num = tid.replace('hsk1-', '').replace('-', '_')
    img_path = f'public/textbook_art/hsk1_30_{img_num}.png'
    try:
        im = Image.open(img_path)
        size = im.size
    except Exception as e:
        size = str(e)
    print(f'{tid}: {size} | speakers: {clean_speakers}')
