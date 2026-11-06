"""Generate character-cast coursebook audio for HSK1 lessons 5-15 and merge it
into src/data/coursebookAudioManifest.(json|ts).

The source texts label speakers only as A/B, which produced generic male/female
voices. Here every line is cast to the character shown in that text's illustration,
using the same voices as lessons 1-4 (Yunxi = Li Wen / Liu Ming, Yunxia = Chen
Tianzhong / Yang Tongle, Xiaoxiao = Wang Yixue / Wang Yifei, Xiaoyi = Bai Jiayue / Annie).
"""
import asyncio
import json
import os
import sys

import edge_tts
import mutagen.mp3

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUT = os.path.join("public", "audio", "coursebook")
RATE = "-8%"

# name -> (display, gender, avatar, voice, pitch, rate-offset, persona)
CHARS = {
    "annie": ("安妮 (Annie)", "female", "👩‍🦰", "zh-CN-XiaoyiNeural", "+0Hz", RATE, "Annie (Hiểu Y - Du học sinh Canada)"),
    "bai": ("白家月 (Bạch Gia Nguyệt)", "female", "👱‍♀️", "zh-CN-XiaoyiNeural", "+0Hz", RATE, "Bạch Gia Nguyệt (Hiểu Y - Du học sinh Pháp)"),
    "chen": ("陈天中 (Trần Thiên Trung)", "male", "👨‍🎓", "zh-CN-YunxiaNeural", "+0Hz", RATE, "Trần Thiên Trung (Vân Hạ - Du học sinh Thái)"),
    "liwen": ("李文 (Lý Văn)", "male", "👨‍⚕️", "zh-CN-YunxiNeural", "+0Hz", RATE, "Lý Văn (Vân Hy - Nam sinh y khoa)"),
    "liuming": ("刘明 (Lưu Minh)", "male", "👨", "zh-CN-YunxiNeural", "-15Hz", RATE, "Lưu Minh (Vân Hy - Bác sĩ, giọng trầm)"),
    "yixue": ("王一雪 (Vương Nhất Tuyết)", "female", "👩", "zh-CN-XiaoxiaoNeural", "+0Hz", RATE, "Vương Nhất Tuyết (Hiểu Hiểu)"),
    "yifei": ("王一飞 (Cô Vương Nhất Phi)", "female", "👩‍🏫", "zh-CN-XiaoxiaoNeural", "-5Hz", RATE, "Cô Vương Nhất Phi (Hiểu Hiểu - Cô giáo)"),
    "tongle": ("杨同乐 (Dương Đồng Lạc)", "male", "🧑‍💼", "zh-CN-YunxiaNeural", "+0Hz", RATE, "Dương Đồng Lạc (Vân Hạ)"),
    "xiaoming": ("刘小明 (Bé Tiểu Minh)", "male", "👦", "zh-CN-YunxiaNeural", "+35Hz", "-3%", "Bé Lưu Tiểu Minh (Vân Hạ nâng cao giọng - trẻ em)"),
    "elder": ("老奶奶 (Bà cụ)", "female", "👵", "zh-CN-XiaoxiaoNeural", "-25Hz", "-15%", "Bà cụ (Hiểu Hiểu giọng trầm, chậm)"),
    "waitress": ("服务员 (Phục vụ nhà hàng)", "female", "🧑‍🍳", "zh-CN-XiaoyiNeural", "+10Hz", "-5%", "Nhân viên phục vụ (Hiểu Y, niềm nở)"),
    "shop": ("售货员 (Nhân viên bán hàng)", "male", "🧑‍💼", "zh-CN-YunjianNeural", "+0Hz", "-5%", "Nhân viên bán hàng (Vân Kiện)"),
}

# text id -> character per line (following the characters in the illustration)
CAST = {
    "hsk1-l5-t1": ["annie", "chen"],
    "hsk1-l5-t2": ["yixue"],
    "hsk1-l5-t3": ["annie"],
    "hsk1-l6-t1": ["liwen", "bai"],
    "hsk1-l6-t2": ["yixue", "liuming", "yixue", "liuming"],
    "hsk1-l6-t3": ["yifei", "chen", "yifei", "chen"],
    "hsk1-l7-t1": ["chen", "bai", "chen", "bai"],
    "hsk1-l7-t2": ["annie", "annie", "bai"],
    "hsk1-l8-t1": ["waitress", "bai", "waitress", "bai"],
    "hsk1-l8-t2": ["annie", "shop", "annie", "shop"],
    "hsk1-l9-t1": ["xiaoming", "yixue", "xiaoming", "yixue"],
    "hsk1-l9-t2": ["elder", "yifei", "elder"],
    "hsk1-l10-t1": ["annie", "chen", "annie", "chen", "annie", "chen"],
    "hsk1-l11-t1": ["bai", "liwen", "bai"],
    "hsk1-l11-t2": ["xiaoming", "yixue", "xiaoming", "yixue"],
    "hsk1-l12-t1": ["annie", "liwen", "annie", "liwen"],
    "hsk1-l12-t2": ["yixue", "tongle", "yixue", "tongle"],
    "hsk1-l13-t1": ["liwen", "bai", "liwen", "bai"],
    "hsk1-l14-t1": ["annie", "chen", "annie", "chen"],
    "hsk1-l14-t2": ["annie", "chen", "annie", "chen"],
    "hsk1-l15-t1": ["yixue", "annie", "yixue", "annie"],
    "hsk1-l15-t2": ["yixue", "liuming", "yixue", "liuming"],
}


async def synth(text, voice, pitch, rate):
    chunks = []
    async for c in edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).stream():
        if c["type"] == "audio":
            chunks.append(c["data"])
    return b"".join(chunks)


def dur(path):
    return round(float(mutagen.mp3.MP3(path).info.length), 2)


async def main():
    texts = json.load(open("scripts/parsed_hsk1_texts.json", encoding="utf-8"))
    silence = open(os.path.join("public", "audio", "silence_04.mp3"), "rb").read()
    new = {}
    for item in texts:
        tid = item["id"]
        if tid not in CAST:
            continue
        cast = CAST[tid]
        assert len(cast) == len(item["lines"]), tid
        lines, timings, full, t = [], [], [], 0.0
        for i, (line, key) in enumerate(zip(item["lines"], cast)):
            name, gender, avatar, voice, pitch, rate, persona = CHARS[key]
            data = await synth(line["hanzi"], voice, pitch, rate)
            p = os.path.join(OUT, f"{tid}_line{i}.mp3")
            open(p, "wb").write(data)
            d = dur(p)
            full += [data] + ([silence] if i < len(cast) - 1 else [])
            timings.append({"lineIndex": i, "start": round(t, 2), "end": round(t + d, 2), "duration": d})
            t += d + 0.40
            lines.append({
                "lineIndex": i, "speaker": name, "speakerName": name, "gender": gender,
                "avatar": avatar, "persona": persona, "voice": voice,
                "audioUrl": f"/audio/coursebook/{tid}_line{i}.mp3", "duration": d,
                "hanzi": line["hanzi"], "pinyin": line["pinyin"], "vietnamese": line["vietnamese"],
            })
            print(tid, i, key, line["hanzi"])
        fp = os.path.join(OUT, f"{tid}_full.mp3")
        open(fp, "wb").write(b"".join(full))
        new[tid] = {
            "id": tid, "lesson": item["lesson"], "textIndex": item["textIndex"],
            "title": item["title"], "context": item["context"],
            "fullAudioUrl": f"/audio/coursebook/{tid}_full.mp3", "totalDuration": dur(fp),
            "lineTimings": timings, "lines": lines,
        }

    # merge into TS manifest (source of truth used by the app) and JSON
    ts_path = "src/data/coursebookAudioManifest.ts"
    s = open(ts_path, encoding="utf-8").read()
    i = s.index("= {", s.index("COURSEBOOK_AUDIO_MANIFEST")) + 2
    j = s.rindex("}") + 1
    manifest = json.loads(s[i:j])
    manifest.update(new)
    open(ts_path, "w", encoding="utf-8").write(
        s[:i] + json.dumps(manifest, ensure_ascii=False, indent=2) + s[j:])
    json_path = "src/data/coursebookAudioManifest.json"
    jm = json.load(open(json_path, encoding="utf-8"))
    jm.update(new)
    json.dump(jm, open(json_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("merged", len(new))


asyncio.run(main())
