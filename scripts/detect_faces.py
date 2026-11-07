import os
import cv2
import json

ART_DIR = os.path.join("public", "textbook_art")
cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(cascade_path)

# Also let's check anime face cascade if available, or just standard cascade
results = {}

for lesson in range(1, 16):
    for text in range(1, 4):
        fn = f"hsk1_30_l{lesson}_t{text}.png"
        fp = os.path.join(ART_DIR, fn)
        if not os.path.exists(fp):
            continue
        
        img = cv2.imread(fp)
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))
        detected = []
        for (x, y, fw, fh) in faces:
            centerX = round((x + fw / 2) / w * 100, 1)
            topY = round(y / h * 100, 1)
            detected.append({"centerX": centerX, "topY": topY, "w": fw, "h": fh})
            
        results[f"hsk1-l{lesson}-t{text}"] = detected

print(json.dumps(results, indent=2))
