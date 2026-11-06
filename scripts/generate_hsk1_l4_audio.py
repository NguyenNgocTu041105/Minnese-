# -*- coding: utf-8 -*-
import asyncio
import os
import edge_tts
import mutagen.mp3
import json

OUTPUT_DIR = os.path.join("public", "audio", "coursebook")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE_LIU_MING = "zh-CN-YunxiNeural"      # Bác sĩ Lưu Minh (nam trầm ấm 40s)
VOICE_WANG_YIXUE = "zh-CN-XiaoxiaoNeural"  # Vương Nhất Tuyết (nữ 30s)
VOICE_YANG_TONGLE = "zh-CN-YunxiaNeural"   # Dương Đồng Lạc (nam 20s)

hsk1_l4_texts = [
    {
        "id": "hsk1-l4-t1",
        "lesson": 4,
        "textIndex": 1,
        "title": "课文 1: 在家里 (Ở nhà)",
        "context": "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
        "lines": [
            {
                "speaker": "刘明",
                "speakerName": "刘明 (Bác sĩ Lưu Minh)",
                "gender": "male",
                "avatar": "👨‍⚕️",
                "persona": "Lưu Minh (Vân Hy - Bác sĩ, chồng Nhất Tuyết)",
                "voice": VOICE_LIU_MING,
                "hanzi": "一飞忙吗？",
                "pinyin": "Yīfēi máng ma?",
                "vietnamese": "Nhất Phi có bận không?"
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "她很忙。",
                "pinyin": "Tā hěn máng.",
                "vietnamese": "Em ấy rất bận."
            },
            {
                "speaker": "刘明",
                "speakerName": "刘明 (Bác sĩ Lưu Minh)",
                "gender": "male",
                "avatar": "👨‍⚕️",
                "persona": "Lưu Minh (Vân Hy - Bác sĩ, chồng Nhất Tuyết)",
                "voice": VOICE_LIU_MING,
                "hanzi": "她有多少个学生？",
                "pinyin": "Tā yǒu duōshao gè xuésheng?",
                "vietnamese": "Em ấy có bao nhiêu học sinh?"
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "她有二十个学生。",
                "pinyin": "Tā yǒu èrshí gè xuésheng.",
                "vietnamese": "Em ấy có hai mươi học sinh."
            }
        ]
    },
    {
        "id": "hsk1-l4-t2",
        "lesson": 4,
        "textIndex": 2,
        "title": "课文 2: 在公司里 (Ở công ty)",
        "context": "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Lạc nghỉ giải lao trò chuyện).",
        "lines": [
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "我有两个哥哥，你呢？",
                "pinyin": "Wǒ yǒu liǎng gè gēge, nǐ ne?",
                "vietnamese": "Chị có hai người anh trai, còn em thì sao?"
            },
            {
                "speaker": "杨同乐",
                "speakerName": "杨同乐 (Dương Đồng Lạc)",
                "gender": "male",
                "avatar": "👨‍💼",
                "persona": "Dương Đồng Lạc (Vân Hạ - Đồng nghiệp công ty)",
                "voice": VOICE_YANG_TONGLE,
                "hanzi": "我没有哥哥。",
                "pinyin": "Wǒ méiyǒu gēge.",
                "vietnamese": "Em không có anh trai."
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "你家有几口人？",
                "pinyin": "Nǐ jiā yǒu jǐ kǒu rén?",
                "vietnamese": "Nhà em có mấy người?"
            },
            {
                "speaker": "杨同乐",
                "speakerName": "杨同乐 (Dương Đồng Lạc)",
                "gender": "male",
                "avatar": "👨‍💼",
                "persona": "Dương Đồng Lạc (Vân Hạ - Đồng nghiệp công ty)",
                "voice": VOICE_YANG_TONGLE,
                "hanzi": "我家有四口人，爸爸、妈妈、妹妹和我。",
                "pinyin": "Wǒ jiā yǒu sì kǒu rén, bàba, māma, mèimei hé wǒ.",
                "vietnamese": "Nhà em có bốn người: bố, mẹ, em gái và em."
            }
        ]
    },
    {
        "id": "hsk1-l4-t3",
        "lesson": 4,
        "textIndex": 3,
        "title": "课文 3: 在街上 (Trên đường phố)",
        "context": "在街上，王一雪带着儿子偶遇杨同乐。(Trên đường, Vương Nhất Tuyết dắt con trai tình cờ gặp Dương Đồng Lạc).",
        "lines": [
            {
                "speaker": "杨同乐",
                "speakerName": "杨同乐 (Dương Đồng Lạc)",
                "gender": "male",
                "avatar": "👨‍💼",
                "persona": "Dương Đồng Lạc (Vân Hạ - Đồng nghiệp công ty)",
                "voice": VOICE_YANG_TONGLE,
                "hanzi": "这是您儿子吗？",
                "pinyin": "Zhè shì nín érzi ma?",
                "vietnamese": "Đây là con trai chị phải không ạ?"
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "是的。我有两个孩子，一个儿子，一个女儿。",
                "pinyin": "Shì de. Wǒ yǒu liǎng gè háizi, yí gè érzi, yí gè nǚ'ér.",
                "vietnamese": "Đúng vậy. Chị có hai đứa con, một con trai, một con gái."
            },
            {
                "speaker": "杨同乐",
                "speakerName": "杨同乐 (Dương Đồng Lạc)",
                "gender": "male",
                "avatar": "👨‍💼",
                "persona": "Dương Đồng Lạc (Vân Hạ - Đồng nghiệp công ty)",
                "voice": VOICE_YANG_TONGLE,
                "hanzi": "您儿子几岁？",
                "pinyin": "Nín érzi jǐ suì?",
                "vietnamese": "Cháu trai năm nay mấy tuổi rồi ạ?"
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "他今年五岁。",
                "pinyin": "Tā jīnnián wǔ suì.",
                "vietnamese": "Cháu năm nay năm tuổi."
            },
            {
                "speaker": "杨同乐",
                "speakerName": "杨同乐 (Dương Đồng Lạc)",
                "gender": "male",
                "avatar": "👨‍💼",
                "persona": "Dương Đồng Lạc (Vân Hạ - Đồng nghiệp công ty)",
                "voice": VOICE_YANG_TONGLE,
                "hanzi": "您女儿多大？",
                "pinyin": "Nín nǚ'ér duō dà?",
                "vietnamese": "Con gái chị bao nhiêu tuổi rồi ạ?"
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "她今年十二。",
                "pinyin": "Tā jīnnián shí'èr.",
                "vietnamese": "Cháu năm nay mười hai tuổi."
            }
        ]
    }
]

async def run():
    silence_path = os.path.join("public", "audio", "silence_04.mp3")
    silence_bytes = b""
    if os.path.exists(silence_path):
        with open(silence_path, "rb") as f:
            silence_bytes = f.read()

    manifest_entries = {}
    for item in hsk1_l4_texts:
        text_id = item["id"]
        full_path = os.path.join(OUTPUT_DIR, f"{text_id}_full.mp3")
        print(f"Generating {text_id}...")
        
        combined_chunks = []
        line_timings = []
        lines_audio = []
        current_time = 0.0

        for i, line in enumerate(item["lines"]):
            line_file = os.path.join(OUTPUT_DIR, f"{text_id}_line{i}.mp3")
            comm = edge_tts.Communicate(line["hanzi"], line["voice"], rate="-8%")
            line_chunks = []
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    line_chunks.append(chunk["data"])
            
            with open(line_file, "wb") as f:
                for c in line_chunks:
                    f.write(c)
            
            try:
                audio = mutagen.mp3.MP3(line_file)
                line_duration = round(float(audio.info.length), 2)
            except Exception:
                line_duration = round(len(line_chunks) * 0.05, 2)
            
            line_start = current_time
            line_end = line_start + line_duration
            line_timings.append({
                "lineIndex": i,
                "start": round(line_start, 2),
                "end": round(line_end, 2),
                "duration": line_duration
            })

            lines_audio.append({
                "lineIndex": i,
                "speaker": line["speaker"],
                "speakerName": line["speakerName"],
                "gender": line["gender"],
                "avatar": line["avatar"],
                "persona": line["persona"],
                "voice": line["voice"],
                "audioUrl": f"/audio/coursebook/{text_id}_line{i}.mp3",
                "duration": line_duration,
                "hanzi": line["hanzi"],
                "pinyin": line["pinyin"],
                "vietnamese": line["vietnamese"]
            })

            combined_chunks.extend(line_chunks)
            if i < len(item["lines"]) - 1:
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

        manifest_entries[text_id] = {
            "id": text_id,
            "lesson": item["lesson"],
            "textIndex": item["textIndex"],
            "title": item["title"],
            "context": item["context"],
            "fullAudioUrl": f"/audio/coursebook/{text_id}_full.mp3",
            "totalDuration": total_duration,
            "lineTimings": line_timings,
            "lines": lines_audio
        }

    with open("scratch/hsk1_l4_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest_entries, f, ensure_ascii=False, indent=2)
    print("Generated HSK 1 Lesson 4 audio successfully!")

if __name__ == "__main__":
    asyncio.run(run())
