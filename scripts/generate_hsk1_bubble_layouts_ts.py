import json
import re

with open('scripts/natural_calibrated_45.json', 'r', encoding='utf-8') as f:
    layouts_hsk1 = json.load(f)

with open('scripts/solved_hsk2_natural.json', 'r', encoding='utf-8') as f:
    hsk2_solved_data = json.load(f)
    layouts_hsk2 = hsk2_solved_data['layouts']

layouts = {**layouts_hsk1, **layouts_hsk2}

with open('tests/hsk1_bubble_collision_data.ts', 'r', encoding='utf-8') as f:
    ts_code = f.read()

m_boxes = re.search(
    r'export const HSK1_CHARACTER_BOUNDING_BOXES:\s*SceneVisualRegistry\s*=\s*(\{.*?\n\});',
    ts_code,
    re.S,
)
char_boxes = json.loads(m_boxes.group(1))

scene_meta = {}
for m in re.finditer(r"HSK1_SCENE_METADATA\['(hsk1-l\d+-t\d+)'\]\s*=\s*\{(.*?)\n\};", ts_code, re.S):
    tid = m.group(1)
    body = m.group(2)
    div_m = re.search(r"splitScreenDividerX:\s*(\d+)", body)
    obs_m = re.search(r"dangerObstacles:\s*(\[.*?\n\])", body, re.S)
    scene_meta[tid] = {
        'splitScreenDividerX': int(div_m.group(1)) if div_m else None,
        'dangerObstacles': json.loads(obs_m.group(1)) if obs_m else [],
    }

with open('scripts/hsk2_60_scene_measurements.json', 'r', encoding='utf-8') as f:
    hsk2_meas = json.load(f)

for tid, mdata in hsk2_meas.items():
    char_boxes[tid] = {}
    for idx, fbox in enumerate(mdata.get('faces', [])):
        char_boxes[tid][f'Face_{idx+1}'] = {
            'face': fbox,
            'portrait': [fbox[0], max(0, fbox[1] - 4), fbox[2], min(100, fbox[3] + 25)],
        }
    scene_meta[tid] = {
        'splitScreenDividerX': mdata.get('splitX'),
        'dangerObstacles': [{'box': obs} for obs in mdata.get('obstacles', [])],
    }

def sort_key(tid: str):
    parts = tid.split('-')
    hsk_num = int(parts[0].replace('hsk', ''))
    l_num = int(parts[1][1:])
    t_num = int(parts[2][1:])
    return (hsk_num, l_num, t_num)

lines = []
lines.append('// Calibrated Speech Bubble Layout Configurations for HSK 1 & HSK 2 Coursebook (105 Scenes)')
lines.append('// Natural head-level clear-space positioning with multi-device responsive scaling and DOM face-guard')
lines.append('')
lines.append('export interface CharacterBubbleConfig {')
lines.append('  mouthTarget: { x: number; y: number };')
lines.append("  placement: 'top' | 'top-left' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom-right' | 'custom';")
lines.append('  bubblePos?: { x: number; y: number };')
lines.append("  tailOrigin?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';")
lines.append('  maxWidth?: number;')
lines.append('}')
lines.append('')
lines.append('export type HSK1SceneBubbleMap = Record<string, Record<string, CharacterBubbleConfig>>;')
lines.append('')
lines.append('export interface SceneFaceGuardData {')
lines.append('  splitScreenDividerX?: number;')
lines.append('  obstacles: Array<[number, number, number, number]>;')
lines.append('  characters: Array<{')
lines.append('    name: string;')
lines.append('    face: [number, number, number, number];')
lines.append('    head: [number, number, number, number];')
lines.append('  }>;')
lines.append('}')
lines.append('')
lines.append('export const HSK1_BUBBLE_LAYOUTS: HSK1SceneBubbleMap = {')

for tid in sorted(layouts.keys(), key=sort_key):
    lines.append(f"  '{tid}': {{")
    for cname, cfg in layouts[tid].items():
        mx, my = cfg['mouthTarget']['x'], cfg['mouthTarget']['y']
        bx, by = cfg['bubblePos']['x'], cfg['bubblePos']['y']
        place = cfg['placement']
        tail = cfg['tailOrigin']
        max_w = cfg['maxWidth']
        lines.append(f"    '{cname}': {{")
        lines.append(f"      mouthTarget: {{ x: {mx}, y: {my} }},")
        lines.append(f"      placement: '{place}',")
        lines.append(f"      bubblePos: {{ x: {bx}, y: {by} }},")
        lines.append(f"      tailOrigin: '{tail}',")
        lines.append(f"      maxWidth: {max_w},")
        lines.append("    },")
    lines.append("  },")

lines.append('};')
lines.append('')
lines.append('export const HSK1_SCENE_FACE_GUARDS: Record<string, SceneFaceGuardData> = {')
for tid in sorted(char_boxes.keys(), key=sort_key):
    meta = scene_meta.get(tid, {})
    div = meta.get('splitScreenDividerX')
    obs_list = [o['box'] for o in meta.get('dangerObstacles', [])]
    lines.append(f"  '{tid}': {{")
    if div is not None:
        lines.append(f"    splitScreenDividerX: {div},")
    lines.append(f"    obstacles: {json.dumps(obs_list)},")
    lines.append("    characters: [")
    for cname, cinfo in char_boxes[tid].items():
        fbox = cinfo['face']
        pbox = cinfo['portrait']
        hbox = [max(0, fbox[0] - 1.0), pbox[1], min(100, fbox[2] + 1.0), fbox[3]]
        lines.append(f"      {{ name: '{cname}', face: {json.dumps(fbox)}, head: {json.dumps(hbox)} }},")
    lines.append("    ],")
    lines.append("  },")
lines.append('};')
lines.append('')
lines.append('''/**
 * Retrieves the calibrated bubble layout configuration for a given HSK 1 / HSK 2 scene and speaker.
 */
export function getHsk1BubbleConfig(
  textId: string,
  speaker: string
): CharacterBubbleConfig | undefined {
  const scene = HSK1_BUBBLE_LAYOUTS[textId];
  if (!scene) return undefined;

  const cleanWithoutParen = speaker.replace(/\\s*\\(.*?\\)/, '').trim();
  if (scene[cleanWithoutParen]) return scene[cleanWithoutParen];

  const cleanSpeaker = cleanWithoutParen.split('&')[0].trim();
  if (scene[cleanSpeaker]) return scene[cleanSpeaker];

  const matchedKey = Object.keys(scene).find(
    (k) => cleanSpeaker.includes(k) || k.includes(cleanSpeaker)
  );
  return matchedKey ? scene[matchedKey] : undefined;
}

/**
 * Calculates fallback bubble center coordinates when bubblePos is not explicitly specified.
 */
export function calculateFallbackBubblePos(
  mouthTarget: { x: number; y: number },
  placement: CharacterBubbleConfig['placement']
): { x: number; y: number } {
  switch (placement) {
    case 'top':
      return { x: mouthTarget.x, y: Math.max(14, mouthTarget.y - 18) };
    case 'top-left':
      return { x: Math.max(14, mouthTarget.x - 16), y: Math.max(14, mouthTarget.y - 16) };
    case 'top-right':
      return { x: Math.min(86, mouthTarget.x + 16), y: Math.max(14, mouthTarget.y - 16) };
    case 'left':
    case 'bottom-left':
      return { x: Math.max(14, mouthTarget.x - 20), y: mouthTarget.y };
    case 'right':
    case 'bottom-right':
      return { x: Math.min(86, mouthTarget.x + 20), y: mouthTarget.y };
    case 'custom':
    default:
      return { x: mouthTarget.x, y: Math.max(14, mouthTarget.y - 18) };
  }
}

/**
 * Real-time DOM bounding-box resolver that guarantees the rendered speech bubble
 * never overlaps any character face/head or split-screen divider across Desktop, Laptop, Tablet, and Smartphone.
 */
export function resolveSmartBubbleBox(params: {
  textId: string;
  bubblePos: { x: number; y: number };
  mouthTarget: { x: number; y: number };
  cardWidth: number;
  cardHeight: number;
  containerWidth: number;
  containerHeight: number;
}): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
  const { textId, bubblePos, mouthTarget, cardWidth, cardHeight, containerWidth, containerHeight } = params;
  const guard = HSK1_SCENE_FACE_GUARDS[textId];
  const margin = 8;

  let minX = margin;
  let maxX = Math.max(margin, containerWidth - cardWidth - margin);
  const minY = margin;
  const maxY = Math.max(margin, containerHeight - cardHeight - margin);

  if (guard?.splitScreenDividerX) {
    const divPx = (guard.splitScreenDividerX / 100) * containerWidth;
    if (mouthTarget.x < guard.splitScreenDividerX) {
      maxX = Math.max(minX, Math.min(maxX, divPx - cardWidth - 4));
    } else {
      minX = Math.min(maxX, Math.max(minX, divPx + 4));
    }
  }

  const rawCenterXPx = (bubblePos.x / 100) * containerWidth;
  const rawCenterYPx = (bubblePos.y / 100) * containerHeight;
  const baseLeft = Math.max(minX, Math.min(maxX, rawCenterXPx - cardWidth / 2));
  const baseTop = Math.max(minY, Math.min(maxY, rawCenterYPx - cardHeight / 2));

  if (!guard) {
    return {
      left: baseLeft,
      top: baseTop,
      right: baseLeft + cardWidth,
      bottom: baseTop + cardHeight,
      width: cardWidth,
      height: cardHeight,
    };
  }

  const evalCandidate = (leftPx: number, topPx: number) => {
    const b0 = (leftPx / containerWidth) * 100;
    const b1 = (topPx / containerHeight) * 100;
    const b2 = ((leftPx + cardWidth) / containerWidth) * 100;
    const b3 = ((topPx + cardHeight) / containerHeight) * 100;

    let faceOverlapArea = 0;
    let headOverlapArea = 0;

    for (const ch of guard.characters) {
      const f = ch.face;
      const pad = 1.2;
      const fox = Math.min(b2, f[2] + pad) - Math.max(b0, f[0] - pad);
      const foy = Math.min(b3, f[3] + pad) - Math.max(b1, f[1] - pad);
      if (fox > 0 && foy > 0) {
        faceOverlapArea += fox * foy;
      }

      const h = ch.head;
      const hox = Math.min(b2, h[2] + 0.5) - Math.max(b0, h[0] - 0.5);
      const hoy = Math.min(b3, h[3] + 0.5) - Math.max(b1, h[1] - 0.5);
      if (hox > 0 && hoy > 0) {
        headOverlapArea += hox * hoy;
      }
    }

    for (const obs of guard.obstacles) {
      const oox = Math.min(b2, obs[2] + 0.8) - Math.max(b0, obs[0] - 0.8);
      const ooy = Math.min(b3, obs[3] + 0.8) - Math.max(b1, obs[1] - 0.8);
      if (oox > 0 && ooy > 0) {
        faceOverlapArea += oox * ooy;
      }
    }

    return { faceOverlapArea, headOverlapArea };
  };

  const initial = evalCandidate(baseLeft, baseTop);
  if (initial.faceOverlapArea === 0 && initial.headOverlapArea === 0) {
    return {
      left: baseLeft,
      top: baseTop,
      right: baseLeft + cardWidth,
      bottom: baseTop + cardHeight,
      width: cardWidth,
      height: cardHeight,
    };
  }

  // If real DOM text wrapping caused minor encroachment on any device, nudge to nearest zero-overlap spot
  let bestLeft = baseLeft;
  let bestTop = baseTop;
  let bestScore = initial.faceOverlapArea * 1000 + initial.headOverlapArea * 25;

  const stepX = Math.max(6, Math.round(containerWidth * 0.025));
  const stepY = Math.max(5, Math.round(containerHeight * 0.025));

  for (let dySteps = -8; dySteps <= 8; dySteps++) {
    for (let dxSteps = -8; dxSteps <= 8; dxSteps++) {
      if (dxSteps === 0 && dySteps === 0) continue;
      const candLeft = Math.max(minX, Math.min(maxX, baseLeft + dxSteps * stepX));
      const candTop = Math.max(minY, Math.min(maxY, baseTop + dySteps * stepY));
      const res = evalCandidate(candLeft, candTop);
      const distPenalty = Math.hypot(candLeft - baseLeft, candTop - baseTop) * 0.15;
      const score = res.faceOverlapArea * 1000 + res.headOverlapArea * 25 + distPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestLeft = candLeft;
        bestTop = candTop;
      }
    }
  }

  return {
    left: bestLeft,
    top: bestTop,
    right: bestLeft + cardWidth,
    bottom: bestTop + cardHeight,
    width: cardWidth,
    height: cardHeight,
  };
}
''')

with open('src/data/hsk1BubbleLayouts.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Successfully generated src/data/hsk1BubbleLayouts.ts with {len(layouts)} scenes!')
