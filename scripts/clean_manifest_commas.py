# -*- coding: utf-8 -*-
with open('src/data/coursebookAudioManifest.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('},,\n', '},\n')
text = text.replace('},\n,', '},\n')

with open('src/data/coursebookAudioManifest.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("Cleaned up commas!")
