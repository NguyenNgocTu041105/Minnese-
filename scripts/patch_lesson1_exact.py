# -*- coding: utf-8 -*-
with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if 'id: "hsk1-l1-t1"' in line:
        skip = True
        # Insert official Lesson 1 texts
        new_lines.append('''      {
        id: "hsk1-l1-t1",
        title: "课文 1: 在办公室 (Trong văn phòng)",
        context: "开学第一天，在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: 'AI小语，你好！')",
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "AI小语，你好！", pinyin: "AI Xiǎoyǔ, nǐ hǎo!", vietnamese: "Chào trợ lý AI Tiểu Ngữ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "王老师，你好！", pinyin: "Wáng lǎoshī, nǐ hǎo!", vietnamese: "Chào cô giáo Vương ạ!" }
        ]
      },
      {
        id: "hsk1-l1-t2",
        title: "课文 2: 在课堂上 (Trong lớp học)",
        context: "开学第一天，课堂上，学生们学习打招呼用语。(Trong lớp học, các bạn học sinh học cách chào hỏi).",
        lines: [
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "大家好！", pinyin: "Dàjiā hǎo!", vietnamese: "Chào cả lớp!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "老师，您好！", pinyin: "Lǎoshī, nín hǎo!", vietnamese: "Chúng em kính chào cô giáo ạ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "你们好！", pinyin: "Nǐmen hǎo!", vietnamese: "Chào các bạn!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "你好，小语！", pinyin: "Nǐ hǎo, Xiǎoyǔ!", vietnamese: "Chào bạn Tiểu Ngữ!" }
        ]
      },
      {
        id: "hsk1-l1-t3",
        title: "课文 3: 课堂致谢与告别 (Cảm ơn và Tạm biệt)",
        context: "开学第一天，课堂上，学生们学习致谢语、告别语。(Cuối buổi học, học sinh nói lời cảm ơn và chào tạm biệt).",
        lines: [
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "谢谢！", pinyin: "Xièxie!", vietnamese: "Cảm ơn ạ!" },
          { speaker: "小语 (Trợ lý AI Tiểu Ngữ)", avatar: "🤖", hanzi: "不客气！", pinyin: "Bú kèqi!", vietnamese: "Không có chi!" },
          { speaker: "王一飞 (Cô Vương Nhất Phi)", avatar: "👩‍🏫", hanzi: "同学们，再见！", pinyin: "Tóngxuémen, zàijiàn!", vietnamese: "Tạm biệt các em!" },
          { speaker: "学生们 (Các bạn học sinh)", avatar: "👨‍🎓", hanzi: "老师，再见！", pinyin: "Lǎoshī, zàijiàn!", vietnamese: "Chúng em chào cô ạ!" }
        ]
      }
''')
    elif skip and 'grammarPoints:' in line:
        skip = False
        new_lines.append(line)
    elif not skip:
        new_lines.append(line)

with open('src/data/newHsk1BookData.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated Lesson 1 texts in newHsk1BookData.ts successfully.")
