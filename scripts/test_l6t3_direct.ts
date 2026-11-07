import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { auditDialogue, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l6-t3';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 6)!;
const text = lesson.texts.find(t => t.id === did)!;

const testLayout: Record<string, CharacterBubbleConfig> = {
  '刘小明': {
    mouthTarget: scene['刘小明'].mouth, // { x: 26.5, y: 54 }
    placement: 'custom',
    bubblePos: { x: 12, y: 20 },
    tailOrigin: 'bottom',
    maxWidth: 130,
  },
  '刘明': {
    mouthTarget: scene['刘明'].mouth, // { x: 39.5, y: 38.5 }
    placement: 'custom',
    bubblePos: { x: 38, y: 14 },
    tailOrigin: 'bottom',
    maxWidth: 140,
  },
  '王一雪': {
    mouthTarget: scene['王一雪'].mouth, // { x: 59.5, y: 40.5 }
    placement: 'custom',
    bubblePos: { x: 58, y: 84 },
    tailOrigin: 'top',
    maxWidth: 160,
  },
  '刘小雪': {
    mouthTarget: scene['刘小雪'].mouth, // { x: 78, y: 53.5 }
    placement: 'custom',
    bubblePos: { x: 86, y: 20 },
    tailOrigin: 'bottom',
    maxWidth: 150,
  },
};

const audit = auditDialogue(did, text.lines, testLayout);
console.log('Result for l6-t3:');
console.log('Status:', audit.status);
console.log('Face collisions:', audit.faceCollisions);
console.log('Tail crossings:', audit.tailCrossings);
console.log('Boundary violations:', audit.boundaryViolations);
audit.criticalIssues.forEach(i => console.log('  ', i));
