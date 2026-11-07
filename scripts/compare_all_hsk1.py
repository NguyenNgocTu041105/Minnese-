# -*- coding: utf-8 -*-
import json
import os
import sys
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open("src/data/coursebookAudioManifest.json", "r", encoding="utf-8") as f:
    m = json.load(f)

print(f"{'Key':12} | {'Manifest':8} | {'Disk':8} | {'Diff':8} | {'Lines':6}")
print("-" * 50)
for l in range(1, 16):
    for t in range(1, 4):
        k = f"hsk1-l{l}-t{t}"
        entry = m[k]
        fp = os.path.join("public", entry["fullAudioUrl"].lstrip("/"))
        disk_dur = mutagen.mp3.MP3(fp).info.length
        man_dur = entry["totalDuration"]
        diff = disk_dur - man_dur
        num_lines = len(entry.get("lines", []))
        flag = " *** MISMATCH ***" if abs(diff) > 0.5 else ""
        print(f"{k:12} | {man_dur:6.2f}s  | {disk_dur:6.2f}s  | {diff:+6.2f}s  | {num_lines:2d} lines{flag}")
