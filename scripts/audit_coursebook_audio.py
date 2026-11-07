# -*- coding: utf-8 -*-
import os
import sys
import json
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def audit_audio():
    manifest_path = os.path.join("src", "data", "coursebookAudioManifest.json")
    if not os.path.exists(manifest_path):
        print(f"ERROR: {manifest_path} not found")
        return

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"Total entries in manifest: {len(manifest)}")

    hsk1_keys = [k for k in manifest.keys() if k.startswith("hsk1-")]
    print(f"HSK 1 entries in manifest: {len(hsk1_keys)}")

    # Check for all 15 lessons * 3 texts = 45 texts
    expected_hsk1_keys = [f"hsk1-l{l}-t{t}" for l in range(1, 16) for t in range(1, 4)]
    missing_from_manifest = [k for k in expected_hsk1_keys if k not in manifest]
    if missing_from_manifest:
        print(f"WARNING: Keys missing from manifest: {missing_from_manifest}")
    else:
        print("All 45 expected HSK 1 texts exist in manifest.")

    total_line_audios = 0
    missing_files = []
    duration_mismatches = []
    timing_issues = []

    for k in sorted(hsk1_keys):
        entry = manifest[k]
        full_url = entry.get("fullAudioUrl", "")
        total_duration = entry.get("totalDuration", 0)
        lines = entry.get("lines", [])
        line_timings = entry.get("lineTimings", [])

        # Check full audio file
        full_disk_path = os.path.join("public", full_url.lstrip("/"))
        if not os.path.exists(full_disk_path):
            missing_files.append((k, "full", full_disk_path))
        else:
            try:
                mp3 = mutagen.mp3.MP3(full_disk_path)
                disk_dur = round(float(mp3.info.length), 2)
                diff = abs(disk_dur - total_duration)
                if diff > 0.5:
                    duration_mismatches.append({
                        "key": k,
                        "type": "full",
                        "file": full_disk_path,
                        "manifest_dur": total_duration,
                        "disk_dur": disk_dur,
                        "diff": round(diff, 2)
                    })
            except Exception as e:
                missing_files.append((k, f"corrupt full ({e})", full_disk_path))

        # Check line audios
        total_line_audios += len(lines)
        for i, line in enumerate(lines):
            line_url = line.get("audioUrl", "")
            line_dur = line.get("duration", 0)
            line_disk_path = os.path.join("public", line_url.lstrip("/"))
            if not os.path.exists(line_disk_path):
                missing_files.append((k, f"line {i}", line_disk_path))
            else:
                try:
                    mp3 = mutagen.mp3.MP3(line_disk_path)
                    disk_dur = round(float(mp3.info.length), 2)
                    diff = abs(disk_dur - line_dur)
                    if diff > 0.5:
                        duration_mismatches.append({
                            "key": k,
                            "type": f"line {i}",
                            "file": line_disk_path,
                            "manifest_dur": line_dur,
                            "disk_dur": disk_dur,
                            "diff": round(diff, 2)
                        })
                except Exception as e:
                    missing_files.append((k, f"corrupt line {i} ({e})", line_disk_path))

        # Check timing invariants
        if len(line_timings) != len(lines):
            timing_issues.append(f"{k}: lineTimings count ({len(line_timings)}) != lines count ({len(lines)})")
        
        prev_end = 0.0
        for i, timing in enumerate(line_timings):
            start = timing.get("start", 0)
            end = timing.get("end", 0)
            dur = timing.get("duration", 0)
            if start >= end:
                timing_issues.append(f"{k} line {i}: start ({start}) >= end ({end})")
            if i > 0 and start < prev_end - 0.01:
                timing_issues.append(f"{k} line {i}: overlap start ({start}) < prev end ({prev_end})")
            prev_end = end
        
        if line_timings:
            last_end = line_timings[-1].get("end", 0)
            if last_end > total_duration + 0.1:
                timing_issues.append(f"{k}: last line end ({last_end}) > totalDuration ({total_duration})")

    print(f"\n--- AUDIT SUMMARY ---")
    print(f"Total HSK 1 texts checked: {len(hsk1_keys)}")
    print(f"Total line audios checked: {total_line_audios}")
    print(f"Missing audio files: {len(missing_files)}")
    for item in missing_files:
        print(f"  MISSING: {item}")

    print(f"Duration mismatches (>0.5s): {len(duration_mismatches)}")
    for item in duration_mismatches:
        print(f"  MISMATCH: {item['key']} {item['type']} -> manifest: {item['manifest_dur']}s, disk: {item['disk_dur']}s, diff: {item['diff']}s ({item['file']})")

    print(f"Timing issues: {len(timing_issues)}")
    for issue in timing_issues:
        print(f"  TIMING: {issue}")

if __name__ == "__main__":
    audit_audio()
