import { describe, it, expect } from 'vitest';
import {
  getCurriculumLessonsForLevel,
  synthesizeLessonQuestions,
  buildHomeworkLessonSystemPrompt,
  parseExternalAiHomeworkText,
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

    it('should accurately parse external AI output with 10 questions and a bottom "ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:" block without creating fake Câu 11-20', () => {
      const rawExternalAiText = `Câu 1: 王老师，____！(Wáng lǎoshī, ____!)

A. 你好 (nǐ hǎo)

B. 您好 (nín hǎo)

C. 谢谢 (xièxie)

D. 再见 (zàijiàn)

Câu 2: 老师：你们好！(Lǎoshī: Nǐmen hǎo!)

学生：老师，____！(Xuésheng: Lǎoshī, ____!)

A. 再见 (zàijiàn)

B. 不客气 (bú kèqi)

C. 您好 (nín hǎo)

D. 谢谢 (xièxie)

Câu 3: Giáo viên muốn chào tất cả học sinh trong lớp. Cách nói nào phù hợp nhất?

A. 你们好！(Nǐmen hǎo!)

B. 您好！(Nín hǎo!)

C. 大家好！(Dàjiā hǎo!)

D. 再见！(Zàijiàn!)

Câu 4: 同学：谢谢你！(Tóngxué: Xièxie nǐ!)

你：____！(Nǐ: ____!)

A. 再见 (zàijiàn)

B. 不客气 (bú kèqi)

C. 你好 (nǐ hǎo)

D. 谢谢 (xièxie)

Câu 5: 老师：____好！(Lǎoshī: ____ hǎo!)

Chọn từ phù hợp để chào tất cả mọi người.

A. 大家 (dàjiā)

B. 谢谢 (xièxie)

C. 学生 (xuésheng)

D. 不客气 (bú kèqi)

Câu 6: Trong cụm từ 你好 (nǐ hǎo), cách phát âm thực tế nào đúng theo quy tắc biến điệu hai thanh 3?

A. nǐ hǎo (3 + 3)

B. ní hǎo (2 + 3)

C. nǐ háo (3 + 2)

D. ní háo (2 + 2)

Câu 7: Cụm từ nào có hai âm tiết thanh 3 đứng liền nhau và cần áp dụng quy tắc biến điệu 3 + 3 → 2 + 3?

A. 你好 (nǐ hǎo)

B. 谢谢 (xièxie)

C. 再见 (zàijiàn)

D. 不客气 (bú kèqi)

Câu 8: Đọc đoạn hội thoại sau:

王老师：同学们，大家好！(Wáng lǎoshī: Tóngxuémen, dàjiā hǎo!)

学生：王老师，您好！(Xuésheng: Wáng lǎoshī, nín hǎo!)

王老师：你们好！(Wáng lǎoshī: Nǐmen hǎo!)

学生：谢谢老师！(Xuésheng: Xièxie lǎoshī!)

王老师：不客气！再见！(Wáng lǎoshī: Bú kèqi! Zàijiàn!)

Trong đoạn hội thoại, học sinh sử dụng từ nào để thể hiện sự kính trọng khi chào giáo viên Vương?

A. 你们 (nǐmen)

B. 大家 (dàjiā)

C. 您 (nín)

D. 学生 (xuésheng)

Câu 9: Đọc đoạn hội thoại sau:

王老师：同学们，大家好！(Wáng lǎoshī: Tóngxuémen, dàjiā hǎo!)

学生：王老师，您好！(Xuésheng: Wáng lǎoshī, nín hǎo!)

王老师：你们好！(Wáng lǎoshī: Nǐmen hǎo!)

学生：谢谢老师！(Xuésheng: Xièxie lǎoshī!)

王老师：不客气！再见！(Wáng lǎoshī: Bú kèqi! Zàijiàn!)

Sau khi học sinh nói 谢谢老师 (Xièxie lǎoshī), giáo viên trả lời như thế nào?

A. 你好 (nǐ hǎo)

B. 不客气 (bú kèqi)

C. 再见 (zàijiàn)

D. 谢谢 (xièxie)

Câu 10:

男：王老师，您好！(Nán: Wáng lǎoshī, nín hǎo!)

女：你好！谢谢你们。(Nǚ: Nǐ hǎo! Xièxie nǐmen.)

男：不客气！再见！(Nán: Bú kèqi! Zàijiàn!)

女：再见！(Nǚ: Zàijiàn!)

问：男 và 女 đã nói gì với nhau ở cuối cuộc hội thoại?

A. 谢谢 (xièxie)

B. 不客气 (bú kèqi)

C. 你好 (nǐ hǎo)

D. 再见 (zàijiàn)

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:

Câu 1: B. Giải thích: 您好 (nín hǎo) có nghĩa là "Xin chào". 您 là đại từ kính ngữ, dùng để thể hiện sự tôn trọng khi chào giáo viên hoặc người lớn tuổi.

Câu 2: C. Giải thích: 您好 (nín hǎo) là lời chào lịch sự, phù hợp khi học sinh chào lại giáo viên.

Câu 3: C. Giải thích: 大家好 (dàjiā hǎo) có nghĩa là "Xin chào mọi người". 大家 được sử dụng khi chào hỏi một nhóm đông người.

Câu 4: B. Giải thích: 不客气 (bú kèqi) có nghĩa là "Không có gì, đừng khách sáo", dùng để đáp lại lời cảm ơn 谢谢.

Câu 5: A. Giải thích: 大家好 (dàjiā hǎo) có nghĩa là "Chào mọi người", phù hợp khi giáo viên muốn chào cả lớp.

Câu 6: B. Giải thích: 你好 (nǐ hǎo) có hai âm tiết thanh 3. Theo quy tắc 3 + 3 → 2 + 3, âm tiết thứ nhất biến thành thanh 2 khi phát âm thực tế, âm tiết thứ hai giữ thanh 3. Pinyin chính tả vẫn viết là nǐ hǎo.

Câu 7: A. Giải thích: 你好 (nǐ hǎo) có hai âm tiết thanh 3 liền nhau nên áp dụng quy tắc biến điệu 3 + 3 → 2 + 3.

Câu 8: C. Giải thích: 您 (nín) là đại từ kính ngữ, được học sinh sử dụng để thể hiện sự tôn trọng đối với giáo viên Vương.

Câu 9: B. Giải thích: 不客气 (bú kèqi) có nghĩa là "Không có gì", là câu trả lời phù hợp khi nhận được lời cảm ơn 谢谢老师.

Câu 10: D. Giải thích: 再见 (zàijiàn) có nghĩa là "Tạm biệt, hẹn gặp lại". Cả hai nhân vật đều sử dụng từ này khi kết thúc cuộc hội thoại.`;

      const parsed = parseExternalAiHomeworkText(rawExternalAiText, 1, 'zh-CN-XiaoxiaoNeural');
      expect(parsed.length).toBe(10);

      // Verify none of the questions fell back to placeholder 'Phương án A'
      parsed.forEach((q) => {
        expect(q.options.length).toBe(4);
        expect(q.options).not.toContain('Phương án A');
      });

      // Check exact mapped answers from footer
      expect(parsed[0].correctAnswer).toBe('您好 (nín hǎo)'); // B
      expect(parsed[1].correctAnswer).toBe('您好 (nín hǎo)'); // C
      expect(parsed[2].correctAnswer).toBe('大家好！(Dàjiā hǎo!)'); // C
      expect(parsed[3].correctAnswer).toBe('不客气 (bú kèqi)'); // B
      expect(parsed[4].correctAnswer).toBe('大家 (dàjiā)'); // A
      expect(parsed[5].correctAnswer).toBe('ní hǎo (2 + 3)'); // B
      expect(parsed[6].correctAnswer).toBe('你好 (nǐ hǎo)'); // A
      expect(parsed[7].correctAnswer).toBe('您 (nín)'); // C
      expect(parsed[8].correctAnswer).toBe('不客气 (bú kèqi)'); // B
      expect(parsed[9].correctAnswer).toBe('再见 (zàijiàn)'); // D

      // Check Question 10 is Listening with pure Chinese TTS audioText
      expect(parsed[9].type).toBe('listening');
      expect(parsed[9].audioText).toBe('王老师，您好！ 你好！谢谢你们。 不客气！再见！ 再见！');
      expect(parsed[9].audio_url).toContain('/api/tts?text=');
    });
  });
});
