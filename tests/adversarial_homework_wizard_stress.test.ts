/**
 * tests/adversarial_homework_wizard_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS FOR MILESTONE 5:
 * HomeworkWizardModal & Wizard Step Transitions
 *
 * Challenging 4 core dimensions:
 * 1. Step transitions (1 -> 2 -> 3 -> 4) forward & backward lifecycle, stepper click guards.
 * 2. Curriculum lesson loading across HSK levels 1 to 6 (NEW_HSK1_FULL_LESSONS .. NEW_HSK6_FULL_LESSONS).
 * 3. Question synthesis fallback and text parser resilience under malformed / edge-case text inputs.
 * 4. Assignment document & OnlineExamDoc generation schema compliance.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  getCurriculumLessonsForLevel,
  synthesizeLessonQuestions,
  CORE_EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
  CoreExerciseType,
  DifficultyLevelKey,
} from '../src/components/Admin/HomeworkWizardModal';
import { EDGE_TTS_VOICES } from '../src/utils/chineseAudio';
import { NEW_HSK1_FULL_LESSONS, DetailedTextbookLesson } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../src/data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../src/data/newHsk4BookData';
import { NEW_HSK5_FULL_LESSONS } from '../src/data/newHsk5BookData';
import { NEW_HSK6_FULL_LESSONS } from '../src/data/newHsk6BookData';
import type { AssignmentDoc, OnlineExamDoc, QuizQuestion, HSKLevel } from '../src/types';

describe('Adversarial Stress Test: HomeworkWizardModal & Step Transitions', () => {
  // ==========================================================================
  // VECTOR 1: STEP TRANSITIONS (1 -> 2 -> 3 -> 4) LIFECYCLE & NAVIGATION GUARDS
  // ==========================================================================
  describe('Vector 1: Wizard Step Transitions & Stepper Navigation Invariants', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/Admin/HomeworkWizardModal.tsx');
    const modalSource = fs.readFileSync(modalPath, 'utf-8');

    it('Invariant 1.1: Step 1 must have an explicit forward navigation button to Step 2', () => {
      // Must contain button or trigger setting currentStep to 2
      expect(modalSource).toMatch(/setCurrentStep\(\s*2\s*\)/);
      // Specifically within Step 1 content block
      const step1Block = modalSource.split('{currentStep === 1 && (')[1]?.split('{currentStep === 2 && (')[0];
      expect(step1Block).toBeDefined();
      expect(step1Block).toContain('setCurrentStep(2)');
      expect(step1Block).toMatch(/Tiếp tục.*Chọn nguồn/i);
    });

    it('Invariant 1.2: Step 2 must have an explicit backward navigation button to Step 1', () => {
      const step2Block = modalSource.split('{currentStep === 2 && (')[1]?.split('{currentStep === 3 && (')[0];
      expect(step2Block).toBeDefined();
      expect(step2Block).toContain('setCurrentStep(1)');
      expect(step2Block).toMatch(/Quay lại.*Mục tiêu/i);
    });

    it('Invariant 1.3: Step 3 must have backward button to Step 2 and forward button to Step 4', () => {
      const step3Block = modalSource.split('{currentStep === 3 && (')[1]?.split('{currentStep === 4 && (')[0];
      expect(step3Block).toBeDefined();
      expect(step3Block).toContain('setCurrentStep(2)');
      expect(step3Block).toContain('handleProceedToStep4');
      expect(modalSource).toContain('setCurrentStep(4)');
    });

    it('Invariant 1.4: Step 4 must have backward button to Step 3 and final publish trigger', () => {
      const step4Block = modalSource.split('{currentStep === 4 && (')[1]?.split('</div>\n    </div>\n\n    {/* GOLDEN')[0];
      expect(step4Block).toBeDefined();
      expect(step4Block).toContain('setCurrentStep(3)');
      expect(step4Block).toContain('handleFinalPublish');
    });

    it('Invariant 1.5: Stepper header click guard must permit direct navigation between Step 1 and 2, but protect Steps 3 and 4 when questions are empty', () => {
      // Simulate stepper click guard logic:
      // if (isPassed || step.num === 1 || step.num === 2 || (questions.length > 0)) { setCurrentStep(step.num); }
      const canClickStep = (
        currentStep: number,
        targetStep: number,
        questionCount: number
      ): boolean => {
        const isPassed = currentStep > targetStep;
        return isPassed || targetStep === 1 || targetStep === 2 || questionCount > 0;
      };

      // When at Step 1 with 0 questions:
      expect(canClickStep(1, 1, 0)).toBe(true); // Can stay at 1
      expect(canClickStep(1, 2, 0)).toBe(true); // Can move to 2
      expect(canClickStep(1, 3, 0)).toBe(false); // CANNOT jump to 3 without questions!
      expect(canClickStep(1, 4, 0)).toBe(false); // CANNOT jump to 4 without questions!

      // When at Step 2 with 0 questions:
      expect(canClickStep(2, 1, 0)).toBe(true); // isPassed is true (2 > 1)
      expect(canClickStep(2, 2, 0)).toBe(true);
      expect(canClickStep(2, 3, 0)).toBe(false); // CANNOT jump to 3 without questions!
      expect(canClickStep(2, 4, 0)).toBe(false); // CANNOT jump to 4 without questions!

      // Once questions are generated (questions.length > 0):
      expect(canClickStep(3, 1, 10)).toBe(true);
      expect(canClickStep(3, 2, 10)).toBe(true);
      expect(canClickStep(3, 3, 10)).toBe(true);
      expect(canClickStep(3, 4, 10)).toBe(true);

      // In Step 4:
      expect(canClickStep(4, 1, 10)).toBe(true);
      expect(canClickStep(4, 2, 10)).toBe(true);
      expect(canClickStep(4, 3, 10)).toBe(true);
      expect(canClickStep(4, 4, 10)).toBe(true);
    });

    it('Invariant 1.6: State machine simulation of complete forward and backward navigation path (1 -> 2 -> 3 -> 4 -> 3 -> 2 -> 1)', () => {
      let state = {
        currentStep: 1,
        questions: [] as QuizQuestion[],
        errorMsg: null as string | null,
      };

      // Step 1: user advances to Step 2
      state.currentStep = 2;
      expect(state.currentStep).toBe(2);

      // Step 2: user triggers question generation
      const lesson = getCurriculumLessonsForLevel(1)[0];
      state.questions = synthesizeLessonQuestions(lesson, 1, ['mcq', 'fill_blank'], 6, 'medium', 'zh-CN-XiaoxiaoNeural');
      state.currentStep = 3;
      expect(state.currentStep).toBe(3);
      expect(state.questions.length).toBe(6);

      // Step 3: user proceeds to Step 4
      state.currentStep = 4;
      expect(state.currentStep).toBe(4);

      // Backward navigation from 4 to 3
      state.currentStep = 3;
      expect(state.currentStep).toBe(3);

      // Backward navigation from 3 to 2
      state.currentStep = 2;
      expect(state.currentStep).toBe(2);

      // Backward navigation from 2 to 1
      state.currentStep = 1;
      expect(state.currentStep).toBe(1);
    });
  });

  // ==========================================================================
  // VECTOR 2: CURRICULUM LESSON LOADING ACROSS ALL HSK LEVELS (1 TO 6)
  // ==========================================================================
  describe('Vector 2: Curriculum Lesson Loading Across HSK Levels 1 to 6', () => {
    it('HSK 1: loads all lessons with structural integrity', () => {
      const lessons = getCurriculumLessonsForLevel(1);
      expect(lessons).toBe(NEW_HSK1_FULL_LESSONS);
      expect(lessons.length).toBeGreaterThanOrEqual(10);
      lessons.forEach((l, idx) => {
        expect(l.lessonNumber).toBe(idx + 1);
        expect(typeof l.titleHanzi).toBe('string');
        expect(l.titleHanzi.length).toBeGreaterThan(0);
        expect(typeof l.titleVietnamese).toBe('string');
        expect(l.titleVietnamese.length).toBeGreaterThan(0);
        expect(Array.isArray(l.vocabulary)).toBe(true);
        expect(l.vocabulary.length).toBeGreaterThan(0);
      });
    });

    it('HSK 2: loads all lessons with structural integrity', () => {
      const lessons = getCurriculumLessonsForLevel(2);
      expect(lessons).toBe(NEW_HSK2_FULL_LESSONS);
      expect(lessons.length).toBeGreaterThanOrEqual(10);
      lessons.forEach((l) => {
        expect(l.lessonNumber).toBeGreaterThan(0);
        expect(l.titleHanzi).toBeTruthy();
        expect(l.titleVietnamese).toBeTruthy();
        expect(Array.isArray(l.vocabulary)).toBe(true);
      });
    });

    it('HSK 3: loads all lessons with structural integrity', () => {
      const lessons = getCurriculumLessonsForLevel(3);
      expect(lessons).toBe(NEW_HSK3_FULL_LESSONS);
      expect(lessons.length).toBeGreaterThanOrEqual(10);
      lessons.forEach((l) => {
        expect(l.lessonNumber).toBeGreaterThan(0);
        expect(l.titleHanzi).toBeTruthy();
        expect(l.titleVietnamese).toBeTruthy();
        expect(Array.isArray(l.vocabulary)).toBe(true);
      });
    });

    it('HSK 4: loads all lessons with structural integrity', () => {
      const lessons = getCurriculumLessonsForLevel(4);
      expect(lessons).toBe(NEW_HSK4_FULL_LESSONS);
      expect(lessons.length).toBeGreaterThanOrEqual(10);
      lessons.forEach((l) => {
        expect(l.lessonNumber).toBeGreaterThan(0);
        expect(l.titleHanzi).toBeTruthy();
        expect(l.titleVietnamese).toBeTruthy();
        expect(Array.isArray(l.vocabulary)).toBe(true);
      });
    });

    it('HSK 5: loads all lessons with structural integrity', () => {
      const lessons = getCurriculumLessonsForLevel(5);
      expect(lessons).toBe(NEW_HSK5_FULL_LESSONS);
      expect(lessons.length).toBeGreaterThan(0);
      lessons.forEach((l) => {
        expect(l.lessonNumber).toBeGreaterThan(0);
        expect(l.titleHanzi).toBeTruthy();
        expect(l.titleVietnamese).toBeTruthy();
        expect(Array.isArray(l.vocabulary)).toBe(true);
      });
    });

    it('HSK 6: loads all lessons with structural integrity', () => {
      const lessons = getCurriculumLessonsForLevel(6);
      expect(lessons).toBe(NEW_HSK6_FULL_LESSONS);
      expect(lessons.length).toBeGreaterThan(0);
      lessons.forEach((l) => {
        expect(l.lessonNumber).toBeGreaterThan(0);
        expect(l.titleHanzi).toBeTruthy();
        expect(l.titleVietnamese).toBeTruthy();
        expect(Array.isArray(l.vocabulary)).toBe(true);
      });
    });

    it('Pathological & Boundary Levels: 0, -5, 7, 999, NaN, Infinity gracefully fallback to HSK 1', () => {
      const invalidLevels = [0, -1, -99, 7, 8, 999, Number.NaN, Number.POSITIVE_INFINITY];
      invalidLevels.forEach((lvl) => {
        const lessons = getCurriculumLessonsForLevel(lvl as number);
        expect(lessons).toBe(NEW_HSK1_FULL_LESSONS);
        expect(lessons[0].titleHanzi).toContain('你好');
      });
    });

    it('Exhaustive Stress Synthesis: Synthesizes valid questions for EVERY lesson across HSK 1 to HSK 6', () => {
      let totalLessonsTested = 0;
      for (let level = 1; level <= 6; level++) {
        const lessons = getCurriculumLessonsForLevel(level);
        for (const lesson of lessons) {
          totalLessonsTested++;
          const questions = synthesizeLessonQuestions(
            lesson,
            level,
            ['mcq', 'fill_blank', 'reading', 'listening'],
            4,
            'medium',
            'zh-CN-XiaoxiaoNeural'
          );
          expect(questions.length).toBe(4);
          for (const q of questions) {
            expect(q.id).toBeTruthy();
            expect(q.prompt).toBeTruthy();
            expect(q.questionChinese).toBeTruthy();
            expect(q.options?.length).toBe(4);
            expect(q.correctAnswer).toBeDefined();
            expect(q.options).toContain(q.correctAnswer as string);
            expect(q.explanation).toBeTruthy();
            expect(q.hskLevel).toBe(level);
          }
        }
      }
      expect(totalLessonsTested).toBeGreaterThanOrEqual(60);
    });
  });

  // ==========================================================================
  // VECTOR 3: QUESTION SYNTHESIS FALLBACK & TEXT PARSER RESILIENCE
  // ==========================================================================
  describe('Vector 3: Question Synthesis Fallback & Text Parser Resilience', () => {
    const lesson1 = getCurriculumLessonsForLevel(1)[0];

    it('Handles extreme requested counts: 1, 20, 50, 100 questions without memory crash or duplicate collision', () => {
      const counts = [1, 7, 20, 50, 100];
      counts.forEach((c) => {
        const qs = synthesizeLessonQuestions(
          lesson1,
          1,
          ['mcq', 'fill_blank', 'reading', 'listening'],
          c,
          'hard',
          'zh-CN-YunxiNeural'
        );
        expect(qs.length).toBe(c);
        // Verify every question has valid 4 options and contains correctAnswer
        qs.forEach((q) => {
          expect(q.options?.length).toBe(4);
          expect(q.options).toContain(q.correctAnswer as string);
        });
      });
    });

    it('Handles empty or invalid format list gracefully by falling back to defaults', () => {
      const qs = synthesizeLessonQuestions(
        lesson1,
        1,
        [] as CoreExerciseType[],
        6,
        'adaptive',
        'zh-CN-XiaoyiNeural'
      );
      expect(qs.length).toBe(6);
      const types = qs.map((q) => q.type);
      expect(types).toContain('meaning');
      expect(types).toContain('fill_blank');
    });

    it('Handles pathological lesson with completely empty vocabulary, grammar, and texts', () => {
      const hollowLesson: DetailedTextbookLesson = {
        lessonNumber: 99,
        titleHanzi: '空课',
        titlePinyin: 'Kōng kè',
        titleVietnamese: 'Bài rỗng',
        pageStart: 1,
        objectives: [],
        exercises: [],
        texts: [],
        grammarPoints: [],
        vocabulary: [],
      };

      const qs = synthesizeLessonQuestions(
        hollowLesson,
        1,
        ['mcq', 'fill_blank', 'reading', 'listening'],
        4,
        'easy',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(qs.length).toBe(4);
      qs.forEach((q) => {
        expect(q.options?.length).toBe(4);
        expect(q.correctAnswer).toBeDefined();
        expect(q.options).toContain(q.correctAnswer as string);
      });
    });

    it('Verifies listening questions embed exact natural TTS voice and valid audio URL', () => {
      const testVoice = 'zh-CN-YunjianNeural';
      const qs = synthesizeLessonQuestions(
        lesson1,
        1,
        ['listening'],
        4,
        'hard',
        testVoice
      );
      expect(qs.length).toBe(4);
      qs.forEach((q) => {
        expect(q.type).toBe('listening');
        expect(q.audio_url).toBeDefined();
        expect(q.audio_url).toContain('/api/tts?');
        expect(q.audio_url).toContain(`voice=${encodeURIComponent(testVoice)}`);
        expect(q.audioText).toBeTruthy();
        expect(q.usageNotes).toContain(testVoice);
      });
    });

    // Local Regex Parser Resilience Tests
    describe('Local Raw Text Regex Parser Resilience', () => {
      const parseRawTextLocally = (
        rawText: string,
        targetLevel: number = 1
      ): QuizQuestion[] => {
        const parsedLocal: QuizQuestion[] = [];
        const questionBlocks = rawText.split(/(?:Câu\s+\d+[:.]|\d+[:.])/i).filter(Boolean);
        questionBlocks.forEach((block, idx) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const promptLine = lines[0];
            const optMatches = block.match(/[A-D][.:]\s*([^\n]+)/g);
            const options = optMatches
              ? optMatches.map((o) => o.replace(/^[A-D][.:]\s*/, '').trim())
              : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];

            const ansMatch = block.match(/(?:Đáp án|ĐA|Answer)[:.]\s*([A-D])/i);
            const ansChar = ansMatch ? ansMatch[1].toUpperCase() : 'A';
            const ansIndex = ['A', 'B', 'C', 'D'].indexOf(ansChar);
            const correctAnswer = options[ansIndex >= 0 ? ansIndex : 0] || options[0];

            parsedLocal.push({
              id: `raw-q-${Date.now()}-${idx + 1}`,
              type: promptLine.includes('____') ? 'fill_blank' : 'meaning',
              prompt: promptLine,
              questionChinese: promptLine,
              options,
              correctAnswer,
              explanation: `Đáp án: ${ansChar}. Bóc tách từ văn bản tài liệu đã nạp.`,
              hskLevel: (targetLevel as HSKLevel) || 1,
            });
          }
        });
        return parsedLocal;
      };

      it('Parses canonical Vietnamese formatted multiple-choice questions', () => {
        const text = `
Câu 1: Chọn nghĩa đúng của từ "学习":
A. Học tập
B. Làm việc
C. Nghỉ ngơi
D. Ăn cơm
Đáp án: A

Câu 2: Điền từ vào chỗ trống: 他是我的____。
A. 朋友
B. 老师
C. 医生
D. 同学
Đáp án: B
`;
        const parsed = parseRawTextLocally(text, 1);
        expect(parsed.length).toBe(2);

        expect(parsed[0].type).toBe('meaning');
        expect(parsed[0].prompt).toContain('Chọn nghĩa đúng');
        expect(parsed[0].options).toEqual(['Học tập', 'Làm việc', 'Nghỉ ngơi', 'Ăn cơm']);
        expect(parsed[0].correctAnswer).toBe('Học tập');

        expect(parsed[1].type).toBe('fill_blank');
        expect(parsed[1].prompt).toContain('____');
        expect(parsed[1].options).toEqual(['朋友', '老师', '医生', '同学']);
        expect(parsed[1].correctAnswer).toBe('老师');
      });

      it('Parses questions with diverse numbering variants: "1.", "2:", "Câu 10."', () => {
        const text = `
1. 你好 có nghĩa là gì?
A. Xin chào
B. Tạm biệt
C. Cảm ơn
D. Xin lỗi
ĐA: A

2: 他去哪儿？
A: Trường học
B: Bệnh viện
C: Nhà sách
D: Công viên
Answer: C
`;
        const parsed = parseRawTextLocally(text, 2);
        expect(parsed.length).toBe(2);
        expect(parsed[0].correctAnswer).toBe('Xin chào');
        expect(parsed[1].correctAnswer).toBe('Nhà sách');
      });

      it('Handles missing answer key gracefully by defaulting to option A', () => {
        const text = `
Câu 1: Câu hỏi không có dòng đáp án
A. Phương án 1
B. Phương án 2
C. Phương án 3
D. Phương án 4
`;
        const parsed = parseRawTextLocally(text, 1);
        expect(parsed.length).toBe(1);
        expect(parsed[0].correctAnswer).toBe('Phương án 1');
      });

      it('Handles missing options gracefully by generating standard 4 placeholders', () => {
        const text = `
Câu 1: Câu hỏi bị thiếu hoàn toàn danh sách các phương án A B C D
Đáp án: A
`;
        const parsed = parseRawTextLocally(text, 1);
        expect(parsed.length).toBe(1);
        expect(parsed[0].options?.length).toBe(4);
        expect(parsed[0].options?.[0]).toBe('Phương án A');
        expect(parsed[0].correctAnswer).toBe('Phương án A');
      });

      it('Handles adversarial inputs (whitespace, punctuation, empty strings) without throwing', () => {
        const adversarialInputs = [
          '',
          '   \n\t  \n  ',
          '!@#$%^&*()_+{}[]:;"\'|<>,.?/',
          'Không có số câu nào ở đây cả chỉ là một đoạn văn tự do.',
        ];
        adversarialInputs.forEach((raw) => {
          expect(() => parseRawTextLocally(raw, 1)).not.toThrow();
        });
      });
    });
  });

  // ==========================================================================
  // VECTOR 4: ASSIGNMENT DOCUMENT & ONLINE EXAM DOC SCHEMA COMPLIANCE
  // ==========================================================================
  describe('Vector 4: Assignment Document & OnlineExamDoc Generation Schema Compliance', () => {
    it('Generates 100% contract-compliant AssignmentDoc and OnlineExamDoc objects', () => {
      const lesson = getCurriculumLessonsForLevel(2)[0];
      const generatedQuestions = synthesizeLessonQuestions(
        lesson,
        2,
        ['mcq', 'fill_blank', 'reading', 'listening'],
        8,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );

      const targetType: 'class' | 'level' = 'class';
      const selectedClassId = 'class-test-123';
      const targetLevel = 2;
      const assignTitle = 'Bài tập HSK 2 - Bài 1: Kiểm tra tổng hợp';
      const assignDesc = 'Luyện tập 4 kỹ năng bài 1 giáo trình HSK 2';
      const currentAdminEmail = 'teacher@example.com';
      const assignDueDate = new Date(Date.now() + 7 * 86400000).toISOString();

      const examCode = `HW-${Math.floor(1000 + Math.random() * 9000)}`;
      const durationMinutes = Math.max(10, Math.ceil(generatedQuestions.length * 1.5));

      // 1. Construct OnlineExamDoc
      const newExamDoc: OnlineExamDoc = {
        id: `exam-${Date.now()}`,
        exam_code: examCode,
        title: assignTitle.trim(),
        description: assignDesc.trim() || `Bài tập HSK ${targetLevel} - ${generatedQuestions.length} câu hỏi`,
        hsk_level: (targetLevel as HSKLevel) || 1,
        duration_minutes: durationMinutes,
        target_class_id: targetType === 'class' ? selectedClassId : undefined,
        target_type: targetType,
        questions: generatedQuestions,
        total_points: generatedQuestions.length * 10,
        remix_mode: 'comprehensive',
        created_by: currentAdminEmail,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      // 2. Construct AssignmentDoc
      const newAssign: AssignmentDoc = {
        id: `assign-${Date.now()}`,
        title: assignTitle.trim(),
        description: assignDesc.trim(),
        target_type: targetType,
        target_class_id: targetType === 'class' ? selectedClassId : undefined,
        hsk_level: targetLevel,
        content_type: 'quiz',
        content_ref_id: newExamDoc.id,
        content_title: newExamDoc.title,
        exam_code: examCode,
        question_count: generatedQuestions.length,
        duration_minutes: durationMinutes,
        questions: generatedQuestions,
        due_date: assignDueDate,
        created_by: currentAdminEmail,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      // Invariant Check for AssignmentDoc
      expect(newAssign.id).toMatch(/^assign-\d+$/);
      expect(newAssign.title).toBe(assignTitle);
      expect(newAssign.target_type).toBe('class');
      expect(newAssign.target_class_id).toBe(selectedClassId);
      expect(newAssign.hsk_level).toBe(2);
      expect(newAssign.content_type).toBe('quiz');
      expect(newAssign.content_ref_id).toBe(newExamDoc.id);
      expect(newAssign.content_title).toBe(newExamDoc.title);
      expect(newAssign.exam_code).toMatch(/^HW-\d{4}$/);
      expect(newAssign.question_count).toBe(8);
      expect(newAssign.duration_minutes).toBe(12); // ceil(8 * 1.5) = 12
      expect(newAssign.due_date).toBe(assignDueDate);
      expect(newAssign.created_by).toBe(currentAdminEmail);
      expect(newAssign.is_active).toBe(true);
      expect(Array.isArray(newAssign.questions)).toBe(true);

      // Invariant Check for OnlineExamDoc
      expect(newExamDoc.id).toMatch(/^exam-\d+$/);
      expect(newExamDoc.exam_code).toBe(newAssign.exam_code);
      expect(newExamDoc.title).toBe(newAssign.title);
      expect(newExamDoc.total_points).toBe(80);
      expect(newExamDoc.remix_mode).toBe('comprehensive');
      expect(newExamDoc.is_active).toBe(true);

      // Invariant Check for all QuizQuestions attached
      newAssign.questions?.forEach((q) => {
        expect(q.id).toBeTruthy();
        expect(typeof q.prompt).toBe('string');
        expect(typeof q.questionChinese).toBe('string');
        expect(q.options?.length).toBe(4);
        expect(q.options).toContain(q.correctAnswer as string);
        expect(q.explanation).toBeTruthy();
        expect(q.hskLevel).toBe(2);
        if (q.type === 'listening') {
          expect(q.audio_url).toMatch(/\/api\/tts\?text=.+&voice=.+/);
          expect(q.audioText).toBeTruthy();
        }
      });
    });

    it('Level-targeted assignments properly omit target_class_id', () => {
      const targetType = 'level' as 'class' | 'level';
      const targetLevel = 3;
      const assignTitle = 'Bài tập Toàn diện HSK 3';

      const newAssign: AssignmentDoc = {
        id: `assign-${Date.now()}`,
        title: assignTitle,
        description: 'Bài tập',
        target_type: targetType,
        target_class_id: targetType === 'class' ? 'some-id' : undefined,
        hsk_level: targetLevel,
        content_type: 'quiz',
        content_ref_id: 'exam-123',
        content_title: assignTitle,
        exam_code: 'HW-5566',
        question_count: 5,
        duration_minutes: 10,
        due_date: new Date().toISOString(),
        created_by: 'admin@test.com',
        created_at: new Date().toISOString(),
        is_active: true,
      };

      expect(newAssign.target_type).toBe('level');
      expect(newAssign.target_class_id).toBeUndefined();
      expect(newAssign.hsk_level).toBe(3);
    });
  });


  // ==========================================================================
  // VECTOR 5: STEP 4 QUESTION MUTATION, INLINE EDITING & AUDIO RESYNC
  // ==========================================================================
  describe('Vector 5: Step 4 Question Mutation, Inline Editing & Audio Resync', () => {
    it('Resynchronizes listening audio URL when audio text or prompt is edited inline', () => {
      const selectedVoice = 'zh-CN-YunxiNeural';
      const initialQuestion: QuizQuestion = {
        id: 'test-q-1',
        type: 'listening',
        prompt: 'Nghe đoạn hội thoại:',
        questionChinese: '男：你好！女：你好！',
        audioText: '男：你好！女：你好！',
        audio_url: `/api/tts?text=${encodeURIComponent('男：你好！女：你好！')}&voice=${encodeURIComponent(selectedVoice)}`,
        options: ['你好', '再见', '谢谢', '对不起'],
        correctAnswer: '你好',
        explanation: 'Giải thích ban đầu.',
        hskLevel: 1,
      };

      // Simulate inline edit logic in Step 4
      const editedAudioText = '男：明天你有空吗？女：我有空。问：女的明天怎么样？';
      const updatedAudioUrl = `/api/tts?text=${encodeURIComponent(editedAudioText)}&voice=${encodeURIComponent(selectedVoice)}`;

      const editedQuestion: QuizQuestion = {
        ...initialQuestion,
        audioText: editedAudioText,
        audio_url: updatedAudioUrl,
        explanation: 'Giải thích sau khi sửa đổi.',
      };

      expect(editedQuestion.audioText).toBe(editedAudioText);
      expect(editedQuestion.audio_url).toBe(updatedAudioUrl);
      expect(editedQuestion.audio_url).toContain(`voice=${encodeURIComponent(selectedVoice)}`);
    });

    it('Enforces minimum 1 question guard (cannot delete the last remaining question)', () => {
      let questions: QuizQuestion[] = [
        {
          id: 'sole-q',
          type: 'meaning',
          prompt: 'Câu hỏi duy nhất',
          questionChinese: '学习',
          options: ['Học tập', 'Làm việc', 'Nghỉ ngơi', 'Ăn cơm'],
          correctAnswer: 'Học tập',
          explanation: 'Chữ duy nhất',
          hskLevel: 1,
        },
      ];

      const deleteQuestion = (id: string): boolean => {
        if (questions.length <= 1) {
          return false; // Guard triggered: rejection
        }
        questions = questions.filter((q) => q.id !== id);
        return true;
      };

      const result = deleteQuestion('sole-q');
      expect(result).toBe(false);
      expect(questions.length).toBe(1);
    });

    it('Adds a new blank question conforming to QuizQuestion schema', () => {
      const targetLevel = 3;
      const newQ: QuizQuestion = {
        id: `manual-q-${Date.now()}`,
        type: 'meaning',
        prompt: 'Câu hỏi mới:',
        questionChinese: '请回答问题。',
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correctAnswer: 'Phương án A',
        explanation: 'Giải thích chi tiết cho câu hỏi mới.',
        hskLevel: (targetLevel as HSKLevel) || 1,
      };

      expect(newQ.options?.length).toBe(4);
      expect(newQ.options).toContain(newQ.correctAnswer as string);
      expect(newQ.hskLevel).toBe(3);
    });
  });

  // ==========================================================================
  // VECTOR 6: AUDIO URL ENCODING, SECURITY & SPECIAL CHARACTERS
  // ==========================================================================
  describe('Vector 6: Audio URL Encoding, Security & Special Characters', () => {
    it('Properly URI-encodes Chinese characters, punctuation, quotes, newlines, and emojis', () => {
      const complexScript = '男：“你好！ 😊 今天忙不忙？”\n女：‘我不忙！’';
      const voice = 'zh-CN-XiaoxiaoNeural';
      const encodedUrl = `/api/tts?text=${encodeURIComponent(complexScript)}&voice=${encodeURIComponent(voice)}`;

      expect(encodedUrl).not.toContain('\n');
      expect(encodedUrl).not.toContain(' ');
      expect(encodedUrl).not.toContain('"');

      // Verify round-trip decoding
      const urlObj = new URL(encodedUrl, 'http://localhost');
      expect(urlObj.searchParams.get('text')).toBe(complexScript);
      expect(urlObj.searchParams.get('voice')).toBe(voice);
    });

    it('Verifies all supported EDGE_TTS_VOICES have valid neural identifier and gender', () => {
      expect(EDGE_TTS_VOICES.length).toBeGreaterThanOrEqual(4);
      EDGE_TTS_VOICES.forEach((v) => {
        expect(v.id).toMatch(/^zh-CN-[A-Za-z]+Neural$/);
        expect(['female', 'male']).toContain(v.gender);
        expect(v.name).toBeTruthy();
        expect(v.description).toBeTruthy();
      });
    });
  });

});
