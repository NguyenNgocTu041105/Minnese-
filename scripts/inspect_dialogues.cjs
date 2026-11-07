const fs = require('fs');

// Read newHsk1BookData.ts
const content = fs.readFileSync('src/data/newHsk1BookData.ts', 'utf8');

// Match each text block: id, title, speakerAnchors, lines
const textBlocks = content.split(/id:\s*["']hsk1-l/g).slice(1);
console.log('Found text blocks:', textBlocks.length);

const results = [];
for (const block of textBlocks) {
  const fullBlock = 'id: "hsk1-l' + block;
  const idMatch = fullBlock.match(/id:\s*["'](hsk1-l\d+-t\d+)["']/);
  const titleMatch = fullBlock.match(/title:\s*["'](.*?)["']/);
  const contextMatch = fullBlock.match(/context:\s*["'](.*?)["']/);
  
  // Speakers
  const speakerRegex = /speaker:\s*["'](.*?)["']/g;
  let spMatch;
  const speakers = [];
  while ((spMatch = speakerRegex.exec(fullBlock)) !== null) {
    const rawSpeaker = spMatch[1];
    const cleanSpeaker = rawSpeaker.replace(/\s*\(.*?\)/, '').trim();
    if (!speakers.includes(cleanSpeaker)) {
      speakers.push(cleanSpeaker);
    }
  }

  // speakerAnchors
  const anchorMatch = fullBlock.match(/speakerAnchors:\s*(\{.*?\})/);
  let anchors = null;
  if (anchorMatch) {
    try {
      anchors = eval('(' + anchorMatch[1] + ')');
    } catch (e) {
      anchors = anchorMatch[1];
    }
  }

  if (idMatch) {
    results.push({
      id: idMatch[1],
      title: titleMatch ? titleMatch[1] : '',
      context: contextMatch ? contextMatch[1] : '',
      speakers,
      anchors
    });
  }
}

console.log('Parsed results count:', results.length);
fs.writeFileSync('.agents/teamwork/worker_m2_bubble/hsk1_dialogues_parsed.json', JSON.stringify(results, null, 2));
console.log('Saved to .agents/teamwork/worker_m2_bubble/hsk1_dialogues_parsed.json');
