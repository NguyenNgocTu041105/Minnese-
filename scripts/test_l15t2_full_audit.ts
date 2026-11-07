import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { auditDialogue, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === did)!;

const testLayout: Record<string, CharacterBubbleConfig> = {
  '李文': {
    mouthTarget: scene['李文'].mouth, // { x: 51.5, y: 45.5 }
    placement: 'custom',
    bubblePos: { x: 8, y: 80 },
    tailOrigin: 'left',
    maxWidth: 240,
  },
  '安妮': {
    mouthTarget: scene['安妮'].mouth, // { x: 70.5, y: 53.5 }
    placement: 'custom',
    bubblePos: { x: 6, y: 78 },
    tailOrigin: 'left',
    maxWidth: 265,
  },
  '白家月': {
    mouthTarget: scene['白家月'].mouth, // { x: 22.0, y: 56.5 }
    placement: 'custom',
    bubblePos: { x: 4, y: 74 },
    tailOrigin: 'left',
    maxWidth: 220,
  },
  '陈天中': {
    mouthTarget: scene['陈天中'].mouth, // { x: 78.5, y: 54.0 }
    placement: 'custom',
    bubblePos: { x: 84, y: 18 },
    tailOrigin: 'bottom-left',
    maxWidth: 180,
  },
};

const res = auditDialogue(did, text.lines, testLayout);
console.log('Result status:', res.status);
console.log('Face collisions:', res.faceCollisions);
console.log('Tail crossings:', res.tailCrossings);
console.log('Boundary violations:', res.boundaryViolations);
console.log('Critical issues count:', res.criticalIssues.length);
res.criticalIssues.forEach(i => console.log('  ', i));
