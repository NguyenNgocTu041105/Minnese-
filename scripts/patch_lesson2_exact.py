# -*- coding: utf-8 -*-
with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False

for i, line in enumerate(lines):
    if 'id: "hsk1-l2-t1"' in line:
        skip = True
        new_lines.append('''      {
        id: "hsk1-l2-t1",
        title: "课文 1: 在教室里 (Trong lớp học)",
        context: "在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi tên học sinh).",
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "请问，你叫什么名字？", pinyin: "Qǐngwèn, nǐ jiào shénme míngzi?", vietnamese: "Xin hỏi, em tên là gì?" },
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "我叫陈天中。", pinyin: "Wǒ jiào Chén Tiānzhōng.", vietnamese: "Em tên là Trần Thiên Trung ạ." }
        ]
      },
      {
        id: "hsk1-l2-t2",
        title: "课文 2: 在校园里 (Trên sân trường)",
        context: "在校园里，陈天中和白家月打招呼时认错了人。(Trên sân trường, Trần Thiên Trung chào nhầm Bạch Gia Nguyệt thành Annie).",
        lines: [
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "你好，安妮！", pinyin: "Nǐ hǎo, Ānnī!", vietnamese: "Chào Annie!" },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "你好，陈天中！我不是安妮，我是白家月。", pinyin: "Nǐ hǎo, Chén Tiānzhōng! Wǒ bú shì Ānnī, wǒ shì Bái Jiāyuè.", vietnamese: "Chào Trần Thiên Trung! Mình không phải Annie, mình là Bạch Gia Nguyệt." },
          { speaker: "陈天中 (Trần Thiên Trung)", avatar: "👨‍🎓", hanzi: "对不起！", pinyin: "Duìbuqǐ!", vietnamese: "Xin lỗi bạn nhé!" },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "没关系！", pinyin: "Méi guānxi!", vietnamese: "Không sao đâu!" }
        ]
      },
      {
        id: "hsk1-l2-t3",
        title: "课文 3: 初次相遇 (Lần đầu gặp mặt)",
        context: "在校园里，李文和白家月第一次相遇。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau).",
        lines: [
          { speaker: "李文 (Lý Văn)", avatar: "👨‍🎓", hanzi: "你好！我叫李文。", pinyin: "Nǐ hǎo! Wǒ jiào Lǐ Wén.", vietnamese: "Chào bạn! Tôi tên là Lý Văn." },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "你好！我叫白家月。", pinyin: "Nǐ hǎo! Wǒ jiào Bái Jiāyuè.", vietnamese: "Chào bạn! Tôi tên là Bạch Gia Nguyệt." },
          { speaker: "李文 (Lý Văn)", avatar: "👨‍🎓", hanzi: "很高兴认识你。", pinyin: "Hěn gāoxìng rènshi nǐ.", vietnamese: "Rất vui được làm quen với bạn." },
          { speaker: "白家月 (Bạch Gia Nguyệt)", avatar: "👩", hanzi: "认识你我也很高兴。", pinyin: "Rènshi nǐ wǒ yě hěn gāoxìng.", vietnamese: "Tôi cũng rất vui được làm quen với bạn." }
        ]
      }
    ],
''')
    elif skip and 'grammarPoints:' in line:
        skip = False
        new_lines.append(line)
    elif not skip:
        # Also update Lesson 2 title if needed
        if 'titleHanzi: "谢谢你"' in line:
            new_lines.append('    titleHanzi: "我叫李文",\n')
        elif 'titlePinyin: "Xièxie nǐ"' in line:
            new_lines.append('    titlePinyin: "Wǒ jiào Lǐ Wén",\n')
        elif 'titleVietnamese: "Cảm ơn bạn"' in line:
            new_lines.append('    titleVietnamese: "Tên tôi là Lý Văn",\n')
        else:
            new_lines.append(line)

with open('src/data/newHsk1BookData.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Patched Lesson 2 in newHsk1BookData.ts successfully.")
