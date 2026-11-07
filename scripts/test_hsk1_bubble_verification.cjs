const fs = require('fs');

// 1. Check hsk1BubbleLayouts.ts content
const layoutsContent = fs.readFileSync('src/data/hsk1BubbleLayouts.ts', 'utf8');

// Parse HSK1_BUBBLE_LAYOUTS
const match = layoutsContent.match(/export const HSK1_BUBBLE_LAYOUTS: HSK1SceneBubbleMap = (\{[\s\S]*?\n\};)/);
if (!match) {
  console.error('FAIL: Could not parse HSK1_BUBBLE_LAYOUTS from hsk1BubbleLayouts.ts');
  process.exit(1);
}

const layouts = eval('(' + match[1].replace(/;\s*$/, '') + ')');
const sceneKeys = Object.keys(layouts);
console.log(`Verifying ${sceneKeys.length} scenes in HSK1_BUBBLE_LAYOUTS...`);

if (sceneKeys.length !== 45) {
  console.error(`FAIL: Expected 45 scenes, found ${sceneKeys.length}`);
  process.exit(1);
}

// Check every lesson L1-L15, T1-T3
for (let l = 1; l <= 15; l++) {
  for (let t = 1; t <= 3; t++) {
    const id = `hsk1-l${l}-t${t}`;
    if (!layouts[id]) {
      console.error(`FAIL: Missing scene ${id}`);
      process.exit(1);
    }
  }
}
console.log('PASS: All 45 dialogue IDs from hsk1-l1-t1 to hsk1-l15-t3 are present.');

// Check character configurations in each scene
let totalCharacters = 0;
for (const [sceneId, charMap] of Object.entries(layouts)) {
  const chars = Object.keys(charMap);
  if (chars.length < 2) {
    console.error(`FAIL: Scene ${sceneId} has fewer than 2 characters: ${chars.length}`);
    process.exit(1);
  }

  for (const [charName, conf] of Object.entries(charMap)) {
    totalCharacters++;
    // mouthTarget
    if (!conf.mouthTarget || typeof conf.mouthTarget.x !== 'number' || typeof conf.mouthTarget.y !== 'number') {
      console.error(`FAIL: ${sceneId} ${charName} missing or invalid mouthTarget`, conf);
      process.exit(1);
    }
    if (conf.mouthTarget.x < 10 || conf.mouthTarget.x > 90 || conf.mouthTarget.y < 15 || conf.mouthTarget.y > 85) {
      console.error(`FAIL: ${sceneId} ${charName} mouthTarget out of reasonable bounds (10-90, 15-85):`, conf.mouthTarget);
      process.exit(1);
    }

    // placement
    const validPlacements = ['top', 'top-left', 'top-right', 'left', 'right', 'bottom-left', 'bottom-right', 'custom'];
    if (!validPlacements.includes(conf.placement)) {
      console.error(`FAIL: ${sceneId} ${charName} invalid placement: ${conf.placement}`);
      process.exit(1);
    }

    // bubblePos
    if (conf.bubblePos) {
      if (conf.bubblePos.x < 10 || conf.bubblePos.x > 90 || conf.bubblePos.y < 10 || conf.bubblePos.y > 85) {
        console.error(`FAIL: ${sceneId} ${charName} bubblePos out of safe bounds (10-90, 10-85):`, conf.bubblePos);
        process.exit(1);
      }

      // Check distance between bubblePos and mouthTarget
      const dx = conf.bubblePos.x - conf.mouthTarget.x;
      const dy = conf.bubblePos.y - conf.mouthTarget.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        console.error(`FAIL: ${sceneId} ${charName} bubblePos is too close to mouthTarget (${dist.toFixed(1)}%):`, conf);
        process.exit(1);
      }
    }
  }
}
console.log(`PASS: Verified ${totalCharacters} character configurations across all 45 scenes.`);

// 2. Verify HSK 2 isolation in coursebookCharacterAnchors.ts
const anchorFile = fs.readFileSync('src/data/coursebookCharacterAnchors.ts', 'utf8');
const hsk2Matches = anchorFile.match(/'hsk2-l\d+-t\d+':/g);
console.log(`PASS: Found ${hsk2Matches ? hsk2Matches.length : 0} HSK 2 entries in coursebookCharacterAnchors.ts (expected 60).`);
if (!hsk2Matches || hsk2Matches.length !== 60) {
  console.error('FAIL: HSK 2 anchors in coursebookCharacterAnchors.ts modified or missing!');
  process.exit(1);
}

// 3. Verify CoursebookView.tsx has strict isHsk1 branching
const coursebookContent = fs.readFileSync('src/components/Coursebook/CoursebookView.tsx', 'utf8');
if (!coursebookContent.includes("textItem.id.startsWith('hsk1-')")) {
  console.error("FAIL: CoursebookView.tsx does not branch strictly on textItem.id.startsWith('hsk1-')");
  process.exit(1);
}
if (!coursebookContent.includes('Hsk1SpeechBubble')) {
  console.error('FAIL: CoursebookView.tsx does not use Hsk1SpeechBubble');
  process.exit(1);
}
if (!coursebookContent.includes('computeTailGeometry')) {
  console.error('FAIL: CoursebookView.tsx does not include computeTailGeometry');
  process.exit(1);
}
console.log('PASS: CoursebookView.tsx contains strict HSK 1 branching and dynamic directional tail integration.');

console.log('\n=== ALL HSK 1 BUBBLE VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
