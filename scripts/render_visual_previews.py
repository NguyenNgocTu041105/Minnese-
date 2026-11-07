import json
import math
import os
from PIL import Image, ImageDraw, ImageFont

with open('scripts/natural_calibrated_45.json', 'r', encoding='utf-8') as f:
    layouts = json.load(f)

with open('src/data/coursebookAudioManifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

out_dir = 'C:/Users/Tunn/.gemini/antigravity/brain/9d836685-9df8-4931-b9ae-7502677e4b13/scratch/previews'
os.makedirs(out_dir, exist_ok=True)

def estimate_dims(hanzi, vn, max_width_setting, vp_width):
    scale = vp_width / 896.0
    padding_x = 22.0 * scale
    padding_y = 12.0 * scale
    hanzi_char_w = 13.0 * scale
    hanzi_line_h = 18.0 * scale
    vn_char_w = 5.4 * scale
    vn_line_h = 13.0 * scale

    max_w = max_width_setting * scale
    min_w = 82.0 * scale

    raw_hanzi_w = len(hanzi) * hanzi_char_w
    raw_vn_w = len(vn) * vn_char_w if vn else 0
    raw_content_w = max(raw_hanzi_w, raw_vn_w)

    card_w = max(min_w, min(max_w, raw_content_w + padding_x))
    inner_w = max(36.0 * scale, card_w - padding_x)
    hanzi_lines = max(1, math.ceil(raw_hanzi_w / inner_w - 1e-6))
    vn_lines = max(1, math.ceil(raw_vn_w / inner_w - 1e-6)) if vn else 0

    card_h = padding_y + hanzi_lines * hanzi_line_h + (vn_lines * vn_line_h + 2.0 * scale if vn_lines > 0 else 0)
    return {'width': card_w, 'height': card_h}

samples = ['hsk1-l11-t1', 'hsk1-l13-t3', 'hsk1-l14-t1', 'hsk1-l15-t3']

for tid in samples:
    parts = tid.split('-')
    l_num = parts[1][1:]
    t_num = parts[2][1:]
    img_path = f'public/textbook_art/hsk1_30_l{l_num}_t{t_num}.png'
    base_img = Image.open(img_path).convert('RGBA')
    w_orig, h_orig = base_img.size

    # Render at Laptop 768px width
    vp_w = 768
    vp_h = round(768 * h_orig / w_orig)
    canvas = base_img.resize((vp_w, vp_h), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(canvas)

    scene_cfg = layouts[tid]
    lines = manifest[tid]['lines']

    # Draw one representative line per speaker on the same composite preview so we can see all speakers' bubbles at once
    import re
    seen_speakers = set()
    for line in lines:
        sp = re.sub(r'\s*\(.*?\)', '', line['speaker']).split('&')[0].strip()
        if sp in seen_speakers:
            continue
        seen_speakers.add(sp)
        cfg = scene_cfg.get(sp)
        if not cfg:
            continue

        dims = estimate_dims(line['hanzi'], line['vietnamese'], cfg['maxWidth'], vp_w)
        cx = (cfg['bubblePos']['x'] / 100.0) * vp_w
        cy = (cfg['bubblePos']['y'] / 100.0) * vp_h
        bw, bh = dims['width'], dims['height']
        left = max(8, min(vp_w - bw - 8, cx - bw / 2.0))
        top = max(8, min(vp_h - bh - 8, cy - bh / 2.0))
        right = left + bw
        bottom = top + bh

        mx = (cfg['mouthTarget']['x'] / 100.0) * vp_w
        my = (cfg['mouthTarget']['y'] / 100.0) * vp_h

        # Compute tail
        scale = vp_w / 896.0
        corner_inset = max(12 * scale, min(24 * scale, bw * 0.22))
        origin = cfg['tailOrigin']
        if origin == 'bottom-left':
            bmx, bmy = left + corner_inset, bottom
        elif origin == 'bottom-right':
            bmx, bmy = right - corner_inset, bottom
        elif origin == 'top':
            bmx, bmy = max(left + corner_inset, min(right - corner_inset, (left + right)/2 * 0.4 + mx * 0.6)), top
        elif origin == 'left':
            bmx, bmy = left, (top + bottom) / 2
        elif origin == 'right':
            bmx, bmy = right, (top + bottom) / 2
        else:
            bmx, bmy = max(left + corner_inset, min(right - corner_inset, (left + right)/2 * 0.4 + mx * 0.6)), bottom

        vx, vy = mx - bmx, my - bmy
        dist = math.hypot(vx, vy)
        tlen = min(19 * scale, max(10 * scale, dist * 0.22))
        ux, uy = (vx / dist, vy / dist) if dist > 0 else (0, 1)
        tx, ty = bmx + ux * tlen, bmy + uy * tlen

        # Draw bubble rounded rect + tail
        draw.rounded_rectangle([left, top, right, bottom], radius=int(14 * scale), fill=(255, 255, 255, 245), outline=(30, 41, 59, 220), width=2)
        if origin in ('left', 'right'):
            pts = [(bmx, bmy - 6), (tx, ty), (bmx, bmy + 6)]
        else:
            pts = [(bmx - 6, bmy), (tx, ty), (bmx + 6, bmy)]
        draw.polygon(pts, fill=(255, 255, 255, 245), outline=(30, 41, 59, 220))
        # Draw small green dot at mouthTarget for visual verification
        draw.ellipse([mx - 3, my - 3, mx + 3, my + 3], fill=(16, 185, 129, 255))

    out_path = os.path.join(out_dir, f'{tid}_preview.png')
    canvas.save(out_path)
    print('Saved', out_path)
