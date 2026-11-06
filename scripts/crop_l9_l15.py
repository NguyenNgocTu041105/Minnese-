import sys
from PIL import Image

# Lesson 9 Text 1 (l9_off1.jpg)
img9 = Image.open("scratch/pdf_pages/l9_off1.jpg")
w9, h9 = img9.size
# Crop upper right image
crop_l9_t1 = img9.crop((int(w9 * 0.48), int(h9 * 0.23), int(w9 * 0.90), int(h9 * 0.44)))
crop_l9_t1.save("public/textbook_art/official_l9_t1.jpg", quality=95)
print("Saved official_l9_t1.jpg")

# Lesson 10 Text 1 (l10_off1.jpg)
img10 = Image.open("scratch/pdf_pages/l10_off1.jpg")
w10, h10 = img10.size
crop_l10_t1 = img10.crop((int(w10 * 0.48), int(h10 * 0.23), int(w10 * 0.90), int(h10 * 0.44)))
crop_l10_t1.save("public/textbook_art/official_l10_t1.jpg", quality=95)
print("Saved official_l10_t1.jpg")

# Lesson 11 Text 1 (l11_off1.jpg)
img11 = Image.open("scratch/pdf_pages/l11_off1.jpg")
w11, h11 = img11.size
crop_l11_t1 = img11.crop((int(w11 * 0.48), int(h11 * 0.23), int(w11 * 0.90), int(h11 * 0.44)))
crop_l11_t1.save("public/textbook_art/official_l11_t1.jpg", quality=95)
print("Saved official_l11_t1.jpg")

# Lesson 12 Text 1 (l12_off1.jpg)
img12 = Image.open("scratch/pdf_pages/l12_off1.jpg")
w12, h12 = img12.size
crop_l12_t1 = img12.crop((int(w12 * 0.48), int(h12 * 0.23), int(w12 * 0.90), int(h12 * 0.44)))
crop_l12_t1.save("public/textbook_art/official_l12_t1.jpg", quality=95)
print("Saved official_l12_t1.jpg")

# Lesson 13 Text 1 (l13_off1.jpg)
img13 = Image.open("scratch/pdf_pages/l13_off1.jpg")
w13, h13 = img13.size
crop_l13_t1 = img13.crop((int(w13 * 0.48), int(h13 * 0.23), int(w13 * 0.90), int(h13 * 0.44)))
crop_l13_t1.save("public/textbook_art/official_l13_t1.jpg", quality=95)
print("Saved official_l13_t1.jpg")

# Lesson 14 Text 1 (l14_off1.jpg)
img14 = Image.open("scratch/pdf_pages/l14_off1.jpg")
w14, h14 = img14.size
crop_l14_t1 = img14.crop((int(w14 * 0.48), int(h14 * 0.23), int(w14 * 0.90), int(h14 * 0.44)))
crop_l14_t1.save("public/textbook_art/official_l14_t1.jpg", quality=95)
print("Saved official_l14_t1.jpg")

# Lesson 15 Text 1 (l15_off1.jpg)
img15 = Image.open("scratch/pdf_pages/l15_off1.jpg")
w15, h15 = img15.size
crop_l15_t1 = img15.crop((int(w15 * 0.48), int(h15 * 0.23), int(w15 * 0.90), int(h15 * 0.44)))
crop_l15_t1.save("public/textbook_art/official_l15_t1.jpg", quality=95)
print("Saved official_l15_t1.jpg")

print("All lessons 9 to 15 cropped successfully!")
