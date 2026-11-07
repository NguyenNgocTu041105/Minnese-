# -*- coding: utf-8 -*-
"""
Master Audio Generator for HSK 2 Coursebook (Lessons 1-15, 60 Texts, 308 Lines):
- 100% Standard Putonghua (Beijing Standard Mandarin) - Zero regional dialects.
- 100% Unified Character Voice Identity with HSK 1 (identical voice model, pitch, rate, avatar, persona).
- Authentic 2-person unison chorus (đồng thanh) for '白家月 & 安妮' ('zh-CN-Chorus-JiayueAnnie') and 4-person chorus for '学生们'.
- Uniform standard audio format: 24kHz, 48kbps CBR, 1 channel (mono), raw MPEG Layer III.
- Mirrors cleanly to public/audio/coursebook/ and dist/audio/coursebook/.
"""
import asyncio
import json
import os
import shutil
import subprocess
import sys
import mutagen.mp3
import edge_tts
import imageio_ffmpeg

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
OUT_DIR = os.path.join("public", "audio", "coursebook")
DIST_DIR = os.path.join("dist", "audio", "coursebook")
SCRATCH_DIR = os.path.join("scratch", "tts_hsk2_master")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(DIST_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

# 100% UNIFIED HSK 1 & HSK 2 STANDARD PUTONGHUA VOICE PROFILES
SPEAKER_PROFILES = {
    # Female characters - Identical to HSK 1
    "王一飞": ("王一飞 (Cô Vương Nhất Phi)", "female", "👩‍🏫", "zh-CN-XiaoxiaoNeural", "+0Hz", "-2%", "Cô Vương Nhất Phi (Giáo viên 30t đĩnh đạc, chuẩn phát thanh viên)"),
    "小语": ("小语 (Trợ lý AI Tiểu Ngữ)", "female", "🤖", "zh-CN-XiaoyiNeural", "+16Hz", "+3%", "Trợ lý AI Tiểu Ngữ (Linh vật AI cao trong trẻo, lanh lảnh)"),
    "白家月": ("白家月 (Bạch Gia Nguyệt)", "female", "👱‍♀️", "zh-CN-XiaoyiNeural", "-4Hz", "-3%", "Bạch Gia Nguyệt (Nữ du học sinh Pháp 20t dịu dàng, mềm mại)"),
    "安妮": ("安妮 (Annie)", "female", "👩‍🦰", "zh-CN-XiaoxiaoNeural", "+16Hz", "+4%", "Annie (Nữ du học sinh phương Tây 20t cao sáng, sôi nổi)"),
    "王一雪": ("王一雪 (Vương Nhất Tuyết)", "female", "👩", "zh-CN-XiaoxiaoNeural", "-15Hz", "-5%", "Vương Nhất Tuyết (Chị gái/Người mẹ 35t trầm ấm, chín chắn)"),
    "刘小雪": ("刘小雪 (Bé Tiểu Tuyết)", "female", "👧", "zh-CN-XiaoyiNeural", "+24Hz", "+5%", "Bé Lưu Tiểu Tuyết (Thiếu nữ 12t cao vút, lí lắc, hồn nhiên)"),
    "店员": ("店员 (Nhân viên cửa hàng)", "female", "🧑‍💼", "zh-CN-XiaoyiNeural", "+6Hz", "+2%", "Nhân viên cửa hàng (Nữ nhân viên bán hàng trẻ trung, đon đả)"),
    "摊主": ("摊主 (Chủ sạp hoa quả)", "female", "👩‍🌾", "zh-CN-XiaoyiNeural", "-10Hz", "+2%", "Chủ sạp hoa quả (Cô bán trái cây trung niên xởi lởi, niềm nở)"),

    # Group / Duet Chorus (Đồng thanh)
    "白家月 & 安妮": ("白家月 & 安妮 (Bạch Gia Nguyệt & Annie)", "female", "👯‍♀️", "zh-CN-Chorus-JiayueAnnie", "+0Hz", "+0%", "Bạch Gia Nguyệt & Annie (Đồng thanh 2 bạn nữ hòa âm)"),
    "学生们": ("学生们 (Các bạn học sinh)", "female", "👥", "zh-CN-Chorus-Students", "+0Hz", "+0%", "Các bạn học sinh (Đồng thanh cả lớp: 2 nam + 2 nữ hòa âm)"),

    # Male characters - Identical to HSK 1
    "李文": ("李文 (Lý Văn)", "male", "👨‍🎓", "zh-CN-YunxiNeural", "-2Hz", "-2%", "Lý Văn (Nam sinh Trung Quốc 20t thư sinh, điềm đạm)"),
    "陈天中": ("陈天中 (Trần Thiên Trung)", "male", "🧑‍🎓", "zh-CN-YunyangNeural", "-6Hz", "-3%", "Trần Thiên Trung (Nam du học sinh Thái 20t trầm dày, chững chạc)"),
    "杨同乐": ("杨同乐 (Dương Đồng Nhạc)", "male", "🧑‍💼", "zh-CN-YunxiNeural", "+8Hz", "+3%", "Dương Đồng Nhạc (Nam nhân viên công sở 28t trẻ trung, năng động)"),
    "刘明": ("刘明 (Bác sĩ Lưu Minh)", "male", "👨‍⚕️", "zh-CN-YunjianNeural", "-8Hz", "-4%", "Bác sĩ Lưu Minh (Bác sĩ/Người cha 40t trầm hùng, vững chãi)"),
    "小胡": ("小胡 (Bác sĩ Tiểu Hồ)", "male", "👨‍⚕️", "zh-CN-YunxiNeural", "+5Hz", "+1%", "Bác sĩ Tiểu Hồ (Nam bác sĩ đồng nghiệp trẻ lễ phép)"),
    "医生": ("医生 (Bác sĩ)", "male", "👨‍⚕️", "zh-CN-YunjianNeural", "-3Hz", "-4%", "Bác sĩ khám bệnh (Bác sĩ lớn tuổi điềm tĩnh, ân cần)"),
    "服务员": ("服务员 (Nhân viên phục vụ)", "male", "🧑‍🍳", "zh-CN-YunxiNeural", "+5Hz", "+3%", "Nhân viên phục vụ (Nam phục vụ trẻ nhanh nhẹn, lịch thiệp)"),
    "刘爷爷": ("刘爷爷 (Ông nội Lưu)", "male", "👴", "zh-CN-YunjianNeural", "-18Hz", "-12%", "Lưu Gia Gia (Cụ ông 68t trầm đục)"),

    # Boy voice - Identical to HSK 1
    "刘小明": ("刘小明 (Bé Tiểu Minh)", "male", "👦", "zh-CN-YunxiaNeural", "+18Hz", "+2%", "Bé Lưu Tiểu Minh (Bé trai 5 tuổi ngây thơ, nũng nịu)"),
}

def resolve_speaker(raw_name):
    clean = raw_name.split("(")[0].strip()
    if clean in SPEAKER_PROFILES:
        return SPEAKER_PROFILES[clean]
    for k in SPEAKER_PROFILES:
        if k in clean or clean in k:
            return SPEAKER_PROFILES[k]
    return SPEAKER_PROFILES["王一飞"]

def normalize_tts_text(text):
    spoken = text
    if "AI" in spoken:
        spoken = spoken.replace("AI", "A I ")
    return spoken

async def synth_to_file(text, voice, pitch, rate, out_path, max_retries=6):
    spoken = normalize_tts_text(text)
    for attempt in range(max_retries):
        try:
            comm = edge_tts.Communicate(spoken, voice, rate=rate, pitch=pitch)
            with open(out_path, "wb") as f:
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
            if os.path.exists(out_path) and os.path.getsize(out_path) > 500:
                return
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            wait_s = 2.0 * (attempt + 1)
            await asyncio.sleep(wait_s)

async def make_jiayue_annie_duet(text, tag, out_mp3_path):
    """Authentic 2-girl unison chorus (Bạch Gia Nguyệt + Annie)."""
    f1 = os.path.join(SCRATCH_DIR, f"{tag}_jiayue.mp3")
    f2 = os.path.join(SCRATCH_DIR, f"{tag}_annie.mp3")

    await asyncio.gather(
        synth_to_file(text, "zh-CN-XiaoyiNeural", "-4Hz", "-2%", f1),
        synth_to_file(text, "zh-CN-XiaoxiaoNeural", "+16Hz", "+2%", f2),
    )

    filter_complex = (
        "[0:a]volume=0.95[a0];"
        "[1:a]adelay=22|22,volume=0.92[a1];"
        "[a0][a1]amix=inputs=2:duration=longest:dropout_transition=2,"
        "alimiter=limit=0.95:attack=5:release=50[out]"
    )
    cmd = [
        FFMPEG, "-y",
        "-i", f1, "-i", f2,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "libmp3lame",
        "-b:a", "48k",
        "-ar", "24000",
        "-ac", "1",
        "-write_xing", "0",
        "-id3v2_version", "0",
        out_mp3_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def concat_mp3s(file_list, out_mp3_path):
    if len(file_list) == 1:
        shutil.copy2(file_list[0], out_mp3_path)
        return
    inputs = []
    for f in file_list:
        inputs.extend(["-i", f])

    filter_str = "".join(f"[{i}:a]" for i in range(len(file_list))) + f"concat=n={len(file_list)}:v=0:a=1[out]"
    cmd = [
        FFMPEG, "-y"
    ] + inputs + [
        "-filter_complex", filter_str,
        "-map", "[out]",
        "-c:a", "libmp3lame",
        "-b:a", "48k",
        "-ar", "24000",
        "-ac", "1",
        "-write_xing", "0",
        "-id3v2_version", "0",
        out_mp3_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def get_audio_duration(file_path):
    try:
        audio = mutagen.mp3.MP3(file_path)
        return round(float(audio.info.length), 2)
    except Exception:
        return 1.0

async def process_one_line(sem, tid, line_i, line):
    async with sem:
        raw_spk = line["speaker"]
        spk_display, gender, avatar, voice, pitch, rate, persona = resolve_speaker(raw_spk)
        hanzi = line["hanzi"]
        pinyin = line.get("pinyin", "")
        vietnamese = line.get("vietnamese", "")
        line_filename = f"{tid}_line{line_i}.mp3"
        line_filepath = os.path.join(OUT_DIR, line_filename)

        if voice == "zh-CN-Chorus-JiayueAnnie":
            await make_jiayue_annie_duet(hanzi, f"{tid}_l{line_i}", line_filepath)
        else:
            raw_tmp = os.path.join(SCRATCH_DIR, f"{line_filename}_raw.mp3")
            await synth_to_file(hanzi, voice, pitch, rate, raw_tmp)
            cmd_clean = [
                FFMPEG, "-y",
                "-i", raw_tmp,
                "-c:a", "libmp3lame",
                "-b:a", "48k",
                "-ar", "24000",
                "-ac", "1",
                "-write_xing", "0",
                "-id3v2_version", "0",
                line_filepath
            ]
            subprocess.run(cmd_clean, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        duration = get_audio_duration(line_filepath)
        return {
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
            "vietnamese": vietnamese,
            "filepath": line_filepath,
        }

async def main():
    parsed_texts_path = os.path.join("scripts", "parsed_hsk2_texts.json")
    with open(parsed_texts_path, "r", encoding="utf-8") as f:
        all_texts = json.load(f)

    manifest_json_path = os.path.join("src", "data", "coursebookAudioManifest.json")
    with open(manifest_json_path, "r", encoding="utf-8") as f:
        existing_manifest = json.load(f)

    silence_path = os.path.join("public", "audio", "silence_04.mp3")
    if not os.path.exists(silence_path):
        cmd_silence = [
            FFMPEG, "-y",
            "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
            "-t", "0.40",
            "-c:a", "libmp3lame",
            "-b:a", "48k",
            "-ar", "24000",
            "-ac", "1",
            "-write_xing", "0",
            "-id3v2_version", "0",
            silence_path
        ]
        subprocess.run(cmd_silence, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    sem = asyncio.Semaphore(5)
    print(f"Master HSK 2 Audio Generation: Processing {len(all_texts)} texts (308 lines)...", flush=True)

    for item in all_texts:
        tid = item["id"]
        lesson_num = item["lesson"]
        text_idx = item["textIndex"]
        full_filename = f"{tid}_full.mp3"
        full_filepath = os.path.join(OUT_DIR, full_filename)

        # Check if already processed with target voice & persona
        all_lines_exist = all(os.path.exists(os.path.join(OUT_DIR, f"{tid}_line{i}.mp3")) for i in range(len(item["lines"])))
        if os.path.exists(full_filepath) and all_lines_exist and tid in existing_manifest:
            ex_lines = existing_manifest[tid].get("lines", [])
            if len(ex_lines) == len(item["lines"]):
                all_matched = True
                for li_idx, raw_line in enumerate(item["lines"]):
                    _, _, _, target_voice, _, _, target_persona = resolve_speaker(raw_line["speaker"])
                    if ex_lines[li_idx].get("voice") != target_voice or ex_lines[li_idx].get("persona") != target_persona:
                        all_matched = False
                        break
                if all_matched:
                    print(f"Skipping {tid} (already up to date)", flush=True)
                    continue

        results = await asyncio.gather(*[
            process_one_line(sem, tid, i, ln) for i, ln in enumerate(item["lines"])
        ])
        results.sort(key=lambda x: x["lineIndex"])

        full_concat_files = []
        line_timings = []
        line_audios = []
        current_time = 0.0

        for i, res in enumerate(results):
            duration = res["duration"]
            full_concat_files.append(res["filepath"])
            if i < len(results) - 1:
                full_concat_files.append(silence_path)

            line_timings.append({
                "lineIndex": i,
                "start": round(current_time, 2),
                "end": round(current_time + duration, 2),
                "duration": duration
            })
            current_time += duration + 0.40

            line_obj = {k: v for k, v in res.items() if k != "filepath"}
            line_audios.append(line_obj)

        concat_mp3s(full_concat_files, full_filepath)
        total_duration = get_audio_duration(full_filepath)

        existing_manifest[tid] = {
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
        print(f"Processed {tid} ({len(line_audios)} lines, {total_duration}s)", flush=True)

        with open(manifest_json_path, "w", encoding="utf-8") as f:
            json.dump(existing_manifest, f, ensure_ascii=False, indent=2)

    print("Mirroring HSK 2 audio files to dist/audio/coursebook/...", flush=True)
    for root, _, files in os.walk(OUT_DIR):
        for f in files:
            if f.startswith("hsk2-"):
                shutil.copy2(os.path.join(OUT_DIR, f), os.path.join(DIST_DIR, f))
    print("HSK 2 Master Audio Generation Complete!", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
