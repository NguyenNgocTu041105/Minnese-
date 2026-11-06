# -*- coding: utf-8 -*-
with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Update l14-t3
old_l14_t3 = "'hsk1-l14-t3': {\n    src: '/textbook_art/cartoon_hsk1_l14_t1.jpg'"
new_l14_t3 = "'hsk1-l14-t3': {\n    src: '/textbook_art/cartoon_hsk1_l14_t3.jpg'"
text = text.replace(old_l14_t3.replace('\n', '\r\n'), new_l14_t3.replace('\n', '\r\n'))
text = text.replace(old_l14_t3, new_l14_t3)

# Update l15-t3
old_l15_t3 = "'hsk1-l15-t3': {\n    src: '/textbook_art/cartoon_hsk1_l15_t1.jpg'"
new_l15_t3 = "'hsk1-l15-t3': {\n    src: '/textbook_art/cartoon_hsk1_l15_t3.jpg'"
text = text.replace(old_l15_t3.replace('\n', '\r\n'), new_l15_t3.replace('\n', '\r\n'))
text = text.replace(old_l15_t3, new_l15_t3)

with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated l14-t3 and l15-t3 paths successfully!")
