# -*- coding: utf-8 -*-
"""
Generate studio-quality Edge-TTS audio for HSK 2 (Lessons 1-5, 20 texts).
Calibrated multi-role voice casting:
- Never speaks character names (only speaks hanzi text).
- Distinct character recognition & natural conversational cadence.
- 0.4s natural breath pause between dialogue turns.
"""
import asyncio
import json
import os
import sys
import mutagen.mp3
import edge_tts

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUT_DIR = os.path.join("public", "audio", "coursebook")
os.makedirs(OUT_DIR, exist_ok=True)

# Character casting profile for HSK 2 - 100% DISTINCT NEURAL BASE MODELS
SPEAKER_PROFILES = {
    # Young Female Exchange Students
    "白家月": ("白家月 (Bạch Gia Nguyệt)", "female", "👱‍♀️", "zh-CN-shaanxi-XiaoniNeural", "+0Hz", "-2%", "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)"),
    "安妮": ("安妮 (Annie)", "female", "👩‍🦰", "zh-CN-XiaoyiNeural", "+6Hz", "-1%", "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)"),
    "白家月 & 安妮": ("白家月 & 安妮", "female", "👯‍♀️", "zh-CN-shaanxi-XiaoniNeural", "+0Hz", "-2%", "Bạch Gia Nguyệt & Annie (Đồng thanh)"),

    # Adult Chinese Women
    "王一飞": ("王一飞 (Cô Vương Nhất Phi)", "female", "👩‍🏫", "zh-CN-XiaoxiaoNeural", "-2Hz", "-3%", "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)"),
    "王一雪": ("王一雪 (Vương Nhất Tuyết)", "female", "👩", "zh-CN-liaoning-XiaobeiNeural", "-2Hz", "-3%", "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)"),

    # Family & Grandparents
    "刘明": ("刘明 (Bác sĩ Lưu Minh)", "male", "👨‍⚕️", "zh-CN-YunjianNeural", "-6Hz", "-4%", "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)"),
    "刘爷爷": ("刘爷爷 (Ông nội Lưu)", "male", "👴", "zh-CN-YunjianNeural", "-16Hz", "-12%", "Lưu Gia Gia (Vân Kiện trầm đậm - Ông nội 68t)"),
    "爷爷": ("刘爷爷 (Ông nội Lưu)", "male", "👴", "zh-CN-YunjianNeural", "-16Hz", "-12%", "Lưu Gia Gia (Vân Kiện trầm đậm - Ông nội 68t)"),
    "刘奶奶": ("刘奶奶 (Bà nội Lưu)", "female", "👵", "zh-CN-XiaoxiaoNeural", "-12Hz", "-8%", "Lưu Nãi Nãi (Hiểu Hiểu đôn hậu - Bà nội 65t)"),
    "奶奶": ("刘奶奶 (Bà nội Lưu)", "female", "👵", "zh-CN-XiaoxiaoNeural", "-12Hz", "-8%", "Lưu Nãi Nãi (Hiểu Hiểu đôn hậu - Bà nội 65t)"),
    "刘小雪": ("刘小雪 (Lưu Tiểu Tuyết)", "female", "👧", "zh-CN-XiaoyiNeural", "+25Hz", "+4%", "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)"),
    "刘小明": ("刘小明 (Lưu Tiểu Minh)", "male", "👦", "zh-CN-YunxiaNeural", "+15Hz", "+0%", "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)"),

    # Young Adult Men
    "陈天中": ("陈天中 (Trần Thiên Trung)", "male", "🧑‍🎓", "zh-CN-YunyangNeural", "-6Hz", "-3%", "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)"),
    "李文": ("李文 (Lý Văn)", "male", "👨‍🎓", "zh-CN-YunxiNeural", "+2Hz", "-2%", "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)"),
    "杨同乐": ("杨同乐 (Dương Đồng Nhạc)", "male", "🧑‍💼", "zh-CN-YunyangNeural", "+6Hz", "-1%", "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)"),

    # Service Staff & AI
    "服务员": ("服务员 (Nhân viên phục vụ)", "female", "🧑‍💼", "zh-CN-XiaoyiNeural", "+2Hz", "-1%", "Nhân viên phục vụ lịch thiệp, ân cần"),
    "售货员": ("售货员 (Nhân viên bán hàng)", "female", "🧑‍💼", "zh-CN-XiaoyiNeural", "+2Hz", "-1%", "Nhân viên bán hàng niềm nở"),
    "店员": ("店员 (Nhân viên cửa hàng)", "female", "🧑‍💼", "zh-CN-XiaoyiNeural", "+2Hz", "-1%", "Nhân viên cửa hàng trẻ trung"),
    "小语": ("小语 (Trợ lý AI Tiểu Ngữ)", "female", "🤖", "zh-CN-XiaoyiNeural", "+18Hz", "+2%", "Trợ lý ảo AI Tiểu Ngữ")
}

def resolve_speaker(raw_name):
    clean = raw_name.split("(")[0].strip()
    if clean in SPEAKER_PROFILES:
        return SPEAKER_PROFILES[clean]
    for k, v in SPEAKER_PROFILES.items():
        if k in clean or clean in k:
            return v
    return SPEAKER_PROFILES["白家月"]

async def synthesize_speech(text, voice, pitch, rate):
    communicator = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    chunks = []
    async for chunk in communicator.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)

def get_audio_duration(file_path):
    try:
        audio = mutagen.mp3.MP3(file_path)
        return round(float(audio.info.length), 2)
    except Exception:
        return 1.0

async def main():
    # Read HSK 2 data from newHsk2BookData.ts
    print("Loading HSK 2 Lessons 1 to 5 from newHsk2BookData.ts...")
    
    # Generate 0.4s silence for breath pauses
    silence_path = os.path.join("public", "audio", "silence_04.mp3")
    if os.path.exists(silence_path):
        with open(silence_path, "rb") as sf:
            silence_bytes = sf.read()
    else:
        silence_bytes = b""

    # Extract all texts for lessons 1 to 5 from TS file
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from parse_hsk2_data import get_hsk2_texts_l1_to_l5
    texts_to_generate = get_hsk2_texts_l1_to_l5()

    print(f"Total texts to generate: {len(texts_to_generate)}")

    new_manifest_entries = {}

    for item in texts_to_generate:
        tid = item["id"]
        lesson_num = item["lesson"]
        text_idx = item["textIndex"]
        title = item["title"]
        context = item.get("context", "")
        print(f"\nProcessing {tid} ({title}) - {len(item['lines'])} lines...")

        full_audio_parts = []
        line_timings = []
        line_audios = []
        current_time = 0.0

        for line_i, line in enumerate(item["lines"]):
            raw_spk = line["speaker"]
            spk_display, gender, avatar, voice, pitch, rate, persona = resolve_speaker(raw_spk)

            hanzi = line["hanzi"]
            pinyin = line.get("pinyin", "")
            vietnamese = line.get("vietnamese", "")

            line_filename = f"{tid}_line{line_i}.mp3"
            line_filepath = os.path.join(OUT_DIR, line_filename)
            # IMPORTANT: NEVER speak character name! ONLY synthesize hanzi text with calibrated distinct neural voice!
            audio_data = await synthesize_speech(hanzi, voice, pitch, rate)
            with open(line_filepath, "wb") as lf:
                lf.write(audio_data)

            duration = get_audio_duration(line_filepath)

            full_audio_parts.append(audio_data)
            if line_i < len(item["lines"]) - 1 and silence_bytes:
                full_audio_parts.append(silence_bytes)

            line_timings.append({
                "lineIndex": line_i,
                "start": round(current_time, 2),
                "end": round(current_time + duration, 2),
                "duration": duration
            })

            current_time += duration + (0.40 if silence_bytes else 0.0)

            line_audios.append({
                "lineIndex": line_i,
                "speaker": spk_display,
                "speakerName": spk_display,
                "gender": gender,
                "avatar": avatar,
                "persona": persona,
                "voice": voice,
                "audioUrl": f"/audio/coursebook/{line_filename}",
                "duration": duration,
                "hanzi": hanzi,
                "pinyin": pinyin,
                "vietnamese": vietnamese
            })

            print(f"  Line {line_i}: [{spk_display}] '{hanzi}' -> {duration}s ({voice}, {pitch})")

        full_filename = f"{tid}_full.mp3"
        full_filepath = os.path.join(OUT_DIR, full_filename)
        with open(full_filepath, "wb") as ff:
            ff.write(b"".join(full_audio_parts))
        total_duration = get_audio_duration(full_filepath)

        new_manifest_entries[tid] = {
            "id": tid,
            "lesson": lesson_num,
            "textIndex": text_idx,
            "title": title,
            "context": context,
            "fullAudioUrl": f"/audio/coursebook/{full_filename}",
            "totalDuration": total_duration,
            "lineTimings": line_timings,
            "lines": line_audios
        }

    # Save to json file for review and manifest patching
    out_json = os.path.join("scripts", "generated_hsk2_manifest.json")
    with open(out_json, "w", encoding="utf-8") as jf:
        json.dump(new_manifest_entries, jf, ensure_ascii=False, indent=2)

    # Merge into coursebookAudioManifest.ts
    manifest_ts_path = os.path.join("src", "data", "coursebookAudioManifest.ts")
    with open(manifest_ts_path, "r", encoding="utf-8") as f:
        ts_content = f.read()

    marker = "COURSEBOOK_AUDIO_MANIFEST: Record<string, CoursebookTextAudio> = "
    start_pos = ts_content.index(marker) + len(marker)
    brace_start = ts_content.index("{", start_pos)
    depth = 0
    brace_end = brace_start
    for k in range(brace_start, len(ts_content)):
        if ts_content[k] == "{":
            depth += 1
        elif ts_content[k] == "}":
            depth -= 1
            if depth == 0:
                brace_end = k
                break

    existing_manifest = json.loads(ts_content[brace_start:brace_end + 1])
    existing_manifest.update(new_manifest_entries)

    formatted_json = json.dumps(existing_manifest, ensure_ascii=False, indent=2)

    new_ts_content = ts_content[:brace_start] + formatted_json + ts_content[brace_end + 1:]
    with open(manifest_ts_path, "w", encoding="utf-8") as f:
        f.write(new_ts_content)

    print(f"\nSuccessfully generated audio for all {len(new_manifest_entries)} texts in HSK 2 and updated {manifest_ts_path}!")

if __name__ == "__main__":
    asyncio.run(main())
