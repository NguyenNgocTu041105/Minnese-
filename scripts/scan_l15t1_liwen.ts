import {
  estimateBubbleDimensions,
  resolveBubbleBoundingBox,
  aabbCollisionTest,
  liangBarskyRayCast,
  getResponsiveViewports,
  auditDialogueLine,
} from '../tests/hsk1_collision_engine';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';

const did = 'hsk1-l15-t1';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);

const h = '我爱吃中国菜，也喜欢做。大家多吃点儿。';
const v = 'Tôi thích ăn món ăn Trung Quốc, cũng thích nấu. Mọi người ăn nhiều một chút nhé.';

for (const vp of viewports) {
  const dim = estimateBubbleDimensions(h, v, 210, vp.width);
  console.log(`${vp.name} (${vp.width}x${vp.height}): dim =`, dim, `height% = ${(dim.height / vp.height * 100).toFixed(1)}%`);
}

console.log('\nScene faces in %:');
for (const [cname, rec] of Object.entries(scene)) {
  console.log(`  ${cname}: face [${rec.face.join(', ')}]`);
}

// Let's find any (x, y) where the bubble box doesn't intersect any face in any viewport
console.log('\nScanning for valid (x, y) bubble positions that clear ALL faces:');
for (const mw of [160, 180, 200, 220, 240]) {
  for (let y = 10; y <= 85; y += 1) {
    for (let x = 10; x <= 90; x += 1) {
      let clearsAllFaces = true;
      for (const vp of viewports) {
        const dim = estimateBubbleDimensions(h, v, mw, vp.width);
        const clamped = resolveBubbleBoundingBox({ x, y }, dim, vp);
        for (const [cname, rec] of Object.entries(scene)) {
          const coll = aabbCollisionTest(clamped.percentBox, rec.face, 1.5);
          if (coll.isColliding) {
            clearsAllFaces = false;
            break;
          }
        }
        if (!clearsAllFaces) break;
      }
      if (clearsAllFaces) {
        console.log(`Found clear box! x=${x}, y=${y}, mw=${mw}`);
        // Now test if tail from this position can reach mouth (37, 25.5)
        for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
          const cfg = {
            mouthTarget: scene['李文'].mouth,
            placement: 'custom' as const,
            bubblePos: { x, y },
            tailOrigin: to,
            maxWidth: mw,
          };
          let allVpPass = true;
          for (const vp of viewports) {
            const res = auditDialogueLine(did, 1, '李文', h, v, vp, cfg, scene, meta);
            if (res.issues.length > 0) {
              allVpPass = false;
              break;
            }
          }
          if (allVpPass) {
            console.log(`  >>> FOUND 100% PASSING CFG FOR 李文:`, JSON.stringify(cfg));
          }
        }
      }
    }
  }
}
