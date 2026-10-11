import { WordItem } from '../types';
import { DetailedTextbookLesson } from './newHsk1BookData';
import { HSK4_LESSONS_PART1 } from './hsk4LessonsPart1';
import { HSK4_LESSONS_PART2 } from './hsk4LessonsPart2';
import { HSK4_LESSONS_PART3 } from './hsk4LessonsPart3';
import { HSK4_LESSONS_PART4 } from './hsk4LessonsPart4';

export const NEW_HSK4_FULL_LESSONS: DetailedTextbookLesson[] = [
  ...HSK4_LESSONS_PART1,
  ...HSK4_LESSONS_PART2,
  ...HSK4_LESSONS_PART3,
  ...HSK4_LESSONS_PART4
];

export function getAllNewHsk4Vocabulary(): WordItem[] {
  const allVocab: WordItem[] = [];
  const seen = new Set<string>();
  for (const lesson of NEW_HSK4_FULL_LESSONS) {
    for (const word of lesson.vocabulary) {
      if (!seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        allVocab.push(word);
      }
    }
  }
  return allVocab;
}
