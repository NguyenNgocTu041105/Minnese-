import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { auditDialogue, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === did)!;

// Let's test combinations of bubblePos for [李文, 安妮, 白家月, 陈天中]
// that maintain at least 10% distance between each other and minimize issues.

const liPositions: CharacterBubbleConfig[] = [
  { mouthTarget: scene['李文'].mouth, placement: 'custom', bubblePos: { x: 50, y: 12 }, tailOrigin: 'bottom', maxWidth: 180 },
  { mouthTarget: scene['李文'].mouth, placement: 'custom', bubblePos: { x: 42, y: 78 }, tailOrigin: 'left', maxWidth: 220 },
  { mouthTarget: scene['李文'].mouth, placement: 'custom', bubblePos: { x: 48, y: 80 }, tailOrigin: 'left', maxWidth: 220 },
  { mouthTarget: scene['李文'].mouth, placement: 'custom', bubblePos: { x: 52, y: 78 }, tailOrigin: 'right', maxWidth: 220 },
];

const anPositions: CharacterBubbleConfig[] = [
  { mouthTarget: scene['安妮'].mouth, placement: 'custom', bubblePos: { x: 80, y: 82 }, tailOrigin: 'right', maxWidth: 240 },
  { mouthTarget: scene['安妮'].mouth, placement: 'custom', bubblePos: { x: 74, y: 80 }, tailOrigin: 'left', maxWidth: 240 },
  { mouthTarget: scene['安妮'].mouth, placement: 'custom', bubblePos: { x: 84, y: 18 }, tailOrigin: 'bottom-left', maxWidth: 180 },
];

const bjPositions: CharacterBubbleConfig[] = [
  { mouthTarget: scene['白家月'].mouth, placement: 'custom', bubblePos: { x: 10, y: 76 }, tailOrigin: 'left', maxWidth: 220 },
  { mouthTarget: scene['白家月'].mouth, placement: 'custom', bubblePos: { x: 12, y: 78 }, tailOrigin: 'left', maxWidth: 220 },
  { mouthTarget: scene['白家月'].mouth, placement: 'custom', bubblePos: { x: 14, y: 76 }, tailOrigin: 'left', maxWidth: 220 },
];

const ctPositions: CharacterBubbleConfig[] = [
  { mouthTarget: scene['陈天中'].mouth, placement: 'custom', bubblePos: { x: 88, y: 18 }, tailOrigin: 'bottom-left', maxWidth: 180 },
  { mouthTarget: scene['陈天中'].mouth, placement: 'custom', bubblePos: { x: 84, y: 16 }, tailOrigin: 'bottom-left', maxWidth: 180 },
];

let bestRes: any = null;
let minTotal = 999;
let bestLayout: any = null;

for (const cLi of liPositions) {
  for (const cAn of anPositions) {
    for (const cBj of bjPositions) {
      for (const cCt of ctPositions) {
        const layout: Record<string, CharacterBubbleConfig> = {
          '李文': cLi,
          '安妮': cAn,
          '白家月': cBj,
          '陈天中': cCt,
        };

        const res = auditDialogue(did, text.lines, layout);
        const total = res.faceCollisions * 10 + res.tailCrossings * 5 + res.boundaryViolations * 10 + res.speakerProximityViolations;
        if (total < minTotal) {
          minTotal = total;
          bestRes = res;
          bestLayout = layout;
          console.log(`New best (score ${total}): faceColl=${res.faceCollisions}, tailCross=${res.tailCrossings}, prox=${res.speakerProximityViolations}`);
          if (res.status === 'PASS') {
            console.log('PERFECT PASS FOR L15T2!');
            break;
          }
        }
      }
    }
  }
}

console.log('Best Layout:', JSON.stringify(bestLayout, null, 2));
console.log('Status:', bestRes.status);
console.log('Face coll:', bestRes.faceCollisions);
console.log('Tail cross:', bestRes.tailCrossings);
console.log('Prox:', bestRes.speakerProximityViolations);
bestRes.criticalIssues.forEach((i: string) => console.log('  ', i));
