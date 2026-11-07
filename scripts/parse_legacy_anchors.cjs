const fs = require('fs');

const lines = fs.readFileSync('src/data/coursebookCharacterAnchors.ts', 'utf8').split('\n');
const scenes = {};
for (const line of lines) {
  const match = line.match(/'(hsk1-l\d+-t\d+)':\s*(\{.*\}),?/);
  if (match) {
    try {
      const parsed = eval('(' + match[2] + ')');
      scenes[match[1]] = parsed;
    } catch (e) {
      console.error('Error parsing line:', line);
    }
  }
}

console.log('HSK 1 scenes parsed:', Object.keys(scenes).length);
fs.writeFileSync('.agents/teamwork/worker_m2_bubble/hsk1_legacy_anchors.json', JSON.stringify(scenes, null, 2));
