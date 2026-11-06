from PIL import Image

# Load hires page 16
img16 = Image.open("scratch/page16_hires.jpg")
w, h = img16.size

# Crop Lesson 1 Text 1 image
# Based on p_16.jpg: box is roughly x=56% to 91%, y=56% to 75%
crop_l1_t1 = img16.crop((int(w * 0.56), int(h * 0.565), int(w * 0.91), int(h * 0.75)))
crop_l1_t1.save("public/textbook_art/official_l1_t1.jpg", quality=95)

# Load hires page 17 (Lesson 1 Text 2)
img17 = Image.open("scratch/page17_hires.jpg")
w17, h17 = img17.size
# box: x=38% to 86%, y=33% to 52%
crop_l1_t2 = img17.crop((int(w17 * 0.38), int(h17 * 0.33), int(w17 * 0.86), int(h17 * 0.52)))
crop_l1_t2.save("public/textbook_art/official_l1_t2.jpg", quality=95)

# Load hires page 18 (Lesson 1 Text 3)
img18 = Image.open("scratch/page18_hires.jpg")
w18, h18 = img18.size
# box: x=15% to 91%, y=23% to 49%
crop_l1_t3 = img18.crop((int(w18 * 0.15), int(h18 * 0.235), int(w18 * 0.91), int(h18 * 0.49)))
crop_l1_t3.save("public/textbook_art/official_l1_t3.jpg", quality=95)

# Load hires page 20 (Lesson 2 Text 1)
img20 = Image.open("scratch/page20_hires.jpg")
w20, h20 = img20.size
# box: x=15% to 91%, y=63% to 92%
crop_l2_t1 = img20.crop((int(w20 * 0.15), int(h20 * 0.63), int(w20 * 0.91), int(h20 * 0.93)))
crop_l2_t1.save("public/textbook_art/official_l2_t1.jpg", quality=95)

print("Cropped official images saved to public/textbook_art/")
