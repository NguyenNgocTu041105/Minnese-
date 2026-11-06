from PIL import Image

# 1. Lesson 6 Text 1: Li Wen & Bai Jiayue phone exchange (from l6_off1.jpg)
img6 = Image.open("scratch/pdf_pages/l6_off1.jpg")
w6, h6 = img6.size
crop_l6_t1 = img6.crop((int(w6 * 0.49), int(h6 * 0.24), int(w6 * 0.85), int(h6 * 0.44)))
crop_l6_t1.save("public/textbook_art/official_l6_t1.jpg", quality=95)
print("Saved official_l6_t1.jpg")

# 2. Lesson 7 Text 1: Bai Jiayue & Annie phone call (from l7_off1.jpg)
img7 = Image.open("scratch/pdf_pages/l7_off1.jpg")
w7, h7 = img7.size
crop_l7_t1 = img7.crop((int(w7 * 0.12), int(h7 * 0.20), int(w7 * 0.87), int(h7 * 0.385)))
crop_l7_t1.save("public/textbook_art/official_l7_t1.jpg", quality=95)
print("Saved official_l7_t1.jpg")

# 3. Lesson 8 Text 1: Cute sleeping cat under table (from l8_off1.jpg)
img8 = Image.open("scratch/pdf_pages/l8_off1.jpg")
w8, h8 = img8.size
crop_l8_t1 = img8.crop((int(w8 * 0.52), int(h8 * 0.24), int(w8 * 0.90), int(h8 * 0.42)))
crop_l8_t1.save("public/textbook_art/official_l8_t1.jpg", quality=95)
print("Saved official_l8_t1.jpg")
