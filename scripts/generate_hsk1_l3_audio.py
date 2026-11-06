# -*- coding: utf-8 -*-
import asyncio
import os
import edge_tts
import mutagen.mp3
import json

OUTPUT_DIR = os.path.join("public", "audio", "coursebook")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE_WANG_YIFEI = "zh-CN-XiaoxiaoNeural"  # Nữ giáo viên chuẩn mực
VOICE_WANG_YIXUE = "zh-CN-XiaoxiaoNeural"  # Nữ thanh lịch
VOICE_BAI_JIAYUE = "zh-CN-XiaoyiNeural"    # Nữ du học sinh Pháp
VOICE_ANNIE = "zh-CN-XiaoyiNeural"         # Nữ du học sinh Canada
VOICE_LI_WEN = "zh-CN-YunxiNeural"         # Nam sinh y khoa
VOICE_CHEN_TIANZHONG = "zh-CN-YunxiaNeural"# Nam sinh Thái Lan

hsk1_l3_texts = [
    {
        "id": "hsk1-l3-t1",
        "lesson": 3,
        "textIndex": 1,
        "title": "课文 1: 在校园里 (Trên sân trường)",
        "context": "在校园里，李文和白家月第一次相遇，两人继续聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau, hai người tiếp tục trò chuyện).",
        "lines": [
            {
                "speaker": "李文",
                "speakerName": "李文 (Lý Văn)",
                "gender": "male",
                "avatar": "👨‍⚕️",
                "persona": "Lý Văn (Vân Hy - Nam sinh y khoa)",
                "voice": VOICE_LI_WEN,
                "hanzi": "我是中国人。",
                "pinyin": "Wǒ shì Zhōngguó rén.",
                "vietnamese": "Tôi là người Trung Quốc."
            },
            {
                "speaker": "白家月",
                "speakerName": "白家月 (Bạch Gia Nguyệt)",
                "gender": "female",
                "avatar": "👱‍♀️",
                "persona": "Bạch Gia Nguyệt (Hiểu Y - Du học sinh Pháp)",
                "voice": VOICE_BAI_JIAYUE,
                "hanzi": "我是法国人。我的中文老师也是中国人。",
                "pinyin": "Wǒ shì Fǎguó rén. Wǒ de Zhōngwén lǎoshī yě shì Zhōngguó rén.",
                "vietnamese": "Tôi là người Pháp. Giáo viên tiếng Trung của tôi cũng là người Trung Quốc."
            }
        ]
    },
    {
        "id": "hsk1-l3-t2",
        "lesson": 3,
        "textIndex": 2,
        "title": "课文 2: 在教室里 (Trong lớp học)",
        "context": "在教室里，下课后，安妮在看陈天中手机里的照片。(Trong lớp học, sau giờ học, Annie xem ảnh trên điện thoại của Trần Thiên Trung).",
        "lines": [
            {
                "speaker": "安妮",
                "speakerName": "安妮 (Annie)",
                "gender": "female",
                "avatar": "👩‍🦰",
                "persona": "Annie (Hiểu Y - Du học sinh Canada)",
                "voice": VOICE_ANNIE,
                "hanzi": "这是谁？",
                "pinyin": "Zhè shì shéi?",
                "vietnamese": "Đây là ai?"
            },
            {
                "speaker": "陈天中",
                "speakerName": "陈天中 (Trần Thiên Trung)",
                "gender": "male",
                "avatar": "👨‍🎓",
                "persona": "Trần Thiên Trung (Vân Hạ - Du học sinh Thái)",
                "voice": VOICE_CHEN_TIANZHONG,
                "hanzi": "这是我女朋友。",
                "pinyin": "Zhè shì wǒ nǚpéngyou.",
                "vietnamese": "Đây là bạn gái của tôi."
            },
            {
                "speaker": "安妮",
                "speakerName": "安妮 (Annie)",
                "gender": "female",
                "avatar": "👩‍🦰",
                "persona": "Annie (Hiểu Y - Du học sinh Canada)",
                "voice": VOICE_ANNIE,
                "hanzi": "你女朋友是哪国人？",
                "pinyin": "Nǐ nǚpéngyou shì nǎ guó rén?",
                "vietnamese": "Bạn gái của bạn là người nước nào?"
            },
            {
                "speaker": "陈天中",
                "speakerName": "陈天中 (Trần Thiên Trung)",
                "gender": "male",
                "avatar": "👨‍🎓",
                "persona": "Trần Thiên Trung (Vân Hạ - Du học sinh Thái)",
                "voice": VOICE_CHEN_TIANZHONG,
                "hanzi": "她也是泰国人。",
                "pinyin": "Tā yě shì Tàiguó rén.",
                "vietnamese": "Cô ấy cũng là người Thái Lan."
            }
        ]
    },
    {
        "id": "hsk1-l3-t3",
        "lesson": 3,
        "textIndex": 3,
        "title": "课文 3: 在家里 (Ở nhà)",
        "context": "在家里，王一雪给王一飞打视频电话。(Ở nhà, Vương Nhất Tuyết gọi điện thoại video cho cô giáo Vương Nhất Phi).",
        "lines": [
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Vương Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "喂，一飞！",
                "pinyin": "Wèi, Yīfēi!",
                "vietnamese": "A lô, Nhất Phi à!"
            },
            {
                "speaker": "王一飞",
                "speakerName": "王一飞 (Cô Vương Nhất Phi)",
                "gender": "female",
                "avatar": "👩‍🏫",
                "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ HSK chuẩn)",
                "voice": VOICE_WANG_YIFEI,
                "hanzi": "姐姐！",
                "pinyin": "Jiějie!",
                "vietnamese": "Chị gái!"
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Vương Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "你工作还忙吗？",
                "pinyin": "Nǐ gōngzuò hái máng ma?",
                "vietnamese": "Công việc của em còn bận không?"
            },
            {
                "speaker": "王一飞",
                "speakerName": "王一飞 (Cô Vương Nhất Phi)",
                "gender": "female",
                "avatar": "👩‍🏫",
                "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ HSK chuẩn)",
                "voice": VOICE_WANG_YIFEI,
                "hanzi": "对，还很忙。你也很忙吗？",
                "pinyin": "Duì, hái hěn máng. Nǐ yě hěn máng ma?",
                "vietnamese": "Vâng, vẫn bận lắm ạ. Chị cũng bận lắm ạ?"
            },
            {
                "speaker": "王一雪",
                "speakerName": "王一雪 (Vương Nhất Tuyết)",
                "gender": "female",
                "avatar": "👩‍💼",
                "persona": "Vương Nhất Tuyết (Hiểu Hiểu - Chị gái Vương Nhất Phi)",
                "voice": VOICE_WANG_YIXUE,
                "hanzi": "我不太忙。我们很想你。",
                "pinyin": "Wǒ bú tài máng. Wǒmen hěn xiǎng nǐ.",
                "vietnamese": "Chị không bận lắm. Cả nhà nhớ em lắm đấy."
            },
            {
                "speaker": "王一飞",
                "speakerName": "王一飞 (Cô Vương Nhất Phi)",
                "gender": "female",
                "avatar": "👩‍🏫",
                "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ HSK chuẩn)",
                "voice": VOICE_WANG_YIFEI,
                "hanzi": "我也很想你们。",
                "pinyin": "Wǒ yě hěn xiǎng nǐmen.",
                "vietnamese": "Em cũng rất nhớ mọi người ạ."
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
    for item in hsk1_l3_texts:
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

    with open("scratch/hsk1_l3_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest_entries, f, ensure_ascii=False, indent=2)
    print("Generated HSK 1 Lesson 3 audio successfully!")

if __name__ == "__main__":
    asyncio.run(run())
