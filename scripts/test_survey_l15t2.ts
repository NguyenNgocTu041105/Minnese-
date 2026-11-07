import {
  auditDialogue,
  CharacterBubbleConfig,
} from '../tests/hsk1_collision_engine';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';

const did = 'hsk1-l15-t2';
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const lines = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!.texts.find(t => t.id === did)!.lines;

const surveyLayout: Record<string, CharacterBubbleConfig> = {
  '白家月': {
    mouthTarget: scene['白家月'].mouth,
    placement: 'left',
    bubblePos: { x: 16, y: 26 },
    tailOrigin: 'bottom',
    maxWidth: 180,
  },
  '李文': {
    mouthTarget: scene['李文'].mouth,
    placement: 'top',
    bubblePos: { x: 50, y: 14 },
    tailOrigin: 'bottom',
    maxWidth: 180,
  },
  '安妮': {
    mouthTarget: scene['安妮'].mouth,
    placement: 'top',
    bubblePos: { x: 66, y: 30 },
    tailOrigin: 'bottom',
    maxWidth: 180,
  },
  '陈天中': {
    mouthTarget: scene['陈天中'].mouth,
    placement: 'top-right',
    bubblePos: { x: 84, y: 18 },
    tailOrigin: 'bottom-left',
    maxWidth: 180,
  },
};

const res = auditDialogue(did, lines, surveyLayout);
console.log('Survey layout status:', res.status);
console.log('Face collisions:', res.faceCollisions);
console.log('Tail crossings:', res.tailCrossings);
console.log('Boundary violations:', res.boundaryViolations);
console.log('Issues:');
res.criticalIssues.forEach(i => console.log(' ', i));
