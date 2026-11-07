import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import {
  auditDialogue,
  auditDialogueLine,
  getResponsiveViewports,
  CharacterBubbleConfig,
} from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t3';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
let lines: any[] = [];
for (const lesson of NEW_HSK1_FULL_LESSONS) {
  for (const text of lesson.texts) {
    if (text.id === did) {
      lines = text.lines;
      break;
    }
  }
}

// 王一飞 config per adversarial suite:
const wangConfig: CharacterBubbleConfig = {
  mouthTarget: scene['王一飞'].mouth,
  placement: 'top',
  bubblePos: { x: 50, y: 12 },
  tailOrigin: 'bottom',
  maxWidth: 310,
};

// Check if wangConfig passes auditDialogueLine for all his lines
const wangLines = lines.filter((l) => l.speaker.includes('王一飞'));
let wangPass = true;
for (let lIdx = 0; lIdx < wangLines.length; lIdx++) {
  for (const vp of viewports) {
    const res = auditDialogueLine(did, lIdx, '王一飞', wangLines[lIdx].hanzi, wangLines[lIdx].vietnamese || '', vp, wangConfig, scene, meta);
    if (res.issues.length > 0) {
      console.log('Wang issue:', res.issues);
      wangPass = false;
      break;
    }
  }
}
console.log('Wang config passes auditLine:', wangPass);

// Find passing candidates for 白家月 and 安妮
const candidatesBai: CharacterBubbleConfig[] = [];
const candidatesAnnie: CharacterBubbleConfig[] = [];

const baiLines = lines.filter((l) => l.speaker.includes('白家月'));
const annieLines = lines.filter((l) => l.speaker.includes('安妮'));

for (let mw of [110, 130, 150, 180, 220]) {
  for (let x = 8; x <= 92; x += 2) {
    for (let y = 8; y <= 90; y += 2) {
      for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
        // 白家月
        const cfgB: CharacterBubbleConfig = {
          mouthTarget: scene['白家月'].mouth,
          placement: 'custom',
          bubblePos: { x, y },
          tailOrigin: to,
          maxWidth: mw,
        };
        let okB = true;
        for (let lIdx = 0; lIdx < baiLines.length; lIdx++) {
          for (const vp of viewports) {
            const res = auditDialogueLine(did, lIdx, '白家月', baiLines[lIdx].hanzi, baiLines[lIdx].vietnamese || '', vp, cfgB, scene, meta);
            if (res.issues.length > 0) { okB = false; break; }
          }
          if (!okB) break;
        }
        if (okB) candidatesBai.push(cfgB);

        // 安妮
        const cfgA: CharacterBubbleConfig = {
          mouthTarget: scene['安妮'].mouth,
          placement: 'custom',
          bubblePos: { x, y },
          tailOrigin: to,
          maxWidth: mw,
        };
        let okA = true;
        for (let lIdx = 0; lIdx < annieLines.length; lIdx++) {
          for (const vp of viewports) {
            const res = auditDialogueLine(did, lIdx, '安妮', annieLines[lIdx].hanzi, annieLines[lIdx].vietnamese || '', vp, cfgA, scene, meta);
            if (res.issues.length > 0) { okA = false; break; }
          }
          if (!okA) break;
        }
        if (okA) candidatesAnnie.push(cfgA);
      }
    }
  }
}

console.log(`Bai: ${candidatesBai.length}, Annie: ${candidatesAnnie.length}`);

// Combine
const stepB = Math.max(1, Math.floor(candidatesBai.length / 40));
const stepA = Math.max(1, Math.floor(candidatesAnnie.length / 40));

let found = false;
for (let i = 0; i < candidatesBai.length; i += stepB) {
  const cBai = candidatesBai[i];
  const dW1 = Math.hypot(cBai.bubblePos!.x - wangConfig.bubblePos!.x, cBai.bubblePos!.y - wangConfig.bubblePos!.y);
  if (dW1 < 10) continue;

  for (let j = 0; j < candidatesAnnie.length; j += stepA) {
    const cAnnie = candidatesAnnie[j];
    const dW2 = Math.hypot(cAnnie.bubblePos!.x - wangConfig.bubblePos!.x, cAnnie.bubblePos!.y - wangConfig.bubblePos!.y);
    const dBA = Math.hypot(cBai.bubblePos!.x - cAnnie.bubblePos!.x, cBai.bubblePos!.y - cAnnie.bubblePos!.y);
    if (dW2 < 10 || dBA < 10) continue;

    const testLayout = {
      '白家月': cBai,
      '王一飞': wangConfig,
      '安妮': cAnnie,
    };

    const audit = auditDialogue(did, lines, testLayout);
    if (audit.status === 'PASS') {
      console.log(`>>> FOUND PASSING COMBO FOR ${did}!`);
      console.log(JSON.stringify(testLayout, null, 2));
      found = true;
      break;
    }
  }
  if (found) break;
}
if (!found) console.log(`Failed to find combo for ${did}`);
