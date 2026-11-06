# -*- coding: utf-8 -*-
with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """  'hsk2-l3-t4': {
    src: '/textbook_art/cartoon_hsk2_l3_t4.jpg',
    caption: '在家里，王一雪给好朋友打电话。(Ở nhà, Vương Nhất Tuyết gọi điện chia sẻ với bạn thân mong muốn chồng được nghỉ ngơi).',
  },"""

addition = """  'hsk2-l3-t4': {
    src: '/textbook_art/cartoon_hsk2_l3_t4.jpg',
    caption: '在家里，王一雪给好朋友打电话。(Ở nhà, Vương Nhất Tuyết gọi điện chia sẻ với bạn thân mong muốn chồng được nghỉ ngơi).',
  },
  // HSK 2 - Bài 4: 你穿红色的很好看
  'hsk2-l4-t1': {
    src: '/textbook_art/cartoon_hsk2_l4_t1.jpg',
    caption: '在商场门口，王一雪和刘小雪在聊天儿。(Ở cửa trung tâm thương mại mới mở, Vương Nhất Tuyết và con gái Lưu Tiểu Tuyết trò chuyện).',
  },
  'hsk2-l4-t2': {
    src: '/textbook_art/cartoon_hsk2_l4_t2.jpg',
    caption: '在商场，王一雪和刘小雪在看衣服。(Ở tiệm quần áo, mẹ khuyên Tiểu Tuyết thử chiếc quần màu đỏ tươi tắn).',
  },
  'hsk2-l4-t3': {
    src: '/textbook_art/cartoon_hsk2_l4_t3.jpg',
    caption: '在商场，王一雪和刘小雪在看书包。(Ở quầy cặp sách, Tiểu Tuyết chọn chiếc ba lô màu xanh lá cây ưng ý).',
  },
  'hsk2-l4-t4': {
    src: '/textbook_art/cartoon_hsk2_l4_t2.jpg',
    caption: '在房间，刘小雪在写日记。(Trong phòng, Lưu Tiểu Tuyết viết nhật ký kể về trải nghiệm mặc quần màu đỏ rất đẹp).',
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

print("Updated CoursebookView.tsx with HSK2 L4 illustrations!")
