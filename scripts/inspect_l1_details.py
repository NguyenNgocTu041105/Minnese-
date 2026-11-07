# -*- coding: utf-8 -*-
import json
import os
import sys
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open("src/data/coursebookAudioManifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

for k in ["hsk1-l1-t2", "hsk1-l1-t3"]:
    print(f"\n==================== {k} ====================")
    entry = manifest[k]
    full_path = os.path.join("public", entry["fullAudioUrl"].lstrip("/"))
    disk_full_dur = mutagen.mp3.MP3(full_path).info.length if os.path.exists(full_path) else -1
    print(f"Manifest totalDuration: {entry.get('totalDuration')}s | Disk full duration: {disk_full_dur:.2f}s")
    print(f"Full audio path: {full_path}")
    print(f"Lines count: {len(entry.get('lines', []))}")
    for i, line in enumerate(entry.get("lines", [])):
        line_path = os.path.join("public", line["audioUrl"].lstrip("/"))
        line_disk_dur = mutagen.mp3.MP3(line_path).info.length if os.path.exists(line_path) else -1
        print(f"  Line {i}: [{line.get('speaker')}] {line.get('hanzi')} | manifest dur: {line.get('duration')}s | disk dur: {line_disk_dur:.2f}s | path: {line_path}")

    print("Line timings in manifest:")
    for timing in entry.get("lineTimings", []):
        print(f"  {timing}")
