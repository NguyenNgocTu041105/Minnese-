import { DetailedTextbookLesson } from './newHsk1BookData';
import { HSK5_LESSONS_PART1 } from './hsk5LessonsPart1';
import { HSK5_LESSONS_PART2 } from './hsk5LessonsPart2';
import { HSK5_LESSONS_PART3 } from './hsk5LessonsPart3';
import { WordItem } from '../types';

export const NEW_HSK5_FULL_LESSONS: DetailedTextbookLesson[] = [
  ...HSK5_LESSONS_PART1,
  ...HSK5_LESSONS_PART2,
  ...HSK5_LESSONS_PART3,
];

export function getAllNewHsk5Vocabulary(): WordItem[] {
  const allVocab: WordItem[] = [];
  const seen = new Set<string>();
  for (const lesson of NEW_HSK5_FULL_LESSONS) {
    for (const word of lesson.vocabulary) {
      if (!seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        allVocab.push(word);
      }
    }
  }
  return allVocab;
}
