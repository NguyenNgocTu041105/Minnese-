from PIL import Image

# Load hires page 21 (Lesson 2 Text 2)
img21 = Image.open("scratch/pdf_pages/p_21.jpg")
w21, h21 = img21.size
# Crop Chen Tianzhong photo frame
crop_l2_t2 = img21.crop((int(w21 * 0.42), int(h21 * 0.08), int(w21 * 0.86), int(h21 * 0.32)))
crop_l2_t2.save("public/textbook_art/official_l2_t2.jpg", quality=95)
print("Saved official_l2_t2.jpg")
