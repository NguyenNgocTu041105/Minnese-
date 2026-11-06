# -*- coding: utf-8 -*-
import json

def patch_manifest():
    with open('scripts/generated_hsk2_manifest.json', 'r', encoding='utf-8') as jf:
        hsk2_data = json.load(jf)

    with open('src/data/coursebookAudioManifest.ts', 'r', encoding='utf-8') as mf:
        content = mf.read()

    marker = "export const COURSEBOOK_AUDIO_MANIFEST: Record<string, CoursebookTextAudio> = {"
    pos = content.find(marker)
    if pos == -1:
        print("Manifest marker not found!")
        return

    ts_entries = []
    for tid, item in hsk2_data.items():
        ts_entry = f'  "{tid}": {json.dumps(item, ensure_ascii=False, indent=4)}'
        indented = "\n".join("  " + line if i > 0 else line for i, line in enumerate(ts_entry.split("\n")))
        ts_entries.append(indented)

    new_hsk2_ts = ",\n" + ",\n".join(ts_entries)

    idx_hsk2 = content.find('"hsk2-l1-t1":')
    if idx_hsk2 == -1:
        idx_hsk2 = content.find("'hsk2-l1-t1':")

    if idx_hsk2 != -1:
        start_cut = content.rfind('\n', 0, idx_hsk2)
        end_cut = content.rfind('};')
        new_content = content[:start_cut] + new_hsk2_ts + "\n" + content[end_cut:]
    else:
        end_cut = content.rfind('};')
        new_content = content[:end_cut].rstrip() + new_hsk2_ts + "\n" + content[end_cut:]

    with open('src/data/coursebookAudioManifest.ts', 'w', encoding='utf-8') as mf:
        mf.write(new_content)

    print(f"Successfully patched src/data/coursebookAudioManifest.ts with {len(hsk2_data)} HSK 2 audio entries!")

if __name__ == '__main__':
    patch_manifest()
