# -*- coding: utf-8 -*-

def run():
    path = 'src/components/Coursebook/CoursebookView.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    addition = '''

  // HSK 2 - Bài 1: 她请我们吃了北京烤鸭
  'hsk2-l1-t1': {
    src: '/textbook_art/cartoon_hsk2_l1_t1.jpg',
    caption: '在机场，王一雪接到了白家月和安妮。(Ở sân bay, Vương Nhất Tuyết nồng nhiệt vẫy tay đón Bạch Gia Nguyệt và Annie).',
  },
  'hsk2-l1-t2': {
    src: '/textbook_art/cartoon_hsk2_l1_t2.jpg',
    caption: '在王一雪的车里，白家月、安妮和王一雪在聊天儿。(Trong xe của Vương Nhất Tuyết trên đường phố Bắc Kinh, mọi người vui vẻ trò chuyện).',
  },
  'hsk2-l1-t3': {
    src: '/textbook_art/cartoon_hsk2_l1_t3.jpg',
    caption: '在王一雪的车里，白家月接到了陈天中的电话。(Trong xe, Bạch Gia Nguyệt nghe điện thoại của Trần Thiên Trung báo tin đã đến Bắc Kinh).',
  },
  'hsk2-l1-t4': {
    src: '/textbook_art/cartoon_hsk2_l1_t4.jpg',
    caption: '在酒店，白家月给王一飞老师发信息。(Ở khách sạn buổi tối, Bạch Gia Nguyệt vui vẻ nhắn tin cho cô giáo kể về món vịt quay Bắc Kinh).',
  },'''

    target = "'hsk1-l15-t2'"
    idx = text.find(target)
    if idx != -1:
        # find the closing bracket of hsk1-l15-t2
        close_brace = text.find('},', idx)
        if close_brace != -1:
            insert_pos = close_brace + 2
            new_text = text[:insert_pos] + addition + text[insert_pos:]
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_text)
            print("Successfully updated CoursebookView.tsx with HSK 2 Lesson 1 illustrations!")
            return
    print("Could not find insertion position!")

if __name__ == '__main__':
    run()
