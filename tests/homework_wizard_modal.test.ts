import { describe, it, expect } from 'vitest';
import {
  getCurriculumLessonsForLevel,
  synthesizeLessonQuestions,
  CORE_EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
} from '../src/components/Admin/HomeworkWizardModal';
import { EDGE_TTS_VOICES } from '../src/utils/chineseAudio';

describe('HomeworkWizardModal & Curriculum Question Synthesis', () => {
  describe('1. Curriculum Lesson Retrieval (HSK 1 - 6)', () => {
    it('should return lessons for HSK 1 through HSK 6', () => {
      for (let level = 1; level <= 6; level++) {
        const lessons = getCurriculumLessonsForLevel(level);
        expect(Array.isArray(lessons)).toBe(true);
        expect(lessons.length).toBeGreaterThan(0);

        const first = lessons[0];
        expect(first).toBeDefined();
        expect(first.lessonNumber).toBe(1);
        expect(typeof first.titleHanzi).toBe('string');
        expect(typeof first.titleVietnamese).toBe('string');
        expect(Array.isArray(first.vocabulary)).toBe(true);
      }
    });

    it('should fallback to HSK 1 when invalid level is passed', () => {
      const fallback = getCurriculumLessonsForLevel(99);
      expect(fallback.length).toBeGreaterThan(0);
      expect(fallback[0].titleHanzi).toContain('你好');
    });
  });

  describe('2. Core Exercise Types Configuration (Requirement R3)', () => {
    it('should support the 4 core exercise types', () => {
      const keys = CORE_EXERCISE_TYPES.map((f) => f.key);
      expect(keys).toContain('mcq');
      expect(keys).toContain('fill_blank');
      expect(keys).toContain('reading');
      expect(keys).toContain('listening');
      expect(keys.length).toBe(4);
    });
  });

  describe('3. Difficulty Levels Configuration (Requirement R3)', () => {
    it('should support 4 difficulty levels with calibrated speech rates', () => {
      const levels = DIFFICULTY_LEVELS.map((d) => d.key);
      expect(levels).toEqual(['easy', 'medium', 'hard', 'adaptive']);

      const easy = DIFFICULTY_LEVELS.find((d) => d.key === 'easy');
      const medium = DIFFICULTY_LEVELS.find((d) => d.key === 'medium');
      const hard = DIFFICULTY_LEVELS.find((d) => d.key === 'hard');

      expect(easy?.speechRate).toBeLessThanOrEqual(0.8);
      expect(medium?.speechRate).toBe(0.9);
      expect(hard?.speechRate).toBe(1.0);
    });
  });

  describe('4. Natural Chinese TTS Voices (Requirement R4)', () => {
    it('should contain Edge TTS voices including Xiaoxiao and Yunxi', () => {
      const voiceIds = EDGE_TTS_VOICES.map((v) => v.id);
      expect(voiceIds).toContain('zh-CN-XiaoxiaoNeural');
      expect(voiceIds).toContain('zh-CN-YunxiNeural');
      expect(voiceIds).toContain('zh-CN-XiaoyiNeural');
      expect(voiceIds).toContain('zh-CN-YunjianNeural');
    });
  });

  describe('5. Algorithmic Question Synthesis with 4 Core Formats', () => {
    const hsk1Lessons = getCurriculumLessonsForLevel(1);
    const lesson1 = hsk1Lessons[0];

    it('should synthesize multiple choice (MCQ) exercises', () => {
      const questions = synthesizeLessonQuestions(
        lesson1,
        1,
        ['mcq'],
        5,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(questions.length).toBe(5);
      const mcq = questions[0];
      expect(mcq.type).toBe('meaning');
      expect(mcq.options?.length).toBe(4);
      expect(mcq.correctAnswer).toBeDefined();
      expect(mcq.explanation).toBeTruthy();
    });

    it('should synthesize fill-in-the-blank exercises with canonical blank marker', () => {
      const questions = synthesizeLessonQuestions(
        lesson1,
        1,
        ['fill_blank'],
        5,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(questions.length).toBe(5);
      const fillBlank = questions[0];
      expect(fillBlank.type).toBe('fill_blank');
      expect(fillBlank.questionChinese).toContain('____');
      expect(fillBlank.options?.length).toBe(4);
      expect(fillBlank.options).toContain(fillBlank.correctAnswer as string);
    });

    it('should synthesize reading comprehension exercises', () => {
      const questions = synthesizeLessonQuestions(
        lesson1,
        1,
        ['reading'],
        5,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(questions.length).toBe(5);
      const readQ = questions[0];
      expect(readQ.type).toBe('meaning');
      expect(readQ.prompt).toContain('Đọc');
      expect(readQ.questionChinese).toBeTruthy();
      expect(readQ.options?.length).toBe(4);
    });

    it('should synthesize listening comprehension exercises with natural TTS voice', () => {
      const selectedVoice = 'zh-CN-YunxiNeural';
      const questions = synthesizeLessonQuestions(
        lesson1,
        1,
        ['listening'],
        5,
        'hard',
        selectedVoice
      );
      expect(questions.length).toBe(5);
      const listenQ = questions[0];
      expect(listenQ.type).toBe('listening');
      expect(listenQ.questionChinese).toContain('问：');
      expect(listenQ.audioText).toBeTruthy();
      expect(listenQ.audio_url).toBeDefined();
      expect(listenQ.audio_url).toContain(`voice=${encodeURIComponent(selectedVoice)}`);
      expect(listenQ.options?.length).toBe(4);
      expect(listenQ.options).toContain(listenQ.correctAnswer as string);
    });

    it('should synthesize combined exercises covering all 4 formats', () => {
      const questions = synthesizeLessonQuestions(
        lesson1,
        1,
        ['mcq', 'fill_blank', 'reading', 'listening'],
        12,
        'adaptive',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(questions.length).toBe(12);

      const types = questions.map((q) => q.type);
      expect(types).toContain('fill_blank');
      expect(types).toContain('listening');
      expect(types).toContain('meaning');
    });
  });
});
