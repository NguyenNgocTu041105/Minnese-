# -*- coding: utf-8 -*-

def run():
    path = 'src/components/Coursebook/CoursebookView.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    old_entry = """  'hsk1-l3-t3': {
    src: '/textbook_art/cartoon_hsk1_l3_t1.jpg',
    caption: '在校园里，朋友互相询问国籍。(Các bạn sinh viên giao lưu làm quen và hỏi quốc tịch).',
  },"""

    new_entry = """  'hsk1-l3-t3': {
    src: '/textbook_art/cartoon_hsk1_l3_t3.jpg',
    caption: '在家里，王一雪给王一飞打视频电话。(Ở nhà buổi tối, Vương Nhất Tuyết gọi video hỏi thăm và trò chuyện thân thương cùng cô Vương Nhất Phi: "喂，一飞！我们很想你。")',
  },"""

    if old_entry in text:
        text = text.replace(old_entry, new_entry)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("Updated CoursebookView.tsx with cartoon_hsk1_l3_t3.jpg successfully!")
    else:
        # Check CRLF
        old_entry_crlf = old_entry.replace('\n', '\r\n')
        new_entry_crlf = new_entry.replace('\n', '\r\n')
        if old_entry_crlf in text:
            text = text.replace(old_entry_crlf, new_entry_crlf)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
            print("Updated CoursebookView.tsx (CRLF) successfully!")
        else:
            print("Could not find old_entry in CoursebookView.tsx")

if __name__ == '__main__':
    run()
