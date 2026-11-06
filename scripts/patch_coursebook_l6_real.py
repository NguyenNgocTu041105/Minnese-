# -*- coding: utf-8 -*-
with open('d:/minnese/src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """  // HSK 2 - Bài 6: 小雪，生日快乐！
  'hsk2-l6-t1': {
    src: '/textbook_art/cartoon_hsk2_l6_t1.jpg',
    caption: '在家里，刘明和王一雪在聊天儿。(Ở phòng khách ấm áp, bác sĩ Lưu Minh và Vương Nhất Tuyết bàn nhau tặng bút vẽ và đặt bánh sinh nhật thật to cho con gái).',
  },
  'hsk2-l6-t2': {
    src: '/textbook_art/cartoon_hsk2_l6_t1.jpg',
    caption: '在客厅，刘明一家人在聊天儿。(Ở phòng khách, cả nhà chúc mừng sinh nhật Lưu Tiểu Tuyết, em trai Tiểu Minh thích thú nhìn chị mở hộp bút màu mới).',
  },
  'hsk2-l6-t3': {
    src: '/textbook_art/cartoon_hsk2_l6_t1.jpg',
    caption: '在客厅，刘明一家人在给刘小雪过生日。(Bữa tiệc sinh nhật tròn 13 tuổi của Tiểu Tuyết với bánh kem, bát mì trường thọ và các món cá thịt thơm ngon).',
  },
  'hsk2-l6-t4': {
    src: '/textbook_art/cartoon_hsk2_l6_t1.jpg',
    caption: '在房间，王一雪在写日记。(Đêm muộn trong phòng ngủ, Vương Nhất Tuyết hạnh phúc viết nhật ký khi các con đã ngủ say sau một ngày trọn vẹn).',
  },"""

replacement = """  // HSK 2 - Bài 6: 小雪，生日快乐！
  'hsk2-l6-t1': {
    src: '/textbook_art/cartoon_hsk2_l6_t1.jpg',
    caption: '在家里，刘明和王一雪在聊天儿。(Ở phòng khách ấm áp, bác sĩ Lưu Minh và Vương Nhất Tuyết bàn nhau tặng bút vẽ và đặt bánh sinh nhật thật to cho con gái).',
  },
  'hsk2-l6-t2': {
    src: '/textbook_art/cartoon_hsk2_l6_t2.jpg',
    caption: '在客厅，刘明一家人在聊天儿。(Ở phòng khách, cả nhà chúc mừng sinh nhật Lưu Tiểu Tuyết, em trai Tiểu Minh háo hức nhìn chị mở hộp quà toàn bút vẽ màu mới).',
  },
  'hsk2-l6-t3': {
    src: '/textbook_art/cartoon_hsk2_l6_t3.jpg',
    caption: '在客厅，刘明一家人在给刘小雪过生日。(Bữa tiệc sinh nhật ấm cúng bên bàn ăn với bánh kem cắm nến, bát mì trường thọ dài và các món cá thịt thơm ngon).',
  },
  'hsk2-l6-t4': {
    src: '/textbook_art/cartoon_hsk2_l6_t4.jpg',
    caption: '在房间，王一雪在写日记。(Đêm muộn trong phòng ngủ bên ánh đèn bàn, Vương Nhất Tuyết hạnh phúc viết nhật ký khi hai con đã ngủ say giấc).',
  },"""

if target in text:
    new_text = text.replace(target, replacement)
    with open('d:/minnese/src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("CoursebookView.tsx updated with unique images for all 4 texts of Lesson 6!")
else:
    print("Target block not found, performing substring search...")
    p1 = text.find("// HSK 2 - Bài 6: 小雪，生日快乐！")
    p2 = text.find("};", p1)
    if p1 != -1 and p2 != -1:
        new_text = text[:p1] + replacement + "\n" + text[p2:]
        with open('d:/minnese/src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
            f.write(new_text)
        print("CoursebookView.tsx replaced via range slice!")
