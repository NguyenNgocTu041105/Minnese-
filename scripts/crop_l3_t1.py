from PIL import Image

# Load hires page 25 (Lesson 3 Text 1)
img25 = Image.open("scratch/pdf_pages/p_25.jpg")
w25, h25 = img25.size
# Crop Li Wen and Bai Jiayue sitting at tea table on campus
# box: x=45% to 85%, y=56% to 89%
crop_l3_t1 = img25.crop((int(w25 * 0.45), int(h25 * 0.56), int(w25 * 0.85), int(h25 * 0.90)))
crop_l3_t1.save("public/textbook_art/official_l3_t1.jpg", quality=95)
print("Saved official_l3_t1.jpg")
