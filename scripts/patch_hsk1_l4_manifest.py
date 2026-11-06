# -*- coding: utf-8 -*-
import json

def run():
    with open('scratch/hsk1_l4_manifest.json', 'r', encoding='utf-8') as f:
        l4_manifest = json.load(f)

    with open('src/data/coursebookAudioManifest.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    entries_str = []
    for k, v in l4_manifest.items():
        entry_json = json.dumps(v, ensure_ascii=False, indent=2)
        indented = '\n'.join('  ' + line if line else '' for line in entry_json.split('\n'))
        entries_str.append(f'  "{k}": {indented.strip()}')

    addition = ',\n' + ',\n'.join(entries_str) + '\n};\n'

    idx = content.rfind('};')
    if idx != -1:
        new_content = content[:idx].rstrip() + addition
        with open('src/data/coursebookAudioManifest.ts', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Merged Lesson 4 into coursebookAudioManifest.ts successfully!")
    else:
        print("Could not find closing };")

if __name__ == '__main__':
    run()
