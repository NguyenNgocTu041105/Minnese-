import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  Flag,
  RotateCcw,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Brain,
  Sparkles,
  Zap,
  BarChart2,
  BookmarkCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Maximize2,
  X,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  Home,
  ShieldCheck,
  Layers,
  Info,
  Settings,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import {
  HSKExamQuestion,
  HSKBlueprintSummary,
  HSK_BLUEPRINT_SUMMARIES,
  getMockExamQuestions,
  getPracticeQuestions,
  findQuestionById,
} from '../data/hskMockExamFixtures';
export type { HSKExamQuestion };
import { HSKIllustrationCanvas } from './HSKIllustrationCanvas';
import { playChineseAudio, stopChineseAudio, playAudioUrl, HSK_LEVEL_AUDIO_PACING } from '../utils/chineseAudio';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { getSentencePinyin, splitHanziAndPinyin, sanitizeHanziOnly } from '../utils/pinyinUtils';

// =========================================================================
// Storage Keys & Constant Types
// =========================================================================
export const STORAGE_KEY_ACTIVE_EXAM_SESSION = 'minnese_active_exam_session_v1';
export const STORAGE_KEY_WRONG_ANSWERS_NOTEBOOK = 'minnese_wrong_answers_notebook_v1';
export const STORAGE_KEY_PINYIN_TOGGLE = 'minnese_pinyin_toggle_v1';

export interface LightboxState {
  isOpen: boolean;
  scene?: string;
  url?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  emoji?: string;
  gallery?: Array<{
    letter: string;
    scene?: string;
    url?: string;
    title: string;
    caption?: string;
  }>;
  galleryIndex?: number;
}

/**
 * Official Mock Exam Timer Durations strictly conforming to Requirement R2:
 * HSK 1: 40 phút, HSK 2: 60 phút, HSK 3: 83 phút, HSK 4: 85 phút, HSK 5: 110 phút, HSK 6: 125 phút
 */
export const HSK_EXAM_DURATIONS_MINUTES: Record<number, number> = {
  1: 40,
  2: 60,
  3: 83,
  4: 85,
  5: 110,
  6: 125,
};

export function getExamDurationMinutes(level: number): number {
  return HSK_EXAM_DURATIONS_MINUTES[level] || 40;
}

export interface ExtendedHSKExamQuestion extends HSKExamQuestion {
  passage?: string;
  group_id?: string;
}

/**
 * Detects whether a question belongs to the listening skill.
 */
export function isListeningQuestion(q?: {
  section?: string;
  skill?: string;
  part_type?: string;
  audio_text?: string | null;
  stem?: string;
} | null): boolean {
  if (!q) return false;
  return (
    q.section === 'listening' ||
    q.skill === 'listening' ||
    (typeof q.part_type === 'string' && q.part_type.startsWith('listen_')) ||
    Boolean(q.audio_text && q.audio_text.trim()) ||
    Boolean(q.stem && /(?:^|\s|\n)(男|女)\s*[:：]/.test(q.stem))
  );
}

export interface MaskedStemResult {
  promptText: string;
  pinyinText: string;
  isScriptMasked: boolean;
}

/**
 * Strips spoken Chinese dialogue from the visible prompt during active test-taking.
 * Preserves question prompts (问：...) and judgment statements (★ ...).
 */
export function getMaskedStem(
  q?: {
    stem: string;
    pinyin_stem?: string;
    section?: string;
    skill?: string;
    part_type?: string;
    audio_text?: string | null;
  } | null,
  isReviewMode: boolean = false,
  isCheckedInPractice: boolean = false
): MaskedStemResult {
  if (!q || !q.stem) {
    return { promptText: '', pinyinText: '', isScriptMasked: false };
  }

  // If in review mode or already checked in practice, full content is permitted
  if (isReviewMode || isCheckedInPractice) {
    return {
      promptText: q.stem,
      pinyinText: q.pinyin_stem || '',
      isScriptMasked: false,
    };
  }

  // Reading or writing questions are not masked
  if (!isListeningQuestion(q)) {
    return {
      promptText: q.stem,
      pinyinText: q.pinyin_stem || '',
      isScriptMasked: false,
    };
  }

  const rawStem = (q.stem || '').trim();

  // Pattern 1: Question contains embedded Star statement (★ ...)
  if (rawStem.includes('★')) {
    const starPart = '★ ' + rawStem.split('★').slice(1).join('★').trim();
    return {
      promptText: starPart,
      pinyinText: getSentencePinyin(starPart),
      isScriptMasked: true,
    };
  }

  // Pattern 2: Question contains embedded Question prompt (问：... or 问: ...)
  if (/问\s*[:：]/.test(rawStem)) {
    const qPart = '问：' + rawStem.split(/问\s*[:：]/).slice(1).join('问：').trim();
    return {
      promptText: qPart,
      pinyinText: getSentencePinyin(qPart),
      isScriptMasked: true,
    };
  }

  // Pattern 3: Question stem contains speaker labels (男：/ 女：/ 甲：/ 乙：/ A: / B:)
  const hasDialogue =
    /(?:^|\s|\n)(男|女|甲|乙)\s*[:：]/.test(rawStem) ||
    (/(?:^|\s|\n)A\s*[:：]/.test(rawStem) && /(?:^|\s|\n)B\s*[:：]/.test(rawStem));

  if (hasDialogue || (q.audio_text && rawStem === q.audio_text.trim())) {
    return {
      promptText: '🎧 Nghe đoạn hội thoại qua âm thanh để chọn đáp án đúng.',
      pinyinText: '',
      isScriptMasked: true,
    };
  }

  // Pattern 4: Standard instruction stem (e.g. "听录音，从下列3个选项中选出...")
  return {
    promptText: rawStem,
    pinyinText: q.pinyin_stem || '',
    isScriptMasked: true,
  };
}

export { splitHanziAndPinyin, sanitizeHanziOnly };

export interface WrongAnswerItem {
  id: string;
  questionId: string;
  level: number;
  section: 'listening' | 'reading' | 'writing';
  part_type: string;
  stem: string;
  pinyin_stem?: string;
  options: string[];
  options_pinyin?: string[];
  options_images?: string[];
  userAnswer: number | string;
  correctAnswer: number;
  explanation_vi: string;
  audio_text?: string;
  audio_url?: string;
  illustration?: string;
  timestamp: number;
  mastered: boolean;
  attempts: number;
}

export interface LogWrongAnswerInput {
  questionId: string;
  level: number;
  section: 'listening' | 'reading' | 'writing';
  part_type: string;
  stem: string;
  pinyin_stem?: string;
  options: string[];
  options_pinyin?: string[];
  options_images?: string[];
  userAnswer: number | string;
  correctAnswer: number;
  explanation_vi: string;
  audio_text?: string;
  audio_url?: string;
  illustration?: string;
}

/**
 * Pure function: synchronizes a wrong answer entry into the notebook.
 * Guarantees that repeat mistakes on the same question atomically replace the presentation
 * snapshot (options, options_images, correctAnswer, explanation_vi, stem, etc.) to prevent
 * desynchronization under serving shuffle or multi-session retests, while stably preserving
 * the entry id, incrementing attempt counter, updating timestamp, and resetting mastered to false.
 */
export function syncWrongAnswerEntry(
  prev: WrongAnswerItem[],
  item: LogWrongAnswerInput,
  now: number = Date.now()
): WrongAnswerItem[] {
  const existingIdx = prev.findIndex((w) => w.questionId === item.questionId);
  if (existingIdx >= 0) {
    const updated = [...prev];
    const prevItem = updated[existingIdx];
    updated[existingIdx] = {
      ...prevItem,
      ...item, // Atomically synchronize presentation snapshot (options, correctAnswer, explanation_vi, etc.)
      id: prevItem.id, // Guarantee preservation of original entry ID for React list key stability
      userAnswer: item.userAnswer,
      timestamp: now,
      attempts: (prevItem.attempts || 1) + 1,
      mastered: false,
    };
    return updated;
  }

  const newEntry: WrongAnswerItem = {
    id: `wrong-${now}-${Math.random().toString(36).substring(2, 7)}`,
    ...item,
    timestamp: now,
    mastered: false,
    attempts: 1,
  };
  return [newEntry, ...prev];
}

export interface SavedActiveSession {
  sessionId: string;
  level: number;
  mode: 'mock' | 'practice' | 'retest_wrong';
  skill?: string;
  part_type?: string;
  timeLimitMinutes: number;
  timeLeftSeconds: number;
  currentIndex: number;
  answers: Record<string, number | string>;
  flagged: Record<string, boolean>;
  audioPlayCounts: Record<string, number>;
  questions: (HSKExamQuestion | ExtendedHSKExamQuestion)[];
  savedAt: number;
}

export interface ExamScoreResult {
  totalScore: number;
  maxScore: number;
  passScore: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  sectionScores: Record<
    string,
    { score: number; maxScore: number; correct: number; total: number; percentage: number }
  >;
  detailedReview: Array<{
    id: string;
    item_number: number;
    stem: string;
    pinyin_stem?: string;
    options: string[];
    options_images?: string[];
    userAnswer: number | string;
    correctAnswer: number;
    isCorrect: boolean;
    explanation_vi: string;
    section: 'listening' | 'reading' | 'writing';
    part_type: string;
    audio_text?: string;
    audio_url?: string;
    illustration?: string;
  }>;
}

export interface HSKMockExamProps {
  initialMode?: 'hall' | 'mock' | 'practice' | 'notebook';
  initialLevel?: number;
  initialSkill?: string;
  onExit?: () => void;
  onRewardXp?: (amount: number) => void;
  /** Instant CBT Mode: load an imported or custom exam set directly into the CBT room */
  customExamData?: {
    id: string;
    title: string;
    level: number;
    timeLimitMinutes?: number;
    questions: HSKExamQuestion[];
  };
}

/**
 * Chuẩn hóa lời giải thích: loại bỏ lặp lại đề bài/transcript đã hiển thị phía trên.
 * Strip redundant transcript/question prefixes such as:
 * - Nội dung bài nghe: "..." / Câu hỏi nghe được: "..." / Câu nói nghe được: "..."
 * - Câu văn: "..." / Lời chào: "..." / Câu hỏi: "..."
 * - Câu '...' nghĩa là '...' / Câu này có nghĩa là "..."
 * - Đoạn văn nêu rõ "..." nên / do đó...
 * Capitalize the first character of the remaining text.
 * Fallback safely to raw text if cleaned text is empty.
 */
export function formatConciseExplanation(rawExplanation: string): string {
  if (!rawExplanation || typeof rawExplanation !== 'string') return '';
  let cleaned = rawExplanation.trim();

  const redundantPrefixPatterns = [
    /^(?:Nội dung bài nghe|Câu hỏi nghe được|Câu nói nghe được|Đoạn nghe|Bài nghe|Lời thoại bài nghe|Đoạn văn|Đoạn hội thoại):\s*(?:["'“‘«][^"'”’»]+["'”’»]|[^.。;；\n]+)\s*(?:\([^)]+\))?[.。;；]?\s*/i,
    /^(?:Câu văn|Lời thoại|Lời chào(?: làm quen)?|Câu đối thoại|Câu hỏi):\s*(?:["'“‘«][^"'”’»]+["'”’»]|[^.。;；\n]+)\s*(?:\([^)]+\))?[.。;；]?\s*/i,
    /^Câu\s*(?:văn\s*)?['"“‘«][^'"”’»]+['"”’»]\s*(?:có\s*)?nghĩa\s*là(?:\s*:)?\s*(?:['"“‘«][^'"”’»]+['"”’»]|[^.。;；\n]+)[.。;；]?\s*/i,
    /^Câu này có nghĩa(?: là)?(?:\s*:)?\s*(?:['"“‘«][^'"”’»]+['"”’»]|[^.。;；\n]+)[.。;；]?\s*/i,
    /^Đoạn văn nêu rõ\s*(?:['"“‘«][^'"”’»]+['"”’»]|[^.。;；\n]+?)\s*(?:,\s*)?(?:nên|do đó|vì vậy)\s*/i,
    /^(?:Ý nghĩa câu|Dịch nghĩa|Tạm dịch|Dịch câu):\s*(?:["'“‘«][^'"”’»]+["'”’»]|[^.。;；\n]+)\s*[.。;；]?\s*/i,
  ];

  let prev = '';
  while (cleaned !== prev) {
    prev = cleaned;
    for (const pattern of redundantPrefixPatterns) {
      const candidate = cleaned.replace(pattern, '').trim();
      if (candidate.length > 0) {
        cleaned = candidate;
      }
    }
  }

  cleaned = cleaned.trim();
  if (!cleaned) {
    return rawExplanation.trim(); // Fallback an toàn nếu chuỗi bị rỗng
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Định dạng hiển thị đáp án đúng duy nhất: ví dụ 'B. 看书 (kànshū)'
 * Extracts letter (A, B, C, D) and option text, stripping redundant leading option letters from option strings if present.
 */

/**
 * Render pedagogical explanation with clear formatting:
 * - Highlight translation (Dịch nghĩa)
 * - Highlight correct answer rationale (Đáp án đúng)
 * - Highlight distractor analysis (Phân tích phương án nhiễu)
 * - Display badges for grammar, trap type, difficulty if present
 */
export function renderFormattedExplanation(rawExplanation: string): React.ReactNode {
  if (!rawExplanation || !rawExplanation.trim()) {
    return <span className="italic text-slate-400">Chưa có giải thích cho câu hỏi này.</span>;
  }

  const text = rawExplanation.trim();

  // Extract trailing metadata tags if present: [Cấu trúc bẫy: ... | Độ khó: ... | Ngữ pháp: ...]
  const metaMatch = text.match(/\[([^\]]+)\]\s*$/);
  let mainText = text;
  let metaTags: string[] = [];

  if (metaMatch) {
    mainText = text.substring(0, metaMatch.index).trim();
    metaTags = metaMatch[1]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Split into structured segments if divided by " - " or newline
  const rawSegments = mainText.includes(' - ')
    ? mainText.split(' - ')
    : mainText.includes('\n')
    ? mainText.split('\n')
    : [mainText];

  const segments = rawSegments.map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-2 text-xs sm:text-[13px]">
      {segments.map((seg, idx) => {
        const isTranslation = /^(?:Dịch nghĩa|Tạm dịch|Ý nghĩa|Dịch câu):/i.test(seg);
        const isCorrectAnswer = /^(?:Đáp án đúng|Chọn|Lý do chọn):/i.test(seg);
        const isDistractorAnalysis = /^(?:Phân tích phương án|Phân tích|Phương án nhiễu):/i.test(seg);
        const isGrammarPoint = /^(?:Ngữ pháp|Cấu trúc|Lưu ý|Trọng điểm):/i.test(seg);

        return (
          <div
            key={idx}
            className={`leading-relaxed ${
              isTranslation
                ? 'p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 font-medium'
                : isCorrectAnswer
                ? 'font-semibold text-emerald-800 dark:text-emerald-300'
                : isDistractorAnalysis
                ? 'pl-2 border-l-2 border-amber-400 text-amber-900 dark:text-amber-200'
                : isGrammarPoint
                ? 'p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {seg}
          </div>
        );
      })}

      {metaTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
          {metaTags.map((tag, tIdx) => (
            <span
              key={tIdx}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
            >
              🏷️ {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function formatCorrectAnswerText(options: string[] | undefined | null, answerIndex: number): string {
  if (!Array.isArray(options) || options.length === 0) {
    return '';
  }
  const safeIdx = typeof answerIndex === 'number' && answerIndex >= 0 ? answerIndex : 0;
  const letter = String.fromCharCode(65 + safeIdx);
  const rawOpt = options[safeIdx] !== undefined ? String(options[safeIdx]) : '';
  const cleanOpt = rawOpt.replace(/^[A-Z][.:\s]\s*/i, '').trim();
  return cleanOpt ? `${letter}. ${cleanOpt}` : (rawOpt.trim() || letter);
}


/**
 * Play authentic dual-tone CLEC exam prompt chime via Web Audio API
 */
export function playClecPromptChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.2);
      gain2.gain.setValueAtTime(0.25, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.5);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {
          // ignore
        }
        resolve();
      }, 550);
    } catch {
      resolve();
    }
  });
}

// =========================================================================
// API-First Session Fetcher & Transparent Fixture Fallback Types
// =========================================================================
export type ExamDataSource = 'api' | 'fixture';

export interface LoadExamSessionOptions {
  level: number;
  mode: 'mock' | 'practice';
  skill?: string;
  count?: number;
  strict?: boolean;
  strictQbankOnly?: boolean;
  allowFixtures?: boolean;
  isFixtureDemo?: boolean;
  signal?: AbortSignal;
  fetchFn?: typeof fetch;
}

export interface ExamSessionFetchResult {
  success: boolean;
  dataSource: ExamDataSource;
  questions: HSKExamQuestion[];
  sessionId: string;
  fallbackNotice: string | null;
  error?: string;
  requestedCount?: number;
  actualCount?: number;
  isShortage?: boolean;
  isFixtureDemo?: boolean;
  usingFixtureFallback?: boolean;
  skill?: string;
  level?: number;
}

/**
 * Unified Exam Session Fetcher:
 * 1. Checks mode & level.
 * 2. Requests `/api/exam/generate-mock`.
 * 3. Enforces strict blueprint for mock mode by default (no silent fixture fallback).
 * 4. Captures structured shortage status on HTTP 400.
 */
export async function fetchExamSessionFromBackend(
  options: LoadExamSessionOptions
): Promise<ExamSessionFetchResult> {
  const {
    level,
    mode,
    skill,
    count = 15,
    signal,
    fetchFn = typeof fetch !== 'undefined' ? fetch : (undefined as any),
  } = options;

  const isExplicitFixtureRequest = Boolean(
    options.allowFixtures || (options as any).allow_fixtures || (options as any).isFixtureDemo
  );

  const reqBody: any =
    mode === 'mock'
      ? {
          level,
          mode: 'mock',
          ...(options.strict !== undefined ? { strictBlueprint: options.strict } : {}),
          ...(options.allowFixtures !== undefined ? { allowFixtures: isExplicitFixtureRequest } : {}),
        }
      : {
          level,
          mode: 'practice',
          skill: skill && skill !== 'all' ? skill : undefined,
          count,
          strictQbankOnly: options.strictQbankOnly ?? options.strict,
        };

  let failureReason: string | null = null;
  let apiQuestions: HSKExamQuestion[] = [];
  let apiSessionId = '';
  let apiData: any = null;

  try {
    if (!fetchFn) {
      throw new Error('fetch is not defined in this environment');
    }
    const res = await fetchFn('/api/exam/generate-mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
      signal,
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (!res.ok) {
      let errorPayload: any = null;
      try {
        errorPayload = await res.json();
      } catch {}
      if (errorPayload) {
        apiData = errorPayload;
        failureReason = errorPayload.error
          ? `${errorPayload.error} (mã lỗi HTTP ${res.status})`
          : `Máy chủ trả về mã lỗi HTTP ${res.status}`;
      } else {
        failureReason = `Máy chủ trả về mã lỗi HTTP ${res.status}`;
      }
    } else {
      let data: any;
      try {
        data = await res.json();
        apiData = data;
      } catch {
        failureReason = 'Phản hồi từ máy chủ không đúng định dạng JSON';
      }

      if (data) {
        if (data.success && Array.isArray(data.session?.questions)) {
          if (data.session.questions.length > 0) {
            apiQuestions = data.session.questions;
            apiSessionId = data.session.sessionId || `api-${mode}-${level}-${Date.now()}`;
          } else if (mode === 'practice') {
            apiQuestions = [];
            apiSessionId = data.session.sessionId || `api-${mode}-${level}-${Date.now()}`;
          } else {
            failureReason = 'Kho đề thi chưa có câu hỏi phù hợp.';
          }
        } else {
          failureReason = data.error || 'Dữ liệu phiên thi từ máy chủ không hợp lệ';
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw err;
    }
    failureReason =
      'Chế độ ngoại tuyến: Không thể kết nối đến máy chủ (Lỗi mạng hoặc ngoại tuyến).';
  }

  // If successfully loaded from API
  if (!failureReason && (apiQuestions.length > 0 || (mode === 'practice' && Array.isArray(apiData?.session?.questions)))) {
    const requestedCount = apiData?.session?.requestedCount ?? apiData?.requestedCount ?? count;
    const actualCount = apiData?.session?.actualCount ?? apiData?.actualCount ?? apiQuestions.length;
    const isShortage = apiData?.session?.isShortage ?? apiData?.isShortage ?? (actualCount < requestedCount);
    const sessionSkill = apiData?.session?.skill ?? apiData?.skill ?? (skill || 'all');
    const sessionLevel = apiData?.session?.level ?? apiData?.level ?? level;
    const dataSource: ExamDataSource = apiData?.dataSource === 'fixture' ? 'fixture' : 'api';

    return {
      success: true,
      dataSource,
      questions: apiQuestions,
      sessionId: apiSessionId,
      fallbackNotice: apiData?.fallbackNotice || null,
      isFixtureDemo: Boolean(apiData?.isFixtureDemo),
      usingFixtureFallback: Boolean(apiData?.usingFixtureFallback),
      requestedCount,
      actualCount,
      isShortage,
      skill: sessionSkill,
      level: sessionLevel,
    };
  }

  if (options.strict || options.strictQbankOnly) {
    return {
      success: false,
      dataSource: 'api',
      questions: [],
      sessionId: `strict-empty-${mode}-${level}-${Date.now()}`,
      fallbackNotice: null,
      error: failureReason || undefined,
      requestedCount: count,
      actualCount: 0,
      isShortage: true,
      skill: skill || 'all',
      level,
    };
  }

  const fallbackNotice = failureReason
    ? `Chế độ dự phòng: ${failureReason}. Đang sử dụng bộ đề mẫu (HSK Fixtures).`
    : 'Chế độ dự phòng: Đang sử dụng bộ đề mẫu (HSK Fixtures).';

  const fixtureQuestions =
    mode === 'mock'
      ? getMockExamQuestions(level)
      : getPracticeQuestions(level, skill && skill !== 'all' ? skill : undefined, undefined, count);

  const fallbackSessionId = `local-${mode}-${level}-${Date.now()}`;
  const actualCount = fixtureQuestions.length;
  const isShortage = mode === 'practice' ? actualCount < count : false;

  return {
    success: false,
    dataSource: 'fixture',
    questions: fixtureQuestions,
    sessionId: fallbackSessionId,
    fallbackNotice,
    error: failureReason || undefined,
    requestedCount: count,
    actualCount,
    isShortage,
    skill: skill || 'all',
    level,
  };
}

// =========================================================================
// Main Component: HSKMockExam
// =========================================================================
export const HSKMockExam: React.FC<HSKMockExamProps> = ({
  initialMode = 'hall',
  initialLevel = 1,
  initialSkill,
  onExit,
  onRewardXp,
  customExamData,
}) => {
  // Navigation View State: 'hall' | 'exam' | 'practice' | 'result' | 'notebook'
  const [currentView, setCurrentView] = useState<'hall' | 'exam' | 'practice' | 'result' | 'notebook'>(() => {
    if (customExamData && customExamData.questions.length > 0) return 'exam';
    if (initialMode === 'mock') return 'exam';
    if (initialMode === 'practice') return 'practice';
    if (initialMode === 'notebook') return 'notebook';
    return 'hall';
  });

  // Helper to extract level from URL query parameters during deep-linking
  const getDirectDeepLinkLevel = (): number | null => {
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search).get('level');
        if (p) {
          const parsed = parseInt(p, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return null;
  };

  const directUrlLevel = getDirectDeepLinkLevel();
  const effectiveInitialLevel = customExamData?.level ?? directUrlLevel ?? initialLevel;

  const [selectedLevel, setSelectedLevel] = useState<number>(effectiveInitialLevel);

  useEffect(() => {
    if (customExamData?.level) {
      setSelectedLevel(customExamData.level);
    } else if (initialLevel && initialLevel >= 1 && initialLevel <= 6) {
      setSelectedLevel(initialLevel);
    }
  }, [initialLevel, customExamData]);

  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkill || 'all');
  const [activeSessionId, setActiveSessionId] = useState<string>(() =>
    customExamData ? `custom-cbt-${customExamData.id}` : ''
  );
  const [questions, setQuestions] = useState<HSKExamQuestion[]>(() =>
    customExamData?.questions || []
  );
  const [dataSource, setDataSource] = useState<ExamDataSource | null>(() =>
    customExamData ? 'fixture' : null
  );
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(() =>
    customExamData ? `Đang làm bài thi trên máy (Instant CBT): ${customExamData.title} (${customExamData.questions.length} câu)` : null
  );
  const [isShortage, setIsShortage] = useState<boolean>(false);
  const [requestedPracticeCount, setRequestedPracticeCount] = useState<number>(15);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(() => {
    if (customExamData && customExamData.questions.length > 0) return false;
    return initialMode === 'mock' || initialMode === 'practice';
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const currentLoadingModeRef = useRef<'mock' | 'practice' | null>(
    customExamData ? null : initialMode === 'mock' ? 'mock' : initialMode === 'practice' ? 'practice' : null
  );
  const currentLoadingKeyRef = useRef<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [audioPlayCounts, setAudioPlayCounts] = useState<Record<string, number>>({});

  // Countdown Timer
  const [examDurationSeconds, setExamDurationSeconds] = useState<number>(() => {
    if (customExamData) {
      return (customExamData.timeLimitMinutes || getExamDurationMinutes(effectiveInitialLevel)) * 60;
    }
    if (initialMode === 'mock') {
      return getExamDurationMinutes(effectiveInitialLevel) * 60;
    }
    return 0;
  });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    if (customExamData) {
      return (customExamData.timeLimitMinutes || getExamDurationMinutes(effectiveInitialLevel)) * 60;
    }
    if (initialMode === 'mock') {
      return getExamDurationMinutes(effectiveInitialLevel) * 60;
    }
    return 0;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<ExamScoreResult | null>(null);

  // Practice Mode state
  const [practiceChecked, setPracticeChecked] = useState<Record<string, { isCorrect: boolean; correctAnswer: number; correctAnswerText?: string; explanation_vi: string }>>({});
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);
  const [showAudioScript, setShowAudioScript] = useState<boolean>(false);

  // Explanation Show/Hide Toggle States (Practice, Review, Notebook)
  const [showPracticeExplanation, setShowPracticeExplanation] = useState<boolean>(true);
  const [expandedReviewExplanations, setExpandedReviewExplanations] = useState<Record<string, boolean>>({});
  const [allReviewExplanationsExpanded, setAllReviewExplanationsExpanded] = useState<boolean>(false);
  const [expandedNotebookExplanations, setExpandedNotebookExplanations] = useState<Record<string, boolean>>({});
  const [allNotebookExplanationsExpanded, setAllNotebookExplanationsExpanded] = useState<boolean>(false);

  const toggleReviewExplanation = (id: string) => {
    setExpandedReviewExplanations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllReviewExplanations = () => {
    const nextState = !allReviewExplanationsExpanded;
    setAllReviewExplanationsExpanded(nextState);
    if (scoreResult?.detailedReview) {
      const updated: Record<string, boolean> = {};
      scoreResult.detailedReview.forEach((item) => {
        updated[item.id] = nextState;
      });
      setExpandedReviewExplanations(updated);
    }
  };

  const toggleNotebookExplanation = (questionId: string) => {
    setExpandedNotebookExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const toggleAllNotebookExplanations = () => {
    const nextState = !allNotebookExplanationsExpanded;
    setAllNotebookExplanationsExpanded(nextState);
    const updated: Record<string, boolean> = {};
    wrongAnswers.forEach((item) => {
      updated[item.questionId] = nextState;
    });
    setExpandedNotebookExplanations(updated);
  };

  // Pedagogical Feature: Pinyin Toggle (Default ON for HSK 1-2, default OFF for HSK 3-6 per CTI)
  const [showPinyin, setShowPinyin] = useState<boolean>(() => {
    const levelToUse = effectiveInitialLevel || selectedLevel || 1;
    if (levelToUse >= 3) {
      return false; // Default OFF for HSK 3-6
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PINYIN_TOGGLE);
      if (saved !== null) return saved === 'true';
      return true; // Default ON for HSK 1-2
    } catch {
      return true;
    }
  });

  // Level switch default synchronization: default ON for HSK 1-2, default OFF for HSK 3-6
  useEffect(() => {
    if (selectedLevel >= 3) {
      setShowPinyin(false);
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PINYIN_TOGGLE);
        setShowPinyin(saved !== null ? saved === 'true' : true);
      } catch {
        setShowPinyin(true);
      }
    }
  }, [selectedLevel]);

  // Resume Modal Prompt State
  const [pendingSavedSession, setPendingSavedSession] = useState<SavedActiveSession | null>(null);

  // Lightbox Zoom Image Modal
  const [lightboxImage, setLightboxImage] = useState<LightboxState | null>(null);

  // Interactive Writing States (HSK 3-5)
  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>({});
  const [sentenceOrderSlots, setSentenceOrderSlots] = useState<Record<string, string[]>>({});

  // Writing evaluation and candidate self-assessment state (Features 19 & 20)
  const [selfScores, setSelfScores] = useState<Record<string, number>>({});
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, any>>({});
  const [isEvaluatingAi, setIsEvaluatingAi] = useState<Record<string, boolean>>({});

  // Unified answer check for both MCQ and open-ended essay answers (Feature 18)
  const isQuestionAnswered = useCallback(
    (qId: string) => {
      const val = userAnswers[qId];
      return (
        typeof val === 'number' ||
        (typeof val === 'string' && val.trim().length > 0) ||
        Boolean(essayDrafts[qId]?.trim())
      );
    },
    [userAnswers, essayDrafts]
  );

  // Trigger AI writing evaluation using POST /api/exam/evaluate-writing (Feature 20)
  const handleAiEvaluateWriting = useCallback(
    async (item: any) => {
      const essayText =
        userAnswers[item.id] ||
        item.userAnswer ||
        essayDrafts[item.id] ||
        '';
      if (typeof essayText !== 'string' || !essayText.trim()) return;

      setIsEvaluatingAi((prev) => ({ ...prev, [item.id]: true }));
      try {
        const res = await fetch('/api/exam/evaluate-writing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: item.id,
            essayText: essayText.trim(),
            level: selectedLevel || item.level || 5,
            part_type: item.part_type,
            sessionId: activeSessionId,
            stem: item.stem,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAiEvaluations((prev) => ({ ...prev, [item.id]: data }));
          setSelfScores((prev) => ({ ...prev, [item.id]: data.score }));
        }
      } catch (err) {
        console.warn('[HSKMockExam] AI writing evaluation error:', err);
      } finally {
        setIsEvaluatingAi((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [userAnswers, essayDrafts, selectedLevel, activeSessionId]
  );

  // Audio Playback in Progress
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Unified exit/back to hall handler respecting onExit prop
  const handleBackToHall = useCallback(() => {
    try {
      stopChineseAudio();
    } catch {}
    setIsPlayingAudio(false);
    abortControllerRef.current?.abort();
    inFlightRef.current = false;
    currentLoadingModeRef.current = null;
    currentLoadingKeyRef.current = null;
    setIsLoadingSession(false);
    if (onExit) {
      onExit();
    } else {
      setCurrentView('hall');
    }
  }, [onExit]);

  // Review Filter in Result view: 'all' | 'wrong' | 'flagged'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'flagged'>('all');


  // Wrong Answers Notebook
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WRONG_ANSWERS_NOTEBOOK);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Notebook Filter
  const [notebookLevelFilter, setNotebookLevelFilter] = useState<number | 'all'>('all');
  const [notebookSkillFilter, setNotebookSkillFilter] = useState<string>('all');

  // Blueprints metadata
  const [blueprints, setBlueprints] = useState<Record<number, HSKBlueprintSummary>>(HSK_BLUEPRINT_SUMMARIES);

  // Fetch blueprints on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/exam/blueprints')
      .then((res) => (res.ok ? res.json() : Promise.reject('Failed')))
      .then((data) => {
        if (isMounted && data.success && data.blueprints) {
          setBlueprints(data.blueprints);
        }
      })
      .catch(() => {
        // Fallback already pre-set to HSK_BLUEPRINT_SUMMARIES
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save Pinyin Preference (Accessible at ANY level HSK 1-6)
  const handleTogglePinyin = useCallback(() => {
    setShowPinyin((prev) => {
      const next = !prev;
      try {
        if (selectedLevel <= 2) {
          localStorage.setItem(STORAGE_KEY_PINYIN_TOGGLE, String(next));
        }
      } catch {
        // ignore
      }
      return next;
    });
  }, [selectedLevel]);

  // Check for unfinished saved session on mount (sessionStorage first, fallback to localStorage)
  useEffect(() => {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.sessionStorage) {
        raw = sessionStorage.getItem(STORAGE_KEY_ACTIVE_EXAM_SESSION);
      }
      if (!raw && typeof window !== 'undefined' && window.localStorage) {
        raw = localStorage.getItem(STORAGE_KEY_ACTIVE_EXAM_SESSION);
      }
      if (raw) {
        const saved: SavedActiveSession = JSON.parse(raw);
        // Only prompt if saved session is valid and less than 12 hours old
        const ageHours = (Date.now() - (saved.savedAt || 0)) / (1000 * 60 * 60);
        if (ageHours < 12 && saved.questions && saved.questions.length > 0 && saved.timeLeftSeconds > 0) {
          setPendingSavedSession(saved);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Helper to persist wrong answers notebook
  const persistWrongAnswers = useCallback((updater: (prev: WrongAnswerItem[]) => WrongAnswerItem[]) => {
    setWrongAnswers((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY_WRONG_ANSWERS_NOTEBOOK, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Auto-save active session to BOTH sessionStorage and localStorage
  useEffect(() => {
    if (currentView === 'exam' && activeSessionId && questions.length > 0 && timeLeftSeconds > 0) {
      const sessionToSave: SavedActiveSession = {
        sessionId: activeSessionId,
        level: selectedLevel,
        mode: 'mock',
        timeLimitMinutes: Math.round(examDurationSeconds / 60),
        timeLeftSeconds,
        currentIndex,
        answers: userAnswers,
        flagged: flaggedQuestions,
        audioPlayCounts,
        questions,
        savedAt: Date.now(),
      };
      const serialized = JSON.stringify(sessionToSave);
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem(STORAGE_KEY_ACTIVE_EXAM_SESSION, serialized);
        }
      } catch {
        // ignore
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY_ACTIVE_EXAM_SESSION, serialized);
        }
      } catch {
        // ignore
      }
    }
  }, [
    currentView,
    activeSessionId,
    selectedLevel,
    timeLeftSeconds,
    examDurationSeconds,
    currentIndex,
    userAnswers,
    flaggedQuestions,
    audioPlayCounts,
    questions,
  ]);

  // Clean active session on completion or manual exit
  const clearActiveSessionStorage = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(STORAGE_KEY_ACTIVE_EXAM_SESSION);
      }
    } catch {
      // ignore
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_EXAM_SESSION);
      }
    } catch {
      // ignore
    }
  }, []);

  // =========================================================================
  // Unified API-First Session Loader & Fixture Fallback Engine
  // =========================================================================
  const loadExamSession = useCallback(
    async (
      level: number,
      mode: 'mock' | 'practice',
      skill?: string,
      options?: { count?: number; force?: boolean; strict?: boolean; strictQbankOnly?: boolean; allowFixtures?: boolean; isFixtureDemo?: boolean }
    ) => {
      // 1. Debounce duplicate clicks on exact same session while in flight
      const requestKey = `${mode}_${level}_${skill || 'all'}`;
      if (inFlightRef.current && !options?.force) {
        if (currentLoadingKeyRef.current === requestKey) {
          return;
        }
        // Mode/level/skill switch detected while in-flight -> abort pending previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }

      // 2. Set lock, mode, key, and controller
      const controller = new AbortController();
      abortControllerRef.current = controller;
      inFlightRef.current = true;
      currentLoadingModeRef.current = mode;
      currentLoadingKeyRef.current = requestKey;

      // Stop any audio playback immediately upon session / skill switch
      try {
        stopChineseAudio();
      } catch {
        // ignore
      }
      setIsPlayingAudio(false);

      // 3. Reset states for clean session isolation (prevent cross-mode question leakage)
      setIsLoadingSession(true);
      setSubmitError(null);
      setSelectedLevel(level);
      if (mode === 'practice') {
        setSelectedSkill(skill || 'all');
      }
      setQuestions([]);
      setCurrentIndex(0);
      setUserAnswers({});
      setFlaggedQuestions({});
      setAudioPlayCounts({});
      setPracticeChecked({});
      setShowAudioScript(false);
      setEssayDrafts({});
      setSentenceOrderSlots({});
      setIsSubmitting(false);
      setScoreResult(null);
      setIsShortage(false);
      setRequestedPracticeCount(options?.count || 15);

      // Duration & Timer setup
      if (mode === 'mock') {
        const durationMins = getExamDurationMinutes(level);
        const timeSecs = durationMins * 60;
        setExamDurationSeconds(timeSecs);
        setTimeLeftSeconds(timeSecs);
      } else {
        setExamDurationSeconds(0);
        setTimeLeftSeconds(0);
      }

      // Default Pinyin view: Level 1-2 default ON (or saved preference), Level 3-5 strictly forced OFF
      if (level >= 3) {
        setShowPinyin(false);
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY_PINYIN_TOGGLE);
          setShowPinyin(saved !== null ? saved === 'true' : true);
        } catch {
          setShowPinyin(true);
        }
      }

      // Switch view immediately to show dedicated loading spinner
      setCurrentView(mode === 'mock' ? 'exam' : 'practice');

      try {
        const result = await fetchExamSessionFromBackend({
          level,
          mode,
          skill,
          count: options?.count || 15,
          strict: options?.strict,
          strictQbankOnly: options?.strictQbankOnly,
          allowFixtures: options?.allowFixtures,
          isFixtureDemo: options?.isFixtureDemo,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setQuestions(result.questions);
        setActiveSessionId(result.sessionId);
        setDataSource(result.dataSource);
        setFallbackNotice(result.fallbackNotice);
        setIsShortage(Boolean(result.isShortage));
        setRequestedPracticeCount(result.requestedCount || options?.count || 15);
        if (!result.success && result.error) {
          setSubmitError(result.error);
        }
      } catch (err: any) {
        if (controller.signal.aborted || err?.name === 'AbortError') {
          return;
        }
        console.warn('[HSKMockExam] Backend fetch error:', err);
        if (mode === 'mock' && !options?.allowFixtures) {
          setQuestions([]);
          setActiveSessionId(`mock-shortage-${level}-${Date.now()}`);
          setDataSource('api');
          setFallbackNotice(null);
          setIsShortage(true);
          setSubmitError(err?.message || 'Không thể kết nối máy chủ tạo đề thi chính thức.');
        } else {
          const fixtureQs =
            mode === 'mock'
              ? getMockExamQuestions(level)
              : getPracticeQuestions(level, skill && skill !== 'all' ? skill : undefined, undefined, options?.count || 15);
          setQuestions(fixtureQs);
          setActiveSessionId(`local-${mode}-${level}-${Date.now()}`);
          setDataSource('fixture');
          setFallbackNotice('Chế độ dự phòng: Đang hiển thị đề thi mẫu tĩnh (Fixtures) cho mục đích minh họa giao diện.');
          setIsShortage(mode === 'practice' ? fixtureQs.length < (options?.count || 15) : false);
          setRequestedPracticeCount(options?.count || 15);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          inFlightRef.current = false;
          currentLoadingModeRef.current = null;
          currentLoadingKeyRef.current = null;
          setIsLoadingSession(false);
        }
      }
    },
    []
  );

  // Mount/Sync Effect: API-First session loading for initialMode === 'mock' | 'practice' (deep link & 1-click)
  useEffect(() => {
    if (customExamData && customExamData.questions.length > 0) {
      setCurrentView('exam');
      setSelectedLevel(customExamData.level);
      setQuestions(customExamData.questions);
      setActiveSessionId(`custom-cbt-${customExamData.id}`);
      setDataSource('fixture');
      setFallbackNotice(`Đang làm bài thi trên máy (Instant CBT): ${customExamData.title} (${customExamData.questions.length} câu)`);
      const durSecs = (customExamData.timeLimitMinutes || getExamDurationMinutes(customExamData.level)) * 60;
      setExamDurationSeconds(durSecs);
      setTimeLeftSeconds(durSecs);
      setCurrentIndex(0);
      setUserAnswers({});
      setFlaggedQuestions({});
      setAudioPlayCounts({});
      setScoreResult(null);
      setIsLoadingSession(false);
      return;
    }

    if (initialMode === 'mock' || initialMode === 'practice') {
      loadExamSession(effectiveInitialLevel, initialMode, initialSkill);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialMode, effectiveInitialLevel, initialSkill, loadExamSession, customExamData]);

  // Mode 1: 1-Click Mock Exam Assembly
  const handleStartMockExam = useCallback(
    (level: number) => {
      return loadExamSession(level, 'mock');
    },
    [loadExamSession]
  );

  // Mode 2: Practice Mode Assembly
  const handleStartPractice = useCallback(
    (level: number, skill: string = 'all') => {
      return loadExamSession(level, 'practice', skill);
    },
    [loadExamSession]
  );

  // Resume saved session
  const handleResumeSavedSession = useCallback(() => {
    if (!pendingSavedSession) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    inFlightRef.current = false;
    currentLoadingModeRef.current = null;
    setIsLoadingSession(false);

    setActiveSessionId(pendingSavedSession.sessionId);
    setSelectedLevel(pendingSavedSession.level);
    setQuestions(pendingSavedSession.questions);
    setDataSource(pendingSavedSession.sessionId.startsWith('local-') ? 'fixture' : 'api');
    setFallbackNotice(
      pendingSavedSession.sessionId.startsWith('local-')
        ? 'Đang tiếp tục bài thi từ bộ đề mẫu dự phòng (offline fixtures).'
        : null
    );
    setUserAnswers(pendingSavedSession.answers || {});
    setFlaggedQuestions(pendingSavedSession.flagged || {});
    setAudioPlayCounts(pendingSavedSession.audioPlayCounts || {});
    setCurrentIndex(pendingSavedSession.currentIndex || 0);
    setTimeLeftSeconds(pendingSavedSession.timeLeftSeconds || 60);
    setExamDurationSeconds((pendingSavedSession.timeLimitMinutes || getExamDurationMinutes(pendingSavedSession.level)) * 60);
    setCurrentView('exam');
    setPendingSavedSession(null);
  }, [pendingSavedSession]);

  // Discard saved session
  const handleDiscardSavedSession = useCallback(() => {
    clearActiveSessionStorage();
    setPendingSavedSession(null);
    if (initialMode === 'mock' || initialMode === 'practice') {
      loadExamSession(effectiveInitialLevel, initialMode, initialSkill);
    }
  }, [clearActiveSessionStorage, initialMode, effectiveInitialLevel, initialSkill, loadExamSession]);

  // =========================================================================
  // Countdown Timer Engine
  // =========================================================================
  useEffect(() => {
    if (currentView !== 'exam' || timeLeftSeconds <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit at 0s!
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentView, timeLeftSeconds, isSubmitting]);

  // =========================================================================
  // Retest Missed Questions (From Wrong Answers Notebook)
  // =========================================================================
  const handleRetestWrongQuestions = useCallback(() => {
    if (wrongAnswers.length === 0) return;

    // Filter by notebookLevelFilter if selected
    let candidates = wrongAnswers.filter((item) => !item.mastered);
    if (notebookLevelFilter !== 'all') {
      candidates = candidates.filter((item) => item.level === notebookLevelFilter);
    }
    if (candidates.length === 0) {
      candidates = wrongAnswers; // fallback to all
    }

    const retestQs: HSKExamQuestion[] = candidates.map((item, idx) => ({
      id: item.questionId || `retest-${idx}`,
      level: item.level,
      section: item.section,
      part_type: item.part_type,
      item_number: idx + 1,
      stem: item.stem,
      pinyin_stem: item.pinyin_stem,
      options: item.options,
      options_images: item.options_images,
      answer_index: item.correctAnswer,
      explanation_vi: item.explanation_vi,
      audio_text: item.audio_text,
      illustration: item.illustration,
      audio_playback: item.level <= 3 ? 2 : 1,
    }));

    const retestLevel = retestQs[0]?.level || 1;
    setSelectedLevel(retestLevel);
    setSelectedSkill('all');
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setAudioPlayCounts({});
    setPracticeChecked({});
    setShowAudioScript(false);
    setShowPinyin(retestLevel <= 2);

    setActiveSessionId(`retest-${Date.now()}`);
    setQuestions(retestQs);
    setCurrentView('practice');
  }, [wrongAnswers, notebookLevelFilter]);

  // Current Question
  const currentQuestion = questions[currentIndex] || null;

  // Pinyin is displayed whenever the showPinyin toggle is active
  const isQuestionPinyinAllowed = Boolean(showPinyin);

  // =========================================================================
  // Desktop Keyboard Shortcuts
  // A/B/C/D or 1/2/3/4 to choose, Arrow Left/Right to navigate, F to flag, P for pinyin
  // =========================================================================
  useEffect(() => {
    if (currentView !== 'exam' && currentView !== 'practice') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if student is in input, textarea, or modal is open
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      // Lightbox Keyboard Navigation
      if (lightboxImage !== null) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setLightboxImage(null);
          return;
        }
        if (lightboxImage.gallery && lightboxImage.gallery.length > 1) {
          const gallery = lightboxImage.gallery;
          const currentGIdx = lightboxImage.galleryIndex ?? 0;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIdx = (currentGIdx - 1 + gallery.length) % gallery.length;
            const item = gallery[prevIdx];
            setLightboxImage({
              ...lightboxImage,
              scene: item.scene,
              url: item.url,
              title: item.title,
              subtitle: `Phương án ${item.letter}`,
              caption: item.caption,
              galleryIndex: prevIdx,
            });
            return;
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIdx = (currentGIdx + 1) % gallery.length;
            const item = gallery[nextIdx];
            setLightboxImage({
              ...lightboxImage,
              scene: item.scene,
              url: item.url,
              title: item.title,
              subtitle: `Phương án ${item.letter}`,
              caption: item.caption,
              galleryIndex: nextIdx,
            });
            return;
          }
        }
        return;
      }

      if (pendingSavedSession !== null) {
        return;
      }

      const key = e.key.toUpperCase();

      // Options: A/1 -> 0, B/2 -> 1, C/3 -> 2, D/4 -> 3, E/5 -> 4, F/6 -> 5
      if (currentQuestion && Array.isArray(currentQuestion.options)) {
        let optIndex = -1;
        if (key === 'A' || key === '1') optIndex = 0;
        else if (key === 'B' || key === '2') optIndex = 1;
        else if (key === 'C' || key === '3') optIndex = 2;
        else if (key === 'D' || key === '4') optIndex = 3;
        else if (key === 'E' || key === '5') optIndex = 4;
        else if (key === 'F' || key === '6') optIndex = 5;

        if (optIndex >= 0 && optIndex < currentQuestion.options.length) {
          e.preventDefault();
          handleSelectOption(currentQuestion.id, optIndex);
          return;
        }
      }

      // Navigation: ArrowLeft -> Prev, ArrowRight/Enter -> Next
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        return;
      }

      // Flag: 'F'
      if (key === 'F' && currentQuestion) {
        e.preventDefault();
        setFlaggedQuestions((prev) => ({
          ...prev,
          [currentQuestion.id]: !prev[currentQuestion.id],
        }));
        return;
      }

      // Pinyin Toggle: 'P' (Universal for all levels)
      if (key === 'P') {
        e.preventDefault();
        handleTogglePinyin();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentView,
    currentQuestion,
    questions.length,
    lightboxImage,
    pendingSavedSession,
    handleTogglePinyin,
    selectedLevel,
  ]);

  // Select option handler
  const handleSelectOption = useCallback((questionId: string, optionIndex: number | string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }, []);

  // Practice Mode: Check Answer handler
  const handleCheckPracticeAnswer = useCallback(
    async (q: HSKExamQuestion) => {
      let studentAns = userAnswers[q.id];
      if (studentAns === undefined || studentAns === null || studentAns === '') {
        if (essayDrafts[q.id]?.trim()) {
          studentAns = essayDrafts[q.id].trim();
          handleSelectOption(q.id, studentAns);
        } else {
          return;
        }
      }

      try {
        const res = await fetch('/api/exam/check-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: q.id,
            userAnswer: studentAns,
            sessionId: activeSessionId,
          }),
        });
        const data = await res.json();
        const isWritingTask = q.section === 'writing' || q.part_type?.startsWith('write_');
        if (data.success) {
          setPracticeChecked((prev) => ({
            ...prev,
            [q.id]: {
              isCorrect: data.isCorrect,
              correctAnswer: data.correctAnswer,
              correctAnswerText:
                data.correctAnswerText && data.correctAnswerText !== 'A'
                  ? data.correctAnswerText
                  : isWritingTask
                  ? q.explanation_vi || 'Xem bài viết mẫu tham khảo'
                  : formatCorrectAnswerText(q.options, data.correctAnswer),
              explanation_vi: data.explanation_vi,
            },
          }));

          // If student answered wrongly, automatically log to Wrong Answer Notebook!
          if (!data.isCorrect) {
            logWrongAnswer({
              questionId: q.id,
              level: q.level,
              section: q.section,
              part_type: q.part_type,
              stem: q.stem,
              pinyin_stem: q.pinyin_stem,
              options: q.options,
              options_images: q.options_images,
              userAnswer: studentAns,
              correctAnswer: data.correctAnswer,
              explanation_vi: data.explanation_vi,
              audio_text: q.audio_text,
              illustration: q.illustration,
            });
          } else {
            // If was previously wrong and answered right, mark as mastered
            markQuestionMastered(q.id);
          }
          return;
        }
      } catch (err) {
        console.warn('[HSKMockExam] Check answer API error, falling back locally:', err);
      }

      // Local fallback check
      const isWritingTask = q.section === 'writing' || q.part_type?.startsWith('write_');
      let isCorrect = false;
      if (isWritingTask && (!q.options || q.options.length === 0 || typeof studentAns === 'string')) {
        isCorrect = typeof studentAns === 'string' ? studentAns.trim().length > 0 : studentAns !== undefined;
      } else if (typeof studentAns === 'number') {
        isCorrect = studentAns === q.answer_index;
      } else if (typeof studentAns === 'string') {
        const parsed = parseInt(studentAns, 10);
        if (!isNaN(parsed)) {
          isCorrect = parsed === q.answer_index;
        } else {
          const letterIdx = studentAns.toUpperCase().charCodeAt(0) - 65;
          isCorrect = letterIdx === q.answer_index;
        }
      }
      setPracticeChecked((prev) => ({
        ...prev,
        [q.id]: {
          isCorrect,
          correctAnswer: q.answer_index,
          correctAnswerText: isWritingTask ? (q.explanation_vi || 'Xem bài viết mẫu tham khảo') : formatCorrectAnswerText(q.options, q.answer_index),
          explanation_vi: q.explanation_vi,
        },
      }));

      if (!isCorrect) {
        logWrongAnswer({
          questionId: q.id,
          level: q.level,
          section: q.section,
          part_type: q.part_type,
          stem: q.stem,
          pinyin_stem: q.pinyin_stem,
          options: q.options,
          options_images: q.options_images,
          userAnswer: studentAns,
          correctAnswer: q.answer_index,
          explanation_vi: q.explanation_vi,
          audio_text: q.audio_text,
          illustration: q.illustration,
        });
      } else {
        markQuestionMastered(q.id);
      }
    },
    [userAnswers, essayDrafts, activeSessionId, handleSelectOption]
  );

  // Helper: log wrong answer into Wrong Answer Notebook
  const logWrongAnswer = useCallback(
    (item: LogWrongAnswerInput) => {
      persistWrongAnswers((prev) => syncWrongAnswerEntry(prev, item));
    },
    [persistWrongAnswers]
  );

  // Helper: mark question mastered in Wrong Answer Notebook
  const markQuestionMastered = useCallback(
    (questionId: string) => {
      persistWrongAnswers((prev) => {
        return prev.map((w) => (w.questionId === questionId ? { ...w, mastered: true } : w));
      });
    },
    [persistWrongAnswers]
  );

  // Helper: remove from Wrong Answer Notebook
  const handleRemoveFromNotebook = useCallback(
    (id: string) => {
      persistWrongAnswers((prev) => prev.filter((item) => item.id !== id));
    },
    [persistWrongAnswers]
  );

  // =========================================================================
  // CLEC Audio Simulation Engine
  // =========================================================================
  const handlePlayAudio = useCallback(
    async (q: HSKExamQuestion) => {
      if (isPlayingAudio) {
        stopChineseAudio();
        setIsPlayingAudio(false);
        return;
      }

      const textToPlay = q.audio_text || q.stem;
      if (!textToPlay && !q.audio_url) return;

      const maxPlays = currentView === 'exam' ? (selectedLevel <= 3 ? 2 : 1) : 999;
      const currentPlays = audioPlayCounts[q.id] || 0;

      if (currentPlays >= maxPlays && currentView === 'exam') {
        return; // Max replays reached in exam mode
      }

      setIsPlayingAudio(true);

      const defaultPacing = HSK_LEVEL_AUDIO_PACING[selectedLevel] || { rate: 0.86, pitch: 1.0 };
      const rate = currentView === 'practice'
        ? audioSpeed
        : defaultPacing.rate;
      const pitch = defaultPacing.pitch;

      const playSinglePass = async () => {
        if (q.audio_url) {
          await playAudioUrl(q.audio_url, rate);
        } else {
          await playClecPromptChime();
          if (textToPlay) {
            await playChineseAudio(textToPlay, rate, pitch);
          }
        }
      };

      try {
        await playSinglePass();
        const newCount = currentPlays + 1;
        setAudioPlayCounts((prev) => ({ ...prev, [q.id]: newCount }));

        // In Exam mode for HSK 1-3: automatic 2nd playback after 2.5s pause if 1st play
        if (currentView === 'exam' && selectedLevel <= 3 && newCount === 1) {
          setTimeout(async () => {
            try {
              await playSinglePass();
              setAudioPlayCounts((prev) => ({ ...prev, [q.id]: 2 }));
            } catch {
              // ignore
            } finally {
              setIsPlayingAudio(false);
            }
          }, 2500);
          return;
        }
      } catch (err) {
        console.warn('[HSKMockExam] Audio play error:', err);
        if (q.audio_url && textToPlay) {
          try {
            await playClecPromptChime();
            await playChineseAudio(textToPlay, rate, pitch);
          } catch {}
        }
      } finally {
        if (!(currentView === 'exam' && selectedLevel <= 3 && currentPlays === 0)) {
          setIsPlayingAudio(false);
        }
      }
    },
    [isPlayingAudio, currentView, selectedLevel, audioPlayCounts, audioSpeed]
  );

  // =========================================================================
  // Handle Score Completion: Confetti, XP, and log wrong answers
  // =========================================================================
  const handleScoreCompletion = useCallback(
    (res: ExamScoreResult) => {
      setScoreResult(res);
      setIsSubmitting(false);
      setSubmitError(null);
      setCurrentView('result');

      // Confetti celebration if passed!
      if (res.passed) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }

      // Reward XP to student
      if (onRewardXp) {
        const earnedXp = res.passed ? 150 : 50;
        onRewardXp(earnedXp);
      }

      // Automatically batch log all wrong answers to Wrong Answer Notebook
      if (res.detailedReview && res.detailedReview.length > 0) {
        const wrongItems = res.detailedReview.filter((r) => !r.isCorrect);
        wrongItems.forEach((w) => {
          logWrongAnswer({
            questionId: w.id,
            level: selectedLevel,
            section: w.section,
            part_type: w.part_type,
            stem: w.stem,
            pinyin_stem: w.pinyin_stem,
            options: w.options,
            options_images: w.options_images,
            userAnswer: w.userAnswer,
            correctAnswer: w.correctAnswer,
            explanation_vi: w.explanation_vi,
            audio_text: w.audio_text,
            illustration: w.illustration,
          });
        });
      }
    },
    [onRewardXp, selectedLevel, logWrongAnswer]
  );

  // =========================================================================
  // Local Fallback Scoring (Offline / Fixture only with valid answer_index)
  // =========================================================================
  const handleLocalScoreFallback = useCallback(() => {
    clearActiveSessionStorage();
    setSubmitError(null);

    const bp = blueprints[selectedLevel] || HSK_BLUEPRINT_SUMMARIES[selectedLevel] || HSK_BLUEPRINT_SUMMARIES[1];
    const maxScore = bp.max_score;
    const passScore = bp.pass_score;

    const allCandidateSections: ('listening' | 'reading' | 'writing')[] =
      selectedLevel === 1 ? ['listening', 'reading'] : ['listening', 'reading', 'writing'];
    const isCustomCbt = Boolean(customExamData) || activeSessionId.startsWith('custom-cbt-');
    const presentSections = allCandidateSections.filter((sec) => questions.some((q) => q.section === sec));
    const sectionCategories = isCustomCbt && presentSections.length > 0 ? presentSections : allCandidateSections;

    const sectionScores: Record<
      string,
      { score: number; maxScore: number; correct: number; total: number; percentage: number }
    > = {};

    let totalScore = 0;

    for (const sec of sectionCategories) {
      const secQuestions = questions.filter((q) => q.section === sec);
      const secTotal = secQuestions.length;
      let secCorrect = 0;

      for (const q of secQuestions) {
        const studentAns = userAnswers[q.id];
        const isWritingTask = q.section === 'writing' || q.part_type?.startsWith('write_');
        let isCorrect = false;
        if (isWritingTask && (!q.options || q.options.length === 0 || typeof studentAns === 'string')) {
          isCorrect = typeof studentAns === 'string' ? studentAns.trim().length > 0 : studentAns !== undefined;
        } else if (typeof studentAns === 'number') {
          isCorrect = studentAns === q.answer_index;
        } else if (typeof studentAns === 'string') {
          const parsed = parseInt(studentAns, 10);
          if (!isNaN(parsed)) {
            isCorrect = parsed === q.answer_index;
          } else {
            const letterIdx = studentAns.toUpperCase().charCodeAt(0) - 65;
            isCorrect = letterIdx === q.answer_index;
          }
        }
        if (isCorrect) {
          secCorrect++;
        }
      }

      const secWeight = isCustomCbt
        ? Math.round(maxScore / Math.max(1, sectionCategories.length))
        : bp.sections[sec]?.score_weight || 100;
      const secScore = secTotal > 0 ? Math.round((secCorrect / secTotal) * secWeight) : 0;
      const secPercentage = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 0;

      sectionScores[sec] = {
        score: secScore,
        maxScore: secWeight,
        correct: secCorrect,
        total: secTotal,
        percentage: secPercentage,
      };

      totalScore += secScore;
    }

    totalScore = Math.min(totalScore, maxScore);
    const passed = totalScore >= passScore;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const timeSpentSeconds = examDurationSeconds - timeLeftSeconds;

    const detailedReview = questions.map((q) => {
      const studentAns = userAnswers[q.id] !== undefined ? userAnswers[q.id] : -1;
      const isWritingTask = q.section === 'writing' || q.part_type?.startsWith('write_');
      let isCorrect = false;
      if (isWritingTask && (!q.options || q.options.length === 0 || typeof studentAns === 'string')) {
        isCorrect = typeof studentAns === 'string' ? studentAns.trim().length > 0 : studentAns !== undefined;
      } else if (typeof studentAns === 'number') {
        isCorrect = studentAns === q.answer_index;
      } else if (typeof studentAns === 'string') {
        const parsed = parseInt(studentAns, 10);
        if (!isNaN(parsed)) {
          isCorrect = parsed === q.answer_index;
        } else {
          const letterIdx = studentAns.toUpperCase().charCodeAt(0) - 65;
          isCorrect = letterIdx === q.answer_index;
        }
      }
      return {
        id: q.id,
        item_number: q.item_number,
        stem: q.stem,
        pinyin_stem: q.pinyin_stem,
        options: q.options,
        options_images: q.options_images,
        userAnswer: studentAns,
        correctAnswer: q.answer_index,
        isCorrect,
        explanation_vi: q.explanation_vi,
        section: q.section,
        part_type: q.part_type,
        audio_text: q.audio_text,
        audio_url: q.audio_url,
        illustration: q.illustration,
      };
    });

    const localResult: ExamScoreResult = {
      totalScore,
      maxScore,
      passScore,
      percentage,
      passed,
      timeSpentSeconds,
      sectionScores,
      detailedReview,
    };

    handleScoreCompletion(localResult);
  }, [
    blueprints,
    selectedLevel,
    questions,
    userAnswers,
    examDurationSeconds,
    timeLeftSeconds,
    clearActiveSessionStorage,
    handleScoreCompletion,
    customExamData,
    activeSessionId,
  ]);

  // =========================================================================
  // Submit Exam & Score Calculation (Anti-cheat submission resilience)
  // =========================================================================
  const handleSubmitExam = useCallback(
    async (isRetryOrTimeout: boolean = false) => {
      if (isSubmitting) return;

      if (!isRetryOrTimeout) {
        const answeredCount = questions.filter((q) => isQuestionAnswered(q.id)).length;
        const unansweredCount = questions.length - answeredCount;
        if (unansweredCount > 0) {
          const confirmSubmit = window.confirm(
            `Bạn còn ${unansweredCount} câu hỏi chưa làm! Bạn có chắc chắn muốn nộp bài thi ngay không?`
          );
          if (!confirmSubmit) return;
        }
      }

      if (Boolean(customExamData) || activeSessionId.startsWith('custom-cbt-')) {
        handleLocalScoreFallback();
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      const timeSpentSeconds = examDurationSeconds - timeLeftSeconds;

      try {
        const res = await fetch('/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSessionId,
            level: selectedLevel,
            answers: userAnswers,
            timeSpentSeconds,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.scoreResult) {
            clearActiveSessionStorage();
            handleScoreCompletion(data.scoreResult);
            return;
          }
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      } catch (err) {
        console.warn('[HSKMockExam] Server submit failed:', err);
        setIsSubmitting(false);

        // Anti-cheat submission resilience:
        // Client questions from API have answer_index stripped.
        // Never score locally against undefined answer_index!
        // Preserve userAnswers in state/storage and prompt student to retry submission.
        setSubmitError(
          'Không thể kết nối đến máy chủ để chấm điểm. Bài làm của bạn đã được bảo toàn an toàn. Vui lòng nhấn "Thử lại nộp bài".'
        );
      }
    },
    [
      isSubmitting,
      userAnswers,
      questions.length,
      examDurationSeconds,
      timeLeftSeconds,
      activeSessionId,
      selectedLevel,
      clearActiveSessionStorage,
      handleScoreCompletion,
      customExamData,
      handleLocalScoreFallback,
      isQuestionAnswered,
    ]
  );


  // Auto-submit at 0s
  const handleAutoSubmit = useCallback(() => {
    handleSubmitExam(true);
  }, [handleSubmitExam]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer 3-color status
  const timerColorClass = useMemo(() => {
    if (timeLeftSeconds <= 60) {
      return 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse font-extrabold';
    }
    if (timeLeftSeconds <= 300) {
      return 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold';
    }
    return 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold';
  }, [timeLeftSeconds]);

  // Section Vietnamese display name
  const getSectionName = (sec: string) => {
    if (sec === 'listening') return '听力 (Nghe hiểu)';
    if (sec === 'reading') return '阅读 (Đọc hiểu)';
    if (sec === 'writing') return '书写 (Viết / Điền từ)';
    if (sec === 'all') return 'Tất cả kỹ năng';
    return sec;
  };

  // =========================================================================
  // RENDER VIEW: 1. RESUME ACTIVE SESSION PROMPT BANNER
  // =========================================================================
  const renderResumeModal = () => {
    if (!pendingSavedSession) return null;

    const answeredCount = Object.keys(pendingSavedSession.answers || {}).length;
    const total = pendingSavedSession.questions?.length || 40;
    const minutesLeft = Math.ceil(pendingSavedSession.timeLeftSeconds / 60);

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-amber-500">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text-primary)]">
                Tiếp tục bài thi dở dang?
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Phát hiện bài làm chưa hoàn tất</p>
            </div>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Bạn có một bài thi <strong>HSK {pendingSavedSession.level}</strong> đang làm dở (còn{' '}
            <strong className="text-amber-600 dark:text-amber-400">{minutesLeft} phút</strong>, đã làm{' '}
            <strong>
              {answeredCount}/{total}
            </strong>{' '}
            câu). Bạn có muốn khôi phục và tiếp tục làm bài không?
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleResumeSavedSession}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tiếp tục làm bài</span>
            </button>
            <button
              type="button"
              onClick={handleDiscardSavedSession}
              className="py-2.5 px-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-red-500 font-medium text-sm cursor-pointer"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER VIEW: LIGHTBOX IMAGE MODAL
  // =========================================================================
  const renderLightboxModal = () => {
    if (!lightboxImage) return null;

    const hasGallery = Boolean(lightboxImage.gallery && lightboxImage.gallery.length > 1);
    const gallery = lightboxImage.gallery || [];
    const currentGIdx = lightboxImage.galleryIndex ?? 0;

    const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasGallery) return;
      const prevIdx = (currentGIdx - 1 + gallery.length) % gallery.length;
      const item = gallery[prevIdx];
      setLightboxImage({
        ...lightboxImage,
        scene: item.scene,
        url: item.url,
        title: item.title,
        subtitle: `Phương án ${item.letter}`,
        caption: item.caption,
        galleryIndex: prevIdx,
      });
    };

    const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasGallery) return;
      const nextIdx = (currentGIdx + 1) % gallery.length;
      const item = gallery[nextIdx];
      setLightboxImage({
        ...lightboxImage,
        scene: item.scene,
        url: item.url,
        title: item.title,
        subtitle: `Phương án ${item.letter}`,
        caption: item.caption,
        galleryIndex: nextIdx,
      });
    };

    return (
      <div
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-zoom-out animate-in fade-in select-none"
        onClick={() => setLightboxImage(null)}
      >
        <div
          className="relative max-w-3xl w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-7 shadow-2xl cursor-default flex flex-col items-center space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header with title and Close Button */}
          <div className="w-full flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
                Phóng to hình minh họa
              </span>
              {hasGallery && (
                <span className="text-xs font-mono font-semibold text-[var(--color-text-secondary)]">
                  {currentGIdx + 1} / {gallery.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Graphic Canvas with Prev/Next Gallery Navigators */}
          <div className="relative w-full flex items-center justify-center py-1">
            {hasGallery && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-xs shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Bức tranh trước (Mũi tên trái)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
              <HSKIllustrationCanvas
                scene={lightboxImage.scene || lightboxImage.title}
                imageUrl={lightboxImage.url}
                aspectRatio="4/3"
                heightClass="h-64 sm:h-80 md:h-96"
                showZoomButton={false}
                isOptionCard={false}
              />
            </div>

            {hasGallery && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-xs shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Bức tranh tiếp theo (Mũi tên phải)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Captions and Explanatory Info */}
          <div className="text-center space-y-1 w-full max-w-lg">
            <h4 className="font-bold text-base sm:text-lg text-[var(--color-text-primary)] leading-snug">
              {lightboxImage.title || 'Hình minh họa câu hỏi'}
            </h4>
            {lightboxImage.subtitle && (
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                {lightboxImage.subtitle}
              </p>
            )}
            {lightboxImage.caption && (
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {lightboxImage.caption}
              </p>
            )}
            <p className="text-[11px] text-[var(--color-text-tertiary)] pt-1">
              Bấm vùng ngoài hoặc nhấn Esc để đóng{hasGallery ? ' • Dùng phím ← / → để chuyển tranh' : ''}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER VIEW: HALL / SELECTION VIEW
  // =========================================================================
  const renderHallView = () => {
    return (
      <div className="space-y-6">
        {/* Main Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-emerald-700 to-cyan-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-500/20">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide border border-white/20">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Chuẩn Khảo Thí HSK 3.0 (CTI / CLEC 2026)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Phòng Thi Thử & Luyện Đề HSK 3.0 Chuẩn Khảo Thí
            </h2>
            <p className="text-sm text-teal-100 leading-relaxed">
              Trải nghiệm bài thi chuẩn với 2 chế độ học tập chuyên sâu: Thi thử 1-Click tự động lắp ráp đúng cấu
              trúc đề thi thực tế, bấm giờ áp lực phòng thi, chấm điểm Đỗ/Trượt; hoặc Luyện tập từng kỹ năng với
              giải thích chi tiết tức thì.
            </p>

            <div className="flex flex-wrap gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCurrentView('notebook')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>Sổ tay câu sai (错题本) ({wrongAnswers.length})</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePinyin}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                {showPinyin ? <Eye className="w-4 h-4 text-emerald-300" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                <span>Pinyin: {showPinyin ? 'Đang bật' : 'Đang tắt'} (Phím P)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click Mock Exam Selection Deck */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span>Chế độ 1: Thi Thử HSK Chuẩn 1-Click (Full Mock Exam)</span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Chọn cấp độ để vào ngay phòng thi mô phỏng đề thi thật — Tự động tính số câu, thời gian, không cần nhập thủ công.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const bp = blueprints[lvl] || HSK_BLUEPRINT_SUMMARIES[lvl];
              const isRecommended = lvl === 1;

              return (
                <div
                  key={lvl}
                  className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                    isRecommended
                      ? 'border-teal-500/50 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-1 ring-teal-500/30'
                      : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-teal-400 dark:hover:border-teal-700'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      Phổ biến
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-[var(--color-text-primary)]">
                        HSK {lvl}
                      </span>
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                        {getExamDurationMinutes(lvl)} phút
                      </span>
                    </div>

                    <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{bp.total_questions} câu hỏi chuẩn</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Điểm đạt: {bp.pass_score}/{bp.max_score} (60%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Audio: {bp.audio_playback} lượt nghe</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartMockExam(lvl)}
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Vào thi ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Practice Mode Selection Deck */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <span>Chế độ 2: Luyện Tập Kỹ Năng / Phần Thi (Practice Mode)</span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Học không áp lực thời gian: Chọn kỹ năng chuyên sâu, kiểm tra đáp án ngay từng câu và xem phân tích ngữ pháp tiếng Việt.
            </p>
          </div>

          {/* Level Switcher Pill Bar for Practice Mode */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] whitespace-nowrap">
              Chọn cấp độ luyện:
            </span>
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                type="button"
                data-testid={`practice-level-tab-${lvl}`}
                onClick={() => {
                  setSelectedLevel(lvl);
                  if (lvl >= 3) {
                    setShowPinyin(false);
                  } else {
                    try {
                      const saved = localStorage.getItem(STORAGE_KEY_PINYIN_TOGGLE);
                      setShowPinyin(saved !== null ? saved === 'true' : true);
                    } catch {
                      setShowPinyin(true);
                    }
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-indigo-400'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="rounded-2xl p-4 border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Luyện Nghe Hiểu (听力)</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">Đối thoại, tranh ảnh & phát âm</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Tùy chỉnh tốc độ nghe (0.8x - 1.2x), hỗ trợ xem lời thoại transcript kèm Pinyin và dịch nghĩa.
              </p>
              <button
                type="button"
                onClick={() => handleStartPractice(selectedLevel, 'listening')}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Luyện Nghe HSK {selectedLevel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-2xl p-4 border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Luyện Đọc Hiểu (阅读)</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">Từ vựng, phán đoán đúng/sai & đoạn văn</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Rèn luyện khả năng đọc quét, nhận diện Hán tự không phụ thuộc Pinyin với lời giải thích ngữ pháp.
              </p>
              <button
                type="button"
                onClick={() => handleStartPractice(selectedLevel, 'reading')}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Luyện Đọc HSK {selectedLevel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-2xl p-4 border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Viết & Điền Từ (书写)</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">Sắp xếp câu, điền chữ Hán & ngữ pháp</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Nắm chắc các cấu trúc câu trọng điểm, lượng từ và từ loại thường gặp trong đề thi HSK.
              </p>
              <button
                type="button"
                onClick={() => handleStartPractice(selectedLevel, 'writing')}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Luyện Viết HSK {selectedLevel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[var(--color-text-secondary)]">
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <span>Format chuẩn CTI CLEC 100%</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Chime khảo thí & giới hạn lượt nghe</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Tự động lưu & khôi phục bài dở</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-purple-600 shrink-0" />
            <span>Phân tích radar & sổ câu sai</span>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER VIEW: 2 & 3. EXAM ROOM & PRACTICE ROOM
  // =========================================================================
  const renderExamRoom = () => {
    if (isLoadingSession) {
      return (
        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px] space-y-4 shadow-sm"
          data-testid="exam-session-loading"
        >
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-semibold text-[var(--color-text-primary)]">
            Đang kết nối ngân hàng đề thi QBank...
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Hệ thống đang kiểm tra ngân hàng đề thi được phê duyệt và tải câu hỏi chuẩn HSK {selectedLevel}.
          </p>
        </div>
      );
    }

    if (!currentQuestion) {
      if (currentView === 'practice') {
        return (
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm"
            data-testid="practice-empty-state"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                Không tìm thấy câu hỏi phù hợp
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Hiện tại chưa có câu hỏi nào cho kỹ năng{' '}
                <strong className="text-[var(--color-text-primary)]" data-testid="practice-selected-skill">
                  {getSectionName(selectedSkill)}
                </strong>{' '}
                - <strong className="text-[var(--color-text-primary)]" data-testid="practice-selected-level">HSK {selectedLevel}</strong>. Hệ thống tuân thủ nguyên tắc lọc nghiêm ngặt và tuyệt đối không hiển thị câu hỏi từ kỹ năng khác.
              </p>
            </div>

            {/* Quick Level & Skill Switcher in Empty State */}
            <div className="pt-2 pb-2 space-y-3 max-w-lg mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Chọn cấp HSK:</span>
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    data-testid={`empty-state-level-${lvl}`}
                    onClick={() => loadExamSession(lvl, 'practice', selectedSkill)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedLevel === lvl
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-indigo-400'
                    }`}
                  >
                    HSK {lvl}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Chọn kỹ năng:</span>
                {[
                  { key: 'all', label: 'Tất cả kỹ năng' },
                  { key: 'listening', label: 'Nghe hiểu' },
                  { key: 'reading', label: 'Đọc hiểu' },
                  { key: 'writing', label: 'Viết & Điền từ' },
                ].map((sk) => (
                  <button
                    key={sk.key}
                    type="button"
                    data-testid={`empty-state-skill-${sk.key}`}
                    onClick={() => loadExamSession(selectedLevel, 'practice', sk.key)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      selectedSkill === sk.key
                        ? 'bg-teal-600 text-white'
                        : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-teal-400'
                    }`}
                  >
                    {sk.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                data-testid="empty-state-switch-skill-btn"
                onClick={() => loadExamSession(selectedLevel, 'practice', 'all')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Luyện tất cả kỹ năng HSK {selectedLevel}
              </button>
              <button
                type="button"
                data-testid="empty-state-back-to-hall-btn"
                onClick={handleBackToHall}
                className="px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Quay lại sảnh
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-sm max-w-2xl mx-auto" data-testid="exam-shortage-state">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              {submitError ? `Chưa thể tạo đề thi thử chuẩn HSK ${selectedLevel}` : `Không có câu hỏi cho bài thi HSK ${selectedLevel}`}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
              {submitError ||
                `Kho câu hỏi HSK ${selectedLevel} hiện chưa đủ điều kiện tạo đề thi chính thức theo chuẩn blueprint khảo thí 3.0. Bạn có thể chuyển sang chế độ Luyện kỹ năng để luyện tập các câu hỏi đã có.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              data-testid="exam-empty-switch-practice-btn"
              onClick={() => {
                setCurrentView('practice');
                setSelectedSkill('all');
                loadExamSession(selectedLevel, 'practice', 'all');
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-all"
            >
              Chuyển sang Luyện kỹ năng HSK {selectedLevel}
            </button>
            <button
              type="button"
              data-testid="empty-state-back-to-hall-btn"
              onClick={handleBackToHall}
              className="px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Quay lại sảnh
            </button>
          </div>
        </div>
      );
    }

    const isExamMode = currentView === 'exam';
    const totalQ = questions.length;
    const answeredCount = questions.filter((q) => isQuestionAnswered(q.id)).length;
    const isCurrentFlagged = Boolean(flaggedQuestions[currentQuestion.id]);
    const maxAudioPlays = isExamMode ? (selectedLevel <= 3 ? 2 : 1) : 999;
    const playedAudioCount = audioPlayCounts[currentQuestion.id] || 0;
    const canPlayAudio = playedAudioCount < maxAudioPlays || !isExamMode;

    const checkedInfo = practiceChecked[currentQuestion.id] || null;

    return (
      <div className="space-y-4">
        {/* Exam Header Deck */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isExamMode) {
                  const confirmExit = window.confirm(
                    'Bài thi đang diễn ra! Tiến trình của bạn đã được lưu tự động. Bạn có chắc chắn muốn tạm dừng quay lại sảnh không?'
                  );
                  if (!confirmExit) return;
                }
                handleBackToHall();
              }}
              className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] cursor-pointer"
              title="Quay lại sảnh"
            >
              <Home className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-extrabold text-sm sm:text-base text-[var(--color-text-primary)]"
                  data-testid="practice-selected-level"
                >
                  {isExamMode ? `Thi thử HSK ${selectedLevel}` : `Luyện tập HSK ${selectedLevel}`}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-[11px] font-semibold"
                  data-testid="practice-selected-skill"
                >
                  {getSectionName(selectedSkill && selectedSkill !== 'all' ? selectedSkill : currentQuestion.section)}
                </span>
                {dataSource === 'fixture' && (
                  <span
                    className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 shadow-xs"
                    title={fallbackNotice || 'Chế độ dự phòng: Đang sử dụng bộ đề mẫu (HSK Fixtures)'}
                    data-testid="fixture-fallback-badge"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>[Chế độ dự phòng: Đang sử dụng bộ đề mẫu (HSK Fixtures)]</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Câu {currentIndex + 1} / {totalQ} • Đã làm: {answeredCount}/{totalQ}
                {!isExamMode && (
                  <span className="ml-2 font-medium text-teal-600 dark:text-teal-400" data-testid="practice-question-count">
                    (Tìm thấy {totalQ} câu hỏi phù hợp)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Pinyin Toggle Button (Universal HSK 1-6 with data-testid="btn-toggle-pinyin") */}
            <button
              type="button"
              data-testid="btn-toggle-pinyin"
              aria-label="Bật/Tắt Pinyin phiên âm"
              aria-pressed={showPinyin}
              onClick={handleTogglePinyin}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                showPinyin
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-400 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-400/30'
                  : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-slate-400 dark:hover:border-slate-600'
              }`}
              title={
                showPinyin
                  ? 'Pinyin: Đang BẬT — Bấm để ẩn (Phím tắt: P)'
                  : selectedLevel >= 3
                  ? 'Pinyin: Đang TẮT (Mặc định HSK 3-6) — Bấm để hiện (Phím tắt: P)'
                  : 'Pinyin: Đang TẮT — Bấm để hiện (Phím tắt: P)'
              }
            >
              {showPinyin ? (
                <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="font-medium whitespace-nowrap">
                Pinyin {showPinyin ? '(Bật)' : '(Tắt)'}
              </span>
            </button>

            {/* Countdown Timer (Exam mode only) */}
            {isExamMode && (
              <div
                className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono shadow-xs ${timerColorClass}`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            {/* Submit Button in Exam mode */}
            {isExamMode ? (
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                disabled={isSubmitting}
                className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang nộp...' : 'Nộp bài'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBackToHall}
                className="py-1.5 px-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-all"
              >
                Kết thúc luyện
              </button>
            )}
          </div>
        </div>

        {/* Practice Mode: Skill & Level Switcher Bar */}
        {!isExamMode && (
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 shadow-sm space-y-2.5"
            data-testid="practice-filter-bar"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Cấp HSK:</span>
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    data-testid={`practice-room-level-tab-${lvl}`}
                    onClick={() => {
                      if (lvl !== selectedLevel) {
                        loadExamSession(lvl, 'practice', selectedSkill);
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedLevel === lvl
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-indigo-400'
                    }`}
                  >
                    HSK {lvl}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Kỹ năng:</span>
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'listening', label: 'Nghe hiểu' },
                  { key: 'reading', label: 'Đọc hiểu' },
                  { key: 'writing', label: 'Viết' },
                ].map((sk) => (
                  <button
                    key={sk.key}
                    type="button"
                    data-testid={`practice-room-skill-tab-${sk.key}`}
                    onClick={() => {
                      if (sk.key !== selectedSkill) {
                        loadExamSession(selectedLevel, 'practice', sk.key);
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedSkill === sk.key
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-teal-400'
                    }`}
                  >
                    {sk.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Practice Shortage Banner */}
        {!isExamMode && isShortage && totalQ > 0 && (
          <div
            className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs flex items-center justify-between gap-3 shadow-xs"
            data-testid="practice-shortage-banner"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Hiện có <strong>{totalQ}</strong> câu hỏi phù hợp cho kỹ năng <strong>{getSectionName(selectedSkill)}</strong> HSK {selectedLevel} (yêu cầu {requestedPracticeCount} câu). Toàn bộ {totalQ} câu hiển thị đều khớp chính xác kỹ năng bạn đã chọn.
              </span>
            </div>
          </div>
        )}

        {/* Transparent Fallback Banner */}
        {dataSource === 'fixture' && (
          <div
            className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xs"
            data-testid="fixture-fallback-banner"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium">
                {fallbackNotice || 'Chế độ dự phòng: Đang sử dụng bộ đề mẫu (HSK Fixtures).'}
              </span>
            </div>
          </div>
        )}

        {/* Anti-Cheat Submission Resilience Error Alert */}
        {submitError && (
          <div
            className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-3 shadow-xs"
            data-testid="submit-error-alert"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-medium">{submitError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmitExam(true)}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs whitespace-nowrap"
                data-testid="retry-submit-button"
              >
                {isSubmitting ? 'Đang nộp lại...' : 'Thử lại nộp bài'}
              </button>
              {dataSource === 'fixture' && questions.length > 0 && typeof questions[0]?.answer_index === 'number' && (
                <button
                  type="button"
                  onClick={handleLocalScoreFallback}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-medium text-xs cursor-pointer whitespace-nowrap"
                >
                  Chấm điểm ngoại tuyến
                </button>
              )}
            </div>
          </div>
        )}

        {!currentQuestion ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              {submitError || 'Kho câu hỏi chưa đủ điều kiện tạo đề thi chính thức'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
              {submitError ? submitError : 'Ngân hàng đề thi chưa đủ số lượng câu hỏi theo chuẩn blueprint.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => loadExamSession(selectedLevel, 'practice', selectedSkill)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                Chuyển sang Luyện tập
              </button>
              <button
                type="button"
                onClick={() => loadExamSession(selectedLevel, 'mock', undefined, { allowFixtures: true, isFixtureDemo: true })}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-bold cursor-pointer"
              >
                Thử chế độ mẫu đề (Demo)
              </button>
            </div>
          </div>
        ) : (
          /* Main Content Layout: Question Canvas & Question Palette Sidebar */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Question Canvas (3 cols on desktop) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              {/* Question Subheader: Number, Flag, Audio */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center">
                    {currentIndex + 1}
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {currentQuestion.part_type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Flag for review button */}
                  <button
                    type="button"
                    onClick={() =>
                      setFlaggedQuestions((prev) => ({
                        ...prev,
                        [currentQuestion.id]: !prev[currentQuestion.id],
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                      isCurrentFlagged
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-400 font-bold'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] border border-transparent'
                    }`}
                    title="Đánh dấu câu hỏi để xem lại sau (Phím F)"
                  >
                    <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{isCurrentFlagged ? 'Đã gắn cờ' : 'Gắn cờ (F)'}</span>
                  </button>

                  {/* Audio Player Button (if question has audio) */}
                  {(currentQuestion.section === 'listening' || currentQuestion.audio_text) && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid="btn-play-listening-audio"
                          onClick={() => handlePlayAudio(currentQuestion)}
                          disabled={!canPlayAudio || isPlayingAudio}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                            !canPlayAudio
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : isPlayingAudio
                              ? 'bg-blue-600 text-white animate-pulse'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100'
                          }`}
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : canPlayAudio ? (
                            <Volume2 className="w-3.5 h-3.5" />
                          ) : (
                            <VolumeX className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPlayingAudio
                              ? 'Đang phát...'
                              : canPlayAudio
                              ? isExamMode
                                ? `Nghe (${playedAudioCount}/${maxAudioPlays})`
                                : 'Bấm để nghe AI'
                              : `Hết lượt (${maxAudioPlays}/${maxAudioPlays})`}
                          </span>
                        </button>

                        {/* Practice Mode: Audio Speed Selector & Voice Settings */}
                        {!isExamMode && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center rounded-lg border border-[var(--color-border)] p-0.5 text-[11px] font-mono">
                              {[0.75, 0.85, 1.0, 1.15, 1.25].map((spd) => (
                                <button
                                  key={spd}
                                  type="button"
                                  onClick={() => setAudioSpeed(spd)}
                                  className={`px-1.5 py-0.5 rounded-sm cursor-pointer ${
                                    audioSpeed === spd
                                      ? 'bg-[var(--color-primary)] text-white font-bold'
                                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                  }`}
                                >
                                  {spd}x
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsVoiceSettingsOpen(true)}
                              className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-colors cursor-pointer"
                              title="Cài đặt giọng đọc AI (Voice Settings)"
                              aria-label="Cài đặt giọng đọc AI"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Real-time Audio Playing Status Banner */}
                      {isPlayingAudio && (
                        <div
                          data-testid="listening-audio-status-banner"
                          className="p-2.5 rounded-xl bg-blue-600 text-white flex items-center justify-between gap-3 text-xs shadow-md animate-in fade-in slide-in-from-top-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-100"></span>
                            </span>
                            <span className="font-bold">
                              🎧 Đang phát bài nghe AI (HSK {selectedLevel} • Giọng chuẩn CLEC Xiaoxiao/Yunxi)...
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-2 bg-white rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>



              {/* Authentic Vector Illustration (Stimulus only; omitted if picture matching to avoid spoiling options) */}
              {Boolean(
                currentQuestion.illustration &&
                !currentQuestion.part_type.includes('picture_match') &&
                (!currentQuestion.options_images || currentQuestion.options_images.length === 0)
              ) && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-[var(--color-surface)]">
                  <HSKIllustrationCanvas
                    scene={currentQuestion.illustration}
                    aspectRatio="4/3"
                    heightClass="h-48 sm:h-64"
                    badgeLabel="Hình minh họa câu hỏi"
                    caption={currentQuestion.illustration}
                    showZoomButton={true}
                    onZoom={() =>
                      setLightboxImage({
                        isOpen: true,
                        title: currentQuestion.illustration || 'Hình minh họa câu hỏi',
                        scene: currentQuestion.illustration,
                        caption: currentQuestion.stem,
                      })
                    }
                  />
                </div>
              )}

              {/* Dedicated Reading Passage Panel for Shared-Passage Question Groups (HSK 5-6) */}
              {(() => {
                const extQ = currentQuestion as ExtendedHSKExamQuestion;
                const hasPassage = currentQuestion.section !== 'listening' && (
                  Boolean(extQ.passage) || currentQuestion.stem.includes('\n★') || currentQuestion.stem.includes('\n问：')
                );
                const passageContent = extQ.passage || (
                  currentQuestion.stem.includes('\n★')
                    ? currentQuestion.stem.split('\n★')[0]
                    : currentQuestion.stem.includes('\n问：')
                    ? currentQuestion.stem.split('\n问：')[0]
                    : ''
                );
                if (!hasPassage || !passageContent.trim()) return null;

                return (
                  <div
                    data-testid="reading-passage-panel"
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/20 dark:to-slate-900/40 border border-amber-200/80 dark:border-amber-900/50 shadow-xs space-y-2.5 mb-2"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-900/40">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                        <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Đoạn văn đọc hiểu (Reading Passage)</span>
                      </div>
                      {extQ.group_id && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                          Nhóm câu hỏi: {extQ.group_id}
                        </span>
                      )}
                    </div>
                    <div className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 font-serif whitespace-pre-line select-text">
                      {passageContent}
                    </div>
                  </div>
                );
              })()}

              {/* Question Stem with Pinyin */}
              {(() => {
                const isFinished = currentView === 'result' || scoreResult !== null;
                const isCheckedInPractice = Boolean(practiceChecked[currentQuestion.id]);
                const masked = getMaskedStem(currentQuestion, isFinished, isCheckedInPractice);
                const rawDisplayStem = masked.promptText;

                const isTianzige = currentQuestion.part_type === 'write_tianzige_from_pinyin';
                const { hanzi: cleanStem, pinyin: inlinePinyin } = splitHanziAndPinyin(rawDisplayStem);
                const displayPinyin = masked.pinyinText || currentQuestion.pinyin_stem || inlinePinyin || getSentencePinyin(cleanStem);
                const displayStem = isQuestionPinyinAllowed ? cleanStem : sanitizeHanziOnly(rawDisplayStem, isTianzige);

                return (
                  <div className="space-y-1.5 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-black text-xs uppercase">
                        {currentQuestion.section === 'listening' ? 'Phần Nghe' : currentQuestion.section === 'writing' ? 'Phần Viết' : 'Phần Đọc'}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {currentQuestion.section === 'listening' ? 'Yêu cầu đề bài:' : 'Nội dung câu hỏi:'}
                      </span>
                    </div>

                    {isQuestionPinyinAllowed && (
                      <div
                        data-testid="stem-pinyin"
                        className="font-mono text-xs sm:text-sm text-teal-600 dark:text-teal-400 tracking-wide select-none"
                      >
                        {displayPinyin}
                      </div>
                    )}
                    <div
                      data-testid="stem-hanzi"
                      className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] leading-relaxed"
                    >
                      {displayStem}
                    </div>

                    {/* Helpful listening banner distinguishing instructions from spoken audio */}
                    {(currentQuestion.section === 'listening' || Boolean(currentQuestion.audio_text)) && (
                      <div className="mt-2.5 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                            <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Nội dung bài nghe:</span>
                          </div>
                          {!isExamMode && currentQuestion.audio_text && checkedInfo && (
                            <button
                              type="button"
                              onClick={() => setShowAudioScript((prev) => !prev)}
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                            >
                              {showAudioScript ? 'Ẩn lời thoại' : 'Xem lời thoại'}
                            </button>
                          )}
                        </div>

                        {(!isExamMode && (showAudioScript || checkedInfo)) && currentQuestion.audio_text ? (
                          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-blue-200 dark:border-blue-800 space-y-0.5 animate-in fade-in">
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 font-serif">
                              {currentQuestion.audio_text}
                            </div>
                            {isQuestionPinyinAllowed && (
                              <div className="font-mono text-xs text-teal-600 dark:text-teal-400">
                                {getSentencePinyin(currentQuestion.audio_text)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 italic">
                            Trong đề thi thật, nội dung bài nghe chỉ phát qua âm thanh (bấm nút <strong>"Bấm để nghe AI"</strong> ở trên).
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ============================================================= */}
              {/* 5-QUESTION SHARED 6-WORD BANK A-F (HSK 1-4 Word Bank Fill)  */}
              {/* ============================================================= */}
              {Boolean(
                currentQuestion.part_type &&
                (currentQuestion.part_type.includes('word_bank') || currentQuestion.part_type.startsWith('read_fill_blank_word_bank'))
              ) && (() => {
                const options = currentQuestion.options || [];
                const selectedOptIdx = userAnswers[currentQuestion.id];

                return (
                  <div className="space-y-4 pt-1">
                    {/* Cohesive Word Bank Banner */}
                    <div
                      data-testid="word-bank-banner"
                      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-teal-50/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-teal-950/20 border border-blue-200/80 dark:border-blue-900/50 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200/50 dark:border-blue-900/40">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Ngân hàng từ vựng chung (Word Bank A – {String.fromCharCode(65 + Math.max(0, options.length - 1))})</span>
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Bấm chọn từ để điền vào chỗ trống
                        </span>
                      </div>

                      {/* Cohesive Word Bank Buttons A-F */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {options.map((optText, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isSelected = selectedOptIdx === optIdx;

                          let cardColor =
                            'border-blue-200/80 dark:border-blue-800/60 bg-white/90 dark:bg-slate-800/90 hover:border-blue-400 dark:hover:border-blue-500 text-[var(--color-text-primary)] shadow-xs';

                          if (checkedInfo) {
                            if (optIdx === checkedInfo.correctAnswer) {
                              cardColor =
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/30';
                            } else if (isSelected && !checkedInfo.isCorrect) {
                              cardColor =
                                'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 font-bold ring-2 ring-red-500/30';
                            }
                          } else if (isSelected) {
                            cardColor =
                              'border-teal-500 bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-100 font-bold ring-2 ring-teal-500/40 shadow-sm';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              data-testid={`exam-option-${letter.toLowerCase()}`}
                              data-option-index={optIdx}
                              aria-label={`Từ ${letter}: ${optText}`}
                              onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                              className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${cardColor}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                                }`}
                              >
                                {letter}
                              </span>
                              {(() => {
                                const cleanWord = optText.replace(/^[A-Z]\.\s*/, '');
                                const { hanzi: wordHanzi, pinyin: wordInlinePinyin } = splitHanziAndPinyin(cleanWord);
                                const displayWordPinyin = currentQuestion.options_pinyin?.[optIdx] || wordInlinePinyin || getSentencePinyin(wordHanzi);
                                const displayWord = isQuestionPinyinAllowed ? wordHanzi : sanitizeHanziOnly(cleanWord);

                                return (
                                  <>
                                    {isQuestionPinyinAllowed && (
                                      <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400 select-none">
                                        {displayWordPinyin}
                                      </span>
                                    )}
                                    <span className="text-sm sm:text-base font-bold font-serif leading-tight">
                                      {displayWord}
                                    </span>
                                  </>
                                );
                              })()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Slot Indicator */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-[var(--color-text-secondary)]">
                        Từ đã chọn cho câu {currentIndex + 1}:
                      </span>
                      {typeof selectedOptIdx === 'number' && options[selectedOptIdx] ? (
                        <span className="font-bold text-teal-600 dark:text-teal-400 font-serif text-sm">
                          {String.fromCharCode(65 + selectedOptIdx)}. {options[selectedOptIdx].replace(/^[A-Z]\.\s*/, '')}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Chưa chọn từ</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ============================================================= */}
              {/* SPECIALIZED WRITING UX 1: 田字格 (write_tianzige_from_pinyin) */}
              {/* ============================================================= */}
              {currentQuestion.part_type === 'write_tianzige_from_pinyin' && (() => {
                const selectedAns = userAnswers[currentQuestion.id];
                const selectedOptText = typeof selectedAns === 'number' ? (currentQuestion.options || [])[selectedAns] : null;
                // Extract Chinese character from option string like "A. 苹 (píng)" or "苹果"
                const charMatch = selectedOptText ? selectedOptText.match(/[\u4e00-\u9fa5]/) : null;
                const directChar = typeof selectedAns === 'string' ? selectedAns.trim() : null;
                const activeChar = charMatch ? charMatch[0] : directChar ? directChar[0] : null;

                return (
                  <div className="space-y-5 pt-2">
                    {/* Authentic Red Tianzige Box */}
                    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-rose-50/60 to-amber-50/30 dark:from-rose-950/20 dark:to-slate-900/40 border border-rose-200 dark:border-rose-900/50">
                      <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>Ô Điền Chữ Khảo Thí (田字格)</span>
                      </div>

                      {/* 140x140 Tianzige Grid Container */}
                      <div className="relative w-36 h-36 border-2 border-red-600 dark:border-red-500 bg-[#fefefe] dark:bg-[#181111] rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                        {/* Horizontal Dashed Midline */}
                        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-red-300 dark:border-red-900/80 pointer-events-none" />
                        {/* Vertical Dashed Midline */}
                        <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-red-300 dark:border-red-900/80 pointer-events-none" />
                        {/* Diagonal Watermarks */}
                        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]" />

                        {/* Character Display */}
                        {activeChar ? (
                          <span className="relative z-10 text-7xl font-serif font-bold text-slate-800 dark:text-rose-100 select-none animate-in zoom-in-75 duration-200">
                            {activeChar}
                          </span>
                        ) : (
                          <span className="relative z-10 text-5xl font-serif text-rose-200 dark:text-rose-900/40 select-none">
                            田
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--color-text-secondary)] mt-3 font-medium text-center">
                        {activeChar ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ Đã điền chữ: [{activeChar}]
                          </span>
                        ) : (!currentQuestion.options || currentQuestion.options.length === 0) ? (
                          'Nhập chữ Hán vào ô bên dưới'
                        ) : (
                          'Bấm chọn phương án dưới đây để điền chữ vào ô'
                        )}
                      </p>
                    </div>

                    {/* Direct Text Input if 0 options; Candidate Options Buttons if options present */}
                    {(!currentQuestion.options || currentQuestion.options.length === 0) ? (
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <input
                          type="text"
                          maxLength={4}
                          value={typeof userAnswers[currentQuestion.id] === 'string' ? (userAnswers[currentQuestion.id] as string) : ''}
                          onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                          placeholder="Gõ chữ Hán vào đây..."
                          className="w-56 text-center text-2xl font-bold font-serif p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-rose-500 shadow-xs"
                          data-testid="tianzige-direct-input"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Gõ trực tiếp chữ Hán tương ứng với phiên âm vào ô
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(currentQuestion.options || []).map((optText, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isSelected = userAnswers[currentQuestion.id] === optIdx;
                          let optionColor =
                            'border-[var(--color-border)] bg-[var(--color-background)] hover:border-teal-400 dark:hover:border-teal-600 text-[var(--color-text-primary)]';

                          if (checkedInfo) {
                            if (optIdx === checkedInfo.correctAnswer) {
                              optionColor =
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold';
                            } else if (isSelected && !checkedInfo.isCorrect) {
                              optionColor =
                                'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 font-bold';
                            }
                          } else if (isSelected) {
                            optionColor =
                              'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              data-testid={`exam-option-${letter.toLowerCase()}`}
                              data-option-index={optIdx}
                              aria-label={`Phương án ${letter}: ${optText}`}
                              onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                              className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${optionColor}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="text-lg font-bold font-serif">{optText}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ============================================================= */}
              {/* SPECIALIZED WRITING UX 2: WORD ORDER CHIP BUILDER */}
              {/* ============================================================= */}
              {currentQuestion.part_type === 'write_sentence_arrangement' && (() => {
                // Parse word chunks from stem (e.g. "连词成句：对 身体 抽烟 非常 危害 的 严重")
                const rawChunks = currentQuestion.stem
                  .replace(/^[^\s：:]+[：:]\s*/, '')
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean);
                const currentSlots = sentenceOrderSlots[currentQuestion.id] || [];

                const handleAddChip = (word: string) => {
                  const updated = [...currentSlots, word];
                  setSentenceOrderSlots((prev) => ({ ...prev, [currentQuestion.id]: updated }));
                  const assembled = updated.join('');
                  if (currentQuestion.options && currentQuestion.options.length > 0) {
                    const matchedIdx = currentQuestion.options.findIndex((opt) =>
                      opt.replace(/^[A-Z]\.\s*/, '').replace(/[。！？]/g, '').trim() === assembled.replace(/[。！？]/g, '').trim()
                    );
                    if (matchedIdx >= 0) {
                      handleSelectOption(currentQuestion.id, matchedIdx);
                    }
                  } else {
                    handleSelectOption(currentQuestion.id, assembled);
                  }
                };

                const handleRemoveChip = (indexToRemove: number) => {
                  const updated = currentSlots.filter((_, i) => i !== indexToRemove);
                  setSentenceOrderSlots((prev) => ({ ...prev, [currentQuestion.id]: updated }));
                  if (!currentQuestion.options || currentQuestion.options.length === 0) {
                    handleSelectOption(currentQuestion.id, updated.join(''));
                  }
                };

                const handleResetChips = () => {
                  setSentenceOrderSlots((prev) => ({ ...prev, [currentQuestion.id]: [] }));
                  if (!currentQuestion.options || currentQuestion.options.length === 0) {
                    handleSelectOption(currentQuestion.id, '');
                  }
                };

                return (
                  <div className="space-y-4 pt-2">
                    {/* Constructed sentence drop-zone */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-teal-300 dark:border-teal-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-teal-700 dark:text-teal-400 font-semibold">
                        <span>Câu hoàn chỉnh đã ghép:</span>
                        {currentSlots.length > 0 && (
                          <button
                            type="button"
                            onClick={handleResetChips}
                            className="text-xs text-rose-500 hover:underline cursor-pointer"
                          >
                            Đặt lại (Xóa hết)
                          </button>
                        )}
                      </div>

                      <div className="min-h-12 flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {currentSlots.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            Bấm các từ bên dưới để ghép thành câu hoàn chỉnh theo đúng ngữ pháp...
                          </span>
                        ) : (
                          currentSlots.map((chip, chipIdx) => (
                            <button
                              key={chipIdx}
                              type="button"
                              onClick={() => handleRemoveChip(chipIdx)}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-medium text-sm flex items-center gap-1.5 hover:bg-teal-700 cursor-pointer transition-all shadow-xs"
                              title="Bấm để gỡ từ này"
                            >
                              <span>{chip}</span>
                              <span className="text-teal-200 text-xs">×</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Word Chip Bank */}
                    {rawChunks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)] block">
                          Ngân hàng từ vựng (Bấm để thêm vào câu):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rawChunks.map((word, wIdx) => {
                            const countInSlots = currentSlots.filter((w) => w === word).length;
                            const countInChunks = rawChunks.filter((w) => w === word).length;
                            const isUsedUp = countInSlots >= countInChunks;

                            return (
                              <button
                                key={wIdx}
                                type="button"
                                disabled={isUsedUp}
                                onClick={() => handleAddChip(word)}
                                className={`px-3.5 py-2 rounded-xl border font-medium text-sm transition-all cursor-pointer ${
                                  isUsedUp
                                    ? 'opacity-35 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-[var(--color-surface)] border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/40 text-[var(--color-text-primary)] shadow-xs'
                                }`}
                              >
                                {word}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Candidate Complete Sentences (A, B, C, D) - only if options exist */}
                    {Boolean(currentQuestion.options && currentQuestion.options.length > 0) && (
                      <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)] block">
                          Hoặc bấm chọn phương án câu hoàn chỉnh (A, B, C, D):
                        </span>
                        <div className="grid grid-cols-1 gap-2.5">
                          {(currentQuestion.options || []).map((optText, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isSelected = userAnswers[currentQuestion.id] === optIdx;
                            let optionColor =
                              'border-[var(--color-border)] bg-[var(--color-background)] hover:border-teal-400 text-[var(--color-text-primary)]';

                            if (checkedInfo) {
                              if (optIdx === checkedInfo.correctAnswer) {
                                optionColor =
                                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold';
                              } else if (isSelected && !checkedInfo.isCorrect) {
                                optionColor =
                                  'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 font-bold';
                              }
                            } else if (isSelected) {
                              optionColor =
                                'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                data-testid={`exam-option-${letter.toLowerCase()}`}
                                data-option-index={optIdx}
                                aria-label={`Phương án ${letter}: ${optText}`}
                                onClick={() => {
                                  handleSelectOption(currentQuestion.id, optIdx);
                                  const cleaned = optText.replace(/^[A-Z]\.\s*/, '').replace(/[。！？]/g, '');
                                  const matchedChunks = rawChunks.slice().sort((a, b) => cleaned.indexOf(a) - cleaned.indexOf(b));
                                  setSentenceOrderSlots((prev) => ({ ...prev, [currentQuestion.id]: matchedChunks }));
                                }}
                                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${optionColor}`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                    isSelected
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <span className="text-sm sm:text-base font-medium flex-1">{optText}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ============================================================= */}
              {/* SPECIALIZED WRITING UX 3: TỰ LUẬN / VIẾT ĐOẠN VĂN (HSK 4, 5, 6) */}
              {/* ============================================================= */}
              {currentQuestion.part_type.startsWith('write_') &&
                currentQuestion.part_type !== 'write_tianzige_from_pinyin' &&
                currentQuestion.part_type !== 'write_sentence_arrangement' &&
                (() => {
                  const draft = essayDrafts[currentQuestion.id] || (typeof userAnswers[currentQuestion.id] === 'string' ? (userAnswers[currentQuestion.id] as string) : '');
                  // Extract target keyword list e.g. [失败, 经验, 坚持, 成功]
                  const kwMatch = currentQuestion.stem.match(/\[(.*?)\]|【(.*?)】/);
                  const rawKeywords = kwMatch ? (kwMatch[1] || kwMatch[2] || '').split(/[,，\s]+/).filter(Boolean) : [];

                  const targetLength = currentQuestion.part_type.includes('400')
                    ? 400
                    : currentQuestion.part_type.includes('300')
                    ? 300
                    : currentQuestion.part_type.includes('200')
                    ? 200
                    : currentQuestion.part_type.includes('100')
                    ? 100
                    : currentQuestion.part_type.includes('80')
                    ? 80
                    : 15;

                  const charCount = draft.replace(/\s+/g, '').length;
                  const isSufficient = charCount >= targetLength;

                  return (
                    <div className="space-y-4 pt-2">
                      {/* Keyword Checklist */}
                      {rawKeywords.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <span>Từ khóa bắt buộc sử dụng trong bài viết:</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {rawKeywords.map((kw, kwIdx) => {
                              const isIncluded = draft.includes(kw);
                              return (
                                <span
                                  key={kwIdx}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                    isIncluded
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                                  }`}
                                >
                                  {isIncluded ? '✓' : '○'} {kw}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Draft Textarea & Milestone Counter */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--color-text-secondary)]">
                            Soạn thảo bài viết tự luận (方格作文草稿):
                          </span>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span>
                              Số chữ: <strong className={isSufficient ? 'text-emerald-600' : 'text-amber-600'}>{charCount}</strong> / {targetLength} chữ
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                isSufficient
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : charCount >= targetLength * 0.6
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {isSufficient ? 'Đạt chuẩn CTI' : 'Cần thêm từ'}
                            </span>
                          </div>
                        </div>

                        <textarea
                          rows={6}
                          value={draft}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEssayDrafts((prev) => ({ ...prev, [currentQuestion.id]: val }));
                            handleSelectOption(currentQuestion.id, val);
                          }}
                          placeholder={`Nhập bài viết tự luận tiếng Hán chuẩn CTI của bạn tại đây (tối thiểu ${targetLength} chữ)...`}
                          className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm leading-relaxed focus:outline-hidden focus:border-teal-500 font-serif shadow-xs"
                          data-testid="essay-draft-textarea"
                        />
                      </div>

                      {/* Candidate / Model Essays (A, B, C, D) - ONLY if options exist */}
                      {Boolean(currentQuestion.options && currentQuestion.options.length > 0) && (
                        <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)] block">
                            Bài viết mẫu tham khảo (tùy chọn đối chiếu):
                          </span>
                          <div className="grid grid-cols-1 gap-2.5">
                            {(currentQuestion.options || []).map((optText, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isSelected = userAnswers[currentQuestion.id] === optIdx;
                              let optionColor =
                                'border-[var(--color-border)] bg-[var(--color-background)] hover:border-teal-400 text-[var(--color-text-primary)]';

                              if (checkedInfo) {
                                if (optIdx === checkedInfo.correctAnswer) {
                                  optionColor =
                                    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold';
                                } else if (isSelected && !checkedInfo.isCorrect) {
                                  optionColor =
                                    'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 font-bold';
                                }
                              } else if (isSelected) {
                                optionColor =
                                  'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  data-testid={`exam-option-${letter.toLowerCase()}`}
                                  data-option-index={optIdx}
                                  aria-label={`Phương án ${letter}: ${optText}`}
                                  onClick={() => {
                                    handleSelectOption(currentQuestion.id, optIdx);
                                    if (!draft) {
                                      setEssayDrafts((prev) => ({
                                        ...prev,
                                        [currentQuestion.id]: optText.replace(/^[A-Z]\.\s*/, ''),
                                      }));
                                    }
                                  }}
                                  className={`p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${optionColor}`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                      isSelected
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {letter}
                                  </span>
                                  <span className="text-xs sm:text-sm leading-relaxed flex-1">{optText}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* ============================================================= */}
              {/* MULTI-IMAGE OPTIONS GRID (看图选择 - options_images present)  */}
              {/* ============================================================= */}
              {Boolean(
                currentQuestion.options_images &&
                currentQuestion.options_images.length > 0 &&
                !currentQuestion.part_type.startsWith('write_') &&
                !currentQuestion.part_type.includes('word_bank')
              ) && (() => {
                const galleryItems = currentQuestion.options_images!.map((imgDesc, i) => {
                  const l = String.fromCharCode(65 + i);
                  const optText = (currentQuestion.options || [])[i] || '';
                  return {
                    letter: l,
                    scene: imgDesc,
                    title: `${l}. ${optText}`,
                    caption: imgDesc,
                  };
                });

                const colsClass =
                  currentQuestion.options_images!.length <= 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3';

                return (
                  <div className={`grid ${colsClass} gap-3 pt-2`}>
                    {(currentQuestion.options || []).map((optText, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = userAnswers[currentQuestion.id] === optIdx;
                      const imageDesc = currentQuestion.options_images![optIdx];

                      let cardStyle =
                        'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-teal-400 dark:hover:border-teal-600';

                      if (checkedInfo) {
                        if (optIdx === checkedInfo.correctAnswer) {
                          cardStyle =
                            'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold';
                        } else if (isSelected && !checkedInfo.isCorrect) {
                          cardStyle =
                            'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 font-bold';
                        }
                      } else if (isSelected) {
                        cardStyle =
                          'border-teal-500 ring-2 ring-teal-500/30 bg-teal-50/40 dark:bg-teal-950/30 shadow-md';
                      }

                      return (
                        <div
                          key={optIdx}
                          data-testid={`exam-option-${letter.toLowerCase()}`}
                          data-option-index={optIdx}
                          onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                          className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${cardStyle}`}
                        >
                          {/* Top bar with Letter Badge and Zoom Preview Button */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center shadow-xs transition-colors ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {letter}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage({
                                  isOpen: true,
                                  scene: imageDesc,
                                  title: `${letter}. ${optText}`,
                                  subtitle: `Phương án ${letter}`,
                                  caption: imageDesc,
                                  gallery: galleryItems,
                                  galleryIndex: optIdx,
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                              title="Phóng to hình ảnh này (có chế độ chuyển tranh)"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Authentic Vector Illustration Option Card */}
                          <div className="rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60">
                            <HSKIllustrationCanvas
                              scene={imageDesc}
                              aspectRatio="4/3"
                              heightClass="h-28 sm:h-32"
                              isOptionCard={true}
                              showZoomButton={false}
                            />
                          </div>

                          {/* Text Label & Pinyin */}
                          {!isExamMode && (
                            <div className="space-y-0.5 text-center">
                              {isQuestionPinyinAllowed && (
                                <div className="font-mono text-[11px] text-teal-600 dark:text-teal-400">
                                  {getSentencePinyin(optText)}
                                </div>
                              )}
                              <div className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                                {optText}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ============================================================= */}
              {/* STANDARD TEXT OPTIONS GRID (General Multiple Choice Fallback) */}
              {/* ============================================================= */}
              {(!currentQuestion.options_images || currentQuestion.options_images.length === 0) &&
                !currentQuestion.part_type.startsWith('write_') &&
                !Boolean(
                  currentQuestion.part_type &&
                  (currentQuestion.part_type.includes('word_bank') || currentQuestion.part_type.startsWith('read_fill_blank_word_bank'))
                ) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {(currentQuestion.options || []).map((optText, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                      const isSelected = userAnswers[currentQuestion.id] === optIdx;

                      let optionColor =
                        'border-[var(--color-border)] bg-[var(--color-background)] hover:border-teal-400 dark:hover:border-teal-600 text-[var(--color-text-primary)]';

                      if (checkedInfo) {
                        if (optIdx === checkedInfo.correctAnswer) {
                          optionColor =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold';
                        } else if (isSelected && !checkedInfo.isCorrect) {
                          optionColor =
                            'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 font-bold';
                        }
                      } else if (isSelected) {
                        optionColor =
                          'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold shadow-xs';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          data-testid={`exam-option-${letter.toLowerCase()}`}
                          data-option-index={optIdx}
                          aria-label={`Phương án ${letter}: ${optText}`}
                          onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                          className={`relative p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${optionColor}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {letter}
                          </span>

                          <div className="space-y-0.5 flex-1 min-w-0">
                            {(() => {
                              const { hanzi: cleanOpt, pinyin: inlineOptPinyin } = splitHanziAndPinyin(optText);
                              const displayOptPinyin = currentQuestion.options_pinyin?.[optIdx] || inlineOptPinyin || getSentencePinyin(cleanOpt.replace(/^[A-Z]\.\s*/, ''));
                              const displayOptText = isQuestionPinyinAllowed ? cleanOpt : sanitizeHanziOnly(optText);

                              return (
                                <>
                                  {isQuestionPinyinAllowed && (
                                    <div
                                      data-testid={`option-pinyin-${letter.toLowerCase()}`}
                                      className="font-mono text-[11px] text-teal-600 dark:text-teal-400 select-none"
                                    >
                                      {displayOptPinyin}
                                    </div>
                                  )}
                                  <span
                                    data-testid={`option-hanzi-${letter.toLowerCase()}`}
                                    className="text-sm sm:text-base font-medium break-words block"
                                  >
                                    {displayOptText}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Practice Mode: Instant Check Button and Rich Explanation */}
              {!isExamMode && (
                <div className="pt-3 border-t border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    {(() => {
                      const isCurrentWriting = currentQuestion.section === 'writing' || currentQuestion.part_type?.startsWith('write_');
                      const userAnsVal = userAnswers[currentQuestion.id];
                      const hasCurrentAns = isCurrentWriting
                        ? (typeof userAnsVal === 'string' && userAnsVal.trim().length > 0) ||
                          typeof userAnsVal === 'number' ||
                          Boolean(essayDrafts[currentQuestion.id]?.trim())
                        : typeof userAnsVal === 'number';
                      return (
                        <button
                          type="button"
                          onClick={() => handleCheckPracticeAnswer(currentQuestion)}
                          disabled={!hasCurrentAns}
                          className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                          <Check className="w-4 h-4" />
                          <span>Kiểm tra đáp án</span>
                        </button>
                      );
                    })()}
                  </div>

                  {checkedInfo && (() => {
                    const isWriting = currentQuestion.section === 'writing' || currentQuestion.part_type?.startsWith('write_');
                    return (
                      <div
                        data-testid="practice-feedback-banner"
                        className={`p-4 rounded-xl border space-y-2.5 animate-in fade-in ${
                          checkedInfo.isCorrect
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            {checkedInfo.isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            )}
                            <span
                              className={
                                checkedInfo.isCorrect
                                  ? 'text-emerald-800 dark:text-emerald-200'
                                  : 'text-rose-800 dark:text-rose-200'
                              }
                            >
                              {checkedInfo.isCorrect ? 'Chính xác!' : 'Chưa chính xác.'}
                            </span>
                          </div>

                          {Boolean(checkedInfo.explanation_vi) && (
                            <button
                              type="button"
                              data-testid="btn-toggle-practice-explanation"
                              onClick={() => setShowPracticeExplanation((prev) => !prev)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs transition-all cursor-pointer"
                            >
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span>{showPracticeExplanation ? 'Ẩn giải thích' : 'Xem giải thích'}</span>
                              {showPracticeExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm pl-7 flex items-center gap-1.5 text-[var(--color-text-primary)]">
                          <span className="font-semibold text-[var(--color-text-secondary)]">
                            {isWriting ? 'Bài viết mẫu tham khảo:' : 'Đáp án đúng:'}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {checkedInfo.correctAnswerText && checkedInfo.correctAnswerText !== 'A'
                              ? checkedInfo.correctAnswerText
                              : isWriting
                              ? currentQuestion.explanation_vi || 'Xem bài viết mẫu tham khảo'
                              : formatCorrectAnswerText(currentQuestion.options, checkedInfo.correctAnswer)}
                          </span>
                        </div>

                        {showPracticeExplanation && checkedInfo.explanation_vi && (
                          <div className="mt-2 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-slate-800 dark:text-slate-200 space-y-2 animate-in fade-in">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Giải thích đáp án & Trọng điểm lưu ý:</span>
                            </div>
                            <div className="pl-5">
                              {renderFormattedExplanation(checkedInfo.explanation_vi)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="py-2 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước (←)</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <span>Phím tắt:</span>
                  <kbd className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono">1-4</kbd>
                  <kbd className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono">← / →</kbd>
                  <kbd className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono">F</kbd>
                  <kbd className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono">P</kbd>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="py-2 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <span>Câu sau (→)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar (1 col on desktop) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Bảng Điều Hướng (1..{totalQ})
                </h4>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  {answeredCount}/{totalQ}
                </span>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                  <span>Đã làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700"></span>
                  <span>Chưa làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm ring-2 ring-blue-500"></span>
                  <span>Đang chọn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-400"></span>
                  <span>Gắn cờ (F)</span>
                </div>
              </div>

              {/* Matrix of numbers */}
              <div className="grid grid-cols-5 gap-1.5 max-h-[360px] overflow-y-auto p-1">
                {questions.map((q, idx) => {
                  const isAnswered = isQuestionAnswered(q.id);
                  const isCurrent = idx === currentIndex;
                  const isFlagged = Boolean(flaggedQuestions[q.id]);

                  let btnStyle =
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                  if (isAnswered) {
                    btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                  }

                  if (isFlagged) {
                    btnStyle =
                      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-400 font-bold';
                  }

                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-blue-500 ring-offset-1 font-extrabold';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative h-9 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                      title={`Câu ${idx + 1}`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <Flag className="w-2.5 h-2.5 text-amber-500 fill-amber-500 absolute top-0.5 right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // RENDER VIEW: 4. RESULTS & FULL REVIEW
  // =========================================================================
  const renderResultView = () => {
    if (!scoreResult) return null;

    const { totalScore, maxScore, passScore, percentage, passed, timeSpentSeconds, sectionScores, detailedReview } =
      scoreResult;

    const formattedTime = formatTime(timeSpentSeconds);

    // Filter review questions
    const filteredReview = detailedReview.filter((item) => {
      if (reviewFilter === 'wrong') return !item.isCorrect;
      if (reviewFilter === 'flagged') return Boolean(flaggedQuestions[item.id]);
      return true;
    });

    // Radar chart data for Recharts
    const radarData = [
      {
        subject: '听力 (Nghe hiểu)',
        value: sectionScores['listening'] ? sectionScores['listening'].percentage : 80,
      },
      {
        subject: '阅读 (Đọc hiểu)',
        value: sectionScores['reading'] ? sectionScores['reading'].percentage : 75,
      },
      {
        subject: '书写 (Viết / Điền từ)',
        value: sectionScores['writing'] ? sectionScores['writing'].percentage : 70,
      },
      {
        subject: 'Phản xạ & Tốc độ',
        value: Math.min(100, Math.round((percentage * 1.1) / 5) * 5),
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Score Hero Banner */}
        <div
          className={`rounded-3xl p-6 sm:p-8 border shadow-xl text-white ${
            passed
              ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 border-emerald-500/30'
              : 'bg-gradient-to-br from-rose-700 via-red-800 to-amber-900 border-rose-500/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Kết Quả Khảo Thí HSK {selectedLevel}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {passed ? 'ĐỖ (合格) 🎉' : 'CHƯA ĐẠT (未合格)'}
              </h2>
              <p className="text-sm text-teal-100 max-w-xl">
                {passed
                  ? `Chúc mừng bạn đã vượt qua kỳ thi thử HSK ${selectedLevel} với kết quả xuất sắc! Điểm số đạt yêu cầu chuẩn CLEC.`
                  : `Bạn chưa đạt ngưỡng 60% tổng điểm (${passScore}/${maxScore} điểm). Hãy ôn tập lại các câu sai trong Sổ tay câu sai!`}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 min-w-[140px] text-center">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{totalScore}</span>
              <span className="text-xs text-teal-100 font-semibold mt-1">
                / {maxScore} điểm ({percentage}%)
              </span>
              <span className="text-[11px] text-amber-300 font-mono mt-0.5">
                Điểm chuẩn: {passScore}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 mt-4 border-t border-white/20 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-200" />
              <span>Thời gian hoàn thành: {formattedTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Số câu đúng: {detailedReview.filter((r) => r.isCorrect).length}/{detailedReview.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Thưởng hoàn thành: +{passed ? '150' : '50'} XP</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Skill & Topic Breakdown (Recharts Radar & Progress Bars) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Radar Chart */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>Biểu Đồ Radar Chẩn Đoán Kỹ Năng</span>
              </h3>
              <span className="text-xs text-[var(--color-text-secondary)]">Thang 0 - 100%</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--color-border)" />
                  <Radar
                    name="Độ chính xác"
                    dataKey="value"
                    stroke="#0d9488"
                    fill="#14b8a6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section Accuracy Cards */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Phân Tích Chi Tiết Từng Phần Thi</span>
            </h3>

            <div className="space-y-3.5 pt-1">
              {Object.entries(sectionScores).map(([secKey, secVal]) => (
                <div key={secKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {getSectionName(secKey)}
                    </span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                      {secVal.correct}/{secVal.total} câu ({secVal.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        secVal.percentage >= 80
                          ? 'bg-emerald-500'
                          : secVal.percentage >= 60
                          ? 'bg-teal-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${secVal.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 text-xs text-[var(--color-text-secondary)] space-y-1">
              <strong className="text-teal-800 dark:text-teal-200 block">Khuyến nghị lộ trình học tập:</strong>
              <p>
                Toàn bộ {detailedReview.filter((r) => !r.isCorrect).length} câu trả lời chưa đúng đã được tự động lưu
                vào <strong>Sổ tay câu sai (错题本)</strong>. Hãy bấm nút dưới đây để luyện lại các câu hỏi này!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleStartMockExam(selectedLevel)}
              className="py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi lại đề khác (HSK {selectedLevel})</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('notebook')}
              className="py-2.5 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text-primary)] font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Mở Sổ tay câu sai ({wrongAnswers.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBackToHall}
            className="py-2.5 px-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold text-xs cursor-pointer transition-all"
          >
            Về sảnh chính
          </button>
        </div>

        {/* Full Review Mode */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
            <div>
              <h3 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-teal-600" />
                <span>Xem Lại Toàn Bộ Bài Làm (Full Review Mode)</span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Kiểm tra chi tiết từng câu hỏi, đối chiếu đáp án của bạn với đáp án chuẩn và đọc lời giải thích tiếng Việt.
              </p>
            </div>

            {/* Filter review buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs">
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold shadow-xs'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                Tất cả ({detailedReview.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('wrong')}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                  reviewFilter === 'wrong'
                    ? 'bg-rose-500 text-white font-bold shadow-xs'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                Câu sai ({detailedReview.filter((r) => !r.isCorrect).length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('flagged')}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                  reviewFilter === 'flagged'
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-xs'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                Có gắn cờ ({detailedReview.filter((r) => flaggedQuestions[r.id]).length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="btn-toggle-all-review-explanations"
                onClick={toggleAllReviewExplanations}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-2xs"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{allReviewExplanationsExpanded ? 'Ẩn tất cả giải thích' : 'Hiện tất cả giải thích'}</span>
                {allReviewExplanationsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* List of reviewed questions */}
          <div className="space-y-4 pt-2">
            {filteredReview.map((item, idx) => {
              const isCorrect = item.isCorrect;
              const userLetter =
                typeof item.userAnswer === 'number'
                  ? item.userAnswer >= 0
                    ? String.fromCharCode(65 + item.userAnswer)
                    : 'Chưa làm'
                  : item.userAnswer || 'Chưa làm';
              const correctLetter = String.fromCharCode(65 + item.correctAnswer);

              return (
                <div
                  key={item.id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                    isCorrect
                      ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-rose-300 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.item_number}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {getSectionName(item.section)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Đúng
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Sai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stem */}
                  <div className="space-y-1">
                    {showPinyin && (
                      <div className="font-mono text-xs text-teal-600 dark:text-teal-400">
                        {item.pinyin_stem || getSentencePinyin(item.stem)}
                      </div>
                    )}
                    <div className="text-base font-bold text-[var(--color-text-primary)]">{item.stem}</div>
                  </div>

                  {/* Stem Illustration if any */}
                  {Boolean(
                    item.illustration &&
                    (!item.options_images || item.options_images.length === 0)
                  ) && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-sm">
                      <HSKIllustrationCanvas
                        scene={item.illustration}
                        aspectRatio="4/3"
                        heightClass="h-32 sm:h-36"
                        badgeLabel="Hình minh họa"
                        caption={item.illustration}
                        showZoomButton={true}
                        onZoom={() =>
                          setLightboxImage({
                            isOpen: true,
                            title: item.illustration || 'Hình minh họa',
                            scene: item.illustration,
                            caption: item.stem,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Options */}
                  {item.options_images && item.options_images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      {(item.options || []).map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isCorrectOpt = optIdx === item.correctAnswer;
                        const isUserOpt = optIdx === item.userAnswer;
                        const imgDesc = item.options_images![optIdx];

                        let cardStyle = 'bg-[var(--color-background)] border-[var(--color-border)]';
                        if (isCorrectOpt) {
                          cardStyle =
                            'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20';
                        } else if (isUserOpt && !isCorrect) {
                          cardStyle =
                            'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 font-bold text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 ${cardStyle}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center bg-white/60 dark:bg-black/30">
                                {optLetter}
                              </span>
                              {isCorrectOpt && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  ✓ Đáp án đúng
                                </span>
                              )}
                              {isUserOpt && !isCorrectOpt && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                  ✗ Bạn chọn
                                </span>
                              )}
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800/60">
                              <HSKIllustrationCanvas
                                scene={imgDesc}
                                aspectRatio="4/3"
                                heightClass="h-20 sm:h-24"
                                isOptionCard={true}
                                showZoomButton={false}
                              />
                            </div>
                            <span className="text-center font-medium line-clamp-1">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : item.options && item.options.length > 0 && !(item.section === 'writing' || item.part_type?.startsWith('write_')) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {item.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isCorrectOpt = optIdx === item.correctAnswer;
                        const isUserOpt = optIdx === item.userAnswer;

                        let style = 'bg-[var(--color-background)] border-[var(--color-border)]';
                        if (isCorrectOpt) {
                          style =
                            'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200';
                        } else if (isUserOpt && !isCorrect) {
                          style =
                            'bg-rose-100 dark:bg-rose-950/60 border-rose-500 font-bold text-rose-900 dark:text-rose-200';
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${style}`}>
                            <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center bg-white/60 dark:bg-black/30">
                              {optLetter}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Explanation Card / Writing Model Essay */}
                  {item.section === 'writing' || item.part_type?.startsWith('write_') ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-amber-900 dark:text-amber-200">
                            Bài làm của bạn:
                          </div>
                          {(() => {
                            const uAns = userAnswers[item.id] || item.userAnswer;
                            const essayStr = typeof uAns === 'string' ? uAns.trim() : '';
                            const charCnt = (essayStr.match(/[\u4e00-\u9fa5]/g) || []).length;
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                {charCnt} chữ Hán
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[var(--color-text-primary)] font-medium whitespace-pre-wrap leading-relaxed">
                          {(() => {
                            const uAns = userAnswers[item.id];
                            const iAns = item.userAnswer;
                            if (typeof uAns === 'string' && uAns.trim()) return uAns;
                            if (typeof iAns === 'string' && iAns.trim()) return iAns;
                            return '(Chưa nhập nội dung bài viết)';
                          })()}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>参考范文 (Bài văn / Câu mẫu chuẩn HSK):</span>
                        </div>
                        <div className="text-[var(--color-text-primary)] font-medium leading-relaxed whitespace-pre-wrap">
                          {item.explanation_vi || 'Đáp án tự luận mẫu theo chuẩn HSK.'}
                        </div>
                      </div>

                      {/* Feature 19 & 20: CTI Rubric & Candidate Self-Assessment */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Tiêu chí chấm điểm CTI (CTI Rubric Standards)</span>
                          </div>
                          <button
                            type="button"
                            disabled={isEvaluatingAi[item.id]}
                            onClick={() => handleAiEvaluateWriting(item)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isEvaluatingAi[item.id] ? 'Đang chấm điểm...' : '🤖 AI Chấm điểm & Gợi ý sửa bài'}</span>
                          </button>
                        </div>

                        {/* Criteria Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="font-bold text-slate-700 dark:text-slate-300">1. Độ dài (Length - 30%)</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Đạt đủ số lượng chữ Hán quy định theo chuẩn đề thi.</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="font-bold text-slate-700 dark:text-slate-300">2. Ngữ pháp (Grammar - 30%)</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Trật tự từ chuẩn, liên từ kết nối, dấu câu tiếng Trung chính xác.</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="font-bold text-slate-700 dark:text-slate-300">3. Từ vựng & Chủ đề (40%)</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sử dụng đầy đủ từ khóa yêu cầu, bám sát đề tài và ngữ cảnh.</div>
                          </div>
                        </div>

                        {/* AI Evaluation feedback card if evaluated */}
                        {aiEvaluations[item.id] && (
                          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                            <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
                              <span>Kết quả AI đánh giá:</span>
                              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                {aiEvaluations[item.id].score} / {aiEvaluations[item.id].maxScore} điểm
                              </span>
                            </div>
                            <p className="text-indigo-950 dark:text-indigo-300 text-[11px] leading-relaxed">
                              {aiEvaluations[item.id].feedbackVi}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-indigo-200/60 dark:border-indigo-900/60">
                              {(aiEvaluations[item.id].rubricCriteria || []).map((crit: any, cIdx: number) => (
                                <div key={cIdx} className="text-[10px] text-slate-600 dark:text-slate-300">
                                  <span className="font-semibold">{crit.name}:</span> {crit.awardedPoints}/{crit.maxPoints} đ ({crit.note})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Self-Assessment Slider */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Tự chấm điểm bài viết:</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                              {selfScores[item.id] !== undefined ? selfScores[item.id] : (aiEvaluations[item.id]?.score ?? 0)} / {aiEvaluations[item.id]?.maxScore ?? (selectedLevel === 6 ? 100 : selectedLevel === 5 ? (item.part_type?.includes('200') ? 60 : 30) : 15)} điểm
                            </span>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-64">
                            <input
                              type="range"
                              min={0}
                              max={aiEvaluations[item.id]?.maxScore ?? (selectedLevel === 6 ? 100 : selectedLevel === 5 ? (item.part_type?.includes('200') ? 60 : 30) : 15)}
                              value={selfScores[item.id] !== undefined ? selfScores[item.id] : (aiEvaluations[item.id]?.score ?? 0)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setSelfScores((prev) => ({ ...prev, [item.id]: val }));
                              }}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (

                    <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="font-semibold text-[var(--color-text-primary)]">
                          Đáp án của bạn: <span className={isCorrect ? 'text-emerald-600' : 'text-rose-600 font-bold'}>{userLetter}</span> • Đáp án đúng: <span className="text-emerald-600 font-bold">{formatCorrectAnswerText(item.options, item.correctAnswer)}</span>
                        </div>
                        {Boolean(item.explanation_vi) && (
                          <button
                            type="button"
                            data-testid={`btn-toggle-review-explanation-${item.id}`}
                            onClick={() => toggleReviewExplanation(item.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer w-fit"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span>{expandedReviewExplanations[item.id] ? 'Ẩn giải thích' : 'Xem giải thích'}</span>
                            {expandedReviewExplanations[item.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {expandedReviewExplanations[item.id] && item.explanation_vi && (
                        <div className="mt-2 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-slate-800 dark:text-slate-200 space-y-2 animate-in fade-in">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>Giải thích chi tiết & Trọng điểm lưu ý:</span>
                          </div>
                          <div className="pl-5">
                            {renderFormattedExplanation(item.explanation_vi)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Listening Question: Full Chinese Transcript & Replay in Review */}
                  {isListeningQuestion(item) && (
                    <div
                      data-testid="review-listening-transcript"
                      className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-900/40">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                          <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Kịch Bản Lời Thoại Bài Nghe (Listening Transcript)</span>
                        </div>
                        <button
                          type="button"
                          data-testid="btn-replay-review-audio"
                          onClick={() => {
                            if (item.audio_url) {
                              playAudioUrl(item.audio_url, 0.9);
                            } else {
                              const text = item.audio_text || item.stem;
                              if (text) playChineseAudio(text, 0.9);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe lại audio</span>
                        </button>
                      </div>
                      <div className="space-y-1.5 text-slate-800 dark:text-slate-100">
                        {((item.audio_text || item.stem).split('\n')).map((line, lineIdx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;
                          return (
                            <div key={lineIdx} className="space-y-0.5">
                              {showPinyin && (
                                <div className="font-mono text-xs text-teal-600 dark:text-teal-400">
                                  {getSentencePinyin(trimmed)}
                                </div>
                              )}
                              <div className="text-sm sm:text-base font-semibold font-serif leading-relaxed">
                                {trimmed}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER VIEW: 5. WRONG ANSWERS NOTEBOOK (错题本)
  // =========================================================================
  const renderNotebookView = () => {
    // Filter wrong answers
    const filteredList = wrongAnswers.filter((item) => {
      if (notebookLevelFilter !== 'all' && item.level !== notebookLevelFilter) return false;
      if (notebookSkillFilter !== 'all' && item.section !== notebookSkillFilter) return false;
      return true;
    });

    const unmasteredCount = wrongAnswers.filter((w) => !w.mastered).length;

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Notebook Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-amber-200" />
                <span>Kho Lưu Trữ Ôn Tập Cá Nhân</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Sổ Tay Câu Sai (错题本)
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 max-w-xl leading-relaxed">
                Tự động thu thập các câu trả lời chưa đúng trong phòng thi và chế độ luyện tập. Giúp bạn tập trung ôn
                luyện và xóa bỏ các lỗ hổng kiến thức trước kỳ thi thật!
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 text-center min-w-[130px]">
              <span className="text-3xl sm:text-4xl font-black">{unmasteredCount}</span>
              <span className="text-xs text-amber-100 font-semibold mt-1">Câu cần luyện</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-white/20">
            <button
              type="button"
              onClick={handleRetestWrongQuestions}
              disabled={unmasteredCount === 0}
              className="py-2.5 px-4 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4 text-orange-600" />
              <span>Luyện lại các câu sai ({unmasteredCount})</span>
            </button>

            <button
              type="button"
              onClick={handleBackToHall}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs cursor-pointer transition-all"
            >
              Quay lại sảnh
            </button>
          </div>
        </div>

        {/* Notebook Filters */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--color-text-secondary)]">Cấp độ:</span>
            {(['all', 1, 2, 3, 4, 5] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setNotebookLevelFilter(lvl)}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  notebookLevelFilter === lvl
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}
              >
                {lvl === 'all' ? 'Tất cả cấp độ' : `HSK ${lvl}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--color-text-secondary)]">Kỹ năng:</span>
            {['all', 'listening', 'reading', 'writing'].map((sk) => (
              <button
                key={sk}
                type="button"
                onClick={() => setNotebookSkillFilter(sk)}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  notebookSkillFilter === sk
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}
              >
                {sk === 'all'
                  ? 'Tất cả'
                  : sk === 'listening'
                  ? 'Nghe'
                  : sk === 'reading'
                  ? 'Đọc'
                  : 'Viết'}
              </button>
            ))}
          </div>
        </div>

        {/* List of wrong questions */}
        {filteredList.length === 0 ? (
          <div className="p-12 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-base text-[var(--color-text-primary)]">
              Không có câu sai nào trong mục này!
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
              Bạn đã làm đúng các câu hỏi hoặc đã làm chủ toàn bộ bài tập. Hãy tiếp tục làm thêm các đề thi mới!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((item) => {
              const correctLetter = String.fromCharCode(65 + item.correctAnswer);
              const userLetter =
                typeof item.userAnswer === 'number'
                  ? item.userAnswer >= 0
                    ? String.fromCharCode(65 + item.userAnswer)
                    : 'Chưa chọn'
                  : item.userAnswer || 'Chưa chọn';

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border space-y-3.5 transition-all ${
                    item.mastered
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
                        HSK {item.level}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {getSectionName(item.section)}
                      </span>
                      {item.mastered && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                          ✓ Đã thành thạo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveFromNotebook(item.id)}
                        className="text-xs text-slate-400 hover:text-red-500 cursor-pointer"
                        title="Xóa khỏi sổ tay"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Stem */}
                  <div className="space-y-1">
                    {showPinyin && (
                      <div className="font-mono text-xs text-teal-600 dark:text-teal-400">
                        {item.pinyin_stem || getSentencePinyin(item.stem)}
                      </div>
                    )}
                    <div className="text-base font-bold text-[var(--color-text-primary)]">{item.stem}</div>
                  </div>

                  {/* Stem Illustration if any */}
                  {Boolean(
                    item.illustration &&
                    (!item.options_images || item.options_images.length === 0)
                  ) && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-sm">
                      <HSKIllustrationCanvas
                        scene={item.illustration}
                        aspectRatio="4/3"
                        heightClass="h-32 sm:h-36"
                        badgeLabel="Hình minh họa"
                        caption={item.illustration}
                        showZoomButton={true}
                        onZoom={() =>
                          setLightboxImage({
                            isOpen: true,
                            title: item.illustration || 'Hình minh họa',
                            scene: item.illustration,
                            caption: item.stem,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Options */}
                  {item.options_images && item.options_images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      {(item.options || []).map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isCorrectOpt = optIdx === item.correctAnswer;
                        const isUserOpt = optIdx === item.userAnswer;
                        const imgDesc = item.options_images![optIdx];

                        let cardStyle = 'bg-[var(--color-background)] border-[var(--color-border)]';
                        if (isCorrectOpt) {
                          cardStyle =
                            'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20';
                        } else if (isUserOpt) {
                          cardStyle =
                            'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 font-bold text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 ${cardStyle}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center bg-white/60 dark:bg-black/30">
                                {optLetter}
                              </span>
                              {isCorrectOpt && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  ✓ Đáp án đúng
                                </span>
                              )}
                              {isUserOpt && !isCorrectOpt && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                  ✗ Bạn chọn
                                </span>
                              )}
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800/60">
                              <HSKIllustrationCanvas
                                scene={imgDesc}
                                aspectRatio="4/3"
                                heightClass="h-20 sm:h-24"
                                isOptionCard={true}
                                showZoomButton={false}
                              />
                            </div>
                            <span className="text-center font-medium line-clamp-1">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : item.section === 'writing' || item.part_type?.startsWith('write_') ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                        <div className="font-bold text-amber-900 dark:text-amber-200 mb-1">
                          Bài làm lần trước:
                        </div>
                        <div className="text-[var(--color-text-primary)] font-medium whitespace-pre-wrap leading-relaxed">
                          {typeof item.userAnswer === 'string' && item.userAnswer.trim()
                            ? item.userAnswer
                            : '(Chưa nhập nội dung bài viết)'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                        <div className="font-bold text-emerald-900 dark:text-emerald-200">
                          参考范文 (Bài văn / Câu mẫu chuẩn HSK):
                        </div>
                        <div className="text-[var(--color-text-primary)] font-medium leading-relaxed whitespace-pre-wrap">
                          {item.explanation_vi || 'Đáp án tự luận mẫu theo chuẩn HSK.'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.options && item.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {item.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isCorrect = optIdx === item.correctAnswer;
                            const isUser = optIdx === item.userAnswer;

                            let style = 'bg-[var(--color-background)] border-[var(--color-border)]';
                            if (isCorrect) {
                              style =
                                'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200';
                            } else if (isUser) {
                              style =
                                'bg-rose-100 dark:bg-rose-950/60 border-rose-500 font-bold text-rose-900 dark:text-rose-200';
                            }

                            return (
                              <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${style}`}>
                                <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center bg-white/60 dark:bg-black/30">
                                  {letter}
                                </span>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation */}
                      <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="font-semibold text-[var(--color-text-primary)]">
                            Lần làm trước: <span className="text-rose-600 font-bold">{userLetter}</span> • Đáp án chuẩn:{' '}
                            <span className="text-emerald-600 font-bold">{formatCorrectAnswerText(item.options, item.correctAnswer)}</span>
                          </div>
                          {Boolean(item.explanation_vi) && (
                            <button
                              type="button"
                              data-testid={`btn-toggle-nb-explanation-${item.questionId}`}
                              onClick={() => toggleNotebookExplanation(item.questionId)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer w-fit"
                            >
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span>{expandedNotebookExplanations[item.questionId] ? 'Ẩn giải thích' : 'Xem giải thích'}</span>
                              {expandedNotebookExplanations[item.questionId] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>

                        {expandedNotebookExplanations[item.questionId] && item.explanation_vi && (
                          <div className="mt-2 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-slate-800 dark:text-slate-200 space-y-2 animate-in fade-in">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Giải thích chi tiết & Trọng điểm lưu ý:</span>
                            </div>
                            <div className="pl-5">
                              {renderFormattedExplanation(item.explanation_vi)}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // MAIN RENDER SWITCH
  // =========================================================================
  return (
    <div className="space-y-6 w-full">
      {renderResumeModal()}
      {renderLightboxModal()}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />

      {currentView === 'hall' && renderHallView()}
      {(currentView === 'exam' || currentView === 'practice') && renderExamRoom()}
      {currentView === 'result' && renderResultView()}
      {currentView === 'notebook' && renderNotebookView()}
    </div>
  );
};

export default HSKMockExam;
