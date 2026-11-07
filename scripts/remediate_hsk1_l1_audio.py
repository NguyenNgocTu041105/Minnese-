# -*- coding: utf-8 -*-
"""
Remediation script for HSK 1 Lesson 1 Text 2 and Text 3 audio.
Re-synthesizes '学生们' lines with Edge-TTS zh-CN-shaanxi-XiaoniNeural (48kbps mono 24kHz),
assembles clean _full.mp3 files with 0.40s silence, and synchronizes manifest entries.
"""
import asyncio
import edge_tts
import json
import mutagen.mp3
import os
import shutil
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

AUDIO_DIR = os.path.join("public", "audio", "coursebook")
DIST_AUDIO_DIR = os.path.join("dist", "audio", "coursebook")
SILENCE_PATH = os.path.join("public", "audio", "silence_04.mp3")
MANIFEST_PATH = os.path.join("src", "data", "coursebookAudioManifest.json")

async def synthesize_file(text: str, voice: str, pitch: str, rate: str, out_path: str):
    spoken_text = text.replace("AI", "A I ") if "AI" in text else text
    comm = edge_tts.Communicate(spoken_text, voice, pitch=pitch, rate=rate)
    await comm.save(out_path)
    if not os.path.exists(out_path) or os.path.getsize(out_path) < 500:
        raise RuntimeError(f"Synthesis failed or file too small for '{text}' -> {out_path}")
    mp3 = mutagen.mp3.MP3(out_path)
    print(f"  Synthesized: {os.path.basename(out_path)} ({text}) -> {mp3.info.length:.2f}s, {mp3.info.bitrate/1000:.0f}kbps, {mp3.info.channels}ch")

async def remediate():
    with open(SILENCE_PATH, "rb") as sf:
        silence_raw = sf.read()
    silence_bytes = silence_raw[44:] if silence_raw.startswith(b"ID3") else silence_raw

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # ---------------------------------------------------------
    # 1. HSK 1 Lesson 1 Text 2 (hsk1-l1-t2)
    # Lines:
    # 0: 王一飞: 大家好！ (existing 48k mono)
    # 1: 学生们: 老师，您好！ (re-synthesize 48k mono)
    # 2: 小语: 你们好！ (existing 48k mono)
    # 3: 学生们: 你好，小语！ (re-synthesize 48k mono)
    # ---------------------------------------------------------
    print("\n--- Remediating hsk1-l1-t2 ---")
    t2_line1_path = os.path.join(AUDIO_DIR, "hsk1-l1-t2_line1.mp3")
    t2_line3_path = os.path.join(AUDIO_DIR, "hsk1-l1-t2_line3.mp3")
    await synthesize_file("老师，您好！", "zh-CN-shaanxi-XiaoniNeural", "+6Hz", "-2%", t2_line1_path)
    await synthesize_file("你好，小语！", "zh-CN-shaanxi-XiaoniNeural", "+6Hz", "-2%", t2_line3_path)

    t2_line_paths = [os.path.join(AUDIO_DIR, f"hsk1-l1-t2_line{i}.mp3") for i in range(4)]
    t2_parts = []
    for i, p in enumerate(t2_line_paths):
        with open(p, "rb") as lf:
            t2_parts.append(lf.read())
        if i < 3:
            t2_parts.append(silence_bytes)

    t2_full_path = os.path.join(AUDIO_DIR, "hsk1-l1-t2_full.mp3")
    with open(t2_full_path, "wb") as ff:
        ff.write(b"".join(t2_parts))

    t2_full_mp3 = mutagen.mp3.MP3(t2_full_path)
    t2_total_duration = round(float(t2_full_mp3.info.length), 2)
    print(f"  Assembled hsk1-l1-t2_full.mp3 -> {t2_total_duration}s ({t2_full_mp3.info.bitrate/1000:.0f}kbps, {t2_full_mp3.info.channels}ch)")

    # Compute exact line timings
    t2_entry = manifest["hsk1-l1-t2"]
    t2_timings = []
    curr_time = 0.0
    for i, p in enumerate(t2_line_paths):
        dur = round(float(mutagen.mp3.MP3(p).info.length), 2)
        t2_timings.append({
            "lineIndex": i,
            "start": round(curr_time, 2),
            "end": round(curr_time + dur, 2),
            "duration": dur
        })
        t2_entry["lines"][i]["duration"] = dur
        curr_time += dur + 0.40

    # Update 学生们 metadata in lines
    t2_entry["lines"][1]["voice"] = "zh-CN-shaanxi-XiaoniNeural"
    t2_entry["lines"][1]["persona"] = "Các bạn học sinh (Hiểu Ni - Đồng thanh trẻ trung)"
    t2_entry["lines"][1]["avatar"] = "👥"
    t2_entry["lines"][1]["gender"] = "female"
    t2_entry["lines"][3]["voice"] = "zh-CN-shaanxi-XiaoniNeural"
    t2_entry["lines"][3]["persona"] = "Các bạn học sinh (Hiểu Ni - Đồng thanh trẻ trung)"
    t2_entry["lines"][3]["avatar"] = "👥"
    t2_entry["lines"][3]["gender"] = "female"

    t2_entry["totalDuration"] = t2_total_duration
    t2_entry["lineTimings"] = t2_timings

    # ---------------------------------------------------------
    # 2. HSK 1 Lesson 1 Text 3 (hsk1-l1-t3)
    # Lines:
    # 0: 学生们: 谢谢！ (re-synthesize 48k mono)
    # 1: 小语: 不客气！ (existing 48k mono)
    # 2: 王一飞: 同学们，再见！ (existing 48k mono)
    # 3: 学生们: 老师，再见！ (re-synthesize 48k mono)
    # ---------------------------------------------------------
    print("\n--- Remediating hsk1-l1-t3 ---")
    t3_line0_path = os.path.join(AUDIO_DIR, "hsk1-l1-t3_line0.mp3")
    t3_line3_path = os.path.join(AUDIO_DIR, "hsk1-l1-t3_line3.mp3")
    await synthesize_file("谢谢！", "zh-CN-shaanxi-XiaoniNeural", "+6Hz", "-2%", t3_line0_path)
    await synthesize_file("老师，再见！", "zh-CN-shaanxi-XiaoniNeural", "+6Hz", "-2%", t3_line3_path)

    t3_line_paths = [os.path.join(AUDIO_DIR, f"hsk1-l1-t3_line{i}.mp3") for i in range(4)]
    t3_parts = []
    for i, p in enumerate(t3_line_paths):
        with open(p, "rb") as lf:
            t3_parts.append(lf.read())
        if i < 3:
            t3_parts.append(silence_bytes)

    t3_full_path = os.path.join(AUDIO_DIR, "hsk1-l1-t3_full.mp3")
    with open(t3_full_path, "wb") as ff:
        ff.write(b"".join(t3_parts))

    t3_full_mp3 = mutagen.mp3.MP3(t3_full_path)
    t3_total_duration = round(float(t3_full_mp3.info.length), 2)
    print(f"  Assembled hsk1-l1-t3_full.mp3 -> {t3_total_duration}s ({t3_full_mp3.info.bitrate/1000:.0f}kbps, {t3_full_mp3.info.channels}ch)")

    # Compute exact line timings
    t3_entry = manifest["hsk1-l1-t3"]
    t3_timings = []
    curr_time = 0.0
    for i, p in enumerate(t3_line_paths):
        dur = round(float(mutagen.mp3.MP3(p).info.length), 2)
        t3_timings.append({
            "lineIndex": i,
            "start": round(curr_time, 2),
            "end": round(curr_time + dur, 2),
            "duration": dur
        })
        t3_entry["lines"][i]["duration"] = dur
        curr_time += dur + 0.40

    # Update 学生们 metadata in lines
    t3_entry["lines"][0]["voice"] = "zh-CN-shaanxi-XiaoniNeural"
    t3_entry["lines"][0]["persona"] = "Các bạn học sinh (Hiểu Ni - Đồng thanh trẻ trung)"
    t3_entry["lines"][0]["avatar"] = "👥"
    t3_entry["lines"][0]["gender"] = "female"
    t3_entry["lines"][3]["voice"] = "zh-CN-shaanxi-XiaoniNeural"
    t3_entry["lines"][3]["persona"] = "Các bạn học sinh (Hiểu Ni - Đồng thanh trẻ trung)"
    t3_entry["lines"][3]["avatar"] = "👥"
    t3_entry["lines"][3]["gender"] = "female"

    t3_entry["totalDuration"] = t3_total_duration
    t3_entry["lineTimings"] = t3_timings

    # Write back manifest
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"\nUpdated {MANIFEST_PATH} successfully!")

    # Copy files to dist if dist exists
    if os.path.exists(DIST_AUDIO_DIR):
        for f in ["hsk1-l1-t2_line1.mp3", "hsk1-l1-t2_line3.mp3", "hsk1-l1-t2_full.mp3",
                  "hsk1-l1-t3_line0.mp3", "hsk1-l1-t3_line3.mp3", "hsk1-l1-t3_full.mp3"]:
            src = os.path.join(AUDIO_DIR, f)
            dst = os.path.join(DIST_AUDIO_DIR, f)
            shutil.copy2(src, dst)
            print(f"  Synced to dist: {dst}")

if __name__ == "__main__":
    asyncio.run(remediate())
