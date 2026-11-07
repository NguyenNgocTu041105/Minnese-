import fitz

doc = fitz.open(r'D:\giáo trình hsk\新HSK1教程3.0.pdf')

# Let's inspect pages for Lesson 5: Book p.27 to 34 (PDF 41 to 48)
for p in range(41, 49):
    pix = doc[p].get_pixmap(dpi=120)
    pix.save(f'scratch/hsk1_l5_p{p}.png')
print('Rendered lesson 5 pages')
