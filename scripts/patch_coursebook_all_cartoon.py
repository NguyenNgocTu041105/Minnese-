with open('src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace all remaining official_l11..l15 references with cartoon_hsk1_l*.jpg
c = c.replace("src: '/textbook_art/official_l11_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l11_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l12_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l12_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l13_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l13_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l14_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l14_t1.jpg'")
c = c.replace("src: '/textbook_art/official_l15_t1.jpg'", "src: '/textbook_art/cartoon_hsk1_l15_t1.jpg'")

with open('src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated CoursebookView.tsx with all 15 cartoon illustrations!")
