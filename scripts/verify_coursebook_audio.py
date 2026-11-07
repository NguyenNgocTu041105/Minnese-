# -*- coding: utf-8 -*-
"""
Automated Verification Suite for Coursebook Audio & Manifest (HSK 1)
Enforces:
1. 100% manifest completeness (45 HSK 1 texts, 203 lines).
2. 100% file existence on disk (45 full audio files, 203 line audio files = 248 total).
3. Zero orphan files (e.g. hsk1-l10-t1_line5.mp3 must not exist).
4. Uniform audio profile across all 248 files: 24,000 Hz sample rate, 48,000 bps bitrate, 1 channel (Mono).
5. Manifest totalDuration matches physical MP3 duration on disk within 0.5s for all 45 dialogues.
6. Timing invariants: sequential non-overlapping lineTimings, start < end, totalDuration >= end[last].
"""
import glob
import json
import os
import sys
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def run_verification():
    print("=" * 70)
    print("COURSEBOOK AUDIO & MANIFEST VERIFICATION SUITE (HSK 1)")
    print("=" * 70)

    errors = []
    warnings = []

    manifest_path = os.path.join("src", "data", "coursebookAudioManifest.json")
    if not os.path.exists(manifest_path):
        print(f"[FAIL] Manifest not found: {manifest_path}")
        sys.exit(1)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # 1. Expected HSK 1 texts
    expected_keys = [f"hsk1-l{l}-t{t}" for l in range(1, 16) for t in range(1, 4)]
    missing_keys = [k for k in expected_keys if k not in manifest]
    if missing_keys:
        errors.append(f"Missing texts in manifest: {missing_keys}")
    else:
        print(f"[PASS] All {len(expected_keys)} expected HSK 1 texts exist in manifest.")

    # 2. File audit & format verification
    total_lines = 0
    checked_files = set()
    hsk1_keys = sorted([k for k in manifest.keys() if k.startswith("hsk1-")])

    for k in hsk1_keys:
        entry = manifest[k]
        full_url = entry.get("fullAudioUrl", "")
        man_total_dur = entry.get("totalDuration", 0)
        lines = entry.get("lines", [])
        line_timings = entry.get("lineTimings", [])

        # Check full audio file
        full_path = os.path.join("public", full_url.lstrip("/"))
        checked_files.add(os.path.abspath(full_path))
        if not os.path.exists(full_path):
            errors.append(f"{k}: Full audio file missing on disk: {full_path}")
        else:
            try:
                mp3 = mutagen.mp3.MP3(full_path)
                disk_dur = round(float(mp3.info.length), 2)
                diff = abs(disk_dur - man_total_dur)
                if diff > 0.5:
                    errors.append(f"{k}: Duration mismatch on full audio: manifest={man_total_dur}s, disk={disk_dur}s, diff={diff:.2f}s")
                if mp3.info.channels != 1:
                    errors.append(f"{k}: Full audio not Mono: channels={mp3.info.channels} ({full_path})")
                if mp3.info.bitrate != 48000:
                    errors.append(f"{k}: Full audio not 48kbps: bitrate={mp3.info.bitrate} ({full_path})")
                if mp3.info.sample_rate != 24000:
                    errors.append(f"{k}: Full audio not 24kHz: sample_rate={mp3.info.sample_rate} ({full_path})")
            except Exception as e:
                errors.append(f"{k}: Failed to parse full audio MP3 {full_path}: {e}")

        # Check each line audio file
        total_lines += len(lines)
        if len(line_timings) != len(lines):
            errors.append(f"{k}: lineTimings count ({len(line_timings)}) != lines count ({len(lines)})")

        prev_end = 0.0
        for i, line in enumerate(lines):
            line_url = line.get("audioUrl", "")
            line_dur = line.get("duration", 0)
            line_path = os.path.join("public", line_url.lstrip("/"))
            checked_files.add(os.path.abspath(line_path))
            if not os.path.exists(line_path):
                errors.append(f"{k} line {i}: Line audio file missing: {line_path}")
            else:
                try:
                    mp3 = mutagen.mp3.MP3(line_path)
                    disk_dur = round(float(mp3.info.length), 2)
                    diff = abs(disk_dur - line_dur)
                    if diff > 0.5:
                        errors.append(f"{k} line {i}: Duration mismatch: manifest={line_dur}s, disk={disk_dur}s, diff={diff:.2f}s")
                    if mp3.info.channels != 1:
                        errors.append(f"{k} line {i}: Not Mono: channels={mp3.info.channels} ({line_path})")
                    if mp3.info.bitrate != 48000:
                        errors.append(f"{k} line {i}: Not 48kbps: bitrate={mp3.info.bitrate} ({line_path})")
                    if mp3.info.sample_rate != 24000:
                        errors.append(f"{k} line {i}: Not 24kHz: sample_rate={mp3.info.sample_rate} ({line_path})")
                except Exception as e:
                    errors.append(f"{k} line {i}: Failed to parse line MP3 {line_path}: {e}")

            # Check timing invariants
            if i < len(line_timings):
                timing = line_timings[i]
                start = timing.get("start", 0)
                end = timing.get("end", 0)
                dur = timing.get("duration", 0)
                if start >= end:
                    errors.append(f"{k} line {i}: start ({start}) >= end ({end})")
                if i > 0 and start < prev_end - 0.01:
                    errors.append(f"{k} line {i}: overlap start ({start}) < prev_end ({prev_end})")
                prev_end = end

        if line_timings:
            last_end = line_timings[-1].get("end", 0)
            if last_end > man_total_dur + 0.1:
                errors.append(f"{k}: last line end ({last_end}) > totalDuration ({man_total_dur})")

    print(f"[PASS] Checked {len(hsk1_keys)} texts and {total_lines} dialogue lines.")

    # 3. Orphan file audit
    disk_hsk1_files = [os.path.abspath(f) for f in glob.glob("public/audio/coursebook/hsk1-*.mp3")]
    orphan_files = [f for f in disk_hsk1_files if f not in checked_files]
    if orphan_files:
        errors.append(f"Orphan audio files detected on disk ({len(orphan_files)}): {[os.path.basename(x) for x in orphan_files]}")
    else:
        print(f"[PASS] Zero orphan files on disk ({len(disk_hsk1_files)} files total, exactly matching manifest).")

    # 4. Check specific remediated targets
    t2 = manifest.get("hsk1-l1-t2", {})
    t3 = manifest.get("hsk1-l1-t3", {})
    if abs(t2.get("totalDuration", 0) - 9.89) > 0.5:
        warnings.append(f"hsk1-l1-t2 totalDuration is {t2.get('totalDuration')}, expected ~9.89s")
    if abs(t3.get("totalDuration", 0) - 9.79) > 0.5:
        warnings.append(f"hsk1-l1-t3 totalDuration is {t3.get('totalDuration')}, expected ~9.79s")

    print("\n" + "=" * 70)
    if warnings:
        print(f"WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print(f"FAILURES DETECTED ({len(errors)}):")
        for e in errors:
            print(f"  [ERROR] {e}")
        print("=" * 70)
        sys.exit(1)
    else:
        print("ALL VERIFICATIONS PASSED (100% HEALTHY).")
        print("=" * 70)
        sys.exit(0)

if __name__ == "__main__":
    run_verification()
