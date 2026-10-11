import { WordItem } from '../types';
import { INITIAL_VOCABULARY } from '../data/hskVocabulary';
import { getAllNewHsk1Vocabulary } from '../data/newHsk1BookData';
import { getAllNewHsk2Vocabulary } from '../data/newHsk2BookData';
import { getAllNewHsk3Vocabulary } from '../data/newHsk3BookData';
import { getAllNewHsk4Vocabulary } from '../data/newHsk4BookData';

export const CUSTOM_VOCAB_STORAGE_KEY = 'minnese_custom_vocab_v1';
export const DELETED_VOCAB_STORAGE_KEY = 'minnese_deleted_vocab_v1';

export function getDeletedHanziSet(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_VOCAB_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    console.error('Error reading deleted vocab list', e);
    return new Set();
  }
}

export function getCustomVocabList(): WordItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_VOCAB_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error('Error reading custom vocab list', e);
    return [];
  }
}

export function getUnifiedVocabularyList(): WordItem[] {
  const deletedSet = getDeletedHanziSet();
  const map = new Map<string, WordItem>();

  const customList = getCustomVocabList().map((w) => ({ ...w, isCustom: true }));
  const customHanziSet = new Set(customList.map((w) => w.hanzi));

  const mergeWord = (w: WordItem) => {
    if (!w || !w.hanzi) return;
    if (deletedSet.has(w.hanzi) || (w.id && deletedSet.has(w.id))) return;
    // Don't overwrite custom words with textbook defaults
    if (customHanziSet.has(w.hanzi)) return;
    const existing = map.get(w.hanzi);
    map.set(w.hanzi, {
      ...(existing || {}),
      ...w,
      id: w.id || existing?.id || `vocab-${w.hanzi}`,
    });
  };

  // 1. Initial default vocabulary
  INITIAL_VOCABULARY.forEach(mergeWord);

  // 2. Textbook vocabulary (HSK 1, HSK 2, HSK 3, HSK 4 3.0 Curriculum)
  getAllNewHsk1Vocabulary().forEach(mergeWord);
  getAllNewHsk2Vocabulary().forEach(mergeWord);
  getAllNewHsk3Vocabulary().forEach(mergeWord);
  getAllNewHsk4Vocabulary().forEach(mergeWord);

  // 3. Custom / Admin words go FIRST so newly added words are prioritized on top
  const mergedStandard = Array.from(map.values());
  const combined = [...customList.filter((w) => !deletedSet.has(w.hanzi) && (!w.id || !deletedSet.has(w.id))), ...mergedStandard];

  // Ensure absolutely unique IDs for every item returned
  const seenIds = new Set<string>();
  return combined.map((word) => {
    let uniqueId = word.id || `word-${word.hanzi}`;
    if (seenIds.has(uniqueId)) {
      uniqueId = `${uniqueId}-${word.hanzi}`;
    }
    seenIds.add(uniqueId);
    return { ...word, id: uniqueId };
  });
}

export const getAllVocabulary = getUnifiedVocabularyList;

export function notifyVocabUpdated(): void {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('minnese_vocab_updated'));
}

export function saveCustomVocabList(words: WordItem[]): void {
  try {
    localStorage.setItem(CUSTOM_VOCAB_STORAGE_KEY, JSON.stringify(words));
    notifyVocabUpdated();
  } catch (e) {
    console.error('Error saving custom vocab list', e);
  }
}

export function saveOrUpdateWord(updatedWord: WordItem, oldHanzi?: string): void {
  try {
    const deletedSet = getDeletedHanziSet();

    // If word was previously in deletedSet, un-delete it
    if (deletedSet.has(updatedWord.hanzi)) {
      deletedSet.delete(updatedWord.hanzi);
    }
    if (deletedSet.has(updatedWord.id)) {
      deletedSet.delete(updatedWord.id);
    }

    // If oldHanzi was changed to a different hanzi, mark oldHanzi as deleted
    if (oldHanzi && oldHanzi !== updatedWord.hanzi) {
      deletedSet.add(oldHanzi);
    }

    localStorage.setItem(
      DELETED_VOCAB_STORAGE_KEY,
      JSON.stringify(Array.from(deletedSet))
    );

    const existingList = getCustomVocabList();
    const filtered = existingList.filter(
      (w) => w.id !== updatedWord.id && w.hanzi !== updatedWord.hanzi && (!oldHanzi || w.hanzi !== oldHanzi)
    );

    const newList = [updatedWord, ...filtered];
    localStorage.setItem(CUSTOM_VOCAB_STORAGE_KEY, JSON.stringify(newList));
    notifyVocabUpdated();
  } catch (e) {
    console.error('Error in saveOrUpdateWord', e);
  }
}

export function deleteWordItem(word: WordItem): void {
  try {
    const deletedSet = getDeletedHanziSet();
    deletedSet.add(word.hanzi);
    if (word.id) {
      deletedSet.add(word.id);
    }
    localStorage.setItem(
      DELETED_VOCAB_STORAGE_KEY,
      JSON.stringify(Array.from(deletedSet))
    );

    const existingList = getCustomVocabList();
    const updatedCustom = existingList.filter(
      (w) => w.hanzi !== word.hanzi && w.id !== word.id
    );
    localStorage.setItem(CUSTOM_VOCAB_STORAGE_KEY, JSON.stringify(updatedCustom));
    notifyVocabUpdated();
  } catch (e) {
    console.error('Error in deleteWordItem', e);
  }
}
