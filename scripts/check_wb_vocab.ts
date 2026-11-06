import { HSK1_WORKBOOK_LESSONS } from '../src/data/hsk1WorkbookData.js';
import { HSK2_WORKBOOK_LESSONS } from '../src/data/hsk2WorkbookData.js';
import { HSK3_WORKBOOK_LESSONS } from '../src/data/hsk3WorkbookData.js';
import { HSK4_WORKBOOK_LESSONS } from '../src/data/hsk4WorkbookData.js';
import { HSK5_WORKBOOK_LESSONS } from '../src/data/hsk5WorkbookData.js';
import { HSK6_WORKBOOK_LESSONS } from '../src/data/hsk6WorkbookData.js';

function countWbWords(lessons: any[], level: number) {
  const words: any[] = [];
  for (const l of lessons) {
    if (l.expansionDrills?.baseWords) {
      for (const w of l.expansionDrills.baseWords) {
        words.push({ ...w, level });
      }
    }
    if (l.expansionDrills?.compounds) {
      for (const c of l.expansionDrills.compounds) {
        words.push({ hanzi: c.combinedHanzi, pinyin: c.pinyin, meaning: c.meaning, level });
      }
    }
    if (l.listenAndReadDrills?.audioDrillList) {
      for (const a of l.listenAndReadDrills.audioDrillList) {
        words.push({ hanzi: a.hanzi, pinyin: a.pinyin, meaning: a.label, level });
      }
    }
  }
  return words;
}

const w1 = countWbWords(HSK1_WORKBOOK_LESSONS, 1);
const w2 = countWbWords(HSK2_WORKBOOK_LESSONS, 2);
const w3 = countWbWords(HSK3_WORKBOOK_LESSONS, 3);
const w4 = countWbWords(HSK4_WORKBOOK_LESSONS, 4);
const w5 = countWbWords(HSK5_WORKBOOK_LESSONS, 5);
const w6 = countWbWords(HSK6_WORKBOOK_LESSONS, 6);

console.log('WB Vocab counts: HSK 1:', w1.length, 'HSK 2:', w2.length, 'HSK 3:', w3.length, 'HSK 4:', w4.length, 'HSK 5:', w5.length, 'HSK 6:', w6.length);
