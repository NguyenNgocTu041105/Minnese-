import sys
import os
import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

os.makedirs("public/textbook_art", exist_ok=True)
doc = pymupdf.open(r"D:\giáo trình hsk\新HSK1教程3.0.pdf")

# Page 16 (0-based index 15) contains Lesson 1 Text 1
page16 = doc[15]
# Let's inspect page rect
rect = page16.rect
print(f"Page rect: {rect.width} x {rect.height}")

# The image is on the right side in the middle of page 16
# Let's render at 200 dpi (zoom = 200/72 = 2.77)
mat = pymupdf.Matrix(2.5, 2.5)
pix = page16.get_pixmap(matrix=mat)
pix.save("scratch/page16_hires.jpg")
print(f"Hires size: {pix.width} x {pix.height}")

# Page 17 (Lesson 1 Text 2): Illustration is at the top/middle right
page17 = doc[16]
pix17 = page17.get_pixmap(matrix=mat)
pix17.save("scratch/page17_hires.jpg")

# Page 18 (Lesson 1 Text 3): Illustration at the top
page18 = doc[17]
pix18 = page18.get_pixmap(matrix=mat)
pix18.save("scratch/page18_hires.jpg")

# Page 20 (Lesson 2 Text 1): Illustration
page20 = doc[19]
pix20 = page20.get_pixmap(matrix=mat)
pix20.save("scratch/page20_hires.jpg")

print("Saved high-res reference pages to scratch/")
