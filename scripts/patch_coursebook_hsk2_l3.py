# -*- coding: utf-8 -*-
with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """  'hsk2-l2-t4': {
    src: '/textbook_art/cartoon_hsk2_l2_t2.jpg',
    caption: '在北京大学门口，白家月给陈天中发信息。(Ở cổng Đại học Bắc Kinh, Bạch Gia Nguyệt gửi tin nhắn chia sẻ về ngôi trường cho Trần Thiên Trung).',
  },"""

addition = """  'hsk2-l2-t4': {
    src: '/textbook_art/cartoon_hsk2_l2_t4.jpg',
    caption: '在北京大学门口，白家月给陈天中发信息。(Ở cổng Đại học Bắc Kinh, Bạch Gia Nguyệt gửi tin nhắn chia sẻ về ngôi trường cho Trần Thiên Trung).',
  },
  // HSK 2 - Bài 3: 我想去西安旅游
  'hsk2-l3-t1': {
    src: '/textbook_art/cartoon_hsk2_l3_t1.jpg',
    caption: '在家门口，刘明开门进到家里。(Ở cửa nhà, bác sĩ Lưu Minh mở cửa bước vào nhà sau ngày làm việc vất vả).',
  },
  'hsk2-l3-t2': {
    src: '/textbook_art/cartoon_hsk2_l3_t2.jpg',
    caption: '在客厅，刘明和王一雪在聊天儿。(Ở phòng khách, Lưu Minh và Vương Nhất Tuyết bàn về việc thu xếp thời gian đi du lịch).',
  },
  'hsk2-l3-t3': {
    src: '/textbook_art/cartoon_hsk2_l3_t3.jpg',
    caption: '在客厅，刘明和王一雪在聊天儿。(Lưu Minh mời vợ ăn táo đã rửa sạch, Vương Nhất Tuyết đề xuất đi du lịch Tây An).',
  },
  'hsk2-l3-t4': {
    src: '/textbook_art/cartoon_hsk2_l3_t4.jpg',
    caption: '在家里，王一雪给好朋友打电话。(Ở nhà, Vương Nhất Tuyết gọi điện chia sẻ với bạn thân mong muốn chồng được nghỉ ngơi).',
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

print("Updated CoursebookView.tsx with HSK2 L3 illustrations!")
