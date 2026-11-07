const fs = require('fs');

const dialogues = JSON.parse(fs.readFileSync('.agents/teamwork/worker_m2_bubble/hsk1_dialogues_parsed.json', 'utf8'));
const legacyAnchors = JSON.parse(fs.readFileSync('.agents/teamwork/worker_m2_bubble/hsk1_legacy_anchors.json', 'utf8'));

for (const d of dialogues) {
  console.log(`=== ${d.id}: ${d.title} ===`);
  console.log(`Context: ${d.context.slice(0, 60)}...`);
  console.log('Speakers in dialogue:', d.speakers);
  console.log('Legacy anchors:', legacyAnchors[d.id]);
  // check if any speaker missing in legacy anchors
  for (const s of d.speakers) {
    const matched = Object.keys(legacyAnchors[d.id] || {}).find(k => s.includes(k) || k.includes(s));
    if (!matched) {
      console.warn(`  [MISSING ANCHOR] Speaker "${s}" not found in legacy anchors!`);
    }
  }
}
