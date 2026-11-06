# -*- coding: utf-8 -*-
with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """  'hsk2-l1-t4': {
    src: '/textbook_art/cartoon_hsk2_l1_t4.jpg',
    caption: '在酒店，白家月给王一飞老师发信息。(Ở khách sạn buổi tối, Bạch Gia Nguyệt vui vẻ nhắn tin cho cô giáo kể về món vịt quay Bắc Kinh).',
  },"""

addition = """  'hsk2-l1-t4': {
    src: '/textbook_art/cartoon_hsk2_l1_t4.jpg',
    caption: '在酒店，白家月给王一飞老师发信息。(Ở khách sạn buổi tối, Bạch Gia Nguyệt vui vẻ nhắn tin cho cô giáo kể về món vịt quay Bắc Kinh).',
  },
  // HSK 2 - Bài 2: 还是打车去北大吧
  'hsk2-l2-t1': {
    src: '/textbook_art/cartoon_hsk2_l2_t1.jpg',
    caption: '在宾馆前台，白家月和安妮向服务员咨询。(Ở quầy lễ tân khách sạn, Bạch Gia Nguyệt và Annie hỏi đường đi Đại học Bắc Kinh).',
  },
  'hsk2-l2-t2': {
    src: '/textbook_art/cartoon_hsk2_l2_t2.jpg',
    caption: '在北京大学，白家月和安妮在参观校园。(Ở Đại học Bắc Kinh, Bạch Gia Nguyệt và Annie đi dạo ngắm khuôn viên trường rộng lớn).',
  },
  'hsk2-l2-t3': {
    src: '/textbook_art/cartoon_hsk2_l2_t3.jpg',
    caption: '在北京大学，白家月和安妮在参观校园。(Ở khuôn viên trường, Annie chỉ vào rạp chiếu phim Bách Niên Kỷ Niệm Đường bên trong trường).',
  },
  'hsk2-l2-t4': {
    src: '/textbook_art/cartoon_hsk2_l2_t2.jpg',
    caption: '在北京大学门口，白家月给陈天中发信息。(Ở cổng Đại học Bắc Kinh, Bạch Gia Nguyệt gửi tin nhắn chia sẻ về ngôi trường cho Trần Thiên Trung).',
  },"""

if target in text:
    text = text.replace(target, addition)
    print("Replaced target LF")
elif target.replace('\n', '\r\n') in text:
    text = text.replace(target.replace('\n', '\r\n'), addition.replace('\n', '\r\n'))
    print("Replaced target CRLF")
else:
    print("Target not found")

with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated CoursebookView.tsx with HSK2 L2 illustrations!")
