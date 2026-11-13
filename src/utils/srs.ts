import { SRSCardState, WordItem } from '../types';
import { INITIAL_VOCABULARY } from '../data/hskVocabulary';

const SRS_STORAGE_KEY = 'minnese_srs_cards_v1';
const STATS_STORAGE_KEY = 'minnese_user_stats_v1';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation
 * Quality Score: 0 - 5
 * 5: Perfect response
 * 4: Correct response after a hesitation
 * 3: Correct response recalled with serious difficulty
 * 2: Incorrect response; where the correct one seemed easy to recall
 * 1: Incorrect response; the correct one remembered
 * 0: Complete blackout
 */
export function calculateSM2(
  quality: number,
  currentState?: Partial<SRSCardState>
): {
  repetition: number;
  interval: number;
  easinessFactor: number;
  nextReviewDate: string;
  state: 'new' | 'learning' | 'review' | 'mastered';
} {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let repetition = currentState?.repetition ?? 0;
  let interval = currentState?.interval ?? 0;
  let ef = currentState?.easinessFactor ?? 2.5;

  // Update Easiness Factor based on quality rating
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;
  if (ef > 3.2) ef = 3.2;

  let state: 'new' | 'learning' | 'review' | 'mastered' = 'learning';

  if (q >= 5) {
    // User explicitly marked as "Dễ / Thuộc" (Mastered / Easy)
    repetition = Math.max(repetition + 1, 3);
    interval = Math.max(21, Math.round((interval || 14) * ef));
    state = 'mastered';
  } else if (q >= 3) {
    // Correct response (Nhớ tốt / Khá)
    if (repetition === 0) {
      interval = 4;
    } else if (repetition === 1) {
      interval = 10;
    } else {
      interval = Math.round(interval * ef);
    }
    repetition += 1;
    state = interval >= 21 ? 'mastered' : 'review';
  } else if (q === 2) {
    // Khó nhớ - review after 1 day
    repetition = 1;
    interval = 1;
    state = 'learning';
  } else {
    // Incorrect response (Quên hẳn) - reset repetition
    repetition = 0;
    interval = 0;
    state = 'learning';
  }

  // Calculate next review date in ISO format
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    repetition,
    interval,
    easinessFactor: Number(ef.toFixed(2)),
    nextReviewDate: nextDate.toISOString(),
    state,
  };
}

export function loadSRSCards(): Record<string, SRSCardState> {
  try {
    const saved = localStorage.getItem(SRS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading SRS cards from localStorage', e);
  }

  // Initial seed setup
  const seed: Record<string, SRSCardState> = {};
  const today = new Date();

  INITIAL_VOCABULARY.forEach((word, idx) => {
    const nextDate = new Date();
    // Stagger initial review schedule so some cards are due today and some upcoming
    if (idx < 5) {
      nextDate.setDate(today.getDate()); // Due today
    } else {
      nextDate.setDate(today.getDate() + (idx % 3) + 1);
    }

    seed[word.id] = {
      wordId: word.id,
      repetition: idx < 3 ? 1 : 0,
      interval: idx < 3 ? 1 : 0,
      easinessFactor: 2.5,
      lastReviewDate: today.toISOString(),
      nextReviewDate: nextDate.toISOString(),
      history: [],
      state: idx < 3 ? 'review' : 'new',
    };
  });

  saveSRSCards(seed);
  return seed;
}

export function saveSRSCards(cards: Record<string, SRSCardState>): void {
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Error saving SRS cards to localStorage', e);
  }
}

export function isCardDue(card: SRSCardState): boolean {
  if (!card.nextReviewDate) return true;
  const reviewTime = new Date(card.nextReviewDate).getTime();
  const now = new Date().getTime();
  return reviewTime <= now;
}

export function getDeckSRSStats(wordIds: string[], cardsState: Record<string, SRSCardState>) {
  let dueCount = 0;
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let masteredCount = 0;

  wordIds.forEach((id) => {
    const state = cardsState[id];
    if (!state) {
      newCount++;
      dueCount++;
    } else {
      if (isCardDue(state)) {
        dueCount++;
      }
      if (state.state === 'new') newCount++;
      else if (state.state === 'learning') learningCount++;
      else if (state.state === 'review') reviewCount++;
      else if (state.state === 'mastered') masteredCount++;
    }
  });

  return {
    total: wordIds.length,
    dueCount,
    newCount,
    learningCount,
    reviewCount,
    masteredCount,
  };
}

export function ensureWordsInSRS(
  words: WordItem[],
  srsCards: Record<string, SRSCardState>
): Record<string, SRSCardState> {
  const today = new Date();
  let hasChanges = false;
  const nextCards = { ...srsCards };

  words.forEach((w) => {
    if (!nextCards[w.id]) {
      hasChanges = true;
      nextCards[w.id] = {
        wordId: w.id,
        repetition: 0,
        interval: 0,
        easinessFactor: 2.5,
        lastReviewDate: today.toISOString(),
        nextReviewDate: today.toISOString(),
        history: [],
        state: 'new',
      };
    }
  });

  if (hasChanges) {
    saveSRSCards(nextCards);
  }

  return nextCards;
}
