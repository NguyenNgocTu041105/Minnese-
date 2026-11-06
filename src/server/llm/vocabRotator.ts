import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { getQBankDbPath } from '../dbPaths.js';

export interface VocabItem {
  id: string;
  word: string;
  pinyin: string;
  pos?: string;
  level: number;
}

// In-memory cache for loaded syllabus items by level
const syllabusCache: Map<number, VocabItem[]> = new Map();

/**
 * Resets the in-memory syllabus cache (primarily used in automated test suites).
 */
export function clearSyllabusCache(): void {
  syllabusCache.clear();
}

/**
 * Loads vocabulary items for a specific HSK level from canonical syllabus JSONL files:
 * 1. data/qbank/syllabus/vocab.jsonl (Tier 1 headwords: 5,334 words)
 * 2. data/qbank/syllabus/vocab_restored.jsonl (Tier 2 restored polyphones/polysemes: 66 items)
 *
 * Strictly adheres to CLEC 2025 standard (HSK 1: exactly 300 words; HSK 1-6 cumulative: 5,400 items).
 * Does NOT read unverified CSV drafts from data/inbox/.
 */
export function loadSyllabusVocab(level: number): VocabItem[] {
  if (syllabusCache.has(level)) {
    return syllabusCache.get(level)!;
  }

  const items: VocabItem[] = [];
  const jsonlPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab.jsonl');
  const restoredPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab_restored.jsonl');

  // 1. Load canonical headwords from vocab.jsonl
  if (fs.existsSync(jsonlPath)) {
    try {
      const content = fs.readFileSync(jsonlPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const obj = JSON.parse(trimmed);
          const objLevel = Number(obj.level);
          if (objLevel === level && (obj.word || obj.simplified)) {
            const word = String(obj.word || obj.simplified).trim();
            items.push({
              id: obj.id || `w_${objLevel}_${word}`,
              word,
              pinyin: String(obj.pinyin || '').trim(),
              pos: obj.pos ? String(obj.pos).trim() : undefined,
              level: objLevel,
            });
          }
        } catch {}
      }
    } catch {}
  }

  // 2. Load restored polyphone/polyseme items from vocab_restored.jsonl (Levels 2–6)
  if (fs.existsSync(restoredPath)) {
    try {
      const content = fs.readFileSync(restoredPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const obj = JSON.parse(trimmed);
          const objLevel = Number(obj.level);
          if (objLevel === level && (obj.clean_word || obj.word)) {
            const word = String(obj.clean_word || obj.word).trim();
            items.push({
              id: obj.id || (obj.idx ? `w_restored_${objLevel}_${obj.idx}` : `w_restored_${objLevel}_${word}_${items.length + 1}`),
              word,
              pinyin: String(obj.pinyin || '').trim(),
              pos: obj.pos ? String(obj.pos).trim() : undefined,
              level: objLevel,
            });
          }
        } catch {}
      }
    } catch {}
  }

  syllabusCache.set(level, items);
  return items;
}

/**
 * Reads data/qbank/qbank.db to collect all tested words from vocab_tags or stems.
 */
export function getTestedVocabSet(dbPath = getQBankDbPath()): Set<string> {
  const tested = new Set<string>();
  if (!fs.existsSync(dbPath)) return tested;

  let db: DatabaseSync | null = null;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });

    // Collect from qb_questions
    try {
      const rows = db.prepare('SELECT options, answer_index, vocab_tags FROM qb_questions').all() as any[];
      for (const r of rows) {
        if (r.vocab_tags) {
          try {
            const tags = JSON.parse(r.vocab_tags);
            if (Array.isArray(tags)) {
              tags.forEach((t) => tested.add(String(t).trim()));
            }
          } catch {}
        }
        if (r.options) {
          try {
            const opts = JSON.parse(r.options);
            if (Array.isArray(opts)) {
              if (Number.isInteger(r.answer_index) && opts[r.answer_index]) {
                tested.add(String(opts[r.answer_index]).trim());
              }
            }
          } catch {}
        }
      }
    } catch {}

    // Collect from pending_questions
    try {
      const pRows = db.prepare('SELECT options, answer_idx FROM pending_questions').all() as any[];
      for (const r of pRows) {
        if (r.options) {
          try {
            const opts = JSON.parse(r.options);
            if (Array.isArray(opts)) {
              if (Number.isInteger(r.answer_idx) && opts[r.answer_idx]) {
                tested.add(String(opts[r.answer_idx]).trim());
              }
            }
          } catch {}
        }
      }
    } catch {}
  } catch {
    // Best-effort database query
  } finally {
    if (db) {
      try {
        db.close();
      } catch {}
    }
  }

  return tested;
}

/**
 * Rotates vocabulary based on day of week (0 to 6) and prioritizes untested words.
 */
export function getRotatedVocab(
  level: number,
  count = 10,
  referenceDate = new Date()
): VocabItem[] {
  const allVocab = loadSyllabusVocab(level);
  if (allVocab.length === 0) {
    return [];
  }

  const testedSet = getTestedVocabSet();

  // Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfWeek = referenceDate.getDay();

  // Partition vocabulary into 7 slices
  const sliceSize = Math.ceil(allVocab.length / 7);
  const startIndex = (dayOfWeek * sliceSize) % allVocab.length;
  const endIndex = Math.min(startIndex + sliceSize, allVocab.length);

  const todaysSlice = allVocab.slice(startIndex, endIndex);
  const otherSlice = [...allVocab.slice(0, startIndex), ...allVocab.slice(endIndex)];

  // Separate today's slice into untested and tested
  const todayUntested: VocabItem[] = [];
  const todayTested: VocabItem[] = [];
  for (const item of todaysSlice) {
    if (testedSet.has(item.word)) {
      todayTested.push(item);
    } else {
      todayUntested.push(item);
    }
  }

  // Separate other slices into untested and tested
  const otherUntested: VocabItem[] = [];
  const otherTested: VocabItem[] = [];
  for (const item of otherSlice) {
    if (testedSet.has(item.word)) {
      otherTested.push(item);
    } else {
      otherUntested.push(item);
    }
  }

  // Priority order:
  // 1. Untested in today's day-of-week partition
  // 2. Untested in other partitions
  // 3. Tested in today's partition
  // 4. Tested in other partitions
  const prioritized = [
    ...todayUntested,
    ...otherUntested,
    ...todayTested,
    ...otherTested,
  ];

  return prioritized.slice(0, Math.min(count, prioritized.length));
}
