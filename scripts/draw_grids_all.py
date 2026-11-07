import os
from PIL import Image, ImageDraw, ImageFont

ART_DIR = os.path.join("public", "textbook_art")
GRID_DIR = os.path.join("scratch", "grids")
os.makedirs(GRID_DIR, exist_ok=True)

for lesson in range(1, 16):
    for text in range(1, 4):
        fn = f"hsk1_30_l{lesson}_t{text}.png"
        fp = os.path.join(ART_DIR, fn)
        if not os.path.exists(fp):
            continue
        
        img = Image.open(fp).convert("RGB")
        w, h = img.size
        draw = ImageDraw.Draw(img)
        
        # Draw vertical grid lines every 5%
        for x_pct in range(5, 100, 5):
            x = int(w * x_pct / 100.0)
            color = (255, 0, 0) if x_pct % 10 == 0 else (255, 120, 120)
            draw.line([(x, 0), (x, h)], fill=color, width=2 if x_pct % 10 == 0 else 1)
            if x_pct % 10 == 0:
                draw.text((x + 2, 5), f"{x_pct}%", fill=(255, 0, 0))
                draw.text((x + 2, h - 25), f"{x_pct}%", fill=(255, 0, 0))
                
        # Draw horizontal grid lines every 5%
        for y_pct in range(5, 100, 5):
            y = int(h * y_pct / 100.0)
            color = (0, 0, 255) if y_pct % 10 == 0 else (120, 120, 255)
            draw.line([(0, y), (w, y)], fill=color, width=2 if y_pct % 10 == 0 else 1)
            if y_pct % 10 == 0:
                draw.text((5, y + 2), f"{y_pct}%", fill=(0, 0, 255))
                draw.text((w - 45, y + 2), f"{y_pct}%", fill=(0, 0, 255))
                
        out_fp = os.path.join(GRID_DIR, f"grid_l{lesson}_t{text}.png")
        img.save(out_fp)

print("Generated all 45 grid images in scratch/grids/")
