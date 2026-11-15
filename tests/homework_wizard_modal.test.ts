import { describe, it, expect } from 'vitest';
import { getEnrichedWorkbookLessons } from '../src/data/workbookEnricher';
import {
  getCurriculumLessonsForLevel,
  synthesizeLessonQuestions,
  buildHomeworkLessonSystemPrompt,
  parseExternalAiHomeworkText,
  CORE_EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
} from '../src/components/Admin/HomeworkWizardModal';
import { buildGoldenPrompt } from '../src/components/Admin/GoldenPromptLibraryModal';
import {
  EDGE_TTS_VOICES,
  sanitizeQuestionAudioText,
  parseDialogueTurns,
  selectContextualVoiceCast,
  selectContextualSingleVoice,
} from '../src/utils/chineseAudio';
import { sanitizeAndVerifyPinyinInText, verifyAndFixQuizQuestionPinyin } from '../src/utils/pinyinEngine';

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

      // Check Question 10 is Listening with pure Chinese TTS audioText & multi-role dialogue turns
      expect(parsed[9].type).toBe('listening');
      expect(parsed[9].audioText).toBe('男：王老师，您好！\n女：你好！谢谢你们。\n男：不客气！再见！\n女：再见！');
      expect(parsed[9].audio_url).toContain('/api/tts?text=');

      const turns = parseDialogueTurns(parsed[9].audioText!);
      expect(turns).toEqual([
        { role: 'male', text: '王老师，您好！' },
        { role: 'female', text: '你好！谢谢你们。' },
        { role: 'male', text: '不客气！再见！' },
        { role: 'female', text: '再见！' },
      ]);

      // Verify sanitizeQuestionAudioText never leaks Pinyin, underscores, or Vietnamese into TTS
      expect(sanitizeQuestionAudioText(parsed[0].questionChinese!)).toBe('王老师！');
      expect(sanitizeQuestionAudioText(parsed[5].prompt)).toBe('你好');
    });

    it('should automatically fix broken spacing tone marks (laˇ oshī, Niˇ haˇ o) and LLM Pinyin hallucinations like 大家 (dàijiā)', () => {
      expect(sanitizeAndVerifyPinyinInText('大家 (dàijiā)')).toBe('大家 (dàjiā)');
      expect(sanitizeAndVerifyPinyinInText('男：王老师，您好！(Wáng laˇ oshī, nín haˇ o!)')).toBe(
        '男：王老师，您好！(Wáng lǎoshī, nín hǎo!)'
      );
      expect(sanitizeAndVerifyPinyinInText('女：你好！(Niˇ haˇ o!)')).toBe('女：你好！(Nǐ hǎo!)');
      expect(sanitizeAndVerifyPinyinInText('谢谢 (xièxiè)')).toBe('谢谢 (xièxie)');
      expect(sanitizeAndVerifyPinyinInText('不客气 (bù kèqì)')).toBe('不客气 (bú kèqi)');
      expect(sanitizeAndVerifyPinyinInText('你们 (nǐmén)')).toBe('你们 (nǐmen)');
      expect(sanitizeAndVerifyPinyinInText('学生 (xuéshēng)')).toBe('学生 (xuésheng)');

      const fixedQ = verifyAndFixQuizQuestionPinyin({
        prompt: 'Nghe hội thoại và trả lời: 男用什么称呼问候王老师？ (Nán yòng shénme chēnghu wènhòu Wáng laˇ oshī?)',
        questionChinese: '男：王老师，您好！(Wáng laˇ oshī, nín haˇ o!)\n女：你好！(Niˇ haˇ o!)',
        options: ['你 (nǐ)', '您 (nín)', '你们 (nǐmén)', '大家 (dàijiā)'],
        correctAnswer: '您 (nín)',
      });
      expect(fixedQ.options).toEqual(['你 (nǐ)', '您 (nín)', '你们 (nǐmen)', '大家 (dàjiā)']);
      expect(fixedQ.questionChinese).toBe('男：王老师，您好！(Wáng lǎoshī, nín hǎo!)\n女：你好！(Nǐ hǎo!)');
    });

    it('should select context-fitting voices for diverse characters (Teacher, Student, AI Tiểu Ngữ, Parents) and parse named character dialogues', () => {
      // Teacher & Student dialogue
      const teacherStudentTurns = parseDialogueTurns('王老师：同学们，大家好！\n学生：王老师，您好！');
      expect(teacherStudentTurns).toEqual([
        { role: 'female', text: '同学们，大家好！' },
        { role: 'male', text: '王老师，您好！' },
      ]);

      // Context-aware voice cast selection
      const teacherCast = selectContextualVoiceCast('男：王老师，您好！\n女：你好！谢谢你们。');
      expect(teacherCast.female).toBe('zh-CN-XiaoxiaoNeural');
      expect(['zh-CN-YunxiaNeural', 'zh-CN-YunxiNeural']).toContain(teacherCast.male);

      const aiXiaoyuCast = selectContextualVoiceCast('男：AI小语，你好！很高兴认识你。\n女：你好！');
      expect(aiXiaoyuCast.female).toBe('zh-CN-XiaoyiNeural');

      const familyCast = selectContextualVoiceCast('爸爸：今天在家里做饭吗？\n妈妈：好的。');
      expect(familyCast.male).toBe('zh-CN-YunjianNeural');
      expect(familyCast.female).toBe('zh-CN-XiaoxiaoNeural');

      expect(selectContextualSingleVoice('AI小语，你好！')).toBe('zh-CN-XiaoyiNeural');
      expect(selectContextualSingleVoice('爸爸今天去医院看医生。')).toBe('zh-CN-YunjianNeural');
    });

    it('should unify 3-option listening MCQs to 4 options (A, B, C, D) in both external AI parser and workbook enricher', () => {
      const threeOptionRaw = `Câu 1:
男：王老师，您好！(Wáng lǎoshī, nín hǎo!)
女：你好！(Nǐ hǎo!)
问：男用什么称呼问候王老师？
A. 你 (nǐ)
B. 您 (nín)
C. 你们 (nǐmen)

ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: B. Giải thích: Học sinh dùng 您 để thể hiện sự kính trọng.`;

      const parsed = parseExternalAiHomeworkText(threeOptionRaw, 1, 'zh-CN-XiaoxiaoNeural');
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('listening');
      expect(parsed[0].options).toHaveLength(4);
      expect(new Set(parsed[0].options).size).toBe(4);
      expect(parsed[0].correctAnswer).toBe('您 (nín)');

      const enrichedHsk1 = getEnrichedWorkbookLessons(1);
      enrichedHsk1.forEach((lesson) => {
        lesson.listeningExercises.forEach((ex) => {
          const isTf =
            ex.options.length === 2 &&
            ex.options.some((o) => /[对错√×]|đúng|sai/i.test(`${o.textChinese || ''} ${o.textVietnamese || ''}`));
          if (!isTf) {
            expect(ex.options.length, `HSK 1 L${lesson.lessonNumber} ${ex.id}`).toBe(4);
          }
        });
        lesson.listenAndReadDrills.forEach((drill) => {
          drill.items.forEach((item) => {
            expect(item.options.length, `HSK 1 L${lesson.lessonNumber} ${item.id}`).toBe(4);
          });
        });
      });
    });
  });
});
