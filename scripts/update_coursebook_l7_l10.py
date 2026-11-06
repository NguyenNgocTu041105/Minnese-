with open('src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("src: '/textbook_art/official_l7_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l7_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l8_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l8_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l9_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l9_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l10_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l10_t1.jpg'")

with open('src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated CoursebookView.tsx with Lessons 7-10 cartoon illustrations!")
