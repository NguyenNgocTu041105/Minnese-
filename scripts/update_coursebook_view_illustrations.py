with open('src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Update Bài 1 to cartoon
c = c.replace("src: '/textbook_art/official_l1_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l1_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l1_t2.jpg'", "src: '/textbook_art/cartoon_hsk1_l1_t2.jpg'")
c = c.replace("src: '/textbook_art/official_l1_t3.jpg'", "src: '/textbook_art/cartoon_hsk1_l1_t3.jpg'")

# Update Bài 2 to cartoon and add t3
target_l2 = """  // Bài 2
  'hsk1-l2-t1': {
    src: '/textbook_art/official_l2_t1.jpg',
    caption: '在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi thăm các bạn sinh viên).',
  },
  'hsk1-l2-t2': {
    src: '/textbook_art/official_l2_t2.jpg',
    caption: '在教室里，王一飞询问陈天中的名字。(Cô giáo hỏi tên bạn sinh viên: "请问，你叫什么名字？ - 我叫陈天中。")',
  },"""

replacement_l2 = """  // Bài 2
  'hsk1-l2-t1': {
    src: '/textbook_art/cartoon_hsk1_l2_t1.jpg',
    caption: '在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi tên học sinh: "请问，你叫什么名字？ - 我叫陈天中。")',
  },
  'hsk1-l2-t2': {
    src: '/textbook_art/cartoon_hsk1_l2_t2.jpg',
    caption: '在校园里，陈天中和白家月打招呼时认错了人。(Trên sân trường, Trần Thiên Trung chào nhầm Bạch Gia Nguyệt: "对不起！ - 没关系！")',
  },
  'hsk1-l2-t3': {
    src: '/textbook_art/cartoon_hsk1_l2_t3.jpg',
    caption: '在校园里，李文和白家月第一次相遇。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau: "你好！我叫李文。 - 很高兴认识你。")',
  },"""

if target_l2 in c:
    c = c.replace(target_l2, replacement_l2)
    with open('src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated CoursebookView.tsx successfully!")
else:
    print("Target not found in CoursebookView.tsx")
