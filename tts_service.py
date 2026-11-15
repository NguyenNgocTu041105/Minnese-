"""Edge-TTS Audio Generation Service for HSK Exam QBank

Generates native Mandarin speech (.mp3) for listening questions using edge-tts.
Includes automatic voice fallback and audio duration measurement via mutagen.
"""

import sys
import os
import argparse
import asyncio
import json
import re
from typing import List, Tuple
import edge_tts
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"
FALLBACK_VOICE = "zh-CN-YunxiNeural"
VOICE_MALE = "zh-CN-YunxiNeural"
VOICE_FEMALE = "zh-CN-XiaoxiaoNeural"
VOICE_NARRATOR = "zh-CN-XiaoxiaoNeural"

# Expanded Catalog of High-Quality Chinese Voices for HSK Exams
VOICES_CATALOG = {
    "zh-CN-XiaoxiaoNeural": {"name": "Hiểu Hiểu (Nữ HSK chuẩn)", "gender": "female"},
    "zh-CN-XiaoyiNeural": {"name": "Hiểu Y (Nữ trẻ trung)", "gender": "female"},
    "zh-CN-liaoning-XiaobeiNeural": {"name": "Tiểu Bối (Nữ Đông Bắc)", "gender": "female"},
    "zh-CN-shaanxi-XiaoniNeural": {"name": "Tiểu Ni (Nữ Thiểm Tây)", "gender": "female"},
    "zh-CN-YunxiNeural": {"name": "Vân Hy (Nam tự nhiên)", "gender": "male"},
    "zh-CN-YunjianNeural": {"name": "Vân Kiện (Nam chuẩn phát thanh HSK)", "gender": "male"},
    "zh-CN-YunyangNeural": {"name": "Vân Dương (Nam phát thanh viên)", "gender": "male"},
    "zh-CN-YunxiaNeural": {"name": "Vân Hạ (Nam thiếu niên / học sinh)", "gender": "male"},
}
VOICES = list(VOICES_CATALOG.keys())

DIALOGUE_PAIRS = [
    {"male": "zh-CN-YunxiNeural", "female": "zh-CN-XiaoxiaoNeural", "label": "Nam Vân Hy + Nữ Hiểu Hiểu (Chuẩn HSK)"},
    {"male": "zh-CN-YunjianNeural", "female": "zh-CN-XiaoyiNeural", "label": "Nam Vân Kiện + Nữ Hiểu Y (Chuẩn khảo thí)"},
    {"male": "zh-CN-YunyangNeural", "female": "zh-CN-XiaoxiaoNeural", "label": "Nam Vân Dương + Nữ Hiểu Hiểu (Trang trọng / Tin tức)"},
    {"male": "zh-CN-YunxiaNeural", "female": "zh-CN-XiaoyiNeural", "label": "Nam Vân Hạ + Nữ Hiểu Y (Học sinh & Bạn bè)"},
]

FEMALE_INDICATORS = {"女", "妈妈", "母亲", "奶奶", "女儿", "妹妹", "姐姐", "小红", "女的", "女声", "乙", "b"}
MALE_INDICATORS = {"男", "爸爸", "父亲", "爷爷", "儿子", "弟弟", "哥哥", "小明", "男的", "男声", "甲", "a"}


def get_or_create_chime() -> bytes:
    """Returns 1.25s gentle 2-tone exam chime (G5 784Hz + C6 1046.5Hz with exponential decay)."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    chime_path = os.path.join(base_dir, "public", "audio", "chime_intro.mp3")
    if os.path.isfile(chime_path) and os.path.getsize(chime_path) > 100:
        try:
            with open(chime_path, "rb") as f:
                return f.read()
        except Exception:
            pass
    try:
        import subprocess
        import numpy as np
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        sr = 24000
        t = np.linspace(0, 1.2, int(sr * 1.2), False)
        tone = 0.35 * np.sin(2 * np.pi * 784 * t) * np.exp(-4 * t) + 0.25 * np.sin(2 * np.pi * 1046.5 * t) * np.exp(-3 * t)
        pcm = (tone * 32767).astype(np.int16).tobytes()
        os.makedirs(os.path.dirname(chime_path), exist_ok=True)
        subprocess.run(
            [ffmpeg, "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "48k", "-write_xing", "0", chime_path],
            input=pcm, capture_output=True, check=True
        )
        with open(chime_path, "rb") as f:
            return f.read()
    except Exception:
        return b""


def get_or_create_silence() -> bytes:
    """Returns ~0.4s natural conversational pause between dialogue lines."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    silence_path = os.path.join(base_dir, "public", "audio", "silence_04.mp3")
    if os.path.isfile(silence_path) and os.path.getsize(silence_path) > 100:
        try:
            with open(silence_path, "rb") as f:
                return f.read()
        except Exception:
            pass
    try:
        import subprocess
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        os.makedirs(os.path.dirname(silence_path), exist_ok=True)
        subprocess.run(
            [ffmpeg, "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.4", "-c:a", "libmp3lame", "-b:a", "48k", "-write_xing", "0", silence_path],
            capture_output=True, check=True
        )
        with open(silence_path, "rb") as f:
            return f.read()
    except Exception:
        return b""


def resolve_dialogue_pair(
    requested_voice: str = DEFAULT_VOICE,
    voice_male: str | None = None,
    voice_female: str | None = None,
    seed_key: str | None = None,
) -> Tuple[str, str]:
    """Resolves (male_voice, female_voice) tuple based on requested voice or seed key."""
    if voice_male and voice_female:
        return (voice_male, voice_female)

    if requested_voice and requested_voice != "auto" and requested_voice in VOICES_CATALOG:
        entry = VOICES_CATALOG[requested_voice]
        if entry["gender"] == "male":
            m = requested_voice
            f = "zh-CN-XiaoyiNeural" if m == "zh-CN-YunjianNeural" else "zh-CN-XiaoxiaoNeural"
            return (m, f)
        elif entry["gender"] == "female":
            f = requested_voice
            m = "zh-CN-YunjianNeural" if f == "zh-CN-XiaoyiNeural" else "zh-CN-YunxiNeural"
            return (m, f)

    if seed_key:
        pair_idx = abs(hash(seed_key)) % len(DIALOGUE_PAIRS)
    else:
        pair_idx = 0
    pair = DIALOGUE_PAIRS[pair_idx]
    return (pair["male"], pair["female"])


def _clean_spoken_chinese_content(text: str) -> str:
    """Strips Vietnamese instruction headers, parenthetical Pinyin annotations, and fill-in blanks."""
    if not text:
        return ""
    s = str(text).strip()
    # 1. Strip Vietnamese / English question prefixes
    s = re.sub(
        r"^(?:Câu|Bài|Question|Part|Phần)\s*\d+\s*[:：.\-)\]]\s*",
        "",
        s,
        flags=re.IGNORECASE,
    )
    s = re.sub(
        r"^(?:Đọc|Nghe)\s+(?:đoạn\s+)?(?:hội\s+thoại|câu|đoạn\s+văn)(?:\s+sau)?(?:\s+và\s+trả\s+lời(?:\s+câu\s+hỏi)?)?\s*[:：]?\s*",
        "",
        s,
        flags=re.IGNORECASE,
    )
    # 2. If Chinese characters are present, strip parenthetical Pinyin/Latin annotations e.g. (Wáng lǎoshī, nín hǎo!)
    if re.search(r"[\u4e00-\u9fff]", s):
        s = re.sub(r"\([^()\u4e00-\u9fff]*\)", " ", s)
        s = re.sub(r"（[^（）\u4e00-\u9fff]*）", " ", s)
    # 3. Replace fill-in-the-blank underscores with natural pause
    s = re.sub(r"_{2,}|\(\s*\)|（\s*）", "，", s)
    s = re.sub(r"\s{2,}", " ", s).strip()
    return s


def parse_dialogue_segments(
    raw_text: str,
    default_voice: str = DEFAULT_VOICE,
    voice_male: str | None = None,
    voice_female: str | None = None,
) -> Tuple[List[Tuple[str, str]], str, str]:
    """
    Parses dialogue script into (voice, spoken_text) tuples along with (male_voice, female_voice).
    Strips ALL speaker markers (男：, 女：, 爸爸：, 妈妈：, 儿子：, 老师：, A:, B:) so they are NOT spoken aloud.
    Uses male voice for male speakers and female voice for female speakers, or alternates natural voices.
    EXCLUDES the question prompt (问：... / Question:... / ★...) from audio so that only
    the dialogue/monologue is voiced, while the question is displayed on screen.
    """
    male_v, female_v = resolve_dialogue_pair(default_voice, voice_male, voice_female, seed_key=raw_text)

    if not raw_text or not str(raw_text).strip():
        return [], male_v, female_v

    clean_raw = str(raw_text).replace(r"\r\n", "\n").replace(r"\n", "\n").replace(r"\r", "\n").strip()

    # 1. Exclude question if embedded (strip everything starting at 问：/ Question: / ★)
    text_before_q = re.split(r"(?:[\r\n\s]+|^)(?:问|Question|★)\s*[:：]?", clean_raw, flags=re.IGNORECASE)[0].strip()
    if not text_before_q:
        text_before_q = clean_raw

    text_before_q = _clean_spoken_chinese_content(text_before_q)

    # 2. Normalize inline speaker boundaries (e.g. "男：... 女：..." or "妈妈说：... 爸爸：...")
    pattern = r"(?:^|[\r\n\s]+|(?<=[。？！?!]))(?=[\u4e00-\u9fa5A-Za-z0-9_]{1,8}(?:说|的说|声)?\s*[:：])"
    normalized = re.sub(pattern, "\n", text_before_q)
    lines = [l.strip() for l in normalized.splitlines() if l.strip()]

    has_dialogue = any(
        re.match(r"^[\u4e00-\u9fa5A-Za-z0-9_]{1,8}(?:说|的说|声)?\s*[:：]", line, re.IGNORECASE)
        for line in lines
    )

    if not has_dialogue:
        cleaned_single = _clean_spoken_chinese_content(text_before_q)
        return [(default_voice, cleaned_single or text_before_q)], male_v, female_v

    segments: List[Tuple[str, str]] = []
    speaker_voice_map: dict = {}
    available_voices = [male_v, female_v]

    for line in lines:
        m_speaker = re.match(r"^([\u4e00-\u9fa5A-Za-z0-9_]{1,8}(?:说|的说|声)?)\s*[:：]\s*(.*)$", line)
        if m_speaker:
            speaker_tag = m_speaker.group(1).strip()
            content = m_speaker.group(2).strip()

            # Clean any leftover speaker tags inside content
            content = re.sub(r"^[\u4e00-\u9fa5A-Za-z0-9_]{1,8}(?:说|的说|声)?\s*[:：]\s*", "", content).strip()
            content = _clean_spoken_chinese_content(content)
            if not content:
                continue

            tag_clean = re.sub(r"(?:说|的说|声)$", "", speaker_tag).strip().lower()

            if any(f in tag_clean for f in FEMALE_INDICATORS):
                voice = female_v
            elif any(m in tag_clean for m in MALE_INDICATORS):
                voice = male_v
            else:
                if speaker_tag not in speaker_voice_map:
                    voice_idx = len(speaker_voice_map) % len(available_voices)
                    speaker_voice_map[speaker_tag] = available_voices[voice_idx]
                voice = speaker_voice_map[speaker_tag]

            segments.append((voice, content))
        else:
            clean_line = _clean_spoken_chinese_content(line.strip())
            if clean_line:
                segments.append((default_voice, clean_line))

    if not segments:
        cleaned_single = _clean_spoken_chinese_content(text_before_q)
        return [(default_voice, cleaned_single or text_before_q)], male_v, female_v

    return segments, male_v, female_v


async def _synthesize(text: str, output_path: str, voice: str, intro_chime: bool = True) -> None:
    dir_name = os.path.dirname(os.path.abspath(output_path))
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    combined_chunks = []
    if intro_chime:
        chime = get_or_create_chime()
        if chime:
            combined_chunks.append(chime)

    communicator = edge_tts.Communicate(text, voice)
    async for chunk in communicator.stream():
        if chunk["type"] == "audio":
            combined_chunks.append(chunk["data"])

    with open(output_path, "wb") as f:
        for chunk in combined_chunks:
            f.write(chunk)


async def _synthesize_multi_segments(
    segments: List[Tuple[str, str]], output_path: str, intro_chime: bool = True
) -> None:
    dir_name = os.path.dirname(os.path.abspath(output_path))
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    combined_chunks = []
    if intro_chime:
        chime = get_or_create_chime()
        if chime:
            combined_chunks.append(chime)

    silence = get_or_create_silence() if len(segments) > 1 else b""

    for i, (voice, text_to_speak) in enumerate(segments):
        if i > 0 and silence:
            combined_chunks.append(silence)
        communicator = edge_tts.Communicate(text_to_speak, voice)
        async for chunk in communicator.stream():
            if chunk["type"] == "audio":
                combined_chunks.append(chunk["data"])

    with open(output_path, "wb") as f:
        for chunk in combined_chunks:
            f.write(chunk)


def generate_audio(
    text: str,
    output_path: str,
    voice: str = DEFAULT_VOICE,
    intro_chime: bool = True,
    voice_male: str | None = None,
    voice_female: str | None = None,
) -> dict:
    if not text or not str(text).strip():
        return {
            "success": False,
            "error": "Văn bản phát âm không được để trống",
            "path": output_path,
            "duration_s": 0.0,
            "voice": voice,
        }

    if len(str(text)) > 5000:
        return {
            "success": False,
            "error": "Kịch bản phát âm vượt quá độ dài tối đa 5000 ký tự.",
            "path": output_path,
            "duration_s": 0.0,
            "voice": voice,
        }

    chosen_voice = voice if (voice in VOICES or voice == "auto") else DEFAULT_VOICE
    alt_voice = FALLBACK_VOICE if chosen_voice == DEFAULT_VOICE else DEFAULT_VOICE
    used_voice = chosen_voice

    segments, male_v, female_v = parse_dialogue_segments(
        str(text),
        default_voice=DEFAULT_VOICE if chosen_voice == "auto" else chosen_voice,
        voice_male=voice_male,
        voice_female=voice_female,
    )

    try:
        if len(segments) > 1:
            asyncio.run(_synthesize_multi_segments(segments, output_path, intro_chime=intro_chime))
            used_voice = f"dialogue-multi-voice ({male_v} + {female_v})"
        else:
            voice_to_use = DEFAULT_VOICE if chosen_voice == "auto" else chosen_voice
            asyncio.run(_synthesize(segments[0][1], output_path, voice_to_use, intro_chime=intro_chime))
    except Exception as primary_err:
        try:
            asyncio.run(_synthesize(text, output_path, alt_voice, intro_chime=intro_chime))
            used_voice = alt_voice
        except Exception as fallback_err:
            return {
                "success": False,
                "error": f"Lỗi tổng hợp âm thanh: {str(primary_err)} | Dự phòng thất bại: {str(fallback_err)}",
                "path": output_path,
                "duration_s": 0.0,
                "voice": chosen_voice,
            }

    duration = 0.0
    try:
        audio = mutagen.mp3.MP3(output_path)
        duration = round(float(audio.info.length), 2)
    except Exception:
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            duration = round(size / 6000.0, 2)

    return {
        "success": True,
        "path": output_path,
        "duration_s": duration,
        "voice": used_voice,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Edge-TTS Audio Generation Service for HSK Exam QBank"
    )
    parser.add_argument("--text", required=True, help="Text to synthesize")
    parser.add_argument("--output", required=True, help="Target mp3 output path")
    parser.add_argument(
        "--voice",
        default=DEFAULT_VOICE,
        help="Voice name (default: zh-CN-XiaoxiaoNeural)",
    )
    parser.add_argument("--voice-male", default=None, help="Specific voice for male speakers")
    parser.add_argument("--voice-female", default=None, help="Specific voice for female speakers")
    parser.add_argument(
        "--intro-chime",
        dest="intro_chime",
        action="store_true",
        default=True,
        help="Include gentle 1.2s introductory chime before speech (default: True)",
    )
    parser.add_argument(
        "--no-chime",
        dest="intro_chime",
        action="store_false",
        help="Disable introductory chime",
    )

    args = parser.parse_args()
    result = generate_audio(
        args.text,
        args.output,
        args.voice,
        intro_chime=args.intro_chime,
        voice_male=args.voice_male,
        voice_female=args.voice_female,
    )
    print(json.dumps(result, ensure_ascii=False))
    if not result.get("success"):
        sys.exit(1)


if __name__ == "__main__":
    main()
