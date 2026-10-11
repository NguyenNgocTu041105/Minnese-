import { DetailedTextbookLesson } from './newHsk1BookData';
import { HSK6_LESSONS_PART1 } from './hsk6LessonsPart1';
import { HSK6_LESSONS_PART2 } from './hsk6LessonsPart2';
import { HSK6_LESSONS_PART3 } from './hsk6LessonsPart3';
import { WordItem } from '../types';

export const NEW_HSK6_FULL_LESSONS: DetailedTextbookLesson[] = [
  ...HSK6_LESSONS_PART1,
  ...HSK6_LESSONS_PART2,
  ...HSK6_LESSONS_PART3,
];

export function getAllNewHsk6Vocabulary(): WordItem[] {
  const allVocab: WordItem[] = [];
  const seen = new Set<string>();
  for (const lesson of NEW_HSK6_FULL_LESSONS) {
    for (const word of lesson.vocabulary) {
      if (!seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        allVocab.push(word);
      }
    }
  }
  return allVocab;
}
