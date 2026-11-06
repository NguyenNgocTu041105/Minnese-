with open('src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    "'hsk1-l4-t2': {\n    src: '/textbook_art/cartoon_hsk1_l4_t1.jpg'",
    "'hsk1-l4-t2': {\n    src: '/textbook_art/cartoon_hsk1_l4_t2.jpg'"
)

with open('src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated l4_t2 in CoursebookView.tsx successfully")
