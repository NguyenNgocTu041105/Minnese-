import {
  estimateBubbleDimensions,
  resolveBubbleBoundingBox,
  aabbCollisionTest,
  getResponsiveViewports,
  auditDialogueLine,
} from '../tests/hsk1_collision_engine';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lines = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!.texts.find(t => t.id === did)!.lines;
const bLine = lines[2]; // 白家月

console.log('Testing 白家月 line:', bLine.hanzi);
console.log('Vietnamese:', bLine.vietnamese);

for (const mw of [160, 200, 230, 250, 270]) {
  for (const vp of viewports) {
    const dim = estimateBubbleDimensions(bLine.hanzi, bLine.vietnamese, mw, vp.width);
    console.log(`mw=${mw} @ ${vp.name} (${vp.width}x${vp.height}): width=${dim.width} (${(dim.width/vp.width*100).toFixed(1)}%), height=${dim.height} (${(dim.height/vp.height*100).toFixed(1)}%), lines: hanzi=${dim.hanziLines}, vn=${dim.vnLines}`);
  }
}
