# -*- coding: utf-8 -*-
import json

with open("scripts/parsed_hsk1_texts.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Replace Lesson 1 with genuine official textbook texts
l1_texts = [
    {
        "id": "hsk1-l1-t1",
        "lesson": 1,
        "textIndex": 1,
        "title": "课文 1: 在办公室 (Trong văn phòng)",
        "context": "开学第一天，在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: 'AI小语，你好！')",
        "lines": [
            {
                "speaker": "王一飞 (Cô Vương Nhất Phi)",
                "hanzi": "AI小语，你好！",
                "pinyin": "AI Xiǎoyǔ, nǐ hǎo!",
                "vietnamese": "Chào trợ lý AI Tiểu Ngữ!"
            },
            {
                "speaker": "小语 (Trợ lý AI Tiểu Ngữ)",
                "hanzi": "王老师，你好！",
                "pinyin": "Wáng lǎoshī, nǐ hǎo!",
                "vietnamese": "Chào cô giáo Vương ạ!"
            }
        ]
    },
    {
        "id": "hsk1-l1-t2",
        "lesson": 1,
        "textIndex": 2,
        "title": "课文 2: 在课堂上 (Trong lớp học)",
        "context": "开学第一天，课堂上，学生们学习打招呼用语。(Trong lớp học, các bạn học sinh học cách chào hỏi).",
        "lines": [
            {
                "speaker": "王一飞 (Cô Vương Nhất Phi)",
                "hanzi": "大家好！",
                "pinyin": "Dàjiā hǎo!",
                "vietnamese": "Chào cả lớp!"
            },
            {
                "speaker": "学生们 (Các bạn học sinh)",
                "hanzi": "老师，您好！",
                "pinyin": "Lǎoshī, nín hǎo!",
                "vietnamese": "Chúng em kính chào cô giáo ạ!"
            },
            {
                "speaker": "小语 (Trợ lý AI Tiểu Ngữ)",
                "hanzi": "你们好！",
                "pinyin": "Nǐmen hǎo!",
                "vietnamese": "Chào các bạn!"
            },
            {
                "speaker": "学生们 (Các bạn học sinh)",
                "hanzi": "你好，小语！",
                "pinyin": "Nǐ hǎo, Xiǎoyǔ!",
                "vietnamese": "Chào bạn Tiểu Ngữ!"
            }
        ]
    },
    {
        "id": "hsk1-l1-t3",
        "lesson": 1,
        "textIndex": 3,
        "title": "课文 3: 课堂致谢与告别 (Cảm ơn và Tạm biệt)",
        "context": "开学第一天，课堂上，学生们学习致谢语、告别语。(Cuối buổi học, học sinh nói lời cảm ơn và chào tạm biệt).",
        "lines": [
            {
                "speaker": "学生们 (Các bạn học sinh)",
                "hanzi": "谢谢！",
                "pinyin": "Xièxie!",
                "vietnamese": "Cảm ơn ạ!"
            },
            {
                "speaker": "小语 (Trợ lý AI Tiểu Ngữ)",
                "hanzi": "不客气！",
                "pinyin": "Bú kèqi!",
                "vietnamese": "Không có chi!"
            },
            {
                "speaker": "王一飞 (Cô Vương Nhất Phi)",
                "hanzi": "同学们，再见！",
                "pinyin": "Tóngxuémen, zàijiàn!",
                "vietnamese": "Tạm biệt các em!"
            },
            {
                "speaker": "学生们 (Các bạn học sinh)",
                "hanzi": "老师，再见！",
                "pinyin": "Lǎoshī, zàijiàn!",
                "vietnamese": "Chúng em chào cô ạ!"
            }
        ]
    }
]

# Filter out old lesson 1
filtered = [t for t in data if t["lesson"] != 1]
# Prepend new lesson 1
data = l1_texts + filtered

with open("scripts/parsed_hsk1_texts.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated scripts/parsed_hsk1_texts.json successfully.")
