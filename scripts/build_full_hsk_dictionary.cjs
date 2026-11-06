const fs = require('fs');
const readline = require('readline');

// Mapping for characters with specific preferred Sino-Vietnamese readings
const OVERRIDE_HANVIET = {
  '儿': 'Nhi',
  '兒': 'Nhi',
  '些': 'Tỉ',
  '生': 'Sinh',
  '啤': 'Tỳ',
  '乒': 'Binh',
  '乓': 'Bàng',
  '嗯': 'Ân',
  '羡': 'Tiễn',
  '胳': 'Cách',
  '捡': 'Kiểm',
  '搞': 'Cảo',
  '嘿': 'Hắc',
  '呗': 'Bái',
  '啰': 'La',
  '嗦': 'Tác',
  '咚': 'Đông',
  '啪': 'Phách',
  '哔': 'Tất',
  '哩': 'Lý',
  '啦': 'Lạp',
  '咔': 'Kháp',
  '喳': 'Tra',
  '嗡': 'Ông',
  '嘀': 'Đích',
  '咕': 'Cô',
  '噜': 'Lỗ'
};

const POS_MAP = {
  'n': 'Danh từ',
  'noun': 'Danh từ',
  'v': 'Động từ',
  'verb': 'Động từ',
  'adj': 'Tính từ',
  'adjective': 'Tính từ',
  'adv': 'Phó từ',
  'adverb': 'Phó từ',
  'pron': 'Đại từ',
  'pronoun': 'Đại từ',
  'num': 'Số từ',
  'numeral': 'Số từ',
  'm': 'Lượng từ',
  'classifier': 'Lượng từ',
  'prep': 'Giới từ',
  'preposition': 'Giới từ',
  'conj': 'Liên từ',
  'conjunction': 'Liên từ',
  'aux': 'Trợ từ',
  'int': 'Thán từ',
  'prefix': 'Tiền tố',
  'suffix': 'Hậu tố',
  'phonetic': 'Từ tượng thanh',
  'phrase': 'Cụm từ',
  'idiom': 'Thành ngữ',
};

function formatPOS(rawPos) {
  if (!rawPos) return 'Từ vựng';
  const parts = rawPos.split('/').map(p => p.trim().toLowerCase());
  const translated = parts.map(p => POS_MAP[p] || p);
  return translated.join(' / ');
}

// Clean definitions: filter out noise like "dùng trong ...", "họ (tên người)...", "biến thể er hoá..."
function cleanMeanings(meanings) {
  const good = meanings.filter(m => {
    const s = m.toLowerCase();
    if (s.startsWith('dùng trong ') || s.startsWith('họ ') || s.startsWith('tên một ') || s.includes('biến thể er')) {
      return false;
    }
    return true;
  });
  return good.length > 0 ? good : meanings;
}

async function buildFullDictionary() {
  console.log('1. Loading HanViet dictionary...');
  const hvRaw = JSON.parse(fs.readFileSync('data/cache/hanViet.json', 'utf8'));
  const charToHv = new Map();
  for (const [char, hv] of hvRaw.data) {
    const primary = hv.split(',')[0].trim();
    charToHv.set(char, primary.charAt(0).toUpperCase() + primary.slice(1).toLowerCase());
  }
  for (const [k, v] of Object.entries(OVERRIDE_HANVIET)) {
    charToHv.set(k, v);
  }

  function getWordHanViet(word) {
    const res = [];
    for (const ch of word) {
      if (charToHv.has(ch)) {
        res.push(charToHv.get(ch));
      } else {
        res.push(ch);
      }
    }
    return res.join(' ');
  }

  console.log('2. Loading CVDICT (Chinese - Vietnamese)...');
  const cvMap = new Map();
  const cvTradMap = new Map();
  const cvdictStream = fs.createReadStream('data/cache/CVDICT.u8', 'utf8');
  const rlCv = readline.createInterface({ input: cvdictStream, crlfDelay: Infinity });
  for await (const line of rlCv) {
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
    if (!m) continue;
    const [, trad, simp, , rawMeanings] = m;
    const meanings = rawMeanings.split('/').map(s => s.trim()).filter(Boolean);
    const cleaned = cleanMeanings(meanings);
    if (!cvMap.has(simp)) {
      cvMap.set(simp, cleaned);
      cvTradMap.set(simp, trad);
    } else {
      // If existing had "dùng trong", replace
      const existing = cvMap.get(simp);
      if (existing.length === 1 && (existing[0].startsWith('dùng trong') || existing[0].startsWith('họ '))) {
        cvMap.set(simp, cleaned);
      }
    }
  }

  console.log('3. Loading HSK 3.0 metadata (POS, Traditional)...');
  const posMap = new Map();
  const tradMap = new Map();
  const hskCsvStream = fs.createReadStream('data/inbox/hsk30-expanded.csv', 'utf8');
  const rlHskCsv = readline.createInterface({ input: hskCsvStream, crlfDelay: Infinity });
  let isFirst = true;
  for await (const line of rlHskCsv) {
    if (isFirst) { isFirst = false; continue; }
    const parts = line.split(',');
    const simp = parts[1];
    const trad = parts[2];
    const pos = parts[4];
    if (simp) {
      if (!posMap.has(simp) && pos) posMap.set(simp, pos);
      if (!tradMap.has(simp) && trad) tradMap.set(simp, trad);
    }
  }

  console.log('4. Loading Syllabus vocab.jsonl...');
  const syllabus = [];
  const vocabStream = fs.createReadStream('data/qbank/syllabus/vocab.jsonl', 'utf8');
  const rlVocab = readline.createInterface({ input: vocabStream, crlfDelay: Infinity });
  for await (const line of rlVocab) {
    if (!line.trim()) continue;
    syllabus.push(JSON.parse(line));
  }

  // Curated manual overrides for common words that need crisp Vietnamese definitions
  const MANUAL_VIETNAMESE = {
    '万': 'mười nghìn; vạn (10.000)',
    '新媒体': 'truyền thông mới; phương tiện truyền thông mới',
    '新能源': 'năng lượng mới; nguồn năng lượng mới',
    '一会儿': 'một lát; một lúc; một chốc',
    '一块儿': 'cùng nhau; cùng một chỗ',
    '一点儿': 'một chút; một ít',
    '有空儿': 'rảnh rỗi; có thời gian rảnh',
    '有点儿': 'hơi; hơi hơi; một chút',
    '一下儿': 'một lát; một chút; thử một lần',
    '词': 'từ; từ ngữ; lời ca',
    '词语': 'từ ngữ; từ vựng',
  };

  const fullVocabList = [];
  const countsByLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (let i = 0; i < syllabus.length; i++) {
    const item = syllabus[i];
    const hanzi = item.word;
    const level = item.level;
    countsByLevel[level] = (countsByLevel[level] || 0) + 1;

    // Vietnamese translation
    let vietnamese = '';
    if (MANUAL_VIETNAMESE[hanzi]) {
      vietnamese = MANUAL_VIETNAMESE[hanzi];
    } else if (cvMap.has(hanzi)) {
      const meanings = cvMap.get(hanzi);
      vietnamese = meanings.slice(0, 3).join('; ');
    } else {
      vietnamese = hanzi;
    }

    // Traditional
    const traditional = tradMap.get(hanzi) || cvTradMap.get(hanzi) || hanzi;

    // HanViet
    const hanViet = getWordHanViet(hanzi);

    // POS
    const rawPos = item.pos || posMap.get(hanzi) || '';
    const partOfSpeech = formatPOS(rawPos);

    // Pinyin
    const pinyin = item.pinyin;

    fullVocabList.push({
      id: `hsk${level}-${String(countsByLevel[level]).padStart(4, '0')}`,
      hanzi,
      traditional: traditional !== hanzi ? traditional : undefined,
      pinyin,
      hanViet,
      vietnamese,
      hskLevel: level,
      partOfSpeech,
    });
  }

  console.log('Total full syllabus items:', fullVocabList.length);
  console.log('Counts by level:', countsByLevel);

  // Write to src/data/fullHskSyllabusVocab.ts
  const outPathTs = 'src/data/fullHskSyllabusVocab.ts';
  const tsContent = `import { WordItem } from '../types';\n\nexport const FULL_HSK_SYLLABUS_VOCAB: WordItem[] = (${JSON.stringify(fullVocabList, null, 2)} as unknown as WordItem[]);\n`;
  fs.writeFileSync(outPathTs, tsContent, 'utf8');
  console.log(`Saved ${fullVocabList.length} items to ${outPathTs}`);
  console.log('File size:', (fs.statSync(outPathTs).size / 1024 / 1024).toFixed(2), 'MB');
}

buildFullDictionary().catch(console.error);
