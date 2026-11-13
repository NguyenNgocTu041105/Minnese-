import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Sparkles,
  FileText,
  Check,
  Play,
  Square,
  Layers,
  Wand2,
  GraduationCap,
  Users,
  Send,
  HelpCircle,
  FileSpreadsheet,
  Headphones,
  Upload,
  RefreshCw,
} from 'lucide-react';
import {
  ClassDoc,
  AssignmentDoc,
  QuizQuestion,
  OnlineExamDoc,
  HSKLevel,
} from '../../types';
import {
  EDGE_TTS_VOICES,
  playPutonghuaAudioStream,
  stopChineseAudio,
} from '../../utils/chineseAudio';
import {
  GoldenPromptLibraryModal,
  GoldenPromptFormatKey,
  buildGoldenPrompt,
  LessonScopePromptContext,
} from './GoldenPromptLibraryModal';
import {
  NEW_HSK1_FULL_LESSONS,
  DetailedTextbookLesson,
} from '../../data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../../data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../../data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../../data/newHsk4BookData';
import { NEW_HSK5_FULL_LESSONS } from '../../data/newHsk5BookData';
import { NEW_HSK6_FULL_LESSONS } from '../../data/newHsk6BookData';
import {
  saveAssignmentToFirestore,
  saveOnlineExamToFirestore,
} from '../../lib/firebase';

// Helper: retrieve textbook lessons for a specific HSK level
export function getCurriculumLessonsForLevel(level: number): DetailedTextbookLesson[] {
  switch (level) {
    case 1:
      return NEW_HSK1_FULL_LESSONS;
    case 2:
      return NEW_HSK2_FULL_LESSONS;
    case 3:
      return NEW_HSK3_FULL_LESSONS;
    case 4:
      return NEW_HSK4_FULL_LESSONS;
    case 5:
      return NEW_HSK5_FULL_LESSONS;
    case 6:
      return NEW_HSK6_FULL_LESSONS;
    default:
      return NEW_HSK1_FULL_LESSONS;
  }
}

// 4 Core Exercise Types for Requirement R3
export type CoreExerciseType = 'mcq' | 'fill_blank' | 'reading' | 'listening';

export interface ExerciseTypeOption {
  key: CoreExerciseType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  defaultChecked: boolean;
}

export const CORE_EXERCISE_TYPES: ExerciseTypeOption[] = [
  {
    key: 'mcq',
    title: 'Trắc nghiệm (MCQ)',
    subtitle: 'Kiểm tra nghĩa từ vựng, ngữ pháp & nhận diện ngữ âm Pinyin',
    icon: CheckCircle2,
    tag: 'Từ vựng & Ngữ pháp',
    defaultChecked: true,
  },
  {
    key: 'fill_blank',
    title: 'Điền từ vào chỗ trống',
    subtitle: 'Hoàn thành câu giao tiếp chuẩn xác chứa chỗ trống ____',
    icon: Edit3,
    tag: 'Vận dụng câu',
    defaultChecked: true,
  },
  {
    key: 'reading',
    title: 'Đọc hiểu (Reading)',
    subtitle: 'Đọc đoạn văn / đối thoại bài học và trả lời câu hỏi suy luận',
    icon: BookOpen,
    tag: 'Hiểu văn cảnh',
    defaultChecked: true,
  },
  {
    key: 'listening',
    title: 'Bài tập Nghe (Listening)',
    subtitle: 'Đoạn hội thoại phân vai Nam - Nữ kèm giọng đọc TTS tự nhiên',
    icon: Headphones,
    tag: 'Luyện nghe phản xạ',
    defaultChecked: true,
  },
];

// Difficulty Level Configuration
export type DifficultyLevelKey = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface DifficultyLevelOption {
  key: DifficultyLevelKey;
  label: string;
  description: string;
  speechRate: number;
  badgeColor: string;
}

export const DIFFICULTY_LEVELS: DifficultyLevelOption[] = [
  {
    key: 'easy',
    label: 'Cơ bản (Easy)',
    description: 'Nhận biết từ vựng trực tiếp, mẫu câu ngắn, phát âm chậm rãi rõ ràng (0.8x)',
    speechRate: 0.8,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  {
    key: 'medium',
    label: 'Trung bình (Standard)',
    description: 'Thông hiểu và ứng dụng cấu trúc ngữ pháp bài học theo tiến độ (0.9x)',
    speechRate: 0.9,
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  {
    key: 'hard',
    label: 'Nâng cao (Challenging)',
    description: 'Tích hợp bẫy tư duy, biện biệt từ gần nghĩa, ngữ tốc tự nhiên người bản xứ (1.0x)',
    speechRate: 1.0,
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  {
    key: 'adaptive',
    label: 'Thích ứng (Adaptive)',
    description: 'Tự động phân bổ 40% Cơ bản, 40% Trung bình, 20% Nâng cao bám sát trình độ của lớp',
    speechRate: 0.9,
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
];

export interface HomeworkWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassDoc[];
  myClasses: ClassDoc[];
  onlineExams: OnlineExamDoc[];
  currentAdminEmail: string;
  onSuccess: (newAssign: AssignmentDoc) => void;
}

/**
 * High-performance, pedagogical Algorithmic Question Synthesizer
 * Guarantees rich, authentic, 100% offline-resilient questions directly from textbook lesson data.
 */
export function synthesizeLessonQuestions(
  lesson: DetailedTextbookLesson,
  level: number,
  selectedFormats: CoreExerciseType[],
  count: number,
  difficulty: DifficultyLevelKey,
  ttsVoice: string
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const vocab = lesson.vocabulary || [];
  const grammar = lesson.grammarPoints || [];
  const texts = lesson.texts || [];

  const timestamp = Date.now();
  let qIdx = 1;

  // Rate based on difficulty
  const activeDifficultyMeta =
    DIFFICULTY_LEVELS.find((d) => d.key === difficulty) || DIFFICULTY_LEVELS[1];

  // Helper to pick random distractor meanings
  const getVocabDistractors = (targetWord: any, pool: any[], needed: number = 3): string[] => {
    const others = pool
      .filter((w) => w.hanzi !== targetWord.hanzi)
      .map((w) => w.vietnamese || w.meaning || 'khác');
    const shuffled = [...new Set(others)].sort(() => 0.5 - Math.random());
    const result = shuffled.slice(0, needed);
    while (result.length < needed) {
      result.push(`Nghĩa bổ sung ${result.length + 1}`);
    }
    return result;
  };

  // Helper to pick random distractor Hanzi
  const getHanziDistractors = (targetWord: any, pool: any[], needed: number = 3): string[] => {
    const others = pool
      .filter((w) => w.hanzi !== targetWord.hanzi)
      .map((w) => w.hanzi);
    const shuffled = [...new Set(others)].sort(() => 0.5 - Math.random());
    const result = shuffled.slice(0, needed);
    while (result.length < needed) {
      result.push(`词${result.length + 1}`);
    }
    return result;
  };

  // Generate for each selected format
  const formatsToGenerate = selectedFormats.length > 0 ? selectedFormats : ['mcq', 'fill_blank'];
  const questionsPerFormat = Math.max(1, Math.floor(count / formatsToGenerate.length));

  formatsToGenerate.forEach((fmt) => {
    if (fmt === 'mcq') {
      // 1. Multiple Choice (Trắc nghiệm)
      for (let i = 0; i < questionsPerFormat; i++) {
        const v = vocab[(i + 0) % (vocab.length || 1)] || {
          hanzi: '学习',
          pinyin: 'xuéxí',
          vietnamese: 'học tập',
        };
        const correct = v.vietnamese;
        const distractors = getVocabDistractors(v, vocab, 3);
        const options = [correct, ...distractors].sort(() => 0.5 - Math.random());

        questions.push({
          id: `wiz-mcq-${timestamp}-${qIdx++}`,
          type: 'meaning',
          prompt: `Chọn nghĩa tiếng Việt chính xác của từ chữ Hán sau:`,
          questionChinese: `${v.hanzi} (${v.pinyin})`,
          options,
          correctAnswer: correct,
          explanation: `Chữ Hán "${v.hanzi}" có phiên âm Pinyin là "${v.pinyin}", mang ý nghĩa là "${v.vietnamese}". Đây là từ vựng trọng tâm trong Bài ${lesson.lessonNumber}.`,
          hskLevel: (level as HSKLevel) || 1,
          usageNotes: `Cấp độ: HSK ${level} • ${activeDifficultyMeta.label}`,
        });
      }
    } else if (fmt === 'fill_blank') {
      // 2. Fill in the blank (Điền từ vào chỗ trống)
      for (let i = 0; i < questionsPerFormat; i++) {
        let sentenceHanzi = '';
        let sentenceVi = '';
        let targetWord = vocab[(i + 1) % (vocab.length || 1)] || {
          hanzi: '好',
          pinyin: 'hǎo',
          vietnamese: 'tốt, khỏe',
        };

        // Try to find an example sentence containing this word
        for (const gp of grammar) {
          const matchedEx = gp.examples?.find((e) => e.hanzi?.includes(targetWord.hanzi));
          if (matchedEx) {
            sentenceHanzi = matchedEx.hanzi;
            sentenceVi = matchedEx.vietnamese;
            break;
          }
        }

        if (!sentenceHanzi && texts.length > 0) {
          const t = texts[0];
          if (t.lines && t.lines.length > 0) {
            const line = t.lines.find((d) => d.hanzi?.includes(targetWord.hanzi));
            if (line) {
              sentenceHanzi = line.hanzi;
              sentenceVi = line.vietnamese || '';
            }
          }
        }

        if (!sentenceHanzi) {
          sentenceHanzi = `他是我的${targetWord.hanzi}。`;
          sentenceVi = `Anh ấy là ... của tôi.`;
        }

        const blankedSentence = sentenceHanzi.includes(targetWord.hanzi)
          ? sentenceHanzi.replace(targetWord.hanzi, '____')
          : `____${sentenceHanzi.slice(1)}`;

        const distractors = getHanziDistractors(targetWord, vocab, 3);
        const options = [targetWord.hanzi, ...distractors].sort(() => 0.5 - Math.random());

        questions.push({
          id: `wiz-fill-${timestamp}-${qIdx++}`,
          type: 'fill_blank',
          prompt: `Chọn từ thích hợp nhất điền vào chỗ trống:`,
          questionChinese: blankedSentence,
          options,
          correctAnswer: targetWord.hanzi,
          explanation: `Từ cần điền là "${targetWord.hanzi}" (${targetWord.pinyin} - ${targetWord.vietnamese}). Câu hoàn chỉnh: "${sentenceHanzi}" ${sentenceVi ? `(${sentenceVi})` : ''}.`,
          hskLevel: (level as HSKLevel) || 1,
          usageNotes: `Cấp độ: HSK ${level} • ${activeDifficultyMeta.label}`,
        });
      }
    } else if (fmt === 'reading') {
      // 3. Reading Comprehension (Đọc hiểu)
      for (let i = 0; i < questionsPerFormat; i++) {
        const primaryText = texts[i % (texts.length || 1)] || texts[0];
        let passage = '';
        if (primaryText?.lines && primaryText.lines.length > 0) {
          passage = primaryText.lines
            .map((d) => `${d.speaker ? `${d.speaker}：` : ''}${d.hanzi}`)
            .join('\n');
        } else if (primaryText?.context) {
          passage = primaryText.context;
        } else {
          passage = `我叫张明，是北京大学的学生。我今天去教室学习汉语，老师是李老师。`;
        }

        const v = vocab[(i + 2) % (vocab.length || 1)] || {
          hanzi: '李老师',
          vietnamese: 'thầy Lý',
        };

        const correct = `Bài khóa đề cập đến nội dung bài học: ${lesson.titleVietnamese || 'Giao tiếp hàng ngày'}`;
        const options = [
          correct,
          `Bài khóa không đề cập đến trường học hay giao tiếp`,
          `Nhân vật không tham gia bài học`,
          `Nội dung mang ý nghĩa phủ định hoàn toàn`,
        ].sort(() => 0.5 - Math.random());

        questions.push({
          id: `wiz-read-${timestamp}-${qIdx++}`,
          type: 'meaning',
          prompt: `Đọc đoạn ngữ cảnh / bài khóa sau và chọn nhận định chuẩn xác nhất:`,
          questionChinese: passage,
          options,
          correctAnswer: correct,
          explanation: `Căn cứ vào bài khóa Bài ${lesson.lessonNumber}: "${lesson.titleHanzi}" (${lesson.titleVietnamese}), nhận định đúng là "${correct}".`,
          hskLevel: (level as HSKLevel) || 1,
          usageNotes: `Cấp độ: HSK ${level} • ${activeDifficultyMeta.label}`,
        });
      }
    } else if (fmt === 'listening') {
      // 4. Listening Comprehension (Bài tập Nghe)
      for (let i = 0; i < questionsPerFormat; i++) {
        const v1 = vocab[(i * 2) % (vocab.length || 1)] || {
          hanzi: '今天',
          pinyin: 'jīntiān',
          vietnamese: 'hôm nay',
        };
        const v2 = vocab[(i * 2 + 1) % (vocab.length || 1)] || {
          hanzi: '高兴',
          pinyin: 'gāoxìng',
          vietnamese: 'vui vẻ',
        };

        const speaker1 = `男：你好！今天你忙吗？`;
        const speaker2 = `女：我不忙，我很${v2.hanzi}。`;
        const questionPrompt = `问：女的今天怎么样？`;
        const dialogueScript = `${speaker1}\n${speaker2}\n${questionPrompt}`;
        const audioText = `男：你好！今天你忙吗？女：我不忙，我很高兴。问：女的今天怎么样？`;

        const correct = v2.hanzi;
        const distractors = getHanziDistractors(v2, vocab, 3);
        const options = [correct, ...distractors].sort(() => 0.5 - Math.random());

        const audioUrl = `/api/tts?text=${encodeURIComponent(audioText)}&voice=${encodeURIComponent(ttsVoice)}`;

        questions.push({
          id: `wiz-listen-${timestamp}-${qIdx++}`,
          type: 'listening',
          prompt: `Nghe đoạn hội thoại đối đáp sau và chọn câu trả lời đúng:`,
          questionChinese: dialogueScript,
          audioText,
          audio_url: audioUrl,
          options,
          correctAnswer: correct,
          explanation: `Trong đoạn hội thoại đối thoại, người nữ nói: "我不忙，我很${v2.hanzi}." Do đó đáp án chính xác là "${correct}" (${v2.pinyin} - ${v2.vietnamese}).`,
          hskLevel: (level as HSKLevel) || 1,
          usageNotes: `Cấp độ: HSK ${level} • Giọng đọc: ${ttsVoice}`,
        });
      }
    }
  });

  // If questions generated are fewer than desired count, fill with extra MCQ or Fill-blank
  while (questions.length < count && vocab.length > 0) {
    const v = vocab[questions.length % vocab.length];
    const correct = v.vietnamese;
    const distractors = getVocabDistractors(v, vocab, 3);
    const options = [correct, ...distractors].sort(() => 0.5 - Math.random());

    questions.push({
      id: `wiz-extra-${timestamp}-${qIdx++}`,
      type: 'meaning',
      prompt: `Chọn nghĩa tiếng Việt của từ "${v.hanzi}":`,
      questionChinese: `${v.hanzi} (${v.pinyin})`,
      options,
      correctAnswer: correct,
      explanation: `Từ "${v.hanzi}" (${v.pinyin}) có nghĩa là "${v.vietnamese}".`,
      hskLevel: (level as HSKLevel) || 1,
    });
  }

  return questions.slice(0, count);
}

export type HomeworkScopeMode = 'strict_lesson' | 'cumulative' | 'custom_only';
export type HomeworkPromptTemplateKey =
  | 'mixed_homework'
  | 'reading_mcq'
  | 'fill_in_blank'
  | 'listening_dialogue'
  | 'dialogue_matching'
  | 'json_strict';

export interface HomeworkLessonPromptOptions {
  level: number;
  lessonNumber: number;
  titleHanzi: string;
  titleVietnamese: string;
  vocabItems: Array<{ hanzi: string; pinyin?: string; vietnamese?: string }>;
  grammarItems: Array<{ title: string; explanation?: string }>;
  scopeMode: HomeworkScopeMode;
  templateKey: HomeworkPromptTemplateKey;
  questionCount: number;
  difficultyLabel: string;
  teacherNote?: string;
  includePinyin?: boolean;
}

/**
 * Builds a Lesson-Scoped & Teacher-Controlled System Prompt specifically for Homework Assignments.
 * Unlike whole-level exam prompts, this strictly constrains vocabulary and grammar to the exact
 * lesson(s), words, and sentence patterns chosen or added by the teacher.
 */
export function buildHomeworkLessonSystemPrompt(opts: HomeworkLessonPromptOptions): string {
  const vocabFormatted =
    opts.vocabItems.length > 0
      ? opts.vocabItems
          .map((v) =>
            v.pinyin || v.vietnamese
              ? `${v.hanzi} (${[v.pinyin, v.vietnamese].filter(Boolean).join(' - ')})`
              : v.hanzi
          )
          .join(', ')
      : `Từ vựng trọng tâm của Bài ${opts.lessonNumber}`;

  const grammarFormatted =
    opts.grammarItems.length > 0
      ? opts.grammarItems
          .map((g, i) => `${i + 1}. ${g.title}${g.explanation ? ` (${g.explanation})` : ''}`)
          .join('\n   ')
      : `Mẫu câu giao tiếp trong Bài ${opts.lessonNumber}`;

  const scopeRuleText =
    opts.scopeMode === 'custom_only'
      ? `CHỈ TẬP TRUNG 100% vào đúng danh sách từ vựng và cấu trúc ngữ pháp giáo viên đã chỉ định bên dưới. Tuyệt đối KHÔNG tự ý lấy thêm từ vựng/ngữ pháp lan man của cả cấp độ HSK ${opts.level}.`
      : opts.scopeMode === 'cumulative'
      ? `Giới hạn từ vựng & ngữ pháp LŨY TIẾN từ Bài 1 đến Bài ${opts.lessonNumber} (Giáo trình New HSK ${opts.level}), trong đó ưu tiên kiểm tra trực tiếp từ vựng và cấu trúc của Bài ${opts.lessonNumber}. Tuyệt đối CẤM dùng từ vựng thuộc Bài ${opts.lessonNumber + 1} trở đi mà học viên chưa được học.`
      : `GIỚI HẠN NGHIÊM NGẶT TRONG BÀI HỌC HIỆN TẠI (Bài ${opts.lessonNumber}: ${opts.titleHanzi}). Không sinh tràn lan toàn bộ từ vựng/cấu trúc của cả level HSK ${opts.level}; chỉ dùng từ vựng bài này và các từ cơ bản học viên đã biết.`;

  if (opts.templateKey !== 'mixed_homework') {
    return buildGoldenPrompt({
      level: opts.level,
      format: opts.templateKey,
      questionCount: opts.questionCount,
      topic: `Bài ${opts.lessonNumber}: ${opts.titleHanzi} (${opts.titleVietnamese})`,
      includePinyin: opts.includePinyin ?? opts.level <= 3,
      lessonContext: {
        lessonNumber: opts.lessonNumber,
        titleHanzi: opts.titleHanzi,
        titleVietnamese: opts.titleVietnamese,
        vocabText: vocabFormatted,
        grammarText: grammarFormatted.replace(/\n\s*/g, '; '),
        scopeDescription: scopeRuleText,
        teacherNote: opts.teacherNote,
      },
    });
  }

  const pinyinRule =
    opts.includePinyin ?? opts.level <= 3
      ? 'BẮT BUỘC kèm phiên âm Pinyin có thanh điệu trong ngoặc đơn sau câu chữ Hán.'
      : 'Chỉ viết chữ Hán chuẩn, không kèm Pinyin ở câu dẫn.';

  return `Bạn là Giảng viên Tiếng Trung Sư phạm & Chuyên gia Thiết kế Bài tập Về nhà (Giáo trình New HSK ${opts.level}).
Hãy biên soạn bộ bài tập về nhà gồm ${opts.questionCount} câu hỏi bám sát tiến độ thực tế trên lớp của giáo viên:

1. THÔNG TIN BÀI HỌC & PHẠM VI KIẾN THỨC (DO GIÁO VIÊN QUYẾT ĐỊNH):
- Bài học vừa giảng dạy: Giáo trình New HSK ${opts.level} — Bài ${opts.lessonNumber}: ${opts.titleHanzi} (${opts.titleVietnamese})
- Độ khó mục tiêu: ${opts.difficultyLabel}
- Quy tắc phạm vi kiến thức: ${scopeRuleText}
- ${pinyinRule}

2. DANH SÁCH TỪ VỰNG BẮT BUỘC ĐƯA VÀO ĐỀ (DO GIÁO VIÊN CHỌN / BỔ SUNG):
   ${vocabFormatted}

3. CẤU TRÚC NGỮ PHÁP & MẪU CÂU BẮT BUỘC KIỂM TRA (DO GIÁO VIÊN CHỌN / BỔ SUNG):
   ${grammarFormatted}${opts.teacherNote?.trim() ? `\n\n4. YÊU CẦU SƯ PHẠM RIÊNG CỦA GIÁO VIÊN:\n   ${opts.teacherNote.trim()}` : ''}

YÊU CẦU CẤU TRÚC ĐỀ ĐA DẠNG & ĐỊNH DẠNG CHUẨN CANONICAL (ĐỂ HỆ THỐNG BÓC TÁCH TỰ ĐỘNG 100%):
Hãy kết hợp linh hoạt các dạng bài tập (Trắc nghiệm từ vựng/ngữ pháp, Điền từ vào chỗ trống ____, Đọc hiểu câu/đoạn ngắn, và Nghe hội thoại 男/女/问) xoay quanh đúng từ vựng & cấu trúc trên:
- Với câu Trắc nghiệm / Điền từ / Đọc hiểu:
  Câu [STT]: [Câu tiếng Trung có ____ hoặc câu hỏi đọc hiểu]
  A. [Phương án A]
  B. [Phương án B]
  C. [Phương án C]
  D. [Phương án D]
- Với câu Nghe hội thoại (nếu có):
  Câu [STT]:
  男：[Lời thoại nhân vật Nam dùng từ vựng/cấu trúc bài học]
  女：[Lời thoại nhân vật Nữ dùng từ vựng/cấu trúc bài học]
  问：[Câu hỏi kiểm tra thông tin]?
  A. [Phương án A]
  B. [Phương án B]
  C. [Phương án C]
  D. [Phương án D]

BẮT BUỘC ở cuối bài cung cấp bảng đáp án và giải thích theo đúng cấu trúc:
ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT:
Câu 1: [A/B/C/D]. Giải thích: [Dịch nghĩa tiếng Việt, chỉ rõ từ vựng/cấu trúc thuộc Bài ${opts.lessonNumber} được kiểm tra và lý do chọn đáp án].
Câu 2: [A/B/C/D]. Giải thích: ...`;
}

export const HomeworkWizardModal: React.FC<HomeworkWizardModalProps> = ({
  isOpen,
  onClose,
  classes,
  myClasses,
  onlineExams,
  currentAdminEmail,
  onSuccess,
}) => {
  // Step navigation: 1 -> 2 -> 3 -> 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Available classes: prioritize teacher's myClasses, fallback to classes
  const activeClassList = useMemo(() => {
    return myClasses && myClasses.length > 0 ? myClasses : classes;
  }, [myClasses, classes]);

  // Step 1: Target States
  const [targetType, setTargetType] = useState<'class' | 'level'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return activeClassList[0]?.id || '';
  });
  const [targetLevel, setTargetLevel] = useState<number>(() => {
    return activeClassList[0]?.hsk_level || 1;
  });

  // Selected Class details
  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || activeClassList[0];
  }, [classes, selectedClassId, activeClassList]);

  // Sync level with selected class
  useEffect(() => {
    if (targetType === 'class' && selectedClass) {
      setTargetLevel(selectedClass.hsk_level || 1);
    }
  }, [targetType, selectedClass]);

  // Dynamic Curriculum Lessons for Target Level
  const availableLessons = useMemo(() => {
    return getCurriculumLessonsForLevel(targetLevel);
  }, [targetLevel]);

  const [selectedLessonNumber, setSelectedLessonNumber] = useState<number>(1);

  const selectedLesson = useMemo(() => {
    return (
      availableLessons.find((l) => l.lessonNumber === selectedLessonNumber) ||
      availableLessons[0] || {
        lessonNumber: 1,
        titleHanzi: '你好',
        titlePinyin: 'Nǐ hǎo',
        titleVietnamese: 'Chào bạn',
        vocabulary: [],
        grammarPoints: [],
        texts: [],
        objectives: [],
        exercises: [],
        pageStart: 1,
      }
    );
  }, [availableLessons, selectedLessonNumber]);

  // Assignment Title & Due Date
  const [assignTitle, setAssignTitle] = useState<string>('');
  const [assignDesc, setAssignDesc] = useState<string>('');
  const [assignDueDate, setAssignDueDate] = useState<string>(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    d.setHours(23, 59, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
  });

  // Auto-suggest title when class or lesson changes
  useEffect(() => {
    const className = selectedClass?.class_name || `Lớp HSK ${targetLevel}`;
    const lessonTitle = `Bài ${selectedLesson.lessonNumber}: ${selectedLesson.titleHanzi} (${selectedLesson.titleVietnamese})`;
    setAssignTitle(`Bài tập: ${className} - ${lessonTitle}`);
  }, [selectedClass, selectedLesson, targetLevel]);

  // Step 2: Question Source & Golden Prompt States
  const [questionSource, setQuestionSource] = useState<
    'curriculum' | 'raw_text' | 'golden_prompt' | 'exam_bank'
  >('curriculum');
  const [practiceMode, setPracticeMode] = useState<
    'comprehensive' | 'listening' | 'reading' | 'grammar' | 'vocab'
  >('comprehensive');

  // Raw text import state
  const [rawPastedText, setRawPastedText] = useState<string>('');
  const [isParsingRawText, setIsParsingRawText] = useState<boolean>(false);

  // Golden Prompt & Lesson-Scoped Teacher Customizer states
  const [isGoldenPromptModalOpen, setIsGoldenPromptModalOpen] = useState<boolean>(false);
  const [appliedGoldenPrompt, setAppliedGoldenPrompt] = useState<string>('');
  const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState<boolean>(false);
  const [isGeneratingGoldenPrompt, setIsGeneratingGoldenPrompt] = useState<boolean>(false);
  const [copiedSystemPrompt, setCopiedSystemPrompt] = useState<boolean>(false);

  // Teacher's customizable Vocabulary & Grammar for the selected lesson
  const [selectedVocabHanzi, setSelectedVocabHanzi] = useState<string[]>([]);
  const [customVocabInput, setCustomVocabInput] = useState<string>('');
  const [selectedGrammarTitles, setSelectedGrammarTitles] = useState<string[]>([]);
  const [customGrammarInput, setCustomGrammarInput] = useState<string>('');
  const [lessonScopeMode, setLessonScopeMode] = useState<HomeworkScopeMode>('strict_lesson');
  const [homeworkPromptTemplate, setHomeworkPromptTemplate] =
    useState<HomeworkPromptTemplateKey>('mixed_homework');
  const [teacherPromptNote, setTeacherPromptNote] = useState<string>('');
  const [includePinyinInPrompt, setIncludePinyinInPrompt] = useState<boolean>(true);

  // Sync teacher's default selected vocabulary & grammar whenever selectedLesson changes
  useEffect(() => {
    const defaultVocab = (selectedLesson.vocabulary || []).map((v) => v.hanzi);
    const defaultGrammar = (selectedLesson.grammarPoints || []).map((g) => g.title);
    setSelectedVocabHanzi(defaultVocab);
    setSelectedGrammarTitles(defaultGrammar);
    setIsPromptManuallyEdited(false);
  }, [selectedLesson]);

  // Exam bank selection
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const matchingExams = useMemo(() => {
    return onlineExams.filter((e) => e.hsk_level === targetLevel || !e.hsk_level);
  }, [onlineExams, targetLevel]);

  // Step 3: Format, Difficulty & Audio States
  const [selectedFormats, setSelectedFormats] = useState<CoreExerciseType[]>([
    'mcq',
    'fill_blank',
    'reading',
    'listening',
  ]);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevelKey>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // TTS Voice state
  const [selectedVoice, setSelectedVoice] = useState<string>('zh-CN-XiaoxiaoNeural');
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState<boolean>(false);

  // Compute effective vocabulary items (teacher-selected lesson words + teacher's custom typed words)
  const effectiveVocabList = useMemo(() => {
    const basePool =
      lessonScopeMode === 'cumulative'
        ? availableLessons
            .filter((l) => l.lessonNumber <= selectedLesson.lessonNumber)
            .flatMap((l) => l.vocabulary || [])
        : selectedLesson.vocabulary || [];

    const selectedFromLesson = (selectedLesson.vocabulary || []).filter((v) =>
      selectedVocabHanzi.includes(v.hanzi)
    );

    // Parse teacher's custom vocabulary input (e.g. "咖啡 (kāfēi - cà phê), 图书馆, 电脑")
    const customParsed = customVocabInput
      .split(/[,;，；\n]+/)
      .map((raw) => raw.trim())
      .filter(Boolean)
      .map((item, idx) => {
        const matchParen = item.match(/^([^\s(（]+)\s*[（(]([^)）]+)[)）]$/);
        if (matchParen) {
          const hanzi = matchParen[1].trim();
          const inside = matchParen[2].split(/[-–—:]/).map((s) => s.trim());
          return {
            id: `custom-v-${idx}`,
            hanzi,
            pinyin: inside.length > 1 ? inside[0] : '',
            vietnamese: inside.length > 1 ? inside.slice(1).join(' - ') : inside[0] || hanzi,
          };
        }
        const parts = item.split(/[-–—:]/).map((s) => s.trim());
        return {
          id: `custom-v-${idx}`,
          hanzi: parts[0],
          pinyin: parts.length > 2 ? parts[1] : '',
          vietnamese: parts.length > 1 ? parts[parts.length - 1] : `từ vựng giáo viên thêm (${parts[0]})`,
        };
      });

    if (lessonScopeMode === 'custom_only') {
      const combined = [...customParsed, ...selectedFromLesson];
      return combined.length > 0 ? combined : selectedLesson.vocabulary || [];
    }

    if (lessonScopeMode === 'cumulative') {
      const seen = new Set<string>();
      const merged = [...customParsed, ...selectedFromLesson, ...basePool].filter((w) => {
        if (!w?.hanzi || seen.has(w.hanzi)) return false;
        seen.add(w.hanzi);
        return true;
      });
      return merged;
    }

    const combined = [...customParsed, ...selectedFromLesson];
    return combined.length > 0 ? combined : selectedLesson.vocabulary || [];
  }, [
    selectedLesson,
    selectedVocabHanzi,
    customVocabInput,
    lessonScopeMode,
    availableLessons,
  ]);

  // Compute effective grammar structures (teacher-selected lesson grammar + teacher's custom grammar)
  const effectiveGrammarList = useMemo(() => {
    const selectedFromLesson = (selectedLesson.grammarPoints || []).filter((g) =>
      selectedGrammarTitles.includes(g.title)
    );

    const customGrammarParsed = customGrammarInput
      .split(/[;\n；]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((raw, idx) => {
        const [titlePart, ...rest] = raw.split(/[:：-]/);
        return {
          id: `custom-g-${idx}`,
          title: titlePart.trim(),
          explanation: rest.join(':').trim() || `Cấu trúc ngữ pháp do giáo viên yêu cầu kiểm tra (${raw})`,
          examples: [
            {
              hanzi: titlePart.trim(),
              pinyin: '',
              vietnamese: rest.join(':').trim() || raw,
            },
          ],
        };
      });

    const combined = [...customGrammarParsed, ...selectedFromLesson];
    return combined.length > 0 ? combined : selectedLesson.grammarPoints || [];
  }, [selectedLesson, selectedGrammarTitles, customGrammarInput]);

  // Build effective lesson object for algorithmic/AI question generation
  const effectiveLessonForGeneration = useMemo<DetailedTextbookLesson>(() => {
    return {
      ...selectedLesson,
      vocabulary: effectiveVocabList as any,
      grammarPoints: effectiveGrammarList as any,
    };
  }, [selectedLesson, effectiveVocabList, effectiveGrammarList]);

  // Live auto-generated Lesson-Scoped System Prompt
  const autoGeneratedLessonPrompt = useMemo(() => {
    const diffLabel =
      DIFFICULTY_LEVELS.find((d) => d.key === difficultyLevel)?.label || 'Trung bình (Standard)';
    return buildHomeworkLessonSystemPrompt({
      level: targetLevel,
      lessonNumber: selectedLesson.lessonNumber,
      titleHanzi: selectedLesson.titleHanzi,
      titleVietnamese: selectedLesson.titleVietnamese,
      vocabItems: effectiveVocabList,
      grammarItems: effectiveGrammarList,
      scopeMode: lessonScopeMode,
      templateKey: homeworkPromptTemplate,
      questionCount,
      difficultyLabel: diffLabel,
      teacherNote: teacherPromptNote,
      includePinyin: includePinyinInPrompt,
    });
  }, [
    targetLevel,
    selectedLesson,
    effectiveVocabList,
    effectiveGrammarList,
    lessonScopeMode,
    homeworkPromptTemplate,
    questionCount,
    difficultyLevel,
    teacherPromptNote,
    includePinyinInPrompt,
  ]);

  // Keep appliedGoldenPrompt synced with autoGeneratedLessonPrompt unless manually edited by teacher
  useEffect(() => {
    if (!isPromptManuallyEdited) {
      setAppliedGoldenPrompt(autoGeneratedLessonPrompt);
    }
  }, [autoGeneratedLessonPrompt, isPromptManuallyEdited]);

  const lessonContextForModal = useMemo<LessonScopePromptContext>(() => {
    const vocabText = effectiveVocabList
      .map((v) => `${v.hanzi}${v.vietnamese ? ` (${v.vietnamese})` : ''}`)
      .join(', ');
    const grammarText = effectiveGrammarList.map((g) => g.title).join('; ');
    return {
      lessonNumber: selectedLesson.lessonNumber,
      titleHanzi: selectedLesson.titleHanzi,
      titleVietnamese: selectedLesson.titleVietnamese,
      vocabText,
      grammarText,
      scopeDescription:
        lessonScopeMode === 'cumulative'
          ? `Ôn tập lũy tiến từ Bài 1 đến Bài ${selectedLesson.lessonNumber}`
          : lessonScopeMode === 'custom_only'
          ? 'Chỉ dùng 100% từ vựng & cấu trúc giáo viên đã chọn'
          : `Giới hạn trong Bài ${selectedLesson.lessonNumber}: ${selectedLesson.titleHanzi}`,
      teacherNote: teacherPromptNote,
    };
  }, [selectedLesson, effectiveVocabList, effectiveGrammarList, lessonScopeMode, teacherPromptNote]);

  const handleCopySystemPrompt = async () => {
    const textToCopy = appliedGoldenPrompt || autoGeneratedLessonPrompt;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedSystemPrompt(true);
      setTimeout(() => setCopiedSystemPrompt(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Loading & Question State
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 4: Review & Inline Edit States
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editChinese, setEditChinese] = useState<string>('');
  const [editAudioText, setEditAudioText] = useState<string>('');
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
  const [editAnswer, setEditAnswer] = useState<string>('');
  const [editExplanation, setEditExplanation] = useState<string>('');

  // Audio testing inside Step 4 question cards
  const [playingQuestionId, setPlayingQuestionId] = useState<string | null>(null);

  // Handle voice preview in Step 3
  const handleToggleVoicePreview = async () => {
    if (isPlayingVoicePreview) {
      stopChineseAudio();
      setIsPlayingVoicePreview(false);
      return;
    }

    setIsPlayingVoicePreview(true);
    try {
      const sampleText = '你好！欢迎来到汉语课堂，今天我们一起练习听力。祝你学习进步！';
      const speed = DIFFICULTY_LEVELS.find((d) => d.key === difficultyLevel)?.speechRate || 0.9;
      await playPutonghuaAudioStream(sampleText, speed, selectedVoice);
    } catch (err) {
      console.warn('Voice preview error:', err);
    } finally {
      setIsPlayingVoicePreview(false);
    }
  };

  // Stop audio on unmount or modal close
  useEffect(() => {
    return () => {
      stopChineseAudio();
    };
  }, []);

  // Format selection toggle
  const toggleFormat = (key: CoreExerciseType) => {
    if (selectedFormats.includes(key)) {
      if (selectedFormats.length === 1) {
        alert('Vui lòng chọn ít nhất 1 dạng bài tập.');
        return;
      }
      setSelectedFormats(selectedFormats.filter((f) => f !== key));
    } else {
      setSelectedFormats([...selectedFormats, key]);
    }
  };

  // Generate / Load questions handler
  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    setErrorMsg(null);

    try {
      if (questionSource === 'curriculum' || questionSource === 'golden_prompt') {
        if (questionSource === 'golden_prompt') {
          setIsGeneratingGoldenPrompt(true);
        }

        // Attempt backend endpoint /api/gemini/generate-lesson-exercises with teacher's exact vocab, grammar & custom system prompt
        try {
          const res = await fetch('/api/gemini/generate-lesson-exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hskLevel: targetLevel,
              lessonNumber: selectedLesson.lessonNumber,
              titleHanzi: selectedLesson.titleHanzi,
              titleVietnamese: selectedLesson.titleVietnamese,
              vocabulary: effectiveVocabList,
              grammarPoints: effectiveGrammarList,
              count: questionCount,
              practiceMode,
              scopeMode: lessonScopeMode,
              teacherNote: teacherPromptNote,
              customSystemPrompt:
                questionSource === 'golden_prompt'
                  ? appliedGoldenPrompt || autoGeneratedLessonPrompt
                  : autoGeneratedLessonPrompt,
            }),
          });
          const data = await res.json();
          if (data.exercises && data.exercises.length > 0) {
            const mapped: QuizQuestion[] = data.exercises.map((ex: any, idx: number) => {
              const audioTxt = ex.audioText || ex.hanziPrompt || '';
              return {
                id: ex.id || `gen-q-${Date.now()}-${idx}`,
                type:
                  ex.type === 'fill_blank'
                    ? 'fill_blank'
                    : ex.type === 'listening'
                    ? 'listening'
                    : 'meaning',
                prompt: ex.question || ex.vietnamesePrompt || 'Chọn đáp án đúng:',
                questionChinese: ex.hanziPrompt || ex.questionChinese || '',
                audioText: audioTxt,
                audio_url: `/api/tts?text=${encodeURIComponent(audioTxt)}&voice=${encodeURIComponent(selectedVoice)}`,
                options: ex.options || ['A', 'B', 'C', 'D'],
                correctAnswer: ex.correctAnswer || (ex.options ? ex.options[0] : 'A'),
                explanation: ex.explanation || 'Giải thích chuẩn theo bài học.',
                hskLevel: (targetLevel as HSKLevel) || 1,
              };
            });
            setQuestions(mapped);
            setCurrentStep(3);
            setIsGeneratingGoldenPrompt(false);
            setIsGeneratingQuestions(false);
            return;
          }
        } catch (apiErr) {
          console.warn('API generate-lesson-exercises fallback to local synthesis:', apiErr);
        }

        // Guaranteed local algorithmic synthesis strictly using teacher's selected & custom vocab/grammar
        const synthetic = synthesizeLessonQuestions(
          effectiveLessonForGeneration,
          targetLevel,
          selectedFormats,
          questionCount,
          difficultyLevel,
          selectedVoice
        );
        setQuestions(synthetic);
        setCurrentStep(3);
        setIsGeneratingGoldenPrompt(false);
      } else if (questionSource === 'raw_text') {
        if (!rawPastedText.trim()) {
          setErrorMsg('Vui lòng dán văn bản bài tập hoặc tải file tài liệu lên.');
          setIsGeneratingQuestions(false);
          return;
        }

        setIsParsingRawText(true);
        // Call /api/workbooks/parse-and-remix or parse client-side
        try {
          const res = await fetch('/api/workbooks/parse-and-remix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'parse_raw',
              rawText: rawPastedText,
              targetHsk: targetLevel,
            }),
          });
          const data = await res.json();
          if (data.success && data.parsedQuestions && data.parsedQuestions.length > 0) {
            setQuestions(data.parsedQuestions);
            setCurrentStep(3);
            setIsGeneratingQuestions(false);
            setIsParsingRawText(false);
            return;
          }
        } catch (parseErr) {
          console.warn('Server parse failed, falling back to local regex parser:', parseErr);
        }

        // Local Regex Parser fallback for standard questions
        const parsedLocal: QuizQuestion[] = [];
        const questionBlocks = rawPastedText.split(/(?:Câu\s+\d+[:.]|\d+[:.])/i).filter(Boolean);
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

        if (parsedLocal.length > 0) {
          setQuestions(parsedLocal);
          setCurrentStep(3);
        } else {
          const fallbackQ = synthesizeLessonQuestions(
            effectiveLessonForGeneration,
            targetLevel,
            selectedFormats,
            questionCount,
            difficultyLevel,
            selectedVoice
          );
          setQuestions(fallbackQ);
          setCurrentStep(3);
        }
        setIsParsingRawText(false);
      } else if (questionSource === 'exam_bank') {
        const found = onlineExams.find((e) => e.id === selectedExamId);
        if (found && found.questions && found.questions.length > 0) {
          setQuestions(found.questions);
          setCurrentStep(3);
        } else {
          setErrorMsg('Vui lòng chọn một đề thi hợp lệ trong kho đề thi.');
        }
      }
    } catch (err: any) {
      console.error('Question generation error:', err);
      setErrorMsg(err.message || 'Lỗi sinh câu hỏi. Đang kích hoạt bộ sinh dự phòng.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Re-bind TTS voice and difficulty when user advances from Step 3 to Step 4
  const handleProceedToStep4 = () => {
    // If questions were already loaded, make sure listening questions use the selected voice
    const updated = questions.map((q) => {
      if (q.type === 'listening') {
        const audioTxt = q.audioText || q.questionChinese || q.prompt;
        return {
          ...q,
          audioText: audioTxt,
          audio_url: `/api/tts?text=${encodeURIComponent(audioTxt)}&voice=${encodeURIComponent(selectedVoice)}`,
        };
      }
      return q;
    });

    // If questions count is less than target, supplement
    if (updated.length < questionCount) {
      const extra = synthesizeLessonQuestions(
        effectiveLessonForGeneration,
        targetLevel,
        selectedFormats,
        questionCount,
        difficultyLevel,
        selectedVoice
      );
      setQuestions(extra);
    } else {
      setQuestions(updated);
    }

    setCurrentStep(4);
  };

  // Express 1-click creation from Step 1 straight to Step 4 review & publish
  const handleQuickCreate = () => {
    setErrorMsg('');
    const synthesized = synthesizeLessonQuestions(
      effectiveLessonForGeneration,
      targetLevel,
      selectedFormats,
      questionCount,
      difficultyLevel,
      selectedVoice
    );
    setQuestions(synthesized);
    setCurrentStep(4);
  };

  // Inline editing handlers
  const startEditingQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setEditPrompt(q.prompt || '');
    setEditChinese(q.questionChinese || '');
    setEditAudioText(q.audioText || '');
    setEditOptions(q.options && q.options.length >= 4 ? [...q.options] : ['', '', '', '']);
    setEditAnswer(Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer || '');
    setEditExplanation(q.explanation || '');
  };

  const saveEditingQuestion = () => {
    if (!editingQuestionId) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === editingQuestionId) {
          const updatedAudioUrl =
            q.type === 'listening'
              ? `/api/tts?text=${encodeURIComponent(editAudioText || editChinese)}&voice=${encodeURIComponent(selectedVoice)}`
              : q.audio_url;

          return {
            ...q,
            prompt: editPrompt,
            questionChinese: editChinese,
            audioText: editAudioText,
            audio_url: updatedAudioUrl,
            options: editOptions,
            correctAnswer: editAnswer,
            explanation: editExplanation,
          };
        }
        return q;
      })
    );
    setEditingQuestionId(null);
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionId(null);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Bài tập cần có ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleAddNewBlankQuestion = () => {
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
    setQuestions([...questions, newQ]);
    startEditingQuestion(newQ);
  };

  // Interactive audio playback for questions in Step 4
  const handlePlayQuestionAudio = async (q: QuizQuestion) => {
    if (playingQuestionId === q.id) {
      stopChineseAudio();
      setPlayingQuestionId(null);
      return;
    }

    setPlayingQuestionId(q.id);
    const audioText = q.audioText || q.questionChinese || q.prompt;
    try {
      const speed = DIFFICULTY_LEVELS.find((d) => d.key === difficultyLevel)?.speechRate || 0.9;
      await playPutonghuaAudioStream(audioText, speed, selectedVoice);
    } catch (err) {
      console.warn('Error playing question audio:', err);
    } finally {
      setPlayingQuestionId(null);
    }
  };

  // Final Publish Handler
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFinalPublish = async () => {
    if (questions.length === 0) {
      alert('Vui lòng tạo hoặc thêm ít nhất 1 câu hỏi cho bài tập.');
      return;
    }

    if (!assignTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bài tập.');
      return;
    }

    setIsSubmitting(true);
    try {
      const examCode = `HW-${Math.floor(1000 + Math.random() * 9000)}`;
      const durationMinutes = Math.max(10, Math.ceil(questions.length * 1.5));
      const finalDueDate = assignDueDate ? new Date(assignDueDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString();

      // 1. Create real OnlineExamDoc so it is 100% playable in OnlineExamRunner
      const newExamDoc: OnlineExamDoc = {
        id: `exam-${Date.now()}`,
        exam_code: examCode,
        title: assignTitle.trim(),
        description: assignDesc.trim() || `Bài tập HSK ${targetLevel} - ${questions.length} câu hỏi`,
        hsk_level: (targetLevel as HSKLevel) || 1,
        duration_minutes: durationMinutes,
        target_class_id: targetType === 'class' ? selectedClassId : undefined,
        target_type: targetType,
        questions,
        total_points: questions.length * 10,
        remix_mode: 'comprehensive',
        created_by: currentAdminEmail,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      // 2. Create AssignmentDoc
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
        question_count: questions.length,
        duration_minutes: durationMinutes,
        questions,
        due_date: finalDueDate,
        created_by: currentAdminEmail,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      // Save to Firestore
      await saveOnlineExamToFirestore(newExamDoc);
      await saveAssignmentToFirestore(newAssign);

      // Trigger parent success handler
      onSuccess(newAssign);
      onClose();
    } catch (err: any) {
      console.error('Failed to publish homework:', err);
      alert('Không thể lưu bài tập vào hệ thống: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        {/* MODAL HEADER WITH 4-STEP TRACKER */}
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shadow-xs">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span>Giao Bài Tập Về Nhà Mới</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold tracking-wide uppercase">
                    4-Step AI Wizard
                  </span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Cá nhân hóa theo tiến độ lớp • Multi-source & Golden Prompt • Giọng đọc Khảo thí TTS
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--color-border)]">
            {[
              { num: 1, label: 'Mục tiêu & Lớp', icon: GraduationCap },
              { num: 2, label: 'Nguồn & Prompt', icon: Sparkles },
              { num: 3, label: 'Định dạng & TTS', icon: Headphones },
              { num: 4, label: 'Duyệt & Giao bài', icon: Send },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPassed = currentStep > step.num;
              const Icon = step.icon;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (isPassed || step.num === 1 || step.num === 2 || (questions.length > 0)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                      : isPassed
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'
                      : 'text-[var(--color-text-secondary)] bg-[var(--color-background)]/50 opacity-70'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-white text-[var(--color-primary)]'
                        : isPassed
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : step.num}
                  </div>
                  <span className="text-[11px] truncate hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL BODY (DYNAMIC STEP CONTENT) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: TARGET SELECTION (CLASS & CURRICULUM LESSON) */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Target Type Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">
                  1. Đối tượng giao bài:
                </span>
                <div className="inline-flex p-1 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setTargetType('class')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                      targetType === 'class'
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    Theo Lớp Học Quản Lý
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('level')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                      targetType === 'level'
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    Theo Cấp Độ HSK (Toàn bộ)
                  </button>
                </div>
              </div>

              {/* Class Dropdown / Selector */}
              {targetType === 'class' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Chọn lớp học nhận bài tập:
                  </label>
                  {activeClassList.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
                      Bạn chưa tạo lớp học nào. Hãy chuyển sang &quot;Theo Cấp Độ HSK&quot; hoặc tạo lớp học mới ở tab &quot;Quản lý lớp&quot;.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeClassList.map((cls) => {
                        const isSelected = selectedClassId === cls.id;
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              setTargetLevel(cls.hsk_level || 1);
                            }}
                            className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 shadow-xs'
                                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)]'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                <span>{cls.class_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)]">
                                <span className="font-mono bg-[var(--color-background)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                                  {cls.class_code}
                                </span>
                                <span>{cls.student_count || 0} học viên</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                              HSK {cls.hsk_level}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                    Chọn cấp độ New HSK mục tiêu:
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setTargetLevel(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          targetLevel === lvl
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                        }`}
                      >
                        HSK {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Curriculum Lesson / Topic Selector */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>2. Chọn Bài Học Giáo Trình New HSK {targetLevel}:</span>
                  </label>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    {availableLessons.length} bài học có sẵn
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableLessons.map((l) => {
                    const isSelected = selectedLessonNumber === l.lessonNumber;
                    return (
                      <button
                        key={l.lessonNumber}
                        type="button"
                        onClick={() => setSelectedLessonNumber(l.lessonNumber)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 shadow-xs ring-1 ring-[var(--color-primary)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-primary)]">
                          <span>Bài {l.lessonNumber}: {l.titleHanzi}</span>
                          <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">
                            {l.vocabulary?.length || 0} từ • {l.grammarPoints?.length || 0} ngữ pháp
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] italic truncate">
                          {l.titlePinyin} — {l.titleVietnamese}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Compact Lesson Preview Pill */}
                {selectedLesson && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                      <span>Bài {selectedLesson.lessonNumber}: {selectedLesson.titleHanzi} ({selectedLesson.titleVietnamese})</span>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      {selectedLesson.vocabulary?.length || 0} từ vựng • {selectedLesson.grammarPoints?.length || 0} ngữ pháp
                    </span>
                  </div>
                )}
              </div>

              {/* Assignment Title & Due Date Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--color-border)]">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                    Tiêu đề bài tập:
                  </label>
                  <input
                    type="text"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    placeholder="VD: Bài tập HSK 1 - Bài 1: Chào bạn..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>Hạn nộp bài:</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Step 1 Footer Navigation */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-[var(--color-border)]">
                <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] font-semibold text-[var(--color-primary)]">
                    {targetType === 'class' ? (selectedClass?.class_name || `Lớp HSK ${targetLevel}`) : `HSK ${targetLevel}`}
                  </span>
                  <span className="truncate max-w-[220px]">
                    Bài {selectedLesson.lessonNumber}: {selectedLesson.titleHanzi}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickCreate}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    title="Tạo nhanh 10 câu hỏi theo bài học và chuyển thẳng sang bước duyệt & giao bài"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo nhanh 1 chạm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <span>Tiếp tục: Chọn nguồn câu hỏi</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: QUESTION SOURCE & GOLDEN PROMPT */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Nguồn tạo đề:
                </label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 bg-[var(--color-background)] p-1 rounded-xl border border-[var(--color-border)]">
                  {[
                    { key: 'curriculum', label: 'Từ Bài học', icon: BookOpen },
                    { key: 'golden_prompt', label: 'System Prompt', icon: Sparkles },
                    { key: 'raw_text', label: 'Dán văn bản', icon: FileText },
                    { key: 'exam_bank', label: 'Kho Đề thi', icon: Layers },
                  ].map((src) => {
                    const isSelected = questionSource === src.key;
                    const Icon = src.icon;
                    return (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() => setQuestionSource(src.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shared Teacher Vocabulary & Grammar Customizer for Curriculum & Golden Prompt */}
              {(questionSource === 'curriculum' || questionSource === 'golden_prompt') && (
                <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>
                        Từ vựng & Ngữ pháp — Bài {selectedLesson.lessonNumber}: {selectedLesson.titleHanzi} ({selectedLesson.titleVietnamese})
                      </span>
                    </h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold">
                      HSK {targetLevel} • Bài {selectedLesson.lessonNumber}
                    </span>
                  </div>

                  {/* Scope Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[var(--color-text-primary)]">
                      1. Phạm vi kiến thức cho phép khi sinh đề:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          key: 'strict_lesson' as HomeworkScopeMode,
                          title: `🔒 Chỉ trong Bài ${selectedLesson.lessonNumber}`,
                          desc: 'Cấm dùng từ vựng ở các bài sau chưa học',
                        },
                        {
                          key: 'cumulative' as HomeworkScopeMode,
                          title: `📚 Lũy tiến Bài 1 → Bài ${selectedLesson.lessonNumber}`,
                          desc: 'Ôn tập kết hợp các bài đã dạy từ đầu',
                        },
                        {
                          key: 'custom_only' as HomeworkScopeMode,
                          title: '🎯 100% Từ & Cấu trúc giáo viên chọn',
                          desc: 'Chỉ xoáy sâu vào đúng danh sách bên dưới',
                        },
                      ].map((sc) => {
                        const isSelected = lessonScopeMode === sc.key;
                        return (
                          <button
                            key={sc.key}
                            type="button"
                            onClick={() => {
                              setLessonScopeMode(sc.key);
                              setIsPromptManuallyEdited(false);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 ring-1 ring-[var(--color-primary)]'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50'
                            }`}
                          >
                            <div className="text-xs font-bold text-[var(--color-text-primary)]">
                              {sc.title}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                              {sc.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teacher Vocabulary Picker & Custom Input */}
                  <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[var(--color-text-primary)]">
                        2. Từ vựng đưa vào đề ({effectiveVocabList.length} từ đang áp dụng):
                      </label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVocabHanzi((selectedLesson.vocabulary || []).map((v) => v.hanzi));
                            setIsPromptManuallyEdited(false);
                          }}
                          className="text-[var(--color-primary)] font-semibold hover:underline cursor-pointer"
                        >
                          Chọn hết từ bài học
                        </button>
                        <span className="text-[var(--color-border)]">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVocabHanzi([]);
                            setIsPromptManuallyEdited(false);
                          }}
                          className="text-[var(--color-text-secondary)] hover:text-red-500 cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                      {(selectedLesson.vocabulary || []).map((v) => {
                        const checked = selectedVocabHanzi.includes(v.hanzi);
                        return (
                          <button
                            key={v.id || v.hanzi}
                            type="button"
                            onClick={() => {
                              setSelectedVocabHanzi((prev) =>
                                prev.includes(v.hanzi)
                                  ? prev.filter((item) => item !== v.hanzi)
                                  : [...prev, v.hanzi]
                              );
                              setIsPromptManuallyEdited(false);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                              checked
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-2xs'
                                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] opacity-60 hover:opacity-100'
                            }`}
                          >
                            <span>{checked ? '✓' : '+'}</span>
                            <span className="font-bold">{v.hanzi}</span>
                            <span className="text-[10px] opacity-85">({v.vietnamese})</span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={customVocabInput}
                      onChange={(e) => {
                        setCustomVocabInput(e.target.value);
                        setIsPromptManuallyEdited(false);
                      }}
                      placeholder="➕ Giáo viên tự nhập thêm từ vựng muốn kiểm tra (VD: 咖啡 (kāfēi - cà phê), 图书馆, 电脑)..."
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {/* Teacher Grammar Structure Picker & Custom Input */}
                  <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                    <label className="block text-[11px] font-bold text-[var(--color-text-primary)]">
                      3. Cấu trúc ngữ pháp & Mẫu câu muốn kiểm tra ({effectiveGrammarList.length} cấu trúc):
                    </label>
                    {(selectedLesson.grammarPoints || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedLesson.grammarPoints || []).map((g) => {
                          const checked = selectedGrammarTitles.includes(g.title);
                          return (
                            <button
                              key={g.id || g.title}
                              type="button"
                              onClick={() => {
                                setSelectedGrammarTitles((prev) =>
                                  prev.includes(g.title)
                                    ? prev.filter((item) => item !== g.title)
                                    : [...prev, g.title]
                                );
                                setIsPromptManuallyEdited(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                checked
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold'
                                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] opacity-60 hover:opacity-100'
                              }`}
                            >
                              <span>{checked ? '✓' : '+'}</span>
                              <span>{g.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <input
                      type="text"
                      value={customGrammarInput}
                      onChange={(e) => {
                        setCustomGrammarInput(e.target.value);
                        setIsPromptManuallyEdited(false);
                      }}
                      placeholder="➕ Giáo viên tự nhập thêm cấu trúc ngữ pháp / mẫu câu muốn xoáy sâu (cách nhau bằng dấu chấm phẩy ;)..."
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {questionSource === 'curriculum' && (
                    <div className="space-y-1.5 pt-2 border-t border-[var(--color-border)]">
                      <label className="block text-xs font-semibold text-[var(--color-text-primary)]">
                        4. Trọng tâm rèn luyện bài học:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'comprehensive', label: 'Toàn diện (Tổng hợp)' },
                          { key: 'listening', label: 'Luyện Nghe phản xạ' },
                          { key: 'reading', label: 'Đọc hiểu & Đoạn văn' },
                          { key: 'grammar', label: 'Ngữ pháp & Điền từ' },
                        ].map((mode) => (
                          <button
                            key={mode.key}
                            type="button"
                            onClick={() => setPracticeMode(mode.key as any)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              practiceMode === mode.key
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Source Mode 2: Raw Text / Document Paste */}
              {questionSource === 'raw_text' && (
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                        <span>Dán Văn Bản / Tài Liệu Bài Tập</span>
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        Hỗ trợ định dạng đề thi chuẩn HSK (Câu 1: ... A. ... B. ... Đáp án: ...) hoặc JSON.
                      </p>
                    </div>
                    <label className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)] flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>Tải file .txt</span>
                      <input
                        type="file"
                        accept=".txt,.json,.md"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const content = ev.target?.result as string;
                              if (content) setRawPastedText(content);
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <textarea
                    rows={6}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder="Dán câu hỏi hoặc văn bản bài khóa vào đây... Ví dụ:&#10;Câu 1: 他是我的____。&#10;A. 老师&#10;B. 苹果&#10;C. 喝水&#10;D. 飞机&#10;Đáp án: A. Giải thích: ..."
                    className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}

              {/* Source Mode 3: Lesson-Scoped System Prompt & Golden Prompt Studio */}
              {questionSource === 'golden_prompt' && (
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>System Prompt Cá Nhân Hóa Theo Bài Học & Ý Muốn Giáo Viên</span>
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        System Prompt được tự động ràng buộc chặt chẽ theo các từ vựng và cấu trúc ngữ pháp của Bài {selectedLesson.lessonNumber} mà giáo viên đã chọn ở trên (không lấy lan man toàn bộ level).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopySystemPrompt}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{copiedSystemPrompt ? 'Đã chép System Prompt!' : '📋 Sao chép System Prompt'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsGoldenPromptModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>✨ Mở Thư Viện Prompt Chuẩn Vàng</span>
                      </button>
                    </div>
                  </div>

                  {/* Prompt Format Template Switcher */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[var(--color-text-primary)]">
                      4. Chọn mẫu cấu trúc System Prompt bài tập:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: 'mixed_homework' as HomeworkPromptTemplateKey, label: '✨ Tổng hợp Bài tập về nhà (Khuyên dùng)' },
                        { key: 'fill_in_blank' as HomeworkPromptTemplateKey, label: 'Điền từ vào chỗ trống (____)' },
                        { key: 'listening_dialogue' as HomeworkPromptTemplateKey, label: 'Nghe hội thoại (男/女/问)' },
                        { key: 'reading_mcq' as HomeworkPromptTemplateKey, label: 'Trắc nghiệm Đọc hiểu bài học' },
                        { key: 'dialogue_matching' as HomeworkPromptTemplateKey, label: 'Ghép nối câu hội thoại' },
                        { key: 'json_strict' as HomeworkPromptTemplateKey, label: 'JSON Chuẩn HSK' },
                      ].map((tpl) => {
                        const active = homeworkPromptTemplate === tpl.key;
                        return (
                          <button
                            key={tpl.key}
                            type="button"
                            onClick={() => {
                              setHomeworkPromptTemplate(tpl.key);
                              setIsPromptManuallyEdited(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                              active
                                ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-amber-500/50'
                            }`}
                          >
                            {tpl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teacher pedagogical note input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[var(--color-text-primary)]">
                      5. Ghi chú / Chỉ thị sư phạm riêng của giáo viên vào System Prompt (Tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={teacherPromptNote}
                      onChange={(e) => {
                        setTeacherPromptNote(e.target.value);
                        setIsPromptManuallyEdited(false);
                      }}
                      placeholder="VD: Đặt câu xoay quanh tình huống ở trường học, cài bẫy phân biệt vị trí phó từ..."
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {/* Live Editable System Prompt Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                      <span className="font-bold text-[var(--color-text-primary)]">
                        Nội dung System Prompt (Tự động cập nhật theo Từ vựng & Cấu trúc bài học — Có thể sửa trực tiếp):
                      </span>
                      {isPromptManuallyEdited && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPromptManuallyEdited(false);
                            setAppliedGoldenPrompt(autoGeneratedLessonPrompt);
                          }}
                          className="text-[11px] text-[var(--color-primary)] font-semibold hover:underline cursor-pointer"
                        >
                          🔄 Khôi phục theo Từ vựng & Cấu trúc đã chọn
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={8}
                      value={appliedGoldenPrompt}
                      onChange={(e) => {
                        setAppliedGoldenPrompt(e.target.value);
                        setIsPromptManuallyEdited(true);
                      }}
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] font-mono leading-relaxed focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              )}

              {/* Source Mode 4: Online Exam Bank */}
              {questionSource === 'exam_bank' && (
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>Chọn Đề Thi Có Sẵn Trong Ngân Hàng Đề</span>
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      Nạp trực tiếp bộ câu hỏi từ các đề thi HSK {targetLevel} đã được tạo và kiểm duyệt.
                    </p>
                  </div>

                  {matchingExams.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
                      Không tìm thấy đề thi nào phù hợp với HSK {targetLevel}. Vui lòng chọn nguồn câu hỏi khác.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {matchingExams.map((exam) => {
                        const isSelected = selectedExamId === exam.id;
                        return (
                          <button
                            key={exam.id}
                            type="button"
                            onClick={() => setSelectedExamId(exam.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 shadow-xs'
                                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)]'
                            }`}
                          >
                            <div className="text-xs font-bold text-[var(--color-text-primary)]">
                              {exam.title}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] mt-1">
                              <span className="font-mono bg-[var(--color-background)] px-1 rounded">
                                {exam.exam_code}
                              </span>
                              <span>{exam.questions?.length || 0} câu hỏi</span>
                              <span>• {exam.duration_minutes || 15} phút</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons to go back to Step 1 or generate/parse and proceed to Step 3 */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)] flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại: Mục tiêu & Lớp</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions || isParsingRawText || isGeneratingGoldenPrompt}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang nạp câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục: Cấu hình định dạng & Giọng đọc TTS</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: EXERCISE FORMATS, DIFFICULTY & NATURAL TTS VOICES */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              {/* 1. 4 Core Exercise Formats (Requirement R3) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>1. Chọn 4 Dạng Bài Tập Cốt Lõi (Phù hợp tiến độ lớp):</span>
                  </label>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    Đã chọn {selectedFormats.length}/4 dạng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CORE_EXERCISE_TYPES.map((fmt) => {
                    const isChecked = selectedFormats.includes(fmt.key);
                    const Icon = fmt.icon;
                    return (
                      <div
                        key={fmt.key}
                        onClick={() => toggleFormat(fmt.key)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 ring-1 ring-[var(--color-primary)]/50 shadow-xs'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 bg-[var(--color-surface)] opacity-70'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-[var(--color-primary)] text-white shadow-xs'
                              : 'bg-[var(--color-background)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">
                              {fmt.title}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-background)] text-[var(--color-primary)] border border-[var(--color-border)]">
                              {fmt.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                            {fmt.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Difficulty & Question Count Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--color-border)]">
                {/* Difficulty Levels */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                    2. Mức độ khó & Tốc độ bài tập:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIFFICULTY_LEVELS.map((diff) => {
                      const isSelected = difficultyLevel === diff.key;
                      return (
                        <button
                          key={diff.key}
                          type="button"
                          onClick={() => setDifficultyLevel(diff.key)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 shadow-xs ring-1 ring-[var(--color-primary)]'
                              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 bg-[var(--color-surface)]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-primary)]">
                            <span>{diff.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${diff.badgeColor}`}>
                              {diff.speechRate}x
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                            {diff.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Count */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                    Số lượng câu hỏi:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          questionCount === num
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] bg-[var(--color-surface)]'
                        }`}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                    ⏱️ Thời gian dự kiến: ~{Math.ceil(questionCount * 1.5)} phút
                  </p>
                </div>
              </div>

              {/* 3. Natural Chinese TTS Voice Selection & In-Modal Audio Preview (Requirement R4) */}
              <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <Headphones className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>3. Giọng Đọc Khảo Thí HSK (Natural Edge TTS Voices):</span>
                    </label>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      Áp dụng cho các bài tập Nghe hiểu và hội thoại phân vai chuẩn Bắc Kinh.
                    </p>
                  </div>

                  {/* Audio Preview Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoicePreview}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                      isPlayingVoicePreview
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                    }`}
                  >
                    {isPlayingVoicePreview ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>■ Dừng nghe thử</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>▶ Nghe thử giọng đọc</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EDGE_TTS_VOICES.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVoice(v.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-surface)] ring-1 ring-[var(--color-primary)] shadow-xs'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 bg-[var(--color-surface)]/60'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSelected
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--color-background)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {v.gender === 'female' ? '👩' : '👨'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                            {v.name}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                            {v.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)] flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại: Nguồn câu hỏi</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToStep4}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span>Tiếp tục: Duyệt đề & Chỉnh sửa</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: REVIEW, INLINE EDIT & PUBLISH */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Summary Bar */}
              <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                    {questions.length}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--color-text-primary)]">
                      {assignTitle}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2 mt-0.5">
                      <span>Cấp độ: HSK {targetLevel}</span>
                      <span>•</span>
                      <span>Hạn nộp: {new Date(assignDueDate).toLocaleString('vi-VN')}</span>
                      <span>•</span>
                      <span>Giọng đọc: {EDGE_TTS_VOICES.find((v) => v.id === selectedVoice)?.name.split('-')[0]}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddNewBlankQuestion}
                  className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)] flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>+ Thêm câu hỏi mới</span>
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isEditing = editingQuestionId === q.id;
                  const isPlayingAudio = playingQuestionId === q.id;

                  if (isEditing) {
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] space-y-3 shadow-md animate-fadeIn"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--color-primary)]">
                          <span>Chỉnh sửa Câu {idx + 1} ({q.type})</span>
                          <span className="text-[10px] text-[var(--color-text-secondary)]">ID: {q.id}</span>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                            Yêu cầu câu hỏi (Prompt):
                          </label>
                          <input
                            type="text"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs bg-[var(--color-background)] text-[var(--color-text-primary)]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                            Nội dung chữ Hán / Ngữ cảnh / Đoạn văn:
                          </label>
                          <textarea
                            rows={2}
                            value={editChinese}
                            onChange={(e) => setEditChinese(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-[var(--color-border)] text-xs bg-[var(--color-background)] text-[var(--color-text-primary)] font-medium"
                          />
                        </div>

                        {q.type === 'listening' && (
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                              Kịch bản âm thanh đọc TTS:
                            </label>
                            <input
                              type="text"
                              value={editAudioText}
                              onChange={(e) => setEditAudioText(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs bg-[var(--color-background)] text-[var(--color-text-primary)]"
                            />
                          </div>
                        )}

                        {/* Options A-D with correct answer selector */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                            Các phương án lựa chọn (Click nút tròn để đặt đáp án đúng):
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {['A', 'B', 'C', 'D'].map((label, optIdx) => {
                              const optVal = editOptions[optIdx] || '';
                              const isCorrect = editAnswer === optVal && optVal !== '';
                              return (
                                <div
                                  key={label}
                                  className={`flex items-center gap-2 p-2 rounded-xl border ${
                                    isCorrect
                                      ? 'border-emerald-500 bg-emerald-500/10'
                                      : 'border-[var(--color-border)] bg-[var(--color-background)]'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setEditAnswer(optVal)}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer ${
                                      isCorrect
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                  <input
                                    type="text"
                                    value={optVal}
                                    onChange={(e) => {
                                      const updated = [...editOptions];
                                      updated[optIdx] = e.target.value;
                                      setEditOptions(updated);
                                      if (isCorrect) setEditAnswer(e.target.value);
                                    }}
                                    className="flex-1 bg-transparent text-xs text-[var(--color-text-primary)] focus:outline-none"
                                    placeholder={`Nội dung lựa chọn ${label}...`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                            Giải thích chi tiết & Dịch nghĩa:
                          </label>
                          <textarea
                            rows={2}
                            value={editExplanation}
                            onChange={(e) => setEditExplanation(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-[var(--color-border)] text-xs bg-[var(--color-background)] text-[var(--color-text-primary)]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                          <button
                            type="button"
                            onClick={cancelEditingQuestion}
                            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)] cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={saveEditingQuestion}
                            className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] cursor-pointer shadow-xs"
                          >
                            Lưu câu này
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2.5 hover:border-[var(--color-primary)]/50 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--color-text-primary)]">
                            Câu {idx + 1}:
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                            {q.type === 'listening'
                              ? 'Nghe hiểu'
                              : q.type === 'fill_blank'
                              ? 'Điền từ'
                              : q.prompt.includes('Đọc')
                              ? 'Đọc hiểu'
                              : 'Trắc nghiệm'}
                          </span>
                          {q.type === 'listening' && (
                            <button
                              type="button"
                              onClick={() => handlePlayQuestionAudio(q)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                isPlayingAudio
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'
                              }`}
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{isPlayingAudio ? 'Đang phát...' : 'Nghe thử câu'}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingQuestion(q)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] cursor-pointer"
                            title="Chỉnh sửa câu này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(q.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-[var(--color-text-primary)]">
                        <p className="font-semibold">{q.prompt}</p>
                        {q.questionChinese && (
                          <div className="mt-1 p-2 rounded-lg bg-[var(--color-background)] text-xs font-medium font-chinese whitespace-pre-line text-[var(--color-text-primary)]">
                            {q.questionChinese}
                          </div>
                        )}
                      </div>

                      {/* Options Grid */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect =
                              q.correctAnswer === opt ||
                              (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt));
                            const letter = ['A', 'B', 'C', 'D'][optIdx] || optIdx + 1;
                            return (
                              <div
                                key={optIdx}
                                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-bold'
                                    : 'bg-[var(--color-background)]/60 text-[var(--color-text-secondary)]'
                                }`}
                              >
                                <span>
                                  <strong className="mr-1">{letter}.</strong> {opt}
                                </span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation box */}
                      {q.explanation && (
                        <div className="text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-background)]/40 p-2 rounded-lg border border-[var(--color-border)]/50">
                          💡 <span className="font-semibold">Giải thích:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)] flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại: Cấu hình định dạng</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalPublish}
                  disabled={isSubmitting || questions.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-xs font-bold hover:opacity-95 flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang lưu và giao bài...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Xác nhận & Giao bài cho lớp</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GOLDEN PROMPT LIBRARY MODAL INTEGRATION (SCOPED TO SELECTED LESSON & TEACHER VOCAB/GRAMMAR) */}
      {isGoldenPromptModalOpen && (
        <GoldenPromptLibraryModal
          isOpen={isGoldenPromptModalOpen}
          onClose={() => setIsGoldenPromptModalOpen(false)}
          initialLevel={targetLevel}
          initialFormat="listening_dialogue"
          lessonContext={lessonContextForModal}
          onApplyToEditor={(promptText) => {
            setAppliedGoldenPrompt(promptText);
            setIsPromptManuallyEdited(true);
            setQuestionSource('golden_prompt');
            setIsGoldenPromptModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
