with open("src/components/Coursebook/CoursebookView.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_illustrations = """const LESSON_ILLUSTRATIONS: Record<string, { src: string; caption: string }> = {
  'hsk1-l1-t1': {
    src: '/hsk1_lesson1_proper.jpg',
    caption: 'Trong lớp học: Hai người bạn học chào nhau vui vẻ bằng câu "你好！"',
  },
  'hsk1-l1-t2': {
    src: '/hsk1_lesson1_t2_proper.jpg',
    caption: 'Trong văn phòng: Học sinh cúi chào lễ phép "老师，您好！", cô giáo mỉm cười đáp "你们好！"',
  },
};"""

new_illustrations = """const LESSON_ILLUSTRATIONS: Record<string, { src: string; caption: string }> = {
  'hsk1-l1-t1': {
    src: '/textbook_art/official_l1_t1.jpg',
    caption: '开学第一天，在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: "AI小语，你好！")',
  },
  'hsk1-l1-t2': {
    src: '/textbook_art/official_l1_t2.jpg',
    caption: '开学第一天，课堂上，学生们向老师问好。(Trong lớp học, các bạn sinh viên chào cô giáo: "老师，您好！")',
  },
  'hsk1-l2-t1': {
    src: '/textbook_art/official_l2_t1.jpg',
    caption: '在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi thăm các bạn sinh viên).',
  },
  'hsk1-l2-t2': {
    src: '/textbook_art/official_l2_t2.jpg',
    caption: '在教室里，王一飞询问陈天中的名字。(Cô giáo hỏi tên bạn sinh viên: "请问，你叫什么名字？ - 我叫陈天中。")',
  },
  'hsk1-l3-t1': {
    src: '/textbook_art/official_l3_t1.jpg',
    caption: '在校园里，李文和白家月第一次相遇，两人继续聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt uống trà trò chuyện: "我是中国人。- 我是法国人。")',
  },
};"""

if old_illustrations in text:
    text = text.replace(old_illustrations, new_illustrations)
    with open("src/components/Coursebook/CoursebookView.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated LESSON_ILLUSTRATIONS successfully")
else:
    # Try normalized newlines
    normalized_text = text.replace("\r\n", "\n")
    if old_illustrations.replace("\r\n", "\n") in normalized_text:
        normalized_text = normalized_text.replace(old_illustrations.replace("\r\n", "\n"), new_illustrations)
        with open("src/components/Coursebook/CoursebookView.tsx", "w", encoding="utf-8") as f:
            f.write(normalized_text)
        print("Updated LESSON_ILLUSTRATIONS (normalized newlines) successfully")
    else:
        print("Could not find old_illustrations block")
