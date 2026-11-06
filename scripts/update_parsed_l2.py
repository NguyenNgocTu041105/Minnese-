# -*- coding: utf-8 -*-
import json

with open("scripts/parsed_hsk1_texts.json", "r", encoding="utf-8") as f:
    data = json.load(f)

l2_texts = [
    {
        "id": "hsk1-l2-t1",
        "lesson": 2,
        "textIndex": 1,
        "title": "课文 1: 在教室里 (Trong lớp học)",
        "context": "在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi tên học sinh).",
        "lines": [
            {
                "speaker": "王一飞 (Cô Vương Nhất Phi)",
                "hanzi": "请问，你叫什么名字？",
                "pinyin": "Qǐngwèn, nǐ jiào shénme míngzi?",
                "vietnamese": "Xin hỏi, em tên là gì?"
            },
            {
                "speaker": "陈天中 (Trần Thiên Trung)",
                "hanzi": "我叫陈天中。",
                "pinyin": "Wǒ jiào Chén Tiānzhōng.",
                "vietnamese": "Em tên là Trần Thiên Trung ạ."
            }
        ]
    },
    {
        "id": "hsk1-l2-t2",
        "lesson": 2,
        "textIndex": 2,
        "title": "课文 2: 在校园里 (Trên sân trường)",
        "context": "在校园里，陈天中和白家月打招呼时认错了人。(Trên sân trường, Trần Thiên Trung chào nhầm Bạch Gia Nguyệt thành Annie).",
        "lines": [
            {
                "speaker": "陈天中 (Trần Thiên Trung)",
                "hanzi": "你好，安妮！",
                "pinyin": "Nǐ hǎo, Ānnī!",
                "vietnamese": "Chào Annie!"
            },
            {
                "speaker": "白家月 (Bạch Gia Nguyệt)",
                "hanzi": "你好，陈天中！我不是安妮，我是白家月。",
                "pinyin": "Nǐ hǎo, Chén Tiānzhōng! Wǒ bú shì Ānnī, wǒ shì Bái Jiāyuè.",
                "vietnamese": "Chào Trần Thiên Trung! Mình không phải Annie, mình là Bạch Gia Nguyệt."
            },
            {
                "speaker": "陈天中 (Trần Thiên Trung)",
                "hanzi": "对不起！",
                "pinyin": "Duìbuqǐ!",
                "vietnamese": "Xin lỗi bạn nhé!"
            },
            {
                "speaker": "白家月 (Bạch Gia Nguyệt)",
                "hanzi": "没关系！",
                "pinyin": "Méi guānxi!",
                "vietnamese": "Không sao đâu!"
            }
        ]
    },
    {
        "id": "hsk1-l2-t3",
        "lesson": 2,
        "textIndex": 3,
        "title": "课文 3: 初次相遇 (Lần đầu gặp mặt)",
        "context": "在校园里，李文和白家月第一次相遇。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau).",
        "lines": [
            {
                "speaker": "李文 (Lý Văn)",
                "hanzi": "你好！我叫李文。",
                "pinyin": "Nǐ hǎo! Wǒ jiào Lǐ Wén.",
                "vietnamese": "Chào bạn! Tôi tên là Lý Văn."
            },
            {
                "speaker": "白家月 (Bạch Gia Nguyệt)",
                "hanzi": "你好！我叫白家月。",
                "pinyin": "Nǐ hǎo! Wǒ jiào Bái Jiāyuè.",
                "vietnamese": "Chào bạn! Tôi tên là Bạch Gia Nguyệt."
            },
            {
                "speaker": "李文 (Lý Văn)",
                "hanzi": "很高兴认识你。",
                "pinyin": "Hěn gāoxìng rènshi nǐ.",
                "vietnamese": "Rất vui được làm quen với bạn."
            },
            {
                "speaker": "白家月 (Bạch Gia Nguyệt)",
                "hanzi": "认识你我也很高兴。",
                "pinyin": "Rènshi nǐ wǒ yě hěn gāoxìng.",
                "vietnamese": "Tôi cũng rất vui được làm quen với bạn."
            }
        ]
    }
]

# Keep lesson 1 and lessons 3..15
new_data = [t for t in data if t["lesson"] == 1] + l2_texts + [t for t in data if t["lesson"] > 2]

with open("scripts/parsed_hsk1_texts.json", "w", encoding="utf-8") as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print("Updated Lesson 2 in parsed_hsk1_texts.json successfully.")
