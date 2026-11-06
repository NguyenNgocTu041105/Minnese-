# -*- coding: utf-8 -*-

def run():
    path = 'src/components/Coursebook/CoursebookView.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    addition = '''  'hsk1-l4-t3': {
    src: '/textbook_art/cartoon_hsk1_l4_t3.jpg',
    caption: '在街上，王一雪带着儿子偶遇杨同乐。(Trên phố, Vương Nhất Tuyết dắt con trai Lưu Tiểu Minh tình cờ gặp đồng nghiệp Dương Đồng Lạc).',
  },
'''

    target = "'hsk1-l4-t2': {"
    idx = text.find(target)
    if idx != -1:
        close_brace = text.find('},', idx)
        if close_brace != -1:
            insert_pos = close_brace + 2
            # insert on a new line
            new_text = text[:insert_pos] + '\n' + addition + text[insert_pos:]
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_text)
            print("Successfully added hsk1-l4-t3 to CoursebookView.tsx!")
            return
    print("Could not find insertion position!")

if __name__ == '__main__':
    run()
