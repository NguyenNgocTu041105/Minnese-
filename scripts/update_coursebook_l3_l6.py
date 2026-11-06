with open('src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Update Lesson 3, 4, 5, 6
c = c.replace("src: '/textbook_art/official_l3_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l3_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l3_t2.jpg'", "src: '/textbook_art/cartoon_hsk1_l3_t2.jpg'")
c = c.replace("src: '/textbook_art/official_l4_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l4_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l5_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l5_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l6_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l6_t1.jpg'")

with open('src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated CoursebookView.tsx with Lessons 3-6 cartoon illustrations!")
