import { resolveSceneKey, SceneKey } from '../src/components/HSKIllustrationCanvas';

console.log('===============================================================');
console.log('ADVERSARIAL STRESS TEST: HSKIllustrationCanvas Unit & Boundary');
console.log('===============================================================');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    console.error(`[FAIL] ${message}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Boundary & Edge Inputs for resolveSceneKey
// ---------------------------------------------------------------------------
console.log('\n--- 1. Boundary & Nil/Malformed Inputs ---');
assert(resolveSceneKey(undefined) === null, 'undefined returns null');
assert(resolveSceneKey('') === null, 'empty string returns null');
assert(resolveSceneKey('   ') === null, 'whitespace string returns null');
assert(resolveSceneKey('\t\n\r') === null, 'control chars string returns null');

// ---------------------------------------------------------------------------
// 2. All 27 Canonical Keys Direct Matching
// ---------------------------------------------------------------------------
console.log('\n--- 2. All 27 Canonical Keys ---');
const all27Keys: SceneKey[] = [
  'taxi', 'apple', 'reading', 'rain', 'writing', 'airplane', 'train',
  'banana', 'watermelon', 'sleeping', 'water', 'sunny', 'wind', 'singing',
  'dance', 'coffee', 'tea', 'movie', 'phone', 'cat', 'hospital', 'rice',
  'bookshelf', 'running', 'swimming', 'soccer', 'handshake'
];

for (const key of all27Keys) {
  assert(resolveSceneKey(key) === key, `Exact canonical key '${key}' resolves to '${key}'`);
  assert(resolveSceneKey(key.toUpperCase()) === key, `Uppercase canonical key '${key.toUpperCase()}' resolves to '${key}'`);
  assert(resolveSceneKey(`  ${key}  `) === key, `Padded canonical key '  ${key}  ' resolves to '${key}'`);
}

// ---------------------------------------------------------------------------
// 3. Multi-Lingual Keywords & Emojis per Scene
// ---------------------------------------------------------------------------
console.log('\n--- 3. Multi-Lingual & Semantic Mapping Tests ---');
const sceneExpectations: Record<SceneKey, string[]> = {
  taxi: ['🚕 Chiếc taxi vàng', '🚖 Xe taxi', 'taxi', 'chūzūchē', 'chuzuche', '出租车'],
  apple: ['🍎 Quả táo đỏ', '🍏 Táo xanh', 'apple', 'píngguǒ', 'táo', '苹果'],
  reading: ['📖 Cậu bé đọc sách', '📕 Đọc sách', 'reading', 'kànshū', 'đọc sách', '看书'],
  rain: ['🌧️ Trời mưa to', '⛈️ Mưa rào', 'rain', 'xiàyǔ', 'mưa', '下雨'],
  writing: ['✍️ Học sinh viết chữ', 'writing', 'xiězì', 'viết chữ', '写字'],
  airplane: ['✈️ Máy bay bay lượn', 'plane', 'fēijī', 'máy bay', '飞机'],
  train: ['🚆 Tàu hỏa cao tốc', '🚂 Tàu hỏa', 'train', 'huǒchē', 'tàu hỏa', '火车'],
  banana: ['🍌 Quả chuối vàng', 'banana', 'xiāngjiāo', 'chuối', '香蕉'],
  watermelon: ['🍉 Quả dưa hấu mát lạnh', 'watermelon', 'xīguā', 'dưa hấu', '西瓜'],
  sleeping: ['🛏️ Đi ngủ', 'sleep', 'shuìjiào', 'ngủ', '睡觉'],
  water: ['🥤 Cốc uống nước', 'drink', 'hēshuǐ', 'uống nước', '喝水'],
  sunny: ['☀️ Trời nắng rực rỡ', 'sun', 'qíngtiān', 'nắng', '晴天'],
  wind: ['💨 Gió thổi mạnh', 'wind', 'guāfēng', 'gió', '刮风'],
  singing: ['🎤 Đang hát', 'sing', 'chànggē', 'hát', '唱歌'],
  dance: ['💃 Khiêu vũ', 'dance', 'tiàowǔ', 'khiêu vũ', 'nhảy múa', '跳舞'],
  coffee: ['☕ Cà phê thơm', 'coffee', 'kāfēi', 'cà phê', '咖啡'],
  tea: ['🍵 Uống trà nóng', 'tea', 'chá', 'uống trà', 'chè', '茶'],
  movie: ['🎬 Xem phim rạp', 'film', 'diànyǐng', 'xem phim', '看电影'],
  phone: ['📱 Gọi điện thoại', 'call', 'diànhuà', 'điện thoại', '打电话'],
  cat: ['🐱 Mèo con xinh xắn', 'cat', 'xiǎomāo', 'mèo', '小猫'],
  hospital: ['🏥 Bác sĩ bệnh viện', 'hospital', 'yīyuàn', 'bệnh viện', '医院'],
  rice: ['🍚 Bát cơm trắng', 'rice', 'mǐfàn', 'cơm', '米饭'],
  bookshelf: ['📚 Giá sách lớn', 'books', 'shūjià', 'giá sách', '书架'],
  running: ['🏃 Chạy bộ thể dục', 'run', 'pǎobù', 'chạy bộ', '跑步'],
  swimming: ['🏊 Bơi lội dưới nước', 'swim', 'yóuyǒng', 'bơi lội', 'bơi', '游泳'],
  soccer: ['⚽ Đá bóng trên sân', 'football', 'zúqiú', 'đá bóng', 'bóng đá', '足球'],
  handshake: ['🤝 Bắt tay hợp tác', 'handshake', 'wòshǒu', 'bắt tay', '握手'],
};

for (const [expectedKey, variations] of Object.entries(sceneExpectations)) {
  for (const variant of variations) {
    const resolved = resolveSceneKey(variant);
    assert(
      resolved === expectedKey,
      `Variation '${variant}' must resolve to '${expectedKey}', got '${resolved}'`
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Random / Adversarial Strings (Negative Tests)
// ---------------------------------------------------------------------------
console.log('\n--- 4. Adversarial Negative Inputs ---');
const negativeInputs = [
  'random_unknown_keyword_12345',
  'asdfghjklqwertyuiop',
  '1234567890',
  '!@#$%^&*()_+=-~`[]{}|:;"\'<>,.?/',
  'undefined',
  'null',
  'NaN',
  '[object Object]',
  '<script>alert("xss")</script>',
  'DROP TABLE questions;--',
  '   ---   ',
  '🦄 🌈 🍕 🍔 🚀', // Emojis with no mapping in HSK illustration
];

for (const neg of negativeInputs) {
  const result = resolveSceneKey(neg);
  assert(result === null, `Negative input '${neg}' must return null, got '${result}'`);
}

// ---------------------------------------------------------------------------
// 5. Stress Fuzzy Fuzzing (10,000 iterations)
// ---------------------------------------------------------------------------
console.log('\n--- 5. Stress Fuzzing (10,000 fuzzy iterations) ---');
const seedChars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/ \t\n\u4E00\u4E8C\u4E09\uD83D\uDE95';
let fuzzErrorCount = 0;

for (let i = 0; i < 10000; i++) {
  const len = Math.floor(Math.random() * 50);
  let fuzzyStr = '';
  for (let j = 0; j < len; j++) {
    fuzzyStr += seedChars[Math.floor(Math.random() * seedChars.length)];
  }
  try {
    const res = resolveSceneKey(fuzzyStr);
    if (res !== null && !all27Keys.includes(res)) {
      fuzzErrorCount++;
    }
  } catch (err) {
    fuzzErrorCount++;
    console.error(`Fuzzing error on input '${fuzzyStr}':`, err);
  }
}
assert(fuzzErrorCount === 0, '10,000 fuzzy iterations executed without throwing or returning invalid keys');

// ---------------------------------------------------------------------------
// 6. Direct Image URL & Base64 Detection Logic
// ---------------------------------------------------------------------------
console.log('\n--- 6. Image URL & Base64 Detection Rules ---');
function checkIsDirectImage(imageUrl?: string, imageError: boolean = false): boolean {
  return Boolean(
    imageUrl &&
    !imageError &&
    (imageUrl.startsWith('http://') ||
     imageUrl.startsWith('https://') ||
     imageUrl.startsWith('/') ||
     imageUrl.startsWith('data:image/'))
  );
}

assert(checkIsDirectImage('https://example.com/taxi.png') === true, 'https URL detected as direct image');
assert(checkIsDirectImage('http://example.com/taxi.png') === true, 'http URL detected as direct image');
assert(checkIsDirectImage('/images/hsk/apple.svg') === true, 'root-relative path detected as direct image');
assert(checkIsDirectImage('data:image/svg+xml;base64,PHN2Zw==') === true, 'base64 data URI detected as direct image');
assert(checkIsDirectImage('data:image/png;base64,iVBORw0KGgo=') === true, 'base64 png data URI detected as direct image');
assert(checkIsDirectImage('https://example.com/taxi.png', true) === false, 'Errored image URL is NOT direct image (falls back)');
assert(checkIsDirectImage('javascript:alert(1)') === false, 'javascript URI rejected as direct image');
assert(checkIsDirectImage('file:///c:/secret') === false, 'file URI rejected as direct image');
assert(checkIsDirectImage('relative/path/image.jpg') === false, 'non-root relative path rejected as direct image');
assert(checkIsDirectImage('') === false, 'empty string rejected as direct image');
assert(checkIsDirectImage(undefined) === false, 'undefined rejected as direct image');

// ---------------------------------------------------------------------------
// 7. Lightbox Gallery Index Wrap-around Math Integrity
// ---------------------------------------------------------------------------
console.log('\n--- 7. Lightbox Gallery Navigation Wrap-around Math Integrity ---');
function getPrevIndex(curr: number, len: number): number {
  return (curr - 1 + len) % len;
}
function getNextIndex(curr: number, len: number): number {
  return (curr + 1) % len;
}

// 3-option gallery: indices 0, 1, 2
assert(getPrevIndex(0, 3) === 2, '3-opt: Prev on 0 wraps to 2');
assert(getNextIndex(2, 3) === 0, '3-opt: Next on 2 wraps to 0');
assert(getPrevIndex(1, 3) === 0, '3-opt: Prev on 1 goes to 0');
assert(getNextIndex(1, 3) === 2, '3-opt: Next on 1 goes to 2');

// 6-option gallery: indices 0, 1, 2, 3, 4, 5
assert(getPrevIndex(0, 6) === 5, '6-opt: Prev on 0 wraps to 5');
assert(getNextIndex(5, 6) === 0, '6-opt: Next on 5 wraps to 0');
assert(getPrevIndex(3, 6) === 2, '6-opt: Prev on 3 goes to 2');
assert(getNextIndex(3, 6) === 4, '6-opt: Next on 3 goes to 4');

// Single-item gallery (len 1)
assert(getPrevIndex(0, 1) === 0, '1-opt: Prev on 0 stays 0');
assert(getNextIndex(0, 1) === 0, '1-opt: Next on 0 stays 0');

console.log('\n===============================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
