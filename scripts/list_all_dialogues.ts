import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';

const dialogues: Array<{ id: string; lesson: number; textIndex: number; title: string; lines: number }> = [];

for (const lesson of NEW_HSK1_FULL_LESSONS) {
  lesson.texts.forEach((text, tIdx) => {
    dialogues.push({
      id: text.id,
      lesson: lesson.lessonNumber,
      textIndex: tIdx + 1,
      title: text.title,
      lines: text.lines.length,
    });
  });
}

console.log(`Total HSK 1 dialogues in curriculum: ${dialogues.length}`);
console.log(dialogues.map(d => `${d.id} (L${d.lesson} T${d.textIndex}, ${d.lines} lines)`).join(', '));
