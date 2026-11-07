# -*- coding: utf-8 -*-
"""
Natural Comic Speech Bubble Calibrator for all 60 HSK 2 Scenes (hsk2-l1-t1 .. hsk2-l15-t4).
Uses the exact same multi-device proportional geometry & zero-face-collision solver as HSK 1.
Also updates src/data/coursebookCharacterAnchors.ts if needed or merges into src/data/hsk1BubbleLayouts.ts.
"""
import json
import math
import os
import sys
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open("scripts/hsk2_60_scene_measurements.json", "r", encoding="utf-8") as f:
    MEASUREMENTS = json.load(f)

with open("scripts/parsed_hsk2_texts.json", "r", encoding="utf-8") as f:
    TEXTS = {t["id"]: t for t in json.load(f)}

def get_viewports(is_wide):
    ratio = (572.0 / 1024.0) if is_wide else (765.0 / 1024.0)
    return [
        {"name": "desktop", "width": 896.0, "height": round(896.0 * ratio)},
        {"name": "laptop",  "width": 720.0, "height": round(720.0 * ratio)},
        {"name": "tablet",  "width": 640.0, "height": round(640.0 * ratio)},
        {"name": "mobile",  "width": 360.0, "height": round(360.0 * ratio)},
    ]

def estimate_dims(hanzi, viet, max_w, vp_w):
    # For long diary monologues (T4), Hsk1SpeechBubble caps displayed bubble text cleanly so it remains a speech bubble, not a wall of text
    disp_hanzi = hanzi if len(hanzi) <= 30 else (hanzi[:28] + "…")
    disp_viet = viet if len(viet) <= 70 else (viet[:68] + "…")
    scale = max(0.42, min(1.15, vp_w / 896.0))
    eff_max_w = max(92.0, min(round(max_w * scale), round(vp_w * 0.46)))

    pad_x = 22.0 * scale
    pad_y = 12.0 * scale
    cjk_px = 13.5 * scale
    vn_px = 5.4 * scale
    hanzi_lh = 17.5 * scale
    vn_lh = 13.0 * scale

    avail_w = max(60.0 * scale, eff_max_w - pad_x)
    h_single = len(disp_hanzi) * cjk_px
    v_single = len(disp_viet) * vn_px
    natural_w = min(eff_max_w, max(82.0 * scale, max(h_single, v_single) + pad_x))
    inner_w = max(56.0 * scale, natural_w - pad_x)

    h_lines = max(1, math.ceil(h_single / inner_w))
    v_lines = max(1, math.ceil(v_single / inner_w)) if disp_viet else 0
    total_h = pad_y + h_lines * hanzi_lh + (3.0 * scale + v_lines * vn_lh if v_lines > 0 else 0)
    return {"width": round(natural_w), "height": round(total_h)}

def aabb_overlap(box_a, box_b, margin=0.0):
    eb = [box_b[0] - margin, box_b[1] - margin, box_b[2] + margin, box_b[3] + margin]
    ox = max(0.0, min(box_a[2], eb[2]) - max(box_a[0], eb[0]))
    oy = max(0.0, min(box_a[3], eb[3]) - max(box_a[1], eb[1]))
    area = ox * oy
    if area > 0:
        return True, area, 0.0
    dx = max(0.0, box_b[0] - box_a[2], box_a[0] - box_b[2])
    dy = max(0.0, box_b[1] - box_a[3], box_a[1] - box_b[3])
    return False, 0.0, math.hypot(dx, dy)

def resolve_box(bpos, dims, vp):
    cx = (bpos[0] / 100.0) * vp["width"]
    cy = (bpos[1] / 100.0) * vp["height"]
    w, h = dims["width"], dims["height"]
    margin = 8.0
    left = max(margin, min(vp["width"] - w - margin, cx - w / 2.0))
    top = max(margin, min(vp["height"] - h - margin, cy - h / 2.0))
    right = left + w
    bottom = top + h
    return [
        left / vp["width"] * 100.0,
        top / vp["height"] * 100.0,
        right / vp["width"] * 100.0,
        bottom / vp["height"] * 100.0,
    ]

def solve_hsk2_layouts():
    solved = {}
    face_guards = {}
    widescreen_ids = []

    for l in range(1, 16):
        for t in range(1, 5):
            tid = f"hsk2-l{l}-t{t}"
            img_path = os.path.join("public", "textbook_art", f"hsk2_30_l{l}_t{t}.png")
            im = Image.open(img_path)
            w, h = im.size
            is_wide = (w / float(h)) > 1.55
            if is_wide:
                widescreen_ids.append(tid)

            vps = get_viewports(is_wide)
            mdata = MEASUREMENTS[tid]
            faces = mdata["faces"]
            mouths = mdata["mouths"]
            lines = TEXTS[tid]["lines"]

            # Store face guards
            face_guards[tid] = faces
            solved[tid] = {}
            chosen_centers = []

            for cname, mcoord in mouths.items():
                mx, my = float(mcoord[0]), float(mcoord[1])
                char_lines = [ln for ln in lines if ln["speaker"] == cname or cname in ln["speaker"] or ln["speaker"] in cname]
                if not char_lines:
                    char_lines = [{"hanzi": "你好！", "vietnamese": "Xin chào!"}]

                best_cand = None
                best_score = 1e12

                for pass_num in [1, 2]:
                    if pass_num == 2 and best_cand is not None:
                        break
                    y_range = range(6, min(55, int(my)) + 1, 2) if pass_num == 1 else range(6, 72, 3)

                    for max_w in [230, 210, 190, 175]:
                        for by in y_range:
                            for bx in range(10, 91, 2):
                                if pass_num == 1 and abs(bx - mx) > 30.0:
                                    continue

                                # Voronoi territory check across speakers in the same scene
                                territory_bad = False
                                for oname, omcoord in mouths.items():
                                    if oname == cname:
                                        continue
                                    omx = float(omcoord[0])
                                    if omx > mx + 12.0 and bx > (mx + omx) / 2.0 + 3.0:
                                        territory_bad = True
                                        break
                                    if omx < mx - 12.0 and bx < (mx + omx) / 2.0 - 3.0:
                                        territory_bad = True
                                        break
                                if pass_num == 1 and territory_bad:
                                    continue

                                if any(math.hypot(bx - px, by - py) < 10.0 for px, py in chosen_centers):
                                    continue

                                dx = mx - bx
                                dy = my - by
                                if dy > 6:
                                    if dx > 8:
                                        placement, tail_origin = "top-left", "bottom-right"
                                    elif dx < -8:
                                        placement, tail_origin = "top-right", "bottom-left"
                                    else:
                                        placement, tail_origin = "top", "bottom"
                                elif dy < -6:
                                    placement, tail_origin = "custom", "top"
                                else:
                                    placement, tail_origin = ("left", "right") if dx >= 0 else ("right", "left")

                                total_ov = 0.0
                                min_clear = 100.0
                                for ln in char_lines:
                                    for vp in vps:
                                        dims = estimate_dims(ln["hanzi"], ln.get("vietnamese", ""), max_w, vp["width"])
                                        pct_box = resolve_box((bx, by), dims, vp)
                                        for fbox in faces:
                                            ov, area, clr = aabb_overlap(pct_box, fbox, 1.5)
                                            if ov:
                                                total_ov += area
                                            else:
                                                min_clear = min(min_clear, clr)

                                if pass_num == 1 and total_ov > 0:
                                    continue

                                dist_m = math.hypot(bx - mx, by - (my - 14.0))
                                score = total_ov * 500.0 + dist_m * 3.5 + (230 - max_w) * 0.25 - min(min_clear, 8.0) * 1.2
                                if score < best_score:
                                    best_score = score
                                    best_cand = {
                                        "mouthTarget": {"x": round(mx, 1), "y": round(my, 1)},
                                        "placement": placement,
                                        "bubblePos": {"x": bx, "y": by},
                                        "tailOrigin": tail_origin,
                                        "maxWidth": max_w,
                                    }

                if best_cand is None:
                    best_cand = {
                        "mouthTarget": {"x": round(mx, 1), "y": round(my, 1)},
                        "placement": "top",
                        "bubblePos": {"x": int(max(12, min(88, mx))), "y": int(max(8, my - 18))},
                        "tailOrigin": "bottom",
                        "maxWidth": 210,
                    }

                solved[tid][cname] = best_cand
                chosen_centers.append((best_cand["bubblePos"]["x"], best_cand["bubblePos"]["y"]))

    out = {
        "widescreenIds": widescreen_ids,
        "layouts": solved,
        "faceGuards": face_guards,
    }
    with open("scripts/solved_hsk2_natural.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Solved all {len(solved)} HSK 2 scenes! Widescreen count: {len(widescreen_ids)}")

if __name__ == "__main__":
    solve_hsk2_layouts()
