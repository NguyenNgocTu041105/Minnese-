/**
 * tests/adversarial_challenger2_m5_verification.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER 2 VERIFICATION SUITE
 * Milestone 5: Coursebook Card Label (R1), 4 Core Exercise Formats (R3),
 * Difficulty Levels & Calibrated Speech Rates (R3),
 * Natural TTS Voices, Voice Preview & Audio URL Binding (R4).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
import {
  EDGE_TTS_VOICES,
  playPutonghuaAudioStream,
  stopChineseAudio,
} from '../src/utils/chineseAudio';
import type { QuizQuestion } from '../src/types';
import type { DetailedTextbookLesson } from '../src/data/newHsk1BookData';

// =========================================================================
// MOCK AUDIO ELEMENT FOR AUDIO STREAM & PREVIEW TESTS
// =========================================================================
class MockAudioElement {
  static createdUrls: string[] = [];
  static instances: MockAudioElement[] = [];

  src: string;
  playbackRate = 1.0;
  currentTime = 0;
  paused = true;
  error: MediaError | null = null;
  onplaying: ((ev?: any) => void) | null = null;
  oncanplay: ((ev?: any) => void) | null = null;
  onended: ((ev?: any) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  private playBehavior: 'resolve' | 'pending' | 'reject_network' = 'pending';

  constructor(url: string) {
    this.src = url;
    MockAudioElement.createdUrls.push(url);
    MockAudioElement.instances.push(this);
  }

  setPlayBehavior(mode: 'resolve' | 'pending' | 'reject_network') {
    this.playBehavior = mode;
  }

  play(): Promise<void> {
    this.paused = false;
    if (this.playBehavior === 'reject_network') {
      return Promise.reject(new Error('Network failure'));
    }
    if (this.playBehavior === 'resolve') {
      return Promise.resolve();
    }
    return new Promise<void>(() => {
      // Pending until ended/errored
    });
  }

  pause(): void {
    this.paused = true;
  }
}

describe('Milestone 5 Challenger 2: Empirical Verification & Adversarial Stress Tests', () => {
  const originalAudio = (globalThis as any).Audio;

  beforeEach(() => {
    MockAudioElement.createdUrls = [];
    MockAudioElement.instances = [];
    (globalThis as any).Audio = MockAudioElement;
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopChineseAudio();
    vi.useRealTimers();
    (globalThis as any).Audio = originalAudio;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. REQUIREMENT R1: UN-ENROLLED COURSEBOOK CARD LABEL IN DASHBOARDVIEW.TSX
  // =========================================================================
  describe('Suite 1: Requirement R1 — Un-enrolled Student Coursebook Card Labels', () => {
    const dashboardPath = path.resolve(__dirname, '../src/components/Dashboard/DashboardView.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');

    it('asserts DashboardView.tsx exists and is readable', () => {
      expect(fs.existsSync(dashboardPath)).toBe(true);
      expect(dashboardContent.length).toBeGreaterThan(1000);
    });

    it('asserts un-enrolled condition strictly branches on "!hasEnrolledClass && !isAdmin"', () => {
      expect(dashboardContent).toMatch(/\{!hasEnrolledClass\s*&&\s*!isAdmin\s*\?/);
    });

    it('asserts un-enrolled coursebook card title is EXACTLY "Giáo trình New HSK"', () => {
      // Extract the block inside `{!hasEnrolledClass && !isAdmin ? (` up to `) : (`
      const unEnrolledBlockMatch = dashboardContent.match(
        /\{!hasEnrolledClass\s*&&\s*!isAdmin\s*\?\s*\(([\s\S]*?)\)\s*:\s*\(/
      );
      expect(unEnrolledBlockMatch).not.toBeNull();
      const unEnrolledBlock = unEnrolledBlockMatch![1];

      // Exact title check
      const titleMatch = unEnrolledBlock.match(
        /<h2[^>]*>\s*([\s\S]*?)\s*<\/h2>/
      );
      expect(titleMatch).not.toBeNull();
      expect(titleMatch![1].trim()).toBe('Giáo trình New HSK');
    });

    it('asserts un-enrolled coursebook card subtitle is EXACTLY "Giáo trình chuẩn New HSK • Nhiều cấp độ"', () => {
      const unEnrolledBlockMatch = dashboardContent.match(
        /\{!hasEnrolledClass\s*&&\s*!isAdmin\s*\?\s*\(([\s\S]*?)\)\s*:\s*\(/
      );
      expect(unEnrolledBlockMatch).not.toBeNull();
      const unEnrolledBlock = unEnrolledBlockMatch![1];

      // Exact subtitle check
      const subtitleMatch = unEnrolledBlock.match(
        /<p className="text-\[11px\][^>]*>\s*([\s\S]*?)\s*<\/p>/
      );
      expect(subtitleMatch).not.toBeNull();
      expect(subtitleMatch![1].trim()).toBe('Giáo trình chuẩn New HSK • Nhiều cấp độ');
    });

    it('asserts un-enrolled coursebook card contains strictly ZERO hardcoded "1"', () => {
      const unEnrolledBlockMatch = dashboardContent.match(
        /\{!hasEnrolledClass\s*&&\s*!isAdmin\s*\?\s*\(([\s\S]*?)\)\s*:\s*\(/
      );
      expect(unEnrolledBlockMatch).not.toBeNull();
      const unEnrolledBlock = unEnrolledBlockMatch![1];

      // Verify no "HSK 1", "New HSK 1", or isolated digit 1 in header title/subtitle
      expect(unEnrolledBlock).not.toMatch(/Giáo trình New HSK\s*1/i);
      expect(unEnrolledBlock).not.toMatch(/chuẩn New HSK\s*1/i);
      expect(unEnrolledBlock).not.toMatch(/HSK\s*1\s*•/i);
    });

    it('asserts un-enrolled coursebook card does NOT interpolate {userLevel}', () => {
      const unEnrolledBlockMatch = dashboardContent.match(
        /\{!hasEnrolledClass\s*&&\s*!isAdmin\s*\?\s*\(([\s\S]*?)\)\s*:\s*\(/
      );
      expect(unEnrolledBlockMatch).not.toBeNull();
      const unEnrolledBlock = unEnrolledBlockMatch![1];

      expect(unEnrolledBlock).not.toContain('{userLevel}');
    });

    it('asserts strictly zero numeric digits in un-enrolled coursebook card header', () => {
      const unEnrolledBlockMatch = dashboardContent.match(
        /\{!hasEnrolledClass\s*&&\s*!isAdmin\s*\?\s*\(([\s\S]*?)\)\s*:\s*\(/
      );
      expect(unEnrolledBlockMatch).not.toBeNull();
      const unEnrolledBlock = unEnrolledBlockMatch![1];

      const titleMatch = unEnrolledBlock.match(/<h2[^>]*>\s*([\s\S]*?)\s*<\/h2>/);
      const subtitleMatch = unEnrolledBlock.match(/<p className="text-\[11px\][^>]*>\s*([\s\S]*?)\s*<\/p>/);

      expect(titleMatch).not.toBeNull();
      expect(subtitleMatch).not.toBeNull();
      expect(titleMatch![1]).not.toMatch(/\d/);
      expect(subtitleMatch![1]).not.toMatch(/\d/);
    });

    it('asserts enrolled/admin branch retains dynamic level title and lesson progress', () => {
      // Find the else branch
      const enrolledBlockMatch = dashboardContent.match(
        /\)\s*:\s*\(\s*<>([\s\S]*?)Vào học Giáo trình HSK \{userLevel\}/
      );
      expect(enrolledBlockMatch).not.toBeNull();
      const enrolledBlock = enrolledBlockMatch![1];

      expect(enrolledBlock).toContain('Tiến độ giáo trình HSK {userLevel}');
      expect(enrolledBlock).toContain('Giáo trình chuẩn New HSK {userLevel} • {totalLessons} bài học');
    });
  });

  // =========================================================================
  // 2. REQUIREMENT R3: 4 CORE EXERCISE TYPES & CONFIGURABLE DIFFICULTY
  // =========================================================================
  describe('Suite 2: Requirement R3 — 4 Core Exercise Types & Configurable Difficulty', () => {
    it('verifies CORE_EXERCISE_TYPES contains all 4 required exercise formats', () => {
      expect(CORE_EXERCISE_TYPES).toHaveLength(4);
      const keys = CORE_EXERCISE_TYPES.map((e) => e.key);
      expect(keys).toEqual(['mcq', 'fill_blank', 'reading', 'listening']);
    });

    it('verifies Vietnamese titles, subtitles and badges for all 4 exercise formats', () => {
      const mcq = CORE_EXERCISE_TYPES.find((e) => e.key === 'mcq')!;
      expect(mcq.title).toBe('Trắc nghiệm (MCQ)');
      expect(mcq.tag).toBe('Từ vựng & Ngữ pháp');
      expect(mcq.defaultChecked).toBe(true);

      const fill = CORE_EXERCISE_TYPES.find((e) => e.key === 'fill_blank')!;
      expect(fill.title).toBe('Điền từ vào chỗ trống');
      expect(fill.tag).toBe('Vận dụng câu');
      expect(fill.defaultChecked).toBe(true);

      const read = CORE_EXERCISE_TYPES.find((e) => e.key === 'reading')!;
      expect(read.title).toBe('Đọc hiểu (Reading)');
      expect(read.tag).toBe('Hiểu văn cảnh');
      expect(read.defaultChecked).toBe(true);

      const listen = CORE_EXERCISE_TYPES.find((e) => e.key === 'listening')!;
      expect(listen.title).toBe('Bài tập Nghe (Listening)');
      expect(listen.tag).toBe('Luyện nghe phản xạ');
      expect(listen.defaultChecked).toBe(true);
    });

    it('verifies DIFFICULTY_LEVELS has 4 calibrated difficulty levels with speech rates', () => {
      expect(DIFFICULTY_LEVELS).toHaveLength(4);
      const keys = DIFFICULTY_LEVELS.map((d) => d.key);
      expect(keys).toEqual(['easy', 'medium', 'hard', 'adaptive']);

      const easy = DIFFICULTY_LEVELS.find((d) => d.key === 'easy')!;
      expect(easy.label).toContain('Cơ bản');
      expect(easy.speechRate).toBe(0.8);
      expect(easy.badgeColor).toContain('emerald');

      const medium = DIFFICULTY_LEVELS.find((d) => d.key === 'medium')!;
      expect(medium.label).toContain('Trung bình');
      expect(medium.speechRate).toBe(0.9);
      expect(medium.badgeColor).toContain('blue');

      const hard = DIFFICULTY_LEVELS.find((d) => d.key === 'hard')!;
      expect(hard.label).toContain('Nâng cao');
      expect(hard.speechRate).toBe(1.0);
      expect(hard.badgeColor).toContain('purple');

      const adaptive = DIFFICULTY_LEVELS.find((d) => d.key === 'adaptive')!;
      expect(adaptive.label).toContain('Thích ứng');
      expect(adaptive.speechRate).toBe(0.9);
      expect(adaptive.badgeColor).toContain('amber');
    });

    it('synthesizes Multiple Choice (Trắc nghiệm) questions correctly', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(lesson, 1, ['mcq'], 4, 'medium', 'zh-CN-XiaoxiaoNeural');
      expect(questions.length).toBe(4);

      questions.forEach((q) => {
        expect(q.type).toBe('meaning');
        expect(q.prompt).toContain('nghĩa tiếng Việt');
        expect(q.questionChinese).toBeTruthy();
        expect(q.options).toHaveLength(4);
        expect(q.correctAnswer).toBeDefined();
        expect(q.options).toContain(q.correctAnswer as string);
        expect(q.explanation).toBeTruthy();
        expect(q.hskLevel).toBe(1);
        expect(q.usageNotes).toContain('Trung bình');
      });
    });

    it('synthesizes Fill-in-the-blank (Điền từ vào chỗ trống) questions with canonical ____', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(lesson, 1, ['fill_blank'], 4, 'hard', 'zh-CN-XiaoxiaoNeural');
      expect(questions.length).toBe(4);

      questions.forEach((q) => {
        expect(q.type).toBe('fill_blank');
        expect(q.prompt).toContain('chỗ trống');
        expect(q.questionChinese).toContain('____');
        expect(q.options).toHaveLength(4);
        expect(q.correctAnswer).toBeDefined();
        expect(q.options).toContain(q.correctAnswer as string);
        expect(q.explanation).toContain(q.correctAnswer as string);
        expect(q.usageNotes).toContain('Nâng cao');
      });
    });

    it('synthesizes Reading comprehension (Đọc hiểu) questions with authentic lesson texts', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(lesson, 1, ['reading'], 4, 'easy', 'zh-CN-XiaoxiaoNeural');
      expect(questions.length).toBe(4);

      questions.forEach((q) => {
        expect(q.type).toBe('meaning');
        expect(q.prompt).toContain('Đọc đoạn ngữ cảnh / bài khóa');
        expect(q.questionChinese.length).toBeGreaterThan(0);
        expect(q.options).toHaveLength(4);
        expect(q.correctAnswer).toBeDefined();
        expect(q.options).toContain(q.correctAnswer as string);
        expect(q.usageNotes).toContain('Cơ bản');
      });
    });

    it('synthesizes Listening comprehension (Bài tập Nghe) questions with dialogue, audioText and audio_url', () => {
      const voice = 'zh-CN-YunxiNeural';
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(lesson, 1, ['listening'], 4, 'medium', voice);
      expect(questions.length).toBe(4);

      questions.forEach((q) => {
        expect(q.type).toBe('listening');
        expect(q.prompt).toContain('Nghe');
        expect(q.questionChinese).toContain('问：');
        expect(q.audioText).toBeTruthy();
        expect(q.audio_url).toBeDefined();
        expect(q.audio_url).toContain('/api/tts?text=');
        expect(q.audio_url).toContain(`voice=${encodeURIComponent(voice)}`);
        expect(q.options).toHaveLength(4);
        expect(q.correctAnswer).toBeDefined();
        expect(q.options).toContain(q.correctAnswer as string);
        expect(q.usageNotes).toContain(voice);
      });
    });

    it('synthesizes balanced multi-format homework covering all 4 core types', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(
        lesson,
        1,
        ['mcq', 'fill_blank', 'reading', 'listening'],
        12,
        'adaptive',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(questions.length).toBe(12);

      const types = questions.map((q) => q.type);
      expect(types.filter((t) => t === 'meaning').length).toBeGreaterThanOrEqual(3);
      expect(types.filter((t) => t === 'fill_blank').length).toBeGreaterThanOrEqual(3);
      expect(types.filter((t) => t === 'listening').length).toBeGreaterThanOrEqual(3);
    });

    it('synthesizes questions across all HSK levels (HSK 1 through HSK 6)', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const lessons = getCurriculumLessonsForLevel(lvl);
        expect(lessons.length).toBeGreaterThan(0);
        const l = lessons[0];
        const questions = synthesizeLessonQuestions(
          l,
          lvl,
          ['mcq', 'listening'],
          4,
          'medium',
          'zh-CN-XiaoxiaoNeural'
        );
        expect(questions.length).toBe(4);
        expect(questions[0].hskLevel).toBe(lvl);
      }
    });

    it('stress tests: boundary count handling (0, 1, and 40 questions)', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];

      // count = 0
      const q0 = synthesizeLessonQuestions(lesson, 1, ['mcq'], 0, 'medium', 'zh-CN-XiaoxiaoNeural');
      expect(q0).toEqual([]);

      // count = 1
      const q1 = synthesizeLessonQuestions(lesson, 1, ['fill_blank'], 1, 'medium', 'zh-CN-XiaoxiaoNeural');
      expect(q1.length).toBe(1);

      // count = 40 (exceeds vocabulary length of 10-15 words, triggers extra questions loop)
      const q40 = synthesizeLessonQuestions(
        lesson,
        1,
        ['mcq', 'fill_blank'],
        40,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(q40.length).toBe(40);
      q40.forEach((q) => {
        expect(q.options?.length).toBe(4);
        expect(q.options).toContain(q.correctAnswer as string);
      });
    });

    it('stress tests: fallback gracefully when lesson has minimal/empty fields', () => {
      const bareLesson: DetailedTextbookLesson = {
        lessonNumber: 99,
        titleHanzi: '测试课',
        titlePinyin: 'Cèshì kè',
        titleVietnamese: 'Bài học thử nghiệm',
        pageStart: 1,
        objectives: [],
        exercises: [],
        vocabulary: [],
        grammarPoints: [],
        texts: [],
      };

      // Should not crash even with empty vocabulary, grammar, and texts
      const qs = synthesizeLessonQuestions(
        bareLesson,
        1,
        ['mcq', 'fill_blank', 'reading', 'listening'],
        4,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(qs.length).toBe(4);
      expect(qs[0].type).toBe('meaning');
      expect(qs[1].type).toBe('fill_blank');
      expect(qs[2].type).toBe('meaning');
      expect(qs[3].type).toBe('listening');
    });

    it('stress tests: empty formats array falls back to default formats', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const qs = synthesizeLessonQuestions(
        lesson,
        1,
        [],
        4,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(qs.length).toBe(4);
      const types = qs.map((q) => q.type);
      expect(types).toContain('meaning');
      expect(types).toContain('fill_blank');
    });

    it('adversarial distractor test: guarantees 4 strictly unique options in every question', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(
        lesson,
        1,
        ['mcq', 'fill_blank', 'reading', 'listening'],
        20,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );

      questions.forEach((q) => {
        expect(q.options).toBeDefined();
        expect(q.options).toHaveLength(4);
        const uniqueOptions = new Set(q.options);
        expect(uniqueOptions.size).toBe(4);
      });
    });

    it('adversarial single-word vocabulary test: distractor generator fills needed slots without crashing', () => {
      const singleWordLesson: DetailedTextbookLesson = {
        lessonNumber: 1,
        titleHanzi: '单字课',
        titlePinyin: 'Dānzì kè',
        titleVietnamese: 'Bài học một từ',
        pageStart: 1,
        objectives: [],
        exercises: [],
        vocabulary: [{ id: 'w-test-1', hskLevel: 1, hanzi: '水', pinyin: 'shuǐ', vietnamese: 'nước' }],
        grammarPoints: [],
        texts: [],
      };

      const questions = synthesizeLessonQuestions(
        singleWordLesson,
        1,
        ['mcq', 'fill_blank', 'listening'],
        6,
        'medium',
        'zh-CN-XiaoxiaoNeural'
      );
      expect(questions).toHaveLength(6);
      questions.forEach((q) => {
        expect(q.options).toHaveLength(4);
        const unique = new Set(q.options);
        expect(unique.size).toBe(4);
      });
    });

    it('adversarial unknown difficulty fallback: gracefully falls back to medium difficulty defaults', () => {
      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(
        lesson,
        1,
        ['mcq'],
        2,
        'unknown_extreme_level' as any,
        'zh-CN-XiaoxiaoNeural'
      );
      expect(questions).toHaveLength(2);
      expect(questions[0].usageNotes).toContain('Trung bình');
    });
  });

  // =========================================================================
  // 3. REQUIREMENT R4: NATURAL TTS VOICES, AUDIO PREVIEW & URL BINDING
  // =========================================================================
  describe('Suite 3: Requirement R4 — Natural TTS Voices, Voice Preview & Audio URL Binding', () => {
    it('verifies EDGE_TTS_VOICES includes Xiaoxiao, Yunxi, Xiaoyi, and Yunjian', () => {
      const ids = EDGE_TTS_VOICES.map((v) => v.id);
      expect(ids).toContain('zh-CN-XiaoxiaoNeural');
      expect(ids).toContain('zh-CN-YunxiNeural');
      expect(ids).toContain('zh-CN-XiaoyiNeural');
      expect(ids).toContain('zh-CN-YunjianNeural');

      const xiaoxiao = EDGE_TTS_VOICES.find((v) => v.id === 'zh-CN-XiaoxiaoNeural')!;
      expect(xiaoxiao.gender).toBe('female');
      expect(xiaoxiao.accent).toBe('Standard (Bắc Kinh)');
      expect(xiaoxiao.isNative).toBe(true);
      expect(xiaoxiao.isAIStudio).toBe(true);

      const yunxi = EDGE_TTS_VOICES.find((v) => v.id === 'zh-CN-YunxiNeural')!;
      expect(yunxi.gender).toBe('male');
      expect(yunxi.accent).toBe('Standard (Bắc Kinh)');
      expect(yunxi.isNative).toBe(true);
    });

    it('verifies audio_url encoding contract for listening questions with complex Chinese script', () => {
      const dialogueText = '男：你好！今天你忙吗？女：我不忙，我很高兴。问：女的今天怎么样？';
      const voice = 'zh-CN-XiaoxiaoNeural';
      const expectedUrl = `/api/tts?text=${encodeURIComponent(dialogueText)}&voice=${encodeURIComponent(voice)}`;

      const lesson = getCurriculumLessonsForLevel(1)[0];
      const questions = synthesizeLessonQuestions(lesson, 1, ['listening'], 1, 'medium', voice);
      expect(questions[0].audio_url).toBe(expectedUrl);

      // Verify URL decoding roundtrip integrity
      const parsedUrl = new URL(expectedUrl, 'http://localhost:3000');
      expect(parsedUrl.pathname).toBe('/api/tts');
      expect(parsedUrl.searchParams.get('text')).toBe(dialogueText);
      expect(parsedUrl.searchParams.get('voice')).toBe(voice);
    });

    it('adversarial audio URL parameter encoding with extreme and special characters', () => {
      const complexDialogue = '男：你好！“测试” & 100%？\n女：是的，\t我们一起学习！\n问：他们做什么？';
      const voice = 'zh-CN-YunxiNeural';
      const encodedUrl = `/api/tts?text=${encodeURIComponent(complexDialogue)}&voice=${encodeURIComponent(voice)}`;

      expect(encodedUrl).not.toContain('\n');
      expect(encodedUrl).not.toContain('\t');
      expect(encodedUrl).not.toContain(' ');
      expect(encodedUrl).not.toContain('"');

      const parsed = new URL(encodedUrl, 'http://localhost:3000');
      expect(parsed.searchParams.get('text')).toBe(complexDialogue);
      expect(parsed.searchParams.get('voice')).toBe(voice);
    });

    it('verifies playPutonghuaAudioStream initializes Audio element with accurate URL and rate', async () => {
      const sampleText = '你好！欢迎来到汉语课堂，今天我们一起练习听力。祝你学习进步！';
      const voice = 'zh-CN-YunxiNeural';
      const speed = 0.9;

      const playbackPromise = playPutonghuaAudioStream(sampleText, speed, voice);
      expect(MockAudioElement.instances.length).toBe(1);

      const audioInst = MockAudioElement.instances[0];
      const expectedUrl = `/api/tts?text=${encodeURIComponent(sampleText)}&voice=${encodeURIComponent(voice)}`;
      expect(audioInst.src).toBe(expectedUrl);
      expect(audioInst.playbackRate).toBe(speed);

      // Simulate playback starting and completing
      audioInst.onplaying?.();
      audioInst.onended?.();

      await expect(playbackPromise).resolves.toBeUndefined();
    });

    it('verifies playPutonghuaAudioStream resolves immediately when passed empty or whitespace text', async () => {
      const emptyPromise = playPutonghuaAudioStream('   ');
      expect(MockAudioElement.instances.length).toBe(0);
      await expect(emptyPromise).resolves.toBeUndefined();
    });

    it('verifies stopChineseAudio stops active audio and cancels pending audio stream', async () => {
      const playbackPromise = playPutonghuaAudioStream('测试停止播放功能', 1.0, 'zh-CN-XiaoxiaoNeural');
      expect(MockAudioElement.instances.length).toBe(1);
      const audioInst = MockAudioElement.instances[0];

      // Call stopChineseAudio before audio ends
      stopChineseAudio();
      expect(audioInst.paused).toBe(true);

      // Must resolve without unhandled rejection
      await expect(playbackPromise).resolves.toBeUndefined();
    });

    it('adversarial concurrent playback: subsequent call cleanly aborts prior stream without error', async () => {
      const p1 = playPutonghuaAudioStream('第一句汉语');
      expect(MockAudioElement.instances.length).toBe(1);
      const audio1 = MockAudioElement.instances[0];

      const p2 = playPutonghuaAudioStream('第二句汉语');
      expect(MockAudioElement.instances.length).toBe(2);
      const audio2 = MockAudioElement.instances[1];

      // audio1 should be paused by stopChineseAudio() inside playPutonghuaAudioStream
      expect(audio1.paused).toBe(true);

      // p1 resolves due to stopChineseAudio without rejecting
      await expect(p1).resolves.toBeUndefined();

      // audio2 finishes normally
      audio2.onplaying?.();
      audio2.onended?.();
      await expect(p2).resolves.toBeUndefined();
    });

    it('verifies HomeworkWizardModal.tsx source code contains Step 3 voice preview button and handleToggleVoicePreview', () => {
      const modalPath = path.resolve(__dirname, '../src/components/Admin/HomeworkWizardModal.tsx');
      const modalContent = fs.readFileSync(modalPath, 'utf-8');

      // Verify handleToggleVoicePreview implementation
      expect(modalContent).toContain('handleToggleVoicePreview');
      expect(modalContent).toContain('playPutonghuaAudioStream');
      expect(modalContent).toContain('stopChineseAudio');

      // Verify preview sample text
      expect(modalContent).toContain('你好！欢迎来到汉语课堂，今天我们一起练习听力。祝你学习进步！');

      // Verify Step 3 UI elements
      expect(modalContent).toContain('Giọng Đọc Khảo Thí HSK (Natural Edge TTS Voices)');
      expect(modalContent).toContain('Nghe thử giọng đọc');
      expect(modalContent).toContain('Dừng nghe thử');
      expect(modalContent).toContain('EDGE_TTS_VOICES');

      // Verify Step 4 question audio playback handler
      expect(modalContent).toContain('handlePlayQuestionAudio');
    });

    it('verifies question audio URL updates when question text is edited in Step 4', () => {
      const modalPath = path.resolve(__dirname, '../src/components/Admin/HomeworkWizardModal.tsx');
      const modalContent = fs.readFileSync(modalPath, 'utf-8');

      // Check inline editing update logic in Step 4
      expect(modalContent).toMatch(
        /q\.type\s*===\s*'listening'[\s\S]*?`\/api\/tts\?text=\$\{encodeURIComponent\((?:editAudioText\s*\|\|\s*editChinese|[^)]+)\)\}&voice=\$\{encodeURIComponent\(selectedVoice\)\}`/
      );
    });
  });

  // =========================================================================
  // 4. INTEGRATION VERIFICATION: ADMIN DASHBOARD WIZARD LAUNCHER (R2/R3/R4)
  // =========================================================================
  describe('Suite 4: Integration Verification — AdminDashboard Wizard Launcher', () => {
    const adminPath = path.resolve(__dirname, '../src/components/Admin/AdminDashboard.tsx');
    const adminContent = fs.readFileSync(adminPath, 'utf-8');

    it('verifies AdminDashboard.tsx contains "+ Giao Bài Tập Mới" button triggering wizard', () => {
      expect(adminContent).toMatch(/setShowAddAssignModal\(true\)/);
      expect(adminContent).toContain('Giao Bài Tập Mới');
    });

    it('verifies AdminDashboard.tsx renders HomeworkWizardModal with all contract props', () => {
      expect(adminContent).toContain('<HomeworkWizardModal');
      expect(adminContent).toContain('isOpen={showAddAssignModal}');
      expect(adminContent).toContain('onClose={() => setShowAddAssignModal(false)}');
      expect(adminContent).toContain('classes={classes}');
      expect(adminContent).toContain('myClasses={myClasses}');
      expect(adminContent).toContain('onlineExams={onlineExams}');
      expect(adminContent).toContain('onSuccess={');
    });
  });
});
