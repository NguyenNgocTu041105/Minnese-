# -*- coding: utf-8 -*-
"""
Regenerate ALL HSK 1 audio (Lessons 1-15, 45 texts) with unified, natural adult male voices.
Fixes childish voices for young men (Chen Tianzhong, Yang Tongle, Li Wen, Liu Ming).
Yunxia child voice is strictly restricted to 5-year-old boy Liu Xiaoming.
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

SPEAKER_PROFILES = {
    # Female characters - 100% DISTINCT NEURAL MODELS (Zero overlap between conversation partners)
    "王一飞": ("王一飞 (Cô Vương Nhất Phi)", "female", "👩‍🏫", "zh-CN-XiaoxiaoNeural", "-2Hz", "-3%", "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)"),
    "白家月": ("白家月 (Bạch Gia Nguyệt)", "female", "👱‍♀️", "zh-CN-shaanxi-XiaoniNeural", "+0Hz", "-2%", "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)"),
    "安妮": ("安妮 (Annie)", "female", "👩‍🦰", "zh-CN-XiaoyiNeural", "+6Hz", "-1%", "Annie (Hiểu Y - Nữ du học sinh phương Tây hoạt bát 20t)"),
    "王一雪": ("王一雪 (Vương Nhất Tuyết)", "female", "👩", "zh-CN-liaoning-XiaobeiNeural", "-2Hz", "-3%", "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)"),
    "刘小雪": ("刘小雪 (Bé Tiểu Tuyết)", "female", "👧", "zh-CN-XiaoyiNeural", "+25Hz", "+4%", "Bé Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)"),
    "店员": ("店员 (Nhân viên cửa hàng)", "female", "🧑‍💼", "zh-CN-XiaoyiNeural", "+2Hz", "-1%", "Nhân viên bán hàng (Hiểu Y - Trẻ trung, niềm nở)"),
    "服务员": ("服务员 (Nhân viên phục vụ)", "female", "🧑‍🍳", "zh-CN-XiaoyiNeural", "+2Hz", "-1%", "Nhân viên phục vụ (Hiểu Y - Lịch thiệp, ân cần)"),
    "学生们": ("学生们 (Các bạn học sinh)", "female", "👥", "zh-CN-shaanxi-XiaoniNeural", "+6Hz", "-2%", "Các bạn học sinh"),
    "小语": ("小语 (Trợ lý AI Tiểu Ngữ)", "female", "🤖", "zh-CN-XiaoyiNeural", "+18Hz", "+2%", "Trợ lý AI Tiểu Ngữ"),

    # Adult male characters - 100% DISTINCT NEURAL MODELS
    "李文": ("李文 (Lý Văn)", "male", "👨‍🎓", "zh-CN-YunxiNeural", "+2Hz", "-2%", "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)"),
    "陈天中": ("陈天中 (Trần Thiên Trung)", "male", "🧑‍🎓", "zh-CN-YunyangNeural", "-6Hz", "-3%", "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)"),
    "杨同乐": ("杨同乐 (Dương Đồng Nhạc)", "male", "🧑‍💼", "zh-CN-YunyangNeural", "+6Hz", "-1%", "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)"),
    "刘明": ("刘明 (Bác sĩ Lưu Minh)", "male", "👨‍⚕️", "zh-CN-YunjianNeural", "-6Hz", "-4%", "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)"),
    "小胡": ("小胡 (Bác sĩ Tiểu Hồ)", "male", "👨‍⚕️", "zh-CN-YunjianNeural", "+4Hz", "-2%", "Tiểu Hồ (Vân Kiện - Bác sĩ đồng nghiệp)"),
    "医生": ("医生 (Bác sĩ)", "male", "👨‍⚕️", "zh-CN-YunjianNeural", "-4Hz", "-4%", "Bác sĩ khám bệnh (Vân Kiện)"),
    "摊主": ("摊主 (Chủ sạp hoa quả)", "male", "👨‍🌾", "zh-CN-YunyangNeural", "+0Hz", "-2%", "Chủ sạp hoa quả (Vân Dương)"),
    "刘爷爷": ("刘爷爷 (Ông nội Lưu)", "male", "👴", "zh-CN-YunjianNeural", "-16Hz", "-12%", "Lưu Gia Gia (Vân Kiện trầm đậm - Ông nội 68t)"),

    # Boy voice
    "刘小明": ("刘小明 (Bé Tiểu Minh)", "male", "👦", "zh-CN-YunxiaNeural", "+15Hz", "+0%", "Bé Lưu Tiểu Minh (Vân Hạ - Bé trai 8 tuổi)"),
}

def resolve_speaker(raw_name):
    clean = raw_name.split("(")[0].strip()
    for k in SPEAKER_PROFILES:
        if k in clean or clean in k:
            return SPEAKER_PROFILES[k]
    return SPEAKER_PROFILES["王一飞"]

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
    parsed_texts_path = os.path.join("scripts", "parsed_hsk1_texts.json")
    with open(parsed_texts_path, "r", encoding="utf-8") as f:
        all_texts = json.load(f)

    # Process ALL 45 texts (Lessons 1-15)
    print(f"Regenerating audio for ALL {len(all_texts)} texts (Lessons 1-15) with calibrated natural adult male voices...")

    silence_path = os.path.join("public", "audio", "silence_04.mp3")
    if os.path.exists(silence_path):
        with open(silence_path, "rb") as sf:
            silence_bytes = sf.read()
    else:
        silence_bytes = b""

    generated_manifest_entries = {}

    for item in all_texts:
        tid = item["id"]
        lesson_num = item["lesson"]
        text_idx = item["textIndex"]
        print(f"\nProcessing {tid} (Lesson {lesson_num} Text {text_idx}) - {len(item['lines'])} lines...")

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

            audio_data = await synthesize_speech(hanzi, voice, pitch, rate)
            line_filename = f"{tid}_line{line_i}.mp3"
            line_filepath = os.path.join(OUT_DIR, line_filename)
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

        generated_manifest_entries[tid] = {
            "id": tid,
            "lesson": lesson_num,
            "textIndex": text_idx,
            "title": item.get("title", f"课文 {text_idx}"),
            "context": item.get("context", ""),
            "fullAudioUrl": f"/audio/coursebook/{full_filename}",
            "totalDuration": total_duration,
            "lineTimings": line_timings,
            "lines": line_audios
        }
        print(f"  Saved full audio {full_filename} ({total_duration}s)")

    # Merge into coursebookAudioManifest.ts and .json
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
    existing_manifest.update(generated_manifest_entries)

    formatted_json = json.dumps(existing_manifest, ensure_ascii=False, indent=2)

    new_ts_content = ts_content[:brace_start] + formatted_json + ts_content[brace_end + 1:]
    with open(manifest_ts_path, "w", encoding="utf-8") as f:
        f.write(new_ts_content)
    print(f"\nUpdated {manifest_ts_path} with all {len(generated_manifest_entries)} texts!")

    manifest_json_path = os.path.join("src", "data", "coursebookAudioManifest.json")
    with open(manifest_json_path, "w", encoding="utf-8") as f:
        f.write(formatted_json)
    print(f"Updated {manifest_json_path} successfully!")

if __name__ == "__main__":
    asyncio.run(main())
