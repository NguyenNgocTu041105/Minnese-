import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import json
import os
import math
from PIL import Image, ImageDraw, ImageFont

with open('src/data/coursebookAudioManifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

with open('scripts/parsed_hsk2_texts.json', 'r', encoding='utf-8') as f:
    hsk2_texts = {item['id']: item for item in json.load(f)}

with open('scripts/hsk2_60_scene_measurements.json', 'r', encoding='utf-8') as f:
    hsk2_meas = json.load(f)

with open('scripts/solved_hsk2_natural.json', 'r', encoding='utf-8') as f:
    solved_hsk2 = json.load(f)

layouts = solved_hsk2['layouts']
widescreen_ids = set(solved_hsk2['widescreenIds'])

# 1. Verify all 60 HSK 2 PNG images
missing_imgs = []
for l in range(1, 16):
    for t in range(1, 5):
        p = f'public/textbook_art/hsk2_30_l{l}_t{t}.png'
        if not os.path.exists(p) or os.path.getsize(p) < 10000:
            missing_imgs.append(p)
assert len(missing_imgs) == 0, f"Missing/corrupt HSK 2 images: {missing_imgs}"
print("[PASS] 60/60 HSK 2 PNG illustrations verified on disk.")

# 2. Verify all 60 HSK 2 full audio + 308 line audio MP3s
missing_audio = []
total_lines = 0
for tid, tdata in hsk2_texts.items():
    m_entry = manifest.get(tid)
    assert m_entry is not None, f"Missing manifest entry for {tid}"
    full_path = 'public' + m_entry['fullAudioUrl']
    if not os.path.exists(full_path) or os.path.getsize(full_path) < 3000:
        missing_audio.append(full_path)
    assert len(m_entry['lines']) == len(tdata['lines']), f"Line count mismatch in {tid}"
    for l_info in m_entry['lines']:
        total_lines += 1
        lp = 'public' + l_info['audioUrl']
        if not os.path.exists(lp) or os.path.getsize(lp) < 2000:
            missing_audio.append(lp)

assert len(missing_audio) == 0, f"Missing/corrupt HSK 2 audio files: {missing_audio}"
print(f"[PASS] 60/60 HSK 2 full dialogues + {total_lines}/{total_lines} individual line MP3s verified.")

# 3. Verify Cross-Level Voice Consistency (HSK 1 vs HSK 2)
hsk1_character_voices = {}
for tid, m_entry in manifest.items():
    if not tid.startswith('hsk1-'):
        continue
    for l_info in m_entry['lines']:
        sp = l_info['speaker'].split('(')[0].strip()
        if sp in ('服务员', '摊主'):
            continue  # context-specific in HSK 1 L10 vs L13
        sig = (l_info['voice'], l_info.get('persona', ''))
        hsk1_character_voices[sp] = sig

hsk2_character_voices = {}
mismatches = []
for tid, m_entry in manifest.items():
    if not tid.startswith('hsk2-'):
        continue
    for l_info in m_entry['lines']:
        sp = l_info['speaker'].split('(')[0].strip()
        sig = (l_info['voice'], l_info.get('persona', ''))
        if sp in hsk2_character_voices and hsk2_character_voices[sp] != sig:
            mismatches.append((tid, sp, sig, hsk2_character_voices[sp]))
        hsk2_character_voices[sp] = sig
        if sp in hsk1_character_voices and hsk1_character_voices[sp] != sig:
            mismatches.append((f"Cross-level {tid}", sp, sig, hsk1_character_voices[sp]))

assert len(mismatches) == 0, f"Voice mismatches found: {mismatches}"
assert hsk2_character_voices.get('白家月 & 安妮')[0] == 'zh-CN-Chorus-JiayueAnnie', "Missing unison chorus for 白家月 & 安妮"
print(f"[PASS] 100% Voice Identity Consistency across HSK 1 & HSK 2 ({len(hsk2_character_voices)} speaker profiles, including Chorus '白家月 & 安妮').")

# 4. Verify Multi-Viewport Zero-Collision across Desktop (896), Laptop (768), Tablet (600), Smartphone (360)
viewports = [896, 768, 600, 360]
collision_errors = []
viewport_checks = 0

def get_bubble_text(hanzi, viet):
    bh = hanzi
    if len(bh) > 32:
        fc = bh.split('。')[0].split('！')[0].split('？')[0].split('；')[0]
        if 6 <= len(fc) <= 28:
            bh = fc + '。…'
        else:
            bh = bh[:26] + '…'
    bv = viet or ''
    if len(bv) > 78:
        fc = bv.split('.')[0].split('!')[0].split('?')[0].split(';')[0]
        if 15 <= len(fc) <= 68:
            bv = fc + '. …'
        else:
            bv = bv[:64] + '…'
    return bh, bv

for tid, tdata in hsk2_texts.items():
    meas = hsk2_meas[tid]
    faces = meas['faces']
    split_x = meas.get('splitX')
    is_wide = tid in widescreen_ids
    aspect = (1024 / 572) if is_wide else (1024 / 765)

    for line in tdata['lines']:
        sp = line['speaker'].split('(')[0].strip()
        cfg = layouts[tid].get(sp)
        if not cfg:
            sp_first = sp.split('&')[0].strip()
            cfg = layouts[tid].get(sp_first)
        assert cfg is not None, f"Missing bubble layout for {tid} speaker {sp}"

        bh, bv = get_bubble_text(line['hanzi'], line.get('vietnamese', ''))

        for vw in viewports:
            vh = vw / aspect
            scale = max(0.42, min(1.15, vw / 896.0))
            max_w = max(92, min(round(cfg['maxWidth'] * scale), round(vw * 0.46)))

            # Estimate rendered DOM box size at this viewport
            hanzi_px_per_char = 13.5 * scale
            viet_px_per_char = 5.4 * scale
            pad_x = 22 * scale
            pad_y = 12 * scale
            inner_max = max(60, max_w - pad_x)

            h_lines = max(1, math.ceil((len(bh) * hanzi_px_per_char) / inner_max))
            v_lines = max(1, math.ceil((len(bv) * viet_px_per_char) / inner_max)) if bv else 0

            est_w = min(max_w, max(80 * scale, max(len(bh) * hanzi_px_per_char, len(bv) * viet_px_per_char * 0.85) + pad_x))
            est_h = h_lines * (17.5 * scale) + v_lines * (13.0 * scale) + pad_y

            # Run the exact same logic as resolveSmartBubbleBox
            margin = 8
            min_x = margin
            max_x = max(margin, vw - est_w - margin)
            min_y = margin
            max_y = max(margin, vh - est_h - margin)

            if split_x:
                div_px = (split_x / 100.0) * vw
                if cfg['mouthTarget']['x'] < split_x:
                    max_x = max(min_x, min(max_x, div_px - est_w - 4))
                else:
                    min_x = min(max_x, max(min_x, div_px + 4))

            raw_cx = (cfg['bubblePos']['x'] / 100.0) * vw
            raw_cy = (cfg['bubblePos']['y'] / 100.0) * vh
            base_left = max(min_x, min(max_x, raw_cx - est_w / 2.0))
            base_top = max(min_y, min(max_y, raw_cy - est_h / 2.0))

            def eval_cand(l_px, t_px):
                b0 = (l_px / vw) * 100.0
                b1 = (t_px / vh) * 100.0
                b2 = ((l_px + est_w) / vw) * 100.0
                b3 = ((t_px + est_h) / vh) * 100.0
                f_area = 0.0
                for f in faces:
                    fox = min(b2, f[2] + 0.8) - max(b0, f[0] - 0.8)
                    foy = min(b3, f[3] + 0.8) - max(b1, f[1] - 0.8)
                    if fox > 0 and foy > 0:
                        f_area += fox * foy
                return f_area

            best_l, best_t = base_left, base_top
            best_f = eval_cand(base_left, base_top)
            if best_f > 0:
                step_x = max(6, round(vw * 0.025))
                step_y = max(5, round(vh * 0.025))
                best_score = best_f * 1000.0
                for dys in range(-8, 9):
                    for dxs in range(-8, 9):
                        cl = max(min_x, min(max_x, base_left + dxs * step_x))
                        ct = max(min_y, min(max_y, base_top + dys * step_y))
                        fa = eval_cand(cl, ct)
                        sc = fa * 1000.0 + math.hypot(cl - base_left, ct - base_top) * 0.15
                        if sc < best_score:
                            best_score = sc
                            best_l, best_t = cl, ct
                            best_f = fa

            # Check actual strict face overlap (without extra padding)
            b0 = (best_l / vw) * 100.0
            b1 = (best_t / vh) * 100.0
            b2 = ((best_l + est_w) / vw) * 100.0
            b3 = ((best_t + est_h) / vh) * 100.0
            actual_face_overlap = 0.0
            for f in faces:
                fox = min(b2, f[2]) - max(b0, f[0])
                foy = min(b3, f[3]) - max(b1, f[1])
                if fox > 0 and foy > 0:
                    actual_face_overlap += fox * foy

            if actual_face_overlap > 0.05:
                collision_errors.append((tid, sp, vw, round(actual_face_overlap, 2)))
            viewport_checks += 1

print(f"[PASS] {viewport_checks} HSK 2 multi-viewport bubble checks executed. Collisions: {len(collision_errors)}")
if collision_errors:
    print("Collision details:", collision_errors[:10])
assert len(collision_errors) == 0, f"Found face collisions: {collision_errors}"

# 5. Render a 6-scene visual contact sheet in scratch/hsk2_preview_verification.jpg
sample_ids = ['hsk2-l1-t1', 'hsk2-l2-t1', 'hsk2-l5-t2', 'hsk2-l6-t2', 'hsk2-l13-t2', 'hsk2-l15-t1']
sheet = Image.new('RGB', (1840, 1480), (15, 23, 42))
try:
    font_zh = ImageFont.truetype("C:/Windows/Fonts/msyhbd.ttc", 15)
    font_vi = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
except Exception:
    font_zh = ImageFont.load_default()
    font_vi = ImageFont.load_default()

for idx, tid in enumerate(sample_ids):
    l_num = tid.split('-')[1][1:]
    t_num = tid.split('-')[2][1:]
    img = Image.open(f'public/textbook_art/hsk2_30_l{l_num}_t{t_num}.png').convert('RGB')
    is_wide = tid in widescreen_ids
    tw = 880
    th = int(tw * (572 / 1024)) if is_wide else int(tw * (765 / 1024))
    img = img.resize((tw, th), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(img)

    # Draw green dashed/thin face guard boxes
    for f in hsk2_meas[tid]['faces']:
        fx0, fy0, fx1, fy1 = f[0]*tw/100, f[1]*th/100, f[2]*tw/100, f[3]*th/100
        draw.rectangle([fx0, fy0, fx1, fy1], outline=(16, 185, 129), width=2)

    # Draw each speaker's calibrated bubble for this scene
    for sp, cfg in layouts[tid].items():
        # Find first line by this speaker
        line_match = next((ln for ln in hsk2_texts[tid]['lines'] if ln['speaker'].startswith(sp)), hsk2_texts[tid]['lines'][0])
        bh, bv = get_bubble_text(line_match['hanzi'], line_match.get('vietnamese', ''))
        cx = cfg['bubblePos']['x'] * tw / 100.0
        cy = cfg['bubblePos']['y'] * th / 100.0
        mx = cfg['mouthTarget']['x'] * tw / 100.0
        my = cfg['mouthTarget']['y'] * th / 100.0
        bw = min(cfg['maxWidth'], 210)
        bh_px = 54
        x0 = max(8, min(tw - bw - 8, cx - bw / 2))
        y0 = max(8, min(th - bh_px - 8, cy - bh_px / 2))
        x1 = x0 + bw
        y1 = y0 + bh_px

        # Short directional tail
        vx, vy = mx - (x0 + x1)/2, my - y1
        dist = max(1.0, math.hypot(vx, vy))
        tip_x = (x0 + x1)/2 + (vx / dist) * 14
        tip_y = y1 + (vy / dist) * 14
        draw.polygon([((x0+x1)/2 - 7, y1 - 2), (tip_x, tip_y), ((x0+x1)/2 + 7, y1 - 2)], fill=(255, 255, 255), outline=(30, 41, 59))
        draw.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=(255, 255, 255), outline=(30, 41, 59), width=2)
        draw.text((x0 + 8, y0 + 6), f"{sp}: {bh[:12]}", fill=(15, 23, 42), font=font_zh)
        draw.text((x0 + 8, y0 + 28), bv[:26], fill=(100, 116, 139), font=font_vi)

    col = idx % 2
    row = idx // 2
    sheet.paste(img, (20 + col * 900, 15 + row * 485))

os.makedirs('scratch', exist_ok=True)
sheet.save('scratch/hsk2_preview_verification.jpg', quality=90)
print("[PASS] Saved visual verification sheet to scratch/hsk2_preview_verification.jpg")
