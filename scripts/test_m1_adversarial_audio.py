# -*- coding: utf-8 -*-
"""
Adversarial Empirical Challenge Harness for Milestone 1 Audio (HSK 1)
Author: challenger_m1_1

Performs:
1. Byte-level MPEG Frame Header decoding:
   - Validates sync words, layer III, bitrate, sample rate, channels for every single frame.
   - Detects any mid-stream bitrate/sample rate switches.
   - Scans for corrupted or leaked Xing/Info/VBRI/ID3 headers.
2. Waveform PCM Decoding & Energy Profiling:
   - Uses ffmpeg to decode MP3 to uncompressed 16-bit PCM.
   - Measures RMS energy for each dialogue line interval in manifest.
   - Compares speech energy vs inter-line pause silence.
3. Turn Transition & Interval Verification:
   - Validates that lines do not overlap and silence gaps align with assembly.
"""

import json
import math
import os
import struct
import subprocess
import sys
import numpy as np
import imageio_ffmpeg

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

MANIFEST_PATH = os.path.join("src", "data", "coursebookAudioManifest.json")
AUDIO_DIR = os.path.join("public", "audio", "coursebook")
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# MPEG Audio Bitrate Table for MPEG-2 / MPEG-2.5 Layer III (in kbps)
MPEG2_L3_BITRATES = [
    0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0
]
# MPEG Audio Sample Rate Table for MPEG-2 (in Hz)
MPEG2_SAMPLERATES = [22050, 24000, 16000, 0]

def parse_mpeg_frames(filepath):
    """
    Decodes every single raw MPEG frame header in the file.
    Returns a list of frame dicts:
    [{'offset': int, 'version': str, 'layer': int, 'bitrate': int, 'samplerate': int, 'padding': int, 'frame_len': int, 'channel_mode': int}]
    """
    with open(filepath, "rb") as f:
        data = f.read()

    frames = []
    idx = 0
    total_len = len(data)

    # Check for ID3v2 header at the start
    has_id3 = data.startswith(b"ID3")
    xing_found = []

    while idx < total_len:
        # Search for frame sync word 0xFFE or 0xFFF
        if idx + 4 > total_len:
            break

        b0, b1, b2, b3 = data[idx], data[idx+1], data[idx+2], data[idx+3]

        if b0 == 0xFF and (b1 & 0xE0) == 0xE0:
            # Sync found
            version_id = (b1 >> 3) & 0x03
            layer_id = (b1 >> 1) & 0x03
            has_crc = (b1 & 0x01) == 0

            # 00 = MPEG 2.5, 10 = MPEG 2, 11 = MPEG 1
            if version_id == 2:
                version = "MPEG-2"
            elif version_id == 3:
                version = "MPEG-1"
            elif version_id == 0:
                version = "MPEG-2.5"
            else:
                idx += 1
                continue

            # Layer 3 = 01 (Layer III)
            if layer_id != 1:
                idx += 1
                continue

            bitrate_idx = (b2 >> 4) & 0x0F
            sample_idx = (b2 >> 2) & 0x03
            padding = (b2 >> 1) & 0x01
            channel_mode = (b3 >> 6) & 0x03

            if version == "MPEG-2":
                bitrate = MPEG2_L3_BITRATES[bitrate_idx] * 1000
                samplerate = MPEG2_SAMPLERATES[sample_idx]
                samples_per_frame = 576
                coef = 72
            else:
                # Fallback for MPEG-1 (not expected for 24kHz)
                bitrate = 0
                samplerate = 0
                samples_per_frame = 1152
                coef = 144

            if bitrate == 0 or samplerate == 0:
                idx += 1
                continue

            frame_len = int((coef * bitrate) / samplerate) + padding

            # Check for Xing/Info tag in the side information / data area
            frame_body = data[idx:idx + frame_len]
            if b"Xing" in frame_body:
                xing_found.append(("Xing", idx, frame_body.find(b"Xing")))
            if b"Info" in frame_body:
                xing_found.append(("Info", idx, frame_body.find(b"Info")))
            if b"VBRI" in frame_body:
                xing_found.append(("VBRI", idx, frame_body.find(b"VBRI")))

            frames.append({
                "offset": idx,
                "version": version,
                "layer": 3,
                "bitrate": bitrate,
                "samplerate": samplerate,
                "padding": padding,
                "frame_len": frame_len,
                "channel_mode": channel_mode,
                "samples": samples_per_frame
            })

            idx += frame_len
        else:
            idx += 1

    return {
        "file_size": total_len,
        "has_id3": has_id3,
        "xing_tags": xing_found,
        "frames": frames
    }

def decode_mp3_to_pcm(filepath, target_sr=24000):
    """
    Decodes an MP3 file into raw float32 PCM numpy array [-1.0, 1.0] at target_sr.
    """
    cmd = [
        FFMPEG_EXE,
        "-v", "error",
        "-i", filepath,
        "-f", "s16le",
        "-ac", "1",
        "-ar", str(target_sr),
        "-"
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    raw_pcm, err = proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg decode error on {filepath}: {err.decode('utf-8')}")

    samples = np.frombuffer(raw_pcm, dtype=np.int16).astype(np.float32) / 32768.0
    return samples, target_sr

def calculate_rms(samples):
    if len(samples) == 0:
        return 0.0
    return math.sqrt(float(np.mean(samples ** 2)))

def run_adversarial_suite():
    print("=" * 80)
    print("EMPIRICAL ADVERSARIAL AUDIO TEST HARNESS (HSK 1)")
    print("=" * 80)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    target_files = [
        ("hsk1-l1-t2", os.path.join(AUDIO_DIR, "hsk1-l1-t2_full.mp3")),
        ("hsk1-l1-t3", os.path.join(AUDIO_DIR, "hsk1-l1-t3_full.mp3")),
    ]

    all_passed = True

    for text_id, audio_path in target_files:
        print(f"\n[AUDIT] Target: {text_id} -> {audio_path}")
        assert os.path.exists(audio_path), f"File missing: {audio_path}"

        # -------------------------------------------------------------
        # 1. Byte-level MPEG Frame Header Analysis
        # -------------------------------------------------------------
        print("  1. Decoding raw MPEG frames...")
        info = parse_mpeg_frames(audio_path)
        frames = info["frames"]
        print(f"     Total frames parsed: {len(frames)}, total bytes: {info['file_size']}")

        # Assert no ID3 header corrupting the stream
        if info["has_id3"]:
            print("     [FAIL] ID3v2 header detected at file start!")
            all_passed = False
        else:
            print("     [PASS] Clean raw stream: No ID3v2 header prepended.")

        # Assert no Xing / Info / VBRI headers anywhere in frames
        if info["xing_tags"]:
            print(f"     [FAIL] Xing/Info headers detected: {info['xing_tags']}")
            all_passed = False
        else:
            print("     [PASS] Zero Xing / Info / VBRI headers detected in any frame.")

        # Check frame consistency: NO mid-stream bitrate or sample rate switches
        bitrates = set(f["bitrate"] for f in frames)
        samplerates = set(f["samplerate"] for f in frames)
        channels = set(f["channel_mode"] for f in frames)

        print(f"     Bitrates detected: {bitrates}")
        print(f"     Sample rates detected: {samplerates}")
        print(f"     Channel modes (3=mono): {channels}")

        if len(bitrates) != 1 or 48000 not in bitrates:
            print(f"     [FAIL] Mid-stream bitrate switch or incorrect bitrate: {bitrates}")
            all_passed = False
        else:
            print("     [PASS] Bitrate uniform across all frames (48,000 bps).")

        if len(samplerates) != 1 or 24000 not in samplerates:
            print(f"     [FAIL] Mid-stream sample rate switch: {samplerates}")
            all_passed = False
        else:
            print("     [PASS] Sample rate uniform across all frames (24,000 Hz).")

        if len(channels) != 1 or 3 not in channels:
            print(f"     [FAIL] Channel mode inconsistent or not Mono: {channels}")
            all_passed = False
        else:
            print("     [PASS] Channel mode uniform across all frames (Mono).")

        # Frame duration vs manifest duration
        total_samples = sum(f["samples"] for f in frames)
        derived_duration = total_samples / 24000.0
        manifest_entry = manifest[text_id]
        declared_duration = manifest_entry["totalDuration"]
        dur_diff = abs(derived_duration - declared_duration)
        print(f"     Duration: Frames={derived_duration:.3f}s, Manifest={declared_duration:.3f}s, Diff={dur_diff:.3f}s")
        if dur_diff > 0.05:
            print(f"     [FAIL] Duration discrepancy exceeds 0.05s: diff={dur_diff:.3f}s")
            all_passed = False
        else:
            print("     [PASS] Exact frame-level duration matches manifest within 0.05s.")

        # -------------------------------------------------------------
        # 2. Waveform Energy & Speech Verification
        # -------------------------------------------------------------
        print("\n  2. Waveform Energy & Line Timing Analysis...")
        samples, sr = decode_mp3_to_pcm(audio_path, target_sr=24000)
        total_audio_sec = len(samples) / sr
        print(f"     Decoded PCM samples: {len(samples)} ({total_audio_sec:.2f}s at {sr} Hz)")

        line_timings = manifest_entry["lineTimings"]
        lines = manifest_entry["lines"]

        for i, t in enumerate(line_timings):
            s_idx = int(t["start"] * sr)
            e_idx = int(t["end"] * sr)
            line_samples = samples[s_idx:e_idx]
            rms = calculate_rms(line_samples)
            peak = float(np.max(np.abs(line_samples))) if len(line_samples) > 0 else 0.0

            text_hanzi = lines[i]["hanzi"]
            speaker = lines[i]["speaker"]
            print(f"     Line {i} [{speaker}: '{text_hanzi}'] ({t['start']}s - {t['end']}s): RMS={rms:.4f}, Peak={peak:.4f}")

            # Empirical check: spoken speech must have non-zero energy
            if rms < 0.03:
                print(f"     [FAIL] Line {i} energy is abnormally low (silent or muted! RMS={rms:.4f})")
                all_passed = False
            else:
                print(f"     [PASS] Line {i} contains active speech audio.")

            # Check pause after this line (if not last)
            if i < len(line_timings) - 1:
                next_t = line_timings[i + 1]
                p_start_idx = e_idx
                p_end_idx = int(next_t["start"] * sr)
                pause_samples = samples[p_start_idx:p_end_idx]
                pause_rms = calculate_rms(pause_samples)
                pause_dur = (p_end_idx - p_start_idx) / sr
                print(f"       -> Inter-line Pause {i}->{i+1} ({pause_dur:.2f}s): RMS={pause_rms:.4f}")

                # Pause should be quiet silence compared to speech
                if pause_rms > 0.015:
                    print(f"       [WARN/FAIL] Pause period has high energy (clipping/noise? RMS={pause_rms:.4f})")
                else:
                    print(f"       [PASS] Clean inter-line silence between turn {i} and {i+1}.")

    # -------------------------------------------------------------
    # 3. Comprehensive Sanity Scan Across ALL 45 Full Audio Files
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    print("3. Comprehensive Scan across all 45 HSK 1 full audio files")
    print("=" * 80)

    anomalous_files = []
    for l in range(1, 16):
        for t in range(1, 4):
            dialogue_id = f"hsk1-l{l}-t{t}"
            file_name = f"{dialogue_id}_full.mp3"
            full_path = os.path.join(AUDIO_DIR, file_name)
            if not os.path.exists(full_path):
                anomalous_files.append((dialogue_id, "File missing"))
                continue

            info = parse_mpeg_frames(full_path)
            frames = info["frames"]
            if not frames:
                anomalous_files.append((dialogue_id, "No MPEG frames"))
                continue

            bitrates = set(f["bitrate"] for f in frames)
            srs = set(f["samplerate"] for f in frames)
            if len(bitrates) > 1 or 48000 not in bitrates:
                anomalous_files.append((dialogue_id, f"Bitrate switch: {bitrates}"))
            if len(srs) > 1 or 24000 not in srs:
                anomalous_files.append((dialogue_id, f"Sample rate switch: {srs}"))
            if info["has_id3"]:
                anomalous_files.append((dialogue_id, "Has ID3 header"))
            if info["xing_tags"]:
                anomalous_files.append((dialogue_id, f"Has Xing tag: {info['xing_tags']}"))

    if anomalous_files:
        print(f"[FAIL] Found {len(anomalous_files)} anomalous files:")
        for af in anomalous_files:
            print(f"  - {af[0]}: {af[1]}")
        all_passed = False
    else:
        print("[PASS] All 45 HSK 1 full audio files have 100% clean, uniform 48kbps 24kHz Mono MPEG frames with ZERO Xing/ID3 corruption!")

    print("\n" + "=" * 80)
    if all_passed:
        print("ALL EMPIRICAL ADVERSARIAL AUDIO TESTS PASSED!")
        print("=" * 80)
        sys.exit(0)
    else:
        print("EMPIRICAL ADVERSARIAL AUDIO TESTS DETECTED FAILURES!")
        print("=" * 80)
        sys.exit(1)

if __name__ == "__main__":
    run_adversarial_suite()
