import sys
import os
import re
import json
import asyncio
import edge_tts
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = os.path.join("public", "audio", "coursebook")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Voice profiles
VOICE_MALE_FRIEND = "zh-CN-YunxiNeural"      # Nam tự nhiên, ấm áp (bạn bè)
VOICE_FEMALE_FRIEND = "zh-CN-XiaoyiNeural"   # Nữ trẻ trung, sinh động (bạn bè)
VOICE_FEMALE_TEACHER = "zh-CN-XiaoxiaoNeural"# Nữ chuẩn mực, dịu dàng (cô giáo)
VOICE_MALE_STUDENT = "zh-CN-YunxiaNeural"    # Nam học sinh, lễ phép
VOICE_NARRATOR = "zh-CN-XiaoxiaoNeural"

def assign_voice(speaker_raw: str, line_idx: int, context: str) -> dict:
    speaker = speaker_raw.lower()
    
    # Check explicit roles
    if "小语" in speaker or "ai" in speaker:
        return {
            "voice": VOICE_FEMALE_FRIEND,
            "speakerName": "小语 (Trợ lý AI Tiểu Ngữ)",
            "gender": "female",
            "avatar": "🤖",
            "persona": "Trợ lý AI Tiểu Ngữ (Hiểu Y - Giọng AI trong trẻo)"
        }
    if "王一飞" in speaker or "老师" in speaker or "cô" in speaker or "thầy" in speaker:
        return {
            "voice": VOICE_FEMALE_TEACHER,
            "speakerName": "王一飞 (Cô Vương Nhất Phi)",
            "gender": "female",
            "avatar": "👩‍🏫",
            "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ HSK chuẩn)"
        }
    if "学生" in speaker or "học sinh" in speaker or "同学" in speaker:
        return {
            "voice": VOICE_MALE_STUDENT,
            "speakerName": "学生们 (Học sinh)",
            "gender": "male",
            "avatar": "👨‍🎓",
            "persona": "Học sinh (Vân Hạ - Nam thiếu niên)"
        }
    if "李文" in speaker or "li wen" in speaker:
        return {
            "voice": VOICE_MALE_FRIEND,
            "speakerName": "李文 (Lý Văn)",
            "gender": "male",
            "avatar": "👨‍⚕️",
            "persona": "Lý Văn (Vân Hy - Nam sinh y khoa)"
        }
    if "陈天中" in speaker or "chen tianzhong" in speaker:
        return {
            "voice": VOICE_MALE_STUDENT,
            "speakerName": "陈天中 (Trần Thiên Trung)",
            "gender": "male",
            "avatar": "👨‍🎓",
            "persona": "Trần Thiên Trung (Vân Hạ - Du học sinh Thái)"
        }
    if "白家月" in speaker or "bai jiayue" in speaker:
        return {
            "voice": VOICE_FEMALE_FRIEND,
            "speakerName": "白家月 (Bạch Gia Nguyệt)",
            "gender": "female",
            "avatar": "👱‍♀️",
            "persona": "Bạch Gia Nguyệt (Hiểu Y - Du học sinh Pháp)"
        }
    if "安妮" in speaker or "annie" in speaker:
        return {
            "voice": VOICE_FEMALE_FRIEND,
            "speakerName": "安妮 (Annie)",
            "gender": "female",
            "avatar": "👩‍🦰",
            "persona": "Annie (Hiểu Y - Du học sinh Canada)"
        }
    if "李月" in speaker or "li yue" in speaker or "小红" in speaker or "玛丽" in speaker:
        return {
            "voice": VOICE_FEMALE_FRIEND,
            "speakerName": speaker_raw,
            "gender": "female",
            "avatar": "👩",
            "persona": f"{speaker_raw} (Hiểu Y - Nữ trẻ trung)"
        }
    if "大卫" in speaker or "david" in speaker or "小明" in speaker or "王方" in speaker:
        return {
            "voice": VOICE_MALE_FRIEND,
            "speakerName": speaker_raw,
            "gender": "male",
            "avatar": "👨",
            "persona": f"{speaker_raw} (Vân Hy - Nam tự nhiên)"
        }
    
    # Generic A / B
    if speaker == "a" or speaker.startswith("a "):
        return {
            "voice": VOICE_MALE_FRIEND,
            "speakerName": "Nhân vật A",
            "gender": "male",
            "avatar": "👨",
            "persona": "Nhân vật A (Vân Hy - Nam tự nhiên)"
        }
    if speaker == "b" or speaker.startswith("b "):
        return {
            "voice": VOICE_FEMALE_FRIEND,
            "speakerName": "Nhân vật B",
            "gender": "female",
            "avatar": "👩",
            "persona": "Nhân vật B (Hiểu Y - Nữ sinh động)"
        }
    
    # Fallback by line index
    if line_idx % 2 == 0:
        return {
            "voice": VOICE_MALE_FRIEND,
            "speakerName": speaker_raw,
            "gender": "male",
            "avatar": "👨",
            "persona": f"{speaker_raw} (Vân Hy - Nam tự nhiên)"
        }
    else:
        return {
            "voice": VOICE_FEMALE_FRIEND,
            "speakerName": speaker_raw,
            "gender": "female",
            "avatar": "👩",
            "persona": f"{speaker_raw} (Hiểu Y - Nữ sinh động)"
        }

async def generate_single_file(text: str, voice: str, path: str, rate: str = "-8%") -> float:
    # Synthesize single line
    communicator = edge_tts.Communicate(text, voice, rate=rate)
    await communicator.save(path)
    try:
        audio = mutagen.mp3.MP3(path)
        return round(float(audio.info.length), 2)
    except Exception:
        return round(os.path.getsize(path) / 6000.0, 2)

async def generate_full_dialogue(segments: list, full_path: str, rate: str = "-8%") -> dict:
    # Synthesize segments with 0.45s conversational pause in between
    silence_path = os.path.join("public", "audio", "silence_04.mp3")
    silence_bytes = b""
    if os.path.exists(silence_path):
        with open(silence_path, "rb") as f:
            silence_bytes = f.read()
    
    combined_chunks = []
    line_timings = []
    current_time = 0.0

    for i, seg in enumerate(segments):
        line_start = current_time
        line_chunks = []
        communicator = edge_tts.Communicate(seg["text"], seg["voice"], rate=rate)
        async for chunk in communicator.stream():
            if chunk["type"] == "audio":
                line_chunks.append(chunk["data"])
        
        # Save temporary segment to measure exact duration
        temp_seg_path = full_path + f".temp_{i}.mp3"
        with open(temp_seg_path, "wb") as f:
            for c in line_chunks:
                f.write(c)
        
        try:
            audio = mutagen.mp3.MP3(temp_seg_path)
            line_duration = round(float(audio.info.length), 2)
        except Exception:
            line_duration = round(len(line_chunks) * 0.05, 2)
        
        try:
            os.remove(temp_seg_path)
        except Exception:
            pass

        combined_chunks.extend(line_chunks)
        line_end = line_start + line_duration
        line_timings.append({
            "lineIndex": i,
            "start": round(line_start, 2),
            "end": round(line_end, 2),
            "duration": line_duration
        })

        # Add 0.45s silence between lines
        if i < len(segments) - 1:
            if silence_bytes:
                combined_chunks.append(silence_bytes)
                current_time = line_end + 0.40
            else:
                current_time = line_end + 0.35
        else:
            current_time = line_end

    with open(full_path, "wb") as f:
        for c in combined_chunks:
            f.write(c)

    try:
        audio = mutagen.mp3.MP3(full_path)
        total_duration = round(float(audio.info.length), 2)
    except Exception:
        total_duration = round(current_time, 2)

    return {
        "totalDuration": total_duration,
        "lineTimings": line_timings
    }

async def process_lessons(max_lessons: int = 2):
    with open("scripts/parsed_hsk1_texts.json", encoding="utf-8") as f:
        all_texts = json.load(f)

    manifest = {}

    target_texts = [t for t in all_texts if t["lesson"] <= max_lessons]
    print(f"Generating audio for {len(target_texts)} lesson texts (Lessons 1 to {max_lessons})...")

    for item in target_texts:
        text_id = item["id"]
        lesson_num = item["lesson"]
        text_idx = item["textIndex"]
        print(f"\nProcessing {text_id}: Lesson {lesson_num} Text {text_idx} ({len(item['lines'])} lines)")

        line_items = []
        segments_for_full = []

        for l_idx, line in enumerate(item["lines"]):
            assigned = assign_voice(line["speaker"], l_idx, item["context"])
            line_filename = f"{text_id}_line{l_idx}.mp3"
            line_filepath = os.path.join(OUTPUT_DIR, line_filename)
            line_url = f"/audio/coursebook/{line_filename}"

            print(f"  [Line {l_idx}] {line['speaker']} -> {assigned['voice']} ({line['hanzi']})")
            duration = await generate_single_file(line["hanzi"], assigned["voice"], line_filepath)
            
            line_data = {
                "lineIndex": l_idx,
                "speaker": line["speaker"],
                "speakerName": assigned["speakerName"],
                "gender": assigned["gender"],
                "avatar": assigned["avatar"],
                "persona": assigned["persona"],
                "voice": assigned["voice"],
                "audioUrl": line_url,
                "duration": duration,
                "hanzi": line["hanzi"],
                "pinyin": line["pinyin"],
                "vietnamese": line["vietnamese"]
            }
            line_items.append(line_data)
            segments_for_full.append({
                "voice": assigned["voice"],
                "text": line["hanzi"]
            })

        # Generate full dialogue
        full_filename = f"{text_id}_full.mp3"
        full_filepath = os.path.join(OUTPUT_DIR, full_filename)
        full_url = f"/audio/coursebook/{full_filename}"
        
        dialogue_result = await generate_full_dialogue(segments_for_full, full_filepath)
        print(f"  [Full Dialogue] {full_filename} ({dialogue_result['totalDuration']}s, {len(dialogue_result['lineTimings'])} timings)")

        manifest[text_id] = {
            "id": text_id,
            "lesson": lesson_num,
            "textIndex": text_idx,
            "title": item["title"],
            "context": item["context"],
            "fullAudioUrl": full_url,
            "totalDuration": dialogue_result["totalDuration"],
            "lineTimings": dialogue_result["lineTimings"],
            "lines": line_items
        }

    # Save manifest as JSON
    with open("src/data/coursebookAudioManifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("\nSaved manifest to src/data/coursebookAudioManifest.json")

    # Generate TypeScript export file
    ts_code = f"""/**
 * Pre-generated High-Fidelity Edge-TTS Studio Audio Manifest for Coursebook Lessons
 * Auto-generated with multi-role character persona casting, conversational pauses & timing synchronization.
 */

export interface CoursebookLineTiming {{
  lineIndex: number;
  start: number;
  end: number;
  duration: number;
}}

export interface CoursebookLineAudio {{
  lineIndex: number;
  speaker: string;
  speakerName: string;
  gender: 'male' | 'female';
  avatar: string;
  persona: string;
  voice: string;
  audioUrl: string;
  duration: number;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}}

export interface CoursebookTextAudio {{
  id: string;
  lesson: number;
  textIndex: number;
  title: string;
  context: string;
  fullAudioUrl: string;
  totalDuration: number;
  lineTimings: CoursebookLineTiming[];
  lines: CoursebookLineAudio[];
}}

export const COURSEBOOK_AUDIO_MANIFEST: Record<string, CoursebookTextAudio> = {json.dumps(manifest, ensure_ascii=False, indent=2)};
"""
    with open("src/data/coursebookAudioManifest.ts", "w", encoding="utf-8") as f:
        f.write(ts_code)
    print("Saved TypeScript manifest to src/data/coursebookAudioManifest.ts")

if __name__ == "__main__":
    max_l = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    asyncio.run(process_lessons(max_l))
