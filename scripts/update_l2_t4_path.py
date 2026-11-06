# -*- coding: utf-8 -*-
with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_s = "'hsk2-l2-t4': {\n    src: '/textbook_art/cartoon_hsk2_l2_t2.jpg'"
new_s = "'hsk2-l2-t4': {\n    src: '/textbook_art/cartoon_hsk2_l2_t4.jpg'"

text = text.replace(old_s.replace('\n', '\r\n'), new_s.replace('\n', '\r\n'))
text = text.replace(old_s, new_s)

with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated l2-t4 path successfully!")
