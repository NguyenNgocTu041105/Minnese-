import fitz

doc = fitz.open(r'D:\giáo trình hsk\新HSK1教程3.0.pdf')

# In HSK1, book page 1 was PDF page 14 (index 14).
# Book page p corresponds to PDF index p + 13 or 14.
# Let's map each lesson's start page:
lesson_pages = {
    1: 1,
    2: 5,
    3: 10,
    4: 18,
    5: 27,
    6: 35,
    7: 45,
    8: 54,
    9: 61,
    10: 70,
    11: 78,
    12: 86,
    13: 95,
    14: 103,
    15: 112
}

for lnum, bpage in lesson_pages.items():
    pdf_idx = bpage + 14  # book page 27 was pdf index 41 (27 + 14 = 41)
    pix = doc[pdf_idx].get_pixmap(dpi=130)
    pix.save(f'scratch/hsk1_l{lnum}_intro.png')
    print(f'Lesson {lnum} (Book p.{bpage}, PDF idx {pdf_idx}) rendered.')
