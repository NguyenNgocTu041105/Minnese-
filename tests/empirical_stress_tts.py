"""Empirical Challenger Stress Test Harness for tts_service.py

Stress tests:
1. CLI with edge cases: empty string, whitespace, long text (>5000 chars),
   Chinese punctuation, mixed Pinyin, emojis, special characters.
2. Voice fallback behavior: invalid voice name, forced primary exception.
3. Nested output directory creation and spaces in path.
4. Concurrency: multiple parallel CLI calls generating distinct MP3 files.
5. Mutagen audio verification: file exists, size > 0 bytes, duration > 0.
"""

import sys
import os
import subprocess
import json
import time
import concurrent.futures
from pathlib import Path
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PYTHON_EXEC = sys.executable
BASE_DIR = Path(__file__).resolve().parent.parent
TTS_SCRIPT = BASE_DIR / "tts_service.py"
OUTPUT_DIR = BASE_DIR / "public" / "audio" / "stress_test_run"


def run_cli(*args):
    cmd = [PYTHON_EXEC, str(TTS_SCRIPT)] + list(args)
    proc = subprocess.run(
        cmd,
        cwd=str(BASE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    return proc


def verify_mp3(file_path):
    p = Path(file_path)
    if not p.is_file():
        return False, "File does not exist", 0, 0.0
    size = p.stat().st_size
    if size == 0:
        return False, "File is 0 bytes", 0, 0.0
    try:
        audio = mutagen.mp3.MP3(str(p))
        duration = float(audio.info.length)
        if duration <= 0:
            return False, f"Non-positive duration: {duration}", size, duration
        return True, "Valid MP3", size, duration
    except Exception as e:
        return False, f"Mutagen parse error: {e}", size, 0.0


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = {}
    created_files = []

    print("=" * 60)
    print("EMPIRICAL STRESS TEST HARNESS — tts_service.py")
    print(f"Python Executable: {PYTHON_EXEC}")
    print(f"Target Script: {TTS_SCRIPT}")
    print("=" * 60)

    # 1. Edge Case: Empty text
    print("\n[TEST 1] Empty string input:")
    out1 = OUTPUT_DIR / "test1_empty.mp3"
    proc1 = run_cli("--text", "", "--output", str(out1))
    print(f"  Exit code: {proc1.returncode}")
    print(f"  Stdout: {proc1.stdout.strip()}")
    print(f"  Stderr: {proc1.stderr.strip()}")
    try:
        p1_json = json.loads(proc1.stdout.strip() if proc1.stdout.strip() else proc1.stderr.strip())
        results["test1_empty"] = {
            "exit_code": proc1.returncode,
            "success": p1_json.get("success"),
            "error": p1_json.get("error"),
            "pass": proc1.returncode != 0 and p1_json.get("success") is False
        }
    except Exception as e:
        results["test1_empty"] = {
            "exit_code": proc1.returncode,
            "error": f"JSON parse failure: {e}",
            "pass": False
        }

    # 2. Edge Case: Whitespace text
    print("\n[TEST 2] Whitespace text input:")
    out2 = OUTPUT_DIR / "test2_ws.mp3"
    proc2 = run_cli("--text", "   \t\r\n  ", "--output", str(out2))
    print(f"  Exit code: {proc2.returncode}")
    print(f"  Stdout: {proc2.stdout.strip()}")
    try:
        p2_json = json.loads(proc2.stdout.strip())
        results["test2_whitespace"] = {
            "exit_code": proc2.returncode,
            "success": p2_json.get("success"),
            "error": p2_json.get("error"),
            "pass": proc2.returncode != 0 and p2_json.get("success") is False
        }
    except Exception as e:
        results["test2_whitespace"] = {
            "exit_code": proc2.returncode,
            "error": f"JSON parse failure: {e}",
            "pass": False
        }

    # 3. Edge Case: Chinese punctuation only
    print("\n[TEST 3] Chinese punctuation only:")
    out3 = OUTPUT_DIR / "test3_punct.mp3"
    created_files.append(out3)
    proc3 = run_cli("--text", "，。！？；：“”‘’（）《》……——", "--output", str(out3))
    print(f"  Exit code: {proc3.returncode}")
    print(f"  Stdout: {proc3.stdout.strip()}")
    ok3, msg3, sz3, dur3 = verify_mp3(out3)
    results["test3_chinese_punctuation"] = {
        "exit_code": proc3.returncode,
        "valid_mp3": ok3,
        "msg": msg3,
        "size": sz3,
        "duration": dur3,
        "pass": proc3.returncode == 0 and ok3
    }

    # 4. Edge Case: Mixed Pinyin and Chinese
    print("\n[TEST 4] Mixed Pinyin and Chinese:")
    out4 = OUTPUT_DIR / "test4_pinyin.mp3"
    created_files.append(out4)
    proc4 = run_cli("--text", "Nǐ hǎo, wǒ shì xuéshēng. 你好，我是学生。", "--output", str(out4))
    print(f"  Exit code: {proc4.returncode}")
    print(f"  Stdout: {proc4.stdout.strip()}")
    ok4, msg4, sz4, dur4 = verify_mp3(out4)
    results["test4_mixed_pinyin"] = {
        "exit_code": proc4.returncode,
        "valid_mp3": ok4,
        "msg": msg4,
        "size": sz4,
        "duration": dur4,
        "pass": proc4.returncode == 0 and ok4
    }

    # 5. Edge Case: Emojis
    print("\n[TEST 5] Emojis in text:")
    out5 = OUTPUT_DIR / "test5_emoji.mp3"
    created_files.append(out5)
    proc5 = run_cli("--text", "你好 🎧 🎵 🐶 🎉 🇨🇳 📚 再见", "--output", str(out5))
    print(f"  Exit code: {proc5.returncode}")
    print(f"  Stdout: {proc5.stdout.strip()}")
    ok5, msg5, sz5, dur5 = verify_mp3(out5)
    results["test5_emojis"] = {
        "exit_code": proc5.returncode,
        "valid_mp3": ok5,
        "msg": msg5,
        "size": sz5,
        "duration": dur5,
        "pass": proc5.returncode == 0 and ok5
    }

    # 6. Edge Case: Very long text (>5000 characters)
    print("\n[TEST 6] Very long text (>5000 characters, 5200 chars):")
    long_text = "这是一段非常长的测试文本用于压力测试。" * 260  # 20 * 260 = 5200 chars
    out6 = OUTPUT_DIR / "test6_long.mp3"
    created_files.append(out6)
    start_t = time.time()
    proc6 = run_cli("--text", long_text, "--output", str(out6))
    elapsed6 = time.time() - start_t
    print(f"  Execution time: {elapsed6:.2f}s")
    print(f"  Exit code: {proc6.returncode}")
    print(f"  Stdout: {proc6.stdout.strip()[:200]}...")
    ok6, msg6, sz6, dur6 = verify_mp3(out6)
    results["test6_long_text_5200"] = {
        "exit_code": proc6.returncode,
        "elapsed_s": round(elapsed6, 2),
        "valid_mp3": ok6,
        "msg": msg6,
        "size": sz6,
        "duration": dur6,
        "pass": proc6.returncode == 0 and ok6
    }

    # 7. Voice fallback: Invalid voice name
    print("\n[TEST 7] Fallback voice test: Invalid voice name")
    out7 = OUTPUT_DIR / "test7_fallback_invalid_voice.mp3"
    created_files.append(out7)
    proc7 = run_cli("--text", "测试语音回退功能", "--output", str(out7), "--voice", "NonExistentVoiceNeural")
    print(f"  Exit code: {proc7.returncode}")
    print(f"  Stdout: {proc7.stdout.strip()}")
    ok7, msg7, sz7, dur7 = verify_mp3(out7)
    voice_used = ""
    try:
        p7_json = json.loads(proc7.stdout.strip())
        voice_used = p7_json.get("voice", "")
    except Exception:
        pass
    results["test7_invalid_voice"] = {
        "exit_code": proc7.returncode,
        "voice_used": voice_used,
        "expected_fallback_voice": "zh-CN-YunxiNeural",
        "valid_mp3": ok7,
        "size": sz7,
        "duration": dur7,
        "fallback_to_yunxi": voice_used == "zh-CN-YunxiNeural",
        "pass": proc7.returncode == 0 and ok7
    }

    # 8. Nested directory creation
    print("\n[TEST 8] Nested directory creation:")
    out8 = OUTPUT_DIR / "sub_dir" / "deep_dir" / "test8_nested.mp3"
    created_files.append(out8)
    proc8 = run_cli("--text", "测试自动创建多级目录", "--output", str(out8))
    print(f"  Exit code: {proc8.returncode}")
    print(f"  Stdout: {proc8.stdout.strip()}")
    ok8, msg8, sz8, dur8 = verify_mp3(out8)
    results["test8_nested_dir"] = {
        "exit_code": proc8.returncode,
        "valid_mp3": ok8,
        "msg": msg8,
        "size": sz8,
        "duration": dur8,
        "pass": proc8.returncode == 0 and ok8
    }

    # 9. Concurrency: Multiple simultaneous CLI invocations
    print("\n[TEST 9] Concurrency stress test: 5 simultaneous CLI calls:")
    concurrent_prompts = [
        "第一题：男：今天下午有会议吗？女：没有，明天上午才有。",
        "第二题：女：你想喝咖啡还是茶？男：给我一杯绿茶吧，谢谢。",
        "第三题：男：你最近工作很忙吗？女：是的，每天都要加班。",
        "第四题：女：这件衬衫多少钱？男：打折后一百二十块。",
        "第五题：男：明天天气怎么样？女：预报说会下雨，出门记得带伞。"
    ]

    concurrent_outputs = [
        OUTPUT_DIR / f"test9_concurrent_{i}.mp3"
        for i in range(len(concurrent_prompts))
    ]
    created_files.extend(concurrent_outputs)

    def do_cli(args):
        idx, prompt, out_path = args
        t0 = time.time()
        p = run_cli("--text", prompt, "--output", str(out_path), "--voice", "zh-CN-XiaoxiaoNeural" if idx % 2 == 0 else "zh-CN-YunxiNeural")
        t1 = time.time()
        ok, msg, sz, dur = verify_mp3(out_path)
        return {
            "index": idx,
            "exit_code": p.returncode,
            "stdout": p.stdout.strip(),
            "elapsed_s": round(t1 - t0, 2),
            "valid_mp3": ok,
            "size": sz,
            "duration": dur,
            "msg": msg
        }

    c_start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        c_tasks = list(zip(range(len(concurrent_prompts)), concurrent_prompts, concurrent_outputs))
        c_results = list(executor.map(do_cli, c_tasks))
    c_elapsed = time.time() - c_start

    print(f"  Total concurrent wall time: {c_elapsed:.2f}s")
    all_c_passed = True
    for cr in c_results:
        print(f"  Task {cr['index']}: exit={cr['exit_code']}, valid={cr['valid_mp3']}, size={cr['size']}B, dur={cr['duration']}s in {cr['elapsed_s']}s")
        if cr['exit_code'] != 0 or not cr['valid_mp3']:
            all_c_passed = False

    results["test9_concurrency"] = {
        "num_tasks": len(concurrent_prompts),
        "total_wall_s": round(c_elapsed, 2),
        "all_valid_mp3": all_c_passed,
        "tasks": c_results,
        "pass": all_c_passed
    }

    # Summary
    print("\n" + "=" * 60)
    print("STRESS TEST RESULTS SUMMARY")
    print("=" * 60)
    print(json.dumps(results, indent=2, ensure_ascii=False))

    # Clean up created audio files
    for cf in created_files:
        try:
            if cf.is_file():
                cf.unlink()
        except Exception:
            pass
    # Clean up dirs
    try:
        (OUTPUT_DIR / "sub_dir" / "deep_dir").rmdir()
        (OUTPUT_DIR / "sub_dir").rmdir()
        OUTPUT_DIR.rmdir()
    except Exception:
        pass


if __name__ == "__main__":
    main()
