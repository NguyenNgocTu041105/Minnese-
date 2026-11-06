from PIL import Image
import os

os.makedirs("public/textbook_art", exist_ok=True)

# 1. Lesson 3 Text 2: Annie and Chen Tianzhong looking at phone (from page_27.jpg)
img27 = Image.open("scratch/pdf_pages/page_27.jpg")
w27, h27 = img27.size
crop_l3_t2 = img27.crop((int(w27 * 0.44), int(h27 * 0.56), int(w27 * 0.85), int(h27 * 0.715)))
crop_l3_t2.save("public/textbook_art/official_l3_t2.jpg", quality=95)
print("Saved official_l3_t2.jpg")

# 2. Lesson 4 Text 1: Liu Ming and Wang Yixue on sofa (from l4_p2.jpg / page 34)
img34 = Image.open("scratch/pdf_pages/l4_p2.jpg")
w34, h34 = img34.size
crop_l4_t1 = img34.crop((int(w34 * 0.49), int(h34 * 0.21), int(w34 * 0.91), int(h34 * 0.39)))
crop_l4_t1.save("public/textbook_art/official_l4_t1.jpg", quality=95)
print("Saved official_l4_t1.jpg")

# 3. Lesson 5 Text 1: Calendar September 8 (from l5_p2.jpg / page 43)
img43 = Image.open("scratch/pdf_pages/l5_p2.jpg")
w43, h43 = img43.size
crop_l5_t1 = img43.crop((int(w43 * 0.48), int(h43 * 0.21), int(w43 * 0.85), int(h43 * 0.47)))
crop_l5_t1.save("public/textbook_art/official_l5_t1.jpg", quality=95)
print("Saved official_l5_t1.jpg")
