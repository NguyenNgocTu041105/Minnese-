import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import {
  auditDialogueLine,
  getResponsiveViewports,
  CharacterBubbleConfig,
} from '../tests/hsk1_collision_engine';

const failedIds = ['hsk1-l1-t2', 'hsk1-l2-t1', 'hsk1-l6-t1', 'hsk1-l15-t1', 'hsk1-l15-t2', 'hsk1-l15-t3'];

for (const did of failedIds) {
  const meta = HSK1_SCENE_METADATA[did];
  const sceneRegistry = HSK1_CHARACTER_BOUNDING_BOXES[did];
  console.log(`\n======================================================`);
  console.log(`Analyzing ${did} (${meta.category}, aspect: ${meta.aspectRatioClass})`);
  console.log(`Characters:`, Object.keys(sceneRegistry));
  for (const [cname, rec] of Object.entries(sceneRegistry)) {
    console.log(`  ${cname}: mouth (${rec.mouth.x}, ${rec.mouth.y}), face [${rec.face.join(', ')}]`);
  }
}
