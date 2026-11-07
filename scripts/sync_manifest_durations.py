import json
import os
import mutagen.mp3

manifest_path = "src/data/coursebookAudioManifest.json"
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for tid, entry in manifest.items():
    if not tid.startswith("hsk1-"):
        continue

    full_url = entry.get("fullAudioUrl", "")
    full_path = os.path.join("public", full_url.lstrip("/"))
    if os.path.exists(full_path):
        mp3 = mutagen.mp3.MP3(full_path)
        entry["totalDuration"] = round(float(mp3.info.length), 2)

    curr_time = 0.0
    lines = entry.get("lines", [])
    timings = []
    for i, line in enumerate(lines):
        line_url = line.get("audioUrl", "")
        line_path = os.path.join("public", line_url.lstrip("/"))
        if os.path.exists(line_path):
            l_mp3 = mutagen.mp3.MP3(line_path)
            dur = round(float(l_mp3.info.length), 2)
            line["duration"] = dur
        else:
            dur = line.get("duration", 2.0)

        timings.append({
            "lineIndex": i,
            "start": round(curr_time, 2),
            "end": round(curr_time + dur, 2),
            "duration": dur
        })
        curr_time += dur + 0.40

    entry["lineTimings"] = timings

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Synchronized all HSK 1 manifest durations with disk files!")
