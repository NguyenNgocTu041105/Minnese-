import re
import json
import math
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('tests/hsk1_bubble_collision_data.ts', 'r', encoding='utf-8') as f:
    data_ts = f.read()

start_marker = 'export const HSK1_CHARACTER_BOUNDING_BOXES: SceneVisualRegistry = '
start_idx = data_ts.find(start_marker) + len(start_marker)
end_idx = data_ts.rfind('};') + 1
boxes_json_str = data_ts[start_idx:end_idx]
boxes_json_str = re.sub(r',\s*([\}\]])', r'\1', boxes_json_str)
CHARACTER_BOXES = json.loads(boxes_json_str)

SCENE_META = {}
meta_blocks = re.findall(r"HSK1_SCENE_METADATA\['(hsk1-l\d+-t\d+)'\]\s*=\s*(\{.*?\n\});", data_ts, re.DOTALL)
for tid, block in meta_blocks:
    aspect = '16:9' if "'16:9'" in block else '4:3'
    cat_m = re.search(r"category:\s*'([^']+)'", block)
    cat = cat_m.group(1) if cat_m else 'standard'
    div_m = re.search(r"splitScreenDividerX:\s*(\d+)", block)
    div = int(div_m.group(1)) if div_m else None
    obs = []
    obs_m = re.search(r"dangerObstacles:\s*(\[[\s\S]*\])\s*,?\s*\}", block)
    if obs_m:
        obs_str = re.sub(r',\s*([\}\]])', r'\1', obs_m.group(1))
        obs = json.loads(obs_str)
    SCENE_META[tid] = {
        'dialogueId': tid,
        'aspectRatioClass': aspect,
        'category': cat,
        'splitScreenDividerX': div,
        'dangerObstacles': obs,
    }

with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    book_ts = f.read()

DIALOGUES = {}
text_blocks = re.findall(r'id:\s*"(hsk1-l\d+-t\d+)",.*?lines:\s*\[(.*?)\]\s*\}', book_ts, re.DOTALL)
for tid, lines_str in text_blocks:
    line_items = []
    for m in re.finditer(r'\{\s*speaker:\s*"([^"]+)"[^\}]*?hanzi:\s*"([^"]+)"(?:[^\}]*?vietnamese:\s*"([^"]+)")?', lines_str):
        spk_raw, hanzi, vn = m.group(1), m.group(2), m.group(3) or ''
        clean_spk = re.sub(r'\s*\(.*?\)', '', spk_raw).split('&')[0].strip()
        line_items.append({
            'speaker': clean_spk,
            'hanzi': hanzi,
            'vietnamese': vn
        })
    DIALOGUES[tid] = line_items

def get_viewports(aspect):
    h_base = 572 if aspect == '16:9' else 765
    w_base = 1024
    return [
        {'name': 'mobile-375', 'width': 375, 'height': round(375 * h_base / w_base)},
        {'name': 'tablet-768', 'width': 768, 'height': round(768 * h_base / w_base)},
        {'name': 'desktop-896', 'width': 896, 'height': round(896 * h_base / w_base)},
        {'name': 'desktop-1280', 'width': 1280, 'height': round(1280 * h_base / w_base)},
    ]

def estimate_dims(hanzi, vn, max_width_setting, vp_width):
    # Pure canvas-proportional scaling relative to 896px reference width
    # Ensures exact scale invariance across PC, Laptop, Tablet, and Smartphone!
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

def aabb_overlap(boxA, boxB, pad=0.0):
    b0, b1, b2, b3 = boxB[0] - pad, boxB[1] - pad, boxB[2] + pad, boxB[3] + pad
    ox = min(boxA[2], b2) - max(boxA[0], b0)
    oy = min(boxA[3], b3) - max(boxA[1], b1)
    if ox > 0 and oy > 0:
        return True, ox * oy, 0.0
    dx = max(0.0, max(boxA[0] - b2, b0 - boxA[2]))
    dy = max(0.0, max(boxA[1] - b3, b1 - boxA[3]))
    return False, 0.0, math.hypot(dx, dy)

def liang_barsky(p1, p2, box):
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    p = [-dx, dx, -dy, dy]
    q = [p1[0] - box[0], box[2] - p1[0], p1[1] - box[1], box[3] - p1[1]]
    t0, t1 = 0.0, 1.0
    for i in range(4):
        pi, qi = p[i], q[i]
        if abs(pi) < 1e-9:
            if qi < 0:
                return False
        elif pi < 0:
            r = qi / pi
            if r > t1:
                return False
            if r > t0:
                t0 = r
        else:
            r = qi / pi
            if r < t0:
                return False
            if r < t1:
                t1 = r
    return t0 <= t1 and t1 >= 0 and t0 <= 1

def compute_tail(box_px, mouth_px, origin_pref, vp):
    left, top, right, bottom = box_px['left'], box_px['top'], box_px['right'], box_px['bottom']
    w, h = right - left, bottom - top
    cx, cy = (left + right) / 2.0, (top + bottom) / 2.0
    origin = origin_pref
    if not origin:
        if mouth_px[1] > bottom:
            if mouth_px[0] < left + w * 0.35: origin = 'bottom-left'
            elif mouth_px[0] > right - w * 0.35: origin = 'bottom-right'
            else: origin = 'bottom'
        elif mouth_px[1] < top:
            origin = 'top'
        elif mouth_px[0] < left:
            origin = 'left'
        else:
            origin = 'right'
    else:
        if origin in ('bottom', 'bottom-left', 'bottom-right') and mouth_px[1] < bottom:
            if mouth_px[1] < top: origin = 'top'
            elif mouth_px[0] < left: origin = 'left'
            elif mouth_px[0] > right: origin = 'right'
        elif origin == 'top' and mouth_px[1] > top:
            if mouth_px[1] > bottom: origin = 'bottom'
            elif mouth_px[0] < left: origin = 'left'
            elif mouth_px[0] > right: origin = 'right'

    scale = vp['width'] / 896.0
    inset = max(12.0 * scale, min(24.0 * scale, w * 0.25))
    if origin == 'bottom-left':
        bx, by = left + inset, bottom
    elif origin == 'bottom-right':
        bx, by = right - inset, bottom
    elif origin == 'top':
        bx, by = max(left + inset, min(right - inset, mouth_px[0])), top
    elif origin == 'left':
        bx, by = left, max(top + 10.0 * scale, min(bottom - 10.0 * scale, mouth_px[1]))
    elif origin == 'right':
        bx, by = right, max(top + 10.0 * scale, min(bottom - 10.0 * scale, mouth_px[1]))
    else:
        bx, by = max(left + inset, min(right - inset, mouth_px[0])), bottom

    vx, vy = mouth_px[0] - bx, mouth_px[1] - by
    dist = math.hypot(vx, vy)
    max_len = 18.0 * scale
    min_len = 10.0 * scale
    t_len = min(max_len, max(min_len, dist * 0.18))
    ux, uy = (vx / dist, vy / dist) if dist > 0 else (0.0, 1.0)
    tx, ty = bx + ux * t_len, by + uy * t_len

    origin_pct = (bx / vp['width'] * 100.0, by / vp['height'] * 100.0)
    tip_pct = (tx / vp['width'] * 100.0, ty / vp['height'] * 100.0)
    return origin, origin_pct, tip_pct

def resolve_box(bpos, dims, vp, split_div=None, mouth_x=50.0):
    cx = (bpos[0] / 100.0) * vp['width']
    cy = (bpos[1] / 100.0) * vp['height']
    w, h = dims['width'], dims['height']
    left = cx - w / 2.0
    top = cy - h / 2.0

    scale = vp['width'] / 896.0
    margin = 8.0
    min_x, max_x = margin, vp['width'] - w - margin
    if split_div is not None:
        div_px = (split_div / 100.0) * vp['width']
        if mouth_x < split_div:
            max_x = max(min_x, div_px - w - 6.0 * scale)
        else:
            min_x = min(max_x, div_px + 6.0 * scale)

    left = max(min_x, min(max_x, left))
    top = max(margin, min(vp['height'] - h - margin, top))
    right = left + w
    bottom = top + h
    pct_box = [
        left / vp['width'] * 100.0,
        top / vp['height'] * 100.0,
        right / vp['width'] * 100.0,
        bottom / vp['height'] * 100.0,
    ]
    return {'left': left, 'top': top, 'right': right, 'bottom': bottom, 'pct': pct_box}

SOLVED_LAYOUTS = {}
unsolved = []

for tid in sorted(CHARACTER_BOXES.keys()):
    scene_chars = CHARACTER_BOXES[tid]
    meta = SCENE_META[tid]
    lines = DIALOGUES[tid]
    vps = get_viewports(meta['aspectRatioClass'])
    split_div = meta['splitScreenDividerX']
    obstacles = meta['dangerObstacles']

    SOLVED_LAYOUTS[tid] = {}
    chosen_centers = []

    char_names = list(scene_chars.keys())

    for cname in char_names:
        cinfo = scene_chars[cname]
        face = cinfo['face']
        portrait = cinfo['portrait']
        mouth = (cinfo['mouth']['x'], cinfo['mouth']['y'])

        # Head box includes the hair top (portrait[1]) down to the chin (face[3])
        head_top = max(4.0, portrait[1])

        char_lines = [l for l in lines if l['speaker'] == cname or cname in l['speaker'] or l['speaker'] in cname]
        if not char_lines:
            char_lines = [{'speaker': cname, 'hanzi': '你好！', 'vietnamese': 'Xin chào!'}]

        best_cand = None
        best_score = 1e12

        x_min, x_max = 10, 90
        if split_div is not None:
            if mouth[0] < split_div:
                x_min, x_max = 10, split_div - 10
            else:
                x_min, x_max = split_div + 10, 90

        for pass_num in [1, 2]:
            if pass_num == 2 and best_cand is not None:
                break

            if pass_num == 1:
                # Pass 1: Strictly in upper/side clear space (Y from 6% to mouth[1])
                y_range = range(6, min(52, int(mouth[1])) + 1, 2)
                x_range_fn = lambda: range(x_min, x_max + 1, 2)
            else:
                # Pass 2: Close-up scenes where upper space is blocked by high hair + thought clouds
                y_start = int(face[3] + 7)
                y_end = min(64, int(face[3] + 20))
                y_range = range(y_start, max(y_start + 1, y_end + 1), 2)
                cx_min = max(x_min, int(mouth[0] - 18))
                cx_max = min(x_max, int(mouth[0] + 18))
                x_range_fn = lambda: range(cx_min, cx_max + 1, 2)

            for max_w in [235, 210, 190, 175, 160]:
                for by in y_range:
                    for bx in x_range_fn():
                        if abs(bx - mouth[0]) > 28.0:
                            continue

                        # Voronoi Speaker Territory: never cross into another speaker's horizontal territory
                        territory_violated = False
                        for other_name, other_info in scene_chars.items():
                            if other_name == cname:
                                continue
                            omx = other_info['mouth']['x']
                            if omx > mouth[0] + 12.0 and bx > (mouth[0] + omx) / 2.0 + 3.0:
                                territory_violated = True
                                break
                            if omx < mouth[0] - 12.0 and bx < (mouth[0] + omx) / 2.0 - 3.0:
                                territory_violated = True
                                break
                        if territory_violated:
                            continue

                        too_close = False
                        for prev_bx, prev_by in chosen_centers:
                            if math.hypot(bx - prev_bx, by - prev_by) < 12.0:
                                too_close = True
                                break
                        if too_close:
                            continue

                        dx = mouth[0] - bx
                        dy = mouth[1] - by
                        if dy > 6:
                            if dx > 8:
                                placement, tail_origin = 'top-left', 'bottom-right'
                            elif dx < -8:
                                placement, tail_origin = 'top-right', 'bottom-left'
                            else:
                                placement, tail_origin = 'top', 'bottom'
                        elif dy < -6:
                            placement, tail_origin = 'custom', 'top'
                        else:
                            if dx >= 0:
                                placement, tail_origin = 'left', 'right'
                            else:
                                placement, tail_origin = 'right', 'left'

                        valid = True
                        min_face_clear = 100.0
                        head_hair_overlap = 0.0
                        portrait_overlap_area = 0.0
                        max_tail_dist = 0.0

                        for l in char_lines:
                            for vp in vps:
                                dims = estimate_dims(l['hanzi'], l['vietnamese'], max_w, vp['width'])
                                clamped = resolve_box((bx, by), dims, vp, split_div, mouth[0])
                                pct_box = clamped['pct']

                                for obs in obstacles:
                                    ov, _, _ = aabb_overlap(pct_box, obs['box'], 1.0)
                                    if ov:
                                        valid = False
                                        break
                                if not valid:
                                    break

                                mouth_px = (mouth[0] / 100.0 * vp['width'], mouth[1] / 100.0 * vp['height'])
                                _, orig_pct, tip_pct = compute_tail(clamped, mouth_px, tail_origin, vp)

                                for other_name, other_info in scene_chars.items():
                                    oface = other_info['face']
                                    oport = other_info['portrait']
                                    ohead = [oface[0] - 1.0, oport[1], oface[2] + 1.0, oface[3]]

                                    # 1. Strict face clearance (1.8% margin around eyes/nose/mouth)
                                    ov_face, _, clear_f = aabb_overlap(pct_box, oface, 1.8)
                                    if ov_face:
                                        valid = False
                                        break
                                    min_face_clear = min(min_face_clear, clear_f)

                                    # 2. Rendered tail segment must not touch any face
                                    if liang_barsky(orig_pct, tip_pct, [oface[0]-1.0, oface[1]-1.0, oface[2]+1.0, oface[3]+1.0]):
                                        valid = False
                                        break

                                    # 3. Sightline from tail origin to speaker mouth must not cross ANOTHER character's face
                                    if other_name != cname:
                                        if liang_barsky(orig_pct, mouth, oface):
                                            valid = False
                                            break

                                    if vp['name'] == 'desktop-896':
                                        # 4. Penalize touching hair/top of head heavily so bubbles sit in open sky/wall!
                                        ov_h, area_h, _ = aabb_overlap(pct_box, ohead, 1.0)
                                        if ov_h:
                                            head_hair_overlap += area_h

                                        # 5. Penalize touching body/torso so bubbles prefer empty background!
                                        ov_p, area_p, _ = aabb_overlap(pct_box, oport, 0.0)
                                        if ov_p:
                                            portrait_overlap_area += area_p

                                if not valid:
                                    break
                                max_tail_dist = max(max_tail_dist, math.hypot(mouth[0] - orig_pct[0], mouth[1] - orig_pct[1]))
                            if not valid:
                                break

                        if valid:
                            dist_center = math.hypot(bx - mouth[0], by - (head_top - 4 if pass_num == 1 else face[3] + 10))
                            width_bonus = (210 - max_w) * 0.3
                            score = (
                                head_hair_overlap * 8.0      # Strongly avoid covering hair/head!
                                + portrait_overlap_area * 1.2 # Strongly prefer empty background!
                                + dist_center * 2.2
                                + max_tail_dist * 1.5
                                + width_bonus
                                - min(min_face_clear, 8.0) * 1.0
                            )
                            if score < best_score:
                                best_score = score
                                best_cand = {
                                    'mouthTarget': {'x': mouth[0], 'y': mouth[1]},
                                    'faceBox': face,
                                    'placement': placement,
                                    'bubblePos': {'x': bx, 'y': by},
                                    'tailOrigin': tail_origin,
                                    'maxWidth': max_w,
                                }

        if best_cand:
            SOLVED_LAYOUTS[tid][cname] = best_cand
            chosen_centers.append((best_cand['bubblePos']['x'], best_cand['bubblePos']['y']))
        else:
            unsolved.append((tid, cname))

print(f"Solved {sum(len(v) for v in SOLVED_LAYOUTS.values())}/102 characters. Unsolved: {len(unsolved)}")
if unsolved:
    print("Unsolved:", unsolved)
else:
    below_mouth = []
    for tid, sc in SOLVED_LAYOUTS.items():
        for k, v in sc.items():
            if v['bubblePos']['y'] > v['mouthTarget']['y']:
                below_mouth.append((tid, k, v['bubblePos'], v['mouthTarget'], v['faceBox']))
    print(f"\nCharacters placed below mouth ({len(below_mouth)}/102):")
    for item in below_mouth:
        print(" ", item)

    for sample_id in ['hsk1-l1-t1', 'hsk1-l2-t1', 'hsk1-l2-t2', 'hsk1-l2-t3', 'hsk1-l7-t3', 'hsk1-l8-t3', 'hsk1-l11-t1', 'hsk1-l13-t1', 'hsk1-l14-t1', 'hsk1-l15-t2', 'hsk1-l15-t3']:
        print(f"\n--- {sample_id} ---")
        for k, v in SOLVED_LAYOUTS[sample_id].items():
            print(f"  {k}: pos={v['bubblePos']}, mouth={v['mouthTarget']}, face={v['faceBox']}, place={v['placement']}, tail={v['tailOrigin']}, maxW={v['maxWidth']}")

with open('scripts/natural_calibrated_45.json', 'w', encoding='utf-8') as f:
    json.dump(SOLVED_LAYOUTS, f, ensure_ascii=False, indent=2)
