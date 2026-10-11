import { WordItem, SRSCardState } from '../types';
import { DetailedTextbookLesson, NEW_HSK1_FULL_LESSONS } from '../data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../data/newHsk4BookData';
import { isCardDue, saveSRSCards } from './srs';

/**
 * Lấy danh sách toàn bộ bài học theo cấp độ HSK (1, 2, 3, 4)
 */
export function getLessonsForLevel(level: 1 | 2 | 3 | 4): DetailedTextbookLesson[] {
  if (level === 1) return NEW_HSK1_FULL_LESSONS;
  if (level === 2) return NEW_HSK2_FULL_LESSONS;
  if (level === 3) return NEW_HSK3_FULL_LESSONS;
  return NEW_HSK4_FULL_LESSONS;
}

/**
 * Lấy tiến độ bài học của học viên từ localStorage
 */
export function getLessonProgress(level: 1 | 2 | 3 | 4) {
  const lessons = getLessonsForLevel(level);
  const totalLessons = lessons.length || (level === 3 || level === 4 ? 10 : 15);

  let activeIndex = 0;
  let completedLessonNums: number[] = [];

  try {
    const savedIdx = localStorage.getItem(`minnie_current_lesson_hsk_${level}`);
    if (savedIdx !== null) {
      const val = parseInt(savedIdx, 10);
      if (!isNaN(val) && val >= 0 && val < totalLessons) {
        activeIndex = val;
      }
    }

    const savedCompleted = localStorage.getItem(`minnie_completed_lessons_hsk_${level}`);
    if (savedCompleted) {
      const arr = JSON.parse(savedCompleted);
      if (Array.isArray(arr)) {
        completedLessonNums = arr;
      }
    }
  } catch (e) {
    console.error('Error loading lesson progress', e);
  }

  const currentLessonNum = activeIndex + 1;
  const maxReachedLessonNum = Math.max(currentLessonNum, ...completedLessonNums, 1);

  return {
    activeIndex,
    currentLessonNum,
    completedLessonNums,
    maxReachedLessonNum,
    totalLessons,
    currentLesson: lessons[activeIndex] || lessons[0],
  };
}

/**
 * Lấy danh sách từ vựng của một bài học cụ thể
 */
export function getLessonVocabulary(level: 1 | 2 | 3 | 4, lessonNumber: number): WordItem[] {
  const lessons = getLessonsForLevel(level);
  const lesson = lessons.find((l) => l.lessonNumber === lessonNumber);
  if (!lesson || !lesson.vocabulary) return [];

  return lesson.vocabulary.map((w) => ({
    ...w,
    tags: [...(w.tags || []), `Bài ${lessonNumber}`, `HSK ${level}`],
  }));
}

/**
 * Lấy toàn bộ từ vựng đã học trong giáo trình tính đến bài học cao nhất đã đạt tới (hoặc một bài cụ thể)
 */
export function getLearnedVocabulary(level: 1 | 2 | 3 | 4, upToLessonNum?: number): WordItem[] {
  const lessons = getLessonsForLevel(level);
  const targetMax = upToLessonNum ?? getLessonProgress(level).maxReachedLessonNum;

  const map = new Map<string, WordItem>();

  lessons.forEach((l) => {
    if (l.lessonNumber <= targetMax && l.vocabulary) {
      l.vocabulary.forEach((w) => {
        if (!map.has(w.id)) {
          map.set(w.id, {
            ...w,
            tags: [...(w.tags || []), `Bài ${l.lessonNumber}`, `HSK ${level}`],
          });
        }
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Tính toán danh sách thẻ và số lượng từ vựng cần ôn tập của học viên dựa trên bài học giáo trình đã học
 */
export function getCoursebookDueStats(
  level: 1 | 2 | 3 | 4,
  srsCards: Record<string, SRSCardState>,
  specificLessonNum?: number
) {
  const progress = getLessonProgress(level);
  const lessons = getLessonsForLevel(level);

  let targetWords: WordItem[] = [];
  let scopeLabel = '';

  if (specificLessonNum !== undefined) {
    targetWords = getLessonVocabulary(level, specificLessonNum);
    const lessonObj = lessons.find((l) => l.lessonNumber === specificLessonNum);
    scopeLabel = `Bài ${specificLessonNum}${lessonObj ? `: ${lessonObj.titleHanzi}` : ''}`;
  } else {
    // Học đến đâu thì ôn tập đến đó: lấy toàn bộ từ vựng các bài đã học đến bài hiện tại
    targetWords = getLearnedVocabulary(level, progress.maxReachedLessonNum);
    if (progress.maxReachedLessonNum === 1) {
      const firstLesson = lessons[0];
      scopeLabel = `Bài 1: ${firstLesson?.titleHanzi || '你好'}`;
    } else {
      scopeLabel = `Bài 1 - ${progress.maxReachedLessonNum} giáo trình New HSK ${level}`;
    }
  }

  // Lọc các từ đến hạn ôn tập (hoặc từ mới chưa ôn)
  const dueWords: WordItem[] = [];
  let masteredCount = 0;
  let learningCount = 0;

  targetWords.forEach((word) => {
    // Check by word.id, word.hanzi, or matching wordId in srsCards
    const card =
      srsCards[word.id] ||
      srsCards[word.hanzi] ||
      Object.values(srsCards).find(
        (c) => c.wordId === word.id || (c as any).hanzi === word.hanzi
      );
    if (!card) {
      // Từ mới trong bài học chưa ôn lần nào -> Bắt buộc phải ôn tập
      dueWords.push(word);
    } else {
      if (isCardDue(card) || card.state === 'new') {
        dueWords.push(word);
      }
      if (card.state === 'mastered') {
        masteredCount++;
      } else if (card.state === 'learning' || card.state === 'review') {
        learningCount++;
      }
    }
  });

  return {
    targetWords,
    dueWords,
    dueCount: dueWords.length,
    totalWordsCount: targetWords.length,
    masteredCount,
    learningCount,
    scopeLabel,
    currentLessonNum: progress.currentLessonNum,
    maxReachedLessonNum: progress.maxReachedLessonNum,
  };
}

/**
 * Đảm bảo các từ vựng trong bài học được kích hoạt vào SRS storage
 */
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
        nextReviewDate: today.toISOString(), // Sẵn sàng để ôn ngay
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
