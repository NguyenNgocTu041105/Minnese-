import { getTextbookLessons, getRawWorkbookLessons } from '../src/data/workbookEnricher.js';

for (let lvl = 1; lvl <= 6; lvl++) {
  const tb = getTextbookLessons(lvl);
  const wb = getRawWorkbookLessons(lvl);
  const tbWords = new Set<string>();
  tb.forEach(l => (l.vocabulary || []).forEach(w => tbWords.add(w.hanzi)));
  console.log(`Level ${lvl}: ${tb.length} textbook lessons, ${tbWords.size} unique vocab. ${wb.length} wb lessons.`);
}
