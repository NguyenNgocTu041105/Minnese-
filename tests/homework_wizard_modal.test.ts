import { describe, it, expect } from 'vitest';
import {
  getCurriculumLessonsForLevel,
  synthesizeLessonQuestions,
  buildHomeworkLessonSystemPrompt,
  CORE_EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
} from '../src/components/Admin/HomeworkWizardModal';
import { buildGoldenPrompt } from '../src/components/Admin/GoldenPromptLibraryModal';
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

  describe('6. Lesson-Scoped Teacher-Controlled System Prompt & Golden Prompt Integration', () => {
    it('should build a lesson-scoped System Prompt using only the teacher-selected vocabulary and grammar structures', () => {
      const prompt = buildHomeworkLessonSystemPrompt({
        level: 2,
        lessonNumber: 3,
        titleHanzi: '左边那个红色的是我的',
        titleVietnamese: 'Cái màu đỏ bên trái kia là của tôi',
        vocabItems: [
          { hanzi: '旁边', pinyin: 'pángbiān', vietnamese: 'bên cạnh' },
          { hanzi: '红色', pinyin: 'hóngsè', vietnamese: 'màu đỏ' },
        ],
        grammarItems: [
          { title: 'Cụm chữ 的', explanation: 'Danh từ hóa cụm tính từ/động từ + 的' },
        ],
        scopeMode: 'custom_only',
        templateKey: 'mixed_homework',
        questionCount: 8,
        difficultyLabel: 'Chuẩn lớp học (Medium)',
        teacherNote: 'Tập trung phân biệt 旁边 và 左边 trong phòng học.',
      });

      expect(prompt).toContain('Bài 3: 左边那个红色的是我的');
      expect(prompt).toContain('旁边 (pángbiān - bên cạnh)');
      expect(prompt).toContain('红色 (hóngsè - màu đỏ)');
      expect(prompt).toContain('Cụm chữ 的');
      expect(prompt).toContain('CHỈ TẬP TRUNG 100% vào đúng danh sách từ vựng và cấu trúc ngữ pháp giáo viên đã chỉ định');
      expect(prompt).toContain('Tập trung phân biệt 旁边 và 左边 trong phòng học.');
      expect(prompt).toContain('DANH SÁCH TỪ VỰNG BẮT BUỘC ĐƯA VÀO ĐỀ (DO GIÁO VIÊN CHỌN / BỔ SUNG)');
    });

    it('should inject lessonContext into GoldenPromptLibraryModal buildGoldenPrompt instead of whole-level vocabulary', () => {
      const lessonPrompt = buildGoldenPrompt({
        level: 3,
        format: 'fill_in_blank',
        questionCount: 5,
        topic: 'Bài 4: Cô ấy luôn cười nói với khách hàng',
        includePinyin: true,
        lessonContext: {
          lessonNumber: 4,
          titleHanzi: '她总是笑着跟客人说话',
          titleVietnamese: 'Cô ấy luôn cười nói với khách hàng',
          vocabText: '总是 (zǒngshì: luôn luôn), 客人 (kèrén: khách hàng), 聪明 (cōngming: thông minh)',
          grammarText: 'Động từ + 着 biểu thị trạng thái đi kèm (V1 + 着 + V2)',
          scopeDescription: 'Chỉ dùng từ vựng Bài 1 -> Bài 4, cấm dùng từ Bài 5 trở đi.',
          teacherNote: 'Đặt câu sát tình huống làm việc tại quầy lễ tân.',
        },
      });

      expect(lessonPrompt).toContain('Bài 4: 她总是笑着跟客人说话');
      expect(lessonPrompt).toContain('总是 (zǒngshì: luôn luôn)');
      expect(lessonPrompt).toContain('Động từ + 着 biểu thị trạng thái đi kèm');
      expect(lessonPrompt).toContain('Chỉ dùng từ vựng Bài 1 -> Bài 4');
      expect(lessonPrompt).toContain('Đặt câu sát tình huống làm việc tại quầy lễ tân.');
      expect(lessonPrompt).toContain('CHỈ sử dụng từ vựng bài học giáo viên đã dạy');
    });
  });
});
